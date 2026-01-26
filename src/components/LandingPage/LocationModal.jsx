import React, { useEffect, useState, useRef } from 'react';
import { Modal, Slider } from 'antd';
import { loadGoogleMaps, t } from '@/utils';
import { MdClose } from 'react-icons/md';
import { useRouter } from 'next/navigation';
// Using AutocompleteService directly instead of Autocomplete component
// because componentRestrictions only supports 5 countries max
import { useDispatch, useSelector } from 'react-redux';
import { BiCurrentLocation } from 'react-icons/bi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getKilometerRange, saveCity, setKilometerRange } from '@/redux/reuducer/locationSlice';
import { settingsData } from '@/redux/reuducer/settingSlice';
import LocationWithRadius from '../Layout/LocationWithRadius';
import { getLanguageApi } from '@/utils/api';
import { setCurrentLanguage } from '@/redux/reuducer/languageSlice';
import { setCurrentCountry } from '@/redux/reuducer/countrySlice';
import { getCountryByCode, SUPPORTED_COUNTRIES_UPPER, COUNTRIES } from '@/config/countries';
import { setCurrentCurrency } from '@/redux/reuducer/currencySlice';


const LocationModal = ({ IsLocationModalOpen, OnHide }) => {

    const dispatch = useDispatch()
    const cityData = useSelector(state => state?.Location?.cityData);
    const lat = cityData?.lat
    const lng = cityData?.long
    const { isLoaded } = loadGoogleMaps();
    const [googleMaps, setGoogleMaps] = useState(null);
    const router = useRouter();
    const systemSettingsData = useSelector(settingsData);
    const settings = systemSettingsData?.data;
    const min_range = Number(settings?.min_length)
    const max_range = Number(settings?.max_length)
    const searchBoxRef = useRef(null);
    const inputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const autocompleteServiceRef = useRef(null);
    const placesServiceRef = useRef(null);
    const placeDetailsCacheRef = useRef(new Map()); // Cache for place details to reduce API calls
    const [isValidLocation, setIsValidLocation] = useState(false);
    const [selectedCity, setSelectedCity] = useState(cityData);
    const [KmRange, setKmRange] = useState(0)
    const [position, setPosition] = useState({ lat, lng });
    const [predictions, setPredictions] = useState([]);
    const [showPredictions, setShowPredictions] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
    const searchRequestRef = useRef(null);
    const appliedKilometer = useSelector(getKilometerRange)

    useEffect(() => {
        if (IsLocationModalOpen) {
            setSelectedCity(cityData)
            setInputValue(cityData?.formatted_address || cityData?.formattedAddress || '')
        }
    }, [IsLocationModalOpen, cityData])


    useEffect(() => {
        if (isLoaded && window.google) {
            setGoogleMaps(window.google);
            // Initialize AutocompleteService and PlacesService
            if (window.google.maps.places) {
                autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
                placesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'));
            }
        }
    }, [isLoaded]);

    // Only allow the configured Vidaki countries
    const allowedCountries = SUPPORTED_COUNTRIES_UPPER;

    // Set restrictions on search box after it loads
    useEffect(() => {
        if (searchBoxRef.current && allowedCountries.length > 0 && googleMaps) {
            // Wait a bit for StandaloneSearchBox to fully initialize
            const timer = setTimeout(() => {
                const searchBox = searchBoxRef.current;
                
                // Try multiple ways to access and set restrictions
                if (searchBox) {
                    // Method 1: Direct setComponentRestrictions if available
                    if (typeof searchBox.setComponentRestrictions === 'function') {
                        searchBox.setComponentRestrictions({
                            country: allowedCountries.map(code => code.toLowerCase())
                        });
                    }
                    
                    // Method 2: Access through searchBox properties
                    if (searchBox.autocomplete && typeof searchBox.autocomplete.setComponentRestrictions === 'function') {
                        searchBox.autocomplete.setComponentRestrictions({
                            country: allowedCountries.map(code => code.toLowerCase())
                        });
                    }
                    
                    // Method 3: Find the input and get/create Autocomplete
                    const input = inputRef.current || searchBox.inputElement || 
                                 (searchBox.getPlaces && document.querySelector('input[type="text"]'));
                    
                    if (input && googleMaps.places) {
                        let autocomplete = googleMaps.places.Autocomplete.getInstance(input);
                        if (autocomplete) {
                            autocomplete.setComponentRestrictions({
                                country: allowedCountries.map(code => code.toLowerCase())
                            });
                        }
                    }
                }
            }, 200);
            
            return () => clearTimeout(timer);
        }
    }, [isLoaded, allowedCountries, googleMaps, IsLocationModalOpen]);
    const languageBackendCode = {
        "AL": "sq", 
        "AM": "hy",
        "BY": "be",
        "BA": "bs",
        "GR": "el",
        "DK": "da",
        "EE": "et",
        "GE": "ka",
        "KZ": "kk",
        "RS": "sr",
        "SI": "sl",
        "SE": "sv",
        "TM": "tk",
        "UA": "uk",
    }
    const getCountryCodeFromPlace = (place) => {
        if (!place?.address_components) return null;

        const countryComponent = place.address_components.find(comp =>
            comp.types.includes("country")
        );

        return countryComponent?.short_name?.toUpperCase() || null;
    };
    
    // Validate that a place is a city/town/village (not a street address)
    // Since we use types: ['(cities)'], Google already filters to cities,
    // so we mainly need to reject clear street addresses
    const isValidCity = (place) => {
        if (!place?.address_components) return false;

        // Reject if it has street_number (clear indicator of street address)
        const hasStreetNumber = place.address_components.some(component =>
            component.types.includes('street_number')
        );
        
        if (hasStreetNumber) return false;

        // Check if place has city-level types (more lenient since Google already filtered)
        const allowedTypes = [
            'locality',                    // City/town
            'postal_town',                 // Postal town
            'administrative_area_level_2', // County/District
            'administrative_area_level_3', // Sub-district
            'administrative_area_level_1', // State/Province (sometimes used for cities)
            'sublocality',                 // Neighborhood
            'sublocality_level_1'          // Neighborhood level 1
        ];

        const hasCityType = place.address_components.some(component =>
            component.types.some(type => allowedTypes.includes(type))
        );

        // If it has city type, accept it (Google already filtered with (cities))
        // If no city type but also no street_number, still accept (might be a valid city variant)
        return hasCityType || !hasStreetNumber;
    };
    
    // Check if search term matches a country name
    const isCountryNameSearch = (searchTerm) => {
        if (!searchTerm) return false;
        const normalizedSearch = searchTerm.toLowerCase().trim();
        return Object.values(COUNTRIES).some(country => {
            const countryName = country.name.toLowerCase();
            // Exact match or starts with country name
            return countryName === normalizedSearch || 
                   countryName.startsWith(normalizedSearch) ||
                   normalizedSearch.startsWith(countryName);
        });
    };
    const switchLanguage = async (countryCode) => {
        let filteredCountry  = settings?.languages?.find(lng => lng.code?.toUpperCase() == countryCode?.toUpperCase());
        if(!filteredCountry){
            filteredCountry = {
             code: languageBackendCode[countryCode] || 'en'
            }
        }
        if(filteredCountry){
            const language_code = filteredCountry.code; 
            try {
                    const res = await getLanguageApi.getLanguage({ language_code, type: 'web' });
                    if (res?.data?.error === true) {
                        toast.error(res?.data?.message)
                    }
                    else {
                       
                        dispatch(setCurrentLanguage(res?.data?.data));
                    }
            } catch (error) {
                // Error handled silently
            }
        }
    }
    const handlePlacesChanged = (place = null) => {
        // If place is passed directly (from Autocomplete), use it
        // Otherwise, try to get from searchBoxRef (for StandaloneSearchBox compatibility)
        let selectedPlace = place;
        
        if (!selectedPlace && searchBoxRef.current) {
            if (typeof searchBoxRef.current.getPlace === 'function') {
                selectedPlace = searchBoxRef.current.getPlace();
            } else if (typeof searchBoxRef.current.getPlaces === 'function') {
        const places = searchBoxRef.current.getPlaces();
                selectedPlace = places && places.length > 0 ? places[0] : null;
            }
        }

        if (selectedPlace && selectedPlace.geometry) {
            const countryCode = getCountryCodeFromPlace(selectedPlace);

        if (!allowedCountries.includes(countryCode)) {
            toast.error("Vidaki does not offer platform coverage in that location.");
            setIsValidLocation(false);
            return;
        }
        
        // Validate it's a city/town (not a street address)
        if (!isValidCity(selectedPlace)) {
            toast.error("Please select a city or town, not a street address.");
            setIsValidLocation(false);
            return;
        }
            
            const cityData = {
                lat: selectedPlace.geometry.location.lat(),
                long: selectedPlace.geometry.location.lng(),
                city: selectedPlace.address_components.find(comp => comp.types.includes("locality"))?.long_name,
                state: selectedPlace.address_components.find(comp => comp.types.includes("administrative_area_level_1"))?.long_name,
                country: selectedPlace.address_components.find(comp => comp.types.includes("country"))?.long_name,
                countryCode : countryCode,
                formatted_address: selectedPlace.formatted_address
            };
            
            const newPosition = {
                lat: selectedPlace.geometry.location.lat(),
                lng: selectedPlace.geometry.location.lng(),
            }
            setPosition(newPosition)
            setSelectedCity(cityData);
            setInputValue(selectedPlace.formatted_address);
            setIsValidLocation(true);
        } else {
            setIsValidLocation(false);
        }
    };
    const getCurrentLocation = async () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const locationData = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };
                        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${locationData.latitude},${locationData.longitude}&key=${settings?.place_api_key}`);

                        if (response.data.error_message) {
                            toast.error(response.data.error_message)
                            return
                        }

                        let city = '';
                        let state = '';
                        let country = '';
                        let address = '';
                        let countryCode = '';

                        response.data.results.forEach(result => {
                            const addressComponents = result.address_components;
                            const getAddressComponent = (type) => {
                                const component = addressComponents.find(comp => comp.types.includes(type));
                                return component ? component.long_name : '';
                            };
                            if (!city) city = getAddressComponent("locality");
                            if (!state) state = getAddressComponent("administrative_area_level_1");
                            if (!country) country = getAddressComponent("country");
                            if (!countryCode) countryCode = getCountryCodeFromPlace(result);
                            if (!address) address = result.formatted_address;
                        });
                        if (!allowedCountries.includes(countryCode)) {
                            toast.error("Vidaki does not offer platform coverage in that location.");
                            setIsValidLocation(false);
                            return;
                        }
                        switchLanguage(countryCode);
                        const cityData = {
                            lat: locationData.latitude,
                            long: locationData.longitude,
                            city,
                            state,
                            country,
                            formattedAddress: address,
                            countryCode
                        };
                        setPosition({
                            lat: locationData.latitude,
                            lng: locationData.longitude
                        })
                        saveCity(cityData);
                        setSelectedCity(cityData);
                setInputValue(cityData.formattedAddress || address);
                        
                        // Update country routing state and redirect to country URL
                        const countryInfo = getCountryByCode(countryCode);
                        if (countryInfo) {
                            dispatch(setCurrentCountry({ 
                                code: countryInfo.code, 
                                name: countryInfo.name, 
                                detected: false 
                            }));
                            
                            // Update currency based on country
                            if (settings?.currencies) {
                                const matchingCurrency = settings.currencies.find(
                                    (currency) => currency.code?.toUpperCase() === countryInfo.currency?.toUpperCase()
                                );
                                if (matchingCurrency) {
                                    dispatch(setCurrentCurrency(matchingCurrency));
                                }
                            }
                            
                            router.push(`/${countryCode.toLowerCase()}`);
                        } else {
                            router.push('/');
                        }
                        handleClose()
                    } catch (error) {
                        console.error('Error fetching location data:', error);
                    }
                },
                (error) => {
                    toast.error(t('locationNotGranted'));
                }
            );
        } else {
            toast.error(t('geoLocationNotSupported'));
        }
    };

    const getLocationWithMap = async (pos) => {
        try {
            const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.lat},${pos.lng}&key=${settings?.place_api_key}`);
            if (response.data.error_message) {
                toast.error(response.data.error_message)
                return
            }
            let city = '';
            let state = '';
            let country = '';
            let address = '';
            let countryCode = '';
            response.data.results.forEach(result => {
                const addressComponents = result.address_components;
                const getAddressComponent = (type) => {
                    const component = addressComponents.find(comp => comp.types.includes(type));
                    return component ? component.long_name : '';
                };
                if (!city) city = getAddressComponent("locality");
                if (!state) state = getAddressComponent("administrative_area_level_1");
                if (!country) country = getAddressComponent("country");
                if (!countryCode) countryCode = getCountryCodeFromPlace(result);
                if (!address) address = result.formatted_address;
            });
            const locationData = {
                lat: pos.lat,
                long: pos.lng,
                city,
                state,
                country,
                formatted_address: address,
                countryCode
            };
            setSelectedCity(locationData);
            setInputValue(locationData.formatted_address || address);
            setIsValidLocation(true);
        } catch (error) {
            console.error('Error fetching location data:', error);
        }
    }

    const CloseIcon = (
        <div className="location-modal-close">
            <MdClose size={20} />
        </div>
    );

    useEffect(() => {
        if (window.google && isLoaded) {
            // Initialize any Google Maps API-dependent logic here
        }
    }, [isLoaded]);

    const handleSearch = (value) => {
        setInputValue(value);
        setSelectedCity({ city: value });
        setIsValidLocation(false);
        
        // Clear predictions if input is too short
        if (!value || value.length < 3) {
            setPredictions([]);
            setShowPredictions(false);
            setIsLoadingPredictions(false);
            // Cancel any pending requests
            if (searchRequestRef.current) {
                searchRequestRef.current = null;
            }
            return;
        }
        
        // Get autocomplete predictions and filter by allowed countries
        if (value && value.length > 2 && autocompleteServiceRef.current) {
            // Track this search request to prevent race conditions
            const currentSearch = value.toLowerCase().trim();
            searchRequestRef.current = currentSearch;
            setIsLoadingPredictions(true);
            
            autocompleteServiceRef.current.getPlacePredictions(
                {
                    input: value,
                    types: ['(cities)'], // Restrict to cities, towns, municipalities only
                    // Note: componentRestrictions only supports 5 countries max, so we filter client-side
                },
                (predictions, status) => {
                    // Check if this is still the current search (prevent race conditions)
                    if (searchRequestRef.current !== currentSearch) {
                        return;
                    }
                    
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                        // If searching by country name, make multiple requests to get more predictions
                        const isCountrySearch = isCountryNameSearch(value);
                        
                        // Collect all predictions (will be populated from multiple requests for country searches)
                        const allPredictionsMap = new Map();
                        predictions.forEach(p => allPredictionsMap.set(p.place_id, p));
                        
                        // Show initial predictions immediately (optimistic UI)
                        setPredictions(Array.from(allPredictionsMap.values()).map(p => ({ ...p, place: null })));
                        setShowPredictions(true);
                        
                        // Function to process and filter predictions
                        const processAndFilterPredictions = (predictionsToProcess) => {
                            if (!placesServiceRef.current || predictionsToProcess.length === 0) {
                                setIsLoadingPredictions(false);
                                return;
                            }
                            
                            // Limit to max 20 predictions to check (cost optimization)
                            const maxPredictionsToCheck = 20;
                            const predictionsToCheck = predictionsToProcess.slice(0, maxPredictionsToCheck);
                            
                            const validPredictions = [];
                            let completed = 0;
                            let pendingApiCalls = 0;
                            
                            predictionsToCheck.forEach((prediction) => {
                                // Check cache first to avoid duplicate API calls
                                const cached = placeDetailsCacheRef.current.get(prediction.place_id);
                                if (cached) {
                                    completed++;
                                    // Validate it's a city/town (not street address) and in allowed country
                                    if (cached.countryCode && allowedCountries.includes(cached.countryCode) && 
                                        cached.place && isValidCity(cached.place)) {
                                        validPredictions.push({
                                            ...prediction,
                                            place: cached.place
                                        });
                                    }
                                    
                                    if (completed === predictionsToCheck.length) {
                                        updatePredictionsState();
                                    }
                                    return;
                                }
                                
                                // Make API call if not cached
                                pendingApiCalls++;
                                placesServiceRef.current.getDetails(
                                    { placeId: prediction.place_id },
                                    (place, detailStatus) => {
                                        // Check if this is still the current search
                                        if (searchRequestRef.current !== currentSearch) {
                                            return;
                                        }
                                        
                                        completed++;
                                        
                                        if (detailStatus === window.google.maps.places.PlacesServiceStatus.OK && place) {
                                            const countryCode = getCountryCodeFromPlace(place);
                                            
                                            // Cache the result to avoid future API calls
                                            placeDetailsCacheRef.current.set(prediction.place_id, {
                                                place,
                                                countryCode
                                            });
                                            
                                            // Validate it's a city/town (not street address) and in allowed country
                                            if (countryCode && allowedCountries.includes(countryCode) && isValidCity(place)) {
                                                validPredictions.push({
                                                    ...prediction,
                                                    place: place
                                                });
                                            }
                                        }
                                        
                                        // Update state when all checks are done
                                        if (completed === predictionsToCheck.length) {
                                            updatePredictionsState();
                                        }
                                    }
                                );
                            });
                            
                            function updatePredictionsState() {
                                if (searchRequestRef.current === currentSearch) {
                                    // Update predictions with valid ones, keeping any existing valid predictions
                                    setPredictions(prev => {
                                        const prevValid = prev.filter(p => p.place);
                                        const combined = [...prevValid, ...validPredictions];
                                        // Remove duplicates by place_id
                                        const unique = combined.filter((p, index, self) => 
                                            index === self.findIndex(pp => pp.place_id === p.place_id)
                                        );
                                        return unique;
                                    });
                                    
                                    setIsLoadingPredictions(false);
                                }
                            }
                        };
                        
                        // Process initial predictions
                        processAndFilterPredictions(predictions);
                        
                        // For country searches, make additional requests with variations
                        // Always make additional requests for country searches to ensure we get results
                        if (isCountrySearch && autocompleteServiceRef.current) {
                            // Find the country object to get capital city name
                            const countryObj = Object.values(COUNTRIES).find(c => 
                                c.name.toLowerCase() === value.toLowerCase().trim() ||
                                value.toLowerCase().trim().startsWith(c.name.toLowerCase()) ||
                                c.name.toLowerCase().startsWith(value.toLowerCase().trim())
                            );
                            
                            // Build search variations - more comprehensive for better results
                            const searchVariations = [
                                `${value} city`,
                                `${value} capital`,
                                `cities in ${value}`,
                                `towns in ${value}`
                            ];
                            
                            // Add capital city search if we found the country
                            if (countryObj) {
                                // Common capital cities for major countries (can be expanded)
                                const capitalCities = {
                                    'AL': 'Tirana',
                                    'RO': 'Bucharest',
                                    'PL': 'Warsaw',
                                    'BG': 'Sofia',
                                    'GR': 'Athens',
                                    'TR': 'Ankara',
                                    'UA': 'Kyiv',
                                    'CZ': 'Prague',
                                    'SK': 'Bratislava',
                                    'HU': 'Budapest',
                                    'RS': 'Belgrade',
                                    'HR': 'Zagreb',
                                    'SI': 'Ljubljana',
                                    'BA': 'Sarajevo',
                                    'MK': 'Skopje',
                                    'MD': 'Chisinau',
                                    'EE': 'Tallinn',
                                    'LV': 'Riga',
                                    'LT': 'Vilnius',
                                    'FI': 'Helsinki',
                                    'DK': 'Copenhagen',
                                    'SE': 'Stockholm',
                                    'IS': 'Reykjavik',
                                    'DE': 'Berlin',
                                    'GE': 'Tbilisi',
                                    'AM': 'Yerevan',
                                    'AZ': 'Baku',
                                    'KZ': 'Nur-Sultan',
                                    'UZ': 'Tashkent',
                                    'TJ': 'Dushanbe',
                                    'TM': 'Ashgabat',
                                    'KG': 'Bishkek',
                                    'MN': 'Ulaanbaatar',
                                    'AF': 'Kabul',
                                    'BY': 'Minsk',
                                    'RU': 'Moscow',
                                    'CY': 'Nicosia'
                                };
                                
                                const capitalCity = capitalCities[countryObj.code];
                                if (capitalCity) {
                                    searchVariations.push(capitalCity);
                                }
                            }
                            
                            let pendingRequests = searchVariations.length;
                            
                            searchVariations.forEach((term, index) => {
                                setTimeout(() => {
                                    if (searchRequestRef.current !== currentSearch) return;
                                    
                                    autocompleteServiceRef.current.getPlacePredictions(
                                        {
                                            input: term,
                                            types: ['(cities)'], // Restrict to cities, towns, municipalities only
                                        },
                                        (additionalPredictions, additionalStatus) => {
                                            pendingRequests--;
                                            
                                            if (searchRequestRef.current !== currentSearch) return;
                                            
                                            if (additionalStatus === window.google.maps.places.PlacesServiceStatus.OK && additionalPredictions) {
                                                // Add new predictions, avoiding duplicates
                                                additionalPredictions.forEach(pred => {
                                                    if (!allPredictionsMap.has(pred.place_id)) {
                                                        allPredictionsMap.set(pred.place_id, pred);
                                                    }
                                                });
                                                
                                                // Update displayed predictions - merge with existing state
                                                setPredictions(prev => {
                                                    const prevMap = new Map(prev.map(p => [p.place_id, p]));
                                                    // Add new predictions, keeping existing place data if available
                                                    Array.from(allPredictionsMap.values()).forEach(p => {
                                                        if (!prevMap.has(p.place_id)) {
                                                            prevMap.set(p.place_id, { ...p, place: null });
                                                        }
                                                    });
                                                    return Array.from(prevMap.values());
                                                });
                                                
                                                // Process new predictions
                                                processAndFilterPredictions(additionalPredictions);
                                            }
                                            
                                            // If all additional requests are done, stop loading
                                            if (pendingRequests === 0) {
                                                setIsLoadingPredictions(false);
                                            }
                                        }
                                    );
                                }, index * 200); // Stagger requests to avoid rate limiting
                            });
                        }
                    } else {
                        setPredictions([]);
                        setShowPredictions(false);
                        setIsLoadingPredictions(false);
                    }
                }
            );
        } else {
            setPredictions([]);
            setShowPredictions(false);
            setIsLoadingPredictions(false);
        }
    };
    
    
    const handlePredictionSelect = (prediction) => {
        setShowPredictions(false);
        setInputValue(prediction.description);
        
        if (prediction.place) {
            handlePlacesChanged(prediction.place);
        } else {
            // Get place details if not already loaded
            placesServiceRef.current.getDetails(
                { placeId: prediction.place_id },
                (place, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                        handlePlacesChanged(place);
                    }
                }
            );
        }
    };
    const handleUpdateLocation = (e) => {
        e.preventDefault();
        if (selectedCity) {
            if (!allowedCountries.includes(selectedCity?.countryCode)) {
                toast.error("Vidaki does not offer platform coverage in that location.");
                setIsValidLocation(false);
                return;
            }
            switchLanguage(selectedCity?.countryCode);
            if (isValidLocation || (cityData && cityData.lat && cityData.long)) {
                dispatch(setKilometerRange(KmRange))
                saveCity(selectedCity);
                
                // Update country routing state and redirect to country URL
                const countryInfo = getCountryByCode(selectedCity?.countryCode);
                if (countryInfo) {
                    dispatch(setCurrentCountry({ 
                        code: countryInfo.code, 
                        name: countryInfo.name, 
                        detected: false 
                    }));
                    
                    // Update currency based on country
                    if (settings?.currencies) {
                        const matchingCurrency = settings.currencies.find(
                            (currency) => currency.code?.toUpperCase() === countryInfo.currency?.toUpperCase()
                        );
                        if (matchingCurrency) {
                            dispatch(setCurrentCurrency(matchingCurrency));
                        }
                    }
                    
                    router.push(`/${selectedCity.countryCode.toLowerCase()}`);
                } else {
                router.push('/');
                }
                OnHide();
            } else {
                toast.error("Please Select valid location")
            }
        } else {
            toast.error(t('pleaseSelectCity'));
        }
    };


    const handleRange = (range) => {
        setKmRange(range)
    }

    const formatter = (value) => `${value}KM`;

    useEffect(() => {
        setKmRange(appliedKilometer)
    }, [])


    const handleClose = () => {
        setKmRange(appliedKilometer)
        OnHide()
    }

    return (
        <Modal
            centered
            visible={IsLocationModalOpen}
            closeIcon={CloseIcon}
            className="ant_register_modal"
            onCancel={handleClose}
            footer={null}
            maskClosable={false}
        >
            <div className='location_modal'>
                <h5 className='head_loc'>{selectedCity ? t('editLocation') : t('addLocation')}</h5>
                <div className="card">
                    <div className="card-body">
                        <div className="location_city">
                            <div className="row loc_input gx-0">
                                <div className="col-8">

                                    {isLoaded && googleMaps && (
                                        <div className="location-search-wrapper">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                placeholder={t('selectLocation')}
                                                value={inputValue}
                                                onChange={(e) => handleSearch(e.target.value)}
                                                onFocus={(e) => {
                                                    if (e.target.value.length > 2 && predictions.length > 0) {
                                                        setShowPredictions(true);
                                                    } else if (predictions.length > 0) {
                                                        setShowPredictions(true);
                                                    }
                                                }}
                                                onBlur={() => {
                                                    // Delay hiding to allow click on prediction
                                                    setTimeout(() => setShowPredictions(false), 200);
                                                }}
                                                className="location-search-input"
                                            />
                                            {showPredictions && predictions.length > 0 && (
                                                <div className="location-predictions-dropdown">
                                                    {isLoadingPredictions && (
                                                        <div className="location-prediction-item" style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: '#666', borderBottom: '1px solid #eee' }}>
                                                            {t('loading') || 'Filtering...'}
                                                        </div>
                                                    )}
                                                    {predictions.map((prediction, index) => (
                                                        <div
                                                            key={prediction.place_id || index}
                                                            className="location-prediction-item"
                                                            onClick={() => handlePredictionSelect(prediction)}
                                                        >
                                                            <div className="location-prediction-main">
                                                                {prediction.structured_formatting?.main_text || prediction.description}
                                                            </div>
                                                            <div className="location-prediction-secondary">
                                                                {prediction.structured_formatting?.secondary_text || ''}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {showPredictions && !isLoadingPredictions && predictions.length === 0 && inputValue.length > 2 && (
                                                <div className="location-predictions-dropdown">
                                                    <div className="location-prediction-item" style={{ textAlign: 'center', padding: '10px', color: '#999' }}>
                                                        {t('noResultsFound') || 'No results found'}
                                                    </div>
                                                </div>
                                            )}
                                            {!showPredictions && isLoadingPredictions && inputValue.length > 2 && (
                                                <div className="location-predictions-dropdown">
                                                    <div className="location-prediction-item" style={{ textAlign: 'center', padding: '10px' }}>
                                                        {t('loading') || 'Loading...'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                                <div className="col-4">
                                    <div className="useCurrentLocation">
                                        <button onClick={getCurrentLocation}>
                                            <span>
                                                <BiCurrentLocation size={22} />
                                            </span>
                                            <span className='curr_loc'>
                                                {t('currentLocation')}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-12">
                                    <LocationWithRadius KmRange={KmRange} setKmRange={setKmRange} setPosition={setPosition} position={position} getLocationWithMap={getLocationWithMap} appliedKilometer={appliedKilometer} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="location-range-section">
                        <label htmlFor="range" className='location-range-label'>
                            <span>{t('range')}</span>
                            <span className="location-range-value">{KmRange} KM</span>
                        </label>
                        <div className="location-slider-wrapper">
                            <Slider
                                className='kmRange_slider'
                                value={KmRange}
                                tooltip={{
                                    formatter,
                                }}
                                onChange={handleRange}
                                min={min_range}
                                max={max_range}
                            />
                        </div>
                    </div>

                    <div className="card-footer">
                        <button onClick={handleUpdateLocation}>
                            {t('save')}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default LocationModal;


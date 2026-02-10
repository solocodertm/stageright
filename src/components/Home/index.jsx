'use client'
import React, { useEffect, useState } from 'react'
import { FeaturedSectionApi, getLanguageApi, GetLocaleByIpAPI, sliderApi } from '@/utils/api'
import { useDispatch, useSelector } from 'react-redux'
import { SliderData, setSlider } from '@/redux/reuducer/sliderSlice'
import { CurrentLanguageData, setCurrentLanguage } from '@/redux/reuducer/languageSlice'
import { settingsData } from '@/redux/reuducer/settingSlice'
import FeaturedSectionsSkeleton from '../Skeleton/FeaturedSectionsSkeleton'
import PopularCategories from './PopularCategories'
import FeaturedSections from './FeaturedSections'
import HomeAllItem from './HomeAllItem'
import { getKilometerRange, saveCity } from '@/redux/reuducer/locationSlice'
import { useParams, useRouter,usePathname  } from 'next/navigation'
import toast from 'react-hot-toast'
import { DEFAULT_LANGUAGE_CODE, getCountryLatLng } from '@/utils'

const HomePage = () => {
    const dispatch = useDispatch()
    const params = useParams()
    const router = useRouter()
    const pathname = usePathname()
    const slider = useSelector(SliderData);
    const KmRange = useSelector(getKilometerRange)
    const [IsLoading, setIsLoading] = useState(false)
    const [IsFeaturedLoading, setIsFeaturedLoading] = useState(false)
    const CurrentLanguage = useSelector(CurrentLanguageData)
    const [featuredData, setFeaturedData] = useState([])
    const systemSettingsData = useSelector(settingsData)
    const settings = systemSettingsData?.data
    const isDemoMode = settings?.demo_mode
    const cityData = useSelector(state => state?.Location?.cityData);

    const dummySliderData = [
        {
            id: 1,
            image: 'https://market-resized.envatousercontent.com/previews/files/454324388/Classified+590+x+300.png?w=590&h=300&cf_fit=crop&crop=top&format=auto&q=85&s=cf02f029915d17f2d8de7e111688c3740c293a2050481d5dbd43aec936435e18',
            title: 'Offer 1',
            description: 'This is the first offer.'
        },
        {
            id: 2,
            image: 'https://s3.envato.com/files/592446471/27%20eClassify.jpg',
            title: 'Offer 2',
            alt: 'This is the second offer.'
        },
        {
            id: 3,
            image: 'https://camo.envatousercontent.com/40e48fd79c0b1bc176d445c3f3461a47d22250b3/68747470733a2f2f692e696d6775722e636f6d2f4248375a5173362e6a706567',
            title: 'Offer 3',
            alt: 'This is the third offer.'
        }
    ];

    useEffect(() => {
        const getGeoLocation = async () => {
          const response = await GetLocaleByIpAPI.GetLocaleByIp();
          const data = response?.data?.data;
          const countryCode = data?.country_code;
          let availableLanguage = settings?.languages?.find((l) => l.code === countryCode?.toLowerCase());
          if(!availableLanguage){
            const languageCodeMapping = {
                "AL" : "sq",
                "AM" : "hy",
                "BY" : "be",
                "BA" : "bs",
                "GR" : "el",
                "CZ" : "cs",
                "DK" : "da",
                "EE" : "et",
                "GE" : "ka",
                "KZ" : "kk",
                "ME" : "cnr",
                "RS" : "sr",
                "SE" : "sv",
                "TJ" : "tg",
                "TM" : "tk",
                "UA" : "uk",
                "PK" : "ps",
                "SI" : "sk"
            }
            const getAppropriateLanguageCode = languageCodeMapping[countryCode] || DEFAULT_LANGUAGE_CODE;
            availableLanguage = settings?.languages?.find((l) => l.code === getAppropriateLanguageCode);
          }
          if(availableLanguage){
            const res = await getLanguageApi.getLanguage({ language_code: availableLanguage.code, type: 'web' });
            const setAddressFirstOnIp = localStorage.getItem('set_address_first_on_ip')
            if(!setAddressFirstOnIp){
                const cityData = await getCountryLatLng(data.country_name);
                if(cityData){
                    saveCity(cityData)
                    localStorage.setItem('set_address_first_on_ip','true')
                }
            }
            if (res?.data?.error === true) {
                toast.error(res?.data?.message)
            }
            else {
                dispatch(setCurrentLanguage(res?.data?.data));
            }
            router.push(`/locale/${availableLanguage?.code}?lang=${availableLanguage?.code}`);
          }
        }
        if(!params?.country && pathname === "/"){
            getGeoLocation();
        }
    },[])

    useEffect(() => {
        const fetchSliderData = async () => {
            try {
                setIsLoading(true);
                const response = await sliderApi.getSlider();
                const data = response.data;
                
                if (data?.data?.length > 0) {
                    dispatch(setSlider(data.data));
                } else {
                    dispatch(setSlider(dummySliderData)); // Use dummy data if API response is empty
                }
            } catch (error) {
                console.error('Error:', error);
                dispatch(setSlider(dummySliderData)); // Use dummy data on error
            } finally {
                setIsLoading(false);
            }
        };
        fetchSliderData();
    }, []);

    useEffect(() => {
        const fetchFeaturedSectionData = async () => {
            setIsFeaturedLoading(true);
            try {
                const params = {};
                if (!isDemoMode) {
                    if (KmRange > 0) {
                        params.radius = KmRange;
                        params.latitude = cityData.lat;
                        params.longitude = cityData.long;
                    } else {
                        if (cityData?.city) {
                            params.city = cityData.city;
                        } else if (cityData?.state) {
                            params.state = cityData.state;
                        } else if (cityData?.country) {
                            params.country = cityData.country;
                        }
                    }
                }
                const response = await FeaturedSectionApi.getFeaturedSections(params);
                const { data } = response.data;
                
                if (data?.length > 0) {
                    setFeaturedData(data);
                } else {
                    setFeaturedData([]); // Keep empty if no data
                }
            } catch (error) {
                console.error('Error:', error);
                setFeaturedData([]); // Keep empty on error
            } finally {
                setIsFeaturedLoading(false);
            }
        };
        fetchFeaturedSectionData();
    }, [cityData, CurrentLanguage, KmRange]);

    const allEmpty = featuredData?.every(ele => ele?.section_data.length === 0);

    return (
        <>
            <PopularCategories />
            {IsFeaturedLoading ? <FeaturedSectionsSkeleton /> : <FeaturedSections featuredData={featuredData} setFeaturedData={setFeaturedData} cityData={cityData} allEmpty={allEmpty} />}
            <HomeAllItem cityData={cityData} allEmpty={allEmpty} />
        </>
    );
};

export default HomePage;

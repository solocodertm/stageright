
import { Dropdown } from 'antd';
import Image from 'next/image';
import { placeholderImage } from '@/utils';
import { IoMdArrowDropdown } from "react-icons/io";
import { CurrentLanguageData } from '@/redux/reuducer/languageSlice';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { getAllCountries } from '@/config/countries';
import { setCurrentCountry } from '@/redux/reuducer/countrySlice';
import { setCurrentCurrency } from '@/redux/reuducer/currencySlice';

const LanguageDropdown = ({ getLanguageData, settings }) => {

    const CurrentLanguage = useSelector(CurrentLanguageData)
    const languages = settings && settings?.languages
    const dispatch = useDispatch()
    const router = useRouter()
    
    const handleLanguageSelect = async (prop) => {
        const lang = languages?.find(item => item.id === Number(prop.key))
        if (CurrentLanguage.id === lang.id) {
            return
        }
        
        // Update language first
        await getLanguageData(lang?.code)
        
        // Find country that matches this language code
        // Check if language object has country_code or country_name to match directly
        const allCountries = getAllCountries()
        
        // Try to find country by matching language code
        // If multiple countries share a language, prefer the one that matches the language name or use first match
        let matchingCountry = null
        
        // First, try to match by country code if language object has it
        if (lang?.country_code) {
            matchingCountry = allCountries.find(
                country => country.code?.toUpperCase() === lang.country_code?.toUpperCase()
            )
        }
        
        // If not found, try matching by language code
        if (!matchingCountry) {
            const countriesWithLanguage = allCountries.filter(
                country => country.language?.toLowerCase() === lang?.code?.toLowerCase()
            )
            
            // If multiple countries share the language, try to match by name
            if (countriesWithLanguage.length > 1 && lang?.name) {
                matchingCountry = countriesWithLanguage.find(
                    country => country.name?.toLowerCase().includes(lang.name?.toLowerCase()) ||
                              lang.name?.toLowerCase().includes(country.name?.toLowerCase())
                ) || countriesWithLanguage[0] // Fallback to first match
            } else {
                matchingCountry = countriesWithLanguage[0]
            }
        }
        
        if (matchingCountry) {
            // Update country in Redux
            dispatch(setCurrentCountry({
                code: matchingCountry.code,
                name: matchingCountry.name,
                detected: false
            }))
            
            // Update currency based on country
            if (settings?.currencies) {
                const matchingCurrency = settings.currencies.find(
                    (currency) => currency.code?.toUpperCase() === matchingCountry.currency?.toUpperCase()
                )
                if (matchingCurrency) {
                    dispatch(setCurrentCurrency(matchingCurrency))
                }
            }
            
            // Navigate to country URL
            router.push(`/${matchingCountry.code.toLowerCase()}`)
        }
    };
    const items = languages && languages.map(lang => ({
        label: (
            <span className="lang_options">
                <Image src={lang?.image ? lang?.image : settings?.placeholder_image} alt={lang.name} width={20} height={20} className="mr-2 lang_icon" onErrorCapture={placeholderImage} />
                <span>{lang.code}</span>
            </span>
        ),
        key: lang.id,
    }));

    const menuProps = {
        items,
        onClick: handleLanguageSelect,
    };

    return (

        <Dropdown menu={menuProps} className='language_dropdown'>
            <span className="d-flex align-items-center">
                <Image src={CurrentLanguage?.image ? CurrentLanguage?.image : settings?.placeholder_image} alt={CurrentLanguage?.name} width={20} height={20} className="mr-2 lang_icon" onErrorCapture={placeholderImage} />
                <span>{CurrentLanguage?.code}</span>
                <span>{languages?.length > 1 ? <IoMdArrowDropdown /> : <></>}</span>
            </span>
        </Dropdown >
    )
}

export default LanguageDropdown;
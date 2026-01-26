'use client'
import { usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import { CurrentCountryData } from '@/redux/reuducer/countrySlice'
import { getCountryByCode, DEFAULT_COUNTRY } from '@/config/countries'

/**
 * Custom hook to get current country from URL or Redux
 * @returns {Object} { countryCode, countryInfo }
 */
export function useCountry() {
  const pathname = usePathname()
  const countryFromRedux = useSelector(CurrentCountryData)
  
  // Extract country code from URL path
  const getCountryFromPath = () => {
    const pathParts = pathname.split('/').filter(Boolean)
    if (pathParts.length > 0 && pathParts[0].length === 2) {
      // First segment is likely country code
      const code = pathParts[0].toUpperCase()
      return code
    }
    return null
  }
  
  const countryCodeFromPath = getCountryFromPath()
  const countryCode = countryCodeFromPath || countryFromRedux?.countryCode || DEFAULT_COUNTRY
  const countryInfo = getCountryByCode(countryCode)
  
  return {
    countryCode: countryCode.toUpperCase(),
    countryCodeLower: countryCode.toLowerCase(),
    countryInfo,
    isFromPath: !!countryCodeFromPath,
  }
}




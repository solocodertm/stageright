'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { getCountryByCode } from '@/config/countries'
import { setCurrentCountry } from '@/redux/reuducer/countrySlice'
import { setCurrentCurrency } from '@/redux/reuducer/currencySlice'
import { settingsData } from '@/redux/reuducer/settingSlice'

/**
 * Client component to sync country and currency from URL
 * This ensures currency updates when navigating directly to country URLs
 */
export default function CountrySync() {
  const pathname = usePathname()
  const dispatch = useDispatch()
  const systemSettings = useSelector(settingsData)
  const settings = systemSettings?.data

  useEffect(() => {
    // Extract country code from URL path
    const pathParts = pathname.split('/').filter(Boolean)
    if (pathParts.length > 0 && pathParts[0].length === 2) {
      const countryCode = pathParts[0].toUpperCase()
      const country = getCountryByCode(countryCode)
      
      if (country) {
        // Update country in Redux
        dispatch(setCurrentCountry({
          code: country.code,
          name: country.name,
          detected: false
        }))

        // Update currency based on country
        if (settings?.currencies) {
          const matchingCurrency = settings.currencies.find(
            (currency) => currency.code?.toUpperCase() === country.currency?.toUpperCase()
          )
          if (matchingCurrency) {
            dispatch(setCurrentCurrency(matchingCurrency))
          }
        }
      }
    }
  }, [pathname, dispatch, settings])

  return null // This component doesn't render anything
}


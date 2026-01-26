'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getLocaleByIpApi } from '@/utils/api'
import { DEFAULT_COUNTRY, isValidCountry } from '@/config/countries'
import { useDispatch, useSelector } from 'react-redux'
import { setCurrentCountry } from '@/redux/reuducer/countrySlice'
import { getCountryByCode } from '@/config/countries'
import { setCurrentCurrency } from '@/redux/reuducer/currencySlice'
import { settingsData } from '@/redux/reuducer/settingSlice'

/**
 * Root page component
 * Detects user's country via GeoIP and redirects to country-specific URL
 */
export default function RootPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const systemSettings = useSelector(settingsData)
  const settings = systemSettings?.data

  // Helper function to update currency based on country
  const updateCurrencyForCountry = (country) => {
    if (settings?.currencies && country?.currency) {
      const matchingCurrency = settings.currencies.find(
        (currency) => currency.code?.toUpperCase() === country.currency?.toUpperCase()
      )
      if (matchingCurrency) {
        dispatch(setCurrentCurrency(matchingCurrency))
      }
    }
  }

  useEffect(() => {
    const detectAndRedirect = async () => {
  try {
        // Check for saved country preference in cookie
        const savedCountry = getCookie('preferred_country')
        if (savedCountry && isValidCountry(savedCountry)) {
          const country = getCountryByCode(savedCountry)
          if (country) {
            dispatch(setCurrentCountry({ 
              code: country.code, 
              name: country.name, 
              detected: false 
            }))
            updateCurrencyForCountry(country)
            router.push(`/${savedCountry.toLowerCase()}`)
            return
  }
        }

        // Detect via GeoIP API
  try {
          const response = await getLocaleByIpApi.getLocaleByIp()
          const data = response?.data?.data
          
          if (data?.country_code) {
            const countryCode = data.country_code.toUpperCase()
            
            // Validate country code
            if (isValidCountry(countryCode)) {
              const country = getCountryByCode(countryCode)
              if (country) {
                // Save preference
                setCookie('preferred_country', countryCode.toLowerCase(), 365)
                
                // Update Redux
                dispatch(setCurrentCountry({ 
                  code: country.code, 
                  name: country.name, 
                  detected: true 
                }))
                updateCurrencyForCountry(country)
                
                // Redirect to country URL
                router.push(`/${countryCode.toLowerCase()}`)
                return
      }
            }
          }
        } catch (apiError) {
          console.error('GeoIP detection failed:', apiError)
        }

        // Fallback to default country
        const defaultCountry = getCountryByCode(DEFAULT_COUNTRY)
        if (defaultCountry) {
          dispatch(setCurrentCountry({ 
            code: defaultCountry.code, 
            name: defaultCountry.name, 
            detected: false 
          }))
          updateCurrencyForCountry(defaultCountry)
          setCookie('preferred_country', DEFAULT_COUNTRY.toLowerCase(), 365)
          router.push(`/${DEFAULT_COUNTRY.toLowerCase()}`)
        }
      } catch (error) {
        console.error('Country detection error:', error)
        // Final fallback
        router.push(`/${DEFAULT_COUNTRY.toLowerCase()}`)
      }
    }

    detectAndRedirect()
  }, [router, dispatch, settings])

  // No explicit loading UI here; redirect logic runs and country-specific
  // routes/pages handle their own loading states.
  return null
}

// Helper functions for cookies
function getCookie(name) {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

function setCookie(name, value, days) {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

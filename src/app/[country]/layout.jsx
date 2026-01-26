import { notFound } from 'next/navigation'
import { isValidCountry, getCountryByCode, generateHreflangUrls, DEFAULT_COUNTRY } from '@/config/countries'

/**
 * Country Layout Component
 * Validates country code and provides country context to all child routes
 */
export default function CountryLayout({ children, params }) {
  const countryCode = params?.country?.toLowerCase()
  
  // Validate country code
  if (!countryCode || !isValidCountry(countryCode)) {
    notFound()
  }

  return <>{children}</>
}

/**
 * Generate metadata for country pages
 */
export async function generateMetadata({ params }) {
  const countryCode = params?.country?.toLowerCase()
  
  if (!isValidCountry(countryCode)) {
    return {
      title: 'Page Not Found',
    }
  }

  const country = getCountryByCode(countryCode)
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://vidaki.com'
  
  // Generate hreflang URLs for all countries
  const hreflangUrls = generateHreflangUrls(baseUrl, '')
  
  return {
    title: `Classifieds in ${country.name} | Vidaki`,
    description: `Find and list classified ads in ${country.name}. Browse thousands of listings in ${country.name}.`,
    alternates: {
      canonical: `${baseUrl}/${countryCode}`,
      languages: hreflangUrls,
    },
    openGraph: {
      title: `Classifieds in ${country.name} | Vidaki`,
      description: `Find and list classified ads in ${country.name}`,
      url: `${baseUrl}/${countryCode}`,
      siteName: 'Vidaki',
      locale: country.hreflang,
    },
  }
}

/**
 * Generate static params for all supported countries
 */
export async function generateStaticParams() {
  const { SUPPORTED_COUNTRIES } = await import('@/config/countries')
  return SUPPORTED_COUNTRIES.map((country) => ({
    country: country.toLowerCase(),
  }))
}




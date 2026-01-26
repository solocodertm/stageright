import HomePage from '@/components/Home';
import Layout from '@/components/Layout/Layout';
import axios from 'axios';
import { getCountryByCode, generateHreflangUrls } from '@/config/countries';

export const generateMetadata = async ({ params }) => {
  const countryCode = params?.country?.toUpperCase()
  const country = getCountryByCode(countryCode)
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://vidaki.com'
  
  // If country is not in supported list, return default metadata
  if (!country) {
    const hreflangUrls = generateHreflangUrls(baseUrl, '')
    return {
      title: process.env.NEXT_PUBLIC_META_TITLE || 'Vidaki',
      description: process.env.NEXT_PUBLIC_META_DESCRIPTION || 'Classified listings',
      alternates: {
        canonical: `${baseUrl}/${countryCode.toLowerCase()}`,
        languages: hreflangUrls,
      },
    };
  }
  
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}seo-settings?page=home`
    );
    const home = response?.data
    
    // Generate hreflang URLs
    const hreflangUrls = generateHreflangUrls(baseUrl, '')
    
    return {
      title: home?.title ? `${home.title} - ${country.name}` : `${process.env.NEXT_PUBLIC_META_TITLE} - ${country.name}`,
      description: home?.description ? home.description : process.env.NEXT_PUBLIC_META_DESCRIPTION,
      openGraph: {
        images: home?.image ? [home?.image] : [],
        title: home?.title ? `${home.title} - ${country.name}` : `${process.env.NEXT_PUBLIC_META_TITLE} - ${country.name}`,
        description: home?.description ? home.description : process.env.NEXT_PUBLIC_META_DESCRIPTION,
        url: `${baseUrl}/${countryCode.toLowerCase()}`,
        locale: country.hreflang,
      },
      keywords: home?.keywords ? home?.keywords : process.env.NEXT_PUBLIC_META_kEYWORDS,
      alternates: {
        canonical: `${baseUrl}/${countryCode.toLowerCase()}`,
        languages: hreflangUrls,
      },
    };
  } catch (error) {
    console.error("Error fetching MetaData:", error);
    const hreflangUrls = generateHreflangUrls(baseUrl, '')
    return {
      title: `${process.env.NEXT_PUBLIC_META_TITLE || 'Vidaki'} - ${country.name}`,
      description: process.env.NEXT_PUBLIC_META_DESCRIPTION || 'Classified listings',
      alternates: {
        canonical: `${baseUrl}/${countryCode.toLowerCase()}`,
        languages: hreflangUrls,
      },
    };
  }
};

const fetchCategories = async (countryCode) => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-categories`,
      { params: { page: 1, country: countryCode } }
    );
    return response?.data?.data?.data || [];
  } catch (error) {
    console.error("Error fetching Categories Data:", error);
    return [];
  }
};

const fetchProductItems = async (countryCode) => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-item`,
      { params: { page: 1, country: countryCode } }
    );
    return response?.data?.data?.data || [];
  } catch (error) {
    console.error('Error fetching Product Items Data:', error);
    return [];
  }
};

const fetchFeaturedSections = async (countryCode) => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-featured-section`,
      { params: { country: countryCode } }
    );
    return response?.data?.data || [];
  } catch (error) {
    console.error('Error fetching Featured sections Data:', error);
    return [];
  }
};

const CountryHomePage = async ({ params }) => {
  const countryCode = params?.country?.toUpperCase()
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://vidaki.com'

  const categoriesData = await fetchCategories(countryCode);
  const productItemsData = await fetchProductItems(countryCode);
  const featuredSectionsData = await fetchFeaturedSections(countryCode);

  const existingSlugs = new Set(productItemsData.map(product => product.slug));

  let featuredItems = [];
  featuredSectionsData.forEach((section) => {
    section.section_data.slice(0, 4).forEach(item => {
      if (!existingSlugs.has(item.slug)) {
        featuredItems.push(item);
        existingSlugs.add(item.slug);
      }
    });
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: [
      ...categoriesData.map((category, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Thing",
          name: category?.name,
          url: `${baseUrl}/${countryCode.toLowerCase()}/category/${category?.slug}`
        }
      })),
      ...productItemsData.map((product, index) => ({
        "@type": "ListItem",
        position: categoriesData?.length + index + 1,
        item: {
          "@type": "Product",
          name: product?.name,
          productID: product?.id,
          description: product?.description,
          image: product?.image,
          url: `${baseUrl}/${countryCode.toLowerCase()}/item/${product?.slug}`,
          category: product?.category?.name,
          "offers": {
            "@type": "Offer",
            price: product?.price,
            priceCurrency: "USD",
          },
          countryOfOrigin: product?.country
        }
      })),
      ...featuredItems.map((item, index) => ({
        "@type": "ListItem",
        position: categoriesData.length + productItemsData.length + index + 1,
        item: {
          "@type": "Product",
          name: item?.name,
          productID: item?.id,
          description: item?.description,
          image: item?.image,
          url: `${baseUrl}/${countryCode.toLowerCase()}/item/${item?.slug}`,
          category: item?.category?.name,
          "offers": {
            "@type": "Offer",
            price: item?.price,
            priceCurrency: "USD",
          },
          countryOfOrigin: item?.country
        }
      }))
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Layout>
        <HomePage />
      </Layout>
    </>
  )
}

export default CountryHomePage




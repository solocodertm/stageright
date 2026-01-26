import Layout from "@/components/Layout/Layout";
import SingleCategory from "@/components/PagesComponent/SingleCategory/SingleCategory"
import axios from "axios";
import { getCountryByCode, generateHreflangUrls } from '@/config/countries';

export const generateMetadata = async ({ params }) => {
    const countryCode = params?.country?.toUpperCase()
    const country = getCountryByCode(countryCode)
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://vidaki.com'
    
    try {
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-categories?slug=${params?.slug[0]}&country=${countryCode}`
        );

        const stopWords = ['the', 'is', 'in', 'and', 'a', 'to', 'of', 'for', 'on', 'at', 'with', 'by', 'this', 'that', 'or', 'as', 'an', 'from', 'it', 'was', 'are', 'be', 'has', 'have', 'had', 'but', 'if', 'else'];

        const generateKeywords = (description) => {
            if (!description) {
                return process.env.NEXT_PUBLIC_META_kEYWORDS
                    ? process.env.NEXT_PUBLIC_META_kEYWORDS.split(',').map(keyword => keyword.trim())
                    : [];
            }

            const words = description
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/);

            const filteredWords = words.filter(word => !stopWords.includes(word));

            const wordFrequency = filteredWords.reduce((acc, word) => {
                acc[word] = (acc[word] || 0) + 1;
                return acc;
            }, {});

            const sortedWords = Object.keys(wordFrequency).sort((a, b) => wordFrequency[b] - wordFrequency[a]);

            return sortedWords.slice(0, 10);
        }

        const selfCategory = response.data?.self_category
        const title = selfCategory?.translated_name
        const description = selfCategory?.description
        const keywords = generateKeywords(selfCategory?.description)
        const image = selfCategory?.image

        // Generate hreflang URLs for this category
        const categoryPath = `/category/${params?.slug?.join('/') || ''}`
        const hreflangUrls = generateHreflangUrls(baseUrl, categoryPath)

        return {
            title: title ? `${title} - ${country.name}` : process.env.NEXT_PUBLIC_META_TITLE,
            description: description ? description : process.env.NEXT_PUBLIC_META_DESCRIPTION,
            openGraph: {
                images: image ? [image] : [],
                title: title ? `${title} - ${country.name}` : process.env.NEXT_PUBLIC_META_TITLE,
                description: description ? description : process.env.NEXT_PUBLIC_META_DESCRIPTION,
                url: `${baseUrl}/${countryCode.toLowerCase()}${categoryPath}`,
                locale: country.hreflang,
            },
            keywords: keywords,
            alternates: {
                canonical: `${baseUrl}/${countryCode.toLowerCase()}${categoryPath}`,
                languages: hreflangUrls,
            },
        };
    } catch (error) {
        console.error("Error fetching MetaData:", error);
        return null;
    }
};


const getCategoryItems = async (slug, countryCode) => {
    try {
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-item`,
            { params: { page: 1, category_slug: slug, country: countryCode } }
        );
        return response?.data?.data?.data || [];
    } catch (error) {
        console.error('Error fetching Product Items Data:', error);
        return [];
    }
}


const SingleCategoryPage = async ({ params }) => {
    const countryCode = params?.country?.toUpperCase()
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://vidaki.com'
    
    const categoryItems = await getCategoryItems(params?.slug[0], countryCode)

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: categoryItems.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
                "@type": "Product",
                productID: product?.id,
                name: product?.name,
                description: product?.description,
                image: product?.image,
                url: `${baseUrl}/${countryCode.toLowerCase()}/item/${product?.slug}`,
                category: {
                    "@type": "Thing",
                    name: product?.category?.name,
                },
                offers: {
                    "@type": "Offer",
                    price: product?.price,
                    priceCurrency: "USD",
                },
                countryOfOrigin: product?.country,
            }
        }))
    };


    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <Layout>
                <SingleCategory slug={params.slug} />
            </Layout>
        </>
    )
}

export default SingleCategoryPage




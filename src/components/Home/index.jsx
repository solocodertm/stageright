'use client'
import React, { useEffect, useState } from 'react'
import { FeaturedSectionApi, sliderApi } from '@/utils/api'
import { useDispatch, useSelector } from 'react-redux'
import { SliderData, setSlider } from '@/redux/reuducer/sliderSlice'
import { CurrentLanguageData } from '@/redux/reuducer/languageSlice'
import { settingsData } from '@/redux/reuducer/settingSlice'
import FeaturedSectionsSkeleton from '../Skeleton/FeaturedSectionsSkeleton'
import SliderSkeleton from '../Skeleton/Sliderskeleton'
import OfferSlider from './OfferSlider'
import PopularCategories from './PopularCategories'
import FeaturedSections from './FeaturedSections'
import HomeAllItem from './HomeAllItem'
import { getKilometerRange } from '@/redux/reuducer/locationSlice'
import SearchComponent from './SearchComponent'

const HomePage = () => {
    const dispatch = useDispatch()
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
            {/* {IsLoading ? <SliderSkeleton /> : <OfferSlider sliderData={slider.length > 0 ? slider : dummySliderData} />} */}
            <PopularCategories />
            {IsFeaturedLoading ? <FeaturedSectionsSkeleton /> : <FeaturedSections featuredData={featuredData} setFeaturedData={setFeaturedData} cityData={cityData} allEmpty={allEmpty} />}
            <HomeAllItem cityData={cityData} allEmpty={allEmpty} />
        </>
    );
};

export default HomePage;

'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { IoIosAddCircleOutline } from "react-icons/io";
import { GiHamburgerMenu } from "react-icons/gi";
import dynamic from 'next/dynamic';
import { Drawer, Select, Spin } from 'antd'
import { GrLocation } from "react-icons/gr";
import { FaSearch } from 'react-icons/fa';
import Link from 'next/link';
import 'swiper/css';
import { getSlug, isEmptyObject, placeholderImage, t, truncate } from '@/utils';
import { BiPlanet } from 'react-icons/bi';
import { useDispatch, useSelector } from 'react-redux';
import { MdClose } from 'react-icons/md';
import { logoutSuccess, userSignUpData } from '../../redux/reuducer/authSlice';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import FirebaseData from '@/utils/Firebase';
import { settingsData } from '@/redux/reuducer/settingSlice';
import { getLanguageApi, getLimitsApi } from '@/utils/api';
import { CurrentLanguageData, setCurrentLanguage } from '@/redux/reuducer/languageSlice';
import LanguageDropdown from '../HeaderDropdowns/LanguageDropdown';
import { useRouter, usePathname } from 'next/navigation';
import { setSearch } from "@/redux/reuducer/searchSlice"
import { isLogin } from '@/utils';
import { CategoryData, CurrentPage, LastPage, setCatCurrentPage, setCatLastPage, setCateData, setTreeData } from '@/redux/reuducer/categorySlice'
import { categoryApi } from '@/utils/api'
import { Collapse } from 'antd';
import FilterTree from '../Category/FilterTree';
import { DownOutlined } from '@ant-design/icons';
import LocationModal from '../LandingPage/LocationModal';
import { saveOfferData } from '@/redux/reuducer/offerSlice';
import HeaderCategories from './HeaderCategories';
import CurrencyDropdown from '../HeaderDropdowns/CurrencyDropdown';
import { CurrentCurrencyData, setCurrentCurrency } from '@/redux/reuducer/currencySlice';
import SubHeader from './SubHeader';
import { DEFAULT_COUNTRY, getCountryByCode } from '@/config/countries';
import UserDropdown from '../HeaderDropdowns/UserDropdown';
const ProfileDropdown = dynamic(() => import('../Profile/ProfileDropdown.jsx'))
const MailSentSucessfully = dynamic(() => import('../Auth/MailSentSucessfully.jsx'), { ssr: false })
const LoginModal = dynamic(() => import('../Auth/LoginModal.jsx'), { ssr: false })

const { Panel } = Collapse

const Header = () => {

    const pathname = usePathname()
    const router = useRouter()
    const dispatch = useDispatch()
    const UserData = useSelector(userSignUpData)
    const systemSettings = useSelector(settingsData)
    const settings = systemSettings?.data
    const cateData = useSelector(CategoryData)
    const catCurrentPage = useSelector(CurrentPage)
    const catLastPage = useSelector(LastPage)
    const { signOut } = FirebaseData();
    const [IsRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
    const [IsLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const [IsMailSentOpen, setIsMailSentOpen] = useState(false)
    const [IsLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [catId, setCatId] = useState('')
    const [slug, setSlug] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const cityData = useSelector(state => state?.Location?.cityData);
    const CurrentLanguage = useSelector(CurrentLanguageData)
    const CurrentCurrency = useSelector(CurrentCurrencyData)
    const headerCatSelected = getSlug(pathname)
    const [isAdListingClicked, setIsAdListingClicked] = useState(false)



    // this api call only in pop cate swiper 
    const getCategoriesData = (async (page) => {
        try {
            const response = await categoryApi.getCategory({ page: `${page}` });
            const { data } = response.data;

            if (data && Array.isArray(data.data)) {

                if (page > 1) {
                    dispatch(setCateData([...cateData, ...data.data]));
                } else {
                    dispatch(setCateData(data.data));
                    dispatch(setTreeData([]))
                }

            }
            dispatch(setCatLastPage(data?.last_page))
            dispatch(setCatCurrentPage(data?.current_page))
        } catch (error) {
            console.error("Error:", error);
        }
    });
    
     useEffect(() => {
    const logo = document.querySelector(".header_logo_2");
    if (logo) {
      logo.src = "public/assets/logo.svg";  // Correct path for Next.js
    }
  }, []);


    useEffect(() => {

        if (pathname === '/' || cateData.length === 0) {
            getCategoriesData(1);
        }

    }, []);


    const translateCategories = (categories) => {
        return categories.map((category) => {
            const translation = category.translations?.find(
                (trans) => trans.language_id === CurrentLanguage.id
            );

            return {
                ...category,
                translated_name: translation ? translation.name : category.name, // Update the category name directly
                subcategories: category.subcategories?.length > 0
                    ? translateCategories(category.subcategories) // Recursively translate subcategories
                    : [], // Default to empty array if no subcategories
            };
        });
    };

    useEffect(() => {
        if (cateData.length > 0) {
            const updatedCateData = translateCategories(cateData);
            dispatch(setCateData(updatedCateData))
        }
    }, [CurrentLanguage])



    const getLanguageData = async (language_code) => {
        try {
            // Import translation utilities
            const { loadLanguageTranslations } = await import('@/utils/translations');
            const { saveLanguageToCookie } = await import('@/utils/cookies');
            
            // Load translations (prioritizes static JSON, falls back to API)
            const languageData = await loadLanguageTranslations(language_code, getLanguageApi);
            
            if (languageData) {
                // Save to cookie AND localStorage (via Redux)
                saveLanguageToCookie(language_code);
                
                if (show) {
                    setShow(false)
                }
                
                // Update Redux state (which persists to localStorage)
                dispatch(setCurrentLanguage(languageData));
            } else {
                toast.error('Failed to load language translations');
            }
        } catch (error) {
            console.error('Error loading language:', error);
            toast.error('Failed to change language');
        }
    }

    const setDefaultCurrency = async () => {
        try {
            // Use default country from config (currently Barbados) to derive default currency
            const defaultCountry = getCountryByCode(DEFAULT_COUNTRY);
            if (defaultCountry && settings?.currencies) {
                const matchingCurrency = settings.currencies.find(
                    (currency) => currency.code?.toUpperCase() === defaultCountry.currency?.toUpperCase()
                );
                if (matchingCurrency) {
                    dispatch(setCurrentCurrency(matchingCurrency));
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
    const setDefaultLanguage = async () => {
        try {
            // Check cookie first, then settings default
            const { getLanguageFromCookie } = await import('@/utils/cookies');
            const { loadLanguageTranslations } = await import('@/utils/translations');
            
            const cookieLanguage = getLanguageFromCookie();
            const language_code = cookieLanguage || settings?.default_language || 'en';
            
            // Load translations (prioritizes static JSON, falls back to API)
            const languageData = await loadLanguageTranslations(language_code, getLanguageApi);
            
            if (languageData) {
                dispatch(setCurrentLanguage(languageData));
            }
        } catch (error) {
            console.error('Error setting default language:', error);
        }
    }


    useEffect(() => {
        if (isEmptyObject(CurrentCurrency)) {
            setDefaultCurrency()
        }
    }, [])
    useEffect(() => {
        if (isEmptyObject(CurrentLanguage)) {
            setDefaultLanguage()
        }
    }, [])


    useEffect(() => {
        const categoryPathRegex = /^\/category(\/|$)/;
        if (pathname != '/products' && !categoryPathRegex.test(pathname)) {
            dispatch(setSearch(''))
            setSearchQuery("")
            setCatId("")
        }
    }, [pathname])

    const closeDrawer = () => {
        if (show) {
            setShow(false)
        }
    }

    const openRegisterModal = () => {
        if (show) {
            setShow(false)
        }
        setIsLoginModalOpen(true)
        setIsRegisterModalOpen(true)
    }
    const openLoginModal = () => {
        if (show) {
            setShow(false)
        }
        if (IsRegisterModalOpen) {
            setIsRegisterModalOpen(false)
        }
        setIsLoginModalOpen(true)
    }
    const openSentMailModal = () => {
        setIsLoginModalOpen(false)
        setIsMailSentOpen(true)
    }

    const openLocationEditModal = () => {
        if (show) {
            setShow(false)
        }
        setIsLocationModalOpen(true)
    }

    const handleLogout = () => {
        if (show) {
            setShow(false)
        }
        Swal.fire({
            title: `${t('areYouSure')} \u200E`,
            text: `${t('logoutConfirmation')} \u200E`,
            icon: "warning",
            showCancelButton: true,
            customClass: {
                confirmButton: 'Swal-confirm-buttons',
                cancelButton: "Swal-cancel-buttons"
            },
            confirmButtonText: t("yes"),
        }).then((result) => {
            if (result.isConfirmed) {
                // // Clear the recaptchaVerifier by setting it to null
                // window.recaptchaVerifier = null;

                // Perform the logout action
                logoutSuccess();
                signOut()
                router.push('/')
                saveOfferData([]);
                toast.success(t('signOutSuccess'));
            } else {
                toast.error(t('signOutCancelled'));
            }
        });
    };

    const CloseIcon = <div className="close_icon_cont"><MdClose size={24} color="black" /></div>

    const handleCategoryChange = (value) => {
        if (value?.value === "") {
            setCatId('')
            return
        }
        const category = cateData.find((item) => item?.id === Number(value.key))
        const catId = category?.id
        const slug = category?.slug

        if (catId) {
            setCatId(catId)
        }
        if (slug) {
            setSlug(slug)
        }
    }

    const handleSearch = (e) => {
        setSearchQuery(e.target.value)
    }

    const handleSearchNav = (e) => {
        e.preventDefault()
        if (catId) {
            dispatch(setSearch(searchQuery))
            router.push(`/category/${slug}`)
        } else {
            dispatch(setSearch(searchQuery))
            router.push(`/products`)
        }
    }

    const getLimitsData = async () => {
        try {
            setIsAdListingClicked(true)
            const res = await getLimitsApi.getLimits({ package_type: 'item_listing' })
            if (res?.data?.error === false) {
                router.push('/ad-listing')
            } else {
                toast.error(t('purchasePlan'))
                router.push('/subscription')
            }
        } catch (error) {
            console.log(error)
        } finally {
            setIsAdListingClicked(false)
        }
    }
    const handleCheckLogin = async (e) => {
        e.preventDefault()

        // Check if the user is logged in
        if (!isLogin()) {
            return Swal.fire({
                icon: "error",
                title: t('oops'),
                text: t("loginFirst"),
                allowOutsideClick: false,
                customClass: { confirmButton: 'Swal-confirm-buttons' },
            });
        }
        // Check if user profile is complete
        if (!UserData?.name || !UserData?.email) {
            return Swal.fire({
                title: t('oops'),
                text: t('youNeedToUpdateProfile'),
                icon: "warning",
                showCancelButton: false,
                customClass: { confirmButton: 'Swal-confirm-buttons' },
                confirmButtonText: "Ok",
            }).then((result) => {
                if (result.isConfirmed) {
                    router.push('/profile/edit-profile');
                }
            });
        }

        // Check for free ad listing setting and route accordingly
        if (Number(settings?.free_ad_listing) === 1) {
            return router.push('/ad-listing');
        }
        // Otherwise, fetch limits data
        await getLimitsData();
        handleClose();
    }

    const handleCategoryScroll = (event) => {
        const { target } = event;
        if (target.scrollTop + target.offsetHeight >= target.scrollHeight && catCurrentPage < catLastPage) {
            getCategoriesData(catCurrentPage + 1)
        }
    }

    return (
        <>
            <nav className="navbar navbar-expand-lg">
                <div className="container">
                    <div className="left_side">
                        <div className="nav_logo">
                            <Link href="/">
                                <Image src='/public/assets/logo.svg' alt='logo' width={0} height={0} class="header_logo_2" onErrorCapture={placeholderImage} />
                            </Link>
                        </div>

                        <div className='select_search_cont search_lg'>
                            <div className="cat_select_wrapper" style={{backgroundColor:"transparent" }}>
                                <Select
                                    showSearch
                                    style={{ width: "100%" }}
                                    onChange={handleCategoryChange}
                                    labelInValue
                                    placeholder={t('categorySelect')}
                                    filterOption={true} // Disable default filter to use custom filter
                                    defaultValue=''
                                    className='web_ant_select'
                                    onPopupScroll={handleCategoryScroll}
                                >
                                    <Option value=''>{t('allCategories')}</Option>
                                    {cateData && cateData?.map((cat, index) => (

                                        <Option key={cat?.id} value={cat.name}>
                                            {cat?.translated_name}
                                        </Option>

                                    ))}
                                </Select>
                            </div>
                            <form className='search_cont' onSubmit={handleSearchNav}>
                                <div className='srchIconinput_cont'>
                                    <BiPlanet size={16} color='#595B6C' className='planet' />
                                    <input type="text" placeholder={t('searchItem')} onChange={(e) => handleSearch(e)} value={searchQuery} />
                                </div>
                                <button type='submit'><FaSearch size={14} /><span className='srch'>{t('search')}</span></button>
                            </form>
                        </div>

                        <span onClick={handleShow} id="hamburg">
                            <GiHamburgerMenu size={25} />
                        </span>
                    </div>
                    <div className='select_search_cont search_xs_xl'>
                        <div className="cat_select_wrapper">
                            <Select
                                showSearch
                                style={{ width: "100%", }}
                                onChange={handleCategoryChange}
                                labelInValue
                                placeholder={t('categorySelect')}
                                filterOption={true} // Disable default filter to use custom filter
                                defaultValue=''
                                className='web_ant_select'
                                onPopupScroll={handleCategoryScroll}
                            >
                                <Option value=''>{t('allCategories')}</Option>
                                {cateData && cateData?.map((cat, index) => (

                                    <Option key={cat?.id} value={cat.name}>
                                        {cat?.translated_name}
                                    </Option>

                                ))}
                            </Select>
                        </div>
                        <form className='search_cont' onSubmit={handleSearchNav}>
                            <div className='srchIconinput_cont'>
                                <BiPlanet size={16} color='#595B6C' className='planet' />
                                <input type="text" placeholder={t('searchItem')} onChange={(e) => handleSearch(e)} value={searchQuery} />
                            </div>
                            <button type='submit'><FaSearch size={14} /><span className='srch'>{t('search')}</span></button>
                        </form>
                        
                    </div>

                    {(cityData?.city || cityData?.state || cityData?.country) ? (
                        <div className='home_header_location' onClick={openLocationEditModal}>
                            <GrLocation size={16} />
                            <p className='header_location' title={(() => {
                                const locationParts = [];
                                if (cityData?.city) locationParts.push(cityData.city);
                                // Only add state if it's different from city
                                if (cityData?.state && cityData.state !== cityData?.city) {
                                    locationParts.push(cityData.state);
                                }
                                if (cityData?.country) locationParts.push(cityData.country);
                                return locationParts.join(", ");
                            })()}>
                                {
                                    truncate((() => {
                                        const locationParts = [];
                                        if (cityData?.city) locationParts.push(cityData.city);
                                        // Only add state if it's different from city
                                        if (cityData?.state && cityData.state !== cityData?.city) {
                                            locationParts.push(cityData.state);
                                        }
                                        if (cityData?.country) locationParts.push(cityData.country);
                                        return locationParts.join(", ");
                                    })(), 12)
                                }
                            </p>
                        </div>
                    ) : (
                        <div className='home_header_location' onClick={openLocationEditModal}>
                            <GrLocation size={16} />
                            <p className='header_location'>{t('addLocation')}</p>
                        </div>
                    )}
                    <div className="right_side">
                        {!isLogin() ? (
                            <>
                                <div class="verf_email_add_btn rounded-pill d-flex align-items-center" onClick={openLoginModal} >
                                    {/* {t('login')} */}
                                    <span className="px-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-plus me-1" viewBox="0 0 16 16">
                                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                                        </svg>
                                    </span>
                                    {/* <span class="px-2 d-none d-lg-inline-block">
                                        {t('new')}
                                    </span> */}
                                </div>
                                {/* <span className='vl'></span> */}
                                <div className='nav-item nav-link' >
                                    {/* {t('register')} */}
                                    <UserDropdown
                                        onLogin={openLoginModal}
                                        onRegister={openRegisterModal}
                                        />
                                </div>
                            </>
                        ) : (
                            <ProfileDropdown closeDrawer={closeDrawer} settings={settings} handleLogout={handleLogout} isDrawer={false} />
                        )}

                           {isLogin() && 
                            <div className="item_add">
                                <button className='ad_listing' disabled={isAdListingClicked} onClick={handleCheckLogin}>
                                    <IoIosAddCircleOutline size={18} className='ad_listing_icon' />
                                    <span className='adlist_btn' title={t('adListing')}>
                                        {
                                            truncate(t('adListing'), 12)
                                        }
                                    </span>
                                </button>
                            </div>
                           }
    
                        <CurrencyDropdown settings={settings} />
                        <LanguageDropdown getLanguageData={getLanguageData} settings={settings} />
                    </div>
                </div>
            </nav >

            {/* {
                cateData.length > 0 &&
                <HeaderCategories cateData={cateData} headerCatSelected={headerCatSelected} settings={settings} />
            } */}
            {/* <SubHeader cateData={cateData} headerCatSelected={headerCatSelected} settings={settings} /> */}


            <Drawer className='eclassify_drawer' maskClosable={false} title={< Image src={settings?.header_logo} width={195} height={92} alt="Close Icon" onErrorCapture={placeholderImage} />} onClose={handleClose} open={show} closeIcon={CloseIcon} >
                <ul className="mobile_nav">
                    {cityData &&
                        <li className='mob_header_location' onClick={openLocationEditModal}>
                            <GrLocation size={16} />
                            <p>
                                {
                                    (() => {
                                        const locationParts = [];
                                        if (cityData?.city) locationParts.push(cityData.city);
                                        // Only add state if it's different from city
                                        if (cityData?.state && cityData.state !== cityData?.city) {
                                            locationParts.push(cityData.state);
                                        }
                                        if (cityData?.country) locationParts.push(cityData.country);
                                        return locationParts.join(", ");
                                    })()
                                }
                            </p>
                        </li>
                    }
                    <li className='mobile_nav_tab login_reg_nav_tab'>
                        {!isLogin() ? (
                            <>
                                <li className="nav-item nav-link lg_in" onClick={openLoginModal} >
                                    {t('login')}
                                </li>
                                <span className='vl'></span>
                                <li className='nav-item nav-link' onClick={openRegisterModal}>
                                    {t('register')}
                                </li>
                            </>
                        ) : (
                            <ProfileDropdown closeDrawer={closeDrawer} settings={settings} handleLogout={handleLogout} isDrawer={true} />
                        )}
                    </li>
                    <li className='mobile_nav_tab'>
                        <CurrencyDropdown settings={settings} />
                    </li>
                    <li className='mobile_nav_tab'>
                        <LanguageDropdown getLanguageData={getLanguageData} settings={settings} />
                    </li>
                    <li className='mobile_nav_tab'>
                        <Link href={"/ad-listing"}>
                            <button className='ad_listing' disabled={isAdListingClicked} onClick={handleCheckLogin} >
                                <IoIosAddCircleOutline size={18} />
                                <span>
                                    {t('adListing')}
                                </span>
                            </button>
                        </Link>
                    </li>
                    <div className='card-body'>
                        <Collapse
                            className="all_filters"
                            expandIconPosition="right"
                            expandIcon={({ isActive }) => (
                                <DownOutlined rotate={isActive ? 180 : 0} size={24} />
                            )}
                            defaultActiveKey={['1']}
                        >
                            <Panel header={t("category")} key="1">
                                <FilterTree show={show} setShow={setShow} />
                            </Panel>
                        </Collapse>
                    </div>

                </ul>
            </Drawer >


            <LoginModal IsLoginModalOpen={IsLoginModalOpen} setIsLoginModalOpen={setIsLoginModalOpen} setIsRegisterModalOpen={setIsRegisterModalOpen} IsMailSentOpen={IsMailSentOpen} setIsMailSentOpen={setIsMailSentOpen} IsRegisterModalOpen={IsRegisterModalOpen} openSentMailModal={openSentMailModal} />

            <MailSentSucessfully IsMailSentOpen={IsMailSentOpen} OnHide={() => setIsMailSentOpen(false)} IsLoginModalOpen={() => setIsLoginModalOpen(true)} />

            <LocationModal IsLocationModalOpen={IsLocationModalOpen} OnHide={() => setIsLocationModalOpen(false)} />
        </>
    )
}

export default Header

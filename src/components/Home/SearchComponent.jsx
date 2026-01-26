"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { IoIosAddCircleOutline } from "react-icons/io";
import { GiHamburgerMenu } from "react-icons/gi";
import dynamic from "next/dynamic";
import { GrLocation } from "react-icons/gr";
import { Select } from "antd";
import { BiPlanet } from "react-icons/bi";
import { FaSearch } from "react-icons/fa";

import Link from "next/link";
import "swiper/css";
import { getSlug, isEmptyObject, placeholderImage, t, truncate } from "@/utils";
import { useDispatch, useSelector } from "react-redux";
import { MdClose } from "react-icons/md";
import { logoutSuccess, userSignUpData } from "../../redux/reuducer/authSlice";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import FirebaseData from "@/utils/Firebase";
import { settingsData } from "@/redux/reuducer/settingSlice";
import { getLanguageApi, getLimitsApi } from "@/utils/api";
import {
  CurrentLanguageData,
  setCurrentLanguage,
} from "@/redux/reuducer/languageSlice";
import LanguageDropdown from "../HeaderDropdowns/LanguageDropdown";
import { useRouter, usePathname } from "next/navigation";
import { setSearch } from "@/redux/reuducer/searchSlice";
import { isLogin } from "@/utils";
import {
  CategoryData,
  CurrentPage,
  LastPage,
  setCatCurrentPage,
  setCatLastPage,
  setCateData,
  setTreeData,
} from "@/redux/reuducer/categorySlice";
import { categoryApi } from "@/utils/api";
import { Collapse } from "antd";
import FilterTree from "../Category/FilterTree";
import { DownOutlined } from "@ant-design/icons";
import LocationModal from "../LandingPage/LocationModal";
import { saveOfferData } from "@/redux/reuducer/offerSlice";
const ProfileDropdown = dynamic(() => import("../Profile/ProfileDropdown.jsx"));
const MailSentSucessfully = dynamic(
  () => import("../Auth/MailSentSucessfully.jsx"),
  { ssr: false }
);
const LoginModal = dynamic(() => import("../Auth/LoginModal.jsx"), {
  ssr: false,
});

const { Panel } = Collapse;

const { Option } = Select;

const SearchComponent = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const UserData = useSelector(userSignUpData);
  const systemSettings = useSelector(settingsData);
  const settings = systemSettings?.data;
  const cateData = useSelector(CategoryData);
  console.log(cateData); // Check if cateData is being populated

  const catCurrentPage = useSelector(CurrentPage);
  const catLastPage = useSelector(LastPage);
  const { signOut } = FirebaseData();
  const [IsRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [IsLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [IsMailSentOpen, setIsMailSentOpen] = useState(false);
  const [IsLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [catId, setCatId] = useState("");
  const [slug, setSlug] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const cityData = useSelector((state) => state?.Location?.cityData);
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const headerCatSelected = getSlug(pathname);
  const [isAdListingClicked, setIsAdListingClicked] = useState(false);

  const getCategoriesData = async (page) => {
    try {
      const response = await categoryApi.getCategory({ page: `${page}` });
      const { data } = response.data;

      if (data && Array.isArray(data.data)) {
        if (page > 1) {
          dispatch(setCateData([...cateData, ...data.data]));
        } else {
          dispatch(setCateData(data.data));
          dispatch(setTreeData([]));
        }
      }
      dispatch(setCatLastPage(data?.last_page));
      dispatch(setCatCurrentPage(data?.current_page));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (pathname === "/" || cateData.length === 0) {
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
        subcategories:
          category.subcategories?.length > 0
            ? translateCategories(category.subcategories) // Recursively translate subcategories
            : [], // Default to empty array if no subcategories
      };
    });
  };

  useEffect(() => {
    if (cateData.length > 0) {
      const updatedCateData = translateCategories(cateData);
      dispatch(setCateData(updatedCateData));
    }
  }, [CurrentLanguage]);

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
          setShow(false);
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
  };

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
  };

  useEffect(() => {
    if (isEmptyObject(CurrentLanguage)) {
      setDefaultLanguage();
    }
  }, []);

  useEffect(() => {
    const categoryPathRegex = /^\/category(\/|$)/;
    if (pathname != "/products" && !categoryPathRegex.test(pathname)) {
      dispatch(setSearch(""));
      setSearchQuery("");
      setCatId("");
    }
  }, [pathname]);

  const closeDrawer = () => {
    if (show) {
      setShow(false);
    }
  };

  const openRegisterModal = () => {
    if (show) {
      setShow(false);
    }
    setIsLoginModalOpen(true);
    setIsRegisterModalOpen(true);
  };
  const openLoginModal = () => {
    if (show) {
      setShow(false);
    }
    if (IsRegisterModalOpen) {
      setIsRegisterModalOpen(false);
    }
    setIsLoginModalOpen(true);
  };
  const openSentMailModal = () => {
    setIsLoginModalOpen(false);
    setIsMailSentOpen(true);
  };

  const openLocationEditModal = () => {
    if (show) {
      setShow(false);
    }
    setIsLocationModalOpen(true);
  };

  const handleLogout = () => {
    if (show) {
      setShow(false);
    }
    Swal.fire({
      title: `${t("areYouSure")} \u200E`,
      text: `${t("logoutConfirmation")} \u200E`,
      icon: "warning",
      showCancelButton: true,
      customClass: {
        confirmButton: "Swal-confirm-buttons",
        cancelButton: "Swal-cancel-buttons",
      },
      confirmButtonText: t("yes"),
    }).then((result) => {
      if (result.isConfirmed) {
        // // Clear the recaptchaVerifier by setting it to null
        // window.recaptchaVerifier = null;

        // Perform the logout action
        logoutSuccess();
        signOut();
        router.push("/");
        saveOfferData([]);
        toast.success(t("signOutSuccess"));
      } else {
        toast.error(t("signOutCancelled"));
      }
    });
  };

  const CloseIcon = (
    <div className="close_icon_cont">
      <MdClose size={24} color="black" />
    </div>
  );

  const handleCategoryChange = (value) => {
    if (value?.value === "") {
      setCatId("");
      return;
    }
    const category = cateData.find((item) => item?.id === Number(value.key));
    const catId = category?.id;
    const slug = category?.slug;

    if (catId) {
      setCatId(catId);
    }
    if (slug) {
      setSlug(slug);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchNav = (e) => {
    e.preventDefault();
    if (catId) {
      dispatch(setSearch(searchQuery));
      router.push(`/category/${slug}`);
    } else {
      dispatch(setSearch(searchQuery));
      router.push(`/products`);
    }
  };

  const getLimitsData = async () => {
    try {
      setIsAdListingClicked(true);
      const res = await getLimitsApi.getLimits({
        package_type: "item_listing",
      });
      if (res?.data?.error === false) {
        router.push("/ad-listing");
      } else {
        toast.error(t("purchasePlan"));
        router.push("/subscription");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsAdListingClicked(false);
    }
  };
  const handleCheckLogin = async (e) => {
    e.preventDefault();

    // Check if the user is logged in
    if (!isLogin()) {
      return Swal.fire({
        icon: "error",
        title: t("oops"),
        text: t("loginFirst"),
        allowOutsideClick: false,
        customClass: { confirmButton: "Swal-confirm-buttons" },
      });
    }
    // Check if user profile is complete
    if (!UserData?.name || !UserData?.email) {
      return Swal.fire({
        title: t("oops"),
        text: t("youNeedToUpdateProfile"),
        icon: "warning",
        showCancelButton: false,
        customClass: { confirmButton: "Swal-confirm-buttons" },
        confirmButtonText: "Ok",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/profile/edit-profile");
        }
      });
    }

    // Check for free ad listing setting and route accordingly
    if (Number(settings?.free_ad_listing) === 1) {
      return router.push("/ad-listing");
    }
    // Otherwise, fetch limits data
    await getLimitsData();
    handleClose();
  };

  const handleCategoryScroll = (event) => {
    const { target } = event;
    if (
      target.scrollTop + target.offsetHeight >= target.scrollHeight &&
      catCurrentPage < catLastPage
    ) {
      getCategoriesData(catCurrentPage + 1);
    }
  };

  return (


    <div className="container main_padding" style={{marginTop:'30px'}}>
        <h4>#1 Classifieds website in Europe & Asia</h4>
  
    <div className="category_search">
      <div className="">
        <Select
          showSearch
          style={{ width: "400px", padding: '30px 0',
            border: '1px solid #c6c6c6',
            borderRadius: '10px'}}
          onChange={handleCategoryChange}
          labelInValue
          placeholder={t("categorySelect")}
          filterOption={true} // Disable default filter to use custom filter
          defaultValue=""
          className="web_ant_select"
          onPopupScroll={handleCategoryScroll}
        >
          <Option value="">{t("allCategories")}</Option>
          {cateData &&
            cateData.length > 0 &&
            cateData.map((cat) => (
              <Option key={cat?.id} value={cat.name}>
                {cat?.translated_name || cat?.name || "Unnamed Category"}{" "}
                {/* Fallback to name if translated_name is not available */}
              </Option>
            ))}
        </Select>
      </div>
      <form className="search_cont_own" onSubmit={handleSearchNav}>
        <div className="srchIconinput_cont_own">
     
          <input
            type="text"
            placeholder={t("searchItem")}
            style={{ width: "400px"
                
                }}

            onChange={handleSearch}
            value={searchQuery}
          />
        </div>
        <button id="own-btn" type="submit">
          <FaSearch size={14} />
          <span className="srch">{t("search")}</span>
        </button>
      </form>
    </div>
    </div>
  );
};

export default SearchComponent;

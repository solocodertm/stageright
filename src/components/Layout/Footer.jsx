"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import bg from "../../../public/assets/NewBG.png";
import { FaFacebook, FaLinkedin } from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";
import googleDownload from "../../../public/assets/Google Download.svg";
import appleDownload from "../../../public/assets/iOS Download.svg";
import { usePathname } from "next/navigation";
import { placeholderImage, t } from "@/utils";
import { settingsData } from "@/redux/reuducer/settingSlice";
import { useSelector } from "react-redux";
import NewsletterSubscription from "../NewsletterSubscription";

const Footer = () => {
  const pathname = usePathname();
  const isLandingPage = pathname === "/home";
  const [showDownloadLinks, setShowDownloadLinks] = useState(false);
  const systemSettingsData = useSelector(settingsData);
  const settings = systemSettingsData?.data;
  const currentYear = new Date().getFullYear();

  const showGetInTouchSection =
    settings?.company_address ||
    settings?.company_email ||
    settings?.company_tel1;
  useEffect(() => {
    if (
      settings?.play_store_link &&
      settings?.app_store_link &&
      isLandingPage
    ) {
      setShowDownloadLinks(true);
    } else {
      setShowDownloadLinks(false);
    }
  }, [settings, isLandingPage]);

  return (
    <section
      className="main_footer"
      style={{ marginTop: showDownloadLinks ? "200px" : "60px" }}
    >
      <div className="container">
        {showDownloadLinks ? (
          <div
            className="eClassifyApp"
            style={{
              background: `url(${bg.src})`,
              backgroundSize: "cover",
            }}
          >
            <div className="details">
              <div className="social_text">
                <span>
                  {t("experienceTheMagic")} {settings?.company_name} {t("app")}
                </span>
              </div>
              <div className="social_links">
                {settings?.app_store_link && (
                  <Link href={settings?.play_store_link}>
                    <Image
                      src={googleDownload}
                      alt="google"
                      width={0}
                      height={0}
                      className="google"
                      onErrorCapture={placeholderImage}
                    />
                  </Link>
                )}
                {settings?.app_store_link && (
                  <Link href={settings?.app_store_link}>
                    <Image
                      src={appleDownload}
                      alt="apple"
                      width={0}
                      height={0}
                      className="apple"
                      onErrorCapture={placeholderImage}
                    />
                  </Link>
                )}
              </div>
              {/* </div> */}
            </div>
          </div>
        ) : null}

        <div className="row d-flex align-items-start" id="footer_deatils">
          <div className="col-6 col-md-6 col-lg-2">
            <div id="footer_logo_section" className="text-center">
              <Link href={`${isLandingPage ? "/home" : "/"}`}>
                <Image
                  loading="lazy"
                  src="public/assets/logo.svg"
                  alt="eclassify_logo"
                  width={0}
                  height={0}
                  className="img-fluid"
                  onErrorCapture={placeholderImage}
                />
              </Link>
            </div>
            <div className="app_decs">
              {/* <p>{settings?.footer_description}</p> */}
            </div>
            <div className="social_media">
              <a href={settings?.facebook_link}>
                <button>
                  <FaFacebook size={22} />
                </button>
              </a>

              <a href={settings?.x_link}>
                <button>
                  <FaSquareXTwitter size={22} />
                </button>
              </a>

              <a href={settings?.linkedin_link}>
                <button>
                  <FaLinkedin size={22} />
                </button>
              </a>
            </div>
          </div>

          <div className="col-6 col-md-6 col-lg-2">
            <div className="quick_links_section">
              <div className="footer_headlines">
                <span>{t("quickAction")}</span>
              </div>
              <div className="footer_links">
                <Link href="/ad-listing">
                  <span>{t("postAd")}</span>
                </Link>
              </div>
              <div className="footer_links">
                <Link href="/ads">
                  <span>{t("myAdsDashboard")}</span>
                </Link>
              </div>
              <div className="footer_links">
                <Link href="/favourites">
                  <span>{t("savedSearchAlerts")}</span>
                </Link>
              </div>
              <div className="footer_links">
                <Link href={"/profile/edit-profile"}>
                  <span>{t("myAccount")}</span>
                </Link>
              </div>
              <div className="footer_links">
                <Link href={"/pages/payment-methods"}>
                  <span>{t("paymentMethods")}</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-6 col-lg-2 ">
            <div className="quick_links_section">
              <div className="footer_headlines">
                <span>{t("support")}</span>
              </div>
              <div className="footer_links">
                <Link href={"/faqs"}>
                  <span>{t("faqs")}</span>
                </Link>
              </div>
              <div className="footer_links">
                <Link href={"/contact-us"}>
                  <span>{t("contactUs")}</span>
                </Link>
              </div>
              <div className="footer_links">
                <Link href={"/how-it-works"}>
                  <span>{t("howItWorks")}</span>
                </Link>
              </div>
              <div className="footer_links">
                <Link href={"/report-a-problem"}>
                  <span>{t("reportAProblem")}</span>
                </Link>
              </div>
              <div className="footer_links">
                <Link href={"/safe-trading-guide"}>
                  <span>{t("safeTradingGuide")}</span>
                </Link>
              </div>
            </div>
          </div>

          {showGetInTouchSection && (
            <div className="col-6 col-md-6 col-lg-2">
              <div className="get_in_touch_section">
                <div className="footer_headlines">
                  <span>{t("company")}</span>
                </div>
                <div className="footer_links">
                  <Link href={"/about"}>
                    <span>{t("aboutUs")}</span>
                  </Link>
                </div>
                <div className="footer_links">
                  <Link href={"/careers"}>
                    <span>{t("careers")}</span>
                  </Link>
                </div>
                <div className="footer_links">
                  <Link href={"/partners"}>
                    <span>{t("partners")}</span>
                  </Link>
                </div>

                {/* <div className="footer_links">
                <Link href={"/pages/how-do-i-order"}>
                  <span>{t("howDoIOrder")}</span>
                </Link>
              </div> */}

                <div className="footer_links">
                  <Link href={"/pages/privacy-policy"}>
                    <span>{t("privacyPolicy")}</span>
                  </Link>
                </div>
                <div className="footer_links">
                  <Link href={"/pages/terms-and-conditions"}>
                    <span>{t("termsAndConditions")}</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="col-12 col-md-6 col-lg-3">
            <div className="quick_links_section">
              <div className="footer_headlines">
                <span>{t("explore")}</span>
              </div>
              <div className="contact_details">
                <div className="footer_links">
                  <Link href="/products">
                    <span>{t("dealsFreeStuff")}</span>
                  </Link>
                </div>
              </div>
              <div className="contact_details">
                <div className="footer_links">
                  <Link href="/blogs">
                    <span> {t("communityBlog")}</span>
                  </Link>
                </div>
              </div>
              <div className="contact_details">
                <div className="footer_links">
                  <Link href="/reviews">
                    <span>{t("referralsInviteEarn")}</span>
                  </Link>
                </div>
              </div>
              {/* <div className="footer_links">
                <Link href={"/pages/refund-policy"}>
                  <span>{t("refundPolicy")}</span>
                </Link>
              </div> */}
              <NewsletterSubscription />
            </div>
          </div>

          <div className="copy_right_footer">
            <div className="copyright">
              <span>
                {t("copyright")} © Vidaki {currentYear}.{" "}
                {t("allRightsReserved")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Footer;

import { Dropdown } from "antd";
import Image from "next/image";
import { IoMdArrowDropdown } from "react-icons/io";

import { useDispatch, useSelector } from "react-redux";
import {
  CurrentCurrencyData,
  setCurrentCurrency,
} from "@/redux/reuducer/currencySlice";
import { getAllCountries } from "@/config/countries";

const CurrencyDropdown = ({ settings }) => {
  const CurrentCurrency = useSelector(CurrentCurrencyData);

  const currencies = settings && settings?.currencies;
  const allCountries = getAllCountries();
  const allowedCurrencyCodes = new Set(
    allCountries.map((country) => country.currency?.toUpperCase()).filter(Boolean)
  );

  const filteredCurrencies =
    currencies &&
    currencies.filter((currency) =>
      allowedCurrencyCodes.has(currency.code?.toUpperCase())
    );

  const effectiveCurrencies =
    filteredCurrencies && filteredCurrencies.length > 0
      ? filteredCurrencies
      : currencies;
  const dispatch = useDispatch();
  const handleLanguageSelect = (prop) => {
    const selected = effectiveCurrencies?.find(
      (item) => item.id === Number(prop.key)
    );
    if (!selected) return;
    if (CurrentCurrency.id === selected.id) {
      return;
    }
    dispatch(setCurrentCurrency(selected));
    window?.location?.reload()
  };
  const items =
    effectiveCurrencies &&
    effectiveCurrencies.map((currency) => ({
      label: (
        <span className="lang_options">
          <span>{currency?.code?.toLowerCase()}</span>
          <span>{currency.symbol}</span>
        </span>
      ),
      key: currency.id,
    }));

  const menuProps = {
    items,
    onClick: handleLanguageSelect,
  };

  return (
    <Dropdown menu={menuProps} className="language_dropdown">
      <span className="d-flex align-items-center">
        <span>{CurrentCurrency?.code?.toLowerCase()}</span>
        <span>{CurrentCurrency?.symbol}</span>
        <span>{effectiveCurrencies?.length > 1 ? <IoMdArrowDropdown /> : <></>}</span>
      </span>
    </Dropdown>
  );
};

export default CurrencyDropdown;

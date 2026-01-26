import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';
import settingsReducer from "../reuducer/settingSlice";
import sliderReducer from '../reuducer/sliderSlice';
import categoryReducer from '../reuducer/categorySlice'
import userReducer from '../reuducer/userSlice';
import BreadcrumbPathReducer from '../reuducer/breadCrumbSlice'
import CurrentLanguageReducer from '../reuducer/languageSlice'
import CurrentCurrencyReducer from '../reuducer/currencySlice'
import locationReducer from '../reuducer/locationSlice';
import offerReducer from '../reuducer/offerSlice';
import searchReducer from "../reuducer/searchSlice"
import globalStateReducer from '../reuducer/globalStateSlice';
import filterReducer from '../reuducer/filterSlice'
import countryReducer from '../reuducer/countrySlice'

// Create noop storage for server-side rendering
const createNoopStorage = () => {
  return {
    getItem(_key) {
      return Promise.resolve(null);
    },
    setItem(_key, value) {
      return Promise.resolve(value);
    },
    removeItem(_key) {
      return Promise.resolve();
    },
  };
};

// Use localStorage if available, otherwise use noop storage
const clientStorage = typeof window !== 'undefined' 
  ? createWebStorage('local') 
  : createNoopStorage();

const persistConfig = {
  key: 'root',
  storage: clientStorage,
  manualPersisting: true,
};


const rootReducer = combineReducers({
  Settings: settingsReducer,
  Slider: sliderReducer,
  Category: categoryReducer,
  UserSignup: userReducer,
  BreadcrumbPath: BreadcrumbPathReducer,
  CurrentLanguage: CurrentLanguageReducer,
  CurrentCurrency: CurrentCurrencyReducer,
  Location: locationReducer,
  OfferData: offerReducer,
  Search: searchReducer,
  GlobalState: globalStateReducer,
  Filter: filterReducer,
  CurrentCountry: countryReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => [
    ...getDefaultMiddleware({
      serializableCheck: false,
    }),
  ],
});

export const persistor = persistStore(store);

import { createSelector, createSlice } from "@reduxjs/toolkit";

const initialState = {
  countryCode: null, // e.g., 'US', 'GB'
  countryName: null, // e.g., 'United States'
  detected: false, // Whether country was auto-detected via GeoIP
};

export const countrySlice = createSlice({
  name: "CurrentCountry",
  initialState,
  reducers: {
    setCurrentCountry: (state, action) => {
      const { code, name, detected = false } = action.payload;
      state.countryCode = code?.toUpperCase() || null;
      state.countryName = name || null;
      state.detected = detected;
    },
    resetCurrentCountry: (state) => {
      state.countryCode = null;
      state.countryName = null;
      state.detected = false;
    },
  },
});

// Selectors
export const CurrentCountryData = createSelector(
  [(state) => state.CurrentCountry],
  (country) => country
);

export const CurrentCountryCode = createSelector(
  [(state) => state.CurrentCountry],
  (country) => country.countryCode
);

export const { setCurrentCountry, resetCurrentCountry } = countrySlice.actions;

export default countrySlice.reducer;




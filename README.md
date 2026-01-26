## Vidaki Classifieds – Country‑Aware Marketplace Frontend

This is the Next.js 14 App Router frontend for **Vidaki**, a multi‑country classifieds marketplace.  
The app implements **country‑based URLs**, **IP auto‑detection**, and **UI‑only language switching** with static JSON translations.

---

## Getting Started

- **Install dependencies**

```bash
npm install
```

- **Create `.env.local`**

```env
NEXT_PUBLIC_API_URL=https://stageleft.vidaki.com/api
NEXT_PUBLIC_END_POINT=/
NEXT_PUBLIC_WEB_URL=http://localhost:3000

NEXT_PUBLIC_META_TITLE=Vidaki Classifieds
NEXT_PUBLIC_META_DESCRIPTION=Find and list classified ads
NEXT_PUBLIC_META_kEYWORDS=classifieds,ads,marketplace

NEXT_PUBLIC_DEFAULT_COUNTRY=US
NEXT_PUBLIC_WEB_VERSION=1.0.0
```

- **Run the dev server**

```bash
npm run dev          # localhost only
# or
npm run hostdev      # for LAN / device testing
```

App URLs:
- `http://localhost:3000` – root (auto‑detects and redirects to a country)
- `http://localhost:3000/us`, `/gb`, `/de`, etc. – country pages

---

## URL & Routing Model

- **Country in URL (ISO alpha‑2, lowercase)**  
  - `/` → detects country (cookie → GeoIP API → fallback `US`) and redirects to `/{countryCode}`
  - `/{countryCode}` → home page for that country (e.g. `/us`, `/gb`)
  - `/{countryCode}/item/{slug}` → item details
  - `/{countryCode}/category/{slug}` → category listings

- **Language is UI‑only**
  - Language **never appears in the URL**
  - SEO is based on **country**, not language

Key routing files:
- `src/app/[country]/layout.jsx`
- `src/app/[country]/page.jsx`
- `src/app/[country]/item/[slug]/page.jsx`
- `src/app/[country]/category/[[...slug]]/page.jsx`
- `src/app/page.js` – root redirect + IP detection

---

## Country Handling

- **Config**
  - `src/config/countries.js` – list of 20 supported countries and helpers

- **State**
  - Redux slice: `src/redux/reuducer/countrySlice.js` (`CurrentCountry`)
  - Added to Redux store and used throughout the app

- **Hook**
  - `src/utils/useCountry.js`  
    - Reads country from URL
    - Exposes uppercase for API (`US`) and lowercase for URLs (`us`)

- **Usage pattern in components**

```javascript
import { useCountry } from '@/utils/useCountry';

const { countryCode } = useCountry(); // e.g. "US"

allItemApi.getItems({
  ...params,
  country: countryCode,
});
```

All API calls that depend on country should include this `country` param.

---

## Language & Translations

- **Storage**
  - Language is saved in:
    - Cookie: `user_language` (365‑day expiry)
    - Redux state (`CurrentLanguage`)
    - localStorage via Redux Persist

- **Static JSON translations**
  - Directory: `src/utils/locale/`
  - Implemented languages:
    - ✅ `en.json` – English (base)
    - Additional files (to create): `es.json`, `fr.json`, `de.json`, `it.json`, `pt.json`, `nl.json`, `sv.json`, `no.json`, `da.json`, `fi.json`, `ja.json`, `zh.json`, `ar.json`

- **Load order**

```text
1. Static JSON file: src/utils/locale/{lang}.json
2. If missing → backend API: GET /api/get-languages
3. If that fails → English fallback (en.json)
```

- **Key utilities**
  - `src/utils/cookies.js` – cookie helpers and language cookie utilities
  - `src/utils/translations.js` – loads translations with static‑file‑first strategy

- **Where language is used**
  - `Header.jsx`, `LandingPageHeader.jsx`, `Home/SearchComponent.jsx` call into the translation loader and update Redux.

---

## Core API Expectations (Backend)

The frontend assumes the following endpoints exist (most already do):

- `GET /api/get-locale-by-ip`
  - Returns `{ country_code: "US", country_name: "...", ... }`
  - Used on `/` to auto‑detect country.

- `GET /api/get-item`
  - Must accept `country` (ISO alpha‑2) and filter results by it.

- `GET /api/get-categories` (optional country filter)
- `GET /api/get-featured-section` (optional country filter)
- `POST /api/set-country` (optional – syncs preference)
- `GET /api/get-languages?language_code={code}&type=web`
  - Fallback for translations if static JSON is missing.

Country codes are **lowercase in URLs** (`/us`) and **uppercase for API** (`US`).

---

## Local Testing Checklist

- `/`:
  - Shows loading then redirects to `/{countryCode}` based on cookie/GeoIP.

- `/{countryCode}`:
  - Page loads correctly for all 20 countries.
  - All item/category/featured API calls include `country={CODE}`.

- Country behavior:
  - Invalid codes (e.g. `/xx`) return a 404 page.
  - Country changes (via switcher if enabled) update URL and data.

- Language behavior:
  - Changing language **does not change the URL**.
  - `user_language` cookie is set and Redux state updates.
  - If static JSON exists, no translation API call is made.

Use browser DevTools (Network + Redux DevTools) to verify API params and Redux slices.

---

## SEO Notes

- Each country page defines:
  - Canonical URL: `NEXT_PUBLIC_WEB_URL/{countryCode}/...`
  - `hreflang` tags for all countries plus `x-default`
  - Open Graph and structured data with country awareness

Language is independent of SEO: search engines see country‑based URLs only.

---

## Development Tips

- After changing `.env.local` or adding translation JSON files, **restart** the dev server.
- Warnings about dynamic imports for translation files during build are expected and safe.
- When adding new API calls or pages, always:
  - Use `useCountry()` to pick up the current country.
  - Pass `country` to relevant backend endpoints.

This README replaces the older internal docs; refer to git history if you need the original detailed implementation notes.

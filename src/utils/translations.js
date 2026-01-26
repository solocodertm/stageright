/**
 * Translation Loader
 * Prioritizes static JSON files, falls back to API
 */

import enTranslation from './locale/en.json';

// Supported languages mapping
const SUPPORTED_LANGUAGES = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  de: 'de',
  it: 'it',
  pt: 'pt',
  nl: 'nl',
  sv: 'sv',
  no: 'no',
  da: 'da',
  fi: 'fi',
  ja: 'ja',
  zh: 'zh',
  ar: 'ar',
};

/**
 * Dynamically import translation file
 * Uses webpack magic comment to make imports optional
 * @param {string} languageCode - Language code
 * @returns {Promise<Object|null>} Translation object or null if not found
 */
async function loadStaticTranslation(languageCode) {
  const code = languageCode.toLowerCase();
  
  // English is always available (imported statically)
  if (code === 'en') {
    return enTranslation;
  }
  
  // For other languages, try to dynamically import
  // Use webpack magic comment to make it optional (won't fail build if file missing)
  try {
    // Build the path dynamically
    const translationPath = `./locale/${code}.json`;
    
    // Use webpack magic comment to make import optional
    // This tells webpack not to fail if the module doesn't exist
    const translationModule = await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "locale-[request]" */
      /* webpackExclude: /node_modules/ */
      translationPath
    ).catch(() => null);
    
    if (translationModule && (translationModule.default || translationModule)) {
      return translationModule.default || translationModule;
    }
    
    return null;
  } catch (error) {
    // File doesn't exist or import failed
    // This is expected for languages without static files
    // Will fall back to API
    return null;
  }
}

/**
 * Load translations from API (fallback)
 * @param {string} languageCode - Language code
 * @param {Function} getLanguageApi - API function
 * @returns {Promise<Object|null>} Translation data or null
 */
async function loadApiTranslation(languageCode, getLanguageApi) {
  try {
    const res = await getLanguageApi.getLanguage({ language_code: languageCode, type: 'web' });
    
    if (res?.data?.error === true) {
      console.error('API translation error:', res?.data?.message);
      return null;
    }
    
    return res?.data?.data || null;
  } catch (error) {
    console.error('Failed to load translation from API:', error);
    return null;
  }
}

/**
 * Load language translations
 * Priority: Static JSON > API > English fallback
 * @param {string} languageCode - Language code
 * @param {Function} getLanguageApi - API function (optional, for fallback)
 * @returns {Promise<Object>} Language data object
 */
export async function loadLanguageTranslations(languageCode, getLanguageApi = null) {
  const normalizedCode = languageCode?.toLowerCase() || 'en';
  
  // Try static JSON first
  const staticTranslation = await loadStaticTranslation(normalizedCode);
  
  // If static translation exists and has data, use it
  if (staticTranslation && typeof staticTranslation === 'object' && Object.keys(staticTranslation).length > 0) {
    return {
      code: normalizedCode,
      name: getLanguageName(normalizedCode),
      file_name: staticTranslation,
      // Include other metadata if needed
      id: SUPPORTED_LANGUAGES[normalizedCode] ? normalizedCode : 'en',
    };
  }
  
  // Fallback to API if static file not found
  if (getLanguageApi) {
    try {
      const apiTranslation = await loadApiTranslation(normalizedCode, getLanguageApi);
      if (apiTranslation) {
        return apiTranslation;
      }
    } catch (apiError) {
      console.warn('API translation failed, using English fallback:', apiError);
    }
  }
  
  // Final fallback: English
  return {
    code: 'en',
    name: 'English',
    file_name: enTranslation,
    id: 'en',
  };
}

/**
 * Get language name from code
 * @param {string} code - Language code
 * @returns {string} Language name
 */
function getLanguageName(code) {
  const names = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    nl: 'Dutch',
    sv: 'Swedish',
    no: 'Norwegian',
    da: 'Danish',
    fi: 'Finnish',
    ja: 'Japanese',
    zh: 'Chinese',
    ar: 'Arabic',
  };
  
  return names[code.toLowerCase()] || 'English';
}

/**
 * Check if static translation file exists for language
 * @param {string} languageCode - Language code
 * @returns {boolean} True if static file exists
 */
export function hasStaticTranslation(languageCode) {
  return SUPPORTED_LANGUAGES.hasOwnProperty(languageCode.toLowerCase());
}


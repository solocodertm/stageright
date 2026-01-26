/**
 * Cookie Utility Functions
 * Handles cookie storage and retrieval for language preferences
 */

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  
  return null;
}

/**
 * Set a cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Expiration days (default: 365)
 */
export function setCookie(name, value, days = 365) {
  if (typeof document === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Remove a cookie
 * @param {string} name - Cookie name
 */
export function removeCookie(name) {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

/**
 * Get language preference from cookie
 * @returns {string|null} Language code or null
 */
export function getLanguageFromCookie() {
  return getCookie('user_language');
}

/**
 * Save language preference to cookie
 * @param {string} languageCode - Language code (e.g., 'en', 'es', 'fr')
 */
export function saveLanguageToCookie(languageCode) {
  setCookie('user_language', languageCode, 365);
}



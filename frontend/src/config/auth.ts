/**
 * Authentication configuration for passport.oceanheart.ai integration
 */

export interface AuthConfig {
  authUrl: string;
  returnTo: string;
  cookieDomain: string;
  apiUrl: string;
}

/**
 * Get environment-specific auth configuration
 */
export function getAuthConfig(): AuthConfig {
  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';

  if (isDev) {
    // Passport runs on port 4000 in development
    return {
      authUrl: 'http://passport.lvh.me:4000',
      returnTo: `http://${window.location.host}/app`,
      cookieDomain: '.lvh.me',
      apiUrl: 'http://localhost:8001/api',
    };
  }

  return {
    authUrl: 'https://passport.oceanheart.ai',
    returnTo: 'https://watson.oceanheart.ai/app',
    cookieDomain: '.oceanheart.ai',
    apiUrl: 'https://watson.oceanheart.ai/api',
  };
}

/**
 * Get the login URL for passport.oceanheart.ai
 */
export function getLoginUrl(returnTo?: string): string {
  const config = getAuthConfig();
  const returnUrl = returnTo || config.returnTo;
  return `${config.authUrl}/auth?return_to=${encodeURIComponent(returnUrl)}`;
}

/**
 * Get the logout URL for passport.oceanheart.ai
 */
export function getLogoutUrl(): string {
  const config = getAuthConfig();
  return `${config.authUrl}/logout?return_to=${encodeURIComponent(window.location.origin)}`;
}

/**
 * Redirect to passport login
 */
export function redirectToLogin(returnTo?: string): void {
  window.location.href = getLoginUrl(returnTo);
}

/**
 * Redirect to passport logout
 */
export function redirectToLogout(): void {
  window.location.href = getLogoutUrl();
}

/**
 * Get cookie value by name
 */
export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string, domain?: string): void {
  const config = getAuthConfig();
  const domains = domain ? [domain] : [config.cookieDomain, window.location.hostname];

  domains.forEach((d) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${d}`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  });
}

/**
 * Get JWT token from passport cookie or URL parameter
 * Passport sets a cookie named 'passport_token' after successful auth
 */
export function getPassportToken(): string | null {
  // Check URL parameters first (for redirect from passport)
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('token');
  if (tokenFromUrl) {
    // Clean URL after extracting token
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url.toString());
    return tokenFromUrl;
  }

  // Check cookie
  return getCookie('passport_token');
}

/**
 * Check if user has a valid passport session
 */
export function hasPassportSession(): boolean {
  const token = getPassportToken();
  return !!token;
}

/**
 * Create Authorization header value
 */
export function getAuthHeader(token: string): string {
  return `Bearer ${token}`;
}

/**
 * Create fetch options with auth header
 */
export function getAuthenticatedFetchOptions(token: string): RequestInit {
  return {
    headers: {
      Authorization: getAuthHeader(token),
      'Content-Type': 'application/json',
    },
  };
}

export interface AuthConfig {
  authUrl: string;
  returnTo: string;
  cookieDomain: string;
}

export function getAuthConfig(): AuthConfig {
  const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
  
  if (isDev) {
    return {
      authUrl: 'http://passport.lvh.me:3001/auth',
      returnTo: `http://${window.location.host}/app`,
      cookieDomain: '.lvh.me'
    };
  }
  
  return {
    authUrl: 'https://passport.oceanheart.ai/auth',
    returnTo: 'https://watson.oceanheart.ai/app',
    cookieDomain: '.oceanheart.ai'
  };
}

export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
}

export function deleteCookie(name: string, domain?: string): void {
  const domains = domain ? [domain] : ['.oceanheart.ai', '.lvh.me', window.location.hostname];
  
  domains.forEach(d => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${d}`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  });
}

export function isAuthenticated(): boolean {
  // Temporary localStorage flag for testing
  return localStorage.getItem('isAuthenticated') === 'true';
}
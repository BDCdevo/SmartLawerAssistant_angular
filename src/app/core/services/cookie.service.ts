import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  /**
   * Get a cookie value by name
   * @param name - Cookie name
   * @returns Cookie value or null if not found
   */
  get(name: string): string | null {
    try {
      const nameEQ = name + '=';
      const cookies = document.cookie.split(';');

      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        // Remove leading spaces
        while (cookie.charAt(0) === ' ') {
          cookie = cookie.substring(1, cookie.length);
        }
        // Check if this cookie starts with our name
        if (cookie.indexOf(nameEQ) === 0) {
          const value = cookie.substring(nameEQ.length, cookie.length);
          // Decode URI component
          return decodeURIComponent(value);
        }
      }
      return null;
    } catch (error) {
      console.error('Error reading cookie:', error);
      return null;
    }
  }

  /**
   * Set a cookie
   * @param name - Cookie name
   * @param value - Cookie value
   * @param days - Days until expiration (optional)
   * @param path - Cookie path (default: '/')
   * @param domain - Cookie domain (optional)
   * @param secure - Use secure flag (optional)
   * @param sameSite - SameSite attribute (optional)
   */
  set(
    name: string,
    value: string,
    days?: number,
    path: string = '/',
    domain?: string,
    secure?: boolean,
    sameSite?: 'Strict' | 'Lax' | 'None'
  ): void {
    try {
      let expires = '';
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = '; expires=' + date.toUTCString();
      }

      const encodedValue = encodeURIComponent(value);
      let cookieString = `${name}=${encodedValue}${expires}; path=${path}`;

      if (domain) {
        cookieString += `; domain=${domain}`;
      }

      if (secure) {
        cookieString += '; secure';
      }

      if (sameSite) {
        cookieString += `; SameSite=${sameSite}`;
      }

      document.cookie = cookieString;
    } catch (error) {
      console.error('Error setting cookie:', error);
    }
  }

  /**
   * Delete a cookie
   * @param name - Cookie name
   * @param path - Cookie path (default: '/')
   * @param domain - Cookie domain (optional)
   */
  delete(name: string, path: string = '/', domain?: string): void {
    try {
      let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;

      if (domain) {
        cookieString += `; domain=${domain}`;
      }

      document.cookie = cookieString;
    } catch (error) {
      console.error('Error deleting cookie:', error);
    }
  }

  /**
   * Check if a cookie exists
   * @param name - Cookie name
   * @returns true if cookie exists, false otherwise
   */
  exists(name: string): boolean {
    return this.get(name) !== null;
  }

  /**
   * Get all cookies as an object
   * @returns Object with all cookies
   */
  getAll(): { [key: string]: string } {
    const cookies: { [key: string]: string } = {};
    try {
      const cookieArray = document.cookie.split(';');
      for (const cookie of cookieArray) {
        const [name, value] = cookie.split('=').map(c => c.trim());
        if (name && value) {
          cookies[name] = decodeURIComponent(value);
        }
      }
    } catch (error) {
      console.error('Error getting all cookies:', error);
    }
    return cookies;
  }

  /**
   * Delete all cookies
   */
  deleteAll(): void {
    try {
      const cookies = this.getAll();
      for (const name in cookies) {
        if (cookies.hasOwnProperty(name)) {
          this.delete(name);
        }
      }
    } catch (error) {
      console.error('Error deleting all cookies:', error);
    }
  }
}

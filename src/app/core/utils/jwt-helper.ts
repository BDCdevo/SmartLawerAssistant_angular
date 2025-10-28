/**
 * JWT Helper Utilities
 * Provides functions to decode and validate JWT tokens
 */

export interface DecodedToken {
  [key: string]: any;
  exp?: number;
  iat?: number;
  nbf?: number;
}

export class JwtHelper {
  /**
   * Decode a JWT token without verifying signature
   * @param token - The JWT token string
   * @returns Decoded token payload or null if invalid
   */
  static decode(token: string): DecodedToken | null {
    try {
      if (!token || typeof token !== 'string') {
        return null;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT format: expected 3 parts');
        return null;
      }

      const payload = parts[1];
      // Replace URL-safe characters and decode base64
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  }

  /**
   * Check if a token is expired
   * @param token - The JWT token string or decoded token
   * @returns true if expired, false otherwise
   */
  static isTokenExpired(token: string | DecodedToken): boolean {
    try {
      const decoded = typeof token === 'string' ? this.decode(token) : token;
      if (!decoded || !decoded['exp']) {
        return true;
      }

      // exp is in seconds, Date.now() is in milliseconds
      const expirationDate = decoded['exp'] * 1000;
      return Date.now() >= expirationDate;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Get the expiration date from a token
   * @param token - The JWT token string or decoded token
   * @returns Expiration date or null
   */
  static getTokenExpirationDate(token: string | DecodedToken): Date | null {
    try {
      const decoded = typeof token === 'string' ? this.decode(token) : token;
      if (!decoded || !decoded['exp']) {
        return null;
      }

      return new Date(decoded['exp'] * 1000);
    } catch (error) {
      console.error('Error getting token expiration date:', error);
      return null;
    }
  }

  /**
   * Extract a specific claim from the token
   * @param token - The JWT token string or decoded token
   * @param claim - The claim name to extract
   * @returns The claim value or null
   */
  static getClaim(token: string | DecodedToken, claim: string): any {
    try {
      const decoded = typeof token === 'string' ? this.decode(token) : token;
      return decoded?.[claim] || null;
    } catch (error) {
      console.error('Error getting claim from token:', error);
      return null;
    }
  }

  /**
   * Get user ID from token (tries multiple common claim names)
   * @param token - The JWT token string or decoded token
   * @returns User ID or null
   */
  static getUserId(token: string | DecodedToken): string | null {
    const decoded = typeof token === 'string' ? this.decode(token) : token;
    if (!decoded) return null;

    return (
      decoded['sub'] ||
      decoded['userId'] ||
      decoded['id'] ||
      decoded['nameid'] ||
      decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
      null
    );
  }

  /**
   * Get email from token (tries multiple common claim names)
   * @param token - The JWT token string or decoded token
   * @returns Email or null
   */
  static getEmail(token: string | DecodedToken): string | null {
    const decoded = typeof token === 'string' ? this.decode(token) : token;
    if (!decoded) return null;

    return (
      decoded['email'] ||
      decoded['emailaddress'] ||
      decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
      null
    );
  }

  /**
   * Get role from token (tries multiple common claim names)
   * @param token - The JWT token string or decoded token
   * @returns Role or null
   */
  static getRole(token: string | DecodedToken): string | null {
    const decoded = typeof token === 'string' ? this.decode(token) : token;
    if (!decoded) return null;

    return (
      decoded['role'] ||
      decoded['Role'] ||
      decoded['RoleName'] ||
      decoded['roleName'] ||
      decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      null
    );
  }

  /**
   * Get name from token (tries multiple common claim names)
   * @param token - The JWT token string or decoded token
   * @returns Name or null
   */
  static getName(token: string | DecodedToken): string | null {
    const decoded = typeof token === 'string' ? this.decode(token) : token;
    if (!decoded) return null;

    return (
      decoded['name'] ||
      decoded['Name'] ||
      decoded['DisplayName'] ||
      decoded['display_name'] ||
      decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
      null
    );
  }

  /**
   * Get username from token (tries multiple common claim names)
   * @param token - The JWT token string or decoded token
   * @returns Username or null
   */
  static getUsername(token: string | DecodedToken): string | null {
    const decoded = typeof token === 'string' ? this.decode(token) : token;
    if (!decoded) return null;

    return (
      decoded['unique_name'] ||
      decoded['username'] ||
      decoded['preferred_username'] ||
      decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
      null
    );
  }

  /**
   * Get permission from token
   * @param token - The JWT token string or decoded token
   * @returns Permission or null
   */
  static getPermission(token: string | DecodedToken): string | null {
    const decoded = typeof token === 'string' ? this.decode(token) : token;
    if (!decoded) return null;

    return decoded['permission'] || null;
  }
}

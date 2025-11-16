import { Injectable, inject, signal, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { User, AuthResponse, LoginRequest, RegisterRequest, UserRole } from '../models';
import { environment } from '../../../environments/environment';
import { JwtHelper } from '../utils/jwt-helper';
import { CookieService } from './cookie.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Authentication service for Smart Lawyer Portal
  private http = inject(HttpClient);
  private router = inject(Router);
  private cookieService = inject(CookieService);
  private signalRService?: any; // Lazy load to avoid circular dependency

  // Cookie names that the backend might use
  private readonly TOKEN_COOKIE_NAMES = ['auth_token', 'token', 'jwt', 'access_token', 'accessToken', 'JWT_Token', 'JWT_token'];
  private readonly REFRESH_TOKEN_COOKIE_NAMES = ['refresh_token', 'refreshToken', 'refresh', 'Refresh_Token', 'Refresh_token'];
  private readonly TOKEN_STORAGE_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';
  private readonly ADDITIONAL_STORAGE_KEYS = ['JWT_Token', 'Refresh_Token', 'token', 'jwt'];

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromToken());
  public currentUser$ = this.currentUserSubject.asObservable();

  private apiUrl = `${environment.apiUrl}/Auth`;

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is valid and not expired
    if (JwtHelper.isTokenExpired(token)) {
      return false;
    }

    return !!this.currentUser;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        throw error;
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        throw error;
      })
    );
  }

  checkPhone(phoneNumber: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/check-phone`, { phoneNumber }).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  checkEmail(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/check-email`, { email }).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  forgetPassword(emailOrPhone: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forget-password`, { emailOrPhone }).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  verifyForgetPasswordOtp(phoneNumber: string, otpCode: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify-forget-password-otp`, { phoneNumber, otpCode }).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  resetPassword(phoneNumber: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, { phoneNumber, newPassword }).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  toggleAvailability(): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/toggle-availability`, {}).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile`).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, data).pipe(
      tap(response => {
        // Update current user with new data
        if (response.data) {
          const currentUser = this.currentUser;
          if (currentUser) {
            const updatedUser = { ...currentUser, ...response.data };
            this.currentUserSubject.next(updatedUser);
          }
        }
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  logout(): void {
    // Clear all authentication data immediately
    this.clearAuthData();

    // Clear current user
    this.currentUserSubject.next(null);

    // Navigate to login page
    this.router.navigate(['/auth/login'], {
      queryParams: { message: 'logged_out' }
    });

    // Try to call backend logout in background (optional)
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, { token }).subscribe({
        next: () => {},
        error: () => {}
      });
    }
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return of();
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        this.logout();
        throw error;
      })
    );
  }

  private handleAuthResponse(response: any): void {
    // Extract token from response
    // Backend returns: { success: true, data: { token, firstName, lastName, email, phoneNumber, roleName } }
    let token = response.data?.token || response.token || response.accessToken;

    // Also check cookies (if backend sets it there)
    if (!token) {
      token = this.getToken();
    }

    if (token) {
      // Store token in localStorage for persistence
      localStorage.setItem(this.TOKEN_STORAGE_KEY, token);

      // Extract user data from token claims
      const userFromToken = this.decodeToken(token);

      // Build user object - Priority: response.data > token > fallback
      const data = response.data || {};

      // Map roleName from response to our UserRole enum
      let userRole: UserRole = UserRole.VIEWER;  // Default to Viewer

      // Priority: data.roleName > userFromToken.role
      const roleFromResponse = data.roleName;
      const roleFromToken = userFromToken?.role;

      const roleString = (roleFromResponse || roleFromToken || '').toLowerCase();

      if (roleString.includes('superadmin')) {
        userRole = UserRole.SUPER_ADMIN;
      } else if (roleString.includes('admin') && !roleString.includes('super')) {
        userRole = UserRole.ADMIN;
      } else if (roleString.includes('lawyer')) {
        userRole = UserRole.LAWYER;
      } else if (roleString.includes('viewer')) {
        userRole = UserRole.VIEWER;
      } else if (roleString.includes('assistant')) {
        userRole = UserRole.ASSISTANT;
      } else {
        userRole = UserRole.VIEWER;  // Default fallback
      }

      let user: User = {
        id: userFromToken?.id || '',
        email: data.email || userFromToken?.email || '',
        firstName: data.firstName || userFromToken?.firstName || 'مستخدم',
        lastName: data.lastName || userFromToken?.lastName || '',
        role: userRole,
        phone: data.phoneNumber || userFromToken?.phone || '',
        createdAt: new Date(),
        avatar: userFromToken?.avatar
      };

      // Store user in memory
      this.currentUserSubject.next(user);
    }
  }

  private decodeToken(token: string): User | null {
    try {
      // Check if token is expired first
      if (JwtHelper.isTokenExpired(token)) {
        return null;
      }

      const decoded = JwtHelper.decode(token);
      if (!decoded) {
        return null;
      }

      // Extract user data using JwtHelper and direct claims
      const userId = JwtHelper.getUserId(decoded);
      const email = JwtHelper.getEmail(decoded);
      const role = JwtHelper.getRole(decoded);
      const name = JwtHelper.getName(decoded);

      // Extract display name and username (ASP.NET specific)
      const displayName = decoded['DisplayName'] || decoded['display_name'] || '';
      const userName = decoded['unique_name'] || decoded['username'] || '';

      // Extract first and last name
      let firstName = decoded['firstName'] || decoded['given_name'] || decoded['FirstName'] || '';
      let lastName = decoded['lastName'] || decoded['family_name'] || decoded['LastName'] || '';

      // If no firstName/lastName, try DisplayName
      if (!firstName && !lastName && displayName) {
        const nameParts = displayName.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // If still no names, try to split 'name' claim
      if (!firstName && !lastName && name) {
        const nameParts = name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // Fallback to username or email
      if (!firstName && userName) {
        firstName = userName;
      } else if (!firstName && email) {
        firstName = email.split('@')[0];
      }

      // Extract permissions from token
      let permissions: string[] = [];
      const permissionClaim = decoded['permission'] || decoded['permissions'] || decoded['Permission'] || decoded['Permissions'];

      if (typeof permissionClaim === 'string') {
        // If permission is a single string (like "*" for SuperAdmin)
        permissions = [permissionClaim];
      } else if (Array.isArray(permissionClaim)) {
        // If permissions is an array
        permissions = permissionClaim;
      }

      const user: User = {
        id: userId || email || '',
        email: email || '',
        firstName: firstName || 'مستخدم',
        lastName: lastName || '',
        role: (role || 'Viewer') as any,
        phone: decoded['phone'] || decoded['phoneNumber'] || decoded['PhoneNumber'] || '',
        createdAt: new Date(),
        avatar: decoded['avatar'] || decoded['picture'] || undefined,
        permissions: permissions
      };

      // Validate that we have at least email or id
      if (!user.id && !user.email) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  // Check if current token is valid and not expired
  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !JwtHelper.isTokenExpired(token);
  }

  // Get token expiration date
  getTokenExpirationDate(): Date | null {
    const token = this.getToken();
    if (!token) return null;
    return JwtHelper.getTokenExpirationDate(token);
  }

  /**
   * Get token from cookies or localStorage
   * Tries multiple common cookie names, then checks localStorage
   */
  getToken(): string | null {
    // First, try each possible token cookie name
    for (const cookieName of this.TOKEN_COOKIE_NAMES) {
      const token = this.cookieService.get(cookieName);
      if (token) {
        return token;
      }
    }

    // If not in cookies, check all possible localStorage keys
    const allStorageKeys = [
      this.TOKEN_STORAGE_KEY,
      ...this.ADDITIONAL_STORAGE_KEYS
    ];

    for (const key of allStorageKeys) {
      const storageToken = localStorage.getItem(key);
      if (storageToken) {
        return storageToken;
      }
    }

    return null;
  }

  /**
   * Get refresh token from cookies
   */
  private getRefreshToken(): string | null {
    // Check cookies first
    for (const cookieName of this.REFRESH_TOKEN_COOKIE_NAMES) {
      const token = this.cookieService.get(cookieName);
      if (token) {
        return token;
      }
    }

    // Check localStorage
    const storageToken = localStorage.getItem(this.REFRESH_TOKEN_STORAGE_KEY);
    if (storageToken) {
      return storageToken;
    }

    return null;
  }

  /**
   * Get user from token in cookies
   * This is called on app initialization
   */
  private getUserFromToken(): User | null {
    try {
      const token = this.getToken();
      if (!token) {
        return null;
      }

      // Check if token is expired
      if (JwtHelper.isTokenExpired(token)) {
        return null;
      }

      // Decode token to get user data
      const user = this.decodeToken(token);
      if (user) {
        return user;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Reload user from current token in cookies
   * Useful after app reload or when user data needs to be refreshed
   */
  reloadUserFromToken(): void {
    const user = this.getUserFromToken();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  /**
   * Clear authentication data
   * Note: This only clears client-side cookies that are accessible
   * HttpOnly cookies are managed by the backend
   */
  private clearAuthData(): void {
    // Clear ALL localStorage
    localStorage.clear();

    // Clear ALL cookies (including JWT_Token and Refresh_Token)
    const allCookieNames = [
      ...this.TOKEN_COOKIE_NAMES,
      ...this.REFRESH_TOKEN_COOKIE_NAMES
    ];

    for (const cookieName of allCookieNames) {
      // Try different paths and domains
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;

      this.cookieService.delete(cookieName);
      this.cookieService.delete(cookieName, '/');
      this.cookieService.delete(cookieName, '/', window.location.hostname);
    }
  }

  /**
   * Get all cookies for debugging
   */
  getAllCookies(): { [key: string]: string } {
    return this.cookieService.getAll();
  }
}

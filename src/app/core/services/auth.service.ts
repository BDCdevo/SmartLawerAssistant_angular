import { Injectable, inject, signal } from '@angular/core';
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

  // Cookie names that the backend might use
  private readonly TOKEN_COOKIE_NAMES = ['auth_token', 'token', 'jwt', 'access_token', 'accessToken'];
  private readonly REFRESH_TOKEN_COOKIE_NAMES = ['refresh_token', 'refreshToken', 'refresh'];

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
      console.warn('Token is expired');
      return false;
    }

    return !!this.currentUser;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        console.error('Registration error:', error);
        throw error;
      })
    );
  }

  logout(): void {
    this.clearAuthData();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
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
        console.error('Token refresh error:', error);
        this.logout();
        throw error;
      })
    );
  }

  private handleAuthResponse(response: any): void {
    console.log('✅ Auth response:', response);
    console.log('Available cookies:', this.cookieService.getAll());

    // Extract token from response
    // Backend returns: { success: true, data: { token, firstName, lastName, email, phoneNumber, roleName } }
    let token = response.data?.token || response.token || response.accessToken;

    // Also check cookies (if backend sets it there)
    if (!token) {
      token = this.getToken();
    }

    console.log('Token found:', token ? '✅ Yes' : '❌ No');

    if (token) {
      // Extract user data from token claims
      const userFromToken = this.decodeToken(token);
      console.log('User from token:', userFromToken);

      // Build user object - Priority: response.data > token > fallback
      const data = response.data || {};

      // Map roleName from response to our UserRole enum
      let userRole: UserRole = UserRole.CLIENT;

      if (data.roleName || userFromToken?.role) {
        const roleString = (data.roleName || userFromToken?.role || '').toLowerCase();

        if (roleString.includes('superadmin')) {
          userRole = UserRole.SUPER_ADMIN;
        } else if (roleString.includes('admin')) {
          userRole = UserRole.ADMIN;
        } else if (roleString.includes('lawyer')) {
          userRole = UserRole.LAWYER;
        } else if (roleString.includes('assistant')) {
          userRole = UserRole.ASSISTANT;
        } else {
          userRole = UserRole.CLIENT;
        }
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
      console.log('✅ Login successful! User data:');
      console.log('   - Name:', user.firstName, user.lastName);
      console.log('   - Email:', user.email);
      console.log('   - Role:', user.role);
      console.log('   - Phone:', user.phone);
      console.log('✅ isAuthenticated:', this.isAuthenticated);
    } else {
      console.error('❌ No token found in response or cookies');
    }
  }

  private decodeToken(token: string): User | null {
    try {
      // Check if token is expired first
      if (JwtHelper.isTokenExpired(token)) {
        console.warn('Token is expired');
        return null;
      }

      const decoded = JwtHelper.decode(token);
      if (!decoded) {
        console.error('Failed to decode token');
        return null;
      }

      console.log('Decoded token payload:', decoded);

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

      const user: User = {
        id: userId || email || '',
        email: email || '',
        firstName: firstName || 'مستخدم',
        lastName: lastName || '',
        role: (role || 'client') as any,
        phone: decoded['phone'] || decoded['phoneNumber'] || decoded['PhoneNumber'] || '',
        createdAt: new Date(),
        avatar: decoded['avatar'] || decoded['picture'] || undefined
      };

      // Validate that we have at least email or id
      if (!user.id && !user.email) {
        console.warn('Token does not contain sufficient user information');
        return null;
      }

      console.log('✅ User extracted from token:', user);
      return user;
    } catch (error) {
      console.error('Error decoding token:', error);
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
   * Get token from cookies
   * Tries multiple common cookie names
   */
  getToken(): string | null {
    // Try each possible token cookie name
    for (const cookieName of this.TOKEN_COOKIE_NAMES) {
      const token = this.cookieService.get(cookieName);
      if (token) {
        console.log(`Token found in cookie: ${cookieName}`);
        return token;
      }
    }
    console.log('No token found in cookies');
    return null;
  }

  /**
   * Get refresh token from cookies
   */
  private getRefreshToken(): string | null {
    for (const cookieName of this.REFRESH_TOKEN_COOKIE_NAMES) {
      const token = this.cookieService.get(cookieName);
      if (token) {
        return token;
      }
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
        console.log('No token found on initialization');
        return null;
      }

      // Check if token is expired
      if (JwtHelper.isTokenExpired(token)) {
        console.warn('Token is expired on initialization');
        return null;
      }

      // Decode token to get user data
      const user = this.decodeToken(token);
      if (user) {
        console.log('User loaded from token on initialization:', user);
        return user;
      }

      return null;
    } catch (error) {
      console.error('Error getting user from token:', error);
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
      console.log('User reloaded from token:', user);
    } else {
      console.log('Could not reload user from token');
    }
  }

  /**
   * Clear authentication data
   * Note: This only clears client-side cookies that are accessible
   * HttpOnly cookies are managed by the backend
   */
  private clearAuthData(): void {
    // Try to delete all possible token cookies
    for (const cookieName of this.TOKEN_COOKIE_NAMES) {
      this.cookieService.delete(cookieName);
    }

    for (const cookieName of this.REFRESH_TOKEN_COOKIE_NAMES) {
      this.cookieService.delete(cookieName);
    }

    console.log('Client-side auth cookies cleared');
    console.log('Note: HttpOnly cookies must be cleared by backend');
  }

  /**
   * Get all cookies for debugging
   */
  getAllCookies(): { [key: string]: string } {
    return this.cookieService.getAll();
  }
}

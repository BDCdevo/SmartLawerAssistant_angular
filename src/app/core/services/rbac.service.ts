import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import {
  Role,
  Permission,
  CreateRoleDto,
  GrantPermissionToRoleDto,
  RevokePermissionFromRoleDto,
  AssignRoleToUserDto
} from '../models/rbac.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RbacService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/rbac`;

  // Cache للـ roles والـ permissions
  private rolesCache: Role[] | null = null;
  private permissionsCache: Permission[] | null = null;
  private rolesLoaded = false;
  private permissionsLoaded = false;

  // ==================== Roles ====================

  /**
   * Get all roles (with caching)
   */
  getRoles(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/roles`);
  }

  /**
   * Get cached roles
   */
  getCachedRoles(): Role[] {
    return this.rolesCache || [];
  }

  /**
   * Set roles cache
   */
  setCachedRoles(roles: Role[]): void {
    this.rolesCache = roles;
    this.rolesLoaded = true;
  }

  /**
   * Check if roles are loaded
   */
  areRolesLoaded(): boolean {
    return this.rolesLoaded;
  }

  /**
   * Initialize roles - load from backend if not already loaded
   */
  initializeRoles(): Observable<any> {
    if (this.rolesLoaded && this.rolesCache) {
      return of({ success: true, data: this.rolesCache });
    }

    return this.getRoles().pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setCachedRoles(response.data);
          console.log('✅ Roles loaded from backend:', response.data);
        }
      }),
      catchError(err => {
        console.warn('⚠️ Failed to load roles from backend, using defaults:', err);
        // Fallback to default roles if backend fails (matching backend roles)
        const defaultRoles: Role[] = [
          { id: '1', name: 'SuperAdmin', description: 'مدير عام', permissions: [] },
          { id: '2', name: 'Admin', description: 'مدير', permissions: [] },
          { id: '3', name: 'Lawyer', description: 'محامي', permissions: [] },
          { id: '4', name: 'Viewer', description: 'مشاهد', permissions: [] },
          { id: '5', name: 'assistant', description: 'مساعد', permissions: [] }
        ];
        this.setCachedRoles(defaultRoles);
        return of({ success: false, data: defaultRoles });
      })
    );
  }

  /**
   * Create new role
   * @param data Role data
   */
  createRole(data: CreateRoleDto): Observable<any> {
    console.log('Creating role:', data);
    return this.http.post<any>(`${this.apiUrl}/roles/create`, data);
  }

  // ==================== Permissions ====================

  /**
   * Get all permissions (with caching)
   */
  getPermissions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/permissions`);
  }

  /**
   * Get cached permissions
   */
  getCachedPermissions(): Permission[] {
    return this.permissionsCache || [];
  }

  /**
   * Set permissions cache
   */
  setCachedPermissions(permissions: Permission[]): void {
    this.permissionsCache = permissions;
  }

  /**
   * Check if user has specific permission
   * @param permission Permission name
   * @param userPermissions User's permissions array
   */
  hasPermission(permission: string, userPermissions: string[] = []): boolean {
    // If user has "*" permission (SuperAdmin), allow everything
    if (userPermissions.includes('*')) return true;

    // Check specific permission
    return userPermissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   * @param permissions Array of permission names
   * @param userPermissions User's permissions array
   */
  hasAnyPermission(permissions: string[], userPermissions: string[] = []): boolean {
    if (userPermissions.includes('*')) return true;
    return permissions.some(p => userPermissions.includes(p));
  }

  /**
   * Get permissions for specific role
   * @param roleName Role name
   */
  getRolePermissions(roleName: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/roles/${roleName}/permissions`);
  }

  /**
   * Grant permission to role
   * @param data Grant permission data
   */
  grantPermission(data: GrantPermissionToRoleDto): Observable<any> {
    console.log('Granting permission:', data);
    return this.http.post<any>(`${this.apiUrl}/permissions/grant`, data);
  }

  /**
   * Revoke permission from role
   * @param data Revoke permission data
   */
  revokePermission(data: RevokePermissionFromRoleDto): Observable<any> {
    console.log('Revoking permission:', data);
    return this.http.post<any>(`${this.apiUrl}/permissions/revoke`, data);
  }

  // ==================== User Role Management ====================

  /**
   * Assign role to user
   * @param data Assign role data
   */
  assignRoleToUser(data: AssignRoleToUserDto): Observable<any> {
    console.log('Assigning role to user:', data);
    return this.http.post<any>(`${this.apiUrl}/users/assign-role`, data);
  }

  /**
   * Remove role from user
   * @param data Remove role data
   */
  removeRoleFromUser(data: AssignRoleToUserDto): Observable<any> {
    console.log('Removing role from user:', data);
    return this.http.post<any>(`${this.apiUrl}/users/remove-role`, data);
  }
}

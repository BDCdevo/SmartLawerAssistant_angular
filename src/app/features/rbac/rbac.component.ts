import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { RbacService } from '../../core/services/rbac.service';
import {
  Role,
  Permission,
  CreateRoleDto,
  GrantPermissionToRoleDto,
  RevokePermissionFromRoleDto,
  AssignRoleToUserDto
} from '../../core/models/rbac.model';

@Component({
  selector: 'app-rbac',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rbac.component.html',
  styleUrl: './rbac.component.scss'
})
export class RbacComponent implements OnInit {
  private rbacService = inject(RbacService);
  private toastr = inject(ToastrService);

  // State
  loading = signal(false);
  activeTab = signal<'roles' | 'permissions'>('roles');

  // Roles
  roles = signal<Role[]>([]);
  selectedRole = signal<Role | null>(null);
  showRoleModal = signal(false);
  newRoleName = signal('');

  // Permissions
  allPermissions = signal<Permission[]>([]);
  rolePermissions = signal<Permission[]>([]);
  availablePermissions = signal<Permission[]>([]);

  // User Role Assignment
  showUserRoleModal = signal(false);
  userIdForRole = signal('');
  selectedRoleForUser = signal('');

  ngOnInit() {
    this.loadRoles();
    this.loadAllPermissions();
  }

  // ==================== Tab Management ====================

  switchTab(tab: 'roles' | 'permissions') {
    this.activeTab.set(tab);
  }

  // ==================== Roles ====================

  loadRoles() {
    this.loading.set(true);
    this.rbacService.getRoles().subscribe({
      next: (response) => {
        console.log('Roles loaded:', response);

        let rolesData = [];
        if (response.success && response.data) {
          rolesData = Array.isArray(response.data) ? response.data : [response.data];
        } else if (Array.isArray(response)) {
          rolesData = response;
        }

        this.roles.set(rolesData);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.toastr.error('حدث خطأ أثناء تحميل الأدوار');
        this.loading.set(false);
      }
    });
  }

  openCreateRoleModal() {
    this.newRoleName.set('');
    this.showRoleModal.set(true);
  }

  closeRoleModal() {
    this.showRoleModal.set(false);
    this.newRoleName.set('');
  }

  createRole() {
    const name = this.newRoleName().trim();

    if (!name) {
      this.toastr.error('الرجاء إدخال اسم الدور');
      return;
    }

    this.loading.set(true);
    const createDto: CreateRoleDto = { name };

    this.rbacService.createRole(createDto).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('تم إنشاء الدور بنجاح');
          this.closeRoleModal();
          this.loadRoles();
        } else {
          this.toastr.error(response.message || 'فشل في إنشاء الدور');
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('Error creating role:', error);
        this.toastr.error('حدث خطأ أثناء إنشاء الدور');
        this.loading.set(false);
      }
    });
  }

  selectRole(role: Role) {
    this.selectedRole.set(role);
    this.loadRolePermissions(role.name);
  }

  // ==================== Permissions ====================

  loadAllPermissions() {
    this.rbacService.getPermissions().subscribe({
      next: (response) => {
        console.log('Permissions loaded:', response);

        let permissionsData = [];
        if (response.success && response.data) {
          permissionsData = Array.isArray(response.data) ? response.data : [response.data];
        } else if (Array.isArray(response)) {
          permissionsData = response;
        }

        this.allPermissions.set(permissionsData);
        this.updateAvailablePermissions();
      },
      error: (error) => {
        console.error('Error loading permissions:', error);
        this.toastr.error('حدث خطأ أثناء تحميل الصلاحيات');
      }
    });
  }

  loadRolePermissions(roleName: string) {
    this.loading.set(true);
    this.rbacService.getRolePermissions(roleName).subscribe({
      next: (response) => {
        console.log('Role permissions loaded:', response);

        let permissionsData = [];
        if (response.success && response.data) {
          permissionsData = Array.isArray(response.data) ? response.data : [response.data];
        } else if (Array.isArray(response)) {
          permissionsData = response;
        }

        this.rolePermissions.set(permissionsData);
        this.updateAvailablePermissions();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading role permissions:', error);
        this.toastr.error('حدث خطأ أثناء تحميل صلاحيات الدور');
        this.loading.set(false);
      }
    });
  }

  updateAvailablePermissions() {
    const rolePermKeys = this.rolePermissions().map(p => p.key);
    const available = this.allPermissions().filter(p => !rolePermKeys.includes(p.key));
    this.availablePermissions.set(available);
  }

  grantPermission(permission: Permission) {
    const role = this.selectedRole();
    if (!role) {
      this.toastr.error('الرجاء اختيار دور أولاً');
      return;
    }

    this.loading.set(true);
    const grantDto: GrantPermissionToRoleDto = {
      roleName: role.name,
      permissionKey: permission.key
    };

    this.rbacService.grantPermission(grantDto).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('تم منح الصلاحية بنجاح');
          this.loadRolePermissions(role.name);
        } else {
          this.toastr.error(response.message || 'فشل في منح الصلاحية');
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('Error granting permission:', error);
        this.toastr.error('حدث خطأ أثناء منح الصلاحية');
        this.loading.set(false);
      }
    });
  }

  revokePermission(permission: Permission) {
    const role = this.selectedRole();
    if (!role) return;

    if (!confirm(`هل تريد إلغاء صلاحية "${permission.name}" من الدور "${role.name}"؟`)) {
      return;
    }

    this.loading.set(true);
    const revokeDto: RevokePermissionFromRoleDto = {
      roleName: role.name,
      permissionKey: permission.key
    };

    this.rbacService.revokePermission(revokeDto).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('تم إلغاء الصلاحية بنجاح');
          this.loadRolePermissions(role.name);
        } else {
          this.toastr.error(response.message || 'فشل في إلغاء الصلاحية');
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('Error revoking permission:', error);
        this.toastr.error('حدث خطأ أثناء إلغاء الصلاحية');
        this.loading.set(false);
      }
    });
  }

  // ==================== User Role Assignment ====================

  openUserRoleModal() {
    this.userIdForRole.set('');
    this.selectedRoleForUser.set('');
    this.showUserRoleModal.set(true);
  }

  closeUserRoleModal() {
    this.showUserRoleModal.set(false);
    this.userIdForRole.set('');
    this.selectedRoleForUser.set('');
  }

  assignRoleToUser() {
    const userId = this.userIdForRole().trim();
    const roleName = this.selectedRoleForUser();

    if (!userId || !roleName) {
      this.toastr.error('الرجاء إدخال معرف المستخدم واختيار الدور');
      return;
    }

    this.loading.set(true);
    const assignDto: AssignRoleToUserDto = { userId, roleName };

    this.rbacService.assignRoleToUser(assignDto).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('تم تعيين الدور للمستخدم بنجاح');
          this.closeUserRoleModal();
        } else {
          this.toastr.error(response.message || 'فشل في تعيين الدور');
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error assigning role:', error);
        this.toastr.error('حدث خطأ أثناء تعيين الدور');
        this.loading.set(false);
      }
    });
  }
}

// Role-Based Access Control Models

export interface Role {
  id: string;
  name: string;
  normalizedName?: string;
  description?: string;
  createdAt?: Date;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  key: string;
  name: string;
  description?: string;
  category?: string;
}

export interface RoleWithPermissions {
  role: Role;
  permissions: Permission[];
}

// DTOs
export interface CreateRoleDto {
  name: string;
}

export interface GrantPermissionToRoleDto {
  roleName: string;
  permissionKey: string;
}

export interface RevokePermissionFromRoleDto {
  roleName: string;
  permissionKey: string;
}

export interface AssignRoleToUserDto {
  userId: string;
  roleName: string;
}

export interface UserWithRoles {
  userId: string;
  userName: string;
  email: string;
  roles: string[];
}

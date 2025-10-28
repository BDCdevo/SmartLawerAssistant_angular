export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export enum UserRole {
  SUPER_ADMIN = 'SuperAdmin',
  ADMIN = 'admin',
  LAWYER = 'lawyer',
  CLIENT = 'client',
  ASSISTANT = 'assistant'
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginRequest {
  emailOrPhone: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
}

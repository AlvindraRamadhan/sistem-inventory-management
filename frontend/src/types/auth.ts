import type { Permission, UserRole } from "@/lib/constants/roles";

export type { Permission, UserRole };

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  unit?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

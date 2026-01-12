/**
 * Authentication types for Watson application
 * Defines interfaces for JWT tokens, user data, and authentication state
 */

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export interface AuthContextType {
  authState: AuthState;
  login: (token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export type UserRole = 'admin' | 'clinician' | 'viewer';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
  code: string;
}
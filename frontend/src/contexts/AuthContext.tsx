/**
 * Authentication Context for Watson application
 * Provides authentication state management across the application
 */

import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { type AuthState, type AuthContextType, type User } from '../types/auth';
import {
  getStoredToken,
  storeToken,
  removeToken,
  isValidToken,
  getUserFromToken,
  clearAuthData,
} from '../utils/auth';

// Initial authentication state
const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
};

// Authentication action types
type AuthAction =
  | { type: 'AUTH_INIT'; payload: { user: User | null; token: string | null } }
  | { type: 'LOGIN'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'SET_LOADING'; payload: boolean };

// Authentication reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_INIT':
      return {
        ...state,
        isAuthenticated: !!action.payload.token && !!action.payload.user,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
    
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    
    default:
      return state;
  }
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Context provider props
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component that wraps the application
 * Provides authentication state and methods to child components
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, dispatch] = useReducer(authReducer, initialAuthState);

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = () => {
      const token = getStoredToken();
      
      if (token && isValidToken(token)) {
        const user = getUserFromToken(token);
        if (user) {
          dispatch({ type: 'AUTH_INIT', payload: { user, token } });
          return;
        }
      }
      
      // Clear invalid tokens
      if (token) {
        removeToken();
      }
      
      dispatch({ type: 'AUTH_INIT', payload: { user: null, token: null } });
    };

    initializeAuth();
  }, []);

  // Login function
  const login = (token: string) => {
    if (!isValidToken(token)) {
      console.error('Invalid token provided to login');
      return;
    }

    const user = getUserFromToken(token);
    if (!user) {
      console.error('Could not extract user from token');
      return;
    }

    storeToken(token);
    dispatch({ type: 'LOGIN', payload: { user, token } });
  };

  // Logout function
  const logout = () => {
    clearAuthData();
    dispatch({ type: 'LOGOUT' });
  };

  // Update user function
  const updateUser = (userUpdate: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: userUpdate });
  };

  const contextValue: AuthContextType = {
    authState,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 * Must be used within AuthProvider
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
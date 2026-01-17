/**
 * Authentication Context for Watson application
 * Provides authentication state management across the application
 *
 * Supports multiple auth backends:
 * - Clerk (temporary replacement while Passport is down)
 * - Passport (passport.oceanheart.ai)
 * - Demo mode (JWT test tokens)
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth, useUser, useClerk } from '@clerk/clerk-react';
import { type AuthState, type AuthContextType, type User } from '../types/auth';
import {
  getStoredToken,
  storeToken,
  removeToken,
  isValidToken,
  getUserFromToken,
  clearAuthData,
} from '../utils/auth';
import {
  getPassportToken,
  redirectToLogout,
  deleteCookie,
} from '../config/auth';
import { isClerkConfigured } from '../config/clerk';
import { generateDemoToken } from '../utils/demo-auth';

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
 *
 * When Clerk is configured, it bridges Clerk's auth state to our context.
 * Falls back to Passport/demo mode when Clerk is not available.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, dispatch] = useReducer(authReducer, initialAuthState);

  // Clerk hooks - will be undefined if ClerkProvider is not present
  const clerkAuth = isClerkConfigured() ? useAuth() : null;
  const clerkUser = isClerkConfigured() ? useUser() : null;
  const clerk = isClerkConfigured() ? useClerk() : null;

  // Generate backend-compatible token from Clerk user
  const generateBackendToken = useCallback(async (clerkUserData: {
    id: string;
    primaryEmailAddress?: { emailAddress: string } | null;
    firstName?: string | null;
    lastName?: string | null;
  }): Promise<string> => {
    // Generate a demo token with Clerk user info
    // This works because backend is in JWT_TEST_MODE
    const token = await generateDemoToken({
      sub: clerkUserData.id,
      email: clerkUserData.primaryEmailAddress?.emailAddress || 'clerk-user@watson.oceanheart.ai',
      name: [clerkUserData.firstName, clerkUserData.lastName].filter(Boolean).join(' ') || 'Clerk User',
      role: 'clinician',
    });
    return token;
  }, []);

  // Initialize authentication state on mount and sync with Clerk
  useEffect(() => {
    const initializeAuth = async () => {
      // If Clerk is available and user is signed in, use Clerk auth
      if (clerkAuth?.isLoaded && clerkAuth?.isSignedIn && clerkUser?.user) {
        try {
          const token = await generateBackendToken(clerkUser.user);
          const user: User = {
            id: clerkUser.user.id,
            email: clerkUser.user.primaryEmailAddress?.emailAddress || '',
            name: [clerkUser.user.firstName, clerkUser.user.lastName].filter(Boolean).join(' ') || undefined,
            role: 'clinician',
          };
          storeToken(token);
          dispatch({ type: 'AUTH_INIT', payload: { user, token } });
          return;
        } catch (error) {
          console.error('Failed to generate backend token from Clerk:', error);
        }
      }

      // If Clerk is loaded but user is not signed in
      if (clerkAuth?.isLoaded && !clerkAuth?.isSignedIn) {
        // Check for existing stored token (from demo login)
        const token = getStoredToken();
        if (token && isValidToken(token)) {
          const user = getUserFromToken(token);
          if (user) {
            dispatch({ type: 'AUTH_INIT', payload: { user, token } });
            return;
          }
        }

        // No valid auth
        dispatch({ type: 'AUTH_INIT', payload: { user: null, token: null } });
        return;
      }

      // Clerk still loading - check for passport/stored tokens
      if (!clerkAuth || !clerkAuth.isLoaded) {
        // Check for passport token (from redirect or cookie)
        const passportToken = getPassportToken();
        if (passportToken && isValidToken(passportToken)) {
          const user = getUserFromToken(passportToken);
          if (user) {
            storeToken(passportToken);
            dispatch({ type: 'AUTH_INIT', payload: { user, token: passportToken } });
            return;
          }
        }

        // Fall back to stored token
        const token = getStoredToken();
        if (token && isValidToken(token)) {
          const user = getUserFromToken(token);
          if (user) {
            dispatch({ type: 'AUTH_INIT', payload: { user, token } });
            return;
          }
        }

        // If Clerk is configured but not loaded yet, wait
        if (isClerkConfigured()) {
          return; // Keep loading state
        }

        // Clear invalid tokens
        if (token) {
          removeToken();
        }

        dispatch({ type: 'AUTH_INIT', payload: { user: null, token: null } });
      }
    };

    initializeAuth();
  }, [clerkAuth?.isLoaded, clerkAuth?.isSignedIn, clerkUser?.user, generateBackendToken]);

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
  const logout = async (usePassportLogout = false) => {
    clearAuthData();
    deleteCookie('passport_token');
    dispatch({ type: 'LOGOUT' });

    // If Clerk is configured, sign out through Clerk
    if (clerk) {
      try {
        await clerk.signOut();
      } catch (error) {
        console.error('Clerk sign out failed:', error);
      }
      return;
    }

    // Fall back to passport logout
    if (usePassportLogout) {
      redirectToLogout();
    }
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
/**
 * Authentication hook for Watson application
 * Provides a simplified interface for components to interact with authentication
 */

import { useAuthContext } from '../contexts/AuthContext';
import { type User, type AuthState } from '../types/auth';

/**
 * Custom hook to access authentication state and methods
 * Provides a clean interface for components to use authentication
 */
export function useAuth() {
  const { authState, login, logout, updateUser } = useAuthContext();

  // Derived state for easier access
  const isAuthenticated = authState.isAuthenticated;
  const user = authState.user;
  const token = authState.token;
  const isLoading = authState.loading;

  // User role helpers
  const isAdmin = user?.role === 'admin';
  const isClinician = user?.role === 'clinician';
  const isViewer = user?.role === 'viewer';

  // Authentication status helpers
  const hasValidSession = isAuthenticated && !!user && !!token;
  const isInitializing = isLoading;

  return {
    // Auth state
    authState,
    isAuthenticated,
    user,
    token,
    isLoading,
    
    // Derived state
    hasValidSession,
    isInitializing,
    
    // Role helpers
    isAdmin,
    isClinician,
    isViewer,
    
    // Auth actions
    login,
    logout,
    updateUser,
    
    // User info helpers
    getUserEmail: () => user?.email || null,
    getUserName: () => user?.name || user?.email || null,
    getUserRole: () => user?.role || null,
    getUserId: () => user?.id || null,
  };
}

/**
 * Hook to require authentication - throws error if not authenticated
 * Use this in components that should only be accessible to authenticated users
 */
export function useRequireAuth() {
  const auth = useAuth();
  
  if (!auth.isAuthenticated && !auth.isLoading) {
    throw new Error('Authentication required');
  }
  
  return auth;
}

/**
 * Hook for role-based access control
 * Returns boolean indicating if user has required role
 */
export function useHasRole(requiredRole: string | string[]) {
  const { user } = useAuth();
  
  if (!user) return false;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role);
  }
  
  return user.role === requiredRole;
}

/**
 * Hook to check if user has admin privileges
 */
export function useIsAdmin() {
  return useHasRole('admin');
}

/**
 * Hook to check if user is a clinician
 */
export function useIsClinician() {
  return useHasRole(['admin', 'clinician']);
}

export default useAuth;
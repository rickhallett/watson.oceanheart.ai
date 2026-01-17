import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { isClerkConfigured } from '@/config/clerk';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authState } = useAuthContext();
  const location = useLocation();

  // Use Clerk auth if configured
  const clerkAuth = isClerkConfigured() ? useAuth() : null;

  // Determine loading state
  const isLoading = authState.loading || (clerkAuth && !clerkAuth.isLoaded);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Check authentication status
  const isAuthenticated = clerkAuth
    ? clerkAuth.isSignedIn || authState.isAuthenticated
    : authState.isAuthenticated;

  // Not authenticated - redirect to sign-in or landing page
  if (!isAuthenticated) {
    // If Clerk is configured, redirect to Clerk sign-in
    if (isClerkConfigured()) {
      return <Navigate to="/sign-in" state={{ from: location }} replace />;
    }
    // Otherwise, redirect to landing page
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
}

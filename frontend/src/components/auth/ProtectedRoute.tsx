import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authState } = useAuthContext();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (authState.loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to landing page
  if (!authState.isAuthenticated) {
    // Save the attempted location for redirect after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
}

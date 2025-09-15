import React, { useEffect, useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { AppLayout } from './pages/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    // Handle browser navigation
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Simple routing based on pathname
  if (currentPath === '/app' || currentPath.startsWith('/app/')) {
    return (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    );
  }

  // Default to landing page
  return <LandingPage />;
}

export default App;
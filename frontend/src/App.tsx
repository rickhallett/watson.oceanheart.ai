import React, { useEffect, useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { AppLayout } from './pages/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MonochromeDemo } from './pages/MonochromeDemo';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SkewedBackground } from './components/SkewedBackground';

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

  // Apply monochrome mode to the entire app
  useEffect(() => {
    document.body.classList.add('monochrome-mode');
  }, []);

  // Simple routing based on pathname
  if (currentPath === '/login') {
    return <LoginPage />;
  }

  if (currentPath === '/dashboard') {
    return (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    );
  }

  if (currentPath === '/demo') {
    return <MonochromeDemo />;
  }

  if (currentPath === '/app' || currentPath.startsWith('/app/')) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-zinc-950">
          <SkewedBackground opacity={0.02} />
          <div className="relative z-10">
            <AppLayout />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Default to landing page
  return <LandingPage />;
}

export default App;
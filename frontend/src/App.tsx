import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignIn, SignUp } from '@clerk/clerk-react';
import { LandingPage } from './pages/LandingPage';
import { AppLayout } from './pages/AppLayout';
import { MonochromeDemo } from './pages/MonochromeDemo';
import { EditView } from './components/panels/EditView';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CLERK_PUBLISHABLE_KEY, clerkAppearance, clerkRoutes } from './config/clerk';

// Auth page wrapper component
function AuthPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

function App() {
  // Apply monochrome mode to the entire app
  useEffect(() => {
    document.body.classList.add('monochrome-mode');
  }, []);

  // If Clerk is not configured, fall back to demo mode
  if (!CLERK_PUBLISHABLE_KEY) {
    console.warn('Clerk publishable key not configured. Using demo auth mode.');
    return (
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/demo" element={<MonochromeDemo />} />
              <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
              <Route path="/app/edit/:editId" element={<ProtectedRoute><EditView /></ProtectedRoute>} />
              <Route path="/app/:view" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        appearance={clerkAppearance}
        signInUrl={clerkRoutes.signIn}
        signUpUrl={clerkRoutes.signUp}
        afterSignOutUrl="/"
      >
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/demo" element={<MonochromeDemo />} />

              {/* Auth routes */}
              <Route
                path="/sign-in/*"
                element={
                  <AuthPageWrapper>
                    <SignIn
                      routing="path"
                      path="/sign-in"
                      signUpUrl="/sign-up"
                      fallbackRedirectUrl={clerkRoutes.afterSignIn}
                    />
                  </AuthPageWrapper>
                }
              />
              <Route
                path="/sign-up/*"
                element={
                  <AuthPageWrapper>
                    <SignUp
                      routing="path"
                      path="/sign-up"
                      signInUrl="/sign-in"
                      fallbackRedirectUrl={clerkRoutes.afterSignUp}
                    />
                  </AuthPageWrapper>
                }
              />

              {/* Protected app routes */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/edit/:editId"
                element={
                  <ProtectedRoute>
                    <EditView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/:view"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;

# Watson App Layout & Authentication - Product Requirements Document

**Date:** September 14, 2024  
**Version:** 1.0

---

## Executive Summary

This PRD defines the requirements for creating the main application layout for Watson, including a responsive header with navigation, main content panel, footer, and authentication integration with Oceanheart Passport. The current App.tsx will be refactored into a landing page, while a new authenticated application layout will be created at the `/app` route.

## Problem Statement

### Current Issues
1. **No Application Layout**: Current App.tsx only contains a landing page with hero banner and testimonials
2. **No Authentication Integration**: Application lacks login/logout functionality and passport integration
3. **No Navigation Structure**: Missing header navigation and route management
4. **No Content Management**: No mechanism to switch between different content views (profile, settings)

### User Needs
- Authenticated users need access to the main application interface
- Users need clear navigation between landing page, profile, and settings
- Users need a seamless authentication flow with Oceanheart Passport
- Mobile users need a responsive, touch-friendly interface

## Requirements

### User Requirements

1. **Landing Page** 
   - Transform current App.tsx into dedicated landing page component
   - Maintain existing hero banner and testimonials sections
   - Add login CTA that routes to authentication

2. **Application Layout**
   - Authenticated app shell at `/app` route
   - Persistent header with navigation
   - Dynamic main content panel
   - Consistent footer across all views

3. **Navigation**
   - Logo/brand link to landing page (/)
   - Profile link (shows profile content in main panel)
   - Settings link (shows settings content in main panel)
   - Sign out option within profile view

4. **Authentication Flow**
   - Login form/button redirects to Oceanheart Passport
   - Handle returnTo parameter based on environment
   - Maintain session state across app
   - Graceful logout with redirect to landing

### Technical Requirements

1. **Component Structure**
   ```
   src/
   ├── pages/
   │   ├── LandingPage.tsx (refactored from current App.tsx)
   │   └── AppLayout.tsx (new authenticated layout)
   ├── components/
   │   ├── layout/
   │   │   ├── AppHeader.tsx
   │   │   ├── AppFooter.tsx
   │   │   └── MainPanel.tsx
   │   ├── auth/
   │   │   └── LoginButton.tsx
   │   └── panels/
   │       ├── ProfilePanel.tsx
   │       └── SettingsPanel.tsx
   ```

2. **Routing Structure**
   - `/` - Landing page (public)
   - `/app` - Main application (authenticated)
   - `/app/profile` - Profile view (authenticated)
   - `/app/settings` - Settings view (authenticated)

3. **Authentication Integration**
   - Environment-aware auth URL configuration
   - Development: `passport.oceanheart.ai/auth?returnTo=http://localhost:3000/app`
   - Production: `passport.oceanheart.ai/auth?returnTo=https://watson.oceanheart.ai/app`
   - JWT token verification from cookies
   - Protected route wrapper component

### Design Requirements

1. **Responsive Breakpoints**
   - Mobile: < 768px (hamburger menu, stacked layout)
   - Tablet: 768px - 1024px (condensed navigation)
   - Desktop: > 1024px (full navigation bar)

2. **Visual Hierarchy**
   - Sticky header with z-index priority
   - Main content scrollable independently
   - Footer always at bottom of viewport or content

3. **UI Components to Utilize**
   - `background-beams.tsx` for app background
   - `floating-navbar.tsx` or custom navbar
   - `sidebar.tsx` for mobile navigation
   - `card.tsx` for content panels
   - `button.tsx` variations for CTAs

## Implementation Phases

### Phase 1: Core Layout Structure
1. **Refactor App.tsx to LandingPage.tsx**
   - Move current App.tsx content to pages/LandingPage.tsx
   - Update imports and exports
   - Add login CTA button

2. **Create AppLayout Component**
   ```tsx
   // src/pages/AppLayout.tsx
   import { useState } from 'react';
   import { AppHeader } from '@/components/layout/AppHeader';
   import { AppFooter } from '@/components/layout/AppFooter';
   import { MainPanel } from '@/components/layout/MainPanel';
   
   export function AppLayout() {
     const [activeView, setActiveView] = useState('dashboard');
     
     return (
       <div className="min-h-screen bg-black/[0.96] flex flex-col">
         <AppHeader onNavigate={setActiveView} activeView={activeView} />
         <MainPanel activeView={activeView} />
         <AppFooter />
       </div>
     );
   }
   ```

3. **Implement Header with Navigation**
   ```tsx
   // src/components/layout/AppHeader.tsx
   export function AppHeader({ onNavigate, activeView }) {
     return (
       <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-black/50 backdrop-blur">
         <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
           <a href="/" className="text-white font-bold text-xl">
             Watson AI
           </a>
           <div className="hidden md:flex items-center space-x-6">
             <button onClick={() => onNavigate('dashboard')} 
                     className="text-neutral-400 hover:text-white transition">
               Dashboard
             </button>
             <button onClick={() => onNavigate('profile')}
                     className="text-neutral-400 hover:text-white transition">
               Profile
             </button>
             <button onClick={() => onNavigate('settings')}
                     className="text-neutral-400 hover:text-white transition">
               Settings
             </button>
           </div>
           {/* Mobile menu button */}
           <button className="md:hidden text-white">
             <MenuIcon />
           </button>
         </nav>
       </header>
     );
   }
   ```

### Phase 2: Authentication Integration

1. **Create Auth Configuration**
   ```tsx
   // src/config/auth.ts
   export const getAuthConfig = () => {
     const isDev = process.env.NODE_ENV === 'development';
     return {
       authUrl: 'https://passport.oceanheart.ai/auth',
       returnTo: isDev 
         ? 'http://localhost:3000/app'
         : 'https://watson.oceanheart.ai/app'
     };
   };
   ```

2. **Implement Login Button**
   ```tsx
   // src/components/auth/LoginButton.tsx
   import { getAuthConfig } from '@/config/auth';
   
   export function LoginButton() {
     const handleLogin = () => {
       const { authUrl, returnTo } = getAuthConfig();
       window.location.href = `${authUrl}?returnTo=${encodeURIComponent(returnTo)}`;
     };
     
     return (
       <Button onClick={handleLogin} className="...">
         Sign In with Oceanheart
       </Button>
     );
   }
   ```

3. **Add Protected Route Wrapper**
   ```tsx
   // src/components/auth/ProtectedRoute.tsx
   export function ProtectedRoute({ children }) {
     const [isAuthenticated, setIsAuthenticated] = useState(false);
     
     useEffect(() => {
       // Check for JWT token in cookies
       const token = getCookie('oh_session');
       if (!token) {
         // Redirect to auth
         const { authUrl, returnTo } = getAuthConfig();
         window.location.href = `${authUrl}?returnTo=${encodeURIComponent(returnTo)}`;
       } else {
         setIsAuthenticated(true);
       }
     }, []);
     
     if (!isAuthenticated) return <LoadingSpinner />;
     return children;
   }
   ```

### Phase 3: Content Panels

1. **Profile Panel Implementation**
   ```tsx
   // src/components/panels/ProfilePanel.tsx
   export function ProfilePanel() {
     const handleSignOut = () => {
       // Clear session cookie
       document.cookie = 'oh_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
       window.location.href = '/';
     };
     
     return (
       <div className="max-w-4xl mx-auto p-8">
         <h2 className="text-3xl font-bold text-white mb-8">Profile</h2>
         <div className="bg-neutral-900 rounded-lg p-6">
           <p className="text-neutral-400 mb-6">Profile content placeholder</p>
           <Button onClick={handleSignOut} variant="destructive">
             Sign Out
           </Button>
         </div>
       </div>
     );
   }
   ```

2. **Settings Panel Implementation**
   ```tsx
   // src/components/panels/SettingsPanel.tsx
   export function SettingsPanel() {
     return (
       <div className="max-w-4xl mx-auto p-8">
         <h2 className="text-3xl font-bold text-white mb-8">Settings</h2>
         <div className="bg-neutral-900 rounded-lg p-6">
           <p className="text-neutral-400">Settings content placeholder</p>
         </div>
       </div>
     );
   }
   ```

### Phase 4: Mobile Responsiveness

1. **Mobile Navigation Drawer**
   - Implement hamburger menu toggle
   - Slide-out navigation drawer
   - Overlay backdrop when open
   - Touch gestures for close

2. **Responsive Layout Adjustments**
   - Stack navigation vertically on mobile
   - Adjust padding and spacing for touch
   - Ensure minimum tap target sizes (44x44px)
   - Test on various viewport sizes

## Implementation Notes

### State Management
- Use React Context for authentication state
- Local component state for active view
- Consider adding URL-based routing in future phases

### Environment Variables
```env
# .env.local
REACT_APP_AUTH_URL=https://passport.oceanheart.ai/auth
REACT_APP_RETURN_URL_DEV=http://localhost:3000/app
REACT_APP_RETURN_URL_PROD=https://watson.oceanheart.ai/app
```

### Cookie Utilities
```typescript
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}
```

## Security Considerations

1. **JWT Token Validation**
   - Verify token signature on each request
   - Check token expiration
   - Handle refresh token flow if needed

2. **CORS Configuration**
   - Ensure watson.oceanheart.ai is whitelisted in Passport CORS

3. **Secure Cookie Handling**
   - HttpOnly flag for production cookies
   - Secure flag for HTTPS environments
   - SameSite attribute for CSRF protection

## Success Metrics

- Successful authentication flow completion rate
- Time to first meaningful paint < 2s
- Mobile responsiveness score > 95 (Lighthouse)
- Zero authentication-related security vulnerabilities

## Future Enhancements

1. **URL-based Routing**: Implement React Router for proper URL management
2. **User Profile Data**: Fetch and display actual user data from API
3. **Settings Persistence**: Save user preferences to backend
4. **Notification System**: Add toast notifications for user actions
5. **Dark/Light Theme Toggle**: Implement theme switcher in settings
6. **Keyboard Navigation**: Add accessibility shortcuts
7. **Session Management**: Implement token refresh and session timeout warnings

---

**Next Steps:**
1. Review and approve PRD
2. Begin Phase 1 implementation
3. Set up development environment with auth configuration
4. Test authentication flow with Oceanheart Passport team
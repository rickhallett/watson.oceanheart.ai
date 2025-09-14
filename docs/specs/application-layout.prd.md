# Watson Application Layout System
**PRD Document**  
*Date: 2025-01-13*

## Executive Summary

Create a comprehensive application layout system for Watson clinical LLM review tool featuring a header, footer, navbar, and main panel with authentication-aware navigation and conditional landing page display. The system will use Aceternity UI components for modern, animated interface elements and implement authentication state management with JWT tokens.

## Problem Statement

Currently, Watson has a basic React structure without proper layout management, navigation, or authentication-aware UI components. The application needs:

- **Missing Layout Structure**: No standardized header, footer, navbar, or main content areas
- **No Authentication UI**: Navigation doesn't respond to user authentication state
- **No Landing/Onboarding Flow**: Users need introduction to the tool and release updates
- **Basic Styling**: Current implementation lacks modern UI components and animations

## Requirements

### User Requirements
- **UR-1**: Users must see a consistent layout across all authenticated views
- **UR-2**: Unauthenticated users should see limited navigation options
- **UR-3**: New or returning users (after 7+ days) should see landing page with project info and updates
- **UR-4**: Navigation should be responsive and work across desktop/mobile
- **UR-5**: Landing page should clearly explain Watson's purpose and recent updates

### Technical Requirements
- **TR-1**: JWT-based authentication state detection and management
- **TR-2**: LocalStorage integration for `last-check-in` tracking (ISO date string format)
- **TR-3**: Conditional rendering based on authentication status
- **TR-4**: Integration with Aceternity UI component library
- **TR-5**: TypeScript interfaces for authentication and user state
- **TR-6**: Responsive design supporting mobile and desktop viewports
- **TR-7**: Client-side routing compatibility with existing Bun.serve() setup

### Design Requirements
- **DR-1**: Modern, clinical-appropriate visual design using Aceternity components
- **DR-2**: Clear visual hierarchy separating authenticated vs. unauthenticated states
- **DR-3**: Intuitive navigation patterns following healthcare application conventions
- **DR-4**: Accessibility compliance (WCAG 2.1 AA standards)
- **DR-5**: Loading states and smooth transitions between authenticated/unauthenticated views

## Implementation Phases

### Phase 1: Authentication Infrastructure
**Core authentication and state management setup**

**Tasks:**
- Create TypeScript interfaces for JWT payload and user authentication state
- Implement JWT token validation and parsing utilities
- Build authentication context provider with React Context API
- Create localStorage utilities for `last-check-in` date management
- Set up authentication state detection on app initialization
- Implement stubbed authentication interface for development/testing

**Key Files:**
- `frontend/src/types/auth.ts` - Authentication type definitions
- `frontend/src/contexts/AuthContext.tsx` - Authentication state management
- `frontend/src/utils/auth.ts` - JWT validation and localStorage utilities
- `frontend/src/hooks/useAuth.ts` - Authentication hook

### Phase 2: Core Layout Components
**Build fundamental layout structure with Aceternity UI**

**Tasks:**
- Install and configure Aceternity UI dependencies
- Create responsive Header component with branding and user menu
- Implement Footer component with essential links and info
- Build Navbar component with authentication-aware menu items
- Create MainPanel component for content area layout
- Implement responsive layout container wrapping all components

**Key Files:**
- `frontend/src/components/layout/Header.tsx`
- `frontend/src/components/layout/Footer.tsx` 
- `frontend/src/components/layout/Navbar.tsx`
- `frontend/src/components/layout/MainPanel.tsx`
- `frontend/src/components/layout/AppLayout.tsx`

### Phase 3: Landing Page System
**Conditional landing page with project information and updates**

**Tasks:**
- Create LandingPage component describing Watson's purpose
- Implement release updates section with version history
- Build check-in date logic to determine landing page display
- Create call-to-action flows for user onboarding
- Add landing page navigation and skip options
- Implement smooth transitions between landing and main app

**Key Files:**
- `frontend/src/components/LandingPage.tsx`
- `frontend/src/components/ReleaseUpdates.tsx`
- `frontend/src/utils/checkIn.ts`

### Phase 4: Navigation Logic & Integration
**Conditional navigation rendering and app integration**

**Tasks:**
- Implement authentication-aware navigation menu rendering
- Create navigation guards for protected routes
- Integrate layout system with existing App.tsx structure
- Add navigation state management for active menu items
- Implement mobile hamburger menu functionality
- Test navigation flows across authentication states

**Key Files:**
- `frontend/src/components/navigation/AuthNavigation.tsx`
- `frontend/src/components/navigation/PublicNavigation.tsx`
- `frontend/src/hooks/useNavigation.ts`

## Implementation Notes

### Authentication Interface (Stubbed)
```typescript
// frontend/src/types/auth.ts
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
```

### LocalStorage Check-in Logic
```typescript
// frontend/src/utils/checkIn.ts
export function shouldShowLanding(): boolean {
  const lastCheckIn = localStorage.getItem('last-check-in');
  
  if (!lastCheckIn) return true;
  
  const lastDate = new Date(lastCheckIn);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysDiff > 7;
}

export function updateCheckIn(): void {
  localStorage.setItem('last-check-in', new Date().toISOString());
}
```

### Aceternity UI Integration
**Key Components to Utilize:**
- **Floating Navbar**: Main navigation bar with authentication-aware menu items
- **Hero Sections**: Landing page header explaining Watson's purpose  
- **Cards Sections**: Feature highlights and update announcements
- **Layout Grid**: Structured content areas within main panel
- **Floating Dock**: Quick action navigation for authenticated users

### Responsive Breakpoints
```css
/* Mobile First Approach */
- Mobile: 320px - 768px (stack navigation, hamburger menu)
- Tablet: 768px - 1024px (condensed navigation)  
- Desktop: 1024px+ (full horizontal navigation)
```

## Security Considerations

**Authentication Security:**
- JWT token validation with proper signature verification
- Token expiration handling with automatic logout
- Secure token storage considerations (avoid XSS vulnerabilities)
- Input validation for all authentication-related data

**Data Validation:**
- Validate localStorage data before parsing dates
- Sanitize any user-provided content in landing page forms
- Implement proper error boundaries for authentication failures

## Success Metrics

**User Experience:**
- Navigation accessibility score ≥ 95% (automated testing)
- Mobile responsive design passes on 3+ device sizes
- Page load time <2s for layout initialization
- Zero authentication state inconsistencies in user testing

**Technical Performance:**
- Bundle size increase <50KB with Aceternity UI integration
- TypeScript compilation with zero type errors
- 100% test coverage for authentication utilities
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

## Future Enhancements

**Advanced Authentication:**
- Role-based navigation menus (admin, clinician, viewer)
- Single sign-on (SSO) integration with hospital systems
- Multi-factor authentication support
- Session management and concurrent login handling

**Enhanced Landing Experience:**
- Interactive onboarding tutorial
- Personalized release notes based on user role
- Quick setup wizard for new installations
- Analytics integration for user engagement tracking

**Advanced Navigation:**
- Breadcrumb navigation for deep application states
- Contextual help and documentation integration  
- Keyboard navigation shortcuts
- Advanced search functionality within navigation

---

*This PRD focuses on minimum viable requirements for a production-ready application layout system while maintaining extensibility for future healthcare-specific features.*
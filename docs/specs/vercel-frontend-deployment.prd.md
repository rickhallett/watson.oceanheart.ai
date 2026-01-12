# Watson Frontend Vercel Deployment PRD

**Date**: September 14, 2025  
**Version**: 1.0

## Executive Summary

This PRD outlines the requirements and implementation strategy for deploying the Watson frontend application to Vercel. The Watson frontend is a React-based clinical review tool built with Vite, TipTap editor, and Tailwind CSS v4. The deployment will enable standalone frontend hosting on Vercel's edge network while maintaining connectivity to the Django backend API.

## Problem Statement

### Current State
- Frontend is currently served alongside Django backend in Docker containers
- Development requires full stack deployment even for frontend-only changes
- No separate frontend deployment pipeline exists
- Frontend and backend are tightly coupled in deployment

### Pain Points
- Slow frontend iteration cycles due to full-stack deployment requirements
- Cannot leverage edge CDN capabilities for static assets
- Limited ability to scale frontend independently from backend
- Complex Docker setup required for frontend-only developers

## Requirements

### User Requirements
- Frontend must load quickly from global edge locations
- Application must maintain full functionality with remote API
- Users should experience seamless API connectivity
- Preview deployments for PR reviews

### Technical Requirements
- Build with Bun and Vite for production optimization
- Support for environment-specific API endpoints
- Proper handling of CORS for API communication
- Static asset optimization and caching
- Support for dynamic imports and code splitting
- TipTap editor and all UI components must function correctly

### Design Requirements
- Maintain responsive design across all devices
- Preserve dark/light theme functionality
- Ensure all Aceternity UI animations work properly
- Maintain existing routing structure

## Implementation Phases

### Phase 1: Core Deployment Configuration

**Objectives**: Establish basic Vercel deployment

1. **Create vercel.json configuration**
```json
{
  "buildCommand": "bun install && bun run build:frontend",
  "outputDirectory": "dist/static",
  "framework": "vite",
  "installCommand": "curl -fsSL https://bun.sh/install | bash && bun install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

2. **Update package.json scripts**
```json
{
  "scripts": {
    "build:vercel": "vite build",
    "preview:vercel": "vite preview"
  }
}
```

3. **Environment variable configuration**
   - `VITE_API_URL`: Backend API endpoint
   - `VITE_APP_ENV`: Environment identifier (production/staging/development)
   - `VITE_PUBLIC_URL`: Frontend public URL

### Phase 2: API Integration & CORS

**Objectives**: Configure proper API connectivity

1. **Update vite.config.ts for production**
```typescript
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  root: './frontend',
  build: {
    outDir: '../dist/static',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'tiptap': ['@tiptap/core', '@tiptap/react', '@tiptap/starter-kit'],
          'ui': ['framer-motion', '@radix-ui/react-dropdown-menu'],
          'vendor': ['react', 'react-dom']
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  }
}));
```

2. **Create API client configuration**
```typescript
// frontend/src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.watson.oceanheart.ai';

export const apiClient = {
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  }
};
```

3. **Django CORS configuration update**
   - Add Vercel domains to ALLOWED_HOSTS
   - Configure CORS_ALLOWED_ORIGINS for Vercel URLs
   - Set up proper CSRF handling for cross-origin requests

### Phase 3: Build Optimization

**Objectives**: Optimize bundle size and performance

1. **Implement code splitting**
   - Lazy load TipTap editor components
   - Split Aceternity UI components into separate chunks
   - Dynamic import for heavy dependencies

2. **Asset optimization**
   - Configure image optimization
   - Implement font subsetting
   - Enable gzip/brotli compression

3. **Caching strategy**
   - Set appropriate cache headers
   - Implement service worker for offline support
   - Configure CDN cache purging

### Phase 4: CI/CD Pipeline

**Objectives**: Automate deployment workflow

1. **GitHub integration**
   - Connect repository to Vercel
   - Configure branch deployments
   - Set up preview deployments for PRs

2. **Build checks**
   - TypeScript type checking
   - Build size monitoring
   - Lighthouse performance checks

3. **Environment management**
   - Production: `watson.oceanheart.ai`
   - Staging: `staging-watson.oceanheart.ai`
   - Preview: `pr-*.watson.vercel.app`

## Implementation Notes

### Directory Structure Adjustments
```
watson.oceanheart.ai/
├── frontend/          # Root for Vercel deployment
│   ├── src/
│   ├── public/
│   └── index.html
├── vercel.json        # Vercel configuration
├── package.json       # Root package.json with scripts
└── vite.config.ts     # Vite configuration
```

### Build Process
```bash
# Local build test
bun install
bun run build:frontend

# Vercel will execute
curl -fsSL https://bun.sh/install | bash
bun install
bun run build:vercel
```

### Environment Variable Management
```typescript
// frontend/src/config/environment.ts
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL,
    timeout: 30000
  },
  app: {
    environment: import.meta.env.VITE_APP_ENV || 'development',
    version: import.meta.env.VITE_APP_VERSION || '0.1.0'
  }
};
```

## Security Considerations

### API Security
- Implement API key authentication for frontend-to-backend communication
- Use HTTPS for all API communications
- Implement request rate limiting
- Add request signing for sensitive operations

### Frontend Security
- Enable CSP headers via Vercel configuration
- Implement XSS protection for user-generated content in editor
- Validate all user inputs before API submission
- Secure storage of authentication tokens

### CORS Configuration
- Whitelist only specific Vercel domains
- Implement preflight request handling
- Use credentials: 'include' for authenticated requests

## Success Metrics

- **Performance**: Lighthouse score > 90 for performance
- **Build Time**: Frontend builds complete in < 60 seconds
- **Deploy Time**: Deployment to production in < 2 minutes
- **Availability**: 99.9% uptime for frontend application
- **Load Time**: Initial page load < 2 seconds on 3G connection
- **Bundle Size**: Main bundle < 500KB gzipped

## Future Enhancements

### Potential Improvements
- Implement edge functions for API caching
- Add i18n support with locale-based routing
- Integrate analytics and error tracking
- Implement A/B testing framework
- Add PWA capabilities with offline support

### Advanced Features
- Server-side rendering with Vercel Functions
- Image optimization API integration
- WebSocket support via Vercel Edge Functions
- Multi-region deployment for global latency optimization

## Appendix

### Required Files

**vercel.json**
```json
{
  "buildCommand": "bun install && bun run build:frontend",
  "outputDirectory": "dist/static",
  "framework": "vite",
  "installCommand": "curl -fsSL https://bun.sh/install | bash",
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://api.watson.oceanheart.ai/api/$1",
      "headers": {
        "x-forwarded-host": "watson.oceanheart.ai"
      }
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**.env.production**
```env
VITE_API_URL=https://api.watson.oceanheart.ai
VITE_APP_ENV=production
VITE_PUBLIC_URL=https://watson.oceanheart.ai
```

### Deployment Checklist

- [ ] Create Vercel account and project
- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Update API CORS settings
- [ ] Test build process locally
- [ ] Deploy to staging environment
- [ ] Verify all features work correctly
- [ ] Configure custom domain
- [ ] Deploy to production
- [ ] Monitor performance metrics
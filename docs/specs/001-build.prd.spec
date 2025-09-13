# Watson Build System - Product Requirements Document

**Version**: 1.0  
**Date**: 2025-09-12  
**Author**: Senior Product Development Architect  
**Status**: Draft  

---

## 1. Executive Summary

Watson is a clinical LLM output review and curation tool requiring a sophisticated multi-language build system to support Python (UV), TypeScript/JavaScript (Bun), and Ruby environments. The build system must enable efficient development workflows, reliable testing, and seamless deployment across multiple environments while maintaining strict isolation between language ecosystems.

This PRD defines the requirements for a comprehensive build system that balances developer experience, deployment reliability, and operational simplicity for the Watson clinical review platform.

---

## 2. Project Context

### 2.1 Architecture Overview
- **Backend**: Django 5 + Django REST Framework + HTMX
- **Frontend**: TypeScript/React with TipTap rich text editor
- **Database**: PostgreSQL with JSONB support (Neon hosted)
- **Authentication**: JWT from passport.oceanheart.ai (RS256)
- **Deployment**: Cloud platforms (Render/Railway/Fly)

### 2.2 Multi-Language Requirements
- **Python**: UV package manager for Django backend and data processing
- **TypeScript/JavaScript**: Bun runtime for frontend and build tooling  
- **Ruby**: Bundle for auxiliary tooling and scripts

### 2.3 Core Workflow Dependencies
The build system must support the complete Watson workflow:
1. Document ingestion and LLM output generation
2. Rich text editing with TipTap/ProseMirror
3. Real-time diff computation (token + structural JSON)
4. Analytics dashboard with data visualization
5. Export generation (JSONL/CSV bundles)

---

## 3. Requirements Analysis

### 3.1 Functional Requirements

#### 3.1.1 Development Environment Setup
- **DEV-001**: Automated environment initialization for all three language stacks
- **DEV-002**: Dependency management isolation between Python, TypeScript, and Ruby
- **DEV-003**: Hot reloading support for both backend (Django) and frontend (React/TipTap)
- **DEV-004**: Environment variable management across all stacks
- **DEV-005**: Database migration and seed data management

#### 3.1.2 Build Pipeline
- **BUILD-001**: TypeScript transpilation and bundling using Bun
- **BUILD-002**: Python package building and dependency resolution via UV
- **BUILD-003**: Ruby gem management and script execution
- **BUILD-004**: Static asset processing (CSS, images, fonts)
- **BUILD-005**: Production-optimized builds with minification and tree-shaking

#### 3.1.3 Testing Infrastructure
- **TEST-001**: Python test execution using Django's test framework
- **TEST-002**: TypeScript/JavaScript testing with Bun's built-in test runner
- **TEST-003**: Ruby test execution with standard test frameworks
- **TEST-004**: Integration testing across language boundaries
- **TEST-005**: Database testing with isolated test environments

#### 3.1.4 Deployment Automation
- **DEPLOY-001**: Container image building for cloud deployment
- **DEPLOY-002**: Environment-specific configuration management
- **DEPLOY-003**: Database migration execution in deployment pipeline
- **DEPLOY-004**: Static asset deployment to CDN/storage
- **DEPLOY-005**: Health checks and rollback mechanisms

### 3.2 Non-Functional Requirements

#### 3.2.1 Performance
- **PERF-001**: Build times under 2 minutes for development builds
- **PERF-002**: Hot reload response times under 500ms
- **PERF-003**: Production build optimization for minimal bundle sizes
- **PERF-004**: Parallel execution of independent build tasks

#### 3.2.2 Reliability
- **REL-001**: Build process must be deterministic and reproducible
- **REL-002**: Dependency lock files for all package managers (UV, Bun, Bundle)
- **REL-003**: Build failure detection and clear error reporting
- **REL-004**: Rollback capability for failed deployments

#### 3.2.3 Developer Experience
- **DX-001**: Single command setup for new developers
- **DX-002**: Clear documentation for common build tasks
- **DX-003**: IDE integration with TypeScript, Python, and Ruby tooling
- **DX-004**: Consistent command interface across all languages

### 3.3 Technical Constraints

#### 3.3.1 Language Version Requirements
- **Python**: 3.11+ (for Django 5 compatibility)
- **Node.js**: Bun runtime (no Node.js dependency)
- **Ruby**: 3.0.0+ (current Gemfile specification)
- **TypeScript**: 5.0+ (peer dependency requirement)

#### 3.3.2 Package Manager Constraints
- **Python**: Must use UV (no pip, pipenv, or poetry)
- **JavaScript**: Must use Bun (no npm, yarn, or pnpm)
- **Ruby**: Must use Bundle (standard Ruby package manager)

#### 3.3.3 Platform Compatibility
- **Primary**: macOS (Darwin) development environment
- **Secondary**: Linux deployment environments
- **Tertiary**: Windows development environment (WSL)

---

## 4. Implementation Phases

### Phase 0: Foundation Setup (001-build-00.prd.spec)
**Scope**: Basic multi-language environment initialization and dependency management

**Key Features**:
- UV environment setup with Python 3.11+
- Bun installation and TypeScript configuration
- Ruby Bundle configuration
- Basic project structure validation
- Environment variable template creation

**Success Criteria**:
- All three language environments can be initialized from scratch
- Dependencies install without conflicts
- Basic "hello world" execution in each language
- Clear setup documentation

**Dependencies**: None
**Estimated Effort**: 1-2 days

### Phase 1: Development Workflow (001-build-01.prd.spec)
**Scope**: Hot reloading, development servers, and local testing infrastructure

**Key Features**:
- Django development server with hot reload
- Bun-based frontend development with HMR
- File watching for automatic rebuilds
- Local database setup and migrations
- Development environment health checks

**Success Criteria**:
- Changes to Python code trigger Django reload
- Frontend changes reflect immediately in browser
- Database migrations run automatically
- All services can start with single command

**Dependencies**: Phase 0 completion
**Estimated Effort**: 2-3 days

### Phase 2: Build Pipeline (001-build-02.prd.spec)
**Scope**: Production-ready build processes and asset optimization

**Key Features**:
- TypeScript transpilation and bundling with Bun
- Python package building and optimization
- Static asset processing and optimization
- Build artifact validation
- Environment-specific configuration

**Success Criteria**:
- Production builds complete without errors
- Static assets are properly optimized
- Build artifacts are deployment-ready
- Build process is deterministic

**Dependencies**: Phase 1 completion
**Estimated Effort**: 2-3 days

### Phase 3: Testing Infrastructure (001-build-03.prd.spec)
**Scope**: Comprehensive testing setup across all language stacks

**Key Features**:
- Django test suite execution
- Bun test runner for TypeScript/JavaScript
- Ruby test framework integration
- Test database isolation
- Coverage reporting

**Success Criteria**:
- All test suites run independently
- Test databases are properly isolated
- Coverage reports generated
- CI/CD integration ready

**Dependencies**: Phase 2 completion
**Estimated Effort**: 2-3 days

### Phase 4: Deployment Automation (001-build-04.prd.spec)
**Scope**: Production deployment pipeline and infrastructure

**Key Features**:
- Docker containerization
- Cloud platform deployment scripts
- Database migration automation
- Environment configuration management
- Health checks and monitoring

**Success Criteria**:
- Automated deployment to staging/production
- Database migrations execute safely
- Health checks validate deployment
- Rollback procedures tested

**Dependencies**: Phase 3 completion
**Estimated Effort**: 3-4 days

---

## 5. Technical Implementation Details

### 5.1 Build Tool Requirements

#### 5.1.1 Bun Configuration
```json
{
  "scripts": {
    "dev": "bun --hot ./src/index.ts",
    "build": "bun build ./src/index.ts --outdir ./dist --minify",
    "test": "bun test",
    "typecheck": "tsc --noEmit"
  },
  "build": {
    "target": "browser",
    "outdir": "./dist",
    "entryPoints": ["./src/index.ts"],
    "splitting": true,
    "format": "esm"
  }
}
```

#### 5.1.2 UV Configuration
```toml
[project]
name = "watson-oceanheart-ai"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "django>=5.0",
    "djangorestframework",
    "django-cors-headers",
    "psycopg2-binary",
    "python-jose[cryptography]",
    "requests"
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

#### 5.1.3 Bundle Configuration
```ruby
source 'https://rubygems.org'
ruby '3.0.0'

gem 'rake'
gem 'minitest'
gem 'rubocop'
```

### 5.2 File Structure Organization
```
watson.oceanheart.ai/
├── backend/                 # Django application
│   ├── watson/             # Main Django project
│   ├── apps/               # Django apps
│   ├── static/             # Static assets
│   └── requirements/       # Environment-specific deps
├── frontend/               # TypeScript/React frontend
│   ├── src/                # Source code
│   ├── public/             # Public assets
│   └── dist/               # Build output
├── scripts/                # Ruby and other scripts
├── docs/                   # Documentation
├── tests/                  # Cross-language tests
├── docker/                 # Container configurations
└── deploy/                 # Deployment scripts
```

### 5.3 Environment Management

#### 5.3.1 Development Environment Variables
```bash
# Database
DATABASE_URL=postgresql://localhost:5432/watson_dev
REDIS_URL=redis://localhost:6379/0

# Authentication
PASSPORT_JWKS_URL=https://passport.oceanheart.ai/.well-known/jwks.json
JWT_ALGORITHM=RS256

# Django
DEBUG=true
SECRET_KEY=dev-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Bun/Frontend
NODE_ENV=development
VITE_API_URL=http://localhost:8888
```

#### 5.3.2 Production Environment Variables
```bash
# Database
DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}

# Authentication
PASSPORT_JWKS_URL=https://passport.oceanheart.ai/.well-known/jwks.json
JWT_ALGORITHM=RS256

# Django
DEBUG=false
SECRET_KEY=${SECRET_KEY}
ALLOWED_HOSTS=${ALLOWED_HOSTS}

# Frontend
NODE_ENV=production
VITE_API_URL=${API_URL}
```

---

## 6. Integration Points

### 6.1 Frontend-Backend Integration
- **API Endpoints**: RESTful API with Django REST Framework
- **Authentication**: JWT validation middleware
- **Static Assets**: Django serves development assets, CDN in production
- **WebSocket**: HTMX for real-time interactions

### 6.2 Database Integration
- **Migrations**: Django migration system
- **Seed Data**: Management commands for test data
- **Backup/Restore**: Automated database backup procedures

### 6.3 External Service Integration
- **Passport Authentication**: JWT token validation
- **Database Hosting**: Neon PostgreSQL integration
- **File Storage**: Static asset storage (local/S3/CDN)

---

## 7. Quality Assurance

### 7.1 Code Quality Standards
- **Python**: Black formatting, isort imports, flake8 linting
- **TypeScript**: ESLint with TypeScript rules, Prettier formatting
- **Ruby**: RuboCop linting and formatting

### 7.2 Testing Strategy
- **Unit Tests**: Each language stack has comprehensive unit tests
- **Integration Tests**: Cross-language integration validation
- **End-to-End Tests**: Full workflow testing with real database
- **Performance Tests**: Build time and runtime performance validation

### 7.3 Security Requirements
- **Dependency Scanning**: Automated vulnerability scanning
- **Secret Management**: No hardcoded secrets in code
- **Container Security**: Minimal attack surface in containers

---

## 8. Monitoring and Observability

### 8.1 Build Monitoring
- **Build Success Rates**: Track successful vs failed builds
- **Build Performance**: Monitor build times and resource usage
- **Dependency Health**: Track outdated and vulnerable dependencies

### 8.2 Deployment Monitoring
- **Deployment Success**: Track successful deployments
- **Rollback Events**: Monitor and alert on rollbacks
- **Health Check Status**: Continuous application health monitoring

---

## 9. Documentation Requirements

### 9.1 Developer Documentation
- **Setup Guide**: Comprehensive environment setup instructions
- **Build Commands**: Reference for all build system commands
- **Troubleshooting**: Common issues and solutions
- **Architecture Guide**: Build system architecture overview

### 9.2 Operations Documentation
- **Deployment Guide**: Production deployment procedures
- **Monitoring Guide**: Monitoring and alerting setup
- **Incident Response**: Build and deployment incident procedures

---

## 10. Success Metrics

### 10.1 Developer Experience Metrics
- **Setup Time**: New developer can start contributing in <30 minutes
- **Build Time**: Development builds complete in <2 minutes
- **Hot Reload Time**: Changes reflect in <500ms
- **Test Execution Time**: Full test suite completes in <5 minutes

### 10.2 Reliability Metrics
- **Build Success Rate**: >95% successful builds
- **Deployment Success Rate**: >98% successful deployments
- **Mean Time to Recovery**: <15 minutes for build/deployment issues
- **Zero Downtime Deployments**: 100% of deployments are zero-downtime

### 10.3 Maintenance Metrics
- **Dependency Freshness**: <30 days average age for non-major updates
- **Security Vulnerability Resolution**: <24 hours for critical vulnerabilities
- **Build System Updates**: Minimal disruption to developer workflow

---

## 11. Risk Assessment

### 11.1 Technical Risks
- **Multi-Language Complexity**: Managing three different language ecosystems
- **Build Tool Maturity**: Bun is relatively new compared to established tools
- **Dependency Conflicts**: Potential conflicts between language-specific dependencies

### 11.2 Mitigation Strategies
- **Containerization**: Use containers to isolate language environments
- **Fallback Plans**: Alternative build tools ready if Bun issues arise
- **Comprehensive Testing**: Extensive testing to catch dependency conflicts early

---

## 12. Conclusion

This PRD establishes the foundation for a robust, multi-language build system supporting Watson's clinical LLM review platform. The phased approach ensures systematic implementation while maintaining focus on developer experience and deployment reliability.

The build system must balance the complexity of supporting Python (UV), TypeScript (Bun), and Ruby environments while providing a unified, simple interface for developers and operations teams.

Success depends on careful attention to integration points, comprehensive testing, and maintaining flexibility for the evolving needs of the Watson platform.

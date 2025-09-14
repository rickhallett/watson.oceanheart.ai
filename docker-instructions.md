# Docker Development Environment Instructions

## Quick Start

```bash
# Start all services
docker-compose up -d

# Start with development profile (includes frontend-dev and Caddy)
docker-compose --profile dev up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Available URLs and Ports

### Primary Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Unified Proxy (Caddy)** | http://localhost:3321 | Main development URL with unified frontend/backend |
| **Django Backend (Direct)** | http://localhost:8888 | Direct Django API access |
| **Vite Frontend (Direct)** | http://localhost:8881 | Direct Vite dev server access |
| **PostgreSQL Database** | localhost:5432 | Database connection |
| **Redis** | localhost:6379 | Cache/queue service |

### Proxy Configuration

The Caddy proxy (port 3321) routes requests as follows:
- `/api/*` → Django backend (watson:8000)
- `/admin/*` → Django admin (watson:8000)
- `/*` → Vite frontend (frontend-dev:3000)

### Internal Docker Network

Services communicate internally using these hostnames:
- `watson` - Django backend (port 8000 internally)
- `frontend-dev` - Vite dev server (port 3000 internally)
- `database` - PostgreSQL (port 5432)
- `redis` - Redis (port 6379)
- `caddy` - Reverse proxy (port 3321)

## Environment Variables

### Django Backend (`watson` service)
- `DATABASE_URL`: postgresql://watson:watson_dev_password@database:5432/watson_dev
- `REDIS_URL`: redis://redis:6379/0
- `DEBUG`: true
- `ALLOWED_HOSTS`: localhost,127.0.0.1,watson
- `DJANGO_SETTINGS_MODULE`: watson.settings.base

### Frontend Development (`frontend-dev` service)
- `VITE_API_URL`: http://watson:8000

### Vite Proxy Configuration
The Vite dev server (vite.config.ts) proxies:
- `/api` → `VITE_API_URL` or http://localhost:8888
- `/admin` → `VITE_API_URL` or http://localhost:8888

## Development Workflows

### Full Stack Development (Recommended)
```bash
# Use the unified proxy with hot-reload for both frontend and backend
docker-compose --profile dev up -d

# Access the application at:
# http://localhost:3321
```

### Backend-Only Development
```bash
# Start only backend services
docker-compose up -d watson database redis

# Access Django at:
# http://localhost:8888/admin
# http://localhost:8888/api
```

### Frontend-Only Development (Local)
```bash
# Start backend services
docker-compose up -d watson database redis

# Run frontend locally
bun run dev

# Frontend will proxy API calls to http://localhost:8888
```

## Database Access

### PostgreSQL Connection
```
Host: localhost
Port: 5432
Database: watson_dev
Username: watson
Password: watson_dev_password
```

### Django Admin
```
URL: http://localhost:8888/admin (direct)
     http://localhost:3321/admin (via proxy)
Username: admin
Password: admin123
```

## Volume Mounts

### Backend (`watson` service)
- `./backend:/app/backend` - Live code reload
- `venv_volume:/app/backend/.venv` - Preserved Python environment

### Frontend (`frontend-dev` service)
- `./frontend:/app/frontend` - Live code reload
- `./package.json:/app/package.json` - Package manifest
- `./bun.lock:/app/bun.lock` - Lock file
- `./tsconfig.json:/app/tsconfig.json` - TypeScript config
- `./vite.config.ts:/app/vite.config.ts` - Vite config
- `./components.json:/app/components.json` - Component config
- `node_modules:/app/node_modules` - Preserved dependencies

## Troubleshooting

### Port Conflicts
If ports are already in use:
```bash
# Check what's using a port
lsof -i :3321  # or 8888, 8881, 5432, 6379

# Stop conflicting service or change ports in docker-compose.yml
```

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d

# Run migrations manually
docker-compose exec watson python manage.py migrate
```

### Frontend Build Issues
```bash
# Rebuild frontend container
docker-compose build frontend-dev

# Clear node_modules volume
docker-compose down
docker volume rm watson_node_modules
docker-compose --profile dev up -d
```

### View Container Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f watson
docker-compose logs -f frontend-dev
```

## Service Dependencies

```
caddy (3321)
├── frontend-dev (3000 internal)
└── watson (8000 internal)
    ├── database (5432)
    └── redis (6379)
```

## Health Checks

All services include health checks:
- **watson**: `/healthcheck.sh` every 30s
- **database**: `pg_isready` every 5s
- **redis**: `redis-cli ping` every 10s

Services won't start until their dependencies are healthy.
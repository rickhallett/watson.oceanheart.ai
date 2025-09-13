# Watson Deployment Strategy PRD

Date: 2025-09-12

## Executive Summary
Define a pragmatic deployment for watson.oceanheart.ai with clean separation of dev/prod databases, simple reverse proxying, and smooth local development at watson.lvh.me:3321. Prefer managed Postgres and a developer‑friendly proxy (Caddy) for TLS and routing.

## Problem Statement
We need a cohesive, low‑friction path from local dev to production: consistent URLs, secure env config, separate DBs, and repeatable deployment using existing scripts (deploy/, docker/).

## Requirements
### User requirements
- Access production at https://watson.oceanheart.ai with HTTPS.
- Local dev at http://watson.lvh.me:3321 with frontend hot‑reload and API routing.

### Technical requirements
- Separate Postgres instances for dev and prod; migrations tracked and automated.
- Reverse proxy terminates TLS, serves static assets, and routes /api to Django.
- CI gates deploys with tests (use `npm run test:all`) and build validation.
- Single command deploy via `deploy/deploy.sh` (Render/Fly) or Docker on a VM.

### Design requirements
- Use `.env.*` files from provided templates; never commit secrets.
- Health checks in place and a rollback path.

## Implementation Phases
### Phase 1: Local development
- Run DB/Redis/Django via `docker-compose up -d` (ports 5432, 6379, 8000).
- Start frontend: `npm run dev` (bun dev). Use Caddy to expose http://watson.lvh.me:3321 and route:
  - `/` → `localhost:3000` (Bun dev server)
  - `/api/*` → `localhost:8000` (Django)

Example Caddyfile (local):
```
watson.lvh.me:3321 {
  reverse_proxy /api/* localhost:8000
  reverse_proxy localhost:3000
}
```

### Phase 2: Production (managed platform)
- Preferred: Render or Fly.io using `deploy/deploy.sh -p render` or `-p fly`.
- DNS: `A/AAAA` for `watson.oceanheart.ai` per platform instructions.
- Configure env from `.env.production` (use `.env.production.template`).
- DB: Managed Postgres (two databases: `watson_prod`, `watson_staging`), expose `DATABASE_URL` only.
- Static assets: build with `npm run build:prod`; platform serves static or proxy to Django `collectstatic` output.

### Phase 3: Production (self‑hosted VM, optional)
- Services with Docker Compose (reuse `docker-compose.yml` pattern): Caddy (TLS via Let’s Encrypt), Django (gunicorn), Redis, Postgres (or managed).
- Example Caddyfile (prod):
```
watson.oceanheart.ai {
  encode gzip
  handle_path /api/* {
    reverse_proxy django:8000
  }
  root * /srv/www/dist/static
  file_server
}
```
- Publish built frontend to `/srv/www/dist/static` during deploy.

## Implementation Notes
- Migrations: `npm run migrate` or `./scripts/migrate.sh` post‑deploy.
- CI: `npm run ci:local` locally; platform CI must run `npm run test:all` and `npm run validate:build`.
- Env: derive from `.env.staging.template` and `.env.production.template`. Ensure `ALLOWED_HOSTS` includes target domains.

## Security Considerations
- Enforce HTTPS in production; HSTS via Caddy/Nginx.
- Strong `SECRET_KEY`, secure `DATABASE_URL`; rotate credentials.
- Limit admin access; configure CORS narrowly.

## Success Metrics
- Green CI before deploy; < 5 min zero‑downtime rollout; health check returns 200; error rates stable; page load and API latency within baseline.

## Future Enhancements
- Blue/green deploys with traffic switching.
- Automated DB backups and PITR; read replicas for analytics.
- Observability: logs, metrics, tracing (e.g., OpenTelemetry) with alerts.


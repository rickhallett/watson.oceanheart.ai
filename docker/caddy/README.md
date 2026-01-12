# Caddy Reverse Proxy

This folder contains ready‑to‑use Caddyfiles for local development and production.

## Local
- File: `docker/caddy/Caddyfile.local`
- Domain: `http://watson.lvh.me:7001`
- Routes:
  - `/api/*`, `/admin/*` → `localhost:8001` (Django)
  - everything else → `localhost:3001` (Bun dev server)

Run locally (assuming Caddy is installed):

```
caddy run --config docker/caddy/Caddyfile.local --adapter caddyfile

Notes:
- The local Caddyfile disables automatic HTTPS and binds to HTTP on port 7001 to avoid ACME lookups.
- Proxies frontend to :3001 and API to :8001.
- Visit: http://watson.lvh.me:7001
```

## Production
- File: `docker/caddy/Caddyfile.prod`
- Domain: `https://watson.oceanheart.ai` (TLS via Let’s Encrypt)
- Expects:
  - Frontend static at `/srv/www/dist/static`
- Django reachable as host `django:8000` (e.g., Docker network)
  - Optional Django static at `/srv/backend/staticfiles`

Example Docker Compose service:

```yaml
services:
  caddy:
    image: caddy:2
    ports: ["80:80", "443:443"]
    volumes:
      - ./docker/caddy/Caddyfile.prod:/etc/caddy/Caddyfile:ro
      - ./dist/static:/srv/www/dist/static:ro
      - ./backend/staticfiles:/srv/backend/staticfiles:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - watson
volumes:
  caddy_data:
  caddy_config:
```

Adjust paths and service names to match your environment.

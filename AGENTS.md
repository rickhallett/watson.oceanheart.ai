# Repository Guidelines

## Project Structure & Modules
- `frontend/` — React + TypeScript app built with Bun. Entry: `src/main.tsx`; tests: `*.test.ts[x]`.
- `backend/` — Django API (`watson/`, `reviews/`, `core/`). Uses `manage.py`; static assets in `static/` and `staticfiles/`.
- `spec/` — Ruby/RSpec unit tests for shared validators/utilities.
- `scripts/` — Dev/CI helpers (`dev.sh`, `ci-local.sh`, `pre-commit-hook.sh`, `migrate.sh`).
- `deploy/` — Release scripts. `docker/`, `Dockerfile`, `docker-compose.yml` for container workflows.
- Build output goes to `dist/` and coverage to `coverage/`, `backend/htmlcov/`.

## Build, Test, and Dev Commands
- Local dev (full): `npm run dev` (hot-serve via Bun).
- Build (prod): `npm run build` or `npm run build:prod`.
- Frontend tests: `npm test` or `bun test frontend/ --preload ./bun.test.config.ts`.
- Backend tests: `npm run test:backend` (Django).
- Ruby tests: `npm run test:ruby` (RSpec).
- All tests + coverage: `npm run test:all` and `npm run test:coverage`.
- Docker: `npm run docker:build`, `npm run docker:up`, `npm run docker:down`.
- Local CI simulation: `npm run ci:local`. Pre-commit checks: `npm run pre-commit`.

## Coding Style & Naming
- TypeScript/React: strict types; run `npm run typecheck`. Components `PascalCase.tsx`, utilities `camelCase.ts`.
- Python/Django: follow Django app structure; module names `snake_case.py`; settings under `backend/watson/settings/`.
- Ruby: follow RuboCop defaults; specs under `spec/*_spec.rb`.
- Keep files small and cohesive; prefer pure functions and typed interfaces at boundaries.

## Testing Guidelines
- Frontend: Testing Library + Happy DOM. Name tests `*.test.ts[x]` adjacent to source.
- Backend: Django `TestCase` in app `tests.py` modules. Run with `DJANGO_ENVIRONMENT=test` when needed.
- Ruby: RSpec with SimpleCov; unit specs in `spec/` mirroring library names.
- Coverage reports: `npm run coverage` (HTML at `backend/htmlcov/index.html`, `coverage/index.html`).

## Commits & Pull Requests
- Commits: short imperative subject (<= 72 chars), scoped paths (e.g., `frontend: …`, `backend: …`). Group related changes.
- PRs: include purpose, screenshots for UI, reproduction/verification steps, and linked issues. Ensure `ci-local.sh` passes and production build validates (`npm run validate:build`).

## Security & Configuration
- Never commit secrets. Use `.env.*` files; copy from `*.template` and load per environment. Validate via `scripts/health-check.sh`.

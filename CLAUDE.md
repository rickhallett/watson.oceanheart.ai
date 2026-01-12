# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Watson** is a clinical LLM output review and curation tool for psychotherapy and well-being applications. It provides an environment for clinicians to review, edit, classify, and refine model-generated clinical summaries through a structured workflow: review → edit/classify → submit → diff → analytics → export.

This is a multi-language project supporting:
- **Backend**: Django 5 + DRF + HTMX (planned)
- **Frontend**: TypeScript/React with TipTap editor (using Bun)
- **Scripting**: Python with UV package manager
- **Additional**: Ruby support

---

## Development Environment Setup

### Python (UV)
```bash
# Activate the existing virtual environment
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
# Install dependencies
uv pip install -r requirements.txt  # when requirements.txt is created
```

### TypeScript/JavaScript (Bun)
```bash
# Install dependencies
bun install
# Development server (when TypeScript/frontend code is added)
bun --hot ./index.ts
```

### Ruby
```bash
# Install gems
bundle install
```

---

## Commands

### Bun (Primary JavaScript/TypeScript Runtime)

**Use Bun as the primary runtime with Vite for frontend development.**

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` to run tests
- Use `vite` for frontend development server and builds
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv

### Python
- Use `python main.py` to run the main Python script
- UV is the preferred package manager for Python dependencies

### Ruby
- Use `bundle exec` to run Ruby commands with proper gem dependencies

---

## Architecture

### Core Workflow
1. **Seed**: Document + LLMOutput loaded
2. **Edit**: Clinician edits in TipTap rich editor, applies classification labels
3. **Submit**: Backend computes diffs (token + structural), stores immutable record
4. **Review/Diff**: Diff viewer shows before/after changes  
5. **Analytics**: Dashboard of change rates + label frequencies
6. **Export**: Generate research datasets (JSONL/CSV bundles)

### Data Model (Planned)
- **Document** – source clinical note (raw JSON)
- **LLMOutput** – model-generated summary tied to a Document
- **Edit** – clinician revision with diffs, edited JSON, status
- **Label** – taxonomy of issue types (hallucination, missing_risk, etc.)
- **EditLabel** – join table for applied labels

### Key Endpoints (Planned)
- `GET /outputs/:id` → view output snapshot
- `POST /edits` → create draft edit
- `PUT /edits/:id` → save draft changes
- `POST /edits/:id/submit` → finalize, compute diffs
- `GET /edits/:id/diff` → return/render diff
- `GET /analytics/basic` → JSON for dashboard
- `POST /exports` → create export bundle

---

## Frontend Development (Vite + React + Bun)

Use Vite for frontend development and building with Bun as the JavaScript runtime. This provides optimal integration with Tailwind CSS, component libraries, and modern tooling.

### Development Commands
- `bun run dev` - Start Vite development server with HMR
- `bun run build` - Build production assets with Vite
- `vite` - Direct Vite command for development server

### Bun APIs (Preferred for Backend/Scripts)
- `Bun.serve()` for HTTP server with WebSocket support (instead of Express)
- `bun:sqlite` for SQLite (instead of better-sqlite3)
- `Bun.redis` for Redis (instead of ioredis)  
- `Bun.sql` for Postgres (instead of pg or postgres.js)
- Built-in `WebSocket` (instead of ws library)
- `Bun.file` over `node:fs` readFile/writeFile
- `Bun.$` for shell commands (instead of execa)

### Testing
```ts
import { test, expect } from "bun:test";

test("example test", () => {
  expect(1).toBe(1);
});
```

### Frontend Structure
- Vite handles TypeScript/JSX transpilation and bundling
- Tailwind CSS integration through PostCSS
- Component library support with proper build pipeline
- API proxy configuration for backend integration

---

## TypeScript Configuration

The project uses modern TypeScript with:
- ESNext target and lib
- React JSX transform
- Strict type checking enabled
- Bundler module resolution
- No emit (bundler handles compilation)

---

## Authentication

**Centralized Auth** via `passport.oceanheart.ai` JWTs with RS256 verification middleware.

---

## Documentation

Project specifications and PRDs are located in `docs/specs/`. Current documentation includes:
- Integration specifications for visual design systems
- Oceanheart Passport integration
- Style guide specifications

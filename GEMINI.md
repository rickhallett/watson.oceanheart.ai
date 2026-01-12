# Watson.Oceanheart.ai

## Project Overview

**Watson** is a prototype application for clinicians to review and refine LLM outputs in psychotherapy. It allows for editing, classifying issues, submitting reviews, and viewing basic analytics. The goal is to evaluate the process of clinical review of LLM-generated content, not for direct clinical deployment.

The tech stack includes:

*   **Backend:** Django 5 with Django Rest Framework and HTMX.
*   **Frontend:** React with TipTap for rich text editing.
*   **Database:** Postgres (Neon)
*   **Authentication:** JWT from `passport.oceanheart.ai`
*   **Deployment:** Render / Railway / Fly

## Building and Running

### Prerequisites

*   Python 3.11+ (with `uv`)
*   Node.js (with `bun`)
*   Ruby (with `bundle`)
*   Postgres DB
*   Redis (optional)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/oceanheart-ai/watson
    cd watson
    ```

2.  **Install Python dependencies:**
    ```bash
    uv venv
    source .venv/bin/activate
    uv pip install -r requirements.txt
    ```

3.  **Install frontend dependencies:**
    ```bash
    bun install
    ```

4.  **Install Ruby dependencies:**
    ```bash
    bundle install
    ```

5.  **Set up environment variables:**
    Create a `.env` file and add the following:
    ```
    DATABASE_URL=postgresql://user:pass@host/db
    PASSPORT_JWKS_URL=https://passport.oceanheart.ai/.well-known/jwks.json
    ```

### Running the application

*   **Run the backend:**
    ```bash
    python backend/manage.py migrate
    python backend/manage.py runserver
    ```

*   **Run the frontend (in a separate terminal):**
    ```bash
    bun run dev
    ```

## Development Conventions

### Testing

*   **Run all tests:**
    ```bash
    npm run test:all
    ```
*   **Run frontend tests:**
    ```bash
    npm run test
    ```
*   **Run backend tests:**
    ```bash
    npm run test:backend
    ```
*   **Run Ruby tests:**
    ```bash
    npm run test:ruby
    ```

### Code Style

*   **Type checking:**
    ```bash
    npm run typecheck
    ```
*   **Pre-commit hooks:**
    The project uses a pre-commit hook to run checks before committing. See `./scripts/pre-commit-hook.sh`.

### Deployment

*   The project can be deployed using Docker or to services like Render, Railway, or Fly.
*   Deployment scripts are available in the `deploy/` directory.
*   Use `npm run docker:build` and `npm run docker:up` to run with Docker.

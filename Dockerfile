# Watson Multi-Stage Docker Build
# Supports Django backend, Bun frontend, and Ruby services

FROM oven/bun:1.1 as frontend-builder
WORKDIR /app

# Copy frontend source only
COPY package.json bun.lock ./
COPY tsconfig.json ./
COPY frontend/ ./frontend/

# Install dependencies and build frontend assets
RUN bun install
RUN bun run build:clean && bun run build:frontend

# Python/Django stage
FROM python:3.11-slim as backend-base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# (Optional) Install tools; we'll use Python venv + pip for reliability

WORKDIR /app

# Copy Python requirements
COPY pyproject.toml ./
COPY backend/ ./backend/

# Create virtual environment and install dependencies from pyproject
RUN python -m venv /app/backend/.venv \
    && /app/backend/.venv/bin/pip install --upgrade pip \
    && /app/backend/.venv/bin/pip install -e /app \
    && /app/backend/.venv/bin/pip install \
        "django>=5.0" \
        "djangorestframework>=3.14.0" \
        "django-cors-headers>=4.0.0" \
        "psycopg2-binary>=2.9.0" \
        "python-jose[cryptography]>=3.3.0" \
        "requests>=2.28.0" \
        "factory-boy>=3.3.0" \
        "faker>=21.0.0" \
        "coverage>=7.3.0" \
        "django-coverage-plugin>=3.1.0" \
        "gunicorn>=21.2.0" \
        "whitenoise>=6.6.0"

# Ruby services stage
FROM ruby:3.4.5-slim as ruby-services

WORKDIR /app

# Install system dependencies for Ruby
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy Ruby configuration
COPY Gemfile Gemfile.lock ./
COPY lib/ ./lib/
COPY scripts/ ./scripts/

# Install Ruby dependencies
RUN bundle config set --local path 'vendor/bundle' && \
    bundle install --jobs 4 --retry 3

# Final production stage
FROM python:3.11-slim

# Install runtime and minimal build dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    libpq-dev \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -g 999 app && \
    useradd -r -u 999 -g app app

WORKDIR /app

# Copy backend source, venv, and project metadata from backend-base
COPY --from=backend-base /app/backend /app/backend
COPY --from=backend-base /app/pyproject.toml /app/

# Copy built frontend assets
COPY --from=frontend-builder /app/dist /app/backend/staticfiles/

# Copy Ruby services
COPY --from=ruby-services /app/vendor /app/vendor
COPY --from=ruby-services /app/lib /app/lib
COPY --from=ruby-services /app/scripts /app/scripts
COPY --from=ruby-services /app/Gemfile* /app/

# Copy configuration files
COPY docker/entrypoint.sh /entrypoint.sh
COPY docker/healthcheck.sh /healthcheck.sh

# Set permissions and create log directory
RUN chmod +x /entrypoint.sh /healthcheck.sh && \
    mkdir -p /var/log/watson && \
    # Create static directory if it doesn't exist
    mkdir -p /app/backend/watson/static && \
    chown -R app:app /app /var/log/watson && \
    # Fix venv symlinks after chown (they point to system python)
    ln -sf /usr/local/bin/python /app/backend/.venv/bin/python && \
    ln -sf python /app/backend/.venv/bin/python3 && \
    ln -sf python /app/backend/.venv/bin/python3.11 && \
    chmod +x /app/backend/.venv/bin/*

# Set environment variables
ENV PATH="/app/backend/.venv/bin:$PATH"
ENV DJANGO_SETTINGS_MODULE=watson.settings.production
ENV PYTHONPATH=/app/backend

# Fix venv permissions and install globally as fallback
RUN chmod +x /app/backend/.venv/bin/* 2>/dev/null || true && \
    pip install -e /app && \
    pip install "django>=5.0" "djangorestframework>=3.14.0" "django-cors-headers>=4.0.0" "psycopg2-binary>=2.9.0" "python-jose[cryptography]>=3.3.0" "requests>=2.28.0" "factory-boy>=3.3.0" "faker>=21.0.0" "coverage>=7.3.0" "django-coverage-plugin>=3.1.0" "gunicorn>=21.2.0" "whitenoise>=6.6.0"

# Pre-collect static files during build for production
RUN cd /app/backend && \
    # Set minimal environment variables needed for collectstatic
    export SECRET_KEY="build-time-secret" && \
    export DEBUG="false" && \
    export ALLOWED_HOSTS="localhost" && \
    export DJANGO_SETTINGS_MODULE="watson.settings.base" && \
    # Run collectstatic without requiring database - use base settings to avoid production constraints
    /app/backend/.venv/bin/python manage.py collectstatic --noinput --clear || true

# Switch to non-root user
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /healthcheck.sh

# Expose port
EXPOSE 8000

# Use entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
CMD ["/app/backend/.venv/bin/gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "watson.wsgi:application"]

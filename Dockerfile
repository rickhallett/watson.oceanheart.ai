# Watson Backend API Docker Build
# Frontend is deployed separately on Vercel

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

# Create virtual environment and install all dependencies from pyproject.toml
RUN python -m venv /app/backend/.venv \
    && /app/backend/.venv/bin/pip install --upgrade pip \
    && /app/backend/.venv/bin/pip install -e /app

# # Ruby services stage
# FROM ruby:3.4.5-slim as ruby-services

# WORKDIR /app

# # Install system dependencies for Ruby
# RUN apt-get update && apt-get install -y \
#     build-essential \
#     && rm -rf /var/lib/apt/lists/*

# # Copy Ruby configuration
# COPY Gemfile Gemfile.lock ./
# COPY lib/ ./lib/
# COPY scripts/ ./scripts/

# # Install Ruby dependencies
# RUN bundle config set --local path 'vendor/bundle' && \
#     bundle install --jobs 4 --retry 3

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

# Copy Ruby services (commented out until Ruby stage is enabled)
# COPY --from=ruby-services /app/vendor /app/vendor
# COPY --from=ruby-services /app/lib /app/lib
# COPY --from=ruby-services /app/scripts /app/scripts
# COPY --from=ruby-services /app/Gemfile* /app/

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

# Set default port (Railway overrides via PORT env var)
ENV PORT=8000

# Use entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
CMD ["/bin/sh", "-c", "/app/backend/.venv/bin/gunicorn --bind 0.0.0.0:${PORT} --workers 3 watson.wsgi:application"]

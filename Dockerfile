# Watson Multi-Stage Docker Build
# Supports Django backend, Bun frontend, and Ruby services

FROM node:18-slim as frontend-builder
WORKDIR /app

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Copy frontend source
COPY package.json bun.lock ./
COPY frontend/ ./frontend/
COPY tsconfig.json ./

# Install dependencies and build frontend
RUN bun install
RUN NODE_ENV=production bun run build:prod

# Python/Django stage
FROM python:3.11-slim as backend-base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install UV
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.cargo/bin:$PATH"

WORKDIR /app

# Copy Python requirements
COPY pyproject.toml ./
COPY backend/ ./backend/

# Create virtual environment and install dependencies
RUN cd backend && uv venv && uv pip install -r ../pyproject.toml

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

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -g 999 app && \
    useradd -r -u 999 -g app app

WORKDIR /app

# Copy Python environment from backend-base
COPY --from=backend-base /app/backend/.venv /app/backend/.venv
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

# Set permissions
RUN chmod +x /entrypoint.sh /healthcheck.sh && \
    chown -R app:app /app

# Set environment variables
ENV PATH="/app/backend/.venv/bin:$PATH"
ENV DJANGO_SETTINGS_MODULE=watson.settings.production
ENV PYTHONPATH=/app/backend

# Switch to non-root user
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /healthcheck.sh

# Expose port
EXPOSE 8000

# Use entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "watson.wsgi:application"]
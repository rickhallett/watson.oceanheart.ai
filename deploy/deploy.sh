#!/bin/bash

# Watson Deployment Automation Script
# Supports Railway, Render, Fly.io, and Docker deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PLATFORM=""
ENVIRONMENT="production"
DRY_RUN=false

print_usage() {
    echo "Usage: $0 -p <platform> [-e environment] [-d]"
    echo ""
    echo "Options:"
    echo "  -p, --platform    Deployment platform (railway|render|fly|docker)"
    echo "  -e, --environment Environment (staging|production) [default: production]"
    echo "  -d, --dry-run     Show what would be deployed without executing"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -p railway                 # Deploy to Railway production"
    echo "  $0 -p render -e staging       # Deploy to Render staging"
    echo "  $0 -p fly -d                  # Dry run for Fly.io deployment"
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

validate_environment() {
    print_info "Validating deployment environment..."
    
    # Check if we're on main branch for production
    if [[ $ENVIRONMENT == "production" ]]; then
        current_branch=$(git rev-parse --abbrev-ref HEAD)
        if [[ $current_branch != "main" ]]; then
            print_error "Production deployments must be from main branch (currently on: $current_branch)"
            exit 1
        fi
    fi
    
    # Check for uncommitted changes
    if [[ -n $(git status --porcelain) ]]; then
        print_error "Uncommitted changes detected. Please commit or stash changes before deployment."
        exit 1
    fi
    
    # Run tests before deployment
    print_info "Running tests before deployment..."
    if [[ $DRY_RUN == false ]]; then
        npm run test:all || {
            print_error "Tests failed. Deployment aborted."
            exit 1
        }
    else
        print_info "DRY RUN: Would run tests"
    fi
    
    print_status "Environment validation passed"
}

deploy_railway() {
    print_info "Deploying to Railway ($ENVIRONMENT)..."
    
    if [[ $DRY_RUN == true ]]; then
        print_info "DRY RUN: Would deploy to Railway with:"
        print_info "  - Platform: Railway"
        print_info "  - Environment: $ENVIRONMENT"
        print_info "  - Config: deploy/railway.json"
        return
    fi
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI is not installed. Install from: https://docs.railway.app/cli"
        exit 1
    fi
    
    # Deploy to Railway
    railway login
    railway up --json deploy/railway.json
    
    print_status "Railway deployment initiated"
}

deploy_render() {
    print_info "Deploying to Render ($ENVIRONMENT)..."
    
    if [[ $DRY_RUN == true ]]; then
        print_info "DRY RUN: Would deploy to Render with:"
        print_info "  - Platform: Render"
        print_info "  - Environment: $ENVIRONMENT"
        print_info "  - Config: deploy/render.yaml"
        return
    fi
    
    print_info "Pushing to git repository (Render auto-deploys from git)..."
    git push origin main
    
    print_status "Render deployment initiated via git push"
    print_info "Monitor deployment at: https://dashboard.render.com"
}

deploy_fly() {
    print_info "Deploying to Fly.io ($ENVIRONMENT)..."
    
    if [[ $DRY_RUN == true ]]; then
        print_info "DRY RUN: Would deploy to Fly.io with:"
        print_info "  - Platform: Fly.io"
        print_info "  - Environment: $ENVIRONMENT"
        print_info "  - Config: deploy/fly.toml"
        return
    fi
    
    # Check if Fly CLI is installed
    if ! command -v flyctl &> /dev/null; then
        print_error "Fly CLI is not installed. Install from: https://fly.io/docs/getting-started/installing-flyctl/"
        exit 1
    fi
    
    # Deploy to Fly.io
    flyctl auth login
    flyctl deploy --config deploy/fly.toml
    
    print_status "Fly.io deployment completed"
}

deploy_docker() {
    print_info "Building and running Docker container locally..."
    
    if [[ $DRY_RUN == true ]]; then
        print_info "DRY RUN: Would build and run Docker with:"
        print_info "  - Build: docker build -t watson ."
        print_info "  - Run: docker-compose up -d"
        return
    fi
    
    # Build Docker image
    print_info "Building Docker image..."
    docker build -t watson-oceanheart-ai .
    
    # Run with Docker Compose
    print_info "Starting services with Docker Compose..."
    docker-compose up -d
    
    print_status "Docker deployment completed"
    print_info "Application available at: http://localhost:8888"
}

run_health_check() {
    if [[ $DRY_RUN == true ]]; then
        print_info "DRY RUN: Would run health checks"
        return
    fi
    
    print_info "Running post-deployment health check..."
    
    # Wait a bit for deployment to settle
    sleep 30
    
    # This would need the actual URL based on platform
    print_info "Health check implementation depends on platform-specific URL"
    print_status "Health check placeholder completed"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            print_usage
            exit 1
            ;;
    esac
done

# Validate required arguments
if [[ -z $PLATFORM ]]; then
    print_error "Platform is required"
    print_usage
    exit 1
fi

# Main execution
echo ""
echo "🚀 Watson Deployment Automation"
echo "==============================="
echo ""
print_info "Platform: $PLATFORM"
print_info "Environment: $ENVIRONMENT"
print_info "Dry Run: $DRY_RUN"
echo ""

cd "$PROJECT_DIR"

validate_environment

case $PLATFORM in
    railway)
        deploy_railway
        ;;
    render)
        deploy_render
        ;;
    fly)
        deploy_fly
        ;;
    docker)
        deploy_docker
        ;;
    *)
        print_error "Unsupported platform: $PLATFORM"
        print_usage
        exit 1
        ;;
esac

run_health_check

echo ""
print_status "Deployment process completed!"
echo ""

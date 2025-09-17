#!/bin/bash

# Watson Application Rollback Script
# Comprehensive rollback procedures for deployment failures

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/tmp/watson_backups"
DOCKER_IMAGE_PREFIX="watson-oceanheart-ai"
ROLLBACK_STRATEGY="auto"

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

print_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -t, --type        Rollback type (database|application|full) [default: auto-detect]"
    echo "  -b, --backup      Specific backup file to rollback to"
    echo "  -v, --version     Application version/tag to rollback to"
    echo "  -s, --strategy    Rollback strategy (auto|manual|force) [default: auto]"
    echo "  -d, --dry-run     Show what would be rolled back without executing"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -t database -b /path/to/backup.sql"
    echo "  $0 -t application -v v1.2.3"
    echo "  $0 -t full -s manual"
}

detect_deployment_platform() {
    if [[ -f "deploy/fly.toml" ]] && command -v flyctl >/dev/null 2>&1; then
        echo "fly"
    elif [[ -f "deploy/railway.json" ]] && command -v railway >/dev/null 2>&1; then
        echo "railway"
    elif [[ -f "deploy/render.yaml" ]]; then
        echo "render"
    elif [[ -f "docker-compose.yml" ]] && command -v docker-compose >/dev/null 2>&1; then
        echo "docker"
    else
        echo "unknown"
    fi
}

get_current_version() {
    # Try to get version from various sources
    if [[ -f "package.json" ]]; then
        python -c "import json; print(json.load(open('package.json'))['version'])" 2>/dev/null || echo "unknown"
    elif command -v git >/dev/null 2>&1; then
        git describe --tags --abbrev=0 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo "unknown"
    else
        echo "unknown"
    fi
}

list_available_backups() {
    print_info "Available database backups:"
    if [[ -d "$BACKUP_DIR" ]]; then
        ls -la "$BACKUP_DIR"/*.sql 2>/dev/null | awk '{print $9, $5, $6, $7, $8}' | column -t || print_info "No backups found"
    else
        print_info "No backup directory found"
    fi
}

list_available_versions() {
    local platform=$(detect_deployment_platform)
    
    print_info "Available versions for rollback:"
    
    case $platform in
        "docker")
            docker images | grep "$DOCKER_IMAGE_PREFIX" | head -5
            ;;
        "fly")
            flyctl releases list --app watson-oceanheart-ai || print_info "Cannot list Fly.io releases"
            ;;
        "railway")
            print_info "Railway: Check dashboard for previous deployments"
            ;;
        "render")
            print_info "Render: Check dashboard for previous deployments"
            ;;
        *)
            if command -v git >/dev/null 2>&1; then
                git tag -l | tail -5 || git log --oneline -5
            fi
            ;;
    esac
}

rollback_database() {
    local backup_file="$1"
    
    if [[ -z "$backup_file" ]]; then
        print_error "Backup file is required for database rollback"
        list_available_backups
        exit 1
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_warning "Database rollback will DESTROY current data!"
    print_warning "Backup file: $backup_file"
    print_warning "Continue? (y/N)"
    
    if [[ $ROLLBACK_STRATEGY != "force" ]]; then
        read -r response
        if [[ $response != "y" && $response != "Y" ]]; then
            print_info "Database rollback cancelled"
            exit 0
        fi
    fi
    
    print_info "Rolling back database..."
    
    # Create a backup of current state before rollback
    current_backup="$BACKUP_DIR/pre_rollback_$(date +%Y%m%d_%H%M%S).sql"
    mkdir -p "$BACKUP_DIR"
    
    print_info "Creating backup of current database state..."
    if [[ -n $DATABASE_URL ]]; then
        pg_dump "$DATABASE_URL" > "$current_backup" || print_warning "Failed to create pre-rollback backup"
    fi
    
    # Restore from backup
    print_info "Restoring database from backup..."
    if [[ -n $DATABASE_URL ]]; then
        psql "$DATABASE_URL" < "$backup_file"
    else
        psql -h localhost -U postgres watson_dev < "$backup_file"
    fi
    
    print_status "Database rollback completed"
    print_info "Current state backed up to: $current_backup"
}

rollback_application() {
    local version="$1"
    local platform=$(detect_deployment_platform)
    
    if [[ -z "$version" ]]; then
        print_error "Version/tag is required for application rollback"
        list_available_versions
        exit 1
    fi
    
    print_info "Rolling back application to version: $version"
    print_info "Platform: $platform"
    
    case $platform in
        "docker")
            print_info "Rolling back Docker deployment..."
            docker-compose down
            docker tag "$DOCKER_IMAGE_PREFIX:$version" "$DOCKER_IMAGE_PREFIX:latest"
            docker-compose up -d
            ;;
        "fly")
            print_info "Rolling back Fly.io deployment..."
            flyctl releases rollback "$version" --app watson-oceanheart-ai
            ;;
        "railway")
            print_error "Railway rollback must be done through dashboard"
            print_info "Go to: https://railway.app/dashboard"
            exit 1
            ;;
        "render")
            print_error "Render rollback must be done through dashboard"
            print_info "Go to: https://dashboard.render.com"
            exit 1
            ;;
        "git")
            print_info "Rolling back to git tag/commit: $version"
            git checkout "$version"
            # Redeploy using current deployment method
            print_info "Please redeploy using your normal deployment process"
            ;;
        *)
            print_error "Unknown deployment platform - cannot perform automatic rollback"
            exit 1
            ;;
    esac
    
    print_status "Application rollback completed"
}

rollback_full() {
    local backup_file="$1"
    local version="$2"
    
    print_info "Performing full system rollback..."
    
    if [[ -n "$backup_file" ]]; then
        rollback_database "$backup_file"
    else
        print_warning "No database backup specified - skipping database rollback"
    fi
    
    if [[ -n "$version" ]]; then
        rollback_application "$version"
    else
        print_warning "No application version specified - skipping application rollback"
    fi
    
    print_status "Full rollback completed"
}

test_rollback_procedures() {
    print_info "Testing rollback procedures (dry run)..."
    
    local platform=$(detect_deployment_platform)
    local current_version=$(get_current_version)
    
    echo ""
    echo "📋 Rollback Test Summary"
    echo "======================="
    echo "Platform: $platform"
    echo "Current Version: $current_version"
    echo ""
    
    print_info "Database rollback test:"
    list_available_backups
    echo ""
    
    print_info "Application rollback test:"
    list_available_versions
    echo ""
    
    # Test health check endpoint
    if curl -s http://localhost:8001/health/ >/dev/null 2>&1; then
        print_status "Health check endpoint: Accessible"
    else
        print_warning "Health check endpoint: Not accessible"
    fi
    
    print_status "Rollback procedure test completed"
}

# Parse command line arguments
ROLLBACK_TYPE=""
BACKUP_FILE=""
VERSION=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            ROLLBACK_TYPE="$2"
            shift 2
            ;;
        -b|--backup)
            BACKUP_FILE="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -s|--strategy)
            ROLLBACK_STRATEGY="$2"
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
            print_error "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Main execution
echo ""
echo "🔙 Watson Rollback System"
echo "========================="
echo ""

if [[ $DRY_RUN == true ]]; then
    test_rollback_procedures
    exit 0
fi

# Auto-detect rollback type if not specified
if [[ -z "$ROLLBACK_TYPE" ]]; then
    if [[ -n "$BACKUP_FILE" && -n "$VERSION" ]]; then
        ROLLBACK_TYPE="full"
    elif [[ -n "$BACKUP_FILE" ]]; then
        ROLLBACK_TYPE="database"
    elif [[ -n "$VERSION" ]]; then
        ROLLBACK_TYPE="application"
    else
        print_error "No rollback parameters specified"
        print_usage
        exit 1
    fi
fi

case $ROLLBACK_TYPE in
    "database")
        rollback_database "$BACKUP_FILE"
        ;;
    "application")
        rollback_application "$VERSION"
        ;;
    "full")
        rollback_full "$BACKUP_FILE" "$VERSION"
        ;;
    *)
        print_error "Invalid rollback type: $ROLLBACK_TYPE"
        print_usage
        exit 1
        ;;
esac

# Run health check after rollback
print_info "Running post-rollback health check..."
if [[ -f "scripts/monitor.sh" ]]; then
    bash scripts/monitor.sh http
else
    print_warning "Health check script not found - please verify manually"
fi

echo ""
print_status "Rollback procedure completed!"
echo ""

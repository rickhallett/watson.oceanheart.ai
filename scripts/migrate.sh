#!/bin/bash

# Watson Database Migration Automation
# Safe migration execution with backup and rollback capabilities

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/tmp/watson_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/watson_backup_$TIMESTAMP.sql"
DRY_RUN=false
ENVIRONMENT="development"

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
    echo "Usage: $0 [-e environment] [-d] [-b] [-r backup_file]"
    echo ""
    echo "Options:"
    echo "  -e, --environment Environment (development|staging|production) [default: development]"
    echo "  -d, --dry-run     Show migrations without executing"
    echo "  -b, --backup      Create backup before migration"
    echo "  -r, --rollback    Rollback to backup file"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e production -b          # Migrate production with backup"
    echo "  $0 -d                        # Dry run migration"
    echo "  $0 -r /path/to/backup.sql    # Rollback to backup"
}

create_backup() {
    if [[ $ENVIRONMENT == "development" ]]; then
        print_info "Skipping backup for development environment"
        return
    fi
    
    print_info "Creating database backup..."
    mkdir -p "$BACKUP_DIR"
    
    # Get database URL based on environment
    if [[ -n $DATABASE_URL ]]; then
        pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
        print_status "Backup created: $BACKUP_FILE"
    else
        print_warning "DATABASE_URL not set, using default connection"
        pg_dump -h localhost -U postgres watson_dev > "$BACKUP_FILE"
        print_status "Backup created: $BACKUP_FILE"
    fi
}

check_migrations() {
    print_info "Checking for pending migrations..."
    
    if [[ $DRY_RUN == true ]]; then
        python manage.py showmigrations --plan
        return $?
    fi
    
    # Check if there are unapplied migrations
    unapplied=$(python manage.py showmigrations --plan | grep "\[ \]" | wc -l)
    if [[ $unapplied -eq 0 ]]; then
        print_status "No pending migrations found"
        return 1
    else
        print_info "Found $unapplied pending migrations"
        python manage.py showmigrations --plan
        return 0
    fi
}

run_migrations() {
    if [[ $DRY_RUN == true ]]; then
        print_info "DRY RUN: Would execute migrations"
        return
    fi
    
    print_info "Running database migrations..."
    
    # Set appropriate Django settings based on environment
    case $ENVIRONMENT in
        production)
            export DJANGO_SETTINGS_MODULE=watson.settings.production
            ;;
        staging)
            export DJANGO_SETTINGS_MODULE=watson.settings.production
            export DEBUG=true
            ;;
        development)
            export DJANGO_SETTINGS_MODULE=watson.settings.base
            ;;
    esac
    
    # Run migrations with verbosity
    python manage.py migrate --verbosity=2
    
    print_status "Migrations completed successfully"
}

validate_migration() {
    print_info "Validating migration result..."
    
    # Check database integrity
    python manage.py check --database default
    
    # Run a simple query to ensure database is accessible
    python manage.py shell -c "
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute('SELECT COUNT(*) FROM django_migrations')
    count = cursor.fetchone()[0]
    print(f'Total migrations applied: {count}')
"
    
    print_status "Migration validation passed"
}

rollback_migration() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_warning "Rolling back database to backup: $backup_file"
    print_warning "This will DESTROY current data. Continue? (y/N)"
    
    read -r response
    if [[ $response != "y" && $response != "Y" ]]; then
        print_info "Rollback cancelled"
        exit 0
    fi
    
    print_info "Restoring database from backup..."
    
    # Drop current database and restore from backup
    if [[ -n $DATABASE_URL ]]; then
        psql "$DATABASE_URL" < "$backup_file"
    else
        psql -h localhost -U postgres watson_dev < "$backup_file"
    fi
    
    print_status "Database rollback completed"
}

# Parse command line arguments
BACKUP=false
ROLLBACK_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -b|--backup)
            BACKUP=true
            shift
            ;;
        -r|--rollback)
            ROLLBACK_FILE="$2"
            shift 2
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
echo "🔄 Watson Database Migration"
echo "============================"
echo ""
print_info "Environment: $ENVIRONMENT"
print_info "Dry Run: $DRY_RUN"
print_info "Backup: $BACKUP"
echo ""

# Change to backend directory
cd "$(dirname "$0")/../backend"

# Handle rollback case
if [[ -n $ROLLBACK_FILE ]]; then
    rollback_migration "$ROLLBACK_FILE"
    exit 0
fi

# Check for migrations first
if ! check_migrations; then
    print_status "Database is up to date"
    exit 0
fi

# Create backup if requested and not development
if [[ $BACKUP == true ]]; then
    create_backup
fi

# Run migrations
run_migrations

# Validate results
validate_migration

echo ""
print_status "Migration process completed successfully!"

if [[ $BACKUP == true && $ENVIRONMENT != "development" ]]; then
    echo ""
    print_info "Backup file available for rollback: $BACKUP_FILE"
fi
echo ""
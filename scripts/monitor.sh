#!/bin/bash

# Watson Application Monitoring and Health Check Script
# Comprehensive monitoring for all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:8888}"
TIMEOUT=10
ALERT_EMAIL="${ALERT_EMAIL:-admin@watson.local}"
LOG_FILE="/var/log/watson/monitoring.log"

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

log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE" 2>/dev/null || true
    echo "$message"
}

check_http_endpoint() {
    local endpoint="$1"
    local expected_status="${2:-200}"
    local description="$3"
    
    log_message "INFO" "Checking $description ($endpoint)..."
    
    if command -v curl >/dev/null 2>&1; then
        local response
        response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $TIMEOUT "$endpoint" 2>/dev/null)
        
        if [[ $response -eq $expected_status ]]; then
            print_status "$description: OK ($response)"
            return 0
        else
            print_error "$description: FAILED ($response, expected $expected_status)"
            log_message "ERROR" "$description failed with status $response"
            return 1
        fi
    else
        print_warning "$description: Cannot check - curl not available"
        return 1
    fi
}

check_service_health() {
    print_info "=== Watson Service Health Check ==="
    
    local failures=0
    
    # Main application health
    if ! check_http_endpoint "$BASE_URL/health/" 200 "Application Health"; then
        ((failures++))
    fi
    
    # Readiness check
    if ! check_http_endpoint "$BASE_URL/ready/" 200 "Application Readiness"; then
        ((failures++))
    fi
    
    # Admin interface (if enabled)
    if ! check_http_endpoint "$BASE_URL/admin/" 200 "Admin Interface"; then
        print_warning "Admin interface may be disabled or require authentication"
    fi
    
    return $failures
}

check_database_connection() {
    print_info "=== Database Connection Check ==="
    
    # Try to connect to database through Django
    if python manage.py check --database default >/dev/null 2>&1; then
        print_status "Database connection: OK"
        log_message "INFO" "Database connection successful"
        return 0
    else
        print_error "Database connection: FAILED"
        log_message "ERROR" "Database connection failed"
        return 1
    fi
}

check_static_files() {
    print_info "=== Static Files Check ==="
    
    local static_root=$(python -c "
import os
import django
from django.conf import settings
django.setup()
print(settings.STATIC_ROOT)
" 2>/dev/null)
    
    if [[ -d "$static_root" ]] && [[ -n "$(ls -A "$static_root" 2>/dev/null)" ]]; then
        print_status "Static files: OK"
        log_message "INFO" "Static files found in $static_root"
        return 0
    else
        print_error "Static files: MISSING or EMPTY"
        log_message "ERROR" "Static files missing in $static_root"
        return 1
    fi
}

check_disk_space() {
    print_info "=== Disk Space Check ==="
    
    local usage
    usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [[ $usage -lt 80 ]]; then
        print_status "Disk space: OK (${usage}% used)"
        return 0
    elif [[ $usage -lt 90 ]]; then
        print_warning "Disk space: WARNING (${usage}% used)"
        log_message "WARNING" "Disk space at ${usage}%"
        return 0
    else
        print_error "Disk space: CRITICAL (${usage}% used)"
        log_message "ERROR" "Disk space critically low at ${usage}%"
        return 1
    fi
}

check_memory_usage() {
    print_info "=== Memory Usage Check ==="
    
    if command -v free >/dev/null 2>&1; then
        local memory_usage
        memory_usage=$(free | grep Mem | awk '{printf "%.1f", ($3/$2) * 100.0}')
        
        if (( $(echo "$memory_usage < 80" | bc -l) )); then
            print_status "Memory usage: OK (${memory_usage}%)"
            return 0
        elif (( $(echo "$memory_usage < 90" | bc -l) )); then
            print_warning "Memory usage: WARNING (${memory_usage}%)"
            log_message "WARNING" "Memory usage at ${memory_usage}%"
            return 0
        else
            print_error "Memory usage: CRITICAL (${memory_usage}%)"
            log_message "ERROR" "Memory usage critically high at ${memory_usage}%"
            return 1
        fi
    else
        print_warning "Memory usage: Cannot check - free command not available"
        return 0
    fi
}

check_process_status() {
    print_info "=== Process Status Check ==="
    
    # Check if Django process is running (adjust based on your deployment)
    if pgrep -f "gunicorn.*watson" >/dev/null || pgrep -f "python.*manage.py.*runserver" >/dev/null; then
        print_status "Django process: Running"
        return 0
    else
        print_error "Django process: Not found"
        log_message "ERROR" "Django process not running"
        return 1
    fi
}

send_alert() {
    local subject="$1"
    local message="$2"
    
    if [[ -n $ALERT_EMAIL ]] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
        log_message "INFO" "Alert sent to $ALERT_EMAIL: $subject"
    else
        log_message "WARNING" "Cannot send alert - mail command not available or ALERT_EMAIL not set"
    fi
}

run_comprehensive_check() {
    echo ""
    echo "🏥 Watson Comprehensive Health Check"
    echo "===================================="
    echo ""
    
    local total_failures=0
    local start_time=$(date +%s)
    
    # Create log directory if needed
    mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
    
    log_message "INFO" "Starting comprehensive health check"
    
    # Run all checks
    check_service_health || ((total_failures += $?))
    echo ""
    
    check_database_connection || ((total_failures++))
    echo ""
    
    check_static_files || ((total_failures++))
    echo ""
    
    check_disk_space || ((total_failures++))
    echo ""
    
    check_memory_usage || ((total_failures++))
    echo ""
    
    check_process_status || ((total_failures++))
    echo ""
    
    # Summary
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo "📊 Health Check Summary"
    echo "======================"
    echo "Duration: ${duration}s"
    echo "Failures: $total_failures"
    echo ""
    
    if [[ $total_failures -eq 0 ]]; then
        print_status "All health checks passed!"
        log_message "INFO" "Health check completed successfully - all systems operational"
        return 0
    else
        print_error "Health check failed with $total_failures issue(s)"
        log_message "ERROR" "Health check failed with $total_failures issues"
        
        # Send alert for failures
        if [[ $total_failures -gt 0 ]]; then
            send_alert "Watson Health Check Failed" "Health check failed with $total_failures issues. Check logs at $LOG_FILE"
        fi
        
        return $total_failures
    fi
}

# Parse command line arguments
case "${1:-}" in
    "http")
        check_service_health
        ;;
    "database")
        check_database_connection
        ;;
    "static")
        check_static_files
        ;;
    "system")
        check_disk_space && check_memory_usage && check_process_status
        ;;
    *)
        run_comprehensive_check
        ;;
esac

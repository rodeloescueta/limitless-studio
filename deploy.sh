#!/bin/bash

###############################################################################
# Limitless Studio - Production Deployment Script
#
# This script handles deployment on VPS by:
# 1. Pulling latest code from GitHub
# 2. Backing up database
# 3. Rebuilding Docker containers
# 4. Running database migrations
# 5. Restarting services
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/rodeloescueta/limitless-studio.git"
APP_DIR="/opt/limitless-studio"
BACKUP_DIR="/opt/limitless-studio/backups"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    if ! command -v git &> /dev/null; then
        log_error "Git is not installed"
        exit 1
    fi

    if [ ! -f "$ENV_FILE" ]; then
        log_error "$ENV_FILE not found. Please create it from .env.production.example"
        exit 1
    fi

    log_info "Requirements check passed"
}

backup_database() {
    log_info "Creating database backup..."

    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"

    # Generate backup filename with timestamp
    BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"

    # Backup using docker exec
    docker compose -f "$COMPOSE_FILE" exec -T db pg_dump \
        -U "${POSTGRES_USER:-postgres}" \
        -d "${POSTGRES_DB:-limitless_studio}" \
        > "$BACKUP_FILE" 2>/dev/null || {
            log_warn "Database backup failed (database might not be running yet)"
            return 0
        }

    if [ -f "$BACKUP_FILE" ]; then
        # Compress backup
        gzip "$BACKUP_FILE"
        log_info "Database backup created: ${BACKUP_FILE}.gz"

        # Keep only last 7 days of backups
        find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete
        log_info "Cleaned up old backups (kept last 7 days)"
    fi
}

pull_latest_code() {
    log_info "Pulling latest code from GitHub..."

    # Stash any local changes
    git stash

    # Pull latest code
    git pull origin main

    log_info "Code updated successfully"
}

build_and_deploy() {
    log_info "Building and deploying containers..."

    # Build images
    docker compose -f "$COMPOSE_FILE" build --no-cache

    # Stop old containers
    docker compose -f "$COMPOSE_FILE" down

    # Start new containers
    docker compose -f "$COMPOSE_FILE" up -d

    log_info "Containers started successfully"
}

run_migrations() {
    log_info "Running database migrations..."

    # Wait for database to be ready
    sleep 5

    # Run migrations using Drizzle Kit push (code-first approach)
    docker compose -f "$COMPOSE_FILE" exec -T web npx drizzle-kit push || {
        log_warn "Migration command failed - check database connection"
    }

    log_info "Migrations completed"
}

check_health() {
    log_info "Checking application health..."

    # Wait for services to start
    sleep 10

    # Check if containers are running
    if docker compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_info "Containers are running"
    else
        log_error "Some containers failed to start"
        docker compose -f "$COMPOSE_FILE" ps
        exit 1
    fi

    # Check web service health
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_info "Application is responding"
    else
        log_warn "Application not responding yet (may still be starting)"
    fi
}

show_status() {
    log_info "Deployment completed successfully!"
    echo ""
    echo "Container status:"
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "Recent logs (last 20 lines):"
    docker compose -f "$COMPOSE_FILE" logs --tail=20
}

rollback() {
    log_error "Deployment failed! Rolling back..."

    # Pull previous commit
    git reset --hard HEAD~1

    # Rebuild with previous code
    docker compose -f "$COMPOSE_FILE" up -d --build

    log_info "Rollback completed"
    exit 1
}

# Main deployment flow
main() {
    log_info "Starting deployment process..."

    # Change to app directory
    cd "$APP_DIR" || exit 1

    # Run deployment steps
    check_requirements
    backup_database
    pull_latest_code
    build_and_deploy
    run_migrations
    check_health
    show_status
}

# Trap errors and rollback
trap rollback ERR

# Run main function
main

exit 0

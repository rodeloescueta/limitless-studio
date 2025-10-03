#!/bin/bash

###############################################################################
# Limitless Studio - Database Backup Script
#
# This script creates a backup of the PostgreSQL database and optionally
# uploads it to a remote location for disaster recovery.
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/opt/limitless-studio/backups"
COMPOSE_FILE="docker-compose.prod.yml"
RETENTION_DAYS=30

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-limitless_studio}"

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

create_backup() {
    log_info "Creating database backup..."

    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"

    # Generate backup filename with timestamp
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/db_backup_${TIMESTAMP}.sql"

    # Create backup using pg_dump
    docker compose -f "$COMPOSE_FILE" exec -T db pg_dump \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --clean \
        --if-exists \
        > "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        log_info "Database dumped to: $BACKUP_FILE"

        # Compress backup
        gzip "$BACKUP_FILE"
        BACKUP_FILE="${BACKUP_FILE}.gz"

        log_info "Backup compressed: $BACKUP_FILE"

        # Get file size
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log_info "Backup size: $SIZE"

        echo "$BACKUP_FILE"
    else
        log_error "Backup failed"
        exit 1
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."

    find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

    REMAINING=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" | wc -l)
    log_info "Remaining backups: $REMAINING"
}

list_backups() {
    log_info "Available backups:"
    echo ""

    if [ -d "$BACKUP_DIR" ]; then
        ls -lh "$BACKUP_DIR"/db_backup_*.sql.gz 2>/dev/null | awk '{print $9, "(" $5 ")"}'
    else
        log_warn "No backups found"
    fi
}

restore_backup() {
    local BACKUP_FILE=$1

    if [ -z "$BACKUP_FILE" ]; then
        log_error "Please specify a backup file to restore"
        list_backups
        exit 1
    fi

    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    log_warn "WARNING: This will overwrite the current database!"
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        log_info "Restore cancelled"
        exit 0
    fi

    log_info "Restoring database from: $BACKUP_FILE"

    # Decompress if needed
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$BACKUP_FILE" | docker compose -f "$COMPOSE_FILE" exec -T db psql \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB"
    else
        docker compose -f "$COMPOSE_FILE" exec -T db psql \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            < "$BACKUP_FILE"
    fi

    if [ $? -eq 0 ]; then
        log_info "Database restored successfully"
    else
        log_error "Restore failed"
        exit 1
    fi
}

show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  backup              Create a new backup (default)"
    echo "  list                List all available backups"
    echo "  restore <file>      Restore database from backup file"
    echo "  cleanup             Remove old backups"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 list"
    echo "  $0 restore /opt/limitless-studio/backups/db_backup_20250101_120000.sql.gz"
}

# Main execution
COMMAND=${1:-backup}

case "$COMMAND" in
    backup)
        create_backup
        cleanup_old_backups
        ;;
    list)
        list_backups
        ;;
    restore)
        restore_backup "$2"
        ;;
    cleanup)
        cleanup_old_backups
        ;;
    *)
        show_usage
        exit 1
        ;;
esac

exit 0

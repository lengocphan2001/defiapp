#!/bin/bash

# Smart Mall DApp Backup Script
# This script creates backups of the database and application files

set -e

# Configuration
APP_NAME="smart-mall-app"
APP_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
DB_NAME="defiapp"
DB_USER="defiapp_user"
DB_PASSWORD="your_secure_password_here"

# Create backup directory
mkdir -p $BACKUP_DIR

# Get current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create database backup
print_status "Creating database backup..."
mysqldump -u$DB_USER -p$DB_PASSWORD $DB_NAME > "$BACKUP_FILE.sql"

# Create application files backup
print_status "Creating application files backup..."
tar -czf "$BACKUP_FILE.tar.gz" -C $APP_DIR .

# Create environment backup
print_status "Creating environment backup..."
cp $APP_DIR/backend/config.env "$BACKUP_FILE.env"

# Set proper permissions
chmod 600 "$BACKUP_FILE.sql"
chmod 600 "$BACKUP_FILE.tar.gz"
chmod 600 "$BACKUP_FILE.env"

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -name "backup_*" -mtime +7 -delete

print_status "Backup completed successfully!"
print_status "Database backup: $BACKUP_FILE.sql"
print_status "Files backup: $BACKUP_FILE.tar.gz"
print_status "Environment backup: $BACKUP_FILE.env"

# Optional: Upload to cloud storage (uncomment and configure as needed)
# print_status "Uploading backup to cloud storage..."
# aws s3 cp "$BACKUP_FILE.sql" s3://your-bucket/backups/
# aws s3 cp "$BACKUP_FILE.tar.gz" s3://your-bucket/backups/ 
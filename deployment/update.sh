#!/bin/bash

# Smart Mall DApp Update Script
# This script updates the application without full redeployment

set -e

# Configuration
APP_NAME="smart-mall-app"
APP_DIR="/var/www/$APP_NAME"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

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

# Navigate to app directory
cd $APP_DIR

# Pull latest changes
print_status "Pulling latest changes from repository..."
git pull origin main

# Update backend
print_status "Updating backend..."
cd $BACKEND_DIR
npm install --production

# Restart backend
print_status "Restarting backend..."
pm2 restart smart-mall-backend

# Update frontend
print_status "Updating frontend..."
cd $FRONTEND_DIR
npm install
npm run build

# Copy new build
print_status "Copying new frontend build..."
cp -r build/* /var/www/smart-mall-app/build/

# Reload nginx
print_status "Reloading Nginx..."
systemctl reload nginx

print_status "Update completed successfully!"
print_status "Backend logs: pm2 logs smart-mall-backend" 
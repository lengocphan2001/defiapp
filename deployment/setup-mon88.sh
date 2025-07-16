#!/bin/bash

# Smart Mall DApp Setup for mon88.click
# This script configures the deployment for your specific domain

set -e

# Configuration
DOMAIN="mon88.click"
EMAIL="admin@mon88.click"
APP_NAME="smart-mall-app"
APP_DIR="/var/www/$APP_NAME"

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

print_status "Setting up Smart Mall DApp for mon88.click..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root or with sudo"
    exit 1
fi

# Update nginx configuration
print_status "Updating nginx configuration for mon88.click..."
sed -i "s/coincexbot.com/$DOMAIN/g" deployment/nginx.conf
sed -i "s/coincexbot.com/$DOMAIN/g" deployment/nginx-no-ssl.conf

# Update deployment script
print_status "Updating deployment script..."
sed -i "s/coincexbot.com/$DOMAIN/g" deployment/deploy.sh
sed -i "s/admin@coincexbot.com/$EMAIL/g" deployment/deploy.sh

# Create production environment template
print_status "Creating production environment template..."
cat > backend/config.prod.env << EOF
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=defiapp
DB_PORT=3306

# JWT Configuration
JWT_SECRET=CHANGE_THIS_SECRET
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN
EOF

print_status "Configuration completed!"
print_warning "Before deploying, please:"
print_warning "1. Update the database password in backend/config.prod.env"
print_warning "2. Generate a secure JWT secret"
print_warning "3. Point your domain DNS to your VPS IP address"
print_warning "4. Run: chmod +x deployment/deploy.sh"
print_warning "5. Run: sudo ./deployment/deploy.sh"

print_status "Your app will be available at:"
print_status "  Main App: https://$DOMAIN"
print_status "  Admin Panel: https://$DOMAIN/admin"
print_status "  API Health: https://$DOMAIN/health" 
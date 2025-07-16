#!/bin/bash

# SSL Certificate Fix Script for mon88.click
# This script fixes common SSL certificate issues

set -e

DOMAIN="mon88.click"
EMAIL="lengocphan503@gmail.com"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Fixing SSL certificate for $DOMAIN..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root or with sudo"
    exit 1
fi

# Step 1: Check current status
print_status "Checking current SSL status..."
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    print_status "SSL certificate exists"
    sudo certbot certificates
else
    print_warning "SSL certificate does not exist"
fi

# Step 2: Check nginx configuration
print_status "Checking nginx configuration..."
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors"
    print_status "Fixing nginx configuration..."
    
    # Use non-SSL config temporarily
    sudo cp /var/www/smart-mall-app/deployment/nginx-no-ssl.conf /etc/nginx/sites-available/smart-mall-app
    sudo nginx -t
fi

# Step 3: Stop nginx
print_status "Stopping nginx..."
sudo systemctl stop nginx

# Step 4: Remove existing certificates if they exist
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    print_status "Removing existing certificates..."
    sudo certbot delete --cert-name $DOMAIN --non-interactive
fi

# Step 5: Check DNS resolution
print_status "Checking DNS resolution..."
VPS_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(nslookup $DOMAIN | grep -A1 "Name:" | tail -1 | awk '{print $2}')

if [ "$VPS_IP" = "$DOMAIN_IP" ]; then
    print_status "DNS is correctly configured"
else
    print_warning "DNS may not be properly configured"
    print_warning "VPS IP: $VPS_IP"
    print_warning "Domain IP: $DOMAIN_IP"
fi

# Step 6: Install SSL certificate
print_status "Installing SSL certificate..."
sudo certbot certonly --standalone \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive \
    --force-renewal

# Step 7: Update nginx configuration
print_status "Updating nginx configuration..."
sudo cp /var/www/smart-mall-app/deployment/nginx.conf /etc/nginx/sites-available/smart-mall-app

# Step 8: Test and start nginx
print_status "Testing nginx configuration..."
if sudo nginx -t; then
    print_status "Starting nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Step 9: Update backend CORS
print_status "Updating backend CORS configuration..."
cd /var/www/smart-mall-app/backend
sed -i 's|CORS_ORIGIN=http://mon88.click|CORS_ORIGIN=https://mon88.click|' config.env

# Step 10: Restart backend
print_status "Restarting backend..."
pm2 restart smart-mall-backend

# Step 11: Test SSL
print_status "Testing SSL certificate..."
sleep 5

if curl -s -I https://$DOMAIN | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
    print_status "SSL certificate is working correctly!"
    print_status "Your app is now accessible at:"
    print_status "  Main App: https://$DOMAIN"
    print_status "  Admin Panel: https://$DOMAIN/admin"
    print_status "  API Health: https://$DOMAIN/health"
else
    print_warning "SSL test failed. Please check manually:"
    print_warning "  curl -I https://$DOMAIN"
fi

# Step 12: Show certificate info
print_status "SSL Certificate Information:"
sudo certbot certificates

print_status "SSL fix completed!"
print_warning "If you still have issues, check:"
print_warning "1. DNS propagation (can take up to 48 hours)"
print_warning "2. Firewall settings (ports 80 and 443)"
print_warning "3. Domain registrar DNS configuration" 
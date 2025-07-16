#!/bin/bash

# Smart Mall DApp Deployment Script
# Make sure to run this script as root or with sudo

set -e  # Exit on any error

# Configuration
APP_NAME="smart-mall-app"
APP_DIR="/var/www/$APP_NAME"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
DOMAIN="coincexbot.com"
DB_NAME="defiapp"
DB_USER="defiapp_user"
DB_PASSWORD="your_secure_password_here"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y curl wget git nginx mysql-server mysql-client certbot python3-certbot-nginx nodejs npm

# Install Node.js 18.x (if not already installed)
if ! command -v node &> /dev/null || [[ $(node --version | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
    print_status "Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

# Install PM2 globally
print_status "Installing PM2..."
npm install -g pm2

# Create application directory
print_status "Creating application directory..."
mkdir -p $APP_DIR
mkdir -p /var/log/pm2

# Clone or update repository (replace with your actual repository URL)
if [ ! -d "$APP_DIR/.git" ]; then
    print_status "Cloning repository..."
    git clone https://github.com/yourusername/smart-mall-app.git $APP_DIR
else
    print_status "Updating repository..."
    cd $APP_DIR
    git pull origin main
fi

# Setup MySQL
print_status "Setting up MySQL..."
mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Setup backend
print_status "Setting up backend..."
cd $BACKEND_DIR

# Install dependencies
npm install --production

# Create production environment file
cat > $BACKEND_DIR/config.env << EOF
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_PORT=3306

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN
EOF

# Initialize database
print_status "Initializing database..."
node -e "
const { initDatabase } = require('./config/database');
initDatabase().then(() => {
    console.log('Database initialized successfully');
    process.exit(0);
}).catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
});
"

# Create admin user
print_status "Creating admin user..."
cd $BACKEND_DIR/scripts
node createAdmin.js

# Setup frontend
print_status "Setting up frontend..."
cd $FRONTEND_DIR

# Install dependencies
npm install

# Build for production
print_status "Building frontend for production..."
npm run build

# Copy build to nginx directory
print_status "Copying frontend build to nginx directory..."
cp -r build/* /var/www/smart-mall-app/build/

# Setup Nginx
print_status "Setting up Nginx..."

# Copy nginx configuration
cp $APP_DIR/deployment/nginx.conf /etc/nginx/sites-available/$APP_NAME

# Enable site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/

# Remove default nginx site
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Setup SSL certificate
print_status "Setting up SSL certificate..."
certbot --nginx -d coincexbot.com -d www.coincexbot.com --non-interactive --agree-tos --email admin@coincexbot.com

# Setup PM2
print_status "Setting up PM2..."
cd $APP_DIR
cp deployment/ecosystem.config.js .

# Start backend with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Setup firewall
print_status "Setting up firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Set proper permissions
print_status "Setting proper permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Restart services
print_status "Restarting services..."
systemctl restart nginx
systemctl enable nginx

# Create deployment log
echo "Deployment completed at $(date)" > $APP_DIR/deployment.log

print_status "Deployment completed successfully!"
print_status "Your Smart Mall DApp is now running at: https://$DOMAIN"
print_status "Admin panel: https://$DOMAIN/admin"
print_status "Backend API: https://$DOMAIN/api"
print_status "Health check: https://$DOMAIN/health"

print_warning "Don't forget to:"
print_warning "1. Update the admin password after first login"
print_warning "2. Configure your domain DNS to point to this server"
print_warning "3. Set up regular backups"
print_warning "4. Monitor logs: pm2 logs smart-mall-backend" 
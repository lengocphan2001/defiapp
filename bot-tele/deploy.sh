#!/bin/bash

# Smart Mall DApp Telegram Bot Deployment Script
# Make sure to run this script as root or with sudo

set -e  # Exit on any error

# Configuration
BOT_NAME="smart-mall-bot"
BOT_DIR="/var/www/$BOT_NAME"
DOMAIN="mon88.click"

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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root or with sudo"
    exit 1
fi

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt install -y nodejs
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
fi

# Create bot directory
print_status "Creating bot directory..."
mkdir -p $BOT_DIR
mkdir -p /var/log/pm2

# Copy bot files
print_status "Copying bot files..."
cp -r . $BOT_DIR/
cd $BOT_DIR

# Install dependencies
print_status "Installing bot dependencies..."
npm install --production

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem file..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: '$BOT_NAME',
      script: './bot.js',
      cwd: '$BOT_DIR',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pm2/$BOT_NAME-error.log',
      out_file: '/var/log/pm2/$BOT_NAME-out.log',
      log_file: '/var/log/pm2/$BOT_NAME-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000
    }
  ]
};
EOF

# Set permissions
print_status "Setting permissions..."
chown -R $SUDO_USER:$SUDO_USER $BOT_DIR
chmod +x $BOT_DIR/bot.js

# Start bot with PM2
print_status "Starting bot with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

print_status "Bot deployment completed!"
print_status "Bot is running with PM2"
print_status "Logs are available at: /var/log/pm2/"

# Show bot status
print_status "Bot status:"
pm2 status

print_status "To view logs:"
print_status "  pm2 logs $BOT_NAME"
print_status "  pm2 logs $BOT_NAME --lines 50"

print_status "To restart bot:"
print_status "  pm2 restart $BOT_NAME"

print_status "To stop bot:"
print_status "  pm2 stop $BOT_NAME"

print_warning "Make sure your bot token is correct in bot.js"
print_warning "Test the bot by sending /start to your bot on Telegram" 
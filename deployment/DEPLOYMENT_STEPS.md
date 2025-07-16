# Step-by-Step Deployment Guide for coincexbot.com

## Prerequisites
- VPS with Ubuntu 20.04+ 
- Domain coincexbot.com pointing to your VPS IP
- Root or sudo access

## Step 1: Initial Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git nginx mysql-server mysql-client certbot python3-certbot-nginx nodejs npm

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
```

## Step 2: Clone and Setup Application

```bash
# Clone your repository (replace with your actual repo URL)
sudo git clone https://github.com/yourusername/smart-mall-app.git /var/www/smart-mall-app
cd /var/www/smart-mall-app

# Set permissions
sudo chown -R $USER:$USER /var/www/smart-mall-app
```

## Step 3: Setup MySQL

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -e "CREATE DATABASE IF NOT EXISTS defiapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'defiapp_user'@'localhost' IDENTIFIED BY 'your_secure_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON defiapp.* TO 'defiapp_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

## Step 4: Setup Backend

```bash
cd /var/www/smart-mall-app/backend

# Install dependencies
npm install --production

# Create environment file
cat > config.env << EOF
PORT=3001
NODE_ENV=production
DB_HOST=localhost
DB_USER=defiapp_user
DB_PASSWORD=your_secure_password
DB_NAME=defiapp
DB_PORT=3306
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://coincexbot.com
EOF

# Initialize database
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
cd scripts
node createAdmin.js
```

## Step 5: Setup Frontend

```bash
cd /var/www/smart-mall-app

# Install dependencies
npm install

# Build for production
npm run build

# Create nginx directory
sudo mkdir -p /var/www/smart-mall-app/build
sudo cp -r build/* /var/www/smart-mall-app/build/
```

## Step 6: Configure Nginx (Without SSL First)

```bash
# Copy nginx configuration without SSL
sudo cp deployment/nginx-no-ssl.conf /etc/nginx/sites-available/smart-mall-app

# Enable site
sudo ln -sf /etc/nginx/sites-available/smart-mall-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 7: Setup PM2

```bash
cd /var/www/smart-mall-app

# Copy PM2 configuration
cp deployment/ecosystem.config.js .

# Start application
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## Step 8: Setup Firewall

```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## Step 9: Test HTTP Access

At this point, your app should be accessible via HTTP:

- **Main App**: http://coincexbot.com
- **Admin Panel**: http://coincexbot.com/admin
- **API Health**: http://coincexbot.com/health

## Step 10: Setup SSL Certificate

```bash
# Install SSL certificate
sudo certbot --nginx -d coincexbot.com -d www.coincexbot.com --non-interactive --agree-tos --email admin@coincexbot.com
```

This will automatically:
- Generate SSL certificates
- Update nginx configuration to use HTTPS
- Set up automatic redirects from HTTP to HTTPS

## Step 11: Update CORS for HTTPS

After SSL is installed, update the backend CORS:

```bash
cd /var/www/smart-mall-app/backend

# Update CORS origin to HTTPS
sed -i 's|CORS_ORIGIN=http://coincexbot.com|CORS_ORIGIN=https://coincexbot.com|' config.env

# Restart backend
pm2 restart smart-mall-backend
```

## Step 12: Final Verification

Check these URLs:
- **Main App**: https://coincexbot.com
- **Admin Panel**: https://coincexbot.com/admin
- **API Health**: https://coincexbot.com/health

## Troubleshooting

### If nginx fails to start:
```bash
# Check nginx configuration
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check nginx status
sudo systemctl status nginx
```

### If backend fails to start:
```bash
# Check PM2 status
pm2 status

# Check PM2 logs
pm2 logs smart-mall-backend

# Restart backend
pm2 restart smart-mall-backend
```

### If SSL certificate fails:
```bash
# Check if domain resolves
nslookup coincexbot.com

# Check if port 80 is accessible
curl -I http://coincexbot.com

# Manually run certbot
sudo certbot --nginx -d coincexbot.com -d www.coincexbot.com --email admin@coincexbot.com
```

### If database connection fails:
```bash
# Check MySQL status
sudo systemctl status mysql

# Test database connection
mysql -u defiapp_user -p defiapp

# Check database exists
mysql -e "SHOW DATABASES;"
```

## Post-Deployment

### Update Admin Password
1. Login to https://coincexbot.com/admin
2. Username: `admin`
3. Password: `admin123`
4. Change password immediately

### Setup Monitoring
```bash
# Monitor application
pm2 monit

# Monitor logs
pm2 logs smart-mall-backend

# Monitor system
htop
```

### Setup Backups
```bash
# Make backup script executable
chmod +x deployment/backup.sh

# Create backup
./deployment/backup.sh

# Setup automatic backups (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /var/www/smart-mall-app/deployment/backup.sh
```

## Security Checklist

- [ ] Admin password changed
- [ ] Firewall configured
- [ ] SSL certificate installed
- [ ] Database secured
- [ ] Regular backups scheduled
- [ ] Monitoring set up

## Maintenance

### Update Application
```bash
cd /var/www/smart-mall-app
chmod +x deployment/update.sh
./deployment/update.sh
```

### Renew SSL Certificate
```bash
# Test renewal
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew
```

### Monitor Logs
```bash
# Application logs
pm2 logs smart-mall-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
``` 
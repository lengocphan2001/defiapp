# Smart Mall DApp - VPS Deployment Guide

## Overview

This guide will help you deploy your Smart Mall DApp to a VPS using Nginx, MySQL, and PM2. The deployment includes SSL certificates, security configurations, and automated deployment scripts.

## Prerequisites

### VPS Requirements
- **OS**: Ubuntu 20.04 LTS or later
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB
- **CPU**: 2 cores minimum
- **Domain**: A registered domain name pointing to your VPS

### Domain Setup
1. Point your domain's A record to your VPS IP address
2. Wait for DNS propagation (can take up to 24 hours)

## Quick Deployment

### 1. Initial Server Setup

Connect to your VPS and run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Create deployment user (optional but recommended)
sudo adduser deploy
sudo usermod -aG sudo deploy
```

### 2. Clone Repository

```bash
# Clone your repository
git clone https://github.com/yourusername/smart-mall-app.git /var/www/smart-mall-app
cd /var/www/smart-mall-app
```

### 3. Configure Deployment Script

Edit the deployment script with your actual values:

```bash
nano deployment/deploy.sh
```

Update these variables:
- `DOMAIN="your-domain.com"` - Your actual domain
- `DB_PASSWORD="your_secure_password_here"` - Strong database password
- Repository URL in the git clone command

### 4. Run Deployment

```bash
# Make script executable
chmod +x deployment/deploy.sh

# Run deployment (as root or with sudo)
sudo ./deployment/deploy.sh
```

## Manual Deployment Steps

If you prefer to deploy manually, follow these steps:

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git nginx mysql-server mysql-client certbot python3-certbot-nginx

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
```

### 2. Setup MySQL

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -e "CREATE DATABASE defiapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'defiapp_user'@'localhost' IDENTIFIED BY 'your_secure_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON defiapp.* TO 'defiapp_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

### 3. Setup Backend

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
CORS_ORIGIN=https://your-domain.com
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

### 4. Setup Frontend

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

### 5. Configure Nginx

```bash
# Copy nginx configuration
sudo cp deployment/nginx.conf /etc/nginx/sites-available/smart-mall-app

# Replace domain placeholder
sudo sed -i "s/your-domain.com/your-actual-domain.com/g" /etc/nginx/sites-available/smart-mall-app

# Enable site
sudo ln -sf /etc/nginx/sites-available/smart-mall-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. Setup SSL Certificate

```bash
# Install SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com --non-interactive --agree-tos --email your-email@example.com
```

### 7. Setup PM2

```bash
cd /var/www/smart-mall-app

# Copy PM2 configuration
cp deployment/ecosystem.config.js .

# Start application
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 8. Setup Firewall

```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

### 9. Set Permissions

```bash
sudo chown -R www-data:www-data /var/www/smart-mall-app
sudo chmod -R 755 /var/www/smart-mall-app
```

## Post-Deployment

### 1. Verify Deployment

Check these URLs:
- **Main app**: `https://your-domain.com`
- **Admin panel**: `https://your-domain.com/admin`
- **API health**: `https://your-domain.com/health`

### 2. Update Admin Password

1. Login to admin panel with default credentials:
   - Username: `admin`
   - Password: `admin123`
2. Change the password immediately

### 3. Monitor Application

```bash
# View PM2 logs
pm2 logs smart-mall-backend

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check application status
pm2 status
```

## Maintenance

### Updating Application

Use the update script:

```bash
cd /var/www/smart-mall-app
chmod +x deployment/update.sh
./deployment/update.sh
```

### Creating Backups

```bash
cd /var/www/smart-mall-app
chmod +x deployment/backup.sh
./deployment/backup.sh
```

### Setting Up Automatic Backups

Add to crontab:

```bash
# Edit crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /var/www/smart-mall-app/deployment/backup.sh
```

## Troubleshooting

### Common Issues

1. **Nginx 502 Bad Gateway**
   ```bash
   # Check if backend is running
   pm2 status
   
   # Restart backend
   pm2 restart smart-mall-backend
   
   # Check logs
   pm2 logs smart-mall-backend
   ```

2. **Database Connection Issues**
   ```bash
   # Check MySQL status
   sudo systemctl status mysql
   
   # Test database connection
   mysql -u defiapp_user -p defiapp
   ```

3. **SSL Certificate Issues**
   ```bash
   # Renew SSL certificate
   sudo certbot renew
   
   # Check certificate status
   sudo certbot certificates
   ```

4. **Permission Issues**
   ```bash
   # Fix permissions
   sudo chown -R www-data:www-data /var/www/smart-mall-app
   sudo chmod -R 755 /var/www/smart-mall-app
   ```

### Log Locations

- **PM2 logs**: `/var/log/pm2/`
- **Nginx logs**: `/var/log/nginx/`
- **MySQL logs**: `/var/log/mysql/`
- **System logs**: `/var/log/syslog`

## Security Considerations

### 1. Firewall Configuration
- Only allow necessary ports (22, 80, 443)
- Consider using fail2ban for SSH protection

### 2. Database Security
- Use strong passwords
- Limit database user privileges
- Regular backups

### 3. Application Security
- Keep dependencies updated
- Use environment variables for secrets
- Regular security audits

### 4. SSL/TLS
- Automatic certificate renewal
- Strong cipher configuration
- Security headers

## Performance Optimization

### 1. Nginx Optimization
- Enable gzip compression
- Configure caching headers
- Optimize worker processes

### 2. Database Optimization
- Regular maintenance
- Proper indexing
- Query optimization

### 3. Application Optimization
- PM2 clustering
- Memory monitoring
- Load balancing (if needed)

## Monitoring

### 1. Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# System resources
htop
df -h
free -h
```

### 2. Log Monitoring
```bash
# Real-time log monitoring
tail -f /var/log/nginx/access.log
pm2 logs smart-mall-backend --lines 100
```

### 3. Health Checks
- Set up monitoring for `/health` endpoint
- Configure alerts for downtime
- Monitor SSL certificate expiration

## Backup and Recovery

### 1. Database Backup
```bash
# Manual backup
mysqldump -u defiapp_user -p defiapp > backup.sql

# Restore backup
mysql -u defiapp_user -p defiapp < backup.sql
```

### 2. Application Backup
```bash
# Backup application files
tar -czf app_backup.tar.gz /var/www/smart-mall-app

# Backup environment
cp /var/www/smart-mall-app/backend/config.env backup.env
```

### 3. Disaster Recovery
1. Restore database from backup
2. Restore application files
3. Update configuration if needed
4. Restart services

## Support

For deployment issues:
1. Check logs for error messages
2. Verify all services are running
3. Test each component individually
4. Review security configurations

## Next Steps

After successful deployment:
1. Set up monitoring and alerting
2. Configure automated backups
3. Implement CI/CD pipeline
4. Set up staging environment
5. Plan for scaling 
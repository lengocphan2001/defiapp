# DNS Setup Guide for mon88.click

## Overview

This guide will help you configure your domain `mon88.click` to point to your VPS for the Smart Mall DApp deployment.

## Prerequisites

- Access to your domain registrar's DNS management panel
- Your VPS IP address
- Domain: `mon88.click`

## DNS Configuration

### 1. Get Your VPS IP Address

First, get your VPS IP address:

```bash
# On your VPS, run:
curl ifconfig.me
# or
wget -qO- ifconfig.me
```

### 2. Configure DNS Records

Log into your domain registrar's control panel and add these DNS records:

#### A Records (IPv4)
```
Type: A
Name: @ (or leave empty)
Value: YOUR_VPS_IP_ADDRESS
TTL: 300 (or default)

Type: A
Name: www
Value: YOUR_VPS_IP_ADDRESS
TTL: 300 (or default)
```

#### CNAME Records (Optional)
```
Type: CNAME
Name: api
Value: mon88.click
TTL: 300

Type: CNAME
Name: admin
Value: mon88.click
TTL: 300
```

### 3. Example DNS Configuration

If your VPS IP is `123.456.789.012`, your DNS records should look like:

```
A     @     123.456.789.012    300
A     www   123.456.789.012    300
CNAME api   mon88.click        300
CNAME admin mon88.click        300
```

## Popular Domain Registrars

### GoDaddy
1. Log into GoDaddy account
2. Go to "My Products" → "DNS"
3. Find mon88.click and click "DNS"
4. Add the A records as shown above

### Namecheap
1. Log into Namecheap account
2. Go to "Domain List" → "Manage"
3. Click "Advanced DNS"
4. Add the A records as shown above

### Cloudflare
1. Log into Cloudflare account
2. Select mon88.click
3. Go to "DNS" tab
4. Add the A records as shown above
5. Make sure "Proxy status" is set to "DNS only" (gray cloud)

### Google Domains
1. Log into Google Domains
2. Select mon88.click
3. Go to "DNS" section
4. Add the A records as shown above

## Verify DNS Configuration

### 1. Check DNS Propagation

After adding the records, verify they're working:

```bash
# Check A record
nslookup mon88.click
nslookup www.mon88.click

# Check with dig
dig mon88.click
dig www.mon88.click
```

### 2. Test Domain Resolution

```bash
# Test from your local machine
ping mon88.click
ping www.mon88.click

# Test from VPS
ping mon88.click
```

### 3. Online DNS Checkers

Use these online tools to verify DNS propagation:
- [whatsmydns.net](https://whatsmydns.net)
- [dnschecker.org](https://dnschecker.org)
- [mxtoolbox.com](https://mxtoolbox.com)

## SSL Certificate Setup

Once DNS is configured, the deployment script will automatically:
1. Install Let's Encrypt SSL certificate
2. Configure HTTPS for both `mon88.click` and `www.mon88.click`
3. Set up automatic certificate renewal

## Deployment URLs

After successful deployment, your app will be available at:

- **Main Application**: https://mon88.click
- **Admin Panel**: https://mon88.click/admin
- **API Health Check**: https://mon88.click/health
- **API Endpoints**: https://mon88.click/api/*

## Troubleshooting

### DNS Not Propagating
- DNS changes can take up to 48 hours to propagate globally
- Usually takes 15-30 minutes for most users
- Use online DNS checkers to verify propagation

### SSL Certificate Issues
- Make sure DNS is properly configured before running deployment
- Ensure ports 80 and 443 are open on your VPS
- Check that your domain registrar allows external DNS management

### Common Issues
1. **Wrong IP Address**: Double-check your VPS IP
2. **TTL Too High**: Lower TTL for faster propagation
3. **Caching**: Clear DNS cache on your local machine
4. **Firewall**: Ensure VPS firewall allows HTTP/HTTPS traffic

## Security Considerations

### DNS Security
- Enable DNSSEC if your registrar supports it
- Use strong passwords for domain registrar account
- Enable two-factor authentication
- Monitor DNS changes

### SSL Security
- Let's Encrypt certificates auto-renew every 90 days
- Monitor certificate expiration
- Use security headers (configured in nginx)

## Monitoring

### DNS Monitoring
```bash
# Check DNS resolution
dig +short mon88.click
dig +short www.mon88.click

# Monitor SSL certificate
openssl s_client -connect mon88.click:443 -servername mon88.click
```

### Health Checks
- Set up monitoring for https://mon88.click/health
- Monitor SSL certificate expiration
- Check DNS propagation regularly

## Next Steps

After DNS configuration:
1. Run the deployment script on your VPS
2. Verify the application is accessible
3. Test SSL certificate installation
4. Set up monitoring and alerts
5. Configure backups

## Support

If you encounter issues:
1. Check DNS propagation with online tools
2. Verify VPS firewall settings
3. Check nginx and PM2 logs
4. Ensure all ports are open (22, 80, 443) 
# DNS Setup Guide for coincexbot.com

## Overview

This guide will help you configure your domain `coincexbot.com` to point to your VPS for the Smart Mall DApp deployment.

## Prerequisites

- Access to your domain registrar's DNS management panel
- Your VPS IP address
- Domain: `coincexbot.com`

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
Value: coincexbot.com
TTL: 300

Type: CNAME
Name: admin
Value: coincexbot.com
TTL: 300
```

### 3. Example DNS Configuration

If your VPS IP is `123.456.789.012`, your DNS records should look like:

```
A     @     123.456.789.012    300
A     www   123.456.789.012    300
CNAME api   coincexbot.com     300
CNAME admin coincexbot.com     300
```

## Popular Domain Registrars

### GoDaddy
1. Log into GoDaddy account
2. Go to "My Products" → "DNS"
3. Find coincexbot.com and click "DNS"
4. Add the A records as shown above

### Namecheap
1. Log into Namecheap account
2. Go to "Domain List" → "Manage"
3. Click "Advanced DNS"
4. Add the A records as shown above

### Cloudflare
1. Log into Cloudflare account
2. Select coincexbot.com
3. Go to "DNS" tab
4. Add the A records as shown above
5. Make sure "Proxy status" is set to "DNS only" (gray cloud)

### Google Domains
1. Log into Google Domains
2. Select coincexbot.com
3. Go to "DNS" section
4. Add the A records as shown above

## Verify DNS Configuration

### 1. Check DNS Propagation

After adding the records, verify they're working:

```bash
# Check A record
nslookup coincexbot.com
nslookup www.coincexbot.com

# Check with dig
dig coincexbot.com
dig www.coincexbot.com
```

### 2. Test Domain Resolution

```bash
# Test from your local machine
ping coincexbot.com
ping www.coincexbot.com

# Test from VPS
ping coincexbot.com
```

### 3. Online DNS Checkers

Use these online tools to verify DNS propagation:
- [whatsmydns.net](https://whatsmydns.net)
- [dnschecker.org](https://dnschecker.org)
- [mxtoolbox.com](https://mxtoolbox.com)

## SSL Certificate Setup

Once DNS is configured, the deployment script will automatically:
1. Install Let's Encrypt SSL certificate
2. Configure HTTPS for both `coincexbot.com` and `www.coincexbot.com`
3. Set up automatic certificate renewal

## Deployment URLs

After successful deployment, your app will be available at:

- **Main Application**: https://coincexbot.com
- **Admin Panel**: https://coincexbot.com/admin
- **API Health Check**: https://coincexbot.com/health
- **API Endpoints**: https://coincexbot.com/api/*

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
dig +short coincexbot.com
dig +short www.coincexbot.com

# Monitor SSL certificate
openssl s_client -connect coincexbot.com:443 -servername coincexbot.com
```

### Health Checks
- Set up monitoring for https://coincexbot.com/health
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
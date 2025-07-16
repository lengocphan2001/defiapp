# Smart Mall DApp Telegram Bot

A Telegram bot for the Smart Mall DApp that provides easy access to wallet management, balance checking, and transaction history.

## 🚀 Features

- **🔐 User Authentication** - Login and register through the DApp
- **💰 Balance Checking** - View SMP and USDT balances
- **📊 Request Management** - View deposit/withdrawal requests
- **👑 Admin Panel** - Admin-only features for user management
- **🌐 Web App Integration** - Direct links to Smart Mall DApp
- **📱 Mobile Friendly** - Optimized for mobile Telegram usage

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Telegram Bot Token (from @BotFather)
- Smart Mall DApp backend running

## 🛠️ Installation

### 1. Create Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Install Dependencies

```bash
cd bot-tele
npm install
```

### 3. Configure Bot

Update the bot token in `bot.js`:

```javascript
const token = 'YOUR_BOT_TOKEN_HERE';
```

### 4. Update App URLs

Make sure the URLs in `bot.js` match your deployment:

```javascript
const APP_URL = 'https://mon88.click';
const API_URL = 'https://mon88.click/api';
```

## 🚀 Running the Bot

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Using PM2 (Recommended for Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start the bot
pm2 start bot.js --name "smart-mall-bot"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## 🤖 Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot and show main menu |
| `/login` | Login to your Smart Mall account |
| `/register` | Create a new Smart Mall account |
| `/balance` | Check your SMP and USDT balance |
| `/requests` | View your deposit/withdrawal requests |
| `/admin` | Access admin panel (admin only) |
| `/help` | Show help and available commands |

## 📱 Bot Features

### Main Menu
- **Open Smart Mall DApp** - Direct link to the web app
- **Login/Register** - Account management
- **Check Balance** - View current balances
- **My Requests** - Transaction history

### Balance Checking
- SMP Balance display
- USDT Balance display
- Wallet address information
- Quick wallet update option

### Request Management
- View recent requests (last 5)
- Status indicators (pending, approved, rejected)
- Amount and date information
- Link to full request history

### Admin Features
- Admin panel access
- Quick statistics
- User management
- Request management

## 🔧 Configuration

### Environment Variables

You can use environment variables for configuration:

```bash
# Create .env file
BOT_TOKEN=your_bot_token_here
APP_URL=https://mon88.click
API_URL=https://mon88.click/api
NODE_ENV=production
```

### API Integration

The bot integrates with your Smart Mall DApp backend API:

- **Authentication**: `/api/auth/login`, `/api/auth/register`
- **User Data**: `/api/auth/me`
- **Requests**: `/api/requests`
- **Admin**: `/api/users` (admin only)

## 🚀 Deployment

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Update bot token in `bot.js`
4. Run: `npm run dev`

### VPS Deployment

1. Upload bot files to your VPS
2. Run the deployment script:

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

3. The script will:
   - Install Node.js and PM2
   - Set up the bot directory
   - Install dependencies
   - Start the bot with PM2
   - Configure auto-restart

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

CMD ["node", "bot.js"]
```

## 📊 Monitoring

### PM2 Commands

```bash
# View bot status
pm2 status

# View logs
pm2 logs smart-mall-bot

# Restart bot
pm2 restart smart-mall-bot

# Stop bot
pm2 stop smart-mall-bot

# Delete bot
pm2 delete smart-mall-bot
```

### Log Files

Logs are stored in `/var/log/pm2/`:
- `smart-mall-bot-error.log` - Error logs
- `smart-mall-bot-out.log` - Output logs
- `smart-mall-bot-combined.log` - Combined logs

## 🔒 Security

- Bot token should be kept secure
- API requests use HTTPS
- User sessions are managed securely
- Admin features require proper authentication

## 🐛 Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check if bot is running: `pm2 status`
   - Check logs: `pm2 logs smart-mall-bot`
   - Verify bot token is correct

2. **API connection errors**
   - Check if backend is running
   - Verify API_URL is correct
   - Check CORS configuration

3. **Authentication issues**
   - Ensure user is logged in through DApp
   - Check token validity
   - Verify API endpoints

### Debug Mode

Enable debug logging by setting `NODE_ENV=development`:

```bash
NODE_ENV=development pm2 restart smart-mall-bot
```

## 📝 API Endpoints

The bot uses these API endpoints:

- `GET /api/auth/me` - Get current user info
- `GET /api/requests` - Get user requests
- `GET /api/users` - Get all users (admin)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Check the logs for errors
- Verify configuration settings
- Contact the development team
- Open an issue on GitHub

## 🔄 Updates

To update the bot:

1. Pull latest changes
2. Install new dependencies: `npm install`
3. Restart the bot: `pm2 restart smart-mall-bot`
4. Check logs for any errors

---

**Note**: Make sure your Smart Mall DApp backend is running and accessible before using the bot. 
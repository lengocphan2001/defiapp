const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Configuration
const token = '7167895247:AAEFrSwFBaabDoGqicgaMe7Ins77tWgtGXc';
const bot = new TelegramBot(token, { polling: true });

// Your deployed app URL and API
const APP_URL = 'https://mon88.click';
const API_URL = 'https://mon88.click/api';

// Store user sessions
const userSessions = new Map();

// API helper functions
const apiRequest = async (endpoint, method = 'GET', data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Handle /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;
  
  // Store user info
  userSessions.set(chatId, {
    telegramId: chatId,
    username: username,
    isAuthenticated: false,
    token: null
  });

  const welcomeMessage = `
🚀 Welcome to Smart Mall DApp!

This is your gateway to the Smart Mall ecosystem. 

Features:
• 💰 Wallet Management
• 💳 Deposit & Withdraw
• 🏦 Balance Tracking
• 📊 Transaction History
• 🎯 Referral System
• 👑 Admin Panel (for admins)

Click the button below to open the Smart Mall DApp!
  `;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🚀 Open Smart Mall DApp',
          web_app: { url: APP_URL }
        }
      ],
      [
        {
          text: '🔐 Login',
          callback_data: 'login'
        },
        {
          text: '📝 Register',
          callback_data: 'register'
        }
      ],
      [
        {
          text: '💰 Check Balance',
          callback_data: 'balance'
        },
        {
          text: '📊 My Requests',
          callback_data: 'requests'
        }
      ],
      [
        {
          text: '❓ Help',
          callback_data: 'help'
        }
      ]
    ]
  };

  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: keyboard,
    parse_mode: 'Markdown'
  });
});

// Handle /login command
bot.onText(/\/login/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Please use the login button in the menu or click the Login button below.', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🔐 Login',
            callback_data: 'login'
          }
        ]
      ]
    }
  });
});

// Handle /register command
bot.onText(/\/register/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Please use the register button in the menu or click the Register button below.', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '📝 Register',
            callback_data: 'register'
          }
        ]
      ]
    }
  });
});

// Handle /balance command
bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  const session = userSessions.get(chatId);
  
  if (!session || !session.isAuthenticated) {
    bot.sendMessage(chatId, '❌ Please login first to check your balance.', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🔐 Login',
              callback_data: 'login'
            }
          ]
        ]
      }
    });
    return;
  }

  try {
    const userData = await apiRequest('/auth/me', 'GET', null, session.token);
    
    const balanceMessage = `
💰 Your Balance:

💵 SMP Balance: ${userData.data.user.balance || 0} SMP
💎 USDT Balance: ${userData.data.user.usdt_balance || 0} USDT
🏦 Wallet Address: ${userData.data.user.address_wallet || 'Not set'}

Click below to manage your wallet!
    `;

    bot.sendMessage(chatId, balanceMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚀 Open Smart Mall DApp',
              web_app: { url: APP_URL }
            }
          ],
          [
            {
              text: '💳 Update Wallet',
              callback_data: 'update_wallet'
            }
          ]
        ]
      },
      parse_mode: 'Markdown'
    });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Failed to fetch balance. Please try again.');
  }
});

// Handle /requests command
bot.onText(/\/requests/, async (msg) => {
  const chatId = msg.chat.id;
  const session = userSessions.get(chatId);
  
  if (!session || !session.isAuthenticated) {
    bot.sendMessage(chatId, '❌ Please login first to view your requests.', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🔐 Login',
              callback_data: 'login'
            }
          ]
        ]
      }
    });
    return;
  }

  try {
    const requests = await apiRequest('/requests', 'GET', null, session.token);
    
    if (!requests.data || requests.data.length === 0) {
      bot.sendMessage(chatId, '📋 No requests found. Create your first deposit request!', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Open Smart Mall DApp',
                web_app: { url: APP_URL }
              }
            ]
          ]
        }
      });
      return;
    }

    let requestsMessage = '📋 Your Recent Requests:\n\n';
    requests.data.slice(0, 5).forEach((req, index) => {
      const status = req.status === 'pending' ? '⏳' : 
                    req.status === 'approved' ? '✅' : 
                    req.status === 'rejected' ? '❌' : '❓';
      
      requestsMessage += `${index + 1}. ${status} ${req.type.toUpperCase()}\n`;
      requestsMessage += `   💰 ${req.smp_amount} SMP (${req.usdt_amount} USDT)\n`;
      requestsMessage += `   📅 ${new Date(req.created_at).toLocaleDateString()}\n\n`;
    });

    bot.sendMessage(chatId, requestsMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚀 Open Smart Mall DApp',
              web_app: { url: APP_URL }
            }
          ],
          [
            {
              text: '📊 View All Requests',
              callback_data: 'all_requests'
            }
          ]
        ]
      },
      parse_mode: 'Markdown'
    });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Failed to fetch requests. Please try again.');
  }
});

// Handle /admin command (for admin users)
bot.onText(/\/admin/, async (msg) => {
  const chatId = msg.chat.id;
  const session = userSessions.get(chatId);
  
  if (!session || !session.isAuthenticated) {
    bot.sendMessage(chatId, '❌ Please login first to access admin panel.');
    return;
  }

  try {
    const userData = await apiRequest('/auth/me', 'GET', null, session.token);
    
    if (userData.data.user.role !== 'admin') {
      bot.sendMessage(chatId, '❌ Access denied. Admin privileges required.');
      return;
    }

    const adminMessage = `
👑 Admin Panel

Welcome, ${userData.data.user.username}!

Admin Features:
• 👥 User Management
• 📋 Request Management
• 📊 Statistics Dashboard
• ⚙️ System Settings

Click below to access the admin panel!
    `;

    bot.sendMessage(chatId, adminMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '👑 Admin Panel',
              web_app: { url: `${APP_URL}/admin` }
            }
          ],
          [
            {
              text: '📊 Quick Stats',
              callback_data: 'admin_stats'
            }
          ]
        ]
      },
      parse_mode: 'Markdown'
    });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Failed to access admin panel. Please try again.');
  }
});

// Handle callback queries
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  switch (data) {
    case 'login':
      bot.sendMessage(chatId, '🔐 Please login through the Smart Mall DApp to access your account.', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🔐 Login Now',
                web_app: { url: `${APP_URL}/login` }
              }
            ]
          ]
        }
      });
      break;

    case 'register':
      bot.sendMessage(chatId, '📝 Please register through the Smart Mall DApp to create your account.', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📝 Register Now',
                web_app: { url: `${APP_URL}/register` }
              }
            ]
          ]
        }
      });
      break;

    case 'balance':
      // Trigger balance check
      bot.emit('text', { chat: { id: chatId }, text: '/balance' });
      break;

    case 'requests':
      // Trigger requests check
      bot.emit('text', { chat: { id: chatId }, text: '/requests' });
      break;

    case 'update_wallet':
      bot.sendMessage(chatId, '💳 Please update your wallet address through the Smart Mall DApp.', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '💳 Update Wallet',
                web_app: { url: APP_URL }
              }
            ]
          ]
        }
      });
      break;

    case 'all_requests':
      bot.sendMessage(chatId, '📊 View all your requests and transaction history in the Smart Mall DApp.', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📊 View All Requests',
                web_app: { url: `${APP_URL}/wallet` }
              }
            ]
          ]
        }
      });
      break;

    case 'admin_stats':
      const session = userSessions.get(chatId);
      if (!session || !session.isAuthenticated) {
        bot.sendMessage(chatId, '❌ Please login first.');
        break;
      }

      try {
        const userData = await apiRequest('/auth/me', 'GET', null, session.token);
        
        if (userData.data.user.role !== 'admin') {
          bot.sendMessage(chatId, '❌ Access denied. Admin privileges required.');
          break;
        }

        // Get quick stats (you can add more API calls here)
        const statsMessage = `
📊 Quick Admin Stats:

👥 Total Users: Fetching...
💰 Total Balance: Fetching...
📋 Pending Requests: Fetching...

Click below for detailed statistics!
        `;

        bot.sendMessage(chatId, statsMessage, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '👑 Full Admin Panel',
                  web_app: { url: `${APP_URL}/admin` }
                }
              ]
            ]
          },
          parse_mode: 'Markdown'
        });
      } catch (error) {
        bot.sendMessage(chatId, '❌ Failed to fetch admin stats. Please try again.');
      }
      break;

    case 'help':
      const helpMessage = `
❓ Smart Mall DApp Bot Help:

🤖 **Bot Commands:**
/start - Start the bot and open Smart Mall DApp
/login - Login to your account
/register - Create a new account
/balance - Check your balance
/requests - View your requests
/admin - Access admin panel (admin only)
/help - Show this help message

💡 **Tips:**
• Use the menu buttons for quick access
• Login through the app to access all features
• Keep your wallet address updated
• Contact support if you need help

🔗 **Quick Links:**
• Smart Mall DApp: ${APP_URL}
• Support: Contact via app
      `;

      const helpKeyboard = {
        inline_keyboard: [
          [
            {
              text: '🚀 Open Smart Mall DApp',
              web_app: { url: APP_URL }
            }
          ],
          [
            {
              text: '🔐 Login',
              callback_data: 'login'
            },
            {
              text: '📝 Register',
              callback_data: 'register'
            }
          ]
        ]
      };

      bot.sendMessage(chatId, helpMessage, {
        reply_markup: helpKeyboard,
        parse_mode: 'Markdown'
      });
      break;
  }

  // Answer callback query
  bot.answerCallbackQuery(query.id);
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
🤖 Smart Mall DApp Bot Commands:

/start - Start the bot and open Smart Mall DApp
/login - Login to your account
/register - Create a new account
/balance - Check your balance
/requests - View your requests
/admin - Access admin panel (admin only)
/help - Show this help message

💡 Tips:
• Use the menu buttons for quick access
• Login through the app to access all features
• Keep your wallet address updated
• The app will automatically authenticate you via Telegram
  `;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🚀 Open Smart Mall DApp',
          web_app: { url: APP_URL }
        }
      ],
      [
        {
          text: '🔐 Login',
          callback_data: 'login'
        },
        {
          text: '📝 Register',
          callback_data: 'register'
        }
      ]
    ]
  };

  bot.sendMessage(chatId, helpMessage, {
    reply_markup: keyboard,
    parse_mode: 'Markdown'
  });
});

// Error handling
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 Smart Mall DApp Bot is running...');
console.log('📱 Send /start to begin');
console.log('🌐 Connected to:', APP_URL);
console.log('🔗 API URL:', API_URL); 
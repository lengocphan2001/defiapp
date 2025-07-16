# Backend API - React App with MySQL

A Node.js/Express backend API with MySQL database for user authentication and management.

## 🚀 Features

- **User Authentication** - Register, Login, Logout
- **JWT Token Management** - Secure token-based authentication
- **Password Hashing** - bcryptjs for secure password storage
- **Input Validation** - Express-validator for request validation
- **MySQL Database** - Reliable data storage with connection pooling
- **Referral System** - Unique referral codes for user registration
- **Security** - Helmet, CORS, and other security middleware
- **Error Handling** - Comprehensive error handling and logging

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `config.env` and update with your database credentials
   - Update `JWT_SECRET` with a strong secret key
   - Set your MySQL password in `DB_PASSWORD`

3. **Set up MySQL database:**
   ```sql
   CREATE DATABASE react_app_db;
   ```

4. **Start the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Configuration

### Environment Variables (`config.env`)

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=react_app_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  referral_code VARCHAR(50) NOT NULL,
  referred_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Referral Codes Table
```sql
CREATE TABLE referral_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  user_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

## 🔐 API Endpoints

### Authentication Routes

#### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "username": "john_doe",
  "referral": "ABC12345",
  "phone": "+1234567890",
  "password": "password123",
  "repassword": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "phone": "+1234567890",
      "referral_code": "XYZ98765",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/api/auth/login`
Login with username and password.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "phone": "+1234567890",
      "referral_code": "XYZ98765",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET `/api/auth/me`
Get current user information (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "phone": "+1234567890",
      "referral_code": "XYZ98765",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### POST `/api/auth/logout`
Logout user (client-side token removal).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## 🔒 Security Features

- **Password Hashing** - bcryptjs with 12 salt rounds
- **JWT Tokens** - Secure token-based authentication
- **Input Validation** - Comprehensive request validation
- **SQL Injection Protection** - Parameterized queries
- **CORS Protection** - Configured for specific origins
- **Helmet** - Security headers middleware
- **Rate Limiting** - Built-in protection against abuse

## 🚨 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "username",
      "message": "Username is required"
    }
  ]
}
```

## 📝 Validation Rules

### Registration
- Username: 3-20 characters, alphanumeric + underscore
- Referral: Minimum 3 characters, must exist in database
- Phone: Valid international format
- Password: 6-50 characters
- Repassword: Must match password

### Login
- Username: 3-20 characters, alphanumeric + underscore
- Password: Minimum 6 characters

## 🧪 Testing

Test the API endpoints using tools like Postman or curl:

```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","referral":"ABC12345","phone":"+1234567890","password":"password123","repassword":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   └── authController.js    # Authentication logic
├── middleware/
│   └── auth.js             # JWT authentication middleware
├── routes/
│   └── auth.js             # Authentication routes
├── utils/
│   └── validation.js       # Input validation utilities
├── config.env              # Environment variables
├── package.json            # Dependencies and scripts
├── server.js               # Main server file
└── README.md               # This file
```

## 🚀 Deployment

1. Set `NODE_ENV=production` in environment variables
2. Update database credentials for production
3. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "react-app-backend"
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License. 
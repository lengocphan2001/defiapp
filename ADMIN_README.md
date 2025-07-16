# Smart Mall DApp - Admin Management System

## Overview

The Smart Mall DApp now includes a comprehensive admin management system that allows administrators to manage users, monitor requests, and oversee platform operations.

## Features

### 🔐 Authentication & Authorization
- **Role-based access control**: Only users with `admin` role can access the admin panel
- **Secure routes**: Admin routes are protected and redirect non-admin users
- **JWT token validation**: All admin operations require valid authentication

### 📊 Dashboard Overview
- **Real-time statistics**: Total users, requests, pending requests, and SMP amounts
- **Today's activity**: New requests and processed SMP for the current day
- **Recent activity feed**: Latest user actions and request updates
- **Visual indicators**: Color-coded status badges and trend indicators

### 👥 User Management
- **View all users**: Complete user list with search and filtering
- **User details**: Username, phone, balance, wallet address, join date
- **User status**: Active/inactive status management
- **Balance management**: Update user balances directly from admin panel

### 📋 Request Management
- **View all requests**: Deposit and withdrawal requests with full details
- **Request status**: Pending, success, failed status management
- **Bulk operations**: Approve or reject multiple requests
- **Auto-balance update**: Automatically updates user balance when requests are approved

### 🔍 Search & Filtering
- **Real-time search**: Search users by username or phone
- **Request filtering**: Filter requests by status (all, pending, success, failed)
- **Advanced filtering**: Search requests by ID or wallet address

## File Structure

```
src/
├── pages/admin/
│   ├── AdminDashboard.tsx      # Main admin dashboard component
│   └── AdminDashboard.css      # Admin dashboard styles
├── services/
│   └── userService.ts          # User management API service
├── context/
│   └── AuthContext.tsx         # Updated with role-based auth
└── types/
    └── index.ts                # Updated User interface with role/status

backend/
├── controllers/
│   └── userController.js       # User management controller
├── routes/
│   └── userRoutes.js           # User management routes
├── middleware/
│   ├── auth.js                 # Authentication middleware
│   └── authMiddleware.js       # Admin route protection
├── config/
│   └── database.js             # Updated schema with role/status
└── scripts/
    └── createAdmin.js          # Admin user creation script
```

## Setup Instructions

### 1. Database Setup

The database schema has been updated to include admin functionality:

```sql
-- Users table now includes:
- status ENUM('active', 'inactive') DEFAULT 'active'
- role ENUM('user', 'admin') DEFAULT 'user'
```

### 2. Create Admin User

Run the admin creation script:

```bash
cd backend
node scripts/createAdmin.js
```

This will create an admin user with:
- **Username**: `admin`
- **Password**: `admin123`
- **Phone**: `0123456789`
- **Starting Balance**: `1,000,000 SMP`

⚠️ **Important**: Change the admin password after first login!

### 3. Backend API Endpoints

#### User Management
- `GET /api/users/admin/all` - Get all users (admin only)
- `GET /api/users/admin/stats` - Get user statistics (admin only)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id/balance` - Update user balance (admin only)
- `PATCH /api/users/:id/status` - Update user status (admin only)

#### Request Management
- `GET /api/requests/admin/all` - Get all requests (admin only)
- `PATCH /api/requests/:id/status` - Update request status (admin only)

### 4. Frontend Integration

The admin panel is accessible at `/admin` route and includes:

- **Protected routing**: Only admin users can access
- **Responsive design**: Works on desktop and mobile
- **Real-time updates**: Automatic data refresh
- **Modern UI**: Glassmorphism design with dark theme

## Usage Guide

### Accessing Admin Panel

1. **Login as admin**: Use the admin credentials created by the script
2. **Navigate to admin panel**: Click the "Admin Panel" link in the header (only visible to admins)
3. **Or go directly**: Visit `/admin` route

### Managing Users

1. **View users**: Go to "Users" tab in admin panel
2. **Search users**: Use the search box to find specific users
3. **Update balance**: Click on user row and use balance update functionality
4. **Change status**: Toggle user active/inactive status

### Managing Requests

1. **View requests**: Go to "Requests" tab in admin panel
2. **Filter requests**: Use status filter to view specific request types
3. **Approve requests**: Click "Approve" button to approve pending requests
4. **Reject requests**: Click "Reject" button to reject pending requests

### Dashboard Monitoring

1. **Overview stats**: View key metrics on the dashboard
2. **Recent activity**: Monitor latest user actions and requests
3. **Today's stats**: Track daily platform activity
4. **Refresh data**: Use refresh button to get latest data

## Security Features

### Authentication
- JWT token-based authentication
- Token expiration handling
- Secure password hashing with bcrypt

### Authorization
- Role-based access control
- Admin-only route protection
- User permission validation

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection with helmet middleware

## API Response Format

All admin API endpoints follow a consistent response format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

## Error Handling

The admin system includes comprehensive error handling:

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

## Customization

### Adding New Admin Features

1. **Backend**: Add new controller methods and routes
2. **Frontend**: Create new components and services
3. **Database**: Update schema if needed
4. **Types**: Update TypeScript interfaces

### Styling Customization

The admin panel uses CSS custom properties for easy theming:

```css
:root {
  --admin-primary: #14b8a6;
  --admin-secondary: #0d9488;
  --admin-background: #0f172a;
  --admin-surface: #1e293b;
}
```

## Troubleshooting

### Common Issues

1. **Admin panel not accessible**
   - Check if user has `admin` role
   - Verify JWT token is valid
   - Check browser console for errors

2. **Database connection issues**
   - Verify MySQL credentials in `.env`
   - Check if database tables exist
   - Run database initialization script

3. **API errors**
   - Check server logs for detailed error messages
   - Verify API endpoint URLs
   - Check authentication headers

### Debug Mode

Enable debug mode by setting `NODE_ENV=development` in your environment variables.

## Support

For issues or questions about the admin system:

1. Check the server logs for error details
2. Verify database connectivity
3. Test API endpoints with Postman or similar tools
4. Review the authentication flow

## Future Enhancements

Potential improvements for the admin system:

- **Advanced analytics**: Charts and graphs for data visualization
- **Bulk operations**: Mass user/request management
- **Audit logs**: Track all admin actions
- **Email notifications**: Alert admins of important events
- **Export functionality**: Export data to CSV/Excel
- **Real-time notifications**: WebSocket integration for live updates 
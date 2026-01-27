# Routes Integration Guide

## Overview
This guide shows how to wire up the `studentController` methods to API routes.

## File: `routes/api.js`

Add the following route definitions to your main API router:

```javascript
/**
 * ========================================
 * STUDENT API ROUTES
 * ========================================
 * All routes prefixed with /api/student
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken } = require('../middleware/auth');

/**
 * ========================================
 * PUBLIC ROUTES (No Authentication Required)
 * ========================================
 */

/**
 * GET /api/student/activities
 * Fetch all activities
 */
router.get('/student/activities', studentController.getActivities);

/**
 * GET /api/student/announcements
 * Fetch all announcements
 */
router.get('/student/announcements', studentController.getAnnouncements);

/**
 * ========================================
 * PROTECTED ROUTES (Authentication Required)
 * ========================================
 * All routes below require valid JWT token
 */

/**
 * ========================================
 * PROFILE ENDPOINTS
 * ========================================
 */

/**
 * GET /api/student/profile
 * Fetch logged-in student's profile
 */
router.get('/student/profile', authenticateToken, studentController.getProfile);

/**
 * ========================================
 * ATTENDANCE ENDPOINTS
 * ========================================
 */

/**
 * GET /api/student/attendance
 * Fetch attendance logs for logged-in student
 */
router.get('/student/attendance', authenticateToken, studentController.getAttendance);

/**
 * ========================================
 * COMPLAINTS ENDPOINTS
 * ========================================
 */

/**
 * GET /api/student/complaints
 * Fetch all complaints for logged-in student
 */
router.get('/student/complaints', authenticateToken, studentController.getComplaints);

/**
 * POST /api/student/complaints
 * Submit a new complaint
 * Body: { title, description, recipient?, is_secret?, type? }
 */
router.post('/student/complaints', authenticateToken, studentController.submitComplaint);

/**
 * ========================================
 * MAINTENANCE ENDPOINTS
 * ========================================
 */

/**
 * GET /api/student/maintenance
 * Fetch all maintenance requests for logged-in student
 */
router.get('/student/maintenance', authenticateToken, studentController.getMaintenanceRequests);

/**
 * POST /api/student/maintenance
 * Submit a new maintenance request
 * Body: { category, description }
 */
router.post('/student/maintenance', authenticateToken, studentController.submitMaintenance);

/**
 * ========================================
 * PERMISSIONS ENDPOINTS
 * ========================================
 */

/**
 * GET /api/student/permissions
 * Fetch all permission requests for logged-in student
 */
router.get('/student/permissions', authenticateToken, studentController.getPermissions);

/**
 * POST /api/student/permissions
 * Request a new permission (Late/Travel)
 * Body: { type, start_date, end_date, reason }
 */
router.post('/student/permissions', authenticateToken, studentController.requestPermission);

/**
 * ========================================
 * NOTIFICATIONS ENDPOINTS
 * ========================================
 */

/**
 * GET /api/student/notifications
 * Fetch all notifications for logged-in student
 */
router.get('/student/notifications', authenticateToken, studentController.getNotifications);

/**
 * POST /api/student/notifications/:id/read
 * Mark a specific notification as read
 * URL Params: id (notification_id)
 */
router.post('/student/notifications/:id/read', authenticateToken, studentController.markNotificationAsRead);

/**
 * ========================================
 * CLEARANCE ENDPOINTS
 * ========================================
 */

/**
 * GET /api/student/clearance
 * Fetch clearance status for logged-in student
 */
router.get('/student/clearance', authenticateToken, studentController.getClearanceStatus);

/**
 * POST /api/student/clearance/initiate
 * Initiate clearance process for logged-in student
 */
router.post('/student/clearance/initiate', authenticateToken, studentController.initiateClearance);

// ========================================
// Export Router
// ========================================
module.exports = router;
```

## Usage in Main Server File

In your `server.js` or `app.js`:

```javascript
const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Route Summary Table

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/student/profile` | ✅ | Get student profile |
| GET | `/api/student/activities` | ❌ | Get all activities |
| GET | `/api/student/announcements` | ❌ | Get all announcements |
| GET | `/api/student/attendance` | ✅ | Get attendance logs |
| GET | `/api/student/complaints` | ✅ | Get complaints |
| POST | `/api/student/complaints` | ✅ | Submit complaint |
| GET | `/api/student/maintenance` | ✅ | Get maintenance requests |
| POST | `/api/student/maintenance` | ✅ | Submit maintenance request |
| GET | `/api/student/permissions` | ✅ | Get permissions |
| POST | `/api/student/permissions` | ✅ | Request permission |
| GET | `/api/student/notifications` | ✅ | Get notifications |
| POST | `/api/student/notifications/:id/read` | ✅ | Mark notification as read |
| GET | `/api/student/clearance` | ✅ | Get clearance status |
| POST | `/api/student/clearance/initiate` | ✅ | Initiate clearance |

## Authentication Middleware

The `authenticateToken` middleware should:

1. Extract JWT token from Authorization header
2. Verify the token
3. Attach `req.user` with student ID
4. Call `next()` if valid

Example implementation:

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Should contain: { id, national_id, ... }
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};
```

## Testing with Postman

### 1. Get Activities (No Auth)
```
GET http://localhost:3000/api/student/activities
```

### 2. Get Profile (With Auth)
```
GET http://localhost:3000/api/student/profile
Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Submit Complaint (With Auth)
```
POST http://localhost:3000/api/student/complaints
Header: Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "title": "Water Leak",
  "description": "Water leaking from ceiling",
  "recipient": "Management",
  "type": "General"
}
```

## Error Handling

The controller handles errors and returns appropriate responses:

```javascript
// Missing required fields
{
  "success": false,
  "message": "Title and description are required"
}

// Student not found
{
  "success": false,
  "message": "Student not found"
}

// Server error
{
  "success": false,
  "message": "Failed to fetch profile"
}
```

## Database Connection

Ensure `db.js` exports a pool with query method:

```javascript
// db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'student_housing',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

## Environment Variables

Ensure `.env` file contains:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=student_housing
JWT_SECRET=your_secret_key
PORT=3000
```

## Testing Checklist

- [ ] GET /student/activities returns all activities
- [ ] GET /student/announcements returns all announcements
- [ ] GET /student/profile returns logged-in student profile
- [ ] GET /student/attendance returns student's attendance
- [ ] GET /student/complaints returns student's complaints
- [ ] POST /student/complaints creates new complaint
- [ ] GET /student/maintenance returns maintenance requests
- [ ] POST /student/maintenance creates maintenance request
- [ ] GET /student/permissions returns permissions
- [ ] POST /student/permissions creates permission request
- [ ] GET /student/notifications returns notifications
- [ ] POST /student/notifications/:id/read marks as read
- [ ] GET /student/clearance returns clearance status
- [ ] POST /student/clearance/initiate initiates clearance

## Status: ✅ Ready

All routes are properly configured and ready for mobile app integration.

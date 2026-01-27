/**
 * ========================================
 * API ROUTES - Student Housing Mobile App
 * ========================================
 * 
 * Purpose: Define all API endpoints for mobile app
 * 
 * ROUTE STRUCTURE:
 * ├── /student/profile          (GET) - Student info + room
 * ├── /student/activities       (GET) - All activities
 * ├── /student/announcements    (GET) - All announcements
 * ├── /student/attendance       (GET) - Attendance logs
 * ├── /student/complaints       (GET/POST) - Complaints
 * ├── /student/maintenance      (GET/POST) - Maintenance requests
 * ├── /student/permissions      (GET/POST) - Permission requests
 * ├── /student/notifications    (GET) - Notifications
 * ├── /student/notifications/:id/read (POST) - Mark notification read
 * ├── /student/clearance        (GET) - Clearance status
 * └── /student/clearance/initiate (POST) - Start clearance process
 * 
 * SECURITY:
 * - Protected routes use authenticateToken middleware
 * - Extracts student_id from JWT token → req.user.id
 * - Public routes: activities, announcements (no auth required)
 * - All other routes require authentication
 * 
 * RESPONSE FORMAT:
 * Success (200/201): { success: true, data: {...} }
 * Error (4xx/5xx): { success: false, message: "..." }
 * 
 * @module routes/api
 * @requires express
 * @requires ../controllers/studentController
 * @requires ../middleware/auth
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Import controllers
const studentController = require('../controllers/studentController');

// Import middleware
const { authenticateToken } = require('../middleware/auth');

// ========================================
// CONFIGURE MULTER FOR IMAGE UPLOADS
// ========================================
/**
 * WHY MULTER?
 * - Middleware for handling file uploads
 * - Stores files in uploads/ directory
 * - Generates unique filenames with timestamps
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp + extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ========================================
// STUDENT PROFILE ROUTES
// ========================================

/**
 * GET /api/student/profile
 * 
 * Description: Get logged-in student's profile with room as nested object
 * 
 * Authentication: Required (JWT token)
 * 
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     id: 1,
 *     national_id: "30412010101234",
 *     full_name: "محمد أحمد علي",
 *     student_id: "20230001",
 *     college: "Engineering",
 *     academic_year: "Third Year",
 *     photo_url: "https://...",
 *     housing_type: "Double",
 *     created_at: "2025-01-15T10:30:00Z",
 *     room: {
 *       room_no: "101",
 *       building: "Building A"
 *     }
 *   }
 * }
 * 
 * Error (404): Student not found
 * Error (500): Server error
 */
router.get('/student/profile', authenticateToken, studentController.getProfile);

// ========================================
// PHOTO UPLOAD ROUTE
// ========================================

/**
 * POST /api/student/upload-photo
 * 
 * Description: Upload student profile photo
 * 
 * Authentication: Required (JWT token)
 * 
 * Request: multipart/form-data with 'photo' file
 * 
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     photo_url: "http://localhost:3000/uploads/photo-1642345678901.jpg"
 *   }
 * }
 * 
 * Error (400): No file uploaded or invalid file type
 * Error (500): Server error
 */
router.post('/student/upload-photo', authenticateToken, upload.single('photo'), studentController.uploadPhoto);

// ========================================
// PUBLIC CONTENT ROUTES (No Authentication)
// ========================================

/**
 * GET /api/student/activities
 * 
 * Description: Get all activities (public endpoint, no auth required)
 * 
 * Response (200):
 * {
 *   success: true,
 *   data: [
 *     {
 *       id: 1,
 *       title: "Weekly Football",
 *       description: "Inter-hall football tournament...",
 *       category: "Sports",
 *       location: "Main Sports Complex",
 *       date: "2025-02-08"
 *     }
 *   ]
 * }
 * 
 * Error (500): Server error
 */
router.get('/student/activities', studentController.getActivities);

/**
 * GET /api/student/announcements
 * 
 * Description: Get all announcements (public endpoint, no auth required)
 * 
 * Response (200):
 * {
 *   success: true,
 *   data: [
 *     {
 *       id: 1,
 *       title: "Welcome Announcement",
 *       body: "Welcome to housing system...",
 *       category: "General"
 *     }
 *   ]
 * }
 * 
 * Error (500): Server error
 */
router.get('/student/announcements', studentController.getAnnouncements);

// ========================================
// ATTENDANCE ROUTES
// ========================================

/**
 * GET /api/student/attendance
 * 
 * Description: Get student's attendance logs
 * 
 * Authentication: Required
 * 
 * Response (200):
 * {
 *   success: true,
 *   data: [
 *     {
 *       id: 1,
 *       student_id: 1,
 *       date: "2025-01-25",
 *       status: "Present",
 *       created_at: "2025-01-25T08:00:00Z"
 *     }
 *   ]
 * }
 * 
 * Error (500): Server error
 */
router.get('/student/attendance', authenticateToken, studentController.getAttendance);

// ========================================
// COMPLAINTS ROUTES
// ========================================

/**
 * GET /api/student/complaints
 * 
 * Description: Get student's complaints
 * 
 * Authentication: Required
 * 
 * Response (200):
 * {
 *   success: true,
 *   data: [
 *     {
 *       id: 1,
 *       student_id: 1,
 *       title: "Noise Complaint",
 *       description: "Loud noise from neighboring room",
 *       type: "General",
 *       status: "Pending",
 *       created_at: "2025-01-20T14:00:00Z"
 *     }
 *   ]
 * }
 * 
 * Error (500): Server error
 */
router.get('/student/complaints', authenticateToken, studentController.getComplaints);

/**
 * POST /api/student/complaints
 * 
 * Description: Submit a new complaint
 * 
 * Authentication: Required
 * 
 * Request Body:
 * {
 *   "title": "Complaint Title" (required),
 *   "description": "Complaint Description" (required),
 *   "type": "General" (required)
 * }
 * 
 * Response (201):
 * {
 *   success: true,
 *   data: {
 *     id: 10,
 *     student_id: 1,
 *     title: "Noise Complaint",
 *     description: "Loud noise from neighboring room",
 *     type: "General",
 *     status: "Pending",
 *     created_at: "2025-01-25T15:30:00Z"
 *   }
 * }
 * 
 * Error (400): Missing required fields
 * Error (500): Server error
 */
router.post('/student/complaints', authenticateToken, studentController.submitComplaint);

// ========================================
// MAINTENANCE ROUTES
// ========================================

/**
 * GET /api/student/maintenance
 * 
 * Description: Get student's maintenance requests
 * 
 * Authentication: Required
 * 
 * Response (200):
 * {
 *   success: true,
 *   data: [
 *     {
 *       id: 1,
 *       student_id: 1,
 *       category: "Electrical",
 *       description: "Light bulb broken",
 *       status: "Pending",
 *       created_at: "2025-01-20T14:00:00Z"
 *     }
 *   ]
 * }
 * 
 * Error (500): Server error
 */
router.get('/student/maintenance', authenticateToken, studentController.getMaintenanceRequests);

/**
 * POST /api/student/maintenance
 * 
 * Description: Submit a new maintenance request
 * 
 * Authentication: Required
 * 
 * Request Body:
 * {
 *   "category": "Electrical" (required),
 *   "description": "Light bulb broken" (required)
 * }
 * 
 * Response (201):
 * {
 *   success: true,
 *   data: {
 *     id: 5,
 *     student_id: 1,
 *     category: "Electrical",
 *     description: "Light bulb broken",
 *     status: "Pending",
 *     created_at: "2025-01-25T15:30:00Z"
 *   }
 * }
 * 
 * Error (400): Missing required fields
 * Error (500): Server error
 */
router.post('/student/maintenance', authenticateToken, studentController.submitMaintenance);

// ========================================
// PERMISSIONS ROUTES
// ========================================

/**
 * GET /api/student/permissions
 * 
 * Description: Get student's permission requests
 * 
 * Authentication: Required
 * 
 * Response (200):
 * {
 *   success: true,
 *   data: [
 *     {
 *       id: 1,
 *       student_id: 1,
 *       permission_type: "Late Pass",
 *       from_date: "2025-02-01",
 *       to_date: "2025-02-05",
 *       status: "Pending",
 *       created_at: "2025-01-20T14:00:00Z"
 *     }
 *   ]
 * }
 * 
 * Error (500): Server error
 */
router.get('/student/permissions', authenticateToken, studentController.getPermissions);

/**
 * POST /api/student/permissions
 * 
 * Description: Request a new permission
 * 
 * Authentication: Required
 * 
 * Request Body:
 * {
 *   "permission_type": "Late Pass" (required),
 *   "from_date": "2025-02-01" (required, YYYY-MM-DD),
 *   "to_date": "2025-02-05" (required, YYYY-MM-DD)
 * }
 * 
 * Response (201):
 * {
 *   success: true,
 *   data: {
 *     id: 5,
 *     student_id: 1,
 *     permission_type: "Late Pass",
 *     from_date: "2025-02-01",
 *     to_date: "2025-02-05",
 *     status: "Pending",
 *     created_at: "2025-01-25T15:30:00Z"
 *   }
 * }
 * 
 * Error (400): Missing required fields or invalid date format
 * Error (500): Server error
 */
router.post('/student/permissions', authenticateToken, studentController.requestPermission);

// ========================================
// NOTIFICATIONS ROUTES
// ========================================

/**
 * GET /api/student/notifications
 * 
 * Description: Get student's notifications
 * 
 * Authentication: Required
 * 
 * Response (200):
 * {
 *   success: true,
 *   data: [
 *     {
 *       id: 1,
 *       student_id: 1,
 *       title: "Complaint Updated",
 *       body: "Your complaint has been reviewed",
 *       type: "Complaint",
 *       sender_name: "Admin",
 *       is_unread: 1,
 *       created_at: "2025-01-25T15:30:00Z"
 *     }
 *   ]
 * }
 * 
 * Error (500): Server error
 */
router.get('/student/notifications', authenticateToken, studentController.getNotifications);

/**
 * POST /api/student/notifications/:id/read
 * 
 * Description: Mark notification as read
 * 
 * Authentication: Required
 * 
 * URL Parameters:
 * - id: Notification ID
 * 
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     id: 1,
 *     is_unread: 0,
 *     updated_at: "2025-01-25T15:35:00Z"
 *   }
 * }
 * 
 * Error (404): Notification not found
 * Error (500): Server error
 */
router.post('/student/notifications/:id/read', authenticateToken, studentController.markNotificationAsRead);

// ========================================
// CLEARANCE ROUTES
// ========================================

/**
 * GET /api/student/clearance
 * 
 * Description: Get student's clearance status
 * 
 * Authentication: Required
 * 
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     id: 1,
 *     student_id: 1,
 *     status: "Pending" | "Completed",
 *     current_step: "Initial Review",
 *     created_at: "2025-01-15T10:30:00Z"
 *   }
 * }
 * 
 * OR (if not initiated):
 * {
 *   success: true,
 *   data: "Not Initiated"
 * }
 * 
 * Error (500): Server error
 */
router.get('/student/clearance', authenticateToken, studentController.getClearanceStatus);

/**
 * POST /api/student/clearance/initiate
 * 
 * Description: Initiate clearance process
 * 
 * Authentication: Required
 * 
 * Response (201):
 * {
 *   success: true,
 *   data: {
 *     id: 5,
 *     student_id: 1,
 *     status: "Pending",
 *     current_step: "Initial Review",
 *     created_at: "2025-01-25T15:30:00Z"
 *   }
 * }
 * 
 * Error (409): Clearance already initiated
 * Error (500): Server error
 */
router.post('/student/clearance/initiate', authenticateToken, studentController.initiateClearance);

// ========================================
// EXPORT ROUTER
// ========================================

/**
 * Export the router to be used in server.js
 * 
 * Usage in server.js:
 * const apiRoutes = require('./routes/api');
 * app.use('/api', apiRoutes);
 */
module.exports = router;

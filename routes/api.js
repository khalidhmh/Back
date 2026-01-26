/**
 * ========================================
 * API ROUTES
 * ========================================
 * 
 * Purpose: Define all API endpoints for the mobile app
 * 
 * ROUTE STRUCTURE:
 * /api
 * ├── /student                 (Student profile & attendance)
 * ├── /services                (Complaints, maintenance, permissions)
 * └── /activities              (Activities & announcements)
 * 
 * SECURITY:
 * - ALL routes protected with authenticateToken middleware
 * - Prevents unauthorized access
 * - Extracts student ID from JWT token
 * 
 * MIDDLEWARE FLOW:
 * 1. Request arrives at route
 * 2. authenticateToken middleware executes
 * 3. If valid token: req.user = { id, role }
 * 4. If invalid token: 401 Unauthorized response
 * 5. Controller method executes only if token valid
 * 
 * @module routes/api
 * @requires express
 * @requires ../controllers/studentController
 * @requires ../controllers/serviceController
 * @requires ../controllers/activityController
 * @requires ../middleware/auth
 */

const express = require('express');
const router = express.Router();

// Import controllers
const studentController = require('../controllers/studentController');
const serviceController = require('../controllers/serviceController');
const activityController = require('../controllers/activityController');

// Import middleware
const { authenticateToken } = require('../middleware/auth');

// ========================================
// STUDENT ROUTES
// ========================================
// Purpose: Fetch student profile, attendance, and clearance status

/**
 * GET /api/student/profile
 * 
 * Description: Get logged-in student's profile with room details
 * 
 * Authentication: Required (JWT token)
 * 
 * Response (200):
 * {
 *   success: true,
 *   student: {
 *     id: 1,
 *     national_id: "30412010101234",
 *     full_name: "محمد أحمد علي",
 *     faculty: "Engineering",
 *     phone: "+201234567890",
 *     photo_url: "https://...",
 *     is_suspended: false,
 *     created_at: "2025-01-15T10:30:00Z",
 *     room: {
 *       id: 1,
 *       room_number: "101",
 *       building: "Building A",
 *       floor: 1,
 *       capacity: 2
 *     }
 *   }
 * }
 * 
 * Error (404): Student not found
 * Error (500): Server error
 */
router.get('/student/profile', authenticateToken, studentController.getProfile);

/**
 * GET /api/student/attendance
 * 
 * Description: Get attendance logs for the student
 * 
 * Authentication: Required (JWT token)
 * 
 * Query Parameters:
 * - month: YYYY-MM format (e.g., 2025-01) - optional
 * - date: YYYY-MM-DD format (e.g., 2025-01-25) - optional
 * 
 * Response (200):
 * {
 *   success: true,
 *   count: 2,
 *   attendance: [
 *     {
 *       id: 1,
 *       student_id: 1,
 *       date: "2025-01-25",
 *       status: "Present",
 *       created_at: "2025-01-25T08:00:00Z"
 *     },
 *     {
 *       id: 2,
 *       student_id: 1,
 *       date: "2025-01-24",
 *       status: "Present",
 *       created_at: "2025-01-24T08:00:00Z"
 *     }
 *   ]
 * }
 * 
 * Error (400): Invalid filter format
 * Error (500): Server error
 */
router.get('/student/attendance', authenticateToken, studentController.getAttendance);

/**
 * GET /api/student/clearance
 * 
 * Description: Get student's clearance process status
 * 
 * Authentication: Required (JWT token)
 * 
 * Response (200):
 * {
 *   success: true,
 *   clearance: {
 *     id: 1,
 *     status: "Pending",
 *     room_check_passed: false,
 *     keys_returned: false,
 *     progress: {
 *       completed: 0,
 *       total: 2,
 *       percentage: 0
 *     },
 *     created_at: "2025-01-15T10:30:00Z",
 *     updated_at: "2025-01-15T10:30:00Z"
 *   }
 * }
 * 
 * Error (404): No clearance record found (not yet initiated)
 * Error (500): Server error
 */
router.get('/student/clearance', authenticateToken, studentController.getClearanceStatus);

// ========================================
// SERVICE ROUTES
// ========================================
// Purpose: Handle complaints, maintenance requests, and permissions

// --- COMPLAINTS ---

/**
 * GET /api/services/complaints
 * 
 * Description: Get all complaints for the student
 * 
 * Authentication: Required (JWT token)
 * 
 * Query Parameters:
 * - status: "pending" or "resolved" - optional
 * - type: "general" or "urgent" - optional
 * 
 * Response (200):
 * {
 *   success: true,
 *   count: 3,
 *   complaints: [
 *     {
 *       id: 1,
 *       student_id: 1,
 *       title: "Noise Complaint",
 *       description: "Loud noise from neighboring room...",
 *       type: "general",
 *       status: "pending",
 *       is_secret: false,
 *       admin_reply: null,
 *       created_at: "2025-01-20T14:00:00Z",
 *       updated_at: "2025-01-20T14:00:00Z"
 *     }
 *   ]
 * }
 * 
 * Error (500): Server error
 */
router.get('/services/complaints', authenticateToken, serviceController.getComplaints);

/**
 * POST /api/services/complaints
 * 
 * Description: Submit a new complaint
 * 
 * Authentication: Required (JWT token)
 * 
 * Request Body:
 * {
 *   title: "Noise Complaint" (required, max 200 chars),
 *   description: "Loud music coming from room 102..." (required, max 5000 chars),
 *   type: "general" or "urgent" (required),
 *   is_secret: false (optional, defaults to false)
 * }
 * 
 * Response (201):
 * {
 *   success: true,
 *   message: "Complaint submitted successfully",
 *   complaint: {
 *     id: 5,
 *     student_id: 1,
 *     title: "Noise Complaint",
 *     description: "Loud music coming from room 102...",
 *     type: "general",
 *     status: "pending",
 *     is_secret: false,
 *     admin_reply: null,
 *     created_at: "2025-01-25T15:30:00Z",
 *     updated_at: "2025-01-25T15:30:00Z"
 *   }
 * }
 * 
 * Error (400): Missing required fields or invalid data
 * Error (500): Server error
 */
router.post('/services/complaints', authenticateToken, serviceController.createComplaint);

// --- MAINTENANCE ---

/**
 * GET /api/services/maintenance
 * 
 * Description: Get maintenance requests for student's room
 * 
 * Authentication: Required (JWT token)
 * 
 * Query Parameters:
 * - status: "open", "in_progress", or "fixed" - optional
 * - category: "plumbing", "electrical", "door", etc. - optional
 * 
 * Response (200):
 * {
 *   success: true,
 *   count: 2,
 *   maintenance: [
 *     {
 *       id: 1,
 *       room_id: 1,
 *       category: "electrical",
 *       description: "Light fixture in main room not working",
 *       status: "open",
 *       supervisor_reply: null,
 *       created_at: "2025-01-22T10:00:00Z",
 *       updated_at: "2025-01-22T10:00:00Z"
 *     }
 *   ]
 * }
 * 
 * Error (404): Student not assigned to room
 * Error (500): Server error
 */
router.get('/services/maintenance', authenticateToken, serviceController.getMaintenance);

/**
 * POST /api/services/maintenance
 * 
 * Description: Submit a new maintenance request
 * 
 * Authentication: Required (JWT token)
 * 
 * Request Body:
 * {
 *   category: "plumbing" (required),
 *   description: "Water leak from ceiling..." (required)
 * }
 * 
 * Response (201):
 * {
 *   success: true,
 *   message: "Maintenance request submitted successfully",
 *   maintenance: {
 *     id: 3,
 *     room_id: 1,
 *     category: "plumbing",
 *     description: "Water leak from ceiling...",
 *     status: "open",
 *     supervisor_reply: null,
 *     created_at: "2025-01-25T15:30:00Z",
 *     updated_at: "2025-01-25T15:30:00Z"
 *   }
 * }
 * 
 * Error (400): Missing fields or not assigned to room
 * Error (500): Server error
 */
router.post('/services/maintenance', authenticateToken, serviceController.createMaintenance);

// --- PERMISSIONS ---

/**
 * GET /api/services/permissions
 * 
 * Description: Get all permission requests for the student
 * 
 * Authentication: Required (JWT token)
 * 
 * Query Parameters:
 * - status: "pending", "approved", or "rejected" - optional
 * - type: "travel", "late", "medical", or "other" - optional
 * 
 * Response (200):
 * {
 *   success: true,
 *   count: 2,
 *   permissions: [
 *     {
 *       id: 1,
 *       student_id: 1,
 *       type: "travel",
 *       reason: "Family visit in Alexandria",
 *       start_date: "2025-02-01",
 *       end_date: "2025-02-03",
 *       status: "approved",
 *       admin_remarks: "Approved. Enjoy your trip.",
 *       created_at: "2025-01-20T12:00:00Z",
 *       updated_at: "2025-01-20T12:00:00Z"
 *     }
 *   ]
 * }
 * 
 * Error (500): Server error
 */
router.get('/services/permissions', authenticateToken, serviceController.getPermissions);

/**
 * POST /api/services/permissions
 * 
 * Description: Request a new permission
 * 
 * Authentication: Required (JWT token)
 * 
 * Request Body:
 * {
 *   type: "travel" (required, 'travel'/'late'/'medical'/'other'),
 *   start_date: "2025-02-01" (required, YYYY-MM-DD),
 *   end_date: "2025-02-03" (required, YYYY-MM-DD),
 *   reason: "Family visit in Alexandria" (required)
 * }
 * 
 * Response (201):
 * {
 *   success: true,
 *   message: "Permission request submitted successfully",
 *   permission: {
 *     id: 4,
 *     student_id: 1,
 *     type: "travel",
 *     reason: "Family visit in Alexandria",
 *     start_date: "2025-02-01",
 *     end_date: "2025-02-03",
 *     status: "pending",
 *     admin_remarks: null,
 *     created_at: "2025-01-25T15:30:00Z",
 *     updated_at: "2025-01-25T15:30:00Z"
 *   }
 * }
 * 
 * Error (400): Missing fields, invalid dates, or dates in past
 * Error (500): Server error
 */
router.post('/services/permissions', authenticateToken, serviceController.requestPermission);

// ========================================
// ACTIVITY & ANNOUNCEMENT ROUTES
// ========================================
// Purpose: Handle activities and announcements

/**
 * GET /api/activities
 * 
 * Description: Get all upcoming activities with subscription status
 * 
 * Authentication: Required (JWT token)
 * 
 * Query Parameters:
 * - limit: number - Get only N activities (optional)
 * 
 * Response (200):
 * {
 *   success: true,
 *   count: 2,
 *   activities: [
 *     {
 *       id: 1,
 *       title: "Football League",
 *       description: "Inter-hall football tournament...",
 *       date: "2025-02-08",
 *       location: "Main Sports Complex",
 *       max_participants: 50,
 *       participant_count: 23,
 *       is_subscribed: true,
 *       created_at: "2025-01-15T10:00:00Z"
 *     }
 *   ]
 * }
 * 
 * Error (500): Server error
 */
router.get('/activities', authenticateToken, activityController.getActivities);

/**
 * POST /api/activities/subscribe
 * 
 * Description: Subscribe to an activity
 * 
 * Authentication: Required (JWT token)
 * 
 * Request Body:
 * {
 *   activity_id: 1 (required)
 * }
 * 
 * Response (201):
 * {
 *   success: true,
 *   message: "Successfully subscribed to \"Football League\"",
 *   subscription: {
 *     id: 5,
 *     student_id: 1,
 *     activity_id: 1,
 *     created_at: "2025-01-25T15:30:00Z"
 *   }
 * }
 * 
 * Error (400): Missing activity_id or activity is full
 * Error (404): Activity not found
 * Error (409): Already subscribed to this activity
 * Error (500): Server error
 */
router.post('/activities/subscribe', authenticateToken, activityController.subscribeToActivity);

/**
 * GET /api/announcements
 * 
 * Description: Get all announcements
 * 
 * Authentication: Required (JWT token)
 * 
 * Query Parameters:
 * - limit: number - Get only last N announcements (optional)
 * - category: "general"/"maintenance"/"event"/etc. - optional
 * 
 * Response (200):
 * {
 *   success: true,
 *   count: 2,
 *   announcements: [
 *     {
 *       id: 1,
 *       title: "Welcome to Housing System",
 *       content: "Welcome to the new digital housing management system...",
 *       category: "general",
 *       created_at: "2025-01-15T10:00:00Z",
 *       updated_at: "2025-01-15T10:00:00Z"
 *     }
 *   ]
 * }
 * 
 * Error (500): Server error
 */
router.get('/announcements', authenticateToken, activityController.getAnnouncements);

// ========================================
// EXPORT ROUTER
// ========================================

module.exports = router;

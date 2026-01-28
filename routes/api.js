const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Import controllers
const studentController = require('../controllers/studentController');
const activityController = require('../controllers/activityController'); // ✅ Imported

// Import middleware
const { authenticateToken } = require('../middleware/auth');

// ========================================
// CONFIGURE MULTER FOR IMAGE UPLOADS
// ========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
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
router.get('/student/profile', authenticateToken, studentController.getProfile);
router.post('/student/upload-photo', authenticateToken, upload.single('photo'), studentController.uploadPhoto);

// ========================================
// PUBLIC CONTENT ROUTES
// ========================================

/**
 * GET /api/student/activities
 * Using activityController for subscription logic & event_date fix
 */
router.get('/student/activities', authenticateToken, activityController.getActivities); // ✅ Updated

router.post('/student/activities/subscribe', authenticateToken, activityController.subscribeToActivity); // ✅ Added subscribe route

router.get('/student/announcements', studentController.getAnnouncements);
console.log("🛠️ Unsubscribe Route is Registering..."); // ✅ ضيف السطر ده هنا
router.post('/student/activities/unsubscribe', authenticateToken, activityController.unsubscribeFromActivity);

// ========================================
// ATTENDANCE ROUTES
// ========================================
router.get('/student/attendance', authenticateToken, studentController.getAttendance);

// ========================================
// COMPLAINTS ROUTES
// ========================================
router.get('/student/complaints', authenticateToken, studentController.getComplaints);
router.post('/student/complaints', authenticateToken, studentController.submitComplaint);

// ========================================
// MAINTENANCE ROUTES
// ========================================
router.get('/student/maintenance', authenticateToken, studentController.getMaintenanceRequests);
router.post('/student/maintenance', authenticateToken, studentController.submitMaintenance);

// ========================================
// PERMISSIONS ROUTES
// ========================================
router.get('/student/permissions', authenticateToken, studentController.getPermissions);
router.post('/student/permissions', authenticateToken, studentController.requestPermission);

// ========================================
// NOTIFICATIONS ROUTES
// ========================================
router.get('/student/notifications', authenticateToken, studentController.getNotifications);
router.post('/student/notifications/:id/read', authenticateToken, studentController.markNotificationAsRead);

// ========================================
// CLEARANCE ROUTES
// ========================================
router.get('/student/clearance', authenticateToken, studentController.getClearanceStatus);
router.post('/student/clearance/initiate', authenticateToken, studentController.initiateClearance);

module.exports = router;
/**
 * ========================================
 * STUDENT CONTROLLER
 * ========================================
 * 
 * Purpose: Handle all student-related requests
 * Implements DataRepository response format for mobile app
 * 
 * Response Format:
 * Success: { success: true, data: {...} }
 * Error:   { success: false, message: "..." }
 * 
 * All methods check student_id from JWT token (req.user.id)
 */

const pool = require('../db');

/**
 * ========================================
 * HELPER FUNCTION - SEND RESPONSE
 * ========================================
 * 
 * Ensures consistent JSON response format
 * Used by all controller methods
 */
const sendResponse = (res, success, data = null, message = null, statusCode = 200) => {
  if (success) {
    return res.status(statusCode).json({
      success: true,
      data: data
    });
  } else {
    return res.status(statusCode).json({
      success: false,
      message: message || 'An error occurred'
    });
  }
};

/**
 * ========================================
 * STUDENT PROFILE - GET
 * ========================================
 * 
 * Fetches student information
 * Returns room as nested object {room_no, building}
 * 
 * Route: GET /api/student/profile
 * Auth: Required (Bearer token)
 */
exports.getProfile = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
         id,
         national_id,
         full_name,
         student_id,
         college,
         academic_year,
         room_no,
         building_name,
         photo_url,
         housing_type,
         created_at,
         updated_at
       FROM students 
       WHERE id = ?`,
      [studentId]
    );

    if (rows.length === 0) {
      return sendResponse(res, false, null, 'Student not found', 404);
    }

    const student = rows[0];

    // Format response with room as object
    const profileData = {
      id: student.id,
      national_id: student.national_id,
      full_name: student.full_name,
      student_id: student.student_id,
      college: student.college,
      academic_year: student.academic_year,
      room: {
        room_no: student.room_no,
        building: student.building_name
      },
      photo_url: student.photo_url,
      housing_type: student.housing_type,
      created_at: student.created_at,
      updated_at: student.updated_at
    };

    return sendResponse(res, true, profileData);

  } catch (err) {
    console.error('Error fetching profile:', err);
    return sendResponse(res, false, null, 'Failed to fetch profile', 500);
  }
};

/**
 * ========================================
 * ACTIVITIES - GET
 * ========================================
 * 
 * Fetches all activities
 * Public endpoint (no student_id filter)
 * 
 * Route: GET /api/student/activities
 * Auth: Optional
 */
exports.getActivities = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         id,
         title,
         description,
         category,
         location,
         date,
         image_url,
         created_at
       FROM activities
       ORDER BY date DESC`
    );

    return sendResponse(res, true, rows);

  } catch (err) {
    console.error('Error fetching activities:', err);
    return sendResponse(res, false, null, 'Failed to fetch activities', 500);
  }
};

/**
 * ========================================
 * ANNOUNCEMENTS - GET
 * ========================================
 * 
 * Fetches all announcements
 * Public endpoint (no student_id filter)
 * 
 * Route: GET /api/student/announcements
 * Auth: Optional
 */
exports.getAnnouncements = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         id,
         title,
         body,
         category,
         priority,
         created_at,
         updated_at
       FROM announcements
       ORDER BY created_at DESC`
    );

    return sendResponse(res, true, rows);

  } catch (err) {
    console.error('Error fetching announcements:', err);
    return sendResponse(res, false, null, 'Failed to fetch announcements', 500);
  }
};

/**
 * ========================================
 * ATTENDANCE - GET
 * ========================================
 * 
 * Fetches attendance logs for logged-in student
 * Returns records for current student only
 * 
 * Route: GET /api/student/attendance
 * Auth: Required
 */
exports.getAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
         id,
         student_id,
         date,
         status,
         created_at
       FROM attendance_logs
       WHERE student_id = ?
       ORDER BY date DESC`,
      [studentId]
    );

    return sendResponse(res, true, rows);

  } catch (err) {
    console.error('Error fetching attendance:', err);
    return sendResponse(res, false, null, 'Failed to fetch attendance', 500);
  }
};

/**
 * ========================================
 * COMPLAINTS - GET
 * ========================================
 * 
 * Fetches all complaints for logged-in student
 * 
 * Route: GET /api/student/complaints
 * Auth: Required
 */
exports.getComplaints = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
         id,
         student_id,
         title,
         description,
         recipient,
         is_secret,
         status,
         admin_reply,
         type,
         created_at,
         updated_at
       FROM complaints
       WHERE student_id = ?
       ORDER BY created_at DESC`,
      [studentId]
    );

    return sendResponse(res, true, rows);

  } catch (err) {
    console.error('Error fetching complaints:', err);
    return sendResponse(res, false, null, 'Failed to fetch complaints', 500);
  }
};

/**
 * ========================================
 * SUBMIT COMPLAINT - POST
 * ========================================
 * 
 * Creates a new complaint for logged-in student
 * 
 * Request Body:
 * {
 *   title: string,
 *   description: string,
 *   recipient: string,
 *   is_secret: boolean,
 *   type: string (General|Urgent)
 * }
 * 
 * Route: POST /api/student/complaints
 * Auth: Required
 */
exports.submitComplaint = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { title, description, recipient, is_secret, type } = req.body;

    // Validation
    if (!title || !description) {
      return sendResponse(res, false, null, 'Title and description are required', 400);
    }

    const [result] = await pool.query(
      `INSERT INTO complaints (student_id, title, description, recipient, is_secret, type, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [studentId, title, description, recipient || 'Management', is_secret || false, type || 'General']
    );

    const complaintData = {
      id: result.insertId,
      student_id: studentId,
      title,
      description,
      recipient: recipient || 'Management',
      is_secret: is_secret || false,
      status: 'Pending',
      type: type || 'General',
      created_at: new Date()
    };

    return sendResponse(res, true, complaintData, null, 201);

  } catch (err) {
    console.error('Error submitting complaint:', err);
    return sendResponse(res, false, null, 'Failed to submit complaint', 500);
  }
};

/**
 * ========================================
 * MAINTENANCE REQUESTS - GET
 * ========================================
 * 
 * Fetches all maintenance requests for logged-in student
 * 
 * Route: GET /api/student/maintenance
 * Auth: Required
 */
exports.getMaintenanceRequests = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
         id,
         student_id,
         category,
         description,
         status,
         supervisor_reply,
         created_at,
         updated_at
       FROM maintenance_requests
       WHERE student_id = ?
       ORDER BY created_at DESC`,
      [studentId]
    );

    return sendResponse(res, true, rows);

  } catch (err) {
    console.error('Error fetching maintenance requests:', err);
    return sendResponse(res, false, null, 'Failed to fetch maintenance requests', 500);
  }
};

/**
 * ========================================
 * SUBMIT MAINTENANCE REQUEST - POST
 * ========================================
 * 
 * Creates a new maintenance request for logged-in student
 * 
 * Request Body:
 * {
 *   category: string (Electric|Plumbing|Net|Furniture|Other),
 *   description: string
 * }
 * 
 * Route: POST /api/student/maintenance
 * Auth: Required
 */
exports.submitMaintenance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { category, description } = req.body;

    // Validation
    if (!category || !description) {
      return sendResponse(res, false, null, 'Category and description are required', 400);
    }

    const [result] = await pool.query(
      `INSERT INTO maintenance_requests (student_id, category, description, status)
       VALUES (?, ?, ?, 'Pending')`,
      [studentId, category, description]
    );

    const maintenanceData = {
      id: result.insertId,
      student_id: studentId,
      category,
      description,
      status: 'Pending',
      supervisor_reply: null,
      created_at: new Date()
    };

    return sendResponse(res, true, maintenanceData, null, 201);

  } catch (err) {
    console.error('Error submitting maintenance request:', err);
    return sendResponse(res, false, null, 'Failed to submit maintenance request', 500);
  }
};

/**
 * ========================================
 * PERMISSIONS - GET
 * ========================================
 * 
 * Fetches all permission requests for logged-in student
 * 
 * Route: GET /api/student/permissions
 * Auth: Required
 */
exports.getPermissions = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
         id,
         student_id,
         type,
         start_date,
         end_date,
         reason,
         status,
         created_at,
         updated_at
       FROM permissions
       WHERE student_id = ?
       ORDER BY created_at DESC`,
      [studentId]
    );

    return sendResponse(res, true, rows);

  } catch (err) {
    console.error('Error fetching permissions:', err);
    return sendResponse(res, false, null, 'Failed to fetch permissions', 500);
  }
};

/**
 * ========================================
 * REQUEST PERMISSION - POST
 * ========================================
 * 
 * Creates a new permission request for logged-in student
 * 
 * Request Body:
 * {
 *   type: string (Late|Travel),
 *   start_date: date (YYYY-MM-DD),
 *   end_date: date (YYYY-MM-DD),
 *   reason: string
 * }
 * 
 * Route: POST /api/student/permissions
 * Auth: Required
 */
exports.requestPermission = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { type, start_date, end_date, reason } = req.body;

    // Validation
    if (!type || !start_date || !end_date || !reason) {
      return sendResponse(
        res,
        false,
        null,
        'Type, start_date, end_date, and reason are required',
        400
      );
    }

    // Validate date format
    if (!isValidDate(start_date) || !isValidDate(end_date)) {
      return sendResponse(res, false, null, 'Invalid date format. Use YYYY-MM-DD', 400);
    }

    const [result] = await pool.query(
      `INSERT INTO permissions (student_id, type, start_date, end_date, reason, status)
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [studentId, type, start_date, end_date, reason]
    );

    const permissionData = {
      id: result.insertId,
      student_id: studentId,
      type,
      start_date,
      end_date,
      reason,
      status: 'Pending',
      created_at: new Date()
    };

    return sendResponse(res, true, permissionData, null, 201);

  } catch (err) {
    console.error('Error requesting permission:', err);
    return sendResponse(res, false, null, 'Failed to request permission', 500);
  }
};

/**
 * ========================================
 * NOTIFICATIONS - GET
 * ========================================
 * 
 * Fetches all notifications for logged-in student
 * 
 * Route: GET /api/student/notifications
 * Auth: Required
 */
exports.getNotifications = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
         id,
         student_id,
         title,
         body,
         is_unread,
         type,
         sender_name,
         created_at
       FROM notifications
       WHERE student_id = ?
       ORDER BY created_at DESC`,
      [studentId]
    );

    return sendResponse(res, true, rows);

  } catch (err) {
    console.error('Error fetching notifications:', err);
    return sendResponse(res, false, null, 'Failed to fetch notifications', 500);
  }
};

/**
 * ========================================
 * MARK NOTIFICATION AS READ - POST
 * ========================================
 * 
 * Marks a notification as read
 * 
 * Route: POST /api/student/notifications/:id/read
 * Auth: Required
 */
exports.markNotificationAsRead = async (req, res) => {
  try {
    const studentId = req.user.id;
    const notificationId = req.params.id;

    // Verify notification belongs to student
    const [notification] = await pool.query(
      'SELECT id FROM notifications WHERE id = ? AND student_id = ?',
      [notificationId, studentId]
    );

    if (notification.length === 0) {
      return sendResponse(res, false, null, 'Notification not found', 404);
    }

    await pool.query(
      'UPDATE notifications SET is_unread = FALSE WHERE id = ?',
      [notificationId]
    );

    return sendResponse(res, true, { message: 'Notification marked as read' });

  } catch (err) {
    console.error('Error marking notification as read:', err);
    return sendResponse(res, false, null, 'Failed to mark notification as read', 500);
  }
};

/**
 * ========================================
 * CLEARANCE STATUS - GET
 * ========================================
 * 
 * Fetches clearance request status for logged-in student
 * 
 * Route: GET /api/student/clearance
 * Auth: Required
 */
exports.getClearanceStatus = async (req, res) => {
  try {
    const studentId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
         id,
         student_id,
         status,
         current_step,
         initiated_at,
         updated_at
       FROM clearance_requests
       WHERE student_id = ?
       LIMIT 1`,
      [studentId]
    );

    if (rows.length === 0) {
      // No clearance request yet
      return sendResponse(res, true, {
        student_id: studentId,
        status: 'Not Initiated',
        current_step: null,
        message: 'No clearance request initiated yet'
      });
    }

    return sendResponse(res, true, rows[0]);

  } catch (err) {
    console.error('Error fetching clearance status:', err);
    return sendResponse(res, false, null, 'Failed to fetch clearance status', 500);
  }
};

/**
 * ========================================
 * INITIATE CLEARANCE - POST
 * ========================================
 * 
 * Creates a new clearance request for logged-in student
 * 
 * Route: POST /api/student/clearance/initiate
 * Auth: Required
 */
exports.initiateClearance = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Check if clearance already exists
    const [existing] = await pool.query(
      'SELECT id FROM clearance_requests WHERE student_id = ?',
      [studentId]
    );

    if (existing.length > 0) {
      return sendResponse(
        res,
        false,
        null,
        'Clearance request already exists for this student',
        400
      );
    }

    const [result] = await pool.query(
      `INSERT INTO clearance_requests (student_id, status, current_step)
       VALUES (?, 'Pending', 'Room Inspection')`,
      [studentId]
    );

    const clearanceData = {
      id: result.insertId,
      student_id: studentId,
      status: 'Pending',
      current_step: 'Room Inspection',
      initiated_at: new Date()
    };

    return sendResponse(res, true, clearanceData, null, 201);

  } catch (err) {
    console.error('Error initiating clearance:', err);
    return sendResponse(res, false, null, 'Failed to initiate clearance', 500);
  }
};

/**
 * ========================================
 * UTILITY FUNCTIONS
 * ========================================
 */

/**
 * Validates date format (YYYY-MM-DD)
 */
const isValidDate = (dateString) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

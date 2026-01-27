/**
 * ========================================
 * STUDENT CONTROLLER (PostgreSQL Version)
 * ========================================
 */

const db = require('../db'); // تأكد أن هذا الملف يصدر pool من مكتبة pg

// Helper: Standardized Response
const sendResponse = (res, success, data = null, message = null, statusCode = 200) => {
  const response = { success };
  if (data) response.data = data;
  if (message) response.message = message;
  return res.status(statusCode).json(response);
};

// Helper: Fix Image URLs (Local -> Absolute)
const fixImageUrl = (req, path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${req.protocol}://${req.get('host')}${path}`;
};

/**
 * 1. UPLOAD PHOTO
 */
exports.uploadPhoto = async (req, res) => {
  try {
    const studentId = req.user.id;

    if (!req.file) {
      return sendResponse(res, false, null, 'No file uploaded', 400);
    }

    // Save relative path in DB, send absolute URL to App
    const relativePath = `/uploads/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${relativePath}`;

    await db.query(
      'UPDATE students SET photo_url = $1 WHERE id = $2',
      [relativePath, studentId]
    );

    return sendResponse(res, true, { photo_url: fullUrl });

  } catch (err) {
    console.error('Error uploading photo:', err);
    return sendResponse(res, false, null, 'Failed to upload photo', 500);
  }
};

/**
 * 2. PROFILE (With Room Join)
 */
exports.getProfile = async (req, res) => {
    try {
        const studentId = req.user.id;
        
        // JOIN to get room details
        const query = `
            SELECT s.*, r.room_number, r.building 
            FROM students s 
            LEFT JOIN rooms r ON s.room_id = r.id 
            WHERE s.id = $1
        `;
        
        const { rows } = await db.query(query, [studentId]);
        
        if (rows.length === 0) return sendResponse(res, false, null, 'Student not found');
        
        const student = rows[0];
        
        const profileData = {
            id: student.id,
            national_id: student.national_id,
            full_name: student.full_name,
            student_id: student.student_id || student.national_id, 
            college: student.faculty,
            academic_year: student.academic_year || 'غير محدد',
            photo_url: fixImageUrl(req, student.photo_url),
            // Return Room as Object
            room: { 
                room_no: student.room_number || 'غير مسكن',
                building: student.building || '---'
            }
        };
        
        sendResponse(res, true, profileData);
    } catch (error) {
        console.error('Profile Error:', error);
        sendResponse(res, false, null, error.message);
    }
};

/**
 * 3. ACTIVITIES (Fix Date & Images)
 */
exports.getActivities = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM activities ORDER BY event_date DESC`
    );

    const activities = rows.map(activity => ({
      ...activity,
      image_url: fixImageUrl(req, activity.image_url),
      date: activity.event_date // Map for Mobile App
    }));

    return sendResponse(res, true, activities);
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

/**
 * 4. ANNOUNCEMENTS
 */
exports.getAnnouncements = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM announcements ORDER BY created_at DESC`
    );
    return sendResponse(res, true, rows);
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

/**
 * 5. ATTENDANCE
 */
exports.getAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { rows } = await db.query(
      `SELECT * FROM attendance_logs WHERE student_id = $1 ORDER BY date DESC`,
      [studentId]
    );
    
    // Normalize status to lowercase
    const formatted = rows.map(r => ({ ...r, status: r.status ? r.status.toLowerCase() : 'present' }));
    
    return sendResponse(res, true, formatted);
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

/**
 * 6. COMPLAINTS (Get & Post)
 */
exports.getComplaints = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { rows } = await db.query(
      `SELECT * FROM complaints WHERE student_id = $1 ORDER BY created_at DESC`,
      [studentId]
    );

    const formatted = rows.map(r => ({ ...r, status: r.status ? r.status.toLowerCase() : 'pending' }));
    return sendResponse(res, true, formatted);
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

exports.submitComplaint = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { title, description, recipient, is_secret, type } = req.body;

    const { rows } = await db.query(
      `INSERT INTO complaints (student_id, title, description, recipient, is_secret, type, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending') RETURNING id`,
      [studentId, title, description, recipient || 'Management', is_secret || false, type || 'General']
    );

    return sendResponse(res, true, { id: rows[0].id }, 'تم إرسال الشكوى بنجاح');
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

/**
 * 7. MAINTENANCE (Get & Post)
 */
exports.getMaintenanceRequests = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { rows } = await db.query(
      `SELECT * FROM maintenance_requests WHERE student_id = $1 ORDER BY created_at DESC`,
      [studentId]
    );

    const formatted = rows.map(r => ({ ...r, status: r.status ? r.status.toLowerCase() : 'pending' }));
    return sendResponse(res, true, formatted);
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

exports.submitMaintenance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { category, description } = req.body;

    const { rows } = await db.query(
      `INSERT INTO maintenance_requests (student_id, category, description, status)
       VALUES ($1, $2, $3, 'Pending') RETURNING id`,
      [studentId, category, description]
    );

    return sendResponse(res, true, { id: rows[0].id }, 'تم إرسال الطلب بنجاح');
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

/**
 * 8. PERMISSIONS (Get & Post)
 */
exports.getPermissions = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { rows } = await db.query(
      `SELECT * FROM permissions WHERE student_id = $1 ORDER BY created_at DESC`,
      [studentId]
    );

    const formatted = rows.map(r => ({ ...r, status: r.status ? r.status.toLowerCase() : 'pending' }));
    return sendResponse(res, true, formatted);
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

exports.requestPermission = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { type, start_date, end_date, reason } = req.body;

    const { rows } = await db.query(
      `INSERT INTO permissions (student_id, type, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'Pending') RETURNING id`,
      [studentId, type, start_date, end_date, reason]
    );

    return sendResponse(res, true, { id: rows[0].id }, 'تم طلب التصريح بنجاح');
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

/**
 * 9. NOTIFICATIONS
 */
exports.getNotifications = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { rows } = await db.query(
      `SELECT * FROM notifications WHERE student_id = $1 ORDER BY created_at DESC`,
      [studentId]
    );
    return sendResponse(res, true, rows);
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

/**
 * 10. CLEARANCE
 */
exports.getClearanceStatus = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { rows } = await db.query(
      `SELECT * FROM clearance_requests WHERE student_id = $1 LIMIT 1`,
      [studentId]
    );

    if (rows.length === 0) {
      return sendResponse(res, true, null); // No clearance
    }
    return sendResponse(res, true, rows[0]);
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

exports.initiateClearance = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Check exist
    const { rows: existing } = await db.query(
        'SELECT id FROM clearance_requests WHERE student_id = $1', [studentId]
    );
    
    if (existing.length > 0) return sendResponse(res, false, null, 'Clearance already started', 400);

    const { rows } = await db.query(
      `INSERT INTO clearance_requests (student_id, status, current_step)
       VALUES ($1, 'Pending', 1) RETURNING id`,
      [studentId]
    );

    return sendResponse(res, true, { id: rows[0].id });
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
  
};
/**
 * 9.5 MARK NOTIFICATION AS READ
 */
exports.markNotificationAsRead = async (req, res) => {
  try {
    const studentId = req.user.id;
    const notificationId = req.params.id;

    // 1. التأكد إن الإشعار يخص الطالب ده
    const { rows } = await db.query(
      'SELECT id FROM notifications WHERE id = $1 AND student_id = $2',
      [notificationId, studentId]
    );

    if (rows.length === 0) {
      return sendResponse(res, false, null, 'Notification not found', 404);
    }

    // 2. تحديث الحالة لمقروء
    await db.query(
      'UPDATE notifications SET is_unread = FALSE WHERE id = $1',
      [notificationId]
    );

    return sendResponse(res, true, null, 'تم تحديد الإشعار كمقروء');
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};
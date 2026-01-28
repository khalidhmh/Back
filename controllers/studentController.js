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
// ✅ التصحيح هنا: استخدام exports بدلاً من const
exports.getProfile = async (req, res) => {
  try {
    const studentId = req.user.id;

    // استعلام شامل يربط الطالب بالغرفة
    const query = `
      SELECT 
        s.id, 
        s.full_name, 
        s.national_id, 
        s.student_id, 
        s.college, 
        s.level,           
        s.address,         
        s.housing_type,    
        s.photo_url, 
        r.building,        
        r.room_number      
      FROM students s
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE s.id = $1
    `;

    const { rows } = await db.query(query, [studentId]);

    if (rows.length === 0) {
      return sendResponse(res, false, null, 'Student not found', 404);
    }

    const student = rows[0];

    // تجهيز البيانات
    const responseData = {
      id: student.id,
      full_name: student.full_name,
      national_id: student.national_id,
      student_id: student.student_id,
      college: student.college,
      level: student.level || 1,
      address: student.address || 'العنوان غير مسجل',
      housing_type: student.housing_type || 'غير محدد',
      photo_url: fixImageUrl(req, student.photo_url),
      housing: student.building ? {
        building: student.building,
        room: student.room_number
      } : null
    };

    return sendResponse(res, true, responseData);

  } catch (error) {
    console.error('Error fetching profile:', error);
    return sendResponse(res, false, null, 'Server error', 500);
  }
};

/**
 * 3. ACTIVITIES (Fix Date & Images)
 */
exports.getActivities = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { rows } = await db.query(
      `SELECT a.*, 
        CASE WHEN s.id IS NOT NULL THEN true ELSE false END as is_subscribed
       FROM activities a
       LEFT JOIN activity_subscriptions s ON a.id = s.activity_id AND s.student_id = $1
       ORDER BY event_date DESC`,
      [studentId]
    );

    const activities = rows.map(activity => ({
      ...activity,
      image_url: fixImageUrl(req, activity.image_url),
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

    if (new Date(end_date) <= new Date(start_date)) {
      return sendResponse(res, false, null, 'End date must be after start date', 400);
    }

    const { rows: conflicts } = await db.query(
      `SELECT id FROM permissions 
       WHERE student_id = $1 
       AND status = 'Pending'
       AND (start_date <= $3 AND end_date >= $2)`,
      [studentId, start_date, end_date]
    );

    if (conflicts.length > 0) {
      return sendResponse(res, false, null, 'You already have a pending request overlapping with these dates', 409);
    }

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
      return sendResponse(res, true, null);
    }
    return sendResponse(res, true, rows[0]);
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

exports.initiateClearance = async (req, res) => {
  try {
    const studentId = req.user.id;

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

    const { rows } = await db.query(
      'SELECT id FROM notifications WHERE id = $1 AND student_id = $2',
      [notificationId, studentId]
    );

    if (rows.length === 0) {
      return sendResponse(res, false, null, 'Notification not found', 404);
    }

    await db.query(
      'UPDATE notifications SET is_unread = FALSE WHERE id = $1',
      [notificationId]
    );

    return sendResponse(res, true, null, 'تم تحديد الإشعار كمقروء');
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};
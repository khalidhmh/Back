/**
 * ========================================
 * STUDENT CONTROLLER (Updated for PostgreSQL & New Schema)
 * ========================================
 */

const db = require('../db');

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

// Helper: Get Student ID from Token safely
const getStudentId = (req) => {
  // التوكن يحتوي على student_id إذا كان المستخدم طالباً
  return req.user.student_id || null;
};

/**
 * 1. UPLOAD PHOTO
 */
exports.uploadPhoto = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    if (!studentId) return sendResponse(res, false, null, 'User is not a student', 403);

    if (!req.file) {
      return sendResponse(res, false, null, 'No file uploaded', 400);
    }

    const relativePath = `/uploads/${req.file.filename}`;
    const fullUrl = fixImageUrl(req, relativePath);

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
 * 2. PROFILE (With Room & Building Join)
 */
exports.getProfile = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    if (!studentId) return sendResponse(res, false, null, 'User is not a student', 403);

    // استعلام شامل يربط الطالب بالغرفة والمبنى
    const query = `
            SELECT 
                s.id, 
                s.full_name, 
                s.national_id, 
                s.faculty,    -- المسمى في الداتا بييز الجديدة
                s.level,           
                s.address,         
                s.photo_url,
                s.phone_number,
                r.room_number,
                b.name as building_name
            FROM students s
            LEFT JOIN rooms r ON s.room_id = r.id
            LEFT JOIN buildings b ON r.building_id = b.id
            WHERE s.id = $1
        `;

    const { rows } = await db.query(query, [studentId]);

    if (rows.length === 0) {
      return sendResponse(res, false, null, 'Student not found', 404);
    }

    const student = rows[0];

    // تجهيز البيانات بنفس هيكلية التطبيق المتوقعة
    const responseData = {
      id: student.id,
      full_name: student.full_name,
      national_id: student.national_id,
      student_id: student.national_id, // استخدام الرقم القومي كـ ID جامعي مؤقتاً
      college: student.faculty,
      level: student.level || 'General',
      address: student.address || '',
      phone: student.phone_number,
      photo_url: fixImageUrl(req, student.photo_url),
      housing: student.building_name ? {
        building: student.building_name,
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
 * 3. ACTIVITIES (With Subscription Status)
 */
exports.getActivities = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    // جلب الأنشطة + عمود يوضح هل الطالب مشترك أم لا
    const query = `
            SELECT a.*, 
                CASE WHEN s.student_id IS NOT NULL THEN true ELSE false END as is_subscribed
            FROM activities a
            LEFT JOIN activity_subscriptions s ON a.id = s.activity_id AND s.student_id = $1
            ORDER BY a.date DESC
        `;

    const { rows } = await db.query(query, [studentId]);

    // تحسين شكل التاريخ والصور
    const activities = rows.map(activity => ({
      ...activity,
      event_date: activity.date, // توحيد المسمى للتطبيق
      // image_url: fixImageUrl(req, activity.image_url) // لو فيه صور للأنشطة
    }));

    return sendResponse(res, true, activities);
  } catch (err) {
    console.error(err);
    return sendResponse(res, false, null, 'Server Error', 500);
  }
};

/**
 * 4. ANNOUNCEMENTS (Linked to Publisher)
 */
exports.getAnnouncements = async (req, res) => {
  try {
    const query = `
            SELECT a.*, u.username as publisher 
            FROM announcements a
            LEFT JOIN users u ON a.created_by_user_id = u.id
            ORDER BY a.created_at DESC
        `;
    const { rows } = await db.query(query);
    return sendResponse(res, true, rows);
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

/**
 * 5. ATTENDANCE (Using 'attendance' table)
 * المحدث لضمان توافق الـ Boolean مع Flutter
 */
exports.getAttendance = async (req, res) => {
  try {
    const studentId = getStudentId(req);

    // تأكد من جلب البيانات المطلوبة فقط
    const query = `
            SELECT att.date, att.status, s.full_name as supervisor_name
            FROM attendance att
            LEFT JOIN supervisors s ON att.recorded_by_supervisor_id = s.id
            WHERE att.student_id = $1 
            ORDER BY att.date DESC
        `;
    const { rows } = await db.query(query, [studentId]);

    const formatted = rows.map(r => {
      // ✅ معالجة ذكية للحالة:
      // نعتبرها true فقط لو كانت true منطقية، أو الرقم 1، أو كلمة 'present'
      const isPresent = (r.status == "Present" || r.status === 1 || String(r.status).toLowerCase() === 'present');
      const date = r.date.toISOString().split('T')[0];
      console.log(date, isPresent);

      return {
        date: date,
        status: isPresent, // إرسال true/false صريحة
        supervisor_name: r.supervisor_name || 'غير محدد'
      };
    });

    return sendResponse(res, true, formatted);
  } catch (err) {
    console.error('❌ Attendance Controller Error:', err);
    return sendResponse(res, false, null, err.message, 500);
  }
};
/**
 * 6. COMPLAINTS
 */
exports.getComplaints = async (req, res) => {
  try {
    const studentId = getStudentId(req);

    const query = `
            SELECT c.*, s.full_name as supervisor_name
            FROM complaints c
            LEFT JOIN supervisors s ON c.supervisor_id = s.id
            WHERE c.student_id = $1 
            ORDER BY c.created_at DESC
        `;

    const { rows } = await db.query(query, [studentId]);

    const formatted = rows.map(r => ({
      ...r,
      status: r.status ? r.status.toLowerCase() : 'pending'
    }));
    return sendResponse(res, true, formatted);
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

exports.submitComplaint = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    const { title, description } = req.body;

    if (!title || !description) {
      return sendResponse(res, false, null, 'العنوان والتفاصيل مطلوبة', 400);
    }

    const { rows } = await db.query(
      `INSERT INTO complaints (student_id, title, description, status)
             VALUES ($1, $2, $3, 'pending') RETURNING id`,
      [studentId, title, description]
    );

    return sendResponse(res, true, { id: rows[0].id }, 'تم إرسال الشكوى بنجاح');
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

/**
 * 7. MAINTENANCE (Enhanced with Location & Images)
 */
exports.getMaintenanceRequests = async (req, res) => {
  try {
    const studentId = getStudentId(req);

    // جلب الطلبات مع الصورة الأولى (Thumbnail)
    const query = `
            SELECT m.*, 
            (SELECT image_url FROM maintenance_images WHERE request_id = m.id LIMIT 1) as image_url
            FROM maintenance_requests m
            WHERE m.student_id = $1
            ORDER BY m.created_at DESC
        `;

    const { rows } = await db.query(query, [studentId]);

    const formatted = rows.map(r => ({
      ...r,
      status: r.status ? r.status.toLowerCase() : 'pending',
      image_url: fixImageUrl(req, r.image_url)
    }));
    return sendResponse(res, true, formatted);
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

exports.submitMaintenance = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    // استقبال البيانات الجديدة (نوع المكان، التفاصيل)
    const { category, description, location_type, location_details } = req.body;

    // قيم افتراضية لضمان عدم حدوث خطأ إذا لم يرسلها التطبيق
    const safeLocationType = location_type || 'room';
    const safeCategory = category || 'other';

    // 1. إدخال الطلب
    const insertQuery = `
            INSERT INTO maintenance_requests 
            (student_id, category, description, location_type, location_details, status)
            VALUES ($1, $2, $3, $4, $5, 'pending') 
            RETURNING id
        `;

    const { rows } = await db.query(insertQuery,
      [studentId, safeCategory, description, safeLocationType, location_details]
    );

    const newRequestId = rows[0].id;

    // 2. إدخال الصورة (إن وجدت)
    if (req.file) {
      const relativePath = `/uploads/${req.file.filename}`;
      await db.query(
        'INSERT INTO maintenance_images (request_id, image_url) VALUES ($1, $2)',
        [newRequestId, relativePath]
      );
    }

    return sendResponse(res, true, { id: newRequestId }, 'تم إرسال طلب الصيانة بنجاح');
  } catch (err) {
    console.error(err);
    return sendResponse(res, false, null, 'حدث خطأ أثناء إرسال الطلب', 500);
  }
};

/**
 * 8. PERMISSIONS
 */
exports.getPermissions = async (req, res) => {
  try {
    const studentId = getStudentId(req);
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
    const studentId = getStudentId(req);
    const { type, start_date, end_date, reason } = req.body;

    if (new Date(end_date) <= new Date(start_date)) {
      return sendResponse(res, false, null, 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية', 400);
    }

    const { rows } = await db.query(
      `INSERT INTO permissions (student_id, type, start_date, end_date, reason, status)
             VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
      [studentId, type, start_date, end_date, reason]
    );

    return sendResponse(res, true, { id: rows[0].id }, 'تم طلب التصريح بنجاح');
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

/**
 * 9. NOTIFICATIONS (Linked to User ID)
 */
exports.getNotifications = async (req, res) => {
  try {
    // الإشعارات مرتبطة بالمستخدم (User) وليس الطالب فقط
    const userId = req.user.id;
    const { rows } = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return sendResponse(res, true, rows);
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const { rowCount } = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );

    if (rowCount === 0) {
      return sendResponse(res, false, null, 'Notification not found', 404);
    }

    return sendResponse(res, true, null, 'تم تحديد الإشعار كمقروء');
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

/**
 * 10. CLEARANCE (Updated Table Name: clearance)
 */
exports.getClearanceStatus = async (req, res) => {
  try {
    const studentId = getStudentId(req);
    // الجدول الجديد اسمه clearance
    const { rows } = await db.query(
      `SELECT * FROM clearance WHERE student_id = $1`,
      [studentId]
    );

    if (rows.length === 0) {
      return sendResponse(res, true, null); // لم يبدأ الإخلاء بعد
    }
    return sendResponse(res, true, rows[0]);
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};

exports.initiateClearance = async (req, res) => {
  try {
    const studentId = getStudentId(req);

    // التأكد من عدم وجود طلب سابق
    const { rows: existing } = await db.query(
      'SELECT id FROM clearance WHERE student_id = $1', [studentId]
    );

    if (existing.length > 0) return sendResponse(res, false, null, 'إجراءات الإخلاء بدأت بالفعل', 400);

    const { rows } = await db.query(
      `INSERT INTO clearance (student_id, status)
             VALUES ($1, 'pending') RETURNING id`,
      [studentId]
    );

    return sendResponse(res, true, { id: rows[0].id }, 'تم بدء إجراءات الإخلاء');
  } catch (err) {
    return sendResponse(res, false, null, err.message, 500);
  }
};
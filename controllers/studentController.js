/**
 * ========================================
 * STUDENT CONTROLLER
 * ========================================
 * * Purpose: Handle student profile and attendance endpoints
 * * Methods:
 * - getProfile: Fetch student details with room info
 * - getAttendance: Fetch attendance logs (Updated with Today's Check-in)
 * - getClearanceStatus: Fetch clearance process status
 * * Security: All routes protected with authenticateToken middleware
 * * @module controllers/studentController
 * @requires ../db - Database connection pool
 */

const db = require('../db');

/**
 * GET STUDENT PROFILE
 * * Retrieves logged-in student's profile information including room details
 * * WHY COMBINE STUDENT + ROOM DATA?
 * - Mobile app needs complete profile in one request
 * - Reduces multiple API calls
 * - JOIN operation is efficient with foreign keys
 * * FLOW:
 * 1. Extract student ID from JWT token (req.user.id)
 * 2. Query students table with room JOIN
 * 3. Return profile with room information
 * * @param {Object} req - Express request object
 * @param {Object} req.user - From JWT token (authenticateToken middleware)
 * @param {number} req.user.id - Student ID from token
 * @param {Object} res - Express response object
 */
exports.getProfile = async (req, res) => {
  try {
    // Extract student ID from JWT token
    const studentId = req.user.id;

    // ========================================
    // QUERY: Get student profile with room info
    // ========================================
    // WHY LEFT JOIN?
    // - Student might not be assigned to a room yet
    // - LEFT JOIN returns NULL for room fields if no match
    // - INNER JOIN would skip students without rooms
    
    const query = `
      SELECT 
        s.id,
        s.national_id,
        s.full_name,
        s.faculty,
        s.phone,
        s.photo_url,
        s.is_suspended,
        s.created_at,
        r.id as room_id,
        r.room_number,
        r.building,
        r.floor,
        r.capacity
      FROM students s
      LEFT JOIN rooms r ON s.room_id = r.id
      WHERE s.id = $1
    `;

    const result = await db.query(query, [studentId]);

    // ========================================
    // RESPONSE HANDLING
    // ========================================
    // Check if student exists
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Transform database row to response format
    const student = result.rows[0];
    const response = {
      success: true,
      student: {
        id: student.id,
        national_id: student.national_id,
        full_name: student.full_name,
        faculty: student.faculty,
        phone: student.phone,
        photo_url: student.photo_url,
        is_suspended: student.is_suspended,
        created_at: student.created_at,
        room: student.room_id ? {
          id: student.room_id,
          room_number: student.room_number,
          building: student.building,
          floor: student.floor,
          capacity: student.capacity
        } : null
      }
    };

    res.status(200).json(response);

  } catch (err) {
    // ========================================
    // ERROR HANDLING
    // ========================================
    console.error('Error fetching student profile:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

/**
 * GET ATTENDANCE LOGS (UPDATED LOGIC)
 * * Retrieves all attendance records for the logged-in student
 * AND checks if the student is checked-in TODAY.
 * * OPTIONAL FILTERS:
 * - ?month=2025-01 - Get attendance for specific month
 * - ?date=2025-01-25 - Get attendance for specific date
 * * WHY INCLUDE DATE FILTER?
 * - Mobile app shows daily, weekly, or monthly views
 * - Reduces data transfer and app processing
 * - More efficient than fetching all history
 * * FLOW:
 * 1. Extract student ID from token
 * 2. Execute Check-in Query: Check if 'Present' record exists for CURRENT_DATE
 * 3. Execute Logs Query: Build dynamic query based on filters
 * 4. Return both isCheckedIn status and the logs list
 * * @param {Object} req - Express request
 * @param {Object} req.user - JWT token data
 * @param {string} req.query.month - Optional: YYYY-MM format
 * @param {string} req.query.date - Optional: YYYY-MM-DD format
 * @param {Object} res - Express response
 */
exports.getAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { month, date } = req.query;

    // ========================================
    // 1. QUERY: CHECK TODAY'S STATUS (NEW)
    // ========================================
    // Check if student is present TODAY using DB server time (CURRENT_DATE)
    // This avoids timezone issues between mobile/server.
    const statusQuery = `
      SELECT EXISTS(
        SELECT 1 FROM attendance_logs 
        WHERE student_id = $1 
        AND date = CURRENT_DATE 
        AND status = 'Present'
      ) as is_checked_in
    `;

    // ========================================
    // 2. QUERY: FETCH LOGS LIST (EXISTING)
    // ========================================
    // Build dynamic query based on filters
    let listQuery = `
      SELECT 
        id,
        student_id,
        date,
        status,
        created_at
      FROM attendance_logs
      WHERE student_id = $1
    `;
    
    const listParams = [studentId];
    let paramIndex = 2;

    // Add month filter if provided
    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid month format. Use YYYY-MM'
        });
      }
      listQuery += ` AND date >= $${paramIndex}::date AND date < ($${paramIndex}::date + INTERVAL '1 month')`;
      listParams.push(month + '-01');
      paramIndex++;
    }

    // Add date filter if provided (overrides month)
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }
      listQuery += ` AND date = $${paramIndex}::date`;
      listParams.push(date);
      paramIndex++;
    }

    // Sort by date (newest first)
    listQuery += ` ORDER BY date DESC`;

    // ========================================
    // EXECUTE QUERIES (PARALLEL)
    // ========================================
    const [statusResult, listResult] = await Promise.all([
      db.query(statusQuery, [studentId]),
      db.query(listQuery, listParams)
    ]);

    // ========================================
    // SEND RESPONSE
    // ========================================
    res.status(200).json({
      success: true,
      // The boolean flag for the Green/Red card
      isCheckedIn: statusResult.rows[0].is_checked_in, 
      count: listResult.rows.length,
      attendance: listResult.rows
    });

  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance'
    });
  }
};

/**
 * GET CLEARANCE STATUS
 * * Retrieves the student's clearance process status
 * * CLEARANCE WORKFLOW:
 * - Pending: Student has not completed clearance
 * - Completed: Student cleared to leave/graduate
 * * WHAT NEEDS TO BE CLEARED:
 * - room_check_passed: Room inspection completed
 * - keys_returned: Room keys returned to admin
 * * WHY SEPARATE ENDPOINT?
 * - Clearance is critical for graduation
 * - Needs real-time status for students
 * - Separate UI section in mobile app
 * * FLOW:
 * 1. Get clearance record for student
 * 2. Calculate completion percentage
 * 3. Return status with progress indicators
 * * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getClearanceStatus = async (req, res) => {
  try {
    const studentId = req.user.id;

    // ========================================
    // QUERY: Get clearance process
    // ========================================
    const query = `
      SELECT 
        id,
        student_id,
        room_check_passed,
        keys_returned,
        status,
        created_at,
        updated_at
      FROM clearance_process
      WHERE student_id = $1
    `;

    const result = await db.query(query, [studentId]);

    // ========================================
    // RESPONSE HANDLING
    // ========================================
    if (result.rows.length === 0) {
      // Student doesn't have clearance record yet
      // This is normal (only created when needed)
      return res.status(404).json({
        success: false,
        message: 'No clearance record found. Clearance not yet initiated.'
      });
    }

    const clearance = result.rows[0];

    // ========================================
    // CALCULATE PROGRESS
    // ========================================
    // Count completed items (room_check_passed and keys_returned)
    const itemsCompleted = (clearance.room_check_passed ? 1 : 0) + 
                          (clearance.keys_returned ? 1 : 0);
    const totalItems = 2;
    const progressPercentage = Math.round((itemsCompleted / totalItems) * 100);

    res.status(200).json({
      success: true,
      clearance: {
        id: clearance.id,
        status: clearance.status,
        room_check_passed: clearance.room_check_passed,
        keys_returned: clearance.keys_returned,
        progress: {
          completed: itemsCompleted,
          total: totalItems,
          percentage: progressPercentage
        },
        created_at: clearance.created_at,
        updated_at: clearance.updated_at
      }
    });

  } catch (err) {
    console.error('Error fetching clearance status:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching clearance status'
    });
  }
};
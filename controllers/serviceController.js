/**
 * ========================================
 * SERVICE CONTROLLER
 * ========================================
 * 
 * Purpose: Handle service requests (complaints, maintenance, permissions)
 * 
 * Methods:
 * - getComplaints: Fetch student's complaints
 * - createComplaint: Submit new complaint
 * - getMaintenance: Fetch maintenance requests
 * - createMaintenance: Submit new maintenance request
 * - getPermissions: Fetch permission requests
 * - requestPermission: Submit new permission request
 * 
 * Security: 
 * - All routes protected with authenticateToken
 * - Input validation on all POST endpoints
 * - Parameterized queries prevent SQL injection
 * 
 * @module controllers/serviceController
 * @requires ../db - Database connection pool
 */

const db = require('../db');

// ============================
// COMPLAINT ENDPOINTS
// ============================

/**
 * GET COMPLAINTS
 * 
 * Retrieves all complaints submitted by the logged-in student
 * 
 * OPTIONAL FILTERS:
 * - ?status=pending - Filter by status
 * - ?type=general - Filter by complaint type
 * 
 * WHY INCLUDE ADMIN REPLY?
 * - Shows student if admin has responded
 * - Important for tracking resolution progress
 * - Mobile app displays replies in a chat-like view
 * 
 * FLOW:
 * 1. Get all complaints for this student
 * 2. Apply filters if provided
 * 3. Sort by newest first
 * 
 * @param {Object} req - Express request
 * @param {Object} req.user - JWT token data
 * @param {string} req.query.status - Optional: pending/resolved
 * @param {string} req.query.type - Optional: general/urgent
 * @param {Object} res - Express response
 */
exports.getComplaints = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status, type } = req.query;

    // ========================================
    // BUILD QUERY WITH FILTERS
    // ========================================
    let query = `
      SELECT 
        id,
        student_id,
        title,
        description,
        type,
        status,
        is_secret,
        admin_reply,
        created_at,
        updated_at
      FROM complaints
      WHERE student_id = $1
    `;

    const params = [studentId];
    let paramIndex = 2;

    // Add status filter if provided
    if (status && ['pending', 'resolved'].includes(status)) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Add type filter if provided
    if (type && ['general', 'urgent'].includes(type)) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    // Sort by newest first
    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      complaints: result.rows
    });

  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching complaints'
    });
  }
};

/**
 * CREATE COMPLAINT
 * 
 * Inserts a new complaint into the database
 * 
 * REQUEST BODY:
 * {
 *   title: string (required, max 200 chars),
 *   description: string (required),
 *   type: string (required, 'general' or 'urgent'),
 *   is_secret: boolean (optional, defaults to false)
 * }
 * 
 * WHY SEPARATE TITLE AND DESCRIPTION?
 * - Title: Quick subject line for admin list
 * - Description: Full details for investigation
 * - Mobile app shows title in list, description in detail view
 * 
 * WHY IS_SECRET?
 * - Some complaints are sensitive (harassment, health issues)
 * - Only student and designated admin see secret complaints
 * - Non-secret complaints visible to management team
 * 
 * FLOW:
 * 1. Validate required fields
 * 2. Validate input lengths and types
 * 3. Insert into complaints table
 * 4. Return created complaint with ID
 * 
 * @param {Object} req - Express request
 * @param {Object} req.body - Request body
 * @param {string} req.body.title - Complaint title
 * @param {string} req.body.description - Full description
 * @param {string} req.body.type - 'general' or 'urgent'
 * @param {boolean} req.body.is_secret - Optional, defaults to false
 * @param {Object} res - Express response
 */
exports.createComplaint = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { title, description, type, is_secret } = req.body;

    // ========================================
    // INPUT VALIDATION
    // ========================================
    // Check required fields
    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: 'title, description, and type are required'
      });
    }

    // Validate type (must be 'general' or 'urgent')
    if (!['general', 'urgent'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be 'general' or 'urgent'"
      });
    }

    // Validate title length
    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'title must be 200 characters or less'
      });
    }

    // Validate description length
    if (description.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'description must be 5000 characters or less'
      });
    }

    // ========================================
    // INSERT COMPLAINT
    // ========================================
    // Default is_secret to false if not provided
    const isSecret = is_secret === true ? true : false;

    // WHY STATUS = 'pending'?
    // - All new complaints start as pending
    // - Admin reviews and can mark as resolved
    // - No student should be able to mark as resolved

    const query = `
      INSERT INTO complaints (student_id, title, description, type, status, is_secret)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        student_id,
        title,
        description,
        type,
        status,
        is_secret,
        admin_reply,
        created_at,
        updated_at
    `;

    const result = await db.query(query, [
      studentId,
      title,
      description,
      type,
      'pending',
      isSecret
    ]);

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: result.rows[0]
    });

  } catch (err) {
    console.error('Error creating complaint:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while creating complaint'
    });
  }
};

// ============================
// MAINTENANCE ENDPOINTS
// ============================

/**
 * GET MAINTENANCE REQUESTS
 * 
 * Retrieves all maintenance requests for the student's room
 * 
 * WHY GET ROOM MAINTENANCE?
 * - Maintenance issues affect the entire room
 * - All room occupants should see open maintenance requests
 * - Student wants to know when room issues will be fixed
 * 
 * OPTIONAL FILTERS:
 * - ?status=open - Filter by status
 * - ?category=electrical - Filter by category
 * 
 * FLOW:
 * 1. Get student's room ID from token
 * 2. Fetch all maintenance for that room
 * 3. Include supervisor replies
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getMaintenance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status, category } = req.query;

    // ========================================
    // QUERY: Get student's room first
    // ========================================
    const studentQuery = 'SELECT room_id FROM students WHERE id = $1';
    const studentResult = await db.query(studentQuery, [studentId]);

    if (studentResult.rows.length === 0 || !studentResult.rows[0].room_id) {
      return res.status(404).json({
        success: false,
        message: 'Student is not assigned to a room'
      });
    }

    const roomId = studentResult.rows[0].room_id;

    // ========================================
    // QUERY: Get maintenance requests
    // ========================================
    let query = `
      SELECT 
        id,
        room_id,
        category,
        description,
        status,
        supervisor_reply,
        created_at,
        updated_at
      FROM maintenance_requests
      WHERE room_id = $1
    `;

    const params = [roomId];
    let paramIndex = 2;

    // Add status filter if provided
    if (status && ['open', 'fixed', 'in_progress'].includes(status)) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Add category filter if provided
    if (category) {
      query += ` AND LOWER(category) = LOWER($${paramIndex})`;
      params.push(category);
      paramIndex++;
    }

    // Sort by newest first
    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      maintenance: result.rows
    });

  } catch (err) {
    console.error('Error fetching maintenance:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching maintenance'
    });
  }
};

/**
 * CREATE MAINTENANCE REQUEST
 * 
 * Inserts a new maintenance request for the student's room
 * 
 * REQUEST BODY:
 * {
 *   category: string (required, e.g., 'plumbing', 'electrical', 'door', 'other'),
 *   description: string (required)
 * }
 * 
 * WHY CATEGORY?
 * - Helps maintenance team prioritize
 * - Electrical issues might be more urgent than cosmetic
 * - Admin can filter by category
 * 
 * WHY LINKED TO ROOM, NOT STUDENT?
 * - Multiple students in one room
 * - All benefit from the maintenance
 * - Issue affects the room, not an individual student
 * 
 * FLOW:
 * 1. Get student's room ID
 * 2. Validate inputs
 * 3. Create maintenance request for that room
 * 4. Return created record
 * 
 * @param {Object} req - Express request
 * @param {Object} req.body - Request body
 * @param {string} req.body.category - Issue category
 * @param {string} req.body.description - Issue description
 * @param {Object} res - Express response
 */
exports.createMaintenance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { category, description } = req.body;

    // ========================================
    // INPUT VALIDATION
    // ========================================
    if (!category || !description) {
      return res.status(400).json({
        success: false,
        message: 'category and description are required'
      });
    }

    // ========================================
    // GET STUDENT'S ROOM
    // ========================================
    const studentQuery = 'SELECT room_id FROM students WHERE id = $1';
    const studentResult = await db.query(studentQuery, [studentId]);

    if (studentResult.rows.length === 0 || !studentResult.rows[0].room_id) {
      return res.status(400).json({
        success: false,
        message: 'You must be assigned to a room to request maintenance'
      });
    }

    const roomId = studentResult.rows[0].room_id;

    // ========================================
    // INSERT MAINTENANCE REQUEST
    // ========================================
    const query = `
      INSERT INTO maintenance_requests (room_id, category, description, status)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id,
        room_id,
        category,
        description,
        status,
        supervisor_reply,
        created_at,
        updated_at
    `;

    const result = await db.query(query, [
      roomId,
      category,
      description,
      'open'  // All new requests start as 'open'
    ]);

    res.status(201).json({
      success: true,
      message: 'Maintenance request submitted successfully',
      maintenance: result.rows[0]
    });

  } catch (err) {
    console.error('Error creating maintenance request:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while creating maintenance request'
    });
  }
};

// ============================
// PERMISSION ENDPOINTS
// ============================

/**
 * GET PERMISSIONS
 * 
 * Retrieves all permission requests for the logged-in student
 * 
 * OPTIONAL FILTERS:
 * - ?status=approved - Filter by status
 * - ?type=travel - Filter by type
 * 
 * WHY SEPARATE PERMISSIONS?
 * - Housing has strict rules about where students can be
 * - Student needs permission to be outside campus
 * - Admin monitors who's off-campus when
 * 
 * PERMISSION TYPES:
 * - travel: Off-campus for extended period
 * - late: Coming back late to residence
 * - medical: Medical appointment or emergency
 * - other: Other valid reasons
 * 
 * FLOW:
 * 1. Get all permission requests for student
 * 2. Apply filters
 * 3. Sort by date (upcoming first)
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getPermissions = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status, type } = req.query;

    // ========================================
    // BUILD QUERY WITH FILTERS
    // ========================================
    let query = `
      SELECT 
        id,
        student_id,
        type,
        reason,
        start_date,
        end_date,
        status,
        admin_remarks,
        created_at,
        updated_at
      FROM permissions
      WHERE student_id = $1
    `;

    const params = [studentId];
    let paramIndex = 2;

    // Add status filter if provided
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Add type filter if provided
    if (type && ['travel', 'late', 'medical', 'other'].includes(type)) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    // Sort by start_date (upcoming first)
    query += ` ORDER BY start_date DESC`;

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      permissions: result.rows
    });

  } catch (err) {
    console.error('Error fetching permissions:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching permissions'
    });
  }
};

/**
 * REQUEST PERMISSION
 * 
 * Inserts a new permission request
 * 
 * REQUEST BODY:
 * {
 *   type: string (required, 'travel'/'late'/'medical'/'other'),
 *   start_date: string (required, YYYY-MM-DD),
 *   end_date: string (required, YYYY-MM-DD),
 *   reason: string (required)
 * }
 * 
 * DATE LOGIC:
 * - start_date: When student will be away/late
 * - end_date: When student will return/be back
 * - Both in future (can't request retroactive permission)
 * - end_date must be >= start_date
 * 
 * WHY REASON?
 * - Admin needs context to approve/reject
 * - Medical > Travel in urgency
 * - Helps admin make fair decisions
 * 
 * FLOW:
 * 1. Validate all inputs
 * 2. Check dates are in future
 * 3. Check end_date >= start_date
 * 4. Insert permission request
 * 5. Status defaults to 'pending'
 * 
 * @param {Object} req - Express request
 * @param {Object} req.body - Request body
 * @param {string} req.body.type - Permission type
 * @param {string} req.body.start_date - YYYY-MM-DD
 * @param {string} req.body.end_date - YYYY-MM-DD
 * @param {string} req.body.reason - Why permission is needed
 * @param {Object} res - Express response
 */
exports.requestPermission = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { type, start_date, end_date, reason } = req.body;

    // ========================================
    // INPUT VALIDATION
    // ========================================
    if (!type || !start_date || !end_date || !reason) {
      return res.status(400).json({
        success: false,
        message: 'type, start_date, end_date, and reason are required'
      });
    }

    // Validate type
    if (!['travel', 'late', 'medical', 'other'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be 'travel', 'late', 'medical', or 'other'"
      });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
      return res.status(400).json({
        success: false,
        message: 'Dates must be in YYYY-MM-DD format'
      });
    }

    // Parse dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check dates are valid
    if (isNaN(startDate) || isNaN(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Check dates are not in the past
    if (startDate < today) {
      return res.status(400).json({
        success: false,
        message: 'start_date cannot be in the past'
      });
    }

    // Check end_date >= start_date
    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'end_date must be greater than or equal to start_date'
      });
    }

    // ========================================
    // INSERT PERMISSION REQUEST
    // ========================================
    const query = `
      INSERT INTO permissions (student_id, type, start_date, end_date, reason, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        student_id,
        type,
        reason,
        start_date,
        end_date,
        status,
        admin_remarks,
        created_at,
        updated_at
    `;

    const result = await db.query(query, [
      studentId,
      type,
      start_date,
      end_date,
      reason,
      'pending'  // All new requests start as 'pending'
    ]);

    res.status(201).json({
      success: true,
      message: 'Permission request submitted successfully',
      permission: result.rows[0]
    });

  } catch (err) {
    console.error('Error creating permission request:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while creating permission request'
    });
  }
};

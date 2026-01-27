/**
 * ========================================
 * ACTIVITY CONTROLLER
 * ========================================
 * 
 * Purpose: Handle activity and announcement endpoints
 * 
 * Methods:
 * - getActivities: Fetch all upcoming activities with subscription status
 * - subscribeToActivity: Subscribe student to an activity
 * - getAnnouncements: Fetch all announcements
 * 
 * Security:
 * - All routes protected with authenticateToken
 * - Input validation on POST endpoints
 * - Parameterized queries for SQL injection prevention
 * 
 * @module controllers/activityController
 * @requires ../db - Database connection pool
 */

const db = require('../db');

/**
 * GET ACTIVITIES
 * 
 * Retrieves all upcoming activities with student's subscription status
 * 
 * WHY INCLUDE SUBSCRIPTION STATUS?
 * - Mobile app shows "Subscribe" or "Unsubscribe" button based on status
 * - Reduces need for separate API call to check subscription
 * - Better UX: Student can see at a glance which activities they're in
 * 
 * LOGIC:
 * - Query activities table
 * - Use LEFT JOIN with activity_subscriptions to get subscription status
 * - If subscription exists for this student, subscribed = true
 * - If no subscription, subscribed = false
 * - Filter to only upcoming activities (date in future)
 * 
 * OPTIONAL FILTERS:
 * - ?limit=10 - Get only N activities (default: all)
 * 
 * FLOW:
 * 1. Build query with activity info and subscription status
 * 2. Only include activities with future dates
 * 3. Sort by date (soonest first)
 * 4. Include participant count
 * 
 * @param {Object} req - Express request
 * @param {Object} req.user - JWT token data
 * @param {string} req.query.limit - Optional: limit number of results
 * @param {Object} res - Express response
 */
exports.getActivities = async (req, res) => {
  try {
    const studentId = req.user.id;
    const limit = parseInt(req.query.limit) || null;

    // ========================================
    // QUERY: Get activities with subscription status
    // ========================================
    // WHY LEFT JOIN?
    // - Shows all activities, with NULL subscription if not subscribed
    // - Uses CASE to convert NULL to false and row existence to true
    // 
    // WHY COUNT(*)?
    // - Shows how many students are registered for activity
    // - Mobile app shows "15 students interested"
    // - Helps student decide to join based on popularity

    let query = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.event_date,
        a.location,
        a.max_participants,
        COALESCE(COUNT(DISTINCT asub.id) FILTER (WHERE asub.activity_id IS NOT NULL), 0) as participant_count,
        CASE 
          WHEN sub.id IS NOT NULL THEN true 
          ELSE false 
        END as is_subscribed,
        a.created_at
      FROM activities a
      LEFT JOIN activity_subscriptions asub ON a.id = asub.activity_id
      LEFT JOIN activity_subscriptions sub ON a.id = sub.activity_id AND sub.student_id = $1
      WHERE a.event_date > NOW()
      GROUP BY a.id, a.title, a.description, a.event_date, a.location, a.max_participants, sub.id
      ORDER BY a.event_date ASC
    `;

    const params = [studentId];

    // Add LIMIT if provided
    if (limit && limit > 0) {
      query += ` LIMIT $2`;
      params.push(limit);
    }

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      activities: result.rows
    });

  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activities'
    });
  }
};

/**
 * SUBSCRIBE TO ACTIVITY
 * 
 * Subscribes the student to an activity
 * 
 * REQUEST BODY:
 * {
 *   activity_id: number (required)
 * }
 * 
 * FLOW:
 * 1. Validate activity exists
 * 2. Check if activity is still accepting registrations (not full)
 * 3. Check student is not already subscribed
 * 4. Insert into activity_subscriptions
 * 5. Return success
 * 
 * ERROR SCENARIOS:
 * - Activity not found (404)
 * - Activity is full (400)
 * - Student already subscribed (409)
 * 
 * WHY NOT JUST INSERT?
 * - Need to validate activity still has capacity
 * - Need to prevent duplicate subscriptions
 * - Need to provide meaningful error messages
 * 
 * @param {Object} req - Express request
 * @param {Object} req.body - Request body
 * @param {number} req.body.activity_id - Activity to subscribe to
 * @param {Object} res - Express response
 */
exports.subscribeToActivity = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { activity_id } = req.body;

    // ========================================
    // INPUT VALIDATION
    // ========================================
    if (!activity_id) {
      return res.status(400).json({
        success: false,
        message: 'activity_id is required'
      });
    }

    // ========================================
    // CHECK: Activity exists and has capacity
    // ========================================
    // WHY GET PARTICIPANT COUNT?
    // - Need to check if activity is full
    // - max_participants limits registration
    // - Student can't subscribe if activity is full

    const activityCheck = `
      SELECT 
        a.id,
        a.title,
        a.max_participants,
        COUNT(asub.id) as current_participants
      FROM activities a
      LEFT JOIN activity_subscriptions asub ON a.id = asub.activity_id
      WHERE a.id = $1
      GROUP BY a.id, a.title, a.max_participants
    `;

    const activityResult = await db.query(activityCheck, [activity_id]);

    // Activity not found
    if (activityResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    const activity = activityResult.rows[0];

    // Activity is full
    if (activity.current_participants >= activity.max_participants) {
      return res.status(400).json({
        success: false,
        message: `Activity "${activity.title}" is full (${activity.current_participants}/${activity.max_participants} participants)`
      });
    }

    // ========================================
    // CHECK: Student not already subscribed
    // ========================================
    const subscriptionCheck = `
      SELECT id FROM activity_subscriptions
      WHERE student_id = $1 AND activity_id = $2
    `;

    const subResult = await db.query(subscriptionCheck, [studentId, activity_id]);

    if (subResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You are already subscribed to this activity'
      });
    }

    // ========================================
    // INSERT SUBSCRIPTION
    // ========================================
    const insertQuery = `
      INSERT INTO activity_subscriptions (student_id, activity_id)
      VALUES ($1, $2)
      RETURNING 
        id,
        student_id,
        activity_id,
        created_at
    `;

    const insertResult = await db.query(insertQuery, [studentId, activity_id]);

    res.status(201).json({
      success: true,
      message: `Successfully subscribed to "${activity.title}"`,
      subscription: insertResult.rows[0]
    });

  } catch (err) {
    // Handle unique constraint violation (shouldn't happen with our checks, but just in case)
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'You are already subscribed to this activity'
      });
    }

    // Handle foreign key constraint
    if (err.code === '23503') {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    console.error('Error subscribing to activity:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while subscribing to activity'
    });
  }
};

/**
 * GET ANNOUNCEMENTS
 * 
 * Retrieves all announcements for students
 * 
 * WHY SEPARATE ENDPOINT?
 * - Announcements are one-way (admin → students)
 * - Not user-generated like complaints
 * - Important information about housing operations
 * - Should be prominently displayed in mobile app
 * 
 * ANNOUNCEMENT TYPES:
 * - General: Regular updates
 * - Urgent: Require immediate attention
 * - Maintenance: Upcoming maintenance work
 * - Event: Important dates/deadlines
 * 
 * OPTIONAL FILTERS:
 * - ?limit=10 - Get only last N announcements (default: all)
 * - ?category=maintenance - Filter by category
 * 
 * FLOW:
 * 1. Query all announcements
 * 2. Sort by newest first (most recent announcements first)
 * 3. Apply optional filters
 * 4. Include creation date for "Posted X days ago" display
 * 
 * @param {Object} req - Express request
 * @param {Object} req.query.limit - Optional: limit results
 * @param {Object} req.query.category - Optional: filter by category
 * @param {Object} res - Express response
 */
exports.getAnnouncements = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || null;
    const category = req.query.category;

    // ========================================
    // BUILD QUERY WITH FILTERS
    // ========================================
    let query = `
      SELECT 
        id,
        title,
        content,
        category,
        created_at,
        updated_at
      FROM announcements
      WHERE 1=1
    `;

    const params = [];

    // Add category filter if provided
    if (category) {
      query += ` AND LOWER(category) = LOWER($${params.length + 1})`;
      params.push(category);
    }

    // Sort by newest first
    query += ` ORDER BY created_at DESC`;

    // Add LIMIT if provided
    if (limit && limit > 0) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      announcements: result.rows
    });

  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching announcements'
    });
  }
};

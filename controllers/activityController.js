/**
 * ========================================
 * ACTIVITY CONTROLLER (Fixed & Standardized)
 * ========================================
 */

const db = require('../db');

// 1. Get Activities (Fixed: Return 'data' instead of 'activities')
exports.getActivities = async (req, res) => {
  try {
    const studentId = req.user.id;
    const limit = parseInt(req.query.limit) || null;

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

    if (limit && limit > 0) {
      query += ` LIMIT $2`;
      params.push(limit);
    }

    const result = await db.query(query, params);

    // Map result to ensure consistent date field for frontend
    const activities = result.rows.map(act => ({
      ...act,
      date: act.event_date // Keep compatibility
    }));

    res.status(200).json({
      success: true,
      message: 'Activities fetched successfully',
      data: activities // ✅ FIXED: Renamed 'activities' to 'data' to match Frontend expectations
    });

  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activities'
    });
  }
};

// 2. Subscribe to Activity
exports.subscribeToActivity = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { activity_id } = req.body;

    if (!activity_id) {
      return res.status(400).json({ success: false, message: 'activity_id is required' });
    }

    // Check if activity exists and has space
    // Note: We use COALESCE/COUNT to handle cases with no subscriptions
    const activityCheck = `
      SELECT 
        a.id,
        a.title,
        a.max_participants,
        (SELECT COUNT(*) FROM activity_subscriptions WHERE activity_id = a.id) as current_participants
      FROM activities a
      WHERE a.id = $1
    `;

    const activityResult = await db.query(activityCheck, [activity_id]);

    if (activityResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const activity = activityResult.rows[0];

    // Check capacity
    if (activity.max_participants && activity.current_participants >= activity.max_participants) {
      return res.status(400).json({
        success: false,
        message: `Activity is full (${activity.current_participants}/${activity.max_participants})`
      });
    }

    // Check if already subscribed
    const checkSub = await db.query(
      'SELECT id FROM activity_subscriptions WHERE student_id = $1 AND activity_id = $2',
      [studentId, activity_id]
    );

    if (checkSub.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Already subscribed' });
    }

    // Insert Subscription
    const insertQuery = `
      INSERT INTO activity_subscriptions (student_id, activity_id)
      VALUES ($1, $2)
      RETURNING id, created_at
    `;

    const insertResult = await db.query(insertQuery, [studentId, activity_id]);

    res.status(201).json({
      success: true,
      message: `Successfully subscribed to "${activity.title}"`,
      data: insertResult.rows[0]
    });

  } catch (err) {
    console.error('Error subscribing:', err);
    res.status(500).json({ success: false, message: 'Server error while subscribing' });
  }
};

// 3. Unsubscribe from Activity (New Feature)
exports.unsubscribeFromActivity = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { activity_id } = req.body;

    if (!activity_id) {
      return res.status(400).json({ success: false, message: 'activity_id is required' });
    }

    const deleteQuery = `
      DELETE FROM activity_subscriptions 
      WHERE student_id = $1 AND activity_id = $2
    `;

    const result = await db.query(deleteQuery, [studentId, activity_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found or already cancelled'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed'
    });

  } catch (err) {
    console.error('Error unsubscribing:', err);
    res.status(500).json({ success: false, message: 'Server error while unsubscribing' });
  }
};

// 4. Get Announcements (Existing)
exports.getAnnouncements = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || null;
    const category = req.query.category;

    let query = `SELECT * FROM announcements WHERE 1=1`;
    const params = [];

    if (category) {
      query += ` AND LOWER(category) = LOWER($${params.length + 1})`;
      params.push(category);
    }

    query += ` ORDER BY created_at DESC`;

    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }

    const result = await db.query(query, params);

    res.status(200).json({
      success: true,
      data: result.rows // Standardized to 'data'
    });

  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
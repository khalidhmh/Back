/**
 * ========================================
 * ACTIVITY CONTROLLER
 * ========================================
 */

const db = require('../db');

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
        date: act.event_date // Keep compatibility if frontend uses 'date'
    }));

    res.status(200).json({
      success: true,
      count: activities.length,
      activities: activities
    });

  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activities'
    });
  }
};

exports.subscribeToActivity = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { activity_id } = req.body;

    if (!activity_id) {
      return res.status(400).json({
        success: false,
        message: 'activity_id is required'
      });
    }

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

    if (activityResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    const activity = activityResult.rows[0];

    if (activity.current_participants >= activity.max_participants) {
      return res.status(400).json({
        success: false,
        message: `Activity "${activity.title}" is full (${activity.current_participants}/${activity.max_participants} participants)`
      });
    }

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
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'You are already subscribed to this activity'
      });
    }
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

exports.getAnnouncements = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || null;
    const category = req.query.category;

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

    if (category) {
      query += ` AND LOWER(category) = LOWER($${params.length + 1})`;
      params.push(category);
    }

    query += ` ORDER BY created_at DESC`;

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
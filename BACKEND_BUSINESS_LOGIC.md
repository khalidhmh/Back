# Backend Business Logic & Automation Rules

**Version:** 2.0  
**Date:** 2026-01-28  
**Status:** Implementation Ready  
**Audience:** Backend Developer / Systems Architect

---

## Overview

This document defines the automated business rules and validation logic that the Backend must enforce to support the Student Housing App v2. These rules ensure data consistency, prevent invalid operations, and trigger automated actions.

---

## Table of Contents

1. [Rule 1: Automated Attendance Check (Cron Job)](#rule-1-automated-attendance-check-cron-job)
2. [Rule 2: Permission Validation (Request Level)](#rule-2-permission-validation-request-level)
3. [Rule 3: Notifications Trigger (Admin Reply)](#rule-3-notifications-trigger-admin-reply)
4. [Implementation Checklist](#implementation-checklist)
5. [Database Considerations](#database-considerations)

---

## Rule 1: Automated Attendance Check (Cron Job)

### Overview
Daily automated process to ensure every student has an attendance record for each day. This is critical because the mobile app displays a red (absent) or green (present) status indicator based on the existence of an attendance record.

### Schedule
- **Frequency:** Daily
- **Time:** 11:00 PM (23:00) Server Time
- **Timezone:** Use server's configured timezone (recommend UTC)

### Logic Flow

```
CRON: 23:00 Daily
  └─ SELECT ALL ACTIVE STUDENTS
     └─ FOR EACH student:
        └─ CHECK: Does attendance_logs have record for (student_id, TODAY)?
           ├─ YES → SKIP (record already exists)
           └─ NO → INSERT new record with status='absent'
```

### SQL Implementation

```sql
-- Pseudo-code for cron job logic
-- To be executed daily at 23:00
SELECT id FROM students WHERE is_suspended = FALSE;
-- FOR EACH student_id:
  INSERT INTO attendance_logs (student_id, date, status, created_at)
  SELECT 
    $1,                    -- student_id parameter
    CURRENT_DATE,          -- today's date
    'absent',              -- default absent status
    CURRENT_TIMESTAMP
  WHERE NOT EXISTS (
    SELECT 1 FROM attendance_logs 
    WHERE student_id = $1 AND date = CURRENT_DATE
  );
```

### Node.js/Express Implementation (node-cron)

```javascript
// File: jobs/attendanceCheckJob.js

const cron = require('node-cron');
const db = require('../db');

/**
 * Automated Daily Attendance Check
 * Runs at 11:00 PM daily to mark absent students
 */
const scheduleAttendanceCheck = () => {
  // Cron expression: 0 23 * * * = 11:00 PM every day
  cron.schedule('0 23 * * *', async () => {
    try {
      console.log('🕙 [CRON] Starting daily attendance check...');
      
      // Get all active (non-suspended) students
      const { rows: students } = await db.query(
        'SELECT id FROM students WHERE is_suspended = FALSE'
      );
      
      console.log(`Found ${students.length} active students`);
      
      // For each student, check if attendance record exists for today
      let markedAbsent = 0;
      for (const student of students) {
        const { rows } = await db.query(
          `SELECT id FROM attendance_logs 
           WHERE student_id = $1 AND date = CURRENT_DATE`,
          [student.id]
        );
        
        // If no record exists, insert absent record
        if (rows.length === 0) {
          await db.query(
            `INSERT INTO attendance_logs (student_id, date, status, created_at)
             VALUES ($1, CURRENT_DATE, 'absent', CURRENT_TIMESTAMP)`,
            [student.id]
          );
          markedAbsent++;
        }
      }
      
      console.log(`✅ Attendance check completed. Marked ${markedAbsent} students as absent.`);
    } catch (error) {
      console.error('❌ [CRON ERROR] Attendance check failed:', error.message);
      // Optionally send alert to admin
    }
  });
  
  console.log('✓ Attendance check cron job scheduled (Daily at 23:00)');
};

module.exports = { scheduleAttendanceCheck };

// File: server.js
const { scheduleAttendanceCheck } = require('./jobs/attendanceCheckJob');

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  scheduleAttendanceCheck(); // Start the cron job
});
```

### Why This Matters

- **Mobile App Requirement:** The app displays a status indicator (✅ Present / ❌ Absent) only if a record exists
- **Data Consistency:** Without this, new students with no manual attendance entry would have no status indicator
- **Business Logic:** The rule "no record = student didn't check in = absent" is the system's default behavior

---

## Rule 2: Permission Validation (Request Level)

### Overview
Two validation checks must be performed before accepting a permission request submission.

### Endpoint
`POST /student/permissions`

### Validations Required

#### Validation 2.1: Date Range Logic
**Check:** `end_date` must not be before `start_date`

```
IF end_date < start_date THEN
  REJECT request immediately
  RETURN error: "End date cannot be before start date"
  HTTP Status: 400 Bad Request
ELSE
  Continue to next validation
```

#### Validation 2.2: Duplicate Pending Check
**Check:** Student must not have another pending permission request

```
IF EXISTS (
  SELECT 1 FROM permissions 
  WHERE student_id = $1 
    AND status = 'pending' 
    AND (
      -- Check for overlapping date ranges
      (new_start_date <= existing_end_date) 
      AND (new_end_date >= existing_start_date)
    )
) THEN
  REJECT request immediately
  RETURN error: "You already have an active permission request for these dates"
  HTTP Status: 400 Bad Request
ELSE
  Accept request, insert new permission record
```

### Implementation Details

**Request Body:**
```json
{
  "type": "Late|Travel",
  "start_date": "2026-02-01",
  "end_date": "2026-02-05",
  "reason": "Family visit for father's birthday"
}
```

**Validation Flow in Controller:**

```javascript
// File: controllers/studentController.js
exports.requestPermission = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { type, start_date, end_date, reason } = req.body;
    
    // ============ VALIDATION 2.1: Date Range Check ============
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (endDate < startDate) {
      return sendResponse(
        res, 
        false, 
        null, 
        'End date cannot be before start date',
        400
      );
    }
    
    // ============ VALIDATION 2.2: Duplicate Pending Check ============
    const { rows: existingPermissions } = await db.query(
      `SELECT id FROM permissions 
       WHERE student_id = $1 
         AND status = 'pending'
         AND (
           ($2::DATE <= end_date) 
           AND ($3::DATE >= start_date)
         )`,
      [studentId, start_date, end_date]
    );
    
    if (existingPermissions.length > 0) {
      return sendResponse(
        res,
        false,
        null,
        'You already have an active permission request for these dates',
        400
      );
    }
    
    // ============ INSERT PERMISSION ============
    const { rows } = await db.query(
      `INSERT INTO permissions 
       (student_id, type, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [studentId, type, start_date, end_date, reason]
    );
    
    return sendResponse(res, true, rows[0], 'Permission request submitted');
    
  } catch (error) {
    console.error('Permission request error:', error);
    return sendResponse(res, false, null, error.message, 500);
  }
};
```

### Error Response Examples

**Scenario 1: Invalid Date Range**
```json
{
  "success": false,
  "message": "End date cannot be before start date"
}
```

**Scenario 2: Duplicate Pending Request**
```json
{
  "success": false,
  "message": "You already have an active permission request for these dates"
}
```

---

## Rule 3: Notifications Trigger (Admin Reply)

### Overview
When an administrator adds a reply to a complaint, a notification record must be automatically created for the student to alert them of the response.

### Trigger Event
**When:** Admin updates a complaint's `admin_reply` field with actual content

### Notification Structure

**Table:** `notifications` (must be created if not exists)

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  complaint_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_student FOREIGN KEY (student_id)
    REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_complaint FOREIGN KEY (complaint_id)
    REFERENCES complaints(id) ON DELETE CASCADE
);
```

### Trigger Logic Flow

```
WHEN: Admin calls PATCH/PUT endpoint to update complaint's admin_reply
  ├─ IF admin_reply is NULL or empty → SKIP notification
  └─ IF admin_reply has content:
     ├─ Get complaint details (student_id, complaint title)
     ├─ INSERT into notifications:
     │  ├─ student_id: complaint.student_id
     │  ├─ title: "New Reply"
     │  ├─ body: "Admin replied to your complaint: {complaint_title}"
     │  ├─ type: "complaint"
     │  ├─ complaint_id: complaint.id
     │  ├─ is_read: false
     │  └─ created_at: CURRENT_TIMESTAMP
     └─ Return success response
```

### Admin Reply Endpoint Implementation

**Endpoint:** `PUT /admin/complaints/:complaint_id`

**Request Body:**
```json
{
  "admin_reply": "Dear Student, we have investigated your complaint. We've arranged a room move as requested. Please visit the office on Monday to confirm."
}
```

**Implementation:**

```javascript
// File: controllers/adminController.js

exports.replyToComplaint = async (req, res) => {
  try {
    const { complaint_id } = req.params;
    const { admin_reply } = req.body;
    
    // Get complaint details
    const { rows: complaints } = await db.query(
      `SELECT id, student_id, title FROM complaints WHERE id = $1`,
      [complaint_id]
    );
    
    if (complaints.length === 0) {
      return sendResponse(res, false, null, 'Complaint not found', 404);
    }
    
    const complaint = complaints[0];
    
    // ============ UPDATE COMPLAINT ============
    await db.query(
      `UPDATE complaints 
       SET admin_reply = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [admin_reply, complaint_id]
    );
    
    // ============ TRIGGER 3: CREATE NOTIFICATION ============
    // Only create notification if admin_reply is not empty/null
    if (admin_reply && admin_reply.trim().length > 0) {
      await db.query(
        `INSERT INTO notifications 
         (student_id, title, body, type, complaint_id, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, FALSE, CURRENT_TIMESTAMP)`,
        [
          complaint.student_id,
          'New Reply',
          `Admin replied to your complaint: "${complaint.title}"`,
          'complaint',
          complaint_id
        ]
      );
      
      console.log(`✓ Notification created for student ${complaint.student_id}`);
    }
    
    return sendResponse(res, true, { id: complaint_id }, 'Reply added successfully');
    
  } catch (error) {
    console.error('Error replying to complaint:', error);
    return sendResponse(res, false, null, error.message, 500);
  }
};
```

### Notification Query Endpoint

**Endpoint:** `GET /student/notifications`

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_id": 5,
      "title": "New Reply",
      "body": "Admin replied to your complaint: \"Noise from Adjacent Room\"",
      "type": "complaint",
      "complaint_id": 42,
      "is_read": false,
      "created_at": "2026-01-28T14:45:00.000Z"
    },
    {
      "id": 2,
      "student_id": 5,
      "title": "New Reply",
      "body": "Admin replied to your complaint: \"Water Leak in Bathroom\"",
      "type": "complaint",
      "complaint_id": 38,
      "is_read": true,
      "created_at": "2026-01-27T10:30:00.000Z"
    }
  ]
}
```

### Optional: Push Notification Integration

If using Firebase Cloud Messaging (FCM) or similar:

```javascript
// Optional: Send push notification to student's phone
const admin = require('firebase-admin');

if (complaint.student_fcm_token) {
  await admin.messaging().send({
    token: complaint.student_fcm_token,
    notification: {
      title: 'New Reply',
      body: `Admin replied to your complaint: "${complaint.title}"`
    },
    data: {
      complaint_id: String(complaint_id),
      type: 'complaint'
    }
  });
}
```

---

## Implementation Checklist

Use this checklist to track implementation progress:

### ✅ Rule 1: Automated Attendance Check

- [ ] Install `node-cron` package: `npm install node-cron`
- [ ] Create file: `jobs/attendanceCheckJob.js`
- [ ] Implement `scheduleAttendanceCheck()` function
- [ ] Call `scheduleAttendanceCheck()` on server startup
- [ ] Test: Verify cron job runs daily at 23:00
- [ ] Test: Verify absent records are created for students without attendance
- [ ] Test: Verify suspended students are excluded from check
- [ ] Add logging to track job execution
- [ ] Monitor job execution in production

### ✅ Rule 2: Permission Validation

#### 2.1: Date Range Validation
- [ ] Add date comparison logic in `requestPermission()` controller
- [ ] Return 400 error if `end_date < start_date`
- [ ] Use ISO date format (YYYY-MM-DD) consistently
- [ ] Test with invalid date range: start="2026-02-05", end="2026-02-01"
- [ ] Verify error message is user-friendly

#### 2.2: Duplicate Pending Check
- [ ] Query permissions table for existing pending requests
- [ ] Implement date range overlap detection
- [ ] Return 400 error if overlap exists
- [ ] Test with overlapping date ranges
- [ ] Test with approved/rejected permissions (should allow new request)
- [ ] Test with non-overlapping pending requests (should allow)
- [ ] Verify error message explains the conflict

#### General
- [ ] Add input validation for `type`, `start_date`, `end_date`, `reason`
- [ ] Validate `type` is either "Late" or "Travel"
- [ ] Ensure `reason` is not empty
- [ ] Test via Postman with various edge cases

### ✅ Rule 3: Notifications Trigger

- [ ] Create `notifications` table with schema defined above
- [ ] Add foreign keys to `students` and `complaints` with CASCADE DELETE
- [ ] Create indexes on `student_id`, `type`, `is_read` for query performance
- [ ] Implement notification creation in admin reply endpoint
- [ ] Verify notification is only created if `admin_reply` is not empty
- [ ] Create endpoint: `GET /student/notifications` to retrieve notifications
- [ ] Add `PATCH /student/notifications/:id` to mark notification as read (optional)
- [ ] Test: Update complaint with empty reply (should not create notification)
- [ ] Test: Update complaint with content (should create notification)
- [ ] Verify notification body includes complaint title
- [ ] Optional: Implement Firebase Cloud Messaging push notification
- [ ] Add notification count endpoint: `GET /student/notifications/unread-count`

### Additional Tasks
- [ ] Add unit tests for validation logic
- [ ] Add integration tests for cron job
- [ ] Add error handling and logging for all rules
- [ ] Document API endpoints in API specification
- [ ] Update frontend to handle new notification responses
- [ ] Set up monitoring/alerting for cron job failures

---

## Database Schema Updates

### Required New/Modified Tables

#### Table: `notifications` (NEW)
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  complaint_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_student FOREIGN KEY (student_id)
    REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_complaint FOREIGN KEY (complaint_id)
    REFERENCES complaints(id) ON DELETE SET NULL
);

-- Performance indexes
CREATE INDEX idx_notifications_student_id ON notifications(student_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
```

#### Table: `attendance_logs` (VERIFY)
Ensure table has these columns:
- `id` (SERIAL PRIMARY KEY)
- `student_id` (INT FK to students)
- `date` (DATE NOT NULL)
- `status` (VARCHAR(20), CHECK ('present', 'absent'))
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- **UNIQUE constraint:** `(student_id, date)`

#### Table: `permissions` (VERIFY)
Ensure table has these columns:
- `id` (SERIAL PRIMARY KEY)
- `student_id` (INT FK to students)
- `type` (VARCHAR(50), CHECK ('Late', 'Travel'))
- `start_date` (DATE NOT NULL)
- `end_date` (DATE NOT NULL)
- `reason` (TEXT NOT NULL)
- `status` (VARCHAR(50), CHECK ('Pending', 'Approved', 'Rejected'))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

## Testing Scenarios

### Test Case 1.1: Attendance Check - New Student
1. Create new student (no attendance records)
2. Run cron job at 23:00
3. **Expected:** Attendance record created with status='absent'

### Test Case 1.2: Attendance Check - Active Student
1. Find student with manual attendance record for today
2. Run cron job
3. **Expected:** No duplicate record created

### Test Case 2.1: Permission - Invalid Date Range
1. POST request with `start_date="2026-02-05"`, `end_date="2026-02-01"`
2. **Expected:** 400 error, message: "End date cannot be before start date"

### Test Case 2.2: Permission - Overlapping Pending Request
1. Student has pending permission: `2026-02-01` to `2026-02-05`
2. Submit new request: `2026-02-03` to `2026-02-10` (overlaps)
3. **Expected:** 400 error, message about existing request

### Test Case 3.1: Complaint Reply - Notification Created
1. Admin replies to complaint with non-empty text
2. Check notifications table
3. **Expected:** Notification record created for student

### Test Case 3.2: Complaint Reply - Empty Reply
1. Admin updates complaint with empty `admin_reply` value
2. Check notifications table
3. **Expected:** No notification created

---

## Error Handling & Logging

All rules should include:

```javascript
// Error Logging Format
try {
  // Business logic
} catch (error) {
  console.error(`[BUSINESS RULE] {Rule Name} failed:`, {
    error: error.message,
    stack: error.stack,
    context: { studentId, permissionId, etc }
  });
  // Send to monitoring service (Sentry, DataDog, etc.)
  return sendResponse(res, false, null, 'Operation failed', 500);
}
```

---

## Performance Considerations

1. **Cron Job:** Run attendance check during low-traffic hours (23:00 is good)
2. **Database Indexes:** Add indexes on `(student_id, status)` in attendance_logs
3. **Notification Queries:** Add composite index on `(student_id, is_read, created_at)`
4. **Duplicate Check:** Query uses date overlap logic (efficient with proper indexes)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-01-28 | Initial business logic rules for v2 app |


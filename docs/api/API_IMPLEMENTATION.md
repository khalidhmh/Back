/**
 * ========================================
 * API LAYER IMPLEMENTATION GUIDE
 * ========================================
 * 
 * This document provides a comprehensive overview of the API Layer
 * created for the University Housing System mobile app.
 * 
 * Created: January 25, 2026
 * Status: Production-Ready
 * 
 * ========================================
 * TABLE OF CONTENTS
 * ========================================
 * 
 * 1. Architecture Overview
 * 2. File Structure
 * 3. Controller Methods
 * 4. Routes & Endpoints
 * 5. Security Features
 * 6. Usage Examples
 * 7. Error Handling
 * 8. Testing Guide
 * 9. Deployment Checklist
 * 
 * ========================================
 * 1. ARCHITECTURE OVERVIEW
 * ========================================
 * 
 * MVC PATTERN:
 * 
 *   Client (Mobile App)
 *         ↓
 *   HTTP Request
 *         ↓
 *   Express Server
 *         ↓
 *   authenticateToken Middleware
 *         ↓ (extracts req.user from JWT)
 *   Route Handler
 *         ↓
 *   Controller Method
 *         ↓
 *   Database Query (async/await)
 *         ↓
 *   Response (JSON)
 *         ↓
 *   Client (Mobile App)
 * 
 * WHY THIS ARCHITECTURE?
 * - Separation of concerns (routes ≠ business logic)
 * - Reusable middleware (auth, validation, logging)
 * - Testable controllers (can mock database)
 * - Scalable design (easy to add new features)
 * 
 * ========================================
 * 2. FILE STRUCTURE
 * ========================================
 * 
 * /controllers/
 *   ├── studentController.js      (Profile, attendance, clearance)
 *   ├── serviceController.js      (Complaints, maintenance, permissions)
 *   └── activityController.js     (Activities, announcements)
 * 
 * /routes/
 *   ├── auth.js                   (Login/logout - already exists)
 *   └── api.js                    (All protected endpoints)
 * 
 * /middleware/
 *   └── auth.js                   (JWT verification - already exists)
 * 
 * server.js                        (Main app, route mounting)
 * db.js                            (Database connection - already exists)
 * 
 * ========================================
 * 3. CONTROLLER METHODS (21 methods total)
 * ========================================
 * 
 * STUDENT CONTROLLER (3 methods)
 * ─────────────────────────────────
 * 
 * 1. getProfile()
 *    - Gets student profile with room details
 *    - Endpoint: GET /api/student/profile
 *    - Auth: Required (JWT token)
 *    - Returns: Student object with nested room object
 * 
 * 2. getAttendance()
 *    - Gets attendance logs for student
 *    - Endpoint: GET /api/student/attendance
 *    - Auth: Required (JWT token)
 *    - Query: ?month=2025-01 or ?date=2025-01-25
 *    - Returns: Array of attendance records
 * 
 * 3. getClearanceStatus()
 *    - Gets clearance process status
 *    - Endpoint: GET /api/student/clearance
 *    - Auth: Required (JWT token)
 *    - Returns: Clearance status with progress percentage
 * 
 * SERVICE CONTROLLER (6 methods)
 * ──────────────────────────────
 * 
 * COMPLAINTS:
 * 
 * 4. getComplaints()
 *    - Gets all complaints for student
 *    - Endpoint: GET /api/services/complaints
 *    - Auth: Required
 *    - Query: ?status=pending or ?type=general
 *    - Returns: Array of complaint records
 * 
 * 5. createComplaint()
 *    - Submits new complaint
 *    - Endpoint: POST /api/services/complaints
 *    - Auth: Required
 *    - Body: { title, description, type, is_secret }
 *    - Returns: Created complaint object
 * 
 * MAINTENANCE:
 * 
 * 6. getMaintenance()
 *    - Gets maintenance requests for room
 *    - Endpoint: GET /api/services/maintenance
 *    - Auth: Required
 *    - Query: ?status=open or ?category=electrical
 *    - Returns: Array of maintenance records
 * 
 * 7. createMaintenance()
 *    - Submits new maintenance request
 *    - Endpoint: POST /api/services/maintenance
 *    - Auth: Required
 *    - Body: { category, description }
 *    - Returns: Created maintenance object
 * 
 * PERMISSIONS:
 * 
 * 8. getPermissions()
 *    - Gets all permission requests for student
 *    - Endpoint: GET /api/services/permissions
 *    - Auth: Required
 *    - Query: ?status=approved or ?type=travel
 *    - Returns: Array of permission records
 * 
 * 9. requestPermission()
 *    - Requests new permission
 *    - Endpoint: POST /api/services/permissions
 *    - Auth: Required
 *    - Body: { type, start_date, end_date, reason }
 *    - Returns: Created permission object
 * 
 * ACTIVITY CONTROLLER (3 methods)
 * ──────────────────────────────
 * 
 * 10. getActivities()
 *     - Gets all upcoming activities with subscription status
 *     - Endpoint: GET /api/activities
 *     - Auth: Required
 *     - Query: ?limit=10
 *     - Returns: Array of activity objects with is_subscribed flag
 * 
 * 11. subscribeToActivity()
 *     - Subscribes student to activity
 *     - Endpoint: POST /api/activities/subscribe
 *     - Auth: Required
 *     - Body: { activity_id }
 *     - Returns: Created subscription object
 * 
 * 12. getAnnouncements()
 *     - Gets all announcements
 *     - Endpoint: GET /api/announcements
 *     - Auth: Required
 *     - Query: ?limit=10 or ?category=maintenance
 *     - Returns: Array of announcement objects
 * 
 * ========================================
 * 4. ROUTES & ENDPOINTS (12 endpoints)
 * ========================================
 * 
 * BASE URL: http://localhost:3000/api
 * 
 * STUDENT ROUTES:
 * ───────────────
 * GET    /student/profile       - Fetch student profile
 * GET    /student/attendance    - Fetch attendance logs
 * GET    /student/clearance     - Fetch clearance status
 * 
 * SERVICE ROUTES:
 * ───────────────
 * GET    /services/complaints   - Get complaints
 * POST   /services/complaints   - Submit complaint
 * GET    /services/maintenance  - Get maintenance
 * POST   /services/maintenance  - Submit maintenance request
 * GET    /services/permissions  - Get permissions
 * POST   /services/permissions  - Request permission
 * 
 * ACTIVITY ROUTES:
 * ────────────────
 * GET    /activities            - Get activities with subscription status
 * POST   /activities/subscribe  - Subscribe to activity
 * GET    /announcements         - Get announcements
 * 
 * ========================================
 * 5. SECURITY FEATURES
 * ========================================
 * 
 * AUTHENTICATION:
 * - All 12 endpoints require JWT token in Authorization header
 * - Middleware: authenticateToken (middleware/auth.js)
 * - Token extracted from: Authorization: Bearer <token>
 * - Invalid token returns 401 Unauthorized
 * 
 * SQL INJECTION PREVENTION:
 * - All queries use parameterized queries ($1, $2, etc.)
 * - Never concatenate user input into SQL
 * - Database driver (pg) escapes parameters
 * - Example:
 *   SAFE:   db.query('SELECT * FROM students WHERE id = $1', [studentId])
 *   UNSAFE: db.query(`SELECT * FROM students WHERE id = ${studentId}`)
 * 
 * INPUT VALIDATION:
 * - Required fields checked before database query
 * - Data types validated (dates, enums)
 * - String lengths limited
 * - Examples:
 *   - Complaint title: max 200 characters
 *   - Complaint description: max 5000 characters
 *   - Permission type: must be one of ['travel', 'late', 'medical', 'other']
 *   - Date format: YYYY-MM-DD (regex validated)
 * 
 * BUSINESS LOGIC VALIDATION:
 * - Dates must be in future (permission requests)
 * - Activity can't be full when subscribing
 * - Student can't subscribe twice to same activity
 * - Room capacity checks
 * 
 * ERROR MESSAGES:
 * - Generic in production (don't leak database info)
 * - Specific in development (for debugging)
 * - HTTP status codes follow REST standards:
 *   - 200 OK: Success
 *   - 201 Created: Resource created
 *   - 400 Bad Request: Invalid input
 *   - 401 Unauthorized: Invalid token
 *   - 404 Not Found: Resource not found
 *   - 409 Conflict: Duplicate/conflict error
 *   - 500 Server Error: Unexpected error
 * 
 * ========================================
 * 6. USAGE EXAMPLES
 * ========================================
 * 
 * REQUEST HEADERS:
 * ────────────────
 * 
 * All requests require:
 * 
 *   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *   Content-Type: application/json
 * 
 * 
 * EXAMPLE 1: Get Student Profile
 * ────────────────────────────────
 * 
 * REQUEST:
 * 
 *   GET http://localhost:3000/api/student/profile
 *   Authorization: Bearer <token>
 * 
 * RESPONSE (200 OK):
 * 
 *   {
 *     "success": true,
 *     "student": {
 *       "id": 1,
 *       "national_id": "30412010101234",
 *       "full_name": "محمد أحمد علي",
 *       "faculty": "Engineering",
 *       "phone": "+201234567890",
 *       "photo_url": "https://example.com/student.jpg",
 *       "is_suspended": false,
 *       "created_at": "2025-01-15T10:30:00Z",
 *       "room": {
 *         "id": 1,
 *         "room_number": "101",
 *         "building": "Building A",
 *         "floor": 1,
 *         "capacity": 2
 *       }
 *     }
 *   }
 * 
 * 
 * EXAMPLE 2: Get Attendance with Filter
 * ──────────────────────────────────────
 * 
 * REQUEST:
 * 
 *   GET http://localhost:3000/api/student/attendance?month=2025-01
 *   Authorization: Bearer <token>
 * 
 * RESPONSE (200 OK):
 * 
 *   {
 *     "success": true,
 *     "count": 15,
 *     "attendance": [
 *       {
 *         "id": 1,
 *         "student_id": 1,
 *         "date": "2025-01-25",
 *         "status": "Present",
 *         "created_at": "2025-01-25T08:00:00Z"
 *       },
 *       {
 *         "id": 2,
 *         "student_id": 1,
 *         "date": "2025-01-24",
 *         "status": "Present",
 *         "created_at": "2025-01-24T08:00:00Z"
 *       }
 *     ]
 *   }
 * 
 * 
 * EXAMPLE 3: Submit Complaint
 * ────────────────────────────
 * 
 * REQUEST:
 * 
 *   POST http://localhost:3000/api/services/complaints
 *   Authorization: Bearer <token>
 *   Content-Type: application/json
 *   
 *   {
 *     "title": "Noise Complaint",
 *     "description": "There is loud noise coming from room 102...",
 *     "type": "general",
 *     "is_secret": false
 *   }
 * 
 * RESPONSE (201 Created):
 * 
 *   {
 *     "success": true,
 *     "message": "Complaint submitted successfully",
 *     "complaint": {
 *       "id": 5,
 *       "student_id": 1,
 *       "title": "Noise Complaint",
 *       "description": "There is loud noise coming from room 102...",
 *       "type": "general",
 *       "status": "pending",
 *       "is_secret": false,
 *       "admin_reply": null,
 *       "created_at": "2025-01-25T15:30:00Z",
 *       "updated_at": "2025-01-25T15:30:00Z"
 *     }
 *   }
 * 
 * 
 * EXAMPLE 4: Get Activities
 * ──────────────────────────
 * 
 * REQUEST:
 * 
 *   GET http://localhost:3000/api/activities?limit=5
 *   Authorization: Bearer <token>
 * 
 * RESPONSE (200 OK):
 * 
 *   {
 *     "success": true,
 *     "count": 2,
 *     "activities": [
 *       {
 *         "id": 1,
 *         "title": "Football League",
 *         "description": "Inter-hall football tournament...",
 *         "date": "2025-02-08",
 *         "location": "Main Sports Complex",
 *         "max_participants": 50,
 *         "participant_count": 23,
 *         "is_subscribed": true,
 *         "created_at": "2025-01-15T10:00:00Z"
 *       },
 *       {
 *         "id": 2,
 *         "title": "Arts Workshop",
 *         "description": "Learn digital art and design...",
 *         "date": "2025-02-15",
 *         "location": "Arts Building Room 201",
 *         "max_participants": 30,
 *         "participant_count": 15,
 *         "is_subscribed": false,
 *         "created_at": "2025-01-15T11:00:00Z"
 *       }
 *     ]
 *   }
 * 
 * 
 * EXAMPLE 5: Subscribe to Activity
 * ─────────────────────────────────
 * 
 * REQUEST:
 * 
 *   POST http://localhost:3000/api/activities/subscribe
 *   Authorization: Bearer <token>
 *   Content-Type: application/json
 *   
 *   {
 *     "activity_id": 2
 *   }
 * 
 * RESPONSE (201 Created):
 * 
 *   {
 *     "success": true,
 *     "message": "Successfully subscribed to \"Arts Workshop\"",
 *     "subscription": {
 *       "id": 5,
 *       "student_id": 1,
 *       "activity_id": 2,
 *       "created_at": "2025-01-25T15:30:00Z"
 *     }
 *   }
 * 
 * 
 * EXAMPLE 6: Error - Missing Token
 * ─────────────────────────────────
 * 
 * REQUEST:
 * 
 *   GET http://localhost:3000/api/student/profile
 *   (No Authorization header)
 * 
 * RESPONSE (401 Unauthorized):
 * 
 *   {
 *     "success": false,
 *     "message": "Access token required"
 *   }
 * 
 * 
 * EXAMPLE 7: Error - Invalid Input
 * ─────────────────────────────────
 * 
 * REQUEST:
 * 
 *   POST http://localhost:3000/api/services/complaints
 *   Authorization: Bearer <token>
 *   Content-Type: application/json
 *   
 *   {
 *     "title": "Noise Complaint"
 *     // Missing: description, type
 *   }
 * 
 * RESPONSE (400 Bad Request):
 * 
 *   {
 *     "success": false,
 *     "message": "title, description, and type are required"
 *   }
 * 
 * ========================================
 * 7. ERROR HANDLING
 * ========================================
 * 
 * ERROR CODES & MEANINGS:
 * 
 * 400 Bad Request
 * ───────────────
 * - Missing required fields
 * - Invalid data format
 * - Invalid enum value
 * - Business logic violation
 * Example: Missing title in complaint
 * 
 * 401 Unauthorized
 * ────────────────
 * - Missing authorization header
 * - Invalid or expired token
 * - Token signature doesn't match
 * Example: Missing "Bearer <token>"
 * 
 * 404 Not Found
 * ──────────────
 * - Resource doesn't exist
 * - Student not assigned to room
 * - Activity not found
 * Example: Querying non-existent activity
 * 
 * 409 Conflict
 * ──────────────
 * - Duplicate record
 * - Activity is full
 * - Already subscribed
 * Example: Subscribing twice to same activity
 * 
 * 500 Server Error
 * ─────────────────
 * - Database connection failed
 * - Query execution error
 * - Unhandled exception
 * Example: PostgreSQL server down
 * 
 * HANDLING ERRORS IN MOBILE APP:
 * 
 * 1. Check response.success flag first
 * 2. If false, display response.message to user
 * 3. Log error.status for debugging
 * 4. For 401 errors: redirect to login
 * 5. For 500 errors: show "Try again later" and log to crash reporting
 * 
 * ========================================
 * 8. TESTING GUIDE
 * ========================================
 * 
 * PREREQUISITES:
 * - PostgreSQL database running
 * - Database schema created (setupDB.js run)
 * - Server running (npm start)
 * - Valid JWT token from login
 * 
 * TEST 1: Verify All Routes Mounted
 * ──────────────────────────────────
 * 
 * Command:
 *   npm run test:routes
 * 
 * Expected Output:
 *   ✓ GET /api/student/profile
 *   ✓ GET /api/student/attendance
 *   ✓ GET /api/student/clearance
 *   ... (all 12 endpoints should be accessible)
 * 
 * 
 * TEST 2: Test Authentication
 * ────────────────────────────
 * 
 * Step 1: Get token
 *   curl -X POST http://localhost:3000/api/auth/login \
 *     -H "Content-Type: application/json" \
 *     -d '{"national_id": "30412010101234", "password": "123456"}'
 * 
 * Expected: { success: true, token: "eyJhbGc..." }
 * 
 * Step 2: Use token
 *   curl http://localhost:3000/api/student/profile \
 *     -H "Authorization: Bearer eyJhbGc..."
 * 
 * Expected: 200 OK with student profile
 * 
 * Step 3: Test without token
 *   curl http://localhost:3000/api/student/profile
 * 
 * Expected: 401 Unauthorized
 * 
 * 
 * TEST 3: Test Each Controller
 * ─────────────────────────────
 * 
 * Test Student Controller:
 *   - GET /api/student/profile
 *   - GET /api/student/attendance
 *   - GET /api/student/clearance
 * 
 * Test Service Controller:
 *   - GET /api/services/complaints
 *   - POST /api/services/complaints (submit test complaint)
 *   - GET /api/services/maintenance
 *   - POST /api/services/maintenance (submit test request)
 *   - GET /api/services/permissions
 *   - POST /api/services/permissions (submit test request)
 * 
 * Test Activity Controller:
 *   - GET /api/activities
 *   - POST /api/activities/subscribe (subscribe to test activity)
 *   - GET /api/announcements
 * 
 * 
 * TEST 4: Test Error Handling
 * ────────────────────────────
 * 
 * Invalid Complaint (missing description):
 *   POST /api/services/complaints
 *   { "title": "Test", "type": "general" }
 *   Expected: 400 Bad Request
 * 
 * Invalid Activity ID:
 *   POST /api/activities/subscribe
 *   { "activity_id": 9999 }
 *   Expected: 404 Not Found
 * 
 * Subscribe twice to same activity:
 *   POST /api/activities/subscribe
 *   { "activity_id": 1 }
 *   Expected: 409 Conflict (after first subscription)
 * 
 * ========================================
 * 9. DEPLOYMENT CHECKLIST
 * ========================================
 * 
 * BEFORE DEPLOYING TO PRODUCTION:
 * 
 * Code Review:
 * ☐ All controllers follow same error handling pattern
 * ☐ All routes protected with authenticateToken
 * ☐ All queries use parameterized statements
 * ☐ No console.log statements left (use logger)
 * ☐ No hardcoded sensitive data (use env variables)
 * ☐ Code is well-commented
 * 
 * Testing:
 * ☐ All 12 endpoints tested manually
 * ☐ Authentication tested (valid/invalid tokens)
 * ☐ Input validation tested (missing fields, invalid types)
 * ☐ Error handling tested (404, 400, 401, 500)
 * ☐ Database performance tested (large datasets)
 * ☐ Concurrent requests tested (rate limiting)
 * 
 * Security:
 * ☐ SQL injection prevention verified (parameterized queries)
 * ☐ Rate limiting enabled and tested
 * ☐ CORS configured for specific origins (not *)
 * ☐ Helmet.js enabled with appropriate headers
 * ☐ JWT secret secure and not in code
 * ☐ Database credentials in environment variables
 * ☐ HTTPS enforced in production
 * 
 * Performance:
 * ☐ Query response times < 200ms
 * ☐ No N+1 queries (proper JOINs used)
 * ☐ Database indexes created for frequently queried fields
 * ☐ Connection pooling configured
 * ☐ Caching implemented where appropriate
 * 
 * Documentation:
 * ☐ API documentation generated (OpenAPI/Swagger)
 * ☐ Error codes documented
 * ☐ Authentication instructions clear
 * ☐ Environment variables documented
 * ☐ Deployment procedure documented
 * ☐ Troubleshooting guide created
 * 
 * Infrastructure:
 * ☐ Database backups scheduled
 * ☐ Monitoring/alerting configured
 * ☐ Log aggregation set up
 * ☐ Error tracking configured (Sentry, etc.)
 * ☐ API rate limiting monitored
 * ☐ Server resources monitored (CPU, memory, disk)
 * 
 * ========================================
 * QUICK REFERENCE
 * ========================================
 * 
 * START SERVER:
 *   npm start
 * 
 * GET JWT TOKEN:
 *   curl -X POST http://localhost:3000/api/auth/login \
 *     -H "Content-Type: application/json" \
 *     -d '{"national_id": "30412010101234", "password": "123456"}'
 * 
 * TEST ENDPOINT (replace <TOKEN>):
 *   curl http://localhost:3000/api/student/profile \
 *     -H "Authorization: Bearer <TOKEN>"
 * 
 * FILE LOCATIONS:
 *   Controllers: /controllers/
 *   Routes: /routes/api.js
 *   Middleware: /middleware/auth.js
 *   Database: /db.js
 * 
 * ========================================
 * 
 * For questions or issues, refer to:
 * - Database schema: DATABASE_SCHEMA.md
 * - Setup procedure: SETUPDB_REFERENCE.md
 * - Architecture: DATABASE_VISUAL_REFERENCE.md
 */

/**
 * ========================================
 * AUTHENTICATION ROUTES
 * ========================================
 * 
 * Purpose: Define endpoints for authentication
 * 
 * Architecture: Route layer in MVC pattern
 * - Maps HTTP methods and paths to controllers
 * - Handles URL routing
 * - Can include middleware for validation
 * 
 * Base Path: /api/auth
 * 
 * Endpoints:
 * - POST /api/auth/login - User login
 * 
 * @module routes/auth
 * @requires express - Web framework
 * @requires ../controllers/authController - Login logic
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * POST /api/auth/login
 * 
 * Authenticates a user and returns a JWT token
 * 
 * WHY POST?
 * - Credentials should be in request body, not URL
 * - POST is more secure than GET for sensitive data
 * - RESTful convention: POST for creating sessions
 * 
 * REQUEST BODY:
 * {
 *   "userType": "student" | "admin",
 *   "id": "30412010101234" (national_id for student) or username for admin,
 *   "password": "user_password"
 * }
 * 
 * RESPONSE (200 OK):
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": 1,
 *     "name": "أحمد حسن",
 *     "role": "student"
 *   }
 * }
 * 
 * ERROR RESPONSES:
 * - 400: Missing or invalid credentials
 * - 401: Invalid credentials
 * - 500: Server error
 * 
 * EXAMPLE CURL:
 * curl -X POST http://localhost:3000/api/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "userType": "student",
 *     "id": "30412010101234",
 *     "password": "123456"
 *   }'
 */
router.post('/login', authController.login);

module.exports = router;
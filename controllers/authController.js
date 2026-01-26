/**
 * ========================================
 * AUTHENTICATION CONTROLLER
 * ========================================
 * 
 * Purpose: Handle login logic for students and administrators
 * 
 * Architecture: Controller layer in MVC pattern
 * - Receives HTTP requests from routes
 * - Calls database via models
 * - Returns standardized JSON responses
 * 
 * Security Measures:
 * - Password comparison using bcrypt (never store plain passwords)
 * - JWT tokens with expiration
 * - Parameterized queries to prevent SQL injection
 * - Standard error messages (no sensitive leaks)
 * 
 * @module authController
 * @requires ../db - Database connection
 * @requires bcrypt - Password hashing
 * @requires jsonwebtoken - JWT token generation
 */

const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Login Controller
 * 
 * Authenticates users (students or admins) and issues JWT tokens
 * 
 * WHY SEPARATE STUDENT AND ADMIN QUERIES?
 * - Students authenticate with national ID
 * - Admins authenticate with username
 * - Different table structures and roles
 * 
 * REQUEST BODY EXPECTED:
 * {
 *   "userType": "student" or "admin",
 *   "id": national_id (for student) or username (for admin),
 *   "password": plain text password
 * }
 * 
 * RESPONSE ON SUCCESS:
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIs...",
 *   "user": {
 *     "id": 1,
 *     "name": "احمد حسن",
 *     "role": "student"
 *   }
 * }
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.login = async (req, res) => {
  // Extract credentials from request body
  const { userType, id, password } = req.body;

  try {
    // ========================================
    // STEP 1: INPUT VALIDATION
    // ========================================
    // WHY VALIDATE?
    // - Prevents invalid data from reaching database
    // - Provides clear error messages to client
    // - Improves API robustness
    
    if (!userType || !id || !password) {
      return res.status(400).json({ 
        message: "الرجاء إدخال نوع المستخدم والرقم والباسورد" 
      });
    }

    if (!['student', 'admin'].includes(userType)) {
      return res.status(400).json({ 
        message: "نوع المستخدم غير صحيح" 
      });
    }

    // ========================================
    // STEP 2: QUERY DATABASE FOR USER
    // ========================================
    // WHY PARAMETERIZED QUERIES?
    // - The $1 placeholder prevents SQL injection
    // - Example attack prevented: "' OR '1'='1"
    // - Database driver handles escaping automatically
    
    let user;
    
    if (userType === 'student') {
      // Students authenticate with national_id
      // Example: 30412010101234 (14-digit Egyptian ID)
      const result = await db.query(
        'SELECT id, national_id, password_hash, full_name FROM students WHERE national_id = $1',
        [id]
      );
      user = result.rows[0];
    } else if (userType === 'admin') {
      // Admins authenticate with username
      const result = await db.query(
        'SELECT id, username, password_hash, full_name, role FROM users WHERE username = $1',
        [id]
      );
      user = result.rows[0];
    }

    // ========================================
    // STEP 3: CHECK IF USER EXISTS
    // ========================================
    // WHY GENERIC ERROR MESSAGE?
    // - Prevents username enumeration attacks
    // - Attacker can't tell which usernames exist
    // - More secure than "User not found"
    
    if (!user) {
      return res.status(401).json({ 
        message: "بيانات الدخول غير صحيحة" 
      });
    }

    // ========================================
    // STEP 4: VERIFY PASSWORD
    // ========================================
    // WHY USE BCRYPT?
    // - Slow hashing algorithm (prevents brute force)
    // - Salt generation prevents rainbow tables
    // - Even if database is stolen, passwords are safe
    // - Takes ~100ms per comparison (adds latency to attacks)
    
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "بيانات الدخول غير صحيحة" 
      });
    }

    // ========================================
    // STEP 5: GENERATE JWT TOKEN
    // ========================================
    // WHY JWT?
    // - Stateless: Server doesn't need to store sessions
    // - Scalable: Works with multiple servers/microservices
    // - Secure: Can't be forged without the secret key
    // - Includes expiration: Token automatically becomes invalid
    
    const token = jwt.sign(
      {
        // Payload: Data embedded in token (DON'T put passwords here!)
        id: user.id,
        role: userType === 'student' ? 'student' : user.role,
        userType: userType,
      },
      process.env.JWT_SECRET, // Secret key (keep this safe!)
      {
        expiresIn: process.env.JWT_EXPIRE || '1d', // Token expires after 1 day
        algorithm: 'HS256', // HMAC SHA-256 algorithm
      }
    );

    // ========================================
    // STEP 6: RETURN SUCCESS RESPONSE
    // ========================================
    // WHY NOT RETURN PASSWORD?
    // - Never send sensitive data to client
    // - Token is sufficient for authentication
    // - Reduces attack surface
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.full_name,
        role: userType === 'student' ? 'student' : user.role,
      },
      message: "تم تسجيل الدخول بنجاح",
    });

  } catch (err) {
    // ========================================
    // ERROR HANDLING
    // ========================================
    // WHY LOG ERRORS?
    // - Helps with debugging in production
    // - Can be sent to monitoring service
    // - Distinguishes from user errors
    
    console.error('❌ Login error:', err.message);
    
    // WHY GENERIC ERROR TO CLIENT?
    // - Don't reveal stack traces to attackers
    // - Client doesn't need technical details
    // - Keep error messages user-friendly
    
    res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر. يرجى المحاولة لاحقاً",
    });
  }
};

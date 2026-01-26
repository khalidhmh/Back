/**
 * ========================================
 * AUTHENTICATION MIDDLEWARE
 * ========================================
 * 
 * Purpose: Verify JWT tokens and protect routes
 * 
 * Architecture: Middleware layer in MVC pattern
 * - Runs before controller logic
 * - Validates JWT tokens
 * - Extracts user information
 * - Prevents unauthorized access
 * 
 * Security Measures:
 * - Validates JWT signature using secret key
 * - Checks token expiration
 * - Extracts user context to req.user
 * - Returns proper HTTP status codes
 * 
 * @module middleware/auth
 * @requires jsonwebtoken - JWT verification
 */

const jwt = require('jsonwebtoken');

/**
 * VERIFY JWT TOKEN
 * 
 * Middleware to authenticate requests using JWT tokens
 * 
 * FLOW:
 * 1. Extract token from Authorization header
 * 2. Verify token signature and expiration
 * 3. Extract user data from token
 * 4. Pass to next middleware/controller
 * 
 * WHY MIDDLEWARE?
 * - Centralized authentication logic
 * - Reusable across multiple routes
 * - Follows DRY principle
 * - Consistent error handling
 * 
 * USAGE:
 * app.use(authenticateToken); // Protect all routes
 * app.get('/protected', authenticateToken, controller.method);
 * 
 * EXPECTED HEADER:
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * ERRORS:
 * - 401: Token missing or invalid
 * - 403: Token expired or verification failed
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.authenticateToken = (req, res, next) => {
  try {
    // ========================================
    // STEP 1: EXTRACT TOKEN FROM HEADER
    // ========================================
    // WHY BEARER SCHEME?
    // - RFC 6750 standard for OAuth 2.0
    // - Widely supported by clients
    // - Separates auth scheme from token
    
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    // Expected format: "Bearer <token>"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Authorization header format',
      });
    }

    // ========================================
    // STEP 2: VERIFY TOKEN SIGNATURE
    // ========================================
    // WHY VERIFY?
    // - Ensures token wasn't tampered with
    // - Verifies it was signed with our secret key
    // - Checks expiration date
    // - Decrypts payload
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ========================================
    // STEP 3: ATTACH USER TO REQUEST
    // ========================================
    // WHY ATTACH TO REQUEST?
    // - Controller can access user info via req.user
    // - No need to decode token again
    // - Reduces database queries
    // - Clean code organization
    
    req.user = decoded;
    
    // ========================================
    // STEP 4: PASS TO NEXT MIDDLEWARE
    // ========================================
    next();

  } catch (err) {
    // ========================================
    // ERROR HANDLING
    // ========================================
    
    if (err.name === 'TokenExpiredError') {
      // Token is expired - user needs to login again
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        errorCode: 'TOKEN_EXPIRED',
      });
    }

    if (err.name === 'JsonWebTokenError') {
      // Token is invalid - tampered or wrong secret
      return res.status(403).json({
        success: false,
        message: 'Invalid token',
        errorCode: 'INVALID_TOKEN',
      });
    }

    // Generic JWT error
    console.error('❌ Token verification error:', err.message);
    return res.status(403).json({
      success: false,
      message: 'Token verification failed',
    });
  }
};

/**
 * AUTHORIZE BY ROLE
 * 
 * Middleware to restrict routes by user role
 * 
 * PURPOSE:
 * - Allow only specific roles to access routes
 * - Students vs Admins have different permissions
 * - Graduate authorization layer
 * 
 * USAGE:
 * app.delete('/admin/users/:id', 
 *   authenticateToken,
 *   authorizeRole('admin'),
 *   controller.deleteUser
 * );
 * 
 * EXPECTED:
 * - User already authenticated (authenticateToken ran first)
 * - req.user contains role from JWT
 * 
 * @param {...string} allowedRoles - Roles permitted to access route
 * @returns {Function} Middleware function
 * 
 * @example
 * authorizeRole('admin', 'moderator')
 */
exports.authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists (authenticateToken must run first)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Check if user's role is in allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions for this resource',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    // User has permission - continue
    next();
  };
};

/**
 * VERIFY USER ID OWNERSHIP
 * 
 * Middleware to ensure users can only access their own data
 * 
 * PURPOSE:
 * - Prevent student A from viewing student B's data
 * - Authorization at data level (not just role)
 * - Admins can access any user's data
 * 
 * USAGE:
 * app.get('/students/:id', 
 *   authenticateToken,
 *   verifyOwnership,
 *   controller.getStudent
 * );
 * 
 * HOW IT WORKS:
 * - If user is admin: allow access
 * - If user's ID matches param: allow access
 * - Otherwise: deny access
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
exports.verifyOwnership = (req, res, next) => {
  // Admin can access any resource
  if (req.user.role === 'admin') {
    return next();
  }

  // Student can only access their own data
  const requestedId = parseInt(req.params.id);
  
  if (req.user.id !== requestedId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this resource',
    });
  }

  next();
};

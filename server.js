/**
 * ========================================
 * MAIN SERVER ENTRY POINT
 * ========================================
 * 
 * Purpose: Initialize Express app with security middleware
 * and start the HTTP server
 * 
 * Architecture: This is the main bootstrapper for the application
 * - Loads environment variables
 * - Configures security middleware
 * - Sets up rate limiting
 * - Mounts routes
 * - Starts the server
 * 
 * Security Features:
 * - Helmet: Protects against common vulnerabilities
 * - CORS: Controls cross-origin requests
 * - Rate Limiting: Prevents DoS and brute force attacks
 * - JSON Size Limit: Prevents large payload attacks
 * - Request Logging: Monitors traffic with Morgan
 * 
 * @module server
 * @requires express - Web framework
 * @requires helmet - Security middleware
 * @requires cors - Cross-origin resource sharing
 * @requires express-rate-limit - Rate limiting middleware
 * @requires morgan - HTTP request logger
 * @requires dotenv - Environment variable loader
 * @requires ./routes/auth - Authentication routes
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// ========================================
// CREATE EXPRESS APPLICATION
// ========================================
const app = express();

// ========================================
// SECURITY MIDDLEWARE - APPLIED FIRST
// ========================================
// WHY APPLY SECURITY FIRST?
// - Protect all routes automatically
// - No way to bypass accidentally
// - Defense in depth principle

/**
 * HELMET.JS - Protect against common vulnerabilities
 * 
 * What it does:
 * - Sets HTTP headers to prevent XSS, clickjacking, etc.
 * - Disables X-Powered-By header (hides server type)
 * - Enables Content Security Policy
 * - Prevents MIME sniffing
 * 
 * WHY USE IT?
 * - 15+ security headers in one middleware
 * - No performance impact (just headers)
 * - Industry standard for Node.js apps
 * 
 * REFERENCE: https://helmetjs.github.io/
 */
app.use(helmet());

/**
 * CORS - Control cross-origin requests
 * 
 * What it does:
 * - Allows requests from different domains
 * - Required for mobile apps and frontend on different domain
 * - Prevents unauthorized cross-origin requests
 * 
 * WHY USE IT?
 * - API will be consumed by mobile app (different origin)
 * - Browsers block cross-origin requests by default
 * - CORS properly configured prevents exploitation
 * 
 * CURRENT CONFIG: Allow all origins (development)
 * PRODUCTION: Specify allowed origins
 * Example: cors({ origin: 'https://yourdomain.com' })
 */
app.use(cors());

/**
 * BODY PARSER - Parse JSON request bodies
 * 
 * What it does:
 * - Parses incoming JSON into req.body
 * - Limits request size to prevent memory exhaustion
 * 
 * WHY SET LIMIT?
 * - 10KB is plenty for login requests
 * - Prevents large payload attacks
 * - More restrictive = more secure
 * 
 * ERROR: If you get "413 Payload Too Large", increase limit
 */
app.use(express.json({ limit: '10kb' }));

/**
 * MORGAN - HTTP Request Logger
 * 
 * What it does:
 * - Logs every HTTP request to console
 * - Shows: method, path, status code, response time
 * 
 * WHY LOG REQUESTS?
 * - Monitor API usage
 * - Debug issues (which endpoint failed?)
 * - Detect suspicious patterns
 * - Audit trail for security
 * 
 * 'dev' format: Colored output for development
 * Production: Consider 'combined' format and file logging
 */
app.use(morgan('dev'));

// ========================================
// RATE LIMITING - PREVENT ABUSE
// ========================================
/**
 * WHY RATE LIMITING?
 * - Brute force attacks: Try 1000s of passwords
 * - DoS attacks: Flood server with requests
 * - Resource protection: Prevent legitimate usage overload
 * 
 * CONFIG:
 * - Window: 15 minutes
 * - Max: 100 requests per window
 * - Message: Clear error to client
 * 
 * STRATEGY:
 * - Stricter on auth endpoints (reduce to 5 per 15 min)
 * - Looser on public endpoints (current: 100)
 * - Store in Redis for multi-server deployments
 */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Optional: Skip rate limiting for health checks
    return req.path === '/health';
  },
});

/**
 * Apply rate limiter to all /api routes
 * 
 * WHY ALL API ROUTES?
 * - Protects all endpoints uniformly
 * - Easy to audit (one place)
 * - Can add specific limiters for login (stricter)
 */
app.use('/api/', limiter);

// ========================================
// HEALTH CHECK ENDPOINT (Monitoring)
// ========================================
/**
 * WHY HEALTH CHECK?
 * - Load balancers need to know if server is alive
 * - Monitoring tools use this to verify availability
 * - Should NOT require authentication
 * - Should be fast (doesn't query database)
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========================================
// ROUTE MOUNTING
// ========================================
/**
 * WHY MOUNT ROUTES HERE?
 * - Centralized routing configuration
 * - All routes in one place (good for documentation)
 * - Easy to add new route groups
 * 
 * ROUTE STRUCTURE:
 * /api/auth  - Authentication routes
 * /api       - API routes (student, services, activities)
 */
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

// ========================================
// ERROR HANDLING - 404 ROUTES
// ========================================
/**
 * WHY HANDLE 404?
 * - Tells client they used wrong endpoint
 * - Better than silent failure
 * - Helps during development
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================
/**
 * WHY GLOBAL ERROR HANDLER?
 * - Catches unhandled exceptions
 * - Prevents server crash
 * - Logs errors for debugging
 * - Returns proper HTTP response
 * 
 * HOW IT WORKS:
 * - Catches errors from all routes
 * - Must be the last middleware
 * - 4 parameters: (err, req, res, next)
 */
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ========================================
// START SERVER
// ========================================
/**
 * WHY SEPARATE PORT VARIABLE?
 * - Environment-specific configuration
 * - Easy to change for different environments
 * - Fallback to 3000 if PORT not set
 */
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║  🚀 Housing System API Started         ║
╚═══════════════════════════════════════╝
  
  Environment: ${NODE_ENV}
  Server Port: ${PORT}
  Base URL: http://localhost:${PORT}
  
  📚 Routes:
  • POST /api/auth/login - User login
  • GET  /health - Health check
  
  🔒 Security Features:
  ✓ Helmet (15+ security headers)
  ✓ CORS enabled
  ✓ Rate Limiting (100 req/15 min)
  ✓ Request Logging
  ✓ Parameterized Queries (SQL injection prevention)
  
═══════════════════════════════════════
  `);
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================
/**
 * WHY GRACEFUL SHUTDOWN?
 * - Finish in-flight requests before closing
 * - Close database connections properly
 * - Prevents data corruption
 * - Better user experience
 */
process.on('SIGTERM', () => {
  console.log('📋 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📋 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
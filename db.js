/**
 * ========================================
 * DATABASE CONFIGURATION MODULE
 * ========================================
 * 
 * Purpose: Manages PostgreSQL connection pooling
 * 
 * Security Best Practices:
 * - Uses parameterized queries to prevent SQL injection
 * - Connection pooling for optimal resource management
 * - Environment variables for sensitive credentials
 * - Graceful error handling
 * 
 * @module db
 * @requires pg - PostgreSQL client library
 * @requires dotenv - Environment variable management
 */

const { Pool } = require('pg');
require('dotenv').config();

/**
 * PostgreSQL Connection Pool Configuration
 * 
 * WHY POOL?
 * - Reuses connections instead of creating new ones each time
 * - Improves performance and reduces memory usage
 * - Handles multiple concurrent requests efficiently
 * 
 * WHY PARAMETERIZED QUERIES?
 * - Prevents SQL injection attacks
 * - Separates SQL logic from data
 */
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  // Optional: Add these in production for better performance
  // max: 20,                    // Maximum connections in pool
  // idleTimeoutMillis: 30000,   // Close idle connections after 30s
  // connectionTimeoutMillis: 2000, // Fail after 2s if can't connect
});

/**
 * Test the connection on startup
 * 
 * WHY TEST ON STARTUP?
 * - Provides immediate feedback if database is unavailable
 * - Prevents application from starting with broken DB connection
 * - Helps with debugging infrastructure issues
 */
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database successfully');
});

/**
 * Handle pool errors
 * 
 * WHY HANDLE ERRORS?
 * - Network interruptions can disconnect clients
 * - Logging helps identify connection issues in production
 */
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  // In production, you might want to send this to a monitoring service
});

/**
 * Execute a database query with parameterized values
 * 
 * WHY PARAMETERIZED QUERIES?
 * - Input validation: Prevents SQL injection
 * - Automatic type conversion: Ensures data integrity
 * - Query caching: Database can reuse query plans
 * 
 * @param {string} text - SQL query with $1, $2 placeholders
 * @param {array} params - Values to safely inject into query
 * @returns {Promise} Query result from database
 * 
 * @example
 * const user = await query(
 *   'SELECT * FROM students WHERE national_id = $1',
 *   ['30412010101234']
 * );
 */
const query = (text, params) => {
  return pool.query(text, params);
};

/**
 * Close the connection pool (used for graceful shutdown)
 */
const close = async () => {
  return pool.end();
};

module.exports = {
  query,
  close,
  pool, // Export pool for advanced usage if needed
};
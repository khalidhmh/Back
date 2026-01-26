/**
 * ========================================
 * DATABASE SETUP SCRIPT - COMPLETE SCHEMA
 * ========================================
 * 
 * Purpose: Create complete database schema and seed realistic test data
 * 
 * Usage: node setupDB.js
 * 
 * WHAT IT DOES:
 * 1. Creates 11 related tables (users, students, rooms, attendance, etc.)
 * 2. Sets up Foreign Key constraints for data integrity
 * 3. Clears old test data
 * 4. Inserts realistic seed data matching test scenarios
 * 5. Hashes passwords with bcrypt (never plain text)
 * 6. Provides detailed console output showing what was created
 * 
 * WHY THIS APPROACH?
 * - One-time setup during deployment
 * - Ensures database consistency
 * - Supports testing with realistic data
 * - Foreign keys enforce data relationships
 * - Can be run repeatedly without errors
 * 
 * @requires pg - PostgreSQL client
 * @requires bcrypt - Password hashing (10 salt rounds)
 * @requires dotenv - Environment variables
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * PostgreSQL Connection Pool
 * 
 * Configuration:
 * - Credentials from .env file
 * - Pool will close after setup completes
 * - Uses same config as production application
 */
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

/**
 * ========================================
 * SETUP FUNCTION - CREATE SCHEMA & SEED DATA
 * ========================================
 */
const setupDatabase = async () => {
  try {
    console.log('\n╔═════════════════════════════════════╗');
    console.log('║  🚀 UNIVERSITY HOUSING SYSTEM DB   ║');
    console.log('╚═════════════════════════════════════╝\n');

    console.log('📋 Starting database initialization...\n');

    // ========================================
    // STEP 1: CREATE TABLES (With Foreign Keys)
    // ========================================
    console.log('📌 STEP 1: Creating database tables...\n');

    // TABLE 1: USERS (Admin/Supervisors)
    console.log('  1️⃣  Creating users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('Manager', 'Supervisor')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('     ✅ Users table created\n');

    // TABLE 2: ROOMS
    console.log('  2️⃣  Creating rooms table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        room_number VARCHAR(20) UNIQUE NOT NULL,
        building VARCHAR(50) NOT NULL,
        floor INT NOT NULL,
        capacity INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('     ✅ Rooms table created\n');

    // TABLE 3: STUDENTS
    console.log('  3️⃣  Creating students table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        national_id VARCHAR(14) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        faculty VARCHAR(100),
        phone VARCHAR(20),
        room_id INT REFERENCES rooms(id) ON DELETE SET NULL,
        photo_url VARCHAR(500),
        is_suspended BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('     ✅ Students table created\n');

    // TABLE 4: ATTENDANCE_LOGS
    console.log('  4️⃣  Creating attendance_logs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, date)
      );
    `);
    console.log('     ✅ Attendance logs table created\n');

    // TABLE 5: COMPLAINTS
    console.log('  5️⃣  Creating complaints table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        is_secret BOOLEAN DEFAULT FALSE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('General', 'Urgent')),
        status VARCHAR(50) NOT NULL CHECK (status IN ('Pending', 'Resolved')),
        attachment_url VARCHAR(500),
        admin_reply TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('     ✅ Complaints table created\n');

    // TABLE 6: MAINTENANCE_REQUESTS
    console.log('  6️⃣  Creating maintenance_requests table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_requests (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL CHECK (category IN ('Plumbing', 'Electric', 'Net', 'Furniture', 'Other')),
        description TEXT NOT NULL,
        status VARCHAR(50) NOT NULL CHECK (status IN ('Open', 'In Progress', 'Fixed')),
        supervisor_reply TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('     ✅ Maintenance requests table created\n');

    // TABLE 7: PERMISSIONS
    console.log('  7️⃣  Creating permissions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('Late', 'Travel')),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(50) NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('     ✅ Permissions table created\n');

    // TABLE 8: ACTIVITIES
    console.log('  8️⃣  Creating activities table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        location VARCHAR(200),
        event_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('     ✅ Activities table created\n');

    // TABLE 9: ACTIVITY_SUBSCRIPTIONS (Link table)
    console.log('  9️⃣  Creating activity_subscriptions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_subscriptions (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        activity_id INT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, activity_id)
      );
    `);
    console.log('     ✅ Activity subscriptions table created\n');

    // TABLE 10: CLEARANCE_PROCESS
    console.log('  🔟 Creating clearance_process table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clearance_process (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        room_check_passed BOOLEAN DEFAULT FALSE,
        keys_returned BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) NOT NULL CHECK (status IN ('Pending', 'Completed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('     ✅ Clearance process table created\n');

    // TABLE 11: ANNOUNCEMENTS
    console.log('  1️⃣1️⃣  Creating announcements table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('     ✅ Announcements table created\n');

    // ========================================
    // STEP 2: CLEAR OLD DATA (For Fresh Setup)
    // ========================================
    console.log('📌 STEP 2: Clearing old test data...\n');
    
    // Delete in correct order (respecting foreign keys)
    await pool.query('DELETE FROM activity_subscriptions;');
    await pool.query('DELETE FROM activities;');
    await pool.query('DELETE FROM clearance_process;');
    await pool.query('DELETE FROM permissions;');
    await pool.query('DELETE FROM maintenance_requests;');
    await pool.query('DELETE FROM complaints;');
    await pool.query('DELETE FROM attendance_logs;');
    await pool.query('DELETE FROM students;');
    await pool.query('DELETE FROM rooms;');
    await pool.query('DELETE FROM users;');
    await pool.query('DELETE FROM announcements;');
    
    console.log('  ✅ All old data cleared\n');

    // ========================================
    // STEP 3: HASH PASSWORDS WITH BCRYPT
    // ========================================
    console.log('📌 STEP 3: Hashing passwords...\n');
    
    const studentPasswordHash = await bcrypt.hash('123456', 10);
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    
    console.log('  ✅ Passwords hashed with bcrypt (10 rounds)\n');

    // ========================================
    // STEP 4: SEED TEST DATA
    // ========================================
    console.log('📌 STEP 4: Seeding test data...\n');

    // INSERT ADMIN USER
    console.log('  📝 Inserting admin user...');
    const adminResult = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['admin', adminPasswordHash, 'Ahmed Manager', 'Manager']
    );
    console.log('     ✅ Admin user created (Username: admin, Password: admin123)\n');

    // INSERT ROOMS
    console.log('  📝 Inserting rooms...');
    const roomResult = await pool.query(
      `INSERT INTO rooms (room_number, building, floor, capacity)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['101', 'Building A', 1, 2]
    );
    const roomId = roomResult.rows[0].id;
    console.log(`     ✅ Room 101 created (ID: ${roomId})\n`);

    // INSERT TEST STUDENT
    console.log('  📝 Inserting test student...');
    const studentResult = await pool.query(
      `INSERT INTO students (national_id, password_hash, full_name, faculty, phone, room_id, photo_url, is_suspended)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        '30412010101234',
        studentPasswordHash,
        'محمد أحمد علي',
        'Engineering',
        '+201234567890',
        roomId,
        'https://example.com/student.jpg',
        false
      ]
    );
    const studentId = studentResult.rows[0].id;
    console.log(`     ✅ Test student created (National ID: 30412010101234, Password: 123456)\n`);

    // INSERT ATTENDANCE LOGS (Today and Yesterday - Present)
    console.log('  📝 Inserting attendance records...');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    await pool.query(
      `INSERT INTO attendance_logs (student_id, date, status)
       VALUES ($1, $2, $3), ($4, $5, $6)`,
      [studentId, today, 'Present', studentId, yesterday, 'Present']
    );
    console.log(`     ✅ Attendance: Present today & yesterday\n`);

    // INSERT COMPLAINTS
    console.log('  📝 Inserting complaints...');
    
    // Complaint 1: Normal - Noise
    await pool.query(
      `INSERT INTO complaints (student_id, title, description, is_secret, type, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [studentId, 'Noise Complaint', 'Neighbors making too much noise at night', false, 'General', 'Pending']
    );
    
    // Complaint 2: Secret - Behavior Issue
    await pool.query(
      `INSERT INTO complaints (student_id, title, description, is_secret, type, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [studentId, 'Private Matter', 'Behavioral issue with roommate', true, 'Urgent', 'Pending']
    );
    
    // Complaint 3: Resolved with Admin Reply
    await pool.query(
      `INSERT INTO complaints (student_id, title, description, is_secret, type, status, admin_reply)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [studentId, 'Maintenance Issue', 'Door lock was broken', false, 'General', 'Resolved', 'Fixed, please check now']
    );
    
    console.log(`     ✅ Created 3 complaints: 1 Normal, 1 Secret, 1 Resolved\n`);

    // INSERT MAINTENANCE REQUESTS
    console.log('  📝 Inserting maintenance requests...');
    
    // Pending Electricity Request
    await pool.query(
      `INSERT INTO maintenance_requests (student_id, category, description, status)
       VALUES ($1, $2, $3, $4)`,
      [studentId, 'Electric', 'Light fixture not working in bedroom', 'Open']
    );
    
    // Fixed Plumbing Request
    await pool.query(
      `INSERT INTO maintenance_requests (student_id, category, description, status, supervisor_reply)
       VALUES ($1, $2, $3, $4, $5)`,
      [studentId, 'Plumbing', 'Water leak in bathroom', 'Fixed', 'Fixed, check now']
    );
    
    console.log(`     ✅ Created 2 maintenance requests: 1 Pending, 1 Fixed\n`);

    // INSERT PERMISSIONS
    console.log('  📝 Inserting permissions...');
    
    // Approved Late Permission (Past - History)
    const pastDate = new Date(Date.now() - 7*86400000).toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO permissions (student_id, type, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [studentId, 'Late', pastDate, pastDate, 'Medical appointment', 'Approved']
    );
    
    // Pending Travel Permission (Current/Future)
    const futureDate = new Date(Date.now() + 7*86400000).toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO permissions (student_id, type, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [studentId, 'Travel', futureDate, futureDate, 'Family visit', 'Pending']
    );
    
    console.log(`     ✅ Created 2 permissions: 1 Approved (Late), 1 Pending (Travel)\n`);

    // INSERT ACTIVITIES
    console.log('  📝 Inserting activities...');
    
    const activity1Result = await pool.query(
      `INSERT INTO activities (title, description, image_url, location, event_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        'Football League',
        'University inter-hostel football championship',
        'https://example.com/football.jpg',
        'Main Sports Ground',
        new Date(Date.now() + 14*86400000).toISOString()
      ]
    );
    const activity1Id = activity1Result.rows[0].id;
    
    const activity2Result = await pool.query(
      `INSERT INTO activities (title, description, image_url, location, event_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        'Arts Workshop',
        'Creative arts and crafts workshop for all students',
        'https://example.com/arts.jpg',
        'Art Studio, Building B',
        new Date(Date.now() + 21*86400000).toISOString()
      ]
    );
    const activity2Id = activity2Result.rows[0].id;
    
    console.log(`     ✅ Created 2 activities: Football League, Arts Workshop\n`);

    // INSERT ACTIVITY SUBSCRIPTIONS
    console.log('  📝 Inserting activity subscriptions...');
    
    // Student subscribes to Football League only
    await pool.query(
      `INSERT INTO activity_subscriptions (student_id, activity_id)
       VALUES ($1, $2)`,
      [studentId, activity1Id]
    );
    
    console.log(`     ✅ Student subscribed to: Football League\n`);

    // INSERT CLEARANCE RECORD
    console.log('  📝 Inserting clearance process...');
    
    await pool.query(
      `INSERT INTO clearance_process (student_id, room_check_passed, keys_returned, status)
       VALUES ($1, $2, $3, $4)`,
      [studentId, false, false, 'Pending']
    );
    
    console.log(`     ✅ Clearance status: Pending\n`);

    // INSERT ANNOUNCEMENTS
    console.log('  📝 Inserting announcements...');
    
    await pool.query(
      `INSERT INTO announcements (title, body)
       VALUES ($1, $2), ($3, $4)`,
      [
        'Welcome to Housing System',
        'Welcome to the University Housing Management System. Please review all notices and guidelines.',
        'Maintenance Notice',
        'Scheduled maintenance on Building A, 2nd Floor. Please be available.'
      ]
    );
    
    console.log(`     ✅ Created 2 announcements\n`);

    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('\n╔═════════════════════════════════════╗');
    console.log('║  ✅ DATABASE SETUP COMPLETED!      ║');
    console.log('╚═════════════════════════════════════╝\n');

    console.log('📊 SUMMARY OF CREATED DATA:\n');
    console.log('  ✓ 11 Database Tables Created');
    console.log('  ✓ 1 Admin User (username: admin, password: admin123)');
    console.log('  ✓ 1 Test Room (Room 101, Building A)');
    console.log('  ✓ 1 Test Student (National ID: 30412010101234, password: 123456)');
    console.log('  ✓ 2 Attendance Records (Present today and yesterday)');
    console.log('  ✓ 3 Complaints (1 Normal, 1 Secret, 1 Resolved with reply)');
    console.log('  ✓ 2 Maintenance Requests (1 Pending, 1 Fixed)');
    console.log('  ✓ 2 Permissions (1 Approved Late, 1 Pending Travel)');
    console.log('  ✓ 2 Activities (Football League, Arts Workshop)');
    console.log('  ✓ 1 Activity Subscription (Student → Football League)');
    console.log('  ✓ 1 Clearance Record (Status: Pending)');
    console.log('  ✓ 2 Announcements\n');

    console.log('🔐 SECURITY:\n');
    console.log('  ✓ All passwords hashed with bcrypt (10 salt rounds)');
    console.log('  ✓ Foreign keys enforced for data integrity');
    console.log('  ✓ Unique constraints prevent duplicates');
    console.log('  ✓ Timestamps tracked for audit trail\n');

    console.log('🧪 TEST CREDENTIALS:\n');
    console.log('  Admin:');
    console.log('    Username: admin');
    console.log('    Password: admin123\n');
    console.log('  Student:');
    console.log('    National ID: 30412010101234');
    console.log('    Password: 123456\n');

    console.log('💡 NEXT STEPS:\n');
    console.log('  1. Start the server: npm start');
    console.log('  2. Login with test credentials above');
    console.log('  3. Verify attendance shows "Present" (green checkmark)');
    console.log('  4. View complaints, permissions, and other modules\n');

    await pool.end();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ERROR DURING SETUP:\n');
    console.error('Error Details:', err.message);
    
    if (err.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Connection Failed:');
      console.error('   - PostgreSQL service may not be running');
      console.error('   - Check: sudo service postgresql status');
      console.error('   - Or: brew services list | grep postgres\n');
    } else if (err.message.includes('does not exist')) {
      console.error('\n⚠️  Database Does Not Exist:');
      console.error('   - Create database: createdb housing_db');
      console.error('   - Or: psql -U postgres -c "CREATE DATABASE housing_db;"\n');
    }

    console.error('Full Error:\n', err);
    await pool.end();
    process.exit(1);
  }
};

// ========================================
// RUN SETUP
// ========================================
setupDatabase();

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
 * 1. Creates 9 core tables (students, activities, announcements, etc.)
 * 2. Sets up Foreign Key constraints for data integrity
 * 3. Creates database if it doesn't exist
 * 4. Inserts realistic seed data matching test scenarios
 * 5. Provides detailed console output showing what was created
 * 
 * TABLES CREATED:
 * - students: Student account information
 * - activities: Housing events and activities
 * - announcements: Broadcast announcements
 * - complaints: Student complaints and feedback
 * - maintenance_requests: Maintenance issue reports
 * - permissions: Student leave/travel permissions
 * - notifications: Student notifications log
 * - clearance_requests: Resident clearance process
 * - attendance_logs: Daily attendance records
 * 
 * @requires mysql2/promise - MySQL client with promise support
 * @requires dotenv - Environment variables
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * MySQL Connection Configuration
 * 
 * Configuration:
 * - Credentials from .env file or defaults
 * - Creates database if it doesn't exist
 * - Uses connection pool for efficiency
 */
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'student_housing',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

/**
 * ========================================
 * SETUP FUNCTION - CREATE SCHEMA & SEED DATA
 * ========================================
 */
const setupDatabase = async () => {
  let connection;
  let pool;

  try {
    console.log('\n╔═════════════════════════════════════╗');
    console.log('║  🚀 STUDENT HOUSING SYSTEM DB      ║');
    console.log('╚═════════════════════════════════════╝\n');

    console.log('📋 Starting database initialization...\n');

    // ========================================
    // STEP 1: CREATE DATABASE (if not exists)
    // ========================================
    console.log('📌 STEP 1: Creating database...\n');

    // Create initial connection without database
    const initialConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    // Create database
    const dbName = dbConfig.database;
    await initialConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`  ✅ Database "${dbName}" ready\n`);
    await initialConnection.end();

    // Create pool with database
    pool = mysql.createPool(dbConfig);
    connection = await pool.getConnection();

    // ========================================
    // STEP 2: CREATE TABLES
    // ========================================
    console.log('📌 STEP 2: Creating database tables...\n');

    // TABLE 1: STUDENTS
    console.log('  1️⃣  Creating students table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        national_id VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        student_id VARCHAR(20) UNIQUE,
        college VARCHAR(100),
        academic_year VARCHAR(20),
        room_no VARCHAR(20),
        building_name VARCHAR(100),
        photo_url VARCHAR(500),
        housing_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_national_id (national_id),
        INDEX idx_student_id (student_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('     ✅ Students table created\n');

    // TABLE 2: ACTIVITIES
    console.log('  2️⃣  Creating activities table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description LONGTEXT,
        category VARCHAR(100),
        location VARCHAR(255),
        date DATETIME,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_date (date),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('     ✅ Activities table created\n');

    // TABLE 3: ANNOUNCEMENTS
    console.log('  3️⃣  Creating announcements table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        body LONGTEXT NOT NULL,
        category VARCHAR(100),
        priority VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at),
        INDEX idx_priority (priority)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('     ✅ Announcements table created\n');

    // TABLE 4: COMPLAINTS
    console.log('  4️⃣  Creating complaints table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description LONGTEXT,
        recipient VARCHAR(100),
        is_secret BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'Pending',
        admin_reply LONGTEXT,
        type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        INDEX idx_student_id (student_id),
        INDEX idx_status (status),
        INDEX idx_is_secret (is_secret)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('     ✅ Complaints table created\n');

    // TABLE 5: MAINTENANCE_REQUESTS
    console.log('  5️⃣  Creating maintenance_requests table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS maintenance_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        category VARCHAR(100),
        description LONGTEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        supervisor_reply LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        INDEX idx_student_id (student_id),
        INDEX idx_status (status),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('     ✅ Maintenance requests table created\n');

    // TABLE 6: PERMISSIONS
    console.log('  6️⃣  Creating permissions table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        type VARCHAR(50),
        start_date DATE,
        end_date DATE,
        reason LONGTEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        INDEX idx_student_id (student_id),
        INDEX idx_status (status),
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('     ✅ Permissions table created\n');

    // TABLE 7: NOTIFICATIONS
    console.log('  7️⃣  Creating notifications table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        title VARCHAR(255),
        body LONGTEXT,
        is_unread BOOLEAN DEFAULT TRUE,
        type VARCHAR(100),
        sender_name VARCHAR(150),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        INDEX idx_student_id (student_id),
        INDEX idx_is_unread (is_unread),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('     ✅ Notifications table created\n');

    // TABLE 8: CLEARANCE_REQUESTS
    console.log('  8️⃣  Creating clearance_requests table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS clearance_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        current_step VARCHAR(100),
        initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        INDEX idx_student_id (student_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('     ✅ Clearance requests table created\n');

    // TABLE 9: ATTENDANCE_LOGS
    console.log('  9️⃣  Creating attendance_logs table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE KEY unique_student_date (student_id, date),
        INDEX idx_student_id (student_id),
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('     ✅ Attendance logs table created\n');

    // ========================================
    // STEP 3: CLEAR OLD DATA (For Fresh Setup)
    // ========================================
    console.log('📌 STEP 3: Clearing old test data...\n');
    
    // Delete in correct order (respecting foreign keys)
    await connection.query('DELETE FROM attendance_logs;');
    await connection.query('DELETE FROM notifications;');
    await connection.query('DELETE FROM clearance_requests;');
    await connection.query('DELETE FROM permissions;');
    await connection.query('DELETE FROM maintenance_requests;');
    await connection.query('DELETE FROM complaints;');
    await connection.query('DELETE FROM activities;');
    await connection.query('DELETE FROM announcements;');
    await connection.query('DELETE FROM students;');
    
    console.log('  ✅ All old data cleared\n');

    // ========================================
    // STEP 4: SEED TEST DATA (Only if empty)
    // ========================================
    console.log('📌 STEP 4: Seeding test data...\n');

    // Check if students table is empty before seeding
    const [studentCount] = await connection.query('SELECT COUNT(*) as count FROM students;');
    
    if (studentCount[0].count === 0) {
      console.log('  📝 Inserting test student...');
      
      const [studentResult] = await connection.query(
        `INSERT INTO students 
         (national_id, password, full_name, student_id, college, academic_year, room_no, building_name, photo_url, housing_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          '30412010101234',
          'hashed_password_123456', // In production, use bcrypt to hash
          'محمد أحمد علي',
          'STU001',
          'Engineering',
          '4th Year',
          '101',
          'Building A',
          'https://example.com/student.jpg',
          'On-Campus'
        ]
      );
      
      const studentId = studentResult.insertId;
      console.log(`     ✅ Test student created (ID: ${studentId})\n`);

      // INSERT ATTENDANCE LOGS
      console.log('  📝 Inserting attendance records...');
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      await connection.query(
        `INSERT INTO attendance_logs (student_id, date, status)
         VALUES (?, ?, ?), (?, ?, ?)`,
        [studentId, today, 'Present', studentId, yesterday, 'Present']
      );
      console.log(`     ✅ Attendance: Present today & yesterday\n`);

      // INSERT ACTIVITIES
      console.log('  📝 Inserting activities...');
      
      const futureDate = new Date(Date.now() + 14 * 86400000);
      
      await connection.query(
        `INSERT INTO activities (title, description, category, location, date, image_url)
         VALUES 
         (?, ?, ?, ?, ?, ?),
         (?, ?, ?, ?, ?, ?)`,
        [
          'Football League',
          'University inter-hostel football championship',
          'Sports',
          'Main Sports Ground',
          futureDate,
          'https://example.com/football.jpg',
          'Arts Workshop',
          'Creative arts and crafts workshop for all students',
          'Workshop',
          'Art Studio, Building B',
          new Date(Date.now() + 21 * 86400000),
          'https://example.com/arts.jpg'
        ]
      );
      console.log(`     ✅ Created 2 activities: Football League, Arts Workshop\n`);

      // INSERT ANNOUNCEMENTS
      console.log('  📝 Inserting announcements...');
      
      await connection.query(
        `INSERT INTO announcements (title, body, category, priority)
         VALUES 
         (?, ?, ?, ?),
         (?, ?, ?, ?)`,
        [
          'Welcome to Housing System',
          'Welcome to the University Housing Management System. Please review all notices and guidelines.',
          'General',
          'High',
          'Maintenance Notice',
          'Scheduled maintenance on Building A, 2nd Floor. Please be available.',
          'Maintenance',
          'Medium'
        ]
      );
      console.log(`     ✅ Created 2 announcements\n`);

      // INSERT COMPLAINTS
      console.log('  📝 Inserting complaints...');
      
      await connection.query(
        `INSERT INTO complaints (student_id, title, description, recipient, is_secret, status, type)
         VALUES 
         (?, ?, ?, ?, ?, ?, ?),
         (?, ?, ?, ?, ?, ?, ?),
         (?, ?, ?, ?, ?, ?, ?)`,
        [
          studentId, 'Noise Complaint', 'Neighbors making too much noise at night', 'Management', false, 'Pending', 'General',
          studentId, 'Private Matter', 'Behavioral issue with roommate', 'Management', true, 'Pending', 'Urgent',
          studentId, 'Maintenance Issue', 'Door lock was broken', 'Management', false, 'Resolved', 'General'
        ]
      );
      console.log(`     ✅ Created 3 complaints: 1 Normal, 1 Secret, 1 Resolved\n`);

      // INSERT MAINTENANCE REQUESTS
      console.log('  📝 Inserting maintenance requests...');
      
      await connection.query(
        `INSERT INTO maintenance_requests (student_id, category, description, status)
         VALUES 
         (?, ?, ?, ?),
         (?, ?, ?, ?)`,
        [
          studentId, 'Electric', 'Light fixture not working in bedroom', 'Pending',
          studentId, 'Plumbing', 'Water leak in bathroom', 'Completed'
        ]
      );
      console.log(`     ✅ Created 2 maintenance requests: 1 Pending, 1 Completed\n`);

      // INSERT PERMISSIONS
      console.log('  📝 Inserting permissions...');
      
      const pastDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const futurePermDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      
      await connection.query(
        `INSERT INTO permissions (student_id, type, start_date, end_date, reason, status)
         VALUES 
         (?, ?, ?, ?, ?, ?),
         (?, ?, ?, ?, ?, ?)`,
        [
          studentId, 'Late', pastDate, pastDate, 'Medical appointment', 'Approved',
          studentId, 'Travel', futurePermDate, futurePermDate, 'Family visit', 'Pending'
        ]
      );
      console.log(`     ✅ Created 2 permissions: 1 Approved (Late), 1 Pending (Travel)\n`);

      // INSERT NOTIFICATIONS
      console.log('  📝 Inserting notifications...');
      
      await connection.query(
        `INSERT INTO notifications (student_id, title, body, is_unread, type, sender_name)
         VALUES 
         (?, ?, ?, ?, ?, ?),
         (?, ?, ?, ?, ?, ?)`,
        [
          studentId, 'Welcome!', 'Welcome to the student housing system', true, 'System', 'Admin',
          studentId, 'Maintenance Scheduled', 'Building maintenance on Monday', false, 'Maintenance', 'Supervisor'
        ]
      );
      console.log(`     ✅ Created 2 notifications\n`);

      // INSERT CLEARANCE REQUESTS
      console.log('  📝 Inserting clearance requests...');
      
      await connection.query(
        `INSERT INTO clearance_requests (student_id, status, current_step)
         VALUES (?, ?, ?)`,
        [studentId, 'Pending', 'Room Inspection']
      );
      console.log(`     ✅ Created 1 clearance request: Status Pending\n`);

    } else {
      console.log('  ℹ️  Student data already exists. Skipping seed data.\n');
    }

    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('\n╔═════════════════════════════════════╗');
    console.log('║  ✅ DATABASE SETUP COMPLETED!      ║');
    console.log('╚═════════════════════════════════════╝\n');

    console.log('📊 DATABASE SCHEMA SUMMARY:\n');
    console.log('  ✓ 9 Database Tables Created:');
    console.log('    1. students - Student account information');
    console.log('    2. activities - Housing events and activities');
    console.log('    3. announcements - Broadcast announcements');
    console.log('    4. complaints - Student complaints and feedback');
    console.log('    5. maintenance_requests - Maintenance issue reports');
    console.log('    6. permissions - Student leave/travel permissions');
    console.log('    7. notifications - Student notifications log');
    console.log('    8. clearance_requests - Resident clearance process');
    console.log('    9. attendance_logs - Daily attendance records\n');

    console.log('📊 TEST DATA INSERTED:\n');
    console.log('  ✓ 1 Test Student (National ID: 30412010101234)');
    console.log('  ✓ 2 Attendance Records (Present today and yesterday)');
    console.log('  ✓ 2 Activities (Football League, Arts Workshop)');
    console.log('  ✓ 2 Announcements (Welcome, Maintenance Notice)');
    console.log('  ✓ 3 Complaints (Normal, Secret, Resolved)');
    console.log('  ✓ 2 Maintenance Requests (Pending, Completed)');
    console.log('  ✓ 2 Permissions (Approved Late, Pending Travel)');
    console.log('  ✓ 2 Notifications (System, Maintenance)');
    console.log('  ✓ 1 Clearance Request (Pending)\n');

    console.log('🔧 CONFIGURATION:\n');
    console.log(`  ✓ Database: ${dbName}`);
    console.log(`  ✓ Host: ${dbConfig.host}`);
    console.log(`  ✓ User: ${dbConfig.user}`);
    console.log(`  ✓ Foreign Keys: Enabled`);
    console.log(`  ✓ Character Set: UTF-8 (utf8mb4)\n`);

    console.log('🧪 TEST CREDENTIALS:\n');
    console.log('  Student:');
    console.log('    National ID: 30412010101234');
    console.log('    Password: hashed_password_123456\n');

    console.log('💡 NEXT STEPS:\n');
    console.log('  1. Start the server: npm start');
    console.log('  2. Query the database: SELECT * FROM students;');
    console.log('  3. Verify all tables are populated with test data\n');

    connection.release();
    await pool.end();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ERROR DURING SETUP:\n');
    console.error('Error Details:', err.message);
    console.error('\nFull Error Stack:\n', err);
    
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n⚠️  Connection Failed - Access Denied:');
      console.error('   - Check MySQL user credentials in .env file');
      console.error('   - Ensure MySQL server is running');
      console.error('   - Verify DB_USER and DB_PASSWORD are correct\n');
    } else if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('\n⚠️  Connection Lost:');
      console.error('   - MySQL server may have stopped');
      console.error('   - Check: systemctl status mysql');
      console.error('   - Or: brew services list | grep mysql\n');
    }

    if (connection) {
      connection.release();
    }
    if (pool) {
      await pool.end();
    }
    process.exit(1);
  }
};

// ========================================
// RUN SETUP
// ========================================
setupDatabase();

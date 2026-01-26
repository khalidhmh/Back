# 🚀 setupDB.js - Quick Reference Guide

## Overview

`setupDB.js` is a complete database initialization script that creates a 11-table University Housing System schema and seeds it with realistic test data.

---

## Running the Script

```bash
# Setup the database (creates tables and seeds data)
npm run setup

# Or directly
node setupDB.js
```

---

## What Gets Created

### 11 Tables (In Creation Order)

```
1. users                    → Admin/Supervisor accounts
2. rooms                    → Dormitory rooms
3. students                 → Student/resident accounts
4. attendance_logs          → Roll call records
5. complaints               → Student grievances
6. maintenance_requests     → Facility repair requests
7. permissions              → Late night & travel permits
8. activities               → Events & extracurricular programs
9. activity_subscriptions   → Student-activity link table
10. clearance_process       → Final checkout tracking
11. announcements           → System-wide notifications
```

### Test Data Inserted

**1 Admin User:**
- Username: `admin`
- Password: `admin123`
- Role: Manager

**1 Test Room:**
- Number: 101
- Building: Building A
- Floor: 1
- Capacity: 2

**1 Test Student** (National ID: `30412010101234`, Password: `123456`):
- Name: محمد أحمد علي
- Faculty: Engineering
- Phone: +201234567890
- Room: 101
- Suspended: No

**Attendance:**
- ✅ Today: Present
- ✅ Yesterday: Present

**3 Complaints:**
1. "Noise Complaint" - Normal, Pending
2. "Private Matter" - Secret/Urgent, Pending
3. "Door Lock" - General, Resolved (with admin reply)

**2 Maintenance Requests:**
1. "Light fixture" - Electrical, Open/Pending
2. "Water leak" - Plumbing, Fixed (with supervisor reply)

**2 Permissions:**
1. Medical appointment - Late, Approved (past date - history)
2. Family visit - Travel, Pending (future date - current)

**2 Activities:**
1. Football League (in 14 days)
2. Arts Workshop (in 21 days)

**1 Activity Subscription:**
- Student subscribed to: Football League
- Not subscribed to: Arts Workshop

**1 Clearance Record:**
- Status: Pending
- Room check: Not passed
- Keys: Not returned

**2 Announcements:**
1. Welcome to Housing System
2. Maintenance Notice

---

## Expected Console Output

```
╔═════════════════════════════════════╗
║  🚀 UNIVERSITY HOUSING SYSTEM DB   ║
╚═════════════════════════════════════╝

📋 Starting database initialization...

📌 STEP 1: Creating database tables...

  1️⃣  Creating users table...
     ✅ Users table created

  2️⃣  Creating rooms table...
     ✅ Rooms table created

  3️⃣  Creating students table...
     ✅ Students table created

  4️⃣  Creating attendance_logs table...
     ✅ Attendance logs table created

  5️⃣  Creating complaints table...
     ✅ Complaints table created

  6️⃣  Creating maintenance_requests table...
     ✅ Maintenance requests table created

  7️⃣  Creating permissions table...
     ✅ Permissions table created

  8️⃣  Creating activities table...
     ✅ Activities table created

  9️⃣  Creating activity_subscriptions table...
     ✅ Activity subscriptions table created

  🔟 Creating clearance_process table...
     ✅ Clearance process table created

  1️⃣1️⃣  Creating announcements table...
     ✅ Announcements table created

📌 STEP 2: Clearing old test data...

  ✅ All old data cleared

📌 STEP 3: Hashing passwords...

  ✅ Passwords hashed with bcrypt (10 rounds)

📌 STEP 4: Seeding test data...

  📝 Inserting admin user...
     ✅ Admin user created (Username: admin, Password: admin123)

  📝 Inserting rooms...
     ✅ Room 101 created (ID: 1)

  📝 Inserting test student...
     ✅ Test student created (National ID: 30412010101234, Password: 123456)

  📝 Inserting attendance records...
     ✅ Attendance: Present today & yesterday

  📝 Inserting complaints...
     ✅ Created 3 complaints: 1 Normal, 1 Secret, 1 Resolved

  📝 Inserting maintenance requests...
     ✅ Created 2 maintenance requests: 1 Pending, 1 Fixed

  📝 Inserting permissions...
     ✅ Created 2 permissions: 1 Approved (Late), 1 Pending (Travel)

  📝 Inserting activities...
     ✅ Created 2 activities: Football League, Arts Workshop

  📝 Inserting activity subscriptions...
     ✅ Student subscribed to: Football League

  📝 Inserting clearance process...
     ✅ Clearance status: Pending

  📝 Inserting announcements...
     ✅ Created 2 announcements


╔═════════════════════════════════════╗
║  ✅ DATABASE SETUP COMPLETED!      ║
╚═════════════════════════════════════╝

📊 SUMMARY OF CREATED DATA:

  ✓ 11 Database Tables Created
  ✓ 1 Admin User (username: admin, password: admin123)
  ✓ 1 Test Room (Room 101, Building A)
  ✓ 1 Test Student (National ID: 30412010101234, password: 123456)
  ✓ 2 Attendance Records (Present today and yesterday)
  ✓ 3 Complaints (1 Normal, 1 Secret, 1 Resolved with reply)
  ✓ 2 Maintenance Requests (1 Pending, 1 Fixed)
  ✓ 2 Permissions (1 Approved Late, 1 Pending Travel)
  ✓ 2 Activities (Football League, Arts Workshop)
  ✓ 1 Activity Subscription (Student → Football League)
  ✓ 1 Clearance Record (Status: Pending)
  ✓ 2 Announcements

🔐 SECURITY:

  ✓ All passwords hashed with bcrypt (10 salt rounds)
  ✓ Foreign keys enforced for data integrity
  ✓ Unique constraints prevent duplicates
  ✓ Timestamps tracked for audit trail

🧪 TEST CREDENTIALS:

  Admin:
    Username: admin
    Password: admin123

  Student:
    National ID: 30412010101234
    Password: 123456

💡 NEXT STEPS:

  1. Start the server: npm start
  2. Login with test credentials above
  3. Verify attendance shows "Present" (green checkmark)
  4. View complaints, permissions, and other modules
```

---

## Test Scenarios

### Scenario 1: Login as Student
```
userType: "student"
id: "30412010101234"
password: "123456"

Expected Response:
✅ Login success
Token issued with role: "student"
```

### Scenario 2: Check Attendance
```
SELECT status FROM attendance_logs 
WHERE student_id = 1 AND date = TODAY

Expected:
Present ✅ (shows green checkmark in UI)
```

### Scenario 3: View Complaints
```
- Noise Complaint (Normal, Pending) - visible
- Private Matter (Secret, Urgent, Pending) - visible with lock icon
- Door Lock (General, Resolved) - shows "Resolved" with admin reply
```

### Scenario 4: Check Maintenance Status
```
- Electricity (Open) - appears in pending section
- Plumbing (Fixed) - appears in completed with supervisor note
```

### Scenario 5: Review Permissions
```
- Medical appointment (Approved, Past) - appears in history/approved
- Family visit (Pending, Future) - appears in pending/current
```

### Scenario 6: Browse Activities
```
- Football League: Student is subscribed ✅
- Arts Workshop: Student is not subscribed
```

### Scenario 7: Check Clearance Status
```
Status: Pending
Room check: ❌ Not passed
Keys returned: ❌ Not returned

Shows incomplete status to trigger clearance workflow
```

---

## Code Structure

### Step 1: Connection Setup
```javascript
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});
```

### Step 2: Create Tables (if not exist)
```javascript
await pool.query(`CREATE TABLE IF NOT EXISTS users (...)`);
await pool.query(`CREATE TABLE IF NOT EXISTS rooms (...)`);
// ... etc for all 11 tables
```

### Step 3: Clear Old Data (in FK order)
```javascript
// Delete dependent data first
await pool.query('DELETE FROM activity_subscriptions;');
await pool.query('DELETE FROM activities;');
// ... etc in reverse FK order
```

### Step 4: Hash Passwords
```javascript
const studentPasswordHash = await bcrypt.hash('123456', 10);
const adminPasswordHash = await bcrypt.hash('admin123', 10);
```

### Step 5: Insert Data
```javascript
// Insert with parameterized queries for security
await pool.query(
  `INSERT INTO users (username, password_hash, full_name, role)
   VALUES ($1, $2, $3, $4)`,
  ['admin', adminPasswordHash, 'Ahmed Manager', 'Manager']
);
```

### Step 6: Display Results
```javascript
console.log('✅ Database setup completed!');
console.log('📊 Summary: ...');
console.log('🧪 Test credentials: ...');
```

---

## Environment Configuration

### Required .env Variables

```
# Database Connection
DB_USER=postgres
DB_PASSWORD=Khalid@123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=housing_db

# Application
PORT=3000
NODE_ENV=development
JWT_SECRET=your_secret_key
```

---

## Troubleshooting

### Error: ECONNREFUSED
```
❌ PostgreSQL not running
✅ Fix: Start PostgreSQL service
   - Linux: sudo service postgresql start
   - macOS: brew services start postgresql
```

### Error: "database does not exist"
```
❌ housing_db database not created
✅ Fix: createdb housing_db
   or: psql -U postgres -c "CREATE DATABASE housing_db;"
```

### Error: "password authentication failed"
```
❌ Wrong PostgreSQL credentials in .env
✅ Fix: Update DB_USER and DB_PASSWORD in .env
   Verify PostgreSQL user exists and password is correct
```

### Error: "relation already exists"
```
❌ Database already initialized
✅ Fix: Script handles this with "IF NOT EXISTS"
   Old data is automatically cleared
```

### Cannot run again
```
✅ Script is idempotent - run as many times as needed
✅ Data is cleared before new insert
✅ Safe for development/testing
```

---

## Modifying Test Data

### Add More Test Students

Edit `setupDB.js` and add after line ~300:

```javascript
// Additional student
const student2Result = await pool.query(
  `INSERT INTO students (national_id, password_hash, full_name, faculty, phone, room_id, photo_url, is_suspended)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
   RETURNING id`,
  [
    '30412010101235',
    studentPasswordHash,
    'علي محمود أحمد',
    'Science',
    '+201234567891',
    roomId,
    'https://example.com/student2.jpg',
    false
  ]
);
```

### Add More Activities

```javascript
const activity3Result = await pool.query(
  `INSERT INTO activities (title, description, image_url, location, event_date)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING id`,
  [
    'Basketball Tournament',
    'Outdoor basketball competition',
    'https://example.com/basketball.jpg',
    'Court, Building C',
    new Date(Date.now() + 28*86400000).toISOString()
  ]
);
```

### Change Test Credentials

```javascript
// Change student password (line ~290)
const studentPasswordHash = await bcrypt.hash('newPassword123', 10);

// Change admin password (line ~295)
const adminPasswordHash = await bcrypt.hash('newAdminPass456', 10);

// Change student name (line ~310)
'علي محمود يوسف',  // Different Arabic name
```

---

## Re-running the Script

**Safe to Run Multiple Times:**
```bash
npm run setup
# Clears old data automatically
# Creates tables if they don't exist
# Inserts fresh test data each time
```

**Use Cases:**
- Initial development setup
- Testing database features
- Resetting to clean state
- Verifying after schema changes
- Training/demo purposes

---

## Performance Notes

- **First Run:** ~2-5 seconds (table creation + data insert)
- **Subsequent Runs:** ~1-3 seconds (data clear + insert)
- **Bcrypt Hashing:** ~100ms per password (10 salt rounds)
- **No Indexes Built:** Indexes on FK columns created automatically
- **Connection Pooling:** Ready for application startup

---

## Security Considerations

✅ **Implemented:**
- Passwords hashed with bcrypt (10 rounds, ~100ms per hash)
- Parameterized queries ($1, $2 syntax prevents SQL injection)
- Foreign keys for referential integrity
- Unique constraints on sensitive fields
- Check constraints enforce valid values
- Timestamps for audit trails

⚠️ **Additional Production Steps:**
- Change test credentials before deployment
- Enable PostgreSQL SSL/TLS
- Use strong JWT_SECRET
- Implement row-level security (RLS)
- Regular backups
- Monitor slow queries

---

## Related Files

- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Complete schema documentation
- [README.md](README.md) - Project overview
- [QUICKSTART.md](QUICKSTART.md) - 5-minute setup guide
- [.env](.env) - Configuration file

---

## Support & Questions

For detailed information, see:
- **Schema Details:** DATABASE_SCHEMA.md
- **Setup Issues:** QUICKSTART.md > Troubleshooting
- **Security Review:** SECURITY.md
- **API Integration:** API_DOCUMENTATION.md

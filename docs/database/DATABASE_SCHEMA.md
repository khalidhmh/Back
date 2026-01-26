# 🗄️ University Housing System - Database Schema Documentation

## Overview

Complete PostgreSQL database schema designed to manage University Housing System with 11 interconnected tables supporting authentication, room management, attendance, complaints, maintenance, permissions, activities, and clearance processes.

---

## Table of Contents

1. [Schema Diagram](#schema-diagram)
2. [Tables Specification](#tables-specification)
3. [Foreign Keys & Relationships](#foreign-keys--relationships)
4. [Test Data Overview](#test-data-overview)
5. [Data Integrity Constraints](#data-integrity-constraints)
6. [Setting Up the Database](#setting-up-the-database)

---

## Schema Diagram

```
┌──────────────────┐
│    USERS         │  (Admin/Supervisors)
├──────────────────┤
│ id (PK)          │
│ username (UNIQUE)│
│ password_hash    │
│ full_name        │
│ role             │
│ timestamps       │
└──────────────────┘


┌──────────────────┐
│    ROOMS         │  (Housing units)
├──────────────────┤
│ id (PK)          │
│ room_number (UQ) │
│ building         │
│ floor            │
│ capacity         │
│ timestamps       │
└────────┬─────────┘
         │
         │ (1:N) room_id
         │
┌────────▼─────────────────┐
│    STUDENTS              │  (Residents)
├──────────────────────────┤
│ id (PK)                  │
│ national_id (UNIQUE)     │
│ password_hash            │
│ full_name                │
│ faculty                  │
│ phone                    │
│ room_id (FK → rooms)     │
│ photo_url                │
│ is_suspended (Boolean)   │
│ timestamps               │
└────────┬────────┬────────┬─────────────┬──────────────┬─────────────────┬──────────────┐
         │        │        │             │              │                 │              │
         │        │        │             │              │                 │              │
         │        │        │             │              │                 │              │
    (1:N)│    (1:N)│   (1:N)│         (1:N)│          (1:N)│            (1:N)│          (1:N)│
         │        │        │             │              │                 │              │
    ┌────▼──┐ ┌───▼────┐ ┌──▼──────┐  ┌─▼────────┐ ┌──▼──────────┐  ┌───▼────────────┐ ┌──▼──────────┐
    │ATTEND │ │COMPLNT │ │MAINT.   │  │PERMISSNS │ │CLEARANCE    │  │ACTIVITY SUBS   │ │ANNOUNCEMENTS│
    │LOGS   │ │        │ │REQUESTS │  │          │ │PROCESS      │  │                │ │(Global)     │
    └───────┘ └────────┘ └─────────┘  └──────────┘ └─────────────┘  └────────────────┘ └─────────────┘
                           │
                          (1:N)
                           │
                     ┌─────▼──────┐
                     │  ACTIVITIES │
                     │             │
                     └─────────────┘
```

---

## Tables Specification

### 1. **USERS** - Admin and Supervisor Accounts

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | SERIAL | PRIMARY KEY | Unique identifier |
| `username` | VARCHAR(50) | UNIQUE NOT NULL | Login identifier |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt-hashed password |
| `full_name` | VARCHAR(150) | NOT NULL | Display name |
| `role` | VARCHAR(50) | CHECK ('Manager' \| 'Supervisor') | Admin role |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last modification |

**Purpose:** Store administrator and supervisor credentials for system access.

**Security Features:**
- Passwords hashed with bcrypt (10 salt rounds)
- Role-based access control
- Audit timestamps

---

### 2. **ROOMS** - Housing Units/Dormitory Rooms

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | SERIAL | PRIMARY KEY | Unique identifier |
| `room_number` | VARCHAR(20) | UNIQUE NOT NULL | Room identifier (e.g., "101", "A-201") |
| `building` | VARCHAR(50) | NOT NULL | Building name (e.g., "Building A") |
| `floor` | INT | NOT NULL | Floor number |
| `capacity` | INT | NOT NULL | Number of beds/occupants |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |

**Purpose:** Define physical dormitory rooms and their locations.

**Relationships:**
- Referenced by `students.room_id` (1:N)

---

### 3. **STUDENTS** - Student/Resident Accounts

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | SERIAL | PRIMARY KEY | Unique identifier |
| `national_id` | VARCHAR(14) | UNIQUE NOT NULL | 14-digit national ID (login credential) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt-hashed password |
| `full_name` | VARCHAR(150) | NOT NULL | Student name |
| `faculty` | VARCHAR(100) | NULLABLE | Faculty/Department |
| `phone` | VARCHAR(20) | NULLABLE | Contact phone |
| `room_id` | INT | FK → rooms(id) ON DELETE SET NULL | Assigned room |
| `photo_url` | VARCHAR(500) | NULLABLE | Profile photo URL |
| `is_suspended` | BOOLEAN | DEFAULT FALSE | Suspension status |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration date |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |

**Purpose:** Core student data with authentication and housing assignment.

**Security Features:**
- National ID uniqueness prevents duplicates
- Passwords hashed with bcrypt
- Suspension flag for account management
- Audit timestamps

**Relationships:**
- References `rooms(id)` (Many-to-One)
- Referenced by 6 other tables via `student_id`

---

### 4. **ATTENDANCE_LOGS** - Roll Call Records

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | SERIAL | PRIMARY KEY | Record identifier |
| `student_id` | INT | FK → students(id) ON DELETE CASCADE | Student reference |
| `date` | DATE | NOT NULL | Attendance date |
| `status` | VARCHAR(20) | CHECK ('Present' \| 'Absent') | Presence status |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation |

**Unique Constraint:** (student_id, date) - One record per student per day

**Purpose:** Track daily attendance/roll call with green checkmark for present.

**Scenario Data:**
```
- Today: Present (green checkmark in UI)
- Yesterday: Present (history)
```

---

### 5. **COMPLAINTS** - Student Grievances & Reports

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | SERIAL | PRIMARY KEY | Complaint ID |
| `student_id` | INT | FK → students(id) ON DELETE CASCADE | Complainant |
| `title` | VARCHAR(200) | NOT NULL | Complaint subject |
| `description` | TEXT | NOT NULL | Detailed description |
| `is_secret` | BOOLEAN | DEFAULT FALSE | Confidentiality flag |
| `type` | VARCHAR(50) | CHECK ('General' \| 'Urgent') | Severity level |
| `status` | VARCHAR(50) | CHECK ('Pending' \| 'Resolved') | Resolution status |
| `attachment_url` | VARCHAR(500) | NULLABLE | Evidence/file attachment |
| `admin_reply` | TEXT | NULLABLE | Admin response |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Report date |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |

**Purpose:** Allow students to report issues with confidentiality options.

**Scenario Data:**
```javascript
1. Normal: "Noise Complaint" (Pending)
2. Secret: "Behavioral issue" (Pending, Urgent)
3. Resolved: "Door lock broken" (Resolved, with admin reply: "Fixed, please check now")
```

---

### 6. **MAINTENANCE_REQUESTS** - Facility Repair Requests

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | SERIAL | PRIMARY KEY | Request ID |
| `student_id` | INT | FK → students(id) ON DELETE CASCADE | Requester |
| `category` | VARCHAR(50) | CHECK ('Plumbing' \| 'Electric' \| 'Net' \| 'Furniture' \| 'Other') | Maintenance type |
| `description` | TEXT | NOT NULL | Issue description |
| `status` | VARCHAR(50) | CHECK ('Open' \| 'In Progress' \| 'Fixed') | Work status |
| `supervisor_reply` | TEXT | NULLABLE | Supervisor notes/completion report |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Request date |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |

**Purpose:** Track facility maintenance requests from initial report to completion.

**Scenario Data:**
```javascript
1. Pending: "Electricity - Light fixture not working" (Status: Open)
2. Fixed: "Plumbing - Water leak" (Status: Fixed, reply: "Fixed, check now")
```

---

### 7. **PERMISSIONS** - Late Night & Travel Permits

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | SERIAL | PRIMARY KEY | Permission ID |
| `student_id` | INT | FK → students(id) ON DELETE CASCADE | Student |
| `type` | VARCHAR(50) | CHECK ('Late' \| 'Travel') | Permission type |
| `start_date` | DATE | NOT NULL | Start date |
| `end_date` | DATE | NOT NULL | End date |
| `reason` | TEXT | NOT NULL | Justification |
| `status` | VARCHAR(50) | CHECK ('Pending' \| 'Approved' \| 'Rejected') | Approval status |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Request date |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |

**Purpose:** Track permission requests for late nights and travel.

**Scenario Data:**
```javascript
1. Approved: "Late" permission (Past - 7 days ago, reason: "Medical appointment")
2. Pending: "Travel" permission (Future - 7 days ahead, reason: "Family visit")
```

---

### 8. **ACTIVITIES** - Events & Extracurricular Programs

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | SERIAL | PRIMARY KEY | Activity ID |
| `title` | VARCHAR(200) | NOT NULL | Activity name |
| `description` | TEXT | NULLABLE | Activity details |
| `image_url` | VARCHAR(500) | NULLABLE | Promotional image |
| `location` | VARCHAR(200) | NULLABLE | Venue |
| `event_date` | TIMESTAMP | NULLABLE | Scheduled date/time |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |

**Purpose:** List upcoming events and activities for student engagement.

**Scenario Data:**
```javascript
1. Football League (14 days from now, Main Sports Ground)
2. Arts Workshop (21 days from now, Art Studio)
```

---

### 9. **ACTIVITY_SUBSCRIPTIONS** - Student-Activity Link Table

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | SERIAL | PRIMARY KEY | Subscription ID |
| `student_id` | INT | FK → students(id) ON DELETE CASCADE | Student participant |
| `activity_id` | INT | FK → activities(id) ON DELETE CASCADE | Activity |
| `subscribed_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration date |

**Unique Constraint:** (student_id, activity_id) - Prevent duplicate subscriptions

**Purpose:** Track which students are registered for which activities.

**Scenario Data:**
```
- Test student subscribed to: Football League
- Not subscribed to: Arts Workshop
```

---

### 10. **CLEARANCE_PROCESS** - Final Checkout/Graduation Process

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | SERIAL | PRIMARY KEY | Clearance ID |
| `student_id` | INT | FK → students(id) ON DELETE CASCADE | Student |
| `room_check_passed` | BOOLEAN | DEFAULT FALSE | Room inspection status |
| `keys_returned` | BOOLEAN | DEFAULT FALSE | Key return status |
| `status` | VARCHAR(50) | CHECK ('Pending' \| 'Completed') | Overall status |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Initiation date |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |

**Purpose:** Track student checkout/graduation clearance requirements.

**Scenario Data:**
```javascript
- Status: Pending
- Room check: Not passed (false)
- Keys returned: Not returned (false)
```

---

### 11. **ANNOUNCEMENTS** - System-wide Notifications

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | SERIAL | PRIMARY KEY | Announcement ID |
| `title` | VARCHAR(200) | NOT NULL | Headline |
| `body` | TEXT | NOT NULL | Full message |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Publication date |

**Purpose:** Broadcast important notices to all students.

**Scenario Data:**
```javascript
1. "Welcome to Housing System" - System introduction
2. "Maintenance Notice" - Building A, 2nd Floor scheduled maintenance
```

---

## Foreign Keys & Relationships

### One-to-Many (1:N) Relationships

```
ROOMS (1) ──── (N) STUDENTS
  |
  └─ Each room can house multiple students
     A student can only be in one room (or none)

STUDENTS (1) ──── (N) ATTENDANCE_LOGS
  |
  └─ Each student has multiple attendance records
     One record per student per day (UNIQUE constraint)

STUDENTS (1) ──── (N) COMPLAINTS
  |
  └─ Each student can file multiple complaints
     Complaints are deleted if student is deleted (CASCADE)

STUDENTS (1) ──── (N) MAINTENANCE_REQUESTS
  |
  └─ Each student can submit multiple maintenance requests
     Deleted with student (CASCADE)

STUDENTS (1) ──── (N) PERMISSIONS
  |
  └─ Each student can request multiple permissions
     Deleted with student (CASCADE)

ACTIVITIES (1) ──── (N) ACTIVITY_SUBSCRIPTIONS
  |
  └─ Each activity has multiple subscribers
     Subscription deleted if activity deleted (CASCADE)

STUDENTS (1) ──── (N) ACTIVITY_SUBSCRIPTIONS
  |
  └─ Each student subscribes to multiple activities
     Subscriptions deleted if student deleted (CASCADE)

STUDENTS (1) ──── (N) CLEARANCE_PROCESS
  |
  └─ Each student has one clearance record
     Deleted with student (CASCADE)
```

### Cascading Delete Behavior

When a student is deleted:
- All attendance logs deleted
- All complaints deleted
- All maintenance requests deleted
- All permissions deleted
- All activity subscriptions deleted
- Clearance record deleted
- room_id in students becomes NULL (SET NULL), not deleted

---

## Test Data Overview

### Test Student Profile

**Student:**
- National ID: `30412010101234`
- Password: `123456`
- Full Name: محمد أحمد علي (Muhammad Ahmad Ali)
- Faculty: Engineering
- Phone: +201234567890
- Room: 101 (Building A, Floor 1)
- Status: Not suspended

**Admin:**
- Username: `admin`
- Password: `admin123`
- Full Name: Ahmed Manager
- Role: Manager

### Data Distributed Across Tables

```
students (1 record)
  │
  ├─ attendance_logs (2 records)
  │   ├─ Today: Present ✅ (shows green checkmark in UI)
  │   └─ Yesterday: Present ✅
  │
  ├─ complaints (3 records)
  │   ├─ "Noise Complaint" (Normal, Pending)
  │   ├─ "Private Matter" (Secret Urgent, Pending)
  │   └─ "Door Lock" (General, Resolved, admin reply included)
  │
  ├─ maintenance_requests (2 records)
  │   ├─ "Light fixture" (Electric, Open/Pending)
  │   └─ "Water leak" (Plumbing, Fixed, with reply)
  │
  ├─ permissions (2 records)
  │   ├─ "Medical appointment" (Late, Approved, Past)
  │   └─ "Family visit" (Travel, Pending, Future)
  │
  ├─ activity_subscriptions (1 record)
  │   └─ Football League (subscribed)
  │
  └─ clearance_process (1 record)
      └─ Status: Pending
         ├─ Room check: Not passed
         └─ Keys: Not returned

rooms (1 record)
  └─ Room 101, Building A, Floor 1, Capacity 2

activities (2 records)
  ├─ Football League (in 14 days)
  └─ Arts Workshop (in 21 days)

announcements (2 records)
  ├─ Welcome message
  └─ Maintenance notice
```

---

## Data Integrity Constraints

### Unique Constraints

```sql
-- User uniqueness
users.username UNIQUE
students.national_id UNIQUE
rooms.room_number UNIQUE

-- Composite uniqueness (prevent duplicates)
attendance_logs(student_id, date) UNIQUE
activity_subscriptions(student_id, activity_id) UNIQUE
```

### Check Constraints

```sql
-- Allowed values only
users.role IN ('Manager', 'Supervisor')
attendance_logs.status IN ('Present', 'Absent')
complaints.type IN ('General', 'Urgent')
complaints.status IN ('Pending', 'Resolved')
maintenance_requests.category IN ('Plumbing', 'Electric', 'Net', 'Furniture', 'Other')
maintenance_requests.status IN ('Open', 'In Progress', 'Fixed')
permissions.type IN ('Late', 'Travel')
permissions.status IN ('Pending', 'Approved', 'Rejected')
clearance_process.status IN ('Pending', 'Completed')
```

### Foreign Key Constraints

```sql
-- All FK constraints use ON DELETE CASCADE (except rooms)
-- Deletion cascades through student records to all related data

students.room_id → rooms(id) ON DELETE SET NULL
  (Student's room becomes NULL if room deleted, student not deleted)

All student_id foreign keys → students(id) ON DELETE CASCADE
  (Record deleted when student deleted)

activity_subscriptions.activity_id → activities(id) ON DELETE CASCADE
  (Subscription deleted when activity deleted)
```

---

## Setting Up the Database

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm packages: `pg`, `bcrypt`, `dotenv`

### Quick Setup

```bash
# 1. Create database
createdb housing_db

# 2. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 3. Run setup script
npm run setup
```

### What the Setup Script Does

1. **Creates 11 tables** with proper constraints and relationships
2. **Clears old data** in correct order (respecting foreign keys)
3. **Hashes passwords** using bcrypt (10 salt rounds)
4. **Seeds realistic test data** matching the scenarios described
5. **Verifies success** with detailed console output

### Output Example

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
  ...
  1️⃣1️⃣  Creating announcements table...
     ✅ Announcements table created

📌 STEP 2: Clearing old test data...
  ✅ All old data cleared

📌 STEP 3: Hashing passwords...
  ✅ Passwords hashed with bcrypt (10 rounds)

📌 STEP 4: Seeding test data...
  📝 Inserting admin user...
     ✅ Admin user created
  ...
  📝 Inserting announcements...
     ✅ Created 2 announcements

╔═════════════════════════════════════╗
║  ✅ DATABASE SETUP COMPLETED!      ║
╚═════════════════════════════════════╝
```

---

## Frontend Integration

### Expected UI Behavior with Test Data

**Attendance Module:**
- Green checkmark for today (Present)
- History showing yesterday as Present

**Complaints Module:**
- "Noise Complaint" appears as pending (normal type)
- "Private Matter" appears with lock icon (secret)
- "Door Lock" shows resolved with admin's reply visible

**Maintenance Module:**
- Electricity request appears as "Open" (pending)
- Plumbing request appears as "Fixed" with supervisor's completion note

**Permissions Module:**
- Medical appointment shows in "Approved" tab (history)
- Family visit shows in "Pending" tab (current/upcoming)

**Activities Module:**
- Football League shows as subscribed
- Arts Workshop shows as available (not subscribed)

**Clearance Module:**
- Shows "Pending" status
- Room check and keys indicators show uncompleted

---

## Query Examples

### Common Queries

```sql
-- Get student's current attendance status
SELECT status FROM attendance_logs 
WHERE student_id = 1 AND date = CURRENT_DATE;

-- Get pending complaints for a student
SELECT * FROM complaints 
WHERE student_id = 1 AND status = 'Pending';

-- Get all students in a room
SELECT * FROM students WHERE room_id = 1;

-- Get active permissions for a student
SELECT * FROM permissions 
WHERE student_id = 1 AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE;

-- Get student's activity subscriptions
SELECT a.* FROM activities a
JOIN activity_subscriptions s ON a.id = s.activity_id
WHERE s.student_id = 1;
```

---

## Performance Considerations

1. **Indexes on Foreign Keys:** Automatically created on FK columns
2. **Unique Constraints:** Used for fast lookups on username, national_id, room_number
3. **Composite Indexes:** (student_id, date) for attendance uniqueness
4. **Query Optimization:** Use WHERE clauses to filter before JOIN operations
5. **Connection Pooling:** Implemented in db.js for efficient resource usage

---

## Backup & Maintenance

### Regular Backup
```bash
pg_dump -U postgres housing_db > backup.sql
```

### Restore from Backup
```bash
createdb housing_db_restored
psql -U postgres housing_db_restored < backup.sql
```

### View Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Security Best Practices

✅ **Implemented:**
- Passwords hashed with bcrypt (10 salt rounds)
- Foreign keys for referential integrity
- Parameterized queries in application code
- UNIQUE constraints prevent duplicates
- CHECK constraints enforce valid values
- Audit timestamps on all records
- Cascade deletes for data consistency

⚠️ **Additional Production Measures:**
- Enable row-level security (RLS)
- Regular backups with offsite storage
- Connection SSL/TLS encryption
- Database user with minimal required permissions
- Regular security audits
- Monitor slow queries
- Archive old data periodically

---

## Troubleshooting

### Common Issues

**Error: "ECONNREFUSED"**
```bash
# PostgreSQL not running
sudo service postgresql start  # Linux
brew services start postgresql  # macOS
```

**Error: "database does not exist"**
```bash
createdb housing_db
# OR
psql -U postgres -c "CREATE DATABASE housing_db;"
```

**Error: "permission denied"**
- Check .env file credentials
- Verify PostgreSQL user exists
- Ensure user has database creation rights

**Unique constraint violation on re-run**
- Script clears old data automatically
- If error persists, manually drop and recreate database

---

## Future Schema Extensions

Potential tables for future functionality:

```sql
-- Room cleaning/inspection schedule
CREATE TABLE room_inspections (...)

-- Fee/payment tracking
CREATE TABLE fee_payments (...)

-- Guest management
CREATE TABLE guest_logs (...)

-- Room change history
CREATE TABLE room_transfers (...)

-- Behavior/disciplinary records
CREATE TABLE disciplinary_actions (...)

-- Visitor passes
CREATE TABLE visitor_passes (...)
```


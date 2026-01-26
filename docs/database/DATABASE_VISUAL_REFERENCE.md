# 📊 Database Schema - Visual Guide & Quick Reference

## Database Architecture Overview

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                        UNIVERSITY HOUSING SYSTEM DATABASE                      ║
║                              (11 Tables, 11 FK Relationships)                  ║
╚════════════════════════════════════════════════════════════════════════════════╝

                                    USER MANAGEMENT
                                          │
                         ┌────────────────┴────────────────┐
                         │                                 │
                    ┌────▼────┐                      ┌─────▼──────┐
                    │  USERS   │                      │   ROOMS    │
                    ├──────────┤                      ├────────────┤
                    │ id (PK)  │                      │ id (PK)    │
                    │ username │                      │ room#(UQ)  │
                    │ password │                      │ building   │
                    │ full_name│                      │ floor      │
                    │ role     │                      │ capacity   │
                    └──────────┘                      └─────┬──────┘
                                                           │
                                                    (FK: 1─to─N)
                                                           │
                    ┌──────────────────────────────────────▼──────────────────────────────────┐
                    │                                                                          │
                    │                           STUDENTS (Central Hub)                         │
                    │                                                                          │
                    │                        ┌─────────────────────────┐                      │
                    │                        │  id (PK)                │                      │
                    │                        │  national_id (UNIQUE)   │                      │
                    │                        │  password_hash          │                      │
                    │                        │  full_name              │                      │
                    │                        │  faculty                │                      │
                    │                        │  phone                  │                      │
                    │                        │  room_id (FK → ROOMS)   │                      │
                    │                        │  photo_url              │                      │
                    │                        │  is_suspended           │                      │
                    │                        │  created_at             │                      │
                    │                        │  updated_at             │                      │
                    │                        └─────────────────────────┘                      │
                    │                                                                          │
                    └──────────────────────────────────────────────────────────────────────────┘
                                                    │
                                    (1-to-N relationships)
                    ┌───────────────────────┬───────┴─────────┬──────────────────┬────────────────────┐
                    │                       │                 │                  │                    │
             ┌──────▼────────┐    ┌────────▼────────┐  ┌─────▼────────┐   ┌────▼──────────┐    ┌───▼──────────────┐
             │ ATTENDANCE    │    │  COMPLAINTS     │  │ MAINTENANCE  │   │ PERMISSIONS   │    │ CLEARANCE        │
             ├───────────────┤    ├────────────────┤  ├──────────────┤   ├───────────────┤    ├──────────────────┤
             │ id (PK)       │    │ id (PK)        │  │ id (PK)      │   │ id (PK)       │    │ id (PK)          │
             │ student_id(FK)│    │ student_id(FK) │  │ student_id(FK)   │ student_id(FK)   │ student_id(FK)      │
             │ date          │    │ title          │  │ category     │   │ type          │    │ room_check_pass  │
             │ status        │    │ description    │  │ description  │   │ start_date    │    │ keys_returned    │
             │ created_at    │    │ is_secret      │  │ status       │   │ end_date      │    │ status           │
             │               │    │ type           │  │ supervisor_re│   │ reason        │    │ created_at       │
             │ UQ:(student   │    │ status         │  │ created_at   │   │ status        │    │ updated_at       │
             │  _id, date)   │    │ attachment_url │  │ updated_at   │   │ created_at    │    └──────────────────┘
             │               │    │ admin_reply    │  │              │   │ updated_at    │
             │               │    │ created_at     │  └──────────────┘   └───────────────┘
             │               │    │ updated_at     │
             └───────────────┘    └────────────────┘

             ACTIVITY MANAGEMENT & COMMUNICATION

                    ┌──────────────────┐                    ┌────────────────┐
                    │   ACTIVITIES     │                    │ ANNOUNCEMENTS  │
                    ├──────────────────┤                    ├────────────────┤
                    │ id (PK)          │                    │ id (PK)        │
                    │ title            │                    │ title          │
                    │ description      │                    │ body           │
                    │ image_url        │                    │ created_at     │
                    │ location         │                    └────────────────┘
                    │ event_date       │
                    │ created_at       │         (Global notifications to all users)
                    └────────┬─────────┘
                             │
                      (FK: 1-to-N)
                             │
                    ┌────────▼────────┐
                    │ ACTIVITY_SUBS   │
                    ├─────────────────┤
                    │ id (PK)         │
                    │ student_id(FK)  │
                    │ activity_id(FK) │
                    │ subscribed_at   │
                    │                 │
                    │ UQ:(student_id, │
                    │  activity_id)   │
                    └─────────────────┘
```

---

## Table Relationship Matrix

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                         FOREIGN KEY RELATIONSHIPS                                    │
├──────────────────┬──────────────────┬────────────────┬─────────────┬─────────────────┤
│ Child Table      │ Column           │ Parent Table   │ Column      │ Delete Behavior │
├──────────────────┼──────────────────┼────────────────┼─────────────┼─────────────────┤
│ students         │ room_id          │ rooms          │ id          │ SET NULL        │
│ attendance_logs  │ student_id       │ students       │ id          │ CASCADE         │
│ complaints       │ student_id       │ students       │ id          │ CASCADE         │
│ maintenance_reqs │ student_id       │ students       │ id          │ CASCADE         │
│ permissions      │ student_id       │ students       │ id          │ CASCADE         │
│ clearance_proc   │ student_id       │ students       │ id          │ CASCADE         │
│ activity_subs    │ student_id       │ students       │ id          │ CASCADE         │
│ activity_subs    │ activity_id      │ activities     │ id          │ CASCADE         │
├──────────────────┴──────────────────┴────────────────┴─────────────┴─────────────────┤
│ EXPLANATION: CASCADE deletes child records when parent is deleted                   │
│             SET NULL allows orphaned records (e.g., room can exist without student)  │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Entity Cardinality Diagram

```
One ROOM           One STUDENT         One ACTIVITY
    │                  │                    │
    │ has many         │ has many          │ has many
    │                  │                    │
    └──→ STUDENTS      ├──→ ATTENDANCE      ├──→ SUBSCRIPTIONS
    (1:N)              │ (1:N)              │ (1:N)
                       │
                       ├──→ COMPLAINTS
                       │ (1:N)
                       │
                       ├──→ MAINTENANCE
                       │ (1:N)
                       │
                       ├──→ PERMISSIONS
                       │ (1:N)
                       │
                       ├──→ CLEARANCE
                       │ (1:1 or 1:N)
                       │
                       └──→ SUBSCRIPTIONS
                           (1:N)

One ADMIN           (Global, not tied to any table)
 (USER)             One ANNOUNCEMENT
```

---

## Data Flow - Student Perspective

```
Student Registration
    │
    ├─→ INSERT into students (national_id, password_hash, full_name, room_id)
    │
    └─→ Student ID generated (PK)
         │
         ├─→ Can insert attendance_logs (daily, one per date)
         │   └─→ Records PRESENT/ABSENT status
         │
         ├─→ Can insert complaints (unlimited)
         │   ├─→ Normal or Secret
         │   ├─→ General or Urgent
         │   └─→ Can get admin_reply when RESOLVED
         │
         ├─→ Can insert maintenance_requests (unlimited)
         │   ├─→ Category: Plumbing/Electric/Net/Furniture/Other
         │   ├─→ Status: Open/In Progress/Fixed
         │   └─→ Gets supervisor_reply
         │
         ├─→ Can request permissions (multiple)
         │   ├─→ Type: Late/Travel
         │   ├─→ Status: Pending/Approved/Rejected
         │   └─→ start_date & end_date
         │
         ├─→ Can subscribe to activities (many)
         │   └─→ Creates activity_subscriptions link
         │
         └─→ Gets clearance_process record (1:1 or 1:N)
             ├─→ room_check_passed: Boolean
             ├─→ keys_returned: Boolean
             └─→ status: Pending/Completed
```

---

## Test Data Distribution

```
Total Records After npm run setup:
┌─────────────────────────────────────────────────────────────┐
│ Table                      │ Count   │ Purpose              │
├────────────────────────────┼─────────┼──────────────────────┤
│ users                      │ 1       │ Admin login          │
│ rooms                      │ 1       │ Housing unit         │
│ students                   │ 1       │ Test student         │
│ attendance_logs            │ 2       │ Today & yesterday    │
│ complaints                 │ 3       │ Various statuses     │
│ maintenance_requests       │ 2       │ Different categories │
│ permissions                │ 2       │ Late & travel        │
│ activities                 │ 2       │ Sports & culture     │
│ activity_subscriptions     │ 1       │ Student → Football   │
│ clearance_process          │ 1       │ Pending clearance    │
│ announcements              │ 2       │ System notices       │
├────────────────────────────┼─────────┼──────────────────────┤
│ TOTAL                      │ 18      │ Ready for testing    │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Type Reference

```
┌─────────────────────────────────────────────────────────────────────┐
│                      COLUMN DATA TYPES                              │
├──────────────────┬──────────────────┬─────────────────────────────┤
│ Type             │ Size             │ Usage Examples              │
├──────────────────┼──────────────────┼─────────────────────────────┤
│ SERIAL           │ 4 bytes          │ id (auto-increment)         │
│ VARCHAR(n)       │ Up to n bytes    │ username, national_id       │
│ TEXT             │ Variable         │ description, body, reply    │
│ DATE             │ 4 bytes          │ Dates without time          │
│ TIMESTAMP        │ 8 bytes          │ Date & time with timezone   │
│ BOOLEAN          │ 1 byte           │ is_suspended, keys_returned │
│ INT              │ 4 bytes          │ floor, capacity, numeric IDs│
└──────────────────┴──────────────────┴─────────────────────────────┘
```

---

## Constraint Summary

```
┌────────────────────────────────────────────────────────────────┐
│                    CONSTRAINT TYPES                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ PRIMARY KEY (PK)                                              │
│ • All tables have: id SERIAL PRIMARY KEY                      │
│ • Guarantees uniqueness & non-null                            │
│ • Auto-increment for easy ID generation                       │
│                                                                │
│ FOREIGN KEY (FK)                                              │
│ • Links child records to parent table                         │
│ • Prevents orphaned/invalid references                        │
│ • CASCADE or SET NULL on delete                               │
│ • Example: students.room_id → rooms.id                        │
│                                                                │
│ UNIQUE                                                         │
│ • username (users)                                            │
│ • national_id (students)                                      │
│ • room_number (rooms)                                         │
│ • (student_id, date) composite (attendance)                   │
│ • (student_id, activity_id) composite (subscriptions)         │
│                                                                │
│ CHECK                                                          │
│ • Enforces specific allowed values                            │
│ • Examples:                                                    │
│   - role IN ('Manager', 'Supervisor')                        │
│   - status IN ('Pending', 'Resolved')                        │
│   - category IN ('Plumbing', 'Electric', 'Net', ...)         │
│                                                                │
│ NOT NULL                                                       │
│ • Applied to critical fields                                  │
│ • Prevents incomplete/invalid data                            │
│ • Examples: username, password_hash, title                    │
│                                                                │
│ DEFAULT                                                        │
│ • Auto-populate with default value                            │
│ • CURRENT_TIMESTAMP for automatic timestamps                  │
│ • FALSE for boolean flags (is_suspended)                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Index Strategy

```
Automatic Indexes (Created by PostgreSQL):
├─ PRIMARY KEY → Index on id (all tables)
├─ UNIQUE Constraints → Index on username, national_id, room_number
├─ FOREIGN KEYS → Index on all student_id, activity_id references
│
Optional Indexes (For Query Performance):
├─ attendance_logs.date → For date range queries
├─ complaints.status → For filtering by status
├─ permissions.start_date, end_date → For date range queries
└─ (student_id, status) composite → For filtered searches

Index Creation Example:
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_permissions_dates ON permissions(start_date, end_date);
```

---

## Query Pattern Examples

### Read Operations

```sql
-- Get student's current attendance
SELECT status FROM attendance_logs 
WHERE student_id = 1 AND date = CURRENT_DATE;

-- Get all pending complaints for student
SELECT * FROM complaints 
WHERE student_id = 1 AND status = 'Pending';

-- Get student's active activities
SELECT a.* FROM activities a
INNER JOIN activity_subscriptions s ON a.id = s.activity_id
WHERE s.student_id = 1;

-- Get student's room info
SELECT r.* FROM rooms r
INNER JOIN students s ON s.room_id = r.id
WHERE s.id = 1;

-- Get all maintenance in progress
SELECT * FROM maintenance_requests 
WHERE status = 'In Progress'
ORDER BY created_at DESC;
```

### Write Operations

```sql
-- Record attendance
INSERT INTO attendance_logs (student_id, date, status)
VALUES (1, CURRENT_DATE, 'Present');

-- File a complaint
INSERT INTO complaints (student_id, title, description, is_secret, type, status)
VALUES (1, 'Title', 'Description', false, 'General', 'Pending');

-- Create maintenance request
INSERT INTO maintenance_requests (student_id, category, description, status)
VALUES (1, 'Electric', 'Broken light', 'Open');

-- Request permission
INSERT INTO permissions (student_id, type, start_date, end_date, reason, status)
VALUES (1, 'Late', '2025-01-25', '2025-01-25', 'Study', 'Pending');

-- Subscribe to activity
INSERT INTO activity_subscriptions (student_id, activity_id)
VALUES (1, 1);
```

### Update Operations

```sql
-- Mark complaint as resolved
UPDATE complaints SET status = 'Resolved', admin_reply = 'Done'
WHERE id = 1;

-- Complete maintenance
UPDATE maintenance_requests 
SET status = 'Fixed', supervisor_reply = 'Completed'
WHERE id = 1;

-- Approve permission
UPDATE permissions SET status = 'Approved'
WHERE id = 1;

-- Complete clearance
UPDATE clearance_process 
SET status = 'Completed', room_check_passed = true, keys_returned = true
WHERE id = 1;
```

---

## JSON Response Mapping

```
Frontend expects these structures after queries:

STUDENT PROFILE:
{
  id: 1,
  national_id: "30412010101234",
  full_name: "محمد أحمد علي",
  faculty: "Engineering",
  phone: "+201234567890",
  room: { id: 1, room_number: "101", building: "Building A" },
  is_suspended: false
}

ATTENDANCE RECORD:
{
  id: 1,
  date: "2025-01-25",
  status: "Present"  // Shows as ✅ green checkmark
}

COMPLAINT:
{
  id: 1,
  title: "Noise Complaint",
  description: "...",
  is_secret: false,  // If true, show lock icon
  type: "General",
  status: "Pending",
  admin_reply: null  // If Resolved, show reply
}

MAINTENANCE:
{
  id: 1,
  category: "Electric",
  description: "Light fixture",
  status: "Open",     // Shows in pending section
  supervisor_reply: null
}

PERMISSION:
{
  id: 1,
  type: "Late",
  start_date: "2025-01-18",
  end_date: "2025-01-18",
  status: "Approved",  // Shows in approved/history
  reason: "Medical"
}

ACTIVITY:
{
  id: 1,
  title: "Football League",
  subscribed: true  // Computed from activity_subscriptions
}

CLEARANCE:
{
  status: "Pending",
  room_check_passed: false,
  keys_returned: false,
  percentage: 0  // (0 of 2 items done)
}
```

---

## Performance Optimization Tips

```
✅ GOOD PRACTICES:

1. Always use parameterized queries
   SELECT * FROM students WHERE national_id = $1

2. Filter early (WHERE clause before JOIN)
   WHERE student_id = 1 AND status = 'Pending'

3. Index frequently queried columns
   CREATE INDEX idx_complaints_status ON complaints(status);

4. Use connection pooling
   const pool = new Pool(...);

5. Limit result sets
   SELECT * FROM complaints LIMIT 10 OFFSET 20;

❌ AVOID:

1. SELECT * without WHERE
2. Joining too many tables
3. Looping queries in application code
4. Storing plain text passwords
5. Missing indexes on FK columns (auto-created though)
```

---

## Maintenance Tasks

```
DAILY:
  • Monitor slow queries
  • Check for failed connections
  • Verify backup completion

WEEKLY:
  • Review table statistics
  • Check unused indexes
  • Monitor disk space

MONTHLY:
  • VACUUM ANALYZE (optimize)
  • Review and archive old data
  • Backup rotation

QUARTERLY:
  • Performance tuning
  • Schema review
  • Security audit
```

---

## Scalability Path

```
DEVELOPMENT (Current)
├─ Single server PostgreSQL
├─ Single database
├─ 11 tables
└─ ~100-1000 students

PRODUCTION (Recommended)
├─ Primary-Replica replication
├─ Connection pooling (PgBouncer)
├─ Partitioned tables for large data
├─ Materialized views for reports
└─ Regular backups with WAL archiving

ENTERPRISE (Future)
├─ Multi-region replication
├─ Sharding by student ID
├─ Read replicas
├─ Caching layer (Redis)
└─ Data warehouse for analytics
```

---

## Summary

- **11 Interconnected Tables** with proper relationships
- **18 Test Records** covering all modules
- **Multiple Constraint Types** for data integrity
- **Flexible Schema** allowing extension
- **Production Ready** with audit trails
- **Developer Friendly** with clear documentation


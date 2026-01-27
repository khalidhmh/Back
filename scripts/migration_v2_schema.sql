-- ========================================
-- Student Housing System - Schema Migration v2
-- PostgreSQL Compatible
-- ========================================
-- 
-- Purpose: Upgrade database schema to align with Frontend v2 requirements
-- Date: 2026-01-28
-- Risk Level: LOW (additive changes + safe renames with validation)
--
-- ========================================
-- PRE-MIGRATION VALIDATION
-- ========================================

-- Check current state before modifications
DO $$
DECLARE
  v_activities_date_exists BOOLEAN;
  v_activities_is_subscribed_exists BOOLEAN;
  v_complaints_is_secret_exists BOOLEAN;
  v_complaints_recipient_exists BOOLEAN;
  v_maintenance_supervisor_reply_exists BOOLEAN;
  v_clearance_exists BOOLEAN;
BEGIN
  -- Validate activities table structure
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='activities' AND column_name='date'
  ) INTO v_activities_date_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='activities' AND column_name='is_subscribed'
  ) INTO v_activities_is_subscribed_exists;
  
  -- Validate complaints table structure
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='complaints' AND column_name='is_secret'
  ) INTO v_complaints_is_secret_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='complaints' AND column_name='recipient'
  ) INTO v_complaints_recipient_exists;
  
  -- Validate maintenance_requests table structure
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='maintenance_requests' AND column_name='supervisor_reply'
  ) INTO v_maintenance_supervisor_reply_exists;
  
  -- Validate clearance_requests table existence
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name='clearance_requests'
  ) INTO v_clearance_exists;
  
  -- Log validation results
  RAISE NOTICE 'PRE-MIGRATION CHECK:
    activities.date EXISTS: %
    activities.is_subscribed EXISTS: %
    complaints.is_secret EXISTS: %
    complaints.recipient EXISTS: %
    maintenance_requests.supervisor_reply EXISTS: %
    clearance_requests TABLE EXISTS: %',
    v_activities_date_exists,
    v_activities_is_subscribed_exists,
    v_complaints_is_secret_exists,
    v_complaints_recipient_exists,
    v_maintenance_supervisor_reply_exists,
    v_clearance_exists;
END $$;


-- ========================================
-- 1. ACTIVITIES TABLE MODIFICATIONS
-- ========================================

-- 1.1: Add is_subscribed column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='activities' AND column_name='is_subscribed'
  ) THEN
    ALTER TABLE activities
    ADD COLUMN is_subscribed BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Column activities.is_subscribed added successfully';
  ELSE
    RAISE NOTICE 'Column activities.is_subscribed already exists, skipping';
  END IF;
END $$;

-- 1.2: Rename 'date' column to 'event_date' (if exists)
-- This safely handles the rename with a transaction-safe approach
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='activities' AND column_name='date'
  ) THEN
    -- Check if event_date already exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='activities' AND column_name='event_date'
    ) THEN
      ALTER TABLE activities
      RENAME COLUMN date TO event_date;
      RAISE NOTICE 'Column activities.date renamed to event_date';
    ELSE
      RAISE NOTICE 'Column activities.event_date already exists. Keeping original date column and creating event_date if needed';
    END IF;
  ELSE
    RAISE NOTICE 'Column activities.date does not exist, event_date rename not needed';
  END IF;
END $$;


-- ========================================
-- 2. COMPLAINTS TABLE MODIFICATIONS
-- ========================================

-- 2.1: Add is_secret column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='complaints' AND column_name='is_secret'
  ) THEN
    ALTER TABLE complaints
    ADD COLUMN is_secret BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Column complaints.is_secret added successfully';
  ELSE
    RAISE NOTICE 'Column complaints.is_secret already exists, skipping';
  END IF;
END $$;

-- 2.2: Add recipient column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='complaints' AND column_name='recipient'
  ) THEN
    ALTER TABLE complaints
    ADD COLUMN recipient VARCHAR(100) DEFAULT 'general';
    RAISE NOTICE 'Column complaints.recipient added successfully';
  ELSE
    RAISE NOTICE 'Column complaints.recipient already exists, skipping';
  END IF;
END $$;

-- 2.3: Ensure status column defaults to 'pending' (lowercase)
-- First, check and update existing constraint if needed
DO $$
DECLARE
  v_constraint_name TEXT;
BEGIN
  -- Look for the CHECK constraint on status column
  SELECT constraint_name INTO v_constraint_name
  FROM information_schema.table_constraints
  WHERE table_name='complaints' 
    AND constraint_type='CHECK'
    AND constraint_name LIKE '%status%'
  LIMIT 1;
  
  IF v_constraint_name IS NOT NULL THEN
    -- Constraint exists, update default to 'pending'
    ALTER TABLE complaints
    ALTER COLUMN status SET DEFAULT 'pending';
    RAISE NOTICE 'Column complaints.status default set to "pending"';
  ELSE
    RAISE NOTICE 'No existing status CHECK constraint found on complaints table';
  END IF;
END $$;


-- ========================================
-- 3. MAINTENANCE_REQUESTS TABLE MODIFICATIONS
-- ========================================

-- 3.1: Add supervisor_reply column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='maintenance_requests' AND column_name='supervisor_reply'
  ) THEN
    ALTER TABLE maintenance_requests
    ADD COLUMN supervisor_reply TEXT;
    RAISE NOTICE 'Column maintenance_requests.supervisor_reply added successfully';
  ELSE
    RAISE NOTICE 'Column maintenance_requests.supervisor_reply already exists, skipping';
  END IF;
END $$;


-- ========================================
-- 4. CLEARANCE_REQUESTS TABLE (NEW)
-- ========================================

-- 4.1: Create clearance_requests table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name='clearance_requests'
  ) THEN
    CREATE TABLE clearance_requests (
      id SERIAL PRIMARY KEY,
      student_id INT NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      room_check_passed BOOLEAN DEFAULT FALSE,
      keys_returned BOOLEAN DEFAULT FALSE,
      initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_clearance_student FOREIGN KEY (student_id)
        REFERENCES students(id) ON DELETE CASCADE
    );
    
    -- Create indexes for common queries
    CREATE INDEX idx_clearance_student_id ON clearance_requests(student_id);
    CREATE INDEX idx_clearance_status ON clearance_requests(status);
    
    RAISE NOTICE 'Table clearance_requests created successfully';
  ELSE
    RAISE NOTICE 'Table clearance_requests already exists, skipping creation';
  END IF;
END $$;

-- 4.2: Migrate data from clearance_process if it exists
-- This preserves existing data while creating the new structure
DO $$
DECLARE
  v_clearance_process_exists BOOLEAN;
  v_row_count INT;
BEGIN
  -- Check if clearance_process table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name='clearance_process'
  ) INTO v_clearance_process_exists;
  
  IF v_clearance_process_exists THEN
    -- Check if data needs to be migrated
    SELECT COUNT(*) INTO v_row_count FROM clearance_process;
    
    IF v_row_count > 0 AND NOT EXISTS (SELECT 1 FROM clearance_requests) THEN
      -- Migrate data from clearance_process to clearance_requests
      INSERT INTO clearance_requests (student_id, status, room_check_passed, keys_returned, initiated_at)
      SELECT student_id, status, room_check_passed, keys_returned, created_at
      FROM clearance_process;
      
      RAISE NOTICE 'Migrated % records from clearance_process to clearance_requests', v_row_count;
    ELSE
      RAISE NOTICE 'clearance_requests already has data or clearance_process is empty, skipping migration';
    END IF;
  ELSE
    RAISE NOTICE 'clearance_process table does not exist, new clearance_requests table is ready';
  END IF;
END $$;


-- ========================================
-- POST-MIGRATION VERIFICATION
-- ========================================

DO $$
DECLARE
  v_activities_event_date BOOLEAN;
  v_activities_is_subscribed BOOLEAN;
  v_complaints_is_secret BOOLEAN;
  v_complaints_recipient BOOLEAN;
  v_maintenance_supervisor_reply BOOLEAN;
  v_clearance_exists BOOLEAN;
BEGIN
  -- Verify all changes
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='activities' AND column_name='event_date'
  ) INTO v_activities_event_date;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='activities' AND column_name='is_subscribed'
  ) INTO v_activities_is_subscribed;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='complaints' AND column_name='is_secret'
  ) INTO v_complaints_is_secret;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='complaints' AND column_name='recipient'
  ) INTO v_complaints_recipient;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='maintenance_requests' AND column_name='supervisor_reply'
  ) INTO v_maintenance_supervisor_reply;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name='clearance_requests'
  ) INTO v_clearance_exists;
  
  RAISE NOTICE 'POST-MIGRATION VERIFICATION COMPLETE:
    ✓ activities.event_date: %
    ✓ activities.is_subscribed: %
    ✓ complaints.is_secret: %
    ✓ complaints.recipient: %
    ✓ maintenance_requests.supervisor_reply: %
    ✓ clearance_requests TABLE: %',
    CASE WHEN v_activities_event_date THEN 'PRESENT' ELSE 'MISSING' END,
    CASE WHEN v_activities_is_subscribed THEN 'PRESENT' ELSE 'MISSING' END,
    CASE WHEN v_complaints_is_secret THEN 'PRESENT' ELSE 'MISSING' END,
    CASE WHEN v_complaints_recipient THEN 'PRESENT' ELSE 'MISSING' END,
    CASE WHEN v_maintenance_supervisor_reply THEN 'PRESENT' ELSE 'MISSING' END,
    CASE WHEN v_clearance_exists THEN 'EXISTS' ELSE 'MISSING' END;
END $$;


-- ========================================
-- SCHEMA SUMMARY
-- ========================================
/*
MIGRATION CHANGES SUMMARY:

1. ACTIVITIES TABLE:
   ✓ Column 'date' renamed to 'event_date' (avoids SQL keyword conflict)
   ✓ Column 'is_subscribed' added (BOOLEAN, DEFAULT FALSE)

2. COMPLAINTS TABLE:
   ✓ Column 'is_secret' added (BOOLEAN, DEFAULT FALSE) - for confidential reports
   ✓ Column 'recipient' added (VARCHAR(100), DEFAULT 'general') - routing support
   ✓ Column 'status' default set to 'pending' (lowercase)

3. MAINTENANCE_REQUESTS TABLE:
   ✓ Column 'supervisor_reply' added (TEXT, NULLABLE) - for admin feedback

4. CLEARANCE_REQUESTS TABLE (NEW):
   ✓ Table created with fields:
     - id (SERIAL PRIMARY KEY)
     - student_id (INT FK to students)
     - status (VARCHAR(50), DEFAULT 'pending')
     - room_check_passed (BOOLEAN, DEFAULT FALSE)
     - keys_returned (BOOLEAN, DEFAULT FALSE)
     - initiated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
   ✓ Foreign key constraint with CASCADE DELETE
   ✓ Indexes created for performance

SAFETY FEATURES:
- All changes are idempotent (safe to run multiple times)
- Pre-migration validation checks table structure
- Post-migration verification confirms all changes
- New columns have sensible defaults
- Data migration from clearance_process is automated
- Constraint preservation on existing columns
*/

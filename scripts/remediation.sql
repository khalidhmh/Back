-- ========================================
-- Schema Remediation Script
-- Purpose: Add support for 'rooms' table and normalize student-room relationship
-- Target: PostgreSQL
-- ========================================

-- 1. Create 'rooms' table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL,
    building VARCHAR(100) NOT NULL,
    capacity INT DEFAULT 1,
    type VARCHAR(50) DEFAULT 'Standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add 'room_id' column to 'students' table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS room_id INT;

-- 3. Add Foreign Key Constraint
-- This links students to the new rooms table
ALTER TABLE students 
ADD CONSTRAINT fk_student_room 
FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;

-- 4. Validation (Optional)
-- You can verify the column exists:
-- SELECT column_name FROM information_schema.columns WHERE table_name='students' AND column_name='room_id';

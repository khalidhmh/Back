/**
 * ========================================
 * CRON JOBS
 * ========================================
 * 
 * Purpose: Handle scheduled background tasks
 * 
 * 1. Daily Attendance Check (11:00 PM)
 *    - Find all active students
 *    - Check for attendance record today
 *    - Mark absent if no record exists
 */

const cron = require('node-cron');
const db = require('./db');

const initCronJobs = () => {
    console.log('⏰ Initializing Cron Jobs...');

    // ========================================
    // 1. DAILY ATTENDANCE (11:00 PM)
    // ========================================
    // Schedule: "0 23 * * *" = 23:00 (11 PM) every day
    cron.schedule('0 23 * * *', async () => {
        console.log('🔄 Running Daily Attendance Check...');

        try {
            // 1. Get all active students (not suspended)
            const { rows: students } = await db.query(
                `SELECT id FROM students WHERE is_suspended = false`
            );

            const today = new Date().toISOString().split('T')[0];
            let markedCount = 0;

            // 2. Process each student
            // Note: Could be optimized with a single "INSERT INTO ... SELECT ... WHERE NOT EXISTS" query
            // but loop is safer for logic verification initially.
            // Optimization for production:
            /*
            INSERT INTO attendance_logs (student_id, date, status)
            SELECT s.id, CURRENT_DATE, 'absent'
            FROM students s
            WHERE s.is_suspended = false 
            AND NOT EXISTS (
                SELECT 1 FROM attendance_logs a 
                WHERE a.student_id = s.id AND a.date = CURRENT_DATE
            );
            */

            // Using the optimized query approach for better performance and atomicity
            const result = await db.query(`
                INSERT INTO attendance_logs (student_id, date, status)
                SELECT s.id, CURRENT_DATE, 'absent'
                FROM students s
                WHERE s.is_suspended = false 
                AND NOT EXISTS (
                    SELECT 1 FROM attendance_logs a 
                    WHERE a.student_id = s.id AND a.date = CURRENT_DATE
                )
            `);

            markedCount = result.rowCount;
            console.log(`✅ Daily Attendance Complete. Marked ${markedCount} students as absent.`);

        } catch (err) {
            console.error('❌ Error in Daily Attendance Cron:', err);
        }
    });

    console.log('✅ Cron Jobs Scheduled');
};

module.exports = initCronJobs;

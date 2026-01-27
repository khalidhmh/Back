const db = require('../db'); // تأكد إن ده المسار الصح لملف الاتصال
const bcrypt = require('bcrypt');

async function fixData() {
    try {
        console.log("🔧 جاري إصلاح البيانات وإضافة المستخدمين...");

        // 1. تشفير الباسورد الموحد (123456)
        const hashedPassword = await bcrypt.hash('123456', 10);

        // =============================================
        // أولاً: إصلاح حساب الطالب
        // =============================================
        const studentId = '30412010101234';
        await db.query(
            'UPDATE students SET password_hash = $1 WHERE national_id = $2',
            [hashedPassword, studentId]
        );
        console.log("✅ تم تحديث باسورد الطالب (30412010101234) إلى: 123456");

        // =============================================
        // ثانياً: إضافة المدير (Manager)
        // =============================================
        // نمسح القديم عشان منكرروش
        await db.query("DELETE FROM users WHERE username = 'admin'");
        
        await db.query(
            `INSERT INTO users (username, password_hash, full_name, role) 
             VALUES ($1, $2, $3, $4)`,
            ['admin', hashedPassword, 'المدير العام', 'Manager']
        );
        console.log("✅ تم إضافة المدير (admin) بباسورد: 123456");

        // =============================================
        // ثالثاً: إضافة مشرف (Supervisor)
        // =============================================
        await db.query("DELETE FROM users WHERE username = 'supervisor1'");

        await db.query(
            `INSERT INTO users (username, password_hash, full_name, role) 
             VALUES ($1, $2, $3, $4)`,
            ['supervisor1', hashedPassword, 'مشرف المبنى أ', 'Supervisor']
        );
        console.log("✅ تم إضافة المشرف (supervisor1) بباسورد: 123456");

        console.log("\n🎉 تم الإصلاح بنجاح! جرب تسجل دخول دلوقتي.");
        process.exit(0);

    } catch (err) {
        console.error("❌ حدث خطأ:", err);
        process.exit(1);
    }
}

fixData();
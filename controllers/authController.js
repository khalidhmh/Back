/**
 * ========================================
 * UNIVERSAL AUTH CONTROLLER
 * ========================================
 * Handles Login for:
 * 1. Students (via National ID)
 * 2. Managers (via Username)
 * 3. Supervisors (via Username)
 */

const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.login = async (req, res) => {
    try {
        // استقبال البيانات بأي مسمى يبعته الفرونت (سواء موبايل أو ويب)
        // id: ممكن يكون رقم قومي أو يوزرنيم
        const { id, national_id, username, password } = req.body;

        // توحيد مدخل البحث (الرقم القومي أو اسم المستخدم)
        const loginId = id || national_id || username;

        if (!loginId || !password) {
            return res.status(400).json({
                success: false,
                message: "يرجى إدخال اسم المستخدم/الرقم القومي وكلمة المرور"
            });
        }

        let user = null;
        let role = '';
        let tableName = '';

        // =========================================================
        // 1. البحث في جدول الطلاب أولاً (الأكثر استخداماً)
        // =========================================================
        // الطلاب بيدخلوا بالرقم القومي (أرقام فقط)
        // لو المدخل كله أرقام، يبقى احتمال كبير طالب
        const isNumeric = /^\d+$/.test(loginId);

        if (isNumeric) {
            const studentResult = await db.query('SELECT * FROM students WHERE national_id = $1', [loginId]);
            if (studentResult.rows.length > 0) {
                user = studentResult.rows[0];
                role = 'student';
                tableName = 'Students';
            }
        }

        // =========================================================
        // 2. لو مش طالب، ابحث في جدول المستخدمين (المشرفين والمديرين)
        // =========================================================
        if (!user) {
            const adminResult = await db.query('SELECT * FROM users WHERE username = $1', [loginId]);
            if (adminResult.rows.length > 0) {
                user = adminResult.rows[0];
                // الدور بيجي من الداتا بيز (Manager أو Supervisor)
                role = user.role;
                tableName = 'Users';
            }
        }

        // =========================================================
        // 3. لو لسه مفيش مستخدم -> يبقى البيانات غلط
        // =========================================================
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "بيانات الدخول غير صحيحة"
            });
        }

        // =========================================================
        // 4. التحقق من الباسورد
        // =========================================================
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "كلمة المرور غير صحيحة"
            });
        }

        // =========================================================
        // 5. إنشاء التوكن والرد
        // =========================================================
        const token = jwt.sign(
            {
                id: user.id,
                role: role, // دي اللي هتحدد الصلاحيات بعدين
                table: tableName
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '30d' }
        );

        // تجهيز بيانات المستخدم للرد
        const userData = {
            id: user.id,
            name: user.full_name,
            role: role, // student, Manager, Supervisor
            photo_url: user.photo_url || null // لو موجودة
        };

        // لو طالب، نضيف الرقم القومي عشان بيحتاجه
        if (role === 'student') {
            userData.national_id = user.national_id;
        } else {
            // لو مشرف، نضيف اليوزرنيم
            userData.username = user.username;
        }

        res.status(200).json({
            success: true,
            message: `تم تسجيل الدخول بنجاح (${role})`,
            data: {
                token: token,
                user: userData
            }
        });

    } catch (err) {
        console.error('❌ Login Error:', err);
        res.status(500).json({
            success: false,
            message: "حدث خطأ في السيرفر"
        });
    }
};
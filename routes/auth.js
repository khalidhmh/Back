/**
 * ========================================
 * UNIVERSAL AUTH ROUTER & CONTROLLER (UPDATED FOR NEW DB)
 * ========================================
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// دالة تسجيل الدخول (Logic)
const login = async (req, res) => {
    try {
        const { id, national_id, username, password } = req.body;

        // توحيد مدخل البحث (يقبل ID أو الرقم القومي أو اسم المستخدم)
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
        // 1. البحث في جدول الطلاب (JOIN لجلب الباسورد من جدول users)
        // =========================================================
        const isNumeric = /^\d+$/.test(loginId);

        if (isNumeric) {
            // ✅ الـ JOIN هنا يربط الطالب بحساب المستخدم الخاص به لجلب الباسورد والصلاحيات
            const query = `
            SELECT s.*, u.id as user_auth_id, u.password_hash, u.role as user_role, u.email
            FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE s.national_id = $1
            `;

            const studentResult = await db.query(query, [loginId]);

            if (studentResult.rows.length > 0) {
                user = studentResult.rows[0];
                role = 'student';
                tableName = 'Students';
            }
        }

        // =========================================================
        // 2. البحث في جدول المستخدمين (للمشرفين - Admins)
        // =========================================================
        if (!user) {
            // المشرفون موجودون فقط في جدول users
            const adminResult = await db.query('SELECT * FROM users WHERE username = $1', [loginId]);
            if (adminResult.rows.length > 0) {
                user = adminResult.rows[0];
                role = user.role;
                tableName = 'Users';
                user.user_auth_id = user.id; // توحيد المسمى
            }
        }

        // =========================================================
        // 3. التحقق النهائي من وجود المستخدم
        // =========================================================
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "بيانات الدخول غير صحيحة"
            });
        }

        // التأكد من وجود الهاش (للحماية من الحسابات التالفة)
        if (!user.password_hash) {
            console.error("❌ Error: Password hash missing for user ID:", user.user_auth_id);
            return res.status(500).json({ success: false, message: "خطأ في بيانات الحساب" });
        }

        // مقارنة الباسورد المدخل مع الهاش المحفوظ
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "كلمة المرور غير صحيحة"
            });
        }

        // =========================================================
        // 4. إنشاء التوكن (JWT)
        // =========================================================
        // نستخدم user_auth_id (الذي هو users.id) في التوكن لضمان الترابط
        const token = jwt.sign(
            {
                id: user.user_auth_id, // هذا هو الـ ID الأساسي في جدول Users
                student_id: role === 'student' ? user.id : null, // إضافة ID الطالب لو موجود
                role: role,
                table: tableName
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '30d' }
        );

        // =========================================================
        // 5. تجهيز بيانات الرد (للاستخدام في التطبيق)
        // =========================================================
        const userData = {
            id: user.id, // هذا ID الطالب لو طالب، أو ID اليوزر لو أدمن
            user_id: user.user_auth_id, // هذا دائماً ID جدول Users
            name: user.full_name || user.username, // الاسم الكامل للطالب، أو اسم المستخدم للأدمن
            role: role,
            photo_url: user.photo_url || null,
            email: user.email || user.university_email,
        };

        // إضافة بيانات الطالب التفصيلية إذا كان طالباً (مهم لصفحة البروفايل)
        if (role === 'student') {
            userData.national_id = user.national_id;
            userData.faculty = user.faculty;
            userData.address = user.address; // ✅ الحقل الجديد
            userData.building_number = user.building_number;
            userData.room_number = user.room_number;
            userData.phone = user.phone_number;
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
        res.status(500).json({ success: false, message: "حدث خطأ في السيرفر" });
    }
};

// تعريف المسار
router.post('/login', login);

module.exports = router;
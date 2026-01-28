/**
 * ========================================
 * UNIVERSAL AUTH CONTROLLER (FIXED)
 * ========================================
 */

const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.login = async (req, res) => {
    try {
        const { id, national_id, username, password } = req.body;

        // توحيد مدخل البحث
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
        // 1. البحث في جدول الطلاب (مع JOIN لجلب الباسورد)
        // =========================================================
        const isNumeric = /^\d+$/.test(loginId);

        if (isNumeric) {
            // ✅ التعديل الجوهري هنا: JOIN لجلب password_hash من users
            const query = `
            SELECT s.*, u.password_hash, u.role as user_role, u.email
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
        // 2. البحث في جدول المستخدمين (للمشرفين)
        // =========================================================
        if (!user) {
            // هنا الجدول users فيه الباسورد جاهز
            const adminResult = await db.query('SELECT * FROM users WHERE username = $1', [loginId]);
            if (adminResult.rows.length > 0) {
                user = adminResult.rows[0];
                role = user.role;
                tableName = 'Users';
            }
        }

        // =========================================================
        // 3. التحقق النهائي
        // =========================================================
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "بيانات الدخول غير صحيحة"
            });
        }

        // تأكدنا إن الباسورد موجود
        if (!user.password_hash) {
            console.error("❌ Error: Password hash missing for user:", user.id);
            return res.status(500).json({ success: false, message: "خطأ في بيانات الحساب" });
        }

        // مقارنة الباسورد
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "كلمة المرور غير صحيحة"
            });
        }

        // =========================================================
        // 4. إنشاء التوكن
        // =========================================================
        const token = jwt.sign(
            {
                id: user.id,
                role: role,
                table: tableName
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '30d' }
        );

        const userData = {
            id: user.id,
            name: user.full_name,
            role: role,
            photo_url: user.photo_url || null
        };

        if (role === 'student') {
            userData.national_id = user.national_id;
        } else {
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
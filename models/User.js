import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    city: { type: String, default: '' },
    address: { type: String, default: '' },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer', index: true },
    // صلاحيات المدير: ['*'] = كل شيء، أو قائمة من lib/permissions.js
    permissions: { type: [String], default: undefined },

    // التحقق بخطوتين (TOTP): السر مشفّر، ورموز الطوارئ مخزنة كبصمات
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: null },
    twoFactorPending: { type: String, default: null },
    twoFactorBackup: { type: [String], default: undefined },
    disabled: { type: Boolean, default: false },
    // حساب ببيانات افتراضية: يُطلب تغيير البريد وكلمة المرور بعد الدخول
    mustChangePassword: { type: Boolean, default: false },

    // يزيد عند تغيير كلمة المرور أو التعطيل، فتبطل كل الجلسات القديمة
    tokenVersion: { type: Number, default: 0 },

    // قفل الحساب بعد محاولات دخول فاشلة متتالية
    failedLogins: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },

    // استرجاع كلمة المرور: نخزن بصمة الرمز فقط وليس الرمز نفسه
    resetTokenHash: { type: String, default: null, index: true },
    resetTokenExpires: { type: Date, default: null },

    lastLoginAt: Date,
    lastLoginIp: String,
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);

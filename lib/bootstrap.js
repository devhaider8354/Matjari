import User from '@/models/User';
import { dbConnect } from './db';
import { hashPassword, normalizeEmail } from './password';

// بيانات المدير الافتراضية (تُستخدم فقط إذا لم يوجد أي مدير بعد)
export const DEFAULT_ADMIN_EMAIL = normalizeEmail(process.env.DEFAULT_ADMIN_EMAIL || '');
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || '';

let checked = false;

// ينشئ أول مدير تلقائياً عند أول تشغيل، ويُجبره على تغيير البريد وكلمة المرور
export async function ensureDefaultAdmin() {
  if (checked) return;
  await dbConnect();
  if (!(await User.exists({ role: 'admin' }))) {
    // Public source has no shared credentials; configure both values or use create-admin.
    if (!DEFAULT_ADMIN_EMAIL || !DEFAULT_ADMIN_PASSWORD) {
      checked = true;
      return;
    }
    const existing = await User.findOne({ email: DEFAULT_ADMIN_EMAIL });
    if (!existing) {
      await User.create({
        name: 'مدير المتجر',
        email: DEFAULT_ADMIN_EMAIL,
        passwordHash: await hashPassword(DEFAULT_ADMIN_PASSWORD),
        role: 'admin',
        permissions: ['*'],
        mustChangePassword: process.env.DEMO_MODE !== 'true',
      });
      console.warn(`[bootstrap] أُنشئ المدير الافتراضي ${DEFAULT_ADMIN_EMAIL}، غيّر بياناته فور الدخول.`);
    }
  }
  checked = true;
}

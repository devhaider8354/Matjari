// Server-only policy for the shared demonstration account.
export function isDemoAccount(user) {
  return process.env.DEMO_MODE === 'true' && user?.role === 'admin' &&
    Boolean(process.env.DEFAULT_ADMIN_EMAIL?.trim()) &&
    user.email?.toLowerCase() === process.env.DEFAULT_ADMIN_EMAIL.trim().toLowerCase();
}

export const DEMO_LOCK_MESSAGE = 'حساب العرض ثابت؛ لا يمكن تغيير بيانات الدخول أو إعدادات الأمان.';

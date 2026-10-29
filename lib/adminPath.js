// مسار لوحة الإدارة السري (من ADMIN_PATH). الصفحات مبنية داخلياً تحت /admin،
// والـ middleware يحوّل المسار السري إليها ويُرجع 404 لمن يطلب /admin مباشرة.
// يُستخدم في الخادم فقط: لا تمرره لملفات المتصفح إلا كـ prop داخل صفحات الإدارة.
const clean = String(process.env.ADMIN_PATH || 'admin').replace(/^\/+|\/+$/g, '').replace(/[^A-Za-z0-9_-]/g, '');

export const ADMIN_BASE = `/${clean || 'admin'}`;
export const ADMIN_HIDDEN = ADMIN_BASE !== '/admin';

export const adminUrl = (p = '') => `${ADMIN_BASE}${p === '/' ? '' : p}`;

// قائمة IP المسموح لها بالوصول للإدارة (اختياري)
export const ADMIN_ALLOWED_IPS = String(process.env.ADMIN_ALLOWED_IPS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const adminIpAllowed = (ip) => !ADMIN_ALLOWED_IPS.length || ADMIN_ALLOWED_IPS.includes(ip);

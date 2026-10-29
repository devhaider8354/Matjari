import AuditLog from '@/models/AuditLog';

// وصف عربي لكل عملية إدارية حسب المسار والطريقة
const RULES = [
  [/^POST \/api\/admin\/products$/, 'product.create', 'إضافة منتج'],
  [/^PUT \/api\/admin\/products\/[^/]+$/, 'product.update', 'تعديل منتج'],
  [/^DELETE \/api\/admin\/products\/[^/]+$/, 'product.delete', 'حذف منتج'],
  [/^POST \/api\/admin\/categories$/, 'category.create', 'إضافة قسم'],
  [/^PUT \/api\/admin\/categories\/[^/]+$/, 'category.update', 'تعديل قسم'],
  [/^DELETE \/api\/admin\/categories\/[^/]+$/, 'category.delete', 'حذف قسم'],
  [/^PATCH \/api\/admin\/orders\/[^/]+$/, 'order.update', 'تحديث طلب'],
  [/^POST \/api\/admin\/users$/, 'team.add', 'إضافة مدير'],
  [/^PATCH \/api\/admin\/users\/[^/]+$/, 'user.update', 'تعديل حساب'],
  [/^PUT \/api\/admin\/settings$/, 'settings.update', 'تعديل الإعدادات'],
  [/^(POST|PUT|DELETE) \/api\/admin\/currencies/, 'currency.change', 'تعديل العملات'],
  [/^(POST|PUT|DELETE) \/api\/admin\/posts/, 'blog.change', 'تعديل المدونة'],
  [/^POST \/api\/admin\/upload/, 'media.upload', 'رفع صورة'],
  [/^POST \/api\/admin\/media/, 'media.upload', 'رفع فيديو أو صوت'],
  [/^POST \/api\/admin\/notify-test/, 'settings.test', 'تجربة إشعار تيليجرام'],
];

export function describe(method, path) {
  const key = `${method} ${path}`;
  for (const [re, action, label] of RULES) if (re.test(key)) return { action, label };
  return { action: key, label: key };
}

export async function audit({ actor, action, label, target = '', details = '', ip = '', ok = true }) {
  try {
    await AuditLog.create({
      actor: actor?._id,
      actorName: actor?.name || '',
      actorEmail: actor?.email || '',
      action,
      label,
      target: String(target).slice(0, 200),
      details: String(details).slice(0, 500),
      ip,
      ok,
    });
  } catch (e) {
    console.error('audit failed:', e.message);
  }
}

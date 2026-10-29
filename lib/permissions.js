// صلاحيات فريق الإدارة (آمن للمتصفح والخادم).
// '*' = صاحب المتجر (كل الصلاحيات). المدراء القدامى بدون حقل صلاحيات يُعاملون كأصحاب.
export const PERMISSIONS = {
  orders: { label: 'الطلبات', hint: 'عرض الطلبات وتغيير حالاتها والوصولات' },
  customers: { label: 'الزبائن', hint: 'عرض الزبائن وتعطيل حساباتهم' },
  catalog: { label: 'المنتجات والأقسام', hint: 'إضافة وتعديل المنتجات والأقسام والصور' },
  content: { label: 'الواجهة والمحتوى', hint: 'السلايدر والمظهر والوصل والمدونة والموسيقى' },
  settings: { label: 'الإعدادات', hint: 'معلومات المتجر وSEO والعملات والتسويق والإشعارات' },
  team: { label: 'الفريق والسجل', hint: 'إضافة المدراء وصلاحياتهم وسجل النشاط' },
};

export const ROLE_PRESETS = {
  owner: { label: 'صاحب المتجر (كل الصلاحيات)', permissions: ['*'] },
  orders: { label: 'موظف طلبات', permissions: ['orders', 'customers'] },
  catalog: { label: 'محرر منتجات', permissions: ['catalog', 'content'] },
  custom: { label: 'مخصص', permissions: [] },
};

// perm: صلاحية أو مصفوفة صلاحيات (تكفي واحدة منها)، أو null = أي مدير
export function hasPerm(user, perm) {
  if (!user || user.role !== 'admin') return false;
  const list = user.permissions;
  if (list == null || list.includes('*') || perm == null) return true; // null = مدير قديم بكل الصلاحيات
  const needed = Array.isArray(perm) ? perm : [perm];
  return needed.some((p) => list.includes(p));
}

export const isOwner = (user) => user?.role === 'admin' && (user.permissions == null || user.permissions.includes('*'));

export function cleanPermissions(list) {
  if (!Array.isArray(list)) return [];
  if (list.includes('*')) return ['*'];
  return [...new Set(list.filter((p) => PERMISSIONS[p]))];
}

import { isDemoAccount, DEMO_LOCK_MESSAGE } from '@/lib/demo';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { cleanPermissions, hasPerm, isOwner } from '@/lib/permissions';
import { adminRoute } from '@/lib/session';
import User from '@/models/User';

const bad = (error, status = 400) => NextResponse.json({ error }, { status });
const ownerFilter = { role: 'admin', disabled: false, $or: [{ permissions: { $exists: false } }, { permissions: '*' }] };

// تعطيل/تفعيل حساب، إنهاء جلساته، أو تعديل صلاحيات مدير
export const PATCH = adminRoute(async (req, { params }, admin) => {
  if (!mongoose.isValidObjectId(params.id)) return bad('غير موجود', 404);
  if (String(admin._id) === params.id) return bad('لا يمكنك تعديل حسابك من هنا');
  const { disabled, logoutAll, permissions } = (await req.json().catch(() => null)) || {};

  await dbConnect();
  const user = await User.findById(params.id);
  if (!user) return bad('غير موجود', 404);
  if (process.env.DEMO_MODE === 'true' && user.role === 'admin') return bad('إدارة الفريق معطلة في نسخة العرض', 403);
  if (isDemoAccount(user)) return bad(DEMO_LOCK_MESSAGE, 403);

  // إدارة الزبائن تحتاج صلاحية الزبائن، وإدارة المدراء تحتاج صلاحية الفريق
  if (!hasPerm(admin, user.role === 'admin' ? 'team' : 'customers')) return bad('ليست لديك صلاحية لهذه العملية', 403);
  // فقط صاحب المتجر يعدّل حساب صاحب متجر آخر
  if (user.role === 'admin' && isOwner(user) && !isOwner(admin)) return bad('لا يمكنك تعديل حساب صاحب المتجر', 403);

  const lastOwner = user.role === 'admin' && isOwner(user) && (await User.countDocuments(ownerFilter)) <= 1;

  if (typeof disabled === 'boolean') {
    if (disabled && lastOwner) return bad('لا يمكن تعطيل آخر حساب بكل الصلاحيات');
    user.disabled = disabled;
  }
  if (permissions !== undefined && user.role === 'admin') {
    const list = cleanPermissions(permissions);
    if (!list.length) return bad('اختر صلاحية واحدة على الأقل');
    if (lastOwner && !list.includes('*')) return bad('يجب أن يبقى حساب واحد على الأقل بكل الصلاحيات');
    if (list.includes('*') && !isOwner(admin)) return bad('فقط صاحب المتجر يمنح كل الصلاحيات', 403);
    user.permissions = list;
  }
  // أي تغيير في الصلاحيات أو التعطيل ينهي جلسات الحساب حتى تُطبَّق فوراً
  if (disabled === true || logoutAll || permissions !== undefined) user.tokenVersion += 1;
  await user.save();
  return NextResponse.json({ ok: true });
});

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { cache } from 'react';
import User from '@/models/User';
import { adminUrl } from './adminPath';
import { audit, describe } from './audit';
import { SESSION_COOKIE, SESSION_TTL, signSession, verifySession } from './auth';
import { invalidateAll } from './cache';
import { dbConnect } from './db';
import { hasPerm } from './permissions';

// يتحقق من التوقيع ثم من قاعدة البيانات: الحساب موجود وغير معطّل ونسخة الجلسة صالحة
export const getCurrentUser = cache(async () => {
  const payload = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  await dbConnect();
  const user = await User.findById(payload.sub).lean();
  if (!user || user.disabled || user.tokenVersion !== payload.tv || user.role !== payload.role) return null;
  return user;
});

export async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'admin' ? user : null;
}

// لصفحات اللوحة: المدير بدون الصلاحية يُعاد للوحة المعلومات
export async function requirePermission(perm) {
  const admin = await requireAdmin();
  if (!admin || !hasPerm(admin, perm)) redirect(`${adminUrl()}?denied=1`);
  return admin;
}

// يغلّف مسارات /api/admin: تحقق ثانٍ بعد الـ middleware يشمل قاعدة البيانات،
// ثم الصلاحية، ثم يسجّل العملية في سجل النشاط ويمسح الذاكرة المؤقتة للمتجر.
// perm: صلاحية مطلوبة، أو null عندما يتحقق المسار منها بنفسه
export function adminRoute(handler, perm = null) {
  return async (req, ctx) => {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    // بيانات الدخول الافتراضية: لا يُسمح بأي تعديل قبل تغيير كلمة المرور
    if (admin.mustChangePassword) {
      return NextResponse.json({ error: 'غيّر كلمة المرور الافتراضية أولاً من «حسابي والأمان»' }, { status: 403 });
    }
    if (!hasPerm(admin, perm)) {
      return NextResponse.json({ error: 'ليست لديك صلاحية لهذه العملية' }, { status: 403 });
    }
    const res = await handler(req, ctx, admin);
    if (req.method !== 'GET' && res.status < 400) {
      const { action, label } = describe(req.method, req.nextUrl.pathname);
      await audit({ actor: admin, action, label, target: ctx?.params?.id || '', ip: clientIp(req) });
      invalidateAll();
    }
    return res;
  };
}

export async function setSessionCookie(res, user, req) {
  res.cookies.set(SESSION_COOKIE, await signSession(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps(req),
    path: '/',
    maxAge: SESSION_TTL[user.role] || SESSION_TTL.customer,
  });
}

export function clearSessionCookie(res) {
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}

export const isHttps = (req) =>
  req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:';

export const clientIp = (req) =>
  req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

// بيانات المستخدم الآمنة للإرسال إلى المتصفح
export const publicUser = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  phone: u.phone || '',
  city: u.city || '',
  address: u.address || '',
  role: u.role,
  permissions: u.role === 'admin' ? u.permissions ?? ['*'] : undefined,
});

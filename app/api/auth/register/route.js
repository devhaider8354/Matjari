import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { EMAIL_RE, hashPassword, normalizeEmail, passwordError } from '@/lib/password';
import { rateLimit } from '@/lib/rateLimit';
import { clientIp, publicUser, setSessionCookie } from '@/lib/session';
import User from '@/models/User';

const bad = (error, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req) {
  const ip = clientIp(req);
  if (!(await rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)).ok) return bad('محاولات تسجيل كثيرة، حاول لاحقاً', 429);

  const b = (await req.json().catch(() => null)) || {};
  const name = String(b.name || '').trim().slice(0, 100);
  const email = normalizeEmail(b.email);
  const phone = String(b.phone || '').replace(/[\s-]/g, '').slice(0, 20);

  if (!name) return bad('الاسم مطلوب');
  if (!EMAIL_RE.test(email)) return bad('البريد الإلكتروني غير صالح');
  if (phone && !/^\+?\d{7,15}$/.test(phone)) return bad('رقم الهاتف غير صالح');
  const pwErr = passwordError(b.password);
  if (pwErr) return bad(pwErr);

  await dbConnect();
  if (await User.exists({ email })) return bad('هذا البريد مسجّل مسبقاً، سجّل الدخول أو استعد كلمة المرور', 409);

  const user = await User.create({
    name,
    email,
    phone,
    passwordHash: await hashPassword(b.password),
    role: 'customer',
    lastLoginAt: new Date(),
    lastLoginIp: ip,
  });

  const res = NextResponse.json({ user: publicUser(user) }, { status: 201 });
  await setSessionCookie(res, user, req);
  return res;
}

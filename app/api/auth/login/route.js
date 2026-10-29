import { NextResponse } from 'next/server';
import { adminIpAllowed } from '@/lib/adminPath';
import { audit } from '@/lib/audit';
import { authConfigured, signTwoFactorTicket } from '@/lib/auth';
import { ensureDefaultAdmin } from '@/lib/bootstrap';
import { completeLogin } from '@/lib/login';
import { dbConnect } from '@/lib/db';
import { DUMMY_HASH, normalizeEmail, verifyPassword } from '@/lib/password';
import { rateLimit } from '@/lib/rateLimit';
import { clientIp, publicUser, setSessionCookie } from '@/lib/session';
import User from '@/models/User';

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const INVALID = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';

export async function POST(req) {
  if (!authConfigured()) {
    return NextResponse.json({ error: 'إعدادات الخادم ناقصة: JWT_SECRET (32 حرفاً على الأقل)' }, { status: 500 });
  }
  const ip = clientIp(req);
  const limit = await rateLimit(`login:${ip}`, 20, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: `محاولات كثيرة، حاول بعد ${Math.ceil(limit.retryAfter / 60)} دقيقة` }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) || {};
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const adminOnly = body.admin === true;
  if (!email || !password) return NextResponse.json({ error: 'أدخل البريد الإلكتروني وكلمة المرور' }, { status: 400 });

  await dbConnect();
  if (adminOnly) await ensureDefaultAdmin();
  const user = await User.findOne({ email });

  if (user?.lockUntil && user.lockUntil > new Date()) {
    const mins = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return NextResponse.json({ error: `الحساب مقفل مؤقتاً بسبب محاولات خاطئة، حاول بعد ${mins} دقيقة` }, { status: 423 });
  }

  // محاولات دخول الإدارة الفاشلة تُسجَّل (بدون كلمة المرور)
  const fail = async (status, reason) => {
    if (adminOnly) await audit({ actor: user?.role === 'admin' ? user : null, action: 'auth.fail', label: `محاولة دخول فاشلة: ${reason}`, target: email, ip, ok: false });
    return NextResponse.json({ error: status === 403 ? 'هذا الحساب معطّل' : INVALID }, { status });
  };

  // نقارن دائماً حتى لو لم يوجد الحساب، كي لا يكشف زمن الاستجابة وجود البريد
  const ok = await verifyPassword(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !ok) {
    if (user) {
      user.failedLogins += 1;
      if (user.failedLogins >= MAX_FAILS) {
        user.failedLogins = 0;
        user.lockUntil = new Date(Date.now() + LOCK_MS);
      }
      await user.save();
    }
    return fail(401, user ? 'كلمة مرور خاطئة' : 'بريد غير مسجّل');
  }
  if (user.disabled) return fail(403, 'حساب معطّل');
  // كل نوع حساب يدخل من صفحته فقط: الزبون من المتجر، والمدير من المسار السري،
  // فلا تكشف صفحة الدخول العامة وجود حسابات الإدارة
  if (adminOnly !== (user.role === 'admin')) return fail(401, 'نوع الحساب لا يطابق صفحة الدخول');
  if (user.role === 'admin' && !adminIpAllowed(ip)) return fail(401, 'عنوان IP غير مسموح');

  user.failedLogins = 0;
  user.lockUntil = null;

  // التحقق بخطوتين: كلمة المرور صحيحة، والآن نطلب الرمز قبل إنشاء الجلسة
  if (user.twoFactorEnabled) {
    await user.save();
    return NextResponse.json({ twoFactorRequired: true, ticket: await signTwoFactorTicket(user) });
  }
  return completeLogin(user, req, ip);
}

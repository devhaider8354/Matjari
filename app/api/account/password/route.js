import { isDemoAccount, DEMO_LOCK_MESSAGE } from '@/lib/demo';
import { NextResponse } from 'next/server';
import { hashPassword, passwordError, verifyPassword } from '@/lib/password';
import { rateLimit } from '@/lib/rateLimit';
import { getCurrentUser, setSessionCookie } from '@/lib/session';
import User from '@/models/User';

// تغيير كلمة المرور لأي مستخدم مسجّل (زبون أو مدير)
export async function POST(req) {
  const current = await getCurrentUser();
  if (isDemoAccount(current)) return NextResponse.json({ error: DEMO_LOCK_MESSAGE }, { status: 403 });
  if (!current) return NextResponse.json({ error: 'سجّل الدخول أولاً' }, { status: 401 });
  if (!(await rateLimit(`chpw:${current._id}`, 5, 15 * 60 * 1000)).ok) {
    return NextResponse.json({ error: 'محاولات كثيرة، حاول لاحقاً' }, { status: 429 });
  }

  const { currentPassword, newPassword } = (await req.json().catch(() => null)) || {};
  const user = await User.findById(current._id);
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
  }
  const pwErr = passwordError(newPassword);
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });
  if (await verifyPassword(newPassword, user.passwordHash)) {
    return NextResponse.json({ error: 'اختر كلمة مرور مختلفة عن الحالية' }, { status: 400 });
  }

  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  user.tokenVersion += 1; // يُخرج الجلسات الأخرى، ونجدد جلسة هذا الجهاز
  await user.save();

  const res = NextResponse.json({ ok: true });
  await setSessionCookie(res, user, req);
  return res;
}

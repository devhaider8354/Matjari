import { isDemoAccount, DEMO_LOCK_MESSAGE } from '@/lib/demo';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { hashPassword, hashToken, passwordError } from '@/lib/password';
import { rateLimit } from '@/lib/rateLimit';
import { clientIp } from '@/lib/session';
import User from '@/models/User';

export async function POST(req) {
  if (!(await rateLimit(`reset:${clientIp(req)}`, 10, 15 * 60 * 1000)).ok) {
    return NextResponse.json({ error: 'محاولات كثيرة، حاول لاحقاً' }, { status: 429 });
  }
  const { token, password } = (await req.json().catch(() => null)) || {};
  if (!token || typeof token !== 'string') return NextResponse.json({ error: 'رابط غير صالح' }, { status: 400 });
  const pwErr = passwordError(password);
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });

  await dbConnect();
  const user = await User.findOne({ resetTokenHash: hashToken(token), resetTokenExpires: { $gt: new Date() } });
  if (!user) return NextResponse.json({ error: 'الرابط غير صالح أو انتهت صلاحيته، اطلب رابطاً جديداً' }, { status: 400 });

  if (isDemoAccount(user)) return NextResponse.json({ error: DEMO_LOCK_MESSAGE }, { status: 403 });
  user.passwordHash = await hashPassword(password);
  user.resetTokenHash = null; // الرابط يُستخدم مرة واحدة
  user.resetTokenExpires = null;
  user.failedLogins = 0;
  user.lockUntil = null;
  user.tokenVersion += 1; // تسجيل خروج من كل الأجهزة
  await user.save();

  return NextResponse.json({ ok: true, role: user.role });
}

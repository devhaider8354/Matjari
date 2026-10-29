import { isDemoAccount, DEMO_LOCK_MESSAGE } from '@/lib/demo';
import { NextResponse } from 'next/server';
import { adminUrl } from '@/lib/adminPath';
import { dbConnect } from '@/lib/db';
import { appUrl, resetPasswordEmail, sendMail } from '@/lib/mail';
import { newResetToken, normalizeEmail } from '@/lib/password';
import { rateLimit } from '@/lib/rateLimit';
import { clientIp } from '@/lib/session';
import User from '@/models/User';

const RESET_TTL_MS = 30 * 60 * 1000;
// الرد نفسه دائماً حتى لا يُعرف هل البريد مسجّل أم لا
const DONE = { ok: true, message: 'إذا كان البريد مسجّلاً لدينا فستصلك رسالة فيها رابط الاستعادة خلال دقائق.' };

export async function POST(req) {
  const ip = clientIp(req);
  const body = (await req.json().catch(() => null)) || {};
  const email = normalizeEmail(body.email);
  if (!email) return NextResponse.json({ error: 'أدخل البريد الإلكتروني' }, { status: 400 });

  if (!(await rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000)).ok || !(await rateLimit(`forgot:${email}`, 3, 60 * 60 * 1000)).ok) {
    return NextResponse.json({ error: 'طلبات كثيرة، حاول بعد ساعة' }, { status: 429 });
  }

  await dbConnect();
  const user = await User.findOne({ email, disabled: false });
  if (user && !isDemoAccount(user)) {
    const { token, hash } = newResetToken();
    user.resetTokenHash = hash;
    user.resetTokenExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save();

    const path = user.role === 'admin' ? adminUrl('/reset-password') : '/reset-password';
    const mail = resetPasswordEmail(user.name, `${appUrl()}${path}?token=${token}`);
    try {
      await sendMail({ to: user.email, ...mail });
    } catch (e) {
      console.error('reset mail failed:', e.message);
    }
  }
  return NextResponse.json(DONE);
}

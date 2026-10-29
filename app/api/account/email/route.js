import { isDemoAccount, DEMO_LOCK_MESSAGE } from '@/lib/demo';
import { NextResponse } from 'next/server';
import { EMAIL_RE, normalizeEmail, verifyPassword } from '@/lib/password';
import { rateLimit } from '@/lib/rateLimit';
import { getCurrentUser } from '@/lib/session';
import User from '@/models/User';

// تغيير البريد والاسم لأي مستخدم مسجّل، ويتطلب كلمة المرور الحالية
export async function POST(req) {
  const current = await getCurrentUser();
  if (isDemoAccount(current)) return NextResponse.json({ error: DEMO_LOCK_MESSAGE }, { status: 403 });
  if (!current) return NextResponse.json({ error: 'سجّل الدخول أولاً' }, { status: 401 });
  if (!(await rateLimit(`chemail:${current._id}`, 5, 15 * 60 * 1000)).ok) {
    return NextResponse.json({ error: 'محاولات كثيرة، حاول لاحقاً' }, { status: 429 });
  }

  const { email, name, currentPassword } = (await req.json().catch(() => null)) || {};
  const newEmail = normalizeEmail(email);
  const newName = String(name || '').trim().slice(0, 100);
  if (!newName) return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
  if (!EMAIL_RE.test(newEmail)) return NextResponse.json({ error: 'البريد الإلكتروني غير صالح' }, { status: 400 });

  const user = await User.findById(current._id);
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
  }
  if (newEmail !== user.email && (await User.exists({ email: newEmail }))) {
    return NextResponse.json({ error: 'هذا البريد مستخدم في حساب آخر' }, { status: 409 });
  }

  user.email = newEmail;
  user.name = newName;
  await user.save();
  return NextResponse.json({ ok: true });
}

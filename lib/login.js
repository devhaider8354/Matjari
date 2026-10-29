import { NextResponse } from 'next/server';
import { audit } from './audit';
import { publicUser, setSessionCookie } from './session';

// الخطوة الأخيرة من الدخول (بعد كلمة المرور، وبعد رمز التحقق إن وُجد)
export async function completeLogin(user, req, ip, via = 'password') {
  user.failedLogins = 0;
  user.lockUntil = null;
  user.lastLoginAt = new Date();
  user.lastLoginIp = ip;
  await user.save();
  if (user.role === 'admin') {
    await audit({ actor: user, action: 'auth.login', label: via === '2fa' ? 'تسجيل دخول (مع التحقق بخطوتين)' : 'تسجيل دخول', ip });
  }
  const res = NextResponse.json({ user: publicUser(user), mustChangePassword: user.mustChangePassword });
  await setSessionCookie(res, user, req);
  return res;
}

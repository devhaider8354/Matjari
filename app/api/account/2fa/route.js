import { isDemoAccount, DEMO_LOCK_MESSAGE } from '@/lib/demo';
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { audit } from '@/lib/audit';
import { verifyPassword } from '@/lib/password';
import { rateLimit } from '@/lib/rateLimit';
import { clientIp, getCurrentUser } from '@/lib/session';
import { getSettings } from '@/lib/settings';
import { decryptSecret, encryptSecret, generateSecret, hashBackup, newBackupCodes, otpauthUrl, verifyTotp } from '@/lib/totp';
import User from '@/models/User';

const bad = (error, status = 400) => NextResponse.json({ error }, { status });

// إعداد التحقق بخطوتين: setup ← enable (برمز من التطبيق) ← disable (بكلمة المرور + رمز)
export async function POST(req) {
  const current = await getCurrentUser();
  if (isDemoAccount(current)) return NextResponse.json({ error: DEMO_LOCK_MESSAGE }, { status: 403 });
  if (!current) return bad('سجّل الدخول أولاً', 401);
  if (!(await rateLimit(`2fa-setup:${current._id}`, 10, 15 * 60 * 1000)).ok) return bad('محاولات كثيرة، حاول لاحقاً', 429);
  const { action, code, password } = (await req.json().catch(() => null)) || {};
  const user = await User.findById(current._id);
  const ip = clientIp(req);

  if (action === 'setup') {
    if (user.twoFactorEnabled) return bad('التحقق بخطوتين مفعّل مسبقاً');
    const secret = generateSecret();
    user.twoFactorPending = encryptSecret(secret);
    await user.save();
    const { store } = await getSettings();
    const url = otpauthUrl(secret, user.email, store.nameEn || store.nameAr || 'Store');
    const qrSvg = await QRCode.toString(url, { type: 'svg', margin: 1, width: 200 });
    return NextResponse.json({ secret, qrSvg });
  }

  if (action === 'enable') {
    if (!user.twoFactorPending) return bad('ابدأ الإعداد أولاً');
    const secret = decryptSecret(user.twoFactorPending);
    if (!verifyTotp(secret, code)) return bad('الرمز غير صحيح، تأكد من وقت الجوال وحاول مجدداً');
    const { codes, hashes } = newBackupCodes();
    user.twoFactorSecret = user.twoFactorPending;
    user.twoFactorPending = null;
    user.twoFactorEnabled = true;
    user.twoFactorBackup = hashes;
    await user.save();
    await audit({ actor: user, action: 'security.2fa_on', label: 'تفعيل التحقق بخطوتين', ip });
    return NextResponse.json({ ok: true, backupCodes: codes });
  }

  if (action === 'disable') {
    if (!user.twoFactorEnabled) return bad('التحقق بخطوتين غير مفعّل');
    if (!(await verifyPassword(password, user.passwordHash))) return bad('كلمة المرور غير صحيحة');
    let ok = false;
    try {
      ok = verifyTotp(decryptSecret(user.twoFactorSecret), code);
    } catch {}
    if (!ok && !user.twoFactorBackup?.includes(hashBackup(code))) return bad('رمز التحقق غير صحيح');
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorBackup = undefined;
    await user.save();
    await audit({ actor: user, action: 'security.2fa_off', label: 'إيقاف التحقق بخطوتين', ip, ok: false });
    return NextResponse.json({ ok: true });
  }

  return bad('عملية غير معروفة');
}

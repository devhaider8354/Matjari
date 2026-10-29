import { NextResponse } from 'next/server';
import { audit } from '@/lib/audit';
import { verifyTwoFactorTicket } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { completeLogin } from '@/lib/login';
import { rateLimit } from '@/lib/rateLimit';
import { clientIp } from '@/lib/session';
import { decryptSecret, hashBackup, verifyTotp } from '@/lib/totp';
import User from '@/models/User';

// الخطوة الثانية من الدخول: رمز تطبيق المصادقة أو رمز طوارئ
export async function POST(req) {
  const ip = clientIp(req);
  const { ticket, code } = (await req.json().catch(() => null)) || {};
  const t = await verifyTwoFactorTicket(ticket);
  if (!t) return NextResponse.json({ error: 'انتهت صلاحية الجلسة، سجّل الدخول من جديد' }, { status: 401 });
  if (!(await rateLimit(`2fa:${t.sub}`, 5, 15 * 60 * 1000)).ok) {
    return NextResponse.json({ error: 'محاولات كثيرة، حاول بعد 15 دقيقة' }, { status: 429 });
  }

  await dbConnect();
  const user = await User.findById(t.sub);
  if (!user || user.disabled || !user.twoFactorEnabled || user.tokenVersion !== t.tv) {
    return NextResponse.json({ error: 'انتهت صلاحية الجلسة، سجّل الدخول من جديد' }, { status: 401 });
  }

  const input = String(code || '').trim();
  let ok = false;
  try {
    ok = verifyTotp(decryptSecret(user.twoFactorSecret), input);
  } catch {}
  let usedBackup = false;
  if (!ok && input.length >= 10) {
    // رمز طوارئ: يُستخدم مرة واحدة ثم يُحذف
    const h = hashBackup(input);
    if (user.twoFactorBackup?.includes(h)) {
      user.twoFactorBackup = user.twoFactorBackup.filter((x) => x !== h);
      ok = usedBackup = true;
    }
  }
  if (!ok) {
    await audit({ actor: user, action: 'auth.fail', label: 'رمز تحقق بخطوتين خاطئ', target: user.email, ip, ok: false });
    return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 401 });
  }
  if (usedBackup) await audit({ actor: user, action: 'security.backup_code', label: `استُخدم رمز طوارئ (متبقي ${user.twoFactorBackup.length})`, ip });
  return completeLogin(user, req, ip, '2fa');
}

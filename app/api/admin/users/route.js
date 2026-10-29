import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { EMAIL_RE, hashPassword, normalizeEmail, passwordError } from '@/lib/password';
import { cleanPermissions } from '@/lib/permissions';
import { adminRoute } from '@/lib/session';
import User from '@/models/User';

// إضافة مدير جديد لفريق العمل بصلاحيات محددة
export const POST = adminRoute(async (req) => {
  if (process.env.DEMO_MODE === 'true') return NextResponse.json({ error: 'إدارة الفريق معطلة في نسخة العرض' }, { status: 403 });
  const b = (await req.json().catch(() => null)) || {};
  const name = String(b.name || '').trim().slice(0, 100);
  const email = normalizeEmail(b.email);
  const permissions = cleanPermissions(b.permissions);
  if (!name) return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'البريد الإلكتروني غير صالح' }, { status: 400 });
  if (!permissions.length) return NextResponse.json({ error: 'اختر صلاحية واحدة على الأقل' }, { status: 400 });
  const pwErr = passwordError(b.password);
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });

  await dbConnect();
  if (await User.exists({ email })) {
    return NextResponse.json({ error: 'هذا البريد مسجّل مسبقاً' }, { status: 409 });
  }
  // المدير الجديد يغيّر كلمة المرور المؤقتة عند أول دخول
  const user = await User.create({ name, email, passwordHash: await hashPassword(b.password), role: 'admin', permissions, mustChangePassword: true });
  return NextResponse.json({ id: String(user._id) }, { status: 201 });
}, 'team');

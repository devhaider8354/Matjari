import { NextResponse } from 'next/server';
import { sendTelegram } from '@/lib/notify';
import { adminRoute } from '@/lib/session';

// رسالة تجربة إلى تيليجرام للتأكد من صحة الإعدادات
export const POST = adminRoute(async (req) => {
  const { chatId } = (await req.json().catch(() => null)) || {};
  const id = String(chatId || '').replace(/[^\d-]/g, '');
  if (!process.env.TELEGRAM_BOT_TOKEN) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN غير معرّف في .env.local' }, { status: 400 });
  if (!id) return NextResponse.json({ error: 'أدخل Chat ID' }, { status: 400 });
  try {
    await sendTelegram('✅ تم ربط إشعارات المتجر بنجاح. ستصلك هنا الطلبات الجديدة.', id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: `فشل الإرسال: ${e.message}` }, { status: 400 });
  }
}, 'settings');

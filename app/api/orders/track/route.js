import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { ORDER_STATUS_LABELS, normLang } from '@/lib/i18n';
import { invoicePath, itemVariant } from '@/lib/orderView';
import { rateLimit } from '@/lib/rateLimit';
import { clientIp } from '@/lib/session';
import Order from '@/models/Order';

// تتبع الطلب يحتاج رقم الطلب + رقم الهاتف معاً
export async function POST(req) {
  if (!(await rateLimit(`track:${clientIp(req)}`, 20, 15 * 60 * 1000)).ok) {
    return NextResponse.json({ error: 'Too many attempts / محاولات كثيرة' }, { status: 429 });
  }
  const { number, phone, lang } = (await req.json().catch(() => null)) || {};
  const l = normLang(lang);
  const orderNumber = String(number || '').trim().toUpperCase();
  const cleanPhone = String(phone || '').replace(/[\s-]/g, '');
  if (!orderNumber || !cleanPhone) {
    return NextResponse.json({ error: l === 'en' ? 'Enter order number and phone' : 'أدخل رقم الطلب ورقم الهاتف' }, { status: 400 });
  }

  await dbConnect();
  const order = await Order.findOne({ orderNumber, 'customer.phone': cleanPhone }).lean();
  if (!order) return NextResponse.json({ error: l === 'en' ? 'Order not found' : 'لم يتم العثور على الطلب' }, { status: 404 });

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    statusLabel: ORDER_STATUS_LABELS[l][order.status],
    createdAt: order.createdAt,
    items: order.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, variant: itemVariant(i) })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    currency: order.currency || null,
    invoice: invoicePath(order.orderNumber),
  });
}

import crypto from 'crypto';
import { formatMoney } from './money';

// المبالغ مخزنة بالعملة الأساسية؛ تُعرض بعملة الطلب وسعر صرفه وقت الطلب
export const orderMoney = (order) => (n) => formatMoney(n, order.currency || undefined);

// وصف المتغير للطلبات الجديدة والقديمة (مقاس/لون)
export const itemVariant = (i) => i.variant || [i.size, i.color].filter(Boolean).join(' · ');

// رابط وصل عام موقّع: لا يمكن تخمين وصل طلب آخر بدون المفتاح السري
export function invoiceToken(orderNumber) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET || '').update(`invoice:${orderNumber}`).digest('hex').slice(0, 32);
}

export function verifyInvoiceToken(orderNumber, token) {
  const expected = Buffer.from(invoiceToken(orderNumber));
  const given = Buffer.from(String(token || ''));
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

export const invoicePath = (orderNumber) => `/invoice/${orderNumber}?t=${invoiceToken(orderNumber)}`;

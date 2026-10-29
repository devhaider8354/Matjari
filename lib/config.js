import { formatMoney } from './money';

// قيم NEXT_PUBLIC_* تُدمج في الكود وقت البناء، فهي متاحة للخادم والمتصفح معاً
export const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'متجري';
export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || '$';
export const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP || '').replace(/\D/g, '');

const SHIPPING_FEE = Number(process.env.NEXT_PUBLIC_SHIPPING_FEE || 0);
export const FREE_SHIPPING_OVER = Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_OVER || 0);

export function shippingFor(subtotal) {
  if (subtotal <= 0) return 0;
  if (FREE_SHIPPING_OVER > 0 && subtotal >= FREE_SHIPPING_OVER) return 0;
  return SHIPPING_FEE;
}

// مبلغ بالعملة الأساسية (لوحة التحكم). المتجر يستخدم useMoney للعملة المختارة
export function money(n, cur) {
  return formatMoney(n, cur);
}

export const ORDER_STATUSES = {
  pending: 'قيد المراجعة',
  confirmed: 'مؤكد',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

// صورة مصغّرة للبطاقات: الصور المرفوعة لها نسخة -sm.webp بعرض 600px
export const thumb = (url) =>
  url && /^\/api\/uploads\/[a-f0-9-]{36}\.webp$/.test(url) ? url.replace('.webp', '-sm.webp') : url;

export function formatDate(d) {
  return new Date(d).toLocaleString('ar-EG-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' });
}

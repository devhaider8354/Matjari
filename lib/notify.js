import User from '@/models/User';
import { adminUrl } from './adminPath';
import { ORDER_STATUS_LABELS } from './i18n';
import { appUrl, sendMail } from './mail';
import { formatMoney } from './money';
import { invoicePath } from './orderView';
import { getSettings } from './settings';

// إشعارات الطلبات: صاحب المتجر (تيليجرام + بريد) والزبون (بريد عند تغيّر الحالة).
// لا ترمي أخطاء أبداً: فشل الإشعار لا يجب أن يُفشل الطلب.

export async function sendTelegram(text, chatId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return false;
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  if (!r.ok) throw new Error(`Telegram ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return true;
}

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export async function notifyNewOrder(order) {
  try {
    const { notifications: n, store } = await getSettings();
    const money = (v) => formatMoney(v, order.currency || undefined);
    const lines = order.items.map((i) => `• ${esc(i.name)}${i.variant ? ` (${esc(i.variant)})` : ''} × ${i.qty}`).join('\n');
    const link = `${appUrl()}${adminUrl(`/orders/${order._id}`)}`;
    const text =
      `🛒 <b>طلب جديد ${esc(order.orderNumber)}</b>\n` +
      `👤 ${esc(order.customer.name)} — ${esc(order.customer.phone)}\n📍 ${esc(order.customer.city)}، ${esc(order.customer.address)}\n` +
      `${lines}\n💰 <b>${esc(money(order.total))}</b> (الدفع عند الاستلام)\n${link}`;
    await sendTelegram(text, n.telegramChatId).catch((e) => console.error('telegram:', e.message));
    if (n.notifyEmail) {
      await sendMail({ to: n.notifyEmail, subject: `طلب جديد ${order.orderNumber} — ${store.nameAr}`, text: text.replace(/<[^>]+>/g, '') });
    }
  } catch (e) {
    console.error('notify new order failed:', e.message);
  }
}

const STATUS_MSG = {
  ar: {
    confirmed: 'تم تأكيد طلبك وسيتم تجهيزه للشحن.',
    shipped: 'طلبك في الطريق إليك! جهّز مبلغ الدفع عند الاستلام.',
    delivered: 'تم تسليم طلبك. شكراً لتسوقك معنا ❤',
    cancelled: 'تم إلغاء طلبك. إن كان هذا خطأً تواصل معنا.',
  },
  en: {
    confirmed: 'Your order is confirmed and being prepared for shipping.',
    shipped: 'Your order is on its way! Please have the cash ready on delivery.',
    delivered: 'Your order has been delivered. Thank you for shopping with us ❤',
    cancelled: 'Your order was cancelled. If this is a mistake, please contact us.',
  },
};

// بريد للزبون عند تغيّر حالة طلبه (إن كان لديه بريد)
export async function notifyStatusChange(order, status) {
  try {
    const { notifications: n, store } = await getSettings();
    if (n.customerEmails === false) return;
    const lang = order.lang === 'en' ? 'en' : 'ar';
    let email = order.customer.email;
    if (!email && order.user) email = (await User.findById(order.user).select('email').lean())?.email;
    if (!email || !STATUS_MSG[lang][status]) return;
    const name = lang === 'en' ? store.nameEn || store.nameAr : store.nameAr;
    const label = ORDER_STATUS_LABELS[lang][status];
    const invoice = `${appUrl()}${invoicePath(order.orderNumber)}`;
    const text = `${STATUS_MSG[lang][status]}\n\n${lang === 'en' ? 'Order' : 'رقم الطلب'}: ${order.orderNumber}\n${lang === 'en' ? 'Status' : 'الحالة'}: ${label}\n${lang === 'en' ? 'Invoice' : 'الفاتورة'}: ${invoice}`;
    const html = `<div dir="${lang === 'en' ? 'ltr' : 'rtl'}" style="font-family:Tahoma,Arial,sans-serif;line-height:1.8">
      <h2>${esc(name)}</h2><p>${esc(STATUS_MSG[lang][status])}</p>
      <p><b>${lang === 'en' ? 'Order' : 'رقم الطلب'}:</b> ${esc(order.orderNumber)}<br><b>${lang === 'en' ? 'Status' : 'الحالة'}:</b> ${esc(label)}</p>
      <p><a href="${invoice}" style="background:#111827;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">${lang === 'en' ? 'View invoice' : 'عرض الفاتورة'}</a></p></div>`;
    await sendMail({ to: email, subject: `${label} — ${order.orderNumber}`, text, html });
  } catch (e) {
    console.error('notify status failed:', e.message);
  }
}

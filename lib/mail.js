import nodemailer from 'nodemailer';
import { STORE_NAME } from './config';

let transporter;
function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export const appUrl = () => (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

// بدون إعدادات SMTP (وضع التطوير) تُطبع الرسالة في سجل الخادم بدل إرسالها
export async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    console.log(`\n[mail:dev] إلى: ${to}\nالموضوع: ${subject}\n${text}\n`);
    return;
  }
  await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text, html });
}

export function resetPasswordEmail(name, link) {
  const subject = `استعادة كلمة المرور — ${STORE_NAME}`;
  const text = `مرحباً ${name}،\n\nلإعادة تعيين كلمة المرور افتح الرابط التالي (صالح لمدة 30 دقيقة):\n${link}\n\nإذا لم تطلب ذلك تجاهل هذه الرسالة، وكلمة مرورك الحالية تبقى كما هي.`;
  const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.8">
    <h2>${STORE_NAME}</h2>
    <p>مرحباً ${escapeHtml(name)}،</p>
    <p>لإعادة تعيين كلمة المرور اضغط الزر التالي (صالح لمدة 30 دقيقة):</p>
    <p><a href="${link}" style="background:#111827;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none">إعادة تعيين كلمة المرور</a></p>
    <p style="color:#666;font-size:13px">إذا لم تطلب ذلك تجاهل هذه الرسالة.</p></div>`;
  return { subject, text, html };
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

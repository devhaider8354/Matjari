'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sendJson } from './upload';

export default function MarketingEditor({ initial, feedUrl, telegramReady, smtpReady }) {
  const router = useRouter();
  const [mk, setMk] = useState(initial.marketing);
  const [nt, setNt] = useState({ telegramChatId: '', notifyEmail: '', customerEmails: true, ...initial.notifications });
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await sendJson('/api/admin/settings', 'PUT', { marketing: mk, notifications: nt });
      setStatus({ type: 'success', text: 'تم الحفظ' });
      router.refresh();
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    }
    setBusy(false);
  }

  async function testTelegram() {
    setStatus(null);
    try {
      await sendJson('/api/admin/notify-test', 'POST', { chatId: nt.telegramChatId });
      setStatus({ type: 'success', text: 'وصلت رسالة التجربة إلى تيليجرام ✓' });
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    }
  }

  return (
    <>
      <div className="dash-grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>📊 بكسلات الإعلانات</h3>
          <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
            تقيس نتائج إعلاناتك الممولة. تُسجَّل تلقائياً أحداث: مشاهدة منتج، إضافة للسلة، وإتمام الطلب.
          </p>
          <div className="field">
            <label>Facebook / Instagram Pixel ID</label>
            <input dir="ltr" value={mk.fbPixelId} onChange={(e) => setMk({ ...mk, fbPixelId: e.target.value })} placeholder="123456789012345" />
            <small>من Meta Events Manager ← مصادر البيانات</small>
          </div>
          <div className="field">
            <label>TikTok Pixel ID</label>
            <input dir="ltr" value={mk.tiktokPixelId} onChange={(e) => setMk({ ...mk, tiktokPixelId: e.target.value })} placeholder="C1A2B3C4D5E6F7G8H9" />
            <small>من TikTok Ads Manager ← Assets ← Events</small>
          </div>
          <p className="muted" style={{ fontSize: 13 }}>Google Analytics يُضبط من «المتجر والتواصل وSEO».</p>

          <h3>🛍️ Google Merchant (Google Shopping)</h3>
          <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
            انسخ هذا الرابط في Google Merchant Center ← المنتجات ← الخلاصات ← «جدول زمني لجلب البيانات». يتحدّث تلقائياً بكل منتجاتك وأسعارها وتوفرها.
          </p>
          <div className="input-group">
            <input dir="ltr" readOnly value={feedUrl} onFocus={(e) => e.target.select()} />
            <button type="button" className="btn btn-outline btn-sm" onClick={() => navigator.clipboard?.writeText(feedUrl)}>نسخ</button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>🔔 إشعارات الطلبات</h3>
          <div className="field">
            <label>تيليجرام: Chat ID لصاحب المتجر أو المجموعة</label>
            <div className="input-group">
              <input dir="ltr" value={nt.telegramChatId} onChange={(e) => setNt({ ...nt, telegramChatId: e.target.value })} placeholder="123456789" />
              <button type="button" className="btn btn-outline btn-sm" onClick={testTelegram} disabled={!telegramReady || !nt.telegramChatId}>تجربة</button>
            </div>
            <small>
              {telegramReady
                ? 'أرسل /start للبوت، ثم احصل على Chat ID من البوت @userinfobot.'
                : '⚠️ ضع TELEGRAM_BOT_TOKEN في ملف .env.local على السيرفر (من @BotFather) ثم أعد التشغيل.'}
            </small>
          </div>
          <div className="field">
            <label>بريد لإشعارات الطلبات الجديدة</label>
            <input dir="ltr" type="email" value={nt.notifyEmail} onChange={(e) => setNt({ ...nt, notifyEmail: e.target.value })} placeholder="orders@example.com" />
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={nt.customerEmails !== false} onChange={(e) => setNt({ ...nt, customerEmails: e.target.checked })} />
            إرسال بريد للزبون عند تأكيد طلبه وشحنه وتسليمه
          </label>
          {!smtpReady && <div className="alert alert-error" style={{ marginTop: 10 }}>إرسال البريد يحتاج إعدادات SMTP في ملف .env.local.</div>}
        </div>
      </div>
      {status && <div className={`alert alert-${status.type}`} style={{ marginTop: 14 }}>{status.text}</div>}
      <div className="form-actions"><button className="btn" onClick={save} disabled={busy}>{busy ? '...' : 'حفظ'}</button></div>
    </>
  );
}

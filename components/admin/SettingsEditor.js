'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SOCIAL_PLATFORMS } from '@/lib/siteDefaults';
import { ACCEPT_IMAGES, sendJson, uploadImage } from './upload';

export default function SettingsEditor({ initial }) {
  const router = useRouter();
  const [tab, setTab] = useState('store');
  const [store, setStore] = useState(initial.store);
  const [social, setSocial] = useState(initial.social);
  const [seo, setSeo] = useState({ ...initial.seo, keywords: (initial.seo.keywords || []).join('، ') });
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      await sendJson('/api/admin/settings', 'PUT', {
        store,
        social,
        seo: { ...seo, keywords: seo.keywords.split(/[,،]/) },
      });
      setStatus({ type: 'success', text: 'تم حفظ الإعدادات' });
      router.refresh();
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    }
    setBusy(false);
  }

  async function upload(file, apply) {
    if (!file) return;
    try {
      const { url } = await uploadImage(file, 'category');
      apply(url);
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    }
  }

  const S = (k) => ({ value: store[k] || '', onChange: (e) => setStore({ ...store, [k]: e.target.value }) });
  const E = (k) => ({ value: seo[k] || '', onChange: (e) => setSeo({ ...seo, [k]: e.target.value }) });

  return (
    <>
      <div className="tabs">
        {[['store', '🏪 معلومات المتجر'], ['social', '📣 التواصل الاجتماعي'], ['seo', '🔍 SEO و Google']].map(([k, l]) => (
          <button key={k} type="button" className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      <div className="card">
        {tab === 'store' && (
          <>
            <div className="grid-2">
              <div className="field"><label>اسم المتجر (عربي)</label><input {...S('nameAr')} maxLength={80} /></div>
              <div className="field"><label>اسم المتجر (إنجليزي)</label><input dir="ltr" {...S('nameEn')} maxLength={80} /></div>
              <div className="field"><label>الشعار النصي (عربي)</label><input {...S('taglineAr')} maxLength={160} /></div>
              <div className="field"><label>الشعار النصي (إنجليزي)</label><input dir="ltr" {...S('taglineEn')} maxLength={160} /></div>
              <div className="field"><label>الهاتف</label><input dir="ltr" {...S('phone')} /></div>
              <div className="field"><label>واتساب (بالصيغة الدولية)</label><input dir="ltr" {...S('whatsapp')} placeholder="9647700000000" /></div>
              <div className="field"><label>البريد الإلكتروني</label><input dir="ltr" type="email" {...S('email')} /></div>
              <div className="field"><label>العنوان (عربي)</label><input {...S('addressAr')} /></div>
            </div>
            <div className="field">
              <label>الشعار (يظهر في الهيدر والفواتير)</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {store.logo && <img src={store.logo} alt="" style={{ height: 56, borderRadius: 8, border: '1px solid var(--border)' }} />}
                <input type="file" accept={ACCEPT_IMAGES} onChange={(e) => upload(e.target.files?.[0], (url) => setStore({ ...store, logo: url }))} />
                {store.logo && <button type="button" className="btn btn-outline btn-sm" onClick={() => setStore({ ...store, logo: '' })}>إزالة</button>}
              </div>
            </div>
          </>
        )}

        {tab === 'social' && (
          <>
            <p className="muted" style={{ marginTop: 0 }}>تظهر أيقونات هذه الروابط في أسفل المتجر، وتُضاف لبيانات Google (sameAs).</p>
            {social.map((s, i) => (
              <div className="option-row" key={i}>
                <select value={s.platform || ''} style={{ maxWidth: 170 }} onChange={(e) => setSocial(social.map((x, k) => (k === i ? { ...x, platform: e.target.value } : x)))}>
                  <option value="">المنصة</option>
                  {Object.entries(SOCIAL_PLATFORMS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
                </select>
                <input dir="ltr" value={s.url || ''} placeholder="https://..." onChange={(e) => setSocial(social.map((x, k) => (k === i ? { ...x, url: e.target.value } : x)))} />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setSocial(social.filter((_, k) => k !== i))}>×</button>
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setSocial([...social, { platform: '', url: '' }])}>+ رابط</button>
          </>
        )}

        {tab === 'seo' && (
          <>
            <div className="grid-2">
              <div className="field"><label>عنوان الموقع في Google (عربي) {(seo.titleAr || '').length}/70</label><input {...E('titleAr')} maxLength={70} /></div>
              <div className="field"><label>عنوان الموقع (إنجليزي) {(seo.titleEn || '').length}/70</label><input dir="ltr" {...E('titleEn')} maxLength={70} /></div>
              <div className="field"><label>الوصف (عربي) {(seo.descriptionAr || '').length}/170</label><textarea rows={3} {...E('descriptionAr')} maxLength={170} /></div>
              <div className="field"><label>الوصف (إنجليزي) {(seo.descriptionEn || '').length}/170</label><textarea dir="ltr" rows={3} {...E('descriptionEn')} maxLength={170} /></div>
            </div>
            <div className="field">
              <label>الكلمات المفتاحية (افصل بفاصلة)</label>
              <textarea rows={2} {...E('keywords')} placeholder="متجر إلكتروني، عطور، ملابس، الدفع عند الاستلام" />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>رمز التحقق من Google Search Console</label>
                <input dir="ltr" {...E('googleVerification')} placeholder="الجزء content من وسم meta" />
                <small>من Search Console ← إضافة موقع ← وسم HTML</small>
              </div>
              <div className="field">
                <label>Google Analytics (Measurement ID)</label>
                <input dir="ltr" {...E('gaId')} placeholder="G-XXXXXXXXXX" />
              </div>
            </div>
            <div className="field">
              <label>صورة المشاركة (تظهر عند مشاركة الرابط في واتساب وفيسبوك)</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {seo.ogImage && <img src={seo.ogImage} alt="" style={{ height: 60, borderRadius: 8 }} />}
                <input type="file" accept={ACCEPT_IMAGES} onChange={(e) => upload(e.target.files?.[0], (url) => setSeo({ ...seo, ogImage: url }))} />
              </div>
            </div>
            <div className="serp-preview">
              <small>معاينة نتيجة Google</small>
              <div className="serp-title">{seo.titleAr || store.nameAr}</div>
              <div className="serp-url">yourstore.com</div>
              <div className="serp-desc">{seo.descriptionAr || 'وصف المتجر يظهر هنا...'}</div>
            </div>
            <div className="alert alert-success" style={{ marginTop: 14 }}>
              يُنشأ تلقائياً: <span dir="ltr">sitemap.xml</span> لكل المنتجات والأقسام، و<span dir="ltr">robots.txt</span>، وبيانات منظمة (Schema.org) للمنتجات حتى يظهر السعر والتوفر في نتائج Google، وروابط hreflang للغتين.
            </div>
          </>
        )}
      </div>

      {status && <div className={`alert alert-${status.type}`} style={{ marginTop: 14 }}>{status.text}</div>}
      <div className="form-actions">
        <button className="btn" onClick={save} disabled={busy}>{busy ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</button>
      </div>
    </>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import InvoiceDocument from '@/components/invoice/InvoiceDocument';
import { DEFAULT_INVOICE, PAPER_SIZES } from '@/lib/siteDefaults';
import { sendJson } from './upload';

const ACCENTS = ['#2563eb', '#111827', '#047857', '#be185d', '#b45309', '#7c3aed', '#dc2626', '#0891b2'];
const TOGGLES = [
  ['showLogo', 'إظهار الشعار'],
  ['showStoreContact', 'بيانات تواصل المتجر'],
  ['showCustomer', 'بيانات الزبون'],
  ['showSku', 'رمز SKU للمنتجات'],
  ['showNotes', 'ملاحظات الطلب'],
  ['showQr', 'رمز QR لرابط الوصل'],
];

export default function InvoiceDesigner({ initial, store, order, qrSvg }) {
  const router = useRouter();
  const [tpl, setTpl] = useState(initial);
  const [lang, setLang] = useState('ar');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (patch) => {
    setTpl((t) => ({ ...t, ...patch }));
    setStatus(null);
  };

  async function save() {
    setBusy(true);
    try {
      await sendJson('/api/admin/settings', 'PUT', { invoice: tpl });
      setStatus({ type: 'success', text: 'تم حفظ تصميم الوصل' });
      router.refresh();
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    }
    setBusy(false);
  }

  return (
    <div className="designer">
      <div className="card designer-panel">
        <h3 style={{ marginTop: 0 }}>مقاس الورق</h3>
        <div className="paper-grid">
          {Object.entries(PAPER_SIZES).map(([k, p]) => (
            <button key={k} type="button" className={`paper-opt ${tpl.paperSize === k ? 'active' : ''}`} onClick={() => set({ paperSize: k })}>
              <span className={`paper-icon ${p.thermal ? 'thermal' : ''}`} />
              {k}
              <small>{p.thermal ? 'حرارية' : p.label.split(' ')[1]}</small>
            </button>
          ))}
        </div>

        <h3>اللون والخط</h3>
        <div className="icon-picker">
          {ACCENTS.map((c) => (
            <button key={c} type="button" className={tpl.accent === c ? 'active' : ''} style={{ background: c, width: 32, height: 32, borderRadius: 999 }} onClick={() => set({ accent: c })} aria-label={c} />
          ))}
          <input type="color" value={tpl.accent} onChange={(e) => set({ accent: e.target.value })} style={{ width: 44, height: 34, padding: 2 }} />
        </div>
        <div className="field" style={{ marginTop: 10 }}>
          <label>حجم الخط</label>
          <div className="chips">
            {[['sm', 'صغير'], ['md', 'متوسط'], ['lg', 'كبير']].map(([k, l]) => (
              <button key={k} type="button" className={`chip ${tpl.fontSize === k ? 'active' : ''}`} onClick={() => set({ fontSize: k })}>{l}</button>
            ))}
          </div>
        </div>

        <h3>العناصر الظاهرة</h3>
        {TOGGLES.map(([k, l]) => (
          <label key={k} className="checkbox" style={{ marginBottom: 6 }}>
            <input type="checkbox" checked={!!tpl[k]} onChange={(e) => set({ [k]: e.target.checked })} /> {l}
          </label>
        ))}

        <h3>النصوص</h3>
        <div className="grid-2">
          <div className="field"><label>العنوان (عربي)</label><input value={tpl.titleAr} onChange={(e) => set({ titleAr: e.target.value })} maxLength={40} /></div>
          <div className="field"><label>العنوان (إنجليزي)</label><input dir="ltr" value={tpl.titleEn} onChange={(e) => set({ titleEn: e.target.value })} maxLength={40} /></div>
        </div>
        <div className="field"><label>ملاحظة أعلى الوصل</label><input value={tpl.headerNote} onChange={(e) => set({ headerNote: e.target.value })} maxLength={300} placeholder="مثال: عرض خاص — خصم 10% على طلبك القادم" /></div>
        <div className="field"><label>رسالة الشكر</label><input value={tpl.footerNote} onChange={(e) => set({ footerNote: e.target.value })} maxLength={300} /></div>
        <div className="field"><label>الشروط والسياسات</label><textarea rows={2} value={tpl.terms} onChange={(e) => set({ terms: e.target.value })} maxLength={600} /></div>

        {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" onClick={save} disabled={busy}>{busy ? '...' : 'حفظ التصميم'}</button>
          <button type="button" className="btn btn-outline" onClick={() => setTpl(initial)}>تراجع</button>
          <button type="button" className="btn btn-outline" onClick={() => setTpl(DEFAULT_INVOICE)}>الافتراضي</button>
        </div>
      </div>

      <div className="designer-preview">
        <div className="chips" style={{ marginBottom: 10 }}>
          <button type="button" className={`chip ${lang === 'ar' ? 'active' : ''}`} onClick={() => setLang('ar')}>معاينة عربي</button>
          <button type="button" className={`chip ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>English preview</button>
        </div>
        <div className="preview-paper">
          <InvoiceDocument order={order} store={store} template={tpl} lang={lang} qrSvg={qrSvg} />
        </div>
      </div>
    </div>
  );
}

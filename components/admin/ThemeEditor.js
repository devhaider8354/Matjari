'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DEFAULT_THEME, THEME_FIELDS, THEME_PRESETS, themeVars } from '@/lib/theme';

const HEX = /^#[0-9a-f]{6}$/i;

export default function ThemeEditor({ initial }) {
  const router = useRouter();
  const [theme, setTheme] = useState(initial);
  const [draft, setDraft] = useState(initial); // نص الحقول قبل أن يصبح لوناً صالحاً
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const apply = (t) => {
    setTheme(t);
    setDraft(t);
    setStatus(null);
  };
  const setColor = (key, value) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (HEX.test(value)) setTheme((t) => ({ ...t, [key]: value.toLowerCase() }));
    setStatus(null);
  };

  async function save() {
    setSaving(true);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    setStatus(res.ok ? { type: 'success', text: 'تم حفظ الثيم وتطبيقه على المتجر' } : { type: 'error', text: data.error || 'تعذّر الحفظ' });
    if (res.ok) router.refresh();
  }

  return (
    <div className="editor-grid">
      <div className="card">
        <h3>ثيمات جاهزة</h3>
        <div className="presets">
          {THEME_PRESETS.map((p) => (
            <button key={p.name} type="button" className="preset" onClick={() => apply(p.theme)}>
              <span className="sw">
                {[p.theme.primary, p.theme.accent, p.theme.bg].map((c) => (
                  <span key={c} style={{ background: c }} />
                ))}
              </span>
              {p.name}
            </button>
          ))}
        </div>

        <h3>تخصيص الألوان</h3>
        {THEME_FIELDS.map(({ key, label }) => (
          <div className="color-row" key={key}>
            <input type="color" value={theme[key]} onChange={(e) => setColor(key, e.target.value)} aria-label={label} />
            <input type="text" dir="ltr" value={draft[key]} onChange={(e) => setColor(key, e.target.value.trim())} maxLength={7} />
            <label>{label}</label>
          </div>
        ))}

        <div className="field">
          <label htmlFor="radius">استدارة الزوايا: {theme.radius}px</label>
          <input
            id="radius"
            type="range"
            min="0"
            max="28"
            value={theme.radius}
            onChange={(e) => apply({ ...theme, radius: Number(e.target.value) })}
            style={{ padding: 0 }}
          />
        </div>

        {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={save} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ وتطبيق'}</button>
          <button className="btn btn-outline" type="button" onClick={() => apply(initial)}>تراجع</button>
          <button className="btn btn-outline" type="button" onClick={() => apply(DEFAULT_THEME)}>الافتراضي</button>
        </div>
      </div>

      <div>
        <p className="muted" style={{ marginTop: 0 }}>معاينة مباشرة (لا تُطبَّق على المتجر قبل الحفظ)</p>
        <ThemePreview theme={theme} />
      </div>
    </div>
  );
}

function ThemePreview({ theme }) {
  return (
    <div className="preview-frame" style={{ ...themeVars(theme), background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>متجري</strong>
        <span className="cart-link" style={{ fontSize: 13 }}>🛒 السلة <span className="badge">2</span></span>
      </div>
      <div style={{ padding: 16 }}>
        <div className="hero" style={{ padding: '22px 18px', marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>تخفيضات الموسم</h3>
          <p style={{ fontSize: 14 }}>خصم حتى 30% على التشكيلة الجديدة</p>
        </div>
        <div className="chips" style={{ marginBottom: 14 }}>
          <span className="chip active">الكل</span>
          <span className="chip">رجالي</span>
          <span className="chip">نسائي</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {['تيشيرت', 'فستان'].map((name, i) => (
            <div className="product-card" key={name}>
              <div className="thumb" style={{ aspectRatio: 'auto', height: 90 }}>{i === 0 && <span className="tag">خصم</span>}</div>
              <div className="info">
                <div style={{ fontWeight: 600 }}>{name}</div>
                <div className="price" style={{ fontSize: 15 }}>
                  25 $ {i === 0 && <span className="old-price">35 $</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-block" style={{ marginTop: 14 }} type="button">أضف إلى السلة</button>
        <p className="muted" style={{ fontSize: 13, margin: '10px 0 0' }}>نص ثانوي للتوضيح</p>
      </div>
    </div>
  );
}

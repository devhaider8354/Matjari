'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CURRENCY_PRESETS, formatMoney } from '@/lib/money';
import { sendJson } from './upload';

const EMPTY = { code: '', nameAr: '', nameEn: '', symbol: '', rate: '', decimals: 2, symbolFirst: false, active: true, order: 0 };

export default function CurrencyManager({ list, base }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch) => setEditing((e) => ({ ...e, ...patch }));
  const existing = new Set([base.code, ...list.map((c) => c.code)]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (editing._id) await sendJson(`/api/admin/currencies/${editing._id}`, 'PUT', editing);
      else await sendJson('/api/admin/currencies', 'POST', editing);
      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  async function remove(c) {
    if (!confirm(`حذف ${c.nameAr}؟`)) return;
    await sendJson(`/api/admin/currencies/${c._id}`, 'DELETE').catch((err) => alert(err.message));
    router.refresh();
  }

  async function toggle(c) {
    await sendJson(`/api/admin/currencies/${c._id}`, 'PUT', { ...c, active: !c.active }).catch((err) => alert(err.message));
    router.refresh();
  }

  return (
    <div className="dash-grid">
      <div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>العملة</th><th>سعر الصرف</th><th>مثال (100 {base.code})</th><th>الحالة</th><th></th></tr></thead>
            <tbody>
              <tr>
                <td><strong>{base.code}</strong> · {base.symbol} <span className="status status-confirmed">أساسية</span></td>
                <td>1</td>
                <td>{formatMoney(100, base)}</td>
                <td>—</td>
                <td></td>
              </tr>
              {list.map((c) => (
                <tr key={c._id}>
                  <td><strong>{c.code}</strong> · {c.nameAr} ({c.symbol})</td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{c.rate}</td>
                  <td>{formatMoney(100, c)}</td>
                  <td>
                    <button className={`status ${c.active ? 'status-delivered' : 'status-cancelled'}`} style={{ border: 0, cursor: 'pointer' }} onClick={() => toggle(c)}>
                      {c.active ? 'مفعّلة' : 'معطّلة'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setEditing({ ...EMPTY, ...c })}>تعديل</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3>إضافة سريعة</h3>
          <div className="chips">
            {CURRENCY_PRESETS.filter((p) => !existing.has(p.code)).map((p) => (
              <button key={p.code} className="chip" onClick={() => setEditing({ ...EMPTY, ...p, rate: '' })}>
                + {p.code} {p.symbol}
              </button>
            ))}
            <button className="chip active" onClick={() => setEditing({ ...EMPTY })}>+ عملة يدوية</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ position: 'sticky', top: 80 }}>
        {!editing ? (
          <div className="empty" style={{ padding: 30 }}>اختر عملة للتعديل أو أضف واحدة</div>
        ) : (
          <form onSubmit={save}>
            <h3>{editing._id ? `تعديل ${editing.code}` : 'عملة جديدة'}</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="grid-2">
              <div className="field"><label>الرمز الدولي *</label><input dir="ltr" value={editing.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} placeholder="IQD" maxLength={6} required /></div>
              <div className="field"><label>رمز العرض *</label><input value={editing.symbol} onChange={(e) => set({ symbol: e.target.value })} placeholder="د.ع" maxLength={8} required /></div>
              <div className="field"><label>الاسم بالعربي *</label><input value={editing.nameAr} onChange={(e) => set({ nameAr: e.target.value })} required /></div>
              <div className="field"><label>الاسم بالإنجليزي</label><input dir="ltr" value={editing.nameEn} onChange={(e) => set({ nameEn: e.target.value })} /></div>
            </div>
            <div className="field">
              <label>سعر الصرف *: 1 {base.code} = ؟ {editing.code || '...'}</label>
              <input type="number" step="any" min="0" value={editing.rate} onChange={(e) => set({ rate: e.target.value })} required dir="ltr" />
            </div>
            <div className="grid-2">
              <div className="field">
                <label>الخانات العشرية</label>
                <select value={editing.decimals} onChange={(e) => set({ decimals: Number(e.target.value) })}>
                  <option value={0}>0 (1,250)</option><option value={2}>2 (12.50)</option><option value={3}>3 (1.250)</option>
                </select>
              </div>
              <label className="checkbox" style={{ marginTop: 26 }}>
                <input type="checkbox" checked={editing.symbolFirst} onChange={(e) => set({ symbolFirst: e.target.checked })} /> الرمز قبل الرقم
              </label>
            </div>
            {Number(editing.rate) > 0 && (
              <div className="alert alert-success">مثال: 100 {base.code} = {formatMoney(100, { ...editing, rate: Number(editing.rate) })}</div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" disabled={busy}>{busy ? '...' : 'حفظ'}</button>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>إلغاء</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

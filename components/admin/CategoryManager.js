'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ACCEPT_IMAGES, sendJson, uploadImage } from './upload';

const EMPTY = {
  name: '', nameEn: '', parent: '', icon: '', image: '', description: '', descriptionEn: '',
  seoTitle: '', seoDescription: '', order: 0, active: true,
};
const ICONS = ['👕', '👗', '👟', '📱', '💻', '🎧', '🔌', '🧴', '💐', '🎁', '💄', '🍫', '🏠', '🧸', '⌚', '📚'];

export default function CategoryManager({ tree, counts }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null); // null | {..., _id?}
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const open = (cat, parent = '') =>
    setEditing(cat ? { ...EMPTY, ...cat, parent: cat.parent || '' } : { ...EMPTY, parent });
  const set = (patch) => setEditing((e) => ({ ...e, ...patch }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = { ...editing, parent: editing.parent || null };
      if (editing._id) await sendJson(`/api/admin/categories/${editing._id}`, 'PUT', body);
      else await sendJson('/api/admin/categories', 'POST', body);
      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  async function remove(cat) {
    if (!confirm(`حذف قسم "${cat.name}"؟`)) return;
    try {
      await sendJson(`/api/admin/categories/${cat._id}`, 'DELETE');
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
  }

  async function upload(file) {
    if (!file) return;
    try {
      const { url } = await uploadImage(file, 'category');
      set({ image: url });
    } catch (err) {
      setError(err.message);
    }
  }

  const Row = ({ cat, child }) => (
    <div className={`cat-row ${child ? 'child' : ''} ${cat.active ? '' : 'inactive'}`}>
      <div className="cat-thumb">{cat.image ? <img src={cat.image} alt="" /> : <span>{cat.icon || '🗂️'}</span>}</div>
      <div className="cat-info">
        <strong>{cat.name}</strong>
        <span className="muted"> · {counts[cat._id] || 0} منتج{!cat.active && ' · مخفي'}</span>
        <div className="muted" dir="ltr" style={{ fontSize: 12, textAlign: 'right' }}>/category/{cat.slug}</div>
      </div>
      <div className="cat-actions">
        {!child && <button className="btn btn-outline btn-sm" onClick={() => open(null, cat._id)}>+ فرعي</button>}
        <button className="btn btn-outline btn-sm" onClick={() => open(cat)}>تعديل</button>
        <button className="btn btn-danger btn-sm" onClick={() => remove(cat)}>حذف</button>
      </div>
    </div>
  );

  return (
    <div className="dash-grid">
      <div className="card">
        <div className="page-head" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>شجرة الأقسام</h3>
          <button className="btn btn-sm" onClick={() => open(null)}>+ قسم رئيسي</button>
        </div>
        {tree.length === 0 && <div className="empty">لا توجد أقسام بعد. ابدأ بإضافة قسم رئيسي.</div>}
        {tree.map((cat) => (
          <div key={cat._id} className="cat-group">
            <Row cat={cat} />
            {cat.children.map((ch) => <Row key={ch._id} cat={ch} child />)}
          </div>
        ))}
      </div>

      <div className="card" style={{ position: 'sticky', top: 80 }}>
        {!editing ? (
          <div className="empty" style={{ padding: 30 }}>اختر قسماً للتعديل أو أضف قسماً جديداً</div>
        ) : (
          <form onSubmit={save}>
            <h3>{editing._id ? 'تعديل القسم' : 'قسم جديد'}</h3>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="grid-2">
              <div className="field">
                <label>الاسم بالعربي *</label>
                <input value={editing.name} onChange={(e) => set({ name: e.target.value })} required maxLength={80} autoFocus />
              </div>
              <div className="field">
                <label>الاسم بالإنجليزي</label>
                <input dir="ltr" value={editing.nameEn} onChange={(e) => set({ nameEn: e.target.value })} maxLength={80} />
              </div>
            </div>
            <div className="field">
              <label>القسم الأب</label>
              <select value={editing.parent} onChange={(e) => set({ parent: e.target.value })}>
                <option value="">— قسم رئيسي —</option>
                {tree.filter((c) => c._id !== editing._id).map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>أيقونة</label>
              <div className="icon-picker">
                {ICONS.map((i) => (
                  <button type="button" key={i} className={editing.icon === i ? 'active' : ''} onClick={() => set({ icon: i })}>{i}</button>
                ))}
                <input value={editing.icon} onChange={(e) => set({ icon: e.target.value })} maxLength={8} style={{ width: 60 }} />
              </div>
            </div>
            <div className="field">
              <label>صورة القسم (اختياري)</label>
              {editing.image && (
                <div className="image-list"><div className="img"><img src={editing.image} alt="" /><button type="button" onClick={() => set({ image: '' })}>×</button></div></div>
              )}
              <input type="file" accept={ACCEPT_IMAGES} onChange={(e) => upload(e.target.files?.[0])} />
            </div>
            <div className="field">
              <label>الوصف (يظهر أعلى صفحة القسم)</label>
              <textarea rows={2} value={editing.description} onChange={(e) => set({ description: e.target.value })} maxLength={1000} />
            </div>
            <details className="field">
              <summary>🔍 SEO والوصف الإنجليزي</summary>
              <div className="field" style={{ marginTop: 10 }}>
                <label>الوصف بالإنجليزي</label>
                <textarea dir="ltr" rows={2} value={editing.descriptionEn} onChange={(e) => set({ descriptionEn: e.target.value })} maxLength={1000} />
              </div>
              <div className="field">
                <label>عنوان SEO ({editing.seoTitle.length}/70)</label>
                <input value={editing.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} maxLength={70} placeholder="يُولَّد من الاسم إذا تُرك فارغاً" />
              </div>
              <div className="field">
                <label>وصف SEO ({editing.seoDescription.length}/170)</label>
                <textarea rows={2} value={editing.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} maxLength={170} />
              </div>
            </details>
            <div className="grid-2">
              <div className="field">
                <label>الترتيب</label>
                <input type="number" value={editing.order} onChange={(e) => set({ order: e.target.value })} />
              </div>
              <label className="checkbox" style={{ marginTop: 26 }}>
                <input type="checkbox" checked={editing.active} onChange={(e) => set({ active: e.target.checked })} />
                ظاهر في المتجر
              </label>
            </div>
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

'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { combinations, PRODUCT_TYPES, typeOf, variantKey } from '@/lib/productTypes';
import { useAdminUrl } from './AdminContext';
import BarcodeScanner from './BarcodeScanner';
import { ACCEPT_IMAGES, sendJson, uploadImage } from './upload';
import VariantImagePicker from './VariantImagePicker';
import VideoManager from './VideoManager';

const splitValues = (text) => [...new Set(String(text || '').split(',').map((s) => s.trim()).filter(Boolean))];
const randomSku = (type) => `${(type || 'gen').slice(0, 3).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

function initialState(p) {
  return {
    type: p?.type || 'general',
    name: p?.name || '',
    nameEn: p?.nameEn || '',
    brand: p?.brand || '',
    category: p?.category || '',
    description: p?.description || '',
    descriptionEn: p?.descriptionEn || '',
    price: p?.price ?? '',
    comparePrice: p?.comparePrice ?? '',
    cost: p?.cost ?? '',
    stock: p?.stock ?? 0,
    lowStockAlert: p?.lowStockAlert ?? 3,
    sku: p?.sku || '',
    barcode: p?.barcode || '',
    images: p?.images || [],
    videos: p?.videos || [],
    specs: p?.specs?.length ? p.specs : [],
    options: (p?.options || []).map((o) => ({ name: o.name, text: o.values.join(', ') })),
    variants: Object.fromEntries((p?.variants || []).map((v) => [v.key, v])),
    tags: (p?.tags || []).join(', '),
    seoTitle: p?.seoTitle || '',
    seoDescription: p?.seoDescription || '',
    seoKeywords: (p?.seoKeywords || []).join(', '),
    featured: p?.featured ?? false,
    active: p?.active ?? true,
  };
}

export default function ProductForm({ product, categories }) {
  const router = useRouter();
  const adminUrl = useAdminUrl();
  const [f, setF] = useState(() => initialState(product));
  const [tab, setTab] = useState('basic');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const set = (patch) => setF((s) => ({ ...s, ...patch }));

  const options = useMemo(
    () => f.options.map((o) => ({ name: o.name.trim(), values: splitValues(o.text) })).filter((o) => o.name && o.values.length),
    [f.options]
  );
  const combos = useMemo(() => combinations(options), [options]);
  const hasVariants = combos.length > 0;
  const variantRow = (key) => f.variants[key] || {};
  const setVariant = (key, patch) => set({ variants: { ...f.variants, [key]: { ...variantRow(key), ...patch } } });

  // تطبيق قالب النوع: يضيف المواصفات والخيارات المقترحة إن كانت فارغة
  function chooseType(type) {
    const t = typeOf(type);
    set({
      type,
      specs: f.specs.length ? f.specs : t.specs.map((key) => ({ key, value: '' })),
      options: f.options.length ? f.options : t.options.map((o) => ({ name: o.name, text: o.values.join(', ') })),
    });
  }

  async function upload(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setError('');
    let saved = 0;
    let original = 0;
    for (const file of files) {
      try {
        const r = await uploadImage(file, 'product');
        setF((s) => ({ ...s, images: [...s.images, r.url] }));
        original += r.originalKB;
        saved += r.sizeKB;
      } catch (err) {
        setError(err.message);
      }
    }
    if (original) setNote(`تم ضغط الصور إلى WebP: ${original}KB ← ${saved}KB`);
    setUploading(false);
  }

  function fillAllVariants(field) {
    const value = prompt(field === 'price' ? 'السعر لكل المتغيرات:' : 'المخزون لكل المتغيرات:');
    if (value == null || value === '') return;
    set({ variants: Object.fromEntries(combos.map((c) => [variantKey(c), { ...variantRow(variantKey(c)), [field]: value }])) });
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...f,
      options,
      variants: combos.map((values) => ({ key: variantKey(values), ...variantRow(variantKey(values)) })),
      specs: f.specs.filter((s) => s.key && s.value),
    };
    try {
      if (product) await sendJson(`/api/admin/products/${product._id}`, 'PUT', payload);
      else await sendJson('/api/admin/products', 'POST', payload);
      router.push(adminUrl('/products'));
      router.refresh();
    } catch (err) {
      setError(err.message);
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const TABS = [
    ['basic', '📝 المعلومات'],
    ['media', `🖼️ الصور (${f.images.length})`],
    ['video', `🎬 الفيديو (${f.videos.length})`],
    ['pricing', hasVariants ? `🧩 المتغيرات (${combos.length})` : '💰 السعر والمخزون'],
    ['specs', `📋 المواصفات (${f.specs.length})`],
    ['seo', '🔍 SEO والإنجليزي'],
  ];

  return (
    <form onSubmit={submit} className="product-form">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>نوع المنتج</label>
        <div className="type-grid">
          {Object.entries(PRODUCT_TYPES).map(([key, t]) => (
            <button key={key} type="button" className={`type-card ${f.type === key ? 'active' : ''}`} onClick={() => chooseType(key)}>
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tabs">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      <div className="card">
        {tab === 'basic' && (
          <>
            <div className="grid-2">
              <div className="field">
                <label>اسم المنتج *</label>
                <input value={f.name} onChange={(e) => set({ name: e.target.value })} required maxLength={150} />
              </div>
              <div className="field">
                <label>العلامة التجارية</label>
                <input value={f.brand} onChange={(e) => set({ brand: e.target.value })} maxLength={80} placeholder="Samsung، Dior..." />
              </div>
              <div className="field">
                <label>القسم</label>
                <select value={f.category} onChange={(e) => set({ category: e.target.value })}>
                  <option value="">— بدون قسم —</option>
                  {categories.map((c) => (
                    <optgroup key={c._id} label={c.name}>
                      <option value={c._id}>{c.name} (الكل)</option>
                      {c.children.map((ch) => <option key={ch._id} value={ch._id}>↳ {ch.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>وسوم (للبحث)</label>
                <input value={f.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="هدية، صيفي، جديد" />
              </div>
            </div>
            <div className="field">
              <label>الوصف</label>
              <textarea rows={6} value={f.description} onChange={(e) => set({ description: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <label className="checkbox"><input type="checkbox" checked={f.active} onChange={(e) => set({ active: e.target.checked })} /> ظاهر في المتجر</label>
              <label className="checkbox"><input type="checkbox" checked={f.featured} onChange={(e) => set({ featured: e.target.checked })} /> ⭐ منتج مميز (يظهر في الرئيسية)</label>
            </div>
          </>
        )}

        {tab === 'media' && (
          <>
            <p className="muted" style={{ marginTop: 0 }}>الصورة الأولى هي الرئيسية. تُضغط الصور تلقائياً وتُحوّل إلى WebP وتُحذف بيانات الموقع منها.</p>
            <input type="file" accept={ACCEPT_IMAGES} multiple onChange={upload} disabled={uploading} />
            {uploading && <p className="muted">جاري الرفع والضغط...</p>}
            {note && <div className="alert alert-success" style={{ marginTop: 10 }}>{note}</div>}
            <div className="image-list">
              {f.images.map((src, i) => (
                <div className="img" key={src}>
                  <img src={src} alt="" />
                  {i === 0 && <span className="img-main">رئيسية</span>}
                  <button type="button" onClick={() => set({ images: f.images.filter((x) => x !== src) })} aria-label="حذف">×</button>
                  {i > 0 && (
                    <button type="button" style={{ top: 'auto', bottom: 4 }} aria-label="تقديم"
                      onClick={() => { const next = [...f.images]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; set({ images: next }); }}>→</button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'video' && <VideoManager videos={f.videos} onChange={(videos) => set({ videos })} />}

        {tab === 'pricing' && (
          <>
            <h4 style={{ marginTop: 0 }}>الخيارات (مثل الحجم، اللون، السعة)</h4>
            <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
              أضف خياراً واكتب قيمه مفصولة بفاصلة. كل تركيبة تصبح متغيراً له سعر ومخزون وباركود خاص. اتركها فارغة للمنتج البسيط.
            </p>
            {f.options.map((o, i) => (
              <div className="option-row" key={i}>
                <input value={o.name} placeholder="اسم الخيار" style={{ maxWidth: 160 }}
                  onChange={(e) => set({ options: f.options.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)) })} />
                <input value={o.text} placeholder="القيم: 50ml, 100ml"
                  onChange={(e) => set({ options: f.options.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)) })} />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => set({ options: f.options.filter((_, k) => k !== i) })}>حذف</button>
              </div>
            ))}
            {f.options.length < 3 && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => set({ options: [...f.options, { name: '', text: '' }] })}>+ خيار</button>
            )}

            <hr className="sep" />
            {!hasVariants ? (
              <div className="grid-3">
                <div className="field"><label>السعر *</label><input type="number" min="0" step="any" value={f.price} onChange={(e) => set({ price: e.target.value })} required /></div>
                <div className="field"><label>السعر قبل الخصم</label><input type="number" min="0" step="any" value={f.comparePrice} onChange={(e) => set({ comparePrice: e.target.value })} /></div>
                <div className="field"><label>سعر التكلفة <small>(لا يظهر للزبون)</small></label><input type="number" min="0" step="any" value={f.cost} onChange={(e) => set({ cost: e.target.value })} /></div>
                <div className="field"><label>المخزون</label><input type="number" min="0" value={f.stock} onChange={(e) => set({ stock: e.target.value })} /></div>
                <div className="field">
                  <label>SKU</label>
                  <div className="input-group">
                    <input dir="ltr" value={f.sku} onChange={(e) => set({ sku: e.target.value.toUpperCase() })} />
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => set({ sku: randomSku(f.type) })}>توليد</button>
                  </div>
                </div>
                <div className="field">
                  <label>الباركود</label>
                  <div className="input-group">
                    <input dir="ltr" value={f.barcode} onChange={(e) => set({ barcode: e.target.value })} placeholder="EAN / UPC" />
                    <BarcodeScanner onDetected={(code) => set({ barcode: code })} label="📷" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="page-head" style={{ marginBottom: 8 }}>
                  <h4 style={{ margin: 0 }}>المتغيرات ({combos.length})</h4>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => fillAllVariants('price')}>سعر للكل</button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => fillAllVariants('stock')}>مخزون للكل</button>
                  </div>
                </div>
                <div className="grid-3" style={{ marginBottom: 10 }}>
                  <div className="field"><label>السعر الافتراضي</label><input type="number" min="0" step="any" value={f.price} onChange={(e) => set({ price: e.target.value })} /></div>
                  <div className="field"><label>سعر التكلفة</label><input type="number" min="0" step="any" value={f.cost} onChange={(e) => set({ cost: e.target.value })} /></div>
                  <div className="field"><label>SKU الأساسي</label><input dir="ltr" value={f.sku} onChange={(e) => set({ sku: e.target.value.toUpperCase() })} /></div>
                </div>
                <div className="table-wrap">
                  <table className="variants-table">
                    <thead><tr><th>المتغير</th><th>الصورة</th><th>السعر</th><th>قبل الخصم</th><th>المخزون</th><th>SKU</th><th>الباركود</th></tr></thead>
                    <tbody>
                      {combos.map((values) => {
                        const key = variantKey(values);
                        const v = variantRow(key);
                        return (
                          <tr key={key}>
                            <td><strong>{key}</strong></td>
                            <td>
                              {/* الصورة التي تظهر عند اختيار هذا المتغير في المتجر */}
                              <VariantImagePicker images={f.images} value={v.image || ''} onChange={(image) => setVariant(key, { image })} />
                            </td>
                            <td><input type="number" min="0" step="any" value={v.price ?? ''} placeholder={String(f.price || '')} onChange={(e) => setVariant(key, { price: e.target.value })} /></td>
                            <td><input type="number" min="0" step="any" value={v.comparePrice ?? ''} onChange={(e) => setVariant(key, { comparePrice: e.target.value })} /></td>
                            <td><input type="number" min="0" value={v.stock ?? 0} onChange={(e) => setVariant(key, { stock: e.target.value })} /></td>
                            <td><input dir="ltr" value={v.sku || ''} onChange={(e) => setVariant(key, { sku: e.target.value.toUpperCase() })} /></td>
                            <td>
                              <div className="input-group">
                                <input dir="ltr" value={v.barcode || ''} onChange={(e) => setVariant(key, { barcode: e.target.value })} />
                                <BarcodeScanner onDetected={(code) => setVariant(key, { barcode: code })} label="📷" />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <div className="field" style={{ maxWidth: 220, marginTop: 14 }}>
              <label>تنبيه المخزون المنخفض عند</label>
              <input type="number" min="0" value={f.lowStockAlert} onChange={(e) => set({ lowStockAlert: e.target.value })} />
            </div>
          </>
        )}

        {tab === 'specs' && (
          <>
            <p className="muted" style={{ marginTop: 0 }}>تظهر كجدول في صفحة المنتج. اختيار «نوع المنتج» يقترح مواصفات مناسبة.</p>
            {f.specs.map((s, i) => (
              <div className="option-row" key={i}>
                <input value={s.key} placeholder="الخاصية" style={{ maxWidth: 200 }}
                  onChange={(e) => set({ specs: f.specs.map((x, k) => (k === i ? { ...x, key: e.target.value } : x)) })} />
                <input value={s.value} placeholder="القيمة"
                  onChange={(e) => set({ specs: f.specs.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)) })} />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => set({ specs: f.specs.filter((_, k) => k !== i) })}>×</button>
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={() => set({ specs: [...f.specs, { key: '', value: '' }] })}>+ مواصفة</button>
          </>
        )}

        {tab === 'seo' && (
          <>
            <div className="grid-2">
              <div className="field"><label>الاسم بالإنجليزي</label><input dir="ltr" value={f.nameEn} onChange={(e) => set({ nameEn: e.target.value })} maxLength={150} /></div>
              <div className="field"><label>الكلمات المفتاحية</label><input value={f.seoKeywords} onChange={(e) => set({ seoKeywords: e.target.value })} placeholder="عطر رجالي، عطر فرنسي" /></div>
            </div>
            <div className="field"><label>الوصف بالإنجليزي</label><textarea dir="ltr" rows={4} value={f.descriptionEn} onChange={(e) => set({ descriptionEn: e.target.value })} /></div>
            <div className="field">
              <label>عنوان SEO ({f.seoTitle.length}/70)</label>
              <input value={f.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} maxLength={70} placeholder={f.name} />
            </div>
            <div className="field">
              <label>وصف SEO ({f.seoDescription.length}/170)</label>
              <textarea rows={2} value={f.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} maxLength={170} placeholder={f.description.slice(0, 160)} />
            </div>
            <div className="serp-preview">
              <small>معاينة نتيجة Google</small>
              <div className="serp-title">{f.seoTitle || f.name || 'اسم المنتج'}</div>
              <div className="serp-url">yourstore.com › product</div>
              <div className="serp-desc">{f.seoDescription || f.description.slice(0, 160) || 'وصف المنتج يظهر هنا...'}</div>
            </div>
          </>
        )}
      </div>

      <div className="form-actions">
        <button className="btn" disabled={saving || uploading}>{saving ? 'جاري الحفظ...' : product ? 'حفظ التعديلات' : 'إضافة المنتج'}</button>
        <button type="button" className="btn btn-outline" onClick={() => router.back()}>إلغاء</button>
      </div>
    </form>
  );
}

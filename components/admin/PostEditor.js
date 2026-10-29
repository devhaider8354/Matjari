'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { renderMarkdown } from '@/lib/markdown';
import { useAdminUrl } from './AdminContext';
import { ACCEPT_IMAGES, sendJson, uploadImage } from './upload';

const EMPTY = {
  title: '', titleEn: '', slug: '', excerpt: '', excerptEn: '', content: '', contentEn: '',
  cover: '', tags: '', author: '', published: false, seoTitle: '', seoDescription: '',
};

export default function PostEditor({ post }) {
  const router = useRouter();
  const adminUrl = useAdminUrl();
  const [p, setP] = useState(() => ({ ...EMPTY, ...post, tags: (post?.tags || []).join(', ') }));
  const [lang, setLang] = useState('ar');
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const area = useRef(null);
  const set = (patch) => {
    setP((x) => ({ ...x, ...patch }));
    setStatus(null);
  };
  const cKey = lang === 'en' ? 'contentEn' : 'content';

  // أدوات التنسيق: تضيف صيغة Markdown حول النص المحدد
  function wrap(before, after = '', placeholder = '') {
    const el = area.current;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const sel = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    set({ [cKey]: next });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  }

  async function insertImage(file) {
    if (!file) return;
    try {
      const { url } = await uploadImage(file, 'product');
      wrap(`\n![`, `](${url})\n`, 'وصف الصورة');
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    }
  }

  async function save(published) {
    setBusy(true);
    try {
      const body = { ...p, published };
      const r = post ? await sendJson(`/api/admin/posts/${post._id}`, 'PUT', body) : await sendJson('/api/admin/posts', 'POST', body);
      setStatus({ type: 'success', text: published ? 'تم النشر ✓' : 'تم الحفظ كمسودة' });
      if (!post) router.replace(adminUrl(`/blog/${r.id}`));
      else router.refresh();
      set({ published });
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    }
    setBusy(false);
  }

  async function remove() {
    if (!confirm('حذف المقال نهائياً؟')) return;
    await sendJson(`/api/admin/posts/${post._id}`, 'DELETE');
    router.push(adminUrl('/blog'));
    router.refresh();
  }

  return (
    <div className="dash-grid">
      <div className="card">
        <div className="chips" style={{ marginBottom: 12 }}>
          <button type="button" className={`chip ${lang === 'ar' ? 'active' : ''}`} onClick={() => setLang('ar')}>العربية</button>
          <button type="button" className={`chip ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>English</button>
        </div>
        <div className="field">
          <label>{lang === 'en' ? 'Title' : 'العنوان *'}</label>
          <input dir={lang === 'en' ? 'ltr' : 'rtl'} value={lang === 'en' ? p.titleEn : p.title} onChange={(e) => set(lang === 'en' ? { titleEn: e.target.value } : { title: e.target.value })} maxLength={160} />
        </div>
        <div className="field">
          <label>{lang === 'en' ? 'Excerpt' : 'ملخص قصير'}</label>
          <textarea rows={2} dir={lang === 'en' ? 'ltr' : 'rtl'} value={lang === 'en' ? p.excerptEn : p.excerpt} onChange={(e) => set(lang === 'en' ? { excerptEn: e.target.value } : { excerpt: e.target.value })} maxLength={400} />
        </div>
        <div className="md-toolbar">
          <button type="button" onClick={() => wrap('\n## ', '\n', 'عنوان فرعي')}>H</button>
          <button type="button" onClick={() => wrap('**', '**', 'نص عريض')}><b>B</b></button>
          <button type="button" onClick={() => wrap('*', '*', 'مائل')}><i>I</i></button>
          <button type="button" onClick={() => wrap('[', '](https://)', 'نص الرابط')}>🔗</button>
          <button type="button" onClick={() => wrap('\n- ', '', 'عنصر')}>• قائمة</button>
          <button type="button" onClick={() => wrap('\n> ', '', 'اقتباس')}>❝</button>
          <label className="md-img">🖼️<input type="file" accept={ACCEPT_IMAGES} onChange={(e) => { insertImage(e.target.files?.[0]); e.target.value = ''; }} hidden /></label>
          <button type="button" className={preview ? 'active' : ''} onClick={() => setPreview((v) => !v)} style={{ marginInlineStart: 'auto' }}>{preview ? '✏️ تحرير' : '👁 معاينة'}</button>
        </div>
        {preview ? (
          <div className="post-body md-preview" dir={lang === 'en' ? 'ltr' : 'rtl'} dangerouslySetInnerHTML={{ __html: renderMarkdown(p[cKey]) }} />
        ) : (
          <textarea ref={area} className="md-editor" dir={lang === 'en' ? 'ltr' : 'rtl'} rows={18} value={p[cKey]} onChange={(e) => set({ [cKey]: e.target.value })}
            placeholder={'اكتب المقال هنا...\n\n## عنوان فرعي\nفقرة عادية مع **كلمة مهمة**.\n\n- نقطة أولى\n- نقطة ثانية'} />
        )}
      </div>

      <div>
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>النشر</h3>
          <p className="muted" style={{ marginTop: 0 }}>{p.published ? '🟢 منشور' : '⚪ مسودة'}</p>
          {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => save(true)} disabled={busy || !p.title}>{p.published ? 'تحديث' : 'نشر'}</button>
            <button className="btn btn-outline" onClick={() => save(false)} disabled={busy || !p.title}>{p.published ? 'إلغاء النشر' : 'حفظ كمسودة'}</button>
            {post && <button className="btn btn-danger" onClick={remove}>حذف</button>}
          </div>
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>صورة الغلاف</h3>
          {p.cover && <img src={p.cover} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 8 }} />}
          <input type="file" accept={ACCEPT_IMAGES} onChange={async (e) => { const f = e.target.files?.[0]; if (f) set({ cover: (await uploadImage(f, 'banner')).url }); }} />
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>SEO</h3>
          <div className="field"><label>الرابط (slug)</label><input dir="ltr" value={p.slug} onChange={(e) => set({ slug: e.target.value })} placeholder="يُولَّد من العنوان" /></div>
          <div className="field"><label>الوسوم</label><input value={p.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="عطور، نصائح" /></div>
          <div className="field"><label>عنوان SEO ({p.seoTitle.length}/70)</label><input value={p.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} maxLength={70} /></div>
          <div className="field"><label>وصف SEO ({p.seoDescription.length}/170)</label><textarea rows={2} value={p.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} maxLength={170} /></div>
        </div>
      </div>
    </div>
  );
}

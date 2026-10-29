'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { youtubeId } from '@/lib/validate';
import { ACCEPT_VIDEO, uploadMedia } from './upload';

const emptySlide = () => ({ image: '', video: '', youtube: '', title: '', subtitle: '', buttonText: 'تسوّق الآن', link: '/', active: true });

export default function SlidesEditor({ initial }) {
  const router = useRouter();
  const [slides, setSlides] = useState(initial);
  const [uploading, setUploading] = useState(null);
  const [videoProgress, setVideoProgress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const update = (i, patch) => {
    setSlides((list) => list.map((s, k) => (k === i ? { ...s, ...patch } : s)));
    setStatus(null);
  };
  const move = (i, dir) =>
    setSlides((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  async function upload(i, file) {
    if (!file) return;
    setUploading(i);
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body });
    const data = await res.json().catch(() => ({}));
    setUploading(null);
    if (res.ok) update(i, { image: data.url });
    else setStatus({ type: 'error', text: data.error || 'فشل رفع الصورة' });
  }

  async function uploadVideo(i, file) {
    if (!file) return;
    setVideoProgress({ i, p: 0 });
    try {
      const { url } = await uploadMedia(file, (p) => setVideoProgress({ i, p }));
      update(i, { video: url, youtube: '' });
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    }
    setVideoProgress(null);
  }

  async function save() {
    setSaving(true);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slides }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    setStatus(res.ok ? { type: 'success', text: 'تم حفظ السلايدر' } : { type: 'error', text: data.error || 'تعذّر الحفظ' });
    if (res.ok) router.refresh();
  }

  return (
    <>
      <p className="muted">
        المقاس المقترح للصور 1600×600 بكسل. إذا لم توجد شرائح مفعّلة يظهر البانر الافتراضي في الرئيسية.
      </p>

      {slides.map((s, i) => (
        <div className="card slide-editor" key={i}>
          <div>
            <div className="thumb">
              {s.video ? (
                <video src={s.video} poster={s.image || undefined} muted loop autoPlay playsInline />
              ) : s.youtube ? (
                <img src={`https://i.ytimg.com/vi/${s.youtube}/mqdefault.jpg`} alt="" />
              ) : s.image ? (
                <img src={s.image} alt="" />
              ) : uploading === i ? 'جاري الرفع...' : 'بدون صورة'}
            </div>
            <label className="mini-label">🖼️ صورة (أو غلاف للفيديو)</label>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => upload(i, e.target.files?.[0])} style={{ fontSize: 13 }} />
            <label className="mini-label">🎬 فيديو خلفية (MP4، صامت ومتكرر)</label>
            <input type="file" accept={ACCEPT_VIDEO} onChange={(e) => uploadVideo(i, e.target.files?.[0])} disabled={videoProgress !== null} style={{ fontSize: 13 }} />
            {videoProgress !== null && videoProgress.i === i && (
              <div className="progress-bar"><div style={{ width: `${videoProgress.p}%` }} /><span>{videoProgress.p}%</span></div>
            )}
            <label className="mini-label">▶ أو رابط يوتيوب</label>
            <input dir="ltr" defaultValue={s.youtube ? `https://youtu.be/${s.youtube}` : ''} placeholder="https://youtube.com/watch?v=..."
              onBlur={(e) => update(i, { youtube: youtubeId(e.target.value), video: youtubeId(e.target.value) ? '' : s.video })} style={{ fontSize: 13 }} />
            {(s.video || s.youtube) && (
              <button type="button" className="link-btn" onClick={() => update(i, { video: '', youtube: '' })}>إزالة الفيديو</button>
            )}
          </div>
          <div>
            <div className="grid-2">
              <div className="field">
                <label>العنوان</label>
                <input value={s.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="تشكيلة الشتاء" />
              </div>
              <div className="field">
                <label>النص الفرعي</label>
                <input value={s.subtitle} onChange={(e) => update(i, { subtitle: e.target.value })} placeholder="خصم حتى 30%" />
              </div>
              <div className="field">
                <label>نص الزر</label>
                <input value={s.buttonText} onChange={(e) => update(i, { buttonText: e.target.value })} />
              </div>
              <div className="field">
                <label>رابط الزر</label>
                <input dir="ltr" value={s.link} onChange={(e) => update(i, { link: e.target.value })} placeholder="/?cat=نسائي" />
              </div>
            </div>
            <div className="slide-actions">
              <label className="checkbox" style={{ marginInlineEnd: 'auto' }}>
                <input type="checkbox" checked={s.active} onChange={(e) => update(i, { active: e.target.checked })} />
                مفعّلة
              </label>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => move(i, -1)} disabled={i === 0}>▲ أعلى</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => move(i, 1)} disabled={i === slides.length - 1}>▼ أسفل</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => setSlides((l) => l.filter((_, k) => k !== i))}>حذف</button>
            </div>
          </div>
        </div>
      ))}

      {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-outline" onClick={() => setSlides((l) => [...l, emptySlide()])} disabled={slides.length >= 10}>
          + إضافة شريحة
        </button>
        <button type="button" className="btn" onClick={save} disabled={saving || uploading !== null}>
          {saving ? 'جاري الحفظ...' : 'حفظ السلايدر'}
        </button>
      </div>
    </>
  );
}

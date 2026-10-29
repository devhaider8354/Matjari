'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ACCEPT_AUDIO, sendJson, uploadMedia } from './upload';

export default function MusicEditor({ initial }) {
  const router = useRouter();
  const [m, setM] = useState(initial);
  const [progress, setProgress] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);
  const set = (patch) => {
    setM((x) => ({ ...x, ...patch }));
    setStatus(null);
  };

  async function upload(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    const errors = [];
    let added = 0;
    setUploadMsg(null);
    for (const file of files) {
      setProgress(0);
      try {
        const { url, kind } = await uploadMedia(file, setProgress);
        if (kind !== 'audio') throw new Error('هذا ملف فيديو وليس صوتاً');
        setM((x) => ({ ...x, tracks: [...x.tracks, { url, title: file.name.replace(/\.\w+$/, '') }] }));
        added++;
      } catch (err) {
        errors.push(`${file.name}: ${err.message}`);
      }
    }
    setProgress(null);
    setStatus(null);
    if (errors.length) setUploadMsg({ type: 'error', text: errors.join(' — ') });
    // المقطع يُرفع فوراً لكنه لا يظهر في المتجر قبل الحفظ
    else if (added) setUploadMsg({ type: 'success', text: `تم رفع ${added} مقطع. فعّل الموسيقى واضغط «حفظ» ليظهر في المتجر.` });
  }

  const move = (i, d) => {
    const t = [...m.tracks];
    const j = i + d;
    if (j < 0 || j >= t.length) return;
    [t[i], t[j]] = [t[j], t[i]];
    set({ tracks: t });
  };

  async function save() {
    setBusy(true);
    try {
      await sendJson('/api/admin/settings', 'PUT', { music: m });
      setStatus({ type: 'success', text: 'تم الحفظ. افتح المتجر وانقر في أي مكان لتبدأ الموسيقى.' });
      router.refresh();
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    }
    setBusy(false);
  }

  return (
    <div className="dash-grid">
      <div className="card">
        <h3 style={{ marginTop: 0 }}>المقاطع ({m.tracks.length})</h3>
        <input type="file" accept={ACCEPT_AUDIO} multiple onChange={upload} disabled={progress !== null} />
        {progress !== null && <div className="progress-bar"><div style={{ width: `${progress}%` }} /><span>{progress}%</span></div>}
        <small className="muted" style={{ display: 'block', margin: '6px 0 12px' }}>MP3 / M4A / AAC / OGG / WAV / FLAC حتى 25MB. يُفضّل موسيقى هادئة بدون حقوق نشر (Royalty-free).</small>
        {uploadMsg && <div className={`alert alert-${uploadMsg.type}`}>{uploadMsg.text}</div>}
        {m.tracks.length === 0 && <div className="empty" style={{ padding: 20 }}>لم تُرفع موسيقى بعد</div>}
        {m.tracks.map((t, i) => (
          <div className="track-row" key={t.url}>
            <span className="rank">{i + 1}</span>
            <input value={t.title} onChange={(e) => set({ tracks: m.tracks.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)) })} maxLength={120} />
            <audio src={t.url} controls preload="none" />
            <button type="button" className="btn btn-outline btn-sm" onClick={() => move(i, -1)} disabled={i === 0}>▲</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => move(i, 1)} disabled={i === m.tracks.length - 1}>▼</button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => set({ tracks: m.tracks.filter((_, k) => k !== i) })}>×</button>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>الإعدادات</h3>
        <label className="checkbox" style={{ marginBottom: 10 }}>
          <input type="checkbox" checked={m.enabled} onChange={(e) => set({ enabled: e.target.checked })} /> تفعيل الموسيقى في المتجر
        </label>
        <label className="checkbox" style={{ marginBottom: 10 }}>
          <input type="checkbox" checked={m.autoplay} onChange={(e) => set({ autoplay: e.target.checked })} /> تشغيل تلقائي (مع أول نقرة للزائر)
        </label>
        <label className="checkbox" style={{ marginBottom: 10 }}>
          <input type="checkbox" checked={m.shuffle} onChange={(e) => set({ shuffle: e.target.checked })} /> ترتيب عشوائي
        </label>
        <div className="field">
          <label>مستوى الصوت الافتراضي: {Math.round(m.volume * 100)}%</label>
          <input type="range" min="0" max="1" step="0.05" value={m.volume} onChange={(e) => set({ volume: Number(e.target.value) })} style={{ padding: 0 }} />
        </div>
        {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}
        <button className="btn btn-block" onClick={save} disabled={busy || progress !== null}>{busy ? '...' : 'حفظ'}</button>
      </div>
    </div>
  );
}

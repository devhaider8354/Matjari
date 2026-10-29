'use client';

import { useState } from 'react';
import { youtubeId } from '@/lib/validate';
import { ACCEPT_VIDEO, uploadMedia } from './upload';

// فيديوهات المنتج: رفع ملف (MP4/WEBM حتى 100MB) أو رابط يوتيوب
export default function VideoManager({ videos, onChange }) {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [yt, setYt] = useState('');

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setProgress(0);
    try {
      const { url } = await uploadMedia(file, setProgress);
      onChange([...videos, { type: 'file', url, title: file.name.replace(/\.\w+$/, '') }]);
    } catch (err) {
      setError(err.message);
    }
    setProgress(null);
  }

  function addYoutube() {
    const id = youtubeId(yt);
    if (!id) return setError('رابط يوتيوب غير صالح');
    setError('');
    onChange([...videos, { type: 'youtube', id }]);
    setYt('');
  }

  return (
    <>
      <p className="muted" style={{ marginTop: 0 }}>تظهر الفيديوهات في معرض صور المنتج بجانب الصور، ويشغّلها الزبون بضغطة.</p>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="grid-2">
        <div className="field">
          <label>رفع فيديو من جهازك</label>
          <input type="file" accept={ACCEPT_VIDEO} onChange={upload} disabled={progress !== null} />
          {progress !== null && (
            <div className="progress-bar"><div style={{ width: `${progress}%` }} /><span>{progress}%</span></div>
          )}
          <small>MP4 أو WEBM، حتى 100MB. يُفضّل فيديو قصير (15–60 ثانية).</small>
        </div>
        <div className="field">
          <label>أو رابط يوتيوب</label>
          <div className="input-group">
            <input dir="ltr" value={yt} onChange={(e) => setYt(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            <button type="button" className="btn btn-sm" onClick={addYoutube}>إضافة</button>
          </div>
        </div>
      </div>
      <div className="video-list">
        {videos.map((v, i) => (
          <div className="video-item" key={i}>
            {v.type === 'youtube' ? (
              <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" />
            ) : (
              <video src={v.url} muted preload="metadata" />
            )}
            <span className="video-badge">{v.type === 'youtube' ? '▶ YouTube' : '🎬 فيديو'}</span>
            <button type="button" onClick={() => onChange(videos.filter((_, k) => k !== i))} aria-label="حذف">×</button>
          </div>
        ))}
      </div>
    </>
  );
}

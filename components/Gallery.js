'use client';

import { useEffect, useState } from 'react';
import { thumb } from '@/lib/config';

// معرض المنتج: صور + فيديوهات (ملف أو يوتيوب). يستمع لاختيار المتغير لعرض صورته
export default function Gallery({ images = [], videos = [], alt }) {
  const items = [
    ...images.map((src) => ({ kind: 'image', src })),
    ...videos.map((v) => (v.type === 'youtube' ? { kind: 'youtube', id: v.id } : { kind: 'video', src: v.url, poster: v.poster || images[0] })),
  ];
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);

  // AddToCart يرسل صورة المتغير المختار
  useEffect(() => {
    const onVariant = (e) => {
      const i = images.indexOf(e.detail);
      if (i >= 0) {
        setActive(i);
        setPlaying(false);
      }
    };
    window.addEventListener('variant-image', onVariant);
    return () => window.removeEventListener('variant-image', onVariant);
  }, [images]);

  if (!items.length) return <div className="gallery"><div className="main" /></div>;
  const cur = items[Math.min(active, items.length - 1)];
  const select = (i) => {
    setActive(i);
    setPlaying(false);
  };

  return (
    <div className="gallery">
      <div className="main">
        {cur.kind === 'image' && <img src={cur.src} alt={alt} />}
        {cur.kind === 'video' && (
          <video key={cur.src} src={cur.src} poster={cur.poster} controls playsInline preload="metadata" />
        )}
        {cur.kind === 'youtube' &&
          (playing ? (
            <iframe
              key={cur.id}
              src={`https://www.youtube-nocookie.com/embed/${cur.id}?autoplay=1&rel=0&modestbranding=1`}
              title={alt}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            // واجهة خفيفة: يُحمَّل مشغّل يوتيوب فقط عند الضغط (أسرع وأخف على الخصوصية)
            <button type="button" className="yt-facade" onClick={() => setPlaying(true)} aria-label="تشغيل الفيديو">
              <img src={`https://i.ytimg.com/vi/${cur.id}/hqdefault.jpg`} alt="" />
              <span className="play-btn">▶</span>
            </button>
          ))}
      </div>
      {items.length > 1 && (
        <div className="thumbs">
          {items.map((it, i) => (
            <button key={i} type="button" className={i === active ? 'active' : ''} onClick={() => select(i)} aria-label={`${it.kind === 'image' ? 'صورة' : 'فيديو'} ${i + 1}`}>
              {it.kind === 'image' && <img src={thumb(it.src)} alt="" />}
              {it.kind === 'video' && (it.poster ? <img src={thumb(it.poster)} alt="" /> : <span className="thumb-video" />)}
              {it.kind === 'youtube' && <img src={`https://i.ytimg.com/vi/${it.id}/default.jpg`} alt="" />}
              {it.kind !== 'image' && <span className="thumb-play">▶</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

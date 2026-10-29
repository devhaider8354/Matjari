'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const INTERVAL_MS = 5000;
const VIDEO_INTERVAL_MS = 12000; // شرائح الفيديو تبقى أطول

// خلفية الشريحة: صورة، أو فيديو مرفوع (صامت ومتكرر)، أو يوتيوب
function SlideMedia({ slide, active, eager }) {
  const video = useRef(null);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (active) v.play().catch(() => {});
    else v.pause();
  }, [active]);

  if (slide.video) {
    return <video ref={video} src={slide.video} poster={slide.image || undefined} muted loop playsInline preload={eager ? 'auto' : 'metadata'} />;
  }
  if (slide.youtube) {
    // المشغّل يُحمَّل للشريحة الظاهرة فقط، والبقية تعرض صورة مصغرة
    return active ? (
      <div className="yt-bg">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${slide.youtube}?autoplay=1&mute=1&loop=1&playlist=${slide.youtube}&controls=0&modestbranding=1&playsinline=1&rel=0&disablekb=1`}
          title={slide.title || 'video'}
          allow="autoplay; encrypted-media"
          tabIndex={-1}
        />
      </div>
    ) : (
      <img src={slide.image || `https://i.ytimg.com/vi/${slide.youtube}/maxresdefault.jpg`} alt="" loading="lazy" />
    );
  }
  return <img src={slide.image} alt={slide.title || ''} loading={eager ? 'eager' : 'lazy'} />;
}

export default function Slider({ slides }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sign, setSign] = useState(1);
  const touchX = useRef(null);
  const count = slides.length;

  // اتجاه الصفحة: العربية RTL والإنجليزية LTR
  useEffect(() => setSign(document.documentElement.dir === 'ltr' ? -1 : 1), []);

  const go = (step) => setIndex((i) => (i + step + count) % count);

  // يُعاد ضبط المؤقت عند كل تغيير، فلا تقفز الشريحة مباشرة بعد ضغط المستخدم
  useEffect(() => {
    if (count < 2 || paused) return;
    const s = slides[index];
    const t = setTimeout(() => go(1), s?.video || s?.youtube ? VIDEO_INTERVAL_MS : INTERVAL_MS);
    return () => clearTimeout(t);
  }, [index, count, paused]);

  if (!count) return null;

  return (
    <section
      className="slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        // في العربية الشريحة التالية على اليسار فالسحب لليمين يُظهرها، وفي الإنجليزية العكس
        if (Math.abs(dx) > 40) go((dx > 0 ? 1 : -1) * sign);
        touchX.current = null;
      }}
    >
      {/* في RTL تُرتَّب الشرائح من اليمين فالإزاحة الموجبة تُظهر التالية، وفي LTR العكس */}
      <div className="track" style={{ transform: `translateX(${index * 100 * sign}%)` }}>
        {slides.map((s, i) => (
          <div className="slide" key={i} aria-hidden={i !== index}>
            <SlideMedia slide={s} active={i === index} eager={i === 0} />
            {(s.title || s.subtitle || s.buttonText) && (
              <div className="caption">
                {s.title && <h2>{s.title}</h2>}
                {s.subtitle && <p>{s.subtitle}</p>}
                {s.buttonText && s.link && (
                  <Link href={s.link} className="btn" tabIndex={i === index ? 0 : -1}>
                    {s.buttonText}
                  </Link>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button type="button" className="arrow prev" onClick={() => go(-1)} aria-label="السابق">›</button>
          <button type="button" className="arrow next" onClick={() => go(1)} aria-label="التالي">‹</button>
          <div className="dots">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={i === index ? 'active' : ''}
                onClick={() => setIndex(i)}
                aria-label={`الشريحة ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

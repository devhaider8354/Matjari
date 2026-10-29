'use client';

import { useEffect, useRef, useState } from 'react';

const STEP_MS = 1100;

// صور بطاقة المنتج تتبدّل تلقائياً:
// - بالماوس: عند الوقوف على البطاقة
// - باللمس (الجوال): عندما تقف البطاقة في منتصف الشاشة
// الصور الإضافية لا تُحمَّل إلا عند أول تفاعل (لا تبطئ الصفحة)
export default function CardImages({ images, alt }) {
  const ref = useRef(null);
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const many = images.length > 1;

  useEffect(() => {
    if (!many || !ref.current) return;
    const card = ref.current.closest('.product-card') || ref.current;
    const touch = window.matchMedia('(hover: none)').matches;
    if (!touch) {
      const on = () => setActive(true);
      const off = () => setActive(false);
      card.addEventListener('mouseenter', on);
      card.addEventListener('mouseleave', off);
      return () => {
        card.removeEventListener('mouseenter', on);
        card.removeEventListener('mouseleave', off);
      };
    }
    // الجوال: شريط في منتصف الشاشة، البطاقة التي تقف فيه تعرض صورها
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '-38% 0px -38% 0px' });
    io.observe(card);
    return () => io.disconnect();
  }, [many]);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    setLoaded(true);
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % images.length), STEP_MS);
    // على الماوس: الانتقال للصورة الثانية فوراً يعطي إحساساً بالاستجابة
    setIndex(1 % images.length);
    return () => clearInterval(t);
  }, [active, images.length]);

  return (
    <div ref={ref} className="card-images">
      {images.map((src, i) =>
        i === 0 || loaded ? (
          <img key={src} src={src} alt={i === 0 ? alt : ''} loading={i === 0 ? 'lazy' : 'eager'} className={i === index ? 'show' : ''} />
        ) : null
      )}
      {many && active && (
        <div className="card-dots">
          {images.map((_, i) => <span key={i} className={i === index ? 'on' : ''} />)}
        </div>
      )}
    </div>
  );
}

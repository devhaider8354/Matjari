'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const AUTO_SPEED = 0.35; // بكسل لكل إطار
const RESUME_AFTER = 4000; // استئناف الحركة بعد توقف تفاعل المستخدم

// شريط أقسام منزلق: أسهم يمين/يسار، سحب بالماوس أو الإصبع، وحركة تلقائية هادئة
// ذهاباً وإياباً تتوقف عند مرور المؤشر أو اللمس.
export default function CategoryNav({ items, homeLabel }) {
  const pathname = decodeURIComponent(usePathname());
  const track = useRef(null);
  const drag = useRef(null);
  const pausedUntil = useRef(0);
  const hovering = useRef(false);
  const dir = useRef(1);
  const [edges, setEdges] = useState({ start: false, end: false });

  // في RTL قيمة scrollLeft سالبة؛ نحوّلها لمسافة موجبة من البداية
  const metrics = useCallback(() => {
    const el = track.current;
    if (!el) return { pos: 0, max: 0, rtl: false };
    const rtl = getComputedStyle(el).direction === 'rtl';
    return { pos: Math.abs(el.scrollLeft), max: el.scrollWidth - el.clientWidth, rtl };
  }, []);

  const updateEdges = useCallback(() => {
    const { pos, max } = metrics();
    setEdges({ start: pos > 4, end: pos < max - 4 });
  }, [metrics]);

  const pause = () => {
    pausedUntil.current = Date.now() + RESUME_AFTER;
  };

  // step موجب = نحو نهاية القائمة
  const scrollByStep = (step, smooth = true) => {
    const el = track.current;
    if (!el) return;
    const { rtl } = metrics();
    el.scrollBy({ left: rtl ? -step : step, behavior: smooth ? 'smooth' : 'auto' });
  };

  const arrow = (toEnd) => {
    pause();
    scrollByStep((toEnd ? 1 : -1) * track.current.clientWidth * 0.7);
  };

  // حركة تلقائية ذهاباً وإياباً
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf;
    let carry = 0;
    const tick = () => {
      const { pos, max } = metrics();
      if (max > 8 && !hovering.current && !drag.current && Date.now() > pausedUntil.current) {
        if (pos >= max - 1) dir.current = -1;
        else if (pos <= 1) dir.current = 1;
        carry += AUTO_SPEED * dir.current;
        const whole = Math.trunc(carry);
        if (whole) {
          scrollByStep(whole, false);
          carry -= whole;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [metrics]);

  // إظهار القسم الحالي في المنتصف عند تغيير الصفحة
  useEffect(() => {
    const active = track.current?.querySelector('a.active');
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    pause();
    updateEdges();
  }, [pathname, updateEdges]);

  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [updateEdges]);

  // السحب بالماوس (اللمس يعمل تلقائياً عبر التمرير الأصلي)
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse') return pause();
    drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    track.current.scrollLeft = d.left - dx;
  };
  const endDrag = () => {
    if (drag.current) pause();
    setTimeout(() => (drag.current = null), 0);
  };
  // منع فتح الرابط إذا كان المستخدم يسحب
  const onClickCapture = (e) => {
    if (drag.current?.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname === href);

  return (
    <div className="cat-nav">
      <div className="container cat-slider">
        <button type="button" className={`cat-arrow start ${edges.start ? '' : 'hidden'}`} onClick={() => arrow(false)} aria-label="السابق">‹</button>
        <div
          ref={track}
          className={`cat-nav-inner ${edges.start ? 'fade-start' : ''} ${edges.end ? 'fade-end' : ''}`}
          onScroll={updateEdges}
          onMouseEnter={() => (hovering.current = true)}
          onMouseLeave={() => { hovering.current = false; endDrag(); }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onWheel={pause}
          onTouchStart={pause}
          onClickCapture={onClickCapture}
        >
          <Link href="/" className={isActive('/') ? 'active' : ''} draggable={false}>{homeLabel}</Link>
          {items.map((c) => {
            const href = `/category/${c.slug}`;
            return (
              <Link key={c.slug} href={`/category/${encodeURIComponent(c.slug)}`} className={isActive(href) ? 'active' : ''} draggable={false}>
                {c.icon} {c.name}
              </Link>
            );
          })}
        </div>
        <button type="button" className={`cat-arrow end ${edges.end ? '' : 'hidden'}`} onClick={() => arrow(true)} aria-label="التالي">›</button>
      </div>
    </div>
  );
}

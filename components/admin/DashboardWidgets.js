'use client';

import { useEffect, useRef, useState } from 'react';
import { formatMoney } from '@/lib/money';

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// رقم يعدّ تصاعدياً عند الظهور
export function CountUp({ value, money = false, duration = 1200 }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (reduced()) return setShown(value);
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setShown(value * easeOut(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{money ? formatMoney(shown) : Math.round(shown).toLocaleString('en-US')}</>;
}

// أعمدة المبيعات اليومية: تنمو عند التحميل، وتعرض التفاصيل عند المرور
export function SalesChart({ series }) {
  const [grown, setGrown] = useState(false);
  const [hover, setHover] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => setGrown(true), 80);
    return () => clearTimeout(t);
  }, []);
  const max = Math.max(1, ...series.map((s) => s.revenue));
  const active = hover ?? series.length - 1;

  return (
    <div>
      <div className="chart-tip">
        <strong>{formatMoney(series[active].revenue)}</strong>
        <span className="muted"> · {series[active].orders} طلب · {series[active].key}</span>
      </div>
      <div className="bar-chart" role="img" aria-label="مخطط المبيعات اليومية" onMouseLeave={() => setHover(null)}>
        {series.map((d, i) => (
          <div key={d.key} className={`bar-col ${i === active ? 'active' : ''}`} onMouseEnter={() => setHover(i)}>
            <div className="bar" style={{ height: grown ? `${Math.max(2, (d.revenue / max) * 100)}%` : '0%', transitionDelay: `${i * 35}ms` }} />
            <span>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// حلقة توزيع حالات الطلبات (conic-gradient) مع رسم تدريجي
export function StatusDonut({ data }) {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (reduced()) return setProgress(1);
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 1000);
      setProgress(easeOut(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  let acc = 0;
  const stops = data
    .map((d) => {
      const from = (acc / total) * 360 * progress;
      acc += d.count;
      const to = (acc / total) * 360 * progress;
      return `${d.color} ${from}deg ${to}deg`;
    })
    .join(', ');

  return (
    <div className="donut-wrap" ref={ref}>
      <div className="donut" style={{ background: `conic-gradient(${stops}, var(--border) 0deg)` }}>
        <div className="donut-hole">
          <strong>{data.reduce((s, d) => s + d.count, 0)}</strong>
          <small>طلب</small>
        </div>
      </div>
      <ul className="donut-legend">
        {data.map((d) => (
          <li key={d.key}><span style={{ background: d.color }} />{d.label}<strong>{d.count}</strong></li>
        ))}
      </ul>
    </div>
  );
}

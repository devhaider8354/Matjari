'use client';

import { useStore } from './StoreProvider';

export default function OrderSummary({ subtotal, shipping, children }) {
  const { t, money } = useStore();
  return (
    <div className="card">
      <h3>{t.summary}</h3>
      <div className="summary-row"><span>{t.subtotal}</span><span>{money(subtotal)}</span></div>
      <div className="summary-row"><span>{t.shipping}</span><span>{shipping === 0 ? t.free : money(shipping)}</span></div>
      <div className="summary-row total"><span>{t.total}</span><span>{money(subtotal + shipping)}</span></div>
      <p className="muted" style={{ fontSize: 14 }}>{t.payCash}</p>
      {children}
    </div>
  );
}

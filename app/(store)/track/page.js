'use client';

import { useState } from 'react';
import { useStore } from '@/components/StoreProvider';
import { formatDate } from '@/lib/config';
import { formatMoney } from '@/lib/money';

export default function TrackPage() {
  const { t, lang } = useStore();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setOrder(null);
    setLoading(true);
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(new FormData(e.currentTarget)), lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const money = (n) => formatMoney(n, order?.currency || undefined);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1>{t.trackTitle}</h1>
      <form className="card" onSubmit={submit} style={{ marginBottom: 18 }}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="field">
          <label htmlFor="number">{t.orderNo}</label>
          <input id="number" name="number" dir="ltr" required placeholder="261029-A1B2C3" />
        </div>
        <div className="field">
          <label htmlFor="phone">{t.orderPhone}</label>
          <input id="phone" name="phone" type="tel" dir="ltr" required />
        </div>
        <button className="btn btn-block" disabled={loading}>{loading ? t.searching : t.trackBtn}</button>
      </form>

      {order && (
        <div className="card fade-in">
          <div className="summary-row">
            <strong dir="ltr">{order.orderNumber}</strong>
            <span className={`status status-${order.status}`}>{order.statusLabel}</span>
          </div>
          <p className="muted" style={{ fontSize: 14 }}>{formatDate(order.createdAt)}</p>
          {order.items.map((i, idx) => (
            <div className="summary-row" key={idx}>
              <span>{i.name} × {i.qty}{i.variant && <span className="muted"> ({i.variant})</span>}</span>
              <span>{money(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="summary-row total"><span>{t.total}</span><span>{money(order.total)}</span></div>
          <a href={order.invoice} target="_blank" className="btn btn-outline btn-block" style={{ marginTop: 12 }}>🧾 {t.invoice}</a>
        </div>
      )}
    </div>
  );
}

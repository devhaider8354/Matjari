'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/CartProvider';
import OrderSummary from '@/components/OrderSummary';
import { useStore } from '@/components/StoreProvider';
import { shippingFor } from '@/lib/config';
import { translateError } from '@/lib/errorText';
import { BASE_CURRENCY } from '@/lib/money';
import { track } from '@/lib/track';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, ready, subtotal, clear } = useCart();
  const { t, lang, currency } = useStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // undefined = جاري التحقق، null = زائر
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    fetch('/api/account')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user || null))
      .catch(() => setUser(null));
  }, []);

  if (!ready || user === undefined) return null;
  if (!items.length) {
    return (
      <div className="empty">
        <h2>{t.cartEmpty}</h2>
        <Link href="/" className="btn">{t.browse}</Link>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { saveAddress, ...customer } = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          saveAddress: saveAddress === 'on',
          currency: currency.code,
          lang,
          items: items.map(({ productId, variantKey, qty }) => ({ productId, variantKey, qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      track('Purchase', { value: subtotal, currency: BASE_CURRENCY.code, quantity: items.reduce((s, i) => s + i.qty, 0) });
      clear();
      router.push(user ? `/account/orders/${data.orderNumber}` : `/order/${data.orderNumber}`);
    } catch (err) {
      setError(translateError(err.message, lang));
      setLoading(false);
    }
  }

  return (
    <>
      <h1>{t.checkout}</h1>
      {!user && (
        <div className="alert" style={{ background: 'var(--soft)', border: '1px solid var(--border)' }}>
          {t.haveAccount} <Link href="/login?next=/checkout"><u>{t.login}</u></Link> — {t.loginToFill}
        </div>
      )}
      <form onSubmit={submit} className="layout-2">
        <div className="card">
          <h3>{t.deliveryInfo}</h3>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="grid-2">
            <div className="field">
              <label htmlFor="name">{t.fullName} *</label>
              <input id="name" name="name" required maxLength={100} autoComplete="name" defaultValue={user?.name} />
            </div>
            <div className="field">
              <label htmlFor="phone">{t.phone} *</label>
              <input id="phone" name="phone" type="tel" dir="ltr" required minLength={7} maxLength={20} autoComplete="tel" defaultValue={user?.phone} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="city">{t.city} *</label>
            <input id="city" name="city" required maxLength={60} autoComplete="address-level2" defaultValue={user?.city} />
          </div>
          <div className="field">
            <label htmlFor="address">{t.address} *</label>
            <textarea id="address" name="address" rows={3} required maxLength={300} placeholder={t.addressHint} autoComplete="street-address" defaultValue={user?.address} />
          </div>
          <div className="field">
            <label htmlFor="email">{lang === 'en' ? 'Email (optional, for order updates)' : 'البريد الإلكتروني (اختياري، لإشعارات حالة الطلب)'}</label>
            <input id="email" name="email" type="email" dir="ltr" maxLength={120} autoComplete="email" defaultValue={user?.email} />
          </div>
          <div className="field">
            <label htmlFor="notes">{t.notes}</label>
            <textarea id="notes" name="notes" rows={2} maxLength={500} />
          </div>
          {user && (
            <label className="checkbox">
              <input type="checkbox" name="saveAddress" defaultChecked /> {t.saveAddress}
            </label>
          )}
        </div>
        <OrderSummary subtotal={subtotal} shipping={shippingFor(subtotal)}>
          <button className="btn btn-block" disabled={loading}>{loading ? t.sending : t.placeOrder}</button>
        </OrderSummary>
      </form>
    </>
  );
}

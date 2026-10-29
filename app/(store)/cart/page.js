'use client';

import Link from 'next/link';
import { lineKey, useCart } from '@/components/CartProvider';
import OrderSummary from '@/components/OrderSummary';
import { useStore } from '@/components/StoreProvider';
import { shippingFor, thumb } from '@/lib/config';

export default function CartPage() {
  const { items, ready, setQty, remove, subtotal } = useCart();
  const { t, money } = useStore();

  if (!ready) return null;
  if (!items.length) {
    return (
      <div className="empty">
        <div style={{ fontSize: 56 }}>🛒</div>
        <h2>{t.cartEmpty}</h2>
        <Link href="/" className="btn">{t.browse}</Link>
      </div>
    );
  }

  return (
    <>
      <h1>{t.cartTitle}</h1>
      <div className="layout-2">
        <div className="card">
          {items.map((item) => {
            const key = lineKey(item);
            return (
              <div className="cart-item" key={key}>
                {item.image ? <img src={thumb(item.image)} alt="" /> : <div />}
                <div>
                  <Link href={`/product/${item.productId}`}><strong>{item.name}</strong></Link>
                  {item.variantLabel && <div className="muted" style={{ fontSize: 14 }}>{item.variantLabel}</div>}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
                    <div className="qty">
                      <button type="button" onClick={() => setQty(key, item.qty - 1)} aria-label="-">−</button>
                      <span>{item.qty}</span>
                      <button type="button" onClick={() => setQty(key, item.qty + 1)} aria-label="+">+</button>
                    </div>
                    <button className="link-btn" onClick={() => remove(key)}>{t.remove}</button>
                  </div>
                </div>
                <strong>{money(item.price * item.qty)}</strong>
              </div>
            );
          })}
        </div>
        <OrderSummary subtotal={subtotal} shipping={shippingFor(subtotal)}>
          <Link href="/checkout" className="btn btn-block">{t.checkout}</Link>
        </OrderSummary>
      </div>
    </>
  );
}

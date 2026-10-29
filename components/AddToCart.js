'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BASE_CURRENCY } from '@/lib/money';
import { variantKey } from '@/lib/productTypes';
import { track } from '@/lib/track';
import { useCart } from './CartProvider';
import { useStore } from './StoreProvider';

export default function AddToCart({ product }) {
  const { add } = useCart();
  const { t, money } = useStore();
  const { options, variants } = product;
  // خيار بقيمة واحدة يُختار تلقائياً
  const [selected, setSelected] = useState(() => options.map((o) => (o.values.length === 1 ? o.values[0] : '')));
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState(null);

  const hasVariants = variants.length > 0;
  const complete = selected.every(Boolean);
  const variant = useMemo(
    () => (hasVariants && complete ? variants.find((v) => v.key === variantKey(selected)) : null),
    [hasVariants, complete, variants, selected]
  );

  // عند اختيار متغير له صورة خاصة: يعرضها المعرض
  useEffect(() => {
    if (variant?.image) window.dispatchEvent(new CustomEvent('variant-image', { detail: variant.image }));
  }, [variant]);

  // حدث تسويقي: مشاهدة منتج
  useEffect(() => {
    track('ViewContent', { id: product._id, name: product.name, value: product.price, currency: BASE_CURRENCY.code });
  }, [product._id, product.name, product.price]);

  const price = variant?.price ?? product.price;
  const comparePrice = variant ? variant.comparePrice : product.comparePrice;
  const stock = hasVariants ? (variant ? variant.stock : null) : product.stock;
  const out = hasVariants ? (variant ? variant.stock <= 0 : product.stock <= 0) : product.stock <= 0;
  const prices = variants.map((v) => v.price);
  const ranged = !variant && prices.length > 1 && Math.min(...prices) !== Math.max(...prices);

  // هل توجد تركيبة متوفرة بهذه القيمة مع بقية الاختيارات الحالية؟
  function available(optIndex, value) {
    return variants.some(
      (v) => v.stock > 0 && v.values[optIndex] === value && selected.every((s, i) => i === optIndex || !s || v.values[i] === s)
    );
  }

  function choose(i, value) {
    setSelected((s) => s.map((x, k) => (k === i ? (x === value ? '' : value) : x)));
    setQty(1);
    setMessage(null);
  }

  function handleAdd() {
    const missing = options.find((o, i) => !selected[i]);
    if (missing) return setMessage({ type: 'error', text: t.chooseOption(missing.name) });
    add({
      productId: product._id,
      variantKey: variant?.key || '',
      variantLabel: variant ? options.map((o, i) => `${o.name}: ${selected[i]}`).join(' · ') : '',
      name: product.name,
      price,
      image: variant?.image || product.image,
      qty,
    });
    track('AddToCart', { id: product._id, name: product.name, value: price * qty, currency: BASE_CURRENCY.code, quantity: qty });
    setMessage({ type: 'success', text: t.added });
  }

  return (
    <div>
      <p className="price product-price">
        {ranged && <small className="muted">{t.from} </small>}
        <bdi>{money(ranged ? Math.min(...prices) : price)}</bdi>
        {comparePrice && <span className="old-price">{money(comparePrice)}</span>}
        {comparePrice && <span className="save-badge">-{Math.round((1 - price / comparePrice) * 100)}%</span>}
      </p>
      <p className="muted">
        {stock == null ? t.cod : stock > 0 ? (stock <= 5 ? t.onlyLeft(stock) : `✓ ${t.inStock}`) : t.unavailable}
        {(variant?.sku || product.sku) && <> · {t.sku}: <span dir="ltr">{variant?.sku || product.sku}</span></>}
      </p>

      {options.map((o, i) => (
        <div key={o.name}>
          <strong>{o.name}{selected[i] && <span className="muted">: {selected[i]}</span>}</strong>
          <div className="options">
            {o.values.map((v) => {
              const ok = available(i, v);
              return (
                <button key={v} type="button" className={`option ${selected[i] === v ? 'active' : ''} ${ok ? '' : 'unavailable'}`} onClick={() => choose(i, v)} title={ok ? '' : t.outOfStock}>
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {out && !(hasVariants && !complete) ? (
        <button className="btn btn-block" disabled>{t.outOfStock}</button>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="qty">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="-">−</button>
            <span>{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(stock ?? 99, 99, q + 1))} aria-label="+">+</button>
          </div>
          <button className="btn" style={{ flex: 1 }} onClick={handleAdd}>{t.addToCart}</button>
        </div>
      )}

      {message && (
        <div className={`alert alert-${message.type}`} style={{ marginTop: 14 }}>
          {message.text}
          {message.type === 'success' && <> — <Link href="/cart"><u>{t.viewCart}</u></Link></>}
        </div>
      )}
    </div>
  );
}

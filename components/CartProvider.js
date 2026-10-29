'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'cart_v2';

// كل سطر في السلة يُميَّز بالمنتج + المتغير
export const lineKey = (i) => `${i.productId}|${i.variantKey || ''}`;
const clampQty = (n) => Math.max(1, Math.min(99, n));

export default function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved)) setItems(saved);
      localStorage.removeItem('cart_v1'); // سلة النسخة القديمة (قبل المتغيرات)
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = (item) =>
    setItems((prev) => {
      const key = lineKey(item);
      if (prev.some((p) => lineKey(p) === key)) {
        return prev.map((p) => (lineKey(p) === key ? { ...p, qty: clampQty(p.qty + item.qty) } : p));
      }
      return [...prev, { ...item, qty: clampQty(item.qty) }];
    });

  const setQty = (key, qty) =>
    setItems((prev) => prev.map((p) => (lineKey(p) === key ? { ...p, qty: clampQty(qty) } : p)));

  const remove = (key) => setItems((prev) => prev.filter((p) => lineKey(p) !== key));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, ready, add, setQty, remove, clear, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

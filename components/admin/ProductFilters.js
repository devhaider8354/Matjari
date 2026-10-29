'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import BarcodeScanner from './BarcodeScanner';

export default function ProductFilters({ base, categories, values }) {
  const router = useRouter();
  const [q, setQ] = useState(values.q);

  const go = (patch) => {
    const next = { ...values, q, ...patch };
    const params = new URLSearchParams(Object.entries(next).filter(([, v]) => v));
    router.push(`${base}?${params}`);
  };

  return (
    <div className="card filters">
      <form
        className="input-group"
        style={{ flex: 2, minWidth: 260 }}
        onSubmit={(e) => {
          e.preventDefault();
          go({});
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 الاسم، الماركة، SKU، أو امسح الباركود..." autoFocus />
        <button className="btn btn-sm">بحث</button>
        <BarcodeScanner onDetected={(code) => { setQ(code); go({ q: code }); }} label="📷" />
      </form>
      <select value={values.cat} onChange={(e) => go({ cat: e.target.value })}>
        <option value="">كل الأقسام</option>
        {categories.map((c) => (
          <optgroup key={c._id} label={c.name}>
            <option value={c._id}>{c.name}</option>
            {c.children.map((ch) => <option key={ch._id} value={ch._id}>↳ {ch.name}</option>)}
          </optgroup>
        ))}
      </select>
      <select value={values.stock} onChange={(e) => go({ stock: e.target.value })}>
        <option value="">كل المخزون</option>
        <option value="low">مخزون منخفض</option>
        <option value="out">نفد</option>
      </select>
      <select value={values.status} onChange={(e) => go({ status: e.target.value })}>
        <option value="">كل الحالات</option>
        <option value="active">ظاهر</option>
        <option value="hidden">مخفي</option>
        <option value="featured">مميز ⭐</option>
      </select>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ORDER_STATUSES } from '@/lib/config';

export default function StatusSelect({ orderId, status }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  if (status === 'cancelled') {
    return <span className="status status-cancelled">ملغي (أُعيد المخزون)</span>;
  }

  async function change(e) {
    const next = e.target.value;
    if (next === 'cancelled' && !confirm('إلغاء الطلب سيعيد الكميات للمخزون ولا يمكن التراجع عنه. متأكد؟')) return;
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'تعذّر تحديث الحالة');
      return;
    }
    setValue(next);
    router.refresh();
  }

  return (
    <select value={value} onChange={change} disabled={saving} style={{ width: 'auto' }}>
      {Object.entries(ORDER_STATUSES).map(([key, label]) => (
        <option key={key} value={key}>{label}</option>
      ))}
    </select>
  );
}

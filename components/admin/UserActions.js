'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

// تعطيل/تفعيل حساب وإنهاء جلساته
export default function UserActions({ id, disabled, isSelf = false }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (isSelf) return <span className="muted" style={{ fontSize: 13 }}>(أنت)</span>;

  async function patch(body, confirmText) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return alert(data.error || 'تعذّر التنفيذ');
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => patch({ logoutAll: true }, 'إنهاء كل جلسات هذا الحساب؟')}>
        إنهاء الجلسات
      </button>
      {disabled ? (
        <button className="btn btn-sm" disabled={busy} onClick={() => patch({ disabled: false })}>تفعيل الحساب</button>
      ) : (
        <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => patch({ disabled: true }, 'تعطيل الحساب سيمنعه من الدخول فوراً. متأكد؟')}>
          تعطيل الحساب
        </button>
      )}
    </div>
  );
}

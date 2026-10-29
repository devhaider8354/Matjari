'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sendJson } from './upload';

export default function ChangeEmailForm({ name, email }) {
  const router = useRouter();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setStatus(null);
    try {
      await sendJson('/api/account/email', 'POST', Object.fromEntries(new FormData(form)));
      form.querySelector('[name=currentPassword]').value = '';
      setStatus({ type: 'success', text: 'تم حفظ البريد والاسم. استخدم البريد الجديد في الدخول القادم.' });
      router.refresh();
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit}>
      {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}
      <div className="field">
        <label htmlFor="e-name">الاسم</label>
        <input id="e-name" name="name" defaultValue={name} required maxLength={100} />
      </div>
      <div className="field">
        <label htmlFor="e-email">البريد الإلكتروني (للدخول واستعادة كلمة المرور)</label>
        <input id="e-email" name="email" type="email" dir="ltr" defaultValue={email} required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="e-pass">كلمة المرور الحالية (للتأكيد)</label>
        <input id="e-pass" name="currentPassword" type="password" dir="ltr" required autoComplete="current-password" />
      </div>
      <button className="btn" disabled={busy}>{busy ? '...' : 'حفظ البريد والاسم'}</button>
    </form>
  );
}

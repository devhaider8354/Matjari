'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useStore } from '@/components/StoreProvider';
import { translateError } from '@/lib/errorText';

export default function ProfileForm({ user }) {
  const router = useRouter();
  const { t, lang } = useStore();
  const en = lang === 'en';
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const res = await fetch('/api/account', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    setStatus(res.ok ? { type: 'success', text: en ? 'Saved' : 'تم حفظ التغييرات' } : { type: 'error', text: translateError(data.error, lang) || 'Error' });
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={submit}>
      {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}
      <div className="grid-2">
        <div className="field">
          <label htmlFor="name">{t.fullName}</label>
          <input id="name" name="name" defaultValue={user.name} required maxLength={100} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" value={user.email} dir="ltr" disabled />
        </div>
        <div className="field">
          <label htmlFor="phone">{t.phone}</label>
          <input id="phone" name="phone" type="tel" dir="ltr" defaultValue={user.phone} />
        </div>
        <div className="field">
          <label htmlFor="city">{t.city}</label>
          <input id="city" name="city" defaultValue={user.city} maxLength={60} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="address">{t.address}</label>
        <textarea id="address" name="address" rows={3} defaultValue={user.address} maxLength={300} placeholder={t.addressHint} />
      </div>
      <button className="btn" disabled={saving}>{saving ? '...' : en ? 'Save' : 'حفظ'}</button>
    </form>
  );
}

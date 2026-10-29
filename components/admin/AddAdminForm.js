'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PermissionPicker from './PermissionPicker';
import { sendJson } from './upload';

export default function AddAdminForm({ allowOwner }) {
  const router = useRouter();
  const [permissions, setPermissions] = useState(['orders', 'customers']);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setStatus(null);
    try {
      await sendJson('/api/admin/users', 'POST', { ...Object.fromEntries(new FormData(form)), permissions });
      form.reset();
      setStatus({ type: 'success', text: 'تمت إضافة المدير. سيُطلب منه تغيير كلمة المرور عند أول دخول.' });
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
        <label htmlFor="a-name">الاسم</label>
        <input id="a-name" name="name" required maxLength={100} />
      </div>
      <div className="field">
        <label htmlFor="a-email">البريد الإلكتروني</label>
        <input id="a-email" name="email" type="email" dir="ltr" required autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="a-password">كلمة مرور مؤقتة</label>
        <input id="a-password" name="password" type="text" dir="ltr" required minLength={8} autoComplete="new-password" />
        <small>8 أحرف على الأقل، حروف وأرقام</small>
      </div>
      <div className="field">
        <label>الصلاحيات</label>
        <PermissionPicker value={permissions} onChange={setPermissions} allowOwner={allowOwner} />
      </div>
      <button className="btn btn-block" disabled={busy || !permissions.length}>{busy ? '...' : 'إضافة مدير'}</button>
    </form>
  );
}

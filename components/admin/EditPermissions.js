'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PermissionPicker from './PermissionPicker';
import { sendJson } from './upload';

// تعديل صلاحيات مدير موجود (يُنهي جلساته حتى تُطبَّق فوراً)
export default function EditPermissions({ id, initial, allowOwner }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await sendJson(`/api/admin/users/${id}`, 'PATCH', { permissions: value });
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
    setBusy(false);
  }

  if (!open) return <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(true)}>الصلاحيات</button>;
  return (
    <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <div className="modal card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h3 style={{ marginTop: 0 }}>تعديل الصلاحيات</h3>
        <PermissionPicker value={value} onChange={setValue} allowOwner={allowOwner} />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn" onClick={save} disabled={busy || !value.length}>{busy ? '...' : 'حفظ'}</button>
          <button className="btn btn-outline" onClick={() => setOpen(false)}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

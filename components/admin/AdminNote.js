'use client';

import { useState } from 'react';
import { sendJson } from './upload';

// ملاحظة لا يراها الزبون (مثل: تم الاتصال، مندوب التوصيل...)
export default function AdminNote({ orderId, initial }) {
  const [note, setNote] = useState(initial);
  const [state, setState] = useState('');

  async function save() {
    setState('...');
    try {
      await sendJson(`/api/admin/orders/${orderId}`, 'PATCH', { adminNote: note });
      setState('✓ حُفظت');
    } catch (err) {
      setState(err.message);
    }
  }

  return (
    <>
      <textarea rows={3} value={note} onChange={(e) => { setNote(e.target.value); setState(''); }} maxLength={1000} placeholder="لا تظهر للزبون" />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
        <button className="btn btn-sm" onClick={save}>حفظ</button>
        <span className="muted" style={{ fontSize: 13 }}>{state}</span>
      </div>
    </>
  );
}

'use client';

import { PERMISSIONS, ROLE_PRESETS } from '@/lib/permissions';

// اختيار صلاحيات مدير: أدوار جاهزة أو اختيار مخصص
export default function PermissionPicker({ value, onChange, allowOwner = true }) {
  const all = value.includes('*');
  const toggle = (p) => onChange(value.includes(p) ? value.filter((x) => x !== p) : [...value.filter((x) => x !== '*'), p]);

  return (
    <div className="perm-picker">
      <div className="chips" style={{ marginBottom: 8 }}>
        {Object.entries(ROLE_PRESETS)
          .filter(([k]) => k !== 'custom' && (allowOwner || k !== 'owner'))
          .map(([k, r]) => {
            const active = JSON.stringify([...r.permissions].sort()) === JSON.stringify([...value].sort());
            return (
              <button key={k} type="button" className={`chip ${active ? 'active' : ''}`} onClick={() => onChange(r.permissions)}>
                {r.label}
              </button>
            );
          })}
      </div>
      {Object.entries(PERMISSIONS).map(([k, p]) => (
        <label key={k} className="checkbox perm-row" title={p.hint}>
          <input type="checkbox" checked={all || value.includes(k)} disabled={all} onChange={() => toggle(k)} />
          <span>
            <strong>{p.label}</strong>
            <small className="muted"> — {p.hint}</small>
          </span>
        </label>
      ))}
    </div>
  );
}

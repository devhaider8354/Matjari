'use client';

import { useState } from 'react';
import { thumb } from '@/lib/config';

// اختيار صورة المتغير من صور المنتج
export default function VariantImagePicker({ images, value, onChange }) {
  const [open, setOpen] = useState(false);
  if (!images.length) return <span className="muted" style={{ fontSize: 12 }}>أضف صوراً أولاً</span>;
  return (
    <div className="vimg-picker">
      <button type="button" className="vimg-current" onClick={() => setOpen((o) => !o)} title="صورة المتغير">
        {value ? <img src={thumb(value)} alt="" /> : <span>—</span>}
      </button>
      {open && (
        <div className="vimg-menu">
          <button type="button" onClick={() => { onChange(''); setOpen(false); }}>بدون</button>
          {images.map((src) => (
            <button type="button" key={src} className={src === value ? 'active' : ''} onClick={() => { onChange(src); setOpen(false); }}>
              <img src={thumb(src)} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'];

// زر يفتح الكاميرا ويقرأ الباركود (BarcodeDetector في Chrome/Edge/أندرويد).
// قارئ الباركود USB يعمل كلوحة مفاتيح، فيكفي الكتابة في حقل البحث.
export default function BarcodeScanner({ onDetected, label = '📷 مسح', className = 'btn btn-outline btn-sm' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} title="مسح الباركود بالكاميرا">{label}</button>
      {open && <ScannerModal onClose={() => setOpen(false)} onDetected={(c) => { setOpen(false); onDetected(c); }} />}
    </>
  );
}

function ScannerModal({ onClose, onDetected }) {
  const video = useRef(null);
  const callback = useRef(onDetected);
  callback.current = onDetected;
  const [error, setError] = useState('');

  useEffect(() => {
    let stream;
    let stopped = false;
    async function start() {
      if (!('BarcodeDetector' in window)) {
        setError('المتصفح لا يدعم المسح بالكاميرا. استخدم Chrome على أندرويد أو قارئ باركود USB.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.current.srcObject = stream;
        await video.current.play();
        const supported = await window.BarcodeDetector.getSupportedFormats();
        const detector = new window.BarcodeDetector({ formats: FORMATS.filter((f) => supported.includes(f)) });
        const tick = async () => {
          if (stopped) return;
          try {
            const codes = await detector.detect(video.current);
            if (codes[0]?.rawValue) return callback.current(codes[0].rawValue.trim());
          } catch {}
          requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setError('تعذّر فتح الكاميرا. اسمح بالوصول للكاميرا (يتطلب HTTPS).');
      }
    }
    start();
    return () => {
      stopped = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <div className="page-head" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>مسح الباركود</h3>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>إغلاق</button>
        </div>
        {error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <div className="scanner-view">
            <video ref={video} playsInline muted />
            <div className="scanner-line" />
          </div>
        )}
      </div>
    </div>
  );
}

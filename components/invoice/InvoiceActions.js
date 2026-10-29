'use client';

import { useState } from 'react';

const PDF_FORMATS = { A4: [210, 297], A5: [148, 210], '80mm': [80, null], '58mm': [58, null] };

const COLOR_PROPS = ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color', 'text-decoration-color', 'fill', 'stroke'];

// html2canvas لا يفهم ألوان CSS الحديثة مثل color-mix() و color(srgb ...)،
// فنحوّلها إلى rgba برسم بكسل واحد وقراءته
function toRgba(value, ctx) {
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = '#000';
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
}

function normalizeColors(root) {
  const ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
  const win = root.ownerDocument.defaultView;
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const cs = win.getComputedStyle(el);
    for (const prop of COLOR_PROPS) {
      const v = cs.getPropertyValue(prop);
      if (v && /color\(|color-mix|oklch|oklab|lab\(|lch\(/.test(v)) el.style.setProperty(prop, toRgba(v, ctx));
    }
  }
}

// يحوّل الوصل إلى PDF في المتصفح (صورة عالية الدقة؛ يدعم العربية دون خطوط إضافية)
async function buildPdf(paperSize) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const el = document.querySelector('.invoice-doc');
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    onclone: (doc) => normalizeColors(doc.querySelector('.invoice-doc')),
  });
  const [w, fixedH] = PDF_FORMATS[paperSize] || PDF_FORMATS.A4;
  const imgH = (canvas.height * w) / canvas.width;
  const pageH = fixedH || imgH;
  const pdf = new jsPDF({ unit: 'mm', format: [w, pageH], orientation: 'portrait' });
  const img = canvas.toDataURL('image/jpeg', 0.92);
  // للفواتير الطويلة على A4/A5: تقسيم الصورة على عدة صفحات
  let y = 0;
  pdf.addImage(img, 'JPEG', 0, y, w, imgH);
  while (fixedH && imgH + y > pageH + 0.5) {
    y -= pageH;
    pdf.addPage([w, pageH]);
    pdf.addImage(img, 'JPEG', 0, y, w, imgH);
  }
  return pdf;
}

export default function InvoiceActions({ orderNumber, paperSize, sizes, shareUrl, phone, storeName, lang, total }) {
  const [busy, setBusy] = useState('');
  const en = lang === 'en';
  const fileName = `invoice-${orderNumber}.pdf`;
  const message = en
    ? `Hello, here is your invoice for order ${orderNumber} from ${storeName}. Total: ${total}\n${shareUrl}`
    : `مرحباً، هذه فاتورة طلبك رقم ${orderNumber} من ${storeName}.\nالإجمالي: ${total}\n${shareUrl}`;
  const waPhone = String(phone || '').replace(/\D/g, '').replace(/^0+/, '');

  async function download() {
    setBusy('pdf');
    try {
      (await buildPdf(paperSize)).save(fileName);
    } finally {
      setBusy('');
    }
  }

  // على الجوال: مشاركة ملف PDF مباشرة إلى واتساب. غير ذلك: رسالة واتساب برابط الوصل
  async function share() {
    setBusy('share');
    try {
      const blob = (await buildPdf(paperSize)).output('blob');
      const file = new File([blob], fileName, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: message });
        return;
      }
    } catch {
      // المستخدم ألغى المشاركة أو المتصفح لا يدعمها
    } finally {
      setBusy('');
    }
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  }

  function changeSize(size) {
    const url = new URL(window.location.href);
    url.searchParams.set('size', size);
    window.location.assign(url.toString());
  }

  return (
    <div className="invoice-toolbar no-print">
      <select value={paperSize} onChange={(e) => changeSize(e.target.value)} aria-label="paper size">
        {Object.entries(sizes).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
      </select>
      <button className="btn" onClick={() => window.print()}>🖨️ {en ? 'Print' : 'طباعة'}</button>
      <button className="btn btn-outline" onClick={download} disabled={!!busy}>{busy === 'pdf' ? '...' : `⬇️ PDF`}</button>
      <button className="btn wa-btn" onClick={share} disabled={!!busy}>{busy === 'share' ? '...' : `💬 ${en ? 'Share on WhatsApp' : 'مشاركة واتساب'}`}</button>
    </div>
  );
}

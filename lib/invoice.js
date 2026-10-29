import QRCode from 'qrcode';
import { appUrl } from './mail';
import { invoicePath } from './orderView';

// رابط الوصل الكامل + رمز QR بصيغة SVG
export async function invoiceLinkAndQr(orderNumber, accent = '#111827') {
  const url = `${appUrl()}${invoicePath(orderNumber)}`;
  const qrSvg = await QRCode.toString(url, { type: 'svg', margin: 0, width: 96, color: { dark: accent, light: '#ffffff' } });
  return { url, qrSvg };
}

export function pageCss(paper) {
  return `@page { size: ${paper.page}; margin: ${paper.thermal ? '2mm' : '10mm'}; }`;
}

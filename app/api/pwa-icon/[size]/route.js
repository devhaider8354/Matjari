import { readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { getSettings } from '@/lib/settings';
import { UPLOAD_DIR } from '@/lib/uploads';

// أيقونة التطبيق: من شعار المتجر إن وُجد، وإلا الحرف الأول من اسمه على لون المتجر
export async function GET(req, { params }) {
  const size = params.size === '512' ? 512 : 192;
  const maskable = req.nextUrl.searchParams.get('maskable') === '1';
  const { store, theme } = await getSettings();

  let logo = null;
  const m = /^\/api\/uploads\/([a-f0-9-]{36}\.webp)$/.exec(store.logo || '');
  if (m) logo = await readFile(path.join(UPLOAD_DIR, m[1])).catch(() => null);

  let png;
  if (logo) {
    // أيقونة maskable تحتاج هامشاً آمناً (المنطقة الوسطى 80%)
    const inner = Math.round(size * (maskable ? 0.62 : 0.84));
    const fg = await sharp(logo).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    png = await sharp({ create: { width: size, height: size, channels: 4, background: '#ffffff' } })
      .composite([{ input: fg, gravity: 'center' }])
      .png()
      .toBuffer();
  } else {
    const letter = (store.nameEn || store.nameAr || 'S').trim()[0].toUpperCase().replace(/[<>&"]/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="100%" height="100%" rx="${maskable ? 0 : size * 0.22}" fill="${theme.primary}"/><text x="50%" y="54%" font-family="Arial, sans-serif" font-weight="700" font-size="${size * 0.5}" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${letter}</text></svg>`;
    png = await sharp(Buffer.from(svg)).png().toBuffer();
  }
  return new Response(png, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' } });
}

import crypto from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { adminRoute } from '@/lib/session';
import { UPLOAD_DIR } from '@/lib/uploads';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_BYTES = 10 * 1024 * 1024;

// أقصى أبعاد حسب الاستخدام
const SIZES = { product: 1600, banner: 1920, category: 800 };

// كل صورة تُعاد معالجتها بالكامل: تدوير حسب EXIF، تصغير، تحويل إلى WebP،
// وحذف البيانات الوصفية (موقع GPS ونوع الجهاز). إعادة الترميز تُبطل أيضاً
// أي محتوى خبيث مخفي داخل ملف الصورة.
export const POST = adminRoute(async (req) => {
  const kind = SIZES[req.nextUrl.searchParams.get('kind')] ? req.nextUrl.searchParams.get('kind') : 'product';
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'لم يتم إرسال ملف' }, { status: 400 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'الصيغ المسموحة: JPG, PNG, WEBP, GIF, AVIF' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'الحد الأقصى للصورة 10MB' }, { status: 400 });

  const input = Buffer.from(await file.arrayBuffer());
  const id = crypto.randomUUID();
  const animated = file.type === 'image/gif';
  let main;
  let small;
  try {
    const base = () => sharp(input, { animated, limitInputPixels: 40_000_000 }).rotate();
    const max = SIZES[kind];
    main = await base().resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80, effort: 4 }).toBuffer({ resolveWithObject: true });
    // الصورة المصغّرة للبطاقات تُقص بقياس موحّد 600×750 (4:5) مع التركيز على الجزء المهم
    small = await base().resize({ width: 600, height: 750, fit: 'cover', position: sharp.strategy.attention }).webp({ quality: 75, effort: 4 }).toBuffer();
  } catch {
    return NextResponse.json({ error: 'الملف ليس صورة صالحة' }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, `${id}.webp`), main.data);
  await writeFile(path.join(UPLOAD_DIR, `${id}-sm.webp`), small);

  return NextResponse.json({
    url: `/api/uploads/${id}.webp`,
    width: main.info.width,
    height: main.info.height,
    originalKB: Math.round(file.size / 1024),
    sizeKB: Math.round(main.data.length / 1024),
  });
}, ['catalog', 'content']);

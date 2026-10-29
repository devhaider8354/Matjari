import crypto from 'crypto';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { NextResponse } from 'next/server';
import { adminRoute } from '@/lib/session';
import { UPLOAD_DIR } from '@/lib/uploads';

// رفع فيديو أو صوت. الصيغة تُحدَّد من توقيع الملف الحقيقي، لا من نوعه الذي يرسله المتصفح
// (ويندوز كثيراً ما يرسل نوعاً فارغاً أو غير معتاد لملفات الصوت)
const MAX_MB = { video: 100, audio: 25 };

function detect(head, file) {
  const ascii = (a, b) => head.subarray(a, b).toString('latin1');
  const hint = `${file.type} ${file.name}`.toLowerCase();
  const audioHint = /audio|\.(m4a|mp3|aac|ogg|oga|wav|flac|weba)\b/.test(hint);
  if (ascii(4, 8) === 'ftyp') {
    return audioHint || ascii(8, 11) === 'M4A' ? { ext: 'm4a', kind: 'audio' } : { ext: 'mp4', kind: 'video' };
  }
  if (head.readUInt32BE(0) === 0x1a45dfa3) return audioHint ? { ext: 'weba', kind: 'audio' } : { ext: 'webm', kind: 'video' };
  if (ascii(0, 3) === 'ID3') return { ext: 'mp3', kind: 'audio' };
  if (head[0] === 0xff && (head[1] & 0xf0) === 0xf0 && (head[1] & 0x06) === 0) return { ext: 'aac', kind: 'audio' }; // ADTS
  if (head[0] === 0xff && (head[1] & 0xe0) === 0xe0) return { ext: 'mp3', kind: 'audio' };
  if (ascii(0, 4) === 'OggS') return { ext: 'ogg', kind: 'audio' };
  if (ascii(0, 4) === 'fLaC') return { ext: 'flac', kind: 'audio' };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE') return { ext: 'wav', kind: 'audio' };
  return null;
}

export const POST = adminRoute(async (req) => {
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'لم يتم إرسال ملف' }, { status: 400 });

  const head = Buffer.from(await file.slice(0, 16).arrayBuffer());
  const spec = head.length >= 12 ? detect(head, file) : null;
  if (!spec) {
    return NextResponse.json({ error: 'صيغة غير مدعومة أو ملف تالف. المسموح: فيديو MP4/WEBM أو صوت MP3/M4A/AAC/OGG/WAV/FLAC' }, { status: 400 });
  }
  const max = MAX_MB[spec.kind];
  if (file.size > max * 1024 * 1024) {
    return NextResponse.json({ error: `الحد الأقصى ${max}MB (حجم الملف ${(file.size / 1048576).toFixed(1)}MB)` }, { status: 400 });
  }

  const name = `${crypto.randomUUID()}.${spec.ext}`;
  const dir = path.join(UPLOAD_DIR, 'media');
  await mkdir(dir, { recursive: true });
  // كتابة تدفقية إلى القرص بدل تحميل الملف كله في الذاكرة مرة ثانية
  await pipeline(Readable.fromWeb(file.stream()), createWriteStream(path.join(dir, name)));
  return NextResponse.json({ url: `/api/media/${name}`, kind: spec.kind, sizeMB: +(file.size / 1048576).toFixed(1) });
}, ['catalog', 'content']);

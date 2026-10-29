import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { UPLOAD_DIR } from '@/lib/uploads';

const MIME = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  aac: 'audio/aac',
  flac: 'audio/flac',
  weba: 'audio/webm',
};

// بث الفيديو والصوت مع دعم Range: يسمح بالتقديم في الفيديو وتشغيله قبل اكتمال تنزيله
export async function GET(req, { params }) {
  const m = /^[a-f0-9-]{36}\.(mp4|webm|mp3|ogg|m4a|wav|aac|flac|weba)$/.exec(params.name);
  if (!m) return new Response('Not found', { status: 404 });
  const file = path.join(UPLOAD_DIR, 'media', params.name);
  let size;
  try {
    size = (await stat(file)).size;
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const headers = {
    'Content-Type': MIME[m[1]],
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  };
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') || '');
  if (!range) {
    return new Response(Readable.toWeb(createReadStream(file)), { headers: { ...headers, 'Content-Length': String(size) } });
  }
  let start = range[1] ? parseInt(range[1], 10) : size - parseInt(range[2], 10);
  let end = range[1] && range[2] ? parseInt(range[2], 10) : size - 1;
  end = Math.min(end, size - 1, start + 4 * 1024 * 1024 - 1); // قطع حتى 4MB
  if (!(start >= 0 && start <= end)) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }
  return new Response(Readable.toWeb(createReadStream(file, { start, end })), {
    status: 206,
    headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1) },
  });
}

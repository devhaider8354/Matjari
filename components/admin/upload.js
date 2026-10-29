'use client';

// يرفع صورة واحدة؛ الخادم يضغطها ويحوّلها إلى WebP. kind: product | banner | category
export async function uploadImage(file, kind = 'product') {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`/api/admin/upload?kind=${kind}`, { method: 'POST', body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${file.name}: ${data.error || 'فشل الرفع'}`);
  return data;
}

// رفع فيديو أو صوت مع شريط تقدّم (onProgress: 0..100)
export function uploadMedia(file, onProgress) {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/media');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data.error || (xhr.status === 413 ? 'الملف أكبر من المسموح في إعدادات السيرفر' : 'فشل الرفع')));
    };
    xhr.onerror = () => reject(new Error('انقطع الاتصال أثناء الرفع'));
    xhr.send(body);
  });
}

// الامتدادات مع الأنواع: ويندوز يخفي في نافذة الاختيار الملفات التي لا يعرف نوعها
export const ACCEPT_VIDEO = 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v';
export const ACCEPT_AUDIO = 'audio/*,.mp3,.m4a,.aac,.ogg,.oga,.wav,.flac,.weba';

export const ACCEPT_IMAGES ='image/jpeg,image/png,image/webp,image/gif,image/avif';

export async function sendJson(url, method, body) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'تعذّر التنفيذ');
  return data;
}

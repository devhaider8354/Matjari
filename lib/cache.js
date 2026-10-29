import { revalidateTag, unstable_cache } from 'next/cache';

// تخزين مؤقت لبيانات المتجر: تُقرأ من قاعدة البيانات مرة كل فترة بدل كل زيارة.
// أي تعديل من لوحة التحكم يمسح الذاكرة المؤقتة فوراً (انظر adminRoute).
export const TAGS = ['settings', 'catalog', 'currencies', 'blog'];

export function cached(fn, key, { tags, revalidate = 120 }) {
  return unstable_cache(fn, key, { tags, revalidate });
}

export function invalidateAll() {
  for (const t of TAGS) revalidateTag(t);
}

export function invalidate(...tags) {
  for (const t of tags) revalidateTag(t);
}

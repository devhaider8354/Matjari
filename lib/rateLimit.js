// حدّ عدد المحاولات. مع REDIS_URL يُحفظ في Redis (يبقى بعد إعادة التشغيل ويعمل
// مع عدة نسخ من التطبيق)، وبدونه يُحفظ في ذاكرة التطبيق.
import { getRedis } from './redis';

const buckets = new Map();

function memoryLimit(key, limit, windowMs) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true };
}

// نافذة ثابتة في Redis: عدّاد ينتهي مع نهاية النافذة
async function redisLimit(redis, key, limit, windowMs) {
  const k = `rl:${key}`;
  const count = await redis.incr(k);
  if (count === 1) await redis.pexpire(k, windowMs);
  if (count > limit) {
    const ttl = await redis.pttl(k);
    return { ok: false, retryAfter: Math.ceil(Math.max(ttl, 1000) / 1000) };
  }
  return { ok: true };
}

export async function rateLimit(key, limit, windowMs) {
  const redis = getRedis();
  if (redis) {
    try {
      return await redisLimit(redis, key, limit, windowMs);
    } catch (e) {
      console.error('redis rate limit failed, using memory:', e.message);
    }
  }
  return memoryLimit(key, limit, windowMs);
}

// تنظيف دوري حتى لا تكبر الذاكرة
setInterval(() => {
  const now = Date.now();
  for (const [key, hits] of buckets) {
    if (!hits.length || now - hits[hits.length - 1] > 60 * 60 * 1000) buckets.delete(key);
  }
}, 10 * 60 * 1000).unref?.();

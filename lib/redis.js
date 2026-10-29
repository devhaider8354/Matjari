import Redis from 'ioredis';

// اتصال Redis اختياري (REDIS_URL مثل redis://127.0.0.1:6379). بدونه ترجع null
let client;
export function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!client) {
    client = global._redis || new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, enableOfflineQueue: false, lazyConnect: false });
    client.on('error', (e) => console.error('redis:', e.message));
    global._redis = client;
  }
  return client.status === 'ready' ? client : null;
}

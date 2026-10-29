import mongoose from 'mongoose';

// اتصال واحد مشترك يُعاد استخدامه بين الطلبات (وبين إعادة التحميل في وضع التطوير)
const cached = global._mongoose || (global._mongoose = { conn: null, promise: null });

export async function dbConnect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI غير معرّف في ملف البيئة');
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

// يحوّل مستندات Mongoose إلى كائنات عادية يمكن تمريرها لمكونات العميل
export const plain = (doc) => JSON.parse(JSON.stringify(doc));

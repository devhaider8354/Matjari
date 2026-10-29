import { SignJWT, jwtVerify } from 'jose';

// يعمل في middleware (Edge) وفي الخادم، لذلك لا يستورد أي مكتبة خاصة بـ Node
export const SESSION_COOKIE = 'session';

// جلسة المدير أقصر من جلسة الزبون
export const SESSION_TTL = { admin: 60 * 60 * 12, customer: 60 * 60 * 24 * 30 };

const secretKey = () => new TextEncoder().encode(process.env.JWT_SECRET || '');

export function authConfigured() {
  return (process.env.JWT_SECRET || '').length >= 32;
}

async function verifyJwt(token) {
  if (!token || !authConfigured()) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    return payload.sub ? payload : null;
  } catch {
    return null;
  }
}

export async function signSession(user) {
  return new SignJWT({ role: user.role, tv: user.tokenVersion || 0 })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user._id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL[user.role] || SESSION_TTL.customer}s`)
    .sign(secretKey());
}

// يرجع { sub, role, tv } أو null. التذاكر المؤقتة (purpose) لا تُقبل كجلسة
export async function verifySession(token) {
  const p = await verifyJwt(token);
  return p && !p.purpose ? p : null;
}

// تذكرة قصيرة (5 دقائق) بين خطوة كلمة المرور وخطوة رمز التحقق بخطوتين
export async function signTwoFactorTicket(user) {
  return new SignJWT({ purpose: '2fa', tv: user.tokenVersion || 0 })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user._id))
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(secretKey());
}

export async function verifyTwoFactorTicket(token) {
  const p = await verifyJwt(token);
  return p?.purpose === '2fa' ? p : null;
}

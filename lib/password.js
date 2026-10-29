import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const ROUNDS = 12;

export const hashPassword = (plain) => bcrypt.hash(plain, ROUNDS);
// بصمة غير صالحة (مثل حسابات تجريبية مقفلة) تعني فشل الدخول، وليس خطأ في الخادم
export const verifyPassword = (plain, hash) => bcrypt.compare(String(plain || ''), hash || '').catch(() => false);

// بصمة ثابتة لمقارنة وهمية عند عدم وجود الحساب، حتى لا يكشف التوقيت وجود البريد
export const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', ROUNDS);

export function passwordError(pw) {
  const p = String(pw || '');
  if (p.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
  if (p.length > 128) return 'كلمة المرور طويلة جداً';
  if (!/[A-Za-z؀-ۿ]/.test(p) || !/\d/.test(p)) return 'كلمة المرور يجب أن تحتوي على حروف وأرقام';
  return null;
}

export function newResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: hashToken(token) };
}

export const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const normalizeEmail = (e) => String(e || '').trim().toLowerCase().slice(0, 254);

// ترجمة رسائل الخادم (العربية) إلى الإنجليزية في واجهة المتجر الإنجليزية
const EXACT = {
  'البريد الإلكتروني أو كلمة المرور غير صحيحة': 'Incorrect email or password',
  'أدخل البريد الإلكتروني وكلمة المرور': 'Enter your email and password',
  'هذا الحساب معطّل': 'This account is disabled',
  'الاسم مطلوب': 'Name is required',
  'البريد الإلكتروني غير صالح': 'Invalid email address',
  'رقم الهاتف غير صالح': 'Invalid phone number',
  'هذا البريد مسجّل مسبقاً، سجّل الدخول أو استعد كلمة المرور': 'This email is already registered. Sign in or reset your password',
  'محاولات تسجيل كثيرة، حاول لاحقاً': 'Too many sign-up attempts, try again later',
  'أدخل البريد الإلكتروني': 'Enter your email',
  'طلبات كثيرة، حاول بعد ساعة': 'Too many requests, try again in an hour',
  'إذا كان البريد مسجّلاً لدينا فستصلك رسالة فيها رابط الاستعادة خلال دقائق.': 'If this email is registered, you will receive a reset link within minutes.',
  'محاولات كثيرة، حاول لاحقاً': 'Too many attempts, try again later',
  'رابط غير صالح': 'Invalid link',
  'الرابط غير صالح أو انتهت صلاحيته، اطلب رابطاً جديداً': 'This link is invalid or expired. Request a new one',
  'كلمة المرور يجب أن تكون 8 أحرف على الأقل': 'Password must be at least 8 characters',
  'كلمة المرور طويلة جداً': 'Password is too long',
  'كلمة المرور يجب أن تحتوي على حروف وأرقام': 'Password must contain letters and numbers',
  'كلمة المرور الحالية غير صحيحة': 'Current password is incorrect',
  'اختر كلمة مرور مختلفة عن الحالية': 'Choose a password different from the current one',
  'سجّل الدخول أولاً': 'Please sign in first',
  'طلب غير صالح': 'Invalid request',
  'يرجى تعبئة جميع الحقول المطلوبة': 'Please fill in all required fields',
  'السلة فارغة': 'Your cart is empty',
  'أحد المنتجات لم يعد متوفراً، يرجى تحديث السلة': 'A product is no longer available, please update your cart',
  'تعذّر إنشاء الطلب، حاول مرة أخرى': 'Could not place the order, please try again',
  'عدد كبير من الطلبات، حاول لاحقاً أو تواصل معنا': 'Too many orders, try again later or contact us',
  'مصدر الطلب غير مسموح': 'Request origin not allowed',
};

const PATTERNS = [
  [/^الحساب مقفل مؤقتاً بسبب محاولات خاطئة، حاول بعد (\d+) دقيقة$/, (m) => `Account temporarily locked after failed attempts. Try again in ${m[1]} min`],
  [/^محاولات كثيرة، حاول بعد (\d+) دقيقة$/, (m) => `Too many attempts. Try again in ${m[1]} min`],
  [/^اختر خيارات صحيحة لـ "(.+)"$/, (m) => `Please choose valid options for "${m[1]}"`],
  [/^الكمية المطلوبة من "(.+)" غير متوفرة حالياً$/, (m) => `The requested quantity of "${m[1]}" is not available`],
];

export function translateError(text, lang) {
  if (lang !== 'en' || !text) return text;
  if (EXACT[text]) return EXACT[text];
  for (const [re, fn] of PATTERNS) {
    const m = re.exec(text);
    if (m) return fn(m);
  }
  return text;
}

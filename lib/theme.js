// أدوات الثيم: تُستخدم في الخادم (حقن الألوان) وفي محرر المظهر (المعاينة)
export const DEFAULT_THEME = {
  primary: '#111827',
  accent: '#e11d48',
  bg: '#f7f7f8',
  card: '#ffffff',
  text: '#1f2330',
  radius: 14,
};

export const THEME_FIELDS = [
  { key: 'primary', label: 'اللون الأساسي (الأزرار والهيدر)' },
  { key: 'accent', label: 'لون التمييز (الخصومات والتنبيهات)' },
  { key: 'bg', label: 'خلفية الصفحة' },
  { key: 'card', label: 'خلفية البطاقات' },
  { key: 'text', label: 'لون النص' },
];

export const THEME_PRESETS = [
  { name: 'كلاسيك', theme: DEFAULT_THEME },
  { name: 'أزرق', theme: { primary: '#1d4ed8', accent: '#f59e0b', bg: '#f1f5f9', card: '#ffffff', text: '#0f172a', radius: 12 } },
  { name: 'أخضر', theme: { primary: '#047857', accent: '#dc2626', bg: '#f0fdf4', card: '#ffffff', text: '#14261c', radius: 16 } },
  { name: 'وردي', theme: { primary: '#be185d', accent: '#7c3aed', bg: '#fdf2f8', card: '#ffffff', text: '#3b0a24', radius: 20 } },
  { name: 'ذهبي', theme: { primary: '#78350f', accent: '#d97706', bg: '#fffbeb', card: '#ffffff', text: '#292524', radius: 6 } },
  { name: 'داكن', theme: { primary: '#f59e0b', accent: '#ef4444', bg: '#0b0f19', card: '#151b2b', text: '#e5e7eb', radius: 14 } },
];

const HEX = /^#[0-9a-f]{6}$/i;

// لون نص مقروء (أبيض أو داكن) فوق خلفية معيّنة
export function readableOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 160 ? '#111827' : '#ffffff';
}

export function themeVars(t) {
  return {
    '--primary': t.primary,
    '--primary-text': readableOn(t.primary),
    '--accent': t.accent,
    '--accent-text': readableOn(t.accent),
    '--bg': t.bg,
    '--card': t.card,
    '--text': t.text,
    '--radius': `${t.radius}px`,
    // تُعاد هنا لأن المتغيرات المشتقة تُحسب حيث تُعرَّف، والمعاينة في اللوحة تحتاجها محلياً
    '--muted': `color-mix(in srgb, ${t.text} 60%, ${t.card})`,
    '--border': `color-mix(in srgb, ${t.text} 12%, ${t.card})`,
    '--soft': `color-mix(in srgb, ${t.text} 5%, ${t.card})`,
    '--placeholder': `color-mix(in srgb, ${t.text} 8%, ${t.bg})`,
  };
}

// html:root يتفوق على قيم globals.css بغض النظر عن ترتيب تحميل الملفات
export function themeCss(t) {
  const vars = Object.entries(themeVars(t)).map(([k, v]) => `${k}:${v}`).join(';');
  return `html:root{${vars}}`;
}

export function parseTheme(b = {}) {
  const theme = {};
  for (const { key } of THEME_FIELDS) {
    const v = String(b[key] || '').trim();
    if (!HEX.test(v)) return { error: 'لون غير صالح' };
    theme[key] = v.toLowerCase();
  }
  const radius = parseInt(b.radius, 10);
  theme.radius = Number.isFinite(radius) ? Math.min(28, Math.max(0, radius)) : DEFAULT_THEME.radius;
  return { theme };
}

// تنسيق المبالغ بأي عملة. آمن للمتصفح والخادم.
// العملة الأساسية: الأسعار تُدخل بها في لوحة التحكم.
export const BASE_CURRENCY = {
  code: (process.env.NEXT_PUBLIC_CURRENCY_CODE || 'USD').toUpperCase(),
  symbol: process.env.NEXT_PUBLIC_CURRENCY || '$',
  nameAr: process.env.NEXT_PUBLIC_CURRENCY_NAME || 'العملة الأساسية',
  nameEn: process.env.NEXT_PUBLIC_CURRENCY_CODE || 'Base currency',
  rate: 1,
  decimals: Number(process.env.NEXT_PUBLIC_CURRENCY_DECIMALS ?? 2),
  symbolFirst: false,
  base: true,
};

// amount بالعملة الأساسية ← نص منسّق بالعملة المختارة
export function formatMoney(amount, cur = BASE_CURRENCY) {
  const c = cur || BASE_CURRENCY;
  const value = Number(amount || 0) * (c.rate || 1);
  const text = value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: c.decimals ?? 2,
  });
  return c.symbolFirst ? `${c.symbol}${text}` : `${text} ${c.symbol}`;
}

// قائمة جاهزة يضيفها المدير بضغطة (الأسعار تقريبية ويجب تحديثها)
export const CURRENCY_PRESETS = [
  { code: 'USD', nameAr: 'دولار أمريكي', nameEn: 'US Dollar', symbol: '$', decimals: 2, symbolFirst: true },
  { code: 'EUR', nameAr: 'يورو', nameEn: 'Euro', symbol: '€', decimals: 2, symbolFirst: true },
  { code: 'IQD', nameAr: 'دينار عراقي', nameEn: 'Iraqi Dinar', symbol: 'د.ع', decimals: 0 },
  { code: 'SAR', nameAr: 'ريال سعودي', nameEn: 'Saudi Riyal', symbol: 'ر.س', decimals: 2 },
  { code: 'AED', nameAr: 'درهم إماراتي', nameEn: 'UAE Dirham', symbol: 'د.إ', decimals: 2 },
  { code: 'KWD', nameAr: 'دينار كويتي', nameEn: 'Kuwaiti Dinar', symbol: 'د.ك', decimals: 3 },
  { code: 'QAR', nameAr: 'ريال قطري', nameEn: 'Qatari Riyal', symbol: 'ر.ق', decimals: 2 },
  { code: 'JOD', nameAr: 'دينار أردني', nameEn: 'Jordanian Dinar', symbol: 'د.أ', decimals: 3 },
  { code: 'EGP', nameAr: 'جنيه مصري', nameEn: 'Egyptian Pound', symbol: 'ج.م', decimals: 2 },
  { code: 'TRY', nameAr: 'ليرة تركية', nameEn: 'Turkish Lira', symbol: '₺', decimals: 2, symbolFirst: true },
  { code: 'GBP', nameAr: 'جنيه إسترليني', nameEn: 'British Pound', symbol: '£', decimals: 2, symbolFirst: true },
];

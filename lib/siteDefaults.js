// القيم الافتراضية وقوائم الإعدادات (آمنة للمتصفح والخادم)

export const DEFAULT_STORE = {
  nameAr: process.env.NEXT_PUBLIC_STORE_NAME || 'متجري',
  nameEn: process.env.NEXT_PUBLIC_STORE_NAME_EN || 'My Store',
  taglineAr: 'تسوّق براحتك، وادفع عند الاستلام',
  taglineEn: 'Shop with ease, pay on delivery',
  logo: '',
  phone: '',
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP || '').replace(/\D/g, ''),
  email: '',
  addressAr: '',
  addressEn: '',
};

export const DEFAULT_SEO = {
  titleAr: '',
  titleEn: '',
  descriptionAr: '',
  descriptionEn: '',
  keywords: [],
  ogImage: '',
  googleVerification: '',
  gaId: '',
};

// أكواد التتبع الإعلانية (أرقام فقط تُحقن في الصفحة)
export const DEFAULT_MARKETING = { fbPixelId: '', tiktokPixelId: '' };

// موسيقى خلفية للمتجر: تبدأ بعد أول تفاعل للزائر (المتصفحات تمنع الصوت التلقائي)
export const DEFAULT_MUSIC = { enabled: false, autoplay: true, volume: 0.35, shuffle: false, tracks: [] };

export const SOCIAL_PLATFORMS = {
  facebook: { label: 'Facebook', color: '#1877f2', short: 'f' },
  instagram: { label: 'Instagram', color: '#e4405f', short: 'IG' },
  tiktok: { label: 'TikTok', color: '#111111', short: '♪' },
  x: { label: 'X (Twitter)', color: '#000000', short: '𝕏' },
  youtube: { label: 'YouTube', color: '#ff0000', short: '▶' },
  snapchat: { label: 'Snapchat', color: '#f7d400', short: '👻' },
  telegram: { label: 'Telegram', color: '#229ed9', short: '✈' },
  whatsapp: { label: 'WhatsApp', color: '#25d366', short: 'W' },
  linkedin: { label: 'LinkedIn', color: '#0a66c2', short: 'in' },
  pinterest: { label: 'Pinterest', color: '#e60023', short: 'P' },
  website: { label: 'موقع آخر', color: '#475569', short: '🔗' },
};

export const PAPER_SIZES = {
  A4: { label: 'A4 (210×297mm)', width: '210mm', page: 'A4', thermal: false },
  A5: { label: 'A5 (148×210mm)', width: '148mm', page: 'A5', thermal: false },
  '80mm': { label: 'طابعة حرارية 80mm', width: '80mm', page: '80mm auto', thermal: true },
  '58mm': { label: 'طابعة حرارية 58mm', width: '58mm', page: '58mm auto', thermal: true },
};

export const DEFAULT_INVOICE = {
  paperSize: 'A4',
  accent: '#2563eb',
  fontSize: 'md', // sm | md | lg
  titleAr: 'فاتورة',
  titleEn: 'Invoice',
  showLogo: true,
  showQr: true,
  showSku: true,
  showCustomer: true,
  showStoreContact: true,
  showNotes: true,
  headerNote: '',
  footerNote: 'شكراً لتسوقكم معنا ❤',
  terms: 'الاستبدال خلال 7 أيام بشرط سلامة المنتج والفاتورة.',
};

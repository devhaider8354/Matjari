import { combinations, PRODUCT_TYPES, variantKey } from './productTypes';

const str = (v, max) => String(v ?? '').trim().slice(0, max);

const list = (v, maxItems = 30, maxLen = 60) =>
  [...new Set((Array.isArray(v) ? v : String(v || '').split(',')).map((s) => str(s, maxLen)).filter(Boolean))].slice(0, maxItems);

const num = (v) => {
  const n = Number(v);
  return v === '' || v == null || !Number.isFinite(n) ? null : n;
};

// رموز SKU والباركود: حروف لاتينية وأرقام وشرطات فقط
const code = (v) => str(v, 64).replace(/\s+/g, '').toUpperCase();
const CODE_RE = /^[A-Z0-9._-]*$/;

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isImageUrl = (u) => u.startsWith('/api/uploads/') || /^https?:\/\//.test(u);

// slug يدعم العربية: "عطور رجالية" ← "عطور-رجالية"
export function slugify(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function parseCategory(b) {
  const name = str(b.name, 80);
  if (!name) return { error: 'اسم القسم مطلوب' };
  const image = str(b.image, 300);
  return {
    data: {
      name,
      nameEn: str(b.nameEn, 80),
      slug: slugify(b.slug || b.nameEn || name) || `cat-${Date.now()}`,
      parent: b.parent || null,
      description: str(b.description, 1000),
      descriptionEn: str(b.descriptionEn, 1000),
      seoTitle: str(b.seoTitle, 70),
      seoDescription: str(b.seoDescription, 170),
      icon: str(b.icon, 8),
      image: image && isImageUrl(image) ? image : '',
      order: parseInt(b.order, 10) || 0,
      active: b.active !== false,
    },
  };
}

export function parseProduct(b) {
  const name = str(b.name, 150);
  if (!name) return { error: 'اسم المنتج مطلوب' };
  const type = PRODUCT_TYPES[b.type] ? b.type : 'general';

  const specs = (Array.isArray(b.specs) ? b.specs : [])
    .map((s) => ({ key: str(s?.key, 60), value: str(s?.value, 300) }))
    .filter((s) => s.key && s.value)
    .slice(0, 40);

  const options = (Array.isArray(b.options) ? b.options : [])
    .map((o) => ({ name: str(o?.name, 40), values: list(o?.values, 25, 40) }))
    .filter((o) => o.name && o.values.length)
    .slice(0, 3);
  if (new Set(options.map((o) => o.name)).size !== options.length) return { error: 'أسماء الخيارات مكررة' };

  const sku = code(b.sku);
  const barcode = code(b.barcode);
  const basePrice = num(b.price);
  const base = {
    type,
    name,
    nameEn: str(b.nameEn, 150),
    brand: str(b.brand, 80),
    description: str(b.description, 10000),
    descriptionEn: str(b.descriptionEn, 10000),
    seoTitle: str(b.seoTitle, 70),
    seoDescription: str(b.seoDescription, 170),
    seoKeywords: list(b.seoKeywords, 15, 50),
    category: b.category || null,
    tags: list(b.tags, 20, 40),
    cost: num(b.cost),
    lowStockAlert: Math.max(0, parseInt(b.lowStockAlert, 10) || 0),
    images: list(b.images, 12, 300).filter(isImageUrl),
    videos: parseVideos(b.videos),
    specs,
    options,
    featured: b.featured === true,
    active: b.active !== false,
  };

  const codes = [];
  if (!options.length) {
    // منتج بسيط
    if (basePrice == null || basePrice < 0) return { error: 'السعر غير صالح' };
    const cp = num(b.comparePrice);
    if (!CODE_RE.test(sku) || !CODE_RE.test(barcode)) return { error: 'SKU والباركود: حروف لاتينية وأرقام فقط' };
    if (sku) codes.push(sku);
    if (barcode) codes.push(barcode);
    return {
      codes,
      data: {
        ...base,
        price: basePrice,
        comparePrice: cp != null && cp > basePrice ? cp : null,
        stock: Math.max(0, parseInt(b.stock, 10) || 0),
        sku,
        barcode,
        variants: [],
      },
    };
  }

  // منتج بمتغيرات: نولّد كل التركيبات ونأخذ بياناتها من المرسَل حسب المفتاح
  const sent = new Map((Array.isArray(b.variants) ? b.variants : []).map((v) => [str(v?.key, 200), v]));
  const combos = combinations(options);
  if (combos.length > 100) return { error: 'عدد المتغيرات كبير جداً (الحد 100)' };

  const variants = [];
  for (const values of combos) {
    const key = variantKey(values);
    const v = sent.get(key) || {};
    const price = num(v.price) ?? basePrice;
    if (price == null || price < 0) return { error: `سعر غير صالح للمتغير "${key}"` };
    const cp = num(v.comparePrice);
    const vSku = code(v.sku);
    const vBarcode = code(v.barcode);
    if (!CODE_RE.test(vSku) || !CODE_RE.test(vBarcode)) return { error: `رموز غير صالحة للمتغير "${key}"` };
    if (vSku) codes.push(vSku);
    if (vBarcode) codes.push(vBarcode);
    variants.push({
      key,
      values,
      price,
      comparePrice: cp != null && cp > price ? cp : null,
      stock: Math.max(0, parseInt(v.stock, 10) || 0),
      sku: vSku,
      barcode: vBarcode,
      // صورة المتغير يجب أن تكون من صور المنتج نفسه
      image: base.images.includes(v.image) ? v.image : '',
    });
  }
  if (new Set(codes).size !== codes.length) return { error: 'يوجد SKU أو باركود مكرر بين المتغيرات' };

  const cheapest = variants.reduce((a, v) => (v.price < a.price ? v : a), variants[0]);
  return {
    codes,
    data: {
      ...base,
      price: cheapest.price,
      comparePrice: cheapest.comparePrice,
      stock: variants.reduce((s, v) => s + v.stock, 0),
      sku,
      barcode: '',
      variants,
    },
  };
}

// ملفات الفيديو والصوت المرفوعة: /api/media/<uuid>.<ext>
const MEDIA_RE = /^\/api\/media\/[a-f0-9-]{36}\.(mp4|webm|mp3|ogg|m4a|wav|aac|flac|weba)$/;
export const isMediaUrl = (u) => MEDIA_RE.test(String(u || ''));

// يستخرج معرّف فيديو يوتيوب من أي صيغة رابط (watch, youtu.be, shorts, embed) أو المعرّف نفسه
export function youtubeId(input) {
  const s = String(input || '').trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(s);
  return m ? m[1] : '';
}

// فيديوهات المنتج: ملف مرفوع أو يوتيوب
export function parseVideos(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((v) => {
      if (v?.type === 'youtube') {
        const id = youtubeId(v.id || v.url);
        return id ? { type: 'youtube', id, title: str(v.title, 120) } : null;
      }
      if (v?.type === 'file' && isMediaUrl(v.url)) {
        const poster = str(v.poster, 300);
        return { type: 'file', url: v.url, poster: poster && isImageUrl(poster) ? poster : '', title: str(v.title, 120) };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 6);
}

export function parseSlides(list) {
  if (!Array.isArray(list)) return { error: 'بيانات غير صالحة' };
  const slides = [];
  for (const s of list.slice(0, 10)) {
    const image = str(s.image, 300);
    const video = isMediaUrl(s.video) ? s.video : '';
    const youtube = youtubeId(s.youtube);
    if (!isImageUrl(image) && !video && !youtube) return { error: 'كل شريحة تحتاج صورة أو فيديو' };
    const link = str(s.link, 300);
    if (link && !link.startsWith('/') && !/^https?:\/\//.test(link)) {
      return { error: 'الرابط يجب أن يبدأ بـ / أو http' };
    }
    slides.push({
      image: isImageUrl(image) ? image : '',
      video,
      youtube,
      title: str(s.title, 120),
      subtitle: str(s.subtitle, 200),
      buttonText: str(s.buttonText, 40),
      link,
      active: s.active !== false,
    });
  }
  return { slides };
}

export function parsePost(b = {}) {
  const title = str(b.title, 160);
  if (!title) return { error: 'عنوان المقال مطلوب' };
  const cover = str(b.cover, 300);
  return {
    data: {
      title,
      titleEn: str(b.titleEn, 160),
      slug: slugify(b.slug || b.titleEn || title) || `post-${Date.now()}`,
      excerpt: str(b.excerpt, 400),
      excerptEn: str(b.excerptEn, 400),
      content: str(b.content, 60000),
      contentEn: str(b.contentEn, 60000),
      cover: cover && isImageUrl(cover) ? cover : '',
      tags: list(b.tags, 15, 40),
      author: str(b.author, 80),
      published: b.published === true,
      seoTitle: str(b.seoTitle, 70),
      seoDescription: str(b.seoDescription, 170),
    },
  };
}

export function parseMusic(b = {}) {
  const tracks = (Array.isArray(b.tracks) ? b.tracks : [])
    .filter((t) => isMediaUrl(t?.url))
    .map((t) => ({ url: t.url, title: str(t.title, 120) }))
    .slice(0, 20);
  const volume = Number(b.volume);
  return {
    enabled: b.enabled === true && tracks.length > 0,
    autoplay: b.autoplay !== false,
    shuffle: b.shuffle === true,
    volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0.35,
    tracks,
  };
}

// معرّفات البكسل أرقام/حروف فقط لأنها تُحقن داخل سكربت
export function parseMarketing(b = {}) {
  return {
    fbPixelId: str(b.fbPixelId, 30).replace(/\D/g, ''),
    tiktokPixelId: str(b.tiktokPixelId, 40).replace(/[^A-Za-z0-9]/g, ''),
  };
}

export function parseNotifications(b = {}) {
  return {
    telegramChatId: str(b.telegramChatId, 40).replace(/[^\d-]/g, ''),
    notifyEmail: EMAIL_OK(b.notifyEmail) ? str(b.notifyEmail, 120) : '',
    customerEmails: b.customerEmails !== false,
  };
}
const EMAIL_OK = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || ''));

const httpUrl = (v) => {
  const u = str(v, 300);
  return /^https?:\/\/[^\s]+$/i.test(u) ? u : '';
};
const hex = (v, fallback) => (/^#[0-9a-f]{6}$/i.test(String(v)) ? String(v).toLowerCase() : fallback);
const bool = (v, fallback) => (typeof v === 'boolean' ? v : fallback);

export function parseStore(b = {}) {
  const logo = str(b.logo, 300);
  return {
    nameAr: str(b.nameAr, 80) || 'متجري',
    nameEn: str(b.nameEn, 80),
    taglineAr: str(b.taglineAr, 160),
    taglineEn: str(b.taglineEn, 160),
    logo: logo && isImageUrl(logo) ? logo : '',
    phone: str(b.phone, 25),
    whatsapp: str(b.whatsapp, 20).replace(/\D/g, ''),
    email: str(b.email, 120),
    addressAr: str(b.addressAr, 300),
    addressEn: str(b.addressEn, 300),
  };
}

export function parseSocial(list, platforms) {
  if (!Array.isArray(list)) return [];
  return list
    .map((s) => ({ platform: platforms[s?.platform] ? s.platform : '', url: httpUrl(s?.url) }))
    .filter((s) => s.platform && s.url)
    .slice(0, 15);
}

export function parseSeo(b = {}) {
  const og = str(b.ogImage, 300);
  return {
    titleAr: str(b.titleAr, 70),
    titleEn: str(b.titleEn, 70),
    descriptionAr: str(b.descriptionAr, 170),
    descriptionEn: str(b.descriptionEn, 170),
    keywords: list(b.keywords, 30, 50),
    ogImage: og && isImageUrl(og) ? og : '',
    // رموز التحقق والتتبع: حروف وأرقام وشرطات فقط (تُحقن في <head>)
    googleVerification: str(b.googleVerification, 100).replace(/[^A-Za-z0-9_-]/g, ''),
    gaId: str(b.gaId, 30).replace(/[^A-Za-z0-9-]/g, ''),
  };
}

export function parseInvoice(b = {}, d, sizes) {
  return {
    paperSize: sizes[b.paperSize] ? b.paperSize : d.paperSize,
    accent: hex(b.accent, d.accent),
    fontSize: ['sm', 'md', 'lg'].includes(b.fontSize) ? b.fontSize : d.fontSize,
    titleAr: str(b.titleAr, 40) || d.titleAr,
    titleEn: str(b.titleEn, 40) || d.titleEn,
    showLogo: bool(b.showLogo, d.showLogo),
    showQr: bool(b.showQr, d.showQr),
    showSku: bool(b.showSku, d.showSku),
    showCustomer: bool(b.showCustomer, d.showCustomer),
    showStoreContact: bool(b.showStoreContact, d.showStoreContact),
    showNotes: bool(b.showNotes, d.showNotes),
    headerNote: str(b.headerNote, 300),
    footerNote: str(b.footerNote, 300),
    terms: str(b.terms, 600),
  };
}

export function parseCurrency(b = {}) {
  const code = str(b.code, 6).toUpperCase().replace(/[^A-Z]/g, '');
  const rate = Number(b.rate);
  if (code.length < 2) return { error: 'رمز العملة غير صالح (مثل USD)' };
  if (!str(b.nameAr, 40)) return { error: 'اسم العملة مطلوب' };
  if (!str(b.symbol, 8)) return { error: 'رمز العرض مطلوب (مثل $)' };
  if (!Number.isFinite(rate) || rate <= 0) return { error: 'سعر الصرف يجب أن يكون أكبر من صفر' };
  return {
    data: {
      code,
      nameAr: str(b.nameAr, 40),
      nameEn: str(b.nameEn, 40),
      symbol: str(b.symbol, 8),
      rate,
      decimals: Math.min(3, Math.max(0, parseInt(b.decimals, 10) || 0)),
      symbolFirst: b.symbolFirst === true,
      active: b.active !== false,
      order: parseInt(b.order, 10) || 0,
    },
  };
}

export function parseCustomer(c = {}) {
  const customer = {
    name: str(c.name, 100),
    phone: str(c.phone, 25).replace(/[\s-]/g, ''),
    city: str(c.city, 60),
    address: str(c.address, 300),
    notes: str(c.notes, 500),
    // بريد اختياري لإشعارات حالة الطلب
    email: EMAIL_OK(c.email) ? str(c.email, 120).toLowerCase() : '',
  };
  if (!customer.name || !customer.city || !customer.address) {
    return { error: 'يرجى تعبئة جميع الحقول المطلوبة' };
  }
  if (!/^\+?\d{7,15}$/.test(customer.phone)) return { error: 'رقم الهاتف غير صالح' };
  return { customer };
}

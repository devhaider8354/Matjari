import Product from '@/models/Product';
import { cached } from './cache';
import { dbConnect, plain } from './db';
import { escapeRegex } from './validate';

export const PAGE_SIZE = 24;
const SORTS = {
  new: { createdAt: -1 },
  price_asc: { price: 1, createdAt: -1 },
  price_desc: { price: -1, createdAt: -1 },
  name: { name: 1 },
};

// يقرأ معايير التصفية من الرابط. أسعار التصفية بعملة العرض، فتُحوّل للعملة الأساسية
export function readFilters(sp = {}, currency) {
  const s = (k, max = 80) => (typeof sp[k] === 'string' ? sp[k].trim().slice(0, max) : '');
  const n = (k) => {
    const v = Number(s(k));
    return Number.isFinite(v) && v > 0 ? v : null;
  };
  return {
    q: s('q'),
    sort: SORTS[sp.sort] ? sp.sort : 'new',
    min: n('min'),
    max: n('max'),
    brand: s('brand', 80),
    inStock: sp.stock === '1',
    page: Math.max(1, parseInt(s('page'), 10) || 1),
    rate: currency?.rate || 1,
  };
}

const CARD_FIELDS = 'name nameEn brand price comparePrice stock images variants.price createdAt featured type';

async function runQuery(base, f) {
  const filter = { active: true, ...base };
  if (f.brand) filter.brand = f.brand;
  if (f.inStock) filter.stock = { $gt: 0 };
  if (f.min || f.max) {
    filter.price = {};
    if (f.min) filter.price.$gte = f.min / f.rate;
    if (f.max) filter.price.$lte = f.max / f.rate;
  }

  await dbConnect();
  let query = filter;
  let sort = SORTS[f.sort];
  let projection = CARD_FIELDS;
  if (f.q) {
    // بحث نصي مفهرس (سريع ومرتّب حسب الصلة)، ثم بحث جزئي إن لم يجد شيئاً
    const text = { ...filter, $text: { $search: f.q } };
    const textCount = await Product.countDocuments(text);
    if (textCount) {
      query = text;
      projection = { score: { $meta: 'textScore' }, ...Object.fromEntries(CARD_FIELDS.split(' ').map((k) => [k, 1])) };
      if (f.sort === 'new') sort = { score: { $meta: 'textScore' } };
    } else {
      const rx = { $regex: escapeRegex(f.q), $options: 'i' };
      query = { ...filter, $or: [{ name: rx }, { nameEn: rx }, { brand: rx }, { tags: rx }, { sku: f.q.toUpperCase() }, { barcode: f.q }, { 'variants.sku': f.q.toUpperCase() }] };
    }
  }

  const [items, total, brands] = await Promise.all([
    Product.find(query, projection).sort(sort).skip((f.page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    Product.countDocuments(query),
    Product.distinct('brand', { active: true, ...base, brand: { $gt: '' } }),
  ]);
  return { items: plain(items), total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), brands: brands.sort() };
}

// النتائج تُخزَّن مؤقتاً دقيقة لكل تركيبة تصفية، وتُمسح عند أي تعديل من اللوحة أو طلب جديد
const cachedQuery = cached((key, base, f) => runQuery(base, f), ['product-listing'], { tags: ['catalog'], revalidate: 60 });

export function queryProducts(base, f) {
  return cachedQuery(JSON.stringify({ base, f }), base, f);
}

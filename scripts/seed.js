// بيانات تجريبية احترافية: 10 أقسام × 20 منتجاً بصور WebP مولَّدة وباركود صالح.
//   npm run seed                      يضيف البيانات إذا كان المتجر فارغاً
//   npm run seed -- --reset           يحذف المنتجات والأقسام الحالية ثم يضيف
//   npm run seed -- --demo-orders     يضيف أيضاً زبائن وطلبات تجريبية (للعرض فقط)
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const sharp = require('sharp');
const CATEGORIES = require('./seed-data');

const args = process.argv.slice(2);
const RESET = args.includes('--reset');
const DEMO_ORDERS = args.includes('--demo-orders');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const SKU_PREFIX = {
  'men-fashion': 'MEN', 'women-fashion': 'WOM', perfumes: 'PER', 'flowers-gifts': 'FLW', electronics: 'ELC',
  'electronic-parts': 'PRT', 'watches-accessories': 'ACC', beauty: 'BEA', 'food-sweets': 'FOD', 'home-kitchen': 'HOM',
};

// مولّد أرقام ثابت حتى تكون البيانات نفسها في كل تشغيل
let seed = 20261029;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const round = (n) => (n >= 100 ? Math.round(n) : Math.round(n * 2) / 2);

function ean13() {
  const d = [6, 2, 1, ...Array.from({ length: 9 }, () => int(0, 9))];
  const sum = d.reduce((s, x, i) => s + x * (i % 2 ? 3 : 1), 0);
  return [...d, (10 - (sum % 10)) % 10].join('');
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function wrap(text, max = 16) {
  const words = text.split(' ');
  const lines = [''];
  for (const w of words) {
    if ((lines[lines.length - 1] + ' ' + w).trim().length > max) lines.push(w);
    else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim();
  }
  return lines.slice(0, 3);
}

// صورة منتج: تدرّج بألوان القسم مع أشكال زخرفية واسم المنتج والماركة
async function productImage(nameEn, brand, [c1, c2], variant) {
  const lines = wrap(nameEn);
  const cx = 150 + variant * 37;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1125" viewBox="0 0 900 1125">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    <radialGradient id="r" cx="0.5" cy="0.4" r="0.6"><stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="900" height="1125" fill="url(#g)"/>
  <circle cx="${cx + 520}" cy="${180 + variant * 11}" r="${220 + (variant % 5) * 20}" fill="#ffffff" opacity="0.08"/>
  <circle cx="${cx}" cy="${900 - variant * 7}" r="${260 - (variant % 4) * 25}" fill="#000000" opacity="0.10"/>
  <rect x="${210 + (variant % 3) * 10}" y="300" width="${480 - (variant % 3) * 20}" height="${430 + (variant % 4) * 15}" rx="${40 + (variant % 5) * 20}" fill="url(#r)" stroke="#ffffff" stroke-opacity="0.45" stroke-width="6"/>
  <text x="450" y="200" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700" fill="#ffffff" fill-opacity="0.75" text-anchor="middle" letter-spacing="8">${esc(brand.toUpperCase())}</text>
  ${lines.map((l, i) => `<text x="450" y="${870 + i * 74}" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="#ffffff" text-anchor="middle">${esc(l)}</text>`).join('')}
</svg>`;
  const id = crypto.randomUUID();
  const base = sharp(Buffer.from(svg));
  await base.clone().resize(1200).webp({ quality: 78 }).toFile(path.join(UPLOAD_DIR, `${id}.webp`));
  await base.clone().resize(600).webp({ quality: 72 }).toFile(path.join(UPLOAD_DIR, `${id}-sm.webp`));
  return `/api/uploads/${id}.webp`;
}

function combinations(options) {
  return options.reduce((acc, o) => acc.flatMap((c) => o.values.map((v) => [...c, v])), [[]]);
}

function describe(cat, item, specs) {
  const [ar, en, brand] = item;
  const specAr = specs.slice(0, 3).map((s) => `${s.key}: ${s.value}`).join('، ');
  return {
    ar: `${ar} من ${brand}، مختار بعناية من قسم ${cat.name}. جودة عالية وتصميم عصري يناسب الاستخدام اليومي والهدايا.\n${specAr}.\nالدفع عند الاستلام والتوصيل لجميع المدن.`,
    en: `${en} by ${brand}, carefully selected from our ${cat.nameEn} collection. Premium quality and a modern design for everyday use or gifting.\nCash on delivery with shipping to all cities.`,
  };
}

(async () => {
  if (!process.env.MONGODB_URI) throw new Error('عرّف MONGODB_URI في .env.local');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const products = db.collection('products');
  const categories = db.collection('categories');

  if (RESET) {
    await products.deleteMany({});
    await categories.deleteMany({});
    console.log('🗑️  حُذفت المنتجات والأقسام السابقة');
  } else if ((await products.countDocuments()) > 0) {
    console.log('المتجر يحتوي منتجات مسبقاً. استخدم --reset لاستبدالها.');
    return mongoose.disconnect();
  }
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const now = Date.now();
  let total = 0;
  for (const [ci, cat] of CATEGORIES.entries()) {
    const { insertedId: catId } = await categories.insertOne({
      name: cat.name, nameEn: cat.nameEn, slug: cat.slug, parent: null, icon: cat.icon, image: '',
      description: `تشكيلة مختارة من ${cat.name} بأفضل الأسعار`, descriptionEn: `A curated selection of ${cat.nameEn} at the best prices`,
      seoTitle: '', seoDescription: '', order: ci, active: true, createdAt: new Date(), updatedAt: new Date(),
    });
    const childIds = [];
    for (const [k, [slug, name, nameEn]] of (cat.children || []).entries()) {
      const r = await categories.insertOne({
        name, nameEn, slug, parent: catId, icon: '', image: '', description: '', descriptionEn: '',
        seoTitle: '', seoDescription: '', order: k, active: true, createdAt: new Date(), updatedAt: new Date(),
      });
      childIds.push(r.insertedId);
    }

    const prefix = SKU_PREFIX[cat.slug] || cat.slug.replace(/-/g, '').slice(0, 3).toUpperCase() + ci;
    const docs = [];
    for (const [i, item] of cat.items.entries()) {
      const [ar, en, brand, price] = item;
      const sku = `${prefix}-${String(i + 1).padStart(3, '0')}`;
      const specs = Object.entries(cat.specs).map(([key, values]) => ({ key, value: pick(values) }));
      if (cat.type === 'electronics' || cat.type === 'parts' || cat.type === 'general') specs.unshift({ key: 'العلامة التجارية', value: brand });
      const desc = describe(cat, item, specs);
      const images = [await productImage(en, brand, cat.color, i), await productImage(en, brand, [cat.color[1], cat.color[0]], i + 7)];
      const onSale = rand() < 0.3;
      const options = cat.options || [];
      const step = cat.priceStep || 1;

      let variants = [];
      if (options.length) {
        variants = combinations(options).map((values, vi) => {
          const idx = options[0].values.indexOf(values[0]);
          const vPrice = round(price * Math.pow(step, idx));
          return {
            key: values.join(' / '), values, price: vPrice,
            comparePrice: onSale ? round(vPrice * 1.25) : null,
            stock: rand() < 0.12 ? 0 : int(2, 25), sku: `${sku}-${vi + 1}`, barcode: ean13(),
          };
        });
      }
      const stock = variants.length ? variants.reduce((s, v) => s + v.stock, 0) : rand() < 0.08 ? 0 : int(1, 60);
      const minPrice = variants.length ? Math.min(...variants.map((v) => v.price)) : price;
      const created = new Date(now - int(1, 60) * 864e5 - int(0, 86400) * 1000);

      docs.push({
        type: cat.type, name: ar, nameEn: en, brand, description: desc.ar, descriptionEn: desc.en,
        seoTitle: '', seoDescription: '', seoKeywords: [ar, en, brand, cat.name],
        category: childIds.length ? childIds[i % childIds.length] : catId,
        tags: [cat.name, brand],
        price: minPrice, comparePrice: !variants.length && onSale ? round(price * 1.25) : variants[0]?.comparePrice ?? null,
        cost: round(minPrice * 0.6), stock, lowStockAlert: 3,
        sku, barcode: variants.length ? '' : ean13(),
        images, specs, options, variants,
        featured: i < 2 || (i === 7 && ci % 2 === 0), active: true, createdAt: created, updatedAt: created,
      });
    }
    await products.insertMany(docs);
    total += docs.length;
    console.log(`✔ ${cat.icon} ${cat.name}: ${docs.length} منتج`);
  }
  console.log(`\nتمت إضافة ${CATEGORIES.length} أقسام و ${total} منتج مع صورها.`);

  if (DEMO_ORDERS) await demoOrders(db);
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('✘', e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

// زبائن وطلبات تجريبية لعرض لوحة المعلومات بشكل حي (لا تُستخدم في متجر حقيقي)
async function demoOrders(db) {
  const users = db.collection('users');
  const orders = db.collection('orders');
  const all = await db.collection('products').find({ stock: { $gt: 0 } }).toArray();
  const names = ['أحمد علي', 'سارة محمد', 'حسين كريم', 'زينب حسن', 'مصطفى جاسم', 'نور الهدى', 'علي عباس', 'مريم سعد', 'يوسف خالد', 'فاطمة أحمد'];
  const cities = ['بغداد', 'البصرة', 'أربيل', 'النجف', 'كربلاء', 'الموصل'];
  const unusable = `!demo-${crypto.randomBytes(16).toString('hex')}`; // لا يمكن الدخول بهذه الحسابات
  const customerIds = [];
  for (const [i, name] of names.entries()) {
    const email = `demo${i + 1}@example.com`;
    const r = await users.findOneAndUpdate(
      { email },
      { $setOnInsert: { name, email, phone: `0770${String(1000000 + i * 7919).slice(0, 7)}`, city: pick(cities), address: 'عنوان تجريبي', passwordHash: unusable, role: 'customer', disabled: false, tokenVersion: 0, failedLogins: 0, lockUntil: null, createdAt: new Date(Date.now() - int(5, 50) * 864e5), updatedAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );
    customerIds.push(r._id || r.value?._id);
  }

  const statuses = ['delivered', 'delivered', 'delivered', 'shipped', 'confirmed', 'pending', 'pending', 'cancelled'];
  const docs = [];
  for (let n = 0; n < 90; n++) {
    const created = new Date(Date.now() - Math.pow(rand(), 1.4) * 40 * 864e5);
    const items = Array.from({ length: int(1, 3) }, () => {
      const p = pick(all);
      const v = p.variants.length ? pick(p.variants) : null;
      return {
        product: p._id, name: p.name, price: v ? v.price : p.price, qty: int(1, 2),
        variantKey: v?.key || '', variant: v ? p.options.map((o, k) => `${o.name}: ${v.values[k]}`).join(' · ') : '',
        sku: v?.sku || p.sku, barcode: v?.barcode || p.barcode, image: p.images[0],
      };
    });
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = subtotal >= Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_OVER || 100) ? 0 : Number(process.env.NEXT_PUBLIC_SHIPPING_FEE || 5);
    const ci = int(0, names.length - 1);
    const status = pick(statuses);
    docs.push({
      orderNumber: `DEMO-${String(n + 1).padStart(4, '0')}`, user: rand() < 0.7 ? customerIds[ci] : undefined,
      customer: { name: names[ci], phone: '07700000000', city: pick(cities), address: 'عنوان تجريبي', notes: '' },
      items, subtotal, shipping, total: subtotal + shipping, paymentMethod: 'cod', currency: null, lang: 'ar',
      status, adminNote: '', history: status === 'pending' ? [] : [{ status, at: new Date(created.getTime() + 864e5) }],
      createdAt: created, updatedAt: created,
    });
  }
  await orders.deleteMany({ orderNumber: /^DEMO-/ });
  await orders.insertMany(docs);
  console.log(`✔ أُضيف ${names.length} زبائن و ${docs.length} طلباً تجريبياً (أرقامها تبدأ بـ DEMO-)`);
}

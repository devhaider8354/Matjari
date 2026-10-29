// صور حقيقية لأقسام المتجر وشرائح السلايدر من Pexels (يحتاج PEXELS_API_KEY):
//   npm run fetch-banners
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const sharp = require('sharp');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const KEY = process.env.PEXELS_API_KEY;

// كلمة بحث لكل قسم (حسب الـ slug)
const CATEGORY_QUERIES = {
  'men-fashion': 'men fashion clothing', 'women-fashion': 'women fashion dress', perfumes: 'perfume bottles',
  'flowers-gifts': 'flower bouquet', electronics: 'smartphone gadgets', 'electronic-parts': 'arduino electronics',
  'watches-accessories': 'luxury watch', beauty: 'cosmetics makeup', 'food-sweets': 'chocolate sweets', 'home-kitchen': 'modern kitchen',
  'men-shirts': 'men shirts', 'men-pants': 'jeans', 'women-dresses': 'dress fashion', abayas: 'abaya',
  'men-perfumes': 'men cologne', 'women-perfumes': 'women perfume', phones: 'smartphone', audio: 'headphones',
};

const SLIDES = [
  { query: 'fashion store clothing rack', title: 'تشكيلة الموسم الجديدة', subtitle: 'أزياء رجالية ونسائية بأسعار مميزة', buttonText: 'تسوّق الآن', link: '/category/women-fashion' },
  { query: 'luxury perfume', title: 'عطور فاخرة', subtitle: 'خصم حتى 20% على عطور مختارة', buttonText: 'اكتشف العطور', link: '/category/perfumes' },
  { query: 'tech gadgets desk', title: 'أحدث الإلكترونيات', subtitle: 'هواتف وسماعات وإكسسوارات بضمان', buttonText: 'تسوّق الإلكترونيات', link: '/category/electronics' },
  { query: 'flower shop bouquets', title: 'ورد وهدايا لكل مناسبة', subtitle: 'توصيل سريع لمن تحب', buttonText: 'اختر هديتك', link: '/category/flowers-gifts' },
];

async function pexels(query, orientation) {
  const u = new URL('https://api.pexels.com/v1/search');
  u.searchParams.set('query', query);
  u.searchParams.set('per_page', '5');
  u.searchParams.set('orientation', orientation);
  const r = await fetch(u, { headers: { Authorization: KEY } });
  if (!r.ok) throw new Error(`Pexels ${r.status}`);
  const j = await r.json();
  if (!j.photos?.length) throw new Error(`لا نتائج لـ "${query}"`);
  return j.photos[0];
}

async function save(url, width, height) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status}`);
  const input = Buffer.from(await r.arrayBuffer());
  const id = crypto.randomUUID();
  const img = sharp(input).rotate().resize({ width, height, fit: 'cover', position: sharp.strategy.attention });
  await img.clone().webp({ quality: 80 }).toFile(path.join(UPLOAD_DIR, `${id}.webp`));
  await img.clone().resize(600).webp({ quality: 74 }).toFile(path.join(UPLOAD_DIR, `${id}-sm.webp`));
  return `/api/uploads/${id}.webp`;
}

(async () => {
  if (!KEY) throw new Error('عرّف PEXELS_API_KEY في .env.local');
  await mongoose.connect(process.env.MONGODB_URI);
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const db = mongoose.connection.db;

  for (const cat of await db.collection('categories').find().toArray()) {
    const q = CATEGORY_QUERIES[cat.slug] || cat.nameEn || cat.name;
    try {
      const photo = await pexels(q, 'square');
      const image = await save(photo.src.large, 800, 800);
      await db.collection('categories').updateOne({ _id: cat._id }, { $set: { image, updatedAt: new Date() } });
      console.log(`✔ قسم ${cat.name}`);
    } catch (e) {
      console.log(`✘ قسم ${cat.name}: ${e.message}`);
    }
  }

  const slides = [];
  for (const s of SLIDES) {
    try {
      const photo = await pexels(s.query, 'landscape');
      const image = await save(photo.src.original, 1920, 720);
      const { query, ...slide } = s;
      slides.push({ ...slide, image, active: true });
      console.log(`✔ شريحة: ${s.title}`);
    } catch (e) {
      console.log(`✘ شريحة ${s.title}: ${e.message}`);
    }
  }
  if (slides.length) {
    await db.collection('settings').updateOne({ key: 'site' }, { $set: { slides } }, { upsert: true });
  }
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('✘', e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

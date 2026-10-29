// يجلب صوراً حقيقية للمنتجات من مصادر مرخّصة ويحوّلها إلى WebP:
//   npm run fetch-images                 للمنتجات التي لا تملك صوراً حقيقية بعد
//   npm run fetch-images -- --all        يستبدل صور كل المنتجات
//   npm run fetch-images -- --limit 5    للتجربة على 5 منتجات
// المصدر: Pexels (يتطلب PEXELS_API_KEY المجاني) لأنها صور منتجات احترافية.
// --commons يستخدم Wikimedia Commons بدون مفتاح، لكن نتائجها غالباً صور عامة لا تصلح كصور متجر.
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const sharp = require('sharp');
const QUERIES = require('./image-queries');

const args = process.argv.slice(2);
const ALL = args.includes('--all');
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;
const PER_PRODUCT = 2;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const UA = 'mini-store-catalog/1.0 (product demo images; nodejs)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// الرخص المسموحة للاستخدام التجاري (بدون NC أو ND)
const LICENSE_OK = /^(cc0|public domain|pd|cc[ -]by(-sa)?( [\d.]+)?)$/i;
// استبعاد ما ليس صورة منتج: رسومات، شعارات، خرائط، لوحات فنية...
const TITLE_BAD = /(patent|drawing|logo|diagram|\bmap\b|chart|poster|stamp|coat of arms|illustration|sketch|ownership|leaflet|screenshot|advert|catalog|flag|icon|engraving|painting|museum|statistic|graph|protest|svg|\bpage\b|book|cover|label|portrait|vintage|histor|archive|\b1[6-9]\d\d\b|\b20[01]\d\b|SAAM|LACMA|met museum|soldier|war\b)/i;

// ترتيب النتائج: الأفضل ما يحتوي كلمات البحث في عنوانه
const relevance = (title, query) =>
  query.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && title.toLowerCase().includes(w)).length;

// يرفض الصور الباهتة أو الأبيض والأسود (صور أرشيفية قديمة لا تصلح كصورة منتج)
async function colorfulEnough(buffer) {
  const { data, info } = await sharp(buffer).resize(48, 48, { fit: 'inside' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let sat = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    sat += max ? (max - min) / max : 0;
  }
  return sat / (data.length / info.channels) > 0.13;
}

const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

async function getJson(url, headers = {}) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA, ...headers } });
    if (r.status === 429 || r.status >= 500) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }
  throw new Error('rate limited');
}

// ===== المزودات: كل واحد يرجع [{ url, author, license, source, link }] =====
async function searchCommons(query) {
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  Object.entries({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: '25',
    gsrsearch: `filetype:bitmap ${query}`, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1280',
  }).forEach(([k, v]) => u.searchParams.set(k, v));
  const j = await getJson(u);
  const pages = Object.values(j.query?.pages || {}).sort((a, b) => a.index - b.index);
  return pages
    .map((p) => ({ p, ii: p.imageinfo?.[0] }))
    .filter(({ p, ii }) => {
      if (!ii || ii.mime !== 'image/jpeg' || TITLE_BAD.test(p.title)) return false;
      const ratio = ii.width / ii.height;
      const license = ii.extmetadata?.LicenseShortName?.value || '';
      return ii.width >= 600 && ii.height >= 500 && ratio > 0.5 && ratio < 2.2 && LICENSE_OK.test(license.trim());
    })
    .sort((a, b) => relevance(b.p.title, query) - relevance(a.p.title, query))
    .map(({ ii }) => ({
      url: ii.thumburl || ii.url,
      author: stripHtml(ii.extmetadata?.Artist?.value).slice(0, 120) || 'Wikimedia Commons',
      license: ii.extmetadata.LicenseShortName.value,
      source: 'Wikimedia Commons',
      link: ii.descriptionurl,
    }));
}

async function searchPexels(query) {
  const u = new URL('https://api.pexels.com/v1/search');
  u.searchParams.set('query', query);
  u.searchParams.set('per_page', '15');
  u.searchParams.set('orientation', 'portrait'); // أقرب لقياس بطاقات المنتجات 4:5
  const j = await getJson(u, { Authorization: process.env.PEXELS_API_KEY });
  return (j.photos || []).map((ph) => ({
    url: ph.src.large2x || ph.src.large,
    author: ph.photographer,
    license: 'Pexels License',
    source: 'Pexels',
    link: ph.url,
  }));
}

const USE_COMMONS = args.includes('--commons');
if (!process.env.PEXELS_API_KEY && !USE_COMMONS) {
  console.error('✘ عرّف PEXELS_API_KEY في .env.local (مفتاح مجاني من https://www.pexels.com/api/)');
  console.error('  أو استخدم --commons لصور Wikimedia (جودتها كصور متجر ضعيفة)');
  process.exit(1);
}
const search = USE_COMMONS ? searchCommons : searchPexels;

// تنزيل مع إعادة المحاولة: خوادم الصور تحدّ عدد الطلبات (429)، فننتظر ثم نعيد
async function download(url) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (r.status !== 429 && r.status < 500) throw new Error(`download ${r.status}`);
    const wait = Number(r.headers.get('retry-after')) * 1000 || 3000 * 2 ** attempt;
    await sleep(Math.min(wait, 60000));
  }
  throw new Error('download rate-limited');
}

async function saveImage(remoteUrl) {
  const input = await download(remoteUrl);
  if (!(await colorfulEnough(input))) throw new Error('low-color');
  const id = crypto.randomUUID();
  const base = sharp(input, { limitInputPixels: 60_000_000 }).rotate();
  await base.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(UPLOAD_DIR, `${id}.webp`));
  await base.clone().resize({ width: 600, height: 750, fit: 'cover', position: sharp.strategy.attention }).webp({ quality: 74 }).toFile(path.join(UPLOAD_DIR, `${id}-sm.webp`));
  return `/api/uploads/${id}.webp`;
}

function removeLocal(url) {
  const m = /^\/api\/uploads\/([a-f0-9-]{36})\.webp$/.exec(url || '');
  if (!m) return;
  for (const f of [`${m[1]}.webp`, `${m[1]}-sm.webp`]) fs.rmSync(path.join(UPLOAD_DIR, f), { force: true });
}

(async () => {
  if (!process.env.MONGODB_URI) throw new Error('عرّف MONGODB_URI في .env.local');
  await mongoose.connect(process.env.MONGODB_URI);
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const products = mongoose.connection.db.collection('products');
  const filter = ALL ? {} : { 'imageCredits.0': { $exists: false } };
  const list = await products.find(filter).project({ name: 1, nameEn: 1, images: 1, imageCredits: 1 }).limit(LIMIT === Infinity ? 0 : LIMIT).toArray();
  console.log(`المصدر: ${USE_COMMONS ? 'Wikimedia Commons' : 'Pexels'} — ${list.length} منتج`);

  // لا نكرر نفس الصورة لمنتجين
  const used = new Set((await products.distinct('imageCredits.link')).filter(Boolean));
  let done = 0;
  let failed = 0;

  for (const p of list) {
    const queries = [...(QUERIES[p.nameEn] || []), p.nameEn].filter(Boolean);
    const images = [];
    const credits = [];
    // نجرب المرشحين بالترتيب حتى نحصل على صورتين صالحتين (الباهتة والقديمة تُرفض)
    for (const q of queries) {
      if (images.length >= PER_PRODUCT) break;
      let results = [];
      try {
        results = await search(q);
      } catch (e) {
        console.warn(`  ! بحث "${q}": ${e.message}`);
      }
      for (const res of results.slice(0, 8)) {
        if (images.length >= PER_PRODUCT) break;
        if (used.has(res.link)) continue;
        used.add(res.link);
        try {
          const url = await saveImage(res.url);
          images.push(url);
          credits.push({ image: url, author: res.author, license: res.license, source: res.source, link: res.link });
        } catch (e) {
          if (e.message !== 'low-color') console.warn(`  ! تنزيل: ${e.message}`);
        }
        await sleep(700);
      }
      await sleep(250);
    }

    if (!images.length) {
      failed++;
      console.log(`✘ ${p.nameEn}: لم توجد صورة مناسبة (بقيت الصورة الحالية)`);
      continue;
    }
    (p.images || []).forEach(removeLocal);
    await products.updateOne({ _id: p._id }, { $set: { images, imageCredits: credits, updatedAt: new Date() } });
    done++;
    console.log(`✔ ${p.nameEn}: ${images.length} صورة (${credits[0].license})`);
  }

  console.log(`\nتم: ${done} منتج${failed ? ` · بدون صور مناسبة: ${failed}` : ''}`);
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('✘', e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

import { dbConnect } from '@/lib/db';
import { appUrl } from '@/lib/mail';
import { BASE_CURRENCY } from '@/lib/money';
import { getSettings } from '@/lib/settings';
import Category from '@/models/Category';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

const x = (s) => String(s ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
const abs = (u) => (u?.startsWith('http') ? u : `${appUrl()}${u}`);
const price = (n) => `${Number(n).toFixed(2)} ${BASE_CURRENCY.code}`;

// خلاصة منتجات Google Merchant (RSS 2.0). كل متغير منتج مستقل ضمن مجموعة واحدة
export async function GET() {
  await dbConnect();
  const [{ store }, products, cats] = await Promise.all([
    getSettings(),
    Product.find({ active: true }).select('-cost').lean(),
    Category.find().select('name nameEn').lean(),
  ]);
  const catName = Object.fromEntries(cats.map((c) => [String(c._id), c.nameEn || c.name]));
  const base = appUrl();

  const items = products.flatMap((p) => {
    const common = {
      title: p.nameEn || p.name,
      description: (p.descriptionEn || p.description || p.name).slice(0, 4900),
      link: `${base}/product/${p._id}`,
      image: p.images?.[0] ? abs(p.images[0]) : '',
      extra: (p.images || []).slice(1, 10).map(abs),
      brand: p.brand || store.nameEn || store.nameAr,
      type: catName[String(p.category)] || '',
    };
    const rows = p.variants?.length
      ? p.variants.map((v) => ({ id: v.sku || `${p._id}-${v.key}`, group: String(p._id), price: v.price, compare: v.comparePrice, stock: v.stock, gtin: v.barcode, variant: v.key, image: v.image ? abs(v.image) : common.image }))
      : [{ id: p.sku || String(p._id), price: p.price, compare: p.comparePrice, stock: p.stock, gtin: p.barcode, image: common.image }];
    return rows.map((r) => `
    <item>
      <g:id>${x(r.id)}</g:id>
      ${r.group ? `<g:item_group_id>${x(r.group)}</g:item_group_id>` : ''}
      <title>${x(r.variant ? `${common.title} - ${r.variant}` : common.title)}</title>
      <description>${x(common.description)}</description>
      <link>${x(common.link)}</link>
      <g:image_link>${x(r.image)}</g:image_link>
      ${common.extra.map((u) => `<g:additional_image_link>${x(u)}</g:additional_image_link>`).join('')}
      <g:availability>${r.stock > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      ${r.compare ? `<g:price>${price(r.compare)}</g:price><g:sale_price>${price(r.price)}</g:sale_price>` : `<g:price>${price(r.price)}</g:price>`}
      <g:brand>${x(common.brand)}</g:brand>
      ${r.gtin ? `<g:gtin>${x(r.gtin)}</g:gtin>` : '<g:identifier_exists>no</g:identifier_exists>'}
      <g:condition>new</g:condition>
      ${common.type ? `<g:product_type>${x(common.type)}</g:product_type>` : ''}
    </item>`);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${x(store.nameEn || store.nameAr)}</title>
    <link>${x(base)}</link>
    <description>${x(store.taglineEn || store.taglineAr)}</description>${items.join('')}
  </channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}

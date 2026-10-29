import mongoose from 'mongoose';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import AddToCart from '@/components/AddToCart';
import Gallery from '@/components/Gallery';
import ProductCard from '@/components/ProductCard';
import { dbConnect, plain } from '@/lib/db';
import { pick } from '@/lib/i18n';
import { getLang, getLocale } from '@/lib/locale';
import { appUrl } from '@/lib/mail';
import { BASE_CURRENCY } from '@/lib/money';
import Category from '@/models/Category';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

const getProduct = cache(async (id) => {
  if (!mongoose.isValidObjectId(id)) return null;
  await dbConnect();
  const p = await Product.findOne({ _id: id, active: true }).select('-cost').lean();
  if (!p) return null;
  const category = p.category ? await Category.findById(p.category).lean() : null;
  return plain({ ...p, categoryDoc: category });
});

export async function generateMetadata({ params }) {
  const p = await getProduct(params.id);
  if (!p) return { title: 'Not found' };
  const lang = getLang();
  const name = pick(p, 'name', lang);
  const description = p.seoDescription || pick(p, 'description', lang).slice(0, 160) || name;
  return {
    title: p.seoTitle || name,
    description,
    keywords: p.seoKeywords?.length ? p.seoKeywords : [p.brand, ...(p.tags || [])].filter(Boolean),
    alternates: { canonical: `/product/${p._id}` },
    openGraph: { type: 'website', title: name, description, images: p.images?.slice(0, 4) },
  };
}

export default async function ProductPage({ params }) {
  const product = await getProduct(params.id);
  if (!product) notFound();
  const locale = await getLocale();
  const { t, lang, money } = locale;
  const name = pick(product, 'name', lang);
  const description = pick(product, 'description', lang);
  const cat = product.categoryDoc;
  const credits = (product.imageCredits || []).filter((c) => product.images?.includes(c.image));

  const related = plain(
    await Product.find({ active: true, category: product.category, _id: { $ne: product._id } })
      .select('name nameEn brand price comparePrice stock images variants.price').limit(4).lean()
  );

  // بيانات منظمة: تُظهر السعر والتوفر في نتائج Google
  const offers = (product.variants?.length ? product.variants : [product]).map((v) => ({
    '@type': 'Offer',
    price: Number(v.price).toFixed(2),
    priceCurrency: BASE_CURRENCY.code,
    availability: v.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    sku: v.sku || product.sku || undefined,
    url: `${appUrl()}/product/${product._id}`,
  }));
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: description.slice(0, 500),
    image: product.images?.map((i) => (i.startsWith('http') ? i : `${appUrl()}${i}`)),
    sku: product.sku || undefined,
    gtin: product.barcode || undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    category: cat ? pick(cat, 'name', lang) : undefined,
    offers: offers.length === 1 ? offers[0] : { '@type': 'AggregateOffer', lowPrice: Math.min(...offers.map((o) => +o.price)), highPrice: Math.max(...offers.map((o) => +o.price)), priceCurrency: BASE_CURRENCY.code, offerCount: offers.length, offers },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="breadcrumb">
        <Link href="/">{t.home}</Link> /
        {cat && <> <Link href={`/category/${encodeURIComponent(cat.slug)}`}>{pick(cat, 'name', lang)}</Link> /</>}
        <span> {name}</span>
      </nav>
      <div className="product-page">
        <div>
          <Gallery images={product.images} videos={product.videos || []} alt={name} />
          {/* نسب الصور لأصحابها حسب رخصتها (مطلوب لرخص CC BY) */}
          {credits.length > 0 && (
            <p className="image-credits">
              📷{' '}
              {credits.map((c, i) => (
                <span key={i}>
                  {i > 0 && ' · '}
                  <a href={c.link} target="_blank" rel="noopener noreferrer nofollow">{c.author}</a> — {c.license} ({c.source})
                </span>
              ))}
            </p>
          )}
        </div>
        <div>
          {product.brand && <div className="card-brand" style={{ fontSize: 14 }}>{product.brand}</div>}
          <h1>{name}</h1>
          <AddToCart
            product={{
              _id: product._id,
              name,
              price: product.price,
              comparePrice: product.comparePrice,
              stock: product.stock,
              image: product.images?.[0] || '',
              options: product.options || [],
              variants: product.variants || [],
              sku: product.sku,
            }}
          />
          {description && (
            <>
              <h3 style={{ marginTop: 28 }}>{t.description}</h3>
              <p className="description">{description}</p>
            </>
          )}
          {product.specs?.length > 0 && (
            <>
              <h3>{t.specs}</h3>
              <table className="specs-table">
                <tbody>
                  {product.specs.map((s, i) => (
                    <tr key={i}><th>{s.key}</th><td>{s.value}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="home-section">
          <h2 className="section-title">{t.related}</h2>
          <div className="products">
            {related.map((p) => <ProductCard key={p._id} product={p} lang={lang} t={t} money={money} />)}
          </div>
        </section>
      )}
    </>
  );
}

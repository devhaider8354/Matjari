import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import Slider from '@/components/Slider';
import { getCategoryTree } from '@/lib/catalog';
import { FREE_SHIPPING_OVER } from '@/lib/config';
import { dbConnect, plain } from '@/lib/db';
import { pick } from '@/lib/i18n';
import { getLocale } from '@/lib/locale';
import { appUrl } from '@/lib/mail';
import { getSettings } from '@/lib/settings';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

const CARD_FIELDS = 'name nameEn brand price comparePrice stock images variants.price category';

export default async function HomePage() {
  const locale = await getLocale();
  const { t, lang, money } = locale;
  await dbConnect();
  const [settings, tree, featured, latest] = await Promise.all([
    getSettings(),
    getCategoryTree(),
    Product.find({ active: true, featured: true }).select(CARD_FIELDS).sort({ updatedAt: -1 }).limit(8).lean(),
    Product.find({ active: true }).select(CARD_FIELDS).sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  // صف منتجات لأول 4 أقسام (مع أقسامها الفرعية)
  const sections = await Promise.all(
    tree.slice(0, 4).map(async (c) => ({
      cat: c,
      items: plain(
        await Product.find({ active: true, category: { $in: [c._id, ...c.children.map((ch) => ch._id)] } })
          .select(CARD_FIELDS).sort({ createdAt: -1 }).limit(4).lean()
      ),
    }))
  );

  const slides = settings.slides.filter((s) => s.active);
  const store = settings.store;
  const card = (p) => <ProductCard key={p._id} product={p} lang={lang} t={t} money={money} />;

  // بيانات منظمة للموقع (تظهر اسم المتجر وصندوق البحث في Google)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: lang === 'en' ? store.nameEn || store.nameAr : store.nameAr,
    url: appUrl(),
    potentialAction: { '@type': 'SearchAction', target: `${appUrl()}/search?q={query}`, 'query-input': 'required name=query' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {slides.length > 0 ? (
        <Slider slides={slides} />
      ) : (
        <section className="hero fade-in">
          <h1>{lang === 'en' ? store.taglineEn : store.taglineAr}</h1>
          <p>
            {t.deliveryAll}
            {FREE_SHIPPING_OVER > 0 && ` · ${t.freeShippingOver(money(FREE_SHIPPING_OVER))}`}
          </p>
        </section>
      )}

      <div className="trust-bar">
        <div>🚚 <span>{t.deliveryAll}</span></div>
        <div>💵 <span>{t.cod}</span></div>
        <div>🔄 <span>{lang === 'en' ? 'Easy returns' : 'استبدال سهل'}</span></div>
        <div>🔒 <span>{lang === 'en' ? 'Secure shopping' : 'تسوّق آمن'}</span></div>
      </div>

      {tree.length > 0 && (
        <section className="home-section">
          <h2 className="section-title">{t.shopByCategory}</h2>
          <div className="cat-tiles">
            {tree.map((c) => (
              <Link key={c._id} href={`/category/${encodeURIComponent(c.slug)}`} className="cat-tile">
                <span className="cat-tile-icon">{c.image ? <img src={c.image} alt="" /> : c.icon || '🗂️'}</span>
                <span>{pick(c, 'name', lang)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="home-section">
          <h2 className="section-title">⭐ {t.featured}</h2>
          <div className="products">{plain(featured).map(card)}</div>
        </section>
      )}

      <section className="home-section">
        <div className="section-head">
          <h2 className="section-title">{t.newArrivals}</h2>
          <Link href="/search" className="muted">{t.viewAll} ←</Link>
        </div>
        <div className="products">{plain(latest).map(card)}</div>
      </section>

      {sections.filter((s) => s.items.length).map(({ cat, items }) => (
        <section className="home-section" key={cat._id}>
          <div className="section-head">
            <h2 className="section-title">{cat.icon} {pick(cat, 'name', lang)}</h2>
            <Link href={`/category/${encodeURIComponent(cat.slug)}`} className="muted">{t.viewAll} ←</Link>
          </div>
          <div className="products">{items.map(card)}</div>
        </section>
      ))}
    </>
  );
}

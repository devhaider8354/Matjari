import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import Listing from '@/components/Listing';
import { dbConnect, plain } from '@/lib/db';
import { pick } from '@/lib/i18n';
import { readFilters, queryProducts } from '@/lib/listing';
import { getLocale, getLang } from '@/lib/locale';
import { appUrl } from '@/lib/mail';
import Category from '@/models/Category';

export const dynamic = 'force-dynamic';

const getCategory = cache(async (slug) => {
  await dbConnect();
  const cat = await Category.findOne({ slug: decodeURIComponent(slug), active: true }).lean();
  if (!cat) return null;
  const [parent, children] = await Promise.all([
    cat.parent ? Category.findById(cat.parent).lean() : null,
    Category.find({ parent: cat._id, active: true }).sort({ order: 1, name: 1 }).lean(),
  ]);
  return plain({ ...cat, parentCat: parent, children });
});

export async function generateMetadata({ params }) {
  const cat = await getCategory(params.slug);
  if (!cat) return {};
  const lang = getLang();
  const name = pick(cat, 'name', lang);
  return {
    title: cat.seoTitle || name,
    description: cat.seoDescription || pick(cat, 'description', lang) || name,
    alternates: { canonical: `/category/${cat.slug}` },
    openGraph: cat.image ? { images: [cat.image] } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const cat = await getCategory(params.slug);
  if (!cat) notFound();
  const locale = await getLocale();
  const { lang, t } = locale;
  const filters = readFilters(searchParams, locale.currency);
  const ids = [cat._id, ...cat.children.map((c) => c._id)];
  const result = await queryProducts({ category: { $in: ids } }, filters);
  const name = pick(cat, 'name', lang);
  const basePath = `/category/${encodeURIComponent(cat.slug)}`;

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t.home, item: appUrl() },
      ...(cat.parentCat ? [{ '@type': 'ListItem', position: 2, name: pick(cat.parentCat, 'name', lang), item: `${appUrl()}/category/${cat.parentCat.slug}` }] : []),
      { '@type': 'ListItem', position: cat.parentCat ? 3 : 2, name, item: `${appUrl()}${basePath}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <nav className="breadcrumb">
        <Link href="/">{t.home}</Link> /
        {cat.parentCat && <> <Link href={`/category/${encodeURIComponent(cat.parentCat.slug)}`}>{pick(cat.parentCat, 'name', lang)}</Link> /</>}
        <span> {name}</span>
      </nav>
      <header className="category-head">
        <h1>{cat.icon} {name}</h1>
        {pick(cat, 'description', lang) && <p className="muted">{pick(cat, 'description', lang)}</p>}
        {cat.children.length > 0 && (
          <div className="chips">
            {cat.children.map((c) => (
              <Link key={c._id} href={`/category/${encodeURIComponent(c.slug)}`} className="chip">{pick(c, 'name', lang)}</Link>
            ))}
          </div>
        )}
      </header>
      <Listing basePath={basePath} result={result} filters={filters} locale={locale} />
    </>
  );
}

import Listing from '@/components/Listing';
import { readFilters, queryProducts } from '@/lib/listing';
import { getLocale } from '@/lib/locale';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const q = typeof searchParams?.q === 'string' ? searchParams.q.slice(0, 60) : '';
  // صفحات البحث لا تُفهرس حتى لا تُنشئ صفحات مكررة في Google
  return { title: q || 'Search', robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }) {
  const locale = await getLocale();
  const filters = readFilters(searchParams, locale.currency);
  const result = await queryProducts({}, filters);
  return (
    <>
      <h1 style={{ marginTop: 0 }}>
        {filters.q ? `${locale.t.search}: «${filters.q}»` : locale.t.newArrivals}
      </h1>
      <Listing basePath="/search" result={result} filters={filters} locale={locale} />
    </>
  );
}

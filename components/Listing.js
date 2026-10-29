import Link from 'next/link';
import AutoSubmitSelect from './AutoSubmitSelect';
import ProductCard from './ProductCard';

// شبكة منتجات مع تصفية وترتيب وصفحات. تعمل بدون JavaScript (نماذج GET)
export default function Listing({ basePath, result, filters, locale, hidden = {} }) {
  const { t, lang, money, currency } = locale;
  const { items, total, pages, brands } = result;
  const params = (extra) => {
    const p = new URLSearchParams();
    const all = { ...hidden, q: filters.q, sort: filters.sort !== 'new' ? filters.sort : '', min: filters.min || '', max: filters.max || '', brand: filters.brand, stock: filters.inStock ? '1' : '', ...extra };
    for (const [k, v] of Object.entries(all)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div className="listing">
      <aside className="filters-side card">
        <form action={basePath}>
          {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          {filters.q && <input type="hidden" name="q" value={filters.q} />}
          <input type="hidden" name="sort" value={filters.sort} />
          <h4>{t.price} ({currency.symbol})</h4>
          <div className="price-range">
            <input type="number" name="min" min="0" step="any" placeholder={t.min} defaultValue={filters.min || ''} />
            <span>—</span>
            <input type="number" name="max" min="0" step="any" placeholder={t.max} defaultValue={filters.max || ''} />
          </div>
          {brands.length > 0 && (
            <>
              <h4>{t.brand}</h4>
              <select name="brand" defaultValue={filters.brand}>
                <option value="">{t.all}</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </>
          )}
          <label className="checkbox" style={{ margin: '14px 0' }}>
            <input type="checkbox" name="stock" value="1" defaultChecked={filters.inStock} /> {t.inStockOnly}
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" style={{ flex: 1 }}>{t.apply}</button>
            <Link href={params({ min: '', max: '', brand: '', stock: '', page: '' })} className="btn btn-outline btn-sm">{t.clear}</Link>
          </div>
        </form>
      </aside>

      <section>
        <div className="toolbar">
          <span className="muted">{total} {t.results}</span>
          <form action={basePath} className="sort-form">
            {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            {filters.q && <input type="hidden" name="q" value={filters.q} />}
            {filters.min && <input type="hidden" name="min" value={filters.min} />}
            {filters.max && <input type="hidden" name="max" value={filters.max} />}
            {filters.brand && <input type="hidden" name="brand" value={filters.brand} />}
            {filters.inStock && <input type="hidden" name="stock" value="1" />}
            <label className="muted" htmlFor="sort">{t.sort}:</label>
            <AutoSubmitSelect id="sort" name="sort" defaultValue={filters.sort}>
              <option value="new">{t.sortNew}</option>
              <option value="price_asc">{t.sortPriceAsc}</option>
              <option value="price_desc">{t.sortPriceDesc}</option>
              <option value="name">{t.sortName}</option>
            </AutoSubmitSelect>
          </form>
        </div>

        {items.length === 0 ? (
          <div className="empty card">{t.noProducts}</div>
        ) : (
          <div className="products">
            {items.map((p) => <ProductCard key={p._id} product={p} lang={lang} t={t} money={money} />)}
          </div>
        )}

        {pages > 1 && (
          <nav className="pagination" aria-label="pagination">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link key={n} href={params({ page: n > 1 ? n : '' })} className={n === filters.page ? 'active' : ''}>{n}</Link>
            ))}
          </nav>
        )}
      </section>
    </div>
  );
}

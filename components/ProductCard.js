import Link from 'next/link';
import CardImages from './CardImages';
import { thumb } from '@/lib/config';
import { pick } from '@/lib/i18n';

// بطاقة منتج (مكوّن خادم): السعر بعملة الزائر، والاسم بلغته
export default function ProductCard({ product, lang, t, money }) {
  const out = product.stock <= 0;
  const name = pick(product, 'name', lang);
  const prices = product.variants?.map((v) => v.price) || [];
  const ranged = prices.length > 1 && Math.min(...prices) !== Math.max(...prices);
  const discount = product.comparePrice ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;

  return (
    <Link href={`/product/${product._id}`} className="product-card">
      <div className="thumb">
        {product.images?.length > 0 && <CardImages images={product.images.slice(0, 4).map(thumb)} alt={name} />}
        {out ? <span className="tag out">{t.outOfStock}</span> : discount > 0 && <span className="tag">-{discount}%</span>}
      </div>
      <div className="info">
        {product.brand && <div className="card-brand">{product.brand}</div>}
        <h3>{name}</h3>
        <div className="price">
          {ranged && <small className="muted">{t.from} </small>}
          <bdi>{money(product.price)}</bdi>
          {product.comparePrice && <span className="old-price">{money(product.comparePrice)}</span>}
        </div>
      </div>
    </Link>
  );
}

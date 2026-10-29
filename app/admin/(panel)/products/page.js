import mongoose from 'mongoose';
import Link from 'next/link';
import DeleteProductButton from '@/components/admin/DeleteProductButton';
import ProductFilters from '@/components/admin/ProductFilters';
import { adminUrl } from '@/lib/adminPath';
import { getCategoryTree } from '@/lib/catalog';
import { money, thumb } from '@/lib/config';
import { dbConnect, plain } from '@/lib/db';
import { typeOf } from '@/lib/productTypes';
import { escapeRegex } from '@/lib/validate';
import Product from '@/models/Product';
import { requirePermission } from '@/lib/session';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 25;

export default async function AdminProductsPage({ searchParams }) {
  await requirePermission('catalog');
  const sp = searchParams || {};
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 80) : '';
  const cat = mongoose.isValidObjectId(sp.cat) ? sp.cat : '';
  const stock = ['low', 'out'].includes(sp.stock) ? sp.stock : '';
  const status = ['active', 'hidden', 'featured'].includes(sp.status) ? sp.status : '';
  const page = Math.max(1, parseInt(sp.page, 10) || 1);

  const filter = {};
  if (q) {
    // البحث بالاسم أو الماركة، أو مطابقة تامة للـ SKU/الباركود (مفيد مع قارئ الباركود)
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    const code = q.toUpperCase();
    filter.$or = [{ name: rx }, { nameEn: rx }, { brand: rx }, { sku: code }, { barcode: q }, { barcode: code }, { 'variants.sku': code }, { 'variants.barcode': q }];
  }
  if (cat) filter.category = cat;
  if (stock === 'out') filter.stock = 0;
  if (stock === 'low') filter.$expr = { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockAlert'] }] };
  if (status === 'active') filter.active = true;
  if (status === 'hidden') filter.active = false;
  if (status === 'featured') filter.featured = true;

  await dbConnect();
  const [products, total, tree] = await Promise.all([
    Product.find(filter).populate('category', 'name').sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    Product.countDocuments(filter),
    getCategoryTree({ activeOnly: false }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const list = plain(products);
  const pageLink = (n) => adminUrl(`/products?${new URLSearchParams({ ...(q && { q }), ...(cat && { cat }), ...(stock && { stock }), ...(status && { status }), page: n })}`);

  return (
    <>
      <div className="page-head">
        <h1 style={{ margin: 0 }}>المنتجات <span className="muted" style={{ fontSize: 18 }}>({total})</span></h1>
        <Link href={adminUrl('/products/new')} className="btn">+ منتج جديد</Link>
      </div>

      <ProductFilters base={adminUrl('/products')} categories={tree} values={{ q, cat, stock, status }} />

      {list.length === 0 ? (
        <div className="empty card">لا توجد منتجات مطابقة</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>المنتج</th>
                <th>القسم</th>
                <th>السعر</th>
                <th>المخزون</th>
                <th>الحالة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const low = p.stock > 0 && p.stock <= (p.lowStockAlert ?? 3);
                return (
                  <tr key={p._id}>
                    <td>{p.images?.[0] && <img src={thumb(p.images[0])} alt="" />}</td>
                    <td>
                      <Link href={adminUrl(`/products/${p._id}`)}><strong>{p.name}</strong></Link>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {typeOf(p.type).icon} {p.brand || typeOf(p.type).label}
                        {p.sku && <> · <span dir="ltr">{p.sku}</span></>}
                        {p.variants?.length > 0 && <> · {p.variants.length} متغير</>}
                      </div>
                    </td>
                    <td>{p.category?.name || <span className="muted">—</span>}</td>
                    <td>{p.variants?.length > 1 ? 'من ' : ''}{money(p.price)}</td>
                    <td>
                      <span className={`stock-pill ${p.stock === 0 ? 'out' : low ? 'low' : 'ok'}`}>
                        {p.stock === 0 ? 'نفد' : p.stock}
                      </span>
                    </td>
                    <td>
                      {p.active ? <span className="status status-delivered">ظاهر</span> : <span className="status status-cancelled">مخفي</span>}
                      {p.featured && ' ⭐'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={adminUrl(`/products/${p._id}`)} className="btn btn-outline btn-sm">تعديل</Link>
                        <a href={`/product/${p._id}`} target="_blank" className="btn btn-outline btn-sm" title="عرض في المتجر">↗</a>
                        <DeleteProductButton id={p._id} name={p.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="chips" style={{ marginTop: 16, justifyContent: 'center' }}>
          {page > 1 && <Link className="chip" href={pageLink(page - 1)}>السابق</Link>}
          <span className="chip active">{page} / {pages}</span>
          {page < pages && <Link className="chip" href={pageLink(page + 1)}>التالي</Link>}
        </div>
      )}
    </>
  );
}

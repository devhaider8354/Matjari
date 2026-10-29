import Link from 'next/link';
import OrdersTable from '@/components/admin/OrdersTable';
import { ORDER_STATUSES } from '@/lib/config';
import { dbConnect, plain } from '@/lib/db';
import { escapeRegex } from '@/lib/validate';
import Order from '@/models/Order';
import { adminUrl } from '@/lib/adminPath';
import { requirePermission } from '@/lib/session';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 30;

export default async function AdminOrdersPage({ searchParams }) {
  await requirePermission('orders');
  const status = ORDER_STATUSES[searchParams?.status] ? searchParams.status : '';
  const q = typeof searchParams?.q === 'string' ? searchParams.q.trim().slice(0, 50) : '';
  const page = Math.max(1, parseInt(searchParams?.page, 10) || 1);

  const filter = {};
  if (status) filter.status = status;
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    filter.$or = [{ orderNumber: rx }, { 'customer.phone': rx }, { 'customer.name': rx }];
  }

  await dbConnect();
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    Order.countDocuments(filter),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (extra) => {
    const p = new URLSearchParams({ ...(status && { status }), ...(q && { q }), ...extra });
    return adminUrl(`/orders?${p}`);
  };

  return (
    <>
      <div className="page-head">
        <h1 style={{ margin: 0 }}>الطلبات ({total})</h1>
        <form className="search" action={adminUrl('/orders')}>
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="رقم الطلب، الهاتف، الاسم" />
          <button className="btn btn-sm">بحث</button>
        </form>
      </div>
      <div className="chips" style={{ marginBottom: 16 }}>
        <Link href={adminUrl('/orders')} className={`chip ${!status ? 'active' : ''}`}>الكل</Link>
        {Object.entries(ORDER_STATUSES).map(([key, label]) => (
          <Link key={key} href={adminUrl(`/orders?status=${key}`)} className={`chip ${status === key ? 'active' : ''}`}>
            {label}
          </Link>
        ))}
      </div>
      <OrdersTable orders={plain(orders)} />
      {pages > 1 && (
        <div className="chips" style={{ marginTop: 16, justifyContent: 'center' }}>
          {page > 1 && <Link className="chip" href={link({ page: page - 1 })}>السابق</Link>}
          <span className="chip active">{page} / {pages}</span>
          {page < pages && <Link className="chip" href={link({ page: page + 1 })}>التالي</Link>}
        </div>
      )}
    </>
  );
}

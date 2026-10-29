import Link from 'next/link';
import { formatDate, money } from '@/lib/config';
import { dbConnect } from '@/lib/db';
import { escapeRegex } from '@/lib/validate';
import User from '@/models/User';
import { adminUrl } from '@/lib/adminPath';
import { requirePermission } from '@/lib/session';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 30;

export default async function CustomersPage({ searchParams }) {
  await requirePermission('customers');
  const q = typeof searchParams?.q === 'string' ? searchParams.q.trim().slice(0, 60) : '';
  const page = Math.max(1, parseInt(searchParams?.page, 10) || 1);
  const match = { role: 'customer' };
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    match.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  await dbConnect();
  const [customers, total] = await Promise.all([
    User.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * PAGE_SIZE },
      { $limit: PAGE_SIZE },
      {
        $lookup: {
          from: 'orders',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$uid'] }, status: { $ne: 'cancelled' } } },
            { $group: { _id: null, count: { $sum: 1 }, spent: { $sum: '$total' } } },
          ],
          as: 'stats',
        },
      },
      { $project: { name: 1, email: 1, phone: 1, city: 1, disabled: 1, createdAt: 1, stats: { $first: '$stats' } } },
    ]),
    User.countDocuments(match),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div className="page-head">
        <h1 style={{ margin: 0 }}>الزبائن ({total})</h1>
        <form className="search" action={adminUrl('/customers')}>
          <input name="q" defaultValue={q} placeholder="الاسم، البريد، الهاتف" />
          <button className="btn btn-sm">بحث</button>
        </form>
      </div>
      {customers.length === 0 ? (
        <div className="empty card">لا يوجد زبائن مسجّلون</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الزبون</th>
                <th>الهاتف</th>
                <th>المدينة</th>
                <th>الطلبات</th>
                <th>إجمالي المشتريات</th>
                <th>تاريخ التسجيل</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={String(c._id)}>
                  <td>
                    <Link href={adminUrl(`/customers/${c._id}`)}><u>{c.name}</u></Link>
                    <div className="muted" dir="ltr" style={{ fontSize: 12, textAlign: 'right' }}>{c.email}</div>
                  </td>
                  <td dir="ltr">{c.phone || '—'}</td>
                  <td>{c.city || '—'}</td>
                  <td>{c.stats?.count || 0}</td>
                  <td>{money(c.stats?.spent || 0)}</td>
                  <td>{formatDate(c.createdAt)}</td>
                  <td>{c.disabled ? <span className="status status-cancelled">معطّل</span> : <span className="status status-delivered">فعّال</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="chips" style={{ marginTop: 16, justifyContent: 'center' }}>
          {page > 1 && <Link className="chip" href={adminUrl(`/customers?${new URLSearchParams({ ...(q && { q }), page: page - 1 })}`)}>السابق</Link>}
          <span className="chip active">{page} / {pages}</span>
          {page < pages && <Link className="chip" href={adminUrl(`/customers?${new URLSearchParams({ ...(q && { q }), page: page + 1 })}`)}>التالي</Link>}
        </div>
      )}
    </>
  );
}

import mongoose from 'mongoose';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import OrdersTable from '@/components/admin/OrdersTable';
import UserActions from '@/components/admin/UserActions';
import { formatDate, money } from '@/lib/config';
import { dbConnect, plain } from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import { adminUrl } from '@/lib/adminPath';
import { requirePermission } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function CustomerPage({ params }) {
  await requirePermission('customers');
  if (!mongoose.isValidObjectId(params.id)) notFound();
  await dbConnect();
  const customer = await User.findOne({ _id: params.id, role: 'customer' })
    .select('-passwordHash -resetTokenHash -resetTokenExpires')
    .lean();
  if (!customer) notFound();
  const orders = plain(await Order.find({ user: customer._id }).sort({ createdAt: -1 }).lean());
  const valid = orders.filter((o) => o.status !== 'cancelled');
  const spent = valid.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <p style={{ marginTop: 0 }}><Link href={adminUrl('/customers')} className="muted">→ الزبائن</Link></p>
      <div className="page-head">
        <h1 style={{ margin: 0 }}>{customer.name}</h1>
        <UserActions id={String(customer._id)} disabled={customer.disabled} />
      </div>

      <div className="kpis">
        <div className="card kpi"><span className="kpi-label">الطلبات</span><span className="kpi-value">{valid.length}</span></div>
        <div className="card kpi"><span className="kpi-label">إجمالي المشتريات</span><span className="kpi-value">{money(spent)}</span></div>
        <div className="card kpi"><span className="kpi-label">متوسط الطلب</span><span className="kpi-value">{money(valid.length ? spent / valid.length : 0)}</span></div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>بيانات الزبون</h3>
        <div className="info-grid">
          <div><span className="muted">البريد</span><div dir="ltr" style={{ textAlign: 'right' }}>{customer.email}</div></div>
          <div><span className="muted">الهاتف</span><div dir="ltr" style={{ textAlign: 'right' }}>{customer.phone || '—'}</div></div>
          <div><span className="muted">المدينة</span><div>{customer.city || '—'}</div></div>
          <div><span className="muted">العنوان</span><div>{customer.address || '—'}</div></div>
          <div><span className="muted">تاريخ التسجيل</span><div>{formatDate(customer.createdAt)}</div></div>
          <div><span className="muted">آخر دخول</span><div>{customer.lastLoginAt ? formatDate(customer.lastLoginAt) : '—'}</div></div>
        </div>
      </div>

      <h3>طلبات الزبون</h3>
      <OrdersTable orders={orders} />
    </>
  );
}

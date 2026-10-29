import mongoose from 'mongoose';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminNote from '@/components/admin/AdminNote';
import StatusSelect from '@/components/admin/StatusSelect';
import { adminUrl } from '@/lib/adminPath';
import { formatDate, money, ORDER_STATUSES, thumb } from '@/lib/config';
import { dbConnect, plain } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { invoicePath, itemVariant } from '@/lib/orderView';
import { PAPER_SIZES } from '@/lib/siteDefaults';
import Order from '@/models/Order';
import { requirePermission } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AdminOrderPage({ params }) {
  await requirePermission('orders');
  if (!mongoose.isValidObjectId(params.id)) notFound();
  await dbConnect();
  const found = await Order.findById(params.id).lean();
  if (!found) notFound();
  const order = plain(found);
  const cur = order.currency;
  const foreign = cur && cur.rate !== 1;
  const waPhone = order.customer.phone.replace(/\D/g, '').replace(/^0+/, '');
  const inv = invoicePath(order.orderNumber);

  return (
    <>
      <p style={{ marginTop: 0 }}><Link href={adminUrl('/orders')} className="muted">→ الطلبات</Link></p>
      <div className="page-head">
        <div>
          <h1 style={{ margin: 0 }}>طلب <span dir="ltr">{order.orderNumber}</span></h1>
          <p className="muted" style={{ margin: 0 }}>{formatDate(order.createdAt)} · الدفع عند الاستلام{order.lang === 'en' && ' · English'}</p>
        </div>
        <StatusSelect orderId={order._id} status={order.status} />
      </div>

      <div className="card invoice-bar">
        <strong>🧾 الوصل:</strong>
        {Object.keys(PAPER_SIZES).map((k) => (
          <a key={k} href={`${inv}&size=${encodeURIComponent(k)}`} target="_blank" className="btn btn-outline btn-sm">{k}</a>
        ))}
        <a
          className="btn btn-sm wa-btn"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`مرحباً ${order.customer.name}، هذه فاتورة طلبك رقم ${order.orderNumber}:\n${process.env.APP_URL || ''}${inv}`)}`}
        >
          💬 إرسال للزبون واتساب
        </a>
      </div>

      <div className="layout-2">
        <div className="card">
          <h3>المنتجات</h3>
          {order.items.map((i, idx) => (
            <div className="cart-item" key={idx}>
              {i.image ? <img src={thumb(i.image)} alt="" /> : <div />}
              <div>
                <strong>{i.name}</strong>
                {itemVariant(i) && <div className="muted" style={{ fontSize: 14 }}>{itemVariant(i)}</div>}
                {(i.sku || i.barcode) && <div className="muted" dir="ltr" style={{ fontSize: 12, textAlign: 'right' }}>{[i.sku, i.barcode].filter(Boolean).join(' · ')}</div>}
                <div>{money(i.price)} × {i.qty}</div>
              </div>
              <strong>{money(i.price * i.qty)}</strong>
            </div>
          ))}
          <div className="summary-row"><span>المجموع</span><span>{money(order.subtotal)}</span></div>
          <div className="summary-row"><span>الشحن</span><span>{money(order.shipping)}</span></div>
          <div className="summary-row total"><span>المطلوب تحصيله</span><span>{money(order.total)}</span></div>
          {foreign && (
            <div className="alert alert-success" style={{ marginTop: 10 }}>
              الزبون طلب بعملة {cur.code}: يُحصَّل <strong>{formatMoney(order.total, cur)}</strong> (سعر الصرف وقت الطلب {cur.rate})
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>العميل</h3>
            <p><strong>{order.customer.name}</strong></p>
            <p dir="ltr" style={{ textAlign: 'right' }}>{order.customer.phone}</p>
            <p>{order.customer.city}<br />{order.customer.address}</p>
            {order.customer.notes && <p className="muted">ملاحظات: {order.customer.notes}</p>}
            <p className="muted" style={{ fontSize: 14 }}>
              {order.user ? <Link href={adminUrl(`/customers/${order.user}`)}><u>👤 زبون مسجّل — عرض حسابه</u></Link> : 'طلب زائر (بدون حساب)'}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a className="btn btn-sm" href={`tel:${order.customer.phone}`}>📞 اتصال</a>
              <a className="btn btn-sm btn-outline" href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer">واتساب</a>
            </div>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>ملاحظة داخلية</h3>
            <AdminNote orderId={order._id} initial={order.adminNote || ''} />
          </div>
          {order.history?.length > 0 && (
            <div className="card">
              <h3>سجل الحالة</h3>
              <ul className="timeline">
                <li><span className="status status-pending">{ORDER_STATUSES.pending}</span> {formatDate(order.createdAt)}</li>
                {order.history.map((h, i) => (
                  <li key={i}><span className={`status status-${h.status}`}>{ORDER_STATUSES[h.status]}</span> {formatDate(h.at)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

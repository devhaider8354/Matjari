import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDate, thumb } from '@/lib/config';
import { plain } from '@/lib/db';
import { ORDER_STATUS_LABELS } from '@/lib/i18n';
import { getLocale } from '@/lib/locale';
import { invoicePath, itemVariant, orderMoney } from '@/lib/orderView';
import { getCurrentUser } from '@/lib/session';
import Order from '@/models/Order';

const STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

export default async function MyOrderPage({ params }) {
  const user = await getCurrentUser();
  const { t, lang } = await getLocale();
  // الزبون يرى طلباته فقط
  const found = await Order.findOne({ orderNumber: String(params.number).toUpperCase(), user: user._id }).lean();
  if (!found) notFound();
  const order = plain(found);
  const money = orderMoney(order);
  const labels = ORDER_STATUS_LABELS[lang];
  const stepIndex = STEPS.indexOf(order.status);

  return (
    <div className="card">
      <p style={{ marginTop: 0 }}><Link href="/account/orders" className="muted">← {lang === 'en' ? 'My orders' : 'طلباتي'}</Link></p>
      <div className="page-head">
        <h2 style={{ margin: 0 }}>{t.orderNo} <span dir="ltr">{order.orderNumber}</span></h2>
        <a href={invoicePath(order.orderNumber)} target="_blank" className="btn btn-outline btn-sm">🧾 {t.invoice}</a>
      </div>
      <p className="muted">{formatDate(order.createdAt)} · {t.cod}</p>

      {order.status === 'cancelled' ? (
        <div className="alert alert-error">{labels.cancelled}</div>
      ) : (
        <ol className="progress">
          {STEPS.map((s, i) => <li key={s} className={i <= stepIndex ? 'done' : ''}>{labels[s]}</li>)}
        </ol>
      )}

      {order.items.map((i, idx) => (
        <div className="cart-item" key={idx}>
          {i.image ? <img src={thumb(i.image)} alt="" /> : <div />}
          <div>
            <strong>{i.name}</strong>
            {itemVariant(i) && <div className="muted" style={{ fontSize: 14 }}>{itemVariant(i)}</div>}
            <div>{money(i.price)} × {i.qty}</div>
          </div>
          <strong>{money(i.price * i.qty)}</strong>
        </div>
      ))}
      <div className="summary-row"><span>{t.subtotal}</span><span>{money(order.subtotal)}</span></div>
      <div className="summary-row"><span>{t.shipping}</span><span>{order.shipping === 0 ? t.free : money(order.shipping)}</span></div>
      <div className="summary-row total"><span>{t.total}</span><span>{money(order.total)}</span></div>

      <h3 style={{ marginTop: 20 }}>{t.deliveryInfo}</h3>
      <p style={{ margin: 0 }}>{order.customer.name} · <span dir="ltr">{order.customer.phone}</span></p>
      <p className="muted" style={{ margin: 0 }}>{order.customer.city} — {order.customer.address}</p>
    </div>
  );
}

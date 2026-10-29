import Link from 'next/link';
import { notFound } from 'next/navigation';
import { dbConnect } from '@/lib/db';
import { ORDER_STATUS_LABELS } from '@/lib/i18n';
import { getLocale } from '@/lib/locale';
import { invoicePath, itemVariant, orderMoney } from '@/lib/orderView';
import Order from '@/models/Order';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Order', robots: { index: false } };

// صفحة الشكر بعد الطلب. لا تعرض الهاتف أو العنوان لأن رابطها قد يُشارك
export default async function OrderPage({ params }) {
  const { t, lang } = await getLocale();
  await dbConnect();
  const order = await Order.findOne({ orderNumber: String(params.number).toUpperCase() }).lean();
  if (!order) notFound();
  const money = orderMoney(order);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="card fade-in" style={{ textAlign: 'center', marginBottom: 18 }}>
        <div className="success-check">✓</div>
        <h1>{t.thanks(order.customer.name.split(' ')[0])}</h1>
        <p className="muted">{t.willCall}</p>
        <p>
          {t.orderNo}: <strong dir="ltr">{order.orderNumber}</strong>{' · '}
          <span className={`status status-${order.status}`}>{ORDER_STATUS_LABELS[lang][order.status]}</span>
        </p>
        <p className="muted" style={{ fontSize: 14 }}>{t.keepNumber}</p>
      </div>

      <div className="card">
        {order.items.map((i, idx) => (
          <div className="summary-row" key={idx}>
            <span>
              {i.name} × {i.qty}
              {itemVariant(i) && <span className="muted"> ({itemVariant(i)})</span>}
            </span>
            <span>{money(i.price * i.qty)}</span>
          </div>
        ))}
        <div className="summary-row"><span>{t.shipping}</span><span>{order.shipping === 0 ? t.free : money(order.shipping)}</span></div>
        <div className="summary-row total"><span>{t.totalOnDelivery}</span><span>{money(order.total)}</span></div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href={invoicePath(order.orderNumber)} target="_blank" className="btn btn-outline">🧾 {t.invoice}</a>
        <Link href="/" className="btn">{t.continueShopping}</Link>
      </p>
    </div>
  );
}

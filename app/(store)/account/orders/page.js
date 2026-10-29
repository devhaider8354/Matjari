import Link from 'next/link';
import { formatDate } from '@/lib/config';
import { plain } from '@/lib/db';
import { ORDER_STATUS_LABELS } from '@/lib/i18n';
import { getLang } from '@/lib/locale';
import { orderMoney } from '@/lib/orderView';
import { getCurrentUser } from '@/lib/session';
import Order from '@/models/Order';

export default async function MyOrdersPage() {
  const user = await getCurrentUser();
  const lang = getLang();
  const en = lang === 'en';
  const orders = plain(await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(100).lean());

  return (
    <div className="card">
      <h2>{en ? 'My orders' : 'طلباتي'}</h2>
      {orders.length === 0 ? (
        <div className="empty" style={{ padding: 30 }}>
          {en ? 'No orders yet.' : 'لا توجد طلبات بعد.'} <Link href="/"><u>{en ? 'Start shopping' : 'ابدأ التسوق'}</u></Link>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((o) => (
            <Link key={o._id} href={`/account/orders/${o.orderNumber}`} className="order-row">
              <div>
                <strong dir="ltr">{o.orderNumber}</strong>
                <div className="muted" style={{ fontSize: 13 }}>
                  {formatDate(o.createdAt)} · {o.items.reduce((s, i) => s + i.qty, 0)} {en ? 'items' : 'قطعة'}
                </div>
              </div>
              <span className={`status status-${o.status}`}>{ORDER_STATUS_LABELS[lang][o.status]}</span>
              <strong>{orderMoney(o)(o.total)}</strong>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

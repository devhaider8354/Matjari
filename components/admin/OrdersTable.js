import Link from 'next/link';
import { formatDate, money, ORDER_STATUSES } from '@/lib/config';
import { adminUrl } from '@/lib/adminPath';

export default function OrdersTable({ orders }) {
  if (!orders.length) return <div className="empty card">لا توجد طلبات</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>رقم الطلب</th>
            <th>العميل</th>
            <th>الهاتف</th>
            <th>المدينة</th>
            <th>الإجمالي</th>
            <th>الحالة</th>
            <th>التاريخ</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td><Link href={adminUrl(`/orders/${o._id}`)}><u dir="ltr">{o.orderNumber}</u></Link></td>
              <td>{o.customer.name}</td>
              <td dir="ltr">{o.customer.phone}</td>
              <td>{o.customer.city}</td>
              <td>{money(o.total)}</td>
              <td><span className={`status status-${o.status}`}>{ORDER_STATUSES[o.status]}</span></td>
              <td>{formatDate(o.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

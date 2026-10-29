import Link from 'next/link';
import OrdersTable from '@/components/admin/OrdersTable';
import { CountUp, SalesChart, StatusDonut } from '@/components/admin/DashboardWidgets';
import { adminUrl } from '@/lib/adminPath';
import { ORDER_STATUSES, thumb } from '@/lib/config';
import { dbConnect, plain } from '@/lib/db';
import Category from '@/models/Category';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

const DAYS = 14;
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
const dayKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
const STATUS_COLORS = { pending: '#f59e0b', confirmed: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#94a3b8' };

const pctChange = (now, before) => (!before ? (now ? 100 : 0) : Math.round(((now - before) / before) * 100));

function greeting() {
  const h = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: TZ }).format(new Date()));
  return h < 12 ? 'صباح الخير' : 'مساء الخير';
}

export default async function AdminDashboard({ searchParams }) {
  const denied = searchParams?.denied === '1';
  await dbConnect();
  const now = new Date();
  const since = new Date(now.getTime() - (DAYS - 1) * 864e5);
  since.setHours(0, 0, 0, 0);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const valid = { status: { $ne: 'cancelled' } };
  const sum = (match) => Order.aggregate([{ $match: { ...match, ...valid } }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]);

  const [daily, today, thisMonth, prevMonth, byStatus, customers, newCustomers, productStats, lowStock, recent, topProducts, byCategory] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: since }, ...valid } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    sum({ createdAt: { $gte: todayStart } }),
    sum({ createdAt: { $gte: monthStart } }),
    sum({ createdAt: { $gte: prevMonthStart, $lt: monthStart } }),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: monthStart } }),
    Product.aggregate([{ $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: ['$active', 1, 0] } }, out: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } }, units: { $sum: '$stock' }, value: { $sum: { $multiply: ['$stock', '$price'] } } } }]),
    Product.find({ active: true, $expr: { $lte: ['$stock', '$lowStockAlert'] } }).select('name stock images').sort({ stock: 1 }).limit(6).lean(),
    Order.find().sort({ createdAt: -1 }).limit(8).lean(),
    Order.aggregate([
      { $match: { createdAt: { $gte: monthStart }, ...valid } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, image: { $first: '$items.image' }, qty: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } } } },
      { $sort: { qty: -1 } },
      { $limit: 5 },
    ]),
    Product.aggregate([{ $match: { active: true } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 6 }]),
  ]);

  const cats = await Category.find({ _id: { $in: byCategory.map((c) => c._id).filter(Boolean) } }).select('name icon').lean();
  const catName = Object.fromEntries(cats.map((c) => [String(c._id), `${c.icon || ''} ${c.name}`]));
  const catMax = Math.max(1, ...byCategory.map((c) => c.count));

  const cur = thisMonth[0] || { revenue: 0, orders: 0 };
  const prev = prevMonth[0] || { revenue: 0, orders: 0 };
  const day = today[0] || { revenue: 0, orders: 0 };
  const ps = productStats[0] || { total: 0, active: 0, out: 0, units: 0, value: 0 };
  const byDay = Object.fromEntries(daily.map((d) => [d._id, d]));
  const series = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(since.getTime() + i * 864e5);
    const key = dayKey(d);
    return { key, label: d.getDate(), revenue: byDay[key]?.revenue || 0, orders: byDay[key]?.orders || 0 };
  });
  const revenueChange = pctChange(cur.revenue, prev.revenue);
  const ordersChange = pctChange(cur.orders, prev.orders);
  const statusCounts = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
  const donut = Object.keys(ORDER_STATUSES).map((k) => ({ key: k, label: ORDER_STATUSES[k], count: statusCounts[k] || 0, color: STATUS_COLORS[k] }));

  return (
    <>
      {denied && <div className="alert alert-error">⛔ ليست لديك صلاحية لفتح تلك الصفحة. اطلب الصلاحية من صاحب المتجر.</div>}
      <div className="page-head dash-hero fade-in">
        <div>
          <h1 style={{ margin: 0 }}>{greeting()} 👋</h1>
          <p className="muted" style={{ margin: 0 }}>
            {new Intl.DateTimeFormat('ar-EG-u-nu-latn', { dateStyle: 'full', timeZone: TZ }).format(now)} — اليوم:{' '}
            <strong>{day.orders}</strong> طلب بقيمة <strong><CountUp value={day.revenue} money /></strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={adminUrl('/orders?status=pending')} className="btn btn-outline">📦 مراجعة الطلبات</Link>
          <Link href={adminUrl('/products/new')} className="btn">+ منتج جديد</Link>
        </div>
      </div>

      <div className="kpis">
        <div className="card kpi kpi-anim" style={{ '--d': '0ms' }}>
          <span className="kpi-icon" style={{ background: '#dbeafe' }}>💰</span>
          <span className="kpi-label">مبيعات الشهر</span>
          <span className="kpi-value"><CountUp value={cur.revenue} money /></span>
          <span className={`kpi-trend ${revenueChange >= 0 ? 'up' : 'down'}`}>{revenueChange >= 0 ? '▲' : '▼'} {Math.abs(revenueChange)}% عن الشهر الماضي</span>
        </div>
        <div className="card kpi kpi-anim" style={{ '--d': '80ms' }}>
          <span className="kpi-icon" style={{ background: '#ede9fe' }}>🧾</span>
          <span className="kpi-label">طلبات الشهر</span>
          <span className="kpi-value"><CountUp value={cur.orders} /></span>
          <span className={`kpi-trend ${ordersChange >= 0 ? 'up' : 'down'}`}>{ordersChange >= 0 ? '▲' : '▼'} {Math.abs(ordersChange)}% · متوسط الطلب <CountUp value={cur.orders ? cur.revenue / cur.orders : 0} money /></span>
        </div>
        <Link href={adminUrl('/orders?status=pending')} className="card kpi kpi-link kpi-anim" style={{ '--d': '160ms' }}>
          <span className="kpi-icon" style={{ background: '#fef3c7' }}>⏳</span>
          <span className="kpi-label">بانتظار المراجعة</span>
          <span className="kpi-value" style={{ color: statusCounts.pending ? 'var(--accent)' : undefined }}><CountUp value={statusCounts.pending || 0} /></span>
          <span className="kpi-sub">اضغط للمراجعة ←</span>
        </Link>
        <Link href={adminUrl('/customers')} className="card kpi kpi-link kpi-anim" style={{ '--d': '240ms' }}>
          <span className="kpi-icon" style={{ background: '#dcfce7' }}>👥</span>
          <span className="kpi-label">الزبائن المسجّلون</span>
          <span className="kpi-value"><CountUp value={customers} /></span>
          <span className="kpi-sub">+{newCustomers} هذا الشهر</span>
        </Link>
        <Link href={adminUrl('/products')} className="card kpi kpi-link kpi-anim" style={{ '--d': '320ms' }}>
          <span className="kpi-icon" style={{ background: '#fce7f3' }}>🏷️</span>
          <span className="kpi-label">المنتجات</span>
          <span className="kpi-value"><CountUp value={ps.total} /></span>
          <span className="kpi-sub">{ps.active} ظاهر · {ps.out} نفد · قيمة المخزون <CountUp value={ps.value} money /></span>
        </Link>
      </div>

      <div className="dash-grid">
        <div className="card fade-in">
          <div className="page-head" style={{ marginBottom: 4 }}>
            <h3 style={{ margin: 0 }}>المبيعات — آخر {DAYS} يوماً</h3>
            <span className="muted" style={{ fontSize: 13 }}>الإجمالي <CountUp value={series.reduce((s, d) => s + d.revenue, 0)} money /></span>
          </div>
          <SalesChart series={series} />
        </div>
        <div className="card fade-in">
          <h3 style={{ marginTop: 0 }}>حالات الطلبات</h3>
          <StatusDonut data={donut} />
        </div>
      </div>

      <div className="dash-grid-3">
        <div className="card fade-in">
          <h3 style={{ marginTop: 0 }}>🏆 الأكثر مبيعاً هذا الشهر</h3>
          {topProducts.length === 0 ? <p className="muted">لا توجد مبيعات بعد</p> : topProducts.map((p, i) => (
            <div className="rank-row" key={String(p._id) + i}>
              <span className="rank">{i + 1}</span>
              {p.image ? <img src={thumb(p.image)} alt="" /> : <span />}
              <span className="rank-name">{p.name}</span>
              <span className="muted">{p.qty} قطعة</span>
            </div>
          ))}
        </div>
        <div className="card fade-in">
          <h3 style={{ marginTop: 0 }}>🗂️ المنتجات حسب القسم</h3>
          {byCategory.map((c) => (
            <div className="hbar" key={String(c._id)}>
              <div className="hbar-label"><span>{catName[String(c._id)] || 'بدون قسم'}</span><strong>{c.count}</strong></div>
              <div className="hbar-track"><div className="hbar-fill" style={{ width: `${(c.count / catMax) * 100}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="card fade-in">
          <h3 style={{ marginTop: 0, color: lowStock.length ? 'var(--accent)' : undefined }}>⚠️ مخزون منخفض</h3>
          {lowStock.length === 0 ? <p className="muted">كل المنتجات بمخزون جيد ✓</p> : plain(lowStock).map((p) => (
            <div className="rank-row" key={p._id}>
              {p.images?.[0] ? <img src={thumb(p.images[0])} alt="" /> : <span />}
              <Link href={adminUrl(`/products/${p._id}`)} className="rank-name"><u>{p.name}</u></Link>
              <span className={`stock-pill ${p.stock === 0 ? 'out' : 'low'}`}>{p.stock === 0 ? 'نفد' : p.stock}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="page-head" style={{ marginTop: 24 }}>
        <h3 style={{ margin: 0 }}>أحدث الطلبات</h3>
        <Link href={adminUrl('/orders')} className="btn btn-outline btn-sm">كل الطلبات</Link>
      </div>
      <OrdersTable orders={plain(recent)} />
    </>
  );
}

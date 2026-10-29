import Link from 'next/link';
import { adminUrl } from '@/lib/adminPath';
import { formatDate } from '@/lib/config';
import { dbConnect, plain } from '@/lib/db';
import { requirePermission } from '@/lib/session';
import { escapeRegex } from '@/lib/validate';
import AuditLog from '@/models/AuditLog';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 50;

const GROUPS = {
  '': 'الكل',
  auth: 'تسجيل الدخول',
  product: 'المنتجات',
  category: 'الأقسام',
  order: 'الطلبات',
  settings: 'الإعدادات',
  team: 'الفريق',
  user: 'الحسابات',
  security: 'الأمان',
};

export default async function AuditPage({ searchParams }) {
  await requirePermission('team');
  const group = GROUPS[searchParams?.g] ? searchParams.g : '';
  const q = typeof searchParams?.q === 'string' ? searchParams.q.trim().slice(0, 60) : '';
  const failed = searchParams?.failed === '1';
  const page = Math.max(1, parseInt(searchParams?.page, 10) || 1);

  const filter = {};
  if (group) filter.action = { $regex: `^${group}\\.` };
  if (failed) filter.ok = false;
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    filter.$or = [{ actorEmail: rx }, { actorName: rx }, { ip: rx }, { target: rx }, { label: rx }];
  }

  await dbConnect();
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ at: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    AuditLog.countDocuments(filter),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (extra) => adminUrl(`/audit?${new URLSearchParams({ ...(group && { g: group }), ...(q && { q }), ...(failed && { failed: '1' }), ...extra })}`);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 style={{ margin: 0 }}>سجل النشاط</h1>
          <p className="muted" style={{ margin: 0 }}>كل عمليات الإدارة ومحاولات الدخول، وتُحفظ 180 يوماً.</p>
        </div>
        <form className="search" action={adminUrl('/audit')}>
          {group && <input type="hidden" name="g" value={group} />}
          <input name="q" defaultValue={q} placeholder="البريد، IP، العنصر" />
          <button className="btn btn-sm">بحث</button>
        </form>
      </div>
      <div className="chips" style={{ marginBottom: 14 }}>
        {Object.entries(GROUPS).map(([k, l]) => (
          <Link key={k} href={adminUrl(`/audit${k ? `?g=${k}` : ''}`)} className={`chip ${group === k ? 'active' : ''}`}>{l}</Link>
        ))}
        <Link href={link({ failed: failed ? '' : '1' })} className={`chip ${failed ? 'active' : ''}`}>⚠️ الفاشلة فقط</Link>
      </div>
      {logs.length === 0 ? (
        <div className="empty card">لا يوجد نشاط مسجّل</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>الوقت</th><th>المستخدم</th><th>العملية</th><th>العنصر</th><th>IP</th></tr></thead>
            <tbody>
              {plain(logs).map((l) => (
                <tr key={l._id} className={l.ok ? '' : 'row-failed'}>
                  <td>{formatDate(l.at)}</td>
                  <td>
                    {l.actorName || '—'}
                    <div className="muted" dir="ltr" style={{ fontSize: 12, textAlign: 'right' }}>{l.actorEmail}</div>
                  </td>
                  <td>{l.ok ? '' : '⚠️ '}{l.label}{l.details && <div className="muted" style={{ fontSize: 12 }}>{l.details}</div>}</td>
                  <td dir="ltr" style={{ fontSize: 12 }}>{l.target || '—'}</td>
                  <td dir="ltr" style={{ fontSize: 12 }}>{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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

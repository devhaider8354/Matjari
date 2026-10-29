import { notFound } from 'next/navigation';
import Link from 'next/link';
import AddAdminForm from '@/components/admin/AddAdminForm';
import EditPermissions from '@/components/admin/EditPermissions';
import UserActions from '@/components/admin/UserActions';
import { adminUrl } from '@/lib/adminPath';
import { formatDate } from '@/lib/config';
import { dbConnect } from '@/lib/db';
import { isOwner, PERMISSIONS } from '@/lib/permissions';
import { requirePermission } from '@/lib/session';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  if (process.env.DEMO_MODE === 'true') notFound();
  const me = await requirePermission('team');
  await dbConnect();
  const admins = await User.find({ role: 'admin' })
    .select('name email role disabled lastLoginAt lastLoginIp createdAt permissions twoFactorEnabled')
    .sort({ createdAt: 1 })
    .lean();
  const meOwner = isOwner(me);

  return (
    <>
      <div className="page-head">
        <h1 style={{ margin: 0 }}>فريق الإدارة</h1>
        <Link href={adminUrl('/audit')} className="btn btn-outline btn-sm">📜 سجل النشاط</Link>
      </div>
      <div className="dash-grid">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>المدير</th><th>الصلاحيات</th><th>آخر دخول</th><th>الحالة</th><th></th></tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const owner = isOwner(a);
                const self = String(a._id) === String(me._id);
                return (
                  <tr key={String(a._id)}>
                    <td>
                      <strong>{a.name}</strong> {a.twoFactorEnabled && <span title="التحقق بخطوتين مفعّل">🔐</span>}
                      <div className="muted" dir="ltr" style={{ fontSize: 12, textAlign: 'right' }}>{a.email}</div>
                    </td>
                    <td style={{ whiteSpace: 'normal', maxWidth: 220 }}>
                      {owner ? <span className="status status-confirmed">كل الصلاحيات</span> : (a.permissions || []).map((p) => (
                        <span key={p} className="perm-tag">{PERMISSIONS[p]?.label || p}</span>
                      ))}
                    </td>
                    <td>
                      {a.lastLoginAt ? formatDate(a.lastLoginAt) : '—'}
                      {a.lastLoginIp && <div className="muted" dir="ltr" style={{ fontSize: 12, textAlign: 'right' }}>{a.lastLoginIp}</div>}
                    </td>
                    <td>{a.disabled ? <span className="status status-cancelled">معطّل</span> : <span className="status status-delivered">فعّال</span>}</td>
                    <td>
                      {!self && (meOwner || !owner) && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <EditPermissions id={String(a._id)} initial={owner ? ['*'] : a.permissions} allowOwner={meOwner} />
                          <UserActions id={String(a._id)} disabled={a.disabled} />
                        </div>
                      )}
                      {self && <span className="muted" style={{ fontSize: 13 }}>(أنت)</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>إضافة مدير</h3>
          <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
            أعطه كلمة مرور مؤقتة، وسيُطلب منه تغييرها عند أول دخول. ينصح بتفعيل التحقق بخطوتين لكل المدراء.
          </p>
          <AddAdminForm allowOwner={meOwner} />
        </div>
      </div>
    </>
  );
}

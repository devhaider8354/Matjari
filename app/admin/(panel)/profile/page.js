import { isDemoAccount, DEMO_LOCK_MESSAGE } from '@/lib/demo';
import ChangeEmailForm from '@/components/admin/ChangeEmailForm';
import TwoFactorSetup from '@/components/admin/TwoFactorSetup';
import { ChangePasswordForm } from '@/components/auth/forms';
import { formatDate } from '@/lib/config';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
  const me = await requireAdmin();
  if (isDemoAccount(me)) return <><h1>حساب العرض</h1><div className="card"><p>{DEMO_LOCK_MESSAGE}</p><p dir="ltr">{me.email}</p></div></>;
  return (
    <>
      <h1>حسابي والأمان</h1>
      <div className="dash-grid">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>🔑 تغيير كلمة المرور</h3>
            <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
              بعد التغيير يتم تسجيل خروجك من جميع الأجهزة الأخرى تلقائياً.
            </p>
            <ChangePasswordForm />
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>🔐 التحقق بخطوتين (2FA)</h3>
            <TwoFactorSetup enabled={Boolean(me.twoFactorEnabled)} />
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>✉️ تغيير البريد والاسم</h3>
            <ChangeEmailForm name={me.name} email={me.email} />
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>معلومات الحساب</h3>
          <div className="info-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div><span className="muted">الاسم</span><div>{me.name}</div></div>
            <div><span className="muted">البريد</span><div dir="ltr" style={{ textAlign: 'right' }}>{me.email}</div></div>
            <div><span className="muted">آخر دخول</span><div>{me.lastLoginAt ? formatDate(me.lastLoginAt) : '—'}</div></div>
            <div><span className="muted">من عنوان IP</span><div dir="ltr" style={{ textAlign: 'right' }}>{me.lastLoginIp || '—'}</div></div>
          </div>
        </div>
      </div>
    </>
  );
}

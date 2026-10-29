import { ChangePasswordForm } from '@/components/auth/forms';
import { formatDate } from '@/lib/config';
import { getLang } from '@/lib/locale';
import { getCurrentUser } from '@/lib/session';

export default async function SecurityPage() {
  const user = await getCurrentUser();
  const en = getLang() === 'en';
  return (
    <div className="card">
      <h2>{en ? 'Security & password' : 'الأمان وكلمة المرور'}</h2>
      {user.lastLoginAt && (
        <p className="muted" style={{ marginTop: 0 }}>{en ? 'Last sign-in' : 'آخر تسجيل دخول'}: {formatDate(user.lastLoginAt)}</p>
      )}
      <ChangePasswordForm />
    </div>
  );
}

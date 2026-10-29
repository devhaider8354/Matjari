import ProfileForm from '@/components/account/ProfileForm';
import { getLang } from '@/lib/locale';
import { getCurrentUser, publicUser } from '@/lib/session';

export default async function AccountPage() {
  const user = await getCurrentUser();
  const en = getLang() === 'en';
  return (
    <div className="card">
      <h2>{en ? 'My details' : 'معلوماتي'}</h2>
      <p className="muted" style={{ marginTop: 0 }}>{en ? 'Used to autofill your checkout.' : 'تُستخدم هذه البيانات لملء نموذج الطلب تلقائياً.'}</p>
      <ProfileForm user={publicUser(user)} />
    </div>
  );
}

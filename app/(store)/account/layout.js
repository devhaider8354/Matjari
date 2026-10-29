import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/auth/forms';
import NavLinks from '@/components/NavLinks';
import { getLang } from '@/lib/locale';
import { getCurrentUser } from '@/lib/session';

export const metadata = { title: 'Account', robots: { index: false } };

export default async function AccountLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account');
  const en = getLang() === 'en';
  const links = [
    { href: '/account', label: en ? '👤 My details' : '👤 معلوماتي', exact: true },
    { href: '/account/orders', label: en ? '📦 My orders' : '📦 طلباتي' },
    { href: '/account/security', label: en ? '🔒 Security & password' : '🔒 الأمان وكلمة المرور' },
  ];

  return (
    <div className="account-layout fade-in">
      <aside className="card account-nav">
        <div className="account-user">
          <div className="avatar">{user.name.trim()[0]}</div>
          <div>
            <strong>{user.name}</strong>
            <div className="muted" dir="ltr" style={{ fontSize: 13 }}>{user.email}</div>
          </div>
        </div>
        <NavLinks links={links} />
        <LogoutButton className="btn btn-outline btn-sm btn-block" />
      </aside>
      <section>{children}</section>
    </div>
  );
}

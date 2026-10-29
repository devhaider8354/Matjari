import { ResetForm } from '@/components/auth/forms';
import { adminUrl } from '@/lib/adminPath';

export const metadata = { title: 'تعيين كلمة مرور جديدة' };

export default function AdminResetPage({ searchParams }) {
  const token = typeof searchParams?.token === 'string' ? searchParams.token : '';
  return (
    <>
      <h2>تعيين كلمة مرور جديدة</h2>
      <ResetForm token={token} loginHref={adminUrl('/login')} />
    </>
  );
}

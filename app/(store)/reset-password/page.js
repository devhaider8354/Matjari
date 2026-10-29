import { ResetForm } from '@/components/auth/forms';
import { getLang } from '@/lib/locale';

export const metadata = { title: 'New password', robots: { index: false } };

export default function ResetPasswordPage({ searchParams }) {
  const token = typeof searchParams?.token === 'string' ? searchParams.token : '';
  return (
    <div className="auth-card card fade-in">
      <h1>{getLang() === 'en' ? 'Set a new password' : 'تعيين كلمة مرور جديدة'}</h1>
      <ResetForm token={token} loginHref="/login" />
    </div>
  );
}

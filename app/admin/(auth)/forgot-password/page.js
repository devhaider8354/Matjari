import Link from 'next/link';
import { ForgotForm } from '@/components/auth/forms';
import { adminUrl } from '@/lib/adminPath';

export const metadata = { title: 'استعادة كلمة المرور' };

export default function AdminForgotPage() {
  return (
    <>
      <h2>استعادة كلمة المرور</h2>
      <ForgotForm />
      <p className="auth-switch"><Link href={adminUrl('/login')}>العودة لتسجيل الدخول</Link></p>
    </>
  );
}

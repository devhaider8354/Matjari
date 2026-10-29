import Link from 'next/link';
import { ForgotForm } from '@/components/auth/forms';
import { getLang } from '@/lib/locale';

export const metadata = { title: 'Reset password', robots: { index: false } };

export default function ForgotPasswordPage() {
  const en = getLang() === 'en';
  return (
    <div className="auth-card card fade-in">
      <h1>{en ? 'Reset password' : 'استعادة كلمة المرور'}</h1>
      <ForgotForm />
      <p className="auth-switch"><Link href="/login">{en ? 'Back to sign in' : 'العودة لتسجيل الدخول'}</Link></p>
    </div>
  );
}

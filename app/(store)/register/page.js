import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/auth/forms';
import { getLang } from '@/lib/locale';
import { getCurrentUser } from '@/lib/session';

export const metadata = { title: 'Register', robots: { index: false } };

export default async function RegisterPage({ searchParams }) {
  if (await getCurrentUser()) redirect('/account');
  const en = getLang() === 'en';
  const next = typeof searchParams?.next === 'string' ? searchParams.next : '';
  return (
    <div className="auth-card card fade-in">
      <h1>{en ? 'Create account' : 'إنشاء حساب'}</h1>
      <p className="muted" style={{ marginTop: 0 }}>{en ? 'Save your address and track your orders easily.' : 'احفظ عنوانك وتابع طلباتك بسهولة.'}</p>
      <RegisterForm next={next} />
      <p className="auth-switch">
        {en ? 'Have an account?' : 'لديك حساب؟'} <Link href="/login">{en ? 'Sign in' : 'سجّل الدخول'}</Link>
      </p>
    </div>
  );
}

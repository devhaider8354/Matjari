import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/forms';
import { getLang } from '@/lib/locale';
import { getCurrentUser } from '@/lib/session';

export const metadata = { title: 'Login', robots: { index: false } };

export default async function LoginPage({ searchParams }) {
  if (await getCurrentUser()) redirect('/account');
  const en = getLang() === 'en';
  const next = typeof searchParams?.next === 'string' ? searchParams.next : '';
  return (
    <div className="auth-card card fade-in">
      <h1>{en ? 'Sign in' : 'تسجيل الدخول'}</h1>
      <LoginForm next={next} />
      <p className="auth-switch">
        {en ? "Don't have an account?" : 'ليس لديك حساب؟'}{' '}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`}>{en ? 'Create one' : 'أنشئ حساباً'}</Link>
      </p>
    </div>
  );
}

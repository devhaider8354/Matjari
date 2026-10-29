import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/forms';
import { requireAdmin } from '@/lib/session';
import { adminUrl } from '@/lib/adminPath';

export const metadata = { title: 'دخول الإدارة' };

export default async function AdminLoginPage() {
  if (await requireAdmin()) redirect(adminUrl(''));
  return (
    <>
      <h2>تسجيل الدخول</h2>
      <p className="muted" style={{ marginTop: 0 }}>للمدراء فقط. يُقفل الحساب 15 دقيقة بعد 5 محاولات خاطئة.</p>
      <LoginForm adminBase={adminUrl()} />
    </>
  );
}

import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import { DEFAULT_ADMIN_EMAIL } from '@/lib/bootstrap';
import { STORE_NAME } from '@/lib/config';
import { dbConnect } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import Order from '@/models/Order';
import { adminUrl } from '@/lib/adminPath';

export const metadata = { title: 'لوحة التحكم', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  // تحقق كامل من قاعدة البيانات (الحساب فعّال ولم تتغير كلمة مروره)
  const admin = await requireAdmin();
  if (!admin) redirect(adminUrl('/login'));

  await dbConnect();
  const pending = await Order.countDocuments({ status: 'pending' });

  return (
    <AdminShell
      base={adminUrl()}
      storeName={STORE_NAME}
      admin={{
        demoMode: process.env.DEMO_MODE === 'true',
        name: admin.name,
        email: admin.email,
        permissions: admin.permissions ?? ['*'],
        mustChangePassword: admin.mustChangePassword,
        defaultEmail: process.env.DEMO_MODE !== 'true' && admin.email === DEFAULT_ADMIN_EMAIL,
        twoFactor: Boolean(admin.twoFactorEnabled),
      }}
      pendingOrders={pending}
    >
      {children}
    </AdminShell>
  );
}

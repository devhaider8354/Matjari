import Link from 'next/link';
import { STORE_NAME } from '@/lib/config';

export const metadata = { robots: { index: false } };

// صفحات الدخول والاستعادة للإدارة: تصميم مستقل عن واجهة المتجر
export default function AdminAuthLayout({ children }) {
  return (
    <div className="admin-scope admin-auth" dir="rtl" lang="ar">
      <div className="admin-auth-box">
        <div className="admin-auth-brand">
          <span className="admin-logo">🛍️</span>
          <div>
            <strong>{STORE_NAME}</strong>
            <div>لوحة الإدارة</div>
          </div>
        </div>
        <div className="card">{children}</div>
        <p className="admin-auth-foot">
          <Link href="/">← العودة للمتجر</Link>
        </p>
      </div>
    </div>
  );
}

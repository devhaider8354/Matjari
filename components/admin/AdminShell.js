'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogoutButton } from '@/components/auth/forms';
import { hasPerm } from '@/lib/permissions';
import { AdminBaseContext } from './AdminContext';

// المسارات نسبية؛ تُضاف إليها قاعدة اللوحة السرية
// perm: الصلاحية المطلوبة لرؤية الرابط (بدونها يظهر لكل مدير)
const SECTIONS = [
  { title: 'عام', links: [{ href: '', label: 'لوحة المعلومات', icon: '📊', exact: true }] },
  {
    title: 'المبيعات',
    links: [
      { href: '/orders', label: 'الطلبات', icon: '📦', badge: 'pending', perm: 'orders' },
      { href: '/customers', label: 'الزبائن', icon: '👥', perm: 'customers' },
    ],
  },
  {
    title: 'الكتالوج',
    links: [
      { href: '/products', label: 'المنتجات', icon: '🏷️', perm: 'catalog' },
      { href: '/categories', label: 'الأقسام', icon: '🗂️', perm: 'catalog' },
    ],
  },
  {
    title: 'الواجهة والمحتوى',
    links: [
      { href: '/slider', label: 'السلايدر', icon: '🖼️', perm: 'content' },
      { href: '/appearance', label: 'المظهر والألوان', icon: '🎨', perm: 'content' },
      { href: '/music', label: 'موسيقى المتجر', icon: '🎵', perm: 'content' },
      { href: '/blog', label: 'المدونة', icon: '📝', perm: 'content' },
      { href: '/invoice', label: 'تصميم الوصل', icon: '🧾', perm: 'content' },
    ],
  },
  {
    title: 'الإعدادات',
    links: [
      { href: '/settings', label: 'المتجر والتواصل وSEO', icon: '⚙️', perm: 'settings' },
      { href: '/marketing', label: 'التسويق والإشعارات', icon: '📣', perm: 'settings' },
      { href: '/currencies', label: 'العملات', icon: '💱', perm: 'settings' },
    ],
  },
  {
    title: 'الإدارة',
    links: [
      { href: '/team', label: 'فريق الإدارة', icon: '🛡️', perm: 'team' },
      { href: '/audit', label: 'سجل النشاط', icon: '📜', perm: 'team' },
      { href: '/profile', label: 'حسابي والأمان', icon: '🔒' },
    ],
  },
];

export default function AdminShell({ base, storeName, admin, pendingOrders, children }) {
  const allowed = (perm) => !perm || hasPerm({ role: 'admin', permissions: admin.permissions }, perm);
  const sections = SECTIONS.map((s) => ({ ...s, links: s.links.filter((l) => allowed(l.perm) && !(admin.demoMode && l.href === '/team')) })).filter((s) => s.links.length);
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  // بيانات الدخول الافتراضية: كل صفحات اللوحة تحوّل لصفحة تغييرها (والخادم يرفض أي تعديل)
  const profileHref = `${base}/profile`;
  useEffect(() => {
    if (admin.mustChangePassword && pathname !== profileHref) router.replace(profileHref);
  }, [admin.mustChangePassword, pathname, profileHref, router]);

  const isActive = (href, exact) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const all = sections.flatMap((s) => s.links).map((l) => ({ ...l, full: `${base}${l.href}` }));
  const current = all.find((l) => isActive(l.full, l.exact));

  return (
    <AdminBaseContext.Provider value={base}>
      <div className={`admin-scope admin-shell ${open ? 'sidebar-open' : ''}`} dir="rtl" lang="ar">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <span className="admin-logo">🛍️</span>
            <div>
              <strong>{storeName}</strong>
              <small>لوحة الإدارة</small>
            </div>
          </div>
          <nav>
            {sections.map((section) => (
              <div key={section.title} className="admin-nav-section">
                <div className="admin-nav-title">{section.title}</div>
                {section.links.map((l) => {
                  const full = `${base}${l.href}`;
                  return (
                    <Link key={full} href={full} className={isActive(full, l.exact) ? 'active' : ''}>
                      <span className="icon">{l.icon}</span>
                      <span>{l.label}</span>
                      {l.badge === 'pending' && pendingOrders > 0 && <span className="admin-badge">{pendingOrders}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="admin-user">
            <div className="avatar">{admin.name.trim()[0]}</div>
            <div className="admin-user-info">
              <strong>{admin.name}</strong>
              <small dir="ltr">{admin.email}</small>
            </div>
          </div>
        </aside>
        <div className="admin-backdrop" onClick={() => setOpen(false)} />

        <div className="admin-main">
          <header className="admin-topbar">
            <button type="button" className="admin-menu-btn" onClick={() => setOpen(true)} aria-label="القائمة">☰</button>
            <div className="admin-topbar-title">{current?.label || 'لوحة التحكم'}</div>
            <div className="admin-topbar-actions">
              <Link href="/" target="_blank" className="btn btn-outline btn-sm">عرض المتجر ↗</Link>
              <LogoutButton to={`${base}/login`} className="btn btn-sm">خروج</LogoutButton>
            </div>
          </header>
          <div className="admin-content">
            {(admin.mustChangePassword || admin.defaultEmail) && (
              <div className="alert alert-error security-banner">
                🔐 <strong>أنت تستخدم بيانات الدخول الافتراضية.</strong>{' '}
                {admin.mustChangePassword
                  ? 'غيّر كلمة المرور الآن، فلوحة التحكم مقفلة حتى تغييرها.'
                  : 'غيّر البريد الإلكتروني الافتراضي إلى بريدك الحقيقي حتى تستطيع استعادة كلمة المرور.'}
                {pathname !== profileHref && <> <Link href={profileHref}><u>غيّرها الآن</u></Link></>}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </AdminBaseContext.Provider>
  );
}

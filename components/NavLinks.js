'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// قائمة روابط تُبرز الصفحة الحالية (حساب الزبون والشريط الجانبي للوحة)
export default function NavLinks({ links, className = 'side-links', onNavigate }) {
  const pathname = usePathname();
  return (
    <nav className={className}>
      {links.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} className={active ? 'active' : ''} onClick={onNavigate}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

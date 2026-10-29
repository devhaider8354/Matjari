'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from './CartProvider';
import CategoryNav from './CategoryNav';
import { useStore } from './StoreProvider';

// adminHref يُمرَّر من الخادم للمدير فقط، فلا يظهر المسار السري لغيره
export default function Header({ user, adminHref, nav }) {
  const { count } = useCart();
  const { t, lang, setLang, currency, currencies, setCurrency, store } = useStore();
  const router = useRouter();
  const [q, setQ] = useState('');

  return (
    <header className="header">
      <div className="topbar">
        <div className="container topbar-inner">
          <span className="hide-sm">{store.tagline}</span>
          <div className="topbar-controls">
            <select aria-label={t.language} value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
            {currencies.length > 1 && (
              <select aria-label={t.currency} value={currency.code} onChange={(e) => setCurrency(e.target.value)}>
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
      <div className="container header-main">
        <Link href="/" className="logo">
          {store.logo && <img src={store.logo} alt="" />}
          <span>{store.name}</span>
        </Link>
        <form
          className="header-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
          }}
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchPlaceholder} aria-label={t.search} />
          <button aria-label={t.search}>🔍</button>
        </form>
        <nav className="nav">
          {user ? (
            <>
              {adminHref && <a href={adminHref} className="hide-sm">{t.admin}</a>}
              <Link href="/account">👤 <span className="hide-sm">{user.name.split(' ')[0]}</span></Link>
            </>
          ) : (
            <>
              <Link href="/track" className="hide-sm">{t.track}</Link>
              <Link href="/login">👤 <span className="hide-sm">{t.login}</span></Link>
            </>
          )}
          <Link href="/cart" className="cart-link">
            🛒 <span className="hide-sm">{t.cart}</span>
            {count > 0 && <span className="badge">{count}</span>}
          </Link>
        </nav>
      </div>
      {nav.length > 0 && <CategoryNav items={nav} homeLabel={t.home} />}
    </header>
  );
}

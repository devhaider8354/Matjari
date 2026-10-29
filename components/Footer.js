'use client';

import Link from 'next/link';
import { SOCIAL_PLATFORMS } from '@/lib/siteDefaults';
import { useStore } from './StoreProvider';

export default function Footer({ social, nav }) {
  const { t, store } = useStore();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">
            {store.logo && <img src={store.logo} alt="" />}
            <strong>{store.name}</strong>
          </div>
          <p className="muted">{store.tagline}</p>
          {social.length > 0 && (
            <>
              <h4>{t.followUs}</h4>
              <div className="social-links">
                {social.map((s, i) => {
                  const p = SOCIAL_PLATFORMS[s.platform] || SOCIAL_PLATFORMS.website;
                  return (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer me" aria-label={p.label} title={p.label} style={{ background: p.color }}>
                      {p.short}
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <div>
          <h4>{t.categories}</h4>
          <ul className="footer-links">
            {nav.slice(0, 8).map((c) => (
              <li key={c.slug}><Link href={`/category/${encodeURIComponent(c.slug)}`}>{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4>{t.contact}</h4>
          <ul className="footer-links">
            {store.phone && <li dir="ltr">📞 <a href={`tel:${store.phone}`}>{store.phone}</a></li>}
            {store.whatsapp && <li>💬 <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>}
            {store.email && <li>✉️ <a href={`mailto:${store.email}`}>{store.email}</a></li>}
            {store.address && <li>📍 {store.address}</li>}
            <li><Link href="/track">{t.track}</Link></li>
            <li><Link href="/blog">{t.blog}</Link></li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        © {new Date().getFullYear()} {store.name} · {t.footerRights} · {t.cod}
      </div>
    </footer>
  );
}

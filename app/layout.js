import { Cairo } from 'next/font/google';
import { headers } from 'next/headers';
import { trackingScript } from '@/lib/tracking';
import { LANGS } from '@/lib/i18n';
import { getLang } from '@/lib/locale';
import { appUrl } from '@/lib/mail';
import { getSettings } from '@/lib/settings';
import { themeCss } from '@/lib/theme';
import './globals.css';

const cairo = Cairo({ subsets: ['arabic', 'latin'], weight: ['400', '600', '700'] });

// الثيم والإعدادات تُقرأ من قاعدة البيانات مع كل طلب، فتظهر تغييرات اللوحة فوراً
export const dynamic = 'force-dynamic';

// وسوم SEO العامة: الصفحات تكمّلها بعناوينها وأوصافها
export async function generateMetadata() {
  const { store, seo } = await getSettings();
  const lang = getLang();
  const name = lang === 'en' ? store.nameEn || store.nameAr : store.nameAr;
  const title = (lang === 'en' ? seo.titleEn : seo.titleAr) || `${name} | ${lang === 'en' ? store.taglineEn : store.taglineAr}`;
  const description = (lang === 'en' ? seo.descriptionEn : seo.descriptionAr) || (lang === 'en' ? store.taglineEn : store.taglineAr);
  return {
    metadataBase: new URL(appUrl()),
    title: { default: title, template: `%s | ${name}` },
    description,
    keywords: seo.keywords,
    applicationName: name,
    openGraph: { type: 'website', siteName: name, title, description, locale: lang === 'en' ? 'en_US' : 'ar_AR', images: seo.ogImage ? [seo.ogImage] : undefined },
    twitter: { card: 'summary_large_image', title, description },
    verification: seo.googleVerification ? { google: seo.googleVerification } : undefined,
    icons: store.logo ? { icon: store.logo } : undefined,
  };
}

export default async function RootLayout({ children }) {
  const { theme, seo, marketing } = await getSettings();
  const lang = getLang();
  const nonce = headers().get('x-nonce') || undefined;
  // سكربتات التتبع لا تُحمَّل في لوحة الإدارة. المعرّفات مُنقّاة (أرقام وحروف فقط) قبل الحفظ
  const isAdmin = headers().get('x-area') === 'admin';
  const tracking = !isAdmin && trackingScript({ gaId: seo.gaId, fbPixelId: marketing.fbPixelId, tiktokPixelId: marketing.tiktokPixelId });
  return (
    <html lang={lang} dir={LANGS[lang].dir}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss(theme) }} />
        <meta name="theme-color" content={theme.primary} />
        <link rel="apple-touch-icon" href="/api/pwa-icon/192" />
        {tracking && <script nonce={nonce} dangerouslySetInnerHTML={{ __html: tracking }} />}
      </head>
      <body className={cairo.className}>{children}</body>
    </html>
  );
}

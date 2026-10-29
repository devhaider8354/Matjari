import CartProvider from '@/components/CartProvider';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import MusicPlayer from '@/components/MusicPlayer';
import PwaRegister from '@/components/PwaRegister';
import StoreProvider from '@/components/StoreProvider';
import { adminUrl } from '@/lib/adminPath';
import { getCategoryTree } from '@/lib/catalog';
import { pick } from '@/lib/i18n';
import { getLocale } from '@/lib/locale';
import { getCurrentUser } from '@/lib/session';
import { getSettings } from '@/lib/settings';

export default async function StoreLayout({ children }) {
  const [user, { lang, currency, currencies }, { store, social, music }, tree] = await Promise.all([
    getCurrentUser(),
    getLocale(),
    getSettings(),
    getCategoryTree(),
  ]);
  const nav = tree.map((c) => ({ slug: c.slug, name: pick(c, 'name', lang), icon: c.icon }));
  const storeInfo = {
    name: lang === 'en' ? store.nameEn || store.nameAr : store.nameAr,
    nameAr: store.nameAr,
    tagline: lang === 'en' ? store.taglineEn : store.taglineAr,
    logo: store.logo,
    phone: store.phone,
    whatsapp: store.whatsapp,
    email: store.email,
    address: lang === 'en' ? store.addressEn || store.addressAr : store.addressAr,
  };

  return (
    <StoreProvider lang={lang} currency={currency} currencies={currencies} store={storeInfo}>
      <CartProvider>
        <Header
          user={user ? { name: user.name, role: user.role } : null}
          adminHref={user?.role === 'admin' ? adminUrl() : null}
          nav={nav}
        />
        <main className="container">{children}</main>
        <Footer social={social} nav={nav} />
        {/* داخل التخطيط: لا يُعاد تركيبه عند التنقل، فتستمر الموسيقى بدون انقطاع */}
        {music.enabled && music.tracks.length > 0 && <MusicPlayer settings={music} lang={lang} />}
        <PwaRegister />
      </CartProvider>
    </StoreProvider>
  );
}

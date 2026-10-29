import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

// ملف تطبيق الويب (PWA): يسمح بتثبيت المتجر على شاشة الجوال كتطبيق
export default async function manifest() {
  const { store, theme } = await getSettings();
  return {
    name: store.nameAr,
    short_name: store.nameAr.slice(0, 12),
    description: store.taglineAr,
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    dir: 'rtl',
    lang: 'ar',
    background_color: theme.bg,
    theme_color: theme.primary,
    categories: ['shopping'],
    icons: [
      { src: '/api/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/api/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/api/pwa-icon/512?maskable=1', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'السلة', url: '/cart' },
      { name: 'تتبع طلبك', url: '/track' },
    ],
  };
}

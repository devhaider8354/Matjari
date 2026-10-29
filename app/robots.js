import { appUrl } from '@/lib/mail';

// لا نذكر مسار الإدارة هنا: ذكره في robots.txt يكشفه للجميع
export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/account', '/checkout', '/cart', '/order/'] }],
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}

import { NextResponse } from 'next/server';
import { ADMIN_BASE, ADMIN_HIDDEN, adminIpAllowed } from './lib/adminPath';
import { SESSION_COOKIE, verifySession } from './lib/auth';

// صفحات الإدارة التي لا تحتاج تسجيل دخول (بالمسار الداخلي)
const ADMIN_PUBLIC = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];

const clientIp = (req) =>
  req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

// سياسة أمان المحتوى (CSP): لا يُنفَّذ إلا سكربت يحمل رمز nonce عشوائياً لكل طلب،
// أو سكربت حمّله سكربت موثوق (strict-dynamic). هذا يمنع حقن السكربتات (XSS).
function buildCsp(nonce, https) {
  const dev = process.env.NODE_ENV !== 'production';
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "media-src 'self' blob:",
    "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.facebook.com https://*.facebook.net https://*.tiktok.com https://*.tiktokw.us",
    'frame-src https://www.youtube-nocookie.com https://www.youtube.com',
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(https ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

// الطبقة الأولى من الحماية (المسار السري، IP، توقيع الجلسة ودورها، CSRF، CSP).
// المسارات نفسها تتحقق ثانيةً من قاعدة البيانات عبر getCurrentUser / adminRoute.
export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api/');

  // حماية CSRF: الطلبات المعدِّلة يجب أن تأتي من نفس الموقع
  if (isApi && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = req.headers.get('origin');
    if (origin) {
      const allowed = [req.headers.get('host'), req.headers.get('x-forwarded-host')].filter(Boolean);
      let originHost = '';
      try {
        originHost = new URL(origin).host;
      } catch {}
      if (!allowed.includes(originHost)) {
        return NextResponse.json({ error: 'مصدر الطلب غير مسموح' }, { status: 403 });
      }
    }
  }

  // الصفحات تحصل على nonce جديد؛ Next يضيفه تلقائياً لسكربتاته من ترويسة الطلب
  const nonce = isApi ? '' : btoa(crypto.randomUUID());
  const https = req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:';
  const csp = isApi ? '' : buildCsp(nonce, https);
  const requestHeaders = new Headers(req.headers);
  if (!isApi) {
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('content-security-policy', csp);
  }
  const withCsp = (res) => {
    if (csp) res.headers.set('Content-Security-Policy', csp);
    return res;
  };
  const next = () => withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  const rewrite = (url) => withCsp(NextResponse.rewrite(url, { request: { headers: requestHeaders } }));
  // يعرض صفحة 404 العادية، فلا يعرف الزائر أن هناك شيئاً مخفياً
  const notFound = () => rewrite(new URL('/__not-found', process.env.APP_URL || req.url));

  // تحويل المسار السري إلى صفحات /admin الداخلية، وإخفاء /admin نفسه
  const isDirectAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  const isSecretAdmin = ADMIN_HIDDEN && (pathname === ADMIN_BASE || pathname.startsWith(`${ADMIN_BASE}/`));
  if (ADMIN_HIDDEN && isDirectAdmin) return notFound();
  const internal = isSecretAdmin ? `/admin${pathname.slice(ADMIN_BASE.length)}` : pathname;

  const isAdminPage = internal === '/admin' || internal.startsWith('/admin/');
  const isAdminApi = pathname.startsWith('/api/admin/');
  const isAccount = pathname === '/account' || pathname.startsWith('/account/');
  // صفحات الإدارة لا تحمّل سكربتات التتبع (حتى لا يصل مسارها السري لمنصات الإعلان)
  if (isAdminPage) requestHeaders.set('x-area', 'admin');
  else requestHeaders.delete('x-area');
  if (!isAdminPage && !isAdminApi && !isAccount) return next();

  if ((isAdminPage || isAdminApi) && !adminIpAllowed(clientIp(req))) {
    return isAdminApi ? NextResponse.json({ error: 'غير موجود' }, { status: 404 }) : notFound();
  }

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (isAccount) {
    if (session) return next();
    const url = new URL(req.nextUrl.pathname + req.nextUrl.search, process.env.APP_URL || req.url);
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // مسارات API الإدارية تُرجع 404 لغير المدير بدل 401 حتى لا تكشف وجودها
  if (isAdminApi) {
    return session?.role === 'admin' ? next() : NextResponse.json({ error: 'غير موجود' }, { status: 404 });
  }

  if (session?.role !== 'admin' && !ADMIN_PUBLIC.includes(internal)) {
    const url = req.nextUrl.clone();
    url.pathname = `${ADMIN_BASE}/login`;
    url.search = '';
    return NextResponse.redirect(url);
  }

  const res = isSecretAdmin ? rewrite(new URL(`${internal}${req.nextUrl.search}`, process.env.APP_URL || req.url)) : next();
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js).*)'],
};

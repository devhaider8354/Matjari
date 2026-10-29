const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { trustHostHeader: true },
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // صفحات الحساب لا تُخزَّن (صفحات الإدارة يضبطها الـ middleware لأن مسارها سري)
      { source: '/account/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};

export default nextConfig;

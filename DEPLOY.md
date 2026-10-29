# Deploy Matjari

**English** | [العربية](DEPLOY.ar.md)

## Runtime

Run on a Node.js 22 server with MongoDB and an HTTPS reverse proxy. The app needs a writable persistent upload directory; GitHub Pages cannot run its server routes or database.

```bash
npm ci
cp .env.example .env.local
```

Configure `MONGODB_URI`, a randomly generated `JWT_SECRET` of at least 32 characters, your own `ADMIN_PATH`, and `APP_URL=https://shop.example.com`. Choose store name, base currency and shipping settings before building. SMTP, Redis, Telegram and Pexels settings are optional. Real credentials stay in the server environment file.

Create your first administrator with `npm run create-admin -- owner@example.com "Store owner"`. Alternatively, configure both bootstrap administrator variables locally. No administrator password ships with the source.

```bash
npm test
npm run check:public
npm run build
npx next start -H 127.0.0.1 -p 3000
```

Use a process manager or systemd for automatic restart. `ecosystem.config.js` is an example PM2 configuration; choose a free port and match it in your reverse proxy.

## Nginx

Provision a valid certificate for your own domain. Inside the HTTPS server block:

```nginx
client_max_body_size 110m;
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 120s;
}
```

Redirect HTTP to HTTPS. When using Cloudflare, use end-to-end TLS and preserve these headers. Keep Node.js, MongoDB and Redis private to the server. Give the application user write access to `uploads/` and the Next.js cache, not to configuration or source files.

## Data and updates

Back up MongoDB and `uploads/` separately. Transfer existing media and its matching catalog records together; source control does not contain either. `npm run seed` is only for a new, empty sample database. Never use its reset option on data you need to keep.

After changing public build-time settings, rebuild and restart. Stage and verify a new build before switching live traffic. Check storefront media, login, checkout and upload permissions after deployment.

For an isolated shared demonstration, configure `DEMO_MODE=true` and the demonstration-account environment variables. Keep it on a separate database and storage. Team management and shared-account credential changes are disabled in that mode.

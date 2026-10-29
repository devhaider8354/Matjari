# Matjari — متجري

[![Build](https://github.com/devhaider8354/Matjari/actions/workflows/build.yml/badge.svg)](https://github.com/devhaider8354/Matjari/actions/workflows/build.yml)

**English** | [العربية](README.ar.md)

A bilingual Arabic / English online store with cash-on-delivery checkout and an administration dashboard. Built with Next.js, React and MongoDB.

**[Live storefront demo](https://store-demo.byhdr.com)**

![Matjari storefront](docs/storefront.jpg)

## Features

- Arabic and English UI, RTL / LTR layouts, search, filters and nested categories.
- Product galleries, video and variants with separate prices, stock and images.
- Guest or account checkout, order tracking and cash on delivery.
- Dashboard for products, categories, orders, customers, settings and currencies.
- Customizable invoices, PDF export, A4 / A5 and thermal printer formats.
- Sliders, themes, blog, optional music and an installable PWA on HTTPS.
- SEO, sitemap, Google Merchant feed and optional email / Telegram notifications.
- Team permissions, two-factor authentication, activity logs and sign-in rate limits.

## Run locally

Requirements: Node.js 22, npm and MongoDB. Redis is optional.

```bash
git clone https://github.com/devhaider8354/Matjari.git
cd Matjari
npm ci
cp .env.example .env.local
```

Set `MONGODB_URI`, choose `ADMIN_PATH` and generate a private `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the output into `JWT_SECRET` in `.env.local`, then create your administrator and start the app:

```bash
npm run create-admin -- owner@example.com "Store owner"
npm run dev
```

The administrator command generates a password and prints it for the operator; keep it outside Git. The public source contains no shared login credentials. Alternatively, configure both `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` locally to bootstrap the first administrator at sign-in.

The store opens at `http://localhost:3000`. Administration uses your configured `ADMIN_PATH` followed by `/login`.

## Demo data and media

`npm run seed` creates a sample catalog only when the database is empty. Generated media stays in `uploads/` and is ignored by Git. External photo fetching is optional and requires your own Pexels key. This repository does not contain the live demo's database export or uploaded files.

## Demo mode

`DEMO_MODE=false` is the default. For an isolated demonstration, enable it and configure the shared account in the environment file:

- Shared-account email, password, recovery and two-factor changes are blocked.
- The API blocks administrator creation and administrator account changes.
- The team page is unavailable and its navigation link is hidden.
- Catalog and content editing remain available.

Demo mode is not a complete sandbox. Use separate sample data and media, and never reuse demonstration credentials for a real store.

## Build and deploy

```bash
npm test
npm run check:public
npm run build
npm start
```

See [BUILD.md](BUILD.md) for verification and [DEPLOY.md](DEPLOY.md) for Node.js / Nginx deployment.

## Project layout

```text
app/          storefront, admin pages and API routes
components/   store and administration UI
lib/          sessions, permissions, demo policy, mail and caching
models/       MongoDB schemas
scripts/      administrator setup and optional sample catalog
tests/        demo account and team policy checks
public/       static service-worker assets
uploads/      runtime media; ignored by Git
```

## Privacy and secrets

Environment files, private keys, passwords, database exports and uploaded media are excluded. `.env.example` lists configuration names without deployment secrets. See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © 2026 FLOW POINT — developed by Haider ([flowp.uk](https://flowp.uk)). Third-party libraries retain their licenses; media is not covered by the code license.

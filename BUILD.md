# Build and verification / البناء والفحوص

Use Node.js 22 and npm. Install dependencies with `npm ci`, configure `.env.local` from `.env.example`, and provide a reachable MongoDB database before building.

```bash
npm ci
npm test
npm run check:public
npm run build
npm start
```

The tests exercise shared-demo-account locking, absence of built-in bootstrap credentials, and server-side team restrictions without accessing a database. The publication check rejects common private files and credential assignments in tracked source. These checks do not replace a full security audit.

GitHub Actions runs the same commands using an isolated MongoDB service and a temporary session secret generated for that CI run. No production secrets are required. The build downloads the Cairo font through Next.js, so network access is required.

Before deploying, verify storefront images, checkout, administrator login, media uploads, and that demo team creation returns 403. Optional email, Telegram and Redis features require separate configuration.

<div dir="rtl">

## العربية

استخدم Node.js 22 وnpm. ثبّت الاعتماديات بالأمر `npm ci`، وانسخ `.env.example` إلى `.env.local` واضبط قاعدة MongoDB ومفتاح الجلسة، ثم نفّذ الأوامر أعلاه.

الفحوص تختبر قفل حساب الديمو وعدم وجود بيانات دخول افتراضية مضمّنة ومنع إدارة الفريق من الخادم، بدون اتصال بقاعدة بيانات. فحص النشر يرفض ملفات خاصة شائعة وقيم أسرار مضمّنة، لكنه ليس تدقيقاً أمنياً شاملاً.

يشغّل GitHub Actions قاعدة بيانات معزولة ومفتاح جلسة مؤقتاً لكل تشغيل. لا يحتاج أسرار الاستضافة الحقيقية. البناء يحتاج الإنترنت لتنزيل خط Cairo.

قبل النشر اختبر عرض الصور والطلبات ودخول المدير ورفع الصور ومنع إنشاء المدراء في وضع العرض. البريد وتيليجرام وRedis إعدادات اختيارية مستقلة.

</div>

# Security and private configuration

Do not publish credentials, session keys, database connection credentials, SMTP passwords, provider keys, administrator URLs, customer exports or uploaded private media in issues, commits or screenshots.

- Keep `.env.local` on the server. `.env.example` contains names and blank secret values only.
- No shared administrator password is embedded in this public source. Create an administrator from the server or configure the bootstrap variables yourself.
- Use separate MongoDB databases, media directories and credentials for demonstrations and production.
- Demo mode blocks shared-account credential changes and administrator team management. It still permits catalog and content changes; it is not a full sandbox.
- Use HTTPS, a strong signing secret, private database ports, least-privilege database users and backups.
- Review dependency advisories and update dependencies before production use. Publication checks are not a full vulnerability assessment.
- If a secret is accidentally committed, revoke or rotate it; deleting the latest copy does not remove it from history.

For a sensitive report, use the private reporting option on the repository's Security page if available. Do not include secrets in a public issue.

<div dir="rtl">

## العربية

لا تنشر كلمات المرور أو مفاتيح الجلسات أو روابط قواعد البيانات الحقيقية أو أسرار مزودي الخدمات أو مسارات الإدارة الخاصة أو بيانات الزبائن. تبقى الإعدادات داخل الاستضافة، وملف المثال لا يحتوي قيماً سرية.

استخدم بيانات ووسائط وحسابات منفصلة للديمو والإنتاج. وضع العرض يمنع تغيير حساب العرض وإدارة المدراء، لكنه يسمح بتعديل المنتجات والمحتوى. استخدم HTTPS وصلاحيات محدودة ونسخاً احتياطية، وراجع تحديثات الاعتماديات قبل التشغيل الإنتاجي.

عند تسرب سر، ألغِه أو بدّله؛ حذفه من آخر نسخة لا يحذفه من تاريخ Git. لا تضع تفاصيل حساسة في بلاغ عام.

</div>

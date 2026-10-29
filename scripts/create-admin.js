// إنشاء أول مدير، أو استعادة الوصول لحساب مدير من السيرفر مباشرة:
//   npm run create-admin -- admin@example.com "اسم المدير"
//   npm run create-admin -- admin@example.com "اسم المدير" --password "MyPass123"
// بدون --password تُولَّد كلمة مرور قوية وتُطبع مرة واحدة.
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const args = process.argv.slice(2);
const pwIndex = args.indexOf('--password');
const password = pwIndex >= 0 ? args[pwIndex + 1] : crypto.randomBytes(12).toString('base64url');
const positional = pwIndex >= 0 ? args.filter((_, i) => i !== pwIndex && i !== pwIndex + 1) : args;
const [emailArg, nameArg] = positional;
const email = String(emailArg || '').trim().toLowerCase();

(async () => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new Error('الاستخدام: npm run create-admin -- admin@example.com "اسم المدير" [--password كلمة]');
  }
  if (password.length < 8 || !/\d/.test(password) || !/[A-Za-z]/.test(password)) {
    throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي حروفاً وأرقاماً');
  }
  if (!process.env.MONGODB_URI) throw new Error('عرّف MONGODB_URI في .env.local');

  await mongoose.connect(process.env.MONGODB_URI);
  const users = mongoose.connection.collection('users');
  await users.createIndex({ email: 1 }, { unique: true });
  const now = new Date();
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await users.findOne({ email });

  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      {
        $set: { role: 'admin', permissions: ['*'], disabled: false, passwordHash, failedLogins: 0, lockUntil: null, updatedAt: now, ...(nameArg && { name: nameArg }) },
        $inc: { tokenVersion: 1 },
      }
    );
    console.log(`✔ تم تحديث الحساب ${email} إلى مدير وتعيين كلمة مرور جديدة.`);
  } else {
    await users.insertOne({
      name: nameArg || 'المدير',
      email,
      phone: '', city: '', address: '',
      passwordHash,
      role: 'admin',
      permissions: ['*'],
      disabled: false,
      tokenVersion: 0,
      failedLogins: 0,
      lockUntil: null,
      resetTokenHash: null,
      resetTokenExpires: null,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`✔ تم إنشاء المدير ${email}`);
  }
  if (pwIndex < 0) console.log(`كلمة المرور: ${password}\n(احفظها الآن وغيّرها بعد أول دخول من «حسابي والأمان»)`);
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('✘', e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

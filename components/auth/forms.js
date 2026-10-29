'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useStore } from '@/components/StoreProvider';
import { translateError } from '@/lib/errorText';

// نصوص النماذج باللغتين (لوحة الإدارة خارج المتجر فتستخدم العربية)
const TEXT = {
  ar: {
    email: 'البريد الإلكتروني', password: 'كلمة المرور', forgot: 'نسيت كلمة المرور؟', signIn: 'تسجيل الدخول', signingIn: 'جاري الدخول...',
    name: 'الاسم الكامل', phoneOpt: 'رقم الهاتف (اختياري)', pwHint: '8 أحرف على الأقل، وتحتوي حروفاً وأرقاماً', confirm: 'تأكيد كلمة المرور',
    register: 'إنشاء حساب', registering: 'جاري إنشاء الحساب...', mismatch: 'كلمتا المرور غير متطابقتين',
    forgotIntro: 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.', sendLink: 'إرسال رابط الاستعادة', sendingLink: 'جاري الإرسال...',
    badLink: 'الرابط غير مكتمل. افتح الرابط من الرسالة كما هو.', resetDone: 'تم تغيير كلمة المرور. تم تسجيل الخروج من جميع الأجهزة الأخرى.',
    newPassword: 'كلمة المرور الجديدة', savePassword: 'حفظ كلمة المرور', current: 'كلمة المرور الحالية', confirmShort: 'تأكيدها',
    changed: 'تم تغيير كلمة المرور، وتم تسجيل الخروج من الأجهزة الأخرى.', change: 'تغيير كلمة المرور', logout: 'تسجيل الخروج',
    show: 'إظهار', hide: 'إخفاء', error: 'حدث خطأ، حاول مرة أخرى',
  },
  en: {
    email: 'Email', password: 'Password', forgot: 'Forgot password?', signIn: 'Sign in', signingIn: 'Signing in...',
    name: 'Full name', phoneOpt: 'Phone (optional)', pwHint: 'At least 8 characters with letters and numbers', confirm: 'Confirm password',
    register: 'Create account', registering: 'Creating account...', mismatch: 'Passwords do not match',
    forgotIntro: 'Enter your email and we will send you a link to reset your password.', sendLink: 'Send reset link', sendingLink: 'Sending...',
    badLink: 'Incomplete link. Open the link from the email as is.', resetDone: 'Password changed. You were signed out of all other devices.',
    newPassword: 'New password', savePassword: 'Save password', current: 'Current password', confirmShort: 'Confirm',
    changed: 'Password changed. Other devices were signed out.', change: 'Change password', logout: 'Sign out',
    show: 'Show', hide: 'Hide', error: 'Something went wrong, try again',
  },
};
export const useAuthText = () => TEXT[useStore()?.lang === 'en' ? 'en' : 'ar'];
const useLang = () => (useStore()?.lang === 'en' ? 'en' : 'ar');

// يقبل فقط مسارات داخلية، لمنع إعادة التوجيه إلى مواقع خارجية
export const safeNext = (next, fallback) =>
  typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : fallback;

async function postJson(url, body, fallbackError) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || fallbackError);
  return data;
}

function useSubmit(action) {
  const lang = useLang();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await action(Object.fromEntries(new FormData(e.currentTarget)), e.currentTarget);
    } catch (err) {
      setError(translateError(err.message, lang));
      setLoading(false);
    }
  }
  return { error, loading, onSubmit, setLoading };
}

function PasswordInput({ id = 'password', name = 'password', autoComplete, ...rest }) {
  const T = useAuthText();
  const [show, setShow] = useState(false);
  return (
    <div className="password-input">
      <input id={id} name={name} type={show ? 'text' : 'password'} dir="ltr" required autoComplete={autoComplete} {...rest} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? T.hide : T.show}>
        {show ? '🙈' : '👁'}
      </button>
    </div>
  );
}

// adminBase: مسار اللوحة السري (يمرره الخادم لصفحة دخول الإدارة فقط)
export function LoginForm({ adminBase, next }) {
  const T = useAuthText();
  const admin = Boolean(adminBase);
  const base = adminBase || '';
  const [ticket, setTicket] = useState(null);

  const finish = (data) => {
    // تحميل كامل حتى تُقرأ الجلسة الجديدة في كل المكونات.
    // ببيانات افتراضية يذهب المدير مباشرة لصفحة تغييرها
    if (admin && data.mustChangePassword) return window.location.assign(`${adminBase}/profile`);
    window.location.assign(safeNext(next, admin ? adminBase : '/account'));
  };

  const { error, loading, onSubmit, setLoading } = useSubmit(async (f) => {
    const data = await postJson('/api/auth/login', { email: f.email, password: f.password, admin }, T.error);
    if (data.twoFactorRequired) {
      setTicket(data.ticket);
      setLoading(false);
      return;
    }
    finish(data);
  });

  const twoFactor = useSubmit(async (f) => finish(await postJson('/api/auth/2fa', { ticket, code: f.code }, T.error)));

  if (ticket) {
    return (
      <form onSubmit={twoFactor.onSubmit}>
        {twoFactor.error && <div className="alert alert-error">{twoFactor.error}</div>}
        <p className="muted" style={{ marginTop: 0 }}>🔐 افتح تطبيق المصادقة واكتب الرمز المكوّن من 6 أرقام. أو استخدم أحد رموز الطوارئ.</p>
        <div className="field">
          <label htmlFor="code">رمز التحقق</label>
          <input id="code" name="code" dir="ltr" required autoFocus autoComplete="one-time-code" inputMode="numeric" style={{ fontSize: 22, letterSpacing: 6, textAlign: 'center' }} />
        </div>
        <button className="btn btn-block" disabled={twoFactor.loading}>{twoFactor.loading ? '...' : 'تحقق ودخول'}</button>
        <button type="button" className="link-btn" style={{ marginTop: 10 }} onClick={() => setTicket(null)}>رجوع</button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="field">
        <label htmlFor="email">{T.email}</label>
        <input id="email" name="email" type="email" dir="ltr" required autoComplete="username" autoFocus />
      </div>
      <div className="field">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <label htmlFor="password">{T.password}</label>
          <Link href={`${base}/forgot-password`} className="small-link">{T.forgot}</Link>
        </div>
        <PasswordInput autoComplete="current-password" />
      </div>
      <button className="btn btn-block" disabled={loading}>{loading ? T.signingIn : T.signIn}</button>
    </form>
  );
}

export function RegisterForm({ next }) {
  const T = useAuthText();
  const { error, loading, onSubmit } = useSubmit(async (f) => {
    if (f.password !== f.confirm) throw new Error(T.mismatch);
    await postJson('/api/auth/register', f, T.error);
    window.location.assign(safeNext(next, '/account'));
  });

  return (
    <form onSubmit={onSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="field">
        <label htmlFor="name">{T.name}</label>
        <input id="name" name="name" required maxLength={100} autoComplete="name" autoFocus />
      </div>
      <div className="field">
        <label htmlFor="email">{T.email}</label>
        <input id="email" name="email" type="email" dir="ltr" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="phone">{T.phoneOpt}</label>
        <input id="phone" name="phone" type="tel" dir="ltr" autoComplete="tel" />
      </div>
      <div className="field">
        <label htmlFor="password">{T.password}</label>
        <PasswordInput autoComplete="new-password" minLength={8} />
        <small>{T.pwHint}</small>
      </div>
      <div className="field">
        <label htmlFor="confirm">{T.confirm}</label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" />
      </div>
      <button className="btn btn-block" disabled={loading}>{loading ? T.registering : T.register}</button>
    </form>
  );
}

export function ForgotForm() {
  const T = useAuthText();
  const lang = useLang();
  const [sent, setSent] = useState('');
  const { error, loading, onSubmit } = useSubmit(async (f) => {
    const data = await postJson('/api/auth/forgot', { email: f.email }, T.error);
    setSent(translateError(data.message, lang));
  });
  if (sent) return <div className="alert alert-success">{sent}</div>;

  return (
    <form onSubmit={onSubmit}>
      <p className="muted" style={{ marginTop: 0 }}>{T.forgotIntro}</p>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="field">
        <label htmlFor="email">{T.email}</label>
        <input id="email" name="email" type="email" dir="ltr" required autoComplete="email" autoFocus />
      </div>
      <button className="btn btn-block" disabled={loading}>{loading ? T.sendingLink : T.sendLink}</button>
    </form>
  );
}

export function ResetForm({ token, loginHref }) {
  const T = useAuthText();
  const [done, setDone] = useState(false);
  const { error, loading, onSubmit } = useSubmit(async (f) => {
    if (f.password !== f.confirm) throw new Error(T.mismatch);
    await postJson('/api/auth/reset', { token, password: f.password }, T.error);
    setDone(true);
  });

  if (!token) return <div className="alert alert-error">{T.badLink}</div>;
  if (done) {
    return (
      <>
        <div className="alert alert-success">{T.resetDone}</div>
        <Link href={loginHref} className="btn btn-block">{T.signIn}</Link>
      </>
    );
  }
  return (
    <form onSubmit={onSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="field">
        <label htmlFor="password">{T.newPassword}</label>
        <PasswordInput autoComplete="new-password" minLength={8} autoFocus />
        <small>{T.pwHint}</small>
      </div>
      <div className="field">
        <label htmlFor="confirm">{T.confirm}</label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" />
      </div>
      <button className="btn btn-block" disabled={loading}>{loading ? '...' : T.savePassword}</button>
    </form>
  );
}

export function ChangePasswordForm() {
  const T = useAuthText();
  const [done, setDone] = useState(false);
  const { error, loading, onSubmit, setLoading } = useSubmit(async (f, form) => {
    if (f.newPassword !== f.confirm) throw new Error(T.mismatch);
    await postJson('/api/account/password', { currentPassword: f.currentPassword, newPassword: f.newPassword }, T.error);
    form.reset();
    setDone(true);
    setLoading(false);
  });

  return (
    <form onSubmit={(e) => { setDone(false); onSubmit(e); }}>
      {error && <div className="alert alert-error">{error}</div>}
      {done && <div className="alert alert-success">{T.changed}</div>}
      <div className="field">
        <label htmlFor="currentPassword">{T.current}</label>
        <PasswordInput id="currentPassword" name="currentPassword" autoComplete="current-password" />
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="newPassword">{T.newPassword}</label>
          <PasswordInput id="newPassword" name="newPassword" autoComplete="new-password" minLength={8} />
        </div>
        <div className="field">
          <label htmlFor="confirm">{T.confirmShort}</label>
          <PasswordInput id="confirm" name="confirm" autoComplete="new-password" />
        </div>
      </div>
      <button className="btn" disabled={loading}>{loading ? '...' : T.change}</button>
    </form>
  );
}

export function LogoutButton({ to = '/', className = 'btn btn-outline btn-sm', children }) {
  const T = useAuthText();
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.assign(to);
  }
  return <button type="button" className={className} onClick={logout}>{children || T.logout}</button>;
}

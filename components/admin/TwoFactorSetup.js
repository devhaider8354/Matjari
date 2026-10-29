'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sendJson } from './upload';

export default function TwoFactorSetup({ enabled }) {
  const router = useRouter();
  const [step, setStep] = useState(null); // null | {secret, qrSvg} | {codes}
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (body, after) => {
    setBusy(true);
    setError('');
    try {
      after(await sendJson('/api/account/2fa', 'POST', body));
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  if (step?.codes) {
    return (
      <div>
        <div className="alert alert-success">✅ تم تفعيل التحقق بخطوتين.</div>
        <p><strong>رموز الطوارئ:</strong> احفظها في مكان آمن (ورقة أو مدير كلمات مرور). كل رمز يُستخدم مرة واحدة إذا فقدت جوالك. لن تظهر مرة أخرى.</p>
        <div className="backup-codes" dir="ltr">{step.codes.map((c) => <code key={c}>{c}</code>)}</div>
        <button className="btn" style={{ marginTop: 12 }} onClick={() => { setStep(null); router.refresh(); }}>حفظتها</button>
      </div>
    );
  }

  if (enabled) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget)); run({ action: 'disable', ...f }, () => router.refresh()); }}>
        <div className="alert alert-success">🔐 التحقق بخطوتين مفعّل على حسابك.</div>
        {error && <div className="alert alert-error">{error}</div>}
        <details>
          <summary className="muted">إيقاف التحقق بخطوتين</summary>
          <div className="grid-2" style={{ marginTop: 10 }}>
            <div className="field"><label>كلمة المرور</label><input name="password" type="password" dir="ltr" required autoComplete="current-password" /></div>
            <div className="field"><label>رمز التطبيق أو رمز طوارئ</label><input name="code" dir="ltr" required autoComplete="one-time-code" /></div>
          </div>
          <button className="btn btn-danger btn-sm" disabled={busy}>إيقاف</button>
        </details>
      </form>
    );
  }

  if (!step) {
    return (
      <>
        <p className="muted" style={{ marginTop: 0 }}>
          بعد التفعيل يطلب الدخول رمزاً من 6 أرقام من تطبيق Google Authenticator أو Microsoft Authenticator، فلا يدخل أحد حتى لو عرف كلمة المرور.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn" disabled={busy} onClick={() => run({ action: 'setup' }, setStep)}>تفعيل التحقق بخطوتين</button>
      </>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ action: 'enable', code: new FormData(e.currentTarget).get('code') }, (d) => setStep({ codes: d.backupCodes })); }}>
      <ol className="steps-list">
        <li>ثبّت تطبيق <strong>Google Authenticator</strong> أو <strong>Microsoft Authenticator</strong> على جوالك.</li>
        <li>امسح هذا الرمز من التطبيق:</li>
      </ol>
      <div className="qr-box" dangerouslySetInnerHTML={{ __html: step.qrSvg }} />
      <p className="muted" style={{ fontSize: 13 }}>أو أدخل المفتاح يدوياً: <code dir="ltr">{step.secret}</code></p>
      <div className="field" style={{ maxWidth: 220 }}>
        <label>3. اكتب الرمز الظاهر في التطبيق</label>
        <input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} dir="ltr" required autoComplete="one-time-code" autoFocus style={{ fontSize: 22, letterSpacing: 6, textAlign: 'center' }} />
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <button className="btn" disabled={busy}>{busy ? '...' : 'تأكيد وتفعيل'}</button>
    </form>
  );
}

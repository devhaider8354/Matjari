'use client';

import { useEffect, useState } from 'react';
import { useStore } from './StoreProvider';

// يسجّل Service Worker، ويعرض زر «ثبّت التطبيق» عندما يسمح المتصفح بذلك
export default function PwaRegister() {
  const { lang } = useStore();
  const [prompt, setPrompt] = useState(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // Service Worker يتطلب HTTPS (أو localhost للتجربة)
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    let dismissed = false;
    try {
      dismissed = localStorage.getItem('pwa-dismissed') === '1';
    } catch {}
    const onPrompt = (e) => {
      e.preventDefault();
      setPrompt(e);
      setHidden(dismissed);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!prompt || hidden) return null;
  const en = lang === 'en';
  return (
    <div className="pwa-banner">
      <span>📱 {en ? 'Install our app for faster shopping' : 'ثبّت تطبيق المتجر لتسوّق أسرع'}</span>
      <button className="btn btn-sm" onClick={async () => { prompt.prompt(); await prompt.userChoice; setPrompt(null); }}>
        {en ? 'Install' : 'تثبيت'}
      </button>
      <button className="link-btn" onClick={() => { setHidden(true); try { localStorage.setItem('pwa-dismissed', '1'); } catch {} }} aria-label="close">×</button>
    </div>
  );
}

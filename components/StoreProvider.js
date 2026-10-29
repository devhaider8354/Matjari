'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useMemo } from 'react';
import { dict } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';

const StoreContext = createContext(null);

const setCookie = (name, value) => {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
};

// اللغة والعملة وبيانات المتجر لمكونات المتصفح
export default function StoreProvider({ lang, currency, currencies, store, children }) {
  const router = useRouter();
  const value = useMemo(
    () => ({
      lang,
      t: dict(lang),
      currency,
      currencies,
      store,
      money: (n) => formatMoney(n, currency),
      setLang: (l) => {
        setCookie('lang', l);
        router.refresh();
      },
      setCurrency: (code) => {
        setCookie('cur', code);
        router.refresh();
      },
    }),
    [lang, currency, currencies, store, router]
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);

import { cookies } from 'next/headers';
import { getCurrencies } from './currency';
import { dict, normLang } from './i18n';
import { formatMoney } from './money';

// لغة وعملة الزائر من الكوكي (للخادم فقط)
export function getLang() {
  return normLang(cookies().get('lang')?.value);
}

export async function getLocale() {
  const lang = getLang();
  const currencies = await getCurrencies();
  const code = cookies().get('cur')?.value;
  const currency = currencies.find((c) => c.code === code) || currencies[0];
  return { lang, t: dict(lang), currency, currencies, money: (n) => formatMoney(n, currency) };
}

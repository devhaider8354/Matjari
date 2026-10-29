import { cache } from 'react';
import Currency from '@/models/Currency';
import { cached } from './cache';
import { dbConnect } from './db';
import { BASE_CURRENCY } from './money';

const pick = (c) => ({
  code: c.code,
  symbol: c.symbol,
  nameAr: c.nameAr,
  nameEn: c.nameEn || c.code,
  rate: c.rate,
  decimals: c.decimals,
  symbolFirst: Boolean(c.symbolFirst),
});

const load = cached(
  async () => {
    await dbConnect();
    const list = await Currency.find({ active: true, code: { $ne: BASE_CURRENCY.code } }).sort({ order: 1, code: 1 }).lean();
    return list.map(pick);
  },
  ['currencies'],
  { tags: ['currencies'], revalidate: 300 }
);

// العملة الأساسية أولاً ثم العملات المفعّلة من لوحة التحكم
export const getCurrencies = cache(async () => {
  try {
    return [BASE_CURRENCY, ...(await load())];
  } catch {
    return [BASE_CURRENCY];
  }
});

export async function getCurrency(code) {
  const all = await getCurrencies();
  return all.find((c) => c.code === String(code || '').toUpperCase()) || BASE_CURRENCY;
}

import CurrencyManager from '@/components/admin/CurrencyManager';
import { dbConnect, plain } from '@/lib/db';
import { BASE_CURRENCY } from '@/lib/money';
import Currency from '@/models/Currency';
import { requirePermission } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function CurrenciesPage() {
  await requirePermission('settings');
  await dbConnect();
  const list = plain(await Currency.find().sort({ order: 1, code: 1 }).lean());
  return (
    <>
      <h1>العملات</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        الأسعار تُدخل دائماً بالعملة الأساسية <strong>{BASE_CURRENCY.code} ({BASE_CURRENCY.symbol})</strong>.
        العملات هنا للعرض فقط: يختارها الزبون من أعلى المتجر، وتُحسب بسعر الصرف الذي تحدده. سعر صرف كل طلب يُحفظ وقت الطلب.
      </p>
      <CurrencyManager list={list} base={BASE_CURRENCY} />
    </>
  );
}

import InvoiceDesigner from '@/components/admin/InvoiceDesigner';
import { dbConnect, plain } from '@/lib/db';
import { invoiceLinkAndQr } from '@/lib/invoice';
import { getSettings } from '@/lib/settings';
import Order from '@/models/Order';
import { requirePermission } from '@/lib/session';

export const dynamic = 'force-dynamic';

// طلب نموذجي للمعاينة عند عدم وجود طلبات
const SAMPLE = {
  orderNumber: '261029-DEMO01',
  createdAt: new Date().toISOString(),
  customer: { name: 'أحمد محمد', phone: '07700000000', city: 'بغداد', address: 'الكرادة، شارع 62، قرب الجامع', notes: 'الاتصال قبل الوصول' },
  items: [
    { name: 'عطر عود ملكي', variant: 'الحجم: 100ml', sku: 'PER-OUD100', qty: 1, price: 45 },
    { name: 'تيشيرت قطن أساسي', variant: 'المقاس: L · اللون: أسود', sku: 'CLO-TS01', qty: 2, price: 15 },
  ],
  subtotal: 75,
  shipping: 5,
  total: 80,
};

export default async function InvoiceDesignPage() {
  await requirePermission('content');
  await dbConnect();
  const [{ store, invoice }, latest] = await Promise.all([getSettings(), Order.findOne().sort({ createdAt: -1 }).lean()]);
  const order = latest ? plain(latest) : SAMPLE;
  const { qrSvg } = await invoiceLinkAndQr(order.orderNumber, invoice.accent);

  return (
    <>
      <h1>تصميم الوصل</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        صمّم الوصل كما تحب: الألوان والنصوص والحقول ومقاس الورق. المعاينة على {latest ? 'آخر طلب حقيقي' : 'طلب نموذجي'}.
      </p>
      <InvoiceDesigner initial={invoice} store={store} order={order} qrSvg={qrSvg} />
    </>
  );
}

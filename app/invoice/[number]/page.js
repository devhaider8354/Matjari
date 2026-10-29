import { notFound } from 'next/navigation';
import InvoiceActions from '@/components/invoice/InvoiceActions';
import InvoiceDocument from '@/components/invoice/InvoiceDocument';
import { dbConnect, plain } from '@/lib/db';
import { invoiceLinkAndQr, pageCss } from '@/lib/invoice';
import { formatMoney } from '@/lib/money';
import { verifyInvoiceToken } from '@/lib/orderView';
import { requireAdmin } from '@/lib/session';
import { getSettings } from '@/lib/settings';
import { PAPER_SIZES } from '@/lib/siteDefaults';
import Order from '@/models/Order';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Invoice', robots: { index: false, follow: false } };

// الوصل متاح بالرابط الموقّع (للزبون) أو للمدير المسجّل. غير ذلك 404
export default async function InvoicePage({ params, searchParams }) {
  const orderNumber = String(params.number).toUpperCase();
  const allowed = verifyInvoiceToken(orderNumber, searchParams?.t) || (await requireAdmin());
  if (!allowed) notFound();

  await dbConnect();
  const found = await Order.findOne({ orderNumber }).lean();
  if (!found) notFound();
  const order = plain(found);

  const { store, invoice } = await getSettings();
  const paperSize = PAPER_SIZES[searchParams?.size] ? searchParams.size : invoice.paperSize;
  const template = { ...invoice, paperSize };
  const lang = searchParams?.lang === 'en' || searchParams?.lang === 'ar' ? searchParams.lang : order.lang || 'ar';
  const { url, qrSvg } = await invoiceLinkAndQr(order.orderNumber, invoice.accent);

  return (
    <div className="invoice-page">
      <style dangerouslySetInnerHTML={{ __html: pageCss(PAPER_SIZES[paperSize]) }} />
      <InvoiceActions
        orderNumber={order.orderNumber}
        paperSize={paperSize}
        sizes={PAPER_SIZES}
        shareUrl={url}
        phone={order.customer.phone}
        storeName={lang === 'en' ? store.nameEn || store.nameAr : store.nameAr}
        lang={lang}
        total={formatMoney(order.total, order.currency || undefined)}
      />
      <InvoiceDocument order={order} store={store} template={template} lang={lang} qrSvg={qrSvg} />
    </div>
  );
}

import { formatMoney } from '@/lib/money';
import { PAPER_SIZES } from '@/lib/siteDefaults';

const LABELS = {
  ar: {
    orderNo: 'رقم الطلب', date: 'التاريخ', billTo: 'إلى', item: 'المنتج', qty: 'الكمية', price: 'السعر', total: 'المجموع',
    subtotal: 'المجموع الفرعي', shipping: 'الشحن', free: 'مجاني', grand: 'الإجمالي المطلوب', payment: 'طريقة الدفع', cod: 'الدفع عند الاستلام',
    notes: 'ملاحظات', scan: 'امسح لعرض الفاتورة', status: 'الحالة',
  },
  en: {
    orderNo: 'Order #', date: 'Date', billTo: 'Bill to', item: 'Item', qty: 'Qty', price: 'Price', total: 'Total',
    subtotal: 'Subtotal', shipping: 'Shipping', free: 'Free', grand: 'Amount due', payment: 'Payment', cod: 'Cash on delivery',
    notes: 'Notes', scan: 'Scan to view invoice', status: 'Status',
  },
};

const FONT = { sm: 12, md: 13.5, lg: 15 };

// تصميم الوصل نفسه (بدون حالة)، يُستخدم في صفحة الوصل وفي معاينة المصمم
export default function InvoiceDocument({ order, store, template, lang = 'ar', qrSvg }) {
  const L = LABELS[lang === 'en' ? 'en' : 'ar'];
  const paper = PAPER_SIZES[template.paperSize] || PAPER_SIZES.A4;
  const thermal = paper.thermal;
  const money = (n) => formatMoney(n, order.currency || undefined);
  const storeName = lang === 'en' ? store.nameEn || store.nameAr : store.nameAr;
  const address = lang === 'en' ? store.addressEn || store.addressAr : store.addressAr;
  const date = new Date(order.createdAt).toLocaleString(lang === 'en' ? 'en-GB' : 'ar-EG-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' });
  const variantOf = (i) => i.variant || [i.size, i.color].filter(Boolean).join(' · ');

  return (
    <div
      className={`invoice-doc ${thermal ? 'thermal' : ''} size-${template.paperSize.replace(/\W/g, '')}`}
      dir={lang === 'en' ? 'ltr' : 'rtl'}
      style={{ '--inv-accent': template.accent, '--inv-font': `${thermal ? FONT[template.fontSize] - 1.5 : FONT[template.fontSize]}px`, width: paper.width }}
    >
      <header className="inv-header">
        <div className="inv-brand">
          {template.showLogo && store.logo && <img src={store.logo} alt="" className="inv-logo" />}
          <div>
            <div className="inv-store">{storeName}</div>
            {template.showStoreContact && (
              <div className="inv-contact">
                {store.phone && <span dir="ltr">{store.phone}</span>}
                {store.email && <span dir="ltr">{store.email}</span>}
                {address && <span>{address}</span>}
              </div>
            )}
          </div>
        </div>
        <div className="inv-title-box">
          <div className="inv-title">{lang === 'en' ? template.titleEn : template.titleAr}</div>
          <div><span className="inv-muted">{L.orderNo}:</span> <strong dir="ltr">{order.orderNumber}</strong></div>
          <div><span className="inv-muted">{L.date}:</span> {date}</div>
        </div>
      </header>

      {template.headerNote && <div className="inv-note">{template.headerNote}</div>}

      {template.showCustomer && (
        <section className="inv-customer">
          <div className="inv-label">{L.billTo}</div>
          <strong>{order.customer.name}</strong>
          <div dir="ltr" className="inv-ltr">{order.customer.phone}</div>
          <div>{order.customer.city} — {order.customer.address}</div>
        </section>
      )}

      <table className="inv-table">
        <thead>
          <tr>
            <th>{L.item}</th>
            <th className="num">{L.qty}</th>
            {!thermal && <th className="num">{L.price}</th>}
            <th className="num">{L.total}</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i, idx) => (
            <tr key={idx}>
              <td>
                <div className="inv-item">{i.name}</div>
                {variantOf(i) && <div className="inv-muted">{variantOf(i)}</div>}
                {template.showSku && i.sku && <div className="inv-muted" dir="ltr">SKU: {i.sku}</div>}
              </td>
              <td className="num">{i.qty}</td>
              {!thermal && <td className="num">{money(i.price)}</td>}
              <td className="num">{money(i.price * i.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="inv-bottom">
        <div className="inv-side">
          <div><span className="inv-muted">{L.payment}:</span> {L.cod}</div>
          {template.showNotes && order.customer.notes && (
            <div style={{ marginTop: 6 }}><span className="inv-muted">{L.notes}:</span> {order.customer.notes}</div>
          )}
          {template.showQr && qrSvg && (
            <div className="inv-qr">
              <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <small className="inv-muted">{L.scan}</small>
            </div>
          )}
        </div>
        <div className="inv-totals">
          <div><span>{L.subtotal}</span><span>{money(order.subtotal)}</span></div>
          <div><span>{L.shipping}</span><span>{order.shipping === 0 ? L.free : money(order.shipping)}</span></div>
          <div className="inv-grand"><span>{L.grand}</span><span>{money(order.total)}</span></div>
        </div>
      </div>

      {(template.footerNote || template.terms) && (
        <footer className="inv-footer">
          {template.footerNote && <div className="inv-thanks">{template.footerNote}</div>}
          {template.terms && <div className="inv-muted">{template.terms}</div>}
        </footer>
      )}
    </div>
  );
}

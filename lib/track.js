// أحداث التسويق في المتصفح: ترسل لكل منصة مفعّلة (GA / Facebook / TikTok)
// event: 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase'
const GA_NAMES = { ViewContent: 'view_item', AddToCart: 'add_to_cart', InitiateCheckout: 'begin_checkout', Purchase: 'purchase' };
const TT_NAMES = { ViewContent: 'ViewContent', AddToCart: 'AddToCart', InitiateCheckout: 'InitiateCheckout', Purchase: 'CompletePayment' };

export function track(event, { id, name, value, currency, quantity = 1 } = {}) {
  if (typeof window === 'undefined') return;
  try {
    const content = { content_ids: id ? [String(id)] : undefined, content_name: name, content_type: 'product', value, currency, quantity };
    window.fbq?.('track', event, content);
    window.ttq?.track?.(TT_NAMES[event], content);
    window.gtag?.('event', GA_NAMES[event], { currency, value, items: id ? [{ item_id: String(id), item_name: name, quantity }] : undefined });
  } catch {}
}

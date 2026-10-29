// نصوص واجهة المتجر باللغتين. آمن للمتصفح والخادم.
export const LANGS = { ar: { label: 'العربية', dir: 'rtl' }, en: { label: 'English', dir: 'ltr' } };
export const DEFAULT_LANG = 'ar';
export const normLang = (l) => (LANGS[l] ? l : DEFAULT_LANG);

const DICT = {
  ar: {
    home: 'الرئيسية', track: 'تتبع طلبك', login: 'دخول', cart: 'السلة', account: 'حسابي', admin: 'لوحة التحكم',
    search: 'بحث', searchPlaceholder: 'ابحث عن منتج، ماركة...', all: 'الكل', categories: 'الأقسام',
    shopByCategory: 'تسوّق حسب القسم', featured: 'منتجات مميزة', newArrivals: 'وصل حديثاً', viewAll: 'عرض الكل',
    noProducts: 'لا توجد منتجات مطابقة', sale: 'خصم', outOfStock: 'نفدت الكمية', from: 'من',
    sort: 'الترتيب', sortNew: 'الأحدث', sortPriceAsc: 'السعر: من الأقل', sortPriceDesc: 'السعر: من الأعلى', sortName: 'الاسم',
    price: 'السعر', min: 'من', max: 'إلى', inStockOnly: 'المتوفر فقط', apply: 'تطبيق', clear: 'مسح', results: 'منتج',
    filters: 'التصفية', brand: 'الماركة',
    inStock: 'متوفر', onlyLeft: (n) => `متبقي ${n} قطع فقط`, unavailable: 'غير متوفر حالياً', cod: 'الدفع عند الاستلام',
    addToCart: 'أضف إلى السلة', added: 'تمت الإضافة إلى السلة', viewCart: 'عرض السلة', chooseOption: (n) => `اختر ${n} أولاً`,
    description: 'الوصف', specs: 'المواصفات', sku: 'رمز المنتج', related: 'منتجات مشابهة', qty: 'الكمية',
    cartTitle: 'سلة التسوق', cartEmpty: 'سلتك فارغة', browse: 'تصفّح المنتجات', remove: 'حذف', checkout: 'إتمام الطلب',
    summary: 'ملخص الطلب', subtotal: 'المجموع', shipping: 'الشحن', free: 'مجاني', total: 'الإجمالي', payCash: '💵 الدفع نقداً عند الاستلام',
    freeShippingOver: (m) => `شحن مجاني للطلبات فوق ${m}`, deliveryAll: 'توصيل لجميع المدن',
    deliveryInfo: 'بيانات التوصيل', fullName: 'الاسم الكامل', phone: 'رقم الهاتف', city: 'المدينة', address: 'العنوان بالتفصيل',
    addressHint: 'المنطقة، الشارع، أقرب نقطة دالة', notes: 'ملاحظات (اختياري)', saveAddress: 'احفظ هذا العنوان في حسابي',
    placeOrder: 'تأكيد الطلب', sending: 'جاري الإرسال...', haveAccount: 'لديك حساب؟', loginToFill: 'سجّل الدخول لملء بياناتك تلقائياً ومتابعة طلباتك. أو أكمل كزائر.',
    thanks: (n) => `شكراً ${n}، تم استلام طلبك`, willCall: 'سنتواصل معك هاتفياً لتأكيد الطلب قبل الشحن.', orderNo: 'رقم الطلب',
    keepNumber: 'احتفظ برقم الطلب لتتبعه من صفحة «تتبع طلبك».', continueShopping: 'متابعة التسوق', totalOnDelivery: 'الإجمالي (عند الاستلام)',
    trackTitle: 'تتبع طلبك', orderPhone: 'رقم الهاتف المستخدم في الطلب', trackBtn: 'تتبع', searching: 'جاري البحث...',
    invoice: 'الفاتورة', footerRights: 'جميع الحقوق محفوظة', followUs: 'تابعنا', contact: 'تواصل معنا', language: 'اللغة', currency: 'العملة',
    pageNotFound: 'الصفحة غير موجودة', backHome: 'العودة للرئيسية', blog: 'المدونة',
  },
  en: {
    home: 'Home', track: 'Track order', login: 'Sign in', cart: 'Cart', account: 'My account', admin: 'Dashboard',
    search: 'Search', searchPlaceholder: 'Search products, brands...', all: 'All', categories: 'Categories',
    shopByCategory: 'Shop by category', featured: 'Featured', newArrivals: 'New arrivals', viewAll: 'View all',
    noProducts: 'No matching products', sale: 'Sale', outOfStock: 'Sold out', from: 'From',
    sort: 'Sort', sortNew: 'Newest', sortPriceAsc: 'Price: low to high', sortPriceDesc: 'Price: high to low', sortName: 'Name',
    price: 'Price', min: 'Min', max: 'Max', inStockOnly: 'In stock only', apply: 'Apply', clear: 'Clear', results: 'products',
    filters: 'Filters', brand: 'Brand',
    inStock: 'In stock', onlyLeft: (n) => `Only ${n} left`, unavailable: 'Currently unavailable', cod: 'Cash on delivery',
    addToCart: 'Add to cart', added: 'Added to cart', viewCart: 'View cart', chooseOption: (n) => `Please choose ${n}`,
    description: 'Description', specs: 'Specifications', sku: 'SKU', related: 'You may also like', qty: 'Quantity',
    cartTitle: 'Shopping cart', cartEmpty: 'Your cart is empty', browse: 'Browse products', remove: 'Remove', checkout: 'Checkout',
    summary: 'Order summary', subtotal: 'Subtotal', shipping: 'Shipping', free: 'Free', total: 'Total', payCash: '💵 Cash on delivery',
    freeShippingOver: (m) => `Free shipping on orders over ${m}`, deliveryAll: 'Delivery to all cities',
    deliveryInfo: 'Delivery details', fullName: 'Full name', phone: 'Phone number', city: 'City', address: 'Full address',
    addressHint: 'Area, street, nearest landmark', notes: 'Notes (optional)', saveAddress: 'Save this address to my account',
    placeOrder: 'Place order', sending: 'Sending...', haveAccount: 'Have an account?', loginToFill: 'Sign in to autofill your details and track orders, or continue as a guest.',
    thanks: (n) => `Thank you ${n}, we received your order`, willCall: 'We will call you to confirm the order before shipping.', orderNo: 'Order number',
    keepNumber: 'Keep your order number to track it from the “Track order” page.', continueShopping: 'Continue shopping', totalOnDelivery: 'Total (on delivery)',
    trackTitle: 'Track your order', orderPhone: 'Phone number used in the order', trackBtn: 'Track', searching: 'Searching...',
    invoice: 'Invoice', footerRights: 'All rights reserved', followUs: 'Follow us', contact: 'Contact us', language: 'Language', currency: 'Currency',
    pageNotFound: 'Page not found', backHome: 'Back to home', blog: 'Blog',
  },
};

export function dict(lang) {
  return DICT[normLang(lang)];
}

// يختار الحقل حسب اللغة مع الرجوع للعربي: pick(product, 'name', 'en') → nameEn || name
export function pick(obj, field, lang) {
  if (!obj) return '';
  if (lang === 'en') return obj[`${field}En`] || obj[field] || '';
  return obj[field] || obj[`${field}En`] || '';
}

export const ORDER_STATUS_LABELS = {
  ar: { pending: 'قيد المراجعة', confirmed: 'مؤكد', shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغي' },
  en: { pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' },
};

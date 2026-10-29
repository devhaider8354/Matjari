// قوالب أنواع المنتجات: تملأ المواصفات والخيارات المقترحة في نموذج الإضافة.
// يمكن إضافة نوع جديد هنا دون أي تعديل آخر.
export const PRODUCT_TYPES = {
  general: { label: 'منتج عام', icon: '📦', specs: [], options: [] },
  clothing: {
    label: 'ملابس وأزياء',
    icon: '👕',
    specs: ['الخامة', 'القصّة', 'بلد الصنع', 'تعليمات الغسيل'],
    options: [{ name: 'المقاس', values: ['S', 'M', 'L', 'XL'] }, { name: 'اللون', values: [] }],
  },
  electronics: {
    label: 'إلكترونيات وأجهزة',
    icon: '📱',
    specs: ['العلامة التجارية', 'الموديل', 'المعالج', 'الذاكرة', 'الشاشة', 'البطارية', 'الضمان'],
    options: [{ name: 'السعة', values: [] }, { name: 'اللون', values: [] }],
  },
  parts: {
    label: 'قطع إلكترونية وغيار',
    icon: '🔌',
    specs: ['رقم القطعة', 'التوافق', 'الجهد/القدرة', 'الشركة المصنّعة', 'الحالة', 'الضمان'],
    options: [],
  },
  perfume: {
    label: 'عطور',
    icon: '🧴',
    specs: ['التركيز', 'العائلة العطرية', 'النفحات العليا', 'النفحات الأساسية', 'لمن', 'الثبات'],
    options: [{ name: 'الحجم', values: ['50ml', '100ml'] }],
  },
  flowers: {
    label: 'زهور وهدايا',
    icon: '💐',
    specs: ['نوع الزهور', 'عدد الورود', 'التغليف', 'مدة النضارة', 'المناسبة'],
    options: [{ name: 'الحجم', values: ['صغير', 'وسط', 'كبير'] }],
  },
  cosmetics: {
    label: 'تجميل وعناية',
    icon: '💄',
    specs: ['نوع البشرة', 'المكونات', 'الحجم', 'بلد الصنع', 'تاريخ الصلاحية'],
    options: [{ name: 'الدرجة', values: [] }],
  },
  food: {
    label: 'أغذية ومشروبات',
    icon: '🍫',
    specs: ['الوزن', 'المكونات', 'بلد المنشأ', 'طريقة الحفظ', 'تاريخ الصلاحية'],
    options: [],
  },
};

export const typeOf = (key) => PRODUCT_TYPES[key] || PRODUCT_TYPES.general;

// كل التركيبات الممكنة لقيم الخيارات: [['S','أسود'], ['S','أبيض'], ...]
export function combinations(options) {
  const lists = options.filter((o) => o.values.length).map((o) => o.values);
  if (!lists.length) return [];
  return lists.reduce((acc, values) => acc.flatMap((combo) => values.map((v) => [...combo, v])), [[]]);
}

export const variantKey = (values) => values.join(' / ');

import mongoose from 'mongoose';
import { PRODUCT_TYPES } from '@/lib/productTypes';

// متغير = تركيبة من قيم الخيارات (مثل 100ml / أسود) بسعر ومخزون ورموز خاصة
const VariantSchema = new mongoose.Schema(
  {
    key: { type: String, required: true }, // القيم مفصولة بـ " / " بنفس ترتيب الخيارات
    values: [String],
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, default: null },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, default: '' },
    barcode: { type: String, default: '' },
    image: { type: String, default: '' }, // صورة تظهر عند اختيار هذا المتغير
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.keys(PRODUCT_TYPES), default: 'general' },
    name: { type: String, required: true, trim: true },
    nameEn: { type: String, default: '', trim: true },
    brand: { type: String, default: '', trim: true, index: true },
    description: { type: String, default: '' },
    descriptionEn: { type: String, default: '' },
    // SEO: إذا تُركت فارغة تُولَّد من الاسم والوصف
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    seoKeywords: [String],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    tags: [String],

    // للمنتج البسيط: السعر والمخزون والرموز هنا. للمنتج ذي المتغيرات:
    // price = أقل سعر بين المتغيرات، وstock = مجموع مخزونها (يُحسبان عند الحفظ)
    price: { type: Number, required: true, min: 0, index: true },
    comparePrice: { type: Number, default: null },
    cost: { type: Number, default: null }, // سعر التكلفة: للإدارة فقط
    stock: { type: Number, default: 0, min: 0 },
    lowStockAlert: { type: Number, default: 3 },
    sku: { type: String, default: '' },
    barcode: { type: String, default: '' },

    images: [String],
    // فيديوهات: ملف مرفوع { type:'file', url, poster } أو يوتيوب { type:'youtube', id }
    videos: [{ _id: false, type: { type: String }, url: String, id: String, poster: String, title: String }],
    // مصدر الصور ورخصتها (للصور المجلوبة من مكتبات مرخّصة؛ تُعرض في صفحة المنتج)
    imageCredits: [{ _id: false, image: String, author: String, license: String, source: String, link: String }],
    specs: [{ _id: false, key: String, value: String }],
    options: [{ _id: false, name: String, values: [String] }],
    variants: [VariantSchema],

    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// الرمز فريد فقط عندما يكون غير فارغ
ProductSchema.index({ sku: 1 }, { unique: true, partialFilterExpression: { sku: { $gt: '' } } });
ProductSchema.index({ barcode: 1 }, { unique: true, partialFilterExpression: { barcode: { $gt: '' } } });
ProductSchema.index({ 'variants.sku': 1 });
ProductSchema.index({ 'variants.barcode': 1 });
ProductSchema.index({ active: 1, createdAt: -1 });
// فهرس البحث النصي: الاسم أهم من الماركة ثم الوسوم ثم الوصف. 'none' يناسب العربية (بدون تجذير إنجليزي)
ProductSchema.index(
  { name: 'text', nameEn: 'text', brand: 'text', tags: 'text', description: 'text', descriptionEn: 'text' },
  { name: 'product_search', default_language: 'none', weights: { name: 10, nameEn: 10, brand: 6, tags: 4, description: 1, descriptionEn: 1 } }
);

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);

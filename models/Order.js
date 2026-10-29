import mongoose from 'mongoose';
import { ORDER_STATUSES } from '@/lib/config';

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    qty: Number,
    variantKey: String, // مفتاح المتغير (لإعادة المخزون عند الإلغاء)
    variant: String, // نص يُعرض: "الحجم: 100ml · اللون: أسود"
    sku: String,
    barcode: String,
    size: String, // حقول قديمة للطلبات السابقة
    color: String,
    image: String,
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // فارغ لطلبات الزوار
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true, index: true },
      city: { type: String, required: true },
      address: { type: String, required: true },
      notes: String,
      email: String, // اختياري: لإشعارات حالة الطلب
    },
    items: [OrderItemSchema],
    subtotal: Number,
    shipping: Number,
    total: Number,
    paymentMethod: { type: String, default: 'cod' }, // الدفع عند الاستلام
    // عملة العرض وسعر صرفها وقت الطلب (المبالغ أعلاه بالعملة الأساسية)
    currency: { type: Object, default: null },
    lang: { type: String, default: 'ar' },
    adminNote: { type: String, default: '' },
    history: [{ _id: false, status: String, at: Date }],
    status: { type: String, enum: Object.keys(ORDER_STATUSES), default: 'pending', index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);

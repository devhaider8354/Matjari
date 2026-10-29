import mongoose from 'mongoose';

// الأقسام بمستويين: قسم رئيسي وأقسام فرعية تحته
const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameEn: { type: String, default: '', trim: true },
    slug: { type: String, required: true, unique: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    description: { type: String, default: '' },
    descriptionEn: { type: String, default: '' },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    icon: { type: String, default: '' }, // إيموجي يظهر في شريط الأقسام
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);

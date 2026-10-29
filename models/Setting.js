import mongoose from 'mongoose';

// مستند واحد (key: 'site') لكل إعدادات المتجر القابلة للتعديل من اللوحة
const SlideSchema = new mongoose.Schema(
  {
    image: { type: String, default: '' },
    video: { type: String, default: '' }, // فيديو مرفوع يعمل كخلفية للشريحة
    youtube: { type: String, default: '' }, // أو معرّف فيديو يوتيوب
    title: String,
    subtitle: String,
    buttonText: String,
    link: String,
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const SettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    theme: { type: Object, default: {} },
    slides: [SlideSchema],
    store: { type: Object, default: {} }, // الاسم، الشعار، التواصل
    social: { type: Array, default: [] }, // [{ platform, url }]
    seo: { type: Object, default: {} }, // العنوان والوصف والكلمات المفتاحية
    invoice: { type: Object, default: {} }, // تصميم الوصل
    marketing: { type: Object, default: {} }, // بكسلات فيسبوك وتيك توك
    music: { type: Object, default: {} }, // موسيقى الخلفية
    notifications: { type: Object, default: {} }, // تيليجرام وبريد الإشعارات
  },
  { timestamps: true, minimize: false }
);

export default mongoose.models.Setting || mongoose.model('Setting', SettingSchema);

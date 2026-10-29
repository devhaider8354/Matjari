import mongoose from 'mongoose';

// مقالات المدونة (محتوى Markdown بسيط)
const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    titleEn: { type: String, default: '' },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: '' },
    excerptEn: { type: String, default: '' },
    content: { type: String, default: '' },
    contentEn: { type: String, default: '' },
    cover: { type: String, default: '' },
    tags: [String],
    author: { type: String, default: '' },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null, index: true },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.Post || mongoose.model('Post', PostSchema);

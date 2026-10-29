import { dbConnect } from '@/lib/db';
import { appUrl } from '@/lib/mail';
import Category from '@/models/Category';
import Post from '@/models/Post';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

const abs = (u) => (u?.startsWith('http') ? u : `${appUrl()}${u}`);

// خريطة الموقع لمحركات البحث: الرئيسية، الأقسام، المنتجات (مع صورها)، والمدونة
export default async function sitemap() {
  const base = appUrl();
  await dbConnect();
  const [cats, products, posts] = await Promise.all([
    Category.find({ active: true }).select('slug updatedAt').lean(),
    Product.find({ active: true }).select('_id updatedAt images').sort({ updatedAt: -1 }).limit(45000).lean(),
    Post.find({ published: true }).select('slug updatedAt cover').lean(),
  ]);
  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/blog`, changeFrequency: 'weekly', priority: 0.5 },
    ...cats.map((c) => ({ url: `${base}/category/${encodeURIComponent(c.slug)}`, lastModified: c.updatedAt, changeFrequency: 'weekly', priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/product/${p._id}`, lastModified: p.updatedAt, changeFrequency: 'weekly', priority: 0.6, images: (p.images || []).slice(0, 3).map(abs) })),
    ...posts.map((p) => ({ url: `${base}/blog/${encodeURIComponent(p.slug)}`, lastModified: p.updatedAt, changeFrequency: 'monthly', priority: 0.5 })),
  ];
}

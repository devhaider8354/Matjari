import Post from '@/models/Post';
import { cached } from './cache';
import { dbConnect, plain } from './db';

export async function uniquePostSlug(slug, excludeId) {
  let s = slug;
  for (let i = 2; await Post.exists({ slug: s, ...(excludeId && { _id: { $ne: excludeId } }) }); i++) s = `${slug}-${i}`;
  return s;
}

const LIST_FIELDS = 'title titleEn slug excerpt excerptEn cover tags author publishedAt';

export const getPublishedPosts = cached(
  async (limit = 50) => {
    await dbConnect();
    return plain(await Post.find({ published: true }).select(LIST_FIELDS).sort({ publishedAt: -1 }).limit(limit).lean());
  },
  ['blog-list'],
  { tags: ['blog'], revalidate: 300 }
);

export const getPostBySlug = cached(
  async (slug) => {
    await dbConnect();
    const p = await Post.findOne({ slug, published: true }).lean();
    return p ? plain(p) : null;
  },
  ['blog-post'],
  { tags: ['blog'], revalidate: 300 }
);

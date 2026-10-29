import mongoose from 'mongoose';
import { notFound } from 'next/navigation';
import PostEditor from '@/components/admin/PostEditor';
import { dbConnect, plain } from '@/lib/db';
import { requirePermission } from '@/lib/session';
import Post from '@/models/Post';

export const dynamic = 'force-dynamic';

// /blog/new لمقال جديد، أو /blog/<id> للتعديل
export default async function EditPostPage({ params }) {
  await requirePermission('content');
  let post = null;
  if (params.id !== 'new') {
    if (!mongoose.isValidObjectId(params.id)) notFound();
    await dbConnect();
    post = await Post.findById(params.id).lean();
    if (!post) notFound();
  }
  return (
    <>
      <h1>{post ? `تعديل: ${post.title}` : 'مقال جديد'}</h1>
      <PostEditor post={post ? plain(post) : null} />
    </>
  );
}

import { NextResponse } from 'next/server';
import { uniquePostSlug } from '@/lib/blog';
import { dbConnect } from '@/lib/db';
import { adminRoute } from '@/lib/session';
import { parsePost } from '@/lib/validate';
import Post from '@/models/Post';

export const POST = adminRoute(async (req, _ctx, admin) => {
  const { data, error } = parsePost((await req.json().catch(() => null)) || {});
  if (error) return NextResponse.json({ error }, { status: 400 });
  await dbConnect();
  data.slug = await uniquePostSlug(data.slug);
  data.author = data.author || admin.name;
  if (data.published) data.publishedAt = new Date();
  const post = await Post.create(data);
  return NextResponse.json({ id: String(post._id) }, { status: 201 });
}, 'content');

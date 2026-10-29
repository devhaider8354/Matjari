import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { uniquePostSlug } from '@/lib/blog';
import { dbConnect } from '@/lib/db';
import { adminRoute } from '@/lib/session';
import { parsePost } from '@/lib/validate';
import Post from '@/models/Post';

const notFound = () => NextResponse.json({ error: 'المقال غير موجود' }, { status: 404 });

export const PUT = adminRoute(async (req, { params }) => {
  if (!mongoose.isValidObjectId(params.id)) return notFound();
  const { data, error } = parsePost((await req.json().catch(() => null)) || {});
  if (error) return NextResponse.json({ error }, { status: 400 });
  await dbConnect();
  const existing = await Post.findById(params.id);
  if (!existing) return notFound();
  data.slug = await uniquePostSlug(data.slug, params.id);
  // تاريخ النشر يُضبط عند أول نشر فقط
  if (data.published && !existing.publishedAt) data.publishedAt = new Date();
  Object.assign(existing, data);
  await existing.save();
  return NextResponse.json({ id: String(existing._id), slug: existing.slug });
}, 'content');

export const DELETE = adminRoute(async (_req, { params }) => {
  if (!mongoose.isValidObjectId(params.id)) return notFound();
  await dbConnect();
  await Post.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}, 'content');

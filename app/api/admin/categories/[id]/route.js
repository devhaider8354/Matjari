import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { uniqueCategorySlug, validateCategoryParent } from '@/lib/catalog';
import { dbConnect } from '@/lib/db';
import { adminRoute } from '@/lib/session';
import { parseCategory } from '@/lib/validate';
import Category from '@/models/Category';
import Product from '@/models/Product';

const bad = (error, status = 400) => NextResponse.json({ error }, { status });

export const PUT = adminRoute(async (req, { params }) => {
  if (!mongoose.isValidObjectId(params.id)) return bad('غير موجود', 404);
  const body = await req.json().catch(() => null);
  if (!body) return bad('طلب غير صالح');
  const { data, error } = parseCategory(body);
  if (error) return bad(error);

  await dbConnect();
  const parentError = await validateCategoryParent(data.parent, params.id);
  if (parentError) return bad(parentError);
  data.slug = await uniqueCategorySlug(data.slug, params.id);
  const category = await Category.findByIdAndUpdate(params.id, { $set: data }, { new: true });
  if (!category) return bad('غير موجود', 404);
  return NextResponse.json({ id: String(category._id) });
}, 'catalog');

export const DELETE = adminRoute(async (_req, { params }) => {
  if (!mongoose.isValidObjectId(params.id)) return bad('غير موجود', 404);
  await dbConnect();
  if (await Category.exists({ parent: params.id })) return bad('احذف أو انقل الأقسام الفرعية أولاً');
  const count = await Product.countDocuments({ category: params.id });
  if (count) return bad(`يوجد ${count} منتج في هذا القسم، انقلها لقسم آخر أولاً`);
  await Category.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}, 'catalog');

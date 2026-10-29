import { NextResponse } from 'next/server';
import { uniqueCategorySlug, validateCategoryParent } from '@/lib/catalog';
import { dbConnect } from '@/lib/db';
import { adminRoute } from '@/lib/session';
import { parseCategory } from '@/lib/validate';
import Category from '@/models/Category';

const bad = (error, status = 400) => NextResponse.json({ error }, { status });

export const POST = adminRoute(async (req) => {
  const body = await req.json().catch(() => null);
  if (!body) return bad('طلب غير صالح');
  const { data, error } = parseCategory(body);
  if (error) return bad(error);

  await dbConnect();
  const parentError = await validateCategoryParent(data.parent);
  if (parentError) return bad(parentError);
  data.slug = await uniqueCategorySlug(data.slug);
  const category = await Category.create(data);
  return NextResponse.json({ id: String(category._id) }, { status: 201 });
}, 'catalog');

import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { findCodeConflict, validProductCategory } from '@/lib/catalog';
import { dbConnect } from '@/lib/db';
import { adminRoute } from '@/lib/session';
import { parseProduct } from '@/lib/validate';
import Product from '@/models/Product';

const notFound = () => NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 });

export const PUT = adminRoute(async (req, { params }) => {
  if (!mongoose.isValidObjectId(params.id)) return notFound();
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });

  const { data, codes, error } = parseProduct(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  await dbConnect();
  const problem = (await validProductCategory(data.category)) || (await findCodeConflict(codes, params.id));
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const product = await Product.findByIdAndUpdate(params.id, { $set: data }, { new: true, runValidators: true });
  if (!product) return notFound();
  return NextResponse.json({ id: String(product._id) });
}, 'catalog');

export const DELETE = adminRoute(async (_req, { params }) => {
  if (!mongoose.isValidObjectId(params.id)) return notFound();
  await dbConnect();
  // الطلبات القديمة تحتفظ بنسخة من اسم المنتج وسعره، لذا الحذف آمن
  const product = await Product.findByIdAndDelete(params.id);
  if (!product) return notFound();
  return NextResponse.json({ ok: true });
}, 'catalog');

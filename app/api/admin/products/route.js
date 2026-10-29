import { NextResponse } from 'next/server';
import { findCodeConflict, validProductCategory } from '@/lib/catalog';
import { dbConnect } from '@/lib/db';
import { adminRoute } from '@/lib/session';
import { parseProduct } from '@/lib/validate';
import Product from '@/models/Product';

export const POST = adminRoute(async (req) => {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });

  const { data, codes, error } = parseProduct(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  await dbConnect();
  const problem = (await validProductCategory(data.category)) || (await findCodeConflict(codes));
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const product = await Product.create(data);
  return NextResponse.json({ id: String(product._id) }, { status: 201 });
}, 'catalog');

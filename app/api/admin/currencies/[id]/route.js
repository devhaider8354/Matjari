import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { adminRoute } from '@/lib/session';
import { parseCurrency } from '@/lib/validate';
import Currency from '@/models/Currency';

const notFound = () => NextResponse.json({ error: 'غير موجود' }, { status: 404 });

export const PUT = adminRoute(async (req, { params }) => {
  if (!mongoose.isValidObjectId(params.id)) return notFound();
  const { data, error } = parseCurrency((await req.json().catch(() => null)) || {});
  if (error) return NextResponse.json({ error }, { status: 400 });
  await dbConnect();
  if (await Currency.exists({ code: data.code, _id: { $ne: params.id } })) {
    return NextResponse.json({ error: 'رمز العملة مستخدم' }, { status: 409 });
  }
  const c = await Currency.findByIdAndUpdate(params.id, { $set: data });
  return c ? NextResponse.json({ ok: true }) : notFound();
}, 'settings');

export const DELETE = adminRoute(async (_req, { params }) => {
  if (!mongoose.isValidObjectId(params.id)) return notFound();
  await dbConnect();
  await Currency.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}, 'settings');

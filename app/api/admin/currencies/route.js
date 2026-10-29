import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { BASE_CURRENCY } from '@/lib/money';
import { adminRoute } from '@/lib/session';
import { parseCurrency } from '@/lib/validate';
import Currency from '@/models/Currency';

export const POST = adminRoute(async (req) => {
  const { data, error } = parseCurrency((await req.json().catch(() => null)) || {});
  if (error) return NextResponse.json({ error }, { status: 400 });
  if (data.code === BASE_CURRENCY.code) {
    return NextResponse.json({ error: 'هذه هي العملة الأساسية للمتجر' }, { status: 400 });
  }
  await dbConnect();
  if (await Currency.exists({ code: data.code })) {
    return NextResponse.json({ error: 'العملة مضافة مسبقاً' }, { status: 409 });
  }
  const c = await Currency.create(data);
  return NextResponse.json({ id: String(c._id) }, { status: 201 });
}, 'settings');

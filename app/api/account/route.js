import { NextResponse } from 'next/server';
import { getCurrentUser, publicUser } from '@/lib/session';
import User from '@/models/User';

const unauthorized = () => NextResponse.json({ error: 'سجّل الدخول أولاً' }, { status: 401 });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return NextResponse.json({ user: publicUser(user) });
}

export async function PUT(req) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const b = (await req.json().catch(() => null)) || {};

  const update = {
    name: String(b.name || '').trim().slice(0, 100),
    phone: String(b.phone || '').replace(/[\s-]/g, '').slice(0, 20),
    city: String(b.city || '').trim().slice(0, 60),
    address: String(b.address || '').trim().slice(0, 300),
  };
  if (!update.name) return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
  if (update.phone && !/^\+?\d{7,15}$/.test(update.phone)) {
    return NextResponse.json({ error: 'رقم الهاتف غير صالح' }, { status: 400 });
  }

  const saved = await User.findByIdAndUpdate(user._id, { $set: update }, { new: true }).lean();
  return NextResponse.json({ user: publicUser(saved) });
}

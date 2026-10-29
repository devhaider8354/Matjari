import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { ORDER_STATUSES } from '@/lib/config';
import { dbConnect } from '@/lib/db';
import { notifyStatusChange } from '@/lib/notify';
import { adminRoute } from '@/lib/session';
import { restoreStock } from '@/lib/stock';
import Order from '@/models/Order';

export const PATCH = adminRoute(async (req, { params }) => {
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
  }
  const { status, adminNote } = (await req.json().catch(() => null)) || {};
  if (status !== undefined && !ORDER_STATUSES[status]) {
    return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 });
  }

  await dbConnect();
  if (typeof adminNote === 'string') {
    await Order.updateOne({ _id: params.id }, { $set: { adminNote: adminNote.slice(0, 1000) } });
  }
  if (!status) return NextResponse.json({ ok: true });

  // الطلب الملغي لا يُعاد فتحه، لأن مخزونه أُعيد للمنتجات
  const before = await Order.findOneAndUpdate(
    { _id: params.id, status: { $ne: 'cancelled' } },
    { $set: { status }, $push: { history: { status, at: new Date() } } }
  );
  if (!before) {
    return NextResponse.json({ error: 'الطلب غير موجود أو ملغي مسبقاً' }, { status: 400 });
  }
  if (status === 'cancelled') {
    // الطلبات القديمة (قبل المتغيرات) تُرجع للمخزون العام
    await restoreStock(before.items.map((i) => ({ product: i.product, variantKey: i.variantKey, qty: i.qty })));
  }
  // إشعار الزبون بالبريد (في الخلفية)
  if (status !== before.status) notifyStatusChange(before.toObject(), status);
  return NextResponse.json({ ok: true });
}, 'orders');

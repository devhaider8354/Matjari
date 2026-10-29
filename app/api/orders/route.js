import crypto from 'crypto';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { invalidate } from '@/lib/cache';
import { getCurrency } from '@/lib/currency';
import { notifyNewOrder } from '@/lib/notify';
import { shippingFor } from '@/lib/config';
import { dbConnect } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { clientIp, getCurrentUser } from '@/lib/session';
import { restoreStock, stockFilter, stockInc } from '@/lib/stock';
import { parseCustomer } from '@/lib/validate';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';

const bad = (error, status = 400) => NextResponse.json({ error }, { status });

function newOrderNumber() {
  const d = new Date();
  const date = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `${date}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export async function POST(req) {
  // يمنع إغراق المتجر بطلبات وهمية تحجز المخزون
  if (!(await rateLimit(`order:${clientIp(req)}`, 10, 60 * 60 * 1000)).ok) {
    return bad('عدد كبير من الطلبات، حاول لاحقاً أو تواصل معنا', 429);
  }
  const body = await req.json().catch(() => null);
  if (!body) return bad('طلب غير صالح');

  const { customer, error } = parseCustomer(body.customer);
  if (error) return bad(error);

  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  if (!items.length) return bad('السلة فارغة');

  await dbConnect();
  const ids = items.map((i) => i.productId).filter((id) => mongoose.isValidObjectId(id));
  const products = await Product.find({ _id: { $in: ids }, active: true }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  // الأسعار والمتغيرات تؤخذ من قاعدة البيانات دائماً، وليس من المتصفح
  const lines = new Map(); // productId|variantKey → سطر
  for (const item of items) {
    const p = byId.get(String(item.productId));
    if (!p) return bad('أحد المنتجات لم يعد متوفراً، يرجى تحديث السلة');
    const qty = Math.min(99, Math.max(1, parseInt(item.qty, 10) || 1));

    let variant = null;
    if (p.variants?.length) {
      variant = p.variants.find((v) => v.key === item.variantKey);
      if (!variant) return bad(`اختر خيارات صحيحة لـ "${p.name}"`);
    }
    const key = `${p._id}|${variant?.key || ''}`;
    const prev = lines.get(key);
    if (prev) {
      prev.qty += qty;
      continue;
    }
    lines.set(key, {
      product: p._id,
      name: p.name,
      price: variant ? variant.price : p.price,
      qty,
      variantKey: variant?.key || '',
      variant: variant ? p.options.map((o, i) => `${o.name}: ${variant.values[i]}`).join(' · ') : '',
      sku: variant?.sku || p.sku || '',
      barcode: variant?.barcode || p.barcode || '',
      image: p.images?.[0] || '',
    });
  }
  const orderItems = [...lines.values()];

  const reserved = [];
  for (const line of orderItems) {
    const r = await Product.updateOne(stockFilter(line.product, line.variantKey, line.qty), stockInc(line.variantKey, -line.qty));
    if (r.modifiedCount !== 1) {
      await restoreStock(reserved);
      return bad(`الكمية المطلوبة من "${line.name}${line.variantKey ? ` (${line.variantKey})` : ''}" غير متوفرة حالياً`);
    }
    reserved.push(line);
  }

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = shippingFor(subtotal);
  const user = await getCurrentUser();
  // نحفظ العملة وسعر صرفها وقت الطلب، فلا يتغير مبلغ التحصيل لو تغيّر السعر لاحقاً
  const currency = await getCurrency(body.currency);
  try {
    const order = await Order.create({
      orderNumber: newOrderNumber(),
      user: user?._id,
      customer,
      items: orderItems,
      subtotal,
      shipping,
      total: subtotal + shipping,
      currency: { code: currency.code, symbol: currency.symbol, rate: currency.rate, decimals: currency.decimals, symbolFirst: currency.symbolFirst },
      lang: body.lang === 'en' ? 'en' : 'ar',
      paymentMethod: 'cod',
    });
    // حفظ عنوان التوصيل في حساب الزبون ليُملأ تلقائياً في الطلب القادم
    if (user && body.saveAddress) {
      await User.updateOne({ _id: user._id }, { $set: { phone: customer.phone, city: customer.city, address: customer.address } });
    }
    // المخزون تغيّر: نمسح الذاكرة المؤقتة للمنتجات، ونرسل إشعار الطلب الجديد في الخلفية
    invalidate('catalog');
    notifyNewOrder(order.toObject());
    return NextResponse.json({ orderNumber: order.orderNumber }, { status: 201 });
  } catch (e) {
    await restoreStock(reserved);
    console.error('order create failed', e);
    return bad('تعذّر إنشاء الطلب، حاول مرة أخرى', 500);
  }
}

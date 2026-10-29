import Product from '@/models/Product';

// حجز/إرجاع المخزون بشكل ذري: للمتغير نعدّل مخزونه ومجموع المنتج معاً
export const stockFilter = (id, variantKey, qty) =>
  variantKey
    ? { _id: id, variants: { $elemMatch: { key: variantKey, stock: { $gte: qty } } } }
    : { _id: id, stock: { $gte: qty } };

export const stockInc = (variantKey, qty) =>
  variantKey ? { $inc: { stock: qty, 'variants.$.stock': qty } } : { $inc: { stock: qty } };

// يُرجع كميات أسطر طلب (عند فشل الطلب أو إلغائه)
export async function restoreStock(lines) {
  for (const { product, variantKey, qty } of lines) {
    if (!product) continue;
    const filter = variantKey ? { _id: product, 'variants.key': variantKey } : { _id: product };
    await Product.updateOne(filter, stockInc(variantKey, qty));
  }
}

import mongoose from 'mongoose';
import { cache } from 'react';
import Category from '@/models/Category';
import Product from '@/models/Product';
import { cached } from './cache';
import { dbConnect, plain } from './db';

const loadTree = cached(
  async (activeOnly) => {
    await dbConnect();
    const all = plain(await Category.find(activeOnly ? { active: true } : {}).sort({ order: 1, name: 1 }).lean());
    const roots = all.filter((c) => !c.parent).map((c) => ({ ...c, children: [] }));
    const byId = new Map(roots.map((c) => [c._id, c]));
    for (const c of all) if (c.parent && byId.has(c.parent)) byId.get(c.parent).children.push(c);
    return roots;
  },
  ['category-tree'],
  { tags: ['catalog'], revalidate: 300 }
);

// كل الأقسام مرتبة كشجرة: [{...قسم, children: [...]}]
export const getCategoryTree = cache(({ activeOnly = true } = {}) => loadTree(activeOnly));

// معرّف القسم مع أقسامه الفرعية، لعرض منتجات القسم الرئيسي كاملة
export async function categoryWithChildrenIds(categoryId) {
  const children = await Category.find({ parent: categoryId }).select('_id').lean();
  return [new mongoose.Types.ObjectId(String(categoryId)), ...children.map((c) => c._id)];
}

// يضمن slug فريداً بإضافة رقم عند التكرار
export async function uniqueCategorySlug(slug, excludeId) {
  let candidate = slug;
  for (let i = 2; await Category.exists({ slug: candidate, ...(excludeId && { _id: { $ne: excludeId } }) }); i++) {
    candidate = `${slug}-${i}`;
  }
  return candidate;
}

// القسم الأب يجب أن يكون قسماً رئيسياً (مستويان فقط)
export async function validateCategoryParent(parent, selfId) {
  if (!parent) return null;
  if (!mongoose.isValidObjectId(parent)) return 'القسم الأب غير صالح';
  if (selfId && String(parent) === String(selfId)) return 'لا يمكن جعل القسم أباً لنفسه';
  const p = await Category.findById(parent).lean();
  if (!p) return 'القسم الأب غير موجود';
  if (p.parent) return 'الأقسام الفرعية لا تحتوي أقساماً فرعية (مستويان فقط)';
  if (selfId && (await Category.exists({ parent: selfId }))) return 'هذا القسم لديه أقسام فرعية، فلا يمكن نقله تحت قسم آخر';
  return null;
}

// يتحقق أن الـ category المرسل في المنتج موجود
export async function validProductCategory(id) {
  if (!id) return null;
  if (!mongoose.isValidObjectId(id) || !(await Category.exists({ _id: id }))) return 'القسم غير موجود';
  return null;
}

// يتحقق أن SKU والباركود غير مستخدمين في منتج آخر (في المنتج نفسه أو متغيراته)
export async function findCodeConflict(codes, excludeId) {
  if (!codes.length) return null;
  const filter = {
    $or: [{ sku: { $in: codes } }, { barcode: { $in: codes } }, { 'variants.sku': { $in: codes } }, { 'variants.barcode': { $in: codes } }],
  };
  if (excludeId) filter._id = { $ne: excludeId };
  const other = await Product.findOne(filter).select('name sku barcode variants.sku variants.barcode').lean();
  if (!other) return null;
  const used = [other.sku, other.barcode, ...other.variants.flatMap((v) => [v.sku, v.barcode])];
  const clash = codes.find((c) => used.includes(c));
  return `الرمز ${clash} مستخدم في المنتج "${other.name}"`;
}

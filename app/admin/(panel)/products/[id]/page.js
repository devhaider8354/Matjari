import mongoose from 'mongoose';
import { notFound } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { getCategoryTree } from '@/lib/catalog';
import { dbConnect, plain } from '@/lib/db';
import Product from '@/models/Product';
import { requirePermission } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }) {
  await requirePermission('catalog');
  if (!mongoose.isValidObjectId(params.id)) notFound();
  await dbConnect();
  const [product, categories] = await Promise.all([Product.findById(params.id).lean(), getCategoryTree({ activeOnly: false })]);
  if (!product) notFound();

  return (
    <>
      <h1>تعديل: {product.name}</h1>
      <ProductForm product={plain(product)} categories={categories} />
    </>
  );
}

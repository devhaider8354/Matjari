import ProductForm from '@/components/admin/ProductForm';
import { getCategoryTree } from '@/lib/catalog';
import { requirePermission } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  await requirePermission('catalog');
  const categories = await getCategoryTree({ activeOnly: false });
  return (
    <>
      <h1>منتج جديد</h1>
      <ProductForm categories={categories} />
    </>
  );
}

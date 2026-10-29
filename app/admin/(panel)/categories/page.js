import CategoryManager from '@/components/admin/CategoryManager';
import { getCategoryTree } from '@/lib/catalog';
import Product from '@/models/Product';
import { requirePermission } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  await requirePermission('catalog');
  const tree = await getCategoryTree({ activeOnly: false });
  const counts = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  const countMap = Object.fromEntries(counts.filter((c) => c._id).map((c) => [String(c._id), c.count]));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 style={{ margin: 0 }}>الأقسام</h1>
          <p className="muted" style={{ margin: 0 }}>رتّب أقسام متجرك في مستويين: قسم رئيسي وأقسام فرعية.</p>
        </div>
      </div>
      <CategoryManager tree={tree} counts={countMap} />
    </>
  );
}

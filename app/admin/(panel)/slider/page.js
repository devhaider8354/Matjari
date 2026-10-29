import SlidesEditor from '@/components/admin/SlidesEditor';
import { getSettings } from '@/lib/settings';
import { requirePermission } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function SliderPage() {
  await requirePermission('content');
  const { slides } = await getSettings();
  return (
    <>
      <h1>سلايدر الصفحة الرئيسية</h1>
      <SlidesEditor initial={slides} />
    </>
  );
}

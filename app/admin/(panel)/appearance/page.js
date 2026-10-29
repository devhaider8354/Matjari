import ThemeEditor from '@/components/admin/ThemeEditor';
import { getSettings } from '@/lib/settings';
import { requirePermission } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function AppearancePage() {
  await requirePermission('content');
  const { theme } = await getSettings();
  return (
    <>
      <h1>المظهر والألوان</h1>
      <ThemeEditor initial={theme} />
    </>
  );
}

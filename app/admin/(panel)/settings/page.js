import SettingsEditor from '@/components/admin/SettingsEditor';
import { getSettings } from '@/lib/settings';
import { requirePermission } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requirePermission('settings');
  const { store, social, seo } = await getSettings();
  return (
    <>
      <h1>إعدادات المتجر</h1>
      <SettingsEditor initial={{ store, social, seo }} />
    </>
  );
}

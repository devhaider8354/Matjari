import MarketingEditor from '@/components/admin/MarketingEditor';
import { appUrl } from '@/lib/mail';
import { requirePermission } from '@/lib/session';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function MarketingPage() {
  await requirePermission('settings');
  const { marketing, notifications } = await getSettings();
  return (
    <>
      <h1>التسويق والإشعارات</h1>
      <MarketingEditor
        initial={{ marketing, notifications }}
        feedUrl={`${appUrl()}/feeds/google.xml`}
        telegramReady={Boolean(process.env.TELEGRAM_BOT_TOKEN)}
        smtpReady={Boolean(process.env.SMTP_HOST)}
      />
    </>
  );
}

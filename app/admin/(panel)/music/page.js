import MusicEditor from '@/components/admin/MusicEditor';
import { requirePermission } from '@/lib/session';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function MusicPage() {
  await requirePermission('content');
  const { music } = await getSettings();
  return (
    <>
      <h1>موسيقى المتجر</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        موسيقى خلفية تعمل أثناء تصفح المتجر، وتستمر بدون انقطاع عند الانتقال بين الصفحات.
        تنبيه: المتصفحات لا تسمح بتشغيل الصوت قبل أول نقرة من الزائر، فتبدأ الموسيقى مع أول تفاعل.
        ويظهر للزائر زر عائم لإيقافها أو تخفيض صوتها، ويُحفظ اختياره.
      </p>
      <MusicEditor initial={music} />
    </>
  );
}

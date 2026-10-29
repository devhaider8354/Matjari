import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { hasPerm } from '@/lib/permissions';
import { adminRoute } from '@/lib/session';
import { DEFAULT_INVOICE, PAPER_SIZES, SOCIAL_PLATFORMS } from '@/lib/siteDefaults';
import { parseTheme } from '@/lib/theme';
import {
  parseInvoice, parseMarketing, parseMusic, parseNotifications, parseSeo, parseSlides, parseSocial, parseStore,
} from '@/lib/validate';
import Setting from '@/models/Setting';

// كل قسم من الإعدادات يحتاج صلاحيته: الواجهة (content) أو الإعدادات (settings)
const SECTION_PERM = {
  theme: 'content', slides: 'content', invoice: 'content', music: 'content',
  store: 'settings', social: 'settings', seo: 'settings', marketing: 'settings', notifications: 'settings',
};

// تحديث جزئي: يُحفظ فقط القسم المرسل
export const PUT = adminRoute(async (req, _ctx, admin) => {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });

  for (const key of Object.keys(body)) {
    if (SECTION_PERM[key] && !hasPerm(admin, SECTION_PERM[key])) {
      return NextResponse.json({ error: 'ليست لديك صلاحية لهذا القسم' }, { status: 403 });
    }
  }

  const update = {};
  if (body.theme) {
    const { theme, error } = parseTheme(body.theme);
    if (error) return NextResponse.json({ error }, { status: 400 });
    update.theme = theme;
  }
  if (body.slides) {
    const { slides, error } = parseSlides(body.slides);
    if (error) return NextResponse.json({ error }, { status: 400 });
    update.slides = slides;
  }
  if (body.store) update.store = parseStore(body.store);
  if (body.social) update.social = parseSocial(body.social, SOCIAL_PLATFORMS);
  if (body.seo) update.seo = parseSeo(body.seo);
  if (body.invoice) update.invoice = parseInvoice(body.invoice, DEFAULT_INVOICE, PAPER_SIZES);
  if (body.marketing) update.marketing = parseMarketing(body.marketing);
  if (body.music) update.music = parseMusic(body.music);
  if (body.notifications) update.notifications = parseNotifications(body.notifications);
  if (!Object.keys(update).length) return NextResponse.json({ error: 'لا يوجد ما يُحفظ' }, { status: 400 });

  await dbConnect();
  await Setting.updateOne({ key: 'site' }, { $set: update }, { upsert: true });
  return NextResponse.json({ ok: true });
});

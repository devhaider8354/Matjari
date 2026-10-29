import { cache } from 'react';
import Setting from '@/models/Setting';
import { cached } from './cache';
import { dbConnect } from './db';
import { DEFAULT_INVOICE, DEFAULT_MARKETING, DEFAULT_MUSIC, DEFAULT_SEO, DEFAULT_STORE } from './siteDefaults';
import { DEFAULT_THEME } from './theme';

const DEFAULTS = {
  theme: DEFAULT_THEME, slides: [], store: DEFAULT_STORE, social: [], seo: DEFAULT_SEO,
  invoice: DEFAULT_INVOICE, marketing: DEFAULT_MARKETING, music: DEFAULT_MUSIC, notifications: {},
};

const load = cached(
  async () => {
    await dbConnect();
    return JSON.parse(JSON.stringify((await Setting.findOne({ key: 'site' }).lean()) || {}));
  },
  ['site-settings'],
  { tags: ['settings'], revalidate: 300 }
);

// تُقرأ مرة واحدة لكل طلب ومن الذاكرة المؤقتة. عند تعذّر الاتصال يعمل المتجر بالإعدادات الافتراضية
export const getSettings = cache(async () => {
  try {
    const s = await load();
    return {
      theme: { ...DEFAULT_THEME, ...(s.theme || {}) },
      slides: s.slides || [],
      store: { ...DEFAULT_STORE, ...(s.store || {}) },
      social: s.social || [],
      seo: { ...DEFAULT_SEO, ...(s.seo || {}) },
      invoice: { ...DEFAULT_INVOICE, ...(s.invoice || {}) },
      marketing: { ...DEFAULT_MARKETING, ...(s.marketing || {}) },
      music: { ...DEFAULT_MUSIC, ...(s.music || {}) },
      notifications: s.notifications || {},
    };
  } catch (e) {
    console.error('settings load failed:', e.message);
    return DEFAULTS;
  }
});

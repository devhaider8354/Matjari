import Link from 'next/link';
import { getPublishedPosts } from '@/lib/blog';
import { pick } from '@/lib/i18n';
import { getLang } from '@/lib/locale';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const en = getLang() === 'en';
  return { title: en ? 'Blog' : 'المدونة', alternates: { canonical: '/blog' } };
}

const date = (d, lang) => new Date(d).toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-EG-u-nu-latn', { dateStyle: 'long' });

export default async function BlogPage() {
  const lang = getLang();
  const posts = await getPublishedPosts(60);
  return (
    <>
      <h1>{lang === 'en' ? 'Blog' : 'المدونة'}</h1>
      {posts.length === 0 ? (
        <div className="empty card">{lang === 'en' ? 'No articles yet' : 'لا توجد مقالات بعد'}</div>
      ) : (
        <div className="post-grid">
          {posts.map((p) => (
            <Link key={p._id} href={`/blog/${encodeURIComponent(p.slug)}`} className="post-card">
              <div className="post-cover">{p.cover && <img src={p.cover} alt="" loading="lazy" />}</div>
              <div className="post-info">
                <small className="muted">{p.publishedAt && date(p.publishedAt, lang)}</small>
                <h2>{pick(p, 'title', lang)}</h2>
                <p className="muted">{pick(p, 'excerpt', lang)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

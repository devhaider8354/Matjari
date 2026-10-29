import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlug } from '@/lib/blog';
import { pick } from '@/lib/i18n';
import { getLang } from '@/lib/locale';
import { appUrl } from '@/lib/mail';
import { plainText, renderMarkdown } from '@/lib/markdown';

export const dynamic = 'force-dynamic';

const slugOf = (params) => {
  try {
    return decodeURIComponent(params.slug);
  } catch {
    return params.slug;
  }
};

export async function generateMetadata({ params }) {
  const post = await getPostBySlug(slugOf(params));
  if (!post) return {};
  const lang = getLang();
  const title = post.seoTitle || pick(post, 'title', lang);
  const description = post.seoDescription || pick(post, 'excerpt', lang) || plainText(pick(post, 'content', lang)).slice(0, 160);
  return {
    title,
    description,
    keywords: post.tags,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: 'article', title, description, images: post.cover ? [post.cover] : undefined, publishedTime: post.publishedAt },
  };
}

export default async function PostPage({ params }) {
  const post = await getPostBySlug(slugOf(params));
  if (!post) notFound();
  const lang = getLang();
  const title = pick(post, 'title', lang);
  const content = (lang === 'en' && post.contentEn) || post.content;

  // بيانات منظمة لمقال: تساعد على الظهور في نتائج Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    image: post.cover ? `${appUrl()}${post.cover}` : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.author || 'Store' },
    mainEntityOfPage: `${appUrl()}/blog/${post.slug}`,
  };

  return (
    <article className="post-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="breadcrumb">
        <Link href="/">{lang === 'en' ? 'Home' : 'الرئيسية'}</Link> / <Link href="/blog">{lang === 'en' ? 'Blog' : 'المدونة'}</Link>
      </nav>
      <h1>{title}</h1>
      <p className="muted">
        {post.author && `${post.author} · `}
        {post.publishedAt && new Date(post.publishedAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-EG-u-nu-latn', { dateStyle: 'long' })}
      </p>
      {post.cover && <img className="post-hero" src={post.cover} alt="" />}
      {/* المحتوى مُحوَّل بمحوّل آمن يهرّب كل HTML قبل التنسيق */}
      <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      {post.tags?.length > 0 && (
        <div className="chips" style={{ marginTop: 20 }}>{post.tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>
      )}
    </article>
  );
}

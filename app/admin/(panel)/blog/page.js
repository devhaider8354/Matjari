import Link from 'next/link';
import { adminUrl } from '@/lib/adminPath';
import { formatDate } from '@/lib/config';
import { dbConnect, plain } from '@/lib/db';
import { requirePermission } from '@/lib/session';
import Post from '@/models/Post';

export const dynamic = 'force-dynamic';

export default async function BlogAdminPage() {
  await requirePermission('content');
  await dbConnect();
  const posts = plain(await Post.find().select('title slug published publishedAt updatedAt cover').sort({ updatedAt: -1 }).lean());
  return (
    <>
      <div className="page-head">
        <div>
          <h1 style={{ margin: 0 }}>المدونة</h1>
          <p className="muted" style={{ margin: 0 }}>مقالات مفيدة تجلب زيارات مجانية من Google (دليل اختيار عطر، تنسيق ملابس...).</p>
        </div>
        <Link href={adminUrl('/blog/new')} className="btn">+ مقال جديد</Link>
      </div>
      {posts.length === 0 ? (
        <div className="empty card">لا توجد مقالات بعد</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th></th><th>العنوان</th><th>الحالة</th><th>آخر تعديل</th><th></th></tr></thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p._id}>
                  <td>{p.cover && <img src={p.cover} alt="" />}</td>
                  <td><Link href={adminUrl(`/blog/${p._id}`)}><strong>{p.title}</strong></Link></td>
                  <td>{p.published ? <span className="status status-delivered">منشور</span> : <span className="status status-pending">مسودة</span>}</td>
                  <td>{formatDate(p.updatedAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link href={adminUrl(`/blog/${p._id}`)} className="btn btn-outline btn-sm">تعديل</Link>
                      {p.published && <a href={`/blog/${encodeURIComponent(p.slug)}`} target="_blank" className="btn btn-outline btn-sm">↗</a>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

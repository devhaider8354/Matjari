'use client';

import { useRouter } from 'next/navigation';

export default function DeleteProductButton({ id, name }) {
  const router = useRouter();
  async function remove() {
    if (!confirm(`حذف "${name}" نهائياً؟ (لإخفائه مؤقتاً عدّله وألغِ "ظاهر في المتجر")`)) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (!res.ok) return alert('تعذّر الحذف');
    router.refresh();
  }
  return <button className="btn btn-danger btn-sm" onClick={remove}>حذف</button>;
}

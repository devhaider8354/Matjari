export const metadata = { title: 'Offline', robots: { index: false } };

// تظهر من Service Worker عند انقطاع الإنترنت
export default function OfflinePage() {
  return (
    <div className="empty" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <div style={{ fontSize: 56 }}>📡</div>
      <h1 style={{ margin: 0 }}>لا يوجد اتصال بالإنترنت</h1>
      <p className="muted">تحقق من الاتصال ثم حاول مجدداً · You are offline</p>
      <a href="/" className="btn">إعادة المحاولة</a>
    </div>
  );
}

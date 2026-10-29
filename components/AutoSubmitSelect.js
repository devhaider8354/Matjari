'use client';

// قائمة منسدلة ترسل النموذج فور التغيير
export default function AutoSubmitSelect(props) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}

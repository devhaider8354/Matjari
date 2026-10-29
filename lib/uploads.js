import path from 'path';

// مجلد الصور المرفوعة: UPLOAD_DIR من البيئة، أو uploads داخل مجلد المشروع
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

'use client';

import { createContext, useContext } from 'react';

// المسار السري للوحة يصل من الخادم كـ prop، ولا يُكتب في ملفات JS العامة
export const AdminBaseContext = createContext('/admin');

export function useAdminUrl() {
  const base = useContext(AdminBaseContext);
  return (p = '') => `${base}${p === '/' ? '' : p}`;
}

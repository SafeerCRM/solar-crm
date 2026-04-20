'use client';

import { useEffect } from 'react';
import { setupAxiosInterceptor } from '@/lib/axiosInterceptor';

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    setupAxiosInterceptor();
  }, []);

  return <>{children}</>;
}
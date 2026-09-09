'use client';

import { useEffect } from 'react';
import { setupAxiosInterceptor } from '@/lib/axiosInterceptor';
import CustomerPushManager from '@/components/CustomerPushManager';

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    setupAxiosInterceptor();
  }, []);

  return (
  <>
    <CustomerPushManager />
    {children}
  </>
);
}
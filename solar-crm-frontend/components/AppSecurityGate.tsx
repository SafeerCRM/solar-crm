'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_ROUTES = ['/', '/login', '/customer-login', '/dealer-login'];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function getStoredToken() {
  if (typeof window === 'undefined') return null;

  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('token')
  );
}

export default function AppSecurityGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isPublicRoute(pathname)) {
      setAllowed(true);
      return;
    }

    const token = getStoredToken();

    if (!token) {
      setAllowed(false);
      router.replace('/');
      return;
    }

    setAllowed(true);
  }, [pathname, router]);

  if (!allowed) return null;

  return <>{children}</>;
}
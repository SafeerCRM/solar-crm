'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const PUBLIC_ROUTES = ['/', '/customer-login', '/dealer-login'];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
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

function getStoredUserRole() {
  if (typeof window === 'undefined') return '';

  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    return roles.includes('OWNER') ? 'OWNER' : roles[0] || '';
  } catch {
    return '';
  }
}

export default function AppSecurityGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [estimatedCompletion, setEstimatedCompletion] = useState('');

  useEffect(() => {
    const checkAccess = async () => {
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

      try {
        const res = await fetch(`${apiBaseUrl}/app-settings/maintenance-mode`, {
          cache: 'no-store',
        });

        const maintenance = await res.json();
        const role = getStoredUserRole();

        if (maintenance?.enabled && role !== 'OWNER') {
          setMaintenanceMessage(
            maintenance.message ||
              'CRM is under maintenance. Please try again later.',
          );
          setEstimatedCompletion(maintenance.estimatedCompletion || '');
          setAllowed(false);
          return;
        }
      } catch {
        // If maintenance API fails, do not block logged-in users.
      }

      setAllowed(true);
    };

    checkAccess();
  }, [pathname, router]);

  if (maintenanceMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow">
          <h1 className="mb-3 text-2xl font-bold text-gray-900">
            Maintenance Mode
          </h1>

          <p className="text-gray-700">{maintenanceMessage}</p>

          {estimatedCompletion && (
            <p className="mt-3 text-sm text-gray-500">
              Estimated completion: {estimatedCompletion}
            </p>
          )}

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-blue-600 px-4 py-2 text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Users', href: '/users', roles: ['OWNER'] },
  { name: 'Telecalling', href: '/telecalling' },
  { name: 'Leads', href: '/leads' },
  { name: 'Followup', href: '/followup' },
  { name: 'Meeting', href: '/meeting' },
];

type CurrentUser = {
  id: number;
  name: string;
  email?: string;
  roles?: string[];
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  const userRoles = user?.roles || [];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-50 rounded-xl bg-blue-600 px-3 py-2 text-white md:hidden"
      >
        ☰
      </button>

      <aside
        className={`fixed z-40 flex h-full w-64 flex-col justify-between bg-white p-6 shadow transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">Solar CRM</h2>

            {user && (
              <div className="mt-3 rounded-xl bg-gray-100 p-3">
                <p className="font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {userRoles.length > 0 ? userRoles.join(', ') : 'No roles assigned'}
                </p>
              </div>
            )}
          </div>

          <nav className="space-y-3">
            {navItems.map((item) => {
              if (item.roles && !item.roles.some((role) => userRoles.includes(role))) {
                return null;
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-xl px-4 py-2 ${
                    pathname === item.href
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/';
          }}
          className="mt-6 w-full rounded-xl bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
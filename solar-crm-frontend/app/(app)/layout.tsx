'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Leads', href: '/leads' },
  { name: 'Telecalling', href: '/telecalling' },
  { name: 'Followup', href: '/followup' },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

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

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* MOBILE MENU BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-4 z-50 rounded-xl bg-blue-600 px-3 py-2 text-white md:hidden"
      >
        ☰
      </button>

      {/* SIDEBAR */}
      <aside
        className={`fixed z-40 h-full w-64 bg-white p-6 shadow transition-transform md:static md:translate-x-0 flex flex-col justify-between ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* TOP SECTION */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">Solar CRM</h2>

            {/* 🔥 USER DISPLAY */}
            {user && (
              <div className="mt-3 rounded-xl bg-gray-100 p-3">
                <p className="font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            )}
          </div>

          {/* NAVIGATION */}
          <nav className="space-y-3">
  {/* 🔥 USERS (OWNER ONLY) */}
  {user?.role === 'OWNER' && (
    <Link
      href="/users"
      onClick={() => setOpen(false)}
      className={`block rounded-xl px-4 py-2 ${
        pathname === '/users'
          ? 'bg-blue-600 text-white'
          : 'text-gray-700 hover:bg-gray-200'
      }`}
    >
      Users
    </Link>
  )}

  {/* 🔹 OTHER NAV ITEMS */}
  {navItems.map((item) => (
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
  ))}
</nav>
        </div>

        {/* 🔥 LOGOUT BUTTON */}
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/';
          }}
          className="mt-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl w-full"
        >
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
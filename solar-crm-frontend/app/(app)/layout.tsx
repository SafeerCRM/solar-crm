'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    roles: [
      'OWNER',
      'TELECALLING_MANAGER',
      'LEAD_MANAGER',
      'MARKETING_HEAD',
      'MEETING_MANAGER',
      'PROJECT_MANAGER',
      'TELECALLER',
      'LEAD_EXECUTIVE',
      'PROJECT_EXECUTIVE',
      'MEETING_ASSISTANT',
    ],
  },
  { name: 'Users', href: '/users', roles: ['OWNER'] },

  {
    name: 'Telecalling',
    href: '/telecalling',
    roles: ['OWNER', 'TELECALLING_MANAGER', 'TELECALLER', 'TELECALLING_ASSISTANT'],
  },

  {
  name: 'Leads',
  href: '/leads',
  roles: ['OWNER', 'LEAD_MANAGER', 'TELECALLER', 'LEAD_EXECUTIVE', 'TELECALLING_ASSISTANT'],
},

  {
    name: 'Archived Leads',
    href: '/leads/archived',
    roles: ['OWNER', 'LEAD_MANAGER'],
  },

  {
    name: 'Followup',
    href: '/followup',
    roles: [
      'OWNER',
      'TELECALLING_MANAGER',
      'LEAD_MANAGER',
      'MARKETING_HEAD',
      'MEETING_MANAGER',
      'MEETING_ASSISTANT',
      'TELECALLER',
      'LEAD_EXECUTIVE',
      'PROJECT_EXECUTIVE',
      'TELECALLING_ASSISTANT',
    ],
  },

  {
  name: 'Meeting',
  href: '/meeting',
  roles: [
    'OWNER',
    'LEAD_MANAGER',
    'MARKETING_HEAD',
    'MEETING_MANAGER',
    'PROJECT_MANAGER',
    'PROJECT_EXECUTIVE',
    'TELECALLER',
    'LEAD_EXECUTIVE',
    'TELECALLING_ASSISTANT',
    'MEETING_ASSISTANT',
  ],
},

{
  name: 'Project',
  href: '/project',
  roles: [
    'OWNER',
    'MARKETING_HEAD',
    'MEETING_MANAGER',
    'MEETING_ASSISTANT',
    'PROJECT_MANAGER',
    'PROJECT_EXECUTIVE',
    'LOAN_MANAGER',
'ELECTRICITY_MANAGER',
'SUBSIDY_MANAGER',
'PAYMENT_COLLECTION_EXECUTIVE',
'TELECALLER',
'TELECALLING_ASSISTANT',
'LEAD_MANAGER',
  ],
},

  {
  name: 'Calculator',
  href: '/calculator',
  roles: [
    'OWNER',
    'TELECALLING_MANAGER',
    'TELECALLING_ASSISTANT',
    'LEAD_MANAGER',
    'LEAD_EXECUTIVE',
    'MARKETING_HEAD',
    'MEETING_MANAGER',
    'MEETING_ASSISTANT',
    'PROJECT_MANAGER',
    'PROJECT_EXECUTIVE',
    'TELECALLER',
  ],
},

  {
    name: 'Calculator Settings',
    href: '/calculator/settings',
    roles: ['OWNER'],
  },

  {
  name: 'Material Settings',
  href: '/project/material-settings',
  roles: ['OWNER'],
},

{
  name: 'Execution Calendar',
  href: '/project/execution-calendar',
  roles: [
    'OWNER',
    'MARKETING_HEAD',
    'PROJECT_MANAGER',
    'MEETING_MANAGER',
    'PROJECT_EXECUTIVE',
    'LEAD_MANAGER',
    'LEAD_EXECUTIVE',
    'TELECALLER',
    'TELECALLING_ASSISTANT',
    'TELECALLING_MANAGER',
  ],
},

{
  name: 'Reminder Center',
  href: '/project/reminders',
  roles: [
    'OWNER',
    'MARKETING_HEAD',
    'PROJECT_MANAGER',
    'MEETING_MANAGER',
    'PROJECT_EXECUTIVE',
    'LEAD_MANAGER',
    'LEAD_EXECUTIVE',
    'TELECALLER',
    'TELECALLING_ASSISTANT',
    'TELECALLING_MANAGER',
  ],
},

{
  name: 'Purchase Orders',
  href: '/project/purchase-orders',
  roles: ['OWNER', 'PROJECT_MANAGER'],
},

{
  name: 'Branch Settings',
  href: '/project/branch-settings',
  roles: ['OWNER'],
},
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
  const [reminderCount, setReminderCount] = useState(0);

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

  useEffect(() => {
  if (!user) return;

  const allowedRoles = [
    'OWNER',
    'MARKETING_HEAD',
    'PROJECT_MANAGER',
    'MEETING_MANAGER',
    'PROJECT_EXECUTIVE',
    'LEAD_MANAGER',
    'LEAD_EXECUTIVE',
    'TELECALLER',
    'TELECALLING_ASSISTANT',
    'TELECALLING_MANAGER',
  ];

  const canSeeReminders = userRoles.some((role) =>
    allowedRoles.includes(role),
  );

  if (!canSeeReminders) return;

  const fetchReminderCount = async () => {
    try {
      const res = await axios.get(
        `${apiBaseUrl}/project/execution-reminders/unread-count`,
        {
          headers: getAuthHeaders(),
        },
      );

      setReminderCount(res.data?.unreadCount || 0);
    } catch (error) {
      console.error('Reminder count error:', error);
      setReminderCount(0);
    }
  };

  fetchReminderCount();

  const interval = window.setInterval(fetchReminderCount, 5 * 60 * 1000);

  return () => window.clearInterval(interval);
}, [user, userRoles]);

  return (
        <div className="min-h-screen bg-gray-100 md:flex">
            <button
        onClick={() => setOpen(!open)}
        className="fixed left-3 top-3 z-50 rounded-xl bg-blue-600 px-3 py-2 text-white shadow md:hidden"
      >
        ☰
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}

            <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col justify-between overflow-y-auto bg-white p-6 shadow transition-transform md:static md:translate-x-0 ${
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
                  <span className="flex items-center justify-between gap-2">
  <span>{item.name}</span>

  {item.href === '/project/reminders' && reminderCount > 0 && (
    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
      {reminderCount}
    </span>
  )}
</span>
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

            <main className="min-w-0 flex-1 px-3 pb-4 pt-20 md:p-8">{children}</main>
    </div>
  );
}
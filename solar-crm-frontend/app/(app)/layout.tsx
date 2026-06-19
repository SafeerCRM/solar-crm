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
      'LOAN_MANAGER',
'SUBSIDY_MANAGER',
'ELECTRICITY_MANAGER',
'PAYMENT_MANAGER',
'ACCOUNT_MANAGER',
      'STOCK_MANAGER',
      'MAINTENANCE_MANAGER',
      'CUSTOMER_MANAGER',
      'HR_MANAGER',
      'TRADING_MANAGER',
      'PROJECT_CONTRACTOR',
      'SOLAR_FRANCHISE',
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
      'SOLAR_FRANCHISE',
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
    'SOLAR_FRANCHISE',
  ],
},

{
  name: 'Trading Meetings',
  href: '/trading-meeting',
  roles: ['OWNER', 'PROJECT_MANAGER', 'ACCOUNT_MANAGER', 'TRADING_MANAGER'],
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
'PAYMENT_MANAGER',
'ACCOUNT_MANAGER',
'PROJECT_CONTRACTOR',
'CUSTOMER_MANAGER',
'STOCK_MANAGER',
'TRADING_MANAGER',
'SOLAR_FRANCHISE',
  ],
},

{
  name: 'Customers',
  href: '/customers',
  roles: [
    'OWNER',
    'MARKETING_HEAD',
    'PROJECT_MANAGER',
    'PROJECT_EXECUTIVE',
    'MEETING_MANAGER',
    'LEAD_MANAGER',
    'CUSTOMER_MANAGER',
  ],
},

{
  name: 'Staff Complaints',
  href: '/staff-complaints',
  roles: [
    'OWNER',
    'TELECALLING_MANAGER',
    'TELECALLING_ASSISTANT',
    'TELECALLER',
    'LEAD_MANAGER',
    'LEAD_EXECUTIVE',
    'MARKETING_HEAD',
    'MEETING_MANAGER',
    'MEETING_ASSISTANT',
    'PROJECT_MANAGER',
    'PROJECT_EXECUTIVE',
    'LOAN_MANAGER',
    'SUBSIDY_MANAGER',
    'ELECTRICITY_MANAGER',
    'PAYMENT_COLLECTION_EXECUTIVE',
    'PAYMENT_MANAGER',
    'ACCOUNT_MANAGER',
    'STOCK_MANAGER',
    'MAINTENANCE_MANAGER',
    'CUSTOMER_MANAGER',
    'HR_MANAGER',
    'TRADING_MANAGER',
    'PROJECT_CONTRACTOR',
    'SOLAR_FRANCHISE',
  ],
},

{
  name: 'Staff Management',
  href: '/staff',
  roles: ['OWNER', 'HR_MANAGER'],
},

{
  name: 'My Contractor Work',
  href: '/project/my-contractor-work',
  roles: ['PROJECT_CONTRACTOR'],
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
        'LOAN_MANAGER',
    'SUBSIDY_MANAGER',
    'ELECTRICITY_MANAGER',
    'PAYMENT_COLLECTION_EXECUTIVE',
    'PAYMENT_MANAGER',
    'ACCOUNT_MANAGER',
    'STOCK_MANAGER',
    'MAINTENANCE_MANAGER',
    'CUSTOMER_MANAGER',
    'HR_MANAGER',
    'TRADING_MANAGER',
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
  roles: ['OWNER', 'PROJECT_MANAGER',
'ACCOUNT_MANAGER',
'STOCK_MANAGER',],
},

{
  name: 'Vendor Master',
  href: '/project/vendors',
  roles: ['OWNER', 'PROJECT_MANAGER'],
},

{
  name: 'Project Contractors',
  href: '/project/contractors',
  roles: ['OWNER', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER',],
},

{
  name: 'Contractor Assignments',
  href: '/project/contractor-assignments',
  roles: ['OWNER', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER',],
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
    'LOAN_MANAGER',
'SUBSIDY_MANAGER',
'ELECTRICITY_MANAGER',
'PAYMENT_MANAGER',
'ACCOUNT_MANAGER',
  ],
},

{
  name: 'Purchase Orders',
  href: '/project/purchase-orders',
  roles: [
    'OWNER',
    'PROJECT_MANAGER',
    'ACCOUNT_MANAGER',
    'STOCK_MANAGER',
    'TRADING_MANAGER',
  ],
},

{
  name: 'Payment Collection',
  href: '/project/payment-collection',
  roles: [
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
],
},

{
  name: 'Franchise Payouts',
  href: '/project/franchise-payouts',
  roles: [
    'OWNER',
    'ACCOUNT_MANAGER',
    'PAYMENT_MANAGER',
  ],
},

{
  name: 'Accounts',
  href: '/project/accounts',
  roles: [
    'OWNER',
    'MARKETING_HEAD',
    'PROJECT_MANAGER',
    'MEETING_MANAGER',
'PROJECT_EXECUTIVE',
'PAYMENT_COLLECTION_EXECUTIVE',
    'PAYMENT_MANAGER',
    'ACCOUNT_MANAGER',
  ],
},

{
  name: 'Stock Management',
  href: '/project/accounts/stock',
  roles: [
    'OWNER',
    'PROJECT_MANAGER',
    'PROJECT_EXECUTIVE',
    'ACCOUNT_MANAGER',
    'PAYMENT_MANAGER',
    'STOCK_MANAGER',
  ],
},

{
  name: 'Trading Account',
  href: '/project/accounts/trading',
  roles: [
    'OWNER',
    'PROJECT_MANAGER',
    'TRADING_MANAGER',
    'STOCK_MANAGER',
    'ACCOUNT_MANAGER',
  ],
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

type ReminderPreviewItem = {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  customerName?: string | null;
  projectId?: number;
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
  const [reminderPreview, setReminderPreview] = useState<ReminderPreviewItem[]>([]);
const [bellOpen, setBellOpen] = useState(false);

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
    'LOAN_MANAGER',
'SUBSIDY_MANAGER',
'ELECTRICITY_MANAGER',
'PAYMENT_MANAGER',
'ACCOUNT_MANAGER',
  ];

  const canSeeReminders = userRoles.some((role) =>
    allowedRoles.includes(role),
  );

  if (!canSeeReminders) return;

  const fetchReminderCount = async () => {
  try {
    const endpoints = [
      '/project/execution-reminders/unread-count',
      '/project/payment-reminders/unread-count',
      '/project/approval-reminders/unread-count',
      '/project/purchase-reminders/unread-count',
      '/project/document-reminders/unread-count',
      '/project/loan-reminders/unread-count',
      '/project/subsidy-reminders/unread-count',
      '/project/electricity-reminders/unread-count',
      '/project/final-closure-reminders/unread-count',
    ];

    let total = 0;

    for (const endpoint of endpoints) {
      const res = await axios.get(`${apiBaseUrl}${endpoint}`, {
        headers: getAuthHeaders(),
      });

      total += Number(res.data?.unreadCount || 0);
    }

    setReminderCount(total);
    setReminderPreview([]);
  } catch (error) {
    console.error('Reminder count error:', error);
    setReminderCount(0);
    setReminderPreview([]);
  }
};

  fetchReminderCount();

  const interval = window.setInterval(fetchReminderCount, 15 * 60 * 1000);

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

      <div className="fixed right-3 top-3 z-50">
  <button
    type="button"
    onClick={() => setBellOpen((prev) => !prev)}
    className="relative rounded-xl bg-white px-3 py-2 text-lg shadow"
  >
    🔔
    {reminderCount > 0 && (
      <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
        {reminderCount}
      </span>
    )}
  </button>

  {bellOpen && (
    <div className="mt-2 w-80 rounded-2xl bg-white p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Notifications</h3>
        <Link
          href="/project/reminders"
          onClick={() => setBellOpen(false)}
          className="text-xs font-medium text-blue-600"
        >
          View all
        </Link>
      </div>

      {reminderPreview.length === 0 ? (
        <p className="text-sm text-gray-500">No unread reminders</p>
      ) : (
        <div className="space-y-2">
          {reminderPreview.map((item) => (
            <Link
              key={item.id}
              href="/project/reminders"
              onClick={() => setBellOpen(false)}
              className="block rounded-xl bg-blue-50 p-3 text-sm hover:bg-blue-100"
            >
              <p className="font-semibold text-gray-900">
  {item.title}
</p>
<p className="text-xs text-gray-600">
  {formatActivityType(item.subtitle)}
</p>
              <p className="text-xs text-gray-500">
  {item.customerName || `Project #${item.projectId}`}
</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )}
</div>

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

function formatActivityType(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatReminderPreviewType(
  value: 'OVERDUE_INSPECTION' | 'TODAY_WORK' | 'UPCOMING_DEADLINE',
) {
  if (value === 'OVERDUE_INSPECTION') return 'Overdue Reminder';
  if (value === 'TODAY_WORK') return 'Today’s Work';
  return 'Upcoming Deadline';
}
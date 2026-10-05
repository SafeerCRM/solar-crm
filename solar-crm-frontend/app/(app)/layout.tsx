'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { getAuthHeaders } from '@/lib/authHeaders';
import AppSecurityGate from '@/components/AppSecurityGate';
import LiveLocationManager from '@/components/LiveLocationManager';
import BirthdayPopupManager from '@/components/BirthdayPopupManager';


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
      'INSPECTION_MANAGER',
      'CUSTOMER_MANAGER',
      'HR_MANAGER',
      'TRADING_MANAGER',
      'OFFICE_ASSISTANT',
      'TRADING_HEAD',
      'PROJECT_CONTRACTOR',
      'SOLAR_FRANCHISE',
    ],
  },

  {
  name: 'Analytics',
  href: '/dashboard/analytics',
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
    'INSPECTION_MANAGER',
    'CUSTOMER_MANAGER',
    'HR_MANAGER',
    'TRADING_MANAGER',
    'TRADING_HEAD',
    'PROJECT_CONTRACTOR',
  ],
},


  { name: 'Users', href: '/users', roles: ['OWNER'] },

  {
  name: 'Staff Live Location',
  href: '/live-location',
  roles: ['OWNER'],
},

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
  roles: ['OWNER', 'PROJECT_MANAGER', 'ACCOUNT_MANAGER', 'TRADING_MANAGER', 'MEETING_MANAGER', 'TRADING_HEAD'],
},

{
  name: 'Inspection Management',
  href: '/inspection',
  roles: [
    'OWNER',
    'INSPECTION_MANAGER',
    'MAINTENANCE_MANAGER',
    'CUSTOMER_MANAGER',
    'STOCK_MANAGER',
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
'PAYMENT_MANAGER',
'ACCOUNT_MANAGER',
'PROJECT_CONTRACTOR',
'CUSTOMER_MANAGER',
'STOCK_MANAGER',
'TRADING_MANAGER',
'OFFICE_ASSISTANT',
'TRADING_HEAD',
'SOLAR_FRANCHISE',
'INSPECTION_MANAGER',
'MAINTENANCE_MANAGER',
'FRANCHISE_MANAGER',
'FRANCHISE_HEAD',
  ],
},

{
  name: 'Project Tax Invoices',
  href: '/project/tax-invoices',
  roles: [
    'OWNER',
    'ACCOUNT_MANAGER',
    'MEETING_MANAGER',
    'PAYMENT_COLLECTION_EXECUTIVE',
    'PROJECT_EXECUTIVE',
    'PROJECT_MANAGER',
    'LOAN_MANAGER',
    'SUBSIDY_MANAGER',
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
    'INSPECTION_MANAGER',
    'CUSTOMER_MANAGER',
  ],
},

{
  name: 'Solar Mitra',
  href: '/solar-mitra',
},

{
  name: 'Solar Mitra',
  href: '/solar-mitra/my',
  roles: [
    'SOLAR_MITRA',
  ],
},

{
  name: 'Customer Portal',
  href: '/customer-portal-management',
  roles: [
    'OWNER',
    'CUSTOMER_MANAGER',
    'PROJECT_MANAGER',
    'PROJECT_EXECUTIVE',
    'PAYMENT_MANAGER',
    'ACCOUNT_MANAGER',
    'MAINTENANCE_MANAGER',
    'INSPECTION_MANAGER',
    'MARKETING_HEAD',
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
    'INSPECTION_MANAGER',
    'CUSTOMER_MANAGER',
    'HR_MANAGER',
    'TRADING_MANAGER',
    'OFFICE_ASSISTANT',
    'TRADING_HEAD',
      'PROJECT_CONTRACTOR',
  'SOLAR_FRANCHISE',
  'FRANCHISE_MANAGER',
  'FRANCHISE_HEAD',
],
},

{
  name: 'Franchise Policies',
  href: '/franchise-policies',
  roles: ['OWNER', 'HR_MANAGER', 'SOLAR_FRANCHISE'],
},

{
  name: 'Document Vault',
  href: '/global-document-vault',
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
    'INSPECTION_MANAGER',
    'CUSTOMER_MANAGER',

    'HR_MANAGER',

    'TRADING_MANAGER',
    'TRADING_HEAD',

    'OFFICE_ASSISTANT',

    'CUSTOMER',
    'DEALER',
    'FRANCHISE_MANAGER',
'FRANCHISE_HEAD',
  ],
},

{
  name: 'My Expense Requests',
  href: '/project/my-expense-requests',
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
    'INSPECTION_MANAGER',
    'CUSTOMER_MANAGER',
    'HR_MANAGER',
    'TRADING_MANAGER',
    'OFFICE_ASSISTANT',
    'TRADING_HEAD',
      'PROJECT_CONTRACTOR',
  'SOLAR_FRANCHISE',
  'FRANCHISE_MANAGER',
  'FRANCHISE_HEAD',
],
},

{
  name: 'HR Portal',
  href: '/hr-portal',
  roles: ['OWNER', 'HR_MANAGER'],
},

{
  name: 'Employee Portal',
  href: '/employee-portal',
  roles: [
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
    'ELECTRICITY_MANAGER',
    'SUBSIDY_MANAGER',
    'PAYMENT_COLLECTION_EXECUTIVE',
    'PAYMENT_MANAGER',
    'ACCOUNT_MANAGER',
    'STOCK_MANAGER',
    'MAINTENANCE_MANAGER',
    'INSPECTION_MANAGER',
    'CUSTOMER_MANAGER',
    'HR_MANAGER',
    'TRADING_MANAGER',
    'OFFICE_ASSISTANT',
      'TRADING_HEAD',
  'PROJECT_CONTRACTOR',
  'FRANCHISE_MANAGER',
  'FRANCHISE_HEAD',
],
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
    'INSPECTION_MANAGER',
    'CUSTOMER_MANAGER',
    'HR_MANAGER',
    'TRADING_MANAGER',
    'OFFICE_ASSISTANT',
      'TRADING_HEAD',
   'SOLAR_FRANCHISE',
 'PROJECT_CONTRACTOR',
 'SOLAR_MITRA',
 'FRANCHISE_MANAGER',
 'FRANCHISE_HEAD',
],
},

  {
    name: 'Calculator Settings',
    href: '/calculator/settings',
    roles: ['OWNER'],
  },

  {
  name: 'Portal Settings',
  href: '/settings/portal',
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
  name: 'Vendor Management',
  href: '/project/vendor-management',
  roles: [
    'OWNER',
    'ACCOUNT_MANAGER',
  ],
},

{
  name: 'Project Contractors',
  href: '/project/contractors',
  roles: ['OWNER', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER',],
},

{
  name: 'Contractor Assignments',
  href: '/project/contractor-assignments',
  roles: ['OWNER', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER', 'INSPECTION_MANAGER',],
},


{
  name: 'Timeline Tracking',
  href: '/project/timeline',
  roles: [
    'OWNER',
    'MARKETING_HEAD',
    'PROJECT_MANAGER',
    'PROJECT_EXECUTIVE',
    'LOAN_MANAGER',
    'SUBSIDY_MANAGER',
    'ELECTRICITY_MANAGER',
    'PAYMENT_COLLECTION_EXECUTIVE',
    'PAYMENT_MANAGER',
    'ACCOUNT_MANAGER',
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
    'MEETING_MANAGER',
    'TRADING_HEAD',
    'SUBSIDY_MANAGER',
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
    'TRADING_MANAGER',
 'TRADING_HEAD',
 'SUBSIDY_MANAGER',
  ],
},

{
  name: 'Trading Account',
  href: '/project/accounts/trading',
  roles: [
    'OWNER',
    'PROJECT_MANAGER',
    'TRADING_MANAGER',
    'TRADING_HEAD',
    'MEETING_MANAGER',
    'STOCK_MANAGER',
    'ACCOUNT_MANAGER',
  ],
},

{
  name: 'Branch Settings',
  href: '/project/branch-settings',
  roles: ['OWNER'],
},

{
  name: 'System Settings',
  href: '/settings',
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

type ProjectStaffNotification = {
  id: number;
  recipientUserId: number;
  projectId: number;
  module: string;
  eventType: string;
  title: string;
  message: string;
  targetTab?: string | null;
  targetSection?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
  createdBy?: number | null;
  createdByName?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
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

const [
  projectNotificationCount,
  setProjectNotificationCount,
] = useState(0);

const [
  projectNotifications,
  setProjectNotifications,
] = useState<ProjectStaffNotification[]>([]);

const [
  realtimeNotification,
  setRealtimeNotification,
] = useState<ProjectStaffNotification | null>(null);

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

useEffect(() => {
  if (!user || !apiBaseUrl) {
    return;
  }

  const token = localStorage.getItem('token');

  if (!token) {
    return;
  }

  let toastTimer: number | null = null;

  const fetchProjectNotifications = async () => {
    try {
      const [notificationsRes, countRes] =
        await Promise.all([
          axios.get(
            `${apiBaseUrl}/project/staff-notifications`,
            {
              params: {
                limit: 20,
              },
              headers: getAuthHeaders(),
            },
          ),

          axios.get(
            `${apiBaseUrl}/project/staff-notifications/unread-count`,
            {
              headers: getAuthHeaders(),
            },
          ),
        ]);

      const notifications =
        Array.isArray(notificationsRes.data)
          ? notificationsRes.data
          : [];

      setProjectNotifications(
        notifications,
      );

      setProjectNotificationCount(
        Number(
          countRes.data?.unreadCount || 0,
        ),
      );
    } catch (error) {
      console.error(
        'Project notification fetch error:',
        error,
      );
    }
  };

  fetchProjectNotifications();

  const socket = io(apiBaseUrl, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on(
    'project:notification',
    (
      notification:
        ProjectStaffNotification,
    ) => {
      setProjectNotifications(
        (current) => [
          notification,
          ...current.filter(
            (item) =>
              item.id !== notification.id,
          ),
        ].slice(0, 20),
      );

      if (!notification.isRead) {
        setProjectNotificationCount(
          (current) => current + 1,
        );
      }

      setRealtimeNotification(
        notification,
      );

      if (toastTimer) {
        window.clearTimeout(toastTimer);
      }

      toastTimer =
        window.setTimeout(() => {
          setRealtimeNotification(null);
        }, 6000);
    },
  );

  socket.on('connect_error', (error) => {
    console.error(
      'Project notification socket error:',
      error.message,
    );
  });

  return () => {
    if (toastTimer) {
      window.clearTimeout(toastTimer);
    }

    socket.disconnect();
  };
}, [user]);

const openProjectNotification = async (
  notification: ProjectStaffNotification,
) => {
  try {
    if (!notification.isRead) {
      await axios.patch(
        `${apiBaseUrl}/project/staff-notifications/${notification.id}/read`,
        {},
        {
          headers: getAuthHeaders(),
        },
      );

      setProjectNotifications(
        (current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  isRead: true,
                }
              : item,
          ),
      );

      setProjectNotificationCount(
        (current) =>
          Math.max(0, current - 1),
      );
    }
  } catch (error) {
    console.error(
      'Project notification read error:',
      error,
    );
  }

  setBellOpen(false);
  setRealtimeNotification(null);

  if (
  notification.targetTab ===
  'TIMELINE'
) {
  const timelineQuery =
    new URLSearchParams();

  timelineQuery.set(
    'projectId',
    String(
      notification.projectId,
    ),
  );

  if (
    notification.targetSection
  ) {
    timelineQuery.set(
      'section',
      notification.targetSection,
    );
  }

  window.location.href =
    `/project/timeline?${timelineQuery.toString()}`;

  return;
}

const query =
  new URLSearchParams();

if (notification.targetTab) {
  query.set(
    'tab',
    notification.targetTab,
  );
}

if (notification.targetSection) {
  query.set(
    'section',
    notification.targetSection,
  );
}

const queryString =
  query.toString();

window.location.href =
  `/project/${notification.projectId}${
    queryString
      ? `?${queryString}`
      : ''
  }`;
};

  return (
    <AppSecurityGate>
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
    {reminderCount +
  projectNotificationCount >
  0 && (
  <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
    {reminderCount +
      projectNotificationCount}
  </span>
)}
  </button>

  {bellOpen && (
    <div className="mt-2 max-h-[70vh] w-96 overflow-y-auto rounded-2xl bg-white p-4 shadow-xl">
  <div className="mb-3 flex items-center justify-between">
    <h3 className="font-bold text-gray-900">
      Notifications
    </h3>

    <Link
      href="/project/reminders"
      onClick={() =>
        setBellOpen(false)
      }
      className="text-xs font-medium text-blue-600"
    >
      Reminder Center
    </Link>
  </div>

  {projectNotifications.length > 0 && (
    <div className="mb-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
        Project Activity
      </p>

      <div className="space-y-2">
        {projectNotifications.map(
          (notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() =>
                openProjectNotification(
                  notification,
                )
              }
              className={`block w-full rounded-xl p-3 text-left text-sm transition ${
                notification.isRead
                  ? 'bg-gray-50 hover:bg-gray-100'
                  : 'bg-blue-50 hover:bg-blue-100'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-900">
                  {notification.title}
                </p>

                {!notification.isRead && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                )}
              </div>

              <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                {notification.message}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Project #
                {notification.projectId}
                {notification.createdByName
                  ? ` • ${notification.createdByName}`
                  : ''}
              </p>
            </button>
          ),
        )}
      </div>
    </div>
  )}

  {projectNotifications.length === 0 &&
    reminderCount === 0 && (
      <p className="text-sm text-gray-500">
        No notifications
      </p>
    )}

  {reminderCount > 0 && (
    <Link
      href="/project/reminders"
      onClick={() =>
        setBellOpen(false)
      }
      className="block rounded-xl bg-amber-50 p-3 text-sm hover:bg-amber-100"
    >
      <p className="font-semibold text-gray-900">
        Reminder Center
      </p>

      <p className="mt-1 text-xs text-gray-600">
        {reminderCount} unread project
        {reminderCount === 1
          ? ' reminder'
          : ' reminders'}
      </p>
    </Link>
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
  window.dispatchEvent(
    new Event('solar-crm:logout'),
  );

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

    {realtimeNotification && (
  <button
    type="button"
    onClick={() =>
      openProjectNotification(
        realtimeNotification,
      )
    }
    className="fixed right-4 top-20 z-[100] w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-blue-100 bg-white p-4 text-left shadow-2xl transition hover:bg-blue-50"
  >
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg">
        🔔
      </div>

      <div className="min-w-0">
        <p className="font-bold text-gray-900">
          {realtimeNotification.title}
        </p>

        <p className="mt-1 line-clamp-2 text-sm text-gray-700">
          {realtimeNotification.message}
        </p>

        <p className="mt-2 text-xs text-gray-500">
          Project #
          {realtimeNotification.projectId}
          {realtimeNotification.createdByName
            ? ` • ${realtimeNotification.createdByName}`
            : ''}
        </p>
      </div>
    </div>
  </button>
)}
    <LiveLocationManager />
<BirthdayPopupManager />
    </AppSecurityGate>

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
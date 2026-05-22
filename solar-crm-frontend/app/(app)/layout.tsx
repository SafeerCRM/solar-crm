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
  name: 'Payment Collection',
  href: '/project/payment-collection',
  roles: ['OWNER', 'MARKETING_HEAD', 'PROJECT_MANAGER'],
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
  ];

  const canSeeReminders = userRoles.some((role) =>
    allowedRoles.includes(role),
  );

  if (!canSeeReminders) return;

  const fetchReminderCount = async () => {
  try {
    const [
  executionCountRes,
  paymentCountRes,
  approvalCountRes,
  purchaseCountRes,
  documentCountRes,
  loanCountRes,
  subsidyCountRes,
  electricityCountRes,
  finalClosureCountRes,
  executionListRes,
  paymentListRes,
  approvalListRes,
  purchaseListRes,
  documentListRes,
  loanListRes,
  subsidyListRes,
  electricityListRes,
  finalClosureListRes,
] = await Promise.all([
  axios.get(`${apiBaseUrl}/project/execution-reminders/unread-count`, {
    headers: getAuthHeaders(),
  }),
  axios.get(`${apiBaseUrl}/project/payment-reminders/unread-count`, {
    headers: getAuthHeaders(),
  }),
  axios.get(`${apiBaseUrl}/project/approval-reminders/unread-count`, {
    headers: getAuthHeaders(),
  }),
  axios.get(`${apiBaseUrl}/project/purchase-reminders/unread-count`, {
  headers: getAuthHeaders(),
}),
axios.get(`${apiBaseUrl}/project/document-reminders/unread-count`, {
  headers: getAuthHeaders(),
}),
axios.get(`${apiBaseUrl}/project/loan-reminders/unread-count`, {
  headers: getAuthHeaders(),
}),
axios.get(`${apiBaseUrl}/project/subsidy-reminders/unread-count`, {
  headers: getAuthHeaders(),
}),
axios.get(`${apiBaseUrl}/project/electricity-reminders/unread-count`, {
  headers: getAuthHeaders(),
}),
axios.get(`${apiBaseUrl}/project/final-closure-reminders/unread-count`, {
  headers: getAuthHeaders(),
}),
  axios.get(`${apiBaseUrl}/project/execution-reminders`, {
    headers: getAuthHeaders(),
  }),
  axios.get(`${apiBaseUrl}/project/payment-reminders`, {
    headers: getAuthHeaders(),
  }),
  axios.get(`${apiBaseUrl}/project/approval-reminders`, {
    headers: getAuthHeaders(),
  }),
  axios.get(`${apiBaseUrl}/project/purchase-reminders`, {
  headers: getAuthHeaders(),
}),
axios.get(`${apiBaseUrl}/project/document-reminders`, {
  headers: getAuthHeaders(),
}),
axios.get(`${apiBaseUrl}/project/loan-reminders`, {
  headers: getAuthHeaders(),
}),
axios.get(`${apiBaseUrl}/project/subsidy-reminders`, {
  headers: getAuthHeaders(),
}),
axios.get(`${apiBaseUrl}/project/electricity-reminders`, {
  headers: getAuthHeaders(),
}),
axios.get(`${apiBaseUrl}/project/final-closure-reminders`, {
  headers: getAuthHeaders(),
}),
]);

    const executionCount = executionCountRes.data?.unreadCount || 0;
const paymentCount = paymentCountRes.data?.unreadCount || 0;
const approvalCount = approvalCountRes.data?.unreadCount || 0;
const purchaseCount = purchaseCountRes.data?.unreadCount || 0;
const documentCount = documentCountRes.data?.unreadCount || 0;
const loanCount = loanCountRes.data?.unreadCount || 0;
const subsidyCount = subsidyCountRes.data?.unreadCount || 0;
const electricityCount = electricityCountRes.data?.unreadCount || 0;
const finalClosureCount = finalClosureCountRes.data?.unreadCount || 0;

setReminderCount(
  executionCount +
    paymentCount +
    approvalCount +
    purchaseCount +
    documentCount +
    loanCount +
    subsidyCount + 
    electricityCount + 
    finalClosureCount,
);

    const executionList = Array.isArray(executionListRes.data)
      ? executionListRes.data
      : [];

    const paymentList = Array.isArray(paymentListRes.data)
      ? paymentListRes.data
      : [];

      const approvalList = Array.isArray(approvalListRes.data)
  ? approvalListRes.data
  : [];

  const purchaseList = Array.isArray(purchaseListRes.data)
  ? purchaseListRes.data
  : [];

  const documentList = Array.isArray(documentListRes.data)
  ? documentListRes.data
  : [];

  const loanList = Array.isArray(loanListRes.data)
  ? loanListRes.data
  : [];

  const subsidyList = Array.isArray(subsidyListRes.data)
  ? subsidyListRes.data
  : [];

  const electricityList = Array.isArray(electricityListRes.data)
  ? electricityListRes.data
  : [];

  const finalClosureList = Array.isArray(finalClosureListRes.data)
  ? finalClosureListRes.data
  : [];

    const executionUnread = executionList
      .filter((item: any) => item.userReminderStatus !== 'READ')
      .map((item: any) => ({
        id: `execution-${item.id}`,
        href: '/project/reminders',
        title: item.reminderType,
        subtitle: item.activityType,
        customerName: item.customerName,
        projectId: item.projectId,
      }));

    const paymentUnread = paymentList
      .filter((item: any) => item.userReminderStatus !== 'READ')
      .map((item: any) => ({
        id: `payment-${item.id}`,
        href: '/project/reminders',
        title: item.reminderType,
        subtitle: item.label,
        customerName: item.customerName,
        projectId: item.projectId,
      }));

      const approvalUnread = approvalList
  .filter((item: any) => item.userReminderStatus !== 'READ')
  .map((item: any) => ({
    id: `approval-${item.id}`,
    href: '/project/reminders',
    title: item.reminderType,
    subtitle: item.subtitle || 'Project approval pending',
    customerName: item.customerName,
    projectId: item.projectId,
  }));

  const purchaseUnread = purchaseList
  .filter((item: any) => item.userReminderStatus !== 'READ')
  .map((item: any) => ({
    id: `purchase-${item.id}`,
    href: '/project/reminders',
    title: item.reminderType,
    subtitle: item.materialName || 'Purchase pending',
    customerName: item.customerName,
    projectId: item.projectId,
  }));

  const documentUnread = documentList
  .filter((item: any) => item.userReminderStatus !== 'READ')
  .map((item: any) => ({
    id: `document-${item.id}`,
    href: '/project/reminders',
    title: item.reminderType,
    subtitle: `${item.missingCount || 0} documents pending`,
    customerName: item.customerName,
    projectId: item.projectId,
  }));

  const loanUnread = loanList
  .filter((item: any) => item.userReminderStatus !== 'READ')
  .map((item: any) => ({
    id: `loan-${item.id}`,
    href: '/project/reminders',
    title: item.reminderType,
    subtitle: item.loanStatus || 'Loan pending',
    customerName: item.customerName,
    projectId: item.projectId,
  }));

  const subsidyUnread = subsidyList
  .filter((item: any) => item.userReminderStatus !== 'READ')
  .map((item: any) => ({
    id: `subsidy-${item.id}`,
    href: '/project/reminders',
    title: item.reminderType,
    subtitle: item.subsidyStatus || 'Subsidy pending',
    customerName: item.customerName,
    projectId: item.projectId,
  }));

  const electricityUnread = electricityList
  .filter((item: any) => item.userReminderStatus !== 'READ')
  .map((item: any) => ({
    id: `electricity-${item.id}`,
    href: '/project/reminders',
    title: item.reminderType,
    subtitle:
      item.electricityStatus || 'Electricity pending',
    customerName: item.customerName,
    projectId: item.projectId,
  }));

  const finalClosureUnread = finalClosureList
  .filter((item: any) => item.userReminderStatus !== 'READ')
  .map((item: any) => ({
    id: `final-closure-${item.id}`,
    href: '/project/reminders',
    title: item.reminderType,
    subtitle:
      item.projectStatus || 'Project closure pending',
    customerName: item.customerName,
    projectId: item.projectId,
  }));

    setReminderPreview(
  [
  ...executionUnread,
  ...paymentUnread,
  ...approvalUnread,
  ...purchaseUnread,
  ...documentUnread,
  ...loanUnread,
  ...subsidyUnread,
  ...electricityUnread,
  ...finalClosureUnread,
].slice(0, 5),
);
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
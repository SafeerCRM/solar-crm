'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

type ReminderSummary = {
  overdueInspections: number;
  todaysExecutionWork: number;
  upcomingDeadlines: number;
  totalPendingReminders: number;
};

type ReminderItem = {
  id: number;
  projectId: number;
  activityType: string;
  status: string;
  reminderType: 'OVERDUE_INSPECTION' | 'TODAY_WORK' | 'UPCOMING_DEADLINE';
  scheduledDate: string | null;
  inspectionDeadline: string | null;
  assignedTo: number | null;
  assignedToName: string | null;
  remarks: string | null;

  customerName: string | null;
  customerPhone: string | null;
  city: string | null;
  zone: string | null;
  branchName: string | null;
  projectOwnerId: number | null;
  projectOwnerName: string | null;
  projectStatus: string | null;
  projectSerial: string | null;
  userReminderStatus: 'UNREAD' | 'READ' | 'DISMISSED';
  userReadAt: string | null;
};

type ApprovalReminderItem = {
  id: number;
  projectId: number;

  reminderType:
    | 'MARKETING_APPROVAL_PENDING'
    | 'OWNER_APPROVAL_PENDING'
    | 'PROJECT_APPROVAL_PENDING';

  title: string;
  subtitle: string;

  customerName: string | null;
  customerPhone: string | null;
  branchName: string | null;

  projectOwnerId: number | null;
  projectOwnerName: string | null;

  projectSerial: string | null;
  projectStatus: string | null;

  marketingHeadApprovalStatus: string | null;
  ownerApprovalStatus: string | null;

  createdAt: string;

  userReminderStatus: 'UNREAD' | 'READ';
};

type PurchaseReminderItem = {
  id: number;
  projectId: number;

  reminderType:
    | 'PURCHASE_PENDING'
    | 'PARTIAL_PURCHASE_PENDING';

  materialName: string | null;
  category: string | null;
  brand: string | null;

  quantity: number;
  purchasedQuantity: number;
  pendingQuantity: number;

  purchaseStatus: string | null;

  customerName: string | null;
  customerPhone: string | null;

  branchName: string | null;

  projectOwnerId: number | null;
  projectOwnerName: string | null;

  projectSerial: string | null;

  createdAt: string;

  userReminderStatus: 'UNREAD' | 'READ';
};

type PaymentReminderItem = {
  id: number;
  projectId: number;
  label: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string | null;
  status: string;
  reminderType: 'PAYMENT_OVERDUE' | 'PAYMENT_DUE_TODAY' | 'PAYMENT_UPCOMING';

  customerName: string | null;
  customerPhone: string | null;
  branchName: string | null;
  projectOwnerName: string | null;
  projectSerial: string | null;

  userReminderStatus: 'UNREAD' | 'READ' | 'DISMISSED';
  userReadAt: string | null;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ProjectRemindersPage() {
  const [summary, setSummary] = useState<ReminderSummary | null>(null);
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [paymentItems, setPaymentItems] = useState<PaymentReminderItem[]>([]);
  const [approvalItems, setApprovalItems] = useState<ApprovalReminderItem[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<
  | 'ALL'
  | 'EXECUTION'
  | 'PAYMENT'
  | 'APPROVAL'
  | 'PURCHASE'
  | 'OVERDUE'
  | 'TODAY'
  | 'UPCOMING'
>('ALL');

  const fetchReminders = async () => {
  try {
    setLoading(true);
    setMessage('');

    const [
  summaryRes,
  listRes,
  paymentRes,
  approvalRes,
  purchaseRes,
] = await Promise.all([
  axios.get(`${apiBaseUrl}/project/execution-reminders/summary`, {
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
]);

    setSummary(summaryRes.data || null);
    setItems(Array.isArray(listRes.data) ? listRes.data : []);
    setPaymentItems(Array.isArray(paymentRes.data) ? paymentRes.data : []);
    setApprovalItems(
  Array.isArray(approvalRes.data)
    ? approvalRes.data
    : [],
);

setPurchaseItems(
  Array.isArray(purchaseRes.data)
    ? purchaseRes.data
    : [],
);

  } catch (error: any) {
    console.error('Reminder error:', error);
    setSummary(null);
    setItems([]);
    setPaymentItems([]);
    setApprovalItems([]);
    setPurchaseItems([]);
    setMessage(
      error?.response?.data?.message || 'Failed to load reminders.',
    );
  } finally {
    setLoading(false);
  }
};

  const dismissReminder = async (activityId: number) => {
  const confirmed = window.confirm(
    'Are you sure you want to dismiss this reminder?',
  );

  if (!confirmed) return;

  try {
    await axios.post(
      `${apiBaseUrl}/project/execution-reminders/${activityId}/dismiss-user`,
      {},
      {
        headers: getAuthHeaders(),
      },
    );

    await fetchReminders();
  } catch (error: any) {
    console.error('Dismiss reminder error:', error);
    alert(
      error?.response?.data?.message ||
        'Failed to dismiss reminder.',
    );
  }
};

const markReminderAsRead = async (activityId: number) => {
  try {
    await axios.post(
      `${apiBaseUrl}/project/execution-reminders/${activityId}/read`,
      {},
      {
        headers: getAuthHeaders(),
      },
    );
  } catch (error) {
    console.error('Mark reminder as read error:', error);
  }
};

const markPaymentReminderAsRead = async (installmentId: number) => {
  try {
    await axios.post(
      `${apiBaseUrl}/project/payment-reminders/${installmentId}/read`,
      {},
      {
        headers: getAuthHeaders(),
      },
    );

    await fetchReminders();
  } catch (error) {
    console.error('Mark payment reminder as read error:', error);
  }
};

const dismissPaymentReminder = async (installmentId: number) => {
  const confirmed = window.confirm(
    'Are you sure you want to dismiss this payment reminder?',
  );

  if (!confirmed) return;

  try {
    await axios.post(
      `${apiBaseUrl}/project/payment-reminders/${installmentId}/dismiss`,
      {},
      {
        headers: getAuthHeaders(),
      },
    );

    await fetchReminders();
  } catch (error: any) {
    console.error('Dismiss payment reminder error:', error);
    alert(
      error?.response?.data?.message ||
        'Failed to dismiss payment reminder.',
    );
  }
};

  useEffect(() => {
    fetchReminders();
  }, []);

  const filteredExecutionItems = items.filter((item) => {
  if (filter === 'ALL' || filter === 'EXECUTION') return true;
  if (filter === 'PAYMENT') return false;

  if (filter === 'OVERDUE') return item.reminderType === 'OVERDUE_INSPECTION';
  if (filter === 'TODAY') return item.reminderType === 'TODAY_WORK';
  if (filter === 'UPCOMING') return item.reminderType === 'UPCOMING_DEADLINE';

  return true;
});

const filteredPaymentItems = paymentItems.filter((item) => {
  if (filter === 'ALL' || filter === 'PAYMENT') return true;
  if (filter === 'EXECUTION') return false;

  if (filter === 'OVERDUE') return item.reminderType === 'PAYMENT_OVERDUE';
  if (filter === 'TODAY') return item.reminderType === 'PAYMENT_DUE_TODAY';
  if (filter === 'UPCOMING') return item.reminderType === 'PAYMENT_UPCOMING';

  return true;
});

const filteredApprovalItems = approvalItems.filter((item) => {
  if (filter === 'ALL' || filter === 'APPROVAL') return true;

  if (
    filter === 'OVERDUE' ||
    filter === 'TODAY' ||
    filter === 'UPCOMING'
  ) {
    return false;
  }

  return false;
});

const filteredPurchaseItems = purchaseItems.filter((item) => {
  if (filter === 'ALL' || filter === 'PURCHASE')
    return true;

  if (
    filter === 'OVERDUE' ||
    filter === 'TODAY' ||
    filter === 'UPCOMING'
  ) {
    return false;
  }

  return false;
});

const totalVisibleReminders =
  filteredExecutionItems.length +
  filteredPaymentItems.length +
  filteredApprovalItems.length +
  filteredPurchaseItems.length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mb-6 rounded-2xl bg-white p-4 shadow md:p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          🔔 Reminder Center
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Execution reminders, overdue inspections, and upcoming project deadlines.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow">
          Loading reminders...
        </div>
      ) : message ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow">
          {message}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ReminderCard
              title="Overdue Inspections"
              value={summary?.overdueInspections || 0}
              description="Inspection activities past deadline"
              tone="red"
            />

            <ReminderCard
              title="Today’s Execution Work"
              value={summary?.todaysExecutionWork || 0}
              description="Execution activities scheduled for today"
              tone="blue"
            />

            <ReminderCard
              title="Upcoming Deadlines"
              value={summary?.upcomingDeadlines || 0}
              description="Deadlines within the next 7 days"
              tone="amber"
            />

            <ReminderCard
              title="Total Pending Reminders"
              value={summary?.totalPendingReminders || 0}
              description="All active reminders requiring attention"
              tone="purple"
            />

            <ReminderCard
  title="Approval Pending"
  value={approvalItems.length}
  description="Projects waiting for approvals"
  tone="amber"
/>

<ReminderCard
  title="Purchase Pending"
  value={purchaseItems.length}
  description="Pending procurement and partial purchases"
  tone="purple"
/>

            <ReminderCard
  title="Payment Reminders"
  value={paymentItems.length}
  description="Due, overdue, and upcoming payment reminders"
  tone="green"
/>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-4 shadow md:p-6">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Reminder Work List
                </h2>
                <p className="text-sm text-gray-500">
                  Active execution work, overdue inspections, and upcoming deadlines.
                </p>
              </div>

              <button
                onClick={fetchReminders}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              >
                Refresh
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
  <FilterButton label="All" active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
  <FilterButton label="Execution" active={filter === 'EXECUTION'} onClick={() => setFilter('EXECUTION')} />
  <FilterButton label="Payment" active={filter === 'PAYMENT'} onClick={() => setFilter('PAYMENT')} />
    <FilterButton
  label="Approval"
  active={filter === 'APPROVAL'}
  onClick={() => setFilter('APPROVAL')}
/>
<FilterButton
  label="Purchase"
  active={filter === 'PURCHASE'}
  onClick={() => setFilter('PURCHASE')}
/>
  <FilterButton label="Overdue" active={filter === 'OVERDUE'} onClick={() => setFilter('OVERDUE')} />
  <FilterButton label="Today" active={filter === 'TODAY'} onClick={() => setFilter('TODAY')} />
  <FilterButton label="Upcoming" active={filter === 'UPCOMING'} onClick={() => setFilter('UPCOMING')} />
</div>

{totalVisibleReminders === 0 ? (
  <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
    No reminders found for selected filter.
  </div>
) : (
  <div className="space-y-3">
    {filteredExecutionItems.map((item) => (
      <ReminderListItem
        key={`execution-${item.id}`}
        item={item}
        onDismiss={dismissReminder}
        onRead={markReminderAsRead}
      />
    ))}

    {filteredApprovalItems.map((item) => (
  <ApprovalReminderListItem
    key={`approval-${item.id}`}
    item={item}
  />
))}

{filteredPurchaseItems.map((item) => (
  <PurchaseReminderListItem
    key={`purchase-${item.id}`}
    item={item}
  />
))}

    {filteredPaymentItems.map((item) => (
      <PaymentReminderListItem
        key={`payment-${item.id}`}
        item={item}
        onDismiss={dismissPaymentReminder}
        onRead={markPaymentReminderAsRead}
      />
    ))}
  </div>
)}
          </div>
        </>
      )}
    </div>
  );
}

function ReminderCard({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  tone: 'red' | 'blue' | 'amber' | 'purple' | 'green';
}) {
  const toneClasses = {
    red: 'border-red-200 bg-red-50 text-red-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
    green: 'border-green-200 bg-green-50 text-green-700',
  };

  return (
    <div className={`rounded-2xl border p-4 shadow ${toneClasses[tone]}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs opacity-80">{description}</p>
    </div>
  );
}

function ReminderListItem({
  item,
  onDismiss,
  onRead,
}: {
  item: ReminderItem;
  onDismiss: (activityId: number) => void;
  onRead: (activityId: number) => void;
}) {
  const badge = getReminderBadge(item.reminderType);
  const mainDate = item.inspectionDeadline || item.scheduledDate;
  const isUnread = item.userReminderStatus !== 'READ';

  return (
    <div
      className={`rounded-xl border p-4 ${
        isUnread
          ? 'border-blue-300 bg-blue-50 shadow'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
            >
              {badge.label}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isUnread
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {isUnread ? 'Unread' : 'Seen'}
            </span>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
              {formatActivityType(item.activityType)}
            </span>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
              {item.status}
            </span>

            {item.projectStatus && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                Project: {item.projectStatus}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 md:grid-cols-2 xl:grid-cols-3">
            <InfoLine label="Customer" value={item.customerName || 'Not added'} />
            <InfoLine label="Phone" value={item.customerPhone || 'Not added'} />
            <InfoLine label="Project Serial" value={item.projectSerial || `#${item.projectId}`} />
            <InfoLine label="Project Owner" value={item.projectOwnerName || 'Not assigned'} />
            <InfoLine label="Assigned To" value={item.assignedToName || item.assignedTo || 'Not assigned'} />
            <InfoLine label="Branch" value={item.branchName || 'Not added'} />
            <InfoLine label="City" value={item.city || 'Not added'} />
            <InfoLine label="Zone" value={item.zone || 'Not added'} />
            <InfoLine label="Due/Scheduled" value={formatDate(mainDate)} />
          </div>

          {item.userReadAt && (
            <p className="mt-2 text-xs text-gray-500">
              Seen at: {formatDate(item.userReadAt)}
            </p>
          )}

          {item.remarks && (
            <p className="mt-3 rounded-lg bg-white p-2 text-sm text-gray-500">
              Remarks: {item.remarks}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href={`/project/${item.projectId}`}
            onClick={() => onRead(item.id)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white"
          >
            Open Project
          </Link>

          {isUnread && (
            <button
              type="button"
              onClick={() => onRead(item.id)}
              className="rounded-xl bg-green-600 px-4 py-2 text-center text-sm font-medium text-white"
            >
              Mark Seen
            </button>
          )}

          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            className="rounded-xl bg-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-800"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function ApprovalReminderListItem({
  item,
}: {
  item: ApprovalReminderItem;
}) {
  const badge = getApprovalReminderBadge(
    item.reminderType,
  );

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
            >
              {badge.label}
            </span>

            <span className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
              Pending
            </span>

            {item.projectStatus && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                Project: {item.projectStatus}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 md:grid-cols-2 xl:grid-cols-3">
            <InfoLine
              label="Customer"
              value={item.customerName || 'Not added'}
            />

            <InfoLine
              label="Phone"
              value={item.customerPhone || 'Not added'}
            />

            <InfoLine
              label="Project Serial"
              value={
                item.projectSerial ||
                `#${item.projectId}`
              }
            />

            <InfoLine
              label="Project Owner"
              value={
                item.projectOwnerName ||
                'Not assigned'
              }
            />

            <InfoLine
              label="Branch"
              value={item.branchName || 'Not added'}
            />

            <InfoLine
              label="Created"
              value={formatDate(item.createdAt)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href={`/project/${item.projectId}`}
            className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white"
          >
            Open Project
          </Link>
        </div>
      </div>
    </div>
  );
}

function PurchaseReminderListItem({
  item,
}: {
  item: PurchaseReminderItem;
}) {
  const badge = getPurchaseReminderBadge(
    item.reminderType,
  );

  return (
    <div className="rounded-xl border border-purple-300 bg-purple-50 p-4 shadow">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
            >
              {badge.label}
            </span>

            <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">
              Pending
            </span>

            {item.purchaseStatus && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                {item.purchaseStatus}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 md:grid-cols-2 xl:grid-cols-3">
            <InfoLine
              label="Customer"
              value={item.customerName || 'Not added'}
            />

            <InfoLine
              label="Material"
              value={item.materialName || 'Not added'}
            />

            <InfoLine
              label="Project Serial"
              value={
                item.projectSerial ||
                `#${item.projectId}`
              }
            />

            <InfoLine
              label="Project Owner"
              value={
                item.projectOwnerName ||
                'Not assigned'
              }
            />

            <InfoLine
              label="Pending Qty"
              value={item.pendingQuantity}
            />

            <InfoLine
              label="Branch"
              value={item.branchName || 'Not added'}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href={`/project/${item.projectId}`}
            className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white"
          >
            Open Project
          </Link>
        </div>
      </div>
    </div>
  );
}

function PaymentReminderListItem({
  item,
  onDismiss,
  onRead,
}: {
  item: PaymentReminderItem;
  onDismiss: (installmentId: number) => void;
  onRead: (installmentId: number) => void;
}) {
  const badge = getPaymentReminderBadge(item.reminderType);
  const isUnread = item.userReminderStatus !== 'READ';

  return (
    <div
      className={`rounded-xl border p-4 ${
        isUnread
          ? 'border-green-300 bg-green-50 shadow'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isUnread ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {isUnread ? 'Unread' : 'Seen'}
            </span>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
              {formatActivityType(item.label)}
            </span>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
              {item.status}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 md:grid-cols-2 xl:grid-cols-3">
            <InfoLine label="Customer" value={item.customerName || 'Not added'} />
            <InfoLine label="Phone" value={item.customerPhone || 'Not added'} />
            <InfoLine label="Project Serial" value={item.projectSerial || `#${item.projectId}`} />
            <InfoLine label="Project Owner" value={item.projectOwnerName || 'Not assigned'} />
            <InfoLine label="Branch" value={item.branchName || 'Not added'} />
            <InfoLine label="Due Date" value={formatDate(item.dueDate)} />
            <InfoLine label="Amount" value={`₹${Number(item.amount || 0).toLocaleString('en-IN')}`} />
            <InfoLine label="Paid" value={`₹${Number(item.paidAmount || 0).toLocaleString('en-IN')}`} />
            <InfoLine label="Pending" value={`₹${Number(item.pendingAmount || 0).toLocaleString('en-IN')}`} />
          </div>

          {item.userReadAt && (
            <p className="mt-2 text-xs text-gray-500">
              Seen at: {formatDate(item.userReadAt)}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href={`/project/${item.projectId}`}
            onClick={() => onRead(item.id)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white"
          >
            Open Project
          </Link>

          {isUnread && (
            <button
              type="button"
              onClick={() => onRead(item.id)}
              className="rounded-xl bg-green-600 px-4 py-2 text-center text-sm font-medium text-white"
            >
              Mark Seen
            </button>
          )}

          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            className="rounded-xl bg-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-800"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function getReminderBadge(type: ReminderItem['reminderType']) {
  if (type === 'OVERDUE_INSPECTION') {
    return {
      label: 'Overdue Inspection',
      className: 'bg-red-100 text-red-700',
    };
  }

  if (type === 'TODAY_WORK') {
    return {
      label: 'Today Work',
      className: 'bg-blue-100 text-blue-700',
    };
  }

  return {
    label: 'Upcoming Deadline',
    className: 'bg-amber-100 text-amber-700',
  };
}

function getPurchaseReminderBadge(
  type: PurchaseReminderItem['reminderType'],
) {
  if (type === 'PARTIAL_PURCHASE_PENDING') {
    return {
      label: 'Partial Purchase Pending',
      className: 'bg-amber-100 text-amber-700',
    };
  }

  return {
    label: 'Purchase Pending',
    className: 'bg-purple-100 text-purple-700',
  };
}

function getApprovalReminderBadge(
  type: ApprovalReminderItem['reminderType'],
) {
  if (type === 'MARKETING_APPROVAL_PENDING') {
    return {
      label: 'Marketing Approval Pending',
      className: 'bg-amber-100 text-amber-700',
    };
  }

  if (type === 'OWNER_APPROVAL_PENDING') {
    return {
      label: 'Owner Approval Pending',
      className: 'bg-red-100 text-red-700',
    };
  }

  return {
    label: 'Project Approval Pending',
    className: 'bg-blue-100 text-blue-700',
  };
}

function getPaymentReminderBadge(type: PaymentReminderItem['reminderType']) {
  if (type === 'PAYMENT_OVERDUE') {
    return {
      label: 'Payment Overdue',
      className: 'bg-red-100 text-red-700',
    };
  }

  if (type === 'PAYMENT_DUE_TODAY') {
    return {
      label: 'Payment Due Today',
      className: 'bg-blue-100 text-blue-700',
    };
  }

  return {
    label: 'Payment Upcoming',
    className: 'bg-amber-100 text-amber-700',
  };
}

function formatActivityType(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Invalid date';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function InfoLine({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-white p-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="truncate font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}
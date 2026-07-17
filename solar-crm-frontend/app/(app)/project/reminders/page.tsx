'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';
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
  | 'PROJECT_MANAGER_APPROVAL_PENDING'
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

  projectManagerApprovalStatus: string | null;
marketingHeadApprovalStatus: string | null;
ownerApprovalStatus: string | null;

  createdAt: string;

  userReminderStatus: 'UNREAD' | 'READ';
};

type FinalClosureReminderItem = {
  id: number;
  projectId: number;

  reminderType:
    | 'PROJECT_COMPLETION_PENDING'
    | 'PROJECT_OVERDUE'
    | 'PAYMENT_CLOSURE_PENDING'
    | 'FINAL_STATUS_UPDATE_PENDING';

  customerName: string | null;
  customerPhone: string | null;

  branchName: string | null;

  projectOwnerId: number | null;
  projectOwnerName: string | null;

  projectSerial: string | null;

  projectType: string | null;

  projectStatus: string | null;

  paymentStatus: string | null;

  expectedCompletionDate: string | null;

  actualCompletionDate: string | null;

  updatedAt: string;

  createdAt: string;

  userReminderStatus:
    | 'UNREAD'
    | 'READ'
    | 'DISMISSED';
};

type ElectricityReminderItem = {
  id: number;
  projectId: number;

  reminderType:
    | 'ELECTRICITY_DOCUMENT_PENDING'
    | 'DISCOM_PROCESS_PENDING'
    | 'NET_METER_PENDING'
    | 'CONNECTION_PENDING';

  discomName: string | null;

  electricityStatus: string | null;

  fileSubmissionDate: string | null;
  siteVisitDate: string | null;

  demandDepositDate: string | null;
  demandDepositAmount: number;

  meterTestingDate: string | null;
  netMeterInstallationDate: string | null;

  remarks: string | null;

  updatedAt: string;

  customerName: string | null;
  customerPhone: string | null;

  branchName: string | null;

  projectOwnerId: number | null;
  projectOwnerName: string | null;

  projectSerial: string | null;

  projectType: string | null;
  projectStatus: string | null;

  userReminderStatus:
    | 'UNREAD'
    | 'READ'
    | 'DISMISSED';
};

type SubsidyReminderItem = {
  id: number;
  projectId: number;

  reminderType:
    | 'SUBSIDY_DOCUMENT_PENDING'
    | 'SUBSIDY_PROCESS_PENDING'
    | 'SUBSIDY_REQUEST_PENDING';

  subsidyStatus: string | null;

  dcrCertificateReady: boolean;
  panelWarrantyReceived: boolean;
  inverterWarrantyReceived: boolean;
  vendorAgreementReady: boolean;
  wcrReady: boolean;

  portalSubmissionDate: string | null;
  subsidyRequestedDate: string | null;
  subsidyDisbursedDate: string | null;

  subsidyAmount: number;

  remarks: string | null;

  updatedAt: string;

  customerName: string | null;
  customerPhone: string | null;

  branchName: string | null;

  projectOwnerId: number | null;
  projectOwnerName: string | null;

  projectSerial: string | null;

  projectType: string | null;
  projectStatus: string | null;

  userReminderStatus:
    | 'UNREAD'
    | 'READ'
    | 'DISMISSED';
};

type LoanReminderItem = {
  id: number;
  projectId: number;

  reminderType:
    | 'LOAN_DOCUMENT_PENDING'
    | 'LOAN_PROCESS_PENDING'
    | 'LOAN_DISBURSEMENT_PENDING';

  loanType: string | null;
  bankName: string | null;
  applicationNumber: string | null;

  marginMoney: number;
  sanctionAmount: number;

  firstEmiDisbursementAmount: number;
  firstEmiDisbursementDate: string | null;

  loanStatus: string | null;

  remarks: string | null;

  updatedAt: string;

  customerName: string | null;
  customerPhone: string | null;

  branchName: string | null;

  projectOwnerId: number | null;
  projectOwnerName: string | null;

  projectSerial: string | null;

  projectType: string | null;
  projectStatus: string | null;

  userReminderStatus:
    | 'UNREAD'
    | 'READ'
    | 'DISMISSED';
};

type DocumentReminderItem = {
  id: number;
  projectId: number;

  reminderType: 'DOCUMENT_PENDING';

  missingDocumentTypes: string[];
  missingCount: number;

  customerName: string | null;
  customerPhone: string | null;

  branchName: string | null;

  projectOwnerId: number | null;
  projectOwnerName: string | null;

  projectSerial: string | null;

  projectType: string | null;
  projectStatus: string | null;

  createdAt: string;

  userReminderStatus:
    | 'UNREAD'
    | 'READ'
    | 'DISMISSED';
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
  const [approvalPage, setApprovalPage] =
  useState(1);

const [approvalTotalPages, setApprovalTotalPages] =
  useState(1);
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [paymentItems, setPaymentItems] = useState<PaymentReminderItem[]>([]);
  const [approvalItems, setApprovalItems] = useState<ApprovalReminderItem[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseReminderItem[]>([]);
  const [documentItems, setDocumentItems] = useState<DocumentReminderItem[]>([]);
  const [loanItems, setLoanItems] = useState<LoanReminderItem[]>([]);
  const [subsidyItems, setSubsidyItems] = useState<SubsidyReminderItem[]>([]);
  const [electricityItems, setElectricityItems] = useState<ElectricityReminderItem[]>([]);
  const [finalClosureItems, setFinalClosureItems] = useState<FinalClosureReminderItem[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<
  | 'ALL'
  | 'EXECUTION'
  | 'PAYMENT'
  | 'APPROVAL'
  | 'PURCHASE'
  | 'DOCUMENT'
  | 'LOAN'
  | 'SUBSIDY'
  | 'ELECTRICITY'
  | 'FINAL_CLOSURE'
  | 'OVERDUE'
  | 'TODAY'
  | 'UPCOMING'
>('APPROVAL');

const approvalPaginationInitialized =
  useRef(false);

  const fetchReminders = async (
  selectedFilter:
    | 'ALL'
    | 'EXECUTION'
    | 'PAYMENT'
    | 'APPROVAL'
    | 'PURCHASE'
    | 'DOCUMENT'
    | 'LOAN'
    | 'SUBSIDY'
    | 'ELECTRICITY'
    | 'FINAL_CLOSURE'
    | 'OVERDUE'
    | 'TODAY'
    | 'UPCOMING' = 'ALL',
) => {
  try {
    setLoading(true);
    setMessage('');

    const summaryRes = await axios.get(
      `${apiBaseUrl}/project/execution-reminders/summary`,
      {
        headers: getAuthHeaders(),
      },
    );

    setSummary(summaryRes.data || null);

    if (
      selectedFilter === 'ALL' ||
      selectedFilter === 'EXECUTION' ||
      selectedFilter === 'OVERDUE' ||
      selectedFilter === 'TODAY' ||
      selectedFilter === 'UPCOMING'
    ) {
      const listRes = await axios.get(
        `${apiBaseUrl}/project/execution-reminders`,
        {
          headers: getAuthHeaders(),
        },
      );

      setItems(
        Array.isArray(listRes.data)
          ? listRes.data
          : [],
      );
    }

    if (
  selectedFilter === 'ALL' ||
  selectedFilter === 'PAYMENT' ||
  selectedFilter === 'OVERDUE' ||
  selectedFilter === 'TODAY' ||
  selectedFilter === 'UPCOMING'
) {
      const paymentRes = await axios.get(
        `${apiBaseUrl}/project/payment-reminders`,
        {
          headers: getAuthHeaders(),
        },
      );

      setPaymentItems(
        Array.isArray(paymentRes.data)
          ? paymentRes.data
          : [],
      );
    }

    if (
      selectedFilter === 'ALL' ||
      selectedFilter === 'APPROVAL'
    ) {
      const approvalRes = await axios.get(
  `${apiBaseUrl}/project/approval-reminders?page=${approvalPage}&limit=20`,
        {
          headers: getAuthHeaders(),
        },
      );

      setApprovalItems(
  Array.isArray(approvalRes.data)
    ? approvalRes.data
    : Array.isArray(approvalRes.data?.data)
      ? approvalRes.data.data
      : [],
);

setApprovalTotalPages(
  Number(
    approvalRes.data?.totalPages || 1,
  ),
);
    }

    if (
      selectedFilter === 'ALL' ||
      selectedFilter === 'PURCHASE'
    ) {
      const purchaseRes = await axios.get(
        `${apiBaseUrl}/project/purchase-reminders`,
        {
          headers: getAuthHeaders(),
        },
      );

      setPurchaseItems(
        Array.isArray(purchaseRes.data)
          ? purchaseRes.data
          : [],
      );
    }

    if (
      selectedFilter === 'ALL' ||
      selectedFilter === 'DOCUMENT'
    ) {
      const documentRes = await axios.get(
        `${apiBaseUrl}/project/document-reminders`,
        {
          headers: getAuthHeaders(),
        },
      );

      setDocumentItems(
        Array.isArray(documentRes.data)
          ? documentRes.data
          : [],
      );
    }

    if (
      selectedFilter === 'ALL' ||
      selectedFilter === 'LOAN'
    ) {
      const loanRes = await axios.get(
        `${apiBaseUrl}/project/loan-reminders`,
        {
          headers: getAuthHeaders(),
        },
      );

      setLoanItems(
        Array.isArray(loanRes.data)
          ? loanRes.data
          : [],
      );
    }

    if (
      selectedFilter === 'ALL' ||
      selectedFilter === 'SUBSIDY'
    ) {
      const subsidyRes = await axios.get(
        `${apiBaseUrl}/project/subsidy-reminders`,
        {
          headers: getAuthHeaders(),
        },
      );

      setSubsidyItems(
        Array.isArray(subsidyRes.data)
          ? subsidyRes.data
          : [],
      );
    }

    if (
      selectedFilter === 'ALL' ||
      selectedFilter === 'ELECTRICITY'
    ) {
      const electricityRes = await axios.get(
        `${apiBaseUrl}/project/electricity-reminders`,
        {
          headers: getAuthHeaders(),
        },
      );

      setElectricityItems(
        Array.isArray(electricityRes.data)
          ? electricityRes.data
          : [],
      );
    }

    if (
  selectedFilter === 'ALL' ||
  selectedFilter === 'FINAL_CLOSURE' ||
  selectedFilter === 'OVERDUE'
) {
  const finalClosureRes = await axios.get(
    `${apiBaseUrl}/project/final-closure-reminders`,
    {
      headers: getAuthHeaders(),
    },
  );

  setFinalClosureItems(
    Array.isArray(finalClosureRes.data)
      ? finalClosureRes.data
      : [],
  );
}
  } catch (error: any) {
    console.error('Reminder error:', error);

    setMessage(
      error?.response?.data?.message ||
        'Failed to load reminders.',
    );
  } finally {
    setLoading(false);
  }
};

const updateUnifiedReminderAsReadLocally = (
  reminderSource: string,
  referenceId: number,
) => {
  const updateItems = (currentItems: any[]) =>
    currentItems.map((item) =>
      Number(item.id) === Number(referenceId)
        ? {
            ...item,
            userReminderStatus: 'READ',
            userReadAt: new Date().toISOString(),
          }
        : item,
    );

  switch (reminderSource) {
    case 'APPROVAL':
      setApprovalItems(updateItems);
      break;

    case 'PURCHASE':
      setPurchaseItems(updateItems);
      break;

    case 'DOCUMENT':
      setDocumentItems(updateItems);
      break;

    case 'LOAN':
      setLoanItems(updateItems);
      break;

    case 'SUBSIDY':
      setSubsidyItems(updateItems);
      break;

    case 'ELECTRICITY':
      setElectricityItems(updateItems);
      break;

    case 'FINAL_CLOSURE':
      setFinalClosureItems(updateItems);
      break;

    default:
      console.warn(
        'Unknown unified reminder source:',
        reminderSource,
      );
  }
};

const markUnifiedReminderAsRead = async (body: {
  reminderSource: string;
  reminderType: string;
  referenceId: number;
  projectId?: number;
}) => {
  try {
    setActionLoadingId(
      `${body.reminderSource}-${body.referenceId}-READ`,
    );

    await axios.post(
      `${apiBaseUrl}/project/reminders/mark-read`,
      body,
      {
        headers: getAuthHeaders(),
      },
    );

    updateUnifiedReminderAsReadLocally(
      body.reminderSource,
      body.referenceId,
    );
  } catch (error: any) {
    console.error(
      'Mark unified reminder read error:',
      error,
    );

    alert(
      error?.response?.data?.message ||
        'Failed to mark reminder as seen.',
    );
  } finally {
    setActionLoadingId(null);
  }
};

const removeUnifiedReminderLocally = (
  reminderSource: string,
  referenceId: number,
) => {
  const removeById = (currentItems: any[]) =>
    currentItems.filter(
      (item) =>
        Number(item.id) !== Number(referenceId),
    );

  const removeDocumentByProjectId = (
    currentItems: DocumentReminderItem[],
  ) =>
    currentItems.filter(
      (item) =>
        Number(item.projectId) !==
        Number(referenceId),
    );

  switch (reminderSource) {
    case 'APPROVAL':
      setApprovalItems(removeById);
      break;

    case 'PURCHASE':
      setPurchaseItems(removeById);
      break;

    case 'DOCUMENT':
      setDocumentItems(
        removeDocumentByProjectId,
      );
      break;

    case 'LOAN':
      setLoanItems(removeById);
      break;

    case 'SUBSIDY':
      setSubsidyItems(removeById);
      break;

    case 'ELECTRICITY':
      setElectricityItems(removeById);
      break;

    case 'FINAL_CLOSURE':
      setFinalClosureItems(removeById);
      break;

    default:
      console.warn(
        'Unknown unified reminder source:',
        reminderSource,
      );
  }
};

const dismissUnifiedReminder = async (body: {
  reminderSource: string;
  reminderType: string;
  referenceId: number;
  projectId?: number;
}) => {
  const confirmed = window.confirm(
    'Are you sure you want to dismiss this reminder?',
  );

  if (!confirmed) {
    return;
  }

  try {
    setActionLoadingId(
      `${body.reminderSource}-${body.referenceId}-DISMISS`,
    );

    await axios.post(
      `${apiBaseUrl}/project/reminders/dismiss`,
      body,
      {
        headers: getAuthHeaders(),
      },
    );

    removeUnifiedReminderLocally(
      body.reminderSource,
      body.referenceId,
    );
  } catch (error: any) {
    console.error(
      'Dismiss unified reminder error:',
      error,
    );

    alert(
      error?.response?.data?.message ||
        'Failed to dismiss reminder.',
    );
  } finally {
    setActionLoadingId(null);
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

    setItems((currentItems) =>
  currentItems.filter(
    (item) => item.id !== activityId,
  ),
);
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

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === activityId
          ? {
              ...item,
              userReminderStatus: 'READ',
              userReadAt: new Date().toISOString(),
            }
          : item,
      ),
    );
  } catch (error: any) {
    console.error('Mark reminder as read error:', error);

    alert(
      error?.response?.data?.message ||
        'Failed to mark reminder as seen.',
    );
  }
};

const markPaymentReminderAsRead = async (
  installmentId: number,
) => {
  try {
    await axios.post(
      `${apiBaseUrl}/project/payment-reminders/${installmentId}/read`,
      {},
      {
        headers: getAuthHeaders(),
      },
    );

    setPaymentItems((currentItems) =>
      currentItems.map((item) =>
        item.id === installmentId
          ? {
              ...item,
              userReminderStatus: 'READ',
              userReadAt: new Date().toISOString(),
            }
          : item,
      ),
    );
  } catch (error: any) {
    console.error(
      'Mark payment reminder as read error:',
      error,
    );

    alert(
      error?.response?.data?.message ||
        'Failed to mark payment reminder as seen.',
    );
  }
};

const dismissPaymentReminder = async (
  installmentId: number,
) => {
  const confirmed = window.confirm(
    'Are you sure you want to dismiss this payment reminder?',
  );

  if (!confirmed) {
    return;
  }

  try {
    await axios.post(
      `${apiBaseUrl}/project/payment-reminders/${installmentId}/dismiss`,
      {},
      {
        headers: getAuthHeaders(),
      },
    );

    setPaymentItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== installmentId,
      ),
    );
  } catch (error: any) {
    console.error(
      'Dismiss payment reminder error:',
      error,
    );

    alert(
      error?.response?.data?.message ||
        'Failed to dismiss payment reminder.',
    );
  }
};

const changeFilter = (
  nextFilter:
    | 'ALL'
    | 'EXECUTION'
    | 'PAYMENT'
    | 'APPROVAL'
    | 'PURCHASE'
    | 'DOCUMENT'
    | 'LOAN'
    | 'SUBSIDY'
    | 'ELECTRICITY'
    | 'FINAL_CLOSURE'
    | 'OVERDUE'
    | 'TODAY'
    | 'UPCOMING',
) => {
  setApprovalPage(1);
  setFilter(nextFilter);
};

  useEffect(() => {
  fetchReminders(filter);
}, [filter]);

useEffect(() => {
  if (!approvalPaginationInitialized.current) {
    approvalPaginationInitialized.current = true;
    return;
  }

  if (filter !== 'APPROVAL') {
    return;
  }

  fetchReminders('APPROVAL');
}, [approvalPage]);

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

const filteredDocumentItems = documentItems.filter((item) => {
  if (filter === 'ALL' || filter === 'DOCUMENT')
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

const filteredLoanItems = loanItems.filter((item) => {
  if (filter === 'ALL' || filter === 'LOAN')
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

const filteredSubsidyItems = subsidyItems.filter((item) => {
  if (filter === 'ALL' || filter === 'SUBSIDY')
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

const filteredElectricityItems = electricityItems.filter((item) => {
  if (filter === 'ALL' || filter === 'ELECTRICITY')
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

const filteredFinalClosureItems =
  finalClosureItems.filter((item) => {
    if (
      filter === 'ALL' ||
      filter === 'FINAL_CLOSURE'
    )
      return true;

    if (
      filter === 'OVERDUE' &&
      item.reminderType === 'PROJECT_OVERDUE'
    ) {
      return true;
    }

    if (
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
  filteredPurchaseItems.length +
  filteredDocumentItems.length +
  filteredLoanItems.length +
  filteredSubsidyItems.length +
  filteredElectricityItems.length +
  filteredFinalClosureItems.length;

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
  title="Document Pending"
  value={documentItems.length}
  description="Projects with missing mandatory documents"
  tone="red"
/>

<ReminderCard
  title="Loan Pending"
  value={loanItems.length}
  description="Loan process and disbursement reminders"
  tone="blue"
/>

<ReminderCard
  title="Subsidy Pending"
  value={subsidyItems.length}
  description="Subsidy process and request reminders"
  tone="amber"
/>

<ReminderCard
  title="Electricity Pending"
  value={electricityItems.length}
  description="DISCOM and net meter reminders"
  tone="purple"
/>

<ReminderCard
  title="Final Closure"
  value={finalClosureItems.length}
  description="Project completion and closure reminders"
  tone="green"
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
                onClick={() => fetchReminders(filter)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              >
                Refresh
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
  <FilterButton
    label="All"
    active={filter === 'ALL'}
    onClick={() => changeFilter('ALL')}
  />

  <FilterButton
    label="Execution"
    active={filter === 'EXECUTION'}
    onClick={() => changeFilter('EXECUTION')}
  />

  <FilterButton
    label="Payment"
    active={filter === 'PAYMENT'}
    onClick={() => changeFilter('PAYMENT')}
  />

  <FilterButton
    label="Approval"
    active={filter === 'APPROVAL'}
    onClick={() => changeFilter('APPROVAL')}
  />

  <FilterButton
    label="Purchase"
    active={filter === 'PURCHASE'}
    onClick={() => changeFilter('PURCHASE')}
  />

  <FilterButton
    label="Document"
    active={filter === 'DOCUMENT'}
    onClick={() => changeFilter('DOCUMENT')}
  />

  <FilterButton
    label="Loan"
    active={filter === 'LOAN'}
    onClick={() => changeFilter('LOAN')}
  />

  <FilterButton
    label="Subsidy"
    active={filter === 'SUBSIDY'}
    onClick={() => changeFilter('SUBSIDY')}
  />

  <FilterButton
    label="Electricity"
    active={filter === 'ELECTRICITY'}
    onClick={() => changeFilter('ELECTRICITY')}
  />

  <FilterButton
    label="Final Closure"
    active={filter === 'FINAL_CLOSURE'}
    onClick={() => changeFilter('FINAL_CLOSURE')}
  />

  <FilterButton
    label="Overdue"
    active={filter === 'OVERDUE'}
    onClick={() => changeFilter('OVERDUE')}
  />

  <FilterButton
    label="Today"
    active={filter === 'TODAY'}
    onClick={() => changeFilter('TODAY')}
  />

  <FilterButton
    label="Upcoming"
    active={filter === 'UPCOMING'}
    onClick={() => changeFilter('UPCOMING')}
  />
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
  onMarkRead={markUnifiedReminderAsRead}
onDismiss={dismissUnifiedReminder}
  actionLoadingId={actionLoadingId}
/>
))}

{filter === 'APPROVAL' &&
  approvalTotalPages > 1 && (
    <div className="mt-6 flex items-center justify-center gap-4">
      <button
        disabled={approvalPage <= 1}
        onClick={() =>
          setApprovalPage((prev) =>
            Math.max(prev - 1, 1),
          )
        }
        className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        Previous
      </button>

      <div className="text-sm font-semibold text-gray-700">
        Page {approvalPage} of{' '}
        {approvalTotalPages}
      </div>

      <button
        disabled={
          approvalPage >= approvalTotalPages
        }
        onClick={() =>
          setApprovalPage((prev) =>
            Math.min(
              prev + 1,
              approvalTotalPages,
            ),
          )
        }
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Next
      </button>
    </div>
  )}

{filteredFinalClosureItems.map((item) => (
  <FinalClosureReminderListItem
    key={`final-closure-${item.id}`}
    item={item}
    onMarkRead={markUnifiedReminderAsRead}
    onDismiss={dismissUnifiedReminder}
    actionLoadingId={actionLoadingId}
  />
))}

{filteredElectricityItems.map((item) => (
  <ElectricityReminderListItem
    key={`electricity-${item.id}`}
    item={item}
    onMarkRead={markUnifiedReminderAsRead}
    onDismiss={dismissUnifiedReminder}
    actionLoadingId={actionLoadingId}
  />
))}

{filteredSubsidyItems.map((item) => (
  <SubsidyReminderListItem
    key={`subsidy-${item.id}`}
    item={item}
    onMarkRead={markUnifiedReminderAsRead}
    onDismiss={dismissUnifiedReminder}
    actionLoadingId={actionLoadingId}
  />
))}

{filteredLoanItems.map((item) => (
  <LoanReminderListItem
    key={`loan-${item.id}`}
    item={item}
    onMarkRead={markUnifiedReminderAsRead}
    onDismiss={dismissUnifiedReminder}
    actionLoadingId={actionLoadingId}
  />
))}

{filteredDocumentItems.map((item) => (
  <DocumentReminderListItem
    key={`document-${item.id}`}
    item={item}
    onMarkRead={markUnifiedReminderAsRead}
    onDismiss={dismissUnifiedReminder}
    actionLoadingId={actionLoadingId}
  />
))}

{filteredPurchaseItems.map((item) => (
  <PurchaseReminderListItem
  key={`purchase-${item.id}`}
  item={item}
  onMarkRead={markUnifiedReminderAsRead}
onDismiss={dismissUnifiedReminder}
  actionLoadingId={actionLoadingId}
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
  onMarkRead,
  onDismiss,
  actionLoadingId,
}: {
  item: ApprovalReminderItem;

  onMarkRead: any;

  onDismiss: any;

  actionLoadingId: string | null;
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
  {item.userReminderStatus !== 'READ' && (
    <button
      onClick={() =>
        onMarkRead({
          reminderSource: 'APPROVAL',
          reminderType: item.reminderType,
          referenceId: item.projectId,
          projectId: item.projectId,
        })
      }
      disabled={
        actionLoadingId ===
        `APPROVAL-${item.projectId}-READ`
      }
      className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white"
    >
      Mark Seen
    </button>
  )}

  <button
    onClick={() =>
      onDismiss({
        reminderSource: 'APPROVAL',
        reminderType: item.reminderType,
        referenceId: item.projectId,
        projectId: item.projectId,
      })
    }
    disabled={
      actionLoadingId ===
      `APPROVAL-${item.projectId}-DISMISS`
    }
    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
  >
    Dismiss
  </button>

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

function FinalClosureReminderListItem({
  item,
  onMarkRead,
  onDismiss,
  actionLoadingId,
}: {
  item: FinalClosureReminderItem;

  onMarkRead: any;

  onDismiss: any;

  actionLoadingId: string | null;
}) {
  const badge =
    getFinalClosureReminderBadge(item.reminderType);

  return (
    <div className="rounded-xl border border-green-300 bg-green-50 p-4 shadow">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
            >
              {badge.label}
            </span>

            {item.projectStatus && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                {formatActivityType(item.projectStatus)}
              </span>
            )}

            {item.paymentStatus && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                Payment: {item.paymentStatus}
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
              label="Project Type"
              value={item.projectType || 'Not added'}
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
              label="Expected Completion"
              value={
                item.expectedCompletionDate
                  ? new Date(
                      item.expectedCompletionDate,
                    ).toLocaleDateString('en-IN')
                  : 'Not added'
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {item.userReminderStatus !== 'READ' && (
            <button
              onClick={() =>
                onMarkRead({
                  reminderSource: 'FINAL_CLOSURE',
                  reminderType: item.reminderType,
                  referenceId: item.id,
                  projectId: item.projectId,
                })
              }
              disabled={
                actionLoadingId ===
                `FINAL_CLOSURE-${item.id}-READ`
              }
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white"
            >
              Mark Seen
            </button>
          )}

          <button
            onClick={() =>
              onDismiss({
                reminderSource: 'FINAL_CLOSURE',
                reminderType: item.reminderType,
                referenceId: item.id,
                projectId: item.projectId,
              })
            }
            disabled={
              actionLoadingId ===
              `FINAL_CLOSURE-${item.id}-DISMISS`
            }
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Dismiss
          </button>

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

function ElectricityReminderListItem({
  item,
  onMarkRead,
  onDismiss,
  actionLoadingId,
}: {
  item: ElectricityReminderItem;

  onMarkRead: any;

  onDismiss: any;

  actionLoadingId: string | null;
}) {
  const badge =
    getElectricityReminderBadge(item.reminderType);

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

            {item.electricityStatus && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                {formatActivityType(item.electricityStatus)}
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
              label="DISCOM"
              value={item.discomName || 'Not added'}
            />

            <InfoLine
              label="Demand Amount"
              value={`₹${Number(
                item.demandDepositAmount || 0,
              ).toLocaleString('en-IN')}`}
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
          </div>

          {item.remarks && (
            <div className="mt-3 rounded-lg bg-white p-3">
              <p className="mb-1 text-xs font-semibold text-gray-500">
                Remarks
              </p>

              <p className="text-sm text-gray-700">
                {item.remarks}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {item.userReminderStatus !== 'READ' && (
            <button
              onClick={() =>
                onMarkRead({
                  reminderSource: 'ELECTRICITY',
                  reminderType: item.reminderType,
                  referenceId: item.id,
                  projectId: item.projectId,
                })
              }
              disabled={
                actionLoadingId ===
                `ELECTRICITY-${item.id}-READ`
              }
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white"
            >
              Mark Seen
            </button>
          )}

          <button
            onClick={() =>
              onDismiss({
                reminderSource: 'ELECTRICITY',
                reminderType: item.reminderType,
                referenceId: item.id,
                projectId: item.projectId,
              })
            }
            disabled={
              actionLoadingId ===
              `ELECTRICITY-${item.id}-DISMISS`
            }
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Dismiss
          </button>

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

function SubsidyReminderListItem({
  item,
  onMarkRead,
  onDismiss,
  actionLoadingId,
}: {
  item: SubsidyReminderItem;

  onMarkRead: any;

  onDismiss: any;

  actionLoadingId: string | null;
}) {
  const badge =
    getSubsidyReminderBadge(item.reminderType);

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

            {item.subsidyStatus && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                {formatActivityType(item.subsidyStatus)}
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
              label="Subsidy Amount"
              value={`₹${Number(
                item.subsidyAmount || 0,
              ).toLocaleString('en-IN')}`}
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
          </div>

          <div className="mt-3 rounded-lg bg-white p-3">
            <p className="mb-2 text-xs font-semibold text-gray-500">
              Subsidy Document Readiness
            </p>

            <div className="flex flex-wrap gap-2">
              <StatusChip
                label="DCR"
                ready={item.dcrCertificateReady}
              />
              <StatusChip
                label="Panel Warranty"
                ready={item.panelWarrantyReceived}
              />
              <StatusChip
                label="Inverter Warranty"
                ready={item.inverterWarrantyReceived}
              />
              <StatusChip
                label="Vendor Agreement"
                ready={item.vendorAgreementReady}
              />
              <StatusChip
                label="WCR"
                ready={item.wcrReady}
              />
            </div>
          </div>

          {item.remarks && (
            <div className="mt-3 rounded-lg bg-white p-3">
              <p className="mb-1 text-xs font-semibold text-gray-500">
                Remarks
              </p>

              <p className="text-sm text-gray-700">
                {item.remarks}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {item.userReminderStatus !== 'READ' && (
            <button
              onClick={() =>
                onMarkRead({
                  reminderSource: 'SUBSIDY',
                  reminderType: item.reminderType,
                  referenceId: item.id,
                  projectId: item.projectId,
                })
              }
              disabled={
                actionLoadingId ===
                `SUBSIDY-${item.id}-READ`
              }
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white"
            >
              Mark Seen
            </button>
          )}

          <button
            onClick={() =>
              onDismiss({
                reminderSource: 'SUBSIDY',
                reminderType: item.reminderType,
                referenceId: item.id,
                projectId: item.projectId,
              })
            }
            disabled={
              actionLoadingId ===
              `SUBSIDY-${item.id}-DISMISS`
            }
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Dismiss
          </button>

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

function LoanReminderListItem({
  item,
  onMarkRead,
  onDismiss,
  actionLoadingId,
}: {
  item: LoanReminderItem;

  onMarkRead: any;

  onDismiss: any;

  actionLoadingId: string | null;
}) {
  const badge =
    getLoanReminderBadge(item.reminderType);

  return (
    <div className="rounded-xl border border-blue-300 bg-blue-50 p-4 shadow">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
            >
              {badge.label}
            </span>

            {item.loanStatus && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                {formatActivityType(item.loanStatus)}
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
              label="Loan Type"
              value={item.loanType || 'Not added'}
            />

            <InfoLine
              label="Bank"
              value={item.bankName || 'Not added'}
            />

            <InfoLine
              label="Application"
              value={
                item.applicationNumber ||
                'Not added'
              }
            />

            <InfoLine
              label="Sanction Amount"
              value={`₹${Number(
                item.sanctionAmount || 0,
              ).toLocaleString('en-IN')}`}
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
          </div>

          {item.remarks && (
            <div className="mt-3 rounded-lg bg-white p-3">
              <p className="mb-1 text-xs font-semibold text-gray-500">
                Remarks
              </p>

              <p className="text-sm text-gray-700">
                {item.remarks}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {item.userReminderStatus !== 'READ' && (
            <button
              onClick={() =>
                onMarkRead({
                  reminderSource: 'LOAN',
                  reminderType: item.reminderType,
                  referenceId: item.id,
                  projectId: item.projectId,
                })
              }
              disabled={
                actionLoadingId ===
                `LOAN-${item.id}-READ`
              }
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white"
            >
              Mark Seen
            </button>
          )}

          <button
            onClick={() =>
              onDismiss({
                reminderSource: 'LOAN',
                reminderType: item.reminderType,
                referenceId: item.id,
                projectId: item.projectId,
              })
            }
            disabled={
              actionLoadingId ===
              `LOAN-${item.id}-DISMISS`
            }
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Dismiss
          </button>

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

function DocumentReminderListItem({
  item,
  onMarkRead,
  onDismiss,
  actionLoadingId,
}: {
  item: DocumentReminderItem;

  onMarkRead: any;

  onDismiss: any;

  actionLoadingId: string | null;
}) {
  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-4 shadow">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              Document Pending
            </span>

            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
              {item.missingCount} Missing
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
              label="Project Type"
              value={item.projectType || 'Not added'}
            />

            <InfoLine
              label="Branch"
              value={item.branchName || 'Not added'}
            />
          </div>

          <div className="mt-3 rounded-lg bg-white p-3">
            <p className="mb-2 text-xs font-semibold text-gray-500">
              Missing Documents
            </p>

            <div className="flex flex-wrap gap-2">
              {item.missingDocumentTypes.map((doc) => (
                <span
                  key={doc}
                  className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                >
                  {formatActivityType(doc)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {item.userReminderStatus !== 'READ' && (
            <button
              onClick={() =>
                onMarkRead({
                  reminderSource: 'DOCUMENT',
                  reminderType: item.reminderType,
                  referenceId: item.projectId,
                  projectId: item.projectId,
                })
              }
              disabled={
                actionLoadingId ===
                `DOCUMENT-${item.projectId}-READ`
              }
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white"
            >
              Mark Seen
            </button>
          )}

          <button
            onClick={() =>
              onDismiss({
                reminderSource: 'DOCUMENT',
                reminderType: item.reminderType,
                referenceId: item.projectId,
                projectId: item.projectId,
              })
            }
            disabled={
              actionLoadingId ===
              `DOCUMENT-${item.projectId}-DISMISS`
            }
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
          >
            Dismiss
          </button>

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
  onMarkRead,
  onDismiss,
  actionLoadingId,
}: {
  item: PurchaseReminderItem;

  onMarkRead: any;

  onDismiss: any;

  actionLoadingId: string | null;
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
  {item.userReminderStatus !== 'READ' && (
    <button
      onClick={() =>
        onMarkRead({
          reminderSource: 'PURCHASE',
          reminderType: item.reminderType,
          referenceId: item.id,
          projectId: item.projectId,
        })
      }
      disabled={
        actionLoadingId ===
        `PURCHASE-${item.id}-READ`
      }
      className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white"
    >
      Mark Seen
    </button>
  )}

  <button
    onClick={() =>
      onDismiss({
        reminderSource: 'PURCHASE',
        reminderType: item.reminderType,
        referenceId: item.id,
        projectId: item.projectId,
      })
    }
    disabled={
      actionLoadingId ===
      `PURCHASE-${item.id}-DISMISS`
    }
    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white"
  >
    Dismiss
  </button>

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

function getFinalClosureReminderBadge(
  type: FinalClosureReminderItem['reminderType'],
) {
  if (type === 'PROJECT_OVERDUE') {
    return {
      label: 'Project Overdue',
      className: 'bg-red-100 text-red-700',
    };
  }

  if (type === 'PAYMENT_CLOSURE_PENDING') {
    return {
      label: 'Payment Closure Pending',
      className: 'bg-amber-100 text-amber-700',
    };
  }

  if (type === 'PROJECT_COMPLETION_PENDING') {
    return {
      label: 'Project Completion Pending',
      className: 'bg-blue-100 text-blue-700',
    };
  }

  return {
    label: 'Final Status Update Pending',
    className: 'bg-green-100 text-green-700',
  };
}

function getElectricityReminderBadge(
  type: ElectricityReminderItem['reminderType'],
) {
  if (type === 'ELECTRICITY_DOCUMENT_PENDING') {
    return {
      label: 'Electricity Document Pending',
      className: 'bg-red-100 text-red-700',
    };
  }

  if (type === 'NET_METER_PENDING') {
    return {
      label: 'Net Meter Pending',
      className: 'bg-amber-100 text-amber-700',
    };
  }

  if (type === 'CONNECTION_PENDING') {
    return {
      label: 'Connection Pending',
      className: 'bg-green-100 text-green-700',
    };
  }

  return {
    label: 'DISCOM Process Pending',
    className: 'bg-purple-100 text-purple-700',
  };
}

function getSubsidyReminderBadge(
  type: SubsidyReminderItem['reminderType'],
) {
  if (type === 'SUBSIDY_DOCUMENT_PENDING') {
    return {
      label: 'Subsidy Document Pending',
      className: 'bg-red-100 text-red-700',
    };
  }

  if (type === 'SUBSIDY_REQUEST_PENDING') {
    return {
      label: 'Subsidy Request Pending',
      className: 'bg-amber-100 text-amber-700',
    };
  }

  return {
    label: 'Subsidy Process Pending',
    className: 'bg-blue-100 text-blue-700',
  };
}

function getLoanReminderBadge(
  type: LoanReminderItem['reminderType'],
) {
  if (type === 'LOAN_DOCUMENT_PENDING') {
    return {
      label: 'Loan Document Pending',
      className: 'bg-red-100 text-red-700',
    };
  }

  if (type === 'LOAN_DISBURSEMENT_PENDING') {
    return {
      label: 'Loan Disbursement Pending',
      className: 'bg-amber-100 text-amber-700',
    };
  }

  return {
    label: 'Loan Process Pending',
    className: 'bg-blue-100 text-blue-700',
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
   if (type === 'PROJECT_MANAGER_APPROVAL_PENDING') {
  return {
    label: 'Project Manager Approval Pending',
    className: 'bg-blue-100 text-blue-700',
  };
}

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

function StatusChip({
  label,
  ready,
}: {
  label: string;
  ready: boolean;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        ready
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      }`}
    >
      {label}: {ready ? 'Ready' : 'Pending'}
    </span>
  );
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
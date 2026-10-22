'use client';

import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const ROOT = '/webhooks/whatsapp/automation-management';

type Automation = {
  id: number;
  automationKey: string;
  name: string;
  description: string | null;
  triggerType: string;
  recipientType: string;
  isEnabled: boolean;
  effectiveEnabled: boolean;
  templateName: string | null;
  templateLanguage: string;
  triggerOffsetMinutes: number | null;
  repeatAfterMinutes: number | null;
  maxRepeatCount: number | null;
  updatedAt: string;
};

type Overview = {
  configuration: {
    globalAutomationsEnabled: boolean;
    sendMode: string;
    productionCredentialsConfigured: boolean;
    testCredentialsConfigured: boolean;
  };
  summary: Record<string, number>;
  automations: Automation[];
};

type Message = {
  id: number;
  direction: string;
  recipientType: string | null;
  recipientPhone: string;
  recipientName: string | null;
    matchedCustomers?: {
    id: number;
    customerName: string | null;
    mobile: string | null;
    alternateMobile: string | null;
  }[];

  matchedProjects?: {
    id: number;
    customerId: number | null;
    customerName: string | null;
    customerPhone: string | null;
    status: string;
  }[];
  messageType: string;
  templateName: string | null;
  messageBody: string | null;
  status: string;
  automationKey: string | null;
  referenceType: string | null;
  referenceId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  failedAt: string | null;
};

type MessageResponse = {
  data: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type AutomationAudit = {
  id: number;
  automationKey: string;
  previousEnabled: boolean;
  newEnabled: boolean;
  changedBy: number;
  createdAt: string;
};

type AutomationAuditResponse = {
  data: AutomationAudit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type CustomerConfirmation = {
  id: number;
  projectId: number;
  status: 'PENDING' | 'CONFIRMED' | 'CORRECTION_REQUESTED';
  customerName: string | null;
  customerPhone: string | null;
  kNumber: string | null;
  requestedAt: string | null;
  respondedAt: string | null;
  responseText: string | null;
  resendAttemptNumber: number;
  createdAt: string;
  updatedAt: string;
};

type CustomerConfirmationResponse = {
  data: CustomerConfirmation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type ConfirmationSnapshot = {
  snapshotVersion?: number;
  capturedAt?: string | null;
  projectId?: number;
  customer?: {
    name?: string | null;
    phone?: string | null;
    kNumber?: string | null;
    city?: string | null;
    zone?: string | null;
    address?: string | null;
  };
  financial?: {
    finalCost?: number | null;
    netAmount?: number | null;
    loanAmount?: number | null;
    projectCost?: number | null;
    projectType?: string | null;
    subsidyType?: string | null;
    subsidyAmount?: number | null;
    subsidyCategory?: string | null;
  };
  solarSystem?: {
    capacity?: number | string | null;
    panelBrand?: string | null;
    dcrPanelCount?: number | null;
    inverterBrand?: string | null;
    inverterPhase?: string | null;
    structureType?: string | null;
    inverterCapacity?: number | string | null;
    nonDcrPanelCount?: number | null;
    structureCapacityKw?: number | string | null;
  };
};

type ConfirmationHistoryEvent = {
  id: number;
  projectId: number;
  confirmationId: number;
  eventType: string;
  previousStatus: string | null;
  newStatus: string | null;
  requestMessageId: string | null;
  responseMessageId: string | null;
  responseText: string | null;
  customerPhone: string | null;
  projectSnapshot: ConfirmationSnapshot | null;
  performedBy: number | null;
  remarks: string | null;
  createdAt: string;
};

type ConfirmationDetailsResponse = {
  projectId: number;
  confirmation: (CustomerConfirmation & {
    requestMessageId: string | null;
    responseMessageId: string | null;
    ownerOverride: boolean;
    ownerOverrideBy: number | null;
    ownerOverrideReason: string | null;
    ownerOverrideAt: string | null;
    projectSnapshot: ConfirmationSnapshot | null;
    resendReservationId: string | null;
    resendReservedAt: string | null;
  }) | null;
  history: ConfirmationHistoryEvent[];
};

const statusOptions = ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'RECEIVED', 'SKIPPED'];

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function statusClass(status: string) {
  if (['READ', 'DELIVERED', 'RECEIVED'].includes(status)) return 'bg-emerald-50 text-emerald-700';
  if (status === 'FAILED') return 'bg-red-50 text-red-700';
  if (status === 'SENT') return 'bg-blue-50 text-blue-700';
  return 'bg-amber-50 text-amber-700';
}

export default function WhatsappAutomationPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<
  'overview' | 'confirmations' | 'messages' | 'audit'
>('overview');

const [confirmations, setConfirmations] = useState<CustomerConfirmation[]>([]);
const [confirmationTotal, setConfirmationTotal] = useState(0);
const [confirmationTotalPages, setConfirmationTotalPages] = useState(0);
const [confirmationPage, setConfirmationPage] = useState(1);

const [confirmationStatus, setConfirmationStatus] = useState('');
const [confirmationSearchInput, setConfirmationSearchInput] = useState('');
const [confirmationSearch, setConfirmationSearch] = useState('');

const [confirmationLoading, setConfirmationLoading] = useState(false);
const [confirmationError, setConfirmationError] = useState('');

const [selectedConfirmationProjectId, setSelectedConfirmationProjectId] =
  useState<number | null>(null);

const [confirmationDetails, setConfirmationDetails] =
  useState<ConfirmationDetailsResponse | null>(null);

const [confirmationDetailsLoading, setConfirmationDetailsLoading] =
  useState(false);

const [confirmationDetailsError, setConfirmationDetailsError] =
  useState('');

  const [confirmationResending, setConfirmationResending] = useState(false);

const [confirmationResendError, setConfirmationResendError] =
  useState('');

const [confirmationResendSuccess, setConfirmationResendSuccess] =
  useState('');

  const loadConfirmationDetails = async (projectId: number) => {
  setSelectedConfirmationProjectId(projectId);
  setConfirmationDetails(null);
  setConfirmationDetailsError('');
  setConfirmationDetailsLoading(true);

  try {
    if (!API_BASE_URL) {
      throw new Error('Backend API URL is not configured.');
    }

    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Please log in again.');
    }

    const response = await fetch(
      `${API_BASE_URL}/project/${projectId}/customer-confirmation`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      throw new Error(
        response.status === 403
          ? 'You do not have permission to access WhatsApp Automation.'
          : `Unable to load confirmation details (HTTP ${response.status}).`,
      );
    }

    const result = await response.json();

    setConfirmationDetails(result);
  } catch (error) {
    setConfirmationDetailsError(
      error instanceof Error
        ? error.message
        : 'Unable to load confirmation details.',
    );
  } finally {
    setConfirmationDetailsLoading(false);
  }
};

const resendCustomerConfirmation = async (projectId: number) => {
  if (confirmationResending) return;

  if (
    selectedConfirmationProjectId !== projectId ||
    confirmationDetails?.projectId !== projectId ||
    confirmationDetails.confirmation?.status !== 'CORRECTION_REQUESTED'
  ) {
    setConfirmationResendError(
      'Resend is allowed only for a verified correction request.',
    );
    return;
  }

  const confirmed = window.confirm(
    `Resend corrected project details to the customer for Project #${projectId}?\n\n` +
      'This will send a real WhatsApp message if the recipient is permitted by the production rollout settings.\n\n' +
      'Please verify that the project details have been corrected before proceeding.',
  );

  if (!confirmed) return;

  setConfirmationResending(true);
  setConfirmationResendError('');
  setConfirmationResendSuccess('');

  try {
    if (!API_BASE_URL) {
      throw new Error('Backend API URL is not configured.');
    }

    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Please log in again.');
    }

    const response = await fetch(
      `${API_BASE_URL}/project/${projectId}/customer-confirmation/resend`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const backendMessage = result?.message;

      throw new Error(
        typeof backendMessage === 'string'
          ? backendMessage
          : `Resend failed (HTTP ${response.status}).`,
      );
    }

    if (result?.requiresReconciliation || result?.sent !== true) {
      setConfirmationResendError(
        typeof result?.message === 'string'
          ? result.message
          : 'Sending could not be confirmed. Manual reconciliation is required. Do not retry.',
      );
    } else {
      setConfirmationResendSuccess(
        typeof result?.message === 'string'
          ? result.message
          : 'Corrected confirmation submitted successfully.',
      );
    }

    await loadConfirmationDetails(projectId);
    await loadCustomerConfirmations(
      confirmationPage,
      confirmationStatus,
      confirmationSearch,
    );
  } catch (error) {
    setConfirmationResendError(
      error instanceof Error
        ? error.message
        : 'Unable to resend customer confirmation.',
    );
  } finally {
    setConfirmationResending(false);
  }
};

const loadCustomerConfirmations = async (
  page = 1,
  status = '',
  search = '',
) => {
  setConfirmationLoading(true);
  setConfirmationError('');

  try {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Login session not found.');
    }

    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
    });

    if (status) {
      params.set('status', status);
    }

    if (search.trim()) {
      params.set('search', search.trim());
    }

    const response = await fetch(
      `${API_BASE_URL}/project/customer-confirmations?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to load customer confirmations (HTTP ${response.status}).`,
      );
    }

    const result: CustomerConfirmationResponse = await response.json();

    setConfirmations(result.data ?? []);
    setConfirmationTotal(result.total ?? 0);
    setConfirmationTotalPages(result.totalPages ?? 0);
    setConfirmationPage(result.page ?? page);
  } catch (error) {
    setConfirmationError(
      error instanceof Error
        ? error.message
        : 'Unable to load customer confirmations.',
    );
    setConfirmations([]);
  } finally {
    setConfirmationLoading(false);
  }
};

useEffect(() => {
  if (authorized !== true || activeTab !== 'confirmations') {
    return;
  }

  void loadCustomerConfirmations(
    confirmationPage,
    confirmationStatus,
    confirmationSearch,
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [
  authorized,
  activeTab,
  confirmationPage,
  confirmationStatus,
  confirmationSearch,
]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState('');
  const [status, setStatus] = useState('');
  const [automationKey, setAutomationKey] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

    const [updatingAutomationKey, setUpdatingAutomationKey] = useState('');

    const [auditRecords, setAuditRecords] = useState<AutomationAudit[]>([]);
const [auditTotal, setAuditTotal] = useState(0);
const [auditTotalPages, setAuditTotalPages] = useState(0);
const [auditPage, setAuditPage] = useState(1);
const [auditAutomationKey, setAuditAutomationKey] = useState('');
const [auditLoading, setAuditLoading] = useState(false);
const [auditError, setAuditError] = useState('');
  const [automationActionError, setAutomationActionError] = useState('');

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setAuthorized(
  Array.isArray(user.roles) &&
    user.roles.some((role: string) =>
      ['OWNER', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER'].includes(role)
    )
);
    } catch {
      setAuthorized(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!authorized) return;
    setLoading(true);
    setError('');
    try {
      if (!API_BASE_URL) throw new Error('Backend API URL is not configured.');
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please log in again.');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (direction) params.set('direction', direction);
      if (status) params.set('status', status);
      if (automationKey) params.set('automationKey', automationKey);
      if (search) params.set('search', search);
      const headers = { Authorization: `Bearer ${token}` };
      const [overviewResponse, messagesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}${ROOT}/overview`, { headers, cache: 'no-store' }),
        fetch(`${API_BASE_URL}${ROOT}/messages?${params}`, { headers, cache: 'no-store' }),
      ]);
      if (!overviewResponse.ok || !messagesResponse.ok) {
        const code = !overviewResponse.ok ? overviewResponse.status : messagesResponse.status;
        throw new Error(code === 403 ? 'You do not have permission to access WhatsApp Automation.' : `Unable to load WhatsApp data (${code}).`);
      }
      const nextOverview: Overview = await overviewResponse.json();
      const nextMessages: MessageResponse = await messagesResponse.json();
      setOverview(nextOverview);
      setMessages(Array.isArray(nextMessages.data) ? nextMessages.data : []);
      setTotal(Number(nextMessages.total) || 0);
      setTotalPages(Number(nextMessages.totalPages) || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load WhatsApp data.');
    } finally {
      setLoading(false);
    }
  }, [authorized, page, direction, status, automationKey, search]);

  useEffect(() => { void loadData(); }, [loadData]);

  const loadAuditHistory = useCallback(async () => {
  if (!authorized) return;

  setAuditLoading(true);
  setAuditError('');

  try {
    if (!API_BASE_URL) {
      throw new Error('Backend API URL is not configured.');
    }

    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Please log in again.');
    }

    const params = new URLSearchParams({
      page: String(auditPage),
      limit: '20',
    });

    if (auditAutomationKey) {
      params.set('automationKey', auditAutomationKey);
    }

    const response = await fetch(
      `${API_BASE_URL}${ROOT}/audit-history?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      throw new Error(
        response.status === 403
          ? 'You do not have permission to access WhatsApp Automation.'
          : `Unable to load audit history (${response.status}).`,
      );
    }

    const result: AutomationAuditResponse = await response.json();

    setAuditRecords(Array.isArray(result.data) ? result.data : []);
    setAuditTotal(Number(result.total) || 0);
    setAuditTotalPages(Number(result.totalPages) || 0);
  } catch (err) {
    setAuditError(
      err instanceof Error
        ? err.message
        : 'Unable to load audit history.',
    );
  } finally {
    setAuditLoading(false);
  }
}, [authorized, auditPage, auditAutomationKey]);

useEffect(() => {
  void loadAuditHistory();
}, [loadAuditHistory]);

    const updateAutomation = async (
    item: Automation,
    nextEnabled: boolean,
  ) => {
    if (updatingAutomationKey) return;

    const action = nextEnabled ? 'ENABLE' : 'DISABLE';

    const confirmed = window.confirm(
      `${action} "${item.name}"?\n\n` +
      (
        nextEnabled
          ? 'This enables the individual automation setting. ' +
            'Messages can be sent when global automations are enabled and the trigger runs.'
          : 'This disables the individual automation setting.'
      ),
    );

    if (!confirmed) return;

    setUpdatingAutomationKey(item.automationKey);
    setAutomationActionError('');

    try {
      if (!API_BASE_URL) {
        throw new Error('Backend API URL is not configured.');
      }

      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Please log in again.');
      }

      const response = await fetch(
        `${API_BASE_URL}${ROOT}/setting`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            automationKey: item.automationKey,
            isEnabled: nextEnabled,
          }),
        },
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        const message = Array.isArray(result?.message)
          ? result.message.join(', ')
          : typeof result?.message === 'string'
            ? result.message
            : `Unable to update automation (${response.status}).`;

        throw new Error(message);
      }

      await loadData();
    } catch (err) {
      setAutomationActionError(
        err instanceof Error
          ? err.message
          : 'Unable to update automation.',
      );
    } finally {
      setUpdatingAutomationKey('');
    }
  };

  if (authorized === null) return <div className="p-6 text-gray-600">Checking access...</div>;
  if (!authorized)
  return (
    <div className="rounded-xl border bg-white p-6 text-red-700">
      You do not have permission to access WhatsApp Automation Management.
    </div>
  );

  const summary = overview?.summary;
  const stats = [
    ['Outbound', summary?.outbound], ['Inbound', summary?.inbound],
    ['Pending', summary?.pending], ['Sent', summary?.sent],
    ['Delivered', summary?.delivered], ['Read', summary?.read],
    ['Failed', summary?.failed], ['Received', summary?.received],
  ] as const;
  const selectClass = 'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800';

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-2 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Automation Management</h1>
          <p className="mt-1 text-sm text-gray-500">
  WhatsApp Automation · Live records · Automation controls
</p>
        </div>
        <button type="button" onClick={() => void loadData()} disabled={loading}
          className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

            <div className="flex flex-wrap gap-2 rounded-2xl border bg-white p-2 shadow-sm">
        {(
          [
            { key: 'overview', label: 'Overview & Automations' },
            { key: 'confirmations', label: 'Customer Confirmations' },
            { key: 'messages', label: 'Message History' },
            { key: 'audit', label: 'Automation Audit' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.key
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {automationActionError && (
  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    Automation update failed: {automationActionError}
  </div>
)}

            {activeTab === 'overview' && (
        <>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">System configuration</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Global automations', overview ? (overview.configuration.globalAutomationsEnabled ? 'Enabled' : 'Disabled') : '—'],
            ['Sending mode', overview?.configuration.sendMode || '—'],
            ['Production credentials', overview ? (overview.configuration.productionCredentialsConfigured ? 'Configured' : 'Missing') : '—'],
            ['Test credentials', overview ? (overview.configuration.testCredentialsConfigured ? 'Configured' : 'Missing') : '—'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <p className="mt-2 text-lg font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-500">
  The global automation setting is controlled through the backend environment.
  Individual automation switches can be managed below.
  {overview && !overview.configuration.globalAutomationsEnabled && (
    <span className="ml-1 font-semibold text-amber-700">
      Global automations are currently disabled.
    </span>
  )}
</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{value ?? '—'}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">Message counts reflect each record's latest status, not the number of historical delivery events.</p>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="font-semibold text-gray-900">Configured automations</h2>
          <p className="mt-1 text-xs text-gray-500">Individual configuration and effective global sending status</p>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2">
          {(overview?.automations || []).map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="mt-1 break-all text-xs text-gray-500">{item.automationKey}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.effectiveEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {item.effectiveEnabled ? 'Effective ON' : 'Effective OFF'}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600">{item.description || 'No description'}</p>
              <div className="mt-3 space-y-1 text-xs text-gray-600">
                <p>Individual switch: <strong>{item.isEnabled ? 'ON' : 'OFF'}</strong></p>
                <p>Trigger: {item.triggerType} · Recipient: {item.recipientType}</p>
                <p>Template: <span className="break-all">{item.templateName || 'Not configured'}</span> ({item.templateLanguage})</p>
                <p>Updated: {formatDate(item.updatedAt)}</p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
  <span
    className={`rounded-full px-3 py-1 text-xs font-semibold ${
      item.isEnabled
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-gray-100 text-gray-600'
    }`}
  >
    Individual setting: {item.isEnabled ? 'ON' : 'OFF'}
  </span>

  <button
    type="button"
    disabled={Boolean(updatingAutomationKey) || loading}
    onClick={() => void updateAutomation(item, !item.isEnabled)}
    className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
      item.isEnabled
        ? 'bg-red-600 hover:bg-red-700'
        : 'bg-emerald-600 hover:bg-emerald-700'
    }`}
  >
    {updatingAutomationKey === item.automationKey
      ? 'Updating...'
      : item.isEnabled
        ? 'Disable automation'
        : 'Enable automation'}
  </button>
</div>
            </div>
          ))}
          {overview && overview.automations.length === 0 && <p className="text-sm text-gray-500">No automation definitions found.</p>}
        </div>
      </section>

              </>
      )}

      {activeTab === 'audit' && (
      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
    <div>
      <h2 className="font-semibold text-gray-900">
        Automation Audit History
      </h2>
      <p className="mt-1 text-xs text-gray-500">
        {auditTotal} recorded changes · Authorized user actions · Permanent history
      </p>
    </div>

    <button
      type="button"
      onClick={() => void loadAuditHistory()}
      disabled={auditLoading}
      className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
    >
      {auditLoading ? 'Loading...' : 'Refresh history'}
    </button>
  </div>

  <div className="border-b p-4">
    <div className="max-w-sm">
      <label
        htmlFor="auditAutomationFilter"
        className="mb-2 block text-xs font-semibold text-gray-600"
      >
        Filter by automation
      </label>

      <select
        id="auditAutomationFilter"
        value={auditAutomationKey}
        onChange={(event) => {
          setAuditAutomationKey(event.target.value);
          setAuditPage(1);
        }}
        className={selectClass}
      >
        <option value="">All automations</option>
        {(overview?.automations || []).map((item) => (
          <option key={item.automationKey} value={item.automationKey}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  </div>

  {auditError && (
    <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {auditError}
    </div>
  )}

  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
        <tr>
          <th className="px-4 py-3">Date (IST)</th>
          <th className="px-4 py-3">Automation</th>
          <th className="px-4 py-3">Previous</th>
          <th className="px-4 py-3">New</th>
          <th className="px-4 py-3">Changed by</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
        {auditRecords.map((record) => {
          const automation = overview?.automations.find(
            (item) => item.automationKey === record.automationKey,
          );

          return (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                {formatDate(record.createdAt)}
              </td>

              <td className="px-4 py-4">
                <div className="font-semibold text-gray-900">
                  {automation?.name || record.automationKey}
                </div>
                <div className="mt-1 break-all text-xs text-gray-500">
                  {record.automationKey}
                </div>
              </td>

              <td className="px-4 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    record.previousEnabled
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {record.previousEnabled ? 'ON' : 'OFF'}
                </span>
              </td>

              <td className="px-4 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    record.newEnabled
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {record.newEnabled ? 'ON' : 'OFF'}
                </span>
              </td>

              <td className="px-4 py-4 text-gray-700">
                User ID {record.changedBy}
              </td>
            </tr>
          );
        })}

        {!auditLoading && auditRecords.length === 0 && !auditError && (
          <tr>
            <td colSpan={5} className="p-10 text-center text-gray-500">
              No automation changes recorded.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
    <p className="text-sm text-gray-500">
      Page {auditPage} of {Math.max(1, auditTotalPages)}
    </p>

    <div className="flex gap-2">
      <button
        type="button"
        disabled={auditLoading || auditPage <= 1}
        onClick={() => setAuditPage((page) => page - 1)}
        className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
      >
        Previous
      </button>

      <button
        type="button"
        disabled={auditLoading || auditPage >= auditTotalPages}
        onClick={() => setAuditPage((page) => page + 1)}
        className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
      >
        Next
      </button>
    </div>
  </div>
</section>
      )}

            {activeTab === 'confirmations' && (
        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
            <div>
              <h2 className="font-semibold text-gray-900">
                Customer Project Confirmations
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                {confirmationTotal} matching records · Customer responses · Project verification
              </p>
            </div>

            <button
              type="button"
              disabled={confirmationLoading}
              onClick={() =>
                void loadCustomerConfirmations(
                  confirmationPage,
                  confirmationStatus,
                  confirmationSearch,
                )
              }
              className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {confirmationLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <form
            className="grid gap-3 border-b p-4 sm:grid-cols-2 lg:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              setConfirmationPage(1);
              setConfirmationSearch(confirmationSearchInput.trim());
            }}
          >
            <input
              value={confirmationSearchInput}
              onChange={(event) =>
                setConfirmationSearchInput(event.target.value)
              }
              placeholder="Project ID, customer, phone or K-Number"
              className={`${selectClass} lg:col-span-2`}
            />

            <select
              value={confirmationStatus}
              onChange={(event) => {
                setConfirmationStatus(event.target.value);
                setConfirmationPage(1);
              }}
              className={selectClass}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CORRECTION_REQUESTED">
                Correction Requested
              </option>
            </select>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Search
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfirmationSearchInput('');
                  setConfirmationSearch('');
                  setConfirmationStatus('');
                  setConfirmationPage(1);
                }}
                className="rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                Clear
              </button>
            </div>
          </form>

          {confirmationError && (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {confirmationError}
            </div>
          )}

                    <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Requested (IST)</th>
                  <th className="px-4 py-3">Responded (IST)</th>
                  <th className="px-4 py-3">Response</th>
                  <th className="px-4 py-3">Attempts</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {confirmations.map((item) => (
                  <tr
                    key={item.id}
                    className="align-top hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <a
                        href={`/project/${item.projectId}`}
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        #{item.projectId}
                      </a>

                      <div className="mt-1 text-xs text-gray-500">
                        K-Number: {item.kNumber || '—'}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">
                        {item.customerName || '—'}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {item.customerPhone || '—'}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.status === 'CORRECTION_REQUESTED'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {item.status === 'CONFIRMED'
                          ? 'Confirmed'
                          : item.status === 'CORRECTION_REQUESTED'
                            ? 'Correction Requested'
                            : item.requestedAt
                              ? 'Awaiting Response'
                              : 'Not Yet Sent'}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                      {formatDate(item.requestedAt)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                      {formatDate(item.respondedAt)}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {item.responseText || '—'}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {item.resendAttemptNumber}
                    </td>

                                        <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          void loadConfirmationDetails(item.projectId)
                        }
                        disabled={confirmationDetailsLoading}
                        className="whitespace-nowrap rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                      >
                        {confirmationDetailsLoading &&
                        selectedConfirmationProjectId === item.projectId
                          ? 'Loading...'
                          : 'View Details'}
                      </button>
                    </td>
                  </tr>
                ))}

                {!confirmationLoading &&
                  confirmations.length === 0 &&
                  !confirmationError && (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-10 text-center text-gray-500"
                      >
                        No customer confirmations found.
                      </td>
                    </tr>
                  )}

                {confirmationLoading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-10 text-center text-gray-500"
                    >
                      Loading customer confirmations...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

                    {selectedConfirmationProjectId !== null && (
            <div className="border-t bg-gray-50 p-4 sm:p-5">
              <div className="rounded-xl border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Confirmation Details — Project #{selectedConfirmationProjectId}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Read-only project confirmation information
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedConfirmationProjectId(null);
                      setConfirmationDetails(null);
                      setConfirmationDetailsError('');
                    }}
                    className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700"
                  >
                    Close
                  </button>
                </div>

                {confirmationDetailsLoading && (
                  <p className="mt-4 text-sm text-gray-500">
                    Loading confirmation details...
                  </p>
                )}

                {confirmationDetailsError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {confirmationDetailsError}
                  </div>
                )}

                                {!confirmationDetailsLoading &&
                  !confirmationDetailsError &&
                  confirmationDetails && (
                    <div className="mt-5 space-y-5">
                      {confirmationDetails.confirmation ? (
                        <>

                            {confirmationDetails.confirmation.status ===
      'CORRECTION_REQUESTED' && (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-amber-900">
              Customer Correction Requested
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Verify and update the project details before resending
              the confirmation to the customer.
            </p>
          </div>

          <button
            type="button"
            disabled={confirmationResending}
            onClick={() =>
              void resendCustomerConfirmation(
                confirmationDetails.projectId,
              )
            }
            className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmationResending
              ? 'Sending...'
              : 'Resend Corrected Confirmation'}
          </button>
        </div>
      </div>
    )}

    {confirmationResendError && (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        {confirmationResendError}
      </div>
    )}

    {confirmationResendSuccess && (
      <div
        role="status"
        className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
      >
        {confirmationResendSuccess}
      </div>
    )}
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Confirmation Status
                              </p>
                              <p className="mt-1 text-lg font-bold text-gray-900">
                                {confirmationDetails.confirmation.status ===
                                'CONFIRMED'
                                  ? 'Customer Confirmed'
                                  : confirmationDetails.confirmation.status ===
                                      'CORRECTION_REQUESTED'
                                    ? 'Correction Requested'
                                    : confirmationDetails.confirmation.requestedAt
                                      ? 'Awaiting Customer Response'
                                      : 'Not Yet Sent'}
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                confirmationDetails.confirmation.status ===
                                'CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : confirmationDetails.confirmation.status ===
                                      'CORRECTION_REQUESTED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {confirmationDetails.confirmation.status}
                            </span>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-xl border bg-gray-50 p-4">
                              <p className="text-xs text-gray-500">
                                Customer Name
                              </p>
                              <p className="mt-1 font-semibold text-gray-900">
                                {confirmationDetails.confirmation.projectSnapshot
                                  ?.customer?.name || '—'}
                              </p>
                            </div>

                            <div className="rounded-xl border bg-gray-50 p-4">
                              <p className="text-xs text-gray-500">
                                Customer Phone
                              </p>
                              <p className="mt-1 font-semibold text-gray-900">
                                {confirmationDetails.confirmation.customerPhone ||
                                  '—'}
                              </p>
                            </div>

                            <div className="rounded-xl border bg-gray-50 p-4">
                              <p className="text-xs text-gray-500">
                                K-Number
                              </p>
                              <p className="mt-1 break-all font-semibold text-gray-900">
                                {confirmationDetails.confirmation.projectSnapshot
                                  ?.customer?.kNumber || '—'}
                              </p>
                            </div>

                            <div className="rounded-xl border bg-gray-50 p-4">
                              <p className="text-xs text-gray-500">
                                Request Sent (IST)
                              </p>
                              <p className="mt-1 font-semibold text-gray-900">
                                {formatDate(
                                  confirmationDetails.confirmation.requestedAt,
                                )}
                              </p>
                            </div>

                            <div className="rounded-xl border bg-gray-50 p-4">
                              <p className="text-xs text-gray-500">
                                Customer Responded (IST)
                              </p>
                              <p className="mt-1 font-semibold text-gray-900">
                                {formatDate(
                                  confirmationDetails.confirmation.respondedAt,
                                )}
                              </p>
                            </div>

                            <div className="rounded-xl border bg-gray-50 p-4">
                              <p className="text-xs text-gray-500">
                                Customer Response
                              </p>
                              <p className="mt-1 font-semibold text-gray-900">
                                {confirmationDetails.confirmation.responseText ||
                                  '—'}
                              </p>
                            </div>
                          </div>

                                                    <div className="space-y-4 border-t pt-5">
                            <h4 className="text-base font-bold text-gray-900">
                              Solar System Snapshot
                            </h4>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {[
                                ['System Capacity', confirmationDetails.confirmation.projectSnapshot?.solarSystem?.capacity],
                                ['Panel Brand', confirmationDetails.confirmation.projectSnapshot?.solarSystem?.panelBrand],
                                ['DCR Panels', confirmationDetails.confirmation.projectSnapshot?.solarSystem?.dcrPanelCount],
                                ['Non-DCR Panels', confirmationDetails.confirmation.projectSnapshot?.solarSystem?.nonDcrPanelCount],
                                ['Inverter Brand', confirmationDetails.confirmation.projectSnapshot?.solarSystem?.inverterBrand],
                                ['Inverter Capacity', confirmationDetails.confirmation.projectSnapshot?.solarSystem?.inverterCapacity],
                                ['Inverter Phase', confirmationDetails.confirmation.projectSnapshot?.solarSystem?.inverterPhase],
                                ['Structure Type', confirmationDetails.confirmation.projectSnapshot?.solarSystem?.structureType],
                                ['Structure Capacity (kW)', confirmationDetails.confirmation.projectSnapshot?.solarSystem?.structureCapacityKw],
                              ].map(([label, value]) => (
                                <div key={String(label)} className="rounded-xl border bg-gray-50 p-3">
                                  <p className="text-xs text-gray-500">{label}</p>
                                  <p className="mt-1 font-semibold text-gray-900">
                                    {value === null || value === undefined || value === ''
                                      ? '—'
                                      : String(value)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4 border-t pt-5">
                            <h4 className="text-base font-bold text-gray-900">
                              Financial Snapshot
                            </h4>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {[
                                ['Project Type', confirmationDetails.confirmation.projectSnapshot?.financial?.projectType],
                                ['Final Cost', confirmationDetails.confirmation.projectSnapshot?.financial?.finalCost],
                                ['Net Amount', confirmationDetails.confirmation.projectSnapshot?.financial?.netAmount],
                                ['Project Cost', confirmationDetails.confirmation.projectSnapshot?.financial?.projectCost],
                                ['Loan Amount', confirmationDetails.confirmation.projectSnapshot?.financial?.loanAmount],
                                ['Subsidy Type', confirmationDetails.confirmation.projectSnapshot?.financial?.subsidyType],
                                ['Subsidy Category', confirmationDetails.confirmation.projectSnapshot?.financial?.subsidyCategory],
                                ['Subsidy Amount', confirmationDetails.confirmation.projectSnapshot?.financial?.subsidyAmount],
                              ].map(([label, value]) => (
                                <div key={String(label)} className="rounded-xl border bg-gray-50 p-3">
                                  <p className="text-xs text-gray-500">{label}</p>
                                  <p className="mt-1 font-semibold text-gray-900">
                                    {value === null || value === undefined || value === ''
                                      ? '—'
                                      : String(value)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                                                    <div className="space-y-4 border-t pt-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="text-base font-bold text-gray-900">
                                Confirmation Event History
                              </h4>

                              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                {confirmationDetails.history.length} events
                              </span>
                            </div>

                            {confirmationDetails.history.length === 0 ? (
                              <p className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-500">
                                No confirmation events recorded yet.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {confirmationDetails.history.map((event) => (
                                  <div
                                    key={event.id}
                                    className="rounded-xl border bg-white p-4"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div>
                                        <p className="font-semibold text-gray-900">
                                          {event.eventType
                                            .replace(/_/g, ' ')
                                            .toLowerCase()
                                            .replace(/\b\w/g, (character) =>
                                              character.toUpperCase(),
                                            )}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-500">
                                          {formatDate(event.createdAt)}
                                        </p>
                                      </div>

                                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                        {event.newStatus || '—'}
                                      </span>
                                    </div>

                                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                                      <div>
                                        <p className="text-xs text-gray-500">
                                          Previous Status
                                        </p>
                                        <p className="font-medium text-gray-800">
                                          {event.previousStatus || '—'}
                                        </p>
                                      </div>

                                      <div>
                                        <p className="text-xs text-gray-500">
                                          New Status
                                        </p>
                                        <p className="font-medium text-gray-800">
                                          {event.newStatus || '—'}
                                        </p>
                                      </div>

                                      <div>
                                        <p className="text-xs text-gray-500">
                                          Customer Response
                                        </p>
                                        <p className="font-medium text-gray-800">
                                          {event.responseText || '—'}
                                        </p>
                                      </div>

                                      <div>
                                        <p className="text-xs text-gray-500">
                                          Performed By (User ID)
                                        </p>
                                        <p className="font-medium text-gray-800">
                                          {event.performedBy ?? 'System / Customer'}
                                        </p>
                                      </div>
                                    </div>

                                    {event.remarks && (
                                      <div className="mt-3 rounded-lg bg-amber-50 p-3">
                                        <p className="text-xs font-semibold text-amber-800">
                                          Remarks
                                        </p>
                                        <p className="mt-1 break-words text-sm text-amber-900">
                                          {event.remarks}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No confirmation record exists for this project.
                        </p>
                      )}
                    </div>
                  )}
              </div>
            </div>
          )}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
            <p className="text-sm text-gray-500">
              Page {confirmationPage} of {Math.max(1, confirmationTotalPages)}
              {' · '}
              {confirmationTotal} total records
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={confirmationLoading || confirmationPage <= 1}
                onClick={() =>
                  setConfirmationPage((current) => Math.max(1, current - 1))
                }
                className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={
                  confirmationLoading ||
                  confirmationPage >= confirmationTotalPages
                }
                onClick={() =>
                  setConfirmationPage((current) => current + 1)
                }
                className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}

            {activeTab === 'messages' && (

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="font-semibold text-gray-900">Message history</h2>
          <p className="mt-1 text-xs text-gray-500">{total} matching records</p>
        </div>
        <form className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={(event) => {
          event.preventDefault(); setPage(1); setSearch(searchInput.trim());
        }}>
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Phone, name, reference or message ID" className={`${selectClass} lg:col-span-2`} />
          <select value={direction} onChange={(e) => { setDirection(e.target.value); setPage(1); }} className={selectClass}>
            <option value="">All directions</option><option value="OUTBOUND">Outbound</option><option value="INBOUND">Inbound</option>
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectClass}>
            <option value="">All statuses</option>
            {statusOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={automationKey} onChange={(e) => { setAutomationKey(e.target.value); setPage(1); }} className={selectClass}>
            <option value="">All automations</option>
            {(overview?.automations || []).map((item) => <option key={item.automationKey} value={item.automationKey}>{item.name}</option>)}
            <option value="CUSTOMER_EXECUTION_RATING">Customer Execution Rating</option>
          </select>
          <div className="flex flex-wrap gap-2 lg:col-span-5">
            <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Search</button>
            <button type="button" className="rounded-xl border px-5 py-2.5 text-sm font-semibold" onClick={() => {
              setSearchInput(''); setSearch(''); setDirection(''); setStatus(''); setAutomationKey(''); setPage(1);
            }}>Clear filters</button>
          </div>
        </form>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr><th className="px-4 py-3">Date (IST)</th><th className="px-4 py-3">Recipient / Sender</th><th className="px-4 py-3">Message</th><th className="px-4 py-3">Automation / Reference</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {messages.map((item) => (
                <tr key={item.id} className="align-top hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-4 text-gray-600">{formatDate(item.createdAt)}</td>
                  <td className="min-w-[230px] px-4 py-4">
  <div className="font-semibold text-gray-900">
    {item.matchedCustomers?.length
      ? item.matchedCustomers
          .map((customer) => customer.customerName || `Customer #${customer.id}`)
          .join(', ')
      : item.matchedProjects?.length
        ? item.matchedProjects
            .map((project) => project.customerName)
            .filter(Boolean)
            .filter((name, index, names) => names.indexOf(name) === index)
            .join(', ') || item.recipientName || item.recipientPhone
        : item.recipientName || item.recipientPhone}
  </div>

  <div className="mt-1 text-xs text-gray-500">
    {item.recipientPhone} · {item.direction}
  </div>

  {(item.matchedCustomers?.length ?? 0) > 0 && (
    <div className="mt-2 flex flex-wrap gap-1">
      {item.matchedCustomers?.map((customer) => (
        <span
          key={customer.id}
          className="rounded-md bg-green-50 px-2 py-1 text-[11px] font-medium text-green-700"
        >
          Customer #{customer.id}
        </span>
      ))}
    </div>
  )}

  {(item.matchedProjects?.length ?? 0) > 0 && (
    <div className="mt-2 space-y-1">
      {item.matchedProjects?.map((project) => (
        <a
          key={project.id}
          href={`/project/${project.id}`}
          className="flex flex-wrap items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50 px-2 py-1.5 text-xs text-blue-800 hover:bg-blue-100"
        >
          <span className="font-semibold">
            Project #{project.id}
          </span>

          <span className="text-blue-600">
            · {project.status.replace(/_/g, ' ')}
          </span>

          <span className="ml-auto text-blue-600">
            View →
          </span>
        </a>
      ))}
    </div>
  )}

  {!item.matchedCustomers?.length &&
    !item.matchedProjects?.length && (
      <div className="mt-2 text-xs text-gray-400">
        No matching CRM customer
      </div>
    )}
</td>
                  <td className="max-w-xs px-4 py-4"><div className="break-words text-gray-800">{item.messageBody || item.templateName || '—'}</div><div className="mt-1 text-xs text-gray-500">{item.messageType}</div>{item.errorMessage && <div className="mt-2 break-words text-xs text-red-600">{item.errorCode ? `${item.errorCode}: ` : ''}{item.errorMessage}</div>}</td>
                  <td className="px-4 py-4 text-xs text-gray-600"><div className="break-all">{item.automationKey || 'Manual / unclassified'}</div><div className="mt-1">{item.referenceType || '—'} {item.referenceId || ''}</div></td>
                  <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}>{item.status}</span></td>
                </tr>
              ))}
              {!loading && messages.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-gray-500">No messages found.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
          <p className="text-sm text-gray-500">Page {page} of {Math.max(1, totalPages)}</p>
          <div className="flex gap-2">
            <button type="button" disabled={loading || page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Previous</button>
            <button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Next</button>
          </div>
              </div>
    </section>
      )}
  </div>
);
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getAuthHeaders } from '@/lib/authHeaders';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

type ReportMode = 'overview' | 'department';

type UserOption = {
  id: number;
  name: string;
  email?: string;
  roles: string[];
};

const departments = [
  { value: 'TELECALLING', label: 'Telecalling' },
  { value: 'TELECALLING_ASSISTANT', label: 'Telecalling Assistant' },
  { value: 'LEADS', label: 'Leads' },
  { value: 'MEETINGS', label: 'Meetings' },
  { value: 'PROJECTS', label: 'Projects' },
  { value: 'CONTRACTORS', label: 'Contractors' },
  { value: 'PAYMENTS', label: 'Payments' },
  { value: 'ACCOUNTS', label: 'Accounts / Expense' },
  { value: 'COMPLAINTS', label: 'Complaints' },
];

const roles = [
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
];

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);

function formatCurrency(value: any) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isMoneyKey(key: string) {
  const normalized = key.toLowerCase();

  if (
    normalized.includes('review') ||
    normalized.includes('calls') ||
    normalized.includes('contacts') ||
    normalized.includes('leads') ||
    normalized.includes('meetings') ||
    normalized.includes('projects') ||
    normalized.includes('complaints') ||
    normalized.includes('assignments') ||
    normalized.includes('converted') ||
    normalized.includes('pending reviews') ||
    normalized.includes('pendingreviews')
  ) {
    return false;
  }

  return (
    normalized.includes('amount') ||
    normalized.includes('expense') ||
    normalized.includes('cost') ||
    normalized.includes('collected') ||
    normalized.includes('payment') ||
    normalized.includes('debit') ||
    normalized.includes('credit') ||
    normalized.includes('receivable') ||
    normalized.includes('value')
  );
}

export default function AnalyticsPage() {
  const [mode, setMode] = useState<ReportMode>('overview');
  const [department, setDepartment] = useState('TELECALLING');
  const [month, setMonth] = useState(thisMonth());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [role, setRole] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userId, setUserId] = useState('');
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);

  const [branchName, setBranchName] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [status, setStatus] = useState('');
  const [projectType, setProjectType] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generatedAt, setGeneratedAt] = useState('');
  const [reportData, setReportData] = useState<any>(null);

  const params = useMemo(() => {
    const p: Record<string, string> = {};

    if (month && !fromDate && !toDate) p.month = month;
    if (fromDate) p.fromDate = fromDate;
    if (toDate) p.toDate = toDate;

    if (mode === 'department') p.department = department;

    if (role) p.role = role;
    if (userId) p.userId = userId;
    if (branchName.trim()) p.branchName = branchName.trim();
    if (city.trim()) p.city = city.trim();
    if (zone.trim()) p.zone = zone.trim();
    if (status.trim()) p.status = status.trim();
    if (projectType.trim()) p.projectType = projectType.trim();
    if (paymentStatus.trim()) p.paymentStatus = paymentStatus.trim();

    return p;
  }, [
    month,
    fromDate,
    toDate,
    mode,
    department,
    role,
    userId,
    branchName,
    city,
    zone,
    status,
    projectType,
    paymentStatus,
  ]);

  useEffect(() => {
    const search = userSearch.trim();

    if (search.length < 2) {
      setUserOptions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setUserSearchLoading(true);

        const res = await axios.get(`${apiBaseUrl}/analytics/users/search`, {
          params: {
            q: search,
            role: role || undefined,
          },
          headers: getAuthHeaders(),
        });

        setUserOptions(Array.isArray(res.data?.users) ? res.data.users : []);
      } catch (error) {
        console.error('Analytics user search failed:', error);
        setUserOptions([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [userSearch, role]);

  const generateReport = async () => {
    try {
      setLoading(true);
      setHasGenerated(true);
      setReportData(null);

      const endpoint =
        mode === 'overview'
          ? `${apiBaseUrl}/analytics/overview`
          : `${apiBaseUrl}/analytics/department-report`;

      const res = await axios.get(endpoint, {
        params,
        headers: getAuthHeaders(),
      });

      setReportData(res.data);
      setGeneratedAt(new Date().toLocaleString('en-IN'));
    } catch (error) {
      console.error('Analytics report failed:', error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const quickToday = () => {
    setMonth('');
    setFromDate(today());
    setToDate(today());
  };

  const quickMonth = () => {
    setMonth(thisMonth());
    setFromDate('');
    setToDate('');
  };

  const quickPreviousMonth = () => {
    const now = new Date();
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setMonth(previous.toISOString().slice(0, 7));
    setFromDate('');
    setToDate('');
  };

  const selectedDepartmentLabel =
    departments.find((item) => item.value === department)?.label || department;

  return (
    <div className="min-h-screen space-y-6 bg-slate-100 p-4 md:p-6">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-950 via-blue-900 to-orange-500 p-6 text-white shadow-xl">
        <h1 className="mt-3 text-3xl font-black md:text-5xl">
          Analytics Control Room
        </h1>
        <p className="mt-3 max-w-4xl text-sm text-slate-100 md:text-base">
          Owner overview, department-wise reports, branch-wise performance and
          user monthly/date-range work analytics from actual CRM data.
        </p>
      </div>

      <div className="rounded-[2rem] bg-white p-4 shadow-lg md:p-5">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button
            onClick={() => {
              setMode('overview');
              setReportData(null);
              setHasGenerated(false);
            }}
            className={`rounded-2xl px-4 py-3 text-left font-black ${
              mode === 'overview'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-800'
            }`}
          >
            Owner Overview
            <span className="block text-xs font-medium opacity-75">
              Overall company control room
            </span>
          </button>

          <button
            onClick={() => {
              setMode('department');
              setReportData(null);
              setHasGenerated(false);
            }}
            className={`rounded-2xl px-4 py-3 text-left font-black ${
              mode === 'department'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-800'
            }`}
          >
            Department Report
            <span className="block text-xs font-medium opacity-75">
              Role-wise working report
            </span>
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={quickToday}
            className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700"
          >
            Today
          </button>
          <button
            onClick={quickMonth}
            className="rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700"
          >
            This Month
          </button>
          <button
            onClick={quickPreviousMonth}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"
          >
            Previous Month
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <input
            type="month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setFromDate('');
              setToDate('');
            }}
            className="rounded-2xl border px-3 py-2"
          />

          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setMonth('');
            }}
            className="rounded-2xl border px-3 py-2"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setMonth('');
            }}
            className="rounded-2xl border px-3 py-2"
          />

          {mode === 'department' && (
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setStatus('');
                setProjectType('');
                setPaymentStatus('');
                setReportData(null);
                setHasGenerated(false);
              }}
              className="rounded-2xl border px-3 py-2"
            >
              {departments.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          )}

          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setUserId('');
              setUserSearch('');
              setUserOptions([]);
            }}
            className="rounded-2xl border px-3 py-2"
          >
            <option value="">All Roles</option>
            {roles.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll('_', ' ')}
              </option>
            ))}
          </select>

          <input
            placeholder="Branch"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            className="rounded-2xl border px-3 py-2"
          />

          <input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-2xl border px-3 py-2"
          />

          <input
            placeholder="Zone"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="rounded-2xl border px-3 py-2"
          />

          {mode === 'department' && department === 'PROJECTS' && (
            <>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="rounded-2xl border px-3 py-2"
              >
                <option value="">All Project Types</option>
                <option value="CASH">Cash</option>
                <option value="LOAN">Loan</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-2xl border px-3 py-2"
              >
                <option value="">All Project Status</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="PROJECT_MANAGEMENT">Project Management</option>
                <option value="SUBSIDY_PROCESS">Subsidy Process</option>
                <option value="ELECTRICITY_PROCESS">Electricity Process</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </>
          )}

          {mode === 'department' && department === 'PAYMENTS' && (
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="rounded-2xl border px-3 py-2"
            >
              <option value="">All Payment Status</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}

          <div className="md:col-span-2">
            <input
              placeholder="Type user name / email / ID"
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserId('');
              }}
              className="mb-2 w-full rounded-2xl border px-3 py-2"
            />

            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2"
            >
              <option value="">
                {userSearchLoading ? 'Searching users...' : 'All users / no user selected'}
              </option>

              {userOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} #{item.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="mt-5 rounded-2xl bg-slate-950 px-6 py-3 font-black text-white shadow hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Generating Report...' : 'Generate Report'}
        </button>

        {hasGenerated && reportData && (
          <button
            onClick={() => window.print()}
            className="ml-3 mt-5 rounded-2xl bg-green-600 px-6 py-3 font-black text-white shadow hover:bg-green-700"
          >
            Print / Save PDF
          </button>
        )}
      </div>

      {!hasGenerated && (
        <div className="rounded-[2rem] border border-dashed bg-white p-8 text-center shadow">
          <h2 className="text-xl font-black text-slate-900">
            Select filters and generate report
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Reports are loaded only on demand to keep database load controlled.
          </p>
        </div>
      )}

      {loading && (
        <div className="rounded-[2rem] bg-white p-8 text-center font-bold text-slate-700 shadow">
          Preparing CRM analytics...
        </div>
      )}

      {!loading && hasGenerated && generatedAt && (
        <div className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow">
          Generated on: {generatedAt}
        </div>
      )}

      {!loading && hasGenerated && reportData && (
        <>
          {mode === 'overview' ? (
            <OverviewReport data={reportData} />
          ) : (
            <DepartmentReport
              departmentLabel={selectedDepartmentLabel}
              data={reportData}
            />
          )}
        </>
      )}

      {!loading && hasGenerated && !reportData && (
        <div className="rounded-[2rem] bg-white p-8 text-center text-sm text-slate-500 shadow">
          No records found for the selected filters. Try changing the date range or filters.
        </div>
      )}
    </div>
  );
}

function OverviewReport({ data }: { data: any }) {
  const cards = data.cards || {};
  const charts = data.charts || {};

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Owner Overview"
        subtitle="Company-wide business health for selected filters."
      />

      <CardGrid
        cards={[
          ['Contacts', cards.totalContacts],
          ['Calls', cards.totalCalls],
          ['Leads', cards.totalLeads],
          ['Meetings', cards.totalMeetings],
          ['Projects', cards.totalProjects],
          ['Collected', cards.collectedAmount],
          ['Pending Payment', cards.pendingAmount],
          ['Expenses', cards.expenseAmount],
          ['Customer Complaints', cards.customerComplaints],
          ['Dealer Complaints', cards.dealerComplaints],
          ['Contractor Assignments', cards.contractorAssignments],
          ['Cleaning Assignments', cards.cleaningAssignments],
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <LineBox title="Contacts Trend" data={charts.contactsTrend || []} />
        <LineBox title="Calls Trend" data={charts.callsTrend || []} />
        <LineBox title="Leads Trend" data={charts.leadsTrend || []} />
        <LineBox title="Meetings Trend" data={charts.meetingsTrend || []} />
        <LineBox title="Projects Trend" data={charts.projectsTrend || []} />
      </div>
    </div>
  );
}

function DepartmentReport({
  departmentLabel,
  data,
}: {
  departmentLabel: string;
  data: any;
}) {
  const cards = data.cards || {};
  const charts = data.charts || {};
  const rows = data.rows || [];

  return (
    <div className="space-y-6">
      <SectionTitle
        title={`${departmentLabel} Report`}
        subtitle="This report is generated from actual CRM activity for the selected filters and date range."
      />

      <CardGrid cards={Object.entries(cards).map(([key, value]) => [formatLabel(key), value]) as any} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
  {Object.entries(charts).map(([key, value]: any) => (
    <ChartBox key={key} chartKey={key} chart={value} />
  ))}
</div>

      {rows.length > 0 && (
        <SmartTable title={getPerformanceTableTitle(departmentLabel)} rows={rows} />
      )}

      <ReportFooter />
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-5 shadow">
      <h2 className="text-2xl font-black text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function ReportFooter() {
  return (
    <div className="rounded-[2rem] bg-white p-5 text-xs font-semibold text-slate-500 shadow">
      <div className="border-t pt-4">
        Generated from Solar CRM ERP
      </div>
    </div>
  );
}

function CardGrid({ cards }: { cards: [string, any][] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
      {cards.map(([label, value]) => {
        const money = isMoneyKey(label);

        return (
          <div
            key={label}
            className="rounded-[1.5rem] bg-white p-5 shadow transition hover:-translate-y-1 hover:shadow-xl"
          >
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {money ? formatCurrency(value) : value ?? 0}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function LineBox({ title, data }: { title: string; data: any[] }) {
  return (
    <div className="rounded-[2rem] bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-black text-slate-900">{title}</h2>

      {data.length === 0 ? (
        <p className="text-sm text-slate-500">No trend data available.</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ChartBox({ chartKey, chart }: { chartKey: string; chart: any }) {
  if (Array.isArray(chart)) {
    return <LineBox title={formatLabel(chartKey)} data={chart} />;
  }

  const type = chart?.type || 'bar';
  const title = chart?.title || formatLabel(chartKey);
  const data = Array.isArray(chart?.data) ? chart.data : [];

  if (type === 'line') {
    return <LineBox title={title} data={data} />;
  }

  if (type === 'funnel') {
    return (
      <div className="rounded-[2rem] bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-black text-slate-900">{title}</h2>

        {data.length === 0 ? (
          <p className="text-sm text-slate-500">No funnel data available.</p>
        ) : (
          <div className="space-y-4">
            {data.map((item: any, index: number) => {
              const maxValue = Number(data[0]?.value || 1);
              const width = Math.max(
                8,
                Math.min(100, Math.round((Number(item.value || 0) / maxValue) * 100)),
              );

              return (
                <div key={`${item.label}-${index}`}>
                  <div className="mb-1 flex justify-between text-sm font-bold text-slate-700">
                    <span>{item.label}</span>
                    <span>{item.value ?? 0}</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-orange-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  {item.percent !== undefined && (
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Conversion: {item.percent}%
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return <BarBox title={title} data={data} />;
}

function BarBox({ title, data }: { title: string; data: any[] }) {
  return (
    <div className="rounded-[2rem] bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-black text-slate-900">{title}</h2>

      {data.length === 0 ? (
        <p className="text-sm text-slate-500">No chart data available.</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function getPerformanceTableTitle(departmentLabel: string) {
  const label = departmentLabel.toLowerCase();

  if (label.includes('telecalling assistant')) return 'Assistant Performance';
  if (label.includes('telecalling')) return 'Telecaller Performance';
  if (label.includes('lead')) return 'Lead Manager Performance';
  if (label.includes('meeting')) return 'Meeting Manager Performance';

  return `${departmentLabel} Performance`;
}

function SmartTable({ title, rows }: { title: string; rows: any[] }) {
  const columns = Object.keys(rows[0] || {});

  return (
    <div className="overflow-hidden rounded-[2rem] bg-white shadow">
      <div className="border-b p-5">
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3">
                  {formatLabel(column)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t">
                {columns.map((column) => (
                  <td key={column} className="px-4 py-3">
                    {isMoneyKey(column)
                      ? formatCurrency(row[column])
                      : row[column] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
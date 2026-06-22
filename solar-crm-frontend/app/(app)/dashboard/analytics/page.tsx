'use client';

import { useMemo, useState } from 'react';
import axios from 'axios';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getAuthHeaders } from '@/lib/authHeaders';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

type TabKey =
  | 'overview'
  | 'telecalling'
  | 'telecalling-assistant'
  | 'leads'
  | 'meetings'
  | 'projects'
  | 'payments'
  | 'conversions'
  | 'users'
  | 'activity-stream';

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'telecalling', label: 'Telecalling', icon: '☎️' },
  { key: 'telecalling-assistant', label: 'Assistant', icon: '🎧' },
  { key: 'leads', label: 'Leads', icon: '🔥' },
  { key: 'meetings', label: 'Meetings', icon: '📅' },
  { key: 'projects', label: 'Projects', icon: '🏗️' },
  { key: 'payments', label: 'Payments', icon: '💰' },
  { key: 'conversions', label: 'Conversions', icon: '🚀' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'activity-stream', label: 'Live Stream', icon: '⚡' },
];

const COLORS = [
  '#2563eb',
  '#16a34a',
  '#f97316',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#ca8a04',
  '#db2777',
];

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [month, setMonth] = useState(thisMonth());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('');
  const [branchName, setBranchName] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const params = useMemo(() => {
    const p: Record<string, string> = {};

    if (month && !fromDate && !toDate) p.month = month;
    if (fromDate) p.fromDate = fromDate;
    if (toDate) p.toDate = toDate;
    if (userId.trim()) p.userId = userId.trim();
    if (role.trim()) p.role = role.trim();
    if (branchName.trim()) p.branchName = branchName.trim();
    if (city.trim()) p.city = city.trim();
    if (zone.trim()) p.zone = zone.trim();

    return p;
  }, [month, fromDate, toDate, userId, role, branchName, city, zone]);

  const generateReport = async () => {
    try {
      setLoading(true);
      setHasGenerated(true);
      setReportData(null);

      const res = await axios.get(`${apiBaseUrl}/analytics/${activeTab}`, {
        params,
        headers: getAuthHeaders(),
      });

      setReportData(res.data);
    } catch (error) {
      console.error('Analytics report error:', error);
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

  return (
    <div className="min-h-screen space-y-6 bg-slate-100 p-4 md:p-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-orange-500 p-6 text-white shadow-xl">
        <p className="text-sm font-medium uppercase tracking-wider text-blue-100">
          Aditya Solars CRM / ERP
        </p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">
          Analytics & Reports
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-blue-50 md:text-base">
          Detailed filtered reporting for telecalling, leads, meetings,
          projects, payments, conversions and user-wise performance.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-lg md:p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={quickToday}
            className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
          >
            Today
          </button>
          <button
            onClick={quickMonth}
            className="rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700"
          >
            This Month
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-8">
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

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-2xl border px-3 py-2"
          >
            <option value="">All Roles</option>
            <option value="TELECALLER">Telecaller</option>
            <option value="TELECALLING_ASSISTANT">Telecalling Assistant</option>
            <option value="TELECALLING_MANAGER">Telecalling Manager</option>
            <option value="LEAD_MANAGER">Lead Manager</option>
            <option value="MEETING_MANAGER">Meeting Manager</option>
            <option value="PROJECT_MANAGER">Project Manager</option>
            <option value="PAYMENT_MANAGER">Payment Manager</option>
            <option value="ACCOUNT_MANAGER">Account Manager</option>
          </select>

          <input
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="rounded-2xl border px-3 py-2"
          />

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
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="mt-4 rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white shadow hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setReportData(null);
              setHasGenerated(false);
            }}
            className={`whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-bold shadow ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {!hasGenerated && (
        <div className="rounded-3xl border border-dashed bg-white p-8 text-center shadow">
          <h2 className="text-xl font-bold text-slate-900">
            Select filters and generate report
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            This page loads only the selected report tab to keep backend and
            database safe.
          </p>
        </div>
      )}

      {loading && (
        <div className="rounded-3xl bg-white p-8 text-center font-semibold shadow">
          Preparing analytics report...
        </div>
      )}

      {!loading && hasGenerated && (
        <ReportRenderer activeTab={activeTab} data={reportData} />
      )}
    </div>
  );
}

function ReportRenderer({ activeTab, data }: { activeTab: TabKey; data: any }) {
  if (!data) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center text-sm text-slate-500 shadow">
        No report data available.
      </div>
    );
  }

  if (activeTab === 'overview') return <OverviewReport data={data} />;
  if (activeTab === 'telecalling') return <TelecallingReport data={data} />;
  if (activeTab === 'telecalling-assistant')
    return <AssistantReport data={data} />;
  if (activeTab === 'leads') return <LeadsReport data={data} />;
  if (activeTab === 'meetings') return <MeetingsReport data={data} />;
  if (activeTab === 'projects') return <ProjectsReport data={data} />;
  if (activeTab === 'payments') return <PaymentsReport data={data} />;
  if (activeTab === 'conversions') return <ConversionsReport data={data} />;
  if (activeTab === 'users') return <UsersReport data={data} />;
  if (activeTab === 'activity-stream') return <ActivityStream data={data} />;

  return null;
}

function OverviewReport({ data }: { data: any }) {
  const cards = data.cards || {};

  return (
    <div className="space-y-6">
      <CardGrid
        items={[
          ['Contacts', cards.totalContacts],
          ['Calls', cards.totalCalls],
          ['Leads', cards.totalLeads],
          ['Meetings', cards.totalMeetings],
          ['Projects', cards.totalProjects],
          ['Payment Amount', cards.totalPaymentAmount],
          ['Collected', cards.totalCollectedAmount],
          ['Pending', cards.totalPendingAmount],
        ]}
      />
    </div>
  );
}

function TelecallingReport({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <PieBox title="Calls by Status" data={data.callsByStatus || []} />
      <BarBox title="Reviews by Status" data={data.reviewsByStatus || []} />
      <TableBox
        title="Telecaller-wise Report"
        rows={data.userWise || []}
        columns={[
          ['userId', 'User ID'],
          ['totalCalls', 'Calls'],
          ['connectedCalls', 'Connected'],
          ['cnrCalls', 'CNR'],
          ['callbackCalls', 'Callback'],
          ['interestedCalls', 'Interested'],
        ]}
      />
    </div>
  );
}

function AssistantReport({ data }: { data: any }) {
  const cards = data.cards || {};

  return (
    <div className="space-y-6">
      <CardGrid
        items={[
          ['Assigned Reviews', cards.assignedReviews],
          ['Pending Reviews', cards.pendingReviews],
          ['Potential', cards.potentialReviews],
          ['Converted', cards.convertedReviews],
          ['Rejected', cards.rejectedReviews],
        ]}
      />

      <TableBox
        title="Telecalling Assistant-wise Report"
        rows={data.assistantWise || []}
        columns={[
          ['assistantName', 'Assistant'],
          ['assignedReviews', 'Assigned'],
          ['reviewed', 'Reviewed'],
          ['pending', 'Pending'],
          ['potential', 'Potential'],
          ['converted', 'Converted'],
          ['rejected', 'Rejected'],
        ]}
      />
    </div>
  );
}

function LeadsReport({ data }: { data: any }) {
  const cards = data.cards || {};

  return (
    <div className="space-y-6">
      <CardGrid
        items={[
          ['Total Leads', cards.totalLeads],
          ['New', cards.newLeads],
          ['Interested', cards.interestedLeads],
          ['Won', cards.wonLeads],
          ['Lost', cards.lostLeads],
          ['High Potential', cards.highPotential],
          ['Medium Potential', cards.mediumPotential],
          ['Low Potential', cards.lowPotential],
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PieBox title="Leads by Status" data={data.byStatus || []} />
        <BarBox title="Leads by Potential" data={data.byPotential || []} />
      </div>

      <TableBox
        title="User-wise Lead Report"
        rows={data.userWise || []}
        columns={[
          ['userId', 'User ID'],
          ['totalLeads', 'Total'],
          ['highPotential', 'High'],
          ['mediumPotential', 'Medium'],
          ['lowPotential', 'Low'],
        ]}
      />
    </div>
  );
}

function MeetingsReport({ data }: { data: any }) {
  const cards = data.cards || {};

  return (
    <div className="space-y-6">
      <CardGrid
        items={[
          ['Total Meetings', cards.totalMeetings],
          ['Scheduled', cards.scheduled],
          ['Completed', cards.completed],
          ['Rescheduled', cards.rescheduled],
          ['Cancelled', cards.cancelled],
          ['On Hold', cards.onHold],
          ['No Show', cards.noShow],
          ['CNR', cards.cnr],
          ['Converted Project', cards.convertedToProject],
          ['Site Visits', cards.siteVisits],
          ['Company', cards.companyMeetings],
          ['Self', cards.selfMeetings],
          ['SolarMiter', cards.solarMiterMeetings],
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <PieBox title="Meeting Status" data={data.byStatus || []} />
        <BarBox title="Meeting Type" data={data.byType || []} />
        <BarBox title="Meeting Category" data={data.byCategory || []} />
      </div>

      <TableBox
        title="Manager-wise Meeting Report"
        rows={data.managerWise || []}
        columns={[
          ['name', 'Manager'],
          ['totalMeetings', 'Total'],
          ['completedMeetings', 'Completed'],
          ['convertedMeetings', 'Converted'],
        ]}
      />
    </div>
  );
}

function ProjectsReport({ data }: { data: any }) {
  const cards = data.cards || {};

  return (
    <div className="space-y-6">
      <CardGrid
        items={[
          ['Cash Projects', cards.cashProjects],
          ['Loan Projects', cards.loanProjects],
          ['Cash Cancelled / Rejected', cards.cashCancelledRejected],
          ['Loan Cancelled / Rejected', cards.loanCancelledRejected],
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PieBox title="Projects by Type" data={data.byType || []} />
        <BarBox title="Projects by Status" data={data.byStatus || []} />
      </div>
    </div>
  );
}

function PaymentsReport({ data }: { data: any }) {
  const cards = data.cards || {};

  return (
    <div className="space-y-6">
      <CardGrid
        items={[
          ['Total Amount', cards.totalAmount],
          ['Collected', cards.paidAmount],
          ['Pending', cards.pendingAmount],
          ['Collection %', `${cards.collectionPercent || 0}%`],
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PieBox title="Payment Status" data={data.byStatus || []} />
        <TableBox
          title="Collector-wise Payment Report"
          rows={data.collectorWise || []}
          columns={[
            ['name', 'Collector'],
            ['paidAmount', 'Collected'],
            ['pendingAmount', 'Pending'],
          ]}
        />
      </div>
    </div>
  );
}

function ConversionsReport({ data }: { data: any }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <h2 className="mb-5 text-xl font-black text-slate-900">
        Conversion Funnel
      </h2>

      <div className="space-y-4">
        {(data.funnel || []).map((item: any, index: number) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between text-sm font-semibold">
              <span>{item.label}</span>
              <span>
                {item.value} {index > 0 ? `• ${item.conversionPercent}%` : ''}
              </span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-orange-500"
                style={{
                  width: `${Math.min(
                    index === 0 ? 100 : item.conversionPercent || 0,
                    100,
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersReport({ data }: { data: any }) {
  return (
    <TableBox
      title="User-wise Complete Report"
      rows={data.users || []}
      columns={[
        ['name', 'User'],
        ['roles', 'Roles'],
        ['totalCalls', 'Calls'],
        ['totalLeads', 'Leads'],
        ['totalMeetings', 'Meetings'],
        ['totalProjects', 'Projects'],
        ['collectedAmount', 'Collected'],
        ['pendingAmount', 'Pending'],
      ]}
    />
  );
}

function ActivityStream({ data }: { data: any }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <h2 className="mb-5 text-xl font-black text-slate-900">
        Live Activity Stream
      </h2>

      <div className="space-y-3">
        {(data.stream || []).map((item: any, index: number) => (
          <div
            key={`${item.type}-${item.id}-${index}`}
            className="rounded-2xl border bg-slate-50 p-4"
          >
            <p className="text-xs font-bold uppercase text-blue-600">
              {item.type}
            </p>
            <p className="font-bold text-slate-900">{item.title}</p>
            <p className="text-sm text-slate-500">{item.subtitle}</p>
            <p className="mt-1 text-xs text-slate-400">
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
            </p>
          </div>
        ))}

        {(data.stream || []).length === 0 && (
          <p className="text-sm text-slate-500">No recent activity found.</p>
        )}
      </div>
    </div>
  );
}

function CardGrid({ items }: { items: [string, any][] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
      {items.map(([title, value]) => (
        <div
          key={title}
          className="rounded-3xl bg-white p-5 shadow transition hover:-translate-y-1 hover:shadow-xl"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {value ?? 0}
          </p>
        </div>
      ))}
    </div>
  );
}

function PieBox({ title, data }: { title: string; data: any[] }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-black text-slate-900">{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm text-slate-500">No data available</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" outerRadius={95}>
                {data.map((_: any, index: number) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function BarBox({ title, data }: { title: string; data: any[] }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-black text-slate-900">{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm text-slate-500">No data available</p>
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

function TableBox({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: any[];
  columns: [string, string][];
}) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow xl:col-span-2">
      <div className="border-b p-5">
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              {columns.map(([key, label]) => (
                <th key={key} className="px-4 py-3">
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-6 text-center text-slate-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className="border-t">
                  {columns.map(([key]) => (
                    <td key={key} className="px-4 py-3">
                      {Array.isArray(row[key])
                        ? row[key].join(', ')
                        : row[key] ?? 0}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
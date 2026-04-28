'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { getAuthHeaders } from '@/lib/authHeaders';

type Summary = {
  totalLeads: number;
  newLeads: number;
  interestedLeads: number;
  neverCalledCount: number;
  callbackCount: number;
  todayFollowUps: number;
  overdueFollowUps: number;
  totalContacts: number;
  calledContacts: number;
};

type ContactsSummary = {
  totalContacts: number;
  filteredContacts: number;
};

type OwnerSummary = {
  callsToday: number;
  interestedToday: number;
  leadsToday: number;
  meetingsToday: number;
  siteVisitsToday: number;
  totalMeetings: number;
};

type PerformanceItem = {
  telecallerId: string;
  totalCalls: string;
  interested: string;
};

type MeetingManagerAnalyticsItem = {
  managerId: number | null;
  managerName: string;
  totalMeetings: number;
  companyMeetings: number;
  selfMeetings: number;
  convertedMeetings: number;
};

type HotLead = {
  id: number;
  name: string;
  phone: string;
  status: string;
};

type ChartPoint = {
  label: string;
  value: number;
};

type DashboardCharts = {
  contactsByZone: ChartPoint[];
  contactsByCity: ChartPoint[];
  contactsByTelecaller: ChartPoint[];
  calledContactsByStatus: ChartPoint[];
  calledContactsByMonth: ChartPoint[];
};

type StoredUser = {
  id: number;
  name?: string;
  role?: string;
  roles?: string[];
};

type TelecallerOption = {
  id: number;
  name: string;
  email?: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PIE_COLORS = [
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#ca8a04',
  '#7c3aed',
  '#0891b2',
  '#ea580c',
  '#db2777',
];

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
const [contactsSummary, setContactsSummary] = useState<ContactsSummary | null>(null);
const [ownerSummary, setOwnerSummary] = useState<OwnerSummary | null>(null);
const [performance, setPerformance] = useState<PerformanceItem[]>([]);
  const [meetingAnalytics, setMeetingAnalytics] = useState<MeetingManagerAnalyticsItem[]>([]);
  const [hotLeads, setHotLeads] = useState<HotLead[]>([]);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [telecallers, setTelecallers] = useState<TelecallerOption[]>([]);

  const [zoneFilter, setZoneFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [telecallerFilter, setTelecallerFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');

  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
      }
    }
  }, []);

    useEffect(() => {
    if (!currentUser) return;

    if (!monthFilter && !fromDateFilter && !toDateFilter) {
      const today = getTodayDateString();
      setFromDateFilter(today);
      setToDateFilter(today);
    }
  }, [currentUser, monthFilter, fromDateFilter, toDateFilter]);

  const userRoles = useMemo(() => {
    if (Array.isArray(currentUser?.roles)) return currentUser.roles;
    if (currentUser?.role) return [currentUser.role];
    return [];
  }, [currentUser]);

  const isTelecaller = userRoles.includes('TELECALLER');
  const canChooseTelecaller =
    userRoles.includes('OWNER') || userRoles.includes('TELECALLING_MANAGER');

  const buildParams = () => {
    const params: Record<string, string | number> = {};

    if (isTelecaller && currentUser?.id) {
      params.assignedTo = currentUser.id;
    } else if (telecallerFilter.trim()) {
      params.assignedTo = telecallerFilter.trim();
    }

    if (zoneFilter.trim()) params.zone = zoneFilter.trim();
    if (cityFilter.trim()) params.city = cityFilter.trim();
    if (monthFilter.trim()) params.month = monthFilter.trim();
    if (fromDateFilter.trim()) params.fromDate = fromDateFilter.trim();
    if (toDateFilter.trim()) params.toDate = toDateFilter.trim();

    return params;
  };
        const fetchTelecallers = async () => {
    setTelecallers([]);
  };

  const fetchDashboardData = async () => {
    if (dashboardLoading) return; 
    try {
      setDashboardLoading(true);

      const params = buildParams();

      const [summaryRes, performanceRes, hotLeadsRes, chartsRes, meetingAnalyticsRes] =
  await Promise.allSettled([
    axios.get(`${apiBaseUrl}/dashboard/summary`, {
      params,
      headers: getAuthHeaders(),
    }),
    axios.get(`${apiBaseUrl}/telecalling/performance/today`, {
      headers: getAuthHeaders(),
    }),
    axios.get(`${apiBaseUrl}/leads/hot`, {
      headers: getAuthHeaders(),
    }),
    axios.get(`${apiBaseUrl}/dashboard/charts`, {
      params,
      headers: getAuthHeaders(),
    }),
    axios.get(`${apiBaseUrl}/dashboard/meeting-manager-analytics`, {
      headers: getAuthHeaders(),
    }),
  ]);

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value.data);
      } else {
        setSummary(null);
      }

      if (performanceRes.status === 'fulfilled') {
        setPerformance(
          Array.isArray(performanceRes.value.data) ? performanceRes.value.data : [],
        );
      } else {
        setPerformance([]);
      }

      if (hotLeadsRes.status === 'fulfilled') {
        setHotLeads(
          Array.isArray(hotLeadsRes.value.data) ? hotLeadsRes.value.data : [],
        );
      } else {
        setHotLeads([]);
      }

      if (chartsRes.status === 'fulfilled') {
        setCharts(chartsRes.value.data || null);
      } else {
        setCharts(null);
      }
 if (meetingAnalyticsRes.status === 'fulfilled') {
  setMeetingAnalytics(
    Array.isArray(meetingAnalyticsRes.value.data)
      ? meetingAnalyticsRes.value.data
      : [],
  );
} else {
  setMeetingAnalytics([]);
}

    } catch (error) {
      console.error('Dashboard error:', error);
      setSummary(null);
      setPerformance([]);
      setHotLeads([]);
      setCharts(null);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchOwnerSummary = async () => {
  if (!userRoles.includes('OWNER')) {
    setOwnerSummary(null);
    return;
  }

  try {
    const res = await axios.get(`${apiBaseUrl}/dashboard/owner-summary`, {
      headers: getAuthHeaders(),
    });

    setOwnerSummary(res.data || null);
  } catch (error) {
    console.error('Owner summary error:', error);
    setOwnerSummary(null);
  }
};

  const fetchContactsSummary = async () => {
    if (contactsLoading) return;
    try {
      setContactsLoading(true);

      const params = buildParams();

      const res = await axios.get(`${apiBaseUrl}/dashboard/contacts-summary`, {
        params,
        headers: getAuthHeaders(),
      });

      setContactsSummary(res.data);
    } catch (error) {
      console.error('Contacts summary error:', error);
      setContactsSummary(null);
    } finally {
      setContactsLoading(false);
    }
  };

  useEffect(() => {
  if (!currentUser) return;
  fetchTelecallers();
  fetchDashboardData();
  fetchContactsSummary();

  if (userRoles.includes('OWNER')) {
    fetchOwnerSummary();
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentUser, canChooseTelecaller]);

    useEffect(() => {
    if (!currentUser) return;

    const interval = window.setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

    useEffect(() => {
    if (!currentUser) return;

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 5, 0);

    const timeoutMs = nextMidnight.getTime() - now.getTime();

    const timer = window.setTimeout(() => {
      const today = getTodayDateString();

      // Only auto-roll the dashboard forward when it is in single-day mode.
      if (!monthFilter && fromDateFilter && toDateFilter && fromDateFilter === toDateFilter) {
        setFromDateFilter(today);
        setToDateFilter(today);

        setTimeout(() => {
          fetchDashboardData();
          fetchContactsSummary();
        }, 0);
      }
    }, timeoutMs);

    return () => window.clearTimeout(timer);
  }, [currentUser, monthFilter, fromDateFilter, toDateFilter]);

  const handleApplyFilters = async () => {
    await Promise.all([fetchDashboardData(), fetchContactsSummary()]);
  };

    const handleClearFilters = async () => {
    const today = getTodayDateString();

    setZoneFilter('');
    setCityFilter('');
    setTelecallerFilter('');
    setMonthFilter('');
    setFromDateFilter(today);
    setToDateFilter(today);

    setTimeout(() => {
      fetchDashboardData();
      fetchContactsSummary();
    }, 0);
  };

    const conversionPercentage =
    summary && summary.totalLeads > 0
      ? Math.round((summary.interestedLeads / summary.totalLeads) * 100)
      : 0;

    const getTelecallerName = (item: any) => {
    return item?.telecallerName || `User ${item?.telecallerId || ''}`;
  };

  if (!summary && dashboardLoading) {
    return <div className="p-4 md:p-6">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 bg-gray-50 p-4 md:p-6">
      {ownerSummary && userRoles.includes('OWNER') && (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
    <SimpleCard title="Today Calls" value={ownerSummary.callsToday || 0} />
    <SimpleCard title="Today Interested" value={ownerSummary.interestedToday || 0} />
    <SimpleCard title="Today Leads" value={ownerSummary.leadsToday || 0} />
    <SimpleCard title="Today Meetings" value={ownerSummary.meetingsToday || 0} />
    <SimpleCard title="Today Site Visits" value={ownerSummary.siteVisitsToday || 0} />
    <SimpleCard title="Total Meetings" value={ownerSummary.totalMeetings || 0} />
  </div>
)}
      <div className="rounded-2xl bg-white p-4 shadow md:p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Zone-wise, city-wise, telecaller-wise analytics
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <input
            type="text"
            placeholder="Zone"
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2"
          />

          <input
            type="text"
            placeholder="City / district / area / location"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2"
          />

          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2"
          />

          <input
            type="date"
            value={fromDateFilter}
            onChange={(e) => setFromDateFilter(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2"
          />

          <input
            type="date"
            value={toDateFilter}
            onChange={(e) => setToDateFilter(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2"
          />

          {canChooseTelecaller ? (
            <select
              value={telecallerFilter}
              onChange={(e) => setTelecallerFilter(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2"
            >
              <option value="">All Telecallers</option>
                            {telecallers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={currentUser?.name || 'My data only'}
              disabled
              className="rounded-xl border border-gray-300 bg-gray-100 px-3 py-2"
            />
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 md:flex-row">
          <button
            onClick={handleApplyFilters}
            className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white"
          >
            Apply Filters
          </button>

          <button
            onClick={handleClearFilters}
            className="rounded-xl bg-gray-200 px-4 py-2 font-medium text-gray-800"
          >
            Clear Filters
          </button>
        </div>
      </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <ColorCard title="Total Leads" value={summary?.totalLeads || 0} bg="bg-blue-500" />
        <ColorCard title="New Leads" value={summary?.newLeads || 0} bg="bg-cyan-500" />
        <ColorCard
          title="Interested Leads"
          value={summary?.interestedLeads || 0}
          bg="bg-green-500"
        />
        <ColorCard
          title="Never Called"
          value={summary?.neverCalledCount || 0}
          bg="bg-orange-500"
        />
        <ColorCard
          title="Callbacks"
          value={summary?.callbackCount || 0}
          bg="bg-yellow-500"
        />
        <ColorCard
          title="Today Follow-ups"
          value={summary?.todayFollowUps || 0}
          bg="bg-indigo-500"
        />
        <ColorCard
          title="Overdue Follow-ups"
          value={summary?.overdueFollowUps || 0}
          bg="bg-red-500"
        />
        <ColorCard
          title="Total Contacts"
          value={summary?.totalContacts || 0}
          bg="bg-purple-500"
        />
        <ColorCard
          title="Called Contacts"
          value={summary?.calledContacts || 0}
          bg="bg-pink-500"
        />

        <div className="rounded-xl bg-emerald-500 p-4 text-white shadow">
          <h2 className="text-sm">Conversion %</h2>
          <p className="text-2xl font-bold">{conversionPercentage}%</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow md:p-6">
        <h2 className="mb-4 text-xl font-bold">📂 Contacts Overview</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SimpleCard
            title="Total Contacts Added Till Date"
            value={contactsSummary?.totalContacts || 0}
          />
          <SimpleCard
            title="Filtered Contacts"
            value={contactsSummary?.filteredContacts || 0}
          />
        </div>

        {userRoles.includes('OWNER') && (
  <div className="rounded-2xl bg-white p-4 shadow md:p-6">
    <h2 className="mb-4 text-xl font-bold">📅 Meeting Manager Analytics</h2>

    {meetingAnalytics.length === 0 ? (
      <div className="text-sm text-gray-500">
        No meeting manager analytics available
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {meetingAnalytics.map((item) => (
          <div
            key={`${item.managerId || 'unassigned'}-${item.managerName}`}
            className="rounded-xl border bg-gray-50 p-4"
          >
            <p className="mb-2 font-semibold text-gray-900">
              {item.managerName}
            </p>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded bg-white p-2">
                <p className="text-gray-500">Total</p>
                <p className="text-lg font-bold">{item.totalMeetings}</p>
              </div>

              <div className="rounded bg-white p-2">
                <p className="text-gray-500">Converted</p>
                <p className="text-lg font-bold text-green-600">
                  {item.convertedMeetings}
                </p>
              </div>

              <div className="rounded bg-white p-2">
                <p className="text-gray-500">Company</p>
                <p className="text-lg font-bold">{item.companyMeetings}</p>
              </div>

              <div className="rounded bg-white p-2">
                <p className="text-gray-500">Self</p>
                <p className="text-lg font-bold">{item.selfMeetings}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

        {contactsLoading && (
          <p className="mt-3 text-sm text-gray-500">Updating contact summary...</p>
        )}
      </div>

      {charts && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <PieChartCard title="📍 Contacts by Zone" data={charts.contactsByZone} />
          <BarChartCard title="🏙️ Contacts by City" data={charts.contactsByCity} />
          <BarChartCard
            title="👤 Contacts by Telecaller"
            data={charts.contactsByTelecaller}
          />
          <PieChartCard
            title="📞 Called Contacts by Status"
            data={charts.calledContactsByStatus}
          />
          <div className="xl:col-span-2">
            <LineChartCard
              title="📅 Calls by Month"
              data={charts.calledContactsByMonth}
            />
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-xl font-bold">📞 Telecaller Performance</h2>

        {performance.length === 0 ? (
          <div className="rounded-xl bg-white p-4 shadow">
            No telecaller performance data yet
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {performance.map((p) => (
              <div key={p.telecallerId} className="rounded-xl bg-white p-4 shadow">
                <p className="font-semibold">{getTelecallerName(p)}</p>
                <p>Total Calls: {p.totalCalls}</p>
                <p>Interested: {p.interested}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-xl font-bold">🔥 Hot Leads</h2>

        {hotLeads.length === 0 ? (
          <div className="rounded-xl bg-white p-4 shadow">No hot leads yet</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {hotLeads.map((lead) => (
              <div key={lead.id} className="rounded-xl bg-white p-4 shadow">
                <p className="font-semibold">{lead.name}</p>
                <p>{lead.phone}</p>
                <p className="text-sm text-gray-500">{lead.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">📊 Lead Funnel</h2>

        <div className="space-y-2">
          <p>New → {summary?.newLeads || 0}</p>
          <p>Interested → {summary?.interestedLeads || 0}</p>
          <p>Callbacks → {summary?.callbackCount || 0}</p>
          <p>Called Contacts → {summary?.calledContacts || 0}</p>
        </div>
      </div>
    </div>
  );
}
function SimpleCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <h2 className="text-sm text-gray-500">{title}</h2>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function ColorCard({
  title,
  value,
  bg,
}: {
  title: string;
  value: number;
  bg: string;
}) {
  return (
    <div className={`rounded-xl p-4 text-white shadow ${bg}`}>
      <h2 className="text-sm">{title}</h2>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function PieChartCard({
  title,
  data,
}: {
  title: string;
  data: ChartPoint[];
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow md:p-6">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>

      {data.length === 0 ? (
        <div className="text-sm text-gray-500">No data available</div>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                outerRadius={110}
                innerRadius={55}
                label
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function BarChartCard({
  title,
  data,
}: {
  title: string;
  data: ChartPoint[];
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow md:p-6">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>

      {data.length === 0 ? (
        <div className="text-sm text-gray-500">No data available</div>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" angle={-20} textAnchor="end" interval={0} height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function LineChartCard({
  title,
  data,
}: {
  title: string;
  data: ChartPoint[];
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow md:p-6">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>

      {data.length === 0 ? (
        <div className="text-sm text-gray-500">No data available</div>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#16a34a"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

type Summary = {
  totalLeads: number;
  newLeads: number;
  interestedLeads: number;
  neverCalledCount: number;
  callbackCount: number;
  todayFollowUps: number;
  overdueFollowUps: number;
};

type ContactsSummary = {
  totalContacts: number;
  filteredContacts: number;
};

type PerformanceItem = {
  telecallerId: string;
  totalCalls: string;
  interested: string;
};

type HotLead = {
  id: number;
  name: string;
  phone: string;
  status: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [contactsSummary, setContactsSummary] = useState<ContactsSummary | null>(null);
  const [performance, setPerformance] = useState<PerformanceItem[]>([]);
  const [hotLeads, setHotLeads] = useState<HotLead[]>([]);
  const [cityFilter, setCityFilter] = useState('');
  const [contactsLoading, setContactsLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchContactsSummary('');
  }, []);

  const fetchDashboardData = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      let user = null;

      if (storedUser) {
        user = JSON.parse(storedUser);
      }

      const params: any = {};

      if (user?.role === 'TELECALLER') {
        params.assignedTo = user.id;
      }

      const [summaryRes, performanceRes, hotLeadsRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/dashboard/summary`, {
          params,
          headers: getAuthHeaders(),
        }),
        axios.get(`${apiBaseUrl}/telecalling/performance`, {
          headers: getAuthHeaders(),
        }),
        axios.get(`${apiBaseUrl}/leads/hot`, {
          headers: getAuthHeaders(),
        }),
      ]);

      setSummary(summaryRes.data);
      setPerformance(Array.isArray(performanceRes.data) ? performanceRes.data : []);
      setHotLeads(Array.isArray(hotLeadsRes.data) ? hotLeadsRes.data : []);
    } catch (error) {
      console.error('Dashboard error:', error);
      setSummary(null);
      setPerformance([]);
      setHotLeads([]);
    }
  };

  const fetchContactsSummary = async (filterValue: string) => {
    try {
      setContactsLoading(true);

      const res = await axios.get(`${apiBaseUrl}/dashboard/contacts-summary`, {
        params: {
          city: filterValue || undefined,
        },
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

  const handleApplyContactFilter = async () => {
    await fetchContactsSummary(cityFilter);
  };

  const handleClearContactFilter = async () => {
    setCityFilter('');
    await fetchContactsSummary('');
  };

  if (!summary) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const conversionPercentage =
    summary.totalLeads > 0
      ? Math.round((summary.interestedLeads / summary.totalLeads) * 100)
      : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card title="Total Leads" value={summary.totalLeads} />
        <Card title="New Leads" value={summary.newLeads} />
        <Card title="Interested Leads" value={summary.interestedLeads} />
        <Card title="Never Called" value={summary.neverCalledCount} />
        <Card title="Callbacks" value={summary.callbackCount} />
        <Card title="Today Follow-ups" value={summary.todayFollowUps} />
        <Card title="Overdue Follow-ups" value={summary.overdueFollowUps} />

        <div className="rounded-xl bg-green-500 p-4 text-white shadow">
          <h2 className="text-sm">Conversion %</h2>
          <p className="text-2xl font-bold">{conversionPercentage}%</p>
        </div>

        <div className="rounded-xl bg-red-500 p-4 text-white shadow">
          <h2 className="text-sm">Leakage Risk</h2>
          <p className="text-2xl font-bold">{summary.overdueFollowUps}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">📂 Contacts Overview</h2>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            type="text"
            placeholder="Filter by city / address / location"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="rounded border p-2 md:col-span-2"
          />

          <button
            onClick={handleApplyContactFilter}
            className="rounded bg-blue-600 px-4 py-2 text-white"
            disabled={contactsLoading}
          >
            {contactsLoading ? 'Applying...' : 'Apply Filter'}
          </button>

          <button
            onClick={handleClearContactFilter}
            className="rounded bg-gray-200 px-4 py-2"
            disabled={contactsLoading}
          >
            Clear Filter
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            title="Total Contacts Added Till Date"
            value={contactsSummary?.totalContacts || 0}
          />
          <Card
            title="Filtered Contacts"
            value={contactsSummary?.filteredContacts || 0}
          />
        </div>
      </div>

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
                <p className="font-semibold">User ID: {p.telecallerId}</p>
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
          <div className="rounded-xl bg-white p-4 shadow">
            No hot leads yet
          </div>
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
          <p>New → {summary.newLeads}</p>
          <p>Interested → {summary.interestedLeads}</p>
          <p>Callbacks → {summary.callbackCount}</p>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <h2 className="text-sm text-gray-500">{title}</h2>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
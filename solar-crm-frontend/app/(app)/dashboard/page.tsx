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

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [performance, setPerformance] = useState<PerformanceItem[]>([]);
  const [hotLeads, setHotLeads] = useState<HotLead[]>([]);

  useEffect(() => {
    const fetchData = async () => {
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
          axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard/summary`, {
            params,
            headers: getAuthHeaders(),
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/telecalling/performance`, {
            headers: getAuthHeaders(),
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/leads/hot`, {
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

    fetchData();
  }, []);

  if (!summary) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const conversionPercentage =
    summary.totalLeads > 0
      ? Math.round((summary.interestedLeads / summary.totalLeads) * 100)
      : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card title="Total Leads" value={summary.totalLeads} />
        <Card title="New Leads" value={summary.newLeads} />
        <Card title="Interested Leads" value={summary.interestedLeads} />
        <Card title="Never Called" value={summary.neverCalledCount} />
        <Card title="Callbacks" value={summary.callbackCount} />
        <Card title="Today Follow-ups" value={summary.todayFollowUps} />
        <Card title="Overdue Follow-ups" value={summary.overdueFollowUps} />

        <div className="bg-green-500 text-white p-4 rounded-xl shadow">
          <h2 className="text-sm">Conversion %</h2>
          <p className="text-2xl font-bold">{conversionPercentage}%</p>
        </div>

        <div className="bg-red-500 text-white p-4 rounded-xl shadow">
          <h2 className="text-sm">Leakage Risk</h2>
          <p className="text-2xl font-bold">{summary.overdueFollowUps}</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">📞 Telecaller Performance</h2>

        {performance.length === 0 ? (
          <div className="bg-white p-4 rounded-xl shadow">
            No telecaller performance data yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {performance.map((p) => (
              <div key={p.telecallerId} className="bg-white p-4 rounded-xl shadow">
                <p className="font-semibold">User ID: {p.telecallerId}</p>
                <p>Total Calls: {p.totalCalls}</p>
                <p>Interested: {p.interested}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">🔥 Hot Leads</h2>

        {hotLeads.length === 0 ? (
          <div className="bg-white p-4 rounded-xl shadow">
            No hot leads yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hotLeads.map((lead) => (
              <div key={lead.id} className="bg-white p-4 rounded-xl shadow">
                <p className="font-semibold">{lead.name}</p>
                <p>{lead.phone}</p>
                <p className="text-sm text-gray-500">{lead.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">📊 Lead Funnel</h2>

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
    <div className="bg-white shadow rounded-xl p-4">
      <h2 className="text-sm text-gray-500">{title}</h2>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
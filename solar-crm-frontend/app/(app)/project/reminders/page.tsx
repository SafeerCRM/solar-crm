'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

type ReminderSummary = {
  overdueInspections: number;
  todaysExecutionWork: number;
  upcomingDeadlines: number;
  totalPendingReminders: number;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ProjectRemindersPage() {
  const [summary, setSummary] = useState<ReminderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchReminderSummary = async () => {
    try {
      setLoading(true);
      setMessage('');

      const res = await axios.get(
        `${apiBaseUrl}/project/execution-reminders/summary`,
        {
          headers: getAuthHeaders(),
        },
      );

      setSummary(res.data || null);
    } catch (error: any) {
      console.error('Reminder summary error:', error);
      setSummary(null);
      setMessage(
        error?.response?.data?.message ||
          'Failed to load reminder summary.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminderSummary();
  }, []);

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
          </div>

          <div className="mt-6 rounded-2xl bg-white p-4 shadow md:p-6">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Execution Reminder Status
                </h2>
                <p className="text-sm text-gray-500">
                  This is the first reminder foundation. Detailed reminder list,
                  filters, and notification logs will be added in the next phase.
                </p>
              </div>

              <button
                onClick={fetchReminderSummary}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              >
                Refresh
              </button>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
              <p>
                Current scope: project execution activities, inspection deadlines,
                today’s work, and upcoming deadlines.
              </p>
              <p className="mt-2">
                Future scope: loan, subsidy, electricity, payment, WhatsApp,
                email, push, and in-app notifications.
              </p>
            </div>
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
  tone: 'red' | 'blue' | 'amber' | 'purple';
}) {
  const toneClasses = {
    red: 'border-red-200 bg-red-50 text-red-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
  };

  return (
    <div className={`rounded-2xl border p-4 shadow ${toneClasses[tone]}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs opacity-80">{description}</p>
    </div>
  );
}
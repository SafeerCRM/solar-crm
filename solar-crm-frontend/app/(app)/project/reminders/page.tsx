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
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ProjectRemindersPage() {
  const [summary, setSummary] = useState<ReminderSummary | null>(null);
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchReminders = async () => {
    try {
      setLoading(true);
      setMessage('');

      const [summaryRes, listRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/project/execution-reminders/summary`, {
          headers: getAuthHeaders(),
        }),
        axios.get(`${apiBaseUrl}/project/execution-reminders`, {
          headers: getAuthHeaders(),
        }),
      ]);

      setSummary(summaryRes.data || null);
      setItems(Array.isArray(listRes.data) ? listRes.data : []);
    } catch (error: any) {
      console.error('Reminder error:', error);
      setSummary(null);
      setItems([]);
      setMessage(
        error?.response?.data?.message || 'Failed to load reminders.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
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

            {items.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                No active reminders found.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <ReminderListItem key={item.id} item={item} />
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

function ReminderListItem({ item }: { item: ReminderItem }) {
  const badge = getReminderBadge(item.reminderType);
  const mainDate = item.inspectionDeadline || item.scheduledDate;

  return (
    <div className="rounded-xl border bg-gray-50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
            >
              {badge.label}
            </span>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
              {formatActivityType(item.activityType)}
            </span>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
              {item.status}
            </span>
          </div>

          <p className="text-sm text-gray-600">
            Project ID: <b>{item.projectId}</b>
          </p>

          <p className="text-sm text-gray-600">
            Due/Scheduled: <b>{formatDate(mainDate)}</b>
          </p>

          <p className="text-sm text-gray-600">
            Assigned To:{' '}
            <b>{item.assignedToName || item.assignedTo || 'Not assigned'}</b>
          </p>

          {item.remarks && (
            <p className="mt-2 text-sm text-gray-500">
              Remarks: {item.remarks}
            </p>
          )}
        </div>

        <Link
          href={`/project/${item.projectId}`}
          className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white"
        >
          Open Project
        </Link>
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
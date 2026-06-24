'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CustomerNotificationsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [filter, setFilter] = useState('ALL');
const [savingAll, setSavingAll] = useState(false);

  const notifications = dashboard?.notifications || [];
  const unreadCount = notifications.filter((item: any) => !item.isRead).length;
  const filteredNotifications = notifications.filter((item: any) => {
  if (filter === 'UNREAD') return !item.isRead;
  if (filter === 'READ') return item.isRead;
  return true;
});

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('customer_token');

      if (!token) {
        window.location.href = '/customer-login';
        return;
      }

      const res = await fetch(`${API_BASE_URL}/customer-auth/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        window.location.href = '/customer-login';
        return;
      }

      setDashboard(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const markRead = async (id: number) => {
    try {
      setSavingId(id);

      const token = localStorage.getItem('customer_token');

      const res = await fetch(
        `${API_BASE_URL}/customer-auth/notifications/${id}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || 'Failed to mark notification read');
        return;
      }

      loadDashboard();
    } catch (error) {
      console.error(error);
      alert('Failed to mark notification read');
    } finally {
      setSavingId(null);
    }
  };

  const markAllRead = async () => {
  try {
    setSavingAll(true);

    const token = localStorage.getItem('customer_token');

    const res = await fetch(
      `${API_BASE_URL}/customer-auth/notifications/read-all`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data?.message || 'Failed to mark all notifications read');
      return;
    }

    loadDashboard();
  } catch (error) {
    console.error(error);
    alert('Failed to mark all notifications read');
  } finally {
    setSavingAll(false);
  }
};

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50">
        <div className="rounded-3xl bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-3xl">
            🔔
          </div>
          <p className="text-sm font-semibold text-gray-600">
            Loading notifications...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
          <p className="text-sm font-bold opacity-90">
            Customer Updates Center
          </p>

          <h1 className="mt-2 text-4xl font-black md:text-5xl">
            🔔 Notifications
          </h1>

          <p className="mt-2 text-sm text-white/90">
            Track project updates, payment updates, complaint updates and service alerts.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <HeroCard title="Total" value={String(notifications.length)} />
            <HeroCard title="Unread" value={String(unreadCount)} />
            <HeroCard
              title="Read"
              value={String(notifications.length - unreadCount)}
            />
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
  <h2 className="text-2xl font-black text-gray-900">
    Latest Updates
  </h2>

  <div className="flex flex-wrap gap-2">
    {['ALL', 'UNREAD', 'READ'].map((item) => (
      <button
        key={item}
        onClick={() => setFilter(item)}
        className={`rounded-2xl px-4 py-2 text-xs font-black ${
          filter === item
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        {item}
      </button>
    ))}

    <button
      onClick={markAllRead}
      disabled={savingAll || unreadCount === 0}
      className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
    >
      {savingAll ? 'Saving...' : 'Mark All Read'}
    </button>
  </div>
</div>

          <div className="mt-5 space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="rounded-3xl border border-dashed p-8 text-center text-sm font-semibold text-gray-500">
                No notifications yet.
              </div>
            ) : (
              filteredNotifications.map((item: any) => (
                <div
                  key={item.id}
                  className={`rounded-3xl border p-5 ${
                    item.isRead
                      ? 'bg-gray-50'
                      : 'bg-gradient-to-r from-orange-50 to-yellow-50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-gray-900">
                          {item.title || 'Notification'}
                        </h3>

                        {!item.isRead && (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                            New
                          </span>
                        )}

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                          {formatLabel(item.notificationType)}
                        </span>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {item.message || '-'}
                      </p>

                      <p className="mt-3 text-xs font-semibold text-gray-400">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString('en-IN')
                          : '-'}
                      </p>
                    </div>

                    {!item.isRead && (
                      <button
                        onClick={() => markRead(item.id)}
                        disabled={savingId === item.id}
                        className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {savingId === item.id ? 'Saving...' : 'Mark Read'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function HeroCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/20 p-4 backdrop-blur">
      <p className="text-xs font-bold opacity-90">{title}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}
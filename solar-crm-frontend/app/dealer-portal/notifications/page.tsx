'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DealerNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadNotifications();
  }, [status]);

  const getToken = () => {
    const token = localStorage.getItem('dealer_token');

    if (!token) {
      window.location.href = '/dealer-login';
      return '';
    }

    return token;
  };

  const loadNotifications = async () => {
    const token = getToken();

    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);

      const res = await fetch(`${API_BASE_URL}/dealer-auth/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setNotifications(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const markRead = async (id: number) => {
    const token = getToken();

    try {
      const res = await fetch(`${API_BASE_URL}/dealer-auth/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.message || 'Unable to mark read');
        return;
      }

      setMessage('Notification marked as read.');
      loadNotifications();
    } catch (error) {
      console.error(error);
      setMessage('Notification update error.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="relative mx-auto max-w-5xl px-4 py-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <a href="/dealer-portal" className="text-sm font-black text-orange-300">
            ← Back to Dashboard
          </a>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black md:text-4xl">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Updates about orders, payments, complaints and credit reminders.
              </p>
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900"
            >
              <option value="">All Notifications</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
            </select>
          </div>
        </header>

        {message && (
          <p className="mt-5 rounded-2xl bg-blue-100 p-3 text-center text-sm font-bold text-blue-800">
            {message}
          </p>
        )}

        <section className="mt-6 space-y-4">
          {!notifications.length && (
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/10 p-8 text-center text-white/70">
              No notifications found.
            </div>
          )}

          {notifications.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-[2rem] bg-white text-slate-900 shadow-xl"
            >
              <div className="h-2 bg-gradient-to-r from-blue-700 via-sky-500 to-orange-400" />

              <div className="p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-black">{item.title}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {item.message}
                    </p>
                    <p className="mt-2 text-xs font-bold text-slate-400">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString('en-IN')
                        : '-'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 md:items-end">
                    <StatusBadge status={item.status} />

                    {item.status !== 'READ' && (
                      <button
                        onClick={() => markRead(item.id)}
                        className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'READ'
      ? 'bg-slate-100 text-slate-600'
      : 'bg-orange-100 text-orange-700';

  return (
    <span className={`rounded-full px-4 py-2 text-xs font-black ${tone}`}>
      {status || 'UNREAD'}
    </span>
  );
}
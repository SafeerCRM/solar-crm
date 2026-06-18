'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DealerAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const getToken = () => {
    const token = localStorage.getItem('dealer_token');

    if (!token) {
      window.location.href = '/dealer-login';
      return '';
    }

    return token;
  };

  const loadAnalytics = async () => {
    const token = getToken();

    try {
      const res = await fetch(`${API_BASE_URL}/dealer-auth/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cards = useMemo(
    () => [
      {
        title: 'Total Orders',
        value: analytics?.totalOrders || 0,
        text: 'Total dealer orders',
        icon: '📦',
      },
      {
        title: 'Order Value',
        value: `₹${Number(analytics?.totalOrderValue || 0).toLocaleString('en-IN')}`,
        text: 'Total order value',
        icon: '💰',
      },
      {
        title: 'Paid Amount',
        value: `₹${Number(analytics?.paidAmount || 0).toLocaleString('en-IN')}`,
        text: 'Total paid amount',
        icon: '✅',
      },
      {
        title: 'Pending Amount',
        value: `₹${Number(analytics?.pendingAmount || 0).toLocaleString('en-IN')}`,
        text: 'Outstanding balance',
        icon: '⏳',
      },
      {
        title: 'Credit Pending',
        value: `₹${Number(analytics?.creditPendingAmount || 0).toLocaleString('en-IN')}`,
        text: 'Credit outstanding',
        icon: '🧾',
      },
      {
        title: 'Payments',
        value: analytics?.totalPayments || 0,
        text: 'Payment entries',
        icon: '💳',
      },
    ],
    [analytics],
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-3xl bg-white/10 px-8 py-6 font-black">
          Loading analytics...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-orange-500/25 blur-3xl" />
      <div className="absolute right-[-120px] top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <a href="/dealer-portal" className="text-sm font-black text-orange-300">
            ← Back to Dashboard
          </a>

          <h1 className="mt-3 text-3xl font-black md:text-4xl">
            Dealer Analytics
          </h1>

          <p className="mt-1 text-sm text-white/60">
            Track your orders, pending amount, payments and monthly material planning.
          </p>
        </header>

        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl">{card.icon}</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                  LIVE
                </span>
              </div>

              <p className="mt-5 text-sm font-bold text-slate-500">{card.title}</p>
              <p className="mt-1 text-3xl font-black">{card.value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">{card.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <AnalyticsPanel
            title="Orders by Status"
            emptyText="No order status data yet."
            data={analytics?.ordersByStatus}
          />

          <AnalyticsPanel
            title="Payments by Status"
            emptyText="No payment status data yet."
            data={analytics?.paymentsByStatus}
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl">
            <h2 className="text-xl font-black">Monthly Requirement Summary</h2>

            <div className="mt-5 space-y-3">
              {(!analytics?.monthlyRequirementSummary ||
                analytics.monthlyRequirementSummary.length === 0) && (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                  No monthly requirement data yet.
                </div>
              )}

              {(analytics?.monthlyRequirementSummary || []).map((item: any) => (
                <div
                  key={item.requirementMonth}
                  className="rounded-2xl bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black">{item.requirementMonth}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {item.totalMaterials} material types
                      </p>
                    </div>

                    <p className="text-xl font-black">
                      {item.totalExpectedQuantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-orange-500 to-yellow-400 p-6 text-slate-950 shadow-xl">
            <h2 className="text-xl font-black">Dealer Health Summary</h2>

            <div className="mt-5 grid gap-3">
              <HealthRow
                label="Payment Clear Ratio"
                value={`${getPaymentClearRatio(analytics)}%`}
              />
              <HealthRow
                label="Open Pending Amount"
                value={`₹${Number(analytics?.pendingAmount || 0).toLocaleString('en-IN')}`}
              />
              <HealthRow
                label="Credit Exposure"
                value={`₹${Number(analytics?.creditPendingAmount || 0).toLocaleString('en-IN')}`}
              />
              <HealthRow
                label="Monthly Requirement Entries"
                value={String(analytics?.totalMonthlyRequirements || 0)}
              />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <RecentPanel title="Recent Orders" items={analytics?.recentOrders || []} type="order" />
          <RecentPanel title="Recent Payments" items={analytics?.recentPayments || []} type="payment" />
        </section>
      </div>
    </main>
  );
}

function getPaymentClearRatio(analytics: any) {
  const total = Number(analytics?.totalOrderValue || 0);
  const paid = Number(analytics?.paidAmount || 0);

  if (!total) return 0;

  return Math.round((paid / total) * 100);
}

function AnalyticsPanel({
  title,
  emptyText,
  data,
}: {
  title: string;
  emptyText: string;
  data: any;
}) {
  const entries = Object.entries(data || {});

  return (
    <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl">
      <h2 className="text-xl font-black">{title}</h2>

      <div className="mt-5 space-y-3">
        {!entries.length && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
            {emptyText}
          </div>
        )}

        {entries.map(([key, value]) => (
          <div key={key} className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <p className="font-black">{key.replaceAll('_', ' ')}</p>
              <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-black text-blue-700">
                {String(value)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/75 p-4">
      <p className="text-xs font-bold text-slate-600">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function RecentPanel({
  title,
  items,
  type,
}: {
  title: string;
  items: any[];
  type: 'order' | 'payment';
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
      <h2 className="text-xl font-black">{title}</h2>

      <div className="mt-5 space-y-3">
        {!items.length && (
          <p className="rounded-2xl bg-white/10 p-4 text-sm text-white/60">
            No data yet.
          </p>
        )}

        {items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-white/10 p-4">
            <p className="font-black">
              {type === 'order'
                ? item.orderNumber || `Order #${item.id}`
                : `Payment #${item.id}`}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {type === 'order'
                ? `₹${Number(item.totalAmount || 0).toLocaleString('en-IN')} · ${item.status}`
                : `₹${Number(item.amount || 0).toLocaleString('en-IN')} · ${item.status}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
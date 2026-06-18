'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DealerPortalPage() {
  const [dealer, setDealer] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('dealer_token') : '';

  useEffect(() => {
    const savedDealer = localStorage.getItem('dealer');
    const savedToken = localStorage.getItem('dealer_token');

    if (!savedDealer || !savedToken) {
      window.location.href = '/dealer-login';
      return;
    }

    setDealer(JSON.parse(savedDealer));
    loadData(savedToken);
  }, []);

  const loadData = async (authToken: string) => {
    try {
      const [dashboardRes, analyticsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dealer-auth/dashboard`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${API_BASE_URL}/dealer-auth/analytics`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      const dashboardData = await dashboardRes.json();
      const analyticsData = await analyticsRes.json();

      setDashboard(dashboardData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('dealer_token');
    localStorage.removeItem('dealer');
    window.location.href = '/dealer-login';
  };

  const displayDealer = dashboard?.dealer || dealer;

  const cards = useMemo(
    () => [
      {
        title: 'Total Orders',
        value: analytics?.totalOrders || 0,
        text: 'Orders placed till now',
        icon: '📦',
      },
      {
        title: 'Order Value',
        value: `₹${Number(analytics?.totalOrderValue || 0).toLocaleString('en-IN')}`,
        text: 'Total business value',
        icon: '💰',
      },
      {
        title: 'Pending Amount',
        value: `₹${Number(analytics?.pendingAmount || 0).toLocaleString('en-IN')}`,
        text: 'Payment yet to clear',
        icon: '⏳',
      },
      {
        title: 'Credit Pending',
        value: `₹${Number(analytics?.creditPendingAmount || 0).toLocaleString('en-IN')}`,
        text: 'Pending credit amount',
        icon: '🧾',
      },
    ],
    [analytics],
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/10 px-8 py-6 text-center shadow-2xl backdrop-blur">
          <div className="text-4xl">⚡</div>
          <p className="mt-3 font-black">Loading Dealer Portal...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-orange-500/25 blur-3xl" />
      <div className="absolute right-[-120px] top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-6">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-black text-orange-200">
              ⚡ Aditya Solars Dealer Portal
            </div>

            <h1 className="mt-3 text-3xl font-black md:text-4xl">
              Welcome, {displayDealer?.firmName || displayDealer?.dealerName || 'Dealer'}
            </h1>

            <p className="mt-1 text-sm text-white/60">
              {displayDealer?.branchName || 'Branch not set'} · {displayDealer?.city || 'City not set'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/dealer-portal/stock"
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-3 text-sm font-black shadow-lg transition hover:scale-[1.02]"
            >
              View Stock
            </a>

            <a
              href="/dealer-portal/orders/create"
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:scale-[1.02]"
            >
              Create Order
            </a>

            <button
              onClick={logout}
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white/80"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-[1.7rem] border border-white/10 bg-white p-5 text-slate-900 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{card.icon}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                  LIVE
                </span>
              </div>

              <p className="mt-5 text-sm font-bold text-slate-500">{card.title}</p>
              <p className="mt-1 text-2xl font-black">{card.value}</p>
              <p className="mt-1 text-xs text-slate-400">{card.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-xl lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Recent Orders</h2>
                <p className="text-sm text-slate-500">Latest dealer order activity</p>
              </div>

              <a href="/dealer-portal/orders" className="text-sm font-black text-blue-600">
                View All
              </a>
            </div>

            <div className="space-y-3">
              {(dashboard?.recentOrders || []).length === 0 && (
                <EmptyState text="No orders yet. Create your first dealer order." />
              )}

              {(dashboard?.recentOrders || []).map((order: any) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-black">{order.orderNumber || `Order #${order.id}`}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')} · {order.paymentType}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="font-black">
                      ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-orange-500 to-yellow-400 p-6 text-slate-950 shadow-xl">
            <h2 className="text-xl font-black">Quick Actions</h2>
            <p className="mt-1 text-sm font-semibold text-slate-800/70">
              Everything dealers need, quickly accessible.
            </p>

            <div className="mt-6 grid gap-3">
  <QuickAction href="/dealer-portal/stock" icon="📦" title="Check Stock" />
  <QuickAction href="/dealer-portal/orders/create" icon="🛒" title="Create Material Order" />
  <QuickAction href="/dealer-portal/orders" icon="📋" title="Order History" />
  <QuickAction href="/dealer-portal/payments" icon="💳" title="Upload Payment" />
  <QuickAction href="/dealer-portal/complaints" icon="🛠️" title="Raise Complaint" />
  <QuickAction href="/dealer-portal/notifications" icon="🔔" title="Notifications" />
  <QuickAction href="/dealer-portal/monthly-requirements" icon="📈" title="Monthly Requirement" />
  <QuickAction href="/dealer-portal/bank-details" icon="🏦" title="Bank Details / QR" />
  <QuickAction href="/dealer-portal/staff" icon="👥" title="Staff Directory" />
  <QuickAction href="/dealer-portal/analytics" icon="📊" title="Analytics" />
</div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-xl font-black">Notifications</h2>

            <div className="mt-4 space-y-3">
              {(dashboard?.notifications || []).length === 0 && (
                <p className="text-sm text-white/60">No notifications yet.</p>
              )}

              {(dashboard?.notifications || []).slice(0, 5).map((item: any) => (
                <div key={item.id} className="rounded-2xl bg-white/10 p-4">
                  <p className="font-black">{item.title}</p>
                  <p className="mt-1 text-sm text-white/70">{item.message}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 text-right">
  <a
    href="/dealer-portal/notifications"
    className="text-sm font-black text-orange-300"
  >
    View All →
  </a>
</div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-xl font-black">Monthly Demand</h2>

            <div className="mt-4 space-y-3">
              {(dashboard?.monthlyRequirements || []).length === 0 && (
                <p className="text-sm text-white/60">
                  No monthly quantity added yet.
                </p>
              )}

              {(dashboard?.monthlyRequirements || []).slice(0, 5).map((item: any) => (
                <div key={item.id} className="rounded-2xl bg-white/10 p-4">
  <p className="font-black">{item.materialName}</p>

  <div className="mt-2 grid gap-1 text-sm text-white/70">
    <p>Month: {item.requirementMonth || '-'}</p>
    <p>Expected Qty: {item.expectedQuantity || 0}</p>
    {item.unit && <p>Unit: {item.unit}</p>}
  </div>
</div>
              ))}
            </div>

            <div className="mt-4 text-right">
  <a
    href="/dealer-portal/monthly-requirements"
    className="text-sm font-black text-orange-300"
  >
    View All →
  </a>
</div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="mt-1 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
      {status || 'PENDING'}
    </span>
  );
}

function QuickAction({
  href,
  icon,
  title,
}: {
  href: string;
  icon: string;
  title: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-2xl bg-white/80 p-4 font-black shadow transition hover:scale-[1.01] hover:bg-white"
    >
      <span className="text-2xl">{icon}</span>
      <span>{title}</span>
    </a>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
      {text}
    </div>
  );
}
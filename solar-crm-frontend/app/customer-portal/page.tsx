'use client';

import { useEffect, useState } from 'react';

export default function CustomerPortalPage() {
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    const savedCustomer = localStorage.getItem('customer');

    if (!token || !savedCustomer) {
      window.location.href = '/customer-login';
      return;
    }

    setCustomer(JSON.parse(savedCustomer));
  }, []);

  const logout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer');
    window.location.href = '/customer-login';
  };

  if (!customer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50">
        <p className="text-sm font-semibold text-gray-600">
          Loading customer portal...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold opacity-90">
                ☀ Aditya Solars Customer Portal
              </p>
              <h1 className="mt-3 text-3xl font-black md:text-5xl">
                Welcome, {customer.customerName || 'Customer'}
              </h1>
              <p className="mt-2 text-sm text-white/90">
                Customer Code: {customer.customerCode || '-'} | K Number:{' '}
                {customer.electricityKNumber || '-'}
              </p>
            </div>

            <button
              onClick={logout}
              className="rounded-2xl bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur hover:bg-white/30"
            >
              Logout
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <HeroMiniCard title="Projects" value="Loading" />
            <HeroMiniCard title="Payments" value="Coming" />
            <HeroMiniCard title="Complaints" value="Ready" />
            <HeroMiniCard title="Documents" value="Soon" />
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <ActionCard
            icon="📊"
            title="My Project Progress"
            text="Track approval, installation, subsidy, electricity and completion progress."
          />
          <ActionCard
            icon="📅"
            title="Work Calendar"
            text="See upcoming site work dates and request changes if needed."
          />
          <ActionCard
            icon="🛠"
            title="Complaints & Service"
            text="Raise complaints and track service status in one place."
          />
          <ActionCard
            icon="💳"
            title="Payments"
            text="View payment status and upload payment receipts."
          />
          <ActionCard
            icon="📁"
            title="Documents"
            text="View vendor agreement, invoices and project documents."
          />
          <ActionCard
            icon="🎁"
            title="Refer & Earn"
            text="Refer new customers and track ₹5000 referral rewards."
          />
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
          <h2 className="text-2xl font-black text-gray-900">
            Portal is being prepared for your projects
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            This dashboard foundation is ready. Next we will connect live project data,
            timeline, payments, documents and complaint tracking.
          </p>
        </div>
      </div>
    </main>
  );
}

function HeroMiniCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/20 p-4 backdrop-blur">
      <p className="text-xs font-semibold opacity-90">{title}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-yellow-100 text-3xl">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-black text-gray-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-500">{text}</p>
    </div>
  );
}
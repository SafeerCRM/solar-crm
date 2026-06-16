'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CustomerPortalPage() {
  const [customer, setCustomer] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const projects = dashboard?.projects || [];
  const complaints = dashboard?.complaints || [];
  const notifications = dashboard?.notifications || [];

  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    const savedCustomer = localStorage.getItem('customer');

    if (!token || !savedCustomer) {
      window.location.href = '/customer-login';
      return;
    }

    setCustomer(JSON.parse(savedCustomer));
    fetchDashboard(token);
  }, []);

  const fetchDashboard = async (token: string) => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/customer-auth/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        localStorage.removeItem('customer_token');
        localStorage.removeItem('customer');
        window.location.href = '/customer-login';
        return;
      }

      setDashboard(data);
      setCustomer(data.customer || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer');
    window.location.href = '/customer-login';
  };

  if (!customer || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50">
        <div className="rounded-3xl bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-3xl">
            ☀
          </div>
          <p className="text-sm font-semibold text-gray-600">
            Loading your solar dashboard...
          </p>
        </div>
      </main>
    );
  }

  const primaryProject = projects[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50 pb-24">
      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
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
            <HeroMiniCard
              title="Projects"
              value={String(dashboard?.totalProjects || projects.length || 0)}
            />
            <HeroMiniCard
              title="Open Complaints"
              value={String(dashboard?.openComplaints || 0)}
            />
            <HeroMiniCard
              title="Unread Updates"
              value={String(dashboard?.unreadNotifications || 0)}
            />
            <HeroMiniCard
              title="Current Status"
              value={primaryProject?.status || 'No Project'}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionTitle
              title="My Projects"
              subtitle="Live project details linked with your customer profile"
            />

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {projects.length === 0 ? (
                <EmptyCard text="No linked projects found yet. Please contact your project owner." />
              ) : (
                projects.map((project: any) => (
                  <ProjectCard key={project.id} project={project} />
                ))
              )}
            </div>
          </div>

          <div>
            <SectionTitle
              title="Quick Actions"
              subtitle="Common customer actions"
            />

            <div className="mt-4 grid gap-4">
              <a href="/customer-portal/complaints">
  <ActionCard
    icon="🛠"
    title="Raise Complaint"
    text="Report generation, inverter, panel, subsidy, payment or service issue."
  />
</a>
              <a href="/customer-portal/payments">
  <ActionCard
    icon="💳"
    title="Payments"
    text="View installments, company account details, UPI/QR and upload receipt."
  />
</a>
              <ActionCard
                icon="🎁"
                title="Refer Customer"
                text="Refer new customer and track ₹5000 reward status."
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl">
            <SectionTitle
              title="Latest Complaints"
              subtitle="Your recent service and complaint tickets"
            />

            <div className="mt-4 space-y-3">
              {complaints.length === 0 ? (
                <EmptyCard text="No complaints raised yet." />
              ) : (
                complaints.slice(0, 5).map((item: any) => (
                  <ComplaintRow key={item.id} item={item} />
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-xl">
            <SectionTitle
              title="Notifications"
              subtitle="Latest project updates and alerts"
            />

            <div className="mt-4 space-y-3">
              {notifications.length === 0 ? (
                <EmptyCard text="No notifications yet." />
              ) : (
                notifications.slice(0, 5).map((item: any) => (
                  <NotificationRow key={item.id} item={item} />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
          <SectionTitle
            title="Customer Services"
            subtitle="Everything related to your solar plant in one place"
          />

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <ActionCard
              icon="📊"
              title="Project Timeline"
              text="Track approval, installation, subsidy, electricity and completion progress."
            />
            <a href="/customer-portal/work-calendar">
  <ActionCard
    icon="📅"
    title="Work Calendar"
    text="See upcoming work dates and request date changes."
  />
</a>
            <ActionCard
              icon="📁"
              title="Documents Vault"
              text="View agreements, invoices, subsidy and electricity documents."
            />
            <ActionCard
              icon="🧽"
              title="Cleaning Calendar"
              text="Manage cleaning schedule and reminders."
            />
            <ActionCard
              icon="👷"
              title="Staff Directory"
              text="View project owner, manager, contractor and department contacts."
            />
            <ActionCard
              icon="📜"
              title="Policies"
              text="Read customer policy, warranty and maintenance guidelines."
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h2 className="text-2xl font-black text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function HeroMiniCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/20 p-4 backdrop-blur">
      <p className="text-xs font-semibold opacity-90">{title}</p>
      <p className="mt-2 break-words text-xl font-black">{value}</p>
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  return (
    <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold opacity-80">Project #{project.id}</p>
            <h3 className="mt-1 text-xl font-black">
              {project.projectSize || project.structureCapacityKw || 'Solar Project'}
            </h3>
          </div>

          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
            {project.status || '-'}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <InfoLine label="Customer" value={project.customerName} />
        <InfoLine label="K Number" value={project.electricityKNumber} />
        <InfoLine label="Branch" value={project.branchName} />
        <InfoLine label="Project Owner" value={project.projectOwnerName} />
        <InfoLine label="Project Type" value={project.projectType} />

        <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
          <p className="text-xs font-bold text-emerald-700">
            Current Stage
          </p>
          <p className="mt-1 text-lg font-black text-emerald-900">
            {formatStatus(project.status)}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3">
      <p className="text-xs font-bold text-gray-500">{label}</p>
      <p className="text-right text-sm font-black text-gray-800">{value || '-'}</p>
    </div>
  );
}

function ComplaintRow({ item }: { item: any }) {
  return (
    <div className="rounded-2xl border bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-gray-900">
            {item.subject || 'Complaint'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {item.complaintText || '-'}
          </p>
        </div>

        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
          {item.status || 'OPEN'}
        </span>
      </div>
    </div>
  );
}

function NotificationRow({ item }: { item: any }) {
  return (
    <div className="rounded-2xl border bg-gray-50 p-4">
      <p className="font-black text-gray-900">{item.title || 'Notification'}</p>
      <p className="mt-1 text-sm text-gray-500">{item.message || '-'}</p>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed bg-white/70 p-6 text-center text-sm font-semibold text-gray-500">
      {text}
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

function formatStatus(status?: string) {
  if (!status) return '-';

  return status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
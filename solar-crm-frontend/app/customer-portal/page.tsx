'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CustomerPortalPage() {
  const [customer, setCustomer] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showPasswordBox, setShowPasswordBox] = useState(false);
const [passwordForm, setPasswordForm] = useState({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const [passwordSaving, setPasswordSaving] = useState(false);
const [showPasswordText, setShowPasswordText] = useState(false);

  const projects = dashboard?.projects || [];
  const complaints = dashboard?.complaints || [];
  const notifications = dashboard?.notifications || [];
  const documents = dashboard?.customerDocuments || [];
const paymentReceipts = dashboard?.paymentReceipts || [];
const workDateRequests = dashboard?.workDateRequests || [];
const referrals = dashboard?.referrals || [];
const executionActivities = dashboard?.executionActivities || [];

const activityFeed = [
  ...notifications.map((item: any) => ({
  id: `notification-${item.id}`,
  type: item.relatedEntityType === 'AFTER_SALES_REQUEST' ? '🧰' : '🔔',
  title: item.title || 'Notification',
  text: item.message || '',
  date: item.createdAt,
  link:
    item.relatedEntityType === 'AFTER_SALES_REQUEST' && item.relatedEntityId
      ? `/customer-portal/after-sales-services?requestId=${item.relatedEntityId}`
      : '/customer-portal/notifications',
})),

  ...documents.map((item: any) => ({
    id: `document-${item.id}`,
    type: '📁',
    title: `${formatStatus(item.documentType)} uploaded`,
    text: `Project #${item.projectId}`,
    date: item.createdAt,
    link: '/customer-portal/documents',
  })),

  ...paymentReceipts.map((item: any) => ({
    id: `payment-${item.id}`,
    type: '💳',
    title: `Payment receipt ${formatStatus(item.status)}`,
    text: `₹${Number(item.amount || 0).toLocaleString('en-IN')} · Project #${item.projectId}`,
    date: item.updatedAt || item.createdAt,
    link: '/customer-portal/payments',
  })),

  ...workDateRequests.map((item: any) => ({
    id: `work-${item.id}`,
    type: '📅',
    title: `Work date request ${formatStatus(item.status)}`,
    text: item.reason || `Project #${item.projectId}`,
    date: item.updatedAt || item.createdAt,
    link: '/customer-portal/work-calendar',
  })),

  ...referrals.map((item: any) => ({
    id: `referral-${item.id}`,
    type: '🎁',
    title: `Referral ${formatStatus(item.status)}`,
    text: item.referredName || '',
    date: item.updatedAt || item.createdAt,
    link: '/customer-portal/referrals',
  })),

  ...executionActivities.map((item: any) => ({
    id: `execution-${item.id}`,
    type: '⚙️',
    title: formatStatus(item.activityType),
    text: `Status: ${formatStatus(item.status)} · Project #${item.projectId}`,
    date: item.updatedAt || item.scheduledDate || item.createdAt,
    link: '/customer-portal/project-tracker',
  })),
]
  .filter((item) => item.date)
  .sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
  .slice(0, 10);

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

  const changePassword = async () => {
  if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
    alert('Please fill all password fields');
    return;
  }

  if (passwordForm.newPassword.length < 4) {
    alert('New password must be at least 4 characters');
    return;
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    alert('New password and confirm password do not match');
    return;
  }

  try {
    setPasswordSaving(true);

    const token = localStorage.getItem('customer_token');

    const res = await fetch(`${API_BASE_URL}/customer-auth/change-password`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordForm),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Failed to change password');
      return;
    }

    alert('Password changed successfully. Please login again.');

    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer');
    window.location.href = '/customer-login';
  } catch (error) {
    console.error(error);
    alert('Failed to change password');
  } finally {
    setPasswordSaving(false);
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

  const portalExperience = dashboard?.portalExperience || {};
const enabledSections = portalExperience?.enabledSections || {};
const quickActions = portalExperience?.quickActions || {};

const customerPortalMode =
  portalExperience?.mode || dashboard?.customerPortalMode || 'NO_PROJECT';

const portalModeLabel =
  customerPortalMode === 'PROJECT_ACTIVE'
    ? 'Project Active Customer'
    : customerPortalMode === 'AFTER_SALES'
      ? 'After-Sales / Support Customer'
      : 'Customer Portal';

      const heroConfig = portalExperience?.hero || {};
const portalHeroBadge = heroConfig?.badge || portalModeLabel;
const portalHeroMessage = heroConfig?.message || '';

const sectionLabels = portalExperience?.sectionLabels || {};
const projectTrackerLabel = sectionLabels?.projectTracker || {};

  return (
    <main className="min-h-screen w-screen max-w-full overflow-x-hidden bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50 pb-24">
  <div className="mx-auto w-full max-w-full overflow-x-hidden px-4 py-5 lg:max-w-7xl">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold opacity-90">
                ☀ Solar Customer Portal
              </p>

              <h1 className="mt-3 text-3xl font-black md:text-5xl">
                Welcome, {customer.customerName || 'Customer'}
              </h1>

              <p className="mt-2 break-words text-sm text-white/90">
                Customer Code: {customer.customerCode || '-'} | K Number:{' '}
                {customer.electricityKNumber || '-'}
              </p>

              <p className="mt-3 inline-flex rounded-full bg-white/20 px-4 py-2 text-xs font-black text-white backdrop-blur">
  {portalHeroBadge}
</p>

{portalHeroMessage && (
  <p className="mt-3 max-w-3xl text-sm font-semibold text-white/90">
    {portalHeroMessage}
  </p>
)}
            </div>

            <div className="flex flex-wrap gap-2">
  <button
    onClick={() => setShowPasswordBox(!showPasswordBox)}
    className="rounded-2xl bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur hover:bg-white/30"
  >
    Change Password
  </button>

  <button
    onClick={logout}
    className="rounded-2xl bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur hover:bg-white/30"
  >
    Logout
  </button>
</div>
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
            <a href="/customer-portal/notifications">
  <HeroMiniCard
    title="Unread Updates"
    value={String(dashboard?.unreadNotifications || 0)}
  />
</a>
            <HeroMiniCard
              title="Current Status"
              value={primaryProject?.status || 'No Project'}
            />
          </div>
        </div>

        {showPasswordBox && (
  <div className="mt-4 rounded-[2rem] bg-white p-5 shadow-xl">
    <h2 className="text-xl font-black text-gray-900">
      Change Password
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Update your customer portal login password.
    </p>

    <div className="mt-4 grid gap-3 md:grid-cols-3">
      <input
        type={showPasswordText ? 'text' : 'password'}
        placeholder="Current Password"
        value={passwordForm.currentPassword}
        onChange={(e) =>
          setPasswordForm({
            ...passwordForm,
            currentPassword: e.target.value,
          })
        }
        className="rounded-2xl border p-3"
      />

      <input
        type={showPasswordText ? 'text' : 'password'}
        placeholder="New Password"
        value={passwordForm.newPassword}
        onChange={(e) =>
          setPasswordForm({
            ...passwordForm,
            newPassword: e.target.value,
          })
        }
        className="rounded-2xl border p-3"
      />

      <input
        type={showPasswordText ? 'text' : 'password'}
        placeholder="Confirm New Password"
        value={passwordForm.confirmPassword}
        onChange={(e) =>
          setPasswordForm({
            ...passwordForm,
            confirmPassword: e.target.value,
          })
        }
        className="rounded-2xl border p-3"
      />
    </div>

    <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-gray-600">
      <input
        type="checkbox"
        checked={showPasswordText}
        onChange={(e) => setShowPasswordText(e.target.checked)}
      />
      Show Password
    </label>

    <div className="mt-4 flex flex-wrap gap-3">
      <button
        onClick={changePassword}
        disabled={passwordSaving}
        className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
      >
        {passwordSaving ? 'Saving...' : 'Update Password'}
      </button>

      <button
        onClick={() => setShowPasswordBox(false)}
        className="rounded-2xl bg-gray-200 px-5 py-3 text-sm font-black text-gray-700"
      >
        Cancel
      </button>
    </div>
  </div>
)}

        <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <SectionTitle
      title="Recent Activity"
      subtitle="Latest updates from your project, payments, documents and support"
    />

    <a
      href="/customer-portal/notifications"
      className="rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white hover:bg-black"
    >
      View Updates
    </a>
  </div>

  <div className="mt-5 space-y-3">
    {activityFeed.length === 0 ? (
      <EmptyCard text="No recent activity yet." />
    ) : (
      activityFeed.map((item) => (
        <a
          key={item.id}
          href={item.link}
          className="flex items-start gap-4 rounded-3xl border bg-gray-50 p-4 transition hover:-translate-y-1 hover:bg-orange-50 hover:shadow"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow">
            {item.type}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-black text-gray-900">
              {item.title}
            </p>

            {item.text && (
              <p className="mt-1 text-sm text-gray-500">
                {item.text}
              </p>
            )}

            <p className="mt-2 text-xs font-semibold text-gray-400">
              {new Date(item.date).toLocaleString('en-IN')}
            </p>
          </div>
        </a>
      ))
    )}
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

                {quickActions.complaints && (
              <a href="/customer-portal/complaints">
  <ActionCard
    icon="🛠"
    title="Raise Complaint"
    text="Report generation, inverter, panel, subsidy, payment or service issue."
  />
</a>
)}

         {quickActions.payments && (
              <a href="/customer-portal/payments">
  <ActionCard
    icon="💳"
    title="Payments"
    text="View installments, company account details, UPI/QR and upload receipt."
  />
</a>
)}


      {quickActions.referrals && (
              <a href="/customer-portal/referrals">
  <ActionCard
    icon="🎁"
    title="Refer Customer"
    text="Refer new customer and track ₹5000 referral rewards."
  />
</a>
)}

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
  title={portalExperience?.title || 'Customer Services'}
  subtitle={
    portalExperience?.subtitle ||
    'Everything related to your solar plant in one place'
  }
/>

          <div className="mt-5 grid gap-5 md:grid-cols-3">

            {enabledSections.projectTracker && (
            <a href="/customer-portal/project-tracker">
  <ActionCard
  icon="📊"
  title={projectTrackerLabel?.title || 'Project Timeline'}
  text={
    projectTrackerLabel?.text ||
    'Track approval, installation, subsidy, electricity and completion progress.'
  }
/>
</a>
)}

     {enabledSections.workCalendar && (
  <a href="/customer-portal/work-calendar">
    <ActionCard
      icon="📅"
      title="Work Calendar"
      text="See upcoming work dates and request date changes."
    />
  </a>
)}

      {enabledSections.documents && (
            <a href="/customer-portal/documents">
  <ActionCard
    icon="📁"
    title="Documents Vault"
    text="View agreements, invoices, subsidy and electricity documents."
  />
</a>
)}

      {enabledSections.cleaning && (
            <a href="/customer-portal/cleaning-calendar">
  <ActionCard
    icon="🧽"
    title="Cleaning Calendar"
    text="Manage cleaning schedule and reminders."
  />
</a>
)}

{enabledSections.afterSalesServices && (
  <a href="/customer-portal/after-sales-services">
    <ActionCard
      icon="🧰"
      title="After-Sales Service"
      text="Request maintenance, warranty service, AMC and paid services."
    />
  </a>
)}

       {enabledSections.staffDirectory && (
            <a href="/customer-portal/staff-directory">
  <ActionCard
    icon="👷"
    title="Staff Directory"
    text="View project owner, manager, contractor and department contacts."
  />
</a>
)}

     {enabledSections.policies && (
            <a href="/customer-portal/policies">
  <ActionCard
    icon="📜"
    title="Policies"
    text="View customer policy, payment rules and project guidelines."
  />
</a>
)}
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
        {project.status !== 'COMPLETED' && !project.isLegacyProject && (
  <InfoLine label="Project Type" value={project.projectType} />
)}

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
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3">
  <p className="shrink-0 text-xs font-bold text-gray-500">
    {label}
  </p>

  <p className="min-w-0 break-words text-right text-sm font-black text-gray-800">
    {value || '-'}
  </p>
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
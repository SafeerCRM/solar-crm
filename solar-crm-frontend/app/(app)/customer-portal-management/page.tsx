'use client';

import Link from 'next/link';

const customerModuleCards = [
  {
    title: 'Customer Complaints',
    description: 'View, assign, update and close customer complaints.',
    href: '/customer-complaints',
    icon: '🛠',
    roles: 'Customer Manager / Project / Maintenance',
  },
  {
    title: 'Payment Receipts',
    description: 'Verify customer uploaded receipts, approve or reject with remarks.',
    href: '/customer-payment-receipts',
    icon: '💳',
    roles: 'Payment / Account / Customer Manager',
  },
  {
    title: 'Work Date Requests',
    description: 'Approve, reject or reschedule customer requested work dates.',
    href: '/customer-work-requests',
    icon: '📅',
    roles: 'Project / Customer Manager',
  },
  {
    title: 'Cleaning Reminders',
    description: 'Track cleaning requests, reminders and maintenance updates.',
    href: '/customer-cleaning-reminders',
    icon: '🧽',
    roles: 'Maintenance / Customer Manager',
  },
  {
    title: 'Customer Referrals',
    description: 'Track customer referrals, status and reward follow-up.',
    href: '/customer-referrals',
    icon: '🎁',
    roles: 'Marketing / Lead / Customer Manager',
  },
  {
    title: 'Customer-Facing Portal',
    description: 'Open customer portal web view for testing login and mobile layout.',
    href: '/customer-login',
    icon: '📱',
    roles: 'Testing / Handover',
  },
];

export default function CustomerPortalManagementPage() {
  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-xl">
        <p className="text-sm font-bold opacity-90">
          Aditya Solars CRM
        </p>

        <h1 className="mt-2 text-3xl font-black md:text-5xl">
          Customer Portal Management
        </h1>

        <p className="mt-3 max-w-3xl text-sm font-medium text-white/90">
          Manage customer complaints, payment receipts, work date requests,
          cleaning reminders, referrals and customer-facing portal testing from
          one place.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard title="Customer Portal" value="Live" />
        <SummaryCard title="Complaint Timeline" value="Enabled" />
        <SummaryCard title="Payment Accounts" value="Portal Settings" />
      </section>

      <section className="rounded-3xl bg-white p-6 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              Customer Work Center
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Use these sections to handle all customer portal activities.
            </p>
          </div>

          <Link
            href="/settings/portal"
            className="rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white hover:bg-black"
          >
            Portal Settings
          </Link>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {customerModuleCards.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-3xl border bg-gray-50 p-5 transition hover:-translate-y-1 hover:border-orange-300 hover:bg-orange-50 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow">
                  {item.icon}
                </div>

                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm text-gray-600">
                    {item.description}
                  </p>

                  <p className="mt-3 text-xs font-bold text-orange-600">
                    {item.roles}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow">
        <h2 className="text-2xl font-black text-gray-900">
          Handover Checklist
        </h2>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ChecklistItem text="Customer login and dashboard opens correctly" />
          <ChecklistItem text="Customer complaints with photo/audio timeline tested" />
          <ChecklistItem text="Payment receipt upload and verification flow tested" />
          <ChecklistItem text="Work date request approval/rejection visible to customer" />
          <ChecklistItem text="Cleaning reminder request and status update tested" />
          <ChecklistItem text="Notifications read/unread counts tested" />
          <ChecklistItem text="Documents open/download on web and APK" />
          <ChecklistItem text="Customer APK created and tested separately" />
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <p className="text-sm font-bold text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-gray-900">{value}</p>
    </div>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4 text-sm font-bold text-gray-700">
      ✅ {text}
    </div>
  );
}
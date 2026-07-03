'use client';

import Link from 'next/link';

const sections = [
  {
    title: 'Staff Directory',
    href: '/staff',
    description: 'Staff profiles, photos, vault, documents, assets and birthdays.',
  },
  {
    title: 'Attendance',
    href: '/staff/attendance',
    description: 'HR attendance register, GPS photos, punch in/out and working hours.',
  },
  {
    title: 'Leave Management',
    href: '/staff/leaves',
    description: 'Create, approve, reject, hide and restore staff leave records.',
  },
  {
    title: 'Employee Policies',
    href: '/staff/policies',
    description: 'Upload and manage policies visible in Employee Portal.',
  },
  {
    title: 'HR Settings',
    href: '/staff/hr-settings',
    description: 'Attendance, salary, incentive, penalty and holiday rules.',
    disabled: false,
  },
  {
    title: 'Payroll',
    href: '/staff/payroll',
    description: 'Attendance-based salary, deductions, incentives and owner override.',
    disabled: false,
  },
  {
    title: 'Incentives',
    href: '/staff/incentives',
    description: 'Role-wise incentive eligibility and slabs.',
    disabled: false,
  },
  {
    title: 'Penalties',
    href: '#',
    description: 'Late, absence, deadline miss and custom penalty management.',
    disabled: true,
  },
  {
    title: 'Recruitment',
    href: '#',
    description: 'Branch-wise hiring process, candidates and stages.',
    disabled: true,
  },
];

export default function HrPortalPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">HR Portal</h1>
        <p className="mt-1 text-sm text-gray-500">
          Central HR management for staff, attendance, leave, policies, payroll,
          incentives, penalties and recruitment.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <div
            key={section.title}
            className={`rounded-2xl border bg-white p-5 shadow ${
              section.disabled ? 'opacity-60' : ''
            }`}
          >
            <h2 className="text-lg font-bold text-gray-800">
              {section.title}
            </h2>

            <p className="mt-2 min-h-12 text-sm text-gray-500">
              {section.description}
            </p>

            {section.disabled ? (
              <button
                disabled
                className="mt-4 rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-500"
              >
                Coming Soon
              </button>
            ) : (
              <Link
                href={section.href}
                className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Open
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
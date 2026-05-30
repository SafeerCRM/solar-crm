'use client';

import Link from 'next/link';

const reportCards = [
  {
    title: 'Expenditure Report',
    description:
      'View approved and pending expenses by type, date, branch and project owner.',
    status: 'Phase 1C',
  },
  {
    title: 'Monthly Profit Report',
    description:
      'Compare customer collections against approved expenses month wise.',
    status: 'Phase 1D',
  },
  {
    title: 'Branch Wise Profit',
    description:
      'Review collections, expenses and profit branch wise.',
    status: 'Phase 1E',
  },
  {
    title: 'Project Owner Wise Profit',
    description:
      'Track collections, expenses and profitability by project owner.',
    status: 'Phase 1F',
  },
  {
    title: 'Salary Report',
    description:
      'Track salary and advance salary expenses.',
    status: 'Phase 1G',
  },
  {
    title: 'Incentive Report',
    description:
      'Track incentive expenses and future incentive workflows.',
    status: 'Phase 1G',
  },
];

export default function AccountsReportsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Accounts Reports
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              EPC expenditure, profit, branch wise, project owner wise,
              salary and incentive reports.
            </p>
          </div>

          <Link
            href="/project/accounts"
            className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back to Accounts
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportCards.map((report) => (
          <div
            key={report.title}
            className="rounded-2xl bg-white p-5 shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-800">
                {report.title}
              </h2>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {report.status}
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-500">
              {report.description}
            </p>

            <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-500">
              Report implementation pending.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
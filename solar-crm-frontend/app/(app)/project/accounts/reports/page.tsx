'use client';

export default function AccountsReportsPage() {
  const reports = [
    {
      title: 'Monthly Profit Report',
      phase: 'Phase 2',
    },
    {
      title: 'Branch Wise Profit Report',
      phase: 'Phase 2',
    },
    {
      title: 'Project Owner Wise Profit Report',
      phase: 'Phase 2',
    },
    {
      title: 'Expenditure Report',
      phase: 'Phase 2',
    },
    {
      title: 'Salary Report',
      phase: 'Phase 3',
    },
    {
      title: 'Incentive Report',
      phase: 'Phase 3',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Accounts Reports
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Financial, profit and expenditure reporting center.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <div
            key={report.title}
            className="rounded-2xl bg-white p-5 shadow"
          >
            <h2 className="text-lg font-bold text-gray-800">
              {report.title}
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              {report.phase} Implementation
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
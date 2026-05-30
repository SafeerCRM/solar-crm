'use client';

import Link from 'next/link';

const cards = [
  {
    title: 'EPC Account',
    description:
      'Client payments, project collections, contractor, labour and project expenses.',
    href: '/project/accounts/epc',
    status: 'Next',
  },
  {
    title: 'Trading Account',
    description:
      'Dealer payments, vendor purchases, trading sales and trading expenses.',
    href: '/project/accounts/trading',
    status: 'Planned',
  },
  {
    title: 'Reports',
    description:
      'Monthly profit, branch-wise profit, owner-wise profit and expenditure reports.',
    href: '/project/accounts/reports',
    status: 'Planned',
  },
  {
    title: 'Stock Management',
    description:
      'Incoming stock, outgoing stock, warehouse stock and branch-wise material availability.',
    href: '/project/accounts/stock',
    status: 'Planned',
  },
  {
    title: 'Ledger',
    description:
      'Existing party-wise debit, credit, receivables and payables ledger.',
    href: '/project/accounts/ledger',
    status: 'Active',
  },
];

export default function AccountsHomePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Accounts
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage EPC accounts, trading accounts, reports, stock and ledger from one place.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="block rounded-2xl bg-white p-5 shadow transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-800">
                {card.title}
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  card.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : card.status === 'Next'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                }`}
              >
                {card.status}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl bg-blue-50 p-5">
        <h2 className="text-lg font-bold text-blue-800">
          Current Implementation Route
        </h2>

        <p className="mt-2 text-sm leading-6 text-blue-700">
          First we will complete EPC Account using existing project, payment collection
          and ledger data. After that, Trading Account, Reports and Stock Management
          will be connected phase by phase.
        </p>
      </div>
    </div>
  );
}
'use client';

export default function TradingAccountPage() {
  const sections = [
    {
      title: 'Dealer Payments',
      phase: 'Phase 3',
    },
    {
      title: 'Vendor Payments',
      phase: 'Phase 3',
    },
    {
      title: 'Trading Ledger',
      phase: 'Phase 3',
    },
    {
      title: 'Material Billing',
      phase: 'Phase 4',
    },
    {
      title: 'Trading Profit Reports',
      phase: 'Phase 4',
    },
    {
      title: 'Dealer Orders',
      phase: 'Phase 5',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Trading Account
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Dealer payments, vendor purchases, trading sales and profit management.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl bg-white p-5 shadow"
          >
            <h2 className="text-lg font-bold text-gray-800">
              {item.title}
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              {item.phase} Implementation
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
'use client';

export default function StockManagementPage() {
  const sections = [
    {
      title: 'Incoming Stock',
      phase: 'Phase 4',
    },
    {
      title: 'Outgoing Stock',
      phase: 'Phase 4',
    },
    {
      title: 'Warehouse Stock',
      phase: 'Phase 4',
    },
    {
      title: 'Branch Wise Stock',
      phase: 'Phase 4',
    },
    {
      title: 'Material Availability',
      phase: 'Phase 5',
    },
    {
      title: 'Stock Reports',
      phase: 'Phase 5',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Stock Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Inventory, warehouse, branch stock and material availability management.
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
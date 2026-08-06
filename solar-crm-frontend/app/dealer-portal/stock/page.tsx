'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const splitBrandTags = (value: any) => {
  return String(value || '')
    .split(/[,/|+]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeDealerCategory = (value: any) => {
  const category = String(value || '')
    .trim()
    .toUpperCase();

  if (
    [
      'PANELS',
      'INVERTERS',
      'STRUCTURE',
      'ELECTRICAL',
      'BATTERIES',
    ].includes(category)
  ) {
    return category;
  }

  return 'OTHER';
};

export default function DealerStockPage() {
  const [stock, setStock] = useState<any[]>([]);
  const [kits, setKits] = useState<any[]>([]);
const [viewMode, setViewMode] = useState<'KITS' | 'MATERIALS'>('KITS');
const [expandedKitId, setExpandedKitId] = useState<number | null>(null);
  const [dealer, setDealer] = useState<any>(null);
  const [search, setSearch] = useState('');
const [branch, setBranch] = useState('');

const [panelBrand, setPanelBrand] = useState('');
const [inverterBrand, setInverterBrand] = useState('');
const [batteryBrand, setBatteryBrand] = useState('');

const [materialCategory, setMaterialCategory] =
  useState<
    | 'ALL'
    | 'PANELS'
    | 'INVERTERS'
    | 'STRUCTURE'
    | 'ELECTRICAL'
    | 'BATTERIES'
    | 'OTHER'
  >('ALL');

const [stockLoading, setStockLoading] = useState(true);
const [kitsLoading, setKitsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dealer_token');
    const savedDealer = localStorage.getItem('dealer');

    if (!token || !savedDealer) {
      window.location.href = '/dealer-login';
      return;
    }

    setDealer(JSON.parse(savedDealer));
    loadStock(token);
    loadKits(token);
  }, []);

  const loadStock = async (token: string) => {
  try {
    setStockLoading(true);

    const res = await fetch(
      `${API_BASE_URL}/dealer-auth/stock`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json();

    setStock(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error(error);
  } finally {
    setStockLoading(false);
  }
};

  const loadKits = async (token: string) => {
  try {
    setKitsLoading(true);

    const res = await fetch(
      `${API_BASE_URL}/dealer-auth/kits`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json();

    setKits(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error(error);
  } finally {
    setKitsLoading(false);
  }
};

  const branches = useMemo(() => {
    return Array.from(
      new Set(stock.map((item) => item.branchName).filter(Boolean)),
    );
  }, [stock]);

  const panelBrandOptions = useMemo(() => {
  return Array.from(
    new Set(
      kits.flatMap((kit) =>
        splitBrandTags(kit.panelBrand),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b));
}, [kits]);

const inverterBrandOptions = useMemo(() => {
  return Array.from(
    new Set(
      kits.flatMap((kit) =>
        splitBrandTags(kit.inverterBrand),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b));
}, [kits]);

const batteryBrandOptions = useMemo(() => {
  return Array.from(
    new Set(
      kits.flatMap((kit) =>
        splitBrandTags(kit.batteryBrand),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b));
}, [kits]);

  const filteredStock = useMemo(() => {
    const q = search.toLowerCase();

    return stock.filter((item) => {
      const matchesSearch =
        !q ||
        String(item.materialName || '').toLowerCase().includes(q) ||
        String(item.category || '').toLowerCase().includes(q) ||
        String(item.brand || '').toLowerCase().includes(q) ||
        String(item.hsnCode || '').toLowerCase().includes(q);

      const matchesBranch = !branch || item.branchName === branch;

      return matchesSearch && matchesBranch;
    });
  }, [stock, search, branch]);

  const filteredKits = useMemo(() => {
  const q = search.trim().toLowerCase();

  return kits.filter((kit) => {
    const searchableText = [
      kit.kitName,
      kit.shortDescription,
      kit.displayBrand,
      kit.displayCapacity,
      kit.panelBrand,
      kit.inverterBrand,
      kit.batteryBrand,
      ...(Array.isArray(kit.items)
        ? kit.items.flatMap((item: any) => [
            item.material,
            item.brandSizeType,
            item.quantity,
          ])
        : []),
    ]
      .map((value) =>
        String(value || '').toLowerCase(),
      )
      .join(' ');

    const kitPanelBrands = splitBrandTags(
      kit.panelBrand,
    ).map((item) => item.toLowerCase());

    const kitInverterBrands = splitBrandTags(
      kit.inverterBrand,
    ).map((item) => item.toLowerCase());

    const kitBatteryBrands = splitBrandTags(
      kit.batteryBrand,
    ).map((item) => item.toLowerCase());

    const matchesSearch =
      !q || searchableText.includes(q);

    const matchesPanel =
      !panelBrand ||
      kitPanelBrands.includes(
        panelBrand.toLowerCase(),
      );

    const matchesInverter =
      !inverterBrand ||
      kitInverterBrands.includes(
        inverterBrand.toLowerCase(),
      );

    const matchesBattery =
      !batteryBrand ||
      kitBatteryBrands.includes(
        batteryBrand.toLowerCase(),
      );

    return (
      matchesSearch &&
      matchesPanel &&
      matchesInverter &&
      matchesBattery
    );
  });
}, [
  kits,
  search,
  panelBrand,
  inverterBrand,
  batteryBrand,
]);

const groupedMaterials = useMemo(() => {
  const groups: Record<string, any[]> = {
    PANELS: [],
    INVERTERS: [],
    STRUCTURE: [],
    ELECTRICAL: [],
    BATTERIES: [],
    OTHER: [],
  };

  for (const item of filteredStock) {
    const category = normalizeDealerCategory(
      item.dealerCategory,
    );

    groups[category].push(item);
  }

  return groups;
}, [filteredStock]);

const materialSections = [
  {
    key: 'PANELS',
    title: 'Panels',
    description: 'DC solar modules and panel stock',
  },
  {
    key: 'INVERTERS',
    title: 'Inverters',
    description: 'Solar and hybrid inverter stock',
  },
  {
    key: 'STRUCTURE',
    title: 'Structure',
    description: 'Pipes, mounting and structural accessories',
  },
  {
    key: 'ELECTRICAL',
    title: 'Electrical',
    description: 'Wires, cables, earthing and electrical accessories',
  },
  {
    key: 'BATTERIES',
    title: 'Batteries',
    description: 'Battery stock for hybrid systems',
  },
  {
    key: 'OTHER',
    title: 'Other Materials',
    description: 'Materials awaiting dealer-category assignment',
  },
];

const materialCategoryOptions = [
  {
    key: 'ALL',
    label: 'All',
  },
  {
    key: 'PANELS',
    label: 'Panels',
  },
  {
    key: 'INVERTERS',
    label: 'Inverters',
  },
  {
    key: 'STRUCTURE',
    label: 'Structure',
  },
  {
    key: 'ELECTRICAL',
    label: 'Electrical',
  },
  {
    key: 'BATTERIES',
    label: 'Batteries',
  },
  {
    key: 'OTHER',
    label: 'Other',
  },
] as const;

const visibleMaterialSections = useMemo(() => {
  if (materialCategory === 'ALL') {
    return materialSections;
  }

  return materialSections.filter(
    (section) =>
      section.key === materialCategory,
  );
}, [materialCategory]);

  return (
    <main className="min-h-screen w-screen max-w-full overflow-x-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-orange-500/25 blur-3xl" />
<div className="pointer-events-none fixed right-[-120px] top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-full overflow-x-hidden px-4 py-6 lg:max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <a href="/dealer-portal" className="text-sm font-black text-orange-300">
                ← Back to Dashboard
              </a>

              <h1 className="mt-3 text-3xl font-black md:text-4xl">
                Company Stock & Dealer Rates
              </h1>

              <p className="mt-1 text-sm text-white/60">
                View available material, HSN, GST and selling price.
              </p>
            </div>

            <a
              href="/dealer-portal/orders/create"
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg"
            >
              Create Order
            </a>
          </div>

          <div
  className={`mt-5 grid gap-3 ${
    viewMode === 'KITS'
      ? 'md:grid-cols-2 xl:grid-cols-5'
      : 'md:grid-cols-3'
  }`}
>
  <input
    type="text"
    placeholder={
      viewMode === 'KITS'
        ? 'Search kit, brand, capacity...'
        : 'Search material, brand, HSN...'
    }
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
  />

  {viewMode === 'KITS' && (
    <>
      <select
        value={panelBrand}
        onChange={(e) =>
          setPanelBrand(e.target.value)
        }
        className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
      >
        <option value="">
          All Panel Brands
        </option>

        {panelBrandOptions.map((brandName) => (
          <option
            key={brandName}
            value={brandName}
          >
            {brandName}
          </option>
        ))}
      </select>

      <select
        value={inverterBrand}
        onChange={(e) =>
          setInverterBrand(e.target.value)
        }
        className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
      >
        <option value="">
          All Inverter Brands
        </option>

        {inverterBrandOptions.map((brandName) => (
          <option
            key={brandName}
            value={brandName}
          >
            {brandName}
          </option>
        ))}
      </select>

      <select
        value={batteryBrand}
        onChange={(e) =>
          setBatteryBrand(e.target.value)
        }
        className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
      >
        <option value="">
          All Battery Brands
        </option>

        {batteryBrandOptions.map((brandName) => (
          <option
            key={brandName}
            value={brandName}
          >
            {brandName}
          </option>
        ))}
      </select>
    </>
  )}

  {viewMode === 'MATERIALS' && (
    <select
      value={branch}
      onChange={(e) =>
        setBranch(e.target.value)
      }
      className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
    >
      <option value="">All Branches</option>

      {branches.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  )}

  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black">
  {viewMode === 'KITS' && kitsLoading
    ? 'Loading kits...'
    : viewMode === 'MATERIALS' && stockLoading
      ? 'Loading materials...'
      : `Showing ${
          viewMode === 'KITS'
            ? filteredKits.length
            : filteredStock.length
        } / ${
          viewMode === 'KITS'
            ? kits.length
            : stock.length
        } items`}
</div>
</div>
        </header>

        <div className="mt-6 flex gap-2">
  <button
    onClick={() => {
  setViewMode('KITS');
  setBranch('');
}}
    className={`rounded-2xl px-5 py-3 text-sm font-black ${
      viewMode === 'KITS'
        ? 'bg-orange-400 text-slate-950'
        : 'bg-white/10 text-white'
    }`}
  >
    Kits
  </button>

  <button
    onClick={() => {
  setViewMode('MATERIALS');

  setPanelBrand('');
  setInverterBrand('');
  setBatteryBrand('');

  setMaterialCategory('ALL');
}}
    className={`rounded-2xl px-5 py-3 text-sm font-black ${
      viewMode === 'MATERIALS'
        ? 'bg-orange-400 text-slate-950'
        : 'bg-white/10 text-white'
    }`}
  >
    Materials
  </button>
</div>

        {(viewMode === 'KITS'
  ? kitsLoading
  : stockLoading) ? (
  <div className="mt-6 rounded-3xl bg-white p-8 text-center font-black text-slate-900">
    {viewMode === 'KITS'
      ? 'Loading kits...'
      : 'Loading materials...'}
  </div>
) : (
          <div className="mt-6">
  {viewMode === 'KITS' && (
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {filteredKits.map((kit) => (
        <KitCard
          key={kit.id}
          kit={kit}
          expanded={expandedKitId === kit.id}
          onToggle={() =>
            setExpandedKitId(
              expandedKitId === kit.id
                ? null
                : kit.id,
            )
          }
        />
      ))}

      {!filteredKits.length && (
        <div className="rounded-3xl border border-dashed border-white/20 bg-white/10 p-8 text-center text-white/70 md:col-span-2 xl:col-span-3">
          No kit found for the selected brands.
        </div>
      )}
    </section>
  )}

  {viewMode === 'MATERIALS' && (
  <div className="space-y-6">
    <div className="flex gap-2 overflow-x-auto pb-2">
      {materialCategoryOptions.map(
        (option) => {
          const categoryCount =
            option.key === 'ALL'
              ? filteredStock.length
              : (
                  groupedMaterials[
                    option.key
                  ] || []
                ).length;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() =>
                setMaterialCategory(
                  option.key,
                )
              }
              className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition ${
                materialCategory ===
                option.key
                  ? 'bg-orange-400 text-slate-950'
                  : 'border border-white/10 bg-white/10 text-white'
              }`}
            >
              {option.label}
              <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs">
                {categoryCount}
              </span>
            </button>
          );
        },
      )}
    </div>

    <div className="space-y-8">
      {visibleMaterialSections.map((section) => {
        const sectionItems =
          groupedMaterials[section.key] || [];

        if (!sectionItems.length) {
          return null;
        }

        return (
          <section
            key={section.key}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-4 md:p-5"
          >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">
                  {section.title}
                </h2>

                <p className="mt-1 text-sm text-white/60">
                  {section.description}
                </p>
              </div>

              <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black">
                {sectionItems.length} items
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {sectionItems.map((item) => (
                <StockCard
                  key={`${item.materialId}-${item.branchName}`}
                  item={item}
                />
              ))}
            </div>
          </section>
        );
      })}

            {!filteredStock.length && (
        <div className="rounded-3xl border border-dashed border-white/20 bg-white/10 p-8 text-center text-white/70">
          No stock item found.
        </div>
      )}

      {filteredStock.length > 0 &&
        materialCategory !== 'ALL' &&
        !(
          groupedMaterials[
            materialCategory
          ] || []
        ).length && (
          <div className="rounded-3xl border border-dashed border-white/20 bg-white/10 p-8 text-center text-white/70">
            No material is assigned to this
            category yet.
          </div>
        )}
    </div>
  </div>
)}
</div>
        )}
      </div>
    </main>
  );
}

function KitCard({
  kit,
  expanded,
  onToggle,
}: {
  kit: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="group overflow-hidden rounded-[2rem] bg-white text-slate-900 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="h-2 bg-gradient-to-r from-orange-500 via-yellow-400 to-blue-600" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-black">{kit.kitName}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {kit.shortDescription || '-'}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {kit.displayBrand || '-'} · {kit.displayCapacity || '-'}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
  {kit.panelBrand && (
    <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black text-blue-700">
      Panel: {kit.panelBrand}
    </span>
  )}

  {kit.inverterBrand && (
    <span className="rounded-full bg-purple-100 px-2 py-1 text-[10px] font-black text-purple-700">
      Inverter: {kit.inverterBrand}
    </span>
  )}

  {kit.batteryBrand && (
    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">
      Battery: {kit.batteryBrand}
    </span>
  )}
</div>
          </div>

          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
            Available
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <InfoBox
            label="Kit Price"
            value={`₹${Number(kit.sellingPrice || 0).toLocaleString('en-IN')}`}
          />
          <InfoBox
  label="GST"
  value={
    kit.gstMode === 'INCLUDING'
      ? 'Included'
      : `${Number(kit.gstPercent || 0)}%`
  }
/>
        </div>

        {expanded && (
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-black">Kit Details</p>

            <div className="mt-3 space-y-2">
              {Array.isArray(kit.items) && kit.items.length ? (
                kit.items.map((item: any) => (
                  <div key={item.id} className="rounded-xl bg-white p-3 text-sm">
                    <p className="font-black">{item.material || '-'}</p>
                    <p className="text-slate-500">
                      {item.brandSizeType || '-'} | Qty: {item.quantity || '-'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No kit details added.</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-2xl bg-slate-100 py-3 text-sm font-black text-slate-800"
          >
            {expanded ? 'Hide Details' : 'View Details'}
          </button>

          <a
            href="/dealer-portal/orders/create"
            className="rounded-2xl bg-gradient-to-r from-blue-700 to-sky-500 py-3 text-center text-sm font-black text-white shadow-lg transition group-hover:scale-[1.01]"
          >
            Add to Order
          </a>
        </div>
      </div>
    </div>
  );
}

function StockCard({ item }: { item: any }) {
  const available = Number(item.availableQuantity || 0);
  const stockTone =
    available <= 0
      ? 'bg-red-100 text-red-700'
      : available <= 5
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-emerald-100 text-emerald-700';

  return (
    <div className="group overflow-hidden rounded-[2rem] bg-white text-slate-900 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="h-2 bg-gradient-to-r from-blue-700 via-sky-500 to-orange-400" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-black">{item.materialName}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {item.category || 'Uncategorized'} · {item.brand || 'No brand'}
            </p>
          </div>

          <span className={`rounded-full px-3 py-1 text-xs font-black ${stockTone}`}>
            {available > 0 ? `${available} ${item.unit || ''}` : 'Out of Stock'}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
  {item.dealerCategory === 'PANELS' &&
    Number(item.ratePerWatt || 0) > 0 && (
      <div className="col-span-2 rounded-2xl bg-green-50 p-3">
        <p className="text-xs font-bold text-green-600">
          Dealer Panel Rate
        </p>

        <p className="mt-1 text-lg font-black text-green-700">
          ₹
          {Number(
            item.ratePerWatt || 0,
          ).toLocaleString('en-IN')}
          /Watt + GST
        </p>
      </div>
    )}

  <InfoBox
    label="Without GST"
    value={`₹${Number(
      item.sellingRateWithoutGst || 0,
    ).toLocaleString('en-IN')}`}
  />

  <InfoBox
    label="With GST"
    value={`₹${Number(
      item.sellingRateWithGst || 0,
    ).toLocaleString('en-IN')}`}
  />

  <InfoBox
    label="GST"
    value={`${Number(
      item.gstPercent || 0,
    )}%`}
  />

  <InfoBox
    label="HSN"
    value={item.hsnCode || '-'}
  />
</div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-400">Branch</p>
          <p className="mt-1 font-black">{item.branchName || 'Company Stock'}</p>
        </div>

        <a
          href="/dealer-portal/orders/create"
          className="mt-5 block rounded-2xl bg-gradient-to-r from-blue-700 to-sky-500 py-3 text-center text-sm font-black text-white shadow-lg transition group-hover:scale-[1.01]"
        >
          Add to Order
        </a>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}
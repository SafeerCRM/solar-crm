'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DealerStockPage() {
  const [stock, setStock] = useState<any[]>([]);
  const [kits, setKits] = useState<any[]>([]);
const [viewMode, setViewMode] = useState<'KITS' | 'MATERIALS'>('KITS');
const [expandedKitId, setExpandedKitId] = useState<number | null>(null);
  const [dealer, setDealer] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [loading, setLoading] = useState(true);

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
      const res = await fetch(`${API_BASE_URL}/dealer-auth/stock`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setStock(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadKits = async (token: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/dealer-auth/kits`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setKits(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error(error);
  }
};

  const branches = useMemo(() => {
    return Array.from(
      new Set(stock.map((item) => item.branchName).filter(Boolean)),
    );
  }, [stock]);

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
  const q = search.toLowerCase();

  return kits.filter((kit) => {
    return (
      !q ||
      String(kit.kitName || '').toLowerCase().includes(q) ||
      String(kit.shortDescription || '').toLowerCase().includes(q) ||
      String(kit.displayBrand || '').toLowerCase().includes(q) ||
      String(kit.displayCapacity || '').toLowerCase().includes(q)
    );
  });
}, [kits, search]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-orange-500/25 blur-3xl" />
      <div className="absolute right-[-120px] top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-6">
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

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <input
              type="text"
              placeholder="Search material, brand, HSN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            />

            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            >
              <option value="">All Branches</option>
              {branches.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black">
              Showing {viewMode === 'KITS' ? filteredKits.length : filteredStock.length} / {viewMode === 'KITS' ? kits.length : stock.length} items
            </div>
          </div>
        </header>

        <div className="mt-6 flex gap-2">
  <button
    onClick={() => setViewMode('KITS')}
    className={`rounded-2xl px-5 py-3 text-sm font-black ${
      viewMode === 'KITS'
        ? 'bg-orange-400 text-slate-950'
        : 'bg-white/10 text-white'
    }`}
  >
    Kits
  </button>

  <button
    onClick={() => setViewMode('MATERIALS')}
    className={`rounded-2xl px-5 py-3 text-sm font-black ${
      viewMode === 'MATERIALS'
        ? 'bg-orange-400 text-slate-950'
        : 'bg-white/10 text-white'
    }`}
  >
    Materials
  </button>
</div>

        {loading ? (
          <div className="mt-6 rounded-3xl bg-white p-8 text-center font-black text-slate-900">
            Loading stock...
          </div>
        ) : (
          <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
  {viewMode === 'KITS' &&
    filteredKits.map((kit) => (
      <KitCard
        key={kit.id}
        kit={kit}
        expanded={expandedKitId === kit.id}
        onToggle={() =>
          setExpandedKitId(expandedKitId === kit.id ? null : kit.id)
        }
      />
    ))}

  {viewMode === 'MATERIALS' &&
    filteredStock.map((item) => (
      <StockCard key={`${item.materialId}-${item.branchName}`} item={item} />
    ))}

  {viewMode === 'KITS' && !filteredKits.length && (
    <div className="rounded-3xl border border-dashed border-white/20 bg-white/10 p-8 text-center text-white/70 md:col-span-2 xl:col-span-3">
      No kit found.
    </div>
  )}

  {viewMode === 'MATERIALS' && !filteredStock.length && (
    <div className="rounded-3xl border border-dashed border-white/20 bg-white/10 p-8 text-center text-white/70 md:col-span-2 xl:col-span-3">
      No stock item found.
    </div>
  )}
</section>
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
          <InfoBox label="Without GST" value={`₹${Number(item.sellingRateWithoutGst || 0).toLocaleString('en-IN')}`} />
          <InfoBox label="With GST" value={`₹${Number(item.sellingRateWithGst || 0).toLocaleString('en-IN')}`} />
          <InfoBox label="GST" value={`${Number(item.gstPercent || 0)}%`} />
          <InfoBox label="HSN" value={item.hsnCode || '-'} />
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
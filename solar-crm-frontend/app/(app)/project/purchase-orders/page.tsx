'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type PurchaseItem = {
  id: number;
  projectId: number;
  materialName: string;
  category?: string;
  unit?: string;
  brand?: string;
  rate?: number;
  quantity?: number;
  purchasedQuantity?: number;
  pendingQuantity?: number;
  totalAmount?: number;
  purchaseStatus?: string;
  projectCustomerName?: string;
projectBranchName?: string;
projectOwnerId?: number;
projectOwnerName?: string;
projectOwnerRole?: string;
projectCity?: string;
projectZone?: string;
  createdAt?: string;
};

type ProjectOwner = {
  projectOwnerId: number;
  projectOwnerName?: string;
  projectOwnerRole?: string;
};

export default function PurchaseOrdersPage() {
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [buyQty, setBuyQty] = useState<Record<number, string>>({});
  const [projectFilter, setProjectFilter] = useState('');
const [materialFilter, setMaterialFilter] = useState('');
const [statusFilter, setStatusFilter] = useState('');
const [branchFilter, setBranchFilter] = useState('');
const [ownerFilter, setOwnerFilter] = useState('');
const [projectOwners, setProjectOwners] = useState<ProjectOwner[]>([]);
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

const [summary, setSummary] = useState({
  totalPendingItems: 0,
  totalPendingQuantity: 0,
  totalPendingAmount: 0,
  partiallyPurchasedCount: 0,
});

  const fetchPurchaseOrders = async () => {
  try {
    setLoading(true);

    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/purchase-orders`,
      {
        params: {
          page,
          limit: 20,
          search: `${projectFilter} ${materialFilter}`.trim(),
          status: statusFilter,
          branch: branchFilter,
          owner: ownerFilter,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setItems(res.data?.data || []);

    setSummary(
      res.data?.summary || {
        totalPendingItems: 0,
        totalPendingQuantity: 0,
        totalPendingAmount: 0,
        partiallyPurchasedCount: 0,
      },
    );

    setTotalPages(res.data?.totalPages || 1);
  } catch (error) {
    console.error(error);
    alert('Failed to load purchase orders');
  } finally {
    setLoading(false);
  }
};

const fetchProjectOwners = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/owners/list`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setProjectOwners(res.data || []);
  } catch (error) {
    console.error('Failed to load project owners:', error);
  }
};

  useEffect(() => {
  fetchPurchaseOrders();
}, [page, projectFilter, materialFilter, statusFilter, branchFilter, ownerFilter]);

useEffect(() => {
  fetchProjectOwners();
}, []);

  const filteredItems = items;

const getCategoryPendingSummary = (keyword: string) => {
  const matchedItems = filteredItems.filter((item) =>
    String(item.category || item.materialName || '')
      .toLowerCase()
      .includes(keyword.toLowerCase()),
  );

  const pendingQuantity = matchedItems.reduce(
    (sum, item) => sum + Number(item.pendingQuantity || 0),
    0,
  );

  const pendingAmount = matchedItems.reduce(
    (sum, item) =>
      sum +
      Number(item.pendingQuantity || 0) *
        Number(item.rate || 0),
    0,
  );

  return {
    pendingQuantity,
    pendingAmount,
  };
};

const panelSummary = getCategoryPendingSummary('panel');
const structureSummary = getCategoryPendingSummary('structure');
const inverterSummary = getCategoryPendingSummary('inverter');

const projectWiseSummary = Object.values(
  filteredItems.reduce((acc: any, item) => {
    const key = String(item.projectId);

    if (!acc[key]) {
      acc[key] = {
        projectId: item.projectId,
        customerName: item.projectCustomerName || '-',
        branchName: item.projectBranchName || '-',
        city: item.projectCity || '-',
        pendingItems: 0,
        pendingQuantity: 0,
        pendingAmount: 0,
        materials: [] as string[],
      };
    }

    acc[key].pendingItems += 1;

    acc[key].pendingQuantity += Number(
      item.pendingQuantity || 0,
    );

    acc[key].pendingAmount +=
      Number(item.pendingQuantity || 0) *
      Number(item.rate || 0);

    if (item.materialName) {
      acc[key].materials.push(item.materialName);
    }

    return acc;
  }, {}),
);

const totalPendingItems = filteredItems.length;

const totalPendingQuantity = filteredItems.reduce(
  (sum, item) => sum + Number(item.pendingQuantity || 0),
  0,
);

const totalPendingAmount = filteredItems.reduce(
  (sum, item) =>
    sum +
    Number(item.pendingQuantity || 0) *
      Number(item.rate || 0),
  0,
);

const partiallyPurchasedCount =
  filteredItems.filter(
    (item) =>
      item.purchaseStatus === 'PARTIALLY_PURCHASED',
  ).length;

  const buyItem = async (item: PurchaseItem, fullBuy = false) => {
    const quantity = fullBuy
      ? Number(item.pendingQuantity || 0)
      : Number(buyQty[item.id] || 0);

    if (!quantity || quantity <= 0) {
      alert('Enter valid buy quantity');
      return;
    }

    if (quantity > Number(item.pendingQuantity || 0)) {
      alert('Buy quantity cannot be more than pending quantity');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      await axios.patch(
        `${API_BASE_URL}/project/material-request-item/${item.id}/buy`,
        { quantity },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      alert('Material marked as purchased');

      setBuyQty({
        ...buyQty,
        [item.id]: '',
      });

      fetchPurchaseOrders();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to update purchase');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Purchase Orders
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Pending project material purchase requirements.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="mb-5 grid gap-3 md:grid-cols-5">
  <input
    placeholder="Filter by Project ID / Customer Name"
    value={projectFilter}
    onChange={(e) => {
  setProjectFilter(e.target.value);
  setPage(1);
}}
    className="rounded-xl border p-3"
  />

  <input
    placeholder="Filter by Material Name"
    value={materialFilter}
    onChange={(e) => {
  setMaterialFilter(e.target.value);
  setPage(1);
}}
    className="rounded-xl border p-3"
  />

  <input
  placeholder="Filter by Branch"
  value={branchFilter}
  onChange={(e) => {
  setBranchFilter(e.target.value);
  setPage(1);
}}
  className="rounded-xl border p-3"
/>

<select
  value={ownerFilter}
  onChange={(e) => {
    setOwnerFilter(e.target.value);
    setPage(1);
  }}
  className="rounded-xl border p-3"
>
  <option value="">All Project Owners</option>

  {projectOwners.map((owner) => (
    <option
      key={owner.projectOwnerId}
      value={owner.projectOwnerId}
    >
      {owner.projectOwnerName || 'Unnamed Owner'}
      {owner.projectOwnerRole
        ? ` (${owner.projectOwnerRole})`
        : ''}
    </option>
  ))}
</select>

  <select
    value={statusFilter}
    onChange={(e) => {
  setStatusFilter(e.target.value);
  setPage(1);
}}
    className="rounded-xl border p-3"
  >
    <option value="">All Status</option>
    <option value="PENDING">Pending</option>
    <option value="PARTIALLY_PURCHASED">Partially Purchased</option>
    <option value="PURCHASED">Purchased</option>
  </select>
</div>

<div className="mb-5 grid gap-3 md:grid-cols-4">
  <div className="rounded-xl bg-gray-50 p-4">
    <p className="text-sm text-gray-500">
      Pending Items
    </p>
    <p className="mt-1 text-2xl font-bold text-gray-800">
      {summary.totalPendingItems}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-4">
    <p className="text-sm text-gray-500">
      Pending Quantity
    </p>
    <p className="mt-1 text-2xl font-bold text-gray-800">
      {summary.totalPendingQuantity}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-4">
    <p className="text-sm text-gray-500">
      Pending Amount
    </p>
    <p className="mt-1 text-2xl font-bold text-green-700">
      ₹
      {Number(summary.totalPendingAmount).toLocaleString(
  'en-IN',
)}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-4">
    <p className="text-sm text-gray-500">
      Partial Purchases
    </p>
    <p className="mt-1 text-2xl font-bold text-yellow-700">
      {summary.partiallyPurchasedCount}
    </p>
  </div>
</div>

<div className="mb-5 rounded-2xl border p-4">
  <h2 className="mb-4 text-lg font-bold text-gray-800">
    Critical Procurement Summary
  </h2>

  <div className="grid gap-3 md:grid-cols-3">
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-sm text-gray-500">
        Panels Pending
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-800">
        {panelSummary.pendingQuantity}
      </p>
      <p className="mt-1 text-sm font-semibold text-green-700">
        ₹
        {panelSummary.pendingAmount.toLocaleString(
          'en-IN',
        )}
      </p>
    </div>

    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-sm text-gray-500">
        Structure Pending
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-800">
        {structureSummary.pendingQuantity}
      </p>
      <p className="mt-1 text-sm font-semibold text-green-700">
        ₹
        {structureSummary.pendingAmount.toLocaleString(
          'en-IN',
        )}
      </p>
    </div>

    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-sm text-gray-500">
        Inverters Pending
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-800">
        {inverterSummary.pendingQuantity}
      </p>
      <p className="mt-1 text-sm font-semibold text-green-700">
        ₹
        {inverterSummary.pendingAmount.toLocaleString(
          'en-IN',
        )}
      </p>
    </div>
  </div>
</div>

<div className="mb-5 rounded-2xl border p-4">
  <h2 className="mb-4 text-lg font-bold text-gray-800">
    Project-wise Purchase Summary
  </h2>

  {projectWiseSummary.length === 0 ? (
    <p className="text-sm text-gray-500">
      No project-wise pending summary found.
    </p>
  ) : (
    <div className="space-y-3">
      {projectWiseSummary.map((project: any) => (
        <div
          key={project.projectId}
          className="rounded-xl bg-gray-50 p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-bold text-gray-800">
                Project #{project.projectId} - {project.customerName}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {project.branchName} | {project.city}
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Materials:{' '}
                {Array.from(new Set(project.materials))
                  .slice(0, 5)
                  .join(', ')}
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm text-gray-500">
                Pending Items: {project.pendingItems}
              </p>

              <p className="text-sm text-gray-500">
                Pending Qty: {project.pendingQuantity}
              </p>

              <p className="text-lg font-bold text-green-700">
                ₹
                {Number(
                  project.pendingAmount || 0,
                ).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

        {loading ? (
          <p>Loading...</p>
        ) : filteredItems.length === 0? (
          <p className="text-sm text-gray-500">
            No pending purchase items found.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="rounded-2xl border p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      {item.materialName}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
  Project #{item.projectId} |{' '}
  {item.projectCustomerName || '-'} |{' '}
  {item.projectBranchName || '-'} |{' '}
  {item.projectCity || '-'} |{' '}
  {item.projectZone || '-'}
</p>

<p className="mt-1 text-sm text-blue-700">
  Project Owner:{' '}
  <span className="font-semibold">
    {item.projectOwnerName || 'Not Assigned'}
  </span>
</p>

<p className="mt-1 text-sm text-gray-500">
  {item.category || '-'} |{' '}
  {item.brand || '-'} |{' '}
  {item.unit || '-'}
</p>

                    <p className="mt-2 text-sm text-gray-700">
                      Requested: <b>{item.quantity || 0}</b> | Purchased:{' '}
                      <b>{item.purchasedQuantity || 0}</b> | Pending:{' '}
                      <b>{item.pendingQuantity || 0}</b>
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      Rate: ₹
                      {Number(item.rate || 0).toLocaleString('en-IN')} | Total:
                      ₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}
                    </p>

                    <p className="mt-2 inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                      {item.purchaseStatus || 'PENDING'}
                    </p>
                  </div>

                  <div className="w-full space-y-2 md:w-72">
                    <input
                      type="number"
                      placeholder="Partial buy quantity"
                      value={buyQty[item.id] || ''}
                      onChange={(e) =>
                        setBuyQty({
                          ...buyQty,
                          [item.id]: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border p-3"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => buyItem(item, false)}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Buy Partial
                      </button>

                      <button
                        onClick={() => buyItem(item, true)}
                        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Buy Full
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
  <p className="text-sm text-gray-600">
    Page {page} of {totalPages}
  </p>

  <div className="flex gap-2">
    <button
      onClick={() =>
        setPage((prev) => Math.max(prev - 1, 1))
      }
      disabled={page <= 1}
      className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
    >
      Previous
    </button>

    <button
      onClick={() =>
        setPage((prev) =>
          Math.min(prev + 1, totalPages),
        )
      }
      disabled={page >= totalPages}
      className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
    >
      Next
    </button>
  </div>
</div>

      </div>
    </div>
  );
}
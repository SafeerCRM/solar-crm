'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

const formatCurrency = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export default function StockManagementPage() {
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [materials, setMaterials] = useState<any[]>([]);
const [branches, setBranches] = useState<any[]>([]);

const [receiveLoading, setReceiveLoading] = useState(false);

const [issueLoading, setIssueLoading] = useState(false);

const [issueForm, setIssueForm] = useState({
  stockItemId: '',
  quantity: '',
  sourceType: 'MANUAL',
  projectId: '',
  remarks: '',
});

const [receiveForm, setReceiveForm] = useState({
  materialId: '',
  branchId: '',
  quantity: '',
  rate: '',
  sourceType: 'MANUAL',
  remarks: '',
});

  const [filters, setFilters] = useState({
    branch: '',
    material: '',
    showHidden: false,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [movements, setMovements] = useState<any[]>([]);
const [movementLoading, setMovementLoading] = useState(false);

const [movementFilters, setMovementFilters] = useState({
  material: '',
  branch: '',
  movementType: '',
  showHidden: false,
});

const [movementPagination, setMovementPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
});

  const loadStockItems = async (
    overridePage?: number,
    overrideFilters?: {
      branch: string;
      material: string;
      showHidden: boolean;
    },
  ) => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      const activePage =
        overridePage || pagination.page;

      const activeFilters =
        overrideFilters || filters;

      const res = await axios.get(
        `${API_BASE_URL}/project/stock/items`,
        {
          params: {
            page: activePage,
            limit: pagination.limit,
            branch:
              activeFilters.branch || undefined,
            material:
              activeFilters.material || undefined,
            showHidden: activeFilters.showHidden
              ? 'true'
              : undefined,
          },
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      setStockItems(
        Array.isArray(res.data?.data)
          ? res.data.data
          : [],
      );

      setPagination({
        page: Number(
          res.data?.pagination?.page || 1,
        ),
        limit: Number(
          res.data?.pagination?.limit || 20,
        ),
        total: Number(
          res.data?.pagination?.total || 0,
        ),
        totalPages: Number(
          res.data?.pagination?.totalPages || 1,
        ),
      });
    } catch (error) {
      console.error(error);
      alert('Failed to load stock items');
    } finally {
      setLoading(false);
    }
  };

  const loadStockMovements = async (
  overridePage?: number,
  overrideFilters?: {
    material: string;
    branch: string;
    movementType: string;
    showHidden: boolean;
  },
) => {
  try {
    setMovementLoading(true);

    const token = localStorage.getItem('token');

    const activePage =
      overridePage || movementPagination.page;

    const activeFilters =
      overrideFilters || movementFilters;

    const res = await axios.get(
      `${API_BASE_URL}/project/stock/movements`,
      {
        params: {
          page: activePage,
          limit: movementPagination.limit,
          material:
            activeFilters.material || undefined,
          branch:
            activeFilters.branch || undefined,
          movementType:
            activeFilters.movementType || undefined,
          showHidden: activeFilters.showHidden
            ? 'true'
            : undefined,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setMovements(
      Array.isArray(res.data?.data)
        ? res.data.data
        : [],
    );

    setMovementPagination({
      page: Number(
        res.data?.pagination?.page || 1,
      ),
      limit: Number(
        res.data?.pagination?.limit || 20,
      ),
      total: Number(
        res.data?.pagination?.total || 0,
      ),
      totalPages: Number(
        res.data?.pagination?.totalPages || 1,
      ),
    });
  } catch (error) {
    console.error(error);
    alert('Failed to load stock movements');
  } finally {
    setMovementLoading(false);
  }
};

  const loadMaterials = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/material-master`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setMaterials(Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.error(error);
  }
};

const loadBranches = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/branch`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setBranches(Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.error(error);
  }
};

const receiveStock = async () => {
  if (!receiveForm.materialId) {
    alert('Please select material');
    return;
  }

  if (!receiveForm.quantity) {
    alert('Please enter quantity');
    return;
  }

  try {
    setReceiveLoading(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/stock/receive`,
      {
        materialId: receiveForm.materialId,
        branchId: receiveForm.branchId || undefined,
        quantity: receiveForm.quantity,
        rate: receiveForm.rate || 0,
        sourceType: receiveForm.sourceType,
        remarks: receiveForm.remarks,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Stock received successfully');

    setReceiveForm({
      materialId: '',
      branchId: '',
      quantity: '',
      rate: '',
      sourceType: 'MANUAL',
      remarks: '',
    });

    await loadStockItems(1);
    await loadStockMovements(1);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to receive stock',
    );
  } finally {
    setReceiveLoading(false);
  }
};

const issueStock = async () => {
  if (!issueForm.stockItemId) {
    alert('Please select stock item');
    return;
  }

  if (!issueForm.quantity) {
    alert('Please enter quantity');
    return;
  }

  try {
    setIssueLoading(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/stock/issue`,
      {
        stockItemId: issueForm.stockItemId,
        quantity: issueForm.quantity,
        sourceType: issueForm.sourceType,
        projectId: issueForm.projectId || undefined,
        remarks: issueForm.remarks,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Stock issued successfully');

    setIssueForm({
      stockItemId: '',
      quantity: '',
      sourceType: 'MANUAL',
      projectId: '',
      remarks: '',
    });

    await loadStockItems(1);
    await loadStockMovements(1);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to issue stock',
    );
  } finally {
    setIssueLoading(false);
  }
};

const hideStockItem = async (stockItemId: number) => {
  const hiddenReason = window.prompt(
    'Enter hide reason',
  );

  if (!hiddenReason?.trim()) {
    return;
  }

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/stock/items/${stockItemId}/hide`,
      {
        hiddenReason,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Stock item hidden');

    await loadStockItems(1);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to hide stock item',
    );
  }
};

const restoreStockItem = async (stockItemId: number) => {
  const restoreReason = window.prompt(
    'Enter restore reason',
  );

  if (!restoreReason?.trim()) {
    return;
  }

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/stock/items/${stockItemId}/restore`,
      {
        restoreReason,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Stock item restored');

    await loadStockItems(1);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to restore stock item',
    );
  }
};

  useEffect(() => {
  loadStockItems(1);
  loadStockMovements(1);
  loadMaterials();
  loadBranches();
}, []);

  const totalQuantity = stockItems.reduce(
    (total, item) =>
      total + Number(item.currentQuantity || 0),
    0,
  );

  const totalStockValue = stockItems.reduce(
    (total, item) =>
      total + Number(item.stockValue || 0),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Stock Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Inventory, warehouse stock, branch stock and material availability management.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Visible Stock Items
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-800">
            {stockItems.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Total Quantity
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-700">
            {totalQuantity.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Stock Value
          </p>

          <p className="mt-2 text-2xl font-bold text-green-700">
            {formatCurrency(totalStockValue)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Total Records
          </p>

          <p className="mt-2 text-2xl font-bold text-purple-700">
            {pagination.total}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Incoming Stock
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Receive manual, opening or adjustment stock into branch inventory.
      </p>
    </div>

    <button
      type="button"
      onClick={receiveStock}
      disabled={receiveLoading}
      className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
    >
      {receiveLoading ? 'Receiving...' : 'Receive Stock'}
    </button>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-3">
    <select
      value={receiveForm.materialId}
      onChange={(e) =>
        setReceiveForm({
          ...receiveForm,
          materialId: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">Select Material</option>

      {materials.map((material: any) => (
        <option
          key={material.id}
          value={material.id}
        >
          {material.name}
          {material.brand ? ` - ${material.brand}` : ''}
          {material.unit ? ` (${material.unit})` : ''}
        </option>
      ))}
    </select>

    <select
      value={receiveForm.branchId}
      onChange={(e) =>
        setReceiveForm({
          ...receiveForm,
          branchId: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">Select Branch</option>

      {branches.map((branch: any) => (
        <option
          key={branch.id}
          value={branch.id}
        >
          {branch.name}
        </option>
      ))}
    </select>

    <select
      value={receiveForm.sourceType}
      onChange={(e) =>
        setReceiveForm({
          ...receiveForm,
          sourceType: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="MANUAL">Manual</option>
      <option value="OPENING_STOCK">Opening Stock</option>
      <option value="PURCHASE_ORDER">Purchase Order</option>
      <option value="RETURN">Return</option>
      <option value="ADJUSTMENT">Adjustment</option>
    </select>

    <input
      type="number"
      placeholder="Quantity"
      value={receiveForm.quantity}
      onChange={(e) =>
        setReceiveForm({
          ...receiveForm,
          quantity: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <input
      type="number"
      placeholder="Rate"
      value={receiveForm.rate}
      onChange={(e) =>
        setReceiveForm({
          ...receiveForm,
          rate: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <input
      type="text"
      placeholder="Remarks"
      value={receiveForm.remarks}
      onChange={(e) =>
        setReceiveForm({
          ...receiveForm,
          remarks: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />
  </div>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Outgoing Stock
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Issue material from available branch stock for project, damage, return or adjustment.
      </p>
    </div>

    <button
      type="button"
      onClick={issueStock}
      disabled={issueLoading}
      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
    >
      {issueLoading ? 'Issuing...' : 'Issue Stock'}
    </button>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-3">
    <select
      value={issueForm.stockItemId}
      onChange={(e) =>
        setIssueForm({
          ...issueForm,
          stockItemId: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">Select Stock Item</option>

      {stockItems.map((item: any) => (
        <option
          key={item.id}
          value={item.id}
        >
          {item.materialName}
          {item.branchName ? ` - ${item.branchName}` : ''}
          {` | Qty: ${Number(
            item.currentQuantity || 0,
          ).toLocaleString('en-IN')}`}
        </option>
      ))}
    </select>

    <select
      value={issueForm.sourceType}
      onChange={(e) =>
        setIssueForm({
          ...issueForm,
          sourceType: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="MANUAL">Manual</option>
      <option value="PROJECT">Project</option>
      <option value="DAMAGE">Damage</option>
      <option value="RETURN_TO_VENDOR">
        Return To Vendor
      </option>
      <option value="ADJUSTMENT">Adjustment</option>
    </select>

    <input
      type="number"
      placeholder="Quantity"
      value={issueForm.quantity}
      onChange={(e) =>
        setIssueForm({
          ...issueForm,
          quantity: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <input
      type="number"
      placeholder="Project ID (optional)"
      value={issueForm.projectId}
      onChange={(e) =>
        setIssueForm({
          ...issueForm,
          projectId: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <input
      type="text"
      placeholder="Remarks"
      value={issueForm.remarks}
      onChange={(e) =>
        setIssueForm({
          ...issueForm,
          remarks: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm md:col-span-2"
    />
  </div>
</div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Warehouse Stock
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Current material stock by branch with pagination.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadStockItems(1)}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {loading
                ? 'Loading...'
                : 'Apply Filters'}
            </button>

            <button
              type="button"
              onClick={() => {
                const emptyFilters = {
                  branch: '',
                  material: '',
                  showHidden: false,
                };

                setFilters(emptyFilters);
                loadStockItems(1, emptyFilters);
              }}
              className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            type="text"
            placeholder="Branch"
            value={filters.branch}
            onChange={(e) =>
              setFilters({
                ...filters,
                branch: e.target.value,
              })
            }
            className="rounded-xl border p-3 text-sm"
          />

          <input
            type="text"
            placeholder="Material / Category / Brand"
            value={filters.material}
            onChange={(e) =>
              setFilters({
                ...filters,
                material: e.target.value,
              })
            }
            className="rounded-xl border p-3 text-sm"
          />

          <label className="flex items-center gap-2 rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={filters.showHidden}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  showHidden: e.target.checked,
                })
              }
            />
            View Hidden
          </label>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-2 text-left">
                  Material
                </th>
                <th className="p-2 text-left">
                  Category
                </th>
                <th className="p-2 text-left">
                  Brand
                </th>
                <th className="p-2 text-left">
                  Unit
                </th>
                <th className="p-2 text-left">
                  Branch
                </th>
                <th className="p-2 text-left">
                  Quantity
                </th>
                <th className="p-2 text-left">
                  Avg Rate
                </th>
                <th className="p-2 text-left">
                  Stock Value
                </th>
                <th className="p-2 text-left">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {stockItems.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="p-4 text-center text-gray-500"
                  >
                    No stock items found.
                  </td>
                </tr>
              )}

              {stockItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b"
                >
                  <td className="p-2 font-semibold">
                    {item.materialName || '-'}
                  </td>

                  <td className="p-2">
                    {item.category || '-'}
                  </td>

                  <td className="p-2">
                    {item.brand || '-'}
                  </td>

                  <td className="p-2">
                    {item.unit || '-'}
                  </td>

                  <td className="p-2">
                    {item.branchName || '-'}
                  </td>

                  <td className="p-2 font-semibold">
                    {Number(
                      item.currentQuantity || 0,
                    ).toLocaleString('en-IN')}
                  </td>

                  <td className="p-2">
                    {formatCurrency(item.averageRate)}
                  </td>

                  <td className="p-2 font-semibold text-green-700">
                    {formatCurrency(item.stockValue)}
                  </td>

                  <td className="p-2">
  {filters.showHidden ? (
    <button
      type="button"
      onClick={() => restoreStockItem(item.id)}
      className="rounded bg-green-600 px-2 py-1 text-xs text-white"
    >
      Restore
    </button>
  ) : (
    <button
      type="button"
      onClick={() => hideStockItem(item.id)}
      className="rounded bg-gray-700 px-2 py-1 text-xs text-white"
    >
      Hide
    </button>
  )}
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of{' '}
            {pagination.totalPages} | Total{' '}
            {pagination.total}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={
                pagination.page <= 1 || loading
              }
              onClick={() =>
                loadStockItems(
                  pagination.page - 1,
                )
              }
              className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={
                pagination.page >=
                  pagination.totalPages ||
                loading
              }
              onClick={() =>
                loadStockItems(
                  pagination.page + 1,
                )
              }
              className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Stock Movement History
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Complete receive and issue history for stock audit.
      </p>
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => loadStockMovements(1)}
        disabled={movementLoading}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
      >
        {movementLoading
          ? 'Loading...'
          : 'Apply Filters'}
      </button>

      <button
        type="button"
        onClick={() => {
          const emptyFilters = {
            material: '',
            branch: '',
            movementType: '',
            showHidden: false,
          };

          setMovementFilters(emptyFilters);
          loadStockMovements(1, emptyFilters);
        }}
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700"
      >
        Reset
      </button>
    </div>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-4">
    <input
      type="text"
      placeholder="Material"
      value={movementFilters.material}
      onChange={(e) =>
        setMovementFilters({
          ...movementFilters,
          material: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <input
      type="text"
      placeholder="Branch"
      value={movementFilters.branch}
      onChange={(e) =>
        setMovementFilters({
          ...movementFilters,
          branch: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <select
      value={movementFilters.movementType}
      onChange={(e) =>
        setMovementFilters({
          ...movementFilters,
          movementType: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">All Movement Types</option>
      <option value="RECEIVE">Receive</option>
      <option value="ISSUE">Issue</option>
      <option value="ADJUST_IN">Adjust In</option>
      <option value="ADJUST_OUT">Adjust Out</option>
      <option value="TRANSFER_IN">Transfer In</option>
      <option value="TRANSFER_OUT">Transfer Out</option>
    </select>

    <label className="flex items-center gap-2 rounded-xl border p-3 text-sm">
      <input
        type="checkbox"
        checked={movementFilters.showHidden}
        onChange={(e) =>
          setMovementFilters({
            ...movementFilters,
            showHidden: e.target.checked,
          })
        }
      />
      View Hidden
    </label>
  </div>

  <div className="mt-5 overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-2 text-left">Date</th>
          <th className="p-2 text-left">Material</th>
          <th className="p-2 text-left">Branch</th>
          <th className="p-2 text-left">Type</th>
          <th className="p-2 text-left">Qty</th>
          <th className="p-2 text-left">Rate</th>
          <th className="p-2 text-left">Amount</th>
          <th className="p-2 text-left">Source</th>
          <th className="p-2 text-left">Project</th>
          <th className="p-2 text-left">Created By</th>
          <th className="p-2 text-left">Remarks</th>
        </tr>
      </thead>

      <tbody>
        {movements.length === 0 && (
          <tr>
            <td
              colSpan={11}
              className="p-4 text-center text-gray-500"
            >
              No stock movements found.
            </td>
          </tr>
        )}

        {movements.map((item) => (
          <tr key={item.id} className="border-b">
            <td className="p-2">
              {item.createdAt
                ? new Date(item.createdAt).toLocaleDateString()
                : '-'}
            </td>

            <td className="p-2 font-semibold">
              {item.materialName || '-'}
            </td>

            <td className="p-2">
              {item.branchName || '-'}
            </td>

            <td className="p-2">
              {item.movementType || '-'}
            </td>

            <td className="p-2 font-semibold">
              {Number(item.quantity || 0).toLocaleString(
                'en-IN',
              )}
            </td>

            <td className="p-2">
              {formatCurrency(item.rate)}
            </td>

            <td className="p-2 font-semibold">
              {formatCurrency(item.totalAmount)}
            </td>

            <td className="p-2">
              {item.sourceType || '-'}
            </td>

            <td className="p-2">
              {item.projectId || '-'}
            </td>

            <td className="p-2">
              {item.createdByName || '-'}
            </td>

            <td className="p-2">
              {item.remarks || '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <p className="text-sm text-gray-500">
      Page {movementPagination.page} of{' '}
      {movementPagination.totalPages} | Total{' '}
      {movementPagination.total}
    </p>

    <div className="flex gap-2">
      <button
        type="button"
        disabled={
          movementPagination.page <= 1 ||
          movementLoading
        }
        onClick={() =>
          loadStockMovements(
            movementPagination.page - 1,
          )
        }
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
      >
        Previous
      </button>

      <button
        type="button"
        disabled={
          movementPagination.page >=
            movementPagination.totalPages ||
          movementLoading
        }
        onClick={() =>
          loadStockMovements(
            movementPagination.page + 1,
          )
        }
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
</div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          'Incoming Stock',
          'Branch Wise Stock',
          'Material Availability',
          'Stock Reports',
        ].map((item) => (
          <div
            key={item}
            className="rounded-2xl bg-white p-5 shadow"
          >
            <h2 className="text-lg font-bold text-gray-800">
              {item}
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              Upcoming implementation.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
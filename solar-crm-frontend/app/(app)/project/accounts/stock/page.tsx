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

  useEffect(() => {
    loadStockItems(1);
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
              </tr>
            </thead>

            <tbody>
              {stockItems.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          'Incoming Stock',
          'Outgoing Stock',
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
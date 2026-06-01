'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

const expenseTypes = [
  { value: '', label: 'All Expense Types' },
  { value: 'PROJECT_FUND', label: 'Project Fund' },
  {
    value: 'CONTRACTOR_PAYMENT',
    label: 'Contractor Payment',
  },
  { value: 'LABOUR_PAYMENT', label: 'Labour Payment' },
  { value: 'TRANSPORTATION', label: 'Transportation' },
  { value: 'SALARY', label: 'Salary' },
  { value: 'INCENTIVE', label: 'Incentive' },
  { value: 'ADVANCE_SALARY', label: 'Advance Salary' },
  { value: 'OTHER', label: 'Other' },
];

const approvalStatuses = [
  { value: '', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const formatCurrency = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export default function AccountsReportsPage() {
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    expenseType: '',
    approvalStatus: '',
  });

  const [summary, setSummary] = useState({
    totalApprovedExpenses: 0,
    totalPendingExpenses: 0,
    totalRejectedExpenses: 0,
    totalExpenseCount: 0,
  });

  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [monthlyProfitMonth, setMonthlyProfitMonth] =
  useState(new Date().toISOString().slice(0, 7));

const [monthlyProfit, setMonthlyProfit] =
  useState({
    totalCollections: 0,
    totalExpenses: 0,
    netProfit: 0,
    collectionCount: 0,
    expenseCount: 0,
  });

const [monthlyProfitLoading, setMonthlyProfitLoading] =
  useState(false);

  const [branchProfitRows, setBranchProfitRows] =
  useState<any[]>([]);

const [branchProfitLoading, setBranchProfitLoading] =
  useState(false);

  const [branchProfitFilters, setBranchProfitFilters] =
  useState({
    month: '',
    fromDate: '',
    toDate: '',
    branch: '',
    projectOwnerId: '',
  });

  useEffect(() => {
  loadExpenditureReport();
  loadMonthlyProfitReport();
  loadBranchWiseProfitReport();
}, []);

  const loadExpenditureReport = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      const res = await axios.get(
        `${API_BASE_URL}/project/account-expenses/report`,
        {
          params: {
            fromDate: filters.fromDate || undefined,
            toDate: filters.toDate || undefined,
            expenseType:
              filters.expenseType || undefined,
            approvalStatus:
              filters.approvalStatus || undefined,
          },
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      setSummary({
        totalApprovedExpenses: Number(
          res.data?.summary
            ?.totalApprovedExpenses || 0,
        ),
        totalPendingExpenses: Number(
          res.data?.summary
            ?.totalPendingExpenses || 0,
        ),
        totalRejectedExpenses: Number(
          res.data?.summary
            ?.totalRejectedExpenses || 0,
        ),
        totalExpenseCount: Number(
          res.data?.summary?.totalExpenseCount || 0,
        ),
      });

      setExpenses(
        Array.isArray(res.data?.data)
          ? res.data.data
          : [],
      );
    } catch (error) {
      console.error(error);
      alert('Failed to load expenditure report');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyProfitReport = async () => {
  try {
    setMonthlyProfitLoading(true);

    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/accounts/reports/monthly-profit`,
      {
        params: {
          month: monthlyProfitMonth,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setMonthlyProfit({
      totalCollections: Number(
        res.data?.summary?.totalCollections || 0,
      ),
      totalExpenses: Number(
        res.data?.summary?.totalExpenses || 0,
      ),
      netProfit: Number(
        res.data?.summary?.netProfit || 0,
      ),
      collectionCount: Number(
        res.data?.summary?.collectionCount || 0,
      ),
      expenseCount: Number(
        res.data?.summary?.expenseCount || 0,
      ),
    });
  } catch (error) {
    console.error(error);
    alert('Failed to load monthly profit report');
  } finally {
    setMonthlyProfitLoading(false);
  }
};

const loadBranchWiseProfitReport = async () => {
  try {
    setBranchProfitLoading(true);

    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/accounts/reports/branch-profit`,
      {
  params: {
    month: branchProfitFilters.month || undefined,
    fromDate:
      branchProfitFilters.month
        ? undefined
        : branchProfitFilters.fromDate || undefined,
    toDate:
      branchProfitFilters.month
        ? undefined
        : branchProfitFilters.toDate || undefined,
    branch: branchProfitFilters.branch || undefined,
    projectOwnerId:
      branchProfitFilters.projectOwnerId || undefined,
  },
  headers: token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {},
},
    );

    setBranchProfitRows(
      Array.isArray(res.data) ? res.data : [],
    );
  } catch (error) {
    console.error(error);
    alert('Failed to load branch wise profit report');
  } finally {
    setBranchProfitLoading(false);
  }
};

  const resetFilters = async () => {
    setFilters({
      fromDate: '',
      toDate: '',
      expenseType: '',
      approvalStatus: '',
    });

    setTimeout(() => {
      loadExpenditureReport();
    }, 0);
  };

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

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Expenditure Report
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Approved, pending and rejected expenses with date, type and
              status filters.
            </p>
          </div>

          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            Phase 1C Active
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) =>
              setFilters({
                ...filters,
                fromDate: e.target.value,
              })
            }
            className="rounded-xl border p-3 text-sm"
          />

          <input
            type="date"
            value={filters.toDate}
            onChange={(e) =>
              setFilters({
                ...filters,
                toDate: e.target.value,
              })
            }
            className="rounded-xl border p-3 text-sm"
          />

          <select
            value={filters.expenseType}
            onChange={(e) =>
              setFilters({
                ...filters,
                expenseType: e.target.value,
              })
            }
            className="rounded-xl border p-3 text-sm"
          >
            {expenseTypes.map((type) => (
              <option
                key={type.value}
                value={type.value}
              >
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={filters.approvalStatus}
            onChange={(e) =>
              setFilters({
                ...filters,
                approvalStatus: e.target.value,
              })
            }
            className="rounded-xl border p-3 text-sm"
          >
            {approvalStatuses.map((status) => (
              <option
                key={status.value}
                value={status.value}
              >
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadExpenditureReport}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Reset
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-green-50 p-4">
            <p className="text-xs text-green-700">
              Approved Expenses
            </p>

            <p className="mt-1 text-xl font-bold text-green-800">
              {formatCurrency(
                summary.totalApprovedExpenses,
              )}
            </p>
          </div>

          <div className="rounded-xl bg-yellow-50 p-4">
            <p className="text-xs text-yellow-700">
              Pending Expenses
            </p>

            <p className="mt-1 text-xl font-bold text-yellow-800">
              {formatCurrency(
                summary.totalPendingExpenses,
              )}
            </p>
          </div>

          <div className="rounded-xl bg-red-50 p-4">
            <p className="text-xs text-red-700">
              Rejected Expenses
            </p>

            <p className="mt-1 text-xl font-bold text-red-800">
              {formatCurrency(
                summary.totalRejectedExpenses,
              )}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-600">
              Expense Count
            </p>

            <p className="mt-1 text-xl font-bold text-gray-800">
              {summary.totalExpenseCount}
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-2 text-left">
                  Date
                </th>

                <th className="p-2 text-left">
                  Type
                </th>

                <th className="p-2 text-left">
                  Amount
                </th>

                <th className="p-2 text-left">
                  Status
                </th>

                <th className="p-2 text-left">
                  Created By
                </th>

                <th className="p-2 text-left">
                  Project Owner
                </th>

                <th className="p-2 text-left">
                  Branch
                </th>

                <th className="p-2 text-left">
                  Remarks
                </th>
              </tr>
            </thead>

            <tbody>
              {expenses.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-4 text-center text-gray-500"
                  >
                    No expenses found.
                  </td>
                </tr>
              )}

              {expenses.map((item) => (
                <tr
                  key={item.id}
                  className="border-b"
                >
                  <td className="p-2">
                    {item.createdAt
                      ? new Date(
                          item.createdAt,
                        ).toLocaleDateString()
                      : '-'}
                  </td>

                  <td className="p-2">
                    {item.expenseType || '-'}
                  </td>

                  <td className="p-2 font-semibold">
                    {formatCurrency(item.amount)}
                  </td>

                  <td className="p-2">
                    {item.approvalStatus || '-'}
                  </td>

                  <td className="p-2">
                    {item.createdByName || '-'}
                  </td>

                  <td className="p-2">
                    {item.projectOwnerName || '-'}
                  </td>

                  <td className="p-2">
                    {item.branchName || '-'}
                  </td>

                  <td className="p-2">
                    {item.remarks || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Monthly Profit Report
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Customer collections received minus approved expenses for selected month.
      </p>
    </div>

    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
      Phase 1D Active
    </span>
  </div>

  <div className="mt-4 flex flex-col gap-3 md:flex-row">
    <input
      type="month"
      value={monthlyProfitMonth}
      onChange={(e) =>
        setMonthlyProfitMonth(e.target.value)
      }
      className="rounded-xl border p-3 text-sm"
    />

    <button
      type="button"
      onClick={loadMonthlyProfitReport}
      disabled={monthlyProfitLoading}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
    >
      {monthlyProfitLoading
        ? 'Loading...'
        : 'Apply Month'}
    </button>
  </div>

  <div className="mt-5 grid gap-3 md:grid-cols-3">
    <div className="rounded-xl bg-green-50 p-4">
      <p className="text-xs text-green-700">
        Total Collections
      </p>

      <p className="mt-1 text-xl font-bold text-green-800">
        {formatCurrency(
          monthlyProfit.totalCollections,
        )}
      </p>

      <p className="mt-1 text-xs text-green-700">
        {monthlyProfit.collectionCount} collection entries
      </p>
    </div>

    <div className="rounded-xl bg-red-50 p-4">
      <p className="text-xs text-red-700">
        Total Expenses
      </p>

      <p className="mt-1 text-xl font-bold text-red-800">
        {formatCurrency(
          monthlyProfit.totalExpenses,
        )}
      </p>

      <p className="mt-1 text-xs text-red-700">
        {monthlyProfit.expenseCount} expense entries
      </p>
    </div>

    <div
      className={`rounded-xl p-4 ${
        monthlyProfit.netProfit >= 0
          ? 'bg-blue-50'
          : 'bg-red-50'
      }`}
    >
      <p
        className={`text-xs ${
          monthlyProfit.netProfit >= 0
            ? 'text-blue-700'
            : 'text-red-700'
        }`}
      >
        Net Profit
      </p>

      <p
        className={`mt-1 text-xl font-bold ${
          monthlyProfit.netProfit >= 0
            ? 'text-blue-800'
            : 'text-red-800'
        }`}
      >
        {formatCurrency(monthlyProfit.netProfit)}
      </p>

      <p className="mt-1 text-xs text-gray-600">
        Collections - Approved Expenses
      </p>
    </div>
  </div>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Branch Wise Profit Report
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Branch wise customer collections, approved expenses and net profit.
      </p>
    </div>

    <button
      type="button"
      onClick={loadBranchWiseProfitReport}
      disabled={branchProfitLoading}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
    >
      {branchProfitLoading
        ? 'Loading...'
        : 'Refresh'}
    </button>

    <button
  type="button"
  onClick={() => {
    setBranchProfitFilters({
      month: '',
      fromDate: '',
      toDate: '',
      branch: '',
      projectOwnerId: '',
    });

    setTimeout(() => {
      loadBranchWiseProfitReport();
    }, 0);
  }}
  className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700"
>
  Reset
</button>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-5">
  <input
    type="month"
    value={branchProfitFilters.month}
    onChange={(e) =>
      setBranchProfitFilters({
        ...branchProfitFilters,
        month: e.target.value,
        fromDate: '',
        toDate: '',
      })
    }
    className="rounded-xl border p-3 text-sm"
  />

  <input
    type="date"
    value={branchProfitFilters.fromDate}
    disabled={!!branchProfitFilters.month}
    onChange={(e) =>
      setBranchProfitFilters({
        ...branchProfitFilters,
        fromDate: e.target.value,
      })
    }
    className="rounded-xl border p-3 text-sm disabled:bg-gray-100"
  />

  <input
    type="date"
    value={branchProfitFilters.toDate}
    disabled={!!branchProfitFilters.month}
    onChange={(e) =>
      setBranchProfitFilters({
        ...branchProfitFilters,
        toDate: e.target.value,
      })
    }
    className="rounded-xl border p-3 text-sm disabled:bg-gray-100"
  />

  <input
    type="text"
    placeholder="Branch"
    value={branchProfitFilters.branch}
    onChange={(e) =>
      setBranchProfitFilters({
        ...branchProfitFilters,
        branch: e.target.value,
      })
    }
    className="rounded-xl border p-3 text-sm"
  />

  <input
    type="number"
    placeholder="Project Owner ID"
    value={branchProfitFilters.projectOwnerId}
    onChange={(e) =>
      setBranchProfitFilters({
        ...branchProfitFilters,
        projectOwnerId: e.target.value,
      })
    }
    className="rounded-xl border p-3 text-sm"
  />
</div>

  <div className="mt-5 grid gap-3 md:grid-cols-4">
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs text-gray-600">
        Total Branches
      </p>

      <p className="mt-1 text-xl font-bold text-gray-800">
        {branchProfitRows.length}
      </p>
    </div>

    <div className="rounded-xl bg-green-50 p-4">
      <p className="text-xs text-green-700">
        Total Collections
      </p>

      <p className="mt-1 text-xl font-bold text-green-800">
        {formatCurrency(
          branchProfitRows.reduce(
            (total, item) =>
              total +
              Number(item.totalCollections || 0),
            0,
          ),
        )}
      </p>
    </div>

    <div className="rounded-xl bg-red-50 p-4">
      <p className="text-xs text-red-700">
        Total Expenses
      </p>

      <p className="mt-1 text-xl font-bold text-red-800">
        {formatCurrency(
          branchProfitRows.reduce(
            (total, item) =>
              total +
              Number(item.totalExpenses || 0),
            0,
          ),
        )}
      </p>
    </div>

    <div className="rounded-xl bg-blue-50 p-4">
      <p className="text-xs text-blue-700">
        Total Profit
      </p>

      <p className="mt-1 text-xl font-bold text-blue-800">
        {formatCurrency(
          branchProfitRows.reduce(
            (total, item) =>
              total +
              Number(item.netProfit || 0),
            0,
          ),
        )}
      </p>
    </div>
  </div>

  <div className="mt-5 overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-2 text-left">
            Branch
          </th>

          <th className="p-2 text-left">
            Collections
          </th>

          <th className="p-2 text-left">
            Expenses
          </th>

          <th className="p-2 text-left">
            Net Profit
          </th>
        </tr>
      </thead>

      <tbody>
        {branchProfitRows.length === 0 && (
          <tr>
            <td
              colSpan={4}
              className="p-4 text-center text-gray-500"
            >
              No branch profit data found.
            </td>
          </tr>
        )}

        {branchProfitRows.map((item) => (
          <tr
            key={item.branchName}
            className="border-b"
          >
            <td className="p-2 font-semibold">
              {item.branchName || 'UNASSIGNED'}
            </td>

            <td className="p-2 text-green-700">
              {formatCurrency(
                item.totalCollections,
              )}
            </td>

            <td className="p-2 text-red-700">
              {formatCurrency(
                item.totalExpenses,
              )}
            </td>

            <td
              className={`p-2 font-semibold ${
                Number(item.netProfit || 0) >= 0
                  ? 'text-blue-700'
                  : 'text-red-700'
              }`}
            >
              {formatCurrency(item.netProfit)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

<div className="grid gap-4 md:grid-cols-3">
  {[
    'Project Owner Wise Profit',
    'Salary Report',
    'Incentive Report',
  ].map((title) => (
    <div
      key={title}
      className="rounded-2xl bg-white p-5 shadow"
    >
      <h2 className="text-lg font-bold text-gray-800">
        {title}
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
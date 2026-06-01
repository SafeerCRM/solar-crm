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
    branch: '',
    projectOwnerId: '',
  });

const [branches, setBranches] = useState<any[]>([]);
const [projectOwners, setProjectOwners] = useState<any[]>([]);

const [projectOwnerProfitRows, setProjectOwnerProfitRows] =
  useState<any[]>([]);

const [projectOwnerProfitSummary, setProjectOwnerProfitSummary] =
  useState({
    totalOwners: 0,
    totalCollections: 0,
    totalExpenses: 0,
    totalProfit: 0,
    highestProfitOwner: '-',
  });

const [projectOwnerProfitPagination, setProjectOwnerProfitPagination] =
  useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

const [projectOwnerProfitFilters, setProjectOwnerProfitFilters] =
  useState({
    month: '',
    branch: '',
    projectOwnerId: '',
  });

const [
  projectOwnerProfitLoading,
  setProjectOwnerProfitLoading,
] = useState(false);

const [salaryRows, setSalaryRows] = useState<any[]>([]);

const [salarySummary, setSalarySummary] = useState({
  totalSalary: 0,
  totalAdvanceSalary: 0,
  approvedSalary: 0,
  pendingSalary: 0,
  totalRecords: 0,
});

const [salaryPagination, setSalaryPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
});

const [salaryFilters, setSalaryFilters] = useState({
  month: '',
  branch: '',
  projectOwnerId: '',
  approvalStatus: '',
});

const [salaryLoading, setSalaryLoading] = useState(false);

const [incentiveRows, setIncentiveRows] = useState<any[]>([]);

const [incentiveSummary, setIncentiveSummary] = useState({
  totalIncentives: 0,
  approvedIncentives: 0,
  pendingIncentives: 0,
  rejectedIncentives: 0,
  totalRecords: 0,
});

const [incentivePagination, setIncentivePagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
});

const [incentiveFilters, setIncentiveFilters] = useState({
  month: '',
  branch: '',
  projectOwnerId: '',
  approvalStatus: '',
});

const [incentiveLoading, setIncentiveLoading] = useState(false);

  useEffect(() => {
  loadExpenditureReport();
  loadMonthlyProfitReport();
  loadBranchWiseProfitReport();
  loadProjectOwnerWiseProfitReport();
  loadSalaryReport();
  loadIncentiveReport();
  loadBranches();
  loadProjectOwners();
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

const loadBranchWiseProfitReport = async (
  overrideFilters?: {
    month: string;
    branch: string;
    projectOwnerId: string;
  },
) => {
  try {
    setBranchProfitLoading(true);

    const token = localStorage.getItem('token');

    const activeFilters =
  overrideFilters || branchProfitFilters;

    const res = await axios.get(
      `${API_BASE_URL}/project/accounts/reports/branch-profit`,
      {
  params: {
  month: activeFilters.month || undefined,
  branch: activeFilters.branch || undefined,
  projectOwnerId:
    activeFilters.projectOwnerId || undefined,
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

const loadProjectOwners = async () => {
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

    setProjectOwners(
      Array.isArray(res.data) ? res.data : [],
    );
  } catch (error) {
    console.error(error);
  }
};

const loadProjectOwnerWiseProfitReport = async (
  overrideFilters?: {
    month: string;
    branch: string;
    projectOwnerId: string;
  },
  overridePage?: number,
) => {
  try {
    setProjectOwnerProfitLoading(true);

    const token = localStorage.getItem('token');

    const activeFilters =
      overrideFilters || projectOwnerProfitFilters;

    const activePage =
      overridePage || projectOwnerProfitPagination.page;

    const res = await axios.get(
      `${API_BASE_URL}/project/accounts/reports/project-owner-profit`,
      {
        params: {
          month: activeFilters.month || undefined,
          branch: activeFilters.branch || undefined,
          projectOwnerId:
            activeFilters.projectOwnerId || undefined,
          page: activePage,
          limit: projectOwnerProfitPagination.limit,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setProjectOwnerProfitSummary({
      totalOwners: Number(
        res.data?.summary?.totalOwners || 0,
      ),
      totalCollections: Number(
        res.data?.summary?.totalCollections || 0,
      ),
      totalExpenses: Number(
        res.data?.summary?.totalExpenses || 0,
      ),
      totalProfit: Number(
        res.data?.summary?.totalProfit || 0,
      ),
      highestProfitOwner:
        res.data?.summary?.highestProfitOwner || '-',
    });

    setProjectOwnerProfitRows(
      Array.isArray(res.data?.data)
        ? res.data.data
        : [],
    );

    setProjectOwnerProfitPagination({
      page: Number(res.data?.pagination?.page || 1),
      limit: Number(res.data?.pagination?.limit || 20),
      total: Number(res.data?.pagination?.total || 0),
      totalPages: Number(
        res.data?.pagination?.totalPages || 1,
      ),
    });
  } catch (error) {
    console.error(error);
    alert(
      'Failed to load project owner wise profit report',
    );
  } finally {
    setProjectOwnerProfitLoading(false);
  }
};

const loadSalaryReport = async (
  overrideFilters?: {
    month: string;
    branch: string;
    projectOwnerId: string;
    approvalStatus: string;
  },
  overridePage?: number,
) => {
  try {
    setSalaryLoading(true);

    const token = localStorage.getItem('token');

    const activeFilters =
      overrideFilters || salaryFilters;

    const activePage =
      overridePage || salaryPagination.page;

    const res = await axios.get(
      `${API_BASE_URL}/project/accounts/reports/salary`,
      {
        params: {
          month: activeFilters.month || undefined,
          branch: activeFilters.branch || undefined,
          projectOwnerId:
            activeFilters.projectOwnerId || undefined,
          approvalStatus:
            activeFilters.approvalStatus || undefined,
          page: activePage,
          limit: salaryPagination.limit,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setSalarySummary({
      totalSalary: Number(
        res.data?.summary?.totalSalary || 0,
      ),
      totalAdvanceSalary: Number(
        res.data?.summary?.totalAdvanceSalary || 0,
      ),
      approvedSalary: Number(
        res.data?.summary?.approvedSalary || 0,
      ),
      pendingSalary: Number(
        res.data?.summary?.pendingSalary || 0,
      ),
      totalRecords: Number(
        res.data?.summary?.totalRecords || 0,
      ),
    });

    setSalaryRows(
      Array.isArray(res.data?.data)
        ? res.data.data
        : [],
    );

    setSalaryPagination({
      page: Number(res.data?.pagination?.page || 1),
      limit: Number(res.data?.pagination?.limit || 20),
      total: Number(res.data?.pagination?.total || 0),
      totalPages: Number(
        res.data?.pagination?.totalPages || 1,
      ),
    });
  } catch (error) {
    console.error(error);
    alert('Failed to load salary report');
  } finally {
    setSalaryLoading(false);
  }
};

const loadIncentiveReport = async (
  overrideFilters?: {
    month: string;
    branch: string;
    projectOwnerId: string;
    approvalStatus: string;
  },
  overridePage?: number,
) => {
  try {
    setIncentiveLoading(true);

    const token = localStorage.getItem('token');

    const activeFilters =
      overrideFilters || incentiveFilters;

    const activePage =
      overridePage || incentivePagination.page;

    const res = await axios.get(
      `${API_BASE_URL}/project/accounts/reports/incentive`,
      {
        params: {
          month: activeFilters.month || undefined,
          branch: activeFilters.branch || undefined,
          projectOwnerId:
            activeFilters.projectOwnerId || undefined,
          approvalStatus:
            activeFilters.approvalStatus || undefined,
          page: activePage,
          limit: incentivePagination.limit,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setIncentiveSummary({
      totalIncentives: Number(
        res.data?.summary?.totalIncentives || 0,
      ),
      approvedIncentives: Number(
        res.data?.summary?.approvedIncentives || 0,
      ),
      pendingIncentives: Number(
        res.data?.summary?.pendingIncentives || 0,
      ),
      rejectedIncentives: Number(
        res.data?.summary?.rejectedIncentives || 0,
      ),
      totalRecords: Number(
        res.data?.summary?.totalRecords || 0,
      ),
    });

    setIncentiveRows(
      Array.isArray(res.data?.data)
        ? res.data.data
        : [],
    );

    setIncentivePagination({
      page: Number(res.data?.pagination?.page || 1),
      limit: Number(res.data?.pagination?.limit || 20),
      total: Number(res.data?.pagination?.total || 0),
      totalPages: Number(
        res.data?.pagination?.totalPages || 1,
      ),
    });
  } catch (error) {
    console.error(error);
    alert('Failed to load incentive report');
  } finally {
    setIncentiveLoading(false);
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

<div className="flex gap-2">
    <button
      type="button"
      onClick={() => loadBranchWiseProfitReport()}
      disabled={branchProfitLoading}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
    >
      {branchProfitLoading
  ? 'Loading...'
  : 'Apply Filters'}
    </button>

    <button
  type="button"
  onClick={() => {
    const emptyFilters = {
      month: '',
      branch: '',
      projectOwnerId: '',
    };

    setBranchProfitFilters(emptyFilters);

    loadBranchWiseProfitReport(emptyFilters);
  }}
  className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700"
>
  Reset
</button>
</div>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-3">
  <input
    type="month"
    value={branchProfitFilters.month}
    onChange={(e) =>
      setBranchProfitFilters({
        ...branchProfitFilters,
        month: e.target.value,
      })
    }
    className="rounded-xl border p-3 text-sm"
  />

  <select
    value={branchProfitFilters.branch}
    onChange={(e) =>
      setBranchProfitFilters({
        ...branchProfitFilters,
        branch: e.target.value,
      })
    }
    className="rounded-xl border p-3 text-sm"
  >
    <option value="">All Branches</option>

    {branches.map((branch: any) => (
      <option
        key={branch.id || branch.name || branch.branchName}
        value={branch.name || branch.branchName}
      >
        {branch.name || branch.branchName}
      </option>
    ))}
  </select>

  <select
    value={branchProfitFilters.projectOwnerId}
    onChange={(e) =>
      setBranchProfitFilters({
        ...branchProfitFilters,
        projectOwnerId: e.target.value,
      })
    }
    className="rounded-xl border p-3 text-sm"
  >
    <option value="">All Project Owners</option>

    {projectOwners.map((owner: any) => (
      <option
        key={owner.projectOwnerId}
        value={owner.projectOwnerId}
      >
        {owner.projectOwnerName || 'Unnamed Owner'}
      </option>
    ))}
  </select>
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

<div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Project Owner Wise Profit Report
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Project owner wise collections, approved expenses and net profit.
      </p>
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() =>
          loadProjectOwnerWiseProfitReport(
            projectOwnerProfitFilters,
            1,
          )
        }
        disabled={projectOwnerProfitLoading}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
      >
        {projectOwnerProfitLoading
          ? 'Loading...'
          : 'Apply Filters'}
      </button>

      <button
        type="button"
        onClick={() => {
          const emptyFilters = {
            month: '',
            branch: '',
            projectOwnerId: '',
          };

          setProjectOwnerProfitFilters(emptyFilters);

          loadProjectOwnerWiseProfitReport(
            emptyFilters,
            1,
          );
        }}
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700"
      >
        Reset
      </button>
    </div>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-3">
    <input
      type="month"
      value={projectOwnerProfitFilters.month}
      onChange={(e) =>
        setProjectOwnerProfitFilters({
          ...projectOwnerProfitFilters,
          month: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <select
      value={projectOwnerProfitFilters.branch}
      onChange={(e) =>
        setProjectOwnerProfitFilters({
          ...projectOwnerProfitFilters,
          branch: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">All Branches</option>

      {branches.map((branch: any) => (
        <option
          key={branch.id || branch.name || branch.branchName}
          value={branch.name || branch.branchName}
        >
          {branch.name || branch.branchName}
        </option>
      ))}
    </select>

    <select
      value={projectOwnerProfitFilters.projectOwnerId}
      onChange={(e) =>
        setProjectOwnerProfitFilters({
          ...projectOwnerProfitFilters,
          projectOwnerId: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">All Project Owners</option>

      {projectOwners.map((owner: any) => (
        <option
          key={owner.projectOwnerId}
          value={owner.projectOwnerId}
        >
          {owner.projectOwnerName || 'Unnamed Owner'}
        </option>
      ))}
    </select>
  </div>

  <div className="mt-5 grid gap-3 md:grid-cols-5">
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs text-gray-600">
        Total Owners
      </p>

      <p className="mt-1 text-xl font-bold text-gray-800">
        {projectOwnerProfitSummary.totalOwners}
      </p>
    </div>

    <div className="rounded-xl bg-green-50 p-4">
      <p className="text-xs text-green-700">
        Collections
      </p>

      <p className="mt-1 text-xl font-bold text-green-800">
        {formatCurrency(
          projectOwnerProfitSummary.totalCollections,
        )}
      </p>
    </div>

    <div className="rounded-xl bg-red-50 p-4">
      <p className="text-xs text-red-700">
        Expenses
      </p>

      <p className="mt-1 text-xl font-bold text-red-800">
        {formatCurrency(
          projectOwnerProfitSummary.totalExpenses,
        )}
      </p>
    </div>

    <div className="rounded-xl bg-blue-50 p-4">
      <p className="text-xs text-blue-700">
        Profit
      </p>

      <p className="mt-1 text-xl font-bold text-blue-800">
        {formatCurrency(
          projectOwnerProfitSummary.totalProfit,
        )}
      </p>
    </div>

    <div className="rounded-xl bg-purple-50 p-4">
      <p className="text-xs text-purple-700">
        Highest Profit Owner
      </p>

      <p className="mt-1 text-sm font-bold text-purple-800">
        {projectOwnerProfitSummary.highestProfitOwner}
      </p>
    </div>
  </div>

  <div className="mt-5 overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-2 text-left">
            Project Owner
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
        {projectOwnerProfitRows.length === 0 && (
          <tr>
            <td
              colSpan={4}
              className="p-4 text-center text-gray-500"
            >
              No project owner profit data found.
            </td>
          </tr>
        )}

        {projectOwnerProfitRows.map((item) => (
          <tr
            key={
              item.projectOwnerId ||
              item.projectOwnerName
            }
            className="border-b"
          >
            <td className="p-2 font-semibold">
              {item.projectOwnerName || 'UNASSIGNED'}
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

  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <p className="text-sm text-gray-500">
      Page {projectOwnerProfitPagination.page} of{' '}
      {projectOwnerProfitPagination.totalPages} | Total{' '}
      {projectOwnerProfitPagination.total}
    </p>

    <div className="flex gap-2">
      <button
        type="button"
        disabled={
          projectOwnerProfitPagination.page <= 1 ||
          projectOwnerProfitLoading
        }
        onClick={() =>
          loadProjectOwnerWiseProfitReport(
            projectOwnerProfitFilters,
            projectOwnerProfitPagination.page - 1,
          )
        }
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
      >
        Previous
      </button>

      <button
        type="button"
        disabled={
          projectOwnerProfitPagination.page >=
            projectOwnerProfitPagination.totalPages ||
          projectOwnerProfitLoading
        }
        onClick={() =>
          loadProjectOwnerWiseProfitReport(
            projectOwnerProfitFilters,
            projectOwnerProfitPagination.page + 1,
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
        Salary Report
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Salary and advance salary expenses with approval status and pagination.
      </p>
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => loadSalaryReport(salaryFilters, 1)}
        disabled={salaryLoading}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
      >
        {salaryLoading ? 'Loading...' : 'Apply Filters'}
      </button>

      <button
        type="button"
        onClick={() => {
          const emptyFilters = {
            month: '',
            branch: '',
            projectOwnerId: '',
            approvalStatus: '',
          };

          setSalaryFilters(emptyFilters);
          loadSalaryReport(emptyFilters, 1);
        }}
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700"
      >
        Reset
      </button>
    </div>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-4">
    <input
      type="month"
      value={salaryFilters.month}
      onChange={(e) =>
        setSalaryFilters({
          ...salaryFilters,
          month: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <select
      value={salaryFilters.branch}
      onChange={(e) =>
        setSalaryFilters({
          ...salaryFilters,
          branch: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">All Branches</option>

      {branches.map((branch: any) => (
        <option
          key={branch.id || branch.name || branch.branchName}
          value={branch.name || branch.branchName}
        >
          {branch.name || branch.branchName}
        </option>
      ))}
    </select>

    <select
      value={salaryFilters.projectOwnerId}
      onChange={(e) =>
        setSalaryFilters({
          ...salaryFilters,
          projectOwnerId: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">All Project Owners</option>

      {projectOwners.map((owner: any) => (
        <option
          key={owner.projectOwnerId}
          value={owner.projectOwnerId}
        >
          {owner.projectOwnerName || 'Unnamed Owner'}
        </option>
      ))}
    </select>

    <select
      value={salaryFilters.approvalStatus}
      onChange={(e) =>
        setSalaryFilters({
          ...salaryFilters,
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

  <div className="mt-5 grid gap-3 md:grid-cols-5">
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs text-gray-600">
        Records
      </p>

      <p className="mt-1 text-xl font-bold text-gray-800">
        {salarySummary.totalRecords}
      </p>
    </div>

    <div className="rounded-xl bg-green-50 p-4">
      <p className="text-xs text-green-700">
        Total Salary
      </p>

      <p className="mt-1 text-xl font-bold text-green-800">
        {formatCurrency(salarySummary.totalSalary)}
      </p>
    </div>

    <div className="rounded-xl bg-blue-50 p-4">
      <p className="text-xs text-blue-700">
        Advance Salary
      </p>

      <p className="mt-1 text-xl font-bold text-blue-800">
        {formatCurrency(salarySummary.totalAdvanceSalary)}
      </p>
    </div>

    <div className="rounded-xl bg-purple-50 p-4">
      <p className="text-xs text-purple-700">
        Approved Salary
      </p>

      <p className="mt-1 text-xl font-bold text-purple-800">
        {formatCurrency(salarySummary.approvedSalary)}
      </p>
    </div>

    <div className="rounded-xl bg-yellow-50 p-4">
      <p className="text-xs text-yellow-700">
        Pending Salary
      </p>

      <p className="mt-1 text-xl font-bold text-yellow-800">
        {formatCurrency(salarySummary.pendingSalary)}
      </p>
    </div>
  </div>

  <div className="mt-5 overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-2 text-left">Date</th>
          <th className="p-2 text-left">Type</th>
          <th className="p-2 text-left">Amount</th>
          <th className="p-2 text-left">Status</th>
          <th className="p-2 text-left">Created By</th>
          <th className="p-2 text-left">Project Owner</th>
          <th className="p-2 text-left">Branch</th>
          <th className="p-2 text-left">Remarks</th>
        </tr>
      </thead>

      <tbody>
        {salaryRows.length === 0 && (
          <tr>
            <td
              colSpan={8}
              className="p-4 text-center text-gray-500"
            >
              No salary records found.
            </td>
          </tr>
        )}

        {salaryRows.map((item) => (
          <tr key={item.id} className="border-b">
            <td className="p-2">
              {item.createdAt
                ? new Date(item.createdAt).toLocaleDateString()
                : '-'}
            </td>

            <td className="p-2">{item.expenseType || '-'}</td>

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

  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <p className="text-sm text-gray-500">
      Page {salaryPagination.page} of{' '}
      {salaryPagination.totalPages} | Total{' '}
      {salaryPagination.total}
    </p>

    <div className="flex gap-2">
      <button
        type="button"
        disabled={
          salaryPagination.page <= 1 ||
          salaryLoading
        }
        onClick={() =>
          loadSalaryReport(
            salaryFilters,
            salaryPagination.page - 1,
          )
        }
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
      >
        Previous
      </button>

      <button
        type="button"
        disabled={
          salaryPagination.page >=
            salaryPagination.totalPages ||
          salaryLoading
        }
        onClick={() =>
          loadSalaryReport(
            salaryFilters,
            salaryPagination.page + 1,
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
        Incentive Report
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Incentive expenses with approval status, filters and pagination.
      </p>
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() =>
          loadIncentiveReport(incentiveFilters, 1)
        }
        disabled={incentiveLoading}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
      >
        {incentiveLoading
          ? 'Loading...'
          : 'Apply Filters'}
      </button>

      <button
        type="button"
        onClick={() => {
          const emptyFilters = {
            month: '',
            branch: '',
            projectOwnerId: '',
            approvalStatus: '',
          };

          setIncentiveFilters(emptyFilters);
          loadIncentiveReport(emptyFilters, 1);
        }}
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700"
      >
        Reset
      </button>
    </div>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-4">
    <input
      type="month"
      value={incentiveFilters.month}
      onChange={(e) =>
        setIncentiveFilters({
          ...incentiveFilters,
          month: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <select
      value={incentiveFilters.branch}
      onChange={(e) =>
        setIncentiveFilters({
          ...incentiveFilters,
          branch: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">All Branches</option>

      {branches.map((branch: any) => (
        <option
          key={branch.id || branch.name || branch.branchName}
          value={branch.name || branch.branchName}
        >
          {branch.name || branch.branchName}
        </option>
      ))}
    </select>

    <select
      value={incentiveFilters.projectOwnerId}
      onChange={(e) =>
        setIncentiveFilters({
          ...incentiveFilters,
          projectOwnerId: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">All Project Owners</option>

      {projectOwners.map((owner: any) => (
        <option
          key={owner.projectOwnerId}
          value={owner.projectOwnerId}
        >
          {owner.projectOwnerName || 'Unnamed Owner'}
        </option>
      ))}
    </select>

    <select
      value={incentiveFilters.approvalStatus}
      onChange={(e) =>
        setIncentiveFilters({
          ...incentiveFilters,
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

  <div className="mt-5 grid gap-3 md:grid-cols-5">
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs text-gray-600">
        Records
      </p>

      <p className="mt-1 text-xl font-bold text-gray-800">
        {incentiveSummary.totalRecords}
      </p>
    </div>

    <div className="rounded-xl bg-green-50 p-4">
      <p className="text-xs text-green-700">
        Total Incentives
      </p>

      <p className="mt-1 text-xl font-bold text-green-800">
        {formatCurrency(
          incentiveSummary.totalIncentives,
        )}
      </p>
    </div>

    <div className="rounded-xl bg-purple-50 p-4">
      <p className="text-xs text-purple-700">
        Approved
      </p>

      <p className="mt-1 text-xl font-bold text-purple-800">
        {formatCurrency(
          incentiveSummary.approvedIncentives,
        )}
      </p>
    </div>

    <div className="rounded-xl bg-yellow-50 p-4">
      <p className="text-xs text-yellow-700">
        Pending
      </p>

      <p className="mt-1 text-xl font-bold text-yellow-800">
        {formatCurrency(
          incentiveSummary.pendingIncentives,
        )}
      </p>
    </div>

    <div className="rounded-xl bg-red-50 p-4">
      <p className="text-xs text-red-700">
        Rejected
      </p>

      <p className="mt-1 text-xl font-bold text-red-800">
        {formatCurrency(
          incentiveSummary.rejectedIncentives,
        )}
      </p>
    </div>
  </div>

  <div className="mt-5 overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-2 text-left">Date</th>
          <th className="p-2 text-left">Amount</th>
          <th className="p-2 text-left">Status</th>
          <th className="p-2 text-left">Created By</th>
          <th className="p-2 text-left">Project Owner</th>
          <th className="p-2 text-left">Branch</th>
          <th className="p-2 text-left">Remarks</th>
        </tr>
      </thead>

      <tbody>
        {incentiveRows.length === 0 && (
          <tr>
            <td
              colSpan={7}
              className="p-4 text-center text-gray-500"
            >
              No incentive records found.
            </td>
          </tr>
        )}

        {incentiveRows.map((item) => (
          <tr key={item.id} className="border-b">
            <td className="p-2">
              {item.createdAt
                ? new Date(item.createdAt).toLocaleDateString()
                : '-'}
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

  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <p className="text-sm text-gray-500">
      Page {incentivePagination.page} of{' '}
      {incentivePagination.totalPages} | Total{' '}
      {incentivePagination.total}
    </p>

    <div className="flex gap-2">
      <button
        type="button"
        disabled={
          incentivePagination.page <= 1 ||
          incentiveLoading
        }
        onClick={() =>
          loadIncentiveReport(
            incentiveFilters,
            incentivePagination.page - 1,
          )
        }
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
      >
        Previous
      </button>

      <button
        type="button"
        disabled={
          incentivePagination.page >=
            incentivePagination.totalPages ||
          incentiveLoading
        }
        onClick={() =>
          loadIncentiveReport(
            incentiveFilters,
            incentivePagination.page + 1,
          )
        }
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
</div>
    </div>
  );
}
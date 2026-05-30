'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;


export default function EPCAccountPage() {

    const [summary, setSummary] = useState({
  totalScheduled: 0,
  totalReceived: 0,
  totalPending: 0,
  pendingApproval: 0,
});

const [projectSummary, setProjectSummary] = useState({
  totalProjects: 0,
  activeProjects: 0,
  completedProjects: 0,
});

const [expenseForm, setExpenseForm] =
  useState({
    expenseType: 'PROJECT_FUND',
    otherExpenseName: '',
    amount: '',
    remarks: '',
  });

const [expenseLoading, setExpenseLoading] =
  useState(false);

  const [expenses, setExpenses] = useState<any[]>([]);

  const [canApproveExpense, setCanApproveExpense] =
  useState(false);

useEffect(() => {
  loadSummary();
  loadExpenses();

  try {
  const userData =
    localStorage.getItem('user');

  if (userData) {
    const user =
      JSON.parse(userData);

    const roles = Array.isArray(
      user?.roles,
    )
      ? user.roles
      : [];

    setCanApproveExpense(
      roles.includes('OWNER') ||
        roles.includes(
          'ACCOUNT_MANAGER',
        ) ||
        roles.includes(
          'PAYMENT_MANAGER',
        ),
    );
  }
} catch (error) {
  console.error(error);
}
}, []);

const loadSummary = async () => {
  try {
    const token =
  localStorage.getItem('token');

const [paymentRes, projectRes] =
  await Promise.all([
    axios.get(
      `${API_BASE_URL}/project/payment-collection`,
      {
        params: {
          limit: 10000,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    ),

    axios.get(
      `${API_BASE_URL}/project`,
      {
        params: {
          limit: 10000,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    ),
  ]);

    const rows = Array.isArray(
  paymentRes.data?.data,
)
  ? paymentRes.data.data
  : [];

    let totalScheduled = 0;
    let totalReceived = 0;
    let totalPending = 0;
    let pendingApproval = 0;

    rows.forEach((row: any) => {
      totalScheduled += Number(
        row.amount || 0,
      );

      totalReceived += Number(
        row.paidAmount || 0,
      );

      totalPending += Number(
        row.pendingAmount || 0,
      );

      if (
        Number(row.paidAmount || 0) > 0 &&
        row.approvalStatus ===
          'PENDING'
      ) {
        pendingApproval += Number(
          row.paidAmount || 0,
        );
      }
    });

    const projects = Array.isArray(
  projectRes.data?.data,
)
  ? projectRes.data.data
  : [];

const totalProjects =
  projects.length;

const completedProjects =
  projects.filter(
    (project: any) =>
      project.status === 'COMPLETED',
  ).length;

const activeProjects =
  totalProjects -
  completedProjects;

setProjectSummary({
  totalProjects,
  activeProjects,
  completedProjects,
});

    setSummary({
      totalScheduled,
      totalReceived,
      totalPending,
      pendingApproval,
    });
  } catch (error) {
    console.error(error);
  }
};

const loadExpenses = async () => {
  try {
    const token =
      localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/account-expenses`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setExpenses(
      Array.isArray(res.data)
        ? res.data
        : [],
    );
  } catch (error) {
    console.error(error);
  }
};

const createExpense = async () => {
  if (!expenseForm.amount) {
    alert('Please enter amount');
    return;
  }

  if (
    expenseForm.expenseType === 'OTHER' &&
    !expenseForm.otherExpenseName.trim()
  ) {
    alert('Please enter Other Expense Name');
    return;
  }

  let finalRemarks = expenseForm.remarks;

  if (expenseForm.expenseType === 'OTHER') {
    finalRemarks = `Other Expense: ${expenseForm.otherExpenseName}${
      expenseForm.remarks
        ? ` | ${expenseForm.remarks}`
        : ''
    }`;
  }

  try {
    setExpenseLoading(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/account-expenses`,
      {
        expenseType: expenseForm.expenseType,
        amount: expenseForm.amount,
        remarks: finalRemarks,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Expense request submitted successfully');

    setExpenseForm({
      expenseType: 'PROJECT_FUND',
      otherExpenseName: '',
      amount: '',
      remarks: '',
    });

    await loadExpenses();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to create expense',
    );
  } finally {
    setExpenseLoading(false);
  }
};

const approveExpense = async (
  expenseId: number,
) => {
  try {
    const token =
      localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/account-expenses/${expenseId}/approve`,
      {},
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    await loadExpenses();
    await loadSummary();

    alert('Expense approved');
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to approve expense',
    );
  }
};

const rejectExpense = async (
  expenseId: number,
) => {
  try {
    const token =
      localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/account-expenses/${expenseId}/reject`,
      {},
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    await loadExpenses();

    alert('Expense rejected');
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to reject expense',
    );
  }
};

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          EPC Account
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage project collections, customer payments, expenses and EPC financial reports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">
      Total Scheduled
    </p>

    <p className="mt-2 text-2xl font-bold text-blue-700">
      ₹
      {summary.totalScheduled.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>

  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">
      Total Received
    </p>

    <p className="mt-2 text-2xl font-bold text-green-700">
      ₹
      {summary.totalReceived.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>

  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">
      Total Pending
    </p>

    <p className="mt-2 text-2xl font-bold text-red-700">
      ₹
      {summary.totalPending.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>

  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">
      Pending Approval
    </p>

    <p className="mt-2 text-2xl font-bold text-yellow-700">
      ₹
      {summary.pendingApproval.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>
</div>

<div className="grid gap-4 md:grid-cols-3">
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">
      Total Projects
    </p>

    <p className="mt-2 text-2xl font-bold text-blue-700">
      {projectSummary.totalProjects}
    </p>
  </div>

  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">
      Active Projects
    </p>

    <p className="mt-2 text-2xl font-bold text-yellow-700">
      {projectSummary.activeProjects}
    </p>
  </div>

  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">
      Completed Projects
    </p>

    <p className="mt-2 text-2xl font-bold text-green-700">
      {projectSummary.completedProjects}
    </p>
  </div>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-bold text-gray-800">
        Expense Management
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Project Fund, Labour, Transportation, Salary, Incentive and other expenses.
      </p>
    </div>

    <button
  type="button"
  onClick={createExpense}
  disabled={expenseLoading}
  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
>
  {expenseLoading
    ? 'Saving...'
    : 'Add Expense'}
</button>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-3">
  <select
    value={expenseForm.expenseType}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        expenseType: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  >
    <option value="PROJECT_FUND">
      Project Fund
    </option>

    <option value="CONTRACTOR_PAYMENT">
      Contractor Payment
    </option>

    <option value="LABOUR_PAYMENT">
      Labour Payment
    </option>

    <option value="TRANSPORTATION">
      Transportation
    </option>

    <option value="SALARY">
      Salary
    </option>

    <option value="INCENTIVE">
      Incentive
    </option>

    <option value="ADVANCE_SALARY">
      Advance Salary
    </option>

    <option value="OTHER">
      Other
    </option>
  </select>

  {expenseForm.expenseType === 'OTHER' && (
  <input
    type="text"
    placeholder="Other Expense Name"
    value={expenseForm.otherExpenseName}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        otherExpenseName: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  />
)}

  <input
    type="number"
    placeholder="Amount"
    value={expenseForm.amount}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        amount: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  />

  <input
    type="text"
    placeholder="Remarks"
    value={expenseForm.remarks}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        remarks: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  />
</div>

  <div className="mt-4 grid gap-3 md:grid-cols-4">
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs text-gray-500">
        Pending Approval
      </p>

      <p className="mt-1 text-lg font-bold">
        ₹0
      </p>
    </div>

    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs text-gray-500">
        Approved Expenses
      </p>

      <p className="mt-1 text-lg font-bold">
        ₹0
      </p>
    </div>

    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs text-gray-500">
        This Month
      </p>

      <p className="mt-1 text-lg font-bold">
        ₹0
      </p>
    </div>

    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs text-gray-500">
        Total Expenses
      </p>

      <p className="mt-1 text-lg font-bold">
        ₹0
      </p>
    </div>
  </div>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <h2 className="text-lg font-bold text-gray-800">
    Recent Expenses
  </h2>

  <div className="mt-4 overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b">
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
            Date
          </th>

          <th className="p-2 text-left">
  Action
</th>
        </tr>
      </thead>

      <tbody>
        {expenses.map((item) => (
          <tr
            key={item.id}
            className="border-b"
          >
            <td className="p-2">
              {item.expenseType}
            </td>

            <td className="p-2">
              ₹
              {Number(
                item.amount || 0,
              ).toLocaleString(
                'en-IN',
              )}
            </td>

            <td className="p-2">
              {item.approvalStatus}
            </td>

            <td className="p-2">
              {item.createdByName}
            </td>

            <td className="p-2">
              {item.createdAt
                ? new Date(
                    item.createdAt,
                  ).toLocaleDateString()
                : '-'}
            </td>

            <td className="p-2">
  {canApproveExpense &&
    item.approvalStatus ===
      'PENDING' && (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            approveExpense(item.id)
          }
          className="rounded bg-green-600 px-2 py-1 text-xs text-white"
        >
          Approve
        </button>

        <button
          type="button"
          onClick={() =>
            rejectExpense(item.id)
          }
          className="rounded bg-red-600 px-2 py-1 text-xs text-white"
        >
          Reject
        </button>
      </div>
    )}
</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/project/payment-collection"
          className="rounded-2xl bg-white p-5 shadow hover:shadow-lg"
        >
          <h2 className="text-lg font-bold text-gray-800">
            Customer Collections
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            View received, pending and overdue customer payments.
          </p>
        </Link>

        <Link
          href="/project/accounts/ledger"
          className="rounded-2xl bg-white p-5 shadow hover:shadow-lg"
        >
          <h2 className="text-lg font-bold text-gray-800">
            EPC Ledger
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            View EPC debit, credit, receivables and payables.
          </p>
        </Link>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">
            Contractor Payments
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Phase 2 Implementation.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">
            Labour Payments
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Phase 2 Implementation.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">
            Transportation
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Phase 2 Implementation.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">
            EPC Profit Reports
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Phase 3 Implementation.
          </p>
        </div>
      </div>
    </div>
  );
}
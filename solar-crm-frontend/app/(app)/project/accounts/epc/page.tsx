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

const [financeSummary, setFinanceSummary] = useState<any>({
  incoming: {},
  outgoing: {},
  cashFlow: {},
  monthly: {},
});

const [expenseForm, setExpenseForm] = useState({
  expenseType: 'MARKET_PURCHASE',
  otherExpenseName: '',
  expenseDate: new Date().toISOString().slice(0, 10),
  expenseHead: '',
  expenseSubType: '',
  amount: '',
  taxableAmount: '',
  gstAmount: '',
  totalAmount: '',
  vendorName: '',
  vendorGstNumber: '',
  billNumber: '',
  billDate: '',
  paymentMode: 'CASH',
  paymentReference: '',
  paidFrom: '',
  paidTo: '',
  branchName: '',
  projectId: '',
  proofUrl: '',
  remarks: '',
});

const [expenseLoading, setExpenseLoading] =
  useState(false);

  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

  const [expenseSummary, setExpenseSummary] =
  useState({
    totalExpenses: 0,
    pendingExpenses: 0,
    contractorPayments: 0,
    labourPayments: 0,
    transportationExpenses: 0,
    salaryAndIncentives: 0,
  });

  const [canApproveExpense, setCanApproveExpense] =
  useState(false);
  const [expenseProofUploading, setExpenseProofUploading] = useState(false);

useEffect(() => {
  loadSummary();
  loadExpenses();
  loadExpenseSummary();
  loadFinanceSummary();

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

const loadFinanceSummary = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/finance-summary`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setFinanceSummary(res.data || {});
  } catch (error) {
    console.error(error);
  }
};

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

const loadExpenseSummary = async () => {
  try {
    const token =
      localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/account-expenses/summary`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setExpenseSummary({
      totalExpenses:
        Number(res.data?.totalExpenses || 0),

      pendingExpenses:
        Number(res.data?.pendingExpenses || 0),

      contractorPayments:
        Number(
          res.data?.contractorPayments || 0,
        ),

      labourPayments:
        Number(
          res.data?.labourPayments || 0,
        ),

      transportationExpenses:
        Number(
          res.data?.transportationExpenses ||
            0,
        ),

      salaryAndIncentives:
        Number(
          res.data?.salaryAndIncentives ||
            0,
        ),
    });
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
  expenseForm.expenseType === 'SITE_PURCHASE' &&
  !expenseForm.expenseSubType.trim()
) {
  alert('Please enter Type for Site Purchase');
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
  ...expenseForm,
  amount: Number(expenseForm.amount || 0),
  taxableAmount: Number(expenseForm.taxableAmount || 0),
  gstAmount: Number(expenseForm.gstAmount || 0),
  totalAmount:
    Number(expenseForm.totalAmount || 0) ||
    Number(expenseForm.amount || 0) +
      Number(expenseForm.gstAmount || 0),
  remarks: finalRemarks,
  projectId: expenseForm.projectId
    ? Number(expenseForm.projectId)
    : null,
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
  expenseType: 'MARKET_PURCHASE',
  otherExpenseName: '',
  expenseDate: new Date().toISOString().slice(0, 10),
  expenseHead: '',
  expenseSubType: '',
  amount: '',
  taxableAmount: '',
  gstAmount: '',
  totalAmount: '',
  vendorName: '',
  vendorGstNumber: '',
  billNumber: '',
  billDate: '',
  paymentMode: 'CASH',
  paymentReference: '',
  paidFrom: '',
  paidTo: '',
  branchName: '',
  projectId: '',
  proofUrl: '',
  remarks: '',
});

    await loadExpenses();
    await loadExpenseSummary();
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

const uploadExpenseProof = async (file: File | null) => {
  if (!file) return;

  try {
    setExpenseProofUploading(true);

    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('files', file);

    const res = await axios.post(
      `${API_BASE_URL}/project/account-expenses/proof/upload`,
      formData,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    const fileUrl = res.data?.fileUrl || '';

    if (!fileUrl) {
      alert('Proof upload failed');
      return;
    }

    setExpenseForm({
      ...expenseForm,
      proofUrl: fileUrl,
    });

    alert('Proof uploaded successfully');
  } catch (error: any) {
    console.error(error);
    alert(
      error?.response?.data?.message ||
        'Failed to upload proof',
    );
  } finally {
    setExpenseProofUploading(false);
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
    await loadExpenseSummary();

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
  const approvalNote = window.prompt(
    'Enter rejection reason',
  );

  if (!approvalNote?.trim()) {
    return;
  }

  try {
    const token =
      localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/account-expenses/${expenseId}/reject`,
      {
        approvalNote,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    await loadExpenses();
    await loadExpenseSummary();

    setSelectedExpense(null);

    alert('Expense rejected');
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to reject expense',
    );
  }
};

const editExpense = async (item: any) => {
  const amount = window.prompt(
    'Enter new amount',
    String(item.amount || ''),
  );

  if (!amount) {
    return;
  }

  const remarks = window.prompt(
    'Enter remarks',
    item.remarks || '',
  );

  try {
    const token =
      localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/account-expenses/${item.id}`,
      {
        amount: Number(amount),
        remarks,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    await loadExpenses();
    await loadExpenseSummary();

    alert('Expense updated');
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to update expense',
    );
  }
};

const hideExpense = async (
  expenseId: number,
) => {
  const hiddenReason = window.prompt(
    'Enter hide reason',
  );

  if (!hiddenReason?.trim()) {
    return;
  }

  try {
    const token =
      localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/account-expenses/${expenseId}/hide`,
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

    await loadExpenses();
    await loadExpenseSummary();

    alert('Expense hidden');
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to hide expense',
    );
  }
};

const contractorExpenses = expenses.filter(
  (item) => item.expenseType === 'CONTRACTOR_PAYMENT',
);

const labourExpenses = expenses.filter(
  (item) => item.expenseType === 'LABOUR_PAYMENT',
);

const transportationExpenses = expenses.filter(
  (item) => item.expenseType === 'TRANSPORTATION',
);

const totalApprovedExpenses = expenses
  .filter((item) => item.approvalStatus === 'APPROVED')
  .reduce(
    (total, item) => total + Number(item.amount || 0),
    0,
  );

const totalPendingExpenses = expenses
  .filter((item) => item.approvalStatus === 'PENDING')
  .reduce(
    (total, item) => total + Number(item.amount || 0),
    0,
  );

const estimatedNetPosition =
  Number(summary.totalReceived || 0) -
  Number(totalApprovedExpenses || 0);

const estimatedPendingPosition =
  Number(summary.totalPending || 0) -
  Number(totalPendingExpenses || 0);

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
      Payment Approval Pending
    </p>

    <p className="mt-2 text-2xl font-bold text-yellow-700">
      ₹
      {summary.pendingApproval.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>
</div>

<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">Total Incoming</p>
    <p className="mt-2 text-2xl font-bold text-green-700">
      ₹{Number(summary.totalReceived || 0).toLocaleString('en-IN')}
    </p>
  </div>

  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">Total Outgoing</p>
    <p className="mt-2 text-2xl font-bold text-red-700">
      ₹{Number(expenseSummary.totalExpenses || 0).toLocaleString('en-IN')}
    </p>
  </div>

  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">Available Cash</p>
    <p className="mt-2 text-2xl font-bold text-blue-700">
      ₹{Number(
        Number(summary.totalReceived || 0) -
          Number(expenseSummary.totalExpenses || 0),
      ).toLocaleString('en-IN')}
    </p>
  </div>

  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">Pending Outgoing</p>
    <p className="mt-2 text-2xl font-bold text-orange-700">
      ₹{Number(expenseSummary.pendingExpenses || 0).toLocaleString('en-IN')}
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
        Record market purchases, office expenses, labour, contractor, salary, transport and other outgoing payments.
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
    <option value="MARKET_PURCHASE">Market Purchase</option>
    <option value="SITE_PURCHASE">Site Purchase</option>
    <option value="PROJECT_FUND">Project Fund</option>
    <option value="CONTRACTOR_PAYMENT">Contractor Payment</option>
    <option value="LABOUR_PAYMENT">Labour Payment</option>
    <option value="TRANSPORTATION">Transportation</option>
    <option value="OFFICE_EXPENSE">Office Expense</option>
    <option value="OFFICE_SUPPLIES">Office Supplies</option>
    <option value="EQUIPMENT_PURCHASE">Equipment Purchase</option>
    <option value="TRAVEL">Travel</option>
    <option value="HOTEL">Hotel</option>
    <option value="FOOD">Food</option>
    <option value="FUEL">Fuel</option>
    <option value="VEHICLE_EXPENSE">Vehicle Expense</option>
    <option value="RENT">Rent</option>
    <option value="ELECTRICITY_BILL">Electricity Bill</option>
    <option value="INTERNET_BILL">Internet Bill</option>
    <option value="MOBILE_RECHARGE">Mobile Recharge</option>
    <option value="SALARY">Salary</option>
    <option value="INCENTIVE">Incentive</option>
    <option value="ADVANCE_SALARY">Advance Salary</option>
    <option value="MARKETING">Marketing</option>
    <option value="PRINTING">Printing</option>
    <option value="COURIER">Courier</option>
    <option value="STATIONERY">Stationery</option>
    <option value="REPAIR_MAINTENANCE">Repair & Maintenance</option>
    <option value="CUSTOMER_VISIT">Customer Visit</option>
    <option value="OTHER">Other</option>
  </select>

  {expenseForm.expenseType === 'SITE_PURCHASE' && (
  <div>
    <label className="mb-1 block text-sm font-semibold text-gray-700">
      Type
    </label>

    <input
      placeholder="Enter site purchase type"
      value={expenseForm.expenseSubType}
      onChange={(e) =>
        setExpenseForm({
          ...expenseForm,
          expenseSubType: e.target.value,
        })
      }
      className="w-full rounded-xl border p-3"
    />
  </div>
)}

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

  <div>
  <label className="mb-1 block text-xs font-semibold text-gray-500">
    Expense Date *
  </label>

  <input
    type="date"
    value={expenseForm.expenseDate}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        expenseDate: e.target.value,
      })
    }
    className="w-full rounded-xl border p-3"
  />
</div>

  <input
    type="text"
    placeholder="Expense Head / Purpose"
    value={expenseForm.expenseHead}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        expenseHead: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  />

  <input
    type="text"
    placeholder="Vendor / Shop Name"
    value={expenseForm.vendorName}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        vendorName: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  />

  <input
    type="text"
    placeholder="Vendor GST Number"
    value={expenseForm.vendorGstNumber}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        vendorGstNumber: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  />

  <input
    type="text"
    placeholder="Bill Number"
    value={expenseForm.billNumber}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        billNumber: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  />

  <div>
  <label className="mb-1 block text-xs font-semibold text-gray-500">
    Bill / Invoice Date
  </label>

  <input
    type="date"
    value={expenseForm.billDate}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        billDate: e.target.value,
      })
    }
    className="w-full rounded-xl border p-3"
  />
</div>

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
    type="number"
    placeholder="Taxable Amount"
    value={expenseForm.taxableAmount}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        taxableAmount: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  />

  <input
    type="number"
    placeholder="GST Amount"
    value={expenseForm.gstAmount}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        gstAmount: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  />

  <input
    type="number"
    placeholder="Total Amount"
    value={expenseForm.totalAmount}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        totalAmount: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  />

  <select
    value={expenseForm.paymentMode}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        paymentMode: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  >
    <option value="CASH">Cash</option>
    <option value="UPI">UPI</option>
    <option value="BANK_TRANSFER">Bank Transfer</option>
    <option value="CHEQUE">Cheque</option>
    <option value="CARD">Card</option>
    <option value="CREDIT">Credit / Pay Later</option>
  </select>

  <input
    type="text"
    placeholder="Payment Reference"
    value={expenseForm.paymentReference}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        paymentReference: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  />

  <input
    type="text"
    placeholder="Paid From"
    value={expenseForm.paidFrom}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        paidFrom: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  />

  <input
    type="text"
    placeholder="Paid To"
    value={expenseForm.paidTo}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        paidTo: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  />

  <input
    type="text"
    placeholder="Branch"
    value={expenseForm.branchName}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        branchName: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  />

  <input
    type="number"
    placeholder="Project ID (optional)"
    value={expenseForm.projectId}
    onChange={(e) =>
      setExpenseForm({
        ...expenseForm,
        projectId: e.target.value,
      })
    }
    className="rounded-xl border p-3"
  />

  <div className="rounded-xl border p-3">
  <p className="mb-2 text-xs font-semibold text-gray-500">
    Upload Bill / Receipt
  </p>

  <input
    type="file"
    accept="image/*,application/pdf"
    onChange={(e) =>
      uploadExpenseProof(e.target.files?.[0] || null)
    }
    className="w-full text-sm"
  />

  {expenseProofUploading && (
    <p className="mt-2 text-xs font-semibold text-blue-600">
      Uploading proof...
    </p>
  )}

  {expenseForm.proofUrl && (
    <div className="mt-2 flex gap-3 text-xs">
      <a
        href={expenseForm.proofUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-blue-600"
      >
        View Proof
      </a>

      <button
        type="button"
        onClick={() =>
          setExpenseForm({
            ...expenseForm,
            proofUrl: '',
          })
        }
        className="font-semibold text-red-600"
      >
        Remove
      </button>
    </div>
  )}
</div>

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
    className="rounded-xl border p-3 md:col-span-3"
  />
</div>

  <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
  <div className="rounded-xl bg-gray-50 p-3">
    <p className="text-xs text-gray-500">
      Total Expenses
    </p>

    <p className="mt-1 text-lg font-bold">
      ₹
      {expenseSummary.totalExpenses.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-3">
    <p className="text-xs text-gray-500">
      Pending Expenses
    </p>

    <p className="mt-1 text-lg font-bold text-yellow-700">
      ₹
      {expenseSummary.pendingExpenses.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-3">
    <p className="text-xs text-gray-500">
      Contractor
    </p>

    <p className="mt-1 text-lg font-bold text-red-700">
      ₹
      {expenseSummary.contractorPayments.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-3">
    <p className="text-xs text-gray-500">
      Labour
    </p>

    <p className="mt-1 text-lg font-bold text-orange-700">
      ₹
      {expenseSummary.labourPayments.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-3">
    <p className="text-xs text-gray-500">
      Transportation
    </p>

    <p className="mt-1 text-lg font-bold text-blue-700">
      ₹
      {expenseSummary.transportationExpenses.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-3">
    <p className="text-xs text-gray-500">
      Salary & Incentive
    </p>

    <p className="mt-1 text-lg font-bold text-green-700">
      ₹
      {expenseSummary.salaryAndIncentives.toLocaleString(
        'en-IN',
      )}
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

          <th className="p-2 text-left">Expense Date</th>
<th className="p-2 text-left">Vendor / Shop</th>
<th className="p-2 text-left">Bill No.</th>

          <th className="p-2 text-left">
            Amount
          </th>

          <th className="p-2 text-left">GST</th>
<th className="p-2 text-left">Total</th>
<th className="p-2 text-left">Payment</th>
<th className="p-2 text-left">Proof</th>

          <th className="p-2 text-left">
            Status
          </th>

          <th className="p-2 text-left">
            Created By
          </th>

          <th className="p-2 text-left">
            Created Date
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
  <div>
    <p>{item.expenseType}</p>
    {item.expenseSubType && (
      <p className="text-xs text-gray-500">
        Type: {item.expenseSubType}
      </p>
    )}
  </div>
</td>

            <td className="p-2">
  {item.expenseDate
    ? new Date(item.expenseDate).toLocaleDateString('en-IN')
    : '-'}
</td>

<td className="p-2">
  {item.vendorName || item.paidTo || '-'}
</td>

<td className="p-2">
  {item.billNumber || '-'}
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
  ₹{Number(item.gstAmount || 0).toLocaleString('en-IN')}
</td>

<td className="p-2 font-semibold">
  ₹{Number(item.totalAmount || item.amount || 0).toLocaleString('en-IN')}
</td>

<td className="p-2">
  <div className="text-xs">
    <p>{item.paymentMode || '-'}</p>
    {item.paymentReference && (
      <p className="text-gray-500">{item.paymentReference}</p>
    )}
  </div>
</td>

<td className="p-2">
  {item.proofUrl ? (
    <a
      href={item.proofUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs font-semibold text-blue-600"
    >
      View
    </a>
  ) : (
    '-'
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
  <div className="flex flex-wrap gap-2">
    {canApproveExpense &&
      item.approvalStatus ===
        'PENDING' && (
        <>

        <button
  type="button"
  onClick={() => setSelectedExpense(item)}
  className="rounded bg-indigo-600 px-2 py-1 text-xs text-white"
>
  View
</button>

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
        </>
      )}

    {canApproveExpense &&
      item.approvalStatus !==
        'APPROVED' && (
        <button
          type="button"
          onClick={() =>
            editExpense(item)
          }
          className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
        >
          Edit
        </button>
      )}

    {canApproveExpense && (
      <button
        type="button"
        onClick={() =>
          hideExpense(item.id)
        }
        className="rounded bg-gray-700 px-2 py-1 text-xs text-white"
      >
        Hide
      </button>
    )}
  </div>
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
    Approved and pending contractor payment expenses.
  </p>

  <p className="mt-4 text-2xl font-bold text-red-700">
    ₹
    {contractorExpenses
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0,
      )
      .toLocaleString('en-IN')}
  </p>

  <p className="mt-2 text-xs text-gray-500">
    Entries: {contractorExpenses.length}
  </p>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <h2 className="text-lg font-bold text-gray-800">
    Labour Payments
  </h2>

  <p className="mt-2 text-sm text-gray-500">
    Labour related approved and pending expenses.
  </p>

  <p className="mt-4 text-2xl font-bold text-orange-700">
    ₹
    {labourExpenses
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0,
      )
      .toLocaleString('en-IN')}
  </p>

  <p className="mt-2 text-xs text-gray-500">
    Entries: {labourExpenses.length}
  </p>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <h2 className="text-lg font-bold text-gray-800">
    Transportation
  </h2>

  <p className="mt-2 text-sm text-gray-500">
    Transportation and logistics expense tracking.
  </p>

  <p className="mt-4 text-2xl font-bold text-blue-700">
    ₹
    {transportationExpenses
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0,
      )
      .toLocaleString('en-IN')}
  </p>

  <p className="mt-2 text-xs text-gray-500">
    Entries: {transportationExpenses.length}
  </p>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <h2 className="text-lg font-bold text-gray-800">
    EPC Profit Reports
  </h2>

  <p className="mt-2 text-sm text-gray-500">
    Estimated position based on received collections and approved expenses.
  </p>

  <div className="mt-4 space-y-2 text-sm">
    <div className="flex justify-between">
      <span className="text-gray-500">
        Total Received
      </span>
      <span className="font-semibold text-green-700">
        ₹
        {summary.totalReceived.toLocaleString('en-IN')}
      </span>
    </div>

    <div className="flex justify-between">
      <span className="text-gray-500">
        Approved Expenses
      </span>
      <span className="font-semibold text-red-700">
        ₹
        {totalApprovedExpenses.toLocaleString('en-IN')}
      </span>
    </div>

    <div className="border-t pt-2 flex justify-between">
      <span className="font-semibold text-gray-700">
        Estimated Net
      </span>
      <span
        className={`font-bold ${
          estimatedNetPosition >= 0
            ? 'text-green-700'
            : 'text-red-700'
        }`}
      >
        ₹
        {estimatedNetPosition.toLocaleString('en-IN')}
      </span>
    </div>

    <div className="flex justify-between">
      <span className="text-gray-500">
        Pending Collection - Pending Expenses
      </span>
      <span className="font-semibold text-blue-700">
        ₹
        {estimatedPendingPosition.toLocaleString('en-IN')}
      </span>
    </div>
  </div>
</div>
      </div>

      {selectedExpense && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Expense Details
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Review purpose, proof and approval status before taking action.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedExpense(null)}
          className="rounded bg-gray-200 px-3 py-1 text-sm font-semibold"
        >
          Close
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
  <div className="rounded-xl bg-gray-50 p-3">
    <p className="text-xs text-gray-500">Type</p>
    <p className="mt-1 font-bold">
      {selectedExpense.expenseType || '-'}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-3">
    <p className="text-xs text-gray-500">Sub Type</p>
    <p className="mt-1 font-bold">
      {selectedExpense.expenseSubType || '-'}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-3">
    <p className="text-xs text-gray-500">Amount</p>
    <p className="mt-1 font-bold text-blue-700">
      ₹{Number(selectedExpense.amount || 0).toLocaleString('en-IN')}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-3">
    <p className="text-xs text-gray-500">Status</p>
    <p className="mt-1 font-bold">
      {selectedExpense.approvalStatus || '-'}
    </p>
  </div>
</div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border p-3">
          <p className="text-xs font-semibold text-gray-500">
            Purpose
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
            {selectedExpense.purpose || '-'}
          </p>
        </div>

        <div className="rounded-xl border p-3">
          <p className="text-xs font-semibold text-gray-500">
            Remarks
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
            {selectedExpense.remarks || '-'}
          </p>
        </div>

        <div className="rounded-xl border p-3">
          <p className="text-xs font-semibold text-gray-500">
            Submitted By
          </p>
          <p className="mt-1 text-sm font-semibold">
            {selectedExpense.createdByName || '-'}
          </p>
        </div>

        <div className="rounded-xl border p-3">
          <p className="text-xs font-semibold text-gray-500">
            Submitted Date
          </p>
          <p className="mt-1 text-sm font-semibold">
            {selectedExpense.createdAt
              ? new Date(selectedExpense.createdAt).toLocaleString()
              : '-'}
          </p>
        </div>

        <div className="rounded-xl border p-3">
          <p className="text-xs font-semibold text-gray-500">
            Branch
          </p>
          <p className="mt-1 text-sm font-semibold">
            {selectedExpense.branchName || '-'}
          </p>
        </div>

        <div className="rounded-xl border p-3">
          <p className="text-xs font-semibold text-gray-500">
            Project
          </p>
          <p className="mt-1 text-sm font-semibold">
            {selectedExpense.projectId || '-'}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border p-3">
        <p className="text-sm font-bold text-gray-800">
          Proof
        </p>

        {!selectedExpense.proofUrl ? (
          <p className="mt-2 text-sm text-gray-500">
            No proof uploaded.
          </p>
        ) : String(selectedExpense.proofUrl).toLowerCase().includes('.pdf') ? (
          <a
            href={selectedExpense.proofUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Open PDF Proof
          </a>
        ) : (
          <a
            href={selectedExpense.proofUrl}
            target="_blank"
            rel="noreferrer"
          >
            <img
              src={selectedExpense.proofUrl}
              alt="Expense proof"
              className="mt-3 max-h-96 w-full rounded-xl border object-contain"
            />
          </a>
        )}
      </div>

      {selectedExpense.approvalNote && (
        <div className="mt-4 rounded-xl bg-yellow-50 p-3">
          <p className="text-xs font-semibold text-yellow-700">
            Approval Note
          </p>
          <p className="mt-1 text-sm text-yellow-900">
            {selectedExpense.approvalNote}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        {canApproveExpense &&
          selectedExpense.approvalStatus === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={() => approveExpense(selectedExpense.id)}
                className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Approve
              </button>

              <button
                type="button"
                onClick={() => rejectExpense(selectedExpense.id)}
                className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Reject
              </button>
            </>
          )}

        <button
          type="button"
          onClick={() => setSelectedExpense(null)}
          className="rounded bg-gray-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
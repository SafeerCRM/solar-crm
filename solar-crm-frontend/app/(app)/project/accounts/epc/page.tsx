'use client';

import { useEffect, useRef, useState } from 'react';
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
  contractorAssignmentId: '',
  proofUrl: '',
  remarks: '',
});

const [expenseLoading, setExpenseLoading] =
  useState(false);

  type ContractorAssignmentOption = {
  id: number;
  projectId: number;
  contractorId: number;
  contractorName: string;
  contractorPhone?: string;
  workScope: string;
  status: string;
  amount: number;
  project?: {
    id: number;
    customerName: string;
    electricityKNumber: string;
    branchName: string;
    city: string;
  } | null;
};

const [assignmentSearch, setAssignmentSearch] =
  useState('');

const [assignmentOptions, setAssignmentOptions] =
  useState<ContractorAssignmentOption[]>([]);

const [assignmentPage, setAssignmentPage] =
  useState(1);

const [assignmentTotal, setAssignmentTotal] =
  useState(0);

const [assignmentLoading, setAssignmentLoading] =
  useState(false);

const [assignmentDropdownOpen, setAssignmentDropdownOpen] =
  useState(false);

  const assignmentRequestIdRef = useRef(0);

  const fetchContractorAssignments = async (
  search: string,
  page: number = 1,
) => {
  const requestId = ++assignmentRequestIdRef.current;

try {
  setAssignmentLoading(true);

  const token = localStorage.getItem('token');

    const response = await axios.get(
      `${API_BASE_URL}/project/contractor-assignments/register`,
      {
        params: {
          page,
          limit: 20,
          search: search.trim(),
          ...(expenseForm.projectId
            ? { projectId: Number(expenseForm.projectId) }
            : {}),
        },
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      },
    );

    if (requestId !== assignmentRequestIdRef.current) {
  return;
}

    const records: ContractorAssignmentOption[] =
      Array.isArray(response.data?.data)
        ? response.data.data
        : [];

    const total = Number(response.data?.total || 0);

    setAssignmentOptions((previous) => {
      if (page === 1) {
        return records;
      }

      const existingIds = new Set(
        previous.map((item) => item.id),
      );

      return [
        ...previous,
        ...records.filter(
          (item) => !existingIds.has(item.id),
        ),
      ];
    });

    setAssignmentTotal(total);
    setAssignmentPage(page);
  } catch (error) {
    if (requestId !== assignmentRequestIdRef.current) {
  return;
}
    console.error(
      'Failed to fetch contractor assignments:',
      error,
    );

    if (page === 1) {
      setAssignmentOptions([]);
      setAssignmentTotal(0);
    }
  } finally {
  if (requestId === assignmentRequestIdRef.current) {
    setAssignmentLoading(false);
  }
}
};

useEffect(() => {
  if (
    expenseForm.expenseType !== 'CONTRACTOR_PAYMENT' ||
    !assignmentDropdownOpen
  ) {
    assignmentRequestIdRef.current += 1;
    setAssignmentLoading(false);
    return;
  }

  const timeout = setTimeout(() => {
    fetchContractorAssignments(
      assignmentSearch,
      1,
    );
  }, 350);

  return () => {
  clearTimeout(timeout);
  assignmentRequestIdRef.current += 1;
};
}, [
  assignmentSearch,
  assignmentDropdownOpen,
  expenseForm.projectId,
  expenseForm.expenseType,
]);

  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

  const [expensePage, setExpensePage] = useState(1);
const [expenseLimit] = useState(20);

const [expensePagination, setExpensePagination] =
  useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

const [expenseStaffFilter, setExpenseStaffFilter] =
  useState('');

const [expenseTypeFilter, setExpenseTypeFilter] =
  useState('');

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
  const [
  canConfirmContractorPayment,
  setCanConfirmContractorPayment,
] = useState(false);
const [settlementPaymentMode, setSettlementPaymentMode] =
  useState('BANK_TRANSFER');

const [settlementPaymentReference, setSettlementPaymentReference] =
  useState('');

const [settlementProofUrl, setSettlementProofUrl] =
  useState('');

const [settlementConfirming, setSettlementConfirming] =
  useState(false);
const [settlementExpense, setSettlementExpense] =
  useState<any | null>(null);

const [settlementPreview, setSettlementPreview] =
  useState<any | null>(null);

const [settlementLoading, setSettlementLoading] =
  useState(false);

const [settlementError, setSettlementError] =
  useState('');
  const [expenseProofUploading, setExpenseProofUploading] = useState(false);

useEffect(() => {
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

    setCanConfirmContractorPayment(
  roles.includes('OWNER') ||
    roles.includes('ACCOUNT_MANAGER') ||
    roles.includes('PAYMENT_MANAGER'),
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
    setProjectSummary({
  totalProjects: Number(
    res.data?.projectSummary?.totalProjects || 0,
  ),
  activeProjects: Number(
    res.data?.projectSummary?.activeProjects || 0,
  ),
  completedProjects: Number(
    res.data?.projectSummary?.completedProjects || 0,
  ),
});
setSummary({
  totalScheduled: Number(
    res.data?.collections?.totalScheduled || 0,
  ),
  totalReceived: Number(
    res.data?.collections?.totalReceived || 0,
  ),
  totalPending: Number(
    res.data?.collections?.totalPending || 0,
  ),
  pendingApproval: Number(
    res.data?.collections?.paymentApprovalPending || 0,
  ),
});
  } catch (error) {
    console.error(error);
  }
};

const loadExpenses = async (
  page: number = expensePage,
  staffName: string = expenseStaffFilter,
  expenseType: string = expenseTypeFilter,
) => {
  try {
    const token =
      localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/account-expenses`,
      {
        params: {
          page,
          limit: expenseLimit,
          staffName: staffName.trim(),
          expenseType,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setExpenses(
      Array.isArray(res.data?.data)
        ? res.data.data
        : [],
    );

    setExpensePagination({
      page: Number(
        res.data?.pagination?.page || page,
      ),
      limit: Number(
        res.data?.pagination?.limit ||
          expenseLimit,
      ),
      total: Number(
        res.data?.pagination?.total || 0,
      ),
      totalPages: Number(
        res.data?.pagination?.totalPages ||
          1,
      ),
    });

    setExpensePage(
      Number(
        res.data?.pagination?.page || page,
      ),
    );
  } catch (error) {
    console.error(error);

    setExpenses([]);

    setExpensePagination({
      page: 1,
      limit: expenseLimit,
      total: 0,
      totalPages: 1,
    });
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

  if (
  expenseForm.expenseType === 'CONTRACTOR_PAYMENT' &&
  (
    !expenseForm.projectId ||
    !expenseForm.contractorAssignmentId
  )
) {
  alert(
    'Please select a project and contractor assignment',
  );
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

contractorAssignmentId:
  expenseForm.expenseType === 'CONTRACTOR_PAYMENT' &&
  expenseForm.contractorAssignmentId
    ? Number(expenseForm.contractorAssignmentId)
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
  contractorAssignmentId: '',
  proofUrl: '',
  remarks: '',
});

    await loadExpenses();
    await loadExpenseSummary();
    await loadFinanceSummary();
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
await loadExpenseSummary();
await loadFinanceSummary();

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
    await loadFinanceSummary();

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

const previewContractorPayment = async (expense: any) => {
  setSettlementExpense(expense);
  setSettlementPreview(null);
  setSettlementError('');
  setSettlementLoading(true);

  try {
    const token = localStorage.getItem('token');

    const response = await axios.get(
      `${API_BASE_URL}/project/account-expenses/${expense.id}/contractor-settlement-preview`,
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      },
    );

    if (response.data?.alreadySettled) {
  setSettlementError(
    'This contractor payment has already been settled. Duplicate payment confirmation is not allowed.',
  );
  setSettlementPreview(null);
  return;
}

setSettlementPreview(response.data);
  } catch (error: any) {
    setSettlementError(
      error?.response?.data?.message ||
        'Unable to calculate contractor payment settlement.',
    );
  } finally {
    setSettlementLoading(false);
  }
};

const confirmContractorPayment = async () => {
  if (!settlementExpense || !settlementPreview) return;

  const netAmount = Number(settlementPreview.netPayable);

  if (!Number.isFinite(netAmount) || netAmount < 0) {
    alert('Invalid net payment amount');
    return;
  }

  if (
    netAmount > 0 &&
    (!settlementPaymentMode ||
      (!settlementPaymentReference.trim() &&
        !settlementProofUrl.trim()))
  ) {
    alert('Enter payment mode and payment reference or proof URL');
    return;
  }

  const confirmed = window.confirm(
    `Confirm contractor payment?\n\n` +
      `Gross: ₹${Number(settlementPreview.grossAmount).toLocaleString('en-IN')}\n` +
      `Penalty deduction: ₹${Number(settlementPreview.proposedPenaltyDeduction).toLocaleString('en-IN')}\n` +
      `Net payment: ₹${netAmount.toLocaleString('en-IN')}\n\n` +
      `This will record the payment and penalty recovery.`,
  );

  if (!confirmed) return;

  try {
    setSettlementConfirming(true);
    setSettlementError('');

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/account-expenses/${settlementExpense.id}/confirm-contractor-payment`,
      {
        paymentMode: settlementPaymentMode,
        paymentReference: settlementPaymentReference.trim(),
        proofUrl: settlementProofUrl.trim(),
        netPaidAmount: netAmount,
      },
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      },
    );

    setSettlementExpense(null);
    setSettlementPreview(null);
    setSettlementPaymentReference('');
    setSettlementProofUrl('');

    await loadExpenses();
    await loadExpenseSummary();
    await loadFinanceSummary();

    alert('Contractor payment confirmed and penalty recovery recorded.');
  } catch (error: any) {
    setSettlementError(
      error?.response?.data?.message ||
        'Contractor payment confirmation failed.',
    );
  } finally {
    setSettlementConfirming(false);
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
    await loadFinanceSummary();

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
    await loadFinanceSummary();

    alert('Expense hidden');
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to hide expense',
    );
  }
};

const applyExpenseFilters = async () => {
  setExpensePage(1);

  await loadExpenses(
    1,
    expenseStaffFilter,
    expenseTypeFilter,
  );
};

const resetExpenseFilters = async () => {
  setExpenseStaffFilter('');
  setExpenseTypeFilter('');
  setExpensePage(1);

  await loadExpenses(1, '', '');
};

const changeExpensePage = async (
  nextPage: number,
) => {
  if (
    nextPage < 1 ||
    nextPage > expensePagination.totalPages ||
    nextPage === expensePage
  ) {
    return;
  }

  setExpensePage(nextPage);

  await loadExpenses(
    nextPage,
    expenseStaffFilter,
    expenseTypeFilter,
  );
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
    onChange={(e) => {
  const newExpenseType = e.target.value;

  setExpenseForm((previous) => ({
    ...previous,
    expenseType: newExpenseType,
    contractorAssignmentId: '',
  }));

  setAssignmentSearch('');
  setAssignmentOptions([]);
  setAssignmentTotal(0);
  setAssignmentPage(1);
  setAssignmentDropdownOpen(false);
}}
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

  {expenseForm.expenseType === 'CONTRACTOR_PAYMENT' && (
  <div className="relative md:col-span-3">
    <label className="mb-1 block text-sm font-semibold text-gray-700">
      Contractor Assignment *
    </label>

    <input
      type="text"
      placeholder="Search contractor, customer, K No, project ID or assignment ID"
      value={assignmentSearch}
      onFocus={() => setAssignmentDropdownOpen(true)}
      onChange={(e) => {
        setAssignmentSearch(e.target.value);
        setAssignmentDropdownOpen(true);
        setExpenseForm((previous) => ({
          ...previous,
          contractorAssignmentId: '',
        }));
      }}
      className="w-full rounded-xl border border-gray-400 p-3"
    />

    {expenseForm.contractorAssignmentId && (
      <p className="mt-1 text-xs font-semibold text-green-700">
        Selected Assignment #{expenseForm.contractorAssignmentId}
      </p>
    )}

    {assignmentDropdownOpen && (
      <div className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-gray-300 bg-white p-2 shadow-lg">
        {assignmentLoading &&
  assignmentOptions.length === 0 && (
    <p className="p-2 text-sm text-gray-500">
      Searching assignments...
    </p>
  )}

{!assignmentLoading &&
  assignmentOptions.length === 0 && (
            <p className="p-2 text-sm text-gray-500">
              No matching assignments found.
            </p>
          )}

        {assignmentOptions.map((assignment) => (
          <button
            key={assignment.id}
            type="button"
            onClick={() => {
              setExpenseForm((previous) => ({
                ...previous,
                projectId: String(assignment.projectId),
                contractorAssignmentId: String(assignment.id),
              }));

              setAssignmentSearch(
                `${assignment.contractorName} — ${assignment.project?.customerName || 'Project'} (#${assignment.projectId})`,
              );

              setAssignmentDropdownOpen(false);
            }}
            className="mb-1 w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-blue-50"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-gray-900">
                {assignment.contractorName}
              </span>

              <span className="text-xs font-semibold text-blue-700">
                {assignment.status}
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-700">
              {assignment.project?.customerName || 'Customer unavailable'}
              {' · '}Project #{assignment.projectId}
            </p>

            <p className="text-xs text-gray-600">
              K No: {assignment.project?.electricityKNumber || 'N/A'}
              {' · '}Assignment #{assignment.id}
            </p>

            <p className="text-xs text-gray-600">
              {assignment.workScope || 'Work scope unavailable'}
              {' · '}{assignment.project?.city || 'City unavailable'}
            </p>
          </button>
        ))}

        {assignmentOptions.length < assignmentTotal && (
          <button
            type="button"
            disabled={assignmentLoading}
            onClick={() =>
              fetchContractorAssignments(
                assignmentSearch,
                assignmentPage + 1,
              )
            }
            className="mt-2 w-full rounded-lg border border-blue-300 p-2 text-sm font-semibold text-blue-700 disabled:opacity-50"
          >
            {assignmentLoading
              ? 'Loading...'
              : `Load More (${assignmentOptions.length} of ${assignmentTotal})`}
          </button>
        )}

        <button
          type="button"
          onClick={() => setAssignmentDropdownOpen(false)}
          className="mt-2 w-full p-2 text-sm text-gray-500"
        >
          Close Results
        </button>
      </div>
    )}
  </div>
)}

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
  placeholder={
    expenseForm.expenseType === 'CONTRACTOR_PAYMENT'
      ? 'Project ID (required)'
      : 'Project ID (optional)'
  }
  value={expenseForm.projectId}
  onChange={(e) => {
    const newProjectId = e.target.value;

    setExpenseForm((previous) => ({
      ...previous,
      projectId: newProjectId,
      contractorAssignmentId:
        newProjectId === previous.projectId
          ? previous.contractorAssignmentId
          : '',
    }));

    if (newProjectId !== expenseForm.projectId) {
      setAssignmentSearch('');
      setAssignmentOptions([]);
      setAssignmentTotal(0);
      setAssignmentPage(1);
    }
  }}
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
  <div>
    <h2 className="text-lg font-bold text-gray-800">
      Recent Expenses
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Showing {expensePagination.total} matching expense
      {expensePagination.total === 1 ? '' : 's'}
    </p>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
    <input
      type="text"
      placeholder="Search Staff Name"
      value={expenseStaffFilter}
      onChange={(e) =>
        setExpenseStaffFilter(e.target.value)
      }
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          applyExpenseFilters();
        }
      }}
      className="rounded-xl border p-3"
    />

    <select
      value={expenseTypeFilter}
      onChange={(e) =>
        setExpenseTypeFilter(e.target.value)
      }
      className="rounded-xl border p-3"
    >
      <option value="">All Expense Types</option>
      <option value="MARKET_PURCHASE">
        Market Purchase
      </option>
      <option value="SITE_PURCHASE">
        Site Purchase
      </option>
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
      <option value="OFFICE_EXPENSE">
        Office Expense
      </option>
      <option value="OFFICE_SUPPLIES">
        Office Supplies
      </option>
      <option value="EQUIPMENT_PURCHASE">
        Equipment Purchase
      </option>
      <option value="TRAVEL">
        Travel
      </option>
      <option value="HOTEL">Hotel</option>
      <option value="FOOD">Food</option>
      <option value="FUEL">Fuel</option>
      <option value="VEHICLE_EXPENSE">
        Vehicle Expense
      </option>
      <option value="RENT">Rent</option>
      <option value="ELECTRICITY_BILL">
        Electricity Bill
      </option>
      <option value="INTERNET_BILL">
        Internet Bill
      </option>
      <option value="MOBILE_RECHARGE">
        Mobile Recharge
      </option>
      <option value="SALARY">Salary</option>
      <option value="INCENTIVE">Incentive</option>
      <option value="ADVANCE_SALARY">
        Advance Salary
      </option>
      <option value="MARKETING">
        Marketing
      </option>
      <option value="PRINTING">
        Printing
      </option>
      <option value="COURIER">Courier</option>
      <option value="STATIONERY">
        Stationery
      </option>
      <option value="REPAIR_MAINTENANCE">
        Repair &amp; Maintenance
      </option>
      <option value="CUSTOMER_VISIT">
        Customer Visit
      </option>
      <option value="OTHER">Other</option>
    </select>

    <button
      type="button"
      onClick={applyExpenseFilters}
      className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
    >
      Apply Filters
    </button>

    <button
      type="button"
      onClick={resetExpenseFilters}
      className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700"
    >
      Reset
    </button>
  </div>

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

        {expenses.length === 0 && (
  <tr>
    <td
      colSpan={13}
      className="p-6 text-center text-sm text-gray-500"
    >
      No expenses found for the selected filters.
    </td>
  </tr>
)}

        {expenses.map((item) => (
          <tr
            key={item.id}
            className="border-b"
          >
            <td className="p-2">
  <div>
    <p>{item.expenseType}</p>
    {item.projectId && (
  <p className="mt-1 text-xs font-semibold text-blue-700">
    Project #{item.projectId}
    {item.projectCustomerName && ` - ${item.projectCustomerName}`}
    {item.projectKNumber && ` | K-Number: ${item.projectKNumber}`}
  </p>
)}
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
    {canApproveExpense && (
  <button
    type="button"
    onClick={() => setSelectedExpense(item)}
    className="rounded bg-indigo-600 px-2 py-1 text-xs text-white"
  >
    View
  </button>
)}

{canApproveExpense &&
  item.approvalStatus === 'PENDING' && (
    <>
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

      {canConfirmContractorPayment &&
  item.expenseType === 'CONTRACTOR_PAYMENT' &&
  item.approvalStatus === 'APPROVED' &&
  item.expenseStatus === 'UNPAID' && (
    <button
      type="button"
      onClick={() => previewContractorPayment(item)}
      className="rounded bg-purple-700 px-2 py-1 text-xs font-semibold text-white hover:bg-purple-800"
    >
      Preview Payment
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

    <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-sm text-gray-500">
      Page {expensePagination.page} of{' '}
      {expensePagination.totalPages}
      {' '}— {expensePagination.total} total record
      {expensePagination.total === 1 ? '' : 's'}
    </p>

    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() =>
          changeExpensePage(expensePage - 1)
        }
        disabled={expensePage <= 1}
        className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>

      <span className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold">
        {expensePage}
      </span>

      <button
        type="button"
        onClick={() =>
          changeExpensePage(expensePage + 1)
        }
        disabled={
          expensePage >=
          expensePagination.totalPages
        }
        className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
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

      {settlementExpense && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">
          Contractor Payment Settlement
        </h2>

        <button
          type="button"
          onClick={() => {
            setSettlementExpense(null);
            setSettlementPreview(null);
            setSettlementError('');
          }}
          className="rounded-lg border px-3 py-1 text-sm"
        >
          Close
        </button>
      </div>

      <p className="mt-2 text-sm text-gray-600">
        Expense #{settlementExpense.id}
        {' · '}
        Project #{settlementExpense.projectId || 'N/A'}
      </p>

      {settlementLoading && (
        <p className="mt-4 text-sm text-gray-500">
          Calculating outstanding SLA penalties...
        </p>
      )}

      {settlementError && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {settlementError}
        </p>
      )}

      {settlementPreview && (
        <div className="mt-5 space-y-3">
          {[
  ['Gross Payment', settlementPreview.grossAmount],
  ['Outstanding Penalties', settlementPreview.totalOutstandingPenalty],
  ['Penalty Deduction', settlementPreview.proposedPenaltyDeduction],
  ['Net Payable', settlementPreview.netPayable],
].map(([label, amount]) => (
            <div
              key={String(label)}
              className="flex justify-between gap-3 border-b pb-2 text-sm"
            >
              <span className="text-gray-600">{label}</span>
              <span className="font-semibold">
                ₹{Number(amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          ))}

          <div className="space-y-3 border-t pt-4">
  <h3 className="text-sm font-bold text-gray-800">
    Confirm Actual Contractor Payment
  </h3>

  <select
    value={settlementPaymentMode}
    onChange={(e) => setSettlementPaymentMode(e.target.value)}
    className="w-full rounded-xl border p-3 text-sm"
  >
    <option value="BANK_TRANSFER">Bank Transfer</option>
    <option value="UPI">UPI</option>
    <option value="CASH">Cash</option>
    <option value="CHEQUE">Cheque</option>
    <option value="OTHER">Other</option>
  </select>

  <input
    type="text"
    placeholder="Payment reference / UTR / transaction ID"
    value={settlementPaymentReference}
    onChange={(e) =>
      setSettlementPaymentReference(e.target.value)
    }
    className="w-full rounded-xl border p-3 text-sm"
  />

  <input
    type="url"
    placeholder="Payment proof URL (optional)"
    value={settlementProofUrl}
    onChange={(e) => setSettlementProofUrl(e.target.value)}
    className="w-full rounded-xl border p-3 text-sm"
  />

  <p className="text-xs text-gray-500">
    Confirm only after the actual net payment has been made.
    The backend will recalculate penalties before recording
    the settlement.
  </p>

  {canConfirmContractorPayment && (
    <button
      type="button"
      disabled={settlementConfirming || settlementLoading}
      onClick={confirmContractorPayment}
      className="w-full rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
    >
      {settlementConfirming
        ? 'Confirming Payment...'
        : `Confirm Net Payment ₹${Number(
            settlementPreview.netPayable || 0,
          ).toLocaleString('en-IN')}`}
    </button>
  )}
</div>
        </div>
      )}
    </div>
  </div>
)}

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
            {selectedExpense.projectId ? (
  <>
    Project #{selectedExpense.projectId}
    {selectedExpense.projectCustomerName &&
      ` - ${selectedExpense.projectCustomerName}`}
    {selectedExpense.projectKNumber &&
      ` | K-Number: ${selectedExpense.projectKNumber}`}
  </>
) : (
  'Not linked to a project'
)}
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
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type LedgerEntry = {
  id: number;
  partyName?: string;
  partyType?: string;
  projectId?: number;
  entryType?: string;
  sourceType?: string;
  sourceId?: number;
  amount?: number;
  remarks?: string;
  createdByName?: string;
  createdAt?: string;
};

type PartyOutstanding = {
  partyName: string;
  partyType: string;
  totalDebit: number;
  totalCredit: number;
  outstanding: number;
  settlementStatus?: string;
absoluteOutstanding?: number;
};

export default function AccountsLedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState({
    totalDebit: 0,
    totalCredit: 0,
    netBalance: 0,
  });
  const [financeHub, setFinanceHub] = useState<any>(null);
  const [projectProfitRows, setProjectProfitRows] = useState<any[]>([]);
const [projectProfitPage, setProjectProfitPage] = useState(1);
const [projectProfitTotalPages, setProjectProfitTotalPages] = useState(1);
  const [partyOutstanding, setPartyOutstanding] =
  useState<PartyOutstanding[]>([]);

  const [loading, setLoading] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [partyType, setPartyType] = useState('');
  const [sourceType, setSourceType] = useState('');

  const [customerPayment, setCustomerPayment] = useState({
  partyName: '',
  amount: '',
  remarks: '',
});

const [vendorPayment, setVendorPayment] = useState({
  partyName: '',
  projectId: '',
  amount: '',
  remarks: '',
});

const [submittingCustomerPayment, setSubmittingCustomerPayment] =
  useState(false);

const [submittingVendorPayment, setSubmittingVendorPayment] =
  useState(false);

  const fetchLedger = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      const [
  ledgerRes,
  summaryRes,
  outstandingRes,
  financeHubRes,
  projectProfitRes,
] = await Promise.all([
        axios.get(`${API_BASE_URL}/project/ledger`, {
          params: {
            partyName,
            partyType,
            sourceType,
          },
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }),

        axios.get(`${API_BASE_URL}/project/ledger/summary`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }),

        axios.get(`${API_BASE_URL}/project/ledger/party-outstanding`, {
  headers: token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {},
}),

axios.get(`${API_BASE_URL}/project/accounts/finance-hub`, {
  headers: token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {},
}),

axios.get(`${API_BASE_URL}/project/accounts/project-profit`, {
  params: {
    page: projectProfitPage,
    limit: 20,
    projectTypeFilter: 'CRM',
  },
  headers: token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {},
}),
      ]);

      setEntries(ledgerRes.data || []);
      setSummary(
        summaryRes.data || {
          totalDebit: 0,
          totalCredit: 0,
          netBalance: 0,
        },
      );

      setPartyOutstanding(outstandingRes.data || []);
      setFinanceHub(financeHubRes.data || null);
      setProjectProfitRows(projectProfitRes.data?.data || []);
setProjectProfitTotalPages(
  projectProfitRes.data?.pagination?.totalPages || 1,
);
    } catch (error) {
      console.error(error);
      alert('Failed to load ledger');
    } finally {
      setLoading(false);
    }
  };

  const submitCustomerPayment = async () => {
  try {
    if (!customerPayment.partyName.trim()) {
      alert('Customer name required');
      return;
    }

    if (!Number(customerPayment.amount || 0)) {
      alert('Valid amount required');
      return;
    }

    setSubmittingCustomerPayment(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/ledger/customer-payment`,
      {
        partyName: customerPayment.partyName,
        amount: Number(customerPayment.amount),
        remarks: customerPayment.remarks,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Customer payment recorded');

    setCustomerPayment({
      partyName: '',
      amount: '',
      remarks: '',
    });

    fetchLedger();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to record customer payment',
    );
  } finally {
    setSubmittingCustomerPayment(false);
  }
};

const submitVendorPayment = async () => {
  try {
    if (!vendorPayment.partyName.trim()) {
      alert('Vendor name required');
      return;
    }

    if (!Number(vendorPayment.amount || 0)) {
      alert('Valid amount required');
      return;
    }

    setSubmittingVendorPayment(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/ledger/vendor-payment`,
      {
  partyName: vendorPayment.partyName,

  projectId: vendorPayment.projectId
    ? Number(vendorPayment.projectId)
    : undefined,

  amount: Number(vendorPayment.amount),

  remarks: vendorPayment.remarks,
},
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Vendor payment recorded');

    setVendorPayment({
  partyName: '',
  projectId: '',
  amount: '',
  remarks: '',
});

    fetchLedger();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to record vendor payment',
    );
  } finally {
    setSubmittingVendorPayment(false);
  }
};

const hideLedgerEntry = async (entryId: number) => {
  const confirmed = window.confirm(
    'Hide this ledger entry? This will remove it from summary and outstanding calculations.',
  );

  if (!confirmed) return;

  try {
    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/ledger/${entryId}/hide`,
      {},
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Ledger entry hidden');

    fetchLedger();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to hide ledger entry',
    );
  }
};

  useEffect(() => {
  fetchLedger();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [partyName, partyType, sourceType, projectProfitPage]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Accounts / Ledger
        </h1>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  <FinanceCard
    title="Total Received"
    value={financeHub?.income?.totalReceived}
    tone="green"
  />

  <FinanceCard
    title="Total Pending"
    value={financeHub?.income?.totalPending}
    tone="orange"
  />

  <FinanceCard
    title="Total Outgoing"
    value={financeHub?.outgoing?.totalOutgoing}
    tone="red"
  />

  <FinanceCard
    title="Available Cash"
    value={financeHub?.cashFlow?.availableCash}
    tone="blue"
  />
</div>

<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  <FinanceCard
    title="Customer Received"
    value={financeHub?.income?.customerReceived}
    tone="green"
  />

  <FinanceCard
    title="Dealer Received"
    value={financeHub?.income?.dealerReceived}
    tone="green"
  />

  <FinanceCard
    title="Approved Expenses"
    value={financeHub?.outgoing?.approvedExpenses}
    tone="red"
  />

  <FinanceCard
    title="Approved PO Cost"
    value={financeHub?.outgoing?.approvedPurchaseCost}
    tone="red"
  />
</div>

<div className="grid gap-4 md:grid-cols-3">
  <FinanceCard
    title="Expected Project Revenue"
    value={financeHub?.projectProfit?.expectedRevenue}
    tone="blue"
  />

  <FinanceCard
    title="Expected Project Cost"
    value={financeHub?.projectProfit?.expectedCost}
    tone="red"
  />

  <FinanceCard
    title="Expected Project Profit"
    value={financeHub?.projectProfit?.expectedProfit}
    tone="green"
  />
</div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
  <div className="rounded-2xl border p-5">
    <h3 className="font-bold text-gray-800">
      EPC Account
    </h3>

    <p className="mt-2 text-sm text-gray-500">
      Client payments, project funds, contractor and execution expenses.
    </p>
  </div>

  <div className="rounded-2xl border p-5">
    <h3 className="font-bold text-gray-800">
      Trading Account
    </h3>

    <p className="mt-2 text-sm text-gray-500">
      Dealer payments, vendor purchases and trading transactions.
    </p>
  </div>

  <div className="rounded-2xl border p-5">
    <h3 className="font-bold text-gray-800">
      Reports
    </h3>

    <p className="mt-2 text-sm text-gray-500">
      Profit, expenditure, branch-wise and owner-wise reports.
    </p>
  </div>

  <div className="rounded-2xl border p-5">
    <h3 className="font-bold text-gray-800">
      Stock Management
    </h3>

    <p className="mt-2 text-sm text-gray-500">
      Incoming stock, outgoing stock and warehouse inventory.
    </p>
  </div>
</div>

        <p className="mt-1 text-sm text-gray-500">
          Track party-wise debit, credit, receivables and payables.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Total Debit</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            ₹{Number(summary.totalDebit || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Total Credit</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            ₹{Number(summary.totalCredit || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">Net Balance</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            ₹{Number(summary.netBalance || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <h2 className="text-lg font-bold text-gray-800">
    Party-wise Outstanding
  </h2>

  <p className="mt-1 text-sm text-gray-500">
    Customer receivables and vendor payables based on active ledger entries.
  </p>

  {partyOutstanding.length === 0 ? (
    <p className="mt-4 text-sm text-gray-500">
      No outstanding balances found.
    </p>
  ) : (
    <div className="mt-4 space-y-3">
      {partyOutstanding.map((party) => (
        <div
          key={`${party.partyType}-${party.partyName}`}
          className="rounded-xl border p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-bold text-gray-800">
                {party.partyName}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {party.partyType}
              </p>

              <span
  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
    party.settlementStatus === 'RECEIVABLE'
      ? 'bg-red-100 text-red-700'
      : party.settlementStatus === 'PAYABLE'
        ? 'bg-green-100 text-green-700'
        : 'bg-gray-100 text-gray-700'
  }`}
>
  {party.settlementStatus || 'SETTLED'}
</span>

              <p className="mt-1 text-xs text-gray-400">
                Debit: ₹
                {Number(party.totalDebit || 0).toLocaleString('en-IN')}
                {' '}| Credit: ₹
                {Number(party.totalCredit || 0).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm text-gray-500">
                Outstanding
              </p>

              <p
                className={`text-xl font-bold ${
                  party.outstanding >= 0
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                ₹
                {Math.abs(
                  Number(party.outstanding || 0),
                ).toLocaleString('en-IN')}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {party.settlementStatus === 'RECEIVABLE'
  ? 'Receivable from party'
  : party.settlementStatus === 'PAYABLE'
    ? 'Payable to party'
    : 'Settled'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

      <div className="grid gap-5 md:grid-cols-2">
  <div className="rounded-2xl bg-white p-5 shadow">
    <h2 className="mb-4 text-lg font-bold text-gray-800">
      Customer Payment Received
    </h2>

    <div className="space-y-3">
      <input
        placeholder="Customer Name"
        value={customerPayment.partyName}
        onChange={(e) =>
          setCustomerPayment((prev) => ({
            ...prev,
            partyName: e.target.value,
          }))
        }
        className="w-full rounded-xl border p-3"
      />

      <input
        type="number"
        placeholder="Amount"
        value={customerPayment.amount}
        onChange={(e) =>
          setCustomerPayment((prev) => ({
            ...prev,
            amount: e.target.value,
          }))
        }
        className="w-full rounded-xl border p-3"
      />

      <textarea
        placeholder="Remarks"
        value={customerPayment.remarks}
        onChange={(e) =>
          setCustomerPayment((prev) => ({
            ...prev,
            remarks: e.target.value,
          }))
        }
        className="w-full rounded-xl border p-3"
      />

      <button
        onClick={submitCustomerPayment}
        disabled={submittingCustomerPayment}
        className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        {submittingCustomerPayment
          ? 'Saving...'
          : 'Record Customer Payment'}
      </button>
    </div>
  </div>

  <div className="rounded-2xl bg-white p-5 shadow">
    <h2 className="mb-4 text-lg font-bold text-gray-800">
      Vendor Payment Paid
    </h2>

    <div className="space-y-3">
      <input
        placeholder="Vendor Name"
        value={vendorPayment.partyName}
        onChange={(e) =>
          setVendorPayment((prev) => ({
            ...prev,
            partyName: e.target.value,
          }))
        }
        className="w-full rounded-xl border p-3"
      />

      <input
  type="number"
  placeholder="Project ID (Optional)"
  value={vendorPayment.projectId}
  onChange={(e) =>
    setVendorPayment((prev) => ({
      ...prev,
      projectId: e.target.value,
    }))
  }
  className="w-full rounded-xl border p-3"
/>

      <input
        type="number"
        placeholder="Amount"
        value={vendorPayment.amount}
        onChange={(e) =>
          setVendorPayment((prev) => ({
            ...prev,
            amount: e.target.value,
          }))
        }
        className="w-full rounded-xl border p-3"
      />

      <textarea
        placeholder="Remarks"
        value={vendorPayment.remarks}
        onChange={(e) =>
          setVendorPayment((prev) => ({
            ...prev,
            remarks: e.target.value,
          }))
        }
        className="w-full rounded-xl border p-3"
      />

      <button
        onClick={submitVendorPayment}
        disabled={submittingVendorPayment}
        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submittingVendorPayment
          ? 'Saving...'
          : 'Record Vendor Payment'}
      </button>
    </div>
  </div>
</div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            placeholder="Search Party Name"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            className="rounded-xl border p-3"
          />

          <select
            value={partyType}
            onChange={(e) => setPartyType(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Party Types</option>
            <option value="CUSTOMER">Customer</option>
            <option value="VENDOR">Vendor</option>
            <option value="DEALER">Dealer</option>
            <option value="BOTH">Both</option>
          </select>

          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Sources</option>
            <option value="PURCHASE_ORDER">Purchase Order</option>
            <option value="PROFORMA_INVOICE">Proforma Invoice</option>
            <option value="FINAL_INVOICE">Final Invoice</option>
            <option value="CUSTOMER_PAYMENT">Customer Payment</option>
            <option value="VENDOR_PAYMENT">Vendor Payment</option>
            <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <h2 className="text-lg font-bold text-gray-800">
    Project Actual Profit
  </h2>

  <p className="mt-1 text-sm text-gray-500">
    Calculates received customer amount minus actual project-linked expenses, purchase orders and material consumption.
  </p>

  <div className="mt-4 overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-2 text-left">Project</th>
          <th className="p-2 text-left">Customer</th>
          <th className="p-2 text-left">Expected Revenue</th>
          <th className="p-2 text-left">Received</th>
          <th className="p-2 text-left">Expenses</th>
          <th className="p-2 text-left">PO Cost</th>
          <th className="p-2 text-left">Material Used</th>
          <th className="p-2 text-left">Actual Cost</th>
          <th className="p-2 text-left">Actual Profit</th>
          <th className="p-2 text-left">Pending Collection</th>
        </tr>
      </thead>

      <tbody>
        {projectProfitRows.length === 0 && (
          <tr>
            <td colSpan={10} className="p-4 text-center text-gray-500">
              No project profit data found.
            </td>
          </tr>
        )}

        {projectProfitRows.map((row) => (
          <tr key={row.projectId} className="border-b">
            <td className="p-2 font-semibold">#{row.projectId}</td>
            <td className="p-2">
              <div>
                <p className="font-semibold">{row.customerName || '-'}</p>
                <p className="text-xs text-gray-500">{row.branchName || '-'}</p>
              </div>
            </td>
            <td className="p-2">
              ₹{Number(row.expectedRevenue || 0).toLocaleString('en-IN')}
            </td>
            <td className="p-2 text-green-700">
              ₹{Number(row.customerReceived || 0).toLocaleString('en-IN')}
            </td>
            <td className="p-2 text-red-700">
              ₹{Number(row.approvedExpenses || 0).toLocaleString('en-IN')}
            </td>
            <td className="p-2 text-red-700">
              ₹{Number(row.purchaseCost || 0).toLocaleString('en-IN')}
            </td>
            <td className="p-2 text-red-700">
              ₹{Number(row.materialConsumedCost || 0).toLocaleString('en-IN')}
            </td>
            <td className="p-2 font-semibold text-red-700">
              ₹{Number(row.actualCost || 0).toLocaleString('en-IN')}
            </td>
            <td
              className={`p-2 font-bold ${
                Number(row.actualProfit || 0) >= 0
                  ? 'text-green-700'
                  : 'text-red-700'
              }`}
            >
              ₹{Number(row.actualProfit || 0).toLocaleString('en-IN')}
            </td>
            <td className="p-2 text-orange-700">
              ₹{Number(row.collectionPending || 0).toLocaleString('en-IN')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  <div className="mt-4 flex items-center justify-between">
    <button
      disabled={projectProfitPage <= 1}
      onClick={() =>
        setProjectProfitPage((prev) => Math.max(prev - 1, 1))
      }
      className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
    >
      Previous
    </button>

    <span className="text-sm text-gray-500">
      Page {projectProfitPage} of {projectProfitTotalPages}
    </span>

    <button
      disabled={projectProfitPage >= projectProfitTotalPages}
      onClick={() => setProjectProfitPage((prev) => prev + 1)}
      className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
    >
      Next
    </button>
  </div>
</div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Ledger Entries
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-500">
            No ledger entries found.
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-bold text-gray-800">
                      {entry.partyName || '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {entry.partyType || '-'} | Project #{entry.projectId || '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {entry.sourceType || '-'} #{entry.sourceId || '-'}
                    </p>

                    {entry.remarks && (
                      <p className="mt-2 text-sm text-gray-700">
                        {entry.remarks}
                      </p>
                    )}
                  </div>

                  <div className="text-left md:text-right">
                    <p
                      className={`text-lg font-bold ${
                        entry.entryType === 'DEBIT'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {entry.entryType}: ₹
                      {Number(entry.amount || 0).toLocaleString('en-IN')}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleString()
                        : '-'}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      By: {entry.createdByName || '-'}
                    </p>

                    <button
  onClick={() => hideLedgerEntry(entry.id)}
  className="mt-3 rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
>
  Hide Entry
</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FinanceCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: any;
  tone: 'green' | 'red' | 'blue' | 'orange';
}) {
  const colorClass =
    tone === 'green'
      ? 'text-green-700'
      : tone === 'red'
        ? 'text-red-700'
        : tone === 'orange'
          ? 'text-orange-700'
          : 'text-blue-700';

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${colorClass}`}>
        ₹{Number(value || 0).toLocaleString('en-IN')}
      </p>
    </div>
  );
}
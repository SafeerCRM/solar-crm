'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CustomerPaymentsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    projectId: '',
    amount: '',
    paymentMode: 'UPI',
    transactionId: '',
    paymentDate: '',
    customerRemarks: '',
    receiptUrl: '',
    receiptFileName: '',
  });

  const projects = dashboard?.projects || [];
  const installments = dashboard?.paymentInstallments || [];
  const receipts = dashboard?.paymentReceipts || [];
  const summary = dashboard?.paymentSummary || {};

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('customer_token');

      if (!token) {
        window.location.href = '/customer-login';
        return;
      }

      const res = await fetch(`${API_BASE_URL}/customer-auth/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        window.location.href = '/customer-login';
        return;
      }

      setDashboard(data);
    } catch (error) {
      console.error(error);
      alert('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const submitReceipt = async () => {
    if (!form.projectId) {
      alert('Please select project');
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert('Please enter valid amount');
      return;
    }

    if (!form.paymentDate) {
      alert('Please select payment date');
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem('customer_token');

      const selectedProject = projects.find(
        (project: any) => String(project.id) === String(form.projectId),
      );

      const res = await fetch(`${API_BASE_URL}/customer-auth/payment-receipts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount || 0),
          projectName: selectedProject?.customerName || '',
          branchName: selectedProject?.branchName || '',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || 'Failed to submit receipt');
        return;
      }

      alert('Payment receipt submitted successfully');

      setForm({
        projectId: '',
        amount: '',
        paymentMode: 'UPI',
        transactionId: '',
        paymentDate: '',
        customerRemarks: '',
        receiptUrl: '',
        receiptFileName: '',
      });

      loadDashboard();
    } catch (error) {
      console.error(error);
      alert('Failed to submit receipt');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50">
        <div className="rounded-3xl bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-3xl">
            💳
          </div>
          <p className="text-sm font-semibold text-gray-600">
            Loading payment center...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
          <h1 className="text-4xl font-black">💳 Payment Center</h1>
          <p className="mt-2 text-sm text-white/90">
            View installments, company payment details, upload receipts and track verification.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <HeroCard title="Total Amount" value={formatCurrency(summary.totalAmount)} />
            <HeroCard title="Paid" value={formatCurrency(summary.paidAmount)} />
            <HeroCard title="Pending" value={formatCurrency(summary.pendingAmount)} />
            <HeroCard title="Pending Receipts" value={String(dashboard?.pendingPaymentReceipts || 0)} />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-[2rem] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black text-gray-900">Installments</h2>

            <div className="mt-5 space-y-4">
              {installments.length === 0 ? (
                <EmptyCard text="No payment installments found for your projects." />
              ) : (
                installments.map((item: any) => (
                  <div key={item.id} className="rounded-3xl border bg-gray-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-gray-900">
                          {formatLabel(item.label)}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Project #{item.projectId} · Due:{' '}
                          {item.dueDate
                            ? new Date(item.dueDate).toLocaleDateString('en-IN')
                            : '-'}
                        </p>
                      </div>

                      <StatusBadge status={item.status} />
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <InfoCard label="Amount" value={formatCurrency(item.amount)} />
                      <InfoCard label="Paid" value={formatCurrency(item.paidAmount)} />
                      <InfoCard label="Pending" value={formatCurrency(item.pendingAmount)} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-black text-gray-900">
                Company Payment Details
              </h2>

              <div className="mt-5 space-y-3">
                <PaymentInfo label="Account Name" value="Aditya Solars" />
                <PaymentInfo label="Bank" value="Update bank name" />
                <PaymentInfo label="Account No." value="Update account number" />
                <PaymentInfo label="IFSC" value="Update IFSC" />
                <PaymentInfo label="UPI ID" value="update-upi@bank" />
              </div>

              <div className="mt-5 rounded-3xl border-2 border-dashed bg-yellow-50 p-6 text-center">
                <p className="text-sm font-black text-yellow-800">QR Code</p>
                <p className="mt-2 text-xs text-yellow-700">
                  Add company QR image later from settings.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-black text-gray-900">
                Upload Receipt
              </h2>

              <div className="mt-5 space-y-3">
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full rounded-2xl border p-3"
                >
                  <option value="">Select Project</option>
                  {projects.map((project: any) => (
                    <option key={project.id} value={project.id}>
                      #{project.id} - {project.customerName}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Amount"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full rounded-2xl border p-3"
                />

                <select
                  value={form.paymentMode}
                  onChange={(e) =>
                    setForm({ ...form, paymentMode: e.target.value })
                  }
                  className="w-full rounded-2xl border p-3"
                >
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>

                <input
                  placeholder="Transaction ID / UTR"
                  value={form.transactionId}
                  onChange={(e) =>
                    setForm({ ...form, transactionId: e.target.value })
                  }
                  className="w-full rounded-2xl border p-3"
                />

                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) =>
                    setForm({ ...form, paymentDate: e.target.value })
                  }
                  className="w-full rounded-2xl border p-3"
                />

                <input
                  placeholder="Receipt URL for now"
                  value={form.receiptUrl}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      receiptUrl: e.target.value,
                      receiptFileName: e.target.value ? 'receipt' : '',
                    })
                  }
                  className="w-full rounded-2xl border p-3"
                />

                <textarea
                  rows={3}
                  placeholder="Remarks"
                  value={form.customerRemarks}
                  onChange={(e) =>
                    setForm({ ...form, customerRemarks: e.target.value })
                  }
                  className="w-full rounded-2xl border p-3"
                />

                <button
                  onClick={submitReceipt}
                  disabled={saving}
                  className="w-full rounded-2xl bg-orange-500 py-3 font-black text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {saving ? 'Submitting...' : 'Submit Receipt'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
          <h2 className="text-2xl font-black text-gray-900">Receipt History</h2>

          <div className="mt-5 space-y-4">
            {receipts.length === 0 ? (
              <EmptyCard text="No receipt submitted yet." />
            ) : (
              receipts.map((item: any) => (
                <div key={item.id} className="rounded-3xl border bg-gray-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-gray-900">
                        Receipt #{item.id}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Project #{item.projectId} · {formatCurrency(item.amount)} ·{' '}
                        {item.paymentDate
                          ? new Date(item.paymentDate).toLocaleDateString('en-IN')
                          : '-'}
                      </p>
                    </div>

                    <StatusBadge status={item.status} />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <InfoCard label="Mode" value={item.paymentMode || '-'} />
                    <InfoCard label="Transaction" value={item.transactionId || '-'} />
                    <InfoCard label="Verification" value={item.verificationRemarks || '-'} />
                  </div>

                  {item.receiptUrl && (
                    <a
                      href={item.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-block rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white"
                    >
                      View Receipt
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function HeroCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/20 p-4 backdrop-blur">
      <p className="text-xs font-bold opacity-90">{title}</p>
      <p className="mt-2 break-words text-2xl font-black">{value}</p>
    </div>
  );
}

function PaymentInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4">
      <p className="text-xs font-bold text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-gray-900">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-bold text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-gray-900">
        {value || '-'}
      </p>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed p-6 text-center text-sm font-semibold text-gray-500">
      {text}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const value = status || 'PENDING';

  return (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
      {formatLabel(value)}
    </span>
  );
}

function formatCurrency(value?: number | string) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}
'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CustomerPaymentsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedReceipt, setSelectedReceipt] =
  useState<File | null>(null);

const [receiptPreview, setReceiptPreview] =
  useState<string>('');

const [uploadingReceipt, setUploadingReceipt] =
  useState(false);

  const [receiptFilter, setReceiptFilter] = useState('ALL');
  const [selectedReceiptTimeline, setSelectedReceiptTimeline] = useState<any>(null);
const [receiptActivities, setReceiptActivities] = useState<any[]>([]);
const [timelineLoading, setTimelineLoading] = useState(false);

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
  const customerPaymentDetails = dashboard?.customerPaymentDetails || [];
const activePaymentDetail = customerPaymentDetails[0] || {};
  const paymentPercent =
  Number(summary.totalAmount || 0) > 0
    ? Math.min(
        100,
        Math.round(
          (Number(summary.paidAmount || 0) /
            Number(summary.totalAmount || 0)) *
            100,
        ),
      )
    : 0;

const nextDueInstallment = installments.find(
  (item: any) =>
    Number(item.pendingAmount || 0) > 0 &&
    item.status !== 'PAID',
);

const overdueInstallments = installments.filter((item: any) => {
  if (!item.dueDate || item.status === 'PAID') return false;

  const due = new Date(item.dueDate);
  const today = new Date();

  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return due < today && Number(item.pendingAmount || 0) > 0;
});

const filteredReceipts = receipts.filter((item: any) => {
  if (receiptFilter === 'ALL') return true;
  return item.status === receiptFilter;
});

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

  const loadReceiptActivities = async (receiptId: number) => {
  try {
    setTimelineLoading(true);

    const token = localStorage.getItem('customer_token');

    const res = await fetch(
      `${API_BASE_URL}/customer-auth/payment-receipts/${receiptId}/activities`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await res.json();

    setReceiptActivities(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error(error);
    setReceiptActivities([]);
  } finally {
    setTimelineLoading(false);
  }
};

  useEffect(() => {
    loadDashboard();
  }, []);

  const compressImageFile = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise<File>((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');

      let width = img.width;
      let height = img.height;

      const maxWidth = 1600;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          resolve(
            new File(
              [blob],
              file.name,
              {
                type: 'image/jpeg',
              },
            ),
          );
        },
        'image/jpeg',
        0.8,
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

const uploadReceiptFile = async () => {
  if (!selectedReceipt) {
    return null;
  }

  try {
    setUploadingReceipt(true);

    const token =
      localStorage.getItem('customer_token');

    const uploadFile =
      await compressImageFile(selectedReceipt);

    const formData = new FormData();

    formData.append('files', uploadFile);

    const res = await fetch(
      `${API_BASE_URL}/customer-auth/payment-receipts/upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data?.message ||
          'Receipt upload failed',
      );
    }

    return data?.receipts?.[0] || null;
  } finally {
    setUploadingReceipt(false);
  }
};

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

      let receiptData = null;

if (selectedReceipt) {
  receiptData = await uploadReceiptFile();
}

      const res = await fetch(`${API_BASE_URL}/customer-auth/payment-receipts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
  ...form,
  amount: Number(form.amount || 0),
  receiptUrl: receiptData?.fileUrl || '',
  receiptFileName: receiptData?.fileName || '',
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

      setSelectedReceipt(null);
setReceiptPreview('');

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

          <div className="mt-6 rounded-3xl bg-white/20 p-5 backdrop-blur">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p className="text-sm font-bold opacity-90">
        Payment Progress
      </p>

      <p className="mt-1 text-2xl font-black">
        {paymentPercent}%
      </p>
    </div>

    <div className="text-right">
      <p className="text-xs font-bold opacity-80">
        Paid
      </p>

      <p className="font-black">
        {formatCurrency(summary.paidAmount)}
      </p>
    </div>
  </div>

  <div className="mt-4 h-4 overflow-hidden rounded-full bg-white/20">
    <div
      className="h-full rounded-full bg-white"
      style={{
        width: `${paymentPercent}%`,
      }}
    />
  </div>
</div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
  <div className="rounded-3xl bg-white/20 p-5 backdrop-blur">
    <p className="text-xs font-bold opacity-80">
      Total Project Cost
    </p>
    <p className="mt-2 text-2xl font-black">
      {formatCurrency(summary.totalAmount)}
    </p>
  </div>

  <div className="rounded-3xl bg-white/20 p-5 backdrop-blur">
    <p className="text-xs font-bold opacity-80">
      Total Paid
    </p>
    <p className="mt-2 text-2xl font-black">
      {formatCurrency(summary.paidAmount)}
    </p>
  </div>

  <div className="rounded-3xl bg-white/20 p-5 backdrop-blur">
    <p className="text-xs font-bold opacity-80">
      Total Pending
    </p>
    <p className="mt-2 text-2xl font-black">
      {formatCurrency(summary.pendingAmount)}
    </p>
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
                  <div
  key={item.id}
  className={`rounded-3xl border p-5 ${
    overdueInstallments.some((overdue: any) => overdue.id === item.id)
      ? 'border-red-200 bg-red-50'
      : 'bg-gray-50'
  }`}
>
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

                      {overdueInstallments.some((overdue: any) => overdue.id === item.id) && (
  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
    OVERDUE
  </span>
)}
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

            <div className="rounded-[2rem] bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white shadow-xl">
  <h2 className="text-xl font-black">
    Next Payment Due
  </h2>

  {nextDueInstallment ? (
    <>
      <p className="mt-3 text-lg font-black">
        {formatLabel(nextDueInstallment.label)}
      </p>

      <p className="mt-2 text-sm">
        Pending:
        {' '}
        {formatCurrency(
          nextDueInstallment.pendingAmount,
        )}
      </p>

      <p className="mt-1 text-sm">
        Due Date:
        {' '}
        {nextDueInstallment.dueDate
          ? new Date(
              nextDueInstallment.dueDate,
            ).toLocaleDateString('en-IN')
          : '-'}
      </p>
    </>
  ) : (
    <p className="mt-3 text-sm font-semibold">
      All installments paid.
    </p>
  )}
</div>

{!activePaymentDetail?.id && (
  <div className="mb-4 rounded-2xl bg-yellow-50 p-3 text-sm font-bold text-yellow-800">
    Payment details are not available yet. Please contact Aditya Solars before making payment.
  </div>
)}
            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-black text-gray-900">
                Company Payment Details
              </h2>

              <div className="mt-5 space-y-3">
                <PaymentInfo
  label="Account Name"
  value={activePaymentDetail.accountName || '-'}
/>
<PaymentInfo
  label="Bank"
  value={activePaymentDetail.bankName || '-'}
/>
<PaymentInfo
  label="Account No."
  value={activePaymentDetail.accountNumber || '-'}
/>
<PaymentInfo
  label="IFSC"
  value={activePaymentDetail.ifsc || '-'}
/>
<PaymentInfo
  label="UPI ID"
  value={activePaymentDetail.upiId || '-'}
/>
              </div>

              <div className="mt-5 rounded-3xl border-2 border-dashed bg-yellow-50 p-6 text-center">
  <p className="text-sm font-black text-yellow-800">QR Code</p>

  {activePaymentDetail.qrCodeUrl ? (
    <img
      src={activePaymentDetail.qrCodeUrl}
      alt="Payment QR Code"
      className="mx-auto mt-4 max-h-64 rounded-2xl border bg-white object-contain p-2"
    />
  ) : (
    <p className="mt-2 text-xs text-yellow-700">
      QR code not available.
    </p>
  )}
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

                <div>
  <label className="mb-2 block text-sm font-bold text-gray-700">
    Receipt Upload
  </label>

  <input
    type="file"
    accept="image/*,.pdf"
    onChange={(e) => {
      const file =
        e.target.files?.[0] || null;

      setSelectedReceipt(file);

      if (
        file &&
        file.type.startsWith('image/')
      ) {
        setReceiptPreview(
          URL.createObjectURL(file),
        );
      } else {
        setReceiptPreview('');
      }
    }}
    className="w-full rounded-2xl border p-3"
  />

  {receiptPreview && (
    <img
      src={receiptPreview}
      alt="Receipt"
      className="mt-3 h-40 rounded-2xl border object-cover"
    />
  )}

  {selectedReceipt &&
    selectedReceipt.type ===
      'application/pdf' && (
      <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">
        PDF Selected:
        {' '}
        {selectedReceipt.name}
      </div>
    )}
</div>

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
                  {uploadingReceipt
  ? 'Uploading Receipt...'
  : saving
  ? 'Submitting...'
  : 'Submit Receipt'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
  <h2 className="text-2xl font-black text-gray-900">
    Receipt History
  </h2>

  <div className="flex flex-wrap gap-2">
    {['ALL', 'SUBMITTED', 'VERIFIED', 'REJECTED'].map((item) => (
      <button
        key={item}
        onClick={() => setReceiptFilter(item)}
        className={`rounded-2xl px-4 py-2 text-xs font-black ${
          receiptFilter === item
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        {formatLabel(item)}
      </button>
    ))}
  </div>
</div>

          <div className="mt-5 space-y-4">
            {filteredReceipts.length === 0 ? (
              <EmptyCard text="No receipt submitted yet." />
            ) : (
              filteredReceipts.map((item: any) => (
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

                  <button
  onClick={async () => {
    setSelectedReceiptTimeline(item);
    await loadReceiptActivities(item.id);
  }}
  className="mt-4 ml-2 inline-block rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white"
>
  View Timeline
</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedReceiptTimeline && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-gray-900">
            Receipt Timeline
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Receipt #{selectedReceiptTimeline.id} ·{' '}
            {formatCurrency(selectedReceiptTimeline.amount)}
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedReceiptTimeline(null);
            setReceiptActivities([]);
          }}
          className="rounded-2xl bg-red-100 px-4 py-2 text-sm font-black text-red-700"
        >
          Close
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {timelineLoading ? (
          <div className="rounded-2xl border border-dashed p-6 text-center text-sm font-semibold text-gray-500">
            Loading timeline...
          </div>
        ) : receiptActivities.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-center text-sm font-semibold text-gray-500">
            No receipt timeline available yet.
          </div>
        ) : (
          receiptActivities.map((activity) => (
            <div key={activity.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-lg text-white">
                  {receiptActivityIcon(activity.activityType)}
                </div>
                <div className="h-full min-h-8 w-1 bg-orange-100" />
              </div>

              <div className="flex-1 rounded-3xl bg-gray-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-gray-900">
                      {activity.activityTitle || formatLabel(activity.activityType)}
                    </p>

                    {activity.activityDescription && (
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                        {activity.activityDescription}
                      </p>
                    )}
                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-gray-600">
                    {formatLabel(activity.activityType)}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-xs font-semibold text-gray-500 md:grid-cols-2">
                  <p>
                    By: {activity.performedByName || 'System'}
                  </p>
                  <p>
                    Time:{' '}
                    {activity.createdAt
                      ? new Date(activity.createdAt).toLocaleString('en-IN')
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}
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

function receiptActivityIcon(type?: string) {
  const value = String(type || '');

  if (value.includes('UPLOADED')) return '📤';
  if (value.includes('VERIFIED')) return '✅';
  if (value.includes('REJECTED')) return '❌';
  if (value.includes('STATUS')) return '🔄';
  if (value.includes('LINKED')) return '🔗';
  if (value.includes('APPROVED')) return '👍';
  if (value.includes('CANCELLED')) return '🚫';
  if (value.includes('UPDATED')) return '💬';

  return '•';
}

function formatCurrency(value?: number | string) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}
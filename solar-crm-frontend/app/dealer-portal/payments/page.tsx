'use client';

import { FormEvent, useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DealerPaymentsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('ONLINE');
  const [transactionId, setTransactionId] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [remarks, setRemarks] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const getToken = () => {
    const token = localStorage.getItem('dealer_token');

    if (!token) {
      window.location.href = '/dealer-login';
      return '';
    }

    return token;
  };

  const loadOrders = async () => {
    const token = getToken();

    try {
      const res = await fetch(`${API_BASE_URL}/dealer-auth/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setOrders(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const uploadReceipt = async (files: FileList | null) => {
    const token = getToken();

    if (!files || !files.length) return;

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));

      const res = await fetch(`${API_BASE_URL}/dealer-auth/payment-receipts/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Receipt upload failed');
        return;
      }

      const firstReceipt = data.receipts?.[0];

      if (firstReceipt?.fileUrl) {
        setReceiptUrl(firstReceipt.fileUrl);
        setMessage('Receipt uploaded successfully');
      }
    } catch (error) {
      console.error(error);
      setMessage('Receipt upload error');
    } finally {
      setUploading(false);
    }
  };

  const submitPayment = async (e: FormEvent) => {
    e.preventDefault();

    const token = getToken();

    if (!selectedOrderId) {
      setMessage('Please select order.');
      return;
    }

    if (Number(amount || 0) <= 0) {
      setMessage('Please enter payment amount.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/dealer-auth/payments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealerOrderId: Number(selectedOrderId),
          amount: Number(amount || 0),
          paymentMode,
          transactionId,
          receiptUrl,
          remarks,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Payment submit failed');
        return;
      }

      setMessage('Payment submitted successfully.');
      setSelectedOrderId('');
      setAmount('');
      setTransactionId('');
      setReceiptUrl('');
      setRemarks('');
      loadOrders();
    } catch (error) {
      console.error(error);
      setMessage('Payment submit error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOrder = orders.find((item) => String(item.id) === selectedOrderId);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="relative mx-auto max-w-6xl px-4 py-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <a href="/dealer-portal" className="text-sm font-black text-orange-300">
            ← Back to Dashboard
          </a>

          <h1 className="mt-3 text-3xl font-black md:text-4xl">
            Dealer Payments
          </h1>

          <p className="mt-1 text-sm text-white/60">
            Upload receipt and submit payment confirmation to Aditya Solars.
          </p>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={submitPayment}
            className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl lg:col-span-2"
          >
            <h2 className="text-xl font-black">Submit Payment</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Select Order
                </label>

                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black outline-none focus:border-blue-500"
                >
                  <option value="">Select dealer order</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber || `Order #${order.id}`} - Pending ₹
                      {Number(order.pendingAmount || 0).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Payment Amount"
                type="number"
                value={amount}
                onChange={setAmount}
                placeholder="Enter amount"
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Payment Mode
                </label>

                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black outline-none focus:border-blue-500"
                >
                  <option value="ONLINE">Online</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CREDIT">Credit</option>
                </select>
              </div>

              <Input
                label="Transaction ID / Reference"
                value={transactionId}
                onChange={setTransactionId}
                placeholder="UPI / Bank Ref / Cheque no."
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Upload Receipt
                </label>

                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => uploadReceipt(e.target.files)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold"
                />

                {uploading && (
                  <p className="mt-2 text-xs font-bold text-blue-600">
                    Uploading receipt...
                  </p>
                )}

                {receiptUrl && (
                  <a
                    href={receiptUrl}
                    target="_blank"
                    className="mt-2 block text-xs font-black text-emerald-600"
                  >
                    Receipt uploaded. View file
                  </a>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Remarks
                </label>

                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Any payment note"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {message && (
              <p className="mt-5 rounded-2xl bg-blue-50 p-3 text-center text-sm font-bold text-blue-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-blue-700 to-sky-500 py-4 font-black text-white shadow-xl transition hover:scale-[1.01] disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Payment'}
            </button>
          </form>

          <aside className="space-y-5">
            <div className="rounded-[2rem] bg-gradient-to-br from-orange-500 to-yellow-400 p-6 text-slate-950 shadow-xl">
              <h2 className="text-xl font-black">Selected Order</h2>

              {selectedOrder ? (
                <div className="mt-4 space-y-3 text-sm font-bold">
                  <Info label="Order" value={selectedOrder.orderNumber || `#${selectedOrder.id}`} />
                  <Info
                    label="Total"
                    value={`₹${Number(selectedOrder.totalAmount || 0).toLocaleString('en-IN')}`}
                  />
                  <Info
                    label="Paid"
                    value={`₹${Number(selectedOrder.paidAmount || 0).toLocaleString('en-IN')}`}
                  />
                  <Info
                    label="Pending"
                    value={`₹${Number(selectedOrder.pendingAmount || 0).toLocaleString('en-IN')}`}
                  />
                </div>
              ) : (
                <p className="mt-4 text-sm font-semibold text-slate-800/70">
                  Select order to view amount details.
                </p>
              )}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-xl font-black">Payment Tips</h2>
              <p className="mt-3 text-sm text-white/70">
                For online payments, upload a clear screenshot or PDF receipt.
                Account team will verify and approve the payment.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <p className="text-xs font-bold text-slate-600">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}
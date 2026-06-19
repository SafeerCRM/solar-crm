'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DealerOrderDetailPage() {
  const params = useParams();
  const orderId = String(params?.id || '');

  const [detail, setDetail] = useState<any>(null);
  const [pi, setPi] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDetail();
  }, []);

    const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('dealer_token');

    if (!token) {
      window.location.href = '/dealer-login';
      return {};
    }

    return { Authorization: `Bearer ${token}` };
  };

  const loadDetail = async () => {
    try {
      const headers = authHeaders();

      const [detailRes, commentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dealer-auth/orders/${orderId}`, { headers }),
        fetch(`${API_BASE_URL}/dealer-auth/orders/${orderId}/comments`, { headers }),
      ]);

      const detailData = await detailRes.json();
      const commentsData = await commentsRes.json();

      setDetail(detailData);
      setComments(Array.isArray(commentsData) ? commentsData : []);

      try {
        const piRes = await fetch(
          `${API_BASE_URL}/dealer-auth/orders/${orderId}/proforma-invoice`,
          { headers },
        );
        if (piRes.ok) setPi(await piRes.json());
      } catch {}

      try {
        const invoiceRes = await fetch(
          `${API_BASE_URL}/dealer-auth/orders/${orderId}/final-invoice`,
          { headers },
        );
        if (invoiceRes.ok) setInvoice(await invoiceRes.json());
      } catch {}
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async (e: FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/dealer-auth/orders/${orderId}/comments`,
        {
          method: 'POST',
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comment }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Comment failed');
        return;
      }

      setComment('');
      setMessage('Comment added successfully');
      loadDetail();
    } catch (error) {
      console.error(error);
      setMessage('Comment error');
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-3xl bg-white/10 px-8 py-6 font-black">
          Loading order...
        </div>
      </main>
    );
  }

  const order = detail?.order;
  const items = detail?.items || [];
  const payments = detail?.payments || [];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="relative mx-auto max-w-7xl px-4 py-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <a href="/dealer-portal/orders" className="text-sm font-black text-orange-300">
            ← Back to Orders
          </a>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black md:text-4xl">
                {order?.orderNumber || `Order #${order?.id}`}
              </h1>
              <p className="mt-1 text-sm text-white/60">
                {order?.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : '-'}
              </p>
            </div>

            <StatusBadge status={order?.status} />
          </div>
        </header>

        <section className="mt-6 grid gap-5 md:grid-cols-4">
          <SummaryCard label="Total" value={`₹${Number(order?.totalAmount || 0).toLocaleString('en-IN')}`} />
          <SummaryCard label="Paid" value={`₹${Number(order?.paidAmount || 0).toLocaleString('en-IN')}`} />
          <SummaryCard label="Pending" value={`₹${Number(order?.pendingAmount || 0).toLocaleString('en-IN')}`} />
          <SummaryCard label="Payment" value={order?.paymentType || '-'} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl lg:col-span-2">
            <h2 className="text-xl font-black">Order Items</h2>

            <div className="mt-4 space-y-3">
              {items.map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-black">{item.materialName}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {item.brand || '-'} · HSN {item.hsnCode || '-'}
                      </p>
                    </div>

                    <p className="font-black">
                      ₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-5">
                    <Info
  label="Ordered"
  value={`${item.quantity || 0}${item.unit && item.unit !== '1' ? ` ${item.unit}` : ''}`}
/>
                    <Info
  label="Accepted"
  value={`${item.acceptedQuantity || 0}${item.unit && item.unit !== '1' ? ` ${item.unit}` : ''}`}
/>

<Info
  label="Pending"
  value={`${item.pendingQuantity || 0}${item.unit && item.unit !== '1' ? ` ${item.unit}` : ''}`}
/>
                    <Info label="Rate" value={`₹${Number(item.sellingRate || 0).toLocaleString('en-IN')}`} />
                    <Info label="GST" value={`${item.gstPercent || 0}%`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[2rem] bg-gradient-to-br from-orange-500 to-yellow-400 p-6 text-slate-950 shadow-xl">
              <h2 className="text-xl font-black">Delivery & Pickup</h2>

              <div className="mt-4 space-y-3 text-sm font-bold">
                <Info label="Expected Delivery" value={order?.expectedDeliveryAt ? new Date(order.expectedDeliveryAt).toLocaleString('en-IN') : '-'} />
                <Info label="Pickup Staff" value={order?.assignedStaffName || '-'} />
                <Info label="Pickup Phone" value={order?.assignedStaffPhone || '-'} />
                <Info label="Remarks" value={order?.remarks || '-'} />
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl">
              <h2 className="text-xl font-black">Invoices</h2>

              <div className="mt-4 grid gap-3">
                <InvoiceBox
                  title="Proforma Invoice"
                  value={pi?.invoice?.invoiceNumber || 'Not generated'}
                  amount={pi?.invoice?.totalAmount}
                />

                <InvoiceBox
                  title="Final Invoice"
                  value={invoice?.invoice?.invoiceNumber || 'Not generated'}
                  amount={invoice?.invoice?.totalAmount}
                />
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl">
              <h2 className="text-xl font-black">Payments</h2>

              <div className="mt-4 space-y-3">
                {!payments.length && (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                    No payment submitted yet.
                  </p>
                )}

                {payments.map((payment: any) => (
  <div key={payment.id} className="rounded-2xl bg-slate-50 p-4">
    <p className="font-black">
      ₹{Number(payment.amount || 0).toLocaleString('en-IN')}
    </p>

    <p className="mt-1 text-xs font-semibold text-slate-500">
      {payment.paymentMode || '-'}
    </p>

    <div className="mt-3 flex flex-wrap gap-2">
      <span
        className={`rounded-full px-3 py-1 text-xs font-black ${
          payment.status === 'APPROVED'
            ? 'bg-green-100 text-green-700'
            : payment.status === 'REJECTED'
            ? 'bg-red-100 text-red-700'
            : 'bg-amber-100 text-amber-700'
        }`}
      >
        {payment.status || 'SUBMITTED'}
      </span>
    </div>

    {payment.approvalNote && (
      <div className="mt-3 rounded-2xl bg-blue-50 p-3">
        <p className="text-xs font-black text-blue-500">
          Company Remark
        </p>

        <p className="mt-1 text-sm font-semibold text-blue-900">
          {payment.approvalNote}
        </p>
      </div>
    )}

    {payment.receiptUrl && (
      <a
        href={payment.receiptUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white"
      >
        View Receipt
      </a>
    )}
  </div>
))}
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <h2 className="text-xl font-black">Order Comments</h2>

          <div className="mt-4 space-y-3">
            {!comments.length && (
              <p className="text-sm text-white/60">No comments yet.</p>
            )}

            {comments.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white/10 p-4">
                <p className="font-black">{item.createdByName || 'User'}</p>
                <p className="mt-1 text-sm text-white/75">{item.comment}</p>
              </div>
            ))}
          </div>

          <form onSubmit={submitComment} className="mt-5 flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write comment..."
              className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none"
            />

            <button className="rounded-2xl bg-gradient-to-r from-blue-700 to-sky-500 px-6 py-3 text-sm font-black text-white">
              Send
            </button>
          </form>

          {message && <p className="mt-3 text-sm font-bold text-orange-200">{message}</p>}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.7rem] bg-white p-5 text-slate-900 shadow-xl">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function InvoiceBox({
  title,
  value,
  amount,
}: {
  title: string;
  value: string;
  amount?: number;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-400">{title}</p>
      <p className="mt-1 font-black">{value}</p>
      {amount !== undefined && (
        <p className="mt-1 text-sm font-bold text-slate-500">
          ₹{Number(amount || 0).toLocaleString('en-IN')}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-full bg-blue-100 px-5 py-3 text-sm font-black text-blue-700">
      {status || 'SUBMITTED'}
    </span>
  );
}
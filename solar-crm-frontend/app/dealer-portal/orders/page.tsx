'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DealerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [status, paymentType]);

  const loadOrders = async () => {
    const token = localStorage.getItem('dealer_token');

    if (!token) {
      window.location.href = '/dealer-login';
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (paymentType) params.set('paymentType', paymentType);

      const res = await fetch(`${API_BASE_URL}/dealer-auth/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setOrders(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="relative mx-auto max-w-7xl px-4 py-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <a href="/dealer-portal" className="text-sm font-black text-orange-300">
            ← Back to Dashboard
          </a>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black md:text-4xl">My Orders</h1>
              <p className="mt-1 text-sm text-white/60">
                Track all your dealer orders, payment mode and delivery status.
              </p>
            </div>

            <a
              href="/dealer-portal/orders/create"
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg"
            >
              Create New Order
            </a>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900"
            >
              <option value="">All Status</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="PARTIALLY_ACCEPTED">Partially Accepted</option>
              <option value="POSTPONED">Postponed</option>
              <option value="STOCK_OUT">Stock Out</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900"
            >
              <option value="">All Payments</option>
              <option value="CASH">Cash</option>
              <option value="ONLINE">Online</option>
              <option value="CREDIT">Credit</option>
              <option value="CHEQUE">Cheque</option>
            </select>

            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black">
              Showing {orders.length} orders
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-5">
          {loading && (
            <div className="rounded-3xl bg-white p-8 text-center font-black text-slate-900">
              Loading orders...
            </div>
          )}

          {!loading && !orders.length && (
            <div className="rounded-3xl border border-dashed border-white/20 bg-white/10 p-8 text-center text-white/70">
              No dealer orders found.
            </div>
          )}

          {!loading &&
            orders.map((order) => (
              <a
                key={order.id}
                href={`/dealer-portal/orders/${order.id}`}
                className="block overflow-hidden rounded-[2rem] bg-white text-slate-900 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="h-2 bg-gradient-to-r from-blue-700 via-sky-500 to-orange-400" />

                <div className="grid gap-4 p-5 md:grid-cols-5 md:items-center">
                  <div className="md:col-span-2">
                    <p className="text-xl font-black">
                      {order.orderNumber || `Order #${order.id}`}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {new Date(order.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <Info label="Payment" value={order.paymentType || '-'} />
                  <Info
                    label="Amount"
                    value={`₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}`}
                  />

                  <div className="flex justify-start md:justify-end">
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                <div className="grid gap-3 border-t border-slate-100 bg-slate-50 p-5 md:grid-cols-3">
                  <Info
                    label="Paid"
                    value={`₹${Number(order.paidAmount || 0).toLocaleString('en-IN')}`}
                  />
                  <Info
                    label="Pending"
                    value={`₹${Number(order.pendingAmount || 0).toLocaleString('en-IN')}`}
                  />
                  <Info
                    label="Expected Delivery"
                    value={
                      order.expectedDeliveryAt
                        ? new Date(order.expectedDeliveryAt).toLocaleString('en-IN')
                        : '-'
                    }
                  />
                </div>
              </a>
            ))}
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'DELIVERED'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'CANCELLED' || status === 'STOCK_OUT'
        ? 'bg-red-100 text-red-700'
        : status === 'POSTPONED'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-blue-100 text-blue-700';

  return (
    <span className={`rounded-full px-4 py-2 text-xs font-black ${tone}`}>
      {status || 'SUBMITTED'}
    </span>
  );
}
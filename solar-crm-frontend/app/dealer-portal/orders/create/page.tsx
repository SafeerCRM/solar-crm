'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CreateDealerOrderPage() {
  const [stock, setStock] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [paymentType, setPaymentType] = useState('CASH');
  const [deliveryMode, setDeliveryMode] = useState('SELF_COLLECTION');
const [deliveryAddress, setDeliveryAddress] = useState('');
const [deliveryDistanceKm, setDeliveryDistanceKm] = useState('');
  const [creditDueDate, setCreditDueDate] = useState('');
  const [expectedDeliveryAt, setExpectedDeliveryAt] = useState('');
  const [remarks, setRemarks] = useState('');
  const [pickupStaffName, setPickupStaffName] = useState('');
  const [pickupStaffPhone, setPickupStaffPhone] = useState('');
  const [dealer, setDealer] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('dealer_token');
    const savedDealer = localStorage.getItem('dealer');

    if (!token || !savedDealer) {
      window.location.href = '/dealer-login';
      return;
    }

    setDealer(JSON.parse(savedDealer));
    loadStock(token);
  }, []);

  const loadStock = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/dealer-auth/stock`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setStock(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStock = useMemo(() => {
    const q = search.toLowerCase();

    return stock.filter((item) => {
      return (
        !q ||
        String(item.materialName || '').toLowerCase().includes(q) ||
        String(item.brand || '').toLowerCase().includes(q) ||
        String(item.category || '').toLowerCase().includes(q) ||
        String(item.hsnCode || '').toLowerCase().includes(q)
      );
    });
  }, [stock, search]);

  const totals = useMemo(() => {
    return cart.reduce(
      (acc, item) => {
        const quantity = Number(item.quantity || 0);
        const rate = Number(item.sellingRateWithoutGst || 0);
        const discount = Number(item.discountAmount || 0);
        const gstPercent = Number(item.gstPercent || 0);

        const subtotal = quantity * rate;
        const gst = ((subtotal - discount) * gstPercent) / 100;
        const total = subtotal - discount + gst;

        acc.subtotal += subtotal;
        acc.discount += discount;
        acc.gst += gst;
        acc.total += total;

        return acc;
      },
      { subtotal: 0, discount: 0, gst: 0, total: 0 },
    );
  }, [cart]);


  const addToCart = (item: any) => {
    setMessage('');

    setCart((prev) => {
      const exists = prev.find((row) => row.materialId === item.materialId);

      if (exists) {
        return prev.map((row) =>
          row.materialId === item.materialId
            ? { ...row, quantity: Number(row.quantity || 0) + 1 }
            : row,
        );
      }

      return [
        ...prev,
        {
          ...item,
          quantity: 1,
          discountAmount: 0,
          remarks: '',
        },
      ];
    });
  };

  const updateCartItem = (materialId: number, key: string, value: any) => {
    setCart((prev) =>
      prev.map((item) =>
        item.materialId === materialId ? { ...item, [key]: value } : item,
      ),
    );
  };

  const removeCartItem = (materialId: number) => {
    setCart((prev) => prev.filter((item) => item.materialId !== materialId));
  };

  const submitOrder = async (e: FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('dealer_token');

    if (!token) {
      window.location.href = '/dealer-login';
      return;
    }

    if (!cart.length) {
      setMessage('Please add at least one material.');
      return;
    }

    if (paymentType === 'CREDIT' && !dealer?.creditEnabled) {
      setMessage('Credit facility is not enabled for your dealer account.');
      return;
    }

    if (paymentType === 'CREDIT' && !creditDueDate) {
      setMessage('Please select credit payment date.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/dealer-auth/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentType,
          creditDueDate,
          expectedDeliveryAt,
          pickupStaffName,
          pickupStaffPhone,
          remarks,
          deliveryMode,
deliveryAddress,
deliveryDistanceKm:
  Number(deliveryDistanceKm || 0),
          items: cart.map((item) => ({
            materialId: item.materialId,
            quantity: Number(item.quantity || 0),
            discountAmount: Number(item.discountAmount || 0),
            remarks: item.remarks || '',
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Order creation failed');
        return;
      }

      setMessage('Order submitted successfully. Proforma Invoice generated.');
      setCart([]);

      setTimeout(() => {
        window.location.href = '/dealer-portal/orders';
      }, 800);
    } catch (error) {
      console.error(error);
      setMessage('Order creation error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-orange-500/25 blur-3xl" />
      <div className="absolute right-[-120px] top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <a href="/dealer-portal" className="text-sm font-black text-orange-300">
            ← Back to Dashboard
          </a>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black md:text-4xl">
                Create Material Order
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Select material, review GST pricing, choose payment mode and submit order.
              </p>
            </div>

            <div className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-900">
              Cart: {cart.length} items · ₹{totals.total.toLocaleString('en-IN')}
            </div>
          </div>
        </header>

        <form onSubmit={submitOrder} className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-[2rem] bg-white p-5 text-slate-900 shadow-xl lg:col-span-2">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black">Available Materials</h2>
                <p className="text-sm text-slate-500">
                  Add items to your dealer order.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search material, brand, HSN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            {loading ? (
              <div className="rounded-3xl bg-slate-50 p-8 text-center font-black">
                Loading materials...
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredStock.map((item) => (
                  <MaterialCard
                    key={`${item.materialId}-${item.branchName}`}
                    item={item}
                    onAdd={() => addToCart(item)}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <section className="rounded-[2rem] bg-white p-5 text-slate-900 shadow-xl">
              <h2 className="text-xl font-black">Order Cart</h2>

              <div className="mt-4 space-y-3">
                {!cart.length && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
                    No material selected yet.
                  </div>
                )}

                {cart.map((item) => (
                  <div key={item.materialId} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{item.materialName}</p>
                        <p className="text-xs text-slate-500">
                          ₹{Number(item.sellingRateWithoutGst || 0).toLocaleString('en-IN')} + GST {item.gstPercent}%
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCartItem(item.materialId)}
                        className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateCartItem(item.materialId, 'quantity', e.target.value)
                        }
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                        placeholder="Qty"
                      />

                      <input
                        type="number"
                        min="0"
                        value={item.discountAmount}
                        onChange={(e) =>
                          updateCartItem(item.materialId, 'discountAmount', e.target.value)
                        }
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                        placeholder="Discount"
                      />
                    </div>

                    <input
                      type="text"
                      value={item.remarks}
                      onChange={(e) =>
                        updateCartItem(item.materialId, 'remarks', e.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                      placeholder="Item remarks"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-gradient-to-br from-orange-500 to-yellow-400 p-5 text-slate-950 shadow-xl">
              <h2 className="text-xl font-black">
  Payment & Delivery
</h2>

              <div className="mt-4 space-y-3">
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full rounded-2xl border border-white/40 bg-white px-4 py-3 text-sm font-black outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online Payment</option>
                  {dealer?.creditEnabled && <option value="CREDIT">Credit</option>}
                </select>

                <select
  value={deliveryMode}
  onChange={(e) => setDeliveryMode(e.target.value)}
  className="w-full rounded-2xl border border-white/40 bg-white px-4 py-3 text-sm font-black outline-none"
>
  <option value="SELF_COLLECTION">
    Self Collection
  </option>

  <option value="DELIVERY">
    Delivery
  </option>
</select>

{deliveryMode === 'DELIVERY' && (
  <>
    <textarea
      value={deliveryAddress}
      onChange={(e) => setDeliveryAddress(e.target.value)}
      className="w-full rounded-2xl border border-white/40 bg-white px-4 py-3 text-sm font-black outline-none"
      placeholder="Delivery Address"
      rows={3}
    />

<p className="rounded-2xl bg-white/70 p-3 text-xs font-bold text-slate-800">
  Delivery charges will be confirmed by company after reviewing the address.
</p>

  </>
)}

                {paymentType === 'CREDIT' && (
                  <input
                    type="date"
                    value={creditDueDate}
                    onChange={(e) => setCreditDueDate(e.target.value)}
                    className="w-full rounded-2xl border border-white/40 bg-white px-4 py-3 text-sm font-black outline-none"
                  />
                )}

                <input
                  type="datetime-local"
                  value={expectedDeliveryAt}
                  onChange={(e) => setExpectedDeliveryAt(e.target.value)}
                  className="w-full rounded-2xl border border-white/40 bg-white px-4 py-3 text-sm font-black outline-none"
                />

         {deliveryMode === 'SELF_COLLECTION' && (
                 <>
                <input
                  type="text"
                  value={pickupStaffName}
                  onChange={(e) => setPickupStaffName(e.target.value)}
                  className="w-full rounded-2xl border border-white/40 bg-white px-4 py-3 text-sm font-black outline-none"
                  placeholder="Pickup staff name"
                />

                <input
                  type="text"
                  value={pickupStaffPhone}
                  onChange={(e) => setPickupStaffPhone(e.target.value)}
                  className="w-full rounded-2xl border border-white/40 bg-white px-4 py-3 text-sm font-black outline-none"
                  placeholder="Pickup staff phone"
                />
                </>
                   )}

                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full rounded-2xl border border-white/40 bg-white px-4 py-3 text-sm font-black outline-none"
                  placeholder="Order remarks"
                  rows={3}
                />
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 text-slate-900 shadow-xl">
              <h2 className="text-xl font-black">Order Summary</h2>

              <div className="mt-4 space-y-2 text-sm font-bold">
                <SummaryRow label="Subtotal" value={totals.subtotal} />
                <SummaryRow label="Discount" value={totals.discount} />
                <SummaryRow label="GST" value={totals.gst} />
                
                <div className="border-t border-slate-100 pt-3">
                  <SummaryRow label="Grand Total" value={totals.total} big />
                </div>
              </div>

              {message && (
                <p className="mt-4 rounded-2xl bg-blue-50 p-3 text-center text-sm font-bold text-blue-700">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 w-full rounded-2xl bg-gradient-to-r from-blue-700 to-sky-500 py-4 font-black text-white shadow-xl transition hover:scale-[1.01] disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Order & Generate PI'}
              </button>
            </section>
          </aside>
        </form>
      </div>
    </main>
  );
}

function MaterialCard({ item, onAdd }: { item: any; onAdd: () => void }) {
  const available = Number(item.availableQuantity || 0);

  return (
    <div className="rounded-[1.7rem] border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black">{item.materialName}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {item.brand || 'No brand'} · HSN {item.hsnCode || '-'}
          </p>
        </div>

        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
          {available} {item.unit || ''}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white p-3">
          <p className="text-xs font-bold text-slate-400">Without GST</p>
          <p className="font-black">
            ₹{Number(item.sellingRateWithoutGst || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-3">
          <p className="text-xs font-bold text-slate-400">With GST</p>
          <p className="font-black">
            ₹{Number(item.sellingRateWithGst || 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={available <= 0}
        className="mt-4 w-full rounded-2xl bg-slate-950 py-3 text-sm font-black text-white transition hover:scale-[1.01] disabled:bg-slate-300"
      >
        {available <= 0 ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  big,
}: {
  label: string;
  value: number;
  big?: boolean;
}) {
  return (
    <div className={`flex justify-between ${big ? 'text-lg font-black' : ''}`}>
      <span>{label}</span>
      <span>₹{Number(value || 0).toLocaleString('en-IN')}</span>
    </div>
  );
}
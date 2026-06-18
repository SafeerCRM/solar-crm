'use client';

import { FormEvent, useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DealerComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [dealerOrderId, setDealerOrderId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOrders();
    loadComplaints();
  }, [status]);

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

  const loadComplaints = async () => {
    const token = getToken();

    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);

      const res = await fetch(`${API_BASE_URL}/dealer-auth/complaints?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setComplaints(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const uploadPhotos = async (files: FileList | null) => {
    const token = getToken();

    if (!files || !files.length) return;

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));

      const res = await fetch(`${API_BASE_URL}/dealer-auth/complaint-photos/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Photo upload failed');
        return;
      }

      const urls = Array.isArray(data.photos)
        ? data.photos.map((item: any) => item.fileUrl).filter(Boolean)
        : [];

      setPhotoUrls((prev) => [...prev, ...urls]);
      setMessage('Complaint photo uploaded successfully.');
    } catch (error) {
      console.error(error);
      setMessage('Photo upload error.');
    } finally {
      setUploading(false);
    }
  };

  const submitComplaint = async (e: FormEvent) => {
    e.preventDefault();

    const token = getToken();

    if (!subject.trim()) {
      setMessage('Please enter complaint subject.');
      return;
    }

    if (!description.trim()) {
      setMessage('Please enter complaint description.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/dealer-auth/complaints`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealerOrderId: dealerOrderId ? Number(dealerOrderId) : null,
          subject,
          description,
          photoUrls,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || 'Complaint submit failed');
        return;
      }

      setMessage('Complaint submitted successfully.');
      setDealerOrderId('');
      setSubject('');
      setDescription('');
      setPhotoUrls([]);
      loadComplaints();
    } catch (error) {
      console.error(error);
      setMessage('Complaint submit error.');
    } finally {
      setSubmitting(false);
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
              <h1 className="text-3xl font-black md:text-4xl">
                Dealer Complaints
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Raise issues with photos and track resolution from Aditya Solars.
              </p>
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900"
            >
              <option value="">All Complaints</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={submitComplaint}
            className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl"
          >
            <h2 className="text-xl font-black">Raise Complaint</h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Related Order Optional
                </label>

                <select
                  value={dealerOrderId}
                  onChange={(e) => setDealerOrderId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black outline-none focus:border-blue-500"
                >
                  <option value="">No specific order</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber || `Order #${order.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Subject"
                value={subject}
                onChange={setSubject}
                placeholder="Example: Material issue / delivery delay"
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Explain the complaint clearly"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Upload Photos
                </label>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => uploadPhotos(e.target.files)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold"
                />

                {uploading && (
                  <p className="mt-2 text-xs font-bold text-blue-600">
                    Uploading photos...
                  </p>
                )}
              </div>

              {photoUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photoUrls.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      className="aspect-square overflow-hidden rounded-2xl bg-slate-100"
                    >
                      <img src={url} alt="Complaint" className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
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
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>

          <section className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl lg:col-span-2">
            <h2 className="text-xl font-black">Complaint History</h2>

            <div className="mt-5 space-y-4">
              {!complaints.length && (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                  No complaints found.
                </div>
              )}

              {complaints.map((item) => (
                <div key={item.id} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-black">{item.subject}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Complaint #{item.id}
                        {item.dealerOrderId ? ` · Order #${item.dealerOrderId}` : ''}
                      </p>
                    </div>

                    <StatusBadge status={item.status} />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-600">
                    {item.description}
                  </p>

                  {Array.isArray(item.photoUrls) && item.photoUrls.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.photoUrls.map((url: string) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          className="h-20 w-20 overflow-hidden rounded-2xl bg-white"
                        >
                          <img src={url} alt="Complaint" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-600">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'RESOLVED' || status === 'CLOSED'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'IN_PROGRESS'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-blue-100 text-blue-700';

  return (
    <span className={`rounded-full px-4 py-2 text-xs font-black ${tone}`}>
      {status || 'OPEN'}
    </span>
  );
}
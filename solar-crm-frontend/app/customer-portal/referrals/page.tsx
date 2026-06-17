'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CustomerReferralsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    referredName: '',
    referredPhone: '',
    referredCity: '',
    referredAddress: '',
    remarks: '',
  });

  const referrals = dashboard?.referrals || [];

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
      alert('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const submitReferral = async () => {
    if (!form.referredName.trim()) {
      alert('Please enter referred customer name');
      return;
    }

    if (!form.referredPhone.trim()) {
      alert('Please enter referred customer mobile number');
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem('customer_token');
      const customer = dashboard?.customer || {};

      const res = await fetch(`${API_BASE_URL}/customer-auth/referrals`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          referrerName: customer.customerName || '',
          referrerPhone: customer.mobile || '',
          rewardAmount: 5000,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || 'Failed to submit referral');
        return;
      }

      alert('Referral submitted successfully');

      setForm({
        referredName: '',
        referredPhone: '',
        referredCity: '',
        referredAddress: '',
        remarks: '',
      });

      loadDashboard();
    } catch (error) {
      console.error(error);
      alert('Failed to submit referral');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50">
        <div className="rounded-3xl bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-3xl">
            🎁
          </div>
          <p className="text-sm font-semibold text-gray-600">
            Loading referral program...
          </p>
        </div>
      </main>
    );
  }

  const rewardPaidCount = referrals.filter((item: any) => item.rewardPaid).length;
  const rewardPendingCount = referrals.filter((item: any) => !item.rewardPaid).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
          <p className="text-sm font-bold opacity-90">
            Aditya Solars Referral Program
          </p>

          <h1 className="mt-2 text-4xl font-black md:text-5xl">
            🎁 Refer & Earn ₹5000
          </h1>

          <p className="mt-3 max-w-3xl text-sm text-white/90">
            Refer a friend, relative or neighbour for a solar plant. Track status
            and reward progress directly from your customer portal.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <HeroCard title="Total Referrals" value={String(referrals.length)} />
            <HeroCard title="Reward Amount" value="₹5,000" />
            <HeroCard title="Paid Rewards" value={String(rewardPaidCount)} />
            <HeroCard title="Pending Rewards" value={String(rewardPendingCount)} />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl lg:col-span-1">
            <h2 className="text-2xl font-black text-gray-900">
              Add Referral
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Submit details of a person interested in solar plant installation.
            </p>

            <div className="mt-5 space-y-3">
              <input
                placeholder="Referred Customer Name"
                value={form.referredName}
                onChange={(e) =>
                  setForm({ ...form, referredName: e.target.value })
                }
                className="w-full rounded-2xl border p-3"
              />

              <input
                placeholder="Referred Customer Mobile"
                value={form.referredPhone}
                onChange={(e) =>
                  setForm({ ...form, referredPhone: e.target.value })
                }
                className="w-full rounded-2xl border p-3"
              />

              <input
                placeholder="City"
                value={form.referredCity}
                onChange={(e) =>
                  setForm({ ...form, referredCity: e.target.value })
                }
                className="w-full rounded-2xl border p-3"
              />

              <textarea
                rows={3}
                placeholder="Address"
                value={form.referredAddress}
                onChange={(e) =>
                  setForm({ ...form, referredAddress: e.target.value })
                }
                className="w-full rounded-2xl border p-3"
              />

              <textarea
                rows={3}
                placeholder="Remarks"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="w-full rounded-2xl border p-3"
              />

              <button
                onClick={submitReferral}
                disabled={saving}
                className="w-full rounded-2xl bg-orange-500 py-3 font-black text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? 'Submitting...' : 'Submit Referral'}
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-xl lg:col-span-2">
            <h2 className="text-2xl font-black text-gray-900">
              Referral Tracking
            </h2>

            <div className="mt-5 space-y-4">
              {referrals.length === 0 ? (
                <EmptyCard text="No referrals submitted yet." />
              ) : (
                referrals.map((item: any) => (
                  <div key={item.id} className="rounded-3xl border bg-gray-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-gray-900">
                          {item.referredName || '-'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.referredPhone || '-'} · {item.referredCity || '-'}
                        </p>
                      </div>

                      <StatusBadge status={item.status} />
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <InfoCard
                        label="Reward Amount"
                        value={formatCurrency(item.rewardAmount || 5000)}
                      />
                      <InfoCard
                        label="Reward Status"
                        value={item.rewardPaid ? 'Paid' : 'Pending'}
                      />
                      <InfoCard
                        label="Submitted"
                        value={formatDate(item.createdAt)}
                      />
                    </div>

                    {item.remarks && (
                      <div className="mt-4 rounded-2xl bg-white p-4">
                        <p className="text-xs font-bold text-gray-500">Remarks</p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">
                          {item.remarks}
                        </p>
                      </div>
                    )}

                    <ReferralProgress status={item.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
          <h2 className="text-2xl font-black text-gray-900">
            How Referral Reward Works
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <GuideCard icon="1️⃣" title="Submit Referral" text="Add name, phone and city." />
            <GuideCard icon="2️⃣" title="Team Contacts" text="Aditya Solars team follows up." />
            <GuideCard icon="3️⃣" title="Project Completed" text="Referral becomes eligible." />
            <GuideCard icon="4️⃣" title="Reward Paid" text="₹5000 reward is released." />
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
  const value = status || 'REFERRED';

  return (
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
      {formatLabel(value)}
    </span>
  );
}

function ReferralProgress({ status }: { status?: string }) {
  const steps = [
    'REFERRED',
    'LEAD_CREATED',
    'MEETING_DONE',
    'PROJECT_CREATED',
    'PROJECT_COMPLETED',
    'REWARD_PAID',
  ];

  const currentIndex = Math.max(steps.indexOf(status || 'REFERRED'), 0);

  return (
    <div className="mt-5">
      <p className="mb-3 text-sm font-black text-gray-900">Progress</p>

      <div className="grid gap-2 md:grid-cols-6">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`rounded-2xl p-3 text-center text-xs font-black ${
              index <= currentIndex
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {formatLabel(step)}
          </div>
        ))}
      </div>
    </div>
  );
}

function GuideCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-gray-50 p-5">
      <p className="text-3xl">{icon}</p>
      <h3 className="mt-3 font-black text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{text}</p>
    </div>
  );
}

function formatCurrency(value?: number | string) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN');
}

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}
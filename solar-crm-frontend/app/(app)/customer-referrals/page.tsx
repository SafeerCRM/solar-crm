'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const STATUS_OPTIONS = [
  'REFERRED',
  'CONTACTED',
  'INTERESTED',
  'NOT_INTERESTED',
  'LEAD_CREATED',
  'MEETING_SCHEDULED',
  'MEETING_DONE',
  'PROJECT_CREATED',
  'PROJECT_COMPLETED',
  'REWARD_PAYABLE',
  'REWARD_PAID',
  'REJECTED',
];

export default function CustomerReferralsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    city: '',
    page: 1,
    limit: 20,
  });

  const [totalPages, setTotalPages] = useState(1);

  const [editForm, setEditForm] = useState<any>({
    status: '',
    linkedLeadId: '',
    linkedMeetingId: '',
    linkedProjectId: '',
    rewardAmount: '',
    remarks: '',
  });

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  const loadReferrals = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE_URL}/customer-portal/referrals`, {
        params: filters,
        headers: headers(),
      });

      const data = res.data?.data || [];

      setItems(data);
      setTotalPages(res.data?.totalPages || 1);

      if (!selected && data.length) {
        selectReferral(data[0]);
      }
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const selectReferral = (item: any) => {
    setSelected(item);
    setActiveTab('OVERVIEW');
    setEditForm({
      status: item.status || 'REFERRED',
      linkedLeadId: item.linkedLeadId || '',
      linkedMeetingId: item.linkedMeetingId || '',
      linkedProjectId: item.linkedProjectId || '',
      rewardAmount: item.rewardAmount || 5000,
      remarks: item.remarks || '',
    });
  };

  const saveReferral = async (extra: any = {}) => {
    if (!selected?.id) return;

    try {
      setSaving(true);

      const payload = {
        ...editForm,
        ...extra,
      };

      const res = await axios.patch(
        `${API_BASE_URL}/customer-portal/referrals/${selected.id}`,
        payload,
        { headers: headers() },
      );

      alert('Referral updated');

      setSelected(res.data);
      await loadReferrals();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to update referral');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadReferrals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page]);

  const summary = {
    total: items.length,
    referred: items.filter((x) => x.status === 'REFERRED').length,
    lead: items.filter((x) => x.status === 'LEAD_CREATED').length,
    meeting: items.filter((x) =>
      ['MEETING_SCHEDULED', 'MEETING_DONE'].includes(x.status),
    ).length,
    project: items.filter((x) =>
      ['PROJECT_CREATED', 'PROJECT_COMPLETED'].includes(x.status),
    ).length,
    reward: items.filter((x) =>
      ['REWARD_PAYABLE', 'REWARD_PAID'].includes(x.status),
    ).length,
  };

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 pb-10">
      <a
        href="/customer-portal-management"
        className="inline-flex rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white"
      >
        ← Customer Portal Management
      </a>

      <section className="rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
        <h1 className="text-4xl font-black">Customer Referrals</h1>
        <p className="mt-2 text-sm font-semibold text-white/90">
          Track referred contacts from customer portal, convert to lead/meeting/project and manage rewards.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-6">
          <HeroCard title="Total" value={summary.total} />
          <HeroCard title="Referred" value={summary.referred} />
          <HeroCard title="Lead" value={summary.lead} />
          <HeroCard title="Meeting" value={summary.meeting} />
          <HeroCard title="Project" value={summary.project} />
          <HeroCard title="Reward" value={summary.reward} />
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-5 shadow-xl">
        <h2 className="text-xl font-black text-gray-900">Filters</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            placeholder="Search name / phone / customer code"
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value })
            }
            className="rounded-2xl border p-3"
          />

          <input
            placeholder="City"
            value={filters.city}
            onChange={(e) =>
              setFilters({ ...filters, city: e.target.value })
            }
            className="rounded-2xl border p-3"
          />

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
            className="rounded-2xl border p-3"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setFilters({ ...filters, page: 1 });
              setTimeout(loadReferrals, 0);
            }}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
          >
            Apply
          </button>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-[2rem] bg-white p-4 shadow-xl">
          <h2 className="text-lg font-black text-gray-900">Referral List</h2>

          <div className="mt-4 max-h-[720px] space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <div className="rounded-2xl border border-dashed p-6 text-center text-sm font-bold text-gray-500">
                Loading referrals...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-center text-sm font-bold text-gray-500">
                No referrals found.
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectReferral(item)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected?.id === item.id
                      ? 'border-orange-300 bg-orange-50'
                      : 'bg-gray-50 hover:bg-orange-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-gray-900">
                        {item.referredName}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-gray-500">
                        {item.referredPhone || '-'}
                      </p>
                    </div>

                    <StatusBadge status={item.status} />
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Referrer: {item.referrerName || item.customerCode || '-'}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              disabled={filters.page <= 1}
              onClick={() =>
                setFilters({ ...filters, page: filters.page - 1 })
              }
              className="rounded-xl bg-gray-200 px-3 py-2 text-sm font-bold disabled:opacity-50"
            >
              Previous
            </button>

            <p className="text-xs font-bold text-gray-500">
              Page {filters.page} of {totalPages}
            </p>

            <button
              disabled={filters.page >= totalPages}
              onClick={() =>
                setFilters({ ...filters, page: filters.page + 1 })
              }
              className="rounded-xl bg-gray-200 px-3 py-2 text-sm font-bold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-5 shadow-xl">
          {!selected ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm font-bold text-gray-500">
              Select a referral to view details.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">
                    {selected.referredName}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {selected.referredPhone || '-'} · {selected.referredCity || '-'}
                  </p>
                </div>

                <StatusBadge status={selected.status} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {['OVERVIEW', 'CONVERSION', 'REWARD'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-4 py-2 text-xs font-black ${
                      activeTab === tab
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {formatLabel(tab)}
                  </button>
                ))}
              </div>

              {activeTab === 'OVERVIEW' && (
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <InfoGroup
                    title="Referred Contact"
                    rows={[
                      ['Name', selected.referredName],
                      ['Phone', selected.referredPhone],
                      ['City', selected.referredCity],
                      ['Address', selected.referredAddress],
                    ]}
                  />

                  <InfoGroup
                    title="Referrer / Customer"
                    rows={[
                      ['Customer ID', String(selected.customerId || '-')],
                      ['Customer Code', selected.customerCode],
                      ['Referrer Name', selected.referrerName],
                      ['Referrer Phone', selected.referrerPhone],
                    ]}
                  />

                  <div className="rounded-3xl bg-gray-50 p-5 lg:col-span-2">
                    <p className="text-xs font-bold text-gray-500">Remarks</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {selected.remarks || '-'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'CONVERSION' && (
                <div className="mt-5 rounded-3xl bg-gray-50 p-5">
                  <h3 className="text-lg font-black text-gray-900">
                    Conversion Tracking
                  </h3>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value })
                      }
                      className="rounded-2xl border p-3"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {formatLabel(status)}
                        </option>
                      ))}
                    </select>

                    <input
                      placeholder="Linked Lead ID"
                      value={editForm.linkedLeadId}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          linkedLeadId: e.target.value,
                        })
                      }
                      className="rounded-2xl border p-3"
                    />

                    <input
                      placeholder="Linked Meeting ID"
                      value={editForm.linkedMeetingId}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          linkedMeetingId: e.target.value,
                        })
                      }
                      className="rounded-2xl border p-3"
                    />

                    <input
                      placeholder="Linked Project ID"
                      value={editForm.linkedProjectId}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          linkedProjectId: e.target.value,
                        })
                      }
                      className="rounded-2xl border p-3"
                    />

                    <textarea
                      rows={4}
                      placeholder="Internal remarks"
                      value={editForm.remarks}
                      onChange={(e) =>
                        setEditForm({ ...editForm, remarks: e.target.value })
                      }
                      className="rounded-2xl border p-3 md:col-span-2"
                    />

                    <button
                      onClick={() => saveReferral()}
                      disabled={saving}
                      className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50 md:col-span-2"
                    >
                      {saving ? 'Saving...' : 'Save Conversion'}
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {selected.linkedLeadId && (
                      <a
                        href={`/leads/${selected.linkedLeadId}`}
                        className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-black text-white"
                      >
                        Open Lead
                      </a>
                    )}

                    {selected.linkedMeetingId && (
                      <a
                        href={`/meetings/${selected.linkedMeetingId}`}
                        className="rounded-2xl bg-purple-600 px-4 py-3 text-center text-sm font-black text-white"
                      >
                        Open Meeting
                      </a>
                    )}

                    {selected.linkedProjectId && (
                      <a
                        href={`/projects/${selected.linkedProjectId}`}
                        className="rounded-2xl bg-gray-900 px-4 py-3 text-center text-sm font-black text-white"
                      >
                        Open Project
                      </a>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'REWARD' && (
                <div className="mt-5 rounded-3xl bg-gray-50 p-5">
                  <h3 className="text-lg font-black text-gray-900">
                    Reward Management
                  </h3>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                      type="number"
                      placeholder="Reward Amount"
                      value={editForm.rewardAmount}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          rewardAmount: e.target.value,
                        })
                      }
                      className="rounded-2xl border p-3"
                    />

                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-bold text-gray-500">
                        Reward Status
                      </p>
                      <p className="mt-1 text-sm font-black text-gray-900">
                        {selected.rewardPaid ? 'Paid' : 'Pending'}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        saveReferral({
                          status: 'REWARD_PAID',
                          rewardPaid: true,
                        })
                      }
                      disabled={saving || selected.rewardPaid}
                      className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50 md:col-span-2"
                    >
                      {selected.rewardPaid ? 'Reward Already Paid' : 'Mark Reward Paid'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function HeroCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white/20 p-4 backdrop-blur">
      <p className="text-xs font-bold opacity-90">{title}</p>
      <p className="mt-2 text-2xl font-black">{Number(value || 0)}</p>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  return (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
      {formatLabel(status || 'REFERRED')}
    </span>
  );
}

function InfoGroup({
  title,
  rows,
}: {
  title: string;
  rows: [string, any][];
}) {
  return (
    <div className="rounded-3xl bg-gray-50 p-5">
      <h3 className="font-black text-gray-900">{title}</h3>

      <div className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl bg-white px-4 py-3"
          >
            <p className="text-xs font-bold text-gray-500">{label}</p>
            <p className="mt-1 break-words text-sm font-black text-gray-900">
              {value || '-'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}
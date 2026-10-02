'use client';

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import axios from 'axios';
import QRCode from 'qrcode';

import { getAuthHeaders } from '@/lib/authHeaders';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type TabType =
  | 'OVERVIEW'
  | 'ADD_REFERRAL'
  | 'REFERRALS'
  | 'QR'
  | 'EARNINGS';

type SolarMitraProfile = {
  id: number;
  name: string;
  businessName?: string | null;
  primaryPhone: string;
  secondaryPhone?: string | null;
  email?: string | null;
  address?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  gpsAddress?: string | null;
  shopPhotoUrl?: string | null;
  publicReferralToken: string;
  status: string;
};

type Referral = {
  id: number;

  customerName: string;
  customerPhone: string;
  alternatePhone?: string | null;

  customerAddress?: string | null;
  customerArea?: string | null;
  customerCity?: string | null;

  customerGpsLatitude?: number | null;
  customerGpsLongitude?: number | null;
  customerGpsAddress?: string | null;

  remarks?: string | null;

  sourceType?: string | null;
  status: string;

  linkedLeadId?: number | null;
  linkedMeetingId?: number | null;
  linkedProjectId?: number | null;

  payoutAmountSnapshot?: number | string | null;
  requiredPaymentPercentageSnapshot?:
    | number
    | string
    | null;

  createdAt: string;
  updatedAt?: string | null;
};

type Payout = {
  id: number;

  solarMitraId: number;
  solarMitraName?: string | null;
  solarMitraBusinessName?: string | null;

  referralId: number;
  projectId?: number | null;

  customerName?: string | null;
  customerPhone?: string | null;

  payoutAmount: number | string;

  requiredProjectPaymentPercentage?:
    | number
    | string
    | null;

  qualifyingPaymentPercentage?:
    | number
    | string
    | null;

  status: 'WAITING' | 'ELIGIBLE' | 'PAID' | 'CANCELLED';

  eligibleAt?: string | null;

  paidAt?: string | null;
  paidBy?: number | null;
  paidByName?: string | null;
  paymentMode?: string | null;
  paymentReference?: string | null;
  paymentRemarks?: string | null;

  createdAt: string;
  updatedAt?: string | null;
};

type ReferralForm = {
  customerName: string;
  customerPhone: string;
  alternatePhone: string;
  customerAddress: string;
  customerArea: string;
  customerCity: string;
  customerGpsLatitude: string;
  customerGpsLongitude: string;
  customerGpsAddress: string;
  remarks: string;
};

const EMPTY_FORM: ReferralForm = {
  customerName: '',
  customerPhone: '',
  alternatePhone: '',
  customerAddress: '',
  customerArea: '',
  customerCity: '',
  customerGpsLatitude: '',
  customerGpsLongitude: '',
  customerGpsAddress: '',
  remarks: '',
};

export default function SolarMitraMyPage() {
  const [activeTab, setActiveTab] =
    useState<TabType>('OVERVIEW');

  const [profile, setProfile] =
    useState<SolarMitraProfile | null>(null);

  const [referrals, setReferrals] =
    useState<Referral[]>([]);

  const [payouts, setPayouts] =
    useState<Payout[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [form, setForm] =
    useState<ReferralForm>(EMPTY_FORM);

  const [submitting, setSubmitting] =
    useState(false);

  const [formMessage, setFormMessage] =
    useState('');

  const [formError, setFormError] =
    useState('');

  const [gettingLocation, setGettingLocation] =
    useState(false);

  const [qrDataUrl, setQrDataUrl] =
    useState('');

  const [copyMessage, setCopyMessage] =
    useState('');

  const [referralSearch, setReferralSearch] =
    useState('');

  const [payoutSearch, setPayoutSearch] =
    useState('');

  const loadData = async () => {
    if (!API_BASE_URL) {
      setError(
        'NEXT_PUBLIC_API_BASE_URL is not configured.',
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [
        profileResponse,
        referralsResponse,
        payoutsResponse,
      ] = await Promise.all([
        axios.get(
          `${API_BASE_URL}/solar-mitra/me/profile`,
          {
            headers: getAuthHeaders(),
          },
        ),

        axios.get(
          `${API_BASE_URL}/solar-mitra/me/referrals`,
          {
            headers: getAuthHeaders(),
          },
        ),

        axios.get(
          `${API_BASE_URL}/solar-mitra/me/payouts`,
          {
            headers: getAuthHeaders(),
          },
        ),
      ]);

      setProfile(profileResponse.data);

      setReferrals(
        Array.isArray(referralsResponse.data)
          ? referralsResponse.data
          : [],
      );

      setPayouts(
        Array.isArray(payoutsResponse.data)
          ? payoutsResponse.data
          : [],
      );
    } catch (err: any) {
      console.error(
        'Solar Mitra dashboard load error:',
        err,
      );

      setError(
        err?.response?.data?.message ||
          'Unable to load Solar Mitra dashboard.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const publicReferralUrl =
    useMemo(() => {
      if (
        !profile?.publicReferralToken ||
        typeof window === 'undefined'
      ) {
        return '';
      }

      return `${window.location.origin}/solar-mitra-referral/${profile.publicReferralToken}`;
    }, [profile?.publicReferralToken]);

  useEffect(() => {
    if (!publicReferralUrl) {
      setQrDataUrl('');
      return;
    }

    QRCode.toDataURL(publicReferralUrl, {
      width: 900,
      margin: 2,
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error(
          'Solar Mitra QR generation error:',
          err,
        );
        setQrDataUrl('');
      });
  }, [publicReferralUrl]);

  const payoutByReferralId =
    useMemo(() => {
      const map = new Map<number, Payout>();

      for (const payout of payouts) {
        map.set(
          Number(payout.referralId),
          payout,
        );
      }

      return map;
    }, [payouts]);

  const getDisplayStatus = (
    referral: Referral,
  ) => {
    const payout =
      payoutByReferralId.get(
        Number(referral.id),
      );

    if (
      payout?.status === 'PAID' ||
      referral.status === 'PAYOUT_PAID'
    ) {
      return 'Payout Paid';
    }

    if (
      payout?.status === 'ELIGIBLE' ||
      referral.status === 'PAYOUT_ELIGIBLE'
    ) {
      return 'Payout Eligible';
    }

    if (
      payout?.status === 'WAITING'
    ) {
      return 'Payout Pending';
    }

    if (
      referral.status === 'PROJECT_CREATED'
    ) {
      return 'Project Created';
    }

    if (
      referral.status ===
        'MEETING_SCHEDULED' ||
      referral.status ===
        'MEETING_COMPLETED'
    ) {
      return 'In Progress';
    }

    if (
      referral.status === 'SUBMITTED' ||
      referral.status === 'LEAD_CREATED'
    ) {
      return 'Lead Created';
    }

    return 'In Progress';
  };

  const getStatusClass = (
    status: string,
  ) => {
    if (status === 'Payout Paid') {
      return 'bg-emerald-100 text-emerald-700';
    }

    if (status === 'Payout Eligible') {
      return 'bg-green-100 text-green-700';
    }

    if (status === 'Payout Pending') {
      return 'bg-amber-100 text-amber-700';
    }

    if (status === 'Project Created') {
      return 'bg-violet-100 text-violet-700';
    }

    if (status === 'In Progress') {
      return 'bg-blue-100 text-blue-700';
    }

    return 'bg-gray-100 text-gray-700';
  };

  const totalReferralCount =
    referrals.length;

  const projectReferralCount =
    referrals.filter(
      (item) =>
        Boolean(item.linkedProjectId),
    ).length;

  const eligibleAmount =
    payouts
      .filter(
        (item) =>
          item.status === 'ELIGIBLE',
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(item.payoutAmount || 0),
        0,
      );

  const paidAmount =
    payouts
      .filter(
        (item) =>
          item.status === 'PAID',
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(item.payoutAmount || 0),
        0,
      );

  const pendingAmount =
    payouts
      .filter(
        (item) =>
          item.status === 'WAITING',
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(item.payoutAmount || 0),
        0,
      );

  const filteredReferrals =
    useMemo(() => {
      const search =
        referralSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return referrals;
      }

      return referrals.filter(
        (item) =>
          String(
            item.customerName || '',
          )
            .toLowerCase()
            .includes(search) ||
          String(
            item.customerPhone || '',
          ).includes(search) ||
          String(
            item.customerCity || '',
          )
            .toLowerCase()
            .includes(search) ||
          String(
            item.customerArea || '',
          )
            .toLowerCase()
            .includes(search),
      );
    }, [
      referrals,
      referralSearch,
    ]);

  const filteredPayouts =
    useMemo(() => {
      const search =
        payoutSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return payouts;
      }

      return payouts.filter(
        (item) =>
          String(
            item.customerName || '',
          )
            .toLowerCase()
            .includes(search) ||
          String(
            item.customerPhone || '',
          ).includes(search) ||
          String(
            item.projectId || '',
          ).includes(search),
      );
    }, [
      payouts,
      payoutSearch,
    ]);

  const updateForm = (
    field: keyof ReferralForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const captureLocation = () => {
    setFormError('');
    setFormMessage('');

    if (
      typeof navigator === 'undefined' ||
      !navigator.geolocation
    ) {
      setFormError(
        'Location is not supported on this device.',
      );
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        setForm((current) => ({
          ...current,

          customerGpsLatitude:
            String(latitude),

          customerGpsLongitude:
            String(longitude),

          customerGpsAddress:
            `${latitude.toFixed(
              6,
            )}, ${longitude.toFixed(6)}`,
        }));

        setGettingLocation(false);

        setFormMessage(
          'GPS location captured successfully.',
        );
      },

      (locationError) => {
        console.error(
          'GPS capture error:',
          locationError,
        );

        setGettingLocation(false);

        setFormError(
          'Unable to capture location. Please allow location permission and try again.',
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const submitReferral = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    setFormError('');
    setFormMessage('');

    const customerName =
      form.customerName.trim();

    const customerPhone =
      form.customerPhone
        .replace(/\D/g, '')
        .slice(-10);

    const alternatePhone =
      form.alternatePhone
        .replace(/\D/g, '')
        .slice(-10);

    if (!customerName) {
      setFormError(
        'Customer name is required.',
      );
      return;
    }

    if (
      customerPhone.length !== 10
    ) {
      setFormError(
        'Valid 10 digit customer phone is required.',
      );
      return;
    }

    if (
      alternatePhone &&
      alternatePhone.length !== 10
    ) {
      setFormError(
        'Valid 10 digit alternate phone is required.',
      );
      return;
    }


    if (!API_BASE_URL) {
      setFormError(
        'API URL is not configured.',
      );
      return;
    }

    try {
      setSubmitting(true);

      await axios.post(
        `${API_BASE_URL}/solar-mitra/me/referrals`,
        {
          customerName,

          customerPhone,

          alternatePhone:
            alternatePhone || null,

          customerAddress:
            form.customerAddress.trim() ||
            null,

          customerArea:
            form.customerArea.trim() ||
            null,

          customerCity:
            form.customerCity.trim() ||
            null,

          customerGpsLatitude:
            Number(
              form.customerGpsLatitude,
            ),

          customerGpsLongitude:
            Number(
              form.customerGpsLongitude,
            ),

          customerGpsAddress:
            form.customerGpsAddress.trim() ||
            null,

          remarks:
            form.remarks.trim() ||
            null,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      setForm(EMPTY_FORM);

      setFormMessage(
        'Referral submitted successfully. Lead has been created.',
      );

      await loadData();

      setActiveTab('REFERRALS');
    } catch (err: any) {
      console.error(
        'Solar Mitra referral submit error:',
        err,
      );

      setFormError(
        err?.response?.data?.message ||
          'Unable to submit referral.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyReferralLink =
    async () => {
      if (!publicReferralUrl) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          publicReferralUrl,
        );

        setCopyMessage(
          'Referral link copied.',
        );

        window.setTimeout(() => {
          setCopyMessage('');
        }, 2500);
      } catch {
        setCopyMessage(
          'Unable to copy referral link.',
        );
      }
    };

  const downloadQr = () => {
    if (!qrDataUrl) {
      return;
    }

    const anchor =
      document.createElement('a');

    anchor.href = qrDataUrl;

    anchor.download =
      `solar-mitra-${profile?.name || 'referral'}-qr.png`;

    document.body.appendChild(
      anchor,
    );

    anchor.click();

    document.body.removeChild(
      anchor,
    );
  };

  const formatMoney = (
    value: any,
  ) => {
    const amount =
      Number(value || 0);

    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      },
    ).format(amount);
  };

  const formatDate = (
    value?: string | null,
  ) => {
    if (!value) {
      return '—';
    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return '—';
    }

    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl bg-white px-6 py-5 text-sm font-semibold text-gray-600 shadow">
          Loading Solar Mitra...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-bold text-red-700">
            Unable to load Solar Mitra
          </p>

          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={loadData}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const tabs: {
    key: TabType;
    label: string;
  }[] = [
    {
      key: 'OVERVIEW',
      label: 'Overview',
    },
    {
      key: 'ADD_REFERRAL',
      label: 'Add Referral',
    },
    {
      key: 'REFERRALS',
      label: 'My Referrals',
    },
    {
      key: 'QR',
      label: 'My QR',
    },
    {
      key: 'EARNINGS',
      label: 'Earnings',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-lg md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-100">
              Solar Mitra
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
              {profile.name}
            </h1>

            {profile.businessName && (
              <p className="mt-2 text-blue-100">
                {profile.businessName}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              {profile.primaryPhone && (
                <span className="rounded-full bg-white/15 px-3 py-1.5">
                  {profile.primaryPhone}
                </span>
              )}

              {(profile.area ||
                profile.city) && (
                <span className="rounded-full bg-white/15 px-3 py-1.5">
                  {[
                    profile.area,
                    profile.city,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              )}

              <span className="rounded-full bg-emerald-400/20 px-3 py-1.5 text-emerald-100">
                {profile.status}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                'ADD_REFERRAL',
              )
            }
            className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow transition hover:bg-blue-50"
          >
            + Add Referral
          </button>
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl bg-white p-2 shadow">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() =>
                setActiveTab(tab.key)
              }
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'OVERVIEW' && (
        <div className="space-y-5">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Total Referrals"
              value={String(
                totalReferralCount,
              )}
            />

            <SummaryCard
              label="Projects Created"
              value={String(
                projectReferralCount,
              )}
            />

            <SummaryCard
              label="Eligible Earnings"
              value={formatMoney(
                eligibleAmount,
              )}
            />

            <SummaryCard
              label="Paid Earnings"
              value={formatMoney(
                paidAmount,
              )}
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-gray-900">
                    Recent Referrals
                  </h2>

                  <p className="text-sm text-gray-500">
                    Latest people referred
                    by you.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      'REFERRALS',
                    )
                  }
                  className="text-sm font-bold text-blue-600"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3">
                {referrals
                  .slice(0, 5)
                  .map((referral) => {
                    const status =
                      getDisplayStatus(
                        referral,
                      );

                    return (
                      <div
                        key={
                          referral.id
                        }
                        className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-bold text-gray-900">
                            {
                              referral.customerName
                            }
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {
                              referral.customerPhone
                            }
                            {referral.customerCity
                              ? ` • ${referral.customerCity}`
                              : ''}
                          </p>
                        </div>

                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                            status,
                          )}`}
                        >
                          {status}
                        </span>
                      </div>
                    );
                  })}

                {referrals.length ===
                  0 && (
                  <EmptyState
                    title="No referrals yet"
                    text="Add your first referral to start tracking progress."
                  />
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl bg-white p-5 shadow">
                <p className="text-sm font-semibold text-gray-500">
                  Payout Pending
                </p>

                <p className="mt-2 text-3xl font-black text-amber-600">
                  {formatMoney(
                    pendingAmount,
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow">
                <h2 className="font-black text-gray-900">
                  Your Referral QR
                </h2>

                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="Solar Mitra Referral QR"
                    className="mx-auto mt-4 h-44 w-44 rounded-xl border bg-white p-2"
                  />
                )}

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab('QR')
                  }
                  className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white"
                >
                  Open My QR
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab ===
        'ADD_REFERRAL' && (
        <section className="rounded-2xl bg-white p-5 shadow md:p-6">
          <div className="mb-6">
            <h2 className="text-xl font-black text-gray-900">
              Add Referral
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Enter the customer details.
              A lead will be created
              immediately after successful
              submission.
            </p>
          </div>

          <form
            onSubmit={submitReferral}
            className="space-y-5"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Customer Name *"
                value={
                  form.customerName
                }
                onChange={(value) =>
                  updateForm(
                    'customerName',
                    value,
                  )
                }
                placeholder="Customer name"
              />

              <FormField
                label="Customer Phone *"
                value={
                  form.customerPhone
                }
                onChange={(value) =>
                  updateForm(
                    'customerPhone',
                    value
                      .replace(
                        /\D/g,
                        '',
                      )
                      .slice(0, 10),
                  )
                }
                placeholder="10 digit mobile number"
                inputMode="numeric"
              />

              <FormField
                label="Alternate Phone"
                value={
                  form.alternatePhone
                }
                onChange={(value) =>
                  updateForm(
                    'alternatePhone',
                    value
                      .replace(
                        /\D/g,
                        '',
                      )
                      .slice(0, 10),
                  )
                }
                placeholder="Alternate mobile number"
                inputMode="numeric"
              />

              <FormField
                label="Area"
                value={
                  form.customerArea
                }
                onChange={(value) =>
                  updateForm(
                    'customerArea',
                    value,
                  )
                }
                placeholder="Area"
              />

              <FormField
                label="City"
                value={
                  form.customerCity
                }
                onChange={(value) =>
                  updateForm(
                    'customerCity',
                    value,
                  )
                }
                placeholder="City"
              />

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-bold text-gray-700">
                  Address
                </label>

                <textarea
                  value={
                    form.customerAddress
                  }
                  onChange={(event) =>
                    updateForm(
                      'customerAddress',
                      event.target.value,
                    )
                  }
                  rows={3}
                  placeholder="Customer address"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-gray-900">
                    GPS Location 
                  </p>

                  <p className="mt-1 text-xs text-gray-600">
  Optional — capture location only when you are at the customer/site location.
</p>
                </div>

                <button
                  type="button"
                  onClick={
                    captureLocation
                  }
                  disabled={
                    gettingLocation
                  }
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {gettingLocation
                    ? 'Capturing...'
                    : form.customerGpsLatitude
                      ? 'Recapture Location'
                      : 'Capture Location'}
                </button>
              </div>

              {form.customerGpsLatitude &&
                form.customerGpsLongitude && (
                  <div className="mt-4 rounded-xl bg-white p-3 text-sm">
                    <p className="font-bold text-emerald-700">
                      Location Captured
                    </p>

                    <p className="mt-1 break-all text-xs text-gray-600">
                      {
                        form.customerGpsAddress
                      }
                    </p>
                  </div>
                )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-gray-700">
                Remarks
              </label>

              <textarea
                value={form.remarks}
                onChange={(event) =>
                  updateForm(
                    'remarks',
                    event.target.value,
                  )
                }
                rows={3}
                placeholder="Any additional details"
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {formError}
              </div>
            )}

            {formMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                {formMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-black text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting
                ? 'Submitting...'
                : 'Submit Referral'}
            </button>
          </form>
        </section>
      )}

      {activeTab === 'REFERRALS' && (
        <section className="rounded-2xl bg-white p-5 shadow md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900">
                My Referrals
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Track the progress of
                people referred by you.
              </p>
            </div>

            <input
              type="text"
              value={referralSearch}
              onChange={(event) =>
                setReferralSearch(
                  event.target.value,
                )
              }
              placeholder="Search customer..."
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 sm:w-72"
            />
          </div>

          <div className="mt-5 space-y-3">
            {filteredReferrals.map(
              (referral) => {
                const status =
                  getDisplayStatus(
                    referral,
                  );

                const payout =
                  payoutByReferralId.get(
                    Number(
                      referral.id,
                    ),
                  );

                return (
                  <article
                    key={referral.id}
                    className="rounded-2xl border border-gray-200 p-4 md:p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-lg font-black text-gray-900">
                          {
                            referral.customerName
                          }
                        </h3>

                        <p className="mt-1 text-sm text-gray-600">
                          {
                            referral.customerPhone
                          }
                        </p>

                        {(referral.customerArea ||
                          referral.customerCity) && (
                          <p className="mt-1 text-sm text-gray-500">
                            {[
                              referral.customerArea,
                              referral.customerCity,
                            ]
                              .filter(
                                Boolean,
                              )
                              .join(', ')}
                          </p>
                        )}
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1.5 text-xs font-black ${getStatusClass(
                          status,
                        )}`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoBox
                        label="Referred On"
                        value={formatDate(
                          referral.createdAt,
                        )}
                      />

                      <InfoBox
                        label="Lead"
                        value={
                          referral.linkedLeadId
                            ? `#${referral.linkedLeadId}`
                            : '—'
                        }
                      />

                      <InfoBox
                        label="Project"
                        value={
                          referral.linkedProjectId
                            ? `#${referral.linkedProjectId}`
                            : '—'
                        }
                      />

                      <InfoBox
                        label="Payout"
                        value={
                          payout
                            ? formatMoney(
                                payout.payoutAmount,
                              )
                            : referral.payoutAmountSnapshot
                              ? formatMoney(
                                  referral.payoutAmountSnapshot,
                                )
                              : '—'
                        }
                      />
                    </div>

                    {referral.remarks && (
                      <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                        <span className="font-bold text-gray-800">
                          Remarks:
                        </span>{' '}
                        {referral.remarks}
                      </div>
                    )}
                  </article>
                );
              },
            )}

            {filteredReferrals.length ===
              0 && (
              <EmptyState
                title="No referrals found"
                text={
                  referralSearch
                    ? 'No referral matches your search.'
                    : 'You have not added any referrals yet.'
                }
              />
            )}
          </div>
        </section>
      )}

      {activeTab === 'QR' && (
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 text-center shadow md:p-8">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            My Referral QR
          </p>

          <h2 className="mt-2 text-2xl font-black text-gray-900">
            Share your QR with customers
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
            Customers can scan this QR
            and submit their details
            directly under your Solar
            Mitra referral.
          </p>

          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Solar Mitra Referral QR"
              className="mx-auto mt-6 h-72 w-72 max-w-full rounded-2xl border bg-white p-3 shadow"
            />
          ) : (
            <div className="mx-auto mt-6 flex h-72 w-72 max-w-full items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-500">
              QR unavailable
            </div>
          )}

          <div className="mx-auto mt-5 max-w-xl rounded-xl bg-gray-50 p-3 text-left">
            <p className="text-xs font-bold text-gray-500">
              Referral Link
            </p>

            <p className="mt-1 break-all text-sm text-gray-800">
              {publicReferralUrl}
            </p>
          </div>

          {copyMessage && (
            <p className="mt-3 text-sm font-semibold text-emerald-700">
              {copyMessage}
            </p>
          )}

          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={
                copyReferralLink
              }
              className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              Copy Link
            </button>

            <button
              type="button"
              onClick={downloadQr}
              disabled={!qrDataUrl}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              Download QR
            </button>
          </div>
        </section>
      )}

      {activeTab === 'EARNINGS' && (
        <div className="space-y-5">
          <section className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Pending"
              value={formatMoney(
                pendingAmount,
              )}
            />

            <SummaryCard
              label="Eligible"
              value={formatMoney(
                eligibleAmount,
              )}
            />

            <SummaryCard
              label="Paid"
              value={formatMoney(
                paidAmount,
              )}
            />
          </section>

          <section className="rounded-2xl bg-white p-5 shadow md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  My Earnings
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Referral payout status
                  and payment history.
                </p>
              </div>

              <input
                type="text"
                value={payoutSearch}
                onChange={(event) =>
                  setPayoutSearch(
                    event.target.value,
                  )
                }
                placeholder="Search customer..."
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 sm:w-72"
              />
            </div>

            <div className="mt-5 space-y-3">
              {filteredPayouts.map(
                (payout) => (
                  <article
                    key={payout.id}
                    className="rounded-2xl border border-gray-200 p-4 md:p-5"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-black text-gray-900">
                          {payout.customerName ||
                            'Customer'}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {payout.customerPhone ||
                            '—'}
                          {payout.projectId
                            ? ` • Project #${payout.projectId}`
                            : ''}
                        </p>
                      </div>

                      <div className="md:text-right">
                        <p className="text-xl font-black text-gray-900">
                          {formatMoney(
                            payout.payoutAmount,
                          )}
                        </p>

                        <span
                          className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-black ${
                            payout.status ===
                            'PAID'
                              ? 'bg-emerald-100 text-emerald-700'
                              : payout.status ===
                                  'ELIGIBLE'
                                ? 'bg-green-100 text-green-700'
                                : payout.status ===
                                    'WAITING'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {payout.status ===
                          'PAID'
                            ? 'Payout Paid'
                            : payout.status ===
                                'ELIGIBLE'
                              ? 'Payout Eligible'
                              : payout.status ===
                                  'WAITING'
                                ? 'Payout Pending'
                                : 'Cancelled'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoBox
                        label="Required Payment"
                        value={
                          payout.requiredProjectPaymentPercentage !==
                            null &&
                          payout.requiredProjectPaymentPercentage !==
                            undefined
                            ? `${Number(
                                payout.requiredProjectPaymentPercentage,
                              )}%`
                            : '—'
                        }
                      />

                      <InfoBox
                        label="Eligible On"
                        value={formatDate(
                          payout.eligibleAt,
                        )}
                      />

                      <InfoBox
                        label="Paid On"
                        value={formatDate(
                          payout.paidAt,
                        )}
                      />

                      <InfoBox
                        label="Payment Reference"
                        value={
                          payout.paymentReference ||
                          '—'
                        }
                      />
                    </div>
                  </article>
                ),
              )}

              {filteredPayouts.length ===
                0 && (
                <EmptyState
                  title="No earnings yet"
                  text={
                    payoutSearch
                      ? 'No payout matches your search.'
                      : 'Payouts will appear here when referred customers reach the required project stage.'
                  }
                />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm font-semibold text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-gray-900">
        {value}
      </p>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs font-semibold text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?:
    | 'text'
    | 'numeric'
    | 'tel'
    | 'email';
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-gray-700">
        {label}
      </label>

      <input
        type="text"
        value={value}
        inputMode={inputMode}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function EmptyState({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
      <p className="font-black text-gray-800">
        {title}
      </p>

      <p className="mt-1 text-sm text-gray-500">
        {text}
      </p>
    </div>
  );
}
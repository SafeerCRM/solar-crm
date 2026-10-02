'use client';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';
import { useParams } from 'next/navigation';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type PublicSolarMitra = {
  solarMitraName: string;
  businessName: string | null;
  area: string | null;
  city: string | null;
};

type ReferralForm = {
  customerName: string;
  customerPhone: string;
  alternatePhone: string;
  address: string;
  area: string;
  city: string;
  remarks: string;
};

const initialForm: ReferralForm = {
  customerName: '',
  customerPhone: '',
  alternatePhone: '',
  address: '',
  area: '',
  city: '',
  remarks: '',
};

function normalizePhone(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 10);
}

function getErrorMessage(error: any) {
  const message =
    error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string') {
    return message;
  }

  return 'Something went wrong. Please try again.';
}

export default function SolarMitraReferralPage() {
  const params = useParams();

  const token =
    typeof params?.token === 'string'
      ? params.token
      : Array.isArray(params?.token)
        ? params.token[0]
        : '';

  const [
    mitra,
    setMitra,
  ] = useState<PublicSolarMitra | null>(
    null,
  );

  const [
    form,
    setForm,
  ] = useState<ReferralForm>(
    initialForm,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    loadError,
    setLoadError,
  ] = useState('');

  const [
    submitError,
    setSubmitError,
  ] = useState('');

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    const loadReferralPage =
      async () => {
        try {
          setLoading(true);
          setLoadError('');

          const response =
            await fetch(
              `${API_BASE_URL}/solar-mitra-public/${encodeURIComponent(
                token,
              )}`,
              {
                method: 'GET',
                cache: 'no-store',
              },
            );

          const data =
            await response.json().catch(
              () => null,
            );

          if (!response.ok) {
            throw new Error(
              data?.message ||
                'This referral link is not available.',
            );
          }

          if (!cancelled) {
            setMitra(data);
          }
        } catch (error: any) {
          if (!cancelled) {
            setLoadError(
              error?.message ||
                'This referral link is not available.',
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    loadReferralPage();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const updateField = (
    field: keyof ReferralForm,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitError('');

    const customerName =
      form.customerName.trim();

    const customerPhone =
      normalizePhone(
        form.customerPhone,
      );

    const alternatePhone =
      normalizePhone(
        form.alternatePhone,
      );

    if (!customerName) {
      setSubmitError(
        'Please enter your name.',
      );
      return;
    }

    if (
      customerPhone.length !== 10
    ) {
      setSubmitError(
        'Please enter a valid 10 digit mobile number.',
      );
      return;
    }

    if (
      alternatePhone &&
      alternatePhone.length !== 10
    ) {
      setSubmitError(
        'Please enter a valid 10 digit alternate mobile number.',
      );
      return;
    }

    try {
      setSubmitting(true);

      const response =
        await fetch(
          `${API_BASE_URL}/solar-mitra-public/${encodeURIComponent(
            token,
          )}/referrals`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              customerName,
              customerPhone,

              alternatePhone:
                alternatePhone ||
                undefined,

              address:
                form.address.trim() ||
                undefined,

              area:
                form.area.trim() ||
                undefined,

              city:
                form.city.trim() ||
                undefined,

              remarks:
                form.remarks.trim() ||
                undefined,
            }),
          },
        );

      const data =
        await response.json().catch(
          () => null,
        );

      if (!response.ok) {
        const message =
          Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.message;

        throw new Error(
          message ||
            'Unable to submit your details.',
        );
      }

      setSubmitted(true);
      setForm(initialForm);

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error: any) {
      setSubmitError(
        error?.message ||
          'Unable to submit your details. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] px-4 py-8">
        <div className="mx-auto max-w-xl">
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="h-2 bg-[#f36c21]" />

            <div className="p-6 sm:p-8">
              <div className="animate-pulse space-y-5">
                <div className="h-8 w-48 rounded-lg bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-100" />
                <div className="h-4 w-3/4 rounded bg-gray-100" />

                <div className="pt-4">
                  <div className="h-14 rounded-2xl bg-gray-100" />
                </div>

                <div className="h-14 rounded-2xl bg-gray-100" />
                <div className="h-14 rounded-2xl bg-gray-100" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (
    loadError ||
    !mitra
  ) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] px-4 py-8">
        <div className="mx-auto max-w-xl">
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="h-2 bg-[#f36c21]" />

            <div className="p-7 text-center sm:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl">
                !
              </div>

              <h1 className="mt-5 text-2xl font-black text-gray-900">
                Referral Link Unavailable
              </h1>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                {loadError ||
                  'This Solar Mitra referral link is not available.'}
              </p>

              <p className="mt-5 text-xs leading-5 text-gray-400">
                Please contact Aditya Solars if
                you believe this link should be
                active.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] px-4 py-8">
        <div className="mx-auto max-w-xl">
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="h-2 bg-[#f36c21]" />

            <div className="p-7 text-center sm:p-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                <svg
                  viewBox="0 0 24 24"
                  className="h-10 w-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m5 12 4 4L19 6"
                  />
                </svg>
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-[#f36c21]">
                Aditya Solars
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">
                Thank You!
              </h1>

              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-600">
                Your details have been submitted
                successfully. The Aditya Solars
                team will contact you regarding
                your solar requirement.
              </p>

              <div className="mt-7 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Referred through
                </p>

                <p className="mt-1 font-black text-gray-900">
                  {mitra.solarMitraName}
                </p>

                {mitra.businessName && (
                  <p className="mt-0.5 text-sm text-gray-600">
                    {mitra.businessName}
                  </p>
                )}
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-gray-400">
            Solar solutions by Aditya Solars
          </p>
        </div>
      </main>
    );
  }

  const locationText = [
    mitra.area,
    mitra.city,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-xl">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="h-2 bg-[#f36c21]" />

          <div className="border-b border-gray-100 px-6 py-6 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f36c21]">
                  Aditya Solars
                </p>

                <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                  Start Your Solar Journey
                </h1>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Share your details and our
                  team will contact you for your
                  solar requirement.
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50">
                <svg
                  viewBox="0 0 24 24"
                  className="h-7 w-7 text-[#f36c21]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                  />
                  <path
                    strokeLinecap="round"
                    d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100 bg-orange-50/50 px-6 py-4 sm:px-8">
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">
              Your Solar Mitra
            </p>

            <div className="mt-2">
              <p className="font-black text-gray-900">
                {mitra.solarMitraName}
              </p>

              {(mitra.businessName ||
                locationText) && (
                <p className="mt-1 text-sm leading-5 text-gray-600">
                  {[
                    mitra.businessName,
                    locationText,
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </p>
              )}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 px-6 py-6 sm:px-8 sm:py-8"
          >
            <div>
              <h2 className="text-lg font-black text-gray-900">
                Your Details
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Fields marked with * are
                required.
              </p>
            </div>

            <FormField
              label="Full Name"
              required
            >
              <input
                type="text"
                value={
                  form.customerName
                }
                onChange={(event) =>
                  updateField(
                    'customerName',
                    event.target.value,
                  )
                }
                placeholder="Enter your full name"
                autoComplete="name"
                className={inputClass}
              />
            </FormField>

            <FormField
              label="Mobile Number"
              required
            >
              <div className="flex overflow-hidden rounded-xl border border-gray-300 bg-white focus-within:border-[#f36c21] focus-within:ring-2 focus-within:ring-orange-100">
                <div className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-600">
                  +91
                </div>

                <input
                  type="tel"
                  inputMode="numeric"
                  value={
                    form.customerPhone
                  }
                  onChange={(event) =>
                    updateField(
                      'customerPhone',
                      normalizePhone(
                        event.target.value,
                      ),
                    )
                  }
                  placeholder="10 digit mobile number"
                  autoComplete="tel"
                  className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-base text-gray-900 outline-none placeholder:text-gray-400"
                />
              </div>
            </FormField>

            <FormField label="Alternate Mobile Number">
              <div className="flex overflow-hidden rounded-xl border border-gray-300 bg-white focus-within:border-[#f36c21] focus-within:ring-2 focus-within:ring-orange-100">
                <div className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-600">
                  +91
                </div>

                <input
                  type="tel"
                  inputMode="numeric"
                  value={
                    form.alternatePhone
                  }
                  onChange={(event) =>
                    updateField(
                      'alternatePhone',
                      normalizePhone(
                        event.target.value,
                      ),
                    )
                  }
                  placeholder="Optional"
                  className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-base text-gray-900 outline-none placeholder:text-gray-400"
                />
              </div>
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Area">
                <input
                  type="text"
                  value={form.area}
                  onChange={(event) =>
                    updateField(
                      'area',
                      event.target.value,
                    )
                  }
                  placeholder="Area / locality"
                  className={inputClass}
                />
              </FormField>

              <FormField label="City">
                <input
                  type="text"
                  value={form.city}
                  onChange={(event) =>
                    updateField(
                      'city',
                      event.target.value,
                    )
                  }
                  placeholder="City"
                  className={inputClass}
                />
              </FormField>
            </div>

            <FormField label="Address">
              <textarea
                value={form.address}
                onChange={(event) =>
                  updateField(
                    'address',
                    event.target.value,
                  )
                }
                placeholder="House / street / village address"
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </FormField>

            <FormField label="Solar Requirement / Note">
              <textarea
                value={form.remarks}
                onChange={(event) =>
                  updateField(
                    'remarks',
                    event.target.value,
                  )
                }
                placeholder="Any details you would like to share"
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </FormField>

            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-5 text-red-700">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#f36c21] px-5 py-3.5 text-base font-black text-white transition hover:bg-[#df5f19] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? 'Submitting...'
                : 'Submit Solar Requirement'}
            </button>

            <p className="text-center text-xs leading-5 text-gray-400">
              By submitting your details, you
              allow Aditya Solars to contact
              you regarding your solar
              requirement.
            </p>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          Solar solutions by Aditya Solars
        </p>
      </div>
    </main>
  );
}

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#f36c21] focus:ring-2 focus:ring-orange-100';

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-gray-700">
        {label}

        {required && (
          <span className="ml-1 text-[#f36c21]">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}
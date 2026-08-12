'use client';

import Link from 'next/link';
import {
  useEffect,
  useState,
} from 'react';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type InsurancePlan = {
  id: number;
  companyName: string;
  policyName: string;
  durationMonths: number;
  price: number;
  coverageAmount?: number;
  isActive: boolean;
};

const emptyForm = {
  projectId: '',
  insurancePlanId: '',

  companyName: '',
  policyName: '',
  policyNumber: '',

  policyCost: '',
  coverageAmount: '',

  startDate: '',
  expiryDate: '',

  status: 'ACTIVE',

  remarks: '',
};

function formatMoney(
  value: any,
) {
  return `₹${Number(
    value || 0,
  ).toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 2,
    },
  )}`;
}

function durationLabel(
  months: number,
) {
  if (
    months > 0 &&
    months % 12 === 0
  ) {
    const years =
      months / 12;

    return `${years} Year${
      years === 1
        ? ''
        : 's'
    }`;
  }

  return `${months} Month${
    months === 1
      ? ''
      : 's'
  }`;
}

export default function AddExistingInsurancePage() {
  const [
    form,
    setForm,
  ] =
    useState(
      emptyForm,
    );

  const [
    plans,
    setPlans,
  ] =
    useState<
      InsurancePlan[]
    >([]);

  const [
    loadingPlans,
    setLoadingPlans,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState('');

  const [
    success,
    setSuccess,
  ] =
    useState('');

  const headers = () => {
    const token =
      localStorage.getItem(
        'token',
      );

    return {
      Authorization:
        `Bearer ${token}`,
    };
  };

  useEffect(() => {
    const loadPlans =
      async () => {
        try {
          setLoadingPlans(
            true,
          );

          const res =
            await axios.get(
              `${API_BASE_URL}/project/insurance/plans`,
              {
                headers:
                  headers(),

                params: {
                  activeOnly:
                    'true',
                  showHidden:
                    'false',
                  limit:
                    100,
                },
              },
            );

          setPlans(
            Array.isArray(
              res.data?.data,
            )
              ? res.data.data
              : [],
          );
        } catch (
          error: any
        ) {
          console.error(
            error,
          );

          setError(
            error?.response
              ?.data
              ?.message ||
              'Failed to load insurance plans',
          );
        } finally {
          setLoadingPlans(
            false,
          );
        }
      };

    loadPlans();
  }, []);

  const applySelectedPlan =
    (
      planId: string,
    ) => {
      const selectedPlan =
        plans.find(
          (plan) =>
            String(
              plan.id,
            ) ===
            String(
              planId,
            ),
        );

      if (
        !selectedPlan
      ) {
        setForm({
          ...form,

          insurancePlanId:
            '',

          companyName:
            '',

          policyName:
            '',

          policyCost:
            '',

          coverageAmount:
            '',
        });

        return;
      }

      setForm({
        ...form,

        insurancePlanId:
          String(
            selectedPlan.id,
          ),

        companyName:
          selectedPlan.companyName ||
          '',

        policyName:
          selectedPlan.policyName ||
          '',

        policyCost:
          String(
            selectedPlan.price ??
              '',
          ),

        coverageAmount:
          selectedPlan.coverageAmount ===
            undefined ||
          selectedPlan.coverageAmount ===
            null
            ? ''
            : String(
                selectedPlan.coverageAmount,
              ),
      });
    };

  const resetForm = () => {
    setForm(
      emptyForm,
    );

    setError('');
    setSuccess('');
  };

  const saveInsurance =
    async () => {
      try {
        setSaving(true);
        setError('');
        setSuccess('');

        if (
          !form.projectId.trim()
        ) {
          setError(
            'Project ID is required',
          );

          return;
        }

        if (
          !form.companyName.trim()
        ) {
          setError(
            'Insurance company name is required',
          );

          return;
        }

        if (
          !form.policyName.trim()
        ) {
          setError(
            'Policy name is required',
          );

          return;
        }

        if (
          !form.startDate
        ) {
          setError(
            'Start date is required',
          );

          return;
        }

        if (
          !form.expiryDate
        ) {
          setError(
            'Expiry date is required',
          );

          return;
        }

        if (
          form.policyCost ===
          ''
        ) {
          setError(
            'Policy cost is required',
          );

          return;
        }

        const payload = {
          projectId:
            Number(
              form.projectId,
            ),

          insurancePlanId:
            form.insurancePlanId
              ? Number(
                  form.insurancePlanId,
                )
              : undefined,

          companyName:
            form.companyName.trim(),

          policyName:
            form.policyName.trim(),

          policyNumber:
            form.policyNumber.trim(),

          policyCost:
            Number(
              form.policyCost,
            ),

          coverageAmount:
            form.coverageAmount ===
            ''
              ? undefined
              : Number(
                  form.coverageAmount,
                ),

          startDate:
            form.startDate,

          expiryDate:
            form.expiryDate,

          status:
            form.status,

          remarks:
            form.remarks.trim(),
        };

        const res =
          await axios.post(
            `${API_BASE_URL}/project/insurance/customer-policy`,
            payload,
            {
              headers:
                headers(),
            },
          );

        setSuccess(
          res.data?.message ||
            'Customer insurance added successfully',
        );

        setForm(
          emptyForm,
        );
      } catch (
        error: any
      ) {
        console.error(
          error,
        );

        setError(
          error?.response
            ?.data
            ?.message ||
            'Failed to add customer insurance',
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/customer-portal-management/insurance"
          className="rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white"
        >
          ← Insurance Management
        </Link>

        <Link
          href="/customer-portal-management"
          className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-700"
        >
          Customer Portal Dashboard
        </Link>
      </div>

      <section className="rounded-[2rem] bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 p-6 text-white shadow-2xl">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-white/75">
          Existing Customer Insurance
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Add Existing Policy
        </h1>

        <p className="mt-2 max-w-3xl text-sm font-semibold text-white/85">
          Manually register an
          already-insured customer.
          Only completed projects
          are eligible.
        </p>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {success}
        </div>
      )}

      <section className="rounded-[2rem] bg-white p-5 shadow-xl">
        <div>
          <h2 className="text-xl font-black text-gray-900">
            Customer & Project
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the completed
            Project ID. The backend
            will validate eligibility.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">
              Project ID
            </span>

            <input
              value={
                form.projectId
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  projectId:
                    event.target
                      .value,
                })
              }
              inputMode="numeric"
              placeholder="Completed Project ID"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">
              Select Existing Plan
            </span>

            <select
              disabled={
                loadingPlans
              }
              value={
                form.insurancePlanId
              }
              onChange={(
                event,
              ) =>
                applySelectedPlan(
                  event.target
                    .value,
                )
              }
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm"
            >
              <option value="">
                Manual / Custom Policy
              </option>

              {plans.map(
                (
                  plan,
                ) => (
                  <option
                    key={
                      plan.id
                    }
                    value={
                      plan.id
                    }
                  >
                    {
                      plan.companyName
                    }{' '}
                    —{' '}
                    {
                      plan.policyName
                    }{' '}
                    —{' '}
                    {durationLabel(
                      Number(
                        plan.durationMonths,
                      ),
                    )}{' '}
                    —{' '}
                    {formatMoney(
                      plan.price,
                    )}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white p-5 shadow-xl">
        <div>
          <h2 className="text-xl font-black text-gray-900">
            Policy Details
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Values from the selected
            rate-list plan can still
            be adjusted for an
            existing policy.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">
              Insurance Company
            </span>

            <input
              value={
                form.companyName
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  companyName:
                    event.target
                      .value,
                })
              }
              placeholder="ICICI Lombard"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">
              Policy Name
            </span>

            <input
              value={
                form.policyName
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  policyName:
                    event.target
                      .value,
                })
              }
              placeholder="Solar Secure"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">
              Policy Number
            </span>

            <input
              value={
                form.policyNumber
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  policyNumber:
                    event.target
                      .value,
                })
              }
              placeholder="Policy number"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">
              Status
            </span>

            <select
              value={
                form.status
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  status:
                    event.target
                      .value,
                })
              }
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm"
            >
              <option value="ACTIVE">
                Active
              </option>

              <option value="EXPIRED">
                Expired
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">
              Policy Cost
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                form.policyCost
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  policyCost:
                    event.target
                      .value,
                })
              }
              placeholder="0"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">
              Coverage Amount
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                form.coverageAmount
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  coverageAmount:
                    event.target
                      .value,
                })
              }
              placeholder="Optional"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">
              Start Date
            </span>

            <input
              type="date"
              value={
                form.startDate
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  startDate:
                    event.target
                      .value,
                })
              }
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">
              Expiry Date
            </span>

            <input
              type="date"
              value={
                form.expiryDate
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  expiryDate:
                    event.target
                      .value,
                })
              }
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
            />
          </label>
        </div>

        <label className="mt-4 block space-y-1">
          <span className="text-xs font-black uppercase text-gray-500">
            Remarks
          </span>

          <textarea
            rows={4}
            value={
              form.remarks
            }
            onChange={(
              event,
            ) =>
              setForm({
                ...form,

                remarks:
                  event.target
                    .value,
              })
            }
            placeholder="Any note about this existing policy"
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              saveInsurance
            }
            className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving
              ? 'Saving...'
              : 'Add Customer Insurance'}
          </button>

          <button
            type="button"
            onClick={
              resetForm
            }
            className="rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-black text-gray-700"
          >
            Reset
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-blue-200 bg-blue-50 p-5">
        <h3 className="font-black text-blue-900">
          Completed-project validation
        </h3>

        <p className="mt-1 text-sm font-semibold text-blue-800">
          The frontend does not
          decide eligibility. The
          backend checks the actual
          project status and rejects
          insurance creation unless
          the project is completed.
        </p>
      </section>
    </main>
  );
}
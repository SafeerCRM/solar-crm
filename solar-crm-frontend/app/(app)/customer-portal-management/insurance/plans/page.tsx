'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
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

  description?: string;
  benefits?: string;
  terms?: string;

  isActive: boolean;
  isHidden: boolean;

  createdBy?: number;
  createdByName?: string;

  createdAt?: string;
  updatedAt?: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const emptyPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

const emptyForm = {
  companyName: '',
  policyName: '',
  durationMonths: '',
  price: '',
  coverageAmount: '',
  description: '',
  benefits: '',
  terms: '',
  isActive: true,
};

function formatMoney(value: any) {
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
      years === 1 ? '' : 's'
    }`;
  }

  return `${months} Month${
    months === 1 ? '' : 's'
  }`;
}

export default function InsurancePlansPage() {
  const [
    plans,
    setPlans,
  ] =
    useState<
      InsurancePlan[]
    >([]);

  const [
    pagination,
    setPagination,
  ] =
    useState<Pagination>(
      emptyPagination,
    );

  const [
    search,
    setSearch,
  ] =
    useState('');

  const [
    companyName,
    setCompanyName,
  ] =
    useState('');

  const [
    activeOnly,
    setActiveOnly,
  ] =
    useState(false);

  const [
    showHidden,
    setShowHidden,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
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

  const [
    form,
    setForm,
  ] =
    useState(
      emptyForm,
    );

  const [
    editingId,
    setEditingId,
  ] =
    useState<
      number | null
    >(null);

  const headers =
    useCallback(
      () => {
        const token =
          localStorage.getItem(
            'token',
          );

        return {
          Authorization:
            `Bearer ${token}`,
        };
      },
      [],
    );

  const loadPlans =
    useCallback(
      async (
        page = 1,
      ) => {
        try {
          setLoading(true);
          setError('');

          const res =
            await axios.get(
              `${API_BASE_URL}/project/insurance/plans`,
              {
                headers:
                  headers(),

                params: {
                  page,
                  limit: 20,

                  search:
                    search ||
                    undefined,

                  companyName:
                    companyName ||
                    undefined,

                  activeOnly:
                    activeOnly
                      ? 'true'
                      : 'false',

                  showHidden:
                    showHidden
                      ? 'true'
                      : 'false',
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

          setPagination({
            ...emptyPagination,
            ...(res.data
              ?.pagination ||
              {}),
          });
        } catch (
          error: any
        ) {
          console.error(
            error,
          );

          setPlans([]);

          setError(
            error?.response
              ?.data
              ?.message ||
              'Failed to load insurance plans',
          );
        } finally {
          setLoading(false);
        }
      },
      [
        headers,
        search,
        companyName,
        activeOnly,
        showHidden,
      ],
    );

  useEffect(() => {
    loadPlans(1);
  }, [
    loadPlans,
  ]);

  const companyOptions =
    useMemo(
      () =>
        Array.from(
          new Set(
            plans
              .map(
                (plan) =>
                  plan.companyName,
              )
              .filter(
                Boolean,
              ),
          ),
        ).sort(
          (
            first,
            second,
          ) =>
            first.localeCompare(
              second,
            ),
        ),
      [plans],
    );

  const resetForm = () => {
    setForm(
      emptyForm,
    );

    setEditingId(
      null,
    );
  };

  const startEditing = (
    plan: InsurancePlan,
  ) => {
    setEditingId(
      plan.id,
    );

    setForm({
      companyName:
        plan.companyName ||
        '',

      policyName:
        plan.policyName ||
        '',

      durationMonths:
        String(
          plan.durationMonths ||
            '',
        ),

      price:
        String(
          plan.price ??
            '',
        ),

      coverageAmount:
        plan.coverageAmount ===
          undefined ||
        plan.coverageAmount ===
          null
          ? ''
          : String(
              plan.coverageAmount,
            ),

      description:
        plan.description ||
        '',

      benefits:
        plan.benefits ||
        '',

      terms:
        plan.terms ||
        '',

      isActive:
        Boolean(
          plan.isActive,
        ),
    });

    window.scrollTo({
      top: 0,
      behavior:
        'smooth',
    });
  };

  const savePlan =
    async () => {
      try {
        setSaving(true);
        setError('');
        setSuccess('');

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
          !Number(
            form.durationMonths,
          )
        ) {
          setError(
            'Policy duration is required',
          );
          return;
        }

        if (
          form.price === ''
        ) {
          setError(
            'Policy price is required',
          );
          return;
        }

        const payload = {
          companyName:
            form.companyName.trim(),

          policyName:
            form.policyName.trim(),

          durationMonths:
            Number(
              form.durationMonths,
            ),

          price:
            Number(
              form.price,
            ),

          coverageAmount:
            form.coverageAmount ===
            ''
              ? undefined
              : Number(
                  form.coverageAmount,
                ),

          description:
            form.description.trim(),

          benefits:
            form.benefits.trim(),

          terms:
            form.terms.trim(),

          isActive:
            form.isActive,
        };

        if (
          editingId
        ) {
          await axios.patch(
            `${API_BASE_URL}/project/insurance/plans/${editingId}`,
            payload,
            {
              headers:
                headers(),
            },
          );

          setSuccess(
            'Insurance plan updated successfully',
          );
        } else {
          await axios.post(
            `${API_BASE_URL}/project/insurance/plans`,
            payload,
            {
              headers:
                headers(),
            },
          );

          setSuccess(
            'Insurance plan created successfully',
          );
        }

        resetForm();

        await loadPlans(
          1,
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
            'Failed to save insurance plan',
        );
      } finally {
        setSaving(false);
      }
    };

  const hidePlan =
    async (
      id: number,
    ) => {
      const confirmed =
        window.confirm(
          'Hide this insurance plan?',
        );

      if (!confirmed) {
        return;
      }

      try {
        setError('');
        setSuccess('');

        await axios.patch(
          `${API_BASE_URL}/project/insurance/plans/${id}/hide`,
          {},
          {
            headers:
              headers(),
          },
        );

        setSuccess(
          'Insurance plan hidden successfully',
        );

        await loadPlans(
          pagination.page,
        );
      } catch (
        error: any
      ) {
        setError(
          error?.response
            ?.data
            ?.message ||
            'Failed to hide insurance plan',
        );
      }
    };

  const restorePlan =
    async (
      id: number,
    ) => {
      try {
        setError('');
        setSuccess('');

        await axios.patch(
          `${API_BASE_URL}/project/insurance/plans/${id}/restore`,
          {},
          {
            headers:
              headers(),
          },
        );

        setSuccess(
          'Insurance plan restored successfully',
        );

        await loadPlans(
          pagination.page,
        );
      } catch (
        error: any
      ) {
        setError(
          error?.response
            ?.data
            ?.message ||
            'Failed to restore insurance plan',
        );
      }
    };

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 pb-10">
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

      <section className="rounded-[2rem] bg-gradient-to-r from-indigo-700 to-blue-600 p-6 text-white shadow-2xl">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-white/75">
          Rate List & Policies
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Insurance Plans
        </h1>

        <p className="mt-2 max-w-3xl text-sm font-semibold text-white/85">
          Maintain insurers,
          policy durations,
          customer pricing,
          coverage and plan
          availability.
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              {editingId
                ? `Edit Plan #${editingId}`
                : 'Add Insurance Plan'}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Example: ICICI
              Lombard — Solar
              Secure — 1 Year.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={
                resetForm
              }
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-black text-gray-700"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-800"
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
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-800"
            />
          </label>

          <label className="space-y-1">
  <span className="text-xs font-black uppercase text-gray-500">
    Duration
  </span>

  <div className="grid grid-cols-[1fr_auto] gap-2">
    <input
      type="number"
      min="1"
      step="1"
      value={
        form.durationMonths
      }
      onChange={(
        event,
      ) =>
        setForm({
          ...form,

          durationMonths:
            event.target
              .value,
        })
      }
      placeholder="Duration in months"
      className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
    />

    <div className="flex min-w-[110px] items-center justify-center rounded-2xl bg-gray-100 px-3 text-sm font-black text-gray-700">
      {Number(
        form.durationMonths ||
          0,
      ) > 0
        ? durationLabel(
            Number(
              form.durationMonths,
            ),
          )
        : 'Months'}
    </div>
  </div>
</label>

          <label className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">
              Policy Price
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                form.price
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  price:
                    event.target
                      .value,
                })
              }
              placeholder="3500"
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
              placeholder="500000"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
            />
          </label>

          <label className="flex items-end">
            <span className="flex w-full items-center gap-3 rounded-2xl border border-gray-300 px-4 py-3">
              <input
                type="checkbox"
                checked={
                  form.isActive
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,

                    isActive:
                      event.target
                        .checked,
                  })
                }
                className="h-4 w-4"
              />

              <span className="text-sm font-black text-gray-700">
                Active Plan
              </span>
            </span>
          </label>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">
              Description
            </span>

            <textarea
              value={
                form.description
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  description:
                    event.target
                      .value,
                })
              }
              rows={4}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
              placeholder="Short customer-facing policy description"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">
              Benefits
            </span>

            <textarea
              value={
                form.benefits
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  benefits:
                    event.target
                      .value,
                })
              }
              rows={4}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
              placeholder="Coverage benefits and key inclusions"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">
              Terms
            </span>

            <textarea
              value={
                form.terms
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,

                  terms:
                    event.target
                      .value,
                })
              }
              rows={4}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
              placeholder="Important terms or conditions"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              savePlan
            }
            className="rounded-2xl bg-gray-900 px-6 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {saving
              ? 'Saving...'
              : editingId
                ? 'Update Plan'
                : 'Create Plan'}
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

      <section className="rounded-[2rem] bg-white p-5 shadow-xl">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={
              search
            }
            onChange={(
              event,
            ) =>
              setSearch(
                event.target
                  .value,
              )
            }
            placeholder="Search company / policy"
            className="rounded-2xl border border-gray-300 px-4 py-3 text-sm"
          />

          <select
            value={
              companyName
            }
            onChange={(
              event,
            ) =>
              setCompanyName(
                event.target
                  .value,
              )
            }
            className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm"
          >
            <option value="">
              All Companies
            </option>

            {companyOptions.map(
              (
                company,
              ) => (
                <option
                  key={
                    company
                  }
                  value={
                    company
                  }
                >
                  {
                    company
                  }
                </option>
              ),
            )}
          </select>

          <label className="flex items-center gap-3 rounded-2xl border border-gray-300 px-4 py-3">
            <input
              type="checkbox"
              checked={
                activeOnly
              }
              onChange={(
                event,
              ) =>
                setActiveOnly(
                  event.target
                    .checked,
                )
              }
            />

            <span className="text-sm font-bold text-gray-700">
              Active only
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-gray-300 px-4 py-3">
            <input
              type="checkbox"
              checked={
                showHidden
              }
              onChange={(
                event,
              ) =>
                setShowHidden(
                  event.target
                    .checked,
                )
              }
            />

            <span className="text-sm font-bold text-gray-700">
              Hidden Plans
            </span>
          </label>
        </div>

        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() =>
              loadPlans(1)
            }
            className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-black text-white"
          >
            Apply
          </button>

          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCompanyName(
                '',
              );
              setActiveOnly(
                false,
              );
              setShowHidden(
                false,
              );

              setTimeout(
                () =>
                  loadPlans(
                    1,
                  ),
                0,
              );
            }}
            className="rounded-2xl border border-gray-300 px-5 py-3 text-sm font-black text-gray-700"
          >
            Clear
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
        {loading ? (
          <div className="p-10 text-center text-sm font-bold text-gray-500">
            Loading insurance
            plans...
          </div>
        ) : plans.length ===
          0 ? (
          <div className="p-10 text-center">
            <p className="text-lg font-black text-gray-800">
              No insurance plans
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Add the first
              insurer and rate
              plan above.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      'Company',
                      'Policy',
                      'Duration',
                      'Price',
                      'Coverage',
                      'Status',
                      'Actions',
                    ].map(
                      (
                        heading,
                      ) => (
                        <th
                          key={
                            heading
                          }
                          className="px-4 py-4 text-left text-xs font-black uppercase tracking-wide text-gray-500"
                        >
                          {
                            heading
                          }
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {plans.map(
                    (
                      plan,
                    ) => (
                      <tr
                        key={
                          plan.id
                        }
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-4 font-black text-gray-900">
                          {
                            plan.companyName
                          }
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-black text-gray-900">
                            {
                              plan.policyName
                            }
                          </p>

                          {plan.description && (
                            <p className="mt-1 max-w-sm text-xs text-gray-500">
                              {
                                plan.description
                              }
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-bold text-gray-700">
                          {durationLabel(
                            Number(
                              plan.durationMonths,
                            ),
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-black text-gray-900">
                          {formatMoney(
                            plan.price,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-gray-700">
                          {plan.coverageAmount ===
                            undefined ||
                          plan.coverageAmount ===
                            null
                            ? '-'
                            : formatMoney(
                                plan.coverageAmount,
                              )}
                        </td>

                        <td className="px-4 py-4">
                          {plan.isHidden ? (
                            <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-black text-gray-700">
                              Hidden
                            </span>
                          ) : plan.isActive ? (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                              Inactive
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {!plan.isHidden && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    startEditing(
                                      plan,
                                    )
                                  }
                                  className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    hidePlan(
                                      plan.id,
                                    )
                                  }
                                  className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white"
                                >
                                  Hide
                                </button>
                              </>
                            )}

                            {plan.isHidden && (
                              <button
                                type="button"
                                onClick={() =>
                                  restorePlan(
                                    plan.id,
                                  )
                                }
                                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white"
                              >
                                Restore
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 p-4 lg:hidden">
              {plans.map(
                (
                  plan,
                ) => (
                  <div
                    key={
                      plan.id
                    }
                    className="rounded-3xl border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-gray-900">
                          {
                            plan.companyName
                          }
                        </p>

                        <p className="mt-1 text-sm font-bold text-gray-600">
                          {
                            plan.policyName
                          }
                        </p>
                      </div>

                      {plan.isHidden ? (
                        <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-black">
                          Hidden
                        </span>
                      ) : plan.isActive ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-4 text-sm">
                      <div>
                        <p className="text-xs font-bold text-gray-400">
                          Duration
                        </p>

                        <p className="font-black">
                          {durationLabel(
                            Number(
                              plan.durationMonths,
                            ),
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-400">
                          Price
                        </p>

                        <p className="font-black">
                          {formatMoney(
                            plan.price,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-400">
                          Coverage
                        </p>

                        <p className="font-black">
                          {plan.coverageAmount ===
                            undefined ||
                          plan.coverageAmount ===
                            null
                            ? '-'
                            : formatMoney(
                                plan.coverageAmount,
                              )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {!plan.isHidden && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              startEditing(
                                plan,
                              )
                            }
                            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              hidePlan(
                                plan.id,
                              )
                            }
                            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white"
                          >
                            Hide
                          </button>
                        </>
                      )}

                      {plan.isHidden && (
                        <button
                          type="button"
                          onClick={() =>
                            restorePlan(
                              plan.id,
                            )
                          }
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </>
        )}

        {!loading &&
          pagination.totalPages >
            1 && (
            <div className="flex items-center justify-between border-t p-4">
              <p className="text-sm font-bold text-gray-500">
                Page{' '}
                {
                  pagination.page
                }{' '}
                of{' '}
                {
                  pagination.totalPages
                }
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    pagination.page <=
                    1
                  }
                  onClick={() =>
                    loadPlans(
                      pagination.page -
                        1,
                    )
                  }
                  className="rounded-xl border px-4 py-2 text-sm font-black disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    pagination.page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    loadPlans(
                      pagination.page +
                        1,
                    )
                  }
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-black text-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
      </section>
    </main>
  );
}
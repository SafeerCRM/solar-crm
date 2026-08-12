'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type InsuranceRequest = {
  id: number;

  projectId: number;
  customerId: number;

  customerCode?: string;
  customerName?: string;
  customerPhone?: string;

  insurancePlanId?: number;
  existingInsuranceId?: number;

  requestType:
    | 'NEW'
    | 'RENEWAL';

  status:
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'COMPLETED'
    | 'CANCELLED';

  customerRemarks?: string;
  adminRemarks?: string;

  processedBy?: number;
  processedByName?: string;
  processedAt?: string;

  requestedAt: string;
  updatedAt?: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type CompletionForm = {
  policyNumber: string;
  startDate: string;
  expiryDate: string;
  policyCost: string;
  coverageAmount: string;
  companyName: string;
  policyName: string;
  remarks: string;
  insurancePlanId: string;
};

type InsurancePlan = {
  id: number;

  companyName: string;

  policyName: string;

  durationMonths: number;

  price: number;

  coverageAmount?: number;

  isActive: boolean;
};

const emptyPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

const emptyCompletionForm: CompletionForm = {
  policyNumber: '',
  startDate: '',
  expiryDate: '',
  policyCost: '',
  coverageAmount: '',
  companyName: '',
  policyName: '',
  remarks: '',
  insurancePlanId: '',
};

function formatDate(
  value?: string,
) {
  if (!value) {
    return '-';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}

function formatLabel(
  value?: string,
) {
  return String(value || '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function RequestStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    String(status || '')
      .trim()
      .toUpperCase();

  let className =
    'bg-gray-100 text-gray-700';

  if (
    normalized === 'PENDING'
  ) {
    className =
      'bg-amber-100 text-amber-800';
  }

  if (
    normalized === 'APPROVED'
  ) {
    className =
      'bg-blue-100 text-blue-800';
  }

  if (
    normalized === 'REJECTED'
  ) {
    className =
      'bg-red-100 text-red-800';
  }

  if (
    normalized === 'COMPLETED'
  ) {
    className =
      'bg-emerald-100 text-emerald-800';
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${className}`}
    >
      {formatLabel(
        normalized,
      )}
    </span>
  );
}

function RequestTypeBadge({
  requestType,
}: {
  requestType: string;
}) {
  const isRenewal =
    requestType ===
    'RENEWAL';

  return (
    <span
      className={[
        'rounded-full px-3 py-1 text-xs font-black',
        isRenewal
          ? 'bg-violet-100 text-violet-800'
          : 'bg-sky-100 text-sky-800',
      ].join(' ')}
    >
      {isRenewal
        ? 'Renewal'
        : 'New Policy'}
    </span>
  );
}

export default function InsuranceRequestsPage() {
  const [
    items,
    setItems,
  ] =
    useState<
      InsuranceRequest[]
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
    status,
    setStatus,
  ] =
    useState('');

  const [
    requestType,
    setRequestType,
  ] =
    useState('');

  const [
    projectId,
    setProjectId,
  ] =
    useState('');

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    actionLoadingId,
    setActionLoadingId,
  ] =
    useState<
      number | null
    >(null);

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
    completionRequest,
    setCompletionRequest,
  ] =
    useState<
      InsuranceRequest | null
    >(null);

  const [
    completionForm,
    setCompletionForm,
  ] =
    useState(
      emptyCompletionForm,
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
  useState(false);

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

  const loadRequests =
    useCallback(
      async (
        page = 1,
      ) => {
        try {
          setLoading(true);
          setError('');

          const res =
            await axios.get(
              `${API_BASE_URL}/project/insurance/requests`,
              {
                headers:
                  headers(),

                params: {
                  page,
                  limit: 20,

                  search:
                    search ||
                    undefined,

                  status:
                    status ||
                    undefined,

                  requestType:
                    requestType ||
                    undefined,

                  projectId:
                    projectId ||
                    undefined,
                },
              },
            );

          setItems(
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

          setItems([]);

          setError(
            error?.response
              ?.data
              ?.message ||
              'Failed to load insurance requests',
          );
        } finally {
          setLoading(false);
        }
      },
      [
        search,
        status,
        requestType,
        projectId,
      ],
    );

  useEffect(() => {
    loadRequests(1);
  }, []);

  const approveRequest =
    async (
      request: InsuranceRequest,
    ) => {
      const remarks =
        window.prompt(
          'Approval remarks (optional)',
          '',
        );

      if (
        remarks === null
      ) {
        return;
      }

      try {
        setActionLoadingId(
          request.id,
        );

        setError('');
        setSuccess('');

        await axios.patch(
          `${API_BASE_URL}/project/insurance/requests/${request.id}/approve`,
          {
            adminRemarks:
              remarks,
          },
          {
            headers:
              headers(),
          },
        );

        setSuccess(
          'Insurance request approved successfully',
        );

        await loadRequests(
          pagination.page,
        );
      } catch (
        error: any
      ) {
        setError(
          error?.response
            ?.data
            ?.message ||
            'Failed to approve insurance request',
        );
      } finally {
        setActionLoadingId(
          null,
        );
      }
    };

  const rejectRequest =
    async (
      request: InsuranceRequest,
    ) => {
      const remarks =
        window.prompt(
          'Enter rejection reason',
          '',
        );

      if (
        remarks === null
      ) {
        return;
      }

      if (
        !remarks.trim()
      ) {
        setError(
          'Please enter rejection reason',
        );

        return;
      }

      try {
        setActionLoadingId(
          request.id,
        );

        setError('');
        setSuccess('');

        await axios.patch(
          `${API_BASE_URL}/project/insurance/requests/${request.id}/reject`,
          {
            adminRemarks:
              remarks.trim(),
          },
          {
            headers:
              headers(),
          },
        );

        setSuccess(
          'Insurance request rejected successfully',
        );

        await loadRequests(
          pagination.page,
        );
      } catch (
        error: any
      ) {
        setError(
          error?.response
            ?.data
            ?.message ||
            'Failed to reject insurance request',
        );
      } finally {
        setActionLoadingId(
          null,
        );
      }
    };

    const loadInsurancePlans =
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

      setPlans([]);

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

  const openCompletion =
  async (
    request: InsuranceRequest,
  ) => {
    setError('');

    setCompletionRequest(
      request,
    );

    setCompletionForm({
      ...emptyCompletionForm,

      insurancePlanId:
        request.insurancePlanId
          ? String(
              request.insurancePlanId,
            )
          : '',
    });

    await loadInsurancePlans();
  };

  const closeCompletion =
    () => {
      setCompletionRequest(
        null,
      );

      setCompletionForm(
        emptyCompletionForm,
      );
    };

  const completeRequest =
    async () => {
      if (
        !completionRequest
      ) {
        return;
      }

      if (
        !completionForm
          .startDate
      ) {
        setError(
          'Start date is required',
        );

        return;
      }

      if (
        !completionForm
          .expiryDate
      ) {
        setError(
          'Expiry date is required',
        );

        return;
      }

      if (
        completionForm
          .policyCost === ''
      ) {
        setError(
          'Policy cost is required',
        );

        return;
      }

      try {
        setActionLoadingId(
          completionRequest.id,
        );

        setError('');
        setSuccess('');

        const payload = {
          policyNumber:
            completionForm
              .policyNumber
              .trim(),

          startDate:
            completionForm
              .startDate,

          expiryDate:
            completionForm
              .expiryDate,

          policyCost:
            Number(
              completionForm
                .policyCost,
            ),

          coverageAmount:
            completionForm
              .coverageAmount ===
            ''
              ? undefined
              : Number(
                  completionForm
                    .coverageAmount,
                ),

          companyName:
            completionForm
              .companyName
              .trim() ||
            undefined,

          policyName:
            completionForm
              .policyName
              .trim() ||
            undefined,

          remarks:
            completionForm
              .remarks
              .trim(),

          insurancePlanId:
            completionForm
              .insurancePlanId ===
            ''
              ? undefined
              : Number(
                  completionForm
                    .insurancePlanId,
                ),
        };

        if (
          completionRequest
            .requestType ===
          'RENEWAL'
        ) {
          await axios.post(
            `${API_BASE_URL}/project/insurance/requests/${completionRequest.id}/complete-renewal`,
            payload,
            {
              headers:
                headers(),
            },
          );

          setSuccess(
            'Insurance renewal completed successfully',
          );
        } else {
          await axios.post(
            `${API_BASE_URL}/project/insurance/requests/${completionRequest.id}/complete`,
            payload,
            {
              headers:
                headers(),
            },
          );

          setSuccess(
            'Insurance policy created successfully',
          );
        }

        closeCompletion();

        await loadRequests(
          pagination.page,
        );
      } catch (
        error: any
      ) {
        setError(
          error?.response
            ?.data
            ?.message ||
            'Failed to complete insurance request',
        );
      } finally {
        setActionLoadingId(
          null,
        );
      }
    };

  const clearFilters =
    () => {
      setSearch('');
      setStatus('');
      setRequestType('');
      setProjectId('');

      setTimeout(
        () =>
          loadRequests(1),
        0,
      );
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

      <section className="rounded-[2rem] bg-gradient-to-r from-violet-700 via-indigo-600 to-blue-600 p-6 text-white shadow-2xl">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-white/75">
          Insurance Workflow
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Requests & Renewals
        </h1>

        <p className="mt-2 max-w-3xl text-sm font-semibold text-white/85">
          Review new insurance
          requests, approve or
          reject them, and
          complete approved
          policies or renewals.
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
            Filters
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Filter by customer,
            request type, status
            or project.
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input
            value={search}
            onChange={(
              event,
            ) =>
              setSearch(
                event.target
                  .value,
              )
            }
            placeholder="Customer / phone / K number"
            className="rounded-2xl border border-gray-300 px-4 py-3 text-sm"
          />

          <input
            value={
              projectId
            }
            onChange={(
              event,
            ) =>
              setProjectId(
                event.target
                  .value,
              )
            }
            placeholder="Project ID"
            inputMode="numeric"
            className="rounded-2xl border border-gray-300 px-4 py-3 text-sm"
          />

          <select
            value={
              requestType
            }
            onChange={(
              event,
            ) =>
              setRequestType(
                event.target
                  .value,
              )
            }
            className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm"
          >
            <option value="">
              All Request Types
            </option>

            <option value="NEW">
              New Insurance
            </option>

            <option value="RENEWAL">
              Renewal
            </option>
          </select>

          <select
            value={
              status
            }
            onChange={(
              event,
            ) =>
              setStatus(
                event.target
                  .value,
              )
            }
            className="rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm"
          >
            <option value="">
              All Status
            </option>

            <option value="PENDING">
              Pending
            </option>

            <option value="APPROVED">
              Approved
            </option>

            <option value="REJECTED">
              Rejected
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              loadRequests(1)
            }
            className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-black text-white"
          >
            Apply
          </button>

          <button
            type="button"
            onClick={
              clearFilters
            }
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
            requests...
          </div>
        ) : items.length ===
          0 ? (
          <div className="p-10 text-center">
            <p className="text-lg font-black text-gray-800">
              No insurance
              requests found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              There are no
              matching new policy
              or renewal requests.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      'Customer',
                      'Project',
                      'Type',
                      'Request Date',
                      'Remarks',
                      'Status',
                      'Processed',
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
                  {items.map(
                    (
                      item,
                    ) => (
                      <tr
                        key={
                          item.id
                        }
                        className="align-top hover:bg-gray-50"
                      >
                        <td className="px-4 py-4">
                          <p className="font-black text-gray-900">
                            {item.customerName ||
                              '-'}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-gray-500">
                            {item.customerPhone ||
                              '-'}
                          </p>

                          {item.customerCode && (
                            <p className="mt-1 text-xs text-gray-400">
                              {
                                item.customerCode
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <Link
                            href={`/project/${item.projectId}`}
                            className="font-black text-blue-700 hover:underline"
                          >
                            #
                            {
                              item.projectId
                            }
                          </Link>

                          {item.existingInsuranceId && (
                            <p className="mt-1 text-xs text-gray-400">
                              Existing Insurance #
                              {
                                item.existingInsuranceId
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <RequestTypeBadge
                            requestType={
                              item.requestType
                            }
                          />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-700">
                          {formatDate(
                            item.requestedAt,
                          )}
                        </td>

                        <td className="max-w-xs px-4 py-4">
                          <p className="text-sm text-gray-700">
                            {item.customerRemarks ||
                              '-'}
                          </p>

                          {item.adminRemarks && (
                            <p className="mt-2 text-xs font-semibold text-gray-500">
                              Admin:{' '}
                              {
                                item.adminRemarks
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <RequestStatusBadge
                            status={
                              item.status
                            }
                          />
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-600">
                          {item.processedByName ? (
                            <>
                              <p className="font-bold">
                                {
                                  item.processedByName
                                }
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                {formatDate(
                                  item.processedAt,
                                )}
                              </p>
                            </>
                          ) : (
                            '-'
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {item.status ===
                              'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  disabled={
                                    actionLoadingId ===
                                    item.id
                                  }
                                  onClick={() =>
                                    approveRequest(
                                      item,
                                    )
                                  }
                                  className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
                                >
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    actionLoadingId ===
                                    item.id
                                  }
                                  onClick={() =>
                                    rejectRequest(
                                      item,
                                    )
                                  }
                                  className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {item.status ===
                              'APPROVED' && (
                              <button
                                type="button"
                                onClick={() =>
                                  openCompletion(
                                    item,
                                  )
                                }
                                className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
                              >
                                {item.requestType ===
                                'RENEWAL'
                                  ? 'Complete Renewal'
                                  : 'Create Policy'}
                              </button>
                            )}

                            {item.status ===
                              'COMPLETED' && (
                              <Link
                                href={`/customer-portal-management/insurance?projectId=${item.projectId}`}
                                className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-black text-white"
                              >
                                View Policy
                              </Link>
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
              {items.map(
                (
                  item,
                ) => (
                  <div
                    key={
                      item.id
                    }
                    className="rounded-3xl border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-gray-900">
                          {item.customerName ||
                            '-'}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.customerPhone ||
                            '-'}
                        </p>
                      </div>

                      <RequestStatusBadge
                        status={
                          item.status
                        }
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <RequestTypeBadge
                        requestType={
                          item.requestType
                        }
                      />

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700">
                        Project #
                        {
                          item.projectId
                        }
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                      <p className="text-xs font-black uppercase text-gray-400">
                        Requested
                      </p>

                      <p className="mt-1 text-sm font-bold text-gray-700">
                        {formatDate(
                          item.requestedAt,
                        )}
                      </p>

                      {item.customerRemarks && (
                        <p className="mt-3 text-sm text-gray-700">
                          {
                            item.customerRemarks
                          }
                        </p>
                      )}

                      {item.adminRemarks && (
                        <p className="mt-3 text-xs font-semibold text-gray-500">
                          Admin:{' '}
                          {
                            item.adminRemarks
                          }
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.status ===
                        'PENDING' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              approveRequest(
                                item,
                              )
                            }
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white"
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              rejectRequest(
                                item,
                              )
                            }
                            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {item.status ===
                        'APPROVED' && (
                        <button
                          type="button"
                          onClick={() =>
                            openCompletion(
                              item,
                            )
                          }
                          className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white"
                        >
                          {item.requestType ===
                          'RENEWAL'
                            ? 'Complete Renewal'
                            : 'Create Policy'}
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
                    loadRequests(
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
                    loadRequests(
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

      {completionRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-gray-400">
                  {completionRequest.requestType ===
                  'RENEWAL'
                    ? 'Complete Renewal'
                    : 'Create Insurance Policy'}
                </p>

                <h2 className="mt-1 text-2xl font-black text-gray-900">
                  {completionRequest.customerName ||
                    `Project #${completionRequest.projectId}`}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Project #
                  {
                    completionRequest.projectId
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeCompletion
                }
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-black"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-black uppercase text-gray-500">
                  Policy Number
                </span>

                <input
                  value={
                    completionForm.policyNumber
                  }
                  onChange={(
                    event,
                  ) =>
                    setCompletionForm({
                      ...completionForm,
                      policyNumber:
                        event.target
                          .value,
                    })
                  }
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
                  placeholder="Policy number"
                />
              </label>

              <label className="space-y-1">
  <span className="text-xs font-black uppercase text-gray-500">
    Insurance Plan
  </span>

  <select
    disabled={
      loadingPlans
    }
    value={
      completionForm.insurancePlanId
    }
    onChange={(
      event,
    ) => {
      const value =
        event.target
          .value;

      const selectedPlan =
        plans.find(
          (plan) =>
            String(
              plan.id,
            ) ===
            value,
        );

      setCompletionForm({
        ...completionForm,

        insurancePlanId:
          value,

        companyName:
          selectedPlan
            ?.companyName ||
          completionForm
            .companyName,

        policyName:
          selectedPlan
            ?.policyName ||
          completionForm
            .policyName,

        policyCost:
          selectedPlan
            ? String(
                selectedPlan.price ??
                  '',
              )
            : completionForm
                .policyCost,

        coverageAmount:
          selectedPlan
            ?.coverageAmount ===
            undefined ||
          selectedPlan
            ?.coverageAmount ===
            null
            ? completionForm
                .coverageAmount
            : String(
                selectedPlan
                  .coverageAmount,
              ),
      });
    }}
    className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm"
  >
    <option value="">
      Manual / Custom Policy
    </option>

    {plans.map(
      (plan) => (
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
          {plan.durationMonths /
            12}{' '}
          Year
          {plan.durationMonths ===
          12
            ? ''
            : 's'}{' '}
          — ₹
          {Number(
            plan.price ||
              0,
          ).toLocaleString(
            'en-IN',
          )}
        </option>
      ),
    )}
  </select>
</label>

              <label className="space-y-1">
                <span className="text-xs font-black uppercase text-gray-500">
                  Start Date
                </span>

                <input
                  type="date"
                  value={
                    completionForm.startDate
                  }
                  onChange={(
                    event,
                  ) =>
                    setCompletionForm({
                      ...completionForm,
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
                    completionForm.expiryDate
                  }
                  onChange={(
                    event,
                  ) =>
                    setCompletionForm({
                      ...completionForm,
                      expiryDate:
                        event.target
                          .value,
                    })
                  }
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
                />
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
                    completionForm.policyCost
                  }
                  onChange={(
                    event,
                  ) =>
                    setCompletionForm({
                      ...completionForm,
                      policyCost:
                        event.target
                          .value,
                    })
                  }
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
                  placeholder="0"
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
                    completionForm.coverageAmount
                  }
                  onChange={(
                    event,
                  ) =>
                    setCompletionForm({
                      ...completionForm,
                      coverageAmount:
                        event.target
                          .value,
                    })
                  }
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
                  placeholder="Optional"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-black uppercase text-gray-500">
                  Company Name
                </span>

                <input
                  value={
                    completionForm.companyName
                  }
                  onChange={(
                    event,
                  ) =>
                    setCompletionForm({
                      ...completionForm,
                      companyName:
                        event.target
                          .value,
                    })
                  }
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
                  placeholder="Leave empty to use selected plan"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-black uppercase text-gray-500">
                  Policy Name
                </span>

                <input
                  value={
                    completionForm.policyName
                  }
                  onChange={(
                    event,
                  ) =>
                    setCompletionForm({
                      ...completionForm,
                      policyName:
                        event.target
                          .value,
                    })
                  }
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
                  placeholder="Leave empty to use selected plan"
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
                  completionForm.remarks
                }
                onChange={(
                  event,
                ) =>
                  setCompletionForm({
                    ...completionForm,
                    remarks:
                      event.target
                        .value,
                  })
                }
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
              />
            </label>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={
                  closeCompletion
                }
                className="rounded-2xl border border-gray-300 px-5 py-3 text-sm font-black text-gray-700"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  actionLoadingId ===
                  completionRequest.id
                }
                onClick={
                  completeRequest
                }
                className="rounded-2xl bg-gray-900 px-6 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                {actionLoadingId ===
                completionRequest.id
                  ? 'Saving...'
                  : completionRequest.requestType ===
                      'RENEWAL'
                    ? 'Complete Renewal'
                    : 'Create Policy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
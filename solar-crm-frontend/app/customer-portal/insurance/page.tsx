'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

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
};

type InsuranceRecord = {
  id: number;

  projectId: number;
  customerId: number;

  customerCode?: string;
  customerName?: string;
  customerPhone?: string;

  companyName: string;
  policyName: string;
  policyNumber?: string;

  policyCost: number;
  coverageAmount?: number;

  startDate: string;
  expiryDate: string;

  status: string;

  insurancePlanId?: number;
  previousInsuranceId?: number;

  remarks?: string;
};

type InsuranceRequest = {
  id: number;
  projectId: number;
  insurancePlanId?: number;
  existingInsuranceId?: number;

  requestType:
    | 'NEW'
    | 'RENEWAL';

  status: string;

  customerRemarks?: string;

  requestedAt?: string;
};

type CompletedProject = {
  id: number;

  customerName?: string;
  customerPhone?: string;

  branchName?: string;
  city?: string;

  projectSize?: string;
  structureCapacityKw?: string;

  status?: string;
};

type InsuranceDocument = {
  id: number;

  documentType: string;

  fileName: string;
  fileUrl: string;

  mimeType?: string;

  visibleToCustomer: boolean;

  createdAt?: string;
};

type InsuranceOverview = {
  eligible: boolean;

  message?: string;

  projects: CompletedProject[];

  activeInsurance:
    InsuranceRecord[];

  history:
    InsuranceRecord[];

  pendingRequests:
    InsuranceRequest[];
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
    },
  ).format(date);
}

function formatLabel(
  value?: string,
) {
  return String(
    value || '',
  )
    .replaceAll(
      '_',
      ' ',
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
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

function StatusBadge({
  status,
}: {
  status?: string;
}) {
  const normalized =
    String(
      status || '',
    ).toUpperCase();

  let className =
    'bg-gray-100 text-gray-700';

  if (
    normalized === 'ACTIVE'
  ) {
    className =
      'bg-emerald-100 text-emerald-800';
  }

  if (
    normalized === 'EXPIRED'
  ) {
    className =
      'bg-red-100 text-red-800';
  }

  if (
    normalized ===
    'RENEWAL_REQUESTED'
  ) {
    className =
      'bg-amber-100 text-amber-800';
  }

  if (
    normalized === 'RENEWED'
  ) {
    className =
      'bg-blue-100 text-blue-800';
  }

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
    normalized === 'COMPLETED'
  ) {
    className =
      'bg-emerald-100 text-emerald-800';
  }

  if (
    normalized === 'REJECTED'
  ) {
    className =
      'bg-red-100 text-red-800';
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${className}`}
    >
      {formatLabel(
        normalized,
      )}
    </span>
  );
}

const compressImageFile =
  async (
    file: File,
  ): Promise<File> => {
    if (
      !file.type.startsWith(
        'image/',
      )
    ) {
      return file;
    }

    if (
      file.size <=
      1024 * 1024
    ) {
      return file;
    }

    return new Promise(
      (resolve) => {
        const img =
          new Image();

        const url =
          URL.createObjectURL(
            file,
          );

        img.onload =
          () => {
            const maxWidth =
              1600;

            const scale =
              Math.min(
                1,
                maxWidth /
                  img.width,
              );

            const canvas =
              document.createElement(
                'canvas',
              );

            canvas.width =
              Math.round(
                img.width *
                  scale,
              );

            canvas.height =
              Math.round(
                img.height *
                  scale,
              );

            const ctx =
              canvas.getContext(
                '2d',
              );

            if (!ctx) {
              URL.revokeObjectURL(
                url,
              );

              resolve(file);

              return;
            }

            ctx.drawImage(
              img,
              0,
              0,
              canvas.width,
              canvas.height,
            );

            canvas.toBlob(
              (blob) => {
                URL.revokeObjectURL(
                  url,
                );

                if (
                  !blob
                ) {
                  resolve(
                    file,
                  );

                  return;
                }

                resolve(
                  new File(
                    [
                      blob,
                    ],

                    file.name.replace(
                      /\.(png|jpg|jpeg|webp)$/i,
                      '.jpg',
                    ),

                    {
                      type:
                        'image/jpeg',

                      lastModified:
                        Date.now(),
                    },
                  ),
                );
              },

              'image/jpeg',

              0.78,
            );
          };

        img.onerror =
          () => {
            URL.revokeObjectURL(
              url,
            );

            resolve(
              file,
            );
          };

        img.src =
          url;
      },
    );
  };

export default function CustomerInsurancePage() {
  const [
    overview,
    setOverview,
  ] =
    useState<
      InsuranceOverview | null
    >(null);

  const [
    plans,
    setPlans,
  ] =
    useState<
      InsurancePlan[]
    >([]);

  const [
    documents,
    setDocuments,
  ] =
    useState<
      Record<
        number,
        InsuranceDocument[]
      >
    >({});

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    loadingPlans,
    setLoadingPlans,
  ] =
    useState(true);

  const [
    submitting,
    setSubmitting,
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
    selectedProjectId,
    setSelectedProjectId,
  ] =
    useState('');

  const [
    selectedPlanId,
    setSelectedPlanId,
  ] =
    useState('');

  const [
    requestRemarks,
    setRequestRemarks,
  ] =
    useState('');


  const token = () =>
    localStorage.getItem(
      'customer_token',
    );

  const headers = () => ({
    Authorization:
      `Bearer ${token()}`,
  });

  const loadOverview =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError('');

          const response =
            await fetch(
              `${API_BASE_URL}/customer-auth/insurance/my`,
              {
                headers:
                  headers(),
              },
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              Array.isArray(
                data?.message,
              )
                ? data.message.join(
                    ', ',
                  )
                : data?.message ||
                  'Failed to load insurance',
            );
          }

          setOverview(
            data,
          );

          if (
            !selectedProjectId &&
            data?.projects?.length
          ) {
            setSelectedProjectId(
              String(
                data.projects[0]
                  .id,
              ),
            );
          }
        } catch (
          error: any
        ) {
          console.error(
            error,
          );

          setError(
            error?.message ||
            'Failed to load insurance',
          );
        } finally {
          setLoading(false);
        }
      },
      [
        selectedProjectId,
      ],
    );

  const loadPlans =
    useCallback(
      async () => {
        try {
          setLoadingPlans(
            true,
          );

          const response =
            await fetch(
              `${API_BASE_URL}/customer-auth/insurance/plans`,
              {
                headers:
                  headers(),
              },
            );

          const data =
            await response.json();

          if (!response.ok) {
            if (
              response.status ===
              400
            ) {
              setPlans([]);
              return;
            }

            throw new Error(
              data?.message ||
              'Failed to load insurance plans',
            );
          }

          setPlans(
            Array.isArray(
              data,
            )
              ? data
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
            error?.message ||
            'Failed to load insurance plans',
          );
        } finally {
          setLoadingPlans(
            false,
          );
        }
      },
      [],
    );

  useEffect(() => {
    const customerToken =
      token();

    if (!customerToken) {
      window.location.href =
        '/customer-login';

      return;
    }

    loadOverview();
    loadPlans();
  }, []);

  const pendingRequestForProject =
    useMemo(
      () => {
        if (
          !overview ||
          !selectedProjectId
        ) {
          return null;
        }

        return overview
          .pendingRequests
          ?.find(
            (request) =>
              Number(
                request.projectId,
              ) ===
                Number(
                  selectedProjectId,
                ) &&
              (
                request.status ===
                  'PENDING' ||
                request.status ===
                  'APPROVED'
              ),
          );
      },
      [
        overview,
        selectedProjectId,
      ],
    );

  const selectedPlan =
    useMemo(
      () =>
        plans.find(
          (plan) =>
            String(
              plan.id,
            ) ===
            selectedPlanId,
        ) ||
        null,
      [
        plans,
        selectedPlanId,
      ],
    );

  const submitNewInsuranceRequest =
    async () => {
      if (
        !selectedProjectId
      ) {
        setError(
          'Please select a completed project',
        );

        return;
      }

      if (
        !selectedPlanId
      ) {
        setError(
          'Please select an insurance plan',
        );

        return;
      }

      try {
        setSubmitting(
          true,
        );

        setError('');
        setSuccess('');

        const response =
          await fetch(
            `${API_BASE_URL}/customer-auth/insurance/request`,
            {
              method: 'POST',

              headers: {
                ...headers(),

                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify(
                  {
                    projectId:
                      Number(
                        selectedProjectId,
                      ),

                    insurancePlanId:
                      Number(
                        selectedPlanId,
                      ),

                    customerRemarks:
                      requestRemarks.trim(),
                  },
                ),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            Array.isArray(
              data?.message,
            )
              ? data.message.join(
                  ', ',
                )
              : data?.message ||
                'Failed to submit insurance request',
          );
        }

        setSuccess(
          data?.message ||
          'Insurance request submitted successfully',
        );

        setSelectedPlanId(
          '',
        );

        setRequestRemarks(
          '',
        );

        await loadOverview();
      } catch (
        error: any
      ) {
        console.error(
          error,
        );

        setError(
          error?.message ||
          'Failed to submit insurance request',
        );
      } finally {
        setSubmitting(
          false,
        );
      }
    };

  const submitRenewal =
    async (
      insurance:
        InsuranceRecord,
    ) => {
      const confirmed =
        window.confirm(
          `Submit renewal request for ${insurance.companyName} ${insurance.policyName}?`,
        );

      if (!confirmed) {
        return;
      }

      try {
        setSubmitting(
          true,
        );

        setError('');
        setSuccess('');

        const response =
          await fetch(
            `${API_BASE_URL}/customer-auth/insurance/${insurance.id}/renew`,
            {
              method: 'POST',

              headers: {
                ...headers(),

                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify(
                  {
                    insurancePlanId:
                      insurance
                        .insurancePlanId ||
                      undefined,

                    customerRemarks:
                      'Renewal requested from customer portal',
                  },
                ),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            Array.isArray(
              data?.message,
            )
              ? data.message.join(
                  ', ',
                )
              : data?.message ||
                'Failed to submit renewal request',
          );
        }

        setSuccess(
          data?.message ||
          'Renewal request submitted successfully',
        );

        await loadOverview();
      } catch (
        error: any
      ) {
        console.error(
          error,
        );

        setError(
          error?.message ||
          'Failed to submit renewal request',
        );
      } finally {
        setSubmitting(
          false,
        );
      }
    };

  const loadDocuments =
    async (
      insuranceId: number,
    ) => {
      if (
        documents[
          insuranceId
        ]
      ) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/customer-auth/insurance/${insuranceId}/documents`,
            {
              headers:
                headers(),
            },
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
            'Failed to load policy documents',
          );
        }

        setDocuments(
          (previous) => ({
            ...previous,

            [insuranceId]:
              Array.isArray(
                data,
              )
                ? data
                : [],
          }),
        );
      } catch (
        error: any
      ) {
        console.error(
          error,
        );

        setError(
          error?.message ||
          'Failed to load policy documents',
        );
      }
    };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50 p-4">
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="text-4xl">
            🛡️
          </div>

          <p className="mt-3 font-black text-gray-700">
            Loading insurance...
          </p>
        </div>
      </main>
    );
  }

  if (
    !overview?.eligible
  ) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50 p-4">
        <div className="mx-auto max-w-3xl">
          <a
            href="/customer-portal"
            className="inline-flex rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white"
          >
            ← Customer Dashboard
          </a>

          <div className="mt-5 rounded-[2rem] bg-white p-8 text-center shadow-xl">
            <div className="text-5xl">
              🛡️
            </div>

            <h1 className="mt-4 text-2xl font-black text-gray-900">
              Insurance
            </h1>

            <p className="mt-3 text-sm font-semibold leading-6 text-gray-500">
              {overview
                ?.message ||
                'Insurance becomes available after your solar project is completed.'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const activeInsurance =
    overview
      ?.activeInsurance ||
    [];

  const history =
    overview?.history ||
    [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50 pb-24">
      <div className="mx-auto max-w-7xl space-y-5 p-4 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href="/customer-portal"
            className="rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white"
          >
            ← Customer Dashboard
          </a>

          <button
            type="button"
            onClick={() => {
              loadOverview();
              loadPlans();
            }}
            className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-700"
          >
            Refresh
          </button>
        </div>

        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-500 p-6 text-white shadow-2xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-white/75">
            After-Sales Protection
          </p>

          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            Solar Insurance
          </h1>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
            View your insurance
            policy, documents,
            available plans and
            renewal status.
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

        {activeInsurance.length >
          0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                My Insurance
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Current active
                insurance linked to
                your completed
                project.
              </p>
            </div>

            {activeInsurance.map(
              (
                insurance,
              ) => (
                <div
                  key={
                    insurance.id
                  }
                  className="overflow-hidden rounded-[2rem] bg-white shadow-xl"
                >
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-white/75">
                          Project #
                          {
                            insurance.projectId
                          }
                        </p>

                        <h3 className="mt-1 text-2xl font-black">
                          {
                            insurance.companyName
                          }
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-white/90">
                          {
                            insurance.policyName
                          }
                        </p>
                      </div>

                      <StatusBadge
                        status={
                          insurance.status
                        }
                      />
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoBox
                        label="Policy Number"
                        value={
                          insurance.policyNumber ||
                          'Not available'
                        }
                      />

                      <InfoBox
                        label="Policy Cost"
                        value={
                          formatMoney(
                            insurance.policyCost,
                          )
                        }
                      />

                      <InfoBox
                        label="Start Date"
                        value={
                          formatDate(
                            insurance.startDate,
                          )
                        }
                      />

                      <InfoBox
                        label="Expiry Date"
                        value={
                          formatDate(
                            insurance.expiryDate,
                          )
                        }
                      />

                      {insurance.coverageAmount !==
                        undefined &&
                        insurance.coverageAmount !==
                          null && (
                          <InfoBox
                            label="Coverage"
                            value={
                              formatMoney(
                                insurance.coverageAmount,
                              )
                            }
                          />
                        )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          loadDocuments(
                            insurance.id,
                          )
                        }
                        className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
                      >
                        View Policy Documents
                      </button>

                      {insurance.status !==
                        'RENEWAL_REQUESTED' && (
                        <button
                          type="button"
                          disabled={
                            submitting
                          }
                          onClick={() =>
                            submitRenewal(
                              insurance,
                            )
                          }
                          className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                        >
                          Request Renewal
                        </button>
                      )}
                    </div>

                    {insurance.status ===
                      'RENEWAL_REQUESTED' && (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                        Your renewal
                        request is
                        already under
                        processing.
                      </div>
                    )}

                    {documents[
                      insurance.id
                    ] && (
                      <div className="mt-5">
                        <h4 className="font-black text-gray-900">
                          Policy
                          Documents
                        </h4>

                        {documents[
                          insurance.id
                        ].length ===
                        0 ? (
                          <p className="mt-2 text-sm text-gray-500">
                            No
                            customer-visible
                            policy
                            documents
                            have been
                            uploaded
                            yet.
                          </p>
                        ) : (
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            {documents[
                              insurance.id
                            ].map(
                              (
                                document,
                              ) => (
                                <a
                                  key={
                                    document.id
                                  }
                                  href={
                                    document.fileUrl
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:bg-blue-50"
                                >
                                  <p className="text-xs font-black uppercase text-blue-600">
                                    {formatLabel(
                                      document.documentType,
                                    )}
                                  </p>

                                  <p className="mt-2 break-all font-black text-gray-900">
                                    {
                                      document.fileName
                                    }
                                  </p>

                                  <p className="mt-2 text-xs text-gray-400">
                                    {formatDate(
                                      document.createdAt,
                                    )}
                                  </p>
                                </a>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
          </section>
        )}

        {activeInsurance.length ===
          0 && (
          <section className="rounded-[2rem] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black text-gray-900">
              Get Insurance
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select your
              completed solar
              project and an
              available insurance
              plan.
            </p>

            {pendingRequestForProject ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-amber-900">
                      Insurance
                      Request Already
                      Submitted
                    </p>

                    <p className="mt-1 text-sm font-semibold text-amber-700">
                      Your request is
                      currently{' '}
                      {formatLabel(
                        pendingRequestForProject.status,
                      )}
                      .
                    </p>
                  </div>

                  <StatusBadge
                    status={
                      pendingRequestForProject.status
                    }
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-black uppercase text-gray-500">
                      Completed Project
                    </span>

                    <select
                      value={
                        selectedProjectId
                      }
                      onChange={(
                        event,
                      ) =>
                        setSelectedProjectId(
                          event.target
                            .value,
                        )
                      }
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm"
                    >
                      <option value="">
                        Select Project
                      </option>

                      {overview.projects.map(
                        (
                          project,
                        ) => (
                          <option
                            key={
                              project.id
                            }
                            value={
                              project.id
                            }
                          >
                            Project #
                            {
                              project.id
                            }{' '}
                            —{' '}
                            {project.projectSize ||
                              project.structureCapacityKw ||
                              project.city ||
                              'Completed Solar Project'}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs font-black uppercase text-gray-500">
                      Insurance Plan
                    </span>

                    <select
                      value={
                        selectedPlanId
                      }
                      onChange={(
                        event,
                      ) =>
                        setSelectedPlanId(
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        loadingPlans
                      }
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm"
                    >
                      <option value="">
                        Select Insurance Plan
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

                {selectedPlan && (
                  <div className="mt-4 rounded-3xl border border-blue-200 bg-blue-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-blue-900">
                          {
                            selectedPlan.companyName
                          }
                        </p>

                        <p className="mt-1 font-bold text-blue-700">
                          {
                            selectedPlan.policyName
                          }
                        </p>
                      </div>

                      <p className="text-xl font-black text-blue-900">
                        {formatMoney(
                          selectedPlan.price,
                        )}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <InfoBox
                        label="Duration"
                        value={
                          durationLabel(
                            Number(
                              selectedPlan.durationMonths,
                            ),
                          )
                        }
                      />

                      <InfoBox
                        label="Coverage"
                        value={
                          selectedPlan.coverageAmount ===
                            undefined ||
                          selectedPlan.coverageAmount ===
                            null
                            ? 'As per policy'
                            : formatMoney(
                                selectedPlan.coverageAmount,
                              )
                        }
                      />
                    </div>

                    {selectedPlan.description && (
                      <p className="mt-4 text-sm font-semibold leading-6 text-blue-800">
                        {
                          selectedPlan.description
                        }
                      </p>
                    )}

                    {selectedPlan.benefits && (
                      <div className="mt-4 rounded-2xl bg-white/70 p-4">
                        <p className="text-xs font-black uppercase text-blue-500">
                          Benefits
                        </p>

                        <p className="mt-2 whitespace-pre-line text-sm font-semibold text-gray-700">
                          {
                            selectedPlan.benefits
                          }
                        </p>
                      </div>
                    )}

                    {selectedPlan.terms && (
                      <div className="mt-3 rounded-2xl bg-white/70 p-4">
                        <p className="text-xs font-black uppercase text-gray-500">
                          Terms
                        </p>

                        <p className="mt-2 whitespace-pre-line text-sm text-gray-600">
                          {
                            selectedPlan.terms
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <textarea
                  value={
                    requestRemarks
                  }
                  onChange={(
                    event,
                  ) =>
                    setRequestRemarks(
                      event.target
                        .value,
                    )
                  }
                  rows={3}
                  placeholder="Optional message for the insurance team"
                  className="mt-4 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm"
                />

                <button
                  type="button"
                  disabled={
                    submitting ||
                    !selectedProjectId ||
                    !selectedPlanId
                  }
                  onClick={
                    submitNewInsuranceRequest
                  }
                  className="mt-4 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  {submitting
                    ? 'Submitting...'
                    : 'Submit Insurance Request'}
                </button>
              </>
            )}
          </section>
        )}

        {plans.length >
          0 && (
          <section className="rounded-[2rem] bg-white p-6 shadow-xl">
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                Available Plans
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Insurance
                options currently
                available for
                completed solar
                projects.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {plans.map(
                (
                  plan,
                ) => (
                  <div
                    key={
                      plan.id
                    }
                    className="rounded-3xl border border-gray-200 p-5"
                  >
                    <p className="text-sm font-black text-indigo-600">
                      {
                        plan.companyName
                      }
                    </p>

                    <h3 className="mt-1 text-xl font-black text-gray-900">
                      {
                        plan.policyName
                      }
                    </h3>

                    <p className="mt-3 text-2xl font-black text-emerald-700">
                      {formatMoney(
                        plan.price,
                      )}
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-500">
                      {durationLabel(
                        Number(
                          plan.durationMonths,
                        ),
                      )}
                    </p>

                    {plan.description && (
                      <p className="mt-3 text-sm leading-6 text-gray-600">
                        {
                          plan.description
                        }
                      </p>
                    )}
                  </div>
                ),
              )}
            </div>
          </section>
        )}

        {history.length >
          0 && (
          <section className="rounded-[2rem] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black text-gray-900">
              Policy History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Previous and renewed
              policies remain
              available for your
              records.
            </p>

            <div className="mt-5 space-y-3">
              {history.map(
                (
                  item,
                ) => (
                  <div
                    key={
                      item.id
                    }
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-gray-900">
                            {
                              item.companyName
                            }{' '}
                            —{' '}
                            {
                              item.policyName
                            }
                          </p>

                          <StatusBadge
                            status={
                              item.status
                            }
                          />
                        </div>

                        <p className="mt-2 text-sm font-semibold text-gray-500">
                          {formatDate(
                            item.startDate,
                          )}{' '}
                          →{' '}
                          {formatDate(
                            item.expiryDate,
                          )}
                        </p>

                        {item.policyNumber && (
                          <p className="mt-1 text-xs text-gray-400">
                            Policy:{' '}
                            {
                              item.policyNumber
                            }
                          </p>
                        )}
                      </div>

                      <p className="font-black text-gray-900">
                        {formatMoney(
                          item.policyCost,
                        )}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-black text-gray-800">
        {value}
      </p>
    </div>
  );
}
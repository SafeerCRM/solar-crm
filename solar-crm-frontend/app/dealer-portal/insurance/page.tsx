'use client';

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type TabType =
  | 'PLANS'
  | 'APPLICATION'
  | 'HISTORY'
  | 'POLICIES';

type DocumentKey =
  | 'AADHAAR_CARD'
  | 'PAN_CARD'
  | 'PROJECT_INVOICE';

const emptyForm = {
  insurancePlanId: '',
  customerName: '',
  customerEmail: '',
  aadhaarLinkedMobile: '',
  customerPhone: '',
  installationAddress: '',
  city: '',
  customerRemarks: '',
};

export default function DealerInsurancePage() {
  const [tab, setTab] =
    useState<TabType>('PLANS');

  const [plans, setPlans] =
    useState<any[]>([]);

  const [requests, setRequests] =
    useState<any[]>([]);

    const [policies, setPolicies] =
  useState<any[]>([]);

  const [
  policyDocuments,
  setPolicyDocuments,
] = useState<
  Record<
    number,
    any[]
  >
>({});

const [
  loadingPolicyDocuments,
  setLoadingPolicyDocuments,
] = useState<
  number | null
>(null);

  const [selectedPlan, setSelectedPlan] =
    useState<any>(null);

  const [activeRequest, setActiveRequest] =
    useState<any>(null);

  const [requestDetail, setRequestDetail] =
    useState<any>(null);

  const [form, setForm] =
    useState(emptyForm);

  const [files, setFiles] =
    useState<
      Partial<
        Record<
          DocumentKey,
          File
        >
      >
    >({});

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [
    uploadingDocument,
    setUploadingDocument,
  ] = useState('');

  const [message, setMessage] =
    useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const getToken = () => {
    const token =
      localStorage.getItem(
        'dealer_token',
      );

    if (!token) {
      window.location.href =
        '/dealer-login';

      return '';
    }

    return token;
  };

  const authHeaders = () => ({
    Authorization:
      `Bearer ${getToken()}`,
  });

  const loadInitialData =
    async () => {
      try {
        setLoading(true);

        await Promise.all([
  loadPlans(),
  loadRequests(),
  loadPolicies(),
]);
      } finally {
        setLoading(false);
      }
    };

  const loadPlans = async () => {
    try {
      const res =
        await fetch(
          `${API_BASE_URL}/dealer-auth/insurance/plans`,
          {
            headers:
              authHeaders(),
          },
        );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message ||
            'Unable to load insurance plans',
        );
      }

      setPlans(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (error) {
      console.error(error);
    }
  };

  const loadRequests =
    async () => {
      try {
        const res =
          await fetch(
            `${API_BASE_URL}/dealer-auth/insurance/requests?limit=100`,
            {
              headers:
                authHeaders(),
            },
          );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data?.message ||
              'Unable to load applications',
          );
        }

        setRequests(
          Array.isArray(
            data?.data,
          )
            ? data.data
            : [],
        );
      } catch (error) {
        console.error(error);
      }
    };

    const loadPolicies =
  async () => {
    try {
      const res =
        await fetch(
          `${API_BASE_URL}/dealer-auth/insurance/policies?limit=100`,
          {
            headers:
              authHeaders(),
          },
        );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message ||
            'Unable to load insurance policies',
        );
      }

      setPolicies(
        Array.isArray(
          data?.data,
        )
          ? data.data
          : [],
      );
    } catch (error) {
      console.error(
        error,
      );
    }
  };

  const loadPolicyDocuments =
  async (
    insuranceId: number,
  ) => {
    try {
      setLoadingPolicyDocuments(
        insuranceId,
      );

      setMessage('');

      const res =
        await fetch(
          `${API_BASE_URL}/dealer-auth/insurance/policies/${insuranceId}/documents`,
          {
            headers:
              authHeaders(),
          },
        );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message ||
            'Unable to load policy documents',
        );
      }

      setPolicyDocuments(
        (prev) => ({
          ...prev,

          [insuranceId]:
            Array.isArray(
              data?.documents,
            )
              ? data.documents
              : [],
        }),
      );
    } catch (
      error: any
    ) {
      console.error(
        error,
      );

      setMessage(
        error?.message ||
          'Unable to load policy documents.',
      );
    } finally {
      setLoadingPolicyDocuments(
        null,
      );
    }
  };

  const loadRequestDetail =
    async (
      requestId: number,
    ) => {
      try {
        setMessage('');

        const res =
          await fetch(
            `${API_BASE_URL}/dealer-auth/insurance/requests/${requestId}`,
            {
              headers:
                authHeaders(),
            },
          );

        const data =
          await res.json();

        if (!res.ok) {
          setMessage(
            data?.message ||
              'Unable to load application',
          );

          return;
        }

        setActiveRequest(
          data?.request ||
            null,
        );

        setRequestDetail(
          data,
        );

        if (
  data?.policy?.id
) {
  setPolicyDocuments(
    (prev) => ({
      ...prev,

      [Number(
        data.policy.id,
      )]:
        Array.isArray(
          data?.policyDocuments,
        )
          ? data.policyDocuments
          : [],
    }),
  );
}

        setSelectedPlan(
          data?.plan ||
            null,
        );

        setTab(
          'APPLICATION',
        );

        window.scrollTo({
          top: 0,
          behavior:
            'smooth',
        });
      } catch (error) {
        console.error(error);

        setMessage(
          'Unable to load insurance application',
        );
      }
    };

  const selectPlan = (
    plan: any,
  ) => {
    setSelectedPlan(plan);

    setActiveRequest(
      null,
    );

    setRequestDetail(
      null,
    );

    setFiles({});

    setForm({
      ...emptyForm,

      insurancePlanId:
        String(plan.id),
    });

    setMessage('');

    setTab(
      'APPLICATION',
    );

    window.scrollTo({
      top: 0,
      behavior:
        'smooth',
    });
  };

  const createApplication =
    async (
      e: FormEvent,
    ) => {
      e.preventDefault();

      if (
        !form
          .insurancePlanId
      ) {
        setMessage(
          'Please select an insurance plan.',
        );

        return;
      }

      if (
        !form.customerName
          .trim()
      ) {
        setMessage(
          'Customer name is required.',
        );

        return;
      }

      if (
        !form.customerEmail
          .trim()
      ) {
        setMessage(
          'Email ID is required.',
        );

        return;
      }

      if (
        !form
          .aadhaarLinkedMobile
          .trim()
      ) {
        setMessage(
          'Aadhaar-linked mobile number is required.',
        );

        return;
      }

      try {
        setSubmitting(true);

        setMessage('');

        const res =
          await fetch(
            `${API_BASE_URL}/dealer-auth/insurance/requests`,
            {
              method:
                'POST',

              headers: {
                ...authHeaders(),

                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  insurancePlanId:
                    Number(
                      form.insurancePlanId,
                    ),

                  customerName:
                    form.customerName,

                  customerEmail:
                    form.customerEmail,

                  aadhaarLinkedMobile:
                    form
                      .aadhaarLinkedMobile,

                  customerPhone:
                    form.customerPhone ||
                    form
                      .aadhaarLinkedMobile,

                  installationAddress:
                    form
                      .installationAddress,

                  city:
                    form.city,

                  customerRemarks:
                    form
                      .customerRemarks,
                }),
            },
          );

        const data =
          await res.json();

        if (!res.ok) {
          setMessage(
            data?.message ||
              'Unable to create insurance application',
          );

          return;
        }

        const created =
          data?.request;

        setActiveRequest(
          created,
        );

        setMessage(
          'Application created. Now upload the required documents.',
        );

        await loadRequests();

        if (created?.id) {
          await loadRequestDetail(
            Number(
              created.id,
            ),
          );
        }
      } catch (error) {
        console.error(error);

        setMessage(
          'Insurance application could not be created.',
        );
      } finally {
        setSubmitting(false);
      }
    };

  const chooseFile = (
    type: DocumentKey,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (
      !allowed.includes(
        file.type,
      )
    ) {
      setMessage(
        'Only PDF, JPG, PNG and WEBP files are allowed.',
      );

      event.target.value =
        '';

      return;
    }

    if (
      file.size >
      8 * 1024 * 1024
    ) {
      setMessage(
        'Document must be less than 8 MB.',
      );

      event.target.value =
        '';

      return;
    }

    setFiles(
      (prev) => ({
        ...prev,
        [type]:
          file,
      }),
    );

    setMessage('');
  };

  const uploadDocument =
    async (
      type: DocumentKey,
    ) => {
      if (
        !activeRequest?.id
      ) {
        setMessage(
          'Create the insurance application first.',
        );

        return;
      }

      const file =
        files[type];

      if (!file) {
        setMessage(
          'Please select a file first.',
        );

        return;
      }

      try {
        setUploadingDocument(
          type,
        );

        setMessage('');

        const formData =
          new FormData();

        formData.append(
          'file',
          file,
        );

        formData.append(
          'documentType',
          type,
        );

        const res =
          await fetch(
            `${API_BASE_URL}/dealer-auth/insurance/requests/${activeRequest.id}/documents/upload`,
            {
              method:
                'POST',

              headers:
                authHeaders(),

              body:
                formData,
            },
          );

        const data =
          await res.json();

        if (!res.ok) {
          setMessage(
            data?.message ||
              'Document upload failed',
          );

          return;
        }

        setFiles(
          (prev) => ({
            ...prev,
            [type]:
              undefined,
          }),
        );

        setMessage(
          `${documentLabel(type)} uploaded successfully.`,
        );

        await loadRequestDetail(
          Number(
            activeRequest.id,
          ),
        );

        await loadRequests();
      } catch (error) {
        console.error(error);

        setMessage(
          'Document upload failed.',
        );
      } finally {
        setUploadingDocument(
          '',
        );
      }
    };

  const currentReadiness =
    requestDetail?.readiness;

  const uploadedTypes =
    useMemo(() => {
      const values =
        new Set<string>();

      (
        requestDetail
          ?.documents ||
        []
      ).forEach(
        (document: any) => {
          if (
            !document?.isHidden
          ) {
            values.add(
              document
                .documentType,
            );
          }
        },
      );

      return values;
    }, [
      requestDetail,
    ]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/10 px-8 py-6 text-center shadow-2xl backdrop-blur-xl">
          <div className="text-4xl">
            🛡️
          </div>

          <p className="mt-3 font-black">
            Loading Insurance...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-screen max-w-full overflow-x-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />

      <div className="pointer-events-none fixed right-[-120px] top-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6">
        <header className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
          <a
            href="/dealer-portal"
            className="text-sm font-black text-orange-300"
          >
            ← Back to Dashboard
          </a>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-black text-orange-200">
                🛡️ Dealer Customer Insurance
              </div>

              <h1 className="mt-3 text-3xl font-black md:text-4xl">
                Insurance
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-white/60">
                Select an insurance plan and apply on behalf of your solar customer.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-4 gap-2 rounded-[1.5rem] border border-white/10 bg-white/10 p-2">
          <TabButton
            active={
              tab ===
              'PLANS'
            }
            onClick={() =>
              setTab(
                'PLANS',
              )
            }
          >
            Plans
          </TabButton>

          <TabButton
            active={
              tab ===
              'APPLICATION'
            }
            onClick={() =>
              setTab(
                'APPLICATION',
              )
            }
          >
            Apply
          </TabButton>

          <TabButton
            active={
              tab ===
              'HISTORY'
            }
            onClick={() => {
              setTab(
                'HISTORY',
              );

              loadRequests();
            }}
          >
            Applications
          </TabButton>

          <TabButton
  active={
    tab ===
    'POLICIES'
  }
  onClick={() => {
    setTab(
      'POLICIES',
    );

    loadPolicies();
  }}
>
  Policies
</TabButton>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-100">
            {message}
          </div>
        )}

        {tab ===
          'PLANS' && (
          <PlansSection
            plans={
              plans
            }
            onSelect={
              selectPlan
            }
          />
        )}

        {tab ===
          'APPLICATION' && (
          <ApplicationSection
            selectedPlan={
              selectedPlan
            }
            activeRequest={
              activeRequest
            }
            requestDetail={
              requestDetail
            }
            policyDocuments={
  requestDetail
    ?.policy?.id
    ? policyDocuments[
        Number(
          requestDetail
            .policy.id,
        )
      ] || []
    : []
}
            form={
              form
            }
            setForm={
              setForm
            }
            createApplication={
              createApplication
            }
            submitting={
              submitting
            }
            files={
              files
            }
            chooseFile={
              chooseFile
            }
            uploadDocument={
              uploadDocument
            }
            uploadingDocument={
              uploadingDocument
            }
            uploadedTypes={
              uploadedTypes
            }
            readiness={
              currentReadiness
            }
            openPlans={() =>
              setTab(
                'PLANS',
              )
            }
          />
        )}

        {tab ===
          'HISTORY' && (
          <HistorySection
            requests={
              requests
            }
            onOpen={
              loadRequestDetail
            }
          />
        )}

        {tab ===
  'POLICIES' && (
  <PoliciesSection
  policies={
    policies
  }
  policyDocuments={
    policyDocuments
  }
  loadingPolicyDocuments={
    loadingPolicyDocuments
  }
  onLoadDocuments={
    loadPolicyDocuments
  }
  onOpenApplication={(
    requestId: number,
  ) =>
    loadRequestDetail(
      requestId,
    )
  }
/>
)}
      </div>
    </main>
  );
}

function PlansSection({
  plans,
  onSelect,
}: {
  plans: any[];
  onSelect: (
    plan: any,
  ) => void;
}) {
  return (
    <section className="mt-6">
      <div className="mb-4">
        <h2 className="text-2xl font-black">
          Available Insurance Plans
        </h2>

        <p className="mt-1 text-sm text-white/60">
          Active plans provided by Aditya Solars.
        </p>
      </div>

      {!plans.length && (
        <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-10 text-center">
          <div className="text-4xl">
            🛡️
          </div>

          <p className="mt-3 font-black">
            No active insurance plans available.
          </p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {plans.map(
          (plan) => (
            <div
              key={
                plan.id
              }
              className="overflow-hidden rounded-[2rem] bg-white text-slate-900 shadow-xl"
            >
              <div className="bg-gradient-to-r from-blue-700 to-sky-500 p-5 text-white">
                <p className="text-xs font-black uppercase tracking-wider text-blue-100">
                  {
                    plan.companyName
                  }
                </p>

                <h3 className="mt-2 text-xl font-black">
                  {
                    plan.policyName
                  }
                </h3>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard
                    label="Duration"
                    value={`${Number(plan.durationMonths || 0)} Months`}
                  />

                  <InfoCard
                    label="Price"
                    value={`₹${Number(plan.price || 0).toLocaleString('en-IN')}`}
                  />

                  <InfoCard
                    label="Coverage"
                    value={
                      plan.coverageAmount
                        ? `₹${Number(plan.coverageAmount).toLocaleString('en-IN')}`
                        : '-'
                    }
                  />
                </div>

                {plan.description && (
                  <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
                    {
                      plan.description
                    }
                  </p>
                )}

                {plan.benefits && (
                  <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                    <p className="text-xs font-black uppercase text-emerald-700">
                      Benefits
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm font-semibold text-emerald-900">
                      {
                        plan.benefits
                      }
                    </p>
                  </div>
                )}

                {plan.terms && (
                  <details className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <summary className="cursor-pointer text-sm font-black text-slate-700">
                      Terms & Conditions
                    </summary>

                    <p className="mt-3 whitespace-pre-line text-sm font-semibold text-slate-500">
                      {
                        plan.terms
                      }
                    </p>
                  </details>
                )}

                <button
                  onClick={() =>
                    onSelect(
                      plan,
                    )
                  }
                  className="mt-5 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-400 py-4 font-black text-slate-950 shadow-lg"
                >
                  Apply for Customer
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function ApplicationSection({
  selectedPlan,
  activeRequest,
  requestDetail,
  policyDocuments,
  form,
  setForm,
  createApplication,
  submitting,
  files,
  chooseFile,
  uploadDocument,
  uploadingDocument,
  uploadedTypes,
  readiness,
  openPlans,
}: any) {
  if (
    !selectedPlan &&
    !activeRequest
  ) {
    return (
      <section className="mt-6 rounded-[2rem] bg-white p-8 text-center text-slate-900 shadow-xl">
        <div className="text-5xl">
          🛡️
        </div>

        <h2 className="mt-4 text-2xl font-black">
          Select an Insurance Plan
        </h2>

        <p className="mt-2 text-sm font-semibold text-slate-500">
          Select a plan first before entering your customer's details.
        </p>

        <button
          onClick={
            openPlans
          }
          className="mt-5 rounded-2xl bg-gradient-to-r from-blue-700 to-sky-500 px-6 py-3 font-black text-white"
        >
          View Insurance Plans
        </button>
      </section>
    );
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {!activeRequest ? (
          <form
            onSubmit={
              createApplication
            }
            className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl"
          >
            <h2 className="text-2xl font-black">
              Customer Details
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Insurance is being applied for your customer, not for the dealer account.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input
                label="Project Holder / Customer Name *"
                value={
                  form.customerName
                }
                onChange={(
                  value,
                ) =>
                  setForm(
                    (prev: any) => ({
                      ...prev,
                      customerName:
                        value,
                    }),
                  )
                }
                placeholder="Customer full name"
              />

              <Input
                label="Email ID *"
                type="email"
                value={
                  form.customerEmail
                }
                onChange={(
                  value,
                ) =>
                  setForm(
                    (prev: any) => ({
                      ...prev,
                      customerEmail:
                        value,
                    }),
                  )
                }
                placeholder="Customer or family email"
              />

              <Input
                label="Aadhaar-linked Mobile *"
                type="tel"
                value={
                  form.aadhaarLinkedMobile
                }
                onChange={(
                  value,
                ) =>
                  setForm(
                    (prev: any) => ({
                      ...prev,
                      aadhaarLinkedMobile:
                        value.replace(
                          /\D/g,
                          '',
                        ),
                    }),
                  )
                }
                placeholder="10-digit mobile"
              />

              <Input
                label="Alternate Contact Number"
                type="tel"
                value={
                  form.customerPhone
                }
                onChange={(
                  value,
                ) =>
                  setForm(
                    (prev: any) => ({
                      ...prev,
                      customerPhone:
                        value,
                    }),
                  )
                }
                placeholder="Optional"
              />

              <Input
                label="City"
                value={
                  form.city
                }
                onChange={(
                  value,
                ) =>
                  setForm(
                    (prev: any) => ({
                      ...prev,
                      city:
                        value,
                    }),
                  )
                }
                placeholder="Installation city"
              />

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Installation Address
                </label>

                <textarea
                  value={
                    form.installationAddress
                  }
                  onChange={(
                    e,
                  ) =>
                    setForm(
                      (prev: any) => ({
                        ...prev,
                        installationAddress:
                          e.target.value,
                      }),
                    )
                  }
                  rows={3}
                  placeholder="Project installation address"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Remarks
                </label>

                <textarea
                  value={
                    form.customerRemarks
                  }
                  onChange={(
                    e,
                  ) =>
                    setForm(
                      (prev: any) => ({
                        ...prev,
                        customerRemarks:
                          e.target.value,
                      }),
                    )
                  }
                  rows={3}
                  placeholder="Optional note"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={
                submitting
              }
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-700 to-sky-500 py-4 font-black text-white shadow-xl disabled:opacity-60"
            >
              {submitting
                ? 'Creating Application...'
                : 'Save & Continue to Documents'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-blue-600">
                    Application #
                    {
                      activeRequest.id
                    }
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {
                      activeRequest.customerName
                    }
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {
                      activeRequest.customerEmail
                    }{' '}
                    ·{' '}
                    {
                      activeRequest.aadhaarLinkedMobile
                    }
                  </p>
                </div>

                <StatusBadge
                  status={
                    activeRequest.status
                  }
                />
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-xl">
              <h2 className="text-xl font-black">
                Required Documents
              </h2>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                Aadhaar, PAN and project invoice are mandatory.
              </p>

              <div className="mt-5 space-y-4">
                {(
                  [
                    'AADHAAR_CARD',
                    'PAN_CARD',
                    'PROJECT_INVOICE',
                  ] as DocumentKey[]
                ).map(
                  (
                    type,
                  ) => (
                    <DocumentUploadCard
                      key={
                        type
                      }
                      type={
                        type
                      }
                      uploaded={
                        uploadedTypes.has(
                          type,
                        )
                      }
                      file={
                        files[
                          type
                        ]
                      }
                      onChoose={(
                        e,
                      ) =>
                        chooseFile(
                          type,
                          e,
                        )
                      }
                      onUpload={() =>
                        uploadDocument(
                          type,
                        )
                      }
                      uploading={
                        uploadingDocument ===
                        type
                      }
                    />
                  ),
                )}
              </div>
            </div>

            {requestDetail?.policy && (
  <div className="overflow-hidden rounded-[2rem] bg-white text-slate-900 shadow-xl">
    <div className="bg-gradient-to-r from-emerald-700 to-teal-500 p-5 text-white">
      <p className="text-xs font-black uppercase tracking-wider text-emerald-100">
        ✓ Insurance Policy Issued
      </p>

      <h2 className="mt-2 text-2xl font-black">
        {requestDetail
          .policy
          .policyName ||
          'Insurance Policy'}
      </h2>

      <p className="mt-1 text-sm font-bold text-white/75">
        {requestDetail
          .policy
          .companyName ||
          '-'}
      </p>
    </div>

    <div className="p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard
          label="Policy Number"
          value={
            requestDetail
              .policy
              .policyNumber ||
            '-'
          }
        />

        <InfoCard
          label="Status"
          value={formatStatus(
            requestDetail
              .policy
              .status ||
              '-',
          )}
        />

        <InfoCard
          label="Policy Cost"
          value={`₹${Number(
            requestDetail
              .policy
              .policyCost ||
              0,
          ).toLocaleString(
            'en-IN',
          )}`}
        />

        <InfoCard
          label="Coverage"
          value={
            requestDetail
              .policy
              .coverageAmount
              ? `₹${Number(
                  requestDetail
                    .policy
                    .coverageAmount,
                ).toLocaleString(
                  'en-IN',
                )}`
              : '-'
          }
        />

        <InfoCard
          label="Start Date"
          value={
            requestDetail
              .policy
              .startDate
              ? new Date(
                  requestDetail
                    .policy
                    .startDate,
                ).toLocaleDateString(
                  'en-IN',
                )
              : '-'
          }
        />

        <InfoCard
          label="Expiry Date"
          value={
            requestDetail
              .policy
              .expiryDate
              ? new Date(
                  requestDetail
                    .policy
                    .expiryDate,
                ).toLocaleDateString(
                  'en-IN',
                )
              : '-'
          }
        />
      </div>

      {requestDetail
        .policy
        .remarks && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-slate-400">
            Policy Remarks
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-700">
            {
              requestDetail
                .policy
                .remarks
            }
          </p>
        </div>
      )}

      <div className="mt-5 border-t border-slate-200 pt-5">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="font-black">
        Policy Documents
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-500">
        Documents shared by Aditya Solars for this policy.
      </p>
    </div>

    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
      {policyDocuments.length}{' '}
      File
      {policyDocuments.length ===
      1
        ? ''
        : 's'}
    </span>
  </div>

  {!policyDocuments.length ? (
    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
      Policy document has not been uploaded yet.
    </div>
  ) : (
    <div className="mt-4 space-y-3">
      {policyDocuments.map(
        (
          document: any,
        ) => (
          <PolicyDocumentCard
            key={
              document.id
            }
            document={
              document
            }
          />
        ),
      )}
    </div>
  )}
</div>
    </div>
  </div>
)}

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6">
              <h2 className="text-xl font-black">
                Application Progress
              </h2>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <ProgressCard
                  title="Customer Details"
                  complete={
                    readiness?.detailsComplete
                  }
                />

                <ProgressCard
                  title="Documents"
                  complete={
                    readiness?.documentsComplete
                  }
                />

                <ProgressCard
                  title="Payment"
                  complete={
                    readiness?.paymentComplete
                  }
                />
              </div>

              {readiness?.readyForPayment && (
                <div className="mt-5 rounded-2xl border border-orange-300/20 bg-orange-500/10 p-4">
                  <p className="font-black text-orange-200">
                    Documents Complete
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white/70">
                    This application is ready for payment. Dealer payment gateway integration will be enabled once the bank provides the approved gateway credentials.
                  </p>
                </div>
              )}

              <button
                disabled
                className="mt-5 w-full rounded-2xl bg-white/10 py-4 font-black text-white/40"
              >
                Payment Gateway Coming Soon
              </button>
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-5">
        <div className="rounded-[2rem] bg-gradient-to-br from-orange-500 to-yellow-400 p-6 text-slate-950 shadow-xl">
          <p className="text-xs font-black uppercase">
            Selected Plan
          </p>

          <h3 className="mt-2 text-xl font-black">
            {selectedPlan?.policyName ||
              requestDetail?.plan?.policyName ||
              '-'}
          </h3>

          <p className="mt-1 text-sm font-bold opacity-70">
            {selectedPlan?.companyName ||
              requestDetail?.plan?.companyName ||
              '-'}
          </p>

          <div className="mt-5 grid gap-3">
            <PlanInfo
              label="Duration"
              value={`${Number(
                selectedPlan?.durationMonths ||
                  requestDetail?.plan?.durationMonths ||
                  0,
              )} Months`}
            />

            <PlanInfo
              label="Payable Amount"
              value={`₹${Number(
                activeRequest?.payableAmount ??
                  selectedPlan?.price ??
                  0,
              ).toLocaleString('en-IN')}`}
            />

            <PlanInfo
              label="Coverage"
              value={
                selectedPlan?.coverageAmount ||
                requestDetail?.plan?.coverageAmount
                  ? `₹${Number(
                      selectedPlan?.coverageAmount ||
                        requestDetail?.plan?.coverageAmount,
                    ).toLocaleString('en-IN')}`
                  : '-'
              }
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5">
          <p className="font-black">
            Required by Insurance Company
          </p>

          <div className="mt-4 space-y-2 text-sm font-semibold text-white/70">
            <p>✓ Aadhaar Card</p>
            <p>✓ PAN Card</p>
            <p>✓ Email ID</p>
            <p>✓ Aadhaar-linked Mobile</p>
            <p>✓ Project Invoice / Bill</p>
          </div>
        </div>
      </aside>
    </section>
  );
}

function HistorySection({
  requests,
  onOpen,
}: {
  requests: any[];
  onOpen: (
    id: number,
  ) => void;
}) {
  return (
    <section className="mt-6">
      <div>
        <h2 className="text-2xl font-black">
          My Insurance Applications
        </h2>

        <p className="mt-1 text-sm text-white/60">
          Applications submitted for your customers.
        </p>
      </div>

      {!requests.length && (
        <div className="mt-5 rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-10 text-center">
          <p className="font-black">
            No insurance applications yet.
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {requests.map(
          (item) => (
            <button
              key={
                item.id
              }
              onClick={() =>
                onOpen(
                  Number(
                    item.id,
                  ),
                )
              }
              className="rounded-[2rem] bg-white p-5 text-left text-slate-900 shadow-xl transition hover:scale-[1.01]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-blue-600">
                    Application #
                    {
                      item.id
                    }
                  </p>

                  <h3 className="mt-1 text-lg font-black">
                    {
                      item.customerName
                    }
                  </h3>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {
                      item.aadhaarLinkedMobile ||
                      item.customerPhone ||
                      '-'
                    }
                  </p>
                </div>

                <StatusBadge
                  status={
                    item.status
                  }
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <InfoCard
                  label="Amount"
                  value={`₹${Number(item.payableAmount || 0).toLocaleString('en-IN')}`}
                />

                <InfoCard
                  label="Payment"
                  value={
                    formatStatus(
                      item.paymentStatus ||
                        'PENDING',
                    )
                  }
                />
              </div>

              <p className="mt-4 text-xs font-bold text-slate-400">
                {item.requestedAt
                  ? new Date(
                      item.requestedAt,
                    ).toLocaleString(
                      'en-IN',
                    )
                  : '-'}
              </p>
            </button>
          ),
        )}
      </div>
    </section>
  );
}

function PoliciesSection({
  policies,
  policyDocuments,
  loadingPolicyDocuments,
  onLoadDocuments,
  onOpenApplication,
}: {
  policies: any[];

  policyDocuments:
    Record<
      number,
      any[]
    >;

  loadingPolicyDocuments:
    number | null;

  onLoadDocuments: (
    insuranceId: number,
  ) => void;

  onOpenApplication: (
    requestId: number,
  ) => void;
}) {
  return (
    <section className="mt-6">
      <div>
        <h2 className="text-2xl font-black">
          My Issued Policies
        </h2>

        <p className="mt-1 text-sm text-white/60">
          Insurance policies issued for your customers.
        </p>
      </div>

      {!policies.length && (
        <div className="mt-5 rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-10 text-center">
          <div className="text-4xl">
            🛡️
          </div>

          <p className="mt-3 font-black">
            No insurance policies issued yet.
          </p>

          <p className="mt-1 text-sm font-semibold text-white/50">
            Completed insurance applications will appear here.
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {policies.map(
          (policy) => (
            <div
              key={
                policy.id
              }
              className="overflow-hidden rounded-[2rem] bg-white text-slate-900 shadow-xl"
            >
              <div className="bg-gradient-to-r from-emerald-700 to-teal-500 p-5 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-100">
                      Policy #
                      {
                        policy.id
                      }
                    </p>

                    <h3 className="mt-2 text-xl font-black">
                      {policy.policyName ||
                        'Insurance Policy'}
                    </h3>

                    <p className="mt-1 text-sm font-bold text-white/75">
                      {policy.companyName ||
                        '-'}
                    </p>
                  </div>

                  <StatusBadge
                    status={
                      policy.status ||
                      'ACTIVE'
                    }
                  />
                </div>
              </div>

              <div className="p-5">
                <div>
                  <p className="text-xs font-black uppercase text-slate-400">
                    Customer
                  </p>

                  <p className="mt-1 text-lg font-black">
                    {policy.customerName ||
                      '-'}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {policy.aadhaarLinkedMobile ||
                      policy.customerPhone ||
                      '-'}
                  </p>

                  {policy.city && (
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      📍{' '}
                      {
                        policy.city
                      }
                    </p>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <InfoCard
                    label="Policy Number"
                    value={
                      policy.policyNumber ||
                      '-'
                    }
                  />

                  <InfoCard
                    label="Policy Cost"
                    value={`₹${Number(
                      policy.policyCost ||
                        0,
                    ).toLocaleString(
                      'en-IN',
                    )}`}
                  />

                  <InfoCard
                    label="Start Date"
                    value={
                      policy.startDate
                        ? new Date(
                            policy.startDate,
                          ).toLocaleDateString(
                            'en-IN',
                          )
                        : '-'
                    }
                  />

                  <InfoCard
                    label="Expiry Date"
                    value={
                      policy.expiryDate
                        ? new Date(
                            policy.expiryDate,
                          ).toLocaleDateString(
                            'en-IN',
                          )
                        : '-'
                    }
                  />
                </div>

                {policy.coverageAmount && (
                  <div className="mt-3">
                    <InfoCard
                      label="Coverage Amount"
                      value={`₹${Number(
                        policy.coverageAmount,
                      ).toLocaleString(
                        'en-IN',
                      )}`}
                    />
                  </div>
                )}

                <div className="mt-5 border-t border-slate-200 pt-4">
  <div className="flex items-center justify-between gap-3">
    <p className="text-sm font-black">
      Policy Documents
    </p>

    {policyDocuments[
      Number(
        policy.id,
      )
    ] && (
      <span className="text-xs font-black text-slate-400">
        {
          policyDocuments[
            Number(
              policy.id,
            )
          ].length
        }{' '}
        File
        {policyDocuments[
          Number(
            policy.id,
          )
        ].length ===
        1
          ? ''
          : 's'}
      </span>
    )}
  </div>

  {!policyDocuments[
    Number(
      policy.id,
    )
  ] ? (
    <button
      type="button"
      disabled={
        loadingPolicyDocuments ===
        Number(
          policy.id,
        )
      }
      onClick={() =>
        onLoadDocuments(
          Number(
            policy.id,
          ),
        )
      }
      className="mt-3 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 disabled:opacity-50"
    >
      {loadingPolicyDocuments ===
      Number(
        policy.id,
      )
        ? 'Loading Documents...'
        : 'View Policy Documents'}
    </button>
  ) : policyDocuments[
      Number(
        policy.id,
      )
    ].length ? (
    <div className="mt-3 space-y-3">
      {policyDocuments[
        Number(
          policy.id,
        )
      ].map(
        (
          document: any,
        ) => (
          <PolicyDocumentCard
            key={
              document.id
            }
            document={
              document
            }
          />
        ),
      )}
    </div>
  ) : (
    <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-500">
      No dealer-visible policy documents uploaded yet.
    </div>
  )}
</div>

                {policy.insuranceRequestId && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenApplication(
                        Number(
                          policy.insuranceRequestId,
                        ),
                      )
                    }
                    className="mt-5 w-full rounded-2xl bg-slate-900 py-3 text-sm font-black text-white"
                  >
                    View Application & Policy
                  </button>
                )}
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function PolicyDocumentCard({
  document,
}: {
  document: any;
}) {
  const fileUrl =
    String(
      document?.fileUrl ||
        '',
    );

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-black text-slate-900">
            {documentLabel(
              document.documentType ||
                'POLICY',
            )}
          </p>

          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
            {document.fileName ||
              'Insurance Document'}
          </p>

          {document.createdAt && (
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Uploaded{' '}
              {new Date(
                document.createdAt,
              ).toLocaleString(
                'en-IN',
              )}
            </p>
          )}
        </div>

        {fileUrl ? (
          <a
            href={
              fileUrl
            }
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-black text-white"
          >
            View / Download
          </a>
        ) : (
          <span className="shrink-0 rounded-xl bg-slate-200 px-4 py-3 text-xs font-black text-slate-500">
            File Unavailable
          </span>
        )}
      </div>
    </div>
  );
}

function DocumentUploadCard({
  type,
  uploaded,
  file,
  onChoose,
  onUpload,
  uploading,
}: {
  type: DocumentKey;
  uploaded: boolean;
  file?: File;
  onChoose: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onUpload: () => void;
  uploading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-black">
            {documentLabel(
              type,
            )}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            PDF / JPG / PNG / WEBP · Maximum 8 MB
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${
            uploaded
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-orange-100 text-orange-700'
          }`}
        >
          {uploaded
            ? '✓ Uploaded'
            : 'Required'}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
          onChange={
            onChoose
          }
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-2 text-sm font-semibold"
        />

        <button
          type="button"
          disabled={
            !file ||
            uploading
          }
          onClick={
            onUpload
          }
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:opacity-40"
        >
          {uploading
            ? 'Uploading...'
            : uploaded
              ? 'Replace'
              : 'Upload'}
        </button>
      </div>

      {file && (
        <p className="mt-2 truncate text-xs font-semibold text-blue-600">
          Selected:{' '}
          {
            file.name
          }
        </p>
      )}
    </div>
  );
}

function ProgressCard({
  title,
  complete,
}: {
  title: string;
  complete?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        complete
          ? 'border-emerald-400/20 bg-emerald-500/10'
          : 'border-white/10 bg-white/5'
      }`}
    >
      <p className="text-xs font-bold text-white/50">
        {title}
      </p>

      <p
        className={`mt-1 font-black ${
          complete
            ? 'text-emerald-300'
            : 'text-orange-200'
        }`}
      >
        {complete
          ? '✓ Complete'
          : 'Pending'}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children:
    React.ReactNode;
}) {
  return (
    <button
      onClick={
        onClick
      }
      className={`rounded-xl px-3 py-3 text-sm font-black transition ${
        active
          ? 'bg-white text-slate-950'
          : 'text-white/60 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-600">
        {label}
      </label>

      <input
        type={
          type
        }
        value={
          value
        }
        onChange={(
          e,
        ) =>
          onChange(
            e.target.value,
          )
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
      />
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-black">
        {value}
      </p>
    </div>
  );
}

function PlanInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/30 p-4">
      <p className="text-xs font-black opacity-60">
        {label}
      </p>

      <p className="mt-1 font-black">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status:
    string;
}) {
  const normalized =
    String(
      status ||
        'PENDING',
    ).toUpperCase();

  const className =
    normalized ===
      'COMPLETED' ||
    normalized ===
      'APPROVED' ||
    normalized ===
      'PAID'
      ? 'bg-emerald-100 text-emerald-700'
      : normalized ===
            'REJECTED' ||
          normalized ===
            'CANCELLED' ||
          normalized ===
            'FAILED'
        ? 'bg-red-100 text-red-700'
        : 'bg-orange-100 text-orange-700';

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${className}`}
    >
      {formatStatus(
        normalized,
      )}
    </span>
  );
}

function documentLabel(
  type: string,
) {
  switch (type) {
    case 'AADHAAR_CARD':
      return 'Aadhaar Card';

    case 'PAN_CARD':
      return 'PAN Card';

    case 'PROJECT_INVOICE':
      return 'Project Invoice / Bill';

    default:
      return formatStatus(
        type,
      );
  }
}

function formatStatus(
  value: string,
) {
  return String(
    value ||
      '',
  )
    .replace(
      /_/g,
      ' ',
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (
        letter,
      ) =>
        letter.toUpperCase(),
    );
}
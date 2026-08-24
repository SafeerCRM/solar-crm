'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import axios from 'axios';

import {
  useRouter,
} from 'next/navigation';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type TimelineStatus =
  | 'NOT_STARTED'
  | 'IN_TIMELINE'
  | 'DUE_TODAY'
  | 'DELAYED'
  | 'COMPLETED_ON_TIME'
  | 'COMPLETED_LATE'
  | 'COMPLETED_DATE_UNAVAILABLE';

type TimelineRule = {
  id: number;

  name: string;

  triggerType: string;

  triggerValue: number;

  targetModule: string;

  targetMilestone: string;

  targetValue?: number | null;

  applicableProjectType:
    | 'ALL'
    | 'CASH'
    | 'LOAN';

  allowedDays: number;

  requireDelayExplanation:
    boolean;

  requireDelayPhoto:
    boolean;

  isActive: boolean;

  sortOrder: number;

  createdAt?: string;

  updatedAt?: string;
};

type TimelineOption = {
  value: string;
  label: string;

  requiresValue?: boolean;

  requiresTargetValue?: boolean;

  valueType?: string;

  targetValueType?: string;

  minimumValue?: number;

  maximumValue?: number;

  minimumTargetValue?: number;

  maximumTargetValue?: number;
};

type TimelineOptionsResponse = {
  triggerTypes:
    TimelineOption[];

  applicableProjectTypes:
    TimelineOption[];

  modules:
    TimelineOption[];

  milestones: Record<
    string,
    TimelineOption[]
  >;
};

type TrackingRow = {
  projectId: number;

  ruleId: number;

  ruleName: string;

  targetModule: string;

  targetMilestone: string;

  triggerType: string;

  triggerValue: number;

  triggerReached: boolean;

  triggerDate:
    string | null;

  dueDate:
    string | null;

  allowedDays: number;

  status:
    TimelineStatus;

  daysRemaining:
    number | null;

  delayDays:
    number | null;

  completedDate:
    string | null;

  completionDateReliable:
    boolean;

  completionSource:
    string;

  sourceId?: number | null;

  projectAmount:
    number;

  triggerThresholdAmount:
    number;

  triggerCumulativeAmount:
    number;

  customerName: string;

  customerPhone: string;

  electricityKNumber: string;

  projectSerial: string;

  projectType:
    string | null;

  projectStatus:
    string | null;

  projectWorkState:
    string;

  branchName: string;

  city: string;

  projectOwnerId:
    number | null;

  projectOwnerName:
    string;

  hasDelayExplanation:
    boolean;

  latestDelayRemark:
    string | null;

  expectedResolutionDate:
    string | null;

  latestDelayNoteCreatedAt:
    string | null;

  latestDelayNoteCreatedByName:
    string | null;

  delayProofCount:
    number;
};

type TrackingSummary = {
  total: number;

  notStarted: number;

  inTimeline: number;

  dueToday: number;

  delayed: number;

  completedOnTime: number;

  completedLate: number;

  completedDateUnavailable:
    number;
};

type TrackingPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type RuleForm = {
  name: string;

  triggerType: string;

  triggerValue: string;

  targetModule: string;

  targetMilestone: string;

  targetValue: string;

  applicableProjectType:
    string;

  allowedDays: string;

  requireDelayExplanation:
    boolean;

  requireDelayPhoto:
    boolean;

  isActive: boolean;

  sortOrder: string;
};

type DelayNote = {
  id: number;

  projectId: number;

  timelineRuleId: number;

  remark: string;

  expectedResolutionDate?:
    string | null;

  createdByName?:
    string | null;

  createdAt?: string;

  proofs?: {
    id: number;
    fileUrl: string;
    createdAt?: string;
  }[];
};

const emptySummary:
  TrackingSummary = {
  total: 0,
  notStarted: 0,
  inTimeline: 0,
  dueToday: 0,
  delayed: 0,
  completedOnTime: 0,
  completedLate: 0,
  completedDateUnavailable: 0,
};

const defaultRuleForm:
  RuleForm = {
  name: '',

  triggerType:
    'PAYMENT_PERCENT_REACHED',

  triggerValue:
    '20',

  targetModule:
    'EXECUTION',

  targetMilestone:
    '',

  targetValue:
    '',

  applicableProjectType:
    'ALL',

  allowedDays:
    '',

  requireDelayExplanation:
    true,

  requireDelayPhoto:
    false,

  isActive:
    true,

  sortOrder:
    '0',
};

function formatLabel(
  value?: string | null,
) {
  if (!value) {
    return '-';
  }

  return String(value)
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0)
          .toUpperCase() +
        word.slice(1),
    )
    .join(' ');
}

function formatDate(
  value?: string | null,
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

  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  );
}

function formatCurrency(
  value?: number | null,
) {
  return new Intl.NumberFormat(
    'en-IN',
    {
      style:
        'currency',
      currency:
        'INR',
      maximumFractionDigits:
        0,
    },
  ).format(
    Number(value || 0),
  );
}

function getStatusClasses(
  status: TimelineStatus,
) {
  switch (status) {
    case 'DELAYED':
      return 'bg-red-100 text-red-700';

    case 'DUE_TODAY':
      return 'bg-orange-100 text-orange-700';

    case 'IN_TIMELINE':
      return 'bg-blue-100 text-blue-700';

    case 'COMPLETED_ON_TIME':
      return 'bg-green-100 text-green-700';

    case 'COMPLETED_LATE':
      return 'bg-amber-100 text-amber-800';

    case 'COMPLETED_DATE_UNAVAILABLE':
      return 'bg-purple-100 text-purple-700';

    case 'NOT_STARTED':
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function SummaryCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <p className="text-sm font-medium text-gray-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold text-gray-900">
        {value}
      </p>

      {detail ? (
        <p className="mt-1 text-xs text-gray-500">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

export default function ProjectTimelinePage() {
  const router =
    useRouter();

  const [activeTab, setActiveTab] =
    useState<
      'TRACKING' | 'SETTINGS'
    >('TRACKING');

  const [userRoles, setUserRoles] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [
    settingsLoading,
    setSettingsLoading,
  ] = useState(false);

  const [
    savingRule,
    setSavingRule,
  ] = useState(false);

  const [
  branchOptions,
  setBranchOptions,
] = useState<string[]>([]);

const [
  ownerOptions,
  setOwnerOptions,
] = useState<
  {
    id: number;
    name: string;
  }[]
>([]);

  const [
    rows,
    setRows,
  ] = useState<TrackingRow[]>(
    [],
  );

  const [
    summary,
    setSummary,
  ] =
    useState<TrackingSummary>(
      emptySummary,
    );

  const [
    pagination,
    setPagination,
  ] =
    useState<TrackingPagination>({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
    });

  const [
    options,
    setOptions,
  ] =
    useState<TimelineOptionsResponse | null>(
      null,
    );

  const [
    rules,
    setRules,
  ] =
    useState<TimelineRule[]>([]);

  const [
    editingRuleId,
    setEditingRuleId,
  ] =
    useState<number | null>(
      null,
    );

  const [
    ruleForm,
    setRuleForm,
  ] =
    useState<RuleForm>(
      defaultRuleForm,
    );

  /*
   * Filter form values.
   *
   * These are applied only when
   * Apply Filters is clicked.
   */
  const [
    search,
    setSearch,
  ] =
    useState('');

  const [
    ruleIdFilter,
    setRuleIdFilter,
  ] =
    useState('');

  const [
    moduleFilter,
    setModuleFilter,
  ] =
    useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState('');

  const [
    projectTypeFilter,
    setProjectTypeFilter,
  ] =
    useState('');

  const [
    branchFilter,
    setBranchFilter,
  ] =
    useState('');

  const [
    workStateFilter,
    setWorkStateFilter,
  ] =
    useState('');

  const [
    ownerIdFilter,
    setOwnerIdFilter,
  ] =
    useState('');

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState({
    search: '',
    ruleId: '',
    targetModule: '',
    timelineStatus: '',
    projectType: '',
    branch: '',
    projectWorkState: '',
    projectOwnerId: '',
  });

  const [page, setPage] =
    useState(1);

  /*
   * Delay modal.
   */
  const [
    delayRow,
    setDelayRow,
  ] =
    useState<TrackingRow | null>(
      null,
    );

  const [
    delayRemark,
    setDelayRemark,
  ] =
    useState('');

  const [
    expectedResolutionDate,
    setExpectedResolutionDate,
  ] =
    useState('');

  const [
    delayFiles,
    setDelayFiles,
  ] =
    useState<File[]>([]);

  const [
    delaySaving,
    setDelaySaving,
  ] =
    useState(false);

  const [
    historyRow,
    setHistoryRow,
  ] =
    useState<TrackingRow | null>(
      null,
    );

  const [
    delayNotes,
    setDelayNotes,
  ] =
    useState<DelayNote[]>([]);

  const [
    delayNotesLoading,
    setDelayNotesLoading,
  ] =
    useState(false);

  const isOwner =
    userRoles.includes(
      'OWNER',
    );

  const getToken =
    () =>
      localStorage.getItem(
        'token',
      );

  const authHeaders =
    () => {
      const token =
        getToken();

      return token
        ? {
            Authorization:
              `Bearer ${token}`,
          }
        : {};
    };

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem(
          'user',
        );

      if (storedUser) {
        const parsed =
          JSON.parse(
            storedUser,
          );

        setUserRoles(
          Array.isArray(
            parsed?.roles,
          )
            ? parsed.roles
            : [],
        );
      }
    } catch (error) {
      console.error(
        'Failed to read current user roles',
        error,
      );
    }
  }, []);

  const fetchOptions =
    async () => {
      try {
        const res =
          await axios.get(
            `${API_BASE_URL}/project/timeline/options`,
            {
              headers:
                authHeaders(),
            },
          );

        setOptions(
          res.data || null,
        );
      } catch (error) {
        console.error(
          'Failed to load timeline options',
          error,
        );
      }
    };

    const fetchFilterOptions =
  async () => {
    try {
      const res =
        await axios.get(
          `${API_BASE_URL}/project/timeline/filter-options`,
          {
            headers:
              authHeaders(),
          },
        );

      setBranchOptions(
        Array.isArray(
          res.data?.branches,
        )
          ? res.data.branches
          : [],
      );

      setOwnerOptions(
        Array.isArray(
          res.data
            ?.projectOwners,
        )
          ? res.data
              .projectOwners
          : [],
      );
    } catch (error) {
      console.error(
        'Failed to load timeline filter options',
        error,
      );
    }
  };

  const fetchRules =
    async () => {
      try {
        setSettingsLoading(
          true,
        );

        const res =
          await axios.get(
            `${API_BASE_URL}/project/timeline/rules`,
            {
              params: {
                showInactive:
                  isOwner
                    ? 'true'
                    : '',
              },

              headers:
                authHeaders(),
            },
          );

        setRules(
          Array.isArray(
            res.data,
          )
            ? res.data
            : [],
        );
      } catch (error: any) {
        console.error(
          'Failed to load timeline rules',
          error,
        );

        alert(
          error?.response?.data?.message ||
            'Failed to load timeline rules',
        );
      } finally {
        setSettingsLoading(
          false,
        );
      }
    };

  const fetchTracking =
    async () => {
      try {
        setLoading(
          true,
        );

        const res =
          await axios.get(
            `${API_BASE_URL}/project/timeline/tracking`,
            {
              params: {
                page,
                limit: 20,

                search:
                  appliedFilters.search,

                ruleId:
                  appliedFilters.ruleId,

                targetModule:
                  appliedFilters.targetModule,

                timelineStatus:
                  appliedFilters.timelineStatus,

                projectType:
                  appliedFilters.projectType,

                branch:
                  appliedFilters.branch,

                projectWorkState:
                  appliedFilters.projectWorkState,

                projectOwnerId:
                  appliedFilters.projectOwnerId,
              },

              headers:
                authHeaders(),
            },
          );

        setRows(
          res.data?.data ||
            [],
        );

        setSummary({
          ...emptySummary,
          ...(res.data
            ?.summary ||
            {}),
        });

        setPagination({
          page:
            Number(
              res.data
                ?.pagination
                ?.page || 1,
            ),

          limit:
            Number(
              res.data
                ?.pagination
                ?.limit || 20,
            ),

          total:
            Number(
              res.data
                ?.pagination
                ?.total || 0,
            ),

          totalPages:
            Number(
              res.data
                ?.pagination
                ?.totalPages ||
                1,
            ),
        });
      } catch (error: any) {
        console.error(
          'Failed to load timeline tracking',
          error,
        );

        alert(
          error?.response?.data?.message ||
            'Failed to load timeline tracking',
        );
      } finally {
        setLoading(
          false,
        );
      }
    };

  useEffect(() => {
  fetchOptions();
  fetchFilterOptions();
}, []);

  useEffect(() => {
    fetchRules();
  }, [isOwner]);

  useEffect(() => {
    fetchTracking();
  }, [
    page,
    appliedFilters,
  ]);

  const milestoneOptions =
    useMemo(
      () =>
        options
          ?.milestones?.[
            ruleForm
              .targetModule
          ] || [],
      [
        options,
        ruleForm.targetModule,
      ],
    );


  const applyFilters =
    () => {
      setAppliedFilters({
        search:
          search.trim(),

        ruleId:
          ruleIdFilter,

        targetModule:
          moduleFilter,

        timelineStatus:
          statusFilter,

        projectType:
          projectTypeFilter,

        branch:
          branchFilter,

        projectWorkState:
          workStateFilter,

        projectOwnerId:
          ownerIdFilter,
      });

      setPage(1);
    };

  const clearFilters =
    () => {
      setSearch('');
      setRuleIdFilter('');
      setModuleFilter('');
      setStatusFilter('');
      setProjectTypeFilter('');
      setBranchFilter('');
      setWorkStateFilter('');
      setOwnerIdFilter('');

      setAppliedFilters({
        search: '',
        ruleId: '',
        targetModule: '',
        timelineStatus: '',
        projectType: '',
        branch: '',
        projectWorkState: '',
        projectOwnerId: '',
      });

      setPage(1);
    };

  const resetRuleForm =
    () => {
      setEditingRuleId(
        null,
      );

      setRuleForm({
        ...defaultRuleForm,
      });
    };

  const startEditRule =
    (
      rule: TimelineRule,
    ) => {
      setEditingRuleId(
        Number(rule.id),
      );

      setRuleForm({
        name:
          rule.name ||
          '',

        triggerType:
          rule.triggerType ||
          'PAYMENT_PERCENT_REACHED',

        triggerValue:
          String(
            Number(
              rule.triggerValue ||
                0,
            ),
          ),

        targetModule:
          rule.targetModule ||
          'EXECUTION',

        targetMilestone:
          rule.targetMilestone ||
          '',

        targetValue:
          rule.targetValue ===
            null ||
          rule.targetValue ===
            undefined
            ? ''
            : String(
                Number(
                  rule.targetValue,
                ),
              ),

        applicableProjectType:
          rule.applicableProjectType ||
          'ALL',

        allowedDays:
          String(
            Number(
              rule.allowedDays ||
                0,
            ),
          ),

        requireDelayExplanation:
          rule.requireDelayExplanation !==
          false,

        requireDelayPhoto:
          rule.requireDelayPhoto ===
          true,

        isActive:
          rule.isActive !==
          false,

        sortOrder:
          String(
            Number(
              rule.sortOrder ||
                0,
            ),
          ),
      });

      window.scrollTo({
        top: 0,
        behavior:
          'smooth',
      });
    };

  const saveRule =
    async () => {
      if (
        !ruleForm.name.trim()
      ) {
        alert(
          'Timeline rule name is required',
        );
        return;
      }

      if (
        !ruleForm
          .targetModule
      ) {
        alert(
          'Target module is required',
        );
        return;
      }

      if (
        !ruleForm
          .targetMilestone
      ) {
        alert(
          'Target milestone is required',
        );
        return;
      }

      if (
        !ruleForm.allowedDays
      ) {
        alert(
          'Allowed days are required',
        );
        return;
      }

      if (
        ruleForm.targetModule ===
          'PAYMENT' &&
        !ruleForm.targetValue
      ) {
        alert(
          'Payment target percentage is required',
        );
        return;
      }

      try {
        setSavingRule(
          true,
        );

        const payload = {
          name:
            ruleForm
              .name
              .trim(),

          triggerType:
            ruleForm
              .triggerType,

          triggerValue:
  ruleForm.triggerType ===
  'PAYMENT_PERCENT_REACHED'
    ? Number(
        ruleForm
          .triggerValue,
      )
    : 0,

          targetModule:
            ruleForm
              .targetModule,

          targetMilestone:
            ruleForm
              .targetMilestone,

          targetValue:
            ruleForm.targetModule ===
            'PAYMENT'
              ? Number(
                  ruleForm
                    .targetValue,
                )
              : null,

          applicableProjectType:
            ruleForm
              .targetModule ===
            'LOAN'
              ? 'LOAN'
              : ruleForm
                  .applicableProjectType,

          allowedDays:
            Number(
              ruleForm
                .allowedDays,
            ),

          requireDelayExplanation:
            ruleForm
              .requireDelayExplanation,

          requireDelayPhoto:
            ruleForm
              .requireDelayPhoto,

          isActive:
            ruleForm
              .isActive,

          sortOrder:
            Number(
              ruleForm
                .sortOrder ||
                0,
            ),
        };

        if (
          editingRuleId
        ) {
          await axios.patch(
            `${API_BASE_URL}/project/timeline/rules/${editingRuleId}`,
            payload,
            {
              headers:
                authHeaders(),
            },
          );
        } else {
          await axios.post(
            `${API_BASE_URL}/project/timeline/rules`,
            payload,
            {
              headers:
                authHeaders(),
            },
          );
        }

        resetRuleForm();

        await fetchRules();

        await fetchTracking();
      } catch (error: any) {
        console.error(
          'Failed to save timeline rule',
          error,
        );

        alert(
          error?.response?.data?.message ||
            'Failed to save timeline rule',
        );
      } finally {
        setSavingRule(
          false,
        );
      }
    };

  const toggleRuleActive =
    async (
      rule: TimelineRule,
    ) => {
      try {
        await axios.patch(
          `${API_BASE_URL}/project/timeline/rules/${rule.id}/active`,
          {
            isActive:
              !rule.isActive,
          },
          {
            headers:
              authHeaders(),
          },
        );

        await fetchRules();

        await fetchTracking();
      } catch (error: any) {
        console.error(
          'Failed to update timeline rule status',
          error,
        );

        alert(
          error?.response?.data?.message ||
            'Failed to update timeline rule status',
        );
      }
    };

  const submitDelayExplanation =
    async () => {
      if (!delayRow) {
        return;
      }

      if (
        !delayRemark.trim()
      ) {
        alert(
          'Delay remark is required',
        );
        return;
      }

      const rule =
        rules.find(
          (item) =>
            Number(item.id) ===
            Number(
              delayRow.ruleId,
            ),
        );

      if (
        rule?.requireDelayPhoto &&
        delayFiles.length === 0
      ) {
        alert(
          'Photo proof is required for this timeline rule',
        );
        return;
      }

      try {
        setDelaySaving(
          true,
        );

        const noteRes =
          await axios.post(
            `${API_BASE_URL}/project/timeline/${delayRow.projectId}/rules/${delayRow.ruleId}/delay-note`,
            {
              remark:
                delayRemark.trim(),

              expectedResolutionDate:
                expectedResolutionDate ||
                null,
            },
            {
              headers:
                authHeaders(),
            },
          );

        const delayNoteId =
          Number(
            noteRes.data?.id ||
              0,
          );

        if (
          delayFiles.length >
            0 &&
          delayNoteId > 0
        ) {
          const formData =
            new FormData();

          for (
            const file of
              delayFiles
          ) {
            formData.append(
              'files',
              file,
            );
          }

          await axios.post(
            `${API_BASE_URL}/project/timeline/${delayRow.projectId}/rules/${delayRow.ruleId}/delay-notes/${delayNoteId}/proofs`,
            formData,
            {
              headers:
                authHeaders(),
            },
          );
        }

        setDelayRow(null);
        setDelayRemark('');
        setExpectedResolutionDate('');
        setDelayFiles([]);

        await fetchTracking();
      } catch (error: any) {
        console.error(
          'Failed to submit delay explanation',
          error,
        );

        alert(
          error?.response?.data?.message ||
            'Failed to submit delay explanation',
        );
      } finally {
        setDelaySaving(
          false,
        );
      }
    };

  const openDelayHistory =
    async (
      row: TrackingRow,
    ) => {
      try {
        setHistoryRow(
          row,
        );

        setDelayNotesLoading(
          true,
        );

        setDelayNotes([]);

        const res =
          await axios.get(
            `${API_BASE_URL}/project/timeline/${row.projectId}/rules/${row.ruleId}/delay-notes`,
            {
              headers:
                authHeaders(),
            },
          );

        setDelayNotes(
          Array.isArray(
            res.data,
          )
            ? res.data
            : [],
        );
      } catch (error: any) {
        console.error(
          'Failed to load delay notes',
          error,
        );

        alert(
          error?.response?.data?.message ||
            'Failed to load delay history',
        );
      } finally {
        setDelayNotesLoading(
          false,
        );
      }
    };

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden bg-gray-50 p-3 md:p-6">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-900">
          Project Timeline & Delay Tracking
        </h1>

        <p className="mt-1 text-sm text-gray-500">
  Track configured project milestones from the selected trigger, monitor due dates and delays, and document genuine delay reasons.
</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow">
        <button
          type="button"
          onClick={() =>
            setActiveTab(
              'TRACKING',
            )
          }
          className={`rounded-xl px-5 py-3 font-semibold ${
            activeTab ===
            'TRACKING'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Timeline Tracking
        </button>

        {isOwner ? (
          <button
            type="button"
            onClick={() =>
              setActiveTab(
                'SETTINGS',
              )
            }
            className={`rounded-xl px-5 py-3 font-semibold ${
              activeTab ===
              'SETTINGS'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Timeline Settings
          </button>
        ) : null}
      </div>

      {activeTab ===
      'TRACKING' ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Delayed"
              value={
                summary.delayed
              }
              detail="Milestones past configured due date"
            />

            <SummaryCard
              title="Due Today"
              value={
                summary.dueToday
              }
            />

            <SummaryCard
              title="In Timeline"
              value={
                summary.inTimeline
              }
            />

            <SummaryCard
              title="Completed Late"
              value={
                summary.completedLate
              }
            />

            <SummaryCard
              title="Completed On Time"
              value={
                summary.completedOnTime
              }
            />

            <SummaryCard
              title="Not Started"
              value={
                summary.notStarted
              }
              detail="Configured timeline trigger not reached"
            />

            <SummaryCard
              title="Date Unavailable"
              value={
                summary
                  .completedDateUnavailable
              }
              detail="Historical milestone exists but exact completion date cannot be safely reconstructed"
            />

            <SummaryCard
              title="Total Timeline Records"
              value={
                summary.total
              }
            />
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-lg font-bold text-gray-800">
              Filters
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target
                      .value,
                  )
                }
                placeholder="Project / customer / phone / K No."
                className="rounded-xl border p-3"
              />

              <select
                value={
                  ruleIdFilter
                }
                onChange={(e) =>
                  setRuleIdFilter(
                    e.target
                      .value,
                  )
                }
                className="rounded-xl border p-3"
              >
                <option value="">
                  All Timeline Rules
                </option>

                {rules
                  .filter(
                    (rule) =>
                      rule.isActive,
                  )
                  .map(
                    (rule) => (
                      <option
                        key={
                          rule.id
                        }
                        value={
                          rule.id
                        }
                      >
                        {
                          rule.name
                        }
                      </option>
                    ),
                  )}
              </select>

              <select
                value={
                  moduleFilter
                }
                onChange={(e) =>
                  setModuleFilter(
                    e.target
                      .value,
                  )
                }
                className="rounded-xl border p-3"
              >
                <option value="">
                  All Modules
                </option>

                {options
                  ?.modules
                  ?.map(
                    (item) => (
                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >
                        {
                          item.label
                        }
                      </option>
                    ),
                  )}
              </select>

              <select
                value={
                  statusFilter
                }
                onChange={(e) =>
                  setStatusFilter(
                    e.target
                      .value,
                  )
                }
                className="rounded-xl border p-3"
              >
                <option value="">
                  All Timeline Status
                </option>

                <option value="DELAYED">
                  Delayed
                </option>

                <option value="DUE_TODAY">
                  Due Today
                </option>

                <option value="IN_TIMELINE">
                  In Timeline
                </option>

                <option value="NOT_STARTED">
                  Not Started
                </option>

                <option value="COMPLETED_ON_TIME">
                  Completed On Time
                </option>

                <option value="COMPLETED_LATE">
                  Completed Late
                </option>

                <option value="COMPLETED_DATE_UNAVAILABLE">
                  Completion Date Unavailable
                </option>
              </select>

              <select
                value={
                  projectTypeFilter
                }
                onChange={(e) =>
                  setProjectTypeFilter(
                    e.target
                      .value,
                  )
                }
                className="rounded-xl border p-3"
              >
                <option value="">
                  All Project Types
                </option>

                <option value="CASH">
                  Cash
                </option>

                <option value="LOAN">
                  Loan
                </option>
              </select>

              <select
                value={
                  workStateFilter
                }
                onChange={(e) =>
                  setWorkStateFilter(
                    e.target
                      .value,
                  )
                }
                className="rounded-xl border p-3"
              >
                <option value="">
                  All Work States
                </option>

                <option value="IN_PROCESS">
                  In Process
                </option>

                <option value="RUNNING">
                  Running
                </option>
              </select>

              <input
                list="timeline-branch-options"
                value={
                  branchFilter
                }
                onChange={(e) =>
                  setBranchFilter(
                    e.target
                      .value,
                  )
                }
                placeholder="Search / select branch"
                className="rounded-xl border p-3"
              />

              <datalist id="timeline-branch-options">
                {branchOptions.map(
                  (branch) => (
                    <option
                      key={
                        branch
                      }
                      value={
                        branch
                      }
                    />
                  ),
                )}
              </datalist>

              <select
                value={
                  ownerIdFilter
                }
                onChange={(e) =>
                  setOwnerIdFilter(
                    e.target
                      .value,
                  )
                }
                className="rounded-xl border p-3"
              >
                <option value="">
                  All Project Owners
                </option>

                {ownerOptions.map(
                  (owner) => (
                    <option
                      key={
                        owner.id
                      }
                      value={
                        owner.id
                      }
                    >
                      {
                        owner.name
                      }
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={
                  applyFilters
                }
                disabled={
                  loading
                }
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {loading
                  ? 'Loading...'
                  : 'Apply Filters'}
              </button>

              <button
                type="button"
                onClick={
                  clearFilters
                }
                disabled={
                  loading
                }
                className="rounded-xl bg-gray-200 px-5 py-3 font-semibold text-gray-800 disabled:opacity-60"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow md:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-gray-800">
                Timeline List
              </h2>

              <p className="text-sm text-gray-500">
                {
                  pagination.total
                }{' '}
                matching record(s)
              </p>
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-gray-500">
                Loading timeline records...
              </p>
            ) : rows.length ===
              0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No timeline records found.
              </p>
            ) : (
              <div className="space-y-4">
                {rows.map(
                  (row) => (
                    <div
                      key={`${row.projectId}-${row.ruleId}`}
                      className="rounded-2xl border bg-white p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              {
                                row.ruleName
                              }
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                                row.status,
                              )}`}
                            >
                              {formatLabel(
                                row.status,
                              )}
                            </span>
                          </div>

                          <p className="mt-1 font-semibold text-gray-800">
                            Project #
                            {
                              row.projectId
                            }{' '}
                            —{' '}
                            {
                              row.customerName ||
                              '-'
                            }
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Phone:{' '}
                            {
                              row.customerPhone ||
                              '-'
                            }{' '}
                            | K No:{' '}
                            {
                              row.electricityKNumber ||
                              '-'
                            }
                          </p>
                        </div>

                        <div className="text-left lg:text-right">
                          {row.status ===
                            'DELAYED' ||
                          row.status ===
                            'COMPLETED_LATE' ? (
                            <p className="text-lg font-bold text-red-600">
                              {Number(
                                row.delayDays ||
                                  0,
                              )}{' '}
                              day(s)
                              delayed
                            </p>
                          ) : row.status ===
                            'IN_TIMELINE' ? (
                            <p className="font-bold text-blue-600">
                              {Number(
                                row.daysRemaining ||
                                  0,
                              )}{' '}
                              day(s)
                              remaining
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">
                            Trigger
                          </p>

                          <p className="mt-1 font-semibold text-gray-800">
  {row.triggerType ===
  'PROJECT_CREATED'
    ? 'Project Creation Date'
    : `${row.triggerValue}% Payment`}
</p>

                          <p className="mt-1 text-sm text-gray-600">
                            {formatDate(
                              row.triggerDate,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">
                            Target
                          </p>

                          <p className="mt-1 font-semibold text-gray-800">
                            {formatLabel(
                              row.targetModule,
                            )}
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            {formatLabel(
                              row.targetMilestone,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">
                            Allowed / Due
                          </p>

                          <p className="mt-1 font-semibold text-gray-800">
                            {
                              row.allowedDays
                            }{' '}
                            day(s)
                          </p>

                          <p className="mt-1 text-sm text-gray-600">
                            Due:{' '}
                            {formatDate(
                              row.dueDate,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">
                            Completion
                          </p>

                          <p className="mt-1 font-semibold text-gray-800">
                            {formatDate(
                              row.completedDate,
                            )}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {formatLabel(
                              row.completionSource,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">
                            Project
                          </p>

                          <p className="mt-1 font-semibold">
                            {formatLabel(
                              row.projectType,
                            )}
                          </p>

                          <p className="text-sm text-gray-600">
                            {formatLabel(
                              row.projectWorkState,
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">
                            Branch / City
                          </p>

                          <p className="mt-1 font-semibold">
                            {
                              row.branchName ||
                              '-'
                            }
                          </p>

                          <p className="text-sm text-gray-600">
                            {
                              row.city ||
                              '-'
                            }
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
                          <p className="text-xs text-gray-500">
                            Project Owner
                          </p>

                          <p className="mt-1 font-semibold">
                            {
                              row.projectOwnerName ||
                              '-'
                            }
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3">
  <p className="text-xs text-gray-500">
    {row.triggerType ===
    'PROJECT_CREATED'
      ? 'Trigger Basis'
      : 'Payment Trigger'}
  </p>

  {row.triggerType ===
  'PROJECT_CREATED' ? (
    <>
      <p className="mt-1 font-semibold">
        Project Creation
      </p>

      <p className="text-xs text-gray-500">
        Project:{' '}
        {formatCurrency(
          row.projectAmount,
        )}
      </p>
    </>
  ) : (
    <>
      <p className="mt-1 font-semibold">
        {formatCurrency(
          row.triggerThresholdAmount,
        )}
      </p>

      <p className="text-xs text-gray-500">
        Project:{' '}
        {formatCurrency(
          row.projectAmount,
        )}
      </p>
    </>
  )}
</div>
                      </div>

                      {row.hasDelayExplanation ? (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-amber-800">
                                Delay Explanation Submitted
                              </p>

                              <p className="mt-1 text-sm text-gray-700">
                                {
                                  row.latestDelayRemark
                                }
                              </p>

                              {row.expectedResolutionDate ? (
                                <p className="mt-1 text-xs text-gray-600">
                                  Expected Resolution:{' '}
                                  {formatDate(
                                    row.expectedResolutionDate,
                                  )}
                                </p>
                              ) : null}
                            </div>

                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700">
                              {
                                row.delayProofCount
                              }{' '}
                              proof(s)
                            </span>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/project/${row.projectId}`,
                            )
                          }
                          className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white"
                        >
                          Open Project
                        </button>

                        {(row.status ===
                          'DELAYED' ||
                          row.status ===
                            'COMPLETED_LATE') ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDelayRow(
                                row,
                              );

                              setDelayRemark(
                                '',
                              );

                              setExpectedResolutionDate(
                                '',
                              );

                              setDelayFiles(
                                [],
                              );
                            }}
                            className="rounded-xl bg-amber-500 px-4 py-2 font-semibold text-white"
                          >
                            Add Delay Explanation
                          </button>
                        ) : null}

                        {row.hasDelayExplanation ? (
                          <button
                            type="button"
                            onClick={() =>
                              openDelayHistory(
                                row,
                              )
                            }
                            className="rounded-xl bg-gray-200 px-4 py-2 font-semibold text-gray-800"
                          >
                            View Delay History
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t pt-4">
              <button
                type="button"
                disabled={
                  page <= 1 ||
                  loading
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.max(
                        current -
                          1,
                        1,
                      ),
                  )
                }
                className="rounded-xl bg-gray-200 px-4 py-2 font-semibold disabled:opacity-50"
              >
                Previous
              </button>

              <p className="text-sm font-semibold text-gray-700">
                Page {page} of{' '}
                {
                  pagination.totalPages
                }
              </p>

              <button
                type="button"
                disabled={
                  page >=
                    pagination.totalPages ||
                  loading
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.min(
                        current +
                          1,
                        pagination.totalPages,
                      ),
                  )
                }
                className="rounded-xl bg-gray-200 px-4 py-2 font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : null}

      {activeTab ===
        'SETTINGS' &&
      isOwner ? (
        <>
          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-xl font-bold text-gray-900">
              {editingRuleId
                ? 'Edit Timeline Rule'
                : 'Add Timeline Rule'}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Configure timelines using actual CRM activities/statuses. No timeline duration or payment percentage is hardcoded.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input
                value={
                  ruleForm.name
                }
                onChange={(e) =>
                  setRuleForm(
                    (
                      current,
                    ) => ({
                      ...current,
                      name:
                        e.target
                          .value,
                    }),
                  )
                }
                placeholder="Timeline rule name"
                className="rounded-xl border p-3"
              />

              <select
                value={
                  ruleForm
                    .triggerType
                }
                onChange={(e) => {
  const triggerType =
    e.target.value;

  setRuleForm(
    (
      current,
    ) => ({
      ...current,

      triggerType,

      triggerValue:
        triggerType ===
        'PAYMENT_PERCENT_REACHED'
          ? current.triggerValue ||
            '20'
          : '0',
    }),
  );
}}
                className="rounded-xl border p-3"
              >
                {options
                  ?.triggerTypes
                  ?.map(
                    (item) => (
                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >
                        {
                          item.label
                        }
                      </option>
                    ),
                  )}
              </select>

              {ruleForm.triggerType ===
'PAYMENT_PERCENT_REACHED' ? (
  <div>
    <p className="mb-1 text-xs font-semibold text-gray-600">
      Trigger Payment %
    </p>

    <input
      type="number"
      min="1"
      max="100"
      value={
        ruleForm
          .triggerValue
      }
      onChange={(e) =>
        setRuleForm(
          (
            current,
          ) => ({
            ...current,
            triggerValue:
              e.target
                .value,
          }),
        )
      }
      className="w-full rounded-xl border p-3"
    />
  </div>
) : null}

              <select
                value={
                  ruleForm
                    .targetModule
                }
                onChange={(e) => {
                  const targetModule =
                    e.target
                      .value;

                  setRuleForm(
                    (
                      current,
                    ) => ({
                      ...current,

                      targetModule,

                      targetMilestone:
                        '',

                      targetValue:
                        '',

                      applicableProjectType:
                        targetModule ===
                        'LOAN'
                          ? 'LOAN'
                          : current
                              .applicableProjectType,
                    }),
                  );
                }}
                className="rounded-xl border p-3"
              >
                {options
                  ?.modules
                  ?.map(
                    (item) => (
                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >
                        {
                          item.label
                        }
                      </option>
                    ),
                  )}
              </select>

              <div>
                <p className="mb-1 text-xs font-semibold text-gray-600">
                  Target Activity / Milestone
                </p>

                <input
                  list="timeline-milestone-options"
                  value={
                    ruleForm
                      .targetMilestone
                  }
                  onChange={(e) =>
                    setRuleForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        targetMilestone:
                          e.target
                            .value,
                      }),
                    )
                  }
                  placeholder="Search activity / status"
                  className="w-full rounded-xl border p-3"
                />

                <datalist id="timeline-milestone-options">
                  {milestoneOptions.map(
                    (item) => (
                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >
                        {
                          item.label
                        }
                      </option>
                    ),
                  )}
                </datalist>
              </div>

              {ruleForm.targetModule ===
              'PAYMENT' ? (
                <div>
                  <p className="mb-1 text-xs font-semibold text-gray-600">
                    Target Payment %
                  </p>

                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={
                      ruleForm
                        .targetValue
                    }
                    onChange={(e) =>
                      setRuleForm(
                        (
                          current,
                        ) => ({
                          ...current,

                          targetValue:
                            e.target
                              .value,
                        }),
                      )
                    }
                    placeholder="100"
                    className="w-full rounded-xl border p-3"
                  />
                </div>
              ) : null}

<div>
  <p className="mb-1 text-xs font-semibold text-gray-600">
    Applicable Project Type
  </p>
              <select
                disabled={
                  ruleForm.targetModule ===
                  'LOAN'
                }
                value={
                  ruleForm
                    .applicableProjectType
                }
                onChange={(e) =>
                  setRuleForm(
                    (
                      current,
                    ) => ({
                      ...current,

                      applicableProjectType:
                        e.target
                          .value,
                    }),
                  )
                }
                className="rounded-xl border p-3 disabled:bg-gray-100"
              >
                {options
                  ?.applicableProjectTypes
                  ?.map(
                    (item) => (
                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >
                        {
                          item.label
                        }
                      </option>
                    ),
                  )}
              </select>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-gray-600">
                  Allowed Days
                </p>

                <input
                  type="number"
                  min="0"
                  value={
                    ruleForm
                      .allowedDays
                  }
                  onChange={(e) =>
                    setRuleForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        allowedDays:
                          e.target
                            .value,
                      }),
                    )
                  }
                  className="w-full rounded-xl border p-3"
                />
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-gray-600">
                  Sort Order
                </p>

                <input
                  type="number"
                  min="0"
                  value={
                    ruleForm
                      .sortOrder
                  }
                  onChange={(e) =>
                    setRuleForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        sortOrder:
                          e.target
                            .value,
                      }),
                    )
                  }
                  className="w-full rounded-xl border p-3"
                />
              </div>

              <label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={
                    ruleForm
                      .requireDelayExplanation
                  }
                  onChange={(e) =>
                    setRuleForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        requireDelayExplanation:
                          e.target
                            .checked,
                      }),
                    )
                  }
                />

                Require Delay Explanation
              </label>

              <label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={
                    ruleForm
                      .requireDelayPhoto
                  }
                  onChange={(e) =>
                    setRuleForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        requireDelayPhoto:
                          e.target
                            .checked,
                      }),
                    )
                  }
                />

                Require Delay Photo
              </label>

              <label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={
                    ruleForm
                      .isActive
                  }
                  onChange={(e) =>
                    setRuleForm(
                      (
                        current,
                      ) => ({
                        ...current,

                        isActive:
                          e.target
                            .checked,
                      }),
                    )
                  }
                />

                Active
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={
                  saveRule
                }
                disabled={
                  savingRule
                }
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {savingRule
                  ? 'Saving...'
                  : editingRuleId
                    ? 'Update Rule'
                    : 'Add Rule'}
              </button>

              {editingRuleId ? (
                <button
                  type="button"
                  onClick={
                    resetRuleForm
                  }
                  className="rounded-xl bg-gray-200 px-5 py-3 font-semibold text-gray-800"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-gray-900">
                Configured Timeline Rules
              </h2>

              <span className="text-sm text-gray-500">
                {
                  rules.length
                }{' '}
                rule(s)
              </span>
            </div>

            {settingsLoading ? (
              <p className="py-6 text-center text-gray-500">
                Loading rules...
              </p>
            ) : (
              <div className="space-y-3">
                {rules.map(
                  (rule) => (
                    <div
                      key={
                        rule.id
                      }
                      className="rounded-xl border p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-gray-900">
                              {
                                rule.name
                              }
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                rule.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {rule.isActive
                                ? 'ACTIVE'
                                : 'INACTIVE'}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-gray-700">
                            Trigger:{' '}
                            <strong>
  {rule.triggerType ===
  'PROJECT_CREATED'
    ? 'Project Creation Date'
    : `${Number(
        rule.triggerValue ||
          0,
      )}% Payment`}
</strong>
                            {' → '}
                            {formatLabel(
                              rule.targetModule,
                            )}
                            {' → '}
                            {formatLabel(
                              rule.targetMilestone,
                            )}
                          </p>

                          {rule.targetModule ===
                            'PAYMENT' &&
                          rule.targetValue ? (
                            <p className="mt-1 text-sm text-gray-600">
                              Target Payment:{' '}
                              {
                                Number(
                                  rule.targetValue,
                                )
                              }
                              %
                            </p>
                          ) : null}

                          <p className="mt-1 text-sm text-gray-600">
                            Allowed:{' '}
                            {
                              rule.allowedDays
                            }{' '}
                            day(s) | Projects:{' '}
                            {formatLabel(
                              rule.applicableProjectType,
                            )}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Explanation:{' '}
                            {rule.requireDelayExplanation
                              ? 'Required'
                              : 'Optional'}
                            {' | '}
                            Photo:{' '}
                            {rule.requireDelayPhoto
                              ? 'Required'
                              : 'Optional'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              startEditRule(
                                rule,
                              )
                            }
                            className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleRuleActive(
                                rule,
                              )
                            }
                            className={`rounded-xl px-4 py-2 font-semibold text-white ${
                              rule.isActive
                                ? 'bg-red-500'
                                : 'bg-green-600'
                            }`}
                          >
                            {rule.isActive
                              ? 'Deactivate'
                              : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </>
      ) : null}

      {delayRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Add Delay Explanation
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {
                    delayRow.ruleName
                  }{' '}
                  — Project #
                  {
                    delayRow.projectId
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDelayRow(
                    null,
                  )
                }
                className="rounded-lg bg-gray-100 px-3 py-2 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="mb-1 text-sm font-semibold text-gray-700">
                  Delay Reason / Remark
                </p>

                <textarea
                  value={
                    delayRemark
                  }
                  onChange={(e) =>
                    setDelayRemark(
                      e.target
                        .value,
                    )
                  }
                  rows={5}
                  placeholder="Explain the genuine reason for the delay..."
                  className="w-full rounded-xl border p-3"
                />
              </div>

              <div>
                <p className="mb-1 text-sm font-semibold text-gray-700">
                  Expected Resolution Date
                </p>

                <input
                  type="date"
                  value={
                    expectedResolutionDate
                  }
                  onChange={(e) =>
                    setExpectedResolutionDate(
                      e.target
                        .value,
                    )
                  }
                  className="w-full rounded-xl border p-3"
                />
              </div>

              <div>
                <p className="mb-1 text-sm font-semibold text-gray-700">
                  Photo Proof
                </p>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    setDelayFiles(
                      Array.from(
                        e.target
                          .files ||
                          [],
                      ),
                    )
                  }
                  className="w-full rounded-xl border p-3"
                />

                {delayFiles.length >
                0 ? (
                  <p className="mt-1 text-xs text-gray-500">
                    {
                      delayFiles.length
                    }{' '}
                    file(s) selected
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={
                  submitDelayExplanation
                }
                disabled={
                  delaySaving
                }
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {delaySaving
                  ? 'Saving...'
                  : 'Save Explanation'}
              </button>

              <button
                type="button"
                onClick={() =>
                  setDelayRow(
                    null,
                  )
                }
                disabled={
                  delaySaving
                }
                className="rounded-xl bg-gray-200 px-5 py-3 font-semibold text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {historyRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Delay History
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {
                    historyRow.ruleName
                  }{' '}
                  — Project #
                  {
                    historyRow.projectId
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setHistoryRow(
                    null,
                  )
                }
                className="rounded-lg bg-gray-100 px-3 py-2 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-5">
              {delayNotesLoading ? (
                <p className="py-6 text-center text-gray-500">
                  Loading delay history...
                </p>
              ) : delayNotes.length ===
                0 ? (
                <p className="py-6 text-center text-gray-500">
                  No delay explanations found.
                </p>
              ) : (
                <div className="space-y-4">
                  {delayNotes.map(
                    (note) => (
                      <div
                        key={
                          note.id
                        }
                        className="rounded-xl border p-4"
                      >
                        <p className="font-semibold text-gray-900">
                          {
                            note.remark
                          }
                        </p>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span>
                            Added By:{' '}
                            {
                              note.createdByName ||
                              '-'
                            }
                          </span>

                          <span>
                            Added:{' '}
                            {formatDate(
                              note.createdAt,
                            )}
                          </span>

                          {note.expectedResolutionDate ? (
                            <span>
                              Expected Resolution:{' '}
                              {formatDate(
                                note.expectedResolutionDate,
                              )}
                            </span>
                          ) : null}
                        </div>

                        {note.proofs &&
                        note.proofs
                          .length >
                          0 ? (
                          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                            {note.proofs.map(
                              (
                                proof,
                              ) => (
                                <a
                                  key={
                                    proof.id
                                  }
                                  href={
                                    proof.fileUrl
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="overflow-hidden rounded-xl border"
                                >
                                  <img
                                    src={
                                      proof.fileUrl
                                    }
                                    alt="Delay proof"
                                    className="h-32 w-full object-cover"
                                  />
                                </a>
                              ),
                            )}
                          </div>
                        ) : null}
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
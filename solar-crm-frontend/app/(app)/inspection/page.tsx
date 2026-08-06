'use client';

import {
  useEffect,
  useState,
} from 'react';

import axios from 'axios';
import Link from 'next/link';
import TextField from '@mui/material/TextField';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type InspectionProject = {
  id: number;

  customerId?: number;
  customerCode?: string;
  customerName?: string;
  customerPhone?: string;

  city?: string;
  zone?: string;
  branchName?: string;

  address?: string;
  gpsAddress?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;

  projectStatus?: string;
  projectWorkState?: string;
  projectSource?: string;

  isLegacyProject?: boolean;
  legacyYear?: number;

  panelBrand?: string;
  dcrPanelCount?: number;
  nonDcrPanelCount?: number;

  converterBrand?: string;
  converterCapacity?: string;

  structureType?: string;
  structureCapacityKw?: string;
  projectSize?: string;

  finalCost?: number;
  projectCost?: number;
  netAmount?: number;

  inspectionCount?: number;
  pendingDefects?: number;

  lastInspection?: {
    id: number;
    status?: string;
    overallCondition?: string;
    inspectionDate?: string;
    inspectionManagerName?: string;
    defectsFound?: boolean;
  } | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type InspectionAnalyticsSummary = {
  totalVisits: number;
  completedVisits: number;
  uniqueSitesVisited: number;
  defectsFound: number;
  pendingDefects: number;
  resolvedDefects: number;
  followUpRequired: number;
  criticalInspections: number;
};

type ManagerAnalytics = {
  inspectionManagerId?: number | null;
  inspectionManagerName?: string;
  totalVisits: number;
  uniqueSites: number;
  defectsFound: number;
};

type CityAnalytics = {
  city?: string;
  totalVisits: number;
  uniqueSites: number;
  defectsFound: number;
};

type ComponentAnalytics = {
  componentType?: string;
  totalDefects: number;
  pending: number;
  resolved: number;
};

type InspectionAnalytics = {
  summary: InspectionAnalyticsSummary;
  managerWise: ManagerAnalytics[];
  cityWise: CityAnalytics[];
  componentWise: ComponentAnalytics[];
  inspections:
  InspectionVisit[];

visitPagination:
  VisitPagination;

defects: any[];
};

type InspectionVisit = {
  id: number;
  projectId: number;

  customerId?: number;
  customerCode?: string;
  customerName?: string;
  customerPhone?: string;

  city?: string;
  zone?: string;
  branchName?: string;

  projectStatus?: string;
  projectWorkState?: string;

  inspectionManagerId?: number;
  inspectionManagerName?: string;
  inspectionManagerRole?: string;

  status?: string;
  overallCondition?: string;

  inspectionDate?: string;
  startedAt?: string;
  completedAt?: string;

  visitAddress?: string;
  visitLatitude?: number;
  visitLongitude?: number;

  comments?: string;

  defectsFound?: boolean;
  followUpRequired?: boolean;
  nextInspectionDate?: string;

  createdAt?: string;
};

type VisitPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const emptyAnalytics: InspectionAnalytics = {
  summary: {
    totalVisits: 0,
    completedVisits: 0,
    uniqueSitesVisited: 0,
    defectsFound: 0,
    pendingDefects: 0,
    resolvedDefects: 0,
    followUpRequired: 0,
    criticalInspections: 0,
  },

  managerWise: [],
  cityWise: [],
  componentWise: [],
  inspections: [],

visitPagination: {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
},

defects: [],
};

const emptyPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

function formatLabel(
  value?: string,
) {
  return String(
    value || '-',
  ).replaceAll('_', ' ');
}

function formatDate(
  value?: string,
) {
  if (!value) {
    return '-';
  }

  return new Date(
    value,
  ).toLocaleString('en-IN');
}

function formatMoney(
  value?: number,
) {
  return `₹${Number(
    value || 0,
  ).toLocaleString('en-IN')}`;
}

export default function InspectionPage() {
  const [items, setItems] =
    useState<InspectionProject[]>([]);

  const [
    pagination,
    setPagination,
  ] =
    useState<Pagination>(
      emptyPagination,
    );

  const [loading, setLoading] =
    useState(false);

    const [
  analytics,
  setAnalytics,
] = useState<InspectionAnalytics>(
  emptyAnalytics,
);

const [
  analyticsLoading,
  setAnalyticsLoading,
] = useState(false);

const [
  visitPage,
  setVisitPage,
] = useState(1);

const [
  visitLimit,
  setVisitLimit,
] = useState(20);

const [
  managerOptions,
  setManagerOptions,
] = useState<ManagerAnalytics[]>([]);

const [
  analyticsFilters,
  setAnalyticsFilters,
] = useState({
  month: '',
  fromDate: '',
  toDate: '',
  inspectionManagerId: '',
  city: '',
  zone: '',
  branchName: '',
  projectStatus: '',
  overallCondition: '',
  inspectionStatus: '',
  componentType: '',
  qualityStatus: '',
  severity: '',
  resolutionStatus: '',
});

  const [search, setSearch] =
    useState('');

  const [city, setCity] =
    useState('');

  const [zone, setZone] =
    useState('');

  const [
    branchName,
    setBranchName,
  ] = useState('');

  const [
    projectStatus,
    setProjectStatus,
  ] = useState('');

  const [
    projectWorkState,
    setProjectWorkState,
  ] = useState('');

  const [
    projectType,
    setProjectType,
  ] = useState('');

  const [
    legacyYear,
    setLegacyYear,
  ] = useState('');

  const [page, setPage] =
    useState(1);

  const [limit, setLimit] =
    useState(20);

  const getHeaders = () => {
    const token =
      localStorage.getItem(
        'token',
      );

    return token
      ? {
          Authorization:
            `Bearer ${token}`,
        }
      : {};
  };

  const getAnalyticsDateRange = () => {
  if (
    analyticsFilters.month
  ) {
    const monthStart =
      new Date(
        `${analyticsFilters.month}-01T00:00:00`,
      );

    if (
      !Number.isNaN(
        monthStart.getTime(),
      )
    ) {
      const monthEnd =
        new Date(
          monthStart.getFullYear(),
          monthStart.getMonth() + 1,
          0,
        );

      const formatDateValue = (
        date: Date,
      ) => {
        const year =
          date.getFullYear();

        const month =
          String(
            date.getMonth() + 1,
          ).padStart(2, '0');

        const day =
          String(
            date.getDate(),
          ).padStart(2, '0');

        return `${year}-${month}-${day}`;
      };

      return {
        fromDate:
          formatDateValue(
            monthStart,
          ),

        toDate:
          formatDateValue(
            monthEnd,
          ),
      };
    }
  }

  return {
    fromDate:
      analyticsFilters.fromDate ||
      '',

    toDate:
      analyticsFilters.toDate ||
      '',
  };
};

  const fetchProjects =
    async () => {
      try {
        setLoading(true);

        const response =
          await axios.get(
            `${API_BASE_URL}/project/inspections/projects`,
            {
              params: {
                page,
                limit,

                search:
                  search.trim() ||
                  undefined,

                city:
                  city.trim() ||
                  undefined,

                zone:
                  zone.trim() ||
                  undefined,

                branchName:
                  branchName.trim() ||
                  undefined,

                projectStatus:
                  projectStatus ||
                  undefined,

                projectWorkState:
                  projectWorkState ||
                  undefined,

                projectType:
                  projectType ||
                  undefined,

                legacyYear:
                  legacyYear ||
                  undefined,
              },

              headers:
                getHeaders(),
            },
          );

        setItems(
          Array.isArray(
            response.data?.data,
          )
            ? response.data.data
            : [],
        );

        setPagination({
          page: Number(
            response.data
              ?.pagination?.page ||
              page,
          ),

          limit: Number(
            response.data
              ?.pagination?.limit ||
              limit,
          ),

          total: Number(
            response.data
              ?.pagination?.total ||
              0,
          ),

          totalPages:
            Math.max(
              Number(
                response.data
                  ?.pagination
                  ?.totalPages ||
                  1,
              ),
              1,
            ),
        });
      } catch (error: any) {
        console.error(error);

        alert(
          error?.response?.data
            ?.message ||
            'Failed to load inspection projects',
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchInspectionAnalytics =
  async () => {
    try {
      setAnalyticsLoading(
        true,
      );

      const dateRange =
        getAnalyticsDateRange();

      const response =
        await axios.get(
          `${API_BASE_URL}/project/inspections/analytics`,
          {
            params: {
              fromDate:
                dateRange.fromDate ||
                undefined,

              toDate:
                dateRange.toDate ||
                undefined,

              inspectionManagerId:
                analyticsFilters
                  .inspectionManagerId ||
                undefined,

              city:
                analyticsFilters.city
                  .trim() ||
                undefined,

              zone:
                analyticsFilters.zone
                  .trim() ||
                undefined,

              branchName:
                analyticsFilters
                  .branchName
                  .trim() ||
                undefined,

              projectStatus:
                analyticsFilters
                  .projectStatus ||
                undefined,

              overallCondition:
                analyticsFilters
                  .overallCondition ||
                undefined,

              inspectionStatus:
                analyticsFilters
                  .inspectionStatus ||
                undefined,

              componentType:
                analyticsFilters
                  .componentType ||
                undefined,

              qualityStatus:
                analyticsFilters
                  .qualityStatus ||
                undefined,

              severity:
                analyticsFilters
                  .severity ||
                undefined,

              resolutionStatus:
                analyticsFilters
                  .resolutionStatus ||
                undefined,

                visitPage,
visitLimit,
            },

            headers:
              getHeaders(),
          },
        );

      const result:
        InspectionAnalytics = {
        summary: {
          ...emptyAnalytics.summary,
          ...(response.data
            ?.summary || {}),
        },

        managerWise:
          Array.isArray(
            response.data
              ?.managerWise,
          )
            ? response.data
                .managerWise
            : [],

        cityWise:
          Array.isArray(
            response.data
              ?.cityWise,
          )
            ? response.data
                .cityWise
            : [],

        componentWise:
          Array.isArray(
            response.data
              ?.componentWise,
          )
            ? response.data
                .componentWise
            : [],

        inspections:
  Array.isArray(
    response.data
      ?.inspections,
  )
    ? response.data
        .inspections
    : [],

visitPagination: {
  page:
    Number(
      response.data
        ?.visitPagination
        ?.page || 1,
    ),

  limit:
    Number(
      response.data
        ?.visitPagination
        ?.limit ||
        visitLimit,
    ),

  total:
    Number(
      response.data
        ?.visitPagination
        ?.total || 0,
    ),

  totalPages:
    Math.max(
      Number(
        response.data
          ?.visitPagination
          ?.totalPages ||
          1,
      ),
      1,
    ),
},

defects:
          Array.isArray(
            response.data
              ?.defects,
          )
            ? response.data
                .defects
            : [],
      };

      setAnalytics(result);

      /*
       * Preserve discovered managers even
       * after a manager filter is applied.
       */
      setManagerOptions(
        (previous) => {
          const managerMap =
            new Map<
              string,
              ManagerAnalytics
            >();

          for (const item of [
            ...previous,
            ...result.managerWise,
          ]) {
            const key =
              String(
                item.inspectionManagerId ||
                  item.inspectionManagerName ||
                  '',
              );

            if (key) {
              managerMap.set(
                key,
                item,
              );
            }
          }

          return Array.from(
            managerMap.values(),
          ).sort((a, b) =>
            String(
              a.inspectionManagerName ||
                '',
            ).localeCompare(
              String(
                b.inspectionManagerName ||
                  '',
              ),
            ),
          );
        },
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data
          ?.message ||
          'Failed to load inspection analytics',
      );
    } finally {
      setAnalyticsLoading(
        false,
      );
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCity('');
    setZone('');
    setBranchName('');
    setProjectStatus('');
    setProjectWorkState('');
    setProjectType('');
    setLegacyYear('');
    setPage(1);
  };

  const resetAnalyticsFilters =
  () => {
    setAnalyticsFilters({
      month: '',
      fromDate: '',
      toDate: '',
      inspectionManagerId: '',
      city: '',
      zone: '',
      branchName: '',
      projectStatus: '',
      overallCondition: '',
      inspectionStatus: '',
      componentType: '',
      qualityStatus: '',
      severity: '',
      resolutionStatus: '',
    });
    setVisitPage(1);
  };

  const openNavigation = (
    project:
      InspectionProject,
  ) => {
    const latitude =
      Number(
        project.gpsLatitude ||
          0,
      );

    const longitude =
      Number(
        project.gpsLongitude ||
          0,
      );

    if (
      latitude &&
      longitude
    ) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
        '_blank',
        'noopener,noreferrer',
      );

      return;
    }

    const address =
      String(
        project.gpsAddress ||
          project.address ||
          '',
      ).trim();

    if (!address) {
      alert(
        'Project location is not available',
      );

      return;
    }

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        address,
      )}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        fetchProjects();
      }, 300);

    return () =>
      window.clearTimeout(
        timeoutId,
      );
  }, [
    page,
    limit,
    search,
    city,
    zone,
    branchName,
    projectStatus,
    projectWorkState,
    projectType,
    legacyYear,
  ]);

  useEffect(() => {
  const timeoutId =
    window.setTimeout(() => {
      fetchInspectionAnalytics();
    }, 350);

  return () =>
    window.clearTimeout(
      timeoutId,
    );

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [
  analyticsFilters.month,
  analyticsFilters.fromDate,
  analyticsFilters.toDate,
  analyticsFilters.inspectionManagerId,
  analyticsFilters.city,
  analyticsFilters.zone,
  analyticsFilters.branchName,
  analyticsFilters.projectStatus,
  analyticsFilters.overallCondition,
  analyticsFilters.inspectionStatus,
  analyticsFilters.componentType,
  analyticsFilters.qualityStatus,
  analyticsFilters.severity,
  analyticsFilters.resolutionStatus,
  visitPage,
visitLimit,
]);

useEffect(() => {
  setVisitPage(1);
}, [
  analyticsFilters.month,
  analyticsFilters.fromDate,
  analyticsFilters.toDate,
  analyticsFilters.inspectionManagerId,
  analyticsFilters.city,
  analyticsFilters.zone,
  analyticsFilters.branchName,
  analyticsFilters.projectStatus,
  analyticsFilters.overallCondition,
  analyticsFilters.inspectionStatus,
  analyticsFilters.componentType,
  analyticsFilters.qualityStatus,
  analyticsFilters.severity,
  analyticsFilters.resolutionStatus,
]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Inspection Management
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Audit running, completed,
          legacy and older project
          sites from one common list.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-900">
        Inspection Analytics
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Review visits, inspected sites,
        managers, cities and component
        defects.
      </p>
    </div>

    {analyticsLoading && (
      <p className="text-sm font-semibold text-blue-600">
        Updating analytics...
      </p>
    )}
  </div>

  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
    <TextField
      label="Month"
      type="month"
      fullWidth
      value={
        analyticsFilters.month
      }
      onChange={(event) =>
        setAnalyticsFilters({
          ...analyticsFilters,

          month:
            event.target.value,

          fromDate: '',
          toDate: '',
        })
      }
      slotProps={{
        inputLabel: {
          shrink: true,
        },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius:
            '0.75rem',

          height: '54px',
        },
      }}
    />

    <TextField
      label="From Date"
      type="date"
      fullWidth
      value={
        analyticsFilters.fromDate
      }
      onChange={(event) =>
        setAnalyticsFilters({
          ...analyticsFilters,

          fromDate:
            event.target.value,

          month: '',
        })
      }
      slotProps={{
        inputLabel: {
          shrink: true,
        },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius:
            '0.75rem',

          height: '54px',
        },
      }}
    />

    <TextField
      label="To Date"
      type="date"
      fullWidth
      value={
        analyticsFilters.toDate
      }
      onChange={(event) =>
        setAnalyticsFilters({
          ...analyticsFilters,

          toDate:
            event.target.value,

          month: '',
        })
      }
      slotProps={{
        inputLabel: {
          shrink: true,
        },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius:
            '0.75rem',

          height: '54px',
        },
      }}
    />

    <select
      value={
        analyticsFilters
          .inspectionManagerId
      }
      onChange={(event) =>
        setAnalyticsFilters({
          ...analyticsFilters,

          inspectionManagerId:
            event.target.value,
        })
      }
      className="rounded-xl border p-3"
    >
      <option value="">
        All Inspection Managers
      </option>

      {managerOptions.map(
        (manager) => (
          <option
            key={
              manager.inspectionManagerId ||
              manager.inspectionManagerName
            }
            value={
              manager.inspectionManagerId ||
              ''
            }
          >
            {manager.inspectionManagerName ||
              'Unknown Manager'}
          </option>
        ),
      )}
    </select>

    <input
      placeholder="City"
      value={
        analyticsFilters.city
      }
      onChange={(event) =>
        setAnalyticsFilters({
          ...analyticsFilters,

          city:
            event.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      placeholder="Zone / Region"
      value={
        analyticsFilters.zone
      }
      onChange={(event) =>
        setAnalyticsFilters({
          ...analyticsFilters,

          zone:
            event.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      placeholder="Branch"
      value={
        analyticsFilters.branchName
      }
      onChange={(event) =>
        setAnalyticsFilters({
          ...analyticsFilters,

          branchName:
            event.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <select
      value={
        analyticsFilters
          .projectStatus
      }
      onChange={(event) =>
        setAnalyticsFilters({
          ...analyticsFilters,

          projectStatus:
            event.target.value,
        })
      }
      className="rounded-xl border p-3"
    >
      <option value="">
        All Project Status
      </option>

      <option value="NEW">
        New
      </option>

      <option value="INSTALLATION">
        Installation
      </option>

      <option value="PROJECT_MANAGEMENT">
        Project Management
      </option>

      <option value="LOAN_PROCESS">
        Loan Process
      </option>

      <option value="SUBSIDY_PROCESS">
        Subsidy Process
      </option>

      <option value="ELECTRICITY_PROCESS">
        Electricity Process
      </option>

      <option value="COMPLETED">
        Completed
      </option>
    </select>

    <select
      value={
        analyticsFilters
          .inspectionStatus
      }
      onChange={(event) =>
        setAnalyticsFilters({
          ...analyticsFilters,

          inspectionStatus:
            event.target.value,
        })
      }
      className="rounded-xl border p-3"
    >
      <option value="">
        All Inspection Status
      </option>

      <option value="SCHEDULED">
        Scheduled
      </option>

      <option value="IN_PROGRESS">
        In Progress
      </option>

      <option value="COMPLETED">
        Completed
      </option>

      <option value="FOLLOW_UP_REQUIRED">
        Follow-up Required
      </option>

      <option value="CANCELLED">
        Cancelled
      </option>
    </select>

    <select
      value={
        analyticsFilters
          .overallCondition
      }
      onChange={(event) =>
        setAnalyticsFilters({
          ...analyticsFilters,

          overallCondition:
            event.target.value,
        })
      }
      className="rounded-xl border p-3"
    >
      <option value="">
        All Site Conditions
      </option>

      <option value="PASS">
        Pass
      </option>

      <option value="MINOR_DEFECT">
        Minor Defect
      </option>

      <option value="MAJOR_DEFECT">
        Major Defect
      </option>

      <option value="CRITICAL">
        Critical
      </option>
    </select>

    <select
      value={
        analyticsFilters
          .componentType
      }
      onChange={(event) =>
        setAnalyticsFilters({
          ...analyticsFilters,

          componentType:
            event.target.value,
        })
      }
      className="rounded-xl border p-3"
    >
      <option value="">
        All Components
      </option>

      <option value="STRUCTURE">
        Structure
      </option>

      <option value="PILLAR">
        Pillar
      </option>

      <option value="PANEL">
        Panel
      </option>

      <option value="INVERTER">
        Inverter
      </option>

      <option value="EARTHING">
        Earthing
      </option>

      <option value="WIRING">
        Wiring
      </option>

      <option value="SOLAR_METER">
        Solar Meter
      </option>

      <option value="NET_METER">
        Net Meter
      </option>

      <option value="OTHER">
        Other
      </option>
    </select>

    <select
      value={
        analyticsFilters
          .qualityStatus
      }
      onChange={(event) =>
        setAnalyticsFilters({
          ...analyticsFilters,

          qualityStatus:
            event.target.value,
        })
      }
      className="rounded-xl border p-3"
    >
      <option value="">
        All Quality Status
      </option>

      <option value="GOOD">
        Good
      </option>

      <option value="DEFECTIVE">
        Defective
      </option>

      <option value="NON_QUALITY">
        Non-Quality
      </option>

      <option value="NOT_INSPECTED">
        Not Inspected
      </option>
    </select>

    <select
      value={
        analyticsFilters.severity
      }
      onChange={(event) =>
        setAnalyticsFilters({
          ...analyticsFilters,

          severity:
            event.target.value,
        })
      }
      className="rounded-xl border p-3"
    >
      <option value="">
        All Severity
      </option>

      <option value="MINOR">
        Minor
      </option>

      <option value="MAJOR">
        Major
      </option>

      <option value="CRITICAL">
        Critical
      </option>
    </select>

    <select
      value={
        analyticsFilters
          .resolutionStatus
      }
      onChange={(event) =>
        setAnalyticsFilters({
          ...analyticsFilters,

          resolutionStatus:
            event.target.value,
        })
      }
      className="rounded-xl border p-3"
    >
      <option value="">
        All Resolution Status
      </option>

      <option value="PENDING">
        Pending
      </option>

      <option value="IN_PROGRESS">
        In Progress
      </option>

      <option value="RESOLVED">
        Resolved
      </option>

      <option value="NOT_REQUIRED">
        Not Required
      </option>
    </select>

    <button
      type="button"
      onClick={
        resetAnalyticsFilters
      }
      className="rounded-xl bg-gray-700 px-4 py-3 font-semibold text-white hover:bg-gray-800"
    >
      Clear Analytics Filters
    </button>
  </div>
</div>

<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
  <SummaryCard
    title="Total Visits"
    value={
      analytics.summary
        .totalVisits
    }
  />

  <SummaryCard
    title="Unique Sites Visited"
    value={
      analytics.summary
        .uniqueSitesVisited
    }
  />

  <SummaryCard
    title="Completed Visits"
    value={
      analytics.summary
        .completedVisits
    }
  />

  <SummaryCard
    title="Defects Found"
    value={
      analytics.summary
        .defectsFound
    }
  />

  <SummaryCard
    title="Pending Defects"
    value={
      analytics.summary
        .pendingDefects
    }
  />

  <SummaryCard
    title="Resolved Defects"
    value={
      analytics.summary
        .resolvedDefects
    }
  />

  <SummaryCard
    title="Follow-up Required"
    value={
      analytics.summary
        .followUpRequired
    }
  />

  <SummaryCard
    title="Critical Inspections"
    value={
      analytics.summary
        .criticalInspections
    }
  />
</div>

<div className="grid gap-5 xl:grid-cols-3">
  <AnalyticsPanel
    title="Manager-Wise Visits"
    emptyText="No manager-wise inspection data."
  >
    {analytics.managerWise.map(
      (manager) => (
        <AnalyticsRow
          key={
            manager.inspectionManagerId ||
            manager.inspectionManagerName
          }
          title={
            manager.inspectionManagerName ||
            'Unknown Manager'
          }
          lines={[
            `Visits: ${manager.totalVisits}`,
            `Sites: ${manager.uniqueSites}`,
            `Defects: ${manager.defectsFound}`,
          ]}
        />
      ),
    )}
  </AnalyticsPanel>

  <AnalyticsPanel
    title="City-Wise Visits"
    emptyText="No city-wise inspection data."
  >
    {analytics.cityWise.map(
      (cityItem) => (
        <AnalyticsRow
          key={
            cityItem.city ||
            'UNKNOWN'
          }
          title={
            cityItem.city ||
            'Unknown City'
          }
          lines={[
            `Visits: ${cityItem.totalVisits}`,
            `Sites: ${cityItem.uniqueSites}`,
            `Defects: ${cityItem.defectsFound}`,
          ]}
        />
      ),
    )}
  </AnalyticsPanel>

  <AnalyticsPanel
    title="Component Defects"
    emptyText="No component defects found."
  >
    {analytics.componentWise.map(
      (component) => (
        <AnalyticsRow
          key={
            component.componentType ||
            'UNKNOWN'
          }
          title={formatLabel(
            component.componentType,
          )}
          lines={[
            `Total: ${component.totalDefects}`,
            `Pending: ${component.pending}`,
            `Resolved: ${component.resolved}`,
          ]}
        />
      ),
    )}
  </AnalyticsPanel>
</div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Project Sites"
          value={
            pagination.total
          }
        />

        <SummaryCard
          title="Current Page"
          value={items.length}
        />

        <SummaryCard
          title="Inspected Sites"
          value={
            items.filter(
              (item) =>
                Number(
                  item
                    .inspectionCount ||
                    0,
                ) > 0,
            ).length
          }
        />

        <SummaryCard
          title="Sites With Pending Defects"
          value={
            items.filter(
              (item) =>
                Number(
                  item
                    .pendingDefects ||
                    0,
                ) > 0,
            ).length
          }
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            placeholder="Search customer, phone, code, K number or project ID"
            value={search}
            onChange={(event) => {
              setSearch(
                event.target.value,
              );

              setPage(1);
            }}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="City"
            value={city}
            onChange={(event) => {
              setCity(
                event.target.value,
              );

              setPage(1);
            }}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Zone / Region"
            value={zone}
            onChange={(event) => {
              setZone(
                event.target.value,
              );

              setPage(1);
            }}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Branch"
            value={branchName}
            onChange={(event) => {
              setBranchName(
                event.target.value,
              );

              setPage(1);
            }}
            className="rounded-xl border p-3"
          />

          <select
            value={projectStatus}
            onChange={(event) => {
              setProjectStatus(
                event.target.value,
              );

              setPage(1);
            }}
            className="rounded-xl border p-3"
          >
            <option value="">
              All Project Status
            </option>

            <option value="NEW">
              New
            </option>

            <option value="SURVEY">
              Survey
            </option>

            <option value="QUOTATION">
              Quotation
            </option>

            <option value="PAYMENT_PENDING">
              Payment Pending
            </option>

            <option value="INSTALLATION">
              Installation
            </option>

            <option value="PROJECT_MANAGEMENT">
              Project Management
            </option>

            <option value="LOAN_PROCESS">
              Loan Process
            </option>

            <option value="SUBSIDY_PROCESS">
              Subsidy Process
            </option>

            <option value="ELECTRICITY_PROCESS">
              Electricity Process
            </option>

            <option value="COMPLETED">
              Completed
            </option>
          </select>

          <select
            value={
              projectWorkState
            }
            onChange={(event) => {
              setProjectWorkState(
                event.target.value,
              );

              setPage(1);
            }}
            className="rounded-xl border p-3"
          >
            <option value="">
              All Work State
            </option>

            <option value="IN_PROCESS">
              In Process
            </option>

            <option value="RUNNING">
              Running
            </option>
          </select>

          <select
            value={projectType}
            onChange={(event) => {
              setProjectType(
                event.target.value,
              );

              setLegacyYear('');
              setPage(1);
            }}
            className="rounded-xl border p-3"
          >
            <option value="">
              All Project Sources
            </option>

            <option value="CRM">
              CRM Projects
            </option>

            <option value="LEGACY">
              Legacy Projects
            </option>
          </select>

          <input
            type="number"
            placeholder="Legacy Year"
            value={legacyYear}
            disabled={
              projectType !==
              'LEGACY'
            }
            onChange={(event) => {
              setLegacyYear(
                event.target.value,
              );

              setPage(1);
            }}
            className="rounded-xl border p-3 disabled:bg-gray-100"
          />

          <select
            value={limit}
            onChange={(event) => {
              setLimit(
                Number(
                  event.target
                    .value,
                ),
              );

              setPage(1);
            }}
            className="rounded-xl border p-3"
          >
            <option value={10}>
              10 per page
            </option>

            <option value={20}>
              20 per page
            </option>

            <option value={50}>
              50 per page
            </option>

            <option value={100}>
              100 per page
            </option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl bg-gray-800 px-4 py-3 font-semibold text-white hover:bg-black"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-900">
        Inspection Visit Register
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Complete date-wise record of
        inspected sites and submitted
        work.
      </p>
    </div>

    <div className="flex items-center gap-3">
      <p className="text-sm font-semibold text-gray-600">
        {analytics
          .visitPagination
          .total
          .toLocaleString(
            'en-IN',
          )}{' '}
        visit(s)
      </p>

      <select
        value={visitLimit}
        onChange={(event) => {
          setVisitLimit(
            Number(
              event.target
                .value,
            ),
          );

          setVisitPage(1);
        }}
        className="rounded-xl border p-2 text-sm"
      >
        <option value={10}>
          10 per page
        </option>

        <option value={20}>
          20 per page
        </option>

        <option value={50}>
          50 per page
        </option>

        <option value={100}>
          100 per page
        </option>
      </select>
    </div>
  </div>

  <div className="mt-5 overflow-x-auto">
    {analyticsLoading ? (
      <p className="py-5 text-sm text-gray-500">
        Loading inspection visits...
      </p>
    ) : analytics.inspections
        .length === 0 ? (
      <p className="py-5 text-sm text-gray-500">
        No inspection visits found
        for the selected filters.
      </p>
    ) : (
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="border p-3">
              Inspection
            </th>

            <th className="border p-3">
              Date & Time
            </th>

            <th className="border p-3">
              Inspector
            </th>

            <th className="border p-3">
              Customer / Project
            </th>

            <th className="border p-3">
              City
            </th>

            <th className="border p-3">
              Condition
            </th>

            <th className="border p-3">
              Defect
            </th>

            <th className="border p-3">
              Status
            </th>

            <th className="border p-3">
              Follow-up
            </th>

            <th className="border p-3">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {analytics.inspections.map(
            (inspection) => (
              <tr
                key={
                  inspection.id
                }
                className="align-top hover:bg-gray-50"
              >
                <td className="border p-3 font-bold text-gray-800">
                  #
                  {
                    inspection.id
                  }
                </td>

                <td className="border p-3 whitespace-nowrap">
                  {formatDate(
                    inspection
                      .inspectionDate ||
                      inspection
                        .createdAt,
                  )}
                </td>

                <td className="border p-3">
                  <p className="font-semibold text-gray-800">
                    {inspection
                      .inspectionManagerName ||
                      '-'}
                  </p>

                  {inspection
                    .inspectionManagerRole && (
                    <p className="mt-1 text-xs text-gray-500">
                      {formatLabel(
                        inspection
                          .inspectionManagerRole,
                      )}
                    </p>
                  )}
                </td>

                <td className="border p-3">
                  <p className="font-semibold text-gray-800">
                    {inspection
                      .customerName ||
                      'Customer'}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Project #
                    {
                      inspection.projectId
                    }
                    {inspection
                      .customerCode
                      ? ` · ${inspection.customerCode}`
                      : ''}
                  </p>

                  {inspection
                    .customerPhone && (
                    <a
                      href={`tel:${inspection.customerPhone}`}
                      className="mt-1 inline-block text-xs font-semibold text-green-700"
                    >
                      {
                        inspection.customerPhone
                      }
                    </a>
                  )}
                </td>

                <td className="border p-3">
                  <p>
                    {inspection.city ||
                      '-'}
                  </p>

                  {inspection
                    .branchName && (
                    <p className="mt-1 text-xs text-gray-500">
                      {
                        inspection.branchName
                      }
                    </p>
                  )}
                </td>

                <td className="border p-3">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    {formatLabel(
                      inspection
                        .overallCondition,
                    )}
                  </span>
                </td>

                <td className="border p-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      inspection
                        .defectsFound
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {inspection
                      .defectsFound
                      ? 'Found'
                      : 'None'}
                  </span>
                </td>

                <td className="border p-3">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                    {formatLabel(
                      inspection.status,
                    )}
                  </span>
                </td>

                <td className="border p-3">
                  {inspection
                    .followUpRequired ? (
                    <div>
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                        Required
                      </span>

                      {inspection
                        .nextInspectionDate && (
                        <p className="mt-2 whitespace-nowrap text-xs text-gray-500">
                          {new Date(
                            inspection
                              .nextInspectionDate,
                          ).toLocaleDateString(
                            'en-IN',
                          )}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">
                      Not required
                    </span>
                  )}
                </td>

                <td className="border p-3">
                  <Link
                    href={`/inspection/${inspection.projectId}`}
                    className="inline-flex rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600"
                  >
                    View Inspection
                  </Link>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    )}
  </div>

  {!analyticsLoading &&
    analytics
      .visitPagination
      .total > 0 && (
      <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          Showing{' '}
          {Math.min(
            (analytics
              .visitPagination
              .page -
              1) *
              analytics
                .visitPagination
                .limit +
              1,
            analytics
              .visitPagination
              .total,
          )}
          {' - '}
          {Math.min(
            analytics
              .visitPagination
              .page *
              analytics
                .visitPagination
                .limit,
            analytics
              .visitPagination
              .total,
          )}{' '}
          of{' '}
          {analytics
            .visitPagination
            .total
            .toLocaleString(
              'en-IN',
            )}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={
              analytics
                .visitPagination
                .page <= 1 ||
              analyticsLoading
            }
            onClick={() =>
              setVisitPage(
                (
                  current,
                ) =>
                  Math.max(
                    current -
                      1,
                    1,
                  ),
              )
            }
            className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <span className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
            Page{' '}
            {
              analytics
                .visitPagination
                .page
            }{' '}
            of{' '}
            {
              analytics
                .visitPagination
                .totalPages
            }
          </span>

          <button
            type="button"
            disabled={
              analytics
                .visitPagination
                .page >=
                analytics
                  .visitPagination
                  .totalPages ||
              analyticsLoading
            }
            onClick={() =>
              setVisitPage(
                (
                  current,
                ) =>
                  Math.min(
                    current +
                      1,
                    analytics
                      .visitPagination
                      .totalPages,
                  ),
              )
            }
            className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    )}
</div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            Common Inspection Pool
          </h2>

          <p className="text-sm text-gray-500">
            {pagination.total.toLocaleString(
              'en-IN',
            )}{' '}
            project site(s)
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">
              Loading inspection
              projects...
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500">
              No project sites found.
            </p>
          ) : (
            items.map(
              (project) => (
                <div
                  key={project.id}
                  className="rounded-2xl border bg-gray-50 p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-gray-900">
                          Project #
                          {project.id}
                          {' - '}
                          {project.customerName ||
                            'Customer'}
                        </h3>

                        <Badge
                          text={
                            project.projectStatus ||
                            'UNKNOWN'
                          }
                        />

                        {project
                          .isLegacyProject && (
                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                            LEGACY
                            {project
                              .legacyYear
                              ? ` ${project.legacyYear}`
                              : ''}
                          </span>
                        )}

                        {Number(
                          project
                            .pendingDefects ||
                            0,
                        ) > 0 && (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                            PENDING DEFECT
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        {project.customerCode ||
                          '-'}
                        {' · '}
                        {project.customerPhone ||
                          '-'}
                        {' · '}
                        {project.city ||
                          '-'}
                        {' · '}
                        {project.branchName ||
                          '-'}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {project.gpsAddress ||
                          project.address ||
                          'Project location not available'}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Info
                          title="Panel"
                          value={
                            project.panelBrand ||
                            '-'
                          }
                        />

                        <Info
                          title="Panel Count"
                          value={String(
                            Number(
                              project
                                .dcrPanelCount ||
                                0,
                            ) +
                              Number(
                                project
                                  .nonDcrPanelCount ||
                                  0,
                              ),
                          )}
                        />

                        <Info
                          title="Inverter"
                          value={
                            [
                              project
                                .converterBrand,
                              project
                                .converterCapacity,
                            ]
                              .filter(
                                Boolean,
                              )
                              .join(
                                ' | ',
                              ) ||
                            '-'
                          }
                        />

                        <Info
                          title="Structure"
                          value={
                            [
                              project
                                .structureType,
                              project
                                .structureCapacityKw,
                            ]
                              .filter(
                                Boolean,
                              )
                              .join(
                                ' | ',
                              ) ||
                            '-'
                          }
                        />

                        <Info
                          title="Project Cost"
                          value={formatMoney(
                            Number(
                              project.finalCost ||
                                project.netAmount ||
                                project.projectCost ||
                                0,
                            ),
                          )}
                        />

                        <Info
                          title="Inspections"
                          value={String(
                            project
                              .inspectionCount ||
                              0,
                          )}
                        />

                        <Info
                          title="Last Inspection"
                          value={formatDate(
                            project
                              .lastInspection
                              ?.inspectionDate,
                          )}
                        />

                        <Info
                          title="Last Condition"
                          value={formatLabel(
                            project
                              .lastInspection
                              ?.overallCondition,
                          )}
                        />
                      </div>

                      {project
                        .lastInspection && (
                        <div className="mt-3 rounded-xl bg-white p-3 text-sm">
                          <p className="font-semibold text-gray-800">
                            Last inspected by:{' '}
                            {project
                              .lastInspection
                              .inspectionManagerName ||
                              '-'}
                          </p>

                          <p className="mt-1 text-gray-500">
                            Status:{' '}
                            {formatLabel(
                              project
                                .lastInspection
                                .status,
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid shrink-0 grid-cols-2 gap-2 xl:w-[320px]">
                      <a
                        href={
                          project.customerPhone
                            ? `tel:${project.customerPhone}`
                            : undefined
                        }
                        onClick={(
                          event,
                        ) => {
                          if (
                            !project.customerPhone
                          ) {
                            event.preventDefault();

                            alert(
                              'Customer phone number is not available',
                            );
                          }
                        }}
                        className="rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Call
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          openNavigation(
                            project,
                          )
                        }
                        className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        Navigate
                      </button>

                      <Link
                        href={`/project/${project.id}`}
                        className="rounded-xl bg-gray-800 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-black"
                      >
                        Open Project
                      </Link>

                      <Link
                        href={`/inspection/${project.id}`}
                        className="rounded-xl bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-orange-600"
                      >
                        Inspect Site
                      </Link>
                    </div>
                  </div>
                </div>
              ),
            )
          )}
        </div>

        {!loading &&
          pagination.total > 0 && (
            <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                Showing{' '}
                {Math.min(
                  (page - 1) *
                    limit +
                    1,
                  pagination.total,
                )}
                {' - '}
                {Math.min(
                  page * limit,
                  pagination.total,
                )}{' '}
                of{' '}
                {pagination.total.toLocaleString(
                  'en-IN',
                )}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    page <= 1 ||
                    loading
                  }
                  onClick={() =>
                    setPage(
                      (
                        current,
                      ) =>
                        Math.max(
                          current -
                            1,
                          1,
                        ),
                    )
                  }
                  className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
                  Page {page} of{' '}
                  {
                    pagination.totalPages
                  }
                </span>

                <button
                  type="button"
                  disabled={
                    page >=
                      pagination.totalPages ||
                    loading
                  }
                  onClick={() =>
                    setPage(
                      (
                        current,
                      ) =>
                        Math.min(
                          current +
                            1,
                          pagination.totalPages,
                        ),
                    )
                  }
                  className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-800">
        {Number(
          value || 0,
        ).toLocaleString(
          'en-IN',
        )}
      </p>
    </div>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-xs text-gray-500">
        {title}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-gray-800">
        {value || '-'}
      </p>
    </div>
  );
}

function Badge({
  text,
}: {
  text: string;
}) {
  return (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
      {formatLabel(text)}
    </span>
  );
}

function AnalyticsPanel({
  title,
  emptyText,
  children,
}: {
  title: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const childCount =
    Array.isArray(children)
      ? children.length
      : children
        ? 1
        : 0;

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h3 className="text-lg font-bold text-gray-900">
        {title}
      </h3>

      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto">
        {childCount > 0 ? (
          children
        ) : (
          <p className="text-sm text-gray-500">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function AnalyticsRow({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-xl border bg-gray-50 p-3">
      <p className="font-bold text-gray-900">
        {title}
      </p>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {lines.map((line) => (
          <p
            key={line}
            className="text-sm text-gray-600"
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
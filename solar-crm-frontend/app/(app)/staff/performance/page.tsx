'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const USER_ROLE_OPTIONS = [
  'TELECALLING_MANAGER',
  'TELECALLING_ASSISTANT',
  'TELECALLER',

  'LEAD_MANAGER',
  'LEAD_EXECUTIVE',

  'MARKETING_HEAD',

  'MEETING_MANAGER',
  'MEETING_ASSISTANT',

  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',

  'LOAN_MANAGER',
  'SUBSIDY_MANAGER',
  'ELECTRICITY_MANAGER',

  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',

  'ACCOUNT_MANAGER',

    'STOCK_MANAGER',
  'MAINTENANCE_MANAGER',
  'INSPECTION_MANAGER',
  'CUSTOMER_MANAGER',
  'HR_MANAGER',
'TRADING_MANAGER',
'TRADING_HEAD',

'OFFICE_ASSISTANT',

'PROJECT_CONTRACTOR',

  'CUSTOMER',
  'SOLAR_FRANCHISE'
];

const METRIC_TYPES = ['NUMBER', 'PERCENTAGE', 'BOOLEAN', 'RATING', 'CUSTOM'];
const METRIC_UNITS = ['COUNT', 'AMOUNT', 'PERCENT', 'DAYS', 'HOURS', 'RATING', 'CUSTOM'];

const METRIC_SOURCE_TYPES = [
  'CRM_METRIC',
  'MANUAL',
  'MANAGER_RATING',
  'BOOLEAN',
];

const CRM_METRIC_OPTIONS = [

  'LEADS_CREATED',
  'MEETINGS_CREATED',
  'MEETINGS_COMPLETED',
  'MEETINGS_CONVERTED_TO_PROJECT',

  'PROJECTS_CREATED',
  'APPROVED_PROJECTS',
  'APPROVED_PROJECT_KW',
  'APPROVED_PROJECT_AMOUNT',

  'PAYMENT_COLLECTION_AMOUNT',

  'TRADING_MEETINGS',
  'DEALER_ORDERS',
  'DEALER_SALES_AMOUNT',
  'DEALER_NET_PROFIT',

  'ATTENDANCE_PRESENT_DAYS',
  'ATTENDANCE_WORKING_HOURS',

  'COMPLAINTS_RESOLVED',
];

const PERFORMANCE_STATUSES = [
  'DRAFT',
  'REVIEWED',
  'APPROVED',
  'REJECTED',
];

const emptyEvaluationForm = {
  staffId: '',
  performanceMonth:
    new Date()
      .toISOString()
      .slice(0, 7),
  templateId: '',
};

const emptyMetric = {
  metricName: '',
  targetValue: '',
  metricType: 'NUMBER',
  metricUnit: 'COUNT',

  sourceType: 'MANUAL',
  crmMetricType: '',
  customMetricName: '',

  mandatory: false,
  weightage: '1',

  capScoreAtTarget: true,
};

const emptyForm = {
  templateName: '',
  applicableRole: '',
  department: '',
  branchName: '',
  isDefault: true,
  description: '',
  isActive: true,
  metrics: [emptyMetric],
};

export default function PerformancePage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [staff, setStaff] =
  useState<any[]>([]);

const [
  evaluationForm,
  setEvaluationForm,
] = useState<any>(
  emptyEvaluationForm,
);

const [
  evaluations,
  setEvaluations,
] = useState<any[]>([]);

const [
  selectedEvaluation,
  setSelectedEvaluation,
] = useState<any>(null);

const [
  evaluationOpen,
  setEvaluationOpen,
] = useState(false);

const [
  evaluationLoading,
  setEvaluationLoading,
] = useState(false);

const [
  evaluationActionLoading,
  setEvaluationActionLoading,
] = useState(false);

const [
  evaluationSearch,
  setEvaluationSearch,
] = useState('');

const [
  evaluationMonthFilter,
  setEvaluationMonthFilter,
] = useState(
  new Date()
    .toISOString()
    .slice(0, 7),
);

const [
  evaluationStatusFilter,
  setEvaluationStatusFilter,
] = useState('');

const [
  showHiddenEvaluations,
  setShowHiddenEvaluations,
] = useState(false);

const [
  evaluationPage,
  setEvaluationPage,
] = useState(1);

const [
  evaluationTotalPages,
  setEvaluationTotalPages,
] = useState(1);

const [
  staffSearch,
  setStaffSearch,
] = useState('');

const [
  selectedStaffName,
  setSelectedStaffName,
] = useState('');

const [
  showStaffOptions,
  setShowStaffOptions,
] = useState(false);

const [
  evaluationRemarks,
  setEvaluationRemarks,
] = useState({
    reviewRemarks: '',
    managerRemarks: '',
    employeeRemarks: '',
  });

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const headers = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchTemplates = async () => {
    const res = await axios.get(`${API_BASE_URL}/staff/performance-templates`, {
      params: {
        page,
        limit: 20,
        search,
        applicableRole: roleFilter,
        showHidden,
      },
      headers: headers(),
    });

    setTemplates(res.data?.data || []);
    setTotalPages(res.data?.totalPages || 1);
  };

  const fetchStaff = async () => {
  const res = await axios.get(
    `${API_BASE_URL}/staff`,
    {
      params: {
        page: 1,
        limit: 100,
        showHidden: false,
      },
      headers: headers(),
    },
  );

  setStaff(
    res.data?.data || [],
  );
};

const fetchEvaluations =
  async () => {
    try {
      setEvaluationLoading(
        true,
      );

      const res =
        await axios.get(
          `${API_BASE_URL}/staff/performance-evaluations`,
          {
            params: {
              page:
                evaluationPage,

              limit: 20,

              performanceMonth:
                evaluationMonthFilter ||
                undefined,

              status:
                evaluationStatusFilter ||
                undefined,

              search:
                evaluationSearch.trim() ||
                undefined,

              showHidden:
                showHiddenEvaluations,
            },

            headers:
              headers(),
          },
        );

      setEvaluations(
        res.data?.data || [],
      );

      setEvaluationTotalPages(
        res.data?.totalPages ||
          1,
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data
          ?.message ||
          'Failed to load performance evaluations',
      );
    } finally {
      setEvaluationLoading(
        false,
      );
    }
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, showHidden]);

  useEffect(() => {
  fetchStaff();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

useEffect(() => {
  fetchEvaluations();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [
  evaluationPage,
  evaluationMonthFilter,
  evaluationStatusFilter,
  showHiddenEvaluations,
]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      metrics: [{ ...emptyMetric }],
    });
  };

  const addMetric = () => {
    setForm({
      ...form,
      metrics: [...form.metrics, { ...emptyMetric }],
    });
  };

  const updateMetric = (index: number, key: string, value: any) => {
    const updated = [...form.metrics];
    updated[index] = {
      ...updated[index],
      [key]: value,
    };

    setForm({
      ...form,
      metrics: updated,
    });
  };

  const removeMetric = (index: number) => {
    const updated = form.metrics.filter((_: any, i: number) => i !== index);

    setForm({
      ...form,
      metrics: updated.length ? updated : [{ ...emptyMetric }],
    });
  };

  const saveTemplate = async () => {
    if (!form.templateName.trim()) {
      alert('Template name is required');
      return;
    }

    if (!form.applicableRole) {
      alert('Applicable role is required');
      return;
    }

    if (
  !form.metrics.length ||
  form.metrics.some(
    (metric: any) =>
      !String(
        metric.metricName || '',
      ).trim(),
  )
) {
  alert(
    'Every performance metric must have a name',
  );
  return;
}

const missingCrmMetric =
  form.metrics.some(
    (metric: any) =>
      metric.sourceType ===
        'CRM_METRIC' &&
      !metric.crmMetricType,
  );

if (missingCrmMetric) {
  alert(
    'Please select a CRM Metric for every CRM-based KPI',
  );
  return;
}

    const payload = {
      ...form,
      metrics: form.metrics.map((m: any) => ({
        ...m,
        targetValue: Number(m.targetValue || 0),
        weightage: Number(m.weightage || 1),
      })),
    };

    if (editingId) {
      await axios.patch(
        `${API_BASE_URL}/staff/performance-template/${editingId}`,
        payload,
        { headers: headers() },
      );
      alert('Performance template updated');
    } else {
      await axios.post(`${API_BASE_URL}/staff/performance-template`, payload, {
        headers: headers(),
      });
      alert('Performance template created');
    }

    resetForm();
    fetchTemplates();
  };

  const startEdit = async (template: any) => {
    const res = await axios.get(
      `${API_BASE_URL}/staff/performance-template/${template.id}/metrics`,
      { headers: headers() },
    );

    const metrics = Array.isArray(res.data) && res.data.length
      ? res.data.map((m: any) => ({
  metricName:
    m.metricName || '',

  targetValue:
    String(
      m.targetValue ?? '',
    ),

  metricType:
    m.metricType ||
    'NUMBER',

  metricUnit:
    m.metricUnit ||
    'COUNT',

  sourceType:
    m.sourceType ||
    'MANUAL',

  crmMetricType:
    m.crmMetricType ||
    '',

  customMetricName:
    m.customMetricName ||
    '',

  mandatory:
    m.mandatory === true,

  weightage:
    String(
      m.weightage ?? 1,
    ),

  capScoreAtTarget:
    m.capScoreAtTarget !==
    false,
}))
      : [{ ...emptyMetric }];

    setEditingId(template.id);
    setForm({
      templateName: template.templateName || '',
      applicableRole: template.applicableRole || '',
      department: template.department || '',
      branchName: template.branchName || '',
      isDefault: template.isDefault !== false,
      description: template.description || '',
      isActive: template.isActive !== false,
      metrics,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hideRestore = async (template: any, restore = false) => {
    const confirmText = restore
      ? 'Restore this performance template?'
      : 'Hide this performance template?';

    if (!window.confirm(confirmText)) return;

    await axios.patch(
      `${API_BASE_URL}/staff/performance-template/${template.id}/${
        restore ? 'restore' : 'hide'
      }`,
      {},
      { headers: headers() },
    );

    fetchTemplates();
  };

  const filteredStaff =
  staff.filter((item) => {
    const text = `
      ${item.fullName || ''}
      ${item.employeeCode || ''}
      ${item.staffRole || ''}
      ${item.designation || ''}
      ${item.department || ''}
      ${item.branchName || ''}
    `.toLowerCase();

    return text.includes(
      staffSearch.toLowerCase(),
    );
  });

const selectedStaff =
  staff.find(
    (item) =>
      Number(item.id) ===
      Number(
        evaluationForm.staffId,
      ),
  );

const applicableTemplates =
  templates.filter(
    (template) => {
      if (!selectedStaff) {
        return false;
      }

      const staffRole =
        String(
          selectedStaff.staffRole ||
            selectedStaff.designation ||
            '',
        )
          .trim()
          .toUpperCase()
          .replaceAll(
            ' ',
            '_',
          );

      const templateRole =
        String(
          template.applicableRole ||
            '',
        )
          .trim()
          .toUpperCase()
          .replaceAll(
            ' ',
            '_',
          );

      if (
        templateRole !==
        staffRole
      ) {
        return false;
      }

      if (
        String(
          template.department ||
            '',
        ).trim() &&
        String(
          template.department,
        )
          .trim()
          .toLowerCase() !==
          String(
            selectedStaff.department ||
              '',
          )
            .trim()
            .toLowerCase()
      ) {
        return false;
      }

      if (
        String(
          template.branchName ||
            '',
        ).trim() &&
        String(
          template.branchName,
        )
          .trim()
          .toLowerCase() !==
          String(
            selectedStaff.branchName ||
              '',
          )
            .trim()
            .toLowerCase()
      ) {
        return false;
      }

      return (
        template.isActive !==
          false &&
        !template.isHidden
      );
    },
  );

const resetEvaluationForm =
  () => {
    setEvaluationForm({
      ...emptyEvaluationForm,

      performanceMonth:
        new Date()
          .toISOString()
          .slice(0, 7),
    });

    setStaffSearch('');
    setSelectedStaffName('');
    setShowStaffOptions(false);
  };

const generateEvaluation =
  async () => {
    if (
      !evaluationForm.staffId
    ) {
      alert(
        'Please select staff member',
      );
      return;
    }

    if (
      !evaluationForm.performanceMonth
    ) {
      alert(
        'Performance month is required',
      );
      return;
    }

    try {
      setEvaluationActionLoading(
        true,
      );

      const res =
        await axios.post(
          `${API_BASE_URL}/staff/performance-evaluation/generate`,
          {
            staffId:
              Number(
                evaluationForm.staffId,
              ),

            performanceMonth:
              evaluationForm.performanceMonth,

            templateId:
              evaluationForm.templateId
                ? Number(
                    evaluationForm.templateId,
                  )
                : undefined,
          },
          {
            headers:
              headers(),
          },
        );

      alert(
        'Performance evaluation generated',
      );

      resetEvaluationForm();

      await fetchEvaluations();

      setSelectedEvaluation(
        res.data,
      );

      setEvaluationRemarks({
        reviewRemarks:
          res.data?.reviewRemarks ||
          '',

        managerRemarks:
          res.data?.managerRemarks ||
          '',

        employeeRemarks:
          res.data?.employeeRemarks ||
          '',
      });

      setEvaluationOpen(
        true,
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data
          ?.message ||
          'Failed to generate performance evaluation',
      );
    } finally {
      setEvaluationActionLoading(
        false,
      );
    }
  };

const openEvaluation =
  async (id: number) => {
    try {
      setEvaluationActionLoading(
        true,
      );

      const res =
        await axios.get(
          `${API_BASE_URL}/staff/performance-evaluation/${id}`,
          {
            headers:
              headers(),
          },
        );

      setSelectedEvaluation(
        res.data,
      );

      setEvaluationRemarks({
        reviewRemarks:
          res.data
            ?.reviewRemarks ||
          '',

        managerRemarks:
          res.data
            ?.managerRemarks ||
          '',

        employeeRemarks:
          res.data
            ?.employeeRemarks ||
          '',
      });

      setEvaluationOpen(
        true,
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data
          ?.message ||
          'Failed to load evaluation',
      );
    } finally {
      setEvaluationActionLoading(
        false,
      );
    }
  };

const reloadOpenEvaluation =
  async () => {
    if (
      !selectedEvaluation?.id
    ) {
      return;
    }

    const res =
      await axios.get(
        `${API_BASE_URL}/staff/performance-evaluation/${selectedEvaluation.id}`,
        {
          headers:
            headers(),
        },
      );

    setSelectedEvaluation(
      res.data,
    );
  };

const updateEvaluationMetric =
  async (
    metric: any,
    actualValue: number,
    remarks?: string,
  ) => {
    if (
      !selectedEvaluation?.id
    ) {
      return;
    }

    try {
      setEvaluationActionLoading(
        true,
      );

      await axios.patch(
        `${API_BASE_URL}/staff/performance-evaluation/${selectedEvaluation.id}/metric/${metric.id}`,
        {
          actualValue,
          remarks:
            remarks ??
            metric.remarks ??
            '',
        },
        {
          headers:
            headers(),
        },
      );

      await reloadOpenEvaluation();

      await fetchEvaluations();
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data
          ?.message ||
          'Failed to update KPI',
      );
    } finally {
      setEvaluationActionLoading(
        false,
      );
    }
  };

const refreshEvaluationCrm =
  async () => {
    if (
      !selectedEvaluation?.id
    ) {
      return;
    }

    try {
      setEvaluationActionLoading(
        true,
      );

      await axios.patch(
        `${API_BASE_URL}/staff/performance-evaluation/${selectedEvaluation.id}/refresh-crm`,
        {},
        {
          headers:
            headers(),
        },
      );

      await reloadOpenEvaluation();

      await fetchEvaluations();

      alert(
        'CRM metrics refreshed',
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data
          ?.message ||
          'Failed to refresh CRM metrics',
      );
    } finally {
      setEvaluationActionLoading(
        false,
      );
    }
  };

const reviewEvaluation =
  async () => {
    if (
      !selectedEvaluation?.id
    ) {
      return;
    }

    if (
      !window.confirm(
        'Mark this evaluation as reviewed?',
      )
    ) {
      return;
    }

    try {
      setEvaluationActionLoading(
        true,
      );

      await axios.patch(
        `${API_BASE_URL}/staff/performance-evaluation/${selectedEvaluation.id}/review`,
        evaluationRemarks,
        {
          headers:
            headers(),
        },
      );

      await reloadOpenEvaluation();

      await fetchEvaluations();

      alert(
        'Performance evaluation reviewed',
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data
          ?.message ||
          'Failed to review evaluation',
      );
    } finally {
      setEvaluationActionLoading(
        false,
      );
    }
  };

const approveEvaluation =
  async () => {
    if (
      !selectedEvaluation?.id
    ) {
      return;
    }

    if (
      !window.confirm(
        'Approve and lock this performance evaluation?',
      )
    ) {
      return;
    }

    try {
      setEvaluationActionLoading(
        true,
      );

      await axios.patch(
        `${API_BASE_URL}/staff/performance-evaluation/${selectedEvaluation.id}/approve`,
        {
          managerRemarks:
            evaluationRemarks.managerRemarks,

          reviewRemarks:
            evaluationRemarks.reviewRemarks,
        },
        {
          headers:
            headers(),
        },
      );

      await reloadOpenEvaluation();

      await fetchEvaluations();

      alert(
        'Performance evaluation approved',
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data
          ?.message ||
          'Failed to approve evaluation',
      );
    } finally {
      setEvaluationActionLoading(
        false,
      );
    }
  };

const hideRestoreEvaluation =
  async (
    evaluation: any,
    restore = false,
  ) => {
    const reason =
      window.prompt(
        restore
          ? 'Reason for restoring evaluation?'
          : 'Reason for hiding evaluation?',
        restore
          ? 'Valid evaluation'
          : 'Wrong / duplicate evaluation',
      );

    if (reason === null) {
      return;
    }

    try {
      await axios.patch(
        `${API_BASE_URL}/staff/performance-evaluation/${evaluation.id}/${
          restore
            ? 'restore'
            : 'hide'
        }`,
        {
          reason,
        },
        {
          headers:
            headers(),
        },
      );

      await fetchEvaluations();
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data
          ?.message ||
          'Failed to update evaluation',
      );
    }
  };

const performanceBandClass =
  (band: string) => {
    switch (
      String(
        band || '',
      ).toUpperCase()
    ) {
      case 'EXCELLENT':
        return 'bg-green-100 text-green-800';

      case 'GOOD':
        return 'bg-blue-100 text-blue-800';

      case 'SATISFACTORY':
        return 'bg-amber-100 text-amber-800';

      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Performance Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
  Define role-wise KPI templates and evaluate
  actual employee performance using CRM data,
  manager ratings and manual performance inputs.
</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Loaded Templates</p>
          <p className="mt-2 text-2xl font-bold">{templates.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {templates.filter((t) => t.isActive).length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Default</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {templates.filter((t) => t.isDefault).length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Hidden View</p>
          <p className="mt-2 text-2xl font-bold text-orange-700">
            {showHidden ? 'On' : 'Off'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-indigo-100 bg-white p-5 shadow">
  <div>
    <h2 className="text-xl font-bold text-gray-800">
      Generate Employee Performance Evaluation
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Create a monthly employee evaluation
      from the applicable KPI template.
      CRM-backed metrics are calculated
      automatically.
    </p>
  </div>

  <div className="mt-5 grid gap-3 md:grid-cols-3">
    <div className="relative md:col-span-2">
      <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
        Staff Member
      </p>

      <input
        placeholder="Search employee by name / code / role / department / branch"
        value={
          staffSearch ||
          selectedStaffName
        }
        onChange={(e) => {
          setStaffSearch(
            e.target.value,
          );

          setSelectedStaffName(
            '',
          );

          setEvaluationForm({
            ...evaluationForm,
            staffId: '',
            templateId: '',
          });

          setShowStaffOptions(
            true,
          );
        }}
        onFocus={() =>
          setShowStaffOptions(
            true,
          )
        }
        className="w-full rounded-xl border p-3"
      />

      {showStaffOptions && (
        <div className="absolute z-40 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow">
          {filteredStaff.length ===
          0 ? (
            <div className="p-3 text-sm text-gray-500">
              No matching staff found
            </div>
          ) : (
            filteredStaff.map(
              (item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setEvaluationForm({
                      ...evaluationForm,

                      staffId:
                        String(
                          item.id,
                        ),

                      templateId:
                        '',
                    });

                    setSelectedStaffName(
                      `${
                        item.fullName ||
                        'Staff'
                      } ${
                        item.employeeCode
                          ? `(${item.employeeCode})`
                          : ''
                      }`,
                    );

                    setStaffSearch(
                      '',
                    );

                    setShowStaffOptions(
                      false,
                    );
                  }}
                  className="block w-full border-b p-3 text-left hover:bg-indigo-50"
                >
                  <p className="font-semibold text-gray-900">
                    {item.fullName ||
                      'Unnamed'}
                  </p>

                  <p className="text-xs text-gray-500">
                    {item.employeeCode ||
                      '-'}{' '}
                    |{' '}
                    {item.staffRole ||
                      item.designation ||
                      '-'}{' '}
                    |{' '}
                    {item.department ||
                      '-'}{' '}
                    |{' '}
                    {item.branchName ||
                      '-'}
                  </p>
                </button>
              ),
            )
          )}
        </div>
      )}
    </div>

    <div>
      <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
        Evaluation Month
      </p>

      <input
        type="month"
        value={
          evaluationForm.performanceMonth
        }
        onChange={(e) =>
          setEvaluationForm({
            ...evaluationForm,

            performanceMonth:
              e.target.value,
          })
        }
        className="w-full rounded-xl border p-3"
      />
    </div>

    <div className="md:col-span-3">
      <p className="mb-1 text-xs font-semibold uppercase text-gray-500">
        Performance Template
      </p>

      <select
        value={
          evaluationForm.templateId
        }
        disabled={
          !evaluationForm.staffId
        }
        onChange={(e) =>
          setEvaluationForm({
            ...evaluationForm,

            templateId:
              e.target.value,
          })
        }
        className="w-full rounded-xl border p-3 disabled:bg-gray-100"
      >
        <option value="">
          Auto-select best applicable template
        </option>

        {applicableTemplates.map(
          (template) => (
            <option
              key={template.id}
              value={template.id}
            >
              {template.templateName}
              {template.department
                ? ` · ${template.department}`
                : ''}
              {template.branchName
                ? ` · ${template.branchName}`
                : ''}
            </option>
          ),
        )}
      </select>

      {evaluationForm.staffId &&
        applicableTemplates.length ===
          0 && (
          <p className="mt-2 text-sm font-semibold text-red-600">
            No currently loaded active
            template matches this
            employee&apos;s role.
          </p>
        )}
    </div>
  </div>

  <div className="mt-4 flex flex-wrap gap-2">
    <button
      type="button"
      disabled={
        evaluationActionLoading
      }
      onClick={
        generateEvaluation
      }
      className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
    >
      {evaluationActionLoading
        ? 'Generating...'
        : 'Generate Evaluation'}
    </button>

    <button
      type="button"
      onClick={
        resetEvaluationForm
      }
      className="rounded-xl bg-gray-200 px-5 py-3 font-semibold text-gray-700"
    >
      Clear
    </button>
  </div>
</div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          {editingId ? 'Edit Template' : 'Create Template'}
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            placeholder="Template Name"
            value={form.templateName}
            onChange={(e) => setForm({ ...form, templateName: e.target.value })}
            className="rounded-xl border p-3 md:col-span-2"
          />

          <select
            value={form.applicableRole}
            onChange={(e) => setForm({ ...form, applicableRole: e.target.value })}
            className="rounded-xl border p-3"
          >
            <option value="">Applicable Role</option>
            {USER_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role.replaceAll('_', ' ')}
              </option>
            ))}
          </select>

          <input
            placeholder="Department"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Branch"
            value={form.branchName}
            onChange={(e) => setForm({ ...form, branchName: e.target.value })}
            className="rounded-xl border p-3"
          />

          <label className="rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            />{' '}
            Default Template
          </label>
        </div>

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="mt-3 w-full rounded-xl border p-3"
        />

        <div className="mt-4 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-gray-800">Template Metrics</h3>

            <button
              type="button"
              onClick={addMetric}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              + Add Metric
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {form.metrics.map((metric: any, index: number) => (
              <div
  key={index}
  className="rounded-xl border bg-gray-50 p-4"
>
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
    <div className="xl:col-span-2">
      <p className="mb-1 text-xs font-semibold text-gray-600">
        KPI / Metric Name
      </p>

      <input
        placeholder="Example: Completed Meetings"
        value={metric.metricName}
        onChange={(e) =>
          updateMetric(
            index,
            'metricName',
            e.target.value,
          )
        }
        className="w-full rounded-xl border bg-white p-3"
      />
    </div>

    <div>
      <p className="mb-1 text-xs font-semibold text-gray-600">
        Target
      </p>

      <input
        type="number"
        min="0"
        step="any"
        placeholder="Target"
        value={metric.targetValue}
        onChange={(e) =>
          updateMetric(
            index,
            'targetValue',
            e.target.value,
          )
        }
        className="w-full rounded-xl border bg-white p-3"
      />
    </div>

    <div>
      <p className="mb-1 text-xs font-semibold text-gray-600">
        Weightage
      </p>

      <input
        type="number"
        min="0"
        step="any"
        placeholder="Weightage"
        value={metric.weightage}
        onChange={(e) =>
          updateMetric(
            index,
            'weightage',
            e.target.value,
          )
        }
        className="w-full rounded-xl border bg-white p-3"
      />
    </div>

    <div>
      <p className="mb-1 text-xs font-semibold text-gray-600">
        Metric Type
      </p>

      <select
        value={metric.metricType}
        onChange={(e) =>
          updateMetric(
            index,
            'metricType',
            e.target.value,
          )
        }
        className="w-full rounded-xl border bg-white p-3"
      >
        {METRIC_TYPES.map((item) => (
          <option
            key={item}
            value={item}
          >
            {item.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
    </div>

    <div>
      <p className="mb-1 text-xs font-semibold text-gray-600">
        Unit
      </p>

      <select
        value={metric.metricUnit}
        onChange={(e) =>
          updateMetric(
            index,
            'metricUnit',
            e.target.value,
          )
        }
        className="w-full rounded-xl border bg-white p-3"
      >
        {METRIC_UNITS.map((item) => (
          <option
            key={item}
            value={item}
          >
            {item.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
    </div>

    <div>
      <p className="mb-1 text-xs font-semibold text-gray-600">
        Actual Value Source
      </p>

      <select
        value={
          metric.sourceType ||
          'MANUAL'
        }
        onChange={(e) => {
          const value =
            e.target.value;

          updateMetric(
            index,
            'sourceType',
            value,
          );

          if (
            value !==
            'CRM_METRIC'
          ) {
            updateMetric(
              index,
              'crmMetricType',
              '',
            );
          }
        }}
        className="w-full rounded-xl border bg-white p-3"
      >
        {METRIC_SOURCE_TYPES.map(
          (item) => (
            <option
              key={item}
              value={item}
            >
              {item.replaceAll(
                '_',
                ' ',
              )}
            </option>
          ),
        )}
      </select>
    </div>

    {metric.sourceType ===
      'CRM_METRIC' && (
      <div>
        <p className="mb-1 text-xs font-semibold text-gray-600">
          CRM Metric
        </p>

        <select
          value={
            metric.crmMetricType ||
            ''
          }
          onChange={(e) =>
            updateMetric(
              index,
              'crmMetricType',
              e.target.value,
            )
          }
          className="w-full rounded-xl border bg-white p-3"
        >
          <option value="">
            Select CRM Metric
          </option>

          {CRM_METRIC_OPTIONS.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item.replaceAll(
                  '_',
                  ' ',
                )}
              </option>
            ),
          )}
        </select>
      </div>
    )}

    {metric.sourceType ===
      'MANUAL' && (
      <div>
        <p className="mb-1 text-xs font-semibold text-gray-600">
          Custom Metric Reference
        </p>

        <input
          placeholder="Optional"
          value={
            metric.customMetricName ||
            ''
          }
          onChange={(e) =>
            updateMetric(
              index,
              'customMetricName',
              e.target.value,
            )
          }
          className="w-full rounded-xl border bg-white p-3"
        />
      </div>
    )}
  </div>

  <div className="mt-4 flex flex-wrap items-center gap-3">
    <label className="rounded-xl border bg-white p-3 text-sm">
      <input
        type="checkbox"
        checked={
          metric.mandatory ===
          true
        }
        onChange={(e) =>
          updateMetric(
            index,
            'mandatory',
            e.target.checked,
          )
        }
      />{' '}
      Mandatory KPI
    </label>

    <label className="rounded-xl border bg-white p-3 text-sm">
      <input
        type="checkbox"
        checked={
          metric.capScoreAtTarget !==
          false
        }
        onChange={(e) =>
          updateMetric(
            index,
            'capScoreAtTarget',
            e.target.checked,
          )
        }
      />{' '}
      Cap Score At Target
    </label>

    <button
      type="button"
      onClick={() =>
        removeMetric(index)
      }
      className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
    >
      Remove Metric
    </button>
  </div>

  <div className="mt-3 rounded-xl bg-white p-3 text-xs text-gray-500">
    {metric.sourceType ===
      'CRM_METRIC' &&
      'Actual value will be calculated automatically from CRM data.'}

    {metric.sourceType ===
      'MANUAL' &&
      'HR / manager will enter the achieved value during evaluation.'}

    {metric.sourceType ===
      'MANAGER_RATING' &&
      'Manager will give this KPI a rating between 0 and 5.'}

    {metric.sourceType ===
      'BOOLEAN' &&
      'Manager will mark this requirement as achieved or not achieved.'}
  </div>
</div>
            ))}
          </div>
        </div>

        <label className="mt-3 inline-block rounded-xl border p-3 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />{' '}
          Active
        </label>

        <div className="mt-4 flex gap-2">
          <button
            onClick={saveTemplate}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            {editingId ? 'Update Template' : 'Create Template'}
          </button>

          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-xl bg-gray-600 px-5 py-3 font-semibold text-white"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            placeholder="Search template"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border p-3"
          />

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border p-3"
          >
            <option value="">All Roles</option>
            {USER_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role.replaceAll('_', ' ')}
              </option>
            ))}
          </select>

          <label className="rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => {
                setShowHidden(e.target.checked);
                setPage(1);
              }}
            />{' '}
            View Hidden
          </label>

          <button
            onClick={() => {
              setPage(1);
              fetchTemplates();
            }}
            className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Apply / Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          Performance Template Register
        </h2>

        <div className="mt-4 space-y-3">
          {templates.length === 0 ? (
            <p className="text-sm text-gray-500">No templates found.</p>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className={`rounded-xl border p-4 ${
                  template.isHidden ? 'bg-gray-100 opacity-70' : 'bg-white'
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-bold text-gray-900">
                      {template.templateName}
                    </p>

                    <p className="text-sm text-gray-500">
                      {template.applicableRole?.replaceAll('_', ' ') || '-'} |{' '}
                      {template.department || '-'} | {template.branchName || '-'}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {template.isDefault ? 'Default' : 'Custom'} |{' '}
                      {template.isActive ? 'Active' : 'Inactive'}
                    </p>

                    {template.description && (
                      <p className="mt-2 text-sm text-gray-700">
                        {template.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!template.isHidden && (
                      <button
                        onClick={() => startEdit(template)}
                        className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Edit
                      </button>
                    )}

                    <button
                      onClick={() => hideRestore(template, !!template.isHidden)}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold text-white ${
                        template.isHidden ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      {template.isHidden ? 'Restore' : 'Hide'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Previous
          </button>

          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-indigo-100 bg-white p-5 shadow">
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Employee Performance Evaluation Register
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Monthly employee KPI results,
        scores, reviews and approved
        appraisal history.
      </p>
    </div>

    <button
      type="button"
      onClick={() => {
        setEvaluationPage(1);
        fetchEvaluations();
      }}
      className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
    >
      Refresh
    </button>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-4">
    <input
      placeholder="Search employee / template"
      value={
        evaluationSearch
      }
      onChange={(e) =>
        setEvaluationSearch(
          e.target.value,
        )
      }
      onKeyDown={(e) => {
        if (
          e.key === 'Enter'
        ) {
          setEvaluationPage(1);
          fetchEvaluations();
        }
      }}
      className="rounded-xl border p-3"
    />

    <input
      type="month"
      value={
        evaluationMonthFilter
      }
      onChange={(e) => {
        setEvaluationMonthFilter(
          e.target.value,
        );

        setEvaluationPage(1);
      }}
      className="rounded-xl border p-3"
    />

    <select
      value={
        evaluationStatusFilter
      }
      onChange={(e) => {
        setEvaluationStatusFilter(
          e.target.value,
        );

        setEvaluationPage(1);
      }}
      className="rounded-xl border p-3"
    >
      <option value="">
        All Statuses
      </option>

      {PERFORMANCE_STATUSES.map(
        (status) => (
          <option
            key={status}
            value={status}
          >
            {status.replaceAll(
              '_',
              ' ',
            )}
          </option>
        ),
      )}
    </select>

    <label className="rounded-xl border p-3 text-sm">
      <input
        type="checkbox"
        checked={
          showHiddenEvaluations
        }
        onChange={(e) => {
          setShowHiddenEvaluations(
            e.target.checked,
          );

          setEvaluationPage(1);
        }}
      />{' '}
      View Hidden
    </label>
  </div>

  <div className="mt-3 flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() => {
        setEvaluationPage(1);
        fetchEvaluations();
      }}
      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
    >
      Apply Filters
    </button>

    <button
      type="button"
      onClick={() => {
        setEvaluationSearch('');
        setEvaluationMonthFilter('');
        setEvaluationStatusFilter('');
        setShowHiddenEvaluations(
          false,
        );
        setEvaluationPage(1);
      }}
      className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-700"
    >
      Clear Filters
    </button>
  </div>

  <div className="mt-5 space-y-3">
    {evaluationLoading ? (
      <p className="text-sm text-gray-500">
        Loading evaluations...
      </p>
    ) : evaluations.length ===
      0 ? (
      <p className="text-sm text-gray-500">
        No employee performance
        evaluations found.
      </p>
    ) : (
      evaluations.map(
        (evaluation) => (
          <div
            key={
              evaluation.id
            }
            className={`rounded-xl border p-4 ${
              evaluation.isHidden
                ? 'bg-gray-100 opacity-70'
                : 'bg-white'
            }`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-gray-900">
                    {evaluation.staffName ||
                      `Staff #${evaluation.staffId}`}
                  </p>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                    {evaluation.status}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${performanceBandClass(
                      evaluation.performanceBand,
                    )}`}
                  >
                    {String(
                      evaluation.performanceBand ||
                        'NOT SCORED',
                    ).replaceAll(
                      '_',
                      ' ',
                    )}
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  {evaluation.employeeCode ||
                    '-'}{' '}
                  |{' '}
                  {evaluation.staffRole ||
                    '-'}{' '}
                  |{' '}
                  {evaluation.performanceMonth ||
                    '-'}
                </p>

                <p className="mt-2 font-semibold text-gray-800">
                  {evaluation.templateName ||
                    'Performance Evaluation'}
                </p>

                <div className="mt-3 flex flex-wrap gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Overall Score
                    </p>

                    <p className="text-xl font-bold text-indigo-700">
                      {Number(
                        evaluation.overallScore ||
                          0,
                      ).toFixed(
                        2,
                      )}
                      %
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Mandatory KPIs
                    </p>

                    <p
                      className={`font-bold ${
                        evaluation.mandatoryMetricsMet
                          ? 'text-green-700'
                          : 'text-red-700'
                      }`}
                    >
                      {evaluation.mandatoryMetricsMet
                        ? 'Met'
                        : 'Not Met'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {!evaluation.isHidden && (
                  <button
                    type="button"
                    onClick={() =>
                      openEvaluation(
                        evaluation.id,
                      )
                    }
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
                  >
                    View Evaluation
                  </button>
                )}

                {evaluation.status !==
                  'APPROVED' && (
                  <button
                    type="button"
                    onClick={() =>
                      hideRestoreEvaluation(
                        evaluation,
                        !!evaluation.isHidden,
                      )
                    }
                    className={`rounded-xl px-3 py-2 text-sm font-semibold text-white ${
                      evaluation.isHidden
                        ? 'bg-green-600'
                        : 'bg-gray-600'
                    }`}
                  >
                    {evaluation.isHidden
                      ? 'Restore'
                      : 'Hide'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ),
      )
    )}
  </div>

  <div className="mt-5 flex items-center justify-between">
    <button
      disabled={
        evaluationPage <= 1
      }
      onClick={() =>
        setEvaluationPage(
          evaluationPage - 1,
        )
      }
      className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
    >
      Previous
    </button>

    <p className="text-sm text-gray-500">
      Page {evaluationPage} of{' '}
      {evaluationTotalPages}
    </p>

    <button
      disabled={
        evaluationPage >=
        evaluationTotalPages
      }
      onClick={() =>
        setEvaluationPage(
          evaluationPage + 1,
        )
      }
      className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
    >
      Next
    </button>
  </div>
</div>

{evaluationOpen &&
  selectedEvaluation && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {
                selectedEvaluation.staffName
              }
              {' — '}
              {
                selectedEvaluation.performanceMonth
              }
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {
                selectedEvaluation.templateName
              }
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setEvaluationOpen(
                false,
              )
            }
            className="rounded-xl bg-gray-200 px-4 py-2 font-semibold text-gray-700"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase text-indigo-700">
              Overall Score
            </p>

            <p className="mt-1 text-2xl font-bold text-indigo-900">
              {Number(
                selectedEvaluation.overallScore ||
                  0,
              ).toFixed(
                2,
              )}
              %
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Status
            </p>

            <p className="mt-1 text-lg font-bold">
              {
                selectedEvaluation.status
              }
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Performance Band
            </p>

            <p className="mt-1 text-lg font-bold">
              {String(
                selectedEvaluation.performanceBand ||
                  '-',
              ).replaceAll(
                '_',
                ' ',
              )}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Mandatory KPIs
            </p>

            <p
              className={`mt-1 text-lg font-bold ${
                selectedEvaluation.mandatoryMetricsMet
                  ? 'text-green-700'
                  : 'text-red-700'
              }`}
            >
              {selectedEvaluation.mandatoryMetricsMet
                ? 'Met'
                : 'Not Met'}
            </p>
          </div>
        </div>

        {selectedEvaluation.status !==
          'APPROVED' && (
          <div className="mt-4">
            <button
              type="button"
              disabled={
                evaluationActionLoading
              }
              onClick={
                refreshEvaluationCrm
              }
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Refresh CRM Metrics
            </button>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {Array.isArray(
            selectedEvaluation.metrics,
          ) &&
            selectedEvaluation.metrics.map(
              (metric: any) => {
                const editable =
                  selectedEvaluation.status !==
                    'APPROVED' &&
                  metric.sourceType !==
                    'CRM_METRIC';

                return (
                  <div
                    key={
                      metric.id
                    }
                    className="rounded-xl border p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-gray-900">
                            {
                              metric.metricName
                            }
                          </p>

                          {metric.mandatory && (
                            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                              Mandatory
                            </span>
                          )}

                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                            {String(
                              metric.sourceType ||
                                '',
                            ).replaceAll(
                              '_',
                              ' ',
                            )}
                          </span>
                        </div>

                        {metric.crmMetricType && (
                          <p className="mt-1 text-xs text-gray-500">
                            CRM:{' '}
                            {metric.crmMetricType.replaceAll(
                              '_',
                              ' ',
                            )}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase text-gray-500">
                          Weighted Score
                        </p>

                        <p className="font-bold text-indigo-700">
                          {Number(
                            metric.weightedScore ||
                              0,
                          ).toFixed(
                            2,
                          )}
                          {' / '}
                          {Number(
                            metric.weightage ||
                              0,
                          ).toFixed(
                            2,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs font-semibold uppercase text-gray-500">
                          Target
                        </p>

                        <p className="mt-1 font-bold">
                          {Number(
                            metric.targetValue ||
                              0,
                          ).toLocaleString(
                            'en-IN',
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase text-gray-500">
                          Actual
                        </p>

                        {editable ? (
                          metric.sourceType ===
                          'BOOLEAN' ? (
                            <select
                              value={
                                Number(
                                  metric.actualValue ||
                                    0,
                                ) >
                                0
                                  ? '1'
                                  : '0'
                              }
                              onChange={(e) =>
                                updateEvaluationMetric(
                                  metric,

                                  Number(
                                    e.target.value,
                                  ),

                                  metric.remarks,
                                )
                              }
                              className="mt-1 w-full rounded-xl border p-2"
                            >
                              <option value="0">
                                Not Achieved
                              </option>

                              <option value="1">
                                Achieved
                              </option>
                            </select>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max={
                                metric.sourceType ===
                                'MANAGER_RATING'
                                  ? 5
                                  : undefined
                              }
                              step="any"
                              defaultValue={
                                metric.actualValue ||
                                0
                              }
                              onBlur={(e) =>
                                updateEvaluationMetric(
                                  metric,

                                  Number(
                                    e.target.value,
                                  ),

                                  metric.remarks,
                                )
                              }
                              className="mt-1 w-full rounded-xl border p-2"
                            />
                          )
                        ) : (
                          <p className="mt-1 font-bold">
                            {Number(
                              metric.actualValue ||
                                0,
                            ).toLocaleString(
                              'en-IN',
                            )}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase text-gray-500">
                          Achievement
                        </p>

                        <p className="mt-1 font-bold">
                          {Number(
                            metric.achievementPercent ||
                              0,
                          ).toFixed(
                            2,
                          )}
                          %
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase text-gray-500">
                          Mandatory Status
                        </p>

                        <p
                          className={`mt-1 font-bold ${
                            metric.mandatoryMet
                              ? 'text-green-700'
                              : 'text-red-700'
                          }`}
                        >
                          {metric.mandatory
                            ? metric.mandatoryMet
                              ? 'Met'
                              : 'Not Met'
                            : 'Not Mandatory'}
                        </p>
                      </div>
                    </div>

                    {metric.calculationSnapshot &&
                      metric.sourceType ===
                        'CRM_METRIC' && (
                        <div className="mt-3 rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
                          Automatically resolved from{' '}
                          <strong>
                            {String(
                              metric.crmMetricType ||
                                '',
                            ).replaceAll(
                              '_',
                              ' ',
                            )}
                          </strong>
                          .
                        </div>
                      )}

                    {editable && (
                      <div className="mt-3">
                        <p className="mb-1 text-xs font-semibold text-gray-600">
                          KPI Remarks
                        </p>

                        <textarea
                          defaultValue={
                            metric.remarks ||
                            ''
                          }
                          onBlur={(e) =>
                            updateEvaluationMetric(
                              metric,

                              Number(
                                metric.actualValue ||
                                  0,
                              ),

                              e.target.value,
                            )
                          }
                          className="w-full rounded-xl border p-3"
                          rows={2}
                        />
                      </div>
                    )}

                    {!editable &&
                      metric.remarks && (
                        <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                          {
                            metric.remarks
                          }
                        </p>
                      )}
                  </div>
                );
              },
            )}
        </div>

        <div className="mt-5 rounded-xl border p-4">
          <h3 className="font-bold text-gray-800">
            Review Notes
          </h3>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <textarea
              placeholder="Review remarks"
              value={
                evaluationRemarks.reviewRemarks
              }
              disabled={
                selectedEvaluation.status ===
                'APPROVED'
              }
              onChange={(e) =>
                setEvaluationRemarks({
                  ...evaluationRemarks,

                  reviewRemarks:
                    e.target.value,
                })
              }
              className="rounded-xl border p-3 disabled:bg-gray-100"
              rows={3}
            />

            <textarea
              placeholder="Manager remarks"
              value={
                evaluationRemarks.managerRemarks
              }
              disabled={
                selectedEvaluation.status ===
                'APPROVED'
              }
              onChange={(e) =>
                setEvaluationRemarks({
                  ...evaluationRemarks,

                  managerRemarks:
                    e.target.value,
                })
              }
              className="rounded-xl border p-3 disabled:bg-gray-100"
              rows={3}
            />

            <textarea
              placeholder="Employee remarks"
              value={
                evaluationRemarks.employeeRemarks
              }
              disabled={
                selectedEvaluation.status ===
                'APPROVED'
              }
              onChange={(e) =>
                setEvaluationRemarks({
                  ...evaluationRemarks,

                  employeeRemarks:
                    e.target.value,
                })
              }
              className="rounded-xl border p-3 disabled:bg-gray-100"
              rows={3}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {selectedEvaluation.status ===
            'DRAFT' && (
            <button
              type="button"
              disabled={
                evaluationActionLoading
              }
              onClick={
                reviewEvaluation
              }
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              Mark Reviewed
            </button>
          )}

          {selectedEvaluation.status ===
            'REVIEWED' && (
            <button
              type="button"
              disabled={
                evaluationActionLoading
              }
              onClick={
                approveEvaluation
              }
              className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              Approve & Lock Evaluation
            </button>
          )}

          {selectedEvaluation.status ===
            'APPROVED' && (
            <div className="rounded-xl bg-green-50 px-4 py-3 font-semibold text-green-800">
              Approved and locked
            </div>
          )}
        </div>
      </div>
    </div>
  )}
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const USER_ROLE_OPTIONS = [
  'OWNER',
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
  'ELECTRICITY_MANAGER',
  'SUBSIDY_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
  'MAINTENANCE_MANAGER',
  'CUSTOMER_MANAGER',
  'HR_MANAGER',
  'TRADING_MANAGER',
  'PROJECT_CONTRACTOR',
];

const METRIC_TYPES = [
  'ORDERS',
  'LEADS',
  'QUALIFIED_LEADS',
  'MEETINGS',
  'PROJECTS',
  'INSTALLATIONS',
  'PAYMENTS_COLLECTED',
  'COLLECTION_AMOUNT',
  'FOLLOWUPS',
  'CALLS',
  'WORKING_DAYS',
  'ATTENDANCE_PERCENT',
  'CUSTOM',
];

const CALC_TYPES = ['FLAT', 'PER_UNIT', 'PERCENTAGE', 'SLAB', 'MANUAL'];

const emptyForm = {
  ruleName: '',
  description: '',
  applicableRoles: [] as string[],
  metricType: 'CUSTOM',
  customMetricName: '',
  calculationType: 'MANUAL',
  eligibilityTarget: '',
  rateAmount: '',
  percentageRate: '',
  periodType: 'MONTHLY',
  requiresApproval: true,
  includeInPayroll: true,
  isActive: true,
};

export default function IncentiveRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [metricType, setMetricType] = useState('');
  const [calculationType, setCalculationType] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const headers = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRules = async () => {
    const res = await axios.get(`${API_BASE_URL}/staff/incentive-rules`, {
      params: {
        page,
        limit: 20,
        search,
        metricType,
        calculationType,
        showHidden,
      },
      headers: headers(),
    });

    setRules(res.data?.data || []);
    setTotalPages(res.data?.totalPages || 1);
  };

  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, metricType, calculationType, showHidden]);

  const toggleRole = (role: string) => {
    const exists = form.applicableRoles.includes(role);

    setForm({
      ...form,
      applicableRoles: exists
        ? form.applicableRoles.filter((item: string) => item !== role)
        : [...form.applicableRoles, role],
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveRule = async () => {
    if (!form.ruleName.trim()) {
      alert('Rule name is required');
      return;
    }

    const payload = {
      ...form,
      eligibilityTarget: Number(form.eligibilityTarget || 0),
      rateAmount: Number(form.rateAmount || 0),
      percentageRate: Number(form.percentageRate || 0),
      applicableStaffIds: [],
      slabRules: null,
    };

    if (editingId) {
      await axios.patch(
        `${API_BASE_URL}/staff/incentive-rule/${editingId}`,
        payload,
        { headers: headers() },
      );
      alert('Incentive rule updated');
    } else {
      await axios.post(`${API_BASE_URL}/staff/incentive-rule`, payload, {
        headers: headers(),
      });
      alert('Incentive rule created');
    }

    resetForm();
    fetchRules();
  };

  const startEdit = (rule: any) => {
    setEditingId(rule.id);
    setForm({
      ruleName: rule.ruleName || '',
      description: rule.description || '',
      applicableRoles: Array.isArray(rule.applicableRoles)
        ? rule.applicableRoles
        : [],
      metricType: rule.metricType || 'CUSTOM',
      customMetricName: rule.customMetricName || '',
      calculationType: rule.calculationType || 'MANUAL',
      eligibilityTarget: String(rule.eligibilityTarget || ''),
      rateAmount: String(rule.rateAmount || ''),
      percentageRate: String(rule.percentageRate || ''),
      periodType: rule.periodType || 'MONTHLY',
      requiresApproval: rule.requiresApproval !== false,
      includeInPayroll: rule.includeInPayroll !== false,
      isActive: rule.isActive !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hideRestore = async (rule: any, restore = false) => {
    const reason = window.prompt(
      restore ? 'Reason for restoring rule?' : 'Reason for hiding rule?',
      restore ? 'Valid rule' : 'Old / wrong incentive rule',
    );

    if (reason === null) return;

    await axios.patch(
      `${API_BASE_URL}/staff/incentive-rule/${rule.id}/${
        restore ? 'restore' : 'hide'
      }`,
      { reason },
      { headers: headers() },
    );

    fetchRules();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Incentive Rules
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Create flexible incentive rules for any role, metric or calculation
          mode.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Loaded Rules</p>
          <p className="mt-2 text-2xl font-bold">{rules.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {rules.filter((r) => r.isActive).length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Payroll Linked</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {rules.filter((r) => r.includeInPayroll).length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Hidden View</p>
          <p className="mt-2 text-2xl font-bold text-orange-700">
            {showHidden ? 'On' : 'Off'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          {editingId ? 'Edit Incentive Rule' : 'Create Incentive Rule'}
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            placeholder="Rule Name"
            value={form.ruleName}
            onChange={(e) => setForm({ ...form, ruleName: e.target.value })}
            className="rounded-xl border p-3 md:col-span-2"
          />

          <select
            value={form.periodType}
            onChange={(e) => setForm({ ...form, periodType: e.target.value })}
            className="rounded-xl border p-3"
          >
            <option value="MONTHLY">Monthly</option>
            <option value="WEEKLY">Weekly</option>
            <option value="DAILY">Daily</option>
            <option value="CUSTOM">Custom</option>
          </select>

          <select
            value={form.metricType}
            onChange={(e) => setForm({ ...form, metricType: e.target.value })}
            className="rounded-xl border p-3"
          >
            {METRIC_TYPES.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll('_', ' ')}
              </option>
            ))}
          </select>

          <select
            value={form.calculationType}
            onChange={(e) =>
              setForm({ ...form, calculationType: e.target.value })
            }
            className="rounded-xl border p-3"
          >
            {CALC_TYPES.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll('_', ' ')}
              </option>
            ))}
          </select>

          <input
            placeholder="Custom Metric Name"
            value={form.customMetricName}
            onChange={(e) =>
              setForm({ ...form, customMetricName: e.target.value })
            }
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Eligibility Target"
            value={form.eligibilityTarget}
            onChange={(e) =>
              setForm({ ...form, eligibilityTarget: e.target.value })
            }
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Rate Amount"
            value={form.rateAmount}
            onChange={(e) => setForm({ ...form, rateAmount: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Percentage Rate"
            value={form.percentageRate}
            onChange={(e) =>
              setForm({ ...form, percentageRate: e.target.value })
            }
            className="rounded-xl border p-3"
          />
        </div>

        <div className="mt-4 rounded-xl border p-4">
          <p className="font-semibold text-gray-800">Applicable Roles</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {USER_ROLE_OPTIONS.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                  form.applicableRoles.includes(role)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
                {role.replaceAll('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <textarea
          placeholder="Description / rule explanation"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="mt-3 w-full rounded-xl border p-3"
        />

        <div className="mt-3 flex flex-wrap gap-3">
          <label className="rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={form.requiresApproval}
              onChange={(e) =>
                setForm({ ...form, requiresApproval: e.target.checked })
              }
            />{' '}
            Requires Approval
          </label>

          <label className="rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={form.includeInPayroll}
              onChange={(e) =>
                setForm({ ...form, includeInPayroll: e.target.checked })
              }
            />{' '}
            Include in Payroll
          </label>

          <label className="rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />{' '}
            Active
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={saveRule}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            {editingId ? 'Update Rule' : 'Create Rule'}
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
        <div className="grid gap-3 md:grid-cols-5">
          <input
            placeholder="Search rule"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border p-3"
          />

          <select
            value={metricType}
            onChange={(e) => {
              setMetricType(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border p-3"
          >
            <option value="">All Metrics</option>
            {METRIC_TYPES.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll('_', ' ')}
              </option>
            ))}
          </select>

          <select
            value={calculationType}
            onChange={(e) => {
              setCalculationType(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border p-3"
          >
            <option value="">All Calculations</option>
            {CALC_TYPES.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll('_', ' ')}
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
              fetchRules();
            }}
            className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Apply / Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          Incentive Rule Register
        </h2>

        <div className="mt-4 space-y-3">
          {rules.length === 0 ? (
            <p className="text-sm text-gray-500">No incentive rules found.</p>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className={`rounded-xl border p-4 ${
                  rule.isHidden ? 'bg-gray-100 opacity-70' : 'bg-white'
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-bold text-gray-900">
                      {rule.ruleName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {rule.metricType} | {rule.calculationType} |{' '}
                      {rule.periodType || 'MONTHLY'} |{' '}
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </p>
                    <p className="mt-2 text-sm">
                      Target: {rule.eligibilityTarget || 0} | Rate:{' '}
                      ₹{Number(rule.rateAmount || 0).toLocaleString('en-IN')} | %:{' '}
                      {rule.percentageRate || 0}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Roles:{' '}
                      {Array.isArray(rule.applicableRoles) &&
                      rule.applicableRoles.length
                        ? rule.applicableRoles.join(', ')
                        : 'Any / Not specified'}
                    </p>
                    {rule.description && (
                      <p className="mt-2 text-sm text-gray-700">
                        {rule.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!rule.isHidden && (
                      <button
                        onClick={() => startEdit(rule)}
                        className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Edit
                      </button>
                    )}

                    <button
                      onClick={() => hideRestore(rule, !!rule.isHidden)}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold text-white ${
                        rule.isHidden ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      {rule.isHidden ? 'Restore' : 'Hide'}
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
    </div>
  );
}
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
];

const METRIC_TYPES = ['NUMBER', 'PERCENTAGE', 'BOOLEAN', 'RATING', 'CUSTOM'];
const METRIC_UNITS = ['COUNT', 'AMOUNT', 'PERCENT', 'DAYS', 'HOURS', 'RATING', 'CUSTOM'];

const emptyMetric = {
  metricName: '',
  targetValue: '',
  metricType: 'NUMBER',
  metricUnit: 'COUNT',
  mandatory: false,
  weightage: '1',
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

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, showHidden]);

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
          metricName: m.metricName || '',
          targetValue: String(m.targetValue || ''),
          metricType: m.metricType || 'NUMBER',
          metricUnit: m.metricUnit || 'COUNT',
          mandatory: m.mandatory === true,
          weightage: String(m.weightage || 1),
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

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Performance Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Create role-wise performance templates with flexible KPI metrics.
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
              <div key={index} className="rounded-xl bg-gray-50 p-3">
                <div className="grid gap-3 md:grid-cols-6">
                  <input
                    placeholder="Metric Name"
                    value={metric.metricName}
                    onChange={(e) =>
                      updateMetric(index, 'metricName', e.target.value)
                    }
                    className="rounded-xl border p-3 md:col-span-2"
                  />

                  <input
                    type="number"
                    placeholder="Target"
                    value={metric.targetValue}
                    onChange={(e) =>
                      updateMetric(index, 'targetValue', e.target.value)
                    }
                    className="rounded-xl border p-3"
                  />

                  <select
                    value={metric.metricType}
                    onChange={(e) =>
                      updateMetric(index, 'metricType', e.target.value)
                    }
                    className="rounded-xl border p-3"
                  >
                    {METRIC_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <select
                    value={metric.metricUnit}
                    onChange={(e) =>
                      updateMetric(index, 'metricUnit', e.target.value)
                    }
                    className="rounded-xl border p-3"
                  >
                    {METRIC_UNITS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Weightage"
                    value={metric.weightage}
                    onChange={(e) =>
                      updateMetric(index, 'weightage', e.target.value)
                    }
                    className="rounded-xl border p-3"
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  <label className="rounded-xl border bg-white p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={metric.mandatory}
                      onChange={(e) =>
                        updateMetric(index, 'mandatory', e.target.checked)
                      }
                    />{' '}
                    Mandatory
                  </label>

                  <button
                    type="button"
                    onClick={() => removeMetric(index)}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Remove Metric
                  </button>
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
    </div>
  );
}
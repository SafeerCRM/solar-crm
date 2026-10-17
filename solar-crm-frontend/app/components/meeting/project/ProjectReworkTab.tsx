'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type MaterialMasterOption = {
  id: number;
  name: string;
  unit?: string | null;
  brand?: string | null;
};

type ReworkMaterial = {
  id: number;
  materialId: number;
  materialName: string;
  unit?: string | null;
  plannedQuantity: number | string;
  issuedQuantity: number | string;
  issuedCost: number | string;
  stockItemId?: number | null;
  branchId?: number | null;
  branchName?: string | null;
  remarks?: string | null;
};

type ReworkFinancials = {
  agreedAmount: number;
  receivedAmount: number;
  outstandingAmount: number;
  materialCost: number;
  otherExpenses: number;
  totalCost: number;
  expectedProfit: number;
};

type ReworkJob = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  agreedAmount: number | string;
  agreedDate?: string | null;
  completedDate?: string | null;
  remarks?: string | null;
  createdAt?: string;
  materials?: ReworkMaterial[];
expenses?: unknown[];
payments?: unknown[];
financials?: ReworkFinancials;
};

type Props = {
  projectId: number | string;
};

const money = (value: unknown) =>
  `₹${Number(value ?? 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;

const statuses = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

export default function ProjectReworkTab({
  projectId,
}: Props) {
  const [jobs, setJobs] = useState<ReworkJob[]>([]);
  const [materialOptions, setMaterialOptions] = useState<
  MaterialMasterOption[]
>([]);

const [materialLoading, setMaterialLoading] = useState(false);
const [materialBusyId, setMaterialBusyId] = useState<number | null>(null);

const [materialForms, setMaterialForms] = useState<
  Record<number, {
    materialId: string;
    plannedQuantity: string;
    remarks: string;
  }>
>({});
const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
const [editPlannedQuantity, setEditPlannedQuantity] = useState('');
const [editMaterialRemarks, setEditMaterialRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    agreedAmount: '',
    agreedDate: '',
    remarks: '',
  });

  const headers = () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token || ''}`,
    };
  };

  const loadJobs = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError('');

      const response = await axios.get(
        `${API_BASE_URL}/project/${projectId}/reworks`,
        { headers: headers() },
      );

      const data = response.data;

      setJobs(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.reworks)
            ? data.reworks
            : Array.isArray(data?.data)
              ? data.data
              : [],
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Unable to load Re-work jobs.',
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
  const loadMaterialOptions = async () => {
    try {
      setMaterialLoading(true);

      const response = await axios.get(
        `${API_BASE_URL}/project/material-master`,
        {
          params: { activeOnly: 'true' },
          headers: headers(),
        },
      );

      setMaterialOptions(
        Array.isArray(response.data) ? response.data : [],
      );
    } catch (err: any) {
      console.error('Unable to load Material Master', err);
      setError(
        err?.response?.data?.message ||
          'Unable to load Material Master.',
      );
    } finally {
      setMaterialLoading(false);
    }
  };

  void loadMaterialOptions();
}, []);

  const createJob = async () => {
    if (!form.title.trim()) {
      alert('Enter a Re-work title.');
      return;
    }

    const amount = Number(form.agreedAmount);

    if (
      form.agreedAmount.trim() === '' ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      alert('Enter a valid agreed amount.');
      return;
    }

    try {
      setSaving(true);

      await axios.post(
        `${API_BASE_URL}/project/${projectId}/reworks`,
        {
          title: form.title.trim(),
          description: form.description.trim(),
          agreedAmount: amount,
          agreedDate: form.agreedDate || null,
          remarks: form.remarks.trim(),
        },
        { headers: headers() },
      );

      setForm({
        title: '',
        description: '',
        agreedAmount: '',
        agreedDate: '',
        remarks: '',
      });

      setShowCreate(false);
      await loadJobs();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          'Unable to create Re-work.',
      );
    } finally {
      setSaving(false);
    }
  };

  const updateReworkMaterial = async (
  job: ReworkJob,
  material: ReworkMaterial,
) => {
  const quantity = Number(editPlannedQuantity);

  if (
    !editPlannedQuantity.trim() ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    Math.round(quantity * 1000) / 1000 !== quantity ||
    quantity < Number(material.issuedQuantity || 0)
  ) {
    alert('Enter a valid quantity, not less than already issued quantity.');
    return;
  }

  try {
    setMaterialBusyId(job.id);

    await axios.patch(
      `${API_BASE_URL}/project/${projectId}/reworks/${job.id}/materials/${material.id}`,
      {
        plannedQuantity: quantity,
        remarks: editMaterialRemarks,
      },
      { headers: headers() },
    );

    setEditingMaterialId(null);
    await loadJobs();
  } catch (err: any) {
    alert(
      err?.response?.data?.message ||
        'Unable to update Re-work material.',
    );
  } finally {
    setMaterialBusyId(null);
  }
};

  const addReworkMaterial = async (job: ReworkJob) => {
  const formData = materialForms[job.id];

  const materialId = Number(formData?.materialId);
  const plannedQuantity = Number(formData?.plannedQuantity);

  if (!Number.isInteger(materialId) || materialId <= 0) {
    alert('Please select a material.');
    return;
  }

  if (
    !formData?.plannedQuantity?.trim() ||
    !Number.isFinite(plannedQuantity) ||
    plannedQuantity <= 0 ||
    Math.round(plannedQuantity * 1000) / 1000 !==
      plannedQuantity
  ) {
    alert('Enter a positive quantity with up to 3 decimal places.');
    return;
  }

  if (
    job.materials?.some(
      (item) => Number(item.materialId) === materialId,
    )
  ) {
    alert('This material is already added to this Re-work.');
    return;
  }

  try {
    setMaterialBusyId(job.id);

    await axios.post(
      `${API_BASE_URL}/project/${projectId}/reworks/${job.id}/materials`,
      {
        materialId,
        plannedQuantity,
        remarks: formData.remarks.trim(),
      },
      {
        headers: headers(),
      },
    );

    setMaterialForms((prev) => {
      const next = { ...prev };
      delete next[job.id];
      return next;
    });

    await loadJobs();
  } catch (err: any) {
    alert(
      err?.response?.data?.message ||
        'Unable to add Re-work material.',
    );
  } finally {
    setMaterialBusyId(null);
  }
};

  const updateStatus = async (
    job: ReworkJob,
    status: string,
  ) => {
    if (status === job.status) return;

    if (
      !window.confirm(
        `Change Re-work #${job.id} to ${status.replaceAll('_', ' ')}?`,
      )
    ) {
      return;
    }

    try {
      setBusyId(job.id);

      await axios.patch(
        `${API_BASE_URL}/project/${projectId}/reworks/${job.id}/status`,
        { status },
        { headers: headers() },
      );

      await loadJobs();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          'Unable to update Re-work status.',
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Project Re-work
          </h2>
          <p className="text-sm text-gray-500">
            Additional work, materials and finances tracked
            separately from the original project.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate((value) => !value)}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
        >
          {showCreate ? 'Close' : '+ New Re-work'}
        </button>
      </div>

      {showCreate && (
        <div className="space-y-4 rounded-xl border bg-white p-4">
          <h3 className="font-semibold">Create Re-work</h3>

          <input
            className="w-full rounded-lg border p-3"
            placeholder="Re-work title"
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
          />

          <textarea
            className="w-full rounded-lg border p-3"
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>Agreed Amount (₹)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-lg border p-3"
                value={form.agreedAmount}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    agreedAmount: e.target.value,
                  }))
                }
              />
            </label>

            <label className="space-y-1 text-sm">
              <span>Agreed Date</span>
              <input
                type="date"
                className="w-full rounded-lg border p-3"
                value={form.agreedDate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    agreedDate: e.target.value,
                  }))
                }
              />
            </label>
          </div>

          <textarea
            className="w-full rounded-lg border p-3"
            placeholder="Remarks (optional)"
            value={form.remarks}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                remarks: e.target.value,
              }))
            }
          />

          <button
            type="button"
            disabled={saving}
            onClick={createJob}
            className="rounded-lg bg-green-700 px-5 py-2 text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Create Re-work'}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-gray-500">
          Loading Re-work jobs...
        </p>
      )}

      {!loading && !error && jobs.length === 0 && (
        <p className="rounded-xl border bg-gray-50 p-5 text-sm text-gray-600">
          No Re-work jobs recorded for this project.
        </p>
      )}

      {jobs.map((job) => {
        const isFinal =
          job.status === 'COMPLETED' ||
          job.status === 'CANCELLED';

        return (
          <div
            key={job.id}
            className="space-y-4 rounded-xl border bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">
                  Re-work #{job.id}
                </p>
                <h3 className="text-lg font-bold">
                  {job.title}
                </h3>
                {job.description && (
                  <p className="mt-1 text-sm text-gray-600">
                    {job.description}
                  </p>
                )}
              </div>

              <select
                value={job.status}
                disabled={isFinal || busyId === job.id}
                onChange={(e) =>
                  void updateStatus(job, e.target.value)
                }
                className="rounded-lg border px-3 py-2 text-sm"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">
                  Agreed Amount
                </p>
                <p className="font-bold">
                  {money(job.agreedAmount)}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">
                  Agreed Date
                </p>
                <p className="font-semibold">
                  {job.agreedDate || '-'}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">
                  Completion Date
                </p>
                <p className="font-semibold">
                  {job.completedDate || '-'}
                </p>
              </div>
            </div>

            {job.remarks && (
              <p className="text-sm text-gray-600">
                <strong>Remarks:</strong> {job.remarks}
              </p>
            )}

            {job.financials && (
  <div className="rounded-xl border bg-gray-50 p-4">
    <h4 className="mb-3 font-bold text-gray-900">
      Re-work Financial Summary
    </h4>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ['Agreed Amount', job.financials.agreedAmount],
        ['Payment Received', job.financials.receivedAmount],
        ['Outstanding', job.financials.outstandingAmount],
        ['Material Cost', job.financials.materialCost],
        ['Other Expenses', job.financials.otherExpenses],
        ['Total Cost', job.financials.totalCost],
        ['Expected Profit', job.financials.expectedProfit],
      ].map(([label, amount]) => (
        <div
          key={String(label)}
          className="rounded-lg border bg-white p-3"
        >
          <p className="text-xs text-gray-500">
            {label}
          </p>
          <p className="mt-1 font-semibold text-gray-900">
            {money(amount)}
          </p>
        </div>
      ))}
    </div>
  </div>
)}

<div className="rounded-xl border p-4">
  <h4 className="mb-3 font-bold">
    Re-work Materials
  </h4>

  {!job.materials?.length ? (
    <p className="text-sm text-gray-500">
      No materials planned yet.
    </p>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">Material</th>
            <th className="p-3">Planned</th>
            <th className="p-3">Issued</th>
            <th className="p-3">Remaining</th>
            <th className="p-3">Branch</th>
            <th className="p-3">Issued Cost</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>

        <tbody>
          {job.materials.map((material) => (
            <tr
              key={material.id}
              className="border-t"
            >
              <td className="p-3">
                {material.materialName}
              </td>

              <td className="p-3">
                {material.plannedQuantity} {material.unit || ''}
              </td>

              <td className="p-3">
                {material.issuedQuantity} {material.unit || ''}
              </td>

              <td className="p-3">
                {Math.max(
                  0,
                  Number(material.plannedQuantity) -
                    Number(material.issuedQuantity),
                )}{' '}
                {material.unit || ''}
              </td>

              <td className="p-3">
                {material.branchName || '-'}
              </td>

              <td className="p-3">
                {money(material.issuedCost)}
              </td>

              <td className="p-3">
  {!isFinal && (
    editingMaterialId === material.id ? (
      <div className="flex min-w-44 flex-col gap-2">
        <input
          type="number"
          min={Math.max(0.001, Number(material.issuedQuantity || 0))}
          step="0.001"
          className="w-36 rounded border p-2"
          value={editPlannedQuantity}
          onChange={(e) => setEditPlannedQuantity(e.target.value)}
        />
        <input
          type="text"
          placeholder="Remarks"
          className="w-44 rounded border p-2"
          value={editMaterialRemarks}
          onChange={(e) => setEditMaterialRemarks(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={materialBusyId === job.id}
            onClick={() => void updateReworkMaterial(job, material)}
            className="rounded bg-green-700 px-3 py-1 text-white"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditingMaterialId(null)}
            className="rounded border px-3 py-1"
          >
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => {
          setEditingMaterialId(material.id);
          setEditPlannedQuantity(String(material.plannedQuantity));
          setEditMaterialRemarks(material.remarks || '');
        }}
        className="rounded border px-3 py-1 text-blue-700"
      >
        Edit
      </button>
    )
  )}
</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

{!isFinal && (
  <div className="rounded-xl border bg-gray-50 p-4">
    <h4 className="mb-3 font-semibold">
      Add Material to Re-work
    </h4>

    <div className="grid gap-3 md:grid-cols-3">
      <select
        className="rounded-lg border bg-white p-3"
        value={materialForms[job.id]?.materialId || ''}
        disabled={materialLoading || materialBusyId === job.id}
        onChange={(e) =>
          setMaterialForms((prev) => ({
            ...prev,
            [job.id]: {
              materialId: e.target.value,
              plannedQuantity:
                prev[job.id]?.plannedQuantity || '',
              remarks: prev[job.id]?.remarks || '',
            },
          }))
        }
      >
        <option value="">
          {materialLoading
            ? 'Loading materials...'
            : 'Select Material'}
        </option>

        {materialOptions
          .filter(
            (item) =>
              !job.materials?.some(
                (existing) =>
                  Number(existing.materialId) === Number(item.id),
              ),
          )
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.brand ? ` - ${item.brand}` : ''}
              {item.unit ? ` (${item.unit})` : ''}
            </option>
          ))}
      </select>

      <input
        type="number"
        min="0.001"
        step="0.001"
        placeholder="Planned Quantity"
        className="rounded-lg border bg-white p-3"
        value={materialForms[job.id]?.plannedQuantity || ''}
        onChange={(e) =>
          setMaterialForms((prev) => ({
            ...prev,
            [job.id]: {
              materialId: prev[job.id]?.materialId || '',
              plannedQuantity: e.target.value,
              remarks: prev[job.id]?.remarks || '',
            },
          }))
        }
      />

      <input
        type="text"
        placeholder="Remarks (optional)"
        className="rounded-lg border bg-white p-3"
        value={materialForms[job.id]?.remarks || ''}
        onChange={(e) =>
          setMaterialForms((prev) => ({
            ...prev,
            [job.id]: {
              materialId: prev[job.id]?.materialId || '',
              plannedQuantity:
                prev[job.id]?.plannedQuantity || '',
              remarks: e.target.value,
            },
          }))
        }
      />
    </div>

    <button
      type="button"
      disabled={materialBusyId === job.id || materialLoading}
      onClick={() => void addReworkMaterial(job)}
      className="mt-3 rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
    >
      {materialBusyId === job.id
        ? 'Saving Material...'
        : '+ Add Material'}
    </button>
  </div>
)}
          </div>
        );
      })}
    </div>
  );
}
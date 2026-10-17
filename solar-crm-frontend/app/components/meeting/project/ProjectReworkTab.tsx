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

type ReworkStockItem = {
  id: number;
  materialId: number;
  materialName: string;
  branchId?: number | null;
  branchName?: string | null;
  currentQuantity: number | string;
  reservedQuantity: number | string;
  averageRate: number | string;
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
const [materialSearch, setMaterialSearch] = useState<
  Record<number, string>
>({});

const [openMaterialSearchId, setOpenMaterialSearchId] =
  useState<number | null>(null);
const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
const [editPlannedQuantity, setEditPlannedQuantity] = useState('');
const [editMaterialRemarks, setEditMaterialRemarks] = useState('');
const [issuingMaterialId, setIssuingMaterialId] =
  useState<number | null>(null);

const [stockOptions, setStockOptions] = useState<
  ReworkStockItem[]
>([]);

const [stockLoading, setStockLoading] = useState(false);
const [issueBusy, setIssueBusy] = useState(false);

const [issueForm, setIssueForm] = useState({
  stockItemId: '',
  quantity: '',
  remarks: '',
});

const [issueRequestId, setIssueRequestId] = useState<string | null>(
  null,
);
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

  const openIssueMaterial = async (material: ReworkMaterial) => {
  setIssuingMaterialId(material.id);
  setStockOptions([]);
  setIssueForm({
    stockItemId: '',
    quantity: '',
    remarks: '',
  });
  setIssueRequestId(null);

  try {
    setStockLoading(true);

    const matchingStock: ReworkStockItem[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const response = await axios.get(
        `${API_BASE_URL}/project/stock/items`,
        {
          params: {
            page,
            limit: 100,
            material: material.materialName,
          },
          headers: headers(),
        },
      );

      const data = response.data;

      const rows: ReworkStockItem[] = Array.isArray(data?.data)
        ? data.data
        : [];

      matchingStock.push(
        ...rows.filter(
          (item) =>
            Number(item.materialId) === Number(material.materialId),
        ),
      );

      totalPages = Math.ceil(
        Number(data?.total || 0) / 100,
      );

      page += 1;
    } while (page <= totalPages);

    setStockOptions(matchingStock);
  } catch (err: any) {
    alert(
      err?.response?.data?.message ||
        'Unable to load branch stock.',
    );
    setIssuingMaterialId(null);
  } finally {
    setStockLoading(false);
  }
};

const issueReworkMaterial = async (
  job: ReworkJob,
  material: ReworkMaterial,
) => {
  const stockItemId = Number(issueForm.stockItemId);
  const quantity = Number(issueForm.quantity);

  const selectedStock = stockOptions.find(
    (item) => item.id === stockItemId,
  );

  const remaining = Math.round(
    (Number(material.plannedQuantity) -
      Number(material.issuedQuantity)) * 1000,
  ) / 1000;

  const available = selectedStock
    ? Number(selectedStock.currentQuantity || 0) -
      Number(selectedStock.reservedQuantity || 0)
    : 0;

  if (!selectedStock) {
    alert('Select a valid branch stock item.');
    return;
  }

  if (
    !issueForm.quantity.trim() ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    Math.round(quantity * 1000) / 1000 !== quantity
  ) {
    alert('Enter a valid issue quantity (up to 3 decimals).');
    return;
  }

  if (quantity > remaining) {
    alert(`Remaining planned quantity is ${remaining}.`);
    return;
  }

  if (quantity > available) {
    alert(`Available branch stock is ${available}.`);
    return;
  }

  if (
    !window.confirm(
      `Issue ${quantity} ${material.unit || ''} of ` +
      `${material.materialName} from ` +
      `${selectedStock.branchName || 'selected branch'}?\n\n` +
      `This will deduct physical stock and record the cost ` +
      `against Re-work #${job.id}.`,
    )
  ) {
    return;
  }

  // Keep the same UUID when retrying an uncertain request.
  const requestId = issueRequestId || crypto.randomUUID();
  setIssueRequestId(requestId);

  try {
    setIssueBusy(true);

    await axios.post(
      `${API_BASE_URL}/project/${projectId}/reworks/${job.id}/materials/${material.id}/issue`,
      {
        stockItemId,
        quantity,
        requestId,
        remarks: issueForm.remarks.trim(),
      },
      { headers: headers() },
    );

    setIssuingMaterialId(null);
    setStockOptions([]);
    setIssueForm({
      stockItemId: '',
      quantity: '',
      remarks: '',
    });
    setIssueRequestId(null);

    await loadJobs();

    alert('Re-work material issued successfully.');
  } catch (err: any) {
    alert(
      err?.response?.data?.message ||
        'Issuance could not be confirmed. Retry with the same details.',
    );
  } finally {
    setIssueBusy(false);
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

    setMaterialSearch((prev) => {
  const next = { ...prev };
  delete next[job.id];
  return next;
});

setOpenMaterialSearchId(null);

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

  {!isFinal &&
    Number(material.plannedQuantity) >
      Number(material.issuedQuantity) && (
      <button
        type="button"
        disabled={issueBusy || stockLoading}
        onClick={() => void openIssueMaterial(material)}
        className="ml-2 rounded border border-green-700 px-3 py-1 text-green-700 disabled:opacity-50"
      >
        Issue
      </button>
    )}
</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

{!isFinal &&
  job.materials?.map((material) =>
    issuingMaterialId === material.id ? (
      <div
        key={material.id}
        className="space-y-3 rounded-xl border bg-gray-50 p-4"
      >
        <h4 className="font-semibold">
          Issue Material — {material.materialName}
        </h4>

        <p className="text-sm text-gray-600">
          Remaining planned:{' '}
          {Math.max(
            0,
            Number(material.plannedQuantity) -
              Number(material.issuedQuantity),
          )}{' '}
          {material.unit || ''}
        </p>

        <select
          className="w-full rounded-lg border bg-white p-3"
          disabled={stockLoading || issueBusy}
          value={issueForm.stockItemId}
          onChange={(e) => {
            setIssueForm((prev) => ({
              ...prev,
              stockItemId: e.target.value,
            }));
            setIssueRequestId(null);
          }}
        >
          <option value="">
            {stockLoading
              ? 'Loading branch stock...'
              : 'Select Branch Stock'}
          </option>

          {stockOptions.map((stock) => {
            const available =
              Number(stock.currentQuantity || 0) -
              Number(stock.reservedQuantity || 0);

            return (
              <option
                key={stock.id}
                value={stock.id}
                disabled={available <= 0}
              >
                {stock.branchName || 'Unnamed Branch'}
                {' — '}
                Available: {Math.max(0, available)}
                {' — '}
                Rate: {money(stock.averageRate)}
              </option>
            );
          })}
        </select>

        {!stockLoading && stockOptions.length === 0 && (
          <p className="text-sm text-amber-700">
            No matching branch stock found for this material.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="number"
            min="0.001"
            step="0.001"
            placeholder="Quantity to Issue"
            className="rounded-lg border bg-white p-3"
            value={issueForm.quantity}
            disabled={issueBusy}
            onChange={(e) => {
              setIssueForm((prev) => ({
                ...prev,
                quantity: e.target.value,
              }));
              setIssueRequestId(null);
            }}
          />

          <input
            type="text"
            placeholder="Issue Remarks (optional)"
            className="rounded-lg border bg-white p-3"
            value={issueForm.remarks}
            disabled={issueBusy}
            onChange={(e) => {
              setIssueForm((prev) => ({
                ...prev,
                remarks: e.target.value,
              }));
              setIssueRequestId(null);
            }}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={
              issueBusy ||
              stockLoading ||
              !issueForm.stockItemId
            }
            onClick={() =>
              void issueReworkMaterial(job, material)
            }
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {issueBusy ? 'Issuing...' : 'Confirm Issue'}
          </button>

          <button
            type="button"
            disabled={issueBusy}
            onClick={() => {
              setIssuingMaterialId(null);
              setStockOptions([]);
              setIssueRequestId(null);
            }}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    ) : null,
  )}

{!isFinal && (
  <div className="rounded-xl border bg-gray-50 p-4">
    <h4 className="mb-3 font-semibold">
      Add Material to Re-work
    </h4>

    <div className="grid gap-3 md:grid-cols-3">
      <div className="relative min-w-0">
  <input
    type="text"
    className="w-full rounded-lg border bg-white p-3"
    placeholder={
      materialLoading
        ? 'Loading materials...'
        : 'Search material name or brand...'
    }
    disabled={materialLoading || materialBusyId === job.id}
    value={materialSearch[job.id] || ''}
    onFocus={() => setOpenMaterialSearchId(job.id)}
    onChange={(e) => {
      setMaterialSearch((prev) => ({
        ...prev,
        [job.id]: e.target.value,
      }));

      setMaterialForms((prev) => ({
        ...prev,
        [job.id]: {
          materialId: '',
          plannedQuantity: prev[job.id]?.plannedQuantity || '',
          remarks: prev[job.id]?.remarks || '',
        },
      }));

      setOpenMaterialSearchId(job.id);
    }}
  />

  {openMaterialSearchId === job.id && !materialLoading && (
    <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-white shadow-xl">
      {materialOptions
        .filter((item) => {
          const search = (materialSearch[job.id] || '')
            .trim()
            .toLowerCase();

          const name = String(item.name || '').toLowerCase();
          const brand = String(item.brand || '').toLowerCase();


          return (
  !job.materials?.some(
    (existing) =>
      Number(existing.materialId) === Number(item.id),
  ) &&
  (name.includes(search) || brand.includes(search))
);
        })
        .slice(0, 50)
        .map((item) => (
          <button
            key={item.id}
            type="button"
            className="block w-full border-b px-3 py-2 text-left text-sm hover:bg-blue-50"
            onClick={() => {
              setMaterialForms((prev) => ({
                ...prev,
                [job.id]: {
                  materialId: String(item.id),
                  plannedQuantity:
                    prev[job.id]?.plannedQuantity || '',
                  remarks: prev[job.id]?.remarks || '',
                },
              }));

              setMaterialSearch((prev) => ({
                ...prev,
                [job.id]: [
                  item.name,
                  item.brand,
                ].filter(Boolean).join(' - '),
              }));

              setOpenMaterialSearchId(null);
            }}
          >
            {item.name}
            {item.brand ? ` — ${item.brand}` : ''}
            {item.unit ? ` (${item.unit})` : ''}
          </button>
        ))}
    </div>
  )}
</div>

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
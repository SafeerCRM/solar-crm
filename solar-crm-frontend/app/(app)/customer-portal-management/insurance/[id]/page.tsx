'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  useParams,
} from 'next/navigation';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type InsuranceRecord = {
  id: number;

  projectId: number;
  customerId: number;

  customerCode?: string;
  customerName?: string;
  customerPhone?: string;

  city?: string;
  branchName?: string;

  insurancePlanId?: number;
  previousInsuranceId?: number;

  companyName: string;
  policyName: string;
  policyNumber?: string;

  policyCost: number;
  coverageAmount?: number;

  startDate: string;
  expiryDate: string;

  status: string;

  remarks?: string;

  createdByName?: string;

  createdAt?: string;
  updatedAt?: string;
};

type InsuranceDocument = {
  id: number;

  insuranceId: number;

  documentType: string;

  fileName: string;
  fileUrl: string;

  mimeType?: string;
  fileSize?: number;

  visibleToCustomer: boolean;
  isHidden: boolean;

  uploadedByName?: string;
  createdAt?: string;
};

type ProjectRecord = {
  id: number;

  customerName?: string;
  customerPhone?: string;

  customerCode?: string;

  city?: string;
  branchName?: string;

  status?: string;

  electricityKNumber?: string;
};

type DetailResponse = {
  insurance: InsuranceRecord;
  project?: ProjectRecord;
  documents?: InsuranceDocument[];
  history?: InsuranceRecord[];
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

function formatDateTime(
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

function StatusBadge({
  status,
}: {
  status?: string;
}) {
  const normalized =
    String(
      status || '',
    )
      .trim()
      .toUpperCase();

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
    normalized === 'CANCELLED'
  ) {
    className =
      'bg-gray-200 text-gray-700';
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

const compressImageFile = async (
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

      img.onload = () => {
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

            if (!blob) {
              resolve(file);

              return;
            }

            resolve(
              new File(
                [blob],

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

          resolve(file);
        };

      img.src = url;
    },
  );
};


export default function InsuranceDetailPage() {
  const params =
    useParams();

  const insuranceId =
    Number(
      params?.id || 0,
    );

  const [
    detail,
    setDetail,
  ] =
    useState<
      DetailResponse | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    uploading,
    setUploading,
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
    selectedFile,
    setSelectedFile,
  ] =
    useState<
      File | null
    >(null);

  const [
    documentType,
    setDocumentType,
  ] =
    useState(
      'POLICY',
    );

  const [
    visibleToCustomer,
    setVisibleToCustomer,
  ] =
    useState(true);

    const [
  editing,
  setEditing,
] =
  useState(false);

const [
  savingPolicy,
  setSavingPolicy,
] =
  useState(false);

const [
  editForm,
  setEditForm,
] =
  useState({
    companyName: '',
    policyName: '',
    policyNumber: '',
    policyCost: '',
    coverageAmount: '',
    startDate: '',
    expiryDate: '',
    status: '',
    remarks: '',
  });

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

  const loadDetail =
    useCallback(
      async () => {
        if (
          !insuranceId
        ) {
          return;
        }

        try {
          setLoading(true);
          setError('');

          const res =
            await axios.get(
              `${API_BASE_URL}/project/insurance/${insuranceId}`,
              {
                headers:
                  headers(),
              },
            );

          setDetail(
            res.data ||
            null,
          );
        } catch (
          error: any
        ) {
          console.error(
            error,
          );

          setDetail(
            null,
          );

          setError(
            error?.response
              ?.data
              ?.message ||
              'Failed to load insurance record',
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [insuranceId],
    );

  useEffect(() => {
    loadDetail();
  }, [
    loadDetail,
  ]);

  const uploadDocument =
    async () => {
      if (
        !selectedFile
      ) {
        setError(
          'Please select a document',
        );

        return;
      }

      try {
        setUploading(
          true,
        );

        setError('');
        setSuccess('');

        const formData =
          new FormData();

        formData.append(
          'file',
          selectedFile,
        );

        formData.append(
          'documentType',
          documentType,
        );

        formData.append(
          'visibleToCustomer',
          String(
            visibleToCustomer,
          ),
        );

        await axios.post(
          `${API_BASE_URL}/project/insurance/${insuranceId}/documents/upload`,
          formData,
          {
            headers: {
              ...headers(),

              'Content-Type':
                'multipart/form-data',
            },
          },
        );

        setSuccess(
          'Insurance document uploaded successfully',
        );

        setSelectedFile(
          null,
        );

        setDocumentType(
          'POLICY',
        );

        setVisibleToCustomer(
          true,
        );

        const fileInput =
          document.getElementById(
            'insurance-document-file',
          ) as HTMLInputElement | null;

        if (fileInput) {
          fileInput.value =
            '';
        }

        await loadDetail();
      } catch (
        error: any
      ) {
        console.error(
          error,
        );

        setError(
          error?.response
            ?.data
            ?.message ||
            'Failed to upload insurance document',
        );
      } finally {
        setUploading(
          false,
        );
      }
    };

  const updateVisibility =
    async (
      documentId: number,
      nextVisible:
        boolean,
    ) => {
      try {
        setError('');
        setSuccess('');

        await axios.patch(
          `${API_BASE_URL}/project/insurance/documents/${documentId}/customer-visibility`,
          {
            visibleToCustomer:
              nextVisible,
          },
          {
            headers:
              headers(),
          },
        );

        setSuccess(
          nextVisible
            ? 'Document is now visible to customer'
            : 'Document hidden from customer',
        );

        await loadDetail();
      } catch (
        error: any
      ) {
        setError(
          error?.response
            ?.data
            ?.message ||
            'Failed to update document visibility',
        );
      }
    };

    const startPolicyEdit =
  () => {
    if (
      !detail?.insurance
    ) {
      return;
    }

    const item =
      detail.insurance;

    setEditForm({
      companyName:
        item.companyName ||
        '',

      policyName:
        item.policyName ||
        '',

      policyNumber:
        item.policyNumber ||
        '',

      policyCost:
        String(
          item.policyCost ??
            '',
        ),

      coverageAmount:
        item.coverageAmount ===
          undefined ||
        item.coverageAmount ===
          null
          ? ''
          : String(
              item.coverageAmount,
            ),

      startDate:
        String(
          item.startDate ||
            '',
        ).slice(
          0,
          10,
        ),

      expiryDate:
        String(
          item.expiryDate ||
            '',
        ).slice(
          0,
          10,
        ),

      status:
        item.status ||
        'ACTIVE',

      remarks:
        item.remarks ||
        '',
    });

    setEditing(
      true,
    );
  };

  const savePolicyEdit =
  async () => {
    try {
      setSavingPolicy(
        true,
      );

      setError('');
      setSuccess('');

      await axios.patch(
        `${API_BASE_URL}/project/insurance/${insuranceId}`,
        {
          companyName:
            editForm.companyName,

          policyName:
            editForm.policyName,

          policyNumber:
            editForm.policyNumber,

          policyCost:
            Number(
              editForm.policyCost,
            ),

          coverageAmount:
            editForm.coverageAmount ===
            ''
              ? null
              : Number(
                  editForm.coverageAmount,
                ),

          startDate:
            editForm.startDate,

          expiryDate:
            editForm.expiryDate,

          status:
            editForm.status,

          remarks:
            editForm.remarks,
        },
        {
          headers:
            headers(),
        },
      );

      setSuccess(
        'Insurance policy updated successfully',
      );

      setEditing(
        false,
      );

      await loadDetail();
    } catch (
      error: any
    ) {
      setError(
        error?.response
          ?.data
          ?.message ||
          'Failed to update insurance policy',
      );
    } finally {
      setSavingPolicy(
        false,
      );
    }
  };

  const hideDocument =
    async (
      documentId: number,
    ) => {
      const confirmed =
        window.confirm(
          'Hide this insurance document?',
        );

      if (!confirmed) {
        return;
      }

      try {
        setError('');
        setSuccess('');

        await axios.patch(
          `${API_BASE_URL}/project/insurance/documents/${documentId}/hide`,
          {},
          {
            headers:
              headers(),
          },
        );

        setSuccess(
          'Insurance document hidden successfully',
        );

        await loadDetail();
      } catch (
        error: any
      ) {
        setError(
          error?.response
            ?.data
            ?.message ||
            'Failed to hide insurance document',
        );
      }
    };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl p-4">
        <div className="rounded-[2rem] bg-white p-10 text-center text-sm font-bold text-gray-500 shadow-xl">
          Loading insurance
          details...
        </div>
      </main>
    );
  }

  if (
    !detail?.insurance
  ) {
    return (
      <main className="mx-auto max-w-7xl space-y-4 p-4">
        <Link
          href="/customer-portal-management/insurance"
          className="inline-flex rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white"
        >
          ← Insurance Management
        </Link>

        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center font-bold text-red-700">
          {error ||
            'Insurance record not found'}
        </div>
      </main>
    );
  }

  const insurance =
    detail.insurance;

  const project =
    detail.project;

  const documents =
    Array.isArray(
      detail.documents,
    )
      ? detail.documents
      : [];

  const history =
    Array.isArray(
      detail.history,
    )
      ? detail.history
      : [];

  return (
    <main className="mx-auto max-w-7xl space-y-5 p-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/customer-portal-management/insurance"
          className="rounded-2xl bg-gray-900 px-4 py-2 text-sm font-black text-white"
        >
          ← Insurance Management
        </Link>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/project/${insurance.projectId}`}
            className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-700"
          >
            View Project
          </Link>

          <Link
            href="/customer-portal-management/insurance/requests"
            className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-black text-white"
          >
            Requests & Renewals
          </Link>
        </div>
      </div>

      <section className="rounded-[2rem] bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-600 p-6 text-white shadow-2xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-white/75">
              Customer Insurance
            </p>

            <h1 className="mt-2 text-3xl font-black">
              {insurance.customerName ||
                `Insurance #${insurance.id}`}
            </h1>

            <p className="mt-2 text-sm font-semibold text-white/85">
              {insurance.companyName}{' '}
              —{' '}
              {insurance.policyName}
            </p>
          </div>

          <StatusBadge
            status={
              insurance.status
            }
          />
        </div>
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

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-white p-5 shadow-xl">
          <h2 className="text-xl font-black text-gray-900">
            Customer & Project
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoItem
              label="Customer"
              value={
                insurance.customerName ||
                '-'
              }
            />

            <InfoItem
              label="Phone"
              value={
                insurance.customerPhone ||
                '-'
              }
            />

            <InfoItem
              label="K Number / Customer Code"
              value={
                insurance.customerCode ||
                project?.customerCode ||
                '-'
              }
            />

            <InfoItem
              label="Project ID"
              value={`#${insurance.projectId}`}
            />

            <InfoItem
              label="Project Status"
              value={
                project?.status ||
                '-'
              }
            />

            <InfoItem
              label="City"
              value={
                insurance.city ||
                project?.city ||
                '-'
              }
            />

            <InfoItem
              label="Branch"
              value={
                insurance.branchName ||
                project?.branchName ||
                '-'
              }
            />

            <InfoItem
              label="Electricity K Number"
              value={
                project?.electricityKNumber ||
                '-'
              }
            />
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-5 shadow-xl">
          <h2 className="text-xl font-black text-gray-900">
            Policy Information
          </h2>

          <button
  type="button"
  onClick={
    startPolicyEdit
  }
  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white"
>
  Edit Policy
</button>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoItem
              label="Insurance Company"
              value={
                insurance.companyName
              }
            />

            <InfoItem
              label="Policy"
              value={
                insurance.policyName
              }
            />

            <InfoItem
              label="Policy Number"
              value={
                insurance.policyNumber ||
                'Not entered'
              }
            />

            <InfoItem
              label="Policy Cost"
              value={
                formatMoney(
                  insurance.policyCost,
                )
              }
            />

            <InfoItem
              label="Coverage"
              value={
                insurance.coverageAmount ===
                  undefined ||
                insurance.coverageAmount ===
                  null
                  ? '-'
                  : formatMoney(
                      insurance.coverageAmount,
                    )
              }
            />

            <InfoItem
              label="Start Date"
              value={
                formatDate(
                  insurance.startDate,
                )
              }
            />

            <InfoItem
              label="Expiry Date"
              value={
                formatDate(
                  insurance.expiryDate,
                )
              }
            />

            <InfoItem
              label="Status"
              value={
                formatLabel(
                  insurance.status,
                )
              }
            />
          </div>

          {insurance.remarks && (
            <div className="mt-5 rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-black uppercase text-gray-400">
                Remarks
              </p>

              <p className="mt-2 text-sm font-semibold text-gray-700">
                {
                  insurance.remarks
                }
              </p>
            </div>
          )}
        </div>
      </section>

      {editing && (
  <section className="rounded-[2rem] bg-white p-5 shadow-xl">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xl font-black text-gray-900">
        Edit Insurance Policy
      </h2>

      <button
        type="button"
        onClick={() =>
          setEditing(
            false,
          )
        }
        className="rounded-xl border px-3 py-2 text-sm font-black"
      >
        Cancel
      </button>
    </div>

    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <input
        value={
          editForm.companyName
        }
        onChange={(
          e,
        ) =>
          setEditForm({
            ...editForm,
            companyName:
              e.target.value,
          })
        }
        placeholder="Insurance Company"
        className="rounded-2xl border px-4 py-3"
      />

      <input
        value={
          editForm.policyName
        }
        onChange={(
          e,
        ) =>
          setEditForm({
            ...editForm,
            policyName:
              e.target.value,
          })
        }
        placeholder="Policy Name"
        className="rounded-2xl border px-4 py-3"
      />

      <input
        value={
          editForm.policyNumber
        }
        onChange={(
          e,
        ) =>
          setEditForm({
            ...editForm,
            policyNumber:
              e.target.value,
          })
        }
        placeholder="Policy Number"
        className="rounded-2xl border px-4 py-3"
      />

      <input
        type="number"
        value={
          editForm.policyCost
        }
        onChange={(
          e,
        ) =>
          setEditForm({
            ...editForm,
            policyCost:
              e.target.value,
          })
        }
        placeholder="Policy Cost"
        className="rounded-2xl border px-4 py-3"
      />

      <input
        type="number"
        value={
          editForm.coverageAmount
        }
        onChange={(
          e,
        ) =>
          setEditForm({
            ...editForm,
            coverageAmount:
              e.target.value,
          })
        }
        placeholder="Coverage Amount"
        className="rounded-2xl border px-4 py-3"
      />

      <select
        value={
          editForm.status
        }
        onChange={(
          e,
        ) =>
          setEditForm({
            ...editForm,
            status:
              e.target.value,
          })
        }
        className="rounded-2xl border bg-white px-4 py-3"
      >
        <option value="ACTIVE">
          Active
        </option>

        <option value="RENEWAL_REQUESTED">
          Renewal Requested
        </option>

        <option value="RENEWED">
          Renewed
        </option>

        <option value="EXPIRED">
          Expired
        </option>

        <option value="CANCELLED">
          Cancelled
        </option>
      </select>

      <input
        type="date"
        value={
          editForm.startDate
        }
        onChange={(
          e,
        ) =>
          setEditForm({
            ...editForm,
            startDate:
              e.target.value,
          })
        }
        className="rounded-2xl border px-4 py-3"
      />

      <input
        type="date"
        value={
          editForm.expiryDate
        }
        onChange={(
          e,
        ) =>
          setEditForm({
            ...editForm,
            expiryDate:
              e.target.value,
          })
        }
        className="rounded-2xl border px-4 py-3"
      />
    </div>

    <textarea
      rows={4}
      value={
        editForm.remarks
      }
      onChange={(
        e,
      ) =>
        setEditForm({
          ...editForm,
          remarks:
            e.target.value,
        })
      }
      placeholder="Remarks"
      className="mt-4 w-full rounded-2xl border px-4 py-3"
    />

    <button
      type="button"
      disabled={
        savingPolicy
      }
      onClick={
        savePolicyEdit
      }
      className="mt-4 rounded-2xl bg-gray-900 px-6 py-3 text-sm font-black text-white disabled:opacity-50"
    >
      {savingPolicy
        ? 'Saving...'
        : 'Save Changes'}
    </button>
  </section>
)}

      <section className="rounded-[2rem] bg-white p-5 shadow-xl">
        <div>
          <h2 className="text-xl font-black text-gray-900">
            Upload Insurance Document
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Upload policy PDFs,
            receipts, invoices or
            renewal documents.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">
              Document
            </span>

            <input
              id="insurance-document-file"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={async (
  event,
) => {
  const file =
    event.target
      .files?.[0] ||
    null;

  if (!file) {
    setSelectedFile(
      null,
    );

    return;
  }

  try {
    setError('');

    const processedFile =
      await compressImageFile(
        file,
      );

    setSelectedFile(
      processedFile,
    );
  } catch (
    error
  ) {
    console.error(
      error,
    );

    setSelectedFile(
      null,
    );

    setError(
      'Failed to process selected document',
    );
  }
}}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-black uppercase text-gray-500">
              Document Type
            </span>

            <select
              value={
                documentType
              }
              onChange={(
                event,
              ) =>
                setDocumentType(
                  event.target
                    .value,
                )
              }
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm"
            >
              <option value="POLICY">
                Policy
              </option>

              <option value="RECEIPT">
                Receipt
              </option>

              <option value="INVOICE">
                Invoice
              </option>

              <option value="CLAIM_DOCUMENT">
                Claim Document
              </option>

              <option value="RENEWAL_DOCUMENT">
                Renewal Document
              </option>

              <option value="OTHER">
                Other
              </option>
            </select>
          </label>

          <label className="flex items-end">
            <span className="flex w-full items-center gap-3 rounded-2xl border border-gray-300 px-4 py-3">
              <input
                type="checkbox"
                checked={
                  visibleToCustomer
                }
                onChange={(
                  event,
                ) =>
                  setVisibleToCustomer(
                    event.target
                      .checked,
                  )
                }
                className="h-4 w-4"
              />

              <span className="text-sm font-black text-gray-700">
                Visible to Customer
              </span>
            </span>
          </label>
        </div>

        <button
          type="button"
          disabled={
            uploading ||
            !selectedFile
          }
          onClick={
            uploadDocument
          }
          className="mt-4 rounded-2xl bg-gray-900 px-6 py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {uploading
            ? 'Uploading...'
            : 'Upload Document'}
        </button>
      </section>

      <section className="rounded-[2rem] bg-white p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              Policy Documents
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Control which files
              can be viewed by the
              customer.
            </p>
          </div>

          <span className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-black text-gray-700">
            {documents.length}{' '}
            document
            {documents.length ===
            1
              ? ''
              : 's'}
          </span>
        </div>

        {documents.length ===
        0 ? (
          <div className="mt-5 rounded-2xl bg-gray-50 p-8 text-center text-sm font-bold text-gray-500">
            No insurance documents
            uploaded yet.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {documents.map(
              (
                document,
              ) => (
                <div
                  key={
                    document.id
                  }
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 p-4 md:flex-row md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-800">
                        {formatLabel(
                          document.documentType,
                        )}
                      </span>

                      {document.visibleToCustomer ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                          Customer Visible
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700">
                          Internal Only
                        </span>
                      )}
                    </div>

                    <p className="mt-2 truncate font-black text-gray-900">
                      {
                        document.fileName
                      }
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Uploaded{' '}
                      {formatDateTime(
                        document.createdAt,
                      )}

                      {document.uploadedByName
                        ? ` by ${document.uploadedByName}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={
                        document.fileUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white"
                    >
                      Open
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        updateVisibility(
                          document.id,
                          !document.visibleToCustomer,
                        )
                      }
                      className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-white"
                    >
                      {document.visibleToCustomer
                        ? 'Make Internal'
                        : 'Show Customer'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        hideDocument(
                          document.id,
                        )
                      }
                      className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white"
                    >
                      Hide
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </section>

      <section className="rounded-[2rem] bg-white p-5 shadow-xl">
        <div>
          <h2 className="text-xl font-black text-gray-900">
            Insurance History
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Previous and renewed
            policies for this
            project remain
            preserved.
          </p>
        </div>

        {history.length ===
        0 ? (
          <div className="mt-5 rounded-2xl bg-gray-50 p-8 text-center text-sm font-bold text-gray-500">
            No insurance history.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {history.map(
              (
                item,
              ) => (
                <div
                  key={
                    item.id
                  }
                  className={[
                    'rounded-2xl border p-4',
                    item.id ===
                    insurance.id
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-gray-200 bg-white',
                  ].join(' ')}
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

                        {item.id ===
                          insurance.id && (
                          <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-black text-white">
                            Current View
                          </span>
                        )}

                        <StatusBadge
                          status={
                            item.status
                          }
                        />
                      </div>

                      <p className="mt-2 text-sm font-semibold text-gray-600">
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
                          Policy{' '}
                          {
                            item.policyNumber
                          }
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <p className="font-black text-gray-900">
                        {formatMoney(
                          item.policyCost,
                        )}
                      </p>

                      {item.id !==
                        insurance.id && (
                        <Link
                          href={`/customer-portal-management/insurance/${item.id}`}
                          className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-black text-white"
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </div>

                  {item.previousInsuranceId && (
                    <p className="mt-3 text-xs font-bold text-gray-400">
                      Renewed from
                      Insurance #
                      {
                        item.previousInsuranceId
                      }
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function InfoItem({
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
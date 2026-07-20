'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';
import axios from 'axios';

import {
  Capacitor,
} from '@capacitor/core';

import {
  Directory,
  Filesystem,
} from '@capacitor/filesystem';

import {
  Share,
} from '@capacitor/share';

import {
  getAuthHeaders,
} from '@/lib/authHeaders';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type TaxInvoiceRow = {
  id: number;
  projectId: number;

  invoiceNumber?: string;
  invoiceDate?: string;
  status?: string;

  customerName?: string;
  customerPhone?: string;

  billToName?: string;
  billToPhone?: string;

  branchName?: string;

  projectOwnerId?: number | null;
  projectOwnerName?: string;
  projectOwnerRole?: string;

  projectStatus?: string;
  projectType?: string;

  taxableAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  totalTaxAmount?: number;
  roundOff?: number;
  grandTotal?: number;

  createdBy?: number | null;
  createdByName?: string;

  isHidden?: boolean;

  createdAt?: string;
  updatedAt?: string;
};

type BranchOption = {
  id?: number;
  name?: string;
  branchName?: string;
};

type ProjectOwnerOption = {
  projectOwnerId: number;
  projectOwnerName: string;
  projectOwnerRole?: string;
};

type GeneratedByOption = {
  id: number;
  name: string;
};

const money = (
  value?: number,
) =>
  `₹${Number(
    value || 0,
  ).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (
  value?: string,
) => {
  if (!value) return '-';

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
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
};

const formatDateTime = (
  value?: string,
) => {
  if (!value) return '-';

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return value;
  }

  return date.toLocaleString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  );
};

const safeFilePart = (
  value: string,
) =>
  String(value || '')
    .trim()
    .replace(
      /[^a-zA-Z0-9_-]+/g,
      '-',
    )
    .replace(
      /^-+|-+$/g,
      '',
    );

const getCurrentUserRoles =
  (): string[] => {
    if (
      typeof window ===
      'undefined'
    ) {
      return [];
    }

    const token =
      localStorage.getItem(
        'token',
      );

    if (!token) return [];

    try {
      const payloadPart =
        token.split('.')[1];

      if (!payloadPart) {
        return [];
      }

      const normalized =
        payloadPart
          .replace(/-/g, '+')
          .replace(/_/g, '/');

      const payload = JSON.parse(
        decodeURIComponent(
          window
            .atob(normalized)
            .split('')
            .map(
              (character) =>
                `%${(
                  '00' +
                  character
                    .charCodeAt(0)
                    .toString(16)
                ).slice(-2)}`,
            )
            .join(''),
        ),
      );

      if (
        Array.isArray(
          payload?.roles,
        )
      ) {
        return payload.roles;
      }

      if (payload?.role) {
        return [
          String(payload.role),
        ];
      }

      return [];
    } catch (error) {
      console.error(
        'Failed to read user roles:',
        error,
      );

      return [];
    }
  };

const blobToBase64 = (
  blob: Blob,
): Promise<string> =>
  new Promise(
    (
      resolve,
      reject,
    ) => {
      const reader =
        new FileReader();

      reader.onloadend = () => {
        const result =
          String(
            reader.result || '',
          );

        const base64 =
          result.includes(',')
            ? result.split(',')[1]
            : result;

        resolve(base64);
      };

      reader.onerror = () => {
        reject(
          new Error(
            'Failed to prepare PDF file',
          ),
        );
      };

      reader.readAsDataURL(blob);
    },
  );

function SummaryCard({
  title,
  value,
  count,
}: {
  title: string;
  value?: number;
  count?: number;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm font-medium text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {count !== undefined
          ? Number(
              count || 0,
            ).toLocaleString(
              'en-IN',
            )
          : money(value)}
      </p>
    </div>
  );
}

export default function ProjectTaxInvoicesPage() {
  const [rows, setRows] =
    useState<TaxInvoiceRow[]>(
      [],
    );

  const [
    branches,
    setBranches,
  ] = useState<
    BranchOption[]
  >([]);

  const [
    projectOwners,
    setProjectOwners,
  ] = useState<
    ProjectOwnerOption[]
  >([]);

  const [
    generatedByOptions,
    setGeneratedByOptions,
  ] = useState<
    GeneratedByOption[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    downloadingInvoiceId,
    setDownloadingInvoiceId,
  ] = useState<
    number | null
  >(null);

  const [
    changingVisibilityId,
    setChangingVisibilityId,
  ] = useState<
    number | null
  >(null);

  const [
    isOwner,
    setIsOwner,
  ] = useState(false);

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);

  const [
    totalRecords,
    setTotalRecords,
  ] = useState(0);

  const [
    summary,
    setSummary,
  ] = useState({
    totalInvoices: 0,
    taxableAmount: 0,
    totalTaxAmount: 0,
    grandTotal: 0,
  });

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    status,
    setStatus,
  ] = useState(
    'GENERATED',
  );

  const [
    branch,
    setBranch,
  ] = useState('');

  const [
    projectOwnerId,
    setProjectOwnerId,
  ] = useState('');

  const [
    createdBy,
    setCreatedBy,
  ] = useState('');

  const [
    fromDate,
    setFromDate,
  ] = useState('');

  const [
    toDate,
    setToDate,
  ] = useState('');

  const [
    visibility,
    setVisibility,
  ] = useState(
    'ACTIVE',
  );

  const fetchFilterOptions =
    async () => {
      try {
        const [
  branchResponse,
  ownerResponse,
  creatorResponse,
] = await Promise.all([
  axios.get(
    `${API_BASE_URL}/project/branch`,
    {
      headers:
        getAuthHeaders(),
    },
  ),

  axios.get(
    `${API_BASE_URL}/project/owners/list`,
    {
      headers:
        getAuthHeaders(),
    },
  ),

  axios.get(
    `${API_BASE_URL}/project/tax-invoices/creators`,
    {
      headers:
        getAuthHeaders(),
    },
  ),
]);

        setBranches(
          Array.isArray(
            branchResponse.data,
          )
            ? branchResponse.data
            : [],
        );

        setProjectOwners(
          Array.isArray(
            ownerResponse.data,
          )
            ? ownerResponse.data
            : [],
        );

        setGeneratedByOptions(
  Array.isArray(
    creatorResponse.data,
  )
    ? creatorResponse.data
    : [],
);
      } catch (error) {
        console.error(
          'Failed to load tax invoice filter options:',
          error,
        );
      }
    };

  const fetchTaxInvoices =
    async () => {
      try {
        setLoading(true);

        const response =
          await axios.get(
            `${API_BASE_URL}/project/tax-invoices/register`,
            {
              params: {
                page,
                limit: 20,
                search,
                status,
                branch,
                projectOwnerId,
                createdBy,
                fromDate,
                toDate,
                visibility,
              },

              headers:
                getAuthHeaders(),
            },
          );

        const invoiceRows =
          Array.isArray(
            response.data?.data,
          )
            ? response.data.data
            : [];

        setRows(invoiceRows);

        setTotalRecords(
          Number(
            response.data
              ?.pagination
              ?.total || 0,
          ),
        );

        setTotalPages(
          Number(
            response.data
              ?.pagination
              ?.totalPages || 1,
          ),
        );

        setSummary({
          totalInvoices:
            Number(
              response.data
                ?.summary
                ?.totalInvoices ||
                0,
            ),

          taxableAmount:
            Number(
              response.data
                ?.summary
                ?.taxableAmount ||
                0,
            ),

          totalTaxAmount:
            Number(
              response.data
                ?.summary
                ?.totalTaxAmount ||
                0,
            ),

          grandTotal:
            Number(
              response.data
                ?.summary
                ?.grandTotal ||
                0,
            ),
        });

      } catch (
        error: any
      ) {
        console.error(
          'Failed to load project tax invoices:',
          error,
        );

        setRows([]);
        setTotalRecords(0);
        setTotalPages(1);

        alert(
          error?.response?.data
            ?.message ||
            'Failed to load project tax invoices',
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    const roles =
      getCurrentUserRoles();

    setIsOwner(
      roles.includes(
        'OWNER',
      ),
    );

    fetchFilterOptions();
    fetchTaxInvoices();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTaxInvoices();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const applyFilters = () => {
    if (page === 1) {
      fetchTaxInvoices();
      return;
    }

    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('GENERATED');
    setBranch('');
    setProjectOwnerId('');
    setCreatedBy('');
    setFromDate('');
    setToDate('');
    setVisibility(
      'ACTIVE',
    );

    if (page === 1) {
      setTimeout(
        fetchTaxInvoices,
        0,
      );

      return;
    }

    setPage(1);
  };

  const downloadInvoicePdf =
    async (
      invoice: TaxInvoiceRow,
    ) => {
      try {
        setDownloadingInvoiceId(
          invoice.id,
        );

        const response =
          await axios.get(
            `${API_BASE_URL}/project/epc-customer-invoice/${invoice.id}/pdf`,
            {
              headers:
                getAuthHeaders(),

              responseType:
                'blob',
            },
          );

        const pdfBlob =
          new Blob(
            [response.data],
            {
              type:
                'application/pdf',
            },
          );

        const fileNumber =
          safeFilePart(
            invoice.invoiceNumber ||
              `invoice-${invoice.id}`,
          );

        const customerName =
          safeFilePart(
            invoice.customerName ||
              invoice.billToName ||
              `project-${invoice.projectId}`,
          );

        const fileName =
          `${fileNumber}-${customerName}.pdf`;

        if (
          Capacitor.isNativePlatform()
        ) {
          const base64Data =
            await blobToBase64(
              pdfBlob,
            );

          const writeResult =
            await Filesystem.writeFile(
              {
                path: fileName,
                data: base64Data,
                directory:
                  Directory.Cache,
                recursive: true,
              },
            );

          await Share.share({
            title:
              'Project Tax Invoice',

            text:
              invoice.invoiceNumber
                ? `Tax Invoice ${invoice.invoiceNumber}`
                : `Tax Invoice for Project #${invoice.projectId}`,

            files: [
              writeResult.uri,
            ],

            dialogTitle:
              'Save or share tax invoice',
          });

          return;
        }

        const objectUrl =
          URL.createObjectURL(
            pdfBlob,
          );

        const anchor =
          document.createElement(
            'a',
          );

        anchor.href =
          objectUrl;

        anchor.download =
          fileName;

        document.body.appendChild(
          anchor,
        );

        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(
          objectUrl,
        );
      } catch (
        error: any
      ) {
        console.error(
          'Tax invoice PDF download failed:',
          error,
        );

        alert(
          error?.response?.data
            ?.message ||
            error?.message ||
            'Failed to download tax invoice',
        );
      } finally {
        setDownloadingInvoiceId(
          null,
        );
      }
    };

  const hideInvoice =
    async (
      invoiceId: number,
    ) => {
      const confirmed =
        window.confirm(
          'Hide this tax invoice from the active invoice register?',
        );

      if (!confirmed) {
        return;
      }

      try {
        setChangingVisibilityId(
          invoiceId,
        );

        await axios.patch(
          `${API_BASE_URL}/project/tax-invoices/${invoiceId}/hide`,
          {},
          {
            headers:
              getAuthHeaders(),
          },
        );

        alert(
          'Tax invoice hidden successfully',
        );

        fetchTaxInvoices();
      } catch (
        error: any
      ) {
        console.error(
          'Failed to hide tax invoice:',
          error,
        );

        alert(
          error?.response?.data
            ?.message ||
            'Failed to hide tax invoice',
        );
      } finally {
        setChangingVisibilityId(
          null,
        );
      }
    };

  const restoreInvoice =
    async (
      invoiceId: number,
    ) => {
      const confirmed =
        window.confirm(
          'Restore this tax invoice to the active register?',
        );

      if (!confirmed) {
        return;
      }

      try {
        setChangingVisibilityId(
          invoiceId,
        );

        await axios.patch(
          `${API_BASE_URL}/project/tax-invoices/${invoiceId}/restore`,
          {},
          {
            headers:
              getAuthHeaders(),
          },
        );

        alert(
          'Tax invoice restored successfully',
        );

        fetchTaxInvoices();
      } catch (
        error: any
      ) {
        console.error(
          'Failed to restore tax invoice:',
          error,
        );

        alert(
          error?.response?.data
            ?.message ||
            'Failed to restore tax invoice',
        );
      } finally {
        setChangingVisibilityId(
          null,
        );
      }
    };

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden bg-gray-50 p-3 md:p-6">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-900">
          🧾 Project Tax Invoices
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Central register of tax invoices generated from customer projects.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Invoices"
          count={
            summary.totalInvoices
          }
        />

        <SummaryCard
          title="Taxable Amount"
          value={
            summary.taxableAmount
          }
        />

        <SummaryCard
          title="Total GST"
          value={
            summary.totalTaxAmount
          }
        />

        <SummaryCard
          title="Grand Total"
          value={
            summary.grandTotal
          }
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Filters
            </h2>

            <p className="text-sm text-gray-500">
              Search and filter saved project tax invoices.
            </p>
          </div>

          <p className="text-sm font-semibold text-gray-700">
            {totalRecords}{' '}
            record
            {totalRecords === 1
              ? ''
              : 's'}
          </p>
        </div>

        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            onKeyDown={(
              event,
            ) => {
              if (
                event.key ===
                'Enter'
              ) {
                applyFilters();
              }
            }}
            placeholder="Invoice no. / project ID / customer / phone"
            className="min-w-0 rounded-xl border border-gray-300 p-3"
          />

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value,
              )
            }
            className="min-w-0 rounded-xl border border-gray-300 p-3"
          >
            <option value="GENERATED">
              Generated Invoices
            </option>

            <option value="DRAFT">
              Draft Invoices
            </option>

            <option value="CANCELLED">
              Cancelled Invoices
            </option>

            <option value="ALL">
              All Statuses
            </option>
          </select>

          <select
            value={branch}
            onChange={(event) =>
              setBranch(
                event.target.value,
              )
            }
            className="min-w-0 rounded-xl border border-gray-300 p-3"
          >
            <option value="">
              All Branches
            </option>

            {branches.map(
              (
                item,
                index,
              ) => {
                const name =
                  item.branchName ||
                  item.name ||
                  '';

                if (!name) {
                  return null;
                }

                return (
                  <option
                    key={
                      item.id ||
                      `${name}-${index}`
                    }
                    value={name}
                  >
                    {name}
                  </option>
                );
              },
            )}
          </select>

          <select
            value={
              projectOwnerId
            }
            onChange={(event) =>
              setProjectOwnerId(
                event.target.value,
              )
            }
            className="min-w-0 rounded-xl border border-gray-300 p-3"
          >
            <option value="">
              All Project Owners
            </option>

            {projectOwners.map(
              (owner) => (
                <option
                  key={
                    owner.projectOwnerId
                  }
                  value={
                    owner.projectOwnerId
                  }
                >
                  {
                    owner.projectOwnerName
                  }

                  {owner.projectOwnerRole
                    ? ` (${owner.projectOwnerRole.replaceAll(
                        '_',
                        ' ',
                      )})`
                    : ''}
                </option>
              ),
            )}
          </select>

          <select
            value={createdBy}
            onChange={(event) =>
              setCreatedBy(
                event.target.value,
              )
            }
            className="min-w-0 rounded-xl border border-gray-300 p-3"
          >
            <option value="">
              Generated By — All
            </option>

            {generatedByOptions.map(
              (creator) => (
                <option
                  key={
                    creator.id
                  }
                  value={
                    creator.id
                  }
                >
                  {
                    creator.name
                  }
                </option>
              ),
            )}
          </select>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Invoice From Date
            </label>

            <input
              type="date"
              value={fromDate}
              onChange={(
                event,
              ) =>
                setFromDate(
                  event.target
                    .value,
                )
              }
              className="w-full min-w-0 rounded-xl border border-gray-300 p-3"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Invoice To Date
            </label>

            <input
              type="date"
              value={toDate}
              onChange={(
                event,
              ) =>
                setToDate(
                  event.target
                    .value,
                )
              }
              className="w-full min-w-0 rounded-xl border border-gray-300 p-3"
            />
          </div>

          <select
            value={visibility}
            onChange={(event) =>
              setVisibility(
                event.target.value,
              )
            }
            className="min-w-0 rounded-xl border border-gray-300 p-3"
          >
            <option value="ACTIVE">
              Active Invoices
            </option>

            <option value="HIDDEN">
              Hidden Invoices
            </option>

            <option value="ALL">
              Active and Hidden
            </option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={
              applyFilters
            }
            disabled={loading}
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
            disabled={loading}
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 disabled:opacity-60"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow">
            Loading tax invoices...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow">
            <p className="font-semibold text-gray-800">
              No tax invoices found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              No invoice matches the selected filters.
            </p>
          </div>
        ) : (
          rows.map(
            (invoice) => (
              <div
                key={
                  invoice.id
                }
                className="min-w-0 rounded-2xl bg-white p-5 shadow"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-lg font-bold text-gray-900">
                        {invoice.invoiceNumber ||
                          `Tax Invoice #${invoice.id}`}
                      </h3>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {String(
                          invoice.status ||
                            'DRAFT',
                        ).replaceAll(
                          '_',
                          ' ',
                        )}
                      </span>

                      {invoice.isHidden ? (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          HIDDEN
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 break-words font-semibold text-gray-800">
                      {invoice.customerName ||
                        invoice.billToName ||
                        'Customer name unavailable'}
                    </p>

                    <p className="mt-1 break-words text-sm text-gray-500">
                      {invoice.customerPhone ||
                        invoice.billToPhone ||
                        'No phone'}
                    </p>
                  </div>

                  <div className="text-left xl:text-right">
                    <p className="text-xs text-gray-500">
                      Grand Total
                    </p>

                    <p className="text-2xl font-bold text-green-700">
                      {money(
                        invoice.grandTotal,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Project
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                      Project #
                      {
                        invoice.projectId
                      }
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {invoice.projectType
                        ? invoice.projectType.replaceAll(
                            '_',
                            ' ',
                          )
                        : '-'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Invoice Date
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                      {formatDate(
                        invoice.invoiceDate,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Branch
                    </p>

                    <p className="mt-1 break-words font-semibold text-gray-800">
                      {invoice.branchName ||
                        '-'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Project Owner
                    </p>

                    <p className="mt-1 break-words font-semibold text-gray-800">
                      {invoice.projectOwnerName ||
                        '-'}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {invoice.projectOwnerRole
                        ? invoice.projectOwnerRole.replaceAll(
                            '_',
                            ' ',
                          )
                        : ''}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Taxable Amount
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                      {money(
                        invoice.taxableAmount,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      CGST
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                      {money(
                        invoice.cgstAmount,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      SGST
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                      {money(
                        invoice.sgstAmount,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Total GST
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                      {money(
                        invoice.totalTaxAmount,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-3 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">
                      Generated By
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold text-gray-800">
                      {invoice.createdByName ||
                        '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Saved On
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {formatDateTime(
                        invoice.createdAt,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Last Updated
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {formatDateTime(
                        invoice.updatedAt,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      downloadInvoicePdf(
                        invoice,
                      )
                    }
                    disabled={
                      downloadingInvoiceId ===
                      invoice.id
                    }
                    className="rounded-xl bg-green-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
                  >
                    {downloadingInvoiceId ===
                    invoice.id
                      ? 'Preparing PDF...'
                      : 'Download / Share PDF'}
                  </button>

                  <Link
                    href={`/project/${invoice.projectId}`}
                    className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white"
                  >
                    Open Project
                  </Link>

                  <Link
                    href={`/project/epc-invoice/${invoice.projectId}`}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700"
                  >
                    View Invoice
                  </Link>

                  {isOwner &&
                  !invoice.isHidden ? (
                    <button
                      type="button"
                      onClick={() =>
                        hideInvoice(
                          invoice.id,
                        )
                      }
                      disabled={
                        changingVisibilityId ===
                        invoice.id
                      }
                      className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 font-semibold text-red-700 disabled:opacity-60"
                    >
                      {changingVisibilityId ===
                      invoice.id
                        ? 'Please wait...'
                        : 'Hide'}
                    </button>
                  ) : null}

                  {isOwner &&
                  invoice.isHidden ? (
                    <button
                      type="button"
                      onClick={() =>
                        restoreInvoice(
                          invoice.id,
                        )
                      }
                      disabled={
                        changingVisibilityId ===
                        invoice.id
                      }
                      className="rounded-xl border border-green-300 bg-green-50 px-4 py-2 font-semibold text-green-700 disabled:opacity-60"
                    >
                      {changingVisibilityId ===
                      invoice.id
                        ? 'Please wait...'
                        : 'Restore'}
                    </button>
                  ) : null}
                </div>
              </div>
            ),
          )
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow sm:flex-row">
        <p className="text-sm text-gray-600">
          Page {page} of{' '}
          {totalPages} •{' '}
          {totalRecords}{' '}
          total record
          {totalRecords === 1
            ? ''
            : 's'}
        </p>

        <div className="flex gap-3">
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
                    current - 1,
                    1,
                  ),
              )
            }
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <button
            type="button"
            disabled={
              page >=
                totalPages ||
              loading
            }
            onClick={() =>
              setPage(
                (current) =>
                  Math.min(
                    current + 1,
                    totalPages,
                  ),
              )
            }
            className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
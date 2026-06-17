'use client';

import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const DEPARTMENTS = [
  'PROJECT_CREATION',
  'LOAN',
  'PROJECT_MANAGEMENT',
  'SUBSIDY',
  'ELECTRICITY',
  'PAYMENT_COLLECTION',
  'CUSTOMER',
  'OTHER',
];

const DOCUMENT_TYPES = [
  'VENDOR_AGREEMENT',
  'AADHAAR_CARD',
  'PAN_CARD',
  'ELECTRICITY_BILL',
  'LOAN_SANCTION_LETTER',
  'DCR_CERTIFICATE',
  'PANEL_WARRANTY_CARD',
  'INVERTER_WARRANTY_CARD',
  'WCR_REPORT',
  'DISCOM_FILE',
  'PAYMENT_RECEIPT',
  'INVOICE_FILE',
  'OTHER',
];

export default function CustomerDocumentsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    projectId: '',
    department: '',
    documentType: '',
  });

  const projects = dashboard?.projects || [];

  const loadDashboard = async () => {
    const token = localStorage.getItem('customer_token');

    const res = await fetch(`${API_BASE_URL}/customer-auth/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      window.location.href = '/customer-login';
      return;
    }

    setDashboard(data);
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('customer_token');

      if (!token) {
        window.location.href = '/customer-login';
        return;
      }

      const params = new URLSearchParams();

      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.department) params.append('department', filters.department);
      if (filters.documentType) {
        params.append('documentType', filters.documentType);
      }

      const res = await fetch(
        `${API_BASE_URL}/customer-auth/documents?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || 'Failed to load documents');
        return;
      }

      setDocuments(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error(error);
      alert('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    loadDocuments();
  };

  const resetFilters = () => {
    setFilters({
      projectId: '',
      department: '',
      documentType: '',
    });

    setTimeout(loadDocuments, 0);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
          <p className="text-sm font-bold opacity-90">
            Customer Document Vault
          </p>

          <h1 className="mt-2 text-4xl font-black md:text-5xl">
            📁 My Documents
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-white/90">
            View and download customer-visible project documents, invoices,
            agreements, subsidy, electricity and warranty files.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <HeroCard title="Projects" value={String(projects.length)} />
            <HeroCard title="Documents" value={String(documents.length)} />
            <HeroCard
              title="Latest"
              value={
                documents[0]?.createdAt
                  ? new Date(documents[0].createdAt).toLocaleDateString('en-IN')
                  : '-'
              }
            />
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-5 shadow-xl">
          <h2 className="text-xl font-black text-gray-900">Filters</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <select
              value={filters.projectId}
              onChange={(e) =>
                setFilters({ ...filters, projectId: e.target.value })
              }
              className="rounded-2xl border p-3"
            >
              <option value="">All Projects</option>
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  Project #{project.id} - {project.customerName}
                </option>
              ))}
            </select>

            <select
              value={filters.department}
              onChange={(e) =>
                setFilters({ ...filters, department: e.target.value })
              }
              className="rounded-2xl border p-3"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>

            <select
              value={filters.documentType}
              onChange={(e) =>
                setFilters({ ...filters, documentType: e.target.value })
              }
              className="rounded-2xl border p-3"
            >
              <option value="">All Document Types</option>
              {DOCUMENT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={applyFilters}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700"
            >
              Apply Filters
            </button>

            <button
              onClick={resetFilters}
              className="rounded-2xl bg-gray-200 px-5 py-3 text-sm font-black text-gray-800 hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
          <h2 className="text-2xl font-black text-gray-900">
            Available Documents
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <EmptyCard text="Loading documents..." />
            ) : documents.length === 0 ? (
              <EmptyCard text="No customer-visible documents found." />
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="overflow-hidden rounded-[2rem] border bg-gray-50 shadow"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                    <p className="text-xs font-bold opacity-80">
                      Project #{doc.projectId}
                    </p>

                    <h3 className="mt-2 text-lg font-black">
                      {formatLabel(doc.documentType)}
                    </h3>

                    <p className="mt-1 text-xs opacity-90">
                      {formatLabel(doc.department)}
                    </p>
                  </div>

                  <div className="p-5">
                    <InfoLine label="File" value={doc.fileName || '-'} />
                    <InfoLine
                      label="Uploaded"
                      value={
                        doc.createdAt
                          ? new Date(doc.createdAt).toLocaleString('en-IN')
                          : '-'
                      }
                    />

                    {doc.remarks && (
                      <div className="mt-3 rounded-2xl bg-white p-3">
                        <p className="text-xs font-bold text-gray-500">
                          Remarks
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">
                          {doc.remarks}
                        </p>
                      </div>
                    )}

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl bg-gray-900 px-4 py-3 text-center text-sm font-black text-white hover:bg-black"
                      >
                        View
                      </a>

                      <a
                        href={doc.fileUrl}
                        download
                        className="rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-black text-white hover:bg-emerald-700"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function HeroCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/20 p-4 backdrop-blur">
      <p className="text-xs font-bold opacity-90">{title}</p>
      <p className="mt-2 break-words text-2xl font-black">{value}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value?: string }) {
  return (
    <div className="mt-3 rounded-2xl bg-white p-3">
      <p className="text-xs font-bold text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-gray-900">
        {value || '-'}
      </p>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed p-6 text-center text-sm font-semibold text-gray-500">
      {text}
    </div>
  );
}

function formatLabel(value?: string) {
  return String(value || '-').replaceAll('_', ' ');
}
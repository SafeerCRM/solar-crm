'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Project = {
  id: number;
  customerName?: string;
  customerPhone?: string;
  city?: string;
  zone?: string;
  electricityKNumber?: string;
  customerGmail?: string;
  aadhaarLinkedMobile?: string;
  panelBrand?: string;
  dcrPanelCount?: number;
  nonDcrPanelCount?: number;
  converterBrand?: string;
  converterCapacity?: string;
  converterPhase?: string;
  structureType?: string;
  structureCapacityKw?: string;
  buildingHeight?: string;
  projectType?: string;
  marginMoney?: number;
  loanAmount?: number;
  subsidyType?: string;
  projectCost?: number;
  discomName?: string;
  discomExpenditureType?: string;
  discomExpenditureAmount?: number;
  expectedLagat?: number;
  expectedProfit?: number;
  status?: string;
  marketingHeadApprovalStatus?: string;
  marketingHeadApprovalNote?: string;
  ownerApprovalStatus?: string;
  ownerApprovalNote?: string;
  remarks?: string;
  createdAt?: string;
};

type ProjectDocument = {
  id: number;
  documentType?: string;
  department?: string;
  fileName?: string;
  fileUrl?: string;
  uploadedByRole?: string;
  remarks?: string;
  createdAt?: string;
};

function money(value?: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function Field({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-semibold text-gray-800">{value || '-'}</p>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const [documents, setDocuments] = useState<ProjectDocument[]>([]);

const [uploading, setUploading] = useState(false);

const [selectedFiles, setSelectedFiles] =
  useState<File[]>([]);

const [documentType, setDocumentType] = useState('OTHER');

const [department, setDepartment] =
  useState('PROJECT_CREATION');

const [documentRemarks, setDocumentRemarks] =
  useState('');

  const [activeTab, setActiveTab] =
  useState('PROJECT_CREATION');

  const fetchProject = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const res = await axios.get(`${API_BASE_URL}/project/${projectId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setProject(res.data);
    } catch (error) {
      console.error('Failed to load project:', error);
      alert('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/${projectId}/documents`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setDocuments(res.data || []);
  } catch (error) {
    console.error('Failed to load documents:', error);
  }
};

const uploadDocument = async () => {
  if (!selectedFiles.length || !projectId) {
    alert('Please select a file');
    return;
  }

  try {
    setUploading(true);

    const token = localStorage.getItem('token');

    const formData = new FormData();

    selectedFiles.forEach((file) => {
  formData.append('files', file);
});

    formData.append(
      'projectId',
      String(projectId),
    );

    formData.append(
      'documentType',
      documentType,
    );

    formData.append(
      'department',
      department,
    );

    formData.append(
      'remarks',
      documentRemarks,
    );

    const res = await axios.post(
      `${API_BASE_URL}/project/documents/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type':
            'multipart/form-data',
        },
      },
    );

    alert(
      res?.data?.message ||
        'Document uploaded successfully',
    );

    setSelectedFiles([]);

    setDocumentRemarks('');

    fetchDocuments();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to upload document',
    );
  } finally {
    setUploading(false);
  }
};

const deleteDocument = async (
  id: number,
) => {
  const confirmDelete = window.confirm(
    'Delete this document?',
  );

  if (!confirmDelete) {
    return;
  }

  try {
    const token = localStorage.getItem(
      'token',
    );

    await axios.patch(
      `${API_BASE_URL}/project/documents/${id}/delete`,
      {},
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Document deleted successfully');

    fetchDocuments();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to delete document',
    );
  }
};

  useEffect(() => {
  if (projectId) {
    fetchProject();
    fetchDocuments();
  }
}, [projectId]);

  if (loading) {
    return <div className="rounded-2xl bg-white p-5 shadow">Loading project...</div>;
  }

  if (!project) {
    return <div className="rounded-2xl bg-white p-5 shadow">Project not found.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <Link href="/project" className="text-sm font-semibold text-blue-600">
          ← Back to Projects
        </Link>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Project #{project.id} - {project.customerName || 'Unnamed Customer'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {project.customerPhone || 'No phone'} | {project.city || 'No city'} |{' '}
              {project.zone || 'No zone'}
            </p>
          </div>

          <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            {project.status || 'UNKNOWN'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
  {[
    { key: 'PROJECT_CREATION', label: 'Project Creation' },
    { key: 'LOAN_DEPARTMENT', label: 'Loan Department' },
    { key: 'PROJECT_MANAGEMENT', label: 'Project Management' },
    { key: 'SUBSIDY_DEPARTMENT', label: 'Subsidy Department' },
    { key: 'ELECTRICITY_DEPARTMENT', label: 'Electricity Department' },
    { key: 'PAYMENT_COLLECTION', label: 'Payment Collection' },
    { key: 'DOCUMENTS', label: 'Documents' },
  ].map((tab) => (
    <button
      key={tab.key}
      onClick={() => setActiveTab(tab.key)}
      className={`rounded-xl px-4 py-2 text-sm font-semibold ${
        activeTab === tab.key
          ? 'bg-blue-600 text-white'
          : 'border bg-white text-gray-700'
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>

    {activeTab === 'PROJECT_CREATION' && (
  <>
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">Customer Details</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Customer Name" value={project.customerName} />
          <Field label="Phone" value={project.customerPhone} />
          <Field label="City" value={project.city} />
          <Field label="Zone" value={project.zone} />
          <Field label="Electricity K Number" value={project.electricityKNumber} />
          <Field label="Gmail" value={project.customerGmail} />
          <Field label="Aadhaar Linked Mobile" value={project.aadhaarLinkedMobile} />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">Technical Details</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Panel Brand" value={project.panelBrand} />
          <Field label="DCR Panel Count" value={project.dcrPanelCount} />
          <Field label="Non-DCR Panel Count" value={project.nonDcrPanelCount} />
          <Field label="Converter Brand" value={project.converterBrand} />
          <Field label="Converter Capacity" value={project.converterCapacity} />
          <Field label="Converter Phase" value={project.converterPhase} />
          <Field label="Structure Type" value={project.structureType} />
          <Field label="Structure Capacity KW" value={project.structureCapacityKw} />
          <Field label="Building Height" value={project.buildingHeight} />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">Finance & DISCOM</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Project Type" value={project.projectType} />
          <Field label="Margin Money" value={money(project.marginMoney)} />
          <Field label="Loan Amount" value={money(project.loanAmount)} />
          <Field label="Subsidy Type" value={project.subsidyType} />
          <Field label="Project Cost" value={money(project.projectCost)} />
          <Field label="DISCOM Name" value={project.discomName} />
          <Field label="DISCOM Expenditure Type" value={project.discomExpenditureType} />
          <Field label="DISCOM Expenditure Amount" value={money(project.discomExpenditureAmount)} />
          <Field label="Expected Laagat" value={money(project.expectedLagat)} />
          <Field label="Expected Profit" value={money(project.expectedProfit)} />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">Approval Status</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-yellow-50 p-4">
            <p className="text-sm text-gray-500">Marketing Head Approval</p>
            <p className="mt-1 font-bold text-yellow-700">
              {project.marketingHeadApprovalStatus || 'PENDING'}
            </p>
            <p className="mt-2 text-sm text-gray-700">
              {project.marketingHeadApprovalNote || 'No note'}
            </p>
          </div>

          <div className="rounded-xl bg-purple-50 p-4">
            <p className="text-sm text-gray-500">Owner Approval</p>
            <p className="mt-1 font-bold text-purple-700">
              {project.ownerApprovalStatus || 'PENDING'}
            </p>
            <p className="mt-2 text-sm text-gray-700">
              {project.ownerApprovalNote || 'No note'}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-2 text-lg font-bold text-gray-800">Remarks</h2>
        <p className="text-sm text-gray-700">{project.remarks || 'No remarks'}</p>
      </div>
        </>
)}

      {activeTab === 'LOAN_DEPARTMENT' && (
  <div className="rounded-2xl bg-white p-6 shadow">
    <h2 className="text-xl font-bold text-gray-800">Loan Department</h2>
    <p className="mt-3 text-gray-600">
      Loan workflow section will be added here.
    </p>
  </div>
)}

{activeTab === 'PROJECT_MANAGEMENT' && (
  <div className="rounded-2xl bg-white p-6 shadow">
    <h2 className="text-xl font-bold text-gray-800">Project Management</h2>
    <p className="mt-3 text-gray-600">
      Installation and execution workflow will appear here.
    </p>
  </div>
)}

{activeTab === 'SUBSIDY_DEPARTMENT' && (
  <div className="rounded-2xl bg-white p-6 shadow">
    <h2 className="text-xl font-bold text-gray-800">Subsidy Department</h2>
    <p className="mt-3 text-gray-600">
      Subsidy process workflow will appear here.
    </p>
  </div>
)}

{activeTab === 'ELECTRICITY_DEPARTMENT' && (
  <div className="rounded-2xl bg-white p-6 shadow">
    <h2 className="text-xl font-bold text-gray-800">Electricity Department</h2>
    <p className="mt-3 text-gray-600">
      DISCOM and net meter workflow will appear here.
    </p>
  </div>
)}

{activeTab === 'PAYMENT_COLLECTION' && (
  <div className="rounded-2xl bg-white p-6 shadow">
    <h2 className="text-xl font-bold text-gray-800">Payment Collection</h2>
    <p className="mt-3 text-gray-600">
      Payment tracking workflow will appear here.
    </p>
  </div>
)}

{activeTab === 'DOCUMENTS' && (
<div className="mt-6 rounded-2xl bg-white p-5 shadow">
  <h2 className="text-xl font-bold text-gray-800">
    Project Documents
  </h2>

  <div className="mt-4 grid gap-3 md:grid-cols-2">
    <select
      value={department}
      onChange={(e) =>
        setDepartment(e.target.value)
      }
      className="rounded-xl border p-3"
    >
      <option value="PROJECT_CREATION">
        Project Creation
      </option>

      <option value="LOAN_DEPARTMENT">
        Loan Department
      </option>

      <option value="PROJECT_MANAGEMENT">
        Project Management
      </option>

      <option value="SUBSIDY_DEPARTMENT">
        Subsidy Department
      </option>

      <option value="ELECTRICITY_DEPARTMENT">
        Electricity Department
      </option>
    </select>

    <input
      type="text"
      placeholder="Document Type"
      value={documentType}
      onChange={(e) =>
        setDocumentType(e.target.value)
      }
      className="rounded-xl border p-3"
    />
  </div>

  <textarea
    placeholder="Remarks"
    value={documentRemarks}
    onChange={(e) =>
      setDocumentRemarks(e.target.value)
    }
    className="mt-3 w-full rounded-xl border p-3"
  />

  <input
  type="file"
  multiple
  accept=".pdf,.jpg,.jpeg,.png,.webp"
  onChange={(e) =>
    setSelectedFiles(
      Array.from(e.target.files || []),
    )
  }
  className="mt-3 w-full rounded-xl border p-3"
/>

  <button
    onClick={uploadDocument}
    disabled={uploading}
    className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
  >
    {uploading
      ? 'Uploading...'
      : 'Upload Document'}
  </button>

  <div className="mt-6 space-y-3">
    {documents.map((doc) => (
      <div
        key={doc.id}
        className="rounded-xl border p-4"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-gray-800">
              {doc.documentType || 'Document'}
            </p>

            <p className="text-sm text-gray-500">
              {doc.department}
            </p>

            {doc.remarks && (
              <p className="mt-1 text-sm text-gray-600">
                {doc.remarks}
              </p>
            )}
          </div>

          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-green-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-green-700"
          >
            View / Download
          </a>

          <button
  onClick={() =>
    deleteDocument(doc.id)
  }
  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
>
  Delete
</button>
        </div>
      </div>
    ))}
  </div>
</div>
)}

    </div>
  );
}
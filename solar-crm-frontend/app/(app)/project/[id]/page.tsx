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
  branchName?: string;
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

type MaterialMaster = {
  id: number;
  name: string;
  category?: string;
  unit?: string;
  brand?: string;
  rate?: number;
  gstPercent?: number;
};

type MaterialRequestRow = {
  materialId: string;
  materialName: string;
  category: string;
  unit: string;
  brand: string;
  rate: string;
  quantity: string;
  gstPercent: string;
  totalAmount: number;
  remarks: string;
};

type MaterialRequest = {
  id: number;
  title?: string;
  remarks?: string;
  requestedByName?: string;
  requestedByRole?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  items?: MaterialRequestRow[];
};

type ProjectComment = {
  id: number;
  projectId: number;
  department?: string;
  comment?: string;
  createdByName?: string;
  createdByRole?: string;
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

  const [marketingHeadNote, setMarketingHeadNote] = useState('');
const [ownerNote, setOwnerNote] = useState('');
const [approvalLoading, setApprovalLoading] = useState(false);

  const [materials, setMaterials] = useState<MaterialMaster[]>([]);
const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
const [materialRequestTitle, setMaterialRequestTitle] = useState('');
const [materialRequestRemarks, setMaterialRequestRemarks] = useState('');
const [materialRows, setMaterialRows] = useState<MaterialRequestRow[]>([]);
const [submittingMaterialRequest, setSubmittingMaterialRequest] = useState(false);
const [loanDetail, setLoanDetail] = useState<any>(null);

const [loanForm, setLoanForm] = useState({
  loanType: '',
  bankName: '',
  applicationNumber: '',
  marginMoney: '',
  sanctionAmount: '',
  firstEmiDisbursementAmount: '',
  firstEmiDisbursementDate: '',
  status: 'DOCUMENT_PENDING',
  remarks: '',
});

const [loanLoading, setLoanLoading] = useState(false);

const [loanComments, setLoanComments] = useState<ProjectComment[]>([]);
const [loanCommentText, setLoanCommentText] = useState('');
const [loanCommentLoading, setLoanCommentLoading] = useState(false);

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

const fetchMaterials = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(`${API_BASE_URL}/project/material-master`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    setMaterials(res.data || []);
  } catch (error) {
    console.error('Failed to load materials:', error);
  }
};

const fetchMaterialRequests = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/${projectId}/material-requests`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    setMaterialRequests(res.data || []);
  } catch (error) {
    console.error('Failed to load material requests:', error);
  }
};

const addMaterialRow = () => {
  setMaterialRows([
    ...materialRows,
    {
      materialId: '',
      materialName: '',
      category: '',
      unit: '',
      brand: '',
      rate: '',
      quantity: '',
      gstPercent: '',
      totalAmount: 0,
      remarks: '',
    },
  ]);
};

const updateMaterialRow = (
  index: number,
  field: keyof MaterialRequestRow,
  value: string,
) => {
  const updated = [...materialRows];
  const row = { ...updated[index], [field]: value };

  if (field === 'materialId') {
    const selected = materials.find((item) => String(item.id) === value);

    if (selected) {
      row.materialId = String(selected.id);
      row.materialName = selected.name || '';
      row.category = selected.category || '';
      row.unit = selected.unit || '';
      row.brand = selected.brand || '';
      row.rate = String(selected.rate || 0);
      row.gstPercent = String(selected.gstPercent || 0);
    }
  }

  const rate = Number(row.rate || 0);
  const quantity = Number(row.quantity || 0);
  const gstPercent = Number(row.gstPercent || 0);
  const baseAmount = rate * quantity;
  const gstAmount = (baseAmount * gstPercent) / 100;

  row.totalAmount = baseAmount + gstAmount;

  updated[index] = row;
  setMaterialRows(updated);
};

const removeMaterialRow = (index: number) => {
  setMaterialRows(materialRows.filter((_, rowIndex) => rowIndex !== index));
};

const submitMaterialRequest = async () => {
  if (!materialRows.length) {
    alert('Please add at least one material');
    return;
  }

  try {
    setSubmittingMaterialRequest(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/material-request`,
      {
        projectId,
        title: materialRequestTitle,
        remarks: materialRequestRemarks,
        items: materialRows,
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    alert('Material request submitted successfully');

    setMaterialRequestTitle('');
    setMaterialRequestRemarks('');
    setMaterialRows([]);

    fetchMaterialRequests();
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to submit material request');
  } finally {
    setSubmittingMaterialRequest(false);
  }
};

const submitApproval = async (
  type: 'marketing-head' | 'owner',
  approvalStatus: 'APPROVED' | 'REJECTED',
) => {
  try {
    setApprovalLoading(true);

    const token = localStorage.getItem('token');

    const note =
      type === 'marketing-head'
        ? marketingHeadNote
        : ownerNote;

    await axios.patch(
      `${API_BASE_URL}/project/${projectId}/${type}-approval`,
      {
        approvalStatus,
        note,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert(
      approvalStatus === 'APPROVED'
        ? 'Project approved successfully'
        : 'Project rejected successfully',
    );

    setMarketingHeadNote('');
    setOwnerNote('');

    fetchProject();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to update approval',
    );
  } finally {
    setApprovalLoading(false);
  }
};

const fetchLoanDetail = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/${projectId}/loan-detail`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    if (res.data) {
      setLoanDetail(res.data);

      setLoanForm({
        loanType: res.data.loanType || '',
        bankName: res.data.bankName || '',
        applicationNumber:
          res.data.applicationNumber || '',
        marginMoney:
          String(res.data.marginMoney || ''),
        sanctionAmount:
          String(res.data.sanctionAmount || ''),
        firstEmiDisbursementAmount: String(
          res.data.firstEmiDisbursementAmount || '',
        ),
        firstEmiDisbursementDate:
          res.data.firstEmiDisbursementDate
            ?.split('T')[0] || '',
        status:
          res.data.status ||
          'DOCUMENT_PENDING',
        remarks: res.data.remarks || '',
      });
    }
  } catch (error) {
    console.error(error);
  }
};

const saveLoanDetail = async () => {
  try {
    setLoanLoading(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/${projectId}/loan-detail`,
      loanForm,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Loan detail saved successfully');

    fetchLoanDetail();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to save loan detail',
    );
  } finally {
    setLoanLoading(false);
  }
};

const fetchLoanComments = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/${projectId}/comments`,
      {
        params: {
          department: 'LOAN',
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setLoanComments(res.data || []);
  } catch (error) {
    console.error('Failed to load loan comments:', error);
  }
};

const submitLoanComment = async () => {
  if (!loanCommentText.trim()) {
    alert('Please write a comment');
    return;
  }

  try {
    setLoanCommentLoading(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/comment`,
      {
        projectId: Number(projectId),
        department: 'LOAN',
        comment: loanCommentText.trim(),
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setLoanCommentText('');
    fetchLoanComments();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to add loan comment',
    );
  } finally {
    setLoanCommentLoading(false);
  }
};

  useEffect(() => {
  if (projectId) {
  fetchProject();
  fetchLoanDetail();
  fetchDocuments();
  fetchMaterials();
  fetchMaterialRequests();
  fetchLoanComments();
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
    { key: 'PROJECT_MANAGEMENT', label: 'Material Requirement' },
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
          <Field label="Branch" value={project.branchName} />
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

       <div className="mt-5 grid gap-4 md:grid-cols-2">
  <div className="rounded-xl border p-4">
    <h3 className="font-bold text-gray-800">
      Marketing Head Action
    </h3>

    <textarea
      placeholder="Approval / rejection note"
      value={marketingHeadNote}
      onChange={(e) =>
        setMarketingHeadNote(e.target.value)
      }
      className="mt-3 w-full rounded-xl border p-3"
      rows={3}
    />

    <div className="mt-3 flex gap-2">
      <button
        onClick={() =>
          submitApproval(
            'marketing-head',
            'APPROVED',
          )
        }
        disabled={approvalLoading}
        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        Approve
      </button>

      <button
        onClick={() =>
          submitApproval(
            'marketing-head',
            'REJECTED',
          )
        }
        disabled={approvalLoading}
        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  </div>

  <div className="rounded-xl border p-4">
    <h3 className="font-bold text-gray-800">
      Owner Action
    </h3>

    <textarea
      placeholder="Approval / rejection note"
      value={ownerNote}
      onChange={(e) =>
        setOwnerNote(e.target.value)
      }
      className="mt-3 w-full rounded-xl border p-3"
      rows={3}
    />

    <div className="mt-3 flex gap-2">
      <button
        onClick={() =>
          submitApproval(
            'owner',
            'APPROVED',
          )
        }
        disabled={approvalLoading}
        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        Approve
      </button>

      <button
        onClick={() =>
          submitApproval(
            'owner',
            'REJECTED',
          )
        }
        disabled={approvalLoading}
        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
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
  <div className="space-y-5">
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-2xl font-bold text-gray-800">
        Material Request
      </h2>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <input
          placeholder="Request Title"
          value={materialRequestTitle}
          onChange={(e) =>
            setMaterialRequestTitle(
              e.target.value,
            )
          }
          className="rounded-xl border p-3"
        />

        <input
          placeholder="Remarks"
          value={materialRequestRemarks}
          onChange={(e) =>
            setMaterialRequestRemarks(
              e.target.value,
            )
          }
          className="rounded-xl border p-3"
        />
      </div>

      <div className="mt-5 space-y-4">
        {materialRows.map(
          (row, index) => (
            <div
              key={index}
              className="rounded-2xl border p-4"
            >
              <div className="grid gap-3 md:grid-cols-3">
                <select
                  value={row.materialId}
                  onChange={(e) =>
                    updateMaterialRow(
                      index,
                      'materialId',
                      e.target.value,
                    )
                  }
                  className="rounded-xl border p-3"
                >
                  <option value="">
                    Select Material
                  </option>

                  {materials.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </option>
                    ),
                  )}
                </select>

                <input
                  type="number"
                  placeholder="Quantity"
                  value={row.quantity}
                  onChange={(e) =>
                    updateMaterialRow(
                      index,
                      'quantity',
                      e.target.value,
                    )
                  }
                  className="rounded-xl border p-3"
                />

                <input
                  type="number"
                  placeholder="Rate"
                  value={row.rate}
                  onChange={(e) =>
                    updateMaterialRow(
                      index,
                      'rate',
                      e.target.value,
                    )
                  }
                  className="rounded-xl border p-3"
                />

                <input
                  type="number"
                  placeholder="GST %"
                  value={row.gstPercent}
                  onChange={(e) =>
                    updateMaterialRow(
                      index,
                      'gstPercent',
                      e.target.value,
                    )
                  }
                  className="rounded-xl border p-3"
                />

                <input
                  placeholder="Remarks"
                  value={row.remarks}
                  onChange={(e) =>
                    updateMaterialRow(
                      index,
                      'remarks',
                      e.target.value,
                    )
                  }
                  className="rounded-xl border p-3"
                />

                <div className="flex items-center justify-between rounded-xl bg-gray-100 px-4 py-3">
                  <span className="font-semibold text-gray-700">
                    ₹
                    {Number(
                      row.totalAmount || 0,
                    ).toLocaleString(
                      'en-IN',
                    )}
                  </span>

                  <button
                    onClick={() =>
                      removeMaterialRow(
                        index,
                      )
                    }
                    className="rounded-lg bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={addMaterialRow}
          className="rounded-xl bg-gray-800 px-5 py-3 font-semibold text-white hover:bg-black"
        >
          + Add Material
        </button>

        <button
          onClick={
            submitMaterialRequest
          }
          disabled={
            submittingMaterialRequest
          }
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submittingMaterialRequest
            ? 'Submitting...'
            : 'Submit Request'}
        </button>
      </div>
    </div>

    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-2xl font-bold text-gray-800">
        Material Request History
      </h2>

      <div className="mt-5 space-y-4">
        {materialRequests.length ===
        0 ? (
          <p className="text-sm text-gray-500">
            No material requests found
          </p>
        ) : (
          materialRequests.map(
            (request) => (
              <div
                key={request.id}
                className="rounded-2xl border p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {request.title ||
                        'Material Request'}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {request.requestedByName ||
                        '-'}{' '}
                      |{' '}
                      {request.requestedByRole ||
                        '-'}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {request.createdAt
                        ? new Date(
                            request.createdAt,
                          ).toLocaleString()
                        : '-'}
                    </p>

                    {request.remarks && (
                      <p className="mt-2 text-sm text-gray-700">
                        {
                          request.remarks
                        }
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-700">
                      {
                        request.status
                      }
                    </p>

                    <p className="mt-2 text-lg font-bold text-green-700">
                      ₹
                      {Number(
                        request.totalAmount ||
                          0,
                      ).toLocaleString(
                        'en-IN',
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full border text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-3 py-2 text-left">
                          Material
                        </th>

                        <th className="border px-3 py-2 text-left">
                          Qty
                        </th>

                        <th className="border px-3 py-2 text-left">
                          Rate
                        </th>

                        <th className="border px-3 py-2 text-left">
                          GST
                        </th>

                        <th className="border px-3 py-2 text-left">
                          Total
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {request.items?.map(
                        (
                          item,
                          itemIndex,
                        ) => (
                          <tr
                            key={
                              itemIndex
                            }
                          >
                            <td className="border px-3 py-2">
                              {
                                item.materialName
                              }
                            </td>

                            <td className="border px-3 py-2">
                              {
                                item.quantity
                              }
                            </td>

                            <td className="border px-3 py-2">
                              ₹
                              {Number(
                                item.rate ||
                                  0,
                              ).toLocaleString(
                                'en-IN',
                              )}
                            </td>

                            <td className="border px-3 py-2">
                              {
                                item.gstPercent
                              }
                              %
                            </td>

                            <td className="border px-3 py-2 font-semibold text-green-700">
                              ₹
                              {Number(
                                item.totalAmount ||
                                  0,
                              ).toLocaleString(
                                'en-IN',
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  </div>
)}

{activeTab === 'LOAN_DEPARTMENT' && (
  <div className="rounded-2xl bg-white p-5 shadow">
    <h2 className="text-xl font-bold text-gray-800">
      Loan Department
    </h2>

    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <select
        value={loanForm.loanType}
        onChange={(e) =>
          setLoanForm({
            ...loanForm,
            loanType: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      >
        <option value="">Select Loan Type</option>

        <option value="SUBSIDY_LOAN">
          Subsidy Loan
        </option>

        <option value="PRIVATE_LOAN">
          Private Loan
        </option>
      </select>

      <input
        type="text"
        placeholder="Bank Name"
        value={loanForm.bankName}
        onChange={(e) =>
          setLoanForm({
            ...loanForm,
            bankName: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        type="text"
        placeholder="Application Number"
        value={loanForm.applicationNumber}
        onChange={(e) =>
          setLoanForm({
            ...loanForm,
            applicationNumber: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        type="number"
        placeholder="Margin Money"
        value={loanForm.marginMoney}
        onChange={(e) =>
          setLoanForm({
            ...loanForm,
            marginMoney: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        type="number"
        placeholder="Sanction Amount"
        value={loanForm.sanctionAmount}
        onChange={(e) =>
          setLoanForm({
            ...loanForm,
            sanctionAmount: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        type="number"
        placeholder="First EMI Disbursement Amount"
        value={
          loanForm.firstEmiDisbursementAmount
        }
        onChange={(e) =>
          setLoanForm({
            ...loanForm,
            firstEmiDisbursementAmount:
              e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        type="date"
        value={
          loanForm.firstEmiDisbursementDate
        }
        onChange={(e) =>
          setLoanForm({
            ...loanForm,
            firstEmiDisbursementDate:
              e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <select
        value={loanForm.status}
        onChange={(e) =>
          setLoanForm({
            ...loanForm,
            status: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      >
        <option value="DOCUMENT_PENDING">
          Document Pending
        </option>

        <option value="DOCUMENT_COMPLETED">
          Document Completed
        </option>

        <option value="REGISTRATION_COMPLETED">
          Registration Completed
        </option>

        <option value="IN_PRINCIPAL_GENERATED">
          In Principal Generated
        </option>

        <option value="QUOTATION_SUBMITTED">
          Quotation Submitted
        </option>

        <option value="BANK_VISITED">
          Bank Visited
        </option>

        <option value="LOAN_DISBURSED">
          Loan Disbursed
        </option>

        <option value="FILE_REJECTED">
          File Rejected
        </option>

        <option value="LOAN_REAPPLY">
          Loan Reapply
        </option>
      </select>
    </div>

    <textarea
      placeholder="Loan Remarks"
      value={loanForm.remarks}
      onChange={(e) =>
        setLoanForm({
          ...loanForm,
          remarks: e.target.value,
        })
      }
      className="mt-4 w-full rounded-xl border p-3"
      rows={4}
    />

    <button
      onClick={saveLoanDetail}
      disabled={loanLoading}
      className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {loanLoading
        ? 'Saving...'
        : 'Save Loan Detail'}
    </button>

    <div className="mt-8 rounded-2xl border p-4">
  <h3 className="text-lg font-bold text-gray-800">
    Loan Comments / Follow-up History
  </h3>

  <textarea
    placeholder="Write loan follow-up comment..."
    value={loanCommentText}
    onChange={(e) =>
      setLoanCommentText(e.target.value)
    }
    className="mt-4 w-full rounded-xl border p-3"
    rows={3}
  />

  <button
    onClick={submitLoanComment}
    disabled={loanCommentLoading}
    className="mt-3 rounded-xl bg-gray-800 px-5 py-3 font-semibold text-white hover:bg-black disabled:opacity-50"
  >
    {loanCommentLoading
      ? 'Saving Comment...'
      : 'Add Comment'}
  </button>

  <div className="mt-5 space-y-3">
    {loanComments.length === 0 ? (
      <p className="text-sm text-gray-500">
        No loan comments yet.
      </p>
    ) : (
      loanComments.map((comment) => (
        <div
          key={comment.id}
          className="rounded-xl bg-gray-50 p-4"
        >
          <p className="text-sm text-gray-800">
            {comment.comment || '-'}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            {comment.createdByName || 'Unknown'} |{' '}
            {comment.createdByRole || '-'} |{' '}
            {comment.createdAt
              ? new Date(comment.createdAt).toLocaleString()
              : '-'}
          </p>
        </div>
      ))
    )}
  </div>
</div>

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
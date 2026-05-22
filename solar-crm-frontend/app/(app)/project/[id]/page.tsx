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
  projectOwnerName?: string;
projectOwnerRole?: string;
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

type ExecutionActivity = {
  id: number;
  projectId: number;
  activityType?: string;
  status?: string;
  scheduledDate?: string;
  completedDate?: string;
  inspectionDeadline?: string;
  proofRequired?: boolean;
  remarks?: string;
  assignedToName?: string;
  createdByName?: string;
  updatedByName?: string;
  createdAt?: string;
};

type ExecutionProof = {
  id: number;
  activityId: number;
  projectId: number;
  fileUrl?: string;
  latitude?: string;
  longitude?: string;
  uploadedByName?: string;
  createdAt?: string;
};

type PaymentInstallment = {
  id: number;
  projectId: number;

  label?: string;

  amount?: number;
  paidAmount?: number;
  pendingAmount?: number;

  dueDate?: string;
  paidDate?: string;

  status?: string;

  paymentMode?: string;
  transactionId?: string;
  remarks?: string;

  collectedByName?: string;

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
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);

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

const [subsidyDetail, setSubsidyDetail] = useState<any>(null);

const [subsidyForm, setSubsidyForm] = useState({
  status: 'DOCUMENT_PENDING',
  dcrCertificateReady: false,
  panelWarrantyReceived: false,
  inverterWarrantyReceived: false,
  vendorAgreementReady: false,
  wcrReady: false,
  portalSubmissionDate: '',
  subsidyRequestedDate: '',
  subsidyDisbursedDate: '',
  subsidyAmount: '',
  remarks: '',
});

const [subsidyLoading, setSubsidyLoading] = useState(false);

const [electricityDetail, setElectricityDetail] =
  useState<any>(null);

const [electricityForm, setElectricityForm] =
  useState({
    discomName: '',
    status: 'DOCUMENT_PENDING',
    fileSubmissionDate: '',
    siteVisitDate: '',
    demandDepositDate: '',
    demandDepositAmount: '',
    meterTestingDate: '',
    netMeterInstallationDate: '',
    remarks: '',
  });

const [electricityLoading, setElectricityLoading] =
  useState(false);

  const [executionActivities, setExecutionActivities] =
  useState<ExecutionActivity[]>([]);

const [executionForm, setExecutionForm] = useState({
  activityType: '',
  status: 'PENDING',
  scheduledDate: '',
  completedDate: '',
  remarks: '',
});

const [executionLoading, setExecutionLoading] =
  useState(false);

  const [executionProofs, setExecutionProofs] =
  useState<Record<number, ExecutionProof[]>>({});

  const [updatingExecutionId, setUpdatingExecutionId] =
  useState<number | null>(null);

  const [completionDate, setCompletionDate] = useState('');
const [completionNote, setCompletionNote] = useState('');
const [completionLoading, setCompletionLoading] = useState(false);

const [proofFiles, setProofFiles] =
  useState<Record<number, File[]>>({});

const [proofUploadingId, setProofUploadingId] =
  useState<number | null>(null);

  const [paymentInstallments, setPaymentInstallments] =
  useState<PaymentInstallment[]>([]);

const [paymentLoading, setPaymentLoading] =
  useState(false);

const [paymentForm, setPaymentForm] = useState({
  label: 'FIRST_PAYMENT',
  amount: '',
  dueDate: '',
  remarks: '',
});

const [receivingPaymentId, setReceivingPaymentId] =
  useState<number | null>(null);

const [receivePaymentForms, setReceivePaymentForms] =
  useState<Record<number, {
    receivedAmount: string;
    paymentMode: string;
    transactionId: string;
    remarks: string;
  }>>({});

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
  params: {
    activeOnly: true,
  },
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

const completeProject = async () => {
  const confirmed = window.confirm(
    'Mark this project as completed?',
  );

  if (!confirmed) return;

  try {
    setCompletionLoading(true);

    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/${projectId}/complete`,
      {
        actualCompletionDate: completionDate || undefined,
        completionNote,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Project marked as completed');

    setCompletionDate('');
    setCompletionNote('');

    fetchProject();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to complete project',
    );
  } finally {
    setCompletionLoading(false);
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

const fetchSubsidyDetail = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/${projectId}/subsidy-detail`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    if (res.data) {
      setSubsidyDetail(res.data);

      setSubsidyForm({
        status: res.data.status || 'DOCUMENT_PENDING',
        dcrCertificateReady: !!res.data.dcrCertificateReady,
        panelWarrantyReceived: !!res.data.panelWarrantyReceived,
        inverterWarrantyReceived: !!res.data.inverterWarrantyReceived,
        vendorAgreementReady: !!res.data.vendorAgreementReady,
        wcrReady: !!res.data.wcrReady,
        portalSubmissionDate:
          res.data.portalSubmissionDate?.split('T')[0] || '',
        subsidyRequestedDate:
          res.data.subsidyRequestedDate?.split('T')[0] || '',
        subsidyDisbursedDate:
          res.data.subsidyDisbursedDate?.split('T')[0] || '',
        subsidyAmount: String(res.data.subsidyAmount || ''),
        remarks: res.data.remarks || '',
      });
    }
  } catch (error) {
    console.error('Failed to load subsidy detail:', error);
  }
};

const saveSubsidyDetail = async () => {
  try {
    setSubsidyLoading(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/${projectId}/subsidy-detail`,
      subsidyForm,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Subsidy detail saved successfully');

    fetchSubsidyDetail();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to save subsidy detail',
    );
  } finally {
    setSubsidyLoading(false);
  }
};

const fetchElectricityDetail = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/${projectId}/electricity-detail`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    if (res.data) {
      setElectricityDetail(res.data);

      setElectricityForm({
        discomName: res.data.discomName || '',
        status:
          res.data.status ||
          'DOCUMENT_PENDING',

        fileSubmissionDate:
          res.data.fileSubmissionDate?.split(
            'T',
          )[0] || '',

        siteVisitDate:
          res.data.siteVisitDate?.split(
            'T',
          )[0] || '',

        demandDepositDate:
          res.data.demandDepositDate?.split(
            'T',
          )[0] || '',

        demandDepositAmount: String(
          res.data.demandDepositAmount || '',
        ),

        meterTestingDate:
          res.data.meterTestingDate?.split(
            'T',
          )[0] || '',

        netMeterInstallationDate:
          res.data.netMeterInstallationDate?.split(
            'T',
          )[0] || '',

        remarks: res.data.remarks || '',
      });
    }
  } catch (error) {
    console.error(
      'Failed to load electricity detail:',
      error,
    );
  }
};

const saveElectricityDetail = async () => {
  try {
    setElectricityLoading(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/${projectId}/electricity-detail`,
      electricityForm,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert(
      'Electricity detail saved successfully',
    );

    fetchElectricityDetail();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to save electricity detail',
    );
  } finally {
    setElectricityLoading(false);
  }
};

const fetchExecutionActivities = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/${projectId}/execution-activities`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    const activities = Array.isArray(res.data)
  ? res.data
  : [];

setExecutionActivities(activities);

activities.forEach((activity: ExecutionActivity) => {
  if (activity?.id) {
    fetchExecutionProofs(activity.id);
  }
});
  } catch (error) {
    console.error('Failed to load execution activities:', error);
  }
};

const fetchPaymentInstallments = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/payment-collection`,
      {
        params: {
          projectId,
          limit: 100,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setPaymentInstallments(res.data?.data || []);
  } catch (error) {
    console.error(
      'Failed to load payment installments:',
      error,
    );
  }
};

const createPaymentInstallment = async () => {
  if (!paymentForm.amount) {
    alert('Please enter amount');
    return;
  }

  try {
    setPaymentLoading(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/${projectId}/payment-installment`,
      {
        ...paymentForm,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Payment installment added');

    setPaymentForm({
      label: 'FIRST_PAYMENT',
      amount: '',
      dueDate: '',
      remarks: '',
    });

    fetchPaymentInstallments();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to add payment installment',
    );
  } finally {
    setPaymentLoading(false);
  }
};

const updateReceivePaymentForm = (
  installmentId: number,
  field: 'receivedAmount' | 'paymentMode' | 'transactionId' | 'remarks',
  value: string,
) => {
  setReceivePaymentForms((prev) => ({
    ...prev,
    [installmentId]: {
      receivedAmount: prev[installmentId]?.receivedAmount || '',
      paymentMode: prev[installmentId]?.paymentMode || '',
      transactionId: prev[installmentId]?.transactionId || '',
      remarks: prev[installmentId]?.remarks || '',
      [field]: value,
    },
  }));
};

const receivePayment = async (installmentId: number) => {
  const form = receivePaymentForms[installmentId];

  if (!form?.receivedAmount) {
    alert('Please enter received amount');
    return;
  }

  try {
    setReceivingPaymentId(installmentId);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/payment-collection/installments/${installmentId}/receive`,
      form,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Payment received successfully');

    setReceivePaymentForms((prev) => ({
      ...prev,
      [installmentId]: {
        receivedAmount: '',
        paymentMode: '',
        transactionId: '',
        remarks: '',
      },
    }));

    fetchPaymentInstallments();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to receive payment',
    );
  } finally {
    setReceivingPaymentId(null);
  }
};

const hidePaymentInstallment = async (installmentId: number) => {
  const reason = window.prompt(
    'Why do you want to hide this payment entry?',
    'Test / duplicate entry',
  );

  if (reason === null) return;

  const confirmed = window.confirm(
    'This payment entry will be hidden from reports and reminders. Continue?',
  );

  if (!confirmed) return;

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/payment-collection/installments/${installmentId}/hide`,
      {
        reason,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Payment entry hidden successfully');

    fetchPaymentInstallments();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to hide payment entry',
    );
  }
};

const createExecutionActivity = async () => {
  if (!executionForm.activityType) {
    alert('Please select activity type');
    return;
  }

  try {
    setExecutionLoading(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/execution-activity`,
      {
        projectId: Number(projectId),
        ...executionForm,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Execution activity added');

    setExecutionForm({
      activityType: '',
      status: 'PENDING',
      scheduledDate: '',
      completedDate: '',
      remarks: '',
    });

    fetchExecutionActivities();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to add execution activity',
    );
  } finally {
    setExecutionLoading(false);
  }
};

const fetchExecutionProofs = async (activityId: number) => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/execution-activity/${activityId}/proofs`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setExecutionProofs((prev) => ({
      ...prev,
      [activityId]: res.data || [],
    }));
  } catch (error) {
    console.error('Failed to load execution proofs:', error);
  }
};

const uploadExecutionProofs = async (
  activity: ExecutionActivity,
) => {
  const files = proofFiles[activity.id] || [];

  if (!files.length) {
    alert('Please select proof photos');
    return;
  }

  try {
    setProofUploadingId(activity.id);

    const token = localStorage.getItem('token');

    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('activityId', String(activity.id));
    formData.append('projectId', String(projectId));

    await axios.post(
      `${API_BASE_URL}/project/execution-proof/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    alert('Execution proof uploaded');

    setProofFiles((prev) => ({
      ...prev,
      [activity.id]: [],
    }));

    fetchExecutionProofs(activity.id);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to upload execution proof',
    );
  } finally {
    setProofUploadingId(null);
  }
};

const updateExecutionActivityStatus = async (
  activity: ExecutionActivity,
  status: string,
) => {
  try {
    setUpdatingExecutionId(activity.id);

    const token = localStorage.getItem('token');

    const payload: any = {
      status,
    };

    if (status === 'COMPLETED') {
      payload.completedDate = new Date()
        .toISOString()
        .split('T')[0];
    }

    await axios.patch(
      `${API_BASE_URL}/project/execution-activity/${activity.id}`,
      payload,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Execution activity updated');

    fetchExecutionActivities();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to update execution activity',
    );
  } finally {
    setUpdatingExecutionId(null);
  }
};

useEffect(() => {
  const storedUser = localStorage.getItem('user');

  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUserRoles(
        Array.isArray(parsedUser?.roles)
          ? parsedUser.roles
          : [],
      );
    } catch {
      setCurrentUserRoles([]);
    }
  }
}, []);

const hasRole = (allowedRoles: string[]) => {
  return currentUserRoles.some((role) =>
    allowedRoles.includes(role),
  );
};

const canMarketingApprove = hasRole([
  'OWNER',
  'MARKETING_HEAD',
]);

const canOwnerApprove = hasRole(['OWNER']);

const canCompleteProject = hasRole([
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
]);

const canManageLoan = hasRole([
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
  'LOAN_MANAGER',
]);

const canManageSubsidy = hasRole([
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
  'SUBSIDY_MANAGER',
]);

const canManageElectricity = hasRole([
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
  'ELECTRICITY_MANAGER',
]);

const canManagePayment = hasRole([
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
]);

const canManageMaterial = hasRole([
  'OWNER',
  'PROJECT_MANAGER',
]);

  useEffect(() => {
  if (projectId) {
  fetchProject();
  fetchLoanDetail();
  fetchDocuments();
  fetchMaterials();
  fetchMaterialRequests();
  fetchLoanComments();
  fetchSubsidyDetail();
  fetchElectricityDetail();
  fetchExecutionActivities();
  fetchPaymentInstallments();
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
    { key: 'PROJECT_EXECUTION', label: 'Project Execution' },
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
          <Field
  label="Project Owner"
  value={project.projectOwnerName || 'Not Assigned'}
/>

<Field
  label="Owner Role"
  value={project.projectOwnerRole || '-'}
/>
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

        {canMarketingApprove && (
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
  )}

{canOwnerApprove && (
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
  )}
</div>

      </div>
{canCompleteProject && (
      <div className="rounded-2xl bg-white p-5 shadow">
  <h2 className="text-lg font-bold text-gray-800">
    Complete Project
  </h2>

  <p className="mt-1 text-sm text-gray-500">
    Use this for record correction when a project has already been completed.
  </p>

  <div className="mt-4 grid gap-3 md:grid-cols-2">
    <input
      type="date"
      value={completionDate}
      onChange={(e) => setCompletionDate(e.target.value)}
      className="rounded-xl border p-3"
    />

    <input
      placeholder="Completion note"
      value={completionNote}
      onChange={(e) => setCompletionNote(e.target.value)}
      className="rounded-xl border p-3"
    />
  </div>

  <button
    onClick={completeProject}
    disabled={completionLoading}
    className="mt-4 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
  >
    {completionLoading
      ? 'Completing...'
      : 'Mark Project Completed'}
  </button>
</div>
)}

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-2 text-lg font-bold text-gray-800">Remarks</h2>
        <p className="text-sm text-gray-700">{project.remarks || 'No remarks'}</p>
      </div>
        </>
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

{canManageMaterial && (
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
)}
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

{activeTab === 'PROJECT_EXECUTION' && (
  <div className="space-y-5">
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="text-xl font-bold text-gray-800">
        Project Execution
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Track site execution, inspections, deadlines, and project work progress.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <select
          value={executionForm.activityType}
          onChange={(e) =>
            setExecutionForm({
              ...executionForm,
              activityType: e.target.value,
            })
          }
          className="rounded-xl border p-3"
        >
          <option value="">Select Activity</option>
          <option value="STRUCTURE_WORK">Structure Work</option>
          <option value="STRUCTURE_INSPECTION">Structure Inspection</option>
          <option value="PILLAR_WORK">Pillar Work</option>
          <option value="PILLAR_INSPECTION">Pillar Inspection</option>
          <option value="PANEL_INSTALLED">Panel Installed</option>
          <option value="INVERTER_INSTALLED">Inverter Installed</option>
          <option value="EARTHING_PACKING">Earthing / Packing</option>
          <option value="GENERATION_STARTED">Generation Started</option>
          <option value="GENERATION_INSPECTION">Generation Inspection</option>
          <option value="INVOICE_FILE_GIVEN">Invoice File Given</option>
          <option value="NON_DCR_PENDING">Non-DCR Pending</option>
        </select>

        <select
          value={executionForm.status}
          onChange={(e) =>
            setExecutionForm({
              ...executionForm,
              status: e.target.value,
            })
          }
          className="rounded-xl border p-3"
        >
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <div>
          <p className="mb-1 text-sm font-semibold text-gray-700">
            Scheduled Date
          </p>
          <input
            type="date"
            value={executionForm.scheduledDate}
            onChange={(e) =>
              setExecutionForm({
                ...executionForm,
                scheduledDate: e.target.value,
              })
            }
            className="w-full rounded-xl border p-3"
          />
        </div>

        <div>
          <p className="mb-1 text-sm font-semibold text-gray-700">
            Completed Date
          </p>
          <input
            type="date"
            value={executionForm.completedDate}
            onChange={(e) =>
              setExecutionForm({
                ...executionForm,
                completedDate: e.target.value,
              })
            }
            className="w-full rounded-xl border p-3"
          />
        </div>
      </div>

      <textarea
        placeholder="Execution remarks"
        value={executionForm.remarks}
        onChange={(e) =>
          setExecutionForm({
            ...executionForm,
            remarks: e.target.value,
          })
        }
        className="mt-3 w-full rounded-xl border p-3"
        rows={3}
      />

      <button
        onClick={createExecutionActivity}
        disabled={executionLoading}
        className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {executionLoading ? 'Saving...' : 'Add Execution Activity'}
      </button>
    </div>

    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="text-xl font-bold text-gray-800">
        Execution Timeline
      </h2>

      <div className="mt-5 space-y-3">
        {executionActivities.length === 0 ? (
          <p className="text-sm text-gray-500">
            No execution activities yet.
          </p>
        ) : (
          executionActivities.map((activity) => (
            <div
              key={activity.id}
              className={`rounded-xl border p-4 ${
  activity.status === 'OVERDUE'
    ? 'border-red-300 bg-red-50'
    : activity.status === 'COMPLETED'
      ? 'border-green-300 bg-green-50'
      : activity.status === 'IN_PROGRESS'
        ? 'border-yellow-300 bg-yellow-50'
        : 'bg-white'
}`}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-bold text-gray-800">
                    {activity.activityType}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Status: {activity.status || '-'}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Scheduled:{' '}
                    {activity.scheduledDate
                      ? new Date(activity.scheduledDate).toLocaleDateString('en-IN')
                      : '-'}{' '}
                    | Completed:{' '}
                    {activity.completedDate
                      ? new Date(activity.completedDate).toLocaleDateString('en-IN')
                      : '-'}
                  </p>

                  {activity.inspectionDeadline && (
                    <p className="mt-1 text-sm font-semibold text-red-700">
                      Inspection Deadline:{' '}
                      {new Date(activity.inspectionDeadline).toLocaleDateString('en-IN')}
                    </p>
                  )}

                  {activity.status === 'OVERDUE' &&
  activity.inspectionDeadline && (
    <p className="mt-1 text-sm font-semibold text-red-700">
      Overdue by{' '}
      {Math.max(
        1,
        Math.floor(
          (Date.now() -
            new Date(
              activity.inspectionDeadline,
            ).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )}{' '}
      day(s)
    </p>
  )}

                  {activity.remarks && (
                    <p className="mt-2 text-sm text-gray-700">
                      {activity.remarks}
                    </p>
                  )}

                  <div className="mt-4 rounded-xl bg-gray-50 p-3">
  <p className="text-sm font-semibold text-gray-700">
    GPS / Site Proof Photos
  </p>

  <input
    type="file"
    multiple
    accept="image/*"
    onChange={(e) =>
      setProofFiles((prev) => ({
        ...prev,
        [activity.id]: Array.from(e.target.files || []),
      }))
    }
    className="mt-3 w-full rounded-xl border bg-white p-3"
  />

  <button
    onClick={() => uploadExecutionProofs(activity)}
    disabled={proofUploadingId === activity.id}
    className="mt-3 rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
  >
    {proofUploadingId === activity.id
      ? 'Uploading...'
      : 'Upload Proof Photos'}
  </button>

  <div className="mt-4 grid gap-3 md:grid-cols-3">
    {(executionProofs[activity.id] || []).map((proof) => (
      <a
        key={proof.id}
        href={proof.fileUrl}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-xl border bg-white"
      >
        <img
          src={proof.fileUrl}
          alt="Execution proof"
          className="h-40 w-full object-cover"
        />

        <p className="p-2 text-xs text-gray-500">
          {proof.uploadedByName || 'Uploaded'} |{' '}
          {proof.createdAt
            ? new Date(proof.createdAt).toLocaleString()
            : '-'}
        </p>
      </a>
    ))}
  </div>
</div>

<div className="mt-4 flex flex-wrap gap-2">
  <button
    onClick={() =>
      updateExecutionActivityStatus(
        activity,
        'IN_PROGRESS',
      )
    }
    disabled={updatingExecutionId === activity.id}
    className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-50"
  >
    In Progress
  </button>

  <button
    onClick={() =>
      updateExecutionActivityStatus(
        activity,
        'COMPLETED',
      )
    }
    disabled={updatingExecutionId === activity.id}
    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
  >
    Complete
  </button>

  <button
    onClick={() =>
      updateExecutionActivityStatus(
        activity,
        'CANCELLED',
      )
    }
    disabled={updatingExecutionId === activity.id}
    className="rounded-xl bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
  >
    Cancel
  </button>
</div>

                </div>

                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
  activity.status === 'OVERDUE'
    ? 'bg-red-100 text-red-700'
    : activity.status === 'COMPLETED'
      ? 'bg-green-100 text-green-700'
      : activity.status === 'IN_PROGRESS'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-blue-100 text-blue-700'
}`}>
                  {activity.status || 'PENDING'}
                </span>
              </div>
            </div>
          ))
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

{canManageLoan && (
    <button
      onClick={saveLoanDetail}
      disabled={loanLoading}
      className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {loanLoading
        ? 'Saving...'
        : 'Save Loan Detail'}
    </button>
)}

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

{canManageLoan && (
  <button
    onClick={submitLoanComment}
    disabled={loanCommentLoading}
    className="mt-3 rounded-xl bg-gray-800 px-5 py-3 font-semibold text-white hover:bg-black disabled:opacity-50"
  >
    {loanCommentLoading
      ? 'Saving Comment...'
      : 'Add Comment'}
  </button>
)}

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
  <div className="rounded-2xl bg-white p-5 shadow">
    <h2 className="text-xl font-bold text-gray-800">
      Subsidy Department
    </h2>

    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <select
        value={subsidyForm.status}
        onChange={(e) =>
          setSubsidyForm({
            ...subsidyForm,
            status: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      >
        <option value="DOCUMENT_PENDING">Document Pending</option>
        <option value="PLANT_IMAGES_RECEIVED">Plant Images Received</option>
        <option value="DCR_CERTIFICATE_READY">DCR Certificate Ready</option>
        <option value="SUBMISSION_DONE">Submission Done</option>
        <option value="SUBSIDY_REQUESTED">Subsidy Requested</option>
        <option value="SUBSIDY_DISBURSED">Subsidy Disbursed</option>
        <option value="REJECTED">Rejected</option>
      </select>

      <input
        type="number"
        placeholder="Subsidy Amount"
        value={subsidyForm.subsidyAmount}
        onChange={(e) =>
          setSubsidyForm({
            ...subsidyForm,
            subsidyAmount: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <div>
  <p className="mb-1 text-sm font-semibold text-gray-700">
    Portal Submission Date
  </p>

  <input
    type="date"
    value={subsidyForm.portalSubmissionDate}
    onChange={(e) =>
      setSubsidyForm({
        ...subsidyForm,
        portalSubmissionDate: e.target.value,
      })
    }
    className="w-full rounded-xl border p-3"
  />
</div>

      <div>
  <p className="mb-1 text-sm font-semibold text-gray-700">
    Subsidy Requested Date
  </p>

  <input
    type="date"
    value={subsidyForm.subsidyRequestedDate}
    onChange={(e) =>
      setSubsidyForm({
        ...subsidyForm,
        subsidyRequestedDate: e.target.value,
      })
    }
    className="w-full rounded-xl border p-3"
  />
</div>

      <div>
  <p className="mb-1 text-sm font-semibold text-gray-700">
    Subsidy Disbursed Date
  </p>

  <input
    type="date"
    value={subsidyForm.subsidyDisbursedDate}
    onChange={(e) =>
      setSubsidyForm({
        ...subsidyForm,
        subsidyDisbursedDate: e.target.value,
      })
    }
    className="w-full rounded-xl border p-3"
  />
</div>
    </div>

    <div className="mt-5 grid gap-3 md:grid-cols-2">
      {[
        ['dcrCertificateReady', 'DCR Certificate Ready'],
        ['panelWarrantyReceived', 'Panel Warranty Received'],
        ['inverterWarrantyReceived', 'Inverter Warranty Received'],
        ['vendorAgreementReady', 'Vendor Agreement Ready'],
        ['wcrReady', 'WCR Ready'],
      ].map(([key, label]) => (
        <label
          key={key}
          className="flex items-center gap-3 rounded-xl border p-3 text-sm font-semibold text-gray-700"
        >
          <input
            type="checkbox"
            checked={(subsidyForm as any)[key]}
            onChange={(e) =>
              setSubsidyForm({
                ...subsidyForm,
                [key]: e.target.checked,
              })
            }
          />
          {label}
        </label>
      ))}
    </div>

    <textarea
      placeholder="Subsidy Remarks"
      value={subsidyForm.remarks}
      onChange={(e) =>
        setSubsidyForm({
          ...subsidyForm,
          remarks: e.target.value,
        })
      }
      className="mt-4 w-full rounded-xl border p-3"
      rows={4}
    />

{canManageSubsidy && (
    <button
      onClick={saveSubsidyDetail}
      disabled={subsidyLoading}
      className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {subsidyLoading ? 'Saving...' : 'Save Subsidy Detail'}
    </button>
)}
  </div>
)}

{activeTab === 'ELECTRICITY_DEPARTMENT' && (
  <div className="rounded-2xl bg-white p-5 shadow">
    <h2 className="text-xl font-bold text-gray-800">
      Electricity Department
    </h2>

    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <input
        type="text"
        placeholder="DISCOM Name"
        value={electricityForm.discomName}
        onChange={(e) =>
          setElectricityForm({
            ...electricityForm,
            discomName: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <select
        value={electricityForm.status}
        onChange={(e) =>
          setElectricityForm({
            ...electricityForm,
            status: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      >
        <option value="DOCUMENT_PENDING">
          Document Pending
        </option>

        <option value="FILE_SUBMITTED">
          File Submitted
        </option>

        <option value="SITE_VISIT_DONE">
          Site Visit Done
        </option>

        <option value="DEMAND_DEPOSITED">
          Demand Deposited
        </option>

        <option value="METER_TESTING_DONE">
          Meter Testing Done
        </option>

        <option value="NET_METER_INSTALLED">
          Net Meter Installed
        </option>

        <option value="CONNECTION_ACTIVE">
          Connection Active
        </option>

        <option value="REJECTED">
          Rejected
        </option>
      </select>

      <div>
        <p className="mb-1 text-sm font-semibold text-gray-700">
          File Submission Date
        </p>

        <input
          type="date"
          value={
            electricityForm.fileSubmissionDate
          }
          onChange={(e) =>
            setElectricityForm({
              ...electricityForm,
              fileSubmissionDate:
                e.target.value,
            })
          }
          className="w-full rounded-xl border p-3"
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-semibold text-gray-700">
          Site Visit Date
        </p>

        <input
          type="date"
          value={electricityForm.siteVisitDate}
          onChange={(e) =>
            setElectricityForm({
              ...electricityForm,
              siteVisitDate: e.target.value,
            })
          }
          className="w-full rounded-xl border p-3"
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-semibold text-gray-700">
          Demand Deposit Date
        </p>

        <input
          type="date"
          value={
            electricityForm.demandDepositDate
          }
          onChange={(e) =>
            setElectricityForm({
              ...electricityForm,
              demandDepositDate:
                e.target.value,
            })
          }
          className="w-full rounded-xl border p-3"
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-semibold text-gray-700">
          Demand Deposit Amount
        </p>

        <input
          type="number"
          placeholder="Demand Deposit Amount"
          value={
            electricityForm.demandDepositAmount
          }
          onChange={(e) =>
            setElectricityForm({
              ...electricityForm,
              demandDepositAmount:
                e.target.value,
            })
          }
          className="w-full rounded-xl border p-3"
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-semibold text-gray-700">
          Meter Testing Date
        </p>

        <input
          type="date"
          value={
            electricityForm.meterTestingDate
          }
          onChange={(e) =>
            setElectricityForm({
              ...electricityForm,
              meterTestingDate:
                e.target.value,
            })
          }
          className="w-full rounded-xl border p-3"
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-semibold text-gray-700">
          Net Meter Installation Date
        </p>

        <input
          type="date"
          value={
            electricityForm.netMeterInstallationDate
          }
          onChange={(e) =>
            setElectricityForm({
              ...electricityForm,
              netMeterInstallationDate:
                e.target.value,
            })
          }
          className="w-full rounded-xl border p-3"
        />
      </div>
    </div>

    <textarea
      placeholder="Electricity Department Remarks"
      value={electricityForm.remarks}
      onChange={(e) =>
        setElectricityForm({
          ...electricityForm,
          remarks: e.target.value,
        })
      }
      className="mt-4 w-full rounded-xl border p-3"
      rows={4}
    />

{canManageElectricity && (
    <button
      onClick={saveElectricityDetail}
      disabled={electricityLoading}
      className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {electricityLoading
        ? 'Saving...'
        : 'Save Electricity Detail'}
    </button>
)}
  </div>
)}

{activeTab === 'PAYMENT_COLLECTION' && (
  <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl bg-green-50 p-5 shadow">
        <p className="text-sm text-gray-500">
          Total Paid
        </p>

        <p className="mt-2 text-2xl font-bold text-green-700">
          ₹
          {paymentInstallments
            .reduce(
              (sum, item) =>
                sum +
                Number(item.paidAmount || 0),
              0,
            )
            .toLocaleString('en-IN')}
        </p>
      </div>

      <div className="rounded-2xl bg-red-50 p-5 shadow">
        <p className="text-sm text-gray-500">
          Total Pending
        </p>

        <p className="mt-2 text-2xl font-bold text-red-700">
          ₹
          {paymentInstallments
            .reduce(
              (sum, item) =>
                sum +
                Number(
                  item.pendingAmount || 0,
                ),
              0,
            )
            .toLocaleString('en-IN')}
        </p>
      </div>

      <div className="rounded-2xl bg-blue-50 p-5 shadow">
        <p className="text-sm text-gray-500">
          Total Installments
        </p>

        <p className="mt-2 text-2xl font-bold text-blue-700">
          {paymentInstallments.length}
        </p>
      </div>
    </div>

    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="text-xl font-bold text-gray-800">
        Add Payment Installment
      </h2>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <select
          value={paymentForm.label}
          onChange={(e) =>
            setPaymentForm({
              ...paymentForm,
              label: e.target.value,
            })
          }
          className="rounded-xl border p-3"
        >
          <option value="FIRST_PAYMENT">
            First Payment
          </option>

          <option value="SECOND_PAYMENT">
            Second Payment
          </option>

          <option value="THIRD_PAYMENT">
            Third Payment
          </option>

          <option value="FOURTH_PAYMENT">
            Fourth Payment
          </option>

          <option value="EXTRA_PAYMENT">
            Extra Payment
          </option>
        </select>

        <input
          type="number"
          placeholder="Amount"
          value={paymentForm.amount}
          onChange={(e) =>
            setPaymentForm({
              ...paymentForm,
              amount: e.target.value,
            })
          }
          className="rounded-xl border p-3"
        />

        <input
          type="date"
          value={paymentForm.dueDate}
          onChange={(e) =>
            setPaymentForm({
              ...paymentForm,
              dueDate: e.target.value,
            })
          }
          className="rounded-xl border p-3"
        />
      </div>

      <textarea
        placeholder="Remarks"
        value={paymentForm.remarks}
        onChange={(e) =>
          setPaymentForm({
            ...paymentForm,
            remarks: e.target.value,
          })
        }
        className="mt-4 w-full rounded-xl border p-3"
        rows={3}
      />

{canManagePayment && (
      <button
        onClick={createPaymentInstallment}
        disabled={paymentLoading}
        className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {paymentLoading
          ? 'Saving...'
          : 'Add Installment'}
      </button>
)}
    </div>

    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="text-xl font-bold text-gray-800">
        Payment History
      </h2>

      <div className="mt-5 space-y-3">
        {paymentInstallments.length === 0 ? (
          <p className="text-sm text-gray-500">
            No payment installments found.
          </p>
        ) : (
          paymentInstallments.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-bold text-gray-800">
                    {item.label
                      ?.replaceAll('_', ' ')
                      .toLowerCase()
                      .replace(
                        /\b\w/g,
                        (c) =>
                          c.toUpperCase(),
                      )}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Due Date:{' '}
                    {item.dueDate
                      ? new Date(
                          item.dueDate,
                        ).toLocaleDateString(
                          'en-IN',
                        )
                      : '-'}
                  </p>

                  {item.remarks && (
                    <p className="mt-2 text-sm text-gray-700">
                      {item.remarks}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-gray-800">
                    ₹
                    {Number(
                      item.amount || 0,
                    ).toLocaleString(
                      'en-IN',
                    )}
                  </p>

                  <p className="mt-1 text-sm text-green-700">
                    Paid: ₹
                    {Number(
                      item.paidAmount || 0,
                    ).toLocaleString(
                      'en-IN',
                    )}
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    Pending: ₹
                    {Number(
                      item.pendingAmount || 0,
                    ).toLocaleString(
                      'en-IN',
                    )}
                  </p>

                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === 'PAID'
                        ? 'bg-green-100 text-green-700'
                        : item.status ===
                            'OVERDUE'
                          ? 'bg-red-100 text-red-700'
                          : item.status ===
                              'PARTIAL'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {item.status || 'PENDING'}
                  </span>

                  {item.status !== 'PAID' && item.status !== 'CANCELLED' && (
  <div className="mt-4 rounded-xl bg-gray-50 p-3 text-left">
    <p className="text-sm font-semibold text-gray-700">
      Receive Payment
    </p>

    <div className="mt-3 grid gap-3">
      <input
        type="number"
        placeholder="Received Amount"
        value={
          receivePaymentForms[item.id]?.receivedAmount || ''
        }
        onChange={(e) =>
          updateReceivePaymentForm(
            item.id,
            'receivedAmount',
            e.target.value,
          )
        }
        className="rounded-xl border p-3"
      />

      <select
        value={
          receivePaymentForms[item.id]?.paymentMode || ''
        }
        onChange={(e) =>
          updateReceivePaymentForm(
            item.id,
            'paymentMode',
            e.target.value,
          )
        }
        className="rounded-xl border p-3"
      >
        <option value="">Payment Mode</option>
        <option value="CASH">Cash</option>
        <option value="UPI">UPI</option>
        <option value="BANK_TRANSFER">
          Bank Transfer
        </option>
        <option value="CHEQUE">Cheque</option>
        <option value="OTHER">Other</option>
      </select>

      <input
        placeholder="Transaction ID / Reference"
        value={
          receivePaymentForms[item.id]?.transactionId || ''
        }
        onChange={(e) =>
          updateReceivePaymentForm(
            item.id,
            'transactionId',
            e.target.value,
          )
        }
        className="rounded-xl border p-3"
      />

      <textarea
        placeholder="Payment remarks"
        value={
          receivePaymentForms[item.id]?.remarks || ''
        }
        onChange={(e) =>
          updateReceivePaymentForm(
            item.id,
            'remarks',
            e.target.value,
          )
        }
        className="rounded-xl border p-3"
        rows={2}
      />

{canManagePayment && (
      <button
        onClick={() => receivePayment(item.id)}
        disabled={receivingPaymentId === item.id}
        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        {receivingPaymentId === item.id
          ? 'Saving...'
          : 'Receive Payment'}
      </button>
)}
    </div>

{canManagePayment && (
    <button
  type="button"
  onClick={() => hidePaymentInstallment(item.id)}
  className="mt-3 rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
>
  Hide Entry
</button>
)}
  </div>
)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
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
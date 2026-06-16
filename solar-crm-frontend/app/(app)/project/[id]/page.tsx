'use client';

import { useEffect, useRef, useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import CustomerUpdatesTab from '@/app/components/meeting/project/CustomerUpdatesTab';
import SearchableUserSelect from '@/app/components/meeting/common/SearchableUserSelect';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const compressImageFile = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;

  if (file.size <= 1024 * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const maxWidth = 1600;
      const scale = Math.min(1, maxWidth / img.width);

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);

          if (!blob) {
            resolve(file);
            return;
          }

          resolve(
            new File([blob], file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }),
          );
        },
        'image/jpeg',
        0.78,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
};

type Project = {
  id: number;
  customerName?: string;
  customerPhone?: string;
  city?: string;
  zone?: string;
  branchName?: string;
  projectOwnerName?: string;
projectOwnerRole?: string;
projectOwnerId?: number;
  electricityKNumber?: string;
  customerGmail?: string;
  customerUserId?: number;
customerUserName?: string;
customerId?: number;
customerCode?: string;
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
  projectManagerApprovalStatus?: string;
projectManagerApprovalNote?: string;
  marketingHeadApprovalStatus?: string;
  marketingHeadApprovalNote?: string;
  ownerApprovalStatus?: string;
  ownerApprovalNote?: string;
  remarks?: string;
  createdAt?: string;
    address?: string;
  gpsAddress?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  finalCost?: number;
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
  reservedQuantity?: number;
issuedQuantity?: number;
issuePendingQuantity?: number;
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

type ProjectEditHistory = {
  id: number;
  projectId: number;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changedByName?: string;
  changedByRole?: string;
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

  approvalStatus?: string;

  createdAt?: string;
};

type LoanCoApplicant = {
  id: number;

  fullName?: string;
  relationWithCustomer?: string;
  mobileNumber?: string;

  aadhaarNumber?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;

  panNumber?: string;
  panCardUrl?: string;

  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankProofUrl?: string;

  remarks?: string;

  createdByName?: string;
  createdAt?: string;
};

type ContractorAssignment = {
  id: number;
  projectId: number;
  contractorId: number;
  contractorName?: string;
  contractorPhone?: string;
  workScope?: string;

  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;

  amount?: number;
  status?: string;
  remarks?: string;
  assignedByName?: string;
  createdAt?: string;
};

type CleaningAssignment = {
  id: number;
  projectId: number;
  contractorId: number;
  contractorName?: string;
  contractorPhone?: string;
  cleaningDate?: string;
  cleaningTime?: string;
  status?: string;
  remarks?: string;
  completionRemarks?: string;
  proofUrl?: string;
  proofLatitude?: string;
  proofLongitude?: string;
  proofGpsAddress?: string;
  completedAt?: string;
  assignedByName?: string;
  createdAt?: string;
  project?: any;
};

type ContractorProof = {
  id: number;
  assignmentId: number;
  proofType?: string;
  fileUrl?: string;
  latitude?: string;
  longitude?: string;
  gpsAddress?: string;
  remarks?: string;
  uploadedByName?: string;
  createdAt?: string;
};

type ContractorComment = {
  id: number;
  projectId: number;
  assignmentId: number;
  comment?: string;
  commentType?: string;
  createdByName?: string;
  createdByRole?: string;
  createdAt?: string;
};

type ProjectContractorMaster = {
  id: number;
  contractorName?: string;
  phone?: string;
  alternatePhone?: string;
  city?: string;
  address?: string;
  linkedUserId?: number;
  remarks?: string;
  isActive?: boolean;
};

type CustomerMaster = {
  id: number;
  customerCode?: string;
  customerName?: string;
  mobile?: string;
  email?: string;
  electricityKNumber?: string;
  address?: string;
  city?: string;
  zone?: string;
  branchName?: string;
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

const CONTRACTOR_WORK_SCOPE_OPTIONS = [
  {
    value: 'FULL_PROJECT',
    label: 'Full Project Contractor',
    description: 'Handles structure, electrical, installation and all final proofs.',
  },
  {
    value: 'STRUCTURE_TEAM',
    label: 'Structure Team',
    description: 'Handles only structure and pillar related work proofs.',
  },
  {
    value: 'ELECTRICAL_TEAM',
    label: 'Electrical Team',
    description: 'Handles inverter, meter, wiring and earthing related proofs.',
  },
  {
    value: 'INSTALLATION_TEAM',
    label: 'Installation Team',
    description: 'Handles panel serial, panel with client and installation proofs.',
  },
  {
    value: 'OTHER',
    label: 'Other Work',
    description: 'For special work not covered in above categories.',
  },
];

const CONTRACTOR_REQUIRED_PROOFS_BY_SCOPE: Record<string, string[]> = {
  FULL_PROJECT: [
    'STRUCTURE_PHOTO',
    'PILLAR_PHOTO',
    'PANEL_SERIAL_NUMBER_PHOTO',
    'INVERTER_PHOTO',
    'SOLAR_METER_PHOTO',
    'NET_METER_PHOTO',
    'EARTHING_WITH_CLIENT_PHOTO',
    'PANEL_WITH_CLIENT_PHOTO',
  ],
  STRUCTURE_TEAM: [
    'STRUCTURE_PHOTO',
    'PILLAR_PHOTO',
    'PANEL_WITH_CLIENT_PHOTO',
  ],
  ELECTRICAL_TEAM: [
    'INVERTER_PHOTO',
    'SOLAR_METER_PHOTO',
    'NET_METER_PHOTO',
    'EARTHING_WITH_CLIENT_PHOTO',
  ],
  INSTALLATION_TEAM: [
    'PANEL_SERIAL_NUMBER_PHOTO',
    'PANEL_WITH_CLIENT_PHOTO',
    'INVERTER_PHOTO',
  ],
  OTHER: ['OTHER'],
};

const formatContractorLabel = (value?: string) =>
  String(value || 'FULL_PROJECT').replaceAll('_', ' ');

const getContractorProofProgress = (
  workScope: string | undefined,
  uploadedProofs: ContractorProof[],
) => {
  const requiredProofs =
    CONTRACTOR_REQUIRED_PROOFS_BY_SCOPE[
      workScope || 'FULL_PROJECT'
    ] || [];

  const uploadedRequiredCount = requiredProofs.filter(
    (requiredProof) =>
      uploadedProofs.some(
        (proof) => proof.proofType === requiredProof,
      ),
  ).length;

  const totalRequired = requiredProofs.length;

  const percentage =
    totalRequired > 0
      ? Math.round(
          (uploadedRequiredCount / totalRequired) * 100,
        )
      : 0;

  return {
    uploadedRequiredCount,
    totalRequired,
    percentage,
  };
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;

    const pdfRef = useRef<HTMLDivElement | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
  const [contractorAssignments, setContractorAssignments] =
  useState<ContractorAssignment[]>([]);
  const [contractorProofs, setContractorProofs] =
  useState<Record<number, ContractorProof[]>>({});
  const [contractorComments, setContractorComments] =
  useState<Record<number, ContractorComment[]>>({});

const [contractorCommentText, setContractorCommentText] =
  useState<Record<number, string>>({});

const [contractorCommentLoadingId, setContractorCommentLoadingId] =
  useState<number | null>(null);
  const [contractors, setContractors] =
  useState<ProjectContractorMaster[]>([]);

const [contractorLoading, setContractorLoading] = useState(false);
const [updatingContractorAssignmentId, setUpdatingContractorAssignmentId] =
  useState<number | null>(null);

const [contractorForm, setContractorForm] = useState({
  contractorMasterId: '',
  contractorId: '',
  contractorName: '',
  contractorPhone: '',
  workScope: 'FULL_PROJECT',
  scheduledDate: '',
  amount: '',
  remarks: '',
});

const [cleaningAssignments, setCleaningAssignments] =
  useState<CleaningAssignment[]>([]);

const [todayCleaning, setTodayCleaning] =
  useState<CleaningAssignment[]>([]);

const [overdueCleaning, setOverdueCleaning] =
  useState<CleaningAssignment[]>([]);

const [upcomingCleaning, setUpcomingCleaning] =
  useState<CleaningAssignment[]>([]);

const [selectedCleaningDate, setSelectedCleaningDate] =
  useState<Dayjs | null>(null);

const [selectedDateCleaning, setSelectedDateCleaning] =
  useState<CleaningAssignment[]>([]);

const [cleaningLoading, setCleaningLoading] = useState(false);

const [cleaningForm, setCleaningForm] = useState({
  contractorMasterId: '',
  contractorId: '',
  contractorName: '',
  contractorPhone: '',
  cleaningDate: '',
  cleaningTime: '',
  remarks: '',
});

const [pendingRescheduleRequests, setPendingRescheduleRequests] =
  useState<any[]>([]);

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
  requiresCoApplicant: false,
  coApplicantReason: '',
  marginMoney: '',
  sanctionAmount: '',
  firstEmiDisbursementAmount: '',
  firstEmiDisbursementDate: '',
  status: 'DOCUMENT_PENDING',
  remarks: '',
});

const [loanLoading, setLoanLoading] = useState(false);

const [loanComments, setLoanComments] = useState<ProjectComment[]>([]);
const [loanCoApplicants, setLoanCoApplicants] =
  useState<LoanCoApplicant[]>([]);

const [loanCoApplicantLoading, setLoanCoApplicantLoading] =
  useState(false);

  const [loanCoApplicantUploadFiles, setLoanCoApplicantUploadFiles] =
  useState<Record<string, File | null>>({});

const [loanCoApplicantUploadingKey, setLoanCoApplicantUploadingKey] =
  useState<string | null>(null);

  const [editingLoanCoApplicantId, setEditingLoanCoApplicantId] =
  useState<number | null>(null);

const [loanCoApplicantEditForm, setLoanCoApplicantEditForm] =
  useState({
    fullName: '',
    relationWithCustomer: '',
    mobileNumber: '',

    aadhaarNumber: '',
    panNumber: '',

    bankName: '',
    accountNumber: '',
    ifscCode: '',

    remarks: '',
  });

const [loanCoApplicantEditLoading, setLoanCoApplicantEditLoading] =
  useState(false);

const [deletingLoanCoApplicantId, setDeletingLoanCoApplicantId] =
  useState<number | null>(null);

const [loanCoApplicantForm, setLoanCoApplicantForm] =
  useState({
    fullName: '',
    relationWithCustomer: '',
    mobileNumber: '',

    aadhaarNumber: '',
    aadhaarFrontUrl: '',
    aadhaarBackUrl: '',

    panNumber: '',
    panCardUrl: '',

    bankName: '',
    accountNumber: '',
    ifscCode: '',
    bankProofUrl: '',

    remarks: '',
  });
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
const [projectManagerApprovalLoading, setProjectManagerApprovalLoading] =
  useState(false);

const [projectManagerApprovalNote, setProjectManagerApprovalNote] =
  useState('');

const [proofFiles, setProofFiles] =
  useState<Record<number, File[]>>({});

const [proofUploadingId, setProofUploadingId] =
  useState<number | null>(null);

  const [projectEditHistory, setProjectEditHistory] =
  useState<ProjectEditHistory[]>([]);

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

  const [editingInstallmentId, setEditingInstallmentId] =
  useState<number | null>(null);

const [editingPaymentId, setEditingPaymentId] =
  useState<number | null>(null);

const [installmentEditForm, setInstallmentEditForm] =
  useState({
    label: '',
    amount: '',
    dueDate: '',
    remarks: '',
  });

const [paymentEditForm, setPaymentEditForm] =
  useState({
    paidAmount: '',
    paymentMode: '',
    transactionId: '',
    paidDate: '',
    remarks: '',
  });

const [savingPaymentEdit, setSavingPaymentEdit] =
  useState(false);

  const [projectAccountsSummary, setProjectAccountsSummary] =
  useState({
    customerInvoice: 0,
    customerPayments: 0,
    customerOutstanding: 0,

    vendorPoAmount: 0,
    vendorPayments: 0,
    vendorOutstanding: 0,

    netProjectPosition: 0,
  });

  const [showEditModal, setShowEditModal] =
  useState(false);

const [editLoading, setEditLoading] =
  useState(false);

  const [customerSearch, setCustomerSearch] = useState('');
const [customerResults, setCustomerResults] = useState<CustomerMaster[]>([]);

const [editForm, setEditForm] = useState({
  customerId: '',
customerCode: '',
  customerName: '',
  customerPhone: '',
  city: '',
  zone: '',
  address: '',
  gpsAddress: '',
  gpsLatitude: '',
  gpsLongitude: '',

  branchName: '',
  projectOwnerId: '',
  projectOwnerName: '',
  projectOwnerRole: '',

  electricityKNumber: '',
  customerGmail: '',
  customerUserId: '',
customerUserName: '',
  aadhaarLinkedMobile: '',

  panelBrand: '',
  dcrPanelCount: '',
  nonDcrPanelCount: '',
  converterBrand: '',
  converterCapacity: '',
  converterPhase: '',
  structureType: '',
  structureCapacityKw: '',
  buildingHeight: '',

  projectType: '',
  projectSize: '',
  finalCost: '',
  projectCost: '',
  subsidy: '',
  netAmount: '',
  marginMoney: '',
  loanAmount: '',
  subsidyType: '',
  discomName: '',
  discomExpenditureType: '',
  discomExpenditureAmount: '',
  expectedLagat: '',
  expectedProfit: '',

  status: '',
  paymentStatus: '',
  startDate: '',
  expectedCompletionDate: '',
  actualCompletionDate: '',

  remarks: '',
});

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

  const searchCustomers = async (value: string) => {
  setCustomerSearch(value);

  if (value.trim().length < 2) {
    setCustomerResults([]);
    return;
  }

  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/customers/search`,
      {
        params: { query: value },
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      },
    );

    setCustomerResults(res.data || []);
  } catch (error) {
    console.error('Failed to search customers', error);
  }
};

const selectCustomer = (customer: CustomerMaster) => {
  setEditForm((prev) => ({
    ...prev,
    customerId: String(customer.id || ''),
    customerCode: customer.customerCode || '',
    customerName: customer.customerName || prev.customerName,
    customerPhone: customer.mobile || prev.customerPhone,
    customerGmail: customer.email || prev.customerGmail,
    electricityKNumber:
      customer.electricityKNumber || prev.electricityKNumber,
    city: customer.city || prev.city,
    zone: customer.zone || prev.zone,
    address: customer.address || prev.address,
    branchName: customer.branchName || prev.branchName,
  }));

  setCustomerSearch(
    `${customer.customerCode || ''} ${customer.customerName || ''}`.trim(),
  );
  setCustomerResults([]);
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

    for (const file of selectedFiles) {
  const uploadFile = await compressImageFile(file);
  formData.append('files', uploadFile);
}

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

const formatDateForInput = (value?: string) => {
  if (!value) return '';
  return value.split('T')[0] || '';
};

const openEditProject = () => {
  if (!project) return;

  setEditForm({
    customerId: String((project as any).customerId || ''),
customerCode: (project as any).customerCode || '',
customerName: project.customerName || '',
customerPhone: project.customerPhone || '',
    city: project.city || '',
    zone: project.zone || '',
    address: project.address || '',
    gpsAddress: project.gpsAddress || '',
    gpsLatitude: String(project.gpsLatitude || ''),
    gpsLongitude: String(project.gpsLongitude || ''),

    branchName: project.branchName || '',
    projectOwnerId: String((project as any).projectOwnerId || ''),
    projectOwnerName: project.projectOwnerName || '',
    projectOwnerRole: project.projectOwnerRole || '',

    electricityKNumber: project.electricityKNumber || '',
    customerGmail: project.customerGmail || '',
    customerUserId: String((project as any).customerUserId || ''),
customerUserName: (project as any).customerUserName || '',
    aadhaarLinkedMobile: project.aadhaarLinkedMobile || '',

    panelBrand: project.panelBrand || '',
    dcrPanelCount: String(project.dcrPanelCount || ''),
    nonDcrPanelCount: String(project.nonDcrPanelCount || ''),
    converterBrand: project.converterBrand || '',
    converterCapacity: project.converterCapacity || '',
    converterPhase: project.converterPhase || '',
    structureType: project.structureType || '',
    structureCapacityKw: project.structureCapacityKw || '',
    buildingHeight: project.buildingHeight || '',

    projectType: project.projectType || '',
    projectSize: (project as any).projectSize || '',
    finalCost: String(project.finalCost || ''),
    projectCost: String(project.projectCost || ''),
    subsidy: String((project as any).subsidy || ''),
    netAmount: String((project as any).netAmount || ''),
    marginMoney: String((project as any).marginMoney || ''),
    loanAmount: String((project as any).loanAmount || ''),
    subsidyType: (project as any).subsidyType || '',
    discomName: project.discomName || '',
    discomExpenditureType: (project as any).discomExpenditureType || '',
    discomExpenditureAmount: String((project as any).discomExpenditureAmount || ''),
    expectedLagat: String((project as any).expectedLagat || ''),
    expectedProfit: String((project as any).expectedProfit || ''),

    status: project.status || '',
    paymentStatus: (project as any).paymentStatus || '',
    startDate: formatDateForInput((project as any).startDate),
    expectedCompletionDate: formatDateForInput((project as any).expectedCompletionDate),
    actualCompletionDate: formatDateForInput((project as any).actualCompletionDate),

    remarks: project.remarks || '',
  });

  setCustomerSearch(
  (project as any).customerCode
    ? `${(project as any).customerCode} ${project.customerName || ''}`
    : '',
);
setCustomerResults([]);

  setShowEditModal(true);
};

const saveEditProject = async () => {
  if (!project?.id) return;

  try {
    setEditLoading(true);

    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/${project.id}`,
      editForm,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Project updated successfully');

    setShowEditModal(false);

    fetchProject();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to update project',
    );
  } finally {
    setEditLoading(false);
  }
};

const handleProjectManagerApproval = async (
  status: 'APPROVED' | 'REJECTED',
) => {
  if (!project?.id) return;

  try {
    setProjectManagerApprovalLoading(true);

    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/${project.id}/project-manager-approval`,
      {
        status,
        note: projectManagerApprovalNote,
      },
      {
  headers: token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {},
},
    );

    await fetchProject();

    alert(`Project ${status.toLowerCase()} successfully`);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to update approval',
    );
  } finally {
    setProjectManagerApprovalLoading(false);
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
          requiresCoApplicant:
  res.data.requiresCoApplicant === true,
coApplicantReason:
  res.data.coApplicantReason || '',
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

const fetchLoanCoApplicants = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/${projectId}/loan-co-applicants`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setLoanCoApplicants(
      Array.isArray(res.data) ? res.data : [],
    );
  } catch (error) {
    console.error(
      'Failed to load loan co-applicants:',
      error,
    );
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

const saveLoanCoApplicant = async () => {
  if (!loanCoApplicantForm.fullName.trim()) {
    alert('Please enter co-applicant name');
    return;
  }

  try {
    setLoanCoApplicantLoading(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/${projectId}/loan-co-applicants`,
      loanCoApplicantForm,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Co-applicant added successfully');

    setLoanCoApplicantForm({
      fullName: '',
      relationWithCustomer: '',
      mobileNumber: '',

      aadhaarNumber: '',
      aadhaarFrontUrl: '',
      aadhaarBackUrl: '',

      panNumber: '',
      panCardUrl: '',

      bankName: '',
      accountNumber: '',
      ifscCode: '',
      bankProofUrl: '',

      remarks: '',
    });

    fetchLoanCoApplicants();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to save co-applicant',
    );
  } finally {
    setLoanCoApplicantLoading(false);
  }
};

const uploadLoanCoApplicantDocument = async (
  coApplicantId: number,
  fieldName:
    | 'aadhaarFrontUrl'
    | 'aadhaarBackUrl'
    | 'panCardUrl'
    | 'bankProofUrl',
  label: string,
) => {
  const key = `${coApplicantId}-${fieldName}`;
  const file = loanCoApplicantUploadFiles[key];

  if (!file) {
    alert(`Please select ${label}`);
    return;
  }

  try {
    setLoanCoApplicantUploadingKey(key);

    const token = localStorage.getItem('token');

    const formData = new FormData();
    const uploadFile = await compressImageFile(file);

    formData.append('files', uploadFile);
    formData.append('projectId', String(projectId));
    formData.append('department', 'LOAN');
    formData.append('documentType', `CO_APPLICANT_${fieldName}`);
    formData.append('remarks', `Co-applicant ${label}`);

    const uploadRes = await axios.post(
      `${API_BASE_URL}/project/documents/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    const fileUrl =
      uploadRes.data?.documents?.[0]?.fileUrl ||
      uploadRes.data?.document?.fileUrl ||
      uploadRes.data?.fileUrl ||
      '';

    if (!fileUrl) {
      throw new Error('File uploaded but URL not received');
    }

    await axios.patch(
      `${API_BASE_URL}/project/loan-co-applicants/${coApplicantId}`,
      {
        [fieldName]: fileUrl,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert(`${label} uploaded successfully`);

    setLoanCoApplicantUploadFiles((prev) => ({
      ...prev,
      [key]: null,
    }));

    fetchLoanCoApplicants();
    fetchDocuments();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        `Failed to upload ${label}`,
    );
  } finally {
    setLoanCoApplicantUploadingKey(null);
  }
};

const startEditLoanCoApplicant = (item: LoanCoApplicant) => {
  setEditingLoanCoApplicantId(item.id);

  setLoanCoApplicantEditForm({
    fullName: item.fullName || '',
    relationWithCustomer:
      item.relationWithCustomer || '',
    mobileNumber: item.mobileNumber || '',

    aadhaarNumber: item.aadhaarNumber || '',
    panNumber: item.panNumber || '',

    bankName: item.bankName || '',
    accountNumber: item.accountNumber || '',
    ifscCode: item.ifscCode || '',

    remarks: item.remarks || '',
  });
};

const cancelEditLoanCoApplicant = () => {
  setEditingLoanCoApplicantId(null);

  setLoanCoApplicantEditForm({
    fullName: '',
    relationWithCustomer: '',
    mobileNumber: '',

    aadhaarNumber: '',
    panNumber: '',

    bankName: '',
    accountNumber: '',
    ifscCode: '',

    remarks: '',
  });
};

const updateLoanCoApplicant = async () => {
  if (!editingLoanCoApplicantId) return;

  if (!loanCoApplicantEditForm.fullName.trim()) {
    alert('Please enter co-applicant name');
    return;
  }

  try {
    setLoanCoApplicantEditLoading(true);

    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/loan-co-applicants/${editingLoanCoApplicantId}`,
      loanCoApplicantEditForm,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Co-applicant updated successfully');

    cancelEditLoanCoApplicant();
    fetchLoanCoApplicants();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to update co-applicant',
    );
  } finally {
    setLoanCoApplicantEditLoading(false);
  }
};

const deleteLoanCoApplicant = async (id: number) => {
  const confirmed = window.confirm(
    'Remove this co-applicant from Loan Department?',
  );

  if (!confirmed) return;

  try {
    setDeletingLoanCoApplicantId(id);

    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/loan-co-applicants/${id}/delete`,
      {},
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Co-applicant removed successfully');

    fetchLoanCoApplicants();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to remove co-applicant',
    );
  } finally {
    setDeletingLoanCoApplicantId(null);
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

const fetchProjectEditHistory = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/${projectId}/edit-history`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setProjectEditHistory(res.data || []);
  } catch (error) {
    console.error(
      'Failed to load project history:',
      error,
    );
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

const fetchProjectAccountsSummary =
  async () => {
    try {
      const token =
        localStorage.getItem('token');

      const res = await axios.get(
        `${API_BASE_URL}/project/${projectId}/accounts-summary`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      setProjectAccountsSummary(
        res.data || {},
      );
    } catch (error) {
      console.error(error);
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

const startEditInstallment = (item: PaymentInstallment) => {
  setEditingInstallmentId(item.id);
  setEditingPaymentId(null);

  setInstallmentEditForm({
    label: item.label || 'FIRST_PAYMENT',
    amount: String(item.amount || ''),
    dueDate: item.dueDate
      ? item.dueDate.split('T')[0]
      : '',
    remarks: item.remarks || '',
  });
};

const saveInstallmentEdit = async (installmentId: number) => {
  try {
    setSavingPaymentEdit(true);

    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/payment-collection/installments/${installmentId}/edit-installment`,
      installmentEditForm,
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      },
    );

    alert('Installment updated successfully');

    setEditingInstallmentId(null);
    fetchPaymentInstallments();
    fetchProjectAccountsSummary();
  } catch (error: any) {
    console.error(error);
    alert(
      error?.response?.data?.message ||
        'Failed to update installment',
    );
  } finally {
    setSavingPaymentEdit(false);
  }
};

const startEditPayment = (item: PaymentInstallment) => {
  setEditingPaymentId(item.id);
  setEditingInstallmentId(null);

  setPaymentEditForm({
    paidAmount: String(item.paidAmount || ''),
    paymentMode: item.paymentMode || '',
    transactionId: item.transactionId || '',
    paidDate: item.paidDate
      ? item.paidDate.split('T')[0]
      : '',
    remarks: item.remarks || '',
  });
};

const savePaymentEdit = async (installmentId: number) => {
  try {
    setSavingPaymentEdit(true);

    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/payment-collection/installments/${installmentId}/edit-payment`,
      paymentEditForm,
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      },
    );

    alert('Payment entry updated successfully');

    setEditingPaymentId(null);
    fetchPaymentInstallments();
    fetchProjectAccountsSummary();
  } catch (error: any) {
    console.error(error);
    alert(
      error?.response?.data?.message ||
        'Failed to update payment entry',
    );
  } finally {
    setSavingPaymentEdit(false);
  }
};

const approvePayment = async (installmentId: number) => {
  try {
    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/payment-collection/installments/${installmentId}/approve`,
      {
        approvalNote: 'Approved from project payment collection',
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Payment approved successfully');

    fetchPaymentInstallments();
    fetchProjectAccountsSummary();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to approve payment',
    );
  }
};

const rejectPayment = async (installmentId: number) => {
  const reason = window.prompt(
    'Reason for rejecting this payment?',
    'Incorrect / unverified payment',
  );

  if (reason === null) return;

  try {
    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/payment-collection/installments/${installmentId}/reject`,
      {
        approvalNote: reason,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Payment rejected successfully');

    fetchPaymentInstallments();
    fetchProjectAccountsSummary();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to reject payment',
    );
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

const fetchContractorAssignments = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/${projectId}/contractor-assignments`,
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      },
    );

    const assignments = Array.isArray(res.data)
      ? res.data
      : [];

    setContractorAssignments(assignments);

    assignments.forEach((item: ContractorAssignment) => {
      if (item?.id) {
        fetchContractorProofs(item.id);
        fetchContractorComments(item.id);
      }
    });
  } catch (error) {
    console.error('Failed to load contractor assignments:', error);
  }
};

const fetchContractorProofs = async (
  assignmentId: number,
) => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/contractor-assignment/${assignmentId}/proofs`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setContractorProofs((prev) => ({
      ...prev,
      [assignmentId]: Array.isArray(res.data)
        ? res.data
        : [],
    }));
  } catch (error) {
    console.error(
      'Failed to load contractor proofs:',
      error,
    );
  }
};

const fetchContractorComments = async (
  assignmentId: number,
) => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/contractor-assignment/${assignmentId}/comments`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setContractorComments((prev) => ({
      ...prev,
      [assignmentId]: Array.isArray(res.data)
        ? res.data
        : [],
    }));
  } catch (error) {
    console.error(
      'Failed to load contractor comments:',
      error,
    );
  }
};

const submitContractorComment = async (
  item: ContractorAssignment,
  commentType = 'GENERAL',
) => {
  const text = String(
    contractorCommentText[item.id] || '',
  ).trim();

  if (!text) {
    alert('Please write comment');
    return;
  }

  try {
    setContractorCommentLoadingId(item.id);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/contractor-comment`,
      {
        projectId: item.projectId,
        assignmentId: item.id,
        comment: text,
        commentType,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setContractorCommentText((prev) => ({
      ...prev,
      [item.id]: '',
    }));

    fetchContractorComments(item.id);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to add contractor comment',
    );
  } finally {
    setContractorCommentLoadingId(null);
  }
};

const fetchContractors = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/contractor-master`,
      {
        params: {
          activeOnly: true,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setContractors(
      Array.isArray(res.data) ? res.data : [],
    );
  } catch (error) {
    console.error('Failed to load contractors:', error);
  }
};

const selectContractor = (contractorId: string) => {
  const selected = contractors.find(
    (item) => String(item.id) === contractorId,
  );

  if (!selected) {
    return;
  }

  setContractorForm((prev) => ({
    ...prev,
    contractorMasterId: contractorId,
    contractorId: String(
      selected.linkedUserId || '',
    ),
    contractorName:
      selected.contractorName || '',
    contractorPhone: selected.phone || '',
  }));
};

const assignContractor = async () => {
  if (!contractorForm.contractorId) {
    alert('Please enter contractor user ID');
    return;
  }

  if (!contractorForm.contractorName.trim()) {
    alert('Please enter contractor name');
    return;
  }

  try {
    setContractorLoading(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/contractor/assign`,
      {
        projectId: Number(projectId),
        contractorId: Number(contractorForm.contractorId),
        contractorName: contractorForm.contractorName,
        contractorPhone: contractorForm.contractorPhone,
workScope: contractorForm.workScope || 'FULL_PROJECT',
scheduledDate: contractorForm.scheduledDate || undefined,
        amount: contractorForm.amount || 0,
        remarks: contractorForm.remarks,
      },
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      },
    );

    alert('Contractor assigned successfully');

    setContractorForm({
  contractorMasterId: '',
  contractorId: '',
  contractorName: '',
  contractorPhone: '',
  workScope: 'FULL_PROJECT',
  scheduledDate: '',
  amount: '',
  remarks: '',
});

    fetchContractorAssignments();
  } catch (error: any) {
    console.error(error);
    alert(
      error?.response?.data?.message ||
        'Failed to assign contractor',
    );
  } finally {
    setContractorLoading(false);
  }
};

const selectCleaningContractor = (contractorId: string) => {
  const selected = contractors.find(
    (item) => String(item.id) === contractorId,
  );

  if (!selected) return;

  setCleaningForm((prev) => ({
    ...prev,
    contractorMasterId: contractorId,
    contractorId: String(selected.linkedUserId || ''),
    contractorName: selected.contractorName || '',
    contractorPhone: selected.phone || '',
  }));
};

const fetchCleaningAssignments = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/${projectId}/cleaning-assignments`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    setCleaningAssignments(Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.error('Failed to load cleaning assignments:', error);
  }
};

const assignCleaning = async () => {
  if (!cleaningForm.contractorId) {
    alert('Please select contractor');
    return;
  }

  if (!cleaningForm.cleaningDate) {
    alert('Please select cleaning date');
    return;
  }

  try {
    setCleaningLoading(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/cleaning/assign`,
      {
        projectId: Number(projectId),
        contractorId: Number(cleaningForm.contractorId),
        contractorName: cleaningForm.contractorName,
        contractorPhone: cleaningForm.contractorPhone,
        cleaningDate: cleaningForm.cleaningDate,
        cleaningTime: cleaningForm.cleaningTime,
        remarks: cleaningForm.remarks,
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    alert('Cleaning assigned successfully');

    setCleaningForm({
      contractorMasterId: '',
      contractorId: '',
      contractorName: '',
      contractorPhone: '',
      cleaningDate: '',
      cleaningTime: '',
      remarks: '',
    });

    fetchCleaningAssignments();
    fetchCleaningReminders('TODAY');
    fetchCleaningReminders('OVERDUE');
    fetchCleaningReminders('UPCOMING');
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to assign cleaning');
  } finally {
    setCleaningLoading(false);
  }
};

const fetchCleaningReminders = async (
  type: 'TODAY' | 'OVERDUE' | 'UPCOMING',
) => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/cleaning/reminders`,
      {
        params: { type },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    const data = Array.isArray(res.data) ? res.data : [];

    if (type === 'TODAY') setTodayCleaning(data);
    if (type === 'OVERDUE') setOverdueCleaning(data);
    if (type === 'UPCOMING') setUpcomingCleaning(data);
  } catch (error) {
    console.error('Failed to load cleaning reminders:', error);
  }
};

const fetchCleaningByDate = async (date: Dayjs | null) => {
  if (!date) return;

  setSelectedCleaningDate(date);

  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/cleaning/by-date`,
      {
        params: { date: date.format('YYYY-MM-DD') },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    setSelectedDateCleaning(Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.error('Failed to load cleaning by date:', error);
    setSelectedDateCleaning([]);
  }
};

const hideCleaningAssignment = async (id: number) => {
  const confirmed = window.confirm('Hide this cleaning assignment?');

  if (!confirmed) return;

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/cleaning/${id}/hide`,
      {},
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    alert('Cleaning assignment hidden');

    fetchCleaningAssignments();
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to hide cleaning');
  }
};

const fetchPendingRescheduleRequests = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/contractor-reschedule/pending`,
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      },
    );

    setPendingRescheduleRequests(
      Array.isArray(res.data) ? res.data : [],
    );
  } catch (error) {
    console.error(error);
  }
};

const approveRescheduleRequest = async (id: number) => {
  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/contractor-reschedule/${id}/approve`,
      {},
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      },
    );

    alert('Request approved');

    fetchPendingRescheduleRequests();
    fetchProject();
  } catch (error: any) {
    alert(
      error?.response?.data?.message ||
        'Failed to approve request',
    );
  }
};

const rejectRescheduleRequest = async (id: number) => {
  const approvalNote =
    prompt('Reason for rejection') || '';

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/contractor-reschedule/${id}/reject`,
      {
        approvalNote,
      },
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      },
    );

    alert('Request rejected');

    fetchPendingRescheduleRequests();
  } catch (error: any) {
    alert(
      error?.response?.data?.message ||
        'Failed to reject request',
    );
  }
};

const updateContractorAssignment = async (
  assignmentId: number,
  status: string,
  remarks?: string,
) => {
  try {
    setUpdatingContractorAssignmentId(assignmentId);

    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/contractor-assignment/${assignmentId}`,
      {
        status,
        remarks,
      },
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      },
    );

    alert('Contractor work updated');

    fetchContractorAssignments();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to update contractor work',
    );
  } finally {
    setUpdatingContractorAssignmentId(null);
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

const canEditProject = hasRole([
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
]);

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
  'PROJECT_EXECUTIVE',
  'MEETING_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
]);

const canApprovePayment = hasRole([
  'OWNER',
  'ACCOUNT_MANAGER',
  'PAYMENT_MANAGER',
]);

const canEditPaymentAsOwner = hasRole(['OWNER']);

const canManageMaterial = hasRole([
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'MEETING_MANAGER',
]);

const canShareProjectPdf = hasRole([
  'OWNER',
  'PROJECT_MANAGER',
]);

const canManageContractor = hasRole([
  'OWNER',
  'PROJECT_MANAGER',
  'CUSTOMER_MANAGER',
]);

  useEffect(() => {
  if (projectId) {
    fetchProject();
  }
}, [projectId]);

useEffect(() => {
  if (!projectId) return;

  if (activeTab === 'LOAN_DEPARTMENT') {
  fetchLoanDetail();
  fetchLoanComments();
  fetchLoanCoApplicants();
}

  if (activeTab === 'DOCUMENTS') {
    fetchDocuments();
  }

  if (activeTab === 'PROJECT_MANAGEMENT') {
    fetchMaterials();
    fetchMaterialRequests();
  }

  if (activeTab === 'SUBSIDY_DEPARTMENT') {
    fetchSubsidyDetail();
  }

  if (activeTab === 'ELECTRICITY_DEPARTMENT') {
    fetchElectricityDetail();
  }

  if (activeTab === 'PROJECT_EXECUTION') {
    fetchExecutionActivities();
  }

  if (activeTab === 'PAYMENT_COLLECTION') {
    fetchPaymentInstallments();
    fetchProjectAccountsSummary();
  }

  if (activeTab === 'PROJECT_HISTORY') {
    fetchProjectEditHistory();
  }

    if (activeTab === 'CONTRACTOR_WORK') {
  fetchContractorAssignments();
  fetchContractors();
  fetchCleaningAssignments();
fetchCleaningReminders('TODAY');
fetchCleaningReminders('OVERDUE');
fetchCleaningReminders('UPCOMING');
fetchPendingRescheduleRequests();

  setTimeout(() => {
  contractorAssignments.forEach((item) => {
    if (item?.id) {
      fetchContractorProofs(item.id);
    }
  });
}, 500);

}

}, [activeTab, projectId]);

const generateProjectPdf = async (share = false) => {
  if (!pdfRef.current || !project) return;

  try {
    setGeneratingPdf(true);

    await fetchDocuments();
    await fetchMaterialRequests();
    await fetchExecutionActivities();
    await fetchPaymentInstallments();
    await fetchProjectEditHistory();
    await fetchLoanDetail();
    await fetchSubsidyDetail();
    await fetchElectricityDetail();

    await new Promise((resolve) => setTimeout(resolve, 500));

    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    const pdf = new jsPDF('p', 'mm', 'a4');

    const pages = Array.from(
  pdfRef.current.querySelectorAll('.project-pdf-page.top-project-summary'),
) as HTMLElement[];

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
  scale: 2,
  useCORS: true,
  allowTaint: true,
  backgroundColor: '#ffffff',
  logging: false,
  onclone: (doc) => {
    const style = doc.createElement('style');
    style.innerHTML = `
      * {
        color: #111827 !important;
        background-color: #ffffff !important;
        border-color: #d1d5db !important;
        box-shadow: none !important;
        text-shadow: none !important;
      }

      .project-pdf-page {
        background: #ffffff !important;
      }
    `;
    doc.head.appendChild(style);
  },
});

      const data = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) pdf.addPage();

      pdf.addImage(data, 'JPEG', 0, 0, 210, 297);
    }

    const fileName = `Project-${project.id}-${project.customerName || 'Details'}.pdf`;

    if (!share) {
      pdf.save(fileName);
      return;
    }

    const base64 = pdf.output('datauristring').split(',')[1];

    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');

      const saved = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });

      await Share.share({
        title: 'Project Details',
        text: `Project details for ${project.customerName || `Project #${project.id}`}`,
        url: saved.uri,
        dialogTitle: 'Share Project PDF',
      });
    } catch {
      pdf.save(fileName);
    }
  } catch (error) {
    console.error(error);
    alert('Failed to generate project PDF');
  } finally {
    setGeneratingPdf(false);
  }
};

  if (loading) {
    return <div className="rounded-2xl bg-white p-5 shadow">Loading project...</div>;
  }

  if (!project) {
    return <div className="rounded-2xl bg-white p-5 shadow">Project not found.</div>;
  }

  const totalInstallmentAmount =
  paymentInstallments.reduce(
    (sum, item) =>
      sum + Number(item.amount || 0),
    0,
  );

const totalCollectedAmount =
  paymentInstallments.reduce(
    (sum, item) =>
      sum + Number(item.paidAmount || 0),
    0,
  );

const projectFinalAmount = Number(
  project.finalCost ||
    project.projectCost ||
    0,
);

const remainingAmountToSchedule =
  projectFinalAmount -
  totalInstallmentAmount;

const remainingAmountToCollect =
  projectFinalAmount -
  totalCollectedAmount;

  const approveAndReserveMaterialRequest = async (
  requestId: number,
) => {
  const confirmed = window.confirm(
    'Approve this material request and reserve stock?',
  );

  if (!confirmed) return;

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/material-requests/${requestId}/approve-stock`,
      {},
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Material request approved and stock reserved');

    await fetchMaterialRequests();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to approve and reserve stock',
    );
  }
};

const canApproveAndReserveStock =
  currentUserRoles.includes('OWNER') ||
  currentUserRoles.includes('PROJECT_MANAGER') ||
  currentUserRoles.includes('ACCOUNT_MANAGER') ||
  currentUserRoles.includes('STOCK_MANAGER');

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

          {activeTab === 'CONTRACTOR_WORK' && (
  <div className="space-y-5">

    {hasRole(['OWNER', 'PROJECT_MANAGER']) && (
  <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
    <h3 className="text-lg font-bold text-gray-800">
      Pending Postpone Requests
    </h3>

    {pendingRescheduleRequests.filter(
      (item) =>
        Number(item.projectId) === Number(project.id),
    ).length === 0 ? (
      <p className="mt-3 text-sm text-gray-500">
        No pending requests.
      </p>
    ) : (
      <div className="mt-4 space-y-3">
        {pendingRescheduleRequests
          .filter(
            (item) =>
              Number(item.projectId) ===
              Number(project.id),
          )
          .map((item) => (
            <div
              key={item.id}
              className="rounded-xl border bg-white p-4"
            >
              <p className="font-semibold text-gray-800">
                {item.contractorName}
              </p>

              <p className="text-sm text-gray-600">
                Type:{' '}
                {String(
                  item.assignmentType || '',
                ).replaceAll('_', ' ')}
              </p>

              <p className="text-sm text-gray-600">
                Old Date: {item.oldDate || '-'}
              </p>

              <p className="text-sm text-gray-600">
                Requested Date:{' '}
                {item.requestedDate || '-'}
              </p>

              <p className="text-sm text-gray-600">
                Reason: {item.reason || '-'}
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() =>
                    approveRescheduleRequest(item.id)
                  }
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Approve
                </button>

                <button
                  onClick={() =>
                    rejectRescheduleRequest(item.id)
                  }
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
      </div>
    )}
  </div>
)}
    {canManageContractor && (
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-xl font-bold text-gray-800">
          Assign Project Contractor
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Assign full project contractor or separate teams like Structure Team, Electrical Team, and Installation Team.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <select
  value={contractorForm.contractorMasterId}
  onChange={(e) =>
    selectContractor(e.target.value)
  }
  className="rounded-xl border p-3"
>
  <option value="">
    Select Contractor
  </option>

  {contractors.map((contractor) => (
    <option
      key={contractor.id}
      value={contractor.id}
    >
      {contractor.contractorName} -{' '}
      {contractor.phone}
    </option>
  ))}
</select>

<input
  value={contractorForm.contractorName}
  readOnly
  className="rounded-xl border bg-gray-100 p-3"
/>

<input
  value={contractorForm.contractorPhone}
  readOnly
  className="rounded-xl border bg-gray-100 p-3"
/>

<select
  value={contractorForm.workScope}
  onChange={(e) =>
    setContractorForm({
      ...contractorForm,
      workScope: e.target.value,
    })
  }
  className="rounded-xl border p-3"
>
  {CONTRACTOR_WORK_SCOPE_OPTIONS.map((scope) => (
    <option key={scope.value} value={scope.value}>
      {scope.label}
    </option>
  ))}
</select>

          <input
            type="date"
            value={contractorForm.scheduledDate}
            onChange={(e) =>
              setContractorForm({
                ...contractorForm,
                scheduledDate: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Work Amount"
            value={contractorForm.amount}
            onChange={(e) =>
              setContractorForm({
                ...contractorForm,
                amount: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Remarks"
            value={contractorForm.remarks}
            onChange={(e) =>
              setContractorForm({
                ...contractorForm,
                remarks: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <div className="md:col-span-3 rounded-xl border bg-blue-50 p-4">
  <p className="text-sm font-bold text-blue-800">
    Selected Scope:{' '}
    {CONTRACTOR_WORK_SCOPE_OPTIONS.find(
      (scope) => scope.value === contractorForm.workScope,
    )?.label || 'Full Project Contractor'}
  </p>

  <p className="mt-1 text-xs text-blue-700">
    {CONTRACTOR_WORK_SCOPE_OPTIONS.find(
      (scope) => scope.value === contractorForm.workScope,
    )?.description}
  </p>

  <div className="mt-3 flex flex-wrap gap-2">
    {(CONTRACTOR_REQUIRED_PROOFS_BY_SCOPE[contractorForm.workScope] || [])
      .map((proofType) => (
        <span
          key={proofType}
          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700"
        >
          {formatContractorLabel(proofType)}
        </span>
      ))}
  </div>
</div>
        </div>

        <button
          onClick={assignContractor}
          disabled={contractorLoading}
          className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {contractorLoading ? 'Assigning...' : 'Assign Contractor'}
        </button>
      </div>
    )}

    <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-5">
  <h2 className="text-xl font-bold text-gray-800">
    Assign Site Cleaning
  </h2>

  <p className="mt-1 text-sm text-gray-600">
    Customer Manager / Owner can assign cleaning work to project contractor with reminder date and wall-clock time.
  </p>

  <div className="mt-5 grid gap-3 md:grid-cols-3">
    <select
      value={cleaningForm.contractorMasterId}
      onChange={(e) => selectCleaningContractor(e.target.value)}
      className="rounded-xl border p-3"
    >
      <option value="">Select Contractor</option>

      {contractors.map((contractor) => (
        <option key={contractor.id} value={contractor.id}>
          {contractor.contractorName} - {contractor.phone}
        </option>
      ))}
    </select>

    <input
      value={cleaningForm.contractorName}
      readOnly
      placeholder="Contractor Name"
      className="rounded-xl border bg-gray-100 p-3"
    />

    <input
      value={cleaningForm.contractorPhone}
      readOnly
      placeholder="Contractor Phone"
      className="rounded-xl border bg-gray-100 p-3"
    />

    <input
      type="date"
      value={cleaningForm.cleaningDate}
      onChange={(e) =>
        setCleaningForm({
          ...cleaningForm,
          cleaningDate: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MobileTimePicker
        label="Cleaning Time"
        ampm
        ampmInClock
        value={
          cleaningForm.cleaningTime
            ? dayjs(`2026-01-01T${cleaningForm.cleaningTime}`)
            : null
        }
        onChange={(newTime) =>
          setCleaningForm({
            ...cleaningForm,
            cleaningTime: newTime ? newTime.format('HH:mm') : '',
          })
        }
        slotProps={{
          textField: {
            fullWidth: true,
          },
        }}
      />
    </LocalizationProvider>

    <input
      placeholder="Cleaning Remarks"
      value={cleaningForm.remarks}
      onChange={(e) =>
        setCleaningForm({
          ...cleaningForm,
          remarks: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />
  </div>

  <button
    onClick={assignCleaning}
    disabled={cleaningLoading}
    className="mt-4 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
  >
    {cleaningLoading ? 'Assigning...' : 'Assign Cleaning'}
  </button>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <h2 className="text-xl font-bold text-gray-800">
    Cleaning Reminder Calendar
  </h2>

  <div className="mt-4 grid gap-4 lg:grid-cols-2">
    <div className="rounded-xl border p-3">
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateCalendar
          value={selectedCleaningDate}
          onChange={(newValue) => fetchCleaningByDate(newValue)}
        />
      </LocalizationProvider>
    </div>

    <div className="rounded-xl border p-4">
      <h3 className="font-bold text-gray-800">
        Selected Date Cleaning
      </h3>

      <CleaningMiniList
  items={selectedDateCleaning.filter(
    (item) => Number(item.projectId) === Number(projectId),
  )}
/>
    </div>
  </div>
</div>

<div className="grid gap-4 xl:grid-cols-3">
  <CleaningPanel
  title="Today's Cleaning"
  items={todayCleaning.filter(
    (item) => Number(item.projectId) === Number(projectId),
  )}
/>

<CleaningPanel
  title="Overdue Cleaning"
  items={overdueCleaning.filter(
    (item) => Number(item.projectId) === Number(projectId),
  )}
/>

<CleaningPanel
  title="Upcoming Cleaning"
  items={upcomingCleaning.filter(
    (item) => Number(item.projectId) === Number(projectId),
  )}
/>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <h2 className="text-xl font-bold text-gray-800">
    Cleaning Assignment History
  </h2>

  <div className="mt-5 space-y-3">
    {cleaningAssignments.length === 0 ? (
      <p className="text-sm text-gray-500">
        No cleaning assigned yet.
      </p>
    ) : (
      cleaningAssignments.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border bg-gray-50 p-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-bold text-gray-800">
                {item.contractorName || `Contractor #${item.contractorId}`}
              </p>

              <p className="text-sm text-gray-500">
                Phone: {item.contractorPhone || '-'}
              </p>

              <p className="mt-1 text-sm text-gray-700">
                Cleaning: {item.cleaningDate || '-'}
                {item.cleaningTime ? ` • ${item.cleaningTime}` : ''}
              </p>

              <p className="mt-1 text-sm text-gray-700">
                Status: {String(item.status || '-').replaceAll('_', ' ')}
              </p>

              {item.remarks && (
                <p className="mt-1 text-sm text-gray-600">
                  {item.remarks}
                </p>
              )}
            </div>

            {canManageContractor && (
              <button
                type="button"
                onClick={() => hideCleaningAssignment(item.id)}
                className="rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700"
              >
                Hide
              </button>
            )}
          </div>
        </div>
      ))
    )}
  </div>
</div>

    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="text-xl font-bold text-gray-800">
        Contractor Assignment History
      </h2>

      <div className="mt-5 space-y-3">
        {contractorAssignments.length === 0 ? (
          <p className="text-sm text-gray-500">
            No contractor assigned yet.
          </p>
        ) : (
          contractorAssignments.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border bg-gray-50 p-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-bold text-gray-800">
                    {item.contractorName || `Contractor #${item.contractorId}`}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
    Scope: {formatContractorLabel(item.workScope)}
  </span>

  <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-gray-700">
    Status: {formatContractorLabel(item.status)}
  </span>
</div>

<div className="mt-3 grid gap-2 text-sm text-gray-600 md:grid-cols-3">
  <p>
    Scheduled:{' '}
    {item.scheduledDate
      ? new Date(item.scheduledDate).toLocaleDateString('en-IN')
      : '-'}
  </p>

  <p>
    Started:{' '}
    {item.startedAt
      ? new Date(item.startedAt).toLocaleString('en-IN')
      : '-'}
  </p>

  <p>
    Completed:{' '}
    {item.completedAt
      ? new Date(item.completedAt).toLocaleString('en-IN')
      : '-'}
  </p>
</div>

{(() => {
  const progress = getContractorProofProgress(
    item.workScope,
    contractorProofs[item.id] || [],
  );

  return (
    <div className="mt-3 rounded-xl border bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-gray-800">
          Proof Progress
        </p>

        <p className="text-sm font-bold text-blue-700">
          {progress.uploadedRequiredCount} / {progress.totalRequired}{' '}
          uploaded ({progress.percentage}%)
        </p>
      </div>

      <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{
            width: `${progress.percentage}%`,
          }}
        />
      </div>
    </div>
  );
})()}

                  <p className="text-sm text-gray-500">
                    Phone: {item.contractorPhone || '-'}
                  </p>

                  <p className="text-sm text-gray-500">
                    Scheduled:{' '}
                    {item.scheduledDate
                      ? new Date(item.scheduledDate).toLocaleDateString('en-IN')
                      : '-'}
                  </p>

                  <p className="text-sm text-gray-500">
                    Assigned By: {item.assignedByName || '-'}
                  </p>

                  {item.remarks && (
                    <p className="mt-2 text-sm text-gray-700">
                      {item.remarks}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                    {item.status || 'ASSIGNED'}
                  </p>

                  <p className="mt-2 text-lg font-bold text-green-700">
                    {money(item.amount)}
                  </p>

                  <div className="mt-3 flex flex-wrap justify-end gap-2">
  {['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'PENDING_FINAL_PROOFS', 'COMPLETED'].map((status) => (
    <button
      key={status}
      onClick={() =>
        updateContractorAssignment(
          item.id,
          status,
          item.remarks || '',
        )
      }
      disabled={updatingContractorAssignmentId === item.id}
      className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50"
    >
      {status.replaceAll('_', ' ')}
    </button>
  ))}
</div>

<div className="mt-5 rounded-xl border bg-white p-4">
  <h4 className="font-bold text-gray-800">
    Scope Based Required Proofs
  </h4>

  <div className="mt-3 flex flex-wrap gap-2">
    {(CONTRACTOR_REQUIRED_PROOFS_BY_SCOPE[item.workScope || 'FULL_PROJECT'] || [])
      .map((proofType) => {
        const uploaded = (contractorProofs[item.id] || []).some(
          (proof) => proof.proofType === proofType,
        );

        return (
          <span
            key={proofType}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              uploaded
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {uploaded ? '✓' : '✗'} {formatContractorLabel(proofType)}
          </span>
        );
      })}
  </div>
</div>

<div className="mt-5">
  <h4 className="font-semibold text-gray-800">
    Contractor Proof Photos
  </h4>

  {(!contractorProofs[item.id] ||
    contractorProofs[item.id].length === 0) ? (
    <p className="mt-2 text-sm text-gray-500">
      No proofs uploaded yet.
    </p>
  ) : (
    <div className="mt-3 grid gap-3 md:grid-cols-3">
      {contractorProofs[item.id].map((proof) => (
        <a
          key={proof.id}
          href={proof.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border bg-white p-3 hover:bg-gray-50"
        >
          {proof.fileUrl && (
            <img
              src={proof.fileUrl}
              alt={proof.proofType || 'Proof'}
              className="h-32 w-full rounded-lg object-cover"
            />
          )}

          <p className="mt-2 text-xs font-semibold text-gray-700">
            {(proof.proofType || 'OTHER').replaceAll(
              '_',
              ' ',
            )}
          </p>

          <p className="text-xs text-gray-500">
            By: {proof.uploadedByName || '-'}
          </p>

          {proof.latitude &&
            proof.longitude && (
              <p className="text-xs text-gray-500">
                GPS: {proof.latitude},{' '}
                {proof.longitude}
              </p>
            )}

          {proof.gpsAddress && (
            <p className="mt-1 text-xs text-gray-500">
              {proof.gpsAddress}
            </p>
          )}
        </a>
      ))}
    </div>
  )}
</div>

<div className="mt-5 rounded-xl border bg-white p-4">
  <h4 className="font-bold text-gray-800">
    Contractor Communication Timeline
  </h4>

  <textarea
    placeholder="Write contractor instruction / review / pending proof reply"
    value={contractorCommentText[item.id] || ''}
    onChange={(e) =>
      setContractorCommentText((prev) => ({
        ...prev,
        [item.id]: e.target.value,
      }))
    }
    className="mt-3 w-full rounded-xl border p-3"
    rows={3}
  />

  <div className="mt-3 flex flex-wrap gap-2">
    <button
      onClick={() =>
        submitContractorComment(
          item,
          'OWNER_PM_REPLY',
        )
      }
      disabled={
        contractorCommentLoadingId === item.id
      }
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
    >
      Add Reply
    </button>
  </div>

  <div className="mt-5 space-y-3">
    {(!contractorComments[item.id] ||
      contractorComments[item.id].length === 0) ? (
      <p className="text-sm text-gray-500">
        No communication yet.
      </p>
    ) : (
      contractorComments[item.id].map(
        (comment) => (
          <div
            key={comment.id}
            className="rounded-xl bg-gray-50 p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-800">
                {comment.createdByName || '-'}
              </p>

              <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700">
                {(
                  comment.commentType ||
                  'GENERAL'
                ).replaceAll('_', ' ')}
              </span>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              {comment.createdByRole || '-'} ·{' '}
              {comment.createdAt
                ? new Date(
                    comment.createdAt,
                  ).toLocaleString('en-IN')
                : '-'}
            </p>

            <p className="mt-2 text-sm text-gray-700">
              {comment.comment}
            </p>
          </div>
        ),
      )
    )}
  </div>
</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
)}

          {canShareProjectPdf && (
  <div className="flex flex-wrap gap-2">
    <button
      onClick={() => generateProjectPdf(false)}
      disabled={generatingPdf}
      className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
    >
      {generatingPdf ? 'Generating...' : 'Download Project PDF'}
    </button>

    <button
      onClick={() => generateProjectPdf(true)}
      disabled={generatingPdf}
      className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
    >
      Share Project PDF
    </button>
  </div>
)}

          {canEditProject && (
  <button
    onClick={openEditProject}
    className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
  >
    Edit Project
  </button>
)}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
  {(() => {
  const allTabs = [
    {
      key: 'PROJECT_CREATION',
      label: 'Project Creation',
    },
    {
      key: 'LOAN_DEPARTMENT',
      label: 'Loan Department',
    },
    {
      key: 'PROJECT_MANAGEMENT',
      label: 'Material Requirement',
    },
    {
      key: 'PROJECT_EXECUTION',
      label: 'Project Execution',
    },
    {
  key: 'CONTRACTOR_WORK',
  label: 'Contractor Work',
},
    {
      key: 'SUBSIDY_DEPARTMENT',
      label: 'Subsidy Department',
    },
    {
      key: 'ELECTRICITY_DEPARTMENT',
      label: 'Electricity Department',
    },
    {
      key: 'PAYMENT_COLLECTION',
      label: 'Payment Collection',
    },
    {
  key: 'CUSTOMER_UPDATES',
  label: 'Customer Updates',
},
    {
      key: 'DOCUMENTS',
      label: 'Documents',
    },
    {
      key: 'PROJECT_HISTORY',
      label: 'Project History',
    },
  ];

  let visibleTabs = allTabs;

  if (hasRole(['LOAN_MANAGER'])) {
    visibleTabs = allTabs.filter((tab) =>
      [
        'PROJECT_CREATION',
        'LOAN_DEPARTMENT',
        'DOCUMENTS',
        'PROJECT_HISTORY',
      ].includes(tab.key),
    );
  } else if (
    hasRole(['SUBSIDY_MANAGER'])
  ) {
    visibleTabs = allTabs.filter((tab) =>
      [
        'PROJECT_CREATION',
        'SUBSIDY_DEPARTMENT',
        'CONTRACTOR_WORK',
        'DOCUMENTS',
        'PROJECT_HISTORY',
      ].includes(tab.key),
    );
  } else if (
    hasRole(['ELECTRICITY_MANAGER'])
  ) {
    visibleTabs = allTabs.filter((tab) =>
      [
        'PROJECT_CREATION',
        'ELECTRICITY_DEPARTMENT',
        'DOCUMENTS',
        'PROJECT_HISTORY',
      ].includes(tab.key),
    );
  } else if (
    hasRole([
      'PAYMENT_COLLECTION_EXECUTIVE',
      'PAYMENT_MANAGER',
    ])
  ) {
    visibleTabs = allTabs.filter((tab) =>
      [
        'PROJECT_CREATION',
        'PAYMENT_COLLECTION',
        'DOCUMENTS',
        'PROJECT_HISTORY',
      ].includes(tab.key),
    );
  }

  return visibleTabs.map((tab) => (
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
  ));
})()}
</div>

{showEditModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          Edit Project
        </h2>

        <button
          onClick={() =>
            setShowEditModal(false)
          }
          className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-300"
        >
          Close
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
  <h3 className="col-span-full text-lg font-bold text-gray-800">
    Customer Information
  </h3>

  <input placeholder="Customer Name" value={editForm.customerName} onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })} className="rounded-xl border p-3" />
  <input placeholder="Customer Phone" value={editForm.customerPhone} onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })} className="rounded-xl border p-3" />
  <input placeholder="City" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className="rounded-xl border p-3" />
  <input placeholder="Zone" value={editForm.zone} onChange={(e) => setEditForm({ ...editForm, zone: e.target.value })} className="rounded-xl border p-3" />
  <textarea placeholder="Address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="rounded-xl border p-3 md:col-span-2" />

  <h3 className="col-span-full mt-4 text-lg font-bold text-gray-800">
    Project Information
  </h3>

  <input placeholder="Branch Name" value={editForm.branchName} onChange={(e) => setEditForm({ ...editForm, branchName: e.target.value })} className="rounded-xl border p-3" />
  <div className="md:col-span-2">
  <SearchableUserSelect
    label="Project Owner"
    selectedUserId={editForm.projectOwnerId}
    selectedUserName={editForm.projectOwnerName}
    selectedUserRole={editForm.projectOwnerRole}
    onSelect={(user) =>
      setEditForm({
        ...editForm,
        projectOwnerId: String(user.id),
        projectOwnerName: user.name,
        projectOwnerRole: user.role,
      })
    }
  />

  <p className="mt-1 text-xs text-gray-500">
    For old/backdated projects, leave unchanged to keep the current owner.
  </p>
</div>
  <input placeholder="Project Type" value={editForm.projectType} onChange={(e) => setEditForm({ ...editForm, projectType: e.target.value })} className="rounded-xl border p-3" />
  <input placeholder="Project Size" value={editForm.projectSize} onChange={(e) => setEditForm({ ...editForm, projectSize: e.target.value })} className="rounded-xl border p-3" />
  <input placeholder="Electricity K Number" value={editForm.electricityKNumber} onChange={(e) => setEditForm({ ...editForm, electricityKNumber: e.target.value })} className="rounded-xl border p-3" />
  <input placeholder="Customer Gmail" value={editForm.customerGmail} onChange={(e) => setEditForm({ ...editForm, customerGmail: e.target.value })} className="rounded-xl border p-3" />
  <div className="relative md:col-span-3">
  <input
    placeholder="Search Customer Master by Code / Name / Mobile / K Number"
    value={customerSearch}
    onChange={(e) => searchCustomers(e.target.value)}
    className="w-full rounded-xl border p-3"
  />

  {editForm.customerCode && (
    <p className="mt-1 text-xs font-semibold text-green-700">
      Linked Customer: {editForm.customerCode} - {editForm.customerName}
    </p>
  )}

  {customerResults.length > 0 && (
    <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow">
      {customerResults.map((customer) => (
        <button
          key={customer.id}
          type="button"
          onClick={() => selectCustomer(customer)}
          className="block w-full border-b p-3 text-left text-sm hover:bg-blue-50"
        >
          <p className="font-semibold text-gray-800">
            {customer.customerCode} - {customer.customerName}
          </p>
          <p className="text-xs text-gray-500">
            Mobile: {customer.mobile || '-'} | K No:{' '}
            {customer.electricityKNumber || '-'}
          </p>
          <p className="text-xs text-gray-500">
            {customer.city || '-'} / {customer.zone || '-'}
          </p>
        </button>
      ))}
    </div>
  )}
</div>
  <input placeholder="Aadhaar Linked Mobile" value={editForm.aadhaarLinkedMobile} onChange={(e) => setEditForm({ ...editForm, aadhaarLinkedMobile: e.target.value })} className="rounded-xl border p-3" />

  <h3 className="col-span-full mt-4 text-lg font-bold text-gray-800">
    Technical Details
  </h3>

  <input placeholder="Panel Brand" value={editForm.panelBrand} onChange={(e) => setEditForm({ ...editForm, panelBrand: e.target.value })} className="rounded-xl border p-3" />
  <input placeholder="DCR Panel Count" value={editForm.dcrPanelCount} onChange={(e) => setEditForm({ ...editForm, dcrPanelCount: e.target.value })} className="rounded-xl border p-3" />
  <input placeholder="Non DCR Panel Count" value={editForm.nonDcrPanelCount} onChange={(e) => setEditForm({ ...editForm, nonDcrPanelCount: e.target.value })} className="rounded-xl border p-3" />
  <input placeholder="Converter Brand" value={editForm.converterBrand} onChange={(e) => setEditForm({ ...editForm, converterBrand: e.target.value })} className="rounded-xl border p-3" />
  <input placeholder="Converter Capacity" value={editForm.converterCapacity} onChange={(e) => setEditForm({ ...editForm, converterCapacity: e.target.value })} className="rounded-xl border p-3" />
  <input placeholder="Converter Phase" value={editForm.converterPhase} onChange={(e) => setEditForm({ ...editForm, converterPhase: e.target.value })} className="rounded-xl border p-3" />
  <input placeholder="Structure Type" value={editForm.structureType} onChange={(e) => setEditForm({ ...editForm, structureType: e.target.value })} className="rounded-xl border p-3" />
  <input placeholder="Structure Capacity KW" value={editForm.structureCapacityKw} onChange={(e) => setEditForm({ ...editForm, structureCapacityKw: e.target.value })} className="rounded-xl border p-3" />
  <input placeholder="Building Height" value={editForm.buildingHeight} onChange={(e) => setEditForm({ ...editForm, buildingHeight: e.target.value })} className="rounded-xl border p-3" />

  <h3 className="col-span-full mt-4 text-lg font-bold text-gray-800">
    Finance Details
  </h3>

  <input type="number" placeholder="Project Cost After Discount" value={editForm.finalCost} onChange={(e) => setEditForm({ ...editForm, finalCost: e.target.value })} className="rounded-xl border p-3" />
  <input type="number" placeholder="Project Cost" value={editForm.projectCost} onChange={(e) => setEditForm({ ...editForm, projectCost: e.target.value })} className="rounded-xl border p-3" />
  <input type="number" placeholder="Subsidy" value={editForm.subsidy} onChange={(e) => setEditForm({ ...editForm, subsidy: e.target.value })} className="rounded-xl border p-3" />
  <input type="number" placeholder="Net Amount" value={editForm.netAmount} onChange={(e) => setEditForm({ ...editForm, netAmount: e.target.value })} className="rounded-xl border p-3" />
  <input type="number" placeholder="Margin Money" value={editForm.marginMoney} onChange={(e) => setEditForm({ ...editForm, marginMoney: e.target.value })} className="rounded-xl border p-3" />
  <input type="number" placeholder="Loan Amount" value={editForm.loanAmount} onChange={(e) => setEditForm({ ...editForm, loanAmount: e.target.value })} className="rounded-xl border p-3" />
  <input type="number" placeholder="Expected Lagat" value={editForm.expectedLagat} onChange={(e) => setEditForm({ ...editForm, expectedLagat: e.target.value })} className="rounded-xl border p-3" />
  <input type="number" placeholder="Expected Profit" value={editForm.expectedProfit} onChange={(e) => setEditForm({ ...editForm, expectedProfit: e.target.value })} className="rounded-xl border p-3" />

  <h3 className="col-span-full mt-4 text-lg font-bold text-gray-800">
    DISCOM / Status
  </h3>

  <input placeholder="DISCOM Name" value={editForm.discomName} onChange={(e) => setEditForm({ ...editForm, discomName: e.target.value })} className="rounded-xl border p-3" />
  <input placeholder="DISCOM Expenditure Type" value={editForm.discomExpenditureType} onChange={(e) => setEditForm({ ...editForm, discomExpenditureType: e.target.value })} className="rounded-xl border p-3" />
  <input type="number" placeholder="DISCOM Expenditure Amount" value={editForm.discomExpenditureAmount} onChange={(e) => setEditForm({ ...editForm, discomExpenditureAmount: e.target.value })} className="rounded-xl border p-3" />
  <input placeholder="Payment Status" value={editForm.paymentStatus} onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })} className="rounded-xl border p-3" />
</div>

      <textarea
        placeholder="Remarks"
        value={editForm.remarks}
        onChange={(e) =>
          setEditForm({
            ...editForm,
            remarks: e.target.value,
          })
        }
        className="mt-4 w-full rounded-xl border p-3"
        rows={4}
      />

      <div className="mt-5 flex justify-end gap-3">
        <button
          onClick={() =>
            setShowEditModal(false)
          }
          className="rounded-xl bg-gray-200 px-5 py-3 font-semibold hover:bg-gray-300"
        >
          Cancel
        </button>

        <button
  onClick={saveEditProject}
  disabled={editLoading}
  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
>
  {editLoading
    ? 'Saving...'
    : 'Save Project'}
</button>
      </div>
    </div>
  </div>
)}

    {activeTab === 'PROJECT_CREATION' && (
  <>
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">Customer Details</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Customer Name" value={project.customerName} />
          <Field label="Phone" value={project.customerPhone} />
          <Field
  label="Customer Master"
  value={
    (project as any).customerCode
      ? `${(project as any).customerCode} (#${(project as any).customerId})`
      : 'Not linked'
  }
/>
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
          <Field
  label="Electricity K Number"
  value={project.electricityKNumber}
/>

<Field
  label="Gmail"
  value={project.customerGmail}
/>

<Field
  label="Customer Account"
  value={
    project.customerUserName
      ? `${project.customerUserName} (#${project.customerUserId})`
      : 'Not linked'
  }
/>

<Field
  label="Aadhaar Linked Mobile"
  value={project.aadhaarLinkedMobile}
/>
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
          <Field
  label="Project Cost After Discount"
  value={money(project.finalCost)}
/>
          <Field label="DISCOM Name" value={project.discomName} />
          <Field label="DISCOM Expenditure Type" value={project.discomExpenditureType} />
          <Field label="DISCOM Expenditure Amount" value={money(project.discomExpenditureAmount)} />
          <Field label="Expected Laagat" value={money(project.expectedLagat)} />
          <Field label="Expected Profit" value={money(project.expectedProfit)} />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">Approval Status</h2>
        <div className="grid gap-3 md:grid-cols-3">

         <div className="rounded-xl bg-blue-50 p-4">
  <p className="text-sm text-gray-500">Project Manager Approval</p>
  <p className="mt-1 font-bold text-blue-700">
    {project.projectManagerApprovalStatus || 'PENDING'}
  </p>
  <p className="mt-2 text-sm text-gray-700">
    {project.projectManagerApprovalNote || 'No note'}
  </p>
</div>

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

        {hasRole([
  'OWNER',
  'MARKETING_HEAD',
  'PROJECT_MANAGER',
]) && (
  <div className="rounded-xl border p-4">
    <h3 className="font-bold text-gray-800">
      Project Manager Action
    </h3>

    <p className="mt-2 text-sm">
      Status:{' '}
      <span className="font-semibold">
        {project?.projectManagerApprovalStatus ||
          'PENDING'}
      </span>
    </p>

    <textarea
      placeholder="Approval note"
      value={projectManagerApprovalNote}
      onChange={(e) =>
        setProjectManagerApprovalNote(
          e.target.value,
        )
      }
      className="mt-3 w-full rounded-xl border p-3"
      rows={3}
    />

    <div className="mt-3 flex gap-3">
      <button
        onClick={() =>
          handleProjectManagerApproval(
            'APPROVED',
          )
        }
        disabled={
          projectManagerApprovalLoading
        }
        className="rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
      >
        Approve
      </button>

      <button
        onClick={() =>
          handleProjectManagerApproval(
            'REJECTED',
          )
        }
        disabled={
          projectManagerApprovalLoading
        }
        className="rounded-xl bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  </div>
)}

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
    {request.status}
  </p>

  {request.status === 'SUBMITTED' &&
  canApproveAndReserveStock && (
    <button
      type="button"
      onClick={() =>
        approveAndReserveMaterialRequest(request.id)
      }
      className="mt-2 rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white"
    >
      Approve & Reserve Stock
    </button>
  )}

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
  Requested
</th>

<th className="border px-3 py-2 text-left">
  Reserved
</th>

<th className="border px-3 py-2 text-left">
  Issued
</th>

<th className="border px-3 py-2 text-left">
  Pending
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
  {Number(item.quantity || 0)}
</td>

<td className="border px-3 py-2 font-semibold text-orange-700">
  {Number(item.reservedQuantity || 0)}
</td>

<td className="border px-3 py-2 font-semibold text-blue-700">
  {Number(item.issuedQuantity || 0)}
</td>

<td className="border px-3 py-2 font-semibold text-red-700">
  {Math.max(
    Number(item.quantity || 0) -
      Number(item.issuedQuantity || 0),
    0,
  )}
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

{activeTab === 'PROJECT_HISTORY' && (
  <div className="rounded-2xl bg-white p-5 shadow">
    <h2 className="text-xl font-bold text-gray-800">
      Project Edit History
    </h2>

    <div className="mt-5 space-y-3">
      {projectEditHistory.length === 0 ? (
        <p className="text-sm text-gray-500">
          No project history found.
        </p>
      ) : (
        projectEditHistory.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border p-4"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-gray-800">
                  {item.fieldName}
                </p>

                <p className="mt-1 text-sm text-red-600">
                  Old: {item.oldValue || '-'}
                </p>

                <p className="mt-1 text-sm text-green-700">
                  New: {item.newValue || '-'}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  {item.changedByName || '-'} |{' '}
                  {item.changedByRole || '-'}
                </p>
              </div>

              <p className="text-xs text-gray-500">
                {item.createdAt
                  ? new Date(
                      item.createdAt,
                    ).toLocaleString()
                  : '-'}
              </p>
            </div>
          </div>
        ))
      )}
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

      <div className="rounded-xl border bg-gray-50 p-4">
  <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
    <input
      type="checkbox"
      checked={loanForm.requiresCoApplicant}
      onChange={(e) =>
        setLoanForm({
          ...loanForm,
          requiresCoApplicant: e.target.checked,
        })
      }
      className="h-5 w-5"
    />
    Requires Co-Applicant
  </label>

  <p className="mt-1 text-xs text-gray-500">
    Enable this if customer age is above 60 or bank requires a co-applicant.
  </p>
</div>

{loanForm.requiresCoApplicant && (
  <textarea
    placeholder="Reason for co-applicant requirement"
    value={loanForm.coApplicantReason}
    onChange={(e) =>
      setLoanForm({
        ...loanForm,
        coApplicantReason: e.target.value,
      })
    }
    className="rounded-xl border p-3 md:col-span-2"
    rows={3}
  />
)}

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

{loanForm.requiresCoApplicant && loanCoApplicants.length === 0 && (
  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
    <p className="font-bold text-red-700">
      Co-applicant required
    </p>

    <p className="mt-1 text-sm text-red-600">
      Loan detail says co-applicant is required, but no co-applicant has been added yet.
    </p>

    {loanForm.coApplicantReason && (
      <p className="mt-2 text-sm text-red-700">
        Reason: {loanForm.coApplicantReason}
      </p>
    )}
  </div>
)}

<div className="mt-6 rounded-2xl bg-white p-5 shadow">
  <h2 className="text-xl font-bold text-gray-800">
    Loan Co-Applicant Details
  </h2>

  <p className="mt-1 text-sm text-gray-500">
    Add co-applicant details required for senior citizen / bank loan processing.
  </p>

  {canManageLoan && (
    <>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <input
          placeholder="Full Name"
          value={loanCoApplicantForm.fullName}
          onChange={(e) =>
            setLoanCoApplicantForm({
              ...loanCoApplicantForm,
              fullName: e.target.value,
            })
          }
          className="rounded-xl border p-3"
        />

        <input
          placeholder="Relation With Customer"
          value={loanCoApplicantForm.relationWithCustomer}
          onChange={(e) =>
            setLoanCoApplicantForm({
              ...loanCoApplicantForm,
              relationWithCustomer: e.target.value,
            })
          }
          className="rounded-xl border p-3"
        />

        <input
          placeholder="Mobile Number"
          value={loanCoApplicantForm.mobileNumber}
          onChange={(e) =>
            setLoanCoApplicantForm({
              ...loanCoApplicantForm,
              mobileNumber: e.target.value,
            })
          }
          className="rounded-xl border p-3"
        />

        <input
          placeholder="Aadhaar Number"
          value={loanCoApplicantForm.aadhaarNumber}
          onChange={(e) =>
            setLoanCoApplicantForm({
              ...loanCoApplicantForm,
              aadhaarNumber: e.target.value,
            })
          }
          className="rounded-xl border p-3"
        />

        <input
          placeholder="PAN Number"
          value={loanCoApplicantForm.panNumber}
          onChange={(e) =>
            setLoanCoApplicantForm({
              ...loanCoApplicantForm,
              panNumber: e.target.value,
            })
          }
          className="rounded-xl border p-3"
        />

        <input
          placeholder="Bank Name"
          value={loanCoApplicantForm.bankName}
          onChange={(e) =>
            setLoanCoApplicantForm({
              ...loanCoApplicantForm,
              bankName: e.target.value,
            })
          }
          className="rounded-xl border p-3"
        />

        <input
          placeholder="Account Number"
          value={loanCoApplicantForm.accountNumber}
          onChange={(e) =>
            setLoanCoApplicantForm({
              ...loanCoApplicantForm,
              accountNumber: e.target.value,
            })
          }
          className="rounded-xl border p-3"
        />

        <input
          placeholder="IFSC Code"
          value={loanCoApplicantForm.ifscCode}
          onChange={(e) =>
            setLoanCoApplicantForm({
              ...loanCoApplicantForm,
              ifscCode: e.target.value,
            })
          }
          className="rounded-xl border p-3"
        />
      </div>

      <textarea
        placeholder="Remarks"
        value={loanCoApplicantForm.remarks}
        onChange={(e) =>
          setLoanCoApplicantForm({
            ...loanCoApplicantForm,
            remarks: e.target.value,
          })
        }
        className="mt-4 w-full rounded-xl border p-3"
        rows={3}
      />

      <button
        onClick={saveLoanCoApplicant}
        disabled={loanCoApplicantLoading}
        className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loanCoApplicantLoading
          ? 'Saving...'
          : 'Add Co-Applicant'}
      </button>
    </>
  )}

  <div className="mt-6 space-y-4">
    {loanCoApplicants.length === 0 ? (
      <p className="text-sm text-gray-500">
        No co-applicant added yet.
      </p>
    ) : (
      loanCoApplicants.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border bg-gray-50 p-4"
        >
          <div className="grid gap-3 md:grid-cols-2">
            {editingLoanCoApplicantId === item.id ? (
  <div className="rounded-xl border bg-white p-4">
    <h4 className="font-bold text-gray-800">
      Edit Co-Applicant
    </h4>

    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <input
        placeholder="Full Name"
        value={loanCoApplicantEditForm.fullName}
        onChange={(e) =>
          setLoanCoApplicantEditForm({
            ...loanCoApplicantEditForm,
            fullName: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        placeholder="Relation With Customer"
        value={loanCoApplicantEditForm.relationWithCustomer}
        onChange={(e) =>
          setLoanCoApplicantEditForm({
            ...loanCoApplicantEditForm,
            relationWithCustomer: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        placeholder="Mobile Number"
        value={loanCoApplicantEditForm.mobileNumber}
        onChange={(e) =>
          setLoanCoApplicantEditForm({
            ...loanCoApplicantEditForm,
            mobileNumber: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        placeholder="Aadhaar Number"
        value={loanCoApplicantEditForm.aadhaarNumber}
        onChange={(e) =>
          setLoanCoApplicantEditForm({
            ...loanCoApplicantEditForm,
            aadhaarNumber: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        placeholder="PAN Number"
        value={loanCoApplicantEditForm.panNumber}
        onChange={(e) =>
          setLoanCoApplicantEditForm({
            ...loanCoApplicantEditForm,
            panNumber: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        placeholder="Bank Name"
        value={loanCoApplicantEditForm.bankName}
        onChange={(e) =>
          setLoanCoApplicantEditForm({
            ...loanCoApplicantEditForm,
            bankName: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        placeholder="Account Number"
        value={loanCoApplicantEditForm.accountNumber}
        onChange={(e) =>
          setLoanCoApplicantEditForm({
            ...loanCoApplicantEditForm,
            accountNumber: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        placeholder="IFSC Code"
        value={loanCoApplicantEditForm.ifscCode}
        onChange={(e) =>
          setLoanCoApplicantEditForm({
            ...loanCoApplicantEditForm,
            ifscCode: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />
    </div>

    <textarea
      placeholder="Remarks"
      value={loanCoApplicantEditForm.remarks}
      onChange={(e) =>
        setLoanCoApplicantEditForm({
          ...loanCoApplicantEditForm,
          remarks: e.target.value,
        })
      }
      className="mt-4 w-full rounded-xl border p-3"
      rows={3}
    />

    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={updateLoanCoApplicant}
        disabled={loanCoApplicantEditLoading}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loanCoApplicantEditLoading
          ? 'Updating...'
          : 'Update Co-Applicant'}
      </button>

      <button
        type="button"
        onClick={cancelEditLoanCoApplicant}
        className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
      >
        Cancel
      </button>
    </div>
  </div>
) : (
  <>
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h3 className="text-lg font-bold text-gray-800">
          {item.fullName || 'Unnamed Co-Applicant'}
        </h3>

        <p className="text-sm text-gray-500">
          {item.relationWithCustomer || 'Relation not added'} ·{' '}
          {item.mobileNumber || 'No mobile'}
        </p>
      </div>

      {canManageLoan && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => startEditLoanCoApplicant(item)}
            className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => deleteLoanCoApplicant(item.id)}
            disabled={deletingLoanCoApplicantId === item.id}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deletingLoanCoApplicantId === item.id
              ? 'Removing...'
              : 'Remove'}
          </button>
        </div>
      )}
    </div>

    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <Field
        label="Full Name"
        value={item.fullName}
      />

      <Field
        label="Relation"
        value={item.relationWithCustomer}
      />

      <Field
        label="Mobile Number"
        value={item.mobileNumber}
      />

      <Field
        label="Aadhaar Number"
        value={item.aadhaarNumber}
      />

      <Field
        label="PAN Number"
        value={item.panNumber}
      />

      <Field
        label="Bank Name"
        value={item.bankName}
      />

      <Field
        label="Account Number"
        value={item.accountNumber}
      />

      <Field
        label="IFSC Code"
        value={item.ifscCode}
      />
    </div>
  </>
)}
          </div>

          {canManageLoan && (
  <div className="mt-4 rounded-xl border bg-white p-4">
    <h4 className="font-semibold text-gray-800">
      Upload Co-Applicant Documents
    </h4>

    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {[
        {
          field: 'aadhaarFrontUrl',
          label: 'Aadhaar Front',
          url: item.aadhaarFrontUrl,
        },
        {
          field: 'aadhaarBackUrl',
          label: 'Aadhaar Back',
          url: item.aadhaarBackUrl,
        },
        {
          field: 'panCardUrl',
          label: 'PAN Card',
          url: item.panCardUrl,
        },
        {
          field: 'bankProofUrl',
          label: 'Bank Proof',
          url: item.bankProofUrl,
        },
      ].map((doc) => {
        const key = `${item.id}-${doc.field}`;

        return (
          <div
            key={doc.field}
            className="rounded-xl bg-gray-50 p-3"
          >
            <p className="text-sm font-semibold text-gray-700">
              {doc.label}
            </p>

            {doc.url ? (
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-blue-600"
              >
                View Uploaded File
              </a>
            ) : (
              <p className="mt-2 text-xs text-gray-500">
                Not uploaded yet
              </p>
            )}

            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) =>
                setLoanCoApplicantUploadFiles((prev) => ({
                  ...prev,
                  [key]: e.target.files?.[0] || null,
                }))
              }
              className="mt-3 w-full rounded-lg border p-2 text-sm"
            />

            <button
              type="button"
              onClick={() =>
                uploadLoanCoApplicantDocument(
                  item.id,
                  doc.field as
                    | 'aadhaarFrontUrl'
                    | 'aadhaarBackUrl'
                    | 'panCardUrl'
                    | 'bankProofUrl',
                  doc.label,
                )
              }
              disabled={loanCoApplicantUploadingKey === key}
              className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {loanCoApplicantUploadingKey === key
                ? 'Uploading...'
                : `Upload ${doc.label}`}
            </button>
          </div>
        );
      })}
    </div>
  </div>
)}

          {item.remarks && (
            <div className="mt-4 rounded-xl bg-white p-3">
              <p className="text-xs text-gray-500">
                Remarks
              </p>

              <p className="mt-1 text-sm text-gray-700">
                {item.remarks}
              </p>
            </div>
          )}

          <p className="mt-3 text-xs text-gray-500">
            Added By: {item.createdByName || '-'}
          </p>
        </div>
      ))
    )}
  </div>
</div>

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

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  <div className="rounded-2xl bg-blue-50 p-4">
    <p className="text-sm text-blue-600">
      Final Project Amount
    </p>

    <p className="mt-2 text-2xl font-bold text-blue-800">
      ₹
      {projectFinalAmount.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>

  <div className="rounded-2xl bg-yellow-50 p-4">
    <p className="text-sm text-yellow-700">
      Remaining To Schedule
    </p>

    <p className="mt-2 text-2xl font-bold text-yellow-800">
      ₹
      {remainingAmountToSchedule.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>

  <div className="rounded-2xl bg-green-50 p-4">
    <p className="text-sm text-green-700">
      Total Collected
    </p>

    <p className="mt-2 text-2xl font-bold text-green-800">
      ₹
      {totalCollectedAmount.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>

  <div className="rounded-2xl bg-red-50 p-4">
    <p className="text-sm text-red-700">
      Remaining To Collect
    </p>

    <p className="mt-2 text-2xl font-bold text-red-800">
      ₹
      {remainingAmountToCollect.toLocaleString(
        'en-IN',
      )}
    </p>
  </div>
</div>
    <div className="rounded-2xl bg-white p-5 shadow">
  <h2 className="text-xl font-bold text-gray-800">
    Project Accounts Summary
  </h2>

  <p className="mt-1 text-sm text-gray-500">
    Financial overview for this project
  </p>

  <div className="mt-5 grid gap-4 md:grid-cols-3">
    <div className="rounded-2xl bg-red-50 p-4">
      <p className="text-sm text-gray-500">
        Customer Invoice
      </p>

      <p className="mt-2 text-2xl font-bold text-red-700">
        ₹
        {Number(
          projectAccountsSummary.customerInvoice || 0,
        ).toLocaleString('en-IN')}
      </p>
    </div>

    <div className="rounded-2xl bg-green-50 p-4">
      <p className="text-sm text-gray-500">
        Customer Payments
      </p>

      <p className="mt-2 text-2xl font-bold text-green-700">
        ₹
        {Number(
          projectAccountsSummary.customerPayments || 0,
        ).toLocaleString('en-IN')}
      </p>
    </div>

    <div className="rounded-2xl bg-yellow-50 p-4">
      <p className="text-sm text-gray-500">
        Customer Outstanding
      </p>

      <p className="mt-2 text-2xl font-bold text-yellow-700">
        ₹
        {Number(
          projectAccountsSummary.customerOutstanding || 0,
        ).toLocaleString('en-IN')}
      </p>
    </div>

    <div className="rounded-2xl bg-blue-50 p-4">
      <p className="text-sm text-gray-500">
        Vendor PO Amount
      </p>

      <p className="mt-2 text-2xl font-bold text-blue-700">
        ₹
        {Number(
          projectAccountsSummary.vendorPoAmount || 0,
        ).toLocaleString('en-IN')}
      </p>
    </div>

    <div className="rounded-2xl bg-purple-50 p-4">
      <p className="text-sm text-gray-500">
        Vendor Payments
      </p>

      <p className="mt-2 text-2xl font-bold text-purple-700">
        ₹
        {Number(
          projectAccountsSummary.vendorPayments || 0,
        ).toLocaleString('en-IN')}
      </p>
    </div>

    <div className="rounded-2xl bg-gray-100 p-4">
      <p className="text-sm text-gray-500">
        Vendor Outstanding
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-800">
        ₹
        {Number(
          projectAccountsSummary.vendorOutstanding || 0,
        ).toLocaleString('en-IN')}
      </p>
    </div>
  </div>

  <div className="mt-5 rounded-2xl bg-black p-5 text-white">
    <p className="text-sm text-gray-300">
      Net Project Position
    </p>

    <p className="mt-2 text-3xl font-bold">
      ₹
      {Number(
        projectAccountsSummary.netProjectPosition || 0,
      ).toLocaleString('en-IN')}
    </p>

    <p className="mt-1 text-xs text-gray-400">
      Customer Outstanding - Vendor Outstanding
    </p>
  </div>
</div>

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

                  <div className="mt-2">
  {Number(item.paidAmount || 0) <= 0 ? (
    <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
      Payment Not Received
    </span>
  ) : (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
        item.approvalStatus === 'APPROVED'
          ? 'bg-green-100 text-green-700'
          : item.approvalStatus === 'REJECTED'
            ? 'bg-red-100 text-red-700'
            : 'bg-yellow-100 text-yellow-700'
      }`}
    >
      Payment Approval:{' '}
      {item.approvalStatus || 'APPROVED'}
    </span>
  )}
</div>

{canApprovePayment &&
  Number(item.paidAmount || 0) > 0 &&
  item.approvalStatus === 'PENDING' && (
    <div className="mt-3 flex justify-end gap-2">
      <button
        type="button"
        onClick={() => approvePayment(item.id)}
        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
      >
        Approve
      </button>

      <button
        type="button"
        onClick={() => rejectPayment(item.id)}
        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        Reject
      </button>
    </div>
  )}

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

{canEditPaymentAsOwner && (
  <div className="mt-3 flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() => startEditInstallment(item)}
      className="rounded-xl bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-200"
    >
      Edit Installment
    </button>

    <button
      type="button"
      onClick={() => startEditPayment(item)}
      className="rounded-xl bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-200"
    >
      Edit Payment Entry
    </button>
  </div>
)}

{editingInstallmentId === item.id && (
  <div className="mt-4 rounded-xl border bg-purple-50 p-4">
    <h4 className="font-bold text-gray-800">
      Edit Installment
    </h4>

    <div className="mt-3 grid gap-3 md:grid-cols-2">
      <input
        placeholder="Label"
        value={installmentEditForm.label}
        onChange={(e) =>
          setInstallmentEditForm({
            ...installmentEditForm,
            label: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        type="number"
        placeholder="Installment Amount"
        value={installmentEditForm.amount}
        onChange={(e) =>
          setInstallmentEditForm({
            ...installmentEditForm,
            amount: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        type="date"
        value={installmentEditForm.dueDate}
        onChange={(e) =>
          setInstallmentEditForm({
            ...installmentEditForm,
            dueDate: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        placeholder="Remarks"
        value={installmentEditForm.remarks}
        onChange={(e) =>
          setInstallmentEditForm({
            ...installmentEditForm,
            remarks: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />
    </div>

    <div className="mt-3 flex flex-wrap gap-2">
      <button
        onClick={() => saveInstallmentEdit(item.id)}
        disabled={savingPaymentEdit}
        className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Save Installment
      </button>

      <button
        onClick={() => setEditingInstallmentId(null)}
        className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800"
      >
        Cancel
      </button>
    </div>
  </div>
)}

{editingPaymentId === item.id && (
  <div className="mt-4 rounded-xl border bg-green-50 p-4">
    <h4 className="font-bold text-gray-800">
      Edit Payment Entry
    </h4>

    <div className="mt-3 grid gap-3 md:grid-cols-2">
      <input
        type="number"
        placeholder="Paid Amount"
        value={paymentEditForm.paidAmount}
        onChange={(e) =>
          setPaymentEditForm({
            ...paymentEditForm,
            paidAmount: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <select
        value={paymentEditForm.paymentMode}
        onChange={(e) =>
          setPaymentEditForm({
            ...paymentEditForm,
            paymentMode: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      >
        <option value="">Payment Mode</option>
        <option value="CASH">Cash</option>
        <option value="UPI">UPI</option>
        <option value="BANK_TRANSFER">Bank Transfer</option>
        <option value="CHEQUE">Cheque</option>
        <option value="OTHER">Other</option>
      </select>

      <input
        placeholder="Transaction ID"
        value={paymentEditForm.transactionId}
        onChange={(e) =>
          setPaymentEditForm({
            ...paymentEditForm,
            transactionId: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        type="date"
        value={paymentEditForm.paidDate}
        onChange={(e) =>
          setPaymentEditForm({
            ...paymentEditForm,
            paidDate: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        placeholder="Remarks"
        value={paymentEditForm.remarks}
        onChange={(e) =>
          setPaymentEditForm({
            ...paymentEditForm,
            remarks: e.target.value,
          })
        }
        className="rounded-xl border p-3 md:col-span-2"
      />
    </div>

    <div className="mt-3 flex flex-wrap gap-2">
      <button
        onClick={() => savePaymentEdit(item.id)}
        disabled={savingPaymentEdit}
        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Save Payment Entry
      </button>

      <button
        onClick={() => setEditingPaymentId(null)}
        className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800"
      >
        Cancel
      </button>
    </div>
  </div>
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

{activeTab === 'CUSTOMER_UPDATES' && (
  <CustomerUpdatesTab projectId={projectId} />
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

<div
  ref={pdfRef}
  style={{
    position: 'fixed',
    left: '-10000px',
    top: 0,
    width: '794px',
    background: '#ffffff',
    color: '#111827',
  }}
>
  <div className="project-pdf-page top-project-summary bg-white p-8 text-sm">
    <h1 className="text-2xl font-bold">Project Internal Report</h1>
    <p className="mt-1">Project #{project.id}</p>

    <h2 className="mt-6 text-lg font-bold">Customer & Location</h2>
    <div className="mt-3 grid grid-cols-2 gap-2">
      <Field label="Customer Name" value={project.customerName} />
      <Field label="Phone" value={project.customerPhone} />
      <Field label="City" value={project.city} />
      <Field label="Zone" value={project.zone} />
      <Field label="Address" value={project.address || project.gpsAddress} />
      <Field label="GPS" value={project.gpsLatitude && project.gpsLongitude ? `${project.gpsLatitude}, ${project.gpsLongitude}` : '-'} />
      <Field label="Branch" value={project.branchName} />
      <Field label="Project Owner" value={project.projectOwnerName} />
      <Field label="Owner Role" value={project.projectOwnerRole} />
    </div>

    <h2 className="mt-6 text-lg font-bold">Technical Details</h2>
    <div className="mt-3 grid grid-cols-2 gap-2">
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

    <h2 className="mt-6 text-lg font-bold">Finance, Margin & Profit</h2>
    <div className="mt-3 grid grid-cols-2 gap-2">
      <Field label="Project Type" value={project.projectType} />
      <Field label="Margin Money" value={money(project.marginMoney)} />
      <Field label="Loan Amount" value={money(project.loanAmount)} />
      <Field label="Project Cost" value={money(project.projectCost)} />
      <Field
  label="Project Cost After Discount"
  value={money(project.finalCost)}
/>
      <Field label="Expected Laagat" value={money(project.expectedLagat)} />
      <Field label="Expected Profit" value={money(project.expectedProfit)} />
      <Field label="Subsidy Type" value={project.subsidyType} />
      <Field label="DISCOM Name" value={project.discomName} />
      <Field label="DISCOM Expenditure Type" value={project.discomExpenditureType} />
      <Field label="DISCOM Expenditure Amount" value={money(project.discomExpenditureAmount)} />
    </div>
  </div>

  <div className="project-pdf-page bg-white p-8 text-sm">
    <h2 className="text-xl font-bold">Approvals & Remarks</h2>
    <div className="mt-3 grid grid-cols-1 gap-2">
      <Field label="Project Status" value={project.status} />
      <Field label="Project Manager Approval" value={`${project.projectManagerApprovalStatus || '-'} - ${project.projectManagerApprovalNote || 'No note'}`} />
      <Field label="Marketing Head Approval" value={`${project.marketingHeadApprovalStatus || '-'} - ${project.marketingHeadApprovalNote || 'No note'}`} />
      <Field label="Owner Approval" value={`${project.ownerApprovalStatus || '-'} - ${project.ownerApprovalNote || 'No note'}`} />
      <Field label="Remarks" value={project.remarks} />
    </div>

    <h2 className="mt-6 text-xl font-bold">Documents</h2>
    <div className="mt-3 space-y-2">
      {documents.length === 0 ? (
        <p>No documents found</p>
      ) : (
        documents.map((doc) => (
          <div key={doc.id} className="rounded border p-2">
            <p><b>{doc.documentType}</b> | {doc.department}</p>
            <p>{doc.fileName}</p>
            <p>{doc.remarks || '-'}</p>
          </div>
        ))
      )}
    </div>
  </div>

  <div className="project-pdf-page bg-white p-8 text-sm">
    <h2 className="text-xl font-bold">Material Requests</h2>
    <div className="mt-3 space-y-3">
      {materialRequests.length === 0 ? (
        <p>No material requests found</p>
      ) : (
        materialRequests.map((request) => (
          <div key={request.id} className="rounded border p-3">
            <p className="font-bold">{request.title || 'Material Request'}</p>
            <p>Requested By: {request.requestedByName || '-'}</p>
            <p>Total: ₹{Number(request.totalAmount || 0).toLocaleString('en-IN')}</p>
            <p>Status: {request.status || '-'}</p>

            {request.items?.map((item, index) => (
              <p key={index}>
                {item.materialName} | Qty: {item.quantity} | Rate: ₹{Number(item.rate || 0).toLocaleString('en-IN')} | GST: {item.gstPercent}% | Total: ₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}
              </p>
            ))}
          </div>
        ))
      )}
    </div>
  </div>

  <div className="project-pdf-page bg-white p-8 text-sm">
    <h2 className="text-xl font-bold">Payment Collection</h2>
    <div className="mt-3 space-y-2">
      {paymentInstallments.length === 0 ? (
        <p>No payment records found</p>
      ) : (
        paymentInstallments.map((payment) => (
          <div key={payment.id} className="rounded border p-2">
            <p><b>{payment.label}</b> | {payment.status}</p>
            <p>Amount: {money(payment.amount)} | Paid: {money(payment.paidAmount)} | Pending: {money(payment.pendingAmount)}</p>
            <p>Due: {payment.dueDate || '-'} | Paid Date: {payment.paidDate || '-'}</p>
            <p>Mode: {payment.paymentMode || '-'} | Transaction: {payment.transactionId || '-'}</p>
            <p>Remarks: {payment.remarks || '-'}</p>
          </div>
        ))
      )}
    </div>

    <h2 className="mt-6 text-xl font-bold">Execution Activities</h2>
    <div className="mt-3 space-y-2">
      {executionActivities.length === 0 ? (
        <p>No execution activities found</p>
      ) : (
        executionActivities.map((activity) => (
          <div key={activity.id} className="rounded border p-2">
            <p><b>{activity.activityType}</b> | {activity.status}</p>
            <p>Scheduled: {activity.scheduledDate || '-'} | Completed: {activity.completedDate || '-'}</p>
            <p>Assigned To: {activity.assignedToName || '-'}</p>
            <p>Remarks: {activity.remarks || '-'}</p>
          </div>
        ))
      )}
    </div>
  </div>

  <div className="project-pdf-page bg-white p-8 text-sm">
    <h2 className="text-xl font-bold">Department Details</h2>

    <h3 className="mt-4 font-bold">Loan</h3>
    <pre className="whitespace-pre-wrap rounded border p-3">
      {JSON.stringify(loanDetail || {}, null, 2)}
    </pre>

    <h3 className="mt-4 font-bold">Subsidy</h3>
    <pre className="whitespace-pre-wrap rounded border p-3">
      {JSON.stringify(subsidyDetail || {}, null, 2)}
    </pre>

    <h3 className="mt-4 font-bold">Electricity</h3>
    <pre className="whitespace-pre-wrap rounded border p-3">
      {JSON.stringify(electricityDetail || {}, null, 2)}
    </pre>

    <h2 className="mt-6 text-xl font-bold">Project History</h2>
    <div className="mt-3 space-y-2">
      {projectEditHistory.length === 0 ? (
        <p>No project history found</p>
      ) : (
        projectEditHistory.map((history) => (
          <div key={history.id} className="rounded border p-2">
            <p><b>{history.fieldName}</b></p>
            <p>Old: {history.oldValue || '-'}</p>
            <p>New: {history.newValue || '-'}</p>
            <p>Changed By: {history.changedByName || '-'} | {history.changedByRole || '-'}</p>
          </div>
        ))
      )}
    </div>
  </div>
</div>

    </div>
  );

  function CleaningMiniList({
  items,
}: {
  items: CleaningAssignment[];
}) {
  if (!items.length) {
    return (
      <p className="mt-3 text-sm text-gray-500">
        No cleaning reminders found.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border bg-gray-50 p-3">
          <p className="font-bold text-gray-800">
            {item.project?.customerName || item.contractorName || 'Cleaning'}
          </p>

          <p className="text-sm text-gray-600">
            Contractor: {item.contractorName || '-'}
          </p>

          <p className="text-sm text-gray-600">
            {item.cleaningDate || '-'}
            {item.cleaningTime ? ` • ${item.cleaningTime}` : ''}
          </p>

          <p className="text-sm text-gray-600">
            {String(item.status || '-').replaceAll('_', ' ')}
          </p>
        </div>
      ))}
    </div>
  );
}

function CleaningPanel({
  title,
  items,
}: {
  title: string;
  items: CleaningAssignment[];
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-700">
          {items.length}
        </span>
      </div>

      <CleaningMiniList items={items.slice(0, 5)} />
    </div>
  );
}
}
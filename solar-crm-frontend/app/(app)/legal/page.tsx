
'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { getAuthHeaders } from '@/lib/authHeaders';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;


const LEGAL_DOCUMENT_MAX_SIZE = 25 * 1024 * 1024;

const LEGAL_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

async function prepareLegalDocumentFile(
  file: File,
): Promise<File> {
  if (!LEGAL_DOCUMENT_TYPES.includes(file.type)) {
    throw new Error(
      'Only PDF, JPG, PNG and WEBP files are allowed',
    );
  }

  if (file.size > LEGAL_DOCUMENT_MAX_SIZE) {
    throw new Error('File must not exceed 25 MB');
  }

  if (file.type === 'application/pdf') {
    return file;
  }

  if (file.size <= 1024 * 1024) {
    return file;
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: 3,
    maxWidthOrHeight: 2400,
    useWebWorker: true,
    initialQuality: 0.9,
    fileType: file.type,
  });

  if (compressed.size >= file.size) {
    return file;
  }

  return new File([compressed], file.name, {
    type: compressed.type || file.type,
    lastModified: file.lastModified,
  });
}


const CASE_STATUSES = [
  'DRAFT',
  'UNDER_REVIEW',
  'NOTICE_STAGE',
  'PROCEEDINGS',
  'ON_HOLD',
  'SETTLED',
  'WITHDRAWN',
  'CLOSED',
] as const;

const CASE_DIRECTIONS = [
  'FILED_BY_COMPANY',
  'FILED_AGAINST_COMPANY',
] as const;

const PRIORITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
] as const;

type LegalCase = {
  id: number;
  caseNumber: string;
  title: string;
  description: string | null;
  caseType: string;
  direction: string;
  status: string;
  priority: string;
  projectId: number | null;
  assignedAdvisorId: number | null;
  courtOrAuthority: string | null;
  externalCaseNumber: string | null;
  filingDate: string | null;
  nextHearingDate: string | null;
  remarks: string | null;
  isConfidential: boolean;
  createdAt: string;
};


type LegalCaseDocument = {
  id: number;
  caseId: number;
  title: string;
  category: string;
  remarks: string | null;
  fileName: string;
  mimeType: string;
  fileSize: string;
  uploadedBy: number | null;
  createdAt: string;
};


type LegalCaseHearing = {
  id: number;
  caseId: number;
  hearingDate: string;
  courtOrAuthority: string | null;
  status: string;
  outcome: string | null;
  proceedingsNotes: string | null;
  nextHearingDate: string | null;
  remarks: string | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
};

type LegalHearingForm = {
  hearingDate: string;
  courtOrAuthority: string;
  status: string;
  outcome: string;
  proceedingsNotes: string;
  nextHearingDate: string;
  remarks: string;
};

const HEARING_STATUSES = [
  'SCHEDULED',
  'COMPLETED',
  'ADJOURNED',
  'CANCELLED',
  'POSTPONED',
] as const;

const initialHearingForm: LegalHearingForm = {
  hearingDate: '',
  courtOrAuthority: '',
  status: 'SCHEDULED',
  outcome: '',
  proceedingsNotes: '',
  nextHearingDate: '',
  remarks: '',
};

type LegalCaseParty = {
  id: number;
  caseId: number;
  partyType: string;
  partyRole: string;
  linkedRecordId: number | null;
  partyName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  remarks: string | null;
  isPrimaryParty: boolean;
  createdAt: string;
};

type LegalPartyForm = {
  partyType: string;
  partyRole: string;
  partyName: string;
  linkedRecordId: string;
  phone: string;
  email: string;
  address: string;
  remarks: string;
  isPrimaryParty: boolean;
};

const PARTY_TYPES = [
  'COMPANY',
  'CUSTOMER',
  'STAFF',
  'VENDOR',
  'DEALER',
  'OTHER',
] as const;

const PARTY_ROLES = [
  'COMPLAINANT',
  'RESPONDENT',
  'PETITIONER',
  'DEFENDANT',
  'WITNESS',
  'OTHER',
] as const;

const initialPartyForm: LegalPartyForm = {
  partyType: 'CUSTOMER',
  partyRole: 'RESPONDENT',
  partyName: '',
  linkedRecordId: '',
  phone: '',
  email: '',
  address: '',
  remarks: '',
  isPrimaryParty: false,
};

type CaseListResponse = {
  data: LegalCase[];
  total: number;
  page: number;
  limit: number;
};

type CaseForm = {
  title: string;
  caseType: string;
  direction: string;
  priority: string;
  description: string;
  projectId: string;
  assignedAdvisorId: string;
  courtOrAuthority: string;
  externalCaseNumber: string;
  filingDate: string;
  nextHearingDate: string;
  remarks: string;
  isConfidential: boolean;
};

const initialForm: CaseForm = {
  title: '',
  caseType: '',
  direction: 'FILED_BY_COMPANY',
  priority: 'MEDIUM',
  description: '',
  projectId: '',
  assignedAdvisorId: '',
  courtOrAuthority: '',
  externalCaseNumber: '',
  filingDate: '',
  nextHearingDate: '',
  remarks: '',
  isConfidential: false,
};

function formatLabel(value: string) {
  return value.replaceAll('_', ' ');
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return value.slice(0, 10);
}

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }

    if (error.response?.status === 403) {
      return 'You do not have permission to access Legal Management.';
    }

    if (error.response?.status === 401) {
      return 'Your login session is invalid or expired.';
    }
  }

  return 'Something went wrong. Please try again.';
}

export default function LegalManagementPage() {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [total, setTotal] = useState(0);


const [caseDocuments, setCaseDocuments] =
  useState<LegalCaseDocument[]>([]);

const [documentsLoading, setDocumentsLoading] =
  useState(false);

const [documentsError, setDocumentsError] =
  useState('');

const [documentUploading, setDocumentUploading] =
  useState(false);

const [documentTitle, setDocumentTitle] =
  useState('');

const [documentCategory, setDocumentCategory] =
  useState('OTHER');

const [documentRemarks, setDocumentRemarks] =
  useState('');

const [documentFile, setDocumentFile] =
  useState<File | null>(null);

const [documentActionId, setDocumentActionId] =
  useState<number | null>(null);


  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

const [showForm, setShowForm] = useState(false);
const [form, setForm] = useState<CaseForm>(initialForm);

const [editingCaseId, setEditingCaseId] =
  useState<number | null>(null);

const [editingCaseStatus, setEditingCaseStatus] =
  useState<string>('DRAFT');

const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

    const [caseHearings, setCaseHearings] =
    useState<LegalCaseHearing[]>([]);

  const [hearingsLoading, setHearingsLoading] =
    useState(false);

  const [hearingsError, setHearingsError] =
    useState('');

  const [showHearingForm, setShowHearingForm] =
    useState(false);

  const [hearingForm, setHearingForm] =
    useState<LegalHearingForm>(initialHearingForm);

 const [editingHearingId, setEditingHearingId] =
  useState<number | null>(null);

  const [hearingSaving, setHearingSaving] =
    useState(false);

  const [hearingFormError, setHearingFormError] =
    useState('');

  const [hearingSuccess, setHearingSuccess] =
    useState('');

  const [selectedCase, setSelectedCase] =
    useState<LegalCase | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
    const [caseParties, setCaseParties] =
    useState<LegalCaseParty[]>([]);

  const [partiesLoading, setPartiesLoading] =
    useState(false);

  const [partiesError, setPartiesError] =
    useState('');

  const [showPartyForm, setShowPartyForm] =
    useState(false);

  const [partyForm, setPartyForm] =
    useState<LegalPartyForm>(initialPartyForm);

  const [partySaving, setPartySaving] =
    useState(false);

  const [partyFormError, setPartyFormError] =
    useState('');

  const [partySuccess, setPartySuccess] =
    useState('');

  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const loadCases = useCallback(async () => {
    if (!API_BASE_URL) {
      setError('API base URL is not configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get<CaseListResponse>(
        `${API_BASE_URL}/legal/cases`,
        {
          headers: getAuthHeaders(),
          params: {
            page,
            limit,
            ...(search ? { search } : {}),
            ...(statusFilter ? { status: statusFilter } : {}),
            ...(directionFilter
              ? { direction: directionFilter }
              : {}),
          },
        },
      );

      setCases(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      setError(errorMessage(err));
      setCases([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, directionFilter]);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  const updateForm = <K extends keyof CaseForm>(
    key: K,
    value: CaseForm[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const startEditingCase = (legalCase: LegalCase) => {
  setEditingCaseId(legalCase.id);
  setEditingCaseStatus(legalCase.status);

  setForm({
    title: legalCase.title,
    caseType: legalCase.caseType,
    direction: legalCase.direction,
    priority: legalCase.priority,
    description: legalCase.description ?? '',
    projectId: legalCase.projectId?.toString() ?? '',
    assignedAdvisorId:
      legalCase.assignedAdvisorId?.toString() ?? '',
    courtOrAuthority: legalCase.courtOrAuthority ?? '',
    externalCaseNumber: legalCase.externalCaseNumber ?? '',
    filingDate: legalCase.filingDate?.slice(0, 10) ?? '',
    nextHearingDate: legalCase.nextHearingDate?.slice(0, 10) ?? '',
    remarks: legalCase.remarks ?? '',
    isConfidential: legalCase.isConfidential,
  });

  setFormError('');
  setSuccess('');
  setShowForm(true);
};

  const createCase = async (event: React.FormEvent) => {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setFormError('');
    setSuccess('');

        try {
      if (editingCaseId !== null) {
        const response = await axios.patch<LegalCase>(
          `${API_BASE_URL}/legal/cases/${editingCaseId}`,
          {
            title: form.title.trim(),
            caseType: form.caseType.trim(),
            direction: form.direction,
            status: editingCaseStatus,
            priority: form.priority,
            description: form.description.trim() || null,
            projectId: form.projectId
              ? Number(form.projectId)
              : null,
            assignedAdvisorId: form.assignedAdvisorId
              ? Number(form.assignedAdvisorId)
              : null,
            courtOrAuthority:
              form.courtOrAuthority.trim() || null,
            externalCaseNumber:
              form.externalCaseNumber.trim() || null,
            filingDate: form.filingDate || null,
            remarks: form.remarks.trim() || null,
            isConfidential: form.isConfidential,
          },
          { headers: getAuthHeaders() },
        );

        setSelectedCase((previous) =>
          previous?.id === response.data.id
            ? response.data
            : previous,
        );

        setSuccess(
          `Legal case ${response.data.caseNumber} updated successfully.`,
        );
        setShowForm(false);
        setEditingCaseId(null);
        setEditingCaseStatus('DRAFT');
        setForm(initialForm);
        await loadCases();
        return;
      }

      const response = await axios.post<LegalCase>(
        `${API_BASE_URL}/legal/cases`,
        {
          title: form.title.trim(),
          caseType: form.caseType.trim(),
          direction: form.direction,
          priority: form.priority,
          description: form.description.trim() || null,
          projectId: form.projectId
            ? Number(form.projectId)
            : null,
          assignedAdvisorId: form.assignedAdvisorId
            ? Number(form.assignedAdvisorId)
            : null,
          courtOrAuthority:
            form.courtOrAuthority.trim() || null,
          externalCaseNumber:
            form.externalCaseNumber.trim() || null,
          filingDate: form.filingDate || null,
          nextHearingDate: form.nextHearingDate || null,
          remarks: form.remarks.trim() || null,
          isConfidential: form.isConfidential,
        },
        { headers: getAuthHeaders() },
      );

      setSuccess(
        `Legal case ${response.data.caseNumber} created successfully.`,
      );
      setShowForm(false);
      setForm(initialForm);
      setPage(1);
      await loadCases();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

    const loadCaseHearings = async (caseId: number) => {
    setHearingsLoading(true);
    setHearingsError('');

    try {
      const response = await axios.get<LegalCaseHearing[]>(
        `${API_BASE_URL}/legal/cases/${caseId}/hearings`,
        {
          headers: getAuthHeaders(),
        },
      );

      setCaseHearings(response.data);
    } catch (err) {
      setCaseHearings([]);
      setHearingsError(errorMessage(err));
    } finally {
      setHearingsLoading(false);
    }
  };

    const loadCaseParties = async (caseId: number) => {
    setPartiesLoading(true);
    setPartiesError('');

    try {
      const response = await axios.get<LegalCaseParty[]>(
        `${API_BASE_URL}/legal/cases/${caseId}/parties`,
        {
          headers: getAuthHeaders(),
        },
      );

      setCaseParties(response.data);
    } catch (err) {
      setCaseParties([]);
      setPartiesError(errorMessage(err));
    } finally {
      setPartiesLoading(false);
    }
  };


const loadCaseDocuments = async (caseId: number) => {
  setDocumentsLoading(true);
  setDocumentsError('');

  try {
    const response = await axios.get<LegalCaseDocument[]>(
      `${API_BASE_URL}/legal/cases/${caseId}/documents`,
      {
        headers: getAuthHeaders(),
      },
    );

    setCaseDocuments(response.data);
  } catch (err) {
    setCaseDocuments([]);
    setDocumentsError(errorMessage(err));
  } finally {
    setDocumentsLoading(false);
  }
};


    const openCase = async (id: number) => {
    setDetailLoading(true);
    setError('');
    setSelectedCase(null);

setCaseDocuments([]);
setDocumentsError('');
setDocumentTitle('');
setDocumentCategory('OTHER');
setDocumentRemarks('');
setDocumentFile(null);
setDocumentActionId(null);

    setCaseParties([]);
    setPartiesError('');
    setPartySuccess('');
    setPartyFormError('');
    setShowPartyForm(false);
    setPartyForm(initialPartyForm);
    setCaseHearings([]);
    setHearingsError('');
    setHearingSuccess('');
    setHearingFormError('');
    setShowHearingForm(false);
    setEditingHearingId(null);
    setHearingForm(initialHearingForm);

    try {
      const response = await axios.get<LegalCase>(
        `${API_BASE_URL}/legal/cases/${id}`,
        {
          headers: getAuthHeaders(),
        },
      );

      setSelectedCase(response.data);

        
await Promise.all([
  loadCaseParties(id),
  loadCaseHearings(id),
  loadCaseDocuments(id),
]);

    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };


const uploadCaseDocument = async (
  event: React.FormEvent<HTMLFormElement>,
) => {
  event.preventDefault();

  if (!selectedCase || documentUploading) return;

  if (!documentTitle.trim()) {
    setDocumentsError('Document title is required.');
    return;
  }

  if (!documentFile) {
    setDocumentsError('Please select a document.');
    return;
  }

  const caseId = selectedCase.id;

  setDocumentUploading(true);
  setDocumentsError('');

  try {
    const preparedFile = await prepareLegalDocumentFile(
      documentFile,
    );

    const formData = new FormData();
    formData.append('file', preparedFile);
    formData.append('title', documentTitle.trim());
    formData.append('category', documentCategory);
    formData.append('remarks', documentRemarks.trim());

    await axios.post(
      `${API_BASE_URL}/legal/cases/${caseId}/documents`,
      formData,
      {
        headers: getAuthHeaders(),
      },
    );

    setDocumentTitle('');
    setDocumentCategory('OTHER');
    setDocumentRemarks('');
    setDocumentFile(null);

    await loadCaseDocuments(caseId);
  } catch (err) {
    setDocumentsError(
      err instanceof Error && !axios.isAxiosError(err)
        ? err.message
        : errorMessage(err),
    );
  } finally {
    setDocumentUploading(false);
  }
};



const openCaseDocument = async (
  caseDocument: LegalCaseDocument,
  download = false,
) => {
  if (!selectedCase || documentActionId !== null) return;

  const caseId = selectedCase.id;

  const newTab = download ? null : window.open('', '_blank');

  if (newTab) {
    newTab.opener = null;
    newTab.document.title = 'Opening legal document...';
  }

  setDocumentActionId(caseDocument.id);
  setDocumentsError('');

  try {
    const response = await axios.get<{
      url: string;
      expiresIn: number;
      fileName: string;
      mimeType: string;
    }>(
      `${API_BASE_URL}/legal/cases/${caseId}/documents/${caseDocument.id}/url`,
      {
        params: { download: String(download) },
        headers: getAuthHeaders(),
      },
    );

    if (download) {
      const link = document.createElement('a');
      link.href = response.data.url;
      link.download = response.data.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else if (newTab) {
      newTab.location.href = response.data.url;
    } else {
      window.location.href = response.data.url;
    }
  } catch (err) {
    newTab?.close();
    setDocumentsError(errorMessage(err));
  } finally {
    setDocumentActionId(null);
  }
};


const hideCaseDocument = async (
  document: LegalCaseDocument,
) => {
  if (!selectedCase || documentActionId !== null) return;

  const confirmed = window.confirm(
    `Hide "${document.title}" from this legal case? The file will remain stored.`,
  );

  if (!confirmed) return;

  const caseId = selectedCase.id;

  setDocumentActionId(document.id);
  setDocumentsError('');

  try {
    await axios.patch(
      `${API_BASE_URL}/legal/cases/${caseId}/documents/${document.id}/hide`,
      {},
      {
        headers: getAuthHeaders(),
      },
    );

    await loadCaseDocuments(caseId);
  } catch (err) {
    setDocumentsError(errorMessage(err));
  } finally {
    setDocumentActionId(null);
  }
};


  const startEditingHearing = (hearing: LegalCaseHearing) => {
  setEditingHearingId(hearing.id);

  setHearingForm({
    hearingDate: hearing.hearingDate,
    courtOrAuthority: hearing.courtOrAuthority || '',
    status: hearing.status,
    outcome: hearing.outcome || '',
    proceedingsNotes: hearing.proceedingsNotes || '',
    nextHearingDate: hearing.nextHearingDate || '',
    remarks: hearing.remarks || '',
  });

  setHearingFormError('');
  setHearingSuccess('');
  setShowHearingForm(true);
};

    const addCaseHearing = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedCase || hearingSaving) return;

    const caseId = selectedCase.id;

    setHearingSaving(true);
    setHearingFormError('');
    setHearingSuccess('');

    try {
      const hearingPayload = {
  hearingDate: hearingForm.hearingDate,
  courtOrAuthority:
    hearingForm.courtOrAuthority.trim() || null,
  status: hearingForm.status,
  outcome: hearingForm.outcome.trim() || null,
  proceedingsNotes:
    hearingForm.proceedingsNotes.trim() || null,
  nextHearingDate:
    hearingForm.nextHearingDate || null,
  remarks: hearingForm.remarks.trim() || null,
};

if (editingHearingId !== null) {
  await axios.patch(
    `${API_BASE_URL}/legal/cases/${caseId}/hearings/${editingHearingId}`,
    hearingPayload,
    {
      headers: getAuthHeaders(),
    },
  );
} else {
  await axios.post(
    `${API_BASE_URL}/legal/cases/${caseId}/hearings`,
    hearingPayload,
    {
      headers: getAuthHeaders(),
    },
  );
}

      setHearingSuccess(
  editingHearingId !== null
    ? 'Legal case hearing updated successfully.'
    : 'Legal case hearing added successfully.',
);

setEditingHearingId(null);
setHearingForm(initialHearingForm);
setShowHearingForm(false);

await Promise.all([
  loadCaseHearings(caseId),
  axios
    .get<LegalCase>(
      `${API_BASE_URL}/legal/cases/${caseId}`,
      { headers: getAuthHeaders() },
    )
    .then((response) => {
      setSelectedCase(response.data);
    }),
]);
    } catch (err) {
      setHearingFormError(errorMessage(err));
    } finally {
      setHearingSaving(false);
    }
  };

    const addCaseParty = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedCase || partySaving) return;

    const caseId = selectedCase.id;

    setPartySaving(true);
    setPartyFormError('');
    setPartySuccess('');

    try {
      await axios.post(
        `${API_BASE_URL}/legal/cases/${caseId}/parties`,
        {
          partyType: partyForm.partyType,
          partyRole: partyForm.partyRole,
          partyName: partyForm.partyName.trim(),

          linkedRecordId: partyForm.linkedRecordId
            ? Number(partyForm.linkedRecordId)
            : null,

          phone: partyForm.phone.trim() || null,
          email: partyForm.email.trim() || null,
          address: partyForm.address.trim() || null,
          remarks: partyForm.remarks.trim() || null,

          isPrimaryParty: partyForm.isPrimaryParty,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      setPartySuccess('Legal case party added successfully.');
      setPartyForm(initialPartyForm);
      setShowPartyForm(false);

      await loadCaseParties(caseId);
    } catch (err) {
      setPartyFormError(errorMessage(err));
    } finally {
      setPartySaving(false);
    }
  };

  const fieldClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';

  const labelClass =
    'mb-1 block text-sm font-medium text-gray-700';

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Legal Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Legal cases, proceedings, responsibilities and records
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
  if (saving) return;

  setShowForm((previous) => !previous);
  setEditingCaseId(null);
  setEditingCaseStatus('DRAFT');
  setForm(initialForm);
  setFormError('');
}}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          {showForm ? 'Close Form' : '+ Register Legal Case'}
        </button>
      </div>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Cases matching filters
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {total}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Cases on this page
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {cases.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Current page
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {page} / {totalPages}
          </p>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={createCase}
          className="space-y-5 rounded-xl border bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900">
  {editingCaseId !== null
    ? `Edit Legal Case #${editingCaseId}`
    : 'Register New Legal Case'}
</h2>

          {formError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Case Title *</label>
              <input
                required
                maxLength={255}
                className={fieldClass}
                value={form.title}
                onChange={(e) =>
                  updateForm('title', e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>Case Type *</label>
              <input
                required
                maxLength={100}
                placeholder="e.g. Payment Dispute"
                className={fieldClass}
                value={form.caseType}
                onChange={(e) =>
                  updateForm('caseType', e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>Case Direction *</label>
              <select
                className={fieldClass}
                value={form.direction}
                onChange={(e) =>
                  updateForm('direction', e.target.value)
                }
              >
                {CASE_DIRECTIONS.map((direction) => (
                  <option key={direction} value={direction}>
                    {formatLabel(direction)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Priority</label>
              <select
                className={fieldClass}
                value={form.priority}
                onChange={(e) =>
                  updateForm('priority', e.target.value)
                }
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            {editingCaseId !== null && (
  <div>
    <label className={labelClass}>Case Status</label>
    <select
      className={fieldClass}
      value={editingCaseStatus}
      onChange={(e) =>
        setEditingCaseStatus(e.target.value)
      }
    >
      {CASE_STATUSES.map((status) => (
        <option key={status} value={status}>
          {formatLabel(status)}
        </option>
      ))}
    </select>
  </div>
)}

            <div>
              <label className={labelClass}>
                Linked Project ID (Optional)
              </label>
              <input
                type="number"
                min="1"
                className={fieldClass}
                value={form.projectId}
                onChange={(e) =>
                  updateForm('projectId', e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>
                Legal Advisor User ID (Optional)
              </label>
              <input
                type="number"
                min="1"
                className={fieldClass}
                value={form.assignedAdvisorId}
                onChange={(e) =>
                  updateForm('assignedAdvisorId', e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>
                Court / Authority
              </label>
              <input
                maxLength={255}
                className={fieldClass}
                value={form.courtOrAuthority}
                onChange={(e) =>
                  updateForm('courtOrAuthority', e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>
                External Case Number
              </label>
              <input
                maxLength={150}
                className={fieldClass}
                value={form.externalCaseNumber}
                onChange={(e) =>
                  updateForm('externalCaseNumber', e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>Filing Date</label>
              <input
                type="date"
                className={fieldClass}
                value={form.filingDate}
                onChange={(e) =>
                  updateForm('filingDate', e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>Next Hearing Date</label>
              <input
                type="date"
                className={fieldClass}
                value={form.nextHearingDate}
                onChange={(e) =>
                  updateForm('nextHearingDate', e.target.value)
                }
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              rows={3}
              className={fieldClass}
              value={form.description}
              onChange={(e) =>
                updateForm('description', e.target.value)
              }
            />
          </div>

          <div>
            <label className={labelClass}>Remarks</label>
            <textarea
              rows={2}
              className={fieldClass}
              value={form.remarks}
              onChange={(e) =>
                updateForm('remarks', e.target.value)
              }
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isConfidential}
              onChange={(e) =>
                updateForm('isConfidential', e.target.checked)
              }
            />
            Mark as confidential
          </label>

          <div className="flex justify-end gap-3">
  {editingCaseId !== null && (
    <button
      type="button"
      disabled={saving}
      onClick={() => {
        setEditingCaseId(null);
        setEditingCaseStatus('DRAFT');
        setForm(initialForm);
        setFormError('');
        setShowForm(false);
      }}
      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      Cancel Editing
    </button>
  )}

  <button
    type="submit"
    disabled={saving}
    className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
  >
    {saving
      ? 'Saving...'
      : editingCaseId !== null
        ? 'Update Legal Case'
        : 'Create Legal Case'}
  </button>
</div>
        </form>
      )}

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput.trim());
          }}
          className="grid grid-cols-1 gap-3 md:grid-cols-4"
        >
          <input
            className={fieldClass}
            placeholder="Search case number or title"
            maxLength={100}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          <select
            className={fieldClass}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            {CASE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>

          <select
            className={fieldClass}
            value={directionFilter}
            onChange={(e) => {
              setDirectionFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Directions</option>
            {CASE_DIRECTIONS.map((direction) => (
              <option key={direction} value={direction}>
                {formatLabel(direction)}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Search
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Legal Case Register
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading legal cases...
          </div>
        ) : cases.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No legal cases found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3">Case Number</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Direction</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Next Hearing</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3 font-semibold">
                      {item.caseNumber}
                    </td>
                    <td className="p-3">
                      {item.title}
                      {item.isConfidential && (
                        <span className="ml-2 text-xs text-amber-700">
                          Confidential
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {formatLabel(item.direction)}
                    </td>
                    <td className="p-3">
                      {formatLabel(item.status)}
                    </td>
                    <td className="p-3">{item.priority}</td>
                    <td className="p-3">
                      {item.projectId ?? '—'}
                    </td>
                    <td className="p-3">
                      {formatDate(item.nextHearingDate)}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => void openCase(item.id)}
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t p-4 text-sm">
          <span className="text-gray-500">
            {total} case(s)
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border px-3 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {(selectedCase || detailLoading) && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
  <h2 className="text-lg font-semibold">
    Case Details
  </h2>

  <div className="flex items-center gap-2">
    {selectedCase && !detailLoading && (
      <button
        type="button"
        onClick={() => {
          startEditingCase(selectedCase);
          window.scrollTo({
            top: 0,
            behavior: 'smooth',
          });
        }}
        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
      >
        Edit Case
      </button>
    )}

    <button
      type="button"
      onClick={() => setSelectedCase(null)}
      className="text-sm text-gray-500 hover:text-gray-900"
    >
      Close
    </button>
  </div>
</div>

          {detailLoading ? (
            <p className="mt-4 text-gray-500">Loading...</p>
          ) : selectedCase ? (
            <div className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              {[
                ['Case Number', selectedCase.caseNumber],
                ['Title', selectedCase.title],
                ['Case Type', selectedCase.caseType],
                ['Direction', formatLabel(selectedCase.direction)],
                ['Status', formatLabel(selectedCase.status)],
                ['Priority', selectedCase.priority],
                ['Project ID', selectedCase.projectId],
                ['Advisor ID', selectedCase.assignedAdvisorId],
                ['Court / Authority', selectedCase.courtOrAuthority],
                ['External Case No.', selectedCase.externalCaseNumber],
                ['Filing Date', formatDate(selectedCase.filingDate)],
                ['Next Hearing', formatDate(selectedCase.nextHearingDate)],
                ['Description', selectedCase.description],
                ['Remarks', selectedCase.remarks],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <p className="font-medium text-gray-500">
                    {label}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-gray-900">
                    {value ?? '—'}
                  </p>
                </div>
                            ))}
            </div>
          ) : null}

          {selectedCase && !detailLoading && (
            <div className="mt-6 border-t pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Involved Parties
                  </h3>
                  <p className="text-sm text-gray-500">
                    Complainants, respondents, witnesses and other parties
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowPartyForm((previous) => !previous);
                    setPartyFormError('');
                  }}
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  {showPartyForm ? 'Cancel' : '+ Add Party'}
                </button>
              </div>

              {partySuccess && (
                <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  {partySuccess}
                </p>
              )}

              {partiesError && (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {partiesError}
                </p>
              )}

              {showPartyForm && (
                <form
                  onSubmit={addCaseParty}
                  className="mt-5 space-y-4 rounded-xl border bg-gray-50 p-4"
                >
                  <h4 className="font-semibold text-gray-900">
                    Add Legal Case Party
                  </h4>

                  {partyFormError && (
                    <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      {partyFormError}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>Party Type *</label>
                      <select
                        className={fieldClass}
                        value={partyForm.partyType}
                        onChange={(e) =>
                          setPartyForm((previous) => ({
                            ...previous,
                            partyType: e.target.value,
                          }))
                        }
                      >
                        {PARTY_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {formatLabel(type)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Legal Role *</label>
                      <select
                        className={fieldClass}
                        value={partyForm.partyRole}
                        onChange={(e) =>
                          setPartyForm((previous) => ({
                            ...previous,
                            partyRole: e.target.value,
                          }))
                        }
                      >
                        {PARTY_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {formatLabel(role)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Party Name *</label>
                      <input
                        required
                        maxLength={255}
                        className={fieldClass}
                        value={partyForm.partyName}
                        onChange={(e) =>
                          setPartyForm((previous) => ({
                            ...previous,
                            partyName: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Linked CRM Record ID
                      </label>
                      <input
                        type="number"
                        min="1"
                        className={fieldClass}
                        value={partyForm.linkedRecordId}
                        onChange={(e) =>
                          setPartyForm((previous) => ({
                            ...previous,
                            linkedRecordId: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Phone</label>
                      <input
                        type="tel"
                        maxLength={30}
                        className={fieldClass}
                        value={partyForm.phone}
                        onChange={(e) =>
                          setPartyForm((previous) => ({
                            ...previous,
                            phone: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Email</label>
                      <input
                        type="email"
                        maxLength={255}
                        className={fieldClass}
                        value={partyForm.email}
                        onChange={(e) =>
                          setPartyForm((previous) => ({
                            ...previous,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Address</label>
                    <textarea
                      rows={2}
                      className={fieldClass}
                      value={partyForm.address}
                      onChange={(e) =>
                        setPartyForm((previous) => ({
                          ...previous,
                          address: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Remarks</label>
                    <textarea
                      rows={2}
                      className={fieldClass}
                      value={partyForm.remarks}
                      onChange={(e) =>
                        setPartyForm((previous) => ({
                          ...previous,
                          remarks: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={partyForm.isPrimaryParty}
                      onChange={(e) =>
                        setPartyForm((previous) => ({
                          ...previous,
                          isPrimaryParty: e.target.checked,
                        }))
                      }
                    />
                    Mark as primary party
                  </label>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={partySaving}
                      className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {partySaving ? 'Saving...' : 'Save Party'}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-5">
                {partiesLoading ? (
                  <p className="py-5 text-center text-sm text-gray-500">
                    Loading parties...
                  </p>
                ) : caseParties.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
                    No parties added to this case yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="p-3">Name</th>
                          <th className="p-3">Party Type</th>
                          <th className="p-3">Legal Role</th>
                          <th className="p-3">Phone</th>
                          <th className="p-3">CRM Record</th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseParties.map((party) => (
                          <tr key={party.id} className="border-t">
                            <td className="p-3 font-medium">
                              {party.partyName}
                              {party.isPrimaryParty && (
                                <span className="ml-2 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
                                  Primary
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {formatLabel(party.partyType)}
                            </td>
                            <td className="p-3">
                              {formatLabel(party.partyRole)}
                            </td>
                            <td className="p-3">
                              {party.phone || '—'}
                            </td>
                            <td className="p-3">
                              {party.linkedRecordId ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                            </div>
            </div>
          )}

          {/* LEGAL CASE HEARINGS */}
          {selectedCase && !detailLoading && (
            <div className="mt-6 border-t pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Hearings & Proceedings
                  </h3>
                  <p className="text-sm text-gray-500">
                    Scheduled hearings, proceedings and hearing history
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
  setShowHearingForm((previous) => !previous);
  setEditingHearingId(null);
  setHearingForm(initialHearingForm);
  setHearingFormError('');
  setHearingSuccess('');
}}
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  {showHearingForm ? 'Cancel' : '+ Add Hearing'}
                </button>
              </div>

              {hearingSuccess && (
                <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  {hearingSuccess}
                </p>
              )}

              {hearingsError && (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {hearingsError}
                </p>
              )}

              {showHearingForm && (
                <form
                  onSubmit={addCaseHearing}
                  className="mt-5 space-y-4 rounded-xl border bg-gray-50 p-4"
                >
                  <h4 className="font-semibold text-gray-900">
  {editingHearingId !== null
    ? `Edit Legal Case Hearing #${editingHearingId}`
    : 'Add Legal Case Hearing'}
</h4>

                  {hearingFormError && (
                    <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      {hearingFormError}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>
                        Hearing Date *
                      </label>
                      <input
                        type="date"
                        required
                        className={fieldClass}
                        value={hearingForm.hearingDate}
                        onChange={(e) =>
                          setHearingForm((previous) => ({
                            ...previous,
                            hearingDate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Hearing Status *
                      </label>
                      <select
                        required
                        className={fieldClass}
                        value={hearingForm.status}
                        onChange={(e) =>
                          setHearingForm((previous) => ({
                            ...previous,
                            status: e.target.value,
                          }))
                        }
                      >
                        {HEARING_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {formatLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Court / Authority
                      </label>
                      <input
                        type="text"
                        maxLength={255}
                        className={fieldClass}
                        value={hearingForm.courtOrAuthority}
                        onChange={(e) =>
                          setHearingForm((previous) => ({
                            ...previous,
                            courtOrAuthority: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Next Hearing Date
                      </label>
                      <input
                        type="date"
                        min={hearingForm.hearingDate || undefined}
                        className={fieldClass}
                        value={hearingForm.nextHearingDate}
                        onChange={(e) =>
                          setHearingForm((previous) => ({
                            ...previous,
                            nextHearingDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Hearing Outcome
                    </label>
                    <textarea
                      rows={2}
                      className={fieldClass}
                      placeholder="Outcome or decision from the hearing"
                      value={hearingForm.outcome}
                      onChange={(e) =>
                        setHearingForm((previous) => ({
                          ...previous,
                          outcome: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Proceedings Notes
                    </label>
                    <textarea
                      rows={3}
                      className={fieldClass}
                      placeholder="Arguments, proceedings, court directions..."
                      value={hearingForm.proceedingsNotes}
                      onChange={(e) =>
                        setHearingForm((previous) => ({
                          ...previous,
                          proceedingsNotes: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Remarks
                    </label>
                    <textarea
                      rows={2}
                      className={fieldClass}
                      value={hearingForm.remarks}
                      onChange={(e) =>
                        setHearingForm((previous) => ({
                          ...previous,
                          remarks: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-3">
  {editingHearingId !== null && (
    <button
      type="button"
      disabled={hearingSaving}
      onClick={() => {
        setEditingHearingId(null);
        setHearingForm(initialHearingForm);
        setHearingFormError('');
        setShowHearingForm(false);
      }}
      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      Cancel Editing
    </button>
  )}

  <button
    type="submit"
    disabled={hearingSaving}
                      className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {hearingSaving
  ? 'Saving...'
  : editingHearingId !== null
    ? 'Update Hearing'
    : 'Save Hearing'}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-5">
                {hearingsLoading ? (
                  <p className="py-5 text-center text-sm text-gray-500">
                    Loading hearing history...
                  </p>
                ) : caseHearings.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
                    No hearings recorded for this case yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="p-3">Hearing Date</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Court / Authority</th>
                          <th className="p-3">Outcome / Proceedings</th>
                          <th className="p-3">Next Hearing</th>
                          <th className="p-3">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {caseHearings.map((hearing) => (
                          <tr
                            key={hearing.id}
                            className="border-t align-top"
                          >
                            <td className="whitespace-nowrap p-3">
                              {formatDate(hearing.hearingDate)}
                            </td>

                            <td className="p-3">
                              {formatLabel(hearing.status)}
                            </td>

                            <td className="p-3">
                              {hearing.courtOrAuthority || '—'}
                            </td>

                            <td className="min-w-[220px] p-3">
                              {hearing.outcome && (
                                <p className="font-medium text-gray-900">
                                  {hearing.outcome}
                                </p>
                              )}

                              {hearing.proceedingsNotes && (
                                <p className="mt-1 whitespace-pre-wrap text-gray-600">
                                  {hearing.proceedingsNotes}
                                </p>
                              )}

                              {hearing.remarks && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Remarks: {hearing.remarks}
                                </p>
                              )}

                              {!hearing.outcome &&
                                !hearing.proceedingsNotes &&
                                !hearing.remarks && '—'}
                            </td>

                            <td className="whitespace-nowrap p-3">
                              {formatDate(hearing.nextHearingDate)}
                            </td>

                            <td className="whitespace-nowrap p-3">
  <button
    type="button"
    onClick={() => startEditingHearing(hearing)}
    disabled={hearingSaving}
    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
  >
    Edit
  </button>
</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}


{selectedCase && !detailLoading && (
  <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="mb-5">
      <h3 className="text-lg font-bold text-gray-900">
        Documents & Evidence
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Upload and manage legal documents, notices,
        evidence, and case-related files.
      </p>
    </div>

    <form
      onSubmit={uploadCaseDocument}
      className="rounded-lg border border-gray-200 bg-gray-50 p-4"
    >
      <h4 className="mb-4 text-sm font-semibold text-gray-800">
        Upload Document
      </h4>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Document Title *
          </label>
          <input
            type="text"
            value={documentTitle}
            onChange={(event) =>
              setDocumentTitle(event.target.value)
            }
            maxLength={255}
            required
            disabled={documentUploading}
            placeholder="e.g. Legal Notice"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            value={documentCategory}
            onChange={(event) =>
              setDocumentCategory(event.target.value)
            }
            disabled={documentUploading}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="OTHER">Other</option>
            <option value="LEGAL_NOTICE">Legal Notice</option>
            <option value="COURT_ORDER">Court Order</option>
            <option value="EVIDENCE">Evidence</option>
            <option value="AGREEMENT">Agreement</option>
            <option value="AFFIDAVIT">Affidavit</option>
            <option value="CASE_FILING">Case Filing</option>
            <option value="CORRESPONDENCE">Correspondence</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Remarks
          </label>
          <textarea
            value={documentRemarks}
            onChange={(event) =>
              setDocumentRemarks(event.target.value)
            }
            disabled={documentUploading}
            rows={2}
            placeholder="Optional document details"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Select File *
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            required={!documentFile}
            disabled={documentUploading}
            onChange={(event) =>
              setDocumentFile(
                event.target.files?.[0] || null,
              )
            }
            className="block w-full rounded-lg border border-gray-300 bg-white p-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            PDF, JPG, PNG or WEBP. Maximum 25 MB.
            Images above 1 MB are automatically compressed.
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={documentUploading || !documentFile}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {documentUploading
            ? 'Processing & Uploading...'
            : 'Upload Document'}
        </button>
      </div>
    </form>

    {documentsError && (
      <div
        role="alert"
        className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
      >
        {documentsError}
      </div>
    )}

    <div className="mt-6">
      <h4 className="mb-3 text-sm font-bold text-gray-900">
        Uploaded Documents ({caseDocuments.length})
      </h4>

      {documentsLoading ? (
        <p className="text-sm text-gray-500">
          Loading documents...
        </p>
      ) : caseDocuments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
          No documents uploaded for this case yet.
        </p>
      ) : (
        <div className="space-y-3">
          {caseDocuments.map((caseDocument) => (
            <div
              key={caseDocument.id}
              className="rounded-lg border border-gray-200 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-gray-900">
                    {caseDocument.title}
                  </p>

                  <p className="mt-1 break-all text-xs text-gray-500">
                    {caseDocument.fileName}
                  </p>

                  <p className="mt-2 text-xs text-gray-600">
                    {formatLabel(caseDocument.category)}
                    {' · '}
                    {(
                      Number(caseDocument.fileSize) /
                      (1024 * 1024)
                    ).toFixed(2)} MB
                    {' · '}
                    {formatDate(caseDocument.createdAt)}
                  </p>

                  {caseDocument.remarks && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                      {caseDocument.remarks}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openCaseDocument(caseDocument)
                    }
                    disabled={documentActionId !== null}
                    className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openCaseDocument(caseDocument, true)
                    }
                    disabled={documentActionId !== null}
                    className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    Download
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      hideCaseDocument(caseDocument)
                    }
                    disabled={documentActionId !== null}
                    className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    Hide
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
)}

        </div>
      )}
    </div>
  );
}

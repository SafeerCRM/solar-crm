'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getRolesFromToken(): string[] {
  try {
    const token = localStorage.getItem('token');

    if (!token) return [];

    const payloadPart = token.split('.')[1];

    if (!payloadPart) return [];

    const normalizedPayload = payloadPart
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const decodedPayload = JSON.parse(
      decodeURIComponent(
        window
          .atob(normalizedPayload)
          .split('')
          .map(
            (character) =>
              `%${character
                .charCodeAt(0)
                .toString(16)
                .padStart(2, '0')}`,
          )
          .join(''),
      ),
    );

    if (Array.isArray(decodedPayload?.roles)) {
      return decodedPayload.roles;
    }

    if (decodedPayload?.role) {
      return [decodedPayload.role];
    }

    return [];
  } catch (error) {
    console.error(
      'Failed to read roles from token:',
      error,
    );

    return [];
  }
}

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

type PendingDocument = {
  documentType: string;
  files: File[];
  remarks: string;
};

type Branch = {
  id: number;
  name: string;
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

export default function CreateProjectPage() {
  const router = useRouter();

  const [accessChecked, setAccessChecked] =
  useState(false);

const [directCreationBlocked, setDirectCreationBlocked] =
  useState(false);

  const [meetingId, setMeetingId] = useState('');
  const [meetingIdFromUrl, setMeetingIdFromUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
const [documentType, setDocumentType] = useState('');
const [documentRemarks, setDocumentRemarks] = useState('');
const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);

  const [branches, setBranches] = useState<Branch[]>([]);

  const [customerSearch, setCustomerSearch] = useState('');
const [customerResults, setCustomerResults] = useState<CustomerMaster[]>([]);

  const [form, setForm] = useState({
    meetingId: '',
    leadId: '',
    customerId: '',
customerCode: '',
    customerName: '',
    customerPhone: '',
    city: '',
    zone: '',
        address: '',
    gpsLatitude: '',
    gpsLongitude: '',
    gpsAddress: '',
    electricityKNumber: '',
    customerGmail: '',
    customerUserId: '',
customerUserName: '',
    aadhaarLinkedMobile: '',
    branchName: '',

    panelBrand: '',
    dcrPanelCount: '',
    nonDcrPanelCount: '',

    converterBrand: '',
    converterCapacity: '',
    converterPhase: '1PH',

    structureType: '',
    structureCapacityKw: '',
    buildingHeight: '',

    projectType: 'CASH',

subsidyCategory: 'SUBSIDY',

marginMoney: '',
loanAmount: '',

subsidyType: 'NATIONAL',

    projectCost: '',

    finalCost: '',

    discomName: '',

    discomExpenditureType: 'EXCLUDING',
    discomExpenditureAmount: '',

    expectedLagat: '',
    expectedProfit: '',

    projectWorkState: 'IN_PROCESS',
projectWorkStateReason: '',

remarks: '',
  });

  const fetchLatestCalculatorForMeeting = async () => {
  if (!meetingIdFromUrl) return;

  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/calculator/meeting/${meetingIdFromUrl}`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    const calculators = Array.isArray(res.data) ? res.data : [];
    const latestCalculator = calculators[0];

    console.log('LATEST CALCULATOR:', latestCalculator);

    if (!latestCalculator) return;

    const totalProjectCost = Number(
      latestCalculator.finalCost ||
        latestCalculator.totalProjectCost ||
        0,
    );

    const marginAmount = Number(latestCalculator.marginAmount || 0);

    const expectedLagat = Number(
      latestCalculator.baseCostBeforeMargin ||
        totalProjectCost - marginAmount ||
        0,
    );

    setForm((prev) => ({
      ...prev,
      meetingId: String(meetingIdFromUrl),
      leadId: latestCalculator.leadId
        ? String(latestCalculator.leadId)
        : prev.leadId,
      customerName: latestCalculator.customerName || prev.customerName,
      customerPhone: latestCalculator.customerPhone || prev.customerPhone,
      city: latestCalculator.customerCity || prev.city,

      projectCost: String(latestCalculator.totalProjectCost || ''),
finalCost: String(latestCalculator.finalCost || ''),

expectedLagat: String(latestCalculator.baseCostBeforeMargin || ''),

marginMoney: String(
  latestCalculator.marginAmount || '',
),

expectedProfit: String(
  latestCalculator.expectedProfit || '',
),

panelBrand: [
  latestCalculator.panelCategory,
  latestCalculator.panelType,
  latestCalculator.wattPerPanel
    ? `${latestCalculator.wattPerPanel}W`
    : '',
]
  .filter(Boolean)
  .join(' | '),

dcrPanelCount:
  latestCalculator.panelCategory === 'DCR'
    ? String(latestCalculator.numberOfPanels || '')
    : '',

nonDcrPanelCount:
  latestCalculator.panelCategory === 'NON_DCR'
    ? String(latestCalculator.numberOfPanels || '')
    : '',

converterBrand: String(
  latestCalculator.ongridBrand || '',
),

converterCapacity: latestCalculator.ongridWatt
  ? `${latestCalculator.ongridWatt} kW`
  : '',

structureType: String(
  latestCalculator.structureType || '',
),

structureCapacityKw: latestCalculator.structureWatt
  ? `${latestCalculator.structureWatt} kW`
  : '',

      remarks: prev.remarks
        ? prev.remarks
        : `Project created from Meeting ${meetingIdFromUrl} using latest calculator #${latestCalculator.id}`,
    }));
  } catch (error) {
    console.error('Failed to fetch latest calculator for meeting:', error);
  }
};

useEffect(() => {
  fetchLatestCalculatorForMeeting();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [meetingIdFromUrl]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const fetchBranches = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(`${API_BASE_URL}/project/branch`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    setBranches(res.data || []);
  } catch (error) {
    console.error('Failed to load branches', error);
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
  setForm((prev) => ({
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

useEffect(() => {
  fetchBranches();
}, []);

const addPendingDocument = () => {
  if (!documentType) {
    alert('Please select document type');
    return;
  }

  if (!selectedFiles.length) {
    alert('Please select files');
    return;
  }

  setPendingDocuments([
    ...pendingDocuments,
    {
      documentType,
      files: selectedFiles,
      remarks: documentRemarks,
    },
  ]);

  setDocumentType('');
  setSelectedFiles([]);
  setDocumentRemarks('');
};

const fetchMeetingPrefill = async () => {
  if (!meetingId) return;

  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/meetings/${meetingId}/detail`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    const meeting =
      res.data?.latestMeeting || res.data;

    if (!meeting) return;

    setForm((prev) => ({
      ...prev,
      meetingId: String(meeting.id || meetingId),
      leadId: meeting.leadId ? String(meeting.leadId) : '',
      customerName: meeting.customerName || prev.customerName,
      customerPhone: meeting.mobile || prev.customerPhone,
            address: meeting.address || meeting.gpsAddress || prev.address,
      gpsLatitude: meeting.gpsLatitude ? String(meeting.gpsLatitude) : prev.gpsLatitude,
      gpsLongitude: meeting.gpsLongitude ? String(meeting.gpsLongitude) : prev.gpsLongitude,
      gpsAddress: meeting.gpsAddress || prev.gpsAddress,
      remarks:
        meeting.notes ||
        meeting.managerRemarks ||
        meeting.siteObservation ||
        prev.remarks,
    }));
  } catch (error) {
    console.error('Failed to prefill meeting:', error);
  }
};

  const handleSubmit = async () => {
  if (loading) return;

  try {
    setLoading(true);

      const token = localStorage.getItem('token');

      const requiredCustomerFields = [
  { key: 'customerName', label: 'Customer Name' },
  { key: 'customerPhone', label: 'Customer Phone' },
  { key: 'city', label: 'City' },
  { key: 'zone', label: 'Zone' },
  { key: 'address', label: 'Project Address / Location' },
  { key: 'branchName', label: 'Branch' },
  { key: 'electricityKNumber', label: 'Electricity K Number' },
  { key: 'customerGmail', label: 'Customer Gmail' },
  { key: 'aadhaarLinkedMobile', label: 'Aadhaar Linked Mobile' },
];

const missingCustomerFields = requiredCustomerFields.filter(
  (field) => !String((form as any)[field.key] || '').trim(),
);

if (missingCustomerFields.length > 0) {
  alert(
    `Please fill required customer details: ${missingCustomerFields
      .map((field) => field.label)
      .join(', ')}`,
  );
  return;
}

      if (!pendingDocuments.length) {
  alert(
    'Please add required project documents before submitting',
  );
  return;
}

const uploadedDocumentTypes = pendingDocuments.map(
  (doc) => doc.documentType,
);

const commonRequiredDocuments = [
  'VENDOR_AGREEMENT',
  'AADHAAR',
  'ELECTRICITY_BILL',
  'PAN_CARD',
  'BANK_DOCUMENT',
];

const loanOnlyRequiredDocuments = [
  'CUSTOMER_PHOTO',
  'SITE_PHOTO',
  'LOAN_DOCUMENT',
  'PROPERTY_DOCUMENT',
];

const requiredDocuments =
  form.projectType === 'LOAN'
    ? [
        ...commonRequiredDocuments,
        ...loanOnlyRequiredDocuments,
      ]
    : commonRequiredDocuments;

const missingDocuments = requiredDocuments.filter(
  (doc) => !uploadedDocumentTypes.includes(doc),
);

if (missingDocuments.length > 0) {
  const documentLabelMap: Record<string, string> = {
  VENDOR_AGREEMENT: 'Vendor Agreement',
  AADHAAR: 'Aadhaar Card',
  ELECTRICITY_BILL: 'Electricity Bill',
  PAN_CARD: 'PAN Card',
  BANK_DOCUMENT: 'Bank Document',
  CUSTOMER_PHOTO: 'Customer Photo',
  SITE_PHOTO: 'Site Photo',
  LOAN_DOCUMENT: 'Proposal / Quotation',
  PROPERTY_DOCUMENT: 'Property Document',
};

alert(
  `Please upload required documents: ${missingDocuments
    .map((doc) => documentLabelMap[doc] || doc.replaceAll('_', ' '))
    .join(', ')}`,
);
  return;
}

const projectRes = await axios.post(
  `${API_BASE_URL}/project/create`,
  form,
  {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  },
);

const createdProjectId = projectRes.data?.id;

if (!createdProjectId) {
  throw new Error('Project created but project ID was not returned');
}

for (const pendingDoc of pendingDocuments) {
  const formData = new FormData();

  for (const file of pendingDoc.files) {
  const uploadFile = await compressImageFile(file);
  formData.append('files', uploadFile);
}

  formData.append('projectId', String(createdProjectId));
  formData.append('department', 'PROJECT_CREATION');
  formData.append('documentType', pendingDoc.documentType);
  formData.append('remarks', pendingDoc.remarks);

  await axios.post(
    `${API_BASE_URL}/project/documents/upload`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    },
  );
}

alert('Project created and documents uploaded successfully');

router.push(`/project/${createdProjectId}`);
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message || 'Failed to create project',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const params = new URLSearchParams(
    window.location.search,
  );

  const id =
    params.get('meetingId') || '';

  const roles =
    getRolesFromToken();

  const isMeetingManager =
    roles.includes(
      'MEETING_MANAGER',
    );

  const isDirectCreation =
    !String(id).trim();

  setMeetingId(id);
  setMeetingIdFromUrl(id);

  setDirectCreationBlocked(
    isMeetingManager &&
      isDirectCreation,
  );

  setAccessChecked(true);
}, []);

  useEffect(() => {
  fetchMeetingPrefill();
}, [meetingId]);

if (!accessChecked) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl bg-white p-6 text-center shadow">
        <p className="font-semibold text-gray-700">
          Checking project creation access...
        </p>
      </div>
    </div>
  );
}

if (directCreationBlocked) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow">
        <h1 className="text-xl font-bold text-amber-900">
          Direct Project Creation Disabled
        </h1>

        <p className="mt-3 text-sm leading-6 text-amber-800">
          Meeting Managers cannot create a project
          directly. Please create a meeting for the
          contact first, then convert that meeting
          into a project.
        </p>

        <button
          type="button"
          onClick={() =>
            router.push('/project')
          }
          className="mt-5 rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
        >
          Back to Projects
        </button>
      </div>
    </div>
  );
}

  return (
    <div className="mx-auto max-w-7xl space-y-5">
        <input
  type="hidden"
  value={form.meetingId || ''}
/>

<input
  type="hidden"
  value={form.leadId || ''}
/>
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Create Project
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Fill project order details carefully before submitting for approval.
        </p>

        {meetingId && (
  <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
    <p className="text-sm font-semibold text-blue-700">
      Project is being created from Meeting #{meetingId}
    </p>

    <p className="mt-1 text-sm text-blue-600">
      Customer details and notes were prefilled automatically.
      Please verify remaining project details before submission.
    </p>
  </div>
)}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Customer Details
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <input
            name="customerName"
            placeholder="Customer Name"
            value={form.customerName}
            onChange={handleChange}
            className={`rounded-xl border p-3 ${
  meetingId
    ? 'border-blue-300 bg-blue-50'
    : ''
}`}
          />

          <input
            name="customerPhone"
            placeholder="Customer Phone"
            value={form.customerPhone}
            onChange={handleChange}
            className={`rounded-xl border p-3 ${
  meetingId
    ? 'border-blue-300 bg-blue-50'
    : ''
}`}
          />

          <input
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="zone"
            placeholder="Zone"
            value={form.zone}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

                    <textarea
            name="address"
            placeholder="Project Address / Location"
            value={form.address}
            onChange={handleChange}
            className="rounded-xl border p-3 md:col-span-3"
            rows={3}
          />

          <select
  name="branchName"
  value={form.branchName}
  onChange={handleChange}
  className="rounded-xl border p-3"
>
  <option value="">Select Branch</option>

  {branches.map((branch) => (
    <option key={branch.id} value={branch.name}>
      {branch.name}
    </option>
  ))}
</select>

          <input
            name="electricityKNumber"
            placeholder="Electricity K Number"
            value={form.electricityKNumber}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="customerGmail"
            placeholder="Customer Gmail"
            value={form.customerGmail}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <div className="relative md:col-span-3">
  <input
    placeholder="Search Customer Master by Code / Name / Mobile / K Number"
    value={customerSearch}
    onChange={(e) => searchCustomers(e.target.value)}
    className="w-full rounded-xl border p-3"
  />

  {form.customerCode && (
    <p className="mt-1 text-xs font-semibold text-green-700">
      Linked Customer: {form.customerCode} - {form.customerName}
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

          <input
            name="aadhaarLinkedMobile"
            placeholder="Aadhaar Linked Mobile"
            value={form.aadhaarLinkedMobile}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Technical Details
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <input
            name="panelBrand"
            placeholder="Panel Brand"
            value={form.panelBrand}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            name="dcrPanelCount"
            placeholder="DCR Panel Count"
            value={form.dcrPanelCount}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            name="nonDcrPanelCount"
            placeholder="Non DCR Panel Count"
            value={form.nonDcrPanelCount}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="converterBrand"
            placeholder="Converter Brand"
            value={form.converterBrand}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="converterCapacity"
            placeholder="Converter Capacity"
            value={form.converterCapacity}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <select
            name="converterPhase"
            value={form.converterPhase}
            onChange={handleChange}
            className="rounded-xl border p-3"
          >
            <option value="1PH">1 PH</option>
            <option value="3PH">3 PH</option>
          </select>

          <select
  name="structureType"
  value={form.structureType}
  onChange={handleChange}
  className="rounded-xl border p-3"
>
  <option value="">Select Structure Type</option>
  <option value="ROOFTOP_PIPES">Rooftop Pipes</option>
  <option value="ROOFTOP_C_CHANNEL">Rooftop C Channel</option>
  <option value="TIN_SHADE">Tin Shade</option>
</select>

          <input
            name="structureCapacityKw"
            placeholder="Structure Capacity KW"
            value={form.structureCapacityKw}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="buildingHeight"
            placeholder="Building Height"
            value={form.buildingHeight}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Calculator Financial Summary / Project Finance Details
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <select
            name="projectType"
            value={form.projectType}
            onChange={handleChange}
            className="rounded-xl border p-3"
          >
            <option value="CASH">Cash Project</option>
            <option value="LOAN">Loan Project</option>
          </select>

          <select
  name="subsidyCategory"
  value={form.subsidyCategory}
  onChange={handleChange}
  className="rounded-xl border p-3"
>
  <option value="SUBSIDY">
    Subsidy Project
  </option>

  <option value="NON_SUBSIDY">
    Non-Subsidy Project
  </option>
</select>

          {form.projectType === 'LOAN' && (
            <>
              <input
                type="number"
                name="marginMoney"
                placeholder="Margin Money"
                value={form.marginMoney}
                onChange={handleChange}
                className="rounded-xl border p-3"
              />

              <input
                type="number"
                name="loanAmount"
                placeholder="Loan Amount"
                value={form.loanAmount}
                onChange={handleChange}
                className="rounded-xl border p-3"
              />
            </>
          )}

          {form.subsidyCategory ===
  'SUBSIDY' && (
  <select
    name="subsidyType"
    value={form.subsidyType}
    onChange={handleChange}
    className="rounded-xl border p-3"
  >
    <option value="NATIONAL">
      National
    </option>

    <option value="NATIONAL_STATE">
      National + State
    </option>
  </select>
)}

          <input
            type="number"
            name="projectCost"
            placeholder="Project Cost"
            value={form.projectCost}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
  type="number"
  name="finalCost"
  placeholder="Final Cost After Discount"
  value={form.finalCost}
  onChange={handleChange}
  className="rounded-xl border p-3"
/>

          <input
            name="discomName"
            placeholder="DISCOM Name"
            value={form.discomName}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <select
            name="discomExpenditureType"
            value={form.discomExpenditureType}
            onChange={handleChange}
            className="rounded-xl border p-3"
          >
            <option value="INCLUDING">Including</option>
            <option value="EXCLUDING">Excluding</option>
          </select>

          {form.discomExpenditureType === 'INCLUDING' && (
            <input
              type="number"
              name="discomExpenditureAmount"
              placeholder="DISCOM Expenditure Amount"
              value={form.discomExpenditureAmount}
              onChange={handleChange}
              className="rounded-xl border p-3"
            />
          )}

          <input
            type="number"
            name="expectedLagat"
            placeholder="Expected Laagat"
            value={form.expectedLagat}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            name="expectedProfit"
            placeholder="Expected Profit"
            value={form.expectedProfit}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />
        </div>
      </div>

      <div className="md:col-span-2">
  <label className="mb-1 block text-sm font-semibold">
    Project Work State
  </label>

  <select
    name="projectWorkState"
    value={form.projectWorkState}
    onChange={handleChange}
    className="w-full rounded-xl border p-3"
  >
    <option value="IN_PROCESS">In Process</option>
    <option value="RUNNING">Running</option>
  </select>
</div>

<div className="md:col-span-2">
  <label className="mb-1 block text-sm font-semibold">
    Work State Reason / Remark
  </label>

  <textarea
    name="projectWorkStateReason"
    value={form.projectWorkStateReason}
    onChange={handleChange}
    placeholder="Example: Customer requested installation after 10 days."
    className="w-full rounded-xl border p-3"
    rows={3}
  />
</div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Remarks
        </h2>

        <textarea
          name="remarks"
          placeholder="Write remarks..."
          value={form.remarks}
          onChange={handleChange}
          rows={4}
          className="w-full rounded-xl border p-3"
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <h2 className="mb-4 text-lg font-bold text-gray-800">
    Project Documents
  </h2>

  <p className="mb-4 text-sm text-gray-500">
    Upload required documents before submitting project for approval.
  </p>

  <div className="mt-3 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800">
  <p className="font-semibold">
    Mandatory Documents:
  </p>

  <ul className="mt-2 list-disc pl-5">
  <li>Vendor Agreement</li>
  <li>Aadhaar Card</li>
  <li>Electricity Bill</li>
  <li>PAN Card</li>
  <li>Bank Document</li>

  {form.projectType === 'LOAN' && (
    <>
      <li>Customer Photo</li>
      <li>Site Photo</li>
      <li>Proposal / Quotation</li>
      <li>Property Document</li>
    </>
  )}
</ul>

<p className="mt-2 text-xs">
  Current Project Type: {form.projectType}
</p>
</div>

  <div className="grid gap-3 md:grid-cols-2">
    <select
  value={documentType}
  onChange={(e) =>
    setDocumentType(e.target.value)
  }
  className="rounded-xl border p-3"
>
  <option value="">
    Select Document Type
  </option>

  <option value="AADHAAR">
    Aadhaar Card
  </option>

  <option value="ELECTRICITY_BILL">
    Electricity Bill
  </option>

  <option value="PAN_CARD">
  PAN Card
</option>

<option value="VENDOR_AGREEMENT">
  Vendor Agreement
</option>

  <option value="CUSTOMER_PHOTO">
    Customer Photo
  </option>

  <option value="SITE_PHOTO">
    Site Photo
  </option>

  <option value="BANK_DOCUMENT">
    Bank Document
  </option>

  <option value="LOAN_DOCUMENT">
    Proposal / Quotation
  </option>

  <option value="PROPERTY_DOCUMENT">
    Property Document
  </option>

  <option value="OTHER">
    Other
  </option>
</select>

    <input
  type="file"
  multiple
  accept=".pdf,.jpg,.jpeg,.png,.webp"
  onChange={(e) =>
    setSelectedFiles(
      Array.from(e.target.files || []),
    )
  }
  className="rounded-xl border p-3"
/>

<button
  type="button"
  onClick={addPendingDocument}
  className="rounded-xl bg-gray-800 px-4 py-3 text-sm font-semibold text-white hover:bg-black"
>
  Add Document
</button>

  </div>

  <textarea
    placeholder="Document remarks"
    value={documentRemarks}
    onChange={(e) => setDocumentRemarks(e.target.value)}
    rows={3}
    className="mt-3 w-full rounded-xl border p-3"
  />

  {pendingDocuments.length > 0 && (
  <div className="mt-4 rounded-xl bg-gray-50 p-4">
    <p className="text-sm font-semibold text-gray-700">
      Added documents:
    </p>

    <div className="mt-3 space-y-2">
      {pendingDocuments.map((doc, index) => (
        <div
          key={`${doc.documentType}-${index}`}
          className="rounded-lg border bg-white p-3 text-sm"
        >
          <p className="font-semibold text-gray-800">
  {doc.documentType === 'LOAN_DOCUMENT'
    ? 'Proposal / Quotation'
    : doc.documentType.replaceAll('_', ' ')}
</p>

          <p className="text-gray-500">
            {doc.files.length} file(s)
          </p>

          <button
            type="button"
            onClick={() =>
              setPendingDocuments(
                pendingDocuments.filter(
                  (_, docIndex) => docIndex !== index,
                ),
              )
            }
            className="mt-2 text-xs font-semibold text-red-600"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  </div>
)}
</div>

      <div className="pb-10">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? 'Creating Project...'
            : 'Submit Project For Approval'}
        </button>
      </div>
    </div>
  );
}
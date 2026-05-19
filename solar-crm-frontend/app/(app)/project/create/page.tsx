'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type PendingDocument = {
  documentType: string;
  files: File[];
  remarks: string;
};

type Branch = {
  id: number;
  name: string;
};

export default function CreateProjectPage() {
  const router = useRouter();

  const [meetingId, setMeetingId] = useState('');
  const [meetingIdFromUrl, setMeetingIdFromUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
const [documentType, setDocumentType] = useState('');
const [documentRemarks, setDocumentRemarks] = useState('');
const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);

  const [branches, setBranches] = useState<Branch[]>([]);

  const [form, setForm] = useState({
    meetingId: '',
    leadId: '',
    customerName: '',
    customerPhone: '',
    city: '',
    zone: '',
    electricityKNumber: '',
    customerGmail: '',
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
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      if (!pendingDocuments.length) {
  alert(
    'Please add required project documents before submitting',
  );
  return;
}

const uploadedDocumentTypes = pendingDocuments.map(
  (doc) => doc.documentType,
);

const requiredDocuments = [
  'AADHAAR',
  'ELECTRICITY_BILL',
];

const missingDocuments = requiredDocuments.filter(
  (doc) => !uploadedDocumentTypes.includes(doc),
);

if (missingDocuments.length > 0) {
  alert(
    `Please upload required documents: ${missingDocuments.join(
      ', ',
    )}`,
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

  pendingDoc.files.forEach((file) => {
    formData.append('files', file);
  });

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
  const params = new URLSearchParams(window.location.search);
  const id = params.get('meetingId') || '';

  setMeetingId(id);
  setMeetingIdFromUrl(id);
}, []);

  useEffect(() => {
  fetchMeetingPrefill();
}, [meetingId]);

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

          <select
            name="subsidyType"
            value={form.subsidyType}
            onChange={handleChange}
            className="rounded-xl border p-3"
          >
            <option value="NATIONAL">National</option>
            <option value="NATIONAL_STATE">
              National + State
            </option>
          </select>

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
    <li>Aadhaar Card</li>
    <li>Electricity Bill</li>
  </ul>
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
    Loan Document
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
            {doc.documentType}
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
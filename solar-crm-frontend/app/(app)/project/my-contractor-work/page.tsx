'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import dayjs, { Dayjs } from 'dayjs';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type ContractorProject = {
  id: number;
  projectId: number;
  contractorName?: string;
  workScope?: string;
  assignedWorkItems?: string[];
  contractorPhone?: string;

  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;

  amount?: number;
  status?: string;
  remarks?: string;
  assignedByName?: string;
  createdAt?: string;
    project?: {
    id?: number;
    customerName?: string;
    customerPhone?: string;
    address?: string;
    gpsAddress?: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
    city?: string;
    zone?: string;
    branchName?: string;
    projectSize?: string;

projectType?: string;

panelBrand?: string;
dcrPanelCount?: number;
nonDcrPanelCount?: number;

converterBrand?: string;
converterCapacity?: string;
converterPhase?: string;

structureType?: string;
structureCapacityKw?: string;
buildingHeight?: string;

projectOwnerName?: string;
  };
};

type ContractorProof = {
  id: number;
  projectId: number;
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
  project?: any;
};

type RescheduleRequest = {
  id: number;
  projectId: number;
  assignmentType?: string;
  assignmentId: number;
  oldDate?: string;
  oldTime?: string;
  requestedDate?: string;
  requestedTime?: string;
  reason?: string;
  status?: string;
  approvalNote?: string;
  createdAt?: string;
};

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

const HINDI_STATUS: Record<string, string> = {
  ASSIGNED: 'कार्य सौंपा गया',
  IN_PROGRESS: 'कार्य चालू',
  ON_HOLD: 'कार्य रोका गया',
  PENDING_FINAL_PROOFS: 'अंतिम फोटो बाकी',
  COMPLETED: 'कार्य पूर्ण',
  PENDING: 'बाकी',
};

const HINDI_SCOPE: Record<string, string> = {
  FULL_PROJECT: 'पूरा प्रोजेक्ट',
  STRUCTURE_TEAM: 'स्ट्रक्चर टीम',
  ELECTRICAL_TEAM: 'इलेक्ट्रिकल टीम',
  INSTALLATION_TEAM: 'इंस्टॉलेशन टीम',
  OTHER: 'अन्य कार्य',
};

const HINDI_PROOF: Record<string, string> = {
  STRUCTURE_PHOTO: 'स्ट्रक्चर फोटो',
  PILLAR_PHOTO: 'पिलर फोटो',
  PANEL_SERIAL_NUMBER_PHOTO: 'पैनल सीरियल नंबर फोटो',
  INVERTER_PHOTO: 'इन्वर्टर फोटो',
  SOLAR_METER_PHOTO: 'सोलर मीटर फोटो',
  NET_METER_PHOTO: 'नेट मीटर फोटो',
  EARTHING_WITH_CLIENT_PHOTO: 'अर्थिंग फोटो',
  PANEL_WITH_CLIENT_PHOTO: 'ग्राहक के साथ पैनल फोटो',
  OTHER: 'अन्य फोटो',
};

const HINDI_WORK_ITEM: Record<string, string> = {
  STRUCTURE_WORK: 'स्ट्रक्चर का काम',
  STRUCTURE_INSPECTION: 'स्ट्रक्चर निरीक्षण',
  PILLAR_WORK: 'पिलर का काम',
  PILLAR_INSPECTION: 'पिलर निरीक्षण',
  PANEL_INSTALLATION: 'पैनल इंस्टॉलेशन',
  INVERTER_INSTALLATION: 'इन्वर्टर इंस्टॉलेशन',
  WIRING: 'वायरिंग',
  EARTHING: 'अर्थिंग',
  SOLAR_METER_WORK: 'सोलर मीटर का काम',
  NET_METER_WORK: 'नेट मीटर का काम',
  GENERATION_WORK: 'जनरेशन का काम',
  OTHER: 'अन्य काम',
};

const getHindiWorkItem = (value?: string) =>
  HINDI_WORK_ITEM[value || ''] ||
  String(value || '-').replaceAll('_', ' ');

const getHindiStatus = (value?: string) =>
  HINDI_STATUS[value || ''] ||
  String(value || '-').replaceAll('_', ' ');

const getHindiScope = (value?: string) =>
  HINDI_SCOPE[value || ''] ||
  String(value || '-').replaceAll('_', ' ');

const getHindiProof = (value?: string) =>
  HINDI_PROOF[value || ''] ||
  String(value || '-').replaceAll('_', ' ');

function money(value?: number) {
  return `₹${Number(value || 0).toLocaleString(
    'en-IN',
  )}`;
}

export default function MyContractorWorkPage() {
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<
    ContractorProject[]
  >([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [proofs, setProofs] =
  useState<Record<number, ContractorProof[]>>({});

const [proofFiles, setProofFiles] =
  useState<Record<number, File[]>>({});

const [proofType, setProofType] =
  useState<Record<number, string>>({});

const [proofRemarks, setProofRemarks] =
  useState<Record<number, string>>({});

const [gpsData, setGpsData] =
  useState<Record<number, {
    latitude?: string;
    longitude?: string;
    gpsAddress?: string;
  }>>({});

const [uploadingProofId, setUploadingProofId] =
  useState<number | null>(null);
  const [comments, setComments] =
  useState<Record<number, ContractorComment[]>>({});

const [commentText, setCommentText] =
  useState<Record<number, string>>({});

const [commentLoadingId, setCommentLoadingId] =
  useState<number | null>(null);
  const [cleaningAssignments, setCleaningAssignments] =
  useState<CleaningAssignment[]>([]);

const [cleaningRemarks, setCleaningRemarks] =
  useState<Record<number, string>>({});

const [cleaningUpdatingId, setCleaningUpdatingId] =
  useState<number | null>(null);

  const [selectedWorkDate, setSelectedWorkDate] =
  useState<Dayjs | null>(dayjs());

const [rescheduleRequests, setRescheduleRequests] =
  useState<RescheduleRequest[]>([]);

const [postponeForm, setPostponeForm] =
  useState<Record<string, {
    requestedDate: string;
    requestedTime: string;
    reason: string;
  }>>({});

  const fetchProjects = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      const res = await axios.get(
        `${API_BASE_URL}/project/contractor/my-projects`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      const assignedProjects = Array.isArray(res.data)
  ? res.data
  : [];

setProjects(assignedProjects);

assignedProjects.forEach((item: ContractorProject) => {
  if (item?.id) {
    fetchProofs(item.id);
    fetchComments(item.id);
  }
});
    } catch (error) {
      console.error(error);
      alert(
        'दिए गए कॉन्ट्रैक्टर प्रोजेक्ट लोड नहीं हो पाए',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCleaningAssignments = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/cleaning/my`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setCleaningAssignments(
      Array.isArray(res.data) ? res.data : [],
    );
  } catch (error) {
    console.error(
      'Failed to load cleaning assignments:',
      error,
    );
  }
};

  const updateContractorWork = async (
  assignmentId: number,
  status: string,
  remarks?: string,
) => {
  try {
    setUpdatingId(assignmentId);

    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/contractor-assignment/${assignmentId}`,
      {
        status,
        remarks,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('काम अपडेट हो गया');

    fetchProjects();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'काम अपडेट नहीं हो पाया',
    );
  } finally {
    setUpdatingId(null);
  }
};

const updateCleaningStatus = async (
  id: number,
  status: string,
) => {
  try {
    setCleaningUpdatingId(id);

    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/cleaning/${id}`,
      {
        status,
        completionRemarks:
          cleaningRemarks[id] || '',
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('सफाई कार्य अपडेट हो गया');

    fetchCleaningAssignments();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'सफाई कार्य अपडेट नहीं हो पाया',
    );
  } finally {
    setCleaningUpdatingId(null);
  }
};

const fetchProofs = async (assignmentId: number) => {
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

    setProofs((prev) => ({
      ...prev,
      [assignmentId]: Array.isArray(res.data)
        ? res.data
        : [],
    }));
  } catch (error) {
    console.error('Failed to load contractor proofs:', error);
  }
};

const captureGps = (assignmentId: number) => {
  if (!navigator.geolocation) {
    alert('GPS is not supported on this device');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
  const latitude = String(
    position.coords.latitude,
  );

  const longitude = String(
    position.coords.longitude,
  );

  let gpsAddress = '';

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
    );

    const data = await response.json();

    gpsAddress =
      data?.display_name || '';
  } catch (error) {
    console.error(
      'Failed to fetch GPS address:',
      error,
    );
  }

  setGpsData((prev) => ({
    ...prev,
    [assignmentId]: {
      latitude,
      longitude,
      gpsAddress,
    },
  }));

  alert('GPS सफलतापूर्वक कैप्चर हो गया');
},
    () => {
      alert('Unable to capture GPS location');
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    },
  );
};

const uploadContractorProofs = async (
  item: ContractorProject,
) => {
  const files = proofFiles[item.id] || [];

  if (!files.length) {
    alert('कृपया फोटो चुनें');
    return;
  }

  if (!proofType[item.id]) {
    alert('कृपया फोटो का प्रकार चुनें');
    return;
  }

  const gps = gpsData[item.id];

  if (!gps?.latitude || !gps?.longitude) {
    alert('फोटो अपलोड करने से पहले GPS कैप्चर करें');
    return;
  }

  try {
    setUploadingProofId(item.id);

    const token = localStorage.getItem('token');

    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('assignmentId', String(item.id));
    formData.append('projectId', String(item.projectId));
    formData.append('proofType', proofType[item.id]);
    formData.append('latitude', gps.latitude);
    formData.append('longitude', gps.longitude);
    formData.append('gpsAddress', gps.gpsAddress || '');
    formData.append('remarks', proofRemarks[item.id] || '');

    await axios.post(
      `${API_BASE_URL}/project/contractor-proof/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    alert('फोटो सफलतापूर्वक अपलोड हो गया');

    setProofFiles((prev) => ({
      ...prev,
      [item.id]: [],
    }));

    setProofRemarks((prev) => ({
      ...prev,
      [item.id]: '',
    }));

    fetchProofs(item.id);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'फोटो अपलोड नहीं हो पाया',
    );
  } finally {
    setUploadingProofId(null);
  }
};

const fetchMyRescheduleRequests = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/contractor-reschedule/my`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    setRescheduleRequests(Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.error('Failed to load postpone requests:', error);
  }
};

const requestPostpone = async (
  assignmentType: 'SITE_WORK' | 'CLEANING',
  assignmentId: number,
) => {
  const key = `${assignmentType}-${assignmentId}`;
  const form = postponeForm[key];

  if (!form?.requestedDate) {
    alert('Please select requested date');
    return;
  }

  if (!form?.reason?.trim()) {
    alert('Please enter postpone reason');
    return;
  }

  try {
    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/contractor-reschedule/request`,
      {
        assignmentType,
        assignmentId,
        requestedDate: form.requestedDate,
        requestedTime: form.requestedTime,
        reason: form.reason,
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    alert('Postpone request sent for approval');

    setPostponeForm((prev) => ({
      ...prev,
      [key]: {
        requestedDate: '',
        requestedTime: '',
        reason: '',
      },
    }));

    fetchMyRescheduleRequests();
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to request postpone');
  }
};

const fetchComments = async (assignmentId: number) => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/contractor-assignment/${assignmentId}/comments`,
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      },
    );

    setComments((prev) => ({
      ...prev,
      [assignmentId]: Array.isArray(res.data)
        ? res.data
        : [],
    }));
  } catch (error) {
    console.error('Failed to load contractor comments:', error);
  }
};

const submitComment = async (
  item: ContractorProject,
  commentType = 'GENERAL',
) => {
  const text = String(commentText[item.id] || '').trim();

  if (!text) {
    alert('Please write a comment');
    return;
  }

  try {
    setCommentLoadingId(item.id);

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
          ? { Authorization: `Bearer ${token}` }
          : {},
      },
    );

    setCommentText((prev) => ({
      ...prev,
      [item.id]: '',
    }));

    fetchComments(item.id);
  } catch (error: any) {
    console.error(error);
    alert(
      error?.response?.data?.message ||
        'Failed to add comment',
    );
  } finally {
    setCommentLoadingId(null);
  }
};

  useEffect(() => {
  fetchProjects();
  fetchCleaningAssignments();
  fetchMyRescheduleRequests();
}, []);

const selectedDateKey = selectedWorkDate
  ? selectedWorkDate.format('YYYY-MM-DD')
  : '';

const selectedSiteWorks = projects.filter((item) =>
  item.scheduledDate
    ? item.scheduledDate.split('T')[0] === selectedDateKey
    : false,
);

const selectedCleaningWorks = cleaningAssignments.filter(
  (item) => item.cleaningDate === selectedDateKey,
);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          मेरा कॉन्ट्रैक्टर कार्य
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          अपने दिए गए प्रोजेक्ट और काम की तारीख देखें।
        </p>
      </div>

      <div className="rounded-2xl bg-green-50 p-5 shadow">
  <div className="flex items-center justify-between">
    <h2 className="text-xl font-bold text-gray-800">
      मेरा सफाई कार्य
    </h2>

    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
      {cleaningAssignments.length}
    </span>
  </div>

  {cleaningAssignments.length === 0 ? (
    <p className="mt-4 text-sm text-gray-500">
      कोई सफाई कार्य उपलब्ध नहीं है।
    </p>
  ) : (
    <div className="mt-4 space-y-4">
      {cleaningAssignments.map((cleaning) => (
        <div
          key={cleaning.id}
          className="rounded-xl border bg-white p-4"
        >
          <p className="font-bold text-gray-800">
            प्रोजेक्ट #{cleaning.projectId}
          </p>

          <p className="mt-1 text-sm text-gray-700">
            ग्राहक:{' '}
            {cleaning.project?.customerName || '-'}
          </p>

          <p className="text-sm text-gray-700">
            फोन:{' '}
            {cleaning.project?.customerPhone || '-'}
          </p>

          <p className="text-sm text-gray-700">
            तारीख: {cleaning.cleaningDate || '-'}
          </p>

          <p className="text-sm text-gray-700">
            समय: {cleaning.cleaningTime || '-'}
          </p>

          <p className="text-sm text-gray-700">
            स्थिति: {cleaning.status || '-'}
          </p>

          <p className="mt-2 text-sm text-gray-700">
            {cleaning.remarks || '-'}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {cleaning.project?.customerPhone && (
              <a
                href={`tel:${cleaning.project.customerPhone}`}
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
              >
                ग्राहक को कॉल करें
              </a>
            )}

            {(cleaning.project?.gpsLatitude &&
              cleaning.project?.gpsLongitude) ||
            cleaning.project?.gpsAddress ? (
              <a
                target="_blank"
                rel="noreferrer"
                href={
                  cleaning.project?.gpsLatitude &&
                  cleaning.project?.gpsLongitude
                    ? `https://www.google.com/maps?q=${cleaning.project.gpsLatitude},${cleaning.project.gpsLongitude}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        cleaning.project?.gpsAddress || '',
                      )}`
                }
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                लोकेशन खोलें
              </a>
            ) : null}
          </div>

          <textarea
            placeholder="काम पूरा होने की टिप्पणी"
            value={cleaningRemarks[cleaning.id] || ''}
            onChange={(e) =>
              setCleaningRemarks((prev) => ({
                ...prev,
                [cleaning.id]: e.target.value,
              }))
            }
            className="mt-4 w-full rounded-xl border p-3"
            rows={2}
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() =>
                updateCleaningStatus(
                  cleaning.id,
                  'IN_PROGRESS',
                )
              }
              disabled={cleaningUpdatingId === cleaning.id}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              सफाई शुरू करें
            </button>

            <button
              onClick={() =>
                updateCleaningStatus(
                  cleaning.id,
                  'COMPLETED',
                )
              }
              disabled={cleaningUpdatingId === cleaning.id}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
            >
              सफाई पूर्ण करें
            </button>
          </div>

          <PostponeBox
  formKey={`CLEANING-${cleaning.id}`}
  value={postponeForm[`CLEANING-${cleaning.id}`]}
  setPostponeForm={setPostponeForm}
  onSubmit={() => requestPostpone('CLEANING', cleaning.id)}
/>
        </div>
      ))}
    </div>
  )}
</div>

<div className="grid gap-4 lg:grid-cols-2">
  <div className="rounded-2xl bg-white p-5 shadow">
    <h2 className="text-xl font-bold text-gray-800">
      मेरा काम कैलेंडर
    </h2>

    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar
        value={selectedWorkDate}
        onChange={(value) => setSelectedWorkDate(value)}
      />
    </LocalizationProvider>
  </div>

  <div className="rounded-2xl bg-white p-5 shadow">
    <h2 className="text-xl font-bold text-gray-800">
      {selectedDateKey || '-'} का काम
    </h2>

    {selectedSiteWorks.length === 0 &&
    selectedCleaningWorks.length === 0 ? (
      <p className="mt-4 text-sm text-gray-500">
        इस तारीख को कोई काम नहीं है।
      </p>
    ) : (
      <div className="mt-4 space-y-3">
        {selectedSiteWorks.map((item) => (
          <WorkCalendarCard
            key={`site-${item.id}`}
            title={`Site Work - Project #${item.projectId}`}
            subtitle={item.project?.customerName || ''}
            status={item.status || 'ASSIGNED'}
            href={`/project/${item.projectId}`}
          />
        ))}

        {selectedCleaningWorks.map((item) => (
          <WorkCalendarCard
            key={`cleaning-${item.id}`}
            title={`Cleaning - Project #${item.projectId}`}
            subtitle={item.project?.customerName || ''}
            status={item.status || 'ASSIGNED'}
            href={`/project/${item.projectId}`}
          />
        ))}
      </div>
    )}
  </div>
</div>

      {loading ? (
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            दिए गए प्रोजेक्ट लोड हो रहे हैं...
          </p>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            अभी कोई कॉन्ट्रैक्टर कार्य नहीं दिया गया है।
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-white p-5 shadow"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-bold text-gray-800">
                    प्रोजेक्ट #{item.projectId}
                  </p>

                  {item.project && (
  <div className="mt-3 rounded-xl bg-blue-50 p-3">
    <p className="font-semibold text-gray-800">
      ग्राहक: {item.project.customerName || '-'}
    </p>

    <p className="text-sm text-gray-600">
      फोन: {item.project.customerPhone || '-'}
    </p>

    <p className="text-sm text-gray-600">
      पता:{' '}
      {item.project.gpsAddress ||
        item.project.address ||
        '-'}
    </p>

    <div className="mt-3 flex flex-wrap gap-2">
      {item.project.customerPhone && (
        <a
          href={`tel:${item.project.customerPhone}`}
          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
        >
          ग्राहक को कॉल करें
        </a>
      )}

      {(item.project.gpsLatitude &&
        item.project.gpsLongitude) ||
      item.project.gpsAddress ? (
        <a
          target="_blank"
          rel="noreferrer"
          href={
            item.project.gpsLatitude &&
            item.project.gpsLongitude
              ? `https://www.google.com/maps?q=${item.project.gpsLatitude},${item.project.gpsLongitude}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  item.project.gpsAddress || '',
                )}`
          }
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          लोकेशन खोलें
        </a>
      ) : null}
    </div>
  </div>
)}

{item.project && (
  <div className="mt-3 rounded-xl bg-amber-50 p-3">
    <h3 className="font-bold text-gray-800">
      प्रोजेक्ट स्पेसिफिकेशन
    </h3>

    <div className="mt-3 grid gap-2 md:grid-cols-2">
      <p className="text-sm text-gray-700">
        <span className="font-semibold">Project Type:</span>{' '}
        {item.project.projectType || '-'}
      </p>

      <p className="text-sm text-gray-700">
        <span className="font-semibold">System Size:</span>{' '}
        {item.project.projectSize || '-'}
      </p>

      <p className="text-sm text-gray-700">
        <span className="font-semibold">Panel Brand:</span>{' '}
        {item.project.panelBrand || '-'}
      </p>

      <p className="text-sm text-gray-700">
        <span className="font-semibold">DCR Panels:</span>{' '}
        {item.project.dcrPanelCount ?? 0}
      </p>

      <p className="text-sm text-gray-700">
        <span className="font-semibold">Non-DCR Panels:</span>{' '}
        {item.project.nonDcrPanelCount ?? 0}
      </p>

      <p className="text-sm text-gray-700">
        <span className="font-semibold">Inverter Brand:</span>{' '}
        {item.project.converterBrand || '-'}
      </p>

      <p className="text-sm text-gray-700">
        <span className="font-semibold">Inverter Capacity:</span>{' '}
        {item.project.converterCapacity || '-'}
      </p>

      <p className="text-sm text-gray-700">
        <span className="font-semibold">Inverter Phase:</span>{' '}
        {item.project.converterPhase || '-'}
      </p>

      <p className="text-sm text-gray-700">
        <span className="font-semibold">Structure Type:</span>{' '}
        {item.project.structureType || '-'}
      </p>

      <p className="text-sm text-gray-700">
        <span className="font-semibold">Structure Capacity:</span>{' '}
        {item.project.structureCapacityKw || '-'}
      </p>

      <p className="text-sm text-gray-700">
        <span className="font-semibold">Building Height:</span>{' '}
        {item.project.buildingHeight || '-'}
      </p>

      <p className="text-sm text-gray-700">
        <span className="font-semibold">Branch:</span>{' '}
        {item.project.branchName || '-'}
      </p>
    </div>
  </div>
)}

                  <p className="mt-1 text-sm text-gray-500">
                    कॉन्ट्रैक्टर:{' '}
                    {item.contractorName || '-'}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
    मेरा काम: {getHindiScope(item.workScope)}
  </span>

  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
    जरूरी फोटो:{' '}
    {
      (
        CONTRACTOR_REQUIRED_PROOFS_BY_SCOPE[
          item.workScope || 'FULL_PROJECT'
        ] || []
      ).length
    }
  </span>
</div>

<div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
  <p className="text-sm font-bold text-orange-800">
    इस असाइनमेंट में आपका काम
  </p>

  {Array.isArray(item.assignedWorkItems) &&
  item.assignedWorkItems.length > 0 ? (
    <div className="mt-2 flex flex-wrap gap-2">
      {item.assignedWorkItems.map((workItem) => (
        <span
          key={workItem}
          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm"
        >
          ✓ {getHindiWorkItem(workItem)}
        </span>
      ))}
    </div>
  ) : (
    <p className="mt-2 text-xs text-orange-700">
      इस पुराने असाइनमेंट में अलग काम की सूची उपलब्ध नहीं है।
      ऊपर दिया गया टीम प्रकार लागू रहेगा।
    </p>
  )}
</div>

                  <p className="text-sm text-gray-500">
                    फोन:{' '}
                    {item.contractorPhone || '-'}
                  </p>

                  <p className="text-sm text-gray-500">
                    तय तारीख:{' '}
                    {item.scheduledDate
                      ? new Date(
                          item.scheduledDate,
                        ).toLocaleDateString(
                          'en-IN',
                        )
                      : '-'}
                  </p>

                  <p className="text-sm text-gray-500">
  शुरू:{' '}
  {item.startedAt
    ? new Date(
        item.startedAt,
      ).toLocaleString('en-IN')
    : '-'}
</p>

<p className="text-sm text-gray-500">
  पूर्ण:{' '}
  {item.completedAt
    ? new Date(
        item.completedAt,
      ).toLocaleString('en-IN')
    : '-'}
</p>

                  <p className="text-sm text-gray-500">
                    दिया गया:{' '}
                    {item.assignedByName || '-'}
                  </p>

                  {item.remarks && (
                    <p className="mt-3 rounded-xl bg-gray-100 p-3 text-sm text-gray-700">
                      {item.remarks}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                    {getHindiStatus(item.status || 'ASSIGNED')}
                  </span>

                  <p className="text-xl font-bold text-green-700">
                    {money(item.amount)}
                  </p>

                  <Link
                    href={`/project/${item.projectId}`}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    प्रोजेक्ट खोलें
                  </Link>

                  <div className="flex flex-wrap justify-end gap-2">
  {['IN_PROGRESS', 'ON_HOLD', 'PENDING_FINAL_PROOFS', 'COMPLETED'].map((status) => (
    <button
      key={status}
      onClick={() =>
        updateContractorWork(
          item.id,
          status,
          item.remarks || '',
        )
      }
      disabled={updatingId === item.id}
      className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50"
    >
      {getHindiStatus(status)}
    </button>
  ))}
</div>

<PostponeBox
  formKey={`SITE_WORK-${item.id}`}
  value={postponeForm[`SITE_WORK-${item.id}`]}
  setPostponeForm={setPostponeForm}
  onSubmit={() => requestPostpone('SITE_WORK', item.id)}
/>

<div className="mt-5 rounded-xl border bg-gray-50 p-4">
  <h3 className="font-bold text-gray-800">
    जरूरी फोटो चेकलिस्ट
  </h3>

  <div className="mt-3 flex flex-wrap gap-2">
    {(
      CONTRACTOR_REQUIRED_PROOFS_BY_SCOPE[
        item.workScope || 'FULL_PROJECT'
      ] || []
    ).map((requiredProof) => {
      const uploaded = (proofs[item.id] || []).some(
        (proof) => proof.proofType === requiredProof,
      );

      return (
        <span
          key={requiredProof}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            uploaded
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {uploaded ? '✓' : '✗'}{' '}
          {getHindiProof(requiredProof)}
        </span>
      );
    })}
  </div>

  <h3 className="mt-5 font-bold text-gray-800">
    GPS वाली फोटो अपलोड करें
  </h3>

  <div className="mt-3 grid gap-3 md:grid-cols-2">
    <select
      value={proofType[item.id] || ''}
      onChange={(e) =>
        setProofType((prev) => ({
          ...prev,
          [item.id]: e.target.value,
        }))
      }
      className="rounded-xl border p-3"
    >
      <option value="">फोटो का प्रकार चुनें</option>

{(
  CONTRACTOR_REQUIRED_PROOFS_BY_SCOPE[
    item.workScope || 'FULL_PROJECT'
  ] || []
).map((requiredProof) => (
  <option key={requiredProof} value={requiredProof}>
    {getHindiProof(requiredProof)}
  </option>
))}
    </select>

    <input
      type="file"
      accept="image/*"
      multiple
      onChange={(e) =>
        setProofFiles((prev) => ({
          ...prev,
          [item.id]: Array.from(e.target.files || []),
        }))
      }
      className="rounded-xl border bg-white p-3"
    />

    <input
      placeholder="GPS पता / साइट नोट"
      value={gpsData[item.id]?.gpsAddress || ''}
      onChange={(e) =>
        setGpsData((prev) => ({
          ...prev,
          [item.id]: {
            ...(prev[item.id] || {}),
            gpsAddress: e.target.value,
          },
        }))
      }
      className="rounded-xl border p-3"
    />

    <input
      placeholder="फोटो टिप्पणी"
      value={proofRemarks[item.id] || ''}
      onChange={(e) =>
        setProofRemarks((prev) => ({
          ...prev,
          [item.id]: e.target.value,
        }))
      }
      className="rounded-xl border p-3"
    />
  </div>

  <div className="mt-3 flex flex-wrap gap-2">
    <button
      onClick={() => captureGps(item.id)}
      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
    >
      GPS कैप्चर करें
    </button>

    <button
      onClick={() => uploadContractorProofs(item)}
      disabled={uploadingProofId === item.id}
      className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
    >
      {uploadingProofId === item.id
        ? 'अपलोड हो रहा है...'
        : 'फोटो अपलोड करें'}
    </button>
  </div>

  {gpsData[item.id]?.latitude && (
    <p className="mt-2 text-xs text-gray-500">
      GPS: {gpsData[item.id]?.latitude},{' '}
      {gpsData[item.id]?.longitude}
    </p>
  )}

  <div className="mt-5">
    <h4 className="font-semibold text-gray-800">
      अपलोड की गई फोटो
    </h4>

    {(!proofs[item.id] || proofs[item.id].length === 0) ? (
      <p className="mt-2 text-sm text-gray-500">
        अभी कोई फोटो अपलोड नहीं हुई है।
      </p>
    ) : (
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {proofs[item.id].map((proof) => (
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
              {getHindiProof(proof.proofType || 'OTHER')}
            </p>

            <p className="text-xs text-gray-500">
              By: {proof.uploadedByName || '-'}
            </p>

            {proof.latitude && proof.longitude && (
              <p className="text-xs text-gray-500">
                GPS: {proof.latitude}, {proof.longitude}
              </p>
            )}
          </a>
        ))}
      </div>
    )}
  </div>
</div>

<div className="mt-5 rounded-xl border bg-white p-4">
  <h3 className="font-bold text-gray-800">
    कॉन्ट्रैक्टर कार्य टिप्पणी
  </h3>

  <textarea
    placeholder="अपडेट / फोटो बाकी होने का कारण / साइट समस्या लिखें"
    value={commentText[item.id] || ''}
    onChange={(e) =>
      setCommentText((prev) => ({
        ...prev,
        [item.id]: e.target.value,
      }))
    }
    className="mt-3 w-full rounded-xl border p-3"
    rows={3}
  />

  <div className="mt-3 flex flex-wrap gap-2">
    <button
      onClick={() => submitComment(item, 'GENERAL')}
      disabled={commentLoadingId === item.id}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
    >
      टिप्पणी जोड़ें
    </button>

    <button
      onClick={() =>
        submitComment(item, 'PENDING_PROOF_REASON')
      }
      disabled={commentLoadingId === item.id}
      className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
    >
      फोटो बाकी होने का कारण जोड़ें
    </button>
  </div>

  <div className="mt-5 space-y-3">
    {(!comments[item.id] ||
      comments[item.id].length === 0) ? (
      <p className="text-sm text-gray-500">
        अभी कोई टिप्पणी नहीं है।
      </p>
    ) : (
      comments[item.id].map((comment) => (
        <div
          key={comment.id}
          className="rounded-xl bg-gray-50 p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-800">
              {comment.createdByName || 'User'}
            </p>

            <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-semibold text-gray-700">
              {(comment.commentType || 'GENERAL').replaceAll(
                '_',
                ' ',
              )}
            </span>
          </div>

          <p className="mt-1 text-xs text-gray-500">
            {comment.createdByRole || '-'} ·{' '}
            {comment.createdAt
              ? new Date(comment.createdAt).toLocaleString(
                  'en-IN',
                )
              : '-'}
          </p>

          <p className="mt-2 text-sm text-gray-700">
            {comment.comment}
          </p>
        </div>
      ))
    )}
  </div>
</div>

<div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
  <h3 className="font-bold text-gray-800">
    सफाई कार्य
  </h3>

  {cleaningAssignments
    .filter(
      (cleaning) =>
        Number(cleaning.projectId) ===
        Number(item.projectId),
    )
    .map((cleaning) => (
      <div
        key={cleaning.id}
        className="mt-3 rounded-xl border bg-white p-3"
      >
        <p className="font-semibold text-gray-800">
          सफाई की तारीख:{' '}
          {cleaning.cleaningDate || '-'}
        </p>

        <p className="text-sm text-gray-600">
          समय: {cleaning.cleaningTime || '-'}
        </p>

        <p className="text-sm text-gray-600">
          स्थिति: {cleaning.status || '-'}
        </p>

        <textarea
          placeholder="काम पूरा होने की टिप्पणी"
          value={cleaningRemarks[cleaning.id] || ''}
          onChange={(e) =>
            setCleaningRemarks((prev) => ({
              ...prev,
              [cleaning.id]: e.target.value,
            }))
          }
          className="mt-3 w-full rounded-xl border p-3"
          rows={2}
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() =>
              updateCleaningStatus(
                cleaning.id,
                'IN_PROGRESS',
              )
            }
            disabled={
              cleaningUpdatingId === cleaning.id
            }
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            सफाई शुरू करें
          </button>

          <button
            onClick={() =>
              updateCleaningStatus(
                cleaning.id,
                'COMPLETED',
              )
            }
            disabled={
              cleaningUpdatingId === cleaning.id
            }
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
          >
            सफाई पूर्ण करें
          </button>
        </div>
      </div>
    ))}
</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkCalendarCard({
  title,
  subtitle,
  status,
  href,
}: {
  title: string;
  subtitle?: string;
  status?: string;
  href: string;
}) {
  return (
    <div className="rounded-xl border bg-gray-50 p-3">
      <p className="font-bold text-gray-800">{title}</p>
      <p className="text-sm text-gray-600">{subtitle || '-'}</p>
      <p className="text-sm text-gray-600">
        स्थिति: {String(status || '-').replaceAll('_', ' ')}
      </p>
      <Link
        href={href}
        className="mt-2 inline-block rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
      >
        Open
      </Link>
    </div>
  );
}

function PostponeBox({
  formKey,
  value,
  setPostponeForm,
  onSubmit,
}: {
  formKey: string;
  value?: {
    requestedDate: string;
    requestedTime: string;
    reason: string;
  };
  setPostponeForm: React.Dispatch<
    React.SetStateAction<Record<string, {
      requestedDate: string;
      requestedTime: string;
      reason: string;
    }>>
  >;
  onSubmit: () => void;
}) {
  return (
    <div className="mt-4 rounded-xl border bg-amber-50 p-3">
      <p className="font-semibold text-gray-800">
        तारीख बदलने का अनुरोध
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="नई तारीख"
            value={
              value?.requestedDate
                ? dayjs(value.requestedDate)
                : null
            }
            onChange={(date) =>
              setPostponeForm((prev) => ({
                ...prev,
                [formKey]: {
                  requestedDate: date
                    ? date.format('YYYY-MM-DD')
                    : '',
                  requestedTime: prev[formKey]?.requestedTime || '',
                  reason: prev[formKey]?.reason || '',
                },
              }))
            }
          />
        </LocalizationProvider>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MobileTimePicker
            label="नया समय"
            ampm
            ampmInClock
            value={
              value?.requestedTime
                ? dayjs(`2026-01-01T${value.requestedTime}`)
                : null
            }
            onChange={(time) =>
              setPostponeForm((prev) => ({
                ...prev,
                [formKey]: {
                  requestedDate: prev[formKey]?.requestedDate || '',
                  requestedTime: time ? time.format('HH:mm') : '',
                  reason: prev[formKey]?.reason || '',
                },
              }))
            }
          />
        </LocalizationProvider>

        <input
          placeholder="कारण"
          value={value?.reason || ''}
          onChange={(e) =>
            setPostponeForm((prev) => ({
              ...prev,
              [formKey]: {
                requestedDate: prev[formKey]?.requestedDate || '',
                requestedTime: prev[formKey]?.requestedTime || '',
                reason: e.target.value,
              },
            }))
          }
          className="rounded-xl border p-3"
        />
      </div>

      <button
        onClick={onSubmit}
        className="mt-3 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
      >
        अनुमति के लिए भेजें
      </button>
    </div>
  );
}
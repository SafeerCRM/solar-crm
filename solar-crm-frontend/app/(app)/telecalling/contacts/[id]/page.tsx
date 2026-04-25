'use client';

import { useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import axios from 'axios';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { getAuthHeaders } from '@/lib/authHeaders';

type Contact = {
  id: number;
  name: string;
  phone: string;
  city?: string;
  address?: string;
  location?: string;
  kNo?: string;
  assignedTo?: number;
  assignedToName?: string;
  importedByName?: string;
  convertedToLead?: boolean;
  remarks?: string;
  reviewAssignedTo?: number;
  reviewAssignedToName?: string;
};

type WorkHistoryItem = {
  type: 'CONTACT_CREATED' | 'CONTACT_NOTE' | 'CONTACT_CALL';
  timestamp: string;
  title: string;
  description: string;
  noteId?: number;
  callHistoryId?: number;
  meta?: Record<string, any>;
};

type WorkHistoryResponse = {
  contact: Contact;
  timeline: WorkHistoryItem[];
};

type User = {
  id: number;
  name: string;
  email?: string;
  roles?: string[];
  role?: string;
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function TelecallingContactDetailPage() {
  const params = useParams();
  const id = params?.id;
  const searchParams = useSearchParams();
  const backHref =
  searchParams?.get('from') === 'review-queue'
    ? '/telecalling'
    : '/telecalling/contacts';

  const [data, setData] = useState<WorkHistoryResponse | null>(null);
  const [message, setMessage] = useState('');
    const [editingName, setEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
 const [assistants, setAssistants] = useState<User[]>([]);
 const [meetingManagers, setMeetingManagers] = useState<User[]>([]);
 const [selectedAssistantId, setSelectedAssistantId] = useState('');
 const [selectedMeetingManagerId, setSelectedMeetingManagerId] = useState('');
 const [leadManagers, setLeadManagers] = useState<User[]>([]);
const [selectedLeadManagerId, setSelectedLeadManagerId] = useState('');
 const [assigningAssistant, setAssigningAssistant] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  const [callStatus, setCallStatus] = useState('CONNECTED');
  const [callNotes, setCallNotes] = useState('');
  const [callRecordingFile, setCallRecordingFile] = useState<File | null>(null);
const [uploadingCallRecording, setUploadingCallRecording] = useState(false);
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  const [editingCallId, setEditingCallId] = useState<number | null>(null);
  const [editingCallStatus, setEditingCallStatus] = useState('CONNECTED');
  const [editingCallNotes, setEditingCallNotes] = useState('');
  const [editingNextFollowUpDate, setEditingNextFollowUpDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  

  const [user, setUser] = useState<any>(null);
  const [leadSlider, setLeadSlider] = useState(0);
  const [meetingSlider, setMeetingSlider] = useState(0);
  const [pendingLeadSave, setPendingLeadSave] = useState(false);
  const [pendingMeetingSave, setPendingMeetingSave] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');

useEffect(() => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error('Failed to parse user');
    }
  }
}, []);

const roles = user?.roles || [];
const isTelecaller = roles.includes('TELECALLER');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error(error);
      }
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchHistory();
    }
  }, [id]);

  useEffect(() => {
  if (currentUser) {
    const roles = Array.isArray(currentUser.roles)
      ? currentUser.roles
      : currentUser.role
      ? [currentUser.role]
      : [];

       const canLoadAssignmentLists =
      roles.includes('OWNER') ||
      roles.includes('TELECALLING_MANAGER') ||
      roles.includes('TELECALLER') ||
      roles.includes('TELECALLING_ASSISTANT');

        if (canLoadAssignmentLists) {
  fetchAssistants();
  fetchMeetingManagers();
  fetchLeadManagers();
} else {
  setAssistants([]);
  setMeetingManagers([]);
  setLeadManagers([]);
}
  }
}, [currentUser]);

useEffect(() => {
  if (!flashMessage) return;

  const timer = setTimeout(() => {
    setFlashMessage('');
  }, 2500);

  return () => clearTimeout(timer);
}, [flashMessage]);

  const canAssignAssistant = useMemo(() => {
    const roles = Array.isArray(currentUser?.roles)
      ? currentUser!.roles
      : currentUser?.role
      ? [currentUser.role]
      : [];

    return (
      roles.includes('OWNER') ||
      roles.includes('TELECALLING_MANAGER') ||
      roles.includes('TELECALLER')
    );
  }, [currentUser]);

  const fetchAssistants = async () => {
    try {
      const res = await axios.get(
        `${backendUrl}/users/telecalling-assistants`,
        {
          headers: getAuthHeaders(),
        },
      );

      setAssistants(Array.isArray(res.data) ? res.data : []);
    } catch (error: any) {
      console.error(error);
      setAssistants([]);
    }
  };

  const fetchMeetingManagers = async () => {
  try {
    const res = await axios.get(
      `${backendUrl}/users/meeting-managers`,
      {
        headers: getAuthHeaders(),
      },
    );

    setMeetingManagers(Array.isArray(res.data) ? res.data : []);
  } catch (error: any) {
    console.error(error);
    setMeetingManagers([]);
  }
};

const fetchLeadManagers = async () => {
  try {
    const res = await axios.get(
      `${backendUrl}/users/lead-managers`,
      {
        headers: getAuthHeaders(),
      },
    );

    setLeadManagers(Array.isArray(res.data) ? res.data : []);
  } catch (error: any) {
    console.error(error);
    setLeadManagers([]);
  }
};

  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        `${backendUrl}/telecalling/contacts/${id}/work-history`,
        {
          headers: getAuthHeaders(),
        },
      );

      setData(res.data);
setSelectedMeetingManagerId('');
setSelectedLeadManagerId('');

const reviewAssignedTo = res.data?.contact?.reviewAssignedTo;
setSelectedAssistantId(reviewAssignedTo ? String(reviewAssignedTo) : '');
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to load contact details');
      setData(null);
    }
  };

    const handleSaveName = async () => {
    if (!editingNameValue.trim()) {
      setMessage('Name cannot be empty');
      return;
    }

    try {
      setMessage('');

      await axios.patch(
        `${backendUrl}/telecalling/contacts/${id}/update-name`,
        { name: editingNameValue },
        { headers: getAuthHeaders() }
      );

      setEditingName(false);
      setEditingNameValue('');
      setFlashMessage('Name updated successfully');

      fetchHistory();
    } catch (err: any) {
      console.error(err);
      setMessage(
        err?.response?.data?.message || 'Failed to update name'
      );
    }
  };

  const assignToAssistant = async () => {
    if (!selectedAssistantId) {
      setMessage('Please select telecalling assistant');
      return;
    }

    try {
      setAssigningAssistant(true);
      setMessage('');

      await axios.patch(
        `${backendUrl}/telecalling/contacts/${id}/assign-review`,
        {
          assignedTo: Number(selectedAssistantId),
        },
        { headers: getAuthHeaders() },
      );

      setMessage('Assigned to telecalling assistant successfully');
      await fetchHistory();
    } catch (error: any) {
      console.error(error);
      setMessage(
        error?.response?.data?.message ||
          'Failed to assign telecalling assistant',
      );
    } finally {
      setAssigningAssistant(false);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) {
      setMessage('Please enter a note');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await axios.post(
        `${backendUrl}/telecalling/contacts/${id}/notes`,
        { note: noteText },
        { headers: getAuthHeaders() },
      );

      setNoteText('');
      setMessage('Note added successfully');
      fetchHistory();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async () => {
    if (!editingNoteId || !editingNoteText.trim()) {
      setMessage('Please enter a note');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await axios.patch(
        `${backendUrl}/telecalling/contacts/${id}/notes/${editingNoteId}`,
        { note: editingNoteText },
        { headers: getAuthHeaders() },
      );

      setEditingNoteId(null);
      setEditingNoteText('');
      setMessage('Note updated successfully');
      fetchHistory();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to update note');
    } finally {
      setLoading(false);
    }
  };

  const uploadCallRecording = async () => {
  if (!callRecordingFile) return '';

  try {
    setUploadingCallRecording(true);

    const formData = new FormData();
    formData.append('file', callRecordingFile);
    formData.append('contactId', String(id));

    const res = await fetch(`${backendUrl}/telecalling/recordings/upload`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeaders().Authorization,
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || 'Upload failed');
    }

    return data.recordingUrl;
  } catch (err: any) {
    console.error(err);
    setMessage(err?.message || 'Recording upload failed');
    return '';
  } finally {
    setUploadingCallRecording(false);
  }
};

  const addCallHistory = async () => {
    try {
      setLoading(true);
      setMessage('');

      let finalRecordingUrl = '';

if (callRecordingFile) {
  const uploadedUrl = await uploadCallRecording();
  if (uploadedUrl) {
    finalRecordingUrl = uploadedUrl;
  }
}

await axios.post(
  `${backendUrl}/telecalling/contacts/${id}/call-history`,
  {
    callStatus,
    notes: callNotes,
    recordingUrl: finalRecordingUrl,
    nextFollowUpDate: nextFollowUpDate
      ? new Date(nextFollowUpDate).toISOString()
      : undefined,
  },
  { headers: getAuthHeaders() },
);

      setCallStatus('CONNECTED');
      setCallNotes('');
      setNextFollowUpDate('');
      setCallRecordingFile(null);
      setMessage('Call history added successfully');
      fetchHistory();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to add call history');
    } finally {
      setLoading(false);
    }
  };

  const updateCallHistory = async () => {
    if (!editingCallId) {
      setMessage('No call history selected');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await axios.patch(
        `${backendUrl}/telecalling/contacts/${id}/call-history/${editingCallId}`,
        {
          callStatus: editingCallStatus,
          notes: editingCallNotes,
          nextFollowUpDate: editingNextFollowUpDate
            ? new Date(editingNextFollowUpDate).toISOString()
            : undefined,
        },
        { headers: getAuthHeaders() },
      );

      setEditingCallId(null);
      setEditingCallStatus('CONNECTED');
      setEditingCallNotes('');
      setEditingNextFollowUpDate('');
      setMessage('Call history updated successfully');
      fetchHistory();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.response?.data?.message || 'Failed to update call history');
    } finally {
      setLoading(false);
    }
  };

  const addCallDateValue = nextFollowUpDate ? dayjs(nextFollowUpDate) : null;
  const addCallTimeValue = nextFollowUpDate ? dayjs(nextFollowUpDate) : null;

  const editCallDateValue = editingNextFollowUpDate
    ? dayjs(editingNextFollowUpDate)
    : null;
  const editCallTimeValue = editingNextFollowUpDate
    ? dayjs(editingNextFollowUpDate)
    : null;

  const updateAddCallDatePart = (newDate: Dayjs | null) => {
    if (!newDate) {
      setNextFollowUpDate('');
      return;
    }

    const base = nextFollowUpDate ? dayjs(nextFollowUpDate) : dayjs();
    const merged = newDate
      .hour(base.hour())
      .minute(base.minute())
      .second(0)
      .millisecond(0);

    setNextFollowUpDate(merged.format('YYYY-MM-DDTHH:mm'));
  };

  const updateAddCallTimePart = (newTime: Dayjs | null) => {
    if (!newTime) return;

    const base = nextFollowUpDate ? dayjs(nextFollowUpDate) : dayjs();
    const merged = base
      .hour(newTime.hour())
      .minute(newTime.minute())
      .second(0)
      .millisecond(0);

    setNextFollowUpDate(merged.format('YYYY-MM-DDTHH:mm'));
  };

  const updateEditCallDatePart = (newDate: Dayjs | null) => {
    if (!newDate) {
      setEditingNextFollowUpDate('');
      return;
    }

    const base = editingNextFollowUpDate
      ? dayjs(editingNextFollowUpDate)
      : dayjs();
    const merged = newDate
      .hour(base.hour())
      .minute(base.minute())
      .second(0)
      .millisecond(0);

    setEditingNextFollowUpDate(merged.format('YYYY-MM-DDTHH:mm'));
  };

  const updateEditCallTimePart = (newTime: Dayjs | null) => {
    if (!newTime) return;

    const base = editingNextFollowUpDate
      ? dayjs(editingNextFollowUpDate)
      : dayjs();
    const merged = base
      .hour(newTime.hour())
      .minute(newTime.minute())
      .second(0)
      .millisecond(0);

    setEditingNextFollowUpDate(merged.format('YYYY-MM-DDTHH:mm'));
  };

  const getTypeBadge = (type: string) => {
    if (type === 'CONTACT_CALL') return 'bg-blue-100 text-blue-700';
    if (type === 'CONTACT_NOTE') return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (!data) {
    return (
      <div className="p-6">
        <div className="mb-6 flex justify-between">
          <h1 className="text-2xl font-semibold">Contact Detail</h1>
          <Link
            href={backHref}
            className="rounded bg-gray-500 px-4 py-2 text-white"
          >
            Back
          </Link>
        </div>

        {message ? (
          <div className="rounded bg-red-50 p-4 text-red-700">{message}</div>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between">
        <h1 className="text-2xl font-semibold">Contact Detail</h1>

        <Link
          href={backHref}
          className="rounded bg-gray-500 px-4 py-2 text-white"
        >
          Back
        </Link>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-6 shadow">
        <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
            {editingName ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={editingNameValue}
                  onChange={(e) => setEditingNameValue(e.target.value)}
                  className="rounded border px-3 py-2 text-sm"
                />

                <button
                  onClick={handleSaveName}
                  className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
                >
                  Save
                </button>

                <button
                  onClick={() => {
                    setEditingName(false);
                    setEditingNameValue('');
                  }}
                  className="rounded bg-gray-300 px-3 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{data.contact.name}</h2>

                <button
                  onClick={() => {
                    setEditingName(true);
                    setEditingNameValue(data.contact.name || '');
                  }}
                  className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                >
                  ✏️ Edit
                </button>
              </div>
            )}

            <p className="text-sm text-gray-500">Contact ID: {data.contact.id}</p>
          </div>

          <a
            href={`tel:${data.contact.phone}`}
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white"
          >
            📞 Call
          </a>
        </div>

        <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
          <p>
            <span className="font-medium">Phone:</span> {data.contact.phone}
          </p>
          <p>
            <span className="font-medium">City:</span> {data.contact.city || '-'}
          </p>
          <p>
            <span className="font-medium">Address:</span> {data.contact.address || '-'}
          </p>
          <p>
            <span className="font-medium">Location:</span> {data.contact.location || '-'}
          </p>
          <p>
            <span className="font-medium">Assigned To:</span>{' '}
            {data.contact.assignedToName || '-'}
          </p>
          <p>
            <span className="font-medium">Imported By:</span>{' '}
            {data.contact.importedByName || '-'}
          </p>
          <p className="md:col-span-2">
            <span className="font-medium">Telecalling Assistant:</span>{' '}
            {data.contact.reviewAssignedToName || 'Not assigned'}
          </p>
        </div>

        {canAssignAssistant && (
          <div className="mt-5 rounded border bg-indigo-50 p-4">
            <h3 className="mb-3 font-semibold text-indigo-800">
              Assign to Telecalling Assistant
            </h3>

            <div className="flex flex-col gap-3 md:grid md:grid-cols-3">
              <select
                value={selectedAssistantId}
                onChange={(e) => setSelectedAssistantId(e.target.value)}
                className="rounded border p-2"
              >
                <option value="">Select assistant</option>
                {assistants.map((assistant) => (
                  <option key={assistant.id} value={assistant.id}>
                    {assistant.name}
                    {assistant.email ? ` (${assistant.email})` : ''}
                  </option>
                ))}
              </select>

              <button
                onClick={assignToAssistant}
                disabled={assigningAssistant}
                className="w-full md:w-auto rounded bg-indigo-600 px-4 py-2 text-white"
              >
                {assigningAssistant ? 'Assigning...' : 'Assign Assistant'}
              </button>
            </div>

            <p className="mt-2 text-sm text-gray-600">
              Use this after call activity when you want assistant review.
            </p>
          </div>
        )}

                        {/* ===== CONVERT TO LEAD ===== */}
{!isTelecaller && (
  <div className="mt-6 rounded border bg-blue-50 p-4">
    <div className="max-w-md space-y-3">
      <p className="text-sm font-semibold text-blue-800">
        Convert to Lead
      </p>
<select
  value={selectedLeadManagerId}
  onChange={(e) => setSelectedLeadManagerId(e.target.value)}
  className="w-full rounded border p-2"
>
  <option value="">Select lead manager</option>
  {leadManagers.map((manager) => (
    <option key={manager.id} value={manager.id}>
      {manager.name}
      {manager.email ? ` (${manager.email})` : ''}
    </option>
  ))}
</select>
      <input
        type="range"
        min="0"
        max="100"
        value={leadSlider}
        onChange={(e) => {
          const value = Number(e.target.value);
          setLeadSlider(value);
          setPendingLeadSave(value === 100);
        }}
        className="w-full"
      />

      <div className="flex justify-between text-xs text-gray-500">
        <span>Drag</span>
        <span>{leadSlider}%</span>
        <span>Convert</span>
      </div>

      {pendingLeadSave && (
        <div className="flex gap-3">
          <button
            onClick={async () => {
  if (!selectedLeadManagerId) {
    setMessage('Please select lead manager');
    return;
  }

  try {
    setMessage('');

    await axios.post(
      `${backendUrl}/telecalling/contacts/${id}/convert`,
      {
        assignedTo: Number(selectedLeadManagerId),
      },
      { headers: getAuthHeaders() }
    );

    setFlashMessage('Converted to lead successfully');
    setLeadSlider(0);
    setPendingLeadSave(false);

    setTimeout(() => {
      if (searchParams?.get('from') === 'review-queue') {
        window.location.href = '/telecalling';
      } else {
        fetchHistory();
      }
    }, 300);
  } catch (err: any) {
    console.error(err);
    setMessage(
      err?.response?.data?.message || 'Failed to convert to lead'
    );
  }
}}
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Save
          </button>

          <button
            onClick={() => {
              setLeadSlider(0);
              setPendingLeadSave(false);
            }}
            className="rounded bg-gray-300 px-4 py-2"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  </div>
)}

{/* ===== CONVERT TO MEETING ===== */}
<div className="mt-8 rounded border bg-gray-50 p-4">
  <div className="max-w-md space-y-3">
    <p className="text-sm font-semibold text-gray-800">
      Convert to Meeting
    </p>

    <select
      value={selectedMeetingManagerId}
      onChange={(e) => setSelectedMeetingManagerId(e.target.value)}
      className="w-full rounded border p-2"
    >
      <option value="">Select meeting manager</option>
      {meetingManagers.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>

    <input
      type="range"
      min="0"
      max="100"
      value={meetingSlider}
      onChange={(e) => {
        const value = Number(e.target.value);
        setMeetingSlider(value);
        setPendingMeetingSave(value === 100);
      }}
      className="w-full"
    />

    <div className="flex justify-between text-xs text-gray-500">
      <span>Drag</span>
      <span>{meetingSlider}%</span>
      <span>Convert</span>
    </div>

    {pendingMeetingSave && (
      <div className="flex gap-3">
        <button
          onClick={async () => {
            try {
              await axios.post(
                `${backendUrl}/telecalling/contacts/${id}/convert-to-meeting`,
                {
                  meetingManagerId: Number(selectedMeetingManagerId),
                },
                { headers: getAuthHeaders() }
              );

              setFlashMessage('Converted to meeting successfully');
              setMeetingSlider(0);
              setPendingMeetingSave(false);
              fetchHistory();
            } catch (err: any) {
              setMessage('Failed to convert to meeting');
            }
          }}
          className="rounded bg-green-600 px-4 py-2 text-white"
        >
          Save
        </button>

        <button
          onClick={() => {
            setMeetingSlider(0);
            setPendingMeetingSave(false);
          }}
          className="rounded bg-gray-300 px-4 py-2"
        >
          Cancel
        </button>
      </div>
    )}
  </div>
</div>

</div>

     {flashMessage && (
        <div className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-sm font-medium text-green-800 shadow">
          {flashMessage}
        </div>
      )}

      {message && <p className="mb-4 text-blue-600">{message}</p>}

      <div className="mb-6 rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Add Note</h2>

        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          className="mb-3 w-full rounded border p-3"
          rows={4}
          placeholder="Enter working note for this contact"
        />

        <button
          onClick={addNote}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          {loading ? 'Saving...' : 'Add Note'}
        </button>
      </div>

      <div className="mb-6 rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Add Call History</h2>

        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={callStatus}
            onChange={(e) => setCallStatus(e.target.value)}
            className="rounded border p-2"
          >
            <option value="CONNECTED">CONNECTED</option>
            <option value="CALLBACK">CALLBACK</option>
            <option value="NOT_INTERESTED">NOT_INTERESTED</option>
            <option value="INTERESTED">INTERESTED</option>
            <option value="NO_RESPONSE">NO_RESPONSE</option>
          </select>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="grid gap-3 md:grid-cols-2">
              <DatePicker
                label="Follow-up Date"
                value={addCallDateValue}
                onChange={updateAddCallDatePart}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />

              <MobileTimePicker
                label="Follow-up Time"
                value={addCallTimeValue}
                onChange={updateAddCallTimePart}
                ampm
                ampmInClock
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </div>
          </LocalizationProvider>
          <button
            onClick={addCallHistory}
            disabled={loading}
            className="rounded bg-black px-4 py-2 text-white"
          >
            {loading ? 'Saving...' : 'Add Call Entry'}
          </button>
        </div>

        <textarea
          value={callNotes}
          onChange={(e) => setCallNotes(e.target.value)}
          className="mt-3 w-full rounded border p-3"
          rows={4}
          placeholder="Enter call notes"
        />

        <div className="mt-3 rounded border border-dashed border-gray-300 p-3">
  <label className="mb-2 block text-sm font-medium text-gray-700">
    Upload Call Recording
  </label>

  <input
    type="file"
    accept="audio/*"
    onChange={(e) => {
      const file = e.target.files?.[0];
      setCallRecordingFile(file || null);
    }}
    className="w-full text-sm"
  />

  {callRecordingFile && (
    <p className="mt-2 text-xs text-gray-600">
      Selected: {callRecordingFile.name}
    </p>
  )}

  {uploadingCallRecording && (
    <p className="mt-2 text-xs text-blue-600">
      Uploading recording...
    </p>
  )}
</div>
      </div>


      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Work History</h2>

        {data.timeline.length === 0 ? (
          <p className="text-gray-600">No work history available</p>
        ) : (
          <div className="space-y-4">
            {data.timeline.map((item, index) => (
              <div
                key={`${item.type}-${item.timestamp}-${index}`}
                className="rounded-xl border p-4"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getTypeBadge(
                      item.type,
                    )}`}
                  >
                    {item.type.replace('_', ' ')}
                  </span>

                  <span className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-800">{item.title}</h3>

                {item.type === 'CONTACT_NOTE' && item.noteId === editingNoteId ? (
                  <div className="mt-3">
                    <textarea
                      value={editingNoteText}
                      onChange={(e) => setEditingNoteText(e.target.value)}
                      className="mb-2 w-full rounded border p-3"
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={updateNote}
                        disabled={loading}
                        className="rounded bg-black px-4 py-2 text-white"
                      >
                        {loading ? 'Saving...' : 'Update Note'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditingNoteText('');
                        }}
                        className="rounded bg-gray-400 px-4 py-2 text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : item.type === 'CONTACT_CALL' && item.callHistoryId === editingCallId ? (
                  <div className="mt-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <select
                        value={editingCallStatus}
                        onChange={(e) => setEditingCallStatus(e.target.value)}
                        className="rounded border p-2"
                      >
                        <option value="CONNECTED">CONNECTED</option>
                        <option value="CALLBACK">CALLBACK</option>
                        <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                        <option value="INTERESTED">INTERESTED</option>
                        <option value="NO_RESPONSE">NO_RESPONSE</option>
                      </select>

                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <div className="grid gap-3 md:grid-cols-2">
                          <DatePicker
                            label="Follow-up Date"
                            value={editCallDateValue}
                            onChange={updateEditCallDatePart}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                              },
                            }}
                          />

                          <MobileTimePicker
                            label="Follow-up Time"
                            value={editCallTimeValue}
                            onChange={updateEditCallTimePart}
                            ampm
                            ampmInClock
                            slotProps={{
                              textField: {
                                fullWidth: true,
                              },
                            }}
                          />
                        </div>
                      </LocalizationProvider>

                      <button
                        onClick={updateCallHistory}
                        disabled={loading}
                        className="rounded bg-black px-4 py-2 text-white"
                      >
                        {loading ? 'Saving...' : 'Update Call Entry'}
                      </button>
                    </div>

                    <textarea
                      value={editingCallNotes}
                      onChange={(e) => setEditingCallNotes(e.target.value)}
                      className="mt-3 w-full rounded border p-3"
                      rows={4}
                    />

                    <button
                      onClick={() => {
                        setEditingCallId(null);
                        setEditingCallStatus('CONNECTED');
                        setEditingCallNotes('');
                        setEditingNextFollowUpDate('');
                      }}
                      className="mt-2 rounded bg-gray-400 px-4 py-2 text-white"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-gray-700">{item.description}</p>

                    

                    {item.type === 'CONTACT_CALL' && item.meta?.recordingUrl && (
      <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3">
        <p className="mb-2 text-xs font-semibold text-green-700">
          Call Recording
        </p>

        <audio
          controls
          src={String(item.meta.recordingUrl)}
          className="w-full"
        />
      </div>
    )}
                    {item.type === 'CONTACT_NOTE' && item.noteId ? (
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            setEditingNoteId(item.noteId || null);
                            setEditingNoteText(item.description || '');
                          }}
                          className="rounded bg-orange-500 px-3 py-2 text-sm text-white"
                        >
                          Edit Note
                        </button>
                      </div>
                    ) : null}

                    {item.type === 'CONTACT_CALL' && item.callHistoryId ? (
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            setEditingCallId(item.callHistoryId || null);
                            setEditingCallStatus(
                              String(item.meta?.callStatus || 'CONNECTED'),
                            );
                            setEditingCallNotes(item.description || '');
                            setEditingNextFollowUpDate(
                              item.meta?.nextFollowUpDate
                                ? new Date(item.meta.nextFollowUpDate)
                                    .toISOString()
                                    .slice(0, 16)
                                : '',
                            );
                          }}
                          className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
                        >
                          Edit Call Entry
                        </button>
                      </div>
                    ) : null}
                  </>
                )}

                {item.meta && (
                  <div className="mt-3 rounded bg-gray-50 p-3 text-xs text-gray-600">
                    {Object.entries(item.meta).map(([key, value]) => (
                      <p key={key}>
                        <span className="font-medium">{key}:</span>{' '}
                        {value === null || value === undefined || value === ''
                          ? '-'
                          : String(value)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
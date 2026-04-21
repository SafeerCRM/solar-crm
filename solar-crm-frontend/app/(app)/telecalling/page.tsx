'use client';

import { useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '@/lib/authHeaders';

type Lead = {
  id: number;
  name: string;
  phone: string;
  city?: string;
};

type ContactSummary = {
  id: number;
  name: string;
  phone: string;
  city?: string;
  address?: string;
  location?: string;
  convertedToLead?: boolean;
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

type ContactWorkHistoryResponse = {
  contact: ContactSummary;
  timeline: WorkHistoryItem[];
};

type LatestContactCallInfo = {
  callStatus?: string;
  notes?: string;
  nextFollowUpDate?: string;
  updatedAt?: string;
  recordingUrl?: string;
};

type LatestContactSummaryResponseItem = {
  contact: ContactSummary;
  latestCall?: LatestContactCallInfo;
};

type CallLog = {
  id: number;
  leadId?: number | null;
  contactId?: number | null;
  callStatus: string;
  callNotes?: string;
  nextFollowUpDate?: string;
  recordingUrl?: string;
  providerName?: string;
  disposition?: string;
  reviewStatus?: 'PENDING' | 'POTENTIAL' | 'CONVERTED' | 'REJECTED';
  reviewNotes?: string;
  reviewAssignedTo?: number | null;
  reviewAssignedToName?: string | null;
    telecallerName?: string;
  assignedDate?: string;
  leadPotential?: 'LOW' | 'MEDIUM' | 'HIGH' | string | null;
  createdAt: string;
};

type User = {
  id: number;
  name: string;
  email?: string;
  roles?: string[] | null;
  role?: string | null;
};

type EnrichedCallRow = CallLog & {
  displayName: string;
  displayPhone: string;
  displayCity: string;
  rowType: 'LEAD' | 'CONTACT' | 'UNKNOWN';
  personKey: string;
  effectiveStatus: string;
  effectiveNotes: string;
  effectiveNextFollowUpDate?: string;
  effectiveTimestamp: string;
  reviewAssignedLabel: string;
  isConvertedToLead: boolean;
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function TelecallingPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [contactMap, setContactMap] = useState<Record<number, ContactSummary>>({});
  const [contactLatestCallMap, setContactLatestCallMap] = useState<
    Record<number, LatestContactCallInfo>
  >({});
  const [assistants, setAssistants] = useState<User[]>([]);
  const [assignAssistantMap, setAssignAssistantMap] = useState<Record<number, string>>(
    {},
  );
  const [assigningAssistantId, setAssigningAssistantId] = useState<number | null>(
    null,
  );

  const [leadId, setLeadId] = useState('');
  const [callStatus, setCallStatus] = useState('CONNECTED');
  const [callNotes, setCallNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [leadPotential, setLeadPotential] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [convertingContactId, setConvertingContactId] = useState<number | null>(
    null,
  );

  const [reviewStatusMap, setReviewStatusMap] = useState<Record<number, string>>({});
  const [reviewNotesMap, setReviewNotesMap] = useState<Record<number, string>>({});

  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
    const [telecallerNameFilter, setTelecallerNameFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [leadPotentialFilter, setLeadPotentialFilter] = useState('');
  const [callResultFilter, setCallResultFilter] = useState('');
  const [page, setPage] = useState(1);
const [limit] = useState(50);
const [total, setTotal] = useState(0);
const [totalPages, setTotalPages] = useState(1);
  const [selectedReminderDate, setSelectedReminderDate] = useState<Dayjs | null>(null);

  const userRoles = useMemo(() => {
    if (Array.isArray(user?.roles)) return user.roles;
    if (user?.role) return [user.role];
    return [];
  }, [user]);

  const isAssistant = userRoles.includes('TELECALLING_ASSISTANT');
  const isTelecaller = userRoles.includes('TELECALLER');
  const isOwner = userRoles.includes('OWNER');
  const isTelecallingManager = userRoles.includes('TELECALLING_MANAGER');

  const canReview =
    isTelecallingManager ||
    userRoles.includes('PROJECT_MANAGER') ||
    isAssistant ||
    isOwner;

  const canLogCalls =
    isTelecaller ||
    isOwner ||
    userRoles.includes('LEAD_MANAGER') ||
    isTelecallingManager;

  const canAssignAssistant = isOwner || isTelecallingManager || isTelecaller;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token =
      localStorage.getItem('token') || localStorage.getItem('access_token');

    if (!token) {
  window.location.href = '/';
      return;
    }

    if (!storedUser) {
  return;
}

try {
  const parsedUser = JSON.parse(storedUser);
  setUser(parsedUser);
} catch {
  localStorage.clear();
  window.location.href = '/';
}
  }, []);

 useEffect(() => {
  if (!user) return;

  fetchLeads();
  fetchCalls(1);

  if (canAssignAssistant) {
    fetchAssistants();
  } else {
    setAssistants([]);
  }
}, [user, canAssignAssistant]);

useEffect(() => {
  if (!user) return;

  const shouldRefetchWithFilters =
    isTelecallingManager ||
    userRoles.includes('PROJECT_MANAGER') ||
    isAssistant ||
    isOwner ||
    isTelecaller;

  if (!shouldRefetchWithFilters) return;

  fetchCalls(1);
}, [
  nameFilter,
  phoneFilter,
  cityFilter,
  telecallerNameFilter,
  leadPotentialFilter,
  callResultFilter,
  user,
]);

  useEffect(() => {
  if (calls.length > 0) {
    const hasHistoryFilter =
      !!nameFilter.trim() ||
      !!phoneFilter.trim() ||
      !!cityFilter.trim() ||
      !!leadPotentialFilter ||
      !!callResultFilter;

    if (hasHistoryFilter) {
      fetchContactDataAndLatestHistory();
    } else {
      setContactMap({});
      setContactLatestCallMap({});
    }

    const initialAssignMap: Record<number, string> = {};
    calls.forEach((call) => {
      initialAssignMap[call.id] = call.reviewAssignedTo
        ? String(call.reviewAssignedTo)
        : '';
    });
    setAssignAssistantMap(initialAssignMap);
  } else {
    setContactMap({});
    setContactLatestCallMap({});
    setAssignAssistantMap({});
  }
}, [
  calls,
  nameFilter,
  phoneFilter,
  cityFilter,
  leadPotentialFilter,
  callResultFilter,
]);

  const fetchLeads = async () => {
    try {
      const params: any = {};

      if (isTelecaller && user?.id) {
        params.assignedTo = user.id;
      }

      const res = await axios.get(`${backendUrl}/leads`, {
        params,
        headers: getAuthHeaders(),
      });

      setLeads(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      setLeads([]);
    }
  };

  const fetchCalls = async (pageNumber = 1) => {
  try {
    const shouldUseReviewQueue =
      isTelecallingManager ||
      userRoles.includes('PROJECT_MANAGER') ||
      isAssistant ||
      isOwner;

    if (shouldUseReviewQueue) {
      const params = {
        page: pageNumber,
        limit,
        name: nameFilter.trim(),
        phone: phoneFilter.trim(),
        city: cityFilter.trim(),
                telecallerName: telecallerNameFilter.trim(),
        callResult: callResultFilter,
        leadPotential: leadPotentialFilter,
      };

      const res = await axios.get(`${backendUrl}/telecalling/review-queue`, {
        params,
        headers: getAuthHeaders(),
      });

      const responseData = res.data || {};
      const rows = Array.isArray(responseData.data) ? responseData.data : [];

      setCalls(rows);
      setTotal(Number(responseData.total || 0));
      setTotalPages(Number(responseData.totalPages || 1));
      setPage(Number(responseData.page || pageNumber));
      return;
    }

    const params = {
  page: pageNumber,
  limit,
  name: nameFilter.trim(),
  phone: phoneFilter.trim(),
  city: cityFilter.trim(),
  callResult: callResultFilter,
  leadPotential: leadPotentialFilter,
};

const res = await axios.get(`${backendUrl}/telecalling`, {
  params,
  headers: getAuthHeaders(),
});

const responseData = res.data || {};
const data = Array.isArray(responseData.data) ? responseData.data : [];

setCalls(data);
setTotal(Number(responseData.total || 0));
setTotalPages(Number(responseData.totalPages || 1));
setPage(Number(responseData.page || pageNumber));
  } catch (error) {
    console.error('Failed to fetch calls:', error);
    setCalls([]);
    setTotal(0);
    setTotalPages(1);
  }
};

  const fetchAssistants = async () => {
    try {
      const res = await axios.get(`${backendUrl}/users/telecalling-assistants`, {
        headers: getAuthHeaders(),
      });

      setAssistants(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch assistants:', error);
      setAssistants([]);
    }
  };

    const fetchContactDataAndLatestHistory = async () => {
    try {
      const hasHistoryFilter =
        !!nameFilter.trim() ||
        !!phoneFilter.trim() ||
        !!cityFilter.trim() ||
        !!leadPotentialFilter ||
        !!callResultFilter;

      if (!hasHistoryFilter) {
        setMessage('Apply filter to load contact history');
        setContactMap({});
        setContactLatestCallMap({});
        return;
      }

      const filteredCalls = calls.filter((call) => {
        const contactId = call.contactId;
        if (!contactId) return false;

        const effectiveStatus = String(
          call.disposition || call.callStatus || '',
        ).toUpperCase();

        const effectiveLeadPotential = String(call.leadPotential || '').toUpperCase();

        const matchesLeadPotential =
          !leadPotentialFilter ||
          effectiveLeadPotential === leadPotentialFilter.toUpperCase();

        const matchesCallResult =
          !callResultFilter ||
          effectiveStatus === callResultFilter.toUpperCase();

        return matchesLeadPotential && matchesCallResult;
      });

      const uniqueContactIds = Array.from(
        new Set(
          filteredCalls
            .map((call) => call.contactId)
            .filter((id): id is number => typeof id === 'number' && id > 0),
        ),
      );

      if (uniqueContactIds.length === 0) {
        setContactMap({});
        setContactLatestCallMap({});
        return;
      }

      const res = await axios.post<LatestContactSummaryResponseItem[]>(
        `${backendUrl}/telecalling/contacts/latest-summary`,
        { contactIds: uniqueContactIds },
        { headers: getAuthHeaders() },
      );

      const rows = Array.isArray(res.data) ? res.data : [];

      const nextContactMap: Record<number, ContactSummary> = {};
      const nextLatestMap: Record<number, LatestContactCallInfo> = {};

      rows.forEach((item) => {
        if (!item?.contact?.id) return;

        nextContactMap[item.contact.id] = item.contact;

        nextLatestMap[item.contact.id] = {
          callStatus: item.latestCall?.callStatus || '',
          notes: item.latestCall?.notes || '',
          nextFollowUpDate: item.latestCall?.nextFollowUpDate,
          updatedAt: item.latestCall?.updatedAt,
          recordingUrl: item.latestCall?.recordingUrl,
        };
      });

      setContactMap(nextContactMap);
      setContactLatestCallMap(nextLatestMap);
    } catch (error) {
      console.error('Failed to fetch contact summaries/latest history:', error);
      setContactMap({});
      setContactLatestCallMap({});
    }
  };

  const goToNextLead = () => {
    if (!leadId || leads.length === 0) return;

    const currentIndex = leads.findIndex((l) => l.id === Number(leadId));
    const nextLead = leads[currentIndex + 1];

    if (nextLead) {
      setLeadId(String(nextLead.id));
    } else {
      setLeadId('');
      setMessage('Call logged successfully. No more leads in queue.');
    }
  };

  const selectedLead = leads.find((l) => l.id === Number(leadId));
  const followUpDateValue = nextFollowUpDate ? dayjs(nextFollowUpDate) : null;
const followUpTimeValue = nextFollowUpDate ? dayjs(nextFollowUpDate) : null;

const updateFollowUpDatePart = (newDate: Dayjs | null) => {
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

const updateFollowUpTimePart = (newTime: Dayjs | null) => {
  if (!newTime) {
    return;
  }

  const base = nextFollowUpDate ? dayjs(nextFollowUpDate) : dayjs();
  const merged = base
    .hour(newTime.hour())
    .minute(newTime.minute())
    .second(0)
    .millisecond(0);

  setNextFollowUpDate(merged.format('YYYY-MM-DDTHH:mm'));
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!user) {
      setMessage('Unable to identify logged-in user');
      return;
    }

    if (!leadId) {
      setMessage('Please select a lead');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        leadId: Number(leadId),
        callStatus,
        callNotes,
        recordingUrl,
        leadPotential: leadPotential || undefined,
      };

      if (nextFollowUpDate) {
        payload.nextFollowUpDate = new Date(nextFollowUpDate).toISOString();
      }

      await axios.post(`${backendUrl}/telecalling`, payload, {
        headers: getAuthHeaders(),
      });

      setMessage('Call logged successfully');
      setCallStatus('CONNECTED');
      setCallNotes('');
      setNextFollowUpDate('');
      setRecordingUrl('');
      setLeadPotential('');
      await fetchCalls(1);
      goToNextLead();
    } catch (error: any) {
      console.error('Failed to log call:', error);
      setMessage(error?.response?.data?.message || 'Failed to log call');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSave = async (callId: number) => {
    try {
      await axios.patch(
        `${backendUrl}/telecalling/${callId}/review`,
        {
          reviewStatus: reviewStatusMap[callId],
          reviewNotes: reviewNotesMap[callId],
        },
        {
          headers: getAuthHeaders(),
        },
      );

      setMessage('Review updated successfully');
      await fetchCalls(1);
    } catch (error: any) {
      console.error('Failed to update review:', error);
      setMessage(error?.response?.data?.message || 'Failed to update review');
    }
  };

  const handleAssignAssistant = async (call: EnrichedCallRow) => {
    const assistantId = assignAssistantMap[call.id];

    if (!assistantId) {
      setMessage('Please select telecalling assistant first');
      return;
    }

    if (!call.contactId) {
      setMessage('Assistant assignment is available only for contact-based history');
      return;
    }

    try {
      setAssigningAssistantId(call.id);

      await axios.patch(
        `${backendUrl}/telecalling/contacts/${call.contactId}/assign-review`,
        { assignedTo: Number(assistantId) },
        { headers: getAuthHeaders() },
      );

      setMessage('Telecalling assistant assigned successfully');
      await fetchCalls(1);
    } catch (error: any) {
      console.error('Failed to assign assistant:', error);
      setMessage(error?.response?.data?.message || 'Failed to assign assistant');
    } finally {
      setAssigningAssistantId(null);
    }
  };

  const handleCallback = (row: EnrichedCallRow) => {
    if (!row.displayPhone || row.displayPhone === '-') {
      setMessage('Phone not available for callback');
      return;
    }

    if (row.leadId) {
      setLeadId(String(row.leadId));
      setCallStatus('CALLBACK');
      setCallNotes(row.effectiveNotes || '');
      setLeadPotential(row.leadPotential || '');
    }

    if (typeof window !== 'undefined') {
      window.open(`tel:${row.displayPhone}`, '_self');
    }
  };

  const handleConvertAssignedContactToLead = async (contactId?: number | null) => {
    if (!contactId) {
      setMessage('Contact not found for conversion');
      return;
    }

    try {
      setConvertingContactId(contactId);
      await axios.post(
        `${backendUrl}/telecalling/contacts/${contactId}/convert`,
        {},
        { headers: getAuthHeaders() },
      );
      setMessage('Contact converted to lead successfully');
      await fetchCalls(1);
    } catch (error: any) {
      console.error('Failed to convert contact to lead:', error);
      setMessage(error?.response?.data?.message || 'Failed to convert contact');
    } finally {
      setConvertingContactId(null);
    }
  };

  const clearFilters = () => {
  setNameFilter('');
  setPhoneFilter('');
  setCityFilter('');
    setTelecallerNameFilter('');
  setSortOrder('NEWEST');
  setLeadPotentialFilter('');
  setCallResultFilter('');
    setSelectedReminderDate(null);
  setPage(1);
};

  const enrichedCalls = useMemo<EnrichedCallRow[]>(() => {
    return calls.map((call) => {
      if (call.leadId) {
        const lead = leads.find((item) => item.id === call.leadId);

        return {
          ...call,
          displayName: lead?.name || `Lead #${call.leadId}`,
          displayPhone: lead?.phone || '-',
          displayCity: lead?.city || '-',
          rowType: 'LEAD',
          personKey: `lead-${call.leadId}`,
          effectiveStatus: call.disposition || call.callStatus,
          effectiveNotes: call.callNotes || '',
          effectiveNextFollowUpDate: call.nextFollowUpDate,
          effectiveTimestamp: call.createdAt,
          reviewAssignedLabel: call.reviewAssignedToName || '-',
          isConvertedToLead: true,
        };
      }

      if (call.contactId) {
        const contact = contactMap[call.contactId];
        const latestContactCall = contactLatestCallMap[call.contactId];

        return {
          ...call,
          displayName: contact?.name || `Contact #${call.contactId}`,
          displayPhone: contact?.phone || '-',
          displayCity: contact?.city || contact?.address || contact?.location || '-',
          rowType: 'CONTACT',
          personKey: `contact-${call.contactId}`,
          effectiveStatus:
            latestContactCall?.callStatus || call.disposition || call.callStatus,
          effectiveNotes: latestContactCall?.notes || call.callNotes || '',
          effectiveNextFollowUpDate:
            latestContactCall?.nextFollowUpDate || call.nextFollowUpDate,
          effectiveTimestamp: latestContactCall?.updatedAt || call.createdAt,
         recordingUrl: latestContactCall?.recordingUrl || call.recordingUrl,
          reviewAssignedLabel:
            call.reviewAssignedToName || contact?.reviewAssignedToName || '-',
          isConvertedToLead: Boolean(contact?.convertedToLead),
        };
      }

      return {
        ...call,
        displayName: '-',
        displayPhone: '-',
        displayCity: '-',
        rowType: 'UNKNOWN',
        personKey: `unknown-${call.id}`,
        effectiveStatus: call.disposition || call.callStatus,
        effectiveNotes: call.callNotes || '',
        effectiveNextFollowUpDate: call.nextFollowUpDate,
        effectiveTimestamp: call.createdAt,
        reviewAssignedLabel: call.reviewAssignedToName || '-',
        isConvertedToLead: false,
      };
    });
  }, [calls, leads, contactMap, contactLatestCallMap]);

  const latestOnlyCalls = useMemo(() => {
    const sorted = [...enrichedCalls].sort(
      (a, b) =>
        new Date(b.effectiveTimestamp).getTime() -
        new Date(a.effectiveTimestamp).getTime(),
    );

    const latestMap = new Map<string, EnrichedCallRow>();

    for (const row of sorted) {
      if (!latestMap.has(row.personKey)) {
        latestMap.set(row.personKey, row);
      }
    }

    return Array.from(latestMap.values());
  }, [enrichedCalls]);

  const filteredCalls = useMemo(() => {
  const base = [...latestOnlyCalls];

  return base.sort((a, b) => {
    const aTime = new Date(a.effectiveTimestamp).getTime();
    const bTime = new Date(b.effectiveTimestamp).getTime();
    return sortOrder === 'NEWEST' ? bTime - aTime : aTime - bTime;
  });
}, [latestOnlyCalls, sortOrder]);

  const reminderCalendarCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredCalls.forEach((call) => {
      if (!call.effectiveNextFollowUpDate) return;

      const key = dayjs(call.effectiveNextFollowUpDate).format('YYYY-MM-DD');
      counts[key] = (counts[key] || 0) + 1;
    });

    return counts;
  }, [filteredCalls]);

  const calendarFilteredCalls = useMemo(() => {
    if (!selectedReminderDate) return filteredCalls;

    const selectedKey = selectedReminderDate.format('YYYY-MM-DD');

    return filteredCalls.filter((call) => {
      if (!call.effectiveNextFollowUpDate) return false;
      return dayjs(call.effectiveNextFollowUpDate).format('YYYY-MM-DD') === selectedKey;
    });
  }, [filteredCalls, selectedReminderDate]);

  const selectedReminderDateCalls = useMemo(() => {
    if (!selectedReminderDate) return [];

    const selectedKey = selectedReminderDate.format('YYYY-MM-DD');

    return filteredCalls.filter((call) => {
      if (!call.effectiveNextFollowUpDate) return false;
      return dayjs(call.effectiveNextFollowUpDate).format('YYYY-MM-DD') === selectedKey;
    });
  }, [filteredCalls, selectedReminderDate]);

  return (
    <div className="overflow-x-hidden p-4 md:p-6">
      {canLogCalls && !isAssistant && (
        <div className="mb-6 rounded-2xl bg-white p-4 shadow md:p-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between overflow-hidden">
            <h1 className="text-2xl font-bold">Telecalling</h1>

            <Link
              href="/telecalling/contacts"
              className="rounded-xl bg-purple-600 px-4 py-2 text-center font-medium text-white"
            >
              Go to Contacts
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row">
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="w-full rounded-xl border border-gray-400 px-4 py-3"
              >
                <option value="">Select lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} ({lead.phone})
                  </option>
                ))}
              </select>

              {selectedLead?.phone && (
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="rounded-xl bg-green-600 px-4 py-3 text-center font-semibold text-white"
                >
                  📞 Call
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select
                value={callStatus}
                onChange={(e) => setCallStatus(e.target.value)}
                className="w-full rounded-xl border border-gray-400 px-4 py-3"
              >
                <option value="CONNECTED">CONNECTED</option>
                <option value="CALLBACK">CALLBACK</option>
                <option value="INTERESTED">INTERESTED</option>
                <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                <option value="CNR">CNR</option>
                <option value="PROPOSAL_SENT">PROPOSAL_SENT</option>
              </select>

              <select
                value={leadPotential}
                onChange={(e) => setLeadPotential(e.target.value)}
                className="w-full rounded-xl border border-gray-400 px-4 py-3"
              >
                <option value="">Select lead potential</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>

            <input
              type="text"
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              placeholder="Call notes"
              className="w-full rounded-xl border border-gray-400 px-4 py-3"
            />

            <input
              type="text"
              value={recordingUrl}
              onChange={(e) => setRecordingUrl(e.target.value)}
              placeholder="Recording URL"
              className="w-full rounded-xl border border-gray-400 px-4 py-3"
            />

            <LocalizationProvider dateAdapter={AdapterDayjs}>
  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
    <DatePicker
      label="Follow-up Date"
      value={followUpDateValue}
      onChange={updateFollowUpDatePart}
      slotProps={{
        textField: {
          fullWidth: true,
          className: 'w-full',
        },
      }}
    />

    <MobileTimePicker
  label="Follow-up Time"
  value={followUpTimeValue}
  onChange={updateFollowUpTimePart}
  ampm
  ampmInClock
  slotProps={{
    textField: {
      fullWidth: true,
      className: 'w-full',
    },
  }}
/>

    <div className="mt-2 flex items-center gap-2">
  <button
    type="button"
    className={`px-3 py-1 rounded-lg border ${
      followUpTimeValue && followUpTimeValue.hour() < 12
        ? 'bg-blue-600 text-white'
        : 'bg-white'
    }`}
    onClick={() => {
      if (!followUpTimeValue) return;
      updateFollowUpTimePart(followUpTimeValue.hour(followUpTimeValue.hour() % 12));
    }}
  >
    AM
  </button>

  <button
    type="button"
    className={`px-3 py-1 rounded-lg border ${
      followUpTimeValue && followUpTimeValue.hour() >= 12
        ? 'bg-blue-600 text-white'
        : 'bg-white'
    }`}
    onClick={() => {
      if (!followUpTimeValue) return;
      updateFollowUpTimePart(
        followUpTimeValue.hour((followUpTimeValue.hour() % 12) + 12)
      );
    }}
  >
    PM
  </button>
</div>
  </div>
</LocalizationProvider>

            {message && (
              <p
                className={`text-sm ${
                  message.toLowerCase().includes('success') ||
                  message.toLowerCase().includes('successfully')
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {message}
              </p>
            )}

            <div className="flex flex-col gap-2 md:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
              >
                {loading ? 'Saving...' : 'Log Call'}
              </button>

              <button
                type="button"
                onClick={goToNextLead}
                className="rounded-xl bg-gray-700 px-6 py-3 font-semibold text-white"
              >
                Next Lead
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl bg-white p-4 shadow md:p-6">
        <div className="mb-4 flex flex-col gap-4">
          <h2 className="text-2xl font-bold">
            {isAssistant
              ? 'Assigned Review Queue'
              : canReview
              ? 'Call Review Queue'
              : 'Call History'}
          </h2>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-6">
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Search by name"
              className="rounded-xl border border-gray-300 px-3 py-2"
            />

            <input
              type="text"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              placeholder="Search by phone"
              className="rounded-xl border border-gray-300 px-3 py-2"
            />

            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Search by city/area/location"
              className="rounded-xl border border-gray-300 px-3 py-2"
            />
            

            <input
  placeholder="Search by telecaller"
  value={telecallerNameFilter}
  onChange={(e) => setTelecallerNameFilter(e.target.value)}
  className="rounded-2xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white"
/>

            <select
              value={callResultFilter}
              onChange={(e) => setCallResultFilter(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2"
            >
              <option value="">All Results</option>
              <option value="INTERESTED">INTERESTED</option>
              <option value="NOT_INTERESTED">NOT_INTERESTED</option>
              <option value="CNR">CNR</option>
              <option value="CALLBACK">CALLBACK</option>
              <option value="PROPOSAL_SENT">PROPOSAL_SENT</option>
              <option value="CONNECTED">CONNECTED</option>
              <option value="NO_RESPONSE">NO_RESPONSE</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) =>
                setSortOrder(e.target.value as 'NEWEST' | 'OLDEST')
              }
              className="rounded-xl border border-gray-300 px-3 py-2"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>

            <select
              value={leadPotentialFilter}
              onChange={(e) => setLeadPotentialFilter(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2"
            >
              <option value="">All Potentials</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
  <button
    type="button"
    onClick={clearFilters}
    className="rounded-xl bg-gray-200 px-4 py-2 font-medium text-gray-700"
  >
    Clear Filters
  </button>

  <p className="text-sm text-gray-600">
    Total Records: <span className="font-semibold">{total}</span>
  </p>
</div>

        {message && <p className="mb-4 text-sm text-blue-600">{message}</p>}

                <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Reminder Calendar</h3>
              <p className="text-sm text-blue-700">
                Click a date to filter review queue by next follow-up reminders
              </p>
            </div>

            {selectedReminderDate && (
              <button
                type="button"
                onClick={() => setSelectedReminderDate(null)}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200"
              >
                Clear Selected Date
              </button>
            )}
          </div>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
              <div className="rounded-2xl bg-white p-3 shadow-sm">
                <DateCalendar
  value={selectedReminderDate}
  onChange={(newValue) => setSelectedReminderDate(newValue)}
/>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <h4 className="mb-3 text-base font-semibold text-gray-900">
                  {selectedReminderDate
                    ? `Reminders for ${selectedReminderDate.format('DD MMM YYYY')}`
                    : 'Select a date to view reminders'}
                </h4>

                {!selectedReminderDate ? (
                  <p className="text-sm text-gray-500">
                    Dates with reminder counts are highlighted on the calendar.
                  </p>
                ) : selectedReminderDateCalls.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No review queue reminders on this date.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedReminderDateCalls.map((call) => (
                      <div
                        key={`reminder-${call.personKey}`}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-gray-900">
                            {call.displayName} ({call.displayPhone})
                          </p>
                          <p className="text-sm text-gray-600">
                            {call.displayCity || '-'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Status: {call.effectiveStatus || '-'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Reminder:{' '}
                            {call.effectiveNextFollowUpDate
                              ? new Date(call.effectiveNextFollowUpDate).toLocaleString()
                              : '-'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </LocalizationProvider>
        </div>

                {calendarFilteredCalls.length === 0 ? (
          <p>No calls found</p>
        ) : (
          <>
            <div className="space-y-4 overflow-x-hidden md:hidden">
                            {calendarFilteredCalls.map((call) => (
                <div
  key={call.personKey}
  className="w-full max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
>
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-lg font-semibold text-gray-900">
                        {call.displayName}
                      </h3>
                      <p className="break-all text-sm text-gray-600">{call.displayPhone}</p>
                      <p className="break-words text-sm text-gray-500">{call.displayCity}</p>
                    </div>

                    <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {call.effectiveStatus || '-'}
                    </div>
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Potential</p>
                      <p className="font-medium">{call.leadPotential || '-'}</p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Assistant</p>
                      <p className="font-medium">{call.reviewAssignedLabel || '-'}</p>
                    </div>

                    <div className="col-span-2 rounded-xl bg-gray-50 p-3 overflow-hidden">
                      <p className="text-xs text-gray-500">Latest Notes</p>
                      <p className="break-words font-medium">{call.effectiveNotes || '-'}</p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Next Follow-up</p>
                      <p className="font-medium">
                        {call.effectiveNextFollowUpDate
                          ? new Date(call.effectiveNextFollowUpDate).toLocaleString()
                          : '-'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Updated</p>
                      <p className="font-medium">
                        {new Date(call.effectiveTimestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {canAssignAssistant && call.rowType === 'CONTACT' && call.contactId && (
                    <div className="mb-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                      <p className="mb-2 text-sm font-medium text-indigo-800">
                        Assign to Telecalling Assistant
                      </p>
                      <div className="flex flex-col gap-2">
                        <select
                          value={assignAssistantMap[call.id] || ''}
                          onChange={(e) =>
                            setAssignAssistantMap((prev) => ({
                              ...prev,
                              [call.id]: e.target.value,
                            }))
                          }
                          className="rounded-xl border px-3 py-2"
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
                          type="button"
                          onClick={() => handleAssignAssistant(call)}
                          disabled={assigningAssistantId === call.id}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-white"
                        >
                          {assigningAssistantId === call.id
                            ? 'Assigning...'
                            : 'Assign Assistant'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mb-3 flex flex-wrap gap-2 overflow-hidden">
                    {!isAssistant && call.displayPhone !== '-' && (
                      <button
                        type="button"
                        onClick={() => handleCallback(call)}
                        className="w-full rounded-xl bg-green-600 px-4 py-2 text-white sm:w-auto"
                      >
                        Callback
                      </button>
                    )}

                    {call.rowType === 'CONTACT' && call.contactId && (
                      <button
                        type="button"
                        onClick={() =>
  router.push(`/telecalling/contacts/${call.contactId}?from=review-queue`)
}
                        className="w-full rounded-xl bg-purple-600 px-4 py-2 text-white sm:w-auto"
                      >
                        Open Contact
                      </button>
                    )}

                    {call.rowType === 'LEAD' && call.leadId && (
                      <Link
                        href={`/leads/${call.leadId}`}
                        className="w-full rounded-xl bg-blue-600 px-4 py-2 text-white sm:w-auto"
                      >
                        Open Lead
                      </Link>
                    )}

                    {isAssistant && call.rowType === 'CONTACT' && call.contactId && !call.isConvertedToLead && (
                      <button
                        type="button"
                        onClick={() =>
                          handleConvertAssignedContactToLead(call.contactId)
                        }
                        disabled={convertingContactId === call.contactId}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-white"
                      >
                        {convertingContactId === call.contactId
                          ? 'Converting...'
                          : 'Convert to Lead'}
                      </button>
                    )}

                    {call.recordingUrl && (
                      <a
                        href={call.recordingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full rounded-xl bg-gray-800 px-4 py-2 text-white sm:w-auto"
                      >
                        Recording
                      </a>
                    )}
                  </div>

                  {canReview && (
                    <div className="space-y-2 overflow-hidden rounded-xl bg-gray-50 p-3">
                      <select
                        value={reviewStatusMap[call.id] || 'PENDING'}
                        onChange={(e) =>
                          setReviewStatusMap((prev) => ({
                            ...prev,
                            [call.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border px-3 py-2"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="POTENTIAL">POTENTIAL</option>
                        <option value="CONVERTED">CONVERTED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>

                      <input
                        value={reviewNotesMap[call.id] || ''}
                        onChange={(e) =>
                          setReviewNotesMap((prev) => ({
                            ...prev,
                            [call.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border px-3 py-2"
                        placeholder="Review notes"
                      />

                      <button
                        type="button"
                        onClick={() => handleReviewSave(call.id)}
                        className="w-full rounded-xl bg-blue-600 px-4 py-2 text-white"
                      >
                        Save Review
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border p-2 text-left">Lead / Contact</th>
                    <th className="border p-2 text-left">Phone</th>
                    <th className="border p-2 text-left">City</th>
                    <th className="border p-2">Telecaller</th>
                    <th className="border p-2">Assigned Date</th>
                    <th className="border p-2 text-left">Latest Status</th>
                    <th className="border p-2 text-left">Potential</th>
                    <th className="border p-2 text-left">Latest Notes</th>
                    <th className="border p-2 text-left">Recording</th>
                    <th className="border p-2 text-left">Next Follow-up</th>
                    <th className="border p-2 text-left">Assistant</th>
                    {canAssignAssistant && (
                      <th className="border p-2 text-left">Assign Assistant</th>
                    )}
                    <th className="border p-2 text-left">Actions</th>
                    {canReview && (
                      <>
                        <th className="border p-2 text-left">Review Status</th>
                        <th className="border p-2 text-left">Review Notes</th>
                        <th className="border p-2 text-left">Save</th>
                      </>
                    )}
                    <th className="border p-2 text-left">Updated At</th>
                  </tr>
                </thead>
                <tbody>
                                {calendarFilteredCalls.map((call) => (
                    <tr key={call.personKey}>
                      <td className="border p-2 break-words">{call.displayName}</td>
                      <td className="border p-2 break-all">{call.displayPhone}</td>
                      <td className="border p-2 break-words">{call.displayCity}</td>
                      <td className="border p-2 break-words">
  {(call as any).telecallerName || '-'}
</td>

<td className="border p-2">
  {(call as any).assignedDate
    ? new Date((call as any).assignedDate).toLocaleString()
    : '-'}
</td>
                      <td className="border p-2">{call.effectiveStatus}</td>
                      <td className="border p-2">{call.leadPotential || '-'}</td>
                      <td className="border p-2 break-words">{call.effectiveNotes || '-'}</td>

                      <td className="border p-2">
                        {call.recordingUrl ? (
                          <a
                            href={call.recordingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            Open
                          </a>
                        ) : (
                          'No Recording'
                        )}
                      </td>

                      <td className="border p-2">
                        {call.effectiveNextFollowUpDate
                          ? new Date(call.effectiveNextFollowUpDate).toLocaleString()
                          : '-'}
                      </td>

                      <td className="border p-2">{call.reviewAssignedLabel}</td>

                      {canAssignAssistant && (
                        <td className="border p-2 min-w-[260px]">
                          {call.rowType === 'CONTACT' && call.contactId ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <select
                                  value={assignAssistantMap[call.id] || ''}
                                  onChange={(e) =>
                                    setAssignAssistantMap((prev) => ({
                                      ...prev,
                                      [call.id]: e.target.value,
                                    }))
                                  }
                                  className="rounded border px-2 py-1"
                                >
                                  <option value="">Select assistant</option>
                                  {assistants.map((assistant) => (
                                    <option key={assistant.id} value={assistant.id}>
                                      {assistant.name}
                                      {assistant.email
                                        ? ` (${assistant.email})`
                                        : ''}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  onClick={() => handleAssignAssistant(call)}
                                  disabled={assigningAssistantId === call.id}
                                  className="rounded bg-indigo-600 px-3 py-1 text-white"
                                >
                                  {assigningAssistantId === call.id
                                    ? 'Assigning...'
                                    : 'Assign'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      )}

                      <td className="border p-2">
                        <div className="flex flex-wrap gap-2">
                          {!isAssistant && call.displayPhone !== '-' && (
                            <button
                              type="button"
                              onClick={() => handleCallback(call)}
                              className="rounded bg-green-600 px-3 py-1 text-white"
                            >
                              Callback
                            </button>
                          )}

                          {call.rowType === 'CONTACT' && call.contactId && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
  router.push(`/telecalling/contacts/${call.contactId}?from=review-queue`)
}
                                className="rounded bg-purple-600 px-3 py-1 text-white"
                              >
                                Open Contact
                              </button>

                              {isAssistant && !call.isConvertedToLead && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleConvertAssignedContactToLead(call.contactId)
                                  }
                                  disabled={convertingContactId === call.contactId}
                                  className="rounded bg-blue-600 px-3 py-1 text-white"
                                >
                                  {convertingContactId === call.contactId
                                    ? 'Converting...'
                                    : 'Convert to Lead'}
                                </button>
                              )}
                            </>
                          )}

                          {call.rowType === 'LEAD' && call.leadId && (
                            <Link
                              href={`/leads/${call.leadId}`}
                              className="rounded bg-blue-600 px-3 py-1 text-white"
                            >
                              Open Lead
                            </Link>
                          )}
                        </div>
                      </td>

                      {canReview && (
                        <>
                          <td className="border p-2">
                            <select
                              value={reviewStatusMap[call.id] || 'PENDING'}
                              onChange={(e) =>
                                setReviewStatusMap((prev) => ({
                                  ...prev,
                                  [call.id]: e.target.value,
                                }))
                              }
                              className="rounded border px-2 py-1"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="POTENTIAL">POTENTIAL</option>
                              <option value="CONVERTED">CONVERTED</option>
                              <option value="REJECTED">REJECTED</option>
                            </select>
                          </td>

                          <td className="border p-2">
                            <input
                              value={reviewNotesMap[call.id] || ''}
                              onChange={(e) =>
                                setReviewNotesMap((prev) => ({
                                  ...prev,
                                  [call.id]: e.target.value,
                                }))
                              }
                              className="w-full rounded border px-2 py-1"
                            />
                          </td>

                          <td className="border p-2">
                            <button
                              onClick={() => handleReviewSave(call.id)}
                              className="rounded bg-blue-600 px-3 py-1 text-white"
                            >
                              Save
                            </button>
                          </td>
                        </>
                      )}

                      <td className="border p-2">
                        {new Date(call.effectiveTimestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
{totalPages > 1 && (
  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
    <button
      type="button"
      disabled={page === 1}
      onClick={() => fetchCalls(page - 1)}
      className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
    >
      Previous
    </button>

    <span className="text-sm font-medium text-gray-700">
      Page {page} of {totalPages}
    </span>

    <button
      type="button"
      disabled={page === totalPages}
      onClick={() => fetchCalls(page + 1)}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      Next
    </button>
  </div>
)}

          </>
        )}
      </div>
    </div>
  );
}
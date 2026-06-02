'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';
import { useRouter } from 'next/navigation';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';

type Lead = {
  id: number;
  name: string;
  phone: string;
  city?: string;
  zone?: string;
  potential?: string;
};

type FollowUp = {
  id: number;
  leadId: number;
    meetingId?: number | null;
  contactId?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  assignedTo?: number;
  followUpDate: string;
  status: string;
  note?: string;
    sourceModule?: string;
  sourceStage?: string;
  followUpType?: string;
  createdByName?: string;
    lead?: {
    id: number;
    name: string;
    phone: string;
    city?: string;
    zone?: string;
    potential?: string;
    assignedTo?: number;
    createdByName?: string;
  };
};

type User = {
  id: number;
  name: string;
  email: string;
  roles: string[];
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function FollowupPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allFollowups, setAllFollowups] = useState<FollowUp[]>([]);
  const [overdueFollowups, setOverdueFollowups] = useState<FollowUp[]>([]);
const [overdueTotal, setOverdueTotal] = useState(0);
const [overduePage, setOverduePage] = useState(1);
const overdueLimit = 20;
  const [followupPage, setFollowupPage] = useState(1);
const [followupTotal, setFollowupTotal] = useState(0);
const followupLimit = 50;

  const [leadId, setLeadId] = useState('');
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
const [selectedFollowups, setSelectedFollowups] = useState<FollowUp[]>([]);
const [nameFilter, setNameFilter] = useState('');
const [phoneFilter, setPhoneFilter] = useState('');
const [cityFilter, setCityFilter] = useState('');
const [potentialFilter, setPotentialFilter] = useState('');
const [zoneFilter, setZoneFilter] = useState('');
const [bulkAssignedTo, setBulkAssignedTo] = useState('');
const [assignLimit, setAssignLimit] = useState('');
const [assigningFiltered, setAssigningFiltered] = useState(false);
const [sourceFilter, setSourceFilter] = useState('');
const [statusFilter, setStatusFilter] = useState('');
const [dueFilter, setDueFilter] = useState('');

  const userRoles = user?.roles || [];

  const canCreateFollowup =
    userRoles.includes('OWNER') ||
    userRoles.includes('LEAD_MANAGER') ||
    userRoles.includes('TELECALLER') ||
    userRoles.includes('LEAD_EXECUTIVE') ||
    userRoles.includes('MEETING_MANAGER');

  const canFetchAssignableUsers =
    userRoles.includes('OWNER') ||
    userRoles.includes('LEAD_MANAGER') ||
    userRoles.includes('TELECALLING_MANAGER');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      window.location.href = '/';
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch {
      localStorage.clear();
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
  if (user) {
    fetchLeads();
    fetchFollowups(followupPage);
    fetchOverdueFollowups(overduePage);

    if (canFetchAssignableUsers) {
      fetchAssignableUsers();
    } else {
      setUsers([]);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user, followupPage, overduePage]);

  const fetchAssignableUsers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/users/assignable-staff`, {
        headers: getAuthHeaders(),
      });

      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setUsers([]);
    }
  };

  const fetchLeads = async () => {
    try {
      const params: any = {};

      if (userRoles.includes('TELECALLER')) {
        params.assignedTo = user?.id;
      }

      const res = await axios.get(`${backendUrl}/leads`, {
        params,
        headers: getAuthHeaders(),
      });

      const responseData = res.data || {};

const leadData = Array.isArray(responseData.data)
  ? responseData.data
  : Array.isArray(responseData)
  ? responseData
  : [];

setLeads(leadData);
    } catch (error) {
      console.error(error);
      setLeads([]);
    }
  };

  const fetchFollowups = async (pageNumber = followupPage) => {
  try {
    const res = await axios.get(`${backendUrl}/followup`, {
      params: {
        page: pageNumber,
        limit: followupLimit,
      },
      headers: getAuthHeaders(),
    });

    setAllFollowups(Array.isArray(res.data?.data) ? res.data.data : []);
    setFollowupTotal(Number(res.data?.total || 0));
  } catch (error) {
    console.error(error);
    setAllFollowups([]);
    setFollowupTotal(0);
  }
};

const fetchOverdueFollowups = async (pageNumber = overduePage) => {
  try {
    const res = await axios.get(`${backendUrl}/followup/overdue`, {
      params: {
        page: pageNumber,
        limit: overdueLimit,
      },
      headers: getAuthHeaders(),
    });

    setOverdueFollowups(Array.isArray(res.data?.data) ? res.data.data : []);
    setOverdueTotal(Number(res.data?.total || 0));
  } catch (error) {
    console.error(error);
    setOverdueFollowups([]);
    setOverdueTotal(0);
  }
};

 const handleDateClick = async (date: Dayjs | null) => {
  if (!date) return;

  setSelectedDate(date);

  const formatted = date.format('YYYY-MM-DD');

  try {
    const res = await axios.get(
      `${backendUrl}/followup/by-date`,
      {
        params: { date: formatted },
        headers: getAuthHeaders(),
      }
    );

    setSelectedFollowups(res.data || []);
  } catch (error) {
    console.error(error);
    setSelectedFollowups([]);
  }
};

  const getFollowupsByDate = () => {
  const map: Record<string, number> = {};

  allFollowups.forEach((f) => {
    const date = f.followUpDate.split('T')[0];
    map[date] = (map[date] || 0) + 1;
  });

  return map;
};

const followupCountMap = getFollowupsByDate();

const todayKey = dayjs().format('YYYY-MM-DD');

const todayFollowupsCount = allFollowups.filter((f) => {
  const dateKey = dayjs(f.followUpDate).format('YYYY-MM-DD');
  return dateKey === todayKey && String(f.status).toUpperCase() === 'PENDING';
}).length;

const overdueFollowupsCount = allFollowups.filter((f) => {
  return (
    dayjs(f.followUpDate).isBefore(dayjs(), 'day') &&
    String(f.status).toUpperCase() === 'PENDING'
  );
}).length;

const pendingFollowupsCount = allFollowups.filter(
  (f) => String(f.status || '').toUpperCase() === 'PENDING',
).length;

const completedFollowupsCount = allFollowups.filter(
  (f) => String(f.status || '').toUpperCase() === 'COMPLETED',
).length;

const leadFollowupsCount = allFollowups.filter(
  (f) => String(f.sourceModule || '').toUpperCase() === 'LEAD',
).length;

const meetingFollowupsCount = allFollowups.filter(
  (f) => String(f.sourceModule || '').toUpperCase() === 'MEETING',
).length;

const telecallingFollowupsCount = allFollowups.filter(
  (f) => String(f.sourceModule || '').toUpperCase() === 'TELECALLING',
).length;

const assignedFollowupsCount = allFollowups.filter(
  (f) => !!f.assignedTo,
).length;

const unassignedFollowupsCount = allFollowups.filter(
  (f) => !f.assignedTo,
).length;

const manualFollowupsCount = allFollowups.filter(
  (f) =>
    String(f.sourceModule || 'FOLLOWUP').toUpperCase() ===
    'FOLLOWUP',
).length;

const getSelectedFollowupRowColor = (f: FollowUp) => {
  const status = String(f.status || '').toUpperCase();

  if (status === 'COMPLETED') {
    return 'border-green-200 bg-green-50';
  }

  const followupDay = dayjs(f.followUpDate);

  if (status === 'PENDING' && followupDay.isBefore(dayjs(), 'day')) {
    return 'border-red-200 bg-red-50';
  }

  if (status === 'PENDING' && followupDay.isSame(dayjs(), 'day')) {
    return 'border-yellow-200 bg-yellow-50';
  }

  return 'border-gray-200 bg-white';
};

  const handleCreateFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!user) return;

    if (!leadId || !followUpDate) {
      setMessage('Please fill required fields');
      return;
    }

    setLoading(true);

    try {
            await axios.post(
        `${backendUrl}/followup/create`,
        {
          leadId: Number(leadId),
          assignedTo: user.id,
          note,
          followUpDate: new Date(followUpDate).toISOString(),
          status: 'PENDING',
          sourceModule: 'FOLLOWUP',
          sourceStage: 'MANUAL',
        },
        { headers: getAuthHeaders() }
      );

      setMessage('Followup created successfully');
      setLeadId('');
      setNote('');
      setFollowUpDate('');
      setFollowupPage(1);
fetchFollowups(1);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToMeeting = async (followupId: number) => {
    try {
      setConvertingId(followupId);
      setMessage('');

      const res = await axios.get(
        `${backendUrl}/followup/${followupId}/convert-to-meeting`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = res.data || {};
      const lead = data.lead || {};

      const params = new URLSearchParams();

      if (data.leadId) params.set('leadId', String(data.leadId));
      if (data.followupId) params.set('followupId', String(data.followupId));
      if (lead.name) params.set('name', String(lead.name));
      if (lead.phone) params.set('phone', String(lead.phone));
      if (lead.city) params.set('city', String(lead.city));
      if (lead.assignedTo) params.set('assignedTo', String(lead.assignedTo));
      if (lead.createdByName) {
        params.set('leadOwnerName', String(lead.createdByName));
      }

      router.push(`/meeting/create?${params.toString()}`);
    } catch (error: any) {
      console.error(error);
      setMessage(
        error?.response?.data?.message || 'Failed to open convert to meeting'
      );
    } finally {
      setConvertingId(null);
    }
  };

  const handleMarkCompleted = async (followupId: number) => {
  try {
    await axios.patch(
      `${backendUrl}/followup/${followupId}/complete`,
      {},
      {
        headers: getAuthHeaders(),
      },
    );

    await fetchFollowups(followupPage);
    await fetchOverdueFollowups(overduePage);

    if (selectedDate) {
      await handleDateClick(selectedDate);
    }

    setMessage('Followup marked completed');
  } catch (error: any) {
    console.error(error);

    setMessage(
      error?.response?.data?.message ||
        'Failed to mark followup completed',
    );
  }
};

const leadManagers = users.filter((u) =>
  Array.isArray(u.roles) && u.roles.includes('LEAD_MANAGER')
);
  const handleAssignFiltered = async () => {
    if (!bulkAssignedTo) {
      setMessage('Please select lead manager');
      return;
    }

    try {
      setAssigningFiltered(true);
      setMessage('');

      const res = await axios.patch(
        `${backendUrl}/followup/assign-filtered`,
                {
          assignedTo: Number(bulkAssignedTo),
          name: nameFilter || undefined,
          phone: phoneFilter || undefined,
          leadPotential: potentialFilter || undefined,
          city: cityFilter || undefined,
          zone: zoneFilter || undefined,
          limit: assignLimit ? Number(assignLimit) : undefined,
        },
        { headers: getAuthHeaders() },
      );

      setMessage(res.data?.message || 'Filtered followups assigned successfully');
      setFollowupPage(1);
await fetchFollowups(1);

      if (selectedDate) {
        await handleDateClick(selectedDate);
      }
    } catch (error: any) {
      console.error(error);
      setMessage(
        error?.response?.data?.message || 'Failed to assign filtered followups',
      );
    } finally {
      setAssigningFiltered(false);
    }
  };

  const getUserName = (id?: number) => {
    const found = users.find((u) => u.id === id);
    return found ? `${found.name} (${found.id})` : 'Unassigned';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

    const followUpDateValue = followUpDate ? dayjs(followUpDate) : null;
  const followUpTimeValue = followUpDate ? dayjs(followUpDate) : null;

  const updateFollowUpDatePart = (newDate: Dayjs | null) => {
    if (!newDate) {
      setFollowUpDate('');
      return;
    }

    const base = followUpDate ? dayjs(followUpDate) : dayjs();
    const merged = newDate
      .hour(base.hour())
      .minute(base.minute())
      .second(0)
      .millisecond(0);

    setFollowUpDate(merged.format('YYYY-MM-DDTHH:mm'));
  };

  const updateFollowUpTimePart = (newTime: Dayjs | null) => {
    if (!newTime) {
      return;
    }

    const base = followUpDate ? dayjs(followUpDate) : dayjs();
    const merged = base
      .hour(newTime.hour())
      .minute(newTime.minute())
      .second(0)
      .millisecond(0);

    setFollowUpDate(merged.format('YYYY-MM-DDTHH:mm'));
  };

  const getSourceLabel = (source?: string) => {
  const value = String(source || 'FOLLOWUP').toUpperCase();

  if (value === 'TELECALLING') return 'Telecalling';
  if (value === 'LEAD') return 'Lead';
  if (value === 'MEETING') return 'Meeting';

  return 'Followup';
};

const getSourceColor = (source?: string) => {
  const value = String(source || 'FOLLOWUP').toUpperCase();

  if (value === 'TELECALLING') {
    return 'bg-indigo-100 text-indigo-700';
  }

  if (value === 'LEAD') {
    return 'bg-blue-100 text-blue-700';
  }

  if (value === 'MEETING') {
    return 'bg-purple-100 text-purple-700';
  }

  return 'bg-gray-100 text-gray-700';
};

const getDueLabel = (f: FollowUp) => {
  const status = String(f.status || '').toUpperCase();

  if (status === 'COMPLETED') return 'Completed';

  const date = dayjs(f.followUpDate);

  if (date.isBefore(dayjs(), 'day')) return 'Overdue';
  if (date.isSame(dayjs(), 'day')) return 'Today';

  return 'Upcoming';
};

const getDueColor = (f: FollowUp) => {
  const label = getDueLabel(f);

  if (label === 'Completed') return 'bg-green-100 text-green-700';
  if (label === 'Overdue') return 'bg-red-100 text-red-700';
  if (label === 'Today') return 'bg-yellow-100 text-yellow-700';

  return 'bg-cyan-100 text-cyan-700';
};

  const getStatusColor = (status: string) => {
    if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700';
    if (status === 'COMPLETED') return 'bg-green-100 text-green-700';
    if (status === 'CANCELLED') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getLeadLocationText = (f: FollowUp) => {
  const city = String(f.lead?.city || '').trim();
  const zone = String(f.lead?.zone || '').trim();

  if (city && zone) return `${city} • ${zone}`;
  if (city) return city;
  if (zone) return zone;

  return '';
};

const getLeadPotentialText = (f: FollowUp) => {
  return String(
    f.lead?.potential ||
      (f.lead as any)?.potentialPercentage ||
      '',
  ).trim();
};

const getFollowupCustomerName = (f: FollowUp) => {
  return (
    String(f.lead?.name || '').trim() ||
    String(f.customerName || '').trim() ||
    (f.leadId ? `Lead ID: ${f.leadId}` : '') ||
    (f.meetingId ? `Meeting ID: ${f.meetingId}` : '') ||
    (f.contactId ? `Contact ID: ${f.contactId}` : '') ||
    `Followup ${f.id}`
  );
};

const getFollowupCustomerPhone = (f: FollowUp) => {
  return (
    String(f.lead?.phone || '').trim() ||
    String(f.customerPhone || '').trim()
  );
};

const getSourceOpenPath = (f: FollowUp) => {
  const source = String(f.sourceModule || '').toUpperCase();

  if (source === 'MEETING' && f.meetingId) {
    return `/meeting/${f.meetingId}`;
  }

  if (source === 'TELECALLING' && f.contactId) {
    return `/telecalling/contacts/${f.contactId}`;
  }

  if (f.leadId) {
    return `/leads/${f.leadId}`;
  }

  return '';
};

const getSourceOpenLabel = (f: FollowUp) => {
  const source = String(f.sourceModule || '').toUpperCase();

  if (source === 'MEETING' && f.meetingId) {
    return 'Open Meeting';
  }

  if (source === 'TELECALLING' && f.contactId) {
    return 'Open Contact';
  }

  if (f.leadId) {
    return 'Open Lead';
  }

  return 'Open Source';
};

  const filteredAllFollowups = allFollowups.filter((f) => {
  const name = String(f.lead?.name || '').toLowerCase();
  const phone = String(f.lead?.phone || '').toLowerCase();
  const city = String(f.lead?.city || '').toLowerCase();
  const zone = String(f.lead?.zone || '').toLowerCase();
  const potential = String(f.lead?.potential || '').toUpperCase();

  const matchesName =
    !nameFilter.trim() || name.includes(nameFilter.trim().toLowerCase());

  const matchesPhone =
    !phoneFilter.trim() || phone.includes(phoneFilter.trim().toLowerCase());

  const matchesCity =
    !cityFilter.trim() || city.includes(cityFilter.trim().toLowerCase());

  const matchesZone =
    !zoneFilter.trim() || zone.includes(zoneFilter.trim().toLowerCase());

  const matchesPotential =
    !potentialFilter || potential === potentialFilter.toUpperCase();

    const source = String(f.sourceModule || 'FOLLOWUP').toUpperCase();
const status = String(f.status || '').toUpperCase();
const dueLabel = getDueLabel(f).toUpperCase();

const matchesSource =
  !sourceFilter || source === sourceFilter;

const matchesStatus =
  !statusFilter || status === statusFilter;

const matchesDue =
  !dueFilter || dueLabel === dueFilter;

  return (
  matchesName &&
  matchesPhone &&
  matchesCity &&
  matchesZone &&
  matchesPotential &&
  matchesSource &&
  matchesStatus &&
  matchesDue
);
});

const filteredSelectedFollowups = selectedFollowups.filter((f) => {
  const name = String(f.lead?.name || '').toLowerCase();
  const phone = String(f.lead?.phone || '').toLowerCase();
  const city = String(f.lead?.city || '').toLowerCase();
  const zone = String(f.lead?.zone || '').toLowerCase();
  const potential = String(f.lead?.potential || '').toUpperCase();

  const matchesName =
    !nameFilter.trim() || name.includes(nameFilter.trim().toLowerCase());

  const matchesPhone =
    !phoneFilter.trim() || phone.includes(phoneFilter.trim().toLowerCase());

  const matchesCity =
    !cityFilter.trim() || city.includes(cityFilter.trim().toLowerCase());

  const matchesZone =
    !zoneFilter.trim() || zone.includes(zoneFilter.trim().toLowerCase());

  const matchesPotential =
    !potentialFilter || potential === potentialFilter.toUpperCase();

  return (
    matchesName &&
    matchesPhone &&
    matchesCity &&
    matchesZone &&
    matchesPotential
  );
});

  return (
    <div className="space-y-6 p-6">
      {canCreateFollowup && (
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Create Followup</h2>

          <form onSubmit={handleCreateFollowup} className="space-y-3">
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full rounded border p-2"
            >
              <option value="">Select Lead</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.phone})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded border p-2"
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
        },
      }}
    />
  </div>
</LocalizationProvider>

            <button className="rounded bg-blue-600 px-4 py-2 text-white">
              {loading ? 'Creating...' : 'Create Followup'}
            </button>
          </form>

          {message && <p className="mt-2 text-blue-600">{message}</p>}
        </div>
      )}
<div className="grid grid-cols-2 gap-4 md:grid-cols-5 xl:grid-cols-10">
  <SummaryCard
    title="Pending"
    value={pendingFollowupsCount}
    className="border-yellow-200 bg-yellow-50 text-yellow-900"
  />

  <SummaryCard
    title="Today"
    value={todayFollowupsCount}
    className="border-blue-200 bg-blue-50 text-blue-900"
  />

  <SummaryCard
    title="Overdue"
    value={overdueFollowupsCount}
    className="border-red-200 bg-red-50 text-red-900"
  />

  <SummaryCard
    title="Completed"
    value={completedFollowupsCount}
    className="border-green-200 bg-green-50 text-green-900"
  />

  <SummaryCard
    title="Telecalling"
    value={telecallingFollowupsCount}
    className="border-indigo-200 bg-indigo-50 text-indigo-900"
  />

  <SummaryCard
    title="Lead"
    value={leadFollowupsCount}
    className="border-cyan-200 bg-cyan-50 text-cyan-900"
  />

  <SummaryCard
    title="Meeting"
    value={meetingFollowupsCount}
    className="border-purple-200 bg-purple-50 text-purple-900"
  />

  <SummaryCard
  title="Assigned"
  value={assignedFollowupsCount}
  className="border-emerald-200 bg-emerald-50 text-emerald-900"
/>

<SummaryCard
  title="Unassigned"
  value={unassignedFollowupsCount}
  className="border-orange-200 bg-orange-50 text-orange-900"
/>

<SummaryCard
  title="Manual"
  value={manualFollowupsCount}
  className="border-gray-200 bg-gray-50 text-gray-900"
/>
</div>

<div className="rounded-xl border border-red-200 bg-white p-4 shadow">
  <div className="mb-3 flex items-center justify-between">
    <h2 className="text-lg font-semibold text-red-700">
      Overdue Followups List
    </h2>
    <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
      {overdueTotal}
    </span>
  </div>

  {overdueFollowups.length === 0 ? (
    <p className="text-sm text-gray-500">No overdue followups found</p>
  ) : (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {overdueFollowups.map((f) => (
        <div
          key={f.id}
          className="rounded-xl border border-red-100 bg-red-50 p-3"
        >
          <p className="font-semibold text-gray-900">
            {f.lead?.name || `Lead ${f.leadId}`}
          </p>

          <p className="text-sm text-gray-700">
            {f.lead?.phone || ''}
          </p>

          {getLeadLocationText(f) && (
  <p className="text-sm text-gray-700">
    {getLeadLocationText(f)}
  </p>
)}

          <p className="mt-1 text-sm font-medium text-red-700">
            Due: {formatDate(f.followUpDate)}
          </p>

          {getLeadPotentialText(f) && (
  <p className="text-sm text-gray-700">
    Potential: {getLeadPotentialText(f)}
  </p>
)}

          {f.note && (
            <p className="mt-1 text-sm text-gray-700">
              {f.note}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push(`/followup/${f.id}`)}
              className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
            >
              Open
            </button>

            {String(f.status).toUpperCase() !== 'COMPLETED' && (
  <button
    type="button"
    onClick={() => handleMarkCompleted(f.id)}
    className="rounded bg-green-600 px-3 py-2 text-sm text-white"
  >
    Complete
  </button>
)}

            <button
              type="button"
              onClick={() => handleConvertToMeeting(f.id)}
              disabled={convertingId === f.id}
              className="rounded bg-purple-600 px-3 py-2 text-sm text-white"
            >
              {convertingId === f.id ? 'Opening...' : 'Convert to Meeting'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )}

  <div className="mt-4 flex items-center justify-between">
    <button
      type="button"
      onClick={() => setOverduePage((p) => Math.max(1, p - 1))}
      disabled={overduePage <= 1}
      className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
    >
      Previous
    </button>

    <span className="text-sm font-medium text-gray-700">
      Page {overduePage} of {Math.ceil(overdueTotal / overdueLimit) || 1}
    </span>

    <button
      type="button"
      onClick={() =>
        setOverduePage((p) =>
          p >= Math.ceil(overdueTotal / overdueLimit) ? p : p + 1,
        )
      }
      disabled={overduePage >= Math.ceil(overdueTotal / overdueLimit)}
      className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
    >
      Next
    </button>
  </div>
</div>

<div className="rounded-xl bg-white p-4 shadow">
  <h2 className="mb-4 text-lg font-semibold">
  Followup Calendar ({dayjs().format('MMMM YYYY')})
</h2>

  <LocalizationProvider dateAdapter={AdapterDayjs}>
  <DateCalendar
    value={selectedDate}
    onChange={(newValue) => handleDateClick(newValue)}
    sx={{
      '& .MuiPickersDay-root': {
        position: 'relative',
      },
    }}
  />
</LocalizationProvider>
<div className="rounded-xl bg-white p-4 shadow">
  <h3 className="mb-3 font-semibold">Followup Summary</h3>

  <div className="grid grid-cols-2 gap-2 text-sm">
    {Object.entries(followupCountMap).slice(0, 6).map(([date, count]) => (
      <div key={date} className="flex justify-between border-b pb-1">
        <span>{dayjs(date).format('DD MMM')}</span>
        <span className="font-semibold text-blue-600">{count}</span>
      </div>
    ))}
  </div>
</div>
</div>
<div className="rounded-xl bg-white p-4 shadow">
  <h2 className="mb-4 text-lg font-semibold">Search Followups</h2>

  <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
    <input
      type="text"
      placeholder="Search by name"
      value={nameFilter}
      onChange={(e) => setNameFilter(e.target.value)}
      className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
    />

    <input
      type="text"
      placeholder="Search by phone"
      value={phoneFilter}
      onChange={(e) => setPhoneFilter(e.target.value)}
      className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
    />

    <input
      type="text"
      placeholder="Search by city"
      value={cityFilter}
      onChange={(e) => setCityFilter(e.target.value)}
      className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
    />
  </div>

      <select
      value={potentialFilter}
      onChange={(e) => setPotentialFilter(e.target.value)}
      className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
    >
      <option value="">All Potential</option>
      <option value="LOW">LOW</option>
      <option value="MEDIUM">MEDIUM</option>
      <option value="HIGH">HIGH</option>
    </select>

    <input
      type="text"
      placeholder="Search by zone"
      value={zoneFilter}
      onChange={(e) => setZoneFilter(e.target.value)}
      className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
    />

    <select
  value={sourceFilter}
  onChange={(e) => setSourceFilter(e.target.value)}
  className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
>
  <option value="">All Sources</option>
  <option value="TELECALLING">Telecalling</option>
  <option value="LEAD">Lead</option>
  <option value="MEETING">Meeting</option>
  <option value="FOLLOWUP">Manual Followup</option>
</select>

<select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
>
  <option value="">All Status</option>
  <option value="PENDING">Pending</option>
  <option value="COMPLETED">Completed</option>
  <option value="CANCELLED">Cancelled</option>
</select>

<select
  value={dueFilter}
  onChange={(e) => setDueFilter(e.target.value)}
  className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
>
  <option value="">All Due Types</option>
  <option value="TODAY">Today</option>
  <option value="OVERDUE">Overdue</option>
  <option value="UPCOMING">Upcoming</option>
  <option value="COMPLETED">Completed</option>
</select>

    <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
    <button
      type="button"
      onClick={() => {
        setNameFilter('');
        setPhoneFilter('');
        setCityFilter('');
        setPotentialFilter('');
        setZoneFilter('');
        setSourceFilter('');
setStatusFilter('');
setDueFilter('');
      }}
      className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
    >
      Clear Search
    </button>

    <select
      value={bulkAssignedTo}
      onChange={(e) => setBulkAssignedTo(e.target.value)}
      className="rounded-lg border border-gray-300 p-2"
    >
      <option value="">Select Lead Manager</option>
      {leadManagers.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name} ({u.email})
        </option>
      ))}
    </select>

    <input
  type="number"
  placeholder="Number to assign"
  value={assignLimit}
  onChange={(e) => setAssignLimit(e.target.value)}
  className="rounded-lg border border-gray-300 p-2"
  min={1}
/>

    <button
  type="button"
  onClick={handleAssignFiltered}
  disabled={assigningFiltered}
  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
>
  {assigningFiltered
    ? 'Assigning...'
    : assignLimit
    ? `Assign ${assignLimit} Followups`
    : 'Assign All Filtered'}
</button>
  </div>
    {(nameFilter || phoneFilter || cityFilter || potentialFilter || zoneFilter) && (
  <p className="mt-2 text-sm text-gray-600">
    Filters applied:
    {nameFilter && ` Name: "${nameFilter}"`}
    {phoneFilter && ` Phone: "${phoneFilter}"`}
    {cityFilter && ` City: "${cityFilter}"`}
    {potentialFilter && ` Potential: "${potentialFilter}"`}
    {zoneFilter && ` Zone: "${zoneFilter}"`}
  </p>
)}
</div>

{selectedDate && (
  <div className="rounded-xl bg-white p-4 shadow">
    <h3 className="mb-3 font-semibold">
  Followups on {selectedDate?.format('DD MMMM YYYY')}
  {selectedFollowups.length > 0 && (
    <span className="ml-2 text-sm font-normal text-gray-500">
      ({selectedFollowups.length} items)
    </span>
  )}
</h3>

    {filteredSelectedFollowups.length === 0 ? (
      <p>No followups for this date</p>
    ) : (
      filteredSelectedFollowups.map((f) => (
  <div
    key={f.id}
    className={`mb-2 rounded-xl border p-3 ${getSelectedFollowupRowColor(f)}`}
  >
    <p className="font-medium">
      {f.lead?.name || `Lead ${f.leadId}`}
    </p>

    <p className="text-sm text-gray-600">
      {f.lead?.phone || ''}
    </p>

    {getLeadLocationText(f) && (
  <p className="mt-1 text-sm text-gray-700">
    {getLeadLocationText(f)}
  </p>
)}

{getLeadPotentialText(f) && (
  <p className="mt-1 text-sm text-gray-700">
    Potential: {getLeadPotentialText(f)}
  </p>
)}

    <p className="mt-1 text-sm text-gray-700">
      {formatDate(f.followUpDate)}
    </p>

    {f.note && (
      <p className="mt-1 text-sm text-gray-700">{f.note}</p>
    )}

    <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs ${getStatusColor(f.status)}`}>
      {f.status}
    </span>
  </div>
))
    )}
  </div>
)}

      <div>
        <h2 className="mb-4 text-xl font-semibold">
  All Followups ({filteredAllFollowups.length} of {followupTotal})
</h2>

        {filteredAllFollowups.length === 0 ? (
          <div className="rounded bg-white p-6 shadow">
  No followups found for the applied filters
</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAllFollowups.map((f) => (
              <div
                key={f.id}
                className="rounded-2xl bg-white p-5 shadow transition hover:shadow-lg"
              >
                <div
                  onClick={() => router.push(`/followup/${f.id}`)}
                  className="cursor-pointer"
                >
                  <h3 className="mb-2 text-lg font-semibold">
                    {getFollowupCustomerName(f)}
                  </h3>

                  <div className="mb-3 flex flex-wrap gap-2">
  <span
    className={`rounded-full px-3 py-1 text-xs font-semibold ${getSourceColor(
      f.sourceModule,
    )}`}
  >
    {getSourceLabel(f.sourceModule)}
  </span>

  <span
    className={`rounded-full px-3 py-1 text-xs font-semibold ${getDueColor(
      f,
    )}`}
  >
    {getDueLabel(f)}
  </span>

  {f.sourceStage && (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
      {String(f.sourceStage).replaceAll('_', ' ')}
    </span>
  )}
</div>

                  <p className="mb-2 text-sm text-gray-600">
                    {getFollowupCustomerPhone(f)}
                  </p>

                  {getLeadLocationText(f) && (
  <p className="mb-2 text-sm text-gray-700">
    {getLeadLocationText(f)}
  </p>
)}

{getLeadPotentialText(f) && (
  <p className="mb-2 text-sm text-gray-700">
    <span className="font-medium">Potential:</span>{' '}
    {getLeadPotentialText(f)}
  </p>
)}

                  <p className="mb-2 text-sm">
                    <span className="font-medium">Date:</span>{' '}
                    {formatDate(f.followUpDate)}
                  </p>

                  <p className="mb-2 text-sm">
                    <span className="font-medium">Assigned:</span>{' '}
                    {getUserName(f.assignedTo)}
                  </p>

                  {f.createdByName && (
  <p className="mb-2 text-sm">
    <span className="font-medium">Created By:</span>{' '}
    {f.createdByName}
  </p>
)}

                  {f.note && (
                    <p className="mb-2 text-sm text-gray-700">
                      {f.note}
                    </p>
                  )}

                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs ${getStatusColor(
                      f.status
                    )}`}
                  >
                    {f.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => router.push(`/followup/${f.id}`)}
                    className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
                  >
                    Open
                  </button>

                  {getSourceOpenPath(f) && (
  <button
    type="button"
    onClick={() => router.push(getSourceOpenPath(f))}
    className="rounded bg-gray-700 px-3 py-2 text-sm text-white"
  >
    {getSourceOpenLabel(f)}
  </button>
)}

                  {String(f.status).toUpperCase() !== 'COMPLETED' && (
  <button
    onClick={() => handleMarkCompleted(f.id)}
    className="rounded bg-green-600 px-3 py-2 text-sm text-white"
  >
    Complete
  </button>
)}

                  <button
                    onClick={() => handleConvertToMeeting(f.id)}
                    disabled={convertingId === f.id}
                    className="rounded bg-purple-600 px-3 py-2 text-sm text-white"
                  >
                    {convertingId === f.id
                      ? 'Opening...'
                      : 'Convert to Meeting'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-4 shadow">
  <button
    type="button"
    onClick={() => setFollowupPage((p) => Math.max(1, p - 1))}
    disabled={followupPage <= 1}
    className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
  >
    Previous
  </button>

  <span className="text-sm font-medium text-gray-700">
    Page {followupPage} of {Math.ceil(followupTotal / followupLimit) || 1}
  </span>

  <button
    type="button"
    onClick={() =>
      setFollowupPage((p) =>
        p >= Math.ceil(followupTotal / followupLimit) ? p : p + 1,
      )
    }
    disabled={followupPage >= Math.ceil(followupTotal / followupLimit)}
    className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
  >
    Next
  </button>
</div>
    </div>
  );

  function SummaryCard({
  title,
  value,
  className,
}: {
  title: string;
  value: number;
  className: string;
}) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${className}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
}
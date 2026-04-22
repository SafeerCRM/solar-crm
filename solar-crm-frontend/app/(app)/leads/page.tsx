'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { CallControl } from '@/lib/callControl';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import { getAuthHeaders } from '@/lib/authHeaders';

type Lead = {
  id: number;
  name: string;
  phone: string;
  city?: string;
  zone?: string;
  createdByName?: string;
  assignedTo?: number | null;
  potentialPercentage?: number | null;
  status?: string;
  nextFollowUpDate?: string;
  remarks?: string;
};

type User = {
  id: number;
  name: string;
  roles: string[];
};

type CurrentUser = {
  id: number;
  name: string;
  email?: string;
  roles?: string[];
};
type QuickLeadCallDisposition =
  | 'INTERESTED'
  | 'NOT_INTERESTED'
  | 'CALLBACK'
  | 'CONNECTED'
  | 'CNR'
  | 'PROPOSAL_SENT';

type QuickLeadCallModalState = {
  isOpen: boolean;
  lead: Lead | null;
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function LeadsPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
const [editingLeadName, setEditingLeadName] = useState('');
    const [pendingLeadEdits, setPendingLeadEdits] = useState<
    Record<number, { potentialPercentage: number; status: string }>
  >({});
  const [savingLeadId, setSavingLeadId] = useState<number | null>(null);
    const [selectedCalendarDate, setSelectedCalendarDate] = useState<Dayjs | null>(null);
    const [mounted, setMounted] = useState(false);
      const [isAutoCalling, setIsAutoCalling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoCallQueue, setAutoCallQueue] = useState<Lead[]>([]);
  const [autoCallIndex, setAutoCallIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [processedAutoCallIds, setProcessedAutoCallIds] = useState<number[]>([]);

  const [quickLeadCallModal, setQuickLeadCallModal] = useState<QuickLeadCallModalState>({
    isOpen: false,
    lead: null,
  });
  const [lastCalledLead, setLastCalledLead] = useState<Lead | null>(null);
  const [quickLeadCallSubmitting, setQuickLeadCallSubmitting] = useState(false);
  const [callInitiated, setCallInitiated] = useState(false);
  const [hasLeftAppForCall, setHasLeftAppForCall] = useState(false);
  const [quickLeadCallNotes, setQuickLeadCallNotes] = useState('');
  const [quickLeadCallNextFollowUpDate, setQuickLeadCallNextFollowUpDate] = useState('');
  const [quickLeadCallPotential, setQuickLeadCallPotential] = useState('');

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [potentialFilter, setPotentialFilter] = useState('');

  const currentRoles = currentUser?.roles || [];
  const canAssignLeads =
    currentRoles.includes('OWNER') ||
    currentRoles.includes('LEAD_MANAGER') ||
    currentRoles.includes('TELECALLING_MANAGER');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  useEffect(() => {
  setMounted(true);
}, []);

  useEffect(() => {
    fetchLeads();
  }, []);
  useEffect(() => {
    return () => {
      clearAutoTimers();
    };
  }, []);

  useEffect(() => {
    if (currentUser && canAssignLeads) {
      fetchUsers();
    }
  }, [currentUser]);

    const clearAutoTimers = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  };

  const stopAutoCall = () => {
    clearAutoTimers();
    setIsAutoCalling(false);
    setIsPaused(false);
    setAutoCallQueue([]);
    setAutoCallIndex(0);
    setCountdown(0);
    setProcessedAutoCallIds([]);
    setMessage('Lead auto call stopped.');
  };
  useEffect(() => {
    const openQuickCallModalAfterReturn = () => {
      if (!callInitiated || !hasLeftAppForCall || !lastCalledLead) return;

      setQuickLeadCallModal((prev) => {
        if (prev.isOpen) return prev;

        return {
          ...prev,
          isOpen: true,
          lead: prev.lead ?? lastCalledLead,
        };
      });

      setCallInitiated(false);
      setHasLeftAppForCall(false);
    };

    const cleanups: Array<() => void | Promise<void>> = [];

    if (typeof window !== 'undefined') {
      if (Capacitor.isNativePlatform()) {
        let isCancelled = false;

        const setupNativeListeners = async () => {
          try {
            const stateHandle = await CapacitorApp.addListener(
              'appStateChange',
              ({ isActive }) => {
                if (isCancelled) return;

                if (!isActive && callInitiated) {
                  setHasLeftAppForCall(true);
                }

                if (isActive) {
                  openQuickCallModalAfterReturn();
                }
              },
            );

            const resumeHandle = await CapacitorApp.addListener('resume', () => {
              if (!isCancelled) {
                openQuickCallModalAfterReturn();
              }
            });

            cleanups.push(() => stateHandle.remove());
            cleanups.push(() => resumeHandle.remove());
          } catch (error) {
            console.error('Failed to attach app listeners', error);
          }
        };

        void setupNativeListeners();

        return () => {
          isCancelled = true;
          cleanups.forEach((cleanup) => {
            void cleanup();
          });
        };
      }

      const handleBlur = () => {
        if (callInitiated) {
          setHasLeftAppForCall(true);
        }
      };

      const handleFocus = () => {
        openQuickCallModalAfterReturn();
      };

      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);

      cleanups.push(() => window.removeEventListener('blur', handleBlur));
      cleanups.push(() => window.removeEventListener('focus', handleFocus));
    }

    return () => {
      cleanups.forEach((cleanup) => {
        void cleanup();
      });
    };
  }, [lastCalledLead, callInitiated, hasLeftAppForCall]);

  useEffect(() => {
    let filtered = leads;

    if (searchName.trim()) {
      filtered = filtered.filter((lead) =>
        (lead.name || '').toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchPhone.trim()) {
      filtered = filtered.filter((lead) =>
        (lead.phone || '').includes(searchPhone)
      );
    }

    if (searchCity.trim()) {
      filtered = filtered.filter((lead) => {
        const city = (lead.city || '').toLowerCase();
        const zone = (lead.zone || '').toLowerCase();
        const query = searchCity.toLowerCase();

        return city.includes(query) || zone.includes(query);
      });
    }

    if (potentialFilter) {
      filtered = filtered.filter(
        (lead) => Number(lead.potentialPercentage || 15) === Number(potentialFilter)
      );
    }

    setFilteredLeads(filtered);
  }, [searchName, searchPhone, searchCity, potentialFilter, leads]);

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${backendUrl}/leads`, {
        headers: getAuthHeaders(),
      });

      const data = Array.isArray(res.data) ? res.data : [];
      setLeads(data);
      setFilteredLeads(data);
    } catch (err) {
      console.error(err);
      setLeads([]);
      setFilteredLeads([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/users/assignable-staff`, {
        headers: getAuthHeaders(),
      });

      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    }
  };

  const assignLead = async (leadId: number, userId: number) => {
    if (!userId) return;

    try {
      await axios.patch(
        `${backendUrl}/leads/${leadId}/assign`,
        { assignedTo: userId },
        { headers: getAuthHeaders() }
      );

      setMessage('Assigned successfully');
      fetchLeads();
    } catch (err) {
      console.error(err);
      setMessage('Assignment failed');
    }
  };

  const updateLeadName = async (leadId: number) => {
  try {
    await axios.patch(
      `${backendUrl}/leads/${leadId}`,
      { name: editingLeadName },
      { headers: getAuthHeaders() }
    );

    setMessage('Lead name updated');
    setEditingLeadId(null);
    setEditingLeadName('');
    await fetchLeads();
  } catch (err) {
    console.error(err);
    setMessage('Failed to update lead name');
  }
};

    const archiveLead = async (leadId: number) => {
    try {
      setMessage('');

      await axios.patch(
        `${backendUrl}/leads/${leadId}/archive`,
        {},
        { headers: getAuthHeaders() }
      );

      setMessage('Lead archived successfully');
      await fetchLeads();
    } catch (err: any) {
      console.error(err);
      setMessage(err?.response?.data?.message || 'Failed to archive lead');
    }
  };

  const updatePotential = async (leadId: number, potentialPercentage: number) => {
    try {
      await axios.patch(
        `${backendUrl}/leads/${leadId}`,
        { potentialPercentage },
        { headers: getAuthHeaders() }
      );

      setMessage('Lead potential updated successfully');
      fetchLeads();
    } catch (err) {
      console.error(err);
      setMessage('Potential update failed');
    }
  };

  const getAssignedName = (assignedTo?: number | null) => {
    if (!assignedTo) return 'Unassigned';
    const user = users.find((u) => u.id === assignedTo);
    return user ? user.name : `User ID: ${assignedTo}`;
  };

    const clearFilters = () => {
    setSearchName('');
    setSearchPhone('');
    setSearchCity('');
    setPotentialFilter('');
    setSelectedCalendarDate(null);
  };

    const LEAD_STAGES = [
    'NEW',
    'CONTACTED',
    'INTERESTED',
    'SITE_VISIT',
    'QUOTATION',
    'NEGOTIATION',
    'WON',
    'LOST',
  ];

  const getLeadStatusLabel = (value?: number | null) => {
    const potential = Number(value || 15);

    if (potential === 75) return 'HIGH';
    if (potential === 50) return 'MEDIUM';
    return 'LOW';
  };

  const setPendingPotential = (lead: Lead, potentialPercentage: number) => {
    setPendingLeadEdits((prev) => ({
      ...prev,
      [lead.id]: {
        potentialPercentage,
        status: prev[lead.id]?.status || lead.status || 'NEW',
      },
    }));
  };

  const setPendingStage = (lead: Lead, status: string) => {
    setPendingLeadEdits((prev) => ({
      ...prev,
      [lead.id]: {
        potentialPercentage:
          prev[lead.id]?.potentialPercentage ??
          Number(lead.potentialPercentage || 15),
        status,
      },
    }));
  };

  const saveLeadChanges = async (lead: Lead) => {
    const pending = pendingLeadEdits[lead.id];
    if (!pending) return;

    try {
      setSavingLeadId(lead.id);

      await axios.patch(
        `${backendUrl}/leads/${lead.id}`,
        {
          potentialPercentage: pending.potentialPercentage,
          status: pending.status,
        },
        { headers: getAuthHeaders() }
      );

      setMessage('Lead updated successfully');
      setPendingLeadEdits((prev) => {
        const next = { ...prev };
        delete next[lead.id];
        return next;
      });

      await fetchLeads();
    } catch (err) {
      console.error(err);
      setMessage('Lead update failed');
    } finally {
      setSavingLeadId(null);
    }
  };

  const cancelLeadChanges = (leadId: number) => {
    setPendingLeadEdits((prev) => {
      const next = { ...prev };
      delete next[leadId];
      return next;
    });
  };
  const leadReminderCountMap = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredLeads.forEach((lead) => {
      if (!lead.nextFollowUpDate) return;

      const key = dayjs(lead.nextFollowUpDate).format('YYYY-MM-DD');
      counts[key] = (counts[key] || 0) + 1;
    });

    return counts;
  }, [filteredLeads]);

  const todayLeadsCount = useMemo(() => {
    const todayKey = dayjs().format('YYYY-MM-DD');

    return filteredLeads.filter((lead) => {
      if (!lead.nextFollowUpDate) return false;
      return dayjs(lead.nextFollowUpDate).format('YYYY-MM-DD') === todayKey;
    }).length;
  }, [filteredLeads]);

  const overdueLeadsCount = useMemo(() => {
    return filteredLeads.filter((lead) => {
      if (!lead.nextFollowUpDate) return false;
      return dayjs(lead.nextFollowUpDate).isBefore(dayjs(), 'day');
    }).length;
  }, [filteredLeads]);

  const activeAutoLead =
    isAutoCalling && autoCallQueue.length > 0 ? autoCallQueue[autoCallIndex] : null;

  const selectedDateLeads = useMemo(() => {
    if (!selectedCalendarDate) return [];

    const selectedKey = selectedCalendarDate.format('YYYY-MM-DD');

    return filteredLeads.filter((lead) => {
      if (!lead.nextFollowUpDate) return false;
      return dayjs(lead.nextFollowUpDate).format('YYYY-MM-DD') === selectedKey;
    });
  }, [filteredLeads, selectedCalendarDate]);

  const quickLeadCallDateValue = quickLeadCallNextFollowUpDate
    ? dayjs(quickLeadCallNextFollowUpDate)
    : null;

  const quickLeadCallTimeValue = quickLeadCallNextFollowUpDate
    ? dayjs(quickLeadCallNextFollowUpDate)
    : null;

  const updateQuickLeadCallDatePart = (newDate: Dayjs | null) => {
    if (!newDate) {
      setQuickLeadCallNextFollowUpDate('');
      return;
    }

    const base = quickLeadCallNextFollowUpDate
      ? dayjs(quickLeadCallNextFollowUpDate)
      : dayjs();

    const merged = newDate
      .hour(base.hour())
      .minute(base.minute())
      .second(0)
      .millisecond(0);

    setQuickLeadCallNextFollowUpDate(merged.format('YYYY-MM-DDTHH:mm'));
  };

  const updateQuickLeadCallTimePart = (newTime: Dayjs | null) => {
    if (!newTime) return;

    const base = quickLeadCallNextFollowUpDate
      ? dayjs(quickLeadCallNextFollowUpDate)
      : dayjs();

    const merged = base
      .hour(newTime.hour())
      .minute(newTime.minute())
      .second(0)
      .millisecond(0);

    setQuickLeadCallNextFollowUpDate(merged.format('YYYY-MM-DDTHH:mm'));
  };

  const resetQuickLeadCallModal = () => {
    setQuickLeadCallModal({
      isOpen: false,
      lead: null,
    });
    setLastCalledLead(null);
    setQuickLeadCallNotes('');
    setQuickLeadCallNextFollowUpDate('');
    setQuickLeadCallPotential('');
    setQuickLeadCallSubmitting(false);
    setCallInitiated(false);
    setHasLeftAppForCall(false);
  };

  const handleQuickLeadCallModalClose = () => {
    if (isAutoCalling) {
      setMessage('Lead auto call paused until you resume or skip.');
      setIsPaused(true);
      clearAutoTimers();
      setCountdown(0);
    }

    resetQuickLeadCallModal();
  };

  const startLeadQuickCall = async (lead: Lead) => {
    try {
      setLastCalledLead(lead);
      setQuickLeadCallModal({
        isOpen: false,
        lead,
      });

      setCallInitiated(true);
      setHasLeftAppForCall(false);

      if (Capacitor.isNativePlatform()) {
        const plugin = (window as any).Capacitor?.Plugins?.CallControl || CallControl;
        await plugin.placeCall({ number: lead.phone });
      } else {
        window.location.href = `tel:${lead.phone}`;
      }

      setMessage(`Calling ${lead.name || lead.phone}`);
    } catch (err) {
      console.error(err);
      setMessage('Failed to start lead call');
      setCallInitiated(false);
      setHasLeftAppForCall(false);
    }
  };

  const startCountdownThenCallLead = (nextLead: Lead) => {
    clearAutoTimers();
    setCountdown(3);

    let time = 3;

    countdownIntervalRef.current = setInterval(() => {
      time -= 1;
      setCountdown(time);

      if (time <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }
    }, 1000);

    resumeTimeoutRef.current = setTimeout(async () => {
      if (isPaused) return;
      await startLeadQuickCall(nextLead);
    }, 3000);
  };

  const callNextLead = async () => {
    if (isPaused) return;

    setAutoCallIndex((prevIndex) => {
      let nextIndex = prevIndex + 1;

      while (
        nextIndex < autoCallQueue.length &&
        processedAutoCallIds.includes(autoCallQueue[nextIndex]?.id)
      ) {
        nextIndex += 1;
      }

      if (nextIndex >= autoCallQueue.length) {
        stopAutoCall();
        setMessage('Lead auto call completed.');
        return prevIndex;
      }

      const nextLead = autoCallQueue[nextIndex];

      if (nextLead) {
        startCountdownThenCallLead(nextLead);
      }

      return nextIndex;
    });
  };

  const startLeadAutoCall = async () => {
    try {
      if (isAutoCalling) {
        setMessage('Lead auto call is already running.');
        return;
      }

      const validQueue = filteredLeads.filter((lead) => !!String(lead.phone || '').trim());

      if (!validQueue.length) {
        setMessage('No filtered leads available for auto call.');
        return;
      }

      const firstLead = validQueue[0];

      setIsAutoCalling(true);
      setIsPaused(false);
      setAutoCallQueue(validQueue);
      setAutoCallIndex(0);
      setCountdown(0);
      setProcessedAutoCallIds(firstLead?.id ? [firstLead.id] : []);

      await startLeadQuickCall(firstLead);
    } catch (err) {
      console.error(err);
      setMessage('Failed to start lead auto call.');
    }
  };

  const pauseLeadAutoCall = () => {
    clearAutoTimers();
    setIsPaused(true);
    setCountdown(0);
    setMessage('Lead auto call paused.');
  };

  const resumeLeadAutoCall = async () => {
    setIsPaused(false);
    setMessage('Lead auto call resumed.');
    await callNextLead();
  };

  const skipCurrentLead = async () => {
    clearAutoTimers();
    setCountdown(0);

    const currentLead = autoCallQueue[autoCallIndex];
    if (currentLead?.id) {
      setProcessedAutoCallIds((prev) => {
        if (prev.includes(currentLead.id)) return prev;
        return [...prev, currentLead.id];
      });
    }

    await callNextLead();
  };

  const completeQuickLeadCall = async (disposition: QuickLeadCallDisposition) => {
    if (!quickLeadCallModal.lead) {
      setMessage('No lead selected for quick call');
      return;
    }

    try {
      setQuickLeadCallSubmitting(true);

      await axios.post(
        `${backendUrl}/leads/${quickLeadCallModal.lead.id}/quick-call`,
        {
          callStatus: disposition,
          callNotes: quickLeadCallNotes,
          nextFollowUpDate: quickLeadCallNextFollowUpDate
            ? new Date(quickLeadCallNextFollowUpDate).toISOString()
            : undefined,
          leadPotential: quickLeadCallPotential || undefined,
        },
        { headers: getAuthHeaders() }
      );

      if (quickLeadCallModal.lead?.id) {
        setProcessedAutoCallIds((prev) => {
          if (prev.includes(quickLeadCallModal.lead!.id)) return prev;
          return [...prev, quickLeadCallModal.lead!.id];
        });
      }

      setMessage(`Lead call saved as ${disposition.replaceAll('_', ' ')}`);
      resetQuickLeadCallModal();
      await fetchLeads();

      if (isAutoCalling && !isPaused) {
        await callNextLead();
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to save lead quick call outcome');
    } finally {
      setQuickLeadCallSubmitting(false);
    }
  };

  const getPotentialMeta = (value?: number | null) => {
    const potential = Number(value || 15);

    if (potential === 75) {
      return {
        label: 'High Potential (75%)',
        className: 'bg-green-100 text-green-700',
      };
    }

    if (potential === 50) {
      return {
        label: 'Likely (50%)',
        className: 'bg-yellow-100 text-yellow-700',
      };
    }

    return {
      label: 'Not Likely (15%)',
      className: 'bg-red-100 text-red-700',
    };
  };

  return (
    <div className="max-w-full overflow-x-hidden p-3 md:p-6">
                  <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/leads/create"
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            + Add Lead
          </Link>

          {!isAutoCalling ? (
            <button
              type="button"
              onClick={startLeadAutoCall}
              className="rounded bg-green-600 px-4 py-2 text-white"
            >
              Start AutoCall
            </button>
          ) : (
            <button
              type="button"
              onClick={stopAutoCall}
              className="rounded bg-red-600 px-4 py-2 text-white"
            >
              Stop
            </button>
          )}
        </div>
      </div>

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input
          type="text"
          placeholder="Search by name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="rounded border p-2"
        />

        <input
          type="text"
          placeholder="Search by phone"
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          className="rounded border p-2"
        />

        <input
          type="text"
          placeholder="Search by city / zone"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          className="rounded border p-2"
        />

        <select
          value={potentialFilter}
          onChange={(e) => setPotentialFilter(e.target.value)}
          className="rounded border p-2"
        >
          <option value="">Filter by potential</option>
          <option value="15">Not Likely (15%)</option>
          <option value="50">Likely (50%)</option>
          <option value="75">High Potential (75%)</option>
        </select>
      </div>

            <div className="mb-4 flex flex-col gap-3 rounded bg-gray-100 p-3 text-sm text-gray-700 md:flex-row md:items-center md:justify-between">
        <div>
          <strong>Total Leads:</strong> {leads.length} |{' '}
          <strong>Filtered:</strong> {filteredLeads.length}
        </div>

        <button
          onClick={clearFilters}
          className="rounded bg-gray-500 px-3 py-1 text-white"
        >
          Clear Filters
        </button>
      </div>

      {message && <p className="mb-4 text-blue-600">{message}</p>}

            {isAutoCalling && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Lead AutoCall Running</p>
              <p className="text-lg font-semibold text-gray-900">
                {activeAutoLead?.name || 'Unknown Lead'}
              </p>
              <p className="text-sm text-gray-600">{activeAutoLead?.phone || '-'}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={pauseLeadAutoCall}
                className="rounded bg-yellow-500 px-4 py-2 text-sm font-medium text-white"
              >
                Pause
              </button>
              <button
                type="button"
                onClick={resumeLeadAutoCall}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={skipCurrentLead}
                className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-white"
              >
                Skip
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-white px-3 py-1 text-gray-700">
              Queue: {autoCallQueue.length > 0 ? autoCallIndex + 1 : 0} / {autoCallQueue.length}
            </span>
            {countdown > 0 && (
              <span className="rounded-full bg-white px-3 py-1 text-gray-700">
                Next call in: {countdown}s
              </span>
            )}
            {isPaused && (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-700">
                Paused
              </span>
            )}
          </div>
        </div>
      )}

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-yellow-800">Today Lead Reminders</p>
          <p className="mt-1 text-2xl font-bold text-yellow-900">
            {todayLeadsCount}
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-red-800">Overdue Lead Reminders</p>
          <p className="mt-1 text-2xl font-bold text-red-900">
            {overdueLeadsCount}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-white p-4 shadow">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Lead Reminder Calendar ({dayjs().format('MMMM YYYY')})
            </h2>
            <p className="text-sm text-gray-500">
              Click a date to view leads with reminders on that day
            </p>
          </div>

          {selectedCalendarDate && (
            <button
              type="button"
              onClick={() => setSelectedCalendarDate(null)}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
            >
              Clear Selected Date
            </button>
          )}
        </div>

                {mounted && (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={selectedCalendarDate}
              onChange={(newValue) => setSelectedCalendarDate(newValue)}
            />
          </LocalizationProvider>
        )}

        <div className="mt-4 rounded-xl bg-gray-50 p-4">
          <h3 className="mb-3 font-semibold">Lead Reminder Summary</h3>

          {Object.entries(leadReminderCountMap).length === 0 ? (
            <p className="text-sm text-gray-500">No lead reminders available</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
              {Object.entries(leadReminderCountMap)
                .sort(([a], [b]) => dayjs(a).valueOf() - dayjs(b).valueOf())
                .slice(0, 8)
                .map(([date, count]) => (
                  <div
                    key={date}
                    className="flex justify-between rounded border bg-white px-3 py-2"
                  >
                    <span>{dayjs(date).format('DD MMM')}</span>
                    <span className="font-semibold text-blue-600">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
      {selectedCalendarDate && (
        <div className="mb-6 rounded-xl bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold">
            Leads on {selectedCalendarDate.format('DD MMMM YYYY')}
            {selectedDateLeads.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({selectedDateLeads.length} items)
              </span>
            )}
          </h2>

          {selectedDateLeads.length === 0 ? (
            <p className="text-sm text-gray-500">
              No lead reminders for this date
            </p>
          ) : (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {selectedDateLeads.map((lead) => (
                <div
                  key={`calendar-${lead.id}`}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <p className="font-semibold text-gray-900">{lead.name}</p>
                  <p className="text-sm text-gray-600">{lead.phone}</p>
                  <p className="text-sm text-gray-600">
                    {lead.city || '-'} {lead.zone ? `• ${lead.zone}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    Reminder:{' '}
                    {lead.nextFollowUpDate
                      ? new Date(lead.nextFollowUpDate).toLocaleString()
                      : '-'}
                  </p>
                  {lead.remarks && (
                    <p className="mt-1 text-sm text-gray-600">{lead.remarks}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {filteredLeads.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-gray-600">No leads found</p>
        </div>
      ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredLeads.map((lead) => {
            const potentialMeta = getPotentialMeta(lead.potentialPercentage);

            return (
              <div
                key={lead.id}
                className="rounded-2xl bg-white p-5 shadow transition hover:shadow-md"
              >
                                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                                        {editingLeadId === lead.id ? (
  <div className="flex gap-2">
    <input
      value={editingLeadName}
      onChange={(e) => setEditingLeadName(e.target.value)}
      className="rounded border px-2 py-1 text-sm"
    />
    <button
      onClick={() => updateLeadName(lead.id)}
      className="rounded bg-green-600 px-2 text-white text-sm"
    >
      Save
    </button>
    <button
      onClick={() => setEditingLeadId(null)}
      className="rounded bg-gray-400 px-2 text-white text-sm"
    >
      Cancel
    </button>
  </div>
) : (
  <div className="flex items-center gap-2">
    <h2 className="break-words text-lg font-semibold text-gray-800">
      {lead.name}
    </h2>
    <button
      onClick={() => {
        setEditingLeadId(lead.id);
        setEditingLeadName(lead.name);
      }}
      className="text-blue-600 text-sm"
    >
      ✏️
    </button>
  </div>
)}
                    <p className="text-sm text-gray-500">Lead ID: {lead.id}</p>
                  </div>

                                                      <button
                    type="button"
                    onClick={() => startLeadQuickCall(lead)}
                    className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white sm:w-auto"
                  >
                    📞 Call
                  </button>
                </div>

                <div className="mb-3">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${potentialMeta.className}`}
                  >
                    {potentialMeta.label}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Phone:</span> {lead.phone}
                  </p>
                  <p>
                    <span className="font-medium">City:</span> {lead.city || '-'}
                  </p>
                  <p>
                    <span className="font-medium">Zone:</span> {lead.zone || '-'}
                  </p>
                                    <p className="break-words">
                    <span className="font-medium">Lead Owner:</span>{' '}
                    {lead.createdByName || '-'}
                  </p>
                                    <p className="break-words">
  <span className="font-medium">Assigned:</span>{' '}
  {getAssignedName(lead.assignedTo)}
</p>
<p>
  <span className="font-medium">Current Stage:</span>{' '}
  {(pendingLeadEdits[lead.id]?.status || lead.status || 'NEW').replace('_', ' ')}
</p>
<p>
  <span className="font-medium">Next Reminder:</span>{' '}
  {lead.nextFollowUpDate
    ? new Date(lead.nextFollowUpDate).toLocaleString()
    : '-'}
</p>
                </div>

                                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Link
                    href={`/meeting/create?leadId=${lead.id}&name=${lead.name}&phone=${lead.phone}&city=${lead.city || ''}`}
                    className="w-full rounded bg-purple-600 px-3 py-2 text-sm text-white sm:w-auto"
                  >
                    Schedule Meeting
                  </Link>

                  <Link
                    href={`/leads/${lead.id}`}
                    className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white sm:w-auto"
                  >
                    View History
                  </Link>

                  {(lead.status === 'LOST') && (
  <button
    type="button"
    onClick={() => {
      if (confirm('Archive this lead?')) {
        archiveLead(lead.id);
      }
    }}
    className="w-full rounded bg-red-600 px-3 py-2 text-sm text-white sm:w-auto"
  >
    Archive
  </button>
)}
                </div>

                                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Lead Status
                    </label>

                                        <div className="grid grid-cols-3 gap-2">
                      {[15, 50, 75].map((value) => {
                        const pending = pendingLeadEdits[lead.id];
                        const currentValue =
                          pending?.potentialPercentage ??
                          Number(lead.potentialPercentage || 15);

                        const isActive = currentValue === value;

                        const label =
                          value === 75
                            ? 'HIGH'
                            : value === 50
                            ? 'MEDIUM'
                            : 'LOW';

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setPendingPotential(lead, value)}
                            className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
                              isActive
                                ? value === 75
                                  ? 'bg-green-600 text-white'
                                  : value === 50
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Lead Stage
                    </label>

                                        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {LEAD_STAGES.map((stage) => {
                        const pending = pendingLeadEdits[lead.id];
                        const currentStage = pending?.status || lead.status || 'NEW';
                        const isActive = currentStage === stage;

                        return (
                          <button
                            key={stage}
                            type="button"
                            onClick={() => setPendingStage(lead, stage)}
                            className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition ${
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {stage.replace('_', ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {pendingLeadEdits[lead.id] && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                      <p className="mb-2 text-sm font-medium text-blue-800">
                        Pending changes ready to save
                      </p>

                                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <button
                          type="button"
                          onClick={() => saveLeadChanges(lead)}
                          disabled={savingLeadId === lead.id}
                          className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white sm:w-auto"
                        >
                          {savingLeadId === lead.id ? 'Saving...' : 'Save Changes'}
                        </button>

                        <button
                          type="button"
                          onClick={() => cancelLeadChanges(lead.id)}
                          disabled={savingLeadId === lead.id}
                          className="w-full rounded-xl bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 sm:w-auto"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {canAssignLeads && (
                  <div className="mt-4">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Assign Lead
                    </label>
                    <select
                      onChange={(e) => assignLead(lead.id, Number(e.target.value))}
                      className="w-full rounded border p-2 text-sm"
                      defaultValue=""
                    >
                      <option value="">Select user</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {quickLeadCallModal.isOpen && quickLeadCallModal.lead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl md:p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Lead Call Outcome</h2>
                <p className="text-sm text-gray-600">
                  {quickLeadCallModal.lead.name} ({quickLeadCallModal.lead.phone})
                </p>
              </div>

              <button
                type="button"
                onClick={handleQuickLeadCallModalClose}
                className="rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <textarea
                value={quickLeadCallNotes}
                onChange={(e) => setQuickLeadCallNotes(e.target.value)}
                rows={4}
                placeholder="Lead call notes"
                className="rounded-2xl border border-gray-200 p-3 md:col-span-2"
              />

              <select
                value={quickLeadCallPotential}
                onChange={(e) => setQuickLeadCallPotential(e.target.value)}
                className="rounded-2xl border border-gray-200 p-3 md:col-span-2"
              >
                <option value="">Lead Potential (optional)</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
                  <DatePicker
                    label="Follow-up Date"
                    value={quickLeadCallDateValue}
                    onChange={updateQuickLeadCallDatePart}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />

                  <MobileTimePicker
                    label="Follow-up Time"
                    value={quickLeadCallTimeValue}
                    onChange={updateQuickLeadCallTimePart}
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
            </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => completeQuickLeadCall('INTERESTED')}
                disabled={quickLeadCallSubmitting}
                className="w-full rounded-2xl bg-green-600 px-4 py-3 font-medium text-white disabled:opacity-50"
              >
                Interested
              </button>

              <button
                type="button"
                onClick={() => completeQuickLeadCall('NOT_INTERESTED')}
                disabled={quickLeadCallSubmitting}
                className="rounded-2xl bg-red-600 px-4 py-3 font-medium text-white disabled:opacity-50"
              >
                Not Interested
              </button>

              <button
                type="button"
                onClick={() => completeQuickLeadCall('CALLBACK')}
                disabled={quickLeadCallSubmitting}
                className="rounded-2xl bg-yellow-500 px-4 py-3 font-medium text-white disabled:opacity-50"
              >
                Callback
              </button>

              <button
                type="button"
                onClick={() => completeQuickLeadCall('CONNECTED')}
                disabled={quickLeadCallSubmitting}
                className="rounded-2xl bg-blue-600 px-4 py-3 font-medium text-white disabled:opacity-50"
              >
                Connected
              </button>

              <button
                type="button"
                onClick={() => completeQuickLeadCall('CNR')}
                disabled={quickLeadCallSubmitting}
                className="rounded-2xl bg-gray-700 px-4 py-3 font-medium text-white disabled:opacity-50"
              >
                CNR
              </button>

              <button
                type="button"
                onClick={() => completeQuickLeadCall('PROPOSAL_SENT')}
                disabled={quickLeadCallSubmitting}
                className="rounded-2xl bg-purple-600 px-4 py-3 font-medium text-white disabled:opacity-50"
              >
                Proposal Sent
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
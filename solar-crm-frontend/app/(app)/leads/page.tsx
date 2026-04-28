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
  const [leadPage, setLeadPage] = useState(1);
const [leadLimit] = useState(50);
const [leadTotal, setLeadTotal] = useState(0);
const [leadTotalPages, setLeadTotalPages] = useState(1);
const [loadingLeads, setLoadingLeads] = useState(false);
  const [message, setMessage] = useState('');
    const [bulkAssignedTo, setBulkAssignedTo] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [assignCount, setAssignCount] = useState('');
const [selectedManagerId, setSelectedManagerId] = useState('');
const [assigningByCount, setAssigningByCount] = useState(false);
  const [importingLeads, setImportingLeads] = useState(false);
  const leadImportInputRef = useRef<HTMLInputElement | null>(null);
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

  const [showStorage, setShowStorage] = useState(false);
const [storageLeads, setStorageLeads] = useState<any[]>([]);
const [storageTotal, setStorageTotal] = useState(0);
const [storagePage, setStoragePage] = useState(1);
const [storageTotalPages, setStorageTotalPages] = useState(1);
const [loadingStorage, setLoadingStorage] = useState(false);
const [selectedStorageIds, setSelectedStorageIds] = useState<number[]>([]);
const [storageAssignedTo, setStorageAssignedTo] = useState('');
const [convertingStorage, setConvertingStorage] = useState(false);
const [selectingFilteredStorage, setSelectingFilteredStorage] = useState(false);

const [storageSearchName, setStorageSearchName] = useState('');
const [storageSearchPhone, setStorageSearchPhone] = useState('');
const [storageSearchCity, setStorageSearchCity] = useState('');
const [storagePotentialFilter, setStoragePotentialFilter] = useState('');

  const currentRoles = currentUser?.roles || [];
const isOwner = currentRoles.includes('OWNER');

const canAssignLeads = isOwner;

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
  fetchLeads(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchLeads = async (pageNumber = 1) => {
    if (loadingLeads) return;
  try {
    setLoadingLeads(true);

    const res = await axios.get(`${backendUrl}/leads`, {
      headers: getAuthHeaders(),
      params: {
        page: pageNumber,
        limit: leadLimit,
        search: searchName || undefined,
        phone: searchPhone || undefined,
        city: searchCity || undefined,
        potentialPercentage: potentialFilter || undefined,
      },
    });

    const responseData = res.data || {};
    const data = Array.isArray(responseData.data)
      ? responseData.data
      : Array.isArray(responseData)
      ? responseData
      : [];

    setLeads(data);
    setFilteredLeads(data);
    setLeadTotal(Number(responseData.total || data.length));
    setLeadPage(Number(responseData.page || pageNumber));
    setLeadTotalPages(Number(responseData.totalPages || 1));
  } catch (err) {
    console.error(err);
    setLeads([]);
    setFilteredLeads([]);
    setLeadTotal(0);
    setLeadTotalPages(1);
  } finally {
    setLoadingLeads(false);
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

  const fetchStorageLeads = async (page = 1) => {
  try {
    setLoadingStorage(true);

    const res = await axios.get(`${backendUrl}/leads/storage-list`, {
      headers: getAuthHeaders(),
      params: {
  page,
  limit: 50,
  name: storageSearchName || undefined,
  phone: storageSearchPhone || undefined,
  city: storageSearchCity || undefined,
  leadPotential: storagePotentialFilter || undefined,
},
    });

    setStorageLeads(Array.isArray(res.data?.data) ? res.data.data : []);
    setStorageTotal(Number(res.data?.total || 0));
    setStoragePage(Number(res.data?.page || page));
    setStorageTotalPages(Number(res.data?.totalPages || 1));
  } catch (err: any) {
    console.error(err);
    setMessage(err?.response?.data?.message || 'Failed to fetch storage leads');
    setStorageLeads([]);
  } finally {
    setLoadingStorage(false);
  }
};

    const handleImportLeads = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportingLeads(true);
      setMessage('');

      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post(`${backendUrl}/leads/import`, formData, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      setMessage(
  `${res?.data?.message || 'Lead import completed'} Imported: ${
    res?.data?.importedCount || 0
  }, Skipped: ${res?.data?.skippedCount || 0}, Duplicates: ${
    res?.data?.duplicateCount || 0
  }`
);
      if (leadImportInputRef.current) {
        leadImportInputRef.current.value = '';
      }

      await fetchLeads();
    } catch (err: any) {
      console.error(err);
      setMessage(err?.response?.data?.message || 'Lead import failed');
    } finally {
      setImportingLeads(false);
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

    const handleAssignFilteredLeads = async () => {
    if (!bulkAssignedTo) {
      setMessage('Please select a lead manager first');
      return;
    }

    if (!filteredLeads.length) {
      setMessage('No filtered leads available');
      return;
    }

    try {
      setBulkAssigning(true);
      setMessage('');

      const leadIds = filteredLeads
        .map((lead) => Number(lead.id))
        .filter(Boolean);

      const res = await axios.patch(
        `${backendUrl}/leads/assign-bulk`,
        {
          leadIds,
          assignedTo: Number(bulkAssignedTo),
        },
        { headers: getAuthHeaders() }
      );

      setMessage(
        res?.data?.message || 'Filtered leads assigned successfully'
      );

      await fetchLeads();
    } catch (err: any) {
      console.error(err);
      setMessage(err?.response?.data?.message || 'Bulk assignment failed');
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleStorageAssign = async () => {
  if (!assignCount || Number(assignCount) <= 0) {
    setMessage('Enter valid count');
    return;
  }

  if (!selectedManagerId) {
    setMessage('Select lead manager');
    return;
  }

  try {
    setAssigningByCount(true);
    setMessage('');

    const res = await axios.patch(
      `${backendUrl}/leads/storage/assign-latest`,
      {
        assignCount: Number(assignCount),
        assignedTo: Number(selectedManagerId),
        filters: {
  city: searchCity || undefined,
  zone: undefined,
  potential: potentialFilter || undefined,
},
      },
      { headers: getAuthHeaders() }
    );

    setMessage(res.data?.message || 'Assigned successfully');

    setAssignCount('');
    setSelectedManagerId('');

    fetchLeads(1);
  } catch (err: any) {
    console.error(err);
    setMessage(err?.response?.data?.message || 'Assignment failed');
  } finally {
    setAssigningByCount(false);
  }
};

  const handleConvertStorageToLeads = async () => {
  if (!selectedStorageIds.length) {
    setMessage('Please select storage leads first');
    return;
  }

  if (!storageAssignedTo) {
    setMessage('Please select a lead manager first');
    return;
  }

  try {
    setConvertingStorage(true);
    setMessage('');

    const res = await axios.post(
      `${backendUrl}/leads/storage-convert`,
      {
        contactIds: selectedStorageIds,
        assignedTo: Number(storageAssignedTo),
      },
      { headers: getAuthHeaders() }
    );

    setMessage(res?.data?.message || 'Storage leads converted successfully');
    setSelectedStorageIds([]);
    await fetchStorageLeads(storagePage);
    await fetchLeads();
  } catch (err: any) {
    console.error(err);
    setMessage(err?.response?.data?.message || 'Failed to convert storage leads');
  } finally {
    setConvertingStorage(false);
  }
};

const handleAssignStorageLeads = async () => {
  try {
    if (!selectedStorageIds.length) {
      setMessage('Select storage leads first');
      return;
    }

    if (!storageAssignedTo) {
      setMessage('Select lead manager');
      return;
    }

    setMessage('Assigning storage leads...');

    await axios.patch(
      `${backendUrl}/leads/storage-assign`,
      {
        contactIds: selectedStorageIds,
        assignedTo: storageAssignedTo,
      },
      { headers: getAuthHeaders() }
    );

    setMessage(
      `${selectedStorageIds.length} storage leads assigned successfully`
    );

    fetchStorageLeads(storagePage);
  } catch (err: any) {
    console.error(err);
    setMessage(
      err?.response?.data?.message || 'Failed to assign storage leads'
    );
  }
};

const handleSelectAllFilteredStorage = async () => {
  try {
    setSelectingFilteredStorage(true);
    setMessage('');

    const res = await axios.get(`${backendUrl}/leads/storage-filtered-ids`, {
      headers: getAuthHeaders(),
      params: {
        name: storageSearchName || undefined,
        phone: storageSearchPhone || undefined,
        city: storageSearchCity || undefined,
        leadPotential: storagePotentialFilter || undefined,
      },
    });

    const ids = Array.isArray(res.data?.ids)
      ? res.data.ids.map(Number).filter(Boolean)
      : [];

    setSelectedStorageIds(ids);
    setMessage(`Selected ${ids.length} filtered storage leads`);
  } catch (err: any) {
    console.error(err);
    setMessage(
      err?.response?.data?.message || 'Failed to select filtered storage leads'
    );
  } finally {
    setSelectingFilteredStorage(false);
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
  setLeadPage(1);
  setTimeout(() => fetchLeads(1), 0);
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

    // ✅ Fallback: if app/browser does not trigger focus/resume,
    // still show outcome popup after a few seconds.
    window.setTimeout(() => {
      setQuickLeadCallModal((prev) => {
        if (prev.isOpen) return prev;

        return {
          isOpen: true,
          lead,
        };
      });

      setCallInitiated(false);
      setHasLeftAppForCall(false);
    }, 5000);
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
  if (isAutoCalling) {
    setMessage('Lead auto call already running');
    return;
  }

    const res = await axios.get(`${backendUrl}/leads/autocall`, {
      headers: getAuthHeaders(),
    });

    const backendQueue = Array.isArray(res.data) ? res.data : [];

    const validQueue = backendQueue.filter((lead: Lead) =>
      !!String(lead.phone || '').trim()
    );

    if (!validQueue.length) {
      setMessage('No pending leads available for auto call.');
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
  } catch (err: any) {
    console.error(err);
    setMessage(err?.response?.data?.message || 'Failed to start lead auto call.');
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

          {canAssignLeads && (
            <>
              <input
                ref={leadImportInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleImportLeads}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => leadImportInputRef.current?.click()}
                disabled={importingLeads}
                className="rounded bg-purple-600 px-4 py-2 text-white"
              >
                {importingLeads ? 'Importing...' : 'Import Leads'}
              </button>
            </>
          )}

          {isOwner && (
  <button
    type="button"
    onClick={() => {
      const nextValue = !showStorage;
      setShowStorage(nextValue);

      if (nextValue) {
        fetchStorageLeads(1);
      }
    }}
    className="rounded bg-gray-700 px-4 py-2 text-white"
  >
    {showStorage ? 'Hide Storage' : 'Show Storage'}
  </button>
)}

          {!isAutoCalling ? (
            <button
              type="button"
              onClick={startLeadAutoCall}
disabled={isAutoCalling}
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

                  <div className="mb-4 flex flex-col gap-3 rounded bg-gray-100 p-3 text-sm text-gray-700">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <strong>Total Leads:</strong> {leadTotal} |{' '}
<strong>Current Page:</strong> {filteredLeads.length}
          </div>

          <div className="flex flex-wrap gap-2">
  <button
    type="button"
    onClick={() => fetchLeads(1)}
    className="rounded bg-indigo-600 px-3 py-1 text-white"
  >
    Apply Lead Filters
  </button>

  <button
    onClick={clearFilters}
    className="rounded bg-gray-500 px-3 py-1 text-white"
  >
    Clear Filters
  </button>
</div>
        </div>

        {canAssignLeads && (
  <div className="rounded border bg-white p-3">
    <h3 className="mb-2 font-semibold text-gray-800">
      Assign Leads by Count
    </h3>

    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <input
        type="number"
        min="1"
        placeholder="Number of leads"
        value={assignCount}
        onChange={(e) => setAssignCount(e.target.value)}
        className="rounded border p-2 text-sm md:w-48"
      />

      <select
        value={selectedManagerId}
        onChange={(e) => setSelectedManagerId(e.target.value)}
        className="rounded border p-2 text-sm md:min-w-[220px]"
      >
        <option value="">Select lead manager</option>
        {users
          .filter((u) => (u.roles || []).includes('LEAD_MANAGER'))
          .map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
      </select>

      <button
        type="button"
        onClick={handleStorageAssign}
        disabled={assigningByCount}
        className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {assigningByCount ? 'Assigning...' : 'Assign Leads'}
      </button>
    </div>

    <p className="mt-2 text-xs text-gray-500">
      This assigns oldest unassigned leads first. Already assigned leads are not changed.
    </p>
  </div>
)}

        {canAssignLeads && (
  <div className="bg-white p-4 rounded shadow mb-4">
    <h2 className="text-lg font-semibold mb-2">
      Bulk Assign from Storage
    </h2>

    <div className="flex flex-col gap-2 md:flex-row md:items-center">

      <input
        type="number"
        placeholder="Number of leads"
        value={assignCount}
        onChange={(e) => setAssignCount(e.target.value)}
        className="border p-2 rounded"
      />

      <select
        value={selectedManagerId}
        onChange={(e) => setSelectedManagerId(e.target.value)}
        className="border p-2 rounded"
      >
        <option value="">Select Lead Manager</option>
        {users
          .filter((u) => (u.roles || []).includes('LEAD_MANAGER'))
          .map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
      </select>

      <button
        onClick={handleStorageAssign}
        disabled={assigningByCount}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        {assigningByCount ? 'Assigning...' : 'Assign Leads'}
      </button>

    </div>

    <p className="text-xs text-gray-500 mt-2">
      Assigns only unassigned (storage) leads based on current filters.
    </p>
  </div>
)}
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

      {showStorage && isOwner && (
  <div className="mb-6 rounded-2xl bg-white p-4 shadow">
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-xl font-semibold">Lead Storage</h2>
        <p className="text-sm text-gray-600">
          Imported data is stored here before assigning and converting to active leads.
        </p>
      </div>

      <button
        type="button"
        onClick={() => fetchStorageLeads(1)}
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        Refresh Storage
      </button>
    </div>

    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
      <input
        type="text"
        placeholder="Search storage by name"
        value={storageSearchName}
        onChange={(e) => setStorageSearchName(e.target.value)}
        className="rounded border p-2"
      />

      <input
        type="text"
        placeholder="Search storage by phone"
        value={storageSearchPhone}
        onChange={(e) => setStorageSearchPhone(e.target.value)}
        className="rounded border p-2"
      />

      <input
        type="text"
        placeholder="Search storage by city / zone / location"
        value={storageSearchCity}
        onChange={(e) => setStorageSearchCity(e.target.value)}
        className="rounded border p-2"
      />
      <select
  value={storagePotentialFilter}
  onChange={(e) => setStoragePotentialFilter(e.target.value)}
  className="rounded border p-2"
>
  <option value="">Lead Potential</option>
  <option value="LOW">Low</option>
  <option value="MEDIUM">Medium</option>
  <option value="HIGH">High</option>
</select>
    </div>

    <div className="mb-4 flex flex-col gap-3 rounded bg-gray-100 p-3 text-sm md:flex-row md:items-center md:justify-between">
      <div>
        <strong>Storage Total:</strong> {storageTotal} |{' '}
        <strong>Selected:</strong> {selectedStorageIds.length}
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <button
          type="button"
          onClick={() => {
            setStorageSearchName('');
setStorageSearchPhone('');
setStorageSearchCity('');
setStoragePotentialFilter('');
setSelectedStorageIds([]);
fetchStorageLeads(1);
          }}
          className="rounded bg-gray-500 px-3 py-2 text-white"
        >
          Clear Storage Filters
        </button>

        <button
          type="button"
          onClick={() => fetchStorageLeads(1)}
          className="rounded bg-indigo-600 px-3 py-2 text-white"
        >
          Apply Storage Filters
        </button>
      </div>
    </div>

    <div className="mb-4 flex flex-col gap-3 rounded border bg-blue-50 p-3 md:flex-row md:items-center">
      <select
        value={storageAssignedTo}
        onChange={(e) => setStorageAssignedTo(e.target.value)}
        className="rounded border p-2 text-sm md:min-w-[220px]"
      >
        <option value="">Select lead manager</option>
        {users
          .filter((u) => (u.roles || []).includes('LEAD_MANAGER'))
          .map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
      </select>
<button
  type="button"
  onClick={handleAssignStorageLeads}
  disabled={!selectedStorageIds.length || !storageAssignedTo}
  className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
>
  Assign Selected ({selectedStorageIds.length})
</button>
      <button
        type="button"
        onClick={handleConvertStorageToLeads}
        disabled={convertingStorage || selectedStorageIds.length === 0}
        className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {convertingStorage
          ? 'Converting...'
          : `Convert Selected (${selectedStorageIds.length})`}
      </button>

      <button
        type="button"
        onClick={() => {
          const currentPageIds = storageLeads.map((item) => Number(item.id));

          const allSelected = currentPageIds.every((id) =>
            selectedStorageIds.includes(id)
          );

          if (allSelected) {
            setSelectedStorageIds((prev) =>
              prev.filter((id) => !currentPageIds.includes(id))
            );
          } else {
            setSelectedStorageIds((prev) => {
              const next = new Set(prev);
              currentPageIds.forEach((id) => next.add(id));
              return Array.from(next);
            });
          }
        }}
        className="rounded bg-orange-600 px-4 py-2 text-white"
      >
        Select / Unselect Current Page
      </button>

      <button
  type="button"
  onClick={handleSelectAllFilteredStorage}
  disabled={selectingFilteredStorage || storageTotal === 0}
  className="rounded bg-purple-600 px-4 py-2 text-white disabled:opacity-50"
>
  {selectingFilteredStorage
    ? 'Selecting...'
    : `Select All Filtered (${storageTotal})`}
</button>

<button
  type="button"
  onClick={() => setSelectedStorageIds([])}
  disabled={selectedStorageIds.length === 0}
  className="rounded bg-red-500 px-4 py-2 text-white disabled:opacity-50"
>
  Clear Selection
</button>
    </div>

    {loadingStorage ? (
      <div className="rounded-xl bg-gray-50 p-6 text-center">
        Loading storage leads...
      </div>
    ) : storageLeads.length === 0 ? (
      <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-600">
        No storage leads found
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {storageLeads.map((item) => {
          const isSelected = selectedStorageIds.includes(item.id);

          return (
            <div
              key={item.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {item.name || 'No Name'}
                  </h3>
                  <p className="text-sm text-gray-500">Storage ID: {item.id}</p>
                </div>

                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    setSelectedStorageIds((prev) =>
                      prev.includes(item.id)
                        ? prev.filter((id) => id !== item.id)
                        : [...prev, item.id]
                    );
                  }}
                  className="h-5 w-5"
                />
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-medium">Phone:</span>{' '}
                  {item.phone || '-'}
                </p>

                <p>
                  <span className="font-medium">City:</span>{' '}
                  {item.city || '-'}
                </p>

                <p>
                  <span className="font-medium">Zone:</span>{' '}
                  {item.zone || '-'}
                </p>

                <p>
  <span className="font-medium">Lead Potential:</span>{' '}
  {item.leadPotential || 'LOW'}
</p>

                <p className="break-words">
                  <span className="font-medium">Address:</span>{' '}
                  {item.address || item.location || '-'}
                </p>

                <p>
                  <span className="font-medium">Imported By:</span>{' '}
                  {item.importedByName || item.importedBy || '-'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    )}

    <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <button
        type="button"
        onClick={() => fetchStorageLeads(Math.max(storagePage - 1, 1))}
        disabled={storagePage <= 1 || loadingStorage}
        className="rounded bg-gray-200 px-4 py-2 text-gray-700 disabled:opacity-50"
      >
        Previous
      </button>

      <div className="text-center text-sm text-gray-600">
        Page {storagePage} of {storageTotalPages}
      </div>

      <button
        type="button"
        onClick={() =>
          fetchStorageLeads(Math.min(storagePage + 1, storageTotalPages))
        }
        disabled={storagePage >= storageTotalPages || loadingStorage}
        className="rounded bg-gray-200 px-4 py-2 text-gray-700 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
)}

      {loadingLeads ? (
  <div className="rounded-xl bg-white p-6 shadow">
    <p className="text-gray-600">Loading leads...</p>
  </div>
) : filteredLeads.length === 0 ? (
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
                      {users
  .filter((u) => (u.roles || []).includes('LEAD_MANAGER'))
  .map((u) => (
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
{!loadingLeads && leadTotalPages > 1 && (
  <div className="mt-6 flex flex-col gap-2 rounded-xl bg-white p-4 shadow md:flex-row md:items-center md:justify-between">
    <button
      type="button"
      onClick={() => fetchLeads(Math.max(leadPage - 1, 1))}
      disabled={leadPage <= 1}
      className="rounded bg-gray-200 px-4 py-2 text-gray-700 disabled:opacity-50"
    >
      Previous
    </button>

    <div className="text-center text-sm text-gray-600">
      Page {leadPage} of {leadTotalPages} | Total {leadTotal}
    </div>

    <button
      type="button"
      onClick={() => fetchLeads(Math.min(leadPage + 1, leadTotalPages))}
      disabled={leadPage >= leadTotalPages}
      className="rounded bg-gray-200 px-4 py-2 text-gray-700 disabled:opacity-50"
    >
      Next
    </button>
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
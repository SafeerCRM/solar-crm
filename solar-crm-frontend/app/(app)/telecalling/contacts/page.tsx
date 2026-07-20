'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { getAuthHeaders } from '@/lib/authHeaders';
import { CallControl } from '@/lib/callControl';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

type Contact = {
  id: number;
  name: string;
  phone: string;
  city?: string;
  zone?: string;
  address?: string;
  location?: string;
  kNo?: string;
  assignedTo?: number;
  assignedToName?: string;
  importedByName?: string;
  convertedToLead?: boolean;
  isInStorage?: boolean;
  remarks?: string;
  reviewAssignedTo?: number;
  reviewAssignedToName?: string;
  sourceModule?: string;
sourceReferralId?: number;
referralCustomerCode?: string;
referralReferrerName?: string;
referralReferrerPhone?: string;
referralRemarks?: string;
};

type User = {
  id: number;
  name: string;
  email?: string;
  roles?: string[];
  role?: string;
};

type ContactsResponse =
  | Contact[]
  | {
      data?: Contact[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    };

type ViewMode = 'active' | 'storage';

type QuickCallDisposition =
  | 'INTERESTED'
  | 'NOT_INTERESTED'
  | 'CALLBACK'
  | 'CONNECTED'
  | 'CNR'
  | 'PROPOSAL_SENT';

type QuickCallModalState = {
  isOpen: boolean;
  contact: Contact | null;
  callLogId?: number;
};

type HistoryContact = Contact & {
  status?: string;
  stage?: string;
  hasCalled?: boolean;
  createdAt?: string;
  updatedAt?: string;

  latestActivityAt?: string | null;
  latestCallStatus?: string;
  latestCallNotes?: string;
  latestCalledBy?: number | null;
  latestCalledByName?: string;
};

type ContactHistoryResponse = {
  data?: HistoryContact[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;

  filters?: {
    fromDate?: string;
    toDate?: string;
    maximumDays?: number;
    selectedTelecallerId?: number | null;
  };
};

type HistoryDays = 30 | 60 | 90 | 120 | 150 | 180;

const getUserRoles = (user: User | null): string[] => {
  if (!user) return [];
  if (Array.isArray(user.roles)) return user.roles;
  if (user.role) return [user.role];
  return [];
};

export default function TelecallingContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [importing, setImporting] = useState(false);
  const [assigningBulk, setAssigningBulk] = useState(false);
  const [assigningLatest, setAssigningLatest] = useState(false);

  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [bulkAssignedTo, setBulkAssignedTo] = useState<string>('');
  const [assignLatestCount, setAssignLatestCount] = useState('');
  // 🔥 TRANSFER STATES
  const [transferFromUser, setTransferFromUser] = useState('');
  const [transferToUser, setTransferToUser] = useState('');
  const [fromUserCount, setFromUserCount] = useState<number | null>(null);
  const [toUserCount, setToUserCount] = useState<number | null>(null);
  const [transferCount, setTransferCount] = useState('');
  const [transferring, setTransferring] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);

  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [showCnrRecall, setShowCnrRecall] = useState(false);

  const [isAutoCalling, setIsAutoCalling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoCallQueue, setAutoCallQueue] = useState<Contact[]>([]);
  const [autoCallIndex, setAutoCallIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [processedAutoCallIds, setProcessedAutoCallIds] = useState<number[]>([]);

  const [quickCallModal, setQuickCallModal] = useState<QuickCallModalState>({
    isOpen: false,
    contact: null,
  });
  const [lastCalledContact, setLastCalledContact] = useState<Contact | null>(null);
  const [quickCallSubmitting, setQuickCallSubmitting] = useState(false);
  const [callInitiated, setCallInitiated] = useState(false);
  const [hasLeftAppForCall, setHasLeftAppForCall] = useState(false);
  const [quickCallNotes, setQuickCallNotes] = useState('');
  const [quickCallNextFollowUpDate, setQuickCallNextFollowUpDate] = useState('');
  const [quickCallRecordingUrl, setQuickCallRecordingUrl] = useState('');
  const [quickCallRecordingFile, setQuickCallRecordingFile] = useState<File | null>(null);
const [uploadingQuickCallRecording, setUploadingQuickCallRecording] = useState(false);
const [myContactCount, setMyContactCount] = useState<number | null>(null);
const [loadingMyCount, setLoadingMyCount] = useState(false);
// CONTACT HISTORY WORKSPACE
const [showContactHistory, setShowContactHistory] = useState(false);
type HistoryWorkspaceTab = 'history' | 'reassignment';

const [historyWorkspaceTab, setHistoryWorkspaceTab] =
  useState<HistoryWorkspaceTab>('history');
const [historyLoading, setHistoryLoading] = useState(false);
const [historyMessage, setHistoryMessage] = useState('');

const [historyContacts, setHistoryContacts] = useState<HistoryContact[]>([]);
const [historyTotal, setHistoryTotal] = useState(0);
const [historyPage, setHistoryPage] = useState(1);
const [historyTotalPages, setHistoryTotalPages] = useState(1);
const [historyLimit] = useState(50);

const [historyDays, setHistoryDays] = useState<HistoryDays>(30);
const [historyTelecallerId, setHistoryTelecallerId] = useState('');

const [historyName, setHistoryName] = useState('');
const [historyPhone, setHistoryPhone] = useState('');
const [historyCity, setHistoryCity] = useState('');
const [historyZone, setHistoryZone] = useState('');

const [historyContactStatus, setHistoryContactStatus] = useState('');
const [historyCallStatus, setHistoryCallStatus] = useState('');
const [historyStage, setHistoryStage] = useState('');
const [historySourceModule, setHistorySourceModule] = useState('');

const [historyHasCalled, setHistoryHasCalled] = useState('');
const [historyConverted, setHistoryConverted] = useState('');
const [historyStorageState, setHistoryStorageState] = useState('');

// REASSIGNMENT WORKSPACE
const [fromTelecallerId, setFromTelecallerId] = useState('');
const [toTelecallerId, setToTelecallerId] = useState('');

const [selectedHistoryContactIds, setSelectedHistoryContactIds] =
  useState<number[]>([]);

const [transferMode, setTransferMode] = useState<
  'SELECTED' | 'FILTERED'
>('SELECTED');

const [transferLoading, setTransferLoading] = useState(false);

const [reassignmentContacts, setReassignmentContacts] =
  useState<HistoryContact[]>([]);

const [reassignmentTotal, setReassignmentTotal] =
  useState(0);

const [reassignmentPage, setReassignmentPage] =
  useState(1);

const [reassignmentTotalPages, setReassignmentTotalPages] =
  useState(1);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const callInitiatedRef = useRef(false);
const quickCallModalOpenRef = useRef(false);
const quickCallSubmittingRef = useRef(false);
const isPausedRef = useRef(false);

  const roles = getUserRoles(currentUser);
  const isOwnerOrTelecallingManager =
    roles.includes('OWNER') || roles.includes('TELECALLING_MANAGER');
    const canViewAllContactHistory =
  roles.includes('OWNER') ||
  roles.includes('TELECALLING_MANAGER') ||
  roles.includes('TELECALLING_ASSISTANT');

const canViewContactHistory =
  canViewAllContactHistory ||
  roles.includes('TELECALLER');

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
    setMessage('Auto call stopped.');
  };

  const fetchUsers = async () => {
    try {
      if (!canViewAllContactHistory) {
  setUsers([]);
  return;
}

      const res = await axios.get(`${backendUrl}/users/telecallers`, {
        headers: getAuthHeaders(),
      });

      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    }
  };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await axios.get<ContactsResponse>(
        showCnrRecall
  ? `${backendUrl}/telecalling/contacts/cnr-recall`
  : `${backendUrl}/telecalling/contacts`,
        {
          params: {
            page,
            limit,
            view: viewMode,
            locationFilter: cityFilter || undefined,
          },
          headers: getAuthHeaders(),
        },
      );

      const responseData = res.data;

      if (Array.isArray(responseData)) {
  setContacts(responseData);
  setTotalPages(1);
  setTotalContacts(responseData.length);
} else {
  setContacts(Array.isArray(responseData?.data) ? responseData.data : []);
  setTotalPages(responseData?.totalPages || 1);
  setTotalContacts(responseData?.total || 0);
}
    } catch (err) {
      console.error(err);
      setContacts([]);
      setMessage('Failed to load contacts.');
    } finally {
      setLoading(false);
    }
  };

  const getHistoryDateRange = (days: HistoryDays) => {
  const toDate = dayjs();
  const fromDate = toDate.subtract(days - 1, 'day');

  return {
    fromDate: fromDate.format('YYYY-MM-DD'),
    toDate: toDate.format('YYYY-MM-DD'),
  };
};

const fetchContactHistory = async (
  requestedPage = historyPage,
) => {
  if (!canViewContactHistory) {
    setHistoryMessage(
      'You do not have access to contact history.',
    );
    return;
  }

  try {
    setHistoryLoading(true);
    setHistoryMessage('');

    const { fromDate, toDate } =
      getHistoryDateRange(historyDays);

    const res = await axios.get<ContactHistoryResponse>(
      `${backendUrl}/telecalling/contacts/history`,
      {
        params: {
          page: requestedPage,
          limit: historyLimit,

          fromDate,
          toDate,

          telecallerId:
            canViewAllContactHistory &&
            historyTelecallerId
              ? Number(historyTelecallerId)
              : undefined,

          name: historyName.trim() || undefined,
          phone: historyPhone.trim() || undefined,
          city: historyCity.trim() || undefined,
          zone: historyZone.trim() || undefined,

          contactStatus:
            historyContactStatus || undefined,

          callStatus:
            historyCallStatus || undefined,

          stage:
            historyStage || undefined,

          sourceModule:
            historySourceModule.trim() || undefined,

          hasCalled:
            historyHasCalled || undefined,

          convertedToLead:
            historyConverted || undefined,

          storageState:
            historyStorageState || undefined,
        },
        headers: getAuthHeaders(),
      },
    );

    setHistoryContacts(
      Array.isArray(res.data?.data)
        ? res.data.data
        : [],
    );

    setHistoryTotal(
      Number(res.data?.total || 0),
    );

    setHistoryPage(
      Number(res.data?.page || requestedPage),
    );

    setHistoryTotalPages(
      Number(res.data?.totalPages || 1),
    );
  } catch (err: any) {
    console.error(err);

    setHistoryContacts([]);
    setHistoryTotal(0);
    setHistoryTotalPages(1);

    setHistoryMessage(
      err?.response?.data?.message ||
        'Failed to load contact history.',
    );
  } finally {
    setHistoryLoading(false);
  }
};

const fetchReassignmentContacts = async (
  page = 1,
) => {
  if (!fromTelecallerId) {
    setReassignmentContacts([]);
    setReassignmentTotal(0);
    setReassignmentTotalPages(1);
    return;
  }

  try {
    setTransferLoading(true);

    const res =
      await axios.get<ContactHistoryResponse>(
        `${backendUrl}/telecalling/contacts/history`,
        {
          params: {
            mode: 'reassignment',

            page,

            limit: historyLimit,

            telecallerId:
              Number(fromTelecallerId),

            name:
              historyName || undefined,

            phone:
              historyPhone || undefined,

            city:
              historyCity || undefined,

            zone:
              historyZone || undefined,

            contactStatus:
              historyContactStatus ||
              undefined,

            callStatus:
              historyCallStatus ||
              undefined,

            stage:
              historyStage ||
              undefined,

            sourceModule:
              historySourceModule ||
              undefined,

            hasCalled:
              historyHasCalled ||
              undefined,

            convertedToLead:
              historyConverted ||
              undefined,

            storageState:
              historyStorageState ||
              undefined,
          },

          headers: getAuthHeaders(),
        },
      );

    setReassignmentContacts(
      res.data.data || [],
    );

    setReassignmentTotal(
      res.data.total || 0,
    );

    setReassignmentPage(
      res.data.page || 1,
    );

    setReassignmentTotalPages(
      res.data.totalPages || 1,
    );
  } finally {
    setTransferLoading(false);
  }
};

const reassignSelectedContacts = async () => {
  if (!fromTelecallerId) {
    setMessage(
      'Select the From telecaller.',
    );
    return;
  }

  if (!toTelecallerId) {
    setMessage(
      'Select the To telecaller.',
    );
    return;
  }

  if (
    Number(fromTelecallerId) ===
    Number(toTelecallerId)
  ) {
    setMessage(
      'From and To telecaller cannot be the same.',
    );
    return;
  }

  if (!selectedHistoryContactIds.length) {
    setMessage(
      'Select at least one contact.',
    );
    return;
  }

  const fromTelecaller =
    users.find(
      (item) =>
        Number(item.id) ===
        Number(fromTelecallerId),
    );

  const toTelecaller =
    users.find(
      (item) =>
        Number(item.id) ===
        Number(toTelecallerId),
    );

  const confirmed = window.confirm(
    `Transfer ${selectedHistoryContactIds.length} selected contact(s) from ${
      fromTelecaller?.name || 'selected telecaller'
    } to ${
      toTelecaller?.name || 'selected telecaller'
    }?`,
  );

  if (!confirmed) {
    return;
  }

  try {
    setTransferLoading(true);

    const res = await axios.post(
      `${backendUrl}/telecalling/contacts/reassign-selected`,
      {
        fromTelecallerId:
          Number(fromTelecallerId),

        toTelecallerId:
          Number(toTelecallerId),

        contactIds:
          selectedHistoryContactIds,
      },
      {
        headers: getAuthHeaders(),
      },
    );

    setMessage(
      res.data?.message ||
        `${selectedHistoryContactIds.length} contacts reassigned successfully.`,
    );

    setSelectedHistoryContactIds([]);

    await fetchReassignmentContacts(
  reassignmentPage,
);

if (
  Number(fromTelecallerId) !==
  Number(toTelecallerId)
) {
  const previousFrom =
    fromTelecallerId;

  setFromTelecallerId(
    toTelecallerId,
  );

  await new Promise((resolve) =>
    setTimeout(resolve, 50),
  );

  setFromTelecallerId(
    previousFrom,
  );
}

await fetchContacts();
  } catch (err: any) {
    console.error(err);

    const errorMessage =
      err?.response?.data?.message;

    setMessage(
      Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage ||
            'Failed to reassign selected contacts.',
    );
  } finally {
    setTransferLoading(false);
  }
};

useEffect(() => {
  if (
    historyWorkspaceTab !==
    'reassignment'
  ) {
    return;
  }

  fetchReassignmentContacts(1);

  // eslint-disable-next-line
}, [
  fromTelecallerId,

  historyName,
  historyPhone,
  historyCity,
  historyZone,

  historyContactStatus,
  historyCallStatus,
  historyStage,
  historySourceModule,

  historyHasCalled,
  historyConverted,
  historyStorageState,
]);

const openContactHistory = async () => {
  setHistoryWorkspaceTab('history');

  setSelectedHistoryContactIds([]);

  setFromTelecallerId('');
  setToTelecallerId('');

  setShowContactHistory(true);

  setHistoryPage(1);

  await fetchContactHistory(1);
};

const closeContactHistory = () => {
  setShowContactHistory(false);

  setHistoryWorkspaceTab('history');

  setSelectedHistoryContactIds([]);

  setFromTelecallerId('');
  setToTelecallerId('');

  setHistoryMessage('');
};

const applyContactHistoryFilters = async () => {
  setHistoryPage(1);
  await fetchContactHistory(1);
};

const resetContactHistoryFilters = async () => {
  setHistoryDays(30);
  setHistoryTelecallerId('');

  setHistoryName('');
  setHistoryPhone('');
  setHistoryCity('');
  setHistoryZone('');

  setHistoryContactStatus('');
  setHistoryCallStatus('');
  setHistoryStage('');
  setHistorySourceModule('');

  setHistoryHasCalled('');
  setHistoryConverted('');
  setHistoryStorageState('');

  setHistoryPage(1);

  try {
    setHistoryLoading(true);
    setHistoryMessage('');

    const { fromDate, toDate } =
      getHistoryDateRange(30);

    const res = await axios.get<ContactHistoryResponse>(
      `${backendUrl}/telecalling/contacts/history`,
      {
        params: {
          page: 1,
          limit: historyLimit,
          fromDate,
          toDate,
        },
        headers: getAuthHeaders(),
      },
    );

    setHistoryContacts(
      Array.isArray(res.data?.data)
        ? res.data.data
        : [],
    );

    setHistoryTotal(
      Number(res.data?.total || 0),
    );

    setHistoryTotalPages(
      Number(res.data?.totalPages || 1),
    );
  } catch (err: any) {
    console.error(err);

    setHistoryContacts([]);
    setHistoryTotal(0);
    setHistoryTotalPages(1);

    setHistoryMessage(
      err?.response?.data?.message ||
        'Failed to reset contact history.',
    );
  } finally {
    setHistoryLoading(false);
  }
};

const formatHistoryDate = (
  value?: string | null,
) => {
  if (!value) return '-';

  const parsed = dayjs(value);

  if (!parsed.isValid()) return '-';

  return parsed.format('DD MMM YYYY, hh:mm A');
};

  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, viewMode, cityFilter, showCnrRecall]);

  useEffect(() => {
  fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [canViewAllContactHistory]);

  useEffect(() => {
    return () => {
      clearAutoTimers();
    };
  }, []);

  useEffect(() => {
  callInitiatedRef.current = callInitiated;
  quickCallModalOpenRef.current = quickCallModal.isOpen;
  quickCallSubmittingRef.current = quickCallSubmitting;
  isPausedRef.current = isPaused;
}, [callInitiated, quickCallModal.isOpen, quickCallSubmitting, isPaused]);

    useEffect(() => {
    const openQuickCallModalAfterReturn = () => {
      if (!callInitiated || !hasLeftAppForCall || !lastCalledContact) return;

      setQuickCallModal((prev) => {
        if (prev.isOpen) return prev;

        return {
          ...prev,
          isOpen: true,
          contact: prev.contact ?? lastCalledContact,
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
  }, [lastCalledContact, callInitiated, hasLeftAppForCall]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      return (
        (!nameFilter || (c.name || '').toLowerCase().includes(nameFilter.toLowerCase())) &&
        (!phoneFilter || (c.phone || '').includes(phoneFilter)) &&
        (!cityFilter ||
          (c.city || '').toLowerCase().includes(cityFilter.toLowerCase()) ||
          (c.zone || '').toLowerCase().includes(cityFilter.toLowerCase()) ||
          (c.location || '').toLowerCase().includes(cityFilter.toLowerCase()) ||
          (c.address || '').toLowerCase().includes(cityFilter.toLowerCase()))
      );
    });
  }, [contacts, nameFilter, phoneFilter, cityFilter]);

  const selectedVisibleCount = useMemo(() => {
    return filteredContacts.filter((c) => selectedContactIds.includes(c.id)).length;
  }, [filteredContacts, selectedContactIds]);

  const allVisibleSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((c) => selectedContactIds.includes(c.id));

  const activeAutoContact =
    isAutoCalling && autoCallQueue.length > 0 ? autoCallQueue[autoCallIndex] : null;
    const quickCallDateValue = quickCallNextFollowUpDate
  ? dayjs(quickCallNextFollowUpDate)
  : null;

const quickCallTimeValue = quickCallNextFollowUpDate
  ? dayjs(quickCallNextFollowUpDate)
  : null;

const updateQuickCallDatePart = (newDate: Dayjs | null) => {
  if (!newDate) {
    setQuickCallNextFollowUpDate('');
    return;
  }

  const base = quickCallNextFollowUpDate ? dayjs(quickCallNextFollowUpDate) : dayjs();
  const merged = newDate
    .hour(base.hour())
    .minute(base.minute())
    .second(0)
    .millisecond(0);

  setQuickCallNextFollowUpDate(merged.format('YYYY-MM-DDTHH:mm'));
};

const updateQuickCallTimePart = (newTime: Dayjs | null) => {
  if (!newTime) return;

  const base = quickCallNextFollowUpDate ? dayjs(quickCallNextFollowUpDate) : dayjs();
  const merged = base
    .hour(newTime.hour())
    .minute(newTime.minute())
    .second(0)
    .millisecond(0);

  setQuickCallNextFollowUpDate(merged.format('YYYY-MM-DDTHH:mm'));
};
        const startQuickCall = async (contact: Contact): Promise<boolean> => {
  if (
    callInitiatedRef.current ||
    quickCallModalOpenRef.current ||
    quickCallSubmittingRef.current
  ) {
    return false;
  }

  callInitiatedRef.current = true;

  try {
    const res = await axios.post(
      `${backendUrl}/telecalling/contacts/${contact.id}/quick-call/start`,
      {
        providerName: 'TEL_LINK',
        receiverNumber: contact.phone,
      },
      { headers: getAuthHeaders() },
    );

    const callLogId = Number(res.data?.callLog?.id || 0) || undefined;

    setLastCalledContact(contact);
    setQuickCallModal({
      isOpen: false,
      contact,
      callLogId,
    });

    setCallInitiated(true);
    setHasLeftAppForCall(false);

    if (Capacitor.isNativePlatform()) {
      const plugin = (window as any).Capacitor?.Plugins?.CallControl || CallControl;
      await plugin.placeCall({ number: contact.phone });
    } else {
      window.location.href = `tel:${contact.phone}`;
    }

    setMessage(`Calling ${contact.name || contact.phone}`);
    return true;
  } catch (err) {
    console.error(err);
    setMessage('Failed to start call');
    callInitiatedRef.current = false;
    setCallInitiated(false);
    setHasLeftAppForCall(false);
    return false;
  }
};

    const startCountdownThenCall = (nextContact: Contact, nextIndex: number) => {
  clearAutoTimers();
  setCountdown(3);

  let time = 3;

  countdownIntervalRef.current = setInterval(() => {
    time -= 1;
    setCountdown(time);

    if (time <= 0 && countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, 1000);

  resumeTimeoutRef.current = setTimeout(async () => {
    if (isPausedRef.current) return;

    const started = await startQuickCall(nextContact);

    if (started) {
      setAutoCallIndex(nextIndex);
    }
  }, 3000);
};

    const callNextContact = async () => {
  if (isPausedRef.current) return;

  let nextIndex = autoCallIndex + 1;

  while (
    nextIndex < autoCallQueue.length &&
    processedAutoCallIds.includes(autoCallQueue[nextIndex]?.id)
  ) {
    nextIndex += 1;
  }

  if (nextIndex >= autoCallQueue.length) {
    stopAutoCall();
    setMessage('Auto call completed.');
    return;
  }

  const nextContact = autoCallQueue[nextIndex];

  if (nextContact) {
    startCountdownThenCall(nextContact, nextIndex);
  }
};

const fetchMyContactCount = async () => {
  try {
    if (!currentUser?.id) return;

    setLoadingMyCount(true);

    const res = await axios.get(
      `${backendUrl}/telecalling/telecaller-contact-count/${currentUser.id}`,
      { headers: getAuthHeaders() }
    );

    setMyContactCount(res.data?.count || 0);
  } catch (err) {
    console.error(err);
    setMessage('Failed to fetch contact count');
  } finally {
    setLoadingMyCount(false);
  }
};

    const startAutoCall = async () => {
    try {
      if (isAutoCalling) {
        setMessage('Auto call is already running.');
        return;
      }

      const res = await axios.get(`${backendUrl}/telecalling/contacts/all-ids`, {
        params: {
          view: viewMode,
          locationFilter: cityFilter || undefined,
        },
        headers: getAuthHeaders(),
      });

      const fullQueue: Contact[] = Array.isArray(res.data) ? res.data : [];
      const validQueue = fullQueue.filter((c) => !!String(c.phone || '').trim());

      if (!validQueue.length) {
        setMessage('No contacts available for auto call.');
        return;
      }

      const firstContact = validQueue[0];

      setIsAutoCalling(true);
      setIsPaused(false);
      setAutoCallQueue(validQueue);
      setAutoCallIndex(0);
      setCountdown(0);
      setProcessedAutoCallIds(firstContact?.id ? [firstContact.id] : []);

      await startQuickCall(firstContact);
    } catch (err) {
      console.error(err);
      setMessage('Failed to start auto call.');
    }
  };

  const pauseAutoCall = () => {
    clearAutoTimers();
    setIsPaused(true);
    setCountdown(0);
    setMessage('Auto call paused.');
  };

  const resumeAutoCall = async () => {
    setIsPaused(false);
    setMessage('Auto call resumed.');
    await callNextContact();
  };

    const skipCurrentContact = async () => {
    clearAutoTimers();
    setCountdown(0);

    const currentContact = autoCallQueue[autoCallIndex];
    if (currentContact?.id) {
      setProcessedAutoCallIds((prev) => {
        if (prev.includes(currentContact.id)) return prev;
        return [...prev, currentContact.id];
      });
    }

    await callNextContact();
  };

   const resetQuickCallModal = () => {
    setQuickCallModal({
      isOpen: false,
      contact: null,
      callLogId: undefined,
    });
    setLastCalledContact(null);
    setQuickCallNotes('');
    setQuickCallNextFollowUpDate('');
    setQuickCallRecordingUrl('');
    setQuickCallRecordingFile(null);
setUploadingQuickCallRecording(false);
    setQuickCallSubmitting(false);
    setCallInitiated(false);
    setHasLeftAppForCall(false);
  };

  const handleQuickCallModalClose = () => {
    if (isAutoCalling) {
      setMessage('Auto call paused until you resume or skip.');
      setIsPaused(true);
      clearAutoTimers();
      setCountdown(0);
    }

    resetQuickCallModal();
  };

  const uploadQuickCallRecording = async () => {
  if (!quickCallRecordingFile || !quickCallModal.contact) return '';

  try {
    setUploadingQuickCallRecording(true);

    const formData = new FormData();
    formData.append('file', quickCallRecordingFile);
    formData.append('contactId', String(quickCallModal.contact.id));

    if (quickCallModal.callLogId) {
      formData.append('callLogId', String(quickCallModal.callLogId));
    }

    const res = await fetch(`${backendUrl}/telecalling/recordings/upload`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeaders().Authorization,
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || 'Recording upload failed');
    }

    return data.recordingUrl || '';
  } catch (err: any) {
    console.error(err);
    setMessage(err?.message || 'Recording upload failed');
    return '';
  } finally {
    setUploadingQuickCallRecording(false);
  }
};

  const completeQuickCall = async (disposition: QuickCallDisposition) => {
    if (!quickCallModal.contact) {
      setMessage('No contact selected for quick call');
      return;
    }

    try {
  setQuickCallSubmitting(true);

  let finalRecordingUrl = quickCallRecordingUrl;

  if (quickCallRecordingFile) {
    const uploadedUrl = await uploadQuickCallRecording();

    if (uploadedUrl) {
      finalRecordingUrl = uploadedUrl;
    }
  }

  await axios.post(
        `${backendUrl}/telecalling/contacts/${quickCallModal.contact.id}/quick-call/complete`,
        {
          callLogId: quickCallModal.callLogId,
          callStatus: disposition,
          disposition,
          callNotes: quickCallNotes,
          nextFollowUpDate: quickCallNextFollowUpDate
            ? new Date(quickCallNextFollowUpDate).toISOString()
            : undefined,
          recordingUrl: finalRecordingUrl || undefined,
          providerName: 'TEL_LINK',
          receiverNumber: quickCallModal.contact.phone,
        },
        { headers: getAuthHeaders() },
      );

            if (quickCallModal.contact?.id) {
        setProcessedAutoCallIds((prev) => {
          if (prev.includes(quickCallModal.contact!.id)) return prev;
          return [...prev, quickCallModal.contact!.id];
        });
      }

      setMessage(`Call saved as ${disposition.replaceAll('_', ' ')}`);
resetQuickCallModal();
await fetchContacts();

if (isAutoCalling && !isPausedRef.current) {
  await callNextContact();
}
    } catch (err) {
      console.error(err);
      setMessage('Failed to save quick call outcome');
    } finally {
      setQuickCallSubmitting(false);
    }
  };
    const assignSelectedContacts = async () => {
    try {
      if (!bulkAssignedTo || selectedContactIds.length === 0) return;

      setAssigningBulk(true);

      await axios.patch(
        `${backendUrl}/telecalling/contacts/bulk-assign`,
        {
          contactIds: selectedContactIds,
          assignedTo: Number(bulkAssignedTo),
        },
        { headers: getAuthHeaders() },
      );

      setMessage('Selected contacts assigned successfully.');
      setSelectedContactIds([]);
      setBulkAssignedTo('');
      await fetchContacts();
    } catch (err) {
      console.error(err);
      setMessage('Failed to assign selected contacts.');
    } finally {
      setAssigningBulk(false);
    }
  };

  const assignLatestContacts = async () => {
    try {
      if (!assignLatestCount || !bulkAssignedTo) {
        setMessage('Enter count and select telecaller.');
        return;
      }

      setAssigningLatest(true);

      await axios.patch(
        `${backendUrl}/telecalling/contacts/assign-latest`,
        {
          locationFilter: cityFilter,
          assignCount: Number(assignLatestCount),
          assignedTo: Number(bulkAssignedTo),
          view: viewMode,
        },
        { headers: getAuthHeaders() },
      );

      setMessage('Latest contacts assigned successfully.');
      setAssignLatestCount('');
      await fetchContacts();
    } catch (err) {
      console.error(err);
      setMessage('Failed to assign latest contacts.');
    } finally {
      setAssigningLatest(false);
    }
  };

const fetchUserContactCount = async (
  userId: string,
  type: 'from' | 'to'
) => {
  try {
    if (!userId) {
      if (type === 'from') setFromUserCount(null);
      if (type === 'to') setToUserCount(null);
      return;
    }

    const res = await axios.get(
      `${backendUrl}/telecalling/telecaller-contact-count/${userId}`,
      { headers: getAuthHeaders() }
    );

    if (type === 'from') setFromUserCount(res.data?.count || 0);
    if (type === 'to') setToUserCount(res.data?.count || 0);
  } catch (err) {
    console.error(err);
  }
};

  // 🔥 TRANSFER CONTACTS FUNCTION
const transferContacts = async () => {
  try {
    if (!transferFromUser || !transferToUser) {
      setMessage('Select both telecallers');
      return;
    }

    setTransferring(true);

    const res = await axios.patch(
      `${backendUrl}/telecalling/transfer-contacts`,
      {
        fromUserId: Number(transferFromUser),
        toUserId: Number(transferToUser),
        count: transferCount ? Number(transferCount) : undefined,
        city: cityFilter || undefined,
      },
      { headers: getAuthHeaders() },
    );

    setMessage(res.data?.message || 'Contacts transferred successfully');

    setTransferFromUser('');
    setTransferToUser('');
    setTransferCount('');

    await fetchContacts();
  } catch (err) {
    console.error(err);
    setMessage('Transfer failed');
  } finally {
    setTransferring(false);
  }
};

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setImporting(true);
      await axios.post(`${backendUrl}/telecalling/contacts/import`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('Contacts imported successfully.');
      await fetchContacts();
    } catch (err) {
      console.error(err);
      setMessage('Failed to import contacts.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleContact = (id: number) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selectAllVisible = () => {
    const idsToAdd = filteredContacts.map((c) => c.id);
    setSelectedContactIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const clearSelected = () => {
    setSelectedContactIds([]);
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(filteredContacts.map((c) => c.id));
      setSelectedContactIds((prev) => prev.filter((id) => !visibleIds.has(id)));
      return;
    }
    selectAllVisible();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="overflow-hidden rounded-3xl bg-white shadow">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 text-white">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold">Telecalling Contacts</h1>
                <p className="mt-1 text-sm text-blue-100">
                  Fast calling, assignment, storage handling, and mobile-friendly workflow
                </p>
              </div>

              <div className="flex flex-wrap gap-2">

                {canViewContactHistory && (
  <button
    type="button"
    onClick={openContactHistory}
    className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-amber-300"
  >
    Contact History & Reassignment
  </button>
)}
                <Link
                  href="/telecalling"
                  className="rounded-xl bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur"
                >
                  Back
                </Link>

                <label className="cursor-pointer rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700">
                  {importing ? 'Importing...' : 'Import Contacts'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleImport}
                    className="hidden"
                    disabled={importing}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
            <StatCard title="Visible Contacts" value={filteredContacts.length} tone="blue" />
            <StatCard title="Filtered Total" value={totalContacts} tone="green" />
            <StatCard title="Current Page" value={page} tone="purple" />
            <StatCard title="Total Pages" value={totalPages} tone="orange" />
          </div>
        </div>

        {message ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 shadow-sm">
            {message}
          </div>
        ) : null}        <div className="rounded-3xl bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Filters & Controls</h2>
              <p className="text-sm text-gray-500">
                Keep filtering by user role and work only on the relevant contact set
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <input
              placeholder="Search by name"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white"
            />

            <input
              placeholder="Search by phone"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white"
            />

            <input
              placeholder="City / Zone / Location"
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white"
            />

            <select
              value={viewMode}
              onChange={(e) => {
                setViewMode(e.target.value as ViewMode);
                setPage(1);
              }}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="active">Active</option>
              {isOwnerOrTelecallingManager && (
                <option value="storage">Storage</option>
              )}
            </select>

            <button
  type="button"
  onClick={() => {
    setShowCnrRecall((prev) => !prev);
    setPage(1);
    setSelectedContactIds([]);
  }}
  className={`rounded px-4 py-2 text-white ${
    showCnrRecall ? 'bg-red-700' : 'bg-gray-700'
  }`}
>
  {showCnrRecall ? 'Exit CNR Recall Queue' : 'CNR Recall Queue'}
</button>

            <button
              onClick={fetchContacts}
              className="rounded-2xl bg-blue-600 px-4 py-3 font-medium text-white"
            >
              Apply
            </button>

            {!showCnrRecall && (
  <>
    {!isAutoCalling ? (
      <button
        onClick={startAutoCall}
        className="rounded-2xl bg-green-600 px-4 py-3 font-medium text-white"
      >
        Start Auto Call
      </button>
    ) : (
      <button
        onClick={stopAutoCall}
        className="rounded-2xl bg-red-600 px-4 py-3 font-medium text-white"
      >
        Stop
      </button>
    )}
  </>
)}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
  <button
    onClick={toggleAllVisible}
    className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
  >
    {allVisibleSelected ? 'Unselect Visible' : 'Select Visible'}
  </button>

  <button
    onClick={clearSelected}
    className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
  >
    Clear Selected
  </button>

  <Badge text={`Visible: ${filteredContacts.length}`} />
  <Badge text={`Selected Visible: ${selectedVisibleCount}`} />
  <Badge text={`Total Selected: ${selectedContactIds.length}`} />
</div>

{roles.includes('TELECALLER') && (
  <div className="mt-3 rounded-2xl bg-indigo-50 p-3">
    <button
      onClick={fetchMyContactCount}
      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
    >
      {loadingMyCount ? 'Loading...' : 'Show My Active Contacts Count'}
    </button>

    {myContactCount !== null && (
      <p className="mt-2 text-sm text-gray-700">
        📞 Active Contacts: <b>{myContactCount}</b>
      </p>
    )}
  </div>
)}

          {isAutoCalling && (
            <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Auto Call Running</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {activeAutoContact?.name || 'Unknown Contact'}
                  </p>
                  <p className="text-sm text-gray-600">{activeAutoContact?.phone || '-'}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={pauseAutoCall}
                    className="rounded-2xl bg-yellow-500 px-4 py-2 text-sm font-medium text-white"
                  >
                    Pause
                  </button>
                  <button
                    onClick={resumeAutoCall}
                    className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    Resume
                  </button>
                  <button
                    onClick={skipCurrentContact}
                    className="rounded-2xl bg-gray-700 px-4 py-2 text-sm font-medium text-white"
                  >
                    Skip
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge text={`Queue: ${autoCallQueue.length > 0 ? autoCallIndex + 1 : 0} / ${autoCallQueue.length}`} />
                {countdown > 0 && <Badge text={`Next call in: ${countdown}s`} />}
                {isPaused && <Badge text="Paused" tone="yellow" />}
              </div>
            </div>
          )}
        </div>

        {isOwnerOrTelecallingManager && (
          <>
            <div className="rounded-3xl bg-white p-4 shadow">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">Bulk Assignment</h3>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select
                  value={bulkAssignedTo}
                  onChange={(e) => setBulkAssignedTo(e.target.value)}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white"
                >
                  <option value="">Select telecaller</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.id} - {u.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={assignSelectedContacts}
                  disabled={assigningBulk}
                  className="rounded-2xl bg-green-600 px-4 py-3 font-medium text-white disabled:opacity-50"
                >
                  {assigningBulk ? 'Assigning...' : 'Assign Selected'}
                </button>

                <div className="flex items-center rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  Current selection: {selectedContactIds.length}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-4 shadow">
  <h3 className="mb-3 text-lg font-semibold text-gray-900">
    Transfer Contacts Between Telecallers
  </h3>
<p className="text-sm text-gray-500 mb-3">
    Current filter: {cityFilter || 'All'}
  </p>

  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
    <div>
  <select
    value={transferFromUser}
    onChange={(e) => {
      const value = e.target.value;
      setTransferFromUser(value);
      fetchUserContactCount(value, 'from');
    }}
    className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3"
  >
    <option value="">From Telecaller</option>
    {users.map((u) => (
      <option key={u.id} value={u.id}>
        {u.id} - {u.name}
      </option>
    ))}
  </select>

  {fromUserCount !== null && (
    <p className="mt-1 text-xs text-gray-500">
      Contacts: {fromUserCount}
    </p>
  )}
</div>

    <div>
  <select
    value={transferToUser}
    onChange={(e) => {
      const value = e.target.value;
      setTransferToUser(value);
      fetchUserContactCount(value, 'to');
    }}
    className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3"
  >
    <option value="">To Telecaller</option>
    {users.map((u) => (
      <option key={u.id} value={u.id}>
        {u.id} - {u.name}
      </option>
    ))}
  </select>

  {toUserCount !== null && (
    <p className="mt-1 text-xs text-gray-500">
      Contacts: {toUserCount}
    </p>
  )}
</div>

    <input
      value={transferCount}
      onChange={(e) => setTransferCount(e.target.value)}
      placeholder="Number of contacts (optional)"
      className="rounded-2xl border border-gray-200 bg-gray-50 p-3"
    />

    <button
      onClick={transferContacts}
      disabled={transferring}
      className="rounded-2xl bg-purple-600 px-4 py-3 font-medium text-white disabled:opacity-50"
    >
      {transferring ? 'Transferring...' : 'Transfer'}
    </button>
  </div>
</div>

            {viewMode === 'storage' && (
              <div className="rounded-3xl bg-white p-4 shadow">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">Assign Latest Contacts</h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input
                    placeholder="Number of contacts"
                    value={assignLatestCount}
                    onChange={(e) => setAssignLatestCount(e.target.value)}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white"
                  />

                  <select
                    value={bulkAssignedTo}
                    onChange={(e) => setBulkAssignedTo(e.target.value)}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-3 outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    <option value="">Select telecaller</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.id} - {u.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={assignLatestContacts}
                    disabled={assigningLatest}
                    className="rounded-2xl bg-indigo-600 px-4 py-3 font-medium text-white disabled:opacity-50"
                  >
                    {assigningLatest ? 'Assigning...' : 'Assign Latest'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
                {loading ? (
          <div className="rounded-3xl bg-white p-6 shadow">Loading...</div>
        ) : (
          <div className="grid gap-4">
            {filteredContacts.map((c) => (
              <div
                key={c.id}
                className={`overflow-hidden rounded-3xl shadow transition ${
                  isAutoCalling && activeAutoContact?.id === c.id
                    ? 'border-2 border-green-500 bg-green-50'
                    : 'bg-white'
                }`}
              >
                <div className="border-b border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-semibold text-gray-900">
                          {c.name || '-'}
                        </h3>

                        {c.convertedToLead ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            Converted
                          </span>
                        ) : null}

                        {isAutoCalling && activeAutoContact?.id === c.id ? (
                          <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white">
                            Calling Now
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-sm text-gray-700">{c.phone || '-'}</p>
                      <p className="text-sm text-gray-500">
                        {c.city || c.zone || c.location || c.address || '-'}
                      </p>
                    </div>

                    {c.sourceModule === 'CUSTOMER_REFERRAL' && (
  <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3">
    <p className="text-xs font-black text-emerald-700">
      ⭐ CUSTOMER REFERRAL
    </p>

    <p className="mt-2 text-xs">
      <span className="font-bold">Referred By:</span>{' '}
      {c.referralReferrerName || '-'}
    </p>

    <p className="text-xs">
      <span className="font-bold">Referrer Phone:</span>{' '}
      {c.referralReferrerPhone || '-'}
    </p>

    <p className="text-xs">
      <span className="font-bold">City:</span>{' '}
      {c.city || '-'}
    </p>

    <p className="text-xs">
      <span className="font-bold">Customer Code:</span>{' '}
      {c.referralCustomerCode || '-'}
    </p>

    {c.referralRemarks && (
      <p className="mt-2 text-xs text-gray-700">
        <span className="font-bold">Referral Notes:</span>{' '}
        {c.referralRemarks}
      </p>
    )}
  </div>
)}


                    <input
                      type="checkbox"
                      checked={selectedContactIds.includes(c.id)}
                      onChange={() => toggleContact(c.id)}
                      className="mt-1 h-4 w-4"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
                  <InfoBox label="Zone" value={c.zone || '-'} />
                  <InfoBox label="City" value={c.city || '-'} />
                  <InfoBox label="Assigned To" value={c.assignedToName || 'Unassigned'} />
                  <InfoBox label="Imported By" value={c.importedByName || '-'} />
                </div>

                <div className="flex flex-wrap gap-2 p-4 pt-0">
                  <button
  onClick={() => {
    if (callInitiated || quickCallModal.isOpen) return;
    startQuickCall(c);
  }}
  disabled={callInitiated || quickCallModal.isOpen}
  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
>
  Call
</button>

                  <Link
                    href={`/telecalling/contacts/${c.id}`}
                    className="rounded-2xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}

            {filteredContacts.length === 0 && (
              <div className="rounded-3xl bg-white p-8 text-center text-gray-500 shadow">
                No contacts found
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between rounded-3xl bg-white p-4 shadow">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="rounded-2xl bg-gray-100 px-4 py-2 font-medium text-gray-700 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm font-medium text-gray-700">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="rounded-2xl bg-gray-100 px-4 py-2 font-medium text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {quickCallModal.isOpen && quickCallModal.contact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Quick Call Outcome</h2>
                  <p className="text-sm text-gray-600">
                    {quickCallModal.contact.name} ({quickCallModal.contact.phone})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleQuickCallModalClose}
                  className="rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-700"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <textarea
                  value={quickCallNotes}
                  onChange={(e) => setQuickCallNotes(e.target.value)}
                  rows={4}
                  placeholder="Quick call notes"
                  className="rounded-2xl border border-gray-200 p-3 md:col-span-2"
                />

                <LocalizationProvider dateAdapter={AdapterDayjs}>
  <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
    <DatePicker
      label="Follow-up Date"
      value={quickCallDateValue}
      onChange={updateQuickCallDatePart}
      slotProps={{
        textField: {
          fullWidth: true,
        },
      }}
    />

    <MobileTimePicker
      label="Follow-up Time"
      value={quickCallTimeValue}
      onChange={updateQuickCallTimePart}
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

                <input
                  type="text"
                  value={quickCallRecordingUrl}
                  onChange={(e) => setQuickCallRecordingUrl(e.target.value)}
                  placeholder="Recording URL"
                  className="rounded-2xl border border-gray-200 p-3"
                />

                <div className="rounded-2xl border border-dashed border-gray-300 p-3 md:col-span-2">
  <label className="mb-2 block text-sm font-medium text-gray-700">
    Upload Call Recording
  </label>

  <input
  type="file"
  accept="audio/*"
  capture
  onChange={(e) => {
    if (e.target.files?.[0]) {
      setQuickCallRecordingFile(e.target.files[0]);
    }
  }}
/>

  {quickCallRecordingFile && (
    <p className="mt-2 text-xs text-gray-600">
      Selected: {quickCallRecordingFile.name}
    </p>
  )}

  {uploadingQuickCallRecording && (
    <p className="mt-2 text-xs text-blue-600">
      Uploading recording...
    </p>
  )}
</div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <button
                  type="button"
                  onClick={() => completeQuickCall('INTERESTED')}
                  disabled={quickCallSubmitting}
                  className="rounded-2xl bg-green-600 px-4 py-3 font-medium text-white disabled:opacity-50"
                >
                  Interested
                </button>

                <button
                  type="button"
                  onClick={() => completeQuickCall('NOT_INTERESTED')}
                  disabled={quickCallSubmitting}
                  className="rounded-2xl bg-red-600 px-4 py-3 font-medium text-white disabled:opacity-50"
                >
                  Not Interested
                </button>

                <button
                  type="button"
                  onClick={() => completeQuickCall('CALLBACK')}
                  disabled={quickCallSubmitting}
                  className="rounded-2xl bg-yellow-500 px-4 py-3 font-medium text-white disabled:opacity-50"
                >
                  Callback
                </button>

                <button
                  type="button"
                  onClick={() => completeQuickCall('CONNECTED')}
                  disabled={quickCallSubmitting}
                  className="rounded-2xl bg-blue-600 px-4 py-3 font-medium text-white disabled:opacity-50"
                >
                  Connected
                </button>

                <button
                  type="button"
                  onClick={() => completeQuickCall('CNR')}
                  disabled={quickCallSubmitting}
                  className="rounded-2xl bg-gray-700 px-4 py-3 font-medium text-white disabled:opacity-50"
                >
                  CNR
                </button>

                <button
                  type="button"
                  onClick={() => completeQuickCall('PROPOSAL_SENT')}
                  disabled={quickCallSubmitting}
                  className="rounded-2xl bg-purple-600 px-4 py-3 font-medium text-white disabled:opacity-50"
                >
                  Proposal Sent
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showContactHistory && (
  <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 p-0 backdrop-blur-sm md:p-4">
    <div className="min-h-screen bg-gray-100 md:mx-auto md:min-h-[calc(100vh-2rem)] md:max-w-7xl md:rounded-3xl md:shadow-2xl">
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 p-4 text-white md:rounded-t-3xl md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold md:text-2xl">
                Contact History & Reassignment
              </h2>

              <p className="mt-1 text-sm text-blue-100">
                {roles.includes('TELECALLER')
                  ? 'View your own contact activity for the last 180 days.'
                  : 'View contact activity telecaller-wise for the last 180 days.'}
              </p>
            </div>

            <button
              type="button"
              onClick={closeContactHistory}
              className="self-start rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25 md:self-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 md:p-5">

        <div className="rounded-3xl bg-white p-2 shadow-sm">
  <div className="flex gap-2">
    <button
      type="button"
      onClick={() => setHistoryWorkspaceTab('history')}
      className={`flex-1 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
        historyWorkspaceTab === 'history'
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      Contact History
    </button>

    {canViewAllContactHistory && (
      <button
        type="button"
        onClick={() =>
          setHistoryWorkspaceTab('reassignment')
        }
        className={`flex-1 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
          historyWorkspaceTab === 'reassignment'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Reassignment
      </button>
    )}
  </div>
</div>

{historyWorkspaceTab === 'history' && (
  <>
        {historyMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {historyMessage}
          </div>
        ) : null}

        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              History Filters
            </h3>

            <p className="text-sm text-gray-500">
              Every selected filter is applied together.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={historyDays}
              onChange={(e) =>
                setHistoryDays(
                  Number(e.target.value) as HistoryDays,
                )
              }
              className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value={30}>Last 30 Days</option>
<option value={60}>Last 60 Days</option>
<option value={90}>Last 90 Days</option>
<option value={120}>Last 120 Days</option>
<option value={150}>Last 150 Days</option>
<option value={180}>Last 180 Days</option>
            </select>

            {canViewAllContactHistory ? (
              <select
                value={historyTelecallerId}
                onChange={(e) =>
                  setHistoryTelecallerId(
                    e.target.value,
                  )
                }
                className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="">
                  All Telecallers
                </option>

                {users.map((user) => (
                  <option
                    key={user.id}
                    value={user.id}
                  >
                    {user.id} - {user.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-3 text-sm font-medium text-indigo-700">
                My Contact History
              </div>
            )}

            <input
              value={historyName}
              onChange={(e) =>
                setHistoryName(e.target.value)
              }
              placeholder="Contact name"
              className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
            />

            <input
              value={historyPhone}
              onChange={(e) =>
                setHistoryPhone(e.target.value)
              }
              placeholder="Phone number"
              className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
            />

            <input
              value={historyCity}
              onChange={(e) =>
                setHistoryCity(e.target.value)
              }
              placeholder="City"
              className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
            />

            <input
              value={historyZone}
              onChange={(e) =>
                setHistoryZone(e.target.value)
              }
              placeholder="Zone"
              className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
            />

            <select
              value={historyContactStatus}
              onChange={(e) =>
                setHistoryContactStatus(
                  e.target.value,
                )
              }
              className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">
                All Contact Statuses
              </option>
              <option value="NEW">New</option>
              <option value="CONVERTED">
                Converted
              </option>
            </select>

            <select
              value={historyCallStatus}
              onChange={(e) =>
                setHistoryCallStatus(
                  e.target.value,
                )
              }
              className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">
                All Latest Call Statuses
              </option>
              <option value="INTERESTED">
                Interested
              </option>
              <option value="NOT_INTERESTED">
                Not Interested
              </option>
              <option value="CALLBACK">
                Callback
              </option>
              <option value="CONNECTED">
                Connected
              </option>
              <option value="CNR">CNR</option>
              <option value="NO_RESPONSE">
                No Response
              </option>
              <option value="PROPOSAL_SENT">
                Proposal Sent
              </option>
              <option value="BUSY">Busy</option>
              <option value="SWITCH_OFF">
                Switch Off
              </option>
              <option value="WRONG_NUMBER">
                Wrong Number
              </option>
            </select>

            <select
              value={historyStage}
              onChange={(e) =>
                setHistoryStage(e.target.value)
              }
              className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">All Stages</option>
              <option value="TELECALLING">
                Telecalling
              </option>
              <option value="REVIEW">Review</option>
              <option value="LEAD">Lead</option>
              <option value="MEETING">
                Meeting
              </option>
              <option value="PROJECT">
                Project
              </option>
            </select>

            <input
              value={historySourceModule}
              onChange={(e) =>
                setHistorySourceModule(
                  e.target.value,
                )
              }
              placeholder="Source module"
              className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
            />

            <select
              value={historyHasCalled}
              onChange={(e) =>
                setHistoryHasCalled(e.target.value)
              }
              className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">
                Called: All
              </option>
              <option value="true">
                Called: Yes
              </option>
              <option value="false">
                Called: No
              </option>
            </select>

            <select
              value={historyConverted}
              onChange={(e) =>
                setHistoryConverted(e.target.value)
              }
              className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">
                Conversion: All
              </option>
              <option value="true">
                Converted: Yes
              </option>
              <option value="false">
                Converted: No
              </option>
            </select>

            <select
              value={historyStorageState}
              onChange={(e) =>
                setHistoryStorageState(
                  e.target.value,
                )
              }
              className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-800 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="">
                Active + Storage
              </option>
              <option value="ACTIVE">
                Active Only
              </option>
              <option value="STORAGE">
                Storage Only
              </option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyContactHistoryFilters}
              disabled={historyLoading}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {historyLoading
                ? 'Loading...'
                : 'Apply Filters'}
            </button>

            <button
              type="button"
              onClick={resetContactHistoryFilters}
              disabled={historyLoading}
              className="rounded-2xl bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            title="Filtered Total"
            value={historyTotal}
            tone="blue"
          />

          <StatCard
            title="Showing"
            value={historyContacts.length}
            tone="green"
          />

          <StatCard
            title="Current Page"
            value={historyPage}
            tone="purple"
          />

          <StatCard
            title="Total Pages"
            value={historyTotalPages}
            tone="orange"
          />
        </div>

        <div className="space-y-3">
          {historyLoading ? (
            <div className="rounded-3xl bg-white p-8 text-center text-gray-500 shadow-sm">
              Loading contact history...
            </div>
          ) : historyContacts.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center text-gray-500 shadow-sm">
              No contacts were found for the selected
              history filters.
            </div>
          ) : (
            historyContacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {contact.name ||
                          'Unnamed Contact'}
                      </h3>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {contact.status || 'NEW'}
                      </span>

                      <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                        {contact.stage ||
                          'TELECALLING'}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          contact.isInStorage
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {contact.isInStorage
                          ? 'STORAGE'
                          : 'ACTIVE'}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-3">
                      <p>
                        <span className="font-medium text-gray-800">
                          Phone:
                        </span>{' '}
                        {contact.phone || '-'}
                      </p>

                      <p>
                        <span className="font-medium text-gray-800">
                          City:
                        </span>{' '}
                        {contact.city || '-'}
                      </p>

                      <p>
                        <span className="font-medium text-gray-800">
                          Zone:
                        </span>{' '}
                        {contact.zone || '-'}
                      </p>

                      <p>
                        <span className="font-medium text-gray-800">
                          Assigned To:
                        </span>{' '}
                        {contact.assignedToName ||
                          (contact.assignedTo
                            ? `User ${contact.assignedTo}`
                            : 'Unassigned')}
                      </p>

                      <p>
                        <span className="font-medium text-gray-800">
                          Latest Call:
                        </span>{' '}
                        {contact.latestCallStatus ||
                          'No call status'}
                      </p>

                      <p>
                        <span className="font-medium text-gray-800">
                          Last Worked By:
                        </span>{' '}
                        {contact.latestCalledByName ||
                          (contact.latestCalledBy
                            ? `User ${contact.latestCalledBy}`
                            : '-')}
                      </p>

                      <p>
                        <span className="font-medium text-gray-800">
                          Last Activity:
                        </span>{' '}
                        {formatHistoryDate(
                          contact.latestActivityAt,
                        )}
                      </p>

                      <p>
                        <span className="font-medium text-gray-800">
                          Created:
                        </span>{' '}
                        {formatHistoryDate(
                          contact.createdAt,
                        )}
                      </p>

                      <p>
                        <span className="font-medium text-gray-800">
                          Source:
                        </span>{' '}
                        {contact.sourceModule || '-'}
                      </p>
                    </div>

                    {contact.latestCallNotes ? (
                      <div className="mt-3 rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Latest Notes
                        </p>

                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                          {contact.latestCallNotes}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 lg:w-44 lg:flex-col">
                    <a
                      href={`tel:${contact.phone}`}
                      className="rounded-2xl bg-green-600 px-4 py-2 text-center text-sm font-semibold text-white"
                    >
                      Call
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        closeContactHistory();
                        setNameFilter(
                          contact.name || '',
                        );
                        setPhoneFilter(
                          contact.phone || '',
                        );
                        setPage(1);
                      }}
                      className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Open on Contacts Page
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {historyTotalPages > 1 ? (
          <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Page {historyPage} of{' '}
              {historyTotalPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  historyLoading ||
                  historyPage <= 1
                }
                onClick={async () => {
                  const nextPage =
                    historyPage - 1;

                  setHistoryPage(nextPage);
                  await fetchContactHistory(
                    nextPage,
                  );
                }}
                className="rounded-2xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={
                  historyLoading ||
                  historyPage >=
                    historyTotalPages
                }
                onClick={async () => {
                  const nextPage =
                    historyPage + 1;

                  setHistoryPage(nextPage);
                  await fetchContactHistory(
                    nextPage,
                  );
                }}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
        </>
        )}
        {historyWorkspaceTab === 'reassignment' && (
  <div className="rounded-3xl bg-white p-8 shadow-sm">
    <h3 className="text-xl font-bold text-gray-900">
      Contact Reassignment
    </h3>

    <p className="mt-2 text-sm text-gray-500">
      This workspace will allow managers to transfer
      selected or filtered contacts between telecallers
      without affecting the active contact queue.
    </p>

    <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          From Telecaller
        </label>

        <select
          value={fromTelecallerId}
          onChange={(e) =>
            setFromTelecallerId(e.target.value)
          }
          className="w-full rounded-2xl border border-gray-200 p-3"
        >
          <option value="">Select</option>

          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          To Telecaller
        </label>

        <select
          value={toTelecallerId}
          onChange={(e) =>
            setToTelecallerId(e.target.value)
          }
          className="w-full rounded-2xl border border-gray-200 p-3"
        >
          <option value="">Select</option>

          {users
            .filter(
              (u) =>
                String(u.id) !== fromTelecallerId,
            )
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
        </select>
      </div>
    </div>

    <div className="mt-8 rounded-2xl bg-gray-50 p-5">

  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h4 className="font-semibold text-gray-900">
      Contacts
    </h4>

    <p className="mt-1 text-sm text-gray-500">
      Total: {reassignmentTotal} · Selected:{' '}
      {selectedHistoryContactIds.length}
    </p>
  </div>

  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() =>
        setSelectedHistoryContactIds([])
      }
      disabled={
        transferLoading ||
        selectedHistoryContactIds.length === 0
      }
      className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Clear Selection
    </button>

    <button
      type="button"
      onClick={reassignSelectedContacts}
      disabled={
        transferLoading ||
        !fromTelecallerId ||
        !toTelecallerId ||
        selectedHistoryContactIds.length === 0 ||
        Number(fromTelecallerId) ===
          Number(toTelecallerId)
      }
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {transferLoading
        ? 'Transferring...'
        : `Transfer Selected (${selectedHistoryContactIds.length})`}
    </button>
  </div>
</div>

  {reassignmentContacts.length === 0 ? (

    <div className="py-10 text-center text-gray-500">

      Select a telecaller to load contacts.

    </div>

  ) : (

    <div className="space-y-3">

      {reassignmentContacts.map(
        (contact) => (

          <label
            key={contact.id}
            className="flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4"
          >

            <input
              type="checkbox"
              checked={selectedHistoryContactIds.includes(
                contact.id,
              )}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedHistoryContactIds(
                    (prev) => [
                      ...prev,
                      contact.id,
                    ],
                  );
                } else {
                  setSelectedHistoryContactIds(
                    (prev) =>
                      prev.filter(
                        (id) =>
                          id !== contact.id,
                      ),
                  );
                }
              }}
            />

            <div>

              <div className="font-semibold">
                {contact.name}
              </div>

              <div className="text-sm text-gray-500">

                {contact.phone}

              </div>

              <div className="mt-1 text-xs">

                {contact.city} • {contact.zone}

              </div>

            </div>

          </label>

        ),
      )}

    </div>

  )}

</div>
  </div>
)}
      </div>
    </div>
  </div>
)}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}

function Badge({
  text,
  tone = 'gray',
}: {
  text: string;
  tone?: 'gray' | 'yellow';
}) {
  const classes =
    tone === 'yellow'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-gray-100 text-gray-700';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${classes}`}>
      {text}
    </span>
  );
}

function StatCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const toneMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
  };

  return (
    <div className={`rounded-2xl p-4 ${toneMap[tone]}`}>
      <p className="text-xs font-medium opacity-80">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
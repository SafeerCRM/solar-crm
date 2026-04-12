'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { getAuthHeaders } from '@/lib/authHeaders';
import { CallControl } from '@/lib/callControl';

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

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
  isInStorage?: boolean;
  remarks?: string;
  reviewAssignedTo?: number;
  reviewAssignedToName?: string;
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

type ImportSummary = {
  importedCount: number;
  skippedCount: number;
  totalRows: number;
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

export default function TelecallingContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [quickCallModal, setQuickCallModal] = useState<QuickCallModalState>({
    isOpen: false,
    contact: null,
  });
  const [lastCalledContact, setLastCalledContact] = useState<Contact | null>(null);
  const [quickCallSubmitting, setQuickCallSubmitting] = useState(false);
  const [quickCallNotes, setQuickCallNotes] = useState('');
  const [quickCallNextFollowUpDate, setQuickCallNextFollowUpDate] = useState('');
  const [quickCallRecordingUrl, setQuickCallRecordingUrl] = useState('');

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>(
    'info',
  );

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [assigningBulk, setAssigningBulk] = useState(false);
  const [assigningLatest, setAssigningLatest] = useState(false);
  const [checkingFilteredCount, setCheckingFilteredCount] = useState(false);
  const [convertingId, setConvertingId] = useState<number | null>(null);

  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [bulkAssignedTo, setBulkAssignedTo] = useState<string>('');
  const [latestAssignedTo, setLatestAssignedTo] = useState<string>('');
  const [assignLatestCount, setAssignLatestCount] = useState<string>('');
  const [filteredCount, setFilteredCount] = useState<number | null>(null);
  const [totalViewCount, setTotalViewCount] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  const [selectedImportFileName, setSelectedImportFileName] = useState('');
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('active');

  const [convertSliderMap, setConvertSliderMap] = useState<Record<number, number>>(
    {},
  );

  const [isAutoCalling, setIsAutoCalling] = useState(false);
  const [autoCallQueue, setAutoCallQueue] = useState<Contact[]>([]);
  const [autoCallIndex, setAutoCallIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoCallCompleted, setAutoCallCompleted] = useState(false);
  const [autoCallWaitingForSubmit, setAutoCallWaitingForSubmit] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoNextTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const isOwnerOrTelecallingManager =
    Array.isArray(currentUser?.roles)
      ? currentUser?.roles?.includes('OWNER') ||
        currentUser?.roles?.includes('TELECALLING_MANAGER')
      : currentUser?.role === 'OWNER' ||
        currentUser?.role === 'TELECALLING_MANAGER';

  useEffect(() => {
    fetchCityOptions();
  }, []);

  useEffect(() => {
    fetchContacts(page, viewMode, cityFilter);
  }, [page, viewMode, cityFilter]);

  useEffect(() => {
    if (isOwnerOrTelecallingManager) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [isOwnerOrTelecallingManager]);

  useEffect(() => {
    const openQuickCallModalAfterReturn = () => {
      setQuickCallModal((prev) => {
        if (!lastCalledContact || prev.isOpen) {
          return prev;
        }

        return {
          ...prev,
          isOpen: true,
          contact: prev.contact ?? lastCalledContact,
        };
      });
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
                if (!isCancelled && isActive) {
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
            console.error('Failed to attach Capacitor app listeners', error);
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

      const handleFocus = () => {
        openQuickCallModalAfterReturn();
      };

      window.addEventListener('focus', handleFocus);
      cleanups.push(() => window.removeEventListener('focus', handleFocus));
    }

    return () => {
      cleanups.forEach((cleanup) => {
        void cleanup();
      });
    };
  }, [lastCalledContact]);

  useEffect(() => {
    setPage(1);
    setSelectedContactIds([]);
    setFilteredCount(null);
    setTotalViewCount(null);
    setAssignLatestCount('');
    setBulkAssignedTo('');
    setLatestAssignedTo('');
  }, [viewMode]);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (autoNextTimeoutRef.current) {
        clearTimeout(autoNextTimeoutRef.current);
      }
    };
  }, []);

  const buildSliderMap = (data: Contact[]) => {
    const map: Record<number, number> = {};
    data.forEach((contact) => {
      map[contact.id] = 0;
    });
    setConvertSliderMap(map);
  };

  const showMessage = (
    text: string,
    type: 'success' | 'error' | 'info' = 'info',
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  const clearAutoCallTimers = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }
  };

  const stopAutoCall = (showStopMessage = true) => {
    clearAutoCallTimers();
    setIsAutoCalling(false);
    setAutoCallQueue([]);
    setAutoCallIndex(0);
    setCountdown(null);
    setAutoCallWaitingForSubmit(false);
    setAutoCallCompleted(false);

    if (showStopMessage) {
      showMessage('Auto call stopped.', 'info');
    }
  };

  const resetQuickCallModal = (preserveLastCalledContact = false) => {
    setQuickCallModal({
      isOpen: false,
      contact: null,
      callLogId: undefined,
    });

    if (!preserveLastCalledContact) {
      setLastCalledContact(null);
    }

    setQuickCallNotes('');
    setQuickCallNextFollowUpDate('');
    setQuickCallRecordingUrl('');
    setQuickCallSubmitting(false);
  };

  const startQuickCall = async (contact: Contact) => {
    try {
      setQuickCallSubmitting(true);

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

      const isNative =
        typeof window !== 'undefined' &&
        !!(window as any).Capacitor &&
        !!(window as any).Capacitor.isNativePlatform &&
        (window as any).Capacitor.isNativePlatform();

      if (typeof window !== 'undefined') {
        if (isNative) {
          try {
            const plugin =
              (window as any).Capacitor?.Plugins?.CallControl || CallControl;

            if (!plugin || typeof plugin.placeCall !== 'function') {
              throw new Error('CallControl plugin not found');
            }

            showMessage('Trying native direct call...', 'info');

            await plugin.placeCall({
              number: contact.phone,
            });

            showMessage('Native direct call started', 'success');
          } catch (err: any) {
            console.error('Native call failed:', err);
            showMessage(err?.message || 'Native call failed', 'error');
            return;
          }
        } else {
          window.location.href = `tel:${contact.phone}`;
        }
      }

      showMessage(
        `Call opened for ${contact.name}. After returning, choose the call outcome.`,
        'info',
      );
    } catch (err: any) {
      console.error(err);
      showMessage(
        err?.response?.data?.message || 'Failed to start quick call',
        'error',
      );
      throw err;
    } finally {
      setQuickCallSubmitting(false);
    }
  };

  const startCountdownAndTriggerNext = (nextContact: Contact) => {
    clearAutoCallTimers();
    setCountdown(3);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;

        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return null;
        }

        return prev - 1;
      });
    }, 1000);

    autoNextTimeoutRef.current = setTimeout(async () => {
      try {
        await startQuickCall(nextContact);
        setAutoCallWaitingForSubmit(true);
      } catch (error) {
        console.error('Auto next call failed', error);

        const nextIndex = autoCallIndex + 1;
        const fallbackIndex = nextIndex + 1;

        if (fallbackIndex < autoCallQueue.length) {
          setAutoCallIndex(fallbackIndex);
          startCountdownAndTriggerNext(autoCallQueue[fallbackIndex]);
        } else {
          clearAutoCallTimers();
          setIsAutoCalling(false);
          setAutoCallWaitingForSubmit(false);
          setCountdown(null);
          setAutoCallCompleted(true);
          showMessage('Auto call completed for all queued contacts.', 'success');
        }
      }
    }, 3000);
  };

  const startAutoCall = async (queue: Contact[]) => {
    if (viewMode !== 'active') {
      showMessage('Auto call works only in Active Contacts view.', 'error');
      return;
    }

    const validQueue = queue.filter((contact) => !!contact.phone?.trim());

    if (validQueue.length === 0) {
      showMessage('No filtered contacts with phone number available for auto call.', 'error');
      return;
    }

    clearAutoCallTimers();
    setIsAutoCalling(true);
    setAutoCallCompleted(false);
    setAutoCallQueue(validQueue);
    setAutoCallIndex(0);
    setCountdown(null);
    setAutoCallWaitingForSubmit(false);

    try {
      await startQuickCall(validQueue[0]);
      setAutoCallWaitingForSubmit(true);
      showMessage(
        `Auto call started for ${validQueue.length} contact(s).`,
        'success',
      );
    } catch (error) {
      console.error('Failed to start auto call', error);
      stopAutoCall(false);
      showMessage('Failed to start auto call.', 'error');
    }
  };

  const handleQuickCallModalClose = () => {
    if (isAutoCalling) {
      const shouldStop = window.confirm(
        'Auto Call is running. Closing this popup will stop auto call. Do you want to continue?',
      );

      if (!shouldStop) {
        return;
      }

      stopAutoCall(false);
      showMessage('Auto call stopped because the quick call popup was closed.', 'info');
    }

    resetQuickCallModal();
  };

  const completeQuickCall = async (disposition: QuickCallDisposition) => {
    if (!quickCallModal.contact) {
      showMessage('No contact selected for quick call', 'error');
      return;
    }

    try {
      setQuickCallSubmitting(true);

      const res = await axios.post(
        `${backendUrl}/telecalling/contacts/${quickCallModal.contact.id}/quick-call/complete`,
        {
          callLogId: quickCallModal.callLogId,
          callStatus: disposition,
          disposition,
          callNotes: quickCallNotes,
          nextFollowUpDate: quickCallNextFollowUpDate
            ? new Date(quickCallNextFollowUpDate).toISOString()
            : undefined,
          recordingUrl: quickCallRecordingUrl || undefined,
          providerName: 'TEL_LINK',
          receiverNumber: quickCallModal.contact.phone,
        },
        { headers: getAuthHeaders() },
      );

      const serverMessage =
        res.data?.message ||
        (disposition === 'INTERESTED'
          ? 'Call saved as interested'
          : 'Call saved successfully');

      showMessage(serverMessage, 'success');

      const completedContactId = quickCallModal.contact.id;
      const nextIndex = autoCallIndex + 1;
      const shouldContinueAutoCall = isAutoCalling;
      const hasNextAutoCall = shouldContinueAutoCall && nextIndex < autoCallQueue.length;

      resetQuickCallModal(shouldContinueAutoCall);
      setAutoCallWaitingForSubmit(false);
      await fetchContacts(page, viewMode, cityFilter);

      if (shouldContinueAutoCall) {
        if (hasNextAutoCall) {
          setAutoCallIndex(nextIndex);
          showMessage(
            `Call saved. Next auto call starts in 3 seconds.`,
            'info',
          );
          startCountdownAndTriggerNext(autoCallQueue[nextIndex]);
        } else {
          clearAutoCallTimers();
          setIsAutoCalling(false);
          setCountdown(null);
          setAutoCallWaitingForSubmit(false);
          setAutoCallCompleted(true);
          setLastCalledContact(null);
          showMessage('Auto call completed for all queued contacts.', 'success');
        }
        return;
      }

      if (disposition === 'INTERESTED') {
        router.push(`/telecalling/contacts/${completedContactId}`);
      }
    } catch (err: any) {
      console.error(err);
      showMessage(
        err?.response?.data?.message || 'Failed to save quick call outcome',
        'error',
      );
    } finally {
      setQuickCallSubmitting(false);
    }
  };

  const fetchContacts = async (
    pageToLoad = 1,
    mode: ViewMode = viewMode,
    locationFilter = cityFilter,
  ) => {
    setLoading(true);
    try {
      const res = await axios.get<ContactsResponse>(
        `${backendUrl}/telecalling/contacts`,
        {
          params: {
            page: pageToLoad,
            limit,
            view: mode,
            locationFilter: locationFilter || undefined,
          },
          headers: getAuthHeaders(),
        },
      );

      const responseData = res.data;

      if (Array.isArray(responseData)) {
        setContacts(responseData);
        setTotalPages(1);
        buildSliderMap(responseData);
      } else {
        const list = Array.isArray(responseData?.data) ? responseData.data : [];
        setContacts(list);
        setTotalPages(responseData?.totalPages || 1);
        buildSliderMap(list);
      }

      setSelectedContactIds([]);
    } catch (err: any) {
      console.error(err);
      showMessage(
        err?.response?.data?.message || 'Failed to fetch contacts',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCityOptions = async () => {
    try {
      const res = await axios.get(`${backendUrl}/telecalling/contacts/filter-options`, {
        headers: getAuthHeaders(),
      });

      setCityOptions(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error(err);
      setCityOptions([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/users/assignable-staff`, {
        headers: getAuthHeaders(),
      });

      const telecallers = (Array.isArray(res.data) ? res.data : []).filter(
        (u: User) =>
          Array.isArray(u.roles)
            ? u.roles.includes('TELECALLER')
            : u.role === 'TELECALLER',
      );

      setUsers(telecallers);
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status !== 403) {
        showMessage(
          err?.response?.data?.message || 'Failed to fetch users',
          'error',
        );
      }
      setUsers([]);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isAllowed =
      fileName.endsWith('.csv') ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls');

    setSelectedImportFileName(file.name);
    setImportSummary(null);

    if (!isAllowed) {
      showMessage('Please upload only CSV, XLSX, or XLS file', 'error');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedImportFileName('');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setImporting(true);
      showMessage(
        'Import started. Contacts will go to Storage. Please wait until it finishes.',
        'info',
      );

      const res = await axios.post(
        `${backendUrl}/telecalling/contacts/import`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const importedCount = Number(res.data?.importedCount || 0);
      const skippedCount = Number(res.data?.skippedCount || 0);
      const totalRows = Number(res.data?.totalRows || 0);

      setImportSummary({
        importedCount,
        skippedCount,
        totalRows,
      });

      showMessage(
        `Import completed successfully. Imported: ${importedCount}, Skipped: ${skippedCount}, Total Rows: ${totalRows}. Imported contacts are now available in Storage.`,
        'success',
      );

      await fetchCityOptions();
      setPage(1);
      setViewMode('storage');
      await fetchContacts(1, 'storage', cityFilter);
    } catch (err: any) {
      console.error(err);
      setImportSummary(null);
      showMessage(
        err?.response?.data?.message ||
          'Import failed. Please check file format and required columns.',
        'error',
      );
    } finally {
      setImporting(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setSelectedImportFileName('');
    }
  };

  const assignSingleContact = async (id: number, userId: number) => {
    if (!userId) return;

    try {
      await axios.patch(
        `${backendUrl}/telecalling/contacts/${id}/assign`,
        { assignedTo: userId },
        { headers: getAuthHeaders() },
      );

      showMessage(
        viewMode === 'storage'
          ? 'Assigned successfully. Contact moved from Storage to Active.'
          : 'Assigned successfully.',
        'success',
      );
      await fetchContacts(page, viewMode, cityFilter);
      await handleCheckFilteredCount(false);
    } catch (err: any) {
      console.error(err);
      showMessage(err?.response?.data?.message || 'Assignment failed', 'error');
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignedTo) {
      showMessage('Please select a telecaller for bulk assign', 'error');
      return;
    }

    if (selectedContactIds.length === 0) {
      showMessage('Please select at least one contact', 'error');
      return;
    }

    try {
      setAssigningBulk(true);

      await axios.patch(
        `${backendUrl}/telecalling/contacts/bulk-assign`,
        {
          contactIds: selectedContactIds,
          assignedTo: Number(bulkAssignedTo),
        },
        { headers: getAuthHeaders() },
      );

      showMessage(
        `Assigned ${selectedContactIds.length} selected contact(s) successfully`,
        'success',
      );
      setSelectedContactIds([]);
      setBulkAssignedTo('');
      await fetchContacts(page, viewMode, cityFilter);
      await handleCheckFilteredCount(false);
    } catch (err: any) {
      console.error(err);
      showMessage(err?.response?.data?.message || 'Bulk assign failed', 'error');
    } finally {
      setAssigningBulk(false);
    }
  };

  const handleCheckFilteredCount = async (showSuccess = true) => {
    try {
      setCheckingFilteredCount(true);

      const res = await axios.get(
        `${backendUrl}/telecalling/contacts/filter-count`,
        {
          params: {
            locationFilter: cityFilter || undefined,
            view: viewMode,
          },
          headers: getAuthHeaders(),
        },
      );

      setTotalViewCount(Number(res.data?.totalCount || 0));
      setFilteredCount(Number(res.data?.filteredCount || 0));

      setPage(1);
      await fetchContacts(1, viewMode, cityFilter);

      if (showSuccess) {
        showMessage(
          `Filtered ${viewMode === 'storage' ? 'storage' : 'active'} count loaded and matching contacts shown successfully`,
          'success',
        );
      }
    } catch (err: any) {
      console.error(err);
      setTotalViewCount(null);
      setFilteredCount(null);
      showMessage(
        err?.response?.data?.message || 'Failed to load filtered contact count',
        'error',
      );
    } finally {
      setCheckingFilteredCount(false);
    }
  };

  const handleAssignLatest = async () => {
    if (!cityFilter.trim()) {
      showMessage('Please select or type city / area / location first', 'error');
      return;
    }

    if (!assignLatestCount || Number(assignLatestCount) <= 0) {
      showMessage('Please enter a valid number of contacts to assign', 'error');
      return;
    }

    if (!latestAssignedTo) {
      showMessage('Please select a telecaller for assignment', 'error');
      return;
    }

    try {
      setAssigningLatest(true);

      const res = await axios.patch(
        `${backendUrl}/telecalling/contacts/assign-latest`,
        {
          locationFilter: cityFilter,
          assignCount: Number(assignLatestCount),
          assignedTo: Number(latestAssignedTo),
          view: viewMode,
        },
        { headers: getAuthHeaders() },
      );

      showMessage(
        viewMode === 'storage'
          ? `Assigned latest ${res.data?.updatedCount || 0} filtered storage contact(s) successfully`
          : `Reassigned latest ${res.data?.updatedCount || 0} filtered active contact(s) successfully`,
        'success',
      );

      await fetchContacts(page, viewMode, cityFilter);
      await handleCheckFilteredCount(false);
      setAssignLatestCount('');
      setLatestAssignedTo('');
    } catch (err: any) {
      console.error(err);
      showMessage(
        err?.response?.data?.message || 'Assign filtered contacts failed',
        'error',
      );
    } finally {
      setAssigningLatest(false);
    }
  };

  const convertToLead = async (id: number) => {
    try {
      setConvertingId(id);

      await axios.post(
        `${backendUrl}/telecalling/contacts/${id}/convert`,
        {},
        { headers: getAuthHeaders() },
      );

      showMessage('Converted to lead', 'success');
      setConvertSliderMap((prev) => ({
        ...prev,
        [id]: 0,
      }));
      await fetchContacts(page, viewMode, cityFilter);
    } catch (err: any) {
      console.error(err);
      showMessage(err?.response?.data?.message || 'Conversion failed', 'error');
      setConvertSliderMap((prev) => ({
        ...prev,
        [id]: 0,
      }));
    } finally {
      setConvertingId(null);
    }
  };

  const handleConvertSliderChange = async (id: number, value: number) => {
    setConvertSliderMap((prev) => ({
      ...prev,
      [id]: value,
    }));

    if (value >= 100 && convertingId !== id) {
      await convertToLead(id);
    }
  };

  const resetConvertSlider = (id: number, isAlreadyConverted?: boolean) => {
    if (isAlreadyConverted || convertingId === id) return;

    setConvertSliderMap((prev) => ({
      ...prev,
      [id]: 0,
    }));
  };

  const handleClearFilters = () => {
    setNameFilter('');
    setPhoneFilter('');
    setCityFilter('');
    setCitySearch('');
    setSelectedContactIds([]);
    setFilteredCount(null);
    setTotalViewCount(null);
    setAssignLatestCount('');
    setPage(1);
  };

  const visibleCityOptions = useMemo(() => {
    const normalizedSearch = citySearch.trim().toLowerCase();
    if (!normalizedSearch) {
      return cityOptions;
    }

    return cityOptions.filter((option) =>
      option.toLowerCase().includes(normalizedSearch),
    );
  }, [cityOptions, citySearch]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesName =
        !nameFilter.trim() ||
        (contact.name || '')
          .toLowerCase()
          .includes(nameFilter.trim().toLowerCase());

      const matchesPhone =
        !phoneFilter.trim() ||
        (contact.phone || '')
          .toLowerCase()
          .includes(phoneFilter.trim().toLowerCase());

      return matchesName && matchesPhone;
    });
  }, [contacts, nameFilter, phoneFilter]);

  const filteredIds = useMemo(
    () => filteredContacts.map((c) => c.id),
    [filteredContacts],
  );

  const autoCallableContacts = useMemo(() => {
    if (viewMode !== 'active') return [];
    return filteredContacts.filter((contact) => !!contact.phone?.trim());
  }, [filteredContacts, viewMode]);

  const allFilteredSelected =
    filteredIds.length > 0 &&
    filteredIds.every((id) => selectedContactIds.includes(id));

  const someFilteredSelected =
    filteredIds.some((id) => selectedContactIds.includes(id)) &&
    !allFilteredSelected;

  const toggleSingleSelection = (id: number, checked: boolean) => {
    setSelectedContactIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedContactIds((prev) => {
      const set = new Set(prev);
      filteredIds.forEach((id) => set.add(id));
      return Array.from(set);
    });
  };

  const handleSelectNone = () => {
    setSelectedContactIds([]);
  };

  const handleHeaderCheckboxChange = (checked: boolean) => {
    if (checked) {
      handleSelectAllFiltered();
    } else {
      handleSelectNone();
    }
  };

  const handlePrevious = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const messageClassName =
    messageType === 'success'
      ? 'mb-3 rounded border border-green-300 bg-green-50 px-3 py-2 text-green-700'
      : messageType === 'error'
      ? 'mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700'
      : 'mb-3 rounded border border-blue-300 bg-blue-50 px-3 py-2 text-blue-700';

  const viewLabel = viewMode === 'storage' ? 'Storage Contacts' : 'Active Contacts';
  const countButtonLabel =
    viewMode === 'storage'
      ? 'Check Filtered Storage Count'
      : 'Check Filtered Active Count';
  const totalLabel =
    viewMode === 'storage' ? 'Total in storage' : 'Total active contacts';
  const filteredLabel =
    viewMode === 'storage'
      ? 'Matching filtered storage'
      : 'Matching filtered active';
  const assignSectionTitle =
    viewMode === 'storage'
      ? 'Assign Filtered Storage Contacts'
      : 'Assign Filtered Active Contacts';
  const assignSectionDescription =
    viewMode === 'storage'
      ? 'Use city / area / location tools below, check matching count, then assign any number of filtered storage contacts to a telecaller.'
      : 'Use city / area / location tools below, check matching count, then reassign any number of filtered active contacts to a telecaller.';
  const assignButtonLabel =
    viewMode === 'storage' ? 'Assign Filtered N' : 'Reassign Filtered N';

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Telecalling Contacts</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/telecalling"
          className="rounded bg-gray-500 px-4 py-2 text-white"
        >
          Back
        </Link>
      </div>

      {isOwnerOrTelecallingManager && (
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setViewMode('active');
              setPage(1);
              setSelectedContactIds([]);
            }}
            className={`rounded px-4 py-2 ${
              viewMode === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-black'
            }`}
          >
            Active Contacts
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('storage');
              setPage(1);
              setSelectedContactIds([]);
            }}
            className={`rounded px-4 py-2 ${
              viewMode === 'storage'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-black'
            }`}
          >
            Storage
          </button>
        </div>
      )}

      <div className="mb-5 rounded border bg-white p-4">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Import Contacts</h2>
            <p className="text-sm text-gray-600">
              Upload CSV or Excel file with contact data for telecalling.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center rounded bg-blue-600 px-4 py-2 text-white">
            {importing ? 'Importing...' : 'Choose CSV / Excel File'}
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

        <div className="mb-3 rounded bg-gray-50 p-3 text-sm text-gray-700">
          <p className="font-medium">Required columns</p>
          <p>Name, Phone / Call / Phone Number, City</p>
          <p className="mt-2 font-medium">Accepted formats</p>
          <p>.csv, .xlsx, .xls</p>
        </div>

        {selectedImportFileName && (
          <div className="mb-3 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            Selected file:{' '}
            <span className="font-medium">{selectedImportFileName}</span>
          </div>
        )}

        {importing && (
          <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-3">
            <p className="font-medium text-blue-700">Import in progress...</p>
            <p className="mt-1 text-sm text-blue-700">
              Large files may take some time. Please do not refresh or close this
              page.
            </p>
          </div>
        )}

        {importSummary && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded border bg-green-50 p-3">
              <p className="text-sm text-gray-600">Imported</p>
              <p className="text-xl font-semibold text-green-700">
                {importSummary.importedCount}
              </p>
            </div>

            <div className="rounded border bg-yellow-50 p-3">
              <p className="text-sm text-gray-600">Skipped</p>
              <p className="text-xl font-semibold text-yellow-700">
                {importSummary.skippedCount}
              </p>
            </div>

            <div className="rounded border bg-blue-50 p-3">
              <p className="text-sm text-gray-600">Total Rows</p>
              <p className="text-xl font-semibold text-blue-700">
                {importSummary.totalRows}
              </p>
            </div>
          </div>
        )}
      </div>

      {message && <div className={messageClassName}>{message}</div>}

      <div className="mb-3 rounded border bg-gray-50 p-3 text-sm text-gray-700">
        <span className="font-medium">Current View: </span>
        {viewMode === 'storage'
          ? 'Storage (warehouse contacts not yet active)'
          : 'Active Contacts (working pool for telecalling)'}
      </div>

      <div className="mb-4 rounded border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">{viewLabel} Filters</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <input
            type="text"
            placeholder="Search by name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="rounded border p-2"
          />

          <input
            type="text"
            placeholder="Search by phone"
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
            className="rounded border p-2"
          />

          <input
            type="text"
            placeholder="Type to search city / area / location options"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            className="rounded border p-2"
          />

          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(1);
              setCitySearch('');
            }}
            onFocus={() => setCitySearch('')}
            className="rounded border p-2"
          >
            <option value="">Select city / area / location</option>
            {visibleCityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            onClick={handleClearFilters}
            className="rounded bg-gray-200 px-4 py-2"
          >
            Clear Filters
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Or type city / area / location manually and use count / assign tools"
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(1);
            }}
            className="rounded border p-2"
          />

          <button
            type="button"
            onClick={() => handleCheckFilteredCount(true)}
            disabled={checkingFilteredCount}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {checkingFilteredCount ? 'Checking...' : countButtonLabel}
          </button>
        </div>
      </div>

      {viewMode === 'active' && (
        <div className="mb-4 rounded border bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Auto Call System</h2>
              <p className="text-sm text-gray-600">
                Auto call uses the currently visible filtered active contacts with phone numbers.
              </p>
            </div>

            {!isAutoCalling ? (
              <button
                type="button"
                onClick={() => startAutoCall(autoCallableContacts)}
                disabled={quickCallSubmitting || autoCallableContacts.length === 0}
                className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
              >
                Auto Call
              </button>
            ) : (
              <button
                type="button"
                onClick={() => stopAutoCall(true)}
                className="rounded bg-red-600 px-4 py-2 text-white"
              >
                Stop Auto Call
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-700">
            <span>
              Filtered callable contacts:{' '}
              <span className="font-semibold">{autoCallableContacts.length}</span>
            </span>

            {isAutoCalling && (
              <>
                <span>
                  Current position:{' '}
                  <span className="font-semibold">
                    {Math.min(autoCallIndex + 1, autoCallQueue.length)} / {autoCallQueue.length}
                  </span>
                </span>

                {countdown !== null && (
                  <span>
                    Next call in:{' '}
                    <span className="font-semibold">{countdown}s</span>
                  </span>
                )}

                {autoCallWaitingForSubmit && (
                  <span className="font-semibold text-blue-700">
                    Waiting for call outcome submit
                  </span>
                )}
              </>
            )}
          </div>

          {autoCallCompleted && !isAutoCalling && (
            <div className="mt-3 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
              Auto call completed for all queued contacts.
            </div>
          )}
        </div>
      )}

      {isOwnerOrTelecallingManager && (
        <div className="mb-4 rounded border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">{assignSectionTitle}</h2>
          <p className="mb-3 text-sm text-gray-600">{assignSectionDescription}</p>

          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="text-sm text-gray-700">
              {totalLabel}:{' '}
              <span className="font-semibold">{totalViewCount ?? '-'}</span>
            </div>

            <div className="text-sm text-gray-700">
              {filteredLabel}:{' '}
              <span className="font-semibold">{filteredCount ?? '-'}</span>
            </div>

            <div className="text-sm text-gray-700">
              Visible after filter: <span className="font-semibold">{filteredContacts.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="number"
              min="1"
              placeholder="Enter number of filtered contacts to assign"
              value={assignLatestCount}
              onChange={(e) => setAssignLatestCount(e.target.value)}
              className="rounded border p-2"
            />

            <select
              value={latestAssignedTo}
              onChange={(e) => setLatestAssignedTo(e.target.value)}
              className="rounded border p-2"
            >
              <option value="">Select telecaller</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                  {u.email ? ` (${u.email})` : ''}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleAssignLatest}
              disabled={assigningLatest}
              className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {assigningLatest ? 'Assigning...' : assignButtonLabel}
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 rounded border p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="rounded bg-gray-200 px-3 py-2"
            >
              Select All
            </button>

            <button
              type="button"
              onClick={handleSelectNone}
              className="rounded bg-gray-200 px-3 py-2"
            >
              Select None
            </button>

            <span className="text-sm text-gray-600">
              Selected: {selectedContactIds.length}
            </span>

            <span className="text-sm text-gray-600">
              Visible after filter: {filteredContacts.length}
            </span>
          </div>

          {isOwnerOrTelecallingManager && (
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <select
                value={bulkAssignedTo}
                onChange={(e) => setBulkAssignedTo(e.target.value)}
                className="rounded border p-2"
              >
                <option value="">Select telecaller to assign</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                    {u.email ? ` (${u.email})` : ''}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleBulkAssign}
                disabled={
                  assigningBulk ||
                  selectedContactIds.length === 0 ||
                  !bulkAssignedTo
                }
                className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {assigningBulk ? 'Assigning...' : 'Assign Selected'}
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someFilteredSelected;
                    }}
                    onChange={(e) => handleHeaderCheckboxChange(e.target.checked)}
                  />
                </th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Phone</th>
                <th className="border p-2">City</th>
                <th className="border p-2">K.No</th>
                <th className="border p-2">Imported By</th>
                <th className="border p-2">Assigned</th>
                <th className="border p-2">Assign</th>

                {viewMode === 'active' && (
                  <>
                    <th className="border p-2">Quick Call</th>
                    <th className="border p-2">Open</th>
                    <th className="border p-2">Convert</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {filteredContacts.map((c) => (
                <tr key={c.id}>
                  <td className="border p-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedContactIds.includes(c.id)}
                      onChange={(e) => toggleSingleSelection(c.id, e.target.checked)}
                    />
                  </td>

                  <td className="border p-2">{c.name}</td>
                  <td className="border p-2">{c.phone}</td>
                  <td className="border p-2">
                    {c.city || c.address || c.location || ''}
                  </td>
                  <td className="border p-2">{c.kNo || ''}</td>
                  <td className="border p-2">{c.importedByName || ''}</td>
                  <td className="border p-2">{c.assignedToName || 'Unassigned'}</td>

                  <td className="border p-2">
                    {isOwnerOrTelecallingManager ? (
                      <select
                        onChange={(e) =>
                          assignSingleContact(c.id, Number(e.target.value))
                        }
                        className="border p-1"
                        defaultValue=""
                      >
                        <option value="">Assign</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                            {u.email ? ` (${u.email})` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>

                  {viewMode === 'active' && (
                    <>
                      <td className="border p-2">
                        {c.phone ? (
                          <button
                            type="button"
                            onClick={() => startQuickCall(c)}
                            disabled={quickCallSubmitting || isAutoCalling}
                            className="rounded bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                          >
                            {quickCallSubmitting &&
                            quickCallModal.contact?.id === c.id
                              ? 'Calling...'
                              : 'Call Now'}
                          </button>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>

                      <td className="border p-2">
                        <Link
                          href={`/telecalling/contacts/${c.id}`}
                          className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
                        >
                          Open
                        </Link>
                      </td>

                      <td className="border p-2 min-w-[260px]">
                        {c.convertedToLead ? (
                          <span className="font-medium text-green-600">
                            Converted
                          </span>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-gray-700">
                              Drag to convert
                            </span>

                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={1}
                              value={convertSliderMap[c.id] || 0}
                              onChange={(e) =>
                                handleConvertSliderChange(c.id, Number(e.target.value))
                              }
                              onMouseUp={() =>
                                resetConvertSlider(c.id, c.convertedToLead)
                              }
                              onTouchEnd={() =>
                                resetConvertSlider(c.id, c.convertedToLead)
                              }
                              disabled={convertingId === c.id}
                              className="h-4 w-full cursor-pointer accent-blue-600"
                            />

                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>Drag</span>
                              <span>
                                {convertingId === c.id
                                  ? 'Converting...'
                                  : `${convertSliderMap[c.id] || 0}%`}
                              </span>
                              <span>Convert</span>
                            </div>
                          </div>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {filteredContacts.length === 0 && (
                <tr>
                  <td
                    colSpan={viewMode === 'active' ? 11 : 8}
                    className="border p-4 text-center text-gray-500"
                  >
                    No contacts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={page <= 1}
              className="rounded bg-gray-500 px-4 py-2 text-white disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={handleNext}
              disabled={page >= totalPages}
              className="rounded bg-gray-500 px-4 py-2 text-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {quickCallModal.isOpen && quickCallModal.contact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Quick Call Outcome</h2>
                <p className="text-sm text-gray-600">
                  {quickCallModal.contact.name} ({quickCallModal.contact.phone})
                </p>
                {isAutoCalling && (
                  <p className="mt-1 text-xs font-medium text-blue-700">
                    Auto Call running: {Math.min(autoCallIndex + 1, autoCallQueue.length)} / {autoCallQueue.length}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleQuickCallModalClose}
                className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700"
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
                className="rounded border p-3 md:col-span-2"
              />

              <input
                type="datetime-local"
                value={quickCallNextFollowUpDate}
                onChange={(e) => setQuickCallNextFollowUpDate(e.target.value)}
                className="rounded border p-3"
              />

              <input
                type="text"
                value={quickCallRecordingUrl}
                onChange={(e) => setQuickCallRecordingUrl(e.target.value)}
                placeholder="Recording URL (optional for now)"
                className="rounded border p-3"
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <button
                type="button"
                onClick={() => completeQuickCall('INTERESTED')}
                disabled={quickCallSubmitting}
                className="rounded bg-green-600 px-4 py-3 font-medium text-white disabled:opacity-50"
              >
                {quickCallSubmitting ? 'Saving...' : 'Interested'}
              </button>

              <button
                type="button"
                onClick={() => completeQuickCall('NOT_INTERESTED')}
                disabled={quickCallSubmitting}
                className="rounded bg-red-600 px-4 py-3 font-medium text-white disabled:opacity-50"
              >
                {quickCallSubmitting ? 'Saving...' : 'Not Interested'}
              </button>

              <button
                type="button"
                onClick={() => completeQuickCall('CALLBACK')}
                disabled={quickCallSubmitting}
                className="rounded bg-yellow-600 px-4 py-3 font-medium text-white disabled:opacity-50"
              >
                {quickCallSubmitting ? 'Saving...' : 'Callback'}
              </button>

              <button
                type="button"
                onClick={() => completeQuickCall('CNR')}
                disabled={quickCallSubmitting}
                className="rounded bg-gray-800 px-4 py-3 font-medium text-white disabled:opacity-50"
              >
                {quickCallSubmitting ? 'Saving...' : 'CNR / No Response'}
              </button>

              <button
                type="button"
                onClick={() => completeQuickCall('PROPOSAL_SENT')}
                disabled={quickCallSubmitting}
                className="rounded bg-blue-700 px-4 py-3 font-medium text-white disabled:opacity-50"
              >
                {quickCallSubmitting ? 'Saving...' : 'Proposal Sent'}
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Interested will open the contact detail page so the telecaller can
              continue notes, follow-up, and lead conversion. Other outcomes will
              save the call and keep the contact safely in the system for future work.
            </p>

            {isAutoCalling && (
              <p className="mt-2 text-xs text-blue-700">
                In Auto Call mode, after saving this outcome the next call will begin automatically.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
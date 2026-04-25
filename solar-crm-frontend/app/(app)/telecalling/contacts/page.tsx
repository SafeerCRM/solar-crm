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

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const roles = getUserRoles(currentUser);
  const isOwnerOrTelecallingManager =
    roles.includes('OWNER') || roles.includes('TELECALLING_MANAGER');

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
      if (!isOwnerOrTelecallingManager) {
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
        `${backendUrl}/telecalling/contacts`,
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

  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, viewMode, cityFilter]);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnerOrTelecallingManager]);

  useEffect(() => {
    return () => {
      clearAutoTimers();
    };
  }, []);

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
        const startQuickCall = async (contact: Contact) => {
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
    } catch (err) {
      console.error(err);
      setMessage('Failed to start call');
      setCallInitiated(false);
      setHasLeftAppForCall(false);
    }
  };

    const startCountdownThenCall = (nextContact: Contact) => {
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
      await startQuickCall(nextContact);
    }, 3000);
  };

    const callNextContact = async () => {
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
        setMessage('Auto call completed.');
        return prevIndex;
      }

      const nextContact = autoCallQueue[nextIndex];

      if (nextContact) {
        startCountdownThenCall(nextContact);
      }

      return nextIndex;
    });
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

      if (isAutoCalling && !isPaused) {
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
              onClick={fetchContacts}
              className="rounded-2xl bg-blue-600 px-4 py-3 font-medium text-white"
            >
              Apply
            </button>

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
                    onClick={() => startQuickCall(c)}
                    className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
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
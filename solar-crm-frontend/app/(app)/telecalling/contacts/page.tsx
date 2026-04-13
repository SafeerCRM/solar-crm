'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Capacitor } from '@capacitor/core';
import { getAuthHeaders } from '@/lib/authHeaders';
import { CallControl } from '@/lib/callControl';

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

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('active');

  const [isAutoCalling, setIsAutoCalling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoCallQueue, setAutoCallQueue] = useState<Contact[]>([]);
  const [autoCallIndex, setAutoCallIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);

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
      } else {
        setContacts(Array.isArray(responseData?.data) ? responseData.data : []);
        setTotalPages(responseData?.totalPages || 1);
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

  const startQuickCall = async (contact: Contact) => {
    try {
      await axios.post(
        `${backendUrl}/telecalling/contacts/${contact.id}/quick-call/start`,
        {
          providerName: 'TEL_LINK',
          receiverNumber: contact.phone,
        },
        { headers: getAuthHeaders() },
      );

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

    const nextIndex = autoCallIndex + 1;

    if (nextIndex >= autoCallQueue.length) {
      stopAutoCall();
      setMessage('Auto call completed.');
      return;
    }

    setAutoCallIndex(nextIndex);
    await startCountdownThenCall(autoCallQueue[nextIndex]);
  };

  const startAutoCall = async () => {
    try {
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

      setIsAutoCalling(true);
      setIsPaused(false);
      setAutoCallQueue(validQueue);
      setAutoCallIndex(0);
      setCountdown(0);

      await startQuickCall(validQueue[0]);
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
    await callNextContact();
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
            <StatCard
              title="Visible Contacts"
              value={filteredContacts.length}
              tone="blue"
            />
            <StatCard
              title="Selected"
              value={selectedContactIds.length}
              tone="green"
            />
            <StatCard
              title="Current Page"
              value={page}
              tone="purple"
            />
            <StatCard
              title="Total Pages"
              value={totalPages}
              tone="orange"
            />
          </div>
        </div>

        {message ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 shadow-sm">
            {message}
          </div>
        ) : null}

        <div className="rounded-3xl bg-white p-4 shadow">
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
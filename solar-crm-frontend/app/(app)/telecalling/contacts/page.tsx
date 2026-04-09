'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { getAuthHeaders } from '@/lib/authHeaders';

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

export default function TelecallingContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>(
    'info'
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
  const [filteredStorageCount, setFilteredStorageCount] = useState<number | null>(null);
  const [storageTotalCount, setStorageTotalCount] = useState<number | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  const [selectedImportFileName, setSelectedImportFileName] = useState('');
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('active');

  const [convertSliderMap, setConvertSliderMap] = useState<Record<number, number>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const isTelecaller =
    Array.isArray(currentUser?.roles)
      ? currentUser?.roles?.includes('TELECALLER')
      : currentUser?.role === 'TELECALLER';

  useEffect(() => {
    fetchContacts(page, viewMode);
  }, [page, viewMode]);

  useEffect(() => {
    if (isOwnerOrTelecallingManager) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [isOwnerOrTelecallingManager]);

  const buildSliderMap = (data: Contact[]) => {
    const map: Record<number, number> = {};
    data.forEach((contact) => {
      map[contact.id] = 0;
    });
    setConvertSliderMap(map);
  };

  const showMessage = (
    text: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  const fetchContacts = async (pageToLoad = 1, mode: ViewMode = viewMode) => {
    setLoading(true);
    try {
      const res = await axios.get<ContactsResponse>(
        `${backendUrl}/telecalling/contacts`,
        {
          params: { page: pageToLoad, limit, view: mode },
          headers: getAuthHeaders(),
        }
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
      showMessage(err?.response?.data?.message || 'Failed to fetch contacts', 'error');
    } finally {
      setLoading(false);
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
            : u.role === 'TELECALLER'
      );

      setUsers(telecallers);
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status !== 403) {
        showMessage(
          err?.response?.data?.message || 'Failed to fetch users',
          'error'
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
        'info'
      );

      const res = await axios.post(
        `${backendUrl}/telecalling/contacts/import`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data',
          },
        }
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
        'success'
      );

      setPage(1);
      setViewMode('storage');
      await fetchContacts(1, 'storage');
    } catch (err: any) {
      console.error(err);
      setImportSummary(null);
      showMessage(
        err?.response?.data?.message ||
          'Import failed. Please check file format and required columns.',
        'error'
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
        { headers: getAuthHeaders() }
      );

      showMessage('Assigned successfully. Contact moved from Storage to Active.', 'success');
      await fetchContacts(page, viewMode);
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
        { headers: getAuthHeaders() }
      );

      showMessage(
        `Assigned ${selectedContactIds.length} selected contact(s) successfully`,
        'success'
      );
      setSelectedContactIds([]);
      setBulkAssignedTo('');
      await fetchContacts(page, viewMode);
      if (viewMode === 'storage') {
        await handleCheckFilteredStorageCount();
      }
    } catch (err: any) {
      console.error(err);
      showMessage(err?.response?.data?.message || 'Bulk assign failed', 'error');
    } finally {
      setAssigningBulk(false);
    }
  };

  const handleCheckFilteredStorageCount = async () => {
    if (!cityFilter.trim()) {
      showMessage(
        'Please enter city / address / location filter first',
        'error'
      );
      return;
    }

    try {
      setCheckingFilteredCount(true);

      const res = await axios.get(
        `${backendUrl}/telecalling/contacts/filter-count`,
        {
          params: {
            locationFilter: cityFilter,
          },
          headers: getAuthHeaders(),
        }
      );

      setStorageTotalCount(Number(res.data?.totalCount || 0));
      setFilteredStorageCount(Number(res.data?.filteredCount || 0));

      showMessage('Filtered storage count loaded successfully', 'success');
    } catch (err: any) {
      console.error(err);
      setStorageTotalCount(null);
      setFilteredStorageCount(null);
      showMessage(
        err?.response?.data?.message || 'Failed to load filtered storage count',
        'error'
      );
    } finally {
      setCheckingFilteredCount(false);
    }
  };

  const handleAssignLatest = async () => {
    if (!cityFilter.trim()) {
      showMessage(
        'Please enter city / address / location filter first',
        'error'
      );
      return;
    }

    if (!assignLatestCount || Number(assignLatestCount) <= 0) {
      showMessage('Please enter a valid number of contacts to assign', 'error');
      return;
    }

    if (!latestAssignedTo) {
      showMessage('Please select a telecaller for latest assignment', 'error');
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
        },
        { headers: getAuthHeaders() }
      );

      showMessage(
        `Assigned latest ${res.data?.updatedCount || 0} contact(s) successfully from filtered storage`,
        'success'
      );

      await fetchContacts(page, viewMode);
      await handleCheckFilteredStorageCount();
      setAssignLatestCount('');
      setLatestAssignedTo('');
    } catch (err: any) {
      console.error(err);
      showMessage(
        err?.response?.data?.message || 'Assign latest contacts failed',
        'error'
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
        { headers: getAuthHeaders() }
      );

      showMessage('Converted to lead', 'success');
      setConvertSliderMap((prev) => ({
        ...prev,
        [id]: 0,
      }));
      await fetchContacts(page, viewMode);
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
    setSelectedContactIds([]);
    setFilteredStorageCount(null);
    setStorageTotalCount(null);
    setAssignLatestCount('');
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesName =
        !nameFilter.trim() ||
        (contact.name || '').toLowerCase().includes(nameFilter.trim().toLowerCase());

      const matchesPhone =
        !phoneFilter.trim() ||
        (contact.phone || '').toLowerCase().includes(phoneFilter.trim().toLowerCase());

      const cityText = contact.city || contact.address || contact.location || '';

      const matchesCity =
        !cityFilter.trim() ||
        cityText.toLowerCase().includes(cityFilter.trim().toLowerCase());

      return matchesName && matchesPhone && matchesCity;
    });
  }, [contacts, nameFilter, phoneFilter, cityFilter]);

  const filteredIds = useMemo(() => filteredContacts.map((c) => c.id), [filteredContacts]);

  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedContactIds.includes(id));

  const someFilteredSelected =
    filteredIds.some((id) => selectedContactIds.includes(id)) && !allFilteredSelected;

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
            Selected file: <span className="font-medium">{selectedImportFileName}</span>
          </div>
        )}

        {importing && (
          <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-3">
            <p className="font-medium text-blue-700">Import in progress...</p>
            <p className="mt-1 text-sm text-blue-700">
              Large files may take some time. Please do not refresh or close this page.
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

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
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
          placeholder="Search by city / address / location"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded border p-2"
        />

        <button
          onClick={handleClearFilters}
          className="rounded bg-gray-200 px-4 py-2"
        >
          Clear Filters
        </button>
      </div>

      {isOwnerOrTelecallingManager && viewMode === 'storage' && (
        <div className="mb-4 rounded border bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">
            Assign Latest Contacts from Filtered Storage
          </h2>
          <p className="mb-3 text-sm text-gray-600">
            Use the city / address / location filter above, check how many contacts
            are available in storage, then assign the latest N contacts to a telecaller.
          </p>

          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center">
            <button
              type="button"
              onClick={handleCheckFilteredStorageCount}
              disabled={checkingFilteredCount}
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {checkingFilteredCount ? 'Checking...' : 'Check Filtered Storage Count'}
            </button>

            <div className="text-sm text-gray-700">
              Total in storage: <span className="font-semibold">{storageTotalCount ?? '-'}</span>
            </div>

            <div className="text-sm text-gray-700">
              Matching current location filter: <span className="font-semibold">{filteredStorageCount ?? '-'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="number"
              min="1"
              placeholder="Enter number of latest contacts to assign"
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
              {assigningLatest ? 'Assigning...' : 'Assign Latest N'}
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
                disabled={assigningBulk || selectedContactIds.length === 0 || !bulkAssignedTo}
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
                <th className="border p-2">Open</th>
                <th className="border p-2">Convert</th>
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
                  <td className="border p-2">{c.city || c.address || c.location || ''}</td>
                  <td className="border p-2">{c.kNo || ''}</td>
                  <td className="border p-2">{c.importedByName || ''}</td>
                  <td className="border p-2">{c.assignedToName || 'Unassigned'}</td>

                  <td className="border p-2">
                    {isOwnerOrTelecallingManager ? (
                      <select
                        onChange={(e) => assignSingleContact(c.id, Number(e.target.value))}
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

                  <td className="border p-2">
                    {(viewMode === 'active' || isTelecaller) ? (
                      <Link
                        href={`/telecalling/contacts/${c.id}`}
                        className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
                      >
                        Open
                      </Link>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>

                  <td className="border p-2 min-w-[220px]">
                    {viewMode === 'storage' ? (
                      <span className="text-gray-500">Storage</span>
                    ) : c.convertedToLead ? (
                      <span className="font-medium text-green-600">Converted</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-600">
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
                          onMouseUp={() => resetConvertSlider(c.id, c.convertedToLead)}
                          onTouchEnd={() => resetConvertSlider(c.id, c.convertedToLead)}
                          disabled={convertingId === c.id}
                          className="w-full"
                        />
                        <div className="flex items-center justify-between text-xs text-gray-500">
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
                </tr>
              ))}

              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={10} className="border p-4 text-center text-gray-500">
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
    </div>
  );
}
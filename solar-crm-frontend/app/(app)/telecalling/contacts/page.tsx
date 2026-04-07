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
};

type User = {
  id: number;
  name: string;
  email?: string;
  roles: string[];
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

export default function TelecallingContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [assigningBulk, setAssigningBulk] = useState(false);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [convertToggleMap, setConvertToggleMap] = useState<Record<number, boolean>>({});
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [bulkAssignedTo, setBulkAssignedTo] = useState<string>('');

  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchContacts(page);
    fetchUsers();
  }, [page]);

  const buildToggleMap = (data: Contact[]) => {
    const map: Record<number, boolean> = {};
    data.forEach((contact) => {
      map[contact.id] = false;
    });
    setConvertToggleMap(map);
  };

  const fetchContacts = async (pageToLoad = 1) => {
    setLoading(true);
    try {
      const res = await axios.get<ContactsResponse>(
        `${backendUrl}/telecalling/contacts`,
        {
          params: { page: pageToLoad, limit },
          headers: getAuthHeaders(),
        }
      );

      const responseData = res.data;

      if (Array.isArray(responseData)) {
        setContacts(responseData);
        setTotalPages(1);
        buildToggleMap(responseData);
      } else {
        const list = Array.isArray(responseData?.data) ? responseData.data : [];
        setContacts(list);
        setTotalPages(responseData?.totalPages || 1);
        buildToggleMap(list);
      }

      setSelectedContactIds([]);
    } catch (err) {
      console.error(err);
      setMessage('Failed to fetch contacts');
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
        (u: User) => Array.isArray(u.roles) && u.roles.includes('TELECALLER')
      );

      setUsers(telecallers);
    } catch (err) {
      console.error(err);
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

    if (!isAllowed) {
      setMessage('Please upload only CSV, XLSX, or XLS file');
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setImporting(true);
      setMessage('Import in progress...');

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

      const importedCount = res.data?.importedCount || 0;
      const skippedCount = res.data?.skippedCount || 0;
      const totalRows = res.data?.totalRows || 0;

      setMessage(
        `Import completed. Imported: ${importedCount}, Skipped: ${skippedCount}, Total Rows: ${totalRows}`
      );

      setPage(1);
      await fetchContacts(1);
    } catch (err: any) {
      console.error(err);
      setMessage(err?.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

      setMessage('Assigned successfully');
      await fetchContacts(page);
    } catch (err: any) {
      console.error(err);
      setMessage(err?.response?.data?.message || 'Assignment failed');
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkAssignedTo) {
      setMessage('Please select a telecaller for bulk assign');
      return;
    }

    if (selectedContactIds.length === 0) {
      setMessage('Please select at least one contact');
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

      setMessage(`Assigned ${selectedContactIds.length} selected contact(s) successfully`);
      setSelectedContactIds([]);
      setBulkAssignedTo('');
      await fetchContacts(page);
    } catch (err: any) {
      console.error(err);
      setMessage(
        err?.response?.data?.message ||
          'Bulk assign failed. If this gives 404, backend bulk-assign endpoint is missing.'
      );
    } finally {
      setAssigningBulk(false);
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

      setMessage('Converted to lead');
      await fetchContacts(page);
    } catch (err: any) {
      console.error(err);
      setMessage(err?.response?.data?.message || 'Conversion failed');
      setConvertToggleMap((prev) => ({
        ...prev,
        [id]: false,
      }));
    } finally {
      setConvertingId(null);
    }
  };

  const handleConvertToggle = async (id: number, checked: boolean) => {
    setConvertToggleMap((prev) => ({
      ...prev,
      [id]: checked,
    }));

    if (!checked) return;

    const confirmConvert = window.confirm(
      'Are you sure you want to convert this contact to lead?'
    );

    if (!confirmConvert) {
      setConvertToggleMap((prev) => ({
        ...prev,
        [id]: false,
      }));
      return;
    }

    await convertToLead(id);
  };

  const handleClearFilters = () => {
    setNameFilter('');
    setPhoneFilter('');
    setCityFilter('');
    setSelectedContactIds([]);
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

        <label className="cursor-pointer rounded bg-blue-600 px-4 py-2 text-white">
          {importing ? 'Importing...' : 'Import CSV / Excel'}
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

      {message && <p className="mb-3 text-blue-600">{message}</p>}

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
                  </td>

                  <td className="border p-2">
                    {c.convertedToLead ? (
                      <span className="font-medium text-green-600">Converted</span>
                    ) : (
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!convertToggleMap[c.id]}
                          onChange={(e) => handleConvertToggle(c.id, e.target.checked)}
                          disabled={convertingId === c.id}
                        />
                        <span>{convertingId === c.id ? 'Saving...' : 'Convert'}</span>
                      </label>
                    )}
                  </td>
                </tr>
              ))}

              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={9} className="border p-4 text-center text-gray-500">
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
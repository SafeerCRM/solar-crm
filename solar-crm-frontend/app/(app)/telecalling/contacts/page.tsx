'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { getAuthHeaders } from '@/lib/authHeaders';

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

type Contact = {
  id: number;
  name: string;
  phone: string;
  city?: string;
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

export default function TelecallingContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 50;

  const [selectedConvertIds, setSelectedConvertIds] = useState<number[]>([]);
  const [savingConvert, setSavingConvert] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchContacts();
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await axios.get(
        `${backendUrl}/telecalling/contacts?page=${page}&limit=${limit}`,
        {
          headers: getAuthHeaders(),
        }
      );

      setContacts(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotal(Number(res.data?.total || 0));
      setTotalPages(Number(res.data?.totalPages || 1));
      setSelectedConvertIds([]);
    } catch (err) {
      console.error(err);
      setMessage('Failed to fetch contacts');
      setContacts([]);
      setTotal(0);
      setTotalPages(1);
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
        (u: User) => u.roles?.includes('TELECALLER')
      );

      setUsers(telecallers);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImport = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
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

      setMessage(
        `Imported: ${res.data.importedCount || 0}, Skipped: ${res.data.skippedCount || 0}, Total Rows: ${res.data.totalRows || 0}`
      );

      setPage(1);
      fetchContacts();
    } catch (err: any) {
      console.error(err);
      setMessage(err?.response?.data?.message || 'Import failed');
    }
  };

  const assignContact = async (id: number, userId: number) => {
    if (!userId) return;

    try {
      await axios.patch(
        `${backendUrl}/telecalling/contacts/${id}/assign`,
        { assignedTo: userId },
        { headers: getAuthHeaders() }
      );

      setMessage('Assigned successfully');
      fetchContacts();
    } catch (err) {
      console.error(err);
      setMessage('Assignment failed');
    }
  };

  const toggleConvertSelection = (id: number) => {
    setSelectedConvertIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSaveConversion = async () => {
    if (selectedConvertIds.length === 0) {
      setMessage('Please select at least one contact to convert');
      return;
    }

    const confirmConvert = window.confirm(
      `Convert ${selectedConvertIds.length} selected contact(s) to lead?`
    );

    if (!confirmConvert) return;

    try {
      setSavingConvert(true);

      await Promise.all(
        selectedConvertIds.map((id) =>
          axios.post(
            `${backendUrl}/telecalling/contacts/${id}/convert`,
            {},
            { headers: getAuthHeaders() }
          )
        )
      );

      setMessage('Selected contacts converted successfully');
      setSelectedConvertIds([]);
      fetchContacts();
    } catch (err: any) {
      console.error(err);
      setMessage(err?.response?.data?.message || 'Conversion failed');
    } finally {
      setSavingConvert(false);
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
          Import CSV / Excel
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />
        </label>

        <button
          onClick={handleSaveConversion}
          disabled={savingConvert || selectedConvertIds.length === 0}
          className="rounded bg-purple-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {savingConvert
            ? 'Saving...'
            : `Save Conversion${selectedConvertIds.length ? ` (${selectedConvertIds.length})` : ''}`}
        </button>
      </div>

      {message && <p className="mb-3 text-blue-600">{message}</p>}

      <div className="mb-4 rounded bg-gray-100 p-3 text-sm text-gray-700">
        <strong>Total Contacts:</strong> {total} | <strong>Page:</strong> {page} / {totalPages}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Name</th>
                <th className="border p-2">Phone</th>
                <th className="border p-2">City</th>
                <th className="border p-2">Assigned</th>
                <th className="border p-2">Assign</th>
                <th className="border p-2">Convert Toggle</th>
              </tr>
            </thead>

            <tbody>
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border p-4 text-center">
                    No contacts found
                  </td>
                </tr>
              ) : (
                contacts.map((c) => (
                  <tr key={c.id}>
                    <td className="border p-2">{c.name}</td>
                    <td className="border p-2">{c.phone}</td>
                    <td className="border p-2">{c.city || ''}</td>
                    <td className="border p-2">
                      {c.assignedToName || 'Unassigned'}
                    </td>

                    <td className="border p-2">
                      <select
                        onChange={(e) =>
                          assignContact(c.id, Number(e.target.value))
                        }
                        className="border p-1"
                        defaultValue=""
                      >
                        <option value="">Assign</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="border p-2">
                      {c.convertedToLead ? (
                        <span className="font-medium text-green-600">
                          Converted
                        </span>
                      ) : (
                        <label className="inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={selectedConvertIds.includes(c.id)}
                            onChange={() => toggleConvertSelection(c.id)}
                            className="peer sr-only"
                          />
                          <div className="relative h-6 w-11 rounded-full bg-gray-300 transition-all after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-600 peer-checked:after:translate-x-full" />
                        </label>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={page === 1}
              className="rounded bg-gray-500 px-4 py-2 text-white disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm text-gray-700">
              Showing page {page} of {totalPages}
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
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
  const limit = 50;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchContacts();
    fetchUsers();
  }, [page]);

  // ✅ FIXED CONTACT FETCH (PAGINATION SUPPORT)
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${backendUrl}/telecalling/contacts?page=${page}&limit=${limit}`,
        { headers: getAuthHeaders() }
      );

      setContacts(res.data.data || []);
      setTotal(res.data.total || 0);
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

      const telecallers = res.data.filter((u: User) =>
        u.roles?.includes('TELECALLER')
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
        `Imported: ${res.data.importedCount}, Skipped: ${res.data.skippedCount}`
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

      fetchContacts();
    } catch (err) {
      console.error(err);
      setMessage('Assignment failed');
    }
  };

  const convertToLead = async (id: number) => {
    try {
      await axios.post(
        `${backendUrl}/telecalling/contacts/${id}/convert`,
        {},
        { headers: getAuthHeaders() }
      );

      setMessage('Converted to lead');
      fetchContacts();
    } catch (err) {
      console.error(err);
      setMessage('Conversion failed');
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Telecalling Contacts</h1>

      <div className="mb-4 flex gap-2">
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
      </div>

      {message && <p className="mb-3 text-blue-600">{message}</p>}

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
                <th className="border p-2">Convert</th>
              </tr>
            </thead>

            <tbody>
              {contacts.map((c) => (
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
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="border p-2">
                    {c.convertedToLead ? (
                      <span className="text-green-600">Converted</span>
                    ) : (
                      <button
                        onClick={() => convertToLead(c.id)}
                        className="rounded bg-purple-600 px-3 py-1 text-white"
                      >
                        Convert
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ✅ Pagination UI */}
          <div className="mt-4 flex items-center justify-between">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="rounded bg-gray-500 px-4 py-2 text-white disabled:opacity-50"
            >
              Previous
            </button>

            <span>
              Page {page} / {totalPages || 1}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
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
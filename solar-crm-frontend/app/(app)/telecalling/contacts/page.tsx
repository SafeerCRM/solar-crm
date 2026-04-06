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

export default function TelecallingContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [convertToggleMap, setConvertToggleMap] = useState<Record<number, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchContacts();
    fetchUsers();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/telecalling/contacts`, {
        headers: getAuthHeaders(),
      });

      const data = Array.isArray(res.data) ? res.data : [];
      setContacts(data);

      const initialToggleMap: Record<number, boolean> = {};
      data.forEach((contact: Contact) => {
        initialToggleMap[contact.id] = false;
      });
      setConvertToggleMap(initialToggleMap);
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
      await axios.post(
        `${backendUrl}/telecalling/contacts/import`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setMessage('Contacts imported successfully');
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

  const convertToLead = async (id: number) => {
    try {
      setConvertingId(id);

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

    if (!checked) {
      return;
    }

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
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
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
            {contacts.map((c) => (
              <tr key={c.id}>
                <td className="border p-2">{c.name}</td>
                <td className="border p-2">{c.phone}</td>
                <td className="border p-2">{c.city || ''}</td>
                <td className="border p-2">{c.kNo || ''}</td>
                <td className="border p-2">{c.importedByName || ''}</td>
                <td className="border p-2">{c.assignedToName || 'Unassigned'}</td>

                <td className="border p-2">
                  <select
                    onChange={(e) => assignContact(c.id, Number(e.target.value))}
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
                    <span className="font-medium text-green-600">Converted</span>
                  ) : (
                    <label className="inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={!!convertToggleMap[c.id]}
                        disabled={convertingId === c.id}
                        onChange={(e) =>
                          handleConvertToggle(c.id, e.target.checked)
                        }
                      />
                      <div className="peer relative h-6 w-11 rounded-full bg-gray-300 transition-all after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-disabled:opacity-50" />
                    </label>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
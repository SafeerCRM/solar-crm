'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

type Contact = {
  id: number;
  name: string;
  phone: string;
  city?: string;
  kNo?: string;
  source?: string;
  assignedTo?: number;
  assignedToName?: string;
  importedByName?: string;
  status?: string;
  convertedToLead?: boolean;
};

type User = {
  id: number;
  name: string;
  email?: string;
  role?: string;
};

export default function TelecallingContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchContacts();
    fetchUsers();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/telecalling/contacts`, {
        headers: getHeaders(),
      });
      setContacts(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/users`, {
        headers: getHeaders(),
      });

      const telecallers = res.data.filter(
        (u: User) => u.role === 'TELECALLER'
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
            ...getHeaders(),
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setMessage('Contacts imported successfully');
      fetchContacts();
    } catch (err) {
      console.error(err);
      setMessage('Import failed');
    }
  };

  const assignContact = async (id: number, userId: number) => {
    if (!userId) return;

    try {
      await axios.patch(
        `${backendUrl}/telecalling/contacts/${id}/assign`,
        { assignedTo: userId },
        { headers: getHeaders() }
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
      await axios.post(
        `${backendUrl}/telecalling/contacts/${id}/convert`,
        {},
        { headers: getHeaders() }
      );

      setMessage('Converted to lead');
      fetchContacts();
    } catch (err) {
      console.error(err);
      setMessage('Conversion failed');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Telecalling Contacts
      </h1>

      <div className="flex gap-2 mb-4">
        <Link
          href="/telecalling"
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Back
        </Link>

        <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">
          Import CSV
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
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
                <td className="border p-2">
                  {c.importedByName || ''}
                </td>
                <td className="border p-2">
                  {c.assignedToName || 'Unassigned'}
                </td>

                <td className="border p-2">
                  <select
                    onChange={(e) =>
                      assignContact(c.id, Number(e.target.value))
                    }
                    className="border p-1"
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
                    <span className="text-green-600">
                      Converted
                    </span>
                  ) : (
                    <button
                      onClick={() => convertToLead(c.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Convert
                    </button>
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
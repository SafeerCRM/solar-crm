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
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  // 🔥 Filters
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchCity, setSearchCity] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchContacts();
    fetchUsers();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await axios.get(
        `${backendUrl}/telecalling/contacts?page=1&limit=500`,
        { headers: getAuthHeaders() }
      );

      const data = res.data?.data || [];
      setContacts(data);
      setFilteredContacts(data);
    } catch (err) {
      console.error(err);
      setMessage('Failed to fetch contacts');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/users/assignable-staff`, {
        headers: getAuthHeaders(),
      });

      const telecallers = res.data.filter((u: User) =>
        u.roles.includes('TELECALLER')
      );

      setUsers(telecallers);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 FILTER LOGIC
  useEffect(() => {
    let filtered = contacts;

    if (searchName) {
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchPhone) {
      filtered = filtered.filter((c) =>
        c.phone.includes(searchPhone)
      );
    }

    if (searchCity) {
      filtered = filtered.filter((c) =>
        (c.city || '').toLowerCase().includes(searchCity.toLowerCase())
      );
    }

    setFilteredContacts(filtered);
  }, [searchName, searchPhone, searchCity, contacts]);

  // 🔥 MULTI SELECT
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // 🔥 BULK ASSIGN
  const handleBulkAssign = async () => {
    if (!selectedUser || selectedIds.length === 0) {
      setMessage('Select contacts and user');
      return;
    }

    try {
      await Promise.all(
        selectedIds.map((id) =>
          axios.patch(
            `${backendUrl}/telecalling/contacts/${id}/assign`,
            { assignedTo: selectedUser },
            { headers: getAuthHeaders() }
          )
        )
      );

      setMessage('Contacts assigned successfully');
      setSelectedIds([]);
      fetchContacts();
    } catch (err) {
      console.error(err);
      setMessage('Bulk assign failed');
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Telecalling Contacts</h1>

      {/* 🔥 FILTERS */}
      <div className="mb-4 grid gap-2 md:grid-cols-3">
        <input
          placeholder="Search Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          placeholder="Search Phone"
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          placeholder="Search City"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {/* 🔥 BULK ASSIGN */}
      <div className="mb-4 flex gap-2">
        <select
          onChange={(e) => setSelectedUser(Number(e.target.value))}
          className="border p-2"
        >
          <option value="">Select Telecaller</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleBulkAssign}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Assign Selected ({selectedIds.length})
        </button>
      </div>

      {message && <p className="mb-3 text-blue-600">{message}</p>}

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Select</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">City</th>
            <th className="border p-2">Assigned</th>
          </tr>
        </thead>

        <tbody>
          {filteredContacts.map((c) => (
            <tr key={c.id}>
              <td className="border p-2 text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(c.id)}
                  onChange={() => toggleSelect(c.id)}
                />
              </td>

              <td className="border p-2">{c.name}</td>
              <td className="border p-2">{c.phone}</td>
              <td className="border p-2">{c.city}</td>
              <td className="border p-2">
                {c.assignedToName || 'Unassigned'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
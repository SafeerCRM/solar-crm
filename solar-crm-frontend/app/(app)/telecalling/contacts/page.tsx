'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';
import Link from 'next/link';

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`${backendUrl}/telecalling/contacts`, {
        headers: getAuthHeaders(),
      });
      setContacts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const storageContacts = contacts.filter((c) => c.isInStorage);
  const activeContacts = contacts.filter((c) => !c.isInStorage);

  const getStatusColor = (status: string) => {
    if (status === 'INTERESTED') return 'bg-green-100 text-green-700';
    if (status === 'NOT_INTERESTED') return 'bg-red-100 text-red-700';
    if (status === 'CNR') return 'bg-gray-200 text-gray-700';
    if (status === 'CALLBACK') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4 space-y-6">

      {/* 🔵 STORAGE SECTION */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Storage (Warehouse)</h2>

        <div className="space-y-3 md:hidden">
          {storageContacts.map((c) => (
            <div key={c.id} className="bg-gray-50 p-4 rounded-xl shadow-sm">
              <div className="font-semibold">{c.name}</div>
              <div className="text-sm">{c.phone}</div>
              <div className="text-sm text-gray-500">{c.city}</div>

              <div className="mt-3 text-sm text-gray-600">
                Imported By: {c.importedByName || '-'}
              </div>

              <button className="mt-3 w-full bg-indigo-600 text-white py-2 rounded-xl">
                Assign
              </button>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full border">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>City</th>
                <th>Import</th>
                <th>Assign</th>
              </tr>
            </thead>
            <tbody>
              {storageContacts.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.city}</td>
                  <td>{c.importedByName}</td>
                  <td>
                    <button className="bg-indigo-600 text-white px-3 py-1 rounded">
                      Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🟢 ACTIVE CONTACTS */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Active Contacts</h2>

        <div className="space-y-3 md:hidden">
          {activeContacts.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-xl shadow">

              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-sm">{c.phone}</div>
                  <div className="text-sm text-gray-500">{c.city}</div>
                </div>

                <div className={`px-2 py-1 text-xs rounded ${getStatusColor(c.callStatus)}`}>
                  {c.callStatus || 'NEW'}
                </div>
              </div>

              <div className="mt-2 text-sm">
                Potential: {c.leadPotential || '-'}
              </div>

              <div className="mt-2 text-sm">
                Assistant: {c.reviewAssignedToName || '-'}
              </div>

              {/* Actions */}
              <div className="flex justify-around mt-4 text-xl">
                <a href={`tel:${c.phone}`}>📞</a>
                <Link href={`/telecalling/contacts/${c.id}`}>📂</Link>
                <button>🎯</button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <table className="w-full border">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>City</th>
                <th>Status</th>
                <th>Potential</th>
                <th>Assistant</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeContacts.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.city}</td>
                  <td>{c.callStatus}</td>
                  <td>{c.leadPotential}</td>
                  <td>{c.reviewAssignedToName}</td>
                  <td>
                    <a href={`tel:${c.phone}`}>Call</a> |{' '}
                    <Link href={`/telecalling/contacts/${c.id}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
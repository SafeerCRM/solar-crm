'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

type Lead = {
  id: number;
  name: string;
  phone: string;
  status: string;
};

export default function TelecallingPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<number | ''>('');
  const [callStatus, setCallStatus] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${backendUrl}/leads`, {
        headers: getHeaders(),
      });
      setLeads(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCallLog = async (e: any) => {
    e.preventDefault();

    if (!selectedLead || !callStatus) {
      setMessage('Please select lead and call status');
      return;
    }

    try {
      await axios.post(
        `${backendUrl}/telecalling`,
        {
          leadId: selectedLead,
          callStatus,
          callNotes,
        },
        { headers: getHeaders() }
      );

      setMessage('Call logged successfully');
      setCallStatus('');
      setCallNotes('');
      setSelectedLead('');
    } catch (err) {
      console.error(err);
      setMessage('Failed to log call');
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        {/* HEADER WITH CONTACTS BUTTON */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Telecalling</h1>

          <Link
            href="/telecalling/contacts"
            className="rounded-xl bg-purple-600 px-4 py-2 text-white font-medium"
          >
            Go to Contacts
          </Link>
        </div>

        {/* FORM */}
        <form onSubmit={handleCallLog} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">
              Select Lead
            </label>
            <select
              value={selectedLead}
              onChange={(e) =>
                setSelectedLead(Number(e.target.value))
              }
              className="w-full border p-2 rounded"
            >
              <option value="">Select Lead</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} ({lead.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Call Status
            </label>
            <select
              value={callStatus}
              onChange={(e) => setCallStatus(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Select Status</option>
              <option value="CONNECTED">CONNECTED</option>
              <option value="NOT_INTERESTED">NOT INTERESTED</option>
              <option value="INTERESTED">INTERESTED</option>
              <option value="CALLBACK">CALLBACK</option>
              <option value="CNR">CNR</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Call Notes
            </label>
            <textarea
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              className="w-full border p-2 rounded"
              rows={3}
            />
          </div>

          {message && (
            <p className="text-blue-600 text-sm">{message}</p>
          )}

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            Save Call
          </button>
        </form>
      </div>
    </div>
  );
}
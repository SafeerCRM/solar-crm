'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

type Meeting = {
  id: number;
  customerName: string;
  mobile: string;
  scheduledAt: string;
  status: string;
  meetingType: string;
  assignedTo?: number;
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function MeetingPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await axios.get(`${backendUrl}/meetings`, {
        headers: getAuthHeaders(),
      });

      setMeetings(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage('Failed to fetch meetings');
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await axios.patch(
        `${backendUrl}/meetings/${id}/status`,
        { status },
        { headers: getAuthHeaders() }
      );

      setMessage(`Meeting marked as ${status}`);
      fetchMeetings();
    } catch (err) {
      console.error(err);
      setMessage('Failed to update status');
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Meeting Dashboard</h1>

      {message && <p className="mb-3 text-blue-600">{message}</p>}

      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Customer</th>
              <th className="border p-2">Mobile</th>
              <th className="border p-2">Scheduled</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Assigned</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {meetings.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center">
                  No meetings found
                </td>
              </tr>
            ) : (
              meetings.map((m) => (
                <tr key={m.id}>
                  <td className="border p-2">{m.customerName}</td>
                  <td className="border p-2">{m.mobile}</td>

                  <td className="border p-2">
                    {new Date(m.scheduledAt).toLocaleString()}
                  </td>

                  <td className="border p-2">{m.meetingType}</td>

                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded text-white text-xs ${
                        m.status === 'COMPLETED'
                          ? 'bg-green-600'
                          : m.status === 'CANCELLED'
                          ? 'bg-red-600'
                          : m.status === 'RESCHEDULED'
                          ? 'bg-yellow-500'
                          : 'bg-blue-600'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>

                  <td className="border p-2">
                    {m.assignedTo || 'Unassigned'}
                  </td>

                  <td className="border p-2 space-x-2">
                    <button
                      onClick={() => updateStatus(m.id, 'COMPLETED')}
                      className="bg-green-600 text-white px-2 py-1 rounded"
                    >
                      Complete
                    </button>

                    <button
                      onClick={() => updateStatus(m.id, 'RESCHEDULED')}
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                      Reschedule
                    </button>

                    <button
                      onClick={() => updateStatus(m.id, 'CANCELLED')}
                      className="bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
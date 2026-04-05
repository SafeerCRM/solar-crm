'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import MeetingTable from '../../components/meeting/MeetingTable';
import { getAuthHeaders } from '../../../lib/authHeaders';

type Meeting = {
  id: number;
  leadId: number;
  followupId?: number;
  customerName: string;
  mobile: string;
  address?: string;
  scheduledAt: string;
  assignedTo?: number;
  meetingType: string;
  status: string;
  notes?: string;
  outcome?: string;
  nextAction?: string;
  managerRemarks?: string;
  siteObservation?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAddress?: string;
  createdAt: string;
  updatedAt: string;
};

export default function MeetingPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/meetings`,
        {
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          Array.isArray(errData?.message)
            ? errData.message.join(', ')
            : errData?.message || 'Failed to fetch meetings'
        );
      }

      const data = await res.json();
      setMeetings(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Meetings</h1>
          <p className="text-sm text-gray-600">
            Manage scheduled meetings and manager updates
          </p>
        </div>

        <Link
          href="/meeting/create"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Create Meeting
        </Link>
      </div>

      {loading && <p>Loading meetings...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && <MeetingTable meetings={meetings} />}
    </div>
  );
}
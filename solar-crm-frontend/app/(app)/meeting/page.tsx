'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

type Meeting = {
  id: number;
  leadId: number;
  followupId?: number | null;
  customerName: string;
  mobile: string;
  address?: string | null;
  scheduledAt: string;
  assignedTo?: number | null;
  meetingType: string;
  status: string;
  notes?: string | null;
  outcome?: string | null;
  nextAction?: string | null;
  managerRemarks?: string | null;
  siteObservation?: string | null;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  gpsAddress?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
  createdAt: string;
  updatedAt: string;
};

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

type ActionType = 'COMPLETE' | 'CANCEL' | 'RESCHEDULE' | 'CONVERT' | null;

export default function MeetingPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);

  const [form, setForm] = useState({
    outcome: '',
    notes: '',
    nextAction: '',
    managerRemarks: '',
    siteObservation: '',
    scheduledAt: '',
  });

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/meetings`, {
        headers: getAuthHeaders(),
      });
      setMeetings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setMessage('Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  };

  const resetActionState = () => {
    setSelectedMeeting(null);
    setActionType(null);
    setForm({
      outcome: '',
      notes: '',
      nextAction: '',
      managerRemarks: '',
      siteObservation: '',
      scheduledAt: '',
    });
  };

  const openAction = (meeting: Meeting, type: ActionType) => {
    setSelectedMeeting(meeting);
    setActionType(type);
    setForm({
      outcome: meeting.outcome || '',
      notes: meeting.notes || '',
      nextAction: meeting.nextAction || '',
      managerRemarks: meeting.managerRemarks || '',
      siteObservation: meeting.siteObservation || '',
      scheduledAt: meeting.scheduledAt
        ? new Date(meeting.scheduledAt).toISOString().slice(0, 16)
        : '',
    });
    setMessage('');
  };

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-600';
      case 'CANCELLED':
        return 'bg-red-600';
      case 'RESCHEDULED':
        return 'bg-yellow-500';
      case 'CONVERTED_TO_PROJECT':
        return 'bg-purple-600';
      case 'NO_SHOW':
        return 'bg-gray-600';
      default:
        return 'bg-blue-600';
    }
  };

  const saveComplete = async () => {
    if (!selectedMeeting) return;

    try {
      await axios.patch(
        `${backendUrl}/meetings/${selectedMeeting.id}`,
        {
          status: 'COMPLETED',
          outcome: form.outcome || 'Completed meeting',
          notes: form.notes || undefined,
          nextAction: form.nextAction || undefined,
          managerRemarks: form.managerRemarks || undefined,
          siteObservation: form.siteObservation || undefined,
        },
        { headers: getAuthHeaders() }
      );

      setMessage('Meeting marked as COMPLETED');
      resetActionState();
      fetchMeetings();
    } catch (err) {
      console.error(err);
      setMessage('Failed to complete meeting');
    }
  };

  const saveCancel = async () => {
    if (!selectedMeeting) return;

    if (!form.managerRemarks.trim()) {
      setMessage('Please enter cancellation reason');
      return;
    }

    try {
      await axios.patch(
        `${backendUrl}/meetings/${selectedMeeting.id}`,
        {
          status: 'CANCELLED',
          managerRemarks: form.managerRemarks,
          notes: form.notes || undefined,
        },
        { headers: getAuthHeaders() }
      );

      setMessage('Meeting marked as CANCELLED');
      resetActionState();
      fetchMeetings();
    } catch (err) {
      console.error(err);
      setMessage('Failed to cancel meeting');
    }
  };

  const saveReschedule = async () => {
    if (!selectedMeeting) return;

    if (!form.scheduledAt) {
      setMessage('Please choose new date and time');
      return;
    }

    if (!form.managerRemarks.trim()) {
      setMessage('Please enter reschedule reason');
      return;
    }

    try {
      await axios.patch(
        `${backendUrl}/meetings/${selectedMeeting.id}`,
        {
          status: 'RESCHEDULED',
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          managerRemarks: form.managerRemarks,
          notes: form.notes || undefined,
          nextAction: form.nextAction || undefined,
        },
        { headers: getAuthHeaders() }
      );

      setMessage('Meeting rescheduled successfully');
      resetActionState();
      fetchMeetings();
    } catch (err) {
      console.error(err);
      setMessage('Failed to reschedule meeting');
    }
  };

  const convertToProject = async () => {
    if (!selectedMeeting) return;

    try {
      await axios.patch(
        `${backendUrl}/meetings/${selectedMeeting.id}`,
        {
          status: 'CONVERTED_TO_PROJECT',
          nextAction: form.nextAction || 'Converted to project',
          notes: form.notes || undefined,
        },
        { headers: getAuthHeaders() }
      );

      setMessage(
        'Meeting marked as CONVERTED_TO_PROJECT. Next backend step is real project creation.'
      );
      resetActionState();
      fetchMeetings();
    } catch (err) {
      console.error(err);
      setMessage('Failed to convert meeting to project');
    }
  };

  const actionTitle = useMemo(() => {
    switch (actionType) {
      case 'COMPLETE':
        return 'Complete Meeting';
      case 'CANCEL':
        return 'Cancel Meeting';
      case 'RESCHEDULE':
        return 'Reschedule Meeting';
      case 'CONVERT':
        return 'Convert Meeting to Project';
      default:
        return '';
    }
  }, [actionType]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meeting Dashboard</h1>
      </div>

      {message && <p className="mb-4 text-sm text-blue-600">{message}</p>}

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
              <th className="border p-2">GPS</th>
              <th className="border p-2">Remarks</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="p-4 text-center">
                  Loading meetings...
                </td>
              </tr>
            ) : meetings.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-4 text-center">
                  No meetings found
                </td>
              </tr>
            ) : (
              meetings.map((m) => (
                <tr key={m.id}>
                  <td className="border p-2">
                    <div className="font-medium">{m.customerName}</div>
                    <div className="text-xs text-gray-500">Lead ID: {m.leadId}</div>
                  </td>

                  <td className="border p-2">{m.mobile}</td>

                  <td className="border p-2">
                    {new Date(m.scheduledAt).toLocaleString()}
                  </td>

                  <td className="border p-2">{m.meetingType}</td>

                  <td className="border p-2">
                    <span
                      className={`rounded px-2 py-1 text-xs text-white ${statusBadgeClass(
                        m.status
                      )}`}
                    >
                      {m.status}
                    </span>
                  </td>

                  <td className="border p-2">{m.assignedTo || 'Unassigned'}</td>

                  <td className="border p-2">
                    {m.gpsLatitude && m.gpsLongitude
                      ? `${m.gpsLatitude}, ${m.gpsLongitude}`
                      : m.gpsAddress || '-'}
                  </td>

                  <td className="border p-2">
                    <div>{m.managerRemarks || '-'}</div>
                    {m.notes ? (
                      <div className="mt-1 text-xs text-gray-500">{m.notes}</div>
                    ) : null}
                  </td>

                  <td className="border p-2">
                    <div className="flex flex-wrap gap-2">
                      {(m.status === 'SCHEDULED' || m.status === 'RESCHEDULED') && (
                        <>
                          <button
                            onClick={() => openAction(m, 'COMPLETE')}
                            className="rounded bg-green-600 px-2 py-1 text-white"
                          >
                            Complete
                          </button>

                          <button
                            onClick={() => openAction(m, 'RESCHEDULE')}
                            className="rounded bg-yellow-500 px-2 py-1 text-white"
                          >
                            Reschedule
                          </button>

                          <button
                            onClick={() => openAction(m, 'CANCEL')}
                            className="rounded bg-red-600 px-2 py-1 text-white"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {m.status === 'COMPLETED' && (
                        <button
                          onClick={() => openAction(m, 'CONVERT')}
                          className="rounded bg-purple-600 px-2 py-1 text-white"
                        >
                          Convert to Project
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedMeeting && actionType && (
        <div className="mt-6 rounded border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">{actionTitle}</h2>

          <div className="mb-4 text-sm text-gray-700">
            <div>
              <strong>Customer:</strong> {selectedMeeting.customerName}
            </div>
            <div>
              <strong>Mobile:</strong> {selectedMeeting.mobile}
            </div>
          </div>

          {actionType === 'COMPLETE' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Outcome *</label>
                <input
                  name="outcome"
                  value={form.outcome}
                  onChange={handleFieldChange}
                  className="w-full rounded border px-3 py-2"
                  placeholder="Interested / Site visited / Positive discussion"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Next Action</label>
                <input
                  name="nextAction"
                  value={form.nextAction}
                  onChange={handleFieldChange}
                  className="w-full rounded border px-3 py-2"
                  placeholder="Prepare quotation / Convert to project later"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Manager Remarks</label>
                <textarea
                  name="managerRemarks"
                  value={form.managerRemarks}
                  onChange={handleFieldChange}
                  className="w-full rounded border px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Site Observation</label>
                <textarea
                  name="siteObservation"
                  value={form.siteObservation}
                  onChange={handleFieldChange}
                  className="w-full rounded border px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFieldChange}
                  className="w-full rounded border px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2 flex gap-2">
                <button
                  onClick={saveComplete}
                  className="rounded bg-green-600 px-4 py-2 text-white"
                >
                  Save Completed Meeting
                </button>
                <button
                  onClick={resetActionState}
                  className="rounded bg-gray-500 px-4 py-2 text-white"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {actionType === 'CANCEL' && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Cancellation Reason *
                </label>
                <textarea
                  name="managerRemarks"
                  value={form.managerRemarks}
                  onChange={handleFieldChange}
                  className="w-full rounded border px-3 py-2"
                  rows={4}
                  placeholder="Customer unavailable / Client postponed / Not interested / Wrong timing"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Additional Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFieldChange}
                  className="w-full rounded border px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={saveCancel}
                  className="rounded bg-red-600 px-4 py-2 text-white"
                >
                  Save Cancelled Meeting
                </button>
                <button
                  onClick={resetActionState}
                  className="rounded bg-gray-500 px-4 py-2 text-white"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {actionType === 'RESCHEDULE' && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  New Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  value={form.scheduledAt}
                  onChange={handleFieldChange}
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Reschedule Reason *
                </label>
                <textarea
                  name="managerRemarks"
                  value={form.managerRemarks}
                  onChange={handleFieldChange}
                  className="w-full rounded border px-3 py-2"
                  rows={3}
                  placeholder="Customer asked for different date / Manager unavailable / Site closed"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFieldChange}
                  className="w-full rounded border px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Next Action</label>
                <input
                  name="nextAction"
                  value={form.nextAction}
                  onChange={handleFieldChange}
                  className="w-full rounded border px-3 py-2"
                  placeholder="Reconfirm before visit"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={saveReschedule}
                  className="rounded bg-yellow-500 px-4 py-2 text-white"
                >
                  Save Rescheduled Meeting
                </button>
                <button
                  onClick={resetActionState}
                  className="rounded bg-gray-500 px-4 py-2 text-white"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {actionType === 'CONVERT' && (
            <div className="grid grid-cols-1 gap-4">
              <div className="text-sm text-gray-700">
                This meeting will remain in the system and be marked as converted to
                project. The next backend step can later create a real project record.
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Next Action</label>
                <input
                  name="nextAction"
                  value={form.nextAction}
                  onChange={handleFieldChange}
                  className="w-full rounded border px-3 py-2"
                  placeholder="Project handover to project manager"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFieldChange}
                  className="w-full rounded border px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={convertToProject}
                  className="rounded bg-purple-600 px-4 py-2 text-white"
                >
                  Confirm Convert to Project
                </button>
                <button
                  onClick={resetActionState}
                  className="rounded bg-gray-500 px-4 py-2 text-white"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
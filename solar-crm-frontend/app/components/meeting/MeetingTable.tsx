'use client';

type Meeting = {
  id: number;
  customerName: string;
  mobile: string;
  scheduledAt: string;
  meetingType: string;
  status: string;
  gpsAddress?: string;
  managerRemarks?: string;
};

type Props = {
  meetings: Meeting[];
};

export default function MeetingTable({ meetings }: Props) {
  if (!meetings.length) {
    return (
      <div className="rounded border bg-white p-6 text-center text-gray-500">
        No meetings found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border-b px-4 py-3">ID</th>
            <th className="border-b px-4 py-3">Customer</th>
            <th className="border-b px-4 py-3">Mobile</th>
            <th className="border-b px-4 py-3">Scheduled At</th>
            <th className="border-b px-4 py-3">Type</th>
            <th className="border-b px-4 py-3">Status</th>
            <th className="border-b px-4 py-3">GPS Address</th>
            <th className="border-b px-4 py-3">Manager Remarks</th>
          </tr>
        </thead>

        <tbody>
          {meetings.map((meeting) => (
            <tr key={meeting.id} className="hover:bg-gray-50">
              <td className="border-b px-4 py-3">{meeting.id}</td>
              <td className="border-b px-4 py-3">{meeting.customerName}</td>
              <td className="border-b px-4 py-3">{meeting.mobile}</td>
              <td className="border-b px-4 py-3">
                {new Date(meeting.scheduledAt).toLocaleString()}
              </td>
              <td className="border-b px-4 py-3">{meeting.meetingType}</td>
              <td className="border-b px-4 py-3">{meeting.status}</td>
              <td className="border-b px-4 py-3">{meeting.gpsAddress || '-'}</td>
              <td className="border-b px-4 py-3">
                {meeting.managerRemarks || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
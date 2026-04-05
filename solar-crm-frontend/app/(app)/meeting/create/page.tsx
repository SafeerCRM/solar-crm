'use client';

import MeetingForm from '../../../components/meeting/MeetingForm';

export default function CreateMeetingPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Create Meeting</h1>
        <p className="text-sm text-gray-600">
          Schedule a new meeting and store field details
        </p>
      </div>

      <MeetingForm />
    </div>
  );
}
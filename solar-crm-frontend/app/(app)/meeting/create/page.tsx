'use client';

import { Suspense } from 'react';
import MeetingForm from '../../../components/meeting/MeetingForm';

function CreateMeetingContent() {
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

export default function CreateMeetingPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading meeting form...</div>}>
      <CreateMeetingContent />
    </Suspense>
  );
}
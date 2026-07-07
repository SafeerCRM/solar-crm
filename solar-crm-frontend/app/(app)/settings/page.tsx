'use client';

import Link from 'next/link';

export default function SystemSettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Owner-only controls for CRM security, access, and system-wide modes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/settings/maintenance"
          className="rounded-2xl bg-white p-6 shadow hover:bg-gray-50"
        >
          <h2 className="text-lg font-bold text-gray-900">
            Maintenance Mode
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Temporarily block all non-owner users from accessing the web app and APK.
          </p>
        </Link>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function MaintenanceSettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [estimatedCompletion, setEstimatedCompletion] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/app-settings/maintenance-mode`);
      setEnabled(Boolean(res.data?.enabled));
      setMessage(res.data?.message || '');
      setEstimatedCompletion(res.data?.estimatedCompletion || '');
    } catch (error) {
      alert('Failed to load maintenance settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const saveSettings = async () => {
    try {
      setSaving(true);

      await axios.patch(
        `${apiBaseUrl}/app-settings/maintenance-mode`,
        {
          enabled,
          message,
          estimatedCompletion,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      alert('Maintenance settings saved');
    } catch (error) {
      alert('Failed to save maintenance settings');
    } finally {
      setSaving(false);
    }
  };

  return (

      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Maintenance Mode
        </h1>

        <p className="mb-6 text-sm text-gray-600">
          When enabled, all non-owner users will be blocked from using the CRM
          on both web app and APK.
        </p>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-5">
            <label className="flex items-center gap-3 rounded-xl border p-4">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-5 w-5"
              />
              <span className="font-semibold text-gray-800">
                Enable Maintenance Mode
              </span>
            </label>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full rounded-xl border p-3"
                placeholder="CRM is under maintenance. Please try again later."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Estimated Completion
              </label>
              <input
                value={estimatedCompletion}
                onChange={(e) => setEstimatedCompletion(e.target.value)}
                className="w-full rounded-xl border p-3"
                placeholder="Example: 08 July 2026, 11:30 PM"
              />
            </div>

            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-2 text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>
  );
}
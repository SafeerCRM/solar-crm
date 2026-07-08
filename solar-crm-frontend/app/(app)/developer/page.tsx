'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

type CurrentUser = {
  id?: number;
  name?: string;
  email?: string;
  roles?: string[];
};

export default function DeveloperConsolePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [password, setPassword] = useState('');
  const [developerUnlocked, setDeveloperUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(storedUser);
    } catch {
      setUser(null);
    } finally {
      setChecking(false);
    }
  }, []);

  const isOwner = Array.isArray(user?.roles) && user.roles.includes('OWNER');

  const verifyPassword = async () => {
    try {
      setSubmitting(true);

      const res = await axios.post(
        `${apiBaseUrl}/app-settings/developer-login`,
        { password },
      );

      if (res.data?.allowed) {
        sessionStorage.setItem('developerUnlocked', 'true');
        setDeveloperUnlocked(true);
      } else {
        alert('Invalid developer password');
      }
    } catch {
      alert('Developer verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const unlocked = sessionStorage.getItem('developerUnlocked') === 'true';
    setDeveloperUnlocked(unlocked);
  }, []);

  if (checking) {
    return <p>Checking access...</p>;
  }

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2 text-gray-600">
          Developer Console is only available from an OWNER login.
        </p>
      </div>
    );
  }

  if (!developerUnlocked) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-gray-900">
          Developer Console
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Enter developer password to access platform-level security controls.
        </p>

        <div className="mt-6">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Developer Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border p-3"
            placeholder="Enter developer password"
          />
        </div>

        <button
          type="button"
          onClick={verifyPassword}
          disabled={submitting || !password.trim()}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-2 text-white disabled:opacity-60"
        >
          {submitting ? 'Verifying...' : 'Unlock Developer Console'}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-gray-900">
          Developer Console
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Platform-level controls. This page is hidden from normal CRM users.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-bold text-gray-900">
            Screenshot Policy
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Control which roles or specific users can take screenshots in APK.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-bold text-gray-900">
            Emergency Controls
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Future controls for force logout, lock CRM, and emergency actions.
          </p>
        </div>
      </div>
    </div>
  );
}
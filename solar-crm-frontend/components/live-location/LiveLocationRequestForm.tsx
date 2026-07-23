'use client';

import { FormEvent } from 'react';

import { LiveLocationUser } from './LiveLocationSessionCard';

type MessageState = {
  type: 'SUCCESS' | 'ERROR';
  text: string;
} | null;

type Props = {
  loadingUsers: boolean;
  submitting: boolean;

  availableStaff: LiveLocationUser[];
  selectedStaff: LiveLocationUser | null;

  selectedStaffUserId: string;
  staffSearch: string;
  requestRemark: string;

  message: MessageState;

  createdSessionId?: number;
  createdSessionStatus?: string;

  formatRoles: (
    roles?: string[] | null,
  ) => string;

  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void | Promise<void>;

  onStaffSearchChange: (
    value: string,
  ) => void;

  onStaffChange: (
    value: string,
  ) => void;

  onRemarkChange: (
    value: string,
  ) => void;
};

export default function LiveLocationRequestForm({
  loadingUsers,
  submitting,
  availableStaff,
  selectedStaff,
  selectedStaffUserId,
  staffSearch,
  requestRemark,
  message,
  createdSessionId,
  createdSessionStatus,
  formatRoles,
  onSubmit,
  onStaffSearchChange,
  onStaffChange,
  onRemarkChange,
}: Props) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow md:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-black text-gray-900">
          Request Live Location
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Select one staff account and optionally
          include the reason for requesting their
          location.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="staff-search"
            className="mb-2 block text-sm font-bold text-gray-800"
          >
            Search staff
          </label>

          <input
            id="staff-search"
            type="text"
            value={staffSearch}
            onChange={(event) =>
              onStaffSearchChange(
                event.target.value,
              )
            }
            placeholder="Search by name, email or role..."
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="staff-user"
            className="mb-2 block text-sm font-bold text-gray-800"
          >
            Staff member
          </label>

          <select
            id="staff-user"
            value={selectedStaffUserId}
            onChange={(event) =>
              onStaffChange(
                event.target.value,
              )
            }
            disabled={
              loadingUsers ||
              availableStaff.length === 0
            }
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="">
              {loadingUsers
                ? 'Loading staff...'
                : availableStaff.length === 0
                ? 'No matching staff found'
                : 'Select staff member'}
            </option>

            {availableStaff.map((user) => (
              <option
                key={user.id}
                value={user.id}
              >
                {user.name}
                {user.email
                  ? ` — ${user.email}`
                  : ''}
              </option>
            ))}
          </select>

          {selectedStaff && (
            <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="font-bold text-gray-900">
                {selectedStaff.name}
              </p>

              {selectedStaff.email && (
                <p className="mt-1 text-sm text-gray-600">
                  {selectedStaff.email}
                </p>
              )}

              <p className="mt-1 text-xs font-semibold text-blue-700">
                {formatRoles(
                  selectedStaff.roles,
                )}
              </p>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="request-remark"
            className="mb-2 block text-sm font-bold text-gray-800"
          >
            Request remark
            <span className="ml-1 font-normal text-gray-500">
              (optional)
            </span>
          </label>

          <textarea
            id="request-remark"
            value={requestRemark}
            onChange={(event) =>
              onRemarkChange(
                event.target.value,
              )
            }
            rows={4}
            maxLength={500}
            placeholder="Example: Site visit tracking for today's assigned project."
            className="w-full resize-y rounded-2xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <p className="mt-1 text-right text-xs text-gray-400">
            {requestRemark.length}/500
          </p>
        </div>

        {message && (
          <div
            className={`rounded-2xl border p-4 text-sm font-semibold ${
              message.type === 'SUCCESS'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {message.text}

            {createdSessionId && (
              <p className="mt-1 text-xs font-medium">
                Tracking session #
                {createdSessionId} ·{' '}
                {createdSessionStatus}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={
            submitting ||
            loadingUsers ||
            !selectedStaffUserId
          }
          className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        >
          {submitting
            ? 'Sending Request...'
            : 'Request Live Location'}
        </button>
      </form>
    </section>
  );
}
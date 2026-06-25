'use client';

import { useEffect, useState } from 'react';

export default function CustomerWorkCalendarPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    projectId: '',
    currentWorkDate: '',
    requestedWorkDate: '',
    reason: '',
  });

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('customer_token');

      if (!token) {
        window.location.href = '/customer-login';
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/customer-auth/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        window.location.href = '/customer-login';
        return;
      }

      setDashboard(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const submitRequest = async () => {
    if (!form.projectId) {
      alert('Select project');
      return;
    }

    if (!form.requestedWorkDate) {
      alert('Select requested work date');
      return;
    }

    if (!form.reason.trim()) {
      alert('Enter reason');
      return;
    }

    try {
      const token = localStorage.getItem('customer_token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/customer-auth/work-date-requests`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || 'Failed');
        return;
      }

      alert('Work date request submitted');

      setForm({
        projectId: '',
        currentWorkDate: '',
        requestedWorkDate: '',
        reason: '',
      });

      loadDashboard();
    } catch (error) {
      console.error(error);
      alert('Failed');
    }
  };

    const selectedProject = (dashboard?.projects || []).find(
    (project: any) => String(project.id) === String(form.projectId),
  );

  const selectedProjectActivities = (dashboard?.executionActivities || [])
    .filter(
      (activity: any) =>
        String(activity.projectId) === String(form.projectId) &&
        activity.scheduledDate &&
        activity.status !== 'COMPLETED' &&
        activity.status !== 'CANCELLED',
    )
    .sort(
      (a: any, b: any) =>
        new Date(a.scheduledDate).getTime() -
        new Date(b.scheduledDate).getTime(),
    );

  const nextWorkActivity = selectedProjectActivities[0];

  const currentWorkDateValue =
    form.currentWorkDate ||
    (nextWorkActivity?.scheduledDate
      ? new Date(nextWorkActivity.scheduledDate).toISOString().slice(0, 10)
      : '');

  const currentWorkDateDisplay = currentWorkDateValue
    ? new Date(currentWorkDateValue).toLocaleDateString('en-IN')
    : 'No scheduled work date found';

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50">
        <div className="rounded-3xl bg-white p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-400 text-3xl">
            📅
          </div>
          <p className="text-sm font-semibold text-gray-600">
            Loading Work Calendar...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl">
          <h1 className="text-4xl font-black">📅 Work Calendar</h1>
          <p className="mt-2 text-sm">
            Track upcoming installation work and request schedule changes.
          </p>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
          <h2 className="text-2xl font-black">Upcoming Work Schedule</h2>

          <div className="mt-5 space-y-4">
            {(dashboard?.upcomingExecutionActivities || []).length === 0 ? (
              <div className="rounded-3xl border border-dashed p-6 text-center text-sm font-semibold text-gray-500">
                No upcoming execution work found.
              </div>
            ) : (
              (dashboard?.upcomingExecutionActivities || []).map(
                (activity: any) => (
                  <div
                    key={activity.id}
                    className="rounded-3xl border bg-gradient-to-r from-blue-50 to-indigo-50 p-5"
                  >
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black">
                          {String(activity.activityType).replaceAll('_', ' ')}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Project #{activity.projectId}
                        </p>
                      </div>

                      <span className="rounded-full bg-blue-100 px-4 py-2 text-xs font-black text-blue-700">
                        {activity.status}
                      </span>
                    </div>

                    <div className="mt-3 text-sm">
                      Scheduled Date:{' '}
                      {activity.scheduledDate
                        ? new Date(activity.scheduledDate).toLocaleDateString(
                            'en-IN',
                          )
                        : '-'}
                    </div>

                    {activity.remarks && (
                      <div className="mt-2 text-sm text-gray-600">
                        {activity.remarks}
                      </div>
                    )}
                  </div>
                ),
              )
            )}
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
          <h2 className="text-2xl font-black">Request Work Date Change</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <select
              value={form.projectId}
              onChange={(e) => {
  const projectId = e.target.value;

  const activities = (dashboard?.executionActivities || [])
    .filter(
      (activity: any) =>
        String(activity.projectId) === String(projectId) &&
        activity.scheduledDate &&
        activity.status !== 'COMPLETED' &&
        activity.status !== 'CANCELLED',
    )
    .sort(
      (a: any, b: any) =>
        new Date(a.scheduledDate).getTime() -
        new Date(b.scheduledDate).getTime(),
    );

  const nextActivity = activities[0];

  setForm({
    ...form,
    projectId,
    currentWorkDate: nextActivity?.scheduledDate
      ? new Date(nextActivity.scheduledDate).toISOString().slice(0, 10)
      : '',
  });
}}
              className="rounded-2xl border p-3"
            >
              <option value="">Select Project</option>

              {(dashboard?.projects || []).map((project: any) => (
                <option key={project.id} value={project.id}>
                  #{project.id} - {project.customerName}
                </option>
              ))}
            </select>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500">
                Current Work Date
              </label>
              <div className="w-full rounded-2xl border bg-gray-50 p-3 text-sm font-black text-gray-800">
  {currentWorkDateDisplay}
</div>

{nextWorkActivity && (
  <p className="mt-1 text-xs font-semibold text-gray-500">
    Next work: {String(nextWorkActivity.activityType || '').replaceAll('_', ' ')}
  </p>
)}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500">
                Requested New Work Date
              </label>
              <input
  type="text"
  placeholder="YYYY-MM-DD, example 2026-06-30"
  value={form.requestedWorkDate}
  onChange={(e) =>
    setForm({
      ...form,
      requestedWorkDate: e.target.value,
    })
  }
  className="w-full rounded-2xl border bg-white p-3 text-gray-900"
/>
            </div>
          </div>

          <textarea
            rows={4}
            placeholder="Reason"
            value={form.reason}
            onChange={(e) =>
              setForm({
                ...form,
                reason: e.target.value,
              })
            }
            className="mt-4 w-full rounded-2xl border p-3"
          />

          <button
            onClick={submitRequest}
            className="mt-4 rounded-2xl bg-orange-500 px-6 py-3 font-black text-white hover:bg-orange-600"
          >
            Submit Request
          </button>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl">
          <h2 className="text-2xl font-black">My Requests</h2>

          <div className="mt-5 space-y-4">
            {(dashboard?.workDateRequests || []).length === 0 ? (
              <div className="rounded-3xl border border-dashed p-6 text-center text-sm font-semibold text-gray-500">
                No work date change requests yet.
              </div>
            ) : (
              (dashboard?.workDateRequests || []).map((item: any) => (
                <div key={item.id} className="rounded-3xl border p-5">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <h3 className="font-black">Request #{item.id}</h3>
                      <p className="text-sm text-gray-500">
                        Requested:{' '}
                        {item.requestedWorkDate
                          ? new Date(item.requestedWorkDate).toLocaleDateString(
                              'en-IN',
                            )
                          : '-'}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-xs font-black ${
                        item.status === 'APPROVED'
                          ? 'bg-green-100 text-green-700'
                          : item.status === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : item.status === 'RESCHEDULED'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {item.reason && (
                    <div className="mt-3 text-sm">{item.reason}</div>
                  )}

                  {item.approvalRemarks && (
                    <div className="mt-3 rounded-2xl bg-gray-50 p-3 text-sm">
                      {item.approvalRemarks}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
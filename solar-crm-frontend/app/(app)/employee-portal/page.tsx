'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { uploadPreparedFile } from '@/app/utils/fileUpload';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function EmployeePortalPage() {
  const [activeTab, setActiveTab] = useState<
  'dashboard' | 'attendance' | 'leave' | 'policies'
>('dashboard');
  const [staff, setStaff] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveSummary, setLeaveSummary] = useState({
  approvedDays: 0,
  approvedRequests: 0,
  pendingRequests: 0,
  rejectedRequests: 0,
  cancelledRequests: 0,
});
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendancePhoto, setAttendancePhoto] = useState<File | null>(null);
  const [attendanceRemarks, setAttendanceRemarks] = useState('');
  const [leaveProof, setLeaveProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const selfieInputRef = useRef<HTMLInputElement | null>(null);
const [pendingPunchType, setPendingPunchType] =
  useState<'punch-in' | 'punch-out' | null>(null);
  const [policies, setPolicies] = useState<any[]>([]);

  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'CASUAL',
    fromDate: '',
    toDate: '',
    reason: '',
  });

  const headers = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadPortal = async () => {
    try {
      const [meRes, attendanceRes, leavesRes, policiesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/staff/self/me`, { headers: headers() }),
        axios.get(`${API_BASE_URL}/staff/self/attendance`, {
          params: { date: attendanceDate, limit: 20 },
          headers: headers(),
        }),
        axios.get(`${API_BASE_URL}/staff/self/leaves`, {
          params: { limit: 20 },
          headers: headers(),
        }),
        axios.get(`${API_BASE_URL}/staff/self/employee-policies`, {
  params: { limit: 50 },
  headers: headers(),
}),
      ]);

      setStaff(meRes.data || null);
      setAttendance(attendanceRes.data?.data || []);
      setLeaves(leavesRes.data?.data || []);
      setLeaveSummary({
  approvedDays: Number(
    leavesRes.data?.summary?.approvedDays || 0,
  ),
  approvedRequests: Number(
    leavesRes.data?.summary?.approvedRequests || 0,
  ),
  pendingRequests: Number(
    leavesRes.data?.summary?.pendingRequests || 0,
  ),
  rejectedRequests: Number(
    leavesRes.data?.summary?.rejectedRequests || 0,
  ),
  cancelledRequests: Number(
    leavesRes.data?.summary?.cancelledRequests || 0,
  ),
});
      setPolicies(policiesRes.data?.data || []);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Unable to load employee portal');
    }
  };

  useEffect(() => {
    loadPortal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLocation = () =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GPS not supported on this device'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
      });
    });

  const punch = async (
  type: 'punch-in' | 'punch-out',
  selfieFile: File,
) => {
  try {
    setLoading(true);

    const position = await getLocation();

    const photoUrl = await uploadPreparedFile({
      file: selfieFile,
      endpoint: `${API_BASE_URL}/staff/self/attendance/photo-upload`,
      token: localStorage.getItem('token'),
      fieldName: 'files',
    });

    await axios.post(
      `${API_BASE_URL}/staff/self/attendance/${type}`,
      {
        attendanceDate,
        latitude: String(position.coords.latitude),
        longitude: String(position.coords.longitude),
        gpsAddress: `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`,
        photoUrl,
        remarks: attendanceRemarks,
      },
      { headers: headers() },
    );

    alert(type === 'punch-in' ? 'Punch in saved' : 'Punch out saved');

    setAttendancePhoto(null);
    setAttendanceRemarks('');
    loadPortal();
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || error?.message || 'Attendance failed');
  } finally {
    setLoading(false);
  }
};

const startSelfiePunch = (type: 'punch-in' | 'punch-out') => {
  setPendingPunchType(type);
  selfieInputRef.current?.click();
};

  const applyLeave = async () => {
    if (!leaveForm.fromDate || !leaveForm.toDate || !leaveForm.reason.trim()) {
      alert('From date, to date and reason are required');
      return;
    }

    try {
      setLoading(true);

      let proofUrl = '';

      if (leaveProof) {
        proofUrl = await uploadPreparedFile({
          file: leaveProof,
          endpoint: `${API_BASE_URL}/staff/self/leave/proof-upload`,
          token: localStorage.getItem('token'),
          fieldName: 'files',
        });
      }

      await axios.post(
        `${API_BASE_URL}/staff/self/leave`,
        {
          ...leaveForm,
          proofUrl,
        },
        { headers: headers() },
      );

      alert('Leave request submitted');
      setLeaveForm({
        leaveType: 'CASUAL',
        fromDate: '',
        toDate: '',
        reason: '',
      });
      setLeaveProof(null);
      loadPortal();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to apply leave');
    } finally {
      setLoading(false);
    }
  };

  const todayAttendance = attendance[0];

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-3 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">Employee Portal</h1>
        <p className="mt-1 text-sm text-gray-500">
          Attendance, leave and personal HR information.
        </p>
      </div>

      {staff && (
        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="flex items-center gap-4">
            {staff.photoUrl ? (
              <img src={staff.photoUrl} className="h-16 w-16 rounded-xl object-cover" alt="Staff" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-xl font-bold">
                {(staff.fullName || '?').charAt(0)}
              </div>
            )}

            <div>
              <p className="text-lg font-bold text-gray-900">{staff.fullName}</p>
              <p className="text-sm text-gray-500">
                {staff.designation || '-'} | {staff.department || '-'} | {staff.branchName || '-'}
              </p>
              <p className="text-xs text-gray-400">
                Employee Code: {staff.employeeCode || '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          ['dashboard', 'Dashboard'],
          ['attendance', 'Attendance'],
          ['leave', 'Leave'],
          ['policies', 'Policies'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              activeTab === key ? 'bg-blue-600 text-white' : 'border bg-white text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Today Status</p>
            <p className="mt-2 text-xl font-bold">{todayAttendance?.status || 'Not Marked'}</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Working Hours</p>
            <p className="mt-2 text-xl font-bold text-green-700">
              {todayAttendance?.workingHours || 0}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
  <p className="text-sm text-gray-500">
    Approved Leave Days
  </p>

  <p className="mt-2 text-xl font-bold text-green-700">
    {leaveSummary.approvedDays}
  </p>

  <p className="mt-1 text-xs text-gray-500">
    {leaveSummary.approvedRequests} approved request(s)
  </p>
</div>

          <div className="rounded-2xl bg-white p-5 shadow">
  <p className="text-sm text-gray-500">Policies</p>
  <p className="mt-2 text-xl font-bold text-blue-700">
    {policies.length}
  </p>
</div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-lg font-bold text-gray-800">Mark Attendance</h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="rounded-xl border p-3"
              />

              <input
  ref={selfieInputRef}
  type="file"
  accept="image/*"
  capture="user"
  className="hidden"
  onChange={async (e) => {
    const file = e.target.files?.[0] || null;

    if (!file || !pendingPunchType) return;

    await punch(pendingPunchType, file);

    setPendingPunchType(null);
    e.target.value = '';
  }}
/>
            </div>

            <textarea
              placeholder="Remarks"
              value={attendanceRemarks}
              onChange={(e) => setAttendanceRemarks(e.target.value)}
              className="mt-3 w-full rounded-xl border p-3"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                disabled={loading || !!todayAttendance?.punchInTime}
                onClick={() => startSelfiePunch('punch-in')}
                className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                Punch In
              </button>

              <button
                disabled={loading || !todayAttendance?.punchInTime || !!todayAttendance?.punchOutTime}
                onClick={() => startSelfiePunch('punch-out')}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                Punch Out
              </button>

              <button
                onClick={loadPortal}
                className="rounded-xl bg-gray-800 px-5 py-3 font-semibold text-white"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-lg font-bold text-gray-800">Attendance Status</h2>

            {!todayAttendance ? (
              <p className="mt-3 text-sm text-gray-500">No attendance marked.</p>
            ) : (
              <div className="mt-3 rounded-xl border p-4">
                <p className="font-bold">Status: {todayAttendance.status}</p>
                <p className="text-sm text-gray-500">
                  Punch In: {todayAttendance.punchInTime ? new Date(todayAttendance.punchInTime).toLocaleString('en-IN') : '-'}
                </p>
                <p className="text-sm text-gray-500">
                  Punch Out: {todayAttendance.punchOutTime ? new Date(todayAttendance.punchOutTime).toLocaleString('en-IN') : '-'}
                </p>
                <p className="text-sm font-semibold text-green-700">
                  Working Hours: {todayAttendance.workingHours || 0}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'leave' && (
        <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">
      Approved Leave Days
    </p>

    <p className="mt-2 text-2xl font-bold text-green-700">
      {leaveSummary.approvedDays}
    </p>
  </div>

  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">
      Approved Requests
    </p>

    <p className="mt-2 text-2xl font-bold text-blue-700">
      {leaveSummary.approvedRequests}
    </p>
  </div>

  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">
      Pending Requests
    </p>

    <p className="mt-2 text-2xl font-bold text-amber-600">
      {leaveSummary.pendingRequests}
    </p>
  </div>

  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-gray-500">
      Rejected Requests
    </p>

    <p className="mt-2 text-2xl font-bold text-red-600">
      {leaveSummary.rejectedRequests}
    </p>
  </div>
</div>
          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-lg font-bold text-gray-800">Apply Leave</h2>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <select
                value={leaveForm.leaveType}
                onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                className="rounded-xl border p-3"
              >
                <option value="CASUAL">Casual</option>
                <option value="SICK">Sick</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="COMP_OFF">Comp Off</option>
                <option value="OTHER">Other</option>
              </select>

              <input
                type="date"
                value={leaveForm.fromDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
                className="rounded-xl border p-3"
              />

              <input
                type="date"
                value={leaveForm.toDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                className="rounded-xl border p-3"
              />

              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setLeaveProof(e.target.files?.[0] || null)}
                className="rounded-xl border p-3 md:col-span-3"
              />
            </div>

            <textarea
              placeholder="Leave reason"
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              className="mt-3 w-full rounded-xl border p-3"
            />

            <button
              onClick={applyLeave}
              disabled={loading}
              className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              Apply Leave
            </button>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-lg font-bold text-gray-800">My Leave Requests</h2>

            <div className="mt-4 space-y-3">
              {leaves.length === 0 ? (
                <p className="text-sm text-gray-500">No leave requests found.</p>
              ) : (
                leaves.map((leave) => (
                  <div key={leave.id} className="rounded-xl border p-4">
                    <p className="font-bold">
                      {leave.leaveType} | {leave.status} | {leave.totalDays} day(s)
                    </p>
                    <p className="text-sm text-gray-500">
                      {leave.fromDate} to {leave.toDate}
                    </p>
                    <p className="mt-2 text-sm">{leave.reason}</p>
                    {leave.approvalRemarks && (
                      <p className="mt-2 text-xs text-blue-700">
                        Approval Remark: {leave.approvalRemarks}
                      </p>
                    )}
                    {leave.proofUrl && (
                      <a
                        href={leave.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Proof
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'policies' && (
  <div className="rounded-2xl bg-white p-5 shadow">
    <h2 className="text-lg font-bold text-gray-800">
      Company / HR Policies
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Policies shared by HR for employee reference.
    </p>

    <div className="mt-4 space-y-3">
      {policies.length === 0 ? (
        <p className="text-sm text-gray-500">
          No policies available.
        </p>
      ) : (
        policies.map((policy) => (
          <div key={policy.id} className="rounded-xl border p-4">
            <p className="font-bold text-gray-900">
              {policy.title}
            </p>

            <p className="text-sm text-gray-500">
              {policy.category || 'GENERAL'}
            </p>

            {policy.description && (
              <p className="mt-2 text-sm text-gray-700">
                {policy.description}
              </p>
            )}

            {policy.fileUrl && (
              <a
                href={policy.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                View / Download
              </a>
            )}
          </div>
        ))
      )}
    </div>
  </div>
)}
    </div>
  );
}
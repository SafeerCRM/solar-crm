'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { uploadPreparedFile } from '@/app/utils/fileUpload';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function MyAttendancePage() {
  const [staff, setStaff] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const headers = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadMyAttendance = async () => {
    const res = await axios.get(`${API_BASE_URL}/staff/self/attendance`, {
      params: {
        date: attendanceDate,
        limit: 20,
      },
      headers: headers(),
    });

    setStaff(res.data?.staff || null);
    setAttendance(res.data?.data || []);
  };

  useEffect(() => {
    loadMyAttendance();
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

  const uploadAttendancePhoto = async () => {
    if (!photoFile) return '';

    const token = localStorage.getItem('token');

    return uploadPreparedFile({
      file: photoFile,
      endpoint: `${API_BASE_URL}/staff/self/attendance/photo-upload`,
      token,
      fieldName: 'files',
    });
  };

  const submitPunch = async (type: 'punch-in' | 'punch-out') => {
    if (!photoFile) {
      alert('Please upload attendance selfie/photo');
      return;
    }

    try {
      setLoading(true);

      const position = await getLocation();
      const photoUrl = await uploadAttendancePhoto();

      await axios.post(
        `${API_BASE_URL}/staff/self/attendance/${type}`,
        {
          attendanceDate,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
          gpsAddress: `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`,
          photoUrl,
          remarks,
        },
        { headers: headers() },
      );

      alert(type === 'punch-in' ? 'Punch in saved' : 'Punch out saved');

      setPhotoFile(null);
      setRemarks('');
      await loadMyAttendance();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || error?.message || 'Attendance failed');
    } finally {
      setLoading(false);
    }
  };

  const todayAttendance = attendance[0];

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-3 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          My Attendance
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Mark your own GPS and selfie based attendance.
        </p>
      </div>

      {staff && (
        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="flex items-center gap-4">
            {staff.photoUrl ? (
              <img
                src={staff.photoUrl}
                alt={staff.fullName || 'Staff'}
                className="h-16 w-16 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-xl font-bold">
                {(staff.fullName || '?').charAt(0)}
              </div>
            )}

            <div>
              <p className="text-lg font-bold text-gray-900">
                {staff.fullName}
              </p>
              <p className="text-sm text-gray-500">
                {staff.designation || '-'} | {staff.department || '-'}
              </p>
              <p className="text-sm text-gray-500">
                {staff.branchName || '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          Today's Punch
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="rounded-xl border p-3"
          />

          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            className="rounded-xl border p-3"
          />
        </div>

        <textarea
          placeholder="Remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="mt-3 w-full rounded-xl border p-3"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => submitPunch('punch-in')}
            disabled={loading || !!todayAttendance?.punchInTime}
            className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            Punch In
          </button>

          <button
            onClick={() => submitPunch('punch-out')}
            disabled={
              loading ||
              !todayAttendance?.punchInTime ||
              !!todayAttendance?.punchOutTime
            }
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            Punch Out
          </button>

          <button
            onClick={loadMyAttendance}
            className="rounded-xl bg-gray-800 px-5 py-3 font-semibold text-white"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          Attendance Status
        </h2>

        {!todayAttendance ? (
          <p className="mt-4 text-sm text-gray-500">
            No attendance marked for selected date.
          </p>
        ) : (
          <div className="mt-4 rounded-xl border p-4">
            <p className="font-bold text-gray-900">
              Status: {todayAttendance.status}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Punch In:{' '}
              {todayAttendance.punchInTime
                ? new Date(todayAttendance.punchInTime).toLocaleString('en-IN')
                : '-'}
            </p>

            <p className="text-sm text-gray-500">
              Punch Out:{' '}
              {todayAttendance.punchOutTime
                ? new Date(todayAttendance.punchOutTime).toLocaleString('en-IN')
                : '-'}
            </p>

            <p className="mt-2 text-sm font-semibold text-green-700">
              Working Hours: {todayAttendance.workingHours || 0}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {todayAttendance.punchInPhotoUrl && (
                <a
                  href={todayAttendance.punchInPhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  In Photo
                </a>
              )}

              {todayAttendance.punchOutPhotoUrl && (
                <a
                  href={todayAttendance.punchOutPhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Out Photo
                </a>
              )}

              {todayAttendance.punchInLatitude && todayAttendance.punchInLongitude && (
                <a
                  href={`https://www.google.com/maps?q=${todayAttendance.punchInLatitude},${todayAttendance.punchInLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white"
                >
                  In GPS
                </a>
              )}

              {todayAttendance.punchOutLatitude && todayAttendance.punchOutLongitude && (
                <a
                  href={`https://www.google.com/maps?q=${todayAttendance.punchOutLatitude},${todayAttendance.punchOutLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white"
                >
                  Out GPS
                </a>
              )}
            </div>

            {todayAttendance.remarks && (
              <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                {todayAttendance.remarks}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
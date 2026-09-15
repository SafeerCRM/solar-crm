'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { uploadPreparedFile } from '@/app/utils/fileUpload';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function MyAttendancePage() {
  const [staff, setStaff] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  
  const [monthlyAttendance, setMonthlyAttendance] =
  useState<any[]>([]);

const [calendarMonth, setCalendarMonth] =
  useState(
    new Date().toISOString().slice(0, 7),
  );

const [
  selectedCalendarAttendance,
  setSelectedCalendarAttendance,
] = useState<any | null>(null);

const [loadingCalendar, setLoadingCalendar] =
  useState(false);
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

  const loadMonthlyAttendance = async (
  month = calendarMonth,
) => {
  try {
    setLoadingCalendar(true);

    const [year, monthNumber] =
      month.split('-').map(Number);

    const fromDate =
      `${year}-${String(monthNumber).padStart(2, '0')}-01`;

    const lastDay =
      new Date(
        year,
        monthNumber,
        0,
      ).getDate();

    const toDate =
      `${year}-${String(monthNumber).padStart(2, '0')}-${String(
        lastDay,
      ).padStart(2, '0')}`;

    const res = await axios.get(
      `${API_BASE_URL}/staff/self/attendance`,
      {
        params: {
          fromDate,
          toDate,
          limit: 100,
        },
        headers: headers(),
      },
    );

    setMonthlyAttendance(
      res.data?.data || [],
    );
  } catch (error) {
    console.error(
      'Failed to load monthly attendance',
      error,
    );

    setMonthlyAttendance([]);
  } finally {
    setLoadingCalendar(false);
  }
};

  useEffect(() => {
  loadMyAttendance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

useEffect(() => {
  loadMonthlyAttendance(calendarMonth);
  setSelectedCalendarAttendance(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [calendarMonth]);

const getAttendanceForDate = (
  date: string,
) => {
  return monthlyAttendance.find(
    (item) =>
      String(item.attendanceDate) ===
      date,
  );
};

const getCalendarStatusClasses = (
  item: any,
) => {
  if (!item) {
    return 'bg-gray-50 text-gray-500 border-gray-200';
  }

  const status = String(
    item.status || '',
  ).toUpperCase();

  if (
    status === 'PRESENT' ||
    status === 'FULL_DAY'
  ) {
    return 'bg-green-600 text-white border-green-600';
  }

  if (status === 'HALF_DAY') {
    return 'bg-amber-500 text-white border-amber-500';
  }

  if (
    status === 'LEAVE' ||
    status === 'ON_LEAVE'
  ) {
    return 'bg-blue-600 text-white border-blue-600';
  }

  if (status === 'ABSENT') {
    return 'bg-red-600 text-white border-red-600';
  }

  return 'bg-purple-600 text-white border-purple-600';
};

const getCalendarDays = () => {
  const [year, month] =
    calendarMonth.split('-').map(Number);

  const firstDay =
    new Date(year, month - 1, 1);

  const totalDays =
    new Date(year, month, 0).getDate();

  // Convert JS Sunday-first numbering
  // into Monday-first numbering.
  const leadingBlankDays =
    (firstDay.getDay() + 6) % 7;

  const days: Array<
    | null
    | {
        day: number;
        date: string;
        attendance: any;
      }
  > = [];

  for (
    let index = 0;
    index < leadingBlankDays;
    index += 1
  ) {
    days.push(null);
  }

  for (
    let day = 1;
    day <= totalDays;
    day += 1
  ) {
    const date =
      `${year}-${String(month).padStart(2, '0')}-${String(
        day,
      ).padStart(2, '0')}`;

    days.push({
      day,
      date,
      attendance:
        getAttendanceForDate(date),
    });
  }

  return days;
};

const changeCalendarMonth = (
  direction: number,
) => {
  const [year, month] =
    calendarMonth.split('-').map(Number);

  const target =
    new Date(
      year,
      month - 1 + direction,
      1,
    );

  const nextMonth =
    `${target.getFullYear()}-${String(
      target.getMonth() + 1,
    ).padStart(2, '0')}`;

  setCalendarMonth(nextMonth);
};

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
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-lg font-bold text-gray-800">
        Monthly Attendance
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        View your attendance for the selected month.
      </p>
    </div>

    <input
      type="month"
      value={calendarMonth}
      onChange={(e) =>
        setCalendarMonth(e.target.value)
      }
      className="rounded-xl border p-3"
    />
  </div>

  <div className="mt-5 flex items-center justify-between">
    <button
      type="button"
      onClick={() =>
        changeCalendarMonth(-1)
      }
      className="flex h-10 w-10 items-center justify-center rounded-full border bg-white font-bold text-gray-700 shadow-sm"
    >
      ←
    </button>

    <p className="text-lg font-bold text-gray-900">
      {new Date(
        `${calendarMonth}-01T00:00:00`,
      ).toLocaleDateString(
        'en-IN',
        {
          month: 'long',
          year: 'numeric',
        },
      )}
    </p>

    <button
      type="button"
      onClick={() =>
        changeCalendarMonth(1)
      }
      className="flex h-10 w-10 items-center justify-center rounded-full border bg-white font-bold text-gray-700 shadow-sm"
    >
      →
    </button>
  </div>

  {loadingCalendar ? (
    <div className="py-10 text-center text-sm text-gray-500">
      Loading attendance...
    </div>
  ) : (
    <>
      <div className="mt-5 grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-500 sm:gap-2">
        {[
          'MON',
          'TUE',
          'WED',
          'THU',
          'FRI',
          'SAT',
          'SUN',
        ].map((day) => (
          <div
            key={day}
            className="py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {getCalendarDays().map(
          (calendarDay, index) => {
            if (!calendarDay) {
              return (
                <div
                  key={`blank-${index}`}
                  className="aspect-square"
                />
              );
            }

            const item =
              calendarDay.attendance;

            return (
              <button
                key={calendarDay.date}
                type="button"
                onClick={() => {
                  if (item) {
                    setSelectedCalendarAttendance(
                      item,
                    );
                  }
                }}
                className={`flex aspect-square items-center justify-center rounded-full border text-sm font-bold transition sm:text-base ${
                  getCalendarStatusClasses(
                    item,
                  )
                } ${
                  item
                    ? 'cursor-pointer hover:scale-105'
                    : 'cursor-default'
                }`}
              >
                {calendarDay.day}
              </button>
            );
          },
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-xs font-semibold text-gray-600">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-600" />
          Present
        </span>

        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500" />
          Half Day
        </span>

        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-600" />
          Leave
        </span>

        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-600" />
          Absent
        </span>

        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-gray-100 ring-1 ring-gray-300" />
          No Record
        </span>
      </div>
    </>
  )}

  {selectedCalendarAttendance && (
    <div className="mt-5 rounded-2xl border bg-gray-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-gray-900">
            {new Date(
              `${selectedCalendarAttendance.attendanceDate}T00:00:00`,
            ).toLocaleDateString(
              'en-IN',
              {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              },
            )}
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-600">
            Status:{' '}
            {selectedCalendarAttendance.status ||
              '-'}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setSelectedCalendarAttendance(
              null,
            )
          }
          className="rounded-lg border bg-white px-3 py-1 text-sm font-semibold text-gray-600"
        >
          Close
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-3">
          <p className="text-xs font-semibold uppercase text-gray-400">
            Punch In
          </p>

          <p className="mt-1 text-sm font-bold text-gray-800">
            {selectedCalendarAttendance.punchInTime
              ? new Date(
                  selectedCalendarAttendance.punchInTime,
                ).toLocaleTimeString(
                  'en-IN',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                )
              : '-'}
          </p>
        </div>

        <div className="rounded-xl bg-white p-3">
          <p className="text-xs font-semibold uppercase text-gray-400">
            Punch Out
          </p>

          <p className="mt-1 text-sm font-bold text-gray-800">
            {selectedCalendarAttendance.punchOutTime
              ? new Date(
                  selectedCalendarAttendance.punchOutTime,
                ).toLocaleTimeString(
                  'en-IN',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                )
              : '-'}
          </p>
        </div>

        <div className="rounded-xl bg-white p-3">
          <p className="text-xs font-semibold uppercase text-gray-400">
            Working Hours
          </p>

          <p className="mt-1 text-sm font-bold text-green-700">
            {selectedCalendarAttendance.workingHours ||
              0}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {selectedCalendarAttendance.punchInPhotoUrl && (
          <a
            href={
              selectedCalendarAttendance.punchInPhotoUrl
            }
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white"
          >
            In Photo
          </a>
        )}

        {selectedCalendarAttendance.punchOutPhotoUrl && (
          <a
            href={
              selectedCalendarAttendance.punchOutPhotoUrl
            }
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
          >
            Out Photo
          </a>
        )}

        {selectedCalendarAttendance.punchInLatitude &&
          selectedCalendarAttendance.punchInLongitude && (
            <a
              href={`https://www.google.com/maps?q=${selectedCalendarAttendance.punchInLatitude},${selectedCalendarAttendance.punchInLongitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white"
            >
              In GPS
            </a>
          )}

        {selectedCalendarAttendance.punchOutLatitude &&
          selectedCalendarAttendance.punchOutLongitude && (
            <a
              href={`https://www.google.com/maps?q=${selectedCalendarAttendance.punchOutLatitude},${selectedCalendarAttendance.punchOutLongitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white"
            >
              Out GPS
            </a>
          )}
      </div>

      {selectedCalendarAttendance.remarks && (
        <p className="mt-3 rounded-xl bg-white p-3 text-sm text-gray-600">
          {selectedCalendarAttendance.remarks}
        </p>
      )}
    </div>
  )}
</div>

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
'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { uploadPreparedFile } from '@/app/utils/fileUpload';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Staff = {
  id: number;
  fullName?: string;
  employeeCode?: string;
  photoUrl?: string;
  department?: string;
  branchName?: string;
};

export default function StaffAttendancePage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);

  

  const [
  monthlyAttendance,
  setMonthlyAttendance,
] = useState<any[]>([]);

const [calendarMonth, setCalendarMonth] =
  useState(
    new Date().toISOString().slice(0, 7),
  );

const [
  calendarStaffId,
  setCalendarStaffId,
] = useState('');

const [
  calendarStaffSearch,
  setCalendarStaffSearch,
] = useState('');

const [
  calendarStaffName,
  setCalendarStaffName,
] = useState('');

const [
  showCalendarStaffOptions,
  setShowCalendarStaffOptions,
] = useState(false);

const [
  selectedCalendarAttendance,
  setSelectedCalendarAttendance,
] = useState<any | null>(null);

const [
  loadingCalendar,
  setLoadingCalendar,
] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [
  attendanceExceptionRequests,
  setAttendanceExceptionRequests,
] = useState<any[]>([]);

const [
  exceptionStatusFilter,
  setExceptionStatusFilter,
] = useState('PENDING');

const [
  exceptionDateFilter,
  setExceptionDateFilter,
] = useState('');

const [
  exceptionStaffSearch,
  setExceptionStaffSearch,
] = useState('');

const [
  loadingExceptions,
  setLoadingExceptions,
] = useState(false);

const [
  reviewingExceptionId,
  setReviewingExceptionId,
] = useState<number | null>(null);

const [
  exceptionReviewRemarks,
  setExceptionReviewRemarks,
] = useState<Record<number, string>>({});

  const selfieInputRef = useRef<HTMLInputElement | null>(null);
const [pendingPunchType, setPendingPunchType] =
  useState<'punch-in' | 'punch-out' | null>(null);

  const [staffSearch, setStaffSearch] = useState('');
const [showStaffOptions, setShowStaffOptions] = useState(false);
const [selectedStaffName, setSelectedStaffName] = useState('');

  const headers = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const getErrorMessage = (
  error: any,
  fallback: string,
) => {
  const message =
    error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string') {
    return message;
  }

  return error?.message || fallback;
};

  const fetchStaff = async () => {
    const res = await axios.get(`${API_BASE_URL}/staff`, {
      params: { page: 1, limit: 100, showHidden: false },
      headers: headers(),
    });

    setStaff(res.data?.data || []);
  };

  const fetchAttendance = async () => {
    const res = await axios.get(`${API_BASE_URL}/staff/attendance`, {
      params: {
        date: attendanceDate,
        limit: 100,
      },
      headers: headers(),
    });

    setAttendance(res.data?.data || []);
  };

  const fetchMonthlyAttendance = async (
  staffId = calendarStaffId,
  month = calendarMonth,
) => {
  if (!staffId || !month) {
    setMonthlyAttendance([]);
    setSelectedCalendarAttendance(null);
    return;
  }

  try {
    setLoadingCalendar(true);

    const [year, monthNumber] =
      month.split('-').map(Number);

    const fromDate =
      `${year}-${String(
        monthNumber,
      ).padStart(2, '0')}-01`;

    const lastDay =
      new Date(
        year,
        monthNumber,
        0,
      ).getDate();

    const toDate =
      `${year}-${String(
        monthNumber,
      ).padStart(2, '0')}-${String(
        lastDay,
      ).padStart(2, '0')}`;

    const res = await axios.get(
      `${API_BASE_URL}/staff/attendance`,
      {
        params: {
          staffId: Number(staffId),
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

    setSelectedCalendarAttendance(
      null,
    );
  } catch (error: any) {
    console.error(error);

    setMonthlyAttendance([]);
    setSelectedCalendarAttendance(
      null,
    );

    alert(
      getErrorMessage(
        error,
        'Failed to load monthly attendance',
      ),
    );
  } finally {
    setLoadingCalendar(false);
  }
};

  const fetchAttendanceExceptions =
  async () => {
    try {
      setLoadingExceptions(true);

      const response = await axios.get(
        `${API_BASE_URL}/staff/attendance-exception-requests`,
        {
          params: {
            page: 1,
            limit: 100,

            status:
              exceptionStatusFilter ||
              undefined,

            attendanceDate:
              exceptionDateFilter ||
              undefined,

            search:
              exceptionStaffSearch.trim() ||
              undefined,
          },
          headers: headers(),
        },
      );

      const responseData =
        response.data;

      if (Array.isArray(responseData)) {
        setAttendanceExceptionRequests(
          responseData,
        );
      } else if (
        Array.isArray(responseData?.data)
      ) {
        setAttendanceExceptionRequests(
          responseData.data,
        );
      } else if (
        Array.isArray(responseData?.items)
      ) {
        setAttendanceExceptionRequests(
          responseData.items,
        );
      } else {
        setAttendanceExceptionRequests([]);
      }
    } catch (error: any) {
      console.error(error);

      alert(
        getErrorMessage(
          error,
          'Failed to load attendance exception requests',
        ),
      );
    } finally {
      setLoadingExceptions(false);
    }
  };

  useEffect(() => {
  fetchStaff();
  fetchAttendance();
  fetchAttendanceExceptions();

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

  const uploadAttendancePhoto = async (file: File) => {
  if (!file) return '';

    const token = localStorage.getItem('token');

    const fileUrl = await uploadPreparedFile({
      file,
      endpoint: `${API_BASE_URL}/staff/attendance/photo-upload`,
      token,
      fieldName: 'files',
    });

    return fileUrl;
  };

  const submitPunch = async (
  type: 'punch-in' | 'punch-out',
  selfieFile: File,
) => {
  if (!selectedStaffId) {
    alert('Please select staff');
    return;
  }

  try {
    setLoading(true);

    const position = await getLocation();
    const photoUrl = await uploadAttendancePhoto(selfieFile);

    await axios.post(
      `${API_BASE_URL}/staff/attendance/${type}`,
      {
        staffId: Number(selectedStaffId),
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
    fetchAttendance();
    setSelectedStaffId('');
    setSelectedStaffName('');
    setStaffSearch('');
    setShowStaffOptions(false);
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || error?.message || 'Attendance failed');
  } finally {
    setLoading(false);
  }
};

const startSelfiePunch = (type: 'punch-in' | 'punch-out') => {
  if (!selectedStaffId) {
    alert('Please select staff');
    return;
  }

  setPendingPunchType(type);
  selfieInputRef.current?.click();
};

const reviewAttendanceException =
  async (
    request: any,
    decision: 'APPROVED' | 'REJECTED',
  ) => {
    const remarks =
      exceptionReviewRemarks[
        request.id
      ]?.trim() || '';

    if (
      decision === 'REJECTED' &&
      !remarks
    ) {
      alert(
        'Please enter rejection remarks',
      );
      return;
    }

    const confirmed =
      window.confirm(
        decision === 'APPROVED'
          ? `Approve this attendance exception for ${
              request.staffName ||
              `Staff #${request.staffId}`
            }? Attendance will be created using the original attempted time.`
          : `Reject this attendance exception for ${
              request.staffName ||
              `Staff #${request.staffId}`
            }?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setReviewingExceptionId(
        request.id,
      );

      await axios.patch(
        `${API_BASE_URL}/staff/attendance-exception-requests/${request.id}/review`,
        {
          status: decision,
          approvalRemarks:
            remarks || null,
        },
        {
          headers: headers(),
        },
      );

      alert(
        decision === 'APPROVED'
          ? 'Attendance exception approved and attendance created'
          : 'Attendance exception rejected',
      );

      setExceptionReviewRemarks(
        (current) => {
          const updated = {
            ...current,
          };

          delete updated[
            request.id
          ];

          return updated;
        },
      );

      await Promise.all([
        fetchAttendanceExceptions(),
        fetchAttendance(),
      ]);
    } catch (error: any) {
      console.error(error);

      alert(
        getErrorMessage(
          error,
          'Failed to review attendance exception request',
        ),
      );
    } finally {
      setReviewingExceptionId(null);
    }
  };

  const filteredStaff = staff.filter((item) => {
  const text = `${item.fullName || ''} ${item.employeeCode || ''} ${item.department || ''} ${item.branchName || ''}`.toLowerCase();

  return text.includes(staffSearch.toLowerCase());
});

const filteredCalendarStaff =
  staff.filter((item) => {
    const text =
      `${item.fullName || ''} ${
        item.employeeCode || ''
      } ${
        item.department || ''
      } ${
        item.branchName || ''
      }`.toLowerCase();

    return text.includes(
      calendarStaffSearch.toLowerCase(),
    );
  });

const getCalendarAttendanceForDate = (
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

  if (status === 'PRESENT') {
    return 'bg-green-600 text-white border-green-600';
  }

  if (status === 'HALF_DAY') {
    return 'bg-amber-500 text-white border-amber-500';
  }

  if (status === 'LEAVE') {
    return 'bg-blue-600 text-white border-blue-600';
  }

  if (status === 'ABSENT') {
    return 'bg-red-600 text-white border-red-600';
  }

  if (status === 'WEEKLY_OFF') {
    return 'bg-gray-500 text-white border-gray-500';
  }

  if (status === 'HOLIDAY') {
    return 'bg-purple-600 text-white border-purple-600';
  }

  return 'bg-gray-100 text-gray-600 border-gray-200';
};

const getCalendarDays = () => {
  const [year, month] =
    calendarMonth.split('-').map(Number);

  const firstDay =
    new Date(
      year,
      month - 1,
      1,
    );

  const totalDays =
    new Date(
      year,
      month,
      0,
    ).getDate();

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
      `${year}-${String(
        month,
      ).padStart(2, '0')}-${String(
        day,
      ).padStart(2, '0')}`;

    days.push({
      day,
      date,
      attendance:
        getCalendarAttendanceForDate(
          date,
        ),
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

  if (calendarStaffId) {
    fetchMonthlyAttendance(
      calendarStaffId,
      nextMonth,
    );
  }
};

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Staff Attendance
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          GPS and photo based staff punch in / punch out.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          Mark Attendance
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="relative">
  <input
    placeholder="Search Staff by Name / Code / Department / Branch"
    value={staffSearch || selectedStaffName}
    onChange={(e) => {
      setStaffSearch(e.target.value);
      setSelectedStaffName('');
      setSelectedStaffId('');
      setShowStaffOptions(true);
    }}
    onFocus={() => setShowStaffOptions(true)}
    className="w-full rounded-xl border p-3"
  />

  {showStaffOptions && (
    <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow">
      {filteredStaff.length === 0 ? (
        <div className="p-3 text-sm text-gray-500">
          No matching staff found
        </div>
      ) : (
        filteredStaff.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setSelectedStaffId(String(item.id));
              setSelectedStaffName(
                `${item.fullName || 'Unnamed'} ${
                  item.employeeCode ? `(${item.employeeCode})` : ''
                }`,
              );
              setStaffSearch('');
              setShowStaffOptions(false);
            }}
            className="block w-full border-b p-3 text-left text-sm hover:bg-blue-50"
          >
            <p className="font-semibold text-gray-800">
              {item.fullName || 'Unnamed'}
              {item.employeeCode ? ` (${item.employeeCode})` : ''}
            </p>
            <p className="text-xs text-gray-500">
              {item.department || '-'} | {item.branchName || '-'}
            </p>
          </button>
        ))
      )}
    </div>
  )}
</div>

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

    await submitPunch(pendingPunchType, file);

    setPendingPunchType(null);
    e.target.value = '';
  }}
/>
        </div>

        <textarea
          placeholder="Attendance remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="mt-3 w-full rounded-xl border p-3"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => startSelfiePunch('punch-in')}
            disabled={loading}
            className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            Punch In
          </button>

          <button
            onClick={() => startSelfiePunch('punch-out')}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            Punch Out
          </button>

          <button
            onClick={fetchAttendance}
            className="rounded-xl bg-gray-800 px-5 py-3 font-semibold text-white"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 className="text-lg font-bold text-gray-800">
        Monthly Attendance Calendar
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Select an employee to view their monthly attendance.
      </p>
    </div>

    <input
      type="month"
      value={calendarMonth}
      onChange={(e) => {
        const nextMonth =
          e.target.value;

        setCalendarMonth(
          nextMonth,
        );

        if (calendarStaffId) {
          fetchMonthlyAttendance(
            calendarStaffId,
            nextMonth,
          );
        }
      }}
      className="rounded-xl border p-3"
    />
  </div>

  <div className="relative mt-4">
    <input
      placeholder="Search Employee by Name / Code / Department / Branch"
      value={
        calendarStaffSearch ||
        calendarStaffName
      }
      onChange={(e) => {
        setCalendarStaffSearch(
          e.target.value,
        );

        setCalendarStaffName('');
        setCalendarStaffId('');
        setMonthlyAttendance([]);
        setSelectedCalendarAttendance(
          null,
        );
        setShowCalendarStaffOptions(
          true,
        );
      }}
      onFocus={() =>
        setShowCalendarStaffOptions(
          true,
        )
      }
      className="w-full rounded-xl border p-3"
    />

    {showCalendarStaffOptions && (
      <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow">
        {filteredCalendarStaff.length ===
        0 ? (
          <div className="p-3 text-sm text-gray-500">
            No matching staff found
          </div>
        ) : (
          filteredCalendarStaff.map(
            (item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  const staffId =
                    String(item.id);

                  setCalendarStaffId(
                    staffId,
                  );

                  setCalendarStaffName(
                    `${item.fullName || 'Unnamed'} ${
                      item.employeeCode
                        ? `(${item.employeeCode})`
                        : ''
                    }`,
                  );

                  setCalendarStaffSearch(
                    '',
                  );

                  setShowCalendarStaffOptions(
                    false,
                  );

                  fetchMonthlyAttendance(
                    staffId,
                    calendarMonth,
                  );
                }}
                className="block w-full border-b p-3 text-left text-sm hover:bg-blue-50"
              >
                <p className="font-semibold text-gray-800">
                  {item.fullName ||
                    'Unnamed'}

                  {item.employeeCode
                    ? ` (${item.employeeCode})`
                    : ''}
                </p>

                <p className="text-xs text-gray-500">
                  {item.department ||
                    '-'}{' '}
                  |{' '}
                  {item.branchName ||
                    '-'}
                </p>
              </button>
            ),
          )
        )}
      </div>
    )}
  </div>

  {!calendarStaffId ? (
    <div className="mt-5 rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">
      Select an employee to view
      attendance.
    </div>
  ) : (
    <>
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

        <div className="text-center">
          <p className="font-bold text-gray-900">
            {calendarStaffName}
          </p>

          <p className="text-sm font-semibold text-gray-500">
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
        </div>

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
              (
                calendarDay,
                index,
              ) => {
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
                    key={
                      calendarDay.date
                    }
                    type="button"
                    onClick={() => {
                      if (item) {
                        setSelectedCalendarAttendance(
                          item,
                        );
                      }
                    }}
                    className={`flex aspect-square items-center justify-center rounded-full border text-sm font-bold transition sm:text-base ${getCalendarStatusClasses(
                      item,
                    )} ${
                      item
                        ? 'cursor-pointer hover:scale-105'
                        : 'cursor-default'
                    }`}
                  >
                    {
                      calendarDay.day
                    }
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
  <span className="h-3 w-3 rounded-full bg-gray-500" />
  Weekly Off
</span>

<span className="flex items-center gap-2">
  <span className="h-3 w-3 rounded-full bg-purple-600" />
  Holiday
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
                        hour:
                          '2-digit',
                        minute:
                          '2-digit',
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
                        hour:
                          '2-digit',
                        minute:
                          '2-digit',
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
              {
                selectedCalendarAttendance
                  .remarks
              }
            </p>
          )}
        </div>
      )}
    </>
  )}
</div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 className="text-lg font-bold text-gray-800">
        Attendance Exception Requests
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Review attendance attempts made outside the allowed GPS radius.
        Approval creates attendance using the employee’s original attempted
        time.
      </p>
    </div>

    <button
      type="button"
      onClick={fetchAttendanceExceptions}
      disabled={loadingExceptions}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
    >
      {loadingExceptions ? 'Loading...' : 'Refresh'}
    </button>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-3">
    <input
      value={exceptionStaffSearch}
      onChange={(event) =>
        setExceptionStaffSearch(event.target.value)
      }
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          fetchAttendanceExceptions();
        }
      }}
      placeholder="Search employee name"
      className="rounded-xl border p-3"
    />

    <input
      type="date"
      value={exceptionDateFilter}
      onChange={(event) =>
        setExceptionDateFilter(event.target.value)
      }
      className="rounded-xl border p-3"
    />

    <select
      value={exceptionStatusFilter}
      onChange={(event) =>
        setExceptionStatusFilter(event.target.value)
      }
      className="rounded-xl border p-3"
    >
      <option value="">All Statuses</option>
      <option value="PENDING">Pending</option>
      <option value="APPROVED">Approved</option>
      <option value="REJECTED">Rejected</option>
      <option value="CANCELLED">Cancelled</option>
    </select>
  </div>

  <div className="mt-3 flex flex-wrap gap-3">
    <button
      type="button"
      onClick={fetchAttendanceExceptions}
      disabled={loadingExceptions}
      className="rounded-xl bg-gray-800 px-5 py-3 font-semibold text-white disabled:opacity-50"
    >
      Apply Filters
    </button>

    <button
      type="button"
      onClick={() => {
        setExceptionStaffSearch('');
        setExceptionDateFilter('');
        setExceptionStatusFilter('PENDING');

        setTimeout(() => {
          fetchAttendanceExceptions();
        }, 0);
      }}
      disabled={loadingExceptions}
      className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 disabled:opacity-50"
    >
      Clear Filters
    </button>
  </div>

  <div className="mt-5 space-y-4">
    {loadingExceptions ? (
      <p className="text-sm text-gray-500">
        Loading attendance exception requests...
      </p>
    ) : attendanceExceptionRequests.length === 0 ? (
      <p className="text-sm text-gray-500">
        No attendance exception requests found.
      </p>
    ) : (
      attendanceExceptionRequests.map((request) => {
        const statusClass =
          request.status === 'APPROVED'
            ? 'bg-green-100 text-green-800'
            : request.status === 'REJECTED'
              ? 'bg-red-100 text-red-800'
              : request.status === 'CANCELLED'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-amber-100 text-amber-800';

        const isReviewing =
          reviewingExceptionId === request.id;

        return (
          <div
            key={request.id}
            className="rounded-xl border p-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-gray-900">
                    {request.staffName ||
                      `Staff #${request.staffId}`}
                  </h3>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
                  >
                    {request.status}
                  </span>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                    {request.punchType === 'PUNCH_IN'
                      ? 'PUNCH IN'
                      : 'PUNCH OUT'}
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-600">
                  Attendance Date: {request.attendanceDate || '-'}
                </p>

                <p className="text-sm text-gray-600">
                  Attempted At:{' '}
                  {request.attemptedAt
                    ? new Date(request.attemptedAt).toLocaleString(
                        'en-IN',
                      )
                    : '-'}
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  Approved Location:{' '}
                  <span className="font-semibold text-gray-900">
                    {request.attendanceLocationName || '-'}
                  </span>
                </p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-red-50 p-3">
                    <p className="text-xs font-semibold uppercase text-red-700">
                      Employee Distance
                    </p>

                    <p className="mt-1 font-bold text-red-800">
                      {Number(request.distanceMeters || 0).toFixed(2)}{' '}
                      metres
                    </p>
                  </div>

                  <div className="rounded-xl bg-green-50 p-3">
                    <p className="text-xs font-semibold uppercase text-green-700">
                      Allowed Radius
                    </p>

                    <p className="mt-1 font-bold text-green-800">
                      {Number(
                        request.allowedRadiusMeters || 0,
                      ).toFixed(0)}{' '}
                      metres
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Employee Reason
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {request.employeeReason || '-'}
                  </p>
                </div>

                {request.gpsAddress && (
                  <div className="mt-3 rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Attempt GPS Address
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      {request.gpsAddress}
                    </p>
                  </div>
                )}

                {request.approvalRemarks && (
                  <div className="mt-3 rounded-xl bg-blue-50 p-3">
                    <p className="text-xs font-semibold uppercase text-blue-700">
                      Review Remarks
                    </p>

                    <p className="mt-1 text-sm text-blue-900">
                      {request.approvalRemarks}
                    </p>
                  </div>
                )}

                {request.reviewedAt && (
                  <p className="mt-3 text-xs text-gray-500">
                    Reviewed by {request.reviewedByName || '-'} on{' '}
                    {new Date(request.reviewedAt).toLocaleString(
                      'en-IN',
                    )}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {request.photoUrl && (
                  <a
                    href={request.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    View Selfie
                  </a>
                )}

                {request.latitude && request.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Open GPS
                  </a>
                )}
              </div>
            </div>

            {request.status === 'PENDING' && (
              <div className="mt-4 border-t pt-4">
                <label className="text-sm font-semibold text-gray-700">
                  Review Remarks
                </label>

                <textarea
                  value={
                    exceptionReviewRemarks[request.id] || ''
                  }
                  onChange={(event) =>
                    setExceptionReviewRemarks((current) => ({
                      ...current,
                      [request.id]: event.target.value,
                    }))
                  }
                  placeholder="Add approval or rejection remarks"
                  className="mt-1 min-h-24 w-full rounded-xl border p-3"
                />

                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={isReviewing}
                    onClick={() =>
                      reviewAttendanceException(
                        request,
                        'APPROVED',
                      )
                    }
                    className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {isReviewing
                      ? 'Processing...'
                      : 'Approve Exception'}
                  </button>

                  <button
                    type="button"
                    disabled={isReviewing}
                    onClick={() =>
                      reviewAttendanceException(
                        request,
                        'REJECTED',
                      )
                    }
                    className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {isReviewing
                      ? 'Processing...'
                      : 'Reject Exception'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })
    )}
  </div>
</div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-800">
            Attendance Register
          </h2>

          <button
            onClick={fetchAttendance}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Apply Date
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {attendance.length === 0 ? (
            <p className="text-sm text-gray-500">No attendance found.</p>
          ) : (
            attendance.map((item) => (
              <div key={item.id} className="rounded-xl border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-bold text-gray-900">
                      {item.staffName || `Staff #${item.staffId}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      Date: {item.attendanceDate} | Status: {item.status}
                    </p>
                    <p className="text-sm text-gray-500">
                      Punch In:{' '}
                      {item.punchInTime
                        ? new Date(item.punchInTime).toLocaleString('en-IN')
                        : '-'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Punch Out:{' '}
                      {item.punchOutTime
                        ? new Date(item.punchOutTime).toLocaleString('en-IN')
                        : '-'}
                    </p>
                    <p className="text-sm font-semibold text-green-700">
                      Working Hours: {item.workingHours || 0}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.punchInPhotoUrl && (
                      <a
                        href={item.punchInPhotoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        In Photo
                      </a>
                    )}

                    {item.punchOutPhotoUrl && (
                      <a
                        href={item.punchOutPhotoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Out Photo
                      </a>
                    )}

                    {item.punchInLatitude && item.punchInLongitude && (
                      <a
                        href={`https://www.google.com/maps?q=${item.punchInLatitude},${item.punchInLongitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white"
                      >
                        In GPS
                      </a>
                    )}

                    {item.punchOutLatitude && item.punchOutLongitude && (
                      <a
                        href={`https://www.google.com/maps?q=${item.punchOutLatitude},${item.punchOutLongitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Out GPS
                      </a>
                    )}
                  </div>
                </div>

                {item.remarks && (
                  <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                    {item.remarks}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
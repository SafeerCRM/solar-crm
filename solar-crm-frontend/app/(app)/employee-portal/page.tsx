'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { uploadPreparedFile } from '@/app/utils/fileUpload';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function EmployeePortalPage() {
  const [activeTab, setActiveTab] = useState<
  | 'dashboard'
  | 'attendance'
  | 'leave'
  | 'payroll'
  | 'policies'
>('dashboard');
  const [staff, setStaff] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [calendarAttendance, setCalendarAttendance] =
  useState<any[]>([]);

const [attendanceMonth, setAttendanceMonth] =
  useState(
    new Date()
      .toISOString()
      .slice(0, 7),
  );
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveSummary, setLeaveSummary] = useState({
  totalRequests: 0,
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
  const [attendanceExceptionAttempt, setAttendanceExceptionAttempt] =
  useState<any>(null);

const [attendanceExceptionReason, setAttendanceExceptionReason] =
  useState('');

const [attendanceExceptionSubmitting, setAttendanceExceptionSubmitting] =
  useState(false);

const [attendanceExceptionRequests, setAttendanceExceptionRequests] =
  useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);

  const [payrolls, setPayrolls] =
  useState<any[]>([]);

const [selectedPayroll, setSelectedPayroll] =
  useState<any>(null);

const [payrollMonth, setPayrollMonth] =
  useState(
    new Date()
      .toISOString()
      .slice(0, 7),
  );

  const [leaveMonth, setLeaveMonth] =
  useState(
    new Date()
      .toISOString()
      .slice(0, 7),
  );

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

  const loadAttendanceCalendar = async (
  month = attendanceMonth,
) => {
  try {
    const [year, monthNumber] =
      month.split('-').map(Number);

    const lastDay =
      new Date(
        year,
        monthNumber,
        0,
      ).getDate();

    const fromDate =
      `${month}-01`;

    const toDate =
      `${month}-${String(
        lastDay,
      ).padStart(2, '0')}`;

    const response =
      await axios.get(
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

    setCalendarAttendance(
      response.data?.data || [],
    );
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Unable to load attendance calendar',
    );
  }
};

const loadAttendanceDate = async (
  date: string,
) => {
  try {
    const response =
      await axios.get(
        `${API_BASE_URL}/staff/self/attendance`,
        {
          params: {
            date,
            limit: 20,
          },
          headers: headers(),
        },
      );

    setAttendance(
      response.data?.data || [],
    );
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Unable to load attendance details',
    );
  }
};

  const loadPortal = async () => {
    try {
      const [
  meRes,
  attendanceRes,
  leavesRes,
  payrollRes,
  policiesRes,
  attendanceExceptionRes,
] = await Promise.all([
        axios.get(`${API_BASE_URL}/staff/self/me`, { headers: headers() }),
        axios.get(`${API_BASE_URL}/staff/self/attendance`, {
          params: { date: attendanceDate, limit: 20 },
          headers: headers(),
        }),
        axios.get(
  `${API_BASE_URL}/staff/self/leaves`,
  {
    params: {
      limit: 20,
      payrollMonth: leaveMonth,
    },
    headers: headers(),
  },
),
        axios.get(
  `${API_BASE_URL}/staff/self/payrolls`,
  {
    params: {
      payrollMonth,
      limit: 12,
    },
    headers: headers(),
  },
),
        axios.get(`${API_BASE_URL}/staff/self/employee-policies`, {
  params: { limit: 50 },
  headers: headers(),
}),
axios.get(
  `${API_BASE_URL}/staff/self/attendance-exceptions`,
  {
    params: {
      limit: 50,
    },
    headers: headers(),
  },
),
      ]);

      setStaff(meRes.data || null);
      setAttendance(attendanceRes.data?.data || []);
      setLeaves(leavesRes.data?.data || []);
      setLeaveSummary({
  totalRequests: Number(
    leavesRes.data?.summary?.totalRequests || 0,
  ),
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
setPayrolls(
  payrollRes.data?.data || [],
);
      setPolicies(policiesRes.data?.data || []);
      setAttendanceExceptionRequests(
  attendanceExceptionRes.data?.data || [],
);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Unable to load employee portal');
    }
  };

  useEffect(() => {
    loadPortal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  if (activeTab !== 'payroll') {
    return;
  }

  loadPortal();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [payrollMonth]);

useEffect(() => {
  if (activeTab !== 'leave') {
    return;
  }

  loadPortal();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [leaveMonth]);

useEffect(() => {
  if (activeTab !== 'attendance') {
    return;
  }

  loadAttendanceCalendar();

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTab, attendanceMonth]);

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

    // Remove any previous failed-attempt form before a new punch.
    setAttendanceExceptionAttempt(null);
    setAttendanceExceptionReason('');

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
        latitude: String(
          position.coords.latitude,
        ),
        longitude: String(
          position.coords.longitude,
        ),
        gpsAddress:
          `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`,
        photoUrl,
        remarks: attendanceRemarks,
      },
      {
        headers: headers(),
      },
    );

    alert(
      type === 'punch-in'
        ? 'Punch in saved'
        : 'Punch out saved',
    );

    setAttendancePhoto(null);
    setAttendanceRemarks('');
    setAttendanceExceptionAttempt(null);
    setAttendanceExceptionReason('');

    await loadPortal();
    await loadAttendanceCalendar();
  } catch (error: any) {
    console.error(error);

    const errorData =
      error?.response?.data || {};

    if (
      errorData?.code ===
      'ATTENDANCE_LOCATION_OUTSIDE_RADIUS'
    ) {
      setAttendanceExceptionAttempt({
        ...errorData,

        punchType:
          errorData.punchType ||
          (type === 'punch-in'
            ? 'PUNCH_IN'
            : 'PUNCH_OUT'),

        attendanceDate:
          errorData.attendanceDate ||
          attendanceDate,
      });

      setAttendanceExceptionReason('');

      return;
    }

    const errorMessage =
      typeof errorData?.message === 'string'
        ? errorData.message
        : error?.message ||
          'Attendance failed';

    alert(errorMessage);
  } finally {
    setLoading(false);
  }
};

const submitAttendanceException = async () => {
  if (!attendanceExceptionAttempt) {
    alert('No failed attendance attempt found');
    return;
  }

  const reason =
    attendanceExceptionReason.trim();

  if (!reason) {
    alert(
      'Please enter the reason for requesting an attendance exception',
    );
    return;
  }

  try {
    setAttendanceExceptionSubmitting(true);

    await axios.post(
      `${API_BASE_URL}/staff/self/attendance-exceptions`,
      {
        attendanceDate:
          attendanceExceptionAttempt.attendanceDate,

        punchType:
          attendanceExceptionAttempt.punchType,

        attemptedAt:
          attendanceExceptionAttempt.attemptedAt,

        latitude:
          attendanceExceptionAttempt.latitude,

        longitude:
          attendanceExceptionAttempt.longitude,

        gpsAddress:
          attendanceExceptionAttempt.gpsAddress ||
          '',

        photoUrl:
          attendanceExceptionAttempt.photoUrl ||
          '',

        employeeReason: reason,
      },
      {
        headers: headers(),
      },
    );

    alert(
      'Attendance exception request submitted for approval',
    );

    setAttendanceExceptionAttempt(null);
    setAttendanceExceptionReason('');

    await loadPortal();
  } catch (error: any) {
    console.error(error);

    const errorData =
      error?.response?.data || {};

    const errorMessage =
      typeof errorData?.message === 'string'
        ? errorData.message
        : error?.message ||
          'Failed to submit attendance exception request';

    alert(errorMessage);
  } finally {
    setAttendanceExceptionSubmitting(false);
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

      const response = await axios.post(
  `${API_BASE_URL}/staff/self/leave`,
  {
    ...leaveForm,
    proofUrl,
  },
  {
    headers: headers(),
  },
);

const requestNumber =
  Number(
    response.data?.monthRequestNumber || 0,
  );

alert(
  requestNumber > 0
    ? `Leave Request #${requestNumber} submitted successfully`
    : 'Leave request submitted successfully',
);
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

  const openPayroll = async (payrollId: number) => {
  try {
    setLoading(true);

    const response = await axios.get(
      `${API_BASE_URL}/staff/self/payroll/${payrollId}`,
      {
        headers: headers(),
      },
    );

    setSelectedPayroll(
      response.data?.payroll || null,
    );
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Unable to load payroll details',
    );
  } finally {
    setLoading(false);
  }
};

const downloadSalarySlip = async (
  payrollId: number,
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/staff/self/payroll/${payrollId}/salary-slip`,
      {
        headers: headers(),
        responseType: 'blob',
      },
    );

    const blob = new Blob([response.data], {
      type: 'application/pdf',
    });

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;
    link.download = `Salary-Slip-${payrollId}.pdf`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Unable to download salary slip',
    );
  }
};

const formatMoney = (value: any) =>
  Number(value || 0).toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 2,
    },
  );

const formatMetricLabel = (
  value: string,
) =>
  String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );

    const getAttendanceStatusStyle = (
  status?: string,
) => {
  switch (status) {
    case 'PRESENT':
      return 'bg-green-500 text-white';

    case 'HALF_DAY':
      return 'bg-amber-400 text-white';

    case 'ABSENT':
      return 'bg-red-500 text-white';

    case 'LEAVE':
      return 'bg-blue-500 text-white';

    case 'WEEKLY_OFF':
      return 'bg-gray-400 text-white';

    case 'HOLIDAY':
      return 'bg-purple-500 text-white';

    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getAttendanceStatusLabel = (
  status?: string,
) => {
  switch (status) {
    case 'PRESENT':
      return 'Present';

    case 'HALF_DAY':
      return 'Half Day';

    case 'ABSENT':
      return 'Absent';

    case 'LEAVE':
      return 'Leave';

    case 'WEEKLY_OFF':
      return 'Weekly Off';

    case 'HOLIDAY':
      return 'Holiday';

    default:
      return 'No Record';
  }
};

const getCalendarDays = () => {
  const [year, month] =
    attendanceMonth
      .split('-')
      .map(Number);

  const daysInMonth =
    new Date(
      year,
      month,
      0,
    ).getDate();

  const firstDay =
    new Date(
      year,
      month - 1,
      1,
    ).getDay();

  // Convert Sunday-first JS indexing
  // into Monday-first calendar indexing.
  const leadingEmptyDays =
    (firstDay + 6) % 7;

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
    index < leadingEmptyDays;
    index += 1
  ) {
    days.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day += 1
  ) {
    const date =
      `${attendanceMonth}-${String(
        day,
      ).padStart(2, '0')}`;

    const record =
      calendarAttendance.find(
        (item) =>
          item.attendanceDate ===
          date,
      );

    days.push({
      day,
      date,
      attendance: record || null,
    });
  }

  return days;
};

const changeAttendanceMonth = (
  offset: number,
) => {
  const [year, month] =
    attendanceMonth
      .split('-')
      .map(Number);

  const nextMonth =
    new Date(
      year,
      month - 1 + offset,
      1,
    );

  const nextYear =
    nextMonth.getFullYear();

  const nextMonthNumber =
    String(
      nextMonth.getMonth() + 1,
    ).padStart(2, '0');

  setAttendanceMonth(
    `${nextYear}-${nextMonthNumber}`,
  );
};

const calendarDays =
  getCalendarDays();

const attendanceMonthLabel =
  new Date(
    `${attendanceMonth}-01T00:00:00`,
  ).toLocaleDateString(
    'en-IN',
    {
      month: 'long',
      year: 'numeric',
    },
  );

const todayDate =
  new Date()
    .toISOString()
    .slice(0, 10);

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
          ['payroll','Payroll'],
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
    Approved Leave Days This Month
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
  <div className="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 className="text-lg font-bold text-gray-800">
        My Attendance Calendar
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Monthly attendance overview
      </p>
    </div>

    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() =>
          changeAttendanceMonth(-1)
        }
        className="rounded-xl border bg-white px-4 py-2 font-bold text-gray-700"
      >
        ←
      </button>

      <div className="min-w-40 text-center font-bold text-gray-900">
        {attendanceMonthLabel}
      </div>

      <button
        type="button"
        onClick={() =>
          changeAttendanceMonth(1)
        }
        className="rounded-xl border bg-white px-4 py-2 font-bold text-gray-700"
      >
        →
      </button>
    </div>
  </div>

  <div className="mt-6 grid grid-cols-7 gap-1 text-center sm:gap-2">
    {[
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ].map((day) => (
      <div
        key={day}
        className="pb-2 text-xs font-bold uppercase text-gray-500"
      >
        {day}
      </div>
    ))}

    {calendarDays.map(
      (calendarDay, index) => {
        if (!calendarDay) {
          return (
            <div
              key={`empty-${index}`}
              className="aspect-square"
            />
          );
        }

        const record =
          calendarDay.attendance;

        const isSelected =
          calendarDay.date ===
          attendanceDate;

        const isToday =
          calendarDay.date ===
          todayDate;

        const isFuture =
          calendarDay.date >
          todayDate;

        return (
          <button
            key={calendarDay.date}
            type="button"
            disabled={isFuture}
            onClick={async () => {
              setAttendanceDate(
                calendarDay.date,
              );

              await loadAttendanceDate(
                calendarDay.date,
              );
            }}
            className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border p-1 transition ${
              isSelected
                ? 'border-blue-600 ring-2 ring-blue-100'
                : 'border-gray-100'
            } ${
              isFuture
                ? 'cursor-default opacity-40'
                : 'hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold sm:h-10 sm:w-10 ${
                record
                  ? getAttendanceStatusStyle(
                      record.status,
                    )
                  : isToday
                    ? 'border-2 border-blue-500 bg-white text-blue-700'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              {calendarDay.day}
            </span>

            <span className="mt-1 hidden max-w-full truncate text-[10px] font-semibold text-gray-500 sm:block">
              {isFuture
                ? ''
                : getAttendanceStatusLabel(
                    record?.status,
                  )}
            </span>

            {record?.isLate && (
              <span
                className="absolute right-1 top-1 h-2 w-2 rounded-full bg-orange-500"
                title="Late"
              />
            )}

            {record?.isEarlyCheckout && (
              <span
                className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-rose-500"
                title="Early Checkout"
              />
            )}
          </button>
        );
      },
    )}
  </div>

  <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 border-t pt-4">
    {[
      [
        'bg-green-500',
        'Present',
      ],
      [
        'bg-amber-400',
        'Half Day',
      ],
      [
        'bg-red-500',
        'Absent',
      ],
      [
        'bg-blue-500',
        'Leave',
      ],
      [
        'bg-gray-400',
        'Weekly Off',
      ],
      [
        'bg-purple-500',
        'Holiday',
      ],
      [
        'bg-gray-100 border',
        'No Record',
      ],
    ].map(
      ([className, label]) => (
        <div
          key={label}
          className="flex items-center gap-2 text-xs font-semibold text-gray-600"
        >
          <span
            className={`h-3 w-3 rounded-full ${className}`}
          />

          {label}
        </div>
      ),
    )}
  </div>

  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
    <span className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-orange-500" />
      Late
    </span>

    <span className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-rose-500" />
      Early Checkout
    </span>
  </div>
</div>
          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-lg font-bold text-gray-800">Mark Attendance</h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
  type="date"
  value={attendanceDate}
  onChange={async (e) => {
    const date =
      e.target.value;

    setAttendanceDate(date);

    if (date) {
      await loadAttendanceDate(
        date,
      );
    }
  }}
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

          {attendanceExceptionAttempt && (
  <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow">
    <h2 className="text-lg font-bold text-amber-900">
      Attendance Outside Allowed Location
    </h2>

    <p className="mt-2 text-sm text-amber-800">
      Your attendance was not saved because you were outside the
      configured attendance radius.
    </p>

    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <div className="rounded-xl bg-white p-4">
        <p className="text-xs font-semibold uppercase text-gray-500">
          Punch Type
        </p>

        <p className="mt-1 font-bold text-gray-900">
          {attendanceExceptionAttempt.punchType === 'PUNCH_IN'
            ? 'Punch In'
            : 'Punch Out'}
        </p>
      </div>

      <div className="rounded-xl bg-white p-4">
        <p className="text-xs font-semibold uppercase text-gray-500">
          Approved Location
        </p>

        <p className="mt-1 font-bold text-gray-900">
          {attendanceExceptionAttempt.attendanceLocationName || '-'}
        </p>
      </div>

      <div className="rounded-xl bg-white p-4">
        <p className="text-xs font-semibold uppercase text-gray-500">
          Your Distance
        </p>

        <p className="mt-1 font-bold text-red-700">
          {Number(
            attendanceExceptionAttempt.distanceMeters || 0,
          ).toFixed(2)}{' '}
          metres
        </p>
      </div>

      <div className="rounded-xl bg-white p-4">
        <p className="text-xs font-semibold uppercase text-gray-500">
          Allowed Radius
        </p>

        <p className="mt-1 font-bold text-green-700">
          {Number(
            attendanceExceptionAttempt.allowedRadiusMeters || 0,
          )}{' '}
          metres
        </p>
      </div>
    </div>

    {attendanceExceptionAttempt.overrideReason && (
      <div className="mt-3 rounded-xl bg-white p-4">
        <p className="text-xs font-semibold uppercase text-gray-500">
          Date Override
        </p>

        <p className="mt-1 text-sm text-gray-700">
          {attendanceExceptionAttempt.overrideReason}
        </p>
      </div>
    )}

    <textarea
      value={attendanceExceptionReason}
      onChange={(e) =>
        setAttendanceExceptionReason(e.target.value)
      }
      placeholder="Explain why this attendance attempt should be approved"
      className="mt-4 min-h-28 w-full rounded-xl border border-amber-300 bg-white p-3"
    />

    <div className="mt-4 flex flex-wrap gap-3">
      <button
        type="button"
        disabled={attendanceExceptionSubmitting}
        onClick={submitAttendanceException}
        className="rounded-xl bg-amber-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {attendanceExceptionSubmitting
          ? 'Submitting...'
          : 'Request Exception Approval'}
      </button>

      <button
        type="button"
        disabled={attendanceExceptionSubmitting}
        onClick={() => {
          setAttendanceExceptionAttempt(null);
          setAttendanceExceptionReason('');
        }}
        className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  </div>
)}

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

          <div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-lg font-bold text-gray-800">
        My Attendance Exception Requests
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Requests submitted for attendance attempts made outside the
        allowed location.
      </p>
    </div>

    <button
      type="button"
      onClick={loadPortal}
      disabled={loading}
      className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
    >
      Refresh
    </button>
  </div>

  <div className="mt-4 space-y-3">
    {attendanceExceptionRequests.length === 0 ? (
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

        return (
          <div
            key={request.id}
            className="rounded-xl border p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-gray-900">
                  {request.punchType === 'PUNCH_IN'
                    ? 'Punch In'
                    : 'Punch Out'}{' '}
                  Exception
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Attendance Date: {request.attendanceDate}
                </p>

                <p className="text-sm text-gray-500">
                  Attempted At:{' '}
                  {request.attemptedAt
                    ? new Date(
                        request.attemptedAt,
                      ).toLocaleString('en-IN')
                    : '-'}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
              >
                {request.status}
              </span>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Approved Location
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {request.attendanceLocationName || '-'}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Your Distance
                </p>

                <p className="mt-1 text-sm font-semibold text-red-700">
                  {Number(
                    request.distanceMeters || 0,
                  ).toFixed(2)}{' '}
                  metres
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Allowed Radius
                </p>

                <p className="mt-1 text-sm font-semibold text-green-700">
                  {Number(
                    request.allowedRadiusMeters || 0,
                  )}{' '}
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
                {new Date(
                  request.reviewedAt,
                ).toLocaleString('en-IN')}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {request.photoUrl && (
                <a
                  href={request.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
                >
                  View Selfie
                </a>
              )}

              {request.status === 'PENDING' && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    const confirmed = window.confirm(
                      'Cancel this pending attendance exception request?',
                    );

                    if (!confirmed) {
                      return;
                    }

                    try {
                      setLoading(true);

                      await axios.patch(
                        `${API_BASE_URL}/staff/self/attendance-exceptions/${request.id}/cancel`,
                        {},
                        {
                          headers: headers(),
                        },
                      );

                      alert(
                        'Attendance exception request cancelled',
                      );

                      await loadPortal();
                    } catch (error: any) {
                      console.error(error);

                      alert(
                        error?.response?.data?.message ||
                          'Failed to cancel attendance exception request',
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Cancel Request
                </button>
              )}
            </div>
          </div>
        );
      })
    )}
  </div>
</div>
        </div>
      )}

      {activeTab === 'leave' && (
        <div className="space-y-5">
            <div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h2 className="text-lg font-bold text-gray-800">
        My Leave Summary
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        View your leave requests and approved leave for the selected month.
      </p>
    </div>

    <div>
      <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
        Month
      </label>

      <input
        type="month"
        value={leaveMonth}
        onChange={(e) =>
          setLeaveMonth(e.target.value)
        }
        className="rounded-xl border p-3"
      />
    </div>
  </div>
</div>

<p className="text-sm font-semibold text-gray-600">
  Summary for{' '}
  {new Date(
    `${leaveMonth}-01T00:00:00`,
  ).toLocaleDateString(
    'en-IN',
    {
      month: 'long',
      year: 'numeric',
    },
  )}
</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl bg-white p-5 shadow">
  <p className="text-sm text-gray-500">
    Total Applications
  </p>

  <p className="mt-2 text-2xl font-bold text-indigo-700">
    {leaveSummary.totalRequests}
  </p>
</div>
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
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
  <p className="text-sm text-blue-700">
    Leave applications in selected month
  </p>

  <p className="mt-1 text-xl font-bold text-blue-900">
    {leaveSummary.totalRequests}
  </p>

  <p className="mt-2 text-sm font-semibold text-blue-800">
    Your next leave application will be Request #
    {leaveSummary.totalRequests + 1}
  </p>
</div>

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
  {leave.monthRequestNumber
    ? `Request #${leave.monthRequestNumber} | `
    : ''}
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

      {activeTab === 'payroll' && (
  <div className="space-y-5">
    <div className="rounded-2xl bg-white p-5 shadow">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            My Payroll
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            View generated salary, targets, achievements,
            incentives and payroll calculation details.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
            Payroll Month
          </label>

          <input
            type="month"
            value={payrollMonth}
            onChange={(e) => {
              setPayrollMonth(
                e.target.value,
              );

              setSelectedPayroll(null);
            }}
            className="rounded-xl border p-3"
          />
        </div>
      </div>
    </div>

    {payrolls.length === 0 ? (
      <div className="rounded-2xl bg-white p-5 shadow">
        <p className="text-sm text-gray-500">
          No payroll has been generated for this month.
        </p>
      </div>
    ) : (
      payrolls.map((payroll) => (
        <div
          key={payroll.id}
          className="rounded-2xl bg-white p-5 shadow"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-gray-900">
                {payroll.payrollMonth}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Status: {payroll.status || '-'}
              </p>
            </div>

            <div className="flex gap-2">
  <button
    type="button"
    disabled={loading}
    onClick={() =>
      openPayroll(
        Number(payroll.id),
      )
    }
    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
  >
    View Calculation
  </button>

  <button
    type="button"
    disabled={loading}
    onClick={() =>
      downloadSalarySlip(
        Number(payroll.id),
      )
    }
    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
  >
    Salary Slip
  </button>
</div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Basic Salary
              </p>

              <p className="mt-1 text-lg font-bold text-gray-900">
                ₹{formatMoney(
                  payroll.basicSalary,
                )}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Salary %
              </p>

              <p className="mt-1 text-lg font-bold text-blue-700">
                {Number(
                  payroll.salaryPercentage ||
                    0,
                ).toFixed(2)}
                %
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Salary Amount
              </p>

              <p className="mt-1 text-lg font-bold text-green-700">
                ₹{formatMoney(
                  payroll.salaryAmount,
                )}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Incentive
              </p>

              <p className="mt-1 text-lg font-bold text-emerald-700">
                ₹{formatMoney(
                  payroll.incentiveAmount,
                )}
              </p>
            </div>
          </div>
        </div>
      ))
    )}

    {selectedPayroll && (
      <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Payroll Calculation
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {selectedPayroll.payrollMonth}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setSelectedPayroll(null)
            }
            className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Salary
            </p>

            <p className="mt-1 text-lg font-bold">
              ₹{formatMoney(
                selectedPayroll.salaryAmount,
              )}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Incentive
            </p>

            <p className="mt-1 text-lg font-bold text-green-700">
              ₹{formatMoney(
                selectedPayroll.incentiveAmount,
              )}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Salary %
            </p>

            <p className="mt-1 text-lg font-bold text-blue-700">
              {Number(
                selectedPayroll.salaryPercentage ||
                  0,
              ).toFixed(2)}
              %
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Eligibility
            </p>

            <p
              className={`mt-1 text-lg font-bold ${
                selectedPayroll
                  .calculationSnapshot
                  ?.eligibilityMet
                  ? 'text-green-700'
                  : 'text-red-700'
              }`}
            >
              {selectedPayroll
                .calculationSnapshot
                ?.eligibilityMet
                ? 'Eligible'
                : 'Not Eligible'}
            </p>
          </div>
        </div>

        {selectedPayroll
          .calculationSnapshot
          ?.eligibilityReason && (
          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Eligibility Result
            </p>

            <p className="mt-2 text-sm text-gray-800">
              {
                selectedPayroll
                  .calculationSnapshot
                  .eligibilityReason
              }
            </p>
          </div>
        )}

        <div className="mt-5">
          <h3 className="font-bold text-gray-900">
            Targets & Achievements
          </h3>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {Object.entries(
              selectedPayroll
                .calculationSnapshot
                ?.actualMetrics ||
                selectedPayroll.actualMetrics ||
                {},
            ).map(
              ([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border p-4"
                >
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {formatMetricLabel(key)}
                  </p>

                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {Number(
                      value || 0,
                    ).toLocaleString(
                      'en-IN',
                      {
                        maximumFractionDigits:
                          2,
                      },
                    )}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>

        {Array.isArray(
          selectedPayroll
            .calculationSnapshot
            ?.eligibilityConditions,
        ) &&
          selectedPayroll
            .calculationSnapshot
            .eligibilityConditions
            .length > 0 && (
            <div className="mt-5">
              <h3 className="font-bold text-gray-900">
                Eligibility Conditions
              </h3>

              <div className="mt-3 space-y-3">
                {selectedPayroll
                  .calculationSnapshot
                  .eligibilityConditions
                  .map(
                    (
                      condition: any,
                    ) => (
                      <div
                        key={
                          condition.id ||
                          condition.label
                        }
                        className="rounded-xl border p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {condition.label}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              Achieved:{' '}
                              {condition.actualValue}{' '}
                              / Target:{' '}
                              {condition.targetValue}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              condition.passed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {condition.passed
                              ? 'Achieved'
                              : 'Not Achieved'}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
              </div>
            </div>
          )}

        {Array.isArray(
          selectedPayroll
            .calculationSnapshot
            ?.incentiveComponents,
        ) &&
          selectedPayroll
            .calculationSnapshot
            .incentiveComponents
            .length > 0 && (
            <div className="mt-5">
              <h3 className="font-bold text-gray-900">
                Incentive Breakdown
              </h3>

              <div className="mt-3 space-y-3">
                {selectedPayroll
                  .calculationSnapshot
                  .incentiveComponents
                  .map(
                    (
                      component: any,
                    ) => (
                      <div
                        key={
                          component.id ||
                          component.label
                        }
                        className="rounded-xl border p-4"
                      >
                        <p className="font-semibold text-gray-900">
                          {component.label}
                        </p>

                        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                          <p className="text-gray-600">
                            Metric:{' '}
                            <span className="font-semibold text-gray-900">
                              {formatMetricLabel(
                                component.metricType,
                              )}
                            </span>
                          </p>

                          <p className="text-gray-600">
                            Achieved:{' '}
                            <span className="font-semibold text-gray-900">
                              {
                                component.metricValue
                              }
                            </span>
                          </p>

                          <p className="text-gray-600">
                            Incentive:{' '}
                            <span className="font-semibold text-green-700">
                              ₹
                              {formatMoney(
                                component.amount,
                              )}
                            </span>
                          </p>
                        </div>
                      </div>
                    ),
                  )}
              </div>
            </div>
          )}

        {selectedPayroll.ruleSnapshot && (
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-bold text-blue-900">
              Applied Payroll Rule
            </h3>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <p className="text-sm text-blue-900">
                Rule:{' '}
                <span className="font-semibold">
                  {selectedPayroll
                    .ruleSnapshot
                    .ruleName || '-'}
                </span>
              </p>

              <p className="text-sm text-blue-900">
                Version:{' '}
                <span className="font-semibold">
                  {selectedPayroll
                    .ruleSnapshot
                    .version || '-'}
                </span>
              </p>

              <p className="text-sm text-blue-900">
                Salary Mode:{' '}
                <span className="font-semibold">
                  {formatMetricLabel(
                    selectedPayroll
                      .ruleSnapshot
                      .salaryMode ||
                      '',
                  )}
                </span>
              </p>

              <p className="text-sm text-blue-900">
                Salary Target:{' '}
                <span className="font-semibold">
                  {selectedPayroll
                    .ruleSnapshot
                    .salaryTargetValue ??
                    '-'}
                </span>
              </p>

              <p className="text-sm text-blue-900">
                Minimum Project Payment:{' '}
                <span className="font-semibold">
                  {Number(
                    selectedPayroll
                      .ruleSnapshot
                      .minimumProjectPaymentPercentage ||
                      0,
                  )}
                  %
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    )}
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
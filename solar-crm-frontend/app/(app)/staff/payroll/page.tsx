'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Staff = {
  id: number;
  fullName?: string;
  employeeCode?: string;
  staffRole?: string;
  department?: string;
  branchName?: string;
};

const emptyForm = {
  payrollMonth: '',
  basicSalary: '',
  presentDays: '',
  halfDays: '',
  absentDays: '',
  leaveDays: '',
  workingHours: '',
  leaveDeduction: '',
  penaltyAmount: '',
  incentiveAmount: '',
  otherAllowance: '',
  otherDeduction: '',
  ownerOverrideNetSalary: '',
  ownerOverrideReason: '',
  remarks: '',
};

function money(value: any) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function payrollLabel(value: any) {
  return String(value || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

export default function StaffPayrollPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const [showStaffOptions, setShowStaffOptions] = useState(false);

  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [viewPayroll, setViewPayroll] =
  useState<any>(null);

const [viewCalculationOpen, setViewCalculationOpen] =
  useState(false);

  const headers = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchStaff = async () => {
    const res = await axios.get(`${API_BASE_URL}/staff`, {
      params: { page: 1, limit: 100, showHidden: false },
      headers: headers(),
    });
    setStaff(res.data?.data || []);
  };

  const fetchPayrolls = async () => {
    const res = await axios.get(`${API_BASE_URL}/staff/payrolls`, {
      params: {
        page,
        limit: 20,
        payrollMonth: monthFilter,
        status: statusFilter,
        showHidden,
      },
      headers: headers(),
    });

    setPayrolls(res.data?.data || []);
    setTotalPages(res.data?.totalPages || 1);
  };

  useEffect(() => {
    fetchStaff();
    fetchPayrolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, showHidden]);

  const filteredStaff = staff.filter((item) => {
    const text = `${item.fullName || ''} ${item.employeeCode || ''} ${item.staffRole || ''} ${item.department || ''} ${item.branchName || ''}`.toLowerCase();
    return text.includes(staffSearch.toLowerCase());
  });

  const resetForm = () => {
    setEditingId(null);
    setSelectedStaffId('');
    setSelectedStaffName('');
    setStaffSearch('');
    setShowStaffOptions(false);
    setForm(emptyForm);
  };

  const savePayroll = async () => {
    if (!editingId && !selectedStaffId) {
      alert('Please select staff');
      return;
    }

    if (!form.payrollMonth) {
      alert('Payroll month is required');
      return;
    }

    try {
      const payload = {
        ...form,
        staffId: Number(selectedStaffId),
        basicSalary: Number(form.basicSalary || 0),
        presentDays: Number(form.presentDays || 0),
        halfDays: Number(form.halfDays || 0),
        absentDays: Number(form.absentDays || 0),
        leaveDays: Number(form.leaveDays || 0),
        workingHours: Number(form.workingHours || 0),
        leaveDeduction: Number(form.leaveDeduction || 0),
        penaltyAmount: Number(form.penaltyAmount || 0),
        incentiveAmount: Number(form.incentiveAmount || 0),
        otherAllowance: Number(form.otherAllowance || 0),
        otherDeduction: Number(form.otherDeduction || 0),
        ownerOverrideNetSalary:
          form.ownerOverrideNetSalary === ''
            ? undefined
            : Number(form.ownerOverrideNetSalary || 0),
      };

      if (editingId) {
        await axios.patch(`${API_BASE_URL}/staff/payroll/${editingId}`, payload, {
          headers: headers(),
        });
        alert('Payroll updated');
      } else {
        await axios.post(`${API_BASE_URL}/staff/payroll/generate`, payload, {
          headers: headers(),
        });
        alert('Payroll generated');
      }

      resetForm();
      fetchPayrolls();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to save payroll');
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setSelectedStaffId(String(item.staffId));
    setSelectedStaffName(`${item.staffName || 'Staff'} ${item.employeeCode ? `(${item.employeeCode})` : ''}`);
    setForm({
      payrollMonth: item.payrollMonth || '',
      basicSalary: String(item.basicSalary || ''),
      presentDays: String(item.presentDays || ''),
      halfDays: String(item.halfDays || ''),
      absentDays: String(item.absentDays || ''),
      leaveDays: String(item.leaveDays || ''),
      workingHours: String(item.workingHours || ''),
      leaveDeduction: String(item.leaveDeduction || ''),
      penaltyAmount: String(item.penaltyAmount || ''),
      incentiveAmount: String(item.incentiveAmount || ''),
      otherAllowance: String(item.otherAllowance || ''),
      otherDeduction: String(item.otherDeduction || ''),
      ownerOverrideNetSalary: item.ownerOverrideApplied
        ? String(item.ownerOverrideNetSalary || '')
        : '',
      ownerOverrideReason: item.ownerOverrideReason || '',
      remarks: item.remarks || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const approvePayroll = async (id: number) => {
    const remarks = window.prompt('Approval remarks optional', 'Approved');
    if (remarks === null) return;

    await axios.patch(
      `${API_BASE_URL}/staff/payroll/${id}/approve`,
      { remarks },
      { headers: headers() },
    );

    fetchPayrolls();
  };

  const markPaid = async (id: number) => {
    const paymentRemarks = window.prompt('Payment remarks optional', 'Salary paid');
    if (paymentRemarks === null) return;

    await axios.patch(
      `${API_BASE_URL}/staff/payroll/${id}/paid`,
      { paymentRemarks },
      { headers: headers() },
    );

    fetchPayrolls();
  };

  const downloadSalarySlip = async (id: number) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/staff/payroll/${id}/salary-slip`,
      {
        headers: headers(),
        responseType: 'blob',
      },
    );

    const blob = new Blob([response.data], {
      type: 'application/pdf',
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download = `Salary-Slip-${id}.pdf`;

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

  const hideRestore = async (item: any, restore = false) => {
    const reason = window.prompt(
      restore ? 'Reason for restoring payroll?' : 'Reason for hiding payroll?',
      restore ? 'Valid payroll' : 'Wrong / duplicate payroll',
    );

    if (reason === null) return;

    await axios.patch(
      `${API_BASE_URL}/staff/payroll/${item.id}/${restore ? 'restore' : 'hide'}`,
      { reason },
      { headers: headers() },
    );

    fetchPayrolls();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">Payroll</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate, edit, approve and mark staff salary payroll as paid.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Loaded Payrolls</p>
          <p className="mt-2 text-2xl font-bold">{payrolls.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Generated</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {payrolls.filter((p) => p.status === 'GENERATED').length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {payrolls.filter((p) => p.status === 'APPROVED').length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {payrolls.filter((p) => p.status === 'PAID').length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          {editingId ? 'Edit Payroll' : 'Generate Payroll'}
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-3">
            <input
              placeholder="Search Staff by Name / Code / Role / Department"
              value={staffSearch || selectedStaffName}
              disabled={!!editingId}
              onChange={(e) => {
                setStaffSearch(e.target.value);
                setSelectedStaffName('');
                setSelectedStaffId('');
                setShowStaffOptions(true);
              }}
              onFocus={() => setShowStaffOptions(true)}
              className="w-full rounded-xl border p-3 disabled:bg-gray-100"
            />

            {showStaffOptions && !editingId && (
              <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow">
                {filteredStaff.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedStaffId(String(item.id));
                      setSelectedStaffName(
                        `${item.fullName || 'Staff'} ${item.employeeCode ? `(${item.employeeCode})` : ''}`,
                      );
                      setStaffSearch('');
                      setShowStaffOptions(false);
                    }}
                    className="block w-full border-b p-3 text-left text-sm hover:bg-blue-50"
                  >
                    <p className="font-semibold text-gray-800">{item.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {item.employeeCode || '-'} | {item.staffRole || '-'} | {item.department || '-'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            type="month"
            value={form.payrollMonth}
            onChange={(e) => setForm({ ...form, payrollMonth: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Basic Salary"
            value={form.basicSalary}
            onChange={(e) => setForm({ ...form, basicSalary: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Present Days"
            value={form.presentDays}
            onChange={(e) => setForm({ ...form, presentDays: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Half Days"
            value={form.halfDays}
            onChange={(e) => setForm({ ...form, halfDays: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Absent Days"
            value={form.absentDays}
            onChange={(e) => setForm({ ...form, absentDays: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Leave Days"
            value={form.leaveDays}
            onChange={(e) => setForm({ ...form, leaveDays: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Working Hours"
            value={form.workingHours}
            onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Leave Deduction"
            value={form.leaveDeduction}
            onChange={(e) => setForm({ ...form, leaveDeduction: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Penalty Amount"
            value={form.penaltyAmount}
            onChange={(e) => setForm({ ...form, penaltyAmount: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Incentive Amount"
            value={form.incentiveAmount}
            onChange={(e) => setForm({ ...form, incentiveAmount: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Other Allowance"
            value={form.otherAllowance}
            onChange={(e) => setForm({ ...form, otherAllowance: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Other Deduction"
            value={form.otherDeduction}
            onChange={(e) => setForm({ ...form, otherDeduction: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Owner Override Net Salary"
            value={form.ownerOverrideNetSalary}
            onChange={(e) => setForm({ ...form, ownerOverrideNetSalary: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Owner Override Reason"
            value={form.ownerOverrideReason}
            onChange={(e) => setForm({ ...form, ownerOverrideReason: e.target.value })}
            className="rounded-xl border p-3 md:col-span-2"
          />
        </div>

        <textarea
          placeholder="Payroll remarks"
          value={form.remarks}
          onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          className="mt-3 w-full rounded-xl border p-3"
        />

        <div className="mt-4 flex gap-2">
          <button
            onClick={savePayroll}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            {editingId ? 'Update Payroll' : 'Generate Payroll'}
          </button>

          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-xl bg-gray-600 px-5 py-3 font-semibold text-white"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded-xl border p-3"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border p-3"
          >
            <option value="">All Status</option>
            <option value="GENERATED">Generated</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <label className="rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => {
                setShowHidden(e.target.checked);
                setPage(1);
              }}
            />{' '}
            View Hidden
          </label>

          <button
            onClick={() => {
              setPage(1);
              fetchPayrolls();
            }}
            className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Apply / Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">Payroll Register</h2>

        <div className="mt-4 space-y-3">
          {payrolls.length === 0 ? (
            <p className="text-sm text-gray-500">No payroll records found.</p>
          ) : (
            payrolls.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 ${item.isHidden ? 'bg-gray-100 opacity-70' : 'bg-white'}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-bold text-gray-900">
                      {item.staffName} - {item.payrollMonth}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.employeeCode || '-'} | {item.department || '-'} | {item.status}
                    </p>
                    <p className="mt-2 text-sm">
                      Basic {money(item.basicSalary)} | Gross {money(item.grossSalary)} | Net{' '}
                      <span className="font-bold text-green-700">{money(item.netSalary)}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Present {item.presentDays} | Half {item.halfDays} | Absent {item.absentDays} | Leave {item.leaveDays}
                    </p>
                    <p className="text-sm text-gray-500">
                      Deduction {money(Number(item.attendanceDeduction || 0) + Number(item.leaveDeduction || 0) + Number(item.penaltyAmount || 0) + Number(item.otherDeduction || 0))}
                      {' '}| Incentive {money(item.incentiveAmount)}
                    </p>

                    {item.eligibilityMet !== undefined && (
  <div className="mt-3 rounded-xl border bg-gray-50 p-3">
    <div className="grid gap-2 md:grid-cols-2">
      <p className="text-sm">
        <span className="font-semibold">
          Eligibility:
        </span>{' '}
        <span
          className={
            item.eligibilityMet
              ? 'text-green-700'
              : 'text-red-700'
          }
        >
          {item.eligibilityMet
            ? 'Eligible'
            : 'Not Eligible'}
        </span>
      </p>

      <p className="text-sm">
        <span className="font-semibold">
          Salary %:
        </span>{' '}
        {Number(
          item.salaryPercentage || 0,
        ).toFixed(2)}
        %
      </p>

      <p className="text-sm md:col-span-2">
        <span className="font-semibold">
          Reason:
        </span>{' '}
        {item.eligibilityReason ||
          '-'}
      </p>
    </div>
  </div>
)}

{item.calculationSnapshot?.actualMetrics ||
item.ruleSnapshot ? (
  <div className="mt-3 rounded-xl border bg-white p-3">
    <p className="mb-2 text-sm font-semibold text-gray-800">
      Performance Metrics
    </p>

    <div className="grid gap-2 text-sm md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(
        item.calculationSnapshot?.actualMetrics ||
          {},
      ).map(([key, value]) => (
        <div
          key={key}
          className="rounded-lg bg-gray-50 p-2"
        >
          <p className="text-xs text-gray-500">
            {key
              .replace(/([A-Z])/g, ' $1')
              .replace(/_/g, ' ')
              .trim()}
          </p>

          <p className="font-semibold text-gray-900">
            {typeof value === 'number'
              ? Number(value).toLocaleString(
                  'en-IN',
                )
              : String(value ?? '-')}
          </p>
        </div>
      ))}

      {!Object.keys(
        item.calculationSnapshot?.actualMetrics ||
          {},
      ).length ? (
        <>
          <div className="rounded-lg bg-gray-50 p-2">
            <p className="text-xs text-gray-500">
              Leads
            </p>
            <p className="font-semibold">
              {Number(
                item.actualLeads || 0,
              ).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-2">
            <p className="text-xs text-gray-500">
              Meetings
            </p>
            <p className="font-semibold">
              {Number(
                item.actualMeetings || 0,
              ).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-2">
            <p className="text-xs text-gray-500">
              GPS Meetings
            </p>
            <p className="font-semibold">
              {Number(
                item.actualGpsMeetings || 0,
              ).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-2">
            <p className="text-xs text-gray-500">
              Scheduled Meetings
            </p>
            <p className="font-semibold">
              {Number(
                item.actualScheduledMeetings ||
                  0,
              ).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-2">
            <p className="text-xs text-gray-500">
              Projects
            </p>
            <p className="font-semibold">
              {Number(
                item.actualOrders || 0,
              ).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-2">
            <p className="text-xs text-gray-500">
              Sales
            </p>
            <p className="font-semibold">
              {money(
                item.actualSales || 0,
              )}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-2">
            <p className="text-xs text-gray-500">
              Net Profit
            </p>
            <p className="font-semibold">
              {money(
                item.actualNetProfit || 0,
              )}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-2">
            <p className="text-xs text-gray-500">
              Joinings
            </p>
            <p className="font-semibold">
              {Number(
                item.actualJoinings || 0,
              ).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 p-2">
            <p className="text-xs text-gray-500">
              Working Hours
            </p>
            <p className="font-semibold">
              {Number(
                item.actualWorkingHours ||
                  0,
              ).toFixed(2)}
            </p>
          </div>
        </>
      ) : null}
    </div>

    <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
      <p>
        <span className="font-semibold">
          Rule:
        </span>{' '}
        {item.ruleSnapshot?.ruleName || '-'}
      </p>

      <p>
        <span className="font-semibold">
          Rule Version:
        </span>{' '}
        {item.ruleSnapshot?.version ?? '-'}
      </p>
    </div>
  </div>
) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">

                    <button
  onClick={() =>
    downloadSalarySlip(item.id)
  }
  className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
>
  Salary Slip
</button>

                    <button
  onClick={() => {
    setViewPayroll(item);
    setViewCalculationOpen(true);
  }}
  className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white"
>
  View Calculation
</button>
                    {!item.isHidden && item.status !== 'PAID' && (
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Edit
                      </button>
                    )}

                    {!item.isHidden && item.status === 'GENERATED' && (
                      <button
                        onClick={() => approvePayroll(item.id)}
                        className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Approve
                      </button>
                    )}

                    {!item.isHidden && item.status === 'APPROVED' && (
                      <button
                        onClick={() => markPaid(item.id)}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Mark Paid
                      </button>
                    )}

                    <button
                      onClick={() => hideRestore(item, !!item.isHidden)}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold text-white ${
                        item.isHidden ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      {item.isHidden ? 'Restore' : 'Hide'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Previous
          </button>

          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {viewCalculationOpen && viewPayroll && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
    <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Payroll Calculation
          </h2>

          <p className="text-sm text-gray-500">
            {viewPayroll.staffName || 'Staff'} ·{' '}
            {viewPayroll.payrollMonth || '-'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setViewCalculationOpen(false);
            setViewPayroll(null);
          }}
          className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          Close
        </button>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">
              Eligibility
            </p>

            <p
              className={`font-bold ${
                viewPayroll.eligibilityMet
                  ? 'text-green-700'
                  : 'text-red-700'
              }`}
            >
              {viewPayroll.eligibilityMet
                ? 'Eligible'
                : 'Not Eligible'}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">
              Salary Percentage
            </p>

            <p className="font-bold">
              {Number(
                viewPayroll.salaryPercentage || 0,
              ).toFixed(2)}
              %
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">
              Incentive
            </p>

            <p className="font-bold">
              {money(viewPayroll.incentiveAmount)}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">
              Net Salary
            </p>

            <p className="font-bold text-green-700">
              {money(viewPayroll.netSalary)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border p-4">
  <h3 className="font-bold text-gray-800">
    Salary Statement
  </h3>

  <div className="mt-4 space-y-3 text-sm">
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">
        Basic Salary
      </span>

      <span className="font-semibold">
        {money(viewPayroll.basicSalary)}
      </span>
    </div>

    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">
        Salary Percentage
      </span>

      <span className="font-semibold">
        {Number(
          viewPayroll.salaryPercentage ||
            0,
        ).toFixed(2)}
        %
      </span>
    </div>

    <div className="flex items-center justify-between gap-3 border-t pt-3">
      <span className="font-semibold text-gray-800">
        Earned Salary
      </span>

      <span className="font-bold text-blue-700">
        {money(
          viewPayroll.calculationSnapshot
            ?.salaryAmount ??
            (
              Number(
                viewPayroll.basicSalary ||
                  0,
              ) *
              Number(
                viewPayroll.salaryPercentage ||
                  0,
              )
            ) /
              100,
        )}
      </span>
    </div>

    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">
        Incentive
      </span>

      <span className="font-semibold text-green-700">
        + {money(
          viewPayroll.incentiveAmount,
        )}
      </span>
    </div>

    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">
        Other Allowance
      </span>

      <span className="font-semibold text-green-700">
        + {money(
          viewPayroll.otherAllowance,
        )}
      </span>
    </div>

    <div className="flex items-center justify-between gap-3 border-t pt-3">
      <span className="font-semibold text-gray-800">
        Gross Salary
      </span>

      <span className="font-bold">
        {money(
          viewPayroll.grossSalary,
        )}
      </span>
    </div>

    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">
        Attendance Deduction
      </span>

      <span className="font-semibold text-red-700">
        - {money(
          viewPayroll.attendanceDeduction,
        )}
      </span>
    </div>

    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">
        Leave Deduction
      </span>

      <span className="font-semibold text-red-700">
        - {money(
          viewPayroll.leaveDeduction,
        )}
      </span>
    </div>

    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">
        Penalty
      </span>

      <span className="font-semibold text-red-700">
        - {money(
          viewPayroll.penaltyAmount,
        )}
      </span>
    </div>

    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-600">
        Other Deduction
      </span>

      <span className="font-semibold text-red-700">
        - {money(
          viewPayroll.otherDeduction,
        )}
      </span>
    </div>

    <div className="flex items-center justify-between gap-3 border-t pt-3">
      <span className="text-base font-bold text-gray-900">
        Net Salary
      </span>

      <span className="text-xl font-bold text-green-700">
        {money(
          viewPayroll.netSalary,
        )}
      </span>
    </div>
  </div>
</div>

        <div className="rounded-xl border p-4">
          <h3 className="font-bold text-gray-800">
            Eligibility Reason
          </h3>

          <p className="mt-2 text-sm text-gray-600">
            {viewPayroll.eligibilityReason || '-'}
          </p>
        </div>

        <div className="space-y-4">
  <h3 className="font-bold text-gray-800">
    Targets & Achievements
  </h3>

  {Object.keys(
    viewPayroll.calculationSnapshot?.actualMetrics ||
      {},
  ).length === 0 ? (
    <p className="text-sm text-gray-500">
      No performance metrics were recorded.
    </p>
  ) : (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(
        viewPayroll.calculationSnapshot
          ?.actualMetrics || {},
      ).map(([key, value]) => (
        <div
          key={key}
          className="rounded-xl border bg-gray-50 p-4"
        >
          <p className="text-xs font-semibold uppercase text-gray-500">
            {payrollLabel(key)}
          </p>

          <p className="mt-2 text-xl font-bold text-gray-900">
            {Number(
              value || 0,
            ).toLocaleString('en-IN', {
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      ))}
    </div>
  )}

  {Array.isArray(
    viewPayroll.calculationSnapshot
      ?.eligibilityConditions,
  ) &&
    viewPayroll.calculationSnapshot
      .eligibilityConditions.length > 0 && (
      <div>
        <h3 className="mb-3 font-bold text-gray-800">
          Eligibility Conditions
        </h3>

        <div className="space-y-3">
          {viewPayroll.calculationSnapshot
            .eligibilityConditions.map(
              (condition: any) => (
                <div
                  key={
                    condition.id ||
                    condition.label
                  }
                  className="rounded-xl border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {condition.label ||
                          payrollLabel(
                            condition.metricType,
                          )}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {payrollLabel(
                          condition.metricType,
                        )}
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

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Achieved
                      </p>

                      <p className="font-bold text-gray-900">
                        {Number(
                          condition.actualValue ||
                            0,
                        ).toLocaleString(
                          'en-IN',
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">
                        Required
                      </p>

                      <p className="font-bold text-gray-900">
                        {Number(
                          condition.targetValue ||
                            0,
                        ).toLocaleString(
                          'en-IN',
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ),
            )}
        </div>
      </div>
    )}
</div>

{Array.isArray(
  viewPayroll.calculationSnapshot
    ?.incentiveComponents,
) &&
  viewPayroll.calculationSnapshot
    .incentiveComponents.length > 0 && (
    <div>
      <h3 className="mb-3 font-bold text-gray-800">
        Incentive Breakdown
      </h3>

      <div className="space-y-3">
        {viewPayroll.calculationSnapshot
          .incentiveComponents.map(
            (component: any) => (
              <div
                key={
                  component.id ||
                  component.label
                }
                className="rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {component.label ||
                        'Incentive'}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {payrollLabel(
                        component.metricType,
                      )}
                      {' · '}
                      {payrollLabel(
                        component.calculationType,
                      )}
                    </p>
                  </div>

                  <p className="text-lg font-bold text-green-700">
                    {money(
                      component.amount,
                    )}
                  </p>
                </div>

                <div className="mt-3 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">
                    Achieved Metric Value
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {Number(
                      component.metricValue ||
                        0,
                    ).toLocaleString(
                      'en-IN',
                      {
                        maximumFractionDigits:
                          2,
                      },
                    )}
                  </p>
                </div>
              </div>
            ),
          )}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-green-50 p-4">
        <p className="font-semibold text-green-900">
          Total Incentive
        </p>

        <p className="text-xl font-bold text-green-700">
          {money(
            viewPayroll.incentiveAmount,
          )}
        </p>
      </div>
    </div>
  )}

        {viewPayroll.ruleSnapshot && (
  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
    <h3 className="font-bold text-blue-900">
      Applied Payroll Rule
    </h3>

    <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <div>
        <p className="text-xs font-semibold uppercase text-blue-600">
          Rule
        </p>

        <p className="mt-1 font-semibold text-blue-950">
          {viewPayroll.ruleSnapshot
            .ruleName || '-'}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-blue-600">
          Role
        </p>

        <p className="mt-1 font-semibold text-blue-950">
          {payrollLabel(
            viewPayroll.ruleSnapshot.role,
          ) || '-'}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-blue-600">
          Rule Version
        </p>

        <p className="mt-1 font-semibold text-blue-950">
          {viewPayroll.ruleSnapshot
            .version ?? '-'}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-blue-600">
          Salary Mode
        </p>

        <p className="mt-1 font-semibold text-blue-950">
          {payrollLabel(
            viewPayroll.ruleSnapshot
              .salaryMode,
          ) || '-'}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-blue-600">
          Salary Metric
        </p>

        <p className="mt-1 font-semibold text-blue-950">
          {viewPayroll.ruleSnapshot
            .salaryMetricType
            ? payrollLabel(
                viewPayroll.ruleSnapshot
                  .salaryMetricType,
              )
            : '-'}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-blue-600">
          Salary Target
        </p>

        <p className="mt-1 font-semibold text-blue-950">
          {viewPayroll.ruleSnapshot
            .salaryTargetValue ?? '-'}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-blue-600">
          Maximum Salary
        </p>

        <p className="mt-1 font-semibold text-blue-950">
          {Number(
            viewPayroll.ruleSnapshot
              .maximumSalaryPercentage ||
              0,
          ).toFixed(2)}
          %
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-blue-600">
          Minimum Project Payment
        </p>

        <p className="mt-1 font-semibold text-blue-950">
          {Number(
            viewPayroll.ruleSnapshot
              .minimumProjectPaymentPercentage ||
              0,
          )}
          %
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase text-blue-600">
          Effective From
        </p>

        <p className="mt-1 font-semibold text-blue-950">
          {viewPayroll.ruleSnapshot
            .effectiveFrom || '-'}
        </p>
      </div>
    </div>
  </div>
)}

        {viewPayroll.ownerOverrideApplied ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="font-bold text-amber-800">
              Owner Override Applied
            </h3>

            <p className="mt-2 text-sm text-amber-700">
              Override Net Salary:{' '}
              {money(
                viewPayroll.ownerOverrideNetSalary,
              )}
            </p>

            <p className="mt-1 text-sm text-amber-700">
              Reason:{' '}
              {viewPayroll.ownerOverrideReason || '-'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  </div>
)}
    </div>
  );
}
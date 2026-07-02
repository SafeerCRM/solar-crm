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
                  </div>

                  <div className="flex flex-wrap gap-2">
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
    </div>
  );
}
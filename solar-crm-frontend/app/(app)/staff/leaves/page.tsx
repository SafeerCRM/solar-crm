'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { uploadPreparedFile } from '@/app/utils/fileUpload';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Staff = {
  id: number;
  fullName?: string;
  employeeCode?: string;
  department?: string;
  branchName?: string;
};

export default function StaffLeavesPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveSummary, setLeaveSummary] = useState({
  approvedDays: 0,
  approvedRequests: 0,
  pendingRequests: 0,
  rejectedRequests: 0,
  cancelledRequests: 0,
});
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const [showStaffOptions, setShowStaffOptions] = useState(false);

  const [form, setForm] = useState({
    leaveType: 'CASUAL',
    fromDate: '',
    toDate: '',
    reason: '',
  });

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingLeaveId, setEditingLeaveId] = useState<number | null>(null);

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

  const fetchLeaves = async () => {
    const res = await axios.get(`${API_BASE_URL}/staff/leaves`, {
      params: {
        page,
        limit: 20,
        status: statusFilter,
        showHidden,
      },
      headers: headers(),
    });

    setLeaves(res.data?.data || []);
setTotalPages(res.data?.totalPages || 1);

setLeaveSummary({
  approvedDays: Number(
    res.data?.summary?.approvedDays || 0,
  ),
  approvedRequests: Number(
    res.data?.summary?.approvedRequests || 0,
  ),
  pendingRequests: Number(
    res.data?.summary?.pendingRequests || 0,
  ),
  rejectedRequests: Number(
    res.data?.summary?.rejectedRequests || 0,
  ),
  cancelledRequests: Number(
    res.data?.summary?.cancelledRequests || 0,
  ),
});
  };

  useEffect(() => {
    fetchStaff();
    fetchLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, showHidden]);

  const filteredStaff = staff.filter((item) => {
    const text = `${item.fullName || ''} ${item.employeeCode || ''} ${item.department || ''} ${item.branchName || ''}`.toLowerCase();
    return text.includes(staffSearch.toLowerCase());
  });

  const resetForm = () => {
    setSelectedStaffId('');
    setSelectedStaffName('');
    setStaffSearch('');
    setShowStaffOptions(false);
    setEditingLeaveId(null);
    setProofFile(null);
    setForm({
      leaveType: 'CASUAL',
      fromDate: '',
      toDate: '',
      reason: '',
    });
  };

  const uploadProof = async () => {
    if (!proofFile) return '';

    const token = localStorage.getItem('token');

    return uploadPreparedFile({
      file: proofFile,
      endpoint: `${API_BASE_URL}/staff/leave/proof-upload`,
      token,
      fieldName: 'files',
    });
  };

  const saveLeave = async () => {
    if (!selectedStaffId) {
      alert('Please select staff');
      return;
    }

    if (!form.fromDate || !form.toDate || !form.reason.trim()) {
      alert('From date, to date and reason are required');
      return;
    }

    try {
      const proofUrl = await uploadProof();

      const payload = {
        staffId: Number(selectedStaffId),
        ...form,
        proofUrl,
      };

      if (editingLeaveId) {
        await axios.patch(`${API_BASE_URL}/staff/leave/${editingLeaveId}`, payload, {
          headers: headers(),
        });
        alert('Leave updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/staff/leave`, payload, {
          headers: headers(),
        });
        alert('Leave created successfully');
      }

      resetForm();
      fetchLeaves();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to save leave');
    }
  };

  const startEdit = (leave: any) => {
    setEditingLeaveId(leave.id);
    setSelectedStaffId(String(leave.staffId));
    setSelectedStaffName(`${leave.staffName || 'Staff'} ${leave.employeeCode ? `(${leave.employeeCode})` : ''}`);
    setForm({
      leaveType: leave.leaveType || 'CASUAL',
      fromDate: leave.fromDate || '',
      toDate: leave.toDate || '',
      reason: leave.reason || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const approveReject = async (leaveId: number, action: 'approve' | 'reject') => {
    const approvalRemarks = window.prompt(
      action === 'approve' ? 'Approval remarks optional' : 'Reason for rejection',
      action === 'approve' ? 'Approved' : '',
    );

    if (approvalRemarks === null) return;

    await axios.patch(
      `${API_BASE_URL}/staff/leave/${leaveId}/${action}`,
      { approvalRemarks },
      { headers: headers() },
    );

    fetchLeaves();
  };

  const hideRestore = async (leave: any, restore = false) => {
    const reason = window.prompt(
      restore ? 'Reason for restoring leave?' : 'Reason for hiding leave?',
      restore ? 'Valid leave' : 'Wrong / duplicate entry',
    );

    if (reason === null) return;

    await axios.patch(
      `${API_BASE_URL}/staff/leave/${leave.id}/${restore ? 'restore' : 'hide'}`,
      { reason },
      { headers: headers() },
    );

    fetchLeaves();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create, edit, approve, reject, hide and restore staff leave records.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          {editingLeaveId ? 'Edit Leave' : 'Create Leave'}
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-3">
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
                {filteredStaff.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedStaffId(String(item.id));
                      setSelectedStaffName(`${item.fullName || 'Staff'} ${item.employeeCode ? `(${item.employeeCode})` : ''}`);
                      setStaffSearch('');
                      setShowStaffOptions(false);
                    }}
                    className="block w-full border-b p-3 text-left text-sm hover:bg-blue-50"
                  >
                    <p className="font-semibold text-gray-800">{item.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {item.employeeCode || '-'} | {item.department || '-'} | {item.branchName || '-'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            value={form.leaveType}
            onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
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
            value={form.fromDate}
            onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="date"
            value={form.toDate}
            onChange={(e) => setForm({ ...form, toDate: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            className="rounded-xl border p-3 md:col-span-3"
          />
        </div>

        <textarea
          placeholder="Leave reason"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          className="mt-3 w-full rounded-xl border p-3"
        />

        <div className="mt-4 flex gap-2">
          <button
            onClick={saveLeave}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            {editingLeaveId ? 'Update Leave' : 'Create Leave'}
          </button>

          {editingLeaveId && (
            <button
              onClick={resetForm}
              className="rounded-xl bg-gray-600 px-5 py-3 font-semibold text-white"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

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
        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border p-3"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <label className="rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => setShowHidden(e.target.checked)}
            />{' '}
            View Hidden
          </label>

          <button
            onClick={fetchLeaves}
            className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">Leave Register</h2>

        <div className="mt-4 space-y-3">
          {leaves.length === 0 ? (
            <p className="text-sm text-gray-500">No leaves found.</p>
          ) : (
            leaves.map((leave) => (
              <div
                key={leave.id}
                className={`rounded-xl border p-4 ${leave.isHidden ? 'bg-gray-100 opacity-70' : 'bg-white'}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-bold text-gray-900">
                      {leave.staffName || `Staff #${leave.staffId}`}
                    </p>
                    <p className="text-sm text-gray-500">
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
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {leave.status === 'PENDING' && !leave.isHidden && (
                      <>
                        <button
                          onClick={() => startEdit(leave)}
                          className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => approveReject(leave.id, 'approve')}
                          className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => approveReject(leave.id, 'reject')}
                          className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {leave.proofUrl && (
                      <a
                        href={leave.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Proof
                      </a>
                    )}

                    <button
                      onClick={() => hideRestore(leave, !!leave.isHidden)}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold text-white ${
                        leave.isHidden ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      {leave.isHidden ? 'Restore' : 'Hide'}
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
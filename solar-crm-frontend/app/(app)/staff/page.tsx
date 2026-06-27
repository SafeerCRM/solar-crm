'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { uploadPreparedFile } from '@/app/utils/fileUpload';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Staff = {
  id: number;
  fullName?: string;
  employeeCode?: string;
  mobile?: string;
  email?: string;
  photoUrl?: string;
  designation?: string;
  department?: string;
  branchName?: string;
  joiningDate?: string;
  dateOfBirth?: string;
  visibleToCustomer?: boolean;
  visibleToDealer?: boolean;
  isHidden?: boolean;
};

const emptyForm = {
  fullName: '',
  employeeCode: '',
  mobile: '',
  alternateMobile: '',
  email: '',
  designation: '',
  staffRole: '',
  department: '',
  reportingManagerName: '',
  branchName: '',
  joiningDate: '',
  dateOfBirth: '',
  birthdayReminderEnabled: true,
  birthdayRemarks: '',
  employmentType: 'FULL_TIME',
  visibleToCustomer: false,
  visibleToDealer: false,
  publicDisplayName: '',
  publicPhone: '',
  publicEmail: '',
  publicDesignation: '',
  remarks: '',
};

const USER_ROLE_OPTIONS = [
  'OWNER',
  'TELECALLING_MANAGER',
  'TELECALLING_ASSISTANT',
  'LEAD_MANAGER',
  'LEAD_EXECUTIVE',
  'MARKETING_HEAD',
  'MEETING_MANAGER',
  'MEETING_ASSISTANT',
  'PROJECT_MANAGER',
  'PROJECT_EXECUTIVE',
  'CUSTOMER',
  'TELECALLER',
  'LOAN_MANAGER',
  'ELECTRICITY_MANAGER',
  'SUBSIDY_MANAGER',
  'PAYMENT_COLLECTION_EXECUTIVE',
  'PAYMENT_MANAGER',
  'ACCOUNT_MANAGER',
  'STOCK_MANAGER',
  'MAINTENANCE_MANAGER',
  'CUSTOMER_MANAGER',
  'HR_MANAGER',
  'TRADING_MANAGER',
  'PROJECT_CONTRACTOR',
  'SOLAR_FRANCHISE',
  'DEALER',
];

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [search, setSearch] = useState('');
  const [branchName, setBranchName] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [documentStaffId, setDocumentStaffId] = useState('');
  const [documentType, setDocumentType] = useState('AADHAAR');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentRemarks, setDocumentRemarks] = useState('');
  const [vaultStaff, setVaultStaff] = useState<any>(null);
const [vaultDocuments, setVaultDocuments] = useState<any[]>([]);
const [vaultAssets, setVaultAssets] = useState<any[]>([]);

const [designationSearch, setDesignationSearch] = useState('');
const [showDesignationOptions, setShowDesignationOptions] = useState(false);

  const [assetForm, setAssetForm] = useState({
    staffId: '',
    assetType: 'LAPTOP',
    assetName: '',
    assetNumber: '',
    assignedDate: '',
    returnedDate: '',
    remarks: '',
  });

  const headers = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE_URL}/staff`, {
        params: {
          page,
          limit: 20,
          search,
          branchName,
          department,
          showHidden,
        },
        headers: headers(),
      });

      setStaff(res.data?.data || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, showHidden]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setDesignationSearch('');
setShowDesignationOptions(false);
  };

  const saveStaff = async () => {
    if (!form.fullName.trim()) {
      alert('Full name is required');
      return;
    }

    try {
      let saved: any;

      if (editingId) {
        const res = await axios.patch(
          `${API_BASE_URL}/staff/${editingId}`,
          form,
          { headers: headers() },
        );
        saved = res.data;
        alert('Staff updated successfully');
      } else {
        const res = await axios.post(`${API_BASE_URL}/staff`, form, {
          headers: headers(),
        });
        saved = res.data;
        alert('Staff added successfully');
      }

      if (photoFile && saved?.id) {
        const token = localStorage.getItem('token');

        const photoUrl = await uploadPreparedFile({
          file: photoFile,
          endpoint: `${API_BASE_URL}/project/dealer-payment-receipt/upload`,
          token,
          fieldName: 'files',
        });

        await axios.patch(
          `${API_BASE_URL}/staff/${saved.id}/photo`,
          { photoUrl },
          { headers: headers() },
        );
      }

      resetForm();
      fetchStaff();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to save staff');
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      ...emptyForm,
      ...item,
      joiningDate: item.joiningDate || '',
      dateOfBirth: item.dateOfBirth || '',
    });
    setDesignationSearch('');
setShowDesignationOptions(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hideOrRestore = async (item: Staff, restore = false) => {
    const reason = window.prompt(
      restore ? 'Reason for restoring staff?' : 'Reason for hiding staff?',
      restore ? 'Valid active staff' : 'Inactive / resigned / test entry',
    );

    if (reason === null) return;

    await axios.patch(
      `${API_BASE_URL}/staff/${item.id}/${restore ? 'restore' : 'hide'}`,
      { reason },
      { headers: headers() },
    );

    fetchStaff();
  };

  const uploadDocument = async () => {
    if (!documentStaffId || !documentFile) {
      alert('Please select staff and document file');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const fileUrl = await uploadPreparedFile({
        file: documentFile,
        endpoint: `${API_BASE_URL}/project/dealer-payment-receipt/upload`,
        token,
        fieldName: 'files',
      });

      await axios.post(
        `${API_BASE_URL}/staff/document`,
        {
          staffId: Number(documentStaffId),
          documentType,
          fileName: documentFile.name,
          fileUrl,
          remarks: documentRemarks,
        },
        { headers: headers() },
      );

      alert('Document uploaded');
      setDocumentStaffId('');
      setDocumentFile(null);
      setDocumentRemarks('');
    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Failed to upload document');
    }
  };

  const addAsset = async () => {
    if (!assetForm.staffId || !assetForm.assetName.trim()) {
      alert('Staff and asset name are required');
      return;
    }

    await axios.post(`${API_BASE_URL}/staff/asset`, assetForm, {
      headers: headers(),
    });

    alert('Asset added');

    setAssetForm({
      staffId: '',
      assetType: 'LAPTOP',
      assetName: '',
      assetNumber: '',
      assignedDate: '',
      returnedDate: '',
      remarks: '',
    });
  };

  const openVault = async (item: Staff) => {
  try {
    const [docRes, assetRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/staff/${item.id}/documents`, { headers: headers() }),
      axios.get(`${API_BASE_URL}/staff/${item.id}/assets`, { headers: headers() }),
    ]);

    setVaultStaff(item);
    setVaultDocuments(docRes.data || []);
    setVaultAssets(assetRes.data || []);
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to open staff vault');
  }
};

const filteredDesignationOptions = USER_ROLE_OPTIONS.filter((role) =>
  role.toLowerCase().includes(
    String(designationSearch || form.designation || '').toLowerCase(),
  ),
);

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 pb-8">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Staff Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Employee directory, public contact visibility, birthday details,
          documents and assets.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          {editingId ? 'Edit Staff' : 'Add Staff'}
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input placeholder="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="rounded-xl border p-3 md:col-span-2" />
          <input placeholder="Employee Code" value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} className="rounded-xl border p-3" />
          <input placeholder="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="rounded-xl border p-3" />
          <input placeholder="Alternate Mobile" value={form.alternateMobile} onChange={(e) => setForm({ ...form, alternateMobile: e.target.value })} className="rounded-xl border p-3" />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl border p-3" />

          <div className="relative">
  <input
    placeholder="Designation / Role"
    value={designationSearch || form.designation}
    onChange={(e) => {
      const value = e.target.value;
      setDesignationSearch(value);
      setForm({ ...form, designation: value });
      setShowDesignationOptions(true);
    }}
    onFocus={() => {
      setDesignationSearch(form.designation || '');
      setShowDesignationOptions(true);
    }}
    className="w-full rounded-xl border p-3"
  />

  {showDesignationOptions && (
    <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border bg-white shadow">
      {filteredDesignationOptions.length === 0 ? (
        <div className="p-3 text-sm text-gray-500">
          No matching role found
        </div>
      ) : (
        filteredDesignationOptions.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => {
  setForm({
    ...form,
    designation: role.replaceAll('_', ' '),
    staffRole: role,
  });

  setDesignationSearch('');
  setShowDesignationOptions(false);
}}
            className="block w-full border-b p-3 text-left text-sm hover:bg-blue-50"
          >
            {role.replaceAll('_', ' ')}
          </button>
        ))
      )}
    </div>
  )}
</div>
          <input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="rounded-xl border p-3" />
          <input placeholder="Reporting Manager" value={form.reportingManagerName} onChange={(e) => setForm({ ...form, reportingManagerName: e.target.value })} className="rounded-xl border p-3" />
          <input placeholder="Branch" value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} className="rounded-xl border p-3" />

          <div>
  <p className="mb-1 text-xs font-semibold text-gray-600">Joining Date</p>
  <input
    type="date"
    value={form.joiningDate}
    onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
    className="w-full rounded-xl border p-3"
  />
</div>

<div>
  <p className="mb-1 text-xs font-semibold text-gray-600">Date of Birth</p>
  <input
    type="date"
    value={form.dateOfBirth}
    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
    className="w-full rounded-xl border p-3"
  />
</div>

          <select value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })} className="rounded-xl border p-3">
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERN">Intern</option>
          </select>

          <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="rounded-xl border p-3 md:col-span-2" />
        </div>

        <h3 className="mt-5 font-bold text-gray-800">Public Visibility</h3>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="rounded-xl border p-3 text-sm">
            <input type="checkbox" checked={form.visibleToCustomer} onChange={(e) => setForm({ ...form, visibleToCustomer: e.target.checked })} /> Visible to Customer
          </label>
          <label className="rounded-xl border p-3 text-sm">
            <input type="checkbox" checked={form.visibleToDealer} onChange={(e) => setForm({ ...form, visibleToDealer: e.target.checked })} /> Visible to Dealer
          </label>
          <label className="rounded-xl border p-3 text-sm">
            <input type="checkbox" checked={form.birthdayReminderEnabled} onChange={(e) => setForm({ ...form, birthdayReminderEnabled: e.target.checked })} /> Birthday Reminder
          </label>

          <input placeholder="Public Display Name" value={form.publicDisplayName} onChange={(e) => setForm({ ...form, publicDisplayName: e.target.value })} className="rounded-xl border p-3" />
          <input placeholder="Public Phone" value={form.publicPhone} onChange={(e) => setForm({ ...form, publicPhone: e.target.value })} className="rounded-xl border p-3" />
          <input placeholder="Public Email" value={form.publicEmail} onChange={(e) => setForm({ ...form, publicEmail: e.target.value })} className="rounded-xl border p-3" />
          <input placeholder="Public Designation" value={form.publicDesignation} onChange={(e) => setForm({ ...form, publicDesignation: e.target.value })} className="rounded-xl border p-3 md:col-span-3" />
        </div>

        <textarea placeholder="Birthday / Celebration Remarks" value={form.birthdayRemarks} onChange={(e) => setForm({ ...form, birthdayRemarks: e.target.value })} className="mt-3 w-full rounded-xl border p-3" />
        <textarea placeholder="Staff Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="mt-3 w-full rounded-xl border p-3" />

        <div className="mt-4 flex gap-2">
          <button onClick={saveStaff} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">
            {editingId ? 'Update Staff' : 'Add Staff'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="rounded-xl bg-gray-600 px-5 py-3 font-semibold text-white">
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">Filters</h2>

        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <input placeholder="Search staff" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl border p-3" />
          <input placeholder="Branch" value={branchName} onChange={(e) => setBranchName(e.target.value)} className="rounded-xl border p-3" />
          <input placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} className="rounded-xl border p-3" />
          <label className="rounded-xl border p-3 text-sm">
            <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} /> View Hidden
          </label>
        </div>

        <button onClick={() => { setPage(1); fetchStaff(); }} className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          Apply
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">Staff Directory</h2>

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {staff.map((item) => (
              <div key={item.id} className={`rounded-xl border p-4 ${item.isHidden ? 'bg-gray-100 opacity-70' : 'bg-white'}`}>
                <div className="flex gap-3">
                  {item.photoUrl ? (
                    <img src={item.photoUrl} alt={item.fullName || 'Staff'} className="h-16 w-16 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-xl font-bold">
                      {(item.fullName || '?').charAt(0)}
                    </div>
                  )}

                  <div>
                    <p className="font-bold text-gray-900">{item.fullName}</p>
                    <p className="text-sm text-gray-500">{item.designation || '-'} | {item.department || '-'}</p>
                    <p className="text-sm text-gray-500">{item.mobile || '-'} | {item.branchName || '-'}</p>
                    <p className="text-xs text-gray-400">DOB: {item.dateOfBirth || '-'}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => startEdit(item)} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
                    Edit
                  </button>
                  <button onClick={() => hideOrRestore(item, !!item.isHidden)} className={`rounded-xl px-3 py-2 text-sm font-semibold text-white ${item.isHidden ? 'bg-green-600' : 'bg-red-600'}`}>
                    {item.isHidden ? 'Restore' : 'Hide'}
                  </button>

                  <button
  onClick={() => openVault(item)}
  className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-white"
>
  View Vault
</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50">
            Previous
          </button>
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold disabled:opacity-50">
            Next
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">Upload Staff Document</h2>

          <div className="mt-3 grid gap-3">
            <select value={documentStaffId} onChange={(e) => setDocumentStaffId(e.target.value)} className="rounded-xl border p-3">
              <option value="">Select Staff</option>
              {staff.filter((s) => !s.isHidden).map((s) => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
              ))}
            </select>

            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="rounded-xl border p-3">
              <option value="AADHAAR">Aadhaar</option>
              <option value="PAN">PAN</option>
              <option value="OFFER_LETTER">Offer Letter</option>
              <option value="AGREEMENT">Agreement</option>
              <option value="BANK_DETAILS">Bank Details</option>
              <option value="OTHER">Other</option>
            </select>

            <input type="file" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} className="rounded-xl border p-3" />
            <textarea placeholder="Document remarks" value={documentRemarks} onChange={(e) => setDocumentRemarks(e.target.value)} className="rounded-xl border p-3" />

            <button onClick={uploadDocument} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">
              Upload Document
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">Assign Staff Asset</h2>

          <div className="mt-3 grid gap-3">
            <select value={assetForm.staffId} onChange={(e) => setAssetForm({ ...assetForm, staffId: e.target.value })} className="rounded-xl border p-3">
              <option value="">Select Staff</option>
              {staff.filter((s) => !s.isHidden).map((s) => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
              ))}
            </select>

            <select value={assetForm.assetType} onChange={(e) => setAssetForm({ ...assetForm, assetType: e.target.value })} className="rounded-xl border p-3">
              <option value="LAPTOP">Laptop</option>
              <option value="MOBILE">Mobile</option>
              <option value="SIM">SIM</option>
              <option value="VEHICLE">Vehicle</option>
              <option value="OTHER">Other</option>
            </select>

            <input placeholder="Asset Name" value={assetForm.assetName} onChange={(e) => setAssetForm({ ...assetForm, assetName: e.target.value })} className="rounded-xl border p-3" />
            <input placeholder="Asset Number / IMEI / Vehicle No." value={assetForm.assetNumber} onChange={(e) => setAssetForm({ ...assetForm, assetNumber: e.target.value })} className="rounded-xl border p-3" />
            <input type="date" value={assetForm.assignedDate} onChange={(e) => setAssetForm({ ...assetForm, assignedDate: e.target.value })} className="rounded-xl border p-3" />
            <textarea placeholder="Asset remarks" value={assetForm.remarks} onChange={(e) => setAssetForm({ ...assetForm, remarks: e.target.value })} className="rounded-xl border p-3" />

            <button onClick={addAsset} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">
              Add Asset
            </button>
          </div>
        </div>
      </div>

      {vaultStaff && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          Staff Vault - {vaultStaff.fullName}
        </h2>

        <button
          onClick={() => setVaultStaff(null)}
          className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold"
        >
          Close
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-4">
          <h3 className="font-bold text-gray-800">Profile</h3>
          <p className="mt-2 text-sm">Mobile: {vaultStaff.mobile || '-'}</p>
          <p className="text-sm">Email: {vaultStaff.email || '-'}</p>
          <p className="text-sm">DOB: {vaultStaff.dateOfBirth || '-'}</p>
          <p className="text-sm">Joining: {vaultStaff.joiningDate || '-'}</p>
          <p className="text-sm">Department: {vaultStaff.department || '-'}</p>
          <p className="text-sm">Branch: {vaultStaff.branchName || '-'}</p>
        </div>

        <div className="rounded-xl bg-blue-50 p-4">
          <h3 className="font-bold text-blue-900">Public Contact</h3>
          <p className="mt-2 text-sm">Customer Visible: {vaultStaff.visibleToCustomer ? 'Yes' : 'No'}</p>
          <p className="text-sm">Dealer Visible: {vaultStaff.visibleToDealer ? 'Yes' : 'No'}</p>
          <p className="text-sm">Name: {vaultStaff.publicDisplayName || '-'}</p>
          <p className="text-sm">Phone: {vaultStaff.publicPhone || '-'}</p>
          <p className="text-sm">Email: {vaultStaff.publicEmail || '-'}</p>
          <p className="text-sm">Designation: {vaultStaff.publicDesignation || '-'}</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border p-4">
        <h3 className="font-bold text-gray-800">Documents</h3>

        <div className="mt-3 space-y-2">
          {vaultDocuments.length === 0 ? (
            <p className="text-sm text-gray-500">No documents uploaded.</p>
          ) : (
            vaultDocuments.map((doc) => (
              <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
                <div>
                  <p className="font-semibold">{doc.documentType}</p>
                  <p className="text-xs text-gray-500">{doc.fileName || '-'}</p>
                  <p className="text-xs text-gray-500">{doc.remarks || ''}</p>
                </div>

                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  View / Download
                </a>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-5 rounded-xl border p-4">
        <h3 className="font-bold text-gray-800">Assets</h3>

        <div className="mt-3 space-y-2">
          {vaultAssets.length === 0 ? (
            <p className="text-sm text-gray-500">No assets assigned.</p>
          ) : (
            vaultAssets.map((asset) => (
              <div key={asset.id} className="rounded-lg bg-gray-50 p-3">
                <p className="font-semibold">{asset.assetType} - {asset.assetName}</p>
                <p className="text-sm text-gray-500">No: {asset.assetNumber || '-'}</p>
                <p className="text-sm text-gray-500">Assigned: {asset.assignedDate || '-'}</p>
                <p className="text-sm text-gray-500">{asset.remarks || ''}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
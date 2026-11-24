'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { uploadPreparedFile } from '@/app/utils/fileUpload';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { getRoleDisplayName } from '@/lib/roleDisplay';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const BLOOD_GROUP_OPTIONS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

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
  bloodGroup?: string | null;
  visibleToCustomer?: boolean;
  visibleToDealer?: boolean;
  isHidden?: boolean;
  reportingManagerId?: number | null;
reportingManagerName?: string;
monthlyBasicSalary?: number;
isSupportingStaff?: boolean;
};

type CrmUser = {
  id: number;
  name?: string;
  email?: string;
  roles?: string[];
};

const emptyForm = {
  fullName: '',
  employeeCode: '',
  linkedUserId: '',
  mobile: '',
  alternateMobile: '',
  email: '',
  designation: '',
  staffRole: '',
  department: '',
  reportingManagerName: '',
reportingManagerId: '',

monthlyBasicSalary: 0,
isSupportingStaff: false,

branchName: '',
  joiningDate: '',
  dateOfBirth: '',
bloodGroup: '',
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
  'INSPECTION_MANAGER',
  'TRADING_MANAGER',
  'TRADING_HEAD',
  'PROJECT_CONTRACTOR',
  'SOLAR_FRANCHISE',
  'DEALER',
  'OFFICE_ASSISTANT',
  'FRANCHISE_HEAD',
  'FRANCHISE_MANAGER',
];

function SearchableFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Autocomplete
      fullWidth
      size="small"
      options={options}
      value={value || null}
      onChange={(_, selectedValue) =>
        onChange(selectedValue || '')
      }
      openOnFocus
      autoHighlight
      noOptionsText="No matching options"
      slotProps={{
        listbox: {
          sx: {
            maxHeight: 200,
            overflowY: 'auto',
            '& .MuiAutocomplete-option': {
              fontSize: '13px',
              minHeight: '34px',
            },
          },
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Search..."
          size="small"
        />
      )}
      sx={{
        minWidth: 0,
        '& .MuiOutlinedInput-root': {
          borderRadius: '10px',
          minHeight: '42px',
          backgroundColor: '#fff',
          fontSize: '13px',
        },
        '& .MuiInputLabel-root': {
          fontSize: '13px',
        },
      }}
    />
  );
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [search, setSearch] = useState('');
  const [branchName, setBranchName] = useState('');
  const [department, setDepartment] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');

const [branchOptions, setBranchOptions] =
  useState<string[]>([]);

const [departmentOptions, setDepartmentOptions] =
  useState<string[]>([]);

const [appliedFilters, setAppliedFilters] = useState({
  search: '',
  branchName: '',
  department: '',
  bloodGroup: '',
  showHidden: false,
});
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

  const [users, setUsers] = useState<CrmUser[]>([]);
const [linkedUserSearch, setLinkedUserSearch] = useState('');
const [showLinkedUserOptions, setShowLinkedUserOptions] = useState(false);

  const headers = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsers = async () => {
  const res = await axios.get(`${API_BASE_URL}/users`, {
    headers: headers(),
  });

  setUsers(Array.isArray(res.data) ? res.data : []);
};

const fetchFilterOptions = async () => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/staff/filter-options`,
      {
        headers: headers(),
      },
    );

    setBranchOptions(
      Array.isArray(res.data?.branches)
        ? res.data.branches
        : [],
    );

    setDepartmentOptions(
      Array.isArray(res.data?.departments)
        ? res.data.departments
        : [],
    );
  } catch (error) {
    console.error(
      'Failed to load staff filter options',
      error,
    );
  }
};

  const fetchStaff = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE_URL}/staff`, {
        params: {
  page,
  limit: 20,
  ...appliedFilters,
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

  const applyFilters = () => {
  setPage(1);

  setAppliedFilters({
    search: search.trim(),
    branchName,
    department,
    bloodGroup,
    showHidden,
  });
};

const clearFilters = () => {
  setSearch('');
  setBranchName('');
  setDepartment('');
  setBloodGroup('');
  setShowHidden(false);
  setPage(1);

  setAppliedFilters({
    search: '',
    branchName: '',
    department: '',
    bloodGroup: '',
    showHidden: false,
  });
};

      const exportStaffCsv = async () => {
    try {
      const exportLimit = 100;

      // Fetch first page so we know how many pages exist.
      const firstRes = await axios.get(`${API_BASE_URL}/staff`, {
        params: {
  page: 1,
  limit: exportLimit,
  ...appliedFilters,
},
        headers: headers(),
      });

      const firstPageData = Array.isArray(firstRes.data?.data)
        ? firstRes.data.data
        : [];

      const exportTotalPages = Number(firstRes.data?.totalPages || 1);

      let exportData = [...firstPageData];

      // Fetch every remaining page using the exact same filters.
      for (let exportPage = 2; exportPage <= exportTotalPages; exportPage++) {
        const res = await axios.get(`${API_BASE_URL}/staff`, {
          params: {
  page: exportPage,
  limit: exportLimit,
  ...appliedFilters,
},
          headers: headers(),
        });

        const pageData = Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        exportData = [...exportData, ...pageData];
      }

      if (exportData.length === 0) {
        alert('No staff found for the selected filters');
        return;
      }

      const escapeCsv = (value: any) => {
        const text =
          value === null || value === undefined ? '' : String(value);

        return `"${text.replace(/"/g, '""')}"`;
      };

      const columns = [
        'Employee Code',
        'Full Name',
        'Mobile',
        'Email',
        'Designation',
        'Department',
        'Branch',
        'Reporting Manager',
        'Joining Date',
        'Date of Birth',
        'Monthly Basic Salary',
        'Supporting Staff',
        'Customer Visible',
        'Dealer Visible',
        'Status',
      ];

      const rows = exportData.map((item: any) => [
        item.employeeCode || '',
        item.fullName || '',
        item.mobile || '',
        item.email || '',
        item.designation || '',
        item.department || '',
        item.branchName || '',
        item.reportingManagerName || '',
        item.joiningDate || '',
        item.dateOfBirth || '',
        item.monthlyBasicSalary ?? '',
        item.isSupportingStaff ? 'Yes' : 'No',
        item.visibleToCustomer ? 'Yes' : 'No',
        item.visibleToDealer ? 'Yes' : 'No',
        item.isHidden ? 'Hidden' : 'Active',
      ]);

      const csv = [
        columns.map(escapeCsv).join(','),
        ...rows.map((row: any[]) =>
          row.map(escapeCsv).join(','),
        ),
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csv], {
        type: 'text/csv;charset=utf-8;',
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `staff-export-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          'Failed to export staff CSV',
      );
    }
  };

  useEffect(() => {
  fetchUsers();
  fetchFilterOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

useEffect(() => {
  fetchStaff();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [page, appliedFilters]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setDesignationSearch('');
setShowDesignationOptions(false);
setLinkedUserSearch('');
setShowLinkedUserOptions(false);
  };

  const saveStaff = async () => {
    if (!form.fullName.trim()) {
      alert('Full name is required');
      return;
    }

    try {
  let saved: any;

  const payload = {
    ...form,
    joiningDate: form.joiningDate || null,
    dateOfBirth: form.dateOfBirth || null,
    bloodGroup: form.bloodGroup || null,
  };

  if (editingId) {
        const res = await axios.patch(
  `${API_BASE_URL}/staff/${editingId}`,
  payload,
  { headers: headers() },
);
        saved = res.data;
        alert('Staff updated successfully');
      } else {
       const res = await axios.post(`${API_BASE_URL}/staff`, payload, {
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
fetchFilterOptions();
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
  bloodGroup: item.bloodGroup || '',
});
    setLinkedUserSearch(
  item.linkedUserId ? `Linked User ID: ${item.linkedUserId}` : '',
);
setShowLinkedUserOptions(false);
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

const filteredUsers = users.filter((user) => {
  const text = `${user.name || ''} ${user.email || ''} ${(user.roles || []).join(' ')}`.toLowerCase();

  return text.includes(linkedUserSearch.toLowerCase());
});

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

          <div className="relative md:col-span-3">
  <input
    placeholder="Search Linked CRM User by Name / Email / Role"
    value={linkedUserSearch}
    onChange={(e) => {
      setLinkedUserSearch(e.target.value);
      setShowLinkedUserOptions(true);
    }}
    onFocus={() => setShowLinkedUserOptions(true)}
    className="w-full rounded-xl border p-3"
  />

  {form.linkedUserId && (
    <p className="mt-1 text-xs font-semibold text-green-700">
      Linked User ID: {form.linkedUserId}
    </p>
  )}

  {showLinkedUserOptions && (
    <div className="absolute z-40 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow">
      {filteredUsers.length === 0 ? (
        <div className="p-3 text-sm text-gray-500">
          No matching user found
        </div>
      ) : (
        filteredUsers.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => {
              setForm({
                ...form,
                linkedUserId: user.id,
              });
              setLinkedUserSearch(
                `${user.name || 'Unnamed'} (${(user.roles || []).join(', ')})`,
              );
              setShowLinkedUserOptions(false);
            }}
            className="block w-full border-b p-3 text-left text-sm hover:bg-blue-50"
          >
            <p className="font-semibold text-gray-800">
              {user.name || 'Unnamed'}
            </p>
            <p className="text-xs text-gray-500">{user.email || '-'}</p>
            <p className="text-xs text-gray-500">
              {(user.roles || []).join(', ') || '-'}
            </p>
          </button>
        ))
      )}
    </div>
  )}
</div>
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
    designation: getRoleDisplayName(role),
    staffRole: role,
  });

  setDesignationSearch('');
  setShowDesignationOptions(false);
}}
            className="block w-full border-b p-3 text-left text-sm hover:bg-blue-50"
          >
            {getRoleDisplayName(role)}
          </button>
        ))
      )}
    </div>
  )}
</div>
          <input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="rounded-xl border p-3" />
          <div className="relative">
  <input
    placeholder="Search Reporting Manager"
    value={form.reportingManagerName || ''}
    onChange={(e) =>
      setForm({
        ...form,
        reportingManagerId: '',
        reportingManagerName: e.target.value,
      })
    }
    className="w-full rounded-xl border p-3"
  />

  {form.reportingManagerName && (
    <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border bg-white shadow">
      {staff
        .filter((manager) => {
          if (manager.isHidden) return false;
          if (editingId && manager.id === editingId) return false;

          const text = `${manager.fullName || ''} ${
            manager.designation || ''
          } ${manager.department || ''}`.toLowerCase();

          return text.includes(
            String(form.reportingManagerName).toLowerCase(),
          );
        })
        .map((manager) => (
          <button
            key={manager.id}
            type="button"
            onClick={() =>
              setForm({
                ...form,
                reportingManagerId: manager.id,
                reportingManagerName:
                  manager.fullName || '',
              })
            }
            className="block w-full border-b p-3 text-left text-sm hover:bg-blue-50"
          >
            <p className="font-semibold text-gray-800">
              {manager.fullName}
            </p>

            <p className="text-xs text-gray-500">
              {manager.designation || '-'} |{' '}
              {manager.department || '-'}
            </p>
          </button>
        ))}
    </div>
  )}

  {form.reportingManagerId && (
    <p className="mt-1 text-xs font-semibold text-green-700">
      Selected Manager ID: {form.reportingManagerId}
    </p>
  )}
</div>
          <input placeholder="Branch" value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} className="rounded-xl border p-3" />
          <TextField
  label="Monthly Basic Salary"
  type="number"
  fullWidth
  value={form.monthlyBasicSalary}
  onChange={(e) =>
    setForm({
      ...form,
      monthlyBasicSalary: Number(e.target.value),
    })
  }
  slotProps={{
    input: {
      inputProps: {
        min: 0,
        step: 0.01,
      },
    },
  }}
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: '0.75rem',
      height: '54px',
    },
  }}
/>

<label className="rounded-xl border p-3 text-sm flex items-center gap-2">
  <input
    type="checkbox"
    checked={form.isSupportingStaff}
    onChange={(e) =>
      setForm({
        ...form,
        isSupportingStaff: e.target.checked,
      })
    }
  />

  Include in Supporting Staff Incentive Pool
</label>

          <TextField
  label="Joining Date"
  type="date"
  fullWidth
  value={form.joiningDate || ''}
  onChange={(e) =>
    setForm({
      ...form,
      joiningDate: e.target.value,
    })
  }
  slotProps={{
    inputLabel: {
      shrink: true,
    },
  }}
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: '0.75rem',
      height: '54px',
    },
  }}
/>

<TextField
  label="Date of Birth"
  type="date"
  fullWidth
  value={form.dateOfBirth || ''}
  onChange={(e) =>
    setForm({
      ...form,
      dateOfBirth: e.target.value,
    })
  }
  slotProps={{
    inputLabel: {
      shrink: true,
    },
  }}
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: '0.75rem',
      height: '54px',
    },
  }}
/>

<select
  aria-label="Blood Group"
  value={form.bloodGroup || ''}
  onChange={(e) =>
    setForm({
      ...form,
      bloodGroup: e.target.value,
    })
  }
  className="w-full rounded-xl border border-gray-300 bg-white p-3"
>
  <option value="">Blood Group (Optional)</option>

  {BLOOD_GROUP_OPTIONS.map((group) => (
    <option key={group} value={group}>
      {group}
    </option>
  ))}
</select>

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

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
  <input
    placeholder="Search name / code / mobile"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        applyFilters();
      }
    }}
    className="col-span-2 min-w-0 rounded-[10px] border border-gray-400 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 lg:col-span-1"
  />

  <SearchableFilter
    label="Branch"
    value={branchName}
    options={branchOptions}
    onChange={setBranchName}
  />

  <SearchableFilter
    label="Department"
    value={department}
    options={departmentOptions}
    onChange={setDepartment}
  />

  <SearchableFilter
    label="Blood Group"
    value={bloodGroup}
    options={BLOOD_GROUP_OPTIONS}
    onChange={setBloodGroup}
  />

  <SearchableFilter
    label="Staff Status"
    value={
      showHidden ? 'Hidden Staff' : 'Active Staff'
    }
    options={[
      'Active Staff',
      'Hidden Staff',
    ]}
    onChange={(value) =>
      setShowHidden(value === 'Hidden Staff')
    }
  />
</div>

                <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={applyFilters}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Apply
          </button>

          <button
            onClick={clearFilters}
            className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Clear Filters
          </button>

                    <button
            onClick={exportStaffCsv}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Export CSV
          </button>
        </div>
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
                    <div className="mt-1 flex flex-wrap items-center gap-2">
  <span className="text-xs font-medium text-gray-600">
    Blood Group:
  </span>

  <span
    className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${
      item.bloodGroup
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-gray-200 bg-gray-50 text-gray-500'
    }`}
  >
    {item.bloodGroup || 'Not Added'}
  </span>
</div>
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
          <p className="text-sm">
  Blood Group: {vaultStaff.bloodGroup || 'Not Added'}
</p>
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
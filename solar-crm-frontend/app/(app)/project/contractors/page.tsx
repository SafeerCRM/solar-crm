'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Contractor = {
  id: number;
  contractorName?: string;
  phone?: string;
  alternatePhone?: string;
  city?: string;
  address?: string;
  linkedUserId?: number;

  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  bankProofUrl?: string;

  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  panNumber?: string;

  remarks?: string;
  isActive?: boolean;
  createdAt?: string;
};

type ContractorUser = {
  id: number;
  name?: string;
  email?: string;
  roles?: string[];
};

export default function ProjectContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorUsers, setContractorUsers] = useState<ContractorUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

const [aadhaarFrontFile, setAadhaarFrontFile] =
  useState<File | null>(null);

const [aadhaarBackFile, setAadhaarBackFile] =
  useState<File | null>(null);

const [bankProofFile, setBankProofFile] =
  useState<File | null>(null);

  const [form, setForm] = useState({
  contractorName: '',
  phone: '',
  alternatePhone: '',
  city: '',
  address: '',
  linkedUserId: '',

  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  upiId: '',
  panNumber: '',

  aadhaarFrontUrl: '',
  aadhaarBackUrl: '',
  bankProofUrl: '',

  remarks: '',
});

  const fetchContractorUsers = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(`${API_BASE_URL}/users`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const users = Array.isArray(res.data) ? res.data : [];

    setContractorUsers(
      users.filter((user: ContractorUser) =>
        Array.isArray(user.roles) &&
        user.roles.includes('PROJECT_CONTRACTOR'),
      ),
    );
  } catch (error) {
    console.error(error);
  }
};

  const fetchContractors = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await axios.get(
        `${API_BASE_URL}/project/contractor-master`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      setContractors(
        Array.isArray(res.data) ? res.data : [],
      );
    } catch (error) {
      console.error(error);
      alert('Failed to load contractors');
    }
  };

  const uploadFile = async (file: File) => {
  const token = localStorage.getItem('token');

  const formData = new FormData();

  formData.append('file', file);

  const res = await axios.post(
    `${API_BASE_URL}/meetings/proof/upload`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return (
    res.data?.url ||
    res.data?.fileUrl ||
    ''
  );
};

  const createContractor = async () => {
    if (!form.contractorName.trim()) {
      alert('Contractor name is required');
      return;
    }

    if (!form.phone.trim()) {
      alert('Phone number is required');
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      let aadhaarFrontUrl = '';
let aadhaarBackUrl = '';
let bankProofUrl = '';

if (aadhaarFrontFile) {
  setUploading(true);

  aadhaarFrontUrl =
    await uploadFile(aadhaarFrontFile);
}

if (aadhaarBackFile) {
  setUploading(true);

  aadhaarBackUrl =
    await uploadFile(aadhaarBackFile);
}

if (bankProofFile) {
  setUploading(true);

  bankProofUrl =
    await uploadFile(bankProofFile);
}

      await axios.post(
        `${API_BASE_URL}/project/contractor-master`,
        {
          contractorName: form.contractorName,
          phone: form.phone,
          alternatePhone: form.alternatePhone,
          city: form.city,
          address: form.address,
          linkedUserId: form.linkedUserId
            ? Number(form.linkedUserId)
            : undefined,
            accountHolderName: form.accountHolderName,
bankName: form.bankName,
accountNumber: form.accountNumber,
ifscCode: form.ifscCode,
upiId: form.upiId,
panNumber: form.panNumber,

aadhaarFrontUrl,
aadhaarBackUrl,
bankProofUrl,
          remarks: form.remarks,
        },
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      alert('Contractor created successfully');

      setForm({
  contractorName: '',
  phone: '',
  alternatePhone: '',
  city: '',
  address: '',
  linkedUserId: '',

  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  upiId: '',
  panNumber: '',

  aadhaarFrontUrl: '',
  aadhaarBackUrl: '',
  bankProofUrl: '',

  remarks: '',
});

setAadhaarFrontFile(null);
setAadhaarBackFile(null);
setBankProofFile(null);

      fetchContractors();
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          'Failed to create contractor',
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleContractor = async (
    contractor: Contractor,
  ) => {
    try {
      const token = localStorage.getItem('token');

      await axios.patch(
        `${API_BASE_URL}/project/contractor-master/${contractor.id}/${
          contractor.isActive ? 'delete' : 'enable'
        }`,
        {},
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      fetchContractors();
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          'Failed to update contractor',
      );
    }
  };

  useEffect(() => {
  fetchContractors();
  fetchContractorUsers();
}, []);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Project Contractors
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage project contractors used for execution work.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          Add Contractor
        </h2>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input
            placeholder="Contractor Name"
            value={form.contractorName}
            onChange={(e) =>
              setForm({
                ...form,
                contractorName: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Alternate Phone"
            value={form.alternatePhone}
            onChange={(e) =>
              setForm({
                ...form,
                alternatePhone: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
            placeholder="City"
            value={form.city}
            onChange={(e) =>
              setForm({
                ...form,
                city: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <select
  value={form.linkedUserId}
  onChange={(e) =>
    setForm({
      ...form,
      linkedUserId: e.target.value,
    })
  }
  className="rounded-xl border p-3"
>
  <option value="">Select PROJECT_CONTRACTOR User</option>

  {contractorUsers.map((user) => (
    <option key={user.id} value={user.id}>
      {user.name || user.email || `User ${user.id}`} — ID {user.id}
    </option>
  ))}
</select>

          <input
            placeholder="Address"
            value={form.address}
            onChange={(e) =>
              setForm({
                ...form,
                address: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
  placeholder="Account Holder Name"
  value={form.accountHolderName}
  onChange={(e) =>
    setForm({
      ...form,
      accountHolderName: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>

<input
  placeholder="Bank Name"
  value={form.bankName}
  onChange={(e) =>
    setForm({
      ...form,
      bankName: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>

<input
  placeholder="Account Number"
  value={form.accountNumber}
  onChange={(e) =>
    setForm({
      ...form,
      accountNumber: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>

<input
  placeholder="IFSC Code"
  value={form.ifscCode}
  onChange={(e) =>
    setForm({
      ...form,
      ifscCode: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>

<input
  placeholder="UPI ID"
  value={form.upiId}
  onChange={(e) =>
    setForm({
      ...form,
      upiId: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>

<input
  placeholder="PAN Number"
  value={form.panNumber}
  onChange={(e) =>
    setForm({
      ...form,
      panNumber: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>

<div className="rounded-xl border p-3">
  <p className="mb-2 text-sm font-semibold">
    Aadhaar Front
  </p>

  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setAadhaarFrontFile(
        e.target.files?.[0] || null,
      )
    }
  />
</div>

<div className="rounded-xl border p-3">
  <p className="mb-2 text-sm font-semibold">
    Aadhaar Back
  </p>

  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      setAadhaarBackFile(
        e.target.files?.[0] || null,
      )
    }
  />
</div>

<div className="rounded-xl border p-3">
  <p className="mb-2 text-sm font-semibold">
    Bank Proof
  </p>

  <input
    type="file"
    accept="image/*,.pdf"
    onChange={(e) =>
      setBankProofFile(
        e.target.files?.[0] || null,
      )
    }
  />
</div>
        </div>

        <textarea
          placeholder="Remarks"
          value={form.remarks}
          onChange={(e) =>
            setForm({
              ...form,
              remarks: e.target.value,
            })
          }
          className="mt-3 w-full rounded-xl border p-3"
          rows={3}
        />

        <button
          onClick={createContractor}
          disabled={loading}
          className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          loading || uploading
  ? 'Uploading...'
  : 'Create Contractor'
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          Contractor List
        </h2>

        <div className="mt-5 space-y-3">
          {contractors.length === 0 ? (
            <p className="text-sm text-gray-500">
              No contractors found.
            </p>
          ) : (
            contractors.map((contractor) => (
              <div
                key={contractor.id}
                className="rounded-xl border bg-gray-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-800">
                      {contractor.contractorName}
                    </p>

                    <p className="text-sm text-gray-500">
                      Phone: {contractor.phone}
                    </p>

                    <p className="text-sm text-gray-500">
                      Alternate:{' '}
                      {contractor.alternatePhone || '-'}
                    </p>

                    <p className="text-sm text-gray-500">
                      City: {contractor.city || '-'}
                    </p>

                    <p className="text-sm text-gray-500">
                      Linked User ID:{' '}
                      {contractor.linkedUserId || '-'}
                    </p>

                    {contractor.address && (
                      <p className="mt-2 text-sm text-gray-700">
                        {contractor.address}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
  {contractor.aadhaarFrontUrl && (
    <a
      href={contractor.aadhaarFrontUrl}
      target="_blank"
      rel="noreferrer"
      className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700"
    >
      Aadhaar Front
    </a>
  )}

  {contractor.aadhaarBackUrl && (
    <a
      href={contractor.aadhaarBackUrl}
      target="_blank"
      rel="noreferrer"
      className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700"
    >
      Aadhaar Back
    </a>
  )}

  {contractor.bankProofUrl && (
    <a
      href={contractor.bankProofUrl}
      target="_blank"
      rel="noreferrer"
      className="rounded-lg bg-green-100 px-3 py-2 text-xs font-semibold text-green-700"
    >
      Bank Proof
    </a>
  )}
</div>

                    {contractor.remarks && (
                      <p className="mt-2 text-sm text-gray-700">
                        {contractor.remarks}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        contractor.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {contractor.isActive
                        ? 'ACTIVE'
                        : 'DISABLED'}
                    </span>

                    <button
                      onClick={() =>
                        toggleContractor(contractor)
                      }
                      className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                        contractor.isActive
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {contractor.isActive
                        ? 'Disable'
                        : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
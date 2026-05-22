'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type VendorItem = {
  id: number;
  vendorName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  materialCategory?: string;
  remarks?: string;
  isActive?: boolean;
};

export default function VendorMasterPage() {
  const [items, setItems] = useState<VendorItem[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [searchText, setSearchText] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('');

  const [userRoles, setUserRoles] =
    useState<string[]>([]);

  const [form, setForm] = useState({
    vendorName: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstNumber: '',
    address: '',
    city: '',
    state: '',
    materialCategory: '',
    remarks: '',
  });

  const fetchItems = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem('token');

      const res = await axios.get(
        `${API_BASE_URL}/project/vendor`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      setItems(res.data || []);
    } catch (error) {
      console.error(error);
      alert('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    try {
      const storedUser =
        localStorage.getItem('user');

      if (storedUser) {
        const parsed =
          JSON.parse(storedUser);

        setUserRoles(parsed?.roles || []);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const canManage =
    userRoles.includes('OWNER') ||
    userRoles.includes('PROJECT_MANAGER');

  const saveVendor = async () => {
    if (!form.vendorName.trim()) {
      alert('Vendor name required');
      return;
    }

    try {
      const token =
        localStorage.getItem('token');

      if (editingId) {
        await axios.patch(
          `${API_BASE_URL}/project/vendor/${editingId}`,
          form,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          },
        );

        alert('Vendor updated');
      } else {
        await axios.post(
          `${API_BASE_URL}/project/vendor`,
          form,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          },
        );

        alert('Vendor added');
      }

      setForm({
        vendorName: '',
        contactPerson: '',
        phone: '',
        email: '',
        gstNumber: '',
        address: '',
        city: '',
        state: '',
        materialCategory: '',
        remarks: '',
      });

      setEditingId(null);

      fetchItems();
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          'Failed to save vendor',
      );
    }
  };

  const startEdit = (item: VendorItem) => {
    setEditingId(item.id);

    setForm({
      vendorName: item.vendorName || '',
      contactPerson:
        item.contactPerson || '',
      phone: item.phone || '',
      email: item.email || '',
      gstNumber: item.gstNumber || '',
      address: item.address || '',
      city: item.city || '',
      state: item.state || '',
      materialCategory:
        item.materialCategory || '',
      remarks: item.remarks || '',
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);

    setForm({
      vendorName: '',
      contactPerson: '',
      phone: '',
      email: '',
      gstNumber: '',
      address: '',
      city: '',
      state: '',
      materialCategory: '',
      remarks: '',
    });
  };

  const toggleVendorStatus = async (
    item: VendorItem,
  ) => {
    const confirmed = window.confirm(
      item.isActive
        ? 'Disable this vendor?'
        : 'Enable this vendor?',
    );

    if (!confirmed) {
      return;
    }

    try {
      const token =
        localStorage.getItem('token');

      await axios.patch(
        `${API_BASE_URL}/project/vendor/${item.id}/${
          item.isActive
            ? 'delete'
            : 'enable'
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

      fetchItems();
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          'Failed to update vendor',
      );
    }
  };

  const filteredItems = items.filter(
    (item) => {
      const matchesSearch = searchText
        ? `${item.vendorName || ''} ${
            item.contactPerson || ''
          } ${item.materialCategory || ''}`
            .toLowerCase()
            .includes(
              searchText.toLowerCase(),
            )
        : true;

      const matchesStatus = statusFilter
        ? statusFilter === 'ACTIVE'
          ? item.isActive !== false
          : item.isActive === false
        : true;

      return (
        matchesSearch && matchesStatus
      );
    },
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Vendor Master
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Manage supplier and vendor
          records
        </p>
      </div>

      {canManage && (
        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="mb-4 text-lg font-bold">
            {editingId
              ? 'Edit Vendor'
              : 'Add Vendor'}
          </h2>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              placeholder="Vendor Name"
              value={form.vendorName}
              onChange={(e) =>
                setForm({
                  ...form,
                  vendorName:
                    e.target.value,
                })
              }
              className="rounded-xl border p-3"
            />

            <input
              placeholder="Contact Person"
              value={form.contactPerson}
              onChange={(e) =>
                setForm({
                  ...form,
                  contactPerson:
                    e.target.value,
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
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              className="rounded-xl border p-3"
            />

            <input
              placeholder="GST Number"
              value={form.gstNumber}
              onChange={(e) =>
                setForm({
                  ...form,
                  gstNumber:
                    e.target.value,
                })
              }
              className="rounded-xl border p-3"
            />

            <input
              placeholder="Material Category"
              value={form.materialCategory}
              onChange={(e) =>
                setForm({
                  ...form,
                  materialCategory:
                    e.target.value,
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

            <input
              placeholder="State"
              value={form.state}
              onChange={(e) =>
                setForm({
                  ...form,
                  state: e.target.value,
                })
              }
              className="rounded-xl border p-3"
            />
          </div>

          <textarea
            placeholder="Address"
            value={form.address}
            onChange={(e) =>
              setForm({
                ...form,
                address: e.target.value,
              })
            }
            className="mt-3 w-full rounded-xl border p-3"
          />

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
          />

          <button
            onClick={saveVendor}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            {editingId
              ? 'Update Vendor'
              : 'Add Vendor'}
          </button>

          {editingId && (
            <button
              onClick={cancelEdit}
              className="ml-3 mt-4 rounded-xl bg-gray-600 px-5 py-3 font-semibold text-white hover:bg-gray-700"
            >
              Cancel Edit
            </button>
          )}
        </div>
      )}

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <input
            placeholder="Search vendor"
            value={searchText}
            onChange={(e) =>
              setSearchText(
                e.target.value,
              )
            }
            className="rounded-xl border p-3"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value,
              )
            }
            className="rounded-xl border p-3"
          >
            <option value="">
              All Status
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="DISABLED">
              Disabled
            </option>
          </select>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-sm text-gray-500">
            No vendors added yet
          </p>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 ${
                  item.isActive
                    ? 'bg-white'
                    : 'bg-gray-100 opacity-70'
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-bold text-gray-800">
                      {item.vendorName}
                    </p>

                    <p className="text-sm text-gray-500">
                      {item.contactPerson ||
                        '-'}{' '}
                      | {item.phone || '-'}
                    </p>

                    <p className="text-sm text-gray-500">
                      {
                        item.materialCategory
                      }{' '}
                      | {item.city || '-'}
                    </p>

                    {item.gstNumber && (
                      <p className="text-sm text-blue-700">
                        GST:{' '}
                        {item.gstNumber}
                      </p>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          startEdit(item)
                        }
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          toggleVendorStatus(
                            item,
                          )
                        }
                        className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                          item.isActive
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {item.isActive
                          ? 'Disable'
                          : 'Enable'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
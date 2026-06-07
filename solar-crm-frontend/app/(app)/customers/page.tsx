'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Customer = {
  id: number;
  customerCode?: string;
  customerName?: string;
  mobile?: string;
  alternateMobile?: string;
  email?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  electricityKNumber?: string;
  address?: string;
  city?: string;
  zone?: string;
  branchName?: string;
  customerStatus?: string;
  customerSource?: string;
  isPortalEnabled?: boolean;
  remarks?: string;
  isHidden?: boolean;
  hiddenReason?: string;
  createdAt?: string;
};

type Summary = {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  blacklistedCustomers: number;
  portalEnabledCustomers: number;
};

const emptyForm = {
  customerName: '',
  mobile: '',
  alternateMobile: '',
  email: '',
  aadhaarNumber: '',
  panNumber: '',
  electricityKNumber: '',
  address: '',
  city: '',
  zone: '',
  branchName: '',
  customerStatus: 'ACTIVE',
  customerSource: 'MANUAL',
  isPortalEnabled: false,
  remarks: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    blacklistedCustomers: 0,
    portalEnabledCustomers: 0,
  });

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [branch, setBranch] = useState('');
  const [status, setStatus] = useState('');
  const [customerSource, setCustomerSource] = useState('');
  const [showHidden, setShowHidden] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    city: '',
    zone: '',
    branch: '',
    status: '',
    customerSource: '',
    showHidden: false,
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/customers/summary`, {
        headers: getAuthHeaders(),
      });

      setSummary(res.data || {});
    } catch (error) {
      console.error('Failed to load customer summary:', error);
    }
  };

  const fetchCustomers = async (targetPage = page) => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE_URL}/customers`, {
        params: {
          page: targetPage,
          limit,
          search: appliedFilters.search,
          city: appliedFilters.city,
          zone: appliedFilters.zone,
          branch: appliedFilters.branch,
          status: appliedFilters.status,
          customerSource: appliedFilters.customerSource,
          showHidden: appliedFilters.showHidden ? 'true' : 'false',
        },
        headers: getAuthHeaders(),
      });

      setCustomers(res.data?.data || []);
      setPage(res.data?.page || targetPage);
      setTotalPages(res.data?.totalPages || 1);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const saveCustomer = async () => {
    if (!form.customerName.trim()) {
      alert('Customer name is required');
      return;
    }

    if (!form.mobile.trim() && !form.email.trim() && !form.electricityKNumber.trim()) {
      alert('Please enter at least Mobile, Email, or Electricity K Number');
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await axios.patch(`${API_BASE_URL}/customers/${editingId}`, form, {
          headers: getAuthHeaders(),
        });

        alert('Customer updated successfully');
      } else {
        const res = await axios.post(`${API_BASE_URL}/customers`, form, {
          headers: getAuthHeaders(),
        });

        alert(res.data?.message || 'Customer saved successfully');
      }

      resetForm();
      fetchSummary();
      fetchCustomers(1);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (customer: Customer) => {
    setEditingId(customer.id);

    setForm({
      customerName: customer.customerName || '',
      mobile: customer.mobile || '',
      alternateMobile: customer.alternateMobile || '',
      email: customer.email || '',
      aadhaarNumber: customer.aadhaarNumber || '',
      panNumber: customer.panNumber || '',
      electricityKNumber: customer.electricityKNumber || '',
      address: customer.address || '',
      city: customer.city || '',
      zone: customer.zone || '',
      branchName: customer.branchName || '',
      customerStatus: customer.customerStatus || 'ACTIVE',
      customerSource: customer.customerSource || 'MANUAL',
      isPortalEnabled: customer.isPortalEnabled === true,
      remarks: customer.remarks || '',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hideCustomer = async (customer: Customer) => {
    const reason = window.prompt(
      'Why do you want to hide this customer?',
      'Duplicate / test customer',
    );

    if (reason === null) return;

    try {
      await axios.patch(
        `${API_BASE_URL}/customers/${customer.id}/hide`,
        { reason },
        { headers: getAuthHeaders() },
      );

      alert('Customer hidden successfully');
      fetchSummary();
      fetchCustomers(page);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to hide customer');
    }
  };

  const restoreCustomer = async (customer: Customer) => {
    const reason = window.prompt(
      'Why do you want to restore this customer?',
      'Restored after review',
    );

    if (reason === null) return;

    try {
      await axios.patch(
        `${API_BASE_URL}/customers/${customer.id}/restore`,
        { reason },
        { headers: getAuthHeaders() },
      );

      alert('Customer restored successfully');
      fetchSummary();
      fetchCustomers(page);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to restore customer');
    }
  };

  const applyFilters = () => {
    setAppliedFilters({
      search,
      city,
      zone,
      branch,
      status,
      customerSource,
      showHidden,
    });
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setCity('');
    setZone('');
    setBranch('');
    setStatus('');
    setCustomerSource('');
    setShowHidden(false);

    setAppliedFilters({
      search: '',
      city: '',
      zone: '',
      branch: '',
      status: '',
      customerSource: '',
      showHidden: false,
    });

    setPage(1);
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCustomers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">Customer Master</h1>
        <p className="mt-1 text-sm text-gray-500">
          Central customer database for leads, meetings, projects, complaints, service, warranty, and customer portal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="Total Customers" value={summary.totalCustomers} />
        <SummaryCard title="Active" value={summary.activeCustomers} />
        <SummaryCard title="Inactive" value={summary.inactiveCustomers} />
        <SummaryCard title="Blacklisted" value={summary.blacklistedCustomers} />
        <SummaryCard title="Portal Enabled" value={summary.portalEnabledCustomers} />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          {editingId ? 'Edit Customer' : 'Create Customer'}
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            placeholder="Customer Name *"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Mobile"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Alternate Mobile"
            value={form.alternateMobile}
            onChange={(e) => setForm({ ...form, alternateMobile: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Electricity K Number"
            value={form.electricityKNumber}
            onChange={(e) => setForm({ ...form, electricityKNumber: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Aadhaar Number"
            value={form.aadhaarNumber}
            onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="PAN Number"
            value={form.panNumber}
            onChange={(e) => setForm({ ...form, panNumber: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Zone"
            value={form.zone}
            onChange={(e) => setForm({ ...form, zone: e.target.value })}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Branch"
            value={form.branchName}
            onChange={(e) => setForm({ ...form, branchName: e.target.value })}
            className="rounded-xl border p-3"
          />

          <select
            value={form.customerStatus}
            onChange={(e) => setForm({ ...form, customerStatus: e.target.value })}
            className="rounded-xl border p-3"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLACKLISTED">Blacklisted</option>
          </select>

          <select
            value={form.customerSource}
            onChange={(e) => setForm({ ...form, customerSource: e.target.value })}
            className="rounded-xl border p-3"
          >
            <option value="MANUAL">Manual</option>
            <option value="LEAD">Lead</option>
            <option value="MEETING">Meeting</option>
            <option value="PROJECT">Project</option>
            <option value="IMPORT">Import</option>
            <option value="REFERRAL">Referral</option>
          </select>

          <label className="flex items-center gap-3 rounded-xl border p-3">
            <input
              type="checkbox"
              checked={form.isPortalEnabled}
              onChange={(e) =>
                setForm({ ...form, isPortalEnabled: e.target.checked })
              }
            />
            <span className="text-sm font-semibold text-gray-700">
              Portal Enabled
            </span>
          </label>
        </div>

        <textarea
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="mt-3 w-full rounded-xl border p-3"
          rows={3}
        />

        <textarea
          placeholder="Remarks"
          value={form.remarks}
          onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          className="mt-3 w-full rounded-xl border p-3"
          rows={3}
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={saveCustomer}
            disabled={saving}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingId ? 'Update Customer' : 'Create Customer'}
          </button>

          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-xl bg-gray-600 px-5 py-3 font-semibold text-white hover:bg-gray-700"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">Filters</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            placeholder="Search code, name, mobile, email, K number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border p-3"
          />

          <select
            value={customerSource}
            onChange={(e) => setCustomerSource(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Sources</option>
            <option value="MANUAL">Manual</option>
            <option value="LEAD">Lead</option>
            <option value="MEETING">Meeting</option>
            <option value="PROJECT">Project</option>
            <option value="IMPORT">Import</option>
            <option value="REFERRAL">Referral</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLACKLISTED">Blacklisted</option>
          </select>

          <input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Zone"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="rounded-xl border p-3"
          />

          <label className="flex items-center gap-3 rounded-xl border p-3">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => setShowHidden(e.target.checked)}
            />
            <span className="text-sm font-semibold text-gray-700">
              View Hidden Customers
            </span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={applyFilters}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Apply Filters
          </button>

          <button
            onClick={resetFilters}
            className="rounded-xl bg-gray-600 px-5 py-3 font-semibold text-white hover:bg-gray-700"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-800">
          {appliedFilters.showHidden ? 'Hidden Customers' : 'Customer List'}
        </h2>

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading customers...</p>
        ) : customers.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No customers found.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="border p-3">Code</th>
                  <th className="border p-3">Customer</th>
                  <th className="border p-3">Mobile</th>
                  <th className="border p-3">Email</th>
                  <th className="border p-3">K Number</th>
                  <th className="border p-3">City</th>
                  <th className="border p-3">Zone</th>
                  <th className="border p-3">Source</th>
                  <th className="border p-3">Status</th>
                  <th className="border p-3">Portal</th>
                  <th className="border p-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="align-top">
                    <td className="border p-3 font-semibold">
                      {customer.customerCode || '-'}
                    </td>
                    <td className="border p-3">
                      <p className="font-semibold text-gray-800">
                        {customer.customerName || '-'}
                      </p>
                      {customer.remarks && (
                        <p className="mt-1 text-xs text-gray-500">
                          {customer.remarks}
                        </p>
                      )}
                      {customer.hiddenReason && appliedFilters.showHidden && (
                        <p className="mt-1 text-xs text-red-600">
                          Hidden: {customer.hiddenReason}
                        </p>
                      )}
                    </td>
                    <td className="border p-3">
                      {customer.mobile || '-'}
                      {customer.alternateMobile && (
                        <p className="text-xs text-gray-500">
                          Alt: {customer.alternateMobile}
                        </p>
                      )}
                    </td>
                    <td className="border p-3">{customer.email || '-'}</td>
                    <td className="border p-3">
                      {customer.electricityKNumber || '-'}
                    </td>
                    <td className="border p-3">{customer.city || '-'}</td>
                    <td className="border p-3">{customer.zone || '-'}</td>
                    <td className="border p-3">
                      {customer.customerSource || 'MANUAL'}
                    </td>
                    <td className="border p-3">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                        {customer.customerStatus || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="border p-3">
                      {customer.isPortalEnabled ? 'Yes' : 'No'}
                    </td>
                    <td className="border p-3">
                      <div className="flex flex-wrap gap-2">
                        {!appliedFilters.showHidden && (
                          <>
                            <button
                              onClick={() => startEdit(customer)}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => hideCustomer(customer)}
                              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                            >
                              Hide
                            </button>
                          </>
                        )}

                        {appliedFilters.showHidden && (
                          <button
                            onClick={() => restoreCustomer(customer)}
                            className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => fetchCustomers(page - 1)}
              className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Previous
            </button>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => fetchCustomers(page + 1)}
              className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-800">
        {Number(value || 0).toLocaleString('en-IN')}
      </p>
    </div>
  );
}
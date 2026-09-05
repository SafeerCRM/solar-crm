'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import {
  Directory,
  Encoding,
  Filesystem,
} from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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
portalUsername?: string;
lastPortalLoginAt?: string;
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

type CustomerAnnouncement = {
  id: number;
  title: string;
  message: string;
  audienceType: string;
  cities?: string[];
  branches?: string[];
  projectStatuses?: string[];
  specificCustomerIds?: number[];
  popupRequired?: boolean;
  pushRequired?: boolean;
  publishType?: string;
  publishAt?: string;
  expiresAt?: string;
  isActive?: boolean;
  isHidden?: boolean;
  createdByName?: string;
  createdByRole?: string;
  createdAt?: string;
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
    const [activeSection, setActiveSection] =
  useState<
    'CUSTOMERS' | 'ANNOUNCEMENTS'
  >('CUSTOMERS');
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
const [exporting, setExporting] = useState(false);
  const [selectedCustomerProjects, setSelectedCustomerProjects] = useState<any[]>([]);
const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
const [showProjectsModal, setShowProjectsModal] = useState(false);
const [portalLoadingId, setPortalLoadingId] = useState<number | null>(null);
const [passwordModalCustomer, setPasswordModalCustomer] = useState<Customer | null>(null);
const [portalPasswordForm, setPortalPasswordForm] = useState({
  newPassword: '',
  confirmPassword: '',
});
const [showPortalPassword, setShowPortalPassword] = useState(false);

const [
  announcements,
  setAnnouncements,
] = useState<CustomerAnnouncement[]>([]);

const [
  announcementsLoading,
  setAnnouncementsLoading,
] = useState(false);

const [
  announcementPage,
  setAnnouncementPage,
] = useState(1);

const [
  announcementTotalPages,
  setAnnouncementTotalPages,
] = useState(1);

const [announcementSaving, setAnnouncementSaving] =
  useState(false);

const [announcementForm, setAnnouncementForm] = useState({
  title: '',
  message: '',
  audienceType: 'ALL',
  cities: '',
  branches: '',
  projectStatuses: '',
  specificCustomerIds: '',
  popupRequired: true,
  pushRequired: true,
});

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

  

  const fetchAnnouncements = async (
  targetPage = 1,
) => {
  try {
    setAnnouncementsLoading(true);

    const res =
      await axios.get(
        `${API_BASE_URL}/customer-portal/announcements`,
        {
          params: {
            page: targetPage,
            limit: 20,
          },
          headers:
            getAuthHeaders(),
        },
      );

    setAnnouncements(
      res.data?.data || [],
    );

    setAnnouncementPage(
      res.data?.page ||
        targetPage,
    );

    setAnnouncementTotalPages(
      res.data?.totalPages ||
        1,
    );
  } catch (error: any) {
    console.error(
      'Failed to load customer announcements:',
      error,
    );

    alert(
      error?.response?.data?.message ||
        'Failed to load customer announcements',
    );
  } finally {
    setAnnouncementsLoading(
      false,
    );
  }
};

const createAnnouncement = async () => {
  const title =
    announcementForm.title.trim();

  const message =
    announcementForm.message.trim();

  if (!title) {
    alert('Announcement title is required');
    return;
  }

  if (!message) {
    alert('Announcement message is required');
    return;
  }

  const cities =
    announcementForm.cities
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const branches =
    announcementForm.branches
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const projectStatuses =
    announcementForm.projectStatuses
      .split(',')
      .map((item) =>
        item.trim().toUpperCase(),
      )
      .filter(Boolean);

  const specificCustomerIds =
    announcementForm.specificCustomerIds
      .split(',')
      .map((item) =>
        Number(item.trim()),
      )
      .filter(
        (item) =>
          Number.isInteger(item) &&
          item > 0,
      );

  if (
    announcementForm.audienceType ===
      'SPECIFIC_CUSTOMERS' &&
    specificCustomerIds.length === 0
  ) {
    alert(
      'Please enter at least one valid customer ID',
    );
    return;
  }

  try {
    setAnnouncementSaving(true);

    const res =
      await axios.post(
        `${API_BASE_URL}/customer-portal/announcements`,
        {
          title,
          message,

          audienceType:
            announcementForm.audienceType,

          cities,
          branches,
          projectStatuses,
          specificCustomerIds,

          popupRequired:
            announcementForm.popupRequired,

          pushRequired:
            announcementForm.pushRequired,

          publishType: 'NOW',
        },
        {
          headers:
            getAuthHeaders(),
        },
      );

    alert(
      `${res.data?.message || 'Announcement published successfully'}${
        res.data?.recipientCount !== undefined
          ? `\nRecipients: ${res.data.recipientCount}`
          : ''
      }`,
    );

    setAnnouncementForm({
      title: '',
      message: '',
      audienceType: 'ALL',
      cities: '',
      branches: '',
      projectStatuses: '',
      specificCustomerIds: '',
      popupRequired: true,
      pushRequired: true,
    });

    fetchAnnouncements(1);
  } catch (error: any) {
    console.error(
      'Failed to create customer announcement:',
      error,
    );

    alert(
      error?.response?.data?.message ||
        'Failed to create customer announcement',
    );
  } finally {
    setAnnouncementSaving(false);
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

  const viewCustomerProjects = async (customer: Customer) => {
  try {
    setSelectedCustomer(customer);
    setShowProjectsModal(true);

    const res = await axios.get(
      `${API_BASE_URL}/customers/${customer.id}/projects`,
      {
        headers: getAuthHeaders(),
      },
    );

    setSelectedCustomerProjects(res.data?.projects || []);
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to load customer projects');
  }
};

const enablePortal = async (customer: Customer) => {
  const username = window.prompt(
    'Enter portal username. Mobile or K Number recommended.',
    customer.mobile || customer.electricityKNumber || customer.customerCode || '',
  );

  if (username === null) return;

  try {
    setPortalLoadingId(customer.id);

    await axios.patch(
      `${API_BASE_URL}/customers/${customer.id}/enable-portal`,
      { portalUsername: username },
      { headers: getAuthHeaders() },
    );

    alert('Customer portal enabled successfully');
    fetchSummary();
    fetchCustomers(page);
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to enable portal');
  } finally {
    setPortalLoadingId(null);
  }
};

const disablePortal = async (customer: Customer) => {
  const confirmed = window.confirm(
    `Disable portal access for ${customer.customerName || 'this customer'}?`,
  );

  if (!confirmed) return;

  try {
    setPortalLoadingId(customer.id);

    await axios.patch(
      `${API_BASE_URL}/customers/${customer.id}/disable-portal`,
      {},
      { headers: getAuthHeaders() },
    );

    alert('Customer portal disabled successfully');
    fetchSummary();
    fetchCustomers(page);
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to disable portal');
  } finally {
    setPortalLoadingId(null);
  }
};

const resetPortalUsername = async (customer: Customer) => {
  const username = window.prompt(
    'Enter new portal username',
    customer.portalUsername ||
      customer.mobile ||
      customer.electricityKNumber ||
      customer.customerCode ||
      '',
  );

  if (username === null) return;

  try {
    setPortalLoadingId(customer.id);

    await axios.patch(
      `${API_BASE_URL}/customers/${customer.id}/reset-portal-username`,
      { portalUsername: username },
      { headers: getAuthHeaders() },
    );

    alert('Portal username updated successfully');
    fetchCustomers(page);
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to reset portal username');
  } finally {
    setPortalLoadingId(null);
  }
};

const resetPortalPassword = async () => {
  if (!passwordModalCustomer) return;

  if (!portalPasswordForm.newPassword.trim()) {
    alert('Password is required');
    return;
  }

  if (portalPasswordForm.newPassword.trim().length < 4) {
    alert('Password must be at least 4 characters');
    return;
  }

  if (portalPasswordForm.newPassword !== portalPasswordForm.confirmPassword) {
    alert('New password and confirm password do not match');
    return;
  }

  try {
    setPortalLoadingId(passwordModalCustomer.id);

    await axios.patch(
      `${API_BASE_URL}/customers/${passwordModalCustomer.id}/reset-portal-password`,
      { portalPassword: portalPasswordForm.newPassword },
      { headers: getAuthHeaders() },
    );

    alert('Customer portal password updated successfully');

    setPasswordModalCustomer(null);
    setPortalPasswordForm({
      newPassword: '',
      confirmPassword: '',
    });
    setShowPortalPassword(false);

    fetchCustomers(page);
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to reset portal password');
  } finally {
    setPortalLoadingId(null);
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

  const escapeCsvValue = (value: any) => {
  const text = String(value ?? '');

  return `"${text.replace(/"/g, '""')}"`;
};

const exportCustomersCsv = async () => {
  try {
    setExporting(true);

    const res = await axios.get(
      `${API_BASE_URL}/customers/export`,
      {
        params: {
          search: appliedFilters.search,
          city: appliedFilters.city,
          zone: appliedFilters.zone,
          branch: appliedFilters.branch,
          status: appliedFilters.status,
          customerSource:
            appliedFilters.customerSource,
          showHidden:
            appliedFilters.showHidden
              ? 'true'
              : 'false',
        },
        headers: getAuthHeaders(),
      },
    );

    const rows = Array.isArray(res.data)
      ? res.data
      : [];

    if (!rows.length) {
      alert(
        'No customers found for the applied filters.',
      );
      return;
    }

    const headers = [
      'Name',
      'Contact Number',
      'City',
      'K Number',
    ];

    const csvRows = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map((item: any) =>
        [
          item.customerName,
          item.contactNumber,
          item.city,
          item.kNumber,
        ]
          .map(escapeCsvValue)
          .join(','),
      ),
    ];

    const csvContent =
      '\uFEFF' + csvRows.join('\r\n');

    const date =
  new Date()
    .toISOString()
    .slice(0, 10);

const fileName =
  `customers-${date}.csv`;

/*
 * APK:
 * Save to app cache and open
 * Android share/save sheet.
 */
if (Capacitor.isNativePlatform()) {
  const writeResult =
    await Filesystem.writeFile({
      path: fileName,
      data: csvContent,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    });

  await Share.share({
    title: 'Customer List',
    text:
      `${rows.length} customer record${
        rows.length === 1 ? '' : 's'
      }`,
    files: [
      writeResult.uri,
    ],
    dialogTitle:
      'Save or share customer list',
  });

  return;
}

/*
 * Web:
 * Normal browser download.
 */
const blob = new Blob(
  [csvContent],
  {
    type: 'text/csv;charset=utf-8;',
  },
);

const url =
  URL.createObjectURL(blob);

const link =
  document.createElement('a');

link.href = url;
link.download = fileName;

document.body.appendChild(link);
link.click();
link.remove();

URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to export customers',
    );
  } finally {
    setExporting(false);
  }
};

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCustomers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  useEffect(() => {
  if (
    activeSection ===
    'ANNOUNCEMENTS'
  ) {
    fetchAnnouncements(1);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeSection]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">Customer Master</h1>
        <p className="mt-1 text-sm text-gray-500">
          Central customer database for leads, meetings, projects, complaints, service, warranty, and customer portal.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-2 shadow">
  <div className="flex flex-wrap gap-2">
    <button
      type="button"
      onClick={() =>
        setActiveSection(
          'CUSTOMERS',
        )
      }
      className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
        activeSection ===
        'CUSTOMERS'
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      Customer Management
    </button>

    <button
      type="button"
      onClick={() =>
        setActiveSection(
          'ANNOUNCEMENTS',
        )
      }
      className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
        activeSection ===
        'ANNOUNCEMENTS'
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      Customer Announcements
    </button>
  </div>
</div>

{activeSection === 'CUSTOMERS' && (
  <>

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

  <button
    onClick={exportCustomersCsv}
    disabled={exporting}
    className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
  >
    {exporting
      ? 'Exporting...'
      : 'Download CSV'}
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
                  <th className="border p-3">Portal Username</th>
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
  <span
    className={`rounded-full px-3 py-1 text-xs font-semibold ${
      customer.isPortalEnabled
        ? 'bg-green-100 text-green-700'
        : 'bg-gray-100 text-gray-600'
    }`}
  >
    {customer.isPortalEnabled ? 'Enabled' : 'Disabled'}
  </span>
</td>

<td className="border p-3">
  <p className="font-semibold text-gray-800">
    {customer.portalUsername || '-'}
  </p>
  {customer.lastPortalLoginAt && (
    <p className="mt-1 text-xs text-gray-500">
      Last login:{' '}
      {new Date(customer.lastPortalLoginAt).toLocaleString('en-IN')}
    </p>
  )}
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
  onClick={() => viewCustomerProjects(customer)}
  className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700"
>
  Projects
</button>

{customer.isPortalEnabled ? (
  <button
    onClick={() => disablePortal(customer)}
    disabled={portalLoadingId === customer.id}
    className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
  >
    Disable Portal
  </button>
) : (
  <button
    onClick={() => enablePortal(customer)}
    disabled={portalLoadingId === customer.id}
    className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
  >
    Enable Portal
  </button>
)}

<button
  onClick={() => resetPortalUsername(customer)}
  disabled={portalLoadingId === customer.id}
  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
>
  Reset Username
</button>

<button
  onClick={() => {
    setPasswordModalCustomer(customer);
    setPortalPasswordForm({
      newPassword: customer.mobile || customer.electricityKNumber || customer.customerCode || '',
      confirmPassword: customer.mobile || customer.electricityKNumber || customer.customerCode || '',
    });
    setShowPortalPassword(false);
  }}
  disabled={portalLoadingId === customer.id}
  className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
>
  Reset Password
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
              </>
)}

{activeSection === 'ANNOUNCEMENTS' && (
  <div className="rounded-2xl bg-white p-5 shadow">
    <h2 className="text-xl font-bold text-gray-800">
      Customer Announcements
    </h2>

    <p className="mt-2 text-sm text-gray-500">
      Create and manage announcements for customer portal users.
    </p>

    <div className="mt-5 rounded-2xl border bg-gray-50 p-5">
  <h3 className="text-lg font-bold text-gray-800">
    Create Announcement
  </h3>

  <p className="mt-1 text-sm text-gray-500">
    Publish a notification to selected customer portal users.
  </p>

  <div className="mt-4 grid gap-3 md:grid-cols-2">
    <input
      type="text"
      placeholder="Announcement Title *"
      value={
        announcementForm.title
      }
      onChange={(e) =>
        setAnnouncementForm({
          ...announcementForm,
          title: e.target.value,
        })
      }
      className="rounded-xl border bg-white p-3"
    />

    <select
      value={
        announcementForm.audienceType
      }
      onChange={(e) =>
        setAnnouncementForm({
          ...announcementForm,
          audienceType:
            e.target.value,
        })
      }
      className="rounded-xl border bg-white p-3"
    >
      <option value="ALL">
        All Customers
      </option>

      <option value="RUNNING_PROJECT">
        Running Project
      </option>

      <option value="AFTER_SALES">
        After Sales
      </option>

      <option value="WITHOUT_PROJECT">
        Without Project
      </option>

      <option value="SPECIFIC_CUSTOMERS">
        Specific Customers
      </option>
    </select>
  </div>

  <textarea
    placeholder="Announcement Message *"
    value={
      announcementForm.message
    }
    onChange={(e) =>
      setAnnouncementForm({
        ...announcementForm,
        message: e.target.value,
      })
    }
    rows={4}
    className="mt-3 w-full rounded-xl border bg-white p-3"
  />

  <div className="mt-3 grid gap-3 md:grid-cols-3">
    <input
      type="text"
      placeholder="Cities (comma separated)"
      value={
        announcementForm.cities
      }
      onChange={(e) =>
        setAnnouncementForm({
          ...announcementForm,
          cities: e.target.value,
        })
      }
      className="rounded-xl border bg-white p-3"
    />

    <input
      type="text"
      placeholder="Branches (comma separated)"
      value={
        announcementForm.branches
      }
      onChange={(e) =>
        setAnnouncementForm({
          ...announcementForm,
          branches: e.target.value,
        })
      }
      className="rounded-xl border bg-white p-3"
    />

    <input
      type="text"
      placeholder="Project Statuses (comma separated)"
      value={
        announcementForm.projectStatuses
      }
      onChange={(e) =>
        setAnnouncementForm({
          ...announcementForm,
          projectStatuses:
            e.target.value,
        })
      }
      className="rounded-xl border bg-white p-3"
    />
  </div>

  {announcementForm.audienceType ===
    'SPECIFIC_CUSTOMERS' && (
    <div className="mt-3">
      <input
        type="text"
        placeholder="Customer IDs, e.g. 12, 25, 31"
        value={
          announcementForm.specificCustomerIds
        }
        onChange={(e) =>
          setAnnouncementForm({
            ...announcementForm,
            specificCustomerIds:
              e.target.value,
          })
        }
        className="w-full rounded-xl border bg-white p-3"
      />

      <p className="mt-1 text-xs text-gray-500">
        Enter Customer Master IDs separated by commas.
      </p>
    </div>
  )}

  <div className="mt-4 flex flex-wrap gap-3">
    <label className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3">
      <input
        type="checkbox"
        checked={
          announcementForm.popupRequired
        }
        onChange={(e) =>
          setAnnouncementForm({
            ...announcementForm,
            popupRequired:
              e.target.checked,
          })
        }
      />

      <span className="text-sm font-semibold text-gray-700">
        Popup Required
      </span>
    </label>

    <label className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3">
      <input
        type="checkbox"
        checked={
          announcementForm.pushRequired
        }
        onChange={(e) =>
          setAnnouncementForm({
            ...announcementForm,
            pushRequired:
              e.target.checked,
          })
        }
      />

      <span className="text-sm font-semibold text-gray-700">
        Push Required
      </span>
    </label>
  </div>

  <div className="mt-4">
    <button
      type="button"
      onClick={
        createAnnouncement
      }
      disabled={
        announcementSaving
      }
      className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {announcementSaving
        ? 'Publishing...'
        : 'Publish Announcement'}
    </button>
  </div>
</div>

    <div className="mt-5">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <h3 className="text-lg font-bold text-gray-800">
      Announcement History
    </h3>

    <button
      type="button"
      onClick={() =>
        fetchAnnouncements(
          announcementPage,
        )
      }
      disabled={
        announcementsLoading
      }
      className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
    >
      {announcementsLoading
        ? 'Refreshing...'
        : 'Refresh'}
    </button>
  </div>

  {announcementsLoading ? (
    <p className="mt-4 text-sm text-gray-500">
      Loading announcements...
    </p>
  ) : announcements.length ===
    0 ? (
    <div className="mt-4 rounded-xl border border-dashed p-6 text-sm text-gray-500">
      No customer announcements created yet.
    </div>
  ) : (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="border p-3">
              Title
            </th>

            <th className="border p-3">
              Audience
            </th>

            <th className="border p-3">
              Publish
            </th>

            <th className="border p-3">
              Created By
            </th>

            <th className="border p-3">
              Created
            </th>
          </tr>
        </thead>

        <tbody>
          {announcements.map(
            (announcement) => (
              <tr
                key={
                  announcement.id
                }
                className="align-top"
              >
                <td className="border p-3">
                  <p className="font-semibold text-gray-800">
                    {
                      announcement.title
                    }
                  </p>

                  <p className="mt-1 max-w-xl whitespace-pre-wrap text-xs text-gray-500">
                    {
                      announcement.message
                    }
                  </p>
                </td>

                <td className="border p-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {announcement.audienceType ||
                      '-'}
                  </span>
                </td>

                <td className="border p-3">
                  <p className="font-semibold text-gray-700">
                    {announcement.publishType ||
                      '-'}
                  </p>

                  {announcement.publishAt && (
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(
                        announcement.publishAt,
                      ).toLocaleString(
                        'en-IN',
                      )}
                    </p>
                  )}
                </td>

                <td className="border p-3">
                  {announcement.createdByName ||
                    '-'}

                  {announcement.createdByRole && (
                    <p className="mt-1 text-xs text-gray-500">
                      {
                        announcement.createdByRole
                      }
                    </p>
                  )}
                </td>

                <td className="border p-3">
                  {announcement.createdAt
                    ? new Date(
                        announcement.createdAt,
                      ).toLocaleString(
                        'en-IN',
                      )
                    : '-'}
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  )}

  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
    <p className="text-sm text-gray-500">
      Page {announcementPage} of{' '}
      {announcementTotalPages}
    </p>

    <div className="flex gap-2">
      <button
        type="button"
        disabled={
          announcementPage <= 1 ||
          announcementsLoading
        }
        onClick={() =>
          fetchAnnouncements(
            announcementPage - 1,
          )
        }
        className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        Previous
      </button>

      <button
        type="button"
        disabled={
          announcementPage >=
            announcementTotalPages ||
          announcementsLoading
        }
        onClick={() =>
          fetchAnnouncements(
            announcementPage + 1,
          )
        }
        className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
</div>
  </div>
)}

      {showProjectsModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedCustomer.customerName}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedCustomer.customerCode} |{' '}
                  {selectedCustomer.mobile || '-'} | K No:{' '}
                  {selectedCustomer.electricityKNumber || '-'}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowProjectsModal(false);
                  setSelectedCustomer(null);
                  setSelectedCustomerProjects([]);
                }}
                className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
              <p className="text-sm opacity-90">Linked Projects</p>
              <p className="mt-2 text-4xl font-bold">
                {selectedCustomerProjects.length}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {selectedCustomerProjects.length === 0 ? (
                <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                  No projects linked with this customer yet.
                </p>
              ) : (
                selectedCustomerProjects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-2xl border bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-gray-800">
                          Project #{project.id} - {project.customerName || '-'}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Status: {project.status || '-'} | Branch:{' '}
                          {project.branchName || '-'}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Owner: {project.projectOwnerName || '-'}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          K Number: {project.electricityKNumber || '-'}
                        </p>
                      </div>

                      <a
                        href={`/project/${project.id}`}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Open Project
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {passwordModalCustomer && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
      <h2 className="text-xl font-bold text-gray-900">
        Reset Customer Portal Password
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Customer: {passwordModalCustomer.customerName || '-'}
      </p>

      <div className="mt-5 space-y-3">
        <input
          type={showPortalPassword ? 'text' : 'password'}
          placeholder="New Password"
          value={portalPasswordForm.newPassword}
          onChange={(e) =>
            setPortalPasswordForm({
              ...portalPasswordForm,
              newPassword: e.target.value,
            })
          }
          className="w-full rounded-xl border p-3"
        />

        <input
          type={showPortalPassword ? 'text' : 'password'}
          placeholder="Confirm Password"
          value={portalPasswordForm.confirmPassword}
          onChange={(e) =>
            setPortalPasswordForm({
              ...portalPasswordForm,
              confirmPassword: e.target.value,
            })
          }
          className="w-full rounded-xl border p-3"
        />

        <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
          <input
            type="checkbox"
            checked={showPortalPassword}
            onChange={(e) => setShowPortalPassword(e.target.checked)}
          />
          Show Password
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={resetPortalPassword}
          disabled={portalLoadingId === passwordModalCustomer.id}
          className="rounded-xl bg-purple-600 px-5 py-3 font-bold text-white disabled:opacity-60"
        >
          {portalLoadingId === passwordModalCustomer.id
            ? 'Saving...'
            : 'Save Password'}
        </button>

        <button
          onClick={() => {
            setPasswordModalCustomer(null);
            setPortalPasswordForm({
              newPassword: '',
              confirmPassword: '',
            });
            setShowPortalPassword(false);
          }}
          className="rounded-xl bg-gray-200 px-5 py-3 font-bold text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
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
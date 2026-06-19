'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const emptyForm = {
  id: '',
  accountName: '',
  bankName: '',
  accountNumber: '',
  ifsc: '',
  upiId: '',
  qrCodeUrl: '',
  isActive: true,
};

const emptyCompanyForm = {
  companyName: '',
  email: '',
  phone1: '',
  phone2: '',
  gstin: '',
  website: '',
  logoUrl: '',
};

export default function PortalSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankDetails, setBankDetails] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [companyForm, setCompanyForm] = useState<any>(emptyCompanyForm);
const [companySaving, setCompanySaving] = useState(false);

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  useEffect(() => {
    loadBankDetails();
loadCompanySetting();
  }, []);

  const loadBankDetails = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE_URL}/dealer/company-bank-details?showInactive=true`,
        {
          headers: headers(),
        },
      );

      setBankDetails(res.data || []);
    } catch (error) {
      console.error(error);
      alert('Failed to load bank details');
    } finally {
      setLoading(false);
    }
  };

  const saveBankDetail = async () => {
    try {
      setSaving(true);

      await axios.post(
        `${API_BASE_URL}/dealer/company-bank-detail`,
        form,
        {
          headers: headers(),
        },
      );

      setForm(emptyForm);

      await loadBankDetails();

      alert('Bank detail saved');
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.message ||
          'Failed to save bank detail',
      );
    } finally {
      setSaving(false);
    }
  };

  const activateBankDetail = async (id: number) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/dealer/company-bank-detail/${id}/activate`,
        {},
        {
          headers: headers(),
        },
      );

      await loadBankDetails();
    } catch (error) {
      console.error(error);
      alert('Failed to activate');
    }
  };

  const deactivateBankDetail = async (id: number) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/dealer/company-bank-detail/${id}/deactivate`,
        {},
        {
          headers: headers(),
        },
      );

      await loadBankDetails();
    } catch (error) {
      console.error(error);
      alert('Failed to deactivate');
    }
  };

  const loadCompanySetting = async () => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/dealer/portal-company-setting`,
      { headers: headers() },
    );

    setCompanyForm({
      companyName: res.data?.companyName || '',
      email: res.data?.email || '',
      phone1: res.data?.phone1 || '',
      phone2: res.data?.phone2 || '',
      gstin: res.data?.gstin || '',
      website: res.data?.website || '',
      logoUrl: res.data?.logoUrl || '',
    });
  } catch (error) {
    console.error(error);
  }
};

const saveCompanySetting = async () => {
  try {
    setCompanySaving(true);

    await axios.post(
      `${API_BASE_URL}/dealer/portal-company-setting`,
      companyForm,
      { headers: headers() },
    );

    alert('Company portal information saved');
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to save company information');
  } finally {
    setCompanySaving(false);
  }
};

  const startEdit = (item: any) => {
    setForm({
      id: item.id,
      accountName: item.accountName || '',
      bankName: item.bankName || '',
      accountNumber: item.accountNumber || '',
      ifsc: item.ifsc || '',
      upiId: item.upiId || '',
      qrCodeUrl: item.qrCodeUrl || '',
      isActive: item.isActive !== false,
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-2xl bg-white p-6 shadow">
          <a
            href="/settings"
            className="text-sm font-semibold text-blue-600"
          >
            ← Back to Settings
          </a>

          <h1 className="mt-2 text-2xl font-bold text-gray-800">
            Portal Settings
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage dealer and customer portal settings.
          </p>
        </header>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow">
  <h2 className="text-lg font-bold text-gray-800">
    Company Portal Information
  </h2>

  <div className="mt-4 grid gap-3 md:grid-cols-2">
    {[
      ['Company Name', 'companyName'],
      ['Support Email', 'email'],
      ['Primary Phone', 'phone1'],
      ['Secondary Phone', 'phone2'],
      ['GSTIN', 'gstin'],
      ['Website', 'website'],
      ['Logo URL', 'logoUrl'],
    ].map(([label, key]) => (
      <input
        key={key}
        placeholder={label}
        value={companyForm[key] || ''}
        onChange={(e) =>
          setCompanyForm({
            ...companyForm,
            [key]: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />
    ))}
  </div>

  <button
    onClick={saveCompanySetting}
    disabled={companySaving}
    className="mt-4 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white disabled:opacity-60"
  >
    {companySaving ? 'Saving...' : 'Save Company Information'}
  </button>
</section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-lg font-bold text-gray-800">
              Dealer Bank Details
            </h2>

            <div className="mt-4 space-y-3">
              <input
                placeholder="Account Name"
                value={form.accountName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    accountName: e.target.value,
                  })
                }
                className="w-full rounded-xl border p-3"
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
                className="w-full rounded-xl border p-3"
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
                className="w-full rounded-xl border p-3"
              />

              <input
                placeholder="IFSC"
                value={form.ifsc}
                onChange={(e) =>
                  setForm({
                    ...form,
                    ifsc: e.target.value,
                  })
                }
                className="w-full rounded-xl border p-3"
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
                className="w-full rounded-xl border p-3"
              />

              <input
                placeholder="QR Image URL"
                value={form.qrCodeUrl}
                onChange={(e) =>
                  setForm({
                    ...form,
                    qrCodeUrl: e.target.value,
                  })
                }
                className="w-full rounded-xl border p-3"
              />

              <button
                onClick={saveBankDetail}
                disabled={saving}
                className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white"
              >
                {saving ? 'Saving...' : 'Save Bank Detail'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-lg font-bold text-gray-800">
              Existing Bank Details
            </h2>

            {loading ? (
              <p className="mt-4 text-sm text-gray-500">
                Loading...
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {bankDetails.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold">
                        {item.accountName}
                      </p>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          item.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.isActive
                          ? 'ACTIVE'
                          : 'INACTIVE'}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {item.bankName}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Edit
                      </button>

                      {item.isActive ? (
                        <button
                          onClick={() =>
                            deactivateBankDetail(item.id)
                          }
                          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            activateBankDetail(item.id)
                          }
                          className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-bold text-gray-800">
            Future Portal Controls
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              Dealer delivery settings
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              Dealer support settings
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              Customer portal settings
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              Notification settings
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
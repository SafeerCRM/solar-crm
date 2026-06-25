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
  visibleToDealer: true,
  visibleToCustomer: false,
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

const emptyDeliveryForm = {
  officeName: '',
  officeAddress: '',
  warehouseAddress: '',
  warehouseLatitude: '',
  warehouseLongitude: '',
  baseKm: '',
  baseCharge: '',
  perKmCharge: '',
  minimumCharge: '',
  autoDeliveryChargeEnabled: true,
};

const emptyKitForm = {
  id: '',
  kitName: '',
  shortDescription: '',
  displayBrand: '',
  displayCapacity: '',
  sellingPrice: '',
  gstPercent: '',
  gstMode: 'EXCLUDING',
  isAvailable: true,
  items: [
    {
      material: '',
      brandSizeType: '',
      quantity: '',
    },
  ],
};

const emptyPolicyForm = {
  id: '',
  portalType: 'CUSTOMER',
  title: '',
  language: 'HINDI',
  content: '',
  pdfUrl: '',
  visibleToCustomer: true,
  isActive: true,
  sortOrder: '0',
};

export default function PortalSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankDetails, setBankDetails] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [companyForm, setCompanyForm] = useState<any>(emptyCompanyForm);
const [companySaving, setCompanySaving] = useState(false);
const [deliveryForm, setDeliveryForm] = useState<any>(emptyDeliveryForm);
const [deliverySaving, setDeliverySaving] = useState(false);

const [kits, setKits] = useState<any[]>([]);
const [kitForm, setKitForm] = useState<any>(emptyKitForm);
const [kitSaving, setKitSaving] = useState(false);
const [showHiddenKits, setShowHiddenKits] = useState(false);
const [expandedKitId, setExpandedKitId] = useState<number | null>(null);

const [policies, setPolicies] = useState<any[]>([]);
const [policyForm, setPolicyForm] = useState<any>(emptyPolicyForm);
const [policySaving, setPolicySaving] = useState(false);
const [showHiddenPolicies, setShowHiddenPolicies] = useState(false);

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  useEffect(() => {
    loadBankDetails();
loadCompanySetting();
loadDeliverySetting();
loadKits();
loadPolicies();
  }, []);

  useEffect(() => {
  loadKits();
}, [showHiddenKits]);

useEffect(() => {
  loadPolicies();
}, [showHiddenPolicies]);

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

const loadDeliverySetting = async () => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/dealer/delivery-setting`,
      { headers: headers() },
    );

    setDeliveryForm({
      officeName: res.data?.officeName || '',
      officeAddress: res.data?.officeAddress || '',
      warehouseAddress: res.data?.warehouseAddress || '',
warehouseLatitude: String(res.data?.warehouseLatitude || ''),
warehouseLongitude: String(res.data?.warehouseLongitude || ''),
autoDeliveryChargeEnabled:
  res.data?.autoDeliveryChargeEnabled !== false,
      baseKm: String(res.data?.baseKm || ''),
      baseCharge: String(res.data?.baseCharge || ''),
      perKmCharge: String(res.data?.perKmCharge || ''),
      minimumCharge: String(res.data?.minimumCharge || ''),
    });
  } catch (error) {
    console.error(error);
  }
};

const saveDeliverySetting = async () => {
  try {
    setDeliverySaving(true);

    await axios.post(
      `${API_BASE_URL}/dealer/delivery-setting`,
      deliveryForm,
      { headers: headers() },
    );

    alert('Delivery settings saved');
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to save delivery settings');
  } finally {
    setDeliverySaving(false);
  }
};

const loadKits = async () => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/dealer/kits`,
      {
        params: {
          showHidden: showHiddenKits,
        },
        headers: headers(),
      },
    );

    setKits(Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.error(error);
    alert('Failed to load dealer kits');
  }
};

const updateKitItem = (index: number, key: string, value: string) => {
  const rows = [...kitForm.items];
  rows[index] = {
    ...rows[index],
    [key]: value,
  };

  setKitForm({
    ...kitForm,
    items: rows,
  });
};

const addKitItem = () => {
  setKitForm({
    ...kitForm,
    items: [
      ...kitForm.items,
      {
        material: '',
        brandSizeType: '',
        quantity: '',
      },
    ],
  });
};

const removeKitItem = (index: number) => {
  const rows = kitForm.items.filter((_: any, rowIndex: number) => rowIndex !== index);

  setKitForm({
    ...kitForm,
    items: rows.length
      ? rows
      : [
          {
            material: '',
            brandSizeType: '',
            quantity: '',
          },
        ],
  });
};

const resetKitForm = () => {
  setKitForm(emptyKitForm);
};

const saveKit = async () => {
  if (!String(kitForm.kitName || '').trim()) {
    alert('Kit name is required');
    return;
  }

  try {
    setKitSaving(true);

    await axios.post(
      `${API_BASE_URL}/dealer/kits`,
      kitForm,
      {
        headers: headers(),
      },
    );

    alert('Kit saved successfully');
    resetKitForm();
    await loadKits();
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to save kit');
  } finally {
    setKitSaving(false);
  }
};

const startEditKit = (kit: any) => {
  setKitForm({
    id: kit.id || '',
    kitName: kit.kitName || '',
    shortDescription: kit.shortDescription || '',
    displayBrand: kit.displayBrand || '',
    displayCapacity: kit.displayCapacity || '',
    sellingPrice: String(kit.sellingPrice || ''),
    gstPercent: String(kit.gstPercent || ''),
    gstMode: kit.gstMode || 'EXCLUDING',
    isAvailable: kit.isAvailable !== false,
    items:
      Array.isArray(kit.items) && kit.items.length
        ? kit.items.map((item: any) => ({
            material: item.material || '',
            brandSizeType: item.brandSizeType || '',
            quantity: item.quantity || '',
          }))
        : [
            {
              material: '',
              brandSizeType: '',
              quantity: '',
            },
          ],
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const hideKit = async (kit: any) => {
  const reason = window.prompt('Reason for hiding kit?', 'Not available');

  if (reason === null) return;

  try {
    await axios.patch(
      `${API_BASE_URL}/dealer/kits/${kit.id}/hide`,
      { reason },
      { headers: headers() },
    );

    await loadKits();
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to hide kit');
  }
};

const restoreKit = async (kit: any) => {
  try {
    await axios.patch(
      `${API_BASE_URL}/dealer/kits/${kit.id}/restore`,
      {},
      { headers: headers() },
    );

    await loadKits();
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to restore kit');
  }
};

const toggleKitAvailability = async (kit: any) => {
  try {
    await axios.patch(
      `${API_BASE_URL}/dealer/kits/${kit.id}/availability`,
      {
        isAvailable: kit.isAvailable === false,
      },
      { headers: headers() },
    );

    await loadKits();
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to update availability');
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
      visibleToDealer: item.visibleToDealer !== false,
visibleToCustomer: item.visibleToCustomer === true,
    });
  };

  const loadPolicies = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/dealer/portal-policies`, {
      params: {
        portalType: 'CUSTOMER',
        showHidden: showHiddenPolicies,
      },
      headers: headers(),
    });

    setPolicies(Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.error(error);
    alert('Failed to load portal documents');
  }
};

const savePolicy = async () => {
  if (!String(policyForm.title || '').trim()) {
    alert('Document title is required');
    return;
  }

  try {
    setPolicySaving(true);

    await axios.post(`${API_BASE_URL}/dealer/portal-policies`, policyForm, {
      headers: headers(),
    });

    alert('Portal document saved');
    setPolicyForm(emptyPolicyForm);
    await loadPolicies();
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to save portal document');
  } finally {
    setPolicySaving(false);
  }
};

const startEditPolicy = (item: any) => {
  setPolicyForm({
    id: item.id || '',
    portalType: item.portalType || 'CUSTOMER',
    title: item.title || '',
    language: item.language || 'HINDI',
    content: item.content || '',
    pdfUrl: item.pdfUrl || '',
    visibleToCustomer: item.visibleToCustomer !== false,
    isActive: item.isActive !== false,
    sortOrder: String(item.sortOrder || 0),
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const hidePolicy = async (item: any) => {
  const reason = window.prompt('Reason for hiding document?', 'Not required');

  if (reason === null) return;

  await axios.patch(
    `${API_BASE_URL}/dealer/portal-policies/${item.id}/hide`,
    { reason },
    { headers: headers() },
  );

  await loadPolicies();
};

const restorePolicy = async (item: any) => {
  await axios.patch(
    `${API_BASE_URL}/dealer/portal-policies/${item.id}/restore`,
    {},
    { headers: headers() },
  );

  await loadPolicies();
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

<section className="mt-6 rounded-2xl bg-white p-6 shadow">
  <h2 className="text-lg font-bold text-gray-800">
    Dealer Delivery Settings
  </h2>

  <p className="mt-1 text-sm text-gray-500">
    Used when dealer selects delivery instead of self collection.
  </p>

  <div className="mt-4 grid gap-3 md:grid-cols-2">
    <input
      placeholder="Office Name"
      value={deliveryForm.officeName}
      onChange={(e) =>
        setDeliveryForm({
          ...deliveryForm,
          officeName: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      placeholder="Office Address"
      value={deliveryForm.officeAddress}
      onChange={(e) =>
        setDeliveryForm({
          ...deliveryForm,
          officeAddress: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <textarea
  placeholder="Warehouse Address"
  value={deliveryForm.warehouseAddress}
  onChange={(e) =>
    setDeliveryForm({
      ...deliveryForm,
      warehouseAddress: e.target.value,
    })
  }
  className="rounded-xl border p-3 md:col-span-2"
/>

<input
  type="number"
  step="any"
  placeholder="Warehouse Latitude"
  value={deliveryForm.warehouseLatitude}
  onChange={(e) =>
    setDeliveryForm({
      ...deliveryForm,
      warehouseLatitude: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>

<input
  type="number"
  step="any"
  placeholder="Warehouse Longitude"
  value={deliveryForm.warehouseLongitude}
  onChange={(e) =>
    setDeliveryForm({
      ...deliveryForm,
      warehouseLongitude: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>

<label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold">
  <input
    type="checkbox"
    checked={!!deliveryForm.autoDeliveryChargeEnabled}
    onChange={(e) =>
      setDeliveryForm({
        ...deliveryForm,
        autoDeliveryChargeEnabled: e.target.checked,
      })
    }
  />
  Enable Auto Delivery Charge from Warehouse GPS
</label>

    <input
      type="number"
      placeholder="Base KM"
      value={deliveryForm.baseKm}
      onChange={(e) =>
        setDeliveryForm({
          ...deliveryForm,
          baseKm: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      type="number"
      placeholder="Base Charge"
      value={deliveryForm.baseCharge}
      onChange={(e) =>
        setDeliveryForm({
          ...deliveryForm,
          baseCharge: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      type="number"
      placeholder="Per KM Charge"
      value={deliveryForm.perKmCharge}
      onChange={(e) =>
        setDeliveryForm({
          ...deliveryForm,
          perKmCharge: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      type="number"
      placeholder="Minimum Charge"
      value={deliveryForm.minimumCharge}
      onChange={(e) =>
        setDeliveryForm({
          ...deliveryForm,
          minimumCharge: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />
  </div>

  <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
    Formula: Delivery Charge = Base Charge + extra KM × Per KM Charge.
    Minimum charge will be applied if calculated charge is lower.
  </div>

  <button
    onClick={saveDeliverySetting}
    disabled={deliverySaving}
    className="mt-4 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white disabled:opacity-60"
  >
    {deliverySaving ? 'Saving...' : 'Save Delivery Settings'}
  </button>
</section>

<section className="mt-6 rounded-2xl bg-white p-6 shadow">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-lg font-bold text-gray-800">
        Dealer Kit Settings
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Create dealer kits with manual specifications. Kits are shown first in dealer stock and order pages.
      </p>
    </div>

    <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={showHiddenKits}
        onChange={(e) => setShowHiddenKits(e.target.checked)}
      />
      View Hidden Kits
    </label>
  </div>

  <div className="mt-5 rounded-2xl border p-4">
    <h3 className="font-bold text-gray-800">
      {kitForm.id ? 'Edit Kit' : 'Create Kit'}
    </h3>

    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <input
        placeholder="Kit Name"
        value={kitForm.kitName}
        onChange={(e) => setKitForm({ ...kitForm, kitName: e.target.value })}
        className="rounded-xl border p-3"
      />

      <input
        placeholder="Short Display Line"
        value={kitForm.shortDescription}
        onChange={(e) =>
          setKitForm({ ...kitForm, shortDescription: e.target.value })
        }
        className="rounded-xl border p-3"
      />

      <input
        placeholder="Display Brand"
        value={kitForm.displayBrand}
        onChange={(e) =>
          setKitForm({ ...kitForm, displayBrand: e.target.value })
        }
        className="rounded-xl border p-3"
      />

      <input
        placeholder="Display Capacity"
        value={kitForm.displayCapacity}
        onChange={(e) =>
          setKitForm({ ...kitForm, displayCapacity: e.target.value })
        }
        className="rounded-xl border p-3"
      />

      <input
        type="number"
        placeholder="Selling Price"
        value={kitForm.sellingPrice}
        onChange={(e) =>
          setKitForm({ ...kitForm, sellingPrice: e.target.value })
        }
        className="rounded-xl border p-3"
      />

      <input
        type="number"
        placeholder="GST %"
        value={kitForm.gstPercent}
        onChange={(e) =>
          setKitForm({ ...kitForm, gstPercent: e.target.value })
        }
        className="rounded-xl border p-3"
      />

<select
  value={kitForm.gstMode}
  onChange={(e) =>
    setKitForm({ ...kitForm, gstMode: e.target.value })
  }
  className="rounded-xl border p-3"
>
  <option value="EXCLUDING">GST Extra / Excluding GST</option>
  <option value="INCLUDING">GST Included in Price</option>
</select>

    </div>

    <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
      <input
        type="checkbox"
        checked={kitForm.isAvailable}
        onChange={(e) =>
          setKitForm({ ...kitForm, isAvailable: e.target.checked })
        }
      />
      Available for Dealer
    </label>

    <div className="mt-5">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-800">Kit Specification Rows</h4>
        <button
          type="button"
          onClick={addKitItem}
          className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white"
        >
          + Add Row
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {kitForm.items.map((item: any, index: number) => (
          <div key={index} className="grid gap-3 rounded-xl bg-gray-50 p-3 md:grid-cols-4">
            <input
              placeholder="Material"
              value={item.material}
              onChange={(e) => updateKitItem(index, 'material', e.target.value)}
              className="rounded-xl border p-3"
            />

            <input
              placeholder="Brand / Size / Type"
              value={item.brandSizeType}
              onChange={(e) =>
                updateKitItem(index, 'brandSizeType', e.target.value)
              }
              className="rounded-xl border p-3"
            />

            <input
              placeholder="Quantity"
              value={item.quantity}
              onChange={(e) => updateKitItem(index, 'quantity', e.target.value)}
              className="rounded-xl border p-3"
            />

            <button
              type="button"
              onClick={() => removeKitItem(index)}
              className="rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>

    <div className="mt-5 flex flex-wrap gap-3">
      <button
        onClick={saveKit}
        disabled={kitSaving}
        className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-60"
      >
        {kitSaving ? 'Saving...' : 'Save Kit'}
      </button>

      {kitForm.id && (
        <button
          onClick={resetKitForm}
          className="rounded-xl bg-gray-200 px-5 py-3 font-bold text-gray-700"
        >
          Cancel Edit
        </button>
      )}
    </div>
  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-2">
    {kits.map((kit) => (
      <div
        key={kit.id}
        className={`rounded-2xl border p-4 ${
          kit.isHidden ? 'bg-gray-100 opacity-70' : 'bg-white'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-gray-800">{kit.kitName}</p>
            <p className="mt-1 text-sm text-gray-500">
              {kit.shortDescription || '-'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {kit.displayBrand || '-'} | {kit.displayCapacity || '-'}
            </p>
            <p className="mt-2 font-bold text-green-700">
              ₹{Number(kit.sellingPrice || 0).toLocaleString('en-IN')} 
{kit.gstMode === 'INCLUDING' ? ' GST Included' : ` + GST ${kit.gstPercent || 0}%`}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              kit.isAvailable
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}
          >
            {kit.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
          </span>
        </div>

        {expandedKitId === kit.id && (
          <div className="mt-4 rounded-xl bg-gray-50 p-3">
            <h4 className="font-bold text-gray-800">Full Specification</h4>

            <div className="mt-3 space-y-2">
              {Array.isArray(kit.items) && kit.items.length ? (
                kit.items.map((item: any) => (
                  <div key={item.id} className="rounded-lg bg-white p-3 text-sm">
                    <p className="font-semibold">{item.material || '-'}</p>
                    <p className="text-gray-500">
                      {item.brandSizeType || '-'} | Qty: {item.quantity || '-'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No specification rows.</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() =>
              setExpandedKitId(expandedKitId === kit.id ? null : kit.id)
            }
            className="rounded-xl bg-gray-800 px-3 py-2 text-sm font-semibold text-white"
          >
            {expandedKitId === kit.id ? 'Hide Full' : 'Show Full'}
          </button>

          <button
            onClick={() => startEditKit(kit)}
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
          >
            Edit
          </button>

          <button
            onClick={() => toggleKitAvailability(kit)}
            className="rounded-xl bg-orange-600 px-3 py-2 text-sm font-semibold text-white"
          >
            {kit.isAvailable ? 'Make Unavailable' : 'Make Available'}
          </button>

          {kit.isHidden ? (
            <button
              onClick={() => restoreKit(kit)}
              className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white"
            >
              Restore
            </button>
          ) : (
            <button
              onClick={() => hideKit(kit)}
              className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white"
            >
              Hide
            </button>
          )}
        </div>
      </div>
    ))}
  </div>
</section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-lg font-bold text-gray-800">
              Company Payment Accounts
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

              <div className="grid gap-3 md:grid-cols-2">
  <label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold">
    <input
      type="checkbox"
      checked={!!form.visibleToDealer}
      onChange={(e) =>
        setForm({
          ...form,
          visibleToDealer: e.target.checked,
        })
      }
    />
    Visible to Dealer Portal
  </label>

  <label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold">
    <input
      type="checkbox"
      checked={!!form.visibleToCustomer}
      onChange={(e) =>
        setForm({
          ...form,
          visibleToCustomer: e.target.checked,
        })
      }
    />
    Visible to Customer Portal
  </label>
</div>

              <button
                onClick={saveBankDetail}
                disabled={saving}
                className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white"
              >
                {saving ? 'Saving...' : form.id ? 'Update Payment Account' : 'Save Payment Account'}
              </button>

              {form.id && (
  <button
    onClick={() => setForm(emptyForm)}
    className="w-full rounded-xl bg-gray-200 py-3 font-bold text-gray-700"
  >
    Cancel Edit
  </button>
)}
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

                    <div className="mt-2 flex flex-wrap gap-2">
  {item.visibleToDealer && (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
      DEALER
    </span>
  )}

  {item.visibleToCustomer && (
    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
      CUSTOMER
    </span>
  )}

  {!item.visibleToDealer && !item.visibleToCustomer && (
    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
      NOT VISIBLE
    </span>
  )}
</div>

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
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-lg font-bold text-gray-800">
        Portal Content Management
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Manage customer-facing documents, policies, warranty terms and portal content.
      </p>
    </div>

    <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={showHiddenPolicies}
        onChange={(e) => setShowHiddenPolicies(e.target.checked)}
      />
      View Hidden Documents
    </label>
  </div>

  <div className="mt-5 rounded-2xl border p-4">
    <h3 className="font-bold text-gray-800">
      {policyForm.id ? 'Edit Portal Document' : 'Add Portal Document'}
    </h3>

    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <input
        placeholder="Document Title"
        value={policyForm.title}
        onChange={(e) =>
          setPolicyForm({
            ...policyForm,
            title: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <select
        value={policyForm.language}
        onChange={(e) =>
          setPolicyForm({
            ...policyForm,
            language: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      >
        <option value="HINDI">Hindi</option>
        <option value="ENGLISH">English</option>
      </select>

      <input
        placeholder="PDF URL (optional)"
        value={policyForm.pdfUrl}
        onChange={(e) =>
          setPolicyForm({
            ...policyForm,
            pdfUrl: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />

      <input
        type="number"
        placeholder="Sort Order"
        value={policyForm.sortOrder}
        onChange={(e) =>
          setPolicyForm({
            ...policyForm,
            sortOrder: e.target.value,
          })
        }
        className="rounded-xl border p-3"
      />
    </div>

    <textarea
      rows={8}
      placeholder="Document / policy content"
      value={policyForm.content}
      onChange={(e) =>
        setPolicyForm({
          ...policyForm,
          content: e.target.value,
        })
      }
      className="mt-3 w-full rounded-xl border p-3"
    />

    <div className="mt-3 grid gap-3 md:grid-cols-2">
      <label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold">
        <input
          type="checkbox"
          checked={!!policyForm.visibleToCustomer}
          onChange={(e) =>
            setPolicyForm({
              ...policyForm,
              visibleToCustomer: e.target.checked,
            })
          }
        />
        Visible to Customer Portal
      </label>

      <label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold">
        <input
          type="checkbox"
          checked={!!policyForm.isActive}
          onChange={(e) =>
            setPolicyForm({
              ...policyForm,
              isActive: e.target.checked,
            })
          }
        />
        Active
      </label>
    </div>

    <div className="mt-4 flex flex-wrap gap-3">
      <button
        onClick={savePolicy}
        disabled={policySaving}
        className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-60"
      >
        {policySaving ? 'Saving...' : policyForm.id ? 'Update Document' : 'Save Document'}
      </button>

      {policyForm.id && (
        <button
          onClick={() => setPolicyForm(emptyPolicyForm)}
          className="rounded-xl bg-gray-200 px-5 py-3 font-bold text-gray-700"
        >
          Cancel Edit
        </button>
      )}
    </div>
  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-2">
    {policies.length === 0 ? (
      <div className="rounded-2xl border border-dashed p-6 text-center text-sm font-semibold text-gray-500 md:col-span-2">
        No portal documents found.
      </div>
    ) : (
      policies.map((item) => (
        <div
          key={item.id}
          className={`rounded-2xl border p-4 ${
            item.isHidden ? 'bg-gray-100 opacity-70' : 'bg-white'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-gray-800">
                {item.title}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {item.language || 'HINDI'} | Sort: {item.sortOrder || 0}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    item.visibleToCustomer
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {item.visibleToCustomer ? 'CUSTOMER VISIBLE' : 'NOT CUSTOMER VISIBLE'}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    item.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>

                {item.isHidden && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                    HIDDEN
                  </span>
                )}
              </div>
            </div>
          </div>

          {item.content && (
            <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm text-gray-600">
              {item.content}
            </p>
          )}

          {item.pdfUrl && (
            <p className="mt-3 break-all rounded-xl bg-blue-50 p-3 text-xs font-semibold text-blue-700">
              PDF: {item.pdfUrl}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => startEditPolicy(item)}
              className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
            >
              Edit
            </button>

            {item.isHidden ? (
              <button
                onClick={() => restorePolicy(item)}
                className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white"
              >
                Restore
              </button>
            ) : (
              <button
                onClick={() => hidePolicy(item)}
                className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white"
              >
                Hide
              </button>
            )}
          </div>
        </div>
      ))
    )}
  </div>
</section>
      </div>
    </main>
  );
}
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

type WebsiteSettings = {
  id?: number;
  isEnabled: boolean;
  defaultElectricityRate: number;
  allowElectricityRateEdit: boolean;
  monthlyGenerationPerKw: number;
  recommendedCoveragePercent: number;
  roofAreaSqftPerKw: number;
  showProjectCost: boolean;
  showMonthlySavings: boolean;
  showAnnualSavings: boolean;
  showPaybackPeriod: boolean;
  showRoofArea: boolean;
  disclaimer: string;
};

type PriceSlab = {
  id: number;
  capacityKw: number;
  projectCost: number;
  isActive: boolean;
  sortOrder: number;
};

const defaultSettings: WebsiteSettings = {
  isEnabled: true,
  defaultElectricityRate: 8,
  allowElectricityRateEdit: true,
  monthlyGenerationPerKw: 120,
  recommendedCoveragePercent: 100,
  roofAreaSqftPerKw: 80,
  showProjectCost: true,
  showMonthlySavings: true,
  showAnnualSavings: true,
  showPaybackPeriod: true,
  showRoofArea: true,
  disclaimer: '',
};

export default function WebsiteCalculatorSettingsPage() {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [settings, setSettings] =
    useState<WebsiteSettings>(defaultSettings);

  const [slabs, setSlabs] = useState<PriceSlab[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingSlab, setSavingSlab] = useState(false);

  const [capacityKw, setCapacityKw] = useState('');
  const [projectCost, setProjectCost] = useState('');
  const [sortOrder, setSortOrder] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);

      const [settingsRes, slabsRes] = await Promise.all([
        axios.get(
          `${backendUrl}/calculator/website-settings`,
          {
            headers: getAuthHeaders(),
          },
        ),

        axios.get(
          `${backendUrl}/calculator/website-price-slabs`,
          {
            headers: getAuthHeaders(),
          },
        ),
      ]);

      setSettings({
        ...defaultSettings,
        ...settingsRes.data,
      });

      setSlabs(slabsRes.data || []);
    } catch (error) {
      console.error(error);
      alert('Failed to load website calculator settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateNumber = (
    key: keyof WebsiteSettings,
    value: string,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: Number(value),
    }));
  };

  const updateBoolean = (
    key: keyof WebsiteSettings,
    value: boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveSettings = async () => {
    try {
      setSavingSettings(true);

      const res = await axios.patch(
        `${backendUrl}/calculator/website-settings`,
        settings,
        {
          headers: getAuthHeaders(),
        },
      );

      setSettings({
        ...defaultSettings,
        ...res.data,
      });

      alert('Website calculator settings saved successfully');
    } catch (error) {
      console.error(error);
      alert('Failed to save website calculator settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const createSlab = async () => {
    const capacity = Number(capacityKw);
    const cost = Number(projectCost);

    if (capacity <= 0) {
      alert('Enter a valid solar capacity');
      return;
    }

    if (cost <= 0) {
      alert('Enter a valid project cost');
      return;
    }

    try {
      setSavingSlab(true);

      await axios.post(
        `${backendUrl}/calculator/website-price-slabs`,
        {
          capacityKw: capacity,
          projectCost: cost,
          sortOrder: Number(sortOrder || 0),
          isActive: true,
        },
        {
          headers: getAuthHeaders(),
        },
      );

      setCapacityKw('');
      setProjectCost('');
      setSortOrder('');

      await fetchData();
    } catch (error) {
      console.error(error);
      alert('Failed to add price slab');
    } finally {
      setSavingSlab(false);
    }
  };

  const updateSlab = async (
    id: number,
    changes: Partial<PriceSlab>,
  ) => {
    try {
      await axios.patch(
        `${backendUrl}/calculator/website-price-slabs/${id}`,
        changes,
        {
          headers: getAuthHeaders(),
        },
      );

      setSlabs((prev) =>
        prev.map((slab) =>
          slab.id === id
            ? {
                ...slab,
                ...changes,
              }
            : slab,
        ),
      );
    } catch (error) {
      console.error(error);
      alert('Failed to update price slab');
      await fetchData();
    }
  };

  const deleteSlab = async (id: number) => {
    const confirmed = window.confirm(
      'Delete this website calculator price slab?',
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `${backendUrl}/calculator/website-price-slabs/${id}`,
        {
          headers: getAuthHeaders(),
        },
      );

      setSlabs((prev) =>
        prev.filter((slab) => slab.id !== id),
      );
    } catch (error) {
      console.error(error);
      alert('Failed to delete price slab');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        Loading website calculator settings...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Website Solar Calculator
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Control the estimates displayed on the public
            Aditya Solars website.
          </p>
        </div>

        <Link
          href="/calculator/settings"
          className="rounded-lg border bg-white px-4 py-2 text-sm font-medium"
        >
          ← Calculator Settings
        </Link>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-semibold">
          Public Calculator
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Enable or disable the calculator and control the
          assumptions used for public estimates.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Toggle
            label="Website Calculator Enabled"
            checked={settings.isEnabled}
            onChange={(value) =>
              updateBoolean('isEnabled', value)
            }
          />

          <Toggle
            label="Allow Customer to Edit Electricity Rate"
            checked={settings.allowElectricityRateEdit}
            onChange={(value) =>
              updateBoolean(
                'allowElectricityRateEdit',
                value,
              )
            }
          />

          <NumberInput
            label="Default Electricity Rate (₹ / Unit)"
            value={settings.defaultElectricityRate}
            step="0.01"
            onChange={(value) =>
              updateNumber(
                'defaultElectricityRate',
                value,
              )
            }
          />

          <NumberInput
            label="Monthly Generation per 1 kW (Units)"
            value={settings.monthlyGenerationPerKw}
            step="0.01"
            onChange={(value) =>
              updateNumber(
                'monthlyGenerationPerKw',
                value,
              )
            }
          />

          <NumberInput
            label="Recommended Bill Coverage (%)"
            value={settings.recommendedCoveragePercent}
            step="0.01"
            onChange={(value) =>
              updateNumber(
                'recommendedCoveragePercent',
                value,
              )
            }
          />

          <NumberInput
            label="Roof Area per 1 kW (Sq.ft.)"
            value={settings.roofAreaSqftPerKw}
            step="0.01"
            onChange={(value) =>
              updateNumber(
                'roofAreaSqftPerKw',
                value,
              )
            }
          />
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-semibold">
          Website Result Visibility
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Choose which calculated values visitors can see.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Toggle
            label="Show Project Cost"
            checked={settings.showProjectCost}
            onChange={(value) =>
              updateBoolean('showProjectCost', value)
            }
          />

          <Toggle
            label="Show Monthly Savings"
            checked={settings.showMonthlySavings}
            onChange={(value) =>
              updateBoolean('showMonthlySavings', value)
            }
          />

          <Toggle
            label="Show Annual Savings"
            checked={settings.showAnnualSavings}
            onChange={(value) =>
              updateBoolean('showAnnualSavings', value)
            }
          />

          <Toggle
            label="Show Payback Period"
            checked={settings.showPaybackPeriod}
            onChange={(value) =>
              updateBoolean('showPaybackPeriod', value)
            }
          />

          <Toggle
            label="Show Roof Area"
            checked={settings.showRoofArea}
            onChange={(value) =>
              updateBoolean('showRoofArea', value)
            }
          />
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium text-gray-700">
            Public Disclaimer
          </label>

          <textarea
            rows={4}
            value={settings.disclaimer || ''}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                disclaimer: e.target.value,
              }))
            }
            className="mt-2 w-full rounded-xl border p-3"
          />
        </div>

        <button
          type="button"
          onClick={saveSettings}
          disabled={savingSettings}
          className="mt-5 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white disabled:opacity-60"
        >
          {savingSettings
            ? 'Saving...'
            : 'Save Website Settings'}
        </button>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow">
        <div>
          <h2 className="text-lg font-semibold">
            Capacity-wise Website Project Prices
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            These are public estimate prices only. They do not
            change the internal CRM quotation calculator.
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <NumberInput
            label="Capacity (kW)"
            value={capacityKw}
            step="0.01"
            onChange={setCapacityKw}
          />

          <NumberInput
            label="Project Cost (₹)"
            value={projectCost}
            step="1"
            onChange={setProjectCost}
          />

          <NumberInput
            label="Display Order"
            value={sortOrder}
            step="1"
            onChange={setSortOrder}
          />

          <div className="flex items-end">
            <button
              type="button"
              onClick={createSlab}
              disabled={savingSlab}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-medium text-white disabled:opacity-60"
            >
              {savingSlab ? 'Adding...' : 'Add Price'}
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-3">Capacity</th>
                <th className="p-3">Project Cost</th>
                <th className="p-3">Order</th>
                <th className="p-3">Active</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {slabs.map((slab) => (
                <tr
                  key={slab.id}
                  className="border-b"
                >
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.01"
                      value={slab.capacityKw}
                      onChange={(e) =>
                        setSlabs((prev) =>
                          prev.map((item) =>
                            item.id === slab.id
                              ? {
                                  ...item,
                                  capacityKw: Number(
                                    e.target.value,
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                      onBlur={() =>
                        updateSlab(slab.id, {
                          capacityKw:
                            Number(slab.capacityKw),
                        })
                      }
                      className="w-28 rounded-lg border p-2"
                    />
                    <span className="ml-2">kW</span>
                  </td>

                  <td className="p-3">
                    <input
                      type="number"
                      value={slab.projectCost}
                      onChange={(e) =>
                        setSlabs((prev) =>
                          prev.map((item) =>
                            item.id === slab.id
                              ? {
                                  ...item,
                                  projectCost: Number(
                                    e.target.value,
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                      onBlur={() =>
                        updateSlab(slab.id, {
                          projectCost:
                            Number(slab.projectCost),
                        })
                      }
                      className="w-40 rounded-lg border p-2"
                    />
                  </td>

                  <td className="p-3">
                    <input
                      type="number"
                      value={slab.sortOrder}
                      onChange={(e) =>
                        setSlabs((prev) =>
                          prev.map((item) =>
                            item.id === slab.id
                              ? {
                                  ...item,
                                  sortOrder: Number(
                                    e.target.value,
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                      onBlur={() =>
                        updateSlab(slab.id, {
                          sortOrder:
                            Number(slab.sortOrder),
                        })
                      }
                      className="w-24 rounded-lg border p-2"
                    />
                  </td>

                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={slab.isActive}
                      onChange={(e) =>
                        updateSlab(slab.id, {
                          isActive: e.target.checked,
                        })
                      }
                      className="h-5 w-5"
                    />
                  </td>

                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() =>
                        deleteSlab(slab.id)
                      }
                      className="rounded-lg bg-red-50 px-3 py-2 font-medium text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {slabs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-gray-500"
                  >
                    No website project prices added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  step = '1',
}: {
  label: string;
  value: number | string;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border p-3"
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border bg-gray-50 p-4">
      <span className="text-sm font-medium text-gray-700">
        {label}
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5"
      />
    </label>
  );
}
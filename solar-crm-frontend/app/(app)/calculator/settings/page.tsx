'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

export default function CalculatorSettingsPage() {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [settings, setSettings] = useState<any>({});
  const [panelOptions, setPanelOptions] = useState<any[]>([]);
  const [ongridOptions, setOngridOptions] = useState<any[]>([]);
  const [structureOptions, setStructureOptions] = useState<any[]>([]);
  const [electricalOptions, setElectricalOptions] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${backendUrl}/calculator/settings`, {
        headers: getAuthHeaders(),
      });

      setSettings(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load calculator settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchPanelOptions = async () => {
    try {
      const res = await axios.get(`${backendUrl}/calculator/panel-options`, {
        params: {
          category: 'DCR',
          type: 'P Type',
        },
        headers: getAuthHeaders(),
      });

      setPanelOptions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOngridOptions = async () => {
    try {
      const res = await axios.get(`${backendUrl}/calculator/ongrid-options`, {
        params: {
          phase: '1 Phase',
        },
        headers: getAuthHeaders(),
      });

      setOngridOptions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStructureOptions = async () => {
    try {
      const res = await axios.get(`${backendUrl}/calculator/structure-options`, {
        headers: getAuthHeaders(),
      });

      setStructureOptions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchElectricalOptions = async () => {
    try {
      const res = await axios.get(`${backendUrl}/calculator/electrical-options`, {
        headers: getAuthHeaders(),
      });

      setElectricalOptions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchPanelOptions();
    fetchOngridOptions();
    fetchStructureOptions();
    fetchElectricalOptions();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: Number(value),
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await axios.patch(`${backendUrl}/calculator/settings`, settings, {
        headers: getAuthHeaders(),
      });

      alert('Settings saved successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Calculator Settings</h1>

      <Section title="Main Rate Settings">
        <Input label="Rate Per Watt" value={settings.ratePerWatt} onChange={(v) => handleChange('ratePerWatt', v)} />
        <Input label="GST Multiplier" value={settings.gstMultiplier} onChange={(v) => handleChange('gstMultiplier', v)} />
        <Input label="Ongrid Rate" value={settings.ongridRate} onChange={(v) => handleChange('ongridRate', v)} />
        <Input label="Structure Rate" value={settings.structureRate} onChange={(v) => handleChange('structureRate', v)} />
        <Input label="Electrical Rate" value={settings.electricalRate} onChange={(v) => handleChange('electricalRate', v)} />
        <Input label="Transport Rate Per KM" value={settings.transportRatePerKm} onChange={(v) => handleChange('transportRatePerKm', v)} />
        <Input label="Structure Sqft per kW" value={settings.structureSqftPerKw} onChange={(v) => handleChange('structureSqftPerKw', v)} />
      </Section>

      <Section title="Advanced Rates">
        <Input label="Hybrid Rate" value={settings.hybridRate} onChange={(v) => handleChange('hybridRate', v)} />
        <Input label="Battery Rate" value={settings.batteryRate} onChange={(v) => handleChange('batteryRate', v)} />
        <Input label="Celronic Rate" value={settings.celronicRate} onChange={(v) => handleChange('celronicRate', v)} />
        <Input label="Tata Rate" value={settings.tataRate} onChange={(v) => handleChange('tataRate', v)} />
      </Section>

      <Section title="Fixed Costs">
        <Input label="Margin Amount" value={settings.marginAmount} onChange={(v) => handleChange('marginAmount', v)} />
        <Input label="Electricity Department Cost" value={settings.electricityDepartmentCost} onChange={(v) => handleChange('electricityDepartmentCost', v)} />
      </Section>

      <Section title="Other Charges">
        <Input label="Net Metering" value={settings.netMeteringCost} onChange={(v) => handleChange('netMeteringCost', v)} />
        <Input label="Installation Charges" value={settings.installationCharges} onChange={(v) => handleChange('installationCharges', v)} />
        <Input label="Labour Charges" value={settings.labourCharges} onChange={(v) => handleChange('labourCharges', v)} />
        <Input label="Government Fees" value={settings.governmentFees} onChange={(v) => handleChange('governmentFees', v)} />
      </Section>

      <Section title="Electrical / BOS">
        <Input label="Wiring Cost" value={settings.wiringCost} onChange={(v) => handleChange('wiringCost', v)} />
        <Input label="MCB Cost" value={settings.mcbCost} onChange={(v) => handleChange('mcbCost', v)} />
        <Input label="DB Box Cost" value={settings.dbBoxCost} onChange={(v) => handleChange('dbBoxCost', v)} />
        <Input label="Cables Cost" value={settings.cablesCost} onChange={(v) => handleChange('cablesCost', v)} />
        <Input label="Earthing Cost" value={settings.earthingCost} onChange={(v) => handleChange('earthingCost', v)} />
        <Input label="Lightning Arrestor Cost" value={settings.lightningArrestorCost} onChange={(v) => handleChange('lightningArrestorCost', v)} />
      </Section>


      <Section title="Dynamic Calculator Option Management">
        <ManageCard
          title="Panel Options"
          count={panelOptions.length}
          description="Manage DCR / NON-DCR, P Type / N Type, brand, watt and rate."
          href="/calculator/settings/panels"
        />

        <ManageCard
          title="Ongrid Converter Options"
          count={ongridOptions.length}
          description="Manage phase, brand, inverter capacity and rate."
          href="/calculator/settings/ongrid"
        />

        <ManageCard
          title="Structure Options"
          count={structureOptions.length}
          description="Manage Rooftop / Tin Shade, capacity and rate per kW."
          href="/calculator/settings/structures"
        />

        <ManageCard
          title="Electrical Options"
          count={electricalOptions.length}
          description="Manage electrical capacity and rate."
          href="/calculator/settings/electrical"
        />
      </Section>

      <ManageCard
  title="Margin Options"
  count={0} // we will fix this later
  description="Manage capacity-based margin slabs."
  href="/calculator/settings/margin"
/>

<ManageCard
  title="Hybrid Converter Options"
  count={0}
  description="Manage hybrid inverter options (phase, brand, capacity, rate)."
  href="/calculator/settings/hybrid"
/>

<ManageCard
  title="Battery Options"
  count={0}
  description="Manage battery type, brand, capacity and rate."
  href="/calculator/settings/battery"
/>

<ManageCard
  title="Kit Options"
  count={0}
  description="Manage kit brands, capacity and rate."
  href="/calculator/settings/kit"
/>

<ManageCard
  title="Expected Profit"
  count={0}
  description="Manage profit slabs based on capacity."
  href="/calculator/settings/expected-profit"
/>

<ManageCard
  title="Discount Rules"
  count={0}
  description="Manage maximum discount limits by role and project capacity."
  href="/calculator/settings/discount"
/>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

function ManageCard({
  title,
  count,
  description,
  href,
}: {
  title: string;
  count: number;
  description: string;
  href: string;
}) {
  return (
    <div className="border rounded-xl p-4 bg-gray-50 flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-base">{title}</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {count} saved
          </span>
        </div>

        <p className="text-sm text-gray-600 mt-2">{description}</p>
      </div>

      <Link
        href={href}
        className="inline-flex justify-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
      >
        Manage
      </Link>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>

      <input
        type="number"
        value={value || 0}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border p-2 rounded-lg mt-1"
      />
    </div>
  );
}
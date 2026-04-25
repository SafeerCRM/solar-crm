'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

export default function CalculatorSettingsPage() {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${backendUrl}/calculator/settings`,
        { headers: getAuthHeaders() }
      );
      setSettings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // handle change
  const handleChange = (key: string, value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: Number(value),
    }));
  };

  // save
  const handleSave = async () => {
    try {
      setSaving(true);

      await axios.patch(
        `${backendUrl}/calculator/settings`,
        settings,
        { headers: getAuthHeaders() }
      );

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

      {/* PANEL */}
      <Section title="Panel">
        <Input label="Rate Per Watt" value={settings.ratePerWatt} onChange={(v) => handleChange('ratePerWatt', v)} />
        <Input label="GST Multiplier" value={settings.gstMultiplier} onChange={(v) => handleChange('gstMultiplier', v)} />
      </Section>

      {/* CORE */}
      <Section title="Core Rates">
        <Input label="Ongrid Rate" value={settings.ongridRate} onChange={(v) => handleChange('ongridRate', v)} />
        <Input label="Structure Rate" value={settings.structureRate} onChange={(v) => handleChange('structureRate', v)} />
        <Input label="Electrical Rate" value={settings.electricalRate} onChange={(v) => handleChange('electricalRate', v)} />
        <Input label="Transport Rate Per KM" value={settings.transportRatePerKm} onChange={(v) => handleChange('transportRatePerKm', v)} />
      </Section>

      {/* ADVANCED */}
      <Section title="Advanced">
        <Input label="Hybrid Rate" value={settings.hybridRate} onChange={(v) => handleChange('hybridRate', v)} />
        <Input label="Battery Rate" value={settings.batteryRate} onChange={(v) => handleChange('batteryRate', v)} />
        <Input label="Celronic Rate" value={settings.celronicRate} onChange={(v) => handleChange('celronicRate', v)} />
        <Input label="Tata Rate" value={settings.tataRate} onChange={(v) => handleChange('tataRate', v)} />
      </Section>

      {/* FIXED */}
      <Section title="Fixed Costs">
        <Input label="Margin Amount" value={settings.marginAmount} onChange={(v) => handleChange('marginAmount', v)} />
        <Input label="Electricity Department Cost" value={settings.electricityDepartmentCost} onChange={(v) => handleChange('electricityDepartmentCost', v)} />
      </Section>

      {/* OTHER */}
      <Section title="Other Charges">
        <Input label="Net Metering" value={settings.netMeteringCost} onChange={(v) => handleChange('netMeteringCost', v)} />
        <Input label="Installation Charges" value={settings.installationCharges} onChange={(v) => handleChange('installationCharges', v)} />
        <Input label="Labour Charges" value={settings.labourCharges} onChange={(v) => handleChange('labourCharges', v)} />
        <Input label="Government Fees" value={settings.governmentFees} onChange={(v) => handleChange('governmentFees', v)} />
      </Section>

      {/* BOS */}
      <Section title="Electrical / BOS">
        <Input label="Wiring Cost" value={settings.wiringCost} onChange={(v) => handleChange('wiringCost', v)} />
        <Input label="MCB Cost" value={settings.mcbCost} onChange={(v) => handleChange('mcbCost', v)} />
        <Input label="DB Box Cost" value={settings.dbBoxCost} onChange={(v) => handleChange('dbBoxCost', v)} />
        <Input label="Cables Cost" value={settings.cablesCost} onChange={(v) => handleChange('cablesCost', v)} />
        <Input label="Earthing Cost" value={settings.earthingCost} onChange={(v) => handleChange('earthingCost', v)} />
        <Input label="Lightning Arrestor Cost" value={settings.lightningArrestorCost} onChange={(v) => handleChange('lightningArrestorCost', v)} />
      </Section>

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

/* UI helpers */

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
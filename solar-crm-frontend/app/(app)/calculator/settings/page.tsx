'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';

export default function CalculatorSettingsPage() {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [settings, setSettings] = useState<any>({});
  const [panelOptions, setPanelOptions] = useState<any[]>([]);
  const [ongridOptions, setOngridOptions] = useState<any[]>([]);
const [ongridForm, setOngridForm] = useState({
  phaseType: '1 Phase',
  brandName: '',
  capacity: '',
  rate: '',
});
const [panelForm, setPanelForm] = useState({
  panelCategory: 'DCR',
  panelType: 'P Type',
  brandName: '',
  capacityWatt: '',
  rate: '',
});
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
  fetchPanelOptions();
  fetchOngridOptions();
}, []);

  // handle change
  const handleChange = (key: string, value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: Number(value),
    }));
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

const createOngridOption = async () => {
  try {
    await axios.post(
      `${backendUrl}/calculator/ongrid-options`,
      {
        phaseType: ongridForm.phaseType,
        brandName: ongridForm.brandName,
        capacity: Number(ongridForm.capacity),
        rate: Number(ongridForm.rate),
      },
      { headers: getAuthHeaders() }
    );

    alert('Ongrid option added');

    setOngridForm({
      phaseType: '1 Phase',
      brandName: '',
      capacity: '',
      rate: '',
    });

    fetchOngridOptions();
  } catch (err) {
    console.error(err);
    alert('Failed to add');
  }
};

const deleteOngridOption = async (id: number) => {
  if (!confirm('Delete this option?')) return;

  try {
    await axios.delete(
      `${backendUrl}/calculator/ongrid-options/${id}`,
      { headers: getAuthHeaders() }
    );

    fetchOngridOptions();
  } catch (err) {
    console.error(err);
    alert('Delete failed');
  }
};

const createPanelOption = async () => {
  try {
    await axios.post(
      `${backendUrl}/calculator/panel-options`,
      {
        panelCategory: panelForm.panelCategory,
        panelType: panelForm.panelType,
        brandName: panelForm.brandName,
        capacityWatt: Number(panelForm.capacityWatt),
        rate: Number(panelForm.rate),
      },
      { headers: getAuthHeaders() }
    );

    alert('Panel option added');

    setPanelForm({
      panelCategory: 'DCR',
      panelType: 'P Type',
      brandName: '',
      capacityWatt: '',
      rate: '',
    });

    fetchPanelOptions();
  } catch (err) {
    console.error(err);
    alert('Failed to add panel option');
  }
};

const deletePanelOption = async (id: number) => {
  if (!confirm('Delete this option?')) return;

  try {
    await axios.delete(
      `${backendUrl}/calculator/panel-options/${id}`,
      { headers: getAuthHeaders() }
    );

    fetchPanelOptions();
  } catch (err) {
    console.error(err);
    alert('Delete failed');
  }
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

<Section title="Panel Options (Dynamic)">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    <select
      value={panelForm.panelCategory}
      onChange={(e) =>
        setPanelForm({ ...panelForm, panelCategory: e.target.value })
      }
      className="border p-2 rounded"
    >
      <option value="DCR">DCR</option>
      <option value="NONDCR">NONDCR</option>
    </select>

    <select
      value={panelForm.panelType}
      onChange={(e) =>
        setPanelForm({ ...panelForm, panelType: e.target.value })
      }
      className="border p-2 rounded"
    >
      <option value="P Type">P Type</option>
      <option value="N Type">N Type</option>
    </select>

    <input
      placeholder="Brand"
      value={panelForm.brandName}
      onChange={(e) =>
        setPanelForm({ ...panelForm, brandName: e.target.value })
      }
      className="border p-2 rounded"
    />

    <input
      type="number"
      placeholder="Capacity (Watt)"
      value={panelForm.capacityWatt}
      onChange={(e) =>
        setPanelForm({ ...panelForm, capacityWatt: e.target.value })
      }
      className="border p-2 rounded"
    />

    <input
      type="number"
      placeholder="Rate per Watt"
      value={panelForm.rate}
      onChange={(e) =>
        setPanelForm({ ...panelForm, rate: e.target.value })
      }
      className="border p-2 rounded"
    />

    <button
      onClick={createPanelOption}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      Add Panel Option
    </button>
  </div>

  <div className="mt-4 space-y-2">
    {panelOptions.map((opt) => (
      <div
        key={opt.id}
        className="flex justify-between items-center border p-2 rounded"
      >
        <span>
          {opt.panelCategory} | {opt.panelType} | {opt.brandName} | {opt.capacityWatt}W | ₹{opt.rate}
        </span>

        <button
          onClick={() => deletePanelOption(opt.id)}
          className="text-red-600"
        >
          Delete
        </button>
      </div>
    ))}
  </div>
</Section>

<Section title="Ongrid Converter Options">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    <select
      value={ongridForm.phaseType}
      onChange={(e) =>
        setOngridForm({ ...ongridForm, phaseType: e.target.value })
      }
      className="border p-2 rounded"
    >
      <option value="1 Phase">1 Phase</option>
      <option value="3 Phase">3 Phase</option>
    </select>

    <input
      placeholder="Brand"
      value={ongridForm.brandName}
      onChange={(e) =>
        setOngridForm({ ...ongridForm, brandName: e.target.value })
      }
      className="border p-2 rounded"
    />

    <input
      type="number"
      placeholder="Capacity (kW)"
      value={ongridForm.capacity}
      onChange={(e) =>
        setOngridForm({ ...ongridForm, capacity: e.target.value })
      }
      className="border p-2 rounded"
    />

    <input
      type="number"
      placeholder="Rate"
      value={ongridForm.rate}
      onChange={(e) =>
        setOngridForm({ ...ongridForm, rate: e.target.value })
      }
      className="border p-2 rounded"
    />

    <button
      onClick={createOngridOption}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      Add Ongrid Option
    </button>
  </div>

  <div className="mt-4 space-y-2">
    {ongridOptions.map((opt) => (
      <div
        key={opt.id}
        className="flex justify-between items-center border p-2 rounded"
      >
        <span>
          {opt.phaseType} | {opt.brandName} | {opt.capacity} kW | ₹{opt.rate}
        </span>

        <button
          onClick={() => deleteOngridOption(opt.id)}
          className="text-red-600"
        >
          Delete
        </button>
      </div>
    ))}
  </div>
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
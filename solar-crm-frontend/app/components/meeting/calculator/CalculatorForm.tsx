'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';
import CalculatorSection from './CalculatorSection';
import { formatCurrency, toNumber } from './calculator-utils';

type CalculatorInitialData = {
  meetingId?: string;
  leadId?: string;
  name?: string;
  phone?: string;
  city?: string;
  electricityBill?: number;
};

type CalculatorValues = {
  meetingId: string;
  leadId: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  electricityBill: number;

  panelCategory: 'DCR' | 'NONDCR';
  panelType: 'P Type' | 'N Type';
  numberOfPanels: number;
  wattPerPanel: number;

  ongridBrand: string;
  ongridWatt: number;
  ongridQuantity: number;

  structureType: 'Rooftop' | 'Tin Shade';
  structureWatt: number;
  structureQuantity: number;

  electricalItemName: string;
  electricalWatt: number;
  electricalQuantity: number;

  marginWatt: number;

  transportationRange: 'UPTO 100KM' | 'UPTO 200KM';
  distanceKm: number;

  hybridType: string;
  hybridPhase: 'Single Phase' | 'Three Phase' | 'High Voltage';
  hybridQuantity: number;

  batteryType: string;
  batteryStrength: string;
  batteryQuantity: number;

  celronicType: string;
  celronicQuantity: number;

  tataPanelQuantity: number;
  tataPanelStrengthWatt: number;
  tataQuantity: number;
};

const inputClassName =
  'w-full rounded-xl border border-gray-300 bg-white p-3 text-sm outline-none focus:border-blue-500';

const labelClassName = 'mb-1 block text-sm font-medium text-gray-700';

export default function CalculatorForm({
  initialData,
}: {
  initialData?: CalculatorInitialData;
}) {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const router = useRouter();

  const [saveMessage, setSaveMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [panelOptions, setPanelOptions] = useState<any[]>([]);
const [selectedPanelOptionId, setSelectedPanelOptionId] = useState<number | null>(null);

const [structureOptions, setStructureOptions] = useState<any[]>([]);
const [selectedStructureOptionId, setSelectedStructureOptionId] = useState<number | null>(null);

const [availableArea, setAvailableArea] = useState(0);
const [requiredArea, setRequiredArea] = useState(0);
const [areaError, setAreaError] = useState('');
const [calculatorSettings, setCalculatorSettings] = useState<any>({});
const [ongridOptions, setOngridOptions] = useState<any[]>([]);
const [selectedOngridOptionId, setSelectedOngridOptionId] = useState<number | null>(null);
const [ongridPhase, setOngridPhase] = useState('1 Phase');

  const [values, setValues] = useState<CalculatorValues>({
    meetingId: initialData?.meetingId || '',
    leadId: initialData?.leadId || '',
    customerName: initialData?.name || '',
    customerPhone: initialData?.phone || '',
    customerCity: initialData?.city || '',
    electricityBill: initialData?.electricityBill || 0,

    panelCategory: 'DCR',
    panelType: 'P Type',
    numberOfPanels: 0,
    wattPerPanel: 0,

    ongridBrand: '',
    ongridWatt: 0,
    ongridQuantity: 0,

    structureType: 'Rooftop',
    structureWatt: 0,
    structureQuantity: 0,

    electricalItemName: '',
    electricalWatt: 0,
    electricalQuantity: 0,

    marginWatt: 0,

    transportationRange: 'UPTO 100KM',
    distanceKm: 0,

    hybridType: '',
    hybridPhase: 'Single Phase',
    hybridQuantity: 0,

    batteryType: '',
    batteryStrength: '',
    batteryQuantity: 0,

    celronicType: '',
    celronicQuantity: 0,

    tataPanelQuantity: 0,
    tataPanelStrengthWatt: 0,
    tataQuantity: 0,
  });

  const setNumberValue = (key: keyof CalculatorValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: toNumber(value),
    }));
  };

  const setTextValue = (key: keyof CalculatorValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const calculateTotalFromBackend = async () => {
    try {
      setCalculating(true);

      const response = await axios.post(
        `${backendUrl}/calculator/calculate`,
        {
          numberOfPanels: values.numberOfPanels,
          wattPerPanel: values.wattPerPanel,
          ongridQuantity: values.ongridQuantity,
          structureQuantity: values.structureQuantity,
          electricalQuantity: values.electricalQuantity,
          distanceKm: values.distanceKm,
          hybridQuantity: values.hybridQuantity,
          batteryQuantity: values.batteryQuantity,
          celronicQuantity: values.celronicQuantity,
          tataQuantity: values.tataQuantity,
        },
        { headers: getAuthHeaders() }
      );

      setTotalCost(Number(response.data?.totalProjectCost || 0));
    } catch (error) {
      console.error(error);
      setTotalCost(0);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
  fetchPanelOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [values.panelCategory, values.panelType]);

useEffect(() => {
  fetchStructureOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [values.structureType]);

useEffect(() => {
  const selectedPanel = panelOptions.find(
    (p) => Number(p.id) === Number(selectedPanelOptionId)
  );

  if (!selectedPanel) {
    setRequiredArea(0);
    return;
  }

  const watt = Number(selectedPanel.capacityWatt || 0);
  const panels = Number(values.numberOfPanels || 0);

  const projectKw = (panels * watt) / 1000;
  const sqftPerKw = Number(calculatorSettings.structureSqftPerKw || 40); // temporary, later from owner settings

  setRequiredArea(projectKw * sqftPerKw);
}, [
  panelOptions,
  selectedPanelOptionId,
  values.numberOfPanels,
  calculatorSettings.structureSqftPerKw,
]);

useEffect(() => {
  if (!requiredArea || !availableArea) {
    setAreaError('');
    return;
  }

  if (Number(availableArea) < Number(requiredArea)) {
    setAreaError(
      `Required area is ${requiredArea.toFixed(
        2
      )} sqft but available is ${availableArea} sqft`
    );
  } else {
    setAreaError('');
  }
}, [availableArea, requiredArea]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateTotalFromBackend();
    }, 400);

    return () => clearTimeout(timer);
  }, [values]);

  useEffect(() => {
  fetchCalculatorSettings();
}, []);

useEffect(() => {
  fetchOngridOptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [ongridPhase]);

  const fetchCalculatorSettings = async () => {
  try {
    const res = await axios.get(`${backendUrl}/calculator/settings`, {
      headers: getAuthHeaders(),
    });

    setCalculatorSettings(res.data || {});
  } catch (err) {
    console.error(err);
  }
};

const fetchOngridOptions = async () => {
  try {
    const res = await axios.get(`${backendUrl}/calculator/ongrid-options`, {
      params: {
        phase: ongridPhase,
      },
      headers: getAuthHeaders(),
    });

    setOngridOptions(res.data || []);
  } catch (err) {
    console.error(err);
  }
};

  const fetchPanelOptions = async () => {
  try {
    const res = await axios.get(`${backendUrl}/calculator/panel-options`, {
      params: {
        category: values.panelCategory,
        type: values.panelType,
      },
      headers: getAuthHeaders(),
    });

    setPanelOptions(res.data || []);
  } catch (err) {
    console.error(err);
  }
};

const fetchStructureOptions = async () => {
  try {
    const res = await axios.get(`${backendUrl}/calculator/structure-options`, {
      params: {
        type: values.structureType,
      },
      headers: getAuthHeaders(),
    });

    setStructureOptions(res.data || []);
  } catch (err) {
    console.error(err);
  }
};

  const handleResetCalculator = () => {
    setValues({
      meetingId: initialData?.meetingId || '',
      leadId: initialData?.leadId || '',
      customerName: initialData?.name || '',
      customerPhone: initialData?.phone || '',
      customerCity: initialData?.city || '',
      electricityBill: initialData?.electricityBill || 0,

      panelCategory: 'DCR',
      panelType: 'P Type',
      numberOfPanels: 0,
      wattPerPanel: 0,

      ongridBrand: '',
      ongridWatt: 0,
      ongridQuantity: 0,

      structureType: 'Rooftop',
      structureWatt: 0,
      structureQuantity: 0,

      electricalItemName: '',
      electricalWatt: 0,
      electricalQuantity: 0,

      marginWatt: 0,

      transportationRange: 'UPTO 100KM',
      distanceKm: 0,

      hybridType: '',
      hybridPhase: 'Single Phase',
      hybridQuantity: 0,

      batteryType: '',
      batteryStrength: '',
      batteryQuantity: 0,

      celronicType: '',
      celronicQuantity: 0,

      tataPanelQuantity: 0,
      tataPanelStrengthWatt: 0,
      tataQuantity: 0,
    });

    setTotalCost(0);
    setSaveMessage('');
  };

  const handleSaveCalculator = async () => {
    try {
      setSaving(true);
      setSaveMessage('');

      const payload = {
        meetingId: values.meetingId ? Number(values.meetingId) : null,
        leadId: values.leadId ? Number(values.leadId) : null,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerCity: values.customerCity,
        electricityBill: values.electricityBill,

        panelCategory: values.panelCategory,
        panelType: values.panelType,
        numberOfPanels: values.numberOfPanels,
        wattPerPanel: values.wattPerPanel,

        ongridBrand: values.ongridBrand,
        ongridWatt: values.ongridWatt,
        ongridQuantity: values.ongridQuantity,

        structureType: values.structureType,
        structureWatt: values.structureWatt,
        structureQuantity: values.structureQuantity,

        electricalItemName: values.electricalItemName,
        electricalWatt: values.electricalWatt,
        electricalQuantity: values.electricalQuantity,

        marginWatt: values.marginWatt,

        transportationRange: values.transportationRange,
        distanceKm: values.distanceKm,

        hybridType: values.hybridType,
        hybridPhase: values.hybridPhase,
        hybridQuantity: values.hybridQuantity,

        batteryType: values.batteryType,
        batteryStrength: values.batteryStrength,
        batteryQuantity: values.batteryQuantity,

        celronicType: values.celronicType,
        celronicQuantity: values.celronicQuantity,

        tataPanelQuantity: values.tataPanelQuantity,
        tataPanelStrengthWatt: values.tataPanelStrengthWatt,
        tataQuantity: values.tataQuantity,

        totalProjectCost: totalCost,
      };

      await axios.post(`${backendUrl}/calculator`, payload, {
        headers: getAuthHeaders(),
      });

      setSaveMessage('Calculator saved successfully');
    } catch (error) {
      console.error(error);
      setSaveMessage('Failed to save calculator');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => {
            if (values.meetingId) {
              router.push(`/meeting/${values.meetingId}`);
            } else {
              router.push('/meeting');
            }
          }}
          className="rounded-xl bg-gray-700 px-4 py-3 text-white"
        >
          Back to Meeting
        </button>

        <button
          type="button"
          onClick={handleResetCalculator}
          className="rounded-xl bg-red-500 px-4 py-3 text-white"
        >
          Reset Calculator
        </button>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-semibold">
          Meeting / Customer Details
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Meeting ID</label>
            <input
              type="text"
              value={values.meetingId}
              readOnly
              className={`${inputClassName} bg-gray-100`}
            />
          </div>

          <div>
            <label className={labelClassName}>Lead ID</label>
            <input
              type="text"
              value={values.leadId}
              readOnly
              className={`${inputClassName} bg-gray-100`}
            />
          </div>

          <div>
            <label className={labelClassName}>Customer Name</label>
            <input
              type="text"
              value={values.customerName}
              onChange={(e) => setTextValue('customerName', e.target.value)}
              className={inputClassName}
              placeholder="Enter customer name"
            />
          </div>

          <div>
            <label className={labelClassName}>Phone</label>
            <input
              type="text"
              value={values.customerPhone}
              onChange={(e) => setTextValue('customerPhone', e.target.value)}
              className={inputClassName}
              placeholder="Enter phone"
            />
          </div>

          <div>
            <label className={labelClassName}>City</label>
            <input
              type="text"
              value={values.customerCity}
              onChange={(e) => setTextValue('customerCity', e.target.value)}
              className={inputClassName}
              placeholder="Enter city"
            />
          </div>

          <div>
            <label className={labelClassName}>Electricity Bill</label>
            <input
              type="number"
              value={values.electricityBill}
              onChange={(e) =>
                setNumberValue('electricityBill', e.target.value)
              }
              className={inputClassName}
              placeholder="Enter electricity bill"
            />
          </div>
        </div>
      </div>

      <CalculatorSection title="1. Solar Panels" defaultOpen>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Panel Category</label>
            <select
              value={values.panelCategory}
              onChange={(e) =>
                setTextValue(
                  'panelCategory',
                  e.target.value as 'DCR' | 'NONDCR'
                )
              }
              className={inputClassName}
            >
              <option value="DCR">DCR</option>
              <option value="NONDCR">NONDCR</option>
            </select>
          </div>

          <div>
            <label className={labelClassName}>Panel Type</label>
            <select
              value={values.panelType}
              onChange={(e) =>
                setTextValue(
                  'panelType',
                  e.target.value as 'P Type' | 'N Type'
                )
              }
              className={inputClassName}
            >
              <option value="P Type">P Type</option>
              <option value="N Type">N Type</option>
            </select>
          </div>

          <div>
            <label className={labelClassName}>Number of Panels</label>
            <input
              type="number"
              value={values.numberOfPanels}
              onChange={(e) =>
                setNumberValue('numberOfPanels', e.target.value)
              }
              className={inputClassName}
              placeholder="Enter number of panels"
            />
          </div>

          {/* OLD FIELD DISABLED (replaced by dropdown) */}
<div className="opacity-50 pointer-events-none">
  <label className={labelClassName}>Watt Per Panel (Auto)</label>
  <input
    type="number"
    value={values.wattPerPanel}
    readOnly
    className={inputClassName}
  />
</div>

<div>
  <label className={labelClassName}>Select Panel</label>

  <select
    value={selectedPanelOptionId || ''}
    onChange={(e) => {
      const id = Number(e.target.value);
      setSelectedPanelOptionId(id);

      const selected = panelOptions.find((p) => Number(p.id) === id);

      if (selected) {
        setValues((prev) => ({
          ...prev,
          wattPerPanel: Number(selected.capacityWatt || 0),
        }));
      }
    }}
    className={inputClassName}
  >
    <option value="">Select panel</option>
    {panelOptions.map((opt) => (
      <option key={opt.id} value={opt.id}>
        {opt.brandName} - {opt.capacityWatt}W
      </option>
    ))}
  </select>
</div>

        </div>
      </CalculatorSection>

      <CalculatorSection title="2. Ongrid Converter">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div>
      <label className={labelClassName}>Phase</label>
      <select
        value={ongridPhase}
        onChange={(e) => {
          setOngridPhase(e.target.value);
          setSelectedOngridOptionId(null);
          setValues((prev) => ({
            ...prev,
            ongridBrand: '',
            ongridWatt: 0,
          }));
        }}
        className={inputClassName}
      >
        <option value="1 Phase">1 Phase</option>
        <option value="3 Phase">3 Phase</option>
      </select>
    </div>

    <div>
      <label className={labelClassName}>Select Ongrid Converter</label>
      <select
        value={selectedOngridOptionId || ''}
        onChange={(e) => {
          const id = Number(e.target.value);
          setSelectedOngridOptionId(id);

          const selected = ongridOptions.find((opt) => Number(opt.id) === id);

          if (selected) {
            setValues((prev) => ({
              ...prev,
              ongridBrand: selected.brandName,
              ongridWatt: Number(selected.capacity || 0),
            }));
          }
        }}
        className={inputClassName}
      >
        <option value="">Select converter</option>
        {ongridOptions.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.brandName} - {opt.capacity} kW
          </option>
        ))}
      </select>
    </div>

    <div className="opacity-50 pointer-events-none">
      <label className={labelClassName}>Selected Brand (Auto)</label>
      <input
        type="text"
        value={values.ongridBrand}
        readOnly
        className={inputClassName}
      />
    </div>

    <div className="opacity-50 pointer-events-none">
      <label className={labelClassName}>Selected Capacity kW (Auto)</label>
      <input
        type="number"
        value={values.ongridWatt}
        readOnly
        className={inputClassName}
      />
    </div>

    <div>
      <label className={labelClassName}>Quantity</label>
      <input
        type="number"
        value={values.ongridQuantity}
        onChange={(e) => setNumberValue('ongridQuantity', e.target.value)}
        className={inputClassName}
        placeholder="Enter quantity"
      />
    </div>
  </div>
</CalculatorSection>

      <CalculatorSection title="3. Area">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div>
      <label className={labelClassName}>Available Roof Area (sqft)</label>

      <input
        type="number"
        value={availableArea}
        onChange={(e) => setAvailableArea(Number(e.target.value))}
        className={inputClassName}
        placeholder="Enter available roof area"
      />
    </div>

    <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
      Required Area:{' '}
      <b>{requiredArea ? requiredArea.toFixed(2) : '0'} sqft</b>
    </div>
  </div>

  {areaError && (
    <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
      {areaError}
    </div>
  )}
</CalculatorSection>

      <CalculatorSection title="4. Structure">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Structure Type</label>
            <select
              value={values.structureType}
              onChange={(e) =>
                setTextValue(
                  'structureType',
                  e.target.value as 'Rooftop' | 'Tin Shade'
                )
              }
              className={inputClassName}
            >
              <option value="Rooftop">Rooftop</option>
              <option value="Tin Shade">Tin Shade</option>
            </select>
          </div>

          <div>
  <label className={labelClassName}>Select Structure</label>

  <select
    value={selectedStructureOptionId || ''}
    onChange={(e) => {
      const id = Number(e.target.value);
      setSelectedStructureOptionId(id);

      const selected = structureOptions.find((opt) => Number(opt.id) === id);

      if (selected) {
        setValues((prev) => ({
          ...prev,
          structureWatt: Number(selected.capacityKw || 0),
          structureQuantity: 1,
        }));
      }
    }}
    className={inputClassName}
  >
    <option value="">Select structure</option>

    {structureOptions.map((opt) => (
      <option key={opt.id} value={opt.id}>
        {opt.structureType} - {opt.capacityKw} kW
      </option>
    ))}
  </select>
</div>

          {/* OLD STRUCTURE INPUTS DISABLED */}
<div className="opacity-50 pointer-events-none">
  <label className={labelClassName}>Structure Capacity (Auto)</label>
  <input
    type="number"
    value={values.structureWatt}
    readOnly
    className={inputClassName}
  />
</div>
        </div>
      </CalculatorSection>

      <CalculatorSection title="4. Electrical Items">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Item Name</label>
            <input
              type="text"
              value={values.electricalItemName}
              onChange={(e) =>
                setTextValue('electricalItemName', e.target.value)
              }
              className={inputClassName}
              placeholder="Enter item name"
            />
          </div>

          <div>
            <label className={labelClassName}>Watt</label>
            <input
              type="number"
              value={values.electricalWatt}
              onChange={(e) => setNumberValue('electricalWatt', e.target.value)}
              className={inputClassName}
              placeholder="Enter watt"
            />
          </div>

          <div>
            <label className={labelClassName}>Quantity</label>
            <input
              type="number"
              value={values.electricalQuantity}
              onChange={(e) =>
                setNumberValue('electricalQuantity', e.target.value)
              }
              className={inputClassName}
              placeholder="Enter quantity"
            />
          </div>
        </div>
      </CalculatorSection>

      <CalculatorSection title="5. Margin">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Watt</label>
            <input
              type="number"
              value={values.marginWatt}
              onChange={(e) => setNumberValue('marginWatt', e.target.value)}
              className={inputClassName}
              placeholder="Enter watt"
            />
          </div>
        </div>
      </CalculatorSection>

      <CalculatorSection title="6. Transportation">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Range</label>
            <select
              value={values.transportationRange}
              onChange={(e) =>
                setTextValue(
                  'transportationRange',
                  e.target.value as 'UPTO 100KM' | 'UPTO 200KM'
                )
              }
              className={inputClassName}
            >
              <option value="UPTO 100KM">UPTO 100KM</option>
              <option value="UPTO 200KM">UPTO 200KM</option>
            </select>
          </div>

          <div>
            <label className={labelClassName}>Distance (KM)</label>
            <input
              type="number"
              value={values.distanceKm}
              onChange={(e) => setNumberValue('distanceKm', e.target.value)}
              className={inputClassName}
              placeholder="Enter distance in km"
            />
          </div>
        </div>
      </CalculatorSection>

      <CalculatorSection title="7. Hybrid Converter">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Type</label>
            <input
              type="text"
              value={values.hybridType}
              onChange={(e) => setTextValue('hybridType', e.target.value)}
              className={inputClassName}
              placeholder="Enter hybrid converter type"
            />
          </div>

          <div>
            <label className={labelClassName}>Phase</label>
            <select
              value={values.hybridPhase}
              onChange={(e) =>
                setTextValue(
                  'hybridPhase',
                  e.target.value as
                    | 'Single Phase'
                    | 'Three Phase'
                    | 'High Voltage'
                )
              }
              className={inputClassName}
            >
              <option value="Single Phase">Single Phase</option>
              <option value="Three Phase">Three Phase</option>
              <option value="High Voltage">High Voltage</option>
            </select>
          </div>

          <div>
            <label className={labelClassName}>Quantity</label>
            <input
              type="number"
              value={values.hybridQuantity}
              onChange={(e) => setNumberValue('hybridQuantity', e.target.value)}
              className={inputClassName}
              placeholder="Enter quantity"
            />
          </div>
        </div>
      </CalculatorSection>

      <CalculatorSection title="8. Battery">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Battery Type</label>
            <input
              type="text"
              value={values.batteryType}
              onChange={(e) => setTextValue('batteryType', e.target.value)}
              className={inputClassName}
              placeholder="Enter battery type"
            />
          </div>

          <div>
            <label className={labelClassName}>Strength</label>
            <input
              type="text"
              value={values.batteryStrength}
              onChange={(e) => setTextValue('batteryStrength', e.target.value)}
              className={inputClassName}
              placeholder="Enter battery strength"
            />
          </div>

          <div>
            <label className={labelClassName}>Quantity</label>
            <input
              type="number"
              value={values.batteryQuantity}
              onChange={(e) => setNumberValue('batteryQuantity', e.target.value)}
              className={inputClassName}
              placeholder="Enter quantity"
            />
          </div>
        </div>
      </CalculatorSection>

      <CalculatorSection title="9. Celronic Hybrid - Direct Load Inverter">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Type</label>
            <input
              type="text"
              value={values.celronicType}
              onChange={(e) => setTextValue('celronicType', e.target.value)}
              className={inputClassName}
              placeholder="Enter type"
            />
          </div>

          <div>
            <label className={labelClassName}>Quantity</label>
            <input
              type="number"
              value={values.celronicQuantity}
              onChange={(e) =>
                setNumberValue('celronicQuantity', e.target.value)
              }
              className={inputClassName}
              placeholder="Enter quantity"
            />
          </div>
        </div>
      </CalculatorSection>

      <CalculatorSection title="10. Tata Solar Subsidy DCR Project">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Panel Quantity</label>
            <input
              type="number"
              value={values.tataPanelQuantity}
              onChange={(e) =>
                setNumberValue('tataPanelQuantity', e.target.value)
              }
              className={inputClassName}
              placeholder="Enter panel quantity"
            />
          </div>

          <div>
            <label className={labelClassName}>Panel Strength in Watt</label>
            <input
              type="number"
              value={values.tataPanelStrengthWatt}
              onChange={(e) =>
                setNumberValue('tataPanelStrengthWatt', e.target.value)
              }
              className={inputClassName}
              placeholder="Enter panel strength"
            />
          </div>

          <div>
            <label className={labelClassName}>Quantity</label>
            <input
              type="number"
              value={values.tataQuantity}
              onChange={(e) => setNumberValue('tataQuantity', e.target.value)}
              className={inputClassName}
              placeholder="Enter quantity"
            />
          </div>
        </div>
      </CalculatorSection>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-semibold">Project Cost</h2>

        <div className="rounded-2xl bg-green-100 px-5 py-4">
          <p className="text-sm font-medium text-green-800">
            Total Project Cost
          </p>
          <p className="text-2xl font-bold text-green-900">
            ₹ {formatCurrency(totalCost)}
          </p>

          {calculating && (
            <p className="mt-2 text-sm text-green-700">Calculating...</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Save Calculator</h2>
            <p className="text-sm text-gray-600">
              Save this calculator result against the linked meeting
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveCalculator}
            disabled={saving}
            className="rounded-xl bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Calculator'}
          </button>
        </div>

        {saveMessage && (
          <p className="mt-3 text-sm text-blue-600">{saveMessage}</p>
        )}
      </div>
    </div>
  );
}
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
const preventNumberWheelChange = (
  e: React.WheelEvent<HTMLInputElement>
) => {
  e.currentTarget.blur();
};

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
  const [expectedProfit, setExpectedProfit] = useState(0);
const [showExpectedProfit, setShowExpectedProfit] = useState(false);
const [discountAmount, setDiscountAmount] = useState(0);
const [appliedDiscount, setAppliedDiscount] = useState(0);
const [maxAllowedDiscount, setMaxAllowedDiscount] = useState(0);
const [discountAdjusted, setDiscountAdjusted] = useState(false);
const [finalCost, setFinalCost] = useState(0);

  const [showAdvancedItems, setShowAdvancedItems] = useState(false);
  const [showFinancialSummary, setShowFinancialSummary] = useState(false);

  const [panelOptions, setPanelOptions] = useState<any[]>([]);
  const [selectedPanelOptionId, setSelectedPanelOptionId] = useState<number | null>(null);

  const [structureOptions, setStructureOptions] = useState<any[]>([]);
  const [electricalOptions, setElectricalOptions] = useState<any[]>([]);
const [selectedElectricalOptionId, setSelectedElectricalOptionId] = useState<number | null>(null);
  const [selectedStructureOptionId, setSelectedStructureOptionId] = useState<number | null>(null);

  const [availableArea, setAvailableArea] = useState(0);
  const [requiredArea, setRequiredArea] = useState(0);
  const [areaError, setAreaError] = useState('');

  const [ongridOptions, setOngridOptions] = useState<any[]>([]);
  const [hybridOptions, setHybridOptions] = useState<any[]>([]);
  const [batteryOptions, setBatteryOptions] = useState<any[]>([]);
  const [kitOptions, setKitOptions] = useState<any[]>([]);
const [selectedKitOptionId, setSelectedKitOptionId] = useState<number | null>(null);
const [batteryTypes, setBatteryTypes] = useState<string[]>([]);
const [selectedBatteryOptionId, setSelectedBatteryOptionId] = useState<number | null>(null);
const [selectedHybridOptionId, setSelectedHybridOptionId] = useState<number | null>(null);
  const [selectedOngridOptionId, setSelectedOngridOptionId] = useState<number | null>(null);
  const [ongridPhase, setOngridPhase] = useState('1 Phase');
  const [savedCalculatorId, setSavedCalculatorId] = useState<number | null>(null);
  const [generatingProposal, setGeneratingProposal] = useState(false);

  const [marginOptions, setMarginOptions] = useState<any[]>([]);

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
          marginWatt: values.marginWatt,
          panelOptionId: selectedPanelOptionId,
ongridOptionId: selectedOngridOptionId,
structureOptionId: selectedStructureOptionId,
electricalOptionId: selectedElectricalOptionId,
hybridOptionId: selectedHybridOptionId,
batteryOptionId: selectedBatteryOptionId,
kitOptionId: selectedKitOptionId,
discountAmount: discountAmount,
        },
        { headers: getAuthHeaders() }
      );

      setTotalCost(Number(response.data?.totalProjectCost || 0));
      setRequiredArea(Number(response.data?.requiredArea || 0));
      setExpectedProfit(Number(response.data?.expectedProfit || 0));
      const nextAppliedDiscount = Number(response.data?.appliedDiscount || 0);
const nextDiscountAdjusted = Boolean(response.data?.discountAdjusted);

setAppliedDiscount(nextAppliedDiscount);
setMaxAllowedDiscount(Number(response.data?.maxAllowedDiscount || 0));
setDiscountAdjusted(nextDiscountAdjusted);
setFinalCost(Number(response.data?.finalCost || 0));

if (nextDiscountAdjusted) {
  setDiscountAmount(nextAppliedDiscount);
}
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
}, [values, discountAmount]);

  useEffect(() => {
    fetchMarginOptions();
    fetchElectricalOptions();
    fetchBatteryOptions();
    fetchKitOptions();
  }, []);

  useEffect(() => {
    fetchOngridOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ongridPhase]);

  useEffect(() => {
  fetchHybridOptions();
}, [values.hybridPhase]);


  const fetchKitOptions = async () => {
  try {
    const res = await axios.get(`${backendUrl}/calculator/kit-options`, {
      headers: getAuthHeaders(),
    });

    setKitOptions(res.data || []);
  } catch (err) {
    console.error(err);
  }
};

  const fetchBatteryOptions = async () => {
  try {
    const res = await axios.get(`${backendUrl}/calculator/battery-options`, {
      headers: getAuthHeaders(),
    });

    const data = res.data || [];
    setBatteryOptions(data);

    const types = Array.from(new Set(data.map((b: any) => b.type)));
    setBatteryTypes(types);

  } catch (err) {
    console.error(err);
  }
};

const handleGenerateProposal = async () => {
  try {
    if (!values.meetingId && !values.leadId) {
      alert('Please link this calculator to a meeting or lead before generating proposal');
      return;
    }

    // You already save calculator before this, so ensure you have a calculatorId.
    // If you have it from save response, use that. If not, use last saved calculator id logic.
    // For now, we’ll assume you have calculatorId available:
    const calculatorId = savedCalculatorId;

    if (!calculatorId) {
      alert('Please save calculator first');
      return;
    }

    setGeneratingProposal(true);

    const res = await axios.post(
      `${backendUrl}/proposals/from-calculator/${calculatorId}`,
      {},
      { headers: getAuthHeaders() }
    );

    const proposalId = res.data?.id;

    if (proposalId) {
      router.push(`/proposal/${proposalId}`);
    } else {
      alert('Proposal created but ID not returned');
    }
  } catch (err) {
    console.error(err);
    alert('Failed to generate proposal');
  } finally {
    setGeneratingProposal(false);
  }
};

  const fetchHybridOptions = async () => {
  try {
    const res = await axios.get(`${backendUrl}/calculator/hybrid-options`, {
      params: {
        phase: values.hybridPhase,
      },
      headers: getAuthHeaders(),
    });

    setHybridOptions(res.data || []);
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

  const fetchMarginOptions = async () => {
    try {
      const res = await axios.get(
        `${backendUrl}/calculator/margin-options`,
        { headers: getAuthHeaders() }
      );
      setMarginOptions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch margin options', err);
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

    setSelectedPanelOptionId(null);
    setSelectedOngridOptionId(null);
    setSelectedStructureOptionId(null);
    setTotalCost(0);
    setRequiredArea(0);
setAreaError('');
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

        panelOptionId: selectedPanelOptionId,
ongridOptionId: selectedOngridOptionId,
structureOptionId: selectedStructureOptionId,
electricalOptionId: selectedElectricalOptionId,
hybridOptionId: selectedHybridOptionId,
batteryOptionId: selectedBatteryOptionId,
kitOptionId: selectedKitOptionId,
expectedProfit,
discountAmount: appliedDiscount,
appliedDiscount,
finalCost,
      };

      const res = await axios.post(`${backendUrl}/calculator`, payload, {
  headers: getAuthHeaders(),
});

const savedCalculatorId = res.data?.id;
setSavedCalculatorId(savedCalculatorId);

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
              min={0}
onWheel={preventNumberWheelChange}
              className={inputClassName}
              placeholder="Enter number of panels"
            />
          </div>

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
              min={0}
onWheel={preventNumberWheelChange}
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
              min={0}
onWheel={preventNumberWheelChange}
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

      <CalculatorSection title="5. Electrical Items">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

    <div>
      <label className={labelClassName}>Select Electrical Item</label>

      <select
        value={selectedElectricalOptionId || ''}
        onChange={(e) => {
          const id = Number(e.target.value);
          setSelectedElectricalOptionId(id);

          const selected = electricalOptions.find((opt) => opt.id === id);

          if (selected) {
            setValues((prev) => ({
              ...prev,
              electricalItemName:
  selected.itemName || `${selected.capacityKw} kW`,
electricalWatt: Number(selected.capacityKw || 0),
            }));
          }
        }}
        className={inputClassName}
      >
        <option value="">Select item</option>
        {electricalOptions.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.itemName || 'Item'} - {opt.capacityKw} kW
          </option>
        ))}
      </select>
    </div>

    <div className="opacity-50 pointer-events-none">
      <label className={labelClassName}>Selected Item (Auto)</label>
      <input
        type="text"
        value={values.electricalItemName || ''}
        readOnly
        className={inputClassName}
      />
    </div>

    <div className="opacity-50 pointer-events-none">
      <label className={labelClassName}>Capacity (Auto)</label>
      <input
        type="number"
        value={values.electricalWatt}
        readOnly
        className={inputClassName}
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
        min={0}
onWheel={preventNumberWheelChange}
        className={inputClassName}
        placeholder="Enter quantity"
      />
    </div>

  </div>
</CalculatorSection>

      <CalculatorSection title="6. Transportation">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Distance (KM)</label>
            <input
              type="number"
              value={values.distanceKm}
              onChange={(e) => setNumberValue('distanceKm', e.target.value)}
              min={0}
onWheel={preventNumberWheelChange}
              className={inputClassName}
              placeholder="Enter distance in km"
            />
          </div>
        </div>
      </CalculatorSection>

      <CalculatorSection title="7. Margin">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Capacity (kW)</label>
            <input
              type="number"
              value={values.marginWatt}
              onChange={(e) => setNumberValue('marginWatt', e.target.value)}
              min={0}
onWheel={preventNumberWheelChange}
              className={inputClassName}
              placeholder="Enter capacity in kW"
            />
          </div>
        </div>
      </CalculatorSection>

      <div className="rounded-2xl bg-white p-5 shadow">
        <button
          type="button"
          onClick={() => setShowAdvancedItems((prev) => !prev)}
          className="w-full rounded-xl bg-gray-800 px-5 py-3 text-white"
        >
          {showAdvancedItems ? 'Hide Advanced Items' : 'Show Advanced Items'}
        </button>
      </div>

      {showAdvancedItems && (
        <>
          <CalculatorSection title="8. Hybrid Converter">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

    <div>
      <label className={labelClassName}>Phase</label>
      <select
        value={values.hybridPhase}
        onChange={(e) =>
          setTextValue(
            'hybridPhase',
            e.target.value as 'Single Phase' | 'Three Phase' | 'High Voltage'
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
      <label className={labelClassName}>Select Hybrid Converter</label>

      <select
        value={selectedHybridOptionId || ''}
        onChange={(e) => {
          const id = Number(e.target.value);
          setSelectedHybridOptionId(id);

          const selected = hybridOptions.find((opt) => opt.id === id);

          if (selected) {
            setValues((prev) => ({
              ...prev,
              hybridType: selected.brandName,
            }));
          }
        }}
        className={inputClassName}
      >
        <option value="">Select hybrid</option>
        {hybridOptions.map((opt) => (
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
        value={values.hybridType}
        readOnly
        className={inputClassName}
      />
    </div>

    <div>
      <label className={labelClassName}>Quantity</label>
      <input
        type="number"
        value={values.hybridQuantity}
        onChange={(e) =>
          setNumberValue('hybridQuantity', e.target.value)
        }
        min={0}
onWheel={preventNumberWheelChange}
        className={inputClassName}
        placeholder="Enter quantity"
      />
    </div>

  </div>
</CalculatorSection>

          <CalculatorSection title="9. Battery">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

    {/* Battery Type */}
    <div>
      <label className={labelClassName}>Battery Type</label>

      <select
        value={values.batteryType}
        onChange={(e) => {
          setTextValue('batteryType', e.target.value);
          setSelectedBatteryOptionId(null);
          setTextValue('batteryStrength', '');
        }}
        className={inputClassName}
      >
        <option value="">Select type</option>
        {batteryTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>

    {/* Battery Option */}
    <div>
      <label className={labelClassName}>Select Battery</label>

      <select
        value={selectedBatteryOptionId || ''}
        onChange={(e) => {
          const id = Number(e.target.value);
          setSelectedBatteryOptionId(id);

          const selected = batteryOptions.find((opt) => opt.id === id);

          if (selected) {
            setValues((prev) => ({
              ...prev,
              batteryType: selected.type,
              batteryStrength: selected.capacity,
            }));
          }
        }}
        className={inputClassName}
      >
        <option value="">Select battery</option>

        {batteryOptions
          .filter((opt) =>
            values.batteryType ? opt.type === values.batteryType : true
          )
          .map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.brandName} - {opt.capacity} kWh / Ah
            </option>
          ))}
      </select>
    </div>

    {/* Selected Strength */}
    <div className="opacity-50 pointer-events-none">
      <label className={labelClassName}>Selected Capacity</label>
      <input
        type="text"
        value={values.batteryStrength}
        readOnly
        className={inputClassName}
      />
    </div>

    {/* Quantity */}
    <div>
      <label className={labelClassName}>Quantity</label>
      <input
        type="number"
        value={values.batteryQuantity}
        onChange={(e) =>
          setNumberValue('batteryQuantity', e.target.value)
        }
        min={0}
onWheel={preventNumberWheelChange}
        className={inputClassName}
        placeholder="Enter quantity"
      />
    </div>

  </div>
</CalculatorSection>

          <CalculatorSection title="10. Kit">
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

    {/* Kit Selection */}
    <div>
      <label className={labelClassName}>Select Kit</label>

      <select
        value={selectedKitOptionId || ''}
        onChange={(e) => {
          const id = Number(e.target.value);
          setSelectedKitOptionId(id);

          const selected = kitOptions.find((opt) => opt.id === id);

          if (selected) {
            setValues((prev) => ({
              ...prev,
              tataPanelStrengthWatt: Number(selected.capacity || 0),
            }));
          }
        }}
        className={inputClassName}
      >
        <option value="">Select kit</option>

        {kitOptions.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.brandName} - {opt.capacity}
          </option>
        ))}
      </select>
    </div>

    {/* Selected Capacity */}
    <div className="opacity-50 pointer-events-none">
      <label className={labelClassName}>Selected Capacity</label>
      <input
        type="number"
        value={values.tataPanelStrengthWatt}
        readOnly
        className={inputClassName}
      />
    </div>

    {/* Quantity */}
    <div>
      <label className={labelClassName}>Quantity</label>
      <input
        type="number"
        value={values.tataQuantity}
        onChange={(e) =>
          setNumberValue('tataQuantity', e.target.value)
        }
        min={0}
onWheel={preventNumberWheelChange}
        className={inputClassName}
        placeholder="Enter quantity"
      />
    </div>

  </div>
</CalculatorSection>
        </>
      )}

      <div className="rounded-2xl bg-white p-5 shadow">
        <button
          type="button"
          onClick={() => setShowFinancialSummary((prev) => !prev)}
          className="w-full rounded-xl bg-green-700 px-5 py-3 text-white"
        >
          {showFinancialSummary
            ? 'Hide Financial Summary'
            : 'Show Financial Summary'}
        </button>
      </div>

      {showFinancialSummary && (
        <div className="rounded-2xl bg-white p-5 shadow space-y-4">
          <h2 className="text-lg font-semibold">Financial Summary</h2>

          <div className="rounded-2xl bg-green-100 px-5 py-4">
  <p className="text-sm font-medium text-green-800">Laagat</p>
  <p className="text-2xl font-bold text-green-900">
    ₹ {formatCurrency(totalCost)}
  </p>

  {calculating && (
    <p className="mt-2 text-sm text-green-700">Calculating...</p>
  )}
</div>

<button
  type="button"
  onClick={() => setShowExpectedProfit((prev) => !prev)}
  className="rounded-xl bg-blue-600 px-5 py-3 text-white"
>
  {showExpectedProfit ? 'Hide Expected Profit' : 'View Expected Profit'}
</button>

{showExpectedProfit && (
  <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
    Expected Profit: <b>₹ {formatCurrency(expectedProfit)}</b>
  </div>
)}

<div>
  <label className={labelClassName}>Discount</label>
  <input
    type="number"
    value={discountAmount}
    onChange={(e) => setDiscountAmount(toNumber(e.target.value))}
    min={0}
    onWheel={preventNumberWheelChange}
    className={inputClassName}
    placeholder="Enter discount"
  />

  <p className="mt-2 text-xs text-gray-500">
    Max allowed discount: ₹ {formatCurrency(maxAllowedDiscount)}
  </p>

  {discountAdjusted && (
    <p className="mt-2 text-sm text-orange-600">
      Discount adjusted to your allowed limit ₹ {formatCurrency(appliedDiscount)}
    </p>
  )}
</div>

<div className="rounded-2xl bg-purple-100 px-5 py-4">
  <p className="text-sm font-medium text-purple-800">Final Cost</p>
  <p className="text-2xl font-bold text-purple-900">
    ₹ {formatCurrency(finalCost || totalCost)}
  </p>
</div>
        </div>
      )}

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

          <button
  type="button"
  onClick={handleGenerateProposal}
  disabled={generatingProposal}
  className="mt-4 rounded-xl bg-purple-600 px-5 py-3 text-white disabled:opacity-50"
>
  {generatingProposal ? 'Generating Proposal...' : 'Generate Proposal'}
</button>
        </div>

        {saveMessage && (
          <p className="mt-3 text-sm text-blue-600">{saveMessage}</p>
        )}
      </div>
    </div>
  );
}
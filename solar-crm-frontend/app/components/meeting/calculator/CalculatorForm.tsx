'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/authHeaders';
import CalculatorSection from './CalculatorSection';
import {
  calculatePanelCost,
  calculateSimpleLineTotal,
  calculateTransportationCost,
  formatCurrency,
  toNumber,
} from './calculator-utils';

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
  // 1. Solar Panels
  panelCategory: 'DCR' | 'NONDCR';
  panelType: 'P Type' | 'N Type';
  ratePerWatt: number;
  numberOfPanels: number;
  wattPerPanel: number;

  // 2. Ongrid Converter
  ongridBrand: string;
  ongridWatt: number;
  ongridQuantity: number;
  ongridRate: number;

  // 3. Structure
  structureType: 'Rooftop' | 'Tin-shade';
  structureWatt: number;
  structureQuantity: number;
  structureRate: number;

  // 4. Electrical Items
  electricalItemName: string;
  electricalWatt: number;
  electricalQuantity: number;
  electricalRate: number;

  // 5. Margin
  marginWatt: number;
  marginAmount: number;

  // 6. Transportation
  transportationRange: 'UPTO 100KM' | 'UPTO 200KM';
  distanceKm: number;

  // 7. Hybrid Converter
  hybridType: string;
  hybridPhase: 'Single Phase' | 'Three Phase' | 'High Voltage';
  hybridQuantity: number;
  hybridRate: number;

  // 8. Battery
  batteryType: string;
  batteryStrength: string;
  batteryQuantity: number;
  batteryRate: number;

  // 9. Celronic Hybrid - Direct Load Inverter
  celronicType: string;
  celronicQuantity: number;
  celronicRate: number;

  // 10. Tata Solar Subsidy DCR Project
  tataPanelQuantity: number;
  tataPanelStrengthWatt: number;
  tataQuantity: number;
  tataRate: number;

  // Extra
  electricityDepartmentCost: number;
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
  const [saveMessage, setSaveMessage] = useState('');
  const [saving, setSaving] = useState(false);
    const router = useRouter();

  const [values, setValues] = useState<CalculatorValues>({

        meetingId: initialData?.meetingId || '',
    leadId: initialData?.leadId || '',
    customerName: initialData?.name || '',
    customerPhone: initialData?.phone || '',
    customerCity: initialData?.city || '',
    electricityBill: initialData?.electricityBill || 0,
    panelCategory: 'DCR',
    panelType: 'P Type',
    ratePerWatt: 0,
    numberOfPanels: 0,
    wattPerPanel: 0,

    ongridBrand: '',
    ongridWatt: 0,
    ongridQuantity: 0,
    ongridRate: 0,

    structureType: 'Rooftop',
    structureWatt: 0,
    structureQuantity: 0,
    structureRate: 0,

    electricalItemName: '',
    electricalWatt: 0,
    electricalQuantity: 0,
    electricalRate: 0,

    marginWatt: 0,
    marginAmount: 0,

    transportationRange: 'UPTO 100KM',
    distanceKm: 0,

    hybridType: '',
    hybridPhase: 'Single Phase',
    hybridQuantity: 0,
    hybridRate: 0,

    batteryType: '',
    batteryStrength: '',
    batteryQuantity: 0,
    batteryRate: 0,

    celronicType: '',
    celronicQuantity: 0,
    celronicRate: 0,

    tataPanelQuantity: 0,
    tataPanelStrengthWatt: 0,
    tataQuantity: 0,
    tataRate: 0,

    electricityDepartmentCost: 0,
  });

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
      ratePerWatt: 0,
      numberOfPanels: 0,
      wattPerPanel: 0,

      ongridBrand: '',
      ongridWatt: 0,
      ongridQuantity: 0,
      ongridRate: 0,

      structureType: 'Rooftop',
      structureWatt: 0,
      structureQuantity: 0,
      structureRate: 0,

      electricalItemName: '',
      electricalWatt: 0,
      electricalQuantity: 0,
      electricalRate: 0,

      marginWatt: 0,
      marginAmount: 0,

      transportationRange: 'UPTO 100KM',
      distanceKm: 0,

      hybridType: '',
      hybridPhase: 'Single Phase',
      hybridQuantity: 0,
      hybridRate: 0,

      batteryType: '',
      batteryStrength: '',
      batteryQuantity: 0,
      batteryRate: 0,

      celronicType: '',
      celronicQuantity: 0,
      celronicRate: 0,

      tataPanelQuantity: 0,
      tataPanelStrengthWatt: 0,
      tataQuantity: 0,
      tataRate: 0,

      electricityDepartmentCost: 0,
    });

    setSaveMessage('');
  };

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

  const totals = useMemo(() => {
    const panelCost = calculatePanelCost(
      values.ratePerWatt,
      values.numberOfPanels,
      values.wattPerPanel
    );

    const ongridCost = calculateSimpleLineTotal(
      values.ongridQuantity,
      values.ongridRate
    );

    const structureCost = calculateSimpleLineTotal(
      values.structureQuantity,
      values.structureRate
    );

    const electricalCost = calculateSimpleLineTotal(
      values.electricalQuantity,
      values.electricalRate
    );

    const transportationCost = calculateTransportationCost(values.distanceKm);

    const hybridCost = calculateSimpleLineTotal(
      values.hybridQuantity,
      values.hybridRate
    );

    const batteryCost = calculateSimpleLineTotal(
      values.batteryQuantity,
      values.batteryRate
    );

    const celronicCost = calculateSimpleLineTotal(
      values.celronicQuantity,
      values.celronicRate
    );

    const tataCost = calculateSimpleLineTotal(
      values.tataQuantity,
      values.tataRate
    );

    const totalProjectCost =
      panelCost +
      ongridCost +
      structureCost +
      electricalCost +
      values.marginAmount +
      transportationCost +
      hybridCost +
      batteryCost +
      celronicCost +
      tataCost +
      values.electricityDepartmentCost;

    return {
      panelCost,
      ongridCost,
      structureCost,
      electricalCost,
      transportationCost,
      hybridCost,
      batteryCost,
      celronicCost,
      tataCost,
      totalProjectCost,
    };
  }, [values]);

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
        ratePerWatt: values.ratePerWatt,
        numberOfPanels: values.numberOfPanels,
        wattPerPanel: values.wattPerPanel,
        panelCost: totals.panelCost,

        ongridBrand: values.ongridBrand,
        ongridWatt: values.ongridWatt,
        ongridQuantity: values.ongridQuantity,
        ongridRate: values.ongridRate,
        ongridCost: totals.ongridCost,

        structureType: values.structureType,
        structureWatt: values.structureWatt,
        structureQuantity: values.structureQuantity,
        structureRate: values.structureRate,
        structureCost: totals.structureCost,

        electricalItemName: values.electricalItemName,
        electricalWatt: values.electricalWatt,
        electricalQuantity: values.electricalQuantity,
        electricalRate: values.electricalRate,
        electricalCost: totals.electricalCost,

        marginWatt: values.marginWatt,
        marginAmount: values.marginAmount,

        transportationRange: values.transportationRange,
        distanceKm: values.distanceKm,
        transportationCost: totals.transportationCost,

        hybridType: values.hybridType,
        hybridPhase: values.hybridPhase,
        hybridQuantity: values.hybridQuantity,
        hybridRate: values.hybridRate,
        hybridCost: totals.hybridCost,

        batteryType: values.batteryType,
        batteryStrength: values.batteryStrength,
        batteryQuantity: values.batteryQuantity,
        batteryRate: values.batteryRate,
        batteryCost: totals.batteryCost,

        celronicType: values.celronicType,
        celronicQuantity: values.celronicQuantity,
        celronicRate: values.celronicRate,
        celronicCost: totals.celronicCost,

        tataPanelQuantity: values.tataPanelQuantity,
        tataPanelStrengthWatt: values.tataPanelStrengthWatt,
        tataQuantity: values.tataQuantity,
        tataRate: values.tataRate,
        tataCost: totals.tataCost,

        electricityDepartmentCost: values.electricityDepartmentCost,
        totalProjectCost: totals.totalProjectCost,
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
        <h2 className="mb-4 text-lg font-semibold">Meeting / Customer Details</h2>

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
              onChange={(e) => setNumberValue('electricityBill', e.target.value)}
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
                setTextValue('panelCategory', e.target.value as 'DCR' | 'NONDCR')
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
                setTextValue('panelType', e.target.value as 'P Type' | 'N Type')
              }
              className={inputClassName}
            >
              <option value="P Type">P Type</option>
              <option value="N Type">N Type</option>
            </select>
          </div>

          <div>
            <label className={labelClassName}>Rate Per Watt</label>
            <input
              type="number"
              value={values.ratePerWatt}
              onChange={(e) => setNumberValue('ratePerWatt', e.target.value)}
              className={inputClassName}
              placeholder="Enter rate per watt"
            />
          </div>

          <div>
            <label className={labelClassName}>Number of Panels</label>
            <input
              type="number"
              value={values.numberOfPanels}
              onChange={(e) => setNumberValue('numberOfPanels', e.target.value)}
              className={inputClassName}
              placeholder="Enter number of panels"
            />
          </div>

          <div>
            <label className={labelClassName}>Watt Per Panel</label>
            <input
              type="number"
              value={values.wattPerPanel}
              onChange={(e) => setNumberValue('wattPerPanel', e.target.value)}
              className={inputClassName}
              placeholder="Enter watt per panel"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-sm font-medium text-gray-700">Panel Cost</p>
          <p className="text-xl font-bold text-blue-700">
            ₹ {formatCurrency(totals.panelCost)}
          </p>
        </div>
      </CalculatorSection>

      <CalculatorSection title="2. Ongrid Converter">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Brand</label>
            <input
              type="text"
              value={values.ongridBrand}
              onChange={(e) => setTextValue('ongridBrand', e.target.value)}
              className={inputClassName}
              placeholder="Enter brand"
            />
          </div>

          <div>
            <label className={labelClassName}>Watt</label>
            <input
              type="number"
              value={values.ongridWatt}
              onChange={(e) => setNumberValue('ongridWatt', e.target.value)}
              className={inputClassName}
              placeholder="Enter watt"
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

          <div>
            <label className={labelClassName}>Rate</label>
            <input
              type="number"
              value={values.ongridRate}
              onChange={(e) => setNumberValue('ongridRate', e.target.value)}
              className={inputClassName}
              placeholder="Enter rate"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-sm font-medium text-gray-700">Ongrid Converter Total</p>
          <p className="text-xl font-bold text-blue-700">
            ₹ {formatCurrency(totals.ongridCost)}
          </p>
        </div>
      </CalculatorSection>

      <CalculatorSection title="3. Structure">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Structure Type</label>
            <select
              value={values.structureType}
              onChange={(e) =>
                setTextValue(
                  'structureType',
                  e.target.value as 'Rooftop' | 'Tin-shade'
                )
              }
              className={inputClassName}
            >
              <option value="Rooftop">Rooftop</option>
              <option value="Tin-shade">Tin-shade</option>
            </select>
          </div>

          <div>
            <label className={labelClassName}>Watt</label>
            <input
              type="number"
              value={values.structureWatt}
              onChange={(e) => setNumberValue('structureWatt', e.target.value)}
              className={inputClassName}
              placeholder="Enter watt"
            />
          </div>

          <div>
            <label className={labelClassName}>Quantity</label>
            <input
              type="number"
              value={values.structureQuantity}
              onChange={(e) => setNumberValue('structureQuantity', e.target.value)}
              className={inputClassName}
              placeholder="Enter quantity"
            />
          </div>

          <div>
            <label className={labelClassName}>Rate</label>
            <input
              type="number"
              value={values.structureRate}
              onChange={(e) => setNumberValue('structureRate', e.target.value)}
              className={inputClassName}
              placeholder="Enter rate"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-sm font-medium text-gray-700">Structure Total</p>
          <p className="text-xl font-bold text-blue-700">
            ₹ {formatCurrency(totals.structureCost)}
          </p>
        </div>
      </CalculatorSection>

      <CalculatorSection title="4. Electrical Items">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Item Name</label>
            <input
              type="text"
              value={values.electricalItemName}
              onChange={(e) => setTextValue('electricalItemName', e.target.value)}
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

          <div>
            <label className={labelClassName}>Rate</label>
            <input
              type="number"
              value={values.electricalRate}
              onChange={(e) => setNumberValue('electricalRate', e.target.value)}
              className={inputClassName}
              placeholder="Enter rate"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-sm font-medium text-gray-700">Electrical Items Total</p>
          <p className="text-xl font-bold text-blue-700">
            ₹ {formatCurrency(totals.electricalCost)}
          </p>
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

          <div>
            <label className={labelClassName}>Margin Amount</label>
            <input
              type="number"
              value={values.marginAmount}
              onChange={(e) => setNumberValue('marginAmount', e.target.value)}
              className={inputClassName}
              placeholder="Enter margin amount"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-sm font-medium text-gray-700">Margin Total</p>
          <p className="text-xl font-bold text-blue-700">
            ₹ {formatCurrency(values.marginAmount)}
          </p>
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

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-sm font-medium text-gray-700">Transportation Total</p>
          <p className="text-xl font-bold text-blue-700">
            ₹ {formatCurrency(totals.transportationCost)}
          </p>
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
            <label className={labelClassName}>Quantity</label>
            <input
              type="number"
              value={values.hybridQuantity}
              onChange={(e) => setNumberValue('hybridQuantity', e.target.value)}
              className={inputClassName}
              placeholder="Enter quantity"
            />
          </div>

          <div>
            <label className={labelClassName}>Rate</label>
            <input
              type="number"
              value={values.hybridRate}
              onChange={(e) => setNumberValue('hybridRate', e.target.value)}
              className={inputClassName}
              placeholder="Enter rate"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-sm font-medium text-gray-700">Hybrid Converter Total</p>
          <p className="text-xl font-bold text-blue-700">
            ₹ {formatCurrency(totals.hybridCost)}
          </p>
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

          <div>
            <label className={labelClassName}>Rate</label>
            <input
              type="number"
              value={values.batteryRate}
              onChange={(e) => setNumberValue('batteryRate', e.target.value)}
              className={inputClassName}
              placeholder="Enter rate"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-sm font-medium text-gray-700">Battery Total</p>
          <p className="text-xl font-bold text-blue-700">
            ₹ {formatCurrency(totals.batteryCost)}
          </p>
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
              onChange={(e) => setNumberValue('celronicQuantity', e.target.value)}
              className={inputClassName}
              placeholder="Enter quantity"
            />
          </div>

          <div>
            <label className={labelClassName}>Rate</label>
            <input
              type="number"
              value={values.celronicRate}
              onChange={(e) => setNumberValue('celronicRate', e.target.value)}
              className={inputClassName}
              placeholder="Enter rate"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-sm font-medium text-gray-700">
            Celronic Inverter Total
          </p>
          <p className="text-xl font-bold text-blue-700">
            ₹ {formatCurrency(totals.celronicCost)}
          </p>
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

          <div>
            <label className={labelClassName}>Rate</label>
            <input
              type="number"
              value={values.tataRate}
              onChange={(e) => setNumberValue('tataRate', e.target.value)}
              className={inputClassName}
              placeholder="Enter rate"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-sm font-medium text-gray-700">Tata Solar Total</p>
          <p className="text-xl font-bold text-blue-700">
            ₹ {formatCurrency(totals.tataCost)}
          </p>
        </div>
      </CalculatorSection>

      <CalculatorSection title="Additional Charges">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Electricity Department Cost</label>
            <input
              type="number"
              value={values.electricityDepartmentCost}
              onChange={(e) =>
                setNumberValue('electricityDepartmentCost', e.target.value)
              }
              className={inputClassName}
              placeholder="Enter electricity department cost"
            />
          </div>
        </div>
      </CalculatorSection>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-semibold">Cost Summary</h2>

        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <span>Panel Cost</span>
            <span className="font-semibold">₹ {formatCurrency(totals.panelCost)}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <span>Ongrid Converter Cost</span>
            <span className="font-semibold">₹ {formatCurrency(totals.ongridCost)}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <span>Structure Cost</span>
            <span className="font-semibold">₹ {formatCurrency(totals.structureCost)}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <span>Electrical Items Cost</span>
            <span className="font-semibold">₹ {formatCurrency(totals.electricalCost)}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <span>Margin</span>
            <span className="font-semibold">
              ₹ {formatCurrency(values.marginAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <span>Transportation Cost</span>
            <span className="font-semibold">
              ₹ {formatCurrency(totals.transportationCost)}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <span>Hybrid Converter Cost</span>
            <span className="font-semibold">₹ {formatCurrency(totals.hybridCost)}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <span>Battery Cost</span>
            <span className="font-semibold">₹ {formatCurrency(totals.batteryCost)}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <span>Celronic Inverter Cost</span>
            <span className="font-semibold">₹ {formatCurrency(totals.celronicCost)}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <span>Tata Solar Cost</span>
            <span className="font-semibold">₹ {formatCurrency(totals.tataCost)}</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 md:col-span-2">
            <span>Electricity Department Cost</span>
            <span className="font-semibold">
              ₹ {formatCurrency(values.electricityDepartmentCost)}
            </span>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-green-100 px-5 py-4">
          <p className="text-sm font-medium text-green-800">Total Project Cost</p>
          <p className="text-2xl font-bold text-green-900">
            ₹ {formatCurrency(totals.totalProjectCost)}
          </p>
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
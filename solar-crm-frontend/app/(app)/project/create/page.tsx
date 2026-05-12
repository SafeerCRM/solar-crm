'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CreateProjectPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    city: '',
    zone: '',
    electricityKNumber: '',
    customerGmail: '',
    aadhaarLinkedMobile: '',

    panelBrand: '',
    dcrPanelCount: 0,
    nonDcrPanelCount: 0,

    converterBrand: '',
    converterCapacity: '',
    converterPhase: '1PH',

    structureType: '',
    structureCapacityKw: '',
    buildingHeight: '',

    projectType: 'CASH',

    marginMoney: 0,
    loanAmount: 0,

    subsidyType: 'NATIONAL',

    projectCost: 0,

    discomName: '',

    discomExpenditureType: 'EXCLUDING',
    discomExpenditureAmount: 0,

    expectedLagat: 0,
    expectedProfit: 0,

    remarks: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      await axios.post(`${API_BASE_URL}/project/create`, form, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      alert('Project created successfully');

      router.push('/project');
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message || 'Failed to create project',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Create Project
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Fill project order details carefully before submitting for approval.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Customer Details
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <input
            name="customerName"
            placeholder="Customer Name"
            value={form.customerName}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="customerPhone"
            placeholder="Customer Phone"
            value={form.customerPhone}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="zone"
            placeholder="Zone"
            value={form.zone}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="electricityKNumber"
            placeholder="Electricity K Number"
            value={form.electricityKNumber}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="customerGmail"
            placeholder="Customer Gmail"
            value={form.customerGmail}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="aadhaarLinkedMobile"
            placeholder="Aadhaar Linked Mobile"
            value={form.aadhaarLinkedMobile}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Technical Details
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <input
            name="panelBrand"
            placeholder="Panel Brand"
            value={form.panelBrand}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            name="dcrPanelCount"
            placeholder="DCR Panel Count"
            value={form.dcrPanelCount}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            name="nonDcrPanelCount"
            placeholder="Non DCR Panel Count"
            value={form.nonDcrPanelCount}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="converterBrand"
            placeholder="Converter Brand"
            value={form.converterBrand}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="converterCapacity"
            placeholder="Converter Capacity"
            value={form.converterCapacity}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <select
            name="converterPhase"
            value={form.converterPhase}
            onChange={handleChange}
            className="rounded-xl border p-3"
          >
            <option value="1PH">1 PH</option>
            <option value="3PH">3 PH</option>
          </select>

          <input
            name="structureType"
            placeholder="Structure Type"
            value={form.structureType}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="structureCapacityKw"
            placeholder="Structure Capacity KW"
            value={form.structureCapacityKw}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="buildingHeight"
            placeholder="Building Height"
            value={form.buildingHeight}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Project Finance Details
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <select
            name="projectType"
            value={form.projectType}
            onChange={handleChange}
            className="rounded-xl border p-3"
          >
            <option value="CASH">Cash Project</option>
            <option value="LOAN">Loan Project</option>
          </select>

          {form.projectType === 'LOAN' && (
            <>
              <input
                type="number"
                name="marginMoney"
                placeholder="Margin Money"
                value={form.marginMoney}
                onChange={handleChange}
                className="rounded-xl border p-3"
              />

              <input
                type="number"
                name="loanAmount"
                placeholder="Loan Amount"
                value={form.loanAmount}
                onChange={handleChange}
                className="rounded-xl border p-3"
              />
            </>
          )}

          <select
            name="subsidyType"
            value={form.subsidyType}
            onChange={handleChange}
            className="rounded-xl border p-3"
          >
            <option value="NATIONAL">National</option>
            <option value="NATIONAL_STATE">
              National + State
            </option>
          </select>

          <input
            type="number"
            name="projectCost"
            placeholder="Project Cost"
            value={form.projectCost}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            name="discomName"
            placeholder="DISCOM Name"
            value={form.discomName}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <select
            name="discomExpenditureType"
            value={form.discomExpenditureType}
            onChange={handleChange}
            className="rounded-xl border p-3"
          >
            <option value="INCLUDING">Including</option>
            <option value="EXCLUDING">Excluding</option>
          </select>

          {form.discomExpenditureType === 'INCLUDING' && (
            <input
              type="number"
              name="discomExpenditureAmount"
              placeholder="DISCOM Expenditure Amount"
              value={form.discomExpenditureAmount}
              onChange={handleChange}
              className="rounded-xl border p-3"
            />
          )}

          <input
            type="number"
            name="expectedLagat"
            placeholder="Expected Laagat"
            value={form.expectedLagat}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            name="expectedProfit"
            placeholder="Expected Profit"
            value={form.expectedProfit}
            onChange={handleChange}
            className="rounded-xl border p-3"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          Remarks
        </h2>

        <textarea
          name="remarks"
          placeholder="Write remarks..."
          value={form.remarks}
          onChange={handleChange}
          rows={4}
          className="w-full rounded-xl border p-3"
        />
      </div>

      <div className="pb-10">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? 'Creating Project...'
            : 'Submit Project For Approval'}
        </button>
      </div>
    </div>
  );
}
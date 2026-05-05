'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { getAuthHeaders } from '@/lib/authHeaders';

export default function ProposalPage() {
  const { id } = useParams();
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [proposal, setProposal] = useState<any>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(Number(value || 0));
  };

  const cleanPhoneForWhatsApp = (phone: string) => {
    const digits = String(phone || '').replace(/\D/g, '');

    if (digits.length === 10) {
      return `91${digits}`;
    }

    return digits;
  };

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const res = await axios.get(`${backendUrl}/proposals/${id}`, {
          headers: getAuthHeaders(),
        });

        setProposal(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    if (id) fetchProposal();
  }, [id, backendUrl]);

  if (!proposal) {
    return <div className="p-6">Loading proposal...</div>;
  }

  const calculator = proposal.calculator || {};

  const projectCapacityKw =
    (Number(calculator.numberOfPanels || 0) *
      Number(calculator.wattPerPanel || 0)) /
    1000;

  const whatsappPhone = cleanPhoneForWhatsApp(proposal.customerPhone);

  const whatsappMessage = encodeURIComponent(
    `Hello ${proposal.customerName || ''}, your solar proposal is ready.\n\nProposal No: ${proposal.proposalNumber}\nFinal Cost: ₹${formatCurrency(
      proposal.finalCost
    )}\n\nView Proposal: ${window.location.href}`
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow md:p-10 print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Solar Proposal
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Customer-facing quotation summary
            </p>
          </div>

          <div className="text-sm text-gray-700 md:text-right">
            <p className="font-semibold">Your Solar Company</p>
            <p>Phone: +91 XXXXX XXXXX</p>
            <p>Email: info@company.com</p>
            <p>Address: Jaipur, Rajasthan</p>
          </div>
        </div>

        {/* Proposal Info */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-4">
            <h2 className="mb-3 font-semibold text-gray-900">
              Proposal Details
            </h2>
            <p>
              <b>Proposal No:</b> {proposal.proposalNumber}
            </p>
            <p>
              <b>Date:</b>{' '}
              {proposal.createdAt
                ? new Date(proposal.createdAt).toLocaleDateString('en-IN')
                : '-'}
            </p>
            <p>
              <b>Status:</b> {proposal.status || 'CREATED'}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <h2 className="mb-3 font-semibold text-gray-900">
              Customer Details
            </h2>
            <p>
              <b>Name:</b> {proposal.customerName || '-'}
            </p>
            <p>
              <b>Phone:</b> {proposal.customerPhone || '-'}
            </p>
            <p>
              <b>City:</b> {proposal.customerCity || '-'}
            </p>
          </div>
        </div>

        {/* System Summary */}
        <div className="mt-6 rounded-xl border p-4">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Solar System Summary
          </h2>

          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div>
              <b>Project Capacity:</b>{' '}
              {projectCapacityKw ? `${projectCapacityKw.toFixed(2)} kW` : '-'}
            </div>

            <div>
              <b>Panels:</b>{' '}
              {calculator.numberOfPanels || 0} × {calculator.wattPerPanel || 0}W
            </div>

            <div>
              <b>Panel Type:</b>{' '}
              {[calculator.panelCategory, calculator.panelType]
                .filter(Boolean)
                .join(' / ') || '-'}
            </div>

            <div>
              <b>Ongrid Converter:</b>{' '}
              {calculator.ongridBrand
                ? `${calculator.ongridBrand} - ${calculator.ongridWatt || 0} kW`
                : '-'}
            </div>

            <div>
              <b>Structure:</b>{' '}
              {calculator.structureType
                ? `${calculator.structureType} - ${
                    calculator.structureWatt || 0
                  } kW`
                : '-'}
            </div>

            <div>
              <b>Electrical Item:</b>{' '}
              {calculator.electricalItemName
                ? `${calculator.electricalItemName} - ${
                    calculator.electricalWatt || 0
                  } kW`
                : '-'}
            </div>

            {calculator.hybridType && (
              <div>
                <b>Hybrid Converter:</b>{' '}
                {calculator.hybridType} ({calculator.hybridPhase || '-'})
              </div>
            )}

            {calculator.batteryType && (
              <div>
                <b>Battery:</b>{' '}
                {calculator.batteryType} - {calculator.batteryStrength || '-'}
              </div>
            )}

            {calculator.tataPanelStrengthWatt > 0 && (
              <div>
                <b>Kit:</b> {calculator.tataPanelStrengthWatt} capacity
              </div>
            )}
          </div>
        </div>

        {/* Final Cost */}
        <div className="mt-6 rounded-2xl bg-green-50 p-6 text-center">
          <p className="text-sm font-medium text-green-700">
            Final Offered Cost
          </p>
          <p className="mt-2 text-4xl font-bold text-green-800">
            ₹ {formatCurrency(proposal.finalCost)}
          </p>
        </div>

        {/* Terms */}
        <div className="mt-6 rounded-xl border p-4 text-sm text-gray-700">
          <h2 className="mb-3 font-semibold text-gray-900">Terms & Notes</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>This proposal is based on the selected system configuration.</li>
            <li>Final site feasibility and installation schedule may vary after inspection.</li>
            <li>Government charges, subsidy, and approvals are subject to applicable rules.</li>
            <li>This proposal is valid for 7 days unless stated otherwise.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 md:flex-row print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-blue-600 px-5 py-3 text-white"
          >
            Download / Print PDF
          </button>

          <a
            href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-green-600 px-5 py-3 text-center text-white"
          >
            Send on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
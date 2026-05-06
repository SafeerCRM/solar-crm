'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { getAuthHeaders } from '@/lib/authHeaders';

type EditableProposal = {
  preparedBy: string;
  kindAttn: string;
  customerAddress: string;
  companyIntro: string;
  offerLetter: string;
  subsidyNote: string;
  terms: string;
  paymentTerms: string;
  bankDetails: string;
  closingNote: string;
};

export default function ProposalPage() {
  const { id } = useParams();
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [proposal, setProposal] = useState<any>(null);
  const [editable, setEditable] = useState<EditableProposal | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN').format(Number(value || 0));

  const cleanPhoneForWhatsApp = (phone: string) => {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.length === 10 ? `91${digits}` : digits;
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

  useEffect(() => {
    if (!proposal || editable) return;

    setEditable({
      preparedBy: 'RAJKUMAR JI',
      kindAttn: '',
      customerAddress: proposal.customerCity || '',
      companyIntro:
        'Aditya Solars is working professionally in the solar industry for the last 5 years with 4 MW capacity solar projects in Rajasthan. We have installed more than 870 projects, from big industrial projects to small domestic on-grid projects. We have our own team for installation and also provide maintenance services to our customers.',
      offerLetter:
        'With reference to our discussion and based on the inputs received, we are pleased to submit our most competitive offer for the design, supply, installation, testing and commissioning of an On-Grid Solar Power System. The key objective is to provide an economically viable, efficient and durable electrical energy generation system.',
      subsidyNote:
        'Subsidy depends upon Government Rules. Aditya Solars is responsible for completing the subsidy process after 100% payment. Subsidy file will be submitted on PM Surya Ghar Portal.',
      terms:
        '1. Project offer cost is valid only for the next 10 days. After that, price may vary with time.\n2. During running project, if project is cancelled by customer after purpose signed of company, then 15% of total project cost has to be paid by customer.\n3. Customer cannot change payment conditions of company.\n4. Project completion time period depends upon market conditions and material availability.\n5. Finance facility available.\n6. Payment deposited in company account will be considered in case of legal dispute.\n7. Physical damage is covered only in solar insurance.',
      paymentTerms:
        '1. 20% Advance for Structure.\n2. 70% for Panel & Inverter after Structure completion.\n3. 10% after generation starts within 3 days.',
      bankDetails:
        'Account Holder: ADITYA SOLARS\nBank Name: ICICI\nAccount Number: 687005603181\nIFSC Code: ICIC0006870\nBranch Address: Aerodrome Circle Branch\nGSTIN: 08CVFPM5354P1ZV',
      closingNote: 'Regards,\nADITYA SOLARS',
    });
  }, [proposal, editable]);

  const updateEditable = (key: keyof EditableProposal, value: string) => {
    setEditable((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  if (!proposal || !editable) {
    return <div className="p-6">Loading proposal...</div>;
  }

  const calculator = proposal.calculator || {};

  const projectCapacityKw =
    (Number(calculator.numberOfPanels || 0) *
      Number(calculator.wattPerPanel || 0)) /
    1000;

  const customerName = proposal.customerName || 'Customer';
  const proposalDate = proposal.createdAt
    ? new Date(proposal.createdAt).toLocaleDateString('en-IN')
    : '-';

  const proposalUrl =
    typeof window !== 'undefined' ? window.location.href : '';

  const whatsappPhone = cleanPhoneForWhatsApp(proposal.customerPhone);

  const productItems = [
    {
      title: 'Solar Module',
      tag: 'MONOPERC / Halfcut / Bifacial / TOPCON',
      value:
        calculator.numberOfPanels && calculator.wattPerPanel
          ? `${calculator.numberOfPanels} Panels × ${calculator.wattPerPanel}W`
          : 'As per selected system',
      description:
        'Solar modules with 12 years product warranty and 30 years linear performance warranty.',
      icon: '☀️',
    },
    {
      title: 'Solar Inverter',
      tag: 'On-Grid Converter',
      value: calculator.ongridBrand
        ? `${calculator.ongridBrand} - ${calculator.ongridWatt || 0} kW`
        : 'As per selected converter',
      description:
        '1PH / 3PH solar inverter with 10 years product warranty.',
      icon: '⚡',
    },
    {
      title: 'Mounting Structure',
      tag: 'Galvanized Iron Structure',
      value: calculator.structureType
        ? `${calculator.structureType} - ${calculator.structureWatt || 0} kW`
        : 'As per site requirement',
      description:
        'GI structure with 40×60×2 mm / 40×40×2 mm sections. Rooftop pipes or galvanized C-channel structure as per site.',
      icon: '🏗️',
    },
    {
      title: 'Electrical / BOS',
      tag: 'ACDB + DCDB + Cables',
      value: calculator.electricalItemName || 'As per requirement',
      description:
        'ACDB, DCDB, SPD, reputed brand AC/DC cables, connectors, earthing and required protection system.',
      icon: '🔌',
    },
    {
      title: 'Earthing & Lightning Protection',
      tag: 'Safety Protection',
      value: 'As per requirement',
      description:
        'Earthing rods, copper earthing wire, lightning arrester and safety accessories from reputed brands.',
      icon: '🛡️',
    },
    {
      title: 'Solar Meter & Net Metering',
      tag: 'Metering System',
      value: 'As per DISCOM rules',
      description:
        'Solar energy meter and net metering support subject to local DISCOM approval and government rules.',
      icon: '📟',
    },
  ];

  const handleShare = async () => {
    const title = 'Solar Proposal';
    const text = `Solar Proposal for ${customerName}`;

    try {
      const { Share } = await import('@capacitor/share');

      await Share.share({
        title,
        text,
        url: proposalUrl,
        dialogTitle: 'Share Proposal',
      });

      return;
    } catch (err) {
      console.error('Capacitor share failed:', err);
    }

    if (navigator.share) {
      await navigator.share({ title, text, url: proposalUrl });
      return;
    }

    await navigator.clipboard.writeText(proposalUrl);
    alert('Proposal link copied');
  };

  return (
    <div className="min-h-screen bg-orange-50 p-4 text-slate-900 md:p-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-5xl space-y-6 print:max-w-none">
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow print:hidden md:flex-row">
          <button
            onClick={handleShare}
            className="rounded-xl bg-green-600 px-5 py-3 text-white"
          >
            Share Proposal
          </button>

          <button
            onClick={() => window.print()}
            className="rounded-xl bg-blue-600 px-5 py-3 text-white"
          >
            Print / Save PDF
          </button>

          <button
            onClick={async () => {
              await navigator.clipboard.writeText(proposalUrl);
              alert('Proposal link copied');
            }}
            className="rounded-xl bg-slate-700 px-5 py-3 text-white"
          >
            Copy Proposal Link
          </button>
        </div>

        <ProposalPageShell>
          <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-300 text-white shadow-xl print:rounded-none">
            <div className="grid gap-6 p-8 md:grid-cols-[1.2fr_0.8fr] md:p-10">
              <div>
                <div className="mb-6 inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-semibold">
                  ⭐ ROOFTOP SOLAR PV SYSTEM ⭐
                </div>

                <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                  ADITYA SOLARS
                </h1>

                <p className="mt-3 max-w-2xl text-lg text-white/95">
                  Smart solar solutions for reliable savings, clean energy and
                  long-term performance.
                </p>

                <div className="mt-8 grid gap-3 text-sm md:grid-cols-2">
                  <InfoPill label="Proposal No" value={proposal.proposalNumber} />
                  <InfoPill label="Date" value={proposalDate} />
                  <InfoPill label="Prepared For" value={customerName} />
                  <InfoPill label="System Capacity" value={projectCapacityKw ? `${projectCapacityKw.toFixed(2)} kW` : '-'} />
                </div>
              </div>

              <div className="rounded-3xl bg-white/20 p-6 backdrop-blur">
                <div className="rounded-2xl bg-white p-5 text-slate-900">
                  <p className="text-sm font-semibold text-orange-600">
                    Customer Proposal
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">{customerName}</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Phone: {proposal.customerPhone || '-'}
                  </p>
                  <p className="text-sm text-slate-600">
                    City: {proposal.customerCity || '-'}
                  </p>

                  <div className="mt-5 rounded-2xl bg-green-50 p-4 text-center">
                    <p className="text-sm font-semibold text-green-700">
                      Final Offered Cost
                    </p>
                    <p className="mt-1 text-3xl font-black text-green-800">
                      ₹ {formatCurrency(proposal.finalCost)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <EditableBlock title="Prepared Details">
            <div className="grid gap-4 md:grid-cols-3">
              <TextInput
                label="Prepared By"
                value={editable.preparedBy}
                onChange={(v) => updateEditable('preparedBy', v)}
              />
              <TextInput
                label="Kind Attn."
                value={editable.kindAttn}
                onChange={(v) => updateEditable('kindAttn', v)}
              />
              <TextInput
                label="Customer Address"
                value={editable.customerAddress}
                onChange={(v) => updateEditable('customerAddress', v)}
              />
            </div>
          </EditableBlock>

          <Section title="About Aditya Solars" badge="Company Profile">
            <EditableTextarea
              value={editable.companyIntro}
              onChange={(v) => updateEditable('companyIntro', v)}
            />

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <HighlightCard title="870+" subtitle="Projects Installed" />
              <HighlightCard title="5+" subtitle="Years Experience" />
              <HighlightCard title="4 MW" subtitle="Solar Projects" />
              <HighlightCard title="Rajasthan" subtitle="Service Coverage" />
            </div>
          </Section>

          <Section title="Offer Letter" badge="Supply of Solar On-Grid Power Plant">
            <EditableTextarea
              value={editable.offerLetter}
              onChange={(v) => updateEditable('offerLetter', v)}
            />
          </Section>

          <Section title="System Configuration" badge="Project Items">
            <div className="grid gap-4 md:grid-cols-2">
              {productItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-3xl">
                      {item.icon}
                    </div>

                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
                        {item.tag}
                      </p>
                      <h3 className="text-lg font-bold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {item.value}
                      </p>
                    </div>
                  </div>

                  <textarea
                    value={item.description}
                    readOnly
                    className="mt-4 min-h-[90px] w-full rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-slate-700 outline-none"
                  />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Expected Generation & Benefits" badge="Solar Savings">
            <div className="grid gap-4 md:grid-cols-4">
              <BenefitCard title="1 kW Generation" value="4–5 units/day" />
              <BenefitCard title="Monthly Units" value="100–150 units" />
              <BenefitCard title="Yearly Units" value="Approx. 1400 units/kW" />
              <BenefitCard title="Finance" value="Facility Available" />
            </div>
          </Section>

          <Section title="Commercial Offer" badge="Customer Safe Summary">
            <div className="rounded-3xl bg-gradient-to-r from-green-600 to-emerald-500 p-6 text-center text-white">
              <p className="text-sm font-semibold uppercase tracking-wide">
                Final Offered Project Cost
              </p>
              <p className="mt-2 text-4xl font-black">
                ₹ {formatCurrency(proposal.finalCost)}
              </p>
              <p className="mt-3 text-sm text-white/90">
                Price is based on selected system configuration and site
                feasibility.
              </p>
            </div>

            <div className="mt-5">
              <EditableTextarea
                value={editable.subsidyNote}
                onChange={(v) => updateEditable('subsidyNote', v)}
              />
            </div>
          </Section>

          <Section title="Terms & Conditions" badge="Company Policy">
            <EditableTextarea
              value={editable.terms}
              onChange={(v) => updateEditable('terms', v)}
              rows={8}
            />
          </Section>

          <Section title="Payment Terms" badge="Payment Schedule">
            <EditableTextarea
              value={editable.paymentTerms}
              onChange={(v) => updateEditable('paymentTerms', v)}
            />
          </Section>

          <Section title="Bank Details" badge="Company Account">
            <EditableTextarea
              value={editable.bankDetails}
              onChange={(v) => updateEditable('bankDetails', v)}
              rows={7}
            />
          </Section>

          <section className="rounded-3xl bg-slate-900 p-8 text-white">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="text-2xl font-black">Thank You</h2>
                <EditableTextarea
                  value={editable.closingNote}
                  onChange={(v) => updateEditable('closingNote', v)}
                  className="mt-4 border-white/20 bg-white/10 text-white"
                />
              </div>

              <div className="text-sm text-white/80 md:text-right">
                <p className="text-lg font-bold text-white">ADITYA SOLARS</p>
                <p>Email: adityasolar2112@gmail.com</p>
                <p>Email: rajkumarmeena10680@gmail.com</p>
                <p>Phone: 8306170662, 9887634474</p>
                <p>Phone: 8233406788, 7014908486</p>
              </div>
            </div>
          </section>
        </ProposalPageShell>
      </div>
    </div>
  );
}

function ProposalPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="space-y-6 rounded-3xl bg-white p-4 shadow-xl md:p-6 print:rounded-none print:p-0 print:shadow-none">
      {children}
    </main>
  );
}

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm print:break-inside-avoid">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-black text-slate-900">{title}</h2>
        <span className="rounded-full bg-orange-100 px-4 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
          {badge}
        </span>
      </div>
      {children}
    </section>
  );
}

function EditableBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-amber-50 p-5 print:break-inside-avoid">
      <h2 className="mb-4 text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-orange-200 bg-white p-3 text-sm outline-none focus:border-orange-500"
      />
    </div>
  );
}

function EditableTextarea({
  value,
  onChange,
  rows = 5,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-slate-700 outline-none focus:border-orange-500 print:border-none print:bg-white ${className}`}
    />
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/20 p-4">
      <p className="text-xs uppercase tracking-wide text-white/80">{label}</p>
      <p className="mt-1 font-bold text-white">{value}</p>
    </div>
  );
}

function HighlightCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-100 to-yellow-50 p-4 text-center">
      <p className="text-2xl font-black text-orange-700">{title}</p>
      <p className="mt-1 text-xs font-semibold text-slate-600">{subtitle}</p>
    </div>
  );
}

function BenefitCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-center">
      <p className="text-sm font-semibold text-green-700">{title}</p>
      <p className="mt-2 text-lg font-black text-green-900">{value}</p>
    </div>
  );
}
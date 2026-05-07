'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { getAuthHeaders } from '@/lib/authHeaders';

type ProductItem = {
  id: string;
  name: string;
  image: string;
  description: string;
  remarks: string;
};

type EditableProposal = {
  preparedBy: string;
  customerAddress: string;
  companyIntro: string;
  subsidyNote: string;
  terms: string;
  paymentTerms: string;
  bankDetails: string;
  closingNote: string;
  products: ProductItem[];
};

const img = (name: string) => `/proposal-assets/${name}`;

export default function ProposalPage() {
  const { id } = useParams();
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const proposalRef = useRef<HTMLDivElement | null>(null);

  const [proposal, setProposal] = useState<any>(null);
  const [editable, setEditable] = useState<EditableProposal | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN').format(Number(value || 0));

  useEffect(() => {
    document.title = 'Aditya Solars Proposal';
  }, []);

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
      customerAddress: proposal.customerCity || '',
      companyIntro:
        'Aditya Solar is working most professionally in Solar Industry from last 5 years with 10 MW Capacity solar project in Rajasthan. We are one of the largest organizations with highest growth rate in last Five years. We have installed more than 3000 projects. We have installed big industry projects to small domestic on grid projects. We have our team for Installation of Projects. We also provide Maintenance services to our customer.',
      subsidyNote:
        'Subsidy depends upon Government Rules. Aditya Solars will assist in PM Surya Ghar subsidy process after payment completion.',
      terms:
        '• Project Offer Cost Only For Next 10 Days After Price May Vary With Time.\n\n• During Running Project If Project Cancelled By Customer After Purpose Signed of Company Then 15% of Total Project Cost Has to Pay By Customer.\n\n• Customer Can’t Change Payment Conditions of Company.\n\n• Company Project Completion Time Period Depends Upon marketing Conditions or on Material Availability.\n\n• Finance Facility Available.\n\n• Payment in Company Account Deposited will be considered in case of Legal Dispute.\n\n• Physical damage covered only in solar insurance.\n\n• Only electronic transfers or deposits made directly into the official bank account of Aditya Solars will be acknowledged.',
      paymentTerms:
        '1. 20% Advance for Structure.\n2. 70% + For Panel & Inverter After Structure completed.\n3. 10% After Generation Start Within 3 days.',
      bankDetails:
        'Account Holder Name: ADITYA SOLARS\nBank Name: ICICI BANK\nAccount Number: 687005603181\nIFSC Code: ICIC0006870\nAddress: Aerodrome Circle Branch\nGSTIN: 08CVFPM5354P1ZV',
      closingNote:
        'Thanks & Regards\nADITYA SOLARS\nRajkumar Meena - 8306170662',
      products: [
        {
          id: '1',
          name: 'Solar Module Monoperc Halfcut Bifacial',
          image: img('solar-module.jpg'),
          description:
            'MONOPERC / Halfcut / Bifacial / TOPCON Solar Modules with 12 years product warranty and 30 years performance warranty.',
          remarks: 'As per selected system',
        },
        {
          id: '2',
          name: 'Solar Inverter',
          image: img('solar-inverter.jpg'),
          description:
            '1PH / 3PH On-Grid Inverter with product warranty. Brand and capacity as per selected system configuration.',
          remarks: 'As per capacity',
        },
        {
          id: '3',
          name: 'Module Mounting Structure',
          image: img('gi-structure.jpg'),
          description:
            'Galvanized Iron Structure 40×60×2 mm / 40×40×2 mm. Rooftop pipes in galvanized C-channel structure.',
          remarks: 'Site specific',
        },
        {
          id: '4',
          name: 'ACDB + DCDB',
          image: img('acdb-dcdb.jpg'),
          description:
            'AC Distribution Box and DC Distribution Box with protection system and surge protection devices.',
          remarks: 'Included',
        },
        {
          id: '5',
          name: 'Earthing Wire',
          image: img('earthing-wire.jpg'),
          description: 'Copper 40 sq mm earthing wire. Maximum length 90 m.',
          remarks: 'Included',
        },
        {
          id: '6',
          name: 'DC Cable and AC Cable',
          image: img('dc-ac-cable.jpg'),
          description:
            'Reputed brand DC and AC cable such as Havells / Polycab / KEI as per project requirement.',
          remarks: 'Included',
        },
        {
          id: '7',
          name: 'AC Cable',
          image: img('ac-cable.jpg'),
          description:
            '4 sqmm / 6 sqmm AC cable from reputed brand. Maximum length as per site requirement.',
          remarks: 'Included',
        },
        {
          id: '8',
          name: 'Earthing Rods',
          image: img('earthing-rods.jpg'),
          description: '1 meter Truepower / reputed brand earthing rods.',
          remarks: 'Included',
        },
        {
          id: '9',
          name: 'Lightning Arrester',
          image: img('lightning-arrester.jpg'),
          description:
            'Copper lightning arrester with required accessories for safety protection.',
          remarks: 'Included',
        },
        {
          id: '10',
          name: 'Solar Meter',
          image: img('solar-meter.jpg'),
          description: 'Avon / HPL solar meter with warranty as per DISCOM rules.',
          remarks: 'As per DISCOM',
        },
        {
          id: '11',
          name: 'Civil Foundation',
          image: img('civil-foundation.jpg'),
          description:
            '8 inch cement concrete civil foundation for RCC / ground mounted system, wherever required.',
          remarks: 'If required',
        },
        {
          id: '12',
          name: 'DC Connectors',
          image: img('dc-connectors.jpg'),
          description: 'MC4 type reputed brand DC connectors for string connection.',
          remarks: 'Included',
        },
        {
          id: '13',
          name: 'Anchor Fasteners',
          image: img('anchor-fasteners.jpg'),
          description: 'Heavy wedge anchor fasteners for RCC mounting and structure fixing.',
          remarks: 'Included',
        },
      ],
    });
  }, [proposal, editable]);

  if (!proposal || !editable) {
    return <div className="p-6">Loading Proposal...</div>;
  }

  const calculator = proposal.calculator || {};
  const projectCapacityKw =
    (Number(calculator.numberOfPanels || 0) * Number(calculator.wattPerPanel || 0)) /
    1000;

  const proposalDate = proposal.createdAt
    ? new Date(proposal.createdAt).toLocaleDateString('en-IN')
    : '-';

  const updateField = (field: keyof EditableProposal, value: string) => {
    setEditable((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateProduct = (id: string, field: keyof ProductItem, value: string) => {
    setEditable((prev) =>
      prev
        ? {
            ...prev,
            products: prev.products.map((item) =>
              item.id === id ? { ...item, [field]: value } : item,
            ),
          }
        : prev,
    );
  };

  const generatePdf = async (shareAfterGenerate = false) => {
    if (!proposalRef.current) return;

    setGeneratingPdf(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const target = proposalRef.current;

const canvas = await html2canvas(target, {
  scale: 2,
  useCORS: true,
  allowTaint: true,
  backgroundColor: '#ffffff',
  ignoreElements: (element) => {
    return element.classList?.contains('no-pdf');
  },
  onclone: (clonedDoc) => {
    const clonedTarget = clonedDoc.querySelector('[data-pdf-root="true"]') as HTMLElement | null;

    if (clonedTarget) {
      clonedTarget.style.backgroundColor = '#ffffff';
      clonedTarget.style.color = '#111827';
    }

    clonedDoc.querySelectorAll('*').forEach((el) => {
      const node = el as HTMLElement;

      node.style.boxShadow = 'none';
      node.style.textShadow = 'none';

      const color = window.getComputedStyle(node).color;
      const backgroundColor = window.getComputedStyle(node).backgroundColor;
      const borderColor = window.getComputedStyle(node).borderColor;

      if (color.includes('lab') || color.includes('oklch')) {
        node.style.color = '#111827';
      }

      if (backgroundColor.includes('lab') || backgroundColor.includes('oklch')) {
        node.style.backgroundColor = '#ffffff';
      }

      if (borderColor.includes('lab') || borderColor.includes('oklch')) {
        node.style.borderColor = '#f97316';
      }
    });
  },
});

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Aditya-Solars-Proposal-${proposal.customerName || id}.pdf`;

      if (!shareAfterGenerate) {
        pdf.save(fileName);
        return;
      }

      const base64 = pdf.output('datauristring').split(',')[1];

      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
        });

        await Share.share({
          title: 'Aditya Solars Proposal',
          text: `Solar Proposal for ${proposal.customerName || 'Customer'}`,
          url: savedFile.uri,
          dialogTitle: 'Share Proposal PDF',
        });
      } catch (nativeErr) {
        console.error(nativeErr);
        pdf.save(fileName);
        alert('PDF downloaded. Share it from your device downloads/files.');
      }
    } catch (err) {
      console.error(err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff3e3] p-4 print:bg-white print:p-0">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 8mm;
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          textarea,
          input {
            border: none !important;
            background: transparent !important;
            resize: none !important;
            overflow: visible !important;
          }
        }
      `}</style>

      <div className="no-print mx-auto mb-5 flex max-w-6xl flex-wrap gap-3 rounded-xl bg-white p-4 shadow">
        <button
          onClick={() => generatePdf(false)}
          disabled={generatingPdf}
          className="rounded-lg bg-[#ff7a00] px-5 py-3 font-semibold text-white disabled:opacity-60"
        >
          {generatingPdf ? 'Generating PDF...' : 'Download Exact PDF'}
        </button>

        <button
          onClick={() => generatePdf(true)}
          disabled={generatingPdf}
          className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white disabled:opacity-60"
        >
          Share PDF
        </button>

        <button
          onClick={() => window.print()}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white"
        >
          Browser Print
        </button>
      </div>

      <div
  ref={proposalRef}
  data-pdf-root="true"
  className="mx-auto max-w-[210mm] bg-white p-7 shadow-2xl print:shadow-none"
>
        <div className="border-2 border-[#ff7a00]">
          <div className="bg-[#ff7a00] px-5 py-4 text-white">
            <div className="grid grid-cols-[1fr_230px] items-center gap-4">
              <div>
                <p className="text-sm font-bold tracking-[0.25em]">
                  ⭐ ROOFTOP SOLAR PV SYSTEM ⭐
                </p>
                <h1 className="mt-2 text-4xl font-black">ADITYA SOLARS</h1>
                <p className="mt-1 text-sm font-semibold">
                  Professional Solar Proposal Document
                </p>
              </div>

              <div className="flex justify-end">
                <img
                  src={img('aditya-logo.jpg')}
                  className="h-24 w-[220px] bg-white object-contain p-2"
                  alt="Aditya Solars Logo"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 border-b border-orange-300 p-5">
            <table className="w-full border-collapse text-sm">
              <tbody>
                <InfoRow label="Proposal No" value={proposal.proposalNumber || String(id)} />
                <InfoRow label="Date" value={proposalDate} />
                <InfoRow label="Prepared For" value={proposal.customerName || '-'} />
                <EditableRow
                  label="Prepared By"
                  value={editable.preparedBy}
                  onChange={(v) => updateField('preparedBy', v)}
                />
              </tbody>
            </table>

            <img
              src={img('on-grid-system.jpg')}
              className="h-[210px] w-full border border-orange-300 object-contain p-2"
              alt="On Grid System"
            />
          </div>

          <DocSection title="Customer Details">
            <table className="w-full border-collapse text-sm">
              <tbody>
                <InfoRow label="Customer Name" value={proposal.customerName || '-'} />
                <InfoRow label="Phone" value={proposal.customerPhone || '-'} />
                <EditableRow
                  label="Address"
                  value={editable.customerAddress}
                  onChange={(v) => updateField('customerAddress', v)}
                />
                <InfoRow
                  label="System Capacity"
                  value={projectCapacityKw ? `${projectCapacityKw.toFixed(2)} kW` : '-'}
                />
              </tbody>
            </table>
          </DocSection>

          <DocSection title="Company Profile">
            <EditableTextarea
              value={editable.companyIntro}
              rows={6}
              onChange={(v) => updateField('companyIntro', v)}
            />

            <div className="mt-4 grid grid-cols-4 gap-3 text-center">
              <StatBox value="3000+" label="Projects" />
              <StatBox value="5+" label="Years" />
              <StatBox value="10 MW" label="Capacity" />
              <StatBox value="35+" label="Branches" />
            </div>
          </DocSection>

          <DocSection title="Office & Rajasthan Presence">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <h3 className="mb-2 bg-[#ffb000] px-3 py-2 text-center font-black text-slate-900">
                  Head Office
                </h3>
                <img
                  src={img('head-office.jpg')}
                  className="h-[390px] w-full border border-orange-300 object-contain p-2"
                  alt="Head Office"
                />
              </div>

              <div>
                <h3 className="mb-2 bg-[#ffb000] px-3 py-2 text-center font-black text-slate-900">
                  Rajasthan Branches
                </h3>
                <img
                  src={img('rajasthan-branches.jpg')}
                  className="h-[390px] w-full border border-orange-300 object-contain p-2"
                  alt="Rajasthan Branches"
                />
              </div>
            </div>
          </DocSection>

          <DocSection title="System Configuration">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#ffb000] text-slate-900">
                  <th className="border border-orange-500 px-2 py-2">S.No</th>
                  <th className="border border-orange-500 px-2 py-2">Item Name</th>
                  <th className="border border-orange-500 px-2 py-2">Photo</th>
                  <th className="border border-orange-500 px-2 py-2">
                    Description / Specification
                  </th>
                  <th className="border border-orange-500 px-2 py-2">Remarks</th>
                </tr>
              </thead>

              <tbody>
                {editable.products.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-orange-300 px-2 py-3 text-center font-bold">
                      {index + 1}
                    </td>

                    <td className="border border-orange-300 px-2 py-3 font-bold">
                      {item.name}
                    </td>

                    <td className="border border-orange-300 px-2 py-3">
                      <img
                        src={item.image}
                        className="mx-auto h-[105px] w-[135px] object-contain"
                        alt={item.name}
                      />
                    </td>

                    <td className="border border-orange-300 p-2">
                      <EditableTextarea
                        value={item.description}
                        rows={5}
                        small
                        onChange={(v) => updateProduct(item.id, 'description', v)}
                      />
                    </td>

                    <td className="border border-orange-300 p-2">
                      <EditableTextarea
                        value={item.remarks}
                        rows={4}
                        small
                        onChange={(v) => updateProduct(item.id, 'remarks', v)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DocSection>

          <DocSection title="Commercial Offer">
            <div className="border border-green-500 bg-green-50 p-5 text-center">
              <p className="text-sm font-bold uppercase text-green-700">
                Final Offered Project Cost
              </p>
              <p className="mt-2 text-4xl font-black text-green-800">
                ₹ {formatCurrency(proposal.finalCost)}
              </p>
              <p className="mt-2 text-sm font-semibold text-green-700">
                Customer-safe final pricing only
              </p>
            </div>

            <div className="mt-4">
              <EditableTextarea
                value={editable.subsidyNote}
                rows={4}
                onChange={(v) => updateField('subsidyNote', v)}
              />
            </div>
          </DocSection>

          <DocSection title="Terms & Conditions">
            <EditableTextarea
              value={editable.terms}
              rows={12}
              onChange={(v) => updateField('terms', v)}
            />
          </DocSection>

          <div className="grid grid-cols-2 gap-5 border-t border-orange-300 p-5">
            <div>
              <SectionHeading title="Payment Terms" />
              <EditableTextarea
                value={editable.paymentTerms}
                rows={8}
                onChange={(v) => updateField('paymentTerms', v)}
              />
            </div>

            <div>
              <SectionHeading title="Bank Details" />
              <EditableTextarea
                value={editable.bankDetails}
                rows={8}
                onChange={(v) => updateField('bankDetails', v)}
              />
            </div>
          </div>

          <DocSection title="Signature / Closing">
            <div className="grid grid-cols-2 gap-5">
              <EditableTextarea
                value={editable.closingNote}
                rows={7}
                onChange={(v) => updateField('closingNote', v)}
              />

              <div className="flex flex-col justify-end border border-orange-300 p-5 text-center">
                <p className="text-xl font-black text-slate-900">ADITYA SOLARS</p>
                <p className="mt-8 border-t border-slate-500 pt-2 font-semibold">
                  Authorized Signature
                </p>
              </div>
            </div>
          </DocSection>

          <div className="bg-[#ff7a00] px-6 py-4 text-center text-sm font-semibold text-white">
            ADITYA SOLARS | adityasolar2112@gmail.com | 8306170662, 9887634474
          </div>
        </div>
      </div>
    </div>
  );
}

function DocSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-orange-300 p-5">
      <SectionHeading title={title} />
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="border-l-8 border-[#ff7a00] bg-[#fff0dd] px-4 py-3">
      <h2 className="text-xl font-black text-[#d94d00]">{title}</h2>
    </div>
  );
}

function EditableTextarea({
  value,
  onChange,
  rows,
  small = false,
}: {
  value: string;
  onChange: (v: string) => void;
  rows: number;
  small?: boolean;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full resize-none overflow-hidden border border-orange-200 bg-[#fffaf3] p-3 outline-none ${
        small ? 'text-xs leading-5' : 'text-sm leading-7'
      }`}
    />
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="border border-orange-300 bg-[#fff0dd] px-3 py-3 font-bold">
        {label}
      </td>
      <td className="border border-orange-300 px-3 py-3">{value}</td>
    </tr>
  );
}

function EditableRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <tr>
      <td className="border border-orange-300 bg-[#fff0dd] px-3 py-3 font-bold">
        {label}
      </td>
      <td className="border border-orange-300 px-3 py-3">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent outline-none"
        />
      </td>
    </tr>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-orange-300 bg-[#fff0dd] p-3">
      <p className="text-2xl font-black text-[#d94d00]">{value}</p>
      <p className="text-xs font-semibold text-slate-700">{label}</p>
    </div>
  );
}
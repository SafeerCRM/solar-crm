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
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const pdfGenerationLockRef = useRef(false);

  const [proposal, setProposal] = useState<any>(null);
  const [editable, setEditable] = useState<EditableProposal | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    document.title = 'Aditya Solars Proposal';
  }, []);

  useEffect(() => {
    const fetchProposal = async () => {
      const res = await axios.get(`${backendUrl}/proposals/${id}`, {
        headers: getAuthHeaders(),
      });
      setProposal(res.data);
    };

    if (id) fetchProposal().catch(console.error);
  }, [id, backendUrl]);

  useEffect(() => {
    if (!proposal || editable) return;

    const calculator = proposal.calculator || {};

    setEditable({
      preparedBy: 'RAJKUMAR JI',
      customerAddress: proposal.customerCity || '',
      companyIntro:
        'Aditya Solar is working most professionally in Solar Industry from last 5 years with 10 MW Capacity solar project in Rajasthan. We are one of the largest organizations with highest growth rate in last Five years. We have installed more than 3000 projects. We have installed big industry projects to small domestic on grid projects. We have our team for Installation of Projects. We also provide Maintenance services to our customer.',
      subsidyNote:
        'Subsidy depends upon Government Rules. Aditya Solars will assist in PM Surya Ghar subsidy process after payment completion.',
      terms:
        '• Project Offer Cost Only For Next 10 Days After Price May Vary With Time.\n\n• During Running Project If Project Cancelled By Customer After Purpose Signed of Company Then 15% of Total Project Cost Has to Pay By Customer.\n\n• Customer Can’t Change Payment Conditions of Company.\n\n• Company Project Completion Time Period Depends Upon marketing Conditions or on Material Availability.\n\n• Finance Facility Available.\n\n• Payment in Company Account Deposited will be considered in case of Legal Dispute.\n\n• Physical damage covered only in solar insurance.',
      paymentTerms:
        '1. 20% Advance for Structure.\n2. 70% + For Panel & Inverter After Structure completed.\n3. 10% After Generation Start Within 3 days.',
      bankDetails:
        'Account Holder Name: ADITYA SOLARS\nBank Name: ICICI BANK\nAccount Number: 687005603181\nIFSC Code: ICIC0006870\nAddress: Aerodrome Circle Branch\nGSTIN: 08CVFPM5354P1ZV',
      closingNote:
        'Thanks & Regards\nADITYA SOLARS\nRajkumar Meena - 8306170662',
      products: [
        [
  'Solar Module Monoperc Halfcut Bifacial',
  'solar-module.jpg',
  'MONOPERC / Halfcut / Bifacial / TOPCON Solar Modules with 12 years product warranty and 30 years performance warranty.',
  [
  calculator.panelCategory ? `Category: ${calculator.panelCategory}` : '',
  calculator.panelType ? `Type: ${calculator.panelType}` : '',
  calculator.panelDisplayName
    ? `Panel: ${calculator.panelDisplayName}`
    : Number(calculator.wattPerPanel || 0) > 0
      ? `Panel: ${calculator.wattPerPanel}W`
      : '',
  Number(calculator.numberOfPanels || 0) > 0
    ? `Panels: ${calculator.numberOfPanels}`
    : '',
].filter(Boolean).join('\n') || 'As per selected system'
],
[
  calculator.converterType === 'HYBRID'
    ? 'Hybrid Solar Inverter'
    : 'Solar Inverter',

  calculator.converterType === 'HYBRID'
    ? 'hybrid-inverter.jpg'
    : 'solar-inverter.jpg',

  calculator.converterType === 'HYBRID'
    ? 'Hybrid solar inverter suitable for solar generation with battery integration and backup support. Brand, phase and capacity are shown as per the selected calculator configuration.'
    : '1PH / 3PH On-Grid Inverter with product warranty and 10 years replacement warranty. Brand and capacity as per selected system configuration.',

  calculator.converterType === 'HYBRID'
    ? [
        calculator.hybridPhase
          ? `Phase: ${calculator.hybridPhase}`
          : '',

        calculator.hybridDisplayName
          ? `Inverter: ${calculator.hybridDisplayName}`
          : calculator.hybridBrand
            ? `Inverter: ${calculator.hybridBrand}`
            : '',

        Number(calculator.hybridCapacityKw || 0) > 0
          ? `Capacity: ${calculator.hybridCapacityKw} kW`
          : '',

        Number(calculator.hybridQuantity || 0) > 0
          ? `Qty: ${calculator.hybridQuantity}`
          : '',
      ]
        .filter(Boolean)
        .join('\n') || 'As per selected hybrid system'
    : [
        calculator.ongridPhase
          ? `Phase: ${calculator.ongridPhase}`
          : '',

        calculator.ongridDisplayName
          ? `Inverter: ${calculator.ongridDisplayName}`
          : calculator.ongridBrand
            ? `Inverter: ${calculator.ongridBrand}`
            : '',

        Number(calculator.ongridQuantity || 0) > 0
          ? `Qty: ${calculator.ongridQuantity}`
          : '',
      ]
        .filter(Boolean)
        .join('\n') || 'As per capacity',
],
        [
  'Module Mounting Structure',
  'gi-structure.jpg',
  'Galvanized Iron Structure 40×60×2 mm / 40×40×2 mm. Rooftop pipes in galvanized C-channel structure.',

  [
    calculator.structureType
      ? `Type: ${calculator.structureType}`
      : '',

    Number(calculator.structureCapacityKw || 0) > 0
      ? `Capacity: ${calculator.structureCapacityKw} kW`
      : '',

    Number(calculator.structureQuantity || 0) > 0
      ? `Qty: ${calculator.structureQuantity}`
      : '',
  ]
    .filter(Boolean)
    .join('\n') || 'Site specific',
],
        ['ACDB + DCDB', 'acdb-dcdb.jpg', 'AC Distribution Box and DC Distribution Box with protection system and surge protection devices.', 'Included'],
        ['Earthing Wire', 'earthing-wire.jpg', 'Copper 4 sq mm earthing wire. Maximum length 90 m.', 'Included'],
        ['DC Cable and AC Cable', 'dc-ac-cable.jpg', 'Reputed brand DC and AC cable such as Havells / Polycab / KEI as per project requirement.', 'Included'],
        ['AC Cable', 'ac-cable.jpg', '4 sqmm / 6 sqmm AC cable from reputed brand. Maximum length as per site requirement.', 'Included'],
        ['Earthing Rods', 'earthing-rods.jpg', '1 meter Truepower / reputed brand earthing rods.', 'Included'],
        ['Lightning Arrester', 'lightning-arrester.jpg', 'Copper lightning arrester with required accessories for safety protection.', 'Included'],
        ['Solar Meter', 'solar-meter.jpg', 'Avon / HPL solar meter with warranty as per DISCOM rules.', 'As per DISCOM'],
        ['Civil Foundation', 'civil-foundation.jpg', '8 inch cement concrete civil foundation for RCC / ground mounted system, wherever required.', 'If required'],
        ['DC Connectors', 'dc-connectors.jpg', 'MC4 type reputed brand DC connectors for string connection.', 'Included'],
        ['Anchor Fasteners', 'anchor-fasteners.jpg', 'Heavy wedge anchor fasteners for RCC mounting and structure fixing.', 'Included'],
      ].map((p, i) => ({
        id: String(i + 1),
        name: p[0],
        image: img(p[1]),
        description: p[2],
        remarks: p[3],
      })),
    });
  }, [proposal, editable]);

  if (!proposal || !editable) return <div className="p-6">Loading Proposal...</div>;

  const calculator = proposal.calculator || {};
  const capacity =
    (Number(calculator.numberOfPanels || 0) * Number(calculator.wattPerPanel || 0)) / 1000;

  const proposalDate = proposal.createdAt
    ? new Date(proposal.createdAt).toLocaleDateString('en-IN')
    : '-';

  const finalCost = new Intl.NumberFormat('en-IN').format(Number(proposal.finalCost || 0));

  const updateField = (field: keyof EditableProposal, value: string) => {
    setEditable((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateProduct = (id: string, field: keyof ProductItem, value: string) => {
    setEditable((prev) =>
      prev
        ? {
            ...prev,
            products: prev.products.map((p) =>
              p.id === id ? { ...p, [field]: value } : p,
            ),
          }
        : prev,
    );
  };

  const generatePdf = async (share = false) => {
  if (!pdfRef.current) return;

  // Prevent multiple PDF jobs from rapid or repeated taps.
  if (pdfGenerationLockRef.current) return;

  pdfGenerationLockRef.current = true;
  setGeneratingPdf(true);

  try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = Array.from(pdfRef.current.querySelectorAll('.pdf-page')) as HTMLElement[];

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
  scale: 2,
  useCORS: true,
  allowTaint: true,
  backgroundColor: '#ffffff',
  logging: false,
  onclone: (doc) => {
    const style = doc.createElement('style');
    style.innerHTML = `
      * {
        color: #111827 !important;
        border-color: #f97316 !important;
        box-shadow: none !important;
        text-shadow: none !important;
      }

      .pdf-page {
        background: #ffffff !important;
      }

      .pdf-orange {
        background: #ff7900 !important;
        color: #ffffff !important;
      }

      .pdf-light-orange {
        background: #fff0dc !important;
      }

      .pdf-soft {
        background: #fffaf3 !important;
      }

      .pdf-green {
        background: #ecfdf5 !important;
        border-color: #16a34a !important;
      }
    `;
    doc.head.appendChild(style);
  },
});

        const data = canvas.toDataURL('image/jpeg', 0.96);
        if (i > 0) pdf.addPage();
        pdf.addImage(data, 'JPEG', 0, 0, 210, 297);
      }

      const fileName = `Aditya-Solars-Proposal-${
  proposal.customerPhone || id
}.pdf`;

      if (!share) {
        pdf.save(fileName);
        return;
      }

      const base64 = pdf.output('datauristring').split(',')[1];

      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        const saved = await Filesystem.writeFile({
  path: fileName,
  data: base64,
  directory: Directory.Documents,
  recursive: true,
});

if (share) {
  await Share.share({
    title: 'Aditya Solars Proposal',
    text: `Solar Proposal for ${proposal.customerName || 'Customer'}`,
    url: saved.uri,
    dialogTitle: 'Share Proposal PDF',
  });
} else {
  const { FileOpener } = await import('@capacitor-community/file-opener');

  await FileOpener.open({
    filePath: saved.uri,
    contentType: 'application/pdf',
  });
}
      } catch {
        pdf.save(fileName);
      }
        } finally {
      pdfGenerationLockRef.current = false;
      setGeneratingPdf(false);
    }
  };

  const productPages = [
    editable.products.slice(0, 4),
    editable.products.slice(4, 8),
    editable.products.slice(8, 13),
  ];

  return (
    <div className="min-h-screen bg-[#fff3e4] p-4">
      <div className="sticky top-2 z-20 mx-auto mb-4 flex max-w-5xl flex-wrap gap-2 rounded-xl bg-white p-3 shadow">
        <button
  type="button"
  disabled={generatingPdf}
  onClick={() => generatePdf(false)}
  className="rounded-lg bg-[#ff7900] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
>
  {generatingPdf ? 'Generating PDF...' : 'Download Exact PDF'}
</button>

<button
  type="button"
  disabled={generatingPdf}
  onClick={() => generatePdf(true)}
  className="rounded-lg bg-green-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
>
  {generatingPdf ? 'Please wait...' : 'Share PDF'}
</button>
      </div>

      <div className="mx-auto max-w-5xl space-y-4">
        <EditBox title="Company Profile">
          <textarea value={editable.companyIntro} onChange={(e) => updateField('companyIntro', e.target.value)} className="edit-area" rows={5} />
        </EditBox>

        <EditBox title="Terms & Conditions">
          <textarea value={editable.terms} onChange={(e) => updateField('terms', e.target.value)} className="edit-area" rows={9} />
        </EditBox>

        <EditBox title="Product Details">
          {editable.products.map((p) => (
            <div key={p.id} className="mb-4 rounded border bg-white p-3">
              <p className="font-bold">{p.id}. {p.name}</p>
              <textarea value={p.description} onChange={(e) => updateProduct(p.id, 'description', e.target.value)} className="edit-area mt-2" rows={3} />
              <textarea value={p.remarks} onChange={(e) => updateProduct(p.id, 'remarks', e.target.value)} className="edit-area mt-2" rows={2} />
            </div>
          ))}
        </EditBox>
      </div>

      <div
  ref={pdfRef}
  style={{
    position: 'fixed',
    left: '-10000px',
    top: '0px',
    width: '794px',
    background: '#ffffff',
    pointerEvents: 'none',
  }}
>
        <PdfPage>
          <PdfHeader />
          <div className="grid grid-cols-2 gap-16">
            <table className="doc-table">
              <tbody>
                <Row label="Proposal No" value={proposal.proposalNumber || String(id)} />
                <Row label="Date" value={proposalDate} />
                <Row label="Prepared For" value={proposal.customerName || '-'} />
                <Row label="Prepared By" value={editable.preparedBy} />
              </tbody>
            </table>
            <img src={img('on-grid-system.jpg')} className="h-[180px] w-full object-contain" />
          </div>

          <Section title="Customer Details" />
          <table className="doc-table">
            <tbody>
              <Row label="Customer Name" value={proposal.customerName || '-'} />
              <Row label="Phone" value={proposal.customerPhone || '-'} />
              <Row label="Address" value={editable.customerAddress || '-'} />
              <Row label="System Capacity" value={capacity ? `${capacity.toFixed(2)} kW` : '-'} />
            </tbody>
          </table>

          <Section title="Company Profile" />
          <p className="text-block">{editable.companyIntro}</p>

          <div className="mt-5 grid grid-cols-4 gap-3">
            <Stat value="3000+" label="Projects" />
            <Stat value="5+" label="Years" />
            <Stat value="10 MW" label="Capacity" />
            <Stat value="35+" label="Branches" />
          </div>
        </PdfPage>

        <PdfPage>
          <Section title="Office & Rajasthan Presence" />
          <div className="grid grid-cols-2 gap-5">
            <ImageCard title="Head Office" src={img('head-office.jpg')} tall />
            <ImageCard title="Rajasthan Branches" src={img('rajasthan-branches.jpg')} tall />
          </div>

          <Section title="System Configuration Summary" />
          <p className="text-block">
            Price includes design, supply, installation, testing and commissioning of the selected solar power plant configuration and site requirement.
          </p>
        </PdfPage>

        {productPages.map((items, pageIndex) => (
          <PdfPage key={pageIndex}>
            <Section title={`System Configuration - Items ${pageIndex + 1}`} />
            <div className="space-y-4">
              {items.map((p) => (
                <div key={p.id} className="grid grid-cols-[45px_150px_135px_1fr_100px] gap-0 border border-[#e98225] text-[12px]">
                  <div className="flex items-center justify-center border-r border-[#e98225] font-bold">{p.id}</div>
                  <div className="border-r border-[#e98225] p-2 font-bold">{p.name}</div>
                  <div className="border-r border-[#e98225] p-2">
                    <img src={p.image} className="h-[95px] w-full object-contain" />
                  </div>
                  <div className="whitespace-pre-wrap border-r border-[#e98225] p-2 leading-5">{p.description}</div>
                  <div className="whitespace-pre-wrap p-2 leading-5">{p.remarks}</div>
                </div>
              ))}
            </div>
          </PdfPage>
        ))}

        <PdfPage>
          <Section title="Commercial Offer" />
          <div className="pdf-green border-2 border-[#ff7900] p-8 text-center">
            <p className="text-xl font-bold uppercase">Final Offered Project Cost</p>
            <p className="mt-4 text-5xl font-black">₹ {finalCost}</p>
            <p className="text-lg font-semibold text-orange-700 mt-2">
  + DISCOM EXPENDITURE
</p>
            <p className="mt-2 text-lg">Customer-safe final pricing only</p>
          </div>

          <p className="text-block mt-6">{editable.subsidyNote}</p>

          <Section title="Terms & Conditions" />
          <div className="text-block whitespace-pre-wrap">{editable.terms}</div>
        </PdfPage>

        <PdfPage>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Section title="Payment Terms" />
              <div className="text-block whitespace-pre-wrap">{editable.paymentTerms}</div>
            </div>
            <div>
              <Section title="Bank Details" />
              <div className="text-block whitespace-pre-wrap">{editable.bankDetails}</div>
            </div>
          </div>

          <Section title="Signature / Closing" />
          <div className="grid grid-cols-2 gap-6">
            <div className="text-block whitespace-pre-wrap">{editable.closingNote}</div>
            <div className="flex h-[210px] flex-col justify-end border-2 border-[#e98225] p-6 text-center">
              <p className="text-3xl font-black">ADITYA SOLARS</p>
              <p className="mt-10 border-t pt-3 text-lg font-semibold">Authorized Signature</p>
            </div>
          </div>

          <div className="mt-10 bg-[#ff7900] p-4 text-center text-lg font-bold text-white">
            ADITYA SOLARS | adityasolarsraj01@gmail.com | 8306170662, 9887634474
          </div>
        </PdfPage>
      </div>

      <style jsx global>{`
        .edit-area {
          width: 100%;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 10px;
          background: white;
          outline: none;
        }
        .pdf-page {
          width: 794px;
          height: 1123px;
          background: white;
          padding: 48px;
          overflow: hidden;
          font-family: Arial, sans-serif;
          color: #111827;
          border: 8px solid #ff7900;
        }
        .doc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 15px;
        }
        .doc-table td {
          border: 1.5px solid #e98225;
          padding: 12px;
        }
        .doc-table td:first-child {
          background: #fff0dc;
          font-weight: 700;
          width: 38%;
        }
        .text-block {
          border: 1.5px solid #e98225;
          background: #fffaf3;
          padding: 16px;
          font-size: 14px;
          line-height: 1.65;
        }
      `}</style>
    </div>
  );
}

function EditBox({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl bg-white p-4 shadow"><h2 className="mb-3 text-lg font-bold">{title}</h2>{children}</div>;
}

function PdfPage({ children }: { children: React.ReactNode }) {
  return <div className="pdf-page">{children}</div>;
}

function PdfHeader() {
  return (
    <div className="mb-8 overflow-hidden border-4 border-[#ff7900] bg-white">
  <img
    src={img('aditya-logo.jpg')}
    alt="Aditya Solars"
    className="w-full object-cover"
  />
</div>
  );
}

function Section({ title }: { title: string }) {
  return (
    <div className="my-5 border-l-[10px] border-[#ff7900] pdf-light-orange bg-[#fff0dc] px-4 py-3">
      <h2 className="text-2xl font-black text-[#d94d00]">{title}</h2>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <tr><td>{label}</td><td>{value}</td></tr>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-2 border-[#e98225] pdf-light-orange bg-[#fff0dc] p-4 text-center">
      <p className="text-3xl font-black text-[#d94d00]">{value}</p>
      <p className="text-sm font-bold">{label}</p>
    </div>
  );
}

function ImageCard({ title, src, tall = false }: { title: string; src: string; tall?: boolean }) {
  return (
    <div>
      <h3 className="bg-[#ffb000] p-3 text-center text-xl font-black">{title}</h3>
      <div className="border-2 border-[#e98225] p-3">
        <img src={src} className={`${tall ? 'h-[650px]' : 'h-[260px]'} w-full object-contain`} />
      </div>
    </div>
  );
}
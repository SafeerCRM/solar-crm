'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function EpcCustomerInvoicePage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  const headers = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadInvoice = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE_URL}/project/${projectId}/epc-customer-invoice`,
        { headers: headers() },
      );

      setInvoice(res.data?.invoice || null);
      setItems(res.data?.items || []);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to load EPC invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) loadInvoice();
  }, [projectId]);

  const updateInvoice = (field: string, value: string) => {
    setInvoice((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItems(updated);
  };

  const openPdf = async () => {
  if (!invoice?.id) return;

  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/epc-customer-invoice/${invoice.id}/pdf`,
      {
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    const blob = new Blob([res.data], { type: 'application/pdf' });
    const fileName = `${invoice.invoiceNumber || `EPC-INVOICE-${invoice.id}`}.pdf`;

    const isNative =
      typeof window !== 'undefined' &&
      !!(window as any).Capacitor?.isNativePlatform?.();

    if (isNative) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { FileOpener } = await import('@capacitor-community/file-opener');

      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64 = String(reader.result || '').split(',')[1];

        const saved = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Documents,
          recursive: true,
        });

        await FileOpener.open({
          filePath: saved.uri,
          contentType: 'application/pdf',
        });
      };

      reader.readAsDataURL(blob);
      return;
    }

    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');

    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 60_000);
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to open PDF');
  }
};

  const saveInvoice = async () => {
    if (!invoice?.id) return;

    try {
      setSaving(true);

      const res = await axios.patch(
        `${API_BASE_URL}/project/epc-customer-invoice/${invoice.id}`,
        {
          ...invoice,
          items,
        },
        { headers: headers() },
      );

      setInvoice(res.data?.invoice || null);
      setItems(res.data?.items || []);

      alert('EPC invoice saved');
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const liveTotals = items.reduce(
  (acc, item) => {
    const quantity = Number(item.quantity || 0);
    const rate = Number(item.rate || 0);
    const gstPercent = Number(item.gstPercent || 0);

    const taxable = quantity * rate;
    const gstAmount = (taxable * gstPercent) / 100;

    acc.taxableAmount += taxable;
    acc.cgstAmount += gstAmount / 2;
    acc.sgstAmount += gstAmount / 2;
    acc.totalTaxAmount += gstAmount;
    acc.grandTotalBeforeRound += taxable + gstAmount;

    return acc;
  },
  {
    taxableAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    totalTaxAmount: 0,
    grandTotalBeforeRound: 0,
  },
);

const roundedGrandTotal = Math.round(liveTotals.grandTotalBeforeRound);
const liveRoundOff =
  roundedGrandTotal - liveTotals.grandTotalBeforeRound;

  if (loading) {
    return <div className="p-5">Loading EPC Invoice...</div>;
  }

  if (!invoice) {
    return <div className="p-5">Invoice not found.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4">
      <div className="rounded-2xl bg-white p-5 shadow">
        <Link
          href={`/project/${projectId}`}
          className="text-sm font-semibold text-blue-600"
        >
          ← Back to Project
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-gray-800">
          EPC Customer Tax Invoice
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Editable EPC customer tax invoice draft.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <h2 className="text-lg font-bold text-gray-800">
    Invoice Details
  </h2>

  <div className="mt-4 grid gap-3 md:grid-cols-3">
    <input
      value={invoice.invoiceNumber || ''}
      onChange={(e) => updateInvoice('invoiceNumber', e.target.value)}
      placeholder="Invoice Number"
      className="rounded-xl border p-3"
    />

    <input
      type="date"
      value={invoice.invoiceDate || ''}
      onChange={(e) => updateInvoice('invoiceDate', e.target.value)}
      className="rounded-xl border p-3"
    />

    <input
      value={invoice.deliveryNote || ''}
      onChange={(e) => updateInvoice('deliveryNote', e.target.value)}
      placeholder="Delivery Note"
      className="rounded-xl border p-3"
    />

    <input
      value={invoice.buyerOrderNo || ''}
      onChange={(e) => updateInvoice('buyerOrderNo', e.target.value)}
      placeholder="Buyer's Order No."
      className="rounded-xl border p-3"
    />

    <input
      value={invoice.dispatchThrough || ''}
      onChange={(e) => updateInvoice('dispatchThrough', e.target.value)}
      placeholder="Dispatch Through"
      className="rounded-xl border p-3"
    />

    <input
      value={invoice.termsOfDelivery || ''}
      onChange={(e) => updateInvoice('termsOfDelivery', e.target.value)}
      placeholder="Terms of Delivery"
      className="rounded-xl border p-3"
    />

    <input
      value={invoice.placeOfSupply || ''}
      onChange={(e) => updateInvoice('placeOfSupply', e.target.value)}
      placeholder="Place of Supply"
      className="rounded-xl border p-3"
    />

    <input
      value={invoice.stateCode || ''}
      onChange={(e) => updateInvoice('stateCode', e.target.value)}
      placeholder="State Code"
      className="rounded-xl border p-3"
    />

    <input
      value={invoice.ewayBillNumber || ''}
      onChange={(e) => updateInvoice('ewayBillNumber', e.target.value)}
      placeholder="E-Way Bill No."
      className="rounded-xl border p-3"
    />
  </div>
</div>

      <div className="grid gap-5 md:grid-cols-3">
  <div className="rounded-2xl bg-white p-5 shadow">
    <h2 className="text-lg font-bold text-gray-800">From</h2>

    <div className="mt-4 space-y-3">
      <input
        value={invoice.fromName || ''}
        onChange={(e) => updateInvoice('fromName', e.target.value)}
        placeholder="Company Name"
        className="w-full rounded-xl border p-3"
      />

      <input
        value={invoice.fromGstin || ''}
        onChange={(e) => updateInvoice('fromGstin', e.target.value)}
        placeholder="GSTIN"
        className="w-full rounded-xl border p-3"
      />

      <input
        value={invoice.fromPhone || ''}
        onChange={(e) => updateInvoice('fromPhone', e.target.value)}
        placeholder="Phone"
        className="w-full rounded-xl border p-3"
      />

      <input
        value={invoice.fromEmail || ''}
        onChange={(e) => updateInvoice('fromEmail', e.target.value)}
        placeholder="Email"
        className="w-full rounded-xl border p-3"
      />

      <textarea
        value={invoice.fromAddress || ''}
        onChange={(e) => updateInvoice('fromAddress', e.target.value)}
        placeholder="Company Address"
        rows={4}
        className="w-full rounded-xl border p-3"
      />
    </div>
  </div>
        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">Bill To</h2>

          <div className="mt-4 space-y-3">
            <input
              value={invoice.billToName || ''}
              onChange={(e) => updateInvoice('billToName', e.target.value)}
              placeholder="Bill To Name"
              className="w-full rounded-xl border p-3"
            />

            <input
              value={invoice.billToPhone || ''}
              onChange={(e) => updateInvoice('billToPhone', e.target.value)}
              placeholder="Bill To Phone"
              className="w-full rounded-xl border p-3"
            />

            <textarea
              value={invoice.billToAddress || ''}
              onChange={(e) => updateInvoice('billToAddress', e.target.value)}
              placeholder="Bill To Address"
              rows={4}
              className="w-full rounded-xl border p-3"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-gray-800">Ship To</h2>

          <div className="mt-4 space-y-3">
            <input
              value={invoice.shipToName || ''}
              onChange={(e) => updateInvoice('shipToName', e.target.value)}
              placeholder="Ship To Name"
              className="w-full rounded-xl border p-3"
            />

            <input
              value={invoice.shipToPhone || ''}
              onChange={(e) => updateInvoice('shipToPhone', e.target.value)}
              placeholder="Ship To Phone"
              className="w-full rounded-xl border p-3"
            />

            <textarea
              value={invoice.shipToAddress || ''}
              onChange={(e) => updateInvoice('shipToAddress', e.target.value)}
              placeholder="Ship To Address"
              rows={4}
              className="w-full rounded-xl border p-3"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex items-center justify-between gap-3">
    <h2 className="text-lg font-bold text-gray-800">
      Invoice Items
    </h2>

    <button
      type="button"
      onClick={() =>
        setItems([
          ...items,
          {
            serialNumber: items.length + 1,
            description: '',
            hsnSac: '',
            quantity: 1,
            unit: 'Units',
            rate: 0,
            gstPercent: 0,
          },
        ])
      }
      className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
    >
      + Add Item
    </button>
  </div>

  <div className="mt-4 overflow-x-auto">
    <table className="min-w-[1150px] table-fixed border-collapse text-sm">
      <colgroup>
        <col className="w-[55px]" />
        <col className="w-[360px]" />
        <col className="w-[95px]" />
        <col className="w-[75px]" />
        <col className="w-[90px]" />
        <col className="w-[115px]" />
        <col className="w-[80px]" />
        <col className="w-[120px]" />
        <col className="w-[120px]" />
        <col className="w-[130px]" />
        <col className="w-[80px]" />
      </colgroup>

      <thead>
        <tr className="bg-gray-100">
          <th className="border p-2 text-left">Sr</th>
          <th className="border p-2 text-left">Description</th>
          <th className="border p-2 text-left">HSN/SAC</th>
          <th className="border p-2 text-right">Qty</th>
          <th className="border p-2 text-left">Unit</th>
          <th className="border p-2 text-right">Rate</th>
          <th className="border p-2 text-right">GST %</th>
          <th className="border p-2 text-right">Taxable</th>
          <th className="border p-2 text-right">GST Amt</th>
          <th className="border p-2 text-right">Total</th>
          <th className="border p-2 text-center">Action</th>
        </tr>
      </thead>

      <tbody>
        {items.map((item, index) => {
          const quantity = Number(item.quantity || 0);
          const rate = Number(item.rate || 0);
          const gstPercent = Number(item.gstPercent || 0);
          const taxable = quantity * rate;
          const gstAmount = (taxable * gstPercent) / 100;
          const total = taxable + gstAmount;

          return (
            <tr key={item.id || index} className="align-top">
              <td className="border p-2">
                <input
                  value={item.serialNumber || index + 1}
                  onChange={(e) =>
                    updateItem(index, 'serialNumber', e.target.value)
                  }
                  className="w-full rounded border p-2 text-sm"
                />
              </td>

              <td className="border p-2">
                <textarea
                  value={item.description || ''}
                  onChange={(e) =>
                    updateItem(index, 'description', e.target.value)
                  }
                  rows={4}
                  className="w-full resize-y rounded border p-2 text-sm leading-5"
                />
              </td>

              <td className="border p-2">
                <input
                  value={item.hsnSac || ''}
                  onChange={(e) =>
                    updateItem(index, 'hsnSac', e.target.value)
                  }
                  className="w-full rounded border p-2 text-sm"
                />
              </td>

              <td className="border p-2">
                <input
                  type="number"
                  value={item.quantity || ''}
                  onChange={(e) =>
                    updateItem(index, 'quantity', e.target.value)
                  }
                  className="w-full rounded border p-2 text-right text-sm"
                />
              </td>

              <td className="border p-2">
                <input
                  value={item.unit || ''}
                  onChange={(e) =>
                    updateItem(index, 'unit', e.target.value)
                  }
                  className="w-full rounded border p-2 text-sm"
                />
              </td>

              <td className="border p-2">
                <input
                  type="number"
                  value={item.rate || ''}
                  onChange={(e) =>
                    updateItem(index, 'rate', e.target.value)
                  }
                  className="w-full rounded border p-2 text-right text-sm"
                />
              </td>

              <td className="border p-2">
                <input
                  type="number"
                  value={item.gstPercent || ''}
                  onChange={(e) =>
                    updateItem(index, 'gstPercent', e.target.value)
                  }
                  className="w-full rounded border p-2 text-right text-sm"
                />
              </td>

              <td className="border p-2 text-right font-semibold">
                ₹{taxable.toLocaleString('en-IN')}
              </td>

              <td className="border p-2 text-right font-semibold">
                ₹{gstAmount.toLocaleString('en-IN')}
              </td>

              <td className="border p-2 text-right font-bold">
                ₹{total.toLocaleString('en-IN')}
              </td>

              <td className="border p-2 text-center">
                <button
                  type="button"
                  onClick={() =>
                    setItems(items.filter((_, rowIndex) => rowIndex !== index))
                  }
                  className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white"
                >
                  Delete
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>

      <div className="rounded-2xl bg-white p-5 shadow">

  <h2 className="text-lg font-bold text-gray-800">
    Tax Summary
  </h2>

  <div className="mt-5 flex justify-end">

    <div className="w-full max-w-md overflow-hidden rounded-xl border">

      <div className="flex justify-between border-b p-3">
        <span>Taxable Amount</span>
        <span className="font-semibold">
          ₹{liveTotals.taxableAmount.toLocaleString('en-IN')}
        </span>
      </div>

      <div className="flex justify-between border-b p-3">
        <span>CGST</span>
        <span className="font-semibold">
          ₹{liveTotals.cgstAmount.toLocaleString('en-IN')}
        </span>
      </div>

      <div className="flex justify-between border-b p-3">
        <span>SGST</span>
        <span className="font-semibold">
          ₹{liveTotals.sgstAmount.toLocaleString('en-IN')}
        </span>
      </div>

      <div className="flex justify-between border-b p-3">
        <span>Round Off</span>
        <span className="font-semibold">
          ₹{liveRoundOff.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between bg-green-50 p-4 text-lg font-bold text-green-700">
        <span>Grand Total</span>
        <span>
          ₹{roundedGrandTotal.toLocaleString('en-IN')}
        </span>
      </div>

    </div>

  </div>

  <div className="mt-6 rounded-xl border bg-gray-50 p-4">

    <p className="text-xs font-semibold uppercase text-gray-500">
      Amount in Words
    </p>

    <p className="mt-2 text-base font-semibold text-gray-800">
      {numberToWordsIndian(roundedGrandTotal)}
    </p>

  </div>

</div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <h2 className="text-lg font-bold text-gray-800">
    Bank Details, Terms & Signature
  </h2>

  <div className="mt-4 grid gap-3 md:grid-cols-2">
    <textarea
      value={invoice.bankDetails || ''}
      onChange={(e) => updateInvoice('bankDetails', e.target.value)}
      rows={5}
      placeholder="Bank Details"
      className="w-full rounded-xl border p-3"
    />

    <textarea
      value={invoice.termsAndConditions || ''}
      onChange={(e) =>
        updateInvoice('termsAndConditions', e.target.value)
      }
      rows={5}
      placeholder="Terms & Conditions"
      className="w-full rounded-xl border p-3"
    />

    <textarea
      value={invoice.declaration || ''}
      onChange={(e) => updateInvoice('declaration', e.target.value)}
      rows={4}
      placeholder="Declaration"
      className="w-full rounded-xl border p-3"
    />

    <div className="grid gap-3">
      <input
        value={invoice.sealUrl || ''}
        onChange={(e) => updateInvoice('sealUrl', e.target.value)}
        placeholder="Seal Image URL"
        className="rounded-xl border p-3"
      />

      <input
        value={invoice.signatureUrl || ''}
        onChange={(e) => updateInvoice('signatureUrl', e.target.value)}
        placeholder="Signature Image URL"
        className="rounded-xl border p-3"
      />
    </div>
  </div>
</div>

      <div className="sticky bottom-3 rounded-2xl bg-white p-4 shadow">
  <div className="flex flex-wrap gap-3">
    <button
      onClick={saveInvoice}
      disabled={saving}
      className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
    >
      {saving ? 'Saving...' : 'Save Draft'}
    </button>

    <button
      type="button"
      onClick={openPdf}
      className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white"
    >
      Open PDF
    </button>
  </div>
</div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-bold">
        ₹{Number(value || 0).toLocaleString('en-IN')}
      </p>
    </div>
  );
}

function numberToWordsIndian(amount: number) {
  if (!amount) return 'Zero Rupees Only';

  const formatter = new Intl.NumberFormat('en-IN');

  return `${formatter.format(Math.round(amount))} Rupees Only`;
}
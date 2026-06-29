'use client';

type VendorItem = {
  id: number;
  vendorName: string;
};

type Props = {
  documentType: string;
  setDocumentType: (value: string) => void;
  vendorId: string;
  setVendorId: (value: string) => void;
  vendorSearch: string;
  setVendorSearch: (value: string) => void;
  vendors: VendorItem[];
  material: string;
  setMaterial: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
};

export default function ProcurementFilterBar({
  documentType,
  setDocumentType,
  vendorId,
  setVendorId,
  vendorSearch,
  setVendorSearch,
  vendors,
  material,
  setMaterial,
  status,
  setStatus,
  onApply,
  onReset,
}: Props) {
  const filteredVendors = vendors.filter((vendor) =>
    String(vendor.vendorName || '')
      .toLowerCase()
      .includes(vendorSearch.toLowerCase()),
  );

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="text-xl font-bold text-gray-800">
        Procurement Document Filters
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="PO">Purchase Orders</option>
          <option value="PI">Proforma Invoices</option>
          <option value="INVOICE">Final Invoices</option>
        </select>

        <div>
          <input
            placeholder="Search vendor..."
            value={vendorSearch}
            onChange={(e) => setVendorSearch(e.target.value)}
            className="w-full rounded-xl border p-3"
          />

          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="mt-2 w-full rounded-xl border p-3"
          >
            <option value="">All Vendors</option>

            {filteredVendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.vendorName}
              </option>
            ))}
          </select>
        </div>

        <input
          placeholder="Material name"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          className="rounded-xl border p-3"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <button
          type="button"
          onClick={onApply}
          className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white"
        >
          Apply Filters
        </button>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-3 rounded-xl bg-gray-700 px-4 py-2 text-sm font-bold text-white"
      >
        Reset Filters
      </button>
    </div>
  );
}
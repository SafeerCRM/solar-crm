'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type PurchaseItem = {
  id: number;
  projectId: number;
  materialName: string;
  category?: string;
  unit?: string;
  brand?: string;
  rate?: number;
  quantity?: number;
  purchasedQuantity?: number;
  pendingQuantity?: number;
  totalAmount?: number;
  purchaseStatus?: string;
  projectCustomerName?: string;
projectBranchName?: string;
projectOwnerId?: number;
projectOwnerName?: string;
projectOwnerRole?: string;
projectCity?: string;
projectZone?: string;
  createdAt?: string;
    materialId?: number;
  gstPercent?: number;
};

type ProjectOwner = {
  projectOwnerId: number;
  projectOwnerName?: string;
  projectOwnerRole?: string;
};

type VendorItem = {
  id: number;
  vendorName: string;
  isActive?: boolean;
};

type GeneratedPurchaseOrder = {
  id: number;
  poNumber?: string;
  vendorName?: string;
  projectId?: number;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
};

type GeneratedPurchaseOrderItem = {
  id: number;
  materialName?: string;
  category?: string;
  brand?: string;
  unit?: string;
  purchaseRate?: number;
  gstPercent?: number;
  quantity?: number;
  subtotalAmount?: number;
  gstAmount?: number;
  totalAmount?: number;
};

type ProformaInvoice = {
  id: number;
  invoiceNumber?: string;
  projectId?: number;
  subtotalAmount?: number;
  discountAmount?: number;
  gstAmount?: number;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
};

type ProformaInvoiceItem = {
  id: number;
  itemName?: string;
  category?: string;
  brand?: string;
  unit?: string;
  sellingRate?: number;
  gstPercent?: number;
  quantity?: number;
  discountAmount?: number;
  subtotalAmount?: number;
  gstAmount?: number;
  totalAmount?: number;
};

type FinalInvoice = {
  id: number;
  invoiceNumber?: string;
  projectId?: number;
  subtotalAmount?: number;
  discountAmount?: number;
  gstAmount?: number;
  totalAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
  status?: string;
  createdAt?: string;
};

type FinalInvoiceItem = {
  id: number;
  itemName?: string;
  category?: string;
  brand?: string;
  unit?: string;
  finalRate?: number;
  gstPercent?: number;
  quantity?: number;
  discountAmount?: number;
  subtotalAmount?: number;
  gstAmount?: number;
  totalAmount?: number;
};

export default function PurchaseOrdersPage() {
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [buyQty, setBuyQty] = useState<Record<number, string>>({});
  const [projectFilter, setProjectFilter] = useState('');
const [materialFilter, setMaterialFilter] = useState('');
const [statusFilter, setStatusFilter] = useState('');
const [branchFilter, setBranchFilter] = useState('');
const [ownerFilter, setOwnerFilter] = useState('');
const [projectOwners, setProjectOwners] = useState<ProjectOwner[]>([]);
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

const [vendors, setVendors] = useState<VendorItem[]>([]);
const [selectedVendorId, setSelectedVendorId] = useState('');
const [selectedItemIds, setSelectedItemIds] = useState<Record<number, boolean>>({});
const [generatingPo, setGeneratingPo] = useState(false);
const [generatedPos, setGeneratedPos] = useState<
  GeneratedPurchaseOrder[]
>([]);
const [selectedPo, setSelectedPo] =
  useState<any>(null);

const [poDetailLoading, setPoDetailLoading] =
  useState(false);

const [showPoModal, setShowPoModal] =
  useState(false);

  const [selectedPi, setSelectedPi] =
  useState<any>(null);

const [piDetailLoading, setPiDetailLoading] =
  useState(false);

const [showPiModal, setShowPiModal] =
  useState(false);

  const [generatedPis, setGeneratedPis] = useState<ProformaInvoice[]>([]);
const [piDiscount, setPiDiscount] = useState<Record<number, string>>({});
const [generatingPi, setGeneratingPi] = useState(false);

const [selectedFinalInvoice, setSelectedFinalInvoice] =
  useState<any>(null);

const [finalInvoiceDetailLoading, setFinalInvoiceDetailLoading] =
  useState(false);

const [showFinalInvoiceModal, setShowFinalInvoiceModal] =
  useState(false);

const [creatingFinalInvoiceId, setCreatingFinalInvoiceId] =
  useState<number | null>(null);

  const [finalInvoices, setFinalInvoices] =
  useState<FinalInvoice[]>([]);

const [summary, setSummary] = useState({
  totalPendingItems: 0,
  totalPendingQuantity: 0,
  totalPendingAmount: 0,
  partiallyPurchasedCount: 0,
});

  const fetchPurchaseOrders = async () => {
  try {
    setLoading(true);

    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/purchase-orders`,
      {
        params: {
          page,
          limit: 20,
          search: `${projectFilter} ${materialFilter}`.trim(),
          status: statusFilter,
          branch: branchFilter,
          owner: ownerFilter,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setItems(res.data?.data || []);

    setSummary(
      res.data?.summary || {
        totalPendingItems: 0,
        totalPendingQuantity: 0,
        totalPendingAmount: 0,
        partiallyPurchasedCount: 0,
      },
    );

    setTotalPages(res.data?.totalPages || 1);
  } catch (error) {
    console.error(error);
    alert('Failed to load purchase orders');
  } finally {
    setLoading(false);
  }
};

const fetchProjectOwners = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/owners/list`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setProjectOwners(res.data || []);
  } catch (error) {
    console.error('Failed to load project owners:', error);
  }
};

const fetchVendors = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/vendor`,
      {
        params: {
          activeOnly: true,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setVendors(res.data || []);
  } catch (error) {
    console.error('Failed to load vendors:', error);
  }
};

const fetchGeneratedPos = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/generated-purchase-orders`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setGeneratedPos(res.data?.data || []);
  } catch (error) {
    console.error(
      'Failed to load generated POs:',
      error,
    );
  }
};

const fetchGeneratedPis = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/proforma-invoices`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setGeneratedPis(res.data?.data || []);
  } catch (error) {
    console.error('Failed to load proforma invoices:', error);
  }
};

const fetchFinalInvoices = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/final-invoices`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setFinalInvoices(res.data?.data || []);
  } catch (error) {
    console.error('Failed to load final invoices:', error);
  }
};

const fetchPoDetail = async (id: number) => {
  try {
    setPoDetailLoading(true);

    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/purchase-order/${id}`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setSelectedPo(res.data);

    setShowPoModal(true);
  } catch (error) {
    console.error(error);

    alert('Failed to load PO detail');
  } finally {
    setPoDetailLoading(false);
  }
};

const fetchPiDetail = async (id: number) => {
  try {
    setPiDetailLoading(true);

    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/proforma-invoice/${id}`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setSelectedPi(res.data);
    setShowPiModal(true);
  } catch (error) {
    console.error(error);
    alert('Failed to load PI detail');
  } finally {
    setPiDetailLoading(false);
  }
};

const fetchFinalInvoiceDetail = async (id: number) => {
  try {
    setFinalInvoiceDetailLoading(true);

    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/final-invoice/${id}`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setSelectedFinalInvoice(res.data);

    setShowFinalInvoiceModal(true);
  } catch (error) {
    console.error(error);

    alert('Failed to load final invoice');
  } finally {
    setFinalInvoiceDetailLoading(false);
  }
};

const createFinalInvoiceFromPi = async (piId: number) => {
  const confirmed = window.confirm(
    'Create final invoice from this proforma invoice?',
  );

  if (!confirmed) return;

  try {
    setCreatingFinalInvoiceId(piId);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/proforma-invoice/${piId}/final-invoice`,
      {},
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Final invoice created successfully');
    fetchFinalInvoices();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to create final invoice',
    );
  } finally {
    setCreatingFinalInvoiceId(null);
  }
};

const downloadFinalInvoicePdf = async (
  invoiceId: number,
  share = false,
) => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/final-invoice/${invoiceId}/pdf`,
      {
        responseType: 'blob',
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    const blob = new Blob([res.data], {
      type: 'application/pdf',
    });

    const fileName = `final-invoice-${invoiceId}.pdf`;

    const jsPDF = (await import('jspdf')).default;

    const pdf = new jsPDF();

    const arrayBuffer = await blob.arrayBuffer();

    const uint8Array = new Uint8Array(arrayBuffer);

    const binaryString = uint8Array.reduce(
      (data, byte) =>
        data + String.fromCharCode(byte),
      '',
    );

    const base64 =
      btoa(binaryString);

    try {
      const { Filesystem, Directory } =
        await import(
          '@capacitor/filesystem'
        );

      const { Share } =
        await import(
          '@capacitor/share'
        );

      const saved =
        await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory:
            Directory.Documents,
          recursive: true,
        });

      if (share) {
        await Share.share({
          title: 'Final Invoice',
          text: `Final Invoice #${invoiceId}`,
          url: saved.uri,
          dialogTitle:
            'Share Final Invoice PDF',
        });

        return;
      }

      window.open(saved.uri, '_blank');
      return;
    } catch {
      const url =
        window.URL.createObjectURL(
          blob,
        );

      const link =
        document.createElement('a');

      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url,
      );
    }
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to download final invoice PDF',
    );
  }
};

const downloadProformaInvoicePdf = async (
  piId: number,
  share = false,
) => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/proforma-invoice/${piId}/pdf`,
      {
        responseType: 'blob',
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    const blob = new Blob([res.data], {
      type: 'application/pdf',
    });

    const fileName = `proforma-invoice-${piId}.pdf`;

    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const binaryString = uint8Array.reduce(
      (data, byte) => data + String.fromCharCode(byte),
      '',
    );

    const base64 = btoa(binaryString);

    try {
      const { Filesystem, Directory } = await import(
        '@capacitor/filesystem'
      );

      const { Share } = await import('@capacitor/share');

      const saved = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });

      if (share) {
        await Share.share({
          title: 'Proforma Invoice',
          text: `Proforma Invoice #${piId}`,
          url: saved.uri,
          dialogTitle: 'Share Proforma Invoice PDF',
        });

        return;
      }

      window.open(saved.uri, '_blank');
      return;
    } catch {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    }
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to download proforma invoice PDF',
    );
  }
};

const downloadPurchaseOrderPdf = async (
  poId: number,
  share = false,
) => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/purchase-order/${poId}/pdf`,
      {
        responseType: 'blob',
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    const blob = new Blob([res.data], {
      type: 'application/pdf',
    });

    const fileName = `purchase-order-${poId}.pdf`;

    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const binaryString = uint8Array.reduce(
      (data, byte) => data + String.fromCharCode(byte),
      '',
    );

    const base64 = btoa(binaryString);

    try {
      const { Filesystem, Directory } = await import(
        '@capacitor/filesystem'
      );

      const { Share } = await import('@capacitor/share');

      const saved = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });

      if (share) {
        await Share.share({
          title: 'Purchase Order',
          text: `Purchase Order #${poId}`,
          url: saved.uri,
          dialogTitle: 'Share Purchase Order PDF',
        });

        return;
      }

      window.open(saved.uri, '_blank');
      return;
    } catch {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    }
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to download purchase order PDF',
    );
  }
};

const hidePurchaseOrder = async (poId: number) => {
  const reason = window.prompt(
    'Why do you want to hide this PO?',
    'Test entry',
  );

  if (reason === null) return;

  const confirmed = window.confirm(
    'This PO and its linked ledger entry will be hidden. Continue?',
  );

  if (!confirmed) return;

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/purchase-order/${poId}/hide`,
      {
        reason,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Purchase order hidden successfully');

    fetchGeneratedPos();
    fetchFinalInvoices();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to hide purchase order',
    );
  }
};

  useEffect(() => {
  fetchPurchaseOrders();
}, [page, projectFilter, materialFilter, statusFilter, branchFilter, ownerFilter]);

useEffect(() => {
  fetchProjectOwners();
  fetchVendors();
  fetchGeneratedPos();
  fetchGeneratedPis();
  fetchFinalInvoices();
}, []);

  const filteredItems = items;

const getCategoryPendingSummary = (keyword: string) => {
  const matchedItems = filteredItems.filter((item) =>
    String(item.category || item.materialName || '')
      .toLowerCase()
      .includes(keyword.toLowerCase()),
  );

  const pendingQuantity = matchedItems.reduce(
    (sum, item) => sum + Number(item.pendingQuantity || 0),
    0,
  );

  const pendingAmount = matchedItems.reduce(
    (sum, item) =>
      sum +
      Number(item.pendingQuantity || 0) *
        Number(item.rate || 0),
    0,
  );

  return {
    pendingQuantity,
    pendingAmount,
  };
};

const panelSummary = getCategoryPendingSummary('panel');
const structureSummary = getCategoryPendingSummary('structure');
const inverterSummary = getCategoryPendingSummary('inverter');

const projectWiseSummary = Object.values(
  filteredItems.reduce((acc: any, item) => {
    const key = String(item.projectId);

    if (!acc[key]) {
      acc[key] = {
        projectId: item.projectId,
        customerName: item.projectCustomerName || '-',
        branchName: item.projectBranchName || '-',
        city: item.projectCity || '-',
        pendingItems: 0,
        pendingQuantity: 0,
        pendingAmount: 0,
        materials: [] as string[],
      };
    }

    acc[key].pendingItems += 1;

    acc[key].pendingQuantity += Number(
      item.pendingQuantity || 0,
    );

    acc[key].pendingAmount +=
      Number(item.pendingQuantity || 0) *
      Number(item.rate || 0);

    if (item.materialName) {
      acc[key].materials.push(item.materialName);
    }

    return acc;
  }, {}),
);

const totalPendingItems = filteredItems.length;

const totalPendingQuantity = filteredItems.reduce(
  (sum, item) => sum + Number(item.pendingQuantity || 0),
  0,
);

const totalPendingAmount = filteredItems.reduce(
  (sum, item) =>
    sum +
    Number(item.pendingQuantity || 0) *
      Number(item.rate || 0),
  0,
);

const partiallyPurchasedCount =
  filteredItems.filter(
    (item) =>
      item.purchaseStatus === 'PARTIALLY_PURCHASED',
  ).length;

  const selectedItems = filteredItems.filter(
  (item) => selectedItemIds[item.id],
);

const selectedProjectIds = Array.from(
  new Set(selectedItems.map((item) => item.projectId)),
);

const canGeneratePo =
  selectedItems.length > 0 &&
  selectedVendorId &&
  selectedProjectIds.length === 1;

  const buyItem = async (item: PurchaseItem, fullBuy = false) => {
    const quantity = fullBuy
      ? Number(item.pendingQuantity || 0)
      : Number(buyQty[item.id] || 0);

    if (!quantity || quantity <= 0) {
      alert('Enter valid buy quantity');
      return;
    }

    if (quantity > Number(item.pendingQuantity || 0)) {
      alert('Buy quantity cannot be more than pending quantity');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      await axios.patch(
        `${API_BASE_URL}/project/material-request-item/${item.id}/buy`,
        { quantity },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      alert('Material marked as purchased');

      setBuyQty({
        ...buyQty,
        [item.id]: '',
      });

      fetchPurchaseOrders();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to update purchase');
    }
  };

  const getSellingRateForItem = (item: PurchaseItem) => {
  const baseRate = Number(item.rate || 0);
  const gstPercent = Number(item.gstPercent || 0);

  return baseRate + (baseRate * gstPercent) / 100;
};

  const generatePurchaseOrder = async () => {
  if (!selectedVendorId) {
    alert('Please select vendor');
    return;
  }

  if (!selectedItems.length) {
    alert('Please select at least one item');
    return;
  }

  if (selectedProjectIds.length !== 1) {
    alert('Please select items from only one project for one PO');
    return;
  }

  const confirmed = window.confirm(
    'Generate purchase order snapshot for selected items?',
  );

  if (!confirmed) return;

  try {
    setGeneratingPo(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/purchase-order`,
      {
        projectId: selectedProjectIds[0],
        vendorId: Number(selectedVendorId),
        items: selectedItems.map((item) => ({
          materialRequestItemId: item.id,
          materialId: item.materialId || null,
          materialName: item.materialName,
          category: item.category || '',
          brand: item.brand || '',
          unit: item.unit || '',
          purchaseRate: Number(item.rate || 0),
          gstPercent: Number(item.gstPercent || 0),
          quantity: Number(item.pendingQuantity || 0),
          remarks: '',
        })),
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Purchase order generated successfully');

    setSelectedItemIds({});
    setSelectedVendorId('');

    fetchPurchaseOrders();
    fetchGeneratedPos();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to generate purchase order',
    );
  } finally {
    setGeneratingPo(false);
  }
};

const generateProformaInvoice = async () => {
  if (!selectedItems.length) {
    alert('Please select at least one item');
    return;
  }

  if (selectedProjectIds.length !== 1) {
    alert('Please select items from only one project for one PI');
    return;
  }

  const confirmed = window.confirm(
    'Generate proforma invoice snapshot for selected items?',
  );

  if (!confirmed) return;

  try {
    setGeneratingPi(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/proforma-invoice`,
      {
        projectId: selectedProjectIds[0],
        items: selectedItems.map((item) => ({
          materialId: item.materialId || null,
          itemName: item.materialName,
          category: item.category || '',
          brand: item.brand || '',
          unit: item.unit || '',
          sellingRate: getSellingRateForItem(item),
          gstPercent: Number(item.gstPercent || 0),
          quantity: Number(item.pendingQuantity || 0),
          discountAmount: Number(piDiscount[item.id] || 0),
          remarks: '',
        })),
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Proforma invoice generated successfully');

    setSelectedItemIds({});
    setPiDiscount({});

    fetchGeneratedPis();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to generate proforma invoice',
    );
  } finally {
    setGeneratingPi(false);
  }
};

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-4 overflow-x-hidden px-2 pb-4 md:px-0">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Purchase Orders
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Pending project material purchase requirements.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <div className="mb-4 flex items-center justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Generated PO Documents
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Commercial purchase order snapshots
      </p>
    </div>
  </div>

  {generatedPos.length === 0 ? (
    <p className="text-sm text-gray-500">
      No generated purchase orders yet.
    </p>
  ) : (
    <div className="space-y-3">
      {generatedPos.map((po) => (
        <div
          key={po.id}
          className="rounded-xl border p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-bold text-gray-800">
                {po.poNumber || `PO-${po.id}`}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Vendor: {po.vendorName || '-'}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Project #{po.projectId}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Status: {po.status || '-'}
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm text-gray-500">
                Total Amount
              </p>

              <p className="text-xl font-bold text-green-700">
                ₹
                {Number(
                  po.totalAmount || 0,
                ).toLocaleString('en-IN')}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {po.createdAt
                  ? new Date(
                      po.createdAt,
                    ).toLocaleString()
                  : '-'}
              </p>

              <button
  onClick={() => fetchPoDetail(po.id)}
  className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
>
  View PO
</button>

<div className="mt-2 flex flex-wrap gap-2">
  <button
    onClick={() =>
      downloadPurchaseOrderPdf(po.id, false)
    }
    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    Download PDF
  </button>

  <button
    onClick={() =>
      downloadPurchaseOrderPdf(po.id, true)
    }
    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
  >
    Share PDF
  </button>

  <button
  onClick={() => hidePurchaseOrder(po.id)}
  className="mt-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
>
  Hide PO
</button>
</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="mb-5 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
  <input
    placeholder="Filter by Project ID / Customer Name"
    value={projectFilter}
    onChange={(e) => {
  setProjectFilter(e.target.value);
  setPage(1);
}}
    className="rounded-xl border p-3"
  />

  <input
    placeholder="Filter by Material Name"
    value={materialFilter}
    onChange={(e) => {
  setMaterialFilter(e.target.value);
  setPage(1);
}}
    className="rounded-xl border p-3"
  />

  <input
  placeholder="Filter by Branch"
  value={branchFilter}
  onChange={(e) => {
  setBranchFilter(e.target.value);
  setPage(1);
}}
  className="rounded-xl border p-3"
/>

<select
  value={ownerFilter}
  onChange={(e) => {
    setOwnerFilter(e.target.value);
    setPage(1);
  }}
  className="rounded-xl border p-3"
>
  <option value="">All Project Owners</option>

  {projectOwners.map((owner) => (
    <option
      key={owner.projectOwnerId}
      value={owner.projectOwnerId}
    >
      {owner.projectOwnerName || 'Unnamed Owner'}
      {owner.projectOwnerRole
        ? ` (${owner.projectOwnerRole})`
        : ''}
    </option>
  ))}
</select>

  <select
    value={statusFilter}
    onChange={(e) => {
  setStatusFilter(e.target.value);
  setPage(1);
}}
    className="rounded-xl border p-3"
  >
    <option value="">All Status</option>
    <option value="PENDING">Pending</option>
    <option value="PARTIALLY_PURCHASED">Partially Purchased</option>
    <option value="PURCHASED">Purchased</option>
  </select>
</div>

<div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
  <div className="rounded-xl bg-gray-50 p-4">
    <p className="text-sm text-gray-500">
      Pending Items
    </p>
    <p className="mt-1 text-2xl font-bold text-gray-800">
      {summary.totalPendingItems}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-4">
    <p className="text-sm text-gray-500">
      Pending Quantity
    </p>
    <p className="mt-1 text-2xl font-bold text-gray-800">
      {summary.totalPendingQuantity}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-4">
    <p className="text-sm text-gray-500">
      Pending Amount
    </p>
    <p className="mt-1 text-2xl font-bold text-green-700">
      ₹
      {Number(summary.totalPendingAmount).toLocaleString(
  'en-IN',
)}
    </p>
  </div>

  <div className="rounded-xl bg-gray-50 p-4">
    <p className="text-sm text-gray-500">
      Partial Purchases
    </p>
    <p className="mt-1 text-2xl font-bold text-yellow-700">
      {summary.partiallyPurchasedCount}
    </p>
  </div>
</div>

<div className="mb-5 rounded-2xl border bg-blue-50 p-4">
  <h2 className="text-lg font-bold text-gray-800">
    Generate Commercial Purchase Order
  </h2>

  <p className="mt-1 text-sm text-gray-600">
    Select pending items from one project, choose vendor, then generate PO snapshot.
  </p>

  <div className="mt-4 grid gap-3 md:grid-cols-4">
    <select
      value={selectedVendorId}
      onChange={(e) => setSelectedVendorId(e.target.value)}
      className="rounded-xl border p-3"
    >
      <option value="">Select Vendor</option>

      {vendors.map((vendor) => (
        <option key={vendor.id} value={vendor.id}>
          {vendor.vendorName}
        </option>
      ))}
    </select>

    <div className="rounded-xl bg-white p-3 text-sm">
      Selected Items:{' '}
      <b>{selectedItems.length}</b>
    </div>

    <button
      onClick={generatePurchaseOrder}
      disabled={!canGeneratePo || generatingPo}
      className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
    >
      {generatingPo ? 'Generating...' : 'Generate PO'}
    </button>

    <button
  onClick={generateProformaInvoice}
  disabled={
    selectedItems.length === 0 ||
    selectedProjectIds.length !== 1 ||
    generatingPi
  }
  className="rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
>
  {generatingPi ? 'Generating PI...' : 'Generate PI'}
</button>
  </div>

  {selectedItems.length > 0 && selectedProjectIds.length > 1 && (
    <p className="mt-3 text-sm font-semibold text-red-600">
      Please select items from only one project for one PO.
    </p>
  )}
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <h2 className="text-xl font-bold text-gray-800">
    Generated Proforma Invoices
  </h2>

  <p className="mt-1 text-sm text-gray-500">
    Customer-facing commercial invoice snapshots
  </p>

  {generatedPis.length === 0 ? (
    <p className="mt-4 text-sm text-gray-500">
      No proforma invoices generated yet.
    </p>
  ) : (
    <div className="mt-4 space-y-3">
      {generatedPis.map((pi) => (
        <div
          key={pi.id}
          className="rounded-xl border p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-bold text-gray-800">
                {pi.invoiceNumber || `PI-${pi.id}`}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Project #{pi.projectId}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Status: {pi.status || '-'}
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm text-gray-500">
                Total Amount
              </p>

              <p className="text-xl font-bold text-purple-700">
                ₹
                {Number(
                  pi.totalAmount || 0,
                ).toLocaleString('en-IN')}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {pi.createdAt
                  ? new Date(
                      pi.createdAt,
                    ).toLocaleString()
                  : '-'}
              </p>

              <button
  onClick={() => fetchPiDetail(pi.id)}
  className="mt-3 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
>
  View PI
</button>

<button
  onClick={() => createFinalInvoiceFromPi(pi.id)}
  disabled={creatingFinalInvoiceId === pi.id}
  className="mt-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
>
  {creatingFinalInvoiceId === pi.id
    ? 'Creating...'
    : 'Create Final Invoice'}
</button>

<div className="mt-2 flex flex-wrap gap-2">
  <button
    onClick={() =>
      downloadProformaInvoicePdf(pi.id, false)
    }
    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    Download PDF
  </button>

  <button
    onClick={() =>
      downloadProformaInvoicePdf(pi.id, true)
    }
    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
  >
    Share PDF
  </button>
</div>

            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <h2 className="text-xl font-bold text-gray-800">
    Final Invoices
  </h2>

  <p className="mt-1 text-sm text-gray-500">
    Final customer billing documents generated from approved PI
  </p>

  {finalInvoices.length === 0 ? (
    <p className="mt-4 text-sm text-gray-500">
      No final invoices generated yet.
    </p>
  ) : (
    <div className="mt-4 space-y-3">
      {finalInvoices.map((invoice) => (
        <div
          key={invoice.id}
          className="rounded-xl border p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-bold text-gray-800">
                {invoice.invoiceNumber || `INV-${invoice.id}`}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Project #{invoice.projectId}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Status: {invoice.status || '-'}
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm text-gray-500">
                Total Amount
              </p>

              <p className="text-xl font-bold text-green-700">
                ₹
                {Number(
                  invoice.totalAmount || 0,
                ).toLocaleString('en-IN')}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Pending: ₹
                {Number(
                  invoice.pendingAmount || 0,
                ).toLocaleString('en-IN')}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {invoice.createdAt
                  ? new Date(
                      invoice.createdAt,
                    ).toLocaleString()
                  : '-'}
              </p>

              <button
  onClick={() =>
    fetchFinalInvoiceDetail(invoice.id)
  }
  className="mt-3 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
>
  View Invoice
</button>

<div className="mt-2 flex flex-wrap gap-2">
  <button
    onClick={() =>
      downloadFinalInvoicePdf(
        invoice.id,
        false,
      )
    }
    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    Download PDF
  </button>

  <button
    onClick={() =>
      downloadFinalInvoicePdf(
        invoice.id,
        true,
      )
    }
    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
  >
    Share PDF
  </button>
</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

<div className="mb-5 rounded-2xl border p-4">
  <h2 className="mb-4 text-lg font-bold text-gray-800">
    Critical Procurement Summary
  </h2>

  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-sm text-gray-500">
        Panels Pending
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-800">
        {panelSummary.pendingQuantity}
      </p>
      <p className="mt-1 text-sm font-semibold text-green-700">
        ₹
        {panelSummary.pendingAmount.toLocaleString(
          'en-IN',
        )}
      </p>
    </div>

    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-sm text-gray-500">
        Structure Pending
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-800">
        {structureSummary.pendingQuantity}
      </p>
      <p className="mt-1 text-sm font-semibold text-green-700">
        ₹
        {structureSummary.pendingAmount.toLocaleString(
          'en-IN',
        )}
      </p>
    </div>

    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-sm text-gray-500">
        Inverters Pending
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-800">
        {inverterSummary.pendingQuantity}
      </p>
      <p className="mt-1 text-sm font-semibold text-green-700">
        ₹
        {inverterSummary.pendingAmount.toLocaleString(
          'en-IN',
        )}
      </p>
    </div>
  </div>
</div>

<div className="mb-5 rounded-2xl border p-4">
  <h2 className="mb-4 text-lg font-bold text-gray-800">
    Project-wise Purchase Summary
  </h2>

  {projectWiseSummary.length === 0 ? (
    <p className="text-sm text-gray-500">
      No project-wise pending summary found.
    </p>
  ) : (
    <div className="space-y-3">
      {projectWiseSummary.map((project: any) => (
        <div
          key={project.projectId}
          className="rounded-xl bg-gray-50 p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-bold text-gray-800">
                Project #{project.projectId} - {project.customerName}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {project.branchName} | {project.city}
              </p>

              <p className="mt-2 text-sm text-gray-600">
                Materials:{' '}
                {Array.from(new Set(project.materials))
                  .slice(0, 5)
                  .join(', ')}
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm text-gray-500">
                Pending Items: {project.pendingItems}
              </p>

              <p className="text-sm text-gray-500">
                Pending Qty: {project.pendingQuantity}
              </p>

              <p className="text-lg font-bold text-green-700">
                ₹
                {Number(
                  project.pendingAmount || 0,
                ).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

        {loading ? (
          <p>Loading...</p>
        ) : filteredItems.length === 0? (
          <p className="text-sm text-gray-500">
            No pending purchase items found.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
  key={item.id}
  className="min-w-0 overflow-hidden rounded-2xl border p-3 md:p-4"
>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>

                 <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
  <input
    type="checkbox"
    checked={!!selectedItemIds[item.id]}
    onChange={(e) =>
      setSelectedItemIds({
        ...selectedItemIds,
        [item.id]: e.target.checked,
      })
    }
  />
  Select for PO
</label>

{selectedItemIds[item.id] && (
  <input
    type="number"
    placeholder="PI Discount Amount"
    value={piDiscount[item.id] || ''}
    onChange={(e) =>
      setPiDiscount({
        ...piDiscount,
        [item.id]: e.target.value,
      })
    }
    className="mb-3 w-full rounded-xl border p-3"
  />
)}

                    <h2 className="break-words text-lg font-bold text-gray-800">
                      {item.materialName}
                    </h2>

                    <p className="mt-1 break-words text-sm text-gray-500">
  Project #{item.projectId} |{' '}
  {item.projectCustomerName || '-'} |{' '}
  {item.projectBranchName || '-'} |{' '}
  {item.projectCity || '-'} |{' '}
  {item.projectZone || '-'}
</p>

<p className="mt-1 text-sm text-blue-700">
  Project Owner:{' '}
  <span className="font-semibold">
    {item.projectOwnerName || 'Not Assigned'}
  </span>
</p>

<p className="mt-1 text-sm text-gray-500">
  {item.category || '-'} |{' '}
  {item.brand || '-'} |{' '}
  {item.unit || '-'}
</p>

                    <p className="mt-2 text-sm text-gray-700">
                      Requested: <b>{item.quantity || 0}</b> | Purchased:{' '}
                      <b>{item.purchasedQuantity || 0}</b> | Pending:{' '}
                      <b>{item.pendingQuantity || 0}</b>
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      Rate: ₹
                      {Number(item.rate || 0).toLocaleString('en-IN')} | Total:
                      ₹{Number(item.totalAmount || 0).toLocaleString('en-IN')}
                    </p>

                    <p className="mt-2 inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                      {item.purchaseStatus || 'PENDING'}
                    </p>
                  </div>

                  <div className="min-w-0 w-full space-y-2 md:w-72">
                    <input
                      type="number"
                      placeholder="Partial buy quantity"
                      value={buyQty[item.id] || ''}
                      onChange={(e) =>
                        setBuyQty({
                          ...buyQty,
                          [item.id]: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border p-3"
                    />

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        onClick={() => buyItem(item, false)}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Buy Partial
                      </button>

                      <button
                        onClick={() => buyItem(item, true)}
                        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Buy Full
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      <div className="mt-6 flex flex-col gap-3 overflow-hidden md:flex-row md:items-center md:justify-between">
  <p className="text-sm text-gray-600">
    Page {page} of {totalPages}
  </p>

  <div className="flex gap-2">
    <button
      onClick={() =>
        setPage((prev) => Math.max(prev - 1, 1))
      }
      disabled={page <= 1}
      className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
    >
      Previous
    </button>

    <button
      onClick={() =>
        setPage((prev) =>
          Math.min(prev + 1, totalPages),
        )
      }
      disabled={page >= totalPages}
      className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
    >
      Next
    </button>
  </div>
</div>

      </div>

      {showPoModal && selectedPo && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
    <div className="print-area max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Purchase Order Detail
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {selectedPo.poNumber}
          </p>
        </div>

        <div className="flex gap-2">
  <button
    onClick={() => window.print()}
    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
  >
    Print
  </button>

  <button
    onClick={() => {
      setShowPoModal(false);
      setSelectedPo(null);
    }}
    className="rounded-xl bg-gray-700 px-4 py-2 text-sm font-semibold text-white"
  >
    Close
  </button>
</div>
      </div>

      {poDetailLoading ? (
        <p className="mt-5">Loading...</p>
      ) : (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Vendor
              </p>

              <p className="mt-1 font-bold text-gray-800">
                {selectedPo.vendorName || '-'}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Project
              </p>

              <p className="mt-1 font-bold text-gray-800">
                #{selectedPo.projectId}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Status
              </p>

              <p className="mt-1 font-bold text-gray-800">
                {selectedPo.status || '-'}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Order Date
              </p>

              <p className="mt-1 font-bold text-gray-800">
                {selectedPo.orderDate
                  ? new Date(
                      selectedPo.orderDate,
                    ).toLocaleDateString()
                  : '-'}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Material
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Qty
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rate
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    GST
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {(selectedPo.items || []).map(
                  (
                    item: GeneratedPurchaseOrderItem,
                  ) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">
                          {item.materialName}
                        </p>

                        <p className="text-xs text-gray-500">
                          {item.category ||
                            '-'}{' '}
                          | {item.brand || '-'}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        {item.quantity || 0}
                      </td>

                      <td className="px-4 py-3">
                        ₹
                        {Number(
                          item.purchaseRate || 0,
                        ).toLocaleString(
                          'en-IN',
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {item.gstPercent || 0}%
                      </td>

                      <td className="px-4 py-3 font-semibold text-green-700">
                        ₹
                        {Number(
                          item.totalAmount || 0,
                        ).toLocaleString(
                          'en-IN',
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Subtotal
              </p>

              <p className="mt-1 text-xl font-bold text-gray-800">
                ₹
                {Number(
                  selectedPo.subtotalAmount || 0,
                ).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                GST Amount
              </p>

              <p className="mt-1 text-xl font-bold text-gray-800">
                ₹
                {Number(
                  selectedPo.gstAmount || 0,
                ).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-sm text-gray-500">
                Total Amount
              </p>

              <p className="mt-1 text-2xl font-bold text-green-700">
                ₹
                {Number(
                  selectedPo.totalAmount || 0,
                ).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
)}

{showPiModal && selectedPi && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
    <div className="print-area max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Proforma Invoice Detail
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {selectedPi.invoiceNumber}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Print
          </button>

          <button
            onClick={() => {
              setShowPiModal(false);
              setSelectedPi(null);
            }}
            className="rounded-xl bg-gray-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>
      </div>

      {piDetailLoading ? (
        <p className="mt-5">Loading...</p>
      ) : (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Project
              </p>

              <p className="mt-1 font-bold text-gray-800">
                #{selectedPi.projectId}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Status
              </p>

              <p className="mt-1 font-bold text-gray-800">
                {selectedPi.status || '-'}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Invoice Date
              </p>

              <p className="mt-1 font-bold text-gray-800">
                {selectedPi.invoiceDate
                  ? new Date(
                      selectedPi.invoiceDate,
                    ).toLocaleDateString()
                  : '-'}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Valid Until
              </p>

              <p className="mt-1 font-bold text-gray-800">
                {selectedPi.validUntil
                  ? new Date(
                      selectedPi.validUntil,
                    ).toLocaleDateString()
                  : '-'}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Item
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Qty
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Selling Rate
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Discount
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    GST
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {(selectedPi.items || []).map(
                  (
                    item: ProformaInvoiceItem,
                  ) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">
                          {item.itemName}
                        </p>

                        <p className="text-xs text-gray-500">
                          {item.category || '-'} | {item.brand || '-'}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        {item.quantity || 0}
                      </td>

                      <td className="px-4 py-3">
                        ₹
                        {Number(
                          item.sellingRate || 0,
                        ).toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3 text-red-600">
                        ₹
                        {Number(
                          item.discountAmount || 0,
                        ).toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3">
                        {item.gstPercent || 0}%
                      </td>

                      <td className="px-4 py-3 font-semibold text-purple-700">
                        ₹
                        {Number(
                          item.totalAmount || 0,
                        ).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Subtotal
              </p>

              <p className="mt-1 text-xl font-bold text-gray-800">
                ₹
                {Number(
                  selectedPi.subtotalAmount || 0,
                ).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-sm text-gray-500">
                Discount
              </p>

              <p className="mt-1 text-xl font-bold text-red-600">
                ₹
                {Number(
                  selectedPi.discountAmount || 0,
                ).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                GST Amount
              </p>

              <p className="mt-1 text-xl font-bold text-gray-800">
                ₹
                {Number(
                  selectedPi.gstAmount || 0,
                ).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl bg-purple-50 p-4">
              <p className="text-sm text-gray-500">
                Total Amount
              </p>

              <p className="mt-1 text-2xl font-bold text-purple-700">
                ₹
                {Number(
                  selectedPi.totalAmount || 0,
                ).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
)}

{showFinalInvoiceModal && selectedFinalInvoice && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
    <div className="print-area max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Final Invoice Detail
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {selectedFinalInvoice.invoiceNumber}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Print
          </button>

          <button
            onClick={() => {
              setShowFinalInvoiceModal(false);
              setSelectedFinalInvoice(null);
            }}
            className="rounded-xl bg-gray-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>
      </div>

      {finalInvoiceDetailLoading ? (
        <p className="mt-5">Loading...</p>
      ) : (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Project
              </p>

              <p className="mt-1 font-bold text-gray-800">
                #{selectedFinalInvoice.projectId}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Status
              </p>

              <p className="mt-1 font-bold text-gray-800">
                {selectedFinalInvoice.status || '-'}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Invoice Date
              </p>

              <p className="mt-1 font-bold text-gray-800">
                {selectedFinalInvoice.invoiceDate
                  ? new Date(
                      selectedFinalInvoice.invoiceDate,
                    ).toLocaleDateString()
                  : '-'}
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-sm text-gray-500">
                Paid Amount
              </p>

              <p className="mt-1 text-xl font-bold text-green-700">
                ₹
                {Number(
                  selectedFinalInvoice.paidAmount || 0,
                ).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-sm text-gray-500">
                Pending Amount
              </p>

              <p className="mt-1 text-xl font-bold text-red-600">
                ₹
                {Number(
                  selectedFinalInvoice.pendingAmount || 0,
                ).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Item
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Qty
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Final Rate
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Discount
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    GST
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {(selectedFinalInvoice.items || []).map(
                  (
                    item: FinalInvoiceItem,
                  ) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">
                          {item.itemName}
                        </p>

                        <p className="text-xs text-gray-500">
                          {item.category || '-'} | {item.brand || '-'}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        {item.quantity || 0}
                      </td>

                      <td className="px-4 py-3">
                        ₹
                        {Number(
                          item.finalRate || 0,
                        ).toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3 text-red-600">
                        ₹
                        {Number(
                          item.discountAmount || 0,
                        ).toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3">
                        {item.gstPercent || 0}%
                      </td>

                      <td className="px-4 py-3 font-semibold text-green-700">
                        ₹
                        {Number(
                          item.totalAmount || 0,
                        ).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Subtotal
              </p>

              <p className="mt-1 text-xl font-bold text-gray-800">
                ₹
                {Number(
                  selectedFinalInvoice.subtotalAmount || 0,
                ).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-sm text-gray-500">
                Discount
              </p>

              <p className="mt-1 text-xl font-bold text-red-600">
                ₹
                {Number(
                  selectedFinalInvoice.discountAmount || 0,
                ).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                GST Amount
              </p>

              <p className="mt-1 text-xl font-bold text-gray-800">
                ₹
                {Number(
                  selectedFinalInvoice.gstAmount || 0,
                ).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-sm text-gray-500">
                Paid
              </p>

              <p className="mt-1 text-xl font-bold text-green-700">
                ₹
                {Number(
                  selectedFinalInvoice.paidAmount || 0,
                ).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm text-gray-500">
                Total Amount
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-700">
                ₹
                {Number(
                  selectedFinalInvoice.totalAmount || 0,
                ).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
)}

<style jsx global>{`
  @media print {
    body * {
      visibility: hidden;
    }

    .print-area,
    .print-area * {
      visibility: visible;
    }

    .print-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      max-width: 100%;
      max-height: none;
      overflow: visible;
      box-shadow: none;
      border-radius: 0;
    }

    button {
      display: none !important;
    }
  }
`}</style>
    </div>
  );
}
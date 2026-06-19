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
  hsnCode?: string;
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
    partyType?: string;
  canBuyFromUs?: boolean;
  canSellToUs?: boolean;
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
    invoiceType?: string;
  dealerId?: number;
  dealerName?: string;
  dealerPhone?: string;
  dealerGstNumber?: string;
  dealerAddress?: string;
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
    invoiceType?: string;
  dealerId?: number;
  dealerName?: string;
  dealerPhone?: string;
  dealerGstNumber?: string;
  dealerAddress?: string;
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

type MaterialMasterItem = {
  id: number;
  name: string;
  category?: string;
  brand?: string;
  unit?: string;
  rate?: number;
  hsnCode?: string;
  gstPercent?: number;
};

type ProjectOption = {
  id: number;
  customerName?: string;
  city?: string;
  branchName?: string;
  projectOwnerName?: string;
};

type ManualPiItem = {
  materialId?: number | string;
  itemName: string;
  category: string;
  brand: string;
  unit: string;
  hsnCode?: string;
  quantity: string;
  sellingRate: string;
  gstPercent: string;
  discountAmount: string;
};

type ManualPoItem = {
  materialName: string;
  category: string;
  brand: string;
  unit: string;
  hsnCode?: string;
  quantity: string;
  purchaseRate: string;
  gstPercent: string;
};

type ManualInvoiceItem = {
  itemName: string;
  category: string;
  brand: string;
  unit: string;
  hsnCode?: string;
  quantity: string;
  finalRate: string;
  gstPercent: string;
  discountAmount: string;
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

const [projects, setProjects] = useState<ProjectOption[]>([]);

const [vendors, setVendors] = useState<VendorItem[]>([]);
const [selectedVendorId, setSelectedVendorId] = useState('');
const [materials, setMaterials] = useState<MaterialMasterItem[]>([]);
const [selectedItemIds, setSelectedItemIds] = useState<Record<number, boolean>>({});
const [generatingPo, setGeneratingPo] = useState(false);
const [generatedPos, setGeneratedPos] = useState<
  GeneratedPurchaseOrder[]
>([]);
const [selectedPo, setSelectedPo] =
  useState<any>(null);

  const [manualPo, setManualPo] = useState({
  projectId: '',
  vendorName: '',
  materialName: '',
  category: '',
  brand: '',
  unit: '',
  hsnCode: '',
  quantity: '',
  purchaseRate: '',
  gstPercent: '18',
  remarks: '',
});

const [creatingManualPo, setCreatingManualPo] =
  useState(false);

  const [manualPi, setManualPi] = useState({
  projectId: '',
  dealerId: '',
  materialId: '',
  itemName: '',
  category: '',
  brand: '',
  unit: '',
  hsnCode: '',
  quantity: '',
  sellingRate: '',
  gstPercent: '18',
  discountAmount: '0',
  remarks: '',
});

const [creatingManualPi, setCreatingManualPi] =
  useState(false);

  const [manualPiItems, setManualPiItems] = useState<ManualPiItem[]>([]);

  const [manualPoItems, setManualPoItems] = useState<ManualPoItem[]>([]);
const [manualInvoiceItems, setManualInvoiceItems] = useState<ManualInvoiceItem[]>([]);

  const [manualInvoice, setManualInvoice] =
  useState({
    projectId: '',
    itemName: '',
    category: '',
    brand: '',
    unit: '',
    hsnCode: '',
    quantity: '',
    finalRate: '',
    gstPercent: '18',
    discountAmount: '0',
    remarks: '',
  });

const [creatingManualInvoice, setCreatingManualInvoice] =
  useState(false);

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

const fetchProjectsForManualForms = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(`${API_BASE_URL}/project`, {
      params: {
        page: 1,
        limit: 100,
        owner: ownerFilter || undefined,
      },
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    });

    setProjects(res.data?.data || []);
  } catch (error) {
    console.error('Failed to load projects:', error);
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

const fetchMaterials = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/material-master`,
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

    setMaterials(res.data || []);
  } catch (error) {
    console.error('Failed to load materials:', error);
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

const handlePurchasePdf = async (
  endpoint: string,
  fileName: string,
  action: 'view' | 'download' | 'share',
) => {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      alert('Unable to open PDF. Please try again.');
      return;
    }

    const blob = await res.blob();

    const isCapacitor =
      typeof window !== 'undefined' &&
      !!(window as any).Capacitor;

    if (isCapacitor) {
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      let binaryString = '';

      for (let i = 0; i < uint8Array.length; i += 1) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }

      const base64 = btoa(binaryString);

      const { Filesystem, Directory } = await import(
        '@capacitor/filesystem'
      );

      const { Share } = await import('@capacitor/share');

      const saved = await Filesystem.writeFile({
  path: fileName,
  data: base64,
  directory: Directory.Cache,
  recursive: true,
});

      if (action === 'share') {
        await Share.share({
          title: fileName.replace('.pdf', ''),
          text: fileName,
          url: saved.uri,
          dialogTitle: 'Share PDF',
        });

        return;
      }

      await Share.share({
        title: fileName.replace('.pdf', ''),
        text: 'PDF saved. Open or share from available apps.',
        url: saved.uri,
        dialogTitle: 'Open PDF',
      });

      return;
    }

    const file = new File([blob], fileName, {
      type: 'application/pdf',
    });

    if (
      action === 'share' &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        title: fileName.replace('.pdf', ''),
        text: fileName,
        files: [file],
      });

      return;
    }

    const url = window.URL.createObjectURL(blob);

    if (action === 'view') {
      window.open(url, '_blank');
    } else if (action === 'download') {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();

      const isMobile =
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile) {
        setTimeout(() => {
          window.open(url, '_blank');
        }, 500);
      }
    } else {
      window.open(url, '_blank');

      alert(
        'Direct sharing is not supported on this browser. PDF has been opened, please share it from your browser or downloads.',
      );
    }

    setTimeout(() => window.URL.revokeObjectURL(url), 30000);
  } catch (error: any) {
  console.error('PDF ERROR', error);

  alert(
    JSON.stringify(
      error?.message ||
      error?.toString() ||
      error,
    ),
  );
}
};

const downloadFinalInvoicePdf = async (
  invoiceId: number,
  action: 'view' | 'download' | 'share' = 'download',
) => {
  return handlePurchasePdf(
    `/project/final-invoice/${invoiceId}/pdf`,
    `final-invoice-${invoiceId}.pdf`,
    action,
  );
};

const downloadProformaInvoicePdf = async (
  piId: number,
  action: 'view' | 'download' | 'share' = 'download',
) => {
  return handlePurchasePdf(
    `/project/proforma-invoice/${piId}/pdf`,
    `proforma-invoice-${piId}.pdf`,
    action,
  );
};

const downloadPurchaseOrderPdf = async (
  poId: number,
  action: 'view' | 'download' | 'share' = 'download',
) => {
  return handlePurchasePdf(
    `/project/purchase-order/${poId}/pdf`,
    `purchase-order-${poId}.pdf`,
    action,
  );
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

const hideFinalInvoice = async (invoiceId: number) => {
  const reason = window.prompt(
    'Why do you want to hide this final invoice?',
    'Test entry',
  );

  if (reason === null) return;

  const confirmed = window.confirm(
    'This final invoice and its linked ledger entry will be hidden. Continue?',
  );

  if (!confirmed) return;

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/final-invoice/${invoiceId}/hide`,
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

    alert('Final invoice hidden successfully');

    fetchFinalInvoices();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to hide final invoice',
    );
  }
};

const hideProformaInvoice = async (piId: number) => {
  const reason = window.prompt(
    'Why do you want to hide this proforma invoice?',
    'Test entry',
  );

  if (reason === null) return;

  const confirmed = window.confirm(
    'This proforma invoice will be hidden. Continue?',
  );

  if (!confirmed) return;

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/proforma-invoice/${piId}/hide`,
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

    alert('Proforma invoice hidden successfully');

    fetchGeneratedPis();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to hide proforma invoice',
    );
  }
};

  useEffect(() => {
  fetchPurchaseOrders();
}, [page, projectFilter, materialFilter, statusFilter, branchFilter, ownerFilter]);

useEffect(() => {
  fetchProjectOwners();
  fetchVendors();
  fetchMaterials();
  fetchGeneratedPos();
  fetchGeneratedPis();
  fetchFinalInvoices();
  fetchProjectsForManualForms();
}, []);

useEffect(() => {
  fetchProjectsForManualForms();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [ownerFilter]);

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
          hsnCode: item.hsnCode || '',
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

const addManualPoItem = () => {
  if (!manualPo.materialName) {
    alert('Please select material');
    return;
  }

  if (!Number(manualPo.quantity || 0)) {
    alert('Please enter quantity');
    return;
  }

  setManualPoItems([
    ...manualPoItems,
    {
      materialName: manualPo.materialName,
      category: manualPo.category,
      brand: manualPo.brand,
      unit: manualPo.unit,
      hsnCode: manualPo.hsnCode,
      quantity: manualPo.quantity,
      purchaseRate: manualPo.purchaseRate,
      gstPercent: manualPo.gstPercent,
    },
  ]);

  setManualPo({
    ...manualPo,
    materialName: '',
    category: '',
    brand: '',
    unit: '',
     hsnCode: '',
    quantity: '',
    purchaseRate: '',
    gstPercent: '18',
  });
};

const createManualPo = async () => {
  if (!manualPo.vendorName) {
  alert('Vendor is required');
  return;
}

  const itemsToSubmit =
    manualPoItems.length > 0
      ? manualPoItems
      : manualPo.materialName
        ? [
            {
              materialName: manualPo.materialName,
              category: manualPo.category,
              brand: manualPo.brand,
              unit: manualPo.unit,
              hsnCode: manualPo.hsnCode,
              quantity: manualPo.quantity,
              purchaseRate: manualPo.purchaseRate,
              gstPercent: manualPo.gstPercent,
            },
          ]
        : [];

  if (itemsToSubmit.length === 0) {
    alert('Please add at least one material');
    return;
  }

  try {
    setCreatingManualPo(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/purchase-order/manual`,
      {
        projectId: manualPo.projectId
  ? Number(manualPo.projectId)
  : undefined,
        vendorName: manualPo.vendorName,
        remarks: manualPo.remarks,

        items: itemsToSubmit.map((item) => ({
          materialName: item.materialName,
          category: item.category,
          brand: item.brand,
          unit: item.unit,
          hsnCode: item.hsnCode || '',
          quantity: Number(item.quantity || 0),
          purchaseRate: Number(item.purchaseRate || 0),
          gstPercent: Number(item.gstPercent || 0),
        })),
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    alert('Manual purchase order created successfully');

    setManualPo({
      projectId: '',
      vendorName: '',
      materialName: '',
      category: '',
      brand: '',
      unit: '',
      hsnCode: '',
      quantity: '',
      purchaseRate: '',
      gstPercent: '18',
      remarks: '',
    });

    setManualPoItems([]);

    fetchGeneratedPos();
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to create manual PO');
  } finally {
    setCreatingManualPo(false);
  }
};

const addManualPiItem = () => {
  if (!manualPi.itemName) {
    alert('Please select material');
    return;
  }

  if (!Number(manualPi.quantity || 0)) {
    alert('Please enter quantity');
    return;
  }

  setManualPiItems([
    ...manualPiItems,
    {
      materialId: manualPi.materialId,
      itemName: manualPi.itemName,
      category: manualPi.category,
      brand: manualPi.brand,
      unit: manualPi.unit,
      hsnCode: manualPi.hsnCode,
      quantity: manualPi.quantity,
      sellingRate: manualPi.sellingRate,
      gstPercent: manualPi.gstPercent,
      discountAmount: manualPi.discountAmount,
    },
  ]);

  setManualPi({
    ...manualPi,
    materialId: '',
    itemName: '',
    category: '',
    brand: '',
    unit: '',
    hsnCode: '',
    quantity: '',
    sellingRate: '',
    gstPercent: '18',
    discountAmount: '0',
  });
};

const createManualPi = async () => {
  if (!manualPi.projectId && !manualPi.dealerId) {
    alert('Project or Dealer is required');
    return;
  }

  const itemsToSubmit =
    manualPiItems.length > 0
      ? manualPiItems
      : manualPi.itemName
        ? [
            {
              materialId: manualPi.materialId,
              itemName: manualPi.itemName,
              category: manualPi.category,
              brand: manualPi.brand,
              unit: manualPi.unit,
              hsnCode: manualPi.hsnCode,
              quantity: manualPi.quantity,
              sellingRate: manualPi.sellingRate,
              gstPercent: manualPi.gstPercent,
              discountAmount: manualPi.discountAmount,
            },
          ]
        : [];

  if (itemsToSubmit.length === 0) {
    alert('Please add at least one material');
    return;
  }

  try {
    setCreatingManualPi(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/proforma-invoice/manual`,
      {
        projectId: manualPi.projectId
          ? Number(manualPi.projectId)
          : undefined,

        dealerId: manualPi.dealerId
          ? Number(manualPi.dealerId)
          : undefined,

        remarks: manualPi.remarks,

        items: itemsToSubmit.map((item) => ({
          materialId: item.materialId ? Number(item.materialId) : undefined,
          itemName: item.itemName,
          category: item.category,
          brand: item.brand,
          unit: item.unit,
          hsnCode: item.hsnCode || '',
          quantity: Number(item.quantity || 0),
          sellingRate: Number(item.sellingRate || 0),
          gstPercent: Number(item.gstPercent || 0),
          discountAmount: Number(item.discountAmount || 0),
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

    alert('Manual PI created successfully');

    setManualPi({
      projectId: '',
      dealerId: '',
      materialId: '',
      itemName: '',
      category: '',
      brand: '',
      unit: '',
      hsnCode: '',
      quantity: '',
      sellingRate: '',
      gstPercent: '18',
      discountAmount: '0',
      remarks: '',
    });

    setManualPiItems([]);

    fetchGeneratedPis();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to create manual PI',
    );
  } finally {
    setCreatingManualPi(false);
  }
};

const addManualInvoiceItem = () => {
  if (!manualInvoice.itemName) {
    alert('Please select item');
    return;
  }

  if (!Number(manualInvoice.quantity || 0)) {
    alert('Please enter quantity');
    return;
  }

  setManualInvoiceItems([
    ...manualInvoiceItems,
    {
      itemName: manualInvoice.itemName,
      category: manualInvoice.category,
      brand: manualInvoice.brand,
      unit: manualInvoice.unit,
      hsnCode: manualInvoice.hsnCode,
      quantity: manualInvoice.quantity,
      finalRate: manualInvoice.finalRate,
      gstPercent: manualInvoice.gstPercent,
      discountAmount: manualInvoice.discountAmount,
    },
  ]);

  setManualInvoice({
    ...manualInvoice,
    itemName: '',
    category: '',
    brand: '',
    unit: '',
    quantity: '',
    finalRate: '',
    gstPercent: '18',
    discountAmount: '0',
  });
};

const createManualInvoice = async () => {
  if (!manualInvoice.projectId) {
    alert('Project is required');
    return;
  }

  const itemsToSubmit =
    manualInvoiceItems.length > 0
      ? manualInvoiceItems
      : manualInvoice.itemName
        ? [
            {
              itemName: manualInvoice.itemName,
              category: manualInvoice.category,
              brand: manualInvoice.brand,
              unit: manualInvoice.unit,
              quantity: manualInvoice.quantity,
              finalRate: manualInvoice.finalRate,
              gstPercent: manualInvoice.gstPercent,
              discountAmount: manualInvoice.discountAmount,
            },
          ]
        : [];

  if (itemsToSubmit.length === 0) {
    alert('Please add at least one item');
    return;
  }

  try {
    setCreatingManualInvoice(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/final-invoice/manual`,
      {
        projectId: Number(manualInvoice.projectId),
        remarks: manualInvoice.remarks,

        items: itemsToSubmit.map((item) => ({
          itemName: item.itemName,
          category: item.category,
          brand: item.brand,
          unit: item.unit,
          hsnCode: item.hsnCode || '',
          quantity: Number(item.quantity || 0),
          finalRate: Number(item.finalRate || 0),
          gstPercent: Number(item.gstPercent || 0),
          discountAmount: Number(item.discountAmount || 0),
        })),
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    alert('Manual final invoice created successfully');

    setManualInvoice({
      projectId: '',
      itemName: '',
      category: '',
      brand: '',
      unit: '',
      hsnCode: '',
      quantity: '',
      finalRate: '',
      gstPercent: '18',
      discountAmount: '0',
      remarks: '',
    });

    setManualInvoiceItems([]);

    fetchFinalInvoices();
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to create manual invoice');
  } finally {
    setCreatingManualInvoice(false);
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
          hsnCode: item.hsnCode || '',
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
      downloadPurchaseOrderPdf(po.id, 'download')
    }
    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    Download PDF
  </button>

  <button
    onClick={() =>
      downloadPurchaseOrderPdf(po.id, 'share')
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

  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
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

    <div className="rounded-xl border bg-white p-3 text-sm font-semibold text-gray-700">
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

<div className="mb-5 rounded-2xl border bg-green-50 p-4">
  <h2 className="text-lg font-bold text-gray-800">
    Manual Purchase Order
  </h2>

  <p className="mt-1 text-sm text-gray-600">
    Create PO manually without material request.
  </p>

  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
    <select
  value={manualPo.projectId}
  onChange={(e) =>
    setManualPo({
      ...manualPo,
      projectId: e.target.value,
    })
  }
  className="rounded-xl border p-3"
>
  <option value="">Select Project</option>

  {projects.map((project) => (
    <option key={project.id} value={project.id}>
      #{project.id} - {project.customerName || 'Unnamed'} -{' '}
      {project.projectOwnerName || 'No Owner'}
    </option>
  ))}
</select>

    <select
  value={manualPo.vendorName}
  onChange={(e) =>
    setManualPo({
      ...manualPo,
      vendorName: e.target.value,
    })
  }
  className="rounded-xl border p-3"
>
  <option value="">Select Vendor</option>

  {vendors
  .filter(
    (vendor) =>
      vendor.canSellToUs === true ||
      vendor.partyType === 'VENDOR' ||
      vendor.partyType === 'BOTH',
  )
  .map((vendor) => (
    <option key={vendor.id} value={vendor.vendorName}>
      {vendor.vendorName}
    </option>
  ))}
</select>

    <select
  value={manualPo.materialName}
  onChange={(e) => {
    const selected = materials.find(
      (material) => material.name === e.target.value,
    );

    setManualPo({
      ...manualPo,
      materialName: selected?.name || '',
      category: selected?.category || '',
      brand: selected?.brand || '',
      unit: selected?.unit || '',
      hsnCode: selected?.hsnCode || '',
      purchaseRate: String(selected?.rate || ''),
      gstPercent: String(selected?.gstPercent || '18'),
    });
  }}
  className="rounded-xl border p-3"
>
  <option value="">Select Material</option>

  {materials.map((material) => (
    <option key={material.id} value={material.name}>
      {material.name}
    </option>
  ))}
</select>

    <input
      placeholder="Category"
      value={manualPo.category}
      onChange={(e) =>
        setManualPo({
          ...manualPo,
          category: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      placeholder="Brand"
      value={manualPo.brand}
      onChange={(e) =>
        setManualPo({
          ...manualPo,
          brand: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      placeholder="Unit"
      value={manualPo.unit}
      onChange={(e) =>
        setManualPo({
          ...manualPo,
          unit: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
  placeholder="HSN Code"
  value={manualPo.hsnCode}
  onChange={(e) =>
    setManualPo({
      ...manualPo,
      hsnCode: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>

    <input
      type="number"
      placeholder="Quantity"
      value={manualPo.quantity}
      onChange={(e) =>
        setManualPo({
          ...manualPo,
          quantity: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      type="number"
      placeholder="Purchase Rate"
      value={manualPo.purchaseRate}
      onChange={(e) =>
        setManualPo({
          ...manualPo,
          purchaseRate: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      type="number"
      placeholder="GST %"
      value={manualPo.gstPercent}
      onChange={(e) =>
        setManualPo({
          ...manualPo,
          gstPercent: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />
  </div>

  <textarea
    placeholder="Remarks"
    value={manualPo.remarks}
    onChange={(e) =>
      setManualPo({
        ...manualPo,
        remarks: e.target.value,
      })
    }
    className="mt-3 w-full rounded-xl border p-3"
    rows={3}
  />

  <button
  type="button"
  onClick={addManualPoItem}
  className="rounded-xl bg-gray-800 px-4 py-3 text-sm font-semibold text-white hover:bg-black"
>
  Add Material
</button>

{manualPoItems.length > 0 && (
  <div className="mt-4 rounded-xl bg-gray-50 p-4">
    <p className="text-sm font-semibold text-gray-700">
      Added PO Materials
    </p>

    <div className="mt-3 space-y-2">
      {manualPoItems.map((item, index) => (
        <div
          key={`${item.materialName}-${index}`}
          className="flex flex-col gap-2 rounded-lg border bg-white p-3 text-sm md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="font-semibold text-gray-800">
              {item.materialName}
            </p>

            <p className="text-gray-500">
              Qty: {item.quantity} {item.unit || ''}
              {' '}| Rate: ₹
              {Number(item.purchaseRate || 0).toLocaleString('en-IN')}
              {' '}| GST: {item.gstPercent || 0}%
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setManualPoItems(
                manualPoItems.filter(
                  (_, itemIndex) => itemIndex !== index,
                ),
              )
            }
            className="text-sm font-semibold text-red-600"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  </div>
)}

  <button
    onClick={createManualPo}
    disabled={creatingManualPo}
    className="mt-4 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
  >
    {creatingManualPo
      ? 'Creating...'
      : 'Create Manual PO'}
  </button>
</div>

<div className="mb-5 rounded-2xl border bg-purple-50 p-4">
  <h2 className="text-lg font-bold text-gray-800">
    Manual Proforma Invoice
  </h2>

  <p className="mt-1 text-sm text-gray-600">
    Create PI manually without material request.
  </p>

  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
    <select
  value={manualPi.projectId}
  onChange={(e) =>
    setManualPi({
      ...manualPi,
      projectId: e.target.value,
    })
  }
  className="rounded-xl border p-3"
>
  <option value="">Select Project</option>

  {projects.map((project) => (
    <option key={project.id} value={project.id}>
      #{project.id} - {project.customerName || 'Unnamed'} -{' '}
      {project.projectOwnerName || 'No Owner'}
    </option>
  ))}
</select>

<select
  value={manualPi.dealerId}
  onChange={(e) =>
    setManualPi({
      ...manualPi,
      dealerId: e.target.value,
    })
  }
  className="rounded-xl border p-3"
>
  <option value="">
    Select Dealer (Optional)
  </option>

  {vendors
  .filter(
    (vendor) =>
      vendor.canBuyFromUs === true ||
      vendor.partyType === 'DEALER' ||
      vendor.partyType === 'BOTH',
  )
  .map((vendor) => (
    <option
      key={vendor.id}
      value={vendor.id}
    >
      {vendor.vendorName}
    </option>
  ))}
</select>

    <select
  value={manualPi.itemName}
  onChange={(e) => {
    const selected = materials.find(
      (material) =>
        material.name === e.target.value,
    );

    setManualPi({
      ...manualPi,
      materialId: selected?.id ? String(selected.id) : '',
      itemName: selected?.name || '',
      category: selected?.category || '',
      brand: selected?.brand || '',
      unit: selected?.unit || '',
      hsnCode: selected?.hsnCode || '',
      sellingRate: String(
        selected?.rate || '',
      ),
      gstPercent: String(
        selected?.gstPercent || '18',
      ),
    });
  }}
  className="rounded-xl border p-3"
>
  <option value="">
    Select Material
  </option>

  {materials.map((material) => (
    <option
      key={material.id}
      value={material.name}
    >
      {material.name}
    </option>
  ))}
</select>

    <input
      placeholder="Category"
      value={manualPi.category}
      onChange={(e) =>
        setManualPi({
          ...manualPi,
          category: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      placeholder="Brand"
      value={manualPi.brand}
      onChange={(e) =>
        setManualPi({
          ...manualPi,
          brand: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      placeholder="Unit"
      value={manualPi.unit}
      onChange={(e) =>
        setManualPi({
          ...manualPi,
          unit: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
  placeholder="HSN Code"
  value={manualPi.hsnCode}
  onChange={(e) =>
    setManualPi({
      ...manualPi,
      hsnCode: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>

    <input
      type="number"
      placeholder="Quantity"
      value={manualPi.quantity}
      onChange={(e) =>
        setManualPi({
          ...manualPi,
          quantity: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      type="number"
      placeholder="Selling Rate"
      value={manualPi.sellingRate}
      onChange={(e) =>
        setManualPi({
          ...manualPi,
          sellingRate: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      type="number"
      placeholder="GST %"
      value={manualPi.gstPercent}
      onChange={(e) =>
        setManualPi({
          ...manualPi,
          gstPercent: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      type="number"
      placeholder="Discount Amount"
      value={manualPi.discountAmount}
      onChange={(e) =>
        setManualPi({
          ...manualPi,
          discountAmount: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />
  </div>

  <textarea
    placeholder="Remarks"
    value={manualPi.remarks}
    onChange={(e) =>
      setManualPi({
        ...manualPi,
        remarks: e.target.value,
      })
    }
    className="mt-3 w-full rounded-xl border p-3"
    rows={3}
  />

  <button
  type="button"
  onClick={addManualPiItem}
  className="rounded-xl bg-gray-800 px-4 py-3 text-sm font-semibold text-white hover:bg-black"
>
  Add Material
</button>

{manualPiItems.length > 0 && (
  <div className="mt-4 rounded-xl bg-gray-50 p-4">
    <p className="text-sm font-semibold text-gray-700">
      Added Materials
    </p>

    <div className="mt-3 space-y-2">
      {manualPiItems.map((item, index) => (
        <div
          key={`${item.itemName}-${index}`}
          className="flex flex-col gap-2 rounded-lg border bg-white p-3 text-sm md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="font-semibold text-gray-800">
              {item.itemName}
            </p>

            <p className="text-gray-500">
              Qty: {item.quantity} {item.unit || ''}
              {' '}| Rate: ₹
              {Number(item.sellingRate || 0).toLocaleString('en-IN')}
              {' '}| GST: {item.gstPercent || 0}%
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setManualPiItems(
                manualPiItems.filter(
                  (_, itemIndex) => itemIndex !== index,
                ),
              )
            }
            className="text-sm font-semibold text-red-600"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  </div>
)}

  <button
    onClick={createManualPi}
    disabled={creatingManualPi}
    className="mt-4 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
  >
    {creatingManualPi
      ? 'Creating...'
      : 'Create Manual PI'}
  </button>
</div>

<div className="mb-5 rounded-2xl border bg-blue-50 p-4">
  <h2 className="text-lg font-bold text-gray-800">
    Manual Final Invoice
  </h2>

  <p className="mt-1 text-sm text-gray-600">
    Create final invoice manually.
  </p>

  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
    <select
  value={manualInvoice.projectId}

onChange={(e) =>
  setManualInvoice({
    ...manualInvoice,
    projectId: e.target.value,
  })
}
  className="rounded-xl border p-3"
>
  <option value="">Select Project</option>

  {projects.map((project) => (
    <option key={project.id} value={project.id}>
      #{project.id} - {project.customerName || 'Unnamed'} -{' '}
      {project.projectOwnerName || 'No Owner'}
    </option>
  ))}
</select>

    <select
  value={manualInvoice.itemName}
  onChange={(e) => {
    const selected = materials.find(
      (material) =>
        material.name === e.target.value,
    );

    setManualInvoice({
      ...manualInvoice,
      itemName: selected?.name || '',
      category: selected?.category || '',
      brand: selected?.brand || '',
      unit: selected?.unit || '',
      hsnCode: selected?.hsnCode || '',
      finalRate: String(
        selected?.rate || '',
      ),
      gstPercent: String(
        selected?.gstPercent || '18',
      ),
    });
  }}
  className="rounded-xl border p-3"
>
  <option value="">
    Select Material
  </option>

  {materials.map((material) => (
    <option
      key={material.id}
      value={material.name}
    >
      {material.name}
    </option>
  ))}
</select>

    <input
      placeholder="Category"
      value={manualInvoice.category}
      onChange={(e) =>
        setManualInvoice({
          ...manualInvoice,
          category: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      placeholder="Brand"
      value={manualInvoice.brand}
      onChange={(e) =>
        setManualInvoice({
          ...manualInvoice,
          brand: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      placeholder="Unit"
      value={manualInvoice.unit}
      onChange={(e) =>
        setManualInvoice({
          ...manualInvoice,
          unit: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
  placeholder="HSN Code"
  value={manualInvoice.hsnCode}
  onChange={(e) =>
    setManualInvoice({
      ...manualInvoice,
      hsnCode: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>

    <input
      type="number"
      placeholder="Quantity"
      value={manualInvoice.quantity}
      onChange={(e) =>
        setManualInvoice({
          ...manualInvoice,
          quantity: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      type="number"
      placeholder="Final Rate"
      value={manualInvoice.finalRate}
      onChange={(e) =>
        setManualInvoice({
          ...manualInvoice,
          finalRate: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      type="number"
      placeholder="GST %"
      value={manualInvoice.gstPercent}
      onChange={(e) =>
        setManualInvoice({
          ...manualInvoice,
          gstPercent: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />

    <input
      type="number"
      placeholder="Discount Amount"
      value={manualInvoice.discountAmount}
      onChange={(e) =>
        setManualInvoice({
          ...manualInvoice,
          discountAmount: e.target.value,
        })
      }
      className="rounded-xl border p-3"
    />
  </div>

  <textarea
    placeholder="Remarks"
    value={manualInvoice.remarks}
    onChange={(e) =>
      setManualInvoice({
        ...manualInvoice,
        remarks: e.target.value,
      })
    }
    className="mt-3 w-full rounded-xl border p-3"
    rows={3}
  />

  <button
  type="button"
  onClick={addManualInvoiceItem}
  className="rounded-xl bg-gray-800 px-4 py-3 text-sm font-semibold text-white hover:bg-black"
>
  Add Item
</button>

  <button
    onClick={createManualInvoice}
    disabled={creatingManualInvoice}
    className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
  >
    {creatingManualInvoice
      ? 'Creating...'
      : 'Create Manual Invoice'}
  </button>
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

              {pi.invoiceType === 'DEALER' ? (
  <p className="mt-1 text-sm text-gray-500">
    Dealer: {pi.dealerName || '-'}
  </p>
) : (
  <p className="mt-1 text-sm text-gray-500">
    Project #{pi.projectId || '-'}
  </p>
)}

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
      downloadProformaInvoicePdf(pi.id, 'download')
    }
    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    Download PDF
  </button>

  <button
    onClick={() =>
      downloadProformaInvoicePdf(pi.id, 'share')
    }
    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
  >
    Share PDF
  </button>

  <button
  onClick={() => hideProformaInvoice(pi.id)}
  className="mt-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
>
  Hide PI
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

              {invoice.invoiceType === 'DEALER' ? (
  <p className="mt-1 text-sm text-gray-500">
    Dealer: {invoice.dealerName || '-'}
  </p>
) : (
  <p className="mt-1 text-sm text-gray-500">
    Project #{invoice.projectId || '-'}
  </p>
)}

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
      downloadFinalInvoicePdf(invoice.id, 'download')

    }
    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    Download PDF
  </button>

  <button
    onClick={() =>
      downloadFinalInvoicePdf(invoice.id, 'share')
    }
    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
  >
    Share PDF
  </button>

  <button
  onClick={() => hideFinalInvoice(invoice.id)}
  className="mt-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
>
  Hide Invoice
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
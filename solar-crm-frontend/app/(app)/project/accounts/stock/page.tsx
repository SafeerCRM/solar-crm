'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

const formatCurrency = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export default function StockManagementPage() {
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [selectableStockItems, setSelectableStockItems] =
  useState<any[]>([]);

  const [stockSelectorSearch, setStockSelectorSearch] =
  useState({
    issue: '',
    adjust: '',
    transfer: '',
    requestIssue: '',
  });
  const [loading, setLoading] = useState(false);

  const [materials, setMaterials] = useState<any[]>([]);
const [branches, setBranches] = useState<any[]>([]);
const [projectSearch, setProjectSearch] = useState('');
const [projectSearchResults, setProjectSearchResults] =
  useState<any[]>([]);
const [projectSearchLoading, setProjectSearchLoading] =
  useState(false);
const [selectedProject, setSelectedProject] =
  useState<any | null>(null);

const [receiveLoading, setReceiveLoading] = useState(false);

const [issueLoading, setIssueLoading] = useState(false);

const [adjustLoading, setAdjustLoading] = useState(false);

const [adjustForm, setAdjustForm] = useState({
  stockItemId: '',
  adjustmentType: 'ADJUST_IN',
  quantity: '',
  remarks: '',
});

const [transferLoading, setTransferLoading] = useState(false);

const [transferForm, setTransferForm] = useState({
  sourceStockItemId: '',
  destinationBranchId: '',
  quantity: '',
  remarks: '',
});

const [issueForm, setIssueForm] = useState({
  stockItemId: '',
  quantity: '',
  sourceType: 'MANUAL',
  projectId: '',
  dealerName: '',
  dealerPhone: '',
  remarks: '',
});

const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
const [requestIssueLoading, setRequestIssueLoading] =
  useState(false);

const [requestIssueForm, setRequestIssueForm] = useState({
  requestItemId: '',
  stockItemId: '',
  quantity: '',
  remarks: '',
});

const [receiveForm, setReceiveForm] = useState({
  materialId: '',
  branchId: '',
  quantity: '',
  rate: '',
  sourceType: 'MANUAL',
  remarks: '',
});

  const [filters, setFilters] = useState({
    branch: '',
    material: '',
    showHidden: false,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [movements, setMovements] = useState<any[]>([]);
const [movementLoading, setMovementLoading] = useState(false);

const [materialSummaryRows, setMaterialSummaryRows] = useState<any[]>([]);
const [materialSummaryLoading, setMaterialSummaryLoading] = useState(false);
const [materialSummarySearch, setMaterialSummarySearch] = useState('');

const [movementFilters, setMovementFilters] = useState({
  material: '',
  branch: '',
  movementType: '',
  showHidden: false,
});

const [movementPagination, setMovementPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
});

const [branchStockRows, setBranchStockRows] = useState<any[]>([]);
const [branchStockLoading, setBranchStockLoading] = useState(false);

const [branchStockSummary, setBranchStockSummary] =
  useState({
    totalBranches: 0,
    totalMaterials: 0,
    totalItems: 0,
    totalQuantity: 0,
    totalStockValue: 0,
  });

const [branchStockFilters, setBranchStockFilters] = useState({
  branch: '',
  material: '',
});

const [consumptions, setConsumptions] = useState<any[]>([]);
const [consumptionLoading, setConsumptionLoading] =
  useState(false);

const [consumptionFilters, setConsumptionFilters] =
  useState({
    projectId: '',
    material: '',
    branch: '',
    showHidden: false,
  });

const [consumptionPagination, setConsumptionPagination] =
  useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const loadStockItems = async (
    overridePage?: number,
    overrideFilters?: {
      branch: string;
      material: string;
      showHidden: boolean;
    },
  ) => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      const activePage =
        overridePage || pagination.page;

      const activeFilters =
        overrideFilters || filters;

      const res = await axios.get(
        `${API_BASE_URL}/project/stock/items`,
        {
          params: {
  page: activePage,
  limit: pagination.limit,
  branch: activeFilters.branch || undefined,
  material: activeFilters.material || undefined,
  showHidden: activeFilters.showHidden ? 'true' : 'false',
},
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      setStockItems(
        Array.isArray(res.data?.data)
          ? res.data.data
          : [],
      );

      const pageInfo = res.data?.pagination || res.data || {};

setPagination({
  page: Number(pageInfo.page || 1),
  limit: Number(pageInfo.limit || 20),
  total: Number(pageInfo.total || 0),
  totalPages: Number(pageInfo.totalPages || 1),
});
    } catch (error) {
      console.error(error);
      alert('Failed to load stock items');
    } finally {
      setLoading(false);
    }
  };

  const loadSelectableStockItems = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/stock/items`,
      {
        params: {
          page: 1,
          limit: 100,
          showHidden: 'false',
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setSelectableStockItems(
      Array.isArray(res.data?.data)
        ? res.data.data
        : [],
    );
  } catch (error) {
    console.error(error);
  }
};

  const loadStockMovements = async (
  overridePage?: number,
  overrideFilters?: {
    material: string;
    branch: string;
    movementType: string;
    showHidden: boolean;
  },
) => {
  try {
    setMovementLoading(true);

    const token = localStorage.getItem('token');

    const activePage =
      overridePage || movementPagination.page;

    const activeFilters =
      overrideFilters || movementFilters;

    const res = await axios.get(
      `${API_BASE_URL}/project/stock/movements`,
      {
        params: {
  page: activePage,
  limit: movementPagination.limit,
  material: activeFilters.material || undefined,
  branch: activeFilters.branch || undefined,
  movementType: activeFilters.movementType || undefined,
  showHidden: activeFilters.showHidden ? 'true' : 'false',
},
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setMovements(
      Array.isArray(res.data?.data)
        ? res.data.data
        : [],
    );

    const pageInfo = res.data?.pagination || res.data || {};

setMovementPagination({
  page: Number(pageInfo.page || 1),
  limit: Number(pageInfo.limit || 20),
  total: Number(pageInfo.total || 0),
  totalPages: Number(pageInfo.totalPages || 1),
});
  } catch (error) {
    console.error(error);
    alert('Failed to load stock movements');
  } finally {
    setMovementLoading(false);
  }
};

const loadApprovedRequestsForIssue = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/material-requests/approved-for-issue`,
      {
        params: {
          page: 1,
          limit: 50,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setApprovedRequests(
      Array.isArray(res.data?.data)
        ? res.data.data
        : [],
    );
  } catch (error) {
    console.error(error);
  }
};

const issueAgainstMaterialRequest = async () => {
  if (!requestIssueForm.requestItemId) {
    alert('Please select material request item');
    return;
  }

  if (!requestIssueForm.stockItemId) {
    alert('Please select stock item');
    return;
  }

  if (!requestIssueForm.quantity) {
    alert('Please enter quantity');
    return;
  }

  try {
    setRequestIssueLoading(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/material-requests/items/${requestIssueForm.requestItemId}/issue-stock`,
      {
        stockItemId: requestIssueForm.stockItemId,
        quantity: requestIssueForm.quantity,
        remarks: requestIssueForm.remarks,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Stock issued against material request');

    setRequestIssueForm({
      requestItemId: '',
      stockItemId: '',
      quantity: '',
      remarks: '',
    });

    await loadApprovedRequestsForIssue();
    await loadStockItems(1);
    await loadSelectableStockItems();
    await loadStockMovements(1);
    await loadBranchWiseStock();
    await loadMaterialSummary();
    await loadProjectConsumptions(1);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to issue stock against request',
    );
  } finally {
    setRequestIssueLoading(false);
  }
};

const loadBranchWiseStock = async (
  overrideFilters?: {
    branch: string;
    material: string;
  },
) => {
  try {
    setBranchStockLoading(true);

    const token = localStorage.getItem('token');

    const activeFilters =
      overrideFilters || branchStockFilters;

    const res = await axios.get(
      `${API_BASE_URL}/project/stock/branch-wise`,
      {
        params: {
          branch: activeFilters.branch || undefined,
          material: activeFilters.material || undefined,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setBranchStockSummary({
  totalBranches: Number(
    res.data?.summary?.totalBranches || 0,
  ),

  totalMaterials: Number(
    res.data?.summary?.totalMaterials || 0,
  ),

  totalItems: Number(
    res.data?.summary?.totalItems || 0,
  ),

  totalQuantity: Number(
    res.data?.summary?.totalQuantity || 0,
  ),

  totalStockValue: Number(
    res.data?.summary?.totalStockValue || 0,
  ),
});

    setBranchStockRows(
      Array.isArray(res.data?.data)
        ? res.data.data
        : [],
    );
  } catch (error) {
    console.error(error);
    alert('Failed to load branch wise stock');
  } finally {
    setBranchStockLoading(false);
  }
};

const loadMaterialSummary = async (
  searchValue?: string,
) => {
  try {
    setMaterialSummaryLoading(true);

    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/stock/material-summary`,
      {
        params: {
          material: searchValue || materialSummarySearch || undefined,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setMaterialSummaryRows(
      Array.isArray(res.data?.data) ? res.data.data : [],
    );
  } catch (error) {
    console.error(error);
    alert('Failed to load material summary');
  } finally {
    setMaterialSummaryLoading(false);
  }
};

const loadProjectConsumptions = async (
  overridePage?: number,
  overrideFilters?: {
    projectId: string;
    material: string;
    branch: string;
    showHidden: boolean;
  },
) => {
  try {
    setConsumptionLoading(true);

    const token = localStorage.getItem('token');

    const activePage =
      overridePage || consumptionPagination.page;

    const activeFilters =
      overrideFilters || consumptionFilters;

    const res = await axios.get(
      `${API_BASE_URL}/project/consumptions`,
      {
        params: {
          page: activePage,
          limit: consumptionPagination.limit,
          projectId:
            activeFilters.projectId || undefined,
          material:
            activeFilters.material || undefined,
          branch:
            activeFilters.branch || undefined,
          showHidden: activeFilters.showHidden
            ? 'true'
            : undefined,
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setConsumptions(
      Array.isArray(res.data?.data)
        ? res.data.data
        : [],
    );

    setConsumptionPagination({
      page: Number(
        res.data?.pagination?.page || 1,
      ),
      limit: Number(
        res.data?.pagination?.limit || 20,
      ),
      total: Number(
        res.data?.pagination?.total || 0,
      ),
      totalPages: Number(
        res.data?.pagination?.totalPages || 1,
      ),
    });
  } catch (error) {
    console.error(error);
    alert('Failed to load project consumption');
  } finally {
    setConsumptionLoading(false);
  }
};

const hideProjectConsumption = async (
  consumptionId: number,
) => {
  const hiddenReason = window.prompt(
    'Enter hide reason',
  );

  if (!hiddenReason?.trim()) {
    return;
  }

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/consumptions/${consumptionId}/hide`,
      {
        hiddenReason,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Consumption entry hidden');

    await loadProjectConsumptions(1);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to hide consumption entry',
    );
  }
};

const restoreProjectConsumption = async (
  consumptionId: number,
) => {
  const restoreReason = window.prompt(
    'Enter restore reason',
  );

  if (!restoreReason?.trim()) {
    return;
  }

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/consumptions/${consumptionId}/restore`,
      {
        restoreReason,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Consumption entry restored');

const normalFilters = {
  ...consumptionFilters,
  showHidden: false,
};

setConsumptionFilters(normalFilters);

await loadProjectConsumptions(1, normalFilters);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to restore consumption entry',
    );
  }
};

  const loadMaterials = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/material-master`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setMaterials(Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.error(error);
  }
};

const loadBranches = async () => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/branch`,
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setBranches(Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.error(error);
  }
};

const searchProjectsForStockIssue = async (
  value: string,
) => {
  setProjectSearch(value);

  if (value.trim().length < 2) {
    setProjectSearchResults([]);
    return;
  }

  try {
    setProjectSearchLoading(true);

    const token = localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project`,
      {
        params: {
          page: 1,
          limit: 20,
          search: value.trim(),
        },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setProjectSearchResults(
      Array.isArray(res.data?.data)
        ? res.data.data
        : [],
    );
  } catch (error) {
    console.error(
      'Failed to search projects for stock issue:',
      error,
    );

    setProjectSearchResults([]);
  } finally {
    setProjectSearchLoading(false);
  }
};

const selectProjectForStockIssue = (
  project: any,
) => {
  setSelectedProject(project);

  setIssueForm((prev) => ({
    ...prev,
    sourceType: 'PROJECT',
    projectId: String(project.id),
  }));

  setProjectSearch(
    `#${project.id} - ${
      project.customerName || 'Unnamed Project'
    }${
      project.customerPhone
        ? ` - ${project.customerPhone}`
        : ''
    }`,
  );

  setProjectSearchResults([]);
};

const receiveStock = async () => {
  if (!receiveForm.materialId) {
    alert('Please select material');
    return;
  }

  if (!receiveForm.quantity) {
    alert('Please enter quantity');
    return;
  }

  try {
    setReceiveLoading(true);

    const token = localStorage.getItem('token');

    const selectedBranch = branches.find(
  (branch: any) =>
    String(branch.id) === String(receiveForm.branchId),
);

    await axios.post(
      `${API_BASE_URL}/project/stock/receive`,
      {
        materialId: receiveForm.materialId,
        branchId: receiveForm.branchId || undefined,
        branchName: selectedBranch?.name || '',
        quantity: receiveForm.quantity,
        rate: receiveForm.rate || 0,
        sourceType: receiveForm.sourceType,
        remarks: receiveForm.remarks,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Stock received successfully');

    setReceiveForm({
      materialId: '',
      branchId: '',
      quantity: '',
      rate: '',
      sourceType: 'MANUAL',
      remarks: '',
    });

    await loadStockItems(1);
    await loadSelectableStockItems();
    await loadStockMovements(1);
    await loadMaterialSummary();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to receive stock',
    );
  } finally {
    setReceiveLoading(false);
  }
};

const issueStock = async () => {
  if (!issueForm.stockItemId) {
    alert('Please select stock item');
    return;
  }

  if (!issueForm.quantity) {
    alert('Please enter quantity');
    return;
  }

  if (
  issueForm.sourceType === 'PROJECT' &&
  !issueForm.projectId
) {
  alert(
    'Please search and select a project',
  );
  return;
}

  try {
    setIssueLoading(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/stock/issue`,
      {
        stockItemId: issueForm.stockItemId,
        quantity: issueForm.quantity,
        sourceType: issueForm.sourceType,
        projectId: issueForm.projectId || undefined,
        dealerName: issueForm.dealerName,
dealerPhone: issueForm.dealerPhone,
        remarks: issueForm.remarks,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Stock issued successfully');

    setIssueForm({
      stockItemId: '',
      quantity: '',
      sourceType: 'MANUAL',
      projectId: '',
      dealerName: '',
      dealerPhone: '',
      remarks: '',
    });

    setSelectedProject(null);
setProjectSearch('');
setProjectSearchResults([]);

    await loadStockItems(1);
    await loadSelectableStockItems();
    await loadStockMovements(1);
    await loadMaterialSummary();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to issue stock',
    );
  } finally {
    setIssueLoading(false);
  }
};

const adjustStock = async () => {
  if (!adjustForm.stockItemId) {
    alert('Please select stock item');
    return;
  }

  if (!adjustForm.quantity) {
    alert('Please enter quantity');
    return;
  }

  if (!adjustForm.remarks.trim()) {
    alert('Remarks are required for stock adjustment');
    return;
  }

  try {
    setAdjustLoading(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/stock/adjust`,
      {
        stockItemId: adjustForm.stockItemId,
        adjustmentType: adjustForm.adjustmentType,
        quantity: adjustForm.quantity,
        remarks: adjustForm.remarks,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Stock adjusted successfully');

    setAdjustForm({
      stockItemId: '',
      adjustmentType: 'ADJUST_IN',
      quantity: '',
      remarks: '',
    });

    await loadStockItems(1);
    await loadSelectableStockItems();
    await loadStockMovements(1);
    await loadBranchWiseStock();
    await loadMaterialSummary();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to adjust stock',
    );
  } finally {
    setAdjustLoading(false);
  }
};

const transferStock = async () => {
  if (!transferForm.sourceStockItemId) {
    alert('Please select source stock item');
    return;
  }

  if (!transferForm.destinationBranchId) {
    alert('Please select destination branch');
    return;
  }

  if (!transferForm.quantity) {
    alert('Please enter quantity');
    return;
  }

  try {
    setTransferLoading(true);

    const token = localStorage.getItem('token');

    await axios.post(
      `${API_BASE_URL}/project/stock/transfer`,
      {
        sourceStockItemId: transferForm.sourceStockItemId,
        destinationBranchId: transferForm.destinationBranchId,
        quantity: transferForm.quantity,
        remarks: transferForm.remarks,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Stock transferred successfully');

    setTransferForm({
      sourceStockItemId: '',
      destinationBranchId: '',
      quantity: '',
      remarks: '',
    });

    await loadStockItems(1);
    await loadSelectableStockItems();
    await loadStockMovements(1);
    await loadBranchWiseStock();
    await loadMaterialSummary();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to transfer stock',
    );
  } finally {
    setTransferLoading(false);
  }
};

const hideStockItem = async (stockItemId: number) => {
  const hiddenReason = window.prompt(
    'Enter hide reason',
  );

  if (!hiddenReason?.trim()) {
    return;
  }

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/stock/items/${stockItemId}/hide`,
      {
        hiddenReason,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Stock item hidden');

    await loadStockItems(1);
    await loadSelectableStockItems();
    await loadBranchWiseStock();
    await loadMaterialSummary();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to hide stock item',
    );
  }
};

const restoreStockItem = async (stockItemId: number) => {
  const restoreReason = window.prompt(
    'Enter restore reason',
  );

  if (!restoreReason?.trim()) {
    return;
  }

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/stock/items/${stockItemId}/restore`,
      {
        restoreReason,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Stock item restored');

    await loadStockItems(1);
    await loadSelectableStockItems();
    await loadBranchWiseStock();
    await loadMaterialSummary();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to restore stock item',
    );
  }
};

const updateDealerVisibility = async (
  stockItemId: number,
  dealerVisible: boolean,
) => {
  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/stock/items/${stockItemId}/dealer-visibility`,
      { dealerVisible },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    await loadStockItems(pagination.page);
  } catch (error: any) {
    console.error(error);
    alert(
      error?.response?.data?.message ||
        'Failed to update dealer visibility',
    );
  }
};

const hideStockMovement = async (movementId: number) => {
  const hiddenReason = window.prompt(
    'Enter hide reason',
  );

  if (!hiddenReason?.trim()) {
    return;
  }

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/stock/movements/${movementId}/hide`,
      {
        hiddenReason,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Stock movement hidden');

    await loadStockMovements(1);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to hide stock movement',
    );
  }
};

const restoreStockMovement = async (movementId: number) => {
  const restoreReason = window.prompt(
    'Enter restore reason',
  );

  if (!restoreReason?.trim()) {
    return;
  }

  try {
    const token = localStorage.getItem('token');

    await axios.patch(
      `${API_BASE_URL}/project/stock/movements/${movementId}/restore`,
      {
        restoreReason,
      },
      {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    alert('Stock movement restored');

    await loadStockMovements(1);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to restore stock movement',
    );
  }
};

  useEffect(() => {
  loadStockItems(1);
  loadMaterialSummary();
  loadSelectableStockItems();
  loadStockMovements(1);
  loadBranchWiseStock();
  loadApprovedRequestsForIssue();
  loadProjectConsumptions(1);
  loadMaterials();
  loadBranches();
}, []);

  const totalQuantity = stockItems.reduce(
    (total, item) =>
      total + Number(item.currentQuantity || 0),
    0,
  );

  const totalReservedQuantity = stockItems.reduce(
  (total, item) =>
    total + Number(item.reservedQuantity || 0),
  0,
);

const totalAvailableQuantity =
  totalQuantity - totalReservedQuantity;

  const totalStockValue = stockItems.reduce(
    (total, item) =>
      total + Number(item.stockValue || 0),
    0,
  );

  const lowStockCount = stockItems.filter(
  (item) => item.isLowStock,
).length;

const totalIncomingQty = movements
  .filter((item) =>
    ['RECEIVE', 'ADJUST_IN', 'TRANSFER_IN'].includes(
      item.movementType,
    ),
  )
  .reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );

const totalOutgoingQty = movements
  .filter((item) =>
    ['ISSUE', 'ADJUST_OUT', 'TRANSFER_OUT'].includes(
      item.movementType,
    ),
  )
  .reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );

const adjustmentCount = movements.filter((item) =>
  ['ADJUST_IN', 'ADJUST_OUT'].includes(item.movementType),
).length;

const transferCount = movements.filter((item) =>
  ['TRANSFER_IN', 'TRANSFER_OUT'].includes(item.movementType),
).length;

const consumptionTotal = consumptions.reduce(
  (total, item) => total + Number(item.totalAmount || 0),
  0,
);

const getStockItemLabel = (item: any) => {
  const availableQty =
    Number(item.currentQuantity || 0) -
    Number(item.reservedQuantity || 0);

  return `${item.materialName || ''} ${item.branchName || ''} ${
    item.category || ''
  } ${item.brand || ''} ${item.unit || ''} Qty ${availableQty}`;
};

const getFilteredSelectableStockItems = (searchText: string) => {
  const value = searchText.trim().toLowerCase();

  if (!value) {
    return selectableStockItems;
  }

  return selectableStockItems.filter((item: any) =>
    getStockItemLabel(item).toLowerCase().includes(value),
  );
};

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Stock Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Inventory, warehouse stock, branch stock and material availability management.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Visible Stock Items
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-800">
            {stockItems.length}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Total Quantity
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-700">
            {totalQuantity.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
  <p className="text-sm text-gray-500">
    Reserved Quantity
  </p>

  <p className="mt-2 text-2xl font-bold text-orange-700">
    {totalReservedQuantity.toLocaleString('en-IN')}
  </p>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <p className="text-sm text-gray-500">
    Available Quantity
  </p>

  <p className="mt-2 text-2xl font-bold text-green-700">
    {totalAvailableQuantity.toLocaleString('en-IN')}
  </p>
</div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Stock Value
          </p>

          <p className="mt-2 text-2xl font-bold text-green-700">
            {formatCurrency(totalStockValue)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-gray-500">
            Total Records
          </p>

          <p className="mt-2 text-2xl font-bold text-purple-700">
            {pagination.total}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Incoming Stock
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Receive manual, opening or adjustment stock into branch inventory.
      </p>
    </div>

    <button
      type="button"
      onClick={receiveStock}
      disabled={receiveLoading}
      className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
    >
      {receiveLoading ? 'Receiving...' : 'Receive Stock'}
    </button>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-3">
    <select
      value={receiveForm.materialId}
      onChange={(e) =>
        setReceiveForm({
          ...receiveForm,
          materialId: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">Select Material</option>

      {materials.map((material: any) => (
        <option
          key={material.id}
          value={material.id}
        >
          {material.name}
          {material.brand ? ` - ${material.brand}` : ''}
          {material.unit ? ` (${material.unit})` : ''}
        </option>
      ))}
    </select>

    <select
      value={receiveForm.branchId}
      onChange={(e) =>
        setReceiveForm({
          ...receiveForm,
          branchId: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">Select Branch</option>

      {branches.map((branch: any) => (
        <option
          key={branch.id}
          value={branch.id}
        >
          {branch.name}
        </option>
      ))}
    </select>

    <select
      value={receiveForm.sourceType}
      onChange={(e) =>
        setReceiveForm({
          ...receiveForm,
          sourceType: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="MANUAL">Manual</option>
      <option value="OPENING_STOCK">Opening Stock</option>
      <option value="PURCHASE_ORDER">Purchase Order</option>
      <option value="RETURN">Return</option>
      <option value="ADJUSTMENT">Adjustment</option>
    </select>

    <input
      type="number"
      placeholder="Quantity"
      value={receiveForm.quantity}
      onChange={(e) =>
        setReceiveForm({
          ...receiveForm,
          quantity: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <input
      type="number"
      placeholder="Rate"
      value={receiveForm.rate}
      onChange={(e) =>
        setReceiveForm({
          ...receiveForm,
          rate: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <input
      type="text"
      placeholder="Remarks"
      value={receiveForm.remarks}
      onChange={(e) =>
        setReceiveForm({
          ...receiveForm,
          remarks: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />
  </div>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Outgoing Stock
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Issue material from available branch stock for project, damage, return or adjustment.
      </p>
    </div>

    <button
      type="button"
      onClick={issueStock}
      disabled={issueLoading}
      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
    >
      {issueLoading ? 'Issuing...' : 'Issue Stock'}
    </button>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-3">

    <input
  type="text"
  placeholder="Search stock item by material, branch, brand"
  value={stockSelectorSearch.issue}
  onChange={(e) =>
    setStockSelectorSearch({
      ...stockSelectorSearch,
      issue: e.target.value,
    })
  }
  className="rounded-xl border p-3 text-sm"
/>
    <select
      value={issueForm.stockItemId}
      onChange={(e) =>
        setIssueForm({
          ...issueForm,
          stockItemId: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">Select Stock Item</option>

      {getFilteredSelectableStockItems(stockSelectorSearch.issue).map((item: any) => (
        <option
          key={item.id}
          value={item.id}
        >
          {item.materialName}
          {item.branchName ? ` - ${item.branchName}` : ''}
          {` | Qty: ${Number(
            item.currentQuantity || 0,
          ).toLocaleString('en-IN')}`}
        </option>
      ))}
    </select>

    <select
      value={issueForm.sourceType}
      onChange={(e) => {
  const nextSourceType = e.target.value;

  setIssueForm({
    ...issueForm,
    sourceType: nextSourceType,
    projectId:
      nextSourceType === 'PROJECT'
        ? issueForm.projectId
        : '',
  });

  if (nextSourceType !== 'PROJECT') {
    setSelectedProject(null);
    setProjectSearch('');
    setProjectSearchResults([]);
  }
}}
      className="rounded-xl border p-3 text-sm"
    >
      <option value="MANUAL">Manual</option>
      <option value="PROJECT">Project</option>
      <option value="DEALER">
  Dealer Sale
</option>
      <option value="DAMAGE">Damage</option>
      <option value="RETURN_TO_VENDOR">
        Return To Vendor
      </option>
      <option value="ADJUSTMENT">Adjustment</option>
    </select>

    {issueForm.sourceType === 'DEALER' && (
      <>
        <input
          type="text"
          placeholder="Dealer Name"
          value={issueForm.dealerName}
          onChange={(e) =>
            setIssueForm({
              ...issueForm,
              dealerName: e.target.value,
            })
          }
          className="rounded-xl border p-3 text-sm"
        />
        <input
          type="text"
          placeholder="Dealer Phone"
          value={issueForm.dealerPhone}
          onChange={(e) =>
            setIssueForm({
              ...issueForm,
              dealerPhone: e.target.value,
            })
          }
          className="rounded-xl border p-3 text-sm"
        />
      </>
    )}

    <input
      type="number"
      placeholder="Quantity"
      value={issueForm.quantity}
      onChange={(e) =>
        setIssueForm({
          ...issueForm,
          quantity: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    {issueForm.sourceType === 'PROJECT' && (
  <div className="relative md:col-span-2">
    <input
      type="text"
      placeholder="Search project by customer name, phone, K number or project ID"
      value={projectSearch}
      onChange={(e) => {
        setSelectedProject(null);

        setIssueForm((prev) => ({
          ...prev,
          projectId: '',
        }));

        searchProjectsForStockIssue(
          e.target.value,
        );
      }}
      className="w-full rounded-xl border p-3 text-sm"
    />

    {projectSearchLoading && (
      <p className="mt-1 text-xs text-gray-500">
        Searching projects...
      </p>
    )}

    {projectSearchResults.length > 0 && (
      <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border bg-white shadow-lg">
        {projectSearchResults.map(
          (project: any) => (
            <button
              key={project.id}
              type="button"
              onClick={() =>
                selectProjectForStockIssue(
                  project,
                )
              }
              className="block w-full border-b px-4 py-3 text-left hover:bg-gray-50"
            >
              <p className="font-semibold text-gray-800">
                #{project.id} -{' '}
                {project.customerName ||
                  'Unnamed Project'}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {[
                  project.customerPhone,
                  project.electricityKNumber
                    ? `K No: ${project.electricityKNumber}`
                    : '',
                  project.branchName,
                  project.projectType,
                  project.status?.replaceAll(
                    '_',
                    ' ',
                  ),
                ]
                  .filter(Boolean)
                  .join(' | ')}
              </p>
            </button>
          ),
        )}
      </div>
    )}

    {selectedProject && (
      <div className="mt-2 rounded-xl bg-green-50 p-3 text-sm">
        <p className="font-semibold text-green-800">
          Selected Project
        </p>

        <p className="mt-1 text-green-700">
          #{selectedProject.id} -{' '}
          {selectedProject.customerName}
        </p>

        <p className="mt-1 text-xs text-green-700">
          {selectedProject.customerPhone ||
            '-'}
          {selectedProject.branchName
            ? ` | ${selectedProject.branchName}`
            : ''}
        </p>
      </div>
    )}
  </div>
)}

    <input
      type="text"
      placeholder="Remarks"
      value={issueForm.remarks}
      onChange={(e) =>
        setIssueForm({
          ...issueForm,
          remarks: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm md:col-span-2"
    />
  </div>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Stock Adjustment
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Correct physical stock difference with mandatory remarks and movement history.
      </p>
    </div>

    <button
      type="button"
      onClick={adjustStock}
      disabled={adjustLoading}
      className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
    >
      {adjustLoading ? 'Adjusting...' : 'Save Adjustment'}
    </button>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-2">

    <input
  type="text"
  placeholder="Search stock item by material, branch, brand"
  value={stockSelectorSearch.adjust}
  onChange={(e) =>
    setStockSelectorSearch({
      ...stockSelectorSearch,
      adjust: e.target.value,
    })
  }
  className="rounded-xl border p-3 text-sm"
/>
    <select
      value={adjustForm.stockItemId}
      onChange={(e) =>
        setAdjustForm({
          ...adjustForm,
          stockItemId: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">Select Stock Item</option>

      {getFilteredSelectableStockItems(stockSelectorSearch.adjust).map((item: any) => (
        <option key={item.id} value={item.id}>
          {item.materialName}
          {item.branchName ? ` - ${item.branchName}` : ''}
          {` | Available: ${Number(
            item.currentQuantity || 0,
          ).toLocaleString('en-IN')}`}
        </option>
      ))}
    </select>

    <select
      value={adjustForm.adjustmentType}
      onChange={(e) =>
        setAdjustForm({
          ...adjustForm,
          adjustmentType: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="ADJUST_IN">Adjust In / Add Stock</option>
      <option value="ADJUST_OUT">Adjust Out / Reduce Stock</option>
    </select>

    <input
      type="number"
      placeholder="Adjustment Quantity"
      value={adjustForm.quantity}
      onChange={(e) =>
        setAdjustForm({
          ...adjustForm,
          quantity: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <input
      type="text"
      placeholder="Mandatory Remarks"
      value={adjustForm.remarks}
      onChange={(e) =>
        setAdjustForm({
          ...adjustForm,
          remarks: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />
  </div>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Branch Stock Transfer
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Transfer material from Kota Warehouse or any branch to another branch.
      </p>
    </div>

    <button
      type="button"
      onClick={transferStock}
      disabled={transferLoading}
      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
    >
      {transferLoading ? 'Transferring...' : 'Transfer Stock'}
    </button>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-2">

    <input
  type="text"
  placeholder="Search source stock item"
  value={stockSelectorSearch.transfer}
  onChange={(e) =>
    setStockSelectorSearch({
      ...stockSelectorSearch,
      transfer: e.target.value,
    })
  }
  className="rounded-xl border p-3 text-sm"
/>
    <select
      value={transferForm.sourceStockItemId}
      onChange={(e) =>
        setTransferForm({
          ...transferForm,
          sourceStockItemId: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">Select Source Stock Item</option>

      {getFilteredSelectableStockItems(stockSelectorSearch.transfer).map((item: any) => (
        <option key={item.id} value={item.id}>
          {item.materialName}
          {item.branchName ? ` - ${item.branchName}` : ''}
          {` | Available: ${Number(
            item.currentQuantity || 0,
          ).toLocaleString('en-IN')}`}
        </option>
      ))}
    </select>

    <select
      value={transferForm.destinationBranchId}
      onChange={(e) =>
        setTransferForm({
          ...transferForm,
          destinationBranchId: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">Select Destination Branch</option>

      {branches.map((branch: any) => (
        <option key={branch.id} value={branch.id}>
          {branch.name}
        </option>
      ))}
    </select>

    <input
      type="number"
      placeholder="Transfer Quantity"
      value={transferForm.quantity}
      onChange={(e) =>
        setTransferForm({
          ...transferForm,
          quantity: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <input
      type="text"
      placeholder="Remarks"
      value={transferForm.remarks}
      onChange={(e) =>
        setTransferForm({
          ...transferForm,
          remarks: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />
  </div>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Issue Against Material Request
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Issue warehouse stock against project material requests.
      </p>
    </div>

    <button
      type="button"
      onClick={issueAgainstMaterialRequest}
      disabled={requestIssueLoading}
      className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white"
    >
      {requestIssueLoading
        ? 'Issuing...'
        : 'Issue Against Request'}
    </button>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-2">
    <select
      value={requestIssueForm.requestItemId}
      onChange={(e) =>
        setRequestIssueForm({
          ...requestIssueForm,
          requestItemId: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">Select Material Request Item</option>

      {approvedRequests.flatMap((request: any) =>
        Array.isArray(request.items)
          ? request.items.map((item: any) => (
              <option
                key={item.id}
                value={item.id}
              >
                Request #{request.id} | Project #{request.projectId} | {item.materialName} | Pending:{' '}
                {Number(
                  item.issuePendingQuantity || 0,
                ).toLocaleString('en-IN')}
              </option>
            ))
          : [],
      )}
    </select>


<input
  type="text"
  placeholder="Search stock item for issue"
  value={stockSelectorSearch.requestIssue}
  onChange={(e) =>
    setStockSelectorSearch({
      ...stockSelectorSearch,
      requestIssue: e.target.value,
    })
  }
  className="rounded-xl border p-3 text-sm"
/>
    <select
      value={requestIssueForm.stockItemId}
      onChange={(e) =>
        setRequestIssueForm({
          ...requestIssueForm,
          stockItemId: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">Select Stock Item</option>

      {getFilteredSelectableStockItems(stockSelectorSearch.requestIssue).map((item: any) => (
        <option
          key={item.id}
          value={item.id}
        >
          {item.materialName}
          {item.branchName ? ` - ${item.branchName}` : ''}
          {` | Available: ${Number(
            item.currentQuantity || 0,
          ).toLocaleString('en-IN')}`}
        </option>
      ))}
    </select>

    <input
      type="number"
      placeholder="Issue Quantity"
      value={requestIssueForm.quantity}
      onChange={(e) =>
        setRequestIssueForm({
          ...requestIssueForm,
          quantity: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <input
      type="text"
      placeholder="Remarks"
      value={requestIssueForm.remarks}
      onChange={(e) =>
        setRequestIssueForm({
          ...requestIssueForm,
          remarks: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />
  </div>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Material Summary
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Clean material-wise view. Branch-wise stock is still maintained internally for transfer, issue and audit.
      </p>
    </div>

    <button
      type="button"
      onClick={() => loadMaterialSummary()}
      disabled={materialSummaryLoading}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
    >
      {materialSummaryLoading ? 'Loading...' : 'Refresh'}
    </button>
  </div>

  <div className="mt-4 flex flex-col gap-3 md:flex-row">
    <input
      type="text"
      placeholder="Search material / category / brand"
      value={materialSummarySearch}
      onChange={(e) => setMaterialSummarySearch(e.target.value)}
      className="rounded-xl border p-3 text-sm md:w-96"
    />

    <button
      type="button"
      onClick={() => loadMaterialSummary(materialSummarySearch)}
      className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
    >
      Apply Search
    </button>

    <button
      type="button"
      onClick={() => {
        setMaterialSummarySearch('');
        loadMaterialSummary('');
      }}
      className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700"
    >
      Reset
    </button>
  </div>

  <div className="mt-5 overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-2 text-left">Material</th>
          <th className="p-2 text-left">Category</th>
          <th className="p-2 text-left">Brand</th>
          <th className="p-2 text-left">Unit</th>
          <th className="p-2 text-left">Branches</th>
          <th className="p-2 text-left">Current Qty</th>
          <th className="p-2 text-left">Reserved Qty</th>
          <th className="p-2 text-left">Available Qty</th>
          <th className="p-2 text-left">Stock Value</th>
        </tr>
      </thead>

      <tbody>
        {materialSummaryRows.length === 0 && (
          <tr>
            <td
              colSpan={9}
              className="p-4 text-center text-gray-500"
            >
              No material summary found.
            </td>
          </tr>
        )}

        {materialSummaryRows.map((item: any) => (
          <tr
            key={item.materialId || item.materialName}
            className="border-b"
          >
            <td className="p-2 font-semibold">
              {item.materialName || '-'}
            </td>

            <td className="p-2">{item.category || '-'}</td>

            <td className="p-2">{item.brand || '-'}</td>

            <td className="p-2">{item.unit || '-'}</td>

            <td className="p-2">
              <p className="font-semibold">
                {Number(item.totalBranches || 0)}
              </p>

              {Array.isArray(item.branchNames) &&
                item.branchNames.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {item.branchNames.slice(0, 4).join(', ')}
                    {item.branchNames.length > 4
                      ? ` +${item.branchNames.length - 4} more`
                      : ''}
                  </p>
                )}
            </td>

            <td className="p-2 font-semibold">
              {Number(item.totalCurrentQuantity || 0).toLocaleString('en-IN')}
            </td>

            <td className="p-2 font-semibold text-orange-700">
              {Number(item.totalReservedQuantity || 0).toLocaleString('en-IN')}
            </td>

            <td className="p-2 font-semibold text-green-700">
              {Number(item.totalAvailableQuantity || 0).toLocaleString('en-IN')}
            </td>

            <td className="p-2 font-semibold text-green-700">
              {formatCurrency(item.totalStockValue)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Warehouse Stock
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Current material stock by branch with pagination.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadStockItems(1)}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {loading
                ? 'Loading...'
                : 'Apply Filters'}
            </button>

            <button
              type="button"
              onClick={() => {
                const emptyFilters = {
                  branch: '',
                  material: '',
                  showHidden: false,
                };

                setFilters(emptyFilters);
                loadStockItems(1, emptyFilters);
              }}
              className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <select
  value={filters.branch}
  onChange={(e) =>
    setFilters({
      ...filters,
      branch: e.target.value,
    })
  }
  className="rounded-xl border p-3 text-sm"
>
  <option value="">All Branches</option>

  {branches.map((branch: any) => (
    <option
      key={branch.id}
      value={branch.name}
    >
      {branch.name}
    </option>
  ))}
</select>

          <input
            type="text"
            placeholder="Material / Category / Brand"
            value={filters.material}
            onChange={(e) =>
              setFilters({
                ...filters,
                material: e.target.value,
              })
            }
            className="rounded-xl border p-3 text-sm"
          />

          <label className="flex items-center gap-2 rounded-xl border p-3 text-sm">
            <input
              type="checkbox"
              checked={filters.showHidden}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  showHidden: e.target.checked,
                })
              }
            />
            View Hidden
          </label>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-2 text-left">
                  Material
                </th>
                <th className="p-2 text-left">
                  Category
                </th>
                <th className="p-2 text-left">
                  Brand
                </th>
                <th className="p-2 text-left">
                  Unit
                </th>
                <th className="p-2 text-left">
                  Branch
                </th>
                <th className="p-2 text-left">
  Current Qty
</th>
<th className="p-2 text-left">
  Reserved Qty
</th>
<th className="p-2 text-left">
  Available Qty
</th>
                <th className="p-2 text-left">
                  Avg Rate
                </th>
                <th className="p-2 text-left">
                  Stock Value
                </th>
                <th className="p-2 text-left">
  Dealer Visibility
</th>
                <th className="p-2 text-left">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {stockItems.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="p-4 text-center text-gray-500"
                  >
                    No stock items found.
                  </td>
                </tr>
              )}

              {stockItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b"
                >
                  <td className="p-2 font-semibold">
  <div className="flex flex-col gap-1">
    <span>{item.materialName || '-'}</span>

    {item.isLowStock && (
      <span className="w-fit rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
        LOW STOCK
      </span>
    )}
  </div>
</td>

                  <td className="p-2">
                    {item.category || '-'}
                  </td>

                  <td className="p-2">
                    {item.brand || '-'}
                  </td>

                  <td className="p-2">
                    {item.unit || '-'}
                  </td>

                  <td className="p-2">
                    {item.branchName || '-'}
                  </td>

                  <td className="p-2 font-semibold">
  {Number(
    item.currentQuantity || 0,
  ).toLocaleString('en-IN')}
</td>

<td className="p-2 font-semibold text-orange-700">
  {Number(
    item.reservedQuantity || 0,
  ).toLocaleString('en-IN')}
</td>

<td
  className={`p-2 font-semibold ${
    item.isLowStock
      ? 'text-red-700'
      : 'text-green-700'
  }`}
>
  {Math.max(
    Number(item.currentQuantity || 0) -
      Number(item.reservedQuantity || 0),
    0,
  ).toLocaleString('en-IN')}

  <p className="text-xs text-gray-500">
    Min:{' '}
    {Number(
      item.minimumStockLevel || 0,
    ).toLocaleString('en-IN')}
  </p>
</td>

                  <td className="p-2">
                    {formatCurrency(item.averageRate)}
                  </td>

                  <td className="p-2 font-semibold text-green-700">
                    {formatCurrency(item.stockValue)}
                  </td>

                  <td className="p-2">
  {item.dealerVisible === false ? (
    <div className="space-y-2">
      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
        Hidden From Dealer
      </span>

      {!filters.showHidden && (
        <button
          type="button"
          onClick={() =>
            updateDealerVisibility(item.id, true)
          }
          className="block rounded bg-green-600 px-2 py-1 text-xs text-white"
        >
          Show To Dealer
        </button>
      )}
    </div>
  ) : (
    <div className="space-y-2">
      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
        Visible To Dealer
      </span>

      {!filters.showHidden && (
        <button
          type="button"
          onClick={() =>
            updateDealerVisibility(item.id, false)
          }
          className="block rounded bg-orange-600 px-2 py-1 text-xs text-white"
        >
          Hide From Dealer
        </button>
      )}
    </div>
  )}
</td>

                  <td className="p-2">
  {filters.showHidden ? (
    <button
      type="button"
      onClick={() => restoreStockItem(item.id)}
      className="rounded bg-green-600 px-2 py-1 text-xs text-white"
    >
      Restore
    </button>
  ) : (
    <button
      type="button"
      onClick={() => hideStockItem(item.id)}
      className="rounded bg-gray-700 px-2 py-1 text-xs text-white"
    >
      Hide
    </button>
  )}
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of{' '}
            {pagination.totalPages} | Total{' '}
            {pagination.total}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={
                pagination.page <= 1 || loading
              }
              onClick={() =>
                loadStockItems(
                  pagination.page - 1,
                )
              }
              className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={
                pagination.page >=
                  pagination.totalPages ||
                loading
              }
              onClick={() =>
                loadStockItems(
                  pagination.page + 1,
                )
              }
              className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Branch Wise Stock
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Branch-wise material count, quantity and stock value.
      </p>
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => loadBranchWiseStock()}
        disabled={branchStockLoading}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
      >
        {branchStockLoading
          ? 'Loading...'
          : 'Apply Filters'}
      </button>

      <button
        type="button"
        onClick={() => {
          const emptyFilters = {
            branch: '',
            material: '',
          };

          setBranchStockFilters(emptyFilters);
          loadBranchWiseStock(emptyFilters);
        }}
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700"
      >
        Reset
      </button>
    </div>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-2">
    <select
  value={branchStockFilters.branch}
  onChange={(e) =>
    setBranchStockFilters({
      ...branchStockFilters,
      branch: e.target.value,
    })
  }
  className="rounded-xl border p-3 text-sm"
>
  <option value="">All Branches</option>

  {branches.map((branch: any) => (
    <option
      key={branch.id}
      value={branch.name}
    >
      {branch.name}
    </option>
  ))}
</select>

    <input
      type="text"
      placeholder="Material / Category / Brand"
      value={branchStockFilters.material}
      onChange={(e) =>
        setBranchStockFilters({
          ...branchStockFilters,
          material: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />
  </div>

  <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
  <div className="rounded-2xl bg-blue-50 p-4">
    <p className="text-sm font-semibold text-blue-700">
      Branches
    </p>

    <p className="mt-2 text-2xl font-bold text-blue-900">
      {branchStockSummary.totalBranches}
    </p>

    <p className="mt-1 text-xs text-blue-600">
      Distinct branches matching the filters
    </p>
  </div>

  <div className="rounded-2xl bg-purple-50 p-4">
    <p className="text-sm font-semibold text-purple-700">
      Distinct Materials
    </p>

    <p className="mt-2 text-2xl font-bold text-purple-900">
      {branchStockSummary.totalMaterials}
    </p>

    <p className="mt-1 text-xs text-purple-600">
      Unique material types held across branches
    </p>
  </div>

  <div className="rounded-2xl bg-orange-50 p-4">
    <p className="text-sm font-semibold text-orange-700">
      Stock Lines
    </p>

    <p className="mt-2 text-2xl font-bold text-orange-900">
      {branchStockSummary.totalItems}
    </p>

    <p className="mt-1 text-xs text-orange-600">
      Material and branch stock records
    </p>
  </div>

  <div className="rounded-2xl bg-green-50 p-4">
    <p className="text-sm font-semibold text-green-700">
      Total Stock Value
    </p>

    <p className="mt-2 text-2xl font-bold text-green-900">
      {formatCurrency(
        branchStockSummary.totalStockValue,
      )}
    </p>

    <p className="mt-1 text-xs text-green-600">
      Value of stock matching the filters
    </p>
  </div>
</div>

  <div className="mt-5 overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-2 text-left">Branch</th>
          <th className="p-2 text-left">Items</th>
          <th className="p-2 text-left">Quantity</th>
          <th className="p-2 text-left">Stock Value</th>
        </tr>
      </thead>

      <tbody>
        {branchStockRows.length === 0 && (
          <tr>
            <td
              colSpan={4}
              className="p-4 text-center text-gray-500"
            >
              No branch stock found.
            </td>
          </tr>
        )}

        {branchStockRows.map((item) => (
          <tr
            key={item.branchName}
            className="border-b"
          >
            <td className="p-2 font-semibold">
              {item.branchName || 'UNASSIGNED'}
            </td>

            <td className="p-2">
              {item.totalItems}
            </td>

            <td className="p-2 font-semibold">
              {Number(
                item.totalQuantity || 0,
              ).toLocaleString('en-IN')}
            </td>

            <td className="p-2 font-semibold text-green-700">
              {formatCurrency(item.totalStockValue)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

      <div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Stock Movement History
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Complete receive and issue history for stock audit.
      </p>
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => loadStockMovements(1)}
        disabled={movementLoading}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
      >
        {movementLoading
          ? 'Loading...'
          : 'Apply Filters'}
      </button>

      <button
        type="button"
        onClick={() => {
          const emptyFilters = {
            material: '',
            branch: '',
            movementType: '',
            showHidden: false,
          };

          setMovementFilters(emptyFilters);
          loadStockMovements(1, emptyFilters);
        }}
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700"
      >
        Reset
      </button>
    </div>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-4">
    <input
      type="text"
      placeholder="Material"
      value={movementFilters.material}
      onChange={(e) =>
        setMovementFilters({
          ...movementFilters,
          material: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <select
  value={movementFilters.branch}
  onChange={(e) =>
    setMovementFilters({
      ...movementFilters,
      branch: e.target.value,
    })
  }
  className="rounded-xl border p-3 text-sm"
>
  <option value="">All Branches</option>

  {branches.map((branch: any) => (
    <option
      key={branch.id}
      value={branch.name}
    >
      {branch.name}
    </option>
  ))}
</select>

    <select
      value={movementFilters.movementType}
      onChange={(e) =>
        setMovementFilters({
          ...movementFilters,
          movementType: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">All Movement Types</option>
      <option value="RECEIVE">Receive</option>
      <option value="ISSUE">Issue</option>
      <option value="ADJUST_IN">Adjust In</option>
      <option value="ADJUST_OUT">Adjust Out</option>
      <option value="TRANSFER_IN">Transfer In</option>
      <option value="TRANSFER_OUT">Transfer Out</option>
    </select>

    <label className="flex items-center gap-2 rounded-xl border p-3 text-sm">
      <input
        type="checkbox"
        checked={movementFilters.showHidden}
        onChange={(e) =>
          setMovementFilters({
            ...movementFilters,
            showHidden: e.target.checked,
          })
        }
      />
      View Hidden
    </label>
  </div>

  <div className="mt-5 overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-2 text-left">Date</th>
          <th className="p-2 text-left">Material</th>
          <th className="p-2 text-left">Branch</th>
          <th className="p-2 text-left">Type</th>
          <th className="p-2 text-left">Qty</th>
          <th className="p-2 text-left">Rate</th>
          <th className="p-2 text-left">Amount</th>
          <th className="p-2 text-left">Source</th>
          <th className="p-2 text-left">Dealer</th>
          <th className="p-2 text-left">Project</th>
          <th className="p-2 text-left">Created By</th>
          <th className="p-2 text-left">Remarks</th>
          <th className="p-2 text-left">Action</th>
        </tr>
      </thead>

      <tbody>
        {movements.length === 0 && (
          <tr>
            <td
              colSpan={13}
              className="p-4 text-center text-gray-500"
            >
              No stock movements found.
            </td>
          </tr>
        )}

        {movements.map((item) => (
          <tr key={item.id} className="border-b">
            <td className="p-2">
              {item.createdAt
                ? new Date(item.createdAt).toLocaleDateString()
                : '-'}
            </td>

            <td className="p-2 font-semibold">
              {item.materialName || '-'}
            </td>

            <td className="p-2">
              {item.branchName || '-'}
            </td>

            <td className="p-2">
              {item.movementType || '-'}
            </td>

            <td className="p-2 font-semibold">
              {Number(item.quantity || 0).toLocaleString(
                'en-IN',
              )}
            </td>

            <td className="p-2">
              {formatCurrency(item.rate)}
            </td>

            <td className="p-2 font-semibold">
              {formatCurrency(item.totalAmount)}
            </td>

            <td className="p-2">
  {item.sourceType || '-'}
</td>

<td className="p-2">
  {item.dealerName ? (
    <div>
      <p className="font-semibold">{item.dealerName}</p>
      <p className="text-xs text-gray-500">
        {item.dealerPhone || '-'}
      </p>
    </div>
  ) : (
    '-'
  )}
</td>

<td className="p-2">
  {item.projectId || '-'}
</td>

            <td className="p-2">
              {item.createdByName || '-'}
            </td>

            <td className="p-2">
              {item.remarks || '-'}
            </td>
            <td className="p-2">
  {movementFilters.showHidden ? (
    <button
      type="button"
      onClick={() => restoreStockMovement(item.id)}
      className="rounded bg-green-600 px-2 py-1 text-xs text-white"
    >
      Restore
    </button>
  ) : (
    <button
      type="button"
      onClick={() => hideStockMovement(item.id)}
      className="rounded bg-gray-700 px-2 py-1 text-xs text-white"
    >
      Hide
    </button>
  )}
</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <p className="text-sm text-gray-500">
      Page {movementPagination.page} of{' '}
      {movementPagination.totalPages} | Total{' '}
      {movementPagination.total}
    </p>

    <div className="flex gap-2">
      <button
        type="button"
        disabled={
          movementPagination.page <= 1 ||
          movementLoading
        }
        onClick={() =>
          loadStockMovements(
            movementPagination.page - 1,
          )
        }
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
      >
        Previous
      </button>

      <button
        type="button"
        disabled={
          movementPagination.page >=
            movementPagination.totalPages ||
          movementLoading
        }
        onClick={() =>
          loadStockMovements(
            movementPagination.page + 1,
          )
        }
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
</div>

<div className="rounded-2xl bg-white p-5 shadow">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 className="text-xl font-bold text-gray-800">
        Project Consumption Register
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Materials issued to projects from warehouse stock.
      </p>
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() =>
          loadProjectConsumptions(1)
        }
        disabled={consumptionLoading}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
      >
        {consumptionLoading
          ? 'Loading...'
          : 'Apply Filters'}
      </button>

      <button
        type="button"
        onClick={() => {
          const emptyFilters = {
            projectId: '',
            material: '',
            branch: '',
            showHidden: false,
          };

          setConsumptionFilters(emptyFilters);
          loadProjectConsumptions(
            1,
            emptyFilters,
          );
        }}
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700"
      >
        Reset
      </button>
    </div>
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-4">
    <input
      type="number"
      placeholder="Project ID"
      value={consumptionFilters.projectId}
      onChange={(e) =>
        setConsumptionFilters({
          ...consumptionFilters,
          projectId: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <input
      type="text"
      placeholder="Material"
      value={consumptionFilters.material}
      onChange={(e) =>
        setConsumptionFilters({
          ...consumptionFilters,
          material: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    />

    <select
      value={consumptionFilters.branch}
      onChange={(e) =>
        setConsumptionFilters({
          ...consumptionFilters,
          branch: e.target.value,
        })
      }
      className="rounded-xl border p-3 text-sm"
    >
      <option value="">All Branches</option>

      {branches.map((branch: any) => (
        <option
          key={branch.id}
          value={branch.name}
        >
          {branch.name}
        </option>
      ))}
    </select>

    <label className="flex items-center gap-2 rounded-xl border p-3 text-sm">
      <input
        type="checkbox"
        checked={consumptionFilters.showHidden}
        onChange={(e) =>
          setConsumptionFilters({
            ...consumptionFilters,
            showHidden: e.target.checked,
          })
        }
      />
      View Hidden
    </label>
  </div>

  <div className="mt-5 overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="p-2 text-left">Date</th>
          <th className="p-2 text-left">Project</th>
          <th className="p-2 text-left">Material</th>
          <th className="p-2 text-left">Branch</th>
          <th className="p-2 text-left">Qty</th>
          <th className="p-2 text-left">Rate</th>
          <th className="p-2 text-left">Amount</th>
          <th className="p-2 text-left">Issued By</th>
          <th className="p-2 text-left">Remarks</th>
          <th className="p-2 text-left">Action</th>
        </tr>
      </thead>

      <tbody>
        {consumptions.length === 0 && (
          <tr>
            <td
              colSpan={10}
              className="p-4 text-center text-gray-500"
            >
              No project consumption records found.
            </td>
          </tr>
        )}

        {consumptions.map((item) => (
          <tr key={item.id} className="border-b">
            <td className="p-2">
              {item.createdAt
                ? new Date(
                    item.createdAt,
                  ).toLocaleDateString()
                : '-'}
            </td>

            <td className="p-2 font-semibold">
              {item.projectName ||
                `Project #${item.projectId}`}
            </td>

            <td className="p-2">
              {item.materialName || '-'}
            </td>

            <td className="p-2">
              {item.branchName || '-'}
            </td>

            <td className="p-2 font-semibold">
              {Number(
                item.quantity || 0,
              ).toLocaleString('en-IN')}
            </td>

            <td className="p-2">
              {formatCurrency(item.rate)}
            </td>

            <td className="p-2 font-semibold text-green-700">
              {formatCurrency(item.totalAmount)}
            </td>

            <td className="p-2">
              {item.issuedByName || '-'}
            </td>

            <td className="p-2">
              {item.remarks || '-'}
            </td>

            <td className="p-2">
              {consumptionFilters.showHidden ? (
                <button
                  type="button"
                  onClick={() =>
                    restoreProjectConsumption(
                      item.id,
                    )
                  }
                  className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                >
                  Restore
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    hideProjectConsumption(item.id)
                  }
                  className="rounded bg-gray-700 px-2 py-1 text-xs text-white"
                >
                  Hide
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <p className="text-sm text-gray-500">
      Page {consumptionPagination.page} of{' '}
      {consumptionPagination.totalPages} | Total{' '}
      {consumptionPagination.total}
    </p>

    <div className="flex gap-2">
      <button
        type="button"
        disabled={
          consumptionPagination.page <= 1 ||
          consumptionLoading
        }
        onClick={() =>
          loadProjectConsumptions(
            consumptionPagination.page - 1,
          )
        }
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
      >
        Previous
      </button>

      <button
        type="button"
        disabled={
          consumptionPagination.page >=
            consumptionPagination.totalPages ||
          consumptionLoading
        }
        onClick={() =>
          loadProjectConsumptions(
            consumptionPagination.page + 1,
          )
        }
        className="rounded-xl border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
</div>

      <div className="grid gap-4 xl:grid-cols-2">

  <div className="rounded-2xl bg-white p-5 shadow">
    <h2 className="text-lg font-bold text-gray-800">
      Material Availability
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Current, reserved and available stock status.
    </p>

    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="p-2 text-left">Material</th>
            <th className="p-2 text-left">Current</th>
            <th className="p-2 text-left">Reserved</th>
            <th className="p-2 text-left">Available</th>
            <th className="p-2 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {stockItems.slice(0, 10).map((item) => {
            const currentQty = Number(
              item.currentQuantity || 0,
            );

            const reservedQty = Number(
              item.reservedQuantity || 0,
            );

            const availableQty = Math.max(
              currentQty - reservedQty,
              0,
            );

            return (
              <tr
                key={item.id}
                className="border-b"
              >
                <td className="p-2 font-semibold">
                  {item.materialName}
                </td>

                <td className="p-2">
                  {currentQty}
                </td>

                <td className="p-2 text-orange-700">
                  {reservedQty}
                </td>

                <td
                  className={`p-2 font-semibold ${
                    item.isLowStock
                      ? 'text-red-700'
                      : 'text-green-700'
                  }`}
                >
                  {availableQty}
                </td>

                <td className="p-2">
                  {item.isLowStock ? (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                      LOW
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                      OK
                    </span>
                  )}
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
      Stock Reports
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Quick operational stock summary.
    </p>

    <div className="mt-4 grid gap-3 md:grid-cols-2">

      <div className="rounded-xl bg-blue-50 p-4">
        <p className="text-xs text-blue-700">
          Incoming Qty
        </p>
        <p className="text-xl font-bold text-blue-800">
          {totalIncomingQty}
        </p>
      </div>

      <div className="rounded-xl bg-red-50 p-4">
        <p className="text-xs text-red-700">
          Outgoing Qty
        </p>
        <p className="text-xl font-bold text-red-800">
          {totalOutgoingQty}
        </p>
      </div>

      <div className="rounded-xl bg-orange-50 p-4">
        <p className="text-xs text-orange-700">
          Adjustments
        </p>
        <p className="text-xl font-bold text-orange-800">
          {adjustmentCount}
        </p>
      </div>

      <div className="rounded-xl bg-indigo-50 p-4">
        <p className="text-xs text-indigo-700">
          Transfers
        </p>
        <p className="text-xl font-bold text-indigo-800">
          {transferCount}
        </p>
      </div>

      <div className="rounded-xl bg-red-50 p-4">
        <p className="text-xs text-red-700">
          Low Stock Items
        </p>
        <p className="text-xl font-bold text-red-800">
          {lowStockCount}
        </p>
      </div>

      <div className="rounded-xl bg-green-50 p-4">
        <p className="text-xs text-green-700">
          Consumption Value
        </p>
        <p className="text-xl font-bold text-green-800">
          {formatCurrency(
            consumptionTotal,
          )}
        </p>
      </div>

    </div>
  </div>

</div>
    </div>
  );
}
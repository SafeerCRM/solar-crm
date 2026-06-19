'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { uploadPreparedFile } from '@/app/utils/fileUpload';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import dayjs, { Dayjs } from 'dayjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Dealer = {
  id: number;
  vendorName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  openingBalance?: number;
  isActive?: boolean;
};

type CatalogItem = {
  id: number;
  name?: string;
  category?: string;
  brand?: string;
  unit?: string;
  hsnCode?: string;
  gstPercent?: number;
  sellingRate?: number;
  sellingRateWithGst?: number;
  availableQuantity?: number;
};

type DealerOrder = {
  id: number;
  orderNumber?: string;
  dealerName?: string;
  dealerPhone?: string;
  branchName?: string;
  status?: string;
  paymentType?: string;
  totalAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
  expectedDeliveryAt?: string;
  isHidden?: boolean;
  createdAt?: string;
};

type DealerNotification = {
  id: number;
  dealerName?: string;
  title?: string;
  message?: string;
  notificationType?: string;
  status?: string;
  createdAt?: string;
};

type DealerMonthlyRequirement = {
  id: number;
  dealerName?: string;
  materialName?: string;
  category?: string;
  brand?: string;
  unit?: string;
  requirementMonth?: string;
  expectedQuantity?: number;
  remarks?: string;
  isHidden?: boolean;
};

type CreditReminder = DealerOrder & {
  creditDueDate?: string;
};

type OrderItemRow = {
  materialId: string;
  quantity: string;
  discountAmount: string;
  remarks: string;
};

function money(value?: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

const emptyDealerForm = {
  vendorName: '',
  contactPerson: '',
  phone: '',
  email: '',
  gstNumber: '',
  address: '',
  city: '',
  state: '',
  openingBalance: '',
  remarks: '',
};

export default function TradingAccountPage() {
  const [activeTab, setActiveTab] =
    useState<
      | 'dealers'
      | 'catalog'
      | 'orders'
      | 'notifications'
      | 'monthly'
      | 'credit'
      | 'ledger'
      | 'complaints'
    >('dealers');

  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [orders, setOrders] = useState<DealerOrder[]>([]);

  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalSales: 0,
    totalPaid: 0,
    totalPending: 0,
    overdueCreditOrders: 0,
  });

  const [notifications, setNotifications] = useState<DealerNotification[]>([]);
const [monthlyRequirements, setMonthlyRequirements] = useState<DealerMonthlyRequirement[]>([]);
const [creditReminders, setCreditReminders] = useState<CreditReminder[]>([]);
const [dealerLedger, setDealerLedger] = useState<any>(null);
const [ledgerDealerId, setLedgerDealerId] = useState('');
const [dealerComplaints, setDealerComplaints] = useState<any[]>([]);
const [complaintPage, setComplaintPage] = useState(1);
const [complaintTotalPages, setComplaintTotalPages] = useState(1);
const [complaintStatus, setComplaintStatus] = useState('');

const [notificationPage, setNotificationPage] = useState(1);
const [notificationTotalPages, setNotificationTotalPages] = useState(1);

const [monthlyPage, setMonthlyPage] = useState(1);
const [monthlyTotalPages, setMonthlyTotalPages] = useState(1);
const [showHiddenMonthly, setShowHiddenMonthly] = useState(false);

const [notificationForm, setNotificationForm] = useState({
  dealerId: '',
  title: '',
  message: '',
  notificationType: 'GENERAL',
});

const [monthlyForm, setMonthlyForm] = useState({
  dealerId: '',
  materialId: '',
  requirementMonth: '',
  expectedQuantity: '',
  remarks: '',
});

  const [loading, setLoading] = useState(false);

  const [dealerSearch, setDealerSearch] = useState('');
  const [dealerBranch, setDealerBranch] = useState('');
  const [showHiddenDealers, setShowHiddenDealers] = useState(false);
  const [dealerPage, setDealerPage] = useState(1);
  const [dealerTotalPages, setDealerTotalPages] = useState(1);

  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotalPages, setCatalogTotalPages] = useState(1);

  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showHiddenOrders, setShowHiddenOrders] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotalPages, setOrderTotalPages] = useState(1);

  const [editingDealerId, setEditingDealerId] = useState<number | null>(null);
  const [dealerForm, setDealerForm] = useState(emptyDealerForm);

  const [orderForm, setOrderForm] = useState({
    dealerId: '',
    paymentType: 'CASH',
    creditDueDate: '',
    expectedDeliveryAt: '',
    assignedStaffName: '',
    assignedStaffPhone: '',
    remarks: '',
  });

  const [orderRows, setOrderRows] = useState<OrderItemRow[]>([
    { materialId: '', quantity: '', discountAmount: '0', remarks: '' },
  ]);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedOrderInvoices, setSelectedOrderInvoices] =
  useState<any>(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMode: 'ONLINE',
    transactionId: '',
    receiptUrl: '',
    remarks: '',
  });

  const [paymentReceiptFile, setPaymentReceiptFile] =
  useState<File | null>(null);
const [paymentReceiptUploading, setPaymentReceiptUploading] =
  useState(false);

  const [commentText, setCommentText] = useState('');
  const [adminStatus, setAdminStatus] = useState('');
  const [adminExpectedDeliveryAt, setAdminExpectedDeliveryAt] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');

  const headers = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchDealers = async () => {
    const res = await axios.get(`${API_BASE_URL}/project/dealer/list`, {
      params: {
        search: dealerSearch,
        branch: dealerBranch,
        showHidden: showHiddenDealers,
        page: dealerPage,
        limit: 20,
      },
      headers: headers(),
    });

    setDealers(res.data?.data || []);
    setDealerTotalPages(res.data?.totalPages || 1);
  };

  const fetchCatalog = async () => {
    const res = await axios.get(`${API_BASE_URL}/project/dealer/catalog`, {
      params: {
        search: catalogSearch,
        page: catalogPage,
        limit: 20,
      },
      headers: headers(),
    });

    setCatalog(res.data?.data || []);
    setCatalogTotalPages(res.data?.totalPages || 1);
  };

  const fetchOrders = async () => {
    const res = await axios.get(`${API_BASE_URL}/project/dealer-orders`, {
      params: {
        search: orderSearch,
        status: statusFilter,
        showHidden: showHiddenOrders,
        page: orderPage,
        limit: 20,
      },
      headers: headers(),
    });

    setOrders(res.data?.data || []);
    setOrderTotalPages(res.data?.totalPages || 1);
  };

  const fetchAnalytics = async () => {
    const res = await axios.get(`${API_BASE_URL}/project/dealer-analytics`, {
      headers: headers(),
    });
    setAnalytics(res.data || {});
  };

  const fetchNotifications = async () => {
  const res = await axios.get(`${API_BASE_URL}/project/dealer-notifications`, {
    params: {
      page: notificationPage,
      limit: 20,
    },
    headers: headers(),
  });

  setNotifications(res.data?.data || []);
  setNotificationTotalPages(res.data?.totalPages || 1);
};

const fetchMonthlyRequirements = async () => {
  const res = await axios.get(`${API_BASE_URL}/project/dealer-monthly-requirements`, {
    params: {
      page: monthlyPage,
      limit: 20,
      showHidden: showHiddenMonthly,
    },
    headers: headers(),
  });

  setMonthlyRequirements(res.data?.data || []);
  setMonthlyTotalPages(res.data?.totalPages || 1);
};

const fetchDealerComplaints = async () => {
  const res = await axios.get(`${API_BASE_URL}/dealer/complaints`, {
    params: {
      page: complaintPage,
      limit: 20,
      status: complaintStatus,
    },
    headers: headers(),
  });

  setDealerComplaints(res.data?.data || []);
  setComplaintTotalPages(res.data?.totalPages || 1);
};

const fetchCreditReminders = async () => {
  const res = await axios.get(`${API_BASE_URL}/project/dealer-credit-reminders`, {
    headers: headers(),
  });

  setCreditReminders(res.data?.data || []);
};

const fetchDealerLedger = async () => {
  if (!ledgerDealerId) {
    setDealerLedger(null);
    return;
  }

  const res = await axios.get(`${API_BASE_URL}/project/dealer-ledger-history`, {
    params: {
      dealerId: ledgerDealerId,
    },
    headers: headers(),
  });

  setDealerLedger(res.data || null);
};

  const refreshAll = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDealers(),
        fetchCatalog(),
        fetchOrders(),
        fetchAnalytics(),
        fetchNotifications(),
        fetchMonthlyRequirements(),
        fetchCreditReminders(),
        fetchDealerComplaints(),
      ]);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to load trading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
  dealerPage,
  catalogPage,
  orderPage,
  notificationPage,
  monthlyPage,
  showHiddenDealers,
  showHiddenOrders,
  showHiddenMonthly,
  complaintPage,
complaintStatus,
]);

useEffect(() => {
  const raw = localStorage.getItem('tradingMeetingConversionData');

  if (!raw) return;

  try {
    const data = JSON.parse(raw);

    setActiveTab('catalog');

    setOrderForm((prev) => ({
      ...prev,
      dealerId: data?.dealerId ? String(data.dealerId) : prev.dealerId,
      remarks: [
        data?.meetingNotes
          ? `Trading Meeting Notes: ${data.meetingNotes}`
          : '',
        data?.gpsAddress ? `GPS Address: ${data.gpsAddress}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    }));

    if (data?.expectedMaterialName || data?.expectedQuantity) {
      setOrderRows([
        {
          materialId: '',
          quantity: data?.expectedQuantity
            ? String(data.expectedQuantity)
            : '',
          discountAmount: '0',
          remarks: data?.expectedMaterialName
            ? `Expected Material: ${data.expectedMaterialName}`
            : '',
        },
      ]);
    }

    localStorage.removeItem('tradingMeetingConversionData');
  } catch (error) {
    console.error('Failed to load trading conversion data', error);
    localStorage.removeItem('tradingMeetingConversionData');
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const selectedDealer = useMemo(
    () => dealers.find((item) => String(item.id) === String(orderForm.dealerId)),
    [dealers, orderForm.dealerId],
  );

  const orderPreview = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let gst = 0;
    let total = 0;

    for (const row of orderRows) {
      const item = catalog.find((mat) => String(mat.id) === String(row.materialId));
      if (!item) continue;

      const qty = Number(row.quantity || 0);
      const rate = Number(item.sellingRate || 0);
      const disc = Number(row.discountAmount || 0);
      const base = qty * rate;
      const taxable = Math.max(base - disc, 0);
      const gstAmount = (taxable * Number(item.gstPercent || 0)) / 100;

      subtotal += base;
      discount += disc;
      gst += gstAmount;
      total += taxable + gstAmount;
    }

    return { subtotal, discount, gst, total };
  }, [orderRows, catalog]);

  const resetDealerForm = () => {
    setEditingDealerId(null);
    setDealerForm(emptyDealerForm);
  };

  const saveDealer = async () => {
    if (!dealerForm.vendorName.trim()) {
      alert('Dealer name is required');
      return;
    }

    try {
      if (editingDealerId) {
        await axios.patch(
          `${API_BASE_URL}/project/vendor/${editingDealerId}`,
          {
            ...dealerForm,
            partyType: 'DEALER',
            canSellToUs: false,
            canBuyFromUs: true,
          },
          { headers: headers() },
        );

        alert('Dealer updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/project/dealer`, dealerForm, {
  headers: headers(),
});

try {
  await axios.post(
    `${API_BASE_URL}/dealer`,
    {
      dealerName: dealerForm.vendorName,
      firmName: dealerForm.vendorName,
      phone: dealerForm.phone,
      email: dealerForm.email,
      gstNumber: dealerForm.gstNumber,
      branchName: dealerForm.city,
      city: dealerForm.city,
      address: dealerForm.address,
      creditEnabled: false,
      creditLimit: 0,
      creditDays: 0,
      status: 'ACTIVE',
    },
    { headers: headers() },
  );
} catch (syncError) {
  console.error('Dealer portal sync failed', syncError);
  alert(
    'Dealer added, but portal login sync failed. Please inform admin.',
  );
}

alert('Dealer added successfully');
      }

      resetDealerForm();
      fetchDealers();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to save dealer');
    }
  };

  const startEditDealer = (dealer: Dealer) => {
    setEditingDealerId(dealer.id);
    setDealerForm({
      vendorName: dealer.vendorName || '',
      contactPerson: dealer.contactPerson || '',
      phone: dealer.phone || '',
      email: dealer.email || '',
      gstNumber: dealer.gstNumber || '',
      address: dealer.address || '',
      city: dealer.city || '',
      state: dealer.state || '',
      openingBalance: String(dealer.openingBalance || ''),
      remarks: '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleDealer = async (dealer: Dealer) => {
    const confirmed = window.confirm(
      dealer.isActive === false
        ? 'Restore this dealer?'
        : 'Hide/disable this dealer?',
    );

    if (!confirmed) return;

    try {
      await axios.patch(
        `${API_BASE_URL}/project/vendor/${dealer.id}/${
          dealer.isActive === false ? 'enable' : 'delete'
        }`,
        {},
        { headers: headers() },
      );

      fetchDealers();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to update dealer');
    }
  };

  const addOrderRow = () => {
    setOrderRows([
      ...orderRows,
      { materialId: '', quantity: '', discountAmount: '0', remarks: '' },
    ]);
  };

  const removeOrderRow = (index: number) => {
    setOrderRows(orderRows.filter((_, rowIndex) => rowIndex !== index));
  };

  const updateOrderRow = (
    index: number,
    field: keyof OrderItemRow,
    value: string,
  ) => {
    const rows = [...orderRows];
    rows[index] = { ...rows[index], [field]: value };
    setOrderRows(rows);
  };

  const generateDealerPi = async () => {
  if (!selectedOrder?.order?.id) return;

  const confirmed = window.confirm(
    'Generate Proforma Invoice for this dealer order?',
  );

  if (!confirmed) return;

  try {
    await axios.post(
      `${API_BASE_URL}/project/dealer-order/${selectedOrder.order.id}/proforma-invoice`,
      {},
      { headers: headers() },
    );

    alert('Dealer PI generated successfully');
    await openOrder(selectedOrder.order.id);
    fetchOrders();
  } catch (error: any) {
    console.error(error);
    alert(
      error?.response?.data?.message ||
        'Failed to generate Dealer PI',
    );
  }
};

const generateDealerFinalInvoice = async () => {
  if (!selectedOrder?.order?.id) return;

  const confirmed = window.confirm(
    'Generate Final Invoice for this dealer order?',
  );

  if (!confirmed) return;

  try {
    await axios.post(
      `${API_BASE_URL}/project/dealer-order/${selectedOrder.order.id}/final-invoice`,
      {},
      { headers: headers() },
    );

    alert('Dealer Final Invoice generated successfully');
    await openOrder(selectedOrder.order.id);
    fetchOrders();
  } catch (error: any) {
    console.error(error);
    alert(
      error?.response?.data?.message ||
        'Failed to generate Dealer Final Invoice',
    );
  }
};

  const createDealerOrder = async () => {
    if (!orderForm.dealerId) {
      alert('Please select dealer');
      return;
    }

    const validRows = orderRows.filter(
      (row) => row.materialId && Number(row.quantity || 0) > 0,
    );

    if (!validRows.length) {
      alert('Please add at least one material with quantity');
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/project/dealer-order`,
        {
          ...orderForm,
          branchName: selectedDealer?.city || '',
          items: validRows,
        },
        { headers: headers() },
      );

      alert('Dealer order created successfully');

      setOrderForm({
        dealerId: '',
        paymentType: 'CASH',
        creditDueDate: '',
        expectedDeliveryAt: '',
        assignedStaffName: '',
        assignedStaffPhone: '',
        remarks: '',
      });

      setOrderRows([{ materialId: '', quantity: '', discountAmount: '0', remarks: '' }]);
      await refreshAll();
      setActiveTab('orders');
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to create dealer order');
    }
  };

  const openOrder = async (id: number) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/project/dealer-order/${id}`, {
        headers: headers(),
      });

      setSelectedOrder(res.data);
      const invoiceRes = await axios.get(
  `${API_BASE_URL}/project/dealer-order/${id}/invoices`,
  {
    headers: headers(),
  },
);

setSelectedOrderInvoices(invoiceRes.data || null);
      setAdminStatus(res.data?.order?.status || '');
      setAdminExpectedDeliveryAt(
        res.data?.order?.expectedDeliveryAt
          ? String(res.data.order.expectedDeliveryAt).slice(0, 16)
          : '',
      );
      setAdminRemarks(res.data?.order?.adminRemarks || '');
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to open dealer order');
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder?.order?.id || !adminStatus) return;

    try {
      await axios.patch(
        `${API_BASE_URL}/project/dealer-order/${selectedOrder.order.id}/status`,
        {
          status: adminStatus,
          expectedDeliveryAt: adminExpectedDeliveryAt || undefined,
          adminRemarks,
        },
        { headers: headers() },
      );

      alert('Order status updated');
      await openOrder(selectedOrder.order.id);
      fetchOrders();
      fetchAnalytics();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to update order status');
    }
  };

  const hideOrRestoreOrder = async (order: DealerOrder, restore = false) => {
    const reason = window.prompt(
      restore ? 'Reason for restoring this order?' : 'Reason for hiding this order?',
      restore ? 'Valid order' : 'Test / duplicate order',
    );

    if (reason === null) return;

    try {
      await axios.patch(
        `${API_BASE_URL}/project/dealer-order/${order.id}/${
          restore ? 'restore' : 'hide'
        }`,
        { reason },
        { headers: headers() },
      );

      alert(restore ? 'Order restored' : 'Order hidden');
      setSelectedOrder(null);
      fetchOrders();
      fetchAnalytics();
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to update order');
    }
  };

  const addPayment = async () => {
  if (!selectedOrder?.order?.id || !paymentForm.amount) {
    alert('Payment amount required');
    return;
  }

  try {
    setPaymentReceiptUploading(true);

    let receiptUrl = paymentForm.receiptUrl;

    if (paymentReceiptFile) {
      const token = localStorage.getItem('token');

      receiptUrl = await uploadPreparedFile({
        file: paymentReceiptFile,
        endpoint: `${API_BASE_URL}/project/dealer-payment-receipt/upload`,
        token,
        fieldName: 'files',
      });
    }

    await axios.post(
      `${API_BASE_URL}/project/dealer-payment`,
      {
        dealerOrderId: selectedOrder.order.id,
        ...paymentForm,
        receiptUrl,
      },
      { headers: headers() },
    );

    alert('Payment added');

    setPaymentForm({
      amount: '',
      paymentMode: 'ONLINE',
      transactionId: '',
      receiptUrl: '',
      remarks: '',
    });
    setPaymentReceiptFile(null);

    await openOrder(selectedOrder.order.id);
    fetchOrders();
    fetchAnalytics();
  } catch (error: any) {
    console.error(error);
    alert(error?.message || error?.response?.data?.message || 'Failed to add payment');
  } finally {
    setPaymentReceiptUploading(false);
  }
};

const updateDealerPaymentStatus = async (
  paymentId: number,
  status: 'APPROVED' | 'REJECTED',
) => {
  const approvalNote = window.prompt(
    status === 'APPROVED'
      ? 'Approval note optional'
      : 'Reason for rejection',
    status === 'APPROVED' ? 'Payment verified' : '',
  );

  if (approvalNote === null) return;

  try {
    await axios.patch(
      `${API_BASE_URL}/dealer/payments/${paymentId}/approve`,
      {
        status,
        approvalNote,
      },
      { headers: headers() },
    );

    alert(`Payment ${status.toLowerCase()} successfully`);

    if (selectedOrder?.order?.id) {
      await openOrder(selectedOrder.order.id);
    }

    fetchOrders();
    fetchAnalytics();
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to update payment');
  }
};

  const addComment = async () => {
    if (!selectedOrder?.order?.id || !commentText.trim()) {
      alert('Comment is required');
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/project/dealer-comment`,
        {
          dealerOrderId: selectedOrder.order.id,
          comment: commentText,
          commentType: 'GENERAL',
        },
        { headers: headers() },
      );

      setCommentText('');
      await openOrder(selectedOrder.order.id);
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Failed to add comment');
    }
  };

  const applyFilters = () => {
    setDealerPage(1);
    setCatalogPage(1);
    setOrderPage(1);
    refreshAll();
  };

  const resetFilters = () => {
    setDealerSearch('');
    setDealerBranch('');
    setCatalogSearch('');
    setOrderSearch('');
    setStatusFilter('');
    setShowHiddenDealers(false);
    setShowHiddenOrders(false);
    setDealerPage(1);
    setCatalogPage(1);
    setOrderPage(1);
    setTimeout(refreshAll, 100);
  };

  const sendDealerNotification = async () => {
  if (!notificationForm.dealerId || !notificationForm.title || !notificationForm.message) {
    alert('Dealer, title and message are required');
    return;
  }

  try {
    await axios.post(
      `${API_BASE_URL}/project/dealer-notification`,
      notificationForm,
      { headers: headers() },
    );

    alert('Notification sent');

    setNotificationForm({
      dealerId: '',
      title: '',
      message: '',
      notificationType: 'GENERAL',
    });

    fetchNotifications();
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to send notification');
  }
};

const addMonthlyRequirement = async () => {
  if (!monthlyForm.dealerId || !monthlyForm.materialId || !monthlyForm.requirementMonth || !monthlyForm.expectedQuantity) {
    alert('Dealer, material, month and quantity are required');
    return;
  }

  try {
    await axios.post(
      `${API_BASE_URL}/project/dealer-monthly-requirement`,
      monthlyForm,
      { headers: headers() },
    );

    alert('Monthly requirement added');

    setMonthlyForm({
      dealerId: '',
      materialId: '',
      requirementMonth: '',
      expectedQuantity: '',
      remarks: '',
    });

    fetchMonthlyRequirements();
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to add monthly requirement');
  }
};

const hideOrRestoreMonthlyRequirement = async (
  item: DealerMonthlyRequirement,
  restore = false,
) => {
  const reason = window.prompt(
    restore ? 'Reason for restoring?' : 'Reason for hiding?',
    restore ? 'Valid requirement' : 'Test / wrong entry',
  );

  if (reason === null) return;

  try {
    await axios.patch(
      `${API_BASE_URL}/project/dealer-monthly-requirement/${item.id}/${restore ? 'restore' : 'hide'}`,
      { reason },
      { headers: headers() },
    );

    fetchMonthlyRequirements();
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to update requirement');
  }
};

const updateDealerComplaintStatus = async (
  id: number,
  status: string,
  adminRemarks = '',
) => {
  try {
    await axios.patch(
      `${API_BASE_URL}/dealer/complaints/${id}`,
      { status, adminRemarks },
      { headers: headers() },
    );

    alert('Complaint updated');
    fetchDealerComplaints();
  } catch (error: any) {
    console.error(error);
    alert(error?.response?.data?.message || 'Failed to update complaint');
  }
};

const creditDueDateValue = orderForm.creditDueDate
  ? dayjs(orderForm.creditDueDate)
  : null;

const orderDeliveryDateValue = orderForm.expectedDeliveryAt
  ? dayjs(orderForm.expectedDeliveryAt)
  : null;

const orderDeliveryTimeValue = orderForm.expectedDeliveryAt
  ? dayjs(orderForm.expectedDeliveryAt)
  : null;

const adminDeliveryDateValue = adminExpectedDeliveryAt
  ? dayjs(adminExpectedDeliveryAt)
  : null;

const adminDeliveryTimeValue = adminExpectedDeliveryAt
  ? dayjs(adminExpectedDeliveryAt)
  : null;

const updateOrderCreditDate = (newDate: Dayjs | null) => {
  setOrderForm((prev) => ({
    ...prev,
    creditDueDate: newDate ? newDate.format('YYYY-MM-DD') : '',
  }));
};

const updateOrderDeliveryDatePart = (newDate: Dayjs | null) => {
  if (!newDate) {
    setOrderForm((prev) => ({
      ...prev,
      expectedDeliveryAt: '',
    }));
    return;
  }

  const base = orderForm.expectedDeliveryAt
    ? dayjs(orderForm.expectedDeliveryAt)
    : dayjs();

  const merged = newDate
    .hour(base.hour())
    .minute(base.minute())
    .second(0)
    .millisecond(0);

  setOrderForm((prev) => ({
    ...prev,
    expectedDeliveryAt: merged.format('YYYY-MM-DDTHH:mm'),
  }));
};

const updateOrderDeliveryTimePart = (newTime: Dayjs | null) => {
  if (!newTime) return;

  const base = orderForm.expectedDeliveryAt
    ? dayjs(orderForm.expectedDeliveryAt)
    : dayjs();

  const merged = base
    .hour(newTime.hour())
    .minute(newTime.minute())
    .second(0)
    .millisecond(0);

  setOrderForm((prev) => ({
    ...prev,
    expectedDeliveryAt: merged.format('YYYY-MM-DDTHH:mm'),
  }));
};

const updateAdminDeliveryDatePart = (newDate: Dayjs | null) => {
  if (!newDate) {
    setAdminExpectedDeliveryAt('');
    return;
  }

  const base = adminExpectedDeliveryAt
    ? dayjs(adminExpectedDeliveryAt)
    : dayjs();

  const merged = newDate
    .hour(base.hour())
    .minute(base.minute())
    .second(0)
    .millisecond(0);

  setAdminExpectedDeliveryAt(merged.format('YYYY-MM-DDTHH:mm'));
};

const updateAdminDeliveryTimePart = (newTime: Dayjs | null) => {
  if (!newTime) return;

  const base = adminExpectedDeliveryAt
    ? dayjs(adminExpectedDeliveryAt)
    : dayjs();

  const merged = base
    .hour(newTime.hour())
    .minute(newTime.minute())
    .second(0)
    .millisecond(0);

  setAdminExpectedDeliveryAt(merged.format('YYYY-MM-DDTHH:mm'));
};

  return (
    <div className="w-full max-w-full overflow-x-hidden px-3 pb-6 sm:mx-auto sm:max-w-7xl sm:px-4">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">Trading Account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Dealer orders, catalog, payments, delivery status and trading analytics.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-xs text-gray-500">Orders</p>
          <p className="text-xl font-bold">{analytics.totalOrders || 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-xs text-gray-500">Sales</p>
          <p className="text-xl font-bold">{money(analytics.totalSales)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-xs text-gray-500">Paid</p>
          <p className="text-xl font-bold text-green-700">
            {money(analytics.totalPaid)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-xl font-bold text-red-700">
            {money(analytics.totalPending)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-xs text-gray-500">Overdue Credit</p>
          <p className="text-xl font-bold text-orange-700">
            {analytics.overdueCreditOrders || 0}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
  ['dealers', 'Dealer Master'],
  ['catalog', 'Catalog & Order'],
  ['orders', 'Orders / Payments / Comments'],
  ['notifications', 'Notifications'],
  ['monthly', 'Monthly Planning'],
  ['credit', 'Credit Reminders'],
  ['ledger', 'Dealer Ledger'],
  ['complaints', 'Dealer Complaints'],
].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              activeTab === key
                ? 'bg-blue-600 text-white'
                : 'border bg-white text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}

        <button
          onClick={refreshAll}
          className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="grid gap-3 md:grid-cols-3">
          {activeTab === 'dealers' && (
            <>
              <input
                placeholder="Search dealer name / phone / GST"
                value={dealerSearch}
                onChange={(e) => setDealerSearch(e.target.value)}
                className="rounded-xl border p-3"
              />
              <input
                placeholder="Branch / City"
                value={dealerBranch}
                onChange={(e) => setDealerBranch(e.target.value)}
                className="rounded-xl border p-3"
              />
              <label className="flex items-center gap-2 rounded-xl border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={showHiddenDealers}
                  onChange={(e) => setShowHiddenDealers(e.target.checked)}
                />
                View Hidden Dealers
              </label>
            </>
          )}

          {activeTab === 'catalog' && (
            <input
              placeholder="Search material / category / brand"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="rounded-xl border p-3 md:col-span-2"
            />
          )}

          {activeTab === 'orders' && (
            <>
              <input
                placeholder="Search order / dealer / phone"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="rounded-xl border p-3"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border p-3"
              >
                <option value="">All Order Status</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="PARTIALLY_ACCEPTED">Partially Accepted</option>
                <option value="POSTPONED">Postponed</option>
                <option value="STOCK_OUT">Stock Out</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <label className="flex items-center gap-2 rounded-xl border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={showHiddenOrders}
                  onChange={(e) => setShowHiddenOrders(e.target.checked)}
                />
                View Hidden Orders
              </label>
            </>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={applyFilters}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Apply Filters
          </button>
          <button
            onClick={resetFilters}
            className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold"
          >
            Reset
          </button>
        </div>
      </div>

      {loading && <div className="rounded-2xl bg-white p-4 shadow">Loading...</div>}

      {activeTab === 'dealers' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-lg font-bold text-gray-800">
              {editingDealerId ? 'Edit Dealer' : 'Add Dealer'}
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input placeholder="Dealer Name" value={dealerForm.vendorName} onChange={(e) => setDealerForm({ ...dealerForm, vendorName: e.target.value })} className="rounded-xl border p-3" />
              <input placeholder="Contact Person" value={dealerForm.contactPerson} onChange={(e) => setDealerForm({ ...dealerForm, contactPerson: e.target.value })} className="rounded-xl border p-3" />
              <input placeholder="Phone" value={dealerForm.phone} onChange={(e) => setDealerForm({ ...dealerForm, phone: e.target.value })} className="rounded-xl border p-3" />
              <input placeholder="Email" value={dealerForm.email} onChange={(e) => setDealerForm({ ...dealerForm, email: e.target.value })} className="rounded-xl border p-3" />
              <input placeholder="GST Number" value={dealerForm.gstNumber} onChange={(e) => setDealerForm({ ...dealerForm, gstNumber: e.target.value })} className="rounded-xl border p-3" />
              <input placeholder="Branch / City" value={dealerForm.city} onChange={(e) => setDealerForm({ ...dealerForm, city: e.target.value })} className="rounded-xl border p-3" />
              <input placeholder="State" value={dealerForm.state} onChange={(e) => setDealerForm({ ...dealerForm, state: e.target.value })} className="rounded-xl border p-3" />
              <input type="number" placeholder="Opening Balance" value={dealerForm.openingBalance} onChange={(e) => setDealerForm({ ...dealerForm, openingBalance: e.target.value })} className="rounded-xl border p-3" />
            </div>

            <textarea placeholder="Address" value={dealerForm.address} onChange={(e) => setDealerForm({ ...dealerForm, address: e.target.value })} className="mt-3 w-full rounded-xl border p-3" />
            <textarea placeholder="Remarks" value={dealerForm.remarks} onChange={(e) => setDealerForm({ ...dealerForm, remarks: e.target.value })} className="mt-3 w-full rounded-xl border p-3" />

            <button onClick={saveDealer} className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">
              {editingDealerId ? 'Update Dealer' : 'Add Dealer'}
            </button>

            {editingDealerId && (
              <button onClick={resetDealerForm} className="ml-3 mt-4 rounded-xl bg-gray-600 px-5 py-3 font-semibold text-white">
                Cancel Edit
              </button>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-lg font-bold text-gray-800">Dealer List</h2>

            <div className="mt-4 space-y-3">
              {dealers.length === 0 ? (
                <p className="text-sm text-gray-500">No dealers found</p>
              ) : (
                dealers.map((dealer) => (
                  <div key={dealer.id} className={`rounded-xl border p-4 ${dealer.isActive === false ? 'bg-gray-100 opacity-70' : ''}`}>
                    <p className="font-bold">{dealer.vendorName}</p>
                    <p className="text-sm text-gray-500">{dealer.contactPerson || '-'} | {dealer.phone || '-'}</p>
                    <p className="text-sm text-gray-500">{dealer.city || '-'} | GST: {dealer.gstNumber || '-'}</p>
                    <p className="text-sm text-gray-500">Opening Balance: {money(dealer.openingBalance)}</p>

                    <div className="mt-3 flex gap-2">
                      <button onClick={() => startEditDealer(dealer)} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white">
                        Edit
                      </button>
                      <button onClick={() => toggleDealer(dealer)} className={`rounded-xl px-3 py-2 text-sm font-semibold text-white ${dealer.isActive === false ? 'bg-green-600' : 'bg-red-600'}`}>
                        {dealer.isActive === false ? 'Restore' : 'Hide'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Pagination page={dealerPage} totalPages={dealerTotalPages} setPage={setDealerPage} />
          </div>
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="grid min-w-0 gap-5 xl:grid-cols-2">
          <div className="min-w-0 rounded-2xl bg-white p-4 shadow sm:p-5">
            <h2 className="text-lg font-bold text-gray-800">Dealer Catalog</h2>

            <div className="mt-4 space-y-3">
              {catalog.map((item) => (
                <div key={item.id} className="rounded-xl border p-4">
                  <p className="break-words font-bold">{item.name}</p>
                  <p className="break-words text-sm text-gray-500">{item.category || '-'} | {item.brand || '-'} | {item.unit || '-'}</p>
                  <p className="text-sm text-blue-700">Without GST: {money(item.sellingRate)} | With GST: {money(item.sellingRateWithGst)}</p>
                  <p className="text-sm text-green-700">Stock Available: {Number(item.availableQuantity || 0)}</p>
                </div>
              ))}
            </div>

            <Pagination page={catalogPage} totalPages={catalogTotalPages} setPage={setCatalogPage} />
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-lg font-bold text-gray-800">Create Dealer Order</h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select value={orderForm.dealerId} onChange={(e) => setOrderForm({ ...orderForm, dealerId: e.target.value })} className="rounded-xl border p-3">
                <option value="">Select Dealer</option>
                {dealers.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>{dealer.vendorName} - {dealer.city || ''}</option>
                ))}
              </select>

              <select value={orderForm.paymentType} onChange={(e) => setOrderForm({ ...orderForm, paymentType: e.target.value })} className="rounded-xl border p-3">
                <option value="CASH">Cash</option>
                <option value="CREDIT">Credit</option>
                <option value="ONLINE">Online</option>
                <option value="CHEQUE">Cheque</option>
              </select>

              <LocalizationProvider dateAdapter={AdapterDayjs}>
  <DatePicker
    label="Credit Due Date"
    value={creditDueDateValue}
    onChange={updateOrderCreditDate}
    slotProps={{
      textField: {
        fullWidth: true,
      },
    }}
  />
</LocalizationProvider>

              <LocalizationProvider dateAdapter={AdapterDayjs}>
  <div className="grid gap-3 md:grid-cols-2">
    <DatePicker
      label="Expected Delivery Date"
      value={orderDeliveryDateValue}
      onChange={updateOrderDeliveryDatePart}
      slotProps={{
        textField: {
          fullWidth: true,
        },
      }}
    />

    <MobileTimePicker
      label="Expected Delivery Time"
      value={orderDeliveryTimeValue}
      onChange={updateOrderDeliveryTimePart}
      ampm
      ampmInClock
      slotProps={{
        textField: {
          fullWidth: true,
        },
      }}
    />
  </div>
</LocalizationProvider>

              <input placeholder="Assigned Staff Name" value={orderForm.assignedStaffName} onChange={(e) => setOrderForm({ ...orderForm, assignedStaffName: e.target.value })} className="rounded-xl border p-3" />
              <input placeholder="Assigned Staff Phone" value={orderForm.assignedStaffPhone} onChange={(e) => setOrderForm({ ...orderForm, assignedStaffPhone: e.target.value })} className="rounded-xl border p-3" />
            </div>

            <textarea placeholder="Order Remarks" value={orderForm.remarks} onChange={(e) => setOrderForm({ ...orderForm, remarks: e.target.value })} className="mt-3 w-full rounded-xl border p-3" />

            <div className="mt-4 space-y-3">
              {orderRows.map((row, index) => {
                const item = catalog.find((mat) => String(mat.id) === String(row.materialId));

                return (
                  <div key={index} className="rounded-xl border p-3">
                    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <select value={row.materialId} onChange={(e) => updateOrderRow(index, 'materialId', e.target.value)} className="min-w-0 rounded-xl border p-3">
                        <option value="">Select Material</option>
                        {catalog.map((mat) => (
                          <option key={mat.id} value={mat.id}>{mat.name} - {money(mat.sellingRateWithGst)}</option>
                        ))}
                      </select>

                      <input type="number" placeholder="Quantity" value={row.quantity} onChange={(e) => updateOrderRow(index, 'quantity', e.target.value)} className="rounded-xl border p-3" />
                      <input type="number" placeholder="Discount" value={row.discountAmount} onChange={(e) => updateOrderRow(index, 'discountAmount', e.target.value)} className="rounded-xl border p-3" />
                      <button onClick={() => removeOrderRow(index)} className="rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">Remove</button>
                    </div>

                    {item && <p className="mt-2 text-xs text-gray-500">Rate without GST {money(item.sellingRate)} | GST {item.gstPercent || 0}% | Stock {item.availableQuantity || 0}</p>}
                  </div>
                );
              })}
            </div>

            <button onClick={addOrderRow} className="mt-3 rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white">+ Add Material</button>

            <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm">
              <p>Subtotal: {money(orderPreview.subtotal)}</p>
              <p>Discount: {money(orderPreview.discount)}</p>
              <p>GST: {money(orderPreview.gst)}</p>
              <p className="font-bold">Total: {money(orderPreview.total)}</p>
            </div>

            <button onClick={createDealerOrder} className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Create Dealer Order</button>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="grid min-w-0 gap-5 xl:grid-cols-2">
          <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow sm:p-5">
            <h2 className="text-lg font-bold">Dealer Orders</h2>

            <div className="mt-4 space-y-3">
              {orders.map((order) => (
                <div key={order.id} className={`rounded-xl border p-4 ${order.isHidden ? 'bg-gray-100 opacity-70' : 'bg-white'}`}>
                  <button onClick={() => openOrder(order.id)} className="block w-full text-left">
                    <p className="font-bold">{order.orderNumber || `Order #${order.id}`} - {order.dealerName}</p>
                    <p className="text-sm text-gray-500">{order.status} | {order.paymentType} | {order.branchName || '-'}</p>
                    <p className="text-sm">Total {money(order.totalAmount)} | Paid {money(order.paidAmount)} | Pending {money(order.pendingAmount)}</p>
                    {order.expectedDeliveryAt && <p className="text-xs text-blue-700">Delivery: {new Date(order.expectedDeliveryAt).toLocaleString('en-IN')}</p>}
                  </button>

                  <button onClick={() => hideOrRestoreOrder(order, !!order.isHidden)} className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold text-white ${order.isHidden ? 'bg-green-600' : 'bg-red-600'}`}>
                    {order.isHidden ? 'Restore Order' : 'Hide Order'}
                  </button>
                </div>
              ))}
            </div>

            <Pagination page={orderPage} totalPages={orderTotalPages} setPage={setOrderPage} />
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            {!selectedOrder ? (
              <p className="text-sm text-gray-500">Select an order to view details</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold">{selectedOrder.order?.orderNumber} - {selectedOrder.order?.dealerName}</h2>
                  <p className="text-sm text-gray-500">Total {money(selectedOrder.order?.totalAmount)} | Pending {money(selectedOrder.order?.pendingAmount)}</p>

                  <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm">
  <p className="font-semibold text-gray-700">
    Assigned Staff
  </p>
  <p className="text-gray-600">
    {selectedOrder.order?.assignedStaffName || '-'} |{' '}
    {selectedOrder.order?.assignedStaffPhone || '-'}
  </p>

  {selectedOrder.order?.assignedStaffPhone && (
    <a
      href={`tel:${selectedOrder.order.assignedStaffPhone}`}
      className="mt-2 inline-block rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white"
    >
      Call Staff
    </a>
  )}
</div>

                  <div className="mt-3 flex flex-wrap gap-2">
  <button
    onClick={generateDealerPi}
    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
  >
    Generate PI
  </button>

  <button
    onClick={generateDealerFinalInvoice}
    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
  >
    Generate Final Invoice
  </button>
</div>
                </div>

                <div className="rounded-xl border p-3">
                  <h3 className="font-bold">Items</h3>
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="mt-2 rounded-lg bg-gray-50 p-3 text-sm">
                      <p className="font-semibold">{item.materialName}</p>
                      <p>Qty {item.quantity} | Rate {money(item.sellingRate)} | Discount {money(item.discountAmount)} | Total {money(item.totalAmount)}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border p-3">
                  <h3 className="font-bold">Update Status</h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <select value={adminStatus} onChange={(e) => setAdminStatus(e.target.value)} className="rounded-xl border p-3">
                      <option value="SUBMITTED">Submitted</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="PARTIALLY_ACCEPTED">Partially Accepted</option>
                      <option value="POSTPONED">Postponed</option>
                      <option value="STOCK_OUT">Stock Out</option>
                      <option value="DISPATCHED">Dispatched</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
  <div className="grid gap-3 md:grid-cols-2">
    <DatePicker
      label="Expected Delivery Date"
      value={adminDeliveryDateValue}
      onChange={updateAdminDeliveryDatePart}
      slotProps={{
        textField: {
          fullWidth: true,
        },
      }}
    />

    <MobileTimePicker
      label="Expected Delivery Time"
      value={adminDeliveryTimeValue}
      onChange={updateAdminDeliveryTimePart}
      ampm
      ampmInClock
      slotProps={{
        textField: {
          fullWidth: true,
        },
      }}
    />
  </div>
</LocalizationProvider>
                  </div>

                  <textarea placeholder="Admin remarks" value={adminRemarks} onChange={(e) => setAdminRemarks(e.target.value)} className="mt-3 w-full rounded-xl border p-3" />
                  <button onClick={updateOrderStatus} className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Save Status</button>
                </div>

                <div className="rounded-xl border p-3">
                  <h3 className="font-bold">Add Payment</h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input type="number" placeholder="Amount" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="rounded-xl border p-3" />
                    <select value={paymentForm.paymentMode} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })} className="rounded-xl border p-3">
                      <option value="CASH">Cash</option>
                      <option value="ONLINE">Online</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                    <input placeholder="Transaction ID" value={paymentForm.transactionId} onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })} className="rounded-xl border p-3" />
                    <input
  type="file"
  accept="image/*,application/pdf"
  onChange={(e) =>
    setPaymentReceiptFile(e.target.files?.[0] || null)
  }
  className="rounded-xl border p-3"
/>
                  </div>
                  <textarea placeholder="Payment remarks" value={paymentForm.remarks} onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })} className="mt-3 w-full rounded-xl border p-3" />
                  <button onClick={addPayment} className="mt-3 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white">{paymentReceiptUploading ? 'Saving Payment...' : 'Add Payment'}</button>
                </div>

                <div className="rounded-xl border p-3">
  <h3 className="font-bold">Payment History</h3>

  <div className="mt-3 space-y-2">
    {selectedOrder.payments?.length ? (
      selectedOrder.payments.map((payment: any) => (
        <div
          key={payment.id}
          className="rounded-lg bg-gray-50 p-3 text-sm"
        >
          <p className="font-semibold">
            Amount: {money(payment.amount)} | {payment.paymentMode || '-'}
          </p>

          <p className="text-gray-500">
            Status: {payment.status || '-'} | Transaction:{' '}
            {payment.transactionId || '-'}
          </p>

          {payment.remarks && (
            <p className="mt-1 break-words text-gray-500">
              Remarks: {payment.remarks}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
  <button
    onClick={() => updateDealerPaymentStatus(payment.id, 'APPROVED')}
    className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white"
  >
    Approve
  </button>

  <button
    onClick={() => updateDealerPaymentStatus(payment.id, 'REJECTED')}
    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white"
  >
    Reject
  </button>
</div>

{payment.approvalNote && (
  <p className="mt-2 break-words text-xs text-gray-500">
    Approval Note: {payment.approvalNote}
  </p>
)}

          {payment.receiptUrl ? (
            <a
              href={payment.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
            >
              View Receipt
            </a>
          ) : (
            <p className="mt-2 text-xs text-gray-400">
              No receipt uploaded
            </p>
          )}
        </div>
      ))
    ) : (
      <p className="text-sm text-gray-500">
        No payments added yet.
      </p>
    )}
  </div>
</div>

                <div className="rounded-xl border p-3">
                  <h3 className="font-bold">Comments</h3>
                  <textarea placeholder="Write comment / complaint" value={commentText} onChange={(e) => setCommentText(e.target.value)} className="mt-3 w-full rounded-xl border p-3" />
                  <button onClick={addComment} className="mt-3 rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white">Add Comment</button>

                  <div className="mt-3 space-y-2">
                    {selectedOrder.comments?.map((comment: any) => (
                      <div key={comment.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                        <p>{comment.comment}</p>
                        <p className="text-xs text-gray-500">{comment.createdByName || '-'} | {comment.createdByRole || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border p-3">
  <h3 className="font-bold">Generated PI / Final Invoices</h3>

  <div className="mt-3 space-y-2">
    {selectedOrderInvoices?.proformaInvoices?.length ? (
      selectedOrderInvoices.proformaInvoices.map((pi: any) => (
        <div
          key={pi.id}
          className="rounded-lg bg-blue-50 p-3 text-sm"
        >
          <p className="font-semibold">
            PI: {pi.invoiceNumber || `#${pi.id}`}
          </p>
          <p>
            Amount: {money(pi.totalAmount)} | Status:{' '}
            {pi.status || '-'}
          </p>
        </div>
      ))
    ) : (
      <p className="text-sm text-gray-500">
        No PI generated yet.
      </p>
    )}

    {selectedOrderInvoices?.finalInvoices?.length ? (
      selectedOrderInvoices.finalInvoices.map((invoice: any) => (
        <div
          key={invoice.id}
          className="rounded-lg bg-green-50 p-3 text-sm"
        >
          <p className="font-semibold">
            Final Invoice:{' '}
            {invoice.invoiceNumber || `#${invoice.id}`}
          </p>
          <p>
            Amount: {money(invoice.totalAmount)} | Paid:{' '}
            {money(invoice.paidAmount)} | Pending:{' '}
            {money(invoice.pendingAmount)}
          </p>
        </div>
      ))
    ) : (
      <p className="text-sm text-gray-500">
        No final invoice generated yet.
      </p>
    )}
  </div>
</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
  <div className="grid min-w-0 gap-5 xl:grid-cols-2">
    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow sm:p-5">
      <h2 className="text-lg font-bold text-gray-800">Send Dealer Notification</h2>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <select
          value={notificationForm.dealerId}
          onChange={(e) => setNotificationForm({ ...notificationForm, dealerId: e.target.value })}
          className="w-full rounded-xl border p-3"
        >
          <option value="">Select Dealer</option>
          {dealers.map((dealer) => (
            <option key={dealer.id} value={dealer.id}>
              {dealer.vendorName}
            </option>
          ))}
        </select>

        <select
          value={notificationForm.notificationType}
          onChange={(e) => setNotificationForm({ ...notificationForm, notificationType: e.target.value })}
          className="w-full rounded-xl border p-3"
        >
          <option value="GENERAL">General</option>
          <option value="OFFER">Offer</option>
          <option value="PAYMENT">Payment</option>
          <option value="DELIVERY">Delivery</option>
        </select>

        <input
          placeholder="Title"
          value={notificationForm.title}
          onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
          className="w-full rounded-xl border p-3 md:col-span-2"
        />
      </div>

      <textarea
        placeholder="Message"
        value={notificationForm.message}
        onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
        className="mt-3 w-full rounded-xl border p-3"
      />

      <button
        onClick={sendDealerNotification}
        className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
      >
        Send Notification
      </button>
    </div>

    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow sm:p-5">
      <h2 className="text-lg font-bold text-gray-800">Notification History</h2>

      <div className="mt-4 space-y-3">
        {notifications.map((item) => (
          <div key={item.id} className="rounded-xl border p-4">
            <p className="break-words font-bold">{item.title}</p>
            <p className="text-sm text-gray-500">{item.dealerName} | {item.notificationType} | {item.status}</p>
            <p className="mt-2 break-words text-sm">{item.message}</p>
          </div>
        ))}
      </div>

      <Pagination page={notificationPage} totalPages={notificationTotalPages} setPage={setNotificationPage} />
    </div>
  </div>
)}

{activeTab === 'complaints' && (
  <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-gray-800">
          Dealer Complaints
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Complaints raised by dealers from Dealer Portal.
        </p>
      </div>

      <select
        value={complaintStatus}
        onChange={(e) => {
          setComplaintStatus(e.target.value);
          setComplaintPage(1);
        }}
        className="rounded-xl border p-3"
      >
        <option value="">All Status</option>
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
        <option value="CLOSED">Closed</option>
      </select>
    </div>

    <div className="mt-4 space-y-3">
      {dealerComplaints.length === 0 ? (
        <p className="text-sm text-gray-500">No dealer complaints found.</p>
      ) : (
        dealerComplaints.map((item) => (
          <div key={item.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="break-words font-bold">
                  #{item.id} - {item.subject}
                </p>
                <p className="text-sm text-gray-500">
                  Dealer ID: {item.dealerId}
                  {item.dealerOrderId ? ` | Order ID: ${item.dealerOrderId}` : ''}
                </p>
                <p className="mt-2 break-words text-sm">
                  {item.description}
                </p>
              </div>

              <div className="flex flex-col gap-2">
  <select
    value={item.status || 'OPEN'}
    onChange={(e) =>
      updateDealerComplaintStatus(
        item.id,
        e.target.value,
        item.adminRemarks || '',
      )
    }
    className="rounded-xl border p-2 text-sm"
  >
    <option value="OPEN">Open</option>
    <option value="IN_PROGRESS">In Progress</option>
    <option value="RESOLVED">Resolved</option>
    <option value="CLOSED">Closed</option>
  </select>

  <textarea
    placeholder="Staff response / remarks"
    defaultValue={item.adminRemarks || ''}
    onBlur={(e) =>
      updateDealerComplaintStatus(
        item.id,
        item.status || 'OPEN',
        e.target.value,
      )
    }
    className="rounded-xl border p-2 text-sm"
    rows={3}
  />
</div>
            </div>

            {Array.isArray(item.photoUrls) && item.photoUrls.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.photoUrls.map((url: string) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-20 w-20 overflow-hidden rounded-xl border bg-gray-50"
                  >
                    <img
                      src={url}
                      alt="Complaint"
                      className="h-full w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )}

            <p className="mt-3 text-xs text-gray-400">
              Created: {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : '-'}
            </p>
          </div>
        ))
      )}
    </div>

    <Pagination
      page={complaintPage}
      totalPages={complaintTotalPages}
      setPage={setComplaintPage}
    />
  </div>
)}

{activeTab === 'monthly' && (
  <div className="grid min-w-0 gap-5 xl:grid-cols-2">
    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow sm:p-5">
      <h2 className="text-lg font-bold text-gray-800">Add Monthly Requirement</h2>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <select
          value={monthlyForm.dealerId}
          onChange={(e) => setMonthlyForm({ ...monthlyForm, dealerId: e.target.value })}
          className="w-full rounded-xl border p-3"
        >
          <option value="">Select Dealer</option>
          {dealers.map((dealer) => (
            <option key={dealer.id} value={dealer.id}>
              {dealer.vendorName}
            </option>
          ))}
        </select>

        <select
          value={monthlyForm.materialId}
          onChange={(e) => setMonthlyForm({ ...monthlyForm, materialId: e.target.value })}
          className="w-full rounded-xl border p-3"
        >
          <option value="">Select Material</option>
          {catalog.map((material) => (
            <option key={material.id} value={material.id}>
              {material.name}
            </option>
          ))}
        </select>

        <input
          type="month"
          value={monthlyForm.requirementMonth}
          onChange={(e) => setMonthlyForm({ ...monthlyForm, requirementMonth: e.target.value })}
          className="w-full rounded-xl border p-3"
        />

        <input
          type="number"
          placeholder="Expected Quantity"
          value={monthlyForm.expectedQuantity}
          onChange={(e) => setMonthlyForm({ ...monthlyForm, expectedQuantity: e.target.value })}
          className="w-full rounded-xl border p-3"
        />
      </div>

      <textarea
        placeholder="Remarks"
        value={monthlyForm.remarks}
        onChange={(e) => setMonthlyForm({ ...monthlyForm, remarks: e.target.value })}
        className="mt-3 w-full rounded-xl border p-3"
      />

      <button
        onClick={addMonthlyRequirement}
        className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
      >
        Add Requirement
      </button>
    </div>

    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-800">Monthly Requirement List</h2>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showHiddenMonthly}
            onChange={(e) => setShowHiddenMonthly(e.target.checked)}
          />
          View Hidden
        </label>
      </div>

      <div className="mt-4 space-y-3">
        {monthlyRequirements.map((item) => (
          <div key={item.id} className={`rounded-xl border p-4 ${item.isHidden ? 'bg-gray-100 opacity-70' : ''}`}>
            <p className="break-words font-bold">{item.dealerName}</p>
            <p className="text-sm text-gray-500">{item.materialName} | {item.requirementMonth}</p>
            <p className="text-sm">Expected Qty: {item.expectedQuantity} {item.unit || ''}</p>
            {item.remarks && <p className="mt-1 break-words text-sm text-gray-500">{item.remarks}</p>}

            <button
              onClick={() => hideOrRestoreMonthlyRequirement(item, !!item.isHidden)}
              className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold text-white ${item.isHidden ? 'bg-green-600' : 'bg-red-600'}`}
            >
              {item.isHidden ? 'Restore' : 'Hide'}
            </button>
          </div>
        ))}
      </div>

      <Pagination page={monthlyPage} totalPages={monthlyTotalPages} setPage={setMonthlyPage} />
    </div>
  </div>
)}

{activeTab === 'credit' && (
  <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow sm:p-5">
    <h2 className="text-lg font-bold text-gray-800">Dealer Credit Reminders</h2>
    <p className="mt-1 text-sm text-gray-500">
      Credit dealer orders where due date is over and payment is still pending.
    </p>

    <div className="mt-4 space-y-3">
      {creditReminders.length === 0 ? (
        <p className="text-sm text-gray-500">No overdue dealer credit reminders.</p>
      ) : (
        creditReminders.map((order) => {
          const due = order.creditDueDate ? new Date(order.creditDueDate) : null;
          const daysOverdue = due
            ? Math.max(Math.floor((Date.now() - due.getTime()) / (1000 * 60 * 60 * 24)), 0)
            : 0;

          return (
            <div key={order.id} className="rounded-xl border p-4">
              <p className="break-words font-bold">{order.orderNumber} - {order.dealerName}</p>
              <p className="text-sm text-gray-500">Due Date: {due ? due.toLocaleDateString('en-IN') : '-'}</p>
              <p className="text-sm text-red-700">Pending: {money(order.pendingAmount)} | Overdue: {daysOverdue} day(s)</p>
              <button
  onClick={() => {
    openOrder(order.id);
    setActiveTab('orders');
  }}
  className="mt-3 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
>
  Open Order
</button>
            </div>
          );
        })
      )}
    </div>
  </div>
)}

{activeTab === 'ledger' && (
  <div className="grid min-w-0 gap-5 xl:grid-cols-2">
    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow sm:p-5">
      <h2 className="text-lg font-bold text-gray-800">
        Dealer Ledger / Transaction History
      </h2>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <select
          value={ledgerDealerId}
          onChange={(e) => setLedgerDealerId(e.target.value)}
          className="w-full rounded-xl border p-3"
        >
          <option value="">Select Dealer</option>
          {dealers.map((dealer) => (
            <option key={dealer.id} value={dealer.id}>
              {dealer.vendorName}
            </option>
          ))}
        </select>

        <button
          onClick={fetchDealerLedger}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
        >
          Load Ledger
        </button>
      </div>

      {!dealerLedger ? (
        <p className="mt-4 text-sm text-gray-500">
          Select a dealer to view orders, invoices, payments and material history.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border p-4">
            <p className="font-bold">
              {dealerLedger.dealer?.dealerName}
            </p>
            <p className="text-sm text-gray-500">
              {dealerLedger.dealer?.phone || '-'} | GST:{' '}
              {dealerLedger.dealer?.gstNumber || '-'}
            </p>
            <p className="text-sm text-gray-500">
              {dealerLedger.dealer?.city || '-'} | Opening Balance:{' '}
              {money(dealerLedger.dealer?.openingBalance)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-xs text-gray-500">Total Orders</p>
              <p className="text-lg font-bold">
                {dealerLedger.summary?.totalOrders || 0}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-xs text-gray-500">Order Value</p>
              <p className="text-lg font-bold">
                {money(dealerLedger.summary?.totalOrderValue)}
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-xs text-gray-500">Paid</p>
              <p className="text-lg font-bold text-green-700">
                {money(dealerLedger.summary?.totalPaid)}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-lg font-bold text-red-700">
                {money(dealerLedger.summary?.totalPending)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>

    {dealerLedger && (
      <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow sm:p-5">
        <h2 className="text-lg font-bold text-gray-800">
          Material Summary
        </h2>

        <div className="mt-4 space-y-3">
          {dealerLedger.materialSummary?.length === 0 ? (
            <p className="text-sm text-gray-500">
              No material history found.
            </p>
          ) : (
            dealerLedger.materialSummary?.map((item: any) => (
              <div key={item.materialId} className="rounded-xl border p-4">
                <p className="break-words font-bold">
                  {item.materialName}
                </p>
                <p className="text-sm text-gray-500">
                  {item.category || '-'} | {item.brand || '-'}
                </p>
                <p className="text-sm">
                  Qty: {item.totalQuantity} {item.unit || ''} | Value:{' '}
                  {money(item.totalAmount)}
                </p>
              </div>
            ))
          )}
        </div>

        <h2 className="mt-6 text-lg font-bold text-gray-800">
          Transaction Timeline
        </h2>

        <div className="mt-4 space-y-3">
          {dealerLedger.timeline?.map((entry: any, index: number) => (
            <div key={`${entry.type}-${entry.referenceId}-${index}`} className="rounded-xl border p-4">
              <p className="break-words font-bold">
                {entry.title}
              </p>
              <p className="text-sm text-gray-500">
                {entry.type} | {entry.status || '-'} |{' '}
                {entry.date
                  ? new Date(entry.date).toLocaleString('en-IN')
                  : '-'}
              </p>
              <p className="text-sm">
                Amount: {money(entry.amount)}
              </p>
              <p className="break-words text-sm text-gray-500">
                {entry.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  setPage,
}: {
  page: number;
  totalPages: number;
  setPage: (value: number) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
      <p className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setPage(Math.max(page - 1, 1))}
          disabled={page <= 1}
          className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Previous
        </button>

        <button
          onClick={() => setPage(Math.min(page + 1, totalPages))}
          disabled={page >= totalPages}
          className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Next
        </button>
      </div>

      
    </div>
  );
}
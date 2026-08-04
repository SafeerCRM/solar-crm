'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import axios from 'axios';
import TextField from '@mui/material/TextField';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type TabType =
  | 'OVERVIEW'
  | 'FIRMS'
  | 'BILLS'
  | 'PAYMENTS'
  | 'PURCHASE_ORDERS';

type VendorCompany = {
  id: number;
  companyName: string;
  legalName?: string;
  gstNumber?: string;
  panNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  remarks?: string;
  isActive?: boolean;
  isHidden?: boolean;
};

type Vendor = {
  id: number;
  vendorName: string;
  firmName?: string;
  contactPerson?: string;
  phone?: string;
  gstNumber?: string;
  materialCategory?: string;
  isActive?: boolean;
  canSellToUs?: boolean;
};

type PurchaseOrder = {
  id: number;
  poNumber?: string;
  vendorId?: number;
  vendorName?: string;
  projectId?: number;
  status?: string;
  subtotalAmount?: number;
  gstAmount?: number;
  totalAmount?: number;
  orderDate?: string;
  expectedDeliveryDate?: string;
  createdAt?: string;
};

type VendorBill = {
  id: number;
  companyId: number;
  companyName: string;
  vendorId: number;
  vendorName: string;
  purchaseOrderId?: number;
  purchaseOrderNumber?: string;
  projectId?: number;
  branchName?: string;
  billNumber: string;
  billDate: string;
  dueDate?: string;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status:
    | 'UNPAID'
    | 'PARTIALLY_PAID'
    | 'PAID'
    | 'CANCELLED';
  remarks?: string;
  createdAt?: string;
};

type VendorPayment = {
  id: number;
  companyId: number;
  companyName: string;
  vendorId: number;
  vendorName: string;
  vendorBillId?: number;
  billNumber?: string;
  purchaseOrderId?: number;
  purchaseOrderNumber?: string;
  paymentDate: string;
  amount: number;
  paymentMode: string;
  transactionId?: string;
  bankName?: string;
  remarks?: string;
  createdAt?: string;
};

type VendorDocument = {
  id: number;
  documentType: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
  remarks?: string;
  createdAt?: string;
};

type PaymentReceipt = {
  id: number;
  receiptType: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
  remarks?: string;
  createdAt?: string;
};

type BillSummary = {
  totalBills: number;
  totalBillAmount: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
};

type PaymentSummary = {
  totalPayments: number;
  totalPaidAmount: number;
};

const initialCompanyForm = {
  companyName: '',
  legalName: '',
  gstNumber: '',
  panNumber: '',
  email: '',
  phone: '',
  alternatePhone: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
  bankName: '',
  bankAccountName: '',
  bankAccountNumber: '',
  bankIfsc: '',
  upiId: '',
  remarks: '',
  isActive: true,
};

const initialBillForm = {
  companyId: '',
  vendorId: '',
  purchaseOrderId: '',
  projectId: '',
  branchName: '',
  billNumber: '',
  billDate: '',
  dueDate: '',
  taxableAmount: '',
  gstAmount: '',
  totalAmount: '',
  remarks: '',
};

const initialPaymentForm = {
  companyId: '',
  vendorId: '',
  vendorBillId: '',
  paymentDate: '',
  amount: '',
  paymentMode: 'BANK_TRANSFER',
  transactionId: '',
  bankName: '',
  remarks: '',
};

const compressImageFile = async (
  file: File,
): Promise<File> => {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  if (file.size <= 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const image = new Image();

    const objectUrl =
      URL.createObjectURL(file);

    image.onload = () => {
      const maxWidth = 1600;

      const scale = Math.min(
        1,
        maxWidth / image.width,
      );

      const canvas =
        document.createElement('canvas');

      canvas.width = Math.round(
        image.width * scale,
      );

      canvas.height = Math.round(
        image.height * scale,
      );

      const context =
        canvas.getContext('2d');

      if (!context) {
        URL.revokeObjectURL(
          objectUrl,
        );

        resolve(file);
        return;
      }

      context.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(
            objectUrl,
          );

          if (!blob) {
            resolve(file);
            return;
          }

          const compressedName =
            file.name.replace(
              /\.(png|jpg|jpeg|webp)$/i,
              '.jpg',
            );

          resolve(
            new File(
              [blob],
              compressedName,
              {
                type: 'image/jpeg',
                lastModified:
                  Date.now(),
              },
            ),
          );
        },
        'image/jpeg',
        0.78,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(
        objectUrl,
      );

      resolve(file);
    };

    image.src = objectUrl;
  });
};

const formatCurrency = (
  value: number | string | undefined,
) =>
  `₹${Number(value || 0).toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 2,
    },
  )}`;

const formatDate = (
  value?: string,
) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return value;
  }

  return parsed.toLocaleDateString(
    'en-IN',
  );
};

const getAuthHeaders = () => {
  const token =
    localStorage.getItem('token');

  return token
    ? {
        Authorization:
          `Bearer ${token}`,
      }
    : {};
};

export default function VendorManagementPage() {
  const [activeTab, setActiveTab] =
    useState<TabType>('OVERVIEW');

  const [companies, setCompanies] =
    useState<VendorCompany[]>([]);

  const [vendors, setVendors] =
    useState<Vendor[]>([]);

  const [purchaseOrders, setPurchaseOrders] =
    useState<PurchaseOrder[]>([]);

  const [bills, setBills] =
    useState<VendorBill[]>([]);

  const [payments, setPayments] =
    useState<VendorPayment[]>([]);

  const [
    selectedBillDocuments,
    setSelectedBillDocuments,
  ] = useState<VendorDocument[]>([]);

  const [
    selectedPaymentReceipts,
    setSelectedPaymentReceipts,
  ] = useState<PaymentReceipt[]>([]);

  const [billSummary, setBillSummary] =
    useState<BillSummary>({
      totalBills: 0,
      totalBillAmount: 0,
      totalPaidAmount: 0,
      totalPendingAmount: 0,
    });

  const [
    paymentSummary,
    setPaymentSummary,
  ] = useState<PaymentSummary>({
    totalPayments: 0,
    totalPaidAmount: 0,
  });

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [
    editingCompanyId,
    setEditingCompanyId,
  ] = useState<number | null>(
    null,
  );

  const [
    companyForm,
    setCompanyForm,
  ] = useState(
    initialCompanyForm,
  );

  const [billForm, setBillForm] =
    useState(initialBillForm);

  const [
    paymentForm,
    setPaymentForm,
  ] = useState(
    initialPaymentForm,
  );

  const [
    selectedBillId,
    setSelectedBillId,
  ] = useState<number | null>(
    null,
  );

  const [
    selectedPaymentId,
    setSelectedPaymentId,
  ] = useState<number | null>(
    null,
  );

  const [
  billDocumentModalOpen,
  setBillDocumentModalOpen,
] = useState(false);

const [
  paymentReceiptModalOpen,
  setPaymentReceiptModalOpen,
] = useState(false);

const [
  selectedBillForDocuments,
  setSelectedBillForDocuments,
] = useState<VendorBill | null>(
  null,
);

const [
  selectedPaymentForReceipts,
  setSelectedPaymentForReceipts,
] = useState<VendorPayment | null>(
  null,
);

  const [
    billDocumentType,
    setBillDocumentType,
  ] = useState('BILL');

  const [
    billDocumentRemarks,
    setBillDocumentRemarks,
  ] = useState('');

  const [
    billDocumentFiles,
    setBillDocumentFiles,
  ] = useState<File[]>([]);

  const [
    paymentReceiptType,
    setPaymentReceiptType,
  ] = useState(
    'PAYMENT_RECEIPT',
  );

  const [
    paymentReceiptRemarks,
    setPaymentReceiptRemarks,
  ] = useState('');

  const [
    paymentReceiptFiles,
    setPaymentReceiptFiles,
  ] = useState<File[]>([]);

  const [filters, setFilters] =
    useState({
      search: '',
      companyId: '',
      vendorId: '',
      status: '',
      month: '',
      fromDate: '',
      toDate: '',
      paymentMode: '',
      minAmount: '',
      maxAmount: '',
      overdueOnly: false,
    });

  const selectedVendorBills =
    useMemo(() => {
      return bills.filter(
        (bill) =>
          (!paymentForm.companyId ||
            Number(
              bill.companyId,
            ) ===
              Number(
                paymentForm.companyId,
              )) &&
          (!paymentForm.vendorId ||
            Number(
              bill.vendorId,
            ) ===
              Number(
                paymentForm.vendorId,
              )) &&
          bill.status !== 'PAID' &&
          Number(
            bill.pendingAmount || 0,
          ) > 0,
      );
    }, [
      bills,
      paymentForm.companyId,
      paymentForm.vendorId,
    ]);

  const matchingPurchaseOrders =
    useMemo(() => {
      return purchaseOrders.filter(
        (purchaseOrder) =>
          !billForm.vendorId ||
          Number(
            purchaseOrder.vendorId ||
              0,
          ) ===
            Number(
              billForm.vendorId,
            ),
      );
    }, [
      purchaseOrders,
      billForm.vendorId,
    ]);

  const fetchCompanies =
    async () => {
      const response =
        await axios.get(
          `${API_BASE_URL}/project/vendor-management/companies`,
          {
            params: {
              activeOnly: 'true',
            },
            headers:
              getAuthHeaders(),
          },
        );

      setCompanies(
        response.data || [],
      );
    };

  const fetchVendors =
    async () => {
      const response =
        await axios.get(
          `${API_BASE_URL}/project/vendor-management/vendors`,
          {
            params: {
              activeOnly: 'true',
            },
            headers:
              getAuthHeaders(),
          },
        );

      const rows = Array.isArray(
        response.data,
      )
        ? response.data
        : [];

      setVendors(
        rows.filter(
          (vendor: Vendor) =>
            vendor.canSellToUs !==
            false,
        ),
      );
    };

  const fetchPurchaseOrders =
    async () => {
      const response =
        await axios.get(
          `${API_BASE_URL}/project/vendor-management/purchase-orders`,
          {
            params: {
              page: 1,
              limit: 100,
              vendorId:
                filters.vendorId ||
                undefined,
              search:
                filters.search ||
                undefined,
              fromDate:
                filters.fromDate ||
                undefined,
              toDate:
                filters.toDate ||
                undefined,
            },
            headers:
              getAuthHeaders(),
          },
        );

      setPurchaseOrders(
        response.data?.data || [],
      );
    };

  const fetchBills = async () => {
    const response =
      await axios.get(
        `${API_BASE_URL}/project/vendor-management/bills`,
        {
          params: {
            page: 1,
            limit: 100,
            search:
              filters.search ||
              undefined,
            companyId:
              filters.companyId ||
              undefined,
            vendorId:
              filters.vendorId ||
              undefined,
            status:
              filters.status ||
              undefined,
            month:
              filters.month ||
              undefined,
            fromDate:
              filters.month
                ? undefined
                : filters.fromDate ||
                  undefined,
            toDate:
              filters.month
                ? undefined
                : filters.toDate ||
                  undefined,
            minAmount:
              filters.minAmount ||
              undefined,
            maxAmount:
              filters.maxAmount ||
              undefined,
            overdueOnly:
              filters.overdueOnly
                ? 'true'
                : undefined,
          },
          headers:
            getAuthHeaders(),
        },
      );

    setBills(
      response.data?.data || [],
    );

    setBillSummary(
      response.data?.summary || {
        totalBills: 0,
        totalBillAmount: 0,
        totalPaidAmount: 0,
        totalPendingAmount: 0,
      },
    );
  };

  const fetchPayments =
    async () => {
      const response =
        await axios.get(
          `${API_BASE_URL}/project/vendor-management/payments`,
          {
            params: {
              page: 1,
              limit: 100,
              search:
                filters.search ||
                undefined,
              companyId:
                filters.companyId ||
                undefined,
              vendorId:
                filters.vendorId ||
                undefined,
              paymentMode:
                filters.paymentMode ||
                undefined,
              month:
                filters.month ||
                undefined,
              fromDate:
                filters.month
                  ? undefined
                  : filters.fromDate ||
                    undefined,
              toDate:
                filters.month
                  ? undefined
                  : filters.toDate ||
                    undefined,
              minAmount:
                filters.minAmount ||
                undefined,
              maxAmount:
                filters.maxAmount ||
                undefined,
            },
            headers:
              getAuthHeaders(),
          },
        );

      setPayments(
        response.data?.data || [],
      );

      setPaymentSummary(
        response.data?.summary || {
          totalPayments: 0,
          totalPaidAmount: 0,
        },
      );
    };

  const fetchAll = async () => {
    try {
      setLoading(true);

      await Promise.all([
        fetchCompanies(),
        fetchVendors(),
        fetchPurchaseOrders(),
        fetchBills(),
        fetchPayments(),
      ]);
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data
          ?.message ||
          'Failed to load Vendor Management',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        Promise.all([
          fetchBills(),
          fetchPayments(),
          fetchPurchaseOrders(),
        ]).catch((error) => {
          console.error(error);
        });
      }, 350);

    return () =>
      window.clearTimeout(
        timeout,
      );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      search: '',
      companyId: '',
      vendorId: '',
      status: '',
      month: '',
      fromDate: '',
      toDate: '',
      paymentMode: '',
      minAmount: '',
      maxAmount: '',
      overdueOnly: false,
    });
  };

  const saveCompany =
    async () => {
      if (
        !companyForm.companyName.trim()
      ) {
        alert(
          'Firm name is required',
        );

        return;
      }

      try {
        setSaving(true);

        if (editingCompanyId) {
          await axios.patch(
            `${API_BASE_URL}/project/vendor-management/companies/${editingCompanyId}`,
            companyForm,
            {
              headers:
                getAuthHeaders(),
            },
          );

          alert('Firm updated');
        } else {
          await axios.post(
            `${API_BASE_URL}/project/vendor-management/companies`,
            companyForm,
            {
              headers:
                getAuthHeaders(),
            },
          );

          alert('Firm added');
        }

        setCompanyForm(
          initialCompanyForm,
        );

        setEditingCompanyId(
          null,
        );

        await fetchCompanies();
      } catch (error: any) {
        console.error(error);

        alert(
          error?.response?.data
            ?.message ||
            'Failed to save firm',
        );
      } finally {
        setSaving(false);
      }
    };

  const editCompany = (
    company: VendorCompany,
  ) => {
    setEditingCompanyId(
      company.id,
    );

    setCompanyForm({
      companyName:
        company.companyName || '',
      legalName:
        company.legalName || '',
      gstNumber:
        company.gstNumber || '',
      panNumber:
        company.panNumber || '',
      email:
        company.email || '',
      phone:
        company.phone || '',
      alternatePhone: '',
      address:
        company.address || '',
      city:
        company.city || '',
      state:
        company.state || '',
      pinCode: '',
      bankName:
        company.bankName || '',
      bankAccountName:
        company.bankAccountName ||
        '',
      bankAccountNumber:
        company.bankAccountNumber ||
        '',
      bankIfsc:
        company.bankIfsc || '',
      upiId: '',
      remarks:
        company.remarks || '',
      isActive:
        company.isActive !== false,
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const hideCompany =
    async (
      company: VendorCompany,
    ) => {
      const reason =
        window.prompt(
          `Reason for hiding ${company.companyName}?`,
        );

      if (reason === null) {
        return;
      }

      try {
        await axios.patch(
          `${API_BASE_URL}/project/vendor-management/companies/${company.id}/hide`,
          {
            reason,
          },
          {
            headers:
              getAuthHeaders(),
          },
        );

        await fetchCompanies();
      } catch (error: any) {
        console.error(error);

        alert(
          error?.response?.data
            ?.message ||
            'Failed to hide firm',
        );
      }
    };

  const saveBill = async () => {
    if (!billForm.companyId) {
      alert('Select firm');
      return;
    }

    if (!billForm.vendorId) {
      alert('Select vendor');
      return;
    }

    if (
      !billForm.billNumber.trim()
    ) {
      alert(
        'Bill number is required',
      );

      return;
    }

    if (!billForm.billDate) {
      alert(
        'Bill date is required',
      );

      return;
    }

    if (
      Number(
        billForm.totalAmount ||
          0,
      ) <= 0
    ) {
      alert(
        'Valid bill amount is required',
      );

      return;
    }

    try {
      setSaving(true);

      const response =
        await axios.post(
          `${API_BASE_URL}/project/vendor-management/bills`,
          billForm,
          {
            headers:
              getAuthHeaders(),
          },
        );

      const createdBill =
        response.data;

      setBillForm(
        initialBillForm,
      );

      await fetchBills();

      alert(
        `Vendor bill ${
          createdBill?.billNumber ||
          ''
        } saved`,
      );

      setActiveTab('BILLS');

if (createdBill?.id) {
  setSelectedBillForDocuments(
    createdBill,
  );

  setSelectedBillId(
    createdBill.id,
  );

  setSelectedBillDocuments(
    [],
  );

  setBillDocumentModalOpen(
    true,
  );
}
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data
          ?.message ||
          'Failed to save vendor bill',
      );
    } finally {
      setSaving(false);
    }
  };

  const savePayment =
    async () => {
      if (
        !paymentForm.companyId
      ) {
        alert('Select firm');
        return;
      }

      if (
        !paymentForm.vendorId
      ) {
        alert('Select vendor');
        return;
      }

      if (
        !paymentForm.paymentDate
      ) {
        alert(
          'Payment date is required',
        );

        return;
      }

      if (
        Number(
          paymentForm.amount ||
            0,
        ) <= 0
      ) {
        alert(
          'Valid payment amount is required',
        );

        return;
      }

      try {
        setSaving(true);

        const response =
          await axios.post(
            `${API_BASE_URL}/project/vendor-management/payments`,
            paymentForm,
            {
              headers:
                getAuthHeaders(),
            },
          );

        const createdPayment =
          response.data;

        setPaymentForm(
          initialPaymentForm,
        );

        await Promise.all([
          fetchBills(),
          fetchPayments(),
        ]);

        setActiveTab(
  'PAYMENTS',
);

if (createdPayment?.id) {
  setSelectedPaymentForReceipts(
    createdPayment,
  );

  setSelectedPaymentId(
    createdPayment.id,
  );

  setSelectedPaymentReceipts(
    [],
  );

  setPaymentReceiptModalOpen(
    true,
  );
}

alert(
  'Vendor payment saved',
);
      } catch (error: any) {
        console.error(error);

        alert(
          error?.response?.data
            ?.message ||
            'Failed to save vendor payment',
        );
      } finally {
        setSaving(false);
      }
    };

  const openBillDetail =
  async (
    billId: number,
  ) => {
    try {
      const selectedBill =
        bills.find(
          (bill) =>
            Number(bill.id) ===
            Number(billId),
        ) || null;

      setSelectedBillId(
        billId,
      );

      setSelectedBillForDocuments(
        selectedBill,
      );

      setBillDocumentModalOpen(
        true,
      );

      setSelectedBillDocuments(
        [],
      );

      const response =
        await axios.get(
          `${API_BASE_URL}/project/vendor-management/bills/${billId}`,
          {
            headers:
              getAuthHeaders(),
          },
        );

      setSelectedBillDocuments(
        response.data?.documents ||
          [],
      );
    } catch (error: any) {
      console.error(error);

      setBillDocumentModalOpen(
        false,
      );

      alert(
        error?.response?.data
          ?.message ||
          'Failed to load bill documents',
      );
    }
  };

  const openPaymentDetail =
  async (
    paymentId: number,
  ) => {
    try {
      const selectedPayment =
        payments.find(
          (payment) =>
            Number(payment.id) ===
            Number(paymentId),
        ) || null;

      setSelectedPaymentId(
        paymentId,
      );

      setSelectedPaymentForReceipts(
        selectedPayment,
      );

      setPaymentReceiptModalOpen(
        true,
      );

      setSelectedPaymentReceipts(
        [],
      );

      const response =
        await axios.get(
          `${API_BASE_URL}/project/vendor-management/payments/${paymentId}`,
          {
            headers:
              getAuthHeaders(),
          },
        );

      setSelectedPaymentReceipts(
        response.data?.receipts ||
          [],
      );
    } catch (error: any) {
      console.error(error);

      setPaymentReceiptModalOpen(
        false,
      );

      alert(
        error?.response?.data
          ?.message ||
          'Failed to load payment receipts',
      );
    }
  };

  const uploadBillDocuments =
    async () => {
      if (!selectedBillId) {
        alert(
          'Select a vendor bill first',
        );

        return;
      }

      if (
        billDocumentFiles.length ===
        0
      ) {
        alert(
          'Select at least one document',
        );

        return;
      }

      try {
        setUploading(true);

        const formData =
          new FormData();

        for (
          const file of
          billDocumentFiles
        ) {
          const compressedFile =
            await compressImageFile(
              file,
            );

          formData.append(
            'files',
            compressedFile,
          );
        }

        formData.append(
          'vendorBillId',
          String(
            selectedBillId,
          ),
        );

        formData.append(
          'documentType',
          billDocumentType,
        );

        formData.append(
          'remarks',
          billDocumentRemarks,
        );

        await axios.post(
          `${API_BASE_URL}/project/vendor-management/bills/documents/upload`,
          formData,
          {
            headers:
              getAuthHeaders(),
          },
        );

        setBillDocumentFiles(
          [],
        );

        setBillDocumentRemarks(
          '',
        );

        await openBillDetail(
          selectedBillId,
        );

        alert(
          'Vendor document uploaded',
        );
      } catch (error: any) {
        console.error(error);

        alert(
          error?.response?.data
            ?.message ||
            'Failed to upload vendor document',
        );
      } finally {
        setUploading(false);
      }
    };

  const uploadPaymentReceipts =
    async () => {
      if (!selectedPaymentId) {
        alert(
          'Select a payment first',
        );

        return;
      }

      if (
        paymentReceiptFiles.length ===
        0
      ) {
        alert(
          'Select at least one receipt',
        );

        return;
      }

      try {
        setUploading(true);

        const formData =
          new FormData();

        for (
          const file of
          paymentReceiptFiles
        ) {
          const compressedFile =
            await compressImageFile(
              file,
            );

          formData.append(
            'files',
            compressedFile,
          );
        }

        formData.append(
          'vendorPaymentId',
          String(
            selectedPaymentId,
          ),
        );

        formData.append(
          'receiptType',
          paymentReceiptType,
        );

        formData.append(
          'remarks',
          paymentReceiptRemarks,
        );

        await axios.post(
          `${API_BASE_URL}/project/vendor-management/payments/receipts/upload`,
          formData,
          {
            headers:
              getAuthHeaders(),
          },
        );

        setPaymentReceiptFiles(
          [],
        );

        setPaymentReceiptRemarks(
          '',
        );

        await openPaymentDetail(
          selectedPaymentId,
        );

        alert(
          'Payment receipt uploaded',
        );
      } catch (error: any) {
        console.error(error);

        alert(
          error?.response?.data
            ?.message ||
            'Failed to upload payment receipt',
        );
      } finally {
        setUploading(false);
      }
    };

  const hideBill = async (
    bill: VendorBill,
  ) => {
    const reason =
      window.prompt(
        `Reason for hiding bill ${bill.billNumber}?`,
      );

    if (reason === null) {
      return;
    }

    try {
      await axios.patch(
        `${API_BASE_URL}/project/vendor-management/bills/${bill.id}/hide`,
        {
          reason,
        },
        {
          headers:
            getAuthHeaders(),
        },
      );

      await fetchBills();
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data
          ?.message ||
          'Failed to hide vendor bill',
      );
    }
  };

  const hidePayment =
    async (
      payment: VendorPayment,
    ) => {
      const reason =
        window.prompt(
          `Reason for hiding payment #${payment.id}?`,
        );

      if (reason === null) {
        return;
      }

      try {
        await axios.patch(
          `${API_BASE_URL}/project/vendor-management/payments/${payment.id}/hide`,
          {
            reason,
          },
          {
            headers:
              getAuthHeaders(),
          },
        );

        await Promise.all([
          fetchBills(),
          fetchPayments(),
        ]);
      } catch (error: any) {
        console.error(error);

        alert(
          error?.response?.data
            ?.message ||
            'Failed to hide vendor payment',
        );
      }
    };

  const tabButtonClass = (
    tab: TabType,
  ) =>
    `rounded-xl px-4 py-2 text-sm font-semibold ${
      activeTab === tab
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-900">
          Vendor Management
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Store vendor bills, purchase-order references,
          payment records, receipts and supporting
          documents firm-wise.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setActiveTab(
                'OVERVIEW',
              )
            }
            className={tabButtonClass(
              'OVERVIEW',
            )}
          >
            Overview
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab('FIRMS')
            }
            className={tabButtonClass(
              'FIRMS',
            )}
          >
            Firms
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab('BILLS')
            }
            className={tabButtonClass(
              'BILLS',
            )}
          >
            Vendor Bills
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                'PAYMENTS',
              )
            }
            className={tabButtonClass(
              'PAYMENTS',
            )}
          >
            Payments & Receipts
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                'PURCHASE_ORDERS',
              )
            }
            className={tabButtonClass(
              'PURCHASE_ORDERS',
            )}
          >
            Purchase Orders
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            placeholder="Search vendor, bill, PO, transaction"
            value={filters.search}
            onChange={(event) =>
              setFilters({
                ...filters,
                search:
                  event.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <select
            value={
              filters.companyId
            }
            onChange={(event) =>
              setFilters({
                ...filters,
                companyId:
                  event.target.value,
              })
            }
            className="rounded-xl border p-3"
          >
            <option value="">
              All Firms
            </option>

            {companies.map(
              (company) => (
                <option
                  key={company.id}
                  value={
                    company.id
                  }
                >
                  {
                    company.companyName
                  }
                </option>
              ),
            )}
          </select>

          <select
            value={
              filters.vendorId
            }
            onChange={(event) =>
              setFilters({
                ...filters,
                vendorId:
                  event.target.value,
              })
            }
            className="rounded-xl border p-3"
          >
            <option value="">
              All Vendors
            </option>

            {vendors.map(
              (vendor) => (
                <option
                  key={vendor.id}
                  value={
                    vendor.id
                  }
                >
                  {
                    vendor.vendorName
                  }
                </option>
              ),
            )}
          </select>

          <select
            value={filters.status}
            onChange={(event) =>
              setFilters({
                ...filters,
                status:
                  event.target.value,
              })
            }
            className="rounded-xl border p-3"
          >
            <option value="">
              All Bill Status
            </option>

            <option value="UNPAID">
              Unpaid
            </option>

            <option value="PARTIALLY_PAID">
              Partially Paid
            </option>

            <option value="PAID">
              Paid
            </option>
          </select>

          <TextField
  label="Month"
  type="month"
  fullWidth
  value={filters.month}
  onChange={(event) =>
    setFilters({
      ...filters,
      month: event.target.value,
      fromDate: '',
      toDate: '',
    })
  }
  slotProps={{
    inputLabel: {
      shrink: true,
    },
  }}
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: '0.75rem',
      height: '54px',
    },
  }}
/>

          <TextField
  label="From Date"
  type="date"
  fullWidth
  value={filters.fromDate}
  onChange={(event) =>
    setFilters({
      ...filters,
      fromDate: event.target.value,
      month: '',
    })
  }
  slotProps={{
    inputLabel: {
      shrink: true,
    },
  }}
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: '0.75rem',
      height: '54px',
    },
  }}
/>

          <TextField
  label="To Date"
  type="date"
  fullWidth
  value={filters.toDate}
  onChange={(event) =>
    setFilters({
      ...filters,
      toDate: event.target.value,
      month: '',
    })
  }
  slotProps={{
    inputLabel: {
      shrink: true,
    },
  }}
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: '0.75rem',
      height: '54px',
    },
  }}
/>

          <select
            value={
              filters.paymentMode
            }
            onChange={(event) =>
              setFilters({
                ...filters,
                paymentMode:
                  event.target.value,
              })
            }
            className="rounded-xl border p-3"
          >
            <option value="">
              All Payment Modes
            </option>

            <option value="CASH">
              Cash
            </option>

            <option value="BANK_TRANSFER">
              Bank Transfer
            </option>

            <option value="UPI">
              UPI
            </option>

            <option value="CHEQUE">
              Cheque
            </option>

            <option value="NEFT">
              NEFT
            </option>

            <option value="RTGS">
              RTGS
            </option>

            <option value="IMPS">
              IMPS
            </option>
          </select>

          <input
            type="number"
            placeholder="Minimum Amount"
            value={
              filters.minAmount
            }
            onChange={(event) =>
              setFilters({
                ...filters,
                minAmount:
                  event.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Maximum Amount"
            value={
              filters.maxAmount
            }
            onChange={(event) =>
              setFilters({
                ...filters,
                maxAmount:
                  event.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <label className="flex items-center gap-3 rounded-xl border p-3">
            <input
              type="checkbox"
              checked={
                filters.overdueOnly
              }
              onChange={(event) =>
                setFilters({
                  ...filters,
                  overdueOnly:
                    event.target
                      .checked,
                })
              }
            />

            <span className="text-sm font-medium">
              Overdue Bills Only
            </span>
          </label>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl bg-gray-700 px-4 py-3 font-semibold text-white hover:bg-gray-800"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow">
          Loading Vendor Management...
        </div>
      ) : null}

      {!loading &&
        activeTab ===
          'OVERVIEW' && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Vendor Bills"
                value={String(
                  billSummary.totalBills,
                )}
              />

              <SummaryCard
                label="Purchase Amount"
                value={formatCurrency(
                  billSummary.totalBillAmount,
                )}
              />

              <SummaryCard
                label="Paid Amount"
                value={formatCurrency(
                  billSummary.totalPaidAmount,
                )}
              />

              <SummaryCard
                label="Pending Amount"
                value={formatCurrency(
                  billSummary.totalPendingAmount,
                )}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow">
                <h2 className="text-lg font-bold text-gray-900">
                  Recent Vendor Bills
                </h2>

                <div className="mt-4 space-y-3">
                  {bills
                    .slice(0, 5)
                    .map((bill) => (
                      <BillCard
                        key={bill.id}
                        bill={bill}
                        onView={() =>
                          openBillDetail(
                            bill.id,
                          )
                        }
                        onHide={() =>
                          hideBill(
                            bill,
                          )
                        }
                      />
                    ))}

                  {bills.length ===
                    0 && (
                    <p className="text-sm text-gray-500">
                      No vendor bills
                      found.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow">
                <h2 className="text-lg font-bold text-gray-900">
                  Recent Vendor Payments
                </h2>

                <div className="mt-4 space-y-3">
                  {payments
                    .slice(0, 5)
                    .map(
                      (payment) => (
                        <PaymentCard
                          key={
                            payment.id
                          }
                          payment={
                            payment
                          }
                          onView={() =>
                            openPaymentDetail(
                              payment.id,
                            )
                          }
                          onHide={() =>
                            hidePayment(
                              payment,
                            )
                          }
                        />
                      ),
                    )}

                  {payments.length ===
                    0 && (
                    <p className="text-sm text-gray-500">
                      No vendor
                      payments found.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {!loading &&
        activeTab === 'FIRMS' && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-5 shadow">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCompanyId
                  ? 'Edit Firm'
                  : 'Add Firm'}
              </h2>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[
                  [
                    'companyName',
                    'Firm Name',
                  ],
                  [
                    'legalName',
                    'Legal Name',
                  ],
                  [
                    'gstNumber',
                    'GST Number',
                  ],
                  [
                    'panNumber',
                    'PAN Number',
                  ],
                  [
                    'phone',
                    'Phone',
                  ],
                  [
                    'alternatePhone',
                    'Alternate Phone',
                  ],
                  [
                    'email',
                    'Email',
                  ],
                  [
                    'city',
                    'City',
                  ],
                  [
                    'state',
                    'State',
                  ],
                  [
                    'pinCode',
                    'PIN Code',
                  ],
                  [
                    'bankName',
                    'Bank Name',
                  ],
                  [
                    'bankAccountName',
                    'Account Name',
                  ],
                  [
                    'bankAccountNumber',
                    'Account Number',
                  ],
                  [
                    'bankIfsc',
                    'IFSC',
                  ],
                  [
                    'upiId',
                    'UPI ID',
                  ],
                ].map(
                  ([
                    key,
                    placeholder,
                  ]) => (
                    <input
                      key={key}
                      placeholder={
                        placeholder
                      }
                      value={
                        (
                          companyForm as any
                        )[key]
                      }
                      onChange={(
                        event,
                      ) =>
                        setCompanyForm(
                          {
                            ...companyForm,
                            [key]:
                              event
                                .target
                                .value,
                          },
                        )
                      }
                      className="rounded-xl border p-3"
                    />
                  ),
                )}
              </div>

              <textarea
                placeholder="Firm Address"
                value={
                  companyForm.address
                }
                onChange={(event) =>
                  setCompanyForm({
                    ...companyForm,
                    address:
                      event.target
                        .value,
                  })
                }
                rows={3}
                className="mt-3 w-full rounded-xl border p-3"
              />

              <textarea
                placeholder="Remarks"
                value={
                  companyForm.remarks
                }
                onChange={(event) =>
                  setCompanyForm({
                    ...companyForm,
                    remarks:
                      event.target
                        .value,
                  })
                }
                rows={3}
                className="mt-3 w-full rounded-xl border p-3"
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={
                    saveCompany
                  }
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingCompanyId
                      ? 'Update Firm'
                      : 'Add Firm'}
                </button>

                {editingCompanyId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCompanyId(
                        null,
                      );

                      setCompanyForm(
                        initialCompanyForm,
                      );
                    }}
                    className="rounded-xl bg-gray-600 px-5 py-3 font-semibold text-white"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow">
              <h2 className="text-lg font-bold text-gray-900">
                Firms
              </h2>

              <div className="mt-4 space-y-3">
                {companies.map(
                  (company) => (
                    <div
                      key={
                        company.id
                      }
                      className="rounded-xl border p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-bold text-gray-900">
                            {
                              company.companyName
                            }
                          </p>

                          <p className="text-sm text-gray-500">
                            GST:{' '}
                            {
                              company.gstNumber ||
                              '-'
                            }{' '}
                            | Phone:{' '}
                            {
                              company.phone ||
                              '-'
                            }
                          </p>

                          <p className="text-sm text-gray-500">
                            {company.city ||
                              '-'}
                            ,{' '}
                            {company.state ||
                              '-'}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              editCompany(
                                company,
                              )
                            }
                            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              hideCompany(
                                company,
                              )
                            }
                            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                          >
                            Hide
                          </button>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

      {!loading &&
        activeTab === 'BILLS' && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-5 shadow">
              <h2 className="text-lg font-bold text-gray-900">
                Add Vendor Bill
              </h2>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <select
                  value={
                    billForm.companyId
                  }
                  onChange={(
                    event,
                  ) =>
                    setBillForm({
                      ...billForm,
                      companyId:
                        event.target
                          .value,
                    })
                  }
                  className="rounded-xl border p-3"
                >
                  <option value="">
                    Select Firm
                  </option>

                  {companies.map(
                    (company) => (
                      <option
                        key={
                          company.id
                        }
                        value={
                          company.id
                        }
                      >
                        {
                          company.companyName
                        }
                      </option>
                    ),
                  )}
                </select>

                <select
                  value={
                    billForm.vendorId
                  }
                  onChange={(
                    event,
                  ) =>
                    setBillForm({
                      ...billForm,
                      vendorId:
                        event.target
                          .value,
                      purchaseOrderId:
                        '',
                    })
                  }
                  className="rounded-xl border p-3"
                >
                  <option value="">
                    Select Vendor
                  </option>

                  {vendors.map(
                    (vendor) => (
                      <option
                        key={
                          vendor.id
                        }
                        value={
                          vendor.id
                        }
                      >
                        {
                          vendor.vendorName
                        }
                      </option>
                    ),
                  )}
                </select>

                <select
                  value={
                    billForm.purchaseOrderId
                  }
                  onChange={(
                    event,
                  ) => {
                    const po =
                      purchaseOrders.find(
                        (
                          row,
                        ) =>
                          Number(
                            row.id,
                          ) ===
                          Number(
                            event
                              .target
                              .value,
                          ),
                      );

                    setBillForm({
                      ...billForm,
                      purchaseOrderId:
                        event.target
                          .value,
                      projectId:
                        po?.projectId
                          ? String(
                              po.projectId,
                            )
                          : billForm.projectId,
                    });
                  }}
                  className="rounded-xl border p-3"
                >
                  <option value="">
                    Optional Purchase Order
                  </option>

                  {matchingPurchaseOrders.map(
                    (purchaseOrder) => (
                      <option
                        key={
                          purchaseOrder.id
                        }
                        value={
                          purchaseOrder.id
                        }
                      >
                        {purchaseOrder.poNumber ||
                          `PO #${purchaseOrder.id}`}{' '}
                        -{' '}
                        {formatCurrency(
                          purchaseOrder.totalAmount,
                        )}
                      </option>
                    ),
                  )}
                </select>

                <input
                  placeholder="Bill Number"
                  value={
                    billForm.billNumber
                  }
                  onChange={(
                    event,
                  ) =>
                    setBillForm({
                      ...billForm,
                      billNumber:
                        event.target
                          .value,
                    })
                  }
                  className="rounded-xl border p-3"
                />

                <TextField
  label="Bill Date"
  type="date"
  fullWidth
  value={billForm.billDate}
  onChange={(event) =>
    setBillForm({
      ...billForm,
      billDate: event.target.value,
    })
  }
  slotProps={{
    inputLabel: {
      shrink: true,
    },
  }}
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: '0.75rem',
      height: '54px',
    },
  }}
/>

                <TextField
  label="Due Date"
  type="date"
  fullWidth
  value={billForm.dueDate}
  onChange={(event) =>
    setBillForm({
      ...billForm,
      dueDate: event.target.value,
    })
  }
  slotProps={{
    inputLabel: {
      shrink: true,
    },
  }}
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: '0.75rem',
      height: '54px',
    },
  }}
/>

                <input
                  type="number"
                  placeholder="Taxable Amount"
                  value={
                    billForm.taxableAmount
                  }
                  onChange={(
                    event,
                  ) =>
                    setBillForm({
                      ...billForm,
                      taxableAmount:
                        event.target
                          .value,
                    })
                  }
                  className="rounded-xl border p-3"
                />

                <input
                  type="number"
                  placeholder="GST Amount"
                  value={
                    billForm.gstAmount
                  }
                  onChange={(
                    event,
                  ) =>
                    setBillForm({
                      ...billForm,
                      gstAmount:
                        event.target
                          .value,
                    })
                  }
                  className="rounded-xl border p-3"
                />

                <input
                  type="number"
                  placeholder="Total Bill Amount"
                  value={
                    billForm.totalAmount
                  }
                  onChange={(
                    event,
                  ) =>
                    setBillForm({
                      ...billForm,
                      totalAmount:
                        event.target
                          .value,
                    })
                  }
                  className="rounded-xl border p-3"
                />

                <input
                  placeholder="Project ID (Optional)"
                  value={
                    billForm.projectId
                  }
                  onChange={(
                    event,
                  ) =>
                    setBillForm({
                      ...billForm,
                      projectId:
                        event.target
                          .value,
                    })
                  }
                  className="rounded-xl border p-3"
                />

                <input
                  placeholder="Branch Name"
                  value={
                    billForm.branchName
                  }
                  onChange={(
                    event,
                  ) =>
                    setBillForm({
                      ...billForm,
                      branchName:
                        event.target
                          .value,
                    })
                  }
                  className="rounded-xl border p-3"
                />
              </div>

              <textarea
                placeholder="Bill Remarks"
                value={
                  billForm.remarks
                }
                onChange={(event) =>
                  setBillForm({
                    ...billForm,
                    remarks:
                      event.target
                        .value,
                  })
                }
                rows={3}
                className="mt-3 w-full rounded-xl border p-3"
              />

              <button
                type="button"
                onClick={saveBill}
                disabled={saving}
                className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? 'Saving Bill...'
                  : 'Save Vendor Bill'}
              </button>
            </div>


            <div className="rounded-2xl bg-white p-5 shadow">
              <h2 className="text-lg font-bold text-gray-900">
                Vendor Bills
              </h2>

              <div className="mt-4 space-y-3">
                {bills.map(
                  (bill) => (
                    <BillCard
                      key={bill.id}
                      bill={bill}
                      onView={() =>
                        openBillDetail(
                          bill.id,
                        )
                      }
                      onHide={() =>
                        hideBill(
                          bill,
                        )
                      }
                    />
                  ),
                )}

                {bills.length ===
                  0 && (
                  <p className="text-sm text-gray-500">
                    No vendor bills
                    found.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

      {!loading &&
        activeTab ===
          'PAYMENTS' && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-5 shadow">
              <h2 className="text-lg font-bold text-gray-900">
                Record Vendor Payment
              </h2>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <select
                  value={
                    paymentForm.companyId
                  }
                  onChange={(
                    event,
                  ) =>
                    setPaymentForm({
                      ...paymentForm,
                      companyId:
                        event.target
                          .value,
                      vendorBillId:
                        '',
                    })
                  }
                  className="rounded-xl border p-3"
                >
                  <option value="">
                    Select Firm
                  </option>

                  {companies.map(
                    (company) => (
                      <option
                        key={
                          company.id
                        }
                        value={
                          company.id
                        }
                      >
                        {
                          company.companyName
                        }
                      </option>
                    ),
                  )}
                </select>

                <select
                  value={
                    paymentForm.vendorId
                  }
                  onChange={(
                    event,
                  ) =>
                    setPaymentForm({
                      ...paymentForm,
                      vendorId:
                        event.target
                          .value,
                      vendorBillId:
                        '',
                    })
                  }
                  className="rounded-xl border p-3"
                >
                  <option value="">
                    Select Vendor
                  </option>

                  {vendors.map(
                    (vendor) => (
                      <option
                        key={
                          vendor.id
                        }
                        value={
                          vendor.id
                        }
                      >
                        {
                          vendor.vendorName
                        }
                      </option>
                    ),
                  )}
                </select>

                <select
                  value={
                    paymentForm.vendorBillId
                  }
                  onChange={(
                    event,
                  ) => {
                    const bill =
                      bills.find(
                        (
                          row,
                        ) =>
                          Number(
                            row.id,
                          ) ===
                          Number(
                            event
                              .target
                              .value,
                          ),
                      );

                    setPaymentForm({
                      ...paymentForm,
                      vendorBillId:
                        event.target
                          .value,
                      amount:
                        bill
                          ? String(
                              bill.pendingAmount,
                            )
                          : paymentForm.amount,
                    });
                  }}
                  className="rounded-xl border p-3"
                >
                  <option value="">
                    Optional Related Bill
                  </option>

                  {selectedVendorBills.map(
                    (bill) => (
                      <option
                        key={
                          bill.id
                        }
                        value={
                          bill.id
                        }
                      >
                        {
                          bill.billNumber
                        }{' '}
                        - Pending{' '}
                        {formatCurrency(
                          bill.pendingAmount,
                        )}
                      </option>
                    ),
                  )}
                </select>

                <TextField
  label="Payment Date"
  type="date"
  fullWidth
  value={paymentForm.paymentDate}
  onChange={(event) =>
    setPaymentForm({
      ...paymentForm,
      paymentDate: event.target.value,
    })
  }
  slotProps={{
    inputLabel: {
      shrink: true,
    },
  }}
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: '0.75rem',
      height: '54px',
    },
  }}
/>

                <input
                  type="number"
                  placeholder="Payment Amount"
                  value={
                    paymentForm.amount
                  }
                  onChange={(
                    event,
                  ) =>
                    setPaymentForm({
                      ...paymentForm,
                      amount:
                        event.target
                          .value,
                    })
                  }
                  className="rounded-xl border p-3"
                />

                <select
                  value={
                    paymentForm.paymentMode
                  }
                  onChange={(
                    event,
                  ) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentMode:
                        event.target
                          .value,
                    })
                  }
                  className="rounded-xl border p-3"
                >
                  <option value="BANK_TRANSFER">
                    Bank Transfer
                  </option>

                  <option value="CASH">
                    Cash
                  </option>

                  <option value="UPI">
                    UPI
                  </option>

                  <option value="CHEQUE">
                    Cheque
                  </option>

                  <option value="NEFT">
                    NEFT
                  </option>

                  <option value="RTGS">
                    RTGS
                  </option>

                  <option value="IMPS">
                    IMPS
                  </option>

                  <option value="OTHER">
                    Other
                  </option>
                </select>

                <input
                  placeholder="Transaction / UTR Number"
                  value={
                    paymentForm.transactionId
                  }
                  onChange={(
                    event,
                  ) =>
                    setPaymentForm({
                      ...paymentForm,
                      transactionId:
                        event.target
                          .value,
                    })
                  }
                  className="rounded-xl border p-3"
                />

                <input
                  placeholder="Bank Name"
                  value={
                    paymentForm.bankName
                  }
                  onChange={(
                    event,
                  ) =>
                    setPaymentForm({
                      ...paymentForm,
                      bankName:
                        event.target
                          .value,
                    })
                  }
                  className="rounded-xl border p-3"
                />
              </div>

              <textarea
                placeholder="Payment Remarks"
                value={
                  paymentForm.remarks
                }
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    remarks:
                      event.target
                        .value,
                  })
                }
                rows={3}
                className="mt-3 w-full rounded-xl border p-3"
              />

              <button
                type="button"
                onClick={savePayment}
                disabled={saving}
                className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? 'Saving Payment...'
                  : 'Record Payment'}
              </button>
            </div>


            <div className="grid gap-4 md:grid-cols-2">
              <SummaryCard
                label="Payment Records"
                value={String(
                  paymentSummary.totalPayments,
                )}
              />

              <SummaryCard
                label="Total Paid"
                value={formatCurrency(
                  paymentSummary.totalPaidAmount,
                )}
              />
            </div>

            <div className="rounded-2xl bg-white p-5 shadow">
              <h2 className="text-lg font-bold text-gray-900">
                Vendor Payments
              </h2>

              <div className="mt-4 space-y-3">
                {payments.map(
                  (payment) => (
                    <PaymentCard
                      key={
                        payment.id
                      }
                      payment={
                        payment
                      }
                      onView={() =>
                        openPaymentDetail(
                          payment.id,
                        )
                      }
                      onHide={() =>
                        hidePayment(
                          payment,
                        )
                      }
                    />
                  ),
                )}

                {payments.length ===
                  0 && (
                  <p className="text-sm text-gray-500">
                    No vendor
                    payments found.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

      {!loading &&
        activeTab ===
          'PURCHASE_ORDERS' && (
          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-lg font-bold text-gray-900">
              Existing Vendor Purchase Orders
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              These purchase orders are fetched from the
              existing procurement module.
            </p>

            <div className="mt-4 space-y-3">
              {purchaseOrders.map(
                (purchaseOrder) => (
                  <div
                    key={
                      purchaseOrder.id
                    }
                    className="rounded-xl border p-4"
                  >
                    <div className="grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs text-gray-500">
                          PO Number
                        </p>

                        <p className="font-semibold">
                          {purchaseOrder.poNumber ||
                            `PO #${purchaseOrder.id}`}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Vendor
                        </p>

                        <p className="font-semibold">
                          {purchaseOrder.vendorName ||
                            '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Amount
                        </p>

                        <p className="font-semibold">
                          {formatCurrency(
                            purchaseOrder.totalAmount,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Status
                        </p>

                        <p className="font-semibold">
                          {purchaseOrder.status ||
                            '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Project ID
                        </p>

                        <p>
                          {purchaseOrder.projectId ||
                            '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Order Date
                        </p>

                        <p>
                          {formatDate(
                            purchaseOrder.orderDate ||
                              purchaseOrder.createdAt,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ),
              )}

              {purchaseOrders.length ===
                0 && (
                <p className="text-sm text-gray-500">
                  No purchase orders
                  found.
                </p>
              )}
            </div>
          </div>
        )}

        {billDocumentModalOpen &&
  selectedBillId && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b bg-white p-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Bill Documents
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Bill:{' '}
              {selectedBillForDocuments?.billNumber ||
                `#${selectedBillId}`}
            </p>

            <p className="text-sm text-gray-500">
              {selectedBillForDocuments?.companyName ||
                '-'}{' '}
              |{' '}
              {selectedBillForDocuments?.vendorName ||
                '-'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setBillDocumentModalOpen(
                false,
              );

              setBillDocumentFiles(
                [],
              );

              setBillDocumentRemarks(
                '',
              );
            }}
            className="rounded-xl bg-gray-100 px-4 py-2 font-bold text-gray-700 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-2xl border bg-gray-50 p-4">
            <h3 className="font-bold text-gray-900">
              Upload New Document
            </h3>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select
                value={
                  billDocumentType
                }
                onChange={(event) =>
                  setBillDocumentType(
                    event.target.value,
                  )
                }
                className="rounded-xl border bg-white p-3"
              >
                <option value="BILL">
                  Bill
                </option>

                <option value="INVOICE">
                  Invoice
                </option>

                <option value="DELIVERY_CHALLAN">
                  Delivery Challan
                </option>

                <option value="EWAY_BILL">
                  E-Way Bill
                </option>

                <option value="TRANSPORT_RECEIPT">
                  Transport Receipt
                </option>

                <option value="OTHER">
                  Other
                </option>
              </select>

              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(event) =>
                  setBillDocumentFiles(
                    Array.from(
                      event.target.files ||
                        [],
                    ),
                  )
                }
                className="rounded-xl border bg-white p-3"
              />
            </div>

            <textarea
              placeholder="Document remarks"
              value={
                billDocumentRemarks
              }
              onChange={(event) =>
                setBillDocumentRemarks(
                  event.target.value,
                )
              }
              rows={3}
              className="mt-3 w-full rounded-xl border bg-white p-3"
            />

            {billDocumentFiles.length >
              0 && (
              <p className="mt-2 text-sm font-medium text-blue-700">
                {
                  billDocumentFiles.length
                }{' '}
                file(s) selected
              </p>
            )}

            <button
              type="button"
              onClick={
                uploadBillDocuments
              }
              disabled={
                uploading ||
                billDocumentFiles.length ===
                  0
              }
              className="mt-4 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {uploading
                ? 'Compressing & Uploading...'
                : 'Upload Document'}
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                Uploaded Documents
              </h3>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                {
                  selectedBillDocuments.length
                }{' '}
                file(s)
              </span>
            </div>

            <DocumentList
              documents={
                selectedBillDocuments
              }
            />
          </div>
        </div>

        <div className="sticky bottom-0 border-t bg-white p-4 text-right">
          <button
            type="button"
            onClick={() =>
              setBillDocumentModalOpen(
                false,
              )
            }
            className="rounded-xl bg-gray-700 px-5 py-3 font-semibold text-white hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}

  {paymentReceiptModalOpen &&
  selectedPaymentId && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b bg-white p-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Payment Receipts
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Payment #
              {selectedPaymentId}
            </p>

            <p className="text-sm text-gray-500">
              {selectedPaymentForReceipts?.companyName ||
                '-'}{' '}
              |{' '}
              {selectedPaymentForReceipts?.vendorName ||
                '-'}
            </p>

            <p className="text-sm font-semibold text-green-700">
              {formatCurrency(
                selectedPaymentForReceipts?.amount,
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPaymentReceiptModalOpen(
                false,
              );

              setPaymentReceiptFiles(
                [],
              );

              setPaymentReceiptRemarks(
                '',
              );
            }}
            className="rounded-xl bg-gray-100 px-4 py-2 font-bold text-gray-700 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-2xl border bg-gray-50 p-4">
            <h3 className="font-bold text-gray-900">
              Upload New Receipt
            </h3>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select
                value={
                  paymentReceiptType
                }
                onChange={(event) =>
                  setPaymentReceiptType(
                    event.target.value,
                  )
                }
                className="rounded-xl border bg-white p-3"
              >
                <option value="PAYMENT_RECEIPT">
                  Payment Receipt
                </option>

                <option value="BANK_SCREENSHOT">
                  Bank Screenshot
                </option>

                <option value="UTR_PROOF">
                  UTR Proof
                </option>

                <option value="CHEQUE_COPY">
                  Cheque Copy
                </option>

                <option value="VENDOR_ACKNOWLEDGEMENT">
                  Vendor Acknowledgement
                </option>

                <option value="OTHER">
                  Other
                </option>
              </select>

              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(event) =>
                  setPaymentReceiptFiles(
                    Array.from(
                      event.target.files ||
                        [],
                    ),
                  )
                }
                className="rounded-xl border bg-white p-3"
              />
            </div>

            <textarea
              placeholder="Receipt remarks"
              value={
                paymentReceiptRemarks
              }
              onChange={(event) =>
                setPaymentReceiptRemarks(
                  event.target.value,
                )
              }
              rows={3}
              className="mt-3 w-full rounded-xl border bg-white p-3"
            />

            {paymentReceiptFiles.length >
              0 && (
              <p className="mt-2 text-sm font-medium text-blue-700">
                {
                  paymentReceiptFiles.length
                }{' '}
                file(s) selected
              </p>
            )}

            <button
              type="button"
              onClick={
                uploadPaymentReceipts
              }
              disabled={
                uploading ||
                paymentReceiptFiles.length ===
                  0
              }
              className="mt-4 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {uploading
                ? 'Compressing & Uploading...'
                : 'Upload Receipt'}
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                Uploaded Receipts
              </h3>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                {
                  selectedPaymentReceipts.length
                }{' '}
                file(s)
              </span>
            </div>

            <ReceiptList
              receipts={
                selectedPaymentReceipts
              }
            />
          </div>
        </div>

        <div className="sticky bottom-0 border-t bg-white p-4 text-right">
          <button
            type="button"
            onClick={() =>
              setPaymentReceiptModalOpen(
                false,
              )
            }
            className="rounded-xl bg-gray-700 px-5 py-3 font-semibold text-white hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function BillCard({
  bill,
  onView,
  onHide,
}: {
  bill: VendorBill;
  onView: () => void;
  onHide: () => void;
}) {
  const statusClass =
    bill.status === 'PAID'
      ? 'bg-green-100 text-green-700'
      : bill.status ===
          'PARTIALLY_PAID'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-700';

  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid flex-1 gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">
              Bill
            </p>

            <p className="font-bold text-gray-900">
              {bill.billNumber}
            </p>

            <p className="text-xs text-gray-500">
              {formatDate(
                bill.billDate,
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Firm / Vendor
            </p>

            <p className="font-semibold">
              {bill.companyName}
            </p>

            <p className="text-xs text-gray-500">
              {bill.vendorName}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Amount
            </p>

            <p className="font-semibold">
              {formatCurrency(
                bill.totalAmount,
              )}
            </p>

            <p className="text-xs text-green-700">
              Paid:{' '}
              {formatCurrency(
                bill.paidAmount,
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Pending
            </p>

            <p className="font-semibold text-red-700">
              {formatCurrency(
                bill.pendingAmount,
              )}
            </p>

            <span
              className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-semibold ${statusClass}`}
            >
              {bill.status.replaceAll(
                '_',
                ' ',
              )}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onView}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Documents / Upload
          </button>

          <button
            type="button"
            onClick={onHide}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Hide
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentCard({
  payment,
  onView,
  onHide,
}: {
  payment: VendorPayment;
  onView: () => void;
  onHide: () => void;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid flex-1 gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">
              Payment
            </p>

            <p className="font-bold text-gray-900">
              #{payment.id}
            </p>

            <p className="text-xs text-gray-500">
              {formatDate(
                payment.paymentDate,
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Firm / Vendor
            </p>

            <p className="font-semibold">
              {payment.companyName}
            </p>

            <p className="text-xs text-gray-500">
              {payment.vendorName}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Amount
            </p>

            <p className="font-semibold text-green-700">
              {formatCurrency(
                payment.amount,
              )}
            </p>

            <p className="text-xs text-gray-500">
              {payment.paymentMode.replaceAll(
                '_',
                ' ',
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Reference
            </p>

            <p>
              Bill:{' '}
              {payment.billNumber ||
                '-'}
            </p>

            <p className="text-xs text-gray-500">
              UTR:{' '}
              {payment.transactionId ||
                '-'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onView}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Receipts / Upload
          </button>

          <button
            type="button"
            onClick={onHide}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Hide
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentList({
  documents,
}: {
  documents: VendorDocument[];
}) {
  if (documents.length === 0) {
    return (
      <p className="mt-4 text-sm text-gray-500">
        No documents uploaded for this bill.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {documents.map(
        (document) => (
          <div
            key={document.id}
            className="flex flex-col gap-2 rounded-xl border p-3 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold text-gray-900">
                {document.fileName}
              </p>

              <p className="text-xs text-gray-500">
                {document.documentType.replaceAll(
                  '_',
                  ' ',
                )}{' '}
                |{' '}
                {formatDate(
                  document.createdAt,
                )}
              </p>
            </div>

            <a
              href={document.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white"
            >
              View Document
            </a>
          </div>
        ),
      )}
    </div>
  );
}

function ReceiptList({
  receipts,
}: {
  receipts: PaymentReceipt[];
}) {
  if (receipts.length === 0) {
    return (
      <p className="mt-4 text-sm text-gray-500">
        No receipts uploaded for this payment.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {receipts.map(
        (receipt) => (
          <div
            key={receipt.id}
            className="flex flex-col gap-2 rounded-xl border p-3 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p className="font-semibold text-gray-900">
                {receipt.fileName}
              </p>

              <p className="text-xs text-gray-500">
                {receipt.receiptType.replaceAll(
                  '_',
                  ' ',
                )}{' '}
                |{' '}
                {formatDate(
                  receipt.createdAt,
                )}
              </p>
            </div>

            <a
              href={receipt.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white"
            >
              View Receipt
            </a>
          </div>
        ),
      )}
    </div>
  );
}
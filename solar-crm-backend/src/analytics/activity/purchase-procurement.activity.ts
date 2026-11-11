
import { Repository, SelectQueryBuilder } from 'typeorm';

import {
  ProjectPurchaseOrder,
  ProjectPurchaseOrderStatus,
} from '../../project/project-purchase-order.entity';
import {
  ProjectVendorBill,
  ProjectVendorBillStatus,
} from '../../project/project-vendor-bill.entity';
import { ProjectVendorPayment } from '../../project/project-vendor-payment.entity';
import { ProjectVendorDocument } from '../../project/project-vendor-document.entity';
import { ProjectVendorPaymentReceipt } from '../../project/project-vendor-payment-receipt.entity';
import { ProjectVendorCompany } from '../../project/project-vendor-company.entity';

import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class PurchaseProcurementActivityProvider
  implements AnalyticsActivityProvider
{
  readonly moduleKey = 'PURCHASE_PROCUREMENT';
  readonly moduleLabel = 'Purchase Orders & Procurement';

  constructor(
    private readonly purchaseOrderRepository: Repository<ProjectPurchaseOrder>,
    private readonly vendorBillRepository: Repository<ProjectVendorBill>,
    private readonly vendorPaymentRepository: Repository<ProjectVendorPayment>,
    private readonly vendorDocumentRepository: Repository<ProjectVendorDocument>,
    private readonly paymentReceiptRepository: Repository<ProjectVendorPaymentReceipt>,
    private readonly vendorCompanyRepository: Repository<ProjectVendorCompany>,
  ) {}

  async build(
    context: AnalyticsActivityContext,
  ): Promise<AnalyticsActivitySection> {
    const ids = context.userIds;

    if (!ids.length) {
      return {
        moduleKey: this.moduleKey,
        moduleLabel: this.moduleLabel,
        metrics: [],
        hasActivity: false,
      };
    }

    const orders = () =>
      this.purchaseOrderRepository
        .createQueryBuilder('po')
        .where('po.isHidden = false')
        .andWhere('po.createdBy IN (:...ids)', { ids });

    const bills = () =>
      this.vendorBillRepository
        .createQueryBuilder('bill')
        .where('bill.isHidden = false')
        .andWhere('bill.createdBy IN (:...ids)', { ids });

    const payments = () =>
      this.vendorPaymentRepository
        .createQueryBuilder('payment')
        .where('payment.isHidden = false')
        .andWhere('payment.createdBy IN (:...ids)', { ids });

    const documents = () =>
      this.vendorDocumentRepository
        .createQueryBuilder('document')
        .where('document.isHidden = false')
        .andWhere('document.uploadedBy IN (:...ids)', { ids });

    const receipts = () =>
      this.paymentReceiptRepository
        .createQueryBuilder('receipt')
        .where('receipt.isHidden = false')
        .andWhere('receipt.uploadedBy IN (:...ids)', { ids });

    const companies = () =>
      this.vendorCompanyRepository
        .createQueryBuilder('company')
        .where('company.isHidden = false')
        .andWhere('company.createdBy IN (:...ids)', { ids });

    const period = <T extends object>(
      qb: SelectQueryBuilder<T>,
      alias: string,
    ): SelectQueryBuilder<T> =>
      qb.andWhere(
        `${alias}.createdAt >= :fromDate AND ${alias}.createdAt <= :toDate`,
        {
          fromDate: context.fromDate,
          toDate: context.toDate,
        },
      );

    const sumAmount = <T extends object>(
      qb: SelectQueryBuilder<T>,
      alias: string,
      field: string,
    ): Promise<number> =>
      qb
        .select(`COALESCE(SUM(${alias}.${field}), 0)`, 'amount')
        .getRawOne<{ amount: string }>()
        .then((row) => Number(row?.amount || 0));

    const orderStatus = (status: ProjectPurchaseOrderStatus) =>
      orders().andWhere('po.status = :status', { status });

    const billStatus = (status: ProjectVendorBillStatus) =>
      bills().andWhere('bill.status = :status', { status });

    const [
      totalOrders,
      periodOrders,
      draftOrders,
      approvedOrders,
      partiallyReceivedOrders,
      completedOrders,
      cancelledOrders,
      orderValue,
      periodOrderValue,
      totalBills,
      periodBills,
      unpaidBills,
      partiallyPaidBills,
      paidBills,
      billValue,
      periodBillValue,
      totalPayments,
      periodPayments,
      paymentValue,
      periodPaymentValue,
      totalDocuments,
      periodDocuments,
      totalReceipts,
      periodReceipts,
      totalCompanies,
      periodCompanies,
      activeCompanies,
      cancelledBills,
    ] = await Promise.all([
      orders().getCount(),
      period(orders(), 'po').getCount(),

      orderStatus(ProjectPurchaseOrderStatus.DRAFT).getCount(),
      orderStatus(ProjectPurchaseOrderStatus.APPROVED).getCount(),
      orderStatus(ProjectPurchaseOrderStatus.PARTIALLY_RECEIVED).getCount(),
      orderStatus(ProjectPurchaseOrderStatus.COMPLETED).getCount(),
      orderStatus(ProjectPurchaseOrderStatus.CANCELLED).getCount(),

      sumAmount(orders(), 'po', 'totalAmount'),
      sumAmount(period(orders(), 'po'), 'po', 'totalAmount'),

      bills().getCount(),
      period(bills(), 'bill').getCount(),

      billStatus(ProjectVendorBillStatus.UNPAID).getCount(),
      billStatus(ProjectVendorBillStatus.PARTIALLY_PAID).getCount(),
      billStatus(ProjectVendorBillStatus.PAID).getCount(),

      sumAmount(bills(), 'bill', 'totalAmount'),
      sumAmount(period(bills(), 'bill'), 'bill', 'totalAmount'),

      payments().getCount(),
      period(payments(), 'payment').getCount(),

      sumAmount(payments(), 'payment', 'amount'),
      sumAmount(
        period(payments(), 'payment'),
        'payment',
        'amount',
      ),

      documents().getCount(),
      period(documents(), 'document').getCount(),

      receipts().getCount(),
      period(receipts(), 'receipt').getCount(),

      companies().getCount(),
      period(companies(), 'company').getCount(),

      companies()
        .andWhere('company.isActive = true')
        .getCount(),

      billStatus(ProjectVendorBillStatus.CANCELLED).getCount(),
    ]);

    const metrics: AnalyticsActivitySection['metrics'] = [];

    const add = (
      key: string,
      label: string,
      kind: AnalyticsActivitySection['metrics'][number]['kind'],
      value: number,
      attribution: string,
      timeScope: 'CURRENT' | 'PERIOD',
      unit: 'COUNT' | 'INR' = 'COUNT',
      description?: string,
    ) => {
      metrics.push({
        key,
        label,
        kind,
        value,
        attribution,
        timeScope,
        unit,
        ...(description ? { description } : {}),
      });
    };

    // Purchase orders
    add('purchase_orders', 'Purchase Orders Created',
      'CREATED_WORK', totalOrders, 'po.createdBy', 'CURRENT');

    add('purchase_orders_period', 'Purchase Orders Created During Period',
      'CREATED_WORK', periodOrders, 'po.createdBy and createdAt', 'PERIOD');

    add('purchase_orders_draft', 'Purchase Orders Currently Draft',
      'PIPELINE', draftOrders, 'po.createdBy and status', 'CURRENT');

    add('purchase_orders_approved', 'Purchase Orders Currently Approved',
      'PIPELINE', approvedOrders, 'po.createdBy and status', 'CURRENT');

    add('purchase_orders_partially_received',
      'Purchase Orders Currently Partially Received',
      'PIPELINE', partiallyReceivedOrders, 'po.createdBy and status', 'CURRENT');

    add('purchase_orders_completed', 'Purchase Orders Currently Completed',
      'PIPELINE', completedOrders, 'po.createdBy and status', 'CURRENT');

    add('purchase_orders_cancelled', 'Purchase Orders Currently Cancelled',
      'PIPELINE', cancelledOrders, 'po.createdBy and status', 'CURRENT');

    add('purchase_order_value', 'Recorded Purchase Order Value',
      'FINANCIAL', orderValue, 'po.createdBy and totalAmount',
      'CURRENT', 'INR',
      'Includes draft orders. This is recorded order value, not confirmed expenditure.');

    add('purchase_order_value_period', 'Purchase Order Value Created During Period',
      'FINANCIAL', periodOrderValue,
      'po.createdBy, createdAt and totalAmount', 'PERIOD', 'INR');

    // Vendor bills
    add('vendor_bills', 'Vendor Bills Recorded',
      'CREATED_WORK', totalBills, 'bill.createdBy', 'CURRENT');

    add('vendor_bills_period', 'Vendor Bills Recorded During Period',
      'CREATED_WORK', periodBills, 'bill.createdBy and createdAt', 'PERIOD');

    add('vendor_bills_unpaid', 'Vendor Bills Currently Unpaid',
      'PIPELINE', unpaidBills, 'bill.createdBy and status', 'CURRENT');

    add('vendor_bills_partially_paid', 'Vendor Bills Currently Partially Paid',
      'PIPELINE', partiallyPaidBills, 'bill.createdBy and status', 'CURRENT');

    add('vendor_bills_paid', 'Vendor Bills Currently Paid',
      'PIPELINE', paidBills, 'bill.createdBy and status', 'CURRENT');

    add('vendor_bills_cancelled', 'Vendor Bills Currently Cancelled',
      'PIPELINE', cancelledBills, 'bill.createdBy and status', 'CURRENT');

    add('vendor_bill_value', 'Recorded Vendor Bill Value',
      'FINANCIAL', billValue, 'bill.createdBy and totalAmount',
      'CURRENT', 'INR',
      'Recorded bill value; not necessarily paid expenditure.');

    add('vendor_bill_value_period', 'Vendor Bill Value Recorded During Period',
      'FINANCIAL', periodBillValue,
      'bill.createdBy, createdAt and totalAmount', 'PERIOD', 'INR');

    // Vendor payments
    add('vendor_payments', 'Vendor Payments Recorded',
      'CREATED_WORK', totalPayments, 'payment.createdBy', 'CURRENT');

    add('vendor_payments_period', 'Vendor Payments Recorded During Period',
      'CREATED_WORK', periodPayments,
      'payment.createdBy and createdAt', 'PERIOD');

    add('vendor_payment_value', 'Recorded Vendor Payment Amount',
      'FINANCIAL', paymentValue,
      'payment.createdBy and amount', 'CURRENT', 'INR',
      'Sum of vendor payment records; not independent proof of bank settlement.');

    add('vendor_payment_value_period', 'Vendor Payment Amount Recorded During Period',
      'FINANCIAL', periodPaymentValue,
      'payment.createdBy, createdAt and amount', 'PERIOD', 'INR');

    // Supporting documents
    add('vendor_documents_uploaded', 'Vendor Documents Uploaded',
      'CREATED_WORK', totalDocuments, 'document.uploadedBy', 'CURRENT');

    add('vendor_documents_uploaded_period', 'Vendor Documents Uploaded During Period',
      'CREATED_WORK', periodDocuments,
      'document.uploadedBy and createdAt', 'PERIOD');

    add('vendor_payment_proofs_uploaded', 'Vendor Payment Proofs Uploaded',
      'CREATED_WORK', totalReceipts, 'receipt.uploadedBy', 'CURRENT');

    add('vendor_payment_proofs_uploaded_period',
      'Vendor Payment Proofs Uploaded During Period',
      'CREATED_WORK', periodReceipts,
      'receipt.uploadedBy and createdAt', 'PERIOD');

    // Vendor companies
    add('vendor_companies_created', 'Vendor Companies Created',
      'CREATED_WORK', totalCompanies, 'company.createdBy', 'CURRENT');

    add('vendor_companies_created_period',
      'Vendor Companies Created During Period',
      'CREATED_WORK', periodCompanies,
      'company.createdBy and createdAt', 'PERIOD');

    add('vendor_companies_active', 'Vendor Companies Currently Active',
      'PIPELINE', activeCompanies,
      'company.createdBy and isActive', 'CURRENT');

    return {
      moduleKey: this.moduleKey,
      moduleLabel: this.moduleLabel,
      metrics,
      hasActivity:
        totalOrders > 0 ||
        totalBills > 0 ||
        totalPayments > 0 ||
        totalDocuments > 0 ||
        totalReceipts > 0 ||
        totalCompanies > 0,
    };
  }
}

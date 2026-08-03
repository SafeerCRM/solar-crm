import {
  Injectable,
} from '@nestjs/common';

import {
  StaffPayrollMetricType,
} from './staff-payroll-rule.entity';

export enum StaffPayrollMetricCategory {
  TELECALLING = 'TELECALLING',
  LEADS = 'LEADS',
  MEETINGS = 'MEETINGS',
  PROJECTS = 'PROJECTS',
  TRADING = 'TRADING',
  ATTENDANCE = 'ATTENDANCE',
  HR = 'HR',
  PAYMENTS = 'PAYMENTS',
  SUPPORT = 'SUPPORT',
  MANUAL = 'MANUAL',
}

export enum StaffPayrollMetricValueType {
  COUNT = 'COUNT',
  NUMBER = 'NUMBER',
  MINUTES = 'MINUTES',
  HOURS = 'HOURS',
  DAYS = 'DAYS',
  AMOUNT = 'AMOUNT',
  PERCENTAGE = 'PERCENTAGE',
}

export enum StaffPayrollMetricSourceType {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
}

export type StaffPayrollMetricCatalogueItem = {
  key: StaffPayrollMetricType;

  label: string;

  description: string;

  category:
    StaffPayrollMetricCategory;

  valueType:
    StaffPayrollMetricValueType;

  sourceType:
    StaffPayrollMetricSourceType;

  /*
   * Empty means the option may be used for
   * any role after Owner/HR deliberately
   * selects it.
   *
   * A populated array limits the option to
   * the listed roles.
   */
  supportedRoles: string[];

  /*
   * This identifier will later connect the
   * catalogue option to its backend resolver.
   *
   * It is intentionally not a table name or
   * SQL expression.
   */
  resolverKey: string | null;

  isActive: boolean;
};

@Injectable()
export class StaffPayrollMetricCatalogueService {
  private readonly catalogue:
    StaffPayrollMetricCatalogueItem[] = [
    /*
     * TELECALLING
     */
    {
      key:
        StaffPayrollMetricType.CALLS_MADE,

      label:
        'Calls Made',

      description:
        'Total valid calls made by the selected staff member during the payroll period.',

      category:
        StaffPayrollMetricCategory.TELECALLING,

      valueType:
        StaffPayrollMetricValueType.COUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'TELECALLER',
        'TELECALLING_ASSISTANT',
        'TELECALLING_MANAGER',
        'LEAD_EXECUTIVE',
        'LEAD_MANAGER',
      ],

      resolverKey:
        'CALLS_MADE',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.UNIQUE_CONTACTS_CALLED,

      label:
        'Unique Contacts Called',

      description:
        'Number of different contacts called by the selected staff member during the payroll period.',

      category:
        StaffPayrollMetricCategory.TELECALLING,

      valueType:
        StaffPayrollMetricValueType.COUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'TELECALLER',
        'TELECALLING_ASSISTANT',
        'TELECALLING_MANAGER',
        'LEAD_EXECUTIVE',
        'LEAD_MANAGER',
      ],

      resolverKey:
        'UNIQUE_CONTACTS_CALLED',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.CALL_DURATION_MINUTES,

      label:
        'Call Duration',

      description:
        'Total valid call duration in minutes for the selected staff member during the payroll period.',

      category:
        StaffPayrollMetricCategory.TELECALLING,

      valueType:
        StaffPayrollMetricValueType.MINUTES,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'TELECALLER',
        'TELECALLING_ASSISTANT',
        'TELECALLING_MANAGER',
        'LEAD_EXECUTIVE',
        'LEAD_MANAGER',
      ],

      resolverKey:
        'CALL_DURATION_MINUTES',

      isActive: true,
    },

    /*
     * LEADS
     */
    {
      key:
        StaffPayrollMetricType.LEADS_CREATED,

      label:
        'Leads Created',

      description:
        'Number of leads created or attributed to the selected staff member during the payroll period.',

      category:
        StaffPayrollMetricCategory.LEADS,

      valueType:
        StaffPayrollMetricValueType.COUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'TELECALLER',
        'TELECALLING_ASSISTANT',
        'TELECALLING_MANAGER',
        'LEAD_EXECUTIVE',
        'LEAD_MANAGER',
      ],

      resolverKey:
        'LEADS_CREATED',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.QUALIFIED_LEADS,

      label:
        'Qualified Leads',

      description:
        'Number of leads that reached the configured qualified state during the payroll period.',

      category:
        StaffPayrollMetricCategory.LEADS,

      valueType:
        StaffPayrollMetricValueType.COUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'TELECALLER',
        'TELECALLING_ASSISTANT',
        'TELECALLING_MANAGER',
        'LEAD_EXECUTIVE',
        'LEAD_MANAGER',
      ],

      resolverKey:
        'QUALIFIED_LEADS',

      isActive: true,
    },

    /*
     * MEETINGS
     */
    {
      key:
        StaffPayrollMetricType.MEETINGS_SCHEDULED,

      label:
        'Meetings Scheduled',

      description:
        'Number of valid meetings scheduled and attributed to the selected staff member during the payroll period.',

      category:
        StaffPayrollMetricCategory.MEETINGS,

      valueType:
        StaffPayrollMetricValueType.COUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'TELECALLER',
        'TELECALLING_ASSISTANT',
        'TELECALLING_MANAGER',
        'LEAD_EXECUTIVE',
        'LEAD_MANAGER',
        'MEETING_ASSISTANT',
        'MEETING_MANAGER',
      ],

      resolverKey:
        'MEETINGS_SCHEDULED',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.MEETINGS_COMPLETED,

      label:
        'Meetings Completed',

      description:
        'Number of latest-version meetings completed by or attributed to the selected staff member during the payroll period.',

      category:
        StaffPayrollMetricCategory.MEETINGS,

      valueType:
        StaffPayrollMetricValueType.COUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'MEETING_ASSISTANT',
        'MEETING_MANAGER',
        'MARKETING_HEAD',
      ],

      resolverKey:
        'MEETINGS_COMPLETED',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.GPS_SITE_VISITS_COMPLETED,

      label:
        'GPS Site Visits Completed',

      description:
        'Number of completed site-visit meetings having the required GPS evidence during the payroll period.',

      category:
        StaffPayrollMetricCategory.MEETINGS,

      valueType:
        StaffPayrollMetricValueType.COUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'MEETING_ASSISTANT',
        'MEETING_MANAGER',
        'MARKETING_HEAD',
      ],

      resolverKey:
        'GPS_SITE_VISITS_COMPLETED',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.DEALER_MEETINGS_COMPLETED,

      label:
        'Dealer Meetings Completed',

      description:
        'Number of completed dealer-related meetings attributed to the selected trading staff member during the payroll period.',

      category:
        StaffPayrollMetricCategory.TRADING,

      valueType:
        StaffPayrollMetricValueType.COUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'TRADING_MANAGER',
        'TRADING_HEAD',
      ],

      resolverKey:
        'DEALER_MEETINGS_COMPLETED',

      isActive: true,
    },

    /*
     * CRM PROJECTS
     *
     * These are the client-described orders
     * for Telecalling, Lead and Meeting roles.
     */
    {
      key:
        StaffPayrollMetricType.APPROVED_PROJECTS,

      label:
        'Approved Projects',

      description:
        'Payroll-eligible CRM projects approved and attributed to the selected staff member during the payroll period.',

      category:
        StaffPayrollMetricCategory.PROJECTS,

      valueType:
        StaffPayrollMetricValueType.COUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [],

      resolverKey:
        'APPROVED_PROJECTS',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.SELF_APPROVED_PROJECTS,

      label:
        'Self Approved Projects',

      description:
        'Payroll-eligible approved CRM projects directly attributed to the selected staff member.',

      category:
        StaffPayrollMetricCategory.PROJECTS,

      valueType:
        StaffPayrollMetricValueType.COUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [],

      resolverKey:
        'SELF_APPROVED_PROJECTS',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.COMPANY_APPROVED_PROJECTS,

      label:
        'Company Approved Projects',

      description:
        'Total payroll-eligible approved CRM projects across the company during the payroll period.',

      category:
        StaffPayrollMetricCategory.PROJECTS,

      valueType:
        StaffPayrollMetricValueType.COUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [],

      resolverKey:
        'COMPANY_APPROVED_PROJECTS',

      isActive: true,
    },

    /*
     * TRADING / DEALER ORDERS
     */
    {
      key:
        StaffPayrollMetricType.DEALER_ORDERS,

      label:
        'Dealer Orders',

      description:
        'Valid dealer orders attributed to the selected trading staff member during the payroll period.',

      category:
        StaffPayrollMetricCategory.TRADING,

      valueType:
        StaffPayrollMetricValueType.COUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'TRADING_MANAGER',
        'TRADING_HEAD',
      ],

      resolverKey:
        'DEALER_ORDERS',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.DEALER_SALES_AMOUNT,

      label:
        'Dealer Sales Amount',

      description:
        'Total qualifying dealer sales value attributed to the selected trading staff member during the payroll period.',

      category:
        StaffPayrollMetricCategory.TRADING,

      valueType:
        StaffPayrollMetricValueType.AMOUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'TRADING_MANAGER',
        'TRADING_HEAD',
      ],

      resolverKey:
        'DEALER_SALES_AMOUNT',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.DEALER_NET_PROFIT,

      label:
        'Dealer Net Profit',

      description:
        'Calculated net profit from qualifying dealer business attributed to the selected trading staff member.',

      category:
        StaffPayrollMetricCategory.TRADING,

      valueType:
        StaffPayrollMetricValueType.AMOUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'TRADING_MANAGER',
        'TRADING_HEAD',
      ],

      resolverKey:
        'DEALER_NET_PROFIT',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.TEAM_DEALER_ORDERS,

      label:
        'Team Dealer Orders',

      description:
        'Total qualifying dealer orders for staff members reporting within the selected trading team.',

      category:
        StaffPayrollMetricCategory.TRADING,

      valueType:
        StaffPayrollMetricValueType.COUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'TRADING_HEAD',
      ],

      resolverKey:
        'TEAM_DEALER_ORDERS',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.TEAM_DEALER_SALES_AMOUNT,

      label:
        'Team Dealer Sales Amount',

      description:
        'Total qualifying sales amount for the selected trading team during the payroll period.',

      category:
        StaffPayrollMetricCategory.TRADING,

      valueType:
        StaffPayrollMetricValueType.AMOUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'TRADING_HEAD',
      ],

      resolverKey:
        'TEAM_DEALER_SALES_AMOUNT',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.TEAM_DEALER_NET_PROFIT,

      label:
        'Team Dealer Net Profit',

      description:
        'Total qualifying net profit for the selected trading team during the payroll period.',

      category:
        StaffPayrollMetricCategory.TRADING,

      valueType:
        StaffPayrollMetricValueType.AMOUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'TRADING_HEAD',
      ],

      resolverKey:
        'TEAM_DEALER_NET_PROFIT',

      isActive: true,
    },

    /*
     * HR / ATTENDANCE
     */
    {
      key:
        StaffPayrollMetricType.STAFF_JOININGS,

      label:
        'Staff Joinings',

      description:
        'Number of qualifying staff joinings attributed to the selected HR staff member during the payroll period.',

      category:
        StaffPayrollMetricCategory.HR,

      valueType:
        StaffPayrollMetricValueType.COUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'HR_MANAGER',
      ],

      resolverKey:
        'STAFF_JOININGS',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.PRESENT_DAYS,

      label:
        'Present Days',

      description:
        'Number of valid attendance days marked present during the payroll period.',

      category:
        StaffPayrollMetricCategory.ATTENDANCE,

      valueType:
        StaffPayrollMetricValueType.DAYS,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [],

      resolverKey:
        'PRESENT_DAYS',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.WORKING_DAYS,

      label:
        'Required Working Days',

      description:
        'Configured working days applicable to the selected payroll period.',

      category:
        StaffPayrollMetricCategory.ATTENDANCE,

      valueType:
        StaffPayrollMetricValueType.DAYS,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [],

      resolverKey:
        'WORKING_DAYS',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.WORKING_HOURS,

      label:
        'Working Hours',

      description:
        'Total valid attendance working hours recorded during the payroll period.',

      category:
        StaffPayrollMetricCategory.ATTENDANCE,

      valueType:
        StaffPayrollMetricValueType.HOURS,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [],

      resolverKey:
        'WORKING_HOURS',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.ATTENDANCE_PERCENTAGE,

      label:
        'Attendance Percentage',

      description:
        'Attendance percentage calculated from the applicable attendance settings and attendance records.',

      category:
        StaffPayrollMetricCategory.ATTENDANCE,

      valueType:
        StaffPayrollMetricValueType.PERCENTAGE,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [],

      resolverKey:
        'ATTENDANCE_PERCENTAGE',

      isActive: true,
    },

    /*
     * PAYMENTS
     */
    {
      key:
        StaffPayrollMetricType.PAYMENT_COLLECTION_AMOUNT,

      label:
        'Payment Collection Amount',

      description:
        'Total qualifying project payment amount collected by the selected staff member during the payroll period.',

      category:
        StaffPayrollMetricCategory.PAYMENTS,

      valueType:
        StaffPayrollMetricValueType.AMOUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'PAYMENT_MANAGER',
        'PAYMENT_COLLECTION_EXECUTIVE',
        'ACCOUNT_MANAGER',
      ],

      resolverKey:
        'PAYMENT_COLLECTION_AMOUNT',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.PAYMENT_COLLECTION_PERCENTAGE,

      label:
        'Payment Collection Percentage',

      description:
        'Percentage of assigned qualifying payment value collected during the payroll period.',

      category:
        StaffPayrollMetricCategory.PAYMENTS,

      valueType:
        StaffPayrollMetricValueType.PERCENTAGE,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'PAYMENT_MANAGER',
        'PAYMENT_COLLECTION_EXECUTIVE',
        'ACCOUNT_MANAGER',
      ],

      resolverKey:
        'PAYMENT_COLLECTION_PERCENTAGE',

      isActive: true,
    },

    /*
     * SUPPORT / MAINTENANCE
     */
    {
      key:
        StaffPayrollMetricType.COMPLAINTS_ASSIGNED,

      label:
        'Complaints Assigned',

      description:
        'Number of qualifying customer complaints assigned to the selected staff member during the payroll period.',

      category:
        StaffPayrollMetricCategory.SUPPORT,

      valueType:
        StaffPayrollMetricValueType.COUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'CUSTOMER_MANAGER',
        'MAINTENANCE_MANAGER',
        'PROJECT_MANAGER',
      ],

      resolverKey:
        'COMPLAINTS_ASSIGNED',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.COMPLAINTS_RESOLVED,

      label:
        'Complaints Resolved',

      description:
        'Number of qualifying customer complaints resolved by the selected staff member during the payroll period.',

      category:
        StaffPayrollMetricCategory.SUPPORT,

      valueType:
        StaffPayrollMetricValueType.COUNT,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'CUSTOMER_MANAGER',
        'MAINTENANCE_MANAGER',
        'PROJECT_MANAGER',
      ],

      resolverKey:
        'COMPLAINTS_RESOLVED',

      isActive: true,
    },

    {
      key:
        StaffPayrollMetricType.COMPLAINT_RESOLUTION_PERCENTAGE,

      label:
        'Complaint Resolution Percentage',

      description:
        'Percentage of qualifying assigned complaints resolved during the payroll period.',

      category:
        StaffPayrollMetricCategory.SUPPORT,

      valueType:
        StaffPayrollMetricValueType.PERCENTAGE,

      sourceType:
        StaffPayrollMetricSourceType.AUTOMATIC,

      supportedRoles: [
        'CUSTOMER_MANAGER',
        'MAINTENANCE_MANAGER',
        'PROJECT_MANAGER',
      ],

      resolverKey:
        'COMPLAINT_RESOLUTION_PERCENTAGE',

      isActive: true,
    },

    /*
     * MANUAL
     */
    {
      key:
        StaffPayrollMetricType.MANUAL_NUMBER,

      label:
        'Manual Numeric Value',

      description:
        'A numeric result entered manually by Owner or HR during payroll preparation. It does not fetch CRM records automatically.',

      category:
        StaffPayrollMetricCategory.MANUAL,

      valueType:
        StaffPayrollMetricValueType.NUMBER,

      sourceType:
        StaffPayrollMetricSourceType.MANUAL,

      supportedRoles: [],

      resolverKey: null,

      isActive: true,
    },
  ];

  getAll(): StaffPayrollMetricCatalogueItem[] {
    return this.catalogue
      .filter((item) => item.isActive)
      .map((item) => ({
        ...item,
        supportedRoles: [
          ...item.supportedRoles,
        ],
      }));
  }

  getByKey(
    metricType: StaffPayrollMetricType,
  ): StaffPayrollMetricCatalogueItem | null {
    const item = this.catalogue.find(
      (catalogueItem) =>
        catalogueItem.key === metricType &&
        catalogueItem.isActive,
    );

    if (!item) {
      return null;
    }

    return {
      ...item,
      supportedRoles: [
        ...item.supportedRoles,
      ],
    };
  }

  getForRole(
    role: string,
  ): StaffPayrollMetricCatalogueItem[] {
    const normalizedRole = String(
      role || '',
    )
      .trim()
      .toUpperCase();

    return this.getAll().filter(
      (item) =>
        item.supportedRoles.length === 0 ||
        item.supportedRoles.includes(
          normalizedRole,
        ),
    );
  }

  supportsRole(
    metricType: StaffPayrollMetricType,
    role: string,
  ): boolean {
    const item =
      this.getByKey(metricType);

    if (!item) {
      return false;
    }

    if (
      item.supportedRoles.length === 0
    ) {
      return true;
    }

    const normalizedRole = String(
      role || '',
    )
      .trim()
      .toUpperCase();

    return item.supportedRoles.includes(
      normalizedRole,
    );
  }

  isAutomatic(
    metricType: StaffPayrollMetricType,
  ): boolean {
    return (
      this.getByKey(metricType)
        ?.sourceType ===
      StaffPayrollMetricSourceType.AUTOMATIC
    );
  }

  isManual(
    metricType: StaffPayrollMetricType,
  ): boolean {
    return (
      this.getByKey(metricType)
        ?.sourceType ===
      StaffPayrollMetricSourceType.MANUAL
    );
  }
}
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { In, MoreThan, Repository } from 'typeorm';

import PDFDocument = require('pdfkit');
import { Response } from 'express';

import * as path from 'path';

import { Project } from './project.entity';
import {
  ProjectDocument,
  ProjectDocumentType,
} from './project-document.entity';
import { ProjectComment } from './project-comment.entity';

import {
  ProjectApprovalStatus,
  ProjectStatus,
  ProjectType,
} from './project.entity';

import { CalculatorService } from '../calculator/calculator.service';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import {
  ProjectMaterialMaster,
  ProjectMaterialMarginType,
} from './project-material-master.entity';
import {
  ProjectMaterialRequest,
  ProjectMaterialRequestStatus,
} from './project-material-request.entity';
import { ProjectMaterialRequestItem } from './project-material-request-item.entity';
import { ProjectBranch } from './project-branch.entity';
import {
  ProjectLoanDetail,
  ProjectLoanStatus,
} from './project-loan-detail.entity';
import {
  ProjectSubsidyDetail,
  ProjectSubsidyStatus,
} from './project-subsidy-detail.entity';
import {
  ProjectElectricityDetail,
  ProjectElectricityStatus,
} from './project-electricity-detail.entity';
import {
  ProjectExecutionActivity,
  ProjectExecutionActivityStatus,
  ProjectExecutionActivityType,
} from './project-execution-activity.entity';
import { ProjectExecutionProof } from './project-execution-proof.entity';
import {
  ProjectExecutionReminder,
  ProjectExecutionReminderStatus,
  ProjectExecutionReminderType,
} from './project-execution-reminder.entity';

import {
  ProjectExecutionReminderUserState,
  ProjectExecutionReminderUserStateStatus,
} from './project-execution-reminder-user-state.entity';

import {
  ProjectPaymentInstallment,
  ProjectPaymentInstallmentStatus,
} from './project-payment-installment.entity';

import {
  ProjectPaymentReminderUserState,
  ProjectPaymentReminderUserStateStatus,
} from './project-payment-reminder-user-state.entity';

import {
  ProjectReminderUserState,
  ProjectReminderUserStateStatus,
} from './project-reminder-user-state.entity';

import { ProjectEditHistory } from './project-edit-history.entity';

import { ProjectVendor } from './project-vendor.entity';

import {
  ProjectPurchaseOrder,
  ProjectPurchaseOrderStatus,
} from './project-purchase-order.entity';

import { ProjectPurchaseOrderItem } from './project-purchase-order-item.entity';

import {
  ProjectProformaInvoice,
  ProjectProformaInvoiceStatus,
} from './project-proforma-invoice.entity';

import { ProjectProformaInvoiceItem } from './project-proforma-invoice-item.entity';

import {
  ProjectFinalInvoice,
  ProjectFinalInvoiceStatus,
} from './project-final-invoice.entity';

import { ProjectFinalInvoiceItem } from './project-final-invoice-item.entity';

import {
  ProjectPartyLedger,
  ProjectLedgerEntryType,
  ProjectLedgerSourceType,
} from './project-party-ledger.entity';

import {
  ProjectAccountExpense,
  ProjectAccountExpenseApprovalStatus,
  ProjectAccountExpenseType,
} from './project-account-expense.entity';

import {
  ProjectContractorAssignment,
  ProjectContractorWorkStatus,
  ProjectContractorWorkScope,
} from './project-contractor-assignment.entity';
import {
  ProjectContractorProof,
  ProjectContractorProofType,
} from './project-contractor-proof.entity';
import { ProjectContractor } from './project-contractor.entity';
import { ProjectContractorComment } from './project-contractor-comment.entity';
import { ProjectLoanCoApplicant } from './project-loan-co-applicant.entity';

import { ProjectStockItem } from './project-stock-item.entity';
import {
  ProjectStockMovement,
  ProjectStockMovementType,
} from './project-stock-movement.entity';

import { ProjectConsumption } from './project-consumption.entity';

import { ProjectCustomerUpdate } from './project-customer-update.entity';

import {
  ProjectDealerOrder,
  ProjectDealerOrderStatus,
  ProjectDealerPaymentType,
} from './project-dealer-order.entity';
import { ProjectDealerOrderItem } from './project-dealer-order-item.entity';
import {
  ProjectDealerPayment,
  ProjectDealerPaymentStatus,
} from './project-dealer-payment.entity';
import { ProjectDealerComment } from './project-dealer-comment.entity';
import {
  ProjectDealerNotification,
  ProjectDealerNotificationStatus,
} from './project-dealer-notification.entity';

import { ProjectDealerMonthlyRequirement } from './project-dealer-monthly-requirement.entity';

import {
  ProjectTradingMeeting,
  ProjectTradingMeetingStatus,
} from './project-trading-meeting.entity';

import { FollowUp } from '../followup/follow-up.entity';

import {
  ProjectCleaningAssignment,
  ProjectCleaningStatus,
} from './project-cleaning-assignment.entity';

import {
  ProjectContractorRescheduleRequest,
  ContractorRescheduleAssignmentType,
  ContractorRescheduleStatus,
} from './project-contractor-reschedule-request.entity';

import { CustomerNotification } from '../customer-portal/customer-notification.entity';

@Injectable()
export class ProjectService {

  private toNumberOrZero(value: any): number {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }

  const num = Number(value);

  return Number.isFinite(num)
    ? num
    : 0;
}

private getRequiredContractorProofTypesByScopeForRegister(workScope: string) {
  if (workScope === 'STRUCTURE_TEAM') {
    return [
      ProjectContractorProofType.STRUCTURE_PHOTO,
      ProjectContractorProofType.PILLAR_PHOTO,
      ProjectContractorProofType.PANEL_WITH_CLIENT_PHOTO,
    ];
  }

  if (workScope === 'ELECTRICAL_TEAM') {
    return [
      ProjectContractorProofType.INVERTER_PHOTO,
      ProjectContractorProofType.SOLAR_METER_PHOTO,
      ProjectContractorProofType.NET_METER_PHOTO,
      ProjectContractorProofType.EARTHING_WITH_CLIENT_PHOTO,
    ];
  }

  if (workScope === 'INSTALLATION_TEAM') {
    return [
      ProjectContractorProofType.PANEL_SERIAL_NUMBER_PHOTO,
      ProjectContractorProofType.PANEL_WITH_CLIENT_PHOTO,
      ProjectContractorProofType.INVERTER_PHOTO,
    ];
  }

  if (workScope === 'OTHER') {
    return [ProjectContractorProofType.OTHER];
  }

  return [
    ProjectContractorProofType.STRUCTURE_PHOTO,
    ProjectContractorProofType.PILLAR_PHOTO,
    ProjectContractorProofType.PANEL_SERIAL_NUMBER_PHOTO,
    ProjectContractorProofType.INVERTER_PHOTO,
    ProjectContractorProofType.SOLAR_METER_PHOTO,
    ProjectContractorProofType.NET_METER_PHOTO,
    ProjectContractorProofType.EARTHING_WITH_CLIENT_PHOTO,
    ProjectContractorProofType.PANEL_WITH_CLIENT_PHOTO,
  ];
}

private generatePoNumber() {
  return `PO-${Date.now()}`;
}

private generatePiNumber() {
  return `PI-${Date.now()}`;
}

private generateFinalInvoiceNumber() {
  return `INV-${Date.now()}`;
}

private generateDealerOrderNumber() {
  return `DO-${Date.now()}`;
}

private getRequiredContractorProofTypesByScope(workScope: string) {
  if (workScope === ProjectContractorWorkScope.STRUCTURE_TEAM) {
    return [
      ProjectContractorProofType.STRUCTURE_PHOTO,
      ProjectContractorProofType.PILLAR_PHOTO,
      ProjectContractorProofType.PANEL_WITH_CLIENT_PHOTO,
    ];
  }

  if (workScope === ProjectContractorWorkScope.ELECTRICAL_TEAM) {
    return [
      ProjectContractorProofType.INVERTER_PHOTO,
      ProjectContractorProofType.SOLAR_METER_PHOTO,
      ProjectContractorProofType.NET_METER_PHOTO,
      ProjectContractorProofType.EARTHING_WITH_CLIENT_PHOTO,
    ];
  }

  if (workScope === ProjectContractorWorkScope.INSTALLATION_TEAM) {
    return [
      ProjectContractorProofType.PANEL_SERIAL_NUMBER_PHOTO,
      ProjectContractorProofType.PANEL_WITH_CLIENT_PHOTO,
      ProjectContractorProofType.INVERTER_PHOTO,
    ];
  }

  if (workScope === ProjectContractorWorkScope.OTHER) {
    return [ProjectContractorProofType.OTHER];
  }

  return [
    ProjectContractorProofType.STRUCTURE_PHOTO,
    ProjectContractorProofType.PILLAR_PHOTO,
    ProjectContractorProofType.PANEL_SERIAL_NUMBER_PHOTO,
    ProjectContractorProofType.INVERTER_PHOTO,
    ProjectContractorProofType.SOLAR_METER_PHOTO,
    ProjectContractorProofType.NET_METER_PHOTO,
    ProjectContractorProofType.EARTHING_WITH_CLIENT_PHOTO,
    ProjectContractorProofType.PANEL_WITH_CLIENT_PHOTO,
  ];
}

private getMaterialSellingRate(material: ProjectMaterialMaster) {
  const directSellingRate = Number((material as any).sellingRate || 0);

  if (directSellingRate > 0) {
    return directSellingRate;
  }

  const baseRate = Number((material as any).rate || 0);
  const expectedMargin = Number((material as any).expectedMargin || 0);

  if ((material as any).marginType === ProjectMaterialMarginType.PERCENT) {
    return baseRate + (baseRate * expectedMargin) / 100;
  }

  return baseRate + expectedMargin;
}

private readonly projectCreationRequiredDocumentGroups = [
  {
    label: 'Aadhaar Card',
    types: [ProjectDocumentType.AADHAAR_CARD],
  },
  {
    label: 'Electricity Bill',
    types: [ProjectDocumentType.ELECTRICITY_BILL],
  },
  {
    label: 'Customer Photo',
    types: [ProjectDocumentType.CLIENT_PHOTO],
  },
  {
    label: 'Site Photo',
    types: [
      ProjectDocumentType.CLIENT_GPS_PHOTO,
      ProjectDocumentType.ROOF_GPS_PHOTO,
      ProjectDocumentType.PLANT_GPS_PHOTO,
    ],
  },
  {
    label: 'Bank Document',
    types: [
      ProjectDocumentType.CANCEL_CHEQUE,
      ProjectDocumentType.BANK_DIARY,
    ],
  },
  {
    label: 'Loan Document',
    types: [
      ProjectDocumentType.JAN_SAMARTH_DOCUMENT,
      ProjectDocumentType.LOAN_SANCTION_LETTER,
      ProjectDocumentType.BANK_VISIT_PROOF,
    ],
  },
  {
    label: 'Property Document',
    types: [ProjectDocumentType.HOUSE_REGISTRY],
  },
  {
    label: 'Other',
    types: [ProjectDocumentType.OTHER],
  },
];

private assertOwnerOnly(user: any) {
  const roles = Array.isArray(user?.roles)
    ? user.roles
    : [];

  if (!roles.includes('OWNER')) {
    throw new ForbiddenException(
      'Only owner can edit payment entries',
    );
  }
}

private async assertRequiredProjectCreationDocumentsUploaded(
  projectId: number,
) {
  const project = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const cashRequiredGroups = [
  {
    label: 'Vendor Agreement',
    types: [
      ProjectDocumentType.VENDOR_AGREEMENT,
      'VENDOR_AGREEMENT' as any,
    ],
  },
  {
    label: 'Aadhaar Card',
    types: [
      ProjectDocumentType.AADHAAR_CARD,
      'AADHAAR' as any,
    ],
  },
  {
    label: 'Electricity Bill',
    types: [
      ProjectDocumentType.ELECTRICITY_BILL,
      'ELECTRICITY_BILL' as any,
    ],
  },
  {
    label: 'PAN Card',
    types: [
      ProjectDocumentType.PAN_CARD,
      'PAN_CARD' as any,
    ],
  },
  {
    label: 'Bank Document',
    types: [
      ProjectDocumentType.CANCEL_CHEQUE,
      ProjectDocumentType.BANK_DIARY,
      'BANK_DOCUMENT' as any,
    ],
  },
];

const loanRequiredGroups = [
  ...cashRequiredGroups,
  {
    label: 'Customer Photo',
    types: [
      ProjectDocumentType.CLIENT_PHOTO,
      'CUSTOMER_PHOTO' as any,
    ],
  },
  {
    label: 'Site Photo',
    types: [
      ProjectDocumentType.CLIENT_GPS_PHOTO,
      ProjectDocumentType.ROOF_GPS_PHOTO,
      ProjectDocumentType.PLANT_GPS_PHOTO,
      'SITE_PHOTO' as any,
    ],
  },
  {
    label: 'Proposal/Quotation',
    types: [
      ProjectDocumentType.JAN_SAMARTH_DOCUMENT,
      ProjectDocumentType.LOAN_SANCTION_LETTER,
      ProjectDocumentType.BANK_VISIT_PROOF,
      'LOAN_DOCUMENT' as any,
    ],
  },
  {
    label: 'Property Document',
    types: [
      ProjectDocumentType.HOUSE_REGISTRY,
      'PROPERTY_DOCUMENT' as any,
    ],
  },
];

  const requiredGroups =
    project.projectType === ProjectType.LOAN
      ? loanRequiredGroups
      : cashRequiredGroups;

  const allRequiredTypes = requiredGroups.flatMap(
    (group) => group.types,
  );

  const documents =
    await this.projectDocumentRepository.find({
      where: {
        projectId,
        documentType: In(allRequiredTypes),
      },
      select: ['documentType'],
    });

  const uploadedTypes = new Set(
    documents.map((doc) => doc.documentType),
  );

  const missingGroups = requiredGroups.filter(
    (group) =>
      !group.types.some((type) =>
        uploadedTypes.has(type),
      ),
  );

  if (missingGroups.length > 0) {
    throw new BadRequestException(
      `Please upload mandatory documents before approval: ${missingGroups
        .map((group) => group.label)
        .join(', ')}`,
    );
  }
}

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(ProjectDocument)
    private readonly projectDocumentRepository: Repository<ProjectDocument>,

    @InjectRepository(CustomerNotification)
private readonly customerNotificationRepository: Repository<CustomerNotification>,

    @InjectRepository(ProjectComment)
    private readonly projectCommentRepository: Repository<ProjectComment>,

    @InjectRepository(ProjectMaterialMaster)
private readonly projectMaterialMasterRepository: Repository<ProjectMaterialMaster>,

@InjectRepository(ProjectMaterialRequest)
private readonly projectMaterialRequestRepository: Repository<ProjectMaterialRequest>,

@InjectRepository(ProjectMaterialRequestItem)
private readonly projectMaterialRequestItemRepository: Repository<ProjectMaterialRequestItem>,

@InjectRepository(ProjectBranch)
private readonly projectBranchRepository: Repository<ProjectBranch>,

@InjectRepository(ProjectLoanDetail)
private readonly projectLoanDetailRepository: Repository<ProjectLoanDetail>,

@InjectRepository(ProjectSubsidyDetail)
private readonly projectSubsidyDetailRepository: Repository<ProjectSubsidyDetail>,

@InjectRepository(ProjectElectricityDetail)
private readonly projectElectricityDetailRepository: Repository<ProjectElectricityDetail>,

@InjectRepository(ProjectExecutionActivity)
private readonly projectExecutionActivityRepository: Repository<ProjectExecutionActivity>,

@InjectRepository(ProjectExecutionProof)
private readonly projectExecutionProofRepository: Repository<ProjectExecutionProof>,

@InjectRepository(ProjectExecutionReminder)
private readonly projectExecutionReminderRepository: Repository<ProjectExecutionReminder>,

@InjectRepository(ProjectExecutionReminderUserState)
private readonly projectExecutionReminderUserStateRepository: Repository<ProjectExecutionReminderUserState>,

@InjectRepository(ProjectPaymentInstallment)
private readonly projectPaymentInstallmentRepository: Repository<ProjectPaymentInstallment>,

@InjectRepository(ProjectPaymentReminderUserState)
private readonly projectPaymentReminderUserStateRepository: Repository<ProjectPaymentReminderUserState>,

@InjectRepository(ProjectReminderUserState)
private readonly projectReminderUserStateRepository: Repository<ProjectReminderUserState>,

@InjectRepository(ProjectEditHistory)
private readonly projectEditHistoryRepository: Repository<ProjectEditHistory>,

@InjectRepository(ProjectVendor)
private readonly projectVendorRepository: Repository<ProjectVendor>,

@InjectRepository(ProjectStockItem)
private readonly projectStockItemRepository: Repository<ProjectStockItem>,

@InjectRepository(ProjectStockMovement)
private readonly projectStockMovementRepository: Repository<ProjectStockMovement>,

@InjectRepository(ProjectPurchaseOrder)
private readonly projectPurchaseOrderRepository: Repository<ProjectPurchaseOrder>,

@InjectRepository(ProjectPurchaseOrderItem)
private readonly projectPurchaseOrderItemRepository: Repository<ProjectPurchaseOrderItem>,

@InjectRepository(ProjectProformaInvoice)
private readonly projectProformaInvoiceRepository: Repository<ProjectProformaInvoice>,

@InjectRepository(ProjectProformaInvoiceItem)
private readonly projectProformaInvoiceItemRepository: Repository<ProjectProformaInvoiceItem>,

@InjectRepository(ProjectFinalInvoice)
private readonly projectFinalInvoiceRepository: Repository<ProjectFinalInvoice>,

@InjectRepository(ProjectFinalInvoiceItem)
private readonly projectFinalInvoiceItemRepository: Repository<ProjectFinalInvoiceItem>,

@InjectRepository(ProjectPartyLedger)
private readonly projectPartyLedgerRepository: Repository<ProjectPartyLedger>,

@InjectRepository(ProjectAccountExpense)
private readonly projectAccountExpenseRepository: Repository<ProjectAccountExpense>,

@InjectRepository(ProjectContractorAssignment)
private readonly projectContractorAssignmentRepository: Repository<ProjectContractorAssignment>,

@InjectRepository(ProjectCleaningAssignment)
private readonly projectCleaningAssignmentRepository: Repository<ProjectCleaningAssignment>,

@InjectRepository(ProjectContractorRescheduleRequest)
private readonly projectContractorRescheduleRequestRepository: Repository<ProjectContractorRescheduleRequest>,

@InjectRepository(ProjectContractorProof)
private readonly projectContractorProofRepository: Repository<ProjectContractorProof>,

@InjectRepository(ProjectContractor)
private readonly projectContractorRepository: Repository<ProjectContractor>,

@InjectRepository(ProjectContractorComment)
private readonly projectContractorCommentRepository: Repository<ProjectContractorComment>,

@InjectRepository(ProjectLoanCoApplicant)
private readonly projectLoanCoApplicantRepository: Repository<ProjectLoanCoApplicant>,

@InjectRepository(ProjectConsumption)
private readonly projectConsumptionRepository: Repository<ProjectConsumption>,

@InjectRepository(ProjectCustomerUpdate)
private readonly projectCustomerUpdateRepository: Repository<ProjectCustomerUpdate>,

@InjectRepository(ProjectDealerOrder)
private readonly projectDealerOrderRepository: Repository<ProjectDealerOrder>,

@InjectRepository(ProjectDealerOrderItem)
private readonly projectDealerOrderItemRepository: Repository<ProjectDealerOrderItem>,

@InjectRepository(ProjectDealerPayment)
private readonly projectDealerPaymentRepository: Repository<ProjectDealerPayment>,

@InjectRepository(ProjectDealerComment)
private readonly projectDealerCommentRepository: Repository<ProjectDealerComment>,

@InjectRepository(ProjectDealerNotification)
private readonly projectDealerNotificationRepository: Repository<ProjectDealerNotification>,

@InjectRepository(ProjectDealerMonthlyRequirement)
private readonly projectDealerMonthlyRequirementRepository: Repository<ProjectDealerMonthlyRequirement>,

@InjectRepository(ProjectTradingMeeting)
private readonly projectTradingMeetingRepository: Repository<ProjectTradingMeeting>,

@InjectRepository(FollowUp)
private readonly followUpRepository: Repository<FollowUp>,

    private readonly calculatorService: CalculatorService,

  ) {}

  async create(
  data: Partial<Project>,
  user?: any,
) {
    if (!data.customerName) {
      throw new BadRequestException('Customer name is required');
    }

    if (!data.projectType) {
      throw new BadRequestException('Project type is required');
    }

    if (
      data.projectType === ProjectType.LOAN &&
      (!data.marginMoney || !data.loanAmount)
    ) {
      throw new BadRequestException(
        'Margin money and loan amount required for loan projects',
      );
    }

    const payload: any = {
  ...data,

    gpsLatitude:
    (data as any).gpsLatitude === '' ||
    (data as any).gpsLatitude === null ||
    (data as any).gpsLatitude === undefined
      ? undefined
      : Number((data as any).gpsLatitude),

  gpsLongitude:
    (data as any).gpsLongitude === '' ||
    (data as any).gpsLongitude === null ||
    (data as any).gpsLongitude === undefined
      ? undefined
      : Number((data as any).gpsLongitude),

  gpsAddress:
    String((data as any).gpsAddress || '').trim() || undefined,

  projectOwnerId: user?.id || null,

projectOwnerName:
  user?.name || user?.email || '',

projectOwnerRole: Array.isArray(user?.roles)
  ? user.roles.join(', ')
  : '',

  dcrPanelCount: this.toNumberOrZero(
    (data as any).dcrPanelCount,
  ),

  nonDcrPanelCount: this.toNumberOrZero(
    (data as any).nonDcrPanelCount,
  ),

  marginMoney: this.toNumberOrZero(
    (data as any).marginMoney,
  ),

  loanAmount: this.toNumberOrZero(
    (data as any).loanAmount,
  ),

  finalCost: this.toNumberOrZero(
  (data as any).finalCost,
),

  projectCost: this.toNumberOrZero(
    (data as any).projectCost,
  ),

  subsidy: this.toNumberOrZero(
    (data as any).subsidy,
  ),

  netAmount: this.toNumberOrZero(
    (data as any).netAmount,
  ),

  discomExpenditureAmount:
    this.toNumberOrZero(
      (data as any)
        .discomExpenditureAmount,
    ),

  expectedLagat: this.toNumberOrZero(
    (data as any).expectedLagat,
  ),

  expectedProfit: this.toNumberOrZero(
    (data as any).expectedProfit,
  ),
};

    const project = this.projectRepository.create({
  ...payload,

  leadId: payload?.leadId ? Number(payload.leadId) : undefined,
meetingId: payload?.meetingId ? Number(payload.meetingId) : undefined,
proposalId: payload?.proposalId ? Number(payload.proposalId) : undefined,
vendorId: payload?.vendorId ? Number(payload.vendorId) : undefined,

projectOwnerId: payload?.projectOwnerId
  ? Number(payload.projectOwnerId)
  : undefined,

  customerUserId: payload?.customerUserId
  ? Number(payload.customerUserId)
  : undefined,

  customerId: payload?.customerId
  ? Number(payload.customerId)
  : undefined,

customerCode:
  String(payload?.customerCode || '').trim() || undefined,

customerUserName:
  String(payload?.customerUserName || '').trim() || undefined,

  status: ProjectStatus.PENDING_APPROVAL,
  marketingHeadApprovalStatus: ProjectApprovalStatus.PENDING,
  ownerApprovalStatus: ProjectApprovalStatus.PENDING,
});

    return this.projectRepository.save(project);
  }

  async createWithCalculation(data: any) {
    const calculation =
      await this.calculatorService.calculateProjectCost(data);

    const projectData: Partial<Project> = {
      leadId: data?.leadId ? Number(data.leadId) : undefined,

      customerName: data.customerName,
      customerPhone: data.customerPhone,

      projectSize: data?.projectSize || null,

      projectCost: calculation.totalProjectCost,

      subsidy: Number(data?.subsidy || 0),

      netAmount:
        calculation.totalProjectCost - Number(data?.subsidy || 0),

      projectType: data?.projectType,

      marginMoney: Number(data?.marginMoney || 0),

      loanAmount: Number(data?.loanAmount || 0),

      status: ProjectStatus.PENDING_APPROVAL,

      vendorId: data?.vendorId ? Number(data.vendorId) : undefined,

      paymentStatus: data?.paymentStatus || 'PENDING',

      remarks:
        data?.remarks || 'Project created using calculator',
    };

const project = this.projectRepository.create(projectData);

    const savedProject =
      await this.projectRepository.save(project);

    return {
      message:
        'Project created with calculated cost successfully',

      calculation,

      project: savedProject,
    };
  }

  async findAll(
  filters?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    branch?: string;
    owner?: string;
  },
  user?: any,
) {
  const page =
    Number(filters?.page) > 0
      ? Number(filters?.page)
      : 1;

  const limit =
    Number(filters?.limit) > 0
      ? Math.min(Number(filters?.limit), 100)
      : 20;

  const skip = (page - 1) * limit;

  const query =
    this.projectRepository.createQueryBuilder(
      'project',
    );

    query.where('project.isHidden = false');

    const currentUserId = Number(
  user?.id || user?.sub,
);

const roles = Array.isArray(user?.roles)
  ? user.roles
  : [];

const canViewAll =
  roles.includes('OWNER') ||
  roles.includes('MARKETING_HEAD') ||
  roles.includes('PROJECT_MANAGER') ||
  roles.includes('PROJECT_EXECUTIVE') ||
  roles.includes('LOAN_MANAGER') ||
  roles.includes('SUBSIDY_MANAGER') ||
  roles.includes('ELECTRICITY_MANAGER') ||
  roles.includes('PAYMENT_COLLECTION_EXECUTIVE') ||
  roles.includes('PAYMENT_MANAGER') ||
  roles.includes('ACCOUNT_MANAGER');

if (!canViewAll) {
  query.andWhere(
    'project.projectOwnerId = :currentUserId',
    {
      currentUserId,
    },
  );
}

  if (filters?.search) {
    query.andWhere(
      `
      LOWER(project.customerName) LIKE :search
      OR LOWER(project.customerPhone) LIKE :search
      OR CAST(project.id AS TEXT) LIKE :search
      `,
      {
        search: `%${filters.search.toLowerCase()}%`,
      },
    );
  }

  if (roles.includes('LOAN_MANAGER')) {
  query.andWhere(
    'project.projectType = :loanProjectType',
    {
      loanProjectType: 'LOAN',
    },
  );
}

  if (filters?.status) {
    query.andWhere(
      'project.status = :status',
      {
        status: filters.status,
      },
    );
  }

  if (filters?.branch) {
    query.andWhere(
      'LOWER(project.branchName) LIKE :branch',
      {
        branch: `%${filters.branch.toLowerCase()}%`,
      },
    );
  }

  if (filters?.owner) {
  query.andWhere(
    'CAST(project.projectOwnerId AS TEXT) = :owner',
    {
      owner: filters.owner,
    },
  );
}

  query.orderBy('project.createdAt', 'DESC');

  query.skip(skip).take(limit);

  const [data, total] =
    await query.getManyAndCount();

    const projectIds = data.map((project) => project.id);

const executionActivities = projectIds.length
  ? await this.projectExecutionActivityRepository.find({
      where: {
        projectId: In(projectIds),
      },
    })
  : [];

const paymentInstallments = projectIds.length
  ? await this.projectPaymentInstallmentRepository.find({
      where: {
        projectId: In(projectIds),
      },
    })
  : [];

const enrichedData = data.map((project) => {
  const projectActivities =
    executionActivities.filter(
      (activity) => activity.projectId === project.id,
    );

  const totalExecutionActivities =
  projectActivities.length;

const completedActivities =
  projectActivities.filter(
    (activity) =>
      String(activity.status) === 'COMPLETED',
  );

const runningActivities =
  projectActivities.filter(
    (activity) =>
      String(activity.status) === 'IN_PROGRESS',
  );

const pendingActivities =
  projectActivities.filter(
    (activity) =>
      String(activity.status) === 'PENDING' ||
      String(activity.status) === 'OVERDUE',
  );

const completedExecutionActivities =
  completedActivities.length;

const executionPercentage =
  totalExecutionActivities > 0
    ? Math.round(
        (completedExecutionActivities /
          totalExecutionActivities) *
          100,
      )
    : 0;

const runningActivity =
  runningActivities[0]?.activityType || '';

const latestCompletedActivity =
  completedActivities
    .sort(
      (a, b) =>
        new Date(
          b.completedDate ||
            b.updatedAt ||
            b.createdAt,
        ).getTime() -
        new Date(
          a.completedDate ||
            a.updatedAt ||
            a.createdAt,
        ).getTime(),
    )[0]?.activityType || '';

const nextPendingActivity =
  pendingActivities
    .sort(
      (a, b) =>
        new Date(
          a.scheduledDate ||
            a.createdAt,
        ).getTime() -
        new Date(
          b.scheduledDate ||
            b.createdAt,
        ).getTime(),
    )[0]?.activityType || '';

  const projectPayments =
    paymentInstallments.filter(
      (payment) => payment.projectId === project.id,
    );

  const approvedReceivedAmount =
    projectPayments
      .filter(
        (payment) =>
          String((payment as any).approvalStatus || '') ===
          'APPROVED',
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.paidAmount || 0),
        0,
      );

  const projectTotalAmount = Number(
    (project as any).finalCost ||
      (project as any).netAmount ||
      (project as any).projectCost ||
      0,
  );

  const paymentReceivedPercentage =
    projectTotalAmount > 0
      ? Math.round(
          (approvedReceivedAmount /
            projectTotalAmount) *
            100,
        )
      : 0;

  return {
    ...project,
    executionSummary: {
  totalActivities: totalExecutionActivities,
  completedActivities: completedExecutionActivities,
  pendingActivities: pendingActivities.length,
  runningActivities: runningActivities.length,
  percentage: executionPercentage,

  runningActivity,
  latestCompletedActivity,
  nextPendingActivity,
},
    paymentSummary: {
      totalAmount: projectTotalAmount,
      receivedAmount: approvedReceivedAmount,
      percentage: Math.min(paymentReceivedPercentage, 100),
    },
  };
});

  return {
  data: enrichedData,
  total,
  page,
  limit,
  totalPages:
    Math.ceil(total / limit) || 1,
};
}

  async findOne(id: number, user?: any) {
    const project = await this.projectRepository.findOne({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const currentUserId = Number(
  user?.id || user?.sub,
);

const roles = Array.isArray(user?.roles)
  ? user.roles
  : [];

const canViewAll =
  roles.includes('OWNER') ||
  roles.includes('MARKETING_HEAD') ||
  roles.includes('PROJECT_MANAGER') ||
  roles.includes('LOAN_MANAGER') ||
  roles.includes('SUBSIDY_MANAGER') ||
  roles.includes('ELECTRICITY_MANAGER') ||
  roles.includes('PAYMENT_COLLECTION_EXECUTIVE') ||
  roles.includes('PAYMENT_MANAGER') ||
  roles.includes('ACCOUNT_MANAGER');

if (
  !canViewAll &&
  Number(project.projectOwnerId) !==
    currentUserId
) {
  throw new ForbiddenException(
    'You can only access your own projects',
  );
}

    return project;
  }

  async getProjectEditHistory(projectId: number) {
  return this.projectEditHistoryRepository.find({
    where: {
      projectId,
    },
    order: {
      createdAt: 'DESC',
    },
    take: 100,
  });
}

  async update(
  id: number,
  data: Partial<Project>,
  user?: any,
) {
  const project = await this.projectRepository.findOne({
    where: { id },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const roles = Array.isArray(user?.roles)
    ? user.roles
    : [];

  const isOwner = roles.includes('OWNER');
  const isMarketingHead = roles.includes('MARKETING_HEAD');
  const isProjectManager = roles.includes('PROJECT_MANAGER');

  const editableFieldsForOwner = [
    'customerName',
    'customerPhone',
    'city',
    'zone',
    'branchName',
    'projectOwnerId',
    'projectOwnerName',
    'projectOwnerRole',
    'electricityKNumber',
    'customerGmail',
    'customerUserId',
'customerUserName',
'customerId',
'customerCode',
    'aadhaarLinkedMobile',
    'panelBrand',
    'dcrPanelCount',
    'nonDcrPanelCount',
    'converterBrand',
    'converterCapacity',
    'converterPhase',
    'structureType',
    'structureCapacityKw',
    'buildingHeight',
    'projectType',
    'marginMoney',
    'loanAmount',
    'subsidyType',
    'projectCost',
    'finalCost',
    'discomName',
    'discomExpenditureType',
    'discomExpenditureAmount',
    'expectedLagat',
    'expectedProfit',
    'status',
    'paymentStatus',
    'startDate',
    'expectedCompletionDate',
    'actualCompletionDate',
    'remarks',
        'address',
    'gpsLatitude',
    'gpsLongitude',
    'gpsAddress',
  ];

  const editableFieldsForMarketingHead = [
    'customerName',
    'customerPhone',
    'city',
    'zone',
    'branchName',
    'projectOwnerId',
    'projectOwnerName',
    'projectOwnerRole',
    'electricityKNumber',
    'customerGmail',
    'customerUserId',
'customerUserName',
'customerId',
'customerCode',
    'aadhaarLinkedMobile',
    'panelBrand',
    'dcrPanelCount',
    'nonDcrPanelCount',
    'converterBrand',
    'converterCapacity',
    'converterPhase',
    'structureType',
    'structureCapacityKw',
    'buildingHeight',
    'projectType',
    'subsidyType',
    'discomName',
    'discomExpenditureType',
    'discomExpenditureAmount',
    'startDate',
    'expectedCompletionDate',
    'remarks',
        'address',
    'gpsLatitude',
    'gpsLongitude',
    'gpsAddress',
  ];

  const editableFieldsForProjectManager = editableFieldsForOwner;

  let allowedFields: string[] = [];

  if (isOwner) {
    allowedFields = editableFieldsForOwner;
  } else if (isMarketingHead) {
    allowedFields = editableFieldsForMarketingHead;
  } else if (isProjectManager) {
    allowedFields = editableFieldsForProjectManager;
  }

  const safeData: Partial<Project> = {};

  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      (safeData as any)[key] = (data as any)[key];
    }
  }

  const historyRows: Partial<ProjectEditHistory>[] = [];

for (const key of Object.keys(safeData)) {
  const oldValue = (project as any)[key];
  const newValue = (safeData as any)[key];

  const normalizedOld =
    oldValue === null || oldValue === undefined
      ? ''
      : String(oldValue);

  const normalizedNew =
    newValue === null || newValue === undefined
      ? ''
      : String(newValue);

  if (normalizedOld !== normalizedNew) {
    historyRows.push({
      projectId: project.id,
      fieldName: key,
      oldValue: normalizedOld,
      newValue: normalizedNew,
      changedBy:
        user?.id || user?.userId || null,
      changedByName:
        user?.name || null,
      changedByRole:
        Array.isArray(user?.roles)
          ? user.roles.join(', ')
          : '',
    });
  }
}

const numberFields = [
  'projectOwnerId',
  'dcrPanelCount',
  'nonDcrPanelCount',
  'marginMoney',
  'customerId',
  'loanAmount',
  'finalCost',
  'projectCost',
  'subsidy',
  'netAmount',
  'discomExpenditureAmount',
  'expectedLagat',
  'expectedProfit',
  'gpsLatitude',
'gpsLongitude',
];

for (const field of numberFields) {
  if (Object.prototype.hasOwnProperty.call(safeData, field)) {
    const value = (safeData as any)[field];

    (safeData as any)[field] =
  value === '' || value === null || value === undefined
    ? undefined
    : Number(value);
  }
}

if (Object.prototype.hasOwnProperty.call(safeData, 'customerUserId')) {
  const value = (safeData as any).customerUserId;

  (safeData as any).customerUserId =
    value === '' || value === null || value === undefined
      ? undefined
      : Number(value);
}

const dateFields = [
  'startDate',
  'expectedCompletionDate',
  'actualCompletionDate',
];

for (const field of dateFields) {
  if (Object.prototype.hasOwnProperty.call(safeData, field)) {
    const value = (safeData as any)[field];

    (safeData as any)[field] =
      value === '' || value === null || value === undefined
        ? null
        : new Date(value);
  }
}

Object.assign(project, safeData);

const updatedProject =
  await this.projectRepository.save(project);

if (historyRows.length > 0) {
  await this.projectEditHistoryRepository.save(
    historyRows,
  );
}

return updatedProject;
}

async uploadProjectDocument(file: any, body: any, user: any) {
  if (!file) {
    throw new BadRequestException('Document file is required');
  }

  const projectId = Number(body?.projectId);

  if (!projectId) {
    throw new BadRequestException('Project ID is required');
  }

  const project = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const mimeType = String(file.mimetype || '');

  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!allowedTypes.includes(mimeType)) {
    throw new BadRequestException('Only PDF, JPG, PNG, and WEBP files are allowed');
  }

  const maxSize = 10 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new BadRequestException('Document file must be less than 10 MB');
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket =
    process.env.SUPABASE_PROJECT_DOCUMENTS_BUCKET || 'project-documents';

  if (!supabaseUrl || !serviceKey) {
    throw new BadRequestException('Supabase storage is not configured');
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const originalName = String(file.originalname || 'document');
  const extension = originalName.includes('.')
    ? originalName.split('.').pop()
    : mimeType.split('/')[1] || 'file';

  const safeExtension = String(extension || 'file').replace(/[^a-zA-Z0-9]/g, '');

  const filePath = `projects/project-${projectId}/user-${user?.id || 'unknown'}/${Date.now()}-${randomUUID()}.${safeExtension}`;

  const uploadResult = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadResult.error) {
    throw new BadRequestException(uploadResult.error.message);
  }

  const publicUrlResult = supabase.storage.from(bucket).getPublicUrl(filePath);
  const fileUrl = publicUrlResult.data.publicUrl;

  const document = this.projectDocumentRepository.create({
    projectId,
    department: body?.department || 'PROJECT_CREATION',
    documentType: body?.documentType || 'OTHER',
    fileName: originalName,
    fileUrl,
    uploadedBy: user?.id || 0,
    uploadedByRole: Array.isArray(user?.roles)
      ? user.roles.join(',')
      : user?.role || '',
    visibleToRoles: body?.visibleToRoles
      ? String(body.visibleToRoles).split(',').map((role) => role.trim()).filter(Boolean)
      : [],
    visibleToCustomer:
      body?.visibleToCustomer === true || body?.visibleToCustomer === 'true',
    remarks: body?.remarks || '',
  });

  const savedDocument = await this.projectDocumentRepository.save(document);

const shouldNotifyCustomer =
  body?.notifyCustomer === true ||
  body?.notifyCustomer === 'true';

const isVisibleToCustomer =
  body?.visibleToCustomer === true ||
  body?.visibleToCustomer === 'true';

if (
  shouldNotifyCustomer &&
  isVisibleToCustomer &&
  project.customerId
) {
  await this.customerNotificationRepository.save(
    this.customerNotificationRepository.create({
      customerId: Number(project.customerId),
      customerCode: project.customerCode || '',
      projectId: project.id,
      notificationType: 'DOCUMENT_UPDATE',
      title: 'New Document Uploaded',
      message: `${String(savedDocument.documentType || 'Document').replaceAll(
        '_',
        ' ',
      )} is now available in your Documents Vault.`,
      relatedEntityType: 'PROJECT_DOCUMENT',
      relatedEntityId: savedDocument.id,
    } as any),
  );
}

return {
  message: 'Project document uploaded successfully',
  document: savedDocument,
  fileUrl,
  filePath,
};
}

async uploadProjectDocuments(files: any[], body: any, user: any) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new BadRequestException('At least one document file is required');
  }

  const uploadedDocuments: ProjectDocument[] = [];

  const roles = Array.isArray(user?.roles)
  ? user.roles
  : [];

const canUploadAnyDepartment =
  roles.includes('OWNER') ||
  roles.includes('MARKETING_HEAD') ||
  roles.includes('PROJECT_MANAGER');

if (!canUploadAnyDepartment) {
  if (roles.includes('LOAN_MANAGER')) {
    body.department = 'LOAN';
  } else if (roles.includes('SUBSIDY_MANAGER')) {
    body.department = 'SUBSIDY';
  } else if (roles.includes('ELECTRICITY_MANAGER')) {
    body.department = 'ELECTRICITY';
  } else if (
    roles.includes('PAYMENT_COLLECTION_EXECUTIVE') ||
    roles.includes('PAYMENT_MANAGER') ||
    roles.includes('ACCOUNT_MANAGER')
  ) {
    body.department = 'PAYMENT_COLLECTION';
  } else if (roles.includes('PROJECT_EXECUTIVE')) {
    body.department = 'PROJECT_MANAGEMENT';
  }
}

  for (const file of files) {
    const result = await this.uploadProjectDocument(file, body, user);
    uploadedDocuments.push(result.document);
  }

  return {
    message: `${uploadedDocuments.length} document(s) uploaded successfully`,
    documents: uploadedDocuments,
  };
}

async getProjectDocuments(projectId: number, user?: any) {
  const project = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const roles = Array.isArray(user?.roles)
    ? user.roles
    : [];

  const canSeeAllDocuments =
  roles.includes('OWNER') ||
  roles.includes('MARKETING_HEAD') ||
  roles.includes('PROJECT_MANAGER') ||
  roles.includes('PROJECT_EXECUTIVE') ||
  roles.includes('PAYMENT_COLLECTION_EXECUTIVE') ||
  roles.includes('PAYMENT_MANAGER') ||
  roles.includes('ACCOUNT_MANAGER') ||
  roles.includes('LOAN_MANAGER') ||
  roles.includes('SUBSIDY_MANAGER') ||
  roles.includes('ELECTRICITY_MANAGER') ||
  roles.includes('MAINTENANCE_MANAGER') ||
  roles.includes('CUSTOMER_MANAGER');

  let allowedDepartments: string[] = [];

  if (canSeeAllDocuments) {
    return this.projectDocumentRepository.find({
      where: { projectId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  if (roles.includes('LOAN_MANAGER')) {
  allowedDepartments.push('LOAN');
  allowedDepartments.push('LOAN_DEPARTMENT');
}

  if (roles.includes('SUBSIDY_MANAGER')) {
    allowedDepartments.push('SUBSIDY');
allowedDepartments.push('SUBSIDY_DEPARTMENT');
  }

  if (roles.includes('ELECTRICITY_MANAGER')) {
    allowedDepartments.push('ELECTRICITY');
allowedDepartments.push('ELECTRICITY_DEPARTMENT');
  }

  if (
    roles.includes('PAYMENT_COLLECTION_EXECUTIVE') ||
    roles.includes('PAYMENT_MANAGER') ||
    roles.includes('ACCOUNT_MANAGER')
  ) {
    allowedDepartments.push('PAYMENT_COLLECTION');
  }

  if (roles.includes('PROJECT_EXECUTIVE')) {
    allowedDepartments.push('PROJECT_MANAGEMENT');
  }

  if (allowedDepartments.length === 0) {
    allowedDepartments = ['PROJECT_CREATION'];
  }

  return this.projectDocumentRepository
    .createQueryBuilder('document')
    .where('document.projectId = :projectId', {
      projectId,
    })
    .andWhere('document.department IN (:...allowedDepartments)', {
      allowedDepartments,
    })
    .orderBy('document.createdAt', 'DESC')
    .getMany();
}


  async addDocument(data: Partial<ProjectDocument>) {
    const project = await this.projectRepository.findOne({
      where: {
        id: Number(data.projectId),
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const document =
      this.projectDocumentRepository.create(data);

    return this.projectDocumentRepository.save(document);
  }

  async deleteProjectDocument(
  id: number,
  user: any,
) {
  const document =
    await this.projectDocumentRepository.findOne({
      where: { id },
    });

  if (!document) {
    throw new NotFoundException(
      'Project document not found',
    );
  }

  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : [];

  const isOwner =
    userRoles.includes('OWNER');

  const isUploader =
    Number(document.uploadedBy) ===
    Number(user?.id);

  if (!isOwner && !isUploader) {
    throw new BadRequestException(
      'You are not allowed to delete this document',
    );
  }

  try {
    const supabaseUrl =
      process.env.SUPABASE_URL;

    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    const bucket =
      process.env
        .SUPABASE_PROJECT_DOCUMENTS_BUCKET ||
      'project-documents';

    if (supabaseUrl && serviceKey) {
      const supabase = createClient(
        supabaseUrl,
        serviceKey,
      );

      const fileUrl =
        document.fileUrl || '';

      const splitText =
        `/storage/v1/object/public/${bucket}/`;

      const filePath =
        fileUrl.includes(splitText)
          ? fileUrl.split(splitText)[1]
          : '';

      if (filePath) {
        await supabase.storage
          .from(bucket)
          .remove([filePath]);
      }
    }
  } catch (error) {
    console.error(
      'Failed to delete file from storage:',
      error,
    );
  }

  await this.projectDocumentRepository.delete(id);

  return {
    message:
      'Project document deleted successfully',
  };
}

async getProjectOwners() {
  const rows = await this.projectRepository
    .createQueryBuilder('project')
    .select([
      'project.projectOwnerId AS "projectOwnerId"',
      'project.projectOwnerName AS "projectOwnerName"',
      'project.projectOwnerRole AS "projectOwnerRole"',
    ])
    .where('project.projectOwnerId IS NOT NULL')
    .groupBy('project.projectOwnerId')
    .addGroupBy('project.projectOwnerName')
    .addGroupBy('project.projectOwnerRole')
    .orderBy('project.projectOwnerName', 'ASC')
    .getRawMany();

  return rows;
}

  async addComment(
  data: Partial<ProjectComment>,
  user?: any,
) {
  const project = await this.projectRepository.findOne({
    where: {
      id: Number(data.projectId),
    },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const comment =
  this.projectCommentRepository.create({
    ...data,
    department:
      (data as any).department || 'GENERAL',
    createdBy: user?.id || null,
    createdByName: user?.name || user?.email || '',
    createdByRole: Array.isArray(user?.roles)
      ? user.roles.join(', ')
      : '',
  });

  return this.projectCommentRepository.save(comment);
}

async getProjectComments(
  projectId: number,
  department?: string,
) {
  return this.projectCommentRepository.find({
    where: department
      ? {
          projectId,
          department: department as any,
        }
      : {
          projectId,
        },
    order: {
      createdAt: 'DESC',
    },
  });
}

async projectManagerApproval(
  id: number,
  body: any,
  user: any,
) {
  const project = await this.projectRepository.findOne({
    where: { id },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  project.projectManagerApprovalStatus =
    body?.status || 'PENDING';

  project.projectManagerApprovalNote =
    body?.note || null;

  project.projectManagerApprovedBy =
    user?.id || user?.userId || null;

  project.projectManagerApprovedAt =
    new Date();

    if (body?.status === 'APPROVED') {
  await this.assertRequiredProjectCreationDocumentsUploaded(
    id,
  );
}

  return this.projectRepository.save(project);
}

  async marketingHeadApproval(
  id: number,
  body: {
    status?: ProjectApprovalStatus;
    approvalStatus?: ProjectApprovalStatus;
    note?: string;
    approvedBy?: number;
  },
) {
  const project = await this.projectRepository.findOne({
    where: { id },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const approvalStatus =
    body.approvalStatus || body.status;

    if (
  approvalStatus ===
  ProjectApprovalStatus.APPROVED
) {
  await this.assertRequiredProjectCreationDocumentsUploaded(
    id,
  );
}

  if (!approvalStatus) {
    throw new BadRequestException('Approval status is required');
  }

  project.marketingHeadApprovalStatus =
    approvalStatus;

  project.marketingHeadApprovalNote =
    body.note || '';

  project.marketingHeadApprovedBy =
    body.approvedBy || 0;

  project.marketingHeadApprovedAt = new Date();

  if (approvalStatus === ProjectApprovalStatus.REJECTED) {
    project.status = ProjectStatus.REJECTED;
  }

  return this.projectRepository.save(project);
}

  async createMaterialMaster(data: Partial<ProjectMaterialMaster>) {
  if (!data.name || !String(data.name).trim()) {
    throw new BadRequestException('Material name is required');
  }

  const item = this.projectMaterialMasterRepository.create({
    name: String(data.name).trim(),
    category: data.category || '',
    unit: data.unit || '',
    brand: data.brand || '',

    hsnCode: (data as any).hsnCode || '',
    vendorPreferredName: (data as any).vendorPreferredName || '',

    // Existing working field preserved
    rate: Number(data.rate || 0),

    gstPercent: Number(data.gstPercent || 0),

    marginType:
      (data as any).marginType === 'PERCENT'
        ? ProjectMaterialMarginType.PERCENT
: ProjectMaterialMarginType.AMOUNT,

    // Existing working field preserved
    expectedMargin: Number((data as any).expectedMargin || 0),

    sellingRate: Number((data as any).sellingRate || 0),

    minimumStockLevel: Number((data as any).minimumStockLevel || 0),

    remarks: data.remarks || '',
    isActive: data.isActive !== false,
  });

  return this.projectMaterialMasterRepository.save(item);
}

async getMaterialMasters(activeOnly = false) {
  return this.projectMaterialMasterRepository.find({
    where: activeOnly
      ? {
          isActive: true,
        }
      : {},
    order: {
      createdAt: 'DESC',
    },
  });
}

async updateMaterialMaster(id: number, data: Partial<ProjectMaterialMaster>) {
  const item = await this.projectMaterialMasterRepository.findOne({
    where: { id },
  });

  if (!item) {
    throw new NotFoundException('Material item not found');
  }

  Object.assign(item, {
    ...data,

    hsnCode:
      (data as any).hsnCode !== undefined
        ? (data as any).hsnCode || ''
        : (item as any).hsnCode,

    vendorPreferredName:
      (data as any).vendorPreferredName !== undefined
        ? (data as any).vendorPreferredName || ''
        : (item as any).vendorPreferredName,

    rate:
      data.rate !== undefined
        ? Number(data.rate || 0)
        : item.rate,

    gstPercent:
      data.gstPercent !== undefined
        ? Number(data.gstPercent || 0)
        : item.gstPercent,

    marginType:
      (data as any).marginType !== undefined
        ? (data as any).marginType === 'PERCENT'
          ? ProjectMaterialMarginType.PERCENT
: ProjectMaterialMarginType.AMOUNT
        : (item as any).marginType,

    expectedMargin:
      (data as any).expectedMargin !== undefined
        ? Number((data as any).expectedMargin || 0)
        : (item as any).expectedMargin,

    sellingRate:
      (data as any).sellingRate !== undefined
        ? Number((data as any).sellingRate || 0)
        : (item as any).sellingRate,

    minimumStockLevel:
      (data as any).minimumStockLevel !== undefined
        ? Number((data as any).minimumStockLevel || 0)
        : (item as any).minimumStockLevel,

  });

  return this.projectMaterialMasterRepository.save(item);
}

async deleteMaterialMaster(id: number) {
  const item =
    await this.projectMaterialMasterRepository.findOne({
      where: { id },
    });

  if (!item) {
    throw new NotFoundException(
      'Material item not found',
    );
  }

  item.isActive = false;

  await this.projectMaterialMasterRepository.save(
    item,
  );

  return {
    message: 'Material item disabled successfully',
  };
}

async enableMaterialMaster(id: number) {
  const item =
    await this.projectMaterialMasterRepository.findOne({
      where: { id },
    });

  if (!item) {
    throw new NotFoundException(
      'Material item not found',
    );
  }

  item.isActive = true;

  await this.projectMaterialMasterRepository.save(
    item,
  );

  return {
    message: 'Material item enabled successfully',
  };
}

async listProjectStockItems(query: any) {
  const {
    page = 1,
    limit = 20,
    branch,
    material,
    showHidden,
  } = query || {};

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (pageNumber - 1) * limitNumber;

  const qb = this.projectStockItemRepository
    .createQueryBuilder('stock')
    .orderBy('stock.createdAt', 'DESC')
    .skip(skip)
    .take(limitNumber);

  if (showHidden === 'true') {
    qb.where('stock.isHidden = true');
  } else {
    qb.where('stock.isHidden = false');
  }

  if (branch?.trim()) {
    qb.andWhere('LOWER(stock.branchName) LIKE LOWER(:branch)', {
      branch: `%${branch.trim()}%`,
    });
  }

  if (material?.trim()) {
    qb.andWhere(
      `(
        LOWER(stock.materialName) LIKE LOWER(:material)
        OR LOWER(stock.category) LIKE LOWER(:material)
        OR LOWER(stock.brand) LIKE LOWER(:material)
      )`,
      {
        material: `%${material.trim()}%`,
      },
    );
  }

  const [data, total] = await qb.getManyAndCount();

  const materialIds = data
  .map((item) => Number(item.materialId || 0))
  .filter(Boolean);

const materials = materialIds.length
  ? await this.projectMaterialMasterRepository.find({
      where: {
        id: In(materialIds),
      },
    })
  : [];

const materialMap = new Map(
  materials.map((material) => [material.id, material]),
);

const enrichedData = data.map((item: any) => {
  const currentQuantity = Number(item.currentQuantity || 0);
  const reservedQuantity = Number(item.reservedQuantity || 0);
  const availableQuantity = Math.max(
    currentQuantity - reservedQuantity,
    0,
  );

  const material = materialMap.get(Number(item.materialId || 0));

  const minimumStockLevel = Number(
    (material as any)?.minimumStockLevel || 0,
  );

  return {
    ...item,
    reservedQuantity,
    availableQuantity,
    minimumStockLevel,
    isLowStock:
      minimumStockLevel > 0 &&
      availableQuantity <= minimumStockLevel,
  };
});

return {
  data: enrichedData,
  pagination: {
    page: pageNumber,
    limit: limitNumber,
    total,
    totalPages: Math.ceil(total / limitNumber),
  },
};
}

async receiveProjectStock(body: any, currentUser: any) {
  const materialId = Number(body?.materialId || 0);
  const branchId = body?.branchId ? Number(body.branchId) : null;
  const quantity = Number(body?.quantity || 0);
  const rate = Number(body?.rate || 0);

  if (!materialId) {
    throw new BadRequestException('Material is required');
  }

  if (!quantity || quantity <= 0) {
    throw new BadRequestException('Valid quantity is required');
  }

  const material = await this.projectMaterialMasterRepository.findOne({
    where: { id: materialId },
  });

  if (!material) {
    throw new NotFoundException('Material not found');
  }

  let branch: ProjectBranch | null = null;

  if (branchId) {
    branch = await this.projectBranchRepository.findOne({
      where: { id: branchId },
    });
  }

  let stockItem = await this.projectStockItemRepository.findOne({
    where: {
      materialId,
      branchId: branchId || undefined,
      isHidden: false,
    },
  });

  if (!stockItem) {
    stockItem = this.projectStockItemRepository.create({
      materialId,
      materialName: material.name,
      category: material.category,
      brand: material.brand,
      unit: material.unit,
      branchId: branchId || undefined,
branchName: branch?.name || body?.branchName || undefined,
      currentQuantity: 0,
      averageRate: 0,
      stockValue: 0,
    });
  }

  const oldQty = Number(stockItem.currentQuantity || 0);
  const oldValue = Number(stockItem.stockValue || 0);
  const receiveValue = quantity * rate;
  const newQty = oldQty + quantity;
  const newValue = oldValue + receiveValue;

  stockItem.currentQuantity = newQty;
  stockItem.stockValue = newValue;
  stockItem.averageRate = newQty > 0 ? newValue / newQty : 0;

  const savedStock = await this.projectStockItemRepository.save(stockItem);

  await this.projectStockMovementRepository.save(
    this.projectStockMovementRepository.create({
      stockItemId: savedStock.id,
      materialId,
      materialName: material.name,
      branchId: savedStock.branchId,
      branchName: savedStock.branchName,
      movementType: ProjectStockMovementType.RECEIVE,
      quantity,
      rate,
      totalAmount: receiveValue,
      sourceType: body?.sourceType || 'MANUAL',
      sourceId: body?.sourceId ? Number(body.sourceId) : undefined,
projectId: body?.projectId ? Number(body.projectId) : undefined,
remarks: body?.remarks || undefined,
createdBy: currentUser?.id || currentUser?.userId || undefined,
      createdByName: currentUser?.name || '',
    }),
  );

  return savedStock;
}

async issueProjectStock(body: any, currentUser: any) {
  const stockItemId = Number(body?.stockItemId || 0);
  const quantity = Number(body?.quantity || 0);

  if (!stockItemId) {
    throw new BadRequestException('Stock item is required');
  }

  if (!quantity || quantity <= 0) {
    throw new BadRequestException('Valid quantity is required');
  }

  if (body?.sourceType === 'DEALER' && !body?.dealerName) {
  throw new BadRequestException(
    'Dealer name is required for dealer sale',
  );
}

  const stockItem = await this.projectStockItemRepository.findOne({
    where: {
      id: stockItemId,
      isHidden: false,
    },
  });

  if (!stockItem) {
    throw new NotFoundException('Stock item not found');
  }

  if (Number(stockItem.currentQuantity || 0) < quantity) {
    throw new BadRequestException('Insufficient stock quantity');
  }

  const rate = Number(stockItem.averageRate || 0);
  const totalAmount = quantity * rate;

  stockItem.currentQuantity =
    Number(stockItem.currentQuantity || 0) - quantity;

  stockItem.stockValue =
    Number(stockItem.currentQuantity || 0) * rate;

  await this.projectStockItemRepository.save(stockItem);

  await this.projectStockMovementRepository.save(
    this.projectStockMovementRepository.create({
      stockItemId: stockItem.id,
      materialId: stockItem.materialId,
      materialName: stockItem.materialName,
      branchId: stockItem.branchId,
      branchName: stockItem.branchName,
      movementType: ProjectStockMovementType.ISSUE,
      quantity,
      rate,
      totalAmount,
      sourceType: body?.sourceType || 'MANUAL',
      sourceId: body?.sourceId ? Number(body.sourceId) : undefined,
      dealerId:
  body?.dealerId ? Number(body.dealerId) : undefined,

dealerName:
  body?.dealerName || undefined,

dealerPhone:
  body?.dealerPhone || undefined,
projectId: body?.projectId ? Number(body.projectId) : undefined,
remarks: body?.remarks || undefined,
createdBy: currentUser?.id || currentUser?.userId || undefined,
      createdByName: currentUser?.name || '',
    }),
  );

  return stockItem;
}

async transferProjectStock(body: any, currentUser: any) {
  const sourceStockItemId = Number(body?.sourceStockItemId || 0);
  const destinationBranchId = Number(body?.destinationBranchId || 0);
  const quantity = Number(body?.quantity || 0);

  if (!sourceStockItemId) {
    throw new BadRequestException('Source stock item is required');
  }

  if (!destinationBranchId) {
    throw new BadRequestException('Destination branch is required');
  }

  if (!quantity || quantity <= 0) {
    throw new BadRequestException('Valid quantity is required');
  }

  return this.projectStockItemRepository.manager.transaction(
    async (manager) => {
      const stockRepo = manager.getRepository(ProjectStockItem);
      const movementRepo = manager.getRepository(ProjectStockMovement);
      const branchRepo = manager.getRepository(ProjectBranch);

      const sourceStock = await stockRepo.findOne({
        where: {
          id: sourceStockItemId,
          isHidden: false,
        },
      });

      if (!sourceStock) {
        throw new NotFoundException('Source stock item not found');
      }

      if (Number(sourceStock.currentQuantity || 0) < quantity) {
        throw new BadRequestException('Insufficient stock quantity');
      }

      if (
        sourceStock.branchId &&
        Number(sourceStock.branchId) === destinationBranchId
      ) {
        throw new BadRequestException(
          'Source and destination branch cannot be same',
        );
      }

      const destinationBranch = await branchRepo.findOne({
        where: {
          id: destinationBranchId,
        },
      });

      if (!destinationBranch) {
        throw new NotFoundException('Destination branch not found');
      }

      const rate = Number(sourceStock.averageRate || 0);
      const transferValue = quantity * rate;

      sourceStock.currentQuantity =
        Number(sourceStock.currentQuantity || 0) - quantity;

      sourceStock.stockValue =
        Number(sourceStock.currentQuantity || 0) * rate;

      const savedSourceStock = await stockRepo.save(sourceStock);

      let destinationStock = await stockRepo.findOne({
        where: {
          materialId: savedSourceStock.materialId,
          branchId: destinationBranchId,
          isHidden: false,
        },
      });

      if (!destinationStock) {
        destinationStock = stockRepo.create({
          materialId: savedSourceStock.materialId,
          materialName: savedSourceStock.materialName,
          category: savedSourceStock.category,
          brand: savedSourceStock.brand,
          unit: savedSourceStock.unit,
          branchId: destinationBranch.id,
          branchName: destinationBranch.name,
          currentQuantity: 0,
          averageRate: 0,
          stockValue: 0,
        });
      }

      const destinationOldQty = Number(
        destinationStock.currentQuantity || 0,
      );
      const destinationOldValue = Number(
        destinationStock.stockValue || 0,
      );

      const destinationNewQty = destinationOldQty + quantity;
      const destinationNewValue = destinationOldValue + transferValue;

      destinationStock.currentQuantity = destinationNewQty;
      destinationStock.stockValue = destinationNewValue;
      destinationStock.averageRate =
        destinationNewQty > 0
          ? destinationNewValue / destinationNewQty
          : 0;

      const savedDestinationStock =
        await stockRepo.save(destinationStock);

      const transferRemarks =
        body?.remarks ||
        `Stock transferred from ${
          savedSourceStock.branchName || 'source branch'
        } to ${savedDestinationStock.branchName || 'destination branch'}`;

      const transferOutMovement = await movementRepo.save(
        movementRepo.create({
          stockItemId: savedSourceStock.id,
          materialId: savedSourceStock.materialId,
          materialName: savedSourceStock.materialName,
          branchId: savedSourceStock.branchId || undefined,
          branchName: savedSourceStock.branchName || undefined,
          movementType: ProjectStockMovementType.TRANSFER_OUT,
          quantity,
          rate,
          totalAmount: transferValue,
          sourceType: 'BRANCH_TRANSFER',
          remarks: transferRemarks,
          createdBy:
            currentUser?.id ||
            currentUser?.userId ||
            undefined,
          createdByName: currentUser?.name || '',
        }),
      );

      const transferInMovement = await movementRepo.save(
        movementRepo.create({
          stockItemId: savedDestinationStock.id,
          materialId: savedDestinationStock.materialId,
          materialName: savedDestinationStock.materialName,
          branchId: savedDestinationStock.branchId || undefined,
          branchName: savedDestinationStock.branchName || undefined,
          movementType: ProjectStockMovementType.TRANSFER_IN,
          quantity,
          rate,
          totalAmount: transferValue,
          sourceType: 'BRANCH_TRANSFER',
          remarks: transferRemarks,
          createdBy:
            currentUser?.id ||
            currentUser?.userId ||
            undefined,
          createdByName: currentUser?.name || '',
        }),
      );

      return {
        message: 'Stock transferred successfully',
        sourceStock: savedSourceStock,
        destinationStock: savedDestinationStock,
        movements: {
          transferOut: transferOutMovement,
          transferIn: transferInMovement,
        },
      };
    },
  );
}

async listProjectStockMovements(query: any) {
  const {
    page = 1,
    limit = 20,
    material,
    branch,
    movementType,
    showHidden,
  } = query || {};

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(
    Math.max(Number(limit) || 20, 1),
    100,
  );

  const skip =
    (pageNumber - 1) * limitNumber;

  const qb =
    this.projectStockMovementRepository
      .createQueryBuilder('movement')
      .orderBy(
        'movement.createdAt',
        'DESC',
      )
      .skip(skip)
      .take(limitNumber);

  if (showHidden === 'true') {
    qb.where(
      'movement.isHidden = true',
    );
  } else {
    qb.where(
      'movement.isHidden = false',
    );
  }

  if (material?.trim()) {
    qb.andWhere(
      `LOWER(movement.materialName)
       LIKE LOWER(:material)`,
      {
        material: `%${material.trim()}%`,
      },
    );
  }

  if (branch?.trim()) {
    qb.andWhere(
      `LOWER(movement.branchName)
       LIKE LOWER(:branch)`,
      {
        branch: `%${branch.trim()}%`,
      },
    );
  }

  if (movementType?.trim()) {
    qb.andWhere(
      'movement.movementType = :movementType',
      {
        movementType,
      },
    );
  }

  const [data, total] =
    await qb.getManyAndCount();

  return {
    data,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(
        total / limitNumber,
      ),
    },
  };
}

async hideProjectStockMovement(
  movementId: number,
  body: any,
  currentUser: any,
) {
  const movement =
    await this.projectStockMovementRepository.findOne({
      where: {
        id: movementId,
      },
    });

  if (!movement) {
    throw new NotFoundException(
      'Stock movement not found',
    );
  }

  if (!body?.hiddenReason?.trim()) {
    throw new BadRequestException(
      'Hide reason is required',
    );
  }

  movement.isHidden = true;
  movement.hiddenReason = body.hiddenReason.trim();
  movement.hiddenAt = new Date();
  movement.hiddenBy =
    currentUser?.id || currentUser?.userId || undefined;
  movement.hiddenByName = currentUser?.name || '';

  return this.projectStockMovementRepository.save(
    movement,
  );
}

async restoreProjectStockMovement(
  movementId: number,
  body: any,
  currentUser: any,
) {
  const movement =
    await this.projectStockMovementRepository.findOne({
      where: {
        id: movementId,
      },
    });

  if (!movement) {
    throw new NotFoundException(
      'Stock movement not found',
    );
  }

  if (!body?.restoreReason?.trim()) {
    throw new BadRequestException(
      'Restore reason is required',
    );
  }

  movement.isHidden = false;
  movement.restoreReason = body.restoreReason.trim();
  movement.restoredAt = new Date();
  movement.restoredBy =
    currentUser?.id || currentUser?.userId || undefined;
  movement.restoredByName = currentUser?.name || '';

  return this.projectStockMovementRepository.save(
    movement,
  );
}

async hideProjectStockItem(
  stockItemId: number,
  body: any,
  currentUser: any,
) {
  const stockItem =
    await this.projectStockItemRepository.findOne({
      where: {
        id: stockItemId,
      },
    });

  if (!stockItem) {
    throw new NotFoundException('Stock item not found');
  }

  if (!body?.hiddenReason?.trim()) {
    throw new BadRequestException('Hide reason is required');
  }

  stockItem.isHidden = true;
  stockItem.hiddenReason = body.hiddenReason.trim();
  stockItem.hiddenAt = new Date();
  stockItem.hiddenBy =
    currentUser?.id || currentUser?.userId || undefined;
  stockItem.hiddenByName = currentUser?.name || '';

  return this.projectStockItemRepository.save(stockItem);
}

async restoreProjectStockItem(
  stockItemId: number,
  body: any,
  currentUser: any,
) {
  const stockItem =
    await this.projectStockItemRepository.findOne({
      where: {
        id: stockItemId,
      },
    });

  if (!stockItem) {
    throw new NotFoundException('Stock item not found');
  }

  if (!body?.restoreReason?.trim()) {
    throw new BadRequestException('Restore reason is required');
  }

  stockItem.isHidden = false;
  stockItem.restoreReason = body.restoreReason.trim();
  stockItem.restoredAt = new Date();
  stockItem.restoredBy =
    currentUser?.id || currentUser?.userId || undefined;
  stockItem.restoredByName = currentUser?.name || '';

  return this.projectStockItemRepository.save(stockItem);
}

async getBranchWiseStockReport(query: any) {
  const {
    branch,
    material,
  } = query || {};

  const qb = this.projectStockItemRepository
    .createQueryBuilder('stock')
    .where('stock.isHidden = false');

  if (branch?.trim()) {
    qb.andWhere(
      'LOWER(stock.branchName) LIKE LOWER(:branch)',
      {
        branch: `%${branch.trim()}%`,
      },
    );
  }

  if (material?.trim()) {
    qb.andWhere(
      `(
        LOWER(stock.materialName) LIKE LOWER(:material)
        OR LOWER(stock.category) LIKE LOWER(:material)
        OR LOWER(stock.brand) LIKE LOWER(:material)
      )`,
      {
        material: `%${material.trim()}%`,
      },
    );
  }

  const rows = await qb.getMany();

  const branchMap = new Map<
    string,
    {
      branchName: string;
      totalItems: number;
      totalQuantity: number;
      totalStockValue: number;
    }
  >();

  for (const item of rows) {
    const branchName =
      item.branchName?.trim() || 'UNASSIGNED';

    if (!branchMap.has(branchName)) {
      branchMap.set(branchName, {
        branchName,
        totalItems: 0,
        totalQuantity: 0,
        totalStockValue: 0,
      });
    }

    const current = branchMap.get(branchName)!;

    current.totalItems += 1;
    current.totalQuantity += Number(
      item.currentQuantity || 0,
    );
    current.totalStockValue += Number(
      item.stockValue || 0,
    );
  }

  const data = Array.from(branchMap.values()).sort(
    (a, b) =>
      b.totalStockValue - a.totalStockValue,
  );

  return {
    summary: {
      totalBranches: data.length,
      totalItems: data.reduce(
        (sum, item) => sum + item.totalItems,
        0,
      ),
      totalQuantity: data.reduce(
        (sum, item) => sum + item.totalQuantity,
        0,
      ),
      totalStockValue: data.reduce(
        (sum, item) => sum + item.totalStockValue,
        0,
      ),
    },
    data,
  };
}

async issueStockToProject(body: any, currentUser: any) {
  const projectId = Number(body?.projectId || 0);
  const stockItemId = Number(body?.stockItemId || 0);
  const quantity = Number(body?.quantity || 0);

  if (!projectId) {
    throw new BadRequestException('Project is required');
  }

  if (!stockItemId) {
    throw new BadRequestException('Stock item is required');
  }

  if (!quantity || quantity <= 0) {
    throw new BadRequestException('Valid quantity is required');
  }

  const project = await this.projectRepository.findOne({
    where: {
      id: projectId,
      isHidden: false,
    },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const stockItem = await this.projectStockItemRepository.findOne({
    where: {
      id: stockItemId,
      isHidden: false,
    },
  });

  if (!stockItem) {
    throw new NotFoundException('Stock item not found');
  }

  if (Number(stockItem.currentQuantity || 0) < quantity) {
    throw new BadRequestException('Insufficient stock quantity');
  }

  const rate = Number(stockItem.averageRate || 0);
  const totalAmount = quantity * rate;

  stockItem.currentQuantity =
    Number(stockItem.currentQuantity || 0) - quantity;

  stockItem.stockValue =
    Number(stockItem.currentQuantity || 0) * rate;

  const savedStock =
    await this.projectStockItemRepository.save(stockItem);

  const movement =
    await this.projectStockMovementRepository.save(
      this.projectStockMovementRepository.create({
        stockItemId: savedStock.id,
        materialId: savedStock.materialId,
        materialName: savedStock.materialName,
        branchId: savedStock.branchId || undefined,
        branchName: savedStock.branchName || undefined,
        movementType: ProjectStockMovementType.ISSUE,
        quantity,
        rate,
        totalAmount,
        sourceType: 'PROJECT',
        projectId,
        remarks: body?.remarks || undefined,
        createdBy:
          currentUser?.id ||
          currentUser?.userId ||
          undefined,
        createdByName: currentUser?.name || '',
      }),
    );

  const consumption =
    await this.projectConsumptionRepository.save(
      this.projectConsumptionRepository.create({
        projectId,
        projectName:
          project.customerName ||
          project.customerPhone ||
          `Project #${project.id}`,
        materialId: savedStock.materialId,
        materialName: savedStock.materialName,
        branchId: savedStock.branchId || undefined,
        branchName: savedStock.branchName || undefined,
        stockItemId: savedStock.id,
        stockMovementId: movement.id,
        quantity,
        rate,
        totalAmount,
        issuedBy:
          currentUser?.id ||
          currentUser?.userId ||
          undefined,
        issuedByName: currentUser?.name || '',
        remarks: body?.remarks || undefined,
      }),
    );

  return {
    stockItem: savedStock,
    movement,
    consumption,
  };
}

async listProjectConsumptions(query: any) {
  const {
    page = 1,
    limit = 20,
    projectId,
    material,
    branch,
    showHidden,
  } = query || {};

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (pageNumber - 1) * limitNumber;

  const qb = this.projectConsumptionRepository
    .createQueryBuilder('consumption')
    .orderBy('consumption.createdAt', 'DESC')
    .skip(skip)
    .take(limitNumber);

  if (showHidden === 'true') {
    qb.where('consumption.isHidden = true');
  } else {
    qb.where('consumption.isHidden = false');
  }

  if (projectId) {
    qb.andWhere('consumption.projectId = :projectId', {
      projectId: Number(projectId),
    });
  }

  if (material?.trim()) {
    qb.andWhere(
      'LOWER(consumption.materialName) LIKE LOWER(:material)',
      {
        material: `%${material.trim()}%`,
      },
    );
  }

  if (branch?.trim()) {
    qb.andWhere(
      'LOWER(consumption.branchName) LIKE LOWER(:branch)',
      {
        branch: `%${branch.trim()}%`,
      },
    );
  }

  const [data, total] = await qb.getManyAndCount();

  return {
    data,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
}

async hideProjectConsumption(
  consumptionId: number,
  body: any,
  currentUser: any,
) {
  const consumption =
    await this.projectConsumptionRepository.findOne({
      where: {
        id: consumptionId,
      },
    });

  if (!consumption) {
    throw new NotFoundException('Consumption entry not found');
  }

  if (!body?.hiddenReason?.trim()) {
    throw new BadRequestException('Hide reason is required');
  }

  consumption.isHidden = true;
  consumption.hiddenReason = body.hiddenReason.trim();
  consumption.hiddenAt = new Date();
  consumption.hiddenBy =
    currentUser?.id || currentUser?.userId || undefined;
  consumption.hiddenByName = currentUser?.name || '';

  return this.projectConsumptionRepository.save(consumption);
}

async restoreProjectConsumption(
  consumptionId: number,
  body: any,
  currentUser: any,
) {
  const consumption =
    await this.projectConsumptionRepository.findOne({
      where: {
        id: consumptionId,
      },
    });

  if (!consumption) {
    throw new NotFoundException('Consumption entry not found');
  }

  if (!body?.restoreReason?.trim()) {
    throw new BadRequestException('Restore reason is required');
  }

  consumption.isHidden = false;
  consumption.restoreReason = body.restoreReason.trim();
  consumption.restoredAt = new Date();
  consumption.restoredBy =
    currentUser?.id || currentUser?.userId || undefined;
  consumption.restoredByName = currentUser?.name || '';

  return this.projectConsumptionRepository.save(consumption);
}

async createVendor(data: Partial<ProjectVendor>) {
  if (!data.vendorName || !String(data.vendorName).trim()) {
    throw new BadRequestException('Vendor name is required');
  }

  const vendor = this.projectVendorRepository.create({
    vendorName: String(data.vendorName).trim(),
    contactPerson: data.contactPerson || '',
    phone: data.phone || '',
    email: data.email || '',
    gstNumber: data.gstNumber || '',
    address: data.address || '',
    city: data.city || '',
    state: data.state || '',
    materialCategory: data.materialCategory || '',
    remarks: data.remarks || '',
    isActive: data.isActive !== false,
    partyType: (data as any).partyType || 'VENDOR',
canSellToUs: (data as any).canSellToUs !== false,
canBuyFromUs: (data as any).canBuyFromUs === true,
openingBalance: Number((data as any).openingBalance || 0),
  });

  return this.projectVendorRepository.save(vendor);
}

async getVendors(activeOnly = false) {
  return this.projectVendorRepository.find({
    where: activeOnly
      ? {
          isActive: true,
        }
      : {},
    order: {
      createdAt: 'DESC',
    },
  });
}

async updateVendor(id: number, data: Partial<ProjectVendor>) {
  const vendor = await this.projectVendorRepository.findOne({
    where: { id },
  });

  if (!vendor) {
    throw new NotFoundException('Vendor not found');
  }

  Object.assign(vendor, {
    ...data,
    vendorName:
      data.vendorName !== undefined
        ? String(data.vendorName || '').trim()
        : vendor.vendorName,
    isActive:
      data.isActive !== undefined
        ? data.isActive
        : vendor.isActive,
        partyType:
  (data as any).partyType !== undefined
    ? (data as any).partyType || 'VENDOR'
    : (vendor as any).partyType,

canSellToUs:
  (data as any).canSellToUs !== undefined
    ? (data as any).canSellToUs === true
    : (vendor as any).canSellToUs,

canBuyFromUs:
  (data as any).canBuyFromUs !== undefined
    ? (data as any).canBuyFromUs === true
    : (vendor as any).canBuyFromUs,

openingBalance:
  (data as any).openingBalance !== undefined
    ? Number((data as any).openingBalance || 0)
    : (vendor as any).openingBalance,
  });

  return this.projectVendorRepository.save(vendor);
}

async disableVendor(id: number) {
  const vendor = await this.projectVendorRepository.findOne({
    where: { id },
  });

  if (!vendor) {
    throw new NotFoundException('Vendor not found');
  }

  vendor.isActive = false;

  await this.projectVendorRepository.save(vendor);

  return {
    message: 'Vendor disabled successfully',
  };
}

async enableVendor(id: number) {
  const vendor = await this.projectVendorRepository.findOne({
    where: { id },
  });

  if (!vendor) {
    throw new NotFoundException('Vendor not found');
  }

  vendor.isActive = true;

  await this.projectVendorRepository.save(vendor);

  return {
    message: 'Vendor enabled successfully',
  };
}

async createMaterialRequest(
  body: any,
  user: any,
) {
  const items = Array.isArray(body?.items)
    ? body.items
    : [];

  if (!body?.projectId) {
    throw new BadRequestException(
      'Project ID is required',
    );
  }

  if (items.length === 0) {
    throw new BadRequestException(
      'At least one material item is required',
    );
  }

  let totalAmount = 0;

  for (const item of items) {
    totalAmount += Number(
      item.totalAmount || 0,
    );
  }

  const request =
    this.projectMaterialRequestRepository.create({
      projectId: Number(body.projectId),
      title: body.title || '',
      remarks: body.remarks || '',
      requestedBy: user?.id || null,
      requestedByName:
        user?.name || '',
      requestedByRole:
        Array.isArray(user?.roles)
          ? user.roles.join(', ')
          : '',
      totalAmount,
    });

  const savedRequest =
    await this.projectMaterialRequestRepository.save(
      request,
    );

  const requestItems = items.map(
    (item: any) =>
      this.projectMaterialRequestItemRepository.create(
        {
          requestId: savedRequest.id,
          projectId: Number(
            body.projectId,
          ),
          materialId:
            item.materialId || null,
          materialName:
            item.materialName || '',
          category:
            item.category || '',
          unit: item.unit || '',
          brand: item.brand || '',
          rate: Number(
            item.rate || 0,
          ),
          quantity: Number(
            item.quantity || 0,
          ),

          purchasedQuantity: 0,
pendingQuantity: Number(
  item.quantity || 0,
),
          gstPercent: Number(
            item.gstPercent || 0,
          ),
          totalAmount: Number(
            item.totalAmount || 0,
          ),
          remarks:
            item.remarks || '',
        },
      ),
  );

  await this.projectMaterialRequestItemRepository.save(
    requestItems,
  );

  return {
    message:
      'Material request created successfully',
    request: savedRequest,
  };
}

async getProjectMaterialRequests(
  projectId: number,
) {
  const requests =
    await this.projectMaterialRequestRepository.find(
      {
        where: { projectId },
        order: {
          createdAt: 'DESC',
        },
      },
    );

  const finalData: any[] = [];

  for (const request of requests) {
    const items =
      await this.projectMaterialRequestItemRepository.find(
        {
          where: {
            requestId: request.id,
          },
          order: {
            createdAt: 'ASC',
          },
        },
      );

    finalData.push({
      ...request,
      items,
    });
  }

  return finalData;
}

async listApprovedMaterialRequestsForIssue(query: any) {
  const {
    page = 1,
    limit = 20,
    projectId,
  } = query || {};

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (pageNumber - 1) * limitNumber;

  const qb = this.projectMaterialRequestRepository
    .createQueryBuilder('request')
    .where('request.status IN (:...statuses)', {
  statuses: [
    ProjectMaterialRequestStatus.SUBMITTED,
    ProjectMaterialRequestStatus.APPROVED,
  ],
})
    .orderBy('request.createdAt', 'DESC')
    .skip(skip)
    .take(limitNumber);

  if (projectId) {
    qb.andWhere('request.projectId = :projectId', {
      projectId: Number(projectId),
    });
  }

  const [requests, total] = await qb.getManyAndCount();

  const data: any[] = [];

  for (const request of requests) {
    const items =
      await this.projectMaterialRequestItemRepository.find({
        where: {
          requestId: request.id,
        },
        order: {
          createdAt: 'DESC',
        },
      });

    const pendingItems = items.filter((item: any) => {
      const requestedQty = Number(item.quantity || 0);
      const issuedQty = Number(item.issuedQuantity || 0);

      return requestedQty - issuedQty > 0;
    });

    if (pendingItems.length > 0) {
      data.push({
        ...request,
        items: pendingItems.map((item: any) => ({
          ...item,
          issuePendingQuantity:
            Number(item.quantity || 0) -
            Number(item.issuedQuantity || 0),
        })),
      });
    }
  }

  return {
    data,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
}

async issueMaterialRequestItemStock(
  itemId: number,
  body: any,
  currentUser: any,
) {
  const quantity = Number(body?.quantity || 0);
  const stockItemId = Number(body?.stockItemId || 0);

  if (!stockItemId) {
    throw new BadRequestException('Stock item is required');
  }

  if (!quantity || quantity <= 0) {
    throw new BadRequestException('Valid quantity is required');
  }

  const requestItem =
    await this.projectMaterialRequestItemRepository.findOne({
      where: {
        id: itemId,
      },
    });

  if (!requestItem) {
    throw new NotFoundException('Material request item not found');
  }

  const request =
    await this.projectMaterialRequestRepository.findOne({
      where: {
        id: requestItem.requestId,
      },
    });

  if (!request) {
    throw new NotFoundException('Material request not found');
  }

  if (request.status !== ProjectMaterialRequestStatus.APPROVED) {
  throw new BadRequestException(
    'Only approved material requests can be issued',
  );
}

  const requestedQty = Number(requestItem.quantity || 0);
  const alreadyIssuedQty = Number(
    (requestItem as any).issuedQuantity || 0,
  );
  const pendingIssueQty =
    requestedQty - alreadyIssuedQty;

  if (quantity > pendingIssueQty) {
    throw new BadRequestException(
      `Issue quantity cannot exceed pending quantity ${pendingIssueQty}`,
    );
  }

  const stockItem =
    await this.projectStockItemRepository.findOne({
      where: {
        id: stockItemId,
        isHidden: false,
      },
    });

  if (!stockItem) {
    throw new NotFoundException('Stock item not found');
  }

  if (
    stockItem.materialId &&
    requestItem.materialId &&
    Number(stockItem.materialId) !==
      Number(requestItem.materialId)
  ) {
    throw new BadRequestException(
      'Selected stock material does not match requested material',
    );
  }

  const reservedQuantity = Number(
  (stockItem as any).reservedQuantity || 0,
);

if (reservedQuantity < quantity) {
  throw new BadRequestException(
    `Insufficient reserved stock. Reserved quantity is ${reservedQuantity}`,
  );
}

  const rate = Number(stockItem.averageRate || 0);
  const totalAmount = quantity * rate;

  stockItem.currentQuantity =
    Number(stockItem.currentQuantity || 0) - quantity;

    (stockItem as any).reservedQuantity = Math.max(
  Number((stockItem as any).reservedQuantity || 0) - quantity,
  0,
);

  stockItem.stockValue =
    Number(stockItem.currentQuantity || 0) * rate;

  const savedStock =
    await this.projectStockItemRepository.save(stockItem);

  const movement =
    await this.projectStockMovementRepository.save(
      this.projectStockMovementRepository.create({
        stockItemId: savedStock.id,
        materialId: savedStock.materialId,
        materialName: savedStock.materialName,
        branchId: savedStock.branchId || undefined,
        branchName: savedStock.branchName || undefined,
        movementType: ProjectStockMovementType.ISSUE,
        quantity,
        rate,
        totalAmount,
        sourceType: 'MATERIAL_REQUEST',
        sourceId: request.id,
        projectId: request.projectId,
        remarks:
          body?.remarks ||
          `Issued against material request #${request.id}`,
        createdBy:
          currentUser?.id ||
          currentUser?.userId ||
          undefined,
        createdByName: currentUser?.name || '',
      }),
    );

  const project =
    await this.projectRepository.findOne({
      where: {
        id: request.projectId,
      },
    });

  const consumption =
    await this.projectConsumptionRepository.save(
      this.projectConsumptionRepository.create({
        projectId: request.projectId,
        projectName:
          project?.customerName ||
          project?.customerPhone ||
          `Project #${request.projectId}`,
        materialId: savedStock.materialId,
        materialName: savedStock.materialName,
        branchId: savedStock.branchId || undefined,
        branchName: savedStock.branchName || undefined,
        stockItemId: savedStock.id,
        stockMovementId: movement.id,
        quantity,
        rate,
        totalAmount,
        issuedBy:
          currentUser?.id ||
          currentUser?.userId ||
          undefined,
        issuedByName: currentUser?.name || '',
        remarks:
          body?.remarks ||
          `Issued against material request #${request.id}`,
      }),
    );

    (requestItem as any).reservedQuantity = Math.max(
  Number((requestItem as any).reservedQuantity || 0) - quantity,
  0,
);

  const newIssuedQty =
    alreadyIssuedQty + quantity;

  (requestItem as any).issuedQuantity = newIssuedQty;
  (requestItem as any).issuePendingQuantity =
    Math.max(requestedQty - newIssuedQty, 0);

  if (!(requestItem as any).issuedAt) {
  (requestItem as any).issuedAt = new Date();
}

if (newIssuedQty >= requestedQty) {
  (requestItem as any).issueStatus = 'ISSUED';
} else {
  (requestItem as any).issueStatus =
    'PARTIALLY_ISSUED';
}

  (requestItem as any).issuedBy =
    currentUser?.id || currentUser?.userId || undefined;
  (requestItem as any).issuedByName =
    currentUser?.name || '';

  await this.projectMaterialRequestItemRepository.save(
    requestItem,
  );

  const allItems =
    await this.projectMaterialRequestItemRepository.find({
      where: {
        requestId: request.id,
      },
    });

  const allIssued = allItems.every((item: any) => {
    return (
      Number(item.issuedQuantity || 0) >=
      Number(item.quantity || 0)
    );
  });

  if (allIssued) {
    request.status = ProjectMaterialRequestStatus.ISSUED;
    await this.projectMaterialRequestRepository.save(
      request,
    );
  }

  return {
    stockItem: savedStock,
    movement,
    consumption,
    requestItem,
    request,
  };
}

async approveMaterialRequestForStock(
  requestId: number,
  user: any,
) {
  const request =
    await this.projectMaterialRequestRepository.findOne({
      where: { id: requestId },
    });

  if (!request) {
    throw new NotFoundException('Material request not found');
  }

  if (request.status !== ProjectMaterialRequestStatus.SUBMITTED) {
    throw new BadRequestException(
      'Only submitted material requests can be approved',
    );
  }

  const items =
    await this.projectMaterialRequestItemRepository.find({
      where: { requestId },
    });

  for (const item of items) {
    const requiredQty = Number(item.quantity || 0);

    if (requiredQty <= 0) continue;

    const stockItem =
      await this.projectStockItemRepository.findOne({
        where: {
          materialId: item.materialId,
          isHidden: false,
        },
        order: {
          currentQuantity: 'DESC',
        },
      });

    if (!stockItem) {
      throw new BadRequestException(
        `Stock not found for ${item.materialName}`,
      );
    }

    const availableQty =
      Number(stockItem.currentQuantity || 0) -
      Number((stockItem as any).reservedQuantity || 0);

    if (availableQty < requiredQty) {
      throw new BadRequestException(
        `Insufficient available stock for ${item.materialName}. Available: ${availableQty}, Required: ${requiredQty}`,
      );
    }

    (stockItem as any).reservedQuantity =
      Number((stockItem as any).reservedQuantity || 0) + requiredQty;

    (item as any).reservedQuantity =
      Number((item as any).reservedQuantity || 0) + requiredQty;

    await this.projectStockItemRepository.save(stockItem);
    await this.projectMaterialRequestItemRepository.save(item);
  }

  request.status = ProjectMaterialRequestStatus.APPROVED;

  await this.projectMaterialRequestRepository.save(request);

  return {
    message: 'Material request approved and stock reserved',
    request,
  };
}

async getPaymentCollectionList(query: any, currentUser: any) {
  const {
  projectId,
  branch,
  projectOwnerId,
  customerName,
  approvalStatus,
  fromDate,
  toDate,
  month,
  status,
  pendingOnly,
  page = 1,
  limit = 50,
} = query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const skip = (pageNumber - 1) * limitNumber;

  const roles = currentUser?.roles || [];
  const userId = currentUser?.id || currentUser?.userId;

  const canSeeAll =
  roles.includes('OWNER') ||
  roles.includes('MARKETING_HEAD') ||
  roles.includes('PROJECT_MANAGER') ||
  roles.includes('PAYMENT_COLLECTION_EXECUTIVE') ||
  roles.includes('PAYMENT_MANAGER') ||
  roles.includes('ACCOUNT_MANAGER');

  const qb = this.projectPaymentInstallmentRepository
    .createQueryBuilder('payment')
    .leftJoin(Project, 'project', 'project.id = payment.projectId')
    .select([
      'payment.id AS "id"',
      'payment.projectId AS "projectId"',
      'payment.label AS "label"',
      'payment.amount AS "amount"',
      'payment.paidAmount AS "paidAmount"',
      'payment.pendingAmount AS "pendingAmount"',
      'payment.dueDate AS "dueDate"',
      'payment.paidDate AS "paidDate"',
      'payment.status AS "status"',
      'payment.approvalStatus AS "approvalStatus"',
      'payment.paymentMode AS "paymentMode"',
      'payment.transactionId AS "transactionId"',
      'payment.remarks AS "remarks"',
      'payment.collectedBy AS "collectedBy"',
      'payment.collectedByName AS "collectedByName"',
      'project.customerName AS "customerName"',
      'project.customerPhone AS "customerPhone"',
      'project.branchName AS "branchName"',
      'project.projectOwnerId AS "projectOwnerId"',
      'project.projectOwnerName AS "projectOwnerName"',
      'project.projectSerial AS "projectSerial"',
      'project.finalCost AS "finalCost"',
      'project.status AS "projectStatus"',
    ])
    .orderBy('payment.dueDate', 'ASC')
    .addOrderBy('payment.id', 'DESC')
    .offset(skip)
    .limit(limitNumber);

    qb.where('payment.isHidden = false');

    qb.andWhere('project.isHidden = false');

  if (!canSeeAll) {
    qb.andWhere('project.projectOwnerId = :userId', { userId });
  }

  if (projectId) {
  qb.andWhere('payment.projectId = :projectId', {
    projectId: Number(projectId),
  });
}

  if (branch?.trim()) {
    qb.andWhere('LOWER(project.branchName) LIKE LOWER(:branch)', {
      branch: `%${branch.trim()}%`,
    });
  }

  if (projectOwnerId) {
    qb.andWhere('project.projectOwnerId = :projectOwnerId', {
      projectOwnerId: Number(projectOwnerId),
    });
  }

  if (customerName?.trim()) {
  const searchText = customerName.trim();

  qb.andWhere(
    `(
      LOWER(project.customerName) LIKE LOWER(:search)
      OR LOWER(project.customerPhone) LIKE LOWER(:search)
      OR LOWER(project.projectSerial) LIKE LOWER(:search)
      OR CAST(project.id AS TEXT) LIKE :search
    )`,
    {
      search: `%${searchText}%`,
    },
  );
}

  if (status?.trim()) {
    qb.andWhere('payment.status = :status', {
      status: status.trim(),
    });
  }

  if (approvalStatus?.trim()) {
  qb.andWhere(
    'payment.approvalStatus = :approvalStatus',
    {
      approvalStatus:
        approvalStatus.trim(),
    },
  );
}

  if (pendingOnly === 'true') {
    qb.andWhere('payment.pendingAmount > 0');
    qb.andWhere('payment.status IN (:...pendingStatuses)', {
      pendingStatuses: [
        ProjectPaymentInstallmentStatus.PENDING,
        ProjectPaymentInstallmentStatus.PARTIAL,
        ProjectPaymentInstallmentStatus.OVERDUE,
      ],
    });
  }

  if (month?.trim()) {
    const [year, monthNumber] = month.trim().split('-').map(Number);

    if (year && monthNumber) {
      const startDate = new Date(year, monthNumber - 1, 1);
      const endDate = new Date(year, monthNumber, 1);

      qb.andWhere('payment.dueDate >= :monthStart', {
        monthStart: startDate,
      });
      qb.andWhere('payment.dueDate < :monthEnd', {
        monthEnd: endDate,
      });
    }
  } else {
    if (fromDate?.trim()) {
      qb.andWhere('payment.dueDate >= :fromDate', {
        fromDate: fromDate.trim(),
      });
    }

    if (toDate?.trim()) {
      qb.andWhere('payment.dueDate <= :toDate', {
        toDate: toDate.trim(),
      });
    }
  }

  const rows = await qb.getRawMany();

  const projectIds = Array.from(
  new Set(
    rows
      .map((row) => Number(row.projectId))
      .filter(Boolean),
  ),
);

let projectApprovedPaymentMap: Record<number, number> = {};

if (projectIds.length > 0) {
  const approvedPayments =
    await this.projectPaymentInstallmentRepository
      .createQueryBuilder('payment')
      .select('payment.projectId', 'projectId')
      .addSelect('SUM(payment.paidAmount)', 'receivedAmount')
      .where('payment.projectId IN (:...projectIds)', {
        projectIds,
      })
      .andWhere('payment.isHidden = false')
      .andWhere('payment.approvalStatus = :approvalStatus', {
        approvalStatus: 'APPROVED',
      })
      .groupBy('payment.projectId')
      .getRawMany();

  projectApprovedPaymentMap =
    approvedPayments.reduce((acc, item) => {
      acc[Number(item.projectId)] = Number(
        item.receivedAmount || 0,
      );

      return acc;
    }, {});
}

  const countQb = this.projectPaymentInstallmentRepository
    .createQueryBuilder('payment')
    .leftJoin(Project, 'project', 'project.id = payment.projectId');

    countQb.where('payment.isHidden = false');

    countQb.andWhere('project.isHidden = false');

  if (!canSeeAll) {
    countQb.andWhere('project.projectOwnerId = :userId', { userId });
  }

  if (projectId) {
  countQb.andWhere('payment.projectId = :projectId', {
    projectId: Number(projectId),
  });
}

  if (branch?.trim()) {
    countQb.andWhere('LOWER(project.branchName) LIKE LOWER(:branch)', {
      branch: `%${branch.trim()}%`,
    });
  }

  if (projectOwnerId) {
    countQb.andWhere('project.projectOwnerId = :projectOwnerId', {
      projectOwnerId: Number(projectOwnerId),
    });
  }

  if (customerName?.trim()) {
  const searchText = customerName.trim();

  countQb.andWhere(
    `(
      LOWER(project.customerName) LIKE LOWER(:search)
      OR LOWER(project.customerPhone) LIKE LOWER(:search)
      OR LOWER(project.projectSerial) LIKE LOWER(:search)
      OR CAST(project.id AS TEXT) LIKE :search
    )`,
    {
      search: `%${searchText}%`,
    },
  );
}

  if (status?.trim()) {
    countQb.andWhere('payment.status = :status', {
      status: status.trim(),
    });
  }

  if (approvalStatus?.trim()) {
  countQb.andWhere(
    'payment.approvalStatus = :approvalStatus',
    {
      approvalStatus:
        approvalStatus.trim(),
    },
  );
}

  if (pendingOnly === 'true') {
    countQb.andWhere('payment.pendingAmount > 0');
    countQb.andWhere('payment.status IN (:...pendingStatuses)', {
      pendingStatuses: [
        ProjectPaymentInstallmentStatus.PENDING,
        ProjectPaymentInstallmentStatus.PARTIAL,
        ProjectPaymentInstallmentStatus.OVERDUE,
      ],
    });
  }

  if (month?.trim()) {
    const [year, monthNumber] = month.trim().split('-').map(Number);

    if (year && monthNumber) {
      const startDate = new Date(year, monthNumber - 1, 1);
      const endDate = new Date(year, monthNumber, 1);

      countQb.andWhere('payment.dueDate >= :monthStart', {
        monthStart: startDate,
      });
      countQb.andWhere('payment.dueDate < :monthEnd', {
        monthEnd: endDate,
      });
    }
  } else {
    if (fromDate?.trim()) {
      countQb.andWhere('payment.dueDate >= :fromDate', {
        fromDate: fromDate.trim(),
      });
    }

    if (toDate?.trim()) {
      countQb.andWhere('payment.dueDate <= :toDate', {
        toDate: toDate.trim(),
      });
    }
  }

  const total = await countQb.getCount();

  return {
  data: rows.map((row) => {
    const finalCost = Number(row.finalCost || 0);

    const projectReceivedAmount =
      projectApprovedPaymentMap[Number(row.projectId)] || 0;

    const paymentReceivedPercentage =
      finalCost > 0
        ? Math.min(
            Math.round(
              (projectReceivedAmount / finalCost) * 100,
            ),
            100,
          )
        : 0;

    return {
      id: Number(row.id),
      projectId: Number(row.projectId),
      label: row.label,
      amount: Number(row.amount || 0),
      paidAmount: Number(row.paidAmount || 0),
      pendingAmount: Number(row.pendingAmount || 0),
      dueDate: row.dueDate,
      paidDate: row.paidDate,
      status: this.getComputedPaymentStatus(
        row.status,
        row.dueDate,
        Number(row.pendingAmount || 0),
      ),
      approvalStatus: row.approvalStatus || 'APPROVED',
      paymentMode: row.paymentMode,
      transactionId: row.transactionId,
      remarks: row.remarks,
      collectedBy: row.collectedBy
        ? Number(row.collectedBy)
        : null,
      collectedByName: row.collectedByName,

      customerName: row.customerName,
      customerPhone: row.customerPhone,
      branchName: row.branchName,
      projectOwnerId: row.projectOwnerId
        ? Number(row.projectOwnerId)
        : null,
      projectOwnerName: row.projectOwnerName,
      projectSerial: row.projectSerial,

      finalCost,
      projectReceivedAmount,
      paymentReceivedPercentage,

      projectStatus: row.projectStatus,
    };
  }),
  pagination: {
    page: pageNumber,
    limit: limitNumber,
    total,
    totalPages: Math.ceil(total / limitNumber),
  },
};
}

async createPaymentInstallment(
  projectId: number,
  body: any,
  currentUser: any,
) {
  const project = await this.projectRepository.findOne({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const amount = Number(body?.amount || 0);

  if (!amount || amount <= 0) {
    throw new BadRequestException(
      'Valid amount is required',
    );
  }

  const installment =
    this.projectPaymentInstallmentRepository.create({
      projectId,
      label: body?.label || 'FIRST_PAYMENT',
      amount,
      paidAmount: 0,
      pendingAmount: amount,
      dueDate: body?.dueDate || null,
      remarks: body?.remarks || null,
      status: ProjectPaymentInstallmentStatus.PENDING,
      createdBy:
        currentUser?.id ||
        currentUser?.userId ||
        null,
      createdByName:
        currentUser?.name || null,
    });

  return this.projectPaymentInstallmentRepository.save(
    installment,
  );
}

async updatePaymentInstallment(
  installmentId: number,
  body: any,
  currentUser: any,
) {
  this.assertOwnerOnly(currentUser);

  const installment =
    await this.projectPaymentInstallmentRepository.findOne({
      where: { id: installmentId },
    });

  if (!installment) {
    throw new NotFoundException('Payment installment not found');
  }

  const newAmount = Number(body?.amount || installment.amount || 0);

  if (!newAmount || newAmount <= 0) {
    throw new BadRequestException('Valid amount is required');
  }

  const paidAmount = Number(installment.paidAmount || 0);

  if (paidAmount > newAmount) {
    throw new BadRequestException(
      'Installment amount cannot be less than already paid amount',
    );
  }

  installment.label = body?.label || installment.label;
  installment.amount = newAmount;
  installment.pendingAmount = newAmount - paidAmount;
  installment.dueDate = body?.dueDate || installment.dueDate || null;
  installment.remarks = body?.remarks ?? installment.remarks;

  if (installment.pendingAmount <= 0) {
    installment.status = ProjectPaymentInstallmentStatus.PAID;
  } else if (paidAmount > 0) {
    installment.status = ProjectPaymentInstallmentStatus.PARTIAL;
  } else {
    installment.status = ProjectPaymentInstallmentStatus.PENDING;
  }

  return this.projectPaymentInstallmentRepository.save(installment);
}

async receivePaymentInstallment(
  installmentId: number,
  body: any,
  currentUser: any,
) {
  const installment =
    await this.projectPaymentInstallmentRepository.findOne({
      where: {
        id: installmentId,
      },
    });

  if (!installment) {
    throw new NotFoundException('Payment installment not found');
  }

  if (
    installment.status ===
    ProjectPaymentInstallmentStatus.CANCELLED
  ) {
    throw new BadRequestException(
      'Cancelled installment cannot receive payment',
    );
  }

  const receivedAmount = Number(body?.receivedAmount || 0);

  if (!receivedAmount || receivedAmount <= 0) {
    throw new BadRequestException(
      'Valid received amount is required',
    );
  }

  const currentPaid = Number(installment.paidAmount || 0);
  const totalAmount = Number(installment.amount || 0);

  const newPaidAmount = currentPaid + receivedAmount;

  if (newPaidAmount > totalAmount) {
    throw new BadRequestException(
      'Received amount cannot exceed pending amount',
    );
  }

  const newPendingAmount = totalAmount - newPaidAmount;

  installment.paidAmount = newPaidAmount;
  installment.pendingAmount = newPendingAmount;

  installment.paymentMode =
    body?.paymentMode || installment.paymentMode || null;

  installment.transactionId =
    body?.transactionId ||
    installment.transactionId ||
    null;

  installment.remarks =
    body?.remarks || installment.remarks || null;

  installment.collectedBy =
    currentUser?.id || currentUser?.userId || null;

  installment.collectedByName =
    currentUser?.name || null;

  installment.paidDate = new Date();

  const roles = Array.isArray(currentUser?.roles)
  ? currentUser.roles
  : [];

const canAutoApprovePayment =
  roles.includes('OWNER') ||
  roles.includes('ACCOUNT_MANAGER') ||
  roles.includes('PAYMENT_MANAGER');

installment.approvalStatus =
  canAutoApprovePayment ? 'APPROVED' : 'PENDING';

if (canAutoApprovePayment) {
  installment.approvedBy =
    currentUser?.id || currentUser?.userId || null;

  installment.approvedByName =
    currentUser?.name || '';

  installment.approvedAt = new Date();

  installment.approvalNote =
    'Auto approved by authorized role';
}

  if (newPendingAmount <= 0) {
    installment.status =
      ProjectPaymentInstallmentStatus.PAID;
  } else if (newPaidAmount > 0) {
    installment.status =
      ProjectPaymentInstallmentStatus.PARTIAL;
  } else {
    installment.status =
      ProjectPaymentInstallmentStatus.PENDING;
  }

  const savedInstallment =
  await this.projectPaymentInstallmentRepository.save(
    installment,
  );

const project =
  await this.projectRepository.findOne({
    where: {
      id: Number(savedInstallment.projectId),
    },
  });

  if (savedInstallment.approvalStatus === 'APPROVED') {

await this.projectPartyLedgerRepository.save(
  this.projectPartyLedgerRepository.create({
    partyId: undefined,

    partyName:
      project?.customerName || 'Customer',

    partyType: 'CUSTOMER',

    projectId:
      Number(savedInstallment.projectId),

    entryType:
      ProjectLedgerEntryType.CREDIT,

    sourceType:
      ProjectLedgerSourceType.CUSTOMER_PAYMENT,

    sourceId:
      savedInstallment.id,

    amount:
      receivedAmount,

    remarks:
      body?.remarks ||
      `Payment received for ${savedInstallment.label || 'installment'}`,

    createdBy:
      currentUser?.id ||
      currentUser?.userId ||
      null,

    createdByName:
      currentUser?.name || '',
  } as Partial<ProjectPartyLedger>),
);
  }

return savedInstallment;
}

async updatePaymentEntry(
  installmentId: number,
  body: any,
  currentUser: any,
) {
  this.assertOwnerOnly(currentUser);

  const installment =
    await this.projectPaymentInstallmentRepository.findOne({
      where: { id: installmentId },
    });

  if (!installment) {
    throw new NotFoundException('Payment installment not found');
  }

  const totalAmount = Number(installment.amount || 0);
  const newPaidAmount = Number(body?.paidAmount || 0);

  if (newPaidAmount < 0) {
    throw new BadRequestException(
      'Paid amount cannot be negative',
    );
  }

  if (newPaidAmount > totalAmount) {
    throw new BadRequestException(
      'Paid amount cannot exceed installment amount',
    );
  }

  installment.paidAmount = newPaidAmount;
  installment.pendingAmount = totalAmount - newPaidAmount;

  installment.paymentMode =
    body?.paymentMode ?? installment.paymentMode;

  installment.transactionId =
    body?.transactionId ?? installment.transactionId;

  installment.remarks =
    body?.remarks ?? installment.remarks;

  installment.paidDate = body?.paidDate
    ? new Date(body.paidDate)
    : installment.paidDate;

  if (newPaidAmount <= 0) {
    installment.status = ProjectPaymentInstallmentStatus.PENDING;
    installment.approvalStatus = 'PENDING';
  } else if (installment.pendingAmount <= 0) {
    installment.status = ProjectPaymentInstallmentStatus.PAID;
  } else {
    installment.status = ProjectPaymentInstallmentStatus.PARTIAL;
  }

  const saved =
    await this.projectPaymentInstallmentRepository.save(installment);

  const existingLedger =
    await this.projectPartyLedgerRepository.findOne({
      where: {
        sourceType: ProjectLedgerSourceType.CUSTOMER_PAYMENT,
        sourceId: saved.id,
        isHidden: false,
      },
    });

  if (
    existingLedger &&
    saved.approvalStatus === 'APPROVED'
  ) {
    existingLedger.amount = Number(saved.paidAmount || 0);
    existingLedger.remarks =
      saved.remarks ||
      `Updated payment for ${saved.label || 'installment'}`;

    await this.projectPartyLedgerRepository.save(existingLedger);
  }

  return saved;
}

async approvePaymentInstallment(
  installmentId: number,
  body: any,
  currentUser: any,
) {
  const installment =
    await this.projectPaymentInstallmentRepository.findOne({
      where: { id: installmentId },
    });

  if (!installment) {
    throw new NotFoundException('Payment installment not found');
  }

  if (installment.approvalStatus === 'APPROVED') {
    return {
      message: 'Payment already approved',
      installment,
    };
  }

  installment.approvalStatus = 'APPROVED';
  installment.approvedBy =
    currentUser?.id || currentUser?.userId || null;
  installment.approvedByName = currentUser?.name || '';
  installment.approvedAt = new Date();
  installment.approvalNote =
    body?.approvalNote || 'Payment approved';

  const savedInstallment =
    await this.projectPaymentInstallmentRepository.save(
      installment,
    );

  const existingLedger =
    await this.projectPartyLedgerRepository.findOne({
      where: {
        sourceType:
          ProjectLedgerSourceType.CUSTOMER_PAYMENT,
        sourceId: savedInstallment.id,
        isHidden: false,
      },
    });

  if (!existingLedger) {
    const project =
      await this.projectRepository.findOne({
        where: {
          id: Number(savedInstallment.projectId),
        },
      });

    await this.projectPartyLedgerRepository.save(
      this.projectPartyLedgerRepository.create({
        partyId: undefined,
        partyName: project?.customerName || 'Customer',
        partyType: 'CUSTOMER',
        projectId: Number(savedInstallment.projectId),
        entryType: ProjectLedgerEntryType.CREDIT,
        sourceType:
          ProjectLedgerSourceType.CUSTOMER_PAYMENT,
        sourceId: savedInstallment.id,
        amount: Number(savedInstallment.paidAmount || 0),
        remarks:
          savedInstallment.remarks ||
          `Approved payment for ${savedInstallment.label || 'installment'}`,
        createdBy:
          currentUser?.id || currentUser?.userId || null,
        createdByName: currentUser?.name || '',
      } as Partial<ProjectPartyLedger>),
    );
  }

  return {
    message: 'Payment approved successfully',
    installment: savedInstallment,
  };
}

async rejectPaymentInstallment(
  installmentId: number,
  body: any,
  currentUser: any,
) {
  const installment =
    await this.projectPaymentInstallmentRepository.findOne({
      where: { id: installmentId },
    });

  if (!installment) {
    throw new NotFoundException('Payment installment not found');
  }

  installment.approvalStatus = 'REJECTED';
  installment.approvedBy =
    currentUser?.id || currentUser?.userId || null;
  installment.approvedByName = currentUser?.name || '';
  installment.approvedAt = new Date();
  installment.approvalNote =
    body?.approvalNote || 'Payment rejected';

  await this.projectPaymentInstallmentRepository.save(
    installment,
  );

  return {
    message: 'Payment rejected successfully',
    installment,
  };
}

private getComputedPaymentStatus(
  status: string,
  dueDate: string | Date | null,
  pendingAmount: number,
) {
  if (status === ProjectPaymentInstallmentStatus.PAID) {
    return ProjectPaymentInstallmentStatus.PAID;
  }

  if (status === ProjectPaymentInstallmentStatus.CANCELLED) {
    return ProjectPaymentInstallmentStatus.CANCELLED;
  }

  if (!dueDate || pendingAmount <= 0) {
    return status;
  }

  const todayIndia = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata',
  });

  const dueIndia =
    dueDate instanceof Date
      ? dueDate.toLocaleDateString('en-CA', {
          timeZone: 'Asia/Kolkata',
        })
      : String(dueDate).split('T')[0];

  if (dueIndia < todayIndia) {
    return ProjectPaymentInstallmentStatus.OVERDUE;
  }

  return status;
}

async createAccountExpense(
  body: any,
  currentUser: any,
) {
  const amount = Number(body?.amount || 0);

  if (!amount || amount <= 0) {
    throw new BadRequestException(
      'Valid amount is required',
    );
  }

  const expenseData: Partial<ProjectAccountExpense> = {
  expenseType:
    Object.values(ProjectAccountExpenseType).includes(
      body?.expenseType,
    )
      ? body.expenseType
      : ProjectAccountExpenseType.OTHER,

  amount,

  remarks: body?.remarks || null,

  projectId: body?.projectId
    ? Number(body.projectId)
    : undefined,

  branchName: body?.branchName || null,

  projectOwnerId: body?.projectOwnerId
    ? Number(body.projectOwnerId)
    : undefined,

  projectOwnerName:
    body?.projectOwnerName || null,

  approvalStatus:
    ProjectAccountExpenseApprovalStatus.PENDING,

  createdBy:
    currentUser?.id ||
    currentUser?.userId ||
    null,

  createdByName:
    currentUser?.name || '',
};

const expense =
  this.projectAccountExpenseRepository.create(
    expenseData,
  );

  return this.projectAccountExpenseRepository.save(
    expense,
  );
}

async updateAccountExpense(
  expenseId: number,
  body: any,
  currentUser: any,
) {
  const expense =
    await this.projectAccountExpenseRepository.findOne({
      where: {
        id: expenseId,
      },
    });

  if (!expense) {
    throw new NotFoundException('Expense not found');
  }

  if (
    expense.approvalStatus ===
    ProjectAccountExpenseApprovalStatus.APPROVED
  ) {
    throw new BadRequestException(
      'Approved expense cannot be edited because ledger entry is already created',
    );
  }

  const amount = Number(body?.amount || expense.amount || 0);

  if (!amount || amount <= 0) {
    throw new BadRequestException(
      'Valid amount is required',
    );
  }

  expense.expenseType =
    Object.values(ProjectAccountExpenseType).includes(
      body?.expenseType,
    )
      ? body.expenseType
      : expense.expenseType;

  expense.amount = amount;

  expense.remarks =
    body?.remarks !== undefined
      ? body.remarks || null
      : expense.remarks;

  expense.branchName =
    body?.branchName !== undefined
      ? body.branchName || null
      : expense.branchName;

  expense.projectOwnerId =
    body?.projectOwnerId !== undefined &&
    body?.projectOwnerId !== ''
      ? Number(body.projectOwnerId)
      : expense.projectOwnerId;

  expense.projectOwnerName =
    body?.projectOwnerName !== undefined
      ? body.projectOwnerName || null
      : expense.projectOwnerName;

  return this.projectAccountExpenseRepository.save(
    expense,
  );
}

async hideAccountExpense(
  expenseId: number,
  body: any,
  currentUser: any,
) {
  const expense =
    await this.projectAccountExpenseRepository.findOne({
      where: {
        id: expenseId,
      },
    });

  if (!expense) {
    throw new NotFoundException('Expense not found');
  }

  if (
    !body?.hiddenReason ||
    !String(body.hiddenReason).trim()
  ) {
    throw new BadRequestException(
      'Hide reason is required',
    );
  }

  expense.isHidden = true;
  expense.hiddenReason = String(
    body.hiddenReason,
  ).trim();
  expense.hiddenAt = new Date();
  expense.hiddenBy =
    currentUser?.id || currentUser?.userId || null;
  expense.hiddenByName = currentUser?.name || '';

  return this.projectAccountExpenseRepository.save(
    expense,
  );
}

async getAccountExpenseSummary() {
  const expenses =
    await this.projectAccountExpenseRepository.find({
      where: {
        isHidden: false,
      },
    });

  const approvedExpenses = expenses.filter(
    (expense) =>
      expense.approvalStatus ===
      ProjectAccountExpenseApprovalStatus.APPROVED,
  );

  const pendingExpenses = expenses.filter(
    (expense) =>
      expense.approvalStatus ===
      ProjectAccountExpenseApprovalStatus.PENDING,
  );

  const sum = (items: ProjectAccountExpense[]) =>
    items.reduce(
      (total, item) => total + Number(item.amount || 0),
      0,
    );

  return {
    totalExpenses: sum(approvedExpenses),

    pendingExpenses: sum(pendingExpenses),

    contractorPayments: sum(
      approvedExpenses.filter(
        (expense) =>
          expense.expenseType ===
          ProjectAccountExpenseType.CONTRACTOR_PAYMENT,
      ),
    ),

    labourPayments: sum(
      approvedExpenses.filter(
        (expense) =>
          expense.expenseType ===
          ProjectAccountExpenseType.LABOUR_PAYMENT,
      ),
    ),

    transportationExpenses: sum(
      approvedExpenses.filter(
        (expense) =>
          expense.expenseType ===
          ProjectAccountExpenseType.TRANSPORTATION,
      ),
    ),

    salaryAndIncentives: sum(
      approvedExpenses.filter((expense) =>
        [
          ProjectAccountExpenseType.SALARY,
          ProjectAccountExpenseType.INCENTIVE,
          ProjectAccountExpenseType.ADVANCE_SALARY,
        ].includes(expense.expenseType),
      ),
    ),
  };
}

async listAccountExpenses() {
  return this.projectAccountExpenseRepository.find({
    where: {
      isHidden: false,
    },
    order: {
      createdAt: 'DESC',
    },
  });
}

async getMonthlyProfitReport(query: any) {
  const month =
    query?.month ||
    new Date().toISOString().slice(0, 7);

  const [year, monthNumber] = month
    .split('-')
    .map(Number);

  if (!year || !monthNumber) {
    throw new BadRequestException(
      'Valid month is required',
    );
  }

  const startDate = new Date(
    year,
    monthNumber - 1,
    1,
  );

  const endDate = new Date(
    year,
    monthNumber,
    1,
  );

  const collectionQb =
    this.projectPaymentInstallmentRepository
      .createQueryBuilder('payment')
      .where('payment.isHidden = false')
      .andWhere(
        'payment.approvalStatus = :approvalStatus',
        {
          approvalStatus: 'APPROVED',
        },
      )
      .andWhere('payment.paidAmount > 0')
      .andWhere('payment.paidDate >= :startDate', {
        startDate,
      })
      .andWhere('payment.paidDate < :endDate', {
        endDate,
      });

  const expenseQb =
    this.projectAccountExpenseRepository
      .createQueryBuilder('expense')
      .where('expense.isHidden = false')
      .andWhere(
        'expense.approvalStatus = :approvalStatus',
        {
          approvalStatus:
            ProjectAccountExpenseApprovalStatus.APPROVED,
        },
      )
      .andWhere('expense.createdAt >= :startDate', {
        startDate,
      })
      .andWhere('expense.createdAt < :endDate', {
        endDate,
      });

  const collectionRows =
    await collectionQb.getMany();

  const expenseRows =
    await expenseQb.getMany();

  const totalCollections =
    collectionRows.reduce(
      (total, item) =>
        total + Number(item.paidAmount || 0),
      0,
    );

  const totalExpenses =
    expenseRows.reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0,
    );

  return {
    month,
    summary: {
      totalCollections,
      totalExpenses,
      netProfit:
        totalCollections - totalExpenses,
      collectionCount:
        collectionRows.length,
      expenseCount:
        expenseRows.length,
    },
  };
}

async getBranchWiseProfitReport(query: any) {
  const {
    month,
    fromDate,
    toDate,
    branch,
    projectOwnerId,
  } = query || {};

  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (month?.trim()) {
    const [year, monthNumber] = month
      .trim()
      .split('-')
      .map(Number);

    if (year && monthNumber) {
      startDate = new Date(
        year,
        monthNumber - 1,
        1,
      );

      endDate = new Date(
        year,
        monthNumber,
        1,
      );
    }
  } else {
    if (fromDate?.trim()) {
      startDate = new Date(fromDate.trim());
    }

    if (toDate?.trim()) {
      endDate = new Date(toDate.trim());
      endDate.setHours(23, 59, 59, 999);
    }
  }

  const branchMap = new Map<
    string,
    {
      branchName: string;
      totalCollections: number;
      totalExpenses: number;
    }
  >();

  const paymentQb =
    this.projectPaymentInstallmentRepository
      .createQueryBuilder('payment')
      .leftJoin(
        Project,
        'project',
        'project.id = payment.projectId',
      )
      .select([
        'payment.paidAmount AS "paidAmount"',
        'payment.approvalStatus AS "approvalStatus"',
        'payment.paidDate AS "paidDate"',
        'project.branchName AS "branchName"',
        'project.projectOwnerId AS "projectOwnerId"',
      ])
      .where('payment.isHidden = false')
      .andWhere('project.isHidden = false')
      .andWhere(
        'payment.approvalStatus = :approvalStatus',
        {
          approvalStatus: 'APPROVED',
        },
      )
      .andWhere('payment.paidAmount > 0');

  if (startDate) {
    paymentQb.andWhere(
      'payment.paidDate >= :startDate',
      { startDate },
    );
  }

  if (endDate) {
    paymentQb.andWhere(
      'payment.paidDate < :endDate',
      { endDate },
    );
  }

  if (branch?.trim()) {
    paymentQb.andWhere(
      'LOWER(project.branchName) LIKE LOWER(:branch)',
      {
        branch: `%${branch.trim()}%`,
      },
    );
  }

  if (projectOwnerId) {
    paymentQb.andWhere(
      'project.projectOwnerId = :projectOwnerId',
      {
        projectOwnerId: Number(projectOwnerId),
      },
    );
  }

  const payments =
    await paymentQb.getRawMany();

  for (const row of payments) {
    const branchName =
      row.branchName?.trim() ||
      'UNASSIGNED';

    if (!branchMap.has(branchName)) {
      branchMap.set(branchName, {
        branchName,
        totalCollections: 0,
        totalExpenses: 0,
      });
    }

    const current =
      branchMap.get(branchName)!;

    current.totalCollections += Number(
      row.paidAmount || 0,
    );
  }

  const expenseQb =
    this.projectAccountExpenseRepository
      .createQueryBuilder('expense')
      .leftJoin(
        Project,
        'project',
        'project.id = expense.projectId',
      )
      .select([
        'expense.amount AS "amount"',
        'expense.branchName AS "expenseBranchName"',
        'expense.createdAt AS "createdAt"',
        'expense.projectOwnerId AS "expenseProjectOwnerId"',
        'project.branchName AS "projectBranchName"',
        'project.city AS "projectCity"',
        'project.projectOwnerId AS "projectOwnerId"',
      ])
      .where('expense.isHidden = false')
      .andWhere(
        'expense.approvalStatus = :approvalStatus',
        {
          approvalStatus:
            ProjectAccountExpenseApprovalStatus.APPROVED,
        },
      );

  if (startDate) {
    expenseQb.andWhere(
      'expense.createdAt >= :startDate',
      { startDate },
    );
  }

  if (endDate) {
    expenseQb.andWhere(
      'expense.createdAt < :endDate',
      { endDate },
    );
  }

  if (branch?.trim()) {
    expenseQb.andWhere(
      `LOWER(
        COALESCE(
          expense.branchName,
          project.branchName,
          project.city,
          'UNASSIGNED'
        )
      ) LIKE LOWER(:branch)`,
      {
        branch: `%${branch.trim()}%`,
      },
    );
  }

  if (projectOwnerId) {
    expenseQb.andWhere(
      `COALESCE(
        expense.projectOwnerId,
        project.projectOwnerId
      ) = :projectOwnerId`,
      {
        projectOwnerId: Number(projectOwnerId),
      },
    );
  }

  const expenses =
    await expenseQb.getRawMany();

  for (const row of expenses) {
    const branchName =
      row.expenseBranchName?.trim() ||
      row.projectBranchName?.trim() ||
      row.projectCity?.trim() ||
      'UNASSIGNED';

    if (!branchMap.has(branchName)) {
      branchMap.set(branchName, {
        branchName,
        totalCollections: 0,
        totalExpenses: 0,
      });
    }

    const current =
      branchMap.get(branchName)!;

    current.totalExpenses += Number(
      row.amount || 0,
    );
  }

  return Array.from(branchMap.values())
    .map((item) => ({
      ...item,
      netProfit:
        item.totalCollections -
        item.totalExpenses,
    }))
    .sort(
      (a, b) =>
        b.netProfit - a.netProfit,
    );
}

async getProjectOwnerWiseProfitReport(query: any) {
  const {
    month,
    branch,
    projectOwnerId,
    page = 1,
    limit = 20,
  } = query || {};

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(
    Math.max(Number(limit) || 20, 1),
    100,
  );

  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (month?.trim()) {
    const [year, monthNumber] = month
      .trim()
      .split('-')
      .map(Number);

    if (year && monthNumber) {
      startDate = new Date(year, monthNumber - 1, 1);
      endDate = new Date(year, monthNumber, 1);
    }
  }

  const ownerMap = new Map<
    string,
    {
      projectOwnerId: number | null;
      projectOwnerName: string;
      totalCollections: number;
      totalExpenses: number;
    }
  >();

  const paymentQb =
    this.projectPaymentInstallmentRepository
      .createQueryBuilder('payment')
      .leftJoin(
        Project,
        'project',
        'project.id = payment.projectId',
      )
      .select([
        'payment.paidAmount AS "paidAmount"',
        'project.projectOwnerId AS "projectOwnerId"',
        'project.projectOwnerName AS "projectOwnerName"',
        'project.branchName AS "branchName"',
      ])
      .where('payment.isHidden = false')
      .andWhere('project.isHidden = false')
      .andWhere(
        'payment.approvalStatus = :approvalStatus',
        {
          approvalStatus: 'APPROVED',
        },
      )
      .andWhere('payment.paidAmount > 0');

  if (startDate) {
    paymentQb.andWhere(
      'payment.paidDate >= :startDate',
      { startDate },
    );
  }

  if (endDate) {
    paymentQb.andWhere('payment.paidDate < :endDate', {
      endDate,
    });
  }

  if (branch?.trim()) {
    paymentQb.andWhere(
      'LOWER(project.branchName) LIKE LOWER(:branch)',
      {
        branch: `%${branch.trim()}%`,
      },
    );
  }

  if (projectOwnerId) {
    paymentQb.andWhere(
      'project.projectOwnerId = :projectOwnerId',
      {
        projectOwnerId: Number(projectOwnerId),
      },
    );
  }

  const payments = await paymentQb.getRawMany();

  for (const row of payments) {
    const ownerId = row.projectOwnerId
      ? Number(row.projectOwnerId)
      : null;

    const ownerName =
      row.projectOwnerName?.trim() || 'UNASSIGNED';

    const key = ownerId
      ? String(ownerId)
      : `UNASSIGNED-${ownerName}`;

    if (!ownerMap.has(key)) {
      ownerMap.set(key, {
        projectOwnerId: ownerId,
        projectOwnerName: ownerName,
        totalCollections: 0,
        totalExpenses: 0,
      });
    }

    ownerMap.get(key)!.totalCollections += Number(
      row.paidAmount || 0,
    );
  }

  const expenseQb =
    this.projectAccountExpenseRepository
      .createQueryBuilder('expense')
      .leftJoin(
        Project,
        'project',
        'project.id = expense.projectId',
      )
      .select([
        'expense.amount AS "amount"',
        'expense.projectOwnerId AS "expenseProjectOwnerId"',
        'expense.projectOwnerName AS "expenseProjectOwnerName"',
        'expense.branchName AS "expenseBranchName"',
        'project.projectOwnerId AS "projectOwnerId"',
        'project.projectOwnerName AS "projectOwnerName"',
        'project.branchName AS "projectBranchName"',
        'project.city AS "projectCity"',
      ])
      .where('expense.isHidden = false')
      .andWhere(
        'expense.approvalStatus = :approvalStatus',
        {
          approvalStatus:
            ProjectAccountExpenseApprovalStatus.APPROVED,
        },
      );

  if (startDate) {
    expenseQb.andWhere(
      'expense.createdAt >= :startDate',
      { startDate },
    );
  }

  if (endDate) {
    expenseQb.andWhere('expense.createdAt < :endDate', {
      endDate,
    });
  }

  if (branch?.trim()) {
    expenseQb.andWhere(
      `LOWER(
        COALESCE(
          expense.branchName,
          project.branchName,
          project.city,
          'UNASSIGNED'
        )
      ) LIKE LOWER(:branch)`,
      {
        branch: `%${branch.trim()}%`,
      },
    );
  }

  if (projectOwnerId) {
  expenseQb.andWhere(
    `COALESCE(
      "expense"."projectOwnerId",
      "project"."projectOwnerId"
    ) = :projectOwnerId`,
    {
      projectOwnerId: Number(projectOwnerId),
    },
  );
}

  const expenses = await expenseQb.getRawMany();

  for (const row of expenses) {
    const ownerId =
      row.expenseProjectOwnerId ||
      row.projectOwnerId
        ? Number(
            row.expenseProjectOwnerId ||
              row.projectOwnerId,
          )
        : null;

    const ownerName =
      row.expenseProjectOwnerName?.trim() ||
      row.projectOwnerName?.trim() ||
      'UNASSIGNED';

    const key = ownerId
      ? String(ownerId)
      : `UNASSIGNED-${ownerName}`;

    if (!ownerMap.has(key)) {
      ownerMap.set(key, {
        projectOwnerId: ownerId,
        projectOwnerName: ownerName,
        totalCollections: 0,
        totalExpenses: 0,
      });
    }

    ownerMap.get(key)!.totalExpenses += Number(
      row.amount || 0,
    );
  }

  const allRows = Array.from(ownerMap.values())
    .map((item) => ({
      ...item,
      netProfit:
        item.totalCollections - item.totalExpenses,
    }))
    .sort((a, b) => b.netProfit - a.netProfit);

  const total = allRows.length;

  const paginatedRows = allRows.slice(
    (pageNumber - 1) * limitNumber,
    pageNumber * limitNumber,
  );

  return {
    summary: {
      totalOwners: total,
      totalCollections: allRows.reduce(
        (sum, item) =>
          sum + Number(item.totalCollections || 0),
        0,
      ),
      totalExpenses: allRows.reduce(
        (sum, item) =>
          sum + Number(item.totalExpenses || 0),
        0,
      ),
      totalProfit: allRows.reduce(
        (sum, item) =>
          sum + Number(item.netProfit || 0),
        0,
      ),
      highestProfitOwner:
        allRows.length > 0
          ? allRows[0].projectOwnerName
          : '-',
    },
    data: paginatedRows,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
}

async getSalaryReport(query: any) {
  const {
    month,
    branch,
    projectOwnerId,
    approvalStatus,
    page = 1,
    limit = 20,
  } = query || {};

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(
    Math.max(Number(limit) || 20, 1),
    100,
  );

  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (month?.trim()) {
    const [year, monthNumber] = month
      .trim()
      .split('-')
      .map(Number);

    if (year && monthNumber) {
      startDate = new Date(year, monthNumber - 1, 1);
      endDate = new Date(year, monthNumber, 1);
    }
  }

  const qb =
    this.projectAccountExpenseRepository
      .createQueryBuilder('expense')
      .leftJoin(
        Project,
        'project',
        'project.id = expense.projectId',
      )
      .where('expense.isHidden = false')
      .andWhere('expense.expenseType IN (:...salaryTypes)', {
        salaryTypes: [
          ProjectAccountExpenseType.SALARY,
          ProjectAccountExpenseType.ADVANCE_SALARY,
        ],
      });

  if (startDate) {
    qb.andWhere('expense.createdAt >= :startDate', {
      startDate,
    });
  }

  if (endDate) {
    qb.andWhere('expense.createdAt < :endDate', {
      endDate,
    });
  }

  if (branch?.trim()) {
    qb.andWhere(
      `LOWER(
        COALESCE(
          expense.branchName,
          project.branchName,
          project.city,
          'UNASSIGNED'
        )
      ) LIKE LOWER(:branch)`,
      {
        branch: `%${branch.trim()}%`,
      },
    );
  }

  if (projectOwnerId) {
    qb.andWhere(
      `COALESCE(
        "expense"."projectOwnerId",
        "project"."projectOwnerId"
      ) = :projectOwnerId`,
      {
        projectOwnerId: Number(projectOwnerId),
      },
    );
  }

  if (approvalStatus?.trim()) {
    qb.andWhere(
      'expense.approvalStatus = :approvalStatus',
      {
        approvalStatus: approvalStatus.trim(),
      },
    );
  }

  qb.orderBy('expense.createdAt', 'DESC');

  const allRows = await qb.getMany();

  const totalSalary = allRows
    .filter(
      (item) =>
        item.expenseType ===
        ProjectAccountExpenseType.SALARY,
    )
    .reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0,
    );

  const totalAdvanceSalary = allRows
    .filter(
      (item) =>
        item.expenseType ===
        ProjectAccountExpenseType.ADVANCE_SALARY,
    )
    .reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0,
    );

  const approvedSalary = allRows
    .filter(
      (item) =>
        item.approvalStatus ===
        ProjectAccountExpenseApprovalStatus.APPROVED,
    )
    .reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0,
    );

  const pendingSalary = allRows
    .filter(
      (item) =>
        item.approvalStatus ===
        ProjectAccountExpenseApprovalStatus.PENDING,
    )
    .reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0,
    );

  const total = allRows.length;

  const paginatedRows = allRows.slice(
    (pageNumber - 1) * limitNumber,
    pageNumber * limitNumber,
  );

  return {
    summary: {
      totalSalary,
      totalAdvanceSalary,
      approvedSalary,
      pendingSalary,
      totalRecords: total,
    },
    data: paginatedRows,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
}

async getIncentiveReport(query: any) {
  const {
    month,
    branch,
    projectOwnerId,
    approvalStatus,
    page = 1,
    limit = 20,
  } = query || {};

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);

  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (month?.trim()) {
    const [year, monthNumber] = month.trim().split('-').map(Number);

    if (year && monthNumber) {
      startDate = new Date(year, monthNumber - 1, 1);
      endDate = new Date(year, monthNumber, 1);
    }
  }

  const qb = this.projectAccountExpenseRepository
    .createQueryBuilder('expense')
    .leftJoin(Project, 'project', 'project.id = expense.projectId')
    .where('expense.isHidden = false')
    .andWhere('expense.expenseType = :expenseType', {
      expenseType: ProjectAccountExpenseType.INCENTIVE,
    });

  if (startDate) {
    qb.andWhere('expense.createdAt >= :startDate', { startDate });
  }

  if (endDate) {
    qb.andWhere('expense.createdAt < :endDate', { endDate });
  }

  if (branch?.trim()) {
    qb.andWhere(
      `LOWER(
        COALESCE(
          expense.branchName,
          project.branchName,
          project.city,
          'UNASSIGNED'
        )
      ) LIKE LOWER(:branch)`,
      { branch: `%${branch.trim()}%` },
    );
  }

  if (projectOwnerId) {
    qb.andWhere(
      `COALESCE(
        "expense"."projectOwnerId",
        "project"."projectOwnerId"
      ) = :projectOwnerId`,
      { projectOwnerId: Number(projectOwnerId) },
    );
  }

  if (approvalStatus?.trim()) {
    qb.andWhere('expense.approvalStatus = :approvalStatus', {
      approvalStatus: approvalStatus.trim(),
    });
  }

  qb.orderBy('expense.createdAt', 'DESC');

  const allRows = await qb.getMany();

  const totalIncentives = allRows.reduce(
    (total, item) => total + Number(item.amount || 0),
    0,
  );

  const approvedIncentives = allRows
    .filter(
      (item) =>
        item.approvalStatus ===
        ProjectAccountExpenseApprovalStatus.APPROVED,
    )
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const pendingIncentives = allRows
    .filter(
      (item) =>
        item.approvalStatus ===
        ProjectAccountExpenseApprovalStatus.PENDING,
    )
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const rejectedIncentives = allRows
    .filter(
      (item) =>
        item.approvalStatus ===
        ProjectAccountExpenseApprovalStatus.REJECTED,
    )
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const total = allRows.length;

  const paginatedRows = allRows.slice(
    (pageNumber - 1) * limitNumber,
    pageNumber * limitNumber,
  );

  return {
    summary: {
      totalIncentives,
      approvedIncentives,
      pendingIncentives,
      rejectedIncentives,
      totalRecords: total,
    },
    data: paginatedRows,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
}

async getAccountExpenseReport(query: any) {
  const qb =
    this.projectAccountExpenseRepository
      .createQueryBuilder('expense')
      .where('expense.isHidden = :isHidden', {
        isHidden: false,
      });

  if (query?.fromDate) {
    qb.andWhere(
      'expense.createdAt >= :fromDate',
      {
        fromDate: new Date(query.fromDate),
      },
    );
  }

  if (query?.toDate) {
    const toDate = new Date(query.toDate);
    toDate.setHours(23, 59, 59, 999);

    qb.andWhere('expense.createdAt <= :toDate', {
      toDate,
    });
  }

  if (query?.expenseType) {
    qb.andWhere(
      'expense.expenseType = :expenseType',
      {
        expenseType: query.expenseType,
      },
    );
  }

  if (query?.approvalStatus) {
    qb.andWhere(
      'expense.approvalStatus = :approvalStatus',
      {
        approvalStatus: query.approvalStatus,
      },
    );
  }

  qb.orderBy('expense.createdAt', 'DESC');

  const rows = await qb.getMany();

  const totalApprovedExpenses = rows
    .filter(
      (item) =>
        item.approvalStatus ===
        ProjectAccountExpenseApprovalStatus.APPROVED,
    )
    .reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0,
    );

  const totalPendingExpenses = rows
    .filter(
      (item) =>
        item.approvalStatus ===
        ProjectAccountExpenseApprovalStatus.PENDING,
    )
    .reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0,
    );

  const totalRejectedExpenses = rows
    .filter(
      (item) =>
        item.approvalStatus ===
        ProjectAccountExpenseApprovalStatus.REJECTED,
    )
    .reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0,
    );

  return {
    summary: {
      totalApprovedExpenses,
      totalPendingExpenses,
      totalRejectedExpenses,
      totalExpenseCount: rows.length,
    },
    data: rows,
  };
}

async approveAccountExpense(
  expenseId: number,
  body: any,
  currentUser: any,
) {
  const expense =
    await this.projectAccountExpenseRepository.findOne({
      where: {
        id: expenseId,
      },
    });

  if (!expense) {
    throw new NotFoundException(
      'Expense not found',
    );
  }

  if (
    expense.approvalStatus ===
    ProjectAccountExpenseApprovalStatus.APPROVED
  ) {
    throw new BadRequestException(
      'Expense already approved',
    );
  }

  expense.approvalStatus =
    ProjectAccountExpenseApprovalStatus.APPROVED;

  expense.approvedBy =
    currentUser?.id ||
    currentUser?.userId ||
    null;

  expense.approvedByName =
    currentUser?.name || '';

  expense.approvedAt = new Date();

  expense.approvalNote =
    body?.approvalNote || null;

  const savedExpense =
    await this.projectAccountExpenseRepository.save(
      expense,
    );

  await this.projectPartyLedgerRepository.save(
    this.projectPartyLedgerRepository.create({
      partyName: 'EPC Expense',

      partyType: 'EXPENSE',

      projectId:
        savedExpense.projectId,

      entryType:
        ProjectLedgerEntryType.DEBIT,

      sourceType:
        ProjectLedgerSourceType.MANUAL_ADJUSTMENT,

      sourceId:
        savedExpense.id,

      amount:
        Number(savedExpense.amount || 0),

      remarks:
        `${savedExpense.expenseType} - ${
          savedExpense.remarks || ''
        }`,

      createdBy:
        currentUser?.id ||
        currentUser?.userId ||
        null,

      createdByName:
        currentUser?.name || '',
    }),
  );

  return savedExpense;
}

async rejectAccountExpense(
  expenseId: number,
  body: any,
  currentUser: any,
) {
  const expense =
    await this.projectAccountExpenseRepository.findOne({
      where: {
        id: expenseId,
      },
    });

  if (!expense) {
    throw new NotFoundException(
      'Expense not found',
    );
  }

  expense.approvalStatus =
    ProjectAccountExpenseApprovalStatus.REJECTED;

  expense.approvedBy =
    currentUser?.id ||
    currentUser?.userId ||
    null;

  expense.approvedByName =
    currentUser?.name || '';

  expense.approvedAt = new Date();

  expense.approvalNote =
    body?.approvalNote || null;

  return this.projectAccountExpenseRepository.save(
    expense,
  );
}

async getPaymentReminderList(currentUser: any) {
  const todayIndia = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata',
  });

  const today = new Date(`${todayIndia}T00:00:00`);
  const reminderWindowEnd = new Date(today);
  reminderWindowEnd.setDate(reminderWindowEnd.getDate() + 8);

  const roles = currentUser?.roles || [];
  const userId = currentUser?.id || currentUser?.userId;

  const canSeeAll =
    roles.includes('OWNER') ||
    roles.includes('MARKETING_HEAD') ||
    roles.includes('PROJECT_MANAGER') ||
    roles.includes('PAYMENT_COLLECTION_EXECUTIVE');

  const qb = this.projectPaymentInstallmentRepository
    .createQueryBuilder('payment')
    .leftJoin(Project, 'project', 'project.id = payment.projectId')
    .leftJoin(
      ProjectPaymentReminderUserState,
      'userState',
      'userState.installmentId = payment.id AND userState.userId = :userId',
      { userId },
    )
    .select([
      'payment.id AS "id"',
      'payment.projectId AS "projectId"',
      'payment.label AS "label"',
      'payment.amount AS "amount"',
      'payment.paidAmount AS "paidAmount"',
      'payment.pendingAmount AS "pendingAmount"',
      'payment.dueDate AS "dueDate"',
      'payment.status AS "status"',
      'project.customerName AS "customerName"',
      'project.customerPhone AS "customerPhone"',
      'project.branchName AS "branchName"',
      'project.projectOwnerId AS "projectOwnerId"',
      'project.projectOwnerName AS "projectOwnerName"',
      'project.projectSerial AS "projectSerial"',
      'userState.status AS "userReminderStatus"',
      'userState.readAt AS "userReadAt"',
    ])
    .where('payment.pendingAmount > 0')
.andWhere('payment.isHidden = false')
.andWhere('project.isHidden = false')
    .andWhere('payment.status != :paidStatus', {
      paidStatus: ProjectPaymentInstallmentStatus.PAID,
    })
    .andWhere('payment.status != :cancelledStatus', {
      cancelledStatus: ProjectPaymentInstallmentStatus.CANCELLED,
    })
    .andWhere('payment.dueDate IS NOT NULL')
    .andWhere('payment.dueDate < :windowEnd', {
      windowEnd: reminderWindowEnd,
    })
    .andWhere(
      '(userState.id IS NULL OR userState.status != :dismissedStatus)',
      {
        dismissedStatus:
          ProjectPaymentReminderUserStateStatus.DISMISSED,
      },
    )
    .orderBy('payment.dueDate', 'ASC')
    .addOrderBy('payment.id', 'DESC');

  if (!canSeeAll) {
    qb.andWhere('project.projectOwnerId = :userId', { userId });
  }

  const rows = await qb.getRawMany();

  return rows
    .map((row) => {
      const dueDate = row.dueDate
        ? String(row.dueDate).split('T')[0]
        : null;

      if (!dueDate) return null;

      let reminderType:
        | 'PAYMENT_OVERDUE'
        | 'PAYMENT_DUE_TODAY'
        | 'PAYMENT_UPCOMING'
        | null = null;

      if (dueDate < todayIndia) {
        reminderType = 'PAYMENT_OVERDUE';
      } else if (dueDate === todayIndia) {
        reminderType = 'PAYMENT_DUE_TODAY';
      } else if (dueDate > todayIndia) {
        reminderType = 'PAYMENT_UPCOMING';
      }

      if (!reminderType) return null;

      return {
        id: Number(row.id),
        projectId: Number(row.projectId),
        label: row.label,
        amount: Number(row.amount || 0),
        paidAmount: Number(row.paidAmount || 0),
        pendingAmount: Number(row.pendingAmount || 0),
        dueDate: row.dueDate,
        status: this.getComputedPaymentStatus(
          row.status,
          row.dueDate,
          Number(row.pendingAmount || 0),
        ),
        reminderType,

        customerName: row.customerName || null,
        customerPhone: row.customerPhone || null,
        branchName: row.branchName || null,
        projectOwnerId: row.projectOwnerId
          ? Number(row.projectOwnerId)
          : null,
        projectOwnerName: row.projectOwnerName || null,
        projectSerial: row.projectSerial || null,

        userReminderStatus: row.userReminderStatus || 'UNREAD',
        userReadAt: row.userReadAt || null,
      };
    })
    .filter(Boolean);
}

async getApprovalReminderList(
  currentUser: any,
  pagination?: {
    page?: number;
    limit?: number;
  },
) {
  const roles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : [];

  const userId = currentUser?.id || currentUser?.userId;

  const page =
  Number(pagination?.page) > 0
    ? Number(pagination?.page)
    : 1;

const limit =
  Number(pagination?.limit) > 0
    ? Math.min(Number(pagination?.limit), 50)
    : 20;

const skip = (page - 1) * limit;

  const canSeeApprovalReminders =
    roles.includes('OWNER') ||
    roles.includes('MARKETING_HEAD') ||
    roles.includes('PROJECT_MANAGER');

  if (!canSeeApprovalReminders) {
    return [];
  }

  const qb = this.projectRepository
    .createQueryBuilder('project')
    .select([
      'project.id AS "projectId"',
      'project.customerName AS "customerName"',
      'project.customerPhone AS "customerPhone"',
      'project.branchName AS "branchName"',
      'project.projectOwnerId AS "projectOwnerId"',
      'project.projectOwnerName AS "projectOwnerName"',
      'project.projectSerial AS "projectSerial"',
      'project.status AS "projectStatus"',
      'project.projectManagerApprovalStatus AS "projectManagerApprovalStatus"',
'project.marketingHeadApprovalStatus AS "marketingHeadApprovalStatus"',
'project.ownerApprovalStatus AS "ownerApprovalStatus"',
      'project.createdAt AS "createdAt"',
    ])
    .where('project.isHidden = false')
    .andWhere('project.status NOT IN (:...closedStatuses)', {
  closedStatuses: [
    ProjectStatus.REJECTED,
    ProjectStatus.COMPLETED,
  ],
})
    .andWhere(
  `(
    project.projectManagerApprovalStatus = :pendingStatus
    OR project.marketingHeadApprovalStatus = :pendingStatus
    OR project.ownerApprovalStatus = :pendingStatus
  )`,
      {
        pendingStatus: ProjectApprovalStatus.PENDING,
      },
    )
    .orderBy('project.createdAt', 'DESC')
.offset(skip)
.limit(limit);

  const rows = await qb.getRawMany();

  const totalQb = this.projectRepository
  .createQueryBuilder('project')
  .where('project.isHidden = false')
  .andWhere('project.status NOT IN (:...closedStatuses)', {
  closedStatuses: [
    ProjectStatus.REJECTED,
    ProjectStatus.COMPLETED,
  ],
})
  .andWhere(
    `(
      project.projectManagerApprovalStatus = :pendingStatus
      OR project.marketingHeadApprovalStatus = :pendingStatus
      OR project.ownerApprovalStatus = :pendingStatus
    )`,
    {
      pendingStatus: ProjectApprovalStatus.PENDING,
    },
  );

const total = await totalQb.getCount();

const reminderIds = rows.map((row) =>
  Number(row.projectId),
);

const stateMap =
  await this.getUnifiedReminderStateMap(
    currentUser,
    'APPROVAL',
    reminderIds,
  );

  const data = rows
    .map((row) => {
      const projectManagerPending =
  row.projectManagerApprovalStatus ===
  ProjectApprovalStatus.PENDING;


      const marketingPending =
        row.marketingHeadApprovalStatus ===
        ProjectApprovalStatus.PENDING;

      const ownerPending =
        row.ownerApprovalStatus ===
        ProjectApprovalStatus.PENDING;

      let reminderType = '';

      if (roles.includes('MARKETING_HEAD') && marketingPending) {
        reminderType = 'MARKETING_APPROVAL_PENDING';
      } else if (roles.includes('OWNER') && ownerPending) {
        reminderType = 'OWNER_APPROVAL_PENDING';
      } else if (roles.includes('PROJECT_MANAGER')) {
        if (projectManagerPending) {
  reminderType = 'PROJECT_MANAGER_APPROVAL_PENDING';
} else if (marketingPending && ownerPending) {
  reminderType = 'PROJECT_APPROVAL_PENDING';
} else if (marketingPending) {
  reminderType = 'MARKETING_APPROVAL_PENDING';
} else if (ownerPending) {
  reminderType = 'OWNER_APPROVAL_PENDING';
}
      } else if (roles.includes('OWNER') && marketingPending) {
        reminderType = 'MARKETING_APPROVAL_PENDING';
      }

      if (!reminderType) {
        return null;
      }

      return {
        id: Number(row.projectId),
        projectId: Number(row.projectId),
        reminderType,
        title: reminderType,
        subtitle: row.projectSerial
          ? `Project ${row.projectSerial}`
          : `Project #${row.projectId}`,
        customerName: row.customerName || null,
        customerPhone: row.customerPhone || null,
        branchName: row.branchName || null,
        projectOwnerId: row.projectOwnerId
          ? Number(row.projectOwnerId)
          : null,
        projectOwnerName: row.projectOwnerName || null,
        projectSerial: row.projectSerial || null,
        projectStatus: row.projectStatus || null,
        projectManagerApprovalStatus:
  row.projectManagerApprovalStatus || null,
marketingHeadApprovalStatus:
  row.marketingHeadApprovalStatus || null,
ownerApprovalStatus:
  row.ownerApprovalStatus || null,
        createdAt: row.createdAt,
        userReminderStatus:
  stateMap[String(row.projectId)]
    ?.status || 'UNREAD',
      };
    })
    .filter((item) => {
  if (!item) return false;

  return (
    item.userReminderStatus !==
    ProjectReminderUserStateStatus.DISMISSED
  );
});

return {
  data,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
};
}

async getPurchaseReminderList(currentUser: any) {
  const roles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : [];

  const userId =
    currentUser?.id || currentUser?.userId;

  const canSeeAll =
    roles.includes('OWNER') ||
    roles.includes('PROJECT_MANAGER') ||
    roles.includes('MARKETING_HEAD');

  const qb =
    this.projectMaterialRequestItemRepository
      .createQueryBuilder('item')

      .leftJoin(
        Project,
        'project',
        'project.id = item.projectId',
      )

      .select([
        'item.id AS "id"',
        'item.projectId AS "projectId"',
        'item.materialName AS "materialName"',
        'item.category AS "category"',
        'item.brand AS "brand"',
        'item.quantity AS "quantity"',
        'item.purchasedQuantity AS "purchasedQuantity"',
        'item.pendingQuantity AS "pendingQuantity"',
        'item.purchaseStatus AS "purchaseStatus"',
        'item.createdAt AS "createdAt"',

        'project.customerName AS "customerName"',
        'project.customerPhone AS "customerPhone"',
        'project.branchName AS "branchName"',
        'project.projectOwnerId AS "projectOwnerId"',
        'project.projectOwnerName AS "projectOwnerName"',
        'project.projectSerial AS "projectSerial"',
      ])

      .where('item.pendingQuantity > 0')

      .andWhere('project.isHidden = false')

      .orderBy('item.createdAt', 'ASC')

      .limit(50);

  if (!canSeeAll) {
    qb.andWhere(
      'project.projectOwnerId = :userId',
      {
        userId,
      },
    );
  }

  const rows = await qb.getRawMany();

const reminderIds = rows.map((row) =>
  Number(row.id),
);

const stateMap =
  await this.getUnifiedReminderStateMap(
    currentUser,
    'PURCHASE',
    reminderIds,
  );

  return rows
  .map((row) => {
    const reminderType =
      row.purchaseStatus ===
      'PARTIALLY_PURCHASED'
        ? 'PARTIAL_PURCHASE_PENDING'
        : 'PURCHASE_PENDING';

    return {
      id: Number(row.id),
      projectId: Number(row.projectId),

      reminderType,

      materialName:
        row.materialName || null,

      category:
        row.category || null,

      brand:
        row.brand || null,

      quantity: Number(
        row.quantity || 0,
      ),

      purchasedQuantity: Number(
        row.purchasedQuantity || 0,
      ),

      pendingQuantity: Number(
        row.pendingQuantity || 0,
      ),

      purchaseStatus:
        row.purchaseStatus || null,

      customerName:
        row.customerName || null,

      customerPhone:
        row.customerPhone || null,

      branchName:
        row.branchName || null,

      projectOwnerId:
        row.projectOwnerId
          ? Number(row.projectOwnerId)
          : null,

      projectOwnerName:
        row.projectOwnerName || null,

      projectSerial:
        row.projectSerial || null,

      userReminderStatus:
  stateMap[String(row.id)]
    ?.status || 'UNREAD',

      createdAt: row.createdAt,
    };
    })
  .filter((item) => {
    if (!item) return false;

    return (
      item.userReminderStatus !==
      ProjectReminderUserStateStatus.DISMISSED
    );
  });
}

private getRequiredProjectDocumentTypes(project: Project) {
  const baseDocuments = [
    ProjectDocumentType.AADHAAR_CARD,
    ProjectDocumentType.PAN_CARD,
    ProjectDocumentType.ELECTRICITY_BILL,
    ProjectDocumentType.CLIENT_GPS_PHOTO,
    ProjectDocumentType.ROOF_GPS_PHOTO,
  ];

  const loanDocuments =
    project.projectType === ProjectType.LOAN
      ? [
          ProjectDocumentType.CANCEL_CHEQUE,
          ProjectDocumentType.BANK_DIARY,
          ProjectDocumentType.JAN_SAMARTH_DOCUMENT,
        ]
      : [];

  return [...baseDocuments, ...loanDocuments];
}

private async getUnifiedReminderStateMap(
  currentUser: any,
  reminderSource: string,
  referenceIds: number[],
) {
  const userId =
    currentUser?.id || currentUser?.userId;

  if (!userId || referenceIds.length === 0) {
    return {};
  }

  const states =
    await this.projectReminderUserStateRepository.find({
      where: {
        userId,
        reminderSource,
        referenceId: In(referenceIds),
      },
    });

  const map: Record<string, any> = {};

  for (const item of states) {
    map[String(item.referenceId)] = item;
  }

  return map;
}

async markUnifiedReminderAsRead(
  body: {
    reminderSource: string;
    reminderType: string;
    referenceId: number;
    projectId?: number;
  },
  currentUser: any,
) {
  const userId =
    currentUser?.id || currentUser?.userId;

  const userName =
    currentUser?.name ||
    currentUser?.email ||
    'Unknown User';

  if (!body?.referenceId) {
    throw new BadRequestException(
      'Reference ID is required',
    );
  }

  if (!body?.reminderSource) {
    throw new BadRequestException(
      'Reminder source is required',
    );
  }

  let state =
    await this.projectReminderUserStateRepository.findOne({
      where: {
        userId,
        reminderSource:
          body.reminderSource,
        referenceId:
          Number(body.referenceId),
      },
    });

  if (!state) {
    state =
      this.projectReminderUserStateRepository.create({
        userId,
        userName,

        reminderSource:
          body.reminderSource,

        reminderType:
          body.reminderType,

        referenceId:
          Number(body.referenceId),

        projectId:
  body.projectId
    ? Number(body.projectId)
    : undefined,

        status:
          ProjectReminderUserStateStatus.READ,

        readAt: new Date(),
      });
  } else {
    state.status =
      ProjectReminderUserStateStatus.READ;

    state.readAt = new Date();
  }

  return this.projectReminderUserStateRepository.save(
    state,
  );
}

async dismissUnifiedReminderForUser(
  body: {
    reminderSource: string;
    reminderType: string;
    referenceId: number;
    projectId?: number;
  },
  currentUser: any,
) {
  const userId =
    currentUser?.id || currentUser?.userId;

  const userName =
    currentUser?.name ||
    currentUser?.email ||
    'Unknown User';

  if (!body?.referenceId) {
    throw new BadRequestException(
      'Reference ID is required',
    );
  }

  if (!body?.reminderSource) {
    throw new BadRequestException(
      'Reminder source is required',
    );
  }

  let state =
    await this.projectReminderUserStateRepository.findOne({
      where: {
        userId,
        reminderSource:
          body.reminderSource,
        referenceId:
          Number(body.referenceId),
      },
    });

  if (!state) {
    state =
      this.projectReminderUserStateRepository.create({
        userId,
        userName,

        reminderSource:
          body.reminderSource,

        reminderType:
          body.reminderType,

        referenceId:
          Number(body.referenceId),

        projectId:
  body.projectId
    ? Number(body.projectId)
    : undefined,

        status:
          ProjectReminderUserStateStatus.DISMISSED,

        dismissedAt: new Date(),
      });
  } else {
    state.status =
      ProjectReminderUserStateStatus.DISMISSED;

    state.dismissedAt =
      new Date();
  }

  return this.projectReminderUserStateRepository.save(
    state,
  );
}

async getDocumentReminderList(currentUser: any) {
  const roles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : [];

  const userId =
    currentUser?.id || currentUser?.userId;

  const canSeeAll =
    roles.includes('OWNER') ||
    roles.includes('MARKETING_HEAD') ||
    roles.includes('PROJECT_MANAGER');

  const projectQuery =
    this.projectRepository
      .createQueryBuilder('project')
      .select([
        'project.id',
        'project.customerName',
        'project.customerPhone',
        'project.branchName',
        'project.projectOwnerId',
        'project.projectOwnerName',
        'project.projectSerial',
        'project.projectType',
        'project.status',
        'project.createdAt',
      ])
      .where('project.isHidden = false')
      .andWhere('project.status != :completedStatus', {
        completedStatus: ProjectStatus.COMPLETED,
      })
      .andWhere('project.status != :rejectedStatus', {
        rejectedStatus: ProjectStatus.REJECTED,
      })
      .orderBy('project.createdAt', 'ASC')
      .limit(50);

  if (!canSeeAll) {
    projectQuery.andWhere(
      'project.projectOwnerId = :userId',
      {
        userId,
      },
    );
  }

  const projects = await projectQuery.getMany();

  if (projects.length === 0) {
    return [];
  }

  const projectIds = projects.map((project) => project.id);

  const uploadedDocuments =
    await this.projectDocumentRepository.find({
      where: {
        projectId: In(projectIds),
      },
      select: {
        id: true,
        projectId: true,
        documentType: true,
      },
    });

  const uploadedMap: Record<string, Set<string>> = {};

  for (const doc of uploadedDocuments) {
    const key = String(doc.projectId);

    if (!uploadedMap[key]) {
      uploadedMap[key] = new Set<string>();
    }

    uploadedMap[key].add(String(doc.documentType));
  }

  const reminders: any[] = [];

  for (const project of projects) {
    const requiredDocumentTypes =
      this.getRequiredProjectDocumentTypes(project);

    const uploadedTypes =
      uploadedMap[String(project.id)] || new Set<string>();

    const missingDocuments =
      requiredDocumentTypes.filter(
        (documentType) =>
          !uploadedTypes.has(String(documentType)),
      );

    if (missingDocuments.length === 0) {
      continue;
    }

    reminders.push({
      id: Number(project.id),
      projectId: Number(project.id),
      reminderType: 'DOCUMENT_PENDING',
      missingDocumentTypes: missingDocuments,
      missingCount: missingDocuments.length,

      customerName: project.customerName || null,
      customerPhone: project.customerPhone || null,
      branchName: project.branchName || null,
      projectOwnerId: project.projectOwnerId
        ? Number(project.projectOwnerId)
        : null,
      projectOwnerName: project.projectOwnerName || null,
      projectSerial: project.projectSerial || null,
      projectType: project.projectType || null,
      projectStatus: project.status || null,
      createdAt: project.createdAt,
      userReminderStatus: 'UNREAD',
    });
  }

  const reminderIds = reminders.map((item) =>
    Number(item.projectId),
  );

  const stateMap =
    await this.getUnifiedReminderStateMap(
      currentUser,
      'DOCUMENT',
      reminderIds,
    );

  return reminders
    .map((item) => ({
      ...item,
      userReminderStatus:
        stateMap[String(item.projectId)]?.status ||
        'UNREAD',
    }))
    .filter((item) => {
      return (
        item.userReminderStatus !==
        ProjectReminderUserStateStatus.DISMISSED
      );
    });
}

async getUnreadDocumentReminderCount(currentUser: any) {
  const list =
    await this.getDocumentReminderList(currentUser);

  const unreadCount = list.filter((item: any) => {
    return item.userReminderStatus !== 'READ';
  }).length;

  return {
    unreadCount,
  };
}

async getLoanReminderList(currentUser: any) {
  const roles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : [];

  const userId =
    currentUser?.id || currentUser?.userId;

  const canSeeAll =
    roles.includes('OWNER') ||
    roles.includes('MARKETING_HEAD') ||
    roles.includes('PROJECT_MANAGER') ||
    roles.includes('LOAN_MANAGER');

  const qb =
    this.projectLoanDetailRepository
      .createQueryBuilder('loan')
      .leftJoin(
        Project,
        'project',
        'project.id = loan.projectId',
      )
      .select([
        'loan.id AS "id"',
        'loan.projectId AS "projectId"',
        'loan.loanType AS "loanType"',
        'loan.bankName AS "bankName"',
        'loan.applicationNumber AS "applicationNumber"',
        'loan.marginMoney AS "marginMoney"',
        'loan.sanctionAmount AS "sanctionAmount"',
        'loan.firstEmiDisbursementAmount AS "firstEmiDisbursementAmount"',
        'loan.firstEmiDisbursementDate AS "firstEmiDisbursementDate"',
        'loan.status AS "loanStatus"',
        'loan.remarks AS "remarks"',
        'loan.updatedAt AS "updatedAt"',

        'project.customerName AS "customerName"',
        'project.customerPhone AS "customerPhone"',
        'project.branchName AS "branchName"',
        'project.projectOwnerId AS "projectOwnerId"',
        'project.projectOwnerName AS "projectOwnerName"',
        'project.projectSerial AS "projectSerial"',
        'project.projectType AS "projectType"',
        'project.status AS "projectStatus"',
      ])
      .where('project.isHidden = false')
      .andWhere('project.projectType = :loanProjectType', {
        loanProjectType: ProjectType.LOAN,
      })
      .andWhere('project.status != :completedStatus', {
        completedStatus: ProjectStatus.COMPLETED,
      })
      .andWhere('project.status != :rejectedStatus', {
        rejectedStatus: ProjectStatus.REJECTED,
      })
      .andWhere('loan.status NOT IN (:...excludedLoanStatuses)', {
        excludedLoanStatuses: [
          ProjectLoanStatus.LOAN_DISBURSED,
          ProjectLoanStatus.FILE_REJECTED,
        ],
      })
      .orderBy('loan.updatedAt', 'ASC')
      .limit(50);

  if (!canSeeAll) {
    qb.andWhere('project.projectOwnerId = :userId', {
      userId,
    });
  }

  const rows = await qb.getRawMany();

  const reminderIds = rows.map((row) =>
    Number(row.id),
  );

  const stateMap =
    await this.getUnifiedReminderStateMap(
      currentUser,
      'LOAN',
      reminderIds,
    );

  return rows
    .map((row) => {
      let reminderType = 'LOAN_PROCESS_PENDING';

      if (
        row.loanStatus ===
        ProjectLoanStatus.DOCUMENT_PENDING
      ) {
        reminderType = 'LOAN_DOCUMENT_PENDING';
      } else if (
        row.loanStatus ===
          ProjectLoanStatus.IN_PRINCIPAL_GENERATED ||
        row.loanStatus ===
          ProjectLoanStatus.QUOTATION_SUBMITTED ||
        row.loanStatus ===
          ProjectLoanStatus.BANK_VISITED
      ) {
        reminderType = 'LOAN_DISBURSEMENT_PENDING';
      }

      return {
        id: Number(row.id),
        projectId: Number(row.projectId),

        reminderType,

        loanType: row.loanType || null,
        bankName: row.bankName || null,
        applicationNumber:
          row.applicationNumber || null,

        marginMoney: Number(row.marginMoney || 0),
        sanctionAmount: Number(
          row.sanctionAmount || 0,
        ),
        firstEmiDisbursementAmount: Number(
          row.firstEmiDisbursementAmount || 0,
        ),
        firstEmiDisbursementDate:
          row.firstEmiDisbursementDate || null,

        loanStatus: row.loanStatus || null,
        remarks: row.remarks || null,
        updatedAt: row.updatedAt,

        customerName: row.customerName || null,
        customerPhone: row.customerPhone || null,
        branchName: row.branchName || null,

        projectOwnerId: row.projectOwnerId
          ? Number(row.projectOwnerId)
          : null,

        projectOwnerName:
          row.projectOwnerName || null,

        projectSerial:
          row.projectSerial || null,

        projectType:
          row.projectType || null,

        projectStatus:
          row.projectStatus || null,

        userReminderStatus:
          stateMap[String(row.id)]?.status ||
          'UNREAD',
      };
    })
    .filter((item) => {
      return (
        item.userReminderStatus !==
        ProjectReminderUserStateStatus.DISMISSED
      );
    });
}

async getUnreadLoanReminderCount(currentUser: any) {
  const list =
    await this.getLoanReminderList(currentUser);

  const unreadCount = list.filter((item: any) => {
    return item.userReminderStatus !== 'READ';
  }).length;

  return {
    unreadCount,
  };
}

async getSubsidyReminderList(currentUser: any) {
  const roles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : [];

  const userId =
    currentUser?.id || currentUser?.userId;

  const canSeeAll =
    roles.includes('OWNER') ||
    roles.includes('MARKETING_HEAD') ||
    roles.includes('PROJECT_MANAGER') ||
    roles.includes('SUBSIDY_MANAGER');

  const qb =
    this.projectSubsidyDetailRepository
      .createQueryBuilder('subsidy')
      .leftJoin(
        Project,
        'project',
        'project.id = subsidy.projectId',
      )
      .select([
        'subsidy.id AS "id"',
        'subsidy.projectId AS "projectId"',
        'subsidy.status AS "subsidyStatus"',
        'subsidy.dcrCertificateReady AS "dcrCertificateReady"',
        'subsidy.panelWarrantyReceived AS "panelWarrantyReceived"',
        'subsidy.inverterWarrantyReceived AS "inverterWarrantyReceived"',
        'subsidy.vendorAgreementReady AS "vendorAgreementReady"',
        'subsidy.wcrReady AS "wcrReady"',
        'subsidy.portalSubmissionDate AS "portalSubmissionDate"',
        'subsidy.subsidyRequestedDate AS "subsidyRequestedDate"',
        'subsidy.subsidyDisbursedDate AS "subsidyDisbursedDate"',
        'subsidy.subsidyAmount AS "subsidyAmount"',
        'subsidy.remarks AS "remarks"',
        'subsidy.updatedAt AS "updatedAt"',

        'project.customerName AS "customerName"',
        'project.customerPhone AS "customerPhone"',
        'project.branchName AS "branchName"',
        'project.projectOwnerId AS "projectOwnerId"',
        'project.projectOwnerName AS "projectOwnerName"',
        'project.projectSerial AS "projectSerial"',
        'project.projectType AS "projectType"',
        'project.status AS "projectStatus"',
      ])
      .where('project.isHidden = false')
      .andWhere('project.status != :completedStatus', {
        completedStatus: ProjectStatus.COMPLETED,
      })
      .andWhere('project.status != :rejectedStatus', {
        rejectedStatus: ProjectStatus.REJECTED,
      })
      .andWhere('subsidy.status NOT IN (:...excludedSubsidyStatuses)', {
        excludedSubsidyStatuses: [
          ProjectSubsidyStatus.SUBSIDY_DISBURSED,
          ProjectSubsidyStatus.REJECTED,
        ],
      })
      .orderBy('subsidy.updatedAt', 'ASC')
      .limit(50);

  if (!canSeeAll) {
    qb.andWhere('project.projectOwnerId = :userId', {
      userId,
    });
  }

  const rows = await qb.getRawMany();

  const reminderIds = rows.map((row) =>
    Number(row.id),
  );

  const stateMap =
    await this.getUnifiedReminderStateMap(
      currentUser,
      'SUBSIDY',
      reminderIds,
    );

  return rows
    .map((row) => {
      let reminderType = 'SUBSIDY_PROCESS_PENDING';

      if (
        row.subsidyStatus ===
        ProjectSubsidyStatus.DOCUMENT_PENDING
      ) {
        reminderType = 'SUBSIDY_DOCUMENT_PENDING';
      } else if (
        row.subsidyStatus ===
          ProjectSubsidyStatus.SUBMISSION_DONE ||
        row.subsidyStatus ===
          ProjectSubsidyStatus.SUBSIDY_REQUESTED
      ) {
        reminderType = 'SUBSIDY_REQUEST_PENDING';
      }

      return {
        id: Number(row.id),
        projectId: Number(row.projectId),

        reminderType,

        subsidyStatus: row.subsidyStatus || null,

        dcrCertificateReady:
          row.dcrCertificateReady === true,

        panelWarrantyReceived:
          row.panelWarrantyReceived === true,

        inverterWarrantyReceived:
          row.inverterWarrantyReceived === true,

        vendorAgreementReady:
          row.vendorAgreementReady === true,

        wcrReady:
          row.wcrReady === true,

        portalSubmissionDate:
          row.portalSubmissionDate || null,

        subsidyRequestedDate:
          row.subsidyRequestedDate || null,

        subsidyDisbursedDate:
          row.subsidyDisbursedDate || null,

        subsidyAmount: Number(row.subsidyAmount || 0),

        remarks: row.remarks || null,

        updatedAt: row.updatedAt,

        customerName: row.customerName || null,
        customerPhone: row.customerPhone || null,
        branchName: row.branchName || null,

        projectOwnerId: row.projectOwnerId
          ? Number(row.projectOwnerId)
          : null,

        projectOwnerName:
          row.projectOwnerName || null,

        projectSerial:
          row.projectSerial || null,

        projectType:
          row.projectType || null,

        projectStatus:
          row.projectStatus || null,

        userReminderStatus:
          stateMap[String(row.id)]?.status ||
          'UNREAD',
      };
    })
    .filter((item) => {
      return (
        item.userReminderStatus !==
        ProjectReminderUserStateStatus.DISMISSED
      );
    });
}

async getUnreadSubsidyReminderCount(currentUser: any) {
  const list =
    await this.getSubsidyReminderList(currentUser);

  const unreadCount = list.filter((item: any) => {
    return item.userReminderStatus !== 'READ';
  }).length;

  return {
    unreadCount,
  };
}

async getElectricityReminderList(currentUser: any) {
  const roles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : [];

  const userId =
    currentUser?.id || currentUser?.userId;

  const canSeeAll =
    roles.includes('OWNER') ||
    roles.includes('MARKETING_HEAD') ||
    roles.includes('PROJECT_MANAGER') ||
    roles.includes('ELECTRICITY_MANAGER');

  const qb =
    this.projectElectricityDetailRepository
      .createQueryBuilder('electricity')
      .leftJoin(
        Project,
        'project',
        'project.id = electricity.projectId',
      )
      .select([
        'electricity.id AS "id"',
        'electricity.projectId AS "projectId"',
        'electricity.discomName AS "discomName"',
        'electricity.status AS "electricityStatus"',
        'electricity.fileSubmissionDate AS "fileSubmissionDate"',
        'electricity.siteVisitDate AS "siteVisitDate"',
        'electricity.demandDepositDate AS "demandDepositDate"',
        'electricity.demandDepositAmount AS "demandDepositAmount"',
        'electricity.meterTestingDate AS "meterTestingDate"',
        'electricity.netMeterInstallationDate AS "netMeterInstallationDate"',
        'electricity.remarks AS "remarks"',
        'electricity.updatedAt AS "updatedAt"',

        'project.customerName AS "customerName"',
        'project.customerPhone AS "customerPhone"',
        'project.branchName AS "branchName"',
        'project.projectOwnerId AS "projectOwnerId"',
        'project.projectOwnerName AS "projectOwnerName"',
        'project.projectSerial AS "projectSerial"',
        'project.projectType AS "projectType"',
        'project.status AS "projectStatus"',
      ])
      .where('project.isHidden = false')
      .andWhere('project.status != :completedStatus', {
        completedStatus: ProjectStatus.COMPLETED,
      })
      .andWhere('project.status != :rejectedStatus', {
        rejectedStatus: ProjectStatus.REJECTED,
      })
      .andWhere('electricity.status NOT IN (:...excludedElectricityStatuses)', {
        excludedElectricityStatuses: [
          ProjectElectricityStatus.CONNECTION_ACTIVE,
          ProjectElectricityStatus.REJECTED,
        ],
      })
      .orderBy('electricity.updatedAt', 'ASC')
      .limit(50);

  if (!canSeeAll) {
    qb.andWhere('project.projectOwnerId = :userId', {
      userId,
    });
  }

  const rows = await qb.getRawMany();

  const reminderIds = rows.map((row) =>
    Number(row.id),
  );

  const stateMap =
    await this.getUnifiedReminderStateMap(
      currentUser,
      'ELECTRICITY',
      reminderIds,
    );

  return rows
    .map((row) => {
      let reminderType = 'DISCOM_PROCESS_PENDING';

      if (
        row.electricityStatus ===
        ProjectElectricityStatus.DOCUMENT_PENDING
      ) {
        reminderType = 'ELECTRICITY_DOCUMENT_PENDING';
      } else if (
        row.electricityStatus ===
          ProjectElectricityStatus.METER_TESTING_DONE
      ) {
        reminderType = 'NET_METER_PENDING';
      } else if (
        row.electricityStatus ===
          ProjectElectricityStatus.NET_METER_INSTALLED
      ) {
        reminderType = 'CONNECTION_PENDING';
      }

      return {
        id: Number(row.id),
        projectId: Number(row.projectId),

        reminderType,

        discomName: row.discomName || null,
        electricityStatus:
          row.electricityStatus || null,

        fileSubmissionDate:
          row.fileSubmissionDate || null,

        siteVisitDate:
          row.siteVisitDate || null,

        demandDepositDate:
          row.demandDepositDate || null,

        demandDepositAmount: Number(
          row.demandDepositAmount || 0,
        ),

        meterTestingDate:
          row.meterTestingDate || null,

        netMeterInstallationDate:
          row.netMeterInstallationDate || null,

        remarks: row.remarks || null,
        updatedAt: row.updatedAt,

        customerName: row.customerName || null,
        customerPhone: row.customerPhone || null,
        branchName: row.branchName || null,

        projectOwnerId: row.projectOwnerId
          ? Number(row.projectOwnerId)
          : null,

        projectOwnerName:
          row.projectOwnerName || null,

        projectSerial:
          row.projectSerial || null,

        projectType:
          row.projectType || null,

        projectStatus:
          row.projectStatus || null,

        userReminderStatus:
          stateMap[String(row.id)]?.status ||
          'UNREAD',
      };
    })
    .filter((item) => {
      return (
        item.userReminderStatus !==
        ProjectReminderUserStateStatus.DISMISSED
      );
    });
}

async getUnreadElectricityReminderCount(currentUser: any) {
  const list =
    await this.getElectricityReminderList(currentUser);

  const unreadCount = list.filter((item: any) => {
    return item.userReminderStatus !== 'READ';
  }).length;

  return {
    unreadCount,
  };
}

async getFinalClosureReminderList(currentUser: any) {
  const roles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : [];

  const userId =
    currentUser?.id || currentUser?.userId;

  const canSeeAll =
    roles.includes('OWNER') ||
    roles.includes('MARKETING_HEAD') ||
    roles.includes('PROJECT_MANAGER');

  const todayIndia = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata',
  });

  const qb =
    this.projectRepository
      .createQueryBuilder('project')
      .select([
        'project.id AS "id"',
        'project.customerName AS "customerName"',
        'project.customerPhone AS "customerPhone"',
        'project.branchName AS "branchName"',
        'project.projectOwnerId AS "projectOwnerId"',
        'project.projectOwnerName AS "projectOwnerName"',
        'project.projectSerial AS "projectSerial"',
        'project.projectType AS "projectType"',
        'project.status AS "projectStatus"',
        'project.paymentStatus AS "paymentStatus"',
        'project.expectedCompletionDate AS "expectedCompletionDate"',
        'project.actualCompletionDate AS "actualCompletionDate"',
        'project.updatedAt AS "updatedAt"',
        'project.createdAt AS "createdAt"',
      ])
      .where('project.isHidden = false')
      .andWhere('project.status != :completedStatus', {
        completedStatus: ProjectStatus.COMPLETED,
      })
      .andWhere('project.status != :rejectedStatus', {
        rejectedStatus: ProjectStatus.REJECTED,
      })
      .andWhere(
        `(
          project.expectedCompletionDate IS NOT NULL
          OR project.status IN (:...closureStatuses)
          OR project.paymentStatus IS NOT NULL
        )`,
        {
          closureStatuses: [
            ProjectStatus.PROJECT_MANAGEMENT,
            ProjectStatus.SUBSIDY_PROCESS,
            ProjectStatus.ELECTRICITY_PROCESS,
          ],
        },
      )
      .orderBy('project.expectedCompletionDate', 'ASC')
      .addOrderBy('project.updatedAt', 'ASC')
      .limit(50);

  if (!canSeeAll) {
    qb.andWhere('project.projectOwnerId = :userId', {
      userId,
    });
  }

  const rows = await qb.getRawMany();

  const reminderIds = rows.map((row) =>
    Number(row.id),
  );

  const stateMap =
    await this.getUnifiedReminderStateMap(
      currentUser,
      'FINAL_CLOSURE',
      reminderIds,
    );

  return rows
    .map((row) => {
      const expectedDate = row.expectedCompletionDate
        ? String(row.expectedCompletionDate).split('T')[0]
        : null;

      let reminderType = 'FINAL_STATUS_UPDATE_PENDING';

      if (expectedDate && expectedDate < todayIndia) {
        reminderType = 'PROJECT_OVERDUE';
      } else if (
        row.paymentStatus &&
        String(row.paymentStatus).toUpperCase() !== 'PAID' &&
        String(row.paymentStatus).toUpperCase() !== 'COMPLETED'
      ) {
        reminderType = 'PAYMENT_CLOSURE_PENDING';
      } else if (
        [
          ProjectStatus.PROJECT_MANAGEMENT,
          ProjectStatus.SUBSIDY_PROCESS,
          ProjectStatus.ELECTRICITY_PROCESS,
        ].includes(row.projectStatus)
      ) {
        reminderType = 'PROJECT_COMPLETION_PENDING';
      }

      return {
        id: Number(row.id),
        projectId: Number(row.id),

        reminderType,

        customerName: row.customerName || null,
        customerPhone: row.customerPhone || null,
        branchName: row.branchName || null,

        projectOwnerId: row.projectOwnerId
          ? Number(row.projectOwnerId)
          : null,

        projectOwnerName:
          row.projectOwnerName || null,

        projectSerial:
          row.projectSerial || null,

        projectType:
          row.projectType || null,

        projectStatus:
          row.projectStatus || null,

        paymentStatus:
          row.paymentStatus || null,

        expectedCompletionDate:
          row.expectedCompletionDate || null,

        actualCompletionDate:
          row.actualCompletionDate || null,

        updatedAt: row.updatedAt,
        createdAt: row.createdAt,

        userReminderStatus:
          stateMap[String(row.id)]?.status ||
          'UNREAD',
      };
    })
    .filter((item) => {
      return (
        item.userReminderStatus !==
        ProjectReminderUserStateStatus.DISMISSED
      );
    });
}

async getUnreadFinalClosureReminderCount(currentUser: any) {
  const list =
    await this.getFinalClosureReminderList(currentUser);

  const unreadCount = list.filter((item: any) => {
    return item.userReminderStatus !== 'READ';
  }).length;

  return {
    unreadCount,
  };
}

async getUnreadPurchaseReminderCount(
  currentUser: any,
) {
  const list =
    await this.getPurchaseReminderList(
      currentUser,
    );

  return {
    unreadCount: list.length,
  };
}

async getUnreadApprovalReminderCount(currentUser: any) {
  const result = await this.getApprovalReminderList(currentUser, {
  page: 1,
  limit: 100,
});

const list = Array.isArray(result)
  ? result
  : result.data || [];

return {
  unreadCount: list.length,
};
}

async getUnreadPaymentReminderCount(currentUser: any) {
  const list = await this.getPaymentReminderList(currentUser);

  const unreadCount = list.filter((item: any) => {
    return item.userReminderStatus !== 'READ';
  }).length;

  return {
    unreadCount,
  };
}

async markPaymentReminderAsRead(
  installmentId: number,
  currentUser: any,
) {
  const userId = currentUser?.id || currentUser?.userId;
  const userName =
    currentUser?.name || currentUser?.email || 'Unknown User';

  const installment =
    await this.projectPaymentInstallmentRepository.findOne({
      where: { id: installmentId },
    });

  if (!installment) {
    throw new NotFoundException('Payment installment not found');
  }

  let state =
    await this.projectPaymentReminderUserStateRepository.findOne({
      where: {
        installmentId,
        userId,
      },
    });

  if (!state) {
    state =
      this.projectPaymentReminderUserStateRepository.create({
        installmentId,
        projectId: installment.projectId,
        userId,
        userName,
        status: ProjectPaymentReminderUserStateStatus.READ,
        readAt: new Date(),
      });
  } else {
    state.status = ProjectPaymentReminderUserStateStatus.READ;
    state.readAt = new Date();
  }

  return this.projectPaymentReminderUserStateRepository.save(state);
}

async dismissPaymentReminderForUser(
  installmentId: number,
  currentUser: any,
) {
  const userId = currentUser?.id || currentUser?.userId;
  const userName =
    currentUser?.name || currentUser?.email || 'Unknown User';

  const installment =
    await this.projectPaymentInstallmentRepository.findOne({
      where: { id: installmentId },
    });

  if (!installment) {
    throw new NotFoundException('Payment installment not found');
  }

  let state =
    await this.projectPaymentReminderUserStateRepository.findOne({
      where: {
        installmentId,
        userId,
      },
    });

  if (!state) {
    state =
      this.projectPaymentReminderUserStateRepository.create({
        installmentId,
        projectId: installment.projectId,
        userId,
        userName,
        status: ProjectPaymentReminderUserStateStatus.DISMISSED,
        dismissedAt: new Date(),
      });
  } else {
    state.status = ProjectPaymentReminderUserStateStatus.DISMISSED;
    state.dismissedAt = new Date();
  }

  return this.projectPaymentReminderUserStateRepository.save(state);
}

async hidePaymentInstallment(
  installmentId: number,
  body: any,
  currentUser: any,
) {
  const roles = currentUser?.roles || [];

  const canHide =
  roles.includes('OWNER') ||
  roles.includes('MARKETING_HEAD') ||
  roles.includes('PROJECT_MANAGER') ||
  roles.includes('PAYMENT_MANAGER') ||
  roles.includes('ACCOUNT_MANAGER');

  if (!canHide) {
    throw new ForbiddenException(
      'You are not allowed to hide payment entries',
    );
  }

  const installment =
    await this.projectPaymentInstallmentRepository.findOne({
      where: { id: installmentId },
    });

  if (!installment) {
    throw new NotFoundException('Payment installment not found');
  }

  installment.isHidden = true;
  installment.hiddenAt = new Date();
  installment.hiddenBy = currentUser?.id || currentUser?.userId || null;
  installment.hiddenByName = currentUser?.name || currentUser?.email || '';
  installment.hiddenReason = body?.reason || 'Hidden by user';

  return this.projectPaymentInstallmentRepository.save(installment);
}

async hideProject(id: number, body: any, user: any) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];

  const canHide =
    roles.includes('OWNER') ||
    roles.includes('MARKETING_HEAD') ||
    roles.includes('PROJECT_MANAGER');

  if (!canHide) {
    throw new ForbiddenException('You are not allowed to hide projects');
  }

  const project = await this.projectRepository.findOne({
    where: { id },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  project.isHidden = true;
  project.hiddenAt = new Date();
  project.hiddenBy = user?.id || user?.userId || null;
  project.hiddenByName = user?.name || user?.email || '';
  project.hiddenReason = body?.reason || 'Hidden by user';

  return this.projectRepository.save(project);
}

async createExecutionActivity(
  data: Partial<ProjectExecutionActivity>,
  user: any,
) {
  if (!data.projectId) {
    throw new BadRequestException(
      'Project ID is required',
    );
  }

  if (!data.activityType) {
    throw new BadRequestException(
      'Activity type is required',
    );
  }

  let inspectionDeadline: Date | null = null;

  if (
    data.activityType ===
      ProjectExecutionActivityType.STRUCTURE_INSPECTION ||
    data.activityType ===
      ProjectExecutionActivityType.PILLAR_INSPECTION
  ) {
    inspectionDeadline = new Date();

    inspectionDeadline.setDate(
      inspectionDeadline.getDate() + 1,
    );
  }

  if (
    data.activityType ===
    ProjectExecutionActivityType.GENERATION_INSPECTION
  ) {
    inspectionDeadline = new Date();

    inspectionDeadline.setDate(
      inspectionDeadline.getDate() + 3,
    );
  }

  const activity =
    this.projectExecutionActivityRepository.create({
      projectId: Number(data.projectId),

      activityType:
        data.activityType as ProjectExecutionActivityType,

      status:
        (data.status as ProjectExecutionActivityStatus) ||
        ProjectExecutionActivityStatus.PENDING,

      scheduledDate: data.scheduledDate
        ? new Date(data.scheduledDate)
        : null,

      completedDate: data.completedDate
        ? new Date(data.completedDate)
        : null,

      inspectionDeadline,

      proofRequired:
        data.proofRequired === true,

      remarks: data.remarks || '',

      assignedTo: data.assignedTo || null,
      assignedToName:
        data.assignedToName || '',

      createdBy: user?.id || null,
      createdByName: user?.name || '',
    } as Partial<ProjectExecutionActivity>);

  return this.projectExecutionActivityRepository.save(
    activity,
  );
}

async getProjectExecutionActivities(
  projectId: number,
) {
  await this.refreshExecutionOverdueStatuses();
  return this.projectExecutionActivityRepository.find({
    where: {
      projectId,
    },
    order: {
      createdAt: 'DESC',
    },
  });
}

async updateExecutionActivity(
  id: number,
  data: Partial<ProjectExecutionActivity>,
  user: any,
) {
  const activity =
    await this.projectExecutionActivityRepository.findOne({
      where: { id },
    });

  if (!activity) {
    throw new NotFoundException(
      'Execution activity not found',
    );
  }

  const inspectionTypes = [
  ProjectExecutionActivityType.STRUCTURE_INSPECTION,
  ProjectExecutionActivityType.PILLAR_INSPECTION,
  ProjectExecutionActivityType.GENERATION_INSPECTION,
];

const targetStatus =
  data.status as ProjectExecutionActivityStatus;

if (
  inspectionTypes.includes(
    activity.activityType as ProjectExecutionActivityType,
  ) &&
  targetStatus ===
    ProjectExecutionActivityStatus.COMPLETED
) {
  const proofCount =
    await this.projectExecutionProofRepository.count({
      where: {
        activityId: activity.id,
      },
    });

  if (proofCount === 0) {
    throw new BadRequestException(
      'GPS/site proof photos are required before completing inspection',
    );
  }
}

  Object.assign(activity, {
    ...data,
    updatedBy: user?.id || null,
    updatedByName: user?.name || '',
  });

  return this.projectExecutionActivityRepository.save(
    activity,
  );
}

async uploadExecutionProof(
  data: {
    activityId: number;
    projectId: number;
    fileUrl: string;
    latitude?: string;
    longitude?: string;
  },
  user: any,
) {
  if (!data.activityId) {
    throw new BadRequestException(
      'Activity ID is required',
    );
  }

  if (!data.projectId) {
    throw new BadRequestException(
      'Project ID is required',
    );
  }

  if (!data.fileUrl) {
    throw new BadRequestException(
      'File URL is required',
    );
  }

  const proof =
    this.projectExecutionProofRepository.create({
      activityId: Number(data.activityId),
      projectId: Number(data.projectId),
      fileUrl: data.fileUrl,
      latitude: data.latitude || '',
      longitude: data.longitude || '',
      uploadedBy: user?.id || null,
      uploadedByName: user?.name || '',
    });

  return this.projectExecutionProofRepository.save(
    proof,
  );
}

async uploadExecutionProofFiles(
  files: any[],
  body: any,
  user: any,
) {
  if (!files || files.length === 0) {
    throw new BadRequestException('Proof photos are required');
  }

  if (!body.activityId) {
    throw new BadRequestException('Activity ID is required');
  }

  if (!body.projectId) {
    throw new BadRequestException('Project ID is required');
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket =
    process.env.SUPABASE_PROJECT_DOCUMENTS_BUCKET ||
    'project-documents';

  if (!supabaseUrl || !serviceKey) {
    throw new BadRequestException('Supabase storage is not configured');
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const uploadedProofs: ProjectExecutionProof[] = [];

  for (const file of files) {
    const mimeType = String(file.mimetype || '');

    if (!mimeType.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const extension =
      file.originalname.split('.').pop() || 'jpg';

    const filePath = `execution-proofs/project-${body.projectId}/activity-${body.activityId}/${Date.now()}-${randomUUID()}.${extension}`;

    const uploadResult = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: mimeType,
      });

    if (uploadResult.error) {
      throw new BadRequestException(uploadResult.error.message);
    }

    const fileUrl = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath).data.publicUrl;

    const proof =
      this.projectExecutionProofRepository.create({
        activityId: Number(body.activityId),
        projectId: Number(body.projectId),
        fileUrl,
        latitude: body.latitude || '',
        longitude: body.longitude || '',
        uploadedBy: user?.id || null,
        uploadedByName: user?.name || user?.email || '',
      });

    uploadedProofs.push(
      await this.projectExecutionProofRepository.save(proof),
    );
  }

  return {
    message: 'Execution proof uploaded successfully',
    data: uploadedProofs,
  };
}

async getExecutionActivityProofs(
  activityId: number,
) {
  return this.projectExecutionProofRepository.find({
    where: {
      activityId,
    },
    order: {
      createdAt: 'DESC',
    },
  });
}

async refreshExecutionOverdueStatuses() {
  const now = new Date();

  const overdueActivities =
    await this.projectExecutionActivityRepository
      .createQueryBuilder('activity')
      .where('activity.inspectionDeadline IS NOT NULL')
      .andWhere('activity.inspectionDeadline < :now', {
        now,
      })
      .andWhere('activity.status != :completed', {
        completed:
          ProjectExecutionActivityStatus.COMPLETED,
      })
      .andWhere('activity.status != :cancelled', {
        cancelled:
          ProjectExecutionActivityStatus.CANCELLED,
      })
      .getMany();

  for (const activity of overdueActivities) {
    activity.status =
      ProjectExecutionActivityStatus.OVERDUE;

    await this.projectExecutionActivityRepository.save(
      activity,
    );
  }
}

async completeProject(
  id: number,
  body: any,
  currentUser: any,
) {
  const roles = currentUser?.roles || [];

  const canComplete =
    roles.includes('OWNER') ||
    roles.includes('MARKETING_HEAD') ||
    roles.includes('PROJECT_MANAGER');

  if (!canComplete) {
    throw new ForbiddenException(
      'You are not allowed to complete projects',
    );
  }

  const project = await this.projectRepository.findOne({
    where: { id },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  project.status = ProjectStatus.COMPLETED;

  project.actualCompletionDate = body?.actualCompletionDate
    ? new Date(body.actualCompletionDate)
    : new Date();

  const completionNote = body?.completionNote?.trim();

  if (completionNote) {
    project.remarks = project.remarks
      ? `${project.remarks}\n\n[PROJECT COMPLETED]\n${completionNote}`
      : `[PROJECT COMPLETED]\n${completionNote}`;
  }

  return this.projectRepository.save(project);
}

async getExecutionCalendarActivities(
  user?: any,
  filters?: {
    page?: number;
    limit?: number;
    date?: string;
    status?: string;
    branch?: string;
    customer?: string;
    owner?: string;
    overdueOnly?: string;
  },
) {
  await this.refreshExecutionOverdueStatuses();

  const page =
    Number(filters?.page) > 0
      ? Number(filters?.page)
      : 1;

  const limit =
    Number(filters?.limit) > 0
      ? Math.min(Number(filters?.limit), 100)
      : 20;

  const skip = (page - 1) * limit;

  const currentUserId = Number(user?.id || user?.sub);

  const roles = Array.isArray(user?.roles)
    ? user.roles
    : [];

  const canViewAll =
    roles.includes('OWNER') ||
    roles.includes('MARKETING_HEAD') ||
    roles.includes('PROJECT_MANAGER');

  const query =
    this.projectExecutionActivityRepository
      .createQueryBuilder('activity')
      .innerJoin(
        'project',
        'project',
        'project.id = activity.projectId',
      );

      query.where('project.isHidden = false');

  if (!canViewAll) {
    query.andWhere(
      'project.projectOwnerId = :currentUserId',
      { currentUserId },
    );
  }

  if (filters?.date) {
    query.andWhere(
      `DATE(activity.scheduledDate) = :date`,
      { date: filters.date },
    );
  }

  if (filters?.status) {
    query.andWhere(
      'activity.status = :status',
      { status: filters.status },
    );
  }

  if (filters?.branch) {
    query.andWhere(
      'LOWER(project.branchName) LIKE :branch',
      {
        branch: `%${filters.branch.toLowerCase()}%`,
      },
    );
  }

  if (filters?.customer) {
    query.andWhere(
      'LOWER(project.customerName) LIKE :customer',
      {
        customer: `%${filters.customer.toLowerCase()}%`,
      },
    );
  }

  if (filters?.owner) {
    query.andWhere(
      'LOWER(project.projectOwnerName) LIKE :owner',
      {
        owner: `%${filters.owner.toLowerCase()}%`,
      },
    );
  }

  if (filters?.overdueOnly === 'true') {
    query.andWhere('activity.status = :overdue', {
      overdue: ProjectExecutionActivityStatus.OVERDUE,
    });
  }

  query
    .orderBy('activity.scheduledDate', 'ASC')
    .addOrderBy('activity.createdAt', 'DESC')
    .skip(skip)
    .take(limit);

  const [activities, total] =
    await query.getManyAndCount();

  const projectIds = [
    ...new Set(
      activities.map((item) => item.projectId),
    ),
  ];

  const projects =
    projectIds.length > 0
      ? await this.projectRepository.findByIds(
          projectIds,
        )
      : [];

  const data = activities.map((activity) => {
    const project = projects.find(
      (item) => item.id === activity.projectId,
    );

    return {
      ...activity,
      project: project
        ? {
            customerName: project.customerName || '',
            branchName: project.branchName || '',
            projectOwnerName:
              project.projectOwnerName || '',
          }
        : null,
    };
  });

  return {
    data,
    total,
    page,
    limit,
    totalPages:
      Math.ceil(total / limit) || 1,
  };
}

async getExecutionReminderSummary(currentUser: any) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextSevenDays = new Date(today);
  nextSevenDays.setDate(nextSevenDays.getDate() + 7);

  const reminderWindowEnd = new Date(today);
  reminderWindowEnd.setDate(reminderWindowEnd.getDate() + 8);

  const roles = currentUser?.roles || [];
  const userId = currentUser?.id || currentUser?.userId;

  const canSeeAll =
    roles.includes('OWNER') ||
    roles.includes('MARKETING_HEAD') ||
    roles.includes('PROJECT_MANAGER');

  const activityQuery = this.projectExecutionActivityRepository
  .createQueryBuilder('activity')
  .innerJoin(Project, 'project', 'project.id = activity.projectId')
    .leftJoin(
      ProjectExecutionReminder,
      'globalReminder',
      'globalReminder.activityId = activity.id AND globalReminder.status = :globalDismissedStatus',
      {
        globalDismissedStatus: ProjectExecutionReminderStatus.DISMISSED,
      },
    )
    .leftJoin(
      ProjectExecutionReminderUserState,
      'userState',
      'userState.activityId = activity.id AND userState.userId = :userId AND userState.status = :userDismissedStatus',
      {
        userId,
        userDismissedStatus:
          ProjectExecutionReminderUserStateStatus.DISMISSED,
      },
    )
    .select([
      'activity.id AS "id"',
      'activity.scheduledDate AS "scheduledDate"',
      'activity.inspectionDeadline AS "inspectionDeadline"',
    ])
    .where('activity.status NOT IN (:...excludedStatuses)', {
      excludedStatuses: [
        ProjectExecutionActivityStatus.COMPLETED,
        ProjectExecutionActivityStatus.CANCELLED,
      ],
    })

    .andWhere('project.isHidden = false')
    .andWhere(
      'COALESCE(activity.inspectionDeadline, activity.scheduledDate) IS NOT NULL',
    )
    .andWhere(
      'COALESCE(activity.inspectionDeadline, activity.scheduledDate) < :reminderWindowEnd',
      {
        reminderWindowEnd,
      },
    )
    .andWhere('globalReminder.id IS NULL')
    .andWhere('userState.id IS NULL');

  if (!canSeeAll) {
    activityQuery.andWhere(
      '(activity.assignedTo = :userId OR activity.createdBy = :userId)',
      { userId },
    );
  }

  const rows = await activityQuery.getRawMany();

  const overdueActivities = rows.filter((activity) => {
    const dateToCheck = activity.inspectionDeadline || activity.scheduledDate;
    if (!dateToCheck) return false;

    const checkDate = new Date(dateToCheck);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate < today;
  });

  const todaysExecutionWork = rows.filter((activity) => {
    const dateToCheck = activity.scheduledDate || activity.inspectionDeadline;
    if (!dateToCheck) return false;

    const checkDate = new Date(dateToCheck);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate.getTime() === today.getTime();
  });

  const upcomingDeadlines = rows.filter((activity) => {
    const dateToCheck = activity.inspectionDeadline || activity.scheduledDate;
    if (!dateToCheck) return false;

    const checkDate = new Date(dateToCheck);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate >= tomorrow && checkDate <= nextSevenDays;
  });

  return {
    overdueInspections: overdueActivities.length,
    todaysExecutionWork: todaysExecutionWork.length,
    upcomingDeadlines: upcomingDeadlines.length,
    totalPendingReminders:
      overdueActivities.length +
      todaysExecutionWork.length +
      upcomingDeadlines.length,
  };
}

async getExecutionReminderList(currentUser: any) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextSevenDays = new Date(today);
  nextSevenDays.setDate(nextSevenDays.getDate() + 7);

  const reminderWindowEnd = new Date(today);
  reminderWindowEnd.setDate(reminderWindowEnd.getDate() + 8);

  const roles = currentUser?.roles || [];
  const userId = currentUser?.id || currentUser?.userId;

  const canSeeAll =
    roles.includes('OWNER') ||
    roles.includes('MARKETING_HEAD') ||
    roles.includes('PROJECT_MANAGER');

  const activityQuery = this.projectExecutionActivityRepository
    .createQueryBuilder('activity')
    .leftJoin(Project, 'project', 'project.id = activity.projectId')
    .leftJoin(
      ProjectExecutionReminder,
      'globalReminder',
      'globalReminder.activityId = activity.id AND globalReminder.status = :globalDismissedStatus',
      {
        globalDismissedStatus: ProjectExecutionReminderStatus.DISMISSED,
      },
    )
    .leftJoin(
      ProjectExecutionReminderUserState,
      'userState',
      'userState.activityId = activity.id AND userState.userId = :userId',
      {
        userId,
      },
    )
    .select([
      'activity.id AS "id"',
      'activity.projectId AS "projectId"',
      'activity.activityType AS "activityType"',
      'activity.status AS "status"',
      'activity.scheduledDate AS "scheduledDate"',
      'activity.inspectionDeadline AS "inspectionDeadline"',
      'activity.assignedTo AS "assignedTo"',
      'activity.assignedToName AS "assignedToName"',
      'activity.remarks AS "remarks"',
      'project.customerName AS "customerName"',
      'project.customerPhone AS "customerPhone"',
      'project.city AS "city"',
      'project.zone AS "zone"',
      'project.branchName AS "branchName"',
      'project.projectOwnerId AS "projectOwnerId"',
      'project.projectOwnerName AS "projectOwnerName"',
      'project.status AS "projectStatus"',
      'project.projectSerial AS "projectSerial"',
      'userState.status AS "userReminderStatus"',
      'userState.readAt AS "userReadAt"',
    ])
    .where('activity.status NOT IN (:...excludedStatuses)', {
      excludedStatuses: [
        ProjectExecutionActivityStatus.COMPLETED,
        ProjectExecutionActivityStatus.CANCELLED,
      ],
    })
    .andWhere('project.isHidden = false')
    .andWhere(
      'COALESCE(activity.inspectionDeadline, activity.scheduledDate) IS NOT NULL',
    )
    .andWhere(
      'COALESCE(activity.inspectionDeadline, activity.scheduledDate) < :reminderWindowEnd',
      {
        reminderWindowEnd,
      },
    )
    .andWhere('globalReminder.id IS NULL')
    .andWhere(
      '(userState.id IS NULL OR userState.status != :userDismissedStatus)',
      {
        userDismissedStatus: ProjectExecutionReminderUserStateStatus.DISMISSED,
      },
    )
    .orderBy('COALESCE(activity.inspectionDeadline, activity.scheduledDate)', 'ASC');

  if (!canSeeAll) {
    activityQuery.andWhere(
      '(activity.assignedTo = :userId OR activity.createdBy = :userId)',
      { userId },
    );
  }

  const rows = await activityQuery.getRawMany();

  return rows
    .map((activity) => {
      const dateToCheck = activity.inspectionDeadline || activity.scheduledDate;
      if (!dateToCheck) return null;

      const checkDate = new Date(dateToCheck);
      checkDate.setHours(0, 0, 0, 0);

      let reminderType:
        | 'OVERDUE_INSPECTION'
        | 'TODAY_WORK'
        | 'UPCOMING_DEADLINE'
        | null = null;

      if (checkDate < today) {
        reminderType = 'OVERDUE_INSPECTION';
      } else if (checkDate.getTime() === today.getTime()) {
        reminderType = 'TODAY_WORK';
      } else if (checkDate >= tomorrow && checkDate <= nextSevenDays) {
        reminderType = 'UPCOMING_DEADLINE';
      }

      if (!reminderType) return null;

      return {
        id: Number(activity.id),
        projectId: Number(activity.projectId),
        activityType: activity.activityType,
        status: activity.status,
        reminderType,
        scheduledDate: activity.scheduledDate,
        inspectionDeadline: activity.inspectionDeadline,
        assignedTo: activity.assignedTo ? Number(activity.assignedTo) : null,
        assignedToName: activity.assignedToName || null,
        remarks: activity.remarks || null,

        customerName: activity.customerName || null,
        customerPhone: activity.customerPhone || null,
        city: activity.city || null,
        zone: activity.zone || null,
        branchName: activity.branchName || null,
        projectOwnerId: activity.projectOwnerId
          ? Number(activity.projectOwnerId)
          : null,
        projectOwnerName: activity.projectOwnerName || null,
        projectStatus: activity.projectStatus || null,
        projectSerial: activity.projectSerial || null,

        userReminderStatus: activity.userReminderStatus || 'UNREAD',
        userReadAt: activity.userReadAt || null,
      };
    })
    .filter(Boolean);
}

async dismissExecutionReminder(activityId: number, currentUser: any) {
  const userId = currentUser?.id || currentUser?.userId;
  const userName = currentUser?.name || currentUser?.email || 'Unknown User';

  const activity = await this.projectExecutionActivityRepository.findOne({
    where: { id: activityId },
  });

  if (!activity) {
    throw new NotFoundException('Execution activity not found');
  }

  const existingReminder =
    await this.projectExecutionReminderRepository.findOne({
      where: {
        activityId: activity.id,
      },
    });

  if (existingReminder) {
    existingReminder.status = ProjectExecutionReminderStatus.DISMISSED;
    existingReminder.dismissedAt = new Date();
    existingReminder.createdBy = userId;
    existingReminder.createdByName = userName;

    return this.projectExecutionReminderRepository.save(existingReminder);
  }

  const reminder = this.projectExecutionReminderRepository.create({
    projectId: activity.projectId,
    activityId: activity.id,
    type: ProjectExecutionReminderType.OVERDUE_INSPECTION,
    status: ProjectExecutionReminderStatus.DISMISSED,
    reminderDate: new Date().toISOString().slice(0, 10),
    dismissedAt: new Date(),
    message: `Reminder dismissed for ${activity.activityType}`,
    createdBy: userId,
    createdByName: userName,
  });

  return this.projectExecutionReminderRepository.save(reminder);
}

async getUnreadReminderCount(currentUser: any) {
  const reminderList = await this.getExecutionReminderList(currentUser);

  const userId = currentUser?.id || currentUser?.userId;

  const userStates =
    await this.projectExecutionReminderUserStateRepository.find({
      where: {
        userId,
      },
    });

  const readOrDismissedActivityIds = new Set(
    userStates
      .filter(
        (item) =>
          item.status === ProjectExecutionReminderUserStateStatus.READ ||
          item.status === ProjectExecutionReminderUserStateStatus.DISMISSED,
      )
      .map((item) => item.activityId),
  );

  const unreadCount = reminderList.filter((item: any) => {
    return !readOrDismissedActivityIds.has(Number(item.id));
  }).length;

  return {
    unreadCount,
  };
}

async markReminderAsRead(activityId: number, currentUser: any) {
  const userId = currentUser?.id || currentUser?.userId;
  const userName =
    currentUser?.name || currentUser?.email || 'Unknown User';

  const activity =
    await this.projectExecutionActivityRepository.findOne({
      where: { id: activityId },
    });

  if (!activity) {
    throw new NotFoundException('Execution activity not found');
  }

  let state =
    await this.projectExecutionReminderUserStateRepository.findOne({
      where: {
        activityId,
        userId,
      },
    });

  if (!state) {
    state =
      this.projectExecutionReminderUserStateRepository.create({
        activityId,
        projectId: activity.projectId,
        userId,
        userName,
        status:
          ProjectExecutionReminderUserStateStatus.READ,
        readAt: new Date(),
      });
  } else {
    state.status =
      ProjectExecutionReminderUserStateStatus.READ;
    state.readAt = new Date();
  }

  return this.projectExecutionReminderUserStateRepository.save(
    state,
  );
}

async dismissReminderForUser(
  activityId: number,
  currentUser: any,
) {
  const userId = currentUser?.id || currentUser?.userId;
  const userName =
    currentUser?.name || currentUser?.email || 'Unknown User';

  const activity =
    await this.projectExecutionActivityRepository.findOne({
      where: { id: activityId },
    });

  if (!activity) {
    throw new NotFoundException('Execution activity not found');
  }

  let state =
    await this.projectExecutionReminderUserStateRepository.findOne({
      where: {
        activityId,
        userId,
      },
    });

  if (!state) {
    state =
      this.projectExecutionReminderUserStateRepository.create({
        activityId,
        projectId: activity.projectId,
        userId,
        userName,
        status:
          ProjectExecutionReminderUserStateStatus.DISMISSED,
        dismissedAt: new Date(),
      });
  } else {
    state.status =
      ProjectExecutionReminderUserStateStatus.DISMISSED;
    state.dismissedAt = new Date();
  }

  return this.projectExecutionReminderUserStateRepository.save(
    state,
  );
}

  async ownerApproval(
  id: number,
  body: {
    status?: ProjectApprovalStatus;
    approvalStatus?: ProjectApprovalStatus;
    note?: string;
    approvedBy?: number;
  },
) {
  const project = await this.projectRepository.findOne({
    where: { id },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const approvalStatus =
    body.approvalStatus || body.status;

  if (!approvalStatus) {
    throw new BadRequestException('Approval status is required');
  }

  project.ownerApprovalStatus = approvalStatus;

  project.ownerApprovalNote =
    body.note || '';

  project.ownerApprovedBy =
    body.approvedBy || 0;

  project.ownerApprovedAt = new Date();

  if (approvalStatus === ProjectApprovalStatus.REJECTED) {
    project.status = ProjectStatus.REJECTED;
  }

  if (approvalStatus === ProjectApprovalStatus.APPROVED) {
    if (project.projectType === ProjectType.LOAN) {
      project.status = ProjectStatus.LOAN_PROCESS;
    } else {
      project.status =
        ProjectStatus.PROJECT_MANAGEMENT;
    }
  }

  return this.projectRepository.save(project);
}

  async createBranch(data: any) {
  if (!data?.name?.trim()) {
    throw new BadRequestException(
      'Branch name is required',
    );
  }

  const branch =
    this.projectBranchRepository.create({
      name: data.name.trim(),
      code: data.code || '',
      city: data.city || '',
      address: data.address || '',
      isActive: data.isActive !== false,
    });

  return this.projectBranchRepository.save(
    branch,
  );
}

async getBranches() {
  return this.projectBranchRepository.find({
    where: {
      isActive: true,
    },
    order: {
      createdAt: 'DESC',
    },
  });
}

async deleteBranch(id: number) {
  const branch =
    await this.projectBranchRepository.findOne(
      {
        where: { id },
      },
    );

  if (!branch) {
    throw new NotFoundException(
      'Branch not found',
    );
  }

  await this.projectBranchRepository.delete(
    id,
  );

  return {
    message:
      'Branch deleted successfully',
  };
}

async getPurchaseOrders(filters: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  branch?: string;
  owner?: string;
}) {
  const page =
    Number(filters.page) > 0
      ? Number(filters.page)
      : 1;

  const limit =
    Number(filters.limit) > 0
      ? Math.min(Number(filters.limit), 100)
      : 20;

  const skip = (page - 1) * limit;

  const search = String(filters.search || '')
    .trim()
    .toLowerCase();

  const status = String(filters.status || '')
    .trim();

  const branch = String(filters.branch || '')
    .trim()
    .toLowerCase();

    const owner = String(filters.owner || '')
  .trim();

  const allPendingItems =
    await this.projectMaterialRequestItemRepository.find({
      where: {
        pendingQuantity: MoreThan(0),
      },
      order: {
        createdAt: 'DESC',
      },
    });

  const projectIds = Array.from(
    new Set(
      allPendingItems
        .map((item) => Number(item.projectId))
        .filter(Boolean),
    ),
  );

  const projects = projectIds.length
  ? await this.projectRepository.find({
      where: {
        id: In(projectIds),
        isHidden: false,
      } as any,
    })
  : [];

  const projectMap = new Map(
    projects.map((project) => [
      Number(project.id),
      project,
    ]),
  );

  const enrichedItems = allPendingItems
  .map((item) => {
    const project = projectMap.get(
      Number(item.projectId),
    );

    return {
  ...item,
  projectCustomerName:
    project?.customerName || '',
  projectBranchName:
    project?.branchName || '',
  projectCity:
    project?.city || '',
  projectZone:
    project?.zone || '',
  projectOwnerId:
    project?.projectOwnerId || null,
  projectOwnerName:
    project?.projectOwnerName || '',
  projectOwnerRole:
    project?.projectOwnerRole || '',
};
  })
  .filter((item: any) => item.projectId && projectMap.has(Number(item.projectId)));

  const filteredItems = enrichedItems.filter((item: any) => {
    const matchesSearch = search
      ? `${item.projectId} ${item.projectCustomerName || ''} ${item.materialName || ''}`
          .toLowerCase()
          .includes(search)
      : true;

    const matchesStatus = status
      ? String(item.purchaseStatus || '') === status
      : true;

    const matchesBranch = branch
      ? String(item.projectBranchName || '')
          .toLowerCase()
          .includes(branch)
      : true;

      const matchesOwner = owner
  ? String(item.projectOwnerId || '') === owner
  : true;

    return (
  matchesSearch &&
  matchesStatus &&
  matchesBranch &&
  matchesOwner
);
  });

  const total = filteredItems.length;

  const paginatedItems = filteredItems.slice(
    skip,
    skip + limit,
  );

  const totalPendingItems = filteredItems.length;

  const totalPendingQuantity =
    filteredItems.reduce(
      (sum: number, item: any) =>
        sum + Number(item.pendingQuantity || 0),
      0,
    );

  const totalPendingAmount =
    filteredItems.reduce(
      (sum: number, item: any) =>
        sum +
        Number(item.pendingQuantity || 0) *
          Number(item.rate || 0),
      0,
    );

  const partiallyPurchasedCount =
    filteredItems.filter(
      (item: any) =>
        item.purchaseStatus ===
        'PARTIALLY_PURCHASED',
    ).length;

  return {
    data: paginatedItems,
    summary: {
      totalPendingItems,
      totalPendingQuantity,
      totalPendingAmount,
      partiallyPurchasedCount,
    },
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async buyMaterialRequestItem(
  itemId: number,
  body: any,
  user: any,
) {
  const item =
    await this.projectMaterialRequestItemRepository.findOne({
      where: { id: itemId },
    });

  if (!item) {
    throw new NotFoundException(
      'Material request item not found',
    );
  }

  const buyQuantity = Number(body?.quantity || 0);

  if (!buyQuantity || buyQuantity <= 0) {
    throw new BadRequestException(
      'Valid buy quantity is required',
    );
  }

  if (buyQuantity > Number(item.pendingQuantity || 0)) {
    throw new BadRequestException(
      'Buy quantity cannot be greater than pending quantity',
    );
  }

  const newPurchasedQuantity =
    Number(item.purchasedQuantity || 0) +
    buyQuantity;

  const newPendingQuantity =
    Number(item.pendingQuantity || 0) -
    buyQuantity;

  item.purchasedQuantity =
    newPurchasedQuantity;

  item.pendingQuantity =
    newPendingQuantity;

  item.purchaseStatus =
    newPendingQuantity <= 0
      ? 'PURCHASED' as any
      : 'PARTIALLY_PURCHASED' as any;

  item.purchasedAt = new Date();

  item.purchasedBy = user?.id || null;

  item.purchasedByName =
    user?.name || user?.email || '';

  return this.projectMaterialRequestItemRepository.save(
    item,
  );
}

async createPurchaseOrder(
  body: any,
  user: any,
) {
  const items = Array.isArray(body?.items)
    ? body.items
    : [];

  if (!body?.projectId) {
    throw new BadRequestException(
      'Project ID is required',
    );
  }

  if (!body?.vendorId) {
    throw new BadRequestException(
      'Vendor is required',
    );
  }

  if (items.length === 0) {
    throw new BadRequestException(
      'At least one PO item is required',
    );
  }

  const vendor =
    await this.projectVendorRepository.findOne({
      where: {
        id: Number(body.vendorId),
      },
    });

  if (!vendor) {
    throw new NotFoundException(
      'Vendor not found',
    );
  }

  let subtotalAmount = 0;
  let gstAmount = 0;
  let totalAmount = 0;

  const preparedItems: any[] = [];

  for (const item of items) {
    const purchaseRate = Number(
      item.purchaseRate || 0,
    );

    const quantity = Number(
      item.quantity || 0,
    );

    const gstPercent = Number(
      item.gstPercent || 0,
    );

    const subtotal =
      purchaseRate * quantity;

    const gst =
      (subtotal * gstPercent) / 100;

    const total = subtotal + gst;

    subtotalAmount += subtotal;
    gstAmount += gst;
    totalAmount += total;

    preparedItems.push({
      ...item,
      purchaseRate,
      quantity,
      gstPercent,
      subtotalAmount: subtotal,
      gstAmount: gst,
      totalAmount: total,
    });
  }

  const po =
    this.projectPurchaseOrderRepository.create({
      projectId: Number(body.projectId),

      materialRequestId:
        body.materialRequestId
          ? Number(body.materialRequestId)
          : null,

      vendorId: vendor.id,

      vendorName: vendor.vendorName,

      poNumber: this.generatePoNumber(),

      status:
        ProjectPurchaseOrderStatus.DRAFT,

      subtotalAmount,

      gstAmount,

      totalAmount,

      orderDate: body.orderDate
        ? new Date(body.orderDate)
        : new Date(),

      expectedDeliveryDate:
        body.expectedDeliveryDate
          ? new Date(
              body.expectedDeliveryDate,
            )
          : null,

      remarks: body.remarks || '',

      createdBy:
        user?.id || user?.userId || null,

      createdByName:
        user?.name || '',

      createdByRole:
        Array.isArray(user?.roles)
          ? user.roles.join(', ')
          : '',
        } as Partial<ProjectPurchaseOrder>);

  const savedPo =
  await this.projectPurchaseOrderRepository.save(
    po as ProjectPurchaseOrder,
  );

  await this.projectPartyLedgerRepository.save(
  this.projectPartyLedgerRepository.create({
    partyId: savedPo.vendorId || undefined,

    partyName:
      savedPo.vendorName || 'Vendor',

    partyType: 'VENDOR',

    projectId: savedPo.projectId,

    entryType:
      ProjectLedgerEntryType.CREDIT,

    sourceType:
      ProjectLedgerSourceType.PURCHASE_ORDER,

    sourceId: savedPo.id,

    amount: Number(
      savedPo.totalAmount || 0,
    ),

    remarks: `Purchase Order ${
      savedPo.poNumber || savedPo.id
    }`,

    createdBy:
      user?.id || user?.userId || null,

    createdByName:
      user?.name || '',
  } as Partial<ProjectPartyLedger>),
);

  const poItems = preparedItems.map(
    (item) =>
      this.projectPurchaseOrderItemRepository.create({
        purchaseOrderId: savedPo.id,

        projectId: Number(body.projectId),

        materialRequestItemId:
          item.materialRequestItemId
            ? Number(
                item.materialRequestItemId,
              )
            : null,

        materialId:
          item.materialId
            ? Number(item.materialId)
            : null,

        materialName:
          item.materialName || '',

        category:
          item.category || '',

        brand:
          item.brand || '',

        unit:
          item.unit || '',

          hsnCode:
  item.hsnCode || '',

        purchaseRate:
          item.purchaseRate,

        gstPercent:
          item.gstPercent,

        quantity:
          item.quantity,

        receivedQuantity: 0,

        pendingQuantity:
          item.quantity,

        subtotalAmount:
          item.subtotalAmount,

        gstAmount:
          item.gstAmount,

        totalAmount:
          item.totalAmount,

        remarks:
          item.remarks || '',
            } as Partial<ProjectPurchaseOrderItem>),
  );

  await this.projectPurchaseOrderItemRepository.save(
    poItems,
  );

  return {
    message:
      'Purchase order created successfully',

    purchaseOrder: savedPo,
  };
}

async createManualPurchaseOrder(
  body: any,
  currentUser: any,
) {
  const projectId = body?.projectId
    ? Number(body.projectId)
    : null;

  if (!body?.vendorName) {
    throw new BadRequestException(
      'Vendor name is required',
    );
  }

  const items = Array.isArray(body?.items)
    ? body.items
    : [];

  if (items.length === 0) {
    throw new BadRequestException(
      'At least one material item is required',
    );
  }

  let subtotalAmount = 0;
  let gstAmount = 0;
  let totalAmount = 0;

  for (const item of items) {
    const quantity = Number(item.quantity || 0);
    const purchaseRate = Number(item.purchaseRate || 0);
    const gstPercent = Number(item.gstPercent || 0);

    const rowSubtotal = quantity * purchaseRate;
    const rowGst = (rowSubtotal * gstPercent) / 100;
    const rowTotal = rowSubtotal + rowGst;

    subtotalAmount += rowSubtotal;
    gstAmount += rowGst;
    totalAmount += rowTotal;
  }

  const po = this.projectPurchaseOrderRepository.create({
    projectId: projectId || undefined,
    vendorId: body?.vendorId ? Number(body.vendorId) : undefined,
    vendorName: body.vendorName,
    poNumber: this.generatePoNumber(),
    status: ProjectPurchaseOrderStatus.DRAFT,
    subtotalAmount,
    gstAmount,
    totalAmount,
    orderDate: body?.orderDate ? new Date(body.orderDate) : new Date(),
    expectedDeliveryDate: body?.expectedDeliveryDate
      ? new Date(body.expectedDeliveryDate)
      : undefined,
    remarks: body?.remarks || '',
    createdBy: currentUser?.id || currentUser?.userId || null,
    createdByName: currentUser?.name || '',
    createdByRole: Array.isArray(currentUser?.roles)
      ? currentUser.roles.join(', ')
      : '',
  } as Partial<ProjectPurchaseOrder>);

  const savedPo =
    await this.projectPurchaseOrderRepository.save(
      po as ProjectPurchaseOrder,
    );

  const poItems = items.map((item: any) => {
    const quantity = Number(item.quantity || 0);
    const purchaseRate = Number(item.purchaseRate || 0);
    const gstPercent = Number(item.gstPercent || 0);

    const rowSubtotal = quantity * purchaseRate;
    const rowGst = (rowSubtotal * gstPercent) / 100;
    const rowTotal = rowSubtotal + rowGst;

    return this.projectPurchaseOrderItemRepository.create({
      purchaseOrderId: savedPo.id,
      projectId: projectId || undefined,
      materialRequestItemId: undefined,
      materialId: item.materialId ? Number(item.materialId) : undefined,
      materialName: item.materialName || '',
      category: item.category || '',
      brand: item.brand || '',
      unit: item.unit || '',
      hsnCode: item.hsnCode || '',
      purchaseRate,
      gstPercent,
      quantity,
      receivedQuantity: 0,
      pendingQuantity: quantity,
      subtotalAmount: rowSubtotal,
      gstAmount: rowGst,
      totalAmount: rowTotal,
      remarks: item.remarks || '',
    } as Partial<ProjectPurchaseOrderItem>);
  });

  await this.projectPurchaseOrderItemRepository.save(
    poItems as ProjectPurchaseOrderItem[],
  );

  await this.projectPartyLedgerRepository.save(
    this.projectPartyLedgerRepository.create({
      partyId: body?.vendorId ? Number(body.vendorId) : undefined,
      partyName: body.vendorName,
      partyType: 'VENDOR',
      projectId: projectId || undefined,
      entryType: ProjectLedgerEntryType.CREDIT,
      sourceType: ProjectLedgerSourceType.PURCHASE_ORDER,
      sourceId: savedPo.id,
      amount: totalAmount,
      remarks: `Manual PO ${savedPo.poNumber}`,
      createdBy: currentUser?.id || currentUser?.userId || null,
      createdByName: currentUser?.name || '',
    } as Partial<ProjectPartyLedger>),
  );

  return {
    message: 'Manual purchase order created successfully',
    purchaseOrder: savedPo,
  };
}

async getPurchaseOrderById(id: number) {
  const po =
    await this.projectPurchaseOrderRepository.findOne({
      where: { id },
    });

  if (!po) {
    throw new NotFoundException(
      'Purchase order not found',
    );
  }

  const items =
    await this.projectPurchaseOrderItemRepository.find({
      where: {
        purchaseOrderId: id,
      },
      order: {
        createdAt: 'ASC',
      },
    });

  return {
    ...po,
    items,
  };
}

async generatePurchaseOrderPdf(
  id: number,
  res: Response,
) {
  const po = await this.getPurchaseOrderById(id);

  const project = po.projectId
    ? await this.projectRepository.findOne({
        where: { id: Number(po.projectId) },
      })
    : null;

  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
  });

  const logoPath = path.join(
    process.cwd(),
    'src',
    'assets',
    'aditya-logo.jpg',
  );

  const fileName = `${po.poNumber || `PO-${po.id}`}.pdf`;

  res.setHeader(
    'Content-Disposition',
    `inline; filename="${fileName}"`,
  );
  res.setHeader('Content-Type', 'application/pdf');

  doc.pipe(res);

  const pageLeft = 40;
  const pageRight = 555;
  const pageWidth = pageRight - pageLeft;

  const blue = '#1e40af';
  const orange = '#f97316';
  const lightBlue = '#eff6ff';
  const lightOrange = '#fff7ed';
  const border = '#d1d5db';
  const dark = '#111827';
  const muted = '#6b7280';

  const orderDate = po.orderDate
    ? new Date(po.orderDate).toLocaleDateString('en-IN')
    : new Date(po.createdAt).toLocaleDateString('en-IN');

  doc.image(logoPath, 40, 20, {
    fit: [515, 110],
    align: 'center',
  });

  doc.y = 132;

  doc
    .roundedRect(pageLeft, doc.y, pageWidth, 32, 6)
    .fill(blue);

  doc
    .fillColor('#ffffff')
    .fontSize(17)
    .text('PURCHASE ORDER', pageLeft, doc.y + 8, {
      width: pageWidth,
      align: 'center',
    });

  doc.y += 38;

  doc
    .fontSize(8)
    .fillColor(muted)
    .text(
      'ADITYA SOLARS | adityasolarsraj01@gmail.com | 8306170662, 9887634474',
      pageLeft,
      doc.y,
      {
        width: pageWidth,
        align: 'center',
      },
    );

  doc
    .fontSize(8)
    .fillColor(muted)
    .text(
      'GSTIN: 08CVFPM5354P1ZV',
      pageLeft,
      doc.y + 12,
      {
        width: pageWidth,
        align: 'center',
      },
    );

  doc.y += 26;

  const cardY = doc.y;
  const cardW = 250;
  const cardH = 88;

  doc
    .roundedRect(pageLeft, cardY, cardW, cardH, 6)
    .fill(lightBlue)
    .strokeColor(border)
    .stroke();

  doc
    .roundedRect(pageLeft + 265, cardY, cardW, cardH, 6)
    .fill('#f9fafb')
    .strokeColor(border)
    .stroke();

  doc
    .fontSize(10)
    .fillColor(blue)
    .text('VENDOR DETAILS', pageLeft + 12, cardY + 10);

  doc
    .fontSize(9)
    .fillColor(dark)
    .text(`Vendor: ${po.vendorName || '-'}`, pageLeft + 12, cardY + 28, {
      width: 225,
    })
    .text(`Project ID: ${po.projectId || '-'}`, pageLeft + 12, cardY + 43, {
      width: 225,
    })
    .text(`Customer: ${(project as any)?.customerName || '-'}`, pageLeft + 12, cardY + 58, {
      width: 225,
    })
    .text(`Branch: ${(project as any)?.branchName || '-'}`, pageLeft + 12, cardY + 73, {
      width: 225,
    });

  doc
    .fontSize(10)
    .fillColor(orange)
    .text('DOCUMENT DETAILS', pageLeft + 277, cardY + 10);

  doc
    .fontSize(9)
    .fillColor(dark)
    .text(`PO No: ${po.poNumber || '-'}`, pageLeft + 277, cardY + 28, {
      width: 220,
    })
    .text(`Date: ${orderDate}`, pageLeft + 277, cardY + 43, {
      width: 220,
    })
    .text(`Status: ${po.status || '-'}`, pageLeft + 277, cardY + 58, {
      width: 220,
    })
    .text(`Type: Purchase Order`, pageLeft + 277, cardY + 73, {
      width: 220,
    });

  doc.y = cardY + cardH + 16;

  doc
    .fontSize(12)
    .fillColor(dark)
    .text('Purchase Items', pageLeft, doc.y);

  doc.y += 18;

  const drawTableHeader = () => {
    const y = doc.y;

    doc
      .rect(pageLeft, y, pageWidth, 22)
      .fill(blue);

    doc
      .fontSize(8)
      .fillColor('#ffffff')
      .text('Sr', 42, y + 7, { width: 22 })
      .text('Material', 65, y + 7, { width: 165 })
      .text('HSN', 230, y + 7, { width: 45 })
      .text('Qty', 255, y + 7, { width: 30, align: 'right' })
      .text('Unit', 308, y + 7, { width: 38 })
      .text('Rate', 348, y + 7, { width: 55, align: 'right' })
      .text('GST%', 405, y + 7, { width: 32, align: 'right' })
      .text('GST Amt', 440, y + 7, { width: 52, align: 'right' })
      .text('Total', 494, y + 7, { width: 58, align: 'right' });

    doc.y = y + 22;
  };

  drawTableHeader();

  (po.items || []).forEach((item: any, index: number) => {
    const itemName = item.materialName || '-';

    const rowHeight = Math.max(
      28,
      Math.min(
        46,
        doc.fontSize(8).heightOfString(itemName, {
          width: 160,
        }) + 10,
      ),
    );

    if (doc.y + rowHeight > 700) {
      doc.addPage();
      doc.y = 40;
      drawTableHeader();
    }

    const y = doc.y;

    doc
      .rect(pageLeft, y, pageWidth, rowHeight)
      .fill(index % 2 === 0 ? '#f9fafb' : '#ffffff');

    doc
      .strokeColor(border)
      .lineWidth(0.4)
      .rect(pageLeft, y, pageWidth, rowHeight)
      .stroke();

    doc
      .fontSize(8)
      .fillColor(dark)
      .text(String(index + 1), 42, y + 7, { width: 22 })
      .text(itemName, 65, y + 7, {
        width: 160,
        height: rowHeight - 8,
      })
      .text(String((item as any).hsnCode || '-'), 230, y + 7, {
        width: 45,
      })
      .text(String(item.quantity || 0), 255, y + 7, {
        width: 30,
        align: 'right',
      })
      .text(String(item.unit || '-'), 308, y + 7, {
        width: 38,
      })
      .text(this.formatInr(item.purchaseRate || 0), 348, y + 7, {
        width: 55,
        align: 'right',
      })
      .text(`${item.gstPercent || 0}%`, 405, y + 7, {
        width: 32,
        align: 'right',
      })
      .text(this.formatInr(item.gstAmount || 0), 440, y + 7, {
        width: 52,
        align: 'right',
      })
      .text(this.formatInr(item.totalAmount || 0), 494, y + 7, {
        width: 58,
        align: 'right',
      });

    doc.y = y + rowHeight;
  });

  doc.y += 14;

  if (doc.y > 610) {
    doc.addPage();
    doc.y = 40;
  }

  const summaryX = 345;
  const summaryY = doc.y;
  const summaryW = 210;

  doc
    .roundedRect(summaryX, summaryY, summaryW, 76, 6)
    .fill('#f8fafc')
    .strokeColor(border)
    .stroke();

  const summaryLine = (
    label: string,
    value: any,
    yOffset: number,
    bold = false,
    color = dark,
  ) => {
    doc
      .fontSize(bold ? 11 : 9)
      .fillColor(color)
      .text(label, summaryX + 12, summaryY + yOffset, {
        width: 85,
      })
      .text(this.formatInr(value), summaryX + 100, summaryY + yOffset, {
        width: 95,
        align: 'right',
      });
  };

  summaryLine('Subtotal', po.subtotalAmount, 12);
  summaryLine('GST', po.gstAmount, 30);

  doc
    .moveTo(summaryX + 10, summaryY + 49)
    .lineTo(summaryX + summaryW - 10, summaryY + 49)
    .strokeColor(orange)
    .lineWidth(1)
    .stroke();

  summaryLine('Grand Total', po.totalAmount, 56, true, '#16a34a');

  doc.y = summaryY + 90;

  doc
    .roundedRect(pageLeft, doc.y, pageWidth, 34, 6)
    .fill(lightOrange)
    .strokeColor(border)
    .stroke();

  doc
    .fontSize(9)
    .fillColor(orange)
    .text('Amount in Words', pageLeft + 12, doc.y + 8);

  doc
    .fontSize(10)
    .fillColor(dark)
    .text(
      this.numberToWordsIndian(Number(po.totalAmount || 0)),
      pageLeft + 12,
      doc.y + 20,
      {
        width: pageWidth - 24,
      },
    );

  doc.y += 46;

  const footerY = doc.y;

  doc
    .roundedRect(pageLeft, footerY, 250, 82, 6)
    .fill('#f9fafb')
    .strokeColor(border)
    .stroke();

  doc
    .fontSize(10)
    .fillColor(blue)
    .text('Terms & Conditions', pageLeft + 12, footerY + 10);

  doc
    .fontSize(8)
    .fillColor(dark)
    .text('1. This purchase order is system-generated.', pageLeft + 12, footerY + 28, {
      width: 225,
    })
    .text('2. Material rates and GST are as per approved order.', pageLeft + 12, footerY + 42, {
      width: 225,
    })
    .text('3. Delivery and payment terms as mutually agreed.', pageLeft + 12, footerY + 56, {
      width: 225,
    });

  doc
    .roundedRect(pageLeft + 265, footerY, 250, 82, 6)
    .fill('#f9fafb')
    .strokeColor(border)
    .stroke();

  doc
    .fontSize(10)
    .fillColor(blue)
    .text('For Aditya Solars', pageLeft + 277, footerY + 10);

  doc
    .fontSize(8)
    .fillColor(dark)
    .text(`Generated On: ${orderDate}`, pageLeft + 277, footerY + 28, {
      width: 220,
    })
    .text('Prepared By: System', pageLeft + 277, footerY + 42, {
      width: 220,
    });

  doc
    .fontSize(8)
    .fillColor(muted)
    .text('Authorized Signatory', pageLeft + 277, footerY + 62, {
      width: 220,
      align: 'right',
    });

  doc.end();
}

async getGeneratedPurchaseOrders(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const page =
    Number(filters?.page) > 0
      ? Number(filters?.page)
      : 1;

  const limit =
    Number(filters?.limit) > 0
      ? Math.min(Number(filters?.limit), 100)
      : 20;

  const skip = (page - 1) * limit;

  const query =
    this.projectPurchaseOrderRepository.createQueryBuilder(
      'po',
    );

  if (filters?.search) {
    query.andWhere(
      `
      LOWER(po."vendorName") LIKE :search
      OR LOWER(po."poNumber") LIKE :search
      `,
      {
        search: `%${filters.search.toLowerCase()}%`,
      },
    );
  }

  if (filters?.status) {
    query.andWhere(
      'po.status = :status',
      {
        status: filters.status,
      },
    );
  }

  query.andWhere('po.isHidden = false');

  query.orderBy(
    'po.createdAt',
    'DESC',
  );

  query.skip(skip).take(limit);

  const [data, total] =
    await query.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages:
      Math.ceil(total / limit) || 1,
  };
}

async hidePurchaseOrder(
  id: number,
  reason: string,
  user: any,
) {
  const po =
    await this.projectPurchaseOrderRepository.findOne({
      where: { id },
    });

  if (!po) {
    throw new NotFoundException(
      'Purchase order not found',
    );
  }

  po.isHidden = true;
  po.hiddenReason = reason || '';
  po.hiddenAt = new Date();

  po.hiddenBy =
    user?.id || user?.userId || null;

  po.hiddenByName =
    user?.name || '';

  await this.projectPurchaseOrderRepository.save(
    po,
  );

  await this.projectPartyLedgerRepository.update(
    {
      sourceType:
        ProjectLedgerSourceType.PURCHASE_ORDER,
      sourceId: po.id,
    },
    {
      isHidden: true,
      hiddenReason:
        reason || 'PO hidden',
      hiddenAt: new Date(),
      hiddenBy:
        user?.id || user?.userId || null,
      hiddenByName:
        user?.name || '',
    },
  );

  return {
    success: true,
    message:
      'Purchase order hidden successfully',
  };
}

async createProformaInvoice(
  body: any,
  user: any,
) {
  const items = Array.isArray(body?.items)
    ? body.items
    : [];

  if (!body?.projectId) {
  throw new BadRequestException(
    'Project ID is required',
  );
}

  if (items.length === 0) {
    throw new BadRequestException(
      'At least one invoice item is required',
    );
  }

  let subtotalAmount = 0;
  let discountAmount = 0;
  let gstAmount = 0;
  let totalAmount = 0;

  const preparedItems: any[] = [];

  for (const item of items) {
    const sellingRate = Number(
      item.sellingRate || 0,
    );

    const quantity = Number(
      item.quantity || 0,
    );

    const gstPercent = Number(
      item.gstPercent || 0,
    );

    const itemDiscount = Number(
      item.discountAmount || 0,
    );

    const subtotal =
      sellingRate * quantity;

    const taxable =
      subtotal - itemDiscount;

    const gst =
      (taxable * gstPercent) / 100;

    const total = taxable + gst;

    subtotalAmount += subtotal;
    discountAmount += itemDiscount;
    gstAmount += gst;
    totalAmount += total;

    preparedItems.push({
      ...item,
      sellingRate,
      quantity,
      gstPercent,
      discountAmount: itemDiscount,
      subtotalAmount: subtotal,
      gstAmount: gst,
      totalAmount: total,
    });
  }

  const invoice =
    this.projectProformaInvoiceRepository.create({
      projectId: Number(body.projectId),

      invoiceNumber:
        this.generatePiNumber(),

      status:
        ProjectProformaInvoiceStatus.DRAFT,

      subtotalAmount,

      discountAmount,

      gstAmount,

      totalAmount,

      invoiceDate: body.invoiceDate
        ? new Date(body.invoiceDate)
        : new Date(),

      validUntil: body.validUntil
        ? new Date(body.validUntil)
        : null,

      remarks: body.remarks || '',

      createdBy:
        user?.id || user?.userId || null,

      createdByName:
        user?.name || '',

      createdByRole:
        Array.isArray(user?.roles)
          ? user.roles.join(', ')
          : '',
    } as Partial<ProjectProformaInvoice>);

  const savedInvoice =
    await this.projectProformaInvoiceRepository.save(
      invoice as ProjectProformaInvoice,
    );

  const invoiceItems =
    preparedItems.map((item) =>
      this.projectProformaInvoiceItemRepository.create({
        proformaInvoiceId:
          savedInvoice.id,

        projectId: Number(
          body.projectId,
        ),

        materialId:
          item.materialId
            ? Number(item.materialId)
            : null,

        itemName:
          item.itemName || '',

        category:
          item.category || '',

        brand:
          item.brand || '',

        unit:
          item.unit || '',

          hsnCode:
  item.hsnCode || '',

        sellingRate:
          item.sellingRate,

        gstPercent:
          item.gstPercent,

        quantity:
          item.quantity,

        discountAmount:
          item.discountAmount,

        subtotalAmount:
          item.subtotalAmount,

        gstAmount:
          item.gstAmount,

        totalAmount:
          item.totalAmount,

        remarks:
          item.remarks || '',
      } as Partial<ProjectProformaInvoiceItem>),
    );

  await this.projectProformaInvoiceItemRepository.save(
    invoiceItems,
  );

  return {
    message:
      'Proforma invoice created successfully',

    invoice: savedInvoice,
  };
}

async getProformaInvoices(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const page =
    Number(filters?.page) > 0
      ? Number(filters?.page)
      : 1;

  const limit =
    Number(filters?.limit) > 0
      ? Math.min(Number(filters?.limit), 100)
      : 20;

  const skip = (page - 1) * limit;

  const query =
    this.projectProformaInvoiceRepository.createQueryBuilder(
      'pi',
    );

  if (filters?.search) {
    query.andWhere(
      `
      LOWER(pi."invoiceNumber") LIKE :search
      `,
      {
        search: `%${filters.search.toLowerCase()}%`,
      },
    );
  }

  if (filters?.status) {
    query.andWhere(
      'pi.status = :status',
      {
        status: filters.status,
      },
    );
  }

  query.andWhere('pi.isHidden = false');

  query.orderBy(
    'pi.createdAt',
    'DESC',
  );

  query.skip(skip).take(limit);

  const [data, total] =
    await query.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages:
      Math.ceil(total / limit) || 1,
  };
}

async getProformaInvoiceById(
  id: number,
) {
  const invoice =
    await this.projectProformaInvoiceRepository.findOne({
      where: { id },
    });

  if (!invoice) {
    throw new NotFoundException(
      'Proforma invoice not found',
    );
  }

  const items =
    await this.projectProformaInvoiceItemRepository.find({
      where: {
        proformaInvoiceId: id,
      },
      order: {
        createdAt: 'ASC',
      },
    });

  return {
    ...invoice,
    items,
  };
}

async createManualProformaInvoice(
  body: any,
  currentUser: any,
) {
  const projectId = body?.projectId ? Number(body.projectId) : null;
  const dealerId = body?.dealerId ? Number(body.dealerId) : null;

  if (!projectId && !dealerId) {
    throw new BadRequestException(
      'Please select either Project or Dealer',
    );
  }

  let dealer: ProjectVendor | null = null;

  if (dealerId) {
    dealer = await this.projectVendorRepository.findOne({
      where: { id: dealerId },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer not found');
    }

    if ((dealer as any).canBuyFromUs !== true) {
      throw new BadRequestException(
        'Selected party is not marked as dealer/customer buyer',
      );
    }
  }

  const items = Array.isArray(body?.items)
    ? body.items
    : [];

  if (items.length === 0) {
    throw new BadRequestException(
      'At least one item is required',
    );
  }

  let subtotalAmount = 0;
  let discountAmount = 0;
  let gstAmount = 0;
  let totalAmount = 0;

  for (const item of items) {
    const quantity = Number(item.quantity || 0);
    const sellingRate = Number(item.sellingRate || 0);
    const gstPercent = Number(item.gstPercent || 0);
    const rowDiscount = Number(item.discountAmount || 0);

    const rowSubtotal = quantity * sellingRate;
    const taxableAmount = rowSubtotal - rowDiscount;
    const rowGst = (taxableAmount * gstPercent) / 100;
    const rowTotal = taxableAmount + rowGst;

    subtotalAmount += rowSubtotal;
    discountAmount += rowDiscount;
    gstAmount += rowGst;
    totalAmount += rowTotal;
  }

  const invoice: any =
    this.projectProformaInvoiceRepository.create({
      projectId: projectId || undefined,

      invoiceNumber: this.generatePiNumber(),

      subtotalAmount,
      discountAmount,
      gstAmount,
      totalAmount,

      status: ProjectProformaInvoiceStatus.DRAFT,

      invoiceDate: new Date(),

      remarks: body?.remarks || '',

      createdBy:
        currentUser?.id ||
        currentUser?.userId ||
        null,

      createdByName:
        currentUser?.name || '',
    } as Partial<ProjectProformaInvoice>);

  invoice.invoiceType = dealerId ? 'DEALER' : 'PROJECT';
  invoice.dealerId = dealer?.id || undefined;
  invoice.dealerName = dealer?.vendorName || '';
  invoice.dealerPhone = (dealer as any)?.phone || '';
  invoice.dealerGstNumber = (dealer as any)?.gstNumber || '';
  invoice.dealerAddress = (dealer as any)?.address || '';

  const savedInvoice =
    await this.projectProformaInvoiceRepository.save(
      invoice as ProjectProformaInvoice,
    );

    const materialIds = items
  .map((item: any) => Number(item.materialId || 0))
  .filter((id: number) => id > 0);

const matchedMaterialsById = materialIds.length
  ? await this.projectMaterialMasterRepository.find({
      where: {
        id: In(materialIds),
      },
    })
  : [];

const materialHsnById = new Map(
  matchedMaterialsById.map((material: any) => [
    Number(material.id),
    String((material as any).hsnCode || '').trim(),
  ]),
);

console.log('MANUAL_PI_HSN_DEBUG', {
  materialIds,
  matchedMaterialsById,
  materialHsnById: Array.from(
    materialHsnById.entries(),
  ),
});

console.log(
  'PI_ENTITY_COLUMNS',
  this.projectProformaInvoiceItemRepository.metadata.columns.map(
    (c) => c.propertyName,
  ),
);

  const invoiceItems = items.map(
    (item: any) => {
      const quantity = Number(item.quantity || 0);
      const sellingRate = Number(item.sellingRate || 0);
      const gstPercent = Number(item.gstPercent || 0);
      const rowDiscount = Number(item.discountAmount || 0);

      const rowSubtotal = quantity * sellingRate;
      const taxableAmount = rowSubtotal - rowDiscount;
      const rowGst = (taxableAmount * gstPercent) / 100;
      const rowTotal = taxableAmount + rowGst;

      const resolvedHsnCode =
  String(item.hsnCode || '').trim() ||
  materialHsnById.get(Number(item.materialId || 0)) ||
  '';

console.log('RESOLVED_HSN', {
  materialId: item.materialId,
  resolvedHsnCode,
});

      return this.projectProformaInvoiceItemRepository.create(
        {
          proformaInvoiceId: savedInvoice.id,
          projectId: projectId || undefined,

          materialId:
            item.materialId
              ? Number(item.materialId)
              : undefined,

          itemName:
            item.itemName || '',

          category:
            item.category || '',

          brand:
            item.brand || '',

          unit:
            item.unit || '',

          sellingRate,
          gstPercent,
          quantity,

          discountAmount:
            rowDiscount,

            hsnCode: resolvedHsnCode,

          subtotalAmount:
            rowSubtotal,

          gstAmount:
            rowGst,

          totalAmount:
            rowTotal,

          remarks:
            item.remarks || '',
        } as Partial<ProjectProformaInvoiceItem>,
      );
    },
  );

  console.log(
  'MANUAL_PI_SAVE_ITEMS',
  JSON.stringify(invoiceItems, null, 2),
);

  console.log(
  'MANUAL_PI_SAVE_ITEMS',
  invoiceItems.map((i: any) => ({
    materialId: i.materialId,
    hsnCode: i.hsnCode,
    itemName: i.itemName,
  })),
);

const savedItems =
  await this.projectProformaInvoiceItemRepository.save(
    invoiceItems as ProjectProformaInvoiceItem[],
  );

console.log(
  'MANUAL_PI_SAVED_ITEMS',
  savedItems.map((i: any) => ({
    id: i.id,
    materialId: i.materialId,
    hsnCode: i.hsnCode,
    itemName: i.itemName,
  })),
);

  return {
    message:
      'Manual proforma invoice created successfully',

    invoice: savedInvoice,
  };
}

private formatInr(value: any) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

private numberToWordsIndian(amount: number) {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
    'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
    'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
    'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  const belowHundred = (n: number): string => {
    if (n < 20) return ones[n];
    return `${tens[Math.floor(n / 10)]} ${ones[n % 10]}`.trim();
  };

  const belowThousand = (n: number): string => {
    if (n < 100) return belowHundred(n);
    return `${ones[Math.floor(n / 100)]} Hundred ${belowHundred(n % 100)}`.trim();
  };

  const n = Math.round(Number(amount || 0));

  if (n === 0) return 'Zero Rupees Only';

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  const parts: string[] = [];

  if (crore) parts.push(`${belowThousand(crore)} Crore`);
  if (lakh) parts.push(`${belowThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${belowThousand(thousand)} Thousand`);
  if (rest) parts.push(belowThousand(rest));

  return `${parts.join(' ')} Rupees Only`;
}

async generateProformaInvoicePdf(
  id: number,
  res: Response,
) {
  const pi = await this.getProformaInvoiceById(id);

  const isDealerInvoice =
    (pi as any).invoiceType === 'DEALER' ||
    !!(pi as any).dealerId;

  const project = !isDealerInvoice && pi.projectId
    ? await this.projectRepository.findOne({
        where: { id: Number(pi.projectId) },
      })
    : null;

  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
  });

  const logoPath = path.join(
    process.cwd(),
    'src',
    'assets',
    'aditya-logo.jpg',
  );

  const fileName = `${pi.invoiceNumber || `PI-${pi.id}`}.pdf`;

  res.setHeader(
    'Content-Disposition',
    `inline; filename="${fileName}"`,
  );

  res.setHeader('Content-Type', 'application/pdf');

  doc.pipe(res);

  const pageLeft = 40;
  const pageRight = 555;
  const pageWidth = pageRight - pageLeft;

  const blue = '#1e40af';
  const orange = '#f97316';
  const lightBlue = '#eff6ff';
  const lightOrange = '#fff7ed';
  const border = '#d1d5db';
  const dark = '#111827';
  const muted = '#6b7280';

  const invoiceDate = pi.invoiceDate
    ? new Date(pi.invoiceDate).toLocaleDateString('en-IN')
    : new Date(pi.createdAt).toLocaleDateString('en-IN');

  // Logo unchanged: same image, same fit, same width.
  doc.image(logoPath, 40, 20, {
    fit: [515, 110],
    align: 'center',
  });

  doc.y = 132;

  // Title bar
  doc
    .roundedRect(pageLeft, doc.y, pageWidth, 32, 6)
    .fill(blue);

  doc
    .fillColor('#ffffff')
    .fontSize(17)
    .text('PROFORMA INVOICE', pageLeft, doc.y + 8, {
      width: pageWidth,
      align: 'center',
    });

  doc.y += 38;

doc
  .fontSize(8)
  .fillColor(muted)
  .text(
    'ADITYA SOLARS | adityasolarsraj01@gmail.com | 8306170662, 9887634474',
    pageLeft,
    doc.y,
    {
      width: pageWidth,
      align: 'center',
    },
  );

doc
  .fontSize(8)
  .fillColor(muted)
  .text(
    'GSTIN: 08CVFPM5354P1ZV',
    pageLeft,
    doc.y + 12,
    {
      width: pageWidth,
      align: 'center',
    },
  );

doc.y += 26;

// Bill to and details cards

  // Bill to and details cards
  const cardY = doc.y;
  const cardW = 250;
  const cardH = 88;

  doc
    .roundedRect(pageLeft, cardY, cardW, cardH, 6)
    .fill(lightBlue)
    .strokeColor(border)
    .stroke();

  doc
    .roundedRect(pageLeft + 265, cardY, cardW, cardH, 6)
    .fill('#f9fafb')
    .strokeColor(border)
    .stroke();

  doc
    .fontSize(10)
    .fillColor(blue)
    .text('BILL TO', pageLeft + 12, cardY + 10);

  if (isDealerInvoice) {
    doc
      .fontSize(9)
      .fillColor(dark)
      .text(`Name: ${(pi as any).dealerName || '-'}`, pageLeft + 12, cardY + 28, {
        width: 225,
      })
      .text(`Phone: ${(pi as any).dealerPhone || '-'}`, pageLeft + 12, cardY + 43, {
        width: 225,
      })
      .text(`GST: ${(pi as any).dealerGstNumber || '-'}`, pageLeft + 12, cardY + 58, {
        width: 225,
      })
      .text(`Address: ${(pi as any).dealerAddress || '-'}`, pageLeft + 12, cardY + 73, {
        width: 225,
        height: 15,
      });
  } else {
    doc
      .fontSize(9)
      .fillColor(dark)
      .text(`Name: ${(project as any)?.customerName || '-'}`, pageLeft + 12, cardY + 28, {
        width: 225,
      })
      .text(`Phone: ${(project as any)?.customerPhone || '-'}`, pageLeft + 12, cardY + 43, {
        width: 225,
      })
      .text(`Address: ${(project as any)?.address || (project as any)?.gpsAddress || '-'}`, pageLeft + 12, cardY + 58, {
        width: 225,
        height: 28,
      });
  }

  doc
    .fontSize(10)
    .fillColor(orange)
    .text('DOCUMENT DETAILS', pageLeft + 277, cardY + 10);

  doc
  .fontSize(9)
  .fillColor(dark)
  .text(`PI No: ${pi.invoiceNumber || '-'}`, pageLeft + 277, cardY + 28, {
    width: 220,
  })
  .text(`Date: ${invoiceDate}`, pageLeft + 277, cardY + 43, {
    width: 220,
  })
  .text(`Status: ${pi.status || '-'}`, pageLeft + 277, cardY + 58, {
    width: 220,
  })
  .text(`Type: ${isDealerInvoice ? 'Dealer / Trading' : 'Project'}`, pageLeft + 277, cardY + 73, {
    width: 220,
  });

  doc.y = cardY + cardH + 16;

  // Table title
  doc
    .fontSize(12)
    .fillColor(dark)
    .text('Item Details', pageLeft, doc.y);

  doc.y += 18;

  const drawTableHeader = () => {
    const y = doc.y;

    doc
      .rect(pageLeft, y, pageWidth, 22)
      .fill(blue);

    doc
      .fontSize(8)
      .fillColor('#ffffff')
      .text('Sr', 42, y + 7, { width: 22 })
      .text('Item Name', 65, y + 7, { width: 165 })
.text('HSN', 230, y + 7, { width: 45 })
.text('Qty', 255, y + 7, { width: 30, align: 'right' })
.text('Unit', 308, y + 7, { width: 38 })
.text('Rate', 348, y + 7, { width: 55, align: 'right' })
.text('GST%', 405, y + 7, { width: 32, align: 'right' })
.text('GST Amt', 440, y + 7, { width: 52, align: 'right' })
.text('Total', 494, y + 7, { width: 58, align: 'right' });

    doc.y = y + 22;
  };

  drawTableHeader();

  (pi.items || []).forEach((item: any, index: number) => {
    const itemName = item.itemName || '-';
    const rowHeight = Math.max(
      28,
      Math.min(
        46,
        doc.fontSize(8).heightOfString(itemName, {
  width: 140,
}) + 10,
      ),
    );

    if (doc.y + rowHeight > 700) {
      doc.addPage();
      doc.y = 40;
      drawTableHeader();
    }

    const y = doc.y;

    if (index % 2 === 0) {
      doc.rect(pageLeft, y, pageWidth, rowHeight).fill('#f9fafb');
    } else {
      doc.rect(pageLeft, y, pageWidth, rowHeight).fill('#ffffff');
    }

    doc
      .strokeColor(border)
      .lineWidth(0.4)
      .rect(pageLeft, y, pageWidth, rowHeight)
      .stroke();

    doc
      .fontSize(8)
      .fillColor(dark)
      .text(String(index + 1), 42, y + 7, { width: 22 })
      .text(itemName, 65, y + 7, {
  width: 160,
  height: rowHeight - 8,
})
.text(String((item as any).hsnCode || '-'), 230, y + 7, {
  width: 45,
})
.text(String(item.quantity || 0), 255, y + 7, {
  width: 30,
  align: 'right',
})
.text(String(item.unit || '-'), 308, y + 7, {
  width: 38,
})
.text(this.formatInr(item.sellingRate || 0), 348, y + 7, {
  width: 55,
  align: 'right',
})
.text(`${item.gstPercent || 0}%`, 405, y + 7, {
  width: 32,
  align: 'right',
})
.text(this.formatInr(item.gstAmount || 0), 440, y + 7, {
  width: 52,
  align: 'right',
})
.text(this.formatInr(item.totalAmount || 0), 494, y + 7, {
  width: 58,
  align: 'right',
});

    doc.y = y + rowHeight;
  });

  doc.y += 14;

  if (doc.y > 610) {
    doc.addPage();
    doc.y = 40;
  }

  const summaryX = 345;
  const summaryY = doc.y;
  const summaryW = 210;

  doc
    .roundedRect(summaryX, summaryY, summaryW, 94, 6)
    .fill('#f8fafc')
    .strokeColor(border)
    .stroke();

  const summaryLine = (
    label: string,
    value: any,
    yOffset: number,
    bold = false,
    color = dark,
  ) => {
    doc
      .fontSize(bold ? 11 : 9)
      .fillColor(color)
      .text(label, summaryX + 12, summaryY + yOffset, {
        width: 85,
      })
      .text(this.formatInr(value), summaryX + 100, summaryY + yOffset, {
        width: 95,
        align: 'right',
      });
  };

  summaryLine('Subtotal', pi.subtotalAmount, 12);
  summaryLine('Discount', pi.discountAmount, 30);
  summaryLine('GST', pi.gstAmount, 48);

  doc
    .moveTo(summaryX + 10, summaryY + 67)
    .lineTo(summaryX + summaryW - 10, summaryY + 67)
    .strokeColor(orange)
    .lineWidth(1)
    .stroke();

  summaryLine('Grand Total', pi.totalAmount, 74, true, '#16a34a');

  doc.y = summaryY + 108;

  doc
  .roundedRect(pageLeft, doc.y, pageWidth, 34, 6)
    .fill(lightOrange)
    .strokeColor(border)
    .stroke();

  doc
    .fontSize(9)
    .fillColor(orange)
    .text('Amount in Words', pageLeft + 12, doc.y + 8);

  doc
    .fontSize(10)
    .fillColor(dark)
    .text(this.numberToWordsIndian(Number(pi.totalAmount || 0)), pageLeft + 12, doc.y + 20, {
      width: pageWidth - 24,
    });

  doc.y += 46;

  const footerY = doc.y;

  doc
    .roundedRect(pageLeft, footerY, 250, 82, 6)
    .fill('#f9fafb')
    .strokeColor(border)
    .stroke();

  doc
    .fontSize(10)
    .fillColor(blue)
    .text('Terms & Conditions', pageLeft + 12, footerY + 10);

  doc
    .fontSize(8)
    .fillColor(dark)
    .text('1. This is a system-generated proforma invoice.', pageLeft + 12, footerY + 28, {
      width: 225,
    })
    .text('2. Prices are subject to final approval and availability.', pageLeft + 12, footerY + 42, {
      width: 225,
    })
    .text('3. Warranty as per manufacturer/company policy.', pageLeft + 12, footerY + 56, {
      width: 225,
    });

  doc
    .roundedRect(pageLeft + 265, footerY, 250, 82, 6)
    .fill('#f9fafb')
    .strokeColor(border)
    .stroke();

  doc
  .fontSize(10)
  .fillColor(blue)
  .text('For Aditya Solars', pageLeft + 277, footerY + 10);

doc
  .fontSize(8)
  .fillColor(dark)
  .text(`Generated On: ${invoiceDate}`, pageLeft + 277, footerY + 28, {
    width: 220,
  })
  .text('Prepared By: System', pageLeft + 277, footerY + 42, {
    width: 220,
  });

doc
  .fontSize(8)
  .fillColor(muted)
  .text('Authorized Signatory', pageLeft + 277, footerY + 62, {
    width: 220,
    align: 'right',
  });

  doc.end();
}

async createFinalInvoice(
  body: any,
  user: any,
) {
  const items = Array.isArray(body?.items)
    ? body.items
    : [];

  if (!body?.projectId) {
    throw new BadRequestException(
      'Project ID is required',
    );
  }

  if (items.length === 0) {
    throw new BadRequestException(
      'At least one invoice item is required',
    );
  }

  let subtotalAmount = 0;
  let discountAmount = 0;
  let gstAmount = 0;
  let totalAmount = 0;

  const preparedItems: any[] = [];

  for (const item of items) {
    const finalRate = Number(
      item.finalRate || 0,
    );

    const quantity = Number(
      item.quantity || 0,
    );

    const gstPercent = Number(
      item.gstPercent || 0,
    );

    const itemDiscount = Number(
      item.discountAmount || 0,
    );

    const subtotal =
      finalRate * quantity;

    const taxable =
      subtotal - itemDiscount;

    const gst =
      (taxable * gstPercent) / 100;

    const total = taxable + gst;

    subtotalAmount += subtotal;
    discountAmount += itemDiscount;
    gstAmount += gst;
    totalAmount += total;

    preparedItems.push({
      ...item,
      finalRate,
      quantity,
      gstPercent,
      discountAmount: itemDiscount,
      subtotalAmount: subtotal,
      gstAmount: gst,
      totalAmount: total,
    });
  }

  const invoice =
    this.projectFinalInvoiceRepository.create({
      projectId: Number(body.projectId),

      invoiceNumber:
        this.generateFinalInvoiceNumber(),

      status:
        ProjectFinalInvoiceStatus.GENERATED,

      subtotalAmount,

      discountAmount,

      gstAmount,

      totalAmount,

      paidAmount: 0,

      pendingAmount: totalAmount,

      invoiceDate: body.invoiceDate
        ? new Date(body.invoiceDate)
        : new Date(),

      dueDate: body.dueDate
        ? new Date(body.dueDate)
        : null,

      remarks: body.remarks || '',

      createdBy:
        user?.id || user?.userId || null,

      createdByName:
        user?.name || '',

      createdByRole:
        Array.isArray(user?.roles)
          ? user.roles.join(', ')
          : '',
    } as Partial<ProjectFinalInvoice>);

  const savedInvoice =
    await this.projectFinalInvoiceRepository.save(
      invoice as ProjectFinalInvoice,
    );

    const invoiceProject =
  await this.projectRepository.findOne({
    where: {
      id: Number(savedInvoice.projectId),
    },
  });

await this.projectPartyLedgerRepository.save(
  this.projectPartyLedgerRepository.create({
    partyId: undefined,

    partyName:
      invoiceProject?.customerName ||
      'Customer',

    partyType: 'CUSTOMER',

    projectId: savedInvoice.projectId,

    entryType:
      ProjectLedgerEntryType.DEBIT,

    sourceType:
      ProjectLedgerSourceType.FINAL_INVOICE,

    sourceId: savedInvoice.id,

    amount: Number(
      savedInvoice.totalAmount || 0,
    ),

    remarks: `Final Invoice ${
      savedInvoice.invoiceNumber ||
      savedInvoice.id
    }`,

    createdBy:
      user?.id || user?.userId || null,

    createdByName:
      user?.name || '',
  } as Partial<ProjectPartyLedger>),
);

  const invoiceItems =
    preparedItems.map((item) =>
      this.projectFinalInvoiceItemRepository.create({
        finalInvoiceId:
          savedInvoice.id,

        projectId: Number(
          body.projectId,
        ),

        materialId:
          item.materialId
            ? Number(item.materialId)
            : null,

        itemName:
          item.itemName || '',

        category:
          item.category || '',

        brand:
          item.brand || '',

        unit:
          item.unit || '',

          hsnCode:
  item.hsnCode || '',

        finalRate:
          item.finalRate,

        gstPercent:
          item.gstPercent,

        quantity:
          item.quantity,

        discountAmount:
          item.discountAmount,

        subtotalAmount:
          item.subtotalAmount,

        gstAmount:
          item.gstAmount,

        totalAmount:
          item.totalAmount,

        remarks:
          item.remarks || '',
      } as Partial<ProjectFinalInvoiceItem>),
    );

  await this.projectFinalInvoiceItemRepository.save(
    invoiceItems,
  );

  return {
    message:
      'Final invoice created successfully',

    invoice: savedInvoice,
  };
}

async createFinalInvoiceFromProforma(
  proformaInvoiceId: number,
  user: any,
) {
  const pi =
    await this.getProformaInvoiceById(
      proformaInvoiceId,
    );

  if (!pi) {
    throw new NotFoundException(
      'Proforma invoice not found',
    );
  }

  const isDealerInvoice =
    (pi as any).invoiceType === 'DEALER' ||
    !!(pi as any).dealerId;

  if (isDealerInvoice) {
    const existingDealerInvoice =
      await this.projectFinalInvoiceRepository.findOne({
        where: {
          dealerId: Number((pi as any).dealerId),
          invoiceType: 'DEALER',
        } as any,
      });

    if (existingDealerInvoice) {
      throw new BadRequestException(
        'Final invoice already exists for this dealer proforma invoice',
      );
    }

    const items = Array.isArray((pi as any).items)
      ? (pi as any).items
      : [];

    if (items.length === 0) {
      throw new BadRequestException(
        'Proforma invoice has no items',
      );
    }

    let subtotalAmount = 0;
    let discountAmount = 0;
    let gstAmount = 0;
    let totalAmount = 0;

    const preparedItems = items.map((item: any) => {
      const finalRate = Number(item.sellingRate || 0);
      const quantity = Number(item.quantity || 0);
      const gstPercent = Number(item.gstPercent || 0);
      const itemDiscount = Number(item.discountAmount || 0);

      const subtotal = finalRate * quantity;
      const taxable = subtotal - itemDiscount;
      const gst = (taxable * gstPercent) / 100;
      const total = taxable + gst;

      subtotalAmount += subtotal;
      discountAmount += itemDiscount;
      gstAmount += gst;
      totalAmount += total;

      return {
        ...item,
        finalRate,
        quantity,
        gstPercent,
        discountAmount: itemDiscount,
        subtotalAmount: subtotal,
        gstAmount: gst,
        totalAmount: total,
      };
    });

    const invoice: any =
      this.projectFinalInvoiceRepository.create({
        projectId: undefined,

        invoiceNumber:
          this.generateFinalInvoiceNumber(),

        status:
          ProjectFinalInvoiceStatus.GENERATED,

        subtotalAmount,
        discountAmount,
        gstAmount,
        totalAmount,

        paidAmount: 0,
        pendingAmount: totalAmount,

        invoiceDate: new Date(),

        remarks: `Generated from ${pi.invoiceNumber}`,

        createdBy:
          user?.id || user?.userId || null,

        createdByName:
          user?.name || '',

        createdByRole:
          Array.isArray(user?.roles)
            ? user.roles.join(', ')
            : '',
      } as Partial<ProjectFinalInvoice>);

    invoice.invoiceType = 'DEALER';
    invoice.dealerId = Number((pi as any).dealerId);
    invoice.dealerName = (pi as any).dealerName || '';
    invoice.dealerPhone = (pi as any).dealerPhone || '';
    invoice.dealerGstNumber = (pi as any).dealerGstNumber || '';
    invoice.dealerAddress = (pi as any).dealerAddress || '';

    const savedInvoice =
      await this.projectFinalInvoiceRepository.save(
        invoice as ProjectFinalInvoice,
      );

    await this.projectPartyLedgerRepository.save(
      this.projectPartyLedgerRepository.create({
        partyId: Number((pi as any).dealerId),

        partyName:
          (pi as any).dealerName ||
          'Dealer',

        partyType: 'DEALER',

        projectId: undefined,

        entryType:
          ProjectLedgerEntryType.DEBIT,

        sourceType:
          ProjectLedgerSourceType.FINAL_INVOICE,

        sourceId: savedInvoice.id,

        amount: Number(
          savedInvoice.totalAmount || 0,
        ),

        remarks: `Dealer Final Invoice ${
          savedInvoice.invoiceNumber ||
          savedInvoice.id
        }`,

        createdBy:
          user?.id || user?.userId || null,

        createdByName:
          user?.name || '',
      } as Partial<ProjectPartyLedger>),
    );

    const invoiceItems =
      preparedItems.map((item: any) =>
        this.projectFinalInvoiceItemRepository.create({
          finalInvoiceId:
            savedInvoice.id,

          projectId: undefined,

          materialId:
            item.materialId
              ? Number(item.materialId)
              : null,

          itemName:
            item.itemName || '',

          category:
            item.category || '',

          brand:
            item.brand || '',

          unit:
            item.unit || '',

          finalRate:
            item.finalRate,

          gstPercent:
            item.gstPercent,

          quantity:
            item.quantity,

          discountAmount:
            item.discountAmount,

          subtotalAmount:
            item.subtotalAmount,

          gstAmount:
            item.gstAmount,

          totalAmount:
            item.totalAmount,

          remarks:
            item.remarks || '',
        } as Partial<ProjectFinalInvoiceItem>),
      );

    await this.projectFinalInvoiceItemRepository.save(
      invoiceItems,
    );

    return {
      message:
        'Dealer final invoice created successfully',

      invoice: savedInvoice,
    };
  }

  const existingInvoice =
    await this.projectFinalInvoiceRepository.findOne({
      where: {
        projectId: Number(pi.projectId),
      },
    });

  if (existingInvoice) {
    throw new BadRequestException(
      'Final invoice already exists for this project',
    );
  }

  return this.createFinalInvoice(
    {
      projectId: pi.projectId,
      invoiceDate: new Date(),
      remarks: `Generated from ${pi.invoiceNumber}`,
      items: (pi.items || []).map((item: any) => ({
        materialId: item.materialId || null,
        itemName: item.itemName || '',
        category: item.category || '',
        brand: item.brand || '',
        unit: item.unit || '',
        finalRate: Number(item.sellingRate || 0),
        gstPercent: Number(item.gstPercent || 0),
        quantity: Number(item.quantity || 0),
        discountAmount: Number(item.discountAmount || 0),
        remarks: item.remarks || '',
      })),
    },
    user,
  );
}

async hideProformaInvoice(
  id: number,
  reason: string,
  user: any,
) {
  const invoice =
    await this.projectProformaInvoiceRepository.findOne({
      where: { id },
    });

  if (!invoice) {
    throw new NotFoundException(
      'Proforma invoice not found',
    );
  }

  invoice.isHidden = true;
  invoice.hiddenReason = reason || '';
  invoice.hiddenAt = new Date();
  invoice.hiddenBy =
    user?.id || user?.userId || null;
  invoice.hiddenByName =
    user?.name || '';

  await this.projectProformaInvoiceRepository.save(
    invoice,
  );

  return {
    success: true,
    message:
      'Proforma invoice hidden successfully',
  };
}

async getFinalInvoices(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const page =
    Number(filters?.page) > 0
      ? Number(filters?.page)
      : 1;

  const limit =
    Number(filters?.limit) > 0
      ? Math.min(Number(filters?.limit), 100)
      : 20;

  const skip = (page - 1) * limit;

  const query =
    this.projectFinalInvoiceRepository.createQueryBuilder(
      'invoice',
    );

  if (filters?.search) {
    query.andWhere(
      `
      LOWER(invoice."invoiceNumber") LIKE :search
      `,
      {
        search: `%${filters.search.toLowerCase()}%`,
      },
    );
  }

  if (filters?.status) {
    query.andWhere(
      'invoice.status = :status',
      {
        status: filters.status,
      },
    );
  }

  query.andWhere('invoice.isHidden = false');

  query.orderBy(
    'invoice.createdAt',
    'DESC',
  );

  query.skip(skip).take(limit);

  const [data, total] =
    await query.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages:
      Math.ceil(total / limit) || 1,
  };
}

async getFinalInvoiceById(
  id: number,
) {
  const invoice =
    await this.projectFinalInvoiceRepository.findOne({
      where: { id },
    });

  if (!invoice) {
    throw new NotFoundException(
      'Final invoice not found',
    );
  }

  const items =
    await this.projectFinalInvoiceItemRepository.find({
      where: {
        finalInvoiceId: id,
      },
      order: {
        createdAt: 'ASC',
      },
    });

  return {
    ...invoice,
    items,
  };
}

async hideFinalInvoice(
  id: number,
  reason: string,
  user: any,
) {
  const invoice =
    await this.projectFinalInvoiceRepository.findOne({
      where: { id },
    });

  if (!invoice) {
    throw new NotFoundException(
      'Final invoice not found',
    );
  }

  invoice.isHidden = true;
  invoice.hiddenReason = reason || '';
  invoice.hiddenAt = new Date();
  invoice.hiddenBy =
    user?.id || user?.userId || null;
  invoice.hiddenByName =
    user?.name || '';

  await this.projectFinalInvoiceRepository.save(
    invoice,
  );

  await this.projectPartyLedgerRepository.update(
    {
      sourceType:
        ProjectLedgerSourceType.FINAL_INVOICE,
      sourceId: invoice.id,
    },
    {
      isHidden: true,
      hiddenReason:
        reason || 'Final invoice hidden',
      hiddenAt: new Date(),
      hiddenBy:
        user?.id || user?.userId || null,
      hiddenByName:
        user?.name || '',
    },
  );

  return {
    success: true,
    message:
      'Final invoice hidden successfully',
  };
}

async generateFinalInvoicePdf(
  id: number,
  res: Response,
) {
  const invoice = await this.getFinalInvoiceById(id);

  const isDealerInvoice =
    (invoice as any).invoiceType === 'DEALER' ||
    !!(invoice as any).dealerId;

  const project = !isDealerInvoice && invoice.projectId
    ? await this.projectRepository.findOne({
        where: { id: Number(invoice.projectId) },
      })
    : null;

  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
  });

  const logoPath = path.join(
    process.cwd(),
    'src',
    'assets',
    'aditya-logo.jpg',
  );

  const fileName = `${invoice.invoiceNumber || `INV-${invoice.id}`}.pdf`;

  res.setHeader(
    'Content-Disposition',
    `inline; filename="${fileName}"`,
  );
  res.setHeader('Content-Type', 'application/pdf');

  doc.pipe(res);

  const pageLeft = 40;
  const pageRight = 555;
  const pageWidth = pageRight - pageLeft;

  const blue = '#1e40af';
  const orange = '#f97316';
  const lightBlue = '#eff6ff';
  const lightOrange = '#fff7ed';
  const border = '#d1d5db';
  const dark = '#111827';
  const muted = '#6b7280';

  const invoiceDate = invoice.invoiceDate
    ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN')
    : new Date(invoice.createdAt).toLocaleDateString('en-IN');

  doc.image(logoPath, 40, 20, {
    fit: [515, 110],
    align: 'center',
  });

  doc.y = 132;

  doc
    .roundedRect(pageLeft, doc.y, pageWidth, 32, 6)
    .fill(blue);

  doc
    .fillColor('#ffffff')
    .fontSize(17)
    .text('TAX INVOICE', pageLeft, doc.y + 8, {
      width: pageWidth,
      align: 'center',
    });

  doc.y += 38;

  doc
    .fontSize(8)
    .fillColor(muted)
    .text(
      'ADITYA SOLARS | adityasolarsraj01@gmail.com | 8306170662, 9887634474',
      pageLeft,
      doc.y,
      {
        width: pageWidth,
        align: 'center',
      },
    );

  doc
    .fontSize(8)
    .fillColor(muted)
    .text(
      'GSTIN: 08CVFPM5354P1ZV',
      pageLeft,
      doc.y + 12,
      {
        width: pageWidth,
        align: 'center',
      },
    );

  doc.y += 26;

  const cardY = doc.y;
  const cardW = 250;
  const cardH = 88;

  doc
    .roundedRect(pageLeft, cardY, cardW, cardH, 6)
    .fill(lightBlue)
    .strokeColor(border)
    .stroke();

  doc
    .roundedRect(pageLeft + 265, cardY, cardW, cardH, 6)
    .fill('#f9fafb')
    .strokeColor(border)
    .stroke();

  doc
    .fontSize(10)
    .fillColor(blue)
    .text('BILL TO', pageLeft + 12, cardY + 10);

  if (isDealerInvoice) {
    doc
      .fontSize(9)
      .fillColor(dark)
      .text(`Name: ${(invoice as any).dealerName || '-'}`, pageLeft + 12, cardY + 28, {
        width: 225,
      })
      .text(`Phone: ${(invoice as any).dealerPhone || '-'}`, pageLeft + 12, cardY + 43, {
        width: 225,
      })
      .text(`GST: ${(invoice as any).dealerGstNumber || '-'}`, pageLeft + 12, cardY + 58, {
        width: 225,
      })
      .text(`Address: ${(invoice as any).dealerAddress || '-'}`, pageLeft + 12, cardY + 73, {
        width: 225,
        height: 15,
      });
  } else {
    doc
      .fontSize(9)
      .fillColor(dark)
      .text(`Name: ${(project as any)?.customerName || '-'}`, pageLeft + 12, cardY + 28, {
        width: 225,
      })
      .text(`Phone: ${(project as any)?.customerPhone || '-'}`, pageLeft + 12, cardY + 43, {
        width: 225,
      })
      .text(`Address: ${(project as any)?.address || (project as any)?.gpsAddress || '-'}`, pageLeft + 12, cardY + 58, {
        width: 225,
        height: 28,
      });
  }

  doc
    .fontSize(10)
    .fillColor(orange)
    .text('DOCUMENT DETAILS', pageLeft + 277, cardY + 10);

  doc
    .fontSize(9)
    .fillColor(dark)
    .text(`Invoice No: ${invoice.invoiceNumber || '-'}`, pageLeft + 277, cardY + 28, {
      width: 220,
    })
    .text(`Date: ${invoiceDate}`, pageLeft + 277, cardY + 43, {
      width: 220,
    })
    .text(`Status: ${invoice.status || '-'}`, pageLeft + 277, cardY + 58, {
      width: 220,
    })
    .text(`Type: ${isDealerInvoice ? 'Dealer / Trading' : 'Project'}`, pageLeft + 277, cardY + 73, {
      width: 220,
    });

  doc.y = cardY + cardH + 16;

  doc
    .fontSize(12)
    .fillColor(dark)
    .text('Invoice Items', pageLeft, doc.y);

  doc.y += 18;

  const drawTableHeader = () => {
    const y = doc.y;

    doc
      .rect(pageLeft, y, pageWidth, 22)
      .fill(blue);

    doc
      .fontSize(8)
      .fillColor('#ffffff')
      .text('Sr', 42, y + 7, { width: 22 })
      .text('Item Name', 65, y + 7, { width: 165 })
      .text('HSN', 230, y + 7, { width: 45 })
      .text('Qty', 255, y + 7, { width: 30, align: 'right' })
      .text('Unit', 308, y + 7, { width: 38 })
      .text('Rate', 348, y + 7, { width: 55, align: 'right' })
      .text('GST%', 405, y + 7, { width: 32, align: 'right' })
      .text('GST Amt', 440, y + 7, { width: 52, align: 'right' })
      .text('Total', 494, y + 7, { width: 58, align: 'right' });

    doc.y = y + 22;
  };

  drawTableHeader();

  (invoice.items || []).forEach((item: any, index: number) => {
    const itemName = item.itemName || '-';

    const rowHeight = Math.max(
      28,
      Math.min(
        46,
        doc.fontSize(8).heightOfString(itemName, {
          width: 160,
        }) + 10,
      ),
    );

    if (doc.y + rowHeight > 700) {
      doc.addPage();
      doc.y = 40;
      drawTableHeader();
    }

    const y = doc.y;

    doc
      .rect(pageLeft, y, pageWidth, rowHeight)
      .fill(index % 2 === 0 ? '#f9fafb' : '#ffffff');

    doc
      .strokeColor(border)
      .lineWidth(0.4)
      .rect(pageLeft, y, pageWidth, rowHeight)
      .stroke();

    doc
      .fontSize(8)
      .fillColor(dark)
      .text(String(index + 1), 42, y + 7, { width: 22 })
      .text(itemName, 65, y + 7, {
        width: 160,
        height: rowHeight - 8,
      })
      .text(String((item as any).hsnCode || '-'), 230, y + 7, {
        width: 45,
      })
      .text(String(item.quantity || 0), 255, y + 7, {
        width: 30,
        align: 'right',
      })
      .text(String(item.unit || '-'), 308, y + 7, {
        width: 38,
      })
      .text(this.formatInr(item.finalRate || 0), 348, y + 7, {
        width: 55,
        align: 'right',
      })
      .text(`${item.gstPercent || 0}%`, 405, y + 7, {
        width: 32,
        align: 'right',
      })
      .text(this.formatInr(item.gstAmount || 0), 440, y + 7, {
        width: 52,
        align: 'right',
      })
      .text(this.formatInr(item.totalAmount || 0), 494, y + 7, {
        width: 58,
        align: 'right',
      });

    doc.y = y + rowHeight;
  });

  doc.y += 14;

  if (doc.y > 590) {
    doc.addPage();
    doc.y = 40;
  }

  const summaryX = 345;
  const summaryY = doc.y;
  const summaryW = 210;

  doc
    .roundedRect(summaryX, summaryY, summaryW, 130, 6)
    .fill('#f8fafc')
    .strokeColor(border)
    .stroke();

  const summaryLine = (
    label: string,
    value: any,
    yOffset: number,
    bold = false,
    color = dark,
  ) => {
    doc
      .fontSize(bold ? 11 : 9)
      .fillColor(color)
      .text(label, summaryX + 12, summaryY + yOffset, {
        width: 85,
      })
      .text(this.formatInr(value), summaryX + 100, summaryY + yOffset, {
        width: 95,
        align: 'right',
      });
  };

  summaryLine('Subtotal', invoice.subtotalAmount, 12);
  summaryLine('Discount', invoice.discountAmount, 30);
  summaryLine('GST', invoice.gstAmount, 48);

  doc
    .moveTo(summaryX + 10, summaryY + 67)
    .lineTo(summaryX + summaryW - 10, summaryY + 67)
    .strokeColor(orange)
    .lineWidth(1)
    .stroke();

  summaryLine('Grand Total', invoice.totalAmount, 74, true, '#16a34a');
  summaryLine('Paid', invoice.paidAmount, 96);
  summaryLine('Pending', invoice.pendingAmount, 112, true, '#dc2626');

  doc.y = summaryY + 144;

  doc
    .roundedRect(pageLeft, doc.y, pageWidth, 34, 6)
    .fill(lightOrange)
    .strokeColor(border)
    .stroke();

  doc
    .fontSize(9)
    .fillColor(orange)
    .text('Amount in Words', pageLeft + 12, doc.y + 8);

  doc
    .fontSize(10)
    .fillColor(dark)
    .text(
      this.numberToWordsIndian(Number(invoice.totalAmount || 0)),
      pageLeft + 12,
      doc.y + 20,
      {
        width: pageWidth - 24,
      },
    );

  doc.y += 46;

  const footerY = doc.y;

  doc
    .roundedRect(pageLeft, footerY, 250, 82, 6)
    .fill('#f9fafb')
    .strokeColor(border)
    .stroke();

  doc
    .fontSize(10)
    .fillColor(blue)
    .text('Terms & Conditions', pageLeft + 12, footerY + 10);

  doc
    .fontSize(8)
    .fillColor(dark)
    .text('1. This is a system-generated tax invoice.', pageLeft + 12, footerY + 28, {
      width: 225,
    })
    .text('2. Payment and warranty terms as per company policy.', pageLeft + 12, footerY + 42, {
      width: 225,
    })
    .text('3. Subject to applicable GST rules.', pageLeft + 12, footerY + 56, {
      width: 225,
    });

  doc
    .roundedRect(pageLeft + 265, footerY, 250, 82, 6)
    .fill('#f9fafb')
    .strokeColor(border)
    .stroke();

  doc
    .fontSize(10)
    .fillColor(blue)
    .text('For Aditya Solars', pageLeft + 277, footerY + 10);

  doc
    .fontSize(8)
    .fillColor(dark)
    .text(`Generated On: ${invoiceDate}`, pageLeft + 277, footerY + 28, {
      width: 220,
    })
    .text('Prepared By: System', pageLeft + 277, footerY + 42, {
      width: 220,
    });

  doc
    .fontSize(8)
    .fillColor(muted)
    .text('Authorized Signatory', pageLeft + 277, footerY + 62, {
      width: 220,
      align: 'right',
    });

  doc.end();
}

async createLedgerEntry(
  body: any,
  user: any,
) {
  if (!body?.partyName) {
    throw new BadRequestException('Party name is required');
  }

  if (!body?.entryType) {
    throw new BadRequestException('Entry type is required');
  }

  if (!body?.sourceType) {
    throw new BadRequestException('Source type is required');
  }

  const amount = Number(body.amount || 0);

  if (!amount || amount <= 0) {
    throw new BadRequestException('Valid amount is required');
  }

  const entry =
    this.projectPartyLedgerRepository.create({
      partyId: body.partyId ? Number(body.partyId) : null,
      partyName: body.partyName || '',
      partyType: body.partyType || '',
      projectId: body.projectId ? Number(body.projectId) : null,

      entryType:
        body.entryType === ProjectLedgerEntryType.CREDIT
          ? ProjectLedgerEntryType.CREDIT
          : ProjectLedgerEntryType.DEBIT,

      sourceType:
        body.sourceType || ProjectLedgerSourceType.MANUAL_ADJUSTMENT,

      sourceId: body.sourceId ? Number(body.sourceId) : null,

      amount,

      remarks: body.remarks || '',

      createdBy: user?.id || user?.userId || null,
      createdByName: user?.name || '',
    } as Partial<ProjectPartyLedger>);

  return this.projectPartyLedgerRepository.save(
    entry as ProjectPartyLedger,
  );
}

async getLedgerEntries(filters?: {
  partyName?: string;
  partyType?: string;
  projectId?: number;
  sourceType?: string;
}) {
  const query =
    this.projectPartyLedgerRepository.createQueryBuilder(
      'ledger',
    );

  if (filters?.partyName) {
    query.andWhere(
      'LOWER(ledger.partyName) LIKE :partyName',
      {
        partyName: `%${filters.partyName.toLowerCase()}%`,
      },
    );
  }

  if (filters?.partyType) {
    query.andWhere('ledger.partyType = :partyType', {
      partyType: filters.partyType,
    });
  }

  if (filters?.projectId) {
    query.andWhere('ledger.projectId = :projectId', {
      projectId: filters.projectId,
    });
  }

  if (filters?.sourceType) {
    query.andWhere('ledger.sourceType = :sourceType', {
      sourceType: filters.sourceType,
    });
  }

  query.andWhere('ledger.isHidden = false');

  query.orderBy('ledger.createdAt', 'DESC');

  return query.getMany();
}

async getLedgerOutstandingSummary() {
  const rows =
  await this.projectPartyLedgerRepository.find({
    where: {
      isHidden: false,
    },
  });

  let totalDebit = 0;
  let totalCredit = 0;

  for (const row of rows) {
    if (row.entryType === ProjectLedgerEntryType.DEBIT) {
      totalDebit += Number(row.amount || 0);
    }

    if (row.entryType === ProjectLedgerEntryType.CREDIT) {
      totalCredit += Number(row.amount || 0);
    }
  }

  return {
    totalDebit,
    totalCredit,
    netBalance: totalDebit - totalCredit,
  };
}

async hideLedgerEntry(
  id: number,
  currentUser: any,
) {
  const entry =
    await this.projectPartyLedgerRepository.findOne({
      where: { id },
    });

  if (!entry) {
    throw new NotFoundException(
      'Ledger entry not found',
    );
  }

  entry.isHidden = true;

  entry.hiddenAt = new Date();

  entry.hiddenBy =
    currentUser?.id ||
    currentUser?.userId ||
    null;

  entry.hiddenReason =
    'Hidden from accounts page';

  await this.projectPartyLedgerRepository.save(
    entry,
  );

  return {
    message:
      'Ledger entry hidden successfully',
  };
}

async getProjectAccountsSummary(
  projectId: number,
) {
  const rows =
    await this.projectPartyLedgerRepository.find({
      where: {
        projectId,
        isHidden: false,
      },
    });

  let customerInvoice = 0;
  let customerPayments = 0;

  let vendorPoAmount = 0;
  let vendorPayments = 0;

  for (const row of rows) {
    const amount = Number(row.amount || 0);

    if (
      row.sourceType ===
        ProjectLedgerSourceType.FINAL_INVOICE &&
      row.entryType ===
        ProjectLedgerEntryType.DEBIT
    ) {
      customerInvoice += amount;
    }

    if (
      row.sourceType ===
        ProjectLedgerSourceType.CUSTOMER_PAYMENT &&
      row.entryType ===
        ProjectLedgerEntryType.CREDIT
    ) {
      customerPayments += amount;
    }

    if (
      row.sourceType ===
        ProjectLedgerSourceType.PURCHASE_ORDER &&
      row.entryType ===
        ProjectLedgerEntryType.CREDIT
    ) {
      vendorPoAmount += amount;
    }

    if (
      row.sourceType ===
        ProjectLedgerSourceType.VENDOR_PAYMENT &&
      row.entryType ===
        ProjectLedgerEntryType.DEBIT
    ) {
      vendorPayments += amount;
    }
  }

  const customerOutstanding =
    customerInvoice - customerPayments;

  const vendorOutstanding =
    vendorPoAmount - vendorPayments;

  return {
    projectId,

    customerInvoice,
    customerPayments,
    customerOutstanding,

    vendorPoAmount,
    vendorPayments,
    vendorOutstanding,

    netProjectPosition:
      customerOutstanding -
      vendorOutstanding,
  };
}

async getPartyOutstandingSummary() {
  const rows =
    await this.projectPartyLedgerRepository.find({
      where: {
        isHidden: false,
      },
    });

  const partyMap: Record<
    string,
    {
      partyName: string;
      partyType: string;
      totalDebit: number;
      totalCredit: number;
      outstanding: number;
    }
  > = {};

  for (const row of rows) {
    const key = `${row.partyType || 'UNKNOWN'}-${row.partyName || 'Unknown'}`;

    if (!partyMap[key]) {
      partyMap[key] = {
        partyName: row.partyName || 'Unknown',
        partyType: row.partyType || 'UNKNOWN',
        totalDebit: 0,
        totalCredit: 0,
        outstanding: 0,
      };
    }

    if (row.entryType === ProjectLedgerEntryType.DEBIT) {
      partyMap[key].totalDebit += Number(row.amount || 0);
    }

    if (row.entryType === ProjectLedgerEntryType.CREDIT) {
      partyMap[key].totalCredit += Number(row.amount || 0);
    }
  }

  return Object.values(partyMap)
  .map((item) => {
    const outstanding =
      item.totalDebit - item.totalCredit;

    let settlementStatus = 'SETTLED';

    if (outstanding > 0) {
      settlementStatus = 'RECEIVABLE';
    }

    if (outstanding < 0) {
      settlementStatus = 'PAYABLE';
    }

    return {
      ...item,
      outstanding,
      settlementStatus,
      absoluteOutstanding:
        Math.abs(outstanding),
    };
  })
    .sort(
      (a, b) =>
        Math.abs(b.outstanding) - Math.abs(a.outstanding),
    );
}

async recordCustomerPayment(
  body: any,
  user: any,
) {
  if (!body?.partyName) {
    throw new BadRequestException('Customer name is required');
  }

  const amount = Number(body.amount || 0);

  if (!amount || amount <= 0) {
    throw new BadRequestException('Valid amount is required');
  }

  return this.projectPartyLedgerRepository.save(
    this.projectPartyLedgerRepository.create({
      partyId: body.partyId ? Number(body.partyId) : undefined,
      partyName: body.partyName || '',
      partyType: 'CUSTOMER',
      projectId: body.projectId ? Number(body.projectId) : undefined,

      entryType: ProjectLedgerEntryType.CREDIT,
      sourceType: ProjectLedgerSourceType.CUSTOMER_PAYMENT,
      sourceId: body.sourceId ? Number(body.sourceId) : undefined,

      amount,
      remarks: body.remarks || 'Customer payment received',

      createdBy: user?.id || user?.userId || null,
      createdByName: user?.name || '',
    } as Partial<ProjectPartyLedger>),
  );
}

async recordVendorPayment(
  body: any,
  user: any,
) {
  if (!body?.partyName) {
    throw new BadRequestException('Vendor name is required');
  }

  const amount = Number(body.amount || 0);

  if (!amount || amount <= 0) {
    throw new BadRequestException('Valid amount is required');
  }

  return this.projectPartyLedgerRepository.save(
    this.projectPartyLedgerRepository.create({
      partyId: body.partyId ? Number(body.partyId) : undefined,
      partyName: body.partyName || '',
      partyType: 'VENDOR',
      projectId: body.projectId ? Number(body.projectId) : undefined,

      entryType: ProjectLedgerEntryType.DEBIT,
      sourceType: ProjectLedgerSourceType.VENDOR_PAYMENT,
      sourceId: body.sourceId ? Number(body.sourceId) : undefined,

      amount,
      remarks: body.remarks || 'Vendor payment paid',

      createdBy: user?.id || user?.userId || null,
      createdByName: user?.name || '',
    } as Partial<ProjectPartyLedger>),
  );
}

async getPurchasableMaterialRequestItems(
  projectId?: number,
) {
  const query =
    this.projectMaterialRequestItemRepository.createQueryBuilder(
      'item',
    );

  query.where(
    'item.pendingQuantity > 0',
  );

  if (projectId) {
    query.andWhere(
      'item.projectId = :projectId',
      {
        projectId,
      },
    );
  }

  query.orderBy(
    'item.createdAt',
    'DESC',
  );

  return query.getMany();
}

async getProjectLoanDetail(projectId: number) {
  const project = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const detail =
    await this.projectLoanDetailRepository.findOne({
      where: { projectId },
      order: {
        createdAt: 'DESC',
      },
    });

  return detail || null;
}

async saveProjectLoanDetail(
  projectId: number,
  body: any,
  user: any,
) {
  const project = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  let detail =
    await this.projectLoanDetailRepository.findOne({
      where: { projectId },
      order: {
        createdAt: 'DESC',
      },
    });

  if (!detail) {
    detail = this.projectLoanDetailRepository.create({
      projectId,
    });
  }

  Object.assign(detail, {
    loanType: body.loanType || detail.loanType || null,
    bankName: body.bankName || '',
    applicationNumber: body.applicationNumber || '',
    requiresCoApplicant:
  body?.requiresCoApplicant === true ||
  body?.requiresCoApplicant === 'true' ||
  body?.requiresCoApplicant === 'YES',

coApplicantReason:
  String(body?.coApplicantReason || '').trim(),
    marginMoney: this.toNumberOrZero(body.marginMoney),
    sanctionAmount: this.toNumberOrZero(body.sanctionAmount),
    firstEmiDisbursementAmount: this.toNumberOrZero(
      body.firstEmiDisbursementAmount,
    ),
    firstEmiDisbursementDate: body.firstEmiDisbursementDate
      ? new Date(body.firstEmiDisbursementDate)
      : null,
    status: body.status || detail.status,
    remarks: body.remarks || '',
    updatedBy: user?.id || null,
    updatedByName: user?.name || user?.email || '',
  });

  return this.projectLoanDetailRepository.save(detail);
}

async getProjectLoanCoApplicants(projectId: number) {
  const project = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  return this.projectLoanCoApplicantRepository.find({
    where: {
      projectId,
      isActive: true,
    },
    order: {
      createdAt: 'DESC',
    },
  });
}

async saveProjectLoanCoApplicant(
  projectId: number,
  body: any,
  user: any,
) {
  const project = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const fullName = String(body?.fullName || '').trim();

  if (!fullName) {
    throw new BadRequestException('Co-applicant name is required');
  }

  const coApplicant =
    this.projectLoanCoApplicantRepository.create({
      projectId,
      fullName,
      relationWithCustomer:
        String(body?.relationWithCustomer || '').trim(),
      mobileNumber:
        String(body?.mobileNumber || '').trim(),
      aadhaarNumber:
        String(body?.aadhaarNumber || '').trim(),
      aadhaarFrontUrl:
        String(body?.aadhaarFrontUrl || '').trim(),
      aadhaarBackUrl:
        String(body?.aadhaarBackUrl || '').trim(),
      panNumber:
        String(body?.panNumber || '').trim(),
      panCardUrl:
        String(body?.panCardUrl || '').trim(),
      bankName:
        String(body?.bankName || '').trim(),
      accountNumber:
        String(body?.accountNumber || '').trim(),
      ifscCode:
        String(body?.ifscCode || '').trim(),
      bankProofUrl:
        String(body?.bankProofUrl || '').trim(),
      remarks:
        String(body?.remarks || '').trim(),
      isActive: true,
      createdBy: user?.id || user?.userId || null,
      createdByName: user?.name || user?.email || '',
      updatedBy: user?.id || user?.userId || null,
      updatedByName: user?.name || user?.email || '',
    });

  return this.projectLoanCoApplicantRepository.save(
    coApplicant,
  );
}

async updateProjectLoanCoApplicant(
  id: number,
  body: any,
  user: any,
) {
  const coApplicant =
    await this.projectLoanCoApplicantRepository.findOne({
      where: { id },
    });

  if (!coApplicant) {
    throw new NotFoundException('Co-applicant not found');
  }

  Object.assign(coApplicant, {
    fullName:
      body?.fullName !== undefined
        ? String(body.fullName || '').trim()
        : coApplicant.fullName,
    relationWithCustomer:
      body?.relationWithCustomer !== undefined
        ? String(body.relationWithCustomer || '').trim()
        : coApplicant.relationWithCustomer,
    mobileNumber:
      body?.mobileNumber !== undefined
        ? String(body.mobileNumber || '').trim()
        : coApplicant.mobileNumber,
    aadhaarNumber:
      body?.aadhaarNumber !== undefined
        ? String(body.aadhaarNumber || '').trim()
        : coApplicant.aadhaarNumber,
    aadhaarFrontUrl:
      body?.aadhaarFrontUrl !== undefined
        ? String(body.aadhaarFrontUrl || '').trim()
        : coApplicant.aadhaarFrontUrl,
    aadhaarBackUrl:
      body?.aadhaarBackUrl !== undefined
        ? String(body.aadhaarBackUrl || '').trim()
        : coApplicant.aadhaarBackUrl,
    panNumber:
      body?.panNumber !== undefined
        ? String(body.panNumber || '').trim()
        : coApplicant.panNumber,
    panCardUrl:
      body?.panCardUrl !== undefined
        ? String(body.panCardUrl || '').trim()
        : coApplicant.panCardUrl,
    bankName:
      body?.bankName !== undefined
        ? String(body.bankName || '').trim()
        : coApplicant.bankName,
    accountNumber:
      body?.accountNumber !== undefined
        ? String(body.accountNumber || '').trim()
        : coApplicant.accountNumber,
    ifscCode:
      body?.ifscCode !== undefined
        ? String(body.ifscCode || '').trim()
        : coApplicant.ifscCode,
    bankProofUrl:
      body?.bankProofUrl !== undefined
        ? String(body.bankProofUrl || '').trim()
        : coApplicant.bankProofUrl,
    remarks:
      body?.remarks !== undefined
        ? String(body.remarks || '').trim()
        : coApplicant.remarks,
    updatedBy: user?.id || user?.userId || null,
    updatedByName: user?.name || user?.email || '',
  });

  return this.projectLoanCoApplicantRepository.save(
    coApplicant,
  );
}

async deleteProjectLoanCoApplicant(
  id: number,
  user: any,
) {
  const coApplicant =
    await this.projectLoanCoApplicantRepository.findOne({
      where: { id },
    });

  if (!coApplicant) {
    throw new NotFoundException('Co-applicant not found');
  }

  coApplicant.isActive = false;
  coApplicant.updatedBy = user?.id || user?.userId || null;
  coApplicant.updatedByName = user?.name || user?.email || '';

  await this.projectLoanCoApplicantRepository.save(
    coApplicant,
  );

  return {
    message: 'Co-applicant removed successfully',
  };
}

async getProjectSubsidyDetail(projectId: number) {
  const project = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const detail =
    await this.projectSubsidyDetailRepository.findOne({
      where: { projectId },
      order: {
        createdAt: 'DESC',
      },
    });

  return detail || null;
}

async saveProjectSubsidyDetail(
  projectId: number,
  body: any,
  user: any,
) {
  const project = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  let detail =
    await this.projectSubsidyDetailRepository.findOne({
      where: { projectId },
      order: {
        createdAt: 'DESC',
      },
    });

  if (!detail) {
    detail = this.projectSubsidyDetailRepository.create({
      projectId,
    });
  }

  Object.assign(detail, {
    status: body.status || detail.status,
    dcrCertificateReady:
      body.dcrCertificateReady === true ||
      body.dcrCertificateReady === 'true',
    panelWarrantyReceived:
      body.panelWarrantyReceived === true ||
      body.panelWarrantyReceived === 'true',
    inverterWarrantyReceived:
      body.inverterWarrantyReceived === true ||
      body.inverterWarrantyReceived === 'true',
    vendorAgreementReady:
      body.vendorAgreementReady === true ||
      body.vendorAgreementReady === 'true',
    wcrReady:
      body.wcrReady === true ||
      body.wcrReady === 'true',
    portalSubmissionDate: body.portalSubmissionDate
      ? new Date(body.portalSubmissionDate)
      : null,
    subsidyRequestedDate: body.subsidyRequestedDate
      ? new Date(body.subsidyRequestedDate)
      : null,
    subsidyDisbursedDate: body.subsidyDisbursedDate
      ? new Date(body.subsidyDisbursedDate)
      : null,
    subsidyAmount: this.toNumberOrZero(body.subsidyAmount),
    remarks: body.remarks || '',
    updatedBy: user?.id || null,
    updatedByName: user?.name || user?.email || '',
  });

  return this.projectSubsidyDetailRepository.save(detail);
}

async getProjectElectricityDetail(projectId: number) {
  const project = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const detail =
    await this.projectElectricityDetailRepository.findOne({
      where: { projectId },
      order: {
        createdAt: 'DESC',
      },
    });

  return detail || null;
}

async saveProjectElectricityDetail(
  projectId: number,
  body: any,
  user: any,
) {
  const project = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  let detail =
    await this.projectElectricityDetailRepository.findOne({
      where: { projectId },
      order: {
        createdAt: 'DESC',
      },
    });

  if (!detail) {
    detail =
      this.projectElectricityDetailRepository.create({
        projectId,
      });
  }

  Object.assign(detail, {
    discomName: body.discomName || '',
    status: body.status || detail.status,
    fileSubmissionDate: body.fileSubmissionDate
      ? new Date(body.fileSubmissionDate)
      : null,
    siteVisitDate: body.siteVisitDate
      ? new Date(body.siteVisitDate)
      : null,
    demandDepositDate: body.demandDepositDate
      ? new Date(body.demandDepositDate)
      : null,
    demandDepositAmount: this.toNumberOrZero(
      body.demandDepositAmount,
    ),
    meterTestingDate: body.meterTestingDate
      ? new Date(body.meterTestingDate)
      : null,
    netMeterInstallationDate:
      body.netMeterInstallationDate
        ? new Date(body.netMeterInstallationDate)
        : null,
    remarks: body.remarks || '',
    updatedBy: user?.id || null,
    updatedByName:
      user?.name || user?.email || '',
  });

  return this.projectElectricityDetailRepository.save(
    detail,
  );
}

async assignContractorToProject(body: any, user: any) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];

  if (
    !roles.includes('OWNER') &&
    !roles.includes('PROJECT_MANAGER')
  ) {
    throw new ForbiddenException(
      'Only Owner or Project Manager can assign contractor',
    );
  }

  const projectId = Number(body?.projectId);
  const contractorId = Number(body?.contractorId);

  if (!projectId) {
    throw new BadRequestException('Project ID is required');
  }

  if (!contractorId) {
    throw new BadRequestException('Contractor is required');
  }

  const project = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const assignment =
    this.projectContractorAssignmentRepository.create({
      projectId,
      contractorId,
      contractorName: body?.contractorName || '',
      contractorPhone: body?.contractorPhone || '',
      workScope:
  body?.workScope ||
  ProjectContractorWorkScope.FULL_PROJECT,
      scheduledDate: body?.scheduledDate
        ? new Date(body.scheduledDate)
        : undefined,
      amount: this.toNumberOrZero(body?.amount),
      status:
        body?.status ||
        ProjectContractorWorkStatus.ASSIGNED,
      remarks: body?.remarks || '',
      assignedBy: user?.id || user?.userId || null,
      assignedByName:
        user?.name || user?.email || '',
    });

  return this.projectContractorAssignmentRepository.save(
    assignment,
  );
}

async getProjectContractorAssignments(projectId: number) {
  return this.projectContractorAssignmentRepository.find({
    where: { projectId },
    order: { createdAt: 'DESC' },
  });
}

async getMyContractorProjects(user: any) {
  const contractorId = Number(
    user?.id || user?.userId || user?.sub,
  );

  if (!contractorId) {
    throw new BadRequestException('Invalid contractor user');
  }

  const assignments =
    await this.projectContractorAssignmentRepository.find({
      where: { contractorId },
      order: { scheduledDate: 'DESC' },
    });

  const projectIds = [
    ...new Set(assignments.map((item) => item.projectId)),
  ];

  const projects = projectIds.length
    ? await this.projectRepository.findByIds(projectIds)
    : [];

  return assignments.map((item) => {
    const project = projects.find(
      (p) => p.id === item.projectId,
    );

    return {
      ...item,
      project: project
        ? {
            id: project.id,
            customerName: project.customerName || '',
            customerPhone: project.customerPhone || '',
            address: project.address || '',
            gpsAddress: project.gpsAddress || '',
            gpsLatitude: project.gpsLatitude || null,
            gpsLongitude: project.gpsLongitude || null,
            city: project.city || '',
            zone: project.zone || '',
            branchName: project.branchName || '',
            projectSize: project.projectSize || '',
            projectOwnerName: project.projectOwnerName || '',
          }
        : null,
    };
  });
}

private canManageCleaning(user: any) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];

  return (
    roles.includes('OWNER') ||
    roles.includes('PROJECT_MANAGER') ||
    roles.includes('CUSTOMER_MANAGER')
  );
}

async assignProjectCleaning(body: any, user: any) {
  if (!this.canManageCleaning(user)) {
    throw new ForbiddenException(
      'Only owner, project manager, or customer manager can assign cleaning',
    );
  }

  const projectId = Number(body?.projectId);
  const contractorId = Number(body?.contractorId);

  if (!projectId) {
    throw new BadRequestException('Project ID is required');
  }

  if (!contractorId) {
    throw new BadRequestException('Contractor is required');
  }

  if (!body?.cleaningDate) {
    throw new BadRequestException('Cleaning date is required');
  }

  const project = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const assignment =
    this.projectCleaningAssignmentRepository.create({
      projectId,
      contractorId,
      contractorName: body?.contractorName || '',
      contractorPhone: body?.contractorPhone || '',
      cleaningDate: body.cleaningDate,
      cleaningTime: body?.cleaningTime || '',
      status:
        body?.status ||
        ProjectCleaningStatus.ASSIGNED,
      remarks: body?.remarks || '',
      assignedBy: user?.id || user?.userId || null,
      assignedByName: user?.name || user?.email || '',
    });

  return this.projectCleaningAssignmentRepository.save(
    assignment,
  );
}

async getProjectCleaningAssignments(projectId: number, user: any) {
  return this.projectCleaningAssignmentRepository.find({
    where: {
      projectId,
      isHidden: false,
    },
    order: {
      cleaningDate: 'ASC' as any,
      cleaningTime: 'ASC' as any,
      createdAt: 'DESC',
    },
  });
}

async getMyCleaningAssignments(user: any) {
  const contractorId = Number(
    user?.id || user?.userId || user?.sub,
  );

  if (!contractorId) {
    throw new BadRequestException('Invalid contractor user');
  }

  const cleanings =
    await this.projectCleaningAssignmentRepository.find({
      where: {
        contractorId,
        isHidden: false,
      },
      order: {
        cleaningDate: 'ASC' as any,
        cleaningTime: 'ASC' as any,
      },
    });

  const projectIds = [
    ...new Set(cleanings.map((item) => item.projectId)),
  ];

  const projects = projectIds.length
    ? await this.projectRepository.findByIds(projectIds)
    : [];

  return cleanings.map((item) => {
    const project = projects.find(
      (p) => p.id === item.projectId,
    );

    return {
      ...item,
      project: project
        ? {
            id: project.id,
            customerName: project.customerName || '',
            customerPhone: project.customerPhone || '',
            address: project.address || '',
            gpsAddress: project.gpsAddress || '',
            gpsLatitude: project.gpsLatitude || null,
            gpsLongitude: project.gpsLongitude || null,
            city: project.city || '',
            zone: project.zone || '',
            branchName: project.branchName || '',
            projectSize: project.projectSize || '',
            projectOwnerName: project.projectOwnerName || '',
          }
        : null,
    };
  });
}

async updateCleaningAssignment(id: number, body: any, user: any) {
  const assignment =
    await this.projectCleaningAssignmentRepository.findOne({
      where: { id },
    });

  if (!assignment) {
    throw new NotFoundException('Cleaning assignment not found');
  }

  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const currentUserId = Number(
    user?.id || user?.userId || user?.sub,
  );

  const isAllowed =
    this.canManageCleaning(user) ||
    Number(assignment.contractorId) === currentUserId;

  if (!isAllowed) {
    throw new ForbiddenException(
      'You are not allowed to update this cleaning assignment',
    );
  }

  if (body?.status !== undefined) {
    assignment.status = body.status;
  }

  if (body?.remarks !== undefined && this.canManageCleaning(user)) {
    assignment.remarks = String(body.remarks || '').trim();
  }

  if (body?.cleaningDate !== undefined && this.canManageCleaning(user)) {
    assignment.cleaningDate = body.cleaningDate || null;
  }

  if (body?.cleaningTime !== undefined && this.canManageCleaning(user)) {
    assignment.cleaningTime = body.cleaningTime || '';
  }

  if (body?.completionRemarks !== undefined) {
    assignment.completionRemarks = String(
      body.completionRemarks || '',
    ).trim();
  }

  if (body?.proofUrl !== undefined) {
    assignment.proofUrl = body.proofUrl || '';
  }

  if (body?.proofLatitude !== undefined && body.proofLatitude !== '') {
    assignment.proofLatitude = Number(body.proofLatitude);
  }

  if (body?.proofLongitude !== undefined && body.proofLongitude !== '') {
    assignment.proofLongitude = Number(body.proofLongitude);
  }

  if (body?.proofGpsAddress !== undefined) {
    assignment.proofGpsAddress = body.proofGpsAddress || '';
  }

  if (body?.status === ProjectCleaningStatus.COMPLETED) {
    assignment.completedAt = new Date();
  }

  return this.projectCleaningAssignmentRepository.save(
    assignment,
  );
}

async hideCleaningAssignment(id: number, user: any) {
  if (!this.canManageCleaning(user)) {
    throw new ForbiddenException(
      'Only owner, project manager, or customer manager can hide cleaning assignment',
    );
  }

  const assignment =
    await this.projectCleaningAssignmentRepository.findOne({
      where: { id },
    });

  if (!assignment) {
    throw new NotFoundException('Cleaning assignment not found');
  }

  assignment.isHidden = true;
  assignment.hiddenAt = new Date();
  assignment.hiddenBy = user?.id || user?.userId || null;
  assignment.hiddenByName = user?.name || user?.email || '';

  return this.projectCleaningAssignmentRepository.save(
    assignment,
  );
}

async getCleaningReminders(type: string, user: any) {
  if (!this.canManageCleaning(user)) {
    throw new ForbiddenException(
      'Only owner, project manager, or customer manager can view cleaning reminders',
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const normalizedType = String(type || '').toUpperCase();

  const qb = this.projectCleaningAssignmentRepository
    .createQueryBuilder('cleaning')
    .where('cleaning.isHidden = false');

  if (normalizedType === 'TODAY') {
    qb.andWhere('cleaning.cleaningDate = :today', { today });
  }

  if (normalizedType === 'OVERDUE') {
    qb.andWhere('cleaning.cleaningDate < :today', { today });
    qb.andWhere('cleaning.status NOT IN (:...closedStatuses)', {
      closedStatuses: [
        ProjectCleaningStatus.COMPLETED,
        ProjectCleaningStatus.CANCELLED,
      ],
    });
  }

  if (normalizedType === 'UPCOMING') {
    qb.andWhere('cleaning.cleaningDate > :today', { today });
  }

  const cleanings = await qb
    .orderBy('cleaning.cleaningDate', 'ASC')
    .addOrderBy('cleaning.cleaningTime', 'ASC')
    .getMany();

  const projectIds = [
    ...new Set(cleanings.map((item) => item.projectId)),
  ];

  const projects = projectIds.length
    ? await this.projectRepository.findByIds(projectIds)
    : [];

  return cleanings.map((item) => {
    const project = projects.find(
      (p) => p.id === item.projectId,
    );

    return {
      ...item,
      project: project
        ? {
            customerName: project.customerName || '',
            customerPhone: project.customerPhone || '',
            address: project.address || '',
            gpsAddress: project.gpsAddress || '',
            gpsLatitude: project.gpsLatitude || null,
            gpsLongitude: project.gpsLongitude || null,
            city: project.city || '',
            branchName: project.branchName || '',
          }
        : null,
    };
  });
}

async getCleaningByDate(date: string, user: any) {
  if (!this.canManageCleaning(user)) {
    throw new ForbiddenException(
      'Only owner, project manager, or customer manager can view cleaning calendar',
    );
  }

  const cleanings =
    await this.projectCleaningAssignmentRepository.find({
      where: {
        cleaningDate: date as any,
        isHidden: false,
      },
      order: {
        cleaningTime: 'ASC' as any,
        createdAt: 'DESC',
      },
    });

  const projectIds = [
    ...new Set(cleanings.map((item) => item.projectId)),
  ];

  const projects = projectIds.length
    ? await this.projectRepository.findByIds(projectIds)
    : [];

  return cleanings.map((item) => {
    const project = projects.find(
      (p) => p.id === item.projectId,
    );

    return {
      ...item,
      project: project
        ? {
            customerName: project.customerName || '',
            customerPhone: project.customerPhone || '',
            address: project.address || '',
            gpsAddress: project.gpsAddress || '',
            gpsLatitude: project.gpsLatitude || null,
            gpsLongitude: project.gpsLongitude || null,
            city: project.city || '',
            branchName: project.branchName || '',
          }
        : null,
    };
  });
}

async requestContractorReschedule(body: any, user: any) {
  const assignmentType = String(body?.assignmentType || '');

  if (
    assignmentType !== ContractorRescheduleAssignmentType.SITE_WORK &&
    assignmentType !== ContractorRescheduleAssignmentType.CLEANING
  ) {
    throw new BadRequestException('Invalid assignment type');
  }

  const assignmentId = Number(body?.assignmentId);

  if (!assignmentId) {
    throw new BadRequestException('Assignment ID is required');
  }

  if (!body?.requestedDate) {
    throw new BadRequestException('Requested date is required');
  }

  if (!String(body?.reason || '').trim()) {
    throw new BadRequestException('Reason is required');
  }

  const currentUserId = Number(user?.id || user?.userId || user?.sub);

  let source: any = null;

  if (assignmentType === ContractorRescheduleAssignmentType.SITE_WORK) {
    source = await this.projectContractorAssignmentRepository.findOne({
      where: { id: assignmentId },
    });
  }

  if (assignmentType === ContractorRescheduleAssignmentType.CLEANING) {
    source = await this.projectCleaningAssignmentRepository.findOne({
      where: { id: assignmentId },
    });
  }

  if (!source) {
    throw new NotFoundException('Assignment not found');
  }

  if (Number(source.contractorId) !== currentUserId) {
    throw new ForbiddenException(
      'You can request postpone only for your own work',
    );
  }

  const existingPending =
    await this.projectContractorRescheduleRequestRepository.findOne({
      where: {
        assignmentType: assignmentType as any,
        assignmentId,
        status: ContractorRescheduleStatus.PENDING,
      },
    });

  if (existingPending) {
    throw new BadRequestException(
      'A pending postpone request already exists for this work',
    );
  }

  const request =
    this.projectContractorRescheduleRequestRepository.create({
      projectId: Number(source.projectId),
      assignmentType: assignmentType as any,
      assignmentId,
      contractorId: currentUserId,
      contractorName: source.contractorName || '',
      oldDate:
        assignmentType === ContractorRescheduleAssignmentType.SITE_WORK
          ? source.scheduledDate
            ? new Date(source.scheduledDate).toISOString().split('T')[0]
            : null
          : source.cleaningDate || null,
      oldTime:
        assignmentType === ContractorRescheduleAssignmentType.CLEANING
          ? source.cleaningTime || ''
          : '',
      requestedDate: body.requestedDate,
      requestedTime: body?.requestedTime || '',
      reason: String(body.reason || '').trim(),
      status: ContractorRescheduleStatus.PENDING,
    });

  return this.projectContractorRescheduleRequestRepository.save(request);
}

async getMyContractorRescheduleRequests(user: any) {
  const currentUserId = Number(user?.id || user?.userId || user?.sub);

  return this.projectContractorRescheduleRequestRepository.find({
    where: {
      contractorId: currentUserId,
    },
    order: {
      createdAt: 'DESC',
    },
  });
}

async getPendingContractorRescheduleRequests(user: any) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];

  if (
    !roles.includes('OWNER') &&
    !roles.includes('PROJECT_MANAGER')
  ) {
    throw new ForbiddenException(
      'Only owner or project manager can view postpone approvals',
    );
  }

  const requests =
    await this.projectContractorRescheduleRequestRepository.find({
      where: {
        status: ContractorRescheduleStatus.PENDING,
      },
      order: {
        createdAt: 'DESC',
      },
    });

  const projectIds = [
    ...new Set(requests.map((item) => item.projectId)),
  ];

  const projects = projectIds.length
    ? await this.projectRepository.findByIds(projectIds)
    : [];

  return requests.map((item) => {
    const project = projects.find((p) => p.id === item.projectId);

    return {
      ...item,
      project: project
        ? {
            customerName: project.customerName || '',
            customerPhone: project.customerPhone || '',
            city: project.city || '',
            branchName: project.branchName || '',
          }
        : null,
    };
  });
}

async approveContractorRescheduleRequest(
  id: number,
  body: any,
  user: any,
) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];

  if (
    !roles.includes('OWNER') &&
    !roles.includes('PROJECT_MANAGER')
  ) {
    throw new ForbiddenException(
      'Only owner or project manager can approve postpone request',
    );
  }

  const request =
    await this.projectContractorRescheduleRequestRepository.findOne({
      where: { id },
    });

  if (!request) {
    throw new NotFoundException('Postpone request not found');
  }

  if (request.status !== ContractorRescheduleStatus.PENDING) {
    throw new BadRequestException('Request already processed');
  }

  if (
    request.assignmentType === ContractorRescheduleAssignmentType.SITE_WORK
  ) {
    const assignment =
      await this.projectContractorAssignmentRepository.findOne({
        where: { id: request.assignmentId },
      });

    if (!assignment) {
      throw new NotFoundException('Site work assignment not found');
    }

    assignment.scheduledDate = request.requestedDate as any;

    await this.projectContractorAssignmentRepository.save(assignment);
  }

  if (
    request.assignmentType === ContractorRescheduleAssignmentType.CLEANING
  ) {
    const cleaning =
      await this.projectCleaningAssignmentRepository.findOne({
        where: { id: request.assignmentId },
      });

    if (!cleaning) {
      throw new NotFoundException('Cleaning assignment not found');
    }

    cleaning.cleaningDate = request.requestedDate;
    cleaning.cleaningTime = request.requestedTime || cleaning.cleaningTime;

    await this.projectCleaningAssignmentRepository.save(cleaning);
  }

  request.status = ContractorRescheduleStatus.APPROVED;
  request.approvedBy = user?.id || user?.userId || null;
  request.approvedByName = user?.name || user?.email || '';
  request.approvalNote = body?.approvalNote || '';
  request.approvedAt = new Date();

  return this.projectContractorRescheduleRequestRepository.save(request);
}

async rejectContractorRescheduleRequest(
  id: number,
  body: any,
  user: any,
) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];

  if (
    !roles.includes('OWNER') &&
    !roles.includes('PROJECT_MANAGER')
  ) {
    throw new ForbiddenException(
      'Only owner or project manager can reject postpone request',
    );
  }

  const request =
    await this.projectContractorRescheduleRequestRepository.findOne({
      where: { id },
    });

  if (!request) {
    throw new NotFoundException('Postpone request not found');
  }

  if (request.status !== ContractorRescheduleStatus.PENDING) {
    throw new BadRequestException('Request already processed');
  }

  request.status = ContractorRescheduleStatus.REJECTED;
  request.approvedBy = user?.id || user?.userId || null;
  request.approvedByName = user?.name || user?.email || '';
  request.approvalNote = body?.approvalNote || '';
  request.approvedAt = new Date();

  return this.projectContractorRescheduleRequestRepository.save(request);
}

async listContractorRescheduleRequests(
  filters: {
    page?: number;
    limit?: number;
    status?: string;
    assignmentType?: string;
    contractorName?: string;
    projectSearch?: string;
    city?: string;
    zone?: string;
    date?: string;
  },
  user: any,
) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];

  if (
    !roles.includes('OWNER') &&
    !roles.includes('PROJECT_MANAGER')
  ) {
    throw new ForbiddenException(
      'Only owner or project manager can view postpone requests',
    );
  }

  const page =
    Number(filters?.page) > 0 ? Number(filters.page) : 1;

  const limit =
    Number(filters?.limit) > 0
      ? Math.min(Number(filters.limit), 100)
      : 20;

  const skip = (page - 1) * limit;

  const query =
    this.projectContractorRescheduleRequestRepository
      .createQueryBuilder('request')
      .leftJoin(Project, 'project', 'project.id = request.projectId');

  if (filters?.status) {
    query.andWhere('request.status = :status', {
      status: filters.status,
    });
  }

  if (filters?.assignmentType) {
    query.andWhere('request.assignmentType = :assignmentType', {
      assignmentType: filters.assignmentType,
    });
  }

  if (filters?.contractorName) {
    query.andWhere(
      'LOWER(request.contractorName) LIKE :contractorName',
      {
        contractorName: `%${filters.contractorName.toLowerCase()}%`,
      },
    );
  }

  if (filters?.projectSearch) {
    query.andWhere(
      `
      CAST(request.projectId AS TEXT) LIKE :projectSearch
      OR LOWER(project.customerName) LIKE :projectSearch
      OR LOWER(project.customerPhone) LIKE :projectSearch
      `,
      {
        projectSearch: `%${String(filters.projectSearch)
          .toLowerCase()
          .trim()}%`,
      },
    );
  }

  if (filters?.city) {
    query.andWhere('LOWER(project.city) LIKE :city', {
      city: `%${filters.city.toLowerCase().trim()}%`,
    });
  }

  if (filters?.zone) {
    query.andWhere('LOWER(project.zone) LIKE :zone', {
      zone: `%${filters.zone.toLowerCase().trim()}%`,
    });
  }

  if (filters?.date) {
    query.andWhere('request.requestedDate = :date', {
      date: filters.date,
    });
  }

  query.orderBy('request.createdAt', 'DESC');
  query.skip(skip).take(limit);

  const [data, total] = await query.getManyAndCount();

  const projectIds = [
    ...new Set(data.map((item) => item.projectId)),
  ];

  const projects = projectIds.length
    ? await this.projectRepository.findByIds(projectIds)
    : [];

  const enrichedData = data.map((item) => {
    const project = projects.find(
      (p) => Number(p.id) === Number(item.projectId),
    );

    return {
      ...item,
      project: project
        ? {
            customerName: project.customerName || '',
            customerPhone: project.customerPhone || '',
            address: project.address || '',
            gpsAddress: project.gpsAddress || '',
            gpsLatitude: project.gpsLatitude || null,
            gpsLongitude: project.gpsLongitude || null,
            city: project.city || '',
            zone: project.zone || '',
            branchName: project.branchName || '',
            projectOwnerName: project.projectOwnerName || '',
          }
        : null,
    };
  });

  return {
    data: enrichedData,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async createCustomerUpdate(projectId: number, body: any, user: any) {
  const project = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  if (!body?.title && !body?.description) {
    throw new BadRequestException('Update title or description is required');
  }

  const update = this.projectCustomerUpdateRepository.create({
    projectId,
    title: body?.title || '',
    description: body?.description || '',
    updateType: body?.updateType || 'GENERAL',
    attachmentUrl: body?.attachmentUrl || '',
    attachmentName: body?.attachmentName || '',
    visibleToCustomer:
      body?.visibleToCustomer === true ||
      body?.visibleToCustomer === 'true',
    createdBy: user?.id || user?.userId || null,
    createdByName: user?.name || user?.email || '',
    createdByRole: Array.isArray(user?.roles)
      ? user.roles.join(', ')
      : '',
  });

  return this.projectCustomerUpdateRepository.save(update);
}

async getCustomerUpdates(
  projectId: number,
  filters: {
    page?: number;
    limit?: number;
    showHidden?: string;
    customerView?: string;
  },
  user: any,
) {
  const project = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  const page = Number(filters?.page) > 0 ? Number(filters.page) : 1;
  const limit =
    Number(filters?.limit) > 0 ? Math.min(Number(filters.limit), 100) : 20;
  const skip = (page - 1) * limit;

  const query = this.projectCustomerUpdateRepository
    .createQueryBuilder('update')
    .where('update.projectId = :projectId', { projectId });

  if (filters?.showHidden === 'true') {
    query.andWhere('update.isHidden = true');
  } else {
    query.andWhere('update.isHidden = false');
  }

  if (filters?.customerView === 'true') {
    query.andWhere('update.visibleToCustomer = true');
  }

  query.orderBy('update.createdAt', 'DESC');
  query.skip(skip).take(limit);

  const [data, total] = await query.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async hideCustomerUpdate(updateId: number, body: any, user: any) {
  const update = await this.projectCustomerUpdateRepository.findOne({
    where: { id: updateId },
  });

  if (!update) {
    throw new NotFoundException('Customer update not found');
  }

  update.isHidden = true;
  update.hiddenReason = body?.reason || '';
  update.hiddenAt = new Date();
  update.hiddenBy = user?.id || user?.userId || null;
  update.hiddenByName = user?.name || user?.email || '';

  return this.projectCustomerUpdateRepository.save(update);
}

async restoreCustomerUpdate(updateId: number, body: any, user: any) {
  const update = await this.projectCustomerUpdateRepository.findOne({
    where: { id: updateId },
  });

  if (!update) {
    throw new NotFoundException('Customer update not found');
  }

  update.isHidden = false;
  update.restoreReason = body?.reason || '';
  update.restoredAt = new Date();
  update.restoredBy = user?.id || user?.userId || null;
  update.restoredByName = user?.name || user?.email || '';

  return this.projectCustomerUpdateRepository.save(update);
}

async createProjectContractor(body: any, user: any) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];

  if (
    !roles.includes('OWNER') &&
    !roles.includes('PROJECT_MANAGER')
  ) {
    throw new ForbiddenException(
      'Only Owner or Project Manager can create contractor',
    );
  }

  if (!String(body?.contractorName || '').trim()) {
    throw new BadRequestException('Contractor name is required');
  }

  if (!String(body?.phone || '').trim()) {
    throw new BadRequestException('Contractor phone is required');
  }

  const contractor = this.projectContractorRepository.create({
    contractorName: String(body.contractorName).trim(),
    phone: String(body.phone).trim(),
    alternatePhone: String(body?.alternatePhone || '').trim(),
    city: String(body?.city || '').trim(),
    address: String(body?.address || '').trim(),
    linkedUserId: body?.linkedUserId ? Number(body.linkedUserId) : undefined,

    aadhaarFrontUrl: String(body?.aadhaarFrontUrl || '').trim(),
    aadhaarBackUrl: String(body?.aadhaarBackUrl || '').trim(),
    bankProofUrl: String(body?.bankProofUrl || '').trim(),
    accountHolderName: String(body?.accountHolderName || '').trim(),
    bankName: String(body?.bankName || '').trim(),
    accountNumber: String(body?.accountNumber || '').trim(),
    ifscCode: String(body?.ifscCode || '').trim(),
    upiId: String(body?.upiId || '').trim(),
    panNumber: String(body?.panNumber || '').trim(),

    remarks: String(body?.remarks || '').trim(),
    isActive: body?.isActive !== false,
    createdBy: user?.id || user?.userId || null,
    createdByName: user?.name || user?.email || '',
  });

  return this.projectContractorRepository.save(contractor);
}


async getProjectContractors(activeOnly = false) {
  return this.projectContractorRepository.find({
    where: activeOnly ? { isActive: true } : {},
    order: {
      contractorName: 'ASC',
    },
  });
}

async updateProjectContractor(id: number, body: any, user: any) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];

  if (
    !roles.includes('OWNER') &&
    !roles.includes('PROJECT_MANAGER')
  ) {
    throw new ForbiddenException(
      'Only Owner or Project Manager can update contractor',
    );
  }

  const contractor = await this.projectContractorRepository.findOne({
    where: { id },
  });

  if (!contractor) {
    throw new NotFoundException('Contractor not found');
  }

  Object.assign(contractor, {
    contractorName:
      body?.contractorName !== undefined
        ? String(body.contractorName || '').trim()
        : contractor.contractorName,
    phone:
      body?.phone !== undefined
        ? String(body.phone || '').trim()
        : contractor.phone,
    alternatePhone:
      body?.alternatePhone !== undefined
        ? String(body.alternatePhone || '').trim()
        : contractor.alternatePhone,
    city:
      body?.city !== undefined
        ? String(body.city || '').trim()
        : contractor.city,
    address:
      body?.address !== undefined
        ? String(body.address || '').trim()
        : contractor.address,
    linkedUserId:
      body?.linkedUserId !== undefined
        ? body.linkedUserId
          ? Number(body.linkedUserId)
          : null
        : contractor.linkedUserId,

    aadhaarFrontUrl:
      body?.aadhaarFrontUrl !== undefined
        ? String(body.aadhaarFrontUrl || '').trim()
        : contractor.aadhaarFrontUrl,
    aadhaarBackUrl:
      body?.aadhaarBackUrl !== undefined
        ? String(body.aadhaarBackUrl || '').trim()
        : contractor.aadhaarBackUrl,
    bankProofUrl:
      body?.bankProofUrl !== undefined
        ? String(body.bankProofUrl || '').trim()
        : contractor.bankProofUrl,
    accountHolderName:
      body?.accountHolderName !== undefined
        ? String(body.accountHolderName || '').trim()
        : contractor.accountHolderName,
    bankName:
      body?.bankName !== undefined
        ? String(body.bankName || '').trim()
        : contractor.bankName,
    accountNumber:
      body?.accountNumber !== undefined
        ? String(body.accountNumber || '').trim()
        : contractor.accountNumber,
    ifscCode:
      body?.ifscCode !== undefined
        ? String(body.ifscCode || '').trim()
        : contractor.ifscCode,
    upiId:
      body?.upiId !== undefined
        ? String(body.upiId || '').trim()
        : contractor.upiId,
    panNumber:
      body?.panNumber !== undefined
        ? String(body.panNumber || '').trim()
        : contractor.panNumber,

    remarks:
      body?.remarks !== undefined
        ? String(body.remarks || '').trim()
        : contractor.remarks,
    isActive:
      body?.isActive !== undefined
        ? body.isActive
        : contractor.isActive,
  });

  return this.projectContractorRepository.save(contractor);
}

async disableProjectContractor(id: number, user: any) {
  return this.updateProjectContractor(
    id,
    { isActive: false },
    user,
  );
}

async enableProjectContractor(id: number, user: any) {
  return this.updateProjectContractor(
    id,
    { isActive: true },
    user,
  );
}

async getContractorAssignmentRegister(filters: any, user: any) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];

  const canView =
    roles.includes('OWNER') ||
    roles.includes('PROJECT_MANAGER');

  if (!canView) {
    throw new ForbiddenException(
      'You are not allowed to view contractor assignment register',
    );
  }

  const page =
    Number(filters?.page) > 0 ? Number(filters.page) : 1;

  const limit =
    Number(filters?.limit) > 0
      ? Math.min(Number(filters.limit), 100)
      : 20;

  const skip = (page - 1) * limit;

  const applyFilters = (query: any) => {
    if (filters?.search) {
      query.andWhere(
        `
        LOWER(assignment.contractorName) LIKE :search
        OR LOWER(assignment.contractorPhone) LIKE :search
        OR CAST(assignment.projectId AS TEXT) LIKE :search
        `,
        {
          search: `%${String(filters.search).toLowerCase()}%`,
        },
      );
    }

    if (filters?.status) {
      query.andWhere('assignment.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.workScope) {
      query.andWhere('assignment.workScope = :workScope', {
        workScope: filters.workScope,
      });
    }

    if (filters?.contractorId) {
      query.andWhere(
        'assignment.contractorId = :contractorId',
        {
          contractorId: Number(filters.contractorId),
        },
      );
    }

    if (filters?.projectId) {
      query.andWhere('assignment.projectId = :projectId', {
        projectId: Number(filters.projectId),
      });
    }

    return query;
  };

  const dataQuery =
    this.projectContractorAssignmentRepository
      .createQueryBuilder('assignment');

  applyFilters(dataQuery);

  dataQuery
    .orderBy('assignment.createdAt', 'DESC')
    .skip(skip)
    .take(limit);

  const [data, total] =
    await dataQuery.getManyAndCount();

    const assignmentIds = data.map((item) => item.id);

const proofs = assignmentIds.length
  ? await this.projectContractorProofRepository.find({
      where: {
        assignmentId: In(assignmentIds),
      },
    })
  : [];

const dataWithProgress = data.map((assignment) => {
  const requiredProofs =
    this.getRequiredContractorProofTypesByScopeForRegister(
      String((assignment as any).workScope || 'FULL_PROJECT'),
    );

  const assignmentProofs = proofs.filter(
    (proof) => proof.assignmentId === assignment.id,
  );

  const uploadedRequiredCount = requiredProofs.filter(
    (requiredProof) =>
      assignmentProofs.some(
        (proof) => proof.proofType === requiredProof,
      ),
  ).length;

  const totalRequired = requiredProofs.length;

  const percentage =
    totalRequired > 0
      ? Math.round((uploadedRequiredCount / totalRequired) * 100)
      : 0;

  return {
    ...assignment,
    proofProgress: {
      uploadedRequiredCount,
      totalRequired,
      percentage,
    },
  };
});

  const summaryBaseQuery =
    this.projectContractorAssignmentRepository
      .createQueryBuilder('assignment');

  applyFilters(summaryBaseQuery);

  const allFilteredAssignments =
    await summaryBaseQuery.getMany();

  const summary = {
    totalAssignments: allFilteredAssignments.length,
    totalProjects: new Set(
      allFilteredAssignments.map((item) => item.projectId),
    ).size,
    totalContractors: new Set(
      allFilteredAssignments.map((item) => item.contractorId),
    ).size,
    assigned: allFilteredAssignments.filter(
      (item) => item.status === ProjectContractorWorkStatus.ASSIGNED,
    ).length,
    inProgress: allFilteredAssignments.filter(
      (item) => item.status === ProjectContractorWorkStatus.IN_PROGRESS,
    ).length,
    onHold: allFilteredAssignments.filter(
      (item) => item.status === ProjectContractorWorkStatus.ON_HOLD,
    ).length,
    pendingFinalProofs: allFilteredAssignments.filter(
      (item) =>
        item.status ===
        ProjectContractorWorkStatus.PENDING_FINAL_PROOFS,
    ).length,
    completed: allFilteredAssignments.filter(
      (item) => item.status === ProjectContractorWorkStatus.COMPLETED,
    ).length,
  };

  return {
  data: dataWithProgress,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
  summary,
};
}

async updateContractorAssignment(
  assignmentId: number,
  body: any,
  user: any,
) {
  const assignment =
    await this.projectContractorAssignmentRepository.findOne({
      where: { id: assignmentId },
    });

  if (!assignment) {
    throw new NotFoundException(
      'Contractor assignment not found',
    );
  }

  const roles = Array.isArray(user?.roles)
    ? user.roles
    : [];

  const currentUserId = Number(
    user?.id || user?.userId || user?.sub,
  );

  const isAllowed =
    roles.includes('OWNER') ||
    roles.includes('PROJECT_MANAGER') ||
    Number(assignment.contractorId) === currentUserId;

  if (!isAllowed) {
    throw new ForbiddenException(
      'You are not allowed to update this contractor work',
    );
  }

  const nextStatus = body?.status;

  if (nextStatus === ProjectContractorWorkStatus.COMPLETED) {
    const proofs =
      await this.projectContractorProofRepository.find({
        where: {
          assignmentId,
        },
      });

    const uploadedTypes = new Set(
      proofs.map((proof) => String(proof.proofType)),
    );

    const requiredTypes =
  this.getRequiredContractorProofTypesByScope(
    String(
      (assignment as any).workScope ||
        ProjectContractorWorkScope.FULL_PROJECT,
    ),
  );

    const missingTypes = requiredTypes.filter(
      (type) => !uploadedTypes.has(type),
    );

    if (missingTypes.length > 0) {
      throw new BadRequestException(
        `Cannot mark completed. Missing proofs: ${missingTypes
          .map((type) => type.replace(/_/g, ' '))
          .join(', ')}`,
      );
    }
  }

  if (body?.status) {
  const oldStatus = assignment.status;
  const newStatus = body.status;

  assignment.status = newStatus;

  if (
    newStatus === ProjectContractorWorkStatus.IN_PROGRESS &&
    oldStatus !== ProjectContractorWorkStatus.IN_PROGRESS &&
    !assignment.startedAt
  ) {
    assignment.startedAt = new Date();
  }

  if (
    newStatus === ProjectContractorWorkStatus.COMPLETED &&
    oldStatus !== ProjectContractorWorkStatus.COMPLETED &&
    !assignment.completedAt
  ) {
    assignment.completedAt = new Date();
  }

  if (
    newStatus !== ProjectContractorWorkStatus.COMPLETED &&
    oldStatus === ProjectContractorWorkStatus.COMPLETED
  ) {
    assignment.completedAt = null as any;
  }
}

  if (body?.remarks !== undefined) {
    assignment.remarks = String(
      body.remarks || '',
    ).trim();
  }

  return this.projectContractorAssignmentRepository.save(
    assignment,
  );
}

async uploadContractorProofs(
  files: any[],
  body: any,
  user: any,
) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new BadRequestException('Proof photos are required');
  }

  const assignmentId = Number(body?.assignmentId);
  const projectId = Number(body?.projectId);

  if (!assignmentId || !projectId) {
    throw new BadRequestException('Assignment ID and Project ID are required');
  }

  const assignment =
    await this.projectContractorAssignmentRepository.findOne({
      where: { id: assignmentId },
    });

  if (!assignment) {
    throw new NotFoundException('Contractor assignment not found');
  }

  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const currentUserId = Number(user?.id || user?.userId || user?.sub);

  const isAllowed =
    roles.includes('OWNER') ||
    roles.includes('PROJECT_MANAGER') ||
    Number(assignment.contractorId) === currentUserId;

  if (!isAllowed) {
    throw new ForbiddenException('You are not allowed to upload proof for this work');
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket =
    process.env.SUPABASE_PROJECT_DOCUMENTS_BUCKET || 'project-documents';

  if (!supabaseUrl || !serviceKey) {
    throw new BadRequestException('Supabase storage is not configured');
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const uploadedProofs: ProjectContractorProof[] = [];

  for (const file of files) {
    const mimeType = String(file.mimetype || '');

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      throw new BadRequestException('Only JPG, PNG, and WEBP proof photos are allowed');
    }

    const originalName = String(file.originalname || 'proof');
    const extension = originalName.includes('.')
      ? originalName.split('.').pop()
      : mimeType.split('/')[1] || 'jpg';

    const safeExtension = String(extension || 'jpg').replace(/[^a-zA-Z0-9]/g, '');

    const filePath = `projects/project-${projectId}/contractor-proofs/assignment-${assignmentId}/${Date.now()}-${randomUUID()}.${safeExtension}`;

    const uploadResult = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadResult.error) {
      throw new BadRequestException(uploadResult.error.message);
    }

    const publicUrlResult = supabase.storage.from(bucket).getPublicUrl(filePath);

    const proof = this.projectContractorProofRepository.create({
      projectId,
      assignmentId,
      proofType:
        body?.proofType || ProjectContractorProofType.OTHER,
      fileUrl: publicUrlResult.data.publicUrl,
      latitude:
        body?.latitude === '' || body?.latitude === undefined
          ? undefined
          : Number(body.latitude),
      longitude:
        body?.longitude === '' || body?.longitude === undefined
          ? undefined
          : Number(body.longitude),
      gpsAddress: body?.gpsAddress || '',
      remarks: body?.remarks || '',
      uploadedBy: currentUserId || undefined,
      uploadedByName: user?.name || user?.email || '',
    });

    const saved = await this.projectContractorProofRepository.save(
  proof as ProjectContractorProof,
);

uploadedProofs.push(saved);
  }

  return {
    message: `${uploadedProofs.length} contractor proof photo(s) uploaded`,
    proofs: uploadedProofs,
  };
}

async getContractorProofs(assignmentId: number, user: any) {
  const assignment =
    await this.projectContractorAssignmentRepository.findOne({
      where: { id: assignmentId },
    });

  if (!assignment) {
    throw new NotFoundException('Contractor assignment not found');
  }

  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const currentUserId = Number(user?.id || user?.userId || user?.sub);

  const isAllowed =
  roles.includes('OWNER') ||
  roles.includes('PROJECT_MANAGER') ||
  roles.includes('SUBSIDY_MANAGER') ||
  Number(assignment.contractorId) === currentUserId;

  if (!isAllowed) {
    throw new ForbiddenException('You are not allowed to view these proofs');
  }

  return this.projectContractorProofRepository.find({
    where: { assignmentId },
    order: { createdAt: 'DESC' },
  });
}

async addContractorComment(
  body: any,
  user: any,
) {
  const assignmentId = Number(body?.assignmentId);
  const projectId = Number(body?.projectId);

  if (!assignmentId || !projectId) {
    throw new BadRequestException(
      'Assignment ID and Project ID are required',
    );
  }

  if (!String(body?.comment || '').trim()) {
    throw new BadRequestException(
      'Comment is required',
    );
  }

  const assignment =
    await this.projectContractorAssignmentRepository.findOne({
      where: { id: assignmentId },
    });

  if (!assignment) {
    throw new NotFoundException(
      'Contractor assignment not found',
    );
  }

  const roles = Array.isArray(user?.roles)
    ? user.roles
    : [];

  const currentUserId = Number(
    user?.id || user?.userId || user?.sub,
  );

  const isAllowed =
    roles.includes('OWNER') ||
    roles.includes('PROJECT_MANAGER') ||
    Number(assignment.contractorId) === currentUserId;

  if (!isAllowed) {
    throw new ForbiddenException(
      'You are not allowed to comment on this contractor work',
    );
  }

  const comment =
    this.projectContractorCommentRepository.create({
      projectId,
      assignmentId,
      comment: String(body.comment).trim(),
      commentType:
        String(body?.commentType || 'GENERAL').trim(),
      createdBy: currentUserId || undefined,
      createdByName:
        user?.name || user?.email || '',
      createdByRole: Array.isArray(user?.roles)
        ? user.roles.join(', ')
        : '',
    });

  return this.projectContractorCommentRepository.save(
    comment,
  );
}

async getContractorComments(
  assignmentId: number,
  user: any,
) {
  const assignment =
    await this.projectContractorAssignmentRepository.findOne({
      where: { id: assignmentId },
    });

  if (!assignment) {
    throw new NotFoundException(
      'Contractor assignment not found',
    );
  }

  const roles = Array.isArray(user?.roles)
    ? user.roles
    : [];

  const currentUserId = Number(
    user?.id || user?.userId || user?.sub,
  );

  const isAllowed =
    roles.includes('OWNER') ||
    roles.includes('PROJECT_MANAGER') ||
    Number(assignment.contractorId) === currentUserId;

  if (!isAllowed) {
    throw new ForbiddenException(
      'You are not allowed to view contractor comments',
    );
  }

  return this.projectContractorCommentRepository.find({
    where: { assignmentId },
    order: { createdAt: 'DESC' },
  });
}

async getDealerCatalog(query: any) {
  const page = Math.max(Number(query?.page || 1), 1);
  const limit = Math.min(Math.max(Number(query?.limit || 20), 1), 100);
  const skip = (page - 1) * limit;

  const search = String(query?.search || '').trim().toLowerCase();

  const qb = this.projectMaterialMasterRepository
    .createQueryBuilder('material')
    .where('material.isActive = true')
    .orderBy('material.name', 'ASC')
    .skip(skip)
    .take(limit);

  if (search) {
    qb.andWhere(
      `(
        LOWER(material.name) LIKE :search
        OR LOWER(material.category) LIKE :search
        OR LOWER(material.brand) LIKE :search
      )`,
      {
        search: `%${search}%`,
      },
    );
  }

  const [materials, total] = await qb.getManyAndCount();

  const stockRows = await this.projectStockItemRepository.find({
    where: {
      isHidden: false,
    },
  });

  const stockByMaterial = new Map<number, number>();

  for (const stock of stockRows) {
    const materialId = Number((stock as any).materialId || 0);

    stockByMaterial.set(
      materialId,
      Number(stockByMaterial.get(materialId) || 0) +
        Number((stock as any).currentQuantity || 0),
    );
  }

  const data = materials.map((material) => {
    const sellingRate = this.getMaterialSellingRate(material);
    const gstPercent = Number((material as any).gstPercent || 0);
    const sellingRateWithGst =
      sellingRate + (sellingRate * gstPercent) / 100;

    return {
      id: material.id,
      name: material.name,
      category: material.category,
      brand: material.brand,
      unit: material.unit,
      hsnCode: (material as any).hsnCode || '',
      gstPercent,
      sellingRate,
      sellingRateWithGst,
      availableQuantity: stockByMaterial.get(material.id) || 0,
      expectedAvailabilityDate: null,
      remarks: material.remarks || '',
    };
  });

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async getDealers(query: any) {
  const page = Math.max(Number(query?.page || 1), 1);
  const limit = Math.min(Math.max(Number(query?.limit || 20), 1), 100);
  const skip = (page - 1) * limit;

  const search = String(query?.search || '').trim().toLowerCase();
  const branch = String(query?.branch || '').trim().toLowerCase();
  const showHidden = String(query?.showHidden || 'false') === 'true';

  const qb = this.projectVendorRepository
    .createQueryBuilder('dealer')
    .where(
      `(
        dealer.partyType = :dealerType
        OR dealer.canBuyFromUs = true
      )`,
      {
        dealerType: 'DEALER',
      },
    )
    .orderBy('dealer.vendorName', 'ASC')
    .skip(skip)
    .take(limit);

  if (!showHidden) {
    qb.andWhere('dealer.isActive = true');
  } else {
    qb.andWhere('dealer.isActive = false');
  }

  if (search) {
    qb.andWhere(
      `(
        LOWER(dealer.vendorName) LIKE :search
        OR LOWER(dealer.phone) LIKE :search
        OR LOWER(dealer.gstNumber) LIKE :search
        OR LOWER(dealer.city) LIKE :search
      )`,
      {
        search: `%${search}%`,
      },
    );
  }

  if (branch) {
    qb.andWhere('LOWER(dealer.city) LIKE :branch', {
      branch: `%${branch}%`,
    });
  }

  const [data, total] = await qb.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async createDealer(body: any) {
  if (!String(body?.vendorName || '').trim()) {
    throw new BadRequestException('Dealer name is required');
  }

  const dealer = this.projectVendorRepository.create({
    vendorName: String(body.vendorName || '').trim(),
    contactPerson: body?.contactPerson || '',
    phone: body?.phone || '',
    email: body?.email || '',
    gstNumber: body?.gstNumber || '',
    address: body?.address || '',
    city: body?.city || '',
    state: body?.state || '',
    materialCategory: body?.materialCategory || '',
    remarks: body?.remarks || '',
    partyType: 'DEALER',
    canSellToUs: false,
    canBuyFromUs: true,
    openingBalance: Number(body?.openingBalance || 0),
    isActive: true,
  });

  return this.projectVendorRepository.save(dealer);
}

async createDealerOrder(body: any, user: any) {
  const dealerId = Number(body?.dealerId || 0);

  if (!dealerId) {
    throw new BadRequestException('Dealer is required');
  }

  const dealer = await this.projectVendorRepository.findOne({
    where: {
      id: dealerId,
    },
  });

  if (!dealer || dealer.isActive === false) {
    throw new NotFoundException('Active dealer not found');
  }

  const items = Array.isArray(body?.items) ? body.items : [];

  if (!items.length) {
    throw new BadRequestException('At least one material is required');
  }

  let subtotalAmount = 0;
  let discountAmount = 0;
  let gstAmount = 0;
  let totalAmount = 0;

  const order = this.projectDealerOrderRepository.create({
    orderNumber: this.generateDealerOrderNumber(),
    dealerId: dealer.id,
    dealerName: dealer.vendorName,
    dealerPhone: dealer.phone || '',
    dealerGstNumber: dealer.gstNumber || '',
    dealerAddress: dealer.address || '',
    branchName: body?.branchName || dealer.city || '',
    status: ProjectDealerOrderStatus.SUBMITTED,
    paymentType:
      body?.paymentType === ProjectDealerPaymentType.CREDIT
        ? ProjectDealerPaymentType.CREDIT
        : body?.paymentType === ProjectDealerPaymentType.ONLINE
          ? ProjectDealerPaymentType.ONLINE
          : body?.paymentType === ProjectDealerPaymentType.CHEQUE
            ? ProjectDealerPaymentType.CHEQUE
            : ProjectDealerPaymentType.CASH,
    creditDueDate: body?.creditDueDate ? new Date(body.creditDueDate) : null,
    expectedDeliveryAt: body?.expectedDeliveryAt
      ? new Date(body.expectedDeliveryAt)
      : null,
    assignedStaffName: body?.assignedStaffName || '',
    assignedStaffPhone: body?.assignedStaffPhone || '',
    createdBy: user?.id || user?.userId || null,
    createdByName: user?.name || user?.email || '',
    remarks: body?.remarks || '',
    } as Partial<ProjectDealerOrder>);

  const savedOrder = await this.projectDealerOrderRepository.save(order);

  const itemRows: ProjectDealerOrderItem[] = [];

  for (const item of items) {
    const materialId = Number(item?.materialId || 0);
    const quantity = Number(item?.quantity || 0);

    if (!materialId || quantity <= 0) {
      continue;
    }

    const material = await this.projectMaterialMasterRepository.findOne({
      where: {
        id: materialId,
        isActive: true,
      },
    });

    if (!material) {
      continue;
    }

    const sellingRate = this.getMaterialSellingRate(material);
    const gstPercent = Number((material as any).gstPercent || 0);
    const itemDiscount = Number(item?.discountAmount || 0);
    const baseSubtotal = sellingRate * quantity;
    const taxableSubtotal = Math.max(baseSubtotal - itemDiscount, 0);
    const itemGstAmount = (taxableSubtotal * gstPercent) / 100;
    const itemTotal = taxableSubtotal + itemGstAmount;

    subtotalAmount += baseSubtotal;
    discountAmount += itemDiscount;
    gstAmount += itemGstAmount;
    totalAmount += itemTotal;

    const stockRows = await this.projectStockItemRepository.find({
      where: {
        materialId,
        isHidden: false,
      },
    });

    const stockAvailableQuantity = stockRows.reduce(
      (sum, stock) => sum + Number((stock as any).currentQuantity || 0),
      0,
    );

    itemRows.push(
      this.projectDealerOrderItemRepository.create({
        dealerOrderId: savedOrder.id,
        materialId,
        materialName: material.name,
        category: material.category,
        brand: material.brand,
        unit: material.unit,
        hsnCode: (material as any).hsnCode || '',
        quantity,
        acceptedQuantity: 0,
        pendingQuantity: quantity,
        sellingRate,
        gstPercent,
        discountAmount: itemDiscount,
        subtotalAmount: baseSubtotal,
        gstAmount: itemGstAmount,
        totalAmount: itemTotal,
        stockAvailableQuantity,
        remarks: item?.remarks || '',
      }),
    );
  }

  if (!itemRows.length) {
    await this.projectDealerOrderRepository.delete(savedOrder.id);
    throw new BadRequestException('No valid material items found');
  }

  await this.projectDealerOrderItemRepository.save(itemRows);

  savedOrder.subtotalAmount = subtotalAmount;
  savedOrder.discountAmount = discountAmount;
  savedOrder.gstAmount = gstAmount;
  savedOrder.totalAmount = totalAmount;
  savedOrder.pendingAmount = totalAmount;

  const finalOrder = await this.projectDealerOrderRepository.save(savedOrder);

  return {
    message: 'Dealer order created successfully',
    order: finalOrder,
    items: itemRows,
  };
}

async getDealerOrders(query: any) {
  const page = Math.max(Number(query?.page || 1), 1);
  const limit = Math.min(Math.max(Number(query?.limit || 20), 1), 100);
  const skip = (page - 1) * limit;

  const search = String(query?.search || '').trim().toLowerCase();
  const status = String(query?.status || '').trim();
  const dealerId = Number(query?.dealerId || 0);
  const showHidden =
  String(query?.showHidden || 'false') === 'true';

  const qb = this.projectDealerOrderRepository
    .createQueryBuilder('dealerOrder')
    .where('dealerOrder.isHidden = :showHidden', {
  showHidden,
})
    .orderBy('dealerOrder.createdAt', 'DESC')
    .skip(skip)
    .take(limit);

  if (dealerId) {
    qb.andWhere('dealerOrder.dealerId = :dealerId', { dealerId });
  }

  if (status) {
    qb.andWhere('dealerOrder.status = :status', { status });
  }

  if (search) {
    qb.andWhere(
      `(
        LOWER(dealerOrder.orderNumber) LIKE :search
        OR LOWER(dealerOrder.dealerName) LIKE :search
        OR LOWER(dealerOrder.dealerPhone) LIKE :search
        OR LOWER(dealerOrder.branchName) LIKE :search
      )`,
      {
        search: `%${search}%`,
      },
    );
  }

  const [data, total] = await qb.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async getDealerOrderById(id: number) {
  const order = await this.projectDealerOrderRepository.findOne({
    where: {
      id,
    },
  });

  if (!order) {
    throw new NotFoundException('Dealer order not found');
  }

  const items = await this.projectDealerOrderItemRepository.find({
    where: {
      dealerOrderId: id,
    },
    order: {
      id: 'ASC',
    },
  });

  const payments = await this.projectDealerPaymentRepository.find({
    where: {
      dealerOrderId: id,
    },
    order: {
      createdAt: 'DESC',
    },
  });

  const comments = await this.projectDealerCommentRepository.find({
    where: {
      dealerOrderId: id,
    },
    order: {
      createdAt: 'DESC',
    },
  });

  return {
    order,
    items,
    payments,
    comments,
  };
}

async updateDealerOrderStatus(id: number, body: any, user: any) {
  const order = await this.projectDealerOrderRepository.findOne({
    where: {
      id,
    },
  });

  if (!order) {
    throw new NotFoundException('Dealer order not found');
  }

  const allowedStatuses = Object.values(ProjectDealerOrderStatus);

  if (!allowedStatuses.includes(body?.status)) {
    throw new BadRequestException('Invalid dealer order status');
  }

  const oldStatus = order.status;
const newStatus = body.status;

order.status = newStatus;

  if (body?.expectedDeliveryAt !== undefined) {
    (order as any).expectedDeliveryAt = body.expectedDeliveryAt
  ? new Date(body.expectedDeliveryAt)
  : null;
  }

  if (body?.deliveredAt !== undefined) {
    (order as any).deliveredAt = body.deliveredAt
  ? new Date(body.deliveredAt)
  : null;
  }

  if (body?.adminRemarks !== undefined) {
    order.adminRemarks = body.adminRemarks || '';
  }

  if (
  oldStatus !== ProjectDealerOrderStatus.ACCEPTED &&
  newStatus === ProjectDealerOrderStatus.ACCEPTED
) {
  await this.reserveStockForDealerOrder(order.id, user);
}

if (
  oldStatus === ProjectDealerOrderStatus.ACCEPTED &&
  [
    ProjectDealerOrderStatus.CANCELLED,
    ProjectDealerOrderStatus.POSTPONED,
    ProjectDealerOrderStatus.STOCK_OUT,
  ].includes(newStatus)
) {
  await this.releaseStockReservationForDealerOrder(order.id);
}

if (
  oldStatus !== ProjectDealerOrderStatus.DISPATCHED &&
  newStatus === ProjectDealerOrderStatus.DISPATCHED
) {
  await this.dispatchDealerOrderStock(
    order.id,
    user,
  );
}

  return this.projectDealerOrderRepository.save(order);
}

async addDealerOrderPayment(body: any, user: any) {
  const dealerOrderId = Number(body?.dealerOrderId || 0);
  const amount = Number(body?.amount || 0);

  if (!dealerOrderId) {
    throw new BadRequestException('Dealer order is required');
  }

  if (amount <= 0) {
    throw new BadRequestException('Payment amount is required');
  }

  const order = await this.projectDealerOrderRepository.findOne({
    where: {
      id: dealerOrderId,
    },
  });

  if (!order) {
    throw new NotFoundException('Dealer order not found');
  }

  const payment = this.projectDealerPaymentRepository.create({
    dealerOrderId,
    dealerId: order.dealerId,
    dealerName: order.dealerName,
    amount,
    paymentMode: body?.paymentMode || '',
    transactionId: body?.transactionId || '',
    receiptUrl: body?.receiptUrl || '',
    status: ProjectDealerPaymentStatus.SUBMITTED,
    createdBy: user?.id || user?.userId || null,
    createdByName: user?.name || user?.email || '',
    remarks: body?.remarks || '',
  });

  const savedPayment = await this.projectDealerPaymentRepository.save(payment);

  order.paidAmount = Number(order.paidAmount || 0) + amount;
  order.pendingAmount = Math.max(
    Number(order.totalAmount || 0) - Number(order.paidAmount || 0),
    0,
  );

  await this.projectDealerOrderRepository.save(order);

  return {
    message: 'Dealer payment submitted successfully',
    payment: savedPayment,
  };
}

async addDealerOrderComment(body: any, user: any) {
  const dealerOrderId = Number(body?.dealerOrderId || 0);

  if (!dealerOrderId) {
    throw new BadRequestException('Dealer order is required');
  }

  if (!String(body?.comment || '').trim()) {
    throw new BadRequestException('Comment is required');
  }

  const order = await this.projectDealerOrderRepository.findOne({
    where: {
      id: dealerOrderId,
    },
  });

  if (!order) {
    throw new NotFoundException('Dealer order not found');
  }

  const comment = this.projectDealerCommentRepository.create({
    dealerOrderId,
    dealerId: order.dealerId,
    dealerName: order.dealerName,
    comment: String(body.comment || '').trim(),
    commentType: body?.commentType || 'GENERAL',
    createdBy: user?.id || user?.userId || null,
    createdByName: user?.name || user?.email || '',
    createdByRole: Array.isArray(user?.roles)
      ? user.roles.join(', ')
      : '',
  });

  return this.projectDealerCommentRepository.save(comment);
}

async getDealerAnalytics() {
  const orders = await this.projectDealerOrderRepository.find({
    where: {
      isHidden: false,
    },
  });

  const totalOrders = orders.length;
  const totalSales = orders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0,
  );
  const totalPaid = orders.reduce(
    (sum, order) => sum + Number(order.paidAmount || 0),
    0,
  );
  const totalPending = orders.reduce(
    (sum, order) => sum + Number(order.pendingAmount || 0),
    0,
  );

  const overdueCreditOrders = orders.filter((order) => {
    if (!order.creditDueDate) return false;
    if (Number(order.pendingAmount || 0) <= 0) return false;

    return new Date(order.creditDueDate).getTime() < Date.now();
  }).length;

  return {
    totalOrders,
    totalSales,
    totalPaid,
    totalPending,
    overdueCreditOrders,
  };
}

async hideDealerOrder(id: number, body: any, user: any) {
  const order =
    await this.projectDealerOrderRepository.findOne({
      where: { id },
    });

  if (!order) {
    throw new NotFoundException('Dealer order not found');
  }

  order.isHidden = true;
  order.hiddenReason =
    body?.reason || 'Hidden by user';
  order.hiddenAt = new Date();
  order.hiddenBy = user?.id || user?.userId || null;
  order.hiddenByName =
    user?.name || user?.email || '';

  return this.projectDealerOrderRepository.save(order);
}

async restoreDealerOrder(id: number, body: any, user: any) {
  const order =
    await this.projectDealerOrderRepository.findOne({
      where: { id },
    });

  if (!order) {
    throw new NotFoundException('Dealer order not found');
  }

  order.isHidden = false;
  order.hiddenReason = null as any;
  order.hiddenAt = null as any;
  order.hiddenBy = null as any;
  order.hiddenByName = null as any;

  order.adminRemarks = `${
    order.adminRemarks || ''
  }\nRestored: ${body?.reason || 'Restored by user'}`.trim();

  return this.projectDealerOrderRepository.save(order);
}

async createDealerOrderProformaInvoice(
  dealerOrderId: number,
  body: any,
  user: any,
) {
  const order =
    await this.projectDealerOrderRepository.findOne({
      where: {
        id: dealerOrderId,
      },
    });

  if (!order) {
    throw new NotFoundException('Dealer order not found');
  }

  if (order.isHidden) {
    throw new BadRequestException(
      'Hidden dealer order cannot be used for PI',
    );
  }

  const existingPi =
    await this.projectProformaInvoiceRepository.findOne({
      where: {
        dealerId: order.dealerId,
        invoiceType: 'DEALER',
        remarks: `Generated from dealer order ${order.orderNumber || order.id}`,
      } as any,
    });

  if (existingPi) {
    throw new BadRequestException(
      'PI already generated for this dealer order',
    );
  }

  const orderItems =
    await this.projectDealerOrderItemRepository.find({
      where: {
        dealerOrderId: order.id,
      },
      order: {
        id: 'ASC',
      },
    });

  if (!orderItems.length) {
    throw new BadRequestException(
      'Dealer order has no material items',
    );
  }

  const bodyItems = Array.isArray(body?.items)
    ? body.items
    : [];

  const bodyItemMap = new Map<number, any>();

  for (const item of bodyItems) {
    const itemId = Number(
      item?.dealerOrderItemId || item?.id || 0,
    );

    if (itemId) {
      bodyItemMap.set(itemId, item);
    }
  }

  const preparedItems: any[] = [];

  for (const orderItem of orderItems) {
    const override = bodyItemMap.get(orderItem.id);

    const requestedQuantity = Number(
      override?.quantity ??
        override?.acceptedQuantity ??
        orderItem.pendingQuantity ??
        orderItem.quantity ??
        0,
    );

    if (requestedQuantity <= 0) {
      continue;
    }

    const maxQuantity = Number(orderItem.quantity || 0);

    if (requestedQuantity > maxQuantity) {
      throw new BadRequestException(
        `PI quantity cannot be more than ordered quantity for ${orderItem.materialName}`,
      );
    }

    const sellingRate = Number(
      override?.sellingRate ?? orderItem.sellingRate ?? 0,
    );

    const gstPercent = Number(
      override?.gstPercent ?? orderItem.gstPercent ?? 0,
    );

    const rowDiscount = Number(
      override?.discountAmount ?? orderItem.discountAmount ?? 0,
    );

    const rowSubtotal = requestedQuantity * sellingRate;
    const taxableAmount = Math.max(
      rowSubtotal - rowDiscount,
      0,
    );
    const rowGst = (taxableAmount * gstPercent) / 100;
    const rowTotal = taxableAmount + rowGst;

    preparedItems.push({
      dealerOrderItemId: orderItem.id,
      materialId: orderItem.materialId,
      itemName: orderItem.materialName || '',
      category: orderItem.category || '',
      brand: orderItem.brand || '',
      unit: orderItem.unit || '',
      sellingRate,
      gstPercent,
      quantity: requestedQuantity,
      discountAmount: rowDiscount,
      subtotalAmount: rowSubtotal,
      gstAmount: rowGst,
      totalAmount: rowTotal,
      remarks: override?.remarks || orderItem.remarks || '',
    });
  }

  if (!preparedItems.length) {
    throw new BadRequestException(
      'No valid PI quantity found',
    );
  }

  const subtotalAmount = preparedItems.reduce(
    (sum, item) => sum + Number(item.subtotalAmount || 0),
    0,
  );

  const discountAmount = preparedItems.reduce(
    (sum, item) => sum + Number(item.discountAmount || 0),
    0,
  );

  const gstAmount = preparedItems.reduce(
    (sum, item) => sum + Number(item.gstAmount || 0),
    0,
  );

  const totalAmount = preparedItems.reduce(
    (sum, item) => sum + Number(item.totalAmount || 0),
    0,
  );

  const invoice =
    this.projectProformaInvoiceRepository.create({
      projectId: 0,
      invoiceNumber: this.generatePiNumber(),
      status: ProjectProformaInvoiceStatus.DRAFT,
      subtotalAmount,
      discountAmount,
      gstAmount,
      totalAmount,
      invoiceDate: body?.invoiceDate
        ? new Date(body.invoiceDate)
        : new Date(),
      validUntil: body?.validUntil
        ? new Date(body.validUntil)
        : null,
      remarks:
        body?.remarks ||
        `Generated from dealer order ${order.orderNumber || order.id}`,
      createdBy: user?.id || user?.userId || null,
      createdByName: user?.name || user?.email || '',
      createdByRole: Array.isArray(user?.roles)
        ? user.roles.join(', ')
        : '',
      invoiceType: 'DEALER',
      dealerId: order.dealerId,
      dealerName: order.dealerName,
      dealerPhone: order.dealerPhone,
      dealerGstNumber: order.dealerGstNumber,
      dealerAddress: order.dealerAddress,
    } as Partial<ProjectProformaInvoice>);

  const savedInvoice =
    await this.projectProformaInvoiceRepository.save(
      invoice as ProjectProformaInvoice,
    );

  const invoiceItems = preparedItems.map((item) =>
    this.projectProformaInvoiceItemRepository.create({
      proformaInvoiceId: savedInvoice.id,
      projectId: 0,
      materialId: item.materialId || undefined,
      itemName: item.itemName || '',
      category: item.category || '',
      brand: item.brand || '',
      unit: item.unit || '',
      sellingRate: item.sellingRate,
      gstPercent: item.gstPercent,
      quantity: item.quantity,
      discountAmount: item.discountAmount,
      subtotalAmount: item.subtotalAmount,
      gstAmount: item.gstAmount,
      totalAmount: item.totalAmount,
      remarks: item.remarks || '',
    } as Partial<ProjectProformaInvoiceItem>),
  );

  await this.projectProformaInvoiceItemRepository.save(
    invoiceItems as ProjectProformaInvoiceItem[],
  );

  const totalOrderedQuantity = orderItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  const piQuantity = preparedItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  order.status =
    piQuantity >= totalOrderedQuantity
      ? ProjectDealerOrderStatus.ACCEPTED
      : ProjectDealerOrderStatus.PARTIALLY_ACCEPTED;

  order.adminRemarks = `${
    order.adminRemarks || ''
  }\nPI generated: ${savedInvoice.invoiceNumber}`.trim();

  await this.projectDealerOrderRepository.save(order);

  return {
    message: 'Dealer PI generated successfully',
    invoice: savedInvoice,
    items: invoiceItems,
  };
}

async createDealerOrderFinalInvoice(
  dealerOrderId: number,
  body: any,
  user: any,
) {
  const order =
    await this.projectDealerOrderRepository.findOne({
      where: {
        id: dealerOrderId,
      },
    });

  if (!order) {
    throw new NotFoundException('Dealer order not found');
  }

  if (order.isHidden) {
    throw new BadRequestException(
      'Hidden dealer order cannot be used for final invoice',
    );
  }

  const searchText = `Generated from dealer order ${
    order.orderNumber || order.id
  }`;

  let pi =
    await this.projectProformaInvoiceRepository
      .createQueryBuilder('pi')
      .where('pi.invoiceType = :invoiceType', {
        invoiceType: 'DEALER',
      })
      .andWhere('pi.dealerId = :dealerId', {
        dealerId: order.dealerId,
      })
      .andWhere('pi.remarks LIKE :remarks', {
        remarks: `%${searchText}%`,
      })
      .andWhere('pi.isHidden = false')
      .orderBy('pi.createdAt', 'DESC')
      .getOne();

  if (!pi) {
    const piResult =
      await this.createDealerOrderProformaInvoice(
        dealerOrderId,
        {
          ...body,
          remarks: searchText,
        },
        user,
      );

    pi = (piResult as any)?.invoice;
  }

  if (!pi?.id) {
    throw new BadRequestException(
      'Unable to find or create dealer PI',
    );
  }

  const finalInvoice =
    await this.createFinalInvoiceFromProforma(
      Number(pi.id),
      user,
    );

  return {
    message:
      'Dealer Final Invoice generated successfully',
    pi,
    finalInvoice,
  };
}

async getDealerOrderInvoices(dealerOrderId: number) {
  const order =
    await this.projectDealerOrderRepository.findOne({
      where: {
        id: dealerOrderId,
      },
    });

  if (!order) {
    throw new NotFoundException('Dealer order not found');
  }

  const searchText = `Generated from dealer order ${
    order.orderNumber || order.id
  }`;

  const proformaInvoices =
    await this.projectProformaInvoiceRepository
      .createQueryBuilder('pi')
      .where('pi.invoiceType = :invoiceType', {
        invoiceType: 'DEALER',
      })
      .andWhere('pi.dealerId = :dealerId', {
        dealerId: order.dealerId,
      })
      .andWhere('pi.remarks LIKE :remarks', {
        remarks: `%${searchText}%`,
      })
      .andWhere('pi.isHidden = false')
      .orderBy('pi.createdAt', 'DESC')
      .getMany();

  const finalInvoices =
    await this.projectFinalInvoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceType = :invoiceType', {
        invoiceType: 'DEALER',
      })
      .andWhere('invoice.dealerId = :dealerId', {
        dealerId: order.dealerId,
      })
      .andWhere('invoice.remarks LIKE :remarks', {
        remarks: `%${searchText}%`,
      })
      .andWhere('invoice.isHidden = false')
      .orderBy('invoice.createdAt', 'DESC')
      .getMany();

  return {
    order,
    proformaInvoices,
    finalInvoices,
  };
}

async createDealerNotification(body: any, user: any) {
  const dealerId = Number(body?.dealerId || 0);

  if (!dealerId) {
    throw new BadRequestException('Dealer is required');
  }

  if (!String(body?.title || '').trim()) {
    throw new BadRequestException('Notification title is required');
  }

  if (!String(body?.message || '').trim()) {
    throw new BadRequestException('Notification message is required');
  }

  const dealer =
    await this.projectVendorRepository.findOne({
      where: {
        id: dealerId,
      },
    });

  if (!dealer) {
    throw new NotFoundException('Dealer not found');
  }

  const notification =
    this.projectDealerNotificationRepository.create({
      dealerId,
      dealerName: dealer.vendorName,
      title: String(body.title || '').trim(),
      message: String(body.message || '').trim(),
      notificationType:
        body?.notificationType || 'GENERAL',
      status: ProjectDealerNotificationStatus.UNREAD,
      createdBy: user?.id || user?.userId || null,
      createdByName: user?.name || user?.email || '',
    });

  return this.projectDealerNotificationRepository.save(
    notification,
  );
}

async getDealerNotifications(query: any) {
  const page = Math.max(Number(query?.page || 1), 1);
  const limit = Math.min(
    Math.max(Number(query?.limit || 20), 1),
    100,
  );

  const skip = (page - 1) * limit;

  const dealerId = Number(query?.dealerId || 0);
  const status = String(query?.status || '').trim();

  const qb =
    this.projectDealerNotificationRepository
      .createQueryBuilder('notification')
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

  if (dealerId) {
    qb.where('notification.dealerId = :dealerId', {
      dealerId,
    });
  } else {
    qb.where('1=1');
  }

  if (status) {
    qb.andWhere('notification.status = :status', {
      status,
    });
  }

  const [data, total] = await qb.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async markDealerNotificationRead(id: number) {
  const notification =
    await this.projectDealerNotificationRepository.findOne({
      where: { id },
    });

  if (!notification) {
    throw new NotFoundException(
      'Dealer notification not found',
    );
  }

  notification.status =
    ProjectDealerNotificationStatus.READ;

  return this.projectDealerNotificationRepository.save(
    notification,
  );
}

async createDealerMonthlyRequirement(body: any, user: any) {
  const dealerId = Number(body?.dealerId || 0);
  const materialId = Number(body?.materialId || 0);
  const expectedQuantity = Number(
    body?.expectedQuantity || 0,
  );

  if (!dealerId) {
    throw new BadRequestException('Dealer is required');
  }

  if (!materialId) {
    throw new BadRequestException('Material is required');
  }

  if (expectedQuantity <= 0) {
    throw new BadRequestException(
      'Expected quantity must be greater than 0',
    );
  }

  const requirementMonth = String(
    body?.requirementMonth || '',
  ).trim();

  if (!requirementMonth) {
    throw new BadRequestException(
      'Requirement month is required',
    );
  }

  const dealer =
    await this.projectVendorRepository.findOne({
      where: { id: dealerId },
    });

  if (!dealer) {
    throw new NotFoundException('Dealer not found');
  }

  const material =
    await this.projectMaterialMasterRepository.findOne({
      where: {
        id: materialId,
      },
    });

  if (!material) {
    throw new NotFoundException('Material not found');
  }

  const requirement =
    this.projectDealerMonthlyRequirementRepository.create({
      dealerId,
      dealerName: dealer.vendorName,
      materialId,
      materialName: material.name,
      category: material.category || '',
      brand: material.brand || '',
      unit: material.unit || '',
      requirementMonth,
      expectedQuantity,
      remarks: body?.remarks || '',
      createdBy: user?.id || user?.userId || null,
      createdByName: user?.name || user?.email || '',
    });

  return this.projectDealerMonthlyRequirementRepository.save(
    requirement,
  );
}

async getDealerMonthlyRequirements(query: any) {
  const page = Math.max(Number(query?.page || 1), 1);
  const limit = Math.min(
    Math.max(Number(query?.limit || 20), 1),
    100,
  );

  const skip = (page - 1) * limit;

  const dealerId = Number(query?.dealerId || 0);
  const month = String(query?.month || '').trim();
  const search = String(query?.search || '')
    .trim()
    .toLowerCase();
  const showHidden =
    String(query?.showHidden || 'false') === 'true';

  const qb =
    this.projectDealerMonthlyRequirementRepository
      .createQueryBuilder('requirement')
      .where('requirement.isHidden = :showHidden', {
        showHidden,
      })
      .orderBy('requirement.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

  if (dealerId) {
    qb.andWhere('requirement.dealerId = :dealerId', {
      dealerId,
    });
  }

  if (month) {
    qb.andWhere(
      'requirement.requirementMonth = :month',
      { month },
    );
  }

  if (search) {
    qb.andWhere(
      `(
        LOWER(requirement.dealerName) LIKE :search
        OR LOWER(requirement.materialName) LIKE :search
        OR LOWER(requirement.category) LIKE :search
        OR LOWER(requirement.brand) LIKE :search
      )`,
      {
        search: `%${search}%`,
      },
    );
  }

  const [data, total] = await qb.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async hideDealerMonthlyRequirement(
  id: number,
  body: any,
  user: any,
) {
  const requirement =
    await this.projectDealerMonthlyRequirementRepository.findOne({
      where: { id },
    });

  if (!requirement) {
    throw new NotFoundException(
      'Dealer monthly requirement not found',
    );
  }

  requirement.isHidden = true;
  requirement.hiddenReason =
    body?.reason || 'Hidden by user';
  requirement.hiddenAt = new Date();
  requirement.hiddenBy =
    user?.id || user?.userId || null;
  requirement.hiddenByName =
    user?.name || user?.email || '';

  return this.projectDealerMonthlyRequirementRepository.save(
    requirement,
  );
}

async restoreDealerMonthlyRequirement(
  id: number,
  body: any,
  user: any,
) {
  const requirement =
    await this.projectDealerMonthlyRequirementRepository.findOne({
      where: { id },
    });

  if (!requirement) {
    throw new NotFoundException(
      'Dealer monthly requirement not found',
    );
  }

  requirement.isHidden = false;
  requirement.hiddenReason = null as any;
  requirement.hiddenAt = null as any;
  requirement.hiddenBy = null as any;
  requirement.hiddenByName = null as any;

  return this.projectDealerMonthlyRequirementRepository.save(
    requirement,
  );
}

async getDealerCreditReminders() {
  const today = new Date();

  const overdueOrders =
    await this.projectDealerOrderRepository
      .createQueryBuilder('order')
      .where('order.isHidden = false')
      .andWhere('order.paymentType = :paymentType', {
        paymentType: ProjectDealerPaymentType.CREDIT,
      })
      .andWhere('order.pendingAmount > 0')
      .andWhere('order.creditDueDate IS NOT NULL')
      .andWhere('order.creditDueDate < :today', {
        today,
      })
      .orderBy('order.creditDueDate', 'ASC')
      .getMany();

  return {
    total: overdueOrders.length,
    data: overdueOrders,
  };
}

async getDealerLedgerHistory(query: any) {
  const dealerId = Number(query?.dealerId || 0);

  if (!dealerId) {
    throw new BadRequestException('Dealer is required');
  }

  const dealer = await this.projectVendorRepository.findOne({
    where: { id: dealerId },
  });

  if (!dealer) {
    throw new NotFoundException('Dealer not found');
  }

  const orders = await this.projectDealerOrderRepository.find({
    where: {
      dealerId,
      isHidden: false,
    },
    order: {
      createdAt: 'DESC',
    },
  });

  const orderIds = orders.map((order) => order.id);

  const items = orderIds.length
    ? await this.projectDealerOrderItemRepository.find({
        where: {
          dealerOrderId: In(orderIds),
        },
        order: {
          id: 'ASC',
        },
      })
    : [];

  const payments = orderIds.length
    ? await this.projectDealerPaymentRepository.find({
        where: {
          dealerOrderId: In(orderIds),
        },
        order: {
          createdAt: 'DESC',
        },
      })
    : [];

  const proformaInvoices =
    await this.projectProformaInvoiceRepository.find({
      where: {
        invoiceType: 'DEALER',
        dealerId,
        isHidden: false,
      } as any,
      order: {
        createdAt: 'DESC',
      },
    });

  const finalInvoices =
    await this.projectFinalInvoiceRepository.find({
      where: {
        invoiceType: 'DEALER',
        dealerId,
        isHidden: false,
      } as any,
      order: {
        createdAt: 'DESC',
      },
    });

  const totalOrderValue = orders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0,
  );

  const totalPaid = orders.reduce(
    (sum, order) => sum + Number(order.paidAmount || 0),
    0,
  );

  const totalPending = orders.reduce(
    (sum, order) => sum + Number(order.pendingAmount || 0),
    0,
  );

  const overdueOrders = orders.filter((order) => {
    if (order.paymentType !== ProjectDealerPaymentType.CREDIT) {
      return false;
    }

    if (!order.creditDueDate) {
      return false;
    }

    if (Number(order.pendingAmount || 0) <= 0) {
      return false;
    }

    return new Date(order.creditDueDate).getTime() < Date.now();
  });

  const materialSummaryMap = new Map<
    string,
    {
      materialId: number;
      materialName: string;
      category: string;
      brand: string;
      unit: string;
      totalQuantity: number;
      totalAmount: number;
    }
  >();

  for (const item of items) {
    const key = `${item.materialId}`;

    const existing =
      materialSummaryMap.get(key) ||
      {
        materialId: item.materialId,
        materialName: item.materialName || '',
        category: item.category || '',
        brand: item.brand || '',
        unit: item.unit || '',
        totalQuantity: 0,
        totalAmount: 0,
      };

    existing.totalQuantity += Number(item.quantity || 0);
    existing.totalAmount += Number(item.totalAmount || 0);

    materialSummaryMap.set(key, existing);
  }

  const timeline: any[] = [];

  for (const order of orders) {
    timeline.push({
      date: order.createdAt,
      type: 'ORDER',
      title: order.orderNumber || `Order #${order.id}`,
      amount: Number(order.totalAmount || 0),
      status: order.status,
      description: `Dealer order created. Pending: ₹${Number(
        order.pendingAmount || 0,
      ).toLocaleString('en-IN')}`,
      referenceId: order.id,
    });
  }

  for (const pi of proformaInvoices) {
    timeline.push({
      date: pi.createdAt,
      type: 'PROFORMA_INVOICE',
      title: pi.invoiceNumber || `PI #${pi.id}`,
      amount: Number(pi.totalAmount || 0),
      status: pi.status,
      description: 'Dealer proforma invoice generated',
      referenceId: pi.id,
    });
  }

  for (const invoice of finalInvoices) {
    timeline.push({
      date: invoice.createdAt,
      type: 'FINAL_INVOICE',
      title: invoice.invoiceNumber || `Invoice #${invoice.id}`,
      amount: Number(invoice.totalAmount || 0),
      status: invoice.status,
      description: 'Dealer final invoice generated',
      referenceId: invoice.id,
    });
  }

  for (const payment of payments) {
    timeline.push({
      date: payment.createdAt,
      type: 'PAYMENT',
      title: payment.paymentMode || 'Payment',
      amount: Number(payment.amount || 0),
      status: payment.status,
      description: payment.transactionId
        ? `Transaction: ${payment.transactionId}`
        : payment.remarks || 'Dealer payment received',
      referenceId: payment.id,
    });
  }

  timeline.sort(
    (a, b) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime(),
  );

  return {
    dealer: {
      id: dealer.id,
      dealerName: dealer.vendorName,
      contactPerson: dealer.contactPerson,
      phone: dealer.phone,
      email: dealer.email,
      gstNumber: dealer.gstNumber,
      city: dealer.city,
      state: dealer.state,
      address: dealer.address,
      openingBalance: dealer.openingBalance || 0,
    },
    summary: {
      totalOrders: orders.length,
      totalOrderValue,
      totalPaid,
      totalPending,
      overdueOrders: overdueOrders.length,
      totalPi: proformaInvoices.length,
      totalFinalInvoices: finalInvoices.length,
      totalPayments: payments.length,
    },
    orders,
    materialSummary: Array.from(materialSummaryMap.values()),
    timeline,
  };
}

async uploadDealerPaymentReceipt(file: any) {
  if (!file) {
    throw new BadRequestException('Receipt file is required');
  }

  const mimeType = String(file.mimetype || '');

  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';

  if (!isImage && !isPdf) {
    throw new BadRequestException(
      'Only image or PDF receipt files are allowed',
    );
  }

  const maxSize = 20 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new BadRequestException(
      'Receipt file must be less than 20 MB',
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = 'project-documents';

  if (!supabaseUrl || !serviceKey) {
    throw new BadRequestException(
      'Supabase storage is not configured',
    );
  }

  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(supabaseUrl, serviceKey);

  const extension =
    String(file.originalname || '').split('.').pop() ||
    'file';

  const filePath = `dealer-payment-receipts/${Date.now()}-${Math.round(
    Math.random() * 1e9,
  )}.${extension}`;

  const uploadResult = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: mimeType,
    });

  if (uploadResult.error) {
    throw new BadRequestException(uploadResult.error.message);
  }

  const publicUrl = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath).data.publicUrl;

  return {
    fileUrl: publicUrl,
  };
}

private isTradingManager(user: any): boolean {
  const roles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
      ? [user.role]
      : [];

  return roles.includes('TRADING_MANAGER');
}

private canSeeAllTradingMeetings(user: any): boolean {
  const roles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
      ? [user.role]
      : [];

  return (
    roles.includes('OWNER') ||
    roles.includes('ACCOUNT_MANAGER') ||
    roles.includes('PROJECT_MANAGER')
  );
}

async createTradingMeeting(body: any, user: any) {
  const dealerId = Number(body?.dealerId || 0);

const manualDealerName = String(
  body?.manualDealerName || body?.dealerName || '',
).trim();

if (!dealerId && !manualDealerName) {
  throw new BadRequestException(
    'Dealer is required',
  );
}

  if (!body?.scheduledAt) {
    throw new BadRequestException('Meeting date/time is required');
  }

  const meetingNotes = String(body?.meetingNotes || '').trim();

  if (!meetingNotes) {
    throw new BadRequestException('Meeting notes are required');
  }

  const hasAddress =
    String(body?.gpsAddress || '').trim() ||
    String(body?.address || '').trim();

  if (!hasAddress) {
    throw new BadRequestException(
      'GPS address or meeting address is required',
    );
  }

  const dealer = dealerId
  ? await this.projectVendorRepository.findOne({
      where: { id: dealerId },
    })
  : null;

if (dealerId && !dealer) {
  throw new NotFoundException('Dealer not found');
}

  const currentUserId = Number(user?.id || user?.userId || user?.sub || 0);
  const currentUserName = user?.name || user?.email || '';

  const assignedTo = body?.assignedTo
    ? Number(body.assignedTo)
    : currentUserId;

  const assignedToName =
    body?.assignedToName || currentUserName;

  const meeting =
    this.projectTradingMeetingRepository.create({
      dealerId: dealerId || null,

dealerName:
  dealer?.vendorName ||
  manualDealerName,

dealerPhone:
  dealer?.phone ||
  body?.manualDealerPhone ||
  body?.dealerPhone ||
  '',

dealerGstNumber:
  dealer?.gstNumber ||
  body?.manualDealerGstNumber ||
  body?.dealerGstNumber ||
  '',

branchName:
  dealer?.city ||
  body?.manualDealerCity ||
  body?.branchName ||
  '',
      scheduledAt: new Date(body.scheduledAt),
      status:
        body?.status ||
        ProjectTradingMeetingStatus.SCHEDULED,
      meetingNotes,
      outcome: body?.outcome || '',
      nextAction: body?.nextAction || '',
      nextFollowUpDate: body?.nextFollowUpDate
        ? new Date(body.nextFollowUpDate)
        : null,
      expectedMaterialName: body?.expectedMaterialName || '',
      expectedQuantity: Number(body?.expectedQuantity || 0),
      expectedOrderValue: Number(body?.expectedOrderValue || 0),
      gpsLatitude:
        body?.gpsLatitude !== undefined &&
        body?.gpsLatitude !== ''
          ? Number(body.gpsLatitude)
          : null,
      gpsLongitude:
        body?.gpsLongitude !== undefined &&
        body?.gpsLongitude !== ''
          ? Number(body.gpsLongitude)
          : null,
      gpsAddress:
        body?.gpsAddress || body?.address || '',
      gpsPhotoUrl: body?.gpsPhotoUrl || '',
      audioUrl: body?.audioUrl || '',
      assignedTo,
      assignedToName,
      createdBy: currentUserId,
      createdByName: currentUserName,
      updatedBy: currentUserId,
      updatedByName: currentUserName,
    } as Partial<ProjectTradingMeeting>);

  return this.projectTradingMeetingRepository.save(
    meeting as ProjectTradingMeeting,
  );
}

async getTradingMeetings(query: any, user: any) {
  const page = Math.max(Number(query?.page || 1), 1);
  const limit = Math.min(Math.max(Number(query?.limit || 20), 1), 100);
  const skip = (page - 1) * limit;

  const search = String(query?.search || '').trim().toLowerCase();
  const status = String(query?.status || '').trim();
  const dealerId = Number(query?.dealerId || 0);
  const assignedTo = Number(query?.assignedTo || 0);
  const showHidden = String(query?.showHidden || 'false') === 'true';

  const qb = this.projectTradingMeetingRepository
    .createQueryBuilder('meeting')
    .where('meeting.isHidden = :showHidden', { showHidden })
    .orderBy('meeting.scheduledAt', 'DESC')
    .skip(skip)
    .take(limit);

  if (!this.canSeeAllTradingMeetings(user)) {
    const currentUserId = Number(user?.id || user?.userId || user?.sub || 0);

    qb.andWhere(
      '(meeting.assignedTo = :currentUserId OR meeting.createdBy = :currentUserId)',
      { currentUserId },
    );
  }

  if (search) {
    qb.andWhere(
      `(
        LOWER(meeting.dealerName) LIKE :search
        OR LOWER(meeting.dealerPhone) LIKE :search
        OR LOWER(meeting.branchName) LIKE :search
        OR LOWER(meeting.meetingNotes) LIKE :search
      )`,
      { search: `%${search}%` },
    );
  }

  if (status) {
    qb.andWhere('meeting.status = :status', { status });
  }

  if (dealerId) {
    qb.andWhere('meeting.dealerId = :dealerId', { dealerId });
  }

  if (assignedTo) {
    qb.andWhere('meeting.assignedTo = :assignedTo', { assignedTo });
  }

  if (query?.fromDate) {
    qb.andWhere('meeting.scheduledAt >= :fromDate', {
      fromDate: query.fromDate,
    });
  }

  if (query?.toDate) {
    qb.andWhere('meeting.scheduledAt <= :toDate', {
      toDate: query.toDate,
    });
  }

  const [data, total] = await qb.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async getTradingMeetingDetail(id: number, user: any) {
  const meeting =
    await this.projectTradingMeetingRepository.findOne({
      where: { id },
    });

  if (!meeting) {
    throw new NotFoundException('Trading meeting not found');
  }

  if (!this.canSeeAllTradingMeetings(user)) {
    const currentUserId = Number(user?.id || user?.userId || user?.sub || 0);

    if (
      Number(meeting.assignedTo || 0) !== currentUserId &&
      Number(meeting.createdBy || 0) !== currentUserId
    ) {
      throw new ForbiddenException(
        'You can access only your own trading meetings',
      );
    }
  }

  return meeting;
}

async updateTradingMeetingStatus(id: number, body: any, user: any) {
  const meeting = await this.getTradingMeetingDetail(id, user);

  const status = String(body?.status || '').trim();

  if (!status) {
    throw new BadRequestException('Status is required');
  }

  const hasNotes =
  String(body?.meetingNotes || '').trim() ||
  String(body?.outcome || '').trim() ||
  String(body?.nextAction || '').trim();

if (!hasNotes) {
  throw new BadRequestException(
    'Please add meeting notes, outcome, or next action before saving trading meeting action',
  );
}

  meeting.status = status as ProjectTradingMeetingStatus;
  meeting.outcome = body?.outcome ?? meeting.outcome;
  meeting.nextAction = body?.nextAction ?? meeting.nextAction;
  meeting.meetingNotes = body?.meetingNotes ?? meeting.meetingNotes;
  meeting.nextFollowUpDate = body?.nextFollowUpDate
    ? new Date(body.nextFollowUpDate)
    : meeting.nextFollowUpDate;
  meeting.gpsPhotoUrl = body?.gpsPhotoUrl ?? meeting.gpsPhotoUrl;
  meeting.audioUrl = body?.audioUrl ?? meeting.audioUrl;
  meeting.updatedBy = Number(user?.id || user?.userId || user?.sub || 0);
  meeting.updatedByName = user?.name || user?.email || '';

  if (
    status === ProjectTradingMeetingStatus.COMPLETED &&
    !meeting.gpsPhotoUrl
  ) {
    throw new BadRequestException(
      'GPS photo is required before completing dealer meeting',
    );
  }

  return this.projectTradingMeetingRepository.save(meeting);
}

async hideTradingMeeting(id: number, body: any, user: any) {
  const meeting = await this.getTradingMeetingDetail(id, user);

  meeting.isHidden = true;
  meeting.hiddenReason = body?.reason || 'Hidden by user';
  meeting.hiddenAt = new Date();
  meeting.hiddenBy = Number(user?.id || user?.userId || user?.sub || 0);
  meeting.hiddenByName = user?.name || user?.email || '';

  return this.projectTradingMeetingRepository.save(meeting);
}

async restoreTradingMeeting(id: number, body: any, user: any) {
  const meeting =
    await this.projectTradingMeetingRepository.findOne({
      where: { id },
    });

  if (!meeting) {
    throw new NotFoundException('Trading meeting not found');
  }

  meeting.isHidden = false;
  meeting.hiddenReason = null as any;
  meeting.hiddenAt = null as any;
  meeting.hiddenBy = null as any;
  meeting.hiddenByName = null as any;

  return this.projectTradingMeetingRepository.save(meeting);
}

async getTradingMeetingAnalytics(user: any) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const qb = this.projectTradingMeetingRepository
    .createQueryBuilder('meeting')
    .where('meeting.isHidden = false');

  if (!this.canSeeAllTradingMeetings(user)) {
    const currentUserId = Number(user?.id || user?.userId || user?.sub || 0);

    qb.andWhere(
      '(meeting.assignedTo = :currentUserId OR meeting.createdBy = :currentUserId)',
      { currentUserId },
    );
  }

  const all = await qb.getMany();

  const todaysMeetings = all.filter((item) => {
    const date = new Date(item.scheduledAt);
    return date >= today && date < tomorrow;
  });

  return {
    totalMeetings: all.length,
    todaysMeetings: todaysMeetings.length,
    completedMeetings: all.filter(
      (item) => item.status === ProjectTradingMeetingStatus.COMPLETED,
    ).length,
    pendingMeetings: all.filter(
      (item) => item.status === ProjectTradingMeetingStatus.SCHEDULED,
    ).length,
    orderExpected: all.filter(
      (item) => item.status === ProjectTradingMeetingStatus.ORDER_EXPECTED,
    ).length,
    orderReceived: all.filter(
      (item) => item.status === ProjectTradingMeetingStatus.ORDER_RECEIVED,
    ).length,
    expectedOrderValue: all.reduce(
      (sum, item) => sum + Number(item.expectedOrderValue || 0),
      0,
    ),
  };
}

async createTradingMeetingFollowup(
  tradingMeetingId: number,
  body: any,
  user: any,
) {
  const meeting = await this.getTradingMeetingDetail(
    tradingMeetingId,
    user,
  );

  const note = String(body?.note || '').trim();

  if (!note) {
    throw new BadRequestException('Followup note is required');
  }

  if (!body?.followUpDate) {
    throw new BadRequestException('Followup date/time is required');
  }

  const currentUserId = Number(
    user?.id || user?.userId || user?.sub || 0,
  );
  const currentUserName = user?.name || user?.email || '';

  const followup = this.followUpRepository.create({
    tradingMeetingId: meeting.id,
    assignedTo: meeting.assignedTo || currentUserId,
    createdBy: currentUserId,
    createdByName: currentUserName,
    sourceModule: 'TRADING',
    sourceStage: 'TRADING_MEETING',
    customerName: meeting.dealerName || '',
    customerPhone: meeting.dealerPhone || '',
    followUpType: body?.followUpType || 'GENERAL',
    status: 'PENDING',
    note,
    followUpDate: new Date(body.followUpDate),
  } as any);

  const saved = await this.followUpRepository.save(followup);

  return {
    message: 'Trading followup created successfully',
    followup: saved,
  };
}

async getTradingMeetingFollowups(
  tradingMeetingId: number,
  user: any,
) {
  const meeting = await this.getTradingMeetingDetail(
    tradingMeetingId,
    user,
  );

  return this.followUpRepository.find({
    where: {
      tradingMeetingId: meeting.id,
    } as any,
    order: {
      followUpDate: 'DESC',
      createdAt: 'DESC',
    } as any,
  });
}

async getTradingMeetingConversionData(
  id: number,
  user: any,
) {
  const meeting = await this.getTradingMeetingDetail(
    id,
    user,
  );

  return {
    tradingMeetingId: meeting.id,

    dealerId: meeting.dealerId,
    dealerName: meeting.dealerName,
    dealerPhone: meeting.dealerPhone,
    dealerGstNumber: meeting.dealerGstNumber,
    branchName: meeting.branchName,

    meetingNotes: meeting.meetingNotes,
    gpsAddress: meeting.gpsAddress,

    expectedMaterialName: meeting.expectedMaterialName,
    expectedQuantity: meeting.expectedQuantity || 0,
    expectedOrderValue: meeting.expectedOrderValue || 0,

    status: meeting.status,
  };
}

private canManageStock(user: any): boolean {
  const roles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
      ? [user.role]
      : [];

  return (
    roles.includes('OWNER') ||
    roles.includes('PROJECT_MANAGER') ||
    roles.includes('ACCOUNT_MANAGER') ||
    roles.includes('STOCK_MANAGER')
  );
}

async getStockDashboard(user: any) {
  if (!this.canManageStock(user)) {
    throw new ForbiddenException('You are not allowed to access stock');
  }

  const stockItems = await this.projectStockItemRepository.find({
    where: {
      isHidden: false,
    },
  });

  const totalItems = stockItems.length;

  const totalQuantity = stockItems.reduce(
    (sum, item) => sum + Number(item.currentQuantity || 0),
    0,
  );

  const totalStockValue = stockItems.reduce(
    (sum, item) => sum + Number(item.stockValue || 0),
    0,
  );

  const materials =
  await this.projectMaterialMasterRepository.find();

const materialMap = new Map(
  materials.map((m) => [m.id, m]),
);

const lowStockItems = stockItems.filter((item) => {
  const material = materialMap.get(item.materialId);

  const currentQuantity = Number(
    item.currentQuantity || 0,
  );

  const reservedQuantity = Number(
    (item as any).reservedQuantity || 0,
  );

  const availableQuantity = Math.max(
    currentQuantity - reservedQuantity,
    0,
  );

  return (
    availableQuantity <=
    Number(material?.minimumStockLevel || 0)
  );
});

  const zeroStockItems = stockItems.filter(
    (item) => Number(item.currentQuantity || 0) <= 0,
  );

  return {
    totalItems,
    totalQuantity,
    totalStockValue,
    lowStockItems: lowStockItems.length,
    zeroStockItems: zeroStockItems.length,
  };
}

async getStockItems(query: any, user: any) {
  if (!this.canManageStock(user)) {
    throw new ForbiddenException('You are not allowed to access stock');
  }

  const page = Math.max(Number(query?.page || 1), 1);
  const limit = Math.min(Math.max(Number(query?.limit || 20), 1), 100);
  const skip = (page - 1) * limit;

  const search = String(query?.search || '').trim().toLowerCase();
  const branchName = String(query?.branchName || '').trim().toLowerCase();
  const showHidden = String(query?.showHidden || 'false') === 'true';
  const lowStockOnly = String(query?.lowStockOnly || 'false') === 'true';

  const qb = this.projectStockItemRepository
    .createQueryBuilder('stock')
    .where('stock.isHidden = :showHidden', { showHidden });

  if (search) {
    qb.andWhere(
      `(
        LOWER(stock.materialName) LIKE :search
        OR LOWER(stock.category) LIKE :search
        OR LOWER(stock.brand) LIKE :search
        OR LOWER(stock.branchName) LIKE :search
      )`,
      { search: `%${search}%` },
    );
  }

  if (branchName) {
    qb.andWhere('LOWER(stock.branchName) LIKE :branchName', {
      branchName: `%${branchName}%`,
    });
  }

  if (lowStockOnly) {
    qb.andWhere('stock.currentQuantity <= 5');
  }

  const [data, total] = await qb
    .orderBy('stock.materialName', 'ASC')
    .skip(skip)
    .take(limit)
    .getManyAndCount();

  const materialIds = data
  .map((item) => Number(item.materialId || 0))
  .filter(Boolean);

const materials = materialIds.length
  ? await this.projectMaterialMasterRepository.find({
      where: {
        id: In(materialIds),
      },
    })
  : [];

const materialMap = new Map(
  materials.map((material) => [material.id, material]),
);

const enrichedData = data.map((item: any) => {
  const material = materialMap.get(Number(item.materialId || 0));

  const currentQuantity = Number(item.currentQuantity || 0);
  const reservedQuantity = Number(item.reservedQuantity || 0);
  const availableQuantity = Math.max(
    currentQuantity - reservedQuantity,
    0,
  );

  const minimumStockLevel = Number(
    (material as any)?.minimumStockLevel || 0,
  );

  return {
    ...item,
    reservedQuantity,
    availableQuantity,
    minimumStockLevel,
    isLowStock:
      minimumStockLevel > 0 &&
      availableQuantity <= minimumStockLevel,
      debugCurrentQuantity: currentQuantity,
debugReservedQuantity: reservedQuantity,
debugAvailableQuantity: availableQuantity,
debugMinimumStockLevel: minimumStockLevel,
  };
});

return {
  data: enrichedData,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
};
}

async getStockMovements(query: any, user: any) {
  if (!this.canManageStock(user)) {
    throw new ForbiddenException('You are not allowed to access stock');
  }

  const page = Math.max(Number(query?.page || 1), 1);
  const limit = Math.min(Math.max(Number(query?.limit || 20), 1), 100);
  const skip = (page - 1) * limit;

  const search = String(query?.search || '').trim().toLowerCase();
  const movementType = String(query?.movementType || '').trim();
  const showHidden = String(query?.showHidden || 'false') === 'true';

  const qb = this.projectStockMovementRepository
    .createQueryBuilder('movement')
    .where('movement.isHidden = :showHidden', { showHidden });

  if (search) {
    qb.andWhere(
      `(
        LOWER(movement.materialName) LIKE :search
        OR LOWER(movement.branchName) LIKE :search
        OR LOWER(movement.remarks) LIKE :search
        OR LOWER(movement.sourceType) LIKE :search
      )`,
      { search: `%${search}%` },
    );
  }

  if (movementType) {
    qb.andWhere('movement.movementType = :movementType', {
      movementType,
    });
  }

  const [data, total] = await qb
    .orderBy('movement.createdAt', 'DESC')
    .skip(skip)
    .take(limit)
    .getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async receiveStock(body: any, user: any) {
  if (!this.canManageStock(user)) {
    throw new ForbiddenException('You are not allowed to manage stock');
  }

  const materialId = Number(body?.materialId || 0);
  const quantity = Number(body?.quantity || 0);
  const rate = Number(body?.rate || 0);

  if (!materialId) {
    throw new BadRequestException('Material is required');
  }

  if (quantity <= 0) {
    throw new BadRequestException('Quantity must be greater than 0');
  }

  if (rate < 0) {
    throw new BadRequestException('Rate cannot be negative');
  }

  const material = await this.projectMaterialMasterRepository.findOne({
    where: { id: materialId },
  });

  if (!material) {
    throw new NotFoundException('Material not found');
  }

  const branchId = body?.branchId ? Number(body.branchId) : null;
  const branchName = String(body?.branchName || '').trim();

  let stockItem = await this.projectStockItemRepository.findOne({
    where: {
      materialId,
      branchId: branchId as any,
    },
  });

  const oldQuantity = Number(stockItem?.currentQuantity || 0);
  const oldValue = Number(stockItem?.stockValue || 0);
  const receivedValue = quantity * rate;

  const newQuantity = oldQuantity + quantity;
  const newValue = oldValue + receivedValue;
  const averageRate = newQuantity > 0 ? newValue / newQuantity : rate;

  if (!stockItem) {
    const newStockItem = new ProjectStockItem();

newStockItem.materialId = materialId;
newStockItem.materialName = material.name;
newStockItem.category = material.category || '';
newStockItem.brand = material.brand || '';
newStockItem.unit = material.unit || '';
newStockItem.branchId = branchId as any;
newStockItem.branchName = branchName;
newStockItem.currentQuantity = newQuantity;
newStockItem.averageRate = averageRate;
newStockItem.stockValue = newValue;
newStockItem.isHidden = false;

stockItem = newStockItem;
  } else {
    stockItem.currentQuantity = newQuantity;
    stockItem.averageRate = averageRate;
    stockItem.stockValue = newValue;
    stockItem.materialName = material.name;
    stockItem.category = material.category || stockItem.category;
    stockItem.brand = material.brand || stockItem.brand;
    stockItem.unit = material.unit || stockItem.unit;
    stockItem.branchName = branchName || stockItem.branchName;
  }

  if (!stockItem) {
  throw new BadRequestException('Failed to prepare stock item');
}

const savedStockItem =
  await this.projectStockItemRepository.save(stockItem);

  const movement = new ProjectStockMovement();

movement.stockItemId = savedStockItem.id;
movement.materialId = materialId;
movement.materialName = material.name;
movement.branchId = branchId as any;
movement.branchName = branchName;
movement.movementType = ProjectStockMovementType.RECEIVE;
movement.quantity = quantity;
movement.rate = rate;
movement.totalAmount = receivedValue;
movement.sourceType = body?.sourceType || 'MANUAL_STOCK_RECEIVE';
movement.sourceId = body?.sourceId ? Number(body.sourceId) : undefined as any;
movement.remarks = body?.remarks || '';
movement.createdBy = Number(user?.id || user?.userId || user?.sub || 0);
movement.createdByName = user?.name || user?.email || '';

  const savedMovement =
    await this.projectStockMovementRepository.save(movement);

  return {
    message: 'Stock received successfully',
    stockItem: savedStockItem,
    movement: savedMovement,
  };
}

async issueStock(body: any, user: any) {
  if (!this.canManageStock(user)) {
    throw new ForbiddenException('You are not allowed to manage stock');
  }

  const stockItemId = Number(body?.stockItemId || 0);
let materialId = Number(body?.materialId || 0);
  const quantity = Number(body?.quantity || 0);

  if (!materialId && !stockItemId) {
  throw new BadRequestException('Material or stock item is required');
}

  if (quantity <= 0) {
    throw new BadRequestException('Quantity must be greater than 0');
  }

  const branchId = body?.branchId ? Number(body.branchId) : null;

  let stockItem: ProjectStockItem | null = null;

if (stockItemId) {
  stockItem = await this.projectStockItemRepository.findOne({
    where: {
      id: stockItemId,
      isHidden: false,
    },
  });

  if (stockItem) {
    materialId = stockItem.materialId;
  }
} else {
  stockItem = await this.projectStockItemRepository.findOne({
    where: {
      materialId,
      branchId: branchId as any,
      isHidden: false,
    },
  });
}

  if (!stockItem) {
    throw new NotFoundException('Stock item not found');
  }

  const currentQuantity = Number(stockItem.currentQuantity || 0);

  if (currentQuantity < quantity) {
    throw new BadRequestException(
      `Insufficient stock. Available quantity is ${currentQuantity}`,
    );
  }

  const rate = Number(body?.rate || stockItem.averageRate || 0);
  const totalAmount = quantity * rate;

  stockItem.currentQuantity = currentQuantity - quantity;
  stockItem.averageRate = Number(stockItem.averageRate || rate || 0);
  stockItem.stockValue =
    stockItem.currentQuantity * Number(stockItem.averageRate || 0);

  const savedStockItem =
    await this.projectStockItemRepository.save(stockItem);

  const movement = new ProjectStockMovement();

movement.stockItemId = savedStockItem.id;
movement.materialId = materialId;
movement.materialName = stockItem.materialName;
movement.branchId = branchId as any;
movement.branchName = stockItem.branchName || body?.branchName || '';
movement.movementType = ProjectStockMovementType.ISSUE;
movement.quantity = quantity;
movement.rate = rate;
movement.totalAmount = totalAmount;
movement.sourceType = body?.sourceType || 'MANUAL_STOCK_ISSUE';
movement.sourceId = body?.sourceId ? Number(body.sourceId) : undefined as any;
movement.projectId = body?.projectId ? Number(body.projectId) : undefined as any;
movement.remarks = body?.remarks || '';
movement.createdBy = Number(user?.id || user?.userId || user?.sub || 0);
movement.createdByName = user?.name || user?.email || '';

  const savedMovement =
    await this.projectStockMovementRepository.save(movement);

  if (body?.projectId) {
    const consumption = new ProjectConsumption();

consumption.projectId = Number(body.projectId);
consumption.projectName = body?.projectName || '';
consumption.materialId = materialId;
consumption.materialName = stockItem.materialName;
consumption.branchId = branchId as any;
consumption.branchName = stockItem.branchName || '';
consumption.stockItemId = savedStockItem.id;
consumption.stockMovementId = savedMovement.id;
consumption.quantity = quantity;
consumption.rate = rate;
consumption.totalAmount = totalAmount;
consumption.issuedBy = Number(user?.id || user?.userId || user?.sub || 0);
consumption.issuedByName = user?.name || user?.email || '';
consumption.remarks = body?.remarks || '';

    await this.projectConsumptionRepository.save(consumption);
  }

  return {
    message: 'Stock issued successfully',
    stockItem: savedStockItem,
    movement: savedMovement,
  };
}

async adjustStock(body: any, user: any) {
  if (!this.canManageStock(user)) {
    throw new ForbiddenException('You are not allowed to manage stock');
  }

  const stockItemId = Number(body?.stockItemId || 0);
  const adjustmentType = String(body?.adjustmentType || '').trim();
  const quantity = Number(body?.quantity || 0);
  const remarks = String(body?.remarks || '').trim();

  if (!stockItemId) {
    throw new BadRequestException('Stock item is required');
  }

  if (!['ADJUST_IN', 'ADJUST_OUT'].includes(adjustmentType)) {
    throw new BadRequestException('Valid adjustment type is required');
  }

  if (quantity <= 0) {
    throw new BadRequestException('Quantity must be greater than 0');
  }

  if (!remarks) {
    throw new BadRequestException('Remarks are required for stock adjustment');
  }

  const stockItem = await this.projectStockItemRepository.findOne({
    where: {
      id: stockItemId,
      isHidden: false,
    },
  });

  if (!stockItem) {
    throw new NotFoundException('Stock item not found');
  }

  const currentQuantity = Number(stockItem.currentQuantity || 0);
  const averageRate = Number(stockItem.averageRate || 0);

  if (
    adjustmentType === ProjectStockMovementType.ADJUST_OUT &&
    currentQuantity < quantity
  ) {
    throw new BadRequestException(
      `Insufficient stock. Available quantity is ${currentQuantity}`,
    );
  }

  const newQuantity =
    adjustmentType === ProjectStockMovementType.ADJUST_IN
      ? currentQuantity + quantity
      : currentQuantity - quantity;

  stockItem.currentQuantity = newQuantity;
  stockItem.stockValue = newQuantity * averageRate;

  const savedStockItem =
    await this.projectStockItemRepository.save(stockItem);

  const movement = new ProjectStockMovement();

  movement.stockItemId = savedStockItem.id;
  movement.materialId = savedStockItem.materialId;
  movement.materialName = savedStockItem.materialName;
  movement.branchId = savedStockItem.branchId as any;
  movement.branchName = savedStockItem.branchName || '';
  movement.movementType =
    adjustmentType === 'ADJUST_IN'
      ? ProjectStockMovementType.ADJUST_IN
      : ProjectStockMovementType.ADJUST_OUT;
  movement.quantity = quantity;
  movement.rate = averageRate;
  movement.totalAmount = quantity * averageRate;
  movement.sourceType = 'STOCK_ADJUSTMENT';
  movement.remarks = remarks;
  movement.createdBy = Number(user?.id || user?.userId || user?.sub || 0);
  movement.createdByName = user?.name || user?.email || '';

  const savedMovement =
    await this.projectStockMovementRepository.save(movement);

  return {
    message: 'Stock adjusted successfully',
    stockItem: savedStockItem,
    movement: savedMovement,
  };
}

private async reserveStockForDealerOrder(orderId: number, user: any) {
  const items = await this.projectDealerOrderItemRepository.find({
    where: {
      dealerOrderId: orderId,
    },
  });

  if (!items.length) {
    throw new BadRequestException('Dealer order has no items to reserve');
  }

  for (const item of items) {
    const requiredQuantity = Number(
      item.acceptedQuantity || item.quantity || 0,
    );

    const alreadyReserved = Number((item as any).reservedQuantity || 0);
    const reserveNow = requiredQuantity - alreadyReserved;

    if (reserveNow <= 0) {
      continue;
    }

    const stockItem = await this.projectStockItemRepository.findOne({
      where: {
        materialId: item.materialId,
        isHidden: false,
      },
      order: {
        currentQuantity: 'DESC',
      },
    });

    if (!stockItem) {
      throw new BadRequestException(
        `Stock not found for ${item.materialName}`,
      );
    }

    const availableQuantity =
      Number(stockItem.currentQuantity || 0) -
      Number((stockItem as any).reservedQuantity || 0);

    if (availableQuantity < reserveNow) {
      throw new BadRequestException(
        `Insufficient available stock for ${item.materialName}. Available: ${availableQuantity}, Required: ${reserveNow}`,
      );
    }

    (stockItem as any).reservedQuantity =
      Number((stockItem as any).reservedQuantity || 0) + reserveNow;

    (item as any).reservedQuantity = alreadyReserved + reserveNow;

    await this.projectStockItemRepository.save(stockItem);
    await this.projectDealerOrderItemRepository.save(item);
  }

  return true;
}

private async releaseStockReservationForDealerOrder(orderId: number) {
  const items = await this.projectDealerOrderItemRepository.find({
    where: {
      dealerOrderId: orderId,
    },
  });

  for (const item of items) {
    const reservedQuantity = Number((item as any).reservedQuantity || 0);

    if (reservedQuantity <= 0) {
      continue;
    }

    const stockItem = await this.projectStockItemRepository.findOne({
      where: {
        materialId: item.materialId,
        isHidden: false,
      },
      order: {
        currentQuantity: 'DESC',
      },
    });

    if (stockItem) {
      (stockItem as any).reservedQuantity = Math.max(
        Number((stockItem as any).reservedQuantity || 0) - reservedQuantity,
        0,
      );

      await this.projectStockItemRepository.save(stockItem);
    }

    (item as any).reservedQuantity = 0;
    await this.projectDealerOrderItemRepository.save(item);
  }

  return true;
}

private async dispatchDealerOrderStock(
  orderId: number,
  user: any,
) {
  const items =
    await this.projectDealerOrderItemRepository.find({
      where: {
        dealerOrderId: orderId,
      },
    });

  for (const item of items) {
    const dispatchQty = Number(
      (item as any).reservedQuantity || 0,
    );

    if (dispatchQty <= 0) {
      continue;
    }

    const stockItem =
      await this.projectStockItemRepository.findOne({
        where: {
          materialId: item.materialId,
          isHidden: false,
        },
      });

    if (!stockItem) {
      throw new BadRequestException(
        `Stock item not found for ${item.materialName}`,
      );
    }

    if (
      Number(stockItem.currentQuantity || 0) <
      dispatchQty
    ) {
      throw new BadRequestException(
        `Insufficient stock for ${item.materialName}`,
      );
    }

    stockItem.currentQuantity =
      Number(stockItem.currentQuantity || 0) -
      dispatchQty;

    (stockItem as any).reservedQuantity =
      Math.max(
        Number(
          (stockItem as any).reservedQuantity || 0,
        ) - dispatchQty,
        0,
      );

    stockItem.stockValue =
      Number(stockItem.currentQuantity || 0) *
      Number(stockItem.averageRate || 0);

    await this.projectStockItemRepository.save(
      stockItem,
    );

    const movement =
      this.projectStockMovementRepository.create({
        stockItemId: stockItem.id,
        materialId: stockItem.materialId,
        materialName: stockItem.materialName,
        branchId: stockItem.branchId,
        branchName: stockItem.branchName,

        movementType:
          ProjectStockMovementType.ISSUE,

        quantity: dispatchQty,
        rate: stockItem.averageRate,
        totalAmount:
          dispatchQty *
          Number(stockItem.averageRate || 0),

        sourceType: 'DEALER_ORDER',
        sourceId: orderId,

        remarks: `Dealer Order Dispatch`,
        createdBy: user?.id,
        createdByName: user?.name,
      });

    await this.projectStockMovementRepository.save(
      movement,
    );

    (item as any).dispatchedQuantity =
      dispatchQty;

    (item as any).reservedQuantity = 0;

    await this.projectDealerOrderItemRepository.save(
      item,
    );
  }

  return true;
}

async updateDocumentCustomerVisibility(
  id: number,
  body: any,
  user: any,
) {
  const document = await this.projectDocumentRepository.findOne({
    where: { id },
  });

  if (!document) {
    throw new NotFoundException('Document not found');
  }

  const roles = Array.isArray(user?.roles) ? user.roles : [];

  const canUpdate =
    roles.includes('OWNER') ||
    roles.includes('MARKETING_HEAD') ||
    roles.includes('PROJECT_MANAGER') ||
    roles.includes('CUSTOMER_MANAGER') ||
    roles.includes('ACCOUNT_MANAGER');

  if (!canUpdate) {
    throw new ForbiddenException(
      'You are not allowed to update customer visibility',
    );
  }

  document.visibleToCustomer =
    body.visibleToCustomer === true ||
    body.visibleToCustomer === 'true';

  return this.projectDocumentRepository.save(document);
}
}
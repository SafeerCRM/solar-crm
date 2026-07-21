import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../customer/customer.entity';
import { Project } from '../project/project.entity';
import { CustomerComplaint } from './customer-complaint.entity';
import { CustomerReferral } from './customer-referral.entity';
import { CustomerPaymentReceipt } from './customer-payment-receipt.entity';
import { CustomerWorkDateRequest } from './customer-work-date-request.entity';
import { CustomerNotification } from './customer-notification.entity';
import { CustomerCleaningReminder } from './customer-cleaning-reminder.entity';
import * as jwt from 'jsonwebtoken';
import { CustomerComplaintAttachment } from './customer-complaint-attachment.entity';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { ProjectExecutionActivity } from '../project/project-execution-activity.entity';
import { ProjectPaymentInstallment } from '../project/project-payment-installment.entity';
import { ProjectDocument } from '../project/project-document.entity';
import { StaffMember } from '../staff/staff-member.entity';
import {
  CustomerComplaintActivity,
  CustomerComplaintActivityType,
} from './customer-complaint-activity.entity';
import { DealerCompanyBankDetail } from '../dealer/dealer-company-bank-detail.entity';
import {
  PortalPolicy,
  PortalPolicyType,
} from '../dealer/portal-policy.entity';
import {
  CustomerPaymentReceiptActivity,
  CustomerPaymentReceiptActivityType,
} from './customer-payment-receipt-activity.entity';
import { CustomerAfterSalesService } from './customer-after-sales-service.entity';
import {
  CustomerAfterSalesRequest,
  CustomerAfterSalesRequestStatus,
} from './customer-after-sales-request.entity';
import { CustomerAfterSalesRequestActivity } from './customer-after-sales-request-activity.entity';
import {
  CustomerAfterSalesRequestProof,
  CustomerAfterSalesProofType,
} from './customer-after-sales-request-proof.entity';
import { CustomerAfterSalesRequestRating } from './customer-after-sales-request-rating.entity';
import { CustomerReferralActivity } from './customer-referral-activity.entity';
import { LeadsService } from '../leads/leads.service';
import { MeetingService } from '../meeting/meeting.service';
import { CustomerReferralStatus } from './customer-referral.entity';
import { TelecallingContact, ContactStatus } from '../telecalling/telecalling-contact.entity';
import { Lead } from '../leads/lead.entity';
import { Meeting } from '../meeting/meeting.entity';

@Injectable()
export class CustomerPortalService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(ProjectDocument)
private readonly projectDocumentRepository: Repository<ProjectDocument>,

    @InjectRepository(ProjectPaymentInstallment)
private readonly paymentInstallmentRepository: Repository<ProjectPaymentInstallment>,

    @InjectRepository(ProjectExecutionActivity)
private readonly executionActivityRepository: Repository<ProjectExecutionActivity>,

    @InjectRepository(CustomerComplaint)
    private readonly complaintRepository: Repository<CustomerComplaint>,

    @InjectRepository(CustomerComplaintActivity)
private readonly complaintActivityRepository: Repository<CustomerComplaintActivity>,

    @InjectRepository(CustomerComplaintAttachment)
private readonly complaintAttachmentRepository: Repository<CustomerComplaintAttachment>,

    @InjectRepository(CustomerReferral)
    private readonly referralRepository: Repository<CustomerReferral>,

    @InjectRepository(CustomerPaymentReceipt)
    private readonly paymentReceiptRepository: Repository<CustomerPaymentReceipt>,

    @InjectRepository(CustomerPaymentReceiptActivity)
private readonly paymentReceiptActivityRepository: Repository<CustomerPaymentReceiptActivity>,

    @InjectRepository(CustomerWorkDateRequest)
    private readonly workDateRequestRepository: Repository<CustomerWorkDateRequest>,

    @InjectRepository(CustomerNotification)
    private readonly notificationRepository: Repository<CustomerNotification>,

    @InjectRepository(CustomerCleaningReminder)
    private readonly cleaningReminderRepository: Repository<CustomerCleaningReminder>,

    @InjectRepository(DealerCompanyBankDetail)
private readonly companyBankDetailRepository: Repository<DealerCompanyBankDetail>,

@InjectRepository(PortalPolicy)
private readonly portalPolicyRepository: Repository<PortalPolicy>,

@InjectRepository(CustomerAfterSalesService)
private readonly afterSalesServiceRepository: Repository<CustomerAfterSalesService>,

@InjectRepository(CustomerAfterSalesRequest)
private readonly afterSalesRequestRepository: Repository<CustomerAfterSalesRequest>,

@InjectRepository(CustomerAfterSalesRequestActivity)
private readonly afterSalesRequestActivityRepository: Repository<CustomerAfterSalesRequestActivity>,

@InjectRepository(CustomerAfterSalesRequestProof)
private readonly afterSalesRequestProofRepository: Repository<CustomerAfterSalesRequestProof>,

@InjectRepository(CustomerAfterSalesRequestRating)
private readonly afterSalesRequestRatingRepository: Repository<CustomerAfterSalesRequestRating>,

@InjectRepository(CustomerReferralActivity)
private readonly referralActivityRepository: Repository<CustomerReferralActivity>,

    @InjectRepository(StaffMember)
private readonly staffMemberRepository: Repository<StaffMember>,

@InjectRepository(TelecallingContact)
private readonly telecallingContactRepository: Repository<TelecallingContact>,

@InjectRepository(Lead)
private readonly leadRepository: Repository<Lead>,

@InjectRepository(Meeting)
private readonly meetingRepository: Repository<Meeting>,

private readonly leadService: LeadsService,
private readonly meetingService: MeetingService,
  ) {}

  async getCustomerDashboard(customerId: number) {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, isHidden: false },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const projects = await this.projectRepository.find({
      where: { customerId, isHidden: false },
      order: { createdAt: 'DESC' },
    });

    const hasActiveProject = projects.some(
  (project: any) => project.status !== 'COMPLETED',
);

const hasCompletedProject = projects.some(
  (project: any) => project.status === 'COMPLETED',
);

const customerPortalMode = hasActiveProject
  ? 'PROJECT_ACTIVE'
  : hasCompletedProject
    ? 'AFTER_SALES'
    : 'NO_PROJECT';

    const portalExperience =
  customerPortalMode === 'AFTER_SALES'
    ? {
        mode: customerPortalMode,
        title: 'After-Sales Support',
        subtitle:
          'Cleaning, complaints, referrals and support after project completion',
          hero: {
  badge: 'After-Sales / Support Customer',
  message:
    'Your installation is complete. You can continue using this portal for cleaning, complaints, referrals and support.',
},
          quickActions: {
  complaints: true,
  payments: true,
  referrals: true,
},

sectionLabels: {
  projectTracker: {
    title: 'Project Summary',
    text:
      'View completed project details, documents, payment history and service information.',
  },
},
        enabledSections: {
          projectTracker: false,
          workCalendar: false,
          payments: true,
          documents: false,
          complaints: true,
          cleaning: true,
          afterSalesServices: true,
          referrals: true,
          policies: true,
          staffDirectory: true,
        },
      }
    : customerPortalMode === 'PROJECT_ACTIVE'
      ? {
          mode: customerPortalMode,
          title: 'Customer Services',
          subtitle: 'Everything related to your solar plant in one place',
          hero: {
  badge: 'Project Active Customer',
  message:
    'Track your solar project, payments, documents, work schedule and support updates from one place.',
},
          quickActions: {
  complaints: true,
  payments: true,
  referrals: true,
},

sectionLabels: {
  projectTracker: {
    title: 'Project Timeline',
    text:
      'Track approval, installation, subsidy, electricity and completion progress.',
  },
},
          enabledSections: {
            projectTracker: true,
            workCalendar: true,
            payments: true,
            documents: true,
            complaints: true,
            cleaning: true,
            afterSalesServices: false,
            referrals: true,
            policies: true,
            staffDirectory: true,
          },
        }
      : {
          mode: customerPortalMode,
          title: 'Customer Portal',
          subtitle: 'Customer services and support',
          hero: {
  badge: 'Customer Portal',
  message:
    'Use this portal for customer support, referrals, policies and available services.',
},
          quickActions: {
  complaints: true,
  payments: true,
  referrals: true,
},

sectionLabels: {
  projectTracker: {
    title: 'Project Timeline',
    text: 'Project details will appear here once linked.',
  },
},
          enabledSections: {
            projectTracker: false,
            workCalendar: false,
            payments: false,
            documents: true,
            complaints: true,
            cleaning: false,
            afterSalesServices: false,
            referrals: true,
            policies: true,
            staffDirectory: true,
          },
        };

    const projectIds = projects.map((project) => project.id);

    const customerDocuments = projectIds.length
  ? await this.projectDocumentRepository
      .createQueryBuilder('document')
      .where('document.projectId IN (:...projectIds)', { projectIds })
      .andWhere('document.visibleToCustomer = true')
      .orderBy('document.createdAt', 'DESC')
      .getMany()
  : [];

    const paymentInstallments = projectIds.length
  ? await this.paymentInstallmentRepository
      .createQueryBuilder('installment')
      .where('installment.projectId IN (:...projectIds)', { projectIds })
      .andWhere('installment.isHidden = false')
      .orderBy('installment.dueDate', 'ASC')
      .addOrderBy('installment.createdAt', 'ASC')
      .getMany()
  : [];

const projectTotalAmount = projects.reduce((sum, project: any) => {
  const projectAmount =
    Number(project.finalCost || 0) ||
    Number(project.netAmount || 0) ||
    Number(project.projectCost || 0);

  return sum + projectAmount;
}, 0);

const validPaymentInstallments = paymentInstallments.filter((item: any) => {
  if (item.isHidden) return false;
  if (item.status === 'CANCELLED') return false;
  if (item.approvalStatus === 'REJECTED') return false;

  return true;
});

const paidAmount = validPaymentInstallments
  .filter((item: any) => item.approvalStatus === 'APPROVED')
  .reduce(
    (sum, item: any) => sum + Number(item.paidAmount || 0),
    0,
  );

const scheduledAmount = validPaymentInstallments.reduce(
  (sum, item: any) => sum + Number(item.amount || 0),
  0,
);

const paymentSummary = {
  totalAmount: projectTotalAmount,
  paidAmount,
  pendingAmount: Math.max(projectTotalAmount - paidAmount, 0),
  scheduledAmount,
  remainingToSchedule: Math.max(projectTotalAmount - scheduledAmount, 0),
  totalInstallments: paymentInstallments.length,
  pendingInstallments: validPaymentInstallments.filter(
    (item: any) => item.status !== 'PAID',
  ).length,
};

const executionActivities = projectIds.length
  ? await this.executionActivityRepository
      .createQueryBuilder('activity')
      .where('activity.projectId IN (:...projectIds)', { projectIds })
      .orderBy('activity.scheduledDate', 'ASC')
      .addOrderBy('activity.createdAt', 'DESC')
      .getMany()
  : [];

const executionActivitiesByProject = projectIds.reduce(
  (acc: any, projectId: number) => {
    acc[projectId] = executionActivities.filter(
      (activity) => activity.projectId === projectId,
    );
    return acc;
  },
  {},
);

    const complaints = await this.complaintRepository.find({
  where: { customerId, isHidden: false },
  order: { createdAt: 'DESC' },
  take: 10,
});

const complaintIds = complaints.map((item) => item.id);

const complaintAttachments = complaintIds.length
  ? await this.complaintAttachmentRepository
      .createQueryBuilder('attachment')
      .where('attachment.complaintId IN (:...complaintIds)', {
        complaintIds,
      })
      .orderBy('attachment.createdAt', 'DESC')
      .getMany()
  : [];

const complaintsWithAttachments = complaints.map((complaint) => ({
  ...complaint,
  attachments: complaintAttachments.filter(
    (attachment) => attachment.complaintId === complaint.id,
  ),
}));

const notifications = await this.notificationRepository.find({
  where: { customerId },
  order: { createdAt: 'DESC' },
  take: 10,
});

const referrals = await this.referralRepository.find({
  where: { customerId, isHidden: false },
  order: { createdAt: 'DESC' },
  take: 10,
});

const referralsWithProgress = await Promise.all(
  referrals.map((item: any) =>
    this.buildReferralProgressSnapshot(item),
  ),
);

const paymentReceipts = await this.paymentReceiptRepository.find({
  where: { customerId, isHidden: false },
  order: { createdAt: 'DESC' },
  take: 10,
});

const workDateRequests = await this.workDateRequestRepository.find({
  where: { customerId, isHidden: false },
  order: { createdAt: 'DESC' },
  take: 10,
});

const cleaningReminders = await this.cleaningReminderRepository.find({
  where: { customerId },
  order: { cleaningDate: 'DESC' },
  take: 10,
});

const customerPaymentDetails =
  await this.companyBankDetailRepository.find({
    where: {
      isActive: true,
      isHidden: false,
      visibleToCustomer: true,
    } as any,
    order: { createdAt: 'DESC' } as any,
  });

    return {
  customer,
  projects,
  customerPortalMode,
hasActiveProject,
hasCompletedProject,
portalExperience,
  complaints: complaintsWithAttachments,
  notifications,
  totalProjects: projects.length,
  openComplaints: complaintsWithAttachments.filter(
    (c) => c.status !== 'CLOSED',
  ).length,
  unreadNotifications: notifications.filter(
    (n) => !n.isRead,
  ).length,
  referrals: referralsWithProgress,
paymentReceipts,
workDateRequests,
cleaningReminders,
totalReferrals: referrals.length,
pendingPaymentReceipts: paymentReceipts.filter(
  (item) => item.status === 'SUBMITTED',
).length,
pendingWorkDateRequests: workDateRequests.filter(
  (item) => item.status === 'PENDING',
).length,
upcomingCleaningReminders: cleaningReminders.filter(
  (item) => item.status === 'PENDING',
).length,
executionActivities,
executionActivitiesByProject,
upcomingExecutionActivities: executionActivities.filter(
  (activity) =>
    activity.scheduledDate &&
    activity.status !== 'COMPLETED' &&
    activity.status !== 'CANCELLED',
).slice(0, 10),
paymentInstallments: validPaymentInstallments,
paymentSummary,
customerDocuments,
totalCustomerDocuments: customerDocuments.length,
customerPaymentDetails,
};
  }

  async createComplaint(body: any, user: any) {
    const project = await this.projectRepository.findOne({
      where: { id: Number(body.projectId), isHidden: false },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const complaint = this.complaintRepository.create({
      customerId: Number(project.customerId || body.customerId),
      customerCode: project.customerCode || body.customerCode || '',
      customerName: project.customerName || body.customerName || '',
      customerPhone: project.customerPhone || body.customerPhone || '',
      projectId: project.id,
      projectName: project.customerName || '',
      branchName: project.branchName || '',
      projectOwnerId: project.projectOwnerId,
      projectOwnerName: project.projectOwnerName,
      subject: body.subject || 'OTHER',
      complaintText: body.complaintText || body.message || '',
      createdBy: user?.id || null,
      createdByName: user?.name || user?.email || '',
      createdByRole: Array.isArray(user?.roles) ? user.roles.join(', ') : '',
    });

    const savedComplaint = await this.complaintRepository.save(complaint);

const attachments = Array.isArray(body.attachments) ? body.attachments : [];

for (const attachment of attachments) {
  if (!attachment?.fileUrl) continue;

  const complaintAttachment = this.complaintAttachmentRepository.create({
    complaintId: savedComplaint.id,
    fileUrl: attachment.fileUrl,
    fileName: attachment.fileName || '',
    fileSize: attachment.fileSize ? Number(attachment.fileSize) : undefined,
    uploadedBy: user?.id || null,
    uploadedByName: user?.name || user?.email || '',
  });

  await this.complaintAttachmentRepository.save(complaintAttachment);
}

await this.addComplaintActivity(
  {
    complaintId: savedComplaint.id,
    customerId: savedComplaint.customerId,
    customerCode: savedComplaint.customerCode,
    projectId: savedComplaint.projectId,
    activityType: CustomerComplaintActivityType.COMPLAINT_CREATED,
    activityTitle: 'Complaint Created',
    activityDescription: savedComplaint.complaintText || '',
    newValue: savedComplaint.status,
  },
  user,
);

if (attachments.length > 0) {
  await this.addComplaintActivity(
    {
      complaintId: savedComplaint.id,
      customerId: savedComplaint.customerId,
      customerCode: savedComplaint.customerCode,
      projectId: savedComplaint.projectId,
      activityType: CustomerComplaintActivityType.ATTACHMENT_UPLOADED,
      activityTitle: 'Attachments Uploaded',
      activityDescription: `${attachments.length} attachment(s) uploaded by customer.`,
      newValue: String(attachments.length),
    },
    user,
  );
}

return {
  ...savedComplaint,
  attachments: await this.complaintAttachmentRepository.find({
    where: { complaintId: savedComplaint.id },
    order: { createdAt: 'DESC' },
  }),
};
  }

  async listComplaints(query: any) {
  const page = Number(query?.page || 1);
  const limit = Math.min(Number(query?.limit || 20), 100);
  const skip = (page - 1) * limit;

  const qb = this.complaintRepository
  .createQueryBuilder('complaint')
  .leftJoin(
  Project,
  'project',
  'project.id = complaint.projectId',
)
.addSelect('project.status', 'projectStatus')
.addSelect('project.address', 'projectAddress')
.addSelect('project.gpsAddress', 'projectGpsAddress')
.addSelect('project.gpsLatitude', 'projectGpsLatitude')
.addSelect('project.gpsLongitude', 'projectGpsLongitude')
  .orderBy(
    'complaint.createdAt',
    'DESC',
  );

if (query?.showHidden === 'true') {
  qb.where('complaint.isHidden = true');
} else {
  qb.where('complaint.isHidden = false');
}

  if (query?.customerId) {
    qb.andWhere('complaint.customerId = :customerId', {
      customerId: Number(query.customerId),
    });
  }

  if (query?.projectId) {
    qb.andWhere('complaint.projectId = :projectId', {
      projectId: Number(query.projectId),
    });
  }

  if (query?.projectStage === 'COMPLETED') {
  qb.andWhere('project.status = :completedStatus', {
    completedStatus: 'COMPLETED',
  });
}

if (query?.projectStage === 'IN_PROGRESS') {
  qb.andWhere(
    '(project.status IS NULL OR project.status != :completedStatus)',
    {
      completedStatus: 'COMPLETED',
    },
  );
}

  if (query?.branchName) {
    qb.andWhere('LOWER(complaint.branchName) LIKE :branchName', {
      branchName: `%${String(query.branchName).toLowerCase()}%`,
    });
  }

  if (query?.projectOwnerId) {
    qb.andWhere('complaint.projectOwnerId = :projectOwnerId', {
      projectOwnerId: Number(query.projectOwnerId),
    });
  }

  if (query?.projectOwnerName) {
    qb.andWhere('LOWER(complaint.projectOwnerName) LIKE :projectOwnerName', {
      projectOwnerName: `%${String(query.projectOwnerName).toLowerCase()}%`,
    });
  }

  if (query?.customerSearch) {
    const search = `%${String(query.customerSearch).toLowerCase()}%`;

    qb.andWhere(
      `
      LOWER(complaint.customerName) LIKE :search
      OR LOWER(complaint.customerPhone) LIKE :search
      OR LOWER(complaint.customerCode) LIKE :search
      `,
      { search },
    );
  }

  if (query?.subject) {
    qb.andWhere('complaint.subject = :subject', {
      subject: query.subject,
    });
  }

  if (query?.status) {
    qb.andWhere('complaint.status = :status', {
      status: query.status,
    });
  }

  if (query?.fromDate) {
    qb.andWhere('complaint.createdAt >= :fromDate', {
      fromDate: new Date(query.fromDate),
    });
  }

  if (query?.toDate) {
    const endDate = new Date(query.toDate);
    endDate.setHours(23, 59, 59, 999);

    qb.andWhere('complaint.createdAt <= :toDate', {
      toDate: endDate,
    });
  }

  if (query?.serviceFromDate) {
    qb.andWhere('complaint.serviceDate >= :serviceFromDate', {
      serviceFromDate: new Date(query.serviceFromDate),
    });
  }

  if (query?.serviceToDate) {
    const serviceEndDate = new Date(query.serviceToDate);
    serviceEndDate.setHours(23, 59, 59, 999);

    qb.andWhere('complaint.serviceDate <= :serviceToDate', {
      serviceToDate: serviceEndDate,
    });
  }

  qb.skip(skip).take(limit);

  const rawAndEntities = await qb.getRawAndEntities();
const data = rawAndEntities.entities.map(
  (item: any, index: number) => ({
    ...item,

    projectStatus:
      rawAndEntities.raw[index]?.projectStatus || '',

    projectAddress:
      rawAndEntities.raw[index]?.projectAddress || '',

    projectGpsAddress:
      rawAndEntities.raw[index]?.projectGpsAddress || '',

    projectGpsLatitude:
      rawAndEntities.raw[index]?.projectGpsLatitude || null,

    projectGpsLongitude:
      rawAndEntities.raw[index]?.projectGpsLongitude || null,
  }),
);
const total = await qb.getCount();

const complaintIds = data.map((item) => item.id);

const attachments = complaintIds.length
  ? await this.complaintAttachmentRepository
      .createQueryBuilder('attachment')
      .where('attachment.complaintId IN (:...complaintIds)', {
        complaintIds,
      })
      .orderBy('attachment.createdAt', 'DESC')
      .getMany()
  : [];

const dataWithAttachments = data.map((complaint) => ({
  ...complaint,
  attachments: attachments.filter(
    (attachment) => attachment.complaintId === complaint.id,
  ),
}));

return {
  data: dataWithAttachments,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
};
}

async hideComplaint(
  id: number,
  body: any,
  user: any,
) {
  const complaint =
    await this.complaintRepository.findOne({
      where: { id },
    });

  if (!complaint) {
    throw new NotFoundException(
      'Complaint not found',
    );
  }

  complaint.isHidden = true;

  const savedComplaint =
    await this.complaintRepository.save(
      complaint,
    );

  await this.addComplaintActivity(
    {
      complaintId: savedComplaint.id,
      customerId: savedComplaint.customerId,
      customerCode:
        savedComplaint.customerCode,
      projectId: savedComplaint.projectId,
      activityType:
        CustomerComplaintActivityType.STATUS_CHANGED,
      activityTitle: 'Complaint Hidden',
      activityDescription:
        String(
          body?.reason ||
            body?.hiddenReason ||
            'Complaint hidden by admin',
        ).trim(),
      oldValue: 'VISIBLE',
      newValue: 'HIDDEN',
    },
    user,
  );

  return {
    message: 'Complaint hidden successfully',
    complaint: savedComplaint,
  };
}

async restoreComplaint(
  id: number,
  body: any,
  user: any,
) {
  const complaint =
    await this.complaintRepository.findOne({
      where: { id },
    });

  if (!complaint) {
    throw new NotFoundException(
      'Complaint not found',
    );
  }

  complaint.isHidden = false;

  const savedComplaint =
    await this.complaintRepository.save(
      complaint,
    );

  await this.addComplaintActivity(
    {
      complaintId: savedComplaint.id,
      customerId: savedComplaint.customerId,
      customerCode:
        savedComplaint.customerCode,
      projectId: savedComplaint.projectId,
      activityType:
        CustomerComplaintActivityType.STATUS_CHANGED,
      activityTitle: 'Complaint Restored',
      activityDescription:
        String(
          body?.reason ||
            body?.restoreReason ||
            'Complaint restored by admin',
        ).trim(),
      oldValue: 'HIDDEN',
      newValue: 'VISIBLE',
    },
    user,
  );

  return {
    message:
      'Complaint restored successfully',
    complaint: savedComplaint,
  };
}

async listPortalPoliciesForCustomer() {
  return this.portalPolicyRepository.find({
    where: {
      portalType: PortalPolicyType.CUSTOMER,
      visibleToCustomer: true,
      isActive: true,
      isHidden: false,
    } as any,
    order: {
      sortOrder: 'ASC',
      createdAt: 'DESC',
    } as any,
  });
}

async listAfterSalesServices(query: any) {
  const qb = this.afterSalesServiceRepository
    .createQueryBuilder('service')
    .orderBy('service.sortOrder', 'ASC')
    .addOrderBy('service.createdAt', 'DESC');

  if (query?.showHidden === 'true') {
    qb.where('1 = 1');
  } else {
    qb.where('service.isHidden = false');
  }

  if (query?.customerVisible === 'true') {
    qb.andWhere('service.isActive = true');
    qb.andWhere('service.isHidden = false');
  }

  return qb.getMany();
}

async saveAfterSalesService(body: any, user: any) {
  const serviceName = String(body?.serviceName || '').trim();

  if (!serviceName) {
    throw new BadRequestException('Service name is required');
  }

  const service = body?.id
    ? await this.afterSalesServiceRepository.findOne({
        where: { id: Number(body.id) },
      })
    : this.afterSalesServiceRepository.create();

  if (!service) {
    throw new NotFoundException('Service not found');
  }

  service.serviceName = serviceName;
  service.category = String(body?.category || '').trim();
  service.price = Number(body?.price || 0);
  service.isPaidService = body?.isPaidService !== false;
  service.description = String(body?.description || '').trim();
  service.estimatedVisitTime = String(body?.estimatedVisitTime || '').trim();
  service.isActive = body?.isActive !== false;
  service.sortOrder = Number(body?.sortOrder || 0);

  return this.afterSalesServiceRepository.save(service);
}

async hideAfterSalesService(id: number, body: any, user: any) {
  const service = await this.afterSalesServiceRepository.findOne({
    where: { id },
  });

  if (!service) {
    throw new NotFoundException('Service not found');
  }

  service.isHidden = true;
  service.hiddenReason = String(body?.reason || body?.hiddenReason || '').trim();
  service.hiddenBy = user?.id || user?.userId || null;
  service.hiddenByName = user?.name || user?.email || '';
  service.hiddenAt = new Date();

  return this.afterSalesServiceRepository.save(service);
}

async restoreAfterSalesService(id: number) {
  const service = await this.afterSalesServiceRepository.findOne({
    where: { id },
  });

  if (!service) {
    throw new NotFoundException('Service not found');
  }

  service.isHidden = false;
  service.hiddenReason = '';
  service.hiddenBy = undefined as any;
  service.hiddenByName = '';
  service.hiddenAt = undefined as any;

  return this.afterSalesServiceRepository.save(service);
}

async listAfterSalesRequests(query: any) {
  const page = Number(query?.page || 1);
  const limit = Math.min(Number(query?.limit || 20), 100);
  const skip = (page - 1) * limit;

  const qb = this.afterSalesRequestRepository
  .createQueryBuilder('request')
  .leftJoin(
    Project,
    'project',
    'project.id = request.projectId',
  )
  .addSelect('project.address', 'projectAddress')
.addSelect('project.gpsAddress', 'projectGpsAddress')
.addSelect('project.gpsLatitude', 'projectGpsLatitude')
.addSelect('project.gpsLongitude', 'projectGpsLongitude')
  .where('request.isHidden = false')
  .orderBy('request.createdAt', 'DESC');

  if (query?.customerId) {
    qb.andWhere('request.customerId = :customerId', {
      customerId: Number(query.customerId),
    });
  }

  if (query?.projectId) {
    qb.andWhere('request.projectId = :projectId', {
      projectId: Number(query.projectId),
    });
  }

  if (query?.serviceId) {
    qb.andWhere('request.serviceId = :serviceId', {
      serviceId: Number(query.serviceId),
    });
  }

  if (query?.status) {
    qb.andWhere('request.status = :status', {
      status: query.status,
    });
  }

  if (query?.customerSearch) {
    const search = `%${String(query.customerSearch).toLowerCase()}%`;

    qb.andWhere(
      `
      LOWER(request.customerName) LIKE :search
      OR LOWER(request.customerCode) LIKE :search
      OR LOWER(request.customerPhone) LIKE :search
      `,
      { search },
    );
  }

  qb.skip(skip).take(limit);

  const rawAndEntities = await qb.getRawAndEntities();

const data = rawAndEntities.entities.map(
  (item: any, index: number) => {
    const raw = rawAndEntities.raw[index] || {};

    return {
      ...item,

      projectAddress:
        raw.projectAddress || '',

      projectGpsAddress:
        raw.projectGpsAddress || '',

      projectGpsLatitude:
        raw.projectGpsLatitude ?? null,

      projectGpsLongitude:
        raw.projectGpsLongitude ?? null,
    };
  },
);

const total = await qb.getCount();

const requestIds = data.map((item) => item.id);

const ratings = requestIds.length
  ? await this.afterSalesRequestRatingRepository
      .createQueryBuilder('rating')
      .where('rating.requestId IN (:...requestIds)', {
        requestIds,
      })
      .getMany()
  : [];

const dataWithRatings = data.map((request) => ({
  ...request,
  rating:
    ratings.find((rating) => rating.requestId === request.id) || null,
}));

return {
  data: dataWithRatings,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
};
}

private async addAfterSalesRequestActivity(
  requestId: number,
  activityType: string,
  activityTitle: string,
  activityDescription?: string,
  user?: any,
) {
  await this.afterSalesRequestActivityRepository.save({
    requestId,
    activityType,
    activityTitle,
    activityDescription: activityDescription || '',
    performedBy: user?.id || user?.userId || null,
    performedByName: user?.name || user?.email || 'System',
  });
}


async createAfterSalesRequestFromCustomer(customerId: number, body: any) {
  const serviceId = Number(body?.serviceId || 0);

  if (!serviceId) {
    throw new BadRequestException('Service is required');
  }

  const customer = await this.customerRepository.findOne({
    where: {
      id: customerId,
      isHidden: false,
    } as any,
  });

  if (!customer) {
    throw new NotFoundException('Customer not found');
  }

  const service = await this.afterSalesServiceRepository.findOne({
    where: {
      id: serviceId,
      isHidden: false,
      isActive: true,
    } as any,
  });

  if (!service) {
    throw new NotFoundException('Service not available');
  }

  const projects = await this.projectRepository.find({
    where: {
      customerId,
      isHidden: false,
    } as any,
    order: {
      createdAt: 'DESC',
    },
  });

  const selectedProject =
    body?.projectId
      ? projects.find(
          (project: any) =>
            Number(project.id) === Number(body.projectId),
        )
      : projects[0];

  const request: any = new CustomerAfterSalesRequest();

request.customerId = customer.id;
request.customerCode = customer.customerCode;
request.customerName = customer.customerName;
request.customerPhone = customer.mobile || customer.alternateMobile || '';

request.projectId = selectedProject?.id || null;
request.projectName =
  (selectedProject as any)?.projectName ||
  selectedProject?.customerName ||
  '';
request.branchName = selectedProject?.branchName || customer.branchName || '';
request.projectOwnerId = selectedProject?.projectOwnerId || null;
request.projectOwnerName = selectedProject?.projectOwnerName || '';

request.serviceId = service.id;
request.serviceName = service.serviceName;
request.serviceCategory = service.category;
request.servicePrice = Number(service.price || 0);
request.isPaidService = service.isPaidService;

request.preferredDate = body?.preferredDate
  ? new Date(body.preferredDate)
  : null;

request.customerRemarks = String(body?.customerRemarks || '').trim();
request.status = CustomerAfterSalesRequestStatus.NEW;

  const savedRequest =
  await this.afterSalesRequestRepository.save(request);

await this.addAfterSalesRequestActivity(
  savedRequest.id,
  'REQUEST_CREATED',
  'Service Request Created',
  `Customer requested "${savedRequest.serviceName}".`,
);

await this.notifyAfterSalesCustomer(
  savedRequest,
  'Service Request Submitted',
  `Your request for ${savedRequest.serviceName} has been submitted.`,
);

return savedRequest;
}

async updateAfterSalesRequest(id: number, body: any, user: any) {
  const request = await this.afterSalesRequestRepository.findOne({
    where: { id },
  });

  if (!request) {
    throw new NotFoundException('After-sales request not found');
  }

  if (body?.status) {
    request.status = body.status;
  }

  await this.addAfterSalesRequestActivity(
  request.id,
  'STATUS_CHANGED',
  `Status changed to ${body.status}`,
  body.adminRemarks || '',
  user,
);

await this.notifyAfterSalesCustomer(
  request,
  'Service Request Updated',
  `Your ${request.serviceName} request is now ${body.status}.`,
);

  request.assignedToName =
    String(body?.assignedToName || '').trim() || request.assignedToName;

  request.adminRemarks =
    String(body?.adminRemarks || '').trim() || request.adminRemarks;

  request.completionRemarks =
    String(body?.completionRemarks || '').trim() || request.completionRemarks;


  if (body?.status === CustomerAfterSalesRequestStatus.COMPLETED) {
    request.completedAt = new Date();
    request.completedBy = user?.id || user?.userId || null;
    request.completedByName = user?.name || user?.email || '';
  }

  if (body?.assignedTo !== undefined && body?.assignedTo !== '') {
  request.assignedTo = Number(body.assignedTo);
}

if (body?.assignedToName) {
  const newAssignedToName = String(body.assignedToName || '').trim();

  if (newAssignedToName && newAssignedToName !== request.assignedToName) {
    request.assignedToName = newAssignedToName;

    if (body?.assignedToRole) {
  request.assignedToRole = String(body.assignedToRole || '').trim();
}

    await this.addAfterSalesRequestActivity(
      request.id,
      'ASSIGNED',
      `Assigned to ${newAssignedToName}`,
      '',
      user,
    );

    await this.notifyAfterSalesCustomer(
  request,
  'Technician Assigned',
  `${newAssignedToName} has been assigned for your ${request.serviceName} request.`,
);
  }
}

const visitChanged =
  body?.scheduledVisitDate !== undefined ||
  body?.scheduledVisitTime !== undefined;

if (visitChanged) {
  if (body?.scheduledVisitDate) {
    request.scheduledVisitAt = new Date(body.scheduledVisitDate);
  }

  if (body?.scheduledVisitTime) {
    request.scheduledVisitTime = String(
      body.scheduledVisitTime || '',
    ).trim();
  }

  await this.addAfterSalesRequestActivity(
    request.id,
    'VISIT_SCHEDULED',
    'Visit Scheduled',
    `${body?.scheduledVisitDate || ''} ${body?.scheduledVisitTime || ''}`.trim(),
    user,
  );

  await this.notifyAfterSalesCustomer(
    request,
    'Visit Scheduled',
    `Visit scheduled for ${request.serviceName}: ${body?.scheduledVisitDate || ''} ${body?.scheduledVisitTime || ''}`.trim(),
  );
}

  return this.afterSalesRequestRepository.save(request);
}

async getAfterSalesRequestActivities(requestId: number) {
  return this.afterSalesRequestActivityRepository.find({
    where: { requestId },
    order: { createdAt: 'DESC' },
  });
}

async listAfterSalesRequestProofs(requestId: number) {
  return this.afterSalesRequestProofRepository.find({
    where: { requestId },
    order: { createdAt: 'DESC' },
  });
}

async addAfterSalesRequestProof(
  requestId: number,
  body: any,
  user: any,
) {
  const request = await this.afterSalesRequestRepository.findOne({
    where: { id: requestId },
  });

  if (!request) {
    throw new NotFoundException('After-sales request not found');
  }

  if (!body?.fileUrl) {
    throw new BadRequestException('File URL is required');
  }

  const proof = this.afterSalesRequestProofRepository.create({
    requestId,
    proofType:
      body?.proofType || CustomerAfterSalesProofType.OTHER,
    fileUrl: String(body.fileUrl || ''),
    fileName: String(body.fileName || ''),
    mimeType: String(body.mimeType || ''),
    remarks: String(body.remarks || ''),
    uploadedBy: user?.id || user?.userId || null,
    uploadedByName: user?.name || user?.email || '',
  });

  const savedProof =
    await this.afterSalesRequestProofRepository.save(proof);

  await this.addAfterSalesRequestActivity(
    requestId,
    'PROOF_UPLOADED',
    `Proof uploaded: ${savedProof.proofType}`,
    savedProof.remarks || savedProof.fileName || '',
    user,
  );

  return savedProof;
}

async submitAfterSalesRequestRating(
  customerId: number,
  requestId: number,
  body: any,
) {
  const request = await this.afterSalesRequestRepository.findOne({
    where: {
      id: requestId,
      customerId,
    } as any,
  });

  if (!request) {
    throw new NotFoundException('Service request not found');
  }

  if (request.status !== CustomerAfterSalesRequestStatus.COMPLETED) {
    throw new BadRequestException('Rating allowed only after completion');
  }

  const existing = await this.afterSalesRequestRatingRepository.findOne({
    where: {
      requestId,
      customerId,
    } as any,
  });

  if (existing) {
    throw new BadRequestException('Rating already submitted');
  }

  const rating = Number(body?.rating || 0);

  if (rating < 1 || rating > 5) {
    throw new BadRequestException('Rating must be between 1 and 5');
  }

  const saved = await this.afterSalesRequestRatingRepository.save({
    requestId,
    customerId,
    rating,
    feedback: String(body?.feedback || '').trim(),
    wouldRecommend: body?.wouldRecommend !== false,
  });

  await this.addAfterSalesRequestActivity(
    requestId,
    'RATING_SUBMITTED',
    `Customer submitted ${rating} star rating`,
    saved.feedback || '',
  );

  return saved;
}

private async notifyAfterSalesCustomer(
  request: any,
  title: string,
  message: string,
) {
  return this.createCustomerNotification({
    customerId: request.customerId,
    customerCode: request.customerCode,
    projectId: request.projectId,
    notificationType: 'AFTER_SALES_SERVICE',
    title,
    message,
    relatedEntityType: 'AFTER_SALES_REQUEST',
    relatedEntityId: request.id,
  });
}

  async updateComplaint(id: number, body: any, user: any) {
    const complaint = await this.complaintRepository.findOne({
      where: { id },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    const oldStatus = complaint.status;
const oldAssignedToName = complaint.assignedToName;
const oldServiceDate = complaint.serviceDate;
const oldStaffRemarks = complaint.staffRemarks;
const oldResolutionNote = complaint.resolutionNote;

    complaint.status = body.status || complaint.status;
    complaint.assignedTo = body.assignedTo ? Number(body.assignedTo) : complaint.assignedTo;
    complaint.assignedToName = body.assignedToName || complaint.assignedToName;
    complaint.serviceDate = body.serviceDate ? new Date(body.serviceDate) : complaint.serviceDate;
    complaint.staffRemarks = body.staffRemarks || complaint.staffRemarks;
    complaint.resolutionNote = body.resolutionNote || complaint.resolutionNote;

    if (body.status === 'CLOSED') {
      complaint.closedAt = new Date();
      complaint.closedBy = user?.id || null;
      complaint.closedByName = user?.name || user?.email || '';
    }

    const savedComplaint = await this.complaintRepository.save(complaint);

    if (oldStatus !== savedComplaint.status) {
  await this.addComplaintActivity(
    {
      complaintId: savedComplaint.id,
      customerId: savedComplaint.customerId,
      customerCode: savedComplaint.customerCode,
      projectId: savedComplaint.projectId,
      activityType:
        savedComplaint.status === 'CLOSED'
          ? CustomerComplaintActivityType.CLOSED
          : savedComplaint.status === 'REJECTED'
            ? CustomerComplaintActivityType.REJECTED
            : CustomerComplaintActivityType.STATUS_CHANGED,
      activityTitle: 'Status Updated',
      activityDescription: `Complaint status changed from ${oldStatus} to ${savedComplaint.status}.`,
      oldValue: oldStatus,
      newValue: savedComplaint.status,
    },
    user,
  );
}

if (oldAssignedToName !== savedComplaint.assignedToName) {
  await this.addComplaintActivity(
    {
      complaintId: savedComplaint.id,
      customerId: savedComplaint.customerId,
      customerCode: savedComplaint.customerCode,
      projectId: savedComplaint.projectId,
      activityType: CustomerComplaintActivityType.ASSIGNED,
      activityTitle: 'Complaint Assigned',
      activityDescription: `Assigned to ${savedComplaint.assignedToName || '-'}.`,
      oldValue: oldAssignedToName || '',
      newValue: savedComplaint.assignedToName || '',
    },
    user,
  );
}

if (
  String(oldServiceDate || '') !==
  String(savedComplaint.serviceDate || '')
) {
  await this.addComplaintActivity(
    {
      complaintId: savedComplaint.id,
      customerId: savedComplaint.customerId,
      customerCode: savedComplaint.customerCode,
      projectId: savedComplaint.projectId,
      activityType: CustomerComplaintActivityType.SERVICE_SCHEDULED,
      activityTitle: 'Service Scheduled',
      activityDescription: savedComplaint.serviceDate
        ? `Service scheduled for ${savedComplaint.serviceDate}.`
        : 'Service date updated.',
      oldValue: oldServiceDate ? String(oldServiceDate) : '',
      newValue: savedComplaint.serviceDate
        ? String(savedComplaint.serviceDate)
        : '',
    },
    user,
  );
}

if (oldStaffRemarks !== savedComplaint.staffRemarks) {
  await this.addComplaintActivity(
    {
      complaintId: savedComplaint.id,
      customerId: savedComplaint.customerId,
      customerCode: savedComplaint.customerCode,
      projectId: savedComplaint.projectId,
      activityType: CustomerComplaintActivityType.STAFF_REMARK_ADDED,
      activityTitle: 'Staff Remark Added',
      activityDescription: savedComplaint.staffRemarks || '',
      oldValue: oldStaffRemarks || '',
      newValue: savedComplaint.staffRemarks || '',
    },
    user,
  );
}

if (oldResolutionNote !== savedComplaint.resolutionNote) {
  await this.addComplaintActivity(
    {
      complaintId: savedComplaint.id,
      customerId: savedComplaint.customerId,
      customerCode: savedComplaint.customerCode,
      projectId: savedComplaint.projectId,
      activityType: CustomerComplaintActivityType.RESOLUTION_ADDED,
      activityTitle: 'Resolution Added',
      activityDescription: savedComplaint.resolutionNote || '',
      oldValue: oldResolutionNote || '',
      newValue: savedComplaint.resolutionNote || '',
    },
    user,
  );
}

await this.createCustomerNotification({
  customerId: savedComplaint.customerId,
  customerCode: savedComplaint.customerCode,
  projectId: savedComplaint.projectId,
  notificationType: 'COMPLAINT_UPDATE',
  title: 'Complaint Updated',
  message: `Your complaint #${savedComplaint.id} status is now ${savedComplaint.status}.`,
  relatedEntityType: 'CUSTOMER_COMPLAINT',
  relatedEntityId: savedComplaint.id,
});

return savedComplaint;
  }

  async getComplaintActivities(complaintId: number) {
  return this.complaintActivityRepository.find({
    where: { complaintId },
    order: { createdAt: 'ASC' },
  });
}

  async createReferral(body: any) {
  const referral: any = new CustomerReferral();

  Object.assign(referral, {
    ...body,
    customerId: Number(body.customerId),
    rewardAmount: Number(body.rewardAmount || 5000),
  });

  const savedReferral = await this.referralRepository.save(referral);

  await this.addReferralActivity(
    savedReferral.id,
    'REFERRAL_CREATED',
    'Referral Submitted',
    `Referral submitted for ${savedReferral.referredName}.`,
  );

  return savedReferral;
}

async assignReferral(
  id: number,
  body: any,
  user: any,
) {
  const referral = await this.referralRepository.findOne({
    where: { id },
  });

  if (!referral) {
    throw new NotFoundException('Referral not found');
  }

  if (!body?.assignedTo) {
    throw new BadRequestException(
      'Assigned user is required',
    );
  }

  referral.assignedTo = Number(body.assignedTo);
  referral.assignedToName = String(
    body.assignedToName || '',
  ).trim();
  referral.assignedToRole = String(
    body.assignedToRole || '',
  ).trim();
  referral.assignedAt = new Date();

  const savedReferral =
    await this.referralRepository.save(referral);

    const existingContact =
  await this.telecallingContactRepository.findOne({
    where: {
      sourceModule: 'CUSTOMER_REFERRAL',
      sourceReferralId: savedReferral.id,
    } as any,
  });

if (!existingContact) {
  const contact: any = new TelecallingContact();

  Object.assign(contact, {
    name: savedReferral.referredName,
    phone: savedReferral.referredPhone,
    city: savedReferral.referredCity || '',
    address: savedReferral.referredAddress || '',
    assignedTo: savedReferral.assignedTo,
    assignedToName: savedReferral.assignedToName,
    status: ContactStatus.NEW,
    stage: 'TELECALLING',
    hasCalled: false,
    convertedToLead: false,
    isInStorage: false,
    remarks: savedReferral.remarks || '',
    sourceModule: 'CUSTOMER_REFERRAL',
    sourceReferralId: savedReferral.id,
    referralCustomerCode: savedReferral.customerCode || '',
    referralReferrerName: savedReferral.referrerName || '',
    referralReferrerPhone: savedReferral.referrerPhone || '',
    referralRemarks: savedReferral.remarks || '',
  });

  await this.telecallingContactRepository.save(contact);
} else {
  existingContact.assignedTo = savedReferral.assignedTo;
  existingContact.assignedToName = savedReferral.assignedToName;
  existingContact.isInStorage = false;
  existingContact.stage = 'TELECALLING';

  await this.telecallingContactRepository.save(existingContact);
}

  await this.addReferralActivity(
    savedReferral.id,
    'ASSIGNED',
    'Referral Assigned',
    `Assigned to ${savedReferral.assignedToName}`,
    user,
  );

  await this.createCustomerNotification({
    customerId: savedReferral.customerId,
    customerCode: savedReferral.customerCode,
    notificationType: 'CUSTOMER_REFERRAL',
    title: 'Referral Assigned',
    message: `Your referral for ${savedReferral.referredName} has been assigned to our team.`,
    relatedEntityType: 'CUSTOMER_REFERRAL',
    relatedEntityId: savedReferral.id,
  });

  return savedReferral;
}

  async createWorkDateRequest(body: any) {
    const request = this.workDateRequestRepository.create({
      ...body,
      customerId: Number(body.customerId),
      projectId: Number(body.projectId),
      requestedWorkDate: new Date(body.requestedWorkDate),
      currentWorkDate: body.currentWorkDate ? new Date(body.currentWorkDate) : undefined,
    });

    return this.workDateRequestRepository.save(request);
  }

  async createPaymentReceipt(body: any) {
  const receipt = new CustomerPaymentReceipt();

Object.assign(receipt, {
  ...body,
  customerId: Number(body.customerId),
  projectId: Number(body.projectId),
  amount: Number(body.amount || 0),
  paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
});

const savedReceipt = await this.paymentReceiptRepository.save(receipt);

  await this.addPaymentReceiptActivity({
    receiptId: savedReceipt.id,
    customerId: savedReceipt.customerId,
    projectId: savedReceipt.projectId,
    activityType: CustomerPaymentReceiptActivityType.RECEIPT_UPLOADED,
    activityTitle: 'Payment Receipt Uploaded',
    activityDescription: `Receipt of ₹${Number(
      savedReceipt.amount || 0,
    ).toLocaleString('en-IN')} submitted for verification.`,
    newValue: savedReceipt.status || 'SUBMITTED',
    performedByName: savedReceipt.customerName || 'Customer',
    performedByRole: 'CUSTOMER',
  });

  return savedReceipt;
}

  async customerLogin(username: string, password: string) {
  const loginUsername = String(username || '').trim();
  const loginPassword = String(password || '').trim();

  if (!loginUsername || !loginPassword) {
    throw new UnauthorizedException('Username and password are required');
  }

  const customer = await this.customerRepository.findOne({
    where: [
      { portalUsername: loginUsername, isPortalEnabled: true, isHidden: false },
      { mobile: loginUsername, isPortalEnabled: true, isHidden: false },
      { electricityKNumber: loginUsername, isPortalEnabled: true, isHidden: false },
    ] as any,
  });

  if (!customer) {
    throw new UnauthorizedException('Customer portal access not found');
  }

  const expectedPassword =
    customer.portalPassword ||
    customer.mobile ||
    customer.electricityKNumber ||
    customer.customerCode;

  if (loginPassword !== expectedPassword) {
    throw new UnauthorizedException('Invalid customer password');
  }

  (customer as any).lastPortalLoginAt = new Date();
  await this.customerRepository.save(customer);

  const access_token = jwt.sign(
    {
      sub: customer.id,
      customerId: customer.id,
      customerCode: customer.customerCode,
      roleType: 'CUSTOMER_PORTAL',
      roles: ['CUSTOMER'],
    },
    'mysecretkey',
    { expiresIn: '7d' },
  );

  return {
    access_token,
    customer: {
      id: customer.id,
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      mobile: customer.mobile,
      email: customer.email,
      electricityKNumber: customer.electricityKNumber,
    },
  };
}

async changeCustomerPortalPassword(customerId: number, body: any) {
  const currentPassword = String(body?.currentPassword || '').trim();
  const newPassword = String(body?.newPassword || '').trim();
  const confirmPassword = String(body?.confirmPassword || '').trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new BadRequestException(
      'Current password, new password and confirm password are required',
    );
  }

  if (newPassword.length < 4) {
    throw new BadRequestException('New password must be at least 4 characters');
  }

  if (newPassword !== confirmPassword) {
    throw new BadRequestException('New password and confirm password do not match');
  }

  const customer = await this.customerRepository.findOne({
    where: {
      id: customerId,
      isPortalEnabled: true,
      isHidden: false,
    } as any,
  });

  if (!customer) {
    throw new NotFoundException('Customer portal access not found');
  }

  const expectedPassword =
    customer.portalPassword ||
    customer.mobile ||
    customer.electricityKNumber ||
    customer.customerCode;

  if (currentPassword !== expectedPassword) {
    throw new UnauthorizedException('Current password is incorrect');
  }

  customer.portalPassword = newPassword;

  await this.customerRepository.save(customer);

  return {
    success: true,
    message: 'Password changed successfully',
  };
}

async uploadComplaintAttachments(files: any[], user: any) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new BadRequestException('At least one complaint attachment is required');
  }

  const uploadedFiles: any[] = [];

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    'video/webm',
  ];

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket =
    process.env.SUPABASE_PROJECT_DOCUMENTS_BUCKET || 'project-documents';

  if (!supabaseUrl || !serviceKey) {
    throw new BadRequestException('Supabase storage is not configured');
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  for (const file of files) {
    if (!file) continue;

    const mimeType = String(file.mimetype || '');
    const isImage = mimeType.startsWith('image/');
    const isAudio =
      mimeType.startsWith('audio/') ||
      mimeType === 'video/webm';

    if (!allowedTypes.includes(mimeType)) {
      throw new BadRequestException(
        'Only JPG, PNG, WEBP photos and MP3, WAV, WEBM, OGG audio files are allowed',
      );
    }

    const maxImageSize = 5 * 1024 * 1024;
    const maxAudioSize = 15 * 1024 * 1024;

    if (isImage && file.size > maxImageSize) {
      throw new BadRequestException('Complaint photo must be less than 5 MB');
    }

    if (isAudio && file.size > maxAudioSize) {
      throw new BadRequestException('Complaint audio must be less than 15 MB');
    }

    const originalName = String(file.originalname || 'complaint-attachment');
    const extension = originalName.includes('.')
      ? originalName.split('.').pop()
      : mimeType.split('/')[1] || 'file';

    const safeExtension = String(extension || 'file').replace(
      /[^a-zA-Z0-9]/g,
      '',
    );

    const folder = isImage
      ? 'customer-complaints'
      : 'customer-complaint-audio';

    const filePath = `${folder}/customer-${
      user?.id || 'unknown'
    }/${Date.now()}-${randomUUID()}.${safeExtension}`;

    const uploadResult = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadResult.error) {
      throw new BadRequestException(uploadResult.error.message);
    }

    const publicUrlResult = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    uploadedFiles.push({
      fileUrl: publicUrlResult.data.publicUrl,
      fileName: originalName,
      fileSize: file.size,
      filePath,
      mimeType,
      attachmentType: isImage ? 'IMAGE' : 'AUDIO',
    });
  }

  return {
    message: `${uploadedFiles.length} complaint attachment(s) uploaded successfully`,
    attachments: uploadedFiles,
  };
}

async listWorkDateRequests(query: any) {
  const page = Number(query?.page || 1);
  const limit = Math.min(Number(query?.limit || 20), 100);
  const skip = (page - 1) * limit;

  const qb = this.workDateRequestRepository
    .createQueryBuilder('request')
.leftJoin(Project, 'project', 'project.id = request.projectId')
.addSelect('project.status', 'projectStatus')
.addSelect('project.address', 'projectAddress')
.addSelect('project.gpsAddress', 'projectGpsAddress')
.addSelect('project.gpsLatitude', 'projectGpsLatitude')
.addSelect('project.gpsLongitude', 'projectGpsLongitude')
.where('request.isHidden = false')
    .orderBy('request.createdAt', 'DESC');

  if (query?.customerId) {
    qb.andWhere('request.customerId = :customerId', {
      customerId: Number(query.customerId),
    });
  }

  if (query?.projectId) {
    qb.andWhere('request.projectId = :projectId', {
      projectId: Number(query.projectId),
    });
  }

  if (query?.projectStage === 'COMPLETED') {
  qb.andWhere('project.status = :completedStatus', {
    completedStatus: 'COMPLETED',
  });
}

if (query?.projectStage === 'IN_PROGRESS') {
  qb.andWhere(
    '(project.status IS NULL OR project.status != :completedStatus)',
    {
      completedStatus: 'COMPLETED',
    },
  );
}

  if (query?.status) {
    qb.andWhere('request.status = :status', {
      status: query.status,
    });
  }

  if (query?.branchName) {
    qb.andWhere('LOWER(request.branchName) LIKE :branchName', {
      branchName: `%${String(query.branchName).toLowerCase()}%`,
    });
  }

  if (query?.customerSearch) {
    const search = `%${String(query.customerSearch).toLowerCase()}%`;

    qb.andWhere(
      `
      LOWER(request.customerName) LIKE :search
      OR LOWER(request.customerCode) LIKE :search
      `,
      { search },
    );
  }

  qb.skip(skip).take(limit);

  const rawAndEntities = await qb.getRawAndEntities();

const data = rawAndEntities.entities.map(
  (item: any, index: number) => {
    const raw = rawAndEntities.raw[index] || {};

    return {
      ...item,

      projectStatus: raw.projectStatus || '',

      projectAddress: raw.projectAddress || '',

      projectGpsAddress: raw.projectGpsAddress || '',

      projectGpsLatitude:
        raw.projectGpsLatitude ?? null,

      projectGpsLongitude:
        raw.projectGpsLongitude ?? null,
    };
  },
);

const total = await qb.getCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async updateWorkDateRequest(id: number, body: any, user: any) {
  const request = await this.workDateRequestRepository.findOne({
    where: { id },
  });

  if (!request) {
    throw new NotFoundException('Work date request not found');
  }

  request.status = body.status || request.status;
  request.approvalRemarks = body.approvalRemarks || request.approvalRemarks;

  if (
    body.status === 'APPROVED' ||
    body.status === 'REJECTED' ||
    body.status === 'RESCHEDULED'
  ) {
    request.approvedBy = user?.id || null;
    request.approvedByName = user?.name || user?.email || '';
    request.approvedAt = new Date();
  }

  const savedRequest = await this.workDateRequestRepository.save(request);

await this.createCustomerNotification({
  customerId: savedRequest.customerId,
  customerCode: savedRequest.customerCode,
  projectId: savedRequest.projectId,
  notificationType: 'WORK_REMINDER',
  title: 'Work Date Request Updated',
  message: `Your work date request #${savedRequest.id} is now ${savedRequest.status}.`,
  relatedEntityType: 'WORK_DATE_REQUEST',
  relatedEntityId: savedRequest.id,
});

return savedRequest;
}

async uploadPaymentReceipts(files: any[], user: any) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new BadRequestException('At least one payment receipt is required');
  }

  const uploadedFiles: any[] = [];

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket =
    process.env.SUPABASE_PROJECT_DOCUMENTS_BUCKET || 'project-documents';

  if (!supabaseUrl || !serviceKey) {
    throw new BadRequestException('Supabase storage is not configured');
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  for (const file of files) {
    if (!file) continue;

    const mimeType = String(file.mimetype || '');

    if (!allowedTypes.includes(mimeType)) {
      throw new BadRequestException(
        'Only JPG, PNG, WEBP and PDF receipts are allowed',
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new BadRequestException('Receipt file must be less than 5 MB');
    }

    const originalName = String(file.originalname || 'payment-receipt');
    const extension = originalName.includes('.')
      ? originalName.split('.').pop()
      : mimeType.split('/')[1] || 'file';

    const safeExtension = String(extension || 'file').replace(
      /[^a-zA-Z0-9]/g,
      '',
    );

    const filePath = `customer-payment-receipts/customer-${
      user?.id || 'unknown'
    }/${Date.now()}-${randomUUID()}.${safeExtension}`;

    const uploadResult = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadResult.error) {
      throw new BadRequestException(uploadResult.error.message);
    }

    const publicUrlResult = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    uploadedFiles.push({
      fileUrl: publicUrlResult.data.publicUrl,
      fileName: originalName,
      fileSize: file.size,
      filePath,
      mimeType,
    });
  }

  return {
    message: `${uploadedFiles.length} receipt file(s) uploaded successfully`,
    receipts: uploadedFiles,
  };
}

async listPaymentReceipts(query: any) {
  const page = Number(query?.page || 1);
  const limit = Math.min(Number(query?.limit || 20), 100);
  const skip = (page - 1) * limit;

  const qb = this.paymentReceiptRepository
    .createQueryBuilder('receipt')
.leftJoin(Project, 'project', 'project.id = receipt.projectId')
.addSelect('project.status', 'projectStatus')
.where('receipt.isHidden = false')
    .orderBy('receipt.createdAt', 'DESC');

  if (query?.customerId) {
    qb.andWhere('receipt.customerId = :customerId', {
      customerId: Number(query.customerId),
    });
  }

  if (query?.projectId) {
    qb.andWhere('receipt.projectId = :projectId', {
      projectId: Number(query.projectId),
    });
  }

  if (query?.projectStage === 'COMPLETED') {
  qb.andWhere('project.status = :completedStatus', {
    completedStatus: 'COMPLETED',
  });
}

if (query?.projectStage === 'IN_PROGRESS') {
  qb.andWhere(
    '(project.status IS NULL OR project.status != :completedStatus)',
    {
      completedStatus: 'COMPLETED',
    },
  );
}

  if (query?.status) {
    qb.andWhere('receipt.status = :status', {
      status: query.status,
    });
  }

  if (query?.paymentMode) {
    qb.andWhere('receipt.paymentMode = :paymentMode', {
      paymentMode: query.paymentMode,
    });
  }

  if (query?.branchName) {
    qb.andWhere('LOWER(receipt.branchName) LIKE :branchName', {
      branchName: `%${String(query.branchName).toLowerCase()}%`,
    });
  }

  if (query?.customerSearch) {
    const search = `%${String(query.customerSearch).toLowerCase()}%`;

    qb.andWhere(
      `
      LOWER(receipt.customerName) LIKE :search
      OR LOWER(receipt.customerCode) LIKE :search
      `,
      { search },
    );
  }

  if (query?.fromDate) {
    qb.andWhere('receipt.createdAt >= :fromDate', {
      fromDate: new Date(query.fromDate),
    });
  }

  if (query?.toDate) {
    const endDate = new Date(query.toDate);
    endDate.setHours(23, 59, 59, 999);

    qb.andWhere('receipt.createdAt <= :toDate', {
      toDate: endDate,
    });
  }

  qb.skip(skip).take(limit);

  const rawAndEntities = await qb.getRawAndEntities();
const data = rawAndEntities.entities.map((item: any, index: number) => ({
  ...item,
  projectStatus: rawAndEntities.raw[index]?.projectStatus || '',
}));
const total = await qb.getCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async updatePaymentReceipt(id: number, body: any, user: any) {
  const receipt = await this.paymentReceiptRepository.findOne({
    where: { id },
  });

  if (!receipt) {
    throw new NotFoundException('Payment receipt not found');
  }

  const oldStatus = receipt.status;
  const oldRemarks = receipt.verificationRemarks;

  receipt.status = body.status || receipt.status;
  receipt.verificationRemarks =
    body.verificationRemarks || receipt.verificationRemarks;

  if (body.status === 'VERIFIED' || body.status === 'REJECTED') {
    receipt.verifiedBy = user?.id || null;
    receipt.verifiedByName = user?.name || user?.email || '';
    receipt.verifiedAt = new Date();
  }

  const savedReceipt = await this.paymentReceiptRepository.save(receipt);

  if (oldStatus !== savedReceipt.status) {
    await this.addPaymentReceiptActivity(
      {
        receiptId: savedReceipt.id,
        customerId: savedReceipt.customerId,
        projectId: savedReceipt.projectId,
        activityType:
          savedReceipt.status === 'VERIFIED'
            ? CustomerPaymentReceiptActivityType.VERIFIED
            : savedReceipt.status === 'REJECTED'
              ? CustomerPaymentReceiptActivityType.REJECTED
              : CustomerPaymentReceiptActivityType.STATUS_CHANGED,
        activityTitle:
          savedReceipt.status === 'VERIFIED'
            ? 'Payment Receipt Verified'
            : savedReceipt.status === 'REJECTED'
              ? 'Payment Receipt Rejected'
              : 'Payment Receipt Status Updated',
        activityDescription: `Receipt status changed from ${oldStatus} to ${savedReceipt.status}.`,
        oldValue: oldStatus,
        newValue: savedReceipt.status,
      },
      user,
    );
  }

  if (oldRemarks !== savedReceipt.verificationRemarks) {
    await this.addPaymentReceiptActivity(
      {
        receiptId: savedReceipt.id,
        customerId: savedReceipt.customerId,
        projectId: savedReceipt.projectId,
        activityType: CustomerPaymentReceiptActivityType.PAYMENT_UPDATED,
        activityTitle: 'Verification Remark Updated',
        activityDescription: savedReceipt.verificationRemarks || '',
        oldValue: oldRemarks || '',
        newValue: savedReceipt.verificationRemarks || '',
      },
      user,
    );
  }

  await this.createCustomerNotification({
    customerId: savedReceipt.customerId,
    customerCode: savedReceipt.customerCode,
    projectId: savedReceipt.projectId,
    notificationType: 'PAYMENT_REMINDER',
    title: 'Payment Receipt Updated',
    message: `Your payment receipt #${savedReceipt.id} is now ${savedReceipt.status}.`,
    relatedEntityType: 'PAYMENT_RECEIPT',
    relatedEntityId: savedReceipt.id,
  });

  return savedReceipt;
}

async listReferrals(query: any) {
  const page = Number(query?.page || 1);
  const limit = Math.min(Number(query?.limit || 20), 100);
  const skip = (page - 1) * limit;

  const qb = this.referralRepository
    .createQueryBuilder('referral')
    .where('referral.isHidden = false')
    .orderBy('referral.createdAt', 'DESC');

  if (query?.customerId) {
    qb.andWhere('referral.customerId = :customerId', {
      customerId: Number(query.customerId),
    });
  }

  if (query?.search) {
    const search = `%${String(query.search).toLowerCase()}%`;

    qb.andWhere(
      `
      LOWER(referral.referrerName) LIKE :search
      OR LOWER(referral.referrerPhone) LIKE :search
      OR LOWER(referral.referredName) LIKE :search
      OR LOWER(referral.referredPhone) LIKE :search
      OR LOWER(referral.customerCode) LIKE :search
      `,
      { search },
    );
  }

  if (query?.city) {
    qb.andWhere('LOWER(referral.referredCity) LIKE :city', {
      city: `%${String(query.city).toLowerCase()}%`,
    });
  }

  const rawReferrals = await qb.getMany();

  const referralsWithProgress = await Promise.all(
    rawReferrals.map((item: any) =>
      this.buildReferralProgressSnapshot(item),
    ),
  );

  const filtered =
    query?.status
      ? referralsWithProgress.filter(
          (item: any) => item.status === query.status,
        )
      : referralsWithProgress;

  return {
    data: filtered.slice(skip, skip + limit),
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit) || 1,
  };
}

async updateReferral(id: number, body: any, user: any) {
  const referral = await this.referralRepository.findOne({
    where: { id },
  });

  if (!referral) {
    throw new NotFoundException('Referral not found');
  }

  referral.status = body.status || referral.status;
  referral.linkedLeadId = body.linkedLeadId
    ? Number(body.linkedLeadId)
    : referral.linkedLeadId;
  referral.linkedMeetingId = body.linkedMeetingId
    ? Number(body.linkedMeetingId)
    : referral.linkedMeetingId;
  referral.linkedProjectId = body.linkedProjectId
    ? Number(body.linkedProjectId)
    : referral.linkedProjectId;
  referral.rewardAmount = body.rewardAmount
    ? Number(body.rewardAmount)
    : referral.rewardAmount;
  referral.remarks = body.remarks || referral.remarks;

  if (body.status === 'REWARD_PAID' || body.rewardPaid === true) {
    referral.rewardPaid = true;
    referral.rewardPaidAt = new Date();
    referral.rewardPaidBy = user?.id || null;
    referral.rewardPaidByName = user?.name || user?.email || '';
  }

  const savedReferral = await this.referralRepository.save(referral);

await this.createCustomerNotification({
  customerId: savedReferral.customerId,
  customerCode: savedReferral.customerCode,
  notificationType: 'GENERAL',
  title: 'Referral Updated',
  message: `Your referral for ${savedReferral.referredName} is now ${savedReferral.status}.`,
  relatedEntityType: 'CUSTOMER_REFERRAL',
  relatedEntityId: savedReferral.id,
});

return savedReferral;
}

private async buildReferralProgressSnapshot(referral: any) {
  const phone = String(referral?.referredPhone || '').trim();

  const contact =
    await this.telecallingContactRepository.findOne({
      where: [
        {
          sourceModule: 'CUSTOMER_REFERRAL',
          sourceReferralId: referral.id,
        } as any,
        phone ? ({ phone } as any) : ({} as any),
      ],
      order: {
        updatedAt: 'DESC',
      } as any,
    });

  let lead: any = null;

  if (referral.linkedLeadId) {
    lead = await this.leadRepository.findOne({
      where: { id: Number(referral.linkedLeadId) },
    });
  }

  if (!lead && phone) {
    lead = await this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.phone = :phone', { phone })
      .orderBy('lead.createdAt', 'DESC')
      .getOne();
  }

  let meeting: any = null;

  if (referral.linkedMeetingId) {
    meeting = await this.meetingRepository.findOne({
      where: { id: Number(referral.linkedMeetingId) },
    });
  }

  if (!meeting && lead?.id) {
    meeting = await this.meetingRepository
      .createQueryBuilder('meeting')
      .where('meeting.leadId = :leadId', {
        leadId: Number(lead.id),
      })
      .orderBy('meeting.createdAt', 'DESC')
      .getOne();
  }

  let project: any = null;

  if (referral.linkedProjectId) {
    project = await this.projectRepository.findOne({
      where: {
        id: Number(referral.linkedProjectId),
        isHidden: false,
      } as any,
    });
  }

  if (!project && phone) {
    project = await this.projectRepository
      .createQueryBuilder('project')
      .where('project.isHidden = false')
      .andWhere('project.customerPhone = :phone', { phone })
      .orderBy('project.createdAt', 'DESC')
      .getOne();
  }

  let calculatedStatus = referral.status || 'REFERRED';

  if (contact) {
    calculatedStatus = 'CONTACTED';
  }

  if (lead) {
    calculatedStatus = 'LEAD_CREATED';
  }

  if (meeting) {
    calculatedStatus =
      meeting.status === 'COMPLETED'
        ? 'MEETING_DONE'
        : 'MEETING_SCHEDULED';
  }

  if (project) {
    calculatedStatus =
      project.status === 'COMPLETED'
        ? 'PROJECT_COMPLETED'
        : 'PROJECT_CREATED';
  }

  if (referral.rewardPaid || referral.status === 'REWARD_PAID') {
    calculatedStatus = 'REWARD_PAID';
  }

  return {
    ...referral,
    status: calculatedStatus,
    calculatedStatus,
    crmProgress: {
      contactId: contact?.id || null,
      leadId: lead?.id || referral.linkedLeadId || null,
      meetingId: meeting?.id || referral.linkedMeetingId || null,
      projectId: project?.id || referral.linkedProjectId || null,
      projectStatus: project?.status || '',
      assignedToName:
        referral.assignedToName ||
        contact?.assignedToName ||
        '',
    },
  };
}

async convertReferralToLead(id: number, user: any) {
  const referral = await this.referralRepository.findOne({
    where: { id },
  });

  if (!referral) {
    throw new NotFoundException('Referral not found');
  }

  if (referral.linkedLeadId) {
    throw new BadRequestException('Lead already created for this referral');
  }

  const lead: any = await this.leadService.create(
    {
      name: referral.referredName,
      phone: referral.referredPhone,
      city: referral.referredCity || '',
      address: referral.referredAddress || '',
      source: 'CUSTOMER_REFERRAL',
      remarks: `Customer referral from ${referral.referrerName || referral.customerCode || '-'}.\n\n${referral.remarks || ''}`,
      status: 'NEW' as any,
      potentialPercentage: 25,
    } as any,
    user,
  );

  referral.linkedLeadId = lead.id;
  referral.status = CustomerReferralStatus.LEAD_CREATED;

  const savedReferral = await this.referralRepository.save(referral);

  await this.addReferralActivity(
    savedReferral.id,
    'LEAD_CREATED',
    'Lead Created',
    `Lead #${lead.id} created from referral.`,
    user,
  );

  await this.createCustomerNotification({
    customerId: savedReferral.customerId,
    customerCode: savedReferral.customerCode,
    notificationType: 'CUSTOMER_REFERRAL',
    title: 'Referral Converted to Lead',
    message: `Your referral for ${savedReferral.referredName} has been converted to a lead.`,
    relatedEntityType: 'CUSTOMER_REFERRAL',
    relatedEntityId: savedReferral.id,
  });

  return savedReferral;
}

private async addReferralActivity(
  referralId: number,
  activityType: string,
  activityTitle: string,
  activityDescription?: string,
  user?: any,
) {
  return this.referralActivityRepository.save({
    referralId,
    activityType,
    activityTitle,
    activityDescription: activityDescription || '',
    performedBy: user?.id || user?.userId || null,
    performedByName: user?.name || user?.email || 'System',
  });
}

async getReferralActivities(referralId: number) {
  const referral = await this.referralRepository.findOne({
    where: { id: referralId },
  });

  if (!referral) {
    throw new NotFoundException('Referral not found');
  }

  const savedActivities =
    await this.referralActivityRepository.find({
      where: { referralId },
      order: { createdAt: 'DESC' },
    });

  const snapshot =
    await this.buildReferralProgressSnapshot(referral);

  const autoActivities: any[] = [];

  if (snapshot.crmProgress?.leadId) {
    autoActivities.push({
      id: `auto-lead-${snapshot.crmProgress.leadId}`,
      referralId,
      activityType: 'LEAD_CREATED_AUTO',
      activityTitle: 'Lead Created',
      activityDescription: `Lead #${snapshot.crmProgress.leadId} found in CRM.`,
      performedByName: 'System',
      createdAt: referral.updatedAt || referral.createdAt,
    });
  }

  if (snapshot.crmProgress?.meetingId) {
    autoActivities.push({
      id: `auto-meeting-${snapshot.crmProgress.meetingId}`,
      referralId,
      activityType: 'MEETING_UPDATED_AUTO',
      activityTitle:
        snapshot.status === 'MEETING_DONE' ||
        ['PROJECT_CREATED', 'PROJECT_COMPLETED', 'REWARD_PAID'].includes(
          snapshot.status,
        )
          ? 'Meeting Completed'
          : 'Meeting Scheduled',
      activityDescription: `Meeting #${snapshot.crmProgress.meetingId} found in CRM.`,
      performedByName: 'System',
      createdAt: referral.updatedAt || referral.createdAt,
    });
  }

  if (snapshot.crmProgress?.projectId) {
    autoActivities.push({
      id: `auto-project-${snapshot.crmProgress.projectId}`,
      referralId,
      activityType: 'PROJECT_UPDATED_AUTO',
      activityTitle:
        snapshot.status === 'PROJECT_COMPLETED' ||
        snapshot.status === 'REWARD_PAID'
          ? 'Project Completed'
          : 'Project Created',
      activityDescription: `Project #${snapshot.crmProgress.projectId} found in CRM.`,
      performedByName: 'System',
      createdAt: referral.updatedAt || referral.createdAt,
    });
  }

  return [...autoActivities, ...savedActivities].sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  );
}

async createCustomerNotification(body: any) {
  if (!body?.customerId) {
    return null;
  }

  const notification = this.notificationRepository.create({
  customerId: Number(body.customerId),
  customerCode: body.customerCode || '',
  projectId: body.projectId ? Number(body.projectId) : null,
  notificationType: body.notificationType || 'GENERAL',
  title: body.title || 'Notification',
  message: body.message || '',
  relatedEntityType: body.relatedEntityType || '',
  relatedEntityId: body.relatedEntityId ? Number(body.relatedEntityId) : null,
} as any);

  return this.notificationRepository.save(notification);
}

async markNotificationRead(id: number, customerId: number) {
  const notification = await this.notificationRepository.findOne({
    where: { id, customerId },
  });

  if (!notification) {
    throw new NotFoundException('Notification not found');
  }

  notification.isRead = true;
  notification.readAt = new Date();

  return this.notificationRepository.save(notification);
}

async getCustomerDocuments(customerId: number, query: any) {
  const customer = await this.customerRepository.findOne({
    where: { id: customerId, isHidden: false },
  });

  if (!customer) {
    throw new NotFoundException('Customer not found');
  }

  const projects = await this.projectRepository.find({
    where: { customerId, isHidden: false },
  });

  const projectIds = projects.map((project) => project.id);

  if (!projectIds.length) {
    return {
      data: [],
      total: 0,
    };
  }

  const qb = this.projectDocumentRepository
    .createQueryBuilder('document')
    .where('document.projectId IN (:...projectIds)', { projectIds })
    .andWhere('document.visibleToCustomer = true')
    .orderBy('document.createdAt', 'DESC');

  if (query?.projectId) {
    qb.andWhere('document.projectId = :projectId', {
      projectId: Number(query.projectId),
    });
  }

  if (query?.department) {
    qb.andWhere('document.department = :department', {
      department: query.department,
    });
  }

  if (query?.documentType) {
    qb.andWhere('document.documentType = :documentType', {
      documentType: query.documentType,
    });
  }

  const data = await qb.getMany();

  return {
    data,
    total: data.length,
  };
}

async getCustomerStaffDirectory() {
  return this.staffMemberRepository.find({
    where: {
      visibleToCustomer: true,
      isActive: true,
      isHidden: false,
    } as any,
    order: {
      department: 'ASC',
      fullName: 'ASC',
    } as any,
  });
}

async createCleaningReminder(body: any) {
  const reminder = this.cleaningReminderRepository.create({
    customerId: Number(body.customerId),
    customerCode: body.customerCode || '',
    projectId: Number(body.projectId),
    projectName: body.projectName || '',
    cleaningDate: new Date(body.cleaningDate),
    nextCleaningDate: body.nextCleaningDate
      ? new Date(body.nextCleaningDate)
      : undefined,
    status: body.status || 'PENDING',
    remarks: body.remarks || '',
  });

  return this.cleaningReminderRepository.save(reminder);
}

async listCleaningReminders(query: any) {
  const page = Number(query?.page || 1);
  const limit = Math.min(Number(query?.limit || 20), 100);
  const skip = (page - 1) * limit;

  const qb = this.cleaningReminderRepository
  .createQueryBuilder('cleaning')
  .leftJoin(
    Project,
    'project',
    'project.id = cleaning.projectId',
  )
  .addSelect('project.status', 'projectStatus')
.addSelect('project.address', 'projectAddress')
.addSelect('project.gpsAddress', 'projectGpsAddress')
.addSelect('project.gpsLatitude', 'projectGpsLatitude')
.addSelect('project.gpsLongitude', 'projectGpsLongitude')
  .orderBy(
    'cleaning.cleaningDate',
    'DESC',
  );

  if (query?.showHidden === 'true') {
    qb.where('1 = 1');
  } else {
    qb.where('cleaning.isHidden = false');
  }

  if (query?.customerId) {
    qb.andWhere('cleaning.customerId = :customerId', {
      customerId: Number(query.customerId),
    });
  }

  if (query?.projectId) {
    qb.andWhere('cleaning.projectId = :projectId', {
      projectId: Number(query.projectId),
    });
  }

  if (query?.projectStage === 'COMPLETED') {
  qb.andWhere('project.status = :completedStatus', {
    completedStatus: 'COMPLETED',
  });
}

if (query?.projectStage === 'IN_PROGRESS') {
  qb.andWhere(
    '(project.status IS NULL OR project.status != :completedStatus)',
    {
      completedStatus: 'COMPLETED',
    },
  );
}

  if (query?.status) {
    qb.andWhere('cleaning.status = :status', {
      status: query.status,
    });
  }

  if (query?.customerSearch) {
    const search = `%${String(query.customerSearch).toLowerCase()}%`;

    qb.andWhere(
      `
      LOWER(cleaning.customerCode) LIKE :search
      OR LOWER(cleaning.projectName) LIKE :search
      `,
      { search },
    );
  }

  if (query?.fromDate) {
    qb.andWhere('cleaning.cleaningDate >= :fromDate', {
      fromDate: new Date(query.fromDate),
    });
  }

  if (query?.toDate) {
    const endDate = new Date(query.toDate);
    endDate.setHours(23, 59, 59, 999);

    qb.andWhere('cleaning.cleaningDate <= :toDate', {
      toDate: endDate,
    });
  }

  qb.skip(skip).take(limit);

  const rawAndEntities =
  await qb.getRawAndEntities();

const data =
  rawAndEntities.entities.map(
    (item: any, index: number) => {
      const raw =
        rawAndEntities.raw[index] || {};

      return {
        ...item,

        projectStatus:
          raw.projectStatus || '',

        projectAddress:
          raw.projectAddress || '',

        projectGpsAddress:
          raw.projectGpsAddress || '',

        projectGpsLatitude:
          raw.projectGpsLatitude ?? null,

        projectGpsLongitude:
          raw.projectGpsLongitude ?? null,
      };
    },
  );

const total = await qb.getCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async updateCleaningReminder(id: number, body: any, user: any) {
  const reminder = await this.cleaningReminderRepository.findOne({
    where: { id },
  });

  if (!reminder) {
    throw new NotFoundException('Cleaning reminder not found');
  }

  reminder.status = body.status || reminder.status;
  reminder.cleaningDate = body.cleaningDate
    ? new Date(body.cleaningDate)
    : reminder.cleaningDate;
  reminder.nextCleaningDate = body.nextCleaningDate
    ? new Date(body.nextCleaningDate)
    : reminder.nextCleaningDate;
  reminder.remarks = body.remarks || reminder.remarks;

  if (body.status === 'COMPLETED') {
    reminder.completedBy = user?.id || null;
    reminder.completedByName = user?.name || user?.email || '';
    reminder.completedAt = new Date();
  }

  const saved = await this.cleaningReminderRepository.save(reminder);

  await this.createCustomerNotification({
    customerId: saved.customerId,
    customerCode: saved.customerCode,
    projectId: saved.projectId,
    notificationType: 'CLEANING_REMINDER',
    title: 'Cleaning Schedule Updated',
    message: `Your cleaning schedule is now ${saved.status}.`,
    relatedEntityType: 'CLEANING_REMINDER',
    relatedEntityId: saved.id,
  });

  return saved;
}

async hideCleaningReminder(id: number, body: any, user: any) {
  const reminder = await this.cleaningReminderRepository.findOne({
    where: { id },
  });

  if (!reminder) {
    throw new NotFoundException('Cleaning reminder not found');
  }

  (reminder as any).isHidden = true;
  (reminder as any).hiddenReason = body?.hiddenReason || body?.reason || '';
  (reminder as any).hiddenAt = new Date();
  (reminder as any).hiddenBy = user?.id || null;
  (reminder as any).hiddenByName = user?.name || user?.email || '';

  return this.cleaningReminderRepository.save(reminder);
}

async restoreCleaningReminder(id: number, body: any, user: any) {
  const reminder = await this.cleaningReminderRepository.findOne({
    where: { id },
  });

  if (!reminder) {
    throw new NotFoundException('Cleaning reminder not found');
  }

  (reminder as any).isHidden = false;
  (reminder as any).hiddenReason = '';
  (reminder as any).hiddenAt = null;
  (reminder as any).hiddenBy = null;
  (reminder as any).hiddenByName = '';

  return this.cleaningReminderRepository.save(reminder);
}

async addComplaintActivity(body: any, user?: any) {
  if (!body?.complaintId) {
    return null;
  }

  const activity = this.complaintActivityRepository.create({
    complaintId: Number(body.complaintId),
    customerId: body.customerId ? Number(body.customerId) : null,
    customerCode: body.customerCode || '',
    projectId: body.projectId ? Number(body.projectId) : null,
    activityType: body.activityType,
    activityTitle: body.activityTitle || 'Complaint Update',
    activityDescription: body.activityDescription || '',
    performedBy: user?.id || body.performedBy || null,
    performedByName:
      user?.name || user?.email || body.performedByName || '',
    performedByRole: Array.isArray(user?.roles)
      ? user.roles.join(', ')
      : body.performedByRole || '',
    oldValue: body.oldValue || '',
    newValue: body.newValue || '',
  } as any);

  return this.complaintActivityRepository.save(activity);
}

async getCustomerComplaintActivities(
  complaintId: number,
  customerId: number,
) {
  const complaint = await this.complaintRepository.findOne({
    where: {
      id: complaintId,
      customerId,
      isHidden: false,
    },
  });

  if (!complaint) {
    throw new NotFoundException('Complaint not found');
  }

  return this.complaintActivityRepository.find({
    where: { complaintId },
    order: { createdAt: 'ASC' },
  });
}

async markAllCustomerNotificationsRead(customerId: number) {
  const notifications = await this.notificationRepository.find({
    where: {
      customerId,
      isRead: false,
    },
  });

  for (const notification of notifications) {
    notification.isRead = true;
    notification.readAt = new Date();
  }

  await this.notificationRepository.save(notifications);

  return {
    message: 'All notifications marked as read',
    updated: notifications.length,
  };
}

async addPaymentReceiptActivity(body: any, user?: any) {
  if (!body?.receiptId) {
    return null;
  }

  const activity = this.paymentReceiptActivityRepository.create({
    receiptId: Number(body.receiptId),
    customerId: body.customerId ? Number(body.customerId) : null,
    projectId: body.projectId ? Number(body.projectId) : null,
    activityType: body.activityType,
    activityTitle: body.activityTitle || 'Payment Receipt Update',
    activityDescription: body.activityDescription || '',
    performedBy: user?.id || body.performedBy || null,
    performedByName:
      user?.name || user?.email || body.performedByName || '',
    performedByRole: Array.isArray(user?.roles)
      ? user.roles.join(', ')
      : body.performedByRole || '',
    oldValue: body.oldValue || '',
    newValue: body.newValue || '',
  } as any);

  return this.paymentReceiptActivityRepository.save(activity);
}

async getCustomerPaymentReceiptActivities(
  receiptId: number,
  customerId: number,
) {
  const receipt = await this.paymentReceiptRepository.findOne({
    where: {
      id: receiptId,
      customerId,
      isHidden: false,
    } as any,
  });

  if (!receipt) {
    throw new NotFoundException('Payment receipt not found');
  }

  return this.paymentReceiptActivityRepository.find({
    where: { receiptId },
    order: { createdAt: 'ASC' },
  });
}

async updateProjectSiteLocation(
  customerId: number,
  projectId: number,
  body: any,
) {
  const project = await this.projectRepository.findOne({
    where: {
      id: projectId,
      customerId,
      isHidden: false,
    },
  });

  if (!project) {
    throw new NotFoundException(
      'Project not found or access denied',
    );
  }

  const gpsLatitude = Number(body.gpsLatitude);
  const gpsLongitude = Number(body.gpsLongitude);

  if (
    !Number.isFinite(gpsLatitude) ||
    !Number.isFinite(gpsLongitude)
  ) {
    throw new BadRequestException(
      'Valid GPS latitude and longitude are required',
    );
  }

  project.address = String(
    body.address || '',
  ).trim();

  project.gpsAddress = String(
    body.gpsAddress || '',
  ).trim();

  project.gpsLatitude = gpsLatitude;
  project.gpsLongitude = gpsLongitude;

  project.locationUpdatedBy = customerId;

  project.locationUpdatedByName =
    project.customerName ||
    project.customerCode ||
    'Customer';

  project.locationUpdatedByRole =
    'CUSTOMER';

  project.locationUpdatedAt =
    new Date();

  await this.projectRepository.save(project);

  return {
    success: true,
    message:
      'Project site location updated successfully.',
    project,
  };
}
}
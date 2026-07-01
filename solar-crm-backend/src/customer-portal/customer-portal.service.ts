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

    @InjectRepository(StaffMember)
private readonly staffMemberRepository: Repository<StaffMember>,
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
          'Cleaning, complaints, documents, referrals and support after project completion',
          hero: {
  badge: 'After-Sales / Support Customer',
  message:
    'Your installation is complete. You can continue using this portal for cleaning, complaints, documents, referrals and support.',
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
          projectTracker: true,
          workCalendar: false,
          payments: true,
          documents: true,
          complaints: true,
          cleaning: true,
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
  referrals,
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
.leftJoin(Project, 'project', 'project.id = complaint.projectId')
.addSelect('project.status', 'projectStatus')
.where('complaint.isHidden = false')
    .orderBy('complaint.createdAt', 'DESC');

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
const data = rawAndEntities.entities.map((item: any, index: number) => ({
  ...item,
  projectStatus: rawAndEntities.raw[index]?.projectStatus || '',
}));
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
    const referral = this.referralRepository.create({
      ...body,
      customerId: Number(body.customerId),
      rewardAmount: Number(body.rewardAmount || 5000),
    });

    return this.referralRepository.save(referral);
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

  if (query?.status) {
    qb.andWhere('referral.status = :status', {
      status: query.status,
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

  qb.skip(skip).take(limit);

  const [data, total] = await qb.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
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
.leftJoin(Project, 'project', 'project.id = cleaning.projectId')
.addSelect('project.status', 'projectStatus')
.orderBy('cleaning.cleaningDate', 'DESC');

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
}
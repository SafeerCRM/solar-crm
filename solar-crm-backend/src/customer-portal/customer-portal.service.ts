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

@Injectable()
export class CustomerPortalService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(ProjectPaymentInstallment)
private readonly paymentInstallmentRepository: Repository<ProjectPaymentInstallment>,

    @InjectRepository(ProjectExecutionActivity)
private readonly executionActivityRepository: Repository<ProjectExecutionActivity>,

    @InjectRepository(CustomerComplaint)
    private readonly complaintRepository: Repository<CustomerComplaint>,

    @InjectRepository(CustomerComplaintAttachment)
private readonly complaintAttachmentRepository: Repository<CustomerComplaintAttachment>,

    @InjectRepository(CustomerReferral)
    private readonly referralRepository: Repository<CustomerReferral>,

    @InjectRepository(CustomerPaymentReceipt)
    private readonly paymentReceiptRepository: Repository<CustomerPaymentReceipt>,

    @InjectRepository(CustomerWorkDateRequest)
    private readonly workDateRequestRepository: Repository<CustomerWorkDateRequest>,

    @InjectRepository(CustomerNotification)
    private readonly notificationRepository: Repository<CustomerNotification>,

    @InjectRepository(CustomerCleaningReminder)
    private readonly cleaningReminderRepository: Repository<CustomerCleaningReminder>,
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

    const projectIds = projects.map((project) => project.id);

    const paymentInstallments = projectIds.length
  ? await this.paymentInstallmentRepository
      .createQueryBuilder('installment')
      .where('installment.projectId IN (:...projectIds)', { projectIds })
      .andWhere('installment.isHidden = false')
      .orderBy('installment.dueDate', 'ASC')
      .addOrderBy('installment.createdAt', 'ASC')
      .getMany()
  : [];

const paymentSummary = {
  totalAmount: paymentInstallments.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  ),
  paidAmount: paymentInstallments.reduce(
    (sum, item) => sum + Number(item.paidAmount || 0),
    0,
  ),
  pendingAmount: paymentInstallments.reduce(
    (sum, item) => sum + Number(item.pendingAmount || 0),
    0,
  ),
  totalInstallments: paymentInstallments.length,
  pendingInstallments: paymentInstallments.filter(
    (item) => item.status !== 'PAID' && item.status !== 'CANCELLED',
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

    return {
  customer,
  projects,
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
paymentInstallments,
paymentSummary,
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

  const [data, total] = await qb.getManyAndCount();

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

  async updateComplaint(id: number, body: any, user: any) {
    const complaint = await this.complaintRepository.findOne({
      where: { id },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

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

    return this.complaintRepository.save(complaint);
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
    const receipt = this.paymentReceiptRepository.create({
      ...body,
      customerId: Number(body.customerId),
      projectId: Number(body.projectId),
      amount: Number(body.amount || 0),
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
    });

    return this.paymentReceiptRepository.save(receipt);
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
    (customer as any).portalPasswordHash ||
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

async uploadComplaintAttachments(files: any[], user: any) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new BadRequestException('At least one complaint photo is required');
  }

  const uploadedFiles: any[] = [];

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

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
      throw new BadRequestException('Only JPG, PNG, and WEBP photos are allowed');
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new BadRequestException('Complaint photo must be less than 5 MB');
    }

    const originalName = String(file.originalname || 'complaint-photo');
    const extension = originalName.includes('.')
      ? originalName.split('.').pop()
      : mimeType.split('/')[1] || 'jpg';

    const safeExtension = String(extension || 'jpg').replace(
      /[^a-zA-Z0-9]/g,
      '',
    );

    const filePath = `customer-complaints/customer-${user?.id || 'unknown'}/${Date.now()}-${randomUUID()}.${safeExtension}`;

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
    });
  }

  return {
    message: `${uploadedFiles.length} complaint photo(s) uploaded successfully`,
    attachments: uploadedFiles,
  };
}

async listWorkDateRequests(query: any) {
  const page = Number(query?.page || 1);
  const limit = Math.min(Number(query?.limit || 20), 100);
  const skip = (page - 1) * limit;

  const qb = this.workDateRequestRepository
    .createQueryBuilder('request')
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

  const [data, total] = await qb.getManyAndCount();

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

  return this.workDateRequestRepository.save(request);
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

  const [data, total] = await qb.getManyAndCount();

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

  receipt.status = body.status || receipt.status;
  receipt.verificationRemarks =
    body.verificationRemarks || receipt.verificationRemarks;

  if (body.status === 'VERIFIED' || body.status === 'REJECTED') {
    receipt.verifiedBy = user?.id || null;
    receipt.verifiedByName = user?.name || user?.email || '';
    receipt.verifiedAt = new Date();
  }

  return this.paymentReceiptRepository.save(receipt);
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

  return this.referralRepository.save(referral);
}
}
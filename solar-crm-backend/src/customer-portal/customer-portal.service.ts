import { Injectable, NotFoundException } from '@nestjs/common';
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
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class CustomerPortalService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(CustomerComplaint)
    private readonly complaintRepository: Repository<CustomerComplaint>,

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

    const complaints = await this.complaintRepository.find({
      where: { customerId, isHidden: false },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const notifications = await this.notificationRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      customer,
      projects,
      complaints,
      notifications,
      totalProjects: projects.length,
      openComplaints: complaints.filter((c) => c.status !== 'CLOSED').length,
      unreadNotifications: notifications.filter((n) => !n.isRead).length,
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

    return this.complaintRepository.save(complaint);
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

  return {
    data,
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
}
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { In, MoreThan, Repository } from 'typeorm';

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
import { ProjectMaterialRequest } from './project-material-request.entity';
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

private generatePoNumber() {
  return `PO-${Date.now()}`;
}

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(ProjectDocument)
    private readonly projectDocumentRepository: Repository<ProjectDocument>,

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

@InjectRepository(ProjectPurchaseOrder)
private readonly projectPurchaseOrderRepository: Repository<ProjectPurchaseOrder>,

@InjectRepository(ProjectPurchaseOrderItem)
private readonly projectPurchaseOrderItemRepository: Repository<ProjectPurchaseOrderItem>,

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

  return {
    data,
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
  ];

  const editableFieldsForProjectManager = [
    'branchName',
    'projectOwnerId',
    'projectOwnerName',
    'projectOwnerRole',
    'panelBrand',
    'dcrPanelCount',
    'nonDcrPanelCount',
    'converterBrand',
    'converterCapacity',
    'converterPhase',
    'structureType',
    'structureCapacityKw',
    'buildingHeight',
    'discomName',
    'startDate',
    'expectedCompletionDate',
    'remarks',
  ];

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
    roles.includes('PROJECT_MANAGER');

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
  }

  if (roles.includes('SUBSIDY_MANAGER')) {
    allowedDepartments.push('SUBSIDY');
  }

  if (roles.includes('ELECTRICITY_MANAGER')) {
    allowedDepartments.push('ELECTRICITY');
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

  if (
    body?.status === 'APPROVED' &&
    project.status === 'PENDING_APPROVAL'
  ) {
    project.status = ProjectStatus.PROJECT_MANAGEMENT;
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

async getPaymentCollectionList(query: any, currentUser: any) {
  const {
  projectId,
  branch,
  projectOwnerId,
  customerName,
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
    roles.includes('PAYMENT_COLLECTION_EXECUTIVE');

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
    data: rows.map((row) => ({
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
      paymentMode: row.paymentMode,
      transactionId: row.transactionId,
      remarks: row.remarks,
      collectedBy: row.collectedBy ? Number(row.collectedBy) : null,
      collectedByName: row.collectedByName,

      customerName: row.customerName,
      customerPhone: row.customerPhone,
      branchName: row.branchName,
      projectOwnerId: row.projectOwnerId ? Number(row.projectOwnerId) : null,
      projectOwnerName: row.projectOwnerName,
      projectSerial: row.projectSerial,
      finalCost: Number(row.finalCost || 0),
      projectStatus: row.projectStatus,
    })),
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

  return this.projectPaymentInstallmentRepository.save(
    installment,
  );
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

async getApprovalReminderList(currentUser: any) {
  const roles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : [];

  const userId = currentUser?.id || currentUser?.userId;

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
    .andWhere('project.status = :pendingApprovalStatus', {
      pendingApprovalStatus: ProjectStatus.PENDING_APPROVAL,
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
    .orderBy('project.createdAt', 'ASC')
    .limit(100);

  const rows = await qb.getRawMany();

const reminderIds = rows.map((row) =>
  Number(row.projectId),
);

const stateMap =
  await this.getUnifiedReminderStateMap(
    currentUser,
    'APPROVAL',
    reminderIds,
  );

  return rows
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
  const list = await this.getApprovalReminderList(currentUser);

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
    roles.includes('PROJECT_MANAGER');

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
}
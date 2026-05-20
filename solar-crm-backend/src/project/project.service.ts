import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { In, MoreThan, Repository } from 'typeorm';

import { Project } from './project.entity';
import { ProjectDocument } from './project-document.entity';
import { ProjectComment } from './project-comment.entity';

import {
  ProjectApprovalStatus,
  ProjectStatus,
  ProjectType,
} from './project.entity';

import { CalculatorService } from '../calculator/calculator.service';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { ProjectMaterialMaster } from './project-material-master.entity';
import { ProjectMaterialRequest } from './project-material-request.entity';
import { ProjectMaterialRequestItem } from './project-material-request-item.entity';
import { ProjectBranch } from './project-branch.entity';
import { ProjectLoanDetail } from './project-loan-detail.entity';
import { ProjectSubsidyDetail } from './project-subsidy-detail.entity';
import { ProjectElectricityDetail } from './project-electricity-detail.entity';
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
      status: ProjectStatus.PENDING_APPROVAL,
      marketingHeadApprovalStatus: ProjectApprovalStatus.PENDING,
      ownerApprovalStatus: ProjectApprovalStatus.PENDING,
    });

    return this.projectRepository.save(project);
  }

  async createWithCalculation(data: any) {
    const calculation =
      await this.calculatorService.calculateProjectCost(data);

    const project = this.projectRepository.create({
      leadId: data.leadId,

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

      vendorId: data?.vendorId || null,

      paymentStatus: data?.paymentStatus || 'PENDING',

      remarks:
        data?.remarks || 'Project created using calculator',
    });

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

    const currentUserId = Number(
  user?.id || user?.sub,
);

const roles = Array.isArray(user?.roles)
  ? user.roles
  : [];

const canViewAll =
  roles.includes('OWNER') ||
  roles.includes('MARKETING_HEAD') ||
  roles.includes('PROJECT_MANAGER');

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
  roles.includes('PROJECT_MANAGER');

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

  async update(id: number, data: Partial<Project>) {
    const project = await this.projectRepository.findOne({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    Object.assign(project, data);

    return this.projectRepository.save(project);
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

  for (const file of files) {
    const result = await this.uploadProjectDocument(file, body, user);
    uploadedDocuments.push(result.document);
  }

  return {
    message: `${uploadedDocuments.length} document(s) uploaded successfully`,
    documents: uploadedDocuments,
  };
}

async getProjectDocuments(projectId: number) {
  const project = await this.projectRepository.findOne({
    where: { id: projectId },
  });

  if (!project) {
    throw new NotFoundException('Project not found');
  }

  return this.projectDocumentRepository.find({
    where: { projectId },
    order: {
      createdAt: 'DESC',
    },
  });
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
    rate: Number(data.rate || 0),
    gstPercent: Number(data.gstPercent || 0),
    expectedMargin: Number((data as any).expectedMargin || 0),
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
    rate:
      data.rate !== undefined
        ? Number(data.rate || 0)
        : item.rate,
    gstPercent:
      data.gstPercent !== undefined
        ? Number(data.gstPercent || 0)
        : item.gstPercent,

        expectedMargin:
  (data as any).expectedMargin !== undefined
    ? Number((data as any).expectedMargin || 0)
    : (item as any).expectedMargin,
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

  const roles = currentUser?.roles || [];
  const userId = currentUser?.id || currentUser?.userId;

  const canSeeAll =
    roles.includes('OWNER') ||
    roles.includes('MARKETING_HEAD') ||
    roles.includes('PROJECT_MANAGER');

  const activityQuery = this.projectExecutionActivityRepository
    .createQueryBuilder('activity');

  if (!canSeeAll) {
    activityQuery.andWhere(
      '(activity.assignedTo = :userId OR activity.createdBy = :userId)',
      { userId },
    );
  }

  const activities = await activityQuery.getMany();

  const activeActivities = activities.filter(
    (activity) =>
      activity.status !== ProjectExecutionActivityStatus.COMPLETED &&
      activity.status !== ProjectExecutionActivityStatus.CANCELLED,
  );

  const overdueActivities = activeActivities.filter((activity) => {
    const dateToCheck = activity.inspectionDeadline || activity.scheduledDate;
    if (!dateToCheck) return false;

    const checkDate = new Date(dateToCheck);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate < today;
  });

  const todaysExecutionWork = activeActivities.filter((activity) => {
    const dateToCheck = activity.scheduledDate || activity.inspectionDeadline;
    if (!dateToCheck) return false;

    const checkDate = new Date(dateToCheck);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate.getTime() === today.getTime();
  });

  const upcomingDeadlines = activeActivities.filter((activity) => {
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

  const roles = currentUser?.roles || [];
  const userId = currentUser?.id || currentUser?.userId;

  const canSeeAll =
    roles.includes('OWNER') ||
    roles.includes('MARKETING_HEAD') ||
    roles.includes('PROJECT_MANAGER');

  const activityQuery = this.projectExecutionActivityRepository
    .createQueryBuilder('activity')
    .leftJoin(Project, 'project', 'project.id = activity.projectId')
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
    ])
    .orderBy('activity.inspectionDeadline', 'ASC')
    .addOrderBy('activity.scheduledDate', 'ASC');

  if (!canSeeAll) {
    activityQuery.andWhere(
      '(activity.assignedTo = :userId OR activity.createdBy = :userId)',
      { userId },
    );
  }

  const rows = await activityQuery.getRawMany();

  const activeRows = rows.filter(
    (activity) =>
      activity.status !== ProjectExecutionActivityStatus.COMPLETED &&
      activity.status !== ProjectExecutionActivityStatus.CANCELLED,
  );

  return activeRows
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
        },
      })
    : [];

  const projectMap = new Map(
    projects.map((project) => [
      Number(project.id),
      project,
    ]),
  );

  const enrichedItems = allPendingItems.map((item) => {
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
  });

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
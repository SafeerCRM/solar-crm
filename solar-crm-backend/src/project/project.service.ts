import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

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

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(ProjectDocument)
    private readonly projectDocumentRepository: Repository<ProjectDocument>,

    @InjectRepository(ProjectComment)
    private readonly projectCommentRepository: Repository<ProjectComment>,

    private readonly calculatorService: CalculatorService,
  ) {}

  async create(data: Partial<Project>) {
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

    const project = this.projectRepository.create({
      ...data,
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

  async findAll() {
    return this.projectRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const project = await this.projectRepository.findOne({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
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

  async addComment(data: Partial<ProjectComment>) {
    const project = await this.projectRepository.findOne({
      where: {
        id: Number(data.projectId),
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const comment =
      this.projectCommentRepository.create(data);

    return this.projectCommentRepository.save(comment);
  }

  async getProjectComments(projectId: number) {
    return this.projectCommentRepository.find({
      where: {
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
      status: ProjectApprovalStatus;
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

    project.marketingHeadApprovalStatus = body.status;

    project.marketingHeadApprovalNote =
  body.note || '';

project.marketingHeadApprovedBy =
  body.approvedBy || 0;

    project.marketingHeadApprovedAt = new Date();

    if (body.status === ProjectApprovalStatus.REJECTED) {
      project.status = ProjectStatus.REJECTED;
    }

    return this.projectRepository.save(project);
  }

  async ownerApproval(
    id: number,
    body: {
      status: ProjectApprovalStatus;
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

    project.ownerApprovalStatus = body.status;

    project.ownerApprovalNote =
  body.note || '';

project.ownerApprovedBy =
  body.approvedBy || 0;

    project.ownerApprovedAt = new Date();

    if (body.status === ProjectApprovalStatus.REJECTED) {
      project.status = ProjectStatus.REJECTED;
    }

    if (body.status === ProjectApprovalStatus.APPROVED) {
      if (project.projectType === ProjectType.LOAN) {
        project.status = ProjectStatus.LOAN_PROCESS;
      } else {
        project.status =
          ProjectStatus.PROJECT_MANAGEMENT;
      }
    }

    return this.projectRepository.save(project);
  }
}
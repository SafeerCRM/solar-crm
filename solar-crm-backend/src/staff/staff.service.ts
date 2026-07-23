import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { StaffMember } from './staff-member.entity';
import { StaffDocument } from './staff-document.entity';
import { StaffAsset } from './staff-asset.entity';
import { StaffAttendance } from './staff-attendance.entity';
import { StaffLeave } from './staff-leave.entity';
import { EmployeePolicy } from './employee-policy.entity';
import { HrPolicy, HrPolicyType } from './hr-policy.entity';
import { StaffPayroll } from './staff-payroll.entity';
import { IncentiveRule } from './incentive-rule.entity';
import { RecruitmentCandidate } from './recruitment-candidate.entity';
import { RecruitmentCandidateDocument } from './recruitment-candidate-document.entity';
import { PerformanceTemplate } from './performance-template.entity';
import { PerformanceTemplateMetric } from './performance-template-metric.entity';
import {
  PenaltyRule,
  PenaltyCalculationType,
} from './penalty-rule.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffMember)
    private readonly staffRepo: Repository<StaffMember>,

    @InjectRepository(StaffDocument)
    private readonly documentRepo: Repository<StaffDocument>,

    @InjectRepository(StaffAsset)
    private readonly assetRepo: Repository<StaffAsset>,

    @InjectRepository(StaffAttendance)
private readonly attendanceRepo: Repository<StaffAttendance>,

@InjectRepository(StaffLeave)
private readonly leaveRepo: Repository<StaffLeave>,

@InjectRepository(EmployeePolicy)
private readonly employeePolicyRepo: Repository<EmployeePolicy>,

@InjectRepository(HrPolicy)
private readonly hrPolicyRepo: Repository<HrPolicy>,

@InjectRepository(StaffPayroll)
private readonly payrollRepo: Repository<StaffPayroll>,

@InjectRepository(IncentiveRule)
private readonly incentiveRuleRepo: Repository<IncentiveRule>,

@InjectRepository(RecruitmentCandidate)
private readonly recruitmentRepo: Repository<RecruitmentCandidate>,

@InjectRepository(RecruitmentCandidateDocument)
private readonly recruitmentDocumentRepo: Repository<RecruitmentCandidateDocument>,

@InjectRepository(PerformanceTemplate)
private readonly performanceTemplateRepo: Repository<PerformanceTemplate>,

@InjectRepository(PerformanceTemplateMetric)
private readonly performanceTemplateMetricRepo: Repository<PerformanceTemplateMetric>,

@InjectRepository(PenaltyRule)
private readonly penaltyRuleRepository: Repository<PenaltyRule>,
  ) {}

  async findAll(query: any) {
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
    const showHidden = query.showHidden === 'true';

    const where: any = {
      isHidden: showHidden,
    };

    if (query.search) {
      where.fullName = ILike(`%${query.search}%`);
    }

    if (query.branchName) where.branchName = query.branchName;
    if (query.department) where.department = query.department;
    if (query.designation) where.designation = query.designation;

    const [data, total] = await this.staffRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async create(body: any, user: any) {
    if (!String(body.fullName || '').trim()) {
      throw new BadRequestException('Staff full name is required');
    }

    const staff = this.staffRepo.create({
      ...body,
      isActive: body.isActive !== false,
      isHidden: false,
    });

    return this.staffRepo.save(staff);
  }

  async update(id: number, body: any) {
    const staff = await this.staffRepo.findOne({ where: { id } });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    Object.assign(staff, body);

    return this.staffRepo.save(staff);
  }

  async hide(id: number, body: any, user: any) {
    const staff = await this.staffRepo.findOne({ where: { id } });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    staff.isHidden = true;
    staff.isActive = false;
    staff.hiddenAt = new Date();
    staff.hiddenBy = user?.id || null;
    staff.hiddenByName = user?.name || '';
    staff.hiddenReason = body?.reason || '';

    return this.staffRepo.save(staff);
  }

  async restore(id: number, body: any, user: any) {
    const staff = await this.staffRepo.findOne({ where: { id } });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    staff.isHidden = false;
    staff.isActive = true;
    staff.restoredAt = new Date();
    staff.restoredBy = user?.id || null;
    staff.restoredByName = user?.name || '';
    staff.restoreReason = body?.reason || '';

    return this.staffRepo.save(staff);
  }

  async updatePhoto(id: number, body: any) {
    const staff = await this.staffRepo.findOne({ where: { id } });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    staff.photoUrl = body.photoUrl || '';

    return this.staffRepo.save(staff);
  }

  async addDocument(body: any, user: any) {
    if (!body.staffId || !body.fileUrl) {
      throw new BadRequestException('Staff and file URL are required');
    }

    const document = this.documentRepo.create({
      staffId: Number(body.staffId),
      documentType: body.documentType || 'OTHER',
      fileName: body.fileName || '',
      fileUrl: body.fileUrl,
      uploadedBy: user?.id || null,
      uploadedByName: user?.name || '',
      remarks: body.remarks || '',
      isHidden: false,
    });

    return this.documentRepo.save(document);
  }

  async getDocuments(staffId: number) {
    return this.documentRepo.find({
      where: {
        staffId,
        isHidden: false,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async hideDocument(id: number) {
    const document = await this.documentRepo.findOne({ where: { id } });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    document.isHidden = true;

    return this.documentRepo.save(document);
  }

  async addAsset(body: any) {
    if (!body.staffId || !body.assetName) {
      throw new BadRequestException('Staff and asset name are required');
    }

    const asset = this.assetRepo.create({
      staffId: Number(body.staffId),
      assetType: body.assetType || 'OTHER',
      assetName: body.assetName,
      assetNumber: body.assetNumber || '',
      assignedDate: body.assignedDate || null,
      returnedDate: body.returnedDate || null,
      isActive: body.isActive !== false,
      remarks: body.remarks || '',
      isHidden: false,
    });

    return this.assetRepo.save(asset);
  }

  async getAssets(staffId: number) {
    return this.assetRepo.find({
      where: {
        staffId,
        isHidden: false,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async hideAsset(id: number) {
    const asset = await this.assetRepo.findOne({ where: { id } });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    asset.isHidden = true;
    asset.isActive = false;

    return this.assetRepo.save(asset);
  }

  private async uploadFileToSupabase(
  file: any,
  folder: string,
  allowedTypes: string[],
  maxSizeMb = 20,
) {
  if (!file) {
    throw new BadRequestException('File is required');
  }

  const mimeType = String(file.mimetype || '');

  const isAllowed = allowedTypes.some((type) =>
    type.endsWith('/')
      ? mimeType.startsWith(type)
      : mimeType === type,
  );

  if (!isAllowed) {
    throw new BadRequestException('File type is not allowed');
  }

  const maxSize = maxSizeMb * 1024 * 1024;

  if (file.size > maxSize) {
    throw new BadRequestException(`File must be less than ${maxSizeMb} MB`);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = 'project-documents';

  if (!supabaseUrl || !serviceKey) {
    throw new BadRequestException('Supabase storage is not configured');
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceKey);

  const extension =
    String(file.originalname || '').split('.').pop() || 'file';

  const filePath = `${folder}/${Date.now()}-${Math.round(
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

async uploadAttendancePhoto(file: any) {
  return this.uploadFileToSupabase(
    file,
    'staff-attendance',
    ['image/'],
    10,
  );
}

private getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

private calculateWorkingHours(punchIn?: Date, punchOut?: Date) {
  if (!punchIn || !punchOut) return 0;

  const diffMs = new Date(punchOut).getTime() - new Date(punchIn).getTime();

  if (diffMs <= 0) return 0;

  return Number((diffMs / (1000 * 60 * 60)).toFixed(2));
}

async punchIn(body: any, user: any) {
  let staffId = body.staffId;

if (!staffId) {
  const linkedStaff = await this.getMyStaffProfile(user);
  staffId = linkedStaff.id;
}

const staff = await this.staffRepo.findOne({
  where: {
    id: Number(staffId),
    isHidden: false,
  },
});

  if (!staff) {
    throw new NotFoundException('Staff not found');
  }

  const attendanceDate = body.attendanceDate || this.getTodayDate();

  const existing = await this.attendanceRepo.findOne({
    where: {
      staffId: staff.id,
      attendanceDate,
    },
  });

  if (existing?.punchInTime) {
    throw new BadRequestException('Staff already punched in today');
  }

  const attendance =
    existing ||
    this.attendanceRepo.create({
      staffId: staff.id,
      staffName: staff.fullName,
      employeeCode: staff.employeeCode || '',
      attendanceDate,
    });

  attendance.punchInTime = new Date();
  attendance.punchInLatitude = body.latitude || '';
  attendance.punchInLongitude = body.longitude || '';
  attendance.punchInGpsAddress = body.gpsAddress || '';
  attendance.punchInPhotoUrl = body.photoUrl || '';
  attendance.status = body.status || 'PRESENT';
  attendance.remarks = body.remarks || attendance.remarks || '';
  attendance.createdBy = user?.id || null;
  attendance.createdByName = user?.name || '';

  return this.attendanceRepo.save(attendance);
}

async punchOut(body: any, user: any) {
  let staffId = body.staffId;

if (!staffId) {
  const linkedStaff = await this.getMyStaffProfile(user);
  staffId = linkedStaff.id;
}

const attendanceDate = body.attendanceDate || this.getTodayDate();

const attendance = await this.attendanceRepo.findOne({
  where: {
    staffId: Number(staffId),
    attendanceDate,
  },
});

  if (!attendance || !attendance.punchInTime) {
    throw new BadRequestException('Punch in is required before punch out');
  }

  if (attendance.punchOutTime) {
    throw new BadRequestException('Staff already punched out today');
  }

  attendance.punchOutTime = new Date();
  attendance.punchOutLatitude = body.latitude || '';
  attendance.punchOutLongitude = body.longitude || '';
  attendance.punchOutGpsAddress = body.gpsAddress || '';
  attendance.punchOutPhotoUrl = body.photoUrl || '';
  attendance.workingHours = this.calculateWorkingHours(
    attendance.punchInTime,
    attendance.punchOutTime,
  );
  attendance.remarks = body.remarks || attendance.remarks || '';

  if (attendance.workingHours > 0 && attendance.workingHours < 4) {
    attendance.status = 'HALF_DAY' as any;
  }

  return this.attendanceRepo.save(attendance);
}

async getAttendance(query: any) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);

  const where: any = {};

  if (query.staffId) where.staffId = Number(query.staffId);
  if (query.date) where.attendanceDate = query.date;

  const [data, total] = await this.attendanceRepo.findAndCount({
    where,
    order: {
      attendanceDate: 'DESC',
      createdAt: 'DESC',
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async getMyStaffProfile(user: any) {
  const staff = await this.staffRepo.findOne({
    where: {
      linkedUserId: user?.id,
      isHidden: false,
    },
  });

  if (!staff) {
    throw new NotFoundException(
      'No staff profile linked with your login. Please contact HR.',
    );
  }

  return staff;
}

async getMyAttendance(query: any, user: any) {
  const staff = await this.getMyStaffProfile(user);

  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);

  const where: any = {
    staffId: staff.id,
  };

  if (query.date) {
    where.attendanceDate = query.date;
  }

  const [data, total] = await this.attendanceRepo.findAndCount({
    where,
    order: {
      attendanceDate: 'DESC',
      createdAt: 'DESC',
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    staff,
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

private async getLeaveSummary(staffId?: number) {
  const qb = this.leaveRepo
    .createQueryBuilder('leave')
    .select(
      `
      COUNT(*) FILTER (
        WHERE leave.status = 'APPROVED'
      )
      `,
      'approvedRequests',
    )
    .addSelect(
      `
      COALESCE(
        SUM(
          CASE
            WHEN leave.status = 'APPROVED'
            THEN leave."totalDays"
            ELSE 0
          END
        ),
        0
      )
      `,
      'approvedDays',
    )
    .addSelect(
      `
      COUNT(*) FILTER (
        WHERE leave.status = 'PENDING'
      )
      `,
      'pendingRequests',
    )
    .addSelect(
      `
      COUNT(*) FILTER (
        WHERE leave.status = 'REJECTED'
      )
      `,
      'rejectedRequests',
    )
    .addSelect(
      `
      COUNT(*) FILTER (
        WHERE leave.status = 'CANCELLED'
      )
      `,
      'cancelledRequests',
    )
    .where('leave.isHidden = false');

  if (staffId) {
    qb.andWhere('leave.staffId = :staffId', {
      staffId,
    });
  }

  const raw = await qb.getRawOne();

  return {
    approvedDays: Number(raw?.approvedDays || 0),
    approvedRequests: Number(
      raw?.approvedRequests || 0,
    ),
    pendingRequests: Number(
      raw?.pendingRequests || 0,
    ),
    rejectedRequests: Number(
      raw?.rejectedRequests || 0,
    ),
    cancelledRequests: Number(
      raw?.cancelledRequests || 0,
    ),
  };
}

private calculateLeaveDays(fromDate: string, toDate: string) {
  const start = new Date(fromDate);
  const end = new Date(toDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 1;
  }

  const diffMs = end.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  return Math.max(days, 1);
}

async createLeave(body: any, user: any) {
  if (!body.staffId) {
    throw new BadRequestException('Staff is required');
  }

  if (!body.fromDate || !body.toDate) {
    throw new BadRequestException('Leave from date and to date are required');
  }

  if (!String(body.reason || '').trim()) {
    throw new BadRequestException('Leave reason is required');
  }

  const staff = await this.staffRepo.findOne({
    where: {
      id: Number(body.staffId),
      isHidden: false,
    },
  });

  if (!staff) {
    throw new NotFoundException('Staff not found');
  }

  const leave = this.leaveRepo.create({
    staffId: staff.id,
    staffName: staff.fullName,
    employeeCode: staff.employeeCode || '',
    leaveType: body.leaveType || 'CASUAL',
    fromDate: body.fromDate,
    toDate: body.toDate,
    totalDays: this.calculateLeaveDays(body.fromDate, body.toDate),
    reason: body.reason,
    proofUrl: body.proofUrl || '',
    status: 'PENDING' as any,
    requestedBy: user?.id || null,
    requestedByName: user?.name || '',
    isHidden: false,
  });

  return this.leaveRepo.save(leave);
}

async listLeaves(query: any) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const showHidden = query.showHidden === 'true';

  const where: any = {
    isHidden: showHidden,
  };

  if (query.staffId) where.staffId = Number(query.staffId);
  if (query.status) where.status = query.status;
  if (query.leaveType) where.leaveType = query.leaveType;

  const [data, total] = await this.leaveRepo.findAndCount({
    where,
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const summary = await this.getLeaveSummary(
  query.staffId
    ? Number(query.staffId)
    : undefined,
);

return {
  data,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
  summary,
};
}

async updateLeave(id: number, body: any) {
  const leave = await this.leaveRepo.findOne({ where: { id } });

  if (!leave) {
    throw new NotFoundException('Leave not found');
  }

  if (leave.status !== 'PENDING') {
    throw new BadRequestException('Only pending leave can be edited');
  }

  Object.assign(leave, {
    leaveType: body.leaveType || leave.leaveType,
    fromDate: body.fromDate || leave.fromDate,
    toDate: body.toDate || leave.toDate,
    reason: body.reason || leave.reason,
    proofUrl: body.proofUrl || leave.proofUrl,
  });

  leave.totalDays = this.calculateLeaveDays(leave.fromDate, leave.toDate);

  return this.leaveRepo.save(leave);
}

async approveLeave(id: number, body: any, user: any) {
  const leave = await this.leaveRepo.findOne({ where: { id } });

  if (!leave) {
    throw new NotFoundException('Leave not found');
  }

  leave.status = 'APPROVED' as any;
  leave.approvedBy = user?.id || null;
  leave.approvedByName = user?.name || '';
  leave.approvedAt = new Date();
  leave.approvalRemarks = body?.approvalRemarks || '';

  return this.leaveRepo.save(leave);
}

async rejectLeave(id: number, body: any, user: any) {
  const leave = await this.leaveRepo.findOne({ where: { id } });

  if (!leave) {
    throw new NotFoundException('Leave not found');
  }

  leave.status = 'REJECTED' as any;
  leave.approvedBy = user?.id || null;
  leave.approvedByName = user?.name || '';
  leave.approvedAt = new Date();
  leave.approvalRemarks = body?.approvalRemarks || '';

  return this.leaveRepo.save(leave);
}

async hideLeave(id: number, body: any, user: any) {
  const leave = await this.leaveRepo.findOne({ where: { id } });

  if (!leave) {
    throw new NotFoundException('Leave not found');
  }

  leave.isHidden = true;
  leave.hiddenAt = new Date();
  leave.hiddenBy = user?.id || null;
  leave.hiddenReason = body?.reason || '';

  return this.leaveRepo.save(leave);
}

async restoreLeave(id: number) {
  const leave = await this.leaveRepo.findOne({ where: { id } });

  if (!leave) {
    throw new NotFoundException('Leave not found');
  }

  leave.isHidden = false;

  return this.leaveRepo.save(leave);
}

async uploadLeaveProof(file: any) {
  return this.uploadFileToSupabase(
    file,
    'staff-leave-proofs',
    ['image/', 'application/pdf'],
    10,
  );
}

async createMyLeave(body: any, user: any) {
  const staff = await this.getMyStaffProfile(user);

  return this.createLeave(
    {
      ...body,
      staffId: staff.id,
    },
    user,
  );
}

async listMyLeaves(query: any, user: any) {
  const staff = await this.getMyStaffProfile(user);

  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);

  const where: any = {
    staffId: staff.id,
    isHidden: false,
  };

  if (query.status) {
    where.status = query.status;
  }

  const [data, total] = await this.leaveRepo.findAndCount({
    where,
    order: {
      createdAt: 'DESC',
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  const summary = await this.getLeaveSummary(
  staff.id,
);

return {
  staff,
  data,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
  summary,
};
}

async uploadEmployeePolicyFile(file: any) {
  return this.uploadFileToSupabase(
    file,
    'employee-policies',
    ['image/', 'application/pdf'],
    20,
  );
}

async createEmployeePolicy(body: any, user: any) {
  if (!String(body.title || '').trim()) {
    throw new BadRequestException('Policy title is required');
  }

  const item = this.employeePolicyRepo.create({
    category: body.category || 'GENERAL',
    title: String(body.title).trim(),
    description: body.description || '',
    fileUrl: body.fileUrl || '',
    fileName: body.fileName || '',
    visibleToEmployee: body.visibleToEmployee !== false,
    visibleToSolarFranchise:
  body.visibleToSolarFranchise === true,
    isActive: body.isActive !== false,
    isHidden: false,
    createdBy: user?.id || null,
    createdByName: user?.name || '',
  });

  return this.employeePolicyRepo.save(item);
}

async listEmployeePolicies(query: any) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const showHidden = query.showHidden === 'true';

  const qb = this.employeePolicyRepo
    .createQueryBuilder('policy')
    .where('policy.isHidden = :showHidden', { showHidden });

  if (query.category) {
    qb.andWhere('policy.category = :category', { category: query.category });
  }

  if (query.search) {
    qb.andWhere(
      '(policy.title ILIKE :search OR policy.description ILIKE :search)',
      { search: `%${query.search}%` },
    );
  }

  const [data, total] = await qb
    .orderBy('policy.createdAt', 'DESC')
    .skip((page - 1) * limit)
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

async listVisibleEmployeePolicies(query: any) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);

  const qb = this.employeePolicyRepo
    .createQueryBuilder('policy')
    .where('policy.isHidden = false')
    .andWhere('policy.isActive = true')
    .andWhere('policy.visibleToEmployee = true');

  if (query.category) {
    qb.andWhere('policy.category = :category', { category: query.category });
  }

  const [data, total] = await qb
    .orderBy('policy.createdAt', 'DESC')
    .skip((page - 1) * limit)
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

async listVisibleSolarFranchisePolicies(query: any) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);

  const qb = this.employeePolicyRepo
    .createQueryBuilder('policy')
    .where('policy.isHidden = false')
    .andWhere('policy.isActive = true')
    .andWhere('policy.visibleToSolarFranchise = true');

  if (query.category) {
    qb.andWhere('policy.category = :category', {
      category: query.category,
    });
  }

  if (query.search) {
    qb.andWhere(
      '(policy.title ILIKE :search OR policy.description ILIKE :search)',
      { search: `%${query.search}%` },
    );
  }

  const [data, total] = await qb
    .orderBy('policy.createdAt', 'DESC')
    .skip((page - 1) * limit)
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

async updateEmployeePolicy(id: number, body: any, user: any) {
  const item = await this.employeePolicyRepo.findOne({ where: { id } });

  if (!item) {
    throw new NotFoundException('Policy not found');
  }

  Object.assign(item, {
    category: body.category || item.category,
    title: body.title ?? item.title,
    description: body.description ?? item.description,
    fileUrl: body.fileUrl ?? item.fileUrl,
    fileName: body.fileName ?? item.fileName,
    visibleToEmployee:
      body.visibleToEmployee === undefined
        ? item.visibleToEmployee
        : body.visibleToEmployee,
        visibleToSolarFranchise:
  body.visibleToSolarFranchise === undefined
    ? (item as any).visibleToSolarFranchise
    : body.visibleToSolarFranchise,
    isActive: body.isActive === undefined ? item.isActive : body.isActive,
    updatedBy: user?.id || null,
    updatedByName: user?.name || '',
  });

  return this.employeePolicyRepo.save(item);
}

async hideEmployeePolicy(id: number, body: any, user: any) {
  const item = await this.employeePolicyRepo.findOne({ where: { id } });

  if (!item) {
    throw new NotFoundException('Policy not found');
  }

  item.isHidden = true;
  item.isActive = false;
  item.hiddenAt = new Date();
  item.hiddenBy = user?.id || null;
  item.hiddenByName = user?.name || '';
  item.hiddenReason = body?.reason || '';

  return this.employeePolicyRepo.save(item);
}

async restoreEmployeePolicy(id: number, body: any, user: any) {
  const item = await this.employeePolicyRepo.findOne({ where: { id } });

  if (!item) {
    throw new NotFoundException('Policy not found');
  }

  item.isHidden = false;
  item.isActive = true;
  item.restoredAt = new Date();
  item.restoredBy = user?.id || null;
  item.restoredByName = user?.name || '';
  item.restoreReason = body?.reason || '';

  return this.employeePolicyRepo.save(item);
}

async listHrSettings(query: any) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const showHidden = query.showHidden === 'true';

  const qb = this.hrPolicyRepo
    .createQueryBuilder('policy')
    .where('policy.isHidden = :showHidden', { showHidden });

  if (query.policyType) {
    qb.andWhere('policy.policyType = :policyType', {
      policyType: query.policyType,
    });
  }

  if (query.search) {
    qb.andWhere(
      '(policy.policyKey ILIKE :search OR policy.description ILIKE :search)',
      { search: `%${query.search}%` },
    );
  }

  const [data, total] = await qb
    .orderBy('policy.createdAt', 'DESC')
    .skip((page - 1) * limit)
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

async getHrSettingByType(policyType: string) {
  let policy = await this.hrPolicyRepo.findOne({
    where: {
      policyType: policyType as any,
      policyKey: 'DEFAULT',
      isHidden: false,
    },
  });

  if (!policy) {
    policy = this.hrPolicyRepo.create({
      policyType: policyType as any,
      policyKey: 'DEFAULT',
      policyData: {},
      description: '',
      version: 1,
      isActive: true,
      isHidden: false,
    });

    policy = await this.hrPolicyRepo.save(policy);
  }

  return policy;
}

async saveHrSetting(policyType: string, body: any, user: any) {
  let policy = await this.hrPolicyRepo.findOne({
    where: {
      policyType: policyType as any,
      policyKey: body.policyKey || 'DEFAULT',
      isHidden: false,
    },
  });

  if (!policy) {
    policy = this.hrPolicyRepo.create({
      policyType: policyType as any,
      policyKey: body.policyKey || 'DEFAULT',
      policyData: body.policyData || {},
      description: body.description || '',
      version: 1,
      changeRemarks: body.changeRemarks || '',
      isActive: body.isActive !== false,
      isHidden: false,
      createdBy: user?.id || null,
      updatedBy: user?.id || null,
    });

    return this.hrPolicyRepo.save(policy);
  }

  policy.policyData = body.policyData || policy.policyData || {};
  policy.description = body.description ?? policy.description;
  policy.changeRemarks = body.changeRemarks || '';
  policy.isActive =
    body.isActive === undefined ? policy.isActive : body.isActive;
  policy.updatedBy = user?.id || null;
  policy.version = Number(policy.version || 1) + 1;

  return this.hrPolicyRepo.save(policy);
}

async hideHrSetting(id: number, body: any, user: any) {
  const policy = await this.hrPolicyRepo.findOne({ where: { id } });

  if (!policy) {
    throw new NotFoundException('HR policy setting not found');
  }

  policy.isHidden = true;
  policy.isActive = false;
  policy.hiddenAt = new Date();
  policy.hiddenBy = user?.id || null;
  policy.hiddenByName = user?.name || '';
  policy.hiddenReason = body?.reason || '';

  return this.hrPolicyRepo.save(policy);
}

async restoreHrSetting(id: number, body: any, user: any) {
  const policy = await this.hrPolicyRepo.findOne({ where: { id } });

  if (!policy) {
    throw new NotFoundException('HR policy setting not found');
  }

  policy.isHidden = false;
  policy.isActive = true;
  policy.restoredAt = new Date();
  policy.restoredBy = user?.id || null;
  policy.restoredByName = user?.name || '';
  policy.restoreReason = body?.reason || '';

  return this.hrPolicyRepo.save(policy);
}

private calculateMonthDays(payrollMonth: string) {
  const [year, month] = String(payrollMonth).split('-').map(Number);

  if (!year || !month) return 30;

  return new Date(year, month, 0).getDate();
}

async generatePayroll(body: any, user: any) {
  if (!body.staffId || !body.payrollMonth) {
    throw new BadRequestException('Staff and payroll month are required');
  }

  const staff = await this.staffRepo.findOne({
    where: { id: Number(body.staffId), isHidden: false },
  });

  if (!staff) {
    throw new NotFoundException('Staff not found');
  }

  const existing = await this.payrollRepo.findOne({
    where: {
      staffId: staff.id,
      payrollMonth: body.payrollMonth,
      isHidden: false,
    },
  });

  if (existing) {
    throw new BadRequestException(
      'Payroll already exists for this staff and month',
    );
  }

  const basicSalary = Number(body.basicSalary || 0);
  const monthDays = this.calculateMonthDays(body.payrollMonth);
  const perDaySalary = monthDays > 0 ? basicSalary / monthDays : 0;

  const presentDays = Number(body.presentDays || 0);
  const halfDays = Number(body.halfDays || 0);
  const absentDays = Number(body.absentDays || 0);
  const leaveDays = Number(body.leaveDays || 0);

  const attendanceDeduction =
    absentDays * perDaySalary + halfDays * (perDaySalary / 2);

  const leaveDeduction = Number(body.leaveDeduction || 0);
  const penaltyAmount = Number(body.penaltyAmount || 0);
  const incentiveAmount = Number(body.incentiveAmount || 0);
  const otherAllowance = Number(body.otherAllowance || 0);
  const otherDeduction = Number(body.otherDeduction || 0);

  const grossSalary = basicSalary + incentiveAmount + otherAllowance;

  const netSalary =
    grossSalary -
    attendanceDeduction -
    leaveDeduction -
    penaltyAmount -
    otherDeduction;

  const payroll = this.payrollRepo.create({
    staffId: staff.id,
    staffName: staff.fullName,
    employeeCode: staff.employeeCode || '',
    staffRole: staff.staffRole || '',
    department: staff.department || '',
    branchName: staff.branchName || '',
    payrollMonth: body.payrollMonth,
    basicSalary,
    presentDays,
    halfDays,
    absentDays,
    leaveDays,
    workingHours: Number(body.workingHours || 0),
    attendanceDeduction,
    leaveDeduction,
    penaltyAmount,
    incentiveAmount,
    otherAllowance,
    otherDeduction,
    grossSalary,
    netSalary,
    status: 'GENERATED' as any,
    remarks: body.remarks || '',
    generatedBy: user?.id || null,
    generatedByName: user?.name || '',
    isHidden: false,
  });

  return this.payrollRepo.save(payroll);
}

async listPayrolls(query: any) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const showHidden = query.showHidden === 'true';

  const where: any = { isHidden: showHidden };

  if (query.staffId) where.staffId = Number(query.staffId);
  if (query.payrollMonth) where.payrollMonth = query.payrollMonth;
  if (query.status) where.status = query.status;

  const [data, total] = await this.payrollRepo.findAndCount({
    where,
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async updatePayroll(id: number, body: any) {
  const payroll = await this.payrollRepo.findOne({ where: { id } });

  if (!payroll) {
    throw new NotFoundException('Payroll not found');
  }

  if (payroll.status === 'PAID') {
    throw new BadRequestException('Paid payroll cannot be edited');
  }

  Object.assign(payroll, {
    basicSalary: Number(body.basicSalary ?? payroll.basicSalary),
    presentDays: Number(body.presentDays ?? payroll.presentDays),
    halfDays: Number(body.halfDays ?? payroll.halfDays),
    absentDays: Number(body.absentDays ?? payroll.absentDays),
    leaveDays: Number(body.leaveDays ?? payroll.leaveDays),
    workingHours: Number(body.workingHours ?? payroll.workingHours),
    leaveDeduction: Number(body.leaveDeduction ?? payroll.leaveDeduction),
    penaltyAmount: Number(body.penaltyAmount ?? payroll.penaltyAmount),
    incentiveAmount: Number(body.incentiveAmount ?? payroll.incentiveAmount),
    otherAllowance: Number(body.otherAllowance ?? payroll.otherAllowance),
    otherDeduction: Number(body.otherDeduction ?? payroll.otherDeduction),
    remarks: body.remarks ?? payroll.remarks,
  });

  const monthDays = this.calculateMonthDays(payroll.payrollMonth);
  const perDaySalary =
    monthDays > 0 ? Number(payroll.basicSalary || 0) / monthDays : 0;

  payroll.attendanceDeduction =
    Number(payroll.absentDays || 0) * perDaySalary +
    Number(payroll.halfDays || 0) * (perDaySalary / 2);

  payroll.grossSalary =
    Number(payroll.basicSalary || 0) +
    Number(payroll.incentiveAmount || 0) +
    Number(payroll.otherAllowance || 0);

  payroll.netSalary =
    Number(payroll.grossSalary || 0) -
    Number(payroll.attendanceDeduction || 0) -
    Number(payroll.leaveDeduction || 0) -
    Number(payroll.penaltyAmount || 0) -
    Number(payroll.otherDeduction || 0);

  if (body.ownerOverrideNetSalary !== undefined) {
    payroll.ownerOverrideApplied = true;
    payroll.ownerOverrideNetSalary = Number(body.ownerOverrideNetSalary || 0);
    payroll.ownerOverrideReason = body.ownerOverrideReason || '';
    payroll.netSalary = payroll.ownerOverrideNetSalary;
  }

  return this.payrollRepo.save(payroll);
}

async approvePayroll(id: number, body: any, user: any) {
  const payroll = await this.payrollRepo.findOne({ where: { id } });

  if (!payroll) {
    throw new NotFoundException('Payroll not found');
  }

  payroll.status = 'APPROVED' as any;
  payroll.approvedBy = user?.id || null;
  payroll.approvedByName = user?.name || '';
  payroll.approvedAt = new Date();
  payroll.remarks = body?.remarks || payroll.remarks || '';

  return this.payrollRepo.save(payroll);
}

async markPayrollPaid(id: number, body: any, user: any) {
  const payroll = await this.payrollRepo.findOne({ where: { id } });

  if (!payroll) {
    throw new NotFoundException('Payroll not found');
  }

  payroll.status = 'PAID' as any;
  payroll.paidAt = new Date();
  payroll.paidBy = user?.id || null;
  payroll.paidByName = user?.name || '';
  payroll.paymentRemarks = body?.paymentRemarks || '';

  return this.payrollRepo.save(payroll);
}

async hidePayroll(id: number, body: any, user: any) {
  const payroll = await this.payrollRepo.findOne({ where: { id } });

  if (!payroll) {
    throw new NotFoundException('Payroll not found');
  }

  payroll.isHidden = true;
  payroll.hiddenAt = new Date();
  payroll.hiddenBy = user?.id || null;
  payroll.hiddenByName = user?.name || '';
  payroll.hiddenReason = body?.reason || '';

  return this.payrollRepo.save(payroll);
}

async restorePayroll(id: number, body: any, user: any) {
  const payroll = await this.payrollRepo.findOne({ where: { id } });

  if (!payroll) {
    throw new NotFoundException('Payroll not found');
  }

  payroll.isHidden = false;
  payroll.restoredAt = new Date();
  payroll.restoredBy = user?.id || null;
  payroll.restoredByName = user?.name || '';
  payroll.restoreReason = body?.reason || '';

  return this.payrollRepo.save(payroll);
}

async createIncentiveRule(body: any, user: any) {
  if (!String(body.ruleName || '').trim()) {
    throw new BadRequestException('Rule name is required');
  }

  const item = this.incentiveRuleRepo.create({
    ruleName: String(body.ruleName).trim(),
    description: body.description || '',
    applicableRoles: Array.isArray(body.applicableRoles)
      ? body.applicableRoles
      : [],
    applicableStaffIds: Array.isArray(body.applicableStaffIds)
      ? body.applicableStaffIds
      : [],
    metricType: body.metricType || 'CUSTOM',
    customMetricName: body.customMetricName || '',
    calculationType: body.calculationType || 'MANUAL',
    eligibilityTarget: Number(body.eligibilityTarget || 0),
    rateAmount: Number(body.rateAmount || 0),
    percentageRate: Number(body.percentageRate || 0),
    slabRules: body.slabRules || null,
    periodType: body.periodType || 'MONTHLY',
    requiresApproval: body.requiresApproval !== false,
    includeInPayroll: body.includeInPayroll !== false,
    isActive: body.isActive !== false,
    isHidden: false,
    createdBy: user?.id || null,
    createdByName: user?.name || '',
  });

  return this.incentiveRuleRepo.save(item);
}

async listIncentiveRules(query: any) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const showHidden = query.showHidden === 'true';

  const qb = this.incentiveRuleRepo
    .createQueryBuilder('rule')
    .where('rule.isHidden = :showHidden', { showHidden });

  if (query.metricType) {
    qb.andWhere('rule.metricType = :metricType', {
      metricType: query.metricType,
    });
  }

  if (query.calculationType) {
    qb.andWhere('rule.calculationType = :calculationType', {
      calculationType: query.calculationType,
    });
  }

  if (query.search) {
    qb.andWhere(
      '(rule.ruleName ILIKE :search OR rule.description ILIKE :search)',
      { search: `%${query.search}%` },
    );
  }

  const [data, total] = await qb
    .orderBy('rule.createdAt', 'DESC')
    .skip((page - 1) * limit)
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

async updateIncentiveRule(id: number, body: any, user: any) {
  const item = await this.incentiveRuleRepo.findOne({ where: { id } });

  if (!item) {
    throw new NotFoundException('Incentive rule not found');
  }

  Object.assign(item, {
    ruleName: body.ruleName ?? item.ruleName,
    description: body.description ?? item.description,
    applicableRoles: Array.isArray(body.applicableRoles)
      ? body.applicableRoles
      : item.applicableRoles,
    applicableStaffIds: Array.isArray(body.applicableStaffIds)
      ? body.applicableStaffIds
      : item.applicableStaffIds,
    metricType: body.metricType ?? item.metricType,
    customMetricName: body.customMetricName ?? item.customMetricName,
    calculationType: body.calculationType ?? item.calculationType,
    eligibilityTarget:
      body.eligibilityTarget === undefined
        ? item.eligibilityTarget
        : Number(body.eligibilityTarget || 0),
    rateAmount:
      body.rateAmount === undefined
        ? item.rateAmount
        : Number(body.rateAmount || 0),
    percentageRate:
      body.percentageRate === undefined
        ? item.percentageRate
        : Number(body.percentageRate || 0),
    slabRules: body.slabRules === undefined ? item.slabRules : body.slabRules,
    periodType: body.periodType ?? item.periodType,
    requiresApproval:
      body.requiresApproval === undefined
        ? item.requiresApproval
        : body.requiresApproval,
    includeInPayroll:
      body.includeInPayroll === undefined
        ? item.includeInPayroll
        : body.includeInPayroll,
    isActive: body.isActive === undefined ? item.isActive : body.isActive,
    updatedBy: user?.id || null,
    updatedByName: user?.name || '',
  });

  return this.incentiveRuleRepo.save(item);
}

async hideIncentiveRule(id: number, body: any, user: any) {
  const item = await this.incentiveRuleRepo.findOne({ where: { id } });

  if (!item) {
    throw new NotFoundException('Incentive rule not found');
  }

  item.isHidden = true;
  item.isActive = false;
  item.hiddenAt = new Date();
  item.hiddenBy = user?.id || null;
  item.hiddenByName = user?.name || '';
  item.hiddenReason = body?.reason || '';

  return this.incentiveRuleRepo.save(item);
}

async restoreIncentiveRule(id: number, body: any, user: any) {
  const item = await this.incentiveRuleRepo.findOne({ where: { id } });

  if (!item) {
    throw new NotFoundException('Incentive rule not found');
  }

  item.isHidden = false;
  item.isActive = true;
  item.restoredAt = new Date();
  item.restoredBy = user?.id || null;
  item.restoredByName = user?.name || '';
  item.restoreReason = body?.reason || '';

  return this.incentiveRuleRepo.save(item);
}

async uploadRecruitmentFile(file: any) {
  return this.uploadFileToSupabase(
    file,
    'recruitment',
    ['image/', 'application/pdf'],
    20,
  );
}

async createRecruitmentCandidate(body: any, user: any) {
  if (!String(body.candidateName || '').trim()) {
    throw new BadRequestException('Candidate name is required');
  }

  const item = this.recruitmentRepo.create({
    candidateName: String(body.candidateName).trim(),
    mobile: body.mobile || '',
    alternateMobile: body.alternateMobile || '',
    email: body.email || '',
    appliedRole: body.appliedRole || '',
    department: body.department || '',
    branchName: body.branchName || '',
    source: body.source || '',
    expectedSalary: Number(body.expectedSalary || 0),
    experience: body.experience || '',
    noticePeriod: body.noticePeriod || '',
    resumeUrl: body.resumeUrl || '',
    photoUrl: body.photoUrl || '',
    documentUrl: body.documentUrl || '',
    stage: body.stage || 'APPLIED',
    interviewDate: body.interviewDate || null,
    interviewerName: body.interviewerName || '',
    interviewRating: Number(body.interviewRating || 0),
    interviewRemarks: body.interviewRemarks || '',
    offeredSalary: Number(body.offeredSalary || 0),
    joiningDate: body.joiningDate || null,
    offerLetterUrl: body.offerLetterUrl || '',
    remarks: body.remarks || '',
    isActive: body.isActive !== false,
    isHidden: false,
    createdBy: user?.id || null,
    createdByName: user?.name || '',
  });

  return this.recruitmentRepo.save(item);
}

async listRecruitmentCandidates(query: any) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const showHidden = query.showHidden === 'true';

  const qb = this.recruitmentRepo
    .createQueryBuilder('candidate')
    .where('candidate.isHidden = :showHidden', { showHidden });

  if (query.stage) {
    qb.andWhere('candidate.stage = :stage', { stage: query.stage });
  }

  if (query.branchName) {
    qb.andWhere('candidate.branchName = :branchName', {
      branchName: query.branchName,
    });
  }

  if (query.department) {
    qb.andWhere('candidate.department = :department', {
      department: query.department,
    });
  }

  if (query.search) {
    qb.andWhere(
      `(candidate.candidateName ILIKE :search 
        OR candidate.mobile ILIKE :search 
        OR candidate.email ILIKE :search 
        OR candidate.appliedRole ILIKE :search)`,
      { search: `%${query.search}%` },
    );
  }

  const [data, total] = await qb
    .orderBy('candidate.createdAt', 'DESC')
    .skip((page - 1) * limit)
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

async updateRecruitmentCandidate(id: number, body: any, user: any) {
  const item = await this.recruitmentRepo.findOne({ where: { id } });

  if (!item) {
    throw new NotFoundException('Candidate not found');
  }

  Object.assign(item, {
    candidateName: body.candidateName ?? item.candidateName,
    mobile: body.mobile ?? item.mobile,
    alternateMobile: body.alternateMobile ?? item.alternateMobile,
    email: body.email ?? item.email,
    appliedRole: body.appliedRole ?? item.appliedRole,
    department: body.department ?? item.department,
    branchName: body.branchName ?? item.branchName,
    source: body.source ?? item.source,
    expectedSalary:
      body.expectedSalary === undefined
        ? item.expectedSalary
        : Number(body.expectedSalary || 0),
    experience: body.experience ?? item.experience,
    noticePeriod: body.noticePeriod ?? item.noticePeriod,
    resumeUrl: body.resumeUrl ?? item.resumeUrl,
    photoUrl: body.photoUrl ?? item.photoUrl,
    documentUrl: body.documentUrl ?? item.documentUrl,
    stage: body.stage ?? item.stage,
    interviewDate: body.interviewDate ?? item.interviewDate,
    interviewTime: body.interviewTime ?? item.interviewTime,
    interviewerName: body.interviewerName ?? item.interviewerName,
    interviewRating:
      body.interviewRating === undefined
        ? item.interviewRating
        : Number(body.interviewRating || 0),
    interviewRemarks: body.interviewRemarks ?? item.interviewRemarks,
    offeredSalary:
      body.offeredSalary === undefined
        ? item.offeredSalary
        : Number(body.offeredSalary || 0),
    joiningDate: body.joiningDate ?? item.joiningDate,
    offerLetterUrl: body.offerLetterUrl ?? item.offerLetterUrl,
    remarks: body.remarks ?? item.remarks,
    isActive: body.isActive === undefined ? item.isActive : body.isActive,
    updatedBy: user?.id || null,
    updatedByName: user?.name || '',
  });

  return this.recruitmentRepo.save(item);
}

async hideRecruitmentCandidate(id: number, body: any, user: any) {
  const item = await this.recruitmentRepo.findOne({ where: { id } });

  if (!item) {
    throw new NotFoundException('Candidate not found');
  }

  item.isHidden = true;
  item.isActive = false;
  item.hiddenAt = new Date();
  item.hiddenBy = user?.id || null;
  item.hiddenByName = user?.name || '';
  item.hiddenReason = body?.reason || '';

  return this.recruitmentRepo.save(item);
}

async restoreRecruitmentCandidate(id: number, body: any, user: any) {
  const item = await this.recruitmentRepo.findOne({ where: { id } });

  if (!item) {
    throw new NotFoundException('Candidate not found');
  }

  item.isHidden = false;
  item.isActive = true;
  item.restoredAt = new Date();
  item.restoredBy = user?.id || null;
  item.restoredByName = user?.name || '';
  item.restoreReason = body?.reason || '';

  return this.recruitmentRepo.save(item);
}

async addRecruitmentCandidateDocument(body: any, user: any) {
  if (!body.candidateId || !String(body.documentLabel || '').trim()) {
    throw new BadRequestException('Candidate and document label are required');
  }

  if (!body.fileUrl) {
    throw new BadRequestException('Document file is required');
  }

  const candidate = await this.recruitmentRepo.findOne({
    where: { id: Number(body.candidateId), isHidden: false },
  });

  if (!candidate) {
    throw new NotFoundException('Candidate not found');
  }

  const document = this.recruitmentDocumentRepo.create({
    candidateId: Number(body.candidateId),
    documentLabel: String(body.documentLabel).trim(),
    fileName: body.fileName || '',
    fileUrl: body.fileUrl,
    uploadedBy: user?.id || null,
    uploadedByName: user?.name || '',
    remarks: body.remarks || '',
    isHidden: false,
  });

  return this.recruitmentDocumentRepo.save(document);
}

async listRecruitmentCandidateDocuments(candidateId: number) {
  return this.recruitmentDocumentRepo.find({
    where: {
      candidateId,
      isHidden: false,
    },
    order: {
      createdAt: 'DESC',
    },
  });
}

async hideRecruitmentCandidateDocument(id: number) {
  const document = await this.recruitmentDocumentRepo.findOne({
    where: { id },
  });

  if (!document) {
    throw new NotFoundException('Candidate document not found');
  }

  document.isHidden = true;

  return this.recruitmentDocumentRepo.save(document);
}

async createPerformanceTemplate(body: any, user: any) {
  if (!String(body.templateName || '').trim()) {
    throw new BadRequestException('Template name is required');
  }

  if (!String(body.applicableRole || '').trim()) {
    throw new BadRequestException('Applicable role is required');
  }

  const template = this.performanceTemplateRepo.create({
    templateName: String(body.templateName).trim(),
    applicableRole: body.applicableRole,
    department: body.department || '',
    branchName: body.branchName || '',
    isDefault: body.isDefault !== false,
    description: body.description || '',
    isActive: body.isActive !== false,
    isHidden: false,
    createdBy: user?.id || null,
    createdByName: user?.name || '',
  });

  const saved = await this.performanceTemplateRepo.save(template);

  const metrics = Array.isArray(body.metrics) ? body.metrics : [];

  for (const metric of metrics) {
    if (!String(metric.metricName || '').trim()) continue;

    const metricRow = this.performanceTemplateMetricRepo.create({
      templateId: saved.id,
      metricName: String(metric.metricName).trim(),
      targetValue: Number(metric.targetValue || 0),
      metricType: metric.metricType || 'NUMBER',
      metricUnit: metric.metricUnit || 'COUNT',
      mandatory: metric.mandatory === true,
      weightage: Number(metric.weightage || 1),
    });

    await this.performanceTemplateMetricRepo.save(metricRow);
  }

  return saved;
}

async listPerformanceTemplates(query: any) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const showHidden = query.showHidden === 'true';

  const qb = this.performanceTemplateRepo
    .createQueryBuilder('template')
    .where('template.isHidden = :showHidden', { showHidden });

  if (query.applicableRole) {
    qb.andWhere('template.applicableRole = :applicableRole', {
      applicableRole: query.applicableRole,
    });
  }

  if (query.search) {
    qb.andWhere(
      '(template.templateName ILIKE :search OR template.description ILIKE :search)',
      { search: `%${query.search}%` },
    );
  }

  const [data, total] = await qb
    .orderBy('template.createdAt', 'DESC')
    .skip((page - 1) * limit)
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

async getPerformanceTemplateMetrics(templateId: number) {
  return this.performanceTemplateMetricRepo.find({
    where: { templateId },
    order: { id: 'ASC' },
  });
}

async updatePerformanceTemplate(id: number, body: any, user: any) {
  const template = await this.performanceTemplateRepo.findOne({ where: { id } });

  if (!template) {
    throw new NotFoundException('Performance template not found');
  }

  Object.assign(template, {
    templateName: body.templateName ?? template.templateName,
    applicableRole: body.applicableRole ?? template.applicableRole,
    department: body.department ?? template.department,
    branchName: body.branchName ?? template.branchName,
    isDefault: body.isDefault === undefined ? template.isDefault : body.isDefault,
    description: body.description ?? template.description,
    isActive: body.isActive === undefined ? template.isActive : body.isActive,
  });

  const saved = await this.performanceTemplateRepo.save(template);

  if (Array.isArray(body.metrics)) {
    await this.performanceTemplateMetricRepo.delete({ templateId: id });

    for (const metric of body.metrics) {
      if (!String(metric.metricName || '').trim()) continue;

      await this.performanceTemplateMetricRepo.save(
        this.performanceTemplateMetricRepo.create({
          templateId: id,
          metricName: String(metric.metricName).trim(),
          targetValue: Number(metric.targetValue || 0),
          metricType: metric.metricType || 'NUMBER',
          metricUnit: metric.metricUnit || 'COUNT',
          mandatory: metric.mandatory === true,
          weightage: Number(metric.weightage || 1),
        }),
      );
    }
  }

  return saved;
}

async hidePerformanceTemplate(id: number) {
  const template = await this.performanceTemplateRepo.findOne({ where: { id } });

  if (!template) {
    throw new NotFoundException('Performance template not found');
  }

  template.isHidden = true;
  template.isActive = false;

  return this.performanceTemplateRepo.save(template);
}

async restorePerformanceTemplate(id: number) {
  const template = await this.performanceTemplateRepo.findOne({ where: { id } });

  if (!template) {
    throw new NotFoundException('Performance template not found');
  }

  template.isHidden = false;
  template.isActive = true;

  return this.performanceTemplateRepo.save(template);
}

// =====================================================
// PENALTY MANAGEMENT
// =====================================================

async listPenaltyRules(query: any) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const showHidden = query.showHidden === 'true';

  const qb = this.penaltyRuleRepository
    .createQueryBuilder('rule')
    .where('rule.isHidden = :showHidden', { showHidden });

  if (query.penaltyType) {
    qb.andWhere('rule.penaltyType = :penaltyType', {
      penaltyType: query.penaltyType,
    });
  }

  if (query.calculationType) {
    qb.andWhere('rule.calculationType = :calculationType', {
      calculationType: query.calculationType,
    });
  }

  if (query.search) {
    qb.andWhere(
      '(rule.ruleName ILIKE :search OR rule.description ILIKE :search)',
      { search: `%${query.search}%` },
    );
  }

  const [data, total] = await qb
    .orderBy('rule.createdAt', 'DESC')
    .skip((page - 1) * limit)
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

async createPenaltyRule(body: any, user: any) {
  if (!String(body.ruleName || '').trim()) {
    throw new BadRequestException('Penalty rule name is required');
  }

  const item = this.penaltyRuleRepository.create({
    ruleName: String(body.ruleName).trim(),
    description: body.description || '',
    applicableRoles: Array.isArray(body.applicableRoles)
      ? body.applicableRoles
      : [],
    department: body.department || '',
    branchName: body.branchName || '',
    penaltyType: body.penaltyType || 'CUSTOM',
    calculationType: body.calculationType || 'MANUAL',
    amount: Number(body.amount || 0),
    percentageRate: Number(body.percentageRate || 0),
    requiresApproval: body.requiresApproval !== false,
    includeInPayroll: body.includeInPayroll !== false,
    isActive: body.isActive !== false,
    isHidden: false,
    createdBy: user?.id || null,
    createdByName: user?.name || '',
  });

  return this.penaltyRuleRepository.save(item);
}

async updatePenaltyRule(id: number, body: any, user: any) {
  const item = await this.penaltyRuleRepository.findOne({ where: { id } });

  if (!item) {
    throw new NotFoundException('Penalty rule not found');
  }

  Object.assign(item, {
    ruleName: body.ruleName ?? item.ruleName,
    description: body.description ?? item.description,
    applicableRoles: Array.isArray(body.applicableRoles)
      ? body.applicableRoles
      : item.applicableRoles,
    department: body.department ?? item.department,
    branchName: body.branchName ?? item.branchName,
    penaltyType: body.penaltyType ?? item.penaltyType,
    calculationType: body.calculationType ?? item.calculationType,
    amount:
      body.amount === undefined ? item.amount : Number(body.amount || 0),
    percentageRate:
      body.percentageRate === undefined
        ? item.percentageRate
        : Number(body.percentageRate || 0),
    requiresApproval:
      body.requiresApproval === undefined
        ? item.requiresApproval
        : body.requiresApproval,
    includeInPayroll:
      body.includeInPayroll === undefined
        ? item.includeInPayroll
        : body.includeInPayroll,
    isActive: body.isActive === undefined ? item.isActive : body.isActive,
    updatedBy: user?.id || null,
    updatedByName: user?.name || '',
  });

  return this.penaltyRuleRepository.save(item);
}

async hidePenaltyRule(id: number, body: any, user: any) {
  const item = await this.penaltyRuleRepository.findOne({ where: { id } });

  if (!item) {
    throw new NotFoundException('Penalty rule not found');
  }

  item.isHidden = true;
  item.isActive = false;
  item.hiddenAt = new Date();
  item.hiddenBy = user?.id || null;
  item.hiddenByName = user?.name || '';
  item.hiddenReason = body?.reason || '';

  return this.penaltyRuleRepository.save(item);
}

async restorePenaltyRule(id: number, body: any, user: any) {
  const item = await this.penaltyRuleRepository.findOne({ where: { id } });

  if (!item) {
    throw new NotFoundException('Penalty rule not found');
  }

  item.isHidden = false;
  item.isActive = true;
  item.restoredAt = new Date();
  item.restoredBy = user?.id || null;
  item.restoredByName = user?.name || '';
  item.restoreReason = body?.reason || '';

  return this.penaltyRuleRepository.save(item);
}
}
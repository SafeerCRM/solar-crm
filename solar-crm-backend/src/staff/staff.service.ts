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
import {
  StaffPayrollConditionFailureAction,
  StaffPayrollConditionOperator,
  StaffPayrollIncentiveCalculationType,
  StaffPayrollMetricType,
  StaffPayrollRule,
  StaffPayrollRuleScope,
  StaffPayrollSalaryMode,
  StaffPayrollTargetCalculationMode,
} from './staff-payroll-rule.entity';
import { IncentiveRule } from './incentive-rule.entity';
import {
  RecruitmentCandidate,
  RecruitmentStage,
} from './recruitment-candidate.entity';
import { RecruitmentCandidateDocument } from './recruitment-candidate-document.entity';
import { PerformanceTemplate } from './performance-template.entity';
import { PerformanceTemplateMetric } from './performance-template-metric.entity';
import {
  PenaltyRule,
  PenaltyCalculationType,
} from './penalty-rule.entity';
import { AttendanceLocation } from './attendance-location.entity';
import {
  StaffAttendanceLocationRule,
  StaffAttendancePolicy,
} from './staff-attendance-policy.entity';
import { StaffAttendanceOverride } from './staff-attendance-override.entity';
import {
  StaffAttendanceException,
  StaffAttendanceExceptionPunchType,
  StaffAttendanceExceptionStatus,
} from './staff-attendance-exception.entity';
import {
  StaffPayrollCalculatorService,
} from './staff-payroll-calculator.service';

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

@InjectRepository(StaffPayrollRule)
private readonly staffPayrollRuleRepo:
  Repository<StaffPayrollRule>,

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

@InjectRepository(AttendanceLocation)
private readonly attendanceLocationRepo: Repository<AttendanceLocation>,

@InjectRepository(StaffAttendancePolicy)
private readonly attendancePolicyRepo: Repository<StaffAttendancePolicy>,

@InjectRepository(StaffAttendanceOverride)
private readonly attendanceOverrideRepo: Repository<StaffAttendanceOverride>,

@InjectRepository(StaffAttendanceException)
private readonly attendanceExceptionRepo:
  Repository<StaffAttendanceException>,

private readonly payrollCalculator:
  StaffPayrollCalculatorService,
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

  const monthlyBasicSalary = Number(
    body.monthlyBasicSalary || 0,
  );

  if (
    !Number.isFinite(monthlyBasicSalary) ||
    monthlyBasicSalary < 0
  ) {
    throw new BadRequestException(
      'Monthly basic salary must be a valid non-negative amount',
    );
  }

  const reportingManagerId =
    body.reportingManagerId === undefined ||
    body.reportingManagerId === null ||
    body.reportingManagerId === ''
      ? null
      : Number(body.reportingManagerId);

  if (
    reportingManagerId !== null &&
    (!Number.isInteger(reportingManagerId) ||
      reportingManagerId <= 0)
  ) {
    throw new BadRequestException(
      'Reporting manager is invalid',
    );
  }

  const staff = this.staffRepo.create({
    ...body,

    fullName: String(body.fullName).trim(),

    linkedUserId:
      body.linkedUserId === undefined ||
      body.linkedUserId === null ||
      body.linkedUserId === ''
        ? null
        : Number(body.linkedUserId),

    monthlyBasicSalary,
    isSupportingStaff:
      body.isSupportingStaff === true,

    reportingManagerId,
    reportingManagerName: String(
      body.reportingManagerName || '',
    ).trim(),

    isActive: body.isActive !== false,
    isHidden: false,
  });

  return this.staffRepo.save(staff);
}

  async update(id: number, body: any) {
  const staff = await this.staffRepo.findOne({
    where: { id },
  });

  if (!staff) {
    throw new NotFoundException('Staff not found');
  }

  if (body.fullName !== undefined) {
    const fullName = String(
      body.fullName || '',
    ).trim();

    if (!fullName) {
      throw new BadRequestException(
        'Staff full name is required',
      );
    }

    staff.fullName = fullName;
  }

  if (body.monthlyBasicSalary !== undefined) {
    const monthlyBasicSalary = Number(
      body.monthlyBasicSalary || 0,
    );

    if (
      !Number.isFinite(monthlyBasicSalary) ||
      monthlyBasicSalary < 0
    ) {
      throw new BadRequestException(
        'Monthly basic salary must be a valid non-negative amount',
      );
    }

    staff.monthlyBasicSalary =
      monthlyBasicSalary;
  }

  if (body.isSupportingStaff !== undefined) {
    staff.isSupportingStaff =
      body.isSupportingStaff === true;
  }

  if (body.reportingManagerId !== undefined) {
    if (
      body.reportingManagerId === null ||
      body.reportingManagerId === ''
    ) {
      staff.reportingManagerId = null;
      staff.reportingManagerName = '';
    } else {
      const reportingManagerId = Number(
        body.reportingManagerId,
      );

      if (
        !Number.isInteger(reportingManagerId) ||
        reportingManagerId <= 0
      ) {
        throw new BadRequestException(
          'Reporting manager is invalid',
        );
      }

      if (reportingManagerId === staff.id) {
        throw new BadRequestException(
          'A staff member cannot report to themselves',
        );
      }

      staff.reportingManagerId =
        reportingManagerId;
    }
  }

  if (body.reportingManagerName !== undefined) {
    staff.reportingManagerName = String(
      body.reportingManagerName || '',
    ).trim();
  }

  if (body.linkedUserId !== undefined) {
    staff.linkedUserId =
      body.linkedUserId === null ||
      body.linkedUserId === ''
        ? null
        : Number(body.linkedUserId);
  }

  const protectedFields = new Set([
    'id',
    'monthlyBasicSalary',
    'isSupportingStaff',
    'reportingManagerId',
    'reportingManagerName',
    'linkedUserId',
    'fullName',
    'createdAt',
  ]);

  Object.entries(body).forEach(([key, value]) => {
    if (!protectedFields.has(key)) {
      (staff as any)[key] = value;
    }
  });

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
    const linkedStaff =
      await this.getMyStaffProfile(user);

    staffId = linkedStaff.id;
  }

  const staff = await this.staffRepo.findOne({
    where: {
      id: Number(staffId),
      isHidden: false,
    },
  });

  if (!staff) {
    throw new NotFoundException(
      'Staff not found',
    );
  }

  const attendanceDate =
    body.attendanceDate ||
    this.getTodayDate();

  const existing =
    await this.attendanceRepo.findOne({
      where: {
        staffId: staff.id,
        attendanceDate,
      },
    });

  if (existing?.punchInTime) {
    throw new BadRequestException(
      'Staff already punched in today',
    );
  }

  const attemptedAt = new Date();

  const locationEvaluation =
    await this.evaluateAttendanceLocation(
      staff.id,
      attendanceDate,
      'PUNCH_IN',
      body.latitude,
      body.longitude,
    );

  if (!locationEvaluation.allowed) {
    throw new BadRequestException({
      message:
        `Punch in is allowed only within ${locationEvaluation.allowedRadiusMeters} metres of ${locationEvaluation.location?.name || 'the approved attendance location'}`,
      code:
        'ATTENDANCE_LOCATION_OUTSIDE_RADIUS',
      canRequestException: true,
      punchType: 'PUNCH_IN',
      staffId: staff.id,
      staffName: staff.fullName || '',
      employeeCode:
        staff.employeeCode || '',
      attendanceDate,
      attemptedAt:
        attemptedAt.toISOString(),
      latitude:
        locationEvaluation.latitude,
      longitude:
        locationEvaluation.longitude,
      gpsAddress:
        String(body.gpsAddress || ''),
      photoUrl:
        String(body.photoUrl || ''),
      attendanceLocationId:
        locationEvaluation.location?.id ||
        null,
      attendanceLocationName:
        locationEvaluation.location?.name ||
        '',
      distanceMeters:
        locationEvaluation.distanceMeters,
      allowedRadiusMeters:
        locationEvaluation.allowedRadiusMeters,
      ruleSource:
        locationEvaluation.ruleSource,
      overrideReason:
        locationEvaluation.overrideReason ||
        '',
    });
  }

  const attendance =
    existing ||
    this.attendanceRepo.create({
      staffId: staff.id,
      staffName: staff.fullName,
      employeeCode:
        staff.employeeCode || '',
      attendanceDate,
    });

  attendance.punchInTime = attemptedAt;

  attendance.punchInLatitude = String(
    locationEvaluation.latitude,
  );

  attendance.punchInLongitude = String(
    locationEvaluation.longitude,
  );

  attendance.punchInGpsAddress =
    body.gpsAddress || '';

  attendance.punchInPhotoUrl =
    body.photoUrl || '';

  attendance.status =
    body.status || 'PRESENT';

  attendance.remarks =
    body.remarks ||
    attendance.remarks ||
    '';

  attendance.createdBy =
    user?.id || null;

  attendance.createdByName =
    user?.name || '';

  return this.attendanceRepo.save(
    attendance,
  );
}

async punchOut(body: any, user: any) {
  let staffId = body.staffId;

  if (!staffId) {
    const linkedStaff =
      await this.getMyStaffProfile(user);

    staffId = linkedStaff.id;
  }

  const attendanceDate =
    body.attendanceDate ||
    this.getTodayDate();

  const attendance =
    await this.attendanceRepo.findOne({
      where: {
        staffId: Number(staffId),
        attendanceDate,
      },
    });

  if (
    !attendance ||
    !attendance.punchInTime
  ) {
    throw new BadRequestException(
      'Punch in is required before punch out',
    );
  }

  if (attendance.punchOutTime) {
    throw new BadRequestException(
      'Staff already punched out today',
    );
  }

  const attemptedAt = new Date();

  const locationEvaluation =
    await this.evaluateAttendanceLocation(
      attendance.staffId,
      attendanceDate,
      'PUNCH_OUT',
      body.latitude,
      body.longitude,
    );

  if (!locationEvaluation.allowed) {
    throw new BadRequestException({
      message:
        `Punch out is allowed only within ${locationEvaluation.allowedRadiusMeters} metres of ${locationEvaluation.location?.name || 'the approved attendance location'}`,
      code:
        'ATTENDANCE_LOCATION_OUTSIDE_RADIUS',
      canRequestException: true,
      punchType: 'PUNCH_OUT',
      staffId: attendance.staffId,
      staffName:
        attendance.staffName || '',
      employeeCode:
        attendance.employeeCode || '',
      attendanceDate,
      attemptedAt:
        attemptedAt.toISOString(),
      latitude:
        locationEvaluation.latitude,
      longitude:
        locationEvaluation.longitude,
      gpsAddress:
        String(body.gpsAddress || ''),
      photoUrl:
        String(body.photoUrl || ''),
      attendanceLocationId:
        locationEvaluation.location?.id ||
        null,
      attendanceLocationName:
        locationEvaluation.location?.name ||
        '',
      distanceMeters:
        locationEvaluation.distanceMeters,
      allowedRadiusMeters:
        locationEvaluation.allowedRadiusMeters,
      ruleSource:
        locationEvaluation.ruleSource,
      overrideReason:
        locationEvaluation.overrideReason ||
        '',
    });
  }

  attendance.punchOutTime = attemptedAt;

  attendance.punchOutLatitude = String(
    locationEvaluation.latitude,
  );

  attendance.punchOutLongitude = String(
    locationEvaluation.longitude,
  );

  attendance.punchOutGpsAddress =
    body.gpsAddress || '';

  attendance.punchOutPhotoUrl =
    body.photoUrl || '';

  attendance.workingHours =
    this.calculateWorkingHours(
      attendance.punchInTime,
      attendance.punchOutTime,
    );

  attendance.remarks =
    body.remarks ||
    attendance.remarks ||
    '';

  if (
    attendance.workingHours > 0 &&
    attendance.workingHours < 4
  ) {
    attendance.status =
      'HALF_DAY' as any;
  }

  return this.attendanceRepo.save(
    attendance,
  );
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

private validateStaffPayrollRulePayload(
  body: any,
) {
  const ruleName = String(
    body.ruleName || '',
  ).trim();

  if (!ruleName) {
    throw new BadRequestException(
      'Payroll rule name is required',
    );
  }

  const scope =
    body.scope ||
    StaffPayrollRuleScope.ROLE;

  if (
    !Object.values(
      StaffPayrollRuleScope,
    ).includes(scope)
  ) {
    throw new BadRequestException(
      'Invalid payroll rule scope',
    );
  }

  const applicableRole = String(
    body.applicableRole || '',
  )
    .trim()
    .toUpperCase();

  const staffId =
    body.staffId === null ||
    body.staffId === undefined ||
    body.staffId === ''
      ? null
      : Number(body.staffId);

  if (
    scope ===
      StaffPayrollRuleScope.ROLE &&
    !applicableRole
  ) {
    throw new BadRequestException(
      'Applicable role is required for a role-based payroll rule',
    );
  }

  if (
    scope ===
      StaffPayrollRuleScope.STAFF &&
    (
      !Number.isInteger(staffId) ||
      Number(staffId) <= 0
    )
  ) {
    throw new BadRequestException(
      'Valid staff is required for a staff-specific payroll rule',
    );
  }

  const salaryMode =
    body.salaryMode ||
    StaffPayrollSalaryMode.MANUAL;

  if (
    !Object.values(
      StaffPayrollSalaryMode,
    ).includes(salaryMode)
  ) {
    throw new BadRequestException(
      'Invalid payroll salary mode',
    );
  }

  const targetCalculationMode =
    body.targetCalculationMode ||
    StaffPayrollTargetCalculationMode
      .FIXED;

  if (
    !Object.values(
      StaffPayrollTargetCalculationMode,
    ).includes(
      targetCalculationMode,
    )
  ) {
    throw new BadRequestException(
      'Invalid target calculation mode',
    );
  }

  const maximumSalaryPercentage =
    Number(
      body.maximumSalaryPercentage ??
        100,
    );

  if (
    !Number.isFinite(
      maximumSalaryPercentage,
    ) ||
    maximumSalaryPercentage < 0 ||
    maximumSalaryPercentage > 100
  ) {
    throw new BadRequestException(
      'Maximum salary percentage must be between 0 and 100',
    );
  }

  const nonNegativeFields = [
    {
      key: 'salaryTargetValue',
      label: 'Salary target',
    },
    {
      key: 'teamMemberTargetValue',
      label: 'Team member target',
    },
    {
      key: 'attendanceTargetHours',
      label: 'Attendance target hours',
    },
    {
      key: 'attendanceTargetDays',
      label: 'Attendance target days',
    },
    {
      key: 'attendanceTargetPercentage',
      label:
        'Attendance target percentage',
    },
    {
      key: 'maximumSalaryAmount',
      label: 'Maximum salary amount',
      nullable: true,
    },
    {
      key: 'maximumIncentiveAmount',
      label: 'Maximum incentive amount',
      nullable: true,
    },
  ];

  for (
    const field of
      nonNegativeFields
  ) {
    const rawValue =
      body[field.key];

    if (
      field.nullable === true &&
      (
        rawValue === null ||
        rawValue === undefined ||
        rawValue === ''
      )
    ) {
      continue;
    }

    const value = Number(
      rawValue || 0,
    );

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new BadRequestException(
        `${field.label} must be a valid non-negative number`,
      );
    }
  }

  if (
    salaryMode ===
      StaffPayrollSalaryMode
        .PROPORTIONAL_TO_TARGET &&
    !body.salaryMetricType
  ) {
    throw new BadRequestException(
      'Salary metric is required for proportional salary calculation',
    );
  }

  if (
    targetCalculationMode ===
      StaffPayrollTargetCalculationMode
        .TEAM_SIZE_MULTIPLIER
  ) {
    if (
      !body.targetMultiplierMetricType
    ) {
      throw new BadRequestException(
        'Target multiplier metric is required for team-size calculation',
      );
    }

    const teamMemberTargetValue =
      Number(
        body.teamMemberTargetValue ||
          0,
      );

    if (
      !Number.isFinite(
        teamMemberTargetValue,
      ) ||
      teamMemberTargetValue <= 0
    ) {
      throw new BadRequestException(
        'Target per team member must be greater than zero',
      );
    }
  }

  const eligibilityConditions =
    Array.isArray(
      body.eligibilityConditions,
    )
      ? body.eligibilityConditions
      : [];

  for (
    let index = 0;
    index <
    eligibilityConditions.length;
    index += 1
  ) {
    const condition =
      eligibilityConditions[index];

    if (
      condition?.isEnabled !== true
    ) {
      continue;
    }

    const conditionLabel =
      String(
        condition.label ||
          `Condition ${index + 1}`,
      ).trim();

    if (
      !condition.metricType ||
      !Object.values(
        StaffPayrollMetricType,
      ).includes(
        condition.metricType,
      )
    ) {
      throw new BadRequestException(
        `${conditionLabel}: invalid metric type`,
      );
    }

    if (
      !condition.operator ||
      !Object.values(
        StaffPayrollConditionOperator,
      ).includes(
        condition.operator,
      )
    ) {
      throw new BadRequestException(
        `${conditionLabel}: invalid comparison operator`,
      );
    }

    if (
      !condition.failureAction ||
      !Object.values(
        StaffPayrollConditionFailureAction,
      ).includes(
        condition.failureAction,
      )
    ) {
      throw new BadRequestException(
        `${conditionLabel}: invalid failure action`,
      );
    }

    const targetValue =
      Number(
        condition.targetValue ||
          0,
      );

    if (
      !Number.isFinite(
        targetValue,
      ) ||
      targetValue < 0
    ) {
      throw new BadRequestException(
        `${conditionLabel}: target value must be a valid non-negative number`,
      );
    }
  }

  const incentiveComponents =
    Array.isArray(
      body.incentiveComponents,
    )
      ? body.incentiveComponents
      : [];

  for (
    let componentIndex = 0;
    componentIndex <
    incentiveComponents.length;
    componentIndex += 1
  ) {
    const component =
      incentiveComponents[
        componentIndex
      ];

    if (
      component?.isEnabled !== true
    ) {
      continue;
    }

    const componentLabel =
      String(
        component.label ||
          `Incentive ${
            componentIndex + 1
          }`,
      ).trim();

    if (
      !component.metricType ||
      !Object.values(
        StaffPayrollMetricType,
      ).includes(
        component.metricType,
      )
    ) {
      throw new BadRequestException(
        `${componentLabel}: invalid metric type`,
      );
    }

    if (
      !component.calculationType ||
      !Object.values(
        StaffPayrollIncentiveCalculationType,
      ).includes(
        component.calculationType,
      )
    ) {
      throw new BadRequestException(
        `${componentLabel}: invalid calculation type`,
      );
    }

    const numericComponentFields = [
      'rateAmount',
      'percentageRate',
      'baselineTarget',
      'poolAmountPerCompanyUnit',
      'fixedPoolDivisor',
      'minimumPersonalMetricValue',
      'maximumAmount',
    ];

    for (
      const key of
        numericComponentFields
    ) {
      const rawValue =
        component[key];

      if (
        rawValue === null ||
        rawValue === undefined ||
        rawValue === ''
      ) {
        continue;
      }

      const value =
        Number(rawValue);

      if (
        !Number.isFinite(value) ||
        value < 0
      ) {
        throw new BadRequestException(
          `${componentLabel}: ${key} must be a valid non-negative number`,
        );
      }
    }

    if (
      component.calculationType ===
        StaffPayrollIncentiveCalculationType
          .PERCENTAGE
    ) {
      const percentageRate =
        Number(
          component.percentageRate ||
            0,
        );

      if (
        percentageRate < 0 ||
        percentageRate > 100
      ) {
        throw new BadRequestException(
          `${componentLabel}: percentage rate must be between 0 and 100`,
        );
      }
    }

    if (
      component.calculationType ===
        StaffPayrollIncentiveCalculationType
          .SLAB
    ) {
      const slabRules =
        Array.isArray(
          component.slabRules,
        )
          ? component.slabRules
          : [];

      if (!slabRules.length) {
        throw new BadRequestException(
          `${componentLabel}: at least one slab is required`,
        );
      }

      const normalizedSlabs =
        slabRules
          .map(
            (
              slab: any,
              slabIndex: number,
            ) => {
              const minimumValue =
                Number(
                  slab.minimumValue,
                );

              const maximumValue =
                slab.maximumValue ===
                  null ||
                slab.maximumValue ===
                  undefined ||
                slab.maximumValue ===
                  ''
                  ? null
                  : Number(
                      slab.maximumValue,
                    );

              if (
                !Number.isFinite(
                  minimumValue,
                ) ||
                minimumValue < 0
              ) {
                throw new BadRequestException(
                  `${componentLabel}: slab ${
                    slabIndex + 1
                  } minimum value is invalid`,
                );
              }

              if (
                maximumValue !==
                  null &&
                (
                  !Number.isFinite(
                    maximumValue,
                  ) ||
                  maximumValue <
                    minimumValue
                )
              ) {
                throw new BadRequestException(
                  `${componentLabel}: slab ${
                    slabIndex + 1
                  } maximum value must be greater than or equal to its minimum value`,
                );
              }

              const percentageRate =
                slab.percentageRate ===
                  null ||
                slab.percentageRate ===
                  undefined ||
                slab.percentageRate ===
                  ''
                  ? 0
                  : Number(
                      slab.percentageRate,
                    );

              if (
                !Number.isFinite(
                  percentageRate,
                ) ||
                percentageRate < 0 ||
                percentageRate > 100
              ) {
                throw new BadRequestException(
                  `${componentLabel}: slab ${
                    slabIndex + 1
                  } percentage must be between 0 and 100`,
                );
              }

              const rateAmount =
                Number(
                  slab.rateAmount ||
                    0,
                );

              const flatAmount =
                Number(
                  slab.flatAmount ||
                    0,
                );

              if (
                !Number.isFinite(
                  rateAmount,
                ) ||
                rateAmount < 0 ||
                !Number.isFinite(
                  flatAmount,
                ) ||
                flatAmount < 0
              ) {
                throw new BadRequestException(
                  `${componentLabel}: slab ${
                    slabIndex + 1
                  } contains an invalid amount`,
                );
              }

              if (
                percentageRate <= 0 &&
                rateAmount <= 0 &&
                flatAmount <= 0
              ) {
                throw new BadRequestException(
                  `${componentLabel}: slab ${
                    slabIndex + 1
                  } must contain a percentage, rate, or flat amount`,
                );
              }

              return {
                minimumValue,
                maximumValue,
              };
            },
          )
          .sort(
            (first, second) =>
              first.minimumValue -
              second.minimumValue,
          );

      for (
        let slabIndex = 1;
        slabIndex <
        normalizedSlabs.length;
        slabIndex += 1
      ) {
        const previous =
          normalizedSlabs[
            slabIndex - 1
          ];

        const current =
          normalizedSlabs[
            slabIndex
          ];

        if (
          previous.maximumValue ===
          null
        ) {
          throw new BadRequestException(
            `${componentLabel}: an open-ended slab must be the final slab`,
          );
        }

        if (
          current.minimumValue <=
          previous.maximumValue
        ) {
          throw new BadRequestException(
            `${componentLabel}: slab ranges cannot overlap`,
          );
        }
      }

      if (
        component
          .slabCalculationMode ===
          'SEQUENTIAL_PROJECT_MARGIN'
      ) {
        if (
          !component
            .slabSelectorMetricType
        ) {
          throw new BadRequestException(
            `${componentLabel}: slab selector metric is required for sequential project-margin calculation`,
          );
        }
      }
    }

    if (
      component.calculationType ===
        StaffPayrollIncentiveCalculationType
          .POOL_SHARE
    ) {
      if (
        !component
          .poolCompanyMetricType
      ) {
        throw new BadRequestException(
          `${componentLabel}: company pool metric is required`,
        );
      }

      if (
        !component
          .poolDivisorMode
      ) {
        throw new BadRequestException(
          `${componentLabel}: pool divisor mode is required`,
        );
      }

      if (
        component.poolDivisorMode ===
          'FIXED_DIVISOR' &&
        Number(
          component.fixedPoolDivisor ||
            0,
        ) <= 0
      ) {
        throw new BadRequestException(
          `${componentLabel}: fixed pool divisor must be greater than zero`,
        );
      }
    }
  }

  const effectiveFrom =
    body.effectiveFrom
      ? String(
          body.effectiveFrom,
        )
      : null;

  const effectiveTo =
    body.effectiveTo
      ? String(body.effectiveTo)
      : null;

  if (
    effectiveFrom &&
    effectiveTo &&
    effectiveTo < effectiveFrom
  ) {
    throw new BadRequestException(
      'Effective-to date cannot be earlier than effective-from date',
    );
  }

  return {
    ruleName,
    scope,
    applicableRole:
      applicableRole || null,
    staffId,
    salaryMode,
    targetCalculationMode,
    maximumSalaryPercentage,
    eligibilityConditions,
    incentiveComponents,
    effectiveFrom,
    effectiveTo,
  };
}

async listStaffPayrollRules(
  query: any,
) {
  const page = Math.max(
    Number(query.page || 1),
    1,
  );

  const limit = Math.min(
    Math.max(
      Number(query.limit || 20),
      1,
    ),
    100,
  );

  const showHidden =
    String(query.showHidden) ===
    'true';

  const qb =
    this.staffPayrollRuleRepo
      .createQueryBuilder('rule')
      .where(
        'rule.isHidden = :isHidden',
        {
          isHidden: showHidden,
        },
      );

  if (query.applicableRole) {
    qb.andWhere(
      `
      UPPER(
        TRIM(
          COALESCE(
            rule.applicableRole,
            ''
          )
        )
      ) = :applicableRole
      `,
      {
        applicableRole: String(
          query.applicableRole,
        )
          .trim()
          .toUpperCase(),
      },
    );
  }

  if (
    query.isActive !== undefined &&
    query.isActive !== ''
  ) {
    qb.andWhere(
      'rule.isActive = :isActive',
      {
        isActive:
          String(query.isActive) ===
          'true',
      },
    );
  }

  if (query.search) {
    qb.andWhere(
      `(
        rule.ruleName ILIKE :search
        OR COALESCE(
          rule.description,
          ''
        ) ILIKE :search
        OR COALESCE(
          rule.applicableRole,
          ''
        ) ILIKE :search
      )`,
      {
        search:
          `%${String(
            query.search,
          ).trim()}%`,
      },
    );
  }

  const [data, total] =
    await qb
      .orderBy(
        'rule.isActive',
        'DESC',
      )
      .addOrderBy(
        'rule.effectiveFrom',
        'DESC',
        'NULLS LAST',
      )
      .addOrderBy(
        'rule.updatedAt',
        'DESC',
      )
      .skip(
        (page - 1) * limit,
      )
      .take(limit)
      .getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages:
      Math.ceil(total / limit) ||
      1,
  };
}

async getStaffPayrollRule(
  id: number,
) {
  const rule =
    await this
      .staffPayrollRuleRepo
      .findOne({
        where: {
          id: Number(id),
        },
      });

  if (!rule) {
    throw new NotFoundException(
      'Payroll rule not found',
    );
  }

  return rule;
}

async createStaffPayrollRule(
  body: any,
  user: any,
) {
  const validated =
    this.validateStaffPayrollRulePayload(
      body,
    );

  const duplicateQuery =
    this.staffPayrollRuleRepo
      .createQueryBuilder('rule')
      .where(
        'rule.isHidden = false',
      )
      .andWhere(
        'rule.isActive = true',
      );

  if (
    validated.scope ===
    StaffPayrollRuleScope.ROLE
  ) {
    duplicateQuery
      .andWhere(
        'rule.scope = :scope',
        {
          scope:
            StaffPayrollRuleScope.ROLE,
        },
      )
      .andWhere(
        `
        UPPER(
          TRIM(
            COALESCE(
              rule.applicableRole,
              ''
            )
          )
        ) = :applicableRole
        `,
        {
          applicableRole:
            validated.applicableRole,
        },
      );
  } else {
    duplicateQuery
      .andWhere(
        'rule.scope = :scope',
        {
          scope:
            StaffPayrollRuleScope.STAFF,
        },
      )
      .andWhere(
        'rule.staffId = :staffId',
        {
          staffId:
            validated.staffId,
        },
      );
  }

  const activeRules =
    await duplicateQuery.getMany();

  const nextEffectiveFrom =
    validated.effectiveFrom;

  const nextEffectiveTo =
    validated.effectiveTo;

  const hasDateOverlap =
    activeRules.some(
      (existingRule) => {
        const existingFrom =
          existingRule.effectiveFrom ||
          null;

        const existingTo =
          existingRule.effectiveTo ||
          null;

        return (
          (
            nextEffectiveTo === null ||
            existingFrom === null ||
            existingFrom <=
              nextEffectiveTo
          ) &&
          (
            existingTo === null ||
            nextEffectiveFrom === null ||
            existingTo >=
              nextEffectiveFrom
          )
        );
      },
    );

  if (
    body.isActive !== false &&
    hasDateOverlap
  ) {
    throw new BadRequestException(
      validated.scope ===
        StaffPayrollRuleScope.ROLE
        ? `An active payroll rule already overlaps this date range for ${validated.applicableRole}`
        : 'An active payroll rule already overlaps this date range for the selected staff member',
    );
  }

  const rule =
    this.staffPayrollRuleRepo.create({
      ...body,

      ruleName:
        validated.ruleName,

      scope:
        validated.scope,

      applicableRole:
        validated.applicableRole,

      staffId:
        validated.staffId,

      staffName:
        String(
          body.staffName || '',
        ).trim() || null,

      effectiveFrom:
        validated.effectiveFrom,

      effectiveTo:
        validated.effectiveTo,

      salaryMode:
        validated.salaryMode,

      salaryMetricType:
        body.salaryMetricType ||
        null,

      salaryCustomMetricName:
        String(
          body.salaryCustomMetricName ||
            '',
        ).trim() || null,

      salaryTargetValue:
        Number(
          body.salaryTargetValue ||
            0,
        ),

      targetCalculationMode:
        validated.targetCalculationMode,

      targetMultiplierMetricType:
        body.targetMultiplierMetricType ||
        null,

      teamMemberTargetValue:
        Number(
          body.teamMemberTargetValue ||
            0,
        ),

      maximumSalaryPercentage:
        validated
          .maximumSalaryPercentage,

      attendanceTargetHours:
        Number(
          body.attendanceTargetHours ||
            0,
        ),

      attendanceTargetDays:
        Number(
          body.attendanceTargetDays ||
            0,
        ),

      attendanceTargetPercentage:
        Number(
          body
            .attendanceTargetPercentage ||
            0,
        ),

      eligibilityConditions:
        validated
          .eligibilityConditions,

      incentiveComponents:
        validated
          .incentiveComponents,

      requireAllEligibilityConditions:
        body
          .requireAllEligibilityConditions !==
        false,

      allowProportionalSalaryOnEligibilityFailure:
        body
          .allowProportionalSalaryOnEligibilityFailure ===
        true,

      maximumSalaryAmount:
        body.maximumSalaryAmount ===
          null ||
        body.maximumSalaryAmount ===
          undefined ||
        body.maximumSalaryAmount ===
          ''
          ? null
          : Number(
              body.maximumSalaryAmount,
            ),

      maximumIncentiveAmount:
        body.maximumIncentiveAmount ===
          null ||
        body.maximumIncentiveAmount ===
          undefined ||
        body.maximumIncentiveAmount ===
          ''
          ? null
          : Number(
              body.maximumIncentiveAmount,
            ),

      additionalSettings:
        body.additionalSettings &&
        typeof body.additionalSettings ===
          'object'
          ? body.additionalSettings
          : {},

      version:
        Math.max(
          Number(body.version || 1),
          1,
        ),

      description:
        String(
          body.description || '',
        ).trim() || null,

      isActive:
        body.isActive !== false,

      isHidden: false,

      createdBy:
        user?.id || null,

      createdByName:
        user?.name || '',

      updatedBy:
        user?.id || null,

      updatedByName:
        user?.name || '',
    });

  return this.staffPayrollRuleRepo.save(
    rule,
  );
}

async updateStaffPayrollRule(
  id: number,
  body: any,
  user: any,
) {
  const rule =
    await this.staffPayrollRuleRepo
      .findOne({
        where: {
          id: Number(id),
        },
      });

  if (!rule) {
    throw new NotFoundException(
      'Payroll rule not found',
    );
  }

  const mergedPayload = {
    ...rule,
    ...body,

    eligibilityConditions:
      body.eligibilityConditions ===
      undefined
        ? rule.eligibilityConditions
        : body.eligibilityConditions,

    incentiveComponents:
      body.incentiveComponents ===
      undefined
        ? rule.incentiveComponents
        : body.incentiveComponents,
  };

  const validated =
    this.validateStaffPayrollRulePayload(
      mergedPayload,
    );

  const nextIsActive =
    body.isActive === undefined
      ? rule.isActive
      : Boolean(body.isActive);

  const duplicateQuery =
    this.staffPayrollRuleRepo
      .createQueryBuilder('otherRule')
      .where(
        'otherRule.id != :ruleId',
        {
          ruleId: rule.id,
        },
      )
      .andWhere(
        'otherRule.isHidden = false',
      )
      .andWhere(
        'otherRule.isActive = true',
      );

  if (
    validated.scope ===
    StaffPayrollRuleScope.ROLE
  ) {
    duplicateQuery
      .andWhere(
        'otherRule.scope = :scope',
        {
          scope:
            StaffPayrollRuleScope.ROLE,
        },
      )
      .andWhere(
        `
        UPPER(
          TRIM(
            COALESCE(
              otherRule.applicableRole,
              ''
            )
          )
        ) = :applicableRole
        `,
        {
          applicableRole:
            validated.applicableRole,
        },
      );
  } else {
    duplicateQuery
      .andWhere(
        'otherRule.scope = :scope',
        {
          scope:
            StaffPayrollRuleScope.STAFF,
        },
      )
      .andWhere(
        'otherRule.staffId = :staffId',
        {
          staffId:
            validated.staffId,
        },
      );
  }

  const activeRules =
    await duplicateQuery.getMany();

  const hasDateOverlap =
    activeRules.some(
      (existingRule) => {
        const existingFrom =
          existingRule.effectiveFrom ||
          null;

        const existingTo =
          existingRule.effectiveTo ||
          null;

        return (
          (
            validated.effectiveTo ===
              null ||
            existingFrom === null ||
            existingFrom <=
              validated.effectiveTo
          ) &&
          (
            existingTo === null ||
            validated.effectiveFrom ===
              null ||
            existingTo >=
              validated.effectiveFrom
          )
        );
      },
    );

  if (
    nextIsActive &&
    hasDateOverlap
  ) {
    throw new BadRequestException(
      validated.scope ===
        StaffPayrollRuleScope.ROLE
        ? `Another active payroll rule overlaps this date range for ${validated.applicableRole}`
        : 'Another active payroll rule overlaps this date range for the selected staff member',
    );
  }

  Object.assign(rule, {
    ruleName:
      validated.ruleName,

    description:
      String(
        mergedPayload.description ||
          '',
      ).trim() || null,

    scope:
      validated.scope,

    applicableRole:
      validated.applicableRole,

    staffId:
      validated.staffId,

    staffName:
      String(
        mergedPayload.staffName ||
          '',
      ).trim() || null,

    effectiveFrom:
      validated.effectiveFrom,

    effectiveTo:
      validated.effectiveTo,

    salaryMode:
      validated.salaryMode,

    salaryMetricType:
      mergedPayload
        .salaryMetricType ||
      null,

    salaryCustomMetricName:
      String(
        mergedPayload
          .salaryCustomMetricName ||
          '',
      ).trim() || null,

    salaryTargetValue:
      Number(
        mergedPayload
          .salaryTargetValue ||
          0,
      ),

    targetCalculationMode:
      validated
        .targetCalculationMode,

    targetMultiplierMetricType:
      mergedPayload
        .targetMultiplierMetricType ||
      null,

    teamMemberTargetValue:
      Number(
        mergedPayload
          .teamMemberTargetValue ||
          0,
      ),

    maximumSalaryPercentage:
      validated
        .maximumSalaryPercentage,

    attendanceTargetHours:
      Number(
        mergedPayload
          .attendanceTargetHours ||
          0,
      ),

    attendanceTargetDays:
      Number(
        mergedPayload
          .attendanceTargetDays ||
          0,
      ),

    attendanceTargetPercentage:
      Number(
        mergedPayload
          .attendanceTargetPercentage ||
          0,
      ),

    eligibilityConditions:
      validated
        .eligibilityConditions,

    incentiveComponents:
      validated
        .incentiveComponents,

    requireAllEligibilityConditions:
      mergedPayload
        .requireAllEligibilityConditions !==
      false,

    allowProportionalSalaryOnEligibilityFailure:
      mergedPayload
        .allowProportionalSalaryOnEligibilityFailure ===
      true,

    maximumSalaryAmount:
      mergedPayload
          .maximumSalaryAmount ===
        null ||
      mergedPayload
          .maximumSalaryAmount ===
        undefined ||
      mergedPayload
          .maximumSalaryAmount ===
        ''
        ? null
        : Number(
            mergedPayload
              .maximumSalaryAmount,
          ),

    maximumIncentiveAmount:
      mergedPayload
          .maximumIncentiveAmount ===
        null ||
      mergedPayload
          .maximumIncentiveAmount ===
        undefined ||
      mergedPayload
          .maximumIncentiveAmount ===
        ''
        ? null
        : Number(
            mergedPayload
              .maximumIncentiveAmount,
          ),

    additionalSettings:
      mergedPayload
        .additionalSettings &&
      typeof mergedPayload
        .additionalSettings ===
        'object'
        ? mergedPayload
            .additionalSettings
        : {},

    version:
      Number(rule.version || 1) +
      1,

    isActive:
      nextIsActive,

    updatedBy:
      user?.id || null,

    updatedByName:
      user?.name || '',
  });

  return this.staffPayrollRuleRepo.save(
    rule,
  );
}

async hideStaffPayrollRule(
  id: number,
  body: any,
  user: any,
) {
  const rule =
    await this.staffPayrollRuleRepo.findOne({
      where: {
        id: Number(id),
      },
    });

  if (!rule) {
    throw new NotFoundException(
      'Payroll rule not found',
    );
  }

  rule.isHidden = true;
  rule.isActive = false;

  rule.hiddenAt = new Date();
  rule.hiddenBy =
    user?.id || null;
  rule.hiddenByName =
    user?.name || '';
  rule.hiddenReason =
    String(
      body?.reason || '',
    ).trim();

  return this.staffPayrollRuleRepo.save(
    rule,
  );
}

async restoreStaffPayrollRule(
  id: number,
  body: any,
  user: any,
) {
  const rule =
    await this.staffPayrollRuleRepo.findOne({
      where: {
        id: Number(id),
      },
    });

  if (!rule) {
    throw new NotFoundException(
      'Payroll rule not found',
    );
  }

  const restoredPayload = {
    ...rule,
    isHidden: false,
    isActive:
      body?.isActive === undefined
        ? true
        : Boolean(body.isActive),
  };

  const validated =
    this.validateStaffPayrollRulePayload(
      restoredPayload,
    );

  if (
    restoredPayload.isActive === true
  ) {
    const duplicateQuery =
      this.staffPayrollRuleRepo
        .createQueryBuilder(
          'otherRule',
        )
        .where(
          'otherRule.id != :ruleId',
          {
            ruleId: rule.id,
          },
        )
        .andWhere(
          'otherRule.isHidden = false',
        )
        .andWhere(
          'otherRule.isActive = true',
        );

    if (
      validated.scope ===
      StaffPayrollRuleScope.ROLE
    ) {
      duplicateQuery
        .andWhere(
          'otherRule.scope = :scope',
          {
            scope:
              StaffPayrollRuleScope.ROLE,
          },
        )
        .andWhere(
          `
          UPPER(
            TRIM(
              COALESCE(
                otherRule.applicableRole,
                ''
              )
            )
          ) = :applicableRole
          `,
          {
            applicableRole:
              validated.applicableRole,
          },
        );
    } else {
      duplicateQuery
        .andWhere(
          'otherRule.scope = :scope',
          {
            scope:
              StaffPayrollRuleScope.STAFF,
          },
        )
        .andWhere(
          'otherRule.staffId = :staffId',
          {
            staffId:
              validated.staffId,
          },
        );
    }

    const activeRules =
      await duplicateQuery.getMany();

    const hasDateOverlap =
      activeRules.some(
        (existingRule) => {
          const existingFrom =
            existingRule
              .effectiveFrom ||
            null;

          const existingTo =
            existingRule
              .effectiveTo ||
            null;

          return (
            (
              validated.effectiveTo ===
                null ||
              existingFrom === null ||
              existingFrom <=
                validated.effectiveTo
            ) &&
            (
              existingTo === null ||
              validated.effectiveFrom ===
                null ||
              existingTo >=
                validated.effectiveFrom
            )
          );
        },
      );

    if (hasDateOverlap) {
      throw new BadRequestException(
        validated.scope ===
          StaffPayrollRuleScope.ROLE
          ? `Another active payroll rule overlaps this date range for ${validated.applicableRole}`
          : 'Another active payroll rule overlaps this date range for the selected staff member',
      );
    }
  }

  rule.isHidden = false;
  rule.isActive =
    restoredPayload.isActive;

  rule.restoredAt =
    new Date();
  rule.restoredBy =
    user?.id || null;
  rule.restoredByName =
    user?.name || '';
  rule.restoreReason =
    String(
      body?.reason || '',
    ).trim();

  return this.staffPayrollRuleRepo.save(
    rule,
  );
}

private async calculateStaffPayrollByRole(
  staff: StaffMember,
  payrollMonth: string,
  basicSalary: number,
) {
  const linkedUserId = Number(
    staff.linkedUserId || 0,
  );

  /*
   * Supporting staff use their own payroll rule,
   * regardless of the CRM role stored against them.
   */
  if (staff.isSupportingStaff === true) {
    return this.payrollCalculator
      .calculateSupportingStaffPayroll(
        payrollMonth,
        linkedUserId,
        basicSalary,
      );
  }

  const normalizedRole = String(
    staff.staffRole || '',
  )
    .trim()
    .toUpperCase();

  switch (normalizedRole) {
    case 'MEETING_MANAGER':
      return this.payrollCalculator
        .calculateMeetingManagerPayroll(
          payrollMonth,
          linkedUserId,
          basicSalary,
        );

    case 'LEAD_MANAGER':
      return this.payrollCalculator
        .calculateLeadManagerPayroll(
          payrollMonth,
          linkedUserId,
          basicSalary,
        );

        case 'TELECALLING_MANAGER':
  return this.payrollCalculator
    .calculateTelecallingManagerPayroll(
      payrollMonth,
      linkedUserId,
      basicSalary,
    );

    case 'TELECALLER':
      return this.payrollCalculator
        .calculateTelecallerPayroll(
          payrollMonth,
          linkedUserId,
          basicSalary,
        );

    case 'MEETING_ASSISTANT':
      return this.payrollCalculator
        .calculateMeetingAssistantPayroll(
          payrollMonth,
          linkedUserId,
          basicSalary,
        );

    case 'TRADING_MANAGER':
      return this.payrollCalculator
        .calculateTradingManagerPayroll(
          payrollMonth,
          linkedUserId,
          basicSalary,
        );

    case 'TRADING_HEAD':
      return this.payrollCalculator
        .calculateTradingHeadPayroll(
          payrollMonth,
          linkedUserId,
          basicSalary,
        );

    case 'HR_MANAGER':
      return this.payrollCalculator
        .calculateHrPayroll(
          payrollMonth,
          linkedUserId,
          basicSalary,
        );

    case 'SOLAR_FRANCHISE':
      return this.payrollCalculator
        .calculateSolarFranchisePayroll(
          payrollMonth,
          linkedUserId,
          basicSalary,
        );

    default:
      throw new BadRequestException(
        `Payroll calculation is not configured for staff role: ${
          normalizedRole || 'UNASSIGNED'
        }`,
      );
  }
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
  const payrollCalculation =
  await this.calculateStaffPayrollByRole(
    staff,
    body.payrollMonth,
    basicSalary,
  );
  const calculation: any = payrollCalculation;

  const eligibilityMet = Boolean(
  calculation?.eligibility?.met ??
    calculation?.eligibility?.eligible ??
    calculation?.eligibility?.isEligible ??
    false,
);

const eligibilityReason = String(
  calculation?.eligibility?.reason || '',
);

const salaryPercentage = Number(
  calculation?.salary?.salaryPercentage ??
    calculation?.salary?.percentage ??
    0,
);

const actualMetrics =
  calculation?.actualMetrics || {};

const calculatedSalaryAmount = Number(
  calculation?.salary?.salaryAmount ??
    calculation?.salary?.amount ??
    0,
);

const incentiveAmount = Number(
  calculation?.incentives?.totalAmount ??
    calculation?.incentives?.amount ??
    0,
);

const monthDays =
  this.calculateMonthDays(body.payrollMonth);

const perDaySalary =
  monthDays > 0
    ? calculatedSalaryAmount / monthDays
    : 0;

const presentDays = Number(
  body.presentDays || 0,
);

const halfDays = Number(
  body.halfDays || 0,
);

const absentDays = Number(
  body.absentDays || 0,
);

const leaveDays = Number(
  body.leaveDays || 0,
);

const attendanceDeduction =
  absentDays * perDaySalary +
  halfDays * (perDaySalary / 2);

const leaveDeduction = Number(
  body.leaveDeduction || 0,
);

const penaltyAmount = Number(
  body.penaltyAmount || 0,
);

const otherAllowance = Number(
  body.otherAllowance || 0,
);

const otherDeduction = Number(
  body.otherDeduction || 0,
);

const grossSalary =
  calculatedSalaryAmount +
  incentiveAmount +
  otherAllowance;

const netSalary =
  grossSalary -
  attendanceDeduction -
  leaveDeduction -
  penaltyAmount -
  otherDeduction;

  const payroll = this.payrollRepo.create({
    staffId: staff.id,
linkedUserId: staff.linkedUserId || undefined,
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

eligibilityMet,
eligibilityReason,
salaryPercentage,

actualLeads: Number(
  actualMetrics.actualLeads ??
    actualMetrics.leads ??
    0,
),

actualMeetings: Number(
  actualMetrics.actualMeetings ??
    actualMetrics.meetings ??
    0,
),

actualGpsMeetings: Number(
  actualMetrics.actualGpsMeetings ??
    actualMetrics.gpsMeetings ??
    0,
),

actualScheduledMeetings: Number(
  actualMetrics.actualScheduledMeetings ??
    actualMetrics.scheduledMeetings ??
    0,
),

actualOrders: Number(
  actualMetrics.actualOrders ??
    actualMetrics.orders ??
    0,
),

actualSales: Number(
  actualMetrics.actualSales ??
    actualMetrics.sales ??
    0,
),

actualNetProfit: Number(
  actualMetrics.actualNetProfit ??
    actualMetrics.netProfit ??
    0,
),

actualJoinings: Number(
  actualMetrics.actualJoinings ??
    actualMetrics.joinings ??
    0,
),

actualWorkingHours: Number(
  actualMetrics.actualWorkingHours ??
    actualMetrics.workingHours ??
    body.workingHours ??
    0,
),

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

calculationSnapshot:
  payrollCalculation.calculationSnapshot || null,

ruleSnapshot:
  payrollCalculation.ruleSnapshot || null,

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

  const previousStage =
  item.stage;

const nextStage =
  body.stage ??
  item.stage;

const nextJoiningDate =
  body.joiningDate ??
  item.joiningDate;

const isNewlyMarkedJoined =
  previousStage !==
    RecruitmentStage.JOINED &&
  nextStage ===
    RecruitmentStage.JOINED;

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

  /*
 * Capture permanent HR payroll credit only
 * when the candidate first becomes JOINED.
 *
 * Later edits must not overwrite this credit.
 */
if (isNewlyMarkedJoined) {
  if (!nextJoiningDate) {
    throw new BadRequestException(
      'Joining date is required when marking candidate as joined',
    );
  }

  item.joinedBy =
    user?.id || null;

  item.joinedByName =
    user?.name || '';

  item.joinedAt =
    new Date();
}

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

async createAttendanceLocation(body: any, user: any) {
  const name = String(body.name || '').trim();

  if (!name) {
    throw new BadRequestException('Location name is required');
  }

  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const allowedRadiusMeters = Number(
    body.allowedRadiusMeters || 150,
  );

  if (!Number.isFinite(latitude)) {
    throw new BadRequestException(
      'Valid latitude is required',
    );
  }

  if (!Number.isFinite(longitude)) {
    throw new BadRequestException(
      'Valid longitude is required',
    );
  }

  if (latitude < -90 || latitude > 90) {
    throw new BadRequestException(
      'Latitude must be between -90 and 90',
    );
  }

  if (longitude < -180 || longitude > 180) {
    throw new BadRequestException(
      'Longitude must be between -180 and 180',
    );
  }

  if (
    !Number.isFinite(allowedRadiusMeters) ||
    allowedRadiusMeters < 10 ||
    allowedRadiusMeters > 10000
  ) {
    throw new BadRequestException(
      'Allowed radius must be between 10 and 10000 metres',
    );
  }

  const duplicate =
    await this.attendanceLocationRepo.findOne({
      where: {
        name,
        isHidden: false,
      },
    });

  if (duplicate) {
    throw new BadRequestException(
      'An active attendance location with this name already exists',
    );
  }

  const location =
    this.attendanceLocationRepo.create({
      name,
      address: String(body.address || '').trim(),
      latitude,
      longitude,
      allowedRadiusMeters: Math.round(
        allowedRadiusMeters,
      ),
      branchName: String(
        body.branchName || '',
      ).trim(),
      isActive:
        body.isActive === undefined
          ? true
          : Boolean(body.isActive),
      isHidden: false,
      createdBy: user?.id || null,
      createdByName: user?.name || '',
    });

  return this.attendanceLocationRepo.save(location);
}

async listAttendanceLocations(query: any) {
  const page = Math.max(
    Number(query.page || 1),
    1,
  );

  const limit = Math.min(
    Math.max(Number(query.limit || 20), 1),
    100,
  );

  const qb =
    this.attendanceLocationRepo
      .createQueryBuilder('location');

  if (String(query.showHidden) === 'true') {
    qb.andWhere('location.isHidden = :isHidden', {
      isHidden: true,
    });
  } else {
    qb.andWhere('location.isHidden = :isHidden', {
      isHidden: false,
    });
  }

  if (
    query.isActive !== undefined &&
    query.isActive !== ''
  ) {
    qb.andWhere('location.isActive = :isActive', {
      isActive:
        String(query.isActive) === 'true',
    });
  }

  if (query.branchName) {
    qb.andWhere(
      'LOWER(location.branchName) = LOWER(:branchName)',
      {
        branchName: String(
          query.branchName,
        ).trim(),
      },
    );
  }

  if (query.search) {
    qb.andWhere(
      `(
        LOWER(location.name) LIKE LOWER(:search)
        OR LOWER(COALESCE(location.address, '')) LIKE LOWER(:search)
        OR LOWER(COALESCE(location.branchName, '')) LIKE LOWER(:search)
      )`,
      {
        search: `%${String(query.search).trim()}%`,
      },
    );
  }

  qb.orderBy('location.isActive', 'DESC')
    .addOrderBy('location.name', 'ASC')
    .skip((page - 1) * limit)
    .take(limit);

  const [data, total] =
    await qb.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages:
      Math.ceil(total / limit) || 1,
  };
}

async getAttendanceLocation(id: number) {
  const location =
    await this.attendanceLocationRepo.findOne({
      where: {
        id: Number(id),
      },
    });

  if (!location) {
    throw new NotFoundException(
      'Attendance location not found',
    );
  }

  return location;
}

async updateAttendanceLocation(
  id: number,
  body: any,
) {
  const location =
    await this.getAttendanceLocation(id);

  if (body.name !== undefined) {
    const name = String(body.name || '').trim();

    if (!name) {
      throw new BadRequestException(
        'Location name is required',
      );
    }

    const duplicate =
      await this.attendanceLocationRepo
        .createQueryBuilder('location')
        .where(
          'LOWER(location.name) = LOWER(:name)',
          {
            name,
          },
        )
        .andWhere(
          'location.id != :locationId',
          {
            locationId: location.id,
          },
        )
        .andWhere(
          'location.isHidden = :isHidden',
          {
            isHidden: false,
          },
        )
        .getOne();

    if (duplicate) {
      throw new BadRequestException(
        'Another active attendance location with this name already exists',
      );
    }

    location.name = name;
  }

  if (body.latitude !== undefined) {
    const latitude = Number(body.latitude);

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      throw new BadRequestException(
        'Latitude must be between -90 and 90',
      );
    }

    location.latitude = latitude;
  }

  if (body.longitude !== undefined) {
    const longitude = Number(
      body.longitude,
    );

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new BadRequestException(
        'Longitude must be between -180 and 180',
      );
    }

    location.longitude = longitude;
  }

  if (
    body.allowedRadiusMeters !== undefined
  ) {
    const allowedRadiusMeters = Number(
      body.allowedRadiusMeters,
    );

    if (
      !Number.isFinite(
        allowedRadiusMeters,
      ) ||
      allowedRadiusMeters < 10 ||
      allowedRadiusMeters > 10000
    ) {
      throw new BadRequestException(
        'Allowed radius must be between 10 and 10000 metres',
      );
    }

    location.allowedRadiusMeters =
      Math.round(allowedRadiusMeters);
  }

  if (body.address !== undefined) {
    location.address = String(
      body.address || '',
    ).trim();
  }

  if (body.branchName !== undefined) {
    location.branchName = String(
      body.branchName || '',
    ).trim();
  }

  if (body.isActive !== undefined) {
    location.isActive = Boolean(
      body.isActive,
    );
  }

  return this.attendanceLocationRepo.save(
    location,
  );
}

async hideAttendanceLocation(
  id: number,
) {
  const location =
    await this.getAttendanceLocation(id);

  location.isHidden = true;
  location.isActive = false;

  await this.attendanceLocationRepo.save(
    location,
  );

  return {
    message:
      'Attendance location hidden successfully',
  };
}

async restoreAttendanceLocation(
  id: number,
) {
  const location =
    await this.getAttendanceLocation(id);

  location.isHidden = false;
  location.isActive = true;

  await this.attendanceLocationRepo.save(
    location,
  );

  return {
    message:
      'Attendance location restored successfully',
  };
}

async getActiveAttendanceLocations() {
  return this.attendanceLocationRepo.find({
    where: {
      isActive: true,
      isHidden: false,
    },
    order: {
      name: 'ASC',
    },
  });
}

private parseAttendanceLocationRule(
  value: any,
): StaffAttendanceLocationRule {
  if (
    value ===
      StaffAttendanceLocationRule.ANYWHERE_ALLOWED ||
    value ===
      StaffAttendanceLocationRule.OFFICE_LOCATION_REQUIRED
  ) {
    return value;
  }

  throw new BadRequestException(
    'Attendance rule must be ANYWHERE_ALLOWED or OFFICE_LOCATION_REQUIRED',
  );
}

private async validateAttendancePolicyLocation(
  rule: StaffAttendanceLocationRule,
  locationId: any,
  punchLabel: string,
) {
  if (
    rule ===
    StaffAttendanceLocationRule.ANYWHERE_ALLOWED
  ) {
    return null;
  }

  const numericLocationId = Number(locationId);

  if (
    !Number.isInteger(numericLocationId) ||
    numericLocationId <= 0
  ) {
    throw new BadRequestException(
      `${punchLabel} location is required when office location is mandatory`,
    );
  }

  const location =
    await this.attendanceLocationRepo.findOne({
      where: {
        id: numericLocationId,
        isActive: true,
        isHidden: false,
      },
    });

  if (!location) {
    throw new BadRequestException(
      `${punchLabel} attendance location is invalid or inactive`,
    );
  }

  return location;
}

private parseAttendanceOverrideDate(
  value: any,
): string {
  const attendanceDate = String(
    value || '',
  ).trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      attendanceDate,
    )
  ) {
    throw new BadRequestException(
      'Attendance date must be in YYYY-MM-DD format',
    );
  }

  const parsedDate = new Date(
    `${attendanceDate}T00:00:00.000Z`,
  );

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate
      .toISOString()
      .slice(0, 10) !== attendanceDate
  ) {
    throw new BadRequestException(
      'Invalid attendance date',
    );
  }

  return attendanceDate;
}

private parseOptionalAttendanceLocationRule(
  value: any,
): StaffAttendanceLocationRule | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  return this.parseAttendanceLocationRule(
    value,
  );
}

async saveStaffAttendanceOverride(
  body: any,
  user: any,
) {
  const staffId = Number(body.staffId);

  if (
    !Number.isInteger(staffId) ||
    staffId <= 0
  ) {
    throw new BadRequestException(
      'Valid staff is required',
    );
  }

  const attendanceDate =
    this.parseAttendanceOverrideDate(
      body.attendanceDate,
    );

  const staff = await this.staffRepo.findOne({
    where: {
      id: staffId,
      isHidden: false,
    },
  });

  if (!staff) {
    throw new NotFoundException(
      'Staff not found',
    );
  }

  const punchInRule =
    this.parseOptionalAttendanceLocationRule(
      body.punchInRule,
    );

  const punchOutRule =
    this.parseOptionalAttendanceLocationRule(
      body.punchOutRule,
    );

  if (
    punchInRule === null &&
    punchOutRule === null
  ) {
    throw new BadRequestException(
      'At least one punch rule must be selected for the override',
    );
  }

  const punchInLocation =
    punchInRule === null
      ? null
      : await this.validateAttendancePolicyLocation(
          punchInRule,
          body.punchInLocationId,
          'Punch in',
        );

  const punchOutLocation =
    punchOutRule === null
      ? null
      : await this.validateAttendancePolicyLocation(
          punchOutRule,
          body.punchOutLocationId,
          'Punch out',
        );

  let override =
    await this.attendanceOverrideRepo.findOne({
      where: {
        staffId: staff.id,
        attendanceDate,
      },
    });

  if (!override) {
    override =
      this.attendanceOverrideRepo.create({
        staffId: staff.id,
        staffName: staff.fullName || '',
        attendanceDate,
        createdBy: user?.id || null,
        createdByName: user?.name || '',
      });
  }

  override.staffName =
    staff.fullName || '';

  override.punchInRule =
    punchInRule;

  override.punchInLocationId =
    punchInLocation?.id || null;

  override.punchOutRule =
    punchOutRule;

  override.punchOutLocationId =
    punchOutLocation?.id || null;

  override.reason = String(
    body.reason || '',
  ).trim();

  override.isActive =
    body.isActive === undefined
      ? true
      : Boolean(body.isActive);

  override.updatedBy =
    user?.id || null;

  override.updatedByName =
    user?.name || '';

  return this.attendanceOverrideRepo.save(
    override,
  );
}

async listStaffAttendanceOverrides(
  query: any,
) {
  const page = Math.max(
    Number(query.page || 1),
    1,
  );

  const limit = Math.min(
    Math.max(Number(query.limit || 20), 1),
    100,
  );

  const qb =
    this.attendanceOverrideRepo
      .createQueryBuilder('override');

  if (query.staffId) {
    qb.andWhere(
      'override.staffId = :staffId',
      {
        staffId: Number(query.staffId),
      },
    );
  }

  if (query.attendanceDate) {
    qb.andWhere(
      'override.attendanceDate = :attendanceDate',
      {
        attendanceDate:
          this.parseAttendanceOverrideDate(
            query.attendanceDate,
          ),
      },
    );
  }

  if (query.dateFrom) {
    qb.andWhere(
      'override.attendanceDate >= :dateFrom',
      {
        dateFrom:
          this.parseAttendanceOverrideDate(
            query.dateFrom,
          ),
      },
    );
  }

  if (query.dateTo) {
    qb.andWhere(
      'override.attendanceDate <= :dateTo',
      {
        dateTo:
          this.parseAttendanceOverrideDate(
            query.dateTo,
          ),
      },
    );
  }

  if (
    query.isActive !== undefined &&
    query.isActive !== ''
  ) {
    qb.andWhere(
      'override.isActive = :isActive',
      {
        isActive:
          String(query.isActive) === 'true',
      },
    );
  }

  if (query.search) {
    qb.andWhere(
      `(
        LOWER(COALESCE(override.staffName, ''))
        LIKE LOWER(:search)
        OR LOWER(COALESCE(override.reason, ''))
        LIKE LOWER(:search)
      )`,
      {
        search: `%${String(
          query.search,
        ).trim()}%`,
      },
    );
  }

  qb.orderBy(
    'override.attendanceDate',
    'DESC',
  )
    .addOrderBy(
      'override.staffName',
      'ASC',
    )
    .skip((page - 1) * limit)
    .take(limit);

  const [data, total] =
    await qb.getManyAndCount();

  const locationIds = Array.from(
    new Set(
      data
        .flatMap((item) => [
          item.punchInLocationId,
          item.punchOutLocationId,
        ])
        .filter(
          (value): value is number =>
            Number(value) > 0,
        ),
    ),
  );

  const locations =
    locationIds.length > 0
      ? await this.attendanceLocationRepo
          .createQueryBuilder('location')
          .where(
            'location.id IN (:...locationIds)',
            {
              locationIds,
            },
          )
          .getMany()
      : [];

  const locationMap = new Map(
    locations.map((location) => [
      Number(location.id),
      location,
    ]),
  );

  return {
    data: data.map((override) => ({
      ...override,
      punchInLocation:
        override.punchInLocationId
          ? locationMap.get(
              Number(
                override.punchInLocationId,
              ),
            ) || null
          : null,
      punchOutLocation:
        override.punchOutLocationId
          ? locationMap.get(
              Number(
                override.punchOutLocationId,
              ),
            ) || null
          : null,
    })),
    total,
    page,
    limit,
    totalPages:
      Math.ceil(total / limit) || 1,
  };
}

async getStaffAttendanceOverride(
  id: number,
) {
  const override =
    await this.attendanceOverrideRepo.findOne({
      where: {
        id: Number(id),
      },
    });

  if (!override) {
    throw new NotFoundException(
      'Attendance override not found',
    );
  }

  const punchInLocation =
    override.punchInLocationId
      ? await this.attendanceLocationRepo.findOne({
          where: {
            id: Number(
              override.punchInLocationId,
            ),
          },
        })
      : null;

  const punchOutLocation =
    override.punchOutLocationId
      ? await this.attendanceLocationRepo.findOne({
          where: {
            id: Number(
              override.punchOutLocationId,
            ),
          },
        })
      : null;

  return {
    ...override,
    punchInLocation,
    punchOutLocation,
  };
}

async setStaffAttendanceOverrideActive(
  id: number,
  isActive: boolean,
  user: any,
) {
  const override =
    await this.attendanceOverrideRepo.findOne({
      where: {
        id: Number(id),
      },
    });

  if (!override) {
    throw new NotFoundException(
      'Attendance override not found',
    );
  }

  override.isActive =
    Boolean(isActive);

  override.updatedBy =
    user?.id || null;

  override.updatedByName =
    user?.name || '';

  return this.attendanceOverrideRepo.save(
    override,
  );
}

async saveStaffAttendancePolicy(
  body: any,
  user: any,
) {
  const staffId = Number(body.staffId);

  if (
    !Number.isInteger(staffId) ||
    staffId <= 0
  ) {
    throw new BadRequestException(
      'Valid staff is required',
    );
  }

  const staff = await this.staffRepo.findOne({
    where: {
      id: staffId,
      isHidden: false,
    },
  });

  if (!staff) {
    throw new NotFoundException(
      'Staff not found',
    );
  }

  const punchInRule =
    this.parseAttendanceLocationRule(
      body.punchInRule,
    );

  const punchOutRule =
    this.parseAttendanceLocationRule(
      body.punchOutRule,
    );

  const punchInLocation =
    await this.validateAttendancePolicyLocation(
      punchInRule,
      body.punchInLocationId,
      'Punch in',
    );

  const punchOutLocation =
    await this.validateAttendancePolicyLocation(
      punchOutRule,
      body.punchOutLocationId,
      'Punch out',
    );

  let policy =
    await this.attendancePolicyRepo.findOne({
      where: {
        staffId: staff.id,
      },
    });

  if (!policy) {
    policy = this.attendancePolicyRepo.create({
      staffId: staff.id,
      staffName: staff.fullName || '',
      createdBy: user?.id || null,
      createdByName: user?.name || '',
    });
  }

  policy.staffName = staff.fullName || '';

  policy.punchInRule = punchInRule;
  policy.punchInLocationId =
    punchInLocation?.id || null;

  policy.punchOutRule = punchOutRule;
  policy.punchOutLocationId =
    punchOutLocation?.id || null;

  policy.isActive =
    body.isActive === undefined
      ? true
      : Boolean(body.isActive);

  policy.updatedBy = user?.id || null;
  policy.updatedByName = user?.name || '';

  return this.attendancePolicyRepo.save(
    policy,
  );
}

async listStaffAttendancePolicies(
  query: any,
) {
  const page = Math.max(
    Number(query.page || 1),
    1,
  );

  const limit = Math.min(
    Math.max(Number(query.limit || 20), 1),
    100,
  );

  const qb =
    this.attendancePolicyRepo
      .createQueryBuilder('policy');

  if (
    query.isActive !== undefined &&
    query.isActive !== ''
  ) {
    qb.andWhere(
      'policy.isActive = :isActive',
      {
        isActive:
          String(query.isActive) === 'true',
      },
    );
  }

  if (query.staffId) {
    qb.andWhere(
      'policy.staffId = :staffId',
      {
        staffId: Number(query.staffId),
      },
    );
  }

  if (query.search) {
    qb.andWhere(
      `(
        LOWER(COALESCE(policy.staffName, ''))
        LIKE LOWER(:search)
      )`,
      {
        search: `%${String(
          query.search,
        ).trim()}%`,
      },
    );
  }

  qb.orderBy('policy.staffName', 'ASC')
    .skip((page - 1) * limit)
    .take(limit);

  const [data, total] =
    await qb.getManyAndCount();

  const locationIds = Array.from(
    new Set(
      data
        .flatMap((item) => [
          item.punchInLocationId,
          item.punchOutLocationId,
        ])
        .filter(
          (value): value is number =>
            Number(value) > 0,
        ),
    ),
  );

  const locations =
    locationIds.length > 0
      ? await this.attendanceLocationRepo
          .createQueryBuilder('location')
          .where(
            'location.id IN (:...locationIds)',
            {
              locationIds,
            },
          )
          .getMany()
      : [];

  const locationMap = new Map(
    locations.map((location) => [
      Number(location.id),
      location,
    ]),
  );

  return {
    data: data.map((policy) => ({
      ...policy,
      punchInLocation:
        policy.punchInLocationId
          ? locationMap.get(
              Number(
                policy.punchInLocationId,
              ),
            ) || null
          : null,
      punchOutLocation:
        policy.punchOutLocationId
          ? locationMap.get(
              Number(
                policy.punchOutLocationId,
              ),
            ) || null
          : null,
    })),
    total,
    page,
    limit,
    totalPages:
      Math.ceil(total / limit) || 1,
  };
}

async getStaffAttendancePolicy(
  staffId: number,
) {
  const staff = await this.staffRepo.findOne({
    where: {
      id: Number(staffId),
      isHidden: false,
    },
  });

  if (!staff) {
    throw new NotFoundException(
      'Staff not found',
    );
  }

  const policy =
    await this.attendancePolicyRepo.findOne({
      where: {
        staffId: staff.id,
      },
    });

  if (!policy) {
    return {
      staffId: staff.id,
      staffName: staff.fullName || '',
      punchInRule:
        StaffAttendanceLocationRule.ANYWHERE_ALLOWED,
      punchInLocationId: null,
      punchOutRule:
        StaffAttendanceLocationRule.ANYWHERE_ALLOWED,
      punchOutLocationId: null,
      isActive: true,
      isDefaultPolicy: true,
    };
  }

  const punchInLocation =
    policy.punchInLocationId
      ? await this.attendanceLocationRepo.findOne({
          where: {
            id: Number(
              policy.punchInLocationId,
            ),
          },
        })
      : null;

  const punchOutLocation =
    policy.punchOutLocationId
      ? await this.attendanceLocationRepo.findOne({
          where: {
            id: Number(
              policy.punchOutLocationId,
            ),
          },
        })
      : null;

  return {
    ...policy,
    punchInLocation,
    punchOutLocation,
    isDefaultPolicy: false,
  };
}

async setStaffAttendancePolicyActive(
  staffId: number,
  isActive: boolean,
  user: any,
) {
  const policy =
    await this.attendancePolicyRepo.findOne({
      where: {
        staffId: Number(staffId),
      },
    });

  if (!policy) {
    throw new NotFoundException(
      'Staff attendance policy not found',
    );
  }

  policy.isActive = Boolean(isActive);
  policy.updatedBy = user?.id || null;
  policy.updatedByName = user?.name || '';

  return this.attendancePolicyRepo.save(
    policy,
  );
}

private calculateDistanceMeters(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number {
  const earthRadiusMeters = 6371000;

  const toRadians = (value: number) =>
    (value * Math.PI) / 180;

  const latitudeDifference = toRadians(
    latitude2 - latitude1,
  );

  const longitudeDifference = toRadians(
    longitude2 - longitude1,
  );

  const firstLatitudeRadians =
    toRadians(latitude1);

  const secondLatitudeRadians =
    toRadians(latitude2);

  const haversineValue =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitudeRadians) *
      Math.cos(secondLatitudeRadians) *
      Math.sin(
        longitudeDifference / 2,
      ) **
        2;

  const angularDistance =
    2 *
    Math.atan2(
      Math.sqrt(haversineValue),
      Math.sqrt(1 - haversineValue),
    );

  return Math.round(
    earthRadiusMeters * angularDistance,
  );
}

private validateAttendanceCoordinates(
  latitudeValue: any,
  longitudeValue: any,
) {
  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new BadRequestException(
      'Valid current latitude is required',
    );
  }

  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new BadRequestException(
      'Valid current longitude is required',
    );
  }

  return {
    latitude,
    longitude,
  };
}

private async resolveEffectiveAttendanceRule(
  staffId: number,
  attendanceDate: string,
  punchType: 'PUNCH_IN' | 'PUNCH_OUT',
) {
  const activeOverride =
    await this.attendanceOverrideRepo.findOne({
      where: {
        staffId: Number(staffId),
        attendanceDate,
        isActive: true,
      },
    });

  const activePolicy =
    await this.attendancePolicyRepo.findOne({
      where: {
        staffId: Number(staffId),
        isActive: true,
      },
    });

  let rule =
    StaffAttendanceLocationRule.ANYWHERE_ALLOWED;

  let locationId: number | null = null;

  let source:
    | 'DEFAULT'
    | 'PERMANENT_POLICY'
    | 'DATE_OVERRIDE' = 'DEFAULT';

  if (punchType === 'PUNCH_IN') {
    if (activePolicy) {
      rule =
        activePolicy.punchInRule ||
        StaffAttendanceLocationRule.ANYWHERE_ALLOWED;

      locationId =
        activePolicy.punchInLocationId ||
        null;

      source = 'PERMANENT_POLICY';
    }

    if (
      activeOverride &&
      activeOverride.punchInRule !== null
    ) {
      rule = activeOverride.punchInRule;

      locationId =
        activeOverride.punchInLocationId ||
        null;

      source = 'DATE_OVERRIDE';
    }
  } else {
    if (activePolicy) {
      rule =
        activePolicy.punchOutRule ||
        StaffAttendanceLocationRule.ANYWHERE_ALLOWED;

      locationId =
        activePolicy.punchOutLocationId ||
        null;

      source = 'PERMANENT_POLICY';
    }

    if (
      activeOverride &&
      activeOverride.punchOutRule !== null
    ) {
      rule = activeOverride.punchOutRule;

      locationId =
        activeOverride.punchOutLocationId ||
        null;

      source = 'DATE_OVERRIDE';
    }
  }

  if (
    rule ===
    StaffAttendanceLocationRule.ANYWHERE_ALLOWED
  ) {
    return {
      rule,
      locationId: null,
      location: null,
      source,
      overrideReason:
        source === 'DATE_OVERRIDE'
          ? activeOverride?.reason || ''
          : '',
    };
  }

  if (!locationId) {
    throw new BadRequestException(
      `${punchType === 'PUNCH_IN' ? 'Punch in' : 'Punch out'} office location is not configured correctly`,
    );
  }

  const location =
    await this.attendanceLocationRepo.findOne({
      where: {
        id: Number(locationId),
        isActive: true,
        isHidden: false,
      },
    });

  if (!location) {
    throw new BadRequestException(
      `${punchType === 'PUNCH_IN' ? 'Punch in' : 'Punch out'} office location is inactive or unavailable`,
    );
  }

  return {
    rule,
    locationId: location.id,
    location,
    source,
    overrideReason:
      source === 'DATE_OVERRIDE'
        ? activeOverride?.reason || ''
        : '',
  };
}

private async evaluateAttendanceLocation(
  staffId: number,
  attendanceDate: string,
  punchType: 'PUNCH_IN' | 'PUNCH_OUT',
  latitudeValue: any,
  longitudeValue: any,
) {
  const {
    latitude,
    longitude,
  } = this.validateAttendanceCoordinates(
    latitudeValue,
    longitudeValue,
  );

  const effectiveRule =
    await this.resolveEffectiveAttendanceRule(
      staffId,
      attendanceDate,
      punchType,
    );

  if (
    effectiveRule.rule ===
    StaffAttendanceLocationRule.ANYWHERE_ALLOWED
  ) {
    return {
      allowed: true,
      latitude,
      longitude,
      rule: effectiveRule.rule,
      ruleSource: effectiveRule.source,
      location: null,
      distanceMeters: null,
      allowedRadiusMeters: null,
      overrideReason:
        effectiveRule.overrideReason,
    };
  }

  const location = effectiveRule.location;

  if (!location) {
    throw new BadRequestException(
      'Required attendance location could not be resolved',
    );
  }

  const distanceMeters =
    this.calculateDistanceMeters(
      latitude,
      longitude,
      Number(location.latitude),
      Number(location.longitude),
    );

  const allowedRadiusMeters = Number(
    location.allowedRadiusMeters,
  );

  return {
    allowed:
      distanceMeters <= allowedRadiusMeters,
    latitude,
    longitude,
    rule: effectiveRule.rule,
    ruleSource: effectiveRule.source,
    location,
    distanceMeters,
    allowedRadiusMeters,
    overrideReason:
      effectiveRule.overrideReason,
  };
}

private parseAttendanceExceptionPunchType(
  value: any,
): StaffAttendanceExceptionPunchType {
  if (
    value ===
      StaffAttendanceExceptionPunchType.PUNCH_IN ||
    value ===
      StaffAttendanceExceptionPunchType.PUNCH_OUT
  ) {
    return value;
  }

  throw new BadRequestException(
    'Punch type must be PUNCH_IN or PUNCH_OUT',
  );
}

private parseAttendanceExceptionAttemptedAt(
  value: any,
): Date {
  const attemptedAt = new Date(value);

  if (Number.isNaN(attemptedAt.getTime())) {
    throw new BadRequestException(
      'Valid attempted attendance time is required',
    );
  }

  const now = new Date();

  const differenceMilliseconds =
    now.getTime() - attemptedAt.getTime();

  const maximumAgeMilliseconds =
    15 * 60 * 1000;

  const maximumFutureDifferenceMilliseconds =
    60 * 1000;

  if (
    differenceMilliseconds >
    maximumAgeMilliseconds
  ) {
    throw new BadRequestException(
      'Attendance exception request must be submitted within 15 minutes of the failed punch attempt',
    );
  }

  if (
    differenceMilliseconds <
    -maximumFutureDifferenceMilliseconds
  ) {
    throw new BadRequestException(
      'Attempted attendance time cannot be in the future',
    );
  }

  return attemptedAt;
}

async createAttendanceExceptionRequest(
  body: any,
  user: any,
) {
  const linkedStaff =
    await this.getMyStaffProfile(user);

  const staff = await this.staffRepo.findOne({
    where: {
      id: Number(linkedStaff.id),
      isHidden: false,
    },
  });

  if (!staff) {
    throw new NotFoundException(
      'Staff not found',
    );
  }

  const attendanceDate =
    this.parseAttendanceOverrideDate(
      body.attendanceDate ||
        this.getTodayDate(),
    );

  const punchType =
    this.parseAttendanceExceptionPunchType(
      body.punchType,
    );

  const attemptedAt =
    this.parseAttendanceExceptionAttemptedAt(
      body.attemptedAt,
    );

  const employeeReason = String(
    body.employeeReason || '',
  ).trim();

  if (!employeeReason) {
    throw new BadRequestException(
      'Reason for attendance exception is required',
    );
  }

  if (employeeReason.length > 2000) {
    throw new BadRequestException(
      'Exception reason cannot exceed 2000 characters',
    );
  }

  const locationEvaluation =
    await this.evaluateAttendanceLocation(
      staff.id,
      attendanceDate,
      punchType,
      body.latitude,
      body.longitude,
    );

  if (
    locationEvaluation.rule ===
    StaffAttendanceLocationRule.ANYWHERE_ALLOWED
  ) {
    throw new BadRequestException(
      'An attendance exception is not required because attendance is allowed from any location',
    );
  }

  if (locationEvaluation.allowed) {
    throw new BadRequestException(
      'You are currently within the approved attendance radius. Please punch attendance normally',
    );
  }

  const attendance =
    await this.attendanceRepo.findOne({
      where: {
        staffId: staff.id,
        attendanceDate,
      },
    });

  if (
    punchType ===
    StaffAttendanceExceptionPunchType.PUNCH_IN
  ) {
    if (attendance?.punchInTime) {
      throw new BadRequestException(
        'Punch in attendance has already been recorded',
      );
    }
  }

  if (
    punchType ===
    StaffAttendanceExceptionPunchType.PUNCH_OUT
  ) {
    if (
      !attendance ||
      !attendance.punchInTime
    ) {
      throw new BadRequestException(
        'Punch in is required before requesting a punch out exception',
      );
    }

    if (attendance.punchOutTime) {
      throw new BadRequestException(
        'Punch out attendance has already been recorded',
      );
    }
  }

  const existingPendingRequest =
    await this.attendanceExceptionRepo.findOne({
      where: {
        staffId: staff.id,
        attendanceDate,
        punchType,
        status:
          StaffAttendanceExceptionStatus.PENDING,
      },
    });

  if (existingPendingRequest) {
    throw new BadRequestException(
      'A pending exception request already exists for this attendance punch',
    );
  }

  const exceptionRequest =
    this.attendanceExceptionRepo.create({
      staffId: staff.id,
      staffName: staff.fullName || '',
      employeeCode:
        staff.employeeCode || '',
      attendanceDate,
      punchType,
      attemptedAt,
      latitude: String(
        locationEvaluation.latitude,
      ),
      longitude: String(
        locationEvaluation.longitude,
      ),
      gpsAddress: String(
        body.gpsAddress || '',
      ).trim(),
      photoUrl: String(
        body.photoUrl || '',
      ).trim(),
      attendanceLocationId:
        Number(
          locationEvaluation.location?.id,
        ),
      attendanceLocationName:
        locationEvaluation.location?.name ||
        '',
      distanceMeters: Number(
        locationEvaluation.distanceMeters ||
          0,
      ),
      allowedRadiusMeters: Number(
        locationEvaluation.allowedRadiusMeters ||
          0,
      ),
      employeeReason,
      status:
        StaffAttendanceExceptionStatus.PENDING,
    });

  return this.attendanceExceptionRepo.save(
    exceptionRequest,
  );
}

async listMyAttendanceExceptionRequests(
  query: any,
  user: any,
) {
  const linkedStaff =
    await this.getMyStaffProfile(user);

  const page = Math.max(
    Number(query.page || 1),
    1,
  );

  const limit = Math.min(
    Math.max(Number(query.limit || 20), 1),
    100,
  );

  const qb =
    this.attendanceExceptionRepo
      .createQueryBuilder('request')
      .where(
        'request.staffId = :staffId',
        {
          staffId: Number(
            linkedStaff.id,
          ),
        },
      );

  if (query.status) {
    if (
      !Object.values(
        StaffAttendanceExceptionStatus,
      ).includes(query.status)
    ) {
      throw new BadRequestException(
        'Invalid exception request status',
      );
    }

    qb.andWhere(
      'request.status = :status',
      {
        status: query.status,
      },
    );
  }

  if (query.punchType) {
    const punchType =
      this.parseAttendanceExceptionPunchType(
        query.punchType,
      );

    qb.andWhere(
      'request.punchType = :punchType',
      {
        punchType,
      },
    );
  }

  if (query.dateFrom) {
    qb.andWhere(
      'request.attendanceDate >= :dateFrom',
      {
        dateFrom:
          this.parseAttendanceOverrideDate(
            query.dateFrom,
          ),
      },
    );
  }

  if (query.dateTo) {
    qb.andWhere(
      'request.attendanceDate <= :dateTo',
      {
        dateTo:
          this.parseAttendanceOverrideDate(
            query.dateTo,
          ),
      },
    );
  }

  qb.orderBy('request.createdAt', 'DESC')
    .skip((page - 1) * limit)
    .take(limit);

  const [data, total] =
    await qb.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages:
      Math.ceil(total / limit) || 1,
  };
}

async listAttendanceExceptionRequests(
  query: any,
) {
  const page = Math.max(
    Number(query.page || 1),
    1,
  );

  const limit = Math.min(
    Math.max(Number(query.limit || 20), 1),
    100,
  );

  const qb =
    this.attendanceExceptionRepo
      .createQueryBuilder('request');

  if (query.staffId) {
    const staffId = Number(query.staffId);

    if (
      !Number.isInteger(staffId) ||
      staffId <= 0
    ) {
      throw new BadRequestException(
        'Invalid staff filter',
      );
    }

    qb.andWhere(
      'request.staffId = :staffId',
      {
        staffId,
      },
    );
  }

  if (query.status) {
    if (
      !Object.values(
        StaffAttendanceExceptionStatus,
      ).includes(query.status)
    ) {
      throw new BadRequestException(
        'Invalid exception request status',
      );
    }

    qb.andWhere(
      'request.status = :status',
      {
        status: query.status,
      },
    );
  }

  if (query.punchType) {
    const punchType =
      this.parseAttendanceExceptionPunchType(
        query.punchType,
      );

    qb.andWhere(
      'request.punchType = :punchType',
      {
        punchType,
      },
    );
  }

  if (query.attendanceDate) {
    qb.andWhere(
      'request.attendanceDate = :attendanceDate',
      {
        attendanceDate:
          this.parseAttendanceOverrideDate(
            query.attendanceDate,
          ),
      },
    );
  }

  if (query.dateFrom) {
    qb.andWhere(
      'request.attendanceDate >= :dateFrom',
      {
        dateFrom:
          this.parseAttendanceOverrideDate(
            query.dateFrom,
          ),
      },
    );
  }

  if (query.dateTo) {
    qb.andWhere(
      'request.attendanceDate <= :dateTo',
      {
        dateTo:
          this.parseAttendanceOverrideDate(
            query.dateTo,
          ),
      },
    );
  }

  if (query.search) {
    qb.andWhere(
      `(
        LOWER(COALESCE(request.staffName, ''))
        LIKE LOWER(:search)
        OR LOWER(COALESCE(request.employeeCode, ''))
        LIKE LOWER(:search)
        OR LOWER(COALESCE(request.employeeReason, ''))
        LIKE LOWER(:search)
      )`,
      {
        search: `%${String(
          query.search,
        ).trim()}%`,
      },
    );
  }

  qb.orderBy(
    `CASE
      WHEN request.status = 'PENDING' THEN 0
      ELSE 1
    END`,
    'ASC',
  )
    .addOrderBy(
      'request.createdAt',
      'DESC',
    )
    .skip((page - 1) * limit)
    .take(limit);

  const [data, total] =
    await qb.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages:
      Math.ceil(total / limit) || 1,
  };
}

async getAttendanceExceptionRequest(
  id: number,
) {
  const request =
    await this.attendanceExceptionRepo.findOne({
      where: {
        id: Number(id),
      },
    });

  if (!request) {
    throw new NotFoundException(
      'Attendance exception request not found',
    );
  }

  return request;
}

async cancelMyAttendanceExceptionRequest(
  id: number,
  user: any,
) {
  const linkedStaff =
    await this.getMyStaffProfile(user);

  const request =
    await this.attendanceExceptionRepo.findOne({
      where: {
        id: Number(id),
        staffId: Number(linkedStaff.id),
      },
    });

  if (!request) {
    throw new NotFoundException(
      'Attendance exception request not found',
    );
  }

  if (
    request.status !==
    StaffAttendanceExceptionStatus.PENDING
  ) {
    throw new BadRequestException(
      'Only a pending exception request can be cancelled',
    );
  }

  request.status =
    StaffAttendanceExceptionStatus.CANCELLED;

  return this.attendanceExceptionRepo.save(
    request,
  );
}

async reviewAttendanceExceptionRequest(
  id: number,
  body: any,
  user: any,
) {
  const requestedStatus = String(
    body.status || '',
  ).trim();

  if (
    requestedStatus !==
      StaffAttendanceExceptionStatus.APPROVED &&
    requestedStatus !==
      StaffAttendanceExceptionStatus.REJECTED
  ) {
    throw new BadRequestException(
      'Status must be APPROVED or REJECTED',
    );
  }

  const reviewerId = Number(user?.id);

  if (
    !Number.isInteger(reviewerId) ||
    reviewerId <= 0
  ) {
    throw new BadRequestException(
      'Valid reviewer is required',
    );
  }

  const approvalRemarks = String(
    body.approvalRemarks || '',
  ).trim();

  return this.attendanceExceptionRepo.manager.transaction(
    async (manager) => {
      const exceptionRepository =
        manager.getRepository(
          StaffAttendanceException,
        );

      const attendanceRepository =
        manager.getRepository(
          StaffAttendance,
        );

      const request =
        await exceptionRepository.findOne({
          where: {
            id: Number(id),
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

      if (!request) {
        throw new NotFoundException(
          'Attendance exception request not found',
        );
      }

      if (
        request.status !==
        StaffAttendanceExceptionStatus.PENDING
      ) {
        throw new BadRequestException(
          'This attendance exception request has already been reviewed',
        );
      }

      request.reviewedBy = reviewerId;
      request.reviewedByName =
        user?.name || '';
      request.reviewedAt = new Date();
      request.approvalRemarks =
        approvalRemarks;

      if (
        requestedStatus ===
        StaffAttendanceExceptionStatus.REJECTED
      ) {
        request.status =
          StaffAttendanceExceptionStatus.REJECTED;

        return exceptionRepository.save(
          request,
        );
      }

      let attendance =
        await attendanceRepository.findOne({
          where: {
            staffId: request.staffId,
            attendanceDate:
              request.attendanceDate,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

      if (
        request.punchType ===
        StaffAttendanceExceptionPunchType.PUNCH_IN
      ) {
        if (attendance?.punchInTime) {
          throw new BadRequestException(
            'Punch in attendance has already been recorded for this employee',
          );
        }

        if (!attendance) {
          attendance =
            attendanceRepository.create({
              staffId: request.staffId,
              staffName:
                request.staffName || '',
              employeeCode:
                request.employeeCode || '',
              attendanceDate:
                request.attendanceDate,
            });
        }

        attendance.punchInTime =
          new Date(request.attemptedAt);

        attendance.punchInLatitude =
          request.latitude || '';

        attendance.punchInLongitude =
          request.longitude || '';

        attendance.punchInGpsAddress =
          request.gpsAddress || '';

        attendance.punchInPhotoUrl =
          request.photoUrl || '';

        attendance.status =
          'PRESENT' as any;

        attendance.remarks =
          approvalRemarks
            ? `Attendance exception approved: ${approvalRemarks}`
            : 'Attendance exception approved';

        attendance.createdBy =
          reviewerId;

        attendance.createdByName =
          user?.name || '';
      } else {
        if (
          !attendance ||
          !attendance.punchInTime
        ) {
          throw new BadRequestException(
            'Punch in attendance must exist before approving a punch out exception',
          );
        }

        if (attendance.punchOutTime) {
          throw new BadRequestException(
            'Punch out attendance has already been recorded for this employee',
          );
        }

        const attemptedPunchOutTime =
          new Date(request.attemptedAt);

        if (
          attemptedPunchOutTime.getTime() <=
          new Date(
            attendance.punchInTime,
          ).getTime()
        ) {
          throw new BadRequestException(
            'Punch out attempt time must be after punch in time',
          );
        }

        attendance.punchOutTime =
          attemptedPunchOutTime;

        attendance.punchOutLatitude =
          request.latitude || '';

        attendance.punchOutLongitude =
          request.longitude || '';

        attendance.punchOutGpsAddress =
          request.gpsAddress || '';

        attendance.punchOutPhotoUrl =
          request.photoUrl || '';

        attendance.workingHours =
          this.calculateWorkingHours(
            attendance.punchInTime,
            attendance.punchOutTime,
          );

        attendance.remarks =
          approvalRemarks
            ? `Attendance exception approved: ${approvalRemarks}`
            : attendance.remarks ||
              'Attendance exception approved';

        if (
          attendance.workingHours > 0 &&
          attendance.workingHours < 4
        ) {
          attendance.status =
            'HALF_DAY' as any;
        }
      }

      const savedAttendance =
        await attendanceRepository.save(
          attendance,
        );

      request.status =
        StaffAttendanceExceptionStatus.APPROVED;

      request.createdAttendanceId =
        savedAttendance.id;

      return exceptionRepository.save(
        request,
      );
    },
  );
}
}
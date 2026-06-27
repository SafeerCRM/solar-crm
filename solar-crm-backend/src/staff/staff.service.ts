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

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
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
}
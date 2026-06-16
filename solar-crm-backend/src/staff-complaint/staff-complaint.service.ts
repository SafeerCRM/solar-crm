import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StaffComplaint,
  StaffComplaintStatus,
  StaffComplaintPriority,
} from './staff-complaint.entity';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

@Injectable()
export class StaffComplaintService {
  constructor(
    @InjectRepository(StaffComplaint)
    private readonly complaintRepository: Repository<StaffComplaint>,
  ) {}

  private isOwner(user: any) {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    return roles.includes('OWNER');
  }

  async create(body: any, user: any) {
    const title = String(body?.title || '').trim();
    const description = String(body?.description || '').trim();

    if (!title) {
      throw new BadRequestException('Complaint title is required');
    }

    if (!description && !body?.audioUrl) {
  throw new BadRequestException(
    'Complaint description or audio is required',
  );
}

    const roles = Array.isArray(user?.roles) ? user.roles : [];

    const complaint = this.complaintRepository.create({
      title,
      description,
      priority:
        body?.priority && Object.values(StaffComplaintPriority).includes(body.priority)
          ? body.priority
          : StaffComplaintPriority.MEDIUM,
      status: StaffComplaintStatus.OPEN,
      createdBy: user?.id || user?.userId || user?.sub || null,
      createdByName: user?.name || user?.email || '',
      createdByRole: roles?.[0] || '',
      department: body?.department || '',
audioUrl: body?.audioUrl || '',
    });

    return this.complaintRepository.save(complaint);
  }

  async findAll(filters: any, user: any) {
    const page = Number(filters?.page) > 0 ? Number(filters.page) : 1;
    const limit =
      Number(filters?.limit) > 0 ? Math.min(Number(filters.limit), 100) : 20;
    const skip = (page - 1) * limit;

    const query = this.complaintRepository
      .createQueryBuilder('complaint')
      .where('complaint.isHidden = false');

    if (!this.isOwner(user)) {
      query.andWhere('complaint.createdBy = :createdBy', {
        createdBy: user?.id || user?.userId || user?.sub,
      });
    }

    if (filters?.status) {
      query.andWhere('complaint.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.priority) {
      query.andWhere('complaint.priority = :priority', {
        priority: filters.priority,
      });
    }

    if (filters?.department) {
  query.andWhere(
    'LOWER(complaint.department) LIKE :department',
    {
      department: `%${String(filters.department).toLowerCase()}%`,
    },
  );
}

if (filters?.staffName) {
  query.andWhere(
    'LOWER(complaint.createdByName) LIKE :staffName',
    {
      staffName: `%${String(filters.staffName).toLowerCase()}%`,
    },
  );
}

if (filters?.followUpDate) {
  query.andWhere('complaint.followUpDate = :followUpDate', {
    followUpDate: filters.followUpDate,
  });
}

    if (filters?.search) {
      query.andWhere(
        `
        LOWER(complaint.title) LIKE :search
        OR LOWER(complaint.description) LIKE :search
        OR LOWER(complaint.createdByName) LIKE :search
        OR CAST(complaint.id AS TEXT) LIKE :search
        `,
        {
          search: `%${String(filters.search).toLowerCase()}%`,
        },
      );
    }

    query.orderBy('complaint.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    const summaryQuery = this.complaintRepository
      .createQueryBuilder('complaint')
      .where('complaint.isHidden = false');

    if (!this.isOwner(user)) {
      summaryQuery.andWhere('complaint.createdBy = :createdBy', {
        createdBy: user?.id || user?.userId || user?.sub,
      });
    }

    const allVisible = await summaryQuery.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      summary: {
        total: allVisible.length,
        open: allVisible.filter((item) => item.status === StaffComplaintStatus.OPEN)
          .length,
        inReview: allVisible.filter(
          (item) => item.status === StaffComplaintStatus.IN_REVIEW,
        ).length,
        resolved: allVisible.filter(
          (item) => item.status === StaffComplaintStatus.RESOLVED,
        ).length,
        rejected: allVisible.filter(
          (item) => item.status === StaffComplaintStatus.REJECTED,
        ).length,
      },
    };
  }

  async uploadAudio(file: any) {
  if (!file) {
    throw new BadRequestException('Audio file is required');
  }

  const mimeType = String(file.mimetype || '');

  const originalName = String(file.originalname || '').toLowerCase();

const isAllowedAudio =
  mimeType.startsWith('audio/') ||
  mimeType === 'video/webm' ||
  mimeType === 'application/octet-stream' ||
  originalName.endsWith('.m4a') ||
  originalName.endsWith('.mp3') ||
  originalName.endsWith('.wav') ||
  originalName.endsWith('.webm') ||
  originalName.endsWith('.aac') ||
  originalName.endsWith('.ogg') ||
  originalName.endsWith('.mp4');

if (!isAllowedAudio) {
  throw new BadRequestException(
    'Only audio files are allowed',
  );
}

  const maxSize = 10 * 1024 * 1024;

  if (Number(file.size || 0) > maxSize) {
    throw new BadRequestException(
      'Audio file is too large. Please upload below 10 MB',
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket =
    process.env.SUPABASE_PROJECT_DOCUMENTS_BUCKET ||
    'project-documents';

  if (!supabaseUrl || !serviceKey) {
    throw new BadRequestException(
      'Supabase storage is not configured',
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const extension = originalName.includes('.')
    ? originalName.split('.').pop()
    : mimeType.split('/')[1] || 'webm';

  const safeExtension = String(extension || 'webm').replace(
    /[^a-zA-Z0-9]/g,
    '',
  );

  const filePath = `staff-complaints/audio/${Date.now()}-${randomUUID()}.${safeExtension}`;

  const uploadResult = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: mimeType || 'audio/webm',
      upsert: false,
    });

  if (uploadResult.error) {
    throw new BadRequestException(uploadResult.error.message);
  }

  const publicUrlResult = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    audioUrl: publicUrlResult.data.publicUrl,
  };
}

  async updateStatus(id: number, body: any, user: any) {
    if (!this.isOwner(user)) {
      throw new ForbiddenException('Only owner can update complaint status');
    }

    const complaint = await this.complaintRepository.findOne({
      where: { id, isHidden: false },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    if (
      body?.status &&
      !Object.values(StaffComplaintStatus).includes(body.status)
    ) {
      throw new BadRequestException('Invalid complaint status');
    }

    complaint.status = body?.status || complaint.status;
    complaint.ownerRemarks = body?.ownerRemarks ?? complaint.ownerRemarks;

    complaint.ownerAudioUrl =
  String(body?.ownerAudioUrl || '').trim() || (undefined as any);

complaint.followUpDate =
  String(body?.followUpDate || '').trim() || (undefined as any);

complaint.followUpTime =
  String(body?.followUpTime || '').trim() || (undefined as any);

complaint.nextAction =
  String(body?.nextAction || '').trim() || (undefined as any);

    if (
      complaint.status === StaffComplaintStatus.RESOLVED ||
      complaint.status === StaffComplaintStatus.REJECTED
    ) {
      complaint.resolvedBy = user?.id || user?.userId || user?.sub || null;
      complaint.resolvedByName = user?.name || user?.email || '';
      complaint.resolvedAt = new Date();
    }

    return this.complaintRepository.save(complaint);
  }

  async hide(
  id: number,
  user: any,
) {
  const complaint =
    await this.complaintRepository.findOne({
      where: {
        id,
        isHidden: false,
      },
    });

  if (!complaint) {
    throw new NotFoundException(
      'Complaint not found',
    );
  }

  const userId =
    user?.id ||
    user?.userId ||
    user?.sub;

  const roles = Array.isArray(user?.roles)
    ? user.roles
    : [];

  const isOwner =
    roles.includes('OWNER');

  const isCreator =
    complaint.createdBy === userId;

  if (!isOwner && !isCreator) {
    throw new ForbiddenException(
      'Access denied',
    );
  }

  complaint.isHidden = true;

  complaint.hiddenBy = userId;

  complaint.hiddenByName =
    user?.name || '';

  complaint.hiddenAt =
    new Date();

  return this.complaintRepository.save(
    complaint,
  );
}

async restore(
  id: number,
  user: any,
) {
  const complaint =
    await this.complaintRepository.findOne({
      where: {
        id,
        isHidden: true,
      },
    });

  if (!complaint) {
    throw new NotFoundException(
      'Complaint not found',
    );
  }

  const roles = Array.isArray(user?.roles)
    ? user.roles
    : [];

  if (
    !roles.includes('OWNER')
  ) {
    throw new ForbiddenException(
      'Only owner can restore complaints',
    );
  }

  complaint.isHidden = false;

  complaint.hiddenBy = null as any;
complaint.hiddenByName = null as any;
complaint.hiddenAt = null as any;

  return this.complaintRepository.save(
    complaint,
  );
}

async findHidden(user: any) {
  const roles = Array.isArray(user?.roles)
    ? user.roles
    : [];

  if (
    !roles.includes('OWNER')
  ) {
    throw new ForbiddenException(
      'Only owner can view hidden complaints',
    );
  }

  return this.complaintRepository.find({
    where: {
      isHidden: true,
    },
    order: {
      updatedAt: 'DESC',
    },
  });
}

  async updateComplaint(
  id: number,
  body: any,
  user: any,
) {
  const complaint =
    await this.complaintRepository.findOne({
      where: {
        id,
        isHidden: false,
      },
    });

  if (!complaint) {
    throw new NotFoundException(
      'Complaint not found',
    );
  }

  const userId =
    user?.id ||
    user?.userId ||
    user?.sub;

  const roles = Array.isArray(user?.roles)
    ? user.roles
    : [];

  const isOwner =
    roles.includes('OWNER');

  const isCreator =
    complaint.createdBy === userId;

  if (!isOwner && !isCreator) {
    throw new ForbiddenException(
      'Access denied',
    );
  }

  if (
    !isOwner &&
    complaint.status !==
      StaffComplaintStatus.OPEN
  ) {
    throw new BadRequestException(
      'Complaint can only be edited while OPEN',
    );
  }

  complaint.title =
    body?.title || complaint.title;

  complaint.description =
    body?.description ||
    complaint.description;

  if (
    body?.priority &&
    Object.values(
      StaffComplaintPriority,
    ).includes(body.priority)
  ) {
    complaint.priority =
      body.priority;
  }

  return this.complaintRepository.save(
    complaint,
  );
}

async getFollowUpSummary(user: any) {
  const today = new Date().toISOString().split('T')[0];

  const complaints =
    await this.complaintRepository.find({
      where: {
        isHidden: false,
      },
    });

  const todayFollowUps = complaints.filter(
    (c: any) =>
      c.followUpDate === today,
  ).length;

  const upcomingFollowUps = complaints.filter(
    (c: any) =>
      c.followUpDate &&
      c.followUpDate > today,
  ).length;

  const overdueFollowUps = complaints.filter(
    (c: any) =>
      c.followUpDate &&
      c.followUpDate < today &&
      c.status !== 'RESOLVED',
  ).length;

  return {
    todayFollowUps,
    upcomingFollowUps,
    overdueFollowUps,
  };
}

async getFollowUpsByType(type: string, user: any) {
  if (!this.isOwner(user)) {
    throw new ForbiddenException('Only owner can view complaint follow-ups');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const qb = this.complaintRepository
    .createQueryBuilder('complaint')
    .where('complaint.isHidden = false')
    .andWhere('complaint.followUpDate IS NOT NULL');

  const normalizedType = String(type || '').toUpperCase();

  if (normalizedType === 'TODAY') {
    qb.andWhere('complaint.followUpDate = :today', {
      today: today.toISOString().split('T')[0],
    });
  }

  if (normalizedType === 'OVERDUE') {
    qb.andWhere('complaint.followUpDate < :today', {
      today: today.toISOString().split('T')[0],
    });
    qb.andWhere('complaint.status NOT IN (:...closedStatuses)', {
      closedStatuses: [
        StaffComplaintStatus.RESOLVED,
        StaffComplaintStatus.REJECTED,
      ],
    });
  }

  if (normalizedType === 'UPCOMING') {
    qb.andWhere('complaint.followUpDate >= :tomorrow', {
      tomorrow: tomorrow.toISOString().split('T')[0],
    });
  }

  return qb
    .orderBy('complaint.followUpDate', 'ASC')
    .addOrderBy('complaint.followUpTime', 'ASC')
    .getMany();
}

async findByDate(date: string, user: any) {
  if (!this.isOwner(user)) {
    throw new ForbiddenException('Only owner can view complaint calendar');
  }

  return this.complaintRepository.find({
    where: {
      isHidden: false,
      followUpDate: date as any,
    },
    order: {
      followUpTime: 'ASC' as any,
      createdAt: 'DESC',
    },
  });
}
}
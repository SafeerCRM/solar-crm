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

    if (!description) {
      throw new BadRequestException('Complaint description is required');
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

  complaint.hiddenBy = null;
  complaint.hiddenByName = null;
  complaint.hiddenAt = null;

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
}
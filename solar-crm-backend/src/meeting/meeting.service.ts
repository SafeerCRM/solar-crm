import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting } from './meeting.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

@Injectable()
export class MeetingService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
  ) {}

  async create(createMeetingDto: CreateMeetingDto): Promise<Meeting> {
    const meeting = this.meetingRepository.create({
      ...createMeetingDto,
      scheduledAt: new Date(createMeetingDto.scheduledAt),
    });

    return this.meetingRepository.save(meeting);
  }

  async findAll(query: any): Promise<Meeting[]> {
    const qb = this.meetingRepository.createQueryBuilder('meeting');

    if (query.status) {
      qb.andWhere('meeting.status = :status', {
        status: query.status,
      });
    }

    if (query.meetingType) {
      qb.andWhere('meeting.meetingType = :meetingType', {
        meetingType: query.meetingType,
      });
    }

    if (query.assignedTo) {
      qb.andWhere('meeting.assignedTo = :assignedTo', {
        assignedTo: Number(query.assignedTo),
      });
    }

    if (query.leadId) {
      qb.andWhere('meeting.leadId = :leadId', {
        leadId: Number(query.leadId),
      });
    }

    if (query.followupId) {
      qb.andWhere('meeting.followupId = :followupId', {
        followupId: Number(query.followupId),
      });
    }

    if (query.mobile) {
      qb.andWhere('meeting.mobile ILIKE :mobile', {
        mobile: `%${query.mobile}%`,
      });
    }

    if (query.customerName) {
      qb.andWhere('meeting.customerName ILIKE :customerName', {
        customerName: `%${query.customerName}%`,
      });
    }

    if (query.fromDate) {
      qb.andWhere('meeting.scheduledAt >= :fromDate', {
        fromDate: query.fromDate,
      });
    }

    if (query.toDate) {
      qb.andWhere('meeting.scheduledAt <= :toDate', {
        toDate: query.toDate,
      });
    }

    qb.orderBy('meeting.scheduledAt', 'DESC');

    return qb.getMany();
  }

  async findOne(id: number): Promise<Meeting> {
    const meeting = await this.meetingRepository.findOne({
      where: { id },
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }

    return meeting;
  }

  async update(id: number, updateMeetingDto: UpdateMeetingDto): Promise<Meeting> {
  await this.findOne(id);

  const { scheduledAt, ...rest } = updateMeetingDto;

  const updateData: Partial<Meeting> = {
    ...rest,
  };

  if (scheduledAt) {
    updateData.scheduledAt = new Date(scheduledAt);
  }

  await this.meetingRepository.update(id, updateData);

  return this.findOne(id);
}

  async updateStatus(id: number, status: string): Promise<Meeting> {
    await this.findOne(id);

    await this.meetingRepository.update(id, {
      status: status as any,
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);

    await this.meetingRepository.delete(id);

    return {
      message: `Meeting with ID ${id} deleted successfully`,
    };
  }
}
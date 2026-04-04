import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { FollowUp, FollowUpStatus } from './follow-up.entity';

@Injectable()
export class FollowupService {
  constructor(
    @InjectRepository(FollowUp)
    private readonly followUpRepository: Repository<FollowUp>,
  ) {}

  async create(data: Partial<FollowUp>, user: any) {
    if (user?.role === 'PROJECT_MANAGER') {
      throw new ForbiddenException(
        'Project manager cannot create followups',
      );
    }

    const followUpData =
      user?.role === 'TELECALLER'
        ? {
            ...data,
            assignedTo: user.id,
          }
        : data;

    const followUp = this.followUpRepository.create(followUpData);
    return this.followUpRepository.save(followUp);
  }

  async findAll(user: any) {
    if (user?.role === 'TELECALLER') {
      return this.followUpRepository.find({
        where: { assignedTo: user.id },
        order: { followUpDate: 'ASC' },
      });
    }

    return this.followUpRepository.find({
      order: { followUpDate: 'ASC' },
    });
  }

  async findToday(user: any) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    if (user?.role === 'TELECALLER') {
      return this.followUpRepository.find({
        where: {
          assignedTo: user.id,
          followUpDate: Between(start, end),
        },
        order: { followUpDate: 'ASC' },
      });
    }

    return this.followUpRepository.find({
      where: {
        followUpDate: Between(start, end),
      },
      order: { followUpDate: 'ASC' },
    });
  }

  async findOverdue(user: any) {
    if (user?.role === 'TELECALLER') {
      return this.followUpRepository.find({
        where: {
          assignedTo: user.id,
          followUpDate: LessThan(new Date()),
          status: FollowUpStatus.PENDING,
        },
        order: { followUpDate: 'ASC' },
      });
    }

    return this.followUpRepository.find({
      where: {
        followUpDate: LessThan(new Date()),
        status: FollowUpStatus.PENDING,
      },
      order: { followUpDate: 'ASC' },
    });
  }

  async markCompleted(id: number, user: any) {
    const followUp = await this.followUpRepository.findOne({
      where: { id },
    });

    if (!followUp) {
      throw new NotFoundException('Follow-up not found');
    }

    if (
      user?.role === 'TELECALLER' &&
      followUp.assignedTo !== user.id
    ) {
      throw new ForbiddenException(
        'You can only complete your own followups',
      );
    }

    followUp.status = FollowUpStatus.COMPLETED;
    return this.followUpRepository.save(followUp);
  }
}
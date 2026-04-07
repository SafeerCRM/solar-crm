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

  private getRoles(user: any): string[] {
    if (Array.isArray(user?.roles)) {
      return user.roles;
    }
    if (user?.role) {
      return [user.role];
    }
    return [];
  }

  private hasRole(user: any, role: string): boolean {
    return this.getRoles(user).includes(role);
  }

  async create(data: Partial<FollowUp>, user: any) {
    if (this.hasRole(user, 'PROJECT_MANAGER')) {
      throw new ForbiddenException(
        'Project manager cannot create followups',
      );
    }

    const followUpData = this.hasRole(user, 'TELECALLER')
      ? {
          ...data,
          assignedTo: user.id,
        }
      : data;

    const followUp = this.followUpRepository.create(followUpData);
    return this.followUpRepository.save(followUp);
  }

  async findAll(user: any) {
    if (this.hasRole(user, 'TELECALLER')) {
      return this.followUpRepository.find({
        where: { assignedTo: user.id },
        relations: ['lead'],
        order: { followUpDate: 'ASC' },
      });
    }

    return this.followUpRepository.find({
      relations: ['lead'],
      order: { followUpDate: 'ASC' },
    });
  }

  async findToday(user: any) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    if (this.hasRole(user, 'TELECALLER')) {
      return this.followUpRepository.find({
        where: {
          assignedTo: user.id,
          followUpDate: Between(start, end),
        },
        relations: ['lead'],
        order: { followUpDate: 'ASC' },
      });
    }

    return this.followUpRepository.find({
      where: {
        followUpDate: Between(start, end),
      },
      relations: ['lead'],
      order: { followUpDate: 'ASC' },
    });
  }

  async findOverdue(user: any) {
    if (this.hasRole(user, 'TELECALLER')) {
      return this.followUpRepository.find({
        where: {
          assignedTo: user.id,
          followUpDate: LessThan(new Date()),
          status: FollowUpStatus.PENDING,
        },
        relations: ['lead'],
        order: { followUpDate: 'ASC' },
      });
    }

    return this.followUpRepository.find({
      where: {
        followUpDate: LessThan(new Date()),
        status: FollowUpStatus.PENDING,
      },
      relations: ['lead'],
      order: { followUpDate: 'ASC' },
    });
  }

  async findOne(id: number, user: any) {
    const followUp = await this.followUpRepository.findOne({
      where: { id },
      relations: ['lead'],
    });

    if (!followUp) {
      throw new NotFoundException('Follow-up not found');
    }

    if (
      this.hasRole(user, 'TELECALLER') &&
      followUp.assignedTo !== user.id
    ) {
      throw new ForbiddenException(
        'You can only access your own followups',
      );
    }

    return followUp;
  }

  async update(id: number, data: Partial<FollowUp>, user: any) {
    const followUp = await this.followUpRepository.findOne({
      where: { id },
      relations: ['lead'],
    });

    if (!followUp) {
      throw new NotFoundException('Follow-up not found');
    }

    if (
      this.hasRole(user, 'TELECALLER') &&
      followUp.assignedTo !== user.id
    ) {
      throw new ForbiddenException(
        'You can only update your own followups',
      );
    }

    if (data.note !== undefined) {
      followUp.note = data.note;
    }

    if (data.followUpDate !== undefined) {
      followUp.followUpDate = new Date(data.followUpDate);
    }

    if (data.status !== undefined) {
      followUp.status = data.status;
    }

    return this.followUpRepository.save(followUp);
  }

  async markCompleted(id: number, user: any) {
    const followUp = await this.followUpRepository.findOne({
      where: { id },
    });

    if (!followUp) {
      throw new NotFoundException('Follow-up not found');
    }

    if (
      this.hasRole(user, 'TELECALLER') &&
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
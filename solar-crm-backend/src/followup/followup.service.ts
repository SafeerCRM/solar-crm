import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { FollowUp, FollowUpStatus } from './follow-up.entity';
import { UserRole } from '../users/user.entity';

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

  private hasAnyRole(user: any, roles: string[]): boolean {
    const currentRoles = this.getRoles(user);
    return roles.some((role) => currentRoles.includes(role));
  }

  private isOwner(user: any): boolean {
    return this.hasAnyRole(user, [UserRole.OWNER]);
  }

  private isLeadManager(user: any): boolean {
    return this.hasAnyRole(user, [UserRole.LEAD_MANAGER]);
  }

  private isTelecallingManager(user: any): boolean {
    return this.hasAnyRole(user, [UserRole.TELECALLING_MANAGER]);
  }

  private isMarketingHead(user: any): boolean {
    return this.hasAnyRole(user, [UserRole.MARKETING_HEAD]);
  }

  private isTelecaller(user: any): boolean {
    return this.hasAnyRole(user, [UserRole.TELECALLER]);
  }

  private isLeadExecutive(user: any): boolean {
    return this.hasAnyRole(user, [UserRole.LEAD_EXECUTIVE]);
  }

  private isMeetingManager(user: any): boolean {
    return this.hasAnyRole(user, [UserRole.MEETING_MANAGER]);
  }

  private isProjectManager(user: any): boolean {
    return this.hasAnyRole(user, [UserRole.PROJECT_MANAGER]);
  }

  private isProjectExecutive(user: any): boolean {
    return this.hasAnyRole(user, [UserRole.PROJECT_EXECUTIVE]);
  }

  private isBroadAccessRole(user: any): boolean {
    return (
      this.isOwner(user) ||
      this.isLeadManager(user) ||
      this.isTelecallingManager(user) ||
      this.isMarketingHead(user)
    );
  }

  private isOwnAssignedOnlyRole(user: any): boolean {
    return this.hasAnyRole(user, [
      UserRole.TELECALLER,
      UserRole.LEAD_EXECUTIVE,
      UserRole.MEETING_MANAGER,
      UserRole.PROJECT_EXECUTIVE,
    ]);
  }

  private getCurrentUserId(user: any): number {
    return Number(user?.id ?? user?.sub);
  }

  private async getAccessibleFollowUp(id: number, user: any) {
    const followUp = await this.followUpRepository.findOne({
      where: { id },
      relations: ['lead'],
    });

    if (!followUp) {
      throw new NotFoundException('Follow-up not found');
    }

    const currentUserId = this.getCurrentUserId(user);

    if (this.isBroadAccessRole(user)) {
      return followUp;
    }

    if (this.isProjectManager(user)) {
      throw new ForbiddenException('Project manager cannot access followups');
    }

    if (this.isOwnAssignedOnlyRole(user)) {
      if (followUp.assignedTo !== currentUserId) {
        throw new ForbiddenException(
          'You can only access your own followups',
        );
      }

      return followUp;
    }

    return followUp;
  }

  async create(data: Partial<FollowUp>, user: any) {
    if (this.isProjectManager(user)) {
      throw new ForbiddenException(
        'Project manager cannot create followups',
      );
    }

    const currentUserId = this.getCurrentUserId(user);

    const followUpData = this.isOwnAssignedOnlyRole(user)
      ? {
          ...data,
          assignedTo: currentUserId,
        }
      : data;

    const followUp = this.followUpRepository.create(followUpData);
    return this.followUpRepository.save(followUp);
  }

  async findAll(user: any) {
    if (this.isProjectManager(user)) {
      return [];
    }

    if (this.isOwnAssignedOnlyRole(user)) {
      return this.followUpRepository.find({
        where: { assignedTo: this.getCurrentUserId(user) },
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

    if (this.isProjectManager(user)) {
      return [];
    }

    if (this.isOwnAssignedOnlyRole(user)) {
      return this.followUpRepository.find({
        where: {
          assignedTo: this.getCurrentUserId(user),
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
    if (this.isProjectManager(user)) {
      return [];
    }

    if (this.isOwnAssignedOnlyRole(user)) {
      return this.followUpRepository.find({
        where: {
          assignedTo: this.getCurrentUserId(user),
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
    return this.getAccessibleFollowUp(id, user);
  }

  async update(id: number, data: Partial<FollowUp>, user: any) {
    const followUp = await this.getAccessibleFollowUp(id, user);

    if (data.note !== undefined) {
      followUp.note = data.note;
    }

    if (data.followUpDate !== undefined) {
      followUp.followUpDate = new Date(data.followUpDate);
    }

    if (data.status !== undefined) {
      followUp.status = data.status;
    }

    if (this.isOwnAssignedOnlyRole(user) && data.assignedTo !== undefined) {
      delete data.assignedTo;
    }

    return this.followUpRepository.save(followUp);
  }

  async markCompleted(id: number, user: any) {
    const followUp = await this.getAccessibleFollowUp(id, user);

    followUp.status = FollowUpStatus.COMPLETED;
    return this.followUpRepository.save(followUp);
  }

  async getConvertToMeetingData(id: number, user: any) {
    const followUp = await this.getAccessibleFollowUp(id, user);

    return {
      followupId: followUp.id,
      leadId: followUp.leadId,
      assignedTo: followUp.assignedTo,
      followUpDate: followUp.followUpDate,
      note: followUp.note || '',
      lead: followUp.lead
        ? {
            id: followUp.lead.id,
            name: followUp.lead.name,
            phone: followUp.lead.phone,
            city: (followUp.lead as any).city || '',
            assignedTo: (followUp.lead as any).assignedTo,
            createdByName: (followUp.lead as any).createdByName || '',
          }
        : null,
    };
  }
}
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between, In } from 'typeorm';
import { FollowUp, FollowUpStatus } from './follow-up.entity';
import { Lead } from '../leads/lead.entity';
import { UserRole } from '../users/user.entity';

@Injectable()
export class FollowupService {
    constructor(
    @InjectRepository(FollowUp)
    private readonly followUpRepository: Repository<FollowUp>,

    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
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
      const isAssignedToUser = followUp.assignedTo === currentUserId;
      const isCreatedByUser = followUp.createdBy === currentUserId;
      const isLeadAssignedToUser = followUp.lead?.assignedTo === currentUserId;
      const isLeadCreatedByUser = followUp.lead?.createdBy === currentUserId;
      const isLeadOriginTelecaller =
        followUp.lead?.originTelecallerId === currentUserId;

      if (
        !isAssignedToUser &&
        !isCreatedByUser &&
        !isLeadAssignedToUser &&
        !isLeadCreatedByUser &&
        !isLeadOriginTelecaller
      ) {
        throw new ForbiddenException(
          'You can only access your own or related followups',
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
    const currentUserName = user?.name || user?.email || 'Unknown User';

    const followUpData = this.isOwnAssignedOnlyRole(user)
      ? {
          ...data,
          assignedTo: data.assignedTo ?? currentUserId,
          createdBy: currentUserId,
          createdByName: currentUserName,
          sourceModule: data.sourceModule || 'FOLLOWUP',
          sourceStage: data.sourceStage || 'MANUAL',
        }
      : {
          ...data,
          createdBy: currentUserId,
          createdByName: currentUserName,
          sourceModule: data.sourceModule || 'FOLLOWUP',
          sourceStage: data.sourceStage || 'MANUAL',
        };

    const followUp = this.followUpRepository.create(followUpData);
    return this.followUpRepository.save(followUp);
  }

  async findAll(user: any) {
    if (this.isProjectManager(user)) {
      return [];
    }

        if (this.isOwnAssignedOnlyRole(user)) {
      const currentUserId = this.getCurrentUserId(user);

      return this.followUpRepository
        .createQueryBuilder('followUp')
        .leftJoinAndSelect('followUp.lead', 'lead')
        .where('followUp.assignedTo = :currentUserId', { currentUserId })
        .orWhere('followUp.createdBy = :currentUserId', { currentUserId })
        .orWhere('lead.assignedTo = :currentUserId', { currentUserId })
        .orWhere('lead.createdBy = :currentUserId', { currentUserId })
        .orWhere('lead.originTelecallerId = :currentUserId', { currentUserId })
        .orderBy('followUp.followUpDate', 'ASC')
        .getMany();
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
      const currentUserId = this.getCurrentUserId(user);

      return this.followUpRepository
        .createQueryBuilder('followUp')
        .leftJoinAndSelect('followUp.lead', 'lead')
        .where('followUp.followUpDate BETWEEN :start AND :end', { start, end })
        .andWhere(
          '(followUp.assignedTo = :currentUserId OR followUp.createdBy = :currentUserId OR lead.assignedTo = :currentUserId OR lead.createdBy = :currentUserId OR lead.originTelecallerId = :currentUserId)',
          { currentUserId },
        )
        .orderBy('followUp.followUpDate', 'ASC')
        .getMany();
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
      const currentUserId = this.getCurrentUserId(user);

      return this.followUpRepository
        .createQueryBuilder('followUp')
        .leftJoinAndSelect('followUp.lead', 'lead')
        .where('followUp.followUpDate < :now', { now: new Date() })
        .andWhere('followUp.status = :status', {
          status: FollowUpStatus.PENDING,
        })
        .andWhere(
          '(followUp.assignedTo = :currentUserId OR followUp.createdBy = :currentUserId OR lead.assignedTo = :currentUserId OR lead.createdBy = :currentUserId OR lead.originTelecallerId = :currentUserId)',
          { currentUserId },
        )
        .orderBy('followUp.followUpDate', 'ASC')
        .getMany();
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

    async assignFiltered(
      body: {
    assignedTo: number;
    leadPotential?: string;
    city?: string;
    zone?: string;
    limit?: number;
  },
    user: any,
  ) {
    if (!this.isOwner(user) && !this.isLeadManager(user) && !this.isTelecallingManager(user)) {
      throw new ForbiddenException(
        'Only owner, lead manager, or telecalling manager can bulk assign followups',
      );
    }

    const assignedTo = Number(body.assignedTo);
    const limit = Number(body.limit) > 0 ? Number(body.limit) : null;

    if (!assignedTo || Number.isNaN(assignedTo)) {
            throw new ForbiddenException('Valid lead manager is required');
    }

    const leadPotential = String(body.leadPotential || '').trim().toUpperCase();
    const city = String(body.city || '').trim().toLowerCase();
    const zone = String(body.zone || '').trim().toLowerCase();

    const qb = this.followUpRepository
      .createQueryBuilder('followUp')
      .leftJoinAndSelect('followUp.lead', 'lead')
      .where('followUp.status = :status', { status: FollowUpStatus.PENDING });

    if (leadPotential) {
      qb.andWhere(`UPPER(COALESCE(lead.potential, '')) = :leadPotential`, {
        leadPotential,
      });
    }

    if (city) {
      qb.andWhere(`LOWER(COALESCE(lead.city, '')) LIKE :city`, {
        city: `%${city}%`,
      });
    }

    if (zone) {
      qb.andWhere(`LOWER(COALESCE(lead.zone, '')) LIKE :zone`, {
        zone: `%${zone}%`,
      });
    }

    let matchedFollowups = await qb
  .orderBy('followUp.followUpDate', 'ASC') // oldest first
  .getMany();

if (limit && matchedFollowups.length > limit) {
  matchedFollowups = matchedFollowups.slice(0, limit);
}

    if (!matchedFollowups.length) {
      return {
        message: 'No followups found for selected filters',
        updatedFollowups: 0,
        updatedLeads: 0,
      };
    }

    const followupIds = matchedFollowups.map((f) => f.id);
    const leadIds = Array.from(
      new Set(
        matchedFollowups
          .map((f) => Number(f.leadId))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );

    await this.followUpRepository
      .createQueryBuilder()
      .update(FollowUp)
      .set({ assignedTo })
      .where('id IN (:...ids)', { ids: followupIds })
      .execute();

    if (leadIds.length) {
      await this.leadRepository
        .createQueryBuilder()
        .update(Lead)
        .set({ assignedTo })
        .where('id IN (:...ids)', { ids: leadIds })
        .execute();
    }

    return {
      message: 'Filtered followups assigned successfully',
      updatedFollowups: followupIds.length,
      updatedLeads: leadIds.length,
    };
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
async findByDate(date: string, user: any) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  if (this.isProjectManager(user)) {
    return [];
  }

  if (this.isOwnAssignedOnlyRole(user)) {
    const currentUserId = this.getCurrentUserId(user);

    return this.followUpRepository
      .createQueryBuilder('followUp')
      .leftJoinAndSelect('followUp.lead', 'lead')
      .where('followUp.followUpDate BETWEEN :start AND :end', { start, end })
      .andWhere(
        '(followUp.assignedTo = :currentUserId OR followUp.createdBy = :currentUserId OR lead.assignedTo = :currentUserId OR lead.createdBy = :currentUserId OR lead.originTelecallerId = :currentUserId)',
        { currentUserId },
      )
      .orderBy('followUp.followUpDate', 'ASC')
      .getMany();
  }

  return this.followUpRepository.find({
    where: {
      followUpDate: Between(start, end),
    },
    relations: ['lead'],
    order: { followUpDate: 'ASC' },
  });
}

}
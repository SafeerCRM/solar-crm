import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { CallLog, CallReviewStatus } from './call-log.entity';
import { Lead, LeadStatus } from '../leads/lead.entity';
import {
  FollowUp,
  FollowUpStatus,
  FollowUpType,
} from '../followup/follow-up.entity';

@Injectable()
export class TelecallingService {
  constructor(
    @InjectRepository(CallLog)
    private readonly callLogRepository: Repository<CallLog>,

    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,

    @InjectRepository(FollowUp)
    private readonly followUpRepository: Repository<FollowUp>,
  ) {}

  async create(data: Partial<CallLog>) {
    const log = this.callLogRepository.create({
      ...data,
      reviewStatus: CallReviewStatus.PENDING,
    });

    const savedLog = await this.callLogRepository.save(log);

    if (!data.leadId) {
      return savedLog;
    }

    const lead = await this.leadRepository.findOne({
      where: { id: data.leadId },
    });

    if (!lead) {
      return savedLog;
    }

    if (data.callStatus === 'INTERESTED') {
      lead.status = LeadStatus.INTERESTED;
    } else if (data.callStatus === 'NOT_INTERESTED') {
      lead.status = LeadStatus.LOST;
    } else if (
      data.callStatus === 'CALLBACK' ||
      data.callStatus === 'CONNECTED' ||
      data.callStatus === 'CNR'
    ) {
      lead.status = LeadStatus.CONTACTED;
    }

    if (data.nextFollowUpDate) {
      lead.nextFollowUpDate = data.nextFollowUpDate;
    }

    if (data.callNotes) {
      lead.remarks = data.callNotes;
    }

    if (!lead.assignedTo && data.telecallerId) {
      lead.assignedTo = data.telecallerId;
    }

    await this.leadRepository.save(lead);

    if (
      (data.callStatus === 'CALLBACK' || data.callStatus === 'INTERESTED') &&
      data.telecallerId
    ) {
      const followUp = this.followUpRepository.create({
        leadId: data.leadId,
        assignedTo: data.telecallerId,
        followUpType:
          data.callStatus === 'INTERESTED'
            ? FollowUpType.CALL
            : FollowUpType.CALLBACK,
        note:
          data.callNotes ||
          (data.callStatus === 'INTERESTED'
            ? 'Interested follow-up created from telecalling'
            : 'Callback follow-up created from telecalling'),
        followUpDate:
          data.nextFollowUpDate ||
          new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: FollowUpStatus.PENDING,
      });

      await this.followUpRepository.save(followUp);
    }

    return savedLog;
  }

  async findAll() {
    return this.callLogRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findByLead(leadId: number) {
    return this.callLogRepository.find({
      where: { leadId },
      order: { createdAt: 'DESC' },
    });
  }

  async getNeverCalled() {
    const logs = await this.callLogRepository.find({
      select: ['leadId'],
    });

    const calledLeadIds = logs.map((log) => log.leadId);

    if (calledLeadIds.length === 0) {
      return this.leadRepository.find({
        order: { createdAt: 'DESC' },
      });
    }

    return this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.id NOT IN (:...ids)', { ids: calledLeadIds })
      .orderBy('lead.createdAt', 'DESC')
      .getMany();
  }

  async getByCallStatus(callStatus: string) {
    return this.callLogRepository.find({
      where: { callStatus },
      order: { createdAt: 'DESC' },
    });
  }

  async getTodayFollowUps() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.followUpRepository.find({
      where: {
        followUpDate: Between(start, end),
        status: In([FollowUpStatus.PENDING]),
      },
      order: { followUpDate: 'ASC' },
    });
  }

  async getByTelecaller(telecallerId: number) {
    return this.callLogRepository.find({
      where: { telecallerId },
      order: { createdAt: 'DESC' },
    });
  }

  async getNeverCalledByTelecaller(telecallerId: number) {
    const visibleLeads = await this.leadRepository
      .createQueryBuilder('lead')
      .where('(lead.assignedTo = :assignedTo OR lead.assignedTo IS NULL)', {
        assignedTo: telecallerId,
      })
      .orderBy('lead.createdAt', 'DESC')
      .getMany();

    if (visibleLeads.length === 0) {
      return [];
    }

    const logs = await this.callLogRepository.find({
      where: { telecallerId },
      select: ['leadId'],
    });

    const calledLeadIds = logs.map((log) => log.leadId);

    if (calledLeadIds.length === 0) {
      return visibleLeads;
    }

    return visibleLeads.filter((lead) => !calledLeadIds.includes(lead.id));
  }

  async getByCallStatusAndTelecaller(callStatus: string, telecallerId: number) {
    return this.callLogRepository.find({
      where: { callStatus, telecallerId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTodayFollowUpsByTelecaller(telecallerId: number) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.followUpRepository.find({
      where: {
        assignedTo: telecallerId,
        followUpDate: Between(start, end),
        status: In([FollowUpStatus.PENDING]),
      },
      order: { followUpDate: 'ASC' },
    });
  }

  async findByLeadProtected(leadId: number, user: any) {
    const lead = await this.leadRepository.findOne({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (user?.role === 'TELECALLER') {
      if (lead.assignedTo !== null && lead.assignedTo !== undefined && lead.assignedTo !== user.id) {
        throw new ForbiddenException('You can only access your available or assigned leads');
      }
    }

    if (user?.role === 'PROJECT_MANAGER') {
      const allowedStatuses = [
        LeadStatus.INTERESTED,
        LeadStatus.SITE_VISIT,
        LeadStatus.QUOTATION,
        LeadStatus.NEGOTIATION,
        LeadStatus.WON,
      ];

      if (!allowedStatuses.includes(lead.status)) {
        throw new ForbiddenException('You can only access qualified pipeline leads');
      }
    }

    return this.findByLead(leadId);
  }

  async reviewCall(
    callId: number,
    data: { reviewStatus: CallReviewStatus; reviewNotes?: string },
    user: any,
  ) {
    if (!(user?.role === 'OWNER' || user?.role === 'PROJECT_MANAGER')) {
      throw new ForbiddenException('Only owner or project manager can review call recordings');
    }

    const callLog = await this.callLogRepository.findOne({
      where: { id: callId },
    });

    if (!callLog) {
      throw new NotFoundException('Call log not found');
    }

    callLog.reviewStatus = data.reviewStatus;
    callLog.reviewNotes = data.reviewNotes || '';

    return this.callLogRepository.save(callLog);
  }

  async getReviewQueue(user: any) {
    if (!(user?.role === 'OWNER' || user?.role === 'PROJECT_MANAGER')) {
      throw new ForbiddenException('Only owner or project manager can access review queue');
    }

    return this.callLogRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
    async getPerformance() {
    return this.callLogRepository
      .createQueryBuilder('call')
      .select('call.telecallerId', 'telecallerId')
      .addSelect('COUNT(*)', 'totalCalls')
      .addSelect(
        `SUM(CASE WHEN call.callStatus = 'INTERESTED' THEN 1 ELSE 0 END)`,
        'interested',
      )
      .groupBy('call.telecallerId')
      .getRawMany();
  }
}
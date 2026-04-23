import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, LeadStatus } from './lead.entity';
import {
  FollowUp,
  FollowUpStatus,
  FollowUpType,
} from '../followup/follow-up.entity';
import { CallLog } from '../telecalling/call-log.entity';
import { LeadNote } from './lead-note.entity';
import { UserRole } from '../users/user.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,

    @InjectRepository(FollowUp)
    private readonly followUpRepository: Repository<FollowUp>,

    @InjectRepository(CallLog)
    private readonly callLogRepository: Repository<CallLog>,

    @InjectRepository(LeadNote)
    private readonly leadNoteRepository: Repository<LeadNote>,
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

  private hasAnyRole(user: any, roles: string[]) {
    const currentRoles = this.getRoles(user);
    return roles.some((role) => currentRoles.includes(role));
  }

  private isOwner(user: any) {
    return this.hasAnyRole(user, [UserRole.OWNER]);
  }

  private isLeadManager(user: any) {
    return this.hasAnyRole(user, [UserRole.LEAD_MANAGER]);
  }

  private isTelecaller(user: any) {
    return this.hasAnyRole(user, [UserRole.TELECALLER]);
  }

  private isLeadExecutive(user: any) {
    return this.hasAnyRole(user, [UserRole.LEAD_EXECUTIVE]);
  }

  private isMeetingManager(user: any) {
    return this.hasAnyRole(user, [UserRole.MEETING_MANAGER]);
  }

  private isProjectManager(user: any) {
    return this.hasAnyRole(user, [UserRole.PROJECT_MANAGER]);
  }

  private isProjectExecutive(user: any) {
    return this.hasAnyRole(user, [UserRole.PROJECT_EXECUTIVE]);
  }

  private isMarketingHead(user: any) {
    return this.hasAnyRole(user, [UserRole.MARKETING_HEAD]);
  }

  private isTelecallingManager(user: any) {
    return this.hasAnyRole(user, [UserRole.TELECALLING_MANAGER]);
  }

  private isOwnOnlyLeadRole(user: any) {
    return this.hasAnyRole(user, [
      UserRole.TELECALLER,
      UserRole.LEAD_EXECUTIVE,
      UserRole.MEETING_MANAGER,
      UserRole.PROJECT_EXECUTIVE,
    ]);
  }

  private getCurrentUserId(user: any) {
    return Number(user?.id ?? user?.sub);
  }

  private getCurrentUserName(user: any) {
    return user?.name || user?.email || 'Unknown User';
  }

  private normalizePotentialPercentage(value: any) {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return undefined;
    }

    const allowedValues = [15, 50, 75];

    if (!allowedValues.includes(numericValue)) {
      throw new BadRequestException(
        'Potential percentage must be one of 15, 50, or 75',
      );
    }

    return numericValue;
  }

  private getProjectPipelineStatuses() {
    return [
      LeadStatus.INTERESTED,
      LeadStatus.SITE_VISIT,
      LeadStatus.QUOTATION,
      LeadStatus.NEGOTIATION,
      LeadStatus.WON,
    ];
  }

  private async getAccessibleLead(id: number, user: any) {
    const lead = await this.leadRepository.findOne({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const currentUserId = this.getCurrentUserId(user);

    const canAccessDirectly =
      this.isOwner(user) ||
      this.isLeadManager(user) ||
      this.isMarketingHead(user) ||
      this.isTelecallingManager(user) ||
      lead.createdBy === currentUserId ||
      lead.assignedTo === currentUserId;

    if (canAccessDirectly) {
      return lead;
    }

    if (this.isTelecaller(user) || this.isLeadExecutive(user)) {
      if (
        lead.assignedTo !== null &&
        lead.assignedTo !== undefined &&
        lead.assignedTo !== currentUserId
      ) {
        throw new ForbiddenException(
          'You can only access your available or assigned leads',
        );
      }

      return lead;
    }

    if (this.isMeetingManager(user) || this.isProjectExecutive(user)) {
      if (lead.assignedTo !== currentUserId && lead.createdBy !== currentUserId) {
        throw new ForbiddenException('You can only access your own related leads');
      }

      return lead;
    }

    if (this.isProjectManager(user)) {
      const allowedStatuses = this.getProjectPipelineStatuses();

      if (!allowedStatuses.includes(lead.status)) {
        throw new ForbiddenException(
          'You can only access qualified pipeline leads',
        );
      }

      return lead;
    }

    throw new ForbiddenException('You do not have access to this lead');
  }

  async create(data: Partial<Lead>, user: any) {
    const existing = await this.leadRepository.findOne({
      where: { phone: data.phone },
    });

    if (existing) {
      throw new BadRequestException('Lead with this phone already exists');
    }

    const currentUserId = this.getCurrentUserId(user);
    const currentUserName = this.getCurrentUserName(user);

        let leadData: Partial<Lead> = {
      ...data,
      createdBy: currentUserId,
      createdByName: currentUserName,
      originTelecallerId:
        (data as any).originTelecallerId !== undefined &&
        (data as any).originTelecallerId !== null
          ? Number((data as any).originTelecallerId)
          : this.isTelecaller(user)
          ? currentUserId
          : undefined,
      originTelecallerName:
        (data as any).originTelecallerName || (this.isTelecaller(user) ? currentUserName : undefined),
      potentialPercentage:
        data.potentialPercentage !== undefined &&
        data.potentialPercentage !== null
          ? this.normalizePotentialPercentage(data.potentialPercentage)
          : 15,
    };

    if (this.isTelecaller(user) || this.isLeadExecutive(user)) {
      leadData = {
        ...leadData,
        assignedTo: currentUserId,
      };
    }

    const lead = this.leadRepository.create(leadData);
    return this.leadRepository.save(lead);
  }

  async findAll(filters: any, user: any) {
    const query = this.leadRepository.createQueryBuilder('lead');
        query.andWhere('COALESCE(lead.isArchived, false) = false');
    const currentUserId = this.getCurrentUserId(user);

    if (this.isTelecaller(user) || this.isLeadExecutive(user)) {
      query.andWhere(
        '(lead.assignedTo = :assignedTo OR lead.assignedTo IS NULL)',
        { assignedTo: currentUserId },
      );
    } else if (this.isMeetingManager(user) || this.isProjectExecutive(user)) {
      query.andWhere(
        '(lead.assignedTo = :currentUserId OR lead.createdBy = :currentUserId)',
        { currentUserId },
      );
    } else if (this.isProjectManager(user)) {
      query.andWhere('lead.status IN (:...statuses)', {
        statuses: this.getProjectPipelineStatuses(),
      });
    } else if (this.isLeadManager(user)) {
  query.andWhere(
    '(lead.assignedTo = :currentUserId OR lead.createdBy = :currentUserId)',
    { currentUserId }
  );
}

    if (filters?.status) {
      query.andWhere('lead.status = :status', { status: filters.status });
    }

    if (filters?.phone) {
      query.andWhere('lead.phone ILIKE :phone', {
        phone: `%${filters.phone}%`,
      });
    }

    if (filters?.city) {
      query.andWhere('lead.city = :city', { city: filters.city });
    }

    if (filters?.zone) {
      query.andWhere('lead.zone = :zone', { zone: filters.zone });
    }

    if (filters?.region) {
      query.andWhere('lead.region = :region', { region: filters.region });
    }

    if (filters?.potentialPercentage) {
      query.andWhere('lead.potentialPercentage = :potentialPercentage', {
        potentialPercentage: Number(filters.potentialPercentage),
      });
    }

    if (filters?.search) {
      query.andWhere(
        `(lead.name ILIKE :search OR lead.phone ILIKE :search OR lead.email ILIKE :search OR lead.city ILIKE :search)`,
        { search: `%${filters.search}%` },
      );
    }

    return query.orderBy('lead.createdAt', 'DESC').getMany();
  }

  async findOne(id: number, user: any) {
    return this.getAccessibleLead(id, user);
  }

  async getLeadHistory(id: number, user: any) {
    const lead = await this.getAccessibleLead(id, user);

    const [callLogs, followUps, notes] = await Promise.all([
      this.callLogRepository.find({
        where: { leadId: id },
        order: { createdAt: 'DESC' },
      }),
      this.followUpRepository.find({
        where: { leadId: id },
        order: { createdAt: 'DESC' },
      }),
      this.leadNoteRepository.find({
        where: { leadId: id },
        order: { createdAt: 'DESC' },
      }),
    ]);

    const timeline: Array<{
      type: 'LEAD_CREATED' | 'CALL_LOG' | 'FOLLOWUP' | 'NOTE';
      timestamp: Date;
      title: string;
      description: string;
      meta?: Record<string, any>;
      noteId?: number;
    }> = [];

    timeline.push({
      type: 'LEAD_CREATED',
      timestamp: lead.createdAt,
      title: 'Lead Created',
      description: `Lead created by ${lead.createdByName || 'Unknown User'}`,
      meta: {
        leadOwner: lead.createdByName || '-',
        currentStatus: lead.status,
        potentialPercentage: lead.potentialPercentage || 15,
        currentRemarks: lead.remarks || '',
      },
    });

    for (const call of callLogs) {
      timeline.push({
        type: 'CALL_LOG',
        timestamp: call.createdAt,
        title: `Call ${call.callStatus || ''}`.trim(),
        description: call.callNotes || 'Call log recorded',
        meta: {
          telecallerId: call.telecallerId,
          reviewStatus: call.reviewStatus,
          nextFollowUpDate: call.nextFollowUpDate || null,
        },
      });
    }

    for (const followUp of followUps) {
      timeline.push({
        type: 'FOLLOWUP',
        timestamp: followUp.createdAt,
        title: `Follow-up ${followUp.status || ''}`.trim(),
        description:
          followUp.note || followUp.remarks || 'Follow-up activity recorded',
        meta: {
          followUpType: followUp.followUpType,
          followUpDate: followUp.followUpDate,
          assignedTo: followUp.assignedTo,
        },
      });
    }

    for (const note of notes) {
      timeline.push({
        type: 'NOTE',
        timestamp: note.updatedAt || note.createdAt,
        title: `Note by ${note.createdByName || 'Unknown User'}`,
        description: note.note,
        noteId: note.id,
        meta: {
          createdBy: note.createdByName || '-',
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        },
      });
    }

    timeline.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return {
      lead: {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        city: lead.city,
        zone: lead.zone,
        status: lead.status,
        potentialPercentage: lead.potentialPercentage || 15,
        leadOwnerName: lead.createdByName || '-',
        assignedTo: lead.assignedTo,
        remarks: lead.remarks || '',
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      },
      timeline,
    };
  }

  async addLeadNote(id: number, note: string, user: any) {
    const lead = await this.getAccessibleLead(id, user);

    if (!note || !String(note).trim()) {
      throw new BadRequestException('Note is required');
    }

    const item = this.leadNoteRepository.create({
      leadId: lead.id,
      note: String(note).trim(),
      createdBy: this.getCurrentUserId(user),
      createdByName: this.getCurrentUserName(user),
    });

    return this.leadNoteRepository.save(item);
  }

  async updateLeadNote(
    id: number,
    noteId: number,
    note: string,
    user: any,
  ) {
    await this.getAccessibleLead(id, user);

    if (!note || !String(note).trim()) {
      throw new BadRequestException('Note is required');
    }

    const existingNote = await this.leadNoteRepository.findOne({
      where: { id: noteId, leadId: id },
    });

    if (!existingNote) {
      throw new NotFoundException('Lead note not found');
    }

    existingNote.note = String(note).trim();
    return this.leadNoteRepository.save(existingNote);
  }

  async findByAssignedUser(userId: number, user: any) {
    const currentUserId = this.getCurrentUserId(user);

    if (
      (this.isTelecaller(user) || this.isLeadExecutive(user)) &&
      currentUserId !== userId
    ) {
      throw new ForbiddenException('You can only access your assigned leads');
    }

    if (this.isMeetingManager(user) || this.isProjectExecutive(user)) {
      if (currentUserId !== userId) {
        throw new ForbiddenException('You can only access your own related leads');
      }
    }

    if (this.isProjectManager(user)) {
      throw new ForbiddenException(
        'Project manager cannot access assigned lead buckets directly',
      );
    }

    return this.leadRepository.find({
      where: { assignedTo: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, data: Partial<Lead>, user: any) {
    const lead = await this.leadRepository.findOne({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    await this.getAccessibleLead(id, user);

    const currentUserId = this.getCurrentUserId(user);
    const currentUserName = this.getCurrentUserName(user);

    if (data.potentialPercentage !== undefined) {
      data.potentialPercentage = this.normalizePotentialPercentage(
        data.potentialPercentage,
      );
    }

    if (this.isTelecaller(user) || this.isLeadExecutive(user)) {
      if (
        lead.assignedTo !== null &&
        lead.assignedTo !== undefined &&
        lead.assignedTo !== currentUserId
      ) {
        throw new ForbiddenException(
          'You can only update your available or assigned leads',
        );
      }

      if (data.assignedTo !== undefined) {
        delete data.assignedTo;
      }

      if (!lead.assignedTo) {
        lead.assignedTo = currentUserId;
      }
    }

    if (this.isMeetingManager(user) || this.isProjectExecutive(user)) {
      if (data.assignedTo !== undefined) {
        delete data.assignedTo;
      }
    }

    if (this.isProjectManager(user)) {
      const allowedFields: Partial<Lead> = {
        status: data.status,
        remarks: data.remarks,
        nextFollowUpDate: data.nextFollowUpDate,
        potentialPercentage: data.potentialPercentage,
      };

      Object.assign(lead, allowedFields);
    } else {
      Object.assign(lead, data);
    }

    const updatedLead = await this.leadRepository.save(lead);

        if (data.nextFollowUpDate && updatedLead.assignedTo) {
      const followUp = this.followUpRepository.create({
        leadId: updatedLead.id,
        assignedTo: updatedLead.assignedTo,
        createdBy: currentUserId,
        createdByName: currentUserName,
        sourceModule: 'LEAD',
        sourceStage: 'LEAD_UPDATE',
        followUpType: FollowUpType.GENERAL,
        note: updatedLead.remarks || 'Follow-up created from lead update',
        followUpDate: data.nextFollowUpDate,
        status: FollowUpStatus.PENDING,
      });

      await this.followUpRepository.save(followUp);
    }

    return updatedLead;
  }

  async assignLead(id: number, assignedTo: number) {
    const lead = await this.leadRepository.findOne({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    lead.assignedTo = assignedTo;
    return this.leadRepository.save(lead);
  }

  async assignBulk(body: { leadIds: number[]; assignedTo: number }) {
    const leadIds = Array.isArray(body?.leadIds)
      ? body.leadIds.map(Number).filter((id) => Number.isFinite(id) && id > 0)
      : [];

    const assignedTo = Number(body?.assignedTo);

    if (!leadIds.length) {
      throw new BadRequestException('No leads selected for bulk assignment');
    }

    if (!assignedTo || Number.isNaN(assignedTo)) {
      throw new BadRequestException('Assigned user is required');
    }

    await this.leadRepository.update(leadIds, { assignedTo });

    return {
      message: `Assigned ${leadIds.length} leads successfully`,
      count: leadIds.length,
    };
  }

  async exportCsv(user: any) {
    let leads: Lead[];
    const currentUserId = this.getCurrentUserId(user);

    if (this.isTelecaller(user) || this.isLeadExecutive(user)) {
      leads = await this.leadRepository.find({
        where: [{ assignedTo: currentUserId }, { assignedTo: null as any }],
        order: { createdAt: 'DESC' },
      });
    } else if (this.isMeetingManager(user) || this.isProjectExecutive(user)) {
      leads = await this.leadRepository.find({
        where: [
          { assignedTo: currentUserId },
          { createdBy: currentUserId },
        ],
        order: { createdAt: 'DESC' },
      });
    } else if (this.isProjectManager(user)) {
      leads = await this.leadRepository
        .createQueryBuilder('lead')
        .where('lead.status IN (:...statuses)', {
          statuses: this.getProjectPipelineStatuses(),
        })
        .orderBy('lead.createdAt', 'DESC')
        .getMany();
    } else {
      leads = await this.leadRepository.find({
        order: { createdAt: 'DESC' },
      });
    }

    const headers = [
      'id',
      'name',
      'phone',
      'alternatePhone',
      'email',
      'address',
      'city',
      'state',
      'zone',
      'region',
      'source',
      'status',
      'assignedTo',
      'createdBy',
      'createdByName',
      'potentialPercentage',
      'remarks',
      'nextFollowUpDate',
      'createdAt',
      'updatedAt',
    ];

    const escapeCsv = (value: any) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    };

    const rows = leads.map((lead) =>
      [
        lead.id,
        lead.name,
        lead.phone,
        lead.alternatePhone,
        lead.email,
        lead.address,
        lead.city,
        lead.state,
        lead.zone,
        lead.region,
        lead.source,
        lead.status,
        lead.assignedTo,
        lead.createdBy,
        lead.createdByName,
        lead.potentialPercentage,
        lead.remarks,
        lead.nextFollowUpDate
          ? new Date(lead.nextFollowUpDate).toISOString()
          : '',
        lead.createdAt ? new Date(lead.createdAt).toISOString() : '',
        lead.updatedAt ? new Date(lead.updatedAt).toISOString() : '',
      ]
        .map(escapeCsv)
        .join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }

  async importCsv(file: any, user: any) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    if (!(this.isOwner(user) || this.isLeadManager(user))) {
      throw new ForbiddenException(
        'Only owner or lead manager can import CSV',
      );
    }

    const content = file.buffer.toString('utf-8').trim();

    if (!content) {
      throw new BadRequestException('CSV file is empty');
    }

    const lines = content
      .split(/\r?\n/)
      .map((line: string) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new BadRequestException(
        'CSV must contain header row and at least one data row',
      );
    }

    const parseCsvLine = (line: string): string[] => {
      const values: string[] = [];
      let current = '';
      let insideQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (insideQuotes && nextChar === '"') {
            current += '"';
            i++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      values.push(current.trim());
      return values;
    };

    const headers = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, ''));

    const normalizeValue = (value?: string) => {
      if (!value) return '';
      return value.replace(/^"|"$/g, '').trim();
    };

    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const rowValues = parseCsvLine(lines[i]);
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = normalizeValue(rowValues[index]);
      });

      const name = row.name;
      const phone = row.phone;

      if (!name || !phone) {
        skippedCount++;
        continue;
      }

      const existing = await this.leadRepository.findOne({
        where: { phone },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      const validStatuses = Object.values(LeadStatus);
      const status = validStatuses.includes(row.status as LeadStatus)
        ? (row.status as LeadStatus)
        : LeadStatus.NEW;

      const leadData: Partial<Lead> = {
        name,
        phone,
        alternatePhone: row.alternatePhone || undefined,
        email: row.email || undefined,
        address: row.address || undefined,
        city: row.city || undefined,
        state: row.state || undefined,
        zone: row.zone || undefined,
        region: row.region || undefined,
        source: row.source || undefined,
        status,
        assignedTo: row.assignedTo ? Number(row.assignedTo) : undefined,
        createdBy: this.getCurrentUserId(user),
        createdByName: this.getCurrentUserName(user),
        potentialPercentage: row.potentialPercentage
          ? this.normalizePotentialPercentage(row.potentialPercentage)
          : 15,
        remarks: row.remarks || undefined,
        nextFollowUpDate: row.nextFollowUpDate
          ? new Date(row.nextFollowUpDate)
          : undefined,
      };

      const lead = this.leadRepository.create(leadData);
      await this.leadRepository.save(lead);
      importedCount++;
    }

    return {
      message: 'CSV import completed',
      importedCount,
      skippedCount,
    };
  }

  async getHotLeads(user: any) {
    const query = this.leadRepository.createQueryBuilder('lead');

    query.andWhere('lead.status IN (:...statuses)', {
      statuses: [LeadStatus.INTERESTED, LeadStatus.CONTACTED],
    });

    const currentUserId = this.getCurrentUserId(user);

    if (this.isTelecaller(user) || this.isLeadExecutive(user)) {
      query.andWhere(
        '(lead.assignedTo = :assignedTo OR lead.assignedTo IS NULL)',
        {
          assignedTo: currentUserId,
        },
      );
    } else if (this.isMeetingManager(user) || this.isProjectExecutive(user)) {
      query.andWhere(
        '(lead.assignedTo = :currentUserId OR lead.createdBy = :currentUserId)',
        { currentUserId },
      );
    } else if (this.isProjectManager(user)) {
      query.andWhere('lead.status IN (:...projectStatuses)', {
        projectStatuses: this.getProjectPipelineStatuses(),
      });
    }

    return query.orderBy('lead.updatedAt', 'DESC').take(10).getMany();
  }

    async quickCall(
    id: number,
    body: {
      callStatus?: string;
      callNotes?: string;
      nextFollowUpDate?: string;
      leadPotential?: string;
    },
    user: any,
  ) {
    const lead = await this.getAccessibleLead(id, user);

    const currentUserId = this.getCurrentUserId(user);
    const currentUserName = this.getCurrentUserName(user);

    const callStatus = String(body.callStatus || 'CONNECTED').trim().toUpperCase();
    const callNotes = String(body.callNotes || '').trim();
    const leadPotential = String(body.leadPotential || '').trim().toUpperCase() || undefined;

    const nextFollowUpDate = body.nextFollowUpDate
      ? new Date(body.nextFollowUpDate)
      : undefined;

    const callLog = this.callLogRepository.create({
      leadId: lead.id,
      telecallerId: currentUserId,
      callStatus,
      callNotes: callNotes || undefined,
      nextFollowUpDate,
      providerName: 'MANUAL' as any,
      callDirection: 'OUTBOUND' as any,
      disposition: callStatus,
      leadPotential,
      receiverNumber: lead.phone || undefined,
    });

    await this.callLogRepository.save(callLog);

    if (callStatus === 'INTERESTED') {
      lead.status = LeadStatus.INTERESTED;
    } else if (callStatus === 'NOT_INTERESTED') {
      lead.status = LeadStatus.LOST;
    } else if (
      callStatus === 'CALLBACK' ||
      callStatus === 'CONNECTED' ||
      callStatus === 'CNR' ||
      callStatus === 'PROPOSAL_SENT'
    ) {
      lead.status = LeadStatus.CONTACTED;
    }

    if (callNotes) {
      lead.remarks = callNotes;
    }

    if (nextFollowUpDate) {
      lead.nextFollowUpDate = nextFollowUpDate;
    }

    if (leadPotential) {
      if (leadPotential === 'HIGH') {
        lead.potentialPercentage = 75;
      } else if (leadPotential === 'MEDIUM') {
        lead.potentialPercentage = 50;
      } else if (leadPotential === 'LOW') {
        lead.potentialPercentage = 15;
      }
    }

    if (!lead.assignedTo) {
      lead.assignedTo = currentUserId;
    }

    await this.leadRepository.save(lead);

    if (nextFollowUpDate && lead.assignedTo) {
      const followUp = this.followUpRepository.create({
        leadId: lead.id,
        assignedTo: lead.assignedTo,
        createdBy: currentUserId,
        createdByName: currentUserName,
        sourceModule: 'LEAD',
        sourceStage: 'QUICK_CALL',
        followUpType:
          callStatus === 'CALLBACK'
            ? FollowUpType.CALLBACK
            : callStatus === 'INTERESTED'
            ? FollowUpType.CALL
            : FollowUpType.GENERAL,
        note:
          callNotes ||
          (callStatus === 'INTERESTED'
            ? 'Interested follow-up created from lead quick call'
            : callStatus === 'CALLBACK'
            ? 'Callback follow-up created from lead quick call'
            : 'Follow-up created from lead quick call'),
        followUpDate: nextFollowUpDate,
        status: FollowUpStatus.PENDING,
      });

      await this.followUpRepository.save(followUp);
    }

    return {
      message: 'Lead quick call saved successfully',
    };
  }

    async archiveLead(id: number, user: any) {
    const lead = await this.getAccessibleLead(id, user);

    if (!this.isOwner(user) && !this.isLeadManager(user)) {
      throw new ForbiddenException('Not allowed to archive lead');
    }

    lead.isArchived = true;

    await this.leadRepository.save(lead);

    return { message: 'Lead archived successfully' };
  }
async getArchivedLeads(user: any) {
  const currentUserId = this.getCurrentUserId(user);

  const query = this.leadRepository
    .createQueryBuilder('lead')
    .where('COALESCE(lead.isArchived, false) = true');

  if (this.isLeadManager(user)) {
    query.andWhere(
      '(lead.assignedTo = :currentUserId OR lead.createdBy = :currentUserId)',
      { currentUserId }
    );
  }

  return query.orderBy('lead.createdAt', 'DESC').getMany();
}

async restoreLead(id: number, user: any) {
  const lead = await this.getAccessibleLead(id, user);

  if (!this.isOwner(user) && !this.isLeadManager(user)) {
    throw new ForbiddenException('Not allowed to restore lead');
  }

  lead.isArchived = false;

  await this.leadRepository.save(lead);

  return { message: 'Lead restored successfully' };
}

}
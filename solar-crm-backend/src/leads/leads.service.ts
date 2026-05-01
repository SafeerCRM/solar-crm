import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Lead, LeadStatus } from './lead.entity';
import { LeadStorage, LeadStoragePotential } from './lead-storage.entity';
import {
  FollowUp,
  FollowUpStatus,
  FollowUpType,
} from '../followup/follow-up.entity';
import { CallLog } from '../telecalling/call-log.entity';
import { LeadNote } from './lead-note.entity';
import { UserRole } from '../users/user.entity';
import * as XLSX from 'xlsx';
import { User } from '../users/user.entity';

@Injectable()
export class LeadsService {
  constructor(
  @InjectRepository(Lead)
  private readonly leadRepository: Repository<Lead>,

  @InjectRepository(User)
  private readonly userRepository: Repository<User>,

  @InjectRepository(FollowUp)
  private readonly followUpRepository: Repository<FollowUp>,

  @InjectRepository(CallLog)
  private readonly callLogRepository: Repository<CallLog>,

  @InjectRepository(LeadNote)
  private readonly leadNoteRepository: Repository<LeadNote>,

  @InjectRepository(LeadStorage)
  private readonly leadStorageRepository: Repository<LeadStorage>,
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

  private isTelecallingAssistant(user: any) {
  return this.hasAnyRole(user, ['TELECALLING_ASSISTANT' as any]);
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
  lead.assignedTo === currentUserId ||
  lead.originTelecallerId === currentUserId;

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
    assignedTo:
      data.assignedTo !== undefined && data.assignedTo !== null
        ? Number(data.assignedTo)
        : currentUserId,
  };
}

    const lead = this.leadRepository.create(leadData);
    return this.leadRepository.save(lead);
  }

  async findAll(filters: any, user: any) {
  const page = Math.max(Number(filters?.page || 1), 1);
  const limit = Math.min(Math.max(Number(filters?.limit || 50), 1), 200);
  const skip = (page - 1) * limit;

  const query = this.leadRepository.createQueryBuilder('lead');

  query.andWhere('COALESCE(lead.isArchived, false) = false');

  const currentUserId = this.getCurrentUserId(user);

  if (this.isTelecaller(user)) {
  query.andWhere(
    `(
      lead.originTelecallerId = :currentUserId
      OR lead.createdBy = :currentUserId
      OR lead.assignedTo = :currentUserId
    )`,
    { currentUserId },
  );
} else if (this.isLeadExecutive(user)) {
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
      { currentUserId },
    );
  }

  else if (this.isTelecallingAssistant(user)) {
  query.andWhere('lead.createdBy = :currentUserId', {
    currentUserId,
  });
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
    query.andWhere(
      '(lead.city ILIKE :city OR lead.zone ILIKE :city OR lead.address ILIKE :city)',
      { city: `%${filters.city}%` },
    );
  }

  if (filters?.zone) {
    query.andWhere('lead.zone ILIKE :zone', { zone: `%${filters.zone}%` });
  }

  if (filters?.region) {
    query.andWhere('lead.region ILIKE :region', {
      region: `%${filters.region}%`,
    });
  }

  if (filters?.potentialPercentage) {
    query.andWhere('lead.potentialPercentage = :potentialPercentage', {
      potentialPercentage: Number(filters.potentialPercentage),
    });
  }

  if (filters?.search) {
    query.andWhere(
      `(lead.name ILIKE :search 
        OR lead.phone ILIKE :search 
        OR lead.email ILIKE :search 
        OR lead.city ILIKE :search
        OR lead.zone ILIKE :search
        OR lead.address ILIKE :search)`,
      { search: `%${filters.search}%` },
    );
  }

  const [data, total] = await query
    .orderBy('lead.createdAt', 'DESC')
    .skip(skip)
    .take(limit)
    .getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
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
    take: 50,
  }),
  this.followUpRepository.find({
    where: { leadId: id },
    order: { createdAt: 'DESC' },
    take: 50,
  }),
  this.leadNoteRepository.find({
    where: { leadId: id },
    order: { createdAt: 'DESC' },
    take: 50,
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

    if (lead.status === LeadStatus.NOT_INTERESTED) {
  lead.isArchived = true;
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
        take: 5000,
      });
    } else if (this.isMeetingManager(user) || this.isProjectExecutive(user)) {
      leads = await this.leadRepository.find({
        where: [
          { assignedTo: currentUserId },
          { createdBy: currentUserId },
        ],
        order: { createdAt: 'DESC' },
        take: 5000,
      });
    } else if (this.isProjectManager(user)) {
      leads = await this.leadRepository
  .createQueryBuilder('lead')
  .where('lead.status IN (:...statuses)', {
    statuses: this.getProjectPipelineStatuses(),
  })
  .orderBy('lead.createdAt', 'DESC')
  .take(5000)
  .getMany();
    } else {
      leads = await this.leadRepository.find({
        order: { createdAt: 'DESC' },
        take: 5000,
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
    throw new BadRequestException('File is required');
  }

  if (!this.isOwner(user)) {
    throw new ForbiddenException('Only owner can import leads to storage');
  }

  const fileName = String(file.originalname || '').toLowerCase();

  let rows: Record<string, any>[] = [];

  const normalizeHeader = (value: any) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
      const normalizePhone = (phone: any) => {
  return String(phone || '')
    .replace(/\D/g, '')
    .slice(-10);
};

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
  const XLSX = await import('xlsx');

  const workbook = XLSX.read(file.buffer, { type: 'buffer' });

  if (!workbook.SheetNames.length) {
    throw new BadRequestException('Excel file has no sheets');
  }

  const allRows: Record<string, any>[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) continue;

    const rawRows = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
    }) as Record<string, any>[];

    const normalizedRows = rawRows.map((row) => {
      const normalizedRow: Record<string, any> = {};

      Object.keys(row).forEach((key) => {
        normalizedRow[normalizeHeader(key)] = row[key];
      });

      return normalizedRow;
    });

    allRows.push(...normalizedRows);
  }

  rows = allRows;
} else {
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

    const headers = parseCsvLine(lines[0]).map((header) =>
      normalizeHeader(header.replace(/^"|"$/g, '')),
    );

    const normalizeValue = (value?: string) => {
      if (!value) return '';
      return value.replace(/^"|"$/g, '').trim();
    };

    for (let i = 1; i < lines.length; i++) {
      const rowValues = parseCsvLine(lines[i]);
      const row: Record<string, any> = {};

      headers.forEach((header, index) => {
        row[header] = normalizeValue(rowValues[index]);
      });

      rows.push(row);
    }
  }

  if (!rows.length) {
    throw new BadRequestException('File does not contain any valid rows');
  }

  const getValue = (row: Record<string, any>, keys: string[]) => {
    for (const key of keys) {
      const normalizedKey = normalizeHeader(key);
      const value = row[normalizedKey];

      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value).trim();
      }
    }

    return '';
  };

  const normalizePotential = (value: string): LeadStoragePotential => {
    const normalized = String(value || '').trim().toUpperCase();

    if (normalized === 'HIGH') return LeadStoragePotential.HIGH;
    if (normalized === 'MEDIUM') return LeadStoragePotential.MEDIUM;
    return LeadStoragePotential.LOW;
  };

  let importedCount = 0;
  let skippedCount = 0;
  let duplicateCount = 0;

  const parsedRows = rows.map((row) => {
    const name = getValue(row, [
      'name',
      'customer name',
      'customer',
      'consumer name',
      'lead name',
    ]);

    const rawPhone = getValue(row, [
  'phone',
  'mobile',
  'mobile number',
  'contact',
  'contact number',
  'phone number',
]);

const phone = normalizePhone(rawPhone);

    const alternatePhone = getValue(row, [
      'alternate phone',
      'alternate mobile',
      'alternate number',
      'alt phone',
    ]);

    const email = getValue(row, ['email', 'email address']);
    const city = getValue(row, ['city', 'location', 'town']);
    const state = getValue(row, ['state']);
    const zone = getValue(row, ['zone']);
    const region = getValue(row, ['region']);
    const address = getValue(row, ['address']);
    const source = getValue(row, ['source']);
    const remarks = getValue(row, ['remarks', 'remark', 'notes']);
    const leadPotential = getValue(row, [
  'lead potential',
  'Lead Potential',
  'LEAD POTENTIAL',
  'potential',
  'Potential',
  'POTENTIAL',
  'leadpotential',
  'lead_potential',
  'lead Potential',
]);

    return {
      name,
      phone,
      alternatePhone,
      email,
      city,
      state,
      zone,
      region,
      address,
      source,
      remarks,
      leadPotential: normalizePotential(leadPotential),
    };
  });

  const validRows = parsedRows.filter((row) => {
    if (!row.name || !row.phone) {
      skippedCount++;
      return false;
    }

    return true;
  });

  const incomingPhoneSet = new Set<string>();

  const uniqueRows = validRows.filter((row) => {
    const phone = String(row.phone || '').trim();

    if (incomingPhoneSet.has(phone)) {
      duplicateCount++;
      skippedCount++;
      return false;
    }

    incomingPhoneSet.add(phone);
    return true;
  });

  const incomingPhones = uniqueRows.map((row) => row.phone).filter(Boolean);

  const existingLeads = incomingPhones.length
    ? await this.leadRepository.find({
        select: ['phone'],
        where: {
          phone: In(incomingPhones),
        },
      })
    : [];

  const existingStorageLeads = incomingPhones.length
    ? await this.leadStorageRepository.find({
        select: ['phone'],
        where: {
          phone: In(incomingPhones),
          isConverted: false,
        },
      })
    : [];

  const existingPhoneSet = new Set([
    ...existingLeads.map((lead) => String(lead.phone || '').trim()),
    ...existingStorageLeads.map((item) => String(item.phone || '').trim()),
  ]);

  const currentUserId = this.getCurrentUserId(user);
  const currentUserName = this.getCurrentUserName(user);

  const storageItems = uniqueRows
    .filter((row) => {
      if (existingPhoneSet.has(row.phone)) {
        duplicateCount++;
        skippedCount++;
        return false;
      }

      return true;
    })
    .map((row) =>
      this.leadStorageRepository.create({
        name: row.name,
        phone: row.phone,
        alternatePhone: row.alternatePhone || undefined,
        email: row.email || undefined,
        city: row.city || undefined,
        state: row.state || undefined,
        zone: row.zone || undefined,
        region: row.region || undefined,
        address: row.address || undefined,
        source: row.source || 'LEAD_IMPORT',
        remarks: row.remarks || undefined,
        leadPotential: row.leadPotential,
        importedBy: currentUserId,
        importedByName: currentUserName,
        isConverted: false,
      }),
    );

  if (storageItems.length > 0) {
  const chunkSize = 1000;

  for (let i = 0; i < storageItems.length; i += chunkSize) {
    const chunk = storageItems.slice(i, i + chunkSize);
    await this.leadStorageRepository.insert(chunk);
    importedCount += chunk.length;
  }
}

  return {
    message: 'File import completed. Imported data is available in Lead Storage.',
    importedCount,
    skippedCount,
    duplicateCount,
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

  async getLeadsForAutoCall(user: any) {
  const currentUserId = this.getCurrentUserId(user);

  const calledLeads = await this.callLogRepository.find({
  select: ['leadId'],
  where: { telecallerId: currentUserId },
  take: 1000,
});

  const calledIds = calledLeads
    .map((c) => c.leadId)
    .filter((id) => !!id);

  const qb = this.leadRepository.createQueryBuilder('lead');

  qb.where('COALESCE(lead.isArchived, false) = false');

  // ✅ IMPORTANT: respect role visibility
  if (this.isTelecaller(user) || this.isLeadExecutive(user)) {
    qb.andWhere(
      '(lead.assignedTo = :currentUserId OR lead.originTelecallerId = :currentUserId)',
      { currentUserId },
    );
  } else if (this.isLeadManager(user)) {
    qb.andWhere('lead.assignedTo = :currentUserId', { currentUserId });
  } else if (this.isMeetingManager(user) || this.isProjectExecutive(user)) {
    qb.andWhere(
      '(lead.assignedTo = :currentUserId OR lead.createdBy = :currentUserId)',
      { currentUserId },
    );
  } else if (this.isProjectManager(user)) {
    qb.andWhere('lead.status IN (:...statuses)', {
      statuses: this.getProjectPipelineStatuses(),
    });
  }

  // ✅ exclude already called leads for this user
  if (calledIds.length) {
    qb.andWhere('lead.id NOT IN (:...calledIds)', { calledIds });
  }

  qb.orderBy('lead.createdAt', 'DESC');

  return qb.take(300).getMany();
}

async assignLeadsByCount(
  assignCount: number,
  assignedTo: number,
  user: any,
) {
  if (!assignCount || assignCount <= 0) {
    throw new BadRequestException('Invalid assign count');
  }

  if (!assignedTo) {
    throw new BadRequestException('Lead manager is required');
  }

  const manager = await this.userRepository.findOne({
    where: { id: assignedTo },
  });

  if (!manager) {
    throw new NotFoundException('Lead manager not found');
  }

  if (!manager.roles?.includes(UserRole.LEAD_MANAGER)) {
    throw new BadRequestException('User must be a lead manager');
  }

  const qb = this.leadRepository.createQueryBuilder('lead');

  qb.where('COALESCE(lead.isArchived, false) = false');
  qb.andWhere('lead.assignedTo IS NULL');

  qb.orderBy('lead.createdAt', 'ASC');
  qb.take(Math.min(assignCount, 1000));

  const leads = await qb.getMany();

  if (!leads.length) {
    return { message: 'No unassigned leads available' };
  }

  const ids = leads.map((l) => l.id);

  await this.leadRepository
    .createQueryBuilder()
    .update()
    .set({ assignedTo })
    .whereInIds(ids)
    .execute();

  return {
    message: `Assigned ${ids.length} leads successfully`,
    assignedTo,
  };
}

async assignStorageLeadsByCount(
  assignCount: number,
  assignedTo: number,
  filters: any,
  user: any,
) {
  if (!assignCount || assignCount <= 0) {
    throw new BadRequestException('Invalid assign count');
  }

  if (!assignedTo) {
    throw new BadRequestException('Lead manager is required');
  }

  const manager = await this.userRepository.findOne({
    where: { id: assignedTo },
  });

  if (!manager) {
    throw new NotFoundException('Lead manager not found');
  }

  if (!manager.roles?.includes(UserRole.LEAD_MANAGER)) {
    throw new BadRequestException('User must be a lead manager');
  }

  const qb = this.leadStorageRepository.createQueryBuilder('storage');

  // ONLY UNCONVERTED STORAGE
  qb.where('storage.isConverted = false');

  // APPLY FILTERS
  if (filters?.city) {
    qb.andWhere('LOWER(storage.city) LIKE :city', {
      city: `%${filters.city.toLowerCase()}%`,
    });
  }

  if (filters?.potential) {
    qb.andWhere('storage.leadPotential = :potential', {
      potential: filters.potential.toUpperCase(),
    });
  }

  qb.orderBy('storage.createdAt', 'ASC');
  qb.take(Math.min(assignCount, 1000));

  const storageLeads = await qb.getMany();

  if (!storageLeads.length) {
    return { message: 'No storage leads available for selected filter' };
  }

  // CHECK EXISTING LEADS (avoid duplicates)
  const phones = storageLeads.map((s) => s.phone);

  const existingLeads = await this.leadRepository.find({
    where: { phone: In(phones) },
  });

  const existingPhoneSet = new Set(existingLeads.map((l) => l.phone));

  const newLeads = storageLeads.filter(
    (s) => !existingPhoneSet.has(s.phone),
  );

  if (!newLeads.length) {
    return { message: 'All selected storage leads already exist in leads' };
  }

  // CREATE LEADS
  const leadEntities = newLeads.map((s) =>
    this.leadRepository.create({
      name: s.name,
      phone: s.phone,
      city: s.city,
      zone: s.zone,
      address: s.address,
      source: 'STORAGE_IMPORT',
      assignedTo,
      createdBy: this.getCurrentUserId(user),
      createdByName: this.getCurrentUserName(user),
      status: LeadStatus.NEW,
    }),
  );

  await this.leadRepository.save(leadEntities);

  // MARK STORAGE AS CONVERTED
  const ids = newLeads.map((s) => s.id);

  await this.leadStorageRepository.update(ids, {
    isConverted: true,
  });

  return {
    message: `Assigned ${leadEntities.length} storage leads successfully`,
    assignedTo,
  };
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

async getLeadStorage(query: any) {
  const page = Math.max(Number(query?.page || 1), 1);
  const limit = Math.min(Math.max(Number(query?.limit || 50), 1), 200);
  const skip = (page - 1) * limit;

  const qb = this.leadStorageRepository.createQueryBuilder('storage');

  qb.where('COALESCE(storage.isConverted, false) = false');

  if (query?.name) {
    qb.andWhere('storage.name ILIKE :name', {
      name: `%${query.name}%`,
    });
  }

  if (query?.phone) {
    qb.andWhere('storage.phone ILIKE :phone', {
      phone: `%${query.phone}%`,
    });
  }

  if (query?.city) {
    qb.andWhere(
      `(storage.city ILIKE :city 
        OR storage.zone ILIKE :city 
        OR storage.address ILIKE :city 
        OR storage.region ILIKE :city)`,
      {
        city: `%${query.city}%`,
      },
    );
  }

  if (query?.leadPotential) {
    qb.andWhere('storage.leadPotential = :leadPotential', {
      leadPotential: String(query.leadPotential).toUpperCase(),
    });
  }

  const [data, total] = await qb
    .orderBy('storage.createdAt', 'DESC')
    .skip(skip)
    .take(limit)
    .getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

async getLeadStorageFilteredIds(query: any) {
  const qb = this.leadStorageRepository.createQueryBuilder('storage');

  qb.where('COALESCE(storage.isConverted, false) = false');

  if (query?.name) {
    qb.andWhere('storage.name ILIKE :name', {
      name: `%${query.name}%`,
    });
  }

  if (query?.phone) {
    qb.andWhere('storage.phone ILIKE :phone', {
      phone: `%${query.phone}%`,
    });
  }

  if (query?.city) {
    qb.andWhere(
      `(storage.city ILIKE :city 
        OR storage.zone ILIKE :city 
        OR storage.address ILIKE :city 
        OR storage.region ILIKE :city)`,
      {
        city: `%${query.city}%`,
      },
    );
  }

  if (query?.leadPotential) {
    qb.andWhere('storage.leadPotential = :leadPotential', {
      leadPotential: String(query.leadPotential).toUpperCase(),
    });
  }

  const rows = await qb
  .select('storage.id', 'id')
  .orderBy('storage.createdAt', 'DESC')
  .take(2000)
  .getRawMany();

  const ids = rows
    .map((row) => Number(row.id))
    .filter((id) => Number.isFinite(id) && id > 0);

  return {
    ids,
    count: ids.length,
  };
}

async assignStorageLeads(
  body: { contactIds: number[]; assignedTo: number },
  user: any,
) {
  if (!this.isOwner(user)) {
    throw new ForbiddenException('Only owner can assign storage leads');
  }

  const ids = Array.isArray(body.contactIds)
    ? body.contactIds.map(Number).filter(Boolean)
    : [];

  if (!ids.length) {
    throw new BadRequestException('No storage leads selected');
  }

  if (!body.assignedTo) {
    throw new BadRequestException('assignedTo is required');
  }

  const assignedTo = Number(body.assignedTo);

  await this.leadStorageRepository.update(
    { id: In(ids) },
    { assignedTo }
  );

  return {
    message: `${ids.length} storage leads assigned successfully`,
    assignedTo,
  };
}

async convertStorageToLeads(
  body: { contactIds: number[]; assignedTo?: number },
  user: any,
) {
  if (!this.isOwner(user)) {
    throw new ForbiddenException('Only owner can convert storage to leads');
  }

  const storageIds = Array.isArray(body?.contactIds)
    ? body.contactIds.map(Number).filter((id) => Number.isFinite(id) && id > 0)
    : [];

  if (!storageIds.length) {
    throw new BadRequestException('No storage leads selected');
  }

  const storageItems = await this.leadStorageRepository.find({
    where: {
      id: In(storageIds),
      isConverted: false,
    },
  });

  if (!storageItems.length) {
    throw new BadRequestException('No valid storage leads found');
  }

  const currentUserId = this.getCurrentUserId(user);
  const currentUserName = this.getCurrentUserName(user);

  const phones = storageItems.map((item) => item.phone).filter(Boolean);

  const existingLeads = phones.length
    ? await this.leadRepository.find({
        where: {
          phone: In(phones),
        },
      })
    : [];

  const existingPhoneSet = new Set(existingLeads.map((lead) => lead.phone));

  const leadsToCreate = storageItems
    .filter((item) => item.phone && !existingPhoneSet.has(item.phone))
    .map((item) => {
      const potentialPercentage =
        item.leadPotential === LeadStoragePotential.HIGH
          ? 75
          : item.leadPotential === LeadStoragePotential.MEDIUM
          ? 50
          : 15;

      return this.leadRepository.create({
        name: item.name || 'Unknown',
        phone: item.phone,
        alternatePhone: item.alternatePhone || undefined,
        email: item.email || undefined,
        city: item.city || undefined,
        state: item.state || undefined,
        zone: item.zone || undefined,
        region: item.region || undefined,
        address: item.address || undefined,
        source: item.source || 'LEAD_STORAGE',
        assignedTo: body.assignedTo ? Number(body.assignedTo) : undefined,
        createdBy: currentUserId,
        createdByName: currentUserName,
        potential: item.leadPotential as any,
        potentialPercentage,
        status: LeadStatus.NEW,
        remarks: item.remarks || undefined,
      });
    });

  if (!leadsToCreate.length) {
    throw new BadRequestException(
      'Selected storage leads already exist as active leads or have invalid phone numbers',
    );
  }

  const savedLeads = await this.leadRepository.save(leadsToCreate);

  await this.leadStorageRepository.update(
    {
      id: In(storageItems.map((item) => item.id)),
    },
    {
      isConverted: true,
      assignedTo: body.assignedTo ? Number(body.assignedTo) : undefined,
    },
  );

  return {
    message: `${savedLeads.length} leads created successfully from storage`,
    createdCount: savedLeads.length,
    skippedCount: storageItems.length - savedLeads.length,
  };
}

}
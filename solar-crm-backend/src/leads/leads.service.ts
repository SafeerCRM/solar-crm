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

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,

    @InjectRepository(FollowUp)
    private readonly followUpRepository: Repository<FollowUp>,
  ) {}

  private isOwner(user: any) {
    return user?.role === 'OWNER';
  }

  private isLeadManager(user: any) {
    return user?.role === 'LEAD_MANAGER';
  }

  private isTelecaller(user: any) {
    return user?.role === 'TELECALLER';
  }

  private isProjectManager(user: any) {
    return user?.role === 'PROJECT_MANAGER';
  }

  private getCurrentUserId(user: any) {
    return Number(user?.id ?? user?.sub);
  }

  private getCurrentUserName(user: any) {
    return user?.name || user?.email || 'Unknown User';
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
    };

    if (this.isTelecaller(user)) {
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
    const currentUserId = this.getCurrentUserId(user);

    if (this.isTelecaller(user)) {
      query.andWhere(
        '(lead.assignedTo = :assignedTo OR lead.assignedTo IS NULL)',
        { assignedTo: currentUserId },
      );
    } else if (this.isProjectManager(user)) {
      query.andWhere('lead.status IN (:...statuses)', {
        statuses: [
          LeadStatus.INTERESTED,
          LeadStatus.SITE_VISIT,
          LeadStatus.QUOTATION,
          LeadStatus.NEGOTIATION,
          LeadStatus.WON,
        ],
      });
    } else if (
      (this.isOwner(user) || this.isLeadManager(user)) &&
      filters?.assignedTo
    ) {
      query.andWhere('lead.assignedTo = :assignedTo', {
        assignedTo: Number(filters.assignedTo),
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
      query.andWhere('lead.city = :city', { city: filters.city });
    }

    if (filters?.zone) {
      query.andWhere('lead.zone = :zone', { zone: filters.zone });
    }

    if (filters?.region) {
      query.andWhere('lead.region = :region', { region: filters.region });
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
    const lead = await this.leadRepository.findOne({
      where: { id },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const currentUserId = this.getCurrentUserId(user);

    if (this.isTelecaller(user)) {
      if (
        lead.assignedTo !== null &&
        lead.assignedTo !== undefined &&
        lead.assignedTo !== currentUserId
      ) {
        throw new ForbiddenException(
          'You can only access your available or assigned leads',
        );
      }
    }

    if (this.isProjectManager(user)) {
      const allowedStatuses = [
        LeadStatus.INTERESTED,
        LeadStatus.SITE_VISIT,
        LeadStatus.QUOTATION,
        LeadStatus.NEGOTIATION,
        LeadStatus.WON,
      ];

      if (!allowedStatuses.includes(lead.status)) {
        throw new ForbiddenException(
          'You can only access qualified pipeline leads',
        );
      }
    }

    return lead;
  }

  async findByAssignedUser(userId: number, user: any) {
    const currentUserId = this.getCurrentUserId(user);

    if (this.isTelecaller(user) && currentUserId !== userId) {
      throw new ForbiddenException('You can only access your assigned leads');
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

    const currentUserId = this.getCurrentUserId(user);

    if (this.isTelecaller(user)) {
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

    if (this.isProjectManager(user)) {
      const allowedFields: Partial<Lead> = {
        status: data.status,
        remarks: data.remarks,
        nextFollowUpDate: data.nextFollowUpDate,
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

  async exportCsv(user: any) {
    let leads: Lead[];
    const currentUserId = this.getCurrentUserId(user);

    if (this.isTelecaller(user)) {
      leads = await this.leadRepository.find({
        where: [{ assignedTo: currentUserId }, { assignedTo: null as any }],
        order: { createdAt: 'DESC' },
      });
    } else if (this.isProjectManager(user)) {
      leads = await this.leadRepository
        .createQueryBuilder('lead')
        .where('lead.status IN (:...statuses)', {
          statuses: [
            LeadStatus.INTERESTED,
            LeadStatus.SITE_VISIT,
            LeadStatus.QUOTATION,
            LeadStatus.NEGOTIATION,
            LeadStatus.WON,
          ],
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

  async getHotLeads() {
    return this.leadRepository.find({
      where: [
        { status: LeadStatus.INTERESTED },
        { status: LeadStatus.CONTACTED },
      ],
      order: { updatedAt: 'DESC' },
      take: 10,
    });
  }
}
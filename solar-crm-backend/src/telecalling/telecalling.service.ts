import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, LessThan } from 'typeorm';
import { CallLog, CallReviewStatus } from './call-log.entity';
import { Lead, LeadStatus } from '../leads/lead.entity';
import {
  FollowUp,
  FollowUpStatus,
  FollowUpType,
} from '../followup/follow-up.entity';
import {
  ContactStatus,
  TelecallingContact,
} from './telecalling-contact.entity';
import { User } from '../users/user.entity';

@Injectable()
export class TelecallingService {
  constructor(
    @InjectRepository(CallLog)
    private readonly callLogRepository: Repository<CallLog>,

    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,

    @InjectRepository(FollowUp)
    private readonly followUpRepository: Repository<FollowUp>,

    @InjectRepository(TelecallingContact)
    private readonly contactRepository: Repository<TelecallingContact>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ---------------- Existing Lead-Based Telecalling ----------------

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
      if (
        lead.assignedTo !== null &&
        lead.assignedTo !== undefined &&
        lead.assignedTo !== user.id
      ) {
        throw new ForbiddenException(
          'You can only access your available or assigned leads',
        );
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
        throw new ForbiddenException(
          'You can only access qualified pipeline leads',
        );
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
      throw new ForbiddenException(
        'Only owner or project manager can review call recordings',
      );
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
      throw new ForbiddenException(
        'Only owner or project manager can access review queue',
      );
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

  // ---------------- New Telecalling Contact Pool ----------------

  async importContactsCsv(file: any, user: any) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    if (!(user?.role === 'OWNER' || user?.role === 'LEAD_MANAGER')) {
      throw new ForbiddenException(
        'Only owner or lead manager can import telecalling contacts',
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

    const headers = parseCsvLine(lines[0]).map((h) =>
      h.replace(/^"|"$/g, '').trim(),
    );

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

      const name = row.name || row.Name;
      const phone = row.phone || row.mobile || row.Mobile || row['mobile number'];
      const city = row.city || row.City;
      const kNo = row.kNo || row['K.no.'] || row['KNo'] || row['kno'];
      const source = row.source || row.Source;

      if (!name || !phone) {
        skippedCount++;
        continue;
      }

      const existing = await this.contactRepository.findOne({
        where: { phone },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      const contact = this.contactRepository.create({
        name,
        phone,
        city: city || undefined,
        kNo: kNo || undefined,
        source: source || undefined,
        importedBy: user.id,
        importedByName: user.name,
        status: ContactStatus.NEW,
        convertedToLead: false,
      });

      await this.contactRepository.save(contact);
      importedCount++;
    }

    return {
      message: 'Telecalling contacts imported successfully',
      importedCount,
      skippedCount,
    };
  }

  async getContacts(user: any) {
    if (user?.role === 'TELECALLER') {
      return this.contactRepository.find({
        where: { assignedTo: user.id },
        order: { createdAt: 'DESC' },
      });
    }

    return this.contactRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async assignContact(id: number, assignedTo: number, user: any) {
    if (
      !(
        user?.role === 'OWNER' ||
        user?.role === 'LEAD_MANAGER' ||
        user?.role === 'PROJECT_MANAGER'
      )
    ) {
      throw new ForbiddenException(
        'Only manager/admin users can assign telecalling contacts',
      );
    }

    const contact = await this.contactRepository.findOne({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException('Telecalling contact not found');
    }

    const assignedUser = await this.userRepository.findOne({
      where: { id: assignedTo },
    });

    if (!assignedUser) {
      throw new NotFoundException('Assigned user not found');
    }

    contact.assignedTo = assignedUser.id;
    contact.assignedToName = assignedUser.name;

    return this.contactRepository.save(contact);
  }

  async convertContactToLead(id: number, user: any) {
    const contact = await this.contactRepository.findOne({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException('Telecalling contact not found');
    }

    if (contact.convertedToLead) {
      throw new BadRequestException('This contact is already converted to lead');
    }

    const existingLead = await this.leadRepository.findOne({
      where: { phone: contact.phone },
    });

    if (existingLead) {
      throw new BadRequestException(
        'Lead with this phone already exists in lead CRM',
      );
    }

    const lead = this.leadRepository.create({
      name: contact.name,
      phone: contact.phone,
      city: contact.city,
      source: contact.source,
      assignedTo: contact.assignedTo,
      createdBy: user.id,
      createdByName: user.name,
      status: LeadStatus.NEW,
    });

    const savedLead = await this.leadRepository.save(lead);

    contact.convertedToLead = true;
    contact.status = ContactStatus.CONVERTED;
    contact.remarks = contact.remarks
      ? `${contact.remarks}\nConverted to lead by ${user.name}`
      : `Converted to lead by ${user.name}`;

    await this.contactRepository.save(contact);

    return {
      message: 'Contact converted to lead successfully',
      lead: savedLead,
    };
  }
}
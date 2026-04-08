import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
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

  private getRoles(user: any): string[] {
    if (Array.isArray(user?.roles)) {
      return user.roles;
    }

    if (user?.role) {
      return [user.role];
    }

    return [];
  }

  private hasAnyRole(user: any, allowedRoles: string[]): boolean {
    const roles = this.getRoles(user);
    return allowedRoles.some((role) => roles.includes(role));
  }

  private normalizeHeader(value: string): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_.-]+/g, '');
  }

  private normalizePhone(value: any): string {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.slice(-10);
  }

  private getMappedValue(
    row: Record<string, any>,
    aliases: string[],
  ): string {
    const normalizedRow: Record<string, any> = {};

    Object.keys(row || {}).forEach((key) => {
      normalizedRow[this.normalizeHeader(key)] = row[key];
    });

    for (const alias of aliases) {
      const normalizedAlias = this.normalizeHeader(alias);
      const value = normalizedRow[normalizedAlias];

      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ''
      ) {
        return String(value).trim();
      }
    }

    return '';
  }

  private matchesLocationFilter(
    contact: Partial<TelecallingContact> & {
      address?: string;
      location?: string;
    },
    normalizedFilter: string,
  ): boolean {
    if (!normalizedFilter) {
      return true;
    }

    const city = String(contact?.city || '').toLowerCase();
    const address = String((contact as any)?.address || '').toLowerCase();
    const location = String((contact as any)?.location || '').toLowerCase();

    return (
      city.includes(normalizedFilter) ||
      address.includes(normalizedFilter) ||
      location.includes(normalizedFilter)
    );
  }

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

    const calledLeadIds = logs.map((log) => log.leadId).filter(Boolean);

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

    if (this.hasAnyRole(user, ['TELECALLER'])) {
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

    if (this.hasAnyRole(user, ['PROJECT_MANAGER'])) {
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
    if (
      !this.hasAnyRole(user, [
        'OWNER',
        'PROJECT_MANAGER',
        'TELECALLING_MANAGER',
      ])
    ) {
      throw new ForbiddenException(
        'Only owner, telecalling manager, or project manager can review call recordings',
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
    if (
      !this.hasAnyRole(user, [
        'OWNER',
        'PROJECT_MANAGER',
        'TELECALLING_MANAGER',
      ])
    ) {
      throw new ForbiddenException(
        'Only owner, telecalling manager, or project manager can access review queue',
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

  async importContacts(file: any, user: any) {
    if (!file) {
      throw new BadRequestException('CSV or Excel file is required');
    }

    if (!this.hasAnyRole(user, ['OWNER', 'TELECALLING_MANAGER'])) {
      throw new ForbiddenException(
        'Only owner or telecalling manager can import telecalling contacts',
      );
    }

    const fileName = String(file.originalname || '').toLowerCase();
    const isCsv = fileName.endsWith('.csv');
    const isXlsx = fileName.endsWith('.xlsx');
    const isXls = fileName.endsWith('.xls');

    if (!isCsv && !isXlsx && !isXls) {
      throw new BadRequestException(
        'Only CSV, XLSX, or XLS files are supported',
      );
    }

    let workbook: XLSX.WorkBook;

    try {
      if (isCsv) {
        workbook = XLSX.read(file.buffer.toString('utf-8'), { type: 'string' });
      } else {
        workbook = XLSX.read(file.buffer, { type: 'buffer' });
      }
    } catch {
      throw new BadRequestException('Unable to read uploaded file');
    }

    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new BadRequestException(
        'Uploaded file does not contain any sheet/data',
      );
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      defval: '',
    });

    if (!rows.length) {
      throw new BadRequestException('Uploaded file is empty');
    }

    const candidateRows = rows.map((row) => {
      const name = this.getMappedValue(row, [
        'name',
        'full_name',
        'fullname',
        'customer_name',
        'customername',
      ]);

      const phone = this.normalizePhone(
        this.getMappedValue(row, [
          'phone',
          'phone_number',
          'phonenumber',
          'phone no',
          'phoneno',
          'call',
          'mobile',
          'mobile_number',
          'mobilenumber',
          'contact_number',
          'contactnumber',
        ]),
      );

      const city = this.getMappedValue(row, ['city', 'town', 'location']);

      return {
        name: (name || phone || '').trim(),
        phone,
        city: city ? String(city).trim() : undefined,
      };
    });

    const validRows = candidateRows.filter((row) => !!row.phone);

    if (!validRows.length) {
      throw new BadRequestException(
        'No valid rows found. File must contain at least phone/mobile/call column values.',
      );
    }

    const uploadedPhones = Array.from(
      new Set(validRows.map((row) => row.phone).filter(Boolean)),
    );

    const existingContacts = uploadedPhones.length
      ? await this.contactRepository.find({
          where: {
            phone: In(uploadedPhones),
          },
          select: ['phone'],
        })
      : [];

    const existingPhones = new Set(existingContacts.map((c) => c.phone));
    const seenInFile = new Set<string>();

    const toInsert: Partial<TelecallingContact>[] = [];
    let skippedCount = 0;

    for (const row of validRows) {
      if (!row.phone) {
        skippedCount++;
        continue;
      }

      if (seenInFile.has(row.phone)) {
        skippedCount++;
        continue;
      }

      if (existingPhones.has(row.phone)) {
        skippedCount++;
        continue;
      }

      seenInFile.add(row.phone);

      toInsert.push({
        name: row.name || row.phone,
        phone: row.phone,
        city: row.city,
        importedBy: user.id,
        importedByName: user.name,
        status: ContactStatus.NEW,
        convertedToLead: false,
        isInStorage: true,
      });
    }

    if (!toInsert.length) {
      return {
        message: 'No new contacts were imported',
        importedCount: 0,
        skippedCount,
        totalRows: rows.length,
      };
    }

    const chunkSize = 2000;

    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize);
      await this.contactRepository.insert(chunk);
    }

    return {
      message: 'Telecalling contacts imported successfully',
      importedCount: toInsert.length,
      skippedCount,
      totalRows: rows.length,
    };
  }

  async getContacts(user: any, page = 1, limit = 50, view = 'active') {
    const safePage =
      Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;

    const safeLimit =
      Number.isFinite(Number(limit)) && Number(limit) > 0
        ? Math.min(Number(limit), 200)
        : 50;

    const skip = (safePage - 1) * safeLimit;
    const normalizedView = String(view || 'active').toLowerCase();

    const whereCondition: any = {};

    if (this.hasAnyRole(user, ['TELECALLER'])) {
      whereCondition.assignedTo = user.id;
      whereCondition.isInStorage = false;
    } else if (normalizedView === 'storage') {
      if (!this.hasAnyRole(user, ['OWNER', 'TELECALLING_MANAGER'])) {
        throw new ForbiddenException(
          'Only owner or telecalling manager can view storage contacts',
        );
      }

      whereCondition.isInStorage = true;
    } else {
      whereCondition.isInStorage = false;
    }

    const [data, total] = await this.contactRepository.findAndCount({
      where: whereCondition,
      order: { createdAt: 'DESC' },
      skip,
      take: safeLimit,
    });

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    };
  }

  async getFilteredContactsCount(locationFilter: string, user: any) {
    if (!this.hasAnyRole(user, ['OWNER', 'TELECALLING_MANAGER'])) {
      throw new ForbiddenException(
        'Only owner or telecalling manager can view filtered storage count',
      );
    }

    const normalizedFilter = String(locationFilter || '').trim().toLowerCase();

    const contacts = await this.contactRepository.find({
      where: {
        isInStorage: true,
      },
      order: { createdAt: 'DESC' },
    });

    const filteredCount = contacts.filter((contact: any) =>
      this.matchesLocationFilter(contact, normalizedFilter),
    ).length;

    return {
      totalCount: contacts.length,
      filteredCount,
    };
  }

  async assignContact(id: number, assignedTo: number, user: any) {
    if (!this.hasAnyRole(user, ['OWNER', 'TELECALLING_MANAGER'])) {
      throw new ForbiddenException(
        'Only owner or telecalling manager can assign telecalling contacts',
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
    contact.isInStorage = false;

    return this.contactRepository.save(contact);
  }

  async assignLatestContactsByFilter(
    locationFilter: string,
    assignCount: number,
    assignedTo: number,
    user: any,
  ) {
    if (!this.hasAnyRole(user, ['OWNER', 'TELECALLING_MANAGER'])) {
      throw new ForbiddenException(
        'Only owner or telecalling manager can assign latest contacts from storage',
      );
    }

    const normalizedFilter = String(locationFilter || '').trim().toLowerCase();

    if (!normalizedFilter) {
      throw new BadRequestException(
        'City / address / location filter is required',
      );
    }

    if (!assignCount || Number.isNaN(Number(assignCount)) || assignCount <= 0) {
      throw new BadRequestException('Valid assign count is required');
    }

    if (!assignedTo || Number.isNaN(Number(assignedTo))) {
      throw new BadRequestException('Assigned user is required');
    }

    const assignedUser = await this.userRepository.findOne({
      where: { id: assignedTo },
    });

    if (!assignedUser) {
      throw new NotFoundException('Assigned user not found');
    }

    const contacts = await this.contactRepository.find({
      where: {
        isInStorage: true,
      },
      order: { createdAt: 'DESC' },
    });

    const filteredContacts = contacts.filter((contact: any) =>
      this.matchesLocationFilter(contact, normalizedFilter),
    );

    if (!filteredContacts.length) {
      throw new NotFoundException(
        'No contacts found for the given city / address / location filter',
      );
    }

    const selectedContacts = filteredContacts.slice(0, Number(assignCount));

    if (!selectedContacts.length) {
      throw new NotFoundException('No contacts available to assign');
    }

    const ids = selectedContacts.map((contact) => contact.id);

    const result = await this.contactRepository
      .createQueryBuilder()
      .update(TelecallingContact)
      .set({
        assignedTo: assignedUser.id,
        assignedToName: assignedUser.name,
        isInStorage: false,
      })
      .where('id IN (:...ids)', { ids })
      .execute();

    const updatedCount = result.affected || 0;

    return {
      message: 'Latest filtered contacts assigned successfully',
      assignedTo: assignedUser.id,
      assignedToName: assignedUser.name,
      requestedCount: Number(assignCount),
      matchedCount: filteredContacts.length,
      updatedCount,
    };
  }

  async bulkAssignContacts(
    contactIds: number[],
    assignedTo: number,
    user: any,
  ) {
    if (!this.hasAnyRole(user, ['OWNER', 'TELECALLING_MANAGER'])) {
      throw new ForbiddenException(
        'Only owner or telecalling manager can bulk assign telecalling contacts',
      );
    }

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      throw new BadRequestException('Please select at least one contact');
    }

    if (!assignedTo || Number.isNaN(Number(assignedTo))) {
      throw new BadRequestException('Assigned user is required');
    }

    const uniqueIds = Array.from(
      new Set(
        contactIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );

    if (!uniqueIds.length) {
      throw new BadRequestException('No valid contact ids provided');
    }

    const assignedUser = await this.userRepository.findOne({
      where: { id: assignedTo },
    });

    if (!assignedUser) {
      throw new NotFoundException('Assigned user not found');
    }

    const result = await this.contactRepository
      .createQueryBuilder()
      .update(TelecallingContact)
      .set({
        assignedTo: assignedUser.id,
        assignedToName: assignedUser.name,
        isInStorage: false,
      })
      .where('id IN (:...ids)', { ids: uniqueIds })
      .execute();

    const updatedCount = result.affected || 0;

    if (!updatedCount) {
      throw new NotFoundException('No telecalling contacts found');
    }

    return {
      message: 'Telecalling contacts assigned successfully',
      assignedTo: assignedUser.id,
      assignedToName: assignedUser.name,
      requestedCount: uniqueIds.length,
      updatedCount,
    };
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

    const normalizedPhone = this.normalizePhone(contact.phone);

    const existingLead = await this.leadRepository.findOne({
      where: { phone: normalizedPhone },
    });

    if (existingLead) {
      throw new BadRequestException(
        'Lead with this phone already exists in lead CRM',
      );
    }

    const lead = this.leadRepository.create({
      name: contact.name,
      phone: normalizedPhone,
      city: contact.city,
      assignedTo: contact.assignedTo,
      createdBy: user.id,
      createdByName: user.name,
      status: LeadStatus.NEW,
    });

    const savedLead = await this.leadRepository.save(lead);

    contact.convertedToLead = true;
    contact.status = ContactStatus.CONVERTED;
    contact.phone = normalizedPhone;
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
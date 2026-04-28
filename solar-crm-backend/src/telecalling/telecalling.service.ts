import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import {
  CallDirection,
  CallLog,
  CallProvider,
  CallReviewStatus,
} from './call-log.entity';
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
import { ContactCallHistory } from './contact-call-history.entity';
import { ContactNote } from './contact-note.entity';
import { UserRole } from '../users/user.entity';
import { Meeting } from '../meeting/meeting.entity';
import { Cron } from '@nestjs/schedule';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';


@Injectable()
export class TelecallingService {
  constructor(
    @InjectRepository(CallLog)
    private readonly callLogRepository: Repository<CallLog>,
    @InjectRepository(TelecallingContact)
private readonly telecallingContactRepository: Repository<TelecallingContact>,
@InjectRepository(Meeting)
private readonly meetingRepository: Repository<Meeting>,

    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,

    @InjectRepository(FollowUp)
    private readonly followUpRepository: Repository<FollowUp>,

    @InjectRepository(TelecallingContact)
    private readonly contactRepository: Repository<TelecallingContact>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(ContactCallHistory)
    private readonly contactCallHistoryRepository: Repository<ContactCallHistory>,

    @InjectRepository(ContactNote)
    private readonly contactNoteRepository: Repository<ContactNote>,
  ) {}

  private getRoles(user: any): string[] {
    if (Array.isArray(user?.roles)) return user.roles;
    if (user?.role) return [user.role];
    return [];
  }

  private hasAnyRole(user: any, allowedRoles: string[]): boolean {
    const roles = this.getRoles(user);
    return allowedRoles.some((role) => roles.includes(role));
  }

  private hasRole(user: any, role: string): boolean {
    if (Array.isArray(user?.roles)) {
      return user.roles.includes(role);
    }
    return user?.role === role;
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

  private normalizeLeadPotential(value?: string): string | undefined {
    const normalized = String(value || '').trim().toUpperCase();
    if (!normalized) return undefined;

    if (normalized === 'LOW' || normalized === 'MEDIUM' || normalized === 'HIGH') {
      return normalized;
    }

    return undefined;
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

  private getContactLocationLabel(
    contact: Partial<TelecallingContact> & {
      address?: string;
      location?: string;
    },
  ): string {
    return String(
      contact?.city ||
        (contact as any)?.address ||
        (contact as any)?.location ||
        '',
    ).trim();
  }

  private normalizeCallStatus(value?: string): string {
    const normalized = String(value || '').trim().toUpperCase();
    return normalized || 'CONNECTED';
  }

  private applyViewRestrictionsToContactQuery(
  qb: any,
  user: any,
  normalizedView: string,
) {
  // ✅ TELECALLER → only assigned active contacts
  if (this.hasAnyRole(user, ['TELECALLER'])) {
    qb.where('contact.assignedTo = :assignedTo', { assignedTo: user.id });
    qb.andWhere('contact.isInStorage = false');
    return;
  }

  // ✅ TELECALLING ASSISTANT → only review assigned contacts
  if (this.hasAnyRole(user, ['TELECALLING_ASSISTANT' as any])) {
    qb.where('contact.reviewAssignedTo = :reviewAssignedTo', {
      reviewAssignedTo: user.id,
    });
    qb.andWhere('contact.isInStorage = false');
    return;
  }

  // ✅ STORAGE VIEW
  if (normalizedView === 'storage') {
    if (!this.hasAnyRole(user, ['OWNER', 'TELECALLING_MANAGER'])) {
      throw new ForbiddenException(
        'Only owner or telecalling manager can view storage contacts',
      );
    }

    qb.where('contact.isInStorage = true');
    return;
  }

  // ✅ DEFAULT ACTIVE
  qb.where('contact.isInStorage = false');
}

  private async getAccessibleContact(id: number, user: any) {
    const contact = await this.contactRepository.findOne({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException('Telecalling contact not found');
    }

    if (this.hasAnyRole(user, ['OWNER', 'TELECALLING_MANAGER'])) {
      return contact;
    }

    if (this.hasAnyRole(user, ['TELECALLING_ASSISTANT' as any])) {
      if (contact.reviewAssignedTo !== user.id) {
        throw new ForbiddenException(
          'You can only access your assigned review contacts',
        );
      }
      return contact;
    }

    if (this.hasAnyRole(user, ['TELECALLER'])) {
      if (contact.assignedTo !== user.id) {
        throw new ForbiddenException(
          'You can only access your assigned contacts',
        );
      }
      return contact;
    }

    throw new ForbiddenException('You do not have access to this contact');
  }

  async uploadCallRecording(
  file: any,
  body: {
    contactId?: string;
    callLogId?: string;
    historyId?: string;
  },
  user: any,
) {
  if (!file) {
    throw new BadRequestException('Recording file is required');
  }

  const mimeType = String(file.mimetype || '');

  if (!mimeType.startsWith('audio/')) {
    throw new BadRequestException('Only audio files are allowed');
  }

  const maxSize = 15 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new BadRequestException('Recording file must be less than 15 MB');
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket =
    process.env.SUPABASE_CALL_RECORDINGS_BUCKET || 'call-recordings';

  if (!supabaseUrl || !serviceKey) {
    throw new BadRequestException('Supabase storage is not configured');
  }

  const contactId = body?.contactId ? Number(body.contactId) : undefined;
  const callLogId = body?.callLogId ? Number(body.callLogId) : undefined;
  const historyId = body?.historyId ? Number(body.historyId) : undefined;

  if (contactId) {
    await this.getAccessibleContact(contactId, user);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const originalName = String(file.originalname || 'recording');
  const extension = originalName.includes('.')
    ? originalName.split('.').pop()
    : mimeType.split('/')[1] || 'audio';

  const safeExtension = String(extension || 'audio').replace(
    /[^a-zA-Z0-9]/g,
    '',
  );

  const filePath = `recordings/user-${user?.id || 'unknown'}/${Date.now()}-${randomUUID()}.${safeExtension}`;

  const uploadResult = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadResult.error) {
    throw new BadRequestException(uploadResult.error.message);
  }

  const publicUrlResult = supabase.storage.from(bucket).getPublicUrl(filePath);
  const recordingUrl = publicUrlResult.data.publicUrl;

  await this.contactCallHistoryRepository.query(`
    ALTER TABLE public.contact_call_history
    ADD COLUMN IF NOT EXISTS "recordingUrl" text
  `);

  let targetHistory: ContactCallHistory | null = null;

  if (historyId) {
    targetHistory = await this.contactCallHistoryRepository.findOne({
      where: { id: historyId },
    });
  }

  if (!targetHistory && contactId) {
    targetHistory = await this.contactCallHistoryRepository.findOne({
      where: { contactId },
      order: { createdAt: 'DESC' },
    });
  }

  if (targetHistory) {
    await this.contactCallHistoryRepository.query(
      `UPDATE contact_call_history SET "recordingUrl" = $1 WHERE id = $2`,
      [recordingUrl, targetHistory.id],
    );
  } else if (contactId) {
    const newHistory = new ContactCallHistory();

    newHistory.contactId = contactId;
    newHistory.calledBy = user.id;
    newHistory.calledByName = user.name;
    newHistory.callStatus = 'CONNECTED';
    newHistory.notes = '';

    const savedHistory = await this.contactCallHistoryRepository.save(
      newHistory,
    );

    await this.contactCallHistoryRepository.query(
      `UPDATE contact_call_history SET "recordingUrl" = $1 WHERE id = $2`,
      [recordingUrl, savedHistory.id],
    );
  }

  if (callLogId) {
    await this.callLogRepository.update(callLogId, {
      recordingUrl,
    });
  }

  if (contactId) {
    const latestCallLog = await this.callLogRepository.findOne({
      where: { contactId },
      order: { createdAt: 'DESC' },
    });

    if (latestCallLog) {
      await this.callLogRepository.update(latestCallLog.id, {
        recordingUrl,
      });
    }
  }

  return {
    message: 'Recording uploaded successfully',
    recordingUrl,
    filePath,
  };
}

  async create(data: Partial<CallLog>) {
    const log = this.callLogRepository.create({
      ...data,
      callStatus: this.normalizeCallStatus(data.callStatus),
      reviewStatus: data.reviewStatus || CallReviewStatus.PENDING,
      providerName: data.providerName || CallProvider.MANUAL,
      callDirection: data.callDirection || CallDirection.OUTBOUND,
      disposition: data.disposition || data.callStatus || undefined,
      leadPotential: this.normalizeLeadPotential((data as any).leadPotential),
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
      data.callStatus === 'CNR' ||
      data.callStatus === 'PROPOSAL_SENT'
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

        if (data.nextFollowUpDate && data.telecallerId) {
      const followUp = this.followUpRepository.create({
        leadId: data.leadId,
        assignedTo: data.telecallerId,
        createdBy: data.telecallerId,
        createdByName: data.telecallerId
          ? `User ${data.telecallerId}`
          : 'Unknown User',
        sourceModule: 'TELECALLING',
        sourceStage: 'LEAD_CALL',
        followUpType:
          data.callStatus === 'CALLBACK'
            ? FollowUpType.CALLBACK
            : data.callStatus === 'INTERESTED'
            ? FollowUpType.CALL
            : FollowUpType.GENERAL,
        note:
          data.callNotes ||
          (data.callStatus === 'INTERESTED'
            ? 'Interested follow-up created from telecalling'
            : data.callStatus === 'CALLBACK'
            ? 'Callback follow-up created from telecalling'
            : 'Follow-up created from telecalling reminder'),
        followUpDate: data.nextFollowUpDate,
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

    async getByTelecaller(
    telecallerId: number,
    filters: {
      page?: number;
      limit?: number;
      name?: string;
      phone?: string;
      city?: string;
      callResult?: string;
      leadPotential?: string;
    } = {},
  ) {
    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const limit =
      Number(filters.limit) > 0 ? Math.min(Number(filters.limit), 100) : 50;

    const skip = (page - 1) * limit;

    const normalizedName = String(filters.name || '').trim().toLowerCase();
    const normalizedPhone = String(filters.phone || '').trim().toLowerCase();
    const normalizedCity = String(filters.city || '').trim().toLowerCase();
    const normalizedCallResult = String(filters.callResult || '').trim().toUpperCase();
    const normalizedLeadPotential = String(filters.leadPotential || '')
      .trim()
      .toUpperCase();

    const qb = this.callLogRepository
      .createQueryBuilder('call')
      .leftJoinAndSelect('call.lead', 'lead')
      .where('call.telecallerId = :telecallerId', { telecallerId })
      .orderBy('call.createdAt', 'DESC');

    if (normalizedCallResult) {
      qb.andWhere(
        `(UPPER(COALESCE(call.disposition, '')) = :callResult OR UPPER(COALESCE(call.callStatus, '')) = :callResult)`,
        { callResult: normalizedCallResult },
      );
    }

    if (normalizedLeadPotential) {
      qb.andWhere(`UPPER(COALESCE(call.leadPotential, '')) = :leadPotential`, {
        leadPotential: normalizedLeadPotential,
      });
    }

    if (normalizedName) {
      qb.andWhere(`LOWER(COALESCE(lead.name, '')) LIKE :name`, {
        name: `%${normalizedName}%`,
      });
    }

    if (normalizedPhone) {
      qb.andWhere(`LOWER(COALESCE(lead.phone, '')) LIKE :phone`, {
        phone: `%${normalizedPhone}%`,
      });
    }

    if (normalizedCity) {
      qb.andWhere(
        `(
          LOWER(COALESCE(lead.city, '')) LIKE :city
          OR LOWER(COALESCE(lead.zone, '')) LIKE :city
        )`,
        { city: `%${normalizedCity}%` },
      );
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
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
        'TELECALLING_ASSISTANT' as any,
      ])
    ) {
      throw new ForbiddenException(
        'Only owner, telecalling manager, project manager, or telecalling assistant can review call recordings',
      );
    }

    const callLog = await this.callLogRepository.findOne({
      where: { id: callId },
    });

    if (!callLog) {
      throw new NotFoundException('Call log not found');
    }

    if (this.hasRole(user, 'TELECALLING_ASSISTANT' as any)) {
      if (callLog.reviewAssignedTo !== user.id) {
        throw new ForbiddenException('You can only review assigned calls');
      }
    }

    callLog.reviewStatus = data.reviewStatus;
    callLog.reviewNotes = data.reviewNotes || '';

    return this.callLogRepository.save(callLog);
  }

   async getReviewQueue(
  user: any,
  filters: {
    page?: number;
    limit?: number;
    name?: string;
    phone?: string;
    city?: string;
        telecallerName?: string;
    callResult?: string;
    leadPotential?: string;
  } = {},
) {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit =
    Number(filters.limit) > 0 ? Math.min(Number(filters.limit), 100) : 50;

  const skip = (page - 1) * limit;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const now = new Date();

  const qb = this.callLogRepository
  .createQueryBuilder('call')
  .leftJoin('call.lead', 'lead')
.addSelect(['lead.id', 'lead.name', 'lead.phone', 'lead.city'])
  .leftJoin(TelecallingContact, 'contact', 'contact.id = call.contactId')
.addSelect([
  'contact.id',
  'contact.name',
  'contact.phone',
  'contact.city'
])
  .leftJoin(User, 'telecaller', 'telecaller.id = call.telecallerId') // ✅ NEW
    .where('call.createdAt BETWEEN :cutoff AND :now', { cutoff, now })
    .andWhere(`UPPER(COALESCE(call.callStatus, '')) <> 'INITIATED'`)
    .andWhere('(contact.convertedToLead IS NULL OR contact.convertedToLead = false)')
    .orderBy('call.createdAt', 'DESC');

  if (this.hasRole(user, 'TELECALLING_ASSISTANT' as any)) {
    qb.andWhere('call.reviewAssignedTo = :reviewAssignedTo', {
      reviewAssignedTo: user.id,
    });
  } else if (
    !this.hasAnyRole(user, [
      'OWNER',
      'PROJECT_MANAGER',
      'TELECALLING_MANAGER',
    ])
  ) {
    throw new ForbiddenException(
      'Only owner, telecalling manager, project manager, or assistant can access',
    );
  }

  const normalizedName = String(filters.name || '').trim().toLowerCase();
  const normalizedPhone = String(filters.phone || '').trim().toLowerCase();
  const normalizedCity = String(filters.city || '').trim().toLowerCase();
    const normalizedTelecallerName = String(filters.telecallerName || '').trim().toLowerCase();
  const normalizedCallResult = String(filters.callResult || '').trim().toUpperCase();
  const normalizedLeadPotential = String(filters.leadPotential || '')
    .trim()
    .toUpperCase();

  if (normalizedCallResult) {
    qb.andWhere(
      `(UPPER(COALESCE(call.disposition, '')) = :callResult OR UPPER(COALESCE(call.callStatus, '')) = :callResult)`,
      { callResult: normalizedCallResult },
    );
  }

  if (normalizedLeadPotential) {
    qb.andWhere('UPPER(COALESCE(call.leadPotential, \'\')) = :leadPotential', {
      leadPotential: normalizedLeadPotential,
    });
  }

  if (normalizedName) {
    qb.andWhere(
      `(
        LOWER(COALESCE(lead.name, '')) LIKE :name
        OR LOWER(COALESCE(contact.name, '')) LIKE :name
      )`,
      { name: `%${normalizedName}%` },
    );
  }

  if (normalizedPhone) {
    qb.andWhere(
      `(
        LOWER(COALESCE(lead.phone, '')) LIKE :phone
        OR LOWER(COALESCE(contact.phone, '')) LIKE :phone
      )`,
      { phone: `%${normalizedPhone}%` },
    );
  }

  if (normalizedCity) {
    qb.andWhere(
      `(
        LOWER(COALESCE(lead.city, '')) LIKE :city
        OR LOWER(COALESCE(contact.city, '')) LIKE :city
        OR LOWER(COALESCE(contact.address, '')) LIKE :city
        OR LOWER(COALESCE(contact.location, '')) LIKE :city
      )`,
      { city: `%${normalizedCity}%` },
    );
  }

    if (normalizedTelecallerName) {

    const telecallerRows = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.name'])
      .where(`LOWER(COALESCE(user.name, '')) LIKE :telecallerName`, {
        telecallerName: `%${normalizedTelecallerName}%`,
      })
      .getMany();

    const telecallerIds = telecallerRows.map((user) => Number(user.id)).filter(Boolean);

    if (!telecallerIds.length) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
      };
    }

    qb.andWhere('call.telecallerId IN (:...telecallerIds)', {
      telecallerIds,
    });
  }

    const [rows, total] = await qb.skip(skip).take(limit).getManyAndCount();

  const telecallerIds = Array.from(
    new Set(
      rows
        .map((call: any) => Number(call.telecallerId))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  );

  const telecallers = telecallerIds.length
    ? await this.userRepository.find({
        where: { id: In(telecallerIds) },
        select: ['id', 'name'],
      })
    : [];

  const telecallerMap = new Map(
    telecallers.map((user) => [Number(user.id), user.name]),
  );

  const data = rows.map((call: any) => ({
  ...call,
  telecallerName: call.telecallerId
    ? telecallerMap.get(Number(call.telecallerId)) || `User ${call.telecallerId}`
    : '',
  assignedDate: call.createdAt,
  contactAssignedToName: call.contact?.assignedToName || '',

  // ✅ ALWAYS RETURN LATEST RECORDING
  recordingUrl:
    call.recordingUrl ||
    call.contact?.recordingUrl ||
    null,
}));

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
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
       async getTodayPerformance() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const data = await this.callLogRepository
    .createQueryBuilder('call')
    .leftJoin(User, 'user', 'user.id = call.telecallerId') // ✅ ADD
    .select('call.telecallerId', 'telecallerId')
    .addSelect('user.name', 'telecallerName') // ✅ ADD
    .addSelect('COUNT(*)', 'totalCalls')
    .addSelect(
      `SUM(CASE WHEN call.callStatus = 'INTERESTED' THEN 1 ELSE 0 END)`,
      'interested'
    )
    .where('call.createdAt BETWEEN :start AND :end', { start, end })
    .groupBy('call.telecallerId')
    .addGroupBy('user.name') // ✅ IMPORTANT
    .getRawMany();

  return data;
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

      const city = this.getMappedValue(row, ['city', 'town', 'area', 'district']);

const zone = this.getMappedValue(row, [
  'zone',
  'region',
  'area_zone',
  'zone_name',
]);

const address = this.getMappedValue(row, ['address', 'full_address']);
const location = this.getMappedValue(row, ['location', 'site_location', 'place']);

      return {
  name: (name || phone || '').trim(),
  phone,
  city: city ? String(city).trim() : undefined,
  zone: zone ? String(zone).trim() : undefined,
  address: address ? String(address).trim() : undefined,
  location: location ? String(location).trim() : undefined,
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
        address: row.address,
        location: row.location,
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

    async getContacts(
    user: any,
    page = 1,
    limit = 50,
    view = 'active',
    locationFilter = '',
  ) {
    const safePage =
      Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;

    const safeLimit =
      Number.isFinite(Number(limit)) && Number(limit) > 0
        ? Math.min(Number(limit), 200)
        : 50;

    const skip = (safePage - 1) * safeLimit;
    const normalizedView = String(view || 'active').toLowerCase();
    const normalizedFilter = String(locationFilter || '').trim().toLowerCase();

    const qb = this.contactRepository
      .createQueryBuilder('contact')
      .orderBy('contact.createdAt', 'DESC')
      .skip(skip)
      .take(safeLimit);

    this.applyViewRestrictionsToContactQuery(qb, user, normalizedView);

    if (normalizedFilter) {
      qb.andWhere(
        `(
          LOWER(COALESCE(contact.city, '')) LIKE :filter
          OR LOWER(COALESCE(contact.zone, '')) LIKE :filter
          OR LOWER(COALESCE(contact.address, '')) LIKE :filter
          OR LOWER(COALESCE(contact.location, '')) LIKE :filter
        )`,
        { filter: `%${normalizedFilter}%` },
      );
    }

    // For active view only, exclude contacts that already have any saved outcome.
    // Keep contacts that only have INITIATED logs, because they are not completed yet.
    if (normalizedView !== 'storage') {
      qb.andWhere(
        `contact.id NOT IN (
          SELECT DISTINCT cl."contactId"
          FROM call_log cl
          WHERE cl."contactId" IS NOT NULL
            AND UPPER(COALESCE(cl."callStatus", '')) <> 'INITIATED'
        )`,
      );
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    };
  }

    async getAllContactIdsForAutoCall(
    user: any,
    view: string,
    locationFilter: string,
  ) {
    const normalizedView = String(view || 'active').toLowerCase();
    const normalizedFilter = String(locationFilter || '').trim().toLowerCase();

    const qb = this.contactRepository
      .createQueryBuilder('contact')
      .orderBy('contact.createdAt', 'DESC');

    this.applyViewRestrictionsToContactQuery(qb, user, normalizedView);

    if (normalizedFilter) {
      qb.andWhere(
        `(
          LOWER(COALESCE(contact.city, '')) LIKE :filter
          OR LOWER(COALESCE(contact.zone, '')) LIKE :filter
          OR LOWER(COALESCE(contact.address, '')) LIKE :filter
          OR LOWER(COALESCE(contact.location, '')) LIKE :filter
        )`,
        { filter: `%${normalizedFilter}%` },
      );
    }

    // Exclude contacts that already have any completed/saved quick call outcome.
    // We keep contacts that only have INITIATED logs, because client asked to remove
    // from autocall queue only after a saved outcome.
    qb.andWhere(
      `contact.id NOT IN (
        SELECT DISTINCT cl."contactId"
        FROM call_log cl
        WHERE cl."contactId" IS NOT NULL
          AND UPPER(COALESCE(cl."callStatus", '')) <> 'INITIATED'
      )`,
    );

    const contacts = await qb
  .select([
    'contact.id',
    'contact.name',
    'contact.phone',
    'contact.city',
    'contact.zone',
    'contact.address',
    'contact.location',
  ])
  .take(500) // 🔥 LIMIT ADDED
  .getMany();

    return contacts.filter((c) => !!String(c.phone || '').trim());
  }

  async getContactFilterOptions(user: any) {
    const qb = this.contactRepository
      .createQueryBuilder('contact')
      .select(['contact.city', 'contact.address', 'contact.location'])
      .orderBy('contact.createdAt', 'DESC');

    if (this.hasAnyRole(user, ['TELECALLER'])) {
      qb.where('contact.assignedTo = :assignedTo', { assignedTo: user.id });
      qb.andWhere('contact.isInStorage = :isInStorage', { isInStorage: false });
    }

    if (this.hasAnyRole(user, ['TELECALLING_ASSISTANT' as any])) {
      qb.where('contact.reviewAssignedTo = :reviewAssignedTo', {
        reviewAssignedTo: user.id,
      });
      qb.andWhere('contact.isInStorage = :isInStorage', { isInStorage: false });
    }

    const contacts = await qb.getMany();
    const uniqueValues = new Set<string>();

    for (const contact of contacts) {
      const label = this.getContactLocationLabel(contact);
      if (label) {
        uniqueValues.add(label);
      }
    }

    return Array.from(uniqueValues).sort((a, b) => a.localeCompare(b));
  }

  async getFilteredContactsCount(
    locationFilter: string,
    view: string,
    user: any,
  ) {
    if (
      !this.hasAnyRole(user, [
        'OWNER',
        'TELECALLING_MANAGER',
        'TELECALLING_ASSISTANT' as any,
      ])
    ) {
      throw new ForbiddenException(
        'Only owner, telecalling manager, or telecalling assistant can view filtered contact count',
      );
    }

    const normalizedView = String(view || 'active').toLowerCase();
    const normalizedFilter = String(locationFilter || '').trim().toLowerCase();

    const qb = this.contactRepository
      .createQueryBuilder('contact')
      .orderBy('contact.createdAt', 'DESC');

    if (this.hasAnyRole(user, ['TELECALLING_ASSISTANT' as any])) {
      qb.where('contact.reviewAssignedTo = :reviewAssignedTo', {
        reviewAssignedTo: user.id,
      });
      qb.andWhere('contact.isInStorage = :isInStorage', { isInStorage: false });
    } else {
      this.applyViewRestrictionsToContactQuery(qb, user, normalizedView);
    }

    const totalCount = await qb.getCount();

    if (!normalizedFilter) {
      return {
        totalCount,
        filteredCount: totalCount,
      };
    }

    const filteredQb = this.contactRepository
      .createQueryBuilder('contact')
      .orderBy('contact.createdAt', 'DESC');

    if (this.hasAnyRole(user, ['TELECALLING_ASSISTANT' as any])) {
      filteredQb.where('contact.reviewAssignedTo = :reviewAssignedTo', {
        reviewAssignedTo: user.id,
      });
      filteredQb.andWhere('contact.isInStorage = :isInStorage', {
        isInStorage: false,
      });
    } else {
      this.applyViewRestrictionsToContactQuery(filteredQb, user, normalizedView);
    }

    filteredQb.andWhere(
      `(
        LOWER(COALESCE(contact.city, '')) LIKE :filter
        OR LOWER(COALESCE(contact.address, '')) LIKE :filter
        OR LOWER(COALESCE(contact.location, '')) LIKE :filter
      )`,
      { filter: `%${normalizedFilter}%` },
    );

    const filteredCount = await filteredQb.getCount();

    return {
      totalCount,
      filteredCount,
    };
  }

  async getContactById(id: number, user: any) {
    return this.getAccessibleContact(id, user);
  }

    async getLatestContactSummaries(contactIds: number[], user: any) {
    const uniqueIds = Array.from(
      new Set(
        (Array.isArray(contactIds) ? contactIds : [])
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );

    if (!uniqueIds.length) {
      return [];
    }

    const contactQb = this.contactRepository
      .createQueryBuilder('contact')
      .where('contact.id IN (:...ids)', { ids: uniqueIds });

    if (this.hasAnyRole(user, ['OWNER', 'TELECALLING_MANAGER', 'PROJECT_MANAGER'])) {
      // full access for these roles
    } else if (this.hasAnyRole(user, ['TELECALLING_ASSISTANT' as any])) {
      contactQb.andWhere('contact.reviewAssignedTo = :reviewAssignedTo', {
        reviewAssignedTo: user.id,
      });
    } else if (this.hasAnyRole(user, ['TELECALLER'])) {
      contactQb.andWhere('contact.assignedTo = :assignedTo', {
        assignedTo: user.id,
      });
    } else {
      throw new ForbiddenException('You do not have access to contact summaries');
    }

    const contacts = await contactQb.getMany();

    if (!contacts.length) {
      return [];
    }

    const accessibleIds = contacts.map((contact) => contact.id);

    const latestCallHistoryRows = await this.contactCallHistoryRepository
      .createQueryBuilder('history')
      .where('history.contactId IN (:...ids)', { ids: accessibleIds })
      .orderBy('history.contactId', 'ASC')
      .addOrderBy('history.updatedAt', 'DESC')
      .addOrderBy('history.createdAt', 'DESC')
      .getMany();

    const latestHistoryMap = new Map<number, ContactCallHistory>();

    for (const row of latestCallHistoryRows) {
      if (!latestHistoryMap.has(row.contactId)) {
        latestHistoryMap.set(row.contactId, row);
      }
    }

    const latestCallLogRows = await this.callLogRepository
      .createQueryBuilder('call')
      .where('call.contactId IN (:...ids)', { ids: accessibleIds })
      .andWhere(`UPPER(COALESCE(call.callStatus, '')) <> 'INITIATED'`)
      .orderBy('call.contactId', 'ASC')
      .addOrderBy('call.providerUpdatedAt', 'DESC')
      .addOrderBy('call.createdAt', 'DESC')
      .getMany();

    const latestCallLogMap = new Map<number, CallLog>();

    for (const row of latestCallLogRows) {
      if (!row.contactId) continue;
      if (!latestCallLogMap.has(row.contactId)) {
        latestCallLogMap.set(row.contactId, row);
      }
    }

    return contacts.map((contact) => {
      const latestHistory = latestHistoryMap.get(contact.id);
      const latestCallLog = latestCallLogMap.get(contact.id);

      return {
        contact: {
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          city: contact.city,
          address: contact.address,
          location: contact.location,
          convertedToLead: contact.convertedToLead,
          reviewAssignedTo: contact.reviewAssignedTo,
          reviewAssignedToName: contact.reviewAssignedToName,
        },
        latestCall: {
          callStatus:
            latestHistory?.callStatus ||
            latestCallLog?.disposition ||
            latestCallLog?.callStatus ||
            '',
          notes:
            latestHistory?.notes ||
            latestCallLog?.callNotes ||
            '',
          nextFollowUpDate: latestHistory?.nextFollowUpDate
            ? latestHistory.nextFollowUpDate.toISOString()
            : latestCallLog?.nextFollowUpDate
            ? new Date(latestCallLog.nextFollowUpDate).toISOString()
            : undefined,
          updatedAt: latestHistory?.updatedAt
            ? latestHistory.updatedAt.toISOString()
            : latestHistory?.createdAt
            ? latestHistory.createdAt.toISOString()
            : latestCallLog?.providerUpdatedAt
            ? new Date(latestCallLog.providerUpdatedAt).toISOString()
            : latestCallLog?.createdAt
            ? new Date(latestCallLog.createdAt).toISOString()
            : undefined,
          recordingUrl:
  (latestHistory as any)?.recordingUrl ||
  latestCallLog?.recordingUrl ||
  undefined,
        },
      };
    });
  }

  async getContactWorkHistory(id: number, user: any) {
    const contact = await this.getAccessibleContact(id, user);

    const [notesRaw, callHistoryRaw] = await Promise.all([
      this.contactNoteRepository.find({
        where: { contactId: id },
        order: { createdAt: 'DESC' },
      }),
      this.contactCallHistoryRepository.find({
        where: { contactId: id },
        order: { createdAt: 'DESC' },
      }),
    ]);

    const notes = Array.isArray(notesRaw) ? notesRaw : [];
    const callHistory = Array.isArray(callHistoryRaw) ? callHistoryRaw : [];

    const timeline: Array<{
      type: 'CONTACT_CREATED' | 'CONTACT_NOTE' | 'CONTACT_CALL';
      timestamp: Date;
      title: string;
      description: string;
      noteId?: number;
      callHistoryId?: number;
      meta?: Record<string, any>;
    }> = [];

    timeline.push({
      type: 'CONTACT_CREATED',
      timestamp: contact?.createdAt || new Date(),
      title: 'Contact Created',
      description: `Contact imported by ${contact?.importedByName || 'Unknown User'}`,
      
    });

    for (const note of notes) {
      if (!note) continue;

      timeline.push({
        type: 'CONTACT_NOTE',
        timestamp: note.updatedAt || note.createdAt || new Date(),
        title: `Note by ${note.createdByName || 'Unknown User'}`,
        description: note.note || '',
        noteId: note.id,
        meta: {
          createdBy: note.createdByName || '-',
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        },
      });
    }

    for (const call of callHistory) {
      if (!call) continue;

      timeline.push({
        type: 'CONTACT_CALL',
        timestamp: call.updatedAt || call.createdAt || new Date(),
        title: `Call ${call.callStatus || 'CONNECTED'}`,
        description: call.notes || 'Call entry recorded',
        callHistoryId: call.id,
        meta: {
  calledBy: call.calledByName || '-',
  callStatus: call.callStatus || '-',
  recordingUrl: (call as any).recordingUrl || null,
  nextFollowUpDate: call.nextFollowUpDate || null,
  createdAt: call.createdAt,
  updatedAt: call.updatedAt,
},
      });
    }

    timeline.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return {
      contact,
      timeline,
    };
  }

  async addContactNote(id: number, note: string, user: any) {
    const contact = await this.getAccessibleContact(id, user);

    if (!note || !String(note).trim()) {
      throw new BadRequestException('Note is required');
    }

    const item = this.contactNoteRepository.create({
      contactId: contact.id,
      note: String(note).trim(),
      createdBy: user.id,
      createdByName: user.name,
    });

    return this.contactNoteRepository.save(item);
  }

  async updateContactNote(
    id: number,
    noteId: number,
    note: string,
    user: any,
  ) {
    await this.getAccessibleContact(id, user);

    if (!note || !String(note).trim()) {
      throw new BadRequestException('Note is required');
    }

    const existingNote = await this.contactNoteRepository.findOne({
      where: { id: noteId, contactId: id },
    });

    if (!existingNote) {
      throw new NotFoundException('Contact note not found');
    }

    existingNote.note = String(note).trim();
    return this.contactNoteRepository.save(existingNote);
  }

  async addContactCallHistory(
  id: number,
  body: {
    callStatus?: string;
    notes?: string;
    recordingUrl?: string;
    nextFollowUpDate?: string;
  },
  user: any,
) {
  const contact = await this.getAccessibleContact(id, user);

  const item = new ContactCallHistory();

  item.contactId = contact.id;
  item.calledBy = user.id;
  item.calledByName = user.name;
  item.callStatus = body.callStatus || 'CONNECTED';
  item.notes = body.notes || '';
  (item as any).recordingUrl = body.recordingUrl || undefined;
  item.nextFollowUpDate = body.nextFollowUpDate
    ? new Date(body.nextFollowUpDate)
    : null;

  const savedItem = await this.contactCallHistoryRepository.save(item);

  // ✅ IMPORTANT: UPDATE LATEST CALL LOG
  if (body.recordingUrl) {
    const latestCallLog = await this.callLogRepository.findOne({
      where: { contactId: contact.id },
      order: { createdAt: 'DESC' },
    });

    if (latestCallLog) {
      await this.callLogRepository.update(latestCallLog.id, {
        recordingUrl: body.recordingUrl,
      });
    }
  }

  return savedItem;
}

  async updateContactCallHistory(
    id: number,
    historyId: number,
    body: {
      callStatus?: string;
      notes?: string;
      nextFollowUpDate?: string;
    },
    user: any,
  ) {
    await this.getAccessibleContact(id, user);

    const existingHistory = await this.contactCallHistoryRepository.findOne({
      where: { id: historyId, contactId: id },
    });

    if (!existingHistory) {
      throw new NotFoundException('Contact call history not found');
    }

    if (body.callStatus !== undefined) {
      existingHistory.callStatus = body.callStatus || 'CONNECTED';
    }

    if (body.notes !== undefined) {
      existingHistory.notes = body.notes || '';
    }

    if (body.nextFollowUpDate !== undefined) {
      existingHistory.nextFollowUpDate = body.nextFollowUpDate
        ? new Date(body.nextFollowUpDate)
        : undefined;
    }

    return this.contactCallHistoryRepository.save(existingHistory);
  }

  async startQuickContactCall(
    id: number,
    body: {
      providerName?: CallProvider | string;
      callerNumber?: string;
      receiverNumber?: string;
      providerCallId?: string;
      notes?: string;
    },
    user: any,
  ) {
    const contact = await this.getAccessibleContact(id, user);

    const providerName = String(
      body?.providerName || CallProvider.TEL_LINK,
    ).toUpperCase() as CallProvider;

    const log = this.callLogRepository.create({
      contactId: contact.id,
      telecallerId: user.id,
      callStatus: 'INITIATED',
      disposition: 'INITIATED',
      callNotes: body?.notes || '',
      providerName,
      providerCallId: body?.providerCallId || undefined,
      callDirection: CallDirection.OUTBOUND,
      callerNumber: body?.callerNumber || undefined,
      receiverNumber: body?.receiverNumber || contact.phone || undefined,
      reviewStatus: CallReviewStatus.PENDING,
      reviewAssignedTo: contact.reviewAssignedTo || undefined,
      reviewAssignedToName: contact.reviewAssignedToName || undefined,
    });

    const savedLog = await this.callLogRepository.save(log);

    return {
      message: 'Quick call started successfully',
      callLog: savedLog,
      contact: {
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
      },
    };
  }

  async completeQuickContactCall(
    id: number,
    body: {
      callLogId?: number;
      callStatus?: string;
      disposition?: string;
      callNotes?: string;
      nextFollowUpDate?: string;
      recordingUrl?: string;
      providerName?: CallProvider | string;
      providerCallId?: string;
      durationInSeconds?: number;
      callerNumber?: string;
      receiverNumber?: string;
      leadPotential?: string;
    },
    user: any,
  ) {
    const contact = await this.getAccessibleContact(id, user);

    const normalizedStatus = this.normalizeCallStatus(
      body.callStatus || body.disposition || 'CONNECTED',
    );

    let callLog: CallLog | null = null;

    if (body.callLogId) {
      callLog = await this.callLogRepository.findOne({
        where: {
          id: Number(body.callLogId),
          contactId: contact.id,
        },
      });
    }

    if (!callLog) {
      callLog = this.callLogRepository.create({
        contactId: contact.id,
        telecallerId: user.id,
        providerName: CallProvider.TEL_LINK,
        callDirection: CallDirection.OUTBOUND,
        reviewStatus: CallReviewStatus.PENDING,
      });
    }

    callLog.callStatus = normalizedStatus;
    callLog.disposition = String(
      body.disposition || body.callStatus || normalizedStatus,
    ).toUpperCase();
    callLog.callNotes = body.callNotes || '';
    callLog.nextFollowUpDate = body.nextFollowUpDate
      ? new Date(body.nextFollowUpDate)
      : undefined;
    callLog.recordingUrl = body.recordingUrl || undefined;
    callLog.providerName = String(
      body.providerName || callLog.providerName || CallProvider.TEL_LINK,
    ).toUpperCase() as CallProvider;
    callLog.providerCallId =
      body.providerCallId || callLog.providerCallId || undefined;
    callLog.durationInSeconds =
      body.durationInSeconds !== undefined && body.durationInSeconds !== null
        ? Number(body.durationInSeconds)
        : callLog.durationInSeconds || undefined;
    callLog.callerNumber =
      body.callerNumber || callLog.callerNumber || undefined;
    callLog.receiverNumber =
      body.receiverNumber || callLog.receiverNumber || contact.phone || undefined;
    callLog.providerUpdatedAt = new Date();
    callLog.reviewAssignedTo = contact.reviewAssignedTo || undefined;
    callLog.reviewAssignedToName = contact.reviewAssignedToName || undefined;
    callLog.leadPotential = this.normalizeLeadPotential(body.leadPotential);

    const savedLog = await this.callLogRepository.save(callLog);

    const historyItem = this.contactCallHistoryRepository.create({
      contactId: contact.id,
      calledBy: user.id,
      calledByName: user.name,
      callStatus: normalizedStatus,
      notes: body.callNotes || '',
      recordingUrl: body.recordingUrl || undefined,
      nextFollowUpDate: body.nextFollowUpDate
        ? new Date(body.nextFollowUpDate)
        : undefined,
    } as any);

    await this.contactCallHistoryRepository.save(historyItem);

    // ✅ CREATE FOLLOWUP IF REMINDER EXISTS
// ✅ CREATE FOLLOWUP IF REMINDER EXISTS
    // ✅ CREATE FOLLOWUP IF REMINDER EXISTS
    if (body.nextFollowUpDate) {
      try {
        let lead = await this.leadRepository.findOne({
          where: { phone: this.normalizePhone(contact.phone) },
        });

        if (!lead) {
          lead = await this.leadRepository.save({
            name: contact.name,
            phone: this.normalizePhone(contact.phone),
            city: contact.city || '',
            address: contact.address || contact.location || contact.city || '',
            source: 'TELECALLING',
            assignedTo: contact.assignedTo || user.id,
            createdBy: user.id,
            createdByName: user.name,
            originTelecallerId: contact.assignedTo,
            originTelecallerName:
              contact.assignedToName || `User ${contact.assignedTo || ''}`,
            status: LeadStatus.NEW,
          } as any);
        }

        const followUp = this.followUpRepository.create({
          leadId: lead!.id,
          assignedTo: user?.id,
          createdBy: user?.id,
          createdByName: user?.name || user?.email || 'Unknown User',
          sourceModule: 'TELECALLING',
          sourceStage: 'QUICK_CALL',
          followUpType:
            normalizedStatus === 'CALLBACK'
              ? FollowUpType.CALLBACK
              : normalizedStatus === 'INTERESTED'
              ? FollowUpType.CALL
              : FollowUpType.GENERAL,
          note:
            body.callNotes || 'Follow-up created from telecalling reminder',
          followUpDate: new Date(body.nextFollowUpDate),
          status: FollowUpStatus.PENDING,
        });

        await this.followUpRepository.save(followUp);
      } catch (err) {
        console.error('Followup creation failed:', err);
      }
    }

    const existingRemarks = String(contact.remarks || '').trim();
    const summaryNote =
      normalizedStatus === 'INTERESTED'
        ? `Quick call marked interested by ${user.name}`
        : normalizedStatus === 'NOT_INTERESTED'
        ? `Quick call marked not interested by ${user.name}`
        : normalizedStatus === 'PROPOSAL_SENT'
        ? `Quick call marked proposal sent by ${user.name}`
        : `Quick call updated by ${user.name} (${normalizedStatus})`;

    contact.remarks = existingRemarks
      ? `${existingRemarks}\n${summaryNote}`
      : summaryNote;

    await this.contactRepository.save(contact);

    return {
      message:
        normalizedStatus === 'INTERESTED'
          ? 'Call saved. Open contact for notes, follow-up, and lead conversion.'
          : normalizedStatus === 'NOT_INTERESTED'
          ? 'Call saved as not interested. Contact remains available for future follow-up.'
          : normalizedStatus === 'PROPOSAL_SENT'
          ? 'Call saved as proposal sent. Contact remains available for further action.'
          : 'Quick call completed successfully',
      callLog: savedLog,
      contact: {
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        assignedTo: contact.assignedTo,
        assignedToName: contact.assignedToName,
        reviewAssignedTo: contact.reviewAssignedTo,
        reviewAssignedToName: contact.reviewAssignedToName,
      },
      nextAction:
        normalizedStatus === 'INTERESTED' ? 'OPEN_CONTACT' : 'STAY_ON_LIST',
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

  async assignContactForReview(
    contactId: number,
    assignedTo: number,
    user: any,
  ) {
    if (!this.hasAnyRole(user, ['OWNER', 'TELECALLING_MANAGER', 'TELECALLER'])) {
      throw new ForbiddenException(
        'Only owner, telecalling manager, or telecaller can assign for assistant review',
      );
    }

    const contact = await this.contactRepository.findOne({
      where: { id: contactId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (this.hasRole(user, 'TELECALLER') && contact.assignedTo !== user.id) {
      throw new ForbiddenException(
        'You can only assign your own active contact for assistant review',
      );
    }

    const assignedUser = await this.userRepository.findOne({
      where: { id: assignedTo },
    });

    if (!assignedUser) {
      throw new NotFoundException('User not found');
    }

    const targetRoles: UserRole[] = Array.isArray(assignedUser.roles)
  ? (assignedUser.roles as UserRole[])
  : [];
    if (!targetRoles.includes('TELECALLING_ASSISTANT' as any)) {
      throw new BadRequestException(
        'Selected user must have TELECALLING_ASSISTANT role',
      );
    }

    contact.reviewAssignedTo = assignedUser.id;
    contact.reviewAssignedToName = assignedUser.name;
    await this.contactRepository.save(contact);

    const latestCall = await this.callLogRepository.findOne({
      where: { contactId },
      order: { createdAt: 'DESC' },
    });

    if (latestCall) {
      latestCall.reviewAssignedTo = assignedUser.id;
      latestCall.reviewAssignedToName = assignedUser.name;
      await this.callLogRepository.save(latestCall);
    }

    return {
      message: 'Assigned to telecalling assistant successfully',
      reviewAssignedTo: assignedUser.id,
      reviewAssignedToName: assignedUser.name,
    };
  }

  async assignLatestContactsByFilter(
    locationFilter: string,
    assignCount: number,
    assignedTo: number,
    view: string,
    user: any,
  ) {
    if (!this.hasAnyRole(user, ['OWNER', 'TELECALLING_MANAGER'])) {
      throw new ForbiddenException(
        'Only owner or telecalling manager can assign filtered contacts',
      );
    }

    const normalizedFilter = String(locationFilter || '').trim().toLowerCase();
    const normalizedView = String(view || 'active').toLowerCase();

    

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

    const qb = this.contactRepository
  .createQueryBuilder('contact')
  .where('contact.isInStorage = true') // ✅ REQUIRED
  .orderBy('contact.createdAt', 'DESC');

this.applyViewRestrictionsToContactQuery(qb, user, normalizedView);

if (normalizedFilter) {
  qb.andWhere(
    `(
      LOWER(COALESCE(contact.city, '')) LIKE :filter
      OR LOWER(COALESCE(contact.zone, '')) LIKE :filter
      OR LOWER(COALESCE(contact.address, '')) LIKE :filter
      OR LOWER(COALESCE(contact.location, '')) LIKE :filter
    )`,
    { filter: `%${normalizedFilter}%` },
  );
}

    const selectedContacts = await qb
  .take(Number(assignCount))
  .getMany();

if (!selectedContacts.length) {
  throw new NotFoundException(
    'No contacts available for the given filter',
  );
}

    if (!selectedContacts.length) {
      throw new NotFoundException('No contacts available to assign');
    }

    const ids = selectedContacts.map((contact) => contact.id);

    const updatePayload: Partial<TelecallingContact> = {
      assignedTo: assignedUser.id,
      assignedToName: assignedUser.name,
    };

    if (normalizedView === 'storage') {
      updatePayload.isInStorage = false;
    }

    const result = await this.contactRepository
      .createQueryBuilder()
      .update(TelecallingContact)
      .set(updatePayload)
      .where('id IN (:...ids)', { ids })
      .execute();

    const updatedCount = result.affected || 0;

    return {
      message:
        normalizedView === 'storage'
          ? 'Latest filtered storage contacts assigned successfully'
          : 'Latest filtered active contacts reassigned successfully',
      assignedTo: assignedUser.id,
      assignedToName: assignedUser.name,
      requestedCount: Number(assignCount),
      matchedCount: selectedContacts.length,
      updatedCount,
      view: normalizedView,
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

  async convertContactToLead(id: number, leadManagerId: number, user: any) {
  const contact = await this.contactRepository.findOne({
    where: { id },
  });

  if (!contact) {
    throw new NotFoundException('Telecalling contact not found');
  }

  if (this.hasRole(user, 'TELECALLING_ASSISTANT' as any)) {
    if (contact.reviewAssignedTo !== user.id) {
      throw new ForbiddenException('Not allowed to convert this contact');
    }
  }

  if (!leadManagerId || Number.isNaN(Number(leadManagerId))) {
    throw new BadRequestException('Lead manager is required');
  }

  const leadManager = await this.userRepository.findOne({
    where: { id: Number(leadManagerId) },
  });

  if (!leadManager) {
    throw new NotFoundException('Lead manager not found');
  }

  const managerRoles: UserRole[] = Array.isArray(leadManager.roles)
    ? (leadManager.roles as UserRole[])
    : [];

  if (!managerRoles.includes(UserRole.LEAD_MANAGER)) {
    throw new BadRequestException('Selected user must have LEAD_MANAGER role');
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
    address: contact.address || contact.location || contact.city || '',
    source: 'TELECALLING',
    assignedTo: leadManager.id,
    createdBy: user.id,
    createdByName: user.name,
    originTelecallerId: contact.assignedTo,
    originTelecallerName:
      contact.assignedToName || `User ${contact.assignedTo || ''}`,
    status: LeadStatus.NEW,
  } as any);

  const savedLead = await this.leadRepository.save(lead);

  contact.convertedToLead = true;
  contact.status = ContactStatus.CONVERTED;
  contact.phone = normalizedPhone;
  contact.remarks = contact.remarks
    ? `${contact.remarks}\nConverted to lead by ${user.name} and assigned to ${leadManager.name}`
    : `Converted to lead by ${user.name} and assigned to ${leadManager.name}`;

  await this.contactRepository.save(contact);

  return {
    message: 'Contact converted to lead successfully',
    lead: savedLead,
    assignedTo: leadManager.id,
    assignedToName: leadManager.name,
  };
}

  async convertContactToMeeting(
  id: number,
  meetingManagerId: number,
  user: any,
) {
  const contact = await this.contactRepository.findOne({
    where: { id },
  });

  if (!contact) {
    throw new NotFoundException('Telecalling contact not found');
  }

  if (this.hasRole(user, 'TELECALLING_ASSISTANT' as any)) {
    if (contact.reviewAssignedTo !== user.id) {
      throw new ForbiddenException('Not allowed to convert this contact');
    }
  }

  if (!meetingManagerId || Number.isNaN(Number(meetingManagerId))) {
    throw new BadRequestException('Meeting manager is required');
  }

  const meetingManager = await this.userRepository.findOne({
    where: { id: meetingManagerId },
  });

  if (!meetingManager) {
    throw new NotFoundException('Meeting manager not found');
  }

  const managerRoles: UserRole[] = Array.isArray(meetingManager.roles)
    ? (meetingManager.roles as UserRole[])
    : [];

  if (!managerRoles.includes(UserRole.MEETING_MANAGER)) {
    throw new BadRequestException(
      'Selected user must have MEETING_MANAGER role',
    );
  }

   const normalizedPhone = this.normalizePhone(contact.phone);

  let lead = await this.leadRepository.findOne({
  where: { phone: normalizedPhone },
});

if (!lead) {
  const createdLead = await this.leadRepository.save({
    name: contact.name,
    phone: normalizedPhone,
    city: contact.city || '',
    address: contact.address || contact.location || contact.city || '',
    source: 'TELECALLING',
    assignedTo: meetingManager.id,
    createdBy: user.id,
    createdByName: user.name,
    originTelecallerId: contact.assignedTo,
    originTelecallerName:
      contact.assignedToName || `User ${contact.assignedTo || ''}`,
    status: LeadStatus.NEW,
  } as any);

  lead = createdLead;
} else {
  lead.assignedTo = meetingManager.id;

    if (!lead.originTelecallerId) {
    lead.originTelecallerId = contact.assignedTo;
    lead.originTelecallerName =
      contact.assignedToName || `User ${contact.assignedTo || ''}`;
  }

  lead.remarks = lead.remarks
    ? `${lead.remarks}\nMeeting reassigned by ${user.name}`
    : `Meeting reassigned by ${user.name}`;

  const updatedLead = await this.leadRepository.save(lead);
  lead = updatedLead;
}

if (!lead) {
  throw new BadRequestException('Unable to create or load lead');
}

  let existingMeeting = await this.meetingRepository
    .createQueryBuilder('meeting')
    .leftJoinAndSelect('meeting.lead', 'lead')
    .where('lead.id = :leadId', { leadId: lead.id })
    .orderBy('meeting.createdAt', 'DESC')
    .getOne();

  if (existingMeeting) {
    existingMeeting.assignedTo = meetingManager.id;
    existingMeeting.assignedToName = meetingManager.name;
    existingMeeting.notes = `Reassigned from telecalling contact by ${user.name}`;
    existingMeeting.scheduledAt = new Date();

    await this.meetingRepository.save(existingMeeting);
  } else {
    await this.meetingRepository.save({
      lead: { id: lead.id },
      customerName: contact.name || 'Unknown',
      mobile: normalizedPhone,
      address: contact.address || contact.location || contact.city || '',
      assignedTo: meetingManager.id,
      assignedToName: meetingManager.name,
      meetingCategory: 'COMPANY_MEETING',
      status: 'SCHEDULED',
      notes: `Converted from telecalling contact by ${user.name}`,
      scheduledAt: new Date(),
      createdBy: user.id,
      createdByName: user.name,
    } as any);
  }

  contact.convertedToLead = true;
  contact.status = ContactStatus.CONVERTED;
  contact.phone = normalizedPhone;
  contact.remarks = contact.remarks
    ? `${contact.remarks}\nConverted/reassigned to meeting by ${user.name}`
    : `Converted/reassigned to meeting by ${user.name}`;

  await this.contactRepository.save(contact);

  return {
    message: existingMeeting
      ? 'Meeting reassigned successfully'
      : 'Contact converted to meeting successfully',
    meetingManagerId: meetingManager.id,
    meetingManagerName: meetingManager.name,
    leadId: lead.id,
  };
}

/* ✅ ADD THIS METHOD ABOVE transferContacts */
async getTelecallerContactCount(userId: number) {
  const count = await this.telecallingContactRepository.count({
    where: {
      assignedTo: userId,
      isInStorage: false,
    },
  });

  return { count };
}

  async transferContacts(body: {
  fromUserId: number;
  toUserId: number;
  count?: number;
  city?: string;
}) {
  const { fromUserId, toUserId, count, city } = body;

  if (!fromUserId || !toUserId) {
    return { message: 'Both users are required' };
  }

  const toUser = await this.userRepository.findOne({
    where: { id: toUserId },
  });

  if (!toUser) {
    return { message: 'Target user not found' };
  }

  const query = this.telecallingContactRepository
    .createQueryBuilder('contact')
    .where('contact.assignedTo = :fromUserId', { fromUserId })
    .andWhere('contact.isInStorage = false');

  if (city) {
    query.andWhere(
      `(LOWER(contact.city) LIKE :city OR LOWER(contact.zone) LIKE :city OR LOWER(contact.location) LIKE :city)`,
      { city: `%${city.toLowerCase()}%` },
    );
  }

  query.orderBy('contact.createdAt', 'DESC');

  if (count && count > 0) {
    query.take(count);
  }

  const contacts = await query.getMany();

  if (!contacts.length) {
    return { message: 'No contacts found for selected filter' };
  }

  await this.telecallingContactRepository.update(
    contacts.map((c) => c.id),
    {
      assignedTo: toUserId,
      assignedToName: toUser.name,
    },
  );

  return {
    message: `Transferred ${contacts.length} filtered contacts`,
    count: contacts.length,
  };
}

@Cron('0 3 * * *') // runs daily at 3 AM
  async cleanupOldCallLogs() {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);

      const result = await this.callLogRepository
        .createQueryBuilder()
        .delete()
        .where('createdAt < :cutoff', { cutoff })
        .execute();

      console.log(
        `🧹 Cleanup: deleted ${result.affected || 0} old call logs`,
      );
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

    async updateContactName(id: number, name: string, user: any) {
    if (!name || !name.trim()) {
      throw new BadRequestException('Name is required');
    }

    const contact = await this.getAccessibleContact(id, user);

    contact.name = name.trim();

    await this.contactRepository.save(contact);

    await this.leadRepository
      .createQueryBuilder()
      .update(Lead)
      .set({ name: name.trim() })
      .where('phone = :phone', { phone: this.normalizePhone(contact.phone) })
      .execute();

    return {
      message: 'Contact name updated successfully',
    };
  }
}


import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import {
  Meeting,
  MeetingCategory,
  MeetingStatus,
} from './meeting.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { UserRole } from '../users/user.entity';

@Injectable()
export class MeetingService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
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

  private getCurrentUserId(user: any): number {
    return Number(user?.id ?? user?.sub);
  }

  private getCurrentUserName(user: any): string {
    return user?.name || user?.email || 'Unknown User';
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

  private isMeetingManager(user: any): boolean {
    return this.hasAnyRole(user, [UserRole.MEETING_MANAGER]);
  }

  private isProjectManager(user: any): boolean {
    return this.hasAnyRole(user, [UserRole.PROJECT_MANAGER]);
  }

  private isProjectExecutive(user: any): boolean {
    return this.hasAnyRole(user, [UserRole.PROJECT_EXECUTIVE]);
  }

  private isTelecaller(user: any): boolean {
    return this.hasAnyRole(user, [UserRole.TELECALLER]);
  }

  private isLeadExecutive(user: any): boolean {
    return this.hasAnyRole(user, [UserRole.LEAD_EXECUTIVE]);
  }

  private isBroadMeetingAccessRole(user: any): boolean {
    return (
      this.isOwner(user) ||
      this.isLeadManager(user) ||
      this.isTelecallingManager(user) ||
      this.isMarketingHead(user) ||
      this.isProjectManager(user)
    );
  }

  private isOwnMeetingRole(user: any): boolean {
    return this.hasAnyRole(user, [
      UserRole.MEETING_MANAGER,
      UserRole.PROJECT_EXECUTIVE,
      UserRole.TELECALLER,
      UserRole.LEAD_EXECUTIVE,
    ]);
  }

  private normalizeDecimal(value: any): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return undefined;
    }

    return numericValue;
  }

  private applyRoleVisibility(qb: any, user: any) {
    if (this.isBroadMeetingAccessRole(user)) {
      return qb;
    }

    if (this.isOwnMeetingRole(user)) {
      const currentUserId = this.getCurrentUserId(user);

      qb.andWhere(
        '(meeting.assignedTo = :currentUserId OR meeting.createdBy = :currentUserId)',
        { currentUserId },
      );
    }

    return qb;
  }

  private getMeetingGroupKey(meeting: Meeting): number {
    return meeting.meetingGroupId || meeting.id;
  }

  private pickLatestMeetings(meetings: Meeting[]): Meeting[] {
    const latestMap = new Map<number, Meeting>();

    for (const meeting of meetings) {
      const key = this.getMeetingGroupKey(meeting);
      const existing = latestMap.get(key);

      if (!existing) {
        latestMap.set(key, meeting);
        continue;
      }

      const meetingUpdatedAt = new Date(meeting.updatedAt).getTime();
      const existingUpdatedAt = new Date(existing.updatedAt).getTime();

      if (meetingUpdatedAt > existingUpdatedAt) {
        latestMap.set(key, meeting);
        continue;
      }

      if (
        meetingUpdatedAt === existingUpdatedAt &&
        new Date(meeting.createdAt).getTime() > new Date(existing.createdAt).getTime()
      ) {
        latestMap.set(key, meeting);
      }
    }

    return Array.from(latestMap.values()).sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    );
  }

  private async getAccessibleMeeting(id: number, user: any): Promise<Meeting> {
    const meeting = await this.meetingRepository.findOne({
      where: { id },
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }

    if (this.isBroadMeetingAccessRole(user)) {
      return meeting;
    }

    if (this.isOwnMeetingRole(user)) {
      const currentUserId = this.getCurrentUserId(user);

      if (
        meeting.assignedTo !== currentUserId &&
        meeting.createdBy !== currentUserId
      ) {
        throw new ForbiddenException(
          'You can only access your own related meetings',
        );
      }

      return meeting;
    }

    return meeting;
  }

  private async buildMeetingVersion(
    baseMeeting: Meeting,
    updates: Partial<Meeting>,
    user: any,
  ): Promise<Meeting> {
    const currentUserId = this.getCurrentUserId(user);
    const currentUserName = this.getCurrentUserName(user);

    const version = this.meetingRepository.create({
      leadId: baseMeeting.leadId,
      followupId: updates.followupId ?? baseMeeting.followupId,
      customerName: updates.customerName ?? baseMeeting.customerName,
      mobile: updates.mobile ?? baseMeeting.mobile,
      address: updates.address ?? baseMeeting.address,
      scheduledAt: updates.scheduledAt ?? baseMeeting.scheduledAt,
      assignedTo: updates.assignedTo ?? baseMeeting.assignedTo,
      assignedToName: updates.assignedToName ?? baseMeeting.assignedToName,
      meetingType: updates.meetingType ?? baseMeeting.meetingType,
      meetingCategory: updates.meetingCategory ?? baseMeeting.meetingCategory,
      status: updates.status ?? baseMeeting.status,
      notes: updates.notes ?? baseMeeting.notes,
      reason: updates.reason ?? baseMeeting.reason,
      outcome: updates.outcome ?? baseMeeting.outcome,
      nextAction: updates.nextAction ?? baseMeeting.nextAction,
      managerRemarks: updates.managerRemarks ?? baseMeeting.managerRemarks,
      siteObservation: updates.siteObservation ?? baseMeeting.siteObservation,
      gpsLatitude:
        updates.gpsLatitude !== undefined
          ? updates.gpsLatitude
          : baseMeeting.gpsLatitude,
      gpsLongitude:
        updates.gpsLongitude !== undefined
          ? updates.gpsLongitude
          : baseMeeting.gpsLongitude,
      gpsAddress: updates.gpsAddress ?? baseMeeting.gpsAddress,
      gpsPhotoUrl:
  (updates as any).gpsPhotoUrl !== undefined
    ? (updates as any).gpsPhotoUrl
    : (baseMeeting as any).gpsPhotoUrl,

audioUrl:
  (updates as any).audioUrl !== undefined
    ? (updates as any).audioUrl
    : (baseMeeting as any).audioUrl,
      panelGivenToCustomerKw:
        updates.panelGivenToCustomerKw !== undefined
          ? updates.panelGivenToCustomerKw
          : baseMeeting.panelGivenToCustomerKw,
      inverterCapacityKw:
        updates.inverterCapacityKw !== undefined
          ? updates.inverterCapacityKw
          : baseMeeting.inverterCapacityKw,
      structureKw:
        updates.structureKw !== undefined
          ? updates.structureKw
          : baseMeeting.structureKw,
      proposedSystemKw:
        updates.proposedSystemKw !== undefined
          ? updates.proposedSystemKw
          : baseMeeting.proposedSystemKw,
      meetingCount:
        updates.meetingCount !== undefined
          ? updates.meetingCount
          : baseMeeting.meetingCount,
      convertToProject:
        updates.convertToProject !== undefined
          ? updates.convertToProject
          : baseMeeting.convertToProject,
      createdBy: baseMeeting.createdBy,
      createdByName: baseMeeting.createdByName,
      updatedBy: currentUserId,
      updatedByName: currentUserName,
      meetingGroupId: baseMeeting.meetingGroupId || baseMeeting.id,
    });

    return this.meetingRepository.save(version);
  }

  async uploadMeetingProof(file: any, user: any) {
  if (!file) {
    throw new BadRequestException('Proof file is required');
  }

  const mimeType = String(file.mimetype || '');

  const isImage = mimeType.startsWith('image/');
  const isAudio = mimeType.startsWith('audio/');

  if (!isImage && !isAudio) {
    throw new BadRequestException('Only image or audio files are allowed');
  }

  const maxSize = 20 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new BadRequestException('Proof file must be less than 20 MB');
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket =
    process.env.SUPABASE_CALL_RECORDINGS_BUCKET || 'call-recordings';

  if (!supabaseUrl || !serviceKey) {
    throw new BadRequestException('Supabase storage is not configured');
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const extension = file.originalname.split('.').pop();

  const filePath = `meeting-proofs/user-${user?.id}/${Date.now()}.${extension}`;

  const uploadResult = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: mimeType,
    });

  if (uploadResult.error) {
    throw new BadRequestException(uploadResult.error.message);
  }

  const publicUrl = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath).data.publicUrl;

  return {
    fileUrl: publicUrl,
  };
}

    async create(createMeetingDto: CreateMeetingDto, user: any): Promise<Meeting> {
    const currentUserId = this.getCurrentUserId(user);
    const currentUserName = this.getCurrentUserName(user);

    const assignedTo =
      this.isOwnMeetingRole(user) && !(createMeetingDto as any).assignedTo
        ? currentUserId
        : (createMeetingDto as any).assignedTo;

    const assignedToName =
      this.isOwnMeetingRole(user) && !(createMeetingDto as any).assignedToName
        ? currentUserName
        : (createMeetingDto as any).assignedToName;

    let existingMeetingCount = 0;

    if (
      (createMeetingDto as any).leadId !== undefined &&
      (createMeetingDto as any).leadId !== null &&
      (createMeetingDto as any).leadId !== ''
    ) {
      existingMeetingCount = await this.meetingRepository.count({
        where: { leadId: Number((createMeetingDto as any).leadId) },
      });
    }

    const meetingData: Partial<Meeting> = {
      ...(createMeetingDto as any),
      leadId:
        (createMeetingDto as any).leadId !== undefined &&
        (createMeetingDto as any).leadId !== null &&
        (createMeetingDto as any).leadId !== ''
          ? Number((createMeetingDto as any).leadId)
          : undefined,
      followupId:
        (createMeetingDto as any).followupId !== undefined &&
        (createMeetingDto as any).followupId !== null &&
        (createMeetingDto as any).followupId !== ''
          ? Number((createMeetingDto as any).followupId)
          : undefined,
      scheduledAt: new Date((createMeetingDto as any).scheduledAt),
      assignedTo:
        assignedTo !== undefined && assignedTo !== null && assignedTo !== ''
          ? Number(assignedTo)
          : undefined,
      assignedToName,
      meetingCategory:
        (createMeetingDto as any).meetingCategory ||
        MeetingCategory.COMPANY_MEETING,
      panelGivenToCustomerKw: this.normalizeDecimal(
        (createMeetingDto as any).panelGivenToCustomerKw,
      ),
      inverterCapacityKw: this.normalizeDecimal(
        (createMeetingDto as any).inverterCapacityKw,
      ),
      structureKw: this.normalizeDecimal(
        (createMeetingDto as any).structureKw,
      ),
      proposedSystemKw: this.normalizeDecimal(
        (createMeetingDto as any).proposedSystemKw,
      ),
      meetingCount:
        (createMeetingDto as any).meetingCount !== undefined &&
        (createMeetingDto as any).meetingCount !== null &&
        (createMeetingDto as any).meetingCount !== ''
          ? Number((createMeetingDto as any).meetingCount)
          : existingMeetingCount + 1,
      convertToProject: Boolean((createMeetingDto as any).convertToProject),
      createdBy: currentUserId,
      createdByName: currentUserName,
      updatedBy: currentUserId,
      updatedByName: currentUserName,
    };

    let meeting = this.meetingRepository.create(meetingData) as Meeting;
    meeting = (await this.meetingRepository.save(meeting)) as Meeting;

    if (!meeting.meetingGroupId) {
      meeting.meetingGroupId = meeting.id;
      meeting = (await this.meetingRepository.save(meeting)) as Meeting;
    }

    return meeting;
  }

  async findAll(query: any, user: any): Promise<Meeting[]> {
    const qb = this.meetingRepository.createQueryBuilder('meeting');

    this.applyRoleVisibility(qb, user);

    if (query.status) {
      qb.andWhere('meeting.status = :status', {
        status: query.status,
      });
    }

    if (query.meetingType) {
      qb.andWhere('meeting.meetingType = :meetingType', {
        meetingType: query.meetingType,
      });
    }

    if (query.meetingCategory) {
      qb.andWhere('meeting.meetingCategory = :meetingCategory', {
        meetingCategory: query.meetingCategory,
      });
    }

    if (query.assignedTo) {
      qb.andWhere('meeting.assignedTo = :assignedTo', {
        assignedTo: Number(query.assignedTo),
      });
    }

    if (query.assignedToName) {
      qb.andWhere('meeting.assignedToName ILIKE :assignedToName', {
        assignedToName: `%${query.assignedToName}%`,
      });
    }

    if (query.leadId) {
      qb.andWhere('meeting.leadId = :leadId', {
        leadId: Number(query.leadId),
      });
    }

    if (query.followupId) {
      qb.andWhere('meeting.followupId = :followupId', {
        followupId: Number(query.followupId),
      });
    }

    if (query.mobile) {
      qb.andWhere('meeting.mobile ILIKE :mobile', {
        mobile: `%${query.mobile}%`,
      });
    }

    if (query.customerName) {
      qb.andWhere('meeting.customerName ILIKE :customerName', {
        customerName: `%${query.customerName}%`,
      });
    }

    if (query.fromDate) {
      qb.andWhere('meeting.scheduledAt >= :fromDate', {
        fromDate: query.fromDate,
      });
    }

    if (query.toDate) {
      qb.andWhere('meeting.scheduledAt <= :toDate', {
        toDate: query.toDate,
      });
    }

    if (query.month) {
      qb.andWhere(`TO_CHAR(meeting.scheduledAt, 'YYYY-MM') = :month`, {
        month: query.month,
      });
    }

    qb.orderBy('meeting.scheduledAt', 'DESC').addOrderBy('meeting.updatedAt', 'DESC');

    const meetings = await qb.getMany();

    const includeHistory = String(query.includeHistory || 'false') === 'true';
    const latestOnly = String(query.latestOnly || 'true') !== 'false';

    if (includeHistory || !latestOnly) {
      return meetings;
    }

    return this.pickLatestMeetings(meetings);
  }

  async findOne(id: number, user: any): Promise<Meeting> {
    return this.getAccessibleMeeting(id, user);
  }

  async getDetail(id: number, user: any) {
    const meeting = await this.getAccessibleMeeting(id, user);
    const groupId = meeting.meetingGroupId || meeting.id;

    const history = await this.meetingRepository.find({
      where: [{ meetingGroupId: groupId }, { id: groupId }],
      order: { updatedAt: 'DESC', createdAt: 'DESC' },
    });

    const latestMeeting = history[0] || meeting;

    return {
      latestMeeting,
      history,
    };
  }

  async update(
    id: number,
    updateMeetingDto: UpdateMeetingDto,
    user: any,
  ): Promise<Meeting> {
    const existingMeeting = await this.getAccessibleMeeting(id, user);

    const currentUserId = this.getCurrentUserId(user);

    let assignedTo = (updateMeetingDto as any).assignedTo;
    let assignedToName = (updateMeetingDto as any).assignedToName;

    if (this.isOwnMeetingRole(user)) {
      assignedTo = existingMeeting.assignedTo || currentUserId;
      assignedToName =
        existingMeeting.assignedToName || this.getCurrentUserName(user);
    }

    const version = await this.buildMeetingVersion(
      existingMeeting,
      {
        ...updateMeetingDto,
        scheduledAt: updateMeetingDto.scheduledAt
          ? new Date(updateMeetingDto.scheduledAt as any)
          : existingMeeting.scheduledAt,
        assignedTo,
        assignedToName,
        meetingCategory:
          (updateMeetingDto as any).meetingCategory ||
          existingMeeting.meetingCategory,
        panelGivenToCustomerKw:
          (updateMeetingDto as any).panelGivenToCustomerKw !== undefined
            ? this.normalizeDecimal((updateMeetingDto as any).panelGivenToCustomerKw)
            : existingMeeting.panelGivenToCustomerKw,
        inverterCapacityKw:
          (updateMeetingDto as any).inverterCapacityKw !== undefined
            ? this.normalizeDecimal((updateMeetingDto as any).inverterCapacityKw)
            : existingMeeting.inverterCapacityKw,
        structureKw:
          (updateMeetingDto as any).structureKw !== undefined
            ? this.normalizeDecimal((updateMeetingDto as any).structureKw)
            : existingMeeting.structureKw,
        proposedSystemKw:
          (updateMeetingDto as any).proposedSystemKw !== undefined
            ? this.normalizeDecimal((updateMeetingDto as any).proposedSystemKw)
            : existingMeeting.proposedSystemKw,
        meetingCount:
          (updateMeetingDto as any).meetingCount !== undefined
            ? Number((updateMeetingDto as any).meetingCount)
            : existingMeeting.meetingCount,
        convertToProject:
          (updateMeetingDto as any).convertToProject !== undefined
            ? Boolean((updateMeetingDto as any).convertToProject)
            : existingMeeting.convertToProject,
      } as any,
      user,
    );

    return version;
  }

  async applyAction(
  id: number,
  actionData: {
    status: MeetingStatus | string;
    reason?: string;
    outcome?: string;
    nextAction?: string;
    managerRemarks?: string;
    notes?: string;
    convertToProject?: boolean;
    newScheduledAt?: string;
    gpsPhotoUrl?: string;
    audioUrl?: string;
  },
  user: any,
): Promise<Meeting> {
  const existingMeeting = await this.getAccessibleMeeting(id, user);

  if (actionData.status === MeetingStatus.RESCHEDULED) {
    if (!actionData.newScheduledAt) {
      throw new BadRequestException(
        'New scheduled date/time is required for rescheduling',
      );
    }

    if (!actionData.gpsPhotoUrl && !actionData.audioUrl) {
      throw new BadRequestException(
        'GPS photo or audio recording is required for rescheduling',
      );
    }

    existingMeeting.status = MeetingStatus.RESCHEDULED;

existingMeeting.scheduledAt = new Date(actionData.newScheduledAt);

existingMeeting.reason = actionData.reason || existingMeeting.reason;
existingMeeting.outcome = actionData.outcome || existingMeeting.outcome;
existingMeeting.nextAction = actionData.nextAction || existingMeeting.nextAction;
existingMeeting.managerRemarks =
  actionData.managerRemarks || existingMeeting.managerRemarks;
existingMeeting.notes = actionData.notes ?? existingMeeting.notes;

(existingMeeting as any).gpsPhotoUrl =
  actionData.gpsPhotoUrl || (existingMeeting as any).gpsPhotoUrl;

(existingMeeting as any).audioUrl =
  actionData.audioUrl || (existingMeeting as any).audioUrl;

existingMeeting.updatedBy = this.getCurrentUserId(user);
existingMeeting.updatedByName = this.getCurrentUserName(user);

return this.meetingRepository.save(existingMeeting);
  }

  return this.buildMeetingVersion(
    existingMeeting,
    {
      status: actionData.status as MeetingStatus,
      reason: actionData.reason,
      outcome: actionData.outcome,
      nextAction: actionData.nextAction,
      managerRemarks: actionData.managerRemarks,
      notes: actionData.notes ?? existingMeeting.notes,
      convertToProject:
        actionData.convertToProject !== undefined
          ? Boolean(actionData.convertToProject)
          : existingMeeting.convertToProject,
    },
    user,
  );
}

  async updateStatus(
    id: number,
    payload: any,
    user: any,
  ): Promise<Meeting> {
    if (typeof payload === 'string') {
      return this.applyAction(
        id,
        {
          status: payload,
        },
        user,
      );
    }

    return this.applyAction(
      id,
      {
        status: payload?.status,
        reason: payload?.reason,
        outcome: payload?.outcome,
        nextAction: payload?.nextAction,
        managerRemarks: payload?.managerRemarks,
        notes: payload?.notes,
        convertToProject: payload?.convertToProject,
      },
      user,
    );
  }

  async remove(id: number, user: any): Promise<{ message: string }> {
    await this.getAccessibleMeeting(id, user);

    await this.meetingRepository.delete(id);

    return {
      message: `Meeting with ID ${id} deleted successfully`,
    };
  }
}
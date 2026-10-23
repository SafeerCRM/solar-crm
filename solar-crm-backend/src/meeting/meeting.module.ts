import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting } from './meeting.entity';
import { Lead } from '../leads/lead.entity';
import { SolarStore } from '../solar-store/solar-store.entity';
import { MeetingService } from './meeting.service';
import { MeetingController } from './meeting.controller';
import { MeetingPublicController } from './meeting-public.controller';
import { ProjectModule } from '../project/project.module';
import { MeetingReviewRemark } from './meeting-review-remark.entity';
import {
  SolarMitraReferral,
} from '../solar-mitra/solar-mitra-referral.entity';

import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { StaffMember } from '../staff/staff-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
  Meeting,
  MeetingReviewRemark,
  SolarMitraReferral,
  Lead,
  SolarStore,
  StaffMember,
]),
    forwardRef(() => ProjectModule),
    forwardRef(() => WhatsappModule),
  ],
  controllers: [
  MeetingController,
  MeetingPublicController,
],
  providers: [MeetingService],
  exports: [MeetingService],
})
export class MeetingModule {}
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting } from './meeting.entity';
import { MeetingService } from './meeting.service';
import { MeetingController } from './meeting.controller';
import { ProjectModule } from '../project/project.module';
import { MeetingReviewRemark } from './meeting-review-remark.entity';
import {
  SolarMitraReferral,
} from '../solar-mitra/solar-mitra-referral.entity';

import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
  Meeting,
  MeetingReviewRemark,
  SolarMitraReferral,
]),
    forwardRef(() => ProjectModule),
    forwardRef(() => WhatsappModule),
  ],
  controllers: [MeetingController],
  providers: [MeetingService],
  exports: [MeetingService],
})
export class MeetingModule {}
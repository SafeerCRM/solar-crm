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

@Module({
  imports: [
    TypeOrmModule.forFeature([
  Meeting,
  MeetingReviewRemark,
  SolarMitraReferral,
]),
    forwardRef(() => ProjectModule),
  ],
  controllers: [MeetingController],
  providers: [MeetingService],
  exports: [MeetingService],
})
export class MeetingModule {}
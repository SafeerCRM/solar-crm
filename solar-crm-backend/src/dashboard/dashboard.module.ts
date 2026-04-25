import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

import { Lead } from '../leads/lead.entity';
import { CallLog } from '../telecalling/call-log.entity';
import { FollowUp } from '../followup/follow-up.entity';
import { TelecallingContact } from '../telecalling/telecalling-contact.entity';
import { Meeting } from '../meeting/meeting.entity'; // ✅ IMPORTANT

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead,
      CallLog,
      FollowUp,
      TelecallingContact,
      Meeting, // ✅ MUST BE HERE
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
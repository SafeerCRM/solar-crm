import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

import { Lead } from '../leads/lead.entity';
import { CallLog } from '../telecalling/call-log.entity';
import { FollowUp } from '../followup/follow-up.entity';
import { TelecallingContact } from '../telecalling/telecalling-contact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead,
      CallLog,
      FollowUp,
      TelecallingContact, // ✅ THIS WAS MISSING
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
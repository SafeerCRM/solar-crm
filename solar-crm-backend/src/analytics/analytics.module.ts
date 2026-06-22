import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

import { User } from '../users/user.entity';
import { Lead } from '../leads/lead.entity';
import { CallLog } from '../telecalling/call-log.entity';
import { TelecallingContact } from '../telecalling/telecalling-contact.entity';
import { Meeting } from '../meeting/meeting.entity';
import { Project } from '../project/project.entity';
import { ProjectPaymentInstallment } from '../project/project-payment-installment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Lead,
      CallLog,
      TelecallingContact,
      Meeting,
      Project,
      ProjectPaymentInstallment,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
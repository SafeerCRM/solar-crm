import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Lead } from '../leads/lead.entity';
import { CallLog } from '../telecalling/call-log.entity';
import { FollowUp } from '../followup/follow-up.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, CallLog, FollowUp])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
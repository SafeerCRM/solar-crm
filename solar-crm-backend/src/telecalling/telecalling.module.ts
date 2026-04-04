import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelecallingService } from './telecalling.service';
import { TelecallingController } from './telecalling.controller';
import { CallLog } from './call-log.entity';
import { Lead } from '../leads/lead.entity';
import { FollowUp } from '../followup/follow-up.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CallLog, Lead, FollowUp])],
  controllers: [TelecallingController],
  providers: [TelecallingService],
  exports: [TelecallingService],
})
export class TelecallingModule {}
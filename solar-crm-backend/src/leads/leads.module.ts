import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { Lead } from './lead.entity';
import { FollowUp } from '../followup/follow-up.entity';
import { CallLog } from '../telecalling/call-log.entity';
import { LeadNote } from './lead-note.entity';
import { LeadStorage } from './lead-storage.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead,
      FollowUp,
      CallLog,
      LeadNote,
      LeadStorage,
    ]),
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
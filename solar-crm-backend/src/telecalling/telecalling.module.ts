import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelecallingController } from './telecalling.controller';
import { TelecallingService } from './telecalling.service';
import { CallLog } from './call-log.entity';
import { Lead } from '../leads/lead.entity';
import { FollowUp } from '../followup/follow-up.entity';
import { TelecallingContact } from './telecalling-contact.entity';
import { User } from '../users/user.entity';
import { ContactCallHistory } from './contact-call-history.entity';
import { ContactNote } from './contact-note.entity';
import { Meeting } from '../meeting/meeting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CallLog,
      Meeting,
      Lead,
      FollowUp,
      TelecallingContact,
      User,
      ContactCallHistory,
      ContactNote,
    ]),
  ],
  controllers: [TelecallingController],
  providers: [TelecallingService],
  exports: [TelecallingService],
})
export class TelecallingModule {}
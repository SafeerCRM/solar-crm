import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { Lead } from './lead.entity';
import { FollowUp } from '../followup/follow-up.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, FollowUp])],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
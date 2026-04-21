import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowupService } from './followup.service';
import { FollowupController } from './followup.controller';
import { FollowUp } from './follow-up.entity';
import { Lead } from '../leads/lead.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FollowUp,Lead])],
  controllers: [FollowupController],
  providers: [FollowupService],
})
export class FollowupModule {}
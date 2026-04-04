import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowupService } from './followup.service';
import { FollowupController } from './followup.controller';
import { FollowUp } from './follow-up.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FollowUp])],
  controllers: [FollowupController],
  providers: [FollowupService],
})
export class FollowupModule {}
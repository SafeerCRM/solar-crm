import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffComplaint } from './staff-complaint.entity';
import { StaffComplaintService } from './staff-complaint.service';
import { StaffComplaintController } from './staff-complaint.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StaffComplaint])],
  providers: [StaffComplaintService],
  controllers: [StaffComplaintController],
})
export class StaffComplaintModule {}
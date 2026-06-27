import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffMember } from './staff-member.entity';
import { StaffDocument } from './staff-document.entity';
import { StaffAsset } from './staff-asset.entity';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { StaffAttendance } from './staff-attendance.entity';
import { StaffSelfController } from './staff-self.controller';
import { StaffLeave } from './staff-leave.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StaffMember,
      StaffDocument,
      StaffAsset,
      StaffAttendance,
      StaffLeave,
    ]),
  ],
  controllers: [StaffController, StaffSelfController],
  providers: [StaffService],
})
export class StaffModule {}
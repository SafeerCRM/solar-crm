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
import { HrPolicy } from './hr-policy.entity';
import { EmployeePolicy } from './employee-policy.entity';
import { StaffPayroll } from './staff-payroll.entity';
import { IncentiveRule } from './incentive-rule.entity';
import { RecruitmentCandidate } from './recruitment-candidate.entity';
import { RecruitmentCandidateDocument } from './recruitment-candidate-document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StaffMember,
      StaffDocument,
      StaffAsset,
      StaffAttendance,
      StaffLeave,
      HrPolicy,
      EmployeePolicy,
      StaffPayroll,
      IncentiveRule,
      RecruitmentCandidate,
      RecruitmentCandidateDocument,
    ]),
  ],
  controllers: [StaffController, StaffSelfController],
  providers: [StaffService],
})
export class StaffModule {}
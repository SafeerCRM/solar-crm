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
import { StaffPerformance } from './staff-performance.entity';
import { PerformanceTemplate } from './performance-template.entity';
import { PerformanceTemplateMetric } from './performance-template-metric.entity';
import { PenaltyRule } from './penalty-rule.entity';
import { AttendanceLocation } from './attendance-location.entity';
import { StaffAttendancePolicy } from './staff-attendance-policy.entity';
import { StaffAttendanceOverride } from './staff-attendance-override.entity';
import { StaffAttendanceException } from './staff-attendance-exception.entity';
import {
  Project,
} from '../project/project.entity';

import {
  ProjectPaymentReceipt,
} from '../project/project-payment-receipt.entity';

import {
  Lead,
} from '../leads/lead.entity';

import {
  StaffPayrollCalculatorService,
} from './staff-payroll-calculator.service';
import {
  Meeting,
} from '../meeting/meeting.entity';
import {
  StaffPayrollRule,
} from './staff-payroll-rule.entity';
import {
  StaffPayrollMetricCatalogueService,
} from './staff-payroll-metric-catalogue.service';
import { StaffPayrollMetricResolverService } from './staff-payroll-metric-resolver.service';
import {
  ProjectTradingMeeting,
} from '../project/project-trading-meeting.entity';

import {
  ProjectDealerOrder,
} from '../project/project-dealer-order.entity';
import {
  ProjectDealerOrderItem,
} from '../project/project-dealer-order-item.entity';

import {
  ProjectStockItem,
} from '../project/project-stock-item.entity';

import { CallLog } from '../telecalling/call-log.entity';



@Module({
  imports: [
    TypeOrmModule.forFeature([
  Project,
  ProjectPaymentReceipt,
  Meeting,
  Lead,
  StaffMember,
  StaffPayrollRule,
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
      StaffPerformance,
      PerformanceTemplate,
PerformanceTemplateMetric,
PenaltyRule,
AttendanceLocation,
StaffAttendancePolicy,
StaffAttendanceOverride,
StaffAttendanceException,
ProjectTradingMeeting,
ProjectDealerOrder,
ProjectDealerOrderItem,
ProjectStockItem,
CallLog,
    ]),
  ],
  controllers: [StaffController, StaffSelfController],
  providers: [
  StaffService,
  StaffPayrollCalculatorService,
  StaffPayrollMetricCatalogueService,
  StaffPayrollMetricResolverService,
],
})
export class StaffModule {}
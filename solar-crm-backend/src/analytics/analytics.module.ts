import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

import { User } from '../users/user.entity';
import { Lead } from '../leads/lead.entity';
import { FollowUp } from '../followup/follow-up.entity';

import { CallLog } from '../telecalling/call-log.entity';
import { TelecallingContact } from '../telecalling/telecalling-contact.entity';

import { Meeting } from '../meeting/meeting.entity';

import { Project } from '../project/project.entity';
import { ProjectPaymentInstallment } from '../project/project-payment-installment.entity';
import { ProjectPaymentReceipt } from '../project/project-payment-receipt.entity';
import { ProjectAccountExpense } from '../project/project-account-expense.entity';
import { ProjectPartyLedger } from '../project/project-party-ledger.entity';

import { ProjectContractor } from '../project/project-contractor.entity';
import { ProjectContractorAssignment } from '../project/project-contractor-assignment.entity';
import { ProjectContractorProof } from '../project/project-contractor-proof.entity';
import { ProjectContractorComment } from '../project/project-contractor-comment.entity';
import { ProjectContractorRescheduleRequest } from '../project/project-contractor-reschedule-request.entity';
import { ProjectCleaningAssignment } from '../project/project-cleaning-assignment.entity';

import { CustomerComplaint } from '../customer-portal/customer-complaint.entity';
import { CustomerComplaintActivity } from '../customer-portal/customer-complaint-activity.entity';
import { CustomerAfterSalesRequest } from '../customer-portal/customer-after-sales-request.entity';
import { CustomerAfterSalesRequestActivity } from '../customer-portal/customer-after-sales-request-activity.entity';
import { CustomerComplaintAttachment } from '../customer-portal/customer-complaint-attachment.entity';
import { CustomerAfterSalesRequestRating } from '../customer-portal/customer-after-sales-request-rating.entity';


import { ProjectDealerComment } from '../project/project-dealer-comment.entity';
import { ProjectDealerNotification } from '../project/project-dealer-notification.entity';

import { DealerComplaint } from '../dealer/dealer-complaint.entity';
import { DealerAnnouncement } from '../dealer/dealer-announcement.entity';

import { ProjectPurchaseOrder } from '../project/project-purchase-order.entity';
import { ProjectProformaInvoice } from '../project/project-proforma-invoice.entity';
import { ProjectFinalInvoice } from '../project/project-final-invoice.entity';
import { ProjectDealerOrder } from '../project/project-dealer-order.entity';
import { ProjectDealerPayment } from '../project/project-dealer-payment.entity';
import { ProjectConsumption } from '../project/project-consumption.entity';

import { ProjectVendorBill } from '../project/project-vendor-bill.entity';
import { ProjectVendorPayment } from '../project/project-vendor-payment.entity';
import { ProjectVendorDocument } from '../project/project-vendor-document.entity';
import { ProjectVendorPaymentReceipt } from '../project/project-vendor-payment-receipt.entity';
import { ProjectVendorCompany } from '../project/project-vendor-company.entity';

import { ProjectStockItem } from '../project/project-stock-item.entity';
import { ProjectStockMovement } from '../project/project-stock-movement.entity';
import { ProjectStockFile } from '../project/project-stock-file.entity';
import { ProjectTradingMeeting } from '../project/project-trading-meeting.entity';
import { Dealer } from '../dealer/dealer.entity';
import { ProjectLoanDetail } from '../project/project-loan-detail.entity';
import { ProjectSubsidyDetail } from '../project/project-subsidy-detail.entity';
import { ProjectElectricityDetail } from '../project/project-electricity-detail.entity';
import { ProjectElectricityWork } from '../project/project-electricity-work.entity';
import { ProjectExecutionActivity } from '../project/project-execution-activity.entity';
import { ProjectExecutionProof } from '../project/project-execution-proof.entity';
import { ProjectTimelineDelayNote } from '../project/project-timeline-delay-note.entity';

import { StaffMember } from '../staff/staff-member.entity';
import { StaffAttendance } from '../staff/staff-attendance.entity';
import { StaffLeave } from '../staff/staff-leave.entity';
import { StaffAttendanceException } from '../staff/staff-attendance-exception.entity';
import { StaffAttendanceOverride } from '../staff/staff-attendance-override.entity';
import { StaffPenalty } from '../staff/staff-penalty.entity';
import { StaffPayroll } from '../staff/staff-payroll.entity';
import { StaffPerformance } from '../staff/staff-performance.entity';
import { RecruitmentCandidate } from '../staff/recruitment-candidate.entity';
import { RecruitmentCandidateDocument } from '../staff/recruitment-candidate-document.entity';
import { StaffDocument } from '../staff/staff-document.entity';
import { StaffComplaint } from '../staff-complaint/staff-complaint.entity';
import { StaffLocationTrackingSession } from '../staff-location/staff-location-tracking-session.entity';
import { StaffLocationEvent } from '../staff-location/staff-location-event.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Lead,
      FollowUp,

      CallLog,
      TelecallingContact,

      Meeting,

      Project,
ProjectPaymentInstallment,
ProjectPaymentReceipt,
ProjectLoanDetail,
ProjectSubsidyDetail,
ProjectElectricityDetail,
ProjectElectricityWork,
ProjectExecutionActivity,
ProjectExecutionProof,
ProjectTimelineDelayNote,
ProjectAccountExpense,
ProjectPartyLedger,
ProjectPurchaseOrder,
ProjectProformaInvoice,
ProjectFinalInvoice,
ProjectDealerOrder,
ProjectDealerPayment,
ProjectDealerComment,
ProjectDealerNotification,
DealerAnnouncement,
ProjectConsumption,

ProjectVendorBill,
ProjectVendorPayment,
ProjectVendorDocument,
ProjectVendorPaymentReceipt,
ProjectVendorCompany,

ProjectContractor,
ProjectContractorAssignment,
ProjectContractorProof,
ProjectContractorComment,
ProjectContractorRescheduleRequest,
ProjectCleaningAssignment,

CustomerComplaint,
CustomerComplaintActivity,

CustomerAfterSalesRequest,
CustomerAfterSalesRequestActivity,
CustomerComplaintAttachment,
CustomerAfterSalesRequestRating,

DealerComplaint,

ProjectStockItem,
ProjectStockMovement,
ProjectStockFile,
ProjectTradingMeeting,
Dealer,
StaffMember,
StaffAttendance,
StaffLeave,
StaffAttendanceException,
StaffAttendanceOverride,
StaffPenalty,
StaffPayroll,
StaffPerformance,
RecruitmentCandidate,
RecruitmentCandidateDocument,
StaffDocument,
StaffComplaint,
StaffLocationTrackingSession,
StaffLocationEvent,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
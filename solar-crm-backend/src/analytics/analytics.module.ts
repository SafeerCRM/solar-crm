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

import { DealerComplaint } from '../dealer/dealer-complaint.entity';

import { ProjectPurchaseOrder } from '../project/project-purchase-order.entity';
import { ProjectProformaInvoice } from '../project/project-proforma-invoice.entity';
import { ProjectFinalInvoice } from '../project/project-final-invoice.entity';
import { ProjectDealerOrder } from '../project/project-dealer-order.entity';
import { ProjectDealerPayment } from '../project/project-dealer-payment.entity';
import { ProjectConsumption } from '../project/project-consumption.entity';

import { ProjectStockItem } from '../project/project-stock-item.entity';
import { ProjectStockMovement } from '../project/project-stock-movement.entity';
import { ProjectTradingMeeting } from '../project/project-trading-meeting.entity';
import { Dealer } from '../dealer/dealer.entity';
import { ProjectLoanDetail } from '../project/project-loan-detail.entity';
import { ProjectSubsidyDetail } from '../project/project-subsidy-detail.entity';


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
      ProjectLoanDetail,
      ProjectSubsidyDetail,
      ProjectAccountExpense,
      ProjectPartyLedger,

      ProjectPurchaseOrder,
ProjectProformaInvoice,
ProjectFinalInvoice,
ProjectDealerOrder,
ProjectDealerPayment,
ProjectConsumption,

      ProjectContractor,
      ProjectContractorAssignment,
      ProjectContractorProof,
      ProjectContractorComment,
      ProjectContractorRescheduleRequest,
      ProjectCleaningAssignment,

      CustomerComplaint,
      CustomerComplaintActivity,

      DealerComplaint,

      ProjectStockItem,
ProjectStockMovement,
ProjectTradingMeeting,
Dealer,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
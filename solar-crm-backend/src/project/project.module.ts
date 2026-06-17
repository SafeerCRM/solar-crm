import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectDocument } from './project-document.entity';
import { ProjectComment } from './project-comment.entity';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { CalculatorModule } from '../calculator/calculator.module';
import { ProjectMaterialMaster } from './project-material-master.entity';
import { ProjectMaterialRequest } from './project-material-request.entity';
import { ProjectMaterialRequestItem } from './project-material-request-item.entity';
import { ProjectBranch } from './project-branch.entity';
import { ProjectLoanDetail } from './project-loan-detail.entity';
import { ProjectSubsidyDetail } from './project-subsidy-detail.entity';
import { ProjectElectricityDetail } from './project-electricity-detail.entity';
import { ProjectExecutionActivity } from './project-execution-activity.entity';
import { ProjectExecutionProof } from './project-execution-proof.entity';
import { ProjectExecutionReminder } from './project-execution-reminder.entity';
import { ProjectExecutionReminderUserState } from './project-execution-reminder-user-state.entity';
import { ProjectPaymentInstallment } from './project-payment-installment.entity';
import { ProjectPaymentReminderUserState } from './project-payment-reminder-user-state.entity';
import { ProjectReminderUserState } from './project-reminder-user-state.entity';
import { ProjectEditHistory } from './project-edit-history.entity';
import { ProjectVendor } from './project-vendor.entity';
import { ProjectPurchaseOrder } from './project-purchase-order.entity';
import { ProjectPurchaseOrderItem } from './project-purchase-order-item.entity';
import { ProjectProformaInvoice } from './project-proforma-invoice.entity';
import { ProjectProformaInvoiceItem } from './project-proforma-invoice-item.entity';
import { ProjectFinalInvoice } from './project-final-invoice.entity';
import { ProjectFinalInvoiceItem } from './project-final-invoice-item.entity';
import { ProjectPartyLedger } from './project-party-ledger.entity';
import { ProjectContractorAssignment } from './project-contractor-assignment.entity';
import { ProjectContractorProof } from './project-contractor-proof.entity';
import { ProjectContractor } from './project-contractor.entity';
import { ProjectContractorComment } from './project-contractor-comment.entity';
import { ProjectLoanCoApplicant } from './project-loan-co-applicant.entity';
import { ProjectAccountExpense } from './project-account-expense.entity';
import { ProjectStockItem } from './project-stock-item.entity';
import { ProjectStockMovement } from './project-stock-movement.entity';
import { ProjectConsumption } from './project-consumption.entity';
import { ProjectCustomerUpdate } from './project-customer-update.entity';
import { ProjectDealerOrder } from './project-dealer-order.entity';
import { ProjectDealerOrderItem } from './project-dealer-order-item.entity';
import { ProjectDealerPayment } from './project-dealer-payment.entity';
import { ProjectDealerComment } from './project-dealer-comment.entity';
import { ProjectDealerNotification } from './project-dealer-notification.entity';
import { ProjectDealerMonthlyRequirement } from './project-dealer-monthly-requirement.entity';
import { ProjectTradingMeeting } from './project-trading-meeting.entity';
import { FollowUp } from '../followup/follow-up.entity';
import { ProjectCleaningAssignment } from './project-cleaning-assignment.entity';
import { ProjectContractorRescheduleRequest } from './project-contractor-reschedule-request.entity';
import { CustomerNotification } from '../customer-portal/customer-notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectDocument, CustomerNotification, ProjectComment, ProjectMaterialMaster, ProjectMaterialRequest,
ProjectMaterialRequestItem, ProjectBranch, ProjectLoanDetail, ProjectSubsidyDetail, ProjectElectricityDetail, ProjectExecutionActivity, ProjectExecutionProof, ProjectExecutionReminder, ProjectExecutionReminderUserState, ProjectPaymentInstallment, ProjectPaymentReminderUserState, ProjectReminderUserState, ProjectEditHistory,
 ProjectVendor, ProjectPurchaseOrder, ProjectStockItem,
ProjectStockMovement, ProjectPurchaseOrderItem, ProjectProformaInvoice,
ProjectProformaInvoiceItem, ProjectFinalInvoice, ProjectFinalInvoiceItem, ProjectPartyLedger, ProjectContractorAssignment,
ProjectContractorProof, ProjectCleaningAssignment, ProjectContractor, ProjectContractorComment, ProjectContractorRescheduleRequest, ProjectLoanCoApplicant, ProjectAccountExpense, ProjectConsumption, ProjectCustomerUpdate, ProjectDealerOrder,
ProjectDealerOrderItem,
ProjectDealerPayment,
ProjectDealerComment, ProjectDealerNotification,
ProjectDealerMonthlyRequirement, ProjectTradingMeeting, FollowUp,]),
    CalculatorModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
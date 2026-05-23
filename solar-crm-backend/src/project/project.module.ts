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

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectDocument, ProjectComment, ProjectMaterialMaster, ProjectMaterialRequest,
ProjectMaterialRequestItem, ProjectBranch, ProjectLoanDetail, ProjectSubsidyDetail, ProjectElectricityDetail, ProjectExecutionActivity, ProjectExecutionProof, ProjectExecutionReminder, ProjectExecutionReminderUserState, ProjectPaymentInstallment, ProjectPaymentReminderUserState, ProjectReminderUserState, ProjectEditHistory,
 ProjectVendor, ProjectPurchaseOrder, ProjectPurchaseOrderItem, ProjectProformaInvoice,
ProjectProformaInvoiceItem,]),
    CalculatorModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
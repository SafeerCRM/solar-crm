import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerPortalController } from './customer-portal.controller';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerComplaint } from './customer-complaint.entity';
import { CustomerReferral } from './customer-referral.entity';
import { CustomerPaymentReceipt } from './customer-payment-receipt.entity';
import { CustomerWorkDateRequest } from './customer-work-date-request.entity';
import { CustomerNotification } from './customer-notification.entity';
import { CustomerCleaningReminder } from './customer-cleaning-reminder.entity';
import { Customer } from '../customer/customer.entity';
import { Project } from '../project/project.entity';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerComplaintAttachment } from './customer-complaint-attachment.entity';
import { ProjectExecutionActivity } from '../project/project-execution-activity.entity';
import { ProjectPaymentInstallment } from '../project/project-payment-installment.entity';
import { ProjectDocument } from '../project/project-document.entity';
import { StaffMember } from '../staff/staff-member.entity';
import { CustomerComplaintActivity } from './customer-complaint-activity.entity';
import { DealerCompanyBankDetail } from '../dealer/dealer-company-bank-detail.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerComplaint,
CustomerComplaintAttachment,
      CustomerReferral,
      CustomerPaymentReceipt,
      CustomerWorkDateRequest,
      CustomerNotification,
      CustomerCleaningReminder,
      Customer,
      Project,
      ProjectExecutionActivity,
      ProjectPaymentInstallment,
      ProjectDocument,
      StaffMember,
      CustomerComplaintActivity,
      DealerCompanyBankDetail,
    ]),
  ],
  controllers: [CustomerPortalController, CustomerAuthController],
  providers: [CustomerPortalService],
  exports: [CustomerPortalService],
})
export class CustomerPortalModule {}
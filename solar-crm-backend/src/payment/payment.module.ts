import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IciciPaymentTransaction } from './icici-payment-transaction.entity';
import { IciciPaymentService } from './icici-payment.service';
import { IciciPaymentController } from './icici-payment.controller';
import { ProjectDealerOrder } from '../project/project-dealer-order.entity';
import { ProjectDealerPayment } from '../project/project-dealer-payment.entity';
import { ProjectDealerNotification } from '../project/project-dealer-notification.entity';
import {
  ProjectInsuranceRequest,
} from '../project/project-insurance-request.entity';
import { Dealer } from '../dealer/dealer.entity';
import {
  CustomerAfterSalesRequest,
} from '../customer-portal/customer-after-sales-request.entity';
import { ProjectModule } from '../project/project.module';
import { IciciPaymentLaunchService } from './icici-payment-launch.service';
import { IciciPaymentLaunch } from './icici-payment-launch.entity';
import { CustomerAfterSalesCheckout } from '../customer-portal/customer-after-sales-checkout.entity';
import {
  CustomerAfterSalesRequestActivity,
} from '../customer-portal/customer-after-sales-request-activity.entity';

import {
  CustomerAfterSalesRequestProof,
} from '../customer-portal/customer-after-sales-request-proof.entity';

import {
  CustomerAfterSalesCheckoutFinalizerService,
} from '../customer-portal/customer-after-sales-checkout-finalizer.service';

import {
  CustomerCleaningCheckoutFinalizerService,
} from '../customer-portal/customer-cleaning-checkout-finalizer.service';

import {
  CustomerCleaningCheckout,
} from '../customer-portal/customer-cleaning-checkout.entity';

import {
  CustomerCleaningReminder,
} from '../customer-portal/customer-cleaning-reminder.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
  IciciPaymentTransaction,
  ProjectInsuranceRequest,
  ProjectDealerOrder,
  ProjectDealerPayment,
  ProjectDealerNotification,
   Dealer,
CustomerAfterSalesRequest,
CustomerAfterSalesCheckout,
CustomerAfterSalesRequestActivity,
CustomerAfterSalesRequestProof,
CustomerCleaningCheckout,
CustomerCleaningReminder,
IciciPaymentLaunch,
]),
ProjectModule,
  ],
  providers: [
  CustomerAfterSalesCheckoutFinalizerService,
  CustomerCleaningCheckoutFinalizerService,
  IciciPaymentService,
  IciciPaymentLaunchService,
],
  controllers: [
  IciciPaymentController,
],
  exports: [
  IciciPaymentService,
  IciciPaymentLaunchService,
],
})
export class PaymentModule {}
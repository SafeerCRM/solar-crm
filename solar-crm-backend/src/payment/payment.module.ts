import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IciciPaymentTransaction } from './icici-payment-transaction.entity';
import { IciciPaymentService } from './icici-payment.service';
import { IciciPaymentController } from './icici-payment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IciciPaymentTransaction,
    ]),
  ],
  providers: [
    IciciPaymentService,
  ],
  controllers: [
  IciciPaymentController,
],
  exports: [
    IciciPaymentService,
  ],
})
export class PaymentModule {}
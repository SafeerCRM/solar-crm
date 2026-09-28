import {
  BadGatewayException,
  Injectable,
} from '@nestjs/common';

import {
  InjectDataSource,
} from '@nestjs/typeorm';

import {
  DataSource,
} from 'typeorm';

import {
  CustomerCleaningCheckout,
  CustomerCleaningCheckoutStatus,
} from './customer-cleaning-checkout.entity';

import {
  CustomerCleaningReminder,
  CleaningReminderStatus,
} from './customer-cleaning-reminder.entity';

type FinalizePaidCleaningCheckoutInput = {
  checkoutId: number;
  customerId: number;
  amount: number;
  merchantTxnNo: string;
  paymentId?: string | null;
  bankTxnId?: string | null;
  paidAt?: Date | null;
};

@Injectable()
export class CustomerCleaningCheckoutFinalizerService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async finalizePaidCheckout(
    input: FinalizePaidCleaningCheckoutInput,
  ) {
    const checkoutId =
      Number(input.checkoutId);

    const customerId =
      Number(input.customerId);

    const transactionAmount =
      Number(input.amount);

    const merchantTxnNo =
      String(
        input.merchantTxnNo || '',
      ).trim();

    if (
      !Number.isInteger(checkoutId) ||
      checkoutId <= 0 ||
      !Number.isInteger(customerId) ||
      customerId <= 0 ||
      !Number.isFinite(transactionAmount) ||
      transactionAmount <= 0 ||
      !merchantTxnNo
    ) {
      throw new BadGatewayException(
        'Customer cleaning checkout payment reference is invalid',
      );
    }

    return this.dataSource.transaction(
      async (manager) => {
        /*
         * Lock the checkout so callback + Status
         * reconciliation cannot create two real
         * cleaning reminders from one payment.
         */
        const checkout =
          await manager
            .getRepository(
              CustomerCleaningCheckout,
            )
            .createQueryBuilder(
              'checkout',
            )
            .setLock(
              'pessimistic_write',
            )
            .where(
              'checkout.id = :checkoutId',
              {
                checkoutId,
              },
            )
            .andWhere(
              'checkout.customerId = :customerId',
              {
                customerId,
              },
            )
            .getOne();

        if (!checkout) {
          throw new BadGatewayException(
            'Customer cleaning checkout not found for payment',
          );
        }

        /*
         * Exact same ICICI transaction may safely
         * arrive again through callback or Status
         * reconciliation.
         */
        if (
          checkout.status ===
            CustomerCleaningCheckoutStatus.COMPLETED &&
          checkout.createdReminderId
        ) {
          if (
            String(
              checkout.gatewayOrderId || '',
            ).trim() ===
            merchantTxnNo
          ) {
            return {
              reminderId:
                Number(
                  checkout.createdReminderId,
                ),
              alreadyCompleted: true,
            };
          }

          throw new BadGatewayException(
            'Customer cleaning checkout was completed by a different payment transaction',
          );
        }

        if (
          checkout.status ===
            CustomerCleaningCheckoutStatus.CANCELLED
        ) {
          throw new BadGatewayException(
            'Customer cleaning checkout has been cancelled',
          );
        }

        const payableAmount =
          Number(
            checkout.serviceCharge,
          );

        if (
          !Number.isFinite(payableAmount) ||
          payableAmount <= 0 ||
          Math.abs(
            transactionAmount -
              payableAmount,
          ) > 0.009
        ) {
          throw new BadGatewayException(
            'Customer cleaning checkout payment amount mismatch',
          );
        }

        /*
         * Only now, after verified ICICI SUCCESS,
         * create the staff-visible cleaning reminder.
         */
        const reminder =
          new CustomerCleaningReminder();

        reminder.customerId =
          Number(checkout.customerId);

        reminder.customerCode =
          checkout.customerCode || '';

        reminder.projectId =
          Number(checkout.projectId);

        reminder.projectName =
          checkout.projectName || '';

        reminder.cleaningDate =
          checkout.cleaningDate;

        reminder.nextCleaningDate =
          null as any;

        reminder.status =
          CleaningReminderStatus.PENDING;

        reminder.remarks =
          checkout.remarks || '';

        const savedReminder =
          await manager
            .getRepository(
              CustomerCleaningReminder,
            )
            .save(
              reminder,
            );

        /*
         * Persist the exact ICICI transaction
         * identity on the checkout. This makes
         * repeated settlement idempotent.
         */
        checkout.status =
          CustomerCleaningCheckoutStatus.COMPLETED;

        checkout.createdReminderId =
          Number(savedReminder.id);

        checkout.gatewayOrderId =
          merchantTxnNo;

        checkout.paidAt =
          input.paidAt ||
          new Date();

        checkout.completedAt =
          new Date();

        await manager
          .getRepository(
            CustomerCleaningCheckout,
          )
          .save(
            checkout,
          );

        return {
          reminderId:
            Number(savedReminder.id),
          alreadyCompleted: false,
        };
      },
    );
  }
}
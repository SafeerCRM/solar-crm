import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';

import {
  CustomerPortalService,
} from './customer-portal.service';

import {
  IciciPaymentLaunchService,
} from '../payment/icici-payment-launch.service';

import {
  IciciPaymentLaunchPurpose,
} from '../payment/icici-payment-launch.entity';

@Controller('payment/icici')

export class CustomerPaymentLaunchController {
  constructor(
    private readonly customerPortalService:
      CustomerPortalService,

    private readonly paymentLaunchService:
      IciciPaymentLaunchService,
  ) {}

  @Post('customer-launch')
  @HttpCode(200)
  async launchCustomerPayment(
    @Body()
    body: Record<string, any>,
  ) {
    const token =
      String(
        body?.token || '',
      ).trim();

    if (!token) {
      throw new BadRequestException(
        'Payment launch token is required',
      );
    }

    /*
     * Verify and atomically consume the
     * short-lived Customer Portal launch.
     *
     * The public browser supplies only the
     * signed token.
     */
    const launch =
      await this.paymentLaunchService
        .consumeCustomerLaunchToken(
          token,
        );

    if (
  launch.purpose !==
    IciciPaymentLaunchPurpose
      .CUSTOMER_PAYMENT &&
  launch.purpose !==
    IciciPaymentLaunchPurpose
      .CUSTOMER_INSURANCE
) {
  throw new BadRequestException(
    'Unsupported payment launch purpose',
  );
}

    const returnUrl =
      String(
        process.env
          .ICICI_PAYMENT_RETURN_URL ||
          '',
      ).trim();

    if (
      !returnUrl ||
      !/^https:\/\//i.test(
        returnUrl,
      )
    ) {
      throw new BadRequestException(
        'ICICI payment return URL is not configured',
      );
    }

    /*
     * CustomerPortalService performs the
     * business authorization again.
     *
     * customerId and project reference come
     * from the signed token, never the public
     * request body.
     *
     * Amount is recalculated server-side.
     */
    let payment;

if (
  launch.purpose ===
    IciciPaymentLaunchPurpose
      .CUSTOMER_PAYMENT
) {
  payment =
    await this.customerPortalService
      .initiateCustomerInstallmentPayment(
        Number(launch.customerId),
        Number(launch.referenceId),
        returnUrl,
        launch.paymentSource,
      );
} else if (
  launch.purpose ===
    IciciPaymentLaunchPurpose
      .CUSTOMER_INSURANCE
) {
  payment =
    await this.customerPortalService
      .initiateCustomerInsurancePayment(
        Number(launch.customerId),
        Number(launch.referenceId),
        returnUrl,
        launch.paymentSource,
      );
} else {
  throw new BadRequestException(
    'Unsupported payment launch purpose',
  );
}

    const paymentUrl =
      String(
        payment?.paymentUrl ||
        '',
      ).trim();

    if (
      !paymentUrl ||
      !/^https:\/\//i.test(
        paymentUrl,
      )
    ) {
      throw new BadRequestException(
        'Payment gateway did not return a valid payment page',
      );
    }

    return {
      success: true,
      paymentUrl,

      transactionId:
        payment?.transactionId,

      merchantTxnNo:
        payment?.merchantTxnNo,

      amount:
        payment?.amount,

      status:
        payment?.status,
    };
  }
}
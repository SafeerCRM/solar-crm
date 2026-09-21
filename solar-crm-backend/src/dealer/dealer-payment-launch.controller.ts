import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';

import {
  DealerService,
} from './dealer.service';

import {
  IciciPaymentLaunchService,
} from '../payment/icici-payment-launch.service';

import {
  IciciPaymentLaunchPurpose,
} from '../payment/icici-payment-launch.entity';

@Controller('payment/icici')
export class DealerPaymentLaunchController {
  constructor(
    private readonly dealerService:
      DealerService,

    private readonly paymentLaunchService:
      IciciPaymentLaunchService,
  ) {}

  @Post('launch')
  @HttpCode(200)
  async launchPayment(
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
     * Atomically verifies and consumes the
     * short-lived launch authorization.
     *
     * The browser supplies ONLY the token.
     * purpose/reference/dealer identity all
     * come from the signed token + DB row.
     */
    const launch =
      await this.paymentLaunchService
        .consumeDealerLaunchToken(
          token,
        );

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
     * Business authorization is performed
     * again by DealerService.
     *
     * Never accept amount, dealerId,
     * referenceId or purpose separately
     * from this public request.
     */
    if (
  launch.purpose ===
  IciciPaymentLaunchPurpose
    .DEALER_ORDER
) {
  const payment =
    await this.dealerService
  .initiateDealerOrderIciciPayment(
    Number(
      launch.dealerId,
    ),

    Number(
      launch.referenceId,
    ),

    returnUrl,

    launch.paymentSource,
  );

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

    if (
  launch.purpose ===
  IciciPaymentLaunchPurpose
    .DEALER_INSURANCE
) {
  const result =
    await this.dealerService
  .initiateDealerInsurancePayment(
    Number(
      launch.dealerId,
    ),

    Number(
      launch.referenceId,
    ),

    returnUrl,

    launch.paymentSource,
  );

  const payment =
    result?.payment ||
    result;

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

    throw new BadRequestException(
      'Unsupported payment launch purpose',
    );
  }
}
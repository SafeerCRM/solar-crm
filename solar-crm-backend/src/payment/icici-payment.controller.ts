import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Res,
} from '@nestjs/common';

import type {
  Response,
} from 'express';

import { IciciPaymentService } from './icici-payment.service';

@Controller('payment/icici')
export class IciciPaymentController {
  constructor(
  private readonly iciciPaymentService: IciciPaymentService,


) {}

  @Post('return')
@HttpCode(200)
async handlePaymentReturn(
  @Body()
  body: Record<string, any>,

  @Res()
  res: Response,
) {
  const result =
    await this.iciciPaymentService
      .handlePaymentReturn(
        body,
      );

  /*
   * The payment service has already:
   *
   * 1. verified ICICI secureHash
   * 2. matched merchant + transaction
   * 3. called ICICI Status API
   * 4. dispatched successful business
   *    settlement when applicable
   *
   * Browser UX starts only after that.
   */
  const transactionId =
    Number(
      result?.transactionId ||
        0,
    );

  if (
    !Number.isInteger(
      transactionId,
    ) ||
    transactionId <= 0
  ) {
    return res.status(
      500,
    ).send(
      'Unable to determine payment transaction',
    );
  }

  const resultBaseUrl =
    String(
      process.env
        .ICICI_PAYMENT_RESULT_BASE_URL ||
        '',
    )
      .trim()
      .replace(
        /\/+$/,
        '',
      );

  if (
    resultBaseUrl !==
    'https://adityasolars.co.in'
  ) {
    return res.status(
      500,
    ).send(
      'Payment result website is not configured',
    );
  }

  /*
   * Do not send payment success/failure
   * from ICICI's browser POST to the
   * website.
   *
   * The website receives only our
   * internal transaction reference.
   */
  const resultUrl =
  `${resultBaseUrl}/payment/return/aditya-trading` +
  `#transaction=${encodeURIComponent(
    String(
      transactionId,
    ),
  )}`;

  return res.redirect(
    303,
    resultUrl,
  );
}

@Get('result/:transactionId')
async getPaymentResult(
  @Param('transactionId')
  transactionId: string,
) {
  return this.iciciPaymentService
    .getPublicPaymentResult(
      Number(
        transactionId,
      ),
    );
}

  
}
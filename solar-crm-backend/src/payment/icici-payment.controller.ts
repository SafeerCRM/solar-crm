import {
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';

import { IciciPaymentService } from './icici-payment.service';

@Controller('payment/icici')
export class IciciPaymentController {
  constructor(
  private readonly iciciPaymentService: IciciPaymentService,


) {}

  @Post('return')
  @HttpCode(200)
  async handlePaymentReturn(
    @Body() body: Record<string, any>,
  ) {
    return this.iciciPaymentService.handlePaymentReturn(
      body,
    );
  }

  
}
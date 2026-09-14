import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Controller('webhooks/whatsapp')
export class WhatsappController {
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expectedToken =
      process.env.WHATSAPP_VERIFY_TOKEN;

    if (
      mode === 'subscribe' &&
      verifyToken === expectedToken
    ) {
      return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
  }

  @Post()
  @HttpCode(200)
  receiveWebhook(@Req() req: Request) {
    console.log(
      'WhatsApp webhook received:',
      JSON.stringify(req.body, null, 2),
    );

    return {
      received: true,
    };
  }
}
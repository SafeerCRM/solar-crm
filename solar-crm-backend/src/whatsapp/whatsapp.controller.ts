import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
    HttpCode,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';

import { createHmac, timingSafeEqual } from 'crypto';

import { WhatsappService } from './whatsapp.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('webhooks/whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
  ) {}

  @Get('customer-feedback')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    'OWNER',
    'PROJECT_MANAGER',
    'PROJECT_EXECUTIVE',
    'CUSTOMER_MANAGER',
  )
  async getCustomerFeedback(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('rating') rating?: string,
    @Query('activityType') activityType?: string,
  ) {
    return this.whatsappService.getCustomerExecutionRatings({
      page,
      limit,
      rating,
      activityType,
    });
  }

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
  async receiveWebhook(
    @Req() req: RawBodyRequest<Request>,
  ) {
    const appSecret =
      process.env.META_APP_SECRET;

    const signature =
      req.headers['x-hub-signature-256'];

    if (!appSecret) {
      throw new Error(
        'META_APP_SECRET is not configured',
      );
    }

    if (
      typeof signature !== 'string' ||
      !signature.startsWith('sha256=')
    ) {
      throw new UnauthorizedException(
        'Missing or invalid webhook signature',
      );
    }

    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new UnauthorizedException(
        'Webhook raw body is unavailable',
      );
    }

    const expectedSignature =
      'sha256=' +
      createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex');

    const receivedBuffer =
      Buffer.from(signature);

    const expectedBuffer =
      Buffer.from(expectedSignature);

    if (
      receivedBuffer.length !==
        expectedBuffer.length ||
      !timingSafeEqual(
        receivedBuffer,
        expectedBuffer,
      )
    ) {
      throw new UnauthorizedException(
        'Invalid webhook signature',
      );
    }

    const body = req.body;

    const entries = Array.isArray(body?.entry)
      ? body.entry
      : [];

    for (const entry of entries) {
      const changes = Array.isArray(
        entry?.changes,
      )
        ? entry.changes
        : [];

      for (const change of changes) {
        if (change?.field !== 'messages') {
          continue;
        }

        const value = change?.value;

        /*
         * Incoming customer/dealer messages
         */
        const messages = Array.isArray(
          value?.messages,
        )
          ? value.messages
          : [];

        for (const message of messages) {
          const messageType =
            message?.type || 'unknown';

          const messageBody =
  messageType === 'text'
    ? message?.text?.body || ''
    : messageType === 'button'
      ? message?.button?.text ||
        message?.button?.payload ||
        ''
      : messageType === 'interactive'
        ? message?.interactive?.button_reply?.title ||
          message?.interactive?.button_reply?.id ||
          ''
        : null;

          if (messageType === 'text') {
            console.log(
              'Incoming WhatsApp text:',
              {
                from: message?.from,
                messageId: message?.id,
                timestamp: message?.timestamp,
                text: messageBody,
              },
            );
          } else {
            console.log(
              'Incoming WhatsApp non-text message:',
              {
                from: message?.from,
                messageId: message?.id,
                type: messageType,
              },
            );
          }

          await this.whatsappService.recordIncomingMessage(
            {
              from: message?.from || '',
              messageId: message?.id || '',
              messageType,
              messageBody,
              payload: message,
            },
          );

          try {
  await this.whatsappService.processCustomerProjectConfirmationReply({
    from: message?.from || '',
    messageId: message?.id || '',
    messageBody,
    payload: message,
  });
} catch (error) {
  console.error(
    'Customer project confirmation reply processing failed:',
    error,
  );
}

try {
  await this.whatsappService.processCustomerExecutionRatingReply({
    from: message.from,
    messageId: message.id,
    messageBody,
    payload: message,
  });
} catch (error) {
  console.error(
    'WhatsApp customer execution rating processing failed:',
    error,
  );
}
        }

        /*
         * Status updates for messages sent by CRM:
         * sent / delivered / read / failed
         */
        const statuses = Array.isArray(
          value?.statuses,
        )
          ? value.statuses
          : [];

        for (const status of statuses) {
          console.log(
            'WhatsApp message status:',
            {
              messageId: status?.id,
              status: status?.status,
              timestamp: status?.timestamp,
              recipientId:
                status?.recipient_id,
            },
          );

          await this.whatsappService.updateMessageStatus(
            {
              messageId: status?.id || '',
              status: status?.status || '',
              payload: status,
            },
          );
        }
      }
    }

    return {
      received: true,
    };
  }
}
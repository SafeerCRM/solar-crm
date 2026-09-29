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
} from '@nestjs/common';

import type { RawBodyRequest } from '@nestjs/common';
import type { Request, Response } from 'express';

import { createHmac, timingSafeEqual } from 'crypto';

import { WhatsappService } from './whatsapp.service';

import { WhatsappRecipientType } from './whatsapp-message.entity';

@Controller('webhooks/whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
  ) {}

  @Post('test-send')
  async testSend(
    @Body()
    body: {
      to: string;
      message: string;
    },
  ) {
    return this.whatsappService.sendTextMessage(
      body.to,
      body.message,
    );
  }

  @Post('test-template')
async testTemplate(
  @Body()
  body: {
    to: string;
  },
) {
  return this.whatsappService.sendTemplateMessage(
    body.to,
    'customer_payment_due',
    'en',
    [
      {
        type: 'body',
        parameters: [
          {
            type: 'text',
            text: 'Rahul Sharma',
          },
          {
            type: 'text',
            text: '25000',
          },
          {
            type: 'text',
            text: '30 September 2026',
          },
        ],
      },
    ],
    {
      recipientType: WhatsappRecipientType.CUSTOMER,
      recipientName: 'Rahul Sharma',
      referenceType: 'TEST',
      referenceId: 'payment-template-test',
    },
  );
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
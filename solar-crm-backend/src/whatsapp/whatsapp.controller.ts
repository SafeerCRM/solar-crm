import {
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
receiveWebhook(
  @Req() req: RawBodyRequest<Request>,
) {

    const appSecret = process.env.META_APP_SECRET;
const signature = req.headers['x-hub-signature-256'];

if (!appSecret) {
  throw new Error('META_APP_SECRET is not configured');
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

const receivedBuffer = Buffer.from(signature);
const expectedBuffer = Buffer.from(expectedSignature);

if (
  receivedBuffer.length !== expectedBuffer.length ||
  !timingSafeEqual(receivedBuffer, expectedBuffer)
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
    const changes = Array.isArray(entry?.changes)
      ? entry.changes
      : [];

    for (const change of changes) {
      if (change?.field !== 'messages') {
        continue;
      }

      const value = change?.value;

      const messages = Array.isArray(value?.messages)
        ? value.messages
        : [];

      for (const message of messages) {
        if (message?.type === 'text') {
          console.log(
            'Incoming WhatsApp text:',
            {
              from: message.from,
              messageId: message.id,
              timestamp: message.timestamp,
              text: message.text?.body || '',
            },
          );
        } else {
          console.log(
            'Incoming WhatsApp non-text message:',
            {
              from: message?.from,
              messageId: message?.id,
              type: message?.type,
            },
          );
        }
      }
    }
  }

  return {
    received: true,
  };
}
}
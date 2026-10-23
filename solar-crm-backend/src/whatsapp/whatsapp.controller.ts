import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
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

    @Get('automation-management/rollout-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER')
  checkAutomationRolloutRecipient(
    @Query('to') to?: string,
  ) {
    if (!to || !to.trim()) {
      throw new BadRequestException(
        'Recipient phone number is required',
      );
    }

    return this.whatsappService.checkAutomationRolloutRecipient(
      to.trim(),
    );
  }

    @Post('automation-management/production-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER')
  @HttpCode(200)
  async sendProductionTemplateTest(
  @Body() body: {
    to?: string;
    templateName?: string;
  },
) {
  if (
    !body ||
    typeof body.to !== 'string' ||
    !body.to.trim()
  ) {
    throw new BadRequestException(
      'Recipient WhatsApp number is required',
    );
  }

  if (
    typeof body.templateName !== 'string' ||
    !body.templateName.trim()
  ) {
    throw new BadRequestException(
      'Template name is required',
    );
  }

  return this.whatsappService.sendProductionTemplateTest(
    body.to.trim(),
    body.templateName.trim(),
  );
}

    @Patch('automation-management/setting')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER')
  async updateAutomationManagementSetting(
    @Body() body: {
      automationKey?: string;
      isEnabled?: boolean;
    },
    @Req() req: Request & {
      user?: {
        id?: number;
        userId?: number;
        sub?: number;
      };
    },
  ) {
    const changedBy = Number(
      req.user?.id ??
      req.user?.userId ??
      req.user?.sub,
    );

    if (!Number.isSafeInteger(changedBy) || changedBy <= 0) {
      throw new UnauthorizedException(
        'Unable to identify authenticated user',
      );
    }

    if (
      !body ||
      typeof body.automationKey !== 'string' ||
      typeof body.isEnabled !== 'boolean'
    ) {
      throw new BadRequestException(
        'automationKey and boolean isEnabled are required',
      );
    }

    return this.whatsappService.updateAutomationManagementSetting({
      automationKey: body.automationKey,
      isEnabled: body.isEnabled,
      changedBy,
    });
  }

  @Get('automation-management/audit-history')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER')
async getAutomationManagementAuditHistory(
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('automationKey') automationKey?: string,
) {
  return this.whatsappService.getAutomationManagementAuditHistory({
    page,
    limit,
    automationKey,
  });
}

    @Get('automation-management/messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER')
  async getAutomationManagementMessages(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('direction') direction?: string,
    @Query('status') status?: string,
    @Query('automationKey') automationKey?: string,
    @Query('search') search?: string,
  ) {
    return this.whatsappService.getAutomationManagementMessages({
      page,
      limit,
      direction,
      status,
      automationKey,
      search,
    });
  }

    @Get('automation-management/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'PROJECT_MANAGER', 'CUSTOMER_MANAGER')
  async getAutomationManagementOverview() {
    return this.whatsappService.getAutomationManagementOverview();
  }

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
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  WhatsappMessage,
  WhatsappMessageDirection,
  WhatsappMessageStatus,
  WhatsappMessageType,
  WhatsappRecipientType,
} from './whatsapp-message.entity';

export interface WhatsappSendContext {
  recipientType?: WhatsappRecipientType;
  recipientName?: string;
  automationKey?: string;
  referenceType?: string;
  referenceId?: string | number;
  deduplicationKey?: string;
}

@Injectable()
export class WhatsappService {
  private readonly accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN;

  private readonly phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

    private readonly testAccessToken =
  process.env.WHATSAPP_TEST_ACCESS_TOKEN;

private readonly testPhoneNumberId =
  process.env.WHATSAPP_TEST_PHONE_NUMBER_ID;

  private readonly graphApiVersion =
    process.env.WHATSAPP_GRAPH_API_VERSION || 'v23.0';

  constructor(
    @InjectRepository(WhatsappMessage)
    private readonly messageRepository: Repository<WhatsappMessage>,
  ) {}

  private validateConfig() {
    if (!this.accessToken) {
      throw new Error(
        'WHATSAPP_ACCESS_TOKEN is not configured',
      );
    }

    if (!this.phoneNumberId) {
      throw new Error(
        'WHATSAPP_PHONE_NUMBER_ID is not configured',
      );
    }
  }

  private normalizePhone(phone: string): string {
    return String(phone || '')
      .replace(/\D/g, '')
      .replace(/^0+/, '');
  }

  private getMetaError(data: any) {
    return {
      errorCode:
        data?.error?.code !== undefined
          ? String(data.error.code)
          : null,

      errorMessage:
        data?.error?.message ||
        data?.error?.error_user_msg ||
        null,
    };
  }

  private async callMessagesApi(
    payload: Record<string, unknown>,
  ) {
    this.validateConfig();

    const response = await fetch(
      `https://graph.facebook.com/${this.graphApiVersion}/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }

  private async callTestMessagesApi(
  payload: Record<string, unknown>,
) {
  if (!this.testAccessToken) {
    throw new Error(
      'WHATSAPP_TEST_ACCESS_TOKEN is not configured',
    );
  }

  if (!this.testPhoneNumberId) {
    throw new Error(
      'WHATSAPP_TEST_PHONE_NUMBER_ID is not configured',
    );
  }

  const response = await fetch(
    `https://graph.facebook.com/${this.graphApiVersion}/${this.testPhoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.testAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

  async sendTextMessage(
    to: string,
    message: string,
    context: WhatsappSendContext = {},
  ) {
    const recipientPhone = this.normalizePhone(to);

    if (!recipientPhone) {
      throw new Error(
        'WhatsApp recipient phone is required',
      );
    }

    if (!message?.trim()) {
      throw new Error(
        'WhatsApp message body is required',
      );
    }

    const log = this.messageRepository.create({
      direction: WhatsappMessageDirection.OUTBOUND,
      recipientType: context.recipientType || null,
      recipientPhone,
      recipientName: context.recipientName || null,
      messageType: WhatsappMessageType.TEXT,
      templateName: null,
      templateLanguage: null,
      messageBody: message.trim(),
      templateParameters: null,
      metaMessageId: null,
      status: WhatsappMessageStatus.PENDING,
      automationKey: context.automationKey || null,
      referenceType: context.referenceType || null,
      referenceId:
        context.referenceId !== undefined &&
        context.referenceId !== null
          ? String(context.referenceId)
          : null,
      deduplicationKey:
        context.deduplicationKey || null,
      errorCode: null,
      errorMessage: null,
      metaPayload: null,
      sentAt: null,
      deliveredAt: null,
      readAt: null,
      failedAt: null,
    });

    await this.messageRepository.save(log);

    try {
      const result = await this.callMessagesApi({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: message.trim(),
        },
      });

      if (!result.ok) {
        const metaError =
          this.getMetaError(result.data);

        log.status = WhatsappMessageStatus.FAILED;
        log.errorCode = metaError.errorCode;
        log.errorMessage =
          metaError.errorMessage ||
          `WhatsApp API request failed with status ${result.status}`;
        log.metaPayload = result.data;
        log.failedAt = new Date();

        await this.messageRepository.save(log);

        console.error(
          'WhatsApp send failed:',
          result.data,
        );

        throw new Error(
  log.errorMessage ||
    'WhatsApp API request failed',
);
      }

      log.status = WhatsappMessageStatus.SENT;
      log.metaMessageId =
        result.data?.messages?.[0]?.id || null;
      log.metaPayload = result.data;
      log.sentAt = new Date();

      await this.messageRepository.save(log);

      return result.data;
    } catch (error) {
      if (
        log.status !== WhatsappMessageStatus.FAILED
      ) {
        log.status = WhatsappMessageStatus.FAILED;
        log.errorMessage =
          error instanceof Error
            ? error.message
            : 'Unknown WhatsApp send error';
        log.failedAt = new Date();

        await this.messageRepository.save(log);
      }

      throw error;
    }
  }


  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode = 'en',
    components: Record<string, unknown>[] = [],
    context: WhatsappSendContext = {},
  ) {
    const recipientPhone = this.normalizePhone(to);

    if (!recipientPhone) {
      throw new Error(
        'WhatsApp recipient phone is required',
      );
    }

    if (!templateName?.trim()) {
      throw new Error(
        'WhatsApp template name is required',
      );
    }

    const log = this.messageRepository.create({
      direction: WhatsappMessageDirection.OUTBOUND,
      recipientType: context.recipientType || null,
      recipientPhone,
      recipientName: context.recipientName || null,
      messageType: WhatsappMessageType.TEMPLATE,
      templateName: templateName.trim(),
      templateLanguage: languageCode,
      messageBody: null,
      templateParameters: {
        components,
      },
      metaMessageId: null,
      status: WhatsappMessageStatus.PENDING,
      automationKey: context.automationKey || null,
      referenceType: context.referenceType || null,
      referenceId:
        context.referenceId !== undefined &&
        context.referenceId !== null
          ? String(context.referenceId)
          : null,
      deduplicationKey:
        context.deduplicationKey || null,
      errorCode: null,
      errorMessage: null,
      metaPayload: null,
      sentAt: null,
      deliveredAt: null,
      readAt: null,
      failedAt: null,
    });

    await this.messageRepository.save(log);

    try {
      const template: Record<string, unknown> = {
        name: templateName.trim(),
        language: {
          code: languageCode,
        },
      };

      if (components.length > 0) {
        template.components = components;
      }

      const result = await this.callMessagesApi({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone,
        type: 'template',
        template,
      });

      if (!result.ok) {
        const metaError =
          this.getMetaError(result.data);

        log.status = WhatsappMessageStatus.FAILED;
        log.errorCode = metaError.errorCode;
        log.errorMessage =
          metaError.errorMessage ||
          `WhatsApp API request failed with status ${result.status}`;
        log.metaPayload = result.data;
        log.failedAt = new Date();

        await this.messageRepository.save(log);

        console.error(
          'WhatsApp template send failed:',
          result.data,
        );

        throw new Error(
  log.errorMessage ||
    'WhatsApp template API request failed',
);
      }

      log.status = WhatsappMessageStatus.SENT;
      log.metaMessageId =
        result.data?.messages?.[0]?.id || null;
      log.metaPayload = result.data;
      log.sentAt = new Date();

      await this.messageRepository.save(log);

      return result.data;
    } catch (error) {
      if (
        log.status !== WhatsappMessageStatus.FAILED
      ) {
        log.status = WhatsappMessageStatus.FAILED;
        log.errorMessage =
          error instanceof Error
            ? error.message
            : 'Unknown WhatsApp template send error';
        log.failedAt = new Date();

        await this.messageRepository.save(log);
      }

      throw error;
    }
  }


async sendTestTemplateMessage(to: string) {
  const recipientPhone = this.normalizePhone(to);

  if (!recipientPhone) {
    throw new Error(
      'WhatsApp recipient phone is required',
    );
  }

  const result = await this.callTestMessagesApi({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipientPhone,
    type: 'template',
    template: {
      name: 'jaspers_market_order_confirmation_v1',
      language: {
        code: 'en_US',
      },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: 'John Doe',
            },
            {
              type: 'text',
              text: '123456',
            },
            {
              type: 'text',
              text: 'Oct 5, 2026',
            },
          ],
        },
      ],
    },
  });

  if (!result.ok) {
    console.error(
      'WhatsApp TEST template send failed:',
      result.data,
    );

    throw new Error(
      result.data?.error?.message ||
        `WhatsApp TEST API request failed with status ${result.status}`,
    );
  }

  return result.data;
}

    async recordIncomingMessage(params: {
    from: string;
    messageId: string;
    messageType: string;
    messageBody?: string | null;
    payload?: Record<string, unknown> | null;
  }) {
    const recipientPhone =
      this.normalizePhone(params.from);

    if (!recipientPhone) {
      return;
    }

    if (params.messageId) {
      const existing =
        await this.messageRepository.findOne({
          where: {
            metaMessageId: params.messageId,
          },
        });

      if (existing) {
        return existing;
      }
    }

    const log = this.messageRepository.create({
      direction: WhatsappMessageDirection.INBOUND,
      recipientType: null,
      recipientPhone,
      recipientName: null,
      messageType:
        params.messageType === 'text'
          ? WhatsappMessageType.TEXT
          : WhatsappMessageType.TEXT,
      templateName: null,
      templateLanguage: null,
      messageBody:
        params.messageBody || null,
      templateParameters: null,
      metaMessageId:
        params.messageId || null,
      status: WhatsappMessageStatus.RECEIVED,
      automationKey: null,
      referenceType: null,
      referenceId: null,
      deduplicationKey: null,
      errorCode: null,
      errorMessage: null,
      metaPayload:
        params.payload || null,
      sentAt: null,
      deliveredAt: null,
      readAt: null,
      failedAt: null,
    });

    return this.messageRepository.save(log);
  }

  async updateMessageStatus(params: {
    messageId: string;
    status: string;
    payload?: Record<string, unknown> | null;
  }) {
    if (!params.messageId) {
      return;
    }

    const log =
      await this.messageRepository.findOne({
        where: {
          metaMessageId: params.messageId,
        },
      });

    if (!log) {
      console.warn(
        'WhatsApp status received for unknown message:',
        params.messageId,
      );
      return;
    }

    const status =
      String(params.status || '').toLowerCase();

    if (status === 'sent') {
      log.status = WhatsappMessageStatus.SENT;

      if (!log.sentAt) {
        log.sentAt = new Date();
      }
    }

    if (status === 'delivered') {
      log.status =
        WhatsappMessageStatus.DELIVERED;
      log.deliveredAt = new Date();
    }

    if (status === 'read') {
      log.status = WhatsappMessageStatus.READ;

      if (!log.deliveredAt) {
        log.deliveredAt = new Date();
      }

      log.readAt = new Date();
    }

    if (status === 'failed') {
      log.status = WhatsappMessageStatus.FAILED;
      log.failedAt = new Date();

      const payload: any = params.payload;

      const error =
        payload?.errors?.[0] ||
        payload?.error ||
        null;

      if (error?.code !== undefined) {
        log.errorCode = String(error.code);
      }

      if (error?.message || error?.title) {
        log.errorMessage =
          error.message || error.title;
      }
    }

    if (params.payload) {
      log.metaPayload = params.payload;
    }

    return this.messageRepository.save(log);
  }
}
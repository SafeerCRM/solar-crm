import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import {
  WhatsappMessage,
  WhatsappMessageDirection,
  WhatsappMessageStatus,
  WhatsappMessageType,
  WhatsappRecipientType,
} from './whatsapp-message.entity';

import {
  WhatsappAutomation,
  WhatsappAutomationTriggerType,
} from './whatsapp-automation.entity';

import { WhatsappAutomationAudit } from './whatsapp-automation-audit.entity';

import {
  ProjectCustomerConfirmation,
  ProjectCustomerConfirmationStatus,
} from '../project/project-customer-confirmation.entity';

import {
  ProjectCustomerConfirmationHistory,
  ProjectCustomerConfirmationEventType,
} from '../project/project-customer-confirmation-history.entity';

export interface WhatsappSendContext {
  recipientType?: WhatsappRecipientType;
  recipientName?: string;
  automationKey?: string;
  referenceType?: string;
  referenceId?: string | number;
  deduplicationKey?: string;
}

interface WhatsappAutomationDefinition {
  automationKey: string;
  name: string;
  triggerType: WhatsappAutomationTriggerType;
  recipientType: WhatsappRecipientType;
  templateName: string;
  templateLanguage: string;
  triggerOffsetMinutes?: number | null;
  repeatAfterMinutes?: number | null;
  maxRepeatCount?: number | null;
  description: string;
}

export interface WhatsappAutomationExecution {
  automationKey: string;

  recipientPhone: string;
  recipientName?: string | null;

  referenceType: string;
  referenceId: string | number;

  occurrenceKey?: string;

  components?: Record<string, unknown>[];
}

@Injectable()
export class WhatsappService
  implements OnModuleInit
{

  private readonly defaultAutomations: WhatsappAutomationDefinition[] = [
  {
    automationKey: 'CUSTOMER_PAYMENT_DUE',
    name: 'Customer Payment Due',
    triggerType: WhatsappAutomationTriggerType.UPCOMING,
    recipientType: WhatsappRecipientType.CUSTOMER,
    templateName: 'customer_payment_due',
    templateLanguage: 'en',
    triggerOffsetMinutes: 4320,
    repeatAfterMinutes: null,
    maxRepeatCount: null,
    description:
      'Send a WhatsApp reminder when a customer project payment is due.',
  },
  {
  automationKey: 'CUSTOMER_PROJECT_CONFIRMATION',
  name: 'Customer Project Confirmation',
  triggerType: WhatsappAutomationTriggerType.EVENT,
  recipientType: WhatsappRecipientType.CUSTOMER,
  templateName: 'customer_project_confirmation',
  templateLanguage: 'en',
  triggerOffsetMinutes: null,
  repeatAfterMinutes: null,
  maxRepeatCount: null,
  description:
    'Request customer confirmation of agreed solar project details before physical installation begins.',
},
  {
    automationKey: 'CUSTOMER_PROJECT_UPDATE',
    name: 'Customer Project Update',
    triggerType: WhatsappAutomationTriggerType.EVENT,
    recipientType: WhatsappRecipientType.CUSTOMER,
    templateName: 'customer_project_update',
    templateLanguage: 'en',
    triggerOffsetMinutes: null,
    repeatAfterMinutes: null,
    maxRepeatCount: null,
    description:
      'Notify the customer when an important project stage changes.',
  },
  {
    automationKey: 'CUSTOMER_APPOINTMENT_REMINDER',
    name: 'Customer Appointment Reminder',
    triggerType: WhatsappAutomationTriggerType.UPCOMING,
    recipientType: WhatsappRecipientType.CUSTOMER,
    templateName: 'customer_appointment_reminder',
    templateLanguage: 'en',
    triggerOffsetMinutes: 1440,
    repeatAfterMinutes: null,
    maxRepeatCount: null,
    description:
      'Remind the customer before a scheduled meeting or site visit.',
  },
  {
  automationKey: 'CUSTOMER_PAYMENT_RECEIVED',
  name: 'Customer Payment Received',
  triggerType: WhatsappAutomationTriggerType.EVENT,
  recipientType: WhatsappRecipientType.CUSTOMER,
  templateName: 'customer_payment_received',
  templateLanguage: 'en',
  triggerOffsetMinutes: null,
  repeatAfterMinutes: null,
  maxRepeatCount: null,
  description:
    'Send confirmation to customer when a payment receipt becomes approved.',
},
];

  private readonly accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN;

  private readonly phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

    private readonly testAccessToken =
  process.env.WHATSAPP_TEST_ACCESS_TOKEN;

private readonly testPhoneNumberId =
  process.env.WHATSAPP_TEST_PHONE_NUMBER_ID;

  private readonly sendMode =
  (process.env.WHATSAPP_SEND_MODE || 'PRODUCTION')
    .trim()
    .toUpperCase();

    private readonly automationsEnabled =
  (process.env.WHATSAPP_AUTOMATIONS_ENABLED || 'false')
    .trim()
    .toLowerCase() === 'true';

  private readonly graphApiVersion =
    process.env.WHATSAPP_GRAPH_API_VERSION || 'v23.0';

  constructor(

    private readonly dataSource: DataSource,

  @InjectRepository(WhatsappMessage)
  private readonly messageRepository: Repository<WhatsappMessage>,

  @InjectRepository(WhatsappAutomation)
  private readonly automationRepository: Repository<WhatsappAutomation>,

  @InjectRepository(ProjectCustomerConfirmation)
private readonly projectCustomerConfirmationRepository:
  Repository<ProjectCustomerConfirmation>,

@InjectRepository(ProjectCustomerConfirmationHistory)
private readonly projectCustomerConfirmationHistoryRepository:
  Repository<ProjectCustomerConfirmationHistory>,
) {}

async onModuleInit() {
  await this.ensureDefaultAutomations();
}

async getAutomationManagementMessages(query: {
  page?: string;
  limit?: string;
  direction?: string;
  status?: string;
  automationKey?: string;
  search?: string;
}) {
  const page = Math.max(
    1,
    Math.floor(Number(query.page) || 1),
  );

  const limit = Math.min(
    100,
    Math.max(1, Math.floor(Number(query.limit) || 20)),
  );

  const qb = this.messageRepository
    .createQueryBuilder('message');

  const allowedDirections = ['INBOUND', 'OUTBOUND'];

  if (
    query.direction &&
    allowedDirections.includes(query.direction)
  ) {
    qb.andWhere('message.direction = :direction', {
      direction: query.direction,
    });
  }

  const allowedStatuses = [
    'PENDING',
    'SENT',
    'DELIVERED',
    'READ',
    'FAILED',
    'RECEIVED',
    'SKIPPED',
  ];

  if (
    query.status &&
    allowedStatuses.includes(query.status)
  ) {
    qb.andWhere('message.status = :status', {
      status: query.status,
    });
  }

  if (query.automationKey?.trim()) {
    qb.andWhere('message.automationKey = :automationKey', {
      automationKey: query.automationKey.trim(),
    });
  }

  if (query.search?.trim()) {
    const search = `%${query.search.trim()}%`;

    qb.andWhere(
      `(
        message.recipientPhone ILIKE :search
        OR message.recipientName ILIKE :search
        OR message.referenceId ILIKE :search
        OR message.metaMessageId ILIKE :search
      )`,
      { search },
    );
  }

  const [messages, total] = await qb
    .orderBy('message.createdAt', 'DESC')
    .addOrderBy('message.id', 'DESC')
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return {
    data: messages.map((message) => ({
      id: message.id,
      direction: message.direction,
      recipientType: message.recipientType,
      recipientPhone: message.recipientPhone,
      recipientName: message.recipientName,
      messageType: message.messageType,
      templateName: message.templateName,
      messageBody: message.messageBody,
      status: message.status,
      automationKey: message.automationKey,
      referenceType: message.referenceType,
      referenceId: message.referenceId,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      createdAt: message.createdAt,
      sentAt: message.sentAt,
      deliveredAt: message.deliveredAt,
      readAt: message.readAt,
      failedAt: message.failedAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

async getAutomationManagementAuditHistory(query: {
  page?: string;
  limit?: string;
  automationKey?: string;
}) {
  const page = Math.max(
    1,
    Math.floor(Number(query.page) || 1),
  );

  const limit = Math.min(
    100,
    Math.max(1, Math.floor(Number(query.limit) || 20)),
  );

  const qb = this.dataSource
    .getRepository(WhatsappAutomationAudit)
    .createQueryBuilder('audit');

  if (query.automationKey?.trim()) {
    qb.andWhere('audit.automationKey = :automationKey', {
      automationKey: query.automationKey.trim(),
    });
  }

  const [records, total] = await qb
    .orderBy('audit.createdAt', 'DESC')
    .addOrderBy('audit.id', 'DESC')
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return {
    data: records.map((record) => ({
      id: record.id,
      automationKey: record.automationKey,
      previousEnabled: record.previousEnabled,
      newEnabled: record.newEnabled,
      changedBy: record.changedBy,
      createdAt: record.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

async getAutomationManagementOverview() {
  const automations = await this.automationRepository.find({
    order: {
      name: 'ASC',
    },
  });

  const statusCounts = await this.messageRepository
    .createQueryBuilder('message')
    .select('message.direction', 'direction')
    .addSelect('message.status', 'status')
    .addSelect('COUNT(*)', 'count')
    .groupBy('message.direction')
    .addGroupBy('message.status')
    .getRawMany<{
      direction: string;
      status: string;
      count: string;
    }>();

  const summary = {
    outbound: 0,
    inbound: 0,
    pending: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    received: 0,
    skipped: 0,
  };

  for (const row of statusCounts) {
    const count = Number(row.count) || 0;

    if (row.direction === 'OUTBOUND') {
      summary.outbound += count;
    }

    if (row.direction === 'INBOUND') {
      summary.inbound += count;
    }

    switch (row.status) {
      case 'PENDING':
        summary.pending += count;
        break;
      case 'SENT':
        summary.sent += count;
        break;
      case 'DELIVERED':
        summary.delivered += count;
        break;
      case 'READ':
        summary.read += count;
        break;
      case 'FAILED':
        summary.failed += count;
        break;
      case 'RECEIVED':
        summary.received += count;
        break;
      case 'SKIPPED':
        summary.skipped += count;
        break;
    }
  }

  return {
    configuration: {
      globalAutomationsEnabled: this.automationsEnabled,
      sendMode: this.sendMode,
      productionCredentialsConfigured: Boolean(
        this.accessToken && this.phoneNumberId,
      ),
      testCredentialsConfigured: Boolean(
        this.testAccessToken && this.testPhoneNumberId,
      ),
    },
    summary,
    automations: automations.map((automation) => ({
      id: automation.id,
      automationKey: automation.automationKey,
      name: automation.name,
      description: automation.description,
      triggerType: automation.triggerType,
      recipientType: automation.recipientType,
      isEnabled: automation.isEnabled,
      effectiveEnabled:
        this.automationsEnabled && automation.isEnabled,
      templateName: automation.templateName,
      templateLanguage: automation.templateLanguage,
      triggerOffsetMinutes: automation.triggerOffsetMinutes,
      repeatAfterMinutes: automation.repeatAfterMinutes,
      maxRepeatCount: automation.maxRepeatCount,
      updatedAt: automation.updatedAt,
    })),
  };
}

async updateAutomationManagementSetting(params: {
  automationKey: string;
  isEnabled: boolean;
  changedBy: number;
}) {
  const automationKey = String(params.automationKey || '').trim();

  if (!automationKey) {
    throw new BadRequestException('Automation key is required');
  }

  if (typeof params.isEnabled !== 'boolean') {
    throw new BadRequestException('isEnabled must be a boolean');
  }

  if (
    !Number.isSafeInteger(params.changedBy) ||
    params.changedBy <= 0
  ) {
    throw new BadRequestException('Valid OWNER ID is required');
  }

  return this.dataSource.transaction(async (manager) => {
    const automationRepository =
      manager.getRepository(WhatsappAutomation);

    const auditRepository =
      manager.getRepository(WhatsappAutomationAudit);

    // Lock this automation row to prevent concurrent updates
    // from producing incorrect audit history.
    const automation = await automationRepository
      .createQueryBuilder('automation')
      .setLock('pessimistic_write')
      .where('automation.automationKey = :automationKey', {
        automationKey,
      })
      .getOne();

    if (!automation) {
      throw new NotFoundException(
        'WhatsApp automation not found',
      );
    }

    // No actual status change: no audit entry required.
    if (automation.isEnabled === params.isEnabled) {
      return {
        automationKey: automation.automationKey,
        isEnabled: automation.isEnabled,
        effectiveEnabled:
          this.automationsEnabled && automation.isEnabled,
        globalAutomationsEnabled: this.automationsEnabled,
        updatedAt: automation.updatedAt,
        changed: false,
      };
    }

    const previousEnabled = automation.isEnabled;
    const changedAt = new Date();

    automation.isEnabled = params.isEnabled;

    // Preserve the existing latest-change metadata.
    automation.configuration = {
      ...(automation.configuration || {}),
      lastManagementChange: {
        previousEnabled,
        newEnabled: params.isEnabled,
        changedBy: params.changedBy,
        changedAt: changedAt.toISOString(),
      },
    };

    const saved = await automationRepository.save(automation);

    // Permanent audit record, in the same transaction.
    await auditRepository.save(
      auditRepository.create({
        automationKey: saved.automationKey,
        previousEnabled,
        newEnabled: saved.isEnabled,
        changedBy: params.changedBy,
        createdAt: changedAt,
      }),
    );

    return {
      automationKey: saved.automationKey,
      isEnabled: saved.isEnabled,
      effectiveEnabled:
        this.automationsEnabled && saved.isEnabled,
      globalAutomationsEnabled: this.automationsEnabled,
      updatedAt: saved.updatedAt,
      changed: true,
    };
  });
}

async getAutomation(
  automationKey: string,
): Promise<WhatsappAutomation | null> {
  if (!automationKey?.trim()) {
    return null;
  }

  return this.automationRepository.findOne({
    where: {
      automationKey: automationKey.trim(),
    },
  });
}

async isAutomationEnabled(
  automationKey: string,
): Promise<boolean> {
  const automation =
    await this.getAutomation(automationKey);

  return Boolean(
    automation &&
      automation.isEnabled,
  );
}

async ensureDefaultAutomations() {
  for (const definition of this.defaultAutomations) {
    const existing =
      await this.automationRepository.findOne({
        where: {
          automationKey: definition.automationKey,
        },
      });

    if (existing) {
      continue;
    }

    const automation =
      this.automationRepository.create({
        automationKey: definition.automationKey,
        name: definition.name,
        triggerType: definition.triggerType,
        recipientType: definition.recipientType,
        isEnabled: false,
        templateName: definition.templateName,
        templateLanguage:
          definition.templateLanguage,
        triggerOffsetMinutes:
          definition.triggerOffsetMinutes ?? null,
        repeatAfterMinutes:
          definition.repeatAfterMinutes ?? null,
        maxRepeatCount:
          definition.maxRepeatCount ?? null,
        configuration: null,
        description: definition.description,
      });

    await this.automationRepository.save(
      automation,
    );
  }
}

async executeAutomation(
  input: WhatsappAutomationExecution,
) {

  if (!this.automationsEnabled) {
  return {
    sent: false,
    reason: 'AUTOMATIONS_DISABLED',
  };
}

  const automation =
    await this.getAutomation(input.automationKey);

  if (!automation) {
    return {
      sent: false,
      reason: 'AUTOMATION_NOT_FOUND',
    };
  }

  if (!automation.isEnabled) {
    return {
      sent: false,
      reason: 'AUTOMATION_DISABLED',
    };
  }

  const recipientPhone =
    this.normalizePhone(input.recipientPhone);

  if (!recipientPhone) {
    return {
      sent: false,
      reason: 'RECIPIENT_PHONE_MISSING',
    };
  }

  const deduplicationKey = [
    automation.automationKey,
    input.referenceType,
    String(input.referenceId),
    input.occurrenceKey || 'default',
  ].join(':');

  const existing =
    await this.messageRepository.findOne({
      where: {
        deduplicationKey,
      },
    });

  if (existing) {
    return {
      sent: false,
      reason: 'ALREADY_PROCESSED',
      messageId: existing.id,
      status: existing.status,
    };
  }

  if (!automation.templateName) {
    return {
      sent: false,
      reason: 'TEMPLATE_NOT_CONFIGURED',
    };
  }

  let templateName =
    automation.templateName;

  let templateLanguage =
    automation.templateLanguage || 'en';

  let components =
    input.components || [];

  /*
   * Meta test WABA does not contain the production
   * Aditya Solars templates.
   *
   * While WHATSAPP_SEND_MODE=TEST, use Meta's
   * approved test template but preserve the real
   * automationKey/reference/deduplication metadata
   * in whatsapp_message.
   */
  if (this.sendMode === 'TEST') {
    templateName =
      'jaspers_market_order_confirmation_v1';

    templateLanguage = 'en_US';

    components = [
      {
        type: 'body',
        parameters: [
          {
            type: 'text',
            text:
              input.recipientName ||
              'Aditya Solars Customer',
          },
          {
            type: 'text',
            text: String(input.referenceId),
          },
          {
            type: 'text',
            text: new Date().toLocaleDateString(
              'en-US',
              {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                timeZone: 'Asia/Kolkata',
              },
            ),
          },
        ],
      },
    ];
  }

  const result =
    await this.sendTemplateMessage(
      recipientPhone,
      templateName,
      templateLanguage,
      components,
      {
        recipientType:
          automation.recipientType as WhatsappRecipientType,
        recipientName:
          input.recipientName || undefined,
        automationKey:
          automation.automationKey,
        referenceType:
          input.referenceType,
        referenceId:
          input.referenceId,
        deduplicationKey,
      },
    );

  return {
    sent: true,
    automationKey:
      automation.automationKey,
    deduplicationKey,
    result,
  };
}

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
  let digits = String(phone || '')
    .replace(/\D/g, '')
    .replace(/^0+/, '');

  if (!digits) {
    return '';
  }

  /*
   * CRM primarily stores Indian mobile numbers
   * in their normal 10-digit domestic format.
   *
   * Meta WhatsApp expects the recipient in
   * international format without the "+" sign.
   */
  if (/^[6-9]\d{9}$/.test(digits)) {
    digits = `91${digits}`;
  }

  /*
   * Also tolerate numbers entered as:
   * 091XXXXXXXXXX
   * after the leading zero has been removed.
   */
  if (/^91[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  return digits;
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

private async callConfiguredMessagesApi(
  payload: Record<string, unknown>,
) {
  if (this.sendMode === 'TEST') {
    return this.callTestMessagesApi(payload);
  }

  return this.callMessagesApi(payload);
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

    try {
  await this.messageRepository.save(log);
} catch (error: any) {
  if (
    error?.code === '23505' &&
    context.deduplicationKey
  ) {
    throw new Error(
      `WHATSAPP_DUPLICATE_AUTOMATION:${context.deduplicationKey}`,
    );
  }

  throw error;
}

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

      const result = await this.callConfiguredMessagesApi({
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

  async sendProductionTemplateTest(
  to: string,
) {
  // This method is intentionally independent of
  // WHATSAPP_SEND_MODE and automation switches.
  const recipientPhone = this.normalizePhone(to);

  if (!/^91[6-9]\d{9}$/.test(recipientPhone)) {
    throw new BadRequestException(
      'A valid Indian WhatsApp number is required',
    );
  }

  // Prevent accidental use after controlled testing.
  if (
    process.env.WHATSAPP_PRODUCTION_TEST_ENABLED !== 'true'
  ) {
    throw new BadRequestException(
      'Production WhatsApp testing is disabled',
    );
  }

  const allowedPhone = (
  process.env.WHATSAPP_PRODUCTION_TEST_PHONE || ''
).replace(/\D/g, '');

if (
  !allowedPhone ||
  recipientPhone !== allowedPhone
) {
  throw new BadRequestException(
    'Recipient is not the authorized production test number',
  );
}

return this.sendProductionTemplateTestRequest(
  recipientPhone,
);
}

private async sendProductionTemplateTestRequest(
  recipientPhone: string,
) {
  const components = [
    {
      type: 'body',
      parameters: [
        {
          type: 'text',
          text: 'Test Customer',
        },
        {
          type: 'text',
          text: 'This is a controlled CRM WhatsApp production test. No project details have changed.',
        },
        {
          type: 'text',
          text: new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }).format(new Date()),
        },
      ],
    },
  ];

  const log = this.messageRepository.create({
    direction: WhatsappMessageDirection.OUTBOUND,
    recipientType: WhatsappRecipientType.CUSTOMER,
    recipientPhone,
    recipientName: 'Production Test',
    messageType: WhatsappMessageType.TEMPLATE,
    templateName: 'customer_project_update',
    templateLanguage: 'en',
    messageBody: null,
    templateParameters: { components },
    metaMessageId: null,
    status: WhatsappMessageStatus.PENDING,
    automationKey: null,
    referenceType: 'PRODUCTION_TEST',
    referenceId: null,
    deduplicationKey: null,
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
      type: 'template',
      template: {
        name: 'customer_project_update',
        language: { code: 'en' },
        components,
      },
    });

    if (!result.ok) {
      const metaError = this.getMetaError(result.data);

      log.status = WhatsappMessageStatus.FAILED;
      log.errorCode = metaError.errorCode;
      log.errorMessage =
        metaError.errorMessage ||
        `Meta API failed with status ${result.status}`;
      log.metaPayload = result.data;
      log.failedAt = new Date();

      await this.messageRepository.save(log);

      throw new BadRequestException(log.errorMessage);
    }

    log.status = WhatsappMessageStatus.SENT;
    log.metaMessageId =
      result.data?.messages?.[0]?.id || null;
    log.metaPayload = result.data;
    log.sentAt = new Date();

    await this.messageRepository.save(log);

    return {
      success: true,
      templateName: 'customer_project_update',
      recipientPhone,
      metaMessageId: log.metaMessageId,
      logId: log.id,
    };
  } catch (error) {
    if (log.status !== WhatsappMessageStatus.FAILED) {
      log.status = WhatsappMessageStatus.FAILED;
      log.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown production test error';
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

  async getCustomerExecutionRatings(query: {
  page?: string;
  limit?: string;
  rating?: string;
  activityType?: string;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

  const qb = this.messageRepository
    .createQueryBuilder('message')
    .where('message.direction = :direction', {
      direction: WhatsappMessageDirection.INBOUND,
    })
    .andWhere('message.automationKey = :automationKey', {
      automationKey: 'CUSTOMER_EXECUTION_RATING',
    })
    .andWhere('message.referenceType = :referenceType', {
      referenceType: 'EXECUTION_ACTIVITY',
    })
    .andWhere('message.messageBody IN (:...ratings)', {
      ratings: ['1', '2', '3', '4', '5'],
    });

  if (/^[1-5]$/.test(String(query.rating || ''))) {
    qb.andWhere('message.messageBody = :rating', {
      rating: String(query.rating),
    });
  }

  qb.innerJoin(
  'project_execution_activity',
  'activity',
  'activity.id = CAST(message.referenceId AS integer)',
);

qb.andWhere('activity.activityType IN (:...allowedTypes)', {
  allowedTypes: [
    'STRUCTURE_WORK',
    'PANEL_INSTALLED',
    'INVERTER_INSTALLED',
  ],
});

if (
  [
    'STRUCTURE_WORK',
    'PANEL_INSTALLED',
    'INVERTER_INSTALLED',
  ].includes(String(query.activityType || ''))
) {
  qb.andWhere('activity.activityType = :activityType', {
    activityType: query.activityType,
  });
}

  const [messages, total] = await qb
    .orderBy('message.createdAt', 'DESC')
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  const activityIds = [
  ...new Set(
    messages
      .map((message) => Number(message.referenceId))
      .filter((id) => Number.isSafeInteger(id) && id > 0),
  ),
];

const activities = activityIds.length
  ? await this.dataSource.query(
      `
      SELECT id, "projectId", "activityType"
      FROM project_execution_activity
      WHERE id = ANY($1::integer[])
      `,
      [activityIds],
    )
  : [];

const projectIds = [
  ...new Set(
    activities.map((activity: any) => Number(activity.projectId)),
  ),
];

const projects = projectIds.length
  ? await this.dataSource.query(
      `
      SELECT
        id,
        "customerName",
        "customerPhone",
        "electricityKNumber",
        "projectOwnerId",
        "projectOwnerName",
        "projectOwnerRole"
      FROM project
      WHERE id = ANY($1::integer[])
      `,
      [projectIds],
    )
  : [];

const activityMap = new Map<number, any>(
  activities.map((activity: any) => [
    Number(activity.id),
    activity,
  ]),
);

const projectMap = new Map<number, any>(
  projects.map((project: any) => [
    Number(project.id),
    project,
  ]),
);

return {
  data: messages.map((message) => {
    const activityId = Number(message.referenceId);
    const activity = activityMap.get(activityId);
    const project = activity
      ? projectMap.get(Number(activity.projectId))
      : null;

    return {
      id: message.id,
      activityId,
      activityType: activity?.activityType || null,
      projectId: project?.id || null,
      customerName: project?.customerName || '',
      customerPhone: project?.customerPhone || '',
      kNumber: project?.electricityKNumber || '',
      projectOwnerId: project?.projectOwnerId || null,
      projectOwnerName: project?.projectOwnerName || '',
      projectOwnerRole: project?.projectOwnerRole || '',
      rating: Number(message.messageBody),
      submittedAt: message.createdAt,
    };
  }),
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
};
}


async processCustomerExecutionRatingReply(params: {
  from: string;
  messageId: string;
  messageBody: string | null;
  payload: Record<string, any>;
}): Promise<void> {
  const response = String(params.messageBody || '').trim();

  // Accept only a single rating from 1 to 5.
  if (!/^[1-5]$/.test(response)) {
    return;
  }

  const phone = this.normalizePhone(params.from);
  const incomingMessageId = String(params.messageId || '').trim();
  const originalMessageId = String(
    params.payload?.context?.id || '',
  ).trim();

  // A standalone rating must never be assigned automatically.
  if (!phone || !incomingMessageId || !originalMessageId) {
    return;
  }

  const outgoing = await this.messageRepository.findOne({
    where: {
      metaMessageId: originalMessageId,
      direction: WhatsappMessageDirection.OUTBOUND,
      automationKey: 'CUSTOMER_PROJECT_UPDATE',
      referenceType: 'EXECUTION_ACTIVITY',
      recipientPhone: phone,
    },
  });

  if (!outgoing) {
    return;
  }

  if (
    ![
      WhatsappMessageStatus.SENT,
      WhatsappMessageStatus.DELIVERED,
      WhatsappMessageStatus.READ,
    ].includes(outgoing.status)
  ) {
    return;
  }

  const activityId = Number(outgoing.referenceId);

  if (!Number.isSafeInteger(activityId) || activityId <= 0) {
    return;
  }

  // Only the three execution activities with scheduling automation.
  const allowedActivityTypes = [
    'STRUCTURE_WORK',
    'PANEL_INSTALLED',
    'INVERTER_INSTALLED',
  ];

  const occurrenceKey = String(
    outgoing.deduplicationKey || '',
  ).split(':').slice(3).join(':');

  const allowed = allowedActivityTypes.some(
    (type) => occurrenceKey === `execution-${type}-${activityId}`,
  );

  if (!allowed) {
    return;
  }

  await this.messageRepository.manager.transaction(
    async (manager) => {
      // Serialize feedback processing for this activity.
      await manager.query(
        'SELECT pg_advisory_xact_lock($1, $2)',
        [87421, activityId],
      );

      const messages = manager.getRepository(WhatsappMessage);

      const alreadyRated = await messages.findOne({
        where: {
          direction: WhatsappMessageDirection.INBOUND,
          automationKey: 'CUSTOMER_EXECUTION_RATING',
          referenceType: 'EXECUTION_ACTIVITY',
          referenceId: String(activityId),
        },
      });

      if (alreadyRated) {
        return;
      }

      const incoming = await messages.findOne({
        where: {
          metaMessageId: incomingMessageId,
          direction: WhatsappMessageDirection.INBOUND,
          recipientPhone: phone,
        },
      });

      if (!incoming || incoming.automationKey) {
        return;
      }

      incoming.automationKey = 'CUSTOMER_EXECUTION_RATING';
      incoming.referenceType = 'EXECUTION_ACTIVITY';
      incoming.referenceId = String(activityId);

      await messages.save(incoming);

      console.log('Customer execution activity rating recorded:', {
        activityId,
        rating: Number(response),
        messageId: incomingMessageId,
      });
    },
  );
}


  async processCustomerProjectConfirmationReply(params: {
  from: string;
  messageId: string;
  messageBody: string | null;
  payload: Record<string, any>;
}): Promise<void> {
  const response = String(params.messageBody || '')
    .trim()
    .toUpperCase();

  if (response !== 'YES' && response !== 'CORRECTION') {
    return;
  }

  const incomingMessageId = String(params.messageId || '').trim();
  const phone = this.normalizePhone(params.from);

  const originalMessageId = String(
    params.payload?.context?.id || '',
  ).trim();

  // Never accept a generic YES without a reply
  // referencing the original confirmation message.
  if (!phone || !incomingMessageId || !originalMessageId) {
    return;
  }

  // Verify the original message was sent by this CRM
  // specifically for project confirmation.
  const outgoingMessage = await this.messageRepository.findOne({
    where: {
      metaMessageId: originalMessageId,
      direction: WhatsappMessageDirection.OUTBOUND,
      automationKey: 'CUSTOMER_PROJECT_CONFIRMATION',
      recipientPhone: phone,
    },
  });

  if (!outgoingMessage || outgoingMessage.referenceType !== 'PROJECT') {
    return;
  }

  if (
    ![
      WhatsappMessageStatus.SENT,
      WhatsappMessageStatus.DELIVERED,
      WhatsappMessageStatus.READ,
    ].includes(outgoingMessage.status)
  ) {
    return;
  }

  const projectId = Number(outgoingMessage.referenceId);

  if (!Number.isSafeInteger(projectId) || projectId <= 0) {
    return;
  }

  const nextStatus =
    response === 'YES'
      ? ProjectCustomerConfirmationStatus.CONFIRMED
      : ProjectCustomerConfirmationStatus.CORRECTION_REQUESTED;

  const phoneVariants = [
  phone,
  phone.startsWith('91') && phone.length === 12
    ? phone.slice(2)
    : phone,
  `0${phone}`,
];

const processed = await this.projectCustomerConfirmationRepository.manager.transaction(
  async (manager) => {
    const confirmationRepository =
      manager.getRepository(ProjectCustomerConfirmation);

    const historyRepository =
      manager.getRepository(ProjectCustomerConfirmationHistory);

    // Only one response can transition a pending request.
    const result = await confirmationRepository
      .createQueryBuilder()
      .update(ProjectCustomerConfirmation)
      .set({
        status: nextStatus,
        responseMessageId: incomingMessageId,
        responseText: response,
        respondedAt: new Date(),
      })
      .where('"projectId" = :projectId', { projectId })
      .andWhere('"status" = :pending', {
        pending: ProjectCustomerConfirmationStatus.PENDING,
      })
      .andWhere('"requestMessageId" = :originalMessageId', {
        originalMessageId,
      })
      .andWhere('"requestedAt" IS NOT NULL')
      .andWhere(
        `REGEXP_REPLACE("customerPhone", '[^0-9]', '', 'g') IN (:...phoneVariants)`,
        { phoneVariants },
      )
      .execute();

    if (result.affected !== 1) {
      return false;
    }

    const confirmation = await confirmationRepository.findOne({
      where: { projectId },
    });

    if (!confirmation) {
      throw new Error(
        `Confirmation record missing after update for project ${projectId}`,
      );
    }

    const eventType =
      response === 'YES'
        ? ProjectCustomerConfirmationEventType.CUSTOMER_CONFIRMED
        : ProjectCustomerConfirmationEventType.CORRECTION_REQUESTED;

    await historyRepository.save(
      historyRepository.create({
        projectId,
        confirmationId: confirmation.id,
        eventType,
        previousStatus:
          ProjectCustomerConfirmationStatus.PENDING,
        newStatus: nextStatus,
        requestMessageId: originalMessageId,
        responseMessageId: incomingMessageId,
        responseText: response,
        customerPhone: confirmation.customerPhone,
        projectSnapshot: confirmation.projectSnapshot,
        performedBy: null,
        remarks: null,
      }),
    );

    return true;
  },
);

if (processed) {
  console.log('Customer project confirmation response:', {
    projectId,
    status: nextStatus,
    messageId: incomingMessageId,
  });
}
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
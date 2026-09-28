import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum WhatsappRecipientType {
  CUSTOMER = 'CUSTOMER',
  DEALER = 'DEALER',
  STAFF = 'STAFF',
}

export enum WhatsappMessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum WhatsappMessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  RECEIVED = 'RECEIVED',
  SKIPPED = 'SKIPPED',
}

export enum WhatsappMessageType {
  TEXT = 'TEXT',
  TEMPLATE = 'TEMPLATE',
}

@Entity('whatsapp_message')
@Index(['metaMessageId'])
@Index(['recipientPhone', 'createdAt'])
@Index(['automationKey', 'referenceType', 'referenceId'])
export class WhatsappMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  direction: WhatsappMessageDirection;

  @Column({ type: 'text', nullable: true })
  recipientType: WhatsappRecipientType | null;

  @Column({ type: 'text' })
  recipientPhone: string;

  @Column({ type: 'text', nullable: true })
  recipientName: string | null;

  @Column({ type: 'text' })
  messageType: WhatsappMessageType;

  @Column({ type: 'text', nullable: true })
  templateName: string | null;

  @Column({ type: 'text', nullable: true })
  templateLanguage: string | null;

  @Column({ type: 'text', nullable: true })
  messageBody: string | null;

  @Column({ type: 'jsonb', nullable: true })
  templateParameters: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  metaMessageId: string | null;

  @Column({
    type: 'text',
    default: WhatsappMessageStatus.PENDING,
  })
  status: WhatsappMessageStatus;

  @Column({ type: 'text', nullable: true })
  automationKey: string | null;

  @Column({ type: 'text', nullable: true })
  referenceType: string | null;

  @Column({ type: 'text', nullable: true })
  referenceId: string | null;

  @Column({ type: 'text', nullable: true })
  deduplicationKey: string | null;

  @Column({ type: 'text', nullable: true })
  errorCode: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metaPayload: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  failedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
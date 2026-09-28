import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum WhatsappAutomationTriggerType {
  EVENT = 'EVENT',
  UPCOMING = 'UPCOMING',
  OVERDUE = 'OVERDUE',
}

@Entity('whatsapp_automation')
@Index(['automationKey'], { unique: true })
export class WhatsappAutomation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  automationKey: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  triggerType: WhatsappAutomationTriggerType;

  @Column({ type: 'text' })
  recipientType: string;

  @Column({ type: 'boolean', default: true })
  isEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  templateName: string | null;

  @Column({
    type: 'text',
    default: 'en',
  })
  templateLanguage: string;

  @Column({ type: 'integer', nullable: true })
  triggerOffsetMinutes: number | null;

  @Column({ type: 'integer', nullable: true })
  repeatAfterMinutes: number | null;

  @Column({ type: 'integer', nullable: true })
  maxRepeatCount: number | null;

  @Column({ type: 'jsonb', nullable: true })
  configuration: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('whatsapp_automation_audit')
@Index(['automationKey', 'createdAt'])
export class WhatsappAutomationAudit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  automationKey: string;

  @Column({ type: 'boolean' })
  previousEnabled: boolean;

  @Column({ type: 'boolean' })
  newEnabled: boolean;

  @Column({ type: 'integer' })
  changedBy: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
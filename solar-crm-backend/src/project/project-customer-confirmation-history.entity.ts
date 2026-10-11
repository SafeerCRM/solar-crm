import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ProjectCustomerConfirmationEventType {
  REQUEST_SENT = 'REQUEST_SENT',
  CUSTOMER_CONFIRMED = 'CUSTOMER_CONFIRMED',
  CORRECTION_REQUESTED = 'CORRECTION_REQUESTED',
  CORRECTION_RESENT = 'CORRECTION_RESENT',
  OWNER_OVERRIDE = 'OWNER_OVERRIDE',
}

@Entity('project_customer_confirmation_history')
@Index('idx_customer_confirmation_history_project', ['projectId'])
@Index('idx_customer_confirmation_history_confirmation', [
  'confirmationId',
])
export class ProjectCustomerConfirmationHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  projectId: number;

  @Column({ type: 'integer' })
  confirmationId: number;

  @Column({ type: 'varchar', length: 40 })
  eventType: ProjectCustomerConfirmationEventType;

  @Column({ type: 'varchar', length: 30, nullable: true })
  previousStatus: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  newStatus: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  requestMessageId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  responseMessageId: string | null;

  @Column({ type: 'text', nullable: true })
  responseText: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  customerPhone: string | null;

  @Column({ type: 'jsonb', nullable: true })
  projectSnapshot: Record<string, unknown> | null;

  @Column({ type: 'integer', nullable: true })
  performedBy: number | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
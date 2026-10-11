import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ProjectCustomerConfirmationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CORRECTION_REQUESTED = 'CORRECTION_REQUESTED',
}

@Entity('project_customer_confirmation')
@Index('IDX_project_customer_confirmation_project', ['projectId'])
export class ProjectCustomerConfirmation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', unique: true })
  projectId: number;

  @Column({
    type: 'varchar',
    length: 30,
    default: ProjectCustomerConfirmationStatus.PENDING,
  })
  status: ProjectCustomerConfirmationStatus;

  @Column({ type: 'varchar', length: 20, nullable: true })
  customerPhone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  requestMessageId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  requestedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  responseMessageId: string | null;

  @Column({ type: 'text', nullable: true })
  responseText: string | null;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date | null;

  @Column({ type: 'boolean', default: false })
  ownerOverride: boolean;

  @Column({ type: 'integer', nullable: true })
  ownerOverrideBy: number | null;

  @Column({ type: 'text', nullable: true })
  ownerOverrideReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  ownerOverrideAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  projectSnapshot: Record<string, unknown> | null;

  @Column({
  type: 'uuid',
  nullable: true,
})
resendReservationId: string | null;

@Column({
  type: 'timestamp',
  nullable: true,
})
resendReservedAt: Date | null;

@Column({
  type: 'integer',
  default: 0,
})
resendAttemptNumber: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum SolarStoreAuditAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
}

@Entity('solar_store_audit')
@Index(['solarStoreId', 'createdAt'])
export class SolarStoreAudit {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'integer' })
  solarStoreId: number;

  @Column({
    type: 'enum',
    enum: SolarStoreAuditAction,
  })
  action: SolarStoreAuditAction;

  @Column({ type: 'text' })
  fieldName: string;

  @Column({ type: 'text', nullable: true })
  oldValue: string | null;

  @Column({ type: 'text', nullable: true })
  newValue: string | null;

  @Column({ type: 'integer', nullable: true })
  changedBy: number | null;

  @Column({ type: 'text', nullable: true })
  changedByName: string | null;

  @Column({ type: 'text', nullable: true })
  changedByRole: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

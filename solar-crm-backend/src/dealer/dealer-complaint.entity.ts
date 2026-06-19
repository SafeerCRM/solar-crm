import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DealerComplaintStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

@Entity()
export class DealerComplaint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dealerId: number;

  @Column({ nullable: true })
  dealerOrderId: number;

  @Column({ type: 'text' })
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  photoUrls: string[];

  @Column({
    type: 'enum',
    enum: DealerComplaintStatus,
    default: DealerComplaintStatus.OPEN,
  })
  status: DealerComplaintStatus;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ type: 'text', nullable: true })
  createdByName: string;

  @Column({ type: 'text', nullable: true })
  createdByRole: string;

    @Column({ type: 'text', nullable: true })
  adminRemarks: string;

  @Column({ nullable: true })
  lastResponseBy: number;

  @Column({ type: 'text', nullable: true })
  lastResponseByName: string;

  @Column({ type: 'timestamp', nullable: true })
  lastResponseAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
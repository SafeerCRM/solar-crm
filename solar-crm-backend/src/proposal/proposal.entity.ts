import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('proposals')
export class Proposal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  calculatorId?: number;

  @Column({ nullable: true })
  meetingId?: number;

  @Column({ nullable: true })
  leadId?: number;

  @Column({ type: 'varchar', length: 150, nullable: true })
  customerName?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  customerPhone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  customerCity?: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  proposalNumber: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  finalCost?: number;

  @Column({ type: 'varchar', length: 50, default: 'CREATED' })
  status: string;

  @Column({ nullable: true })
  createdBy?: number;

  @CreateDateColumn()
  createdAt: Date;
}
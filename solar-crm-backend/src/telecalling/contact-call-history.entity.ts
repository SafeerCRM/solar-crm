import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ContactCallHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contactId: number;

  @Column({ nullable: true })
  calledBy: number;

  @Column({ nullable: true })
  calledByName: string;

  @Column({ default: 'CONNECTED' })
  callStatus: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  nextFollowUpDate?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
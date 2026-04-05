import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ContactStatus {
  NEW = 'NEW',
  CALLED = 'CALLED',
  INTERESTED = 'INTERESTED',
  REJECTED = 'REJECTED',
  CONVERTED = 'CONVERTED',
}

@Entity()
export class TelecallingContact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  kNo: string;

  @Column({ nullable: true })
  source: string;

  @Column({ nullable: true })
  assignedTo: number;

  @Column({ nullable: true })
  assignedToName: string;

  @Column({ nullable: true })
  importedBy: number;

  @Column({ nullable: true })
  importedByName: string;

  @Column({
    type: 'enum',
    enum: ContactStatus,
    default: ContactStatus.NEW,
  })
  status: ContactStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: false })
  convertedToLead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ContactStatus {
  NEW = 'NEW',
  CONVERTED = 'CONVERTED',
}

@Entity()
export class TelecallingContact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  zone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  kNo: string;

  @Column({ nullable: true })
  assignedTo: number;

  @Column({
  type: 'varchar',
  default: 'TELECALLING',
})
stage: string;

  @Column({ nullable: true })
  assignedToName: string;

  @Column({ nullable: true })
  importedBy: number;

  @Column({ nullable: true })
  importedByName: string;

  @Column({ nullable: true })
  reviewAssignedTo: number;

  @Column({ nullable: true })
  reviewAssignedToName: string;

  @Column({
    type: 'enum',
    enum: ContactStatus,
    default: ContactStatus.NEW,
  })
  status: ContactStatus;

  @Column({ default: false })
  convertedToLead: boolean;

  @Column({ default: true })
  isInStorage: boolean;

  @Column({ nullable: true, type: 'text' })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
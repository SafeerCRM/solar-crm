import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum LeadStoragePotential {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity('lead_storage')
export class LeadStorage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  alternatePhone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zone: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  address: string;

  @Column({
    type: 'enum',
    enum: LeadStoragePotential,
    default: LeadStoragePotential.LOW,
  })
  leadPotential: LeadStoragePotential;

  @Column({ nullable: true })
  source: string;

  @Column({ nullable: true, type: 'text' })
  remarks: string;

  @Column({ nullable: true })
  assignedTo: number;

  @Column({ nullable: true })
  assignedToName: string;

  @Column({ nullable: true })
  importedBy: number;

  @Column({ nullable: true })
  importedByName: string;

  @Column({ default: false })
  isConverted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
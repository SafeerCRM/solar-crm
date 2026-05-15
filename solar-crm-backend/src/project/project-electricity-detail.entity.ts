import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectElectricityStatus {
  DOCUMENT_PENDING = 'DOCUMENT_PENDING',
  FILE_SUBMITTED = 'FILE_SUBMITTED',
  SITE_VISIT_DONE = 'SITE_VISIT_DONE',
  DEMAND_DEPOSITED = 'DEMAND_DEPOSITED',
  METER_TESTING_DONE = 'METER_TESTING_DONE',
  NET_METER_INSTALLED = 'NET_METER_INSTALLED',
  CONNECTION_ACTIVE = 'CONNECTION_ACTIVE',
  REJECTED = 'REJECTED',
}

@Entity()
export class ProjectElectricityDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column({ nullable: true })
  discomName: string;

  @Column({
    type: 'enum',
    enum: ProjectElectricityStatus,
    default: ProjectElectricityStatus.DOCUMENT_PENDING,
  })
  status: ProjectElectricityStatus;

  @Column({ type: 'timestamp', nullable: true })
  fileSubmissionDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  siteVisitDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  demandDepositDate: Date;

  @Column({ type: 'float', default: 0 })
  demandDepositAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  meterTestingDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  netMeterInstallationDate: Date;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  updatedBy: number;

  @Column({ nullable: true })
  updatedByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ProjectElectricityWorkType {
  NAME_CHANGE = 'NAME_CHANGE',
  NEW_CONNECTION = 'NEW_CONNECTION',
}

export enum ProjectElectricityWorkStatus {
  DOCUMENT_PENDING = 'DOCUMENT_PENDING',
  FILE_SUBMITTED = 'FILE_SUBMITTED',
  IN_PROCESS = 'IN_PROCESS',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

@Entity('project_electricity_work')
@Index(
  'UQ_project_electricity_work_project_type',
  ['projectId', 'workType'],
  { unique: true },
)
export class ProjectElectricityWork {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  projectId: number;

  @Column({
    type: 'enum',
    enum: ProjectElectricityWorkType,
    enumName: 'project_electricity_work_type_enum',
  })
  workType: ProjectElectricityWorkType;

  @Column({
    type: 'enum',
    enum: ProjectElectricityWorkStatus,
    enumName: 'project_electricity_work_status_enum',
    default: ProjectElectricityWorkStatus.DOCUMENT_PENDING,
  })
  status: ProjectElectricityWorkStatus;

  @Column({ type: 'timestamp', nullable: true })
  applicationDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completionDate: Date | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ type: 'integer', nullable: true })
  updatedBy: number | null;

  @Column({ type: 'varchar', nullable: true })
  updatedByName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
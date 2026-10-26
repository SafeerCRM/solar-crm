import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import {
  ProjectElectricityWorkStatus,
} from './project-electricity-work.entity';

@Entity('project_solar_extension')
@Index('IDX_project_solar_extension_project', ['projectId'])
export class ProjectSolarExtension {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  projectId: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  existingCapacityKw: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  additionalCapacityKw: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  totalCapacityKw: number;

  @Column({ type: 'varchar', nullable: true })
  applicationNumber: string | null;

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
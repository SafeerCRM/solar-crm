import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectMaterialRequestType {
  LEGACY_PROCUREMENT = 'LEGACY_PROCUREMENT',
  AUTO_PROJECT_PROCUREMENT = 'AUTO_PROJECT_PROCUREMENT',
  INFORMATION_NOTE = 'INFORMATION_NOTE',
}

export enum ProjectMaterialRequestStatus {
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ISSUED = 'ISSUED',
}

@Entity()
export class ProjectMaterialRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  requestedBy: number;

  @Column({ nullable: true })
  requestedByName: string;

  @Column({ nullable: true })
  requestedByRole: string;

  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: ProjectMaterialRequestStatus,
    default: ProjectMaterialRequestStatus.SUBMITTED,
  })
  status: ProjectMaterialRequestStatus;

  @Column({
  type: 'enum',
  enum: ProjectMaterialRequestType,
  default: ProjectMaterialRequestType.LEGACY_PROCUREMENT,
})
requestType: ProjectMaterialRequestType;

@Column({
  type: 'boolean',
  default: true,
})
isProcurementActive: boolean;

@Column({
  type: 'timestamp',
  nullable: true,
})
procurementDeactivatedAt: Date;

@Column({
  type: 'text',
  nullable: true,
})
procurementDeactivationReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
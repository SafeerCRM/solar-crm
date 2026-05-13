import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
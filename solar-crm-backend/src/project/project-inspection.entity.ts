import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectInspectionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FOLLOW_UP_REQUIRED = 'FOLLOW_UP_REQUIRED',
  CANCELLED = 'CANCELLED',
}

export enum ProjectInspectionCondition {
  PASS = 'PASS',
  MINOR_DEFECT = 'MINOR_DEFECT',
  MAJOR_DEFECT = 'MAJOR_DEFECT',
  CRITICAL = 'CRITICAL',
}

@Entity()
export class ProjectInspection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column({ nullable: true })
  customerId: number;

  @Column({ nullable: true })
  customerCode: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  customerPhone: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  zone: string;

  @Column({ nullable: true })
  branchName: string;

  @Column({ nullable: true })
  projectStatus: string;

  @Column({ nullable: true })
  projectWorkState: string;

  @Column({ nullable: true })
  projectSource: string;

  @Column({ default: false })
  isLegacyProject: boolean;

  @Column({ nullable: true })
  legacyYear: number;

  @Column({ nullable: true })
  inspectionManagerId: number;

  @Column({ nullable: true })
  inspectionManagerName: string;

  @Column({ nullable: true })
  inspectionManagerRole: string;

  @Column({
    type: 'enum',
    enum: ProjectInspectionStatus,
    default: ProjectInspectionStatus.IN_PROGRESS,
  })
  status: ProjectInspectionStatus;

  @Column({
    type: 'enum',
    enum: ProjectInspectionCondition,
    default: ProjectInspectionCondition.PASS,
  })
  overallCondition: ProjectInspectionCondition;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  inspectionDate: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  startedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  completedAt: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  visitLatitude: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  visitLongitude: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  visitAddress: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  comments: string;

  @Column({ default: false })
  defectsFound: boolean;

  @Column({ default: false })
  followUpRequired: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  nextInspectionDate: Date;

  @Column({
    type: 'text',
    nullable: true,
  })
  followUpRemarks: string;

  @Column({ default: false })
  isHidden: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({ nullable: true })
  hiddenByName: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  hiddenReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
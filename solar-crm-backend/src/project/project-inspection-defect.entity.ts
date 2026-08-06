import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectInspectionComponentType {
  STRUCTURE = 'STRUCTURE',
  PILLAR = 'PILLAR',
  PANEL = 'PANEL',
  INVERTER = 'INVERTER',
  EARTHING = 'EARTHING',
  WIRING = 'WIRING',
  SOLAR_METER = 'SOLAR_METER',
  NET_METER = 'NET_METER',
  OTHER = 'OTHER',
}

export enum ProjectInspectionQualityStatus {
  GOOD = 'GOOD',
  DEFECTIVE = 'DEFECTIVE',
  NON_QUALITY = 'NON_QUALITY',
  NOT_INSPECTED = 'NOT_INSPECTED',
}

export enum ProjectInspectionSeverity {
  NONE = 'NONE',
  MINOR = 'MINOR',
  MAJOR = 'MAJOR',
  CRITICAL = 'CRITICAL',
}

export enum ProjectInspectionResolutionStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}

@Entity()
export class ProjectInspectionDefect {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  inspectionId: number;

  @Column()
  projectId: number;

  @Column({
    type: 'enum',
    enum: ProjectInspectionComponentType,
  })
  componentType: ProjectInspectionComponentType;

  @Column({
    type: 'enum',
    enum: ProjectInspectionQualityStatus,
    default:
      ProjectInspectionQualityStatus.NOT_INSPECTED,
  })
  qualityStatus: ProjectInspectionQualityStatus;

  @Column({
    type: 'enum',
    enum: ProjectInspectionSeverity,
    default: ProjectInspectionSeverity.NONE,
  })
  severity: ProjectInspectionSeverity;

  @Column({
    type: 'enum',
    enum: ProjectInspectionResolutionStatus,
    default:
      ProjectInspectionResolutionStatus.NOT_REQUIRED,
  })
  resolutionStatus: ProjectInspectionResolutionStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  remarks: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  resolutionRemarks: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  resolvedAt: Date;

  @Column({ nullable: true })
  resolvedBy: number;

  @Column({ nullable: true })
  resolvedByName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
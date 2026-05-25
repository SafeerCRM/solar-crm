import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ProjectContractorProofType {
  STRUCTURE_PHOTO = 'STRUCTURE_PHOTO',
  PILLAR_PHOTO = 'PILLAR_PHOTO',
  PANEL_SERIAL_NUMBER_PHOTO = 'PANEL_SERIAL_NUMBER_PHOTO',
  INVERTER_PHOTO = 'INVERTER_PHOTO',
  SOLAR_METER_PHOTO = 'SOLAR_METER_PHOTO',
  NET_METER_PHOTO = 'NET_METER_PHOTO',
  EARTHING_WITH_CLIENT_PHOTO = 'EARTHING_WITH_CLIENT_PHOTO',
  PANEL_WITH_CLIENT_PHOTO = 'PANEL_WITH_CLIENT_PHOTO',
  OTHER = 'OTHER',
}

@Entity()
export class ProjectContractorProof {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column()
  assignmentId: number;

  @Column({
    type: 'enum',
    enum: ProjectContractorProofType,
    default: ProjectContractorProofType.OTHER,
  })
  proofType: ProjectContractorProofType;

  @Column({ type: 'text' })
  fileUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'text', nullable: true })
  gpsAddress: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  uploadedBy: number;

  @Column({ type: 'text', nullable: true })
  uploadedByName: string;

  @CreateDateColumn()
  createdAt: Date;
}
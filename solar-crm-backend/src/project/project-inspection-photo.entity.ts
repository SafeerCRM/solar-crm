import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import {
  ProjectInspectionComponentType,
} from './project-inspection-defect.entity';

@Entity()
export class ProjectInspectionPhoto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  inspectionId: number;

  @Column({ nullable: true })
  defectId: number;

  @Column()
  projectId: number;

  @Column({
    type: 'enum',
    enum: ProjectInspectionComponentType,
  })
  componentType: ProjectInspectionComponentType;

  @Column({
    type: 'text',
  })
  fileUrl: string;

  @Column({
    nullable: true,
  })
  fileName: string;

  @Column({
    nullable: true,
  })
  fileSize: number;

  @Column({
    nullable: true,
  })
  mimeType: string;

  @Column({
    nullable: true,
  })
  filePath: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  remarks: string;

  @Column({ nullable: true })
  uploadedBy: number;

  @Column({ nullable: true })
  uploadedByName: string;

  @Column({ nullable: true })
  uploadedByRole: string;

  @CreateDateColumn()
  createdAt: Date;
}
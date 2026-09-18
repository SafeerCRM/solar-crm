import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectInspectionRemainingMaterial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  inspectionId: number;

  @Column()
  projectId: number;

  @Column({
    type: 'text',
  })
  notes: string;

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  photoUrls: string[];

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  photoPaths: string[];

  @Column({ nullable: true })
  reportedBy: number;

  @Column({ nullable: true })
  reportedByName: string;

  @Column({ nullable: true })
  reportedByRole: string;

  @Column({ default: false })
  isHidden: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  hiddenAt: Date;

  @Column({ nullable: true })
  hiddenBy: number;

  @Column({
    type: 'text',
    nullable: true,
  })
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
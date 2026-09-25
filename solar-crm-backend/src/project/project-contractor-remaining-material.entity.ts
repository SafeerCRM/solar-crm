import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ProjectContractorRemainingMaterial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column()
  assignmentId: number;

  @Column()
  contractorId: number;

  @Column({ type: 'text', nullable: true })
  contractorName: string;

  @Column({ type: 'text' })
  notes: string;

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  photoUrls: string[];

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  photoPaths: string[];

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  latitude: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  longitude: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  gpsAddress: string;

  @Column({ nullable: true })
  reportedBy: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  reportedByName: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  reportedByRole: string;

  @Column({ default: false })
  isHidden: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}